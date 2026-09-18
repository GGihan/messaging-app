import { Link } from "react-router";
import Button from "@/components/ui/Button/Button";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import styles from "./FormActions.module.css";

export const FormActions = ({ submitText, isSubmitting }) => {

  return (
    <div className={`${styles.formActions} flex-row`}>
      <Link to="/" replace className={styles.returnLink} aria-label="Return to home">
        <img
          className={styles.returnImage}
          src={arrowLeft}
          alt=""
          width="24"
          height="24"
          aria-hidden="true"
        />
      </Link>

      <Button className={styles.submitButton} type="submit" isLoading={isSubmitting}>
        {submitText}
      </Button>
    </div>
  );
};