import { useState } from 'react';
import { Ruler, Check, AlertCircle, Loader2 } from 'lucide-react';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MEASUREMENT_RANGES,
  MEASUREMENT_HINTS,
  getRelevantDimensions,
  validateMeasurementInputs,
} from '../utils/sizeChart';

const FIT_PREFERENCES = [
  { value: 'slim', label: 'Slim' },
  { value: 'regular', label: 'Regular' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'oversized', label: 'Oversized' },
];

const OPTIONAL_FIELDS = ['height', 'weight'];

export default function SizeRecommendationModal({ product, onClose, onSelectSize }) {
  const { isAuthenticated, user, updateFitProfile } = useAuth();

  // Only the measurements this product's size chart actually uses
  const relevantDimensions = getRelevantDimensions(product);
  const savedProfile = user?.fitProfile || {};
  const fieldKeys = [...relevantDimensions, ...OPTIONAL_FIELDS];

  const initialValues = () =>
    Object.fromEntries(fieldKeys.map((key) => [key, savedProfile[key] ? String(savedProfile[key]) : '']));

  const [values, setValues] = useState(initialValues);
  const [fitPreference, setFitPreference] = useState(savedProfile.fitPreference || 'regular');
  const [saveProfile, setSaveProfile] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // idle | loading | success | error
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

  const hasSavedProfile =
    isAuthenticated && relevantDimensions.some((dim) => savedProfile[dim]);

  function applySavedProfile() {
    setValues(initialValues());
    if (savedProfile.fitPreference) setFitPreference(savedProfile.fitPreference);
    setFieldErrors({});
  }

  function handleChange(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key] || fieldErrors._form) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined, _form: undefined }));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const { errors, measurements } = validateMeasurementInputs(values, relevantDimensions);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setStatus('loading');
    setErrorMessage('');
    setResult(null);

    const { data, error } = await api.sizeRecommendation.recommend({
      productId: product._id,
      measurements,
      fitPreference,
    });

    if (error || !data?.success) {
      setStatus('error');
      setErrorMessage(error || data?.message || 'Something went wrong. Please try again.');
      return;
    }

    setResult(data.data);
    setStatus('success');

    if (saveProfile && isAuthenticated) {
      // Merge into the existing profile: saving from a product that only uses
      // chest and shoulder must not erase a previously saved waist or hip.
      await updateFitProfile({ ...savedProfile, ...measurements, fitPreference });
    }
  }

  function handleSelectSize(size) {
    onSelectSize(size);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Find your size"
        className="bg-surface border border-outline-variant p-6 rounded-3xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Ruler className="w-5 h-5 text-primary" /> Find Your Size
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-on-surface-variant hover:text-on-surface font-bold text-xl"
          >
            &times;
          </button>
        </div>

        {status !== 'success' && (
          <>
            {hasSavedProfile && (
              <button
                type="button"
                onClick={applySavedProfile}
                className="w-full mb-4 text-xs font-semibold text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/5 transition-colors"
              >
                Use My Saved Measurements
              </button>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <p className="text-xs text-on-surface-variant">
                This product&apos;s size chart uses{' '}
                <span className="font-semibold">{relevantDimensions.join(', ')}</span>. Enter at least one.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {relevantDimensions.map((key) => (
                  <Field
                    key={key}
                    id={`size-${key}`}
                    fieldKey={key}
                    value={values[key]}
                    error={fieldErrors[key]}
                    hint={MEASUREMENT_HINTS[key]}
                    onChange={handleChange}
                  />
                ))}
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer font-semibold text-on-surface-variant">
                  Height and weight (optional)
                </summary>
                <p className="text-on-surface-variant mt-2 mb-2">
                  Saved to your fit profile only. They are not used to pick a size.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {OPTIONAL_FIELDS.map((key) => (
                    <Field
                      key={key}
                      id={`size-${key}`}
                      fieldKey={key}
                      value={values[key]}
                      error={fieldErrors[key]}
                      onChange={handleChange}
                    />
                  ))}
                </div>
              </details>

              <fieldset>
                <legend className="text-xs font-semibold text-on-surface-variant mb-1">Preferred Fit</legend>
                <div className="grid grid-cols-4 gap-2">
                  {FIT_PREFERENCES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={fitPreference === value}
                      onClick={() => setFitPreference(value)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        fitPreference === value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface border-outline-variant/60 text-on-surface hover:border-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {isAuthenticated && (
                <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveProfile}
                    onChange={(e) => setSaveProfile(e.target.checked)}
                    className="rounded border-outline-variant"
                  />
                  Save these measurements to my profile for next time
                </label>
              )}

              {fieldErrors._form && (
                <p role="alert" className="text-xs text-error">
                  {fieldErrors._form}
                </p>
              )}

              {status === 'error' && (
                <div
                  role="alert"
                  className="flex items-start gap-2 bg-error-container/20 border border-error/30 text-on-surface rounded-xl p-3 text-xs"
                >
                  <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-full font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Calculating...
                  </>
                ) : (
                  'Recommend My Size'
                )}
              </button>
              <p className="text-[11px] text-on-surface-variant text-center">
                A recommended size is an estimate based on the measurements you enter. Actual fit varies by brand,
                fabric and garment cut.
              </p>
            </form>
          </>
        )}

        {status === 'success' && result && (
          <div className="space-y-4">
            {result.status === 'ok' && (
              <>
                <div className="text-center py-2">
                  <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                    Your Recommended Size
                  </p>
                  <p className="text-4xl font-bold text-primary mb-2">{result.recommendedSize}</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      result.confidence === 'high'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : result.confidence === 'medium'
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-outline-variant/30 text-on-surface-variant'
                    }`}
                  >
                    Confidence: {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}
                  </span>
                  {result.reason && <p className="text-sm text-on-surface-variant italic mt-3">&ldquo;{result.reason}&rdquo;</p>}
                  {result.incomplete && (
                    <p className="text-xs text-on-surface-variant mt-2">
                      Add your other measurements for a more reliable result.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  {Object.entries(result.measurementBreakdown || {}).map(([dim, d]) => (
                    <div
                      key={dim}
                      className="flex items-center justify-between text-xs bg-surface-container-low rounded-lg px-3 py-2"
                    >
                      <span className="font-semibold capitalize text-on-surface">{dim}</span>
                      <span className="text-on-surface-variant">
                        You: {d.user} cm · Range: {d.min}–{d.max} cm
                      </span>
                      {d.match ? (
                        <Check aria-label="Within range" className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle aria-label="Outside range" className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>

                {result.alternative && (
                  <p className="text-xs text-on-surface-variant text-center">
                    Alternative: <span className="font-bold text-on-surface">{result.alternative}</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => handleSelectSize(result.recommendedSize)}
                  className="w-full py-3 bg-primary text-white rounded-full font-bold text-sm"
                >
                  Select {result.recommendedSize}
                </button>
                {result.alternative && (
                  <button
                    type="button"
                    onClick={() => handleSelectSize(result.alternative)}
                    className="w-full py-2.5 border border-outline-variant/60 text-on-surface rounded-full font-semibold text-xs"
                  >
                    Select {result.alternative} instead
                  </button>
                )}
                <p className="text-[11px] text-on-surface-variant text-center">
                  Best available match based on your measurements. Actual fit varies by brand, fabric and garment cut.
                </p>
              </>
            )}

            {result.status === 'no_chart' && (
              <div className="text-center py-6">
                <AlertCircle className="w-8 h-8 text-on-surface-variant mx-auto mb-3" />
                <p className="text-sm text-on-surface-variant">{result.message}</p>
              </div>
            )}

            {result.status === 'no_match' && (
              <div className="text-center py-6">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <p className="text-sm text-on-surface-variant">{result.message}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="w-full py-2.5 text-xs font-semibold text-primary hover:underline"
            >
              Try different measurements
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ id, fieldKey, value, error, hint, onChange }) {
  const range = MEASUREMENT_RANGES[fieldKey];
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-on-surface-variant mb-1 block">
        {range.label} ({range.unit})
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.1"
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-lg border border-outline-variant/50 bg-surface px-3 py-2 text-sm text-on-surface"
      />
      {hint && !error && <p className="text-[11px] text-on-surface-variant mt-1">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-[11px] text-error mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
