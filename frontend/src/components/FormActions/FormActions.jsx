import Button from "@/components/ui/Button/Button";
import styles from "./FormActions.module.css";

export const FormActions = ({ submitText, isSubmitting }) => {

  return (
    <div className={`${styles.formActions} flex-row`}>
      <Button className={styles.submitButton} type="submit" isLoading={isSubmitting}>
        {submitText}
      </Button>
    </div>
  );
};