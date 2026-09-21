import { NavLink, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import Button from "../ui/Button/Button";
import styles from "./MainNav.module.css";
import home from "@/assets/icons/home.svg";
import register from "@/assets/icons/sign-up.svg";
import login from "@/assets/icons/log-in.svg";
import logoutIcon from "@/assets/icons/log-out.svg";

export default function MainNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  }

  const navLinks = [
    { to: "/", label: "Home", icon: home, show: true },
    { to: "/register", label: "Register", icon: register, show: !user },
    { to: "/login", label: "Login", icon: login, show: (!user) },
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
          <li className={styles.menuItem}>
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