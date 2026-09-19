import styles from "./Login.module.css";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { FormActions } from "../FormActions/FormActions";
import { FormErrors } from "../ui/FormErrors/FormErrors";
import { apiClient } from "@/config/api";
import { handleApiFormErrors } from "@/utils/formErrors";
import AuthLayout from "../layout/AuthLayout/AuthLayout";
import Logo from "../ui/Logo/Logo";

export default function Login() {
  const [serverErrors, setServerErrors] = useState([]);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    reValidateMode: 'onSubmit',
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (formData) => {
    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      login(response.data.user);
      navigate('/', { replace: true });
    } catch (error) {
      handleApiFormErrors(error, setServerErrors);
    }
  };

  return (
    <AuthLayout>
      <div className={`${styles.loginContainer} flex-column`}>
        <div className={`${styles.header} flex-row`}>
          <Logo />
        </div>
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
        <div className={`${styles.authFooter} flex-row`}>
          <p className={styles.prompt}>Don't have an account?</p>
          <Link to="/register" className={styles.actionLink}>
            Register here
          </Link>
        </div>
        <hr></hr>
      </div>
    </AuthLayout>
  );
};