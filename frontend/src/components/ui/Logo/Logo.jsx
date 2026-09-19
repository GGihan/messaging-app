import styles from "./Logo.module.css";
import logo from "@/assets/icons/logo.svg";

export default function Logo({ size = '60', text = 'SmokeSignal' }) {

  return (
    <div className={`${styles.logo} flex-row`}>
      <p className={styles.text}>{text}</p>
      <img
        className={styles.icon}
        src={logo}
        alt=""
        width={size}
        height={size}
        role="presentation"
      />
    </div>
  );
};