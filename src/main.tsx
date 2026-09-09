import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { startTranslationObserver } from './utils/translationHelper';

// Global Language Override for Numbers, Dates, and Times Formatting
const originalNumberToLocaleString = Number.prototype.toLocaleString;
const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
const originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString;

const getSelectedLanguage = (): string => {
  try {
    const saved = localStorage.getItem('fleetpro_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.language) {
        return parsed.language;
      }
    }
  } catch (e) {}
  return 'en';
};

// Start the real-time global translation observer for inline and hardcoded texts
startTranslationObserver(getSelectedLanguage as any);

const digitMaps: Record<string, string[]> = {
  en: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  bn: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
  ar: ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
  hi: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
};

const localeMap: Record<string, string> = {
  en: 'en-US',
  bn: 'bn-BD',
  ar: 'ar-SA',
  hi: 'hi-IN'
};

const translateDigits = (formatted: string, lang: string): string => {
  const map = digitMaps[lang];
  if (!map || lang === 'en') {
    return formatted;
  }
  return formatted.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 48 && code <= 57) { // '0' - '9'
      return map[code - 48];
    }
    return char;
  }).join('');
};

Number.prototype.toLocaleString = function(locales?: any, options?: any) {
  const lang = getSelectedLanguage();
  const targetLocale = locales || localeMap[lang] || 'en-US';
  const formatted = originalNumberToLocaleString.call(this, targetLocale, options);
  return translateDigits(formatted, lang);
};

Date.prototype.toLocaleDateString = function(locales?: any, options?: any) {
  const lang = getSelectedLanguage();
  const targetLocale = locales || localeMap[lang] || 'en-US';
  const formatted = originalDateToLocaleDateString.call(this, targetLocale, options);
  return translateDigits(formatted, lang);
};

Date.prototype.toLocaleTimeString = function(locales?: any, options?: any) {
  const lang = getSelectedLanguage();
  const targetLocale = locales || localeMap[lang] || 'en-US';
  const formatted = originalDateToLocaleTimeString.call(this, targetLocale, options);
  return translateDigits(formatted, lang);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
