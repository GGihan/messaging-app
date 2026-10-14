import { useAuth } from "@/hooks/useAuth";
import styles from "./MemberList.module.css";
import TopAppBar from "../../TopAppBar/TopAppBar";
import Button from "../../ui/Button/Button";
import closeIcon from "@/assets/icons/close.svg";
import moreVert from "@/assets/icons/more-vert.svg";
import { chatHelper } from "@/utils/chatHelpers";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../ui/DropdownMenu/DropdownMenu";
import { useState } from "react";
import SearchBar from "@/components/ui/SearchBar/SearchBar";
import { apiClient } from "@/config/api";
import { handleApiFormErrors } from "@/utils/formErrors";
import { FormErrors } from "@/components/ui/FormErrors/FormErrors";

export default function MemberList({ chat, onClose, refetchChat }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [serverErrors, setServerErrors] = useState([]);
  const members = chat?.members;
  const currentMember = members?.find((member) => member.user.id === user.id);
  const isCurrentUserAdmin = currentMember?.role === "ADMIN";

  const handleUpdateMemberRole = async (memberId, role) => {
    try {
      await apiClient(`/chats/${chat.id}/members/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({role})
      });

      refetchChat();
    } catch (error) {
      handleApiFormErrors(error, setServerErrors); 
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      await apiClient(`/chats/${chat.id}/members/${memberId}`, {
        method: 'DELETE',
      });

      refetchChat();
    } catch (error) {
      handleApiFormErrors(error, setServerErrors); 
    }
  };

  // Client-side filtering in memory:
  const filteredMembers = members?.filter((member) => {
    const name = member.user.profile.displayName || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.memberListWrapper}>
      <TopAppBar
        className={styles.topBar}
        title={"Group Members"}
        actions={
          <Button
            className={styles.actionButton}
            onClick={onClose}
            aria-label="Close member list"
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
          placeholder="Filter members..."
          onSearch={setSearchQuery}
          debounceMs={0}
        />

        <FormErrors errors={serverErrors} />

        <div className={`${styles.list} flex-column`}>
          {filteredMembers?.map((member) => (
            <div key={member.id} className={`${styles.memberCard} flex-row`}>
              <div className={`${styles.startGroup} flex-row`}>
                <div className={styles.avatarWrapper}>
                  <img
                    className={styles.avatar}
                    src={chatHelper.determineUserAvatarUrl(member.user.profile?.avatarUrl)}
                    alt=""
                    aria-hidden="true"
                  />
                </div>

                <div className={`${styles.infoGroup} flex-column`}>
                  <p className={styles.name}>{member?.user?.profile?.displayName}</p>
                  <p className={styles.role}>{member?.role}</p>
                </div>
              </div>

              <div className={`${styles.endGroup} flex-row`}>
                {/* Check if member is not me and if I am admin */}
                {(!(user.id === member.user.id) && isCurrentUserAdmin) && (
                  <DropdownMenuRoot>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className={styles.actionButton}
                        aria-label="Member options"
                      >
                        <img
                          className={styles.buttonIcon}
                          src={moreVert}
                          alt=""
                          width="24"
                          height="24"
                          aria-hidden="true"
                        />
                      </Button>
                    </DropdownMenuTrigger>
      
                    <DropdownMenuContent>
                      {member?.role === "ADMIN" ? (
                        <DropdownMenuItem
                          variant="danger"
                          onSelect={() => handleUpdateMemberRole(member.id, "MEMBER")}
                        >
                          Demote member
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem
                            onSelect={() => handleUpdateMemberRole(member.id, "ADMIN")}
                          >
                            Promote member
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                        </>
                      )}

                      <DropdownMenuItem
                        variant="danger"
                        onSelect={() => handleRemoveMember(member.id)}
                      >
                        Remove member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenuRoot>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};