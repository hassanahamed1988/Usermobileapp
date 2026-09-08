
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';

interface FloatingInputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  id?: string;
  className?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  pattern?: string;
  icon?: React.ReactNode;
  error?: boolean;
  readOnly?: boolean;
  textColor?: string;
  bgColor?: string;
  placeholder?: string;
}

const FloatingInput: React.FC<FloatingInputProps> = ({ label, value, onChange, type = "text", required = false, id, className, inputMode, pattern, icon, error, readOnly = false, textColor, bgColor, placeholder }) => {
  const { theme, backgroundColor, wallpaper, appThemeMode, currentView, loginBackgroundColor, language } = useStore();
  const inputId = id || (label || '').replace(/\s+/g, '-').toLowerCase();

  const containerRef = useRef<HTMLDivElement>(null);

  const isSearchInput = (label?.toLowerCase() || '').includes('search') || (label || '').includes('সার্চ') || id?.toLowerCase().includes('search');
  const isDarkMode = theme === 'night-mode' || appThemeMode === 'dark';
  const isLightMode = appThemeMode === 'light';
  const isLoginView = currentView === 'LOGIN' || currentView === 'SIGNUP';
  const hasValue = value !== '' && value !== null && value !== undefined;

  const [isFocused, setIsFocused] = useState(false);

  const cleanLabel = (label || '').replace(/[*:]/g, '').trim();
  const defaultPlaceholder = (language === 'bn' || /[\u0980-\u09FF]/.test(label))
    ? `${cleanLabel} লিখুন`
    : `Enter ${cleanLabel}`;

  const activePlaceholder = isFocused ? (placeholder || defaultPlaceholder) : "";

  // Compute synchronous initial values to prevent visual jump/flash
  const getInitialValues = () => {
    let initialBg = bgColor || 'transparent';
    if (!bgColor) {
      if (textColor) {
        const isTextWhite = textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === 'rgb(255, 255, 255)' || textColor.toLowerCase() === 'rgba(255, 255, 255, 1)';
        if (isTextWhite) {
          initialBg = (isLoginView || isSearchInput) ? '#090d1a' : '#111827';
        } else {
          initialBg = '#ffffff';
        }
      } else {
        initialBg = isDarkMode ? '#111827' : '#ffffff';
      }
    }

    const clean = initialBg.trim().toLowerCase();
    const isDark = clean === '#000000' || clean === '#111827' || clean === '#090d1a' || isDarkMode;
    const initialColor = textColor || (isDark ? '#ffffff' : '#000000');

    return { bg: initialBg, dark: isDark, color: initialColor };
  };

  const initialVals = getInitialValues();

  const [dynamicColor, setDynamicColor] = useState(initialVals.color);
  const [isDarkBg, setIsDarkBg] = useState(initialVals.dark);
  const [dynamicBgColor, setDynamicBgColor] = useState(initialVals.bg);

  const isActive = isFocused || hasValue;
  const labelTransform = isActive 
    ? 'translateY(-30px) scale(0.83) translateX(0px)' 
    : `translateY(-50%) scale(1) translateX(${icon ? '24px' : '0px'})`;

  useEffect(() => {
    if (textColor && bgColor) {
      // If parent explicitly passed textColor and bgColor, avoid any async calculations
      setDynamicColor(textColor);
      setDynamicBgColor(bgColor);
      const clean = bgColor.trim().toLowerCase();
      setIsDarkBg(clean === '#000000' || clean === '#111827' || clean === '#090d1a' || isDarkMode);
      return;
    }

    let active = true;
    const calculateColor = () => {
      if (!active || !containerRef.current) return;
      
      const getLuminance = (colorStr: string): number => {
        let clean = (colorStr || '').trim().toLowerCase();
        if (!clean || clean === 'transparent' || clean === 'rgba(0, 0, 0, 0)' || clean === 'rgba(0,0,0,0)') {
          return 0; // default to dark background
        }
        if (clean === 'white' || clean === '#ffffff' || clean === '#fff') return 1;
        if (clean === 'black' || clean === '#000000' || clean === '#000') return 0;

        const rgbMatch = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1], 10);
          const g = parseInt(rgbMatch[2], 10);
          const b = parseInt(rgbMatch[3], 10);
          const [rN, gN, bN] = [r / 255, g / 255, b / 255].map(v => {
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rN + 0.7152 * gN + 0.0722 * bN;
        }

        if (clean.includes('gradient')) {
          const match = clean.match(/#([0-9a-fA-F]{3,6})/);
          if (match) clean = match[0];
        }

        if (clean.startsWith('#')) {
          let hex = clean.replace('#', '');
          if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
          }
          if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            const [rN, gN, bN] = [r / 255, g / 255, b / 255].map(v => {
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rN + 0.7152 * gN + 0.0722 * bN;
          }
        }
        return 0; // Default to dark background
      };

      let bg = 'rgba(0,0,0,0)';
      
      // 1. Walk up parent tree to find exact non-transparent computed background color
      let cur: HTMLElement | null = containerRef.current;
      while (cur) {
        const computedBg = window.getComputedStyle(cur).backgroundColor;
        const isTransparent = !computedBg || computedBg === 'transparent' || computedBg === 'rgba(0, 0, 0, 0)' || computedBg === 'rgba(0,0,0,0)';

        if (!isTransparent) {
          // Check if alpha is greater than 0
          const rgbMatch = computedBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (rgbMatch) {
            const alpha = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
            if (alpha > 0) {
              bg = computedBg;
              break;
            }
          } else {
            bg = computedBg;
            break;
          }
        }
        cur = cur.parentElement;
      }

      // 2. If no parent has a solid background, check custom background state from store
      if (bg === 'rgba(0,0,0,0)' || bg === 'transparent' || !bg) {
        const effectiveBgProp = (currentView === 'LOGIN' || currentView === 'SIGNUP') 
          ? (loginBackgroundColor || backgroundColor) 
          : backgroundColor;
        if (effectiveBgProp && typeof effectiveBgProp === 'string' && effectiveBgProp.trim() !== '' && effectiveBgProp !== 'transparent') {
          bg = effectiveBgProp;
        }
      }

      // 3. Fall back to theme defaults if still transparent
      if (bg === 'rgba(0,0,0,0)' || bg === 'transparent' || !bg) {
        if (textColor) {
          const isTextWhite = textColor.toLowerCase() === '#ffffff' || textColor.toLowerCase() === 'rgb(255, 255, 255)' || textColor.toLowerCase() === 'rgba(255, 255, 255, 1)';
          if (isTextWhite) {
            bg = (currentView === 'LOGIN' || currentView === 'SIGNUP' || isSearchInput) ? '#090d1a' : '#111827';
          } else {
            bg = '#ffffff';
          }
        } else {
          bg = isDarkMode ? '#111827' : '#ffffff';
        }
      }

      const resolvedBgColor = bgColor || bg;
      
      if (textColor) {
        setDynamicColor(textColor);
        const textLuminance = getLuminance(textColor);
        setIsDarkBg(textLuminance > 0.5);
      } else {
        const luminance = getLuminance(resolvedBgColor);
        const dark = luminance < 0.5;
        setIsDarkBg(dark);
        setDynamicColor(dark ? '#ffffff' : '#000000');
      }

      setDynamicBgColor(resolvedBgColor);
    };

    calculateColor();
    const t1 = setTimeout(calculateColor, 50);
    const t2 = setTimeout(calculateColor, 250);

    window.addEventListener('resize', calculateColor);
    return () => {
      active = false;
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', calculateColor);
    };
  }, [isSearchInput, backgroundColor, loginBackgroundColor, wallpaper, value, currentView, theme, appThemeMode, textColor, bgColor]);

  const shakeVariants = {
    shake: {
      x: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0 }
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`input-field-container relative w-full transition-colors duration-200 rounded-lg border ${isFocused ? 'z-50' : 'z-10'} ${isSearchInput ? 'search-field-container' : ''} ${className?.includes('h-') ? '' : 'h-14'} ${className || ''}`}
      style={{
        backgroundColor: error ? 'rgba(239, 68, 68, 0.1)' : (bgColor || dynamicBgColor || 'transparent'),
        boxShadow: isSearchInput ? 'none' : undefined,
        borderWidth: isFocused ? '2px' : '1px',
        borderColor: error 
          ? 'rgb(239, 68, 68)' 
          : (isFocused 
              ? (isDarkBg ? '#ffffff' : 'var(--primary, #10b981)') 
              : (isDarkBg ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)')),
        '--search-text-color': dynamicColor,
        '--search-placeholder-color': isDarkBg ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
        '--search-label-color': isDarkBg ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
        '--search-icon-color': isDarkBg ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
        '--search-border-color': isDarkBg ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        '--search-focus-border-color': isDarkBg ? '#ffffff' : 'var(--primary, #10b981)',
        '--search-label-active-color': dynamicColor,
        '--search-bg-color': dynamicBgColor,
        '--dynamic-label-bg': bgColor || dynamicBgColor,
      } as React.CSSProperties}
      data-login={isLoginView ? "true" : "false"}
    >
      <input
        id={inputId}
        type={type}
        required={required}
        value={value}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        inputMode={readOnly ? "none" : (inputMode || (type === 'number' || type === 'tel' ? 'numeric' : undefined))}
        pattern={pattern || (inputMode === 'decimal' ? '[0-9]*[.,]?[0-9]*' : (type === 'number' || type === 'tel' ? '[0-9]*' : undefined))}
        placeholder={activePlaceholder || " "}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (readOnly) {
            const el = document.getElementById(inputId);
            if (el) el.blur();
          } else {
            setIsFocused(true);
          }
        }}
        onBlur={() => setIsFocused(false)}
        className={`peer w-full ${className?.includes('rounded-') ? '' : 'rounded-lg'} bg-transparent outline-none transition-all duration-300 h-full text-[12px] sm:text-sm font-medium ${error ? 'pr-10' : ''}
          ${icon ? (isFocused ? 'pl-3' : 'pl-9') : 'pl-3'}
          placeholder:text-text-muted/60 dark:placeholder:text-white/40 placeholder:text-xs sm:placeholder:text-sm placeholder:font-medium
          ${readOnly ? 'cursor-pointer select-none pointer-events-none' : ''}
        `}
        style={{ 
          color: dynamicColor,
          caretColor: readOnly ? 'transparent' : dynamicColor,
        } as React.CSSProperties}
      />
      {icon && (
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 ease-in-out
          ${isFocused ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}
             style={{ color: isFocused ? dynamicColor : (isDarkBg ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') }}>
          {icon}
        </div>
      )}
      <label 
        htmlFor={inputId}
        className={`absolute font-extrabold tracking-wider text-[12px] floating-label-transition pointer-events-none z-20 rounded-none origin-left left-3 top-1/2
          ${isActive ? 'px-1.5' : 'px-0'}
          ${error ? '!text-red-500' : ''}
        `}
        style={{
          color: error 
            ? 'rgb(239, 68, 68)' 
            : (isFocused 
                ? (isDarkBg ? '#ffffff' : 'var(--primary, #10b981)') 
                : (isDarkBg ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')),
          backgroundColor: isActive ? dynamicBgColor : 'transparent',
          transform: labelTransform,
          boxShadow: 'none',
          textShadow: 'none',
          filter: 'none'
        }}
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingInput;
