import styles from "./TopAppBar.module.css";

export default function TopAppBar({ 
  leading,
  avatarUrl,
  title,
  subtitle,
  actions,
}) {

  return (
    <header className={styles.barWrapper}>
      <div className={styles.startGroup}>
        {leading && (
          <div className={styles.leading}>{leading}</div>
        )}
        {avatarUrl && (
          <div className={styles.avatarWrapper}>
            <img
              className={styles.avatar}
              src={avatarUrl}
              alt=""
              aria-hidden="true"
            />
          </div>
        )}
        <div className={`${styles.titleGroup} flex-column`}>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      
      <div className={styles.endGroup}>
        {actions && (
          <div className={styles.actions}>{actions}</div>
        )}
      </div>
    </header>
  );
};