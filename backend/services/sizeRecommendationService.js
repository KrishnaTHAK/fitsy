// ─── Size Recommendation Service ──────────────────────────────────────────────
// Pure, deterministic measurement matching. This is the ONLY thing that ever
// decides which size is recommended — no AI call sits anywhere in this file.
// aiStylistService-style AI is used elsewhere purely to phrase the "reason"
// text from the result this module already computed; it cannot change the
// recommended size.
// ─────────────────────────────────────────────────────────────────────────────

const REALISTIC_RANGES = {
  height: { min: 100, max: 230 }, // cm
  weight: { min: 25, max: 250 }, // kg
  chest: { min: 50, max: 180 }, // cm
  waist: { min: 40, max: 180 }, // cm
  hip: { min: 50, max: 180 }, // cm
  shoulder: { min: 25, max: 70 }, // cm
};

const CM_PER_INCH = 2.54;

// Measurements that can be matched against a size chart. Height and weight are
// validated and may be saved to a fit profile, but are NOT used for matching:
// a body-measurement chart cannot be compared to height or weight reliably.
const MATCHABLE_DIMENSIONS = ['chest', 'waist', 'hip', 'shoulder'];

// A measurement more than this far beyond the largest (or below the smallest)
// size's range is reported as "no suitable size" instead of a weak guess.
const OUT_OF_RANGE_TOLERANCE_CM = 2;

// Only these categories use numeric size labels that ARE a waist measurement
// in inches. Other numeric-sized products (for example shoes) are not
// body-measurement matchable and must not be treated like trousers.
const NUMERIC_WAIST_CATEGORIES = ['Bottoms'];

/**
 * Validates raw measurement input. Returns { valid, errors, measurements }
 * where `measurements` only contains the fields that were both provided and
 * numeric/in-range — never trusts the caller's types.
 */
function validateMeasurements(rawMeasurements = {}) {
  const errors = [];
  const measurements = {};

  for (const key of Object.keys(REALISTIC_RANGES)) {
    const value = rawMeasurements[key];
    if (value === undefined || value === null || value === '') continue;

    const num = Number(value);
    if (Number.isNaN(num)) {
      errors.push(`${key} must be a number.`);
      continue;
    }
    const { min, max } = REALISTIC_RANGES[key];
    if (num <= 0) {
      errors.push(`${key} must be a positive value.`);
      continue;
    }
    if (num < min || num > max) {
      errors.push(`${key} of ${num} is outside a realistic range (${min}–${max}).`);
      continue;
    }
    measurements[key] = num;
  }

  return { valid: errors.length === 0, errors, measurements };
}

/**
 * Fit preference nudges which part of a range is treated as "ideal":
 * slim → prefers being near the lower bound; oversized → prefers the upper
 * bound / tolerates being slightly over. This only affects scoring/ranking
 * among sizes that are already valid candidates — it never manufactures a
 * size or range that doesn't exist in the chart.
 */
const FIT_PREFERENCE_BIAS = {
  slim: 0.25, // ideal point = min + 25% of range
  regular: 0.5, // ideal point = midpoint
  relaxed: 0.7,
  oversized: 0.85,
};

function scoreMeasurementAgainstRange(value, min, max, bias) {
  if (min === undefined || max === undefined || Number.isNaN(min) || Number.isNaN(max)) {
    return null; // this dimension isn't defined for this size — skip it, don't penalize
  }
  const range = max - min;
  const idealPoint = min + range * bias;

  if (value >= min && value <= max) {
    // Within range: score is how close to the "ideal point" for this
    // fit preference, normalized 0..1 (1 = exactly ideal).
    const distanceFromIdeal = Math.abs(value - idealPoint);
    const maxPossibleDistance = Math.max(idealPoint - min, max - idealPoint) || 1;
    return 1 - Math.min(distanceFromIdeal / maxPossibleDistance, 1) * 0.3; // stays in 0.7–1.0 band
  }

  // Outside range: penalize by how far outside, but don't zero it out
  // instantly — a measurement 1cm outside a boundary is still a near-miss.
  const distanceOutside = value < min ? min - value : value - max;
  const penalty = distanceOutside / (range || 10);
  return Math.max(0, 0.7 - penalty * 0.5);
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Which measurements this chart actually defines (min AND max present on at
 * least one available size). This is what makes the recommendation compare
 * only RELEVANT measurements: a tops chart with chest + shoulder never looks
 * at hip, and the caller can tell the user which fields matter.
 */
function getChartDimensions(entries) {
  return MATCHABLE_DIMENSIONS.filter((dim) =>
    entries.some((entry) => isNumber(entry[`${dim}Min`]) && isNumber(entry[`${dim}Max`]))
  );
}

/**
 * @param {Object} measurements - validated user measurements (cm)
 * @param {Array} sizeChart - product.sizeChart entries
 * @param {string} fitPreference
 * @param {string[]} availableSizes - product.sizes (what can actually be bought)
 */
function matchFromSizeChart(measurements, sizeChart, fitPreference, availableSizes) {
  const bias = FIT_PREFERENCE_BIAS[fitPreference] ?? FIT_PREFERENCE_BIAS.regular;
  const availableSet = new Set(availableSizes || []);
  const entries = sizeChart.filter((entry) => availableSet.size === 0 || availableSet.has(entry.size));

  const chartDimensions = getChartDimensions(entries);
  const usedDimensions = chartDimensions.filter((dim) => measurements[dim] !== undefined);

  if (usedDimensions.length === 0) {
    return { candidates: [], usedDimensions, chartDimensions, bounds: {}, order: {} };
  }

  const order = {};
  entries.forEach((entry, index) => {
    order[entry.size] = index;
  });

  const candidates = entries
    .map((entry) => {
      const dimensionResults = {};
      let totalScore = 0;
      let scoredDimensions = 0;

      for (const dim of usedDimensions) {
        const min = entry[`${dim}Min`];
        const max = entry[`${dim}Max`];
        const score = scoreMeasurementAgainstRange(measurements[dim], min, max, bias);
        if (score === null) continue; // dimension not defined for this size
        dimensionResults[dim] = {
          user: measurements[dim],
          min,
          max,
          match: measurements[dim] >= min && measurements[dim] <= max,
        };
        totalScore += score;
        scoredDimensions += 1;
      }

      if (scoredDimensions === 0) return null;

      return {
        size: entry.size,
        score: totalScore / scoredDimensions,
        matchedDimensions: scoredDimensions,
        dimensionResults,
        allMatch: Object.values(dimensionResults).every((d) => d.match),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  // Overall span of the chart per dimension, used to detect "bigger than the
  // largest size" / "smaller than the smallest size".
  const bounds = {};
  for (const dim of usedDimensions) {
    const defined = entries.filter((e) => isNumber(e[`${dim}Min`]) && isNumber(e[`${dim}Max`]));
    bounds[dim] = {
      min: Math.min(...defined.map((e) => e[`${dim}Min`])),
      max: Math.max(...defined.map((e) => e[`${dim}Max`])),
    };
  }

  return { candidates, usedDimensions, chartDimensions, bounds, order };
}

/**
 * Numeric-waist Bottoms (e.g. jeans sized "24" to "32") use the waist in
 * inches as the size label, so no separate chart is needed. The user's waist
 * (cm) is converted to inches and matched to the closest available size.
 */
function matchNumericWaistSize(measurements, availableSizes) {
  const chartDimensions = ['waist'];
  if (measurements.waist === undefined) {
    return { candidates: [], usedDimensions: [], chartDimensions, bounds: {}, order: {} };
  }

  const numericSizes = availableSizes.map((s) => Number(s)).filter((n) => !Number.isNaN(n));
  if (numericSizes.length === 0) {
    return { candidates: [], usedDimensions: [], chartDimensions, bounds: {}, order: {} };
  }

  const userWaistInches = measurements.waist / CM_PER_INCH;
  const order = {};
  [...numericSizes].sort((a, b) => a - b).forEach((n, index) => {
    order[String(n)] = index;
  });

  const candidates = numericSizes
    .map((sizeInches) => {
      const distance = Math.abs(sizeInches - userWaistInches);
      // Within ~1 inch: strong match. Beyond ~3 inches: weak.
      const score = Math.max(0, 1 - distance / 3);
      return {
        size: String(sizeInches),
        score,
        matchedDimensions: 1,
        dimensionResults: {
          waist: {
            user: measurements.waist,
            min: Math.round((sizeInches - 0.5) * CM_PER_INCH),
            max: Math.round((sizeInches + 0.5) * CM_PER_INCH),
            match: distance <= 0.75,
          },
        },
        allMatch: distance <= 0.75,
      };
    })
    .sort((a, b) => b.score - a.score);

  const bounds = {
    waist: {
      min: (Math.min(...numericSizes) - 0.5) * CM_PER_INCH,
      max: (Math.max(...numericSizes) + 0.5) * CM_PER_INCH,
    },
  };

  return { candidates, usedDimensions: ['waist'], chartDimensions, bounds, order };
}

/** First dimension (if any) that is beyond the chart's overall span by more than the tolerance. */
function findOutOfRange(measurements, usedDimensions, bounds) {
  for (const dim of usedDimensions) {
    const value = measurements[dim];
    const span = bounds[dim];
    if (!span) continue;
    if (value > span.max + OUT_OF_RANGE_TOLERANCE_CM) return { dimension: dim, direction: 'above' };
    if (value < span.min - OUT_OF_RANGE_TOLERANCE_CM) return { dimension: dim, direction: 'below' };
  }
  return null;
}

/**
 * Confidence is derived from match quality, never invented:
 *   high   - every compared measurement is inside the size's range, near the
 *            ideal point, there are enough measurements, and the runner-up is
 *            clearly worse
 *   medium - inside the range but near an edge, or a close runner-up
 *   low    - at least one measurement outside the range
 * It is also capped at medium when the user did not supply every measurement
 * the chart uses (incomplete input).
 */
function scoreToConfidence(top, second, { requiredDimensions, incomplete }) {
  if (!top) return 'low';
  const { score, allMatch, matchedDimensions } = top;

  let confidence;
  if (allMatch && matchedDimensions >= requiredDimensions && score >= 0.85) {
    confidence = !second || score - second.score >= 0.1 ? 'high' : 'medium';
  } else if (allMatch || score >= 0.65) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  if (incomplete && confidence === 'high') confidence = 'medium';
  return confidence;
}

function dimensionList(dimensions) {
  if (dimensions.length <= 1) return dimensions.join('');
  return `${dimensions.slice(0, -1).join(', ')} or ${dimensions[dimensions.length - 1]}`;
}

/**
 * Main entry point.
 * @param {object} product - needs sizes, sizeChart, category
 * @param {object} rawMeasurements - user-submitted measurements (cm / kg)
 * @param {string} fitPreference - slim | regular | relaxed | oversized
 * @returns {{status: 'ok'|'no_chart'|'invalid'|'no_match', ...}}
 */
function recommendSize({ product, rawMeasurements, fitPreference = 'regular' }) {
  const { valid, errors, measurements } = validateMeasurements(rawMeasurements);
  if (!valid) {
    return { status: 'invalid', errors };
  }

  const sizes = product.sizes || [];
  const hasChart = Array.isArray(product.sizeChart) && product.sizeChart.length > 0;
  const isNumericWaistProduct =
    NUMERIC_WAIST_CATEGORIES.includes(product.category) &&
    sizes.length > 0 &&
    sizes.every((s) => !Number.isNaN(Number(s)));

  let matchResult;
  if (hasChart) {
    matchResult = matchFromSizeChart(measurements, product.sizeChart, fitPreference, sizes);
  } else if (isNumericWaistProduct) {
    matchResult = matchNumericWaistSize(measurements, sizes);
  } else {
    return {
      status: 'no_chart',
      message: 'No size chart is available for this product yet. Please refer to the general size guide.',
    };
  }

  const { candidates, usedDimensions, chartDimensions, bounds, order } = matchResult;

  if (candidates.length === 0) {
    return {
      status: 'invalid',
      errors: [
        `This product's size chart uses ${chartDimensions.join(', ')}. Please enter at least one of: ${dimensionList(chartDimensions)}.`,
      ],
    };
  }

  const [top, second] = candidates;

  const outOfRange = findOutOfRange(measurements, usedDimensions, bounds);
  if (outOfRange) {
    const edge = outOfRange.direction === 'above' ? 'largest' : 'smallest';
    return {
      status: 'no_match',
      message: `Your ${outOfRange.dimension} measurement is ${outOfRange.direction === 'above' ? 'above' : 'below'} the ${edge} available size for this product. Please check the product's sizing information or consider a different product.`,
      closestSize: top.size,
    };
  }

  if (top.score < 0.25) {
    return {
      status: 'no_match',
      message: "Your measurements fall outside the available size ranges. Please check the product's sizing information or consider a different product.",
      closestSize: top.size,
    };
  }

  const incomplete = usedDimensions.length < chartDimensions.length;
  const confidence = scoreToConfidence(top, second, {
    requiredDimensions: Math.min(2, chartDimensions.length),
    incomplete,
  });

  const alternative =
    second && Math.abs(second.score - top.score) < 0.12 && second.size !== top.size ? second.size : null;

  let alternativeReason = null;
  if (alternative) {
    const fitsLooser = order[alternative] > order[top.size];
    alternativeReason = `${top.size} is the closest measurement match. ${alternative} may fit ${fitsLooser ? 'looser' : 'closer to the body'}.`;
  }

  return {
    status: 'ok',
    recommendedSize: top.size,
    confidence,
    alternative,
    incomplete,
    usedDimensions,
    chartDimensions,
    measurementBreakdown: top.dimensionResults,
    alternativeReason,
  };
}

function buildDeterministicReason({ recommendedSize, measurementBreakdown, alternative, alternativeReason, incomplete }) {
  const matchedDims = Object.entries(measurementBreakdown || {})
    .filter(([, d]) => d.match)
    .map(([dim]) => dim);

  let base;
  if (matchedDims.length === 0) {
    base = `${recommendedSize} is the best available match based on your measurements.`;
  } else {
    const dimList =
      matchedDims.length === 1
        ? matchedDims[0]
        : `${matchedDims.slice(0, -1).join(', ')} and ${matchedDims[matchedDims.length - 1]}`;
    base = `Your ${dimList} measurement${matchedDims.length > 1 ? 's' : ''} fall within the ${recommendedSize} size range for this product.`;
  }

  const parts = [base];
  if (alternative && alternativeReason) parts.push(alternativeReason);
  if (incomplete) parts.push('Add your other measurements for a more reliable result.');
  return parts.join(' ');
}

/**
 * What the optional AI explanation is allowed to see. Body measurements are
 * personal data, so the raw values the user typed are NOT sent to the AI
 * provider: only the chosen size, confidence, the size's own chart range
 * (product data, not personal), and whether each measurement fell within,
 * below or above that range.
 */
function buildAiSafeSummary(result) {
  const dimensions = {};
  for (const [dim, d] of Object.entries(result.measurementBreakdown || {})) {
    dimensions[dim] = {
      position: d.user < d.min ? 'below' : d.user > d.max ? 'above' : 'within',
      sizeRange: `${d.min}-${d.max} cm`,
    };
  }
  return {
    recommendedSize: result.recommendedSize,
    confidence: result.confidence,
    alternative: result.alternative,
    incomplete: Boolean(result.incomplete),
    dimensions,
  };
}

module.exports = {
  validateMeasurements,
  recommendSize,
  buildDeterministicReason,
  buildAiSafeSummary,
  getChartDimensions,
  REALISTIC_RANGES,
  MATCHABLE_DIMENSIONS,
  OUT_OF_RANGE_TOLERANCE_CM,
};
