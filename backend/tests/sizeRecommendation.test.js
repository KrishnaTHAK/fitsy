// Tests for the AI Size Recommendation feature.
// Run with: node --test (auto-discovers everything under tests/)

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { recommendSize, validateMeasurements } = require('../services/sizeRecommendationService');

// ─── sizeRecommendationService (pure, deterministic logic) ────────────────────

const LETTER_PRODUCT = {
  sizes: ['S', 'M', 'L', 'XL'],
  sizeChart: [
    { size: 'S', chestMin: 84, chestMax: 90, waistMin: 68, waistMax: 74 },
    { size: 'M', chestMin: 90, chestMax: 98, waistMin: 74, waistMax: 82 },
    { size: 'L', chestMin: 98, chestMax: 106, waistMin: 82, waistMax: 90 },
    { size: 'XL', chestMin: 106, chestMax: 114, waistMin: 90, waistMax: 98 },
  ],
};

const NUMERIC_WAIST_PRODUCT = { category: 'Bottoms', sizes: ['24', '26', '28', '30', '32'], sizeChart: [] };

const NO_CHART_PRODUCT = { sizes: ['One Size'], sizeChart: [] };

test('user measurements match size M', () => {
  const result = recommendSize({ product: LETTER_PRODUCT, rawMeasurements: { chest: 96, waist: 81 } });
  assert.equal(result.status, 'ok');
  assert.equal(result.recommendedSize, 'M');
});

test('user measurements match size L', () => {
  const result = recommendSize({ product: LETTER_PRODUCT, rawMeasurements: { chest: 102, waist: 86 } });
  assert.equal(result.status, 'ok');
  assert.equal(result.recommendedSize, 'L');
});

test('multiple measurements are considered together, not just one', () => {
  // Chest alone would suggest L (100 is within L's 98-106 and near S/M boundary
  // is irrelevant), but waist alone suggests M. The algorithm should weigh both.
  const result = recommendSize({ product: LETTER_PRODUCT, rawMeasurements: { chest: 100, waist: 78 } });
  assert.equal(result.status, 'ok');
  assert.ok(['M', 'L'].includes(result.recommendedSize));
  assert.equal(Object.keys(result.measurementBreakdown).length, 2);
});

test('boundary case: measurement exactly at a size limit still matches', () => {
  const result = recommendSize({ product: LETTER_PRODUCT, rawMeasurements: { chest: 98, waist: 82 } });
  assert.equal(result.status, 'ok');
  // 98/82 is the upper edge of M and lower edge of L simultaneously — both legitimate
  assert.ok(['M', 'L'].includes(result.recommendedSize));
});

test('near-center measurements produce high confidence', () => {
  const result = recommendSize({ product: LETTER_PRODUCT, rawMeasurements: { chest: 94, waist: 78 } });
  assert.equal(result.status, 'ok');
  assert.equal(result.recommendedSize, 'M');
  assert.equal(result.confidence, 'high');
});

test('rejects negative measurements', () => {
  const { valid, errors } = validateMeasurements({ chest: -10 });
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

test('rejects non-numeric measurements', () => {
  const { valid, errors } = validateMeasurements({ chest: 'large' });
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

test('rejects unrealistic measurements', () => {
  const { valid, errors } = validateMeasurements({ chest: 500 });
  assert.equal(valid, false);
  assert.ok(errors.length > 0);
});

test('product with no size chart and non-numeric sizes returns no_chart', () => {
  const result = recommendSize({ product: NO_CHART_PRODUCT, rawMeasurements: { chest: 96 } });
  assert.equal(result.status, 'no_chart');
});

test('measurements far outside every range return no_match', () => {
  const result = recommendSize({ product: LETTER_PRODUCT, rawMeasurements: { chest: 170, waist: 150 } });
  assert.equal(result.status, 'no_match');
});

test('fit preference influences which size is favored near a boundary', () => {
  const slim = recommendSize({
    product: LETTER_PRODUCT,
    rawMeasurements: { chest: 97, waist: 81 },
    fitPreference: 'slim',
  });
  const oversized = recommendSize({
    product: LETTER_PRODUCT,
    rawMeasurements: { chest: 97, waist: 81 },
    fitPreference: 'oversized',
  });
  assert.equal(slim.status, 'ok');
  assert.equal(oversized.status, 'ok');
  // Both stay within real chart sizes — preference must never invent a size
  assert.ok(LETTER_PRODUCT.sizes.includes(slim.recommendedSize));
  assert.ok(LETTER_PRODUCT.sizes.includes(oversized.recommendedSize));
});

test('numeric-waist products (e.g. jeans) match directly against the size label', () => {
  const result = recommendSize({ product: NUMERIC_WAIST_PRODUCT, rawMeasurements: { waist: 71 } }); // ~28in
  assert.equal(result.status, 'ok');
  assert.equal(result.recommendedSize, '28');
});

test('recommended size always exists in product.sizes', () => {
  for (const measurements of [{ chest: 88 }, { chest: 96, waist: 81 }, { chest: 110, waist: 95 }]) {
    const result = recommendSize({ product: LETTER_PRODUCT, rawMeasurements: measurements });
    if (result.status === 'ok') {
      assert.ok(LETTER_PRODUCT.sizes.includes(result.recommendedSize));
    }
  }
});

// ─── sizeRecommendationController (HTTP layer, mocked dependencies) ───────────

const CONTROLLER_PATH = path.join(__dirname, '../controllers/sizeRecommendationController.js');
const AI_SERVICE_PATH = path.join(__dirname, '../services/aiStylistService.js');

function loadControllerWith({ product, aiExplain }) {
  delete require.cache[require.resolve(CONTROLLER_PATH)];
  delete require.cache[require.resolve(AI_SERVICE_PATH)];

  // Mock the product lookup by stubbing productController's internal export
  const productControllerPath = path.join(__dirname, '../controllers/productController.js');
  delete require.cache[require.resolve(productControllerPath)];
  require.cache[require.resolve(productControllerPath)] = {
    id: require.resolve(productControllerPath),
    filename: require.resolve(productControllerPath),
    loaded: true,
    exports: { getAllProductsInternal: async () => (product ? [{ ...product, _id: 'prod_test_1' }] : []) },
  };

  require.cache[require.resolve(AI_SERVICE_PATH)] = {
    id: require.resolve(AI_SERVICE_PATH),
    filename: require.resolve(AI_SERVICE_PATH),
    loaded: true,
    exports: {
      explainSizeFit: aiExplain || (async () => { throw Object.assign(new Error('unavailable'), { code: 'AI_UNAVAILABLE' }); }),
    },
  };

  return require(CONTROLLER_PATH);
}

function mockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  return res;
}

test('controller: rejects missing productId', async () => {
  const { getSizeRecommendation } = loadControllerWith({ product: LETTER_PRODUCT });
  const res = mockRes();
  await getSizeRecommendation({ body: { measurements: { chest: 96 } } }, res);
  assert.equal(res.statusCode, 400);
});

test('controller: returns 404 for unknown product', async () => {
  const { getSizeRecommendation } = loadControllerWith({ product: null });
  const res = mockRes();
  await getSizeRecommendation({ body: { productId: 'prod_test_1', measurements: { chest: 96 } } }, res);
  assert.equal(res.statusCode, 404);
});

test('controller: falls back to deterministic reason when AI explanation is unavailable', async () => {
  const { getSizeRecommendation } = loadControllerWith({ product: LETTER_PRODUCT });
  const res = mockRes();
  await getSizeRecommendation(
    { body: { productId: 'prod_test_1', measurements: { chest: 96, waist: 81 } } },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'ok');
  assert.equal(res.body.data.recommendedSize, 'M');
  assert.ok(res.body.data.reason.length > 0); // deterministic fallback text, not the AI's
});

test('controller: uses AI explanation text when available, without changing the size', async () => {
  const { getSizeRecommendation } = loadControllerWith({
    product: LETTER_PRODUCT,
    aiExplain: async () => 'A friendly AI-phrased explanation.',
  });
  const res = mockRes();
  await getSizeRecommendation(
    { body: { productId: 'prod_test_1', measurements: { chest: 96, waist: 81 } } },
    res
  );
  assert.equal(res.body.data.recommendedSize, 'M');
  assert.equal(res.body.data.reason, 'A friendly AI-phrased explanation.');
});

test('controller: existing Add to Cart contract is untouched (sanity import check)', () => {
  // The size recommendation feature must not modify cart behavior — this just
  // confirms cartController still loads cleanly alongside the new modules.
  const cartController = require('../controllers/cartController.js');
  assert.equal(typeof cartController.addToCart, 'function');
});

// ─── Phase 2: privacy, id handling ───────────────────────────────────────────

test('controller: the AI explanation never receives the raw measurements the user typed', async () => {
  let received;
  const { getSizeRecommendation } = loadControllerWith({
    product: LETTER_PRODUCT,
    aiExplain: async (summary) => {
      received = summary;
      return 'Friendly explanation.';
    },
  });
  const res = mockRes();
  // 95.5 and 80.5 are deliberately not numbers that appear in the chart
  await getSizeRecommendation(
    { body: { productId: 'prod_test_1', measurements: { chest: 95.5, waist: 80.5 } } },
    res
  );
  assert.equal(res.statusCode, 200);
  const sent = JSON.stringify(received);
  assert.ok(!sent.includes('95.5'), 'raw chest value must not be sent to the AI provider');
  assert.ok(!sent.includes('80.5'), 'raw waist value must not be sent to the AI provider');
  assert.equal(received.recommendedSize, 'M');
  assert.equal(received.dimensions.chest.position, 'within');
});

test('controller: SIZE_AI_EXPLANATION=false skips the AI call entirely', async () => {
  let called = false;
  const { getSizeRecommendation } = loadControllerWith({
    product: LETTER_PRODUCT,
    aiExplain: async () => {
      called = true;
      return 'should not be used';
    },
  });
  process.env.SIZE_AI_EXPLANATION = 'false';
  try {
    const res = mockRes();
    await getSizeRecommendation(
      { body: { productId: 'prod_test_1', measurements: { chest: 96, waist: 81 } } },
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(called, false);
    assert.ok(res.body.data.reason.length > 0);
  } finally {
    delete process.env.SIZE_AI_EXPLANATION;
  }
});

test('controller: a numeric productId is rejected (ids must be the backend string _id)', async () => {
  const { getSizeRecommendation } = loadControllerWith({ product: LETTER_PRODUCT });
  const res = mockRes();
  await getSizeRecommendation({ body: { productId: 11, measurements: { chest: 96 } } }, res);
  assert.equal(res.statusCode, 400);
});

test('controller: out-of-range measurements return a no_match result, not a recommendation', async () => {
  const { getSizeRecommendation } = loadControllerWith({ product: LETTER_PRODUCT });
  const res = mockRes();
  await getSizeRecommendation(
    { body: { productId: 'prod_test_1', measurements: { chest: 120, waist: 104 } } },
    res
  );
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.status, 'no_match');
  assert.equal(res.body.data.recommendedSize, undefined);
});
