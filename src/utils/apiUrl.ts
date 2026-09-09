import { Capacitor } from '@capacitor/core';

/**
 * Utility to resolve API endpoints dynamically.
 * Helps mobile builds (Capacitor/APK) connect to the correct absolute Cloud Run backend URL
 * instead of trying to resolve relative paths against the local WebView.
 */
export function getApiUrl(path: string): string {
  const origin = window.location.origin || '';

  // Reliable native-platform detection. NOTE: capacitor.config.ts sets
  // androidScheme: 'https', so on a real APK window.location.origin is
  // "https://localhost" — it will NOT start with "capacitor:" or "file:"
  // and will NOT be "null". Capacitor.isNativePlatform() is the correct
  // check regardless of androidScheme/webview configuration.
  const isNativeApp =
    Capacitor.isNativePlatform() ||
    origin.startsWith('capacitor:') ||
    origin.startsWith('file:') ||
    origin === 'null' ||
    origin.includes('10.0.2.2');

  // 1. Check if a custom API Base URL is saved in localStorage (from Settings)
  const savedBase = localStorage.getItem('API_BASE_URL');
  if (savedBase) {
    let base = savedBase.trim().replace(/\/+$/, '');

    // If we are on native platform and the savedBase is an AI Studio / development preview host,
    // we MUST ignore it, because it is meant only for the browser-based AI Studio preview.
    const isDevelopmentHost = 
      base.includes('ais-dev-') || 
      base.includes('ais-pre-') || 
      base.includes('gen-lang-client-') ||
      (base.includes('.run.app') && !base.includes('fleetpromanager-1991'));

    if (isNativeApp && isDevelopmentHost) {
      // Ignore development host on native apps and use default production host
      const defaultHost = 'https://fleetpromanager-1991.web.app';
      return `${defaultHost}${path}`;
    }

    // Force HTTPS if hitting a Cloud Run domain
    if (base.includes('.run.app') && base.startsWith('http://')) {
      base = base.replace('http://', 'https://');
    }
    return `${base}${path}`;
  }

  if (isNativeApp) {
    // Native apps cannot use relative paths. Use the fallback backend
    const defaultHost = 'https://fleetpromanager-1991.web.app';
    return `${defaultHost}${path}`;
  }

  // 3. Web environments (Firebase Hosting, Cloud Run, Custom Domains, Localhost)
  // Safely use relative paths. (For Firebase, this hits the Cloud Functions rewrite)
  return path;
}
