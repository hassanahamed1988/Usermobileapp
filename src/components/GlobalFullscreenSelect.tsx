
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Search, X, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '@/store';
import { THEMES, TRANSLATIONS } from '@/constants';
import { getContrastColor } from '../utils/colorUtils';
import { scanAndDetectCountry } from '../utils/countryUtils';
import FloatingInput from './FloatingInput';

interface Option {
  label: string;
  value: string;
  icon?: string;
  subLabel?: string;
}

interface GlobalFullscreenSelectProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: (string | Option)[];
  title: string;
  selectedValue?: string;
  searchable?: boolean;
  allowAdd?: boolean;
  onAddNew?: (newValue: string) => void;
  fieldId?: string;
}

const GlobalFullscreenSelect: React.FC<GlobalFullscreenSelectProps> = ({
  isOpen,
  onClose,
  onSelect,
  options,
  title,
  selectedValue,
  searchable = true,
  allowAdd = true,
  onAddNew,
  fieldId
}) => {
  const store = useStore();
  const { 
    theme, user, currentView, wallpaper, backgroundColor, 
    loginWallpaper, loginBackgroundColor, language,
    appThemeMode, isDarkMode: storeIsDarkMode, setIsDropdownOpen 
  } = store;
  const t = TRANSLATIONS[language];
  const [search, setSearch] = useState('');
  const [localSelectedValue, setLocalSelectedValue] = useState(selectedValue);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  
  const cacheKey = `custom_select_options_${(fieldId || title || 'default').replace(/\s+/g, '_').toLowerCase()}`;
  
  const [customAddedOptions, setCustomAddedOptions] = useState<Option[]>(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      setCustomAddedOptions(cached ? JSON.parse(cached) : []);
    } catch {
      setCustomAddedOptions([]);
    }
  }, [cacheKey]);

  useEffect(() => {
    if (isOpen) {
      setLocalSelectedValue(selectedValue);
      setIsAddModalOpen(false);
      setNewItemText('');
    }
  }, [selectedValue, isOpen]);
  
  const hasBottomNav = !!user;
  
  const isAuthScreen = !user || currentView === 'LOGIN' || currentView === 'SIGNUP';
  
  const effectiveWallpaper = isAuthScreen ? (loginWallpaper || wallpaper || '') : wallpaper;
  const effectiveBgColor = isAuthScreen ? (loginBackgroundColor || backgroundColor || '') : backgroundColor;
  
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[1];
  const isLightWhite = isAuthScreen 
    ? !storeIsDarkMode 
    : (appThemeMode === 'light');
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || appThemeMode === 'dark';
  const hasCustomBackground = !isDarkMode && !!(effectiveBgColor || effectiveWallpaper);

  const calculatedAuthContrastColor = isDarkMode
    ? '#ffffff'
    : (effectiveWallpaper 
        ? '#ffffff' 
        : (effectiveBgColor ? getContrastColor(effectiveBgColor) : '#000000'));

  const textColor = isDarkMode
    ? '#ffffff'
    : (isAuthScreen
        ? calculatedAuthContrastColor
        : (effectiveWallpaper 
            ? '#ffffff'
            : (effectiveBgColor 
                ? getContrastColor(effectiveBgColor) 
                : '#000000')));

  const isEffectiveLight = textColor === '#000000';

  const layoutStyle = {};

  const addOpacityToHex = (hex: any, opacity: number) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
    const r = parseInt(hex.length === 4 ? hex[1]+hex[1] : hex.substr(1, 2), 16);
    const g = parseInt(hex.length === 4 ? hex[2]+hex[2] : hex.substr(3, 2), 16);
    const b = parseInt(hex.length === 4 ? hex[3]+hex[3] : hex.substr(5, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const appBgStyle = {
    background: effectiveWallpaper 
      ? `url(${effectiveWallpaper}) center/cover no-repeat` 
      : (isDarkMode ? 'var(--app-bg)' : (effectiveBgColor || 'var(--app-bg)')),
  };

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset search when opening
  useEffect(() => {
    if (!isOpen) return;

    setSearch('');
    document.body.classList.add('global-select-open');
    setIsDropdownOpen(true);
    
    return () => {
      document.body.classList.remove('global-select-open');
      setIsDropdownOpen(false);
    };
  }, [isOpen, setIsDropdownOpen]);

  if (typeof window === 'undefined') return null;

  const normalizedPropOptions: Option[] = (options || []).map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : { label: opt.label || '', value: opt.value || opt.label || '', icon: opt.icon, subLabel: opt.subLabel || '' }
  );

  // Combine custom added options with prop options (preventing duplicate values)
  const existingValues = new Set(normalizedPropOptions.map(o => o.value.toLowerCase()));
  const uniqueCustomOptions = customAddedOptions.filter(o => !existingValues.has(o.value.toLowerCase()));
  const allOptions: Option[] = [...uniqueCustomOptions, ...normalizedPropOptions];

  const filteredOptions = allOptions.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase()) ||
    opt.subLabel?.toLowerCase().includes(search.toLowerCase())
  );

  // Detect if this select is specifically for countries / nationalities, ensuring we strictly exclude places or locations
  const isCountryDropdown = !!(
    title && 
    /country|দেশ|রাষ্ট্র|nationality|জাতী/i.test(title) && 
    !/place|location|স্থান|লোকেশন|loading|delivery|ম্যাপ|মানচিত্র/i.test(title)
  );

  const trimmedNewItem = newItemText.trim();
  const detectedCountry = (isCountryDropdown && trimmedNewItem.length >= 2) 
    ? scanAndDetectCountry(trimmedNewItem) 
    : null;

  const targetCheckValue = detectedCountry ? detectedCountry.name : trimmedNewItem;

  // Real-time duplicate check against all current options in the dropdown
  const isDuplicate = !!trimmedNewItem && allOptions.some(o => {
    const optVal = (o.value || '').trim().toLowerCase();
    const optLabel = (o.label || '').trim().toLowerCase();
    const inputClean = trimmedNewItem.toLowerCase();
    const targetClean = targetCheckValue.toLowerCase();
    return optVal === inputClean || optLabel === inputClean || optVal === targetClean || optLabel === targetClean;
  });

  const handleAddNewItem = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;

    let finalLabel = trimmed;
    let finalValue = trimmed;
    let finalIcon: string | undefined = undefined;

    if (detectedCountry) {
      finalLabel = detectedCountry.name;
      finalValue = detectedCountry.name;
      finalIcon = detectedCountry.flag;
    }

    // Strict duplicate check before adding
    const isDup = allOptions.some(o => {
      const optVal = (o.value || '').trim().toLowerCase();
      const optLabel = (o.label || '').trim().toLowerCase();
      return optVal === finalValue.toLowerCase() || optLabel === finalLabel.toLowerCase();
    });

    if (isDup) {
      // If duplicate already exists, select the existing option and close
      setLocalSelectedValue(finalValue);
      onSelect(finalValue);
      setIsAddModalOpen(false);
      setNewItemText('');
      setSearch('');
      onClose();
      return;
    }
    
    const newOption: Option = { label: finalLabel, value: finalValue, icon: finalIcon };
    setCustomAddedOptions(prev => {
      const updated = [newOption, ...prev.filter(x => x.value.toLowerCase() !== finalValue.toLowerCase())];
      try {
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    
    setLocalSelectedValue(finalValue);
    onSelect(finalValue);
    
    if (onAddNew) {
      onAddNew(finalValue);
    } else {
      // Auto-persist directly to central store and database if onAddNew is not passed
      const titleLower = (title || '').toLowerCase();
      if (isCountryDropdown || titleLower.includes('country') || titleLower.includes('দেশ') || titleLower.includes('রাষ্ট্র')) {
        const code = detectedCountry?.code || finalValue.slice(0, 2).toUpperCase();
        const flag = detectedCountry?.flag || '🌐';
        if (store.addCountry) {
          store.addCountry({ code, name: finalValue, flag });
        }
      } else if (titleLower.includes('company') || titleLower.includes('কোম্পানি') || titleLower.includes('প্রতিষ্ঠান')) {
        if (store.addCompany) {
          store.addCompany(finalValue.toUpperCase());
        }
      } else if (titleLower.includes('place') || titleLower.includes('location') || titleLower.includes('স্থান') || titleLower.includes('লোকেশন') || titleLower.includes('loading') || titleLower.includes('delivery')) {
        if (store.addLocation) {
          store.addLocation({ country: 'Qatar', name: finalValue });
        }
      } else if (titleLower.includes('container') || titleLower.includes('কনটেইনার')) {
        if (store.addContainerType) {
          store.addContainerType(finalValue);
        }
      } else if (titleLower.includes('loading type') || titleLower.includes('লোডিং টাইপ') || titleLower.includes('lodging')) {
        if (store.addLoadingType) {
          store.addLoadingType(finalValue);
        }
      } else if (titleLower.includes('yard') || titleLower.includes('ইয়ার্ড') || titleLower.includes('return')) {
        if (store.addEmptyReturnYard) {
          store.addEmptyReturnYard(finalValue);
        }
      } else if (titleLower.includes('diesel') || titleLower.includes('ডিজেল') || titleLower.includes('reason')) {
        if (store.addExtraDieselReason) {
          store.addExtraDieselReason(finalValue);
        }
      } else if (titleLower.includes('bank') || titleLower.includes('ব্যাংক')) {
        if (store.addBank) store.addBank(finalValue);
        if (store.addBankName) store.addBankName(finalValue);
      } else if (titleLower.includes('branch') || titleLower.includes('শাখা')) {
        if (store.addBranch) store.addBranch(finalValue);
      } else if (titleLower.includes('nationality') || titleLower.includes('জাতীয়তা')) {
        if (store.addNationality) store.addNationality(finalValue);
      } else if (titleLower.includes('currency') || titleLower.includes('মুদ্রা')) {
        if (store.addCurrency) store.addCurrency({ code: finalValue.slice(0, 3).toUpperCase(), symbol: finalValue.slice(0, 3), name: finalValue, exchangeRate: 1.0, isActive: true });
      } else if (titleLower.includes('post office') || titleLower.includes('ডাকঘর')) {
        if (store.addPostOffice) store.addPostOffice({ name: finalValue, code: '0000' });
      } else if (titleLower.includes('police') || titleLower.includes('থানা')) {
        if (store.addPoliceStation) store.addPoliceStation(finalValue);
      } else if (titleLower.includes('city') || titleLower.includes('শহর')) {
        if (store.addCity) store.addCity(finalValue);
      } else if (titleLower.includes('state') || titleLower.includes('বিভাগ') || titleLower.includes('জেলা')) {
        if (store.addState) store.addState(finalValue);
      } else if (titleLower.includes('income') || titleLower.includes('ইনকাম') || titleLower.includes('উৎস')) {
        if (store.addWalletIncomeSource) store.addWalletIncomeSource(finalValue);
      } else if (titleLower.includes('deduction') || titleLower.includes('expense') || titleLower.includes('খরচ')) {
        if (store.addWalletDeductionReason) store.addWalletDeductionReason(finalValue);
      } else if (titleLower.includes('method') || titleLower.includes('পেমেন্ট মাধ্যম')) {
        if (store.addWalletPaymentMethod) store.addWalletPaymentMethod(finalValue);
      } else if (titleLower.includes('loan') || titleLower.includes('লোন') || titleLower.includes('ঋণ')) {
        if (store.addLoanPurpose) store.addLoanPurpose(finalValue);
      }
    }

    setIsAddModalOpen(false);
    setNewItemText('');
    setSearch('');
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`fixed top-0 left-0 right-0 bottom-0 ${isAuthScreen ? 'bg-black/40 backdrop-blur-md' : (isDarkMode ? 'bg-black/70 backdrop-blur-md' : 'bg-black/40 backdrop-blur-md')} z-[100000] global-select-backdrop`}
            onClick={onClose}
          />
          <motion.div
            initial={isDesktop ? { opacity: 0, scale: 0.95, x: '-50%', y: '-40%' } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' } : { y: 0 }}
            exit={isDesktop ? { opacity: 0, scale: 0.95, x: '-50%', y: '-40%' } : { y: '100%' }}
            transition={isDesktop 
              ? { type: 'spring', damping: 25, stiffness: 280 }
              : { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.28 }
            }
            className={`fixed ${isDesktop ? 'top-1/2 left-1/2 w-full max-w-md rounded-2xl' : 'left-0 right-0 bottom-0 h-auto max-h-[82vh] rounded-t-[28px] rounded-b-none'} z-[100001] flex flex-col ${isDarkMode ? 'dark' : ''} overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.15)] global-select-modal ${isAuthScreen ? 'login-view-modal' : ''}`}
            style={{
              ...appBgStyle,
              backgroundColor: isDarkMode 
                ? '#000000'
                : (isAuthScreen 
                    ? (effectiveWallpaper ? 'transparent' : (calculatedAuthContrastColor === '#000000' ? '#ffffff' : '#18181b')) 
                    : undefined),
              background: isDarkMode 
                ? '#000000'
                : (isAuthScreen 
                    ? (effectiveWallpaper ? `url(${effectiveWallpaper}) center/cover no-repeat` : (calculatedAuthContrastColor === '#000000' ? '#ffffff' : '#18181b')) 
                    : undefined),
              '--auth-modal-bg': isDarkMode 
                ? '#000000'
                : (isAuthScreen 
                    ? (effectiveWallpaper ? `url(${effectiveWallpaper}) center/cover no-repeat` : (calculatedAuthContrastColor === '#000000' ? '#ffffff' : '#18181b')) 
                    : '#ffffff'),
              '--auth-modal-text': isDarkMode ? '#ffffff' : (isAuthScreen ? calculatedAuthContrastColor : '#000000'),
              '--auth-modal-border': isDarkMode 
                ? 'rgba(255, 255, 255, 0.12)' 
                : (isAuthScreen ? (calculatedAuthContrastColor === '#000000' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)') : 'rgba(0, 0, 0, 0.08)'),
              '--auth-modal-btn-bg': isDarkMode 
                ? 'rgba(255, 255, 255, 0.08)' 
                : (isAuthScreen ? (calculatedAuthContrastColor === '#000000' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.08)') : 'rgba(0, 0, 0, 0.05)'),
              '--auth-modal-btn-text': isDarkMode ? '#ffffff' : (isAuthScreen ? calculatedAuthContrastColor : '#000000'),
              '--auth-modal-muted': isDarkMode 
                ? 'rgba(255, 255, 255, 0.6)' 
                : (isAuthScreen ? (calculatedAuthContrastColor === '#000000' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)') : 'rgba(0, 0, 0, 0.6)'),
              '--text-main': textColor,
              color: textColor,
              ...layoutStyle
            } as any}
          >
              {/* Main Content Wrapper - Handles Background */}
              <div 
                className="flex flex-col min-h-0 relative h-full bg-transparent"
              >
                {/* iOS Drag Handle */}
                {!isDesktop && (
                  <div className="flex-none pt-3 flex justify-center z-30">
                    <div className="w-12 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700/80 cursor-pointer" />
                  </div>
                )}

                {/* Inner Wrapper for Background */}
                <div 
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundColor: 'transparent'
                  }}
                />
                
                {/* Dynamic Header - Replaces App Header */}
                <div 
                  className={`flex-none z-20 bg-transparent pt-0 pb-0 ${isDesktop ? 'rounded-t-2xl' : 'rounded-t-[28px]'}`}
                  style={{ backgroundColor: 'transparent' }}
                >
                  <div className="relative flex items-center justify-center px-4 safe-top">
                    <h2 className="text-[12px] font-black uppercase tracking-widest truncate max-w-[70%] text-[var(--text-main)] text-center">
                      {title}
                    </h2>
                    <button
                      onClick={onClose}
                      className="absolute right-4 px-3 py-0.5 -mt-3 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-[var(--text-main)] active:scale-90 transition-transform text-[10px] font-bold"
                    >
                      Done
                    </button>
                  </div>
                </div>

                {/* Search Bar - Positioned below the header */}
                {searchable && (
                  <div 
                    className="flex-none px-4 mt-3 mb-3 pt-0 bg-transparent"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <FloatingInput 
                      id="search"
                      label={t.SEARCH || 'Search'}
                      value={search}
                      onChange={setSearch}
                      icon={<Search size={18} />}
                      className="h-14 !rounded-lg"
                      textColor={textColor}
                      bgColor={isDarkMode ? '#121212' : (isAuthScreen ? (calculatedAuthContrastColor === '#ffffff' ? '#090d1a' : '#ffffff') : (effectiveBgColor || 'var(--app-bg)'))}
                    />
                  </div>
                )}

                {/* Scrollable List */}
                <div 
                  className={`flex-1 overflow-y-auto min-h-0 px-4 py-2 space-y-2 touch-pan-y overscroll-contain bg-transparent ${isDesktop ? 'max-h-[70vh]' : ''}`}
                  style={{ 
                    backgroundColor: 'transparent',
                    maxHeight: isDesktop ? '70vh' : 'calc(82vh - 120px)',
                    paddingBottom: isDesktop ? '16px' : 'calc(24px + env(safe-area-inset-bottom, 16px))'
                  }}
                >
                  {/* Add New Item Option inside the Dropdown List */}
                  {allowAdd && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNewItemText(search.trim());
                        setIsAddModalOpen(true);
                        setTimeout(() => addInputRef.current?.focus(), 150);
                      }}
                      className={`w-full flex items-center justify-between h-14 px-3.5 rounded-xl transition-all text-left relative overflow-hidden border border-dashed mb-2.5 active:scale-[0.99] group shadow-sm ${
                        isDarkMode
                          ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white'
                          : 'border-[var(--primary)]/40 bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 text-[var(--text-main)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          <Plus size={18} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs truncate">
                            {language === 'bn' ? 'নতুন আইটেম যোগ করুন' : 'Add New Item'}
                          </span>
                          <span className="text-[10px] opacity-70 truncate">
                            {language === 'bn' ? 'ক্লিক করে পপ-আপের মাধ্যমে আইটেম যুক্ত করুন' : 'Click to add a new option via pop-up'}
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-[var(--primary)] text-white text-[10px] font-extrabold shrink-0 shadow-sm group-hover:opacity-90 flex items-center gap-1">
                        <Plus size={12} strokeWidth={2.5} />
                        <span>{language === 'bn' ? 'আইটেম যোগ' : 'Add'}</span>
                      </div>
                    </button>
                  )}

                  {filteredOptions.length > 0 ? (
                    <>
                      {filteredOptions.map((option, index) => {
                        const isSelected = localSelectedValue === option.value;
                        const isRoleSelect = title.toLowerCase().includes('role') || title.includes('রোল');
                        
                        const getRoleColors = (val: string) => {
                          const role = String(val).trim().toUpperCase();
                          if (role.includes('ADMIN') || role.includes('অ্যাডমিন')) {
                            const bg = '#ef4444'; // red-500
                            return { bg, text: getContrastColor(bg) };
                          }
                          if (role.includes('MANAGER') || role.includes('ম্যানেজার')) {
                            const bg = '#10b981'; // blue-500
                            return { bg, text: getContrastColor(bg) };
                          }
                          if (role.includes('USER') || role.includes('ইউজার')) {
                            const bg = '#10b981'; // emerald-500
                            return { bg, text: getContrastColor(bg) };
                          }
                          return null;
                        };

                        const roleColors = isRoleSelect ? getRoleColors(option.value) : null;

                        const buttonStyle = roleColors
                          ? {
                              backgroundColor: roleColors.bg,
                              color: roleColors.text,
                            }
                          : (!isSelected
                              ? { backgroundColor: textColor === '#000000' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.06)' }
                              : {});

                        return (
                          <button
                            key={`${option.value}-${option.label}-${index}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setLocalSelectedValue(option.value);
                              onSelect(option.value);
                              onClose();
                            }}
                            className={`w-full flex items-center justify-between h-14 px-3 rounded-lg transition-all text-left relative overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]
                              ${isSelected && !roleColors
                                ? 'text-white shadow-[0_0_10px_rgba(59,130,246,0.2)] bg-[var(--primary)]' 
                                : 'hover:opacity-80'
                              }`}
                            style={buttonStyle}
                          >
                            {isSelected && !roleColors && (
                              <div
                                className="absolute inset-0 bg-[var(--primary)] z-0"
                                style={{ transition: 'none' }}
                              />
                            )}
                            {isSelected && roleColors && (
                              <div
                                className="absolute inset-0 z-0 opacity-15 bg-white"
                                style={{ transition: 'none' }}
                              />
                            )}
                            <div className="flex items-center gap-3 relative z-10 w-full">
                              {option.icon && (
                                typeof option.icon === 'string' && (option.icon.startsWith('http') || option.icon.startsWith('https') || option.icon.startsWith('data:')) ? (
                                  <img src={option.icon} alt="" className="w-5 h-auto rounded-sm" />
                                ) : (
                                  <span className="text-xl">{option.icon}</span>
                                )
                              )}
                              <div className="flex flex-col flex-1">
                                <span className={`text-[12px] ${isSelected ? 'font-bold' : 'font-semibold'}`} style={{ color: roleColors ? roleColors.text : undefined }}>{option.label}</span>
                                {option.subLabel && (
                                  <span className="text-[9px] mt-0.5 opacity-70" style={{ color: roleColors ? roleColors.text : undefined }}>{option.subLabel}</span>
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="bg-white/20 rounded-full p-0.5 relative z-10">
                                <Check size={12} strokeWidth={3} className={roleColors ? '' : 'text-white'} style={{ color: roleColors ? roleColors.text : undefined }} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                      {/* Dynamic Safe Area Padding bottom spacer */}
                      {!isDesktop && (
                        <div className="w-full h-[env(safe-area-inset-bottom,16px)] min-h-[16px]" />
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 space-y-3">
                      <p className="font-black uppercase tracking-widest text-xs text-text-muted">
                        {language === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
                      </p>
                      {allowAdd && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewItemText(search.trim());
                            setIsAddModalOpen(true);
                            setTimeout(() => addInputRef.current?.focus(), 150);
                          }}
                          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all hover:opacity-90"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                          <span>
                            {search.trim() 
                              ? (language === 'bn' ? `"${search.trim()}" আইটেম যোগ করুন` : `Add "${search.trim()}"`)
                              : (language === 'bn' ? 'নতুন আইটেম যোগ করুন' : 'Add New Item')}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

          {/* Add Custom Item Modal Popup */}
          <AnimatePresence>
            {isAddModalOpen && (
              <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4 global-select-popup global-select-add-modal pointer-events-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setNewItemText('');
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 12 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className={`relative w-full max-w-sm rounded-2xl p-5 shadow-2xl z-10 border ${
                    isDarkMode 
                      ? 'bg-zinc-900 border-white/20 text-white shadow-black/90' 
                      : 'bg-white border-zinc-200 text-zinc-900 shadow-2xl'
                  }`}
                  style={{
                    filter: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shadow-sm">
                        <Plus size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-[var(--text-main)]">
                          {language === 'bn' ? 'নতুন আইটেম যোগ করুন' : 'Add New Item'}
                        </h3>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[200px]">
                          {title}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setNewItemText('');
                      }}
                      className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Input Body */}
                  <div className="py-4 space-y-3">
                    <label className="text-[11px] font-bold tracking-wide text-zinc-600 dark:text-zinc-300">
                      {isCountryDropdown ? (language === 'bn' ? 'দেশের নাম লিখুন' : 'Country Name') : (language === 'bn' ? 'আইটেমের নাম' : 'Item Name')}
                    </label>
                    <input
                      ref={addInputRef}
                      autoFocus
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newItemText.trim() && !isDuplicate) {
                          e.preventDefault();
                          handleAddNewItem(newItemText);
                          setIsAddModalOpen(false);
                        } else if (e.key === 'Escape') {
                          setIsAddModalOpen(false);
                          setNewItemText('');
                        }
                      }}
                      placeholder={isCountryDropdown ? (language === 'bn' ? 'যেমন: Qatar, Saudi Arabia, UAE, USA...' : 'e.g. Qatar, Saudi Arabia, UAE, USA...') : (language === 'bn' ? 'নতুন আইটেমের নাম লিখুন...' : 'Enter new item name...')}
                      className={`w-full h-12 px-3.5 rounded-xl text-xs font-semibold outline-none border transition-all ${
                        isDuplicate 
                          ? 'border-red-500 bg-red-50/20 text-red-600 dark:text-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                          : isDarkMode
                            ? 'bg-zinc-800/80 border-white/20 text-white placeholder:text-zinc-500 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
                            : 'bg-zinc-50 border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]'
                      }`}
                    />

                    {/* Auto-detected Country Logo / Flag Preview Badge */}
                    {detectedCountry && trimmedNewItem && !isDuplicate && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="text-xl leading-none">{detectedCountry.flag}</span>
                          <div>
                            <div className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <span>{detectedCountry.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 uppercase font-mono">{detectedCountry.code}</span>
                            </div>
                            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                              {language === 'bn' ? 'সিস্টেম স্বয়ংক্রিয়ভাবে কান্ট্রি লোগো স্ক্যান করেছে' : 'System auto-detected country flag & logo'}
                            </p>
                          </div>
                        </div>
                        <Sparkles size={16} className="text-emerald-500 animate-pulse shrink-0" />
                      </div>
                    )}

                    {/* Duplicate Warning Banner */}
                    {isDuplicate && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-red-600 dark:text-red-400 text-xs font-semibold animate-shake">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>
                          <span>
                            {language === 'bn' 
                              ? `"${newItemText.trim()}" ইতিমধ্যে তালিকায় যুক্ত আছে! ডুপ্লিকেট যুক্ত করা যাবে না।`
                              : `"${newItemText.trim()}" already exists in the list! Duplicate entries are not allowed.`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Actions Footer */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/10 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setNewItemText('');
                      }}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (newItemText.trim() && !isDuplicate) {
                          handleAddNewItem(newItemText);
                          setIsAddModalOpen(false);
                        }
                      }}
                      disabled={!newItemText.trim() || isDuplicate}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                        newItemText.trim() && !isDuplicate
                          ? 'bg-[var(--primary)] text-white hover:opacity-90'
                          : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <Plus size={16} strokeWidth={2.5} />
                      <span>{language === 'bn' ? 'যোগ করুন' : 'Add Item'}</span>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GlobalFullscreenSelect;
