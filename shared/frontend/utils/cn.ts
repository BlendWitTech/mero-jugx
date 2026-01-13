/**
 * Utility function to merge class names
 * Simplified version to avoid external dependencies in System Admin
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

