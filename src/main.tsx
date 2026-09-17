import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { startTranslationObserver } from './utils/translationHelper';

// Global Fetch Interceptor to attach Session ID and detect Expiration
const originalFetch = window.fetch;
(window as any)._originalFetch = originalFetch;

window.fetch = async function(input, init) {
  const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : '');
  
  // Attach session headers to internal API requests
  if (url.includes('/api/') && !url.includes('/api/auth/login-session')) {
    const sessionId = localStorage.getItem('fleetpro_session_id');
    if (sessionId) {
      init = init || {};
      init.headers = init.headers || {};
      
      if (init.headers instanceof Headers) {
        if (!init.headers.has('Authorization')) {
          init.headers.set('Authorization', `Bearer ${sessionId}`);
        }
        if (!init.headers.has('x-session-id')) {
          init.headers.set('x-session-id', sessionId);
        }
      } else if (Array.isArray(init.headers)) {
        const hasAuth = init.headers.some(([k]) => k.toLowerCase() === 'authorization');
        if (!hasAuth) {
          init.headers.push(['Authorization', `Bearer ${sessionId}`]);
        }
        const hasSess = init.headers.some(([k]) => k.toLowerCase() === 'x-session-id');
        if (!hasSess) {
          init.headers.push(['x-session-id', sessionId]);
        }
      } else {
        const headersRecord = init.headers as Record<string, string>;
        if (!headersRecord['Authorization'] && !headersRecord['authorization']) {
          headersRecord['Authorization'] = `Bearer ${sessionId}`;
        }
        if (!headersRecord['x-session-id']) {
          headersRecord['x-session-id'] = sessionId;
        }
      }
    }
  }

  const response = await originalFetch(input, init);

  // If a protected API route returns 401 Unauthorized because of session expiry, force logout!
  if (response.status === 401 && url.includes('/api/') && !url.includes('/api/auth/check-session')) {
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data && (data.error === 'Session expired' || data.error === 'Session invalid or expired' || data.error === 'Authentication required')) {
        console.warn("Global Fetch Interceptor: Session expired/invalid. Dispatched force-logout event.");
        const event = new CustomEvent('force-logout', { detail: { reason: 'session_expired' } });
        window.dispatchEvent(event);
      }
    } catch (e) {
      // Not JSON or parse failed
    }
  }

  return response;
};

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
