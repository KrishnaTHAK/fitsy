/**
 * LoadingSpinner — shared presentational component.
 * Reuses the existing `.spinner` keyframe animation from index.css.
 * Wraps it in a centered flex container so it can be dropped anywhere.
 *
 * @param {string} [message] - Optional status text shown below the spinner.
 */
export default function LoadingSpinner({ message = '' }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      {message && <p className="loading-spinner__message">{message}</p>}
    </div>
  );
}
