/**
 * Parses a date string in DD-MM-YYYY format or fallback to native Date parsing.
 * @param dateStr Date string to parse
 * @returns Date object or null
 */
export const parseExpiryDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr || dateStr === 'Lifetime') return null;
  
  // Try parsing DD-MM-YYYY
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed months
    const year = parseInt(parts[2], 10);
    
    // Ensure all parts are numbers and form a valid date
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Fallback to native Date parsing
  const fallbackDate = new Date(dateStr);
  return isNaN(fallbackDate.getTime()) ? null : fallbackDate;
};

/**
 * Checks if a date string is within a certain number of days from now.
 * @param expiryDateStr Expiry date string
 * @param days Number of days to check
 * @returns true if within 'days' from now, false otherwise
 */
export const isExpiringSoon = (expiryDateStr: string | undefined | null, days: number = 7): boolean => {
  const expiryDate = parseExpiryDate(expiryDateStr);
  if (!expiryDate) return false;
  
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= days && diffDays > 0;
};

/**
 * Checks if a date string is expired compared to now.
 * @param expiryDateStr Expiry date string
 * @returns true if expired, false otherwise
 */
export const isExpired = (expiryDateStr: string | undefined | null): boolean => {
  const expiryDate = parseExpiryDate(expiryDateStr);
  if (!expiryDate) return false;
  return expiryDate < new Date();
};
