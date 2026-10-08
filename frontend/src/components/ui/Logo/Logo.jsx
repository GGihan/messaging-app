import styles from "./Logo.module.css";
import logo from "@/assets/icons/logo.svg";

export default function Logo({ logoSize = '60', fontSize = '2.25rem', text = 'SmokeTrail' }) {

  return (
    <div
      className={`${styles.logo} flex-row`}
      style={{'fontSize': fontSize}}
    >
      <p className={styles.text}>{text}</p>
      <img
        className={styles.icon}
        src={logo}
        alt=""
        width={logoSize}
        height={logoSize}
        role="presentation"
      />
    </div>
  );
};