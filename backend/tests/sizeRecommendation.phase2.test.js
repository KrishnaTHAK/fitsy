// Phase 2 tests: out-of-range handling, shoulder support, chart-relevant
// measurements, Bottoms-only numeric sizing, and the shared chart builder.
// Pure logic only: no database, Redis, or network.

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  recommendSize,
  buildAiSafeSummary,
  getChartDimensions,
  OUT_OF_RANGE_TOLERANCE_CM,
} = require('../services/sizeRecommendationService');
const { buildSizeChart } = require('../data/sizeCharts');

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
const TOPS = { category: 'Tops', sizes: SIZES, sizeChart: buildSizeChart('Tops', SIZES) }; // chest + shoulder
const DRESS = { category: 'Dresses', sizes: SIZES, sizeChart: buildSizeChart('Dresses', SIZES) }; // chest + waist + hip

// ─── Out of range ────────────────────────────────────────────────────────────

test('bigger than the largest size by more than the tolerance returns no_match', () => {
  const r = recommendSize({ product: TOPS, rawMeasurements: { chest: 120, shoulder: 47 } });
  assert.equal(r.status, 'no_match');
  assert.match(r.message, /above the largest/);
  assert.equal(r.recommendedSize, undefined);
});

test('smaller than the smallest size by more than the tolerance returns no_match', () => {
  const r = recommendSize({ product: TOPS, rawMeasurements: { chest: 70, shoulder: 36 } });
  assert.equal(r.status, 'no_match');
  assert.match(r.message, /below the smallest/);
});

test('slightly beyond the largest size (within the tolerance) still recommends it, with low confidence', () => {
  const justOver = 114 + OUT_OF_RANGE_TOLERANCE_CM - 0.5; // 115.5
  const r = recommendSize({ product: TOPS, rawMeasurements: { chest: justOver, shoulder: 47 } });
  assert.equal(r.status, 'ok');
  assert.equal(r.recommendedSize, 'XL');
  assert.notEqual(r.confidence, 'high');
});

test('exactly at the tolerance edge is accepted, one cm further is not', () => {
  const edge = recommendSize({ product: TOPS, rawMeasurements: { chest: 114 + OUT_OF_RANGE_TOLERANCE_CM, shoulder: 47 } });
  const beyond = recommendSize({ product: TOPS, rawMeasurements: { chest: 114 + OUT_OF_RANGE_TOLERANCE_CM + 1, shoulder: 47 } });
  assert.equal(edge.status, 'ok');
  assert.equal(beyond.status, 'no_match');
});

test('numeric-waist Bottoms far beyond the largest size return no_match', () => {
  const bottoms = { category: 'Bottoms', sizes: ['24', '26', '28', '30', '32'], sizeChart: [] };
  const r = recommendSize({ product: bottoms, rawMeasurements: { waist: 120 } }); // ~47 inches
  assert.equal(r.status, 'no_match');
});

// ─── Shoulder ────────────────────────────────────────────────────────────────

test('shoulder is matched together with chest', () => {
  const r = recommendSize({ product: TOPS, rawMeasurements: { chest: 94, shoulder: 43 } });
  assert.equal(r.status, 'ok');
  assert.equal(r.recommendedSize, 'M');
  assert.deepEqual(Object.keys(r.measurementBreakdown).sort(), ['chest', 'shoulder']);
  assert.equal(r.measurementBreakdown.shoulder.match, true);
});

test('shoulder alone is enough to get a recommendation, but never high confidence', () => {
  const r = recommendSize({ product: TOPS, rawMeasurements: { shoulder: 43 } });
  assert.equal(r.status, 'ok');
  assert.equal(r.recommendedSize, 'M');
  assert.equal(r.incomplete, true);
  assert.notEqual(r.confidence, 'high');
});

test('both chest and shoulder near the middle of M gives high confidence', () => {
  const r = recommendSize({ product: TOPS, rawMeasurements: { chest: 94, shoulder: 43 } });
  assert.equal(r.incomplete, false);
  assert.equal(r.confidence, 'high');
});

// ─── Only relevant measurements ──────────────────────────────────────────────

test('measurements the chart does not use are ignored (hip on a tops chart)', () => {
  const r = recommendSize({ product: TOPS, rawMeasurements: { chest: 94, shoulder: 43, hip: 140 } });
  assert.equal(r.status, 'ok');
  assert.equal(r.recommendedSize, 'M');
  assert.equal(r.measurementBreakdown.hip, undefined);
});

test('only irrelevant measurements are supplied: invalid, and the message names the fields that matter', () => {
  const r = recommendSize({ product: TOPS, rawMeasurements: { hip: 96 } });
  assert.equal(r.status, 'invalid');
  assert.match(r.errors[0], /chest/);
  assert.match(r.errors[0], /shoulder/);
});

test('required measurements missing entirely: invalid for a charted product', () => {
  const r = recommendSize({ product: DRESS, rawMeasurements: {} });
  assert.equal(r.status, 'invalid');
  assert.match(r.errors[0], /chest, waist, hip/);
});

test('incomplete input on a three-measurement chart is capped at medium confidence', () => {
  const r = recommendSize({ product: DRESS, rawMeasurements: { chest: 94, waist: 78 } }); // no hip
  assert.equal(r.status, 'ok');
  assert.equal(r.incomplete, true);
  assert.notEqual(r.confidence, 'high');
});

test('getChartDimensions reports exactly the measurements a chart defines', () => {
  assert.deepEqual(getChartDimensions(TOPS.sizeChart), ['chest', 'shoulder']);
  assert.deepEqual(getChartDimensions(DRESS.sizeChart), ['chest', 'waist', 'hip']);
});

// ─── Numeric sizes are only waist sizes for Bottoms ──────────────────────────

test('shoes (numeric sizes) are NOT treated as waist sizes: no_chart', () => {
  const shoes = { category: 'Shoes', sizes: ['8', '9', '10', '11', '12'], sizeChart: [] };
  const r = recommendSize({ product: shoes, rawMeasurements: { waist: 80 } });
  assert.equal(r.status, 'no_chart');
});

test('One Size and Standard products return no_chart', () => {
  for (const sizes of [['One Size'], ['Standard']]) {
    const r = recommendSize({ product: { category: 'Accessories', sizes, sizeChart: [] }, rawMeasurements: { chest: 96 } });
    assert.equal(r.status, 'no_chart');
  }
});

// ─── Alternative wording points the right way ────────────────────────────────

test('the alternative is described as looser only when it is a larger size', () => {
  // M/L boundary: both sizes are legitimate; check the wording matches direction
  const r = recommendSize({ product: DRESS, rawMeasurements: { chest: 98, waist: 82, hip: 104 } });
  assert.equal(r.status, 'ok');
  assert.ok(r.alternative, 'a boundary measurement should offer an alternative');
  const order = DRESS.sizes;
  const larger = order.indexOf(r.alternative) > order.indexOf(r.recommendedSize);
  assert.match(r.alternativeReason, larger ? /looser/ : /closer to the body/);
});

// ─── Privacy: what the AI may see ────────────────────────────────────────────

test('buildAiSafeSummary contains positions and chart ranges but none of the typed values', () => {
  const r = recommendSize({ product: TOPS, rawMeasurements: { chest: 95.5, shoulder: 43.5 } });
  const summary = buildAiSafeSummary(r);
  const text = JSON.stringify(summary);
  assert.ok(!text.includes('95.5'));
  assert.ok(!text.includes('43.5'));
  assert.equal(summary.recommendedSize, r.recommendedSize);
  assert.equal(summary.dimensions.chest.position, 'within');
  assert.match(summary.dimensions.chest.sizeRange, /cm$/);
});

// ─── Shared chart builder (seed.js and the in-memory catalog use it) ─────────

test('buildSizeChart: each category only gets the measurements that matter for it', () => {
  const keys = (category) => Object.keys(buildSizeChart(category, SIZES)[0]).filter((k) => k !== 'size').sort();
  assert.deepEqual(keys('Tops'), ['chestMax', 'chestMin', 'shoulderMax', 'shoulderMin']);
  assert.deepEqual(keys('Outerwear'), ['chestMax', 'chestMin', 'shoulderMax', 'shoulderMin']);
  assert.deepEqual(keys('Dresses'), ['chestMax', 'chestMin', 'hipMax', 'hipMin', 'waistMax', 'waistMin']);
});

test('buildSizeChart: no chart for numeric sizes, One Size, or unknown categories', () => {
  assert.deepEqual(buildSizeChart('Bottoms', ['24', '26', '28']), []);
  assert.deepEqual(buildSizeChart('Shoes', ['8', '9']), []);
  assert.deepEqual(buildSizeChart('Accessories', ['One Size']), []);
  assert.deepEqual(buildSizeChart('Mystery', SIZES), []);
});

test('buildSizeChart: the chart only contains sizes the product actually sells', () => {
  const chart = buildSizeChart('Tops', ['S', 'M']);
  assert.deepEqual(chart.map((e) => e.size), ['S', 'M']);
});

test('buildSizeChart: consecutive sizes never overlap by more than the shared boundary', () => {
  const chart = buildSizeChart('Dresses', SIZES);
  for (let i = 1; i < chart.length; i += 1) {
    for (const dim of ['chest', 'waist', 'hip']) {
      assert.ok(chart[i][`${dim}Min`] >= chart[i - 1][`${dim}Max`] - 0, `${dim} ranges must not overlap between ${chart[i - 1].size} and ${chart[i].size}`);
    }
  }
});
