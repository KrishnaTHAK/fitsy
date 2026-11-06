import { describe, it, expect } from 'vitest';
import { getRelevantDimensions, supportsSizeRecommendation, validateMeasurementInputs } from './sizeChart';

const topsChart = [
  { size: 'S', chestMin: 84, chestMax: 90, shoulderMin: 40, shoulderMax: 42 },
  { size: 'M', chestMin: 90, chestMax: 98, shoulderMin: 42, shoulderMax: 44 },
];
const dressChart = [{ size: 'M', chestMin: 90, chestMax: 98, waistMin: 74, waistMax: 82, hipMin: 96, hipMax: 104 }];

describe('getRelevantDimensions', () => {
  it('returns exactly the measurements the chart defines, in display order', () => {
    expect(getRelevantDimensions({ sizeChart: topsChart })).toEqual(['chest', 'shoulder']);
    expect(getRelevantDimensions({ sizeChart: dressChart })).toEqual(['chest', 'waist', 'hip']);
  });

  it('numeric-sized Bottoms need only a waist measurement', () => {
    expect(getRelevantDimensions({ category: 'Bottoms', sizes: ['24', '26', '28'], sizeChart: [] })).toEqual(['waist']);
  });

  it('shoes (numeric sizes), One Size items and products with no chart have none', () => {
    expect(getRelevantDimensions({ category: 'Shoes', sizes: ['8', '9'], sizeChart: [] })).toEqual([]);
    expect(getRelevantDimensions({ category: 'Accessories', sizes: ['One Size'], sizeChart: [] })).toEqual([]);
    expect(getRelevantDimensions({ category: 'Tops', sizes: ['S', 'M'] })).toEqual([]);
    expect(getRelevantDimensions(null)).toEqual([]);
  });
});

describe('supportsSizeRecommendation', () => {
  it('is true for a backend product (string _id) with a usable chart', () => {
    expect(supportsSizeRecommendation({ _id: 'prod_001', sizeChart: topsChart })).toBe(true);
  });

  it('is false for the static catalog, which only has numeric ids the backend cannot look up', () => {
    expect(supportsSizeRecommendation({ id: 11, sizeChart: topsChart })).toBe(false);
  });

  it('is false when there is nothing to match against', () => {
    expect(supportsSizeRecommendation({ _id: 'prod_027', category: 'Accessories', sizes: ['One Size'] })).toBe(false);
  });
});

describe('validateMeasurementInputs', () => {
  const dims = ['chest', 'shoulder'];

  it('accepts valid numbers and ignores blanks', () => {
    const { errors, measurements } = validateMeasurementInputs({ chest: '96', shoulder: '', height: '' }, dims);
    expect(errors).toEqual({});
    expect(measurements).toEqual({ chest: 96 });
  });

  it('requires at least one relevant measurement and names the fields', () => {
    const { errors } = validateMeasurementInputs({ chest: '', shoulder: '' }, dims);
    expect(errors._form).toMatch(/chest, shoulder/);
  });

  it('height or weight alone does not satisfy the requirement', () => {
    const { errors } = validateMeasurementInputs({ height: '175', weight: '70' }, dims);
    expect(errors._form).toBeTruthy();
  });

  it('flags non-numeric and out-of-range values per field', () => {
    const { errors } = validateMeasurementInputs({ chest: 'abc', shoulder: '200' }, dims);
    expect(errors.chest).toMatch(/number/);
    expect(errors.shoulder).toMatch(/between 25 and 70/);
  });

  it('treats the lower and upper limits as valid', () => {
    const { errors, measurements } = validateMeasurementInputs({ chest: '50', shoulder: '70' }, dims);
    expect(errors).toEqual({});
    expect(measurements).toEqual({ chest: 50, shoulder: 70 });
  });
});
