/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number,
  options: {
    currency?: string;
    notation?: 'standard' | 'compact';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    currency = 'USD',
    notation = 'standard',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(
  value: number,
  options: {
    notation?: 'standard' | 'compact';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    notation = 'standard',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat('en-US', {
    notation,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Format a percentage value
 */
export function formatPercent(
  value: number,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    signDisplay?: 'auto' | 'always' | 'never';
  } = {}
): string {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
    signDisplay = 'auto',
  } = options;

  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
    signDisplay,
  }).format(value / 100);
}

/**
 * Format a date
 */
export function formatDate(
  date: Date | string,
  options: {
    format?: 'short' | 'medium' | 'long' | 'full';
    includeTime?: boolean;
  } = {}
): string {
  const { format = 'medium', includeTime = false } = options;

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const dateStyles: Record<string, Intl.DateTimeFormatOptions['dateStyle']> = {
    short: 'short',
    medium: 'medium',
    long: 'long',
    full: 'full',
  };

  const formatOptions: Intl.DateTimeFormatOptions = {
    dateStyle: dateStyles[format],
  };

  if (includeTime) {
    formatOptions.timeStyle = 'short';
  }

  return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count >= 1) {
      const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
      return rtf.format(-count, interval.label as Intl.RelativeTimeFormatUnit);
    }
  }

  return 'just now';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format a phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}
