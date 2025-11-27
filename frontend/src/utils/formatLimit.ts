/**
 * Format a limit value, showing "Unlimited" for -1
 */
export function formatLimit(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '0';
  }
  if (value === -1) {
    return 'Unlimited';
  }
  return value.toString();
}

/**
 * Format a limit value with a label
 */
export function formatLimitWithLabel(value: number | null | undefined, label: string): string {
  const formatted = formatLimit(value);
  return `${formatted} ${label}`;
}

