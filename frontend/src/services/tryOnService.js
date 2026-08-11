// Relative path so calls go through the Vite dev proxy (vite.config.js) like
// the rest of the app — avoids CORS and any dev-server port mismatch.
const API_BASE_URL = 'http://localhost:5001/api/tryon';

/**
 * Sends image data to backend SAM 2 body estimation engine
 * @param {string} imageInput - Base64 image data or URL
 * @returns {Promise<Object>} SAM 2 body pose keypoints, mask, and metrics
 */
export async function estimateBodyPositionSAM2(imageInput) {
  const response = await fetch(`${API_BASE_URL}/estimate-body`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: imageInput }),
  });

  // Read as text first: if the backend crashes or the proxy returns an HTML
  // error page, response.json() throws an opaque "did not match the expected
  // pattern" SyntaxError. Parsing manually lets us surface the real reason.
  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Backend returned non-JSON (HTTP ${response.status}): ${raw.slice(0, 160) || '<empty response>'}`
    );
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || data.error || 'Failed to estimate body position.');
  }

  return data.data;
}

/**
 * Requests a photorealistic neural try-on from the backend (proxied to Modal GPU).
 * @param {Object} payload - { human, garment, category }
 * @returns {Promise<string>} base64 data-URL of the generated image
 */
export async function generateTryOnNeural({ human, garment, category }) {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ human, garment, category }),
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(
      `Backend returned non-JSON (HTTP ${response.status}): ${raw.slice(0, 160) || '<empty response>'}`
    );
  }

  if (!response.ok || !data.success || !data.data?.image) {
    throw new Error(data.error || data.message || 'Neural try-on failed.');
  }

  return data.data.image;
}

/**
 * Sends try-on request to backend SAM 2 fabric warping engine
 * @param {Object} payload - { userImage, garmentImage, fit }
 */
export async function processTryOnSAM2(payload) {
  const response = await fetch(`${API_BASE_URL}/process-tryon`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to process virtual try-on with SAM 2 backend.');
  }

  return data.data;
}

/**
 * Sends try-on request to Hugging Face model hosted on Modal Labs Cloud GPU
 * @param {Object} payload - { personImage, garmentImage, garmentType }
 */
export async function processTryOnModalCloud(payload) {
  const response = await fetch(`${API_BASE_URL}/modal-vton`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Failed to process Modal Cloud GPU Hugging Face VTON try-on.');
  }

  return data.data;
}

