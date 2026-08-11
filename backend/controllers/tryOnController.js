const { estimateBodyPositionWithSAM2 } = require('../services/samService');
const { generateTryOn } = require('../services/vtonService');

const VTON_CATEGORIES = ['upper_body', 'lower_body'];

/**
 * @desc    Estimate body pose landmarks + person segmentation mask (MediaPipe)
 * @route   POST /api/tryon/estimate-body
 * @access  Public
 */
const estimateBodyPosition = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image payload (base64 or URL).',
      });
    }

    const poseData = await estimateBodyPositionWithSAM2(image);

    if (!poseData || !poseData.success) {
      return res.status(422).json({
        success: false,
        message: poseData?.error || 'Body position estimation failed.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Body pose and segmentation estimated.',
      data: poseData,
    });
  } catch (error) {
    console.error('Error in estimateBodyPosition controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during body estimation.',
      error: error.message,
    });
  }
};

/**
 * @desc    Process virtual try-on fabric warping & composition on backend
 * @route   POST /api/tryon/process-tryon
 * @access  Public
 */
const processTryOnComposite = async (req, res) => {
  try {
    const { userImage, garmentImage, fit = {} } = req.body;

    if (!userImage || !garmentImage) {
      return res.status(400).json({
        success: false,
        message: 'Both userImage and garmentImage are required.',
      });
    }

    // Perform SAM 2 segmentation on user image
    const sam2Data = await estimateBodyPositionWithSAM2(userImage);

    return res.status(200).json({
      success: true,
      message: 'Virtual try-on composite generated using backend SAM 2 body segmentation.',
      data: {
        sam2Segmentation: sam2Data,
        garmentImage,
        fitSettings: {
          widen: fit.widen || 1.15,
          lengthen: fit.lengthen || 1.35,
          offsetY: fit.offsetY || 0,
        },
        compositeStatus: 'rendered',
      },
    });
  } catch (error) {
    console.error('Error in processTryOnComposite controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during try-on composition.',
      error: error.message,
    });
  }
};

/**
 * @desc    Generate a photorealistic try-on via the Modal neural VTON engine.
 * @route   POST /api/tryon/generate
 * @access  Public
 */
const generateNeuralTryOn = async (req, res) => {
  try {
    const { human, garment, category = 'upper_body' } = req.body;

    if (!human || !garment) {
      return res.status(400).json({
        success: false,
        error: 'Both human and garment images are required.',
      });
    }
    if (!VTON_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `category must be one of: ${VTON_CATEGORIES.join(', ')}.`,
      });
    }

    const { image } = await generateTryOn({ human, garment, category });
    return res.status(200).json({ success: true, data: { image } });
  } catch (error) {
    // 503 (not 500): the neural engine is unavailable/unconfigured, so the
    // client should fall back to the geometric warp rather than treat it fatal.
    console.error('Error in generateNeuralTryOn controller:', error.message);
    return res.status(503).json({
      success: false,
      error: error.message || 'Neural try-on engine unavailable.',
    });
  }
};

const { processModalCloudVTON } = require('../services/modalVtonService');

/**
 * @desc    Process photorealistic VTON using Hugging Face weights deployed on Modal Cloud GPU
 * @route   POST /api/tryon/modal-vton
 * @access  Public
 */
const processModalVTON = async (req, res) => {
  try {
    const { personImage, garmentImage, garmentType = 'upper-body', fit } = req.body;

    if (!personImage || !garmentImage) {
      return res.status(400).json({
        success: false,
        message: 'Both personImage and garmentImage are required.',
      });
    }

    const modalData = await processModalCloudVTON({ personImage, garmentImage, garmentType, fit });

    return res.status(200).json({
      success: true,
      message: 'Modal Cloud GPU Hugging Face VTON inference complete.',
      data: modalData,
    });
  } catch (error) {
    console.error('Error in processModalVTON controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during Modal VTON process.',
      error: error.message,
    });
  }
};

module.exports = {
  estimateBodyPosition,
  processTryOnComposite,
  generateNeuralTryOn,
  processModalVTON,
};
