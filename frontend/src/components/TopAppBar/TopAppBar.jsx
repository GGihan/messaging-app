import styles from "./TopAppBar.module.css";

export default function TopAppBar({ 
  title,
  leading,
  actions,
}) {

  return (
    <header className={styles.barWrapper}>
      <div className={styles.leadingGroup}>
        {leading && <div className={styles.leadingSlot}>{leading}</div>}
        <h2 className={styles.title}>{title}</h2>
      </div>
      {actions && (
        <div className={styles.actionsWrapper}>
          {actions}
        </div>
      )}
    </header>
  );
};