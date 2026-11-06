const test = require('node:test');
const assert = require('node:assert/strict');
const { computeChartUpdates } = require('../scripts/backfillSizeCharts');
const { buildSizeChart } = require('../data/sizeCharts');

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

test('backfill: a product with no sizeChart gets its category chart', () => {
  const updates = computeChartUpdates([{ _id: '1', name: 'Tee', category: 'Tops', sizes: SIZES, sizeChart: [] }]);
  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0].sizeChart, buildSizeChart('Tops', SIZES));
});

test('backfill: a product that already has the right chart is skipped (safe to re-run)', () => {
  const chart = buildSizeChart('Dresses', SIZES);
  const updates = computeChartUpdates([{ _id: '1', name: 'Dress', category: 'Dresses', sizes: SIZES, sizeChart: chart }]);
  assert.equal(updates.length, 0);
});

test('backfill: an outdated chart (older version without shoulder) is replaced', () => {
  const old = SIZES.map((size) => ({ size, chestMin: 80, chestMax: 90, waistMin: 70, waistMax: 80, hipMin: 90, hipMax: 100 }));
  const updates = computeChartUpdates([{ _id: '1', name: 'Tee', category: 'Tops', sizes: SIZES, sizeChart: old }]);
  assert.equal(updates.length, 1);
  assert.ok('shoulderMin' in updates[0].sizeChart[0]);
});

test('backfill: shoes, accessories and numeric-sized bottoms are never touched', () => {
  const updates = computeChartUpdates([
    { _id: '1', name: 'Runner', category: 'Shoes', sizes: ['8', '9'], sizeChart: [] },
    { _id: '2', name: 'Watch', category: 'Accessories', sizes: ['One Size'], sizeChart: [] },
    { _id: '3', name: 'Jeans', category: 'Bottoms', sizes: ['28', '30'], sizeChart: [] },
  ]);
  assert.equal(updates.length, 0);
});

test('backfill: handles Mongoose-style subdocuments that expose toObject()', () => {
  const chart = buildSizeChart('Tops', SIZES).map((entry) => ({ ...entry, _id: 'x', toObject() { const { toObject, ...rest } = this; return rest; } }));
  const updates = computeChartUpdates([{ _id: '1', name: 'Tee', category: 'Tops', sizes: SIZES, sizeChart: chart }]);
  assert.equal(updates.length, 0);
});
