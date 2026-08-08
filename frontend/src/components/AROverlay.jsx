import { useEffect, useMemo, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { AlertCircle, Camera, Maximize2, RefreshCw, Share2, X } from 'lucide-react';
import aviatorOverlay from '../assets/vto/aviator-overlay.svg';
import catEyeOverlay from '../assets/vto/cat-eye-overlay.svg';
import clearOverlay from '../assets/vto/clear-overlay.svg';
import ovalOverlay from '../assets/vto/oval-overlay.svg';
import roundOverlay from '../assets/vto/round-overlay.svg';
import shieldOverlay from '../assets/vto/shield-overlay.svg';
import squareOverlay from '../assets/vto/square-overlay.svg';
import wayfarerOverlay from '../assets/vto/wayfarer-overlay.svg';
import ProductImage from './ProductImage';

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
const FACE_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const GLASSES_OVERLAY_MAP = {
  aviator: aviatorOverlay,
  catEye: catEyeOverlay,
  clear: clearOverlay,
  oval: ovalOverlay,
  round: roundOverlay,
  shield: shieldOverlay,
  square: squareOverlay,
  wayfarer: wayfarerOverlay,
};
const DEFAULT_GLASSES_FIT = {
  overlayKey: 'wayfarer',
  widthMultiplier: 1.1,
  bridgeOffsetY: 0,
};

export default function AROverlay({ onClose, product }) {
  const videoRef = useRef(null);
  const stageRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const previousStyleRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Initializing camera...');
  const [isMirrored, setIsMirrored] = useState(true);
  const [trackedStyle, setTrackedStyle] = useState(null);

  const isFaceTrackingProduct = product.category === 'Glasses';
  const glassesFit = product.tryOn || DEFAULT_GLASSES_FIT;
  const overlayClassName = useMemo(
    () => `ar-product ar-product--${product.vtoType || 'default'}`,
    [product.vtoType],
  );
  const overlaySrc = isFaceTrackingProduct
    ? GLASSES_OVERLAY_MAP[glassesFit.overlayKey] || wayfarerOverlay
    : product.image;

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (isMounted) {
          setStatus('fallback');
          setMessage('Camera preview is not supported on this device. Showing guided preview mode instead.');
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (isFaceTrackingProduct) {
          await startFaceTracking();
        }

        if (isMounted) {
          setStatus('ready');
          setMessage(
            isFaceTrackingProduct
              ? 'Face tracking is live. Move your head naturally to preview the glasses fit.'
              : 'Camera is live. Adjust your position for the best fit.',
          );
        }
      } catch (error) {
        if (isMounted) {
          setStatus('fallback');
          setMessage(
            error?.name === 'NotAllowedError'
              ? 'Camera permission was denied. You can still inspect alignment in preview mode.'
              : 'Unable to access the camera right now. Preview mode is available as a fallback.',
          );
        }
      }
    }

    async function startFaceTracking() {
      try {
        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          },
          outputFaceBlendshapes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        startDetectionLoop();
      } catch (error) {
        setMessage('Camera is live, but face tracking could not start. Falling back to guided preview.');
      }
    }

    function startDetectionLoop() {
      const detect = () => {
        const videoElement = videoRef.current;
        const stageElement = stageRef.current;
        const faceLandmarker = landmarkerRef.current;

        if (!videoElement || !stageElement || !faceLandmarker) {
          animationFrameRef.current = requestAnimationFrame(detect);
          return;
        }

        if (videoElement.readyState >= 2 && lastVideoTimeRef.current !== videoElement.currentTime) {
          const result = faceLandmarker.detectForVideo(videoElement, performance.now());
          updateTrackedOverlay(result.faceLandmarks?.[0], videoElement, stageElement);
          lastVideoTimeRef.current = videoElement.currentTime;
        }

        animationFrameRef.current = requestAnimationFrame(detect);
      };

      animationFrameRef.current = requestAnimationFrame(detect);
    }

    function updateTrackedOverlay(landmarks, videoElement, stageElement) {
      if (!landmarks) {
        previousStyleRef.current = null;
        setTrackedStyle(null);
        return;
      }

      const leftTemple = landmarks[127];
      const rightTemple = landmarks[356];
      const leftEye = landmarks[33];
      const rightEye = landmarks[263];
      const noseBridge = landmarks[168];
      const forehead = landmarks[10];
      const chin = landmarks[152];

      if (!leftTemple || !rightTemple || !leftEye || !rightEye || !noseBridge || !forehead || !chin) {
        previousStyleRef.current = null;
        setTrackedStyle(null);
        return;
      }

      const videoWidth = videoElement.videoWidth || 1280;
      const videoHeight = videoElement.videoHeight || 720;
      const stageWidth = stageElement.clientWidth;
      const stageHeight = stageElement.clientHeight;

      const scale = Math.max(stageWidth / videoWidth, stageHeight / videoHeight);
      const renderedWidth = videoWidth * scale;
      const renderedHeight = videoHeight * scale;
      const offsetX = (stageWidth - renderedWidth) / 2;
      const offsetY = (stageHeight - renderedHeight) / 2;

      function toStagePoint(landmark) {
        const rawX = landmark.x * renderedWidth + offsetX;
        return {
          x: isMirrored ? stageWidth - rawX : rawX,
          y: landmark.y * renderedHeight + offsetY,
        };
      }

      const leftTemplePoint = toStagePoint(leftTemple);
      const rightTemplePoint = toStagePoint(rightTemple);
      const leftEyePoint = toStagePoint(leftEye);
      const rightEyePoint = toStagePoint(rightEye);
      const nosePoint = toStagePoint(noseBridge);
      const foreheadPoint = toStagePoint(forehead);
      const chinPoint = toStagePoint(chin);

      const faceWidth = Math.hypot(
        rightTemplePoint.x - leftTemplePoint.x,
        rightTemplePoint.y - leftTemplePoint.y,
      );
      const eyeDistance = Math.hypot(
        rightEyePoint.x - leftEyePoint.x,
        rightEyePoint.y - leftEyePoint.y,
      );
      const faceHeight = Math.abs(chinPoint.y - foreheadPoint.y);
      const centerX = (leftEyePoint.x + rightEyePoint.x) / 2;
      const centerY =
        (leftEyePoint.y + rightEyePoint.y) / 2 + faceHeight * (0.016 + (glassesFit.bridgeOffsetY || 0));
      const baseAngle = Math.atan2(
        rightEyePoint.y - leftEyePoint.y,
        rightEyePoint.x - leftEyePoint.x,
      ) * (180 / Math.PI);
      const angle = isMirrored ? -baseAngle : baseAngle;

      const hasValidFaceSize = faceWidth > stageWidth * 0.16 && faceHeight > stageHeight * 0.18;
      const hasReasonableGeometry = faceWidth / Math.max(faceHeight, 1) > 0.65 && faceWidth / Math.max(faceHeight, 1) < 1.9;
      const eyesCloseToNose = Math.abs(centerY - nosePoint.y) < faceHeight * 0.18;
      const insideStage =
        centerX > stageWidth * 0.08 &&
        centerX < stageWidth * 0.92 &&
        centerY > stageHeight * 0.12 &&
        centerY < stageHeight * 0.72;

      if (!hasValidFaceSize || !hasReasonableGeometry || !eyesCloseToNose || !insideStage || eyeDistance < 40) {
        previousStyleRef.current = null;
        setTrackedStyle(null);
        return;
      }

      const nextStyle = {
        x: centerX,
        y: centerY,
        width: Math.max(faceWidth * (glassesFit.widthMultiplier || 1.1), 170),
        angle,
      };

      const previousStyle = previousStyleRef.current;
      const smoothedStyle = previousStyle
        ? {
            x: previousStyle.x * 0.72 + nextStyle.x * 0.28,
            y: previousStyle.y * 0.72 + nextStyle.y * 0.28,
            width: previousStyle.width * 0.72 + nextStyle.width * 0.28,
            angle: previousStyle.angle * 0.72 + nextStyle.angle * 0.28,
          }
        : nextStyle;

      previousStyleRef.current = smoothedStyle;
      setTrackedStyle({
        left: `${smoothedStyle.x}px`,
        top: `${smoothedStyle.y}px`,
        width: `${smoothedStyle.width}px`,
        transform: `translate(-50%, -50%) rotate(${smoothedStyle.angle}deg)`,
      });
    }

    startCamera();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [
    glassesFit.bridgeOffsetY,
    glassesFit.overlayKey,
    glassesFit.widthMultiplier,
    isFaceTrackingProduct,
    isMirrored,
    product.image,
  ]);

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: `Trying on ${product.name}`,
        text: `Previewing ${product.name} in Fitsy virtual try-on.`,
        url: window.location.href,
      });
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(window.location.href);
      setMessage('Product link copied. Share is not supported here, so the URL was copied instead.');
      return;
    }

    setMessage('Share is not available in this browser.');
  }

  function handleRestart() {
    onClose();
    window.setTimeout(() => {
      window.location.reload();
    }, 150);
  }

  return (
    <div className="ar-overlay">
      <div className="ar-overlay__topbar">
        <div className="ar-status">
          <div className={`ar-status__dot ${status === 'ready' ? 'is-live' : ''}`}></div>
          <span>{status === 'ready' ? 'LIVE' : 'PREVIEW'}</span>
        </div>
        <button onClick={onClose} className="icon-button icon-button--ghost" type="button">
          <X size={24} />
        </button>
      </div>

      <div className="ar-stage" ref={stageRef}>
        {status === 'loading' ? (
          <div className="ar-empty-state">
            <div className="spinner"></div>
            <p>{message}</p>
          </div>
        ) : (
          <>
            {status === 'ready' ? (
              <video
                ref={videoRef}
                className={`ar-camera ${isMirrored ? 'is-mirrored' : ''}`}
                playsInline
                muted
                autoPlay
              />
            ) : (
              <div className="ar-fallback">
                <AlertCircle size={28} />
                <strong>Guided Preview Mode</strong>
                <p>{message}</p>
              </div>
            )}

            {isFaceTrackingProduct ? (
              <div
                className={`ar-product ar-product--tracked ${trackedStyle ? 'is-visible' : 'is-hidden'}`}
                style={trackedStyle || undefined}
              >
                <img src={overlaySrc} alt={`${product.name} overlay`} />
              </div>
            ) : (
              <div className={overlayClassName}>
                <img src={overlaySrc} alt={`${product.name} overlay`} />
              </div>
            )}

            <div className="ar-guide"></div>
          </>
        )}
      </div>

      <div className="ar-overlay__footer">
        <div className="ar-product-summary">
          <ProductImage product={product} src={product.image} alt={product.name} />
          <div>
            <strong>{product.name}</strong>
            <span>{message}</span>
          </div>
        </div>

        <div className="ar-actions">
          <button className="icon-button icon-button--ghost" type="button" onClick={handleShare}>
            <Share2 size={24} />
          </button>
          <button
            className="capture-button"
            type="button"
            onClick={() => setIsMirrored((currentValue) => !currentValue)}
          >
            <Camera size={28} />
          </button>
          <button className="icon-button icon-button--ghost" type="button" onClick={handleRestart}>
            <RefreshCw size={22} />
          </button>
          <button className="icon-button icon-button--ghost" type="button">
            <Maximize2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
