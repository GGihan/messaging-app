import styles from "./FormErrors.module.css";

export const FormErrors = ({ errors, className }) => {
  // Extract all non-empty message strings dynamically
  const messages = Object.values(errors)
    .map((err) => (typeof err === "object" ? err?.message : err))
    .filter(Boolean);

  if (messages.length === 0) return null;

  return (
    <div className={className || styles.errorContainer}>
      <ul className={`${styles.errorList} flex-column`}>
        {messages.map((message, index) => (
          <li key={index} className={`${styles.errorItem} error-message`}>
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
};