const mongoose = require('mongoose');
const Product = require('../models/Product');
const { getAllProductsInternal } = require('./productController');
const { recommendSize, buildDeterministicReason, buildAiSafeSummary } = require('../services/sizeRecommendationService');
const { explainSizeFit } = require('../services/aiStylistService');

const isDbReady = () => mongoose.connection.readyState === 1;

async function getProductByIdInternal(productId) {
  if (isDbReady() && mongoose.isValidObjectId(productId)) {
    try {
      const product = await Product.findById(productId);
      if (product) return product;
    } catch (error) {
      console.warn('[getProductByIdInternal] DB error, falling back to memory:', error.message);
    }
  }
  const allProducts = await getAllProductsInternal();
  return allProducts.find((p) => String(p._id ?? p.id) === String(productId)) || null;
}

/**
 * @desc    Recommend a clothing size from real measurement + real product size chart
 * @route   POST /api/size-recommendation
 * @access  Public
 */
const getSizeRecommendation = async (req, res) => {
  const { productId, measurements, fitPreference } = req.body || {};

  if (!productId || typeof productId !== 'string') {
    return res.status(400).json({ success: false, message: 'A valid productId is required.' });
  }
  if (!measurements || typeof measurements !== 'object') {
    return res.status(400).json({ success: false, message: 'Measurements are required.' });
  }

  const allowedFitPreferences = ['slim', 'regular', 'relaxed', 'oversized'];
  const cleanFitPreference = allowedFitPreferences.includes(fitPreference) ? fitPreference : 'regular';

  let product;
  try {
    product = await getProductByIdInternal(productId);
  } catch (error) {
    console.error('[getSizeRecommendation] failed to load product:', error);
    return res.status(500).json({ success: false, message: 'Could not load the product.' });
  }

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const result = recommendSize({ product, rawMeasurements: measurements, fitPreference: cleanFitPreference });

  if (result.status === 'invalid') {
    return res.status(400).json({ success: false, message: result.errors.join(' ') });
  }
  if (result.status === 'no_chart') {
    return res.status(200).json({ success: true, data: { status: 'no_chart', message: result.message } });
  }
  if (result.status === 'no_match') {
    return res.status(200).json({
      success: true,
      data: { status: 'no_match', message: result.message, closestSize: result.closestSize },
    });
  }

  // Hard validation: the recommended size must actually be one this product
  // sells. Matching is derived from product.sizes/sizeChart already, but this
  // is a final guard against any drift between the two.
  if (!product.sizes.includes(result.recommendedSize)) {
    console.error('[getSizeRecommendation] recommended size not in product.sizes — refusing to return it', {
      productId,
      recommendedSize: result.recommendedSize,
    });
    return res.status(500).json({ success: false, message: 'Could not determine a valid size for this product.' });
  }

  let reason = buildDeterministicReason(result);

  // The AI only rephrases a result that is already decided, and it only ever
  // receives a redacted summary (no raw body measurements, see
  // buildAiSafeSummary). Set SIZE_AI_EXPLANATION=false to turn it off entirely.
  if (process.env.SIZE_AI_EXPLANATION !== 'false') {
    try {
      const aiReason = await explainSizeFit(buildAiSafeSummary(result));
      if (aiReason) reason = aiReason;
    } catch (error) {
      // Nice-to-have only: the recommendation was already computed
      // deterministically above, so keep the deterministic reason.
      console.warn('[getSizeRecommendation] AI explanation unavailable, using deterministic reason:', error.message);
    }
  }

  return res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      recommendedSize: result.recommendedSize,
      confidence: result.confidence,
      alternative: result.alternative,
      incomplete: result.incomplete,
      reason,
      measurementBreakdown: result.measurementBreakdown,
    },
  });
};

module.exports = { getSizeRecommendation };
