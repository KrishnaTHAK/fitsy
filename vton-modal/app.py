#!/usr/bin/env python3
"""
Modal Labs — FLUX.2 Klein 9B + Virtual Try-On LoRA (Pure Serverless)

Model: black-forest-labs/FLUX.2-klein-9B
LoRA:  fal/flux-klein-9b-virtual-tryon-lora
GPU:   L40S-48GB (~30GB VRAM for 9B model in bf16)

PURE SERVERLESS — $0 idle cost:
  - No warm containers (min_containers=0)
  - GPU memory snapshot (alpha) for fast cold boots.
"""

import modal
import base64
import asyncio
from io import BytesIO
from typing import Optional

app = modal.App("fitsy-vton")

MODEL_ID = "black-forest-labs/FLUX.2-klein-9B"
DEFAULT_STEPS = 28
MAX_STEPS = 30
DEFAULT_GUIDANCE = 2.5

# Virtual Try-On LoRA
LORA_REPO = "fal/flux-klein-9b-virtual-tryon-lora"
LORA_FILE = "flux-klein-tryon.safetensors"
LORA_SCALE = 1.0


def download_models():
    from diffusers import Flux2KleinPipeline
    from huggingface_hub import hf_hub_download
    import torch

    print(f"[Build] Downloading {MODEL_ID}...")
    pipe = Flux2KleinPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.bfloat16,
    )
    print(f"[Build] ✓ {MODEL_ID} downloaded")
    del pipe

    print(f"[Build] Downloading Try-On LoRA: {LORA_REPO}...")
    hf_hub_download(LORA_REPO, LORA_FILE)
    print(f"[Build] ✓ Try-On LoRA downloaded")


gpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("libgl1-mesa-glx", "libglib2.0-0", "git")
    .pip_install(
        "torch>=2.5.0",
        "torchvision>=0.20.0",
        "transformers>=4.53.0",
        "accelerate>=0.30.0",
        "safetensors>=0.4.0",
        "pillow>=10.0.0",
        "numpy>=1.24.0",
        "huggingface_hub>=0.25.0",
        "fastapi[standard]",
        "pydantic>=2.0",
        "sentencepiece",
        "protobuf",
        "peft>=0.11.0",
        "requests",
        "git+https://github.com/huggingface/diffusers.git",
    )
    .run_function(
        download_models,
        secrets=[modal.Secret.from_name("huggingface")]
    )
)

def build_prompt(human_desc: str, top_desc: str, bottom_desc: str) -> str:
    if not human_desc:
        human_desc = "person, standing casually"
    if not top_desc:
        top_desc = "the same top"
    if not bottom_desc:
        bottom_desc = "the same pants"
        
    return f"TRYON {human_desc}. Replace the outfit with {top_desc} and {bottom_desc} as shown in the reference images. The final image is a full body shot."


# ─── GPU Inference (Pure Serverless) ──────────────────────────────────────────

@app.cls(
    gpu="L40S",
    image=gpu_image,
    enable_memory_snapshot=True,
    experimental_options={"enable_gpu_snapshot": True},
    scaledown_window=300,
    timeout=600,
    max_containers=4,
    secrets=[modal.Secret.from_name("huggingface")],
)
class FluxKlein9BTryOn:

    @modal.enter(snap=True)
    def load(self):
        from diffusers import Flux2KleinPipeline
        from PIL import Image as PILImage
        import torch
        import time

        t0 = time.time()
        print(f"[Snap] Loading {MODEL_ID} (Klein 9B) → GPU...")
        self.pipe = Flux2KleinPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat16,
            local_files_only=True,
        )

        print(f"[Snap] Loading Try-On LoRA: {LORA_REPO}...")
        self.pipe.load_lora_weights(
            LORA_REPO,
            weight_name=LORA_FILE,
            adapter_name="tryon",
            local_files_only=True,
        )
        self.pipe.set_adapters(["tryon"], adapter_weights=[LORA_SCALE])

        self.pipe = self.pipe.to("cuda")

        # Warmup (1024x1024)
        dummy = PILImage.new("RGB", (1024, 1024), (128, 128, 128))
        gen = torch.Generator(device="cuda").manual_seed(0)
        with torch.no_grad():
            _ = self.pipe(
                prompt="TRYON warmup person",
                image=[dummy, dummy, dummy], # 3 images for try-on
                height=1024,
                width=1024,
                num_inference_steps=4,
                guidance_scale=1.0,
                generator=gen,
            )
        torch.cuda.empty_cache()
        vram = torch.cuda.max_memory_allocated() / 1e9
        print(f"[Snap] ✓ model on GPU + warmed in {time.time() - t0:.1f}s, peak VRAM: {vram:.1f}GB")

    @modal.enter(snap=False)
    def restore(self):
        import torch
        print(f"[Boot] ✓ restored from GPU snapshot, cuda={torch.cuda.is_available()}")

    @staticmethod
    def _resize(image, max_dim=1024):
        from PIL import Image as PILImage
        w, h = image.size
        if max(w, h) <= max_dim:
            new_w = w - (w % 16)
            new_h = h - (h % 16)
            if new_w != w or new_h != h:
                return image.resize((new_w, new_h), PILImage.Resampling.LANCZOS)
            return image
        scale = max_dim / max(w, h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        new_w = new_w - (new_w % 16)
        new_h = new_h - (new_h % 16)
        return image.resize((new_w, new_h), PILImage.Resampling.LANCZOS)

    @modal.method()
    def generate(
        self,
        human_b64: str,
        top_b64: str,
        bottom_b64: str,
        human_desc: str,
        top_desc: str,
        bottom_desc: str,
        num_inference_steps: int = DEFAULT_STEPS,
        guidance_scale: float = DEFAULT_GUIDANCE,
        seed: Optional[int] = None
    ) -> dict:
        from PIL import Image as PILImage
        import torch
        import random
        import time
        import gc

        def load_img(b64):
            return PILImage.open(BytesIO(base64.b64decode(b64))).convert("RGB")

        img_human = self._resize(load_img(human_b64), max_dim=1024)
        img_top = self._resize(load_img(top_b64), max_dim=1024)
        img_bottom = self._resize(load_img(bottom_b64), max_dim=1024)
        
        w, h = img_human.size
        img_top = img_top.resize((w, h))
        img_bottom = img_bottom.resize((w, h))

        prompt = build_prompt(human_desc, top_desc, bottom_desc)

        total_steps = max(1, min(num_inference_steps, MAX_STEPS))

        if seed is None or seed < 0:
            seed = random.randint(0, 2**32 - 1)
        gen = torch.Generator(device="cuda").manual_seed(seed)

        print(f"Try-On 9B: {w}x{h} steps={total_steps} cfg={guidance_scale} seed={seed}")
        print(f"Prompt: {prompt}")

        t0 = time.time()
        
        images_input = [img_human, img_top, img_bottom]

        try:
            with torch.no_grad():
                result = self.pipe(
                    prompt=prompt,
                    image=images_input,
                    height=h,
                    width=w,
                    num_inference_steps=total_steps,
                    guidance_scale=guidance_scale,
                    generator=gen,
                )
            out = result.images[0]
        except RuntimeError as e:
            if "out of memory" in str(e).lower():
                print(f"[OOM] Retrying at 768px (was {w}x{h})...")
                gc.collect()
                torch.cuda.empty_cache()

                img_human = self._resize(img_human, max_dim=768)
                w, h = img_human.size
                img_top = img_top.resize((w, h))
                img_bottom = img_bottom.resize((w, h))
                
                images_input = [img_human, img_top, img_bottom]
                gen = torch.Generator(device="cuda").manual_seed(seed)

                with torch.no_grad():
                    result = self.pipe(
                        prompt=prompt,
                        image=images_input,
                        height=h,
                        width=w,
                        num_inference_steps=total_steps,
                        guidance_scale=guidance_scale,
                        generator=gen,
                    )
                out = result.images[0]
            else:
                raise

        elapsed = time.time() - t0
        print(f"✓ Done in {elapsed:.1f}s → {out.size[0]}x{out.size[1]}")

        buf = BytesIO()
        out.save(buf, format="JPEG", quality=90)
        img_str = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "image": img_str,
            "seed": seed,
            "width": out.size[0],
            "height": out.size[1],
            "generation_time_ms": int(elapsed * 1000),
            "prompt_used": prompt,
        }


# ─── FastAPI Endpoint ────────────────────────────────────────────────────────

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import requests

fastapi_app = FastAPI()


class GenerateRequest(BaseModel):
    human: str
    garment: str
    category: str = "upper_body"  # upper_body, lower_body, dresses
    human_desc: str = ""
    garment_desc: str = ""
    steps: Optional[int] = DEFAULT_STEPS
    guidance_scale: Optional[float] = DEFAULT_GUIDANCE
    seed: Optional[int] = None


def fetch_image_b64(source: str) -> str:
    if source.startswith("http"):
        resp = requests.get(source, timeout=10)
        resp.raise_for_status()
        return base64.b64encode(resp.content).decode("utf-8")
    if source.startswith("data:"):
        return source.split(",", 1)[1]
    return source

def create_blank_b64() -> str:
    from PIL import Image as PILImage
    img = PILImage.new("RGB", (768, 1024), (255, 255, 255))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


@fastapi_app.post("/generate")
async def generate_endpoint(req: GenerateRequest):
    try:
        human_b64 = fetch_image_b64(req.human)
        garment_b64 = fetch_image_b64(req.garment)
        
        # Determine top/bottom based on category
        blank_b64 = create_blank_b64()
        
        if req.category in ["upper_body", "dresses"]:
            top_b64 = garment_b64
            bottom_b64 = blank_b64
            top_desc = req.garment_desc if req.garment_desc else "a stylish top"
            bottom_desc = "basic pants"
        elif req.category == "lower_body":
            top_b64 = blank_b64
            bottom_b64 = garment_b64
            top_desc = "a basic top"
            bottom_desc = req.garment_desc if req.garment_desc else "stylish pants"
        else:
            # fallback
            top_b64 = garment_b64
            bottom_b64 = blank_b64
            top_desc = "a stylish top"
            bottom_desc = "basic pants"

        model = FluxKlein9BTryOn()
        result = model.generate.remote(
            human_b64=human_b64,
            top_b64=top_b64,
            bottom_b64=bottom_b64,
            human_desc=req.human_desc,
            top_desc=top_desc,
            bottom_desc=bottom_desc,
            num_inference_steps=req.steps,
            guidance_scale=req.guidance_scale,
            seed=req.seed
        )

        return {
            "success": True,
            "image": "data:image/jpeg;base64," + result["image"],
            "seed": result.get("seed", 0),
            "width": result.get("width", 0),
            "height": result.get("height", 0),
            "generation_time_ms": result.get("generation_time_ms", 0),
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@fastapi_app.get("/health")
async def health():
    return {"status": "healthy", "model": "FLUX.2-klein-9B-VTON", "gpu": "L40S"}


@app.function(
    image=gpu_image,
    timeout=600,
    scaledown_window=60,
)
@modal.concurrent(max_inputs=20)
@modal.asgi_app()
def asgi_app():
    return fastapi_app
