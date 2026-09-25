/**
 * Safe parser helper to ensure we always have a valid Date object.
 * Returns null if the value is missing or invalid.
 */
function toValidDate(dateInput) {
  if (!dateInput) return null;
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * 1. Messenger Header / Activity Status
 * Outputs: "Active now", "Active 5 minutes ago", "Active yesterday", etc.
 */
export function formatLastActive(dateInput) {
  const date = toValidDate(dateInput);
  if (!date) return "Offline";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Active within the last 60 seconds
  if (diffInSeconds < 60) {
    return "Online";
  }

  const intervals = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
  ];

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      return `Online ${rtf.format(-count, interval.unit)}`;
    }
  }

  return "Online";
}

/**
 * 2. Message Bubble Timestamp
 * Outputs: "3:45 PM" (or 24-hr format depending on client locale)
 */
export function formatMessageTime(dateInput) {
  const date = toValidDate(dateInput);
  if (!date) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

/**
 * 3. Chat List Item Preview Timestamp (WhatsApp / Telegram style)
 * Outputs:
 * - "2:14 PM" (if sent today)
 * - "Yesterday" (if sent yesterday)
 * - "Wednesday" (if sent within the last 6 days)
 * - "Sep 22" (if older, current year)
 * - "Sep 22, 2024" (if previous year)
 */
export function formatChatListDate(dateInput) {
  const date = toValidDate(dateInput);
  if (!date) return "";

  const now = new Date();

  // Normalize midnight boundaries for day-to-day comparison
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffDays = Math.round((startOfToday - startOfTarget) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return formatMessageTime(date);
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
  }

  const isCurrentYear = date.getFullYear() === now.getFullYear();

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(isCurrentYear ? {} : { year: "numeric" }),
  }).format(date);
}

/**
 * 4. Message Day Dividers (Timeline separator pills between messages)
 * Outputs: "Today", "Yesterday", or "Monday, September 21, 2026"
 */
export function formatDayDivider(dateInput) {
  const date = toValidDate(dateInput);
  if (!date) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffDays = Math.round((startOfToday - startOfTarget) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  }).format(date);
}