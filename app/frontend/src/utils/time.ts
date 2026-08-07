/**
 * Formats a date string into friendly relative time.
 * Examples:
 *   - "Just now" (< 45s)
 *   - "2 min ago" (2 - 59 mins)
 *   - "3 hrs ago" (1 - 23 hrs)
 *   - "Yesterday" (calendar yesterday)
 *   - "3 days ago" (2 - 6 days)
 *   - "Aug 3" / "Aug 3, 2026" (7+ days)
 */
export function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 45) return 'Just now';
    if (diffSec < 90) return '1 min ago';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 7200) return '1 hr ago';
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hrs ago`;

    // Check if calendar yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    const diffDays = Math.floor(diffSec / 86400);
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(date.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
    });
  } catch {
    return '';
  }
}
