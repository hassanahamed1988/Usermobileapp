
import React from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { Check, X } from 'lucide-react';

import { THEMES } from '@/constants';

const ThemeConfirmation: React.FC = () => {
  const { pendingTheme, setPendingTheme, setTheme, theme, backgroundColor, wallpaper, appThemeMode, isDarkMode: storeIsDarkMode, showFeedback } = useStore();

  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || appThemeMode === 'dark';
  const isLightWhite = appThemeMode === 'light';
  const hasCustomBackground = !!(backgroundColor || wallpaper);

  const appBgStyle = {
    background: wallpaper 
      ? `url(${wallpaper}) center/cover no-repeat` 
      : (backgroundColor || 'var(--app-bg)'),
  };

  if (!pendingTheme) return null;

  const handleConfirm = () => {
    setTheme(pendingTheme);
    showFeedback('THEME CHANGED SUCCESSFULLY');
    setPendingTheme(null);
  };

  const handleCancel = () => {
    showFeedback('THEME CHANGE CANCELLED');
    setPendingTheme(null);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <>
        {pendingTheme && (
          <div 
            
            
            
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9990] w-[90%] max-w-md"
          >
            <div 
              className={`p-4 rounded-lg shadow-2xl flex gap-4 ${isDarkMode ? 'dark' : ''}`}
              style={isLightWhite ? { ...appBgStyle } : appBgStyle}
            >
              <button 
                onClick={handleCancel}
                className="flex-1 h-11 bg-red-500 text-white font-black rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-xs"
              >
                <X size={18} />
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 h-11 bg-cyan-500 text-white font-black rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all uppercase text-xs"
              >
                <Check size={18} />
                Submit
              </button>
            </div>
          </div>
        )}
      </>
    </>,
    document.body
  );
};

export default ThemeConfirmation;
