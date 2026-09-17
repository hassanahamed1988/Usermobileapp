import React, { useState, useEffect, useRef, forwardRef, createContext, useContext } from 'react';
import { Check, Eye, EyeOff, Calendar, Clock, X } from 'lucide-react';

import GlobalDateTimePicker from './GlobalDateTimePicker';
import { useStore } from '@/store';
import { THEMES } from '@/constants';

export const InputFieldThemeContext = createContext<'light' | 'dark' | null>(null);

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  options?: any[];
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onOpenModal?: (field: string, label: string, options: any[]) => void;
  currency?: string;
  suggestions?: string[];
  usageCount?: number;
  error?: boolean;
  labelSize?: string;
  inputSize?: string;
  icon?: React.ReactNode;
  leftActionIcon?: React.ReactNode;
  onLeftActionClick?: () => void;
  inputClassName?: string;
  hideCheckmark?: boolean;
  themeMode?: 'light' | 'dark';
  labelBgColor?: string;
}

const getLocalContrastColor = (hexColor: any) => {
  if (!hexColor || typeof hexColor !== 'string') return '#000000';
  let hex = hexColor.trim();
  if (hex.includes('gradient')) {
    const match = hex.match(/#([0-9a-fA-F]{3,6})/);
    if (match) hex = match[0];
    else return '#000000';
  }
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(char => char + char).join('');
  if (hex.length !== 6) return '#000000';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({ 
  label, 
  name, 
  type = 'text', 
  placeholder, 
  options, 
  value, 
  onChange, 
  onFocus, 
  onKeyDown,
  onOpenModal, 
  currency, 
  suggestions, 
  usageCount,
  readOnly,
  className,
  inputClassName,
  error,
  hideCheckmark,
  labelSize = 'text-[12px]',
  inputSize = 'text-[12px]',
  icon,
  leftActionIcon,
  onLeftActionClick,
  themeMode,
  required,
  labelBgColor,
  ...props
}, ref) => {
  const { wallpaper, backgroundColor, theme, appThemeMode, isDarkMode: storeIsDarkMode, isNightMode, currentView, loginCardColor, user, loginWallpaper, loginBackgroundColor, language } = useStore();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Validation visual states
  const [localSubmitError, setLocalSubmitError] = useState(false);
  const [isTypingOrFocusedAfterError, setIsTypingOrFocusedAfterError] = useState(false);

  const contextThemeMode = useContext(InputFieldThemeContext);
  const effectiveThemeMode = themeMode || contextThemeMode;

  const isLoginView = !user || currentView === 'LOGIN' || currentView === 'SIGNUP' || currentView === 'USER_PASSWORD_RESET';
  
  const appRealIsDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';

  const isBackgroundLight = isLoginView 
    ? (effectiveThemeMode ? (effectiveThemeMode === 'dark' ? false : true) : !appRealIsDarkMode)
    : (appThemeMode === 'light');

  const loginCardIsDark = appRealIsDarkMode;
  const effectiveLoginCardIsDark = appRealIsDarkMode;

  const isDarkMode = isLoginView
    ? (effectiveThemeMode ? (effectiveThemeMode === 'dark') : appRealIsDarkMode)
    : (effectiveThemeMode 
        ? (effectiveThemeMode === 'dark') 
        : appRealIsDarkMode);
  const isLightWhite = isLoginView
    ? (effectiveThemeMode ? (effectiveThemeMode === 'light') : !appRealIsDarkMode)
    : (effectiveThemeMode 
        ? (effectiveThemeMode === 'light') 
        : (appThemeMode === 'light'));
  const isSelect = type === 'select';
  const isDate = type === 'date';
  const isTime = type === 'time';
  const isPassword = type === 'password';
  const hasValue = value !== '' && value !== null && value !== undefined;

  const isActive = isFocused || hasValue;
  let inactiveTranslateX = 0;
  if (!isActive) {
    if (leftActionIcon && icon) {
      inactiveTranslateX = 40;
    } else if (leftActionIcon || icon) {
      inactiveTranslateX = 18;
    } else if (!icon && (isDate || isTime)) {
      inactiveTranslateX = 18;
    }
  }
  const labelTransform = isActive 
    ? 'translateY(-30px) scale(0.83) translateX(0px)' 
    : `translateY(-50%) scale(1) translateX(${inactiveTranslateX}px)`;

  const isRequiredField = required || props.required;

  // Sync / reset typing state when error props or local submit errors change
  useEffect(() => {
    if (error || localSubmitError) {
      setIsTypingOrFocusedAfterError(false);
    }
  }, [error, localSubmitError]);

  // Global submission click interceptor for empty required fields
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const isSubmitButton = 
        target.tagName === 'BUTTON' || 
        (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit') ||
        target.closest('button');

      if (isSubmitButton) {
        const buttonEl = target.tagName === 'BUTTON' ? target : (target.closest('button') || target);
        const text = buttonEl.textContent?.toLowerCase() || '';
        
        const isSubmitAction = 
          text.includes('submit') || 
          text.includes('save') || 
          text.includes('register') || 
          text.includes('নিবন্ধন') || 
          text.includes('সংরক্ষণ') || 
          text.includes('সম্পূর্ণ') || 
          text.includes('যোগ করুন') || 
          text.includes('add') || 
          text.includes('update') || 
          text.includes('confirm') ||
          text.includes('পেমেন্ট') ||
          text.includes('দাখিল') ||
          text.includes('দাখিল করুন');
          
        if (isSubmitAction) {
          const isEmpty = value === '' || value === null || value === undefined;
          if (isEmpty && isRequiredField) {
            setLocalSubmitError(true);
          }
        }
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [value, isRequiredField]);

  const hasError = (error && !isTypingOrFocusedAfterError) || (localSubmitError && !isTypingOrFocusedAfterError);

  const handleInputClick = (e: React.MouseEvent) => {
    if (isSelect && onOpenModal) {
      onOpenModal(name, label, options || []);
    } else if (isDate || isTime) {
      e.preventDefault(); // Prevent default picker
      setShowPicker(true);
    }
  };

  const showCurrency = currency && (isFocused || hasValue);

  const filteredSuggestions = Array.isArray(suggestions) && value
    ? suggestions.filter((s: string) => 
        s.toString().toLowerCase().includes(value.toString().toLowerCase()) && 
        s.toString().toLowerCase() !== value.toString().toLowerCase()
      ).slice(0, 5)
    : [];

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : (isSelect || isDate || isTime ? 'text' : type);

  // Format display value for date/time if needed, but usually ISO string is fine for value
  // For display purposes in a text input, we might want to format it, but let's keep it simple for now
  // and rely on the value being updated.
  
    const isSearch = (name?.toLowerCase() || '').includes('search') || (label?.toLowerCase() || '').includes('search');

    const [dynamicColor, setDynamicColor] = useState(isLightWhite ? '#000000' : '#ffffff');
    const [isDarkBg, setIsDarkBg] = useState(!isLightWhite);
    const [dynamicBgColor, setDynamicBgColor] = useState(isLightWhite ? 'var(--card-bg-solid, var(--card-bg, #ffffff))' : 'var(--card-bg-solid, var(--card-bg, #111827))');
    const localContainerRef = useRef<HTMLDivElement>(null);

    const effectiveIsLight = isLoginView 
      ? (effectiveThemeMode === 'dark' ? false : true) 
      : (effectiveThemeMode 
          ? (effectiveThemeMode === 'light') 
          : !isDarkBg);

    const appBgStyle = {
      background: wallpaper 
        ? `url(${wallpaper}) center/cover no-repeat` 
        : (isDarkMode ? 'var(--app-bg)' : (backgroundColor || (effectiveIsLight ? '#ffffff' : 'var(--app-bg)'))),
    };

    useEffect(() => {
      let active = true;
      const calculateColor = () => {
        if (!active || !localContainerRef.current) return;
        
        if (isLoginView) {
          if (effectiveThemeMode === 'dark') {
            setIsDarkBg(true);
            setDynamicColor('#ffffff');
            setDynamicBgColor('#000000');
          } else {
            setIsDarkBg(false);
            setDynamicColor('#000000');
            setDynamicBgColor('#ffffff');
          }
          return;
        }
        
        let bg = 'rgba(0,0,0,0)';
        
        // 1. Walk up parent tree to find exact non-transparent computed background color
        let cur: HTMLElement | null = localContainerRef.current;
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
          if (!isDarkMode && backgroundColor && typeof backgroundColor === 'string' && backgroundColor.trim() !== '' && backgroundColor !== 'transparent') {
            bg = backgroundColor;
          }
        }

        // 3. Fall back to theme defaults if still transparent
        if (bg === 'rgba(0,0,0,0)' || bg === 'transparent' || !bg) {
          bg = isDarkMode ? 'var(--card-bg-solid, var(--card-bg, #111827))' : 'var(--card-bg-solid, var(--card-bg, #ffffff))';
        }

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
                  clean = isDarkMode ? '#111827' : '#ffffff';
                }
              }
            }
          }

          if (!clean || clean === 'transparent' || clean === 'rgba(0, 0, 0, 0)' || clean === 'rgba(0,0,0,0)') {
            return isDarkMode ? 0 : 1; // Match theme mode if completely transparent
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
          return isDarkMode ? 0 : 1; // Fallback based on active theme
        };

        const luminance = getLuminance(bg);
        const dark = luminance < 0.5;

        setIsDarkBg(dark);
        setDynamicColor(dark ? '#ffffff' : '#000000');
        setDynamicBgColor(bg);
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
    }, [isSearch, backgroundColor, wallpaper, value, isDarkMode, isNightMode, appThemeMode, effectiveThemeMode, theme]);

    const getDynamicPlaceholder = (lbl: string, customPlaceholder?: string) => {
      const cleanLabel = lbl ? lbl.trim() : "";
      const lowerLabel = cleanLabel.toLowerCase();
      const isBengali = language === 'bn';
      const isArabic = language === 'ar';
      
      let isExample = false;
      if (customPlaceholder) {
        const lowerCP = customPlaceholder.toLowerCase();
        if (
          lowerCP.startsWith('e.g.') || 
          lowerCP.startsWith('যেমন:') || 
          lowerCP.includes('xxxx') || 
          lowerCP.includes('trx') ||
          lowerCP === ' ' ||
          lowerCP === ''
        ) {
          isExample = true;
        }
      }

      if (customPlaceholder && !isExample && customPlaceholder.trim() !== "" && customPlaceholder !== " ") {
        return customPlaceholder;
      }

      if (!cleanLabel) return " ";

      // 1. Mobile / Phone
      if (
        lowerLabel.includes('mobile') || 
        lowerLabel.includes('phone') || 
        lowerLabel.includes('মোবাইল') || 
        lowerLabel.includes('ফোন') ||
        lowerLabel.includes('সেন্ডার') ||
        lowerLabel.includes('sender') ||
        lowerLabel.includes('receiver') ||
        lowerLabel.includes('রিসিভার')
      ) {
        return isBengali 
          ? 'মোবাইল নাম্বার দিন' 
          : (isArabic ? 'أدخل رقم الهاتف المحمول' : 'Enter mobile number');
      }

      // 2. Names / Titles / Card Holders
      if (
        lowerLabel.includes('name') || 
        lowerLabel.includes('title') || 
        lowerLabel.includes('holder') || 
        lowerLabel.includes('নাম') || 
        lowerLabel.includes('টাইটেল')
      ) {
        return isBengali 
          ? 'নাম দিন' 
          : (isArabic ? 'أدخل الاسم' : 'Enter Name');
      }

      // 3. Account / Card Numbers / Last digits
      if (
        lowerLabel.includes('account number') || 
        lowerLabel.includes('account_number') ||
        lowerLabel.includes('card number') ||
        lowerLabel.includes('digits') ||
        lowerLabel.includes('অ্যাকাউন্ট নাম্বার') ||
        lowerLabel.includes('কার্ড নাম্বার') ||
        lowerLabel.includes('কার্ডের শেষ') ||
        (lowerLabel.includes('account') && lowerLabel.includes('number'))
      ) {
        return isBengali 
          ? 'অ্যাকাউন্ট নাম্বার দিন' 
          : (isArabic ? 'أدخل رقم الحساب' : 'Enter account number');
      }

      // 4. Transaction ID
      if (
        lowerLabel.includes('transaction') || 
        lowerLabel.includes('txn') || 
        lowerLabel.includes('ট্রানজেকশন') || 
        lowerLabel.includes('ট্যাক্স')
      ) {
        return isBengali 
          ? 'ট্রানজেকশন আইডি দিন' 
          : (isArabic ? 'أدخل معرف المعاملة' : 'Enter Transaction ID');
      }

      // 5. Password
      if (
        lowerLabel.includes('password') || 
        lowerLabel.includes('পাসওয়ার্ড') ||
        lowerLabel.includes('পিন') ||
        lowerLabel.includes('pin')
      ) {
        return isBengali 
          ? 'পাসওয়ার্ড দিন' 
          : (isArabic ? 'أدخل كلمة المرور' : 'Enter Password');
      }

      // 6. Username / Email / User ID
      if (
        lowerLabel.includes('username') || 
        lowerLabel.includes('email') || 
        lowerLabel.includes('user id') || 
        lowerLabel.includes('ইউজার') || 
        lowerLabel.includes('ইমেইল')
      ) {
        return isBengali 
          ? 'ইউজার আইডি বা ইমেইল দিন' 
          : (isArabic ? 'أدخل اسم المستخدم أو البريد الإلكتروني' : 'Enter Username or Email');
      }

      // Check if label contains Bangla
      const hasBangla = /[\u0980-\u09FF]/.test(cleanLabel);
      if (hasBangla) {
        return `${cleanLabel} দিন`;
      }

      // Fallback: "Enter " + lowercase label with first letter lowercase
      const formattedLabel = cleanLabel.charAt(0).toLowerCase() + cleanLabel.slice(1);
      return `Enter ${formattedLabel}`;
    };

    const dynamicPlaceholder = getDynamicPlaceholder(label, placeholder);

    const shakeVariants = {
      shake: {
        x: [0, -5, 5, -5, 5, 0],
        transition: { duration: 0 }
      }
    };

  return (
    <div 
      ref={localContainerRef}
      className={`input-field-container relative group transition-colors duration-200 rounded-lg border ${isFocused || showSuggestions ? 'z-50' : 'z-20'} ${isSearch ? 'search-field-container' : ''} ${className ? (!className.includes('h-') ? 'h-14 ' : '') + className : 'h-14'}`}
      style={{
        backgroundColor: hasError 
          ? 'rgba(239, 68, 68, 0.1)' 
          : 'transparent',
        boxShadow: isSearch ? 'none' : undefined,
        borderWidth: (isFocused || showSuggestions) ? '2px' : '1px',
        borderColor: hasError 
          ? 'rgb(239, 68, 68)' 
          : (isLoginView 
              ? (isFocused || showSuggestions ? '#10b981' : (isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.45)')) 
              : (isSearch 
                  ? (isFocused || showSuggestions ? (isDarkMode ? '#ffffff' : dynamicColor) : (isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'var(--search-border-color)')) 
                  : (isDarkMode ? 'rgba(255, 255, 255, 0.4)' : undefined))),
        '--search-text-color': isSearch ? (isDarkMode ? '#ffffff' : dynamicColor) : undefined,
        '--search-placeholder-color': isSearch ? (isDarkMode ? 'rgba(255,255,255,0.7)' : (isDarkBg ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')) : undefined,
        '--search-label-color': isSearch ? (isDarkMode ? 'rgba(255,255,255,0.8)' : (isDarkBg ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)')) : undefined,
        '--search-icon-color': isSearch ? (isDarkMode ? 'rgba(255,255,255,0.8)' : (isDarkBg ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)')) : undefined,
        '--search-border-color': isSearch ? (isDarkMode ? 'rgba(255,255,255,0.4)' : (isDarkBg ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')) : undefined,
        '--search-label-active-color': isSearch ? (isDarkMode ? '#ffffff' : dynamicColor) : '#000000',
        '--dynamic-label-bg': labelBgColor || dynamicBgColor,
        '--text-main': isDarkMode ? '#ffffff' : '#000000',
        '--text-muted': isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
        '--input-label-active-color': isDarkMode ? '#60a5fa' : '#10b981',
        ...(props.style || {})
      } as React.CSSProperties}
      data-search={isSearch}
      data-login={isLoginView ? "true" : "false"}
      data-theme-mode={effectiveIsLight ? "light" : "dark"}
    >
      <div 
        onClick={(e) => {
          if (isSelect || isDate || isTime) {
            e.preventDefault();
            e.stopPropagation();
            handleInputClick(e);
          }
        }} 
        className={isSelect || isDate || isTime ? "cursor-pointer h-full relative" : "h-full"}
      >
        {(isSelect || isDate || isTime) && (
          <div 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleInputClick(e);
            }} 
            className="absolute inset-0 cursor-pointer z-30 bg-transparent" 
          />
        )}
        {type === 'textarea' ? (
          <textarea
            {...(props as any)}
            ref={ref as any}
            name={name}
            value={value ?? ''}
            onChange={(e) => {
              setIsTypingOrFocusedAfterError(true);
              setLocalSubmitError(false);
              if (onChange) onChange(e as any);
            }}
            onFocus={(e) => {
              setIsTypingOrFocusedAfterError(true);
              setLocalSubmitError(false);
              setIsFocused(true);
              setShowSuggestions(true);
              if (onFocus) onFocus(e as any);
            }}
            onBlur={(e) => {
              setTimeout(() => {
                setIsFocused(false);
                setShowSuggestions(false);
              }, 200);
              if (props.onBlur) props.onBlur(e as any);
            }}
            placeholder={isFocused ? dynamicPlaceholder : " "}
            className={`w-full h-full rounded-none outline-none border-none focus:ring-0 transition-colors duration-300 font-normal py-4 px-3 resize-none select-text
              ${isDarkMode ? 'placeholder:text-white/35 focus:placeholder:text-white/50 opacity-100' : 'placeholder:text-black/35 focus:placeholder:text-black/50 opacity-100'}
              ${inputClassName || ''}
            `}
            style={{ 
              color: isDarkMode ? '#ffffff' : '#000000',
              backgroundColor: 'transparent',
              boxShadow: 'none'
            } as React.CSSProperties}
          />
        ) : (
          <input
            {...props}
            ref={ref}
            type={inputType}
            name={name}
            value={value ?? ''}
            autoCapitalize={props.autoCapitalize || (isPassword || name === 'username' || name === 'email' || type === 'email' ? 'none' : undefined)}
            autoCorrect={props.autoCorrect || (isPassword || name === 'username' || name === 'email' || type === 'email' ? 'off' : undefined)}
            spellCheck={props.spellCheck !== undefined ? props.spellCheck : (isPassword || name === 'username' || name === 'email' || type === 'email' ? false : undefined)}
            inputMode={props.inputMode || (type === 'number' || type === 'tel' ? 'numeric' : undefined)}
            pattern={props.pattern || (props.inputMode === 'decimal' ? '[0-9]*[.,]?[0-9]*' : (type === 'number' || type === 'tel' ? '[0-9]*' : undefined))}
            onChange={(e) => {
              setIsTypingOrFocusedAfterError(true);
              setLocalSubmitError(false);
              if (onChange) onChange(e);
            }}
            onFocus={(e) => {
              setIsTypingOrFocusedAfterError(true);
              setLocalSubmitError(false);
              setIsFocused(true);
              setShowSuggestions(true);
              if (onFocus) onFocus(e);
            }}
            onKeyDown={onKeyDown}
            onBlur={(e) => {
              setTimeout(() => {
                setIsFocused(false);
                setShowSuggestions(false);
              }, 200);
              if (props.onBlur) props.onBlur(e);
            }}
            readOnly={isSelect || isDate || isTime || readOnly}
            placeholder={isFocused ? dynamicPlaceholder : " "}
            autoComplete="off"
            dir={isPassword ? 'ltr' : props.dir}
            className={`w-full h-full rounded-none outline-none border-none focus:ring-0 transition-colors duration-300 font-normal ${inputSize} 
              ${isSearch ? (isDarkBg ? 'placeholder:text-white/40 focus:placeholder:text-white/60' : 'placeholder:text-black/40 focus:placeholder:text-black/60') : (isDarkMode ? 'placeholder:text-white/35 focus:placeholder:text-white/50 opacity-100' : 'placeholder:text-black/35 focus:placeholder:text-black/50 opacity-100')}
              ${isSelect || isDate || isTime ? 'cursor-pointer caret-transparent pointer-events-none' : ''}
              ${isFocused ? 'pl-3 pr-2' : (showCurrency ? 'pl-11 pr-2' : (leftActionIcon && icon) ? 'pl-[52px]' : (leftActionIcon || icon || isDate || isTime) ? 'pl-[34px] pr-2' : 'pl-3 pr-2')}
              ${readOnly && !isSearch && !isSelect && !isDate && !isTime ? 'bg-black/5 cursor-not-allowed opacity-50' : (readOnly && !isSelect && !isDate && !isTime ? 'cursor-not-allowed' : '')}
              ${error || isPassword ? 'pr-10' : ''}
              ${isPassword ? ((inputSize.includes('text-right') || inputSize.includes('text-end') || (inputClassName || '').includes('text-right') || (inputClassName || '').includes('text-end')) ? 'text-right text-end font-sans tracking-widest' : 'text-left text-start font-sans tracking-widest') : ''}
              ${inputClassName || ''}
            `}
            style={{ 
              color: isDarkMode ? '#ffffff' : '#000000',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              '--search-text-color': isSearch ? (isDarkMode ? '#ffffff' : dynamicColor) : undefined,
              textAlign: isPassword ? ((inputSize.includes('text-right') || inputSize.includes('text-end') || (inputClassName || '').includes('text-right') || (inputClassName || '').includes('text-end')) ? 'right' : 'left') : undefined
            } as React.CSSProperties}
          />
        )}
        
        {leftActionIcon && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onLeftActionClick) onLeftActionClick();
            }}
            className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 
              ${isFocused ? 'hidden' : 'opacity-70 hover:opacity-100 scale-100'}`}
            style={{ 
              color: isDarkMode ? '#ffffff' : (isSearch ? dynamicColor : (effectiveIsLight ? '#4b5563' : '#e5e7eb'))
            }}
          >
            {leftActionIcon}
          </button>
        )}

        {icon && (
          <div className={`absolute ${leftActionIcon ? 'left-[44px]' : 'left-3'} top-1/2 -translate-y-1/2 pointer-events-none
            ${isFocused ? 'hidden' : 'opacity-60 scale-100'}`}
               style={{ 
                 color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : (isSearch ? dynamicColor : (isLoginView ? '#6b7280' : (effectiveIsLight ? '#4b5563' : '#e5e7eb')))
               }}>
            {icon}
          </div>
        )}

        {!icon && isDate && (
          <div 
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none
              ${isFocused ? 'hidden' : 'opacity-60 scale-100'}`}
            style={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : (isSearch ? dynamicColor : 'inherit')
            }}
          >
            <Calendar size={14} />
          </div>
        )}
        {!icon && isTime && (
          <div 
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none
              ${isFocused ? 'hidden' : 'opacity-60 scale-100'}`}
            style={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : (isSearch ? dynamicColor : 'inherit')
            }}
          >
            <Clock size={14} />
          </div>
        )}

        {/* Removed checkmark as requested */}

        {isPassword && (
          <button
            
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPassword(!showPassword);
            }}
            className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isBackgroundLight ? 'text-gray-500 hover:text-gray-700' : 'text-gray-400 hover:text-white'}`}
          >
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}

        <label
          className={`absolute font-extrabold tracking-wider text-[12px] floating-label-transition pointer-events-none z-20 origin-left left-3 top-1/2
            ${isActive ? 'px-2 opacity-100' : 'px-1 opacity-85'}
            ${hasError ? '!text-red-500' : ''}
          `}
          style={{
            color: hasError 
              ? 'rgb(239, 68, 68)'
              : (isDarkMode 
                  ? '#ffffff'
                  : (isLoginView 
                      ? (isFocused ? '#10b981' : (isBackgroundLight ? '#000000' : '#ffffff')) 
                      : (isSearch 
                          ? dynamicColor 
                          : undefined))),
            backgroundColor: isActive 
              ? (labelBgColor || dynamicBgColor) 
              : 'transparent',
            backgroundAttachment: isActive && isSearch ? 'fixed' : undefined,
            transform: labelTransform,
            boxShadow: 'none',
            textShadow: 'none',
            filter: 'none'
          }}
        >
          {label}
        </label>
        
        {/* {showCurrency && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-500 font-black text-sm">
            {currency}
          </div>
        )} */}

        <>
          {!isSelect && showSuggestions && filteredSuggestions.length > 0 && (
            <div 
              
              
              
              className={`absolute left-0 right-0 bottom-full mb-1 rounded-lg shadow-xl z-50 overflow-hidden border border-black/10 dark:border-white/10 ${isDarkMode ? 'dark' : ''}`}
              style={{ backgroundColor: 'var(--nested-card-bg)' }}
            >
              {filteredSuggestions.map((suggestion: string, index: number) => (
                <button
                  key={index}
                  type="button"
                  className={`w-full text-left px-3 py-3.5 text-[12px] font-normal text-text-main bg-transparent hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer last:border-0 active:bg-black/10 dark:active:bg-white/10 transition-colors`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange({ target: { name, value: suggestion } } as React.ChangeEvent<HTMLInputElement>);
                    setShowSuggestions(false);
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </>

        {isSelect && !isFocused && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        )}

        {/* Global Date/Time Picker */}
        {(isDate || isTime) && (
          <GlobalDateTimePicker
            isOpen={showPicker}
            onClose={() => setShowPicker(false)}
            onSelect={(val) => {
              onChange({ target: { name, value: val } } as React.ChangeEvent<HTMLInputElement>);
            }}
            type={isDate ? 'date' : 'time'}
            value={value as string}
            title={label}
          />
        )}
      </div>
    </div>
  );
});

export default InputField;
