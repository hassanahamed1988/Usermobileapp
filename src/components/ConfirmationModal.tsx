import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';

import { THEMES } from '@/constants';

interface ConfirmConfig {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onSecondaryConfirm?: () => void;
  secondaryConfirmText?: string;
}

const ConfirmationModal: React.FC = () => {
  const { confirmConfig, closeConfirm, theme, backgroundColor, wallpaper, appThemeMode, isDarkMode: storeIsDarkMode, language } = useStore();
  const isArabic = language === 'ar';
  const isBn = language === 'bn';

  const config = confirmConfig as ConfirmConfig | null;

  // Detect if the action is specifically a log out or sign out action
  const isLogoutAction = (cfg: ConfirmConfig | null) => {
    if (!cfg) return false;
    const checkText = (text?: string) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return (
        lower.includes('logout') || 
        lower.includes('log out') || 
        lower.includes('signout') || 
        lower.includes('sign out') || 
        lower.includes('লগআউট') || 
        lower.includes('লগ আউট') ||
        lower.includes('লগ-আউট')
      );
    };
    return checkText(cfg?.title) || checkText(cfg?.message) || checkText(cfg?.confirmText);
  };

  // Detect if the action is specifically an app exit action
  const isExitAction = (cfg: ConfirmConfig | null) => {
    if (!cfg) return false;
    const checkText = (text?: string) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      return (
        lower.includes('exit') || 
        lower.includes('quit') ||
        lower.includes('প্রস্থান') || 
        lower.includes('বাহির') ||
        lower.includes('বের হতে')
      );
    };
    return checkText(cfg?.title) || checkText(cfg?.message) || checkText(cfg?.confirmText);
  };

  const isLogout = isLogoutAction(config);
  const isExit = isExitAction(config);
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || appThemeMode === 'dark';
  const isLightWhite = appThemeMode === 'light';
  
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  if (typeof document === 'undefined') return null;

  // Detect if the action is destructive (e.g. log out, delete, remove, reset, etc.)
  const isDestructiveAction = (text?: string) => {
    if (!text) return false;
    const lower = text.toLowerCase();
    return (
      lower.includes('delete') || 
      lower.includes('remove') || 
      lower.includes('exit') || 
      lower.includes('logout') || 
      lower.includes('reset') ||
      lower.includes('clear') ||
      lower.includes('মুছে') || 
      lower.includes('লগআউট') || 
      lower.includes('বাহির') ||
      lower.includes('ডিলেট') ||
      lower.includes('ডিলিট') ||
      lower.includes('মুছুন') ||
      lower.includes('রিসেট')
    );
  };

  const isConfirmDestructive = isDestructiveAction(config?.confirmText) || isDestructiveAction(config?.title) || isDestructiveAction(config?.message);

  return createPortal(
    <AnimatePresence>
      {config?.isOpen && (
        <div className={`fixed inset-0 z-[99999] flex ${isLogout ? 'items-end justify-center pb-safe p-4' : 'items-center justify-center p-6'} font-sans select-none`}>
          {/* Overlay Background with smooth fade */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[5px]" 
            onClick={closeConfirm} 
          />

          {isLogout ? (
            /* iPhone iOS Action Sheet (Bottom Sheet) for Logout */
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.26 }}
              className="relative w-full max-w-[370px] mx-auto flex flex-col gap-2.5 z-10 mb-4 px-4 pb-safe"
            >
              <div className={`w-full rounded-[14px] overflow-hidden backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-[#1c1c1e]/75 border border-white/10 text-white' 
                  : 'bg-[#f9f9f9]/85 border border-black/5 text-black'
              }`}>
                {/* Header with small, clean text */}
                <div className={`px-4 py-3.5 text-center border-b ${
                  isDarkMode ? 'border-white/10' : 'border-black/10'
                }`}>
                  <h3 className={`text-[13px] font-semibold tracking-wide ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    {config.title || (isBn ? 'লগআউট নিশ্চিতকরণ' : isArabic ? 'تأكيد تسجيل الخروج' : 'Logout Confirmation')}
                  </h3>
                  {config.message && (
                    <p className={`text-[13px] leading-snug mt-1.5 px-2 font-normal ${
                      isDarkMode ? 'text-neutral-400/80' : 'text-neutral-500/80'
                    }`}>
                      {config.message}
                    </p>
                  )}
                </div>

                {/* Logout Action Buttons */}
                {config.onSecondaryConfirm ? (
                  <div className={`flex flex-col w-full divide-y ${
                    isDarkMode ? 'divide-white/10' : 'divide-black/10'
                  }`}>
                    <button
                      type="button"
                      onClick={() => {
                        config.onConfirm();
                        closeConfirm();
                      }}
                      className={`w-full h-[57px] flex items-center justify-center text-[18px] md:text-[20px] font-normal transition-colors cursor-pointer ${
                        isDarkMode ? 'text-[#ff453a] active:bg-white/10' : 'text-[#ff3b30] active:bg-black/5'
                      }`}
                    >
                      {config.confirmText || (isBn ? 'লগআউট ও প্রস্থান' : 'Logout & Exit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        config.onSecondaryConfirm?.();
                        closeConfirm();
                      }}
                      className={`w-full h-[57px] flex items-center justify-center text-[18px] md:text-[20px] font-normal transition-colors cursor-pointer ${
                        isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007aff] active:bg-black/5'
                      }`}
                    >
                      {config.secondaryConfirmText || (isBn ? 'শুধুমাত্র প্রস্থান' : 'Just Exit')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      config.onConfirm();
                      closeConfirm();
                    }}
                    className={`w-full h-[57px] flex items-center justify-center text-[18px] md:text-[20px] font-normal transition-colors cursor-pointer ${
                      isDarkMode ? 'text-[#ff453a] active:bg-white/10' : 'text-[#ff3b30] active:bg-black/5'
                    }`}
                  >
                    {config.confirmText || (isBn ? 'লগআউট' : 'Logout')}
                  </button>
                )}
              </div>

              {/* Cancel Button - Separated iOS Action Sheet Style */}
              <div className={`w-full rounded-[14px] overflow-hidden backdrop-blur-xl ${
                isDarkMode 
                  ? 'bg-[#1c1c1e]/75 border border-white/10' 
                  : 'bg-white/85 border border-black/5'
              }`}>
                <button
                  type="button"
                  onClick={closeConfirm}
                  className={`w-full h-[57px] flex items-center justify-center text-[18px] md:text-[20px] font-semibold transition-colors cursor-pointer ${
                    isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007aff] active:bg-black/5'
                  }`}
                >
                  {config.cancelText || (isBn ? 'বাতিল' : isArabic ? 'إلغاء' : 'Cancel')}
                </button>
              </div>
            </motion.div>
          ) : (
            /* iPhone iOS Native Alert Dialog Box (Default & Exit) */
            <motion.div
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className={`relative w-[270px] max-w-[85%] mx-auto flex flex-col overflow-hidden rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl border ${
                isDarkMode 
                  ? 'border-white/10 bg-[#1e1e1e]/85 text-white' 
                  : 'border-black/5 bg-[#f9f9f9]/90 text-black'
              }`}
            >
              {/* Header / Content Section */}
              <div className="px-4 pt-5 pb-4 text-center">
                <h3 className={`text-[17px] font-semibold leading-snug tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {config.title || (isBn ? 'নিশ্চিতকরণ' : isArabic ? 'تأكيد' : 'Confirmation')}
                </h3>
                {config.message && (
                  <p className={`text-[13px] leading-snug mt-1.5 px-1 font-normal ${
                    isDarkMode ? 'text-neutral-400' : 'text-neutral-600'
                  }`}>
                    {config.message}
                  </p>
                )}
              </div>

              {/* Hairline top border for buttons */}
              <div className={`h-[0.5px] w-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
              
              {/* Action Buttons Section */}
              {config.onSecondaryConfirm ? (
                // 3 Buttons -> Stacked vertically (e.g., Logout & Exit, Just Exit, Cancel)
                <div className={`flex flex-col w-full divide-y ${
                  isDarkMode ? 'divide-white/10' : 'divide-black/10'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      config.onConfirm();
                      closeConfirm();
                    }}
                    className={`w-full py-3 text-[17px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'active:bg-white/10' : 'active:bg-black/5'
                    } ${
                      isConfirmDestructive 
                        ? (isDarkMode ? 'text-[#ff453a]' : 'text-[#ff3b30]') 
                        : (isDarkMode ? 'text-[#0a84ff]' : 'text-[#007aff]')
                    }`}
                  >
                    {config.confirmText || (isBn ? 'লগআউট ও প্রস্থান' : 'Logout & Exit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      config.onSecondaryConfirm?.();
                      closeConfirm();
                    }}
                    className={`w-full py-3 text-[17px] font-normal transition-colors cursor-pointer ${
                      isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007aff] active:bg-black/5'
                    }`}
                  >
                    {config.secondaryConfirmText || (isBn ? 'শুধুমাত্র প্রস্থান' : 'Just Exit')}
                  </button>
                  <button
                    type="button"
                    onClick={closeConfirm}
                    className={`w-full py-3 text-[17px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007aff] active:bg-black/5'
                    }`}
                  >
                    {config.cancelText || (isBn ? 'বাতিল' : isArabic ? 'إلغاء' : 'Cancel')}
                  </button>
                </div>
              ) : (
                // 2 Buttons -> Side by side
                <div className="flex w-full h-[44px]">
                  <button
                    type="button"
                    onClick={closeConfirm}
                    className={`flex-1 h-full flex items-center justify-center text-[17px] font-normal transition-colors cursor-pointer select-none ${
                      isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007aff] active:bg-black/5'
                    }`}
                  >
                    {config.cancelText || (isBn ? 'না' : isArabic ? 'لا' : 'No')}
                  </button>
                  
                  {/* Hairline vertical divider */}
                  <div className={`w-[0.5px] h-full ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                  
                  <button
                    type="button"
                    onClick={() => {
                      config.onConfirm();
                      closeConfirm();
                    }}
                    className={`flex-1 h-full flex items-center justify-center text-[17px] font-semibold transition-colors cursor-pointer select-none ${
                      isDarkMode ? 'active:bg-white/10' : 'active:bg-black/5'
                    } ${
                      isConfirmDestructive || isExit
                        ? (isDarkMode ? 'text-[#ff453a]' : 'text-[#ff3b30]') 
                        : (isDarkMode ? 'text-[#0a84ff]' : 'text-[#007aff]')
                    }`}
                  >
                    {config.confirmText || (isBn ? (isConfirmDestructive ? 'ডিলিট' : 'হ্যাঁ') : isArabic ? 'نعم' : 'Yes')}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmationModal;

