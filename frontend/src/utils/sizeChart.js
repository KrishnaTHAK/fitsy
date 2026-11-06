// Helpers for the AI Size Recommendation feature.
//
// The BACKEND is the authority: it re-validates every value and decides the
// size. The checks here exist only to give instant feedback and to show the
// shopper the fields that matter for this particular product.

// Same limits as REALISTIC_RANGES in backend/services/sizeRecommendationService.js
export const MEASUREMENT_RANGES = {
  height: { min: 100, max: 230, unit: 'cm', label: 'Height' },
  weight: { min: 25, max: 250, unit: 'kg', label: 'Weight' },
  chest: { min: 50, max: 180, unit: 'cm', label: 'Chest' },
  waist: { min: 40, max: 180, unit: 'cm', label: 'Waist' },
  hip: { min: 50, max: 180, unit: 'cm', label: 'Hip' },
  shoulder: { min: 25, max: 70, unit: 'cm', label: 'Shoulder' },
};

export const MEASUREMENT_HINTS = {
  chest: 'Around the fullest part of your chest',
  waist: 'Around your natural waistline',
  hip: 'Around the fullest part of your hips',
  shoulder: 'Across the back, from one shoulder edge to the other',
};

const MATCHABLE = ['chest', 'waist', 'hip', 'shoulder'];

const isNumber = (value) => typeof value === 'number' && Number.isFinite(value);

/**
 * Which body measurements this product's size chart uses, in display order.
 *  - a product with a sizeChart: the dimensions that chart defines
 *  - numeric-sized Bottoms (size label = waist in inches): waist only
 *  - anything else (shoes, accessories, products with no chart): none
 */
export function getRelevantDimensions(product) {
  if (!product) return [];

  if (Array.isArray(product.sizeChart) && product.sizeChart.length > 0) {
    return MATCHABLE.filter((dim) =>
      product.sizeChart.some((entry) => isNumber(entry[`${dim}Min`]) && isNumber(entry[`${dim}Max`]))
    );
  }

  const sizes = product.sizes || [];
  if (product.category === 'Bottoms' && sizes.length > 0 && sizes.every((s) => !Number.isNaN(Number(s)))) {
    return ['waist'];
  }

  return [];
}

/**
 * Show "Find My Size" only when it can work: the product must exist on the
 * backend (it has a string `_id`; the built-in static catalog only has numeric
 * ids, which the backend cannot look up) and must have a usable chart.
 */
export function supportsSizeRecommendation(product) {
  return Boolean(product && typeof product._id === 'string' && product._id) && getRelevantDimensions(product).length > 0;
}

/**
 * @param {Object<string,string>} values - raw form strings
 * @param {string[]} relevantDimensions
 * @returns {{errors: Object<string,string>, measurements: Object<string,number>}}
 */
export function validateMeasurementInputs(values, relevantDimensions) {
  const errors = {};
  const measurements = {};

  for (const [key, range] of Object.entries(MEASUREMENT_RANGES)) {
    const raw = values[key];
    if (raw === undefined || raw === null || String(raw).trim() === '') continue;

    const num = Number(raw);
    if (!Number.isFinite(num)) {
      errors[key] = `${range.label} must be a number.`;
    } else if (num < range.min || num > range.max) {
      errors[key] = `${range.label} should be between ${range.min} and ${range.max} ${range.unit}.`;
    } else {
      measurements[key] = num;
    }
  }

  const hasRelevant = relevantDimensions.some((dim) => measurements[dim] !== undefined);
  if (!hasRelevant && Object.keys(errors).length === 0) {
    errors._form = `Enter at least one of: ${relevantDimensions.map((d) => MEASUREMENT_RANGES[d].label.toLowerCase()).join(', ')}.`;
  }

  return { errors, measurements };
}
