import { useForm } from "react-hook-form";
import { FormActions } from "../FormActions/FormActions";
import TopAppBar from "../TopAppBar/TopAppBar";
import Button from "../ui/Button/Button";
import styles from "./EditGroup.module.css";
import closeIcon from "@/assets/icons/close.svg";
import { apiClient } from "@/config/api";
import { useState } from "react";
import { setFormApiErrors } from "@/utils/formErrors";

export default function EditGroup({ chat, onClose, refetchChat }) {
  const [previewUrl, setPreviewUrl] = useState(chat?.avatarUrl || null);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: chat?.name || "",
    },
    reValidateMode: 'onSubmit',
  });

  // Handle local image preview when user picks a file
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      formData.append('name', data.name);

      const file = data.avatar?.[0];
      if (file) {
        formData.append('avatar', file); 
      }

      await apiClient(`/chats/${chat.id}`, {
        method: 'PATCH',
        body: formData,
      });

      refetchChat();
      onClose();
    } catch (error) {
      setFormApiErrors(error, setError);
    }
  };

  return (
    <div className={`${styles.windowWrapper} flex-column`}>
      <TopAppBar
        className={styles.topBar}
        title={"Edit Group"}
        actions={
          <Button
            className={styles.actionButton}
            onClick={onClose}
            aria-label="Close edit group"
          >
            <img
              className={styles.buttonIcon}
              src={closeIcon}
              alt=""
              width="24"
              height="24"
              aria-hidden="true"
            />
          </Button>
        }
      />

      <div className={styles.formWrapper}>
        <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} flex-column`}>
          {errors.root?.serverError && (
            <p className="error-box">{errors.root.serverError.message}</p>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="name">Group name</label>
            <input
              id='name'
              type='text'
              {...register('name')}
            />
            {errors.name && <p className="error-message">{errors.name.message}</p>}
          </div>

          <div className={`${styles.formGroup} ${styles.fileGroup}`}>
            <label htmlFor="avatar">Group avatar</label>
            <input
              id='avatar'
              type='file'
              {...register('avatar', {
                onChange: handleFileChange,
                validate: {
                  lessThan10MB: (files) =>
                    !files?.[0] ||
                    files[0].size <= 10 * 1024 * 1024 ||
                    'Image must be smaller than 10MB',
                },
              })}
            />
            {errors.avatar && <p className="error-message">{errors.avatar.message}</p>}
          </div>

          <div className={`${styles.preview} flex-row`}>
            <div className={styles.avatarWrapper}>
              <img
                className={styles.previewAvatar}
                src={previewUrl}
                alt=""
                width="100"
                height="100"
                aria-hidden="true"
              />
            </div>
          </div>

          <FormActions submitText="Save" isSubmitting={isSubmitting} />
        </form>
      </div>
    </div>
  );
};