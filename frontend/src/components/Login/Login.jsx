import styles from "./Login.module.css";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { FormActions } from "../FormActions/FormActions";
import { FormErrors } from "../ui/FormErrors/FormErrors";
import { apiClient } from "@/config/api";
import { handleApiFormErrors } from "@/utils/formErrors";
import AuthLayout from "../layout/AuthLayout/AuthLayout";


export default function Login() {
  const [serverErrors, setServerErrors] = useState([]);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    reValidateMode: 'onSubmit',
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (formData) => {
    try {
      const userData = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      login(userData);
      navigate('/', { replace: true });
    } catch (error) {
      handleApiFormErrors(error, setServerErrors);
    }
  };

  return (
    <AuthLayout>
      <div className={`${styles.loginContainer} flex-column`}>
        <h1 className={styles.title}>Login</h1>
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
              placeholder="Enter password"
            />
          </div>
          <FormActions submitText="Login" isSubmitting={isSubmitting} />
        </form>
        <hr></hr>
      </div>
    </AuthLayout>
  );
};