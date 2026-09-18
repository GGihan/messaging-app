import styles from "./Footer.module.css";
import github from "@/assets/icons/github.svg";
import linkedin from "@/assets/icons/linkedin.svg";
import xcom from "@/assets/icons/xcom.svg";

const SOCIAL_LINKS = [
  {
    name: "GitHub",
    url: "https://github.com/GGihan",
    icon: github,
    label: "GitHub profile (opens in a new tab)",
  },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/",
    icon: linkedin,
    label: "LinkedIn homepage (opens in a new tab)",
  },
  {
    name: "X",
    url: "https://x.com/",
    icon: xcom,
    label: "X homepage (opens in a new tab)",
  },
];

export default function Footer() {
  return (
    <footer>
      <nav className={styles.socials} aria-label="Social media links">
        <ul className={`${styles.socialsList} flex-row`}>
          {SOCIAL_LINKS.map((link) => (
            <li key={link.name} className={styles.socialsItem}>
              <a
                className={styles.socialsLink}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={link.label}
              >
                <img
                  className={styles.socialsIcon}
                  src={link.icon}
                  alt=""
                  width="24"
                  height="24"
                  role="presentation"
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p>@GGihan</p>
    </footer>
  );
}