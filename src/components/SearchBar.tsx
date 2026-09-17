
import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../store';

interface SearchBarProps {
  label?: string;
  placeholder?: string;
  activePlaceholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  label = "Search", 
  placeholder, 
  activePlaceholder, 
  value, 
  onChange, 
  className 
}) => {
  const { theme, backgroundColor, wallpaper, appThemeMode } = useStore();
  const [isFocused, setIsFocused] = useState(false);
  const [dynamicColor, setDynamicColor] = useState('#ffffff');
  const [dynamicBgColor, setDynamicBgColor] = useState('#111827');
  const [isDarkBg, setIsDarkBg] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const hasValue = value !== undefined && value !== null && value.toString().length > 0;
  const isFloating = isFocused || hasValue;
  const displayLabel = label || "Search";
  const activeInputPlaceholder = isFocused ? (activePlaceholder || placeholder || "Search by Vehicle number") : "";

  useEffect(() => {
    let active = true;
    const calculateColor = () => {
      if (!active || !containerRef.current) return;
      
      let bg = 'rgba(0,0,0,0)';
      
      // 1. Walk up parent tree to find exact non-transparent computed background
      let cur: HTMLElement | null = containerRef.current;
      while (cur) {
        const computedBg = window.getComputedStyle(cur).backgroundColor;
        if (computedBg && computedBg !== 'transparent' && computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'rgba(0,0,0,0)') {
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
        
        const appBg = window.getComputedStyle(cur).getPropertyValue('--app-bg');
        if (appBg && appBg.trim() && appBg !== 'transparent' && !appBg.includes('var(')) {
          bg = appBg.trim();
          break;
        }
        
        cur = cur.parentElement;
      }

      // 2. Check custom background state from store
      if (bg === 'rgba(0,0,0,0)' || bg === 'transparent') {
        if (backgroundColor && backgroundColor.trim() !== '' && backgroundColor !== 'transparent') {
          bg = backgroundColor;
        }
      }
      
      // 3. Fall back to current root --app-bg variable set on documentElement
      if (bg === 'rgba(0,0,0,0)' || bg === 'transparent') {
        const rootBg = document.documentElement.style.getPropertyValue('--app-bg') || 
                       window.getComputedStyle(document.documentElement).getPropertyValue('--app-bg');
        if (rootBg && rootBg.trim() && rootBg !== 'transparent' && !rootBg.includes('var(')) {
          bg = rootBg.trim();
        }
      }

      // 4. Fall back to theme defaults
      if (bg === 'rgba(0,0,0,0)' || bg === 'transparent') {
        bg = (appThemeMode === 'dark' || theme === 'night-mode') ? '#111827' : '#ffffff';
      }

      setDynamicBgColor(bg);

      const getLuminance = (colorStr: string): number => {
        let clean = (colorStr || '').trim().toLowerCase();
        
        // Resolve CSS variables if present
        if (clean.includes('var(')) {
          // Try to resolve the variable using computed style of the document root
          const varMatch = clean.match(/--[a-zA-Z0-9_-]+/g);
          if (varMatch) {
            for (const varName of varMatch) {
              const val = window.getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
              if (val && val !== 'transparent' && !val.includes('var(')) {
                clean = val.toLowerCase();
                break;
              }
            }
          }
          
          // If still contains var, extract the final fallback hex/rgb value (e.g. #ffffff)
          if (clean.includes('var(')) {
            const hexFallback = clean.match(/#[0-9a-fA-F]{3,6}/);
            if (hexFallback) {
              clean = hexFallback[0];
            } else {
              const rgbFallback = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
              if (rgbFallback) {
                clean = rgbFallback[0];
              } else {
                // Final fallback based on isDarkMode
                clean = (appThemeMode === 'dark' || theme === 'night-mode') ? '#111827' : '#ffffff';
              }
            }
          }
        }

        if (!clean || clean === 'transparent' || clean === 'rgba(0, 0, 0, 0)' || clean === 'rgba(0,0,0,0)') {
          return (appThemeMode === 'dark' || theme === 'night-mode') ? 0 : 1; // Match theme mode if completely transparent
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
        return (appThemeMode === 'dark' || theme === 'night-mode') ? 0 : 1; // Fallback based on active theme
      };

      const luminance = getLuminance(bg);
      const dark = luminance < 0.5;

      setIsDarkBg(dark);
      setDynamicColor(dark ? '#ffffff' : '#000000');
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
  }, [backgroundColor, wallpaper, value, theme, appThemeMode]);

  const labelColor = isFocused 
    ? (isDarkBg ? '#22d3ee' : '#0891b2')
    : (isDarkBg ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)');

  return (
    <div ref={containerRef} className={`relative w-full group ${className || ''}`}>
      {/* Floating Label on top of border line */}
      <label 
        className={`absolute transition-all duration-300 pointer-events-none font-black tracking-wider z-20 whitespace-nowrap rounded-sm
          ${isFloating 
            ? 'top-0 -translate-y-1/2 left-3 text-[10px] px-1.5' 
            : 'top-1/2 -translate-y-1/2 left-11 text-sm px-0'
          }`}
        style={{ 
          color: labelColor,
          backgroundColor: isFloating ? dynamicBgColor : 'transparent',
        }}
      >
        {displayLabel}
      </label>

      {/* Search Icon */}
      <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 transition-all duration-300 ease-in-out
        ${isFocused ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
        <Search 
          size={20} 
          className="transition-colors" 
          style={{ color: isDarkBg ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}
        />
      </div>

      <input
        type="text"
        value={value}
        placeholder={activeInputPlaceholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => onChange?.(e.target.value)}
        className={`block w-full h-14 pr-4 rounded-lg border transition-all duration-300 font-bold text-sm sm:text-base outline-none whitespace-nowrap truncate placeholder:whitespace-nowrap placeholder:truncate placeholder:text-text-muted/60 placeholder:text-xs sm:placeholder:text-sm placeholder:font-medium
          ${isFocused ? 'pl-3.5' : 'pl-11'}
        `}
        style={{ 
          backgroundColor: 'transparent', 
          color: dynamicColor,
          boxShadow: 'none',
          borderColor: isFocused ? '#06b6d4' : 'var(--search-border-color, rgba(128,128,128,0.4))',
          '--search-text-color': dynamicColor,
          '--search-placeholder-color': 'var(--text-muted, rgba(128,128,128,0.6))',
          '--search-label-color': labelColor,
          '--search-icon-color': 'var(--text-main, rgba(128,128,128,0.8))',
          '--search-border-color': 'var(--text-muted, rgba(128,128,128,0.4))',
          '--search-focus-border-color': '#06b6d4',
          borderWidth: isFocused ? '2px' : '1.5px',
          borderStyle: 'solid'
        } as React.CSSProperties}
      />
    </div>
  );
};

export default SearchBar;
