import React, { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import { useStore } from '@/store';
import { WORLD_COUNTRIES } from '@/utils/countryUtils';

interface CountryCodeDropdownProps {
  selectedCode: string;
  onSelect: (dialCode: string) => void;
  error?: boolean;
}

const getLocalContrastColor = (colorStr: string): string => {
  let clean = (colorStr || '').trim().toLowerCase();
  if (!clean || clean === 'transparent' || clean === 'rgba(0,0,0,0)' || clean === 'rgba(0, 0, 0, 0)') return '#000000';
  if (clean === 'white' || clean === '#ffffff' || clean === '#fff') return '#000000';
  if (clean === 'black' || clean === '#000000' || clean === '#000') return '#ffffff';

  const rgbMatch = clean.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000000' : '#ffffff';
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
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      return yiq >= 128 ? '#000000' : '#ffffff';
    }
  }
  return '#000000';
};

const CountryCodeDropdown: React.FC<CountryCodeDropdownProps> = ({ selectedCode, onSelect, error }) => {
  const { appThemeMode, currentView, countries, loginWallpaper, loginBackgroundColor, wallpaper, backgroundColor } = useStore();
  const isLoginView = currentView === 'LOGIN' || currentView === 'SIGNUP';
  const isBackgroundLight = isLoginView 
    ? true
    : (appThemeMode === 'light');

  const [isOpen, setIsOpen] = useState(false);
  const countryDetail = useMemo(() => {
    if (!selectedCode) return null;
    // First find in WORLD_COUNTRIES by code or dial_code
    const wc = WORLD_COUNTRIES.find(c => c.code === selectedCode || c.dial_code === selectedCode);
    if (wc) return wc;
    // Fallback to searching in store countries
    const storeC = countries.find(c => c.code === selectedCode);
    if (storeC) {
      const wcFallback = WORLD_COUNTRIES.find(w => w.code === storeC.code);
      return wcFallback || { name: storeC.name, code: storeC.code, flag: storeC.flag, dial_code: storeC.code };
    }
    return null;
  }, [countries, selectedCode]);

  const displayVal = useMemo(() => {
    if (!selectedCode) return '';
    return countryDetail ? countryDetail.dial_code : selectedCode;
  }, [selectedCode, countryDetail]);

  const shakeVariants = {
    shake: {
      x: [0, -5, 5, -5, 5, 0],
      transition: { duration: 0 }
    }
  };

  const options = useMemo(() => {
    return countries.map(c => {
      const wc = WORLD_COUNTRIES.find(w => w.code === c.code);
      const dialCode = wc?.dial_code || c.code;
      return {
        label: dialCode,
        value: dialCode,
        icon: c.flag,
        subLabel: c.name
      };
    });
  }, [countries]);

  return (
    <div 
      
      
      className={`input-field-container relative group transition-all duration-300 rounded-lg border w-24 flex-shrink-0 h-14 ${isOpen ? 'z-50' : 'z-20'}`}
      data-login={isLoginView ? "true" : "false"}
      style={{ 
        backgroundColor: error 
          ? (isBackgroundLight ? '#fee2e2' : '#450a0a') 
          : 'transparent',
        borderWidth: '1px',
        borderColor: error ? 'rgb(239, 68, 68)' : (isOpen ? 'var(--primary)' : (isLoginView ? (isBackgroundLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.3)') : 'var(--input-border-color)'))
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="country-code-btn relative flex items-center justify-between w-full h-full px-3 pt-4 pb-1 rounded-lg text-sm bg-transparent focus:outline-none transition-shadow"
        style={{ color: isBackgroundLight ? '#000000' : '#ffffff' }}
      >
        <label
          className={`absolute font-extrabold tracking-wider transition-all duration-200 pointer-events-none z-10 left-3
            ${isOpen || selectedCode ? 'top-[4px] text-[10px]' : 'top-1/2 -translate-y-1/2 text-[12px]'}
          `}
          style={{
            color: error ? 'rgb(239, 68, 68)' : (isOpen || selectedCode ? 'var(--primary)' : (isBackgroundLight ? '#6b7280' : 'rgba(255, 255, 255, 0.6)'))
          }}
        >
          Code
        </label>
        <div className="flex items-center justify-start w-full">
          <span className="font-medium" style={{ color: isBackgroundLight ? '#000000' : '#ffffff' }}>{displayVal}</span>
        </div>
        <ChevronDown size={16} style={{ color: isBackgroundLight ? '#4b5563' : '#e5e7eb' }} />
      </button>

      <GlobalFullscreenSelect
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Country Code"
        options={options}
        onSelect={(val) => {
          onSelect(val);
          setIsOpen(false);
        }}
        selectedValue={displayVal}
      />
    </div>
  );
};

export default CountryCodeDropdown;
