import Logo from "../ui/Logo/Logo";
import styles from "./Header.module.css";

export default function Header() {
  
  return (
    <header className={`${styles.headerContainer} flex-row`}>
      <Logo fontSize={"1rem"} logoSize={"25"} />
    </header>
  );
};