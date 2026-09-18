import styles from "./Register.module.css";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { apiClient } from "@/config/api.js";
import { handleApiFormErrors } from "@/utils/formErrors.js";
import AuthLayout from "../layout/AuthLayout/AuthLayout";
import { FormActions } from "../FormActions/FormActions";
import { FormErrors } from "../ui/FormErrors/FormErrors";
import { useState } from "react";

export default function Register() {
  const [serverErrors, setServerErrors] = useState([]);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    reValidateMode: 'onSubmit',
  });

  const navigate = useNavigate();

  const onSubmit = async (formData) => {
    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      navigate('/login', { replace: true });
    } catch (error) {
      handleApiFormErrors(error, setServerErrors);
    }
  };

  return (
    <AuthLayout 
      title="Create account"
      subtitle='Join the community and get connected!'
    >
      <div className={`${styles.registerContainer} flex-column`}>
        <h1 className={styles.title}>Register</h1>
        <FormErrors errors={serverErrors} />
        <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} flex-column`}>
          <div className={styles.formGroup}>
            <label htmlFor="username">Username</label>
            <input
              id='username'
              type='text'
              {...register('username')}
              placeholder="Username"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id='password'
              type='password'
              {...register('password')}
              placeholder="Choose password"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="passwordConfirm">Confirm password</label>
            <input
              id='passwordConfirm'
              type='password'
              {...register('passwordConfirm')}
              placeholder="Confirm password"
            /> 
          </div>

          <FormActions submitText="Register" isSubmitting={isSubmitting} />
        </form>
        <hr></hr>
      </div>
    </AuthLayout>
  );
};