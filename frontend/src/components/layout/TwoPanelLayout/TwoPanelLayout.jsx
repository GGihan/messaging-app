import styles from './TwoPanelLayout.module.css';

export const TwoPanelLayout = ({
  leftPanel,
  rightPanel,
  className = '',
}) => {
  return (
    <div className={`${styles.pageWrapper} ${className} flex-row`}>
      <div className={`${styles.splitCard} flex-column`}>
        <section className={`${styles.leftPanel} flex-column`}>
          {leftPanel}
        </section>
        <section className={`${styles.rightPanel} flex-column`}>
          {rightPanel}
        </section>
      </div>
    </div>
  );
};