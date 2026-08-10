import os, modal
app = modal.App("test-vol")
vol = modal.Volume.from_name("fitsy-vton-weights")
@app.function(volumes={"/weights": vol})
def test():
    print("UNET DIR:", os.listdir("/weights/IDM-VTON/unet"))
    print("BIN EXISTS:", os.path.exists("/weights/IDM-VTON/unet/diffusion_pytorch_model.bin"))
    print("SAF TENSORS EXISTS:", os.path.exists("/weights/IDM-VTON/unet/diffusion_pytorch_model.safetensors"))
