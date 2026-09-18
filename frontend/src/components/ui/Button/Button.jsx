import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './Button.module.css';

export default function Button({
  className,
  type = "button",
  isLoading = false,
  disabled = false,
  children,
  ...props
}) {
  const combinedClassName = `${className || ""}`.trim();

  return (
    <button
      className={combinedClassName}
      type={type}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className={styles.spinnerSlot}>
          <LoadingSpinner size="1em" />
        </span>
      )}

      <span
        className={styles.contentSlot}
        style={{ visibility: isLoading ? "hidden" : "visible" }}
      >
        {children}
      </span>
    </button>
  );
};