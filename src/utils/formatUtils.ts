import { Language } from '../types';

/**
 * Formats a category string into a human-readable header by capitalizing
 * the first letter of each word (e.g. "diesel expense" -> "Diesel Expense").
 * @param category Category string to format
 * @returns Formatted category header, or an empty string if category is falsy
 */
export const formatCategoryHeader = (category: string | null): string => {
  if (!category) return '';
  return category
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const digitMaps: Record<Language, string[]> = {
  en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  bn: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
  ar: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
  hi: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
};

/**
 * Translates English digits to the selected language's digits.
 */
export const translateDigits = (value: string | number | undefined | null, lang: Language): string => {
  if (value === undefined || value === null) return '';
  const str = String(value);
  const map = digitMaps[lang];
  if (!map || lang === 'en') return str;

  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) { // '0' - '9'
      return map[code - 48];
    }
    return char;
  }).join('');
};

/**
 * Formats a number with proper thousands separator and decimals, and translates digits.
 */
export const formatNumber = (
  num: number | string | undefined | null,
  lang: Language,
  options?: Intl.NumberFormatOptions
): string => {
  if (num === undefined || num === null) return '';
  const parsed = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(parsed)) return '';

  // Format standard English formatting first to preserve punctuation like comma/period, then map digits
  const standardFormatted = parsed.toLocaleString('en-US', options);
  return translateDigits(standardFormatted, lang);
};

/**
 * Formats a date string (e.g. YYYY-MM-DD or DD-MM-YYYY) and translates digits.
 */
export const formatDate = (
  dateVal: string | Date | undefined | null,
  lang: Language
): string => {
  if (!dateVal) return '';
  
  let dateStr = '';
  if (dateVal instanceof Date) {
    const day = String(dateVal.getDate()).padStart(2, '0');
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const year = dateVal.getFullYear();
    dateStr = `${day}-${month}-${year}`;
  } else {
    // If it's a string, try to parse it
    const trimmed = dateVal.trim();
    if (trimmed.includes('T')) {
      // ISO timestamp
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        dateStr = `${day}-${month}-${year}`;
      } else {
        dateStr = trimmed;
      }
    } else if (trimmed.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD to DD-MM-YYYY
      const parts = trimmed.split('-');
      dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      dateStr = trimmed;
    }
  }

  return translateDigits(dateStr, lang);
};

/**
 * Formats a time string (e.g. HH:MM or HH:MM AM/PM) and translates digits.
 */
export const formatTime = (
  timeStr: string | undefined | null,
  lang: Language
): string => {
  if (!timeStr) return '';
  return translateDigits(timeStr, lang);
};
