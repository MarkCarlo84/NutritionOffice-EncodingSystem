import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  /** Full-screen overlay (e.g. for auth check) */
  overlay?: boolean;
  /** Optional label below spinner */
  label?: string;
}

export default function LoadingSpinner({ overlay = false, label }: LoadingSpinnerProps) {
  const content = (
    <div className="loading-spinner-wrap">
      <div className="loading-spinner" aria-hidden="true" />
      {label && <p className="loading-spinner-label">{label}</p>}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay" role="status" aria-label="Loading">
        {content}
      </div>
    );
  }

  return content;
}
