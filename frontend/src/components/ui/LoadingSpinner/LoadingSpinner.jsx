import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ size = "20px", className = "" }) {
  return (
    <span
      className={`${styles.spinner} ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}