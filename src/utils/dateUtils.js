import { format, formatDistanceToNow } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

// Mongolia timezone
const MONGOLIA_TIMEZONE = 'Asia/Ulaanbaatar';

// Format date in Mongolian format: 2025.06.27
export const formatMongolianDate = (date) => {
  const mongoliaTime = utcToZonedTime(new Date(date), MONGOLIA_TIMEZONE);
  return format(mongoliaTime, 'yyyy.MM.dd');
};

// Format time in 24-hour format
export const formatMongolianTime = (date) => {
  const mongoliaTime = utcToZonedTime(new Date(date), MONGOLIA_TIMEZONE);
  return format(mongoliaTime, 'HH:mm');
};

// Format relative time (e.g., "2 minutes ago")
export const formatRelativeTime = (date) => {
  const mongoliaTime = utcToZonedTime(new Date(date), MONGOLIA_TIMEZONE);
  return formatDistanceToNow(mongoliaTime, { addSuffix: true });
};

// Format full date and time
export const formatFullDateTime = (date) => {
  const mongoliaTime = utcToZonedTime(new Date(date), MONGOLIA_TIMEZONE);
  return format(mongoliaTime, 'yyyy.MM.dd HH:mm');
};

// Check if date is today
export const isToday = (date) => {
  const today = new Date();
  const mongoliaTime = utcToZonedTime(new Date(date), MONGOLIA_TIMEZONE);
  const mongoliaToday = utcToZonedTime(today, MONGOLIA_TIMEZONE);
  
  return format(mongoliaTime, 'yyyy-MM-dd') === format(mongoliaToday, 'yyyy-MM-dd');
};

// Check if date is yesterday
export const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const mongoliaTime = utcToZonedTime(new Date(date), MONGOLIA_TIMEZONE);
  const mongoliaYesterday = utcToZonedTime(yesterday, MONGOLIA_TIMEZONE);
  
  return format(mongoliaTime, 'yyyy-MM-dd') === format(mongoliaYesterday, 'yyyy-MM-dd');
};

// Get display date for chat list
export const getDisplayDate = (date) => {
  if (isToday(date)) {
    return formatMongolianTime(date);
  } else if (isYesterday(date)) {
    return 'Өчигдөр'; // Yesterday in Mongolian
  } else {
    return formatMongolianDate(date);
  }
};

// Format short relative time (e.g., '17h', '2d', '1w')
export const formatShortRelativeTime = (date) => {
  const mongoliaTime = utcToZonedTime(new Date(date), MONGOLIA_TIMEZONE);
  const now = utcToZonedTime(new Date(), MONGOLIA_TIMEZONE);
  const diffMs = now - mongoliaTime;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w`;
}; 