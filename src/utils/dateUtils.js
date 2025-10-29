import dayjs from 'dayjs';

/**
 * Detects the user's timezone
 * @returns {string} - User's timezone identifier (e.g., 'America/New_York')
 */
export const getUserTimezone = () => {
  try {
    // Try to get timezone from Intl API
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    // Fallback to UTC if timezone detection fails
    console.warn('Failed to detect user timezone, falling back to UTC:', error);
    return 'UTC';
  }
};

/**
 * Formats a Unix timestamp to a localized date string in user's timezone
 * @param {number} timestamp - Unix timestamp in seconds
 * @param {string} format - Format type: 'short', 'long', 'time-only'
 * @returns {string} - Formatted date string in user's local timezone
 */
export const formatDateTime = (timestamp, format = 'short') => {
  if (!timestamp) {
    return 'Invalid Date';
  }

  try {
    // Use Intl.DateTimeFormat for reliable timezone conversion
    const date = new Date(timestamp * 1000);
    const userTimezone = getUserTimezone();

    console.log('User timezone:', userTimezone);
    console.log('Original timestamp:', timestamp);
    console.log('Date object (UTC):', date.toISOString());

    switch (format) {
      case 'long':
        const longFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const longResult = longFormatter.format(date);
        console.log('Long format result:', longResult);
        return longResult;

      case 'time-only':
        const timeFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: '2-digit',
          minute: '2-digit'
        });
        const timeResult = timeFormatter.format(date);
        console.log('Time-only format result:', timeResult);
        return timeResult;

      case 'short':
      default:
        const shortFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const shortResult = shortFormatter.format(date);
        console.log('Short format result:', shortResult);
        return shortResult;
    }
  } catch (error) {
    console.warn('Error formatting date with timezone, falling back to local time:', error);
    // Fallback to browser's default local timezone using Intl.DateTimeFormat
    const date = new Date(timestamp * 1000);

    switch (format) {
      case 'long':
        const localLongFormatter = new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        return localLongFormatter.format(date);

      case 'time-only':
        const localTimeFormatter = new Intl.DateTimeFormat('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
        return localTimeFormatter.format(date);

      case 'short':
      default:
        const localShortFormatter = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        return localShortFormatter.format(date);
    }
  }
};

/**
 * Formats a Unix timestamp to just the time in user's timezone
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} - Formatted time string in user's local timezone
 */
export const formatTime = (timestamp) => {
  return formatDateTime(timestamp, 'time-only');
};

/**
 * Filters matches to only include those happening today (in user's timezone)
 * @param {Array} matches - Array of match objects with timestamp property
 * @returns {Array} - Filtered array of matches happening today
 */
export const filterTodayMatches = (matches) => {
  if (!Array.isArray(matches)) {
    return [];
  }

  return matches.filter(match => {
    if (!match || !match.timestamp) {
      return false;
    }

    return isToday(match.timestamp);
  });
};

/**
 * Checks if a given timestamp corresponds to today's date in user's timezone
 * @param {number} timestamp - Unix timestamp
 * @returns {boolean} - True if timestamp is today in user's timezone
 */
export const isToday = (timestamp) => {
  if (!timestamp) {
    return false;
  }

  try {
    const userTimezone = getUserTimezone();
    console.log('isToday - User timezone:', userTimezone);
    console.log('isToday - Timestamp:', timestamp);

    const matchDate = new Date(timestamp * 1000);
    console.log('isToday - Match date object:', matchDate);

    // Get current date in user's timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });

    const todayInTimezone = formatter.format(now);
    console.log('isToday - Today in timezone:', todayInTimezone);

    const matchDateInTimezone = formatter.format(matchDate);
    console.log('isToday - Match date in timezone:', matchDateInTimezone);

    const isTodayResult = todayInTimezone === matchDateInTimezone;
    console.log('isToday - Result:', isTodayResult);

    return isTodayResult;
  } catch (error) {
    console.warn('Error checking if timestamp is today, falling back to local timezone:', error);
    // Fallback to local timezone
    const matchDate = new Date(timestamp * 1000);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

    return matchDate >= startOfToday && matchDate < startOfTomorrow;
  }
};

/**
 * Gets the current date and time in user's timezone for debugging
 * @returns {string} - Current date/time in user's timezone
 */
export const getCurrentLocalTime = () => {
  try {
    const userTimezone = getUserTimezone();
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return formatter.format(now) + ` (${userTimezone})`;
  } catch (error) {
    console.warn('Error getting current local time:', error);
    return new Date().toLocaleString();
  }
};

/**
 * Test function to debug timezone conversion issues
 * @param {number} timestamp - Unix timestamp to test
 */
export const testTimezoneConversion = (timestamp) => {
  console.log('=== TIMEZONE CONVERSION TEST ===');
  console.log('Input timestamp:', timestamp);

  const date = new Date(timestamp * 1000);
  console.log('Date object:', date);
  console.log('Date.toISOString():', date.toISOString());

  const userTimezone = getUserTimezone();
  console.log('User timezone:', userTimezone);

  // Test different methods
  console.log('--- Testing toLocaleString with timezone ---');
  try {
    const localeString = date.toLocaleString('en-US', { timeZone: userTimezone });
    console.log('toLocaleString result:', localeString);
  } catch (e) {
    console.error('toLocaleString failed:', e);
  }

  console.log('--- Testing toLocaleDateString with timezone ---');
  try {
    const dateString = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: userTimezone
    });
    console.log('toLocaleDateString result:', dateString);
  } catch (e) {
    console.error('toLocaleDateString failed:', e);
  }

  console.log('--- Testing Intl.DateTimeFormat ---');
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const intlResult = formatter.format(date);
    console.log('Intl.DateTimeFormat result:', intlResult);
  } catch (e) {
    console.error('Intl.DateTimeFormat failed:', e);
  }

  console.log('=== END TEST ===');
};
