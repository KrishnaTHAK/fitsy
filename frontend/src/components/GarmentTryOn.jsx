import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Upload, X, Sparkles, CheckCircle2, ShieldCheck, Download, ShoppingBag, ArrowRight, UserCheck, Eye, Layers } from 'lucide-react';
import { warpImageQuad } from '../utils/triangleWarp';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { estimateBodyPositionSAM2, generateTryOnNeural, processTryOnModalCloud } from '../services/tryOnService';

const L = { lShoulder: 11, rShoulder: 12, lHip: 23, rHip: 24 };
const GARMENT_SRC = { top: 0.08, bottom: 0.92, halfWidth: 0.34 };

const SAMPLE_MODELS = [
  { id: 'm1', name: 'Studio Model A (Female)', gender: 'Female', height: "5'9\"", size: 'M', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80' },
  { id: 'm2', name: 'Studio Model B (Male)', gender: 'Male', height: "6'1\"", size: 'L', img: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80' },
  { id: 'm3', name: 'Studio Model C (Full Body)', gender: 'Female', height: "5'10\"", size: 'S', img: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=800&q=80' },
];

async function loadImage(src) {
  const img = new Image();
  if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
    img.crossOrigin = 'anonymous';
  }
  img.src = src;
  await img.decode();
  return img;
}

// Downscaled JPEG data-URL for the backend payload (pose is normalized, so a
// smaller image is faster and still accurate; full-res photo stays for canvas).
function toDataUrlScaled(img, max = 1024) {
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * s);
  const h = Math.round(img.naturalHeight * s);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.9);
}

// Remove a plain product-shot background by flood-filling inward from the
// image borders: only pixels *connected to the edge* and close to the corner
// color are cleared. This keeps the garment intact even when its color is
// similar to the background (a global color key would delete the shirt too).
// ponytail: edge flood-fill — good for flat/studio backgrounds; on-model or
// cluttered garment photos still need cutout PNGs or a segmentation model.
function cutoutBackground(img) {
  const c = document.createElement('canvas');
  const W = (c.width = img.naturalWidth);
  const H = (c.height = img.naturalHeight);
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, W, H);
  const p = d.data;

  // Reference background color = average of the 4 corners.
  const corners = [0, (W - 1) * 4, (H - 1) * W * 4, (W * H - 1) * 4];
  let br = 0, bg = 0, bb = 0;
  for (const i of corners) { br += p[i]; bg += p[i + 1]; bb += p[i + 2]; }
  br /= 4; bg /= 4; bb /= 4;

  const TOL2 = 60 * 60; // squared euclidean distance threshold
  const near = (i) => {
    const dr = p[i] - br, dg = p[i + 1] - bg, db = p[i + 2] - bb;
    return dr * dr + dg * dg + db * db < TOL2;
  };

  const visited = new Uint8Array(W * H);
  const stack = [];
  const seed = (px) => { if (!visited[px] && near(px * 4)) { visited[px] = 1; stack.push(px); } };
  for (let xi = 0; xi < W; xi++) { seed(xi); seed((H - 1) * W + xi); }
  for (let yi = 0; yi < H; yi++) { seed(yi * W); seed(yi * W + W - 1); }

  while (stack.length) {
    const px = stack.pop();
    p[px * 4 + 3] = 0; // clear alpha: this is background
    const py = (px / W) | 0, pxCol = px % W;
    if (pxCol > 0) seed(px - 1);
    if (pxCol < W - 1) seed(px + 1);
    if (py > 0) seed(px - W);
    if (py < H - 1) seed(px + W);
  }

  x.putImageData(d, 0, 0);
  return c;
}

function torsoQuad(lm, w, h, fit) {
  const p = (i) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const ls = p(L.lShoulder);
  const rs = p(L.rShoulder);
  const lh = p(L.lHip);
  const rh = p(L.rHip);

  const shoulderMid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
  const hipMid = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };

  const axis = { x: hipMid.x - shoulderMid.x, y: hipMid.y - shoulderMid.y };
  const len = Math.hypot(axis.x, axis.y) || 1;
  const up = { x: axis.x / len, y: axis.y / len };
  const side = { x: -up.y, y: up.x };

  const shoulderW = Math.hypot(rs.x - ls.x, rs.y - ls.y);
  const halfW = (shoulderW / 2) * fit.widen;
  const top = {
    x: shoulderMid.x - up.x * len * 0.12 + up.x * fit.offsetY,
    y: shoulderMid.y - up.y * len * 0.12 + up.y * fit.offsetY,
  };
  const bottom = {
    x: shoulderMid.x + up.x * len * fit.lengthen + up.x * fit.offsetY,
    y: shoulderMid.y + up.y * len * fit.lengthen + up.y * fit.offsetY,
  };

  const TL = { x: top.x - side.x * halfW, y: top.y - side.y * halfW };
  const TR = { x: top.x + side.x * halfW, y: top.y + side.y * halfW };
  const BR = { x: bottom.x + side.x * halfW, y: bottom.y + side.y * halfW };
  const BL = { x: bottom.x - side.x * halfW, y: bottom.y - side.y * halfW };
  return [
    [TL.x, TL.y],
    [TR.x, TR.y],
    [BR.x, BR.y],
    [BL.x, BL.y],
  ];
}

export default function GarmentTryOn({ product, onClose }) {
  const { addToCart } = useStore();
  const { isAuthenticated } = useAuth();

  const canvasRef = useRef(null);
  const photoRef = useRef(null);
  const landmarksRef = useRef(null);
  const garmentRef = useRef(null);
  const samMaskImgRef = useRef(null);
  const resultImgRef = useRef(null); // neural VTON output image

  const [step, setStep] = useState(1); // 1: Upload/Select -> 2: Generating -> 3: Result
  const [status, setStatus] = useState('idle'); // idle | detecting | ready | error
  const [progress, setProgress] = useState(0);
  const [genMessage, setGenMessage] = useState('Analyzing body posture on Python backend...');
  const [errorMessage, setErrorMessage] = useState('');
  const [fit, setFit] = useState({ widen: 1.15, lengthen: 1.35, offsetY: 0 });
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'M');
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [sam2Result, setSam2Result] = useState(null);
  const [showSamMask, setShowSamMask] = useState(false);
  const [renderMode, setRenderMode] = useState('geometric'); // 'neural' | 'geometric'

  useEffect(() => {
    if (status !== 'ready' || step !== 3) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Neural mode: the Modal GPU already produced the worn-garment image — just
    // draw it. No warp/mask compositing needed.
    if (renderMode === 'neural' && resultImgRef.current) {
      const img = resultImgRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(img, 0, 0);
      return;
    }

    const photo = photoRef.current;
    const lm = landmarksRef.current;
    const garment = garmentRef.current;
    if (!photo || !lm || !garment) return;

    canvas.width = photo.naturalWidth;
    canvas.height = photo.naturalHeight;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(photo, 0, 0);

    const gw = garment.naturalWidth;
    const gh = garment.naturalHeight;
    const src = [
      [gw * (0.5 - GARMENT_SRC.halfWidth), gh * GARMENT_SRC.top],
      [gw * (0.5 + GARMENT_SRC.halfWidth), gh * GARMENT_SRC.top],
      [gw * (0.5 + GARMENT_SRC.halfWidth), gh * GARMENT_SRC.bottom],
      [gw * (0.5 - GARMENT_SRC.halfWidth), gh * GARMENT_SRC.bottom],
    ];
    const dst = torsoQuad(lm, canvas.width, canvas.height, fit);

    // Warp the (background-removed) garment onto an offscreen layer, then clip
    // it to the real body silhouette so it follows the body instead of sitting
    // as a rectangle. Mask = person opaque, background transparent (from backend).
    const layer = document.createElement('canvas');
    layer.width = canvas.width;
    layer.height = canvas.height;
    const lctx = layer.getContext('2d');
    warpImageQuad(lctx, garment, src, dst);

    if (samMaskImgRef.current) {
      lctx.globalCompositeOperation = 'destination-in';
      lctx.drawImage(samMaskImgRef.current, 0, 0, canvas.width, canvas.height);
      lctx.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(layer, 0, 0);

    // Optional: show the raw body mask as a translucent overlay for inspection.
    if (showSamMask && samMaskImgRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.drawImage(samMaskImgRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }, [status, step, fit, showSamMask, renderMode]);

  async function processImage(photoSrc) {
    setStep(2);
    setStatus('detecting');
    setProgress(15);
    setGenMessage('Connecting to pose & segmentation backend...');
    setErrorMessage('');
    setSam2Result(null);

    try {
      const photo = await loadImage(photoSrc);
      photoRef.current = photo;
      const garmentImg = await loadImage(product.image);
      garmentRef.current = cutoutBackground(garmentImg);

      setProgress(40);
      setGenMessage('Estimating body pose & silhouette on Python backend...');

      // Send a real (downscaled base64) image to the Python backend — the
      // backend measures the actual pose from pixels, not client-side guesses.
      // Best-effort: powers the metrics panel and the geometric fallback pose.
      let samData = null;
      let backendMsg = '';
      try {
        samData = await estimateBodyPositionSAM2(toDataUrlScaled(photo));
        setSam2Result(samData);

        if (samData.maskBase64) {
          samMaskImgRef.current = await loadImage(samData.maskBase64);
        }
      } catch (backendErr) {
        backendMsg = backendErr?.message || String(backendErr);
        console.warn('Backend pose estimation error:', backendErr);
      }

      // Try the neural engine first (photorealistic). It runs its own pose on
      // the GPU, so it can succeed even if local MediaPipe above did not.
      setProgress(65);
      setGenMessage('Generating photorealistic try-on on GPU...');
      const category = product?.vtoType === 'lower-body' ? 'lower_body' : 'upper_body';
      let neuralImage = null;
      try {
        neuralImage = await generateTryOnNeural({
          human: toDataUrlScaled(photo),
          garment: toDataUrlScaled(garmentImg),
          category,
        });
      } catch (neuralErr) {
        console.warn('Neural VTON unavailable, falling back to geometric warp:', neuralErr);
      }

      if (neuralImage) {
        resultImgRef.current = await loadImage(neuralImage);
        setRenderMode('neural');
        setProgress(100);
        setTimeout(() => {
          setStatus('ready');
          setStep(3);
        }, 300);
        return;
      }

      // ── Geometric fallback: requires measured pose landmarks ──────────────
      setRenderMode('geometric');
      if (!samData?.landmarks) {
        setStatus('error');
        setStep(1);
        setErrorMessage(
          backendMsg
            ? `Backend: ${backendMsg}`
            : 'Backend could not detect a body in this photo. Please try a clear, front-facing portrait.'
        );
        return;
      }

      // Use the backend-measured (normalized) pose landmarks as the single
      // source of truth for the warp.
      landmarksRef.current = samData.landmarks;

      setProgress(75);
      setGenMessage('Warping garment onto measured body contour...');

      const lm = landmarksRef.current;
      if (!lm[L.lShoulder] || !lm[L.lHip]) {
        setStatus('error');
        setStep(1);
        setErrorMessage('Backend detected no visible torso. Please choose a front-facing portrait.');
        return;
      }

      setProgress(100);

      setTimeout(() => {
        setStatus('ready');
        setStep(3);
      }, 500);
    } catch (err) {
      console.error('Try-on processing error:', err);
      setStatus('error');
      setStep(1);
      setErrorMessage('Failed to process image. Please try another photo or studio model.');
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSelectSampleModel(modelImg) {
    processImage(modelImg);
  }

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `FITSY-Virtual-TryOn-${product.name.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function handleAddToCartLook() {
    if (!isAuthenticated) {
      alert('Please sign in to save outfit to cart.');
      return;
    }
    await addToCart({ product, size: selectedSize });
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 3000);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-surface border border-outline-variant/50 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-on-surface my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">FITSY AI Virtual Fitting Room</h3>
              <p className="text-xs text-on-surface-variant">Real-Time Garment Overlay &amp; Fit Analysis</p>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold">
            <span className={`px-3 py-1 rounded-full ${step === 1 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
              1. Photo
            </span>
            <span>&rarr;</span>
            <span className={`px-3 py-1 rounded-full ${step === 2 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
              2. Render
            </span>
            <span>&rarr;</span>
            <span className={`px-3 py-1 rounded-full ${step === 3 ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}>
              3. Result
            </span>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload Photo or Select Sample Model */}
          {step === 1 && (
            <div className="space-y-8">
              {errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 text-xs font-semibold">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Selected Product Banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
                <img src={product.image} alt={product.name} className="w-16 h-16 rounded-xl object-cover border border-outline-variant/30" />
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Selected Garment</span>
                  <h4 className="font-bold text-sm text-on-surface">{product.name}</h4>
                  <p className="text-xs text-on-surface-variant">${product.price} • {product.category}</p>
                </div>
              </div>

              {/* Photo Upload Zone */}
              <div className="border-2 border-dashed border-primary/40 rounded-3xl p-8 text-center bg-surface-container-lowest hover:border-primary transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-base text-on-surface">Drag &amp; Drop or Click to Upload Your Photo</h4>
                <p className="text-xs text-on-surface-variant mt-1">
                  For optimal results, upload a clear, front-facing portrait or full-body picture.
                </p>
              </div>

              {/* Sample Studio Models Selector */}
              <div>
                <h4 className="font-bold text-sm text-on-surface mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" /> Don't have a photo? Select a Studio Model
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {SAMPLE_MODELS.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => handleSelectSampleModel(model.img)}
                      className="group cursor-pointer rounded-2xl border border-outline-variant/40 bg-surface overflow-hidden hover:border-primary hover:shadow-lg transition-all"
                    >
                      <div className="aspect-[3/4] bg-surface-container overflow-hidden relative">
                        <img src={model.img} alt={model.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                          <p className="font-bold text-xs">{model.name}</p>
                          <p className="text-[10px] text-white/80">{model.gender} • Height {model.height}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Generating AI Look Loader */}
          {step === 2 && (
            <div className="py-16 text-center flex flex-col items-center justify-center space-y-6">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-on-surface">Generating Your Virtual Look...</h3>
                <p className="text-xs text-on-surface-variant mt-1">{genMessage}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-md bg-surface-container rounded-full h-2 overflow-hidden border border-outline-variant/30">
                <div className="bg-primary h-full transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>

              <p className="text-xs text-primary font-bold">{progress}% Complete</p>
            </div>
          )}

          {/* Step 3: Virtual Try-On Result */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Canvas Render View */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="relative rounded-3xl overflow-hidden border-2 border-primary/30 shadow-2xl bg-black max-h-[500px] flex items-center justify-center group w-full">
                  <canvas ref={canvasRef} className="max-w-full max-h-[500px] object-contain" />
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {sam2Result?.fitMetrics?.poseVisibility != null
                      ? `${(sam2Result.fitMetrics.poseVisibility * 100).toFixed(0)}% Pose Confidence`
                      : 'Pose Detected'}
                  </div>

                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    {renderMode === 'neural' ? 'Neural GPU Try-On' : 'Geometric Warp (Fallback)'}
                  </div>

                  {/* Body Mask Toggle Button Overlay (geometric mode only) */}
                  {renderMode === 'geometric' && (
                    <button
                      onClick={() => setShowSamMask(!showSamMask)}
                      className="absolute bottom-4 left-4 right-4 sm:left-auto bg-black/80 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl backdrop-blur-md border border-cyan-500/40 shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-cyan-400" />
                      {showSamMask ? 'Hide Body Silhouette Mask' : 'Show Body Silhouette Mask'}
                    </button>
                  )}
                </div>
              </div>

              {/* Analysis & Controls Panel */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                  <h4 className="font-bold text-sm text-on-surface flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Fit &amp; Pose Analysis
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Estimation Engine</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 text-right">
                        {sam2Result?.engine || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Shoulder Span</span>
                      <span className="font-bold text-emerald-600">
                        {sam2Result?.fitMetrics?.shoulderSpanPx != null ? `${sam2Result.fitMetrics.shoulderSpanPx}px` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-outline-variant/20">
                      <span className="text-on-surface-variant">Body Coverage</span>
                      <span className="font-bold text-emerald-600">
                        {sam2Result?.fitMetrics?.bodyCoverage != null ? `${(sam2Result.fitMetrics.bodyCoverage * 100).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-on-surface-variant">Pose Visibility</span>
                      <span className="font-bold text-primary">
                        {sam2Result?.fitMetrics?.poseVisibility != null ? `${(sam2Result.fitMetrics.poseVisibility * 100).toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fine-Tuning Sliders (geometric warp only) */}
                {renderMode === 'geometric' && (
                <div className="p-4 rounded-2xl bg-surface border border-outline-variant/40 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-on-surface">Fine-Tune Garment Position</h5>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Width Scale</span>
                        <span className="font-bold text-primary">{fit.widen.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.8"
                        max="1.6"
                        step="0.02"
                        value={fit.widen}
                        onChange={(e) => setFit((f) => ({ ...f, widen: Number(e.target.value) }))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Length Scale</span>
                        <span className="font-bold text-primary">{fit.lengthen.toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.9"
                        max="2.0"
                        step="0.02"
                        value={fit.lengthen}
                        onChange={(e) => setFit((f) => ({ ...f, lengthen: Number(e.target.value) }))}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleAddToCartLook}
                    className="w-full py-3.5 rounded-full bg-primary text-white font-bold text-sm shadow-lg hover:bg-primary-container flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add Outfit to Bag (${product.price})
                  </button>

                  {addedSuccess && (
                    <p className="text-xs text-emerald-600 font-bold text-center">
                      ✓ Outfit added to your bag!
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownload}
                      className="py-2.5 rounded-full bg-surface border border-outline-variant text-on-surface font-bold text-xs hover:border-primary flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Look
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="py-2.5 rounded-full bg-surface border border-outline-variant text-on-surface font-bold text-xs hover:border-primary flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Change Photo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

