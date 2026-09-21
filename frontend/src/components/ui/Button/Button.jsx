import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import styles from './Button.module.css';

export default function Button({
  className,
  type = 'button',
  isLoading = false,
  disabled = false,
  children,
  style,
  ...props
}) {
  const combinedClassName = `${styles.button} ${className || ''}`.trim();

  return (
    <button
      className={combinedClassName}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      style={style}
      {...props}
    >
      {isLoading && (
        <span className={styles.spinnerSlot} aria-hidden="true">
          <LoadingSpinner size="1em" />
        </span>
      )}

      <span
        className={styles.contentSlot}
        style={{ visibility: isLoading ? 'hidden' : 'visible' }}
      >
        {children}
      </span>
    </button>
  );
};