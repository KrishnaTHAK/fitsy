#!/usr/bin/env python3
"""
FITSY Try-On - Real body pose + person segmentation.

Reads the actual image pixels (NOT the file header) and runs MediaPipe
BlazePose with segmentation to locate the body and produce a real person
mask. No fabricated metrics: every number returned is measured from the
detected landmarks / mask.

Deps: mediapipe, numpy, pillow  (see requirements.txt).
Input: image as data-URL / http(s) URL / file path, on argv[1] or stdin.
Output: single JSON line on stdout.
"""

import sys
import json
import base64
import io

import numpy as np
from PIL import Image


def load_rgb(image_input):
    """Decode data-URL / http(s) URL / file path to an HxWx3 uint8 array."""
    if image_input.startswith("data:image"):
        raw = base64.b64decode(image_input.split(",", 1)[1])
    elif image_input.startswith(("http://", "https://")):
        import urllib.request
        req = urllib.request.Request(image_input, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read()
    else:
        with open(image_input, "rb") as f:
            raw = f.read()
    return np.asarray(Image.open(io.BytesIO(raw)).convert("RGB"))


def run(image_input):
    import mediapipe as mp  # imported here so --selfcheck works without the model

    rgb = load_rgb(image_input)
    h, w = rgb.shape[:2]

    with mp.solutions.pose.Pose(
        static_image_mode=True, model_complexity=1, enable_segmentation=True
    ) as pose:
        res = pose.process(rgb)

    if not res.pose_landmarks:
        return {"success": False, "error": "no_body_detected"}

    lms = res.pose_landmarks.landmark

    def pt(i):
        return {"x": round(lms[i].x * w, 2), "y": round(lms[i].y * h, 2),
                "v": round(lms[i].visibility, 3)}

    # Person mask -> RGBA PNG: person opaque white, background transparent,
    # so the browser can use it directly as a destination-in clip.
    seg = res.segmentation_mask  # float HxW in [0,1]
    alpha = (seg > 0.5).astype(np.uint8) * 255
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = alpha
    buf = io.BytesIO()
    Image.fromarray(rgba, "RGBA").save(buf, "PNG")
    mask_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

    shoulder_span = abs(lms[12].x - lms[11].x) * w
    coverage = float((alpha > 0).mean())
    mean_vis = float(np.mean([lms[i].visibility for i in (11, 12, 23, 24)]))

    return {
        "success": True,
        "engine": "MediaPipe BlazePose + Selfie Segmentation",
        "imageDimensions": {"width": w, "height": h},
        "poseLandmarks": {
            "leftShoulder": pt(11), "rightShoulder": pt(12),
            "leftHip": pt(23), "rightHip": pt(24), "nose": pt(0),
        },
        # normalized 0..1, indices match BlazePose (used by the frontend warp)
        "landmarks": [
            {"x": round(l.x, 5), "y": round(l.y, 5), "v": round(l.visibility, 3)}
            for l in lms
        ],
        "maskBase64": mask_b64,
        "fitMetrics": {
            "shoulderSpanPx": round(shoulder_span, 1),
            "bodyCoverage": round(coverage, 3),
            "poseVisibility": round(mean_vis, 3),
        },
    }


def _selfcheck():
    """Runnable check of the decode path (no model needed)."""
    img = Image.new("RGB", (12, 8), (10, 20, 30))
    b = io.BytesIO()
    img.save(b, "PNG")
    data_url = "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
    arr = load_rgb(data_url)
    assert arr.shape == (8, 12, 3), arr.shape
    assert tuple(arr[0, 0]) == (10, 20, 30), tuple(arr[0, 0])
    print("samSegmenter selfcheck OK")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--selfcheck":
        _selfcheck()
        sys.exit(0)

    arg = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read().strip()
    if not arg:
        print(json.dumps({"success": False, "error": "no_input"}))
        sys.exit(1)
    try:
        print(json.dumps(run(arg)))
    except Exception as e:  # surface the real reason to Node's stderr path
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
