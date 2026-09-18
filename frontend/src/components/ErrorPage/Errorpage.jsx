import styles from "./ErrorPage.module.css";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import { Link } from "react-router";

export default function ErrorPage() {
  
  return (
    <div className={`${styles.errorPage} flex-column`}>
      <h1 className={styles.errorMessage}>Oh no, this page doesn't exist!</h1>
      <Link to="/" replace className={`${styles.link} flex-row`} aria-label="Return to home">
        <img
          className={styles.returnImage}
          src={arrowLeft}
          alt=""
          width="24"
          height="24"
        />
      </Link>
    </div>
  );
};