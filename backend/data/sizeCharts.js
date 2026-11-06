// Shared size-chart reference data (cm) used by seed.js and the in-memory
// fallback catalog in productController.js, so both stay identical.
//
// IMPORTANT: this is generic ready-to-wear reference data for the demo
// catalog, NOT manufacturer-verified measurements for any specific garment.
// Real products should carry their own chart, stored on the product's
// `sizeChart` field.
//
// Which measurements a chart includes depends on the product category, so the
// recommendation only compares measurements that matter for that garment:
//   Tops, Outerwear -> chest + shoulder
//   Dresses         -> chest + waist + hip
//   Bottoms (letter sizes) -> waist + hip
// Numeric-sized Bottoms (e.g. '24'..'32') need no chart: the size label is the
// waist in inches and the matcher handles it directly.

const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL'];

// [min, max] in cm per letter size
const RANGES = {
  chest: { XS: [78, 84], S: [84, 90], M: [90, 98], L: [98, 106], XL: [106, 114] },
  waist: { XS: [62, 68], S: [68, 74], M: [74, 82], L: [82, 90], XL: [90, 98] },
  hip: { XS: [86, 90], S: [90, 96], M: [96, 104], L: [104, 112], XL: [112, 120] },
  shoulder: { XS: [38, 40], S: [40, 42], M: [42, 44], L: [44, 46], XL: [46, 48] },
};

const CATEGORY_DIMENSIONS = {
  Tops: ['chest', 'shoulder'],
  Outerwear: ['chest', 'shoulder'],
  Dresses: ['chest', 'waist', 'hip'],
  Bottoms: ['waist', 'hip'],
};

/**
 * Returns a sizeChart array for a product, or [] when no chart applies
 * (unknown category, or sizes that are not letter sizes such as 'One Size',
 * shoe sizes, or numeric waist sizes).
 */
function buildSizeChart(category, sizes) {
  const dimensions = CATEGORY_DIMENSIONS[category];
  if (!dimensions || !Array.isArray(sizes) || sizes.length === 0) return [];
  if (!sizes.every((s) => LETTER_SIZES.includes(s))) return [];

  return LETTER_SIZES.filter((size) => sizes.includes(size)).map((size) => {
    const entry = { size };
    for (const dim of dimensions) {
      entry[`${dim}Min`] = RANGES[dim][size][0];
      entry[`${dim}Max`] = RANGES[dim][size][1];
    }
    return entry;
  });
}

module.exports = { buildSizeChart, CATEGORY_DIMENSIONS, LETTER_SIZES };
