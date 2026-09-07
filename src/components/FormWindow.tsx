import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store';

interface FormWindowProps {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
}

const FormWindow: React.FC<FormWindowProps> = ({ children, title, onClose }) => {
  const { isNightMode, appThemeMode, backgroundColor, wallpaper, theme, isDarkMode: storeIsDarkMode } = useStore();
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';
  const isLightWhite = appThemeMode === 'light';

  const appBgStyle = {
    background: wallpaper 
      ? `url(${wallpaper}) center/cover no-repeat` 
      : (backgroundColor ? backgroundColor : 'var(--card-bg)'),
  } as React.CSSProperties;

  const lightModeBgStyle = {
    background: wallpaper 
      ? `url(${wallpaper}) center/cover no-repeat` 
      : (backgroundColor || 'var(--app-bg)'),
  } as React.CSSProperties;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center lg:p-10 pointer-events-none"
      style={{ background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)') }}
    >
      <div
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onClick={onClose}
      />
      <div
        className={`relative w-full h-full lg:h-auto lg:max-h-[90vh] max-w-5xl lg:rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.3)] flex flex-col pointer-events-auto overflow-hidden text-text-main`}
        style={{ background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)') }}
      >
        <div 
          className="flex flex-col shadow-sm safe-top"
          style={{ 
            background: 'var(--header-bg)' 
          }}
        >
          <div className="h-16 flex items-center justify-between px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="p-2 -ml-2 rounded-lg transition-colors"
                style={{ color: 'var(--header-text)' }}
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className={`text-lg lg:text-xl font-black uppercase tracking-widest`} style={{ color: 'var(--header-text)' }}>{title}</h2>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide pb-[calc(150px+env(safe-area-inset-bottom))] lg:pb-20 scroll-smooth" style={{ scrollPaddingBottom: '100px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default FormWindow;
