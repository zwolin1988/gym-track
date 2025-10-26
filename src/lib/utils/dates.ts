/**
 * Date and number formatting utilities
 */

/**
 * Oblicza dat X dni wstecz od dzisiaj
 */
export function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Formatuje dat do polskiego formatu
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formatuje godzin
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Formatuje czas trwania (minuty) do formatu "Xh Ymin" lub "Xmin"
 */
export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes}min`;
}

/**
 * Formatuje liczb z separatorem tysicy
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("pl-PL").format(num);
}
