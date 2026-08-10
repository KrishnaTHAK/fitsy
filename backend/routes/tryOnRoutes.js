const express = require('express');
const router = express.Router();
const {
  estimateBodyPosition,
  processTryOnComposite,
  generateNeuralTryOn,
  processModalVTON,
} = require('../controllers/tryOnController');

// SAM 2 Body position & segmentation estimation
router.post('/estimate-body', estimateBodyPosition);

// Virtual try-on fabric warping & composition
router.post('/process-tryon', processTryOnComposite);

// Neural photorealistic try-on (proxied to Modal serverless GPU)
router.post('/generate', generateNeuralTryOn);

// Hugging Face VTON Model hosted on Modal Labs Cloud GPU
router.post('/modal-vton', processModalVTON);

module.exports = router;
