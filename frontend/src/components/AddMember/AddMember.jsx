import { useState } from "react";
import TopAppBar from "../TopAppBar/TopAppBar";
import Button from "../ui/Button/Button";
import styles from "./AddMember.module.css";
import closeIcon from "@/assets/icons/close.svg";
import useSWR from "swr";
import { apiClient } from "@/config/api";
import SearchBar from "../ui/SearchBar/SearchBar";
import { chatHelper } from "@/utils/chatHelpers";
import checkIcon from "@/assets/icons/check.svg";
import { handleApiFormErrors } from "@/utils/formErrors";
import { FormErrors } from "../ui/FormErrors/FormErrors";

const userSearchFetcher = (url) => apiClient(url).then((res) => res.data.users);

export default function AddMember({ chat, onClose, refetchChat }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState(new Map());
  const [serverErrors, setServerErrors] = useState([]);

  const {
    data: users = [],
    error: usersError,
    // isValidating: isValidatingUsers,
  } = useSWR(
    searchQuery.length >= 1 ? `/users?search=${encodeURIComponent(searchQuery)}` : null,
    userSearchFetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

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

  const existingMemberIds = new Set(
    chat?.members?.map((member) => member.userId)
  );

  const availableUsers = users.filter(
    (user) => !existingMemberIds.has(user.id)
  );

  const handleAddMember = async (selectedUserIds) => {
    try {
      await apiClient(`/chats/${chat.id}/members`, {
        method: 'POST',
        body: JSON.stringify({userIds: selectedUserIds}),
      });

      refetchChat();
      onClose();
    } catch (error) {
      handleApiFormErrors(error, setServerErrors); 
    }
  };

  if (usersError) {
    return (
      <div className={`${styles.windowWrapper} error-message`}>
        {usersError?.message || "Failed to load users."}
      </div>
    ); 
  }

  return (
    <div className={styles.windowWrapper}>
      <TopAppBar
        className={styles.topBar}
        title={"Add members"}
        actions={
          <Button
            className={styles.actionButton}
            onClick={onClose}
            aria-label="Close add member"
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

      <div className={`${styles.content} flex-column`}>
        <SearchBar
          placeholder="Search users..."
          onSearch={setSearchQuery}
          debounceMs={300}
        />

        <FormErrors errors={serverErrors} />

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
          {availableUsers?.map((user) => {
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
            className={styles.addButton}
            onClick={() => handleAddMember(Array.from(selectedUsers.keys()))}
            disabled={selectedUsers.size === 0}
            aria-label="Add users"
          >
            Add {selectedUsers.size > 0 ? `(${selectedUsers.size})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
};