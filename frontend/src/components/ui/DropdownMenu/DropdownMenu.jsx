import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import styles from "./DropdownMenu.module.css";

export const DropdownMenuTrigger = RadixDropdown.Trigger;

export function DropdownMenuRoot({ children, modal = false, ...props }) {
  return (
    <RadixDropdown.Root modal={modal} {...props}>
      {children}
    </RadixDropdown.Root>
  );
}

export function DropdownMenuContent({ children, align = "end", sideOffset = 4, className = "", ...props }) {
  return (
    <RadixDropdown.Portal>
      <RadixDropdown.Content
        align={align}
        sideOffset={sideOffset}
        className={`${styles.content} ${className}`}
        {...props}
      >
        {children}
      </RadixDropdown.Content>
    </RadixDropdown.Portal>
  );
};

export function DropdownMenuItem({ children, variant = "default", className = "", ...props }) {
  const variantClass = variant === "danger" ? styles.danger : "";

  return (
    <RadixDropdown.Item
      className={`${styles.item} ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </RadixDropdown.Item>
  );
};

export function DropdownMenuSeparator({ className = "", ...props }) {
  return (
    <RadixDropdown.Separator
      className={`${styles.separator} ${className}`}
      {...props}
    />
  );
};