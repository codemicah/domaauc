import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';

export function formatTimeRemaining(endDate: Date): string {
  const now = new Date();
  
  if (isAfter(now, endDate)) {
    return 'Expired';
  }
  
  return formatDistanceToNow(endDate, { addSuffix: true });
}

export function formatDateTime(date: Date): string {
  return format(date, 'PPpp');
}

export function isExpired(endDate: Date): boolean {
  return isAfter(new Date(), endDate);
}

export function isActive(startDate: Date, endDate: Date): boolean {
  const now = new Date();
  return isAfter(now, startDate) && isBefore(now, endDate);
}
