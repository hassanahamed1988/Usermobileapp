/**
 * Utility to resolve API endpoints dynamically.
 * Helps mobile builds (Capacitor/APK) connect to the correct absolute Cloud Run backend URL
 * instead of trying to resolve relative paths against the local WebView.
 */
export function getApiUrl(path: string): string {
  const origin = window.location.origin || '';

  // 1. Check if a custom API Base URL is saved in localStorage (from Settings)
  const savedBase = localStorage.getItem('API_BASE_URL');
  if (savedBase) {
    let base = savedBase.trim().replace(/\/+$/, '');
    // Force HTTPS if hitting a Cloud Run domain
    if (base.includes('.run.app') && base.startsWith('http://')) {
      base = base.replace('http://', 'https://');
    }
    return `${base}${path}`;
  }

  // 2. Detect if running natively inside Capacitor, Cordova, or offline file
  const isNativeApp = 
    origin.startsWith('capacitor:') || 
    origin.startsWith('file:') || 
    origin === 'null' ||
    origin.includes('10.0.2.2');

  if (isNativeApp) {
    // Native apps cannot use relative paths. Use the fallback AI Studio Cloud Run backend
    const defaultHost = 'https://gen-lang-client-0792514696.web.app';
    return `${defaultHost}${path}`;
  }

  // 3. Web environments (Firebase Hosting, Cloud Run, Custom Domains, Localhost)
  // Safely use relative paths. (For Firebase, this hits the Cloud Functions rewrite)
  return path;
}
