import { NavLink, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import Button from "../ui/Button/Button";
import styles from "./MainNav.module.css";
import chat from "@/assets/icons/chat.svg";
import friends from "@/assets/icons/friends-list.svg";
import logoutIcon from "@/assets/icons/log-out.svg";
import { useChatStore } from "@/store/useChatStore";

export default function MainNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const closeChat = useChatStore((state) => state.closeChat);

  const handleLogout = () => {
    logout();
    closeChat();
    navigate('/', { replace: true });
  }

  const navLinks = [
    { to: "/chats", label: "Chats", icon: chat, show: true },
    { to: "/friends", label: "Friends", icon: friends, show: true },
  ];

  return (
    <nav className={styles.navContainer}>
      <ul className={styles.menuList}>
        {navLinks
          .filter((link) => link.show)
          .map((link) => (
            <li key={link.label} className={styles.menuItem}>
              <NavLink to={link.to} className={styles.linkGroup}>
                <img
                  className={styles.linkIcon}
                  src={link.icon}
                  alt=""
                  width="24"
                  height="24"
                  aria-hidden="true"
                />
                <p className={styles.linkText}>{link.label}</p>
              </NavLink>
            </li>
          ))}

        {user && (
          <li className={`${styles.menuItem} flex-row`}>
            <Button className={styles.logoutButton} onClick={handleLogout}>
              <img
                className={styles.linkIcon}
                src={logoutIcon}
                alt=""
                width="24"
                height="24"
                aria-hidden="true"
              />
              <p className={styles.linkText}>Logout</p>
            </Button>
          </li>
        )}
      </ul>
    </nav>
  );
};