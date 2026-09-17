
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { StoreProvider } from '@/store';
import '@/styles/background-colors.css';
import '@/styles/text-colors.css';

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('WebSocket closed without opened')) {
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Debugging: track localStorage changes
const originalClear = localStorage.clear;
localStorage.clear = () => {
  console.trace('localStorage.clear() called');
  originalClear.apply(localStorage);
};
const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = (key) => {
  console.log('localStorage.removeItem() called for key:', key);
  console.trace();
  originalRemoveItem.apply(localStorage, [key]);
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
    <style>{`
      @import "tailwindcss";

      /* Smooth floating label transition */
      .floating-label-transition {
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }

      @theme {
        --color-glass-bg: var(--glass-bg);
        --color-theme-bg: var(--app-bg);
        --color-theme-card: var(--card-bg);
        --color-theme-primary: var(--primary);
        --color-primary: var(--primary);
        
        --color-app-bg: var(--app-bg);
        --color-card-bg: var(--card-bg);
        --color-sidebar-bg: var(--sidebar-bg);
        --color-form-bg: var(--form-bg);
        --color-header-bg: var(--header-bg);
        --color-nav-bg: var(--nav-bg);
        --color-hover-bg: var(--hover-bg);
        --color-active-bg: var(--active-bg);
        
        --color-text-main: var(--text-main);
        --color-text-muted: var(--text-muted);
        --color-text-inverse: var(--text-inverse);

        /* Card Roundedness 10px set */
        --radius-md: 10px;
        --radius-lg: 10px;
        --radius-xl: 10px;
        --radius-2xl: 10px;
        --radius-3xl: 10px;
      }

      /* Global Card Base Drop Shadow & Elevation - Main Cards */
      /* Completely uniform & equal on all four sides: 0px horizontal, 0px vertical */
      .bg-theme-card, 
      .bg-card-bg, 
      .glass-card, 
      .reset-option-card {
        box-shadow: var(--dynamic-card-shadow, 0 0 16px rgba(0, 0, 0, 0.12)) !important;
        -webkit-box-shadow: var(--dynamic-card-shadow, 0 0 16px rgba(0, 0, 0, 0.12)) !important;
        border: var(--dynamic-card-border, 1px solid rgba(0, 0, 0, 0.04)) !important;
        isolation: isolate !important;
      }

      .bg-theme-card:hover, 
      .bg-card-bg:hover, 
      .glass-card:hover {
        box-shadow: var(--dynamic-card-shadow-hover, var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.18))) !important;
        -webkit-box-shadow: var(--dynamic-card-shadow-hover, var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.18))) !important;
      }

      .dark .bg-theme-card,
      .dark .bg-card-bg,
      .dark .glass-card,
      .dark .reset-option-card,
      .dark-mode .bg-theme-card,
      .dark-mode .bg-card-bg,
      .dark-mode .glass-card,
      .dark-mode .reset-option-card {
        box-shadow: var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.85)) !important;
        -webkit-box-shadow: var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.85)) !important;
        border: var(--dynamic-card-border, 1px solid rgba(255, 255, 255, 0.08)) !important;
        isolation: isolate !important;
      }

      .dark .bg-theme-card:hover,
      .dark .bg-card-bg:hover,
      .dark .glass-card:hover,
      .dark-mode .bg-theme-card:hover,
      .dark-mode .bg-card-bg:hover,
      .dark-mode .glass-card:hover,
      .dark-mode .reset-option-card:hover {
        box-shadow: var(--dynamic-card-shadow-hover, var(--dynamic-card-shadow, 0 0 24px rgba(0, 0, 0, 1))) !important;
        -webkit-box-shadow: var(--dynamic-card-shadow-hover, var(--dynamic-card-shadow, 0 0 24px rgba(0, 0, 0, 1))) !important;
      }

      /* 1. Sub Cards inside Main Card - Disable Box Borders and Border Shadows */
      .bg-card-bg .bg-card-bg,
      .bg-card-bg .bg-theme-card,
      .bg-card-bg .bg-nested-card,
      .bg-card-bg .sub-card,
      .bg-card-bg [class*="sub-card"],
      .bg-card-bg [class*="nested-card"],
      .bg-theme-card .bg-theme-card,
      .bg-theme-card .bg-card-bg,
      .bg-theme-card .bg-nested-card,
      .bg-theme-card .sub-card,
      .bg-theme-card [class*="sub-card"],
      .bg-theme-card [class*="nested-card"],
      .glass-card .bg-theme-card,
      .glass-card .bg-card-bg,
      .glass-card .bg-nested-card,
      .glass-card .sub-card,
      .reset-option-card .bg-theme-card,
      .reset-option-card .bg-card-bg,
      .reset-option-card .bg-nested-card,
      .bg-nested-card,
      [class*="bg-card"] .bg-nested-card,
      [class*="bg-card"] [class*="sub-card"],
      [class*="bg-card"] [class*="nested-card"] {
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        border: none !important;
      }

      /* 2. Selection Menus & Selection Panels inside Main Card - Clean without Box Border or Border Shadow */
      .bg-card-bg select,
      .bg-card-bg option,
      .bg-card-bg [role="option"],
      .bg-card-bg [role="menu"],
      .bg-card-bg [role="listbox"],
      .bg-card-bg [role="combobox"],
      .bg-card-bg .selection-card,
      .bg-card-bg .selection-panel,
      .bg-card-bg .selection-menu,
      .bg-card-bg .select-menu,
      .bg-card-bg .menu-panel,
      .bg-card-bg .custom-statement-select,
      .bg-card-bg .selection-opt,
      .bg-theme-card select,
      .bg-theme-card option,
      .bg-theme-card [role="option"],
      .bg-theme-card [role="menu"],
      .bg-theme-card [role="listbox"],
      .bg-theme-card [role="combobox"],
      .bg-theme-card .selection-card,
      .bg-theme-card .selection-panel,
      .bg-theme-card .selection-menu,
      .bg-theme-card .select-menu,
      .bg-theme-card .menu-panel,
      .bg-theme-card .custom-statement-select,
      .bg-theme-card .selection-opt,
      .glass-card select,
      .glass-card [role="option"],
      .glass-card [role="menu"],
      .glass-card [role="listbox"],
      .glass-card .selection-panel,
      .glass-card .selection-menu,
      [class*="bg-card"] select,
      [class*="bg-card"] option,
      [class*="bg-card"] [role="option"],
      [class*="bg-card"] [role="menu"],
      [class*="bg-card"] [role="listbox"],
      [class*="bg-card"] [role="combobox"],
      [class*="bg-card"] .selection-card,
      [class*="bg-card"] .selection-panel,
      [class*="bg-card"] .selection-menu,
      [class*="bg-card"] .select-menu,
      [class*="bg-card"] .menu-panel,
      [class*="bg-card"] .selection-opt {
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        border: none !important;
        outline: none !important;
      }

      /* 3. Floating Label Background Areas - Clean without Box Border or Border Shadow */
      label,
      label.absolute,
      .floating-label,
      .floating-label-bg,
      .floating-label-container,
      .input-field-container label,
      .simple-input-container label,
      [class*="input-field-container"] label,
      [class*="simple-input"] label,
      .invoice-panel label,
      .invoice-panel .relative label,
      div[class*="input"] label,
      form label {
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        border: none !important;
        outline: none !important;
        text-shadow: none !important;
        filter: none !important;
        -webkit-filter: none !important;
      }

      /* Global Card Separation Rule to Prevent Shadow Overlapping and Extra Box Layers */
      .grid > .bg-theme-card,
      .grid > .bg-card-bg,
      .grid > .glass-card,
      .grid > button.bg-theme-card,
      .grid > button.bg-card-bg,
      .space-y-2 > .bg-theme-card,
      .space-y-3 > .bg-theme-card,
      .space-y-4 > .bg-theme-card,
      .space-y-2 > div.bg-theme-card,
      .space-y-3 > div.bg-theme-card,
      .space-y-4 > div.bg-theme-card {
        isolation: isolate;
        margin-bottom: 2px;
        
      }

      /* Elegant Bottom-Heavy Soft Glow Focusing Styles (No Outer Borders) */
      .floating-focus-card,
      .dashboard-card-glow {
        border: none !important;
        box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1), 
                    0 16px 32px -14px rgba(6, 182, 212, 0.2), 
                    0 20px 40px -16px rgba(0, 0, 0, 0.05) !important;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .dark .floating-focus-card,
      .dark-mode .floating-focus-card,
      .dark-theme .floating-focus-card,
      .dark .dashboard-card-glow,
      .dark-mode .dashboard-card-glow,
      .dark-theme .dashboard-card-glow {
        border: none !important;
        box-shadow: 0 16px 32px -12px rgba(0, 0, 0, 0.4), 
                    0 20px 40px -16px rgba(6, 182, 212, 0.4), 
                    0 24px 48px -20px rgba(0, 0, 0, 0.5) !important;
      }

      .tx-history-card,
      .bg-theme-card.tx-history-card,
      .light .bg-theme-card.tx-history-card {
        box-shadow: inset 0 2px 6px rgba(15, 23, 42, 0.15) !important;
      }
      .dark .tx-history-card,
      .dark-mode .tx-history-card,
      .dark-theme .tx-history-card,
      .dark .bg-theme-card.tx-history-card,
      .dark-mode .bg-theme-card.tx-history-card,
      .dark-theme .bg-theme-card.tx-history-card {
        box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5) !important;
      }

      :root {
        --primary: #10b981;
        --glass-bg: rgba(255, 255, 255, 0.1);
        --glass-border: rgba(255, 255, 255, 0.2);
        --glass-blur: 10px;
        --card-bg-solid: #ffffff;
        --input-border-color: rgba(0, 0, 0, 0.45);
        --input-bg-solid: var(--card-bg-solid, var(--page-bg-solid, #ffffff));
        --global-divider: rgba(0, 0, 0, 0.2);
        --global-pt: 1rem; /* 16px */
        --global-pt-sm: 1.25rem; /* 20px */
        --global-pt-lg: 1.5rem; /* 24px */
        --global-px: 1rem; /* 16px */
        --global-px-sm: 1.25rem; /* 20px */
        --global-px-lg: 1.5rem; /* 24px */
      }

      .dark, .dark-mode, .dark-theme {
        --global-divider: rgba(255, 255, 255, 0.2) !important;
      }

      .border-card-divider {
        border-color: var(--global-divider) !important;
      }

      .divide-card-divider > :not([hidden]) ~ :not([hidden]) {
        border-color: var(--global-divider) !important;
      }

      .eye-comfort {
        filter: sepia(0.35) brightness(0.9) contrast(1.05);
      }

      .pt-global {
        padding-top: var(--global-pt) !important;
      }

      .px-global {
        padding-left: var(--global-px) !important;
        padding-right: var(--global-px) !important;
      }

      @media (min-width: 640px) {
        .pt-global {
          padding-top: var(--global-pt-sm) !important;
        }
        .px-global {
          padding-left: var(--global-px-sm) !important;
          padding-right: var(--global-px-sm) !important;
        }
      }

      @media (min-width: 1024px) {
        .pt-global {
          padding-top: var(--global-pt-lg) !important;
        }
        .px-global {
          padding-left: var(--global-px-lg) !important;
          padding-right: var(--global-px-lg) !important;
        }
      }
      /* Hide robustly all scrollbars */
      ::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
      }
      * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }

      /* Disable all transitions during page mounting to avoid flashing border/shadows on load */
      .no-initial-transitions,
      .no-initial-transitions * {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -ms-transition: none !important;
        -o-transition: none !important;
        transition: none !important;
        animation: none !important;
      }

      @keyframes indeterminate {
        0% {
          transform: translateX(-100%) scaleX(0.2);
        }
        50% {
          transform: translateX(0) scaleX(0.5);
        }
        100% {
          transform: translateX(100%) scaleX(0.2);
        }
      }

      .animate-indeterminate {
        animation: none !important;
      }

      @keyframes gradient-loading {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      .animate-gradient-loading {
        background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
        background-size: 400% 400%;
        animation: none !important;
      }

      @keyframes pulse-glow {
        0%, 100% { transform: scale(1); opacity: 0.8; filter: drop-shadow(0 0 5px var(--primary)); }
        50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 20px var(--primary)); }
      }

      .animate-pulse-glow {
        animation: none !important;
      }

      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      .animate-shimmer {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        background-size: 200% 100%;
        animation: none !important;
      }
      .allow-animation .animate-shimmer, .allow-animation *.animate-shimmer {
        animation: shimmer 1.5s infinite linear !important;
      }

      .animate-mesh {
        background: linear-gradient(-45deg, #f8fafc, #e2e8f0, #f1f5f9, #f8fafc);
        background-size: 400% 400%;
        animation: none !important;
      }

      @keyframes spin-clockwise {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      @keyframes spin-counter-clockwise {
        0% { transform: rotate(360deg); }
        100% { transform: rotate(0deg); }
      }

      @keyframes pulse-ring {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.05); opacity: 1; }
      }

      .animate-spin-cw {
        animation: none !important;
      }
      .allow-animation .animate-spin-cw, .allow-animation *.animate-spin-cw {
        animation: spin-clockwise 3s linear infinite !important;
      }

      .animate-spin-ccw {
        animation: none !important;
      }
      .allow-animation .animate-spin-ccw, .allow-animation *.animate-spin-ccw {
        animation: spin-counter-clockwise 3s linear infinite !important;
      }

      .animate-spin-cw-slow {
        animation: none !important;
      }
      .allow-animation .animate-spin-cw-slow, .allow-animation *.animate-spin-cw-slow {
        animation: spin-clockwise 8s linear infinite !important;
      }

      .animate-pulse-ring {
        animation: none !important;
      }
      .allow-animation .animate-pulse-ring, .allow-animation *.animate-pulse-ring {
        animation: pulse-ring 2s ease-in-out infinite !important;
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .animate-float {
        animation: none !important;
      }
      .allow-animation .animate-float, .allow-animation *.animate-float {
        animation: float 3s ease-in-out infinite !important;
      }

      @keyframes progress-glow {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }

      .animate-progress-glow {
        animation: none !important;
      }

      @keyframes wave-scale {
        0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
        50% { transform: scaleY(1); opacity: 1; }
      }
      .animate-wave-1 { animation: none !important; }
      .animate-wave-2 { animation: none !important; }
      .animate-wave-3 { animation: none !important; }
      .animate-wave-4 { animation: none !important; }

      .safe-top {
        padding-top: max(10px, env(safe-area-inset-top));
      }
      .safe-bottom {
        padding-bottom: env(safe-area-inset-bottom);
      }

      /* Global Border Style */
      *:not(aside):not(.drawer-content):not(.sidebar-transition):not(.sidebar-transition *):not(.drawer-content *):not(.allow-animation):not(.allow-animation *) {
        border-style: solid;
      }
      aside, .drawer-content, .sidebar-transition, .sidebar-transition *, .drawer-content *, .allow-animation, .allow-animation * {
        border-style: solid;
      }

      .glass-card {
        background: var(--glass-bg);
        backdrop-filter: blur(var(--glass-blur));
      }

      /* Set default label background outside of cards/containers to the page's solid background */
      .input-field-container {
        --input-bg-solid: var(--page-bg-solid, var(--app-bg, #ffffff)) !important;
      }

      .search-field-container {
        --search-bg-color: var(--page-bg-solid, var(--app-bg, #ffffff)) !important;
      }

      /* When inside any card, modal, drawer, form, or dynamic popups, match the background to the card's solid background color */
      .glass-card,
      .bg-theme-card,
      .bg-card-bg,
      .bg-form-bg,
      .bg-nested-card,
      .card,
      .form-bg,
      .modal,
      .drawer-content,
      [class*="card"],
      [class*="form"],
      [class*="modal"],
      [class*="drawer"],
      [class*="popup"],
      [id*="portal"],
      [id*="dialog"] {
        --input-bg-solid: var(--card-bg-solid, var(--card-bg, var(--theme-card, var(--form-bg, #ffffff)))) !important;
        --search-bg-color: var(--card-bg-solid, var(--card-bg, var(--theme-card, var(--form-bg, #ffffff)))) !important;
      }

      .glass- {
        width: 100% !important;
        max-width: 100% !important;
      }

      /* Global Styles */

      html, body {
        overflow-x: hidden !important;
        position: relative !important;
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        -webkit-text-size-adjust: 100% !important;
        -moz-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
        touch-action: manipulation;
        -webkit-touch-callout: none;
        overscroll-behavior: none;
      }

      #root {
        overflow-x: hidden !important;
        position: relative !important;
        width: 100% !important;
        max-width: 100% !important;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      body.global-select-open > *:not(.global-select-modal):not(.global-select-backdrop):not(.global-select-add-modal) {
        filter: blur(4px);
        pointer-events: none;
      }

      .global-select-add-modal,
      .global-select-add-modal * {
        filter: none !important;
        -webkit-filter: none !important;
        pointer-events: auto !important;
      }



      body > * {
        transition: transition 0.2s ease;
      }

      body {
        background: var(--app-bg);
        color: var(--text-main);
        font-family: var(--font-sans, Calibri, sans-serif);
        font-size: var(--font-size, 12px);
        font-weight: var(--font-weight, normal);
        transition: background-color 0.2s ease, color 0.2s ease;
        transition-behavior: allow-discrete;
      }
      
      .font-bold-override * {
        font-weight: bold !important;
      }

      .font-calibri, .font-calibri * {
        font-family: 'Calibri', sans-serif !important;
      }

      @keyframes slide-up {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes scale-in {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      .animate-fade-in { animation: fade-in 0.25s ease-out forwards; }
      .animate-scale-in { animation: scale-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

      @keyframes slide-in {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slide-right {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }

      .animate-slide-in {
        animation: slide-in 0.25s ease-out forwards;
      }
      .animate-slide-right { 
        animation: slide-right 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      .reset-option-card {
        background-color: var(--card-bg) !important;
        box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.15), 0 4px 8px -4px rgba(0, 0, 0, 0.05) !important;
        transition: none !important;
      }
      .dark .reset-option-card,
      .dark-mode .reset-option-card,
      .dark-theme .reset-option-card {
        box-shadow: 0 16px 24px -10px rgba(0, 0, 0, 0.4), 0 8px 12px -6px rgba(0, 0, 0, 0.2) !important;
      }
      .reset-option-card:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 16px 24px -10px rgba(0, 0, 0, 0.15), 0 8px 12px -6px rgba(0, 0, 0, 0.05) !important;
      }
      .dark .reset-option-card:hover,
      .dark-mode .reset-option-card:hover,
      .dark-theme .reset-option-card:hover {
        box-shadow: 0 20px 32px -12px rgba(0, 0, 0, 0.6) !important;
      }
      
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      /* Custom Checkbox Styling */
      input[type="checkbox"] {
        appearance: none;
        -webkit-appearance: none;
        background-color: transparent !important;
        border: 2px solid #d1d5db !important;
        border-radius: 4px;
        display: inline-block;
        position: relative;
        cursor: pointer;
      }
      .dark-theme input[type="checkbox"] {
        border-color: #4b5563 !important;
      }
      input[type="checkbox"]:checked {
        background-color: transparent !important;
        border-color: #22c55e !important;
      }
      input[type="checkbox"]:checked::after {
        content: '';
        position: absolute;
        left: 32%;
        top: 15%;
        width: 30%;
        height: 55%;
        border: solid #22c55e;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }

      /* Global Focus Glow Styles */
      /* 
        Removed broad focus overrides to allow Tailwind focus classes (ring, outline) to work 
        on elements like the Note/Description textarea.
      */

      /* Force transparent background for inputs inside .input-field-container to avoid conflicting styles */
      .input-field-container input:not([type="checkbox"]):not([type="radio"]),
      .input-field-container select,
      .input-field-container textarea,
      .input-field-container .country-code-btn,
      .simple-input-container input:not([type="checkbox"]):not([type="radio"]),
      .simple-input-container select,
      .simple-input-container textarea,
      .simple-input-container .country-code-btn {
        background-color: transparent !important;
        box-shadow: none !important;
        border: none !important;
        outline: none !important;
      }
      
      .bg-theme-card h3,
      .bg-card-bg h3,
      .bg-theme-card h2,
      .bg-card-bg h2 {
        /* Removed !important color override to allow Tailwind classes to work */
      }

      .light .bg-theme-card,
      .light .bg-card-bg,
      .light .glass-card,
      .light .reset-option-card {
        background-color: rgba(255, 255, 255, 0.92) !important;
        backdrop-filter: blur(16px) saturate(1.2) !important;
        -webkit-backdrop-filter: blur(16px) saturate(1.2) !important;
        box-shadow: var(--dynamic-card-shadow, 0 0 16px rgba(0, 0, 0, 0.12)) !important;
        -webkit-box-shadow: var(--dynamic-card-shadow, 0 0 16px rgba(0, 0, 0, 0.12)) !important;
        border: var(--dynamic-card-border, 1px solid rgba(0, 0, 0, 0.04)) !important;
        --text-main: #111827 !important;
        --text-muted: #4b5563 !important;
        --text-inverse: var(--text-inverse, #ffffff) !important;
        /* Removed broad color override to allow Tailwind text colors to work */
      }

      .light .bg-theme-card:hover,
      .light .bg-card-bg:hover,
      .light .glass-card:hover,
      .light .reset-option-card:hover {
        box-shadow: var(--dynamic-card-shadow-hover, var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.18))) !important;
        -webkit-box-shadow: var(--dynamic-card-shadow-hover, var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.18))) !important;
      }

      /* Light Mode Sub Cards & Selection Panels inside Main Cards - Clean without box border or shadow */
      .light .bg-theme-card .bg-theme-card:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .bg-card-bg:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .bg-nested-card:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .bg-white:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .bg-slate-50:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .bg-slate-100:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .bg-zinc-50:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .bg-zinc-100:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .sub-card:not(.input-field-container):not(.search-field-container),
      .light .bg-theme-card .selection-card,
      .light .bg-theme-card .selection-panel,
      .light .bg-theme-card .selection-menu,
      .light .bg-theme-card .selection-opt,
      .light .bg-card-bg .bg-theme-card:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .bg-card-bg:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .bg-nested-card:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .bg-white:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .bg-slate-50:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .bg-slate-100:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .bg-zinc-50:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .bg-zinc-100:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .sub-card:not(.input-field-container):not(.search-field-container),
      .light .bg-card-bg .selection-card,
      .light .bg-card-bg .selection-panel,
      .light .bg-card-bg .selection-menu,
      .light .bg-card-bg .selection-opt,
      .light .bg-nested-card:not(.input-field-container):not(.search-field-container) {
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        border: none !important;
      }
      
      /* Global Override for Popup Module Content Background Color in Light Mode */
      .light .fixed.inset-0 > .bg-white,
      .light .fixed.inset-0 > .bg-theme-card,
      .light .fixed.inset-0 > .bg-card-bg,
      .light [id$="_portal"] > .bg-white,
      .light [id$="_portal"] > .bg-theme-card,
      .light [id$="_portal"] > .bg-card-bg,
      .light [id$="_dialog"] > .bg-white,
      .light [id$="_dialog"] > .bg-theme-card,
      .light [id$="_dialog"] > .bg-card-bg {
        background-color: #F7F7F7 !important;
      }

      .light .bg-theme-card h3,
      .light .bg-card-bg h3,
      .light .bg-theme-card h2,
      .light .bg-card-bg h2 {
        /* Removed !important color override to allow Tailwind classes to work */
      }

      /* 
        Removed overly broad border removal for all inputs 
        to fix missing borders on specific components like Note/Description textareas.
      */
      .light input.bg-theme-card:not([type="checkbox"]):not([type="radio"]):not([name*="search" i]):not([id*="search" i]):not([placeholder*="search" i]):not([type="search"]):not(.search-field-input),
      .light select.bg-theme-card,
      .light textarea.bg-theme-card,
      .light input.bg-white:not([type="checkbox"]):not([type="radio"]):not([name*="search" i]):not([id*="search" i]):not([placeholder*="search" i]):not([type="search"]):not(.search-field-input),
      .light select.bg-white,
      .light textarea.bg-white,
      .light .country-code-btn {
        background-color: transparent !important;
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
        border: none !important;
        border-radius: 8px !important;
        color: var(--text-main) !important;
      }

      html.light select.custom-statement-select {
        background-color: #D9D9D9 !important;
        border: none !important;
        border-radius: 10px !important;
      }

      html.light input.custom-statement-input:not([type="checkbox"]):not([type="radio"]):not([name*="search" i]):not([id*="search" i]):not([placeholder*="search" i]):not([type="search"]):not(.search-field-input) {
        background-color: #D9D9D9 !important;
        border: none !important;
        border-radius: 12px !important;
      }

      .light .input-field-container.ring-blue-500\/30 {
        box-shadow: none !important;
        border-color: var(--primary, #10b981) !important;
        z-index: 50 !important;
      }

      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) label,
      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) input:not([type="checkbox"]):not([type="radio"]),
      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) select,
      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) textarea,
      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) .country-code-btn,
      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) .absolute {
        color: var(--text-main) !important;
      }

      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) label {
        opacity: 0.6 !important;
      }

      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) input:not([type="checkbox"]):not([type="radio"]):focus ~ label,
      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) input:not([type="checkbox"]):not([type="radio"]):not(:placeholder-shown) ~ label {
        opacity: 1 !important;
      }

      .light .input-field-container:not([data-login="true"]):not(.search-field-container):not([data-search="true"]) .absolute {
        color: var(--text-main) !important;
      }

      .light .new-transaction-form {
        background-color: var(--card-bg-solid, #ffffff) !important;
        backdrop-filter: blur(var(--card-blur)) !important;
        -webkit-backdrop-filter: blur(var(--card-blur)) !important;
      }

      .light .global-select-modal:not(.login-view-modal) {
        background: var(--app-bg) !important;
        background-color: var(--app-bg) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: none !important;
      }

       .global-select-modal .search-field-container,
      .global-select-modal .input-field-container:has(input[name*="search" i]),
      .global-select-modal .input-field-container:has(input[id*="search" i]),
      .global-select-modal .input-field-container:has(input[placeholder*="search" i]) {
        background: transparent !important;
      }

       .global-select-modal .search-field-input,
       .global-select-modal input[name*="search" i],
       .global-select-modal input[id*="search" i],
       .global-select-modal input[placeholder*="search" i],
       .global-select-modal input[type="search"] {
        background: transparent !important;
      }

      .light .trip-file-modal,
      .light .account-type-modal {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: none !important;
        background: var(--app-bg) !important;
        background-color: var(--app-bg) !important;
        color: var(--text-main, #111827) !important;
      }

      .light .feedback-modal-card {
        background-color: var(--card-bg-solid, #ffffff) !important;
        backdrop-filter: blur(var(--card-blur)) !important;
        -webkit-backdrop-filter: blur(var(--card-blur)) !important;
        color: #111827 !important;
        --text-main: #111827 !important;
        --text-muted: #4b5563 !important;
      }

      .light .trip-file-modal {
        border: none !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
      }

      /* Search Bar Specific Overrides - MUST BE AGNOSTIC OF THEME WRAPPER CLASSES */
      .search-field-container,
      .input-field-container:has(input[name*="search" i]),
      .input-field-container:has(input[id*="search" i]),
      .input-field-container:has(input[placeholder*="search" i]),
      .quick-search-container,
      .search-field-input,
      input[name*="search" i],
      input[id*="search" i],
      input[placeholder*="search" i],
      input[type="search"] {
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
      }

      .invoice-panel label,
      .invoice-panel .relative label,
      .input-field-container label,
      label.absolute {
        box-shadow: none !important;
        -webkit-box-shadow: none !important;
        text-shadow: none !important;
        filter: none !important;
        -webkit-filter: none !important;
      }

      /* Clean, theme-agnostic search container styles driven by dynamic inline variables */
      .search-field-container,
      .input-field-container:has(input[name*="search" i]),
      .input-field-container:has(input[id*="search" i]),
      .input-field-container:has(input[placeholder*="search" i]) {
        background: transparent !important;
        backdrop-filter: blur(var(--card-blur)) !important;
        -webkit-backdrop-filter: blur(var(--card-blur)) !important;
      }

      .search-field-container,
      .input-field-container:has(input[name*="search" i]),
      .input-field-container:has(input[id*="search" i]),
      .input-field-container:has(input[placeholder*="search" i]),
      .quick-search-container {
        border-color: var(--search-border-color, var(--text-muted, rgba(128, 128, 128, 0.5))) !important;
      }

      .search-field-container:focus-within,
      .input-field-container:has(input[name*="search" i]):focus-within,
      .input-field-container:has(input[id*="search" i]):focus-within,
      .input-field-container:has(input[placeholder*="search" i]):focus-within {
        border-color: var(--search-focus-border-color, var(--primary, #10b981)) !important;
      }

      /* Bulletproof search text & label styling overriding any generic theme inputs */
      .search-field-input,
      input[name*="search" i],
      input[id*="search" i],
      input[placeholder*="search" i],
      input[type="search"],
      .search-field-container input,
      .global-select-modal input,
      .light .search-field-container input,
      .light-mode .search-field-container input,
      .dark .search-field-container input,
      .dark-mode .search-field-container input,
      .dark-theme .search-field-container input,
      .light .global-select-modal input,
      .dark .global-select-modal input {
        background-color: transparent !important;
        color: var(--search-text-color, var(--text-main, currentColor)) !important;
        -webkit-text-fill-color: var(--search-text-color, var(--text-main, currentColor)) !important;
      }

      .search-field-input::placeholder,
      input[name*="search" i]::placeholder,
      input[id*="search" i]::placeholder,
      input[placeholder*="search" i]::placeholder,
      input[type="search"]::placeholder,
      .search-field-input::placeholder,
      input[name*="search" i]::placeholder,
      input[id*="search" i]::placeholder,
      input[placeholder*="search" i]::placeholder {
        color: var(--search-label-color, var(--text-muted, rgba(128, 128, 128, 0.7))) !important;
        -webkit-text-fill-color: var(--search-label-color, var(--text-muted, rgba(128, 128, 128, 0.7))) !important;
        opacity: 0.65 !important;
      }

      .search-field-container label,
      .input-field-container:has(input[name*="search" i]) label,
      .input-field-container:has(input[id*="search" i]) label,
      .input-field-container:has(input[placeholder*="search" i]) label,
      .search-field-container .absolute,
      .input-field-container:has(input[name*="search" i]) .absolute,
      .input-field-container:has(input[id*="search" i]) .absolute,
      .input-field-container:has(input[placeholder*="search" i]) .absolute {
        color: var(--search-label-color, var(--text-muted, rgba(128, 128, 128, 0.7))) !important;
      }

      .search-field-container input:focus ~ label,
      .search-field-container input:not(:placeholder-shown) ~ label,
      .input-field-container:has(input[name*="search" i]) input:focus ~ label,
      .input-field-container:has(input[name*="search" i]) input:not(:placeholder-shown) ~ label,
      .input-field-container:has(input[id*="search" i]) input:focus ~ label,
      .input-field-container:has(input[id*="search" i]) input:not(:placeholder-shown) ~ label,
      .input-field-container:has(input[placeholder*="search" i]) input:focus ~ label,
      .input-field-container:has(input[placeholder*="search" i]) input:not(:placeholder-shown) ~ label {
        color: var(--search-label-active-color, var(--primary, #10b981)) !important;
      }

      .search-field-container svg,
      .input-field-container:has(input[name*="search" i]) svg,
      .input-field-container:has(input[id*="search" i]) svg,
      .input-field-container:has(input[placeholder*="search" i]) svg {
        stroke: var(--search-label-color, currentColor) !important;
        color: var(--search-label-color, currentColor) !important;
      }

      .light .border-gray-100:not(.input-field-container):not(.search-field-container),
      .light .border-gray-200:not(.input-field-container):not(.search-field-container),
      .light .border-gray-300:not(.input-field-container):not(.search-field-container),
      .light .border-slate-100:not(.input-field-container):not(.search-field-container),
      .light .border-slate-200:not(.input-field-container):not(.search-field-container) {
        border: none !important;
      }

      .light input:not([type="checkbox"]):not([type="radio"])::placeholder,
      .light textarea::placeholder {
        color: #64748b !important;
        opacity: 0.7 !important;
      }

      .light .section-header {
        border: none !important;
        border-bottom: none !important;
        padding-bottom: 0 !important;
        margin-bottom: 1.5rem !important;
      }

      .light .section-icon {
        background-color: var(--card-bg) !important;
        backdrop-filter: blur(var(--card-blur)) !important;
        -webkit-backdrop-filter: blur(var(--card-blur)) !important;
        color: var(--primary) !important;
        border: none !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
      }

      .dark .border-gray-100:not(.input-field-container):not(.search-field-container),
      .dark .border-gray-200:not(.input-field-container):not(.search-field-container),
      .dark .border-slate-100:not(.input-field-container):not(.search-field-container),
      .dark .border-slate-200:not(.input-field-container):not(.search-field-container),
      .dark-mode .border-gray-100:not(.input-field-container):not(.search-field-container),
      .dark-mode .border-gray-200:not(.input-field-container):not(.search-field-container),
      .dark-mode .border-slate-100:not(.input-field-container):not(.search-field-container),
      .dark-mode .border-slate-200:not(.input-field-container):not(.search-field-container),
      .dark-theme .border-gray-100:not(.input-field-container):not(.search-field-container),
      .dark-theme .border-gray-200:not(.input-field-container):not(.search-field-container),
      .dark-theme .border-slate-100:not(.input-field-container):not(.search-field-container),
      .dark-theme .border-slate-200:not(.input-field-container):not(.search-field-container) {
        border: none !important;
      }

      .light .text-text-main,
      .light .text-text-inverse {
        color: var(--text-main) !important;
      }

      .light .text-text-muted {
        color: var(--text-muted) !important;
      }

      .dark .text-gray-900,
      .dark .text-gray-800,
      .dark .text-slate-900,
      .dark .text-slate-800,
      .dark .text-zinc-900,
      .dark .text-zinc-800,
      .dark .text-black,
      .dark-mode .text-gray-900,
      .dark-mode .text-gray-800,
      .dark-mode .text-slate-900,
      .dark-mode .text-slate-800,
      .dark-mode .text-zinc-900,
      .dark-mode .text-zinc-800,
      .dark-mode .text-black,
      .dark-theme .text-gray-900,
      .dark-theme .text-gray-800,
      .dark-theme .text-slate-900,
      .dark-theme .text-slate-800,
      .dark-theme .text-zinc-900,
      .dark-theme .text-zinc-800,
      .dark-theme .text-black {
        color: var(--text-main) !important;
      }

      .dark .text-gray-700,
      .dark .text-gray-600,
      .dark .text-gray-500,
      .dark .text-gray-400,
      .dark .text-slate-700,
      .dark .text-slate-600,
      .dark .text-slate-500,
      .dark .text-slate-400,
      .dark .text-zinc-700,
      .dark .text-zinc-600,
      .dark .text-zinc-500,
      .dark .text-zinc-400,
      .dark-mode .text-gray-700,
      .dark-mode .text-gray-600,
      .dark-mode .text-gray-500,
      .dark-mode .text-gray-400,
      .dark-mode .text-slate-700,
      .dark-mode .text-slate-600,
      .dark-mode .text-slate-500,
      .dark-mode .text-slate-400,
      .dark-mode .text-zinc-700,
      .dark-mode .text-zinc-600,
      .dark-mode .text-zinc-500,
      .dark-mode .text-zinc-400,
      .dark-theme .text-gray-700,
      .dark-theme .text-gray-600,
      .dark-theme .text-gray-500,
      .dark-theme .text-gray-400,
      .dark-theme .text-slate-700,
      .dark-theme .text-slate-600,
      .dark-theme .text-slate-500,
      .dark-theme .text-slate-400,
      .dark-theme .text-zinc-700,
      .dark-theme .text-zinc-600,
      .dark-theme .text-zinc-500,
      .dark-theme .text-zinc-400 {
        color: var(--text-muted) !important;
      }

      .dark .bg-white,
      .dark .bg-gray-50,
      .dark .bg-gray-100,
      .dark .bg-slate-50,
      .dark .bg-slate-100,
      .dark .bg-zinc-50,
      .dark .bg-zinc-100,
      .dark .bg-theme-card,
      .dark .bg-card-bg,
      .dark .bg-sidebar-bg,
      .dark-mode .bg-white,
      .dark-mode .bg-gray-50,
      .dark-mode .bg-gray-100,
      .dark-mode .bg-slate-50,
      .dark-mode .bg-slate-100,
      .dark-mode .bg-zinc-50,
      .dark-mode .bg-zinc-100,
      .dark-mode .bg-theme-card,
      .dark-mode .bg-card-bg,
      .dark-mode .bg-sidebar-bg,
      .dark [style*="url("],
      .dark-mode [style*="url("],
      .dark-theme [style*="url("] {
        background-image: none !important;
      }
      
      .dark .fixed.inset-0.z-\\[100\\],
      .dark-mode .fixed.inset-0.z-\\[100\\],
      .dark-theme .fixed.inset-0.z-\\[100\\],
      .dark .fixed.inset-0.z-\\[250\\],
      .dark-mode .fixed.inset-0.z-\\[250\\],
      .dark-theme .fixed.inset-0.z-\\[250\\],
      .dark .fixed.top-0.left-0.right-0,
      .dark-mode .fixed.top-0.left-0.right-0,
      .dark-theme .fixed.top-0.left-0.right-0,
      .dark .absolute.inset-0.z-0,
      .dark-mode .absolute.inset-0.z-0,
      .dark-theme .absolute.inset-0.z-0,
      .dark .drawer-content,
      .dark-mode .drawer-content,
      .dark-theme .drawer-content,
      .dark .sidebar,
      .dark-mode .sidebar,
      .dark-theme .sidebar,
      .dark body,
      .dark-mode body,
      .dark-theme body {
        background: var(--page-bg-solid, #000000) !important;
        background-color: var(--page-bg-solid, #000000) !important;
        background-image: none !important;
      }

      .dark .bottom-nav-solid,
      .dark-mode .bottom-nav-solid,
      .dark-theme .bottom-nav-solid {
        background: var(--nav-bg, var(--page-bg-solid, #000000)) !important;
        background-color: var(--nav-bg, var(--page-bg-solid, #000000)) !important;
        background-image: none !important;
      }

      .dark .z-\\[100\\].shrink-0,
      .dark header,
      .dark-mode header,
      .dark-theme header {
        background: var(--header-bg, var(--page-bg-solid, #000000)) !important;
        background-color: var(--header-bg, var(--page-bg-solid, #000000)) !important;
        background-image: none !important;
      }
      
      .dark *, .dark-mode *, .dark-theme * {
        --sidebar-text: #ffffff;
        --header-text: #ffffff;
      }
      
      .dark .drawer-content,
      .dark-mode .drawer-content,
      .dark-theme .drawer-content,
      .dark .sidebar,
      .dark-mode .sidebar,
      .dark-theme .sidebar {
        color: #ffffff !important;
      }
      
      .dark select option,
      .dark-mode select option,
      .dark-theme select option {
        background-color: var(--card-bg, #121212) !important;
        color: #ffffff !important;
      }
      
      .dark select:focus option:hover,
      .dark select option:hover,
      .dark select option:checked {
        background-color: #333333 !important;
      }
      
      .dark .hover\\:bg-gray-50:hover,
      .dark-mode .hover\\:bg-gray-50:hover,
      .dark-theme .hover\\:bg-gray-50:hover,
      .dark .hover\\:bg-gray-100:hover,
      .dark-mode .hover\\:bg-gray-100:hover,
      .dark-theme .hover\\:bg-gray-100:hover,
      .dark .hover\\:bg-slate-50:hover,
      .dark-mode .hover\\:bg-slate-50:hover,
      .dark-theme .hover\\:bg-slate-50:hover,
      .dark .hover\\:bg-slate-100:hover,
      .dark-mode .hover\\:bg-slate-100:hover,
      .dark-theme .hover\\:bg-slate-100:hover {
        background-color: #333333 !important;
      }
      
      .dark-theme .bg-white,
      .dark-theme .bg-gray-50,
      .dark-theme .bg-gray-100,
      .dark-theme .bg-slate-50,
      .dark-theme .bg-slate-100,
      .dark-theme .bg-zinc-50,
      .dark-theme .bg-zinc-100,
      .dark-theme .bg-theme-card,
      .dark-theme .bg-card-bg,
      .dark-theme .bg-sidebar-bg {
        background-color: rgba(20, 20, 24, 0.75) !important;
        backdrop-filter: blur(16px) saturate(1.2) !important;
        -webkit-backdrop-filter: blur(16px) saturate(1.2) !important;
        box-shadow: var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.85)) !important;
        -webkit-box-shadow: var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.85)) !important;
        border: var(--dynamic-card-border, 1px solid rgba(255, 255, 255, 0.08)) !important;
        transition: none !important;
      }

      /* 
        Removed broad dark mode overrides for input elements 
        to allow Tailwind classes (like bg-transparent, border-white/30) to work.
      */

      .dark .bg-theme-card,
      .dark-mode .bg-theme-card,
      .dark .bg-card-bg,
      .dark-mode .bg-card-bg,
      .dark .bg-sidebar-bg,
      .dark-mode .bg-sidebar-bg,
      .dark .bg-form-bg,
      .dark-mode .bg-form-bg,
      .dark .bg-gray-800,
      .dark-mode .bg-gray-800,
      .dark .bg-gray-900,
      .dark-mode .bg-gray-900,
      .dark .bg-slate-800,
      .dark-mode .bg-slate-800,
      .dark .bg-slate-900,
      .dark-mode .bg-slate-900,
      .dark .bg-zinc-800,
      .dark-mode .bg-zinc-800,
      .dark .bg-zinc-900,
      .dark-mode .bg-zinc-900,
      .dark .bg-neutral-800,
      .dark-mode .bg-neutral-800,
      .dark .bg-neutral-900,
      .dark-mode .bg-neutral-900,
      .dark .bg-white,
      .dark-mode .bg-white,
      .dark-theme .bg-white,
      .dark .bg-gray-50,
      .dark-mode .bg-gray-50,
      .dark-theme .bg-gray-50,
      .dark .bg-slate-50,
      .dark-mode .bg-slate-50,
      .dark-theme .bg-slate-50 {
        background-color: var(--card-bg-solid, var(--card-bg, #121212)) !important;
        backdrop-filter: blur(16px) saturate(1.2) !important;
        -webkit-backdrop-filter: blur(16px) saturate(1.2) !important;
        box-shadow: var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.85)) !important;
        -webkit-box-shadow: var(--dynamic-card-shadow, 0 0 20px rgba(0, 0, 0, 0.85)) !important;
        border: var(--dynamic-card-border, 1px solid rgba(255, 255, 255, 0.08)) !important;
        transition: none !important;
      }

      .dark .border-gray-700:not(.input-field-container):not(.search-field-container),
      .dark .border-gray-800:not(.input-field-container):not(.search-field-container),
      .dark .border-white\/10:not(.input-field-container):not(.search-field-container),
      .dark .border-white\/20:not(.input-field-container):not(.search-field-container) {
        border: none !important;
      }
      
      .diamond-theme header {
        background: linear-gradient(135deg, #1e1e1e 0%, #0097a7 100%) !important;
        color: white !important;
      }
      .diamond-theme header h1 {
        color: white !important;
      }
      .diamond-theme header button {
        color: white !important;
      }

      .modern-sidebar-bg {
        background: #ffffff !important;
        color: #003366 !important;
        height: 100vh !important;
        border-radius: 0 !important;
        top: 0 !important;
        bottom: 0 !important;
      }


      .modern-app-bg {
        background: var(--app-bg);
        color: var(--text-main);
      }
      
      .modern-sidebar-bg button {
        color: #003366 !important;
        border-bottom: none !important;
      }
      
      .modern-sidebar-bg button:hover {
        background-color: #f1f5f9 !important;
      }
      
      .modern-sidebar-bg .text-white {
        color: #003366 !important;
      }

      /* Specific rules to ensure Sidebar Drawer has an absolutely solid background (using the app's global bg color) with NO glass/blur filters */
      .drawer-content {
        background-clip: padding-box !important;
        background: var(--app-bg) !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        opacity: 1 !important;
      }

      /* Specific rules to ensure Bottom Navigation Bar has absolutely solid background with NO glass/blur filters */
      .bottom-nav-solid {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        opacity: 1 !important;
      }
      
      .bottom-nav-solid::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background: inherit;
      }

      /* Global override when wallpaper is present to prevent inline backgrounds on view content elements from duplicating/scaling the wallpaper */
      .has-wallpaper .app-container,
      .has-wallpaper .app-container [style*="url("]:not(header):not(.bottom-nav-solid):not(aside) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }

      /* ========================================================================== */
      /* UNIFIED & ISOLATED INPUT FIELD STYLES (GLOBAL OVERRIDES) */
      /* Any changes made here dynamically style all input fields in the app! */
      /* ========================================================================== */
      
      .input-field-container {
        background-color: transparent !important;
        background: transparent !important;
        border: 1px solid var(--input-border-color, rgba(0, 0, 0, 0.45)) !important;
        border-color: var(--input-border-color, rgba(0, 0, 0, 0.45)) !important;
        border-radius: 8px !important;
        transition: none !important;
      }

      .light .input-field-container {
        background-color: transparent !important;
        background: transparent !important;
        border: 1px solid rgba(0, 0, 0, 0.25) !important;
        border-color: rgba(0, 0, 0, 0.25) !important;
      }
      .light .input-field-container:hover {
        border-color: var(--primary, #10b981) !important;
      }
      .light .input-field-container:focus-within {
        border-color: var(--primary, #10b981) !important;
      }

      .dark .input-field-container:not([data-login="true"]),
      .dark-mode .input-field-container:not([data-login="true"]),
      .dark-theme .input-field-container:not([data-login="true"]) {
        background-color: transparent !important;
        background: transparent !important;
        border: 1px solid rgba(255, 255, 255, 0.54) !important;
        border-color: rgba(255, 255, 255, 0.54) !important;
      }

      /* Hover & Focus State Borders */
      .input-field-container:hover {
        border-color: var(--primary, #10b981) !important;
      }
      .input-field-container:focus-within {
        border-color: var(--primary, #10b981) !important;
        box-shadow: none !important;
      }

      /* Inner elements are ALWAYS transparent to let container's var(--card-bg) show through */
      .input-field-container input:not([type="checkbox"]):not([type="radio"]),
      .input-field-container select,
      .input-field-container textarea,
      .input-field-container .country-code-btn {
        background-color: transparent !important;
        background: transparent !important;
        box-shadow: none !important;
        border: none !important;
        outline: none !important;
        color: var(--text-main, #111827) !important;
        -webkit-text-fill-color: var(--text-main, #111827) !important;
      }

      /* Base / Light Mode placeholders */
      .input-field-container input::placeholder,
      .input-field-container textarea::placeholder,
      input::placeholder,
      textarea::placeholder {
        color: var(--text-muted, rgba(17, 24, 39, 0.45)) !important;
        -webkit-text-fill-color: var(--text-muted, rgba(17, 24, 39, 0.45)) !important;
        opacity: 1 !important;
      }

      /* Explicit Dark Mode Overrides for text color */
      .dark input:not([type="checkbox"]):not([type="radio"]),
      .dark select,
      .dark textarea,
      .dark-mode input:not([type="checkbox"]):not([type="radio"]),
      .dark-mode select,
      .dark-mode textarea,
      .dark-theme input:not([type="checkbox"]):not([type="radio"]),
      .dark-theme select,
      .dark-theme textarea,
      .dark .input-field-container:not([data-login="true"]) input:not([type="checkbox"]):not([type="radio"]),
      .dark .input-field-container:not([data-login="true"]) select,
      .dark .input-field-container:not([data-login="true"]) textarea,
      .dark .input-field-container:not([data-login="true"]) .country-code-btn,
      .dark-mode .input-field-container:not([data-login="true"]) input:not([type="checkbox"]):not([type="radio"]),
      .dark-mode .input-field-container:not([data-login="true"]) select,
      .dark-mode .input-field-container:not([data-login="true"]) textarea,
      .dark-mode .input-field-container:not([data-login="true"]) .country-code-btn,
      .dark-theme .input-field-container:not([data-login="true"]) input:not([type="checkbox"]):not([type="radio"]),
      .dark-theme .input-field-container:not([data-login="true"]) select,
      .dark-theme .input-field-container:not([data-login="true"]) textarea,
      .dark-theme .input-field-container:not([data-login="true"]) .country-code-btn {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      /* Explicit Dark Mode Overrides for placeholder */
      .dark input::placeholder,
      .dark textarea::placeholder,
      .dark-mode input::placeholder,
      .dark-mode textarea::placeholder,
      .dark-theme input::placeholder,
      .dark-theme textarea::placeholder,
      .dark .input-field-container:not([data-login="true"]) input::placeholder,
      .dark .input-field-container:not([data-login="true"]) textarea::placeholder,
      .dark-mode .input-field-container:not([data-login="true"]) input::placeholder,
      .dark-mode .input-field-container:not([data-login="true"]) textarea::placeholder,
      .dark-theme .input-field-container:not([data-login="true"]) input::placeholder,
      .dark-theme .input-field-container:not([data-login="true"]) textarea::placeholder {
        color: rgba(255, 255, 255, 0.6) !important;
        -webkit-text-fill-color: rgba(255, 255, 255, 0.6) !important;
        opacity: 1 !important;
      }

      /* Dynamic label background styling */
      .input-field-container label,
      .search-field-container label {
        background: transparent;
        line-height: 1 !important;
        height: auto !important;
        padding-top: 1px !important;
        padding-bottom: 2px !important;
        display: inline-flex !important;
        align-items: center !important;
      }

      .input-field-container label {
        color: var(--text-muted, #4b5563) !important;
        opacity: 0.75 !important;
      }
      .dark .input-field-container[data-theme-mode="light"]:not([data-login="true"]) label,
      .dark-mode .input-field-container[data-theme-mode="light"]:not([data-login="true"]) label,
      .dark-theme .input-field-container[data-theme-mode="light"]:not([data-login="true"]) label,
      .input-field-container[data-theme-mode="light"]:not([data-login="true"]) label {
        color: #000000 !important;
        opacity: 0.85 !important;
      }
      .dark .input-field-container[data-theme-mode="light"]:not([data-login="true"]):focus-within label,
      .dark-mode .input-field-container[data-theme-mode="light"]:not([data-login="true"]):focus-within label,
      .dark-theme .input-field-container[data-theme-mode="light"]:not([data-login="true"]):focus-within label,
      .input-field-container[data-theme-mode="light"]:not([data-login="true"]):focus-within label,
      .dark .input-field-container[data-theme-mode="light"]:not([data-login="true"]) input:focus ~ label,
      .dark-mode .input-field-container[data-theme-mode="light"]:not([data-login="true"]) input:focus ~ label,
      .dark-theme .input-field-container[data-theme-mode="light"]:not([data-login="true"]) input:focus ~ label,
      .input-field-container[data-theme-mode="light"]:not([data-login="true"]) input:focus ~ label {
        color: var(--primary, #10b981) !important;
        opacity: 1 !important;
      }
      .dark .input-field-container:not([data-login="true"]) label,
      .dark-mode .input-field-container:not([data-login="true"]) label,
      .dark-theme .input-field-container:not([data-login="true"]) label {
        color: #ffffff !important;
        opacity: 0.9 !important;
      }
      .dark .input-field-container:not([data-login="true"]):focus-within label,
      .dark-mode .input-field-container:not([data-login="true"]):focus-within label,
      .dark-theme .input-field-container:not([data-login="true"]):focus-within label,
      .dark .input-field-container:not([data-login="true"]) input:focus ~ label,
      .dark-mode .input-field-container:not([data-login="true"]) input:focus ~ label,
      .dark-theme .input-field-container:not([data-login="true"]) input:focus ~ label {
        color: var(--primary, #10b981) !important;
        opacity: 1 !important;
      }
      .search-field-container label {
        color: var(--search-label-color, var(--text-muted, #4b5563)) !important;
        opacity: 0.75 !important;
      }

      .input-field-container:not([data-login="true"]) input:focus ~ label,
      .input-field-container:not([data-login="true"]) input:not(:placeholder-shown) ~ label,
      .input-field-container:not([data-login="true"]):focus-within label {
        background: var(--dynamic-label-bg, var(--input-bg-solid, var(--card-bg-solid, #ffffff))) !important;
        background-attachment: fixed !important;
        opacity: 1 !important;
        z-index: 50 !important;
        color: var(--input-label-active-color, var(--primary, #10b981)) !important;
        height: 14px !important;
        line-height: 12px !important;
        padding-top: 1px !important;
        padding-bottom: 1px !important;
        padding-left: 6px !important;
        padding-right: 6px !important;
        border-radius: 0px !important;
        display: inline-flex !important;
        align-items: center !important;
      }

      .search-field-container input:focus ~ label,
      .search-field-container input:not(:placeholder-shown) ~ label,
      .search-field-container:focus-within label {
        background: var(--dynamic-label-bg, var(--search-bg-color, var(--app-bg, #ffffff))) !important;
        background-attachment: fixed !important;
        opacity: 1 !important;
        color: var(--search-label-active-color, var(--primary, #10b981)) !important;
        height: 14px !important;
        line-height: 12px !important;
        padding-top: 1px !important;
        padding-bottom: 1px !important;
        padding-left: 6px !important;
        padding-right: 6px !important;
        border-radius: 0px !important;
        display: inline-flex !important;
        align-items: center !important;
      }
      
      .global-select-modal .search-field-container input:focus ~ label,
      .global-select-modal .search-field-container input:not(:placeholder-shown) ~ label,
      .global-select-modal .search-field-container:focus-within label {
        background: var(--dynamic-label-bg, var(--search-bg-color, var(--app-bg, #ffffff))) !important;
        background-attachment: fixed !important;
      }

      /* Allow the app/login background to show through the modal */
      .login-view-modal {
        /* background removed so it inherits from inline styles */
      }



      .input-field-container input:not(:focus):not(:placeholder-shown) ~ label {
        opacity: 0.8 !important;
      }
      .search-field-container input:not(:focus):not(:placeholder-shown) ~ label {
        opacity: 0.8 !important;
      }

      /* Static overrides for input fields on the Login and Signup pages to support dynamic light and dark theme modes */
      .input-field-container[data-login="true"][data-theme-mode="light"] {
        border-color: rgba(0, 0, 0, 0.15) !important;
        background-color: transparent !important;
        background: transparent !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"] {
        border-color: rgba(255, 255, 255, 0.2) !important;
        background-color: transparent !important;
        background: transparent !important;
      }

      .input-field-container[data-login="true"][data-theme-mode="light"]:hover {
        border-color: rgba(0, 0, 0, 0.3) !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"]:hover {
        border-color: rgba(255, 255, 255, 0.4) !important;
      }

      .input-field-container[data-login="true"][data-theme-mode="light"]:focus-within {
        border-color: #10b981 !important;
        box-shadow: none !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"]:focus-within {
        border-color: #10b981 !important;
        box-shadow: none !important;
      }

      .input-field-container[data-login="true"][data-theme-mode="light"]:not(.search-field-container) input:not([type="checkbox"]):not([type="radio"]) {
        color: #111827 !important;
        -webkit-text-fill-color: #111827 !important;
        background-color: transparent !important;
        background: transparent !important;
        border: none !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"]:not(.search-field-container) input:not([type="checkbox"]):not([type="radio"]) {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: transparent !important;
        background: transparent !important;
        border: none !important;
      }

      .input-field-container[data-login="true"][data-theme-mode="light"]:not(.search-field-container) input::placeholder {
        color: rgba(17, 24, 39, 0.45) !important;
        -webkit-text-fill-color: rgba(17, 24, 39, 0.45) !important;
        opacity: 1 !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"]:not(.search-field-container) input::placeholder {
        color: rgba(255, 255, 255, 0.45) !important;
        -webkit-text-fill-color: rgba(255, 255, 255, 0.45) !important;
        opacity: 1 !important;
      }
      
      .input-field-container[data-login="true"][data-theme-mode="light"] input:-webkit-autofill,
      .input-field-container[data-login="true"][data-theme-mode="light"] input:-webkit-autofill:hover,
      .input-field-container[data-login="true"][data-theme-mode="light"] input:-webkit-autofill:focus,
      .input-field-container[data-login="true"][data-theme-mode="light"] input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
        -webkit-text-fill-color: #111827 !important;
        background-color: #ffffff !important;
        border-radius: 0 !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"] input:-webkit-autofill,
      .input-field-container[data-login="true"][data-theme-mode="dark"] input:-webkit-autofill:hover,
      .input-field-container[data-login="true"][data-theme-mode="dark"] input:-webkit-autofill:focus,
      .input-field-container[data-login="true"][data-theme-mode="dark"] input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px #121212 inset !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: #121212 !important;
        border-radius: 0 !important;
      }
      
      /* General autofill overrides for all input fields to prevent flashing yellow/black backgrounds */
      .light .input-field-container input:-webkit-autofill,
      .light .input-field-container input:-webkit-autofill:hover,
      .light .input-field-container input:-webkit-autofill:focus,
      .light .input-field-container input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px var(--card-bg-solid, #ffffff) inset !important;
        -webkit-text-fill-color: #000000 !important;
        background-color: var(--card-bg-solid, #ffffff) !important;
        border-radius: 0 !important;
      }
      .dark .input-field-container input:-webkit-autofill,
      .dark .input-field-container input:-webkit-autofill:hover,
      .dark .input-field-container input:-webkit-autofill:focus,
      .dark .input-field-container input:-webkit-autofill:active,
      .dark-mode .input-field-container input:-webkit-autofill,
      .dark-mode .input-field-container input:-webkit-autofill:hover,
      .dark-mode .input-field-container input:-webkit-autofill:focus,
      .dark-mode .input-field-container input:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px var(--card-bg-solid, #121212) inset !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: var(--card-bg-solid, #121212) !important;
        border-radius: 0 !important;
      }

      .input-field-container[data-login="true"][data-theme-mode="light"]:not(.search-field-container) label {
        color: #4b5563 !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"]:not(.search-field-container) label {
        color: rgba(255, 255, 255, 0.6) !important;
      }

      .input-field-container[data-login="true"][data-theme-mode="light"]:not(.search-field-container) input:focus ~ label,
      .input-field-container[data-login="true"][data-theme-mode="light"]:not(.search-field-container) input:not(:placeholder-shown) ~ label,
      .input-field-container[data-login="true"][data-theme-mode="light"]:not(.search-field-container):focus-within label {
        color: #10b981 !important;
        background: #ffffff !important;
        opacity: 1 !important;
        z-index: 50 !important;
        height: 14px !important;
        line-height: 12px !important;
        padding-top: 1px !important;
        padding-bottom: 1px !important;
        padding-left: 6px !important;
        padding-right: 6px !important;
        border-radius: 0px !important;
        display: inline-flex !important;
        align-items: center !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"]:not(.search-field-container) input:focus ~ label,
      .input-field-container[data-login="true"][data-theme-mode="dark"]:not(.search-field-container) input:not(:placeholder-shown) ~ label,
      .input-field-container[data-login="true"][data-theme-mode="dark"]:not(.search-field-container):focus-within label {
        color: #ffffff !important;
        background: #121212 !important;
        opacity: 1 !important;
        z-index: 50 !important;
        height: 14px !important;
        line-height: 12px !important;
        padding-top: 1px !important;
        padding-bottom: 1px !important;
        padding-left: 6px !important;
        padding-right: 6px !important;
        border-radius: 0px !important;
        display: inline-flex !important;
        align-items: center !important;
      }

      .input-field-container[data-login="true"][data-theme-mode="light"] svg,
      .input-field-container[data-login="true"][data-theme-mode="light"] .absolute {
        color: #6b7280 !important;
      }
      .input-field-container[data-login="true"][data-theme-mode="dark"] svg,
      .input-field-container[data-login="true"][data-theme-mode="dark"] .absolute {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      /* === INDEPENDENT CARD TEXT COLOR LOGIC === */
      .light .bg-card-bg,  
      .light-mode .bg-card-bg,
      .light .bg-nested-card,
      .light-mode .bg-nested-card {
        --text-main: #000000 !important;
        --text-muted: #4b5563 !important;
        color: #000000 !important;
      }
      .light .bg-card-bg .text-text-main,
      .light-mode .bg-card-bg .text-text-main,
      .light .bg-nested-card .text-text-main,
      .light-mode .bg-nested-card .text-text-main {
        color: #000000 !important;
      }
      .light .bg-card-bg .text-text-muted,
      .light-mode .bg-card-bg .text-text-muted,
      .light .bg-nested-card .text-text-muted,
      .light-mode .bg-nested-card .text-text-muted {
        color: #4b5563 !important;
      }

      .dark .bg-card-bg,
      .dark-mode .bg-card-bg,
      .dark-theme .bg-card-bg,
      .dark .bg-nested-card,
      .dark-mode .bg-nested-card,
      .dark-theme .bg-nested-card {
        --text-main: #ffffff !important;
        --text-muted: #d1d5db !important;
        color: #ffffff !important;
      }
      .dark .bg-card-bg .text-text-main,
      .dark-mode .bg-card-bg .text-text-main,
      .dark-theme .bg-card-bg .text-text-main,
      .dark .bg-nested-card .text-text-main,
      .dark-mode .bg-nested-card .text-text-main,
      .dark-theme .bg-nested-card .text-text-main {
        color: #ffffff !important;
      }
      .dark .bg-card-bg .text-text-muted,
      .dark-mode .bg-card-bg .text-text-muted,
      .dark-theme .bg-card-bg .text-text-muted,
      .dark .bg-nested-card .text-text-muted,
      .dark-mode .bg-nested-card .text-text-muted,
      .dark-theme .bg-nested-card .text-text-muted {
        color: #d1d5db !important;
      }

      /* Nested Overlapping Cards & Dynamic Elevations */
      .bg-nested-card {
        background-color: var(--nested-card-bg) !important;
        background: var(--nested-card-bg) !important;
        transition: none !important;
      }

      /* ==============================================================================
         GLOBAL DARK MODE OVERRIDES (FIXES AS REQUESTED)
         ============================================================================== */
      
      /* 1. Fix for Pending Balance & Local Subpages Background in Dark Mode */
      .dark .fixed.inset-0.z-\\[100\\],
      .dark-mode .fixed.inset-0.z-\\[100\\],
      .dark .fixed.inset-0.z-\\[250\\],
      .dark-mode .fixed.inset-0.z-\\[250\\],
      .dark .fixed.inset-0.z-\\[280\\],
      .dark-mode .fixed.inset-0.z-\\[280\\] {
        background-color: var(--page-bg-solid, #000000) !important;
        background: var(--page-bg-solid, #000000) !important;
      }
      
      /* 2. Dropdown List Cards Background in Dark Mode (Linked to global theme) */
      .dark .global-select-modal:not(.login-view-modal),
      .dark-mode .global-select-modal:not(.login-view-modal),
      .dark-theme .global-select-modal:not(.login-view-modal),
      .global-select-modal.dark:not(.login-view-modal),
      .global-select-modal.dark-mode:not(.login-view-modal) {
        background-color: var(--card-bg, #121212) !important;
        background: var(--card-bg, #121212) !important;
        color: #ffffff !important;
      }

      /* 2b. Dynamic Color Adaptation overrides for Login/Signup Modals */
      .login-view-modal {
        background-color: var(--auth-modal-bg) !important;
        background: var(--auth-modal-bg) !important;
        color: var(--auth-modal-text) !important;
        border-color: var(--auth-modal-border) !important;
      }
      .dark .login-view-modal,
      .dark-mode .login-view-modal,
      .dark-theme .login-view-modal,
      .login-view-modal.dark,
      .login-view-modal.dark-mode {
        background-color: var(--auth-modal-bg) !important;
        background: var(--auth-modal-bg) !important;
        color: var(--auth-modal-text) !important;
        border-color: var(--auth-modal-border) !important;
      }
      .login-view-modal h2,
      .dark .login-view-modal h2,
      .dark-mode .login-view-modal h2,
      .dark-theme .login-view-modal h2,
      .login-view-modal.dark h2,
      .login-view-modal.dark-mode h2 {
        color: var(--auth-modal-text) !important;
        -webkit-text-fill-color: var(--auth-modal-text) !important;
      }
      .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]),
      .dark .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]),
      .dark-mode .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]),
      .dark-theme .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]),
      .login-view-modal.dark button:not(.bg-\\[var\\(--primary\\)\\]),
      .login-view-modal.dark-mode button:not(.bg-\\[var\\(--primary\\)\\]) {
        background-color: var(--auth-modal-btn-bg) !important;
        color: var(--auth-modal-btn-text) !important;
      }
      .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .dark .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .dark-mode .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .dark-theme .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .login-view-modal.dark button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .login-view-modal.dark-mode button:not(.bg-\\[var\\(--primary\\)\\]) span {
        color: var(--auth-modal-btn-text) !important;
        -webkit-text-fill-color: var(--auth-modal-btn-text) !important;
      }
      .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .dark .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .dark-mode .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .dark-theme .login-view-modal button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .login-view-modal.dark button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .login-view-modal.dark-mode button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\] {
        color: var(--auth-modal-muted) !important;
        -webkit-text-fill-color: var(--auth-modal-muted) !important;
      }
      .login-view-modal input,
      .dark .login-view-modal input,
      .dark-mode .login-view-modal input,
      .login-view-modal.dark input,
      .login-view-modal.dark-mode input {
        background-color: var(--auth-modal-bg) !important;
        color: var(--auth-modal-text) !important;
        border-color: var(--auth-modal-border) !important;
      }
      .login-view-modal button.absolute,
      .dark .login-view-modal button.absolute,
      .dark-mode .login-view-modal button.absolute,
      .login-view-modal.dark button.absolute,
      .login-view-modal.dark-mode button.absolute {
        background-color: var(--auth-modal-btn-bg) !important;
        color: var(--auth-modal-text) !important;
      }

      .dark .global-select-modal .absolute.inset-0.z-0,
      .dark-mode .global-select-modal .absolute.inset-0.z-0,
      .dark-theme .global-select-modal .absolute.inset-0.z-0,
      .global-select-modal.dark .absolute.inset-0.z-0,
      .global-select-modal.dark-mode .absolute.inset-0.z-0 {
        background: transparent !important;
        background-color: transparent !important;
      }

      .dark .global-select-modal h2,
      .dark-mode .global-select-modal h2,
      .dark-theme .global-select-modal h2,
      .global-select-modal.dark h2,
      .global-select-modal.dark-mode h2 {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      .dark .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]),
      .dark-mode .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]),
      .dark-theme .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]),
      .global-select-modal.dark button:not(.bg-\\[var\\(--primary\\)\\]),
      .global-select-modal.dark-mode button:not(.bg-\\[var\\(--primary\\)\\]) {
        background-color: rgba(255, 255, 255, 0.08) !important;
        color: #ffffff !important;
      }

      .dark .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .dark-mode .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .dark-theme .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .global-select-modal.dark button:not(.bg-\\[var\\(--primary\\)\\]) span,
      .global-select-modal.dark-mode button:not(.bg-\\[var\\(--primary\\)\\]) span {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      .dark .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .dark-mode .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .dark-theme .global-select-modal button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .global-select-modal.dark button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\],
      .global-select-modal.dark-mode button:not(.bg-\\[var\\(--primary\\)\\]) span.text-\\[9px\\] {
        color: rgba(255, 255, 255, 0.6) !important;
        -webkit-text-fill-color: rgba(255, 255, 255, 0.6) !important;
        opacity: 0.8 !important;
      }

      .dark .global-select-modal button.bg-\\[var\\(--primary\\)\\],
      .dark-mode .global-select-modal button.bg-\\[var\\(--primary\\)\\],
      .dark-theme .global-select-modal button.bg-\\[var\\(--primary\\)\\],
      .global-select-modal.dark button.bg-\\[var\\(--primary\\)\\],
      .global-select-modal.dark-mode button.bg-\\[var\\(--primary\\)\] {
        background-color: var(--primary) !important;
        background: var(--primary) !important;
        color: #ffffff !important;
      }

      .dark .global-select-modal button.bg-\\[var\\(--primary\\)\\] span,
      .dark-mode .global-select-modal button.bg-\\[var\\(--primary\\)\\] span,
      .dark-theme .global-select-modal button.bg-\\[var\\(--primary\\)\\] span,
      .global-select-modal.dark button.bg-\\[var\\(--primary\\)\\] span,
      .global-select-modal.dark-mode button.bg-\\[var\\(--primary\\)\] span {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      .dark .global-select-modal button.bg-\\[var\\(--primary\\)\\] .absolute.inset-0.bg-\\[var\\(--primary\\)\\].z-0,
      .dark-mode .global-select-modal button.bg-\\[var\\(--primary\\)\\] .absolute.inset-0.bg-\\[var\\(--primary\\)\\].z-0,
      .dark-theme .global-select-modal button.bg-\\[var\\(--primary\\)\\] .absolute.inset-0.bg-\\[var\\(--primary\\)\\].z-0,
      .global-select-modal.dark button.bg-\\[var\\(--primary\\)\\] .absolute.inset-0.bg-\\[var\\(--primary\\)\\].z-0,
      .global-select-modal.dark-mode button.bg-\\[var\\(--primary\\)\\] .absolute.inset-0.bg-\\[var\\(--primary\\)\\].z-0 {
        background-color: var(--primary) !important;
        background: var(--primary) !important;
      }

      .dark .global-select-modal button.absolute,
      .dark-mode .global-select-modal button.absolute,
      .dark-theme .global-select-modal button.absolute,
      .global-select-modal.dark button.absolute,
      .global-select-modal.dark-mode button.absolute {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
        background-color: rgba(255, 255, 255, 0.1) !important;
      }
      .dark .global-select-modal button.absolute:hover,
      .dark-mode .global-select-modal button.absolute:hover,
      .dark-theme .global-select-modal button.absolute:hover,
      .global-select-modal.dark button.absolute:hover,
      .global-select-modal.dark-mode button.absolute:hover {
        background-color: rgba(255, 255, 255, 0.2) !important;
      }

      /* 3. Input Box Text and Placeholder Visibility in Dark Mode */
      .dark input:not([type="checkbox"]):not([type="radio"]),
      .dark-mode input:not([type="checkbox"]):not([type="radio"]),
      .dark textarea,
      .dark-mode textarea {
        color: #ffffff !important;
        -webkit-text-fill-color: #ffffff !important;
      }

      .dark input::placeholder,
      .dark-mode input::placeholder,
      .dark textarea::placeholder,
      .dark-mode textarea::placeholder {
        color: rgba(255, 255, 255, 0.6) !important;
        -webkit-text-fill-color: rgba(255, 255, 255, 0.6) !important;
        opacity: 1 !important;
      }
      
      /* Ensure search inputs inside modals also respect dynamic background and use the search text color variable */
      .dark .global-select-modal input,
      .dark-mode .global-select-modal input {
        color: var(--search-text-color, #ffffff) !important;
        -webkit-text-fill-color: var(--search-text-color, #ffffff) !important;
      }

      /* ==============================================================================
         GLOBAL DARK MODE HEADER OVERRIDE
         ============================================================================== */
      
      .dark .safe-top,
      .dark-mode .safe-top,
      .dark-theme .safe-top {
        background-color: var(--header-bg, var(--page-bg-solid, #000000)) !important;
        background: var(--header-bg, var(--page-bg-solid, #000000)) !important;
      }
      
      /* Let modal headers inherit the modal background instead of forcing black */
      .dark .global-select-modal .safe-top,
      .dark-mode .global-select-modal .safe-top,
      .dark-theme .global-select-modal .safe-top,
      .global-select-modal.dark .safe-top,
      .global-select-modal.dark-mode .safe-top,
      .global-select-modal.dark-theme .safe-top {
        background: transparent !important;
        background-color: transparent !important;
      }
      
      .dark .safe-top [style*="color"],
      .dark-mode .safe-top [style*="color"],
      .dark-theme .safe-top [style*="color"],
      .dark .safe-top h1,
      .dark-mode .safe-top h1,
      .dark .safe-top h2,
      .dark-mode .safe-top h2,
      .dark .safe-top h3,
      .dark-mode .safe-top h3 {
        color: #ffffff !important;
      }
      
      .dark .safe-top .bg-white,
      .dark-mode .safe-top .bg-white,
      .dark-theme .safe-top .bg-white {
        background-color: transparent !important;
      }

      /* ==============================================================================
         GLOBAL UNIFIED LIGHT MODE & DARK MODE STYLING PROTOCOL
         ============================================================================== */

      /* ------------------------------------------------------------------------------
         LIGHT MODE GLOBAL RULES
         ------------------------------------------------------------------------------ */
      .light, .light-mode {
        /* Cards & Modals: Full White background */
        --card-bg: #ffffff !important;
        --card-bg-solid: #ffffff !important;
        --theme-card: #ffffff !important;
        --form-bg: #ffffff !important;

        .bg-white,
        .bg-theme-card,
        .bg-card-bg,
        .bg-sidebar-bg,
        .bg-form-bg {
          background-color: #ffffff !important;
          background: #ffffff !important;
        }

        .global-select-modal:not(.login-view-modal) {
          background: var(--app-bg) !important;
          background-color: var(--app-bg) !important;
        }

        /* Input Border & Focus: Light Black */
        .input-field-container {
          border: 1px solid rgba(0, 0, 0, 0.25) !important;
          border-color: rgba(0, 0, 0, 0.25) !important;
        }
        .input-field-container:hover,
        .input-field-container:focus-within {
          border-color: var(--primary, #10b981) !important;
        }

        /* Input Labels & Placeholders: Full Black */
        .input-field-container:not(.search-field-container):not([data-search="true"]):not(:has(input[name*="search" i])):not(:has(input[id*="search" i])):not(:has(input[placeholder*="search" i])) label:not([style*="rgb(239, 68, 68)"]):not(.\!text-red-500) {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
          opacity: 1 !important;
        }
        .input-field-container:not(.search-field-container):not([data-search="true"]):not(:has(input[name*="search" i])):not(:has(input[id*="search" i])):not(:has(input[placeholder*="search" i])) input::placeholder,
        .input-field-container textarea::placeholder,
        input:not([type="checkbox"]):not([type="radio"]):not([id*="search" i]):not([name*="search" i]):not([placeholder*="search" i]):not([type="search"]):not(.search-field-input):not([data-search="true"])::placeholder,
        textarea::placeholder {
          color: rgba(0, 0, 0, 0.5) !important;
          -webkit-text-fill-color: rgba(0, 0, 0, 0.5) !important;
          opacity: 1 !important;
        }

        /* Input Typed Text: Full Black */
        .input-field-container input:not([id*="search" i]):not([name*="search" i]):not([placeholder*="search" i]):not([type="search"]):not(.search-field-input):not([data-search="true"]),
        .input-field-container textarea,
        .input-field-container select,
        input:not([type="checkbox"]):not([type="radio"]):not([id*="search" i]):not([name*="search" i]):not([placeholder*="search" i]):not([type="search"]):not(.search-field-input):not([data-search="true"]),
        textarea,
        select {
          color: #000000 !important;
          -webkit-text-fill-color: #000000 !important;
        }

        /* Icons inside inputs: Full Black */
        .input-field-container:not(.search-field-container):not([data-search="true"]):not(:has(input[name*="search" i])):not(:has(input[id*="search" i])):not(:has(input[placeholder*="search" i])) svg {
          color: #000000 !important;
          stroke: #000000 !important;
          opacity: 0.7 !important;
        }
      }

      /* ------------------------------------------------------------------------------
         DARK MODE GLOBAL RULES
         ------------------------------------------------------------------------------ */
      .dark, .dark-mode, .dark-theme {
        /* Cards & Modals: #000000 background globally */
        --card-bg: #121212 !important;
        --card-bg-solid: #121212 !important;
        --theme-card: #121212 !important;
        --form-bg: #121212 !important;

        .bg-white,
        .bg-theme-card,
        .bg-card-bg,
        .bg-sidebar-bg,
        .bg-form-bg,
        .bg-neutral-800,
        .bg-neutral-900,
        .bg-slate-800,
        .bg-slate-900,
        .bg-zinc-800,
        .bg-zinc-900,
        .bg-gray-800,
        .bg-gray-900,
        .global-select-modal {
          background-color: #121212 !important;
          background: #121212 !important;
        }

        /* Input Border & Focus: Light White */
        .input-field-container {
          border: 1px solid rgba(255, 255, 255, 0.4) !important;
          border-color: rgba(255, 255, 255, 0.4) !important;
        }
        .input-field-container:hover,
        .input-field-container:focus-within {
          border-color: var(--primary, #10b981) !important;
        }

        /* Input Labels & Placeholders: Light White */
        .input-field-container label:not([style*="rgb(239, 68, 68)"]):not(.\!text-red-500) {
          color: rgba(255, 255, 255, 0.7) !important;
          -webkit-text-fill-color: rgba(255, 255, 255, 0.7) !important;
          opacity: 1 !important;
        }
        .input-field-container input::placeholder,
        .input-field-container textarea::placeholder,
        input::placeholder,
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.7) !important;
          -webkit-text-fill-color: rgba(255, 255, 255, 0.7) !important;
          opacity: 1 !important;
        }

        /* Input Typed Text: Full White */
        .input-field-container input:not([id*="search" i]),
        .input-field-container textarea,
        .input-field-container select,
        input:not([type="checkbox"]):not([type="radio"]):not([id*="search" i]),
        textarea,
        select {
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        /* Icons inside inputs: Full White */
        .input-field-container svg {
          color: #ffffff !important;
          stroke: #ffffff !important;
          opacity: 0.8 !important;
        }
      }

      /* Error Color Restoration */
      .input-field-container label.\\!text-red-500,
      .input-field-container label[style*="rgb(239, 68, 68)"] {
        color: rgb(239, 68, 68) !important;
        -webkit-text-fill-color: rgb(239, 68, 68) !important;
      }

      /* Manager Profile Section Styles */
      .manager-tab-container {
        border-radius: 8px !important;
      }
      .manager-profile-card {
        border-radius: 10px !important;
      }

      /* Monthly File Section Styles */
      .monthly-file-details-container {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }



     `}</style>
  </React.StrictMode>
);
