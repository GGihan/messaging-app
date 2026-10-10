import { chatHelper } from "@/utils/chatHelpers";
import TopAppBar from "../TopAppBar/TopAppBar";
import styles from "./Profile.module.css";
import { useAuth } from "@/hooks/useAuth";
import Button from "../ui/Button/Button";
import addImageIcon from "@/assets/icons/image-add.svg";
import deleteIcon from "@/assets/icons/delete.svg";
import { FormActions } from "../FormActions/FormActions";
import { apiClient } from "@/config/api";
import { setFormApiErrors } from "@/utils/formErrors";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useRef, useState } from "react";

export default function Profile() {
  const { user, mutateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      displayName: user.profile?.displayName || "",
      bio: user.profile?.bio || "",
    },
    reValidateMode: 'onSubmit',
  });

  const onSubmit = async (formData) => {
    try {
      await apiClient(`/profile`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });

      await mutateUser();
    } catch (error) {
      setFormApiErrors(error, setError);
    }
  };

  const handleSelectAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setIsUploadingAvatar(true);

    try {
      await apiClient('/profile', {
        method: 'PATCH',
        body: formData,
      });

      toast.success('Avatar updated');
      await mutateUser();
    } catch (error) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await apiClient(`/profile/avatar`, {
        method: 'DELETE',
      });

      await mutateUser();
    } catch (error) {
      toast.error(error.message || "Could not delete avatar");
    }
  };

  return (
    <div className={`${styles.tabWrapper} flex-column`}>
      <TopAppBar
        title={"Profile"}
      />

      <div className={`${styles.content} flex-column`}>
        <div className={`${styles.avatarGroup} flex-column`}>
          <div className={`${styles.avatarWrapper} flex-column`}>
            <img
              className={styles.avatar}
              src={chatHelper.determineUserAvatarUrl(user.profile?.avatarUrl)}
              alt=""
              aria-hidden="true"
            />
          </div>

          <div className={`${styles.actionsGroup} flex-row`}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              style={{ display: 'none' }}
            />

            <Button
              className={styles.actionButton}
              onClick={handleSelectAvatar}
              aria-label="Select avatar"
              isLoading={isUploadingAvatar}
              title="Select"
            >
              <img
                className={styles.buttonIcon}
                src={addImageIcon}
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
            </Button>

            <Button
              className={styles.actionButton}
              onClick={handleDeleteAvatar}
              aria-label="Delete avatar"
              title="Delete"
            >
              <img
                className={styles.buttonIcon}
                src={deleteIcon}
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className={`${styles.form} flex-column`}>
          {errors.root?.serverError && (
            <p className="error-box">{errors.root.serverError.message}</p>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="name">Display name</label>
            <input
              id='name'
              type='text'
              {...register('displayName')}
            />
            {errors.displayName && <p className="error-message">{errors.displayName.message}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio" className={styles.bioLabel}>Bio</label>
            <textarea
              id="bio"
              {...register('bio')}
              rows={6}
              maxLength={100}
              className={styles.bioTextarea}
            />
            {errors.bio && <p className="error-message">{errors.bio.message}</p>}
          </div>

          <FormActions submitText="Save" isSubmitting={isSubmitting} />
        </form>
      </div>
    </div>
  );
};