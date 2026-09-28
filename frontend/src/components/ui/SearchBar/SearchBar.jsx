import { useEffect, useState } from "react";
import styles from "./SearchBar.module.css";
import searchIcon from "@/assets/icons/search.svg";
import closeIcon from "@/assets/icons/close.svg";
import Button from "../Button/Button";

export default function SearchBar({
  placeholder = "Search...",
  onSearch,
  debounceMs = 300,
  className = "",
}) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(searchTerm.trim());
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchTerm, debounceMs, onSearch]);

  const handleClear = () => {
    setSearchTerm("");
    onSearch("");
  };

  return (
    <label htmlFor="search-input" className={`${styles.searchWrapper} ${className} flex-row`}>
      <img
        src={searchIcon}
        alt=""
        width="24"
        height="24"
        aria-hidden="true"
        className={styles.searchIcon}
      />
      <input
        className={styles.input}
        id="search-input"
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
      />
      {searchTerm && (
        <Button
          type="button"
          onClick={handleClear}
          className={styles.clearButton}
          aria-label="Clear search"
        >
          <img
            src={closeIcon}
            alt=""
            width="24"
            height="24"
            aria-hidden="true"
          />
        </Button>
      )}
    </label>
  );
}