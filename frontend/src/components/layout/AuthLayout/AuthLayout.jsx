import styles from "./AuthLayout.module.css";
import background from "@/assets/images/background-filler.webp";

export default function AuthLayout ({
  title = "Welcome back",
  subtitle = "Log in to start chatting",
  bgImage = background,
  children,
}) {

  return (
    <div className={styles.fullDisplay}>
      <div className={styles.heroPanel}>
        <div className={styles.bgWrapper}>
          <img
            src={bgImage}
            alt=""
            className={styles.bgImage}
            role="presentation"
          />
          <div className={styles.overlay} />
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </div>

      {/* Right Panel: Form Area */}
      <div className={`${styles.formPanel} flex-column`}>
        <div className={`${styles.formContainer} flex-row`}>
          {/* Form component (LoginForm, RegisterForm, etc.) renders here */}
          {children}
        </div>
      </div>
    </div>
  );
};