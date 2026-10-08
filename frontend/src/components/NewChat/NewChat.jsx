import { Link, useNavigate } from "react-router";
import TopAppBar from "../TopAppBar/TopAppBar";
import styles from "./NewChat.module.css";
import arrowLeft from "@/assets/icons/arrow-left.svg";
import { useState } from "react";
import Button from "../ui/Button/Button";
import personIcon from "@/assets/icons/person.svg";
import closeIcon from "@/assets/icons/close.svg";
import useSWR from "swr";
import SearchBar from "../ui/SearchBar/SearchBar";
import { chatHelper } from "@/utils/chatHelpers";
import { apiClient } from "@/config/api";
import { useChatStore } from "@/store/useChatStore";
import toast from "react-hot-toast";
import checkIcon from "@/assets/icons/check.svg";
import { useForm } from "react-hook-form";
import { FormActions } from "../FormActions/FormActions";
import { setFormApiErrors } from "@/utils/formErrors";
import groupIcon from "@/assets/icons/group.svg";

const userSearchFetcher = (url) => apiClient(url).then((res) => res.data.users);

export default function NewChat() {
  const [activePanel, setActivePanel] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(new Map());
  const [previewUrl, setPreviewUrl] = useState(null);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const navigate = useNavigate();

  const {
    data: users = [],
    error: usersError,
  } = useSWR(
    searchQuery.length >= 1 ? `/users?search=${encodeURIComponent(searchQuery)}` : null,
    userSearchFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    reValidateMode: 'onSubmit',
  });

  const togglePanel = (panelName) => {
    setActivePanel((current) => (current === panelName ? null : panelName));
  };

  const toggleUser = (user) => {
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      if (next.has(user.id)) {
        next.delete(user.id);
      } else {
        next.set(user.id, user);
      }
      return next;
    });
  };

  const removeUser = (userId) => {
    setSelectedUsers((prev) => {
      const next = new Map(prev);
      next.delete(userId);
      return next;
    });
  };

  const handleOpenDirectChat = async (user) => {
    try {
      const response = await apiClient(`/chats`, {
        method: 'POST',
        body: JSON.stringify({receiverId: user.id}),
      });

      const newChat = response.data.chat;
      navigate('/chats', { replace: true });
      setActiveChat(newChat.id);
    } catch (error) {
      toast.error(error.message || 'Could not block user');
    }
  };

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

      const selectedUserIds = Array.from(selectedUsers.keys());
      // Loop and append each ID under the same key with []
      selectedUserIds.forEach((id) => {
        formData.append('memberIds[]', id);
      });
      
      formData.append('name', data.name);

      const file = data.avatar?.[0];
      if (file) {
        formData.append('avatar', file); 
      }

      const response = await apiClient(`/chats/groups`, {
        method: 'POST',
        body: formData,
      });

      const newChat = response.data.chat;
      navigate('/chats', { replace: true });
      setActiveChat(newChat.id);
    } catch (error) {
      setFormApiErrors(error, setError);
    }
  };

  return (
    <div className={`${styles.tabWrapper} flex-column`}>
      <TopAppBar
        className={styles.appBar}
        leading={
          <Link
            className={styles.linkButton}
            to="/chats"
            aria-label="Back to chats"
          >
            <img
              className={styles.linkIcon}
              src={arrowLeft}
              alt=""
              width="24"
              height="24"
              aria-hidden="true"
            />
          </Link>
        }
        title={"Create new chat"}
      />

      <div className={`${styles.content} flex-column`}>
        <div className={`${styles.chatButtons} flex-column`}>
          <Button
            className={styles.actionButton}
            onClick={() => togglePanel("newDirectChat")}
            aria-label="Show new direct chat"
          >
            <img
              className={styles.buttonIcon}
              src={personIcon}
              alt=""
              width="24"
              height="24"
              aria-hidden="true"
            />
            <p>New direct chat</p>
          </Button>

          <Button
            className={styles.actionButton}
            onClick={() => togglePanel("newGroupChat")}
            aria-label="Show new group chat"
          >
            <img
              className={styles.buttonIcon}
              src={groupIcon}
              alt=""
              width="24"
              height="24"
              aria-hidden="true"
            />
            <p>New group chat</p>
          </Button>
        </div>

        {/* NewDirectChat */}
        {activePanel === "newDirectChat" && (
          <div className={styles.panel}>
            <TopAppBar
              title={"Select user"}
              actions={
                <Button
                  className={styles.actionButton}
                  onClick={() => setActivePanel(null)}
                  aria-label="Close new direct chat"
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

            <div className={`${styles.contentDirect} flex-column`}>
              <SearchBar
                placeholder="Search users..."
                onSearch={setSearchQuery}
                debounceMs={300}
              />

              <div className={`${styles.list} flex-column`}>
                {usersError && (
                  <div className={`error-message`}>
                    {usersError?.message || "Failed to load users."}
                  </div>
                )}

                {users?.map((user) => {
                  return (
                    <Button
                      key={user.id}
                      className={`${styles.userCard} flex-row`}
                      onClick={() => handleOpenDirectChat(user)}
                    >
                      <div className={styles.avatarWrapper}>
                        <img
                          className={styles.avatar}
                          src={chatHelper.determineUserAvatarUrl(user.profile?.avatarUrl)}
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
      
                      <p className={styles.name}>{user.profile.displayName}</p>
                    </Button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
  
        {/* NewGroupChat */}
        {activePanel === "newGroupChat" && (
          <div className={styles.panel}>
            <TopAppBar
              title={"Select users"}
              actions={
                <Button
                  className={styles.actionButton}
                  onClick={() => setActivePanel(null)}
                  aria-label="Close new group chat"
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

            <div className={`${styles.contentGroup} flex-column`}>
              <SearchBar
                placeholder="Search users..."
                onSearch={setSearchQuery}
                debounceMs={300}
              />

              {selectedUsers.size > 0 && (
                <div className={styles.selectedTray}>
                  {Array.from(selectedUsers.values()).map((user) => (
                    <div key={user.id} className={`${styles.userChip} flex-row`}>
                      <div className={styles.avatarWrapper}>
                        <img
                          className={styles.avatar}
                          src={chatHelper.determineUserAvatarUrl(user.profile?.avatarUrl)}
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
      
                      <p className={styles.name}>{user.profile.displayName}</p>
      
                      <Button
                        className={styles.removeChipButton}
                        onClick={() => removeUser(user.id)}
                        aria-label={`Remove ${user.username}`}
                      >
                        <img src={closeIcon} alt="" width="20" height="20" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className={`${styles.list} flex-column`}>
                {users?.map((user) => {
                  const isSelected = selectedUsers.has(user.id);
      
                  return (
                    <div
                      key={user.id}
                      className={`${styles.userCard} ${isSelected ? styles.selected : ""} flex-row`}
                      onClick={() => toggleUser(user)}
                      role="checkbox"
                      aria-checked={isSelected}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleUser(user);
                        }
                      }}
                    >
                      <div className={styles.avatarWrapper}>
                        <img
                          className={styles.avatar}
                          src={chatHelper.determineUserAvatarUrl(user.profile?.avatarUrl)}
                          alt=""
                          aria-hidden="true"
                        />
                      </div>
      
                      <p className={styles.name}>{user.profile.displayName}</p>
      
                      <div className={`${styles.checkbox} ${isSelected ? styles.checked : ""}`}>
                        {isSelected && (
                          <img src={checkIcon} alt="" width="16" height="16" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className={`${styles.footer} flex-row`}>
                <Button
                  className={styles.confirmButton}
                  onClick={() => togglePanel("groupDetails")}
                  disabled={selectedUsers.size === 0}
                  aria-label="Confirm users"
                >
                  Confirm {selectedUsers.size > 0 ? `(${selectedUsers.size})` : ""}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* groupDetails */}
        {activePanel === "groupDetails" && (
          <div className={styles.panel}>
            <TopAppBar
              title={"Group details"}
              actions={
                <Button
                  className={styles.actionButton}
                  onClick={() => setActivePanel(null)}
                  aria-label="Close group details"
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
                      src={previewUrl || groupIcon}
                      alt=""
                      width="100"
                      height="100"
                      aria-hidden="true"
                    />
                  </div>
                </div>
      
                <FormActions submitText="Create" isSubmitting={isSubmitting} />
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};