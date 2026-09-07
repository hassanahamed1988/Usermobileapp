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

  const isLogout = isLogoutAction(config);
  const isDarkMode = !isLogout && (storeIsDarkMode || theme === 'night-mode' || appThemeMode === 'dark');
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
            /* iOS Action Sheet (Bottom Sheet) for Logout */
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative w-full max-w-md mx-auto flex flex-col gap-2 z-10"
            >
              <div className={`w-full rounded-[14px] overflow-hidden ${
                isDarkMode ? 'bg-[#1c1c1e]/90 text-white' : 'bg-[#f2f2f7]/95 text-black'
              } backdrop-blur-[20px]`}>
                {/* Header */}
                <div className={`px-4 py-4 text-center border-b ${isDarkMode ? 'border-white/10' : 'border-black/10'}`}>
                  <h3 className={`text-[13px] font-semibold tracking-wide ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {config.title || (isBn ? 'লগআউট নিশ্চিতকরণ' : isArabic ? 'تأكيد تسجيل الخروج' : 'Logout Confirmation')}
                  </h3>
                  <p className={`text-[13px] leading-snug mt-1 px-1 font-normal opacity-90 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {config.message}
                  </p>
                </div>

                {/* Logout Action Buttons */}
                {config.onSecondaryConfirm ? (
                  <div className={`flex flex-col w-full divide-y ${isDarkMode ? 'divide-white/15' : 'divide-black/10'}`}>
                    <button
                      type="button"
                      onClick={() => {
                        config.onConfirm();
                        closeConfirm();
                      }}
                      className={`w-full py-4 text-[20px] font-normal transition-colors cursor-pointer ${
                        isDarkMode ? 'active:bg-white/10 text-[#ff453a]' : 'active:bg-black/10 text-[#FF3B30]'
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
                      className={`w-full py-4 text-[20px] font-normal transition-colors cursor-pointer ${
                        isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007AFF] active:bg-black/10'
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
                    className={`w-full py-4 text-[20px] font-normal transition-colors cursor-pointer ${
                      isDarkMode ? 'active:bg-white/10 text-[#ff453a]' : 'active:bg-black/10 text-[#FF3B30]'
                    }`}
                  >
                    {config.confirmText || (isBn ? 'লগআউট' : 'Logout')}
                  </button>
                )}
              </div>

              {/* Cancel Button separated for Action Sheet style */}
              <div className={`w-full rounded-[14px] overflow-hidden ${
                isDarkMode ? 'bg-[#1c1c1e]/90' : 'bg-white/95'
              } backdrop-blur-[20px]`}>
                <button
                  type="button"
                  onClick={closeConfirm}
                  className={`w-full py-4 text-[20px] font-semibold transition-colors cursor-pointer ${
                    isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007AFF] active:bg-black/10'
                  }`}
                >
                  {config.cancelText || (isBn ? 'বাতিল' : isArabic ? 'إلغاء' : 'Cancel')}
                </button>
              </div>
            </motion.div>
          ) : (
            /* iOS Alert Dialog Box (Default) */
            <motion.div
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative w-[275px] max-w-[90%] mx-auto flex flex-col overflow-hidden rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.22)] border ${
                isDarkMode 
                  ? 'border-white/10 bg-[#1c1c1e]/82 text-white' 
                  : 'border-black/10 bg-[#f2f2f7]/85 text-black'
              } backdrop-blur-[20px]`}
            >
              {/* Header / Content Section */}
              <div className="px-4 pt-5 pb-4 text-center">
                <h3 className={`text-[17px] font-semibold leading-tight tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-black'
                }`}>
                  {config.title || (isBn ? 'নিশ্চিতকরণ' : isArabic ? 'تأكيد' : 'Confirmation')}
                </h3>
                <p className={`text-[13px] leading-snug mt-1.5 px-1 font-normal opacity-90 ${
                  isDarkMode ? 'text-neutral-300' : 'text-neutral-600'
                }`}>
                  {config.message}
                </p>
              </div>

              {/* Hairline top border for buttons */}
              <div className={`h-[0.5px] w-full ${isDarkMode ? 'bg-white/15' : 'bg-black/10'}`} />
              
              {/* Action Buttons Section */}
              {config.onSecondaryConfirm ? (
                // 3 Buttons -> Stacked vertically
                <div className={`flex flex-col w-full divide-y ${
                  isDarkMode ? 'divide-white/15' : 'divide-black/10'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      config.onConfirm();
                      closeConfirm();
                    }}
                    className={`w-full py-3 text-[17px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'active:bg-white/10' : 'active:bg-black/10'
                    } ${
                      isConfirmDestructive 
                        ? (isDarkMode ? 'text-[#ff453a]' : 'text-[#FF3B30]') 
                        : (isDarkMode ? 'text-[#0a84ff]' : 'text-[#007AFF]')
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
                      isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007AFF] active:bg-black/10'
                    }`}
                  >
                    {config.secondaryConfirmText || (isBn ? 'শুধুমাত্র প্রস্থান' : 'Just Exit')}
                  </button>
                  <button
                    type="button"
                    onClick={closeConfirm}
                    className={`w-full py-3 text-[17px] font-semibold transition-colors cursor-pointer ${
                      isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007AFF] active:bg-black/10'
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
                      isDarkMode ? 'text-[#0a84ff] active:bg-white/10' : 'text-[#007AFF] active:bg-black/10'
                    }`}
                  >
                    {config.cancelText || (isBn ? 'বাতিল' : isArabic ? 'لا' : 'No')}
                  </button>
                  
                  {/* Hairline vertical divider */}
                  <div className={`w-[0.5px] h-full ${isDarkMode ? 'bg-white/15' : 'bg-black/10'}`} />
                  
                  <button
                    type="button"
                    onClick={() => {
                      config.onConfirm();
                      closeConfirm();
                    }}
                    className={`flex-1 h-full flex items-center justify-center text-[17px] font-semibold transition-colors cursor-pointer select-none ${
                      isDarkMode ? 'active:bg-white/10' : 'active:bg-black/10'
                    } ${
                      isConfirmDestructive 
                        ? (isDarkMode ? 'text-[#ff453a]' : 'text-[#FF3B30]') 
                        : (isDarkMode ? 'text-[#0a84ff]' : 'text-[#007AFF]')
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

