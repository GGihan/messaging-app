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

export default function MemberList({ members, onClose }) {
  const { user } = useAuth();
  const currentMember = members?.find((member) => member.user.id === user.id);
  const isCurrentUserAdmin = currentMember.role === "ADMIN";

  const handleDemoteMember = () => {
    // Demote member
  };

  const handlePromoteMember = () => {
    // Promote member
  };

  const handleRemoveMember = () => {
    // Remove member
  };

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

      {/* Add search bar here */}
      <div className={styles.searchBar}>
        <p>SEARCH BAR</p>
      </div>

      <div className={styles.list}>
        {members?.map((member) => (
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
                <p className={styles.name}>{member.user.profile?.displayName}</p>
                <p className={styles.role}>{member.role}</p>
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
                    {member.role === "ADMIN" ? (
                      <DropdownMenuItem variant="danger" onSelect={handleDemoteMember}>
                        Demote member
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onSelect={handlePromoteMember}>
                          Promote member
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem variant="danger" onSelect={handleRemoveMember}>
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
  );
};