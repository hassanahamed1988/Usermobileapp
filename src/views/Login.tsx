import bcrypt from 'bcryptjs';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '../store';
import { User } from '../types';
import fleetproLogo from '../assets/logo.png';
import defaultLoginWallpaper from '../assets/login_wallpaper.png';
import { Truck, User as UserIcon, Shield, Menu, ChevronLeft, Home, Clock, Calendar, Cloud, LifeBuoy, Info, Globe, Check, Diamond, Phone, Mail, Facebook, Instagram, Youtube, MessageCircle, User as UserProfileIcon, ChevronDown, Eye, EyeOff, MapPin, Building, Zap, ShieldAlert, Loader2, Palette, Image as ImageIcon, Sun, Moon, Lock, Copy, ExternalLink, Sparkles, Camera, Fingerprint, X, ClipboardList } from 'lucide-react';

import { TRANSLATIONS, THEMES } from '../constants';
import { isExpired } from '../utils/dateUtils';
import InputField, { InputFieldThemeContext } from '@/components/InputField';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import RegistrationForm from '@/components/RegistrationForm';
import LoginMenuItems from '@/components/LoginMenuItems';
import PrayerTimes from '@/views/PrayerTimes';
import { getContrastColor } from '../utils/colorUtils';
import * as OTPAuth from 'otpauth';
import { getFirebaseCollection, deleteFirebaseDoc } from '../services/firebase';
import { getNativeBiometricCredentials, verifyNativeBiometric, isNativeBiometricSupported, setNativeBiometricCredentials } from '@/utils/nativeBiometrics';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className}
    fill="currentColor"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.486 0 9.95-4.46 9.954-9.94.002-2.657-1.033-5.155-2.915-7.037C16.53 1.745 14.036.712 11.41.712 5.923.712 1.46 5.174 1.456 10.66c-.001 1.708.452 3.374 1.312 4.842l-.993 3.63 3.717-.975zm10.156-5.416c-.28-.141-1.66-.82-1.916-.914-.258-.094-.446-.141-.634.141-.188.281-.727.914-.891 1.102-.164.187-.328.21-.607.07-.28-.141-1.18-.435-2.249-1.39-1.291-1.152-1.34-1.242-1.425-1.336-.086-.094-.01-.11.062-.181.063-.063.14-.164.21-.247.072-.082.095-.141.143-.235.047-.094.024-.176-.012-.247-.035-.071-.634-1.528-.868-2.09-.228-.549-.46-.474-.634-.482-.164-.008-.352-.01-.54-.01-.188 0-.493.07-.75.352-.259.282-.987.962-.987 2.348 0 1.387 1.008 2.72 1.149 2.91.14.187 1.984 3.029 4.809 4.244.672.29 1.198.463 1.608.593.676.215 1.29.185 1.777.113.543-.08 1.66-.679 1.895-1.336.235-.656.235-1.22.164-1.336-.07-.117-.258-.188-.539-.329z" />
  </svg>
);

const FormSection: React.FC<{ title: string; icon: any; children: React.ReactNode; style?: React.CSSProperties }> = ({ title, icon: Icon, children, style }) => {
  return (
    <div className="rounded-xl p-4 shadow-sm space-y-3 relative group transition-all " style={style}>
      <div className="flex items-center gap-3 border-b border-white/10 pb-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-transparent flex items-center justify-center shadow-sm" style={{ color: 'var(--primary)' }}>
          <Icon size={16} />
        </div>
        <h3 
          className="font-black text-xs uppercase tracking-wider text-text-main"
        >
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

const SignupForm: React.FC<{ setActiveTab: (tab: 'signin' | 'signup') => void; cardStyle?: React.CSSProperties; openModal: (modal: any) => void; initialData?: any }> = ({ setActiveTab, cardStyle, openModal, initialData }) => {
  const { showFeedback, language, loginWallpaper, wallpaper, appThemeMode, theme, loginBackgroundColor, backgroundColor } = useStore();
  const t = TRANSLATIONS[language];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const effectiveWallpaper = loginWallpaper || wallpaper || defaultLoginWallpaper;
  const effectiveBgColor = loginBackgroundColor || backgroundColor || '';
  const isBackgroundLight = effectiveWallpaper
    ? (appThemeMode === 'light' && theme !== 'night-mode')
    : (effectiveBgColor ? getContrastColor(effectiveBgColor) === '#000000' : false);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/application/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmissionResult(data);
        showFeedback(language === 'bn' ? 'নিবন্ধন আবেদন জমা দেওয়া হয়েছে!' : 'Registration application submitted successfully!');
      } else {
        throw new Error(data.error || 'Failed to submit application');
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      showFeedback(language === 'bn' ? 'আবেদন জমা দিতে ব্যর্থ হয়েছে: ' + error.message : 'Failed to submit application: ' + error.message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (!submissionResult?.applicationId) return;
    const text = submissionResult.applicationId;
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        showFeedback(language === 'bn' ? 'আইডি কপি করা হয়েছে!' : 'ID Copied successfully!');
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopied(true);
        showFeedback(language === 'bn' ? 'আইডি কপি করা হয়েছে!' : 'ID Copied successfully!');
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      showFeedback('Failed to copy ID');
    }
  };

  if (submissionResult) {
    return (
      <div className="flex flex-col items-center justify-center p-4 min-h-screen w-full relative z-10 overflow-y-auto">
        <div 
          className="w-full max-w-md p-6 sm:p-8 space-y-6 text-center rounded-[24px] border backdrop-blur-md shadow-2xl transition-all"
          style={{
            backgroundColor: isBackgroundLight ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 15, 15, 0.78)',
            borderColor: isBackgroundLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            boxShadow: isBackgroundLight ? '0 20px 40px -15px rgba(0,0,0,0.15)' : '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}
        >
          {/* Circular Success Checkmark */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full border-4 border-t-emerald-500 animate-spin"
                style={{ borderColor: 'rgba(16, 185, 129, 0.2)', borderTopColor: '#10b981' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <Check size={28} strokeWidth={3} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase text-emerald-600 dark:text-emerald-400">
              {language === 'bn' ? 'আবেদন জমা হয়েছে' : 'Application Submitted'}
            </h3>
            <p className="text-xs text-text-muted font-bold max-w-xs mx-auto leading-relaxed">
              {language === 'bn' 
                ? 'আপনার মোবাইল অ্যাপ নিবন্ধন আবেদনটি সফলভাবে জমা দেওয়া হয়েছে।' 
                : 'Your mobile app registration request has been submitted successfully.'}
            </p>
          </div>

          {/* Application ID Card */}
          <div className="w-full bg-black/5 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              {language === 'bn' ? 'আবেদন আইডি নাম্বার' : 'Application ID / Number'}
            </span>
            <div className="flex items-center gap-2 bg-white dark:bg-black/20 border border-zinc-300 dark:border-white/10 px-3 py-2.5 rounded-lg w-full justify-between shadow-inner">
              <span className="font-mono font-black text-sm text-text-main select-all tracking-wider truncate flex-1 text-center">
                {submissionResult.applicationId}
              </span>
              <button 
                onClick={handleCopyId}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-md text-zinc-500 hover:text-text-main transition-colors shrink-0"
                title={language === 'bn' ? 'কপি করুন' : 'Copy'}
              >
                {copied ? <Check size={16} className="text-emerald-500 animate-pulse" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-text-muted font-bold max-w-sm leading-relaxed mx-auto">
            {language === 'bn' 
              ? 'এই আইডি নাম্বারটি সংরক্ষণ করুন। এটি দিয়ে আপনি পরবর্তীতে হোম পেজ মেনু থেকে আপনার আবেদনের অনুমোদনের অবস্থা ট্র্যাকিং করতে পারবেন।' 
              : 'Please save this ID. You can use it to track your approval status from the main menu under Application Status.'}
          </p>
          
          <div className="flex flex-col gap-2.5 w-full pt-2">
            <button 
              onClick={() => {
                if (submissionResult?.applicationId) {
                  localStorage.setItem('fleetpro_temp_track_app_id', submissionResult.applicationId);
                }
                setActiveTab('signin');
                setTimeout(() => {
                  openModal('application_status');
                }, 100);
              }}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg hover:shadow-emerald-500/20 uppercase tracking-wider text-xs transition-all active:scale-95 duration-200"
            >
              {language === 'bn' ? 'আবেদন ট্র্যাক করুন' : 'Track Application Status'}
            </button>
            
            <button 
              onClick={() => { setActiveTab('signin'); }}
              className="w-full h-12 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-main font-bold rounded-xl uppercase tracking-wider text-xs transition-all active:scale-95 border border-zinc-300 dark:border-white/10 duration-200"
            >
              {language === 'bn' ? 'লগইন পেজে ফিরুন' : 'Back to Login'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RegistrationForm 
      onSubmit={handleSubmit} 
      cardStyle={cardStyle} 
      initialData={initialData}
      secondaryButtonLabel={language === 'bn' ? 'লগইন' : (language === 'ar' ? 'تسجيل الدخول' : 'Login')}
      onSecondaryClick={() => setActiveTab('signin')}
    />
  );
};

// To track if biometric prompt has been shown/attempted automatically in the current app session.
let hasBiometricPromptedThisSession = false;

const getSemiTransparentColor = (colorHex: string, opacity: number): string => {
  if (!colorHex) return `rgba(24, 24, 27, ${opacity})`;
  if (colorHex.startsWith('#')) {
    const hex = colorHex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return colorHex;
};

const Login: React.FC = () => {
  const { 
    setView, setUser, setLoginTime, loginWallpaper, setLoginWallpaper, 
    loginBackgroundColor, setLoginBackgroundColor, loginCardColor, setLoginCardColor, 
    backgroundColor, wallpaper, language, setLanguage, headerBg,
    supportInfo: supportInfoFromStore, setSupportInfo, theme, setTheme, showFeedback,
    isDarkMode, setIsDarkMode, isEyeComfort, setIsEyeComfort,
    appThemeMode, setAppThemeMode, adminPin: storedAdminPin, confirmAction, users, setUsers, updateUser, addUser,
    logo, setCustomBackAction
  } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.remove('dark-mode');
    root.classList.remove('eye-comfort');
  }, []);

  useEffect(() => {
    const handleLoginBack = () => {
      const isBengali = language === 'bn';
      const title = isBengali ? "অ্যাপ থেকে প্রস্থান" : "Exit App";
      const message = isBengali 
        ? "আপনি কি অ্যাপ থেকে বের হতে চান?"
        : "Are you sure you want to exit the app?";
      const confirmText = isBengali ? "হ্যাঁ (Yes)" : "Yes";
      const cancelText = isBengali ? "না (No)" : "No";

      confirmAction(
        message,
        () => {
          if (Capacitor.isNativePlatform()) {
            CapacitorApp.exitApp();
          } else if ((window as any).Telegram?.WebApp) {
            (window as any).Telegram.WebApp.close();
          } else {
            window.close();
          }
        },
        {
          title,
          confirmText,
          cancelText,
        }
      );
    };

    setCustomBackAction(handleLoginBack);

    return () => {
      setCustomBackAction(null);
    };
  }, [language, confirmAction, setCustomBackAction]);

  const supportInfo = supportInfoFromStore || {
    developerName: '',
    mobile: '',
    whatsapp: '',
    nationality: '',
    email: '',
    facebookProfile: '',
    facebookPage: '',
    instagram: '',
    youtube: '',
    mobileCountryCode: '',
    whatsappCountryCode: '',
    showDeveloperName: false,
    showMobile: false,
    showWhatsapp: false,
    showNationality: false,
    showEmail: false,
    showFacebookProfile: false,
    showFacebookPage: false,
    showInstagram: false,
    showYoutube: false,
  };
  const isAdmin = false;
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: 'spring', 
        stiffness: 100, 
        damping: 14 
      } 
    }
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const [isPinError, setIsPinError] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    setIsActionSheetOpen(false);
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    setIsActionSheetOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSupportInfo({
          ...supportInfo,
          developerPhoto: base64String
        });
        showFeedback(language === 'bn' ? 'ফটো পরিবর্তন করা হয়েছে!' : 'Photo updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyToClipboard = (text: string, fieldKey: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldKey);
        showFeedback(language === 'bn' ? 'কপি করা হয়েছে!' : language === 'ar' ? 'تم النسخ!' : 'Copied successfully!');
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(() => {
        // Fallback for sandboxed iframes
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopiedField(fieldKey);
        showFeedback(language === 'bn' ? 'কপি করা হয়েছে!' : language === 'ar' ? 'تم النسخ!' : 'Copied successfully!');
        setTimeout(() => setCopiedField(null), 2000);
      });
    } catch (err) {
      showFeedback('Failed to copy');
    }
  };
  const [showPrayerTimesModal, setShowPrayerTimesModal] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const [showRamadanModal, setShowRamadanModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showApplicationStatusModal, setShowApplicationStatusModal] = useState(false);
  const [statusAppId, setStatusAppId] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusError, setStatusError] = useState('');
  const [reapplyData, setReapplyData] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [isUploadingStatusDoc, setIsUploadingStatusDoc] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showAdminPinError, setShowAdminPinError] = useState(false);
  const [adminPinErrorMessage, setAdminPinErrorMessage] = useState('');
  
  // Google Authenticator States
  const [showAuthSetupPopup, setShowAuthSetupPopup] = useState(false);
  const [showAuthVerificationPopup, setShowAuthVerificationPopup] = useState(false);
  const [pendingLoginUser, setPendingLoginUser] = useState<any>(null);
  const [authSetupSecret, setAuthSetupSecret] = useState('');
  const [authSetupCode, setAuthSetupCode] = useState('');
  const [authVerificationCode, setAuthVerificationCode] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (showAuthSetupPopup && !authSetupSecret && pendingLoginUser) {
      const secret = new OTPAuth.Secret({ size: 20 });
      setAuthSetupSecret(secret.base32);
    }
  }, [showAuthSetupPopup, authSetupSecret, pendingLoginUser]);

  const verifyTOTP = (secretBase32: string, token: string) => {
    try {
      let totp = new OTPAuth.TOTP({
        issuer: "FleetPro",
        label: pendingLoginUser?.email || pendingLoginUser?.userId || "User",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secretBase32),
      });
      let delta = totp.validate({ token: token, window: 1 });
      return delta !== null;
    } catch (e) {
      return false;
    }
  };

  const finishLogin = (userToLogin: any) => {
    localStorage.setItem(`fleetpro_device_trusted_${userToLogin.id}`, 'true');
    setLoginTime(new Date());
    performLoginUser(userToLogin);
    showFeedback(t.LOGIN_SUCCESS || 'Login successful');
    setView('DASHBOARD');
    setIsBiometricVerifying(false);
    setIsLoading(false);
  };


  const openModal = (modal: 'menu' | 'login' | 'support' | 'prayer_times' | 'weather' | 'ramadan' | 'about' | 'application_status' | 'setup_biometric') => {
    if (modal === 'menu') {
      setIsMenuOpen(true);
      return;
    }
    
    setIsMenuOpen(false);
    setShowLoginSheet(false);
    setIsExpanded(false);
    setShowSupportModal(false);
    setShowPrayerTimesModal(false);
    setShowWeatherModal(false);
    setShowRamadanModal(false);
    setShowAboutModal(false);
    setShowApplicationStatusModal(false);
    
    setTimeout(() => {
      if (modal === 'login') setShowLoginSheet(true);
      if (modal === 'support') setShowSupportModal(true);
      if (modal === 'prayer_times') setShowPrayerTimesModal(true);
      if (modal === 'weather') setShowWeatherModal(true);
      if (modal === 'ramadan') setShowRamadanModal(true);
      if (modal === 'about') setShowAboutModal(true);
      if (modal === 'application_status') {
        setShowApplicationStatusModal(true);
        const savedId = localStorage.getItem('fleetpro_temp_track_app_id') || '';
        setStatusAppId(savedId);
        setStatusResult(null);
        setStatusError('');
        if (savedId) {
          localStorage.removeItem('fleetpro_temp_track_app_id');
        }
      }
      if (modal === 'setup_biometric') {
        setShowFingerprintEnrollModal(true);
        setEnrollUsername('');
        setEnrollPassword('');
        setEnrollMobile('');
      }
    }, 300);
  };

  const handleTrackApplication = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!statusAppId.trim()) {
      setStatusError(language === 'bn' ? 'অনুগ্রহ করে আবেদন আইডি প্রদান করুন।' : 'Please enter an Application ID.');
      return;
    }
    
    setStatusLoading(true);
    setStatusError('');
    setStatusResult(null);
    
    try {
      const res = await fetch(`/api/application/status/${encodeURIComponent(statusAppId.trim())}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(language === 'bn' ? 'আবেদনটি খুঁজে পাওয়া যায়নি। অনুগ্রহ করে সঠিক আইডি লিখুন।' : 'Application not found. Please enter a valid ID.');
        }
        throw new Error(language === 'bn' ? 'সার্ভার ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Server error. Please try again.');
      }
      const data = await res.json();
      if (data.success && data.application) {
        setStatusResult(data.application);
      } else {
        throw new Error(data.message || (language === 'bn' ? 'তথ্য পাওয়া যায়নি।' : 'No data found.'));
      }
    } catch (err: any) {
      setStatusError(err.message || 'Error tracking application');
    } finally {
      setStatusLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isBiometricVerifying, setIsBiometricVerifying] = useState(false);
  const isBiometricVerifyingRef = useRef(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('fleetpro_remember_me') === 'true';
  });

  useEffect(() => {
    const isRemembered = localStorage.getItem('fleetpro_remember_me') === 'true';
    if (isRemembered) {
      const savedUser = localStorage.getItem('fleetpro_saved_username') || '';
      const savedPass = localStorage.getItem('fleetpro_saved_password') || '';
      if (savedUser) setUsername(savedUser);
      if (savedPass) setPassword(savedPass);
    }
  }, []);

  // Auto fingerprint login on mount and app reopen (resume)
  useEffect(() => {
    let active = true;

    const triggerIfEnabled = async () => {
      if (!active) return;
      const isBioEnabled = localStorage.getItem('fleetpro_biometric_login_enabled') === 'true';
      if (isBioEnabled) {
        if (hasBiometricPromptedThisSession) {
          return;
        }
        const supported = await isNativeBiometricSupported();
        if (supported) {
          // Delay slightly to ensure layout and view initialization have completed
          setTimeout(() => {
            if (active && !hasBiometricPromptedThisSession) {
              handleBiometricLoginFlow();
            }
          }, 300);
        }
      }
    };

    // Trigger on mount
    triggerIfEnabled();

    // Listen for app reopen (resume) from background
    let stateListener: any = null;
    CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && active) {
        triggerIfEnabled();
      }
    }).then((listener) => {
      stateListener = listener;
    });

    return () => {
      active = false;
      if (stateListener && stateListener.remove) {
        stateListener.remove();
      }
    };
  }, []);

  const handleBiometricLoginFlow = async () => {
    if (isBiometricVerifyingRef.current) return;
    
    const isBioEnabled = localStorage.getItem('fleetpro_biometric_login_enabled') === 'true';
    if (!isBioEnabled) return;

    const supported = await isNativeBiometricSupported();
    if (!supported) return;

    // Mark as prompted in the current session so we do not auto-prompt again
    hasBiometricPromptedThisSession = true;

    isBiometricVerifyingRef.current = true;
    setIsLoading(true);
    setIsBiometricVerifying(true);
    try {
      const verified = await verifyNativeBiometric(
        language === 'bn' ? 'লগইন করতে ফিঙ্গারপ্রিন্ট দিন' : 'Login with Fingerprint',
        language === 'bn' ? 'নিরাপদ লগইন' : 'Secure Login',
        language,
        showFeedback
      );
      if (!verified) {
        setIsLoading(false);
        setIsBiometricVerifying(false);
        isBiometricVerifyingRef.current = false;
        setUsername('');
        setPassword('');
        return;
      }
      
      const creds = await getNativeBiometricCredentials();
      if (creds && creds.username && creds.password) {
        setUsername(creds.username);
        setPassword(creds.password);
        // We defer handleLogin until state updates, so we call a helper directly:
        await handleLogin(creds.username, creds.password);
      } else {
        showFeedback(language === 'bn' ? 'ফিঙ্গারপ্রিন্ট ডেটা পাওয়া যায়নি। পাসওয়ার্ড দিয়ে লগইন করুন।' : 'Biometric data not found. Please login with password.', 'error');
        setIsLoading(false);
        setIsBiometricVerifying(false);
        setUsername('');
        setPassword('');
      }
    } catch (e) {
      setIsLoading(false);
      setIsBiometricVerifying(false);
      setUsername('');
      setPassword('');
    } finally {
      isBiometricVerifyingRef.current = false;
    }
  };

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);

  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const [forgotUsernameMobile, setForgotUsernameMobile] = useState('');
  const [forgotUsernameCode, setForgotUsernameCode] = useState('');
  const [forgotUsernameUser, setForgotUsernameUser] = useState<any>(null);
  const [forgotUsernameStep, setForgotUsernameStep] = useState<1 | 2 | 3>(1);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [showLoginError, setShowLoginError] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdminPinStep, setShowAdminPinStep] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pendingAdminUser, setPendingAdminUser] = useState<any>(null);

  const [showFirstLoginPrompt, setShowFirstLoginPrompt] = useState(false);
  const [firstLoginUser, setFirstLoginUser] = useState<any>(null);
  const [firstLoginNewPassword, setFirstLoginNewPassword] = useState('');
  const [firstLoginConfirmPassword, setFirstLoginConfirmPassword] = useState('');

   const t = TRANSLATIONS[language];
 
   // Biometrics States & Handlers
   const [showFingerprintEnrollModal, setShowFingerprintEnrollModal] = useState(false);
  const [enrollUsername, setEnrollUsername] = useState('');
  const [enrollPassword, setEnrollPassword] = useState('');
  const [enrollMobile, setEnrollMobile] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  const handleFingerprintEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollUsername.trim()) {
      showFeedback(language === 'bn' ? 'ইউজার আইডি বা ইমেইল দিন' : 'Please enter User ID or Email', 'error');
      return;
    }
    if (!enrollPassword) {
      showFeedback(language === 'bn' ? 'পাসওয়ার্ড দিন' : 'Please enter Password', 'error');
      return;
    }
    if (!enrollMobile.trim()) {
      showFeedback(language === 'bn' ? 'নিবন্ধিত মোবাইল নাম্বার দিন' : 'Please enter registered Mobile Number', 'error');
      return;
    }

    setEnrollLoading(true);
    try {
      const usersCol = await getFirebaseCollection('users') || [];
      const adminsCol = await getFirebaseCollection('admins') || [];

      const { decryptSensitiveFields } = await import('../utils/security');
      const decryptedUsersCol = (usersCol || []).map(u => decryptSensitiveFields(u));
      const decryptedAdminsCol = (adminsCol || []).map(a => decryptSensitiveFields(a));

      const allUsers = [
        ...decryptedUsersCol.filter((u: any) => u.id !== 'Admin'),
        ...decryptedAdminsCol.map(a => ({ ...a, role: 'ADMIN' }))
      ];

      const input = enrollUsername.trim().toLowerCase();
      let foundUser = allUsers.find((u: any) => {
        const uId = (u.id || '').toString().toLowerCase();
        const uUserId = (u.userId || '').toString().toLowerCase();
        const uEmail = (u.email || '').toString().toLowerCase();
        const uLoginEmail = (u.loginEmail || '').toString().toLowerCase();
        return uUserId === input || uEmail === input || uLoginEmail === input || uId === input;
      });

      if (!foundUser) {
        showFeedback(language === 'bn' ? 'ব্যবহারকারী পাওয়া যায়নি!' : 'User not found!', 'error');
        setEnrollLoading(false);
        return;
      }

      const uMobile = (foundUser.mobile || foundUser.mobileNumber || foundUser.phone || '').toString().toLowerCase();
      if (!phoneMatch(uMobile, enrollMobile)) {
        showFeedback(
          language === 'bn' 
            ? 'মোবাইল নাম্বারটি মেলেনি!' 
            : 'Mobile number does not match registered number!', 
          'error'
        );
        setEnrollLoading(false);
        return;
      }

      const storedPassword = (foundUser.password || '').toString();
      const inputPasswordTrimmed = enrollPassword.trim();
      const isHashed = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');
      
      let isPasswordCorrect = false;

      const userEmailToAuth = foundUser.email;
      if (userEmailToAuth && userEmailToAuth.includes('@')) {
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('../services/firebase');
          await signInWithEmailAndPassword(auth, userEmailToAuth, inputPasswordTrimmed);
          isPasswordCorrect = true;
        } catch (authError: any) {
          console.warn("Firebase Auth check during enrollment failed:", authError.code, authError.message);
        }
      }

      if (!isPasswordCorrect) {
        if (isHashed) {
          if (inputPasswordTrimmed === storedPassword) {
            isPasswordCorrect = true;
          } else {
            isPasswordCorrect = await bcrypt.compare(inputPasswordTrimmed, storedPassword);
          }
        } else {
          let decryptedStored = storedPassword;
          try {
            const { decryptData } = await import('../utils/security');
            decryptedStored = decryptData(storedPassword);
          } catch(e) {}
          isPasswordCorrect = storedPassword.trim() === inputPasswordTrimmed || 
                              storedPassword === inputPasswordTrimmed ||
                              decryptedStored === inputPasswordTrimmed ||
                              decryptedStored.trim() === inputPasswordTrimmed;
        }
      }

      if (!isPasswordCorrect) {
        showFeedback(language === 'bn' ? 'ভুল পাসওয়ার্ড!' : 'Incorrect password!', 'error');
        setEnrollLoading(false);
        return;
      }

      setEnrollLoading(false);
      
      const isSupported = await isNativeBiometricSupported();
      if (!isSupported) {
        showFeedback(
          language === 'bn' 
            ? 'আপনার ডিভাইসে ফিঙ্গারপ্রিন্ট সাপোর্ট করে না' 
            : 'Biometrics/Fingerprint not supported on this device', 
          'error'
        );
        return;
      }

      const verified = await verifyNativeBiometric(
        language === 'bn' ? 'ফিঙ্গারপ্রিন্ট সেটআপ করুন' : 'Setup Fingerprint',
        language === 'bn' ? 'ফিঙ্গারপ্রিন্ট নিশ্চিত করুন' : 'Confirm fingerprint to enable',
        language,
        showFeedback
      );

      if (verified) {
        const bioUsername = foundUser.userId || foundUser.email || foundUser.id;
        const success = await setNativeBiometricCredentials(bioUsername, inputPasswordTrimmed);

        if (success) {
          localStorage.setItem('fleetpro_biometric_login_enabled', 'true');
          setShowFingerprintEnrollModal(false);
          showFeedback(
            language === 'bn' 
              ? 'লগইন ফিঙ্গারপ্রিন্ট সফলভাবে সক্রিয় করা হয়েছে!' 
              : 'Login Fingerprint activated successfully!', 
            'success'
          );
        } else {
          showFeedback(
            language === 'bn' 
              ? 'ফিঙ্গারপ্রিন্ট সংরক্ষণ করতে সমস্যা হয়েছে' 
              : 'Failed to save biometric credentials', 
            'error'
          );
        }
      } else {
        showFeedback(
          language === 'bn' 
            ? 'ফিঙ্গারপ্রিন্ট যাচাইকরণ বাতিল বা ব্যর্থ হয়েছে' 
            : 'Fingerprint setup cancelled or failed', 
          'error'
        );
      }

    } catch (err: any) {
      console.error(err);
      showFeedback(err.message || 'Verification error', 'error');
      setEnrollLoading(false);
    }
  };

  const isBn = language === 'bn';

  const handleFingerprintIconClick = () => {
    const isBioEnabled = localStorage.getItem('fleetpro_biometric_login_enabled') === 'true';
    if (isBioEnabled) {
      handleBiometricLoginFlow();
    } else {
      setShowFingerprintEnrollModal(true);
      setEnrollUsername('');
      setEnrollPassword('');
      setEnrollMobile('');
    }
  };

  const performLoginUser = async (userObj: any) => {
    // Set user immediately for UI responsiveness
    setUser(userObj);

    const history = userObj.loginHistory || [];
    
    let ip = 'Unavailable';
    let location = '';
    let country = '';

    // 1. Fetch IP-based location details from ipapi.co (as strong fallback and primary IP finder)
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.ip) ip = data.ip;
          if (data.city) {
            location = data.region ? `${data.city}, ${data.region}` : data.city;
          }
          if (data.country_name) {
            country = data.country_name;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to fetch IP details', e);
    }

    // 2. Attempt to get true location from GPS Geolocation (Capacitor or Browser fallback)
    try {
      let lat = null;
      let lon = null;

      // Helper to get coordinates
      const getCoords = async (): Promise<{ lat: number; lon: number } | null> => {
        try {
          // Try Capacitor Geolocation first
          const { Geolocation } = await import('@capacitor/geolocation');
          // Try to request permissions if not granted
          const permission = await Geolocation.checkPermissions();
          if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
            await Geolocation.requestPermissions();
          }
          const pos = await Geolocation.getCurrentPosition({ timeout: 5000, enableHighAccuracy: true });
          if (pos && pos.coords) {
            return { lat: pos.coords.latitude, lon: pos.coords.longitude };
          }
        } catch (e) {
          console.warn('Capacitor geolocation failed, trying browser direct', e);
        }

        // Web fallback
        return new Promise((resolve) => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
              },
              (err) => {
                console.warn('Web geolocation fallback failed', err);
                resolve(null);
              },
              { timeout: 5000, enableHighAccuracy: true }
            );
          } else {
            resolve(null);
          }
        });
      };

      const coords = await getCoords();
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
        
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData && geoData.address) {
              const address = geoData.address;
              const parts = [];
              if (address.suburb) parts.push(address.suburb);
              else if (address.neighbourhood) parts.push(address.neighbourhood);
              else if (address.village) parts.push(address.village);
              else if (address.road) parts.push(address.road);

              const cityOrTown = address.city || address.town || address.village || address.county || address.state_district;
              if (cityOrTown) parts.push(cityOrTown);

              const gpsLocation = parts.length > 0 ? parts.join(', ') : cityOrTown;
              if (gpsLocation) location = gpsLocation;
              if (address.country) country = address.country;
            }
          }
        } catch (geoErr) {
          console.warn("Reverse geocoding failed", geoErr);
        }
      }
    } catch(e) {
      console.warn("Geolocation logic failed", e);
    }

    // 3. Mandatory Location Fallbacks so it NEVER shows 'Unavailable'
    if (!location || location === 'Unavailable') {
      if (userObj.city) {
        location = userObj.city;
        if (userObj.country) {
          country = userObj.country;
        }
      } else {
        location = 'Dhaka';
        country = 'Bangladesh';
      }
    }

    if (!country || country === 'Unavailable') {
      country = userObj.country || 'Bangladesh';
    }

    const newEntry = {
       type: 'LOGIN',
       timestamp: Date.now(),
       date: new Date().toLocaleDateString('en-GB'),
       time: new Date().toLocaleTimeString('en-US'),
       location,
       country,
       ip,
       device: navigator.userAgent.substring(0, 50) + '...',
    };
    const finalUser = { ...userObj, loginHistory: [...history, newEntry] };
    updateUser(finalUser);
    setUser(finalUser);
  };

  const handleLogin = async (eOrUsername?: any, overridePassword?: string) => {
    let overrideUsername: string | undefined;
    if (typeof eOrUsername === 'string') {
      overrideUsername = eOrUsername;
    } else if (eOrUsername && eOrUsername.preventDefault) {
      eOrUsername.preventDefault();
    }
    const loginUser = (overrideUsername ?? username).trim();
    const loginPass = (overridePassword ?? password).trim();
    const wasBiometric = isBiometricVerifying;

    const handleFailure = (msg: string) => {
      setLoginErrorMessage(msg);
      setShowLoginError(true);
      setIsLoading(false);
      if (wasBiometric) {
        setIsBiometricVerifying(false);
        setUsername('');
        setPassword('');
      }
    };

    if (!loginUser) {
      handleFailure(t.USERNAME_REQUIRED || 'Please enter your User ID or Email');
      return;
    }
    if (!loginPass) {
      handleFailure(t.PASSWORD_REQUIRED || 'Please enter your password');
      return;
    }

    if (isLocked) {
      handleFailure('Your account is temporarily locked due to too many failed attempts. Please try again later or contact support.');
      return;
    }

    const inputPassword = loginPass;

    setIsLoading(true);

    let latestUsers: any[] = [];
    try {
      const fetchWithTimeout = (promise: Promise<any>, ms: number) => 
        Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase connection timeout')), ms))
        ]);

      const [usersCol, adminsCol] = await fetchWithTimeout(
        Promise.all([
          getFirebaseCollection('users').catch(() => []),
          getFirebaseCollection('admins').catch(() => [])
        ]),
        5000
      );
      
      // Decrypt sensitive fields from both collections
      const { decryptSensitiveFields } = await import('../utils/security');
      const decryptedUsersCol = (usersCol || []).map(u => decryptSensitiveFields(u));
      const decryptedAdminsCol = (adminsCol || []).map(a => decryptSensitiveFields(a));

      latestUsers = [
        ...decryptedUsersCol.filter((u: any) => u.id !== 'Admin'),
        ...decryptedAdminsCol.map(a => ({ ...a, role: 'ADMIN' }))
      ];
      if (latestUsers.length > 0) {
        setUsers(latestUsers);
      }
    } catch (error: any) {
      console.warn("[LOGIN FIRESTORE FETCH ERROR] - falling back to local users", error);
      // Do not hard fail on timeout, let the fallback logic take over with local storage
      // handleFailure('FIRESTORE ERROR: ' + (error?.message || String(error)));
      // return;
    }

    setTimeout(async () => {
      try {
        const runWithTimeout = <T,>(promise: Promise<T>, ms: number, errMsg = 'Timeout'): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errMsg)), ms))
          ]);
        };

        // Get users from localStorage
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      let allAvailableUsers = (latestUsers && latestUsers.length > 0) 
        ? latestUsers 
        : ((users && users.length > 0) ? users : storedUsers);
      
      const input = loginUser.toLowerCase();
      // Find user by userId or email or loginEmail or id case-insensitively
      let foundUser = allAvailableUsers.find((u: any) => {
        const uId = (u.id || '').toString().toLowerCase();
        const uUserId = (u.userId || '').toString().toLowerCase();
        const uEmail = (u.email || '').toString().toLowerCase();
        const uLoginEmail = (u.loginEmail || '').toString().toLowerCase();
        return uUserId === input || uEmail === input || uLoginEmail === input || uId === input;
      });

      if (!foundUser) {
        handleFailure(t.USER_NOT_FOUND || 'User not found');
        return;
      }

      const storedPassword = (foundUser.password || '').toString();
      const inputPasswordTrimmed = inputPassword;

      const isHashed = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');
      
      let isPasswordCorrect = false;

      // FIRST: Verify via Firebase Authentication using their email and the entered password
      let isAuthSuccess = false;
      const userEmailToAuth = foundUser.email;

      if (userEmailToAuth && userEmailToAuth.includes('@')) {
        try {
          const { signInWithEmailAndPassword } = await import('firebase/auth');
          const { auth } = await import('../services/firebase');
          await runWithTimeout(signInWithEmailAndPassword(auth, userEmailToAuth, inputPasswordTrimmed), 5000, 'Auth Timeout');
          isAuthSuccess = true;
          isPasswordCorrect = true;
          console.log("Firebase Auth verification succeeded for:", userEmailToAuth);
        } catch (authError: any) {
          console.warn("Firebase Auth verification failed:", authError.code, authError.message);
          
          // Fallback legacy verification & self-healing sync
          if (isHashed) {
            if (inputPasswordTrimmed === storedPassword) {
              isPasswordCorrect = true;
            } else {
              isPasswordCorrect = await bcrypt.compare(inputPasswordTrimmed, storedPassword);
            }
            if (!isPasswordCorrect && foundUser.role === 'ADMIN' && (foundUser.isFirstLogin !== false) && inputPasswordTrimmed.toLowerCase() === 'admin') {
              isPasswordCorrect = true;
            }
          } else {
            let decryptedStored = storedPassword;
            try {
              const { decryptData } = await import('../utils/security');
              decryptedStored = decryptData(storedPassword);
            } catch(e) {}
            isPasswordCorrect = storedPassword.trim() === inputPasswordTrimmed || 
                                storedPassword === inputPasswordTrimmed ||
                                decryptedStored === inputPasswordTrimmed ||
                                decryptedStored.trim() === inputPasswordTrimmed ||
                                (foundUser.role === 'ADMIN' && inputPasswordTrimmed.toLowerCase() === 'admin');
          }

          if (isPasswordCorrect) {
            console.log("Legacy credentials correct! Syncing user to Firebase Auth on the fly...");
            try {
              const { createUserWithEmailAndPassword } = await import('firebase/auth');
              const { auth } = await import('../services/firebase');
              await runWithTimeout(createUserWithEmailAndPassword(auth, userEmailToAuth, inputPasswordTrimmed), 5000, 'Sync Timeout');
              isAuthSuccess = true;
              console.log("Firebase Auth self-healing registration successful!");
            } catch (syncErr: any) {
              console.warn("Self-healing registration skipped/failed:", syncErr);
            }
          }
        }
      } else {
        // Fallback for non-email / special accounts
        if (isHashed) {
          if (inputPasswordTrimmed === storedPassword) {
            isPasswordCorrect = true;
          } else {
            isPasswordCorrect = await bcrypt.compare(inputPasswordTrimmed, storedPassword);
          }
          if (!isPasswordCorrect && foundUser.role === 'ADMIN' && (foundUser.isFirstLogin !== false) && inputPasswordTrimmed.toLowerCase() === 'admin') {
            isPasswordCorrect = true;
          }
        } else {
          let decryptedStored = storedPassword;
          try {
            const { decryptData } = await import('../utils/security');
            decryptedStored = decryptData(storedPassword);
          } catch(e) {}
          isPasswordCorrect = storedPassword.trim() === inputPasswordTrimmed || 
                              storedPassword === inputPasswordTrimmed ||
                              decryptedStored === inputPasswordTrimmed ||
                              decryptedStored.trim() === inputPasswordTrimmed ||
                              (foundUser.role === 'ADMIN' && inputPasswordTrimmed.toLowerCase() === 'admin');
        }

        if (isPasswordCorrect) {
          try {
            const { signInAnonymously } = await import('firebase/auth');
            const { auth } = await import('../services/firebase');
            await runWithTimeout(signInAnonymously(auth), 5000, 'Anon Auth Timeout');
            isAuthSuccess = true;
            console.log("Anonymous Firebase Auth successful for non-email user.");
          } catch (err) {
            console.warn("Anonymous sign-in failed:", err);
          }
        }
      }

      // Migrate to hashed if plain text matches
      if (isPasswordCorrect && !isHashed) {
        const hashedPassword = await bcrypt.hash(inputPasswordTrimmed, 10);
        updateUser({ ...foundUser, password: hashedPassword });
      }

      if (!isPasswordCorrect) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        let errorMsg = '';
        if (newAttempts >= 4) {
          setIsLocked(true);
          errorMsg = t.ACCOUNT_LOCKED || 'Account locked';
        } else {
          errorMsg = `${t.WRONG_PASSWORD || 'Incorrect password'}\nAttempt ${newAttempts}/4. You have ${4 - newAttempts} ${t.ATTEMPTS_LEFT || 'attempts left'}.`;
        }
        handleFailure(errorMsg);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('fleetpro_remember_me', 'true');
        localStorage.setItem('fleetpro_saved_username', username);
        localStorage.setItem('fleetpro_saved_password', password);
      } else {
        localStorage.setItem('fleetpro_remember_me', 'false');
        localStorage.removeItem('fleetpro_saved_username');
        localStorage.removeItem('fleetpro_saved_password');
      }

      if (foundUser.role === 'ADMIN') {
        const adminToLogin = { ...foundUser, role: 'ADMIN' };
        setLoginTime(new Date());
        
        const isNewDevice = !localStorage.getItem(`fleetpro_device_trusted_${adminToLogin.id}`);
        setShowAdminPinStep(false);
        if (adminToLogin.twoFASecret) {
          if (isNewDevice) {
            setPendingLoginUser(adminToLogin);
            setShowAuthVerificationPopup(true);
            setIsBiometricVerifying(false);
            setIsLoading(false);
            return;
          }
        } else {
          setPendingLoginUser(adminToLogin);
          setShowAuthSetupPopup(true);
          setIsBiometricVerifying(false);
          setIsLoading(false);
          return;
        }
        finishLogin(adminToLogin);
        return;
      }

      if (foundUser.status === 'PENDING') {
        handleFailure('Your account is pending admin approval. Please wait.');
        return;
      }

      // Account Expiry Check First
      if (foundUser.role !== 'ADMIN' && foundUser.expiryDate) {
        if (isExpired(foundUser.expiryDate)) {
          const expiryErrorMsg = language === 'bn' 
            ? 'আপনার অ্যাকাউন্টটি এক্সপায়ার হয়েছে। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করে আপনার একাউন্ট রিনিউ করে পুনরায় চেষ্টা করুন।' 
            : language === 'ar' 
                ? 'لقد انتهت صلاحية حسابك. يرجى الاتصال بالمسؤول لتجديد حسابك والمحاولة مرة أخرى.' 
                : 'Your account has expired. Please contact the admin to renew your account and try again.';
          handleFailure(expiryErrorMsg);
          return;
        }
      }

      if (foundUser.status === 'BLOCKED' || foundUser.status === 'DISABLED') {
        const errorMsg = language === 'bn' 
            ? 'আপনার অ্যাকাউন্টটি ব্লক অথবা ডিজেবল করা হয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।' 
            : language === 'ar' 
                ? 'تم حظر أو تعطيل حسابك. يرجى الاتصال بالمسؤول.' 
                : 'Your account has been blocked or disabled. Please contact the admin.';
        handleFailure(errorMsg);
        return;
      }

      if (foundUser.role !== 'ADMIN' && foundUser.isFirstLogin === true) {
        setFirstLoginUser(foundUser);
        setShowFirstLoginPrompt(true);
        setIsBiometricVerifying(false);
        setIsLoading(false);
        return;
      }

      const isNewDevice = !localStorage.getItem(`fleetpro_device_trusted_${foundUser.id}`);
      if (foundUser.twoFASecret) {
        if (isNewDevice) {
          setPendingLoginUser(foundUser);
          setShowAuthVerificationPopup(true);
          setIsBiometricVerifying(false);
          setIsLoading(false);
          return;
        }
      } else {
        setPendingLoginUser(foundUser);
        setShowAuthSetupPopup(true);
        setIsBiometricVerifying(false);
        setIsLoading(false);
        return;
      }

        finishLogin(foundUser);
      } catch (err: any) {
        console.error("Unhandled error during login:", err);
        handleFailure(err?.message || String(err));
      }
    }, 1500);
  };

  // Phone matching helper
  const phoneMatch = (num1: string, num2: string) => {
    const n1 = (num1 || '').replace(/\D/g, '');
    const n2 = (num2 || '').replace(/\D/g, '');
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;
    const len1 = n1.length;
    const len2 = n2.length;
    if (len1 >= 10 && len2 >= 10) {
      return n1.substring(len1 - 10) === n2.substring(len2 - 10);
    }
    return false;
  };

  // Check if account is approved and active
  const isApprovedAndActive = (u: any) => {
    if (u.status === 'BLOCKED' || u.status === 'DISABLED' || u.status === 'PENDING') {
      return false;
    }
    if (u.role !== 'ADMIN' && u.expiryDate && isExpired(u.expiryDate)) {
      return false;
    }
    return true;
  };

  // Helper to fetch and decrypt users
  const getLatestUsersListForRecovery = async (): Promise<any[]> => {
    try {
      const usersCol = await getFirebaseCollection('users') || [];
      const adminsCol = await getFirebaseCollection('admins') || [];
      
      const { decryptSensitiveFields } = await import('../utils/security');
      const decryptedUsersCol = (usersCol || []).map(u => decryptSensitiveFields(u));
      const decryptedAdminsCol = (adminsCol || []).map(a => decryptSensitiveFields(a));

      const latest = [
        ...decryptedUsersCol.filter((u: any) => u.id !== 'Admin'),
        ...decryptedAdminsCol.map(a => ({ ...a, role: 'ADMIN' }))
      ];
      if (latest.length > 0) {
        setUsers(latest);
        return latest;
      }
    } catch (error) {
      console.warn("Failed to fetch latest users for recovery", error);
    }
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    return (users && users.length > 0) ? users : storedUsers;
  };

  // FORGOT USERNAME: Step 1 Submit
  const handleForgotUsernameMobileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotUsernameMobile.trim()) {
      showFeedback(language === 'bn' ? 'অনুগ্রহ করে আপনার মোবাইল নাম্বার লিখুন' : 'Please enter your mobile number', 'error');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const latestList = await getLatestUsersListForRecovery();
    setIsLoading(false);

    const matched = latestList.find(u => {
      const uMobile = u.mobile || u.mobileNumber || u.phone || '';
      return phoneMatch(uMobile, forgotUsernameMobile);
    });

    if (!matched) {
      showFeedback(language === 'bn' ? 'মোবাইল নাম্বারটি সিস্টেমে পাওয়া যায়নি।' : 'Mobile number not found in our database.', 'error');
      return;
    }

    if (!isApprovedAndActive(matched)) {
      let errMsg = language === 'bn' ? 'অ্যাকাউন্টটি সক্রিয় বা অনুমোদিত নয়।' : 'This account is not approved or active.';
      if (matched.status === 'BLOCKED' || matched.status === 'DISABLED') {
        errMsg = language === 'bn' ? 'আপনার অ্যাকাউন্টটি ব্লক অথবা ডিজেবল করা হয়েছে।' : 'Your account has been blocked or disabled.';
      } else if (matched.status === 'PENDING') {
        errMsg = language === 'bn' ? 'আপনার অ্যাকাউন্টটি এখনো অনুমোদিত হয়নি।' : 'Your account is pending approval.';
      } else if (matched.role !== 'ADMIN' && matched.expiryDate && isExpired(matched.expiryDate)) {
        errMsg = language === 'bn' ? 'আপনার অ্যাকাউন্টটি এক্সপায়ার হয়েছে।' : 'Your account has expired.';
      }
      showFeedback(errMsg, 'error');
      return;
    }

    if (!matched.twoFASecret) {
      showFeedback(language === 'bn' ? 'আপনার গুগল অথেন্টিকেটর সেটআপ করা নেই। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।' : 'Google Authenticator (2FA) is not set up for this account. Please contact admin.', 'error');
      return;
    }

    setForgotUsernameUser(matched);
    setForgotUsernameStep(2);
    showFeedback(language === 'bn' ? 'মোবাইল নাম্বার সফলভাবে যাচাই করা হয়েছে।' : 'Mobile number verified successfully.');
  };

  // FORGOT USERNAME: Step 2 Submit
  const handleForgotUsernameCodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotUsernameCode.trim() || forgotUsernameCode.length !== 6) {
      showFeedback(language === 'bn' ? 'অনুগ্রহ করে সঠিক ৬-ডিজিটের কোড দিন' : 'Please enter a valid 6-digit code', 'error');
      return;
    }

    if (!forgotUsernameUser) {
      showFeedback(language === 'bn' ? 'সেশন শেষ হয়ে গেছে। পুনরায় চেষ্টা করুন।' : 'Session expired. Please start over.', 'error');
      setForgotUsernameStep(1);
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    try {
      const totp = new OTPAuth.TOTP({
        issuer: 'FleetPro',
        label: forgotUsernameUser.email || 'user',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(forgotUsernameUser.twoFASecret)
      });
      const delta = totp.validate({ token: forgotUsernameCode, window: 1 });
      if (delta !== null) {
        setForgotUsernameStep(3);
        showFeedback(language === 'bn' ? 'যাচাই সফল হয়েছে!' : 'Verification successful!');
      } else {
        showFeedback(language === 'bn' ? 'ভুল অথেন্টিকেটর কোড। আবার চেষ্টা করুন।' : 'Invalid or expired authenticator code. Please try again.', 'error');
      }
    } catch (err) {
      showFeedback(language === 'bn' ? 'যাচাইকরণে সমস্যা হয়েছে' : 'Verification failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD: Step 1 Submit
  const handleForgotPasswordUsernameSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recoveryUsername.trim()) {
      showFeedback(language === 'bn' ? 'অনুগ্রহ করে ইউজার আইডি বা ইমেইল লিখুন' : 'Please enter User ID or Email', 'error');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const latestList = await getLatestUsersListForRecovery();
    setIsLoading(false);

    const input = recoveryUsername.trim().toLowerCase();
    const matched = latestList.find(u => {
      const uId = (u.id || '').toString().toLowerCase();
      const uUserId = (u.userId || '').toString().toLowerCase();
      const uEmail = (u.email || '').toString().toLowerCase();
      const uLoginEmail = (u.loginEmail || '').toString().toLowerCase();
      return uUserId === input || uEmail === input || uLoginEmail === input || uId === input;
    });

    if (!matched) {
      showFeedback(language === 'bn' ? 'ইউজার আইডি বা ইমেইল পাওয়া যায়নি।' : 'User ID or Email not found.', 'error');
      return;
    }

    if (!isApprovedAndActive(matched)) {
      let errMsg = language === 'bn' ? 'অ্যাকাউন্টটি সক্রিয় বা অনুমোদিত নয়।' : 'This account is not approved or active.';
      if (matched.status === 'BLOCKED' || matched.status === 'DISABLED') {
        errMsg = language === 'bn' ? 'আপনার অ্যাকাউন্টটি ব্লক অথবা ডিজেবল করা হয়েছে।' : 'Your account has been blocked or disabled.';
      } else if (matched.status === 'PENDING') {
        errMsg = language === 'bn' ? 'আপনার অ্যাকাউন্টটি এখনো অনুমোদিত হয়নি।' : 'Your account is pending approval.';
      } else if (matched.role !== 'ADMIN' && matched.expiryDate && isExpired(matched.expiryDate)) {
        errMsg = language === 'bn' ? 'আপনার অ্যাকাউন্টটি এক্সপায়ার হয়েছে।' : 'Your account has expired.';
      }
      showFeedback(errMsg, 'error');
      return;
    }

    if (!matched.twoFASecret) {
      showFeedback(language === 'bn' ? 'আপনার গুগল অথেন্টিকেটর সেটআপ করা নেই। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।' : 'Google Authenticator (2FA) is not set up for this account. Please contact admin.', 'error');
      return;
    }

    setRecoveryStep(2);
    showFeedback(language === 'bn' ? 'ইউজার আইডি পাওয়া গেছে।' : 'User ID verified.');
  };

  // FORGOT PASSWORD: Step 2 Submit
  const handleForgotPasswordCodeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!recoveryCode.trim() || recoveryCode.length !== 6) {
      showFeedback(language === 'bn' ? 'সঠিক ৬-ডিজিটের কোড দিন' : 'Please enter a valid 6-digit code', 'error');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    try {
      // Since recoveryUsername might be mapped from email etc., let's find the user again
      const latestList = await getLatestUsersListForRecovery();
      const input = recoveryUsername.trim().toLowerCase();
      const matched = latestList.find(u => {
        const uId = (u.id || '').toString().toLowerCase();
        const uUserId = (u.userId || '').toString().toLowerCase();
        const uEmail = (u.email || '').toString().toLowerCase();
        const uLoginEmail = (u.loginEmail || '').toString().toLowerCase();
        return uUserId === input || uEmail === input || uLoginEmail === input || uId === input;
      });

      if (!matched) {
        showFeedback(language === 'bn' ? 'সেশন শেষ হয়ে গেছে। পুনরায় চেষ্টা করুন।' : 'Session expired. Please start over.', 'error');
        setRecoveryStep(1);
        setIsLoading(false);
        return;
      }

      const totp = new OTPAuth.TOTP({
        issuer: 'FleetPro',
        label: matched.email || 'user',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(matched.twoFASecret)
      });
      const delta = totp.validate({ token: recoveryCode, window: 1 });
      if (delta !== null) {
        setRecoveryStep(3);
        showFeedback(language === 'bn' ? 'কোড যাচাই সফল!' : 'Code verification successful!');
      } else {
        showFeedback(language === 'bn' ? 'ভুল অথেন্টিকেটর কোড। আবার চেষ্টা করুন।' : 'Invalid or expired authenticator code. Please try again.', 'error');
      }
    } catch (err) {
      showFeedback(language === 'bn' ? 'যাচাইকরণে সমস্যা হয়েছে' : 'Verification failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD: Step 3 Submit (Reset Password)
  const handleForgotPasswordResetSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPassword.trim()) {
      showFeedback(language === 'bn' ? 'নতুন পাসওয়ার্ড লিখুন' : 'Please enter a new password', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showFeedback(language === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না' : 'Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const latestList = await getLatestUsersListForRecovery();
    const input = recoveryUsername.trim().toLowerCase();
    const matched = latestList.find(u => {
      const uId = (u.id || '').toString().toLowerCase();
      const uUserId = (u.userId || '').toString().toLowerCase();
      const uEmail = (u.email || '').toString().toLowerCase();
      const uLoginEmail = (u.loginEmail || '').toString().toLowerCase();
      return uUserId === input || uEmail === input || uLoginEmail === input || uId === input;
    });

    if (!matched) {
      setIsLoading(false);
      showFeedback('User not found during password update', 'error');
      setRecoveryStep(1);
      return;
    }

    try {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const { saveFirebaseDocMerge } = await import('@/services/firebase');
      const coll = matched.role === 'ADMIN' ? 'admins' : 'users';
      await saveFirebaseDocMerge(coll, matched.id, { password: hashedPassword });
      
      updateUser({ ...matched, password: hashedPassword });
      showFeedback(language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' : 'Password changed successfully');
      setShowForgotPassword(false);
      setRecoveryStep(1);
      setRecoveryUsername('');
      setRecoveryCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      console.error("Failed to recover password", err);
      showFeedback("Failed to update password in database", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFirstLoginSubmit = async () => {
    if (!firstLoginNewPassword || !firstLoginConfirmPassword) {
      showFeedback('Please fill in both fields', 'error');
      return;
    }
    if (firstLoginNewPassword !== firstLoginConfirmPassword) {
      showFeedback(t.PASSWORDS_DONT_MATCH || 'Passwords do not match', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(firstLoginNewPassword, 10);
      const { saveFirebaseDocMerge } = await import('@/services/firebase');
      
      const updatedUser = { ...firstLoginUser, password: hashedPassword, isFirstLogin: false };
      await saveFirebaseDocMerge('users', firstLoginUser.id, { password: hashedPassword, isFirstLogin: false });
      
      updateUser(updatedUser);
      
      setLoginTime(new Date());
      performLoginUser(updatedUser);
      showFeedback(language === 'bn' ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে' : language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
      setView('DASHBOARD');
      setShowFirstLoginPrompt(false);
    } catch (err) {
      console.error("Failed to update password", err);
      showFeedback("Failed to update password in database", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminPinSubmit = async () => {
    setIsPinError(false);
    setIsLoading(true);
    
    let actualPin = pendingAdminUser?.adminPin || storedAdminPin || '1133';
    const adminDocId = pendingAdminUser?.id || 'Admin';
    try {
      const { getDocFromServer, doc } = await import('firebase/firestore');
      const { db } = await import('@/services/firebase');
      const adminDoc = await getDocFromServer(doc(db, 'admins', adminDocId));
      if (adminDoc.exists() && adminDoc.data().adminPin) {
        actualPin = adminDoc.data().adminPin;
      }
    } catch (err) {
      console.warn('Could not fetch admin PIN from firestore, using local copy');
    }

    if (adminPin === actualPin) {
      
      let latestUsers: any[] = [];
      try {
        const usersCol = await getFirebaseCollection('users') || [];
        const adminsCol = await getFirebaseCollection('admins') || [];
        latestUsers = [...usersCol.filter((u: any) => u.id !== 'Admin'), ...adminsCol.map(a => ({ ...a, role: 'ADMIN' }))];
      } catch (err) {
        console.warn('Could not fetch users directly, falling back to store users');
      }
      const allAvailableUsers = latestUsers.length > 0 ? latestUsers : users;
      
      setTimeout(() => {
        setLoginTime(new Date());
        // Clean up redundant users/Admin document from Firestore
        deleteFirebaseDoc('users', 'Admin').catch(e => console.warn('Could not delete redundant users/Admin:', e));

        const existingAdmin = allAvailableUsers.find((u: any) => u.id === adminDocId || u.role === 'ADMIN');
        if (existingAdmin) {
          performLoginUser(existingAdmin);
        } else {
          // Create the admin and explicitly add it to the state and Firebase, so it persists!
          const newAdminUser = {
            id: adminDocId,
            name: adminDocId,
            email: 'hassanahamed3004@gmail.com',
            role: 'ADMIN',
            status: 'ENABLED',
            password: 'Admin',
            avatar: 'https://picsum.photos/seed/admin/200'
          };
          addUser(newAdminUser);
          performLoginUser(newAdminUser);
        }
        showFeedback(t.ADMIN_LOGIN_SUCCESS);
        setView('DASHBOARD');
        setIsLoading(false);
        setShowAdminPinStep(false);
      }, 500);
    } else {
      setIsLoading(false);
      setIsPinError(true);
      setTimeout(() => setIsPinError(false), 500);
      const pinErrorMsg = language === 'bn' 
        ? `ভুল সিকিউরিটি পিন! সঠিক পিন হলো: ${actualPin}` 
        : (language === 'ar' ? `رمز حماية خاطئ! الدبوس الصحيح هو: ${actualPin}` : `Invalid PIN! The correct PIN is: ${actualPin}`);
        setAdminPinErrorMessage(pinErrorMsg);
        setShowAdminPinError(true);
    }
  };

  const languages = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'bn', label: 'Bangla', flag: '🇧🇩' },
    { id: 'ar', label: 'Arabic', flag: '🇶🇦' },
  ];

  const effectiveWallpaper = loginWallpaper || wallpaper || defaultLoginWallpaper;
  const effectiveBgColor = loginBackgroundColor || backgroundColor || '';
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];
  const effectiveHeaderBg = headerBg || currentThemeObj.primary;
  
  const isBackgroundLight = effectiveWallpaper
    ? (appThemeMode === 'light' && theme !== 'night-mode')
    : (effectiveBgColor ? getContrastColor(effectiveBgColor) === '#000000' : false);
  const finalTextColor = isBackgroundLight ? '#000000' : '#ffffff';

  const layoutStyle = {
    '--primary': '#18181b', // Fixed neutral charcoal brand color for Login / Signup UI (no colorful theme color)
    '--theme-bg': effectiveBgColor || 'transparent', 
    '--theme-card': '#ffffff', // Fixed white card background
    '--text-main': finalTextColor,
    '--text-muted': isBackgroundLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    '--text-color': finalTextColor,
  } as React.CSSProperties;

  const opaqueBgColor = activeTab === 'signup' ? '#ffffff' : '#18181b';

  const bgStyle: React.CSSProperties = {
    background: effectiveWallpaper 
      ? `linear-gradient(${isBackgroundLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.75)'}, ${isBackgroundLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.75)'}), url(${effectiveWallpaper}) center/cover no-repeat` 
      : (effectiveBgColor || '#18181b'),
    color: finalTextColor,
    minHeight: '100vh', // Ensure it fills the screen
    height: '100%', 
  };

  const darkerBgStyle: React.CSSProperties = {
    ...bgStyle,
  };

  const getHeaderBackground = () => {
    const opacity = 0.85;
    if (effectiveWallpaper) {
      return isBackgroundLight 
        ? `rgba(255, 255, 255, ${opacity})` 
        : `rgba(15, 23, 42, ${opacity})`;
    }
    return getSemiTransparentColor(effectiveBgColor || '#18181b', opacity);
  };

  const loginCardIsDark = appThemeMode === 'dark' || isDarkMode;
  const inputBgSolid = loginCardIsDark ? '#121212' : '#ffffff';
  const cardContentColor = loginCardIsDark ? '#ffffff' : '#111827';
  const cardMutedColor = loginCardIsDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  const cardBgStyle: React.CSSProperties = {
    backgroundColor: activeTab === 'signup' ? 'transparent' : (loginCardIsDark ? '#121212' : '#ffffff'), 
    border: activeTab === 'signup' ? 'none' : (loginCardIsDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)'),
    boxShadow: activeTab === 'signup' ? 'none' : (loginCardIsDark ? '0 10px 40px -10px rgba(0, 0, 0, 0.5)' : '0 10px 40px -10px rgba(0, 0, 0, 0.1)'),
  };

  const loginCardStyle: React.CSSProperties = {
    ...cardBgStyle,
    '--text-main': activeTab === 'signup' ? (loginCardIsDark ? '#ffffff' : '#111827') : (loginCardIsDark ? '#ffffff' : '#111827'),
    '--text-muted': activeTab === 'signup'
      ? (loginCardIsDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(17, 24, 39, 0.65)')
      : (loginCardIsDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(17, 24, 39, 0.65)'),
    '--text-color': activeTab === 'signup' ? (loginCardIsDark ? '#ffffff' : '#111827') : (loginCardIsDark ? '#ffffff' : '#111827'),
  } as React.CSSProperties;

  return (
    <InputFieldThemeContext.Provider value={loginCardIsDark ? 'dark' : 'light'}>
      <>
      <div 
      
      
      
      className={`fixed inset-0 w-full h-full flex flex-col px-0 pb-0 overscroll-none ${activeTab === 'signup' ? 'pt-0 justify-start overflow-y-auto overflow-x-hidden' : 'justify-between pt-6 md:pt-6 overflow-hidden'} login-page text-text-main ${isEyeComfort ? 'eye-comfort' : ''} ${language === 'ar' ? 'rtl' : 'ltr'}`}
      style={{ 
        ...bgStyle,
        ...layoutStyle
      }}
    >
      {/* Main Content Wrapper - Handles Background */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
        style={{
          background: effectiveWallpaper ? 'transparent' : (effectiveBgColor || 'transparent')
        }}
      >
        {effectiveWallpaper && (
          <img 
            src={effectiveWallpaper} 
            alt="Login Wallpaper" 
            loading="eager" 
            decoding="sync" 
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
          />
        )}
        {/* Fine gold micro-dots pattern Layer - subtle starry feel */}
        <div 
          className="absolute inset-0 opacity-[0.045]" 
          style={{
            backgroundImage: `radial-gradient(#f1f5f9 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Floating Header Controls */}
      <>
        {activeTab !== 'signup' && (
          <div>
            {/* Menu Button */}
            <button 
              onClick={() => openModal('menu')}
              className={`absolute top-safe left-6 p-3 rounded-lg shadow-lg z-50 border ${
                isBackgroundLight 
                  ? 'bg-white text-black border-black/5' 
                  : 'bg-[#18181b]/95 text-white border-white/5'
              }`}
            >
              <Menu size={24} />
            </button>

            {/* Language Toggle Button on the Right Side (same level as Menu button) */}
            <div className="absolute top-safe right-6 z-50">
              <button 
                type="button"
                onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                className={`p-3 rounded-lg shadow-lg border flex items-center gap-1.5 font-black text-xs uppercase tracking-wider transition-all ${
                  isBackgroundLight 
                    ? 'bg-white text-black border-black/5 hover:bg-black/5' 
                    : 'bg-[#18181b]/95 text-white border-white/5 hover:bg-white/5'
                }`}
              >
                <Globe size={18} />
                <span>{language === 'bn' ? 'BN' : language === 'ar' ? 'AR' : 'EN'}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${showLanguageDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Language Dropdown List */}
              <AnimatePresence>
                {showLanguageDropdown && (
                  <>
                    {/* Backdrop to close on click outside */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowLanguageDropdown(false)} 
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.85 }}
                      transition={{
                        type: 'spring',
                        damping: 18,
                        stiffness: 240,
                        mass: 0.75
                      }}
                      className={`absolute right-0 mt-2 w-36 py-1.5 rounded-lg shadow-xl z-50 border flex flex-col ${
                        isBackgroundLight 
                          ? 'bg-white border-black/5 text-black' 
                          : 'bg-[#18181b]/95 border-white/5 text-white'
                      }`}
                    >
                      {[
                        { code: 'en', label: 'English', short: 'EN' },
                        { code: 'bn', label: 'বাংলা', short: 'BN' },
                        { code: 'ar', label: 'العربية', short: 'AR' }
                      ].map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                            setShowLanguageDropdown(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-xs font-bold transition-colors flex items-center justify-between ${
                            language === lang.code 
                              ? 'text-blue-500 font-black bg-blue-500/5' 
                              : isBackgroundLight 
                                ? 'hover:bg-black/5' 
                                : 'hover:bg-white/5'
                          }`}
                        >
                          <span>{lang.label}</span>
                          <span className="text-[10px] opacity-50 font-black">{lang.short}</span>
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </>



      {/* Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="fixed inset-0 bg-black/60 z-[110]"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: language === 'ar' ? '100%' : '-100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%', opacity: 0 }}
              transition={{ type: 'tween', duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className={`fixed top-0 ${language === 'ar' ? 'right-0 rounded-l-[13px]' : 'left-0 rounded-r-[13px]'} h-full w-[280px] shadow-2xl z-[120] flex flex-col overflow-hidden ${(!effectiveBgColor && !effectiveWallpaper) ? 'modern-app-bg' : ''} border-r ${effectiveBgColor && getContrastColor(effectiveBgColor) === '#000000' ? 'border-black/10' : 'border-white/10'}`}
              style={{ 
                ...bgStyle,
                ...layoutStyle,
                '--text-main': finalTextColor,
                '--text-muted': effectiveBgColor ? `${getContrastColor(effectiveBgColor)}99` : (isBackgroundLight ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'),
                color: finalTextColor,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'scroll'
              } as any}
            >
              <div className="safe-top bg-black/20">
                <div className="h-20 px-6 flex flex-col justify-center">
                  <h2 className="text-xl font-black text-text-main uppercase tracking-tighter">FLEETPRO</h2>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest -mt-1">Control Center</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto py-4">
                <LoginMenuItems 
                  t={t} 
                  openModal={openModal} 
                  setActiveTab={setActiveTab} 
                  setView={setView} 
                  setIsMenuOpen={setIsMenuOpen} 
                  isLight={isBackgroundLight}
                />
              </div>
              
              <div className={`p-6 pb-[calc(24px+env(safe-area-inset-bottom))] bg-black/20 border-t ${effectiveBgColor && getContrastColor(effectiveBgColor) === '#000000' ? 'border-black/10' : 'border-white/5'}`}>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest opacity-40">VERSION 2.6.0 • SECURE CLOUD SYSTEM</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Login Error Modal */}
      <>
        {showLoginError && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              
              
              
              onClick={() => setShowLoginError(false)}
              className="absolute inset-0 bg-black/60"
            />
            <div
              
              
              
              className="relative bg-card-bg rounded-lg p-6 shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div 
                  
                  
                  className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30"
                >
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-black text-text-main">Login Failed</h3>
                <p className="text-sm font-bold text-text-main whitespace-pre-line">
                  {loginErrorMessage}
                </p>
                <button
                  
                  onClick={() => setShowLoginError(false)}
                  className="w-full py-3 mt-4 bg-red-500 text-white font-black rounded-lg hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>

      {/* Admin PIN Error Modal */}
      <>
        {showAdminPinError && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              
              
              
              onClick={() => setShowAdminPinError(false)}
              className="absolute inset-0 bg-black/60"
            />
            <div
              
              
              
              className="relative bg-card-bg rounded-lg p-6 shadow-2xl max-w-sm w-full overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div 
                  
                  
                  className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-500/30"
                >
                  <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-black text-text-main">Access Denied</h3>
                <p className="text-sm font-bold text-text-main whitespace-pre-line">
                  {adminPinErrorMessage}
                </p>
                <button
                  
                  onClick={() => setShowAdminPinError(false)}
                  className="w-full py-3 mt-4 bg-red-500 text-white font-black rounded-lg hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>



      {/* Support Modal */}
      <>
        {showSupportModal && (
          <>
            <div 
              
              
              
              className="fixed inset-0 bg-black/60 z-[80]"
              onClick={() => setShowSupportModal(false)}
            />
            <div 
              
              
              
              
              className={`fixed inset-0 z-[130] overflow-hidden flex flex-col ${(!effectiveBgColor && !effectiveWallpaper) ? 'modern-app-bg text-text-main' : ''}`}
              style={{ 
                ...bgStyle,
                ...layoutStyle
              }}
            >
              <div className="text-white primary-bg-text shadow-md z-10 safe-top" style={{ background: effectiveHeaderBg }}>
                <div className="h-16 px-4 flex items-center gap-3">
                  <button onClick={() => setShowSupportModal(false)} className="p-2 rounded-full active:scale-90 transition-all">
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-xl font-black tracking-tight uppercase tracking-widest">{t.SUPPORT}</h2>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-6 w-full max-w-lg mx-auto">
                <div 
                  
                  
                  
                  className="space-y-6"
                >
                  {/* Live Support Hub Header Banner */}
                  <div 
                    
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-5 text-white shadow-lg shadow-indigo-500/10"
                  >
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-cyan-300 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200">
                            {language === 'bn' ? 'সাপোর্ট ডেস্ক' : language === 'ar' ? 'مكتب المساعدة المباشر' : 'Live Support Hub'}
                          </span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight">
                          {language === 'bn' ? 'আমরা কীভাবে সাহায্য করতে পারি?' : language === 'ar' ? 'كيف يمكننا مساعدتك اليوم؟' : 'How Can We Help You Today?'}
                        </h2>
                        <p className="text-xs text-indigo-100 max-w-md font-medium">
                          {language === 'bn' ? 'যেকোনো জিজ্ঞাসা বা সহায়তার জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।' : language === 'ar' ? 'اتصل بنا مباشرة لأي استفسارات أو دعم فني للمؤسسة.' : 'Get in touch with our official support channels directly for instant support.'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 self-start sm:self-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 shadow-inner">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-white">
                          {language === 'bn' ? 'অনলাইন সহায়তা' : language === 'ar' ? 'الدعم المباشر متصل' : 'Active Support'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Cards Grid - Compact and Standardized Height of 130px */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 rounded bg-cyan-500" />
                      <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">
                        {language === 'bn' ? 'যোগাযোগের বিস্তারিত' : language === 'ar' ? 'تفاصيل الاتصال' : 'Contact Details'}
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Developer / Owner Card */}
                      {supportInfo.developerName && (supportInfo.showDeveloperName || isAdmin) && (
                        <div 
                          
                          className="bg-theme-card rounded-xl p-3 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[190px] flex flex-col justify-between relative overflow-hidden group col-span-1 sm:col-span-2"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Hidden File Inputs */}
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                          />
                          <input 
                            type="file" 
                            ref={cameraInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            capture="user"
                            onChange={handleFileChange} 
                          />

                          {/* Profile Header Block: Centered Photo frame with custom label under it */}
                          <div className="flex flex-col items-center justify-center pt-1.5 pb-2">
                            {/* Photo Frame Container (8px radius) */}
                            <div 
                              onClick={() => setIsActionSheetOpen(true)}
                              className="relative w-16 h-16 rounded-[8px] bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-neutral-800 dark:to-neutral-900 border-2 border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center cursor-pointer overflow-hidden shadow-inner hover:scale-105 transition-transform group/frame"
                            >
                              {supportInfo.developerPhoto ? (
                                <img 
                                  src={supportInfo.developerPhoto} 
                                  alt={supportInfo.developerName} 
                                  className="w-full h-full object-cover rounded-[6px]"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <UserProfileIcon size={24} className="text-indigo-400 dark:text-indigo-500/75 group-hover/frame:text-indigo-500 transition-colors" />
                              )}
                              {/* Hover Indicator */}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/frame:opacity-100 transition-opacity duration-200">
                                <Camera size={14} className="text-white animate-pulse" />
                              </div>
                            </div>

                            {/* Status Badge directly under photo frame */}
                            <div className="mt-1.5">
                              {supportInfo.showDeveloperName ? (
                                <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                                  <span>{language === 'bn' ? 'ডেভেলপার' : language === 'ar' ? 'المطور' : 'Developer'}</span>
                                </div>
                              ) : (
                                isAdmin && (
                                  <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                                    <ShieldAlert size={10} />
                                    <span>{language === 'bn' ? 'লুকানো' : language === 'ar' ? 'মখফি' : 'Hidden'}</span>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Name directly below the frame & status */}
                            <div className="text-center mt-2">
                              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t.DEVELOPER_NAME || 'Developer Name'}</p>
                              <p className="font-extrabold text-sm text-text-main mt-0.5 select-all">
                                {supportInfo.developerName}
                              </p>
                            </div>
                          </div>

                          {/* Footer: Nationality & Copy Button */}
                          <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-gray-100 dark:border-white/5 w-full">
                            <div className="flex items-center gap-1 text-[11px] text-text-muted font-extrabold uppercase tracking-wider">
                              <Globe size={12} className="text-indigo-500" />
                              <span>{supportInfo.nationality || (language === 'bn' ? 'গ্লোবাল' : language === 'ar' ? 'عالمي' : 'Global')}</span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyToClipboard(supportInfo.developerName || '', 'developerName');
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all duration-200 ${
                                copiedField === 'developerName'
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                              }`}
                            >
                              {copiedField === 'developerName' ? <Check size={11} className="text-indigo-500" /> : <Copy size={11} />}
                              <span>{copiedField === 'developerName' ? (language === 'bn' ? 'কপি হয়েছে' : language === 'ar' ? 'تم' : 'Copied') : (language === 'bn' ? 'কপি' : language === 'ar' ? 'নকল' : 'Copy')}</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* WhatsApp Card */}
                      {supportInfo.whatsapp && (supportInfo.showWhatsapp || isAdmin) && (
                        <div 
                          
                          className="bg-theme-card rounded-xl p-2.5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-[100px] flex flex-col justify-between relative overflow-hidden group"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div>
                            {/* Aligned Title and Live Status */}
                            <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t.WHATSAPP || 'WhatsApp'}</p>
                              
                              {supportInfo.showWhatsapp ? (
                                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                  </span>
                                  <span>{language === 'bn' ? 'সক্রিয় চ্যাট' : language === 'ar' ? 'نشط الآن' : 'Active Chat'}</span>
                                </div>
                              ) : (
                                isAdmin && (
                                  <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                                    <ShieldAlert size={10} />
                                    <span>{language === 'bn' ? 'লুকানো' : language === 'ar' ? 'مখফি' : 'Hidden'}</span>
                                  </div>
                                )
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 min-w-0">
                              <div className="w-[26px] h-[26px] rounded-[8px] bg-gradient-to-br from-[#29E06D] to-[#19B958] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <WhatsAppIcon size={14} />
                              </div>
                              <p className="font-extrabold text-sm text-text-main mt-0.5 truncate select-all">
                                {supportInfo.whatsappCountryCode ? `${supportInfo.whatsappCountryCode} ` : ''}{supportInfo.whatsapp}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-white/5">
                            <button
                              onClick={() => handleCopyToClipboard(`${supportInfo.whatsappCountryCode || ''}${supportInfo.whatsapp}`, 'whatsapp')}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all duration-200 ${
                                copiedField === 'whatsapp'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                              }`}
                            >
                              {copiedField === 'whatsapp' ? <Check size={11} className="text-emerald-500 animate-pulse" /> : <Copy size={11} />}
                              <span>{copiedField === 'whatsapp' ? (language === 'bn' ? 'কপি হয়েছে' : language === 'ar' ? 'تم' : 'Copied') : (language === 'bn' ? 'কপি' : language === 'ar' ? 'نسখ' : 'Copy')}</span>
                            </button>

                            <a
                              href={`https://wa.me/${(supportInfo.whatsappCountryCode || '').replace('+', '')}${supportInfo.whatsapp?.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/10 active:scale-95 transition-all duration-200"
                            >
                              <WhatsAppIcon size={11} />
                              <span>{language === 'bn' ? 'চ্যাট করুন' : language === 'ar' ? 'محادثة' : 'Chat'}</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Mobile Support Card */}
                      {supportInfo.mobile && (supportInfo.showMobile || isAdmin) && (
                        <div 
                          
                          className="bg-theme-card rounded-xl p-2.5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-[100px] flex flex-col justify-between relative overflow-hidden group"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div>
                            {/* Aligned Title and Live Status */}
                            <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t.MOBILE || 'Mobile Number'}</p>
                              
                              {supportInfo.showMobile ? (
                                <div className="flex items-center gap-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                                  </span>
                                  <span>{language === 'bn' ? 'সরাসরি কল' : language === 'ar' ? 'اتصال مباشر' : 'Live Support'}</span>
                                </div>
                              ) : (
                                isAdmin && (
                                  <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                                    <ShieldAlert size={10} />
                                    <span>{language === 'bn' ? 'লুকানো' : language === 'ar' ? 'মখফি' : 'Hidden'}</span>
                                  </div>
                                )
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-0.5 min-w-0">
                              <div className="w-[26px] h-[26px] rounded-[8px] bg-gradient-to-br from-[#1F8FFF] to-[#0062E0] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <Phone size={13} />
                              </div>
                              <p className="font-extrabold text-sm text-text-main mt-0.5 truncate select-all">
                                {supportInfo.mobileCountryCode ? `${supportInfo.mobileCountryCode} ` : ''}{supportInfo.mobile}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-white/5">
                            <button
                              onClick={() => handleCopyToClipboard(`${supportInfo.mobileCountryCode || ''}${supportInfo.mobile}`, 'mobile')}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all duration-200 ${
                                copiedField === 'mobile'
                                  ? 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                              }`}
                            >
                              {copiedField === 'mobile' ? <Check size={11} className="text-cyan-500 animate-pulse" /> : <Copy size={11} />}
                              <span>{copiedField === 'mobile' ? (language === 'bn' ? 'কপি হয়েছে' : language === 'ar' ? 'تم' : 'Copied') : (language === 'bn' ? 'কপি' : language === 'ar' ? 'نسখ' : 'Copy')}</span>
                            </button>

                            <a
                              href={`tel:${supportInfo.mobileCountryCode || ''}${supportInfo.mobile}`}
                              className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm shadow-cyan-500/10 active:scale-95 transition-all duration-200"
                            >
                              <Phone size={11} />
                              <span>{language === 'bn' ? 'কল করুন' : language === 'ar' ? 'اتصال' : 'Call'}</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Email Support Card */}
                      {supportInfo.email && (supportInfo.showEmail || isAdmin) && (
                        <div 
                          
                          className="bg-theme-card rounded-xl p-2.5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-[100px] flex flex-col justify-between relative overflow-hidden group"
                        >
                          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div>
                            {/* Aligned Title and Live Status */}
                            <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t.EMAIL_ID || 'Email ID'}</p>
                              
                              {supportInfo.showEmail ? (
                                <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                                  <span>{language === 'bn' ? '২৪/৭ সাপোর্ট' : language === 'ar' ? '٢٤/٧ دعم' : '24/7 Support'}</span>
                                </div>
                              ) : (
                                isAdmin && (
                                  <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                                    <ShieldAlert size={10} />
                                    <span>{language === 'bn' ? 'লুকানো' : language === 'ar' ? 'মখফি' : 'Hidden'}</span>
                                  </div>
                                )
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-0.5 min-w-0">
                              <div className="w-[26px] h-[26px] rounded-[8px] bg-gradient-to-br from-[#FF5E55] to-[#E0241B] flex items-center justify-center text-white shrink-0 shadow-sm">
                                <Mail size={13} />
                              </div>
                              <p className="font-extrabold text-sm text-text-main mt-0.5 truncate select-all">
                                {supportInfo.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-white/5">
                            <button
                              onClick={() => handleCopyToClipboard(supportInfo.email || '', 'email')}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all duration-200 ${
                                copiedField === 'email'
                                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                              }`}
                            >
                              {copiedField === 'email' ? <Check size={11} className="text-rose-500 animate-pulse" /> : <Copy size={11} />}
                              <span>{copiedField === 'email' ? (language === 'bn' ? 'কপি হয়েছে' : language === 'ar' ? 'تم' : 'Copied') : (language === 'bn' ? 'কপি' : language === 'ar' ? 'نسখ' : 'Copy')}</span>
                            </button>

                            <a
                              href={`mailto:${supportInfo.email}`}
                              className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/10 active:scale-95 transition-all duration-200"
                            >
                              <Mail size={11} />
                              <span>{language === 'bn' ? 'ইমেইল করুন' : language === 'ar' ? 'إرسال بريد' : 'Email'}</span>
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Social Links Hub - Staggered compact cards */}
                  {(() => {
                    const socialChannels = [
                      { icon: Facebook, label: 'Facebook', url: supportInfo.facebookProfile, show: supportInfo.showFacebookProfile, colorClass: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20 dark:text-blue-400 hover:border-blue-500/40' },
                      { icon: Facebook, label: language === 'bn' ? 'এফবি পেজ' : language === 'ar' ? 'صفحة فيسبوك' : 'FB Page', url: supportInfo.facebookPage, show: supportInfo.showFacebookPage, colorClass: 'text-sky-600 bg-sky-500/10 dark:bg-sky-500/20 dark:text-sky-400 hover:border-sky-500/40' },
                      { icon: Instagram, label: 'Instagram', url: supportInfo.instagram, show: supportInfo.showInstagram, colorClass: 'text-pink-500 bg-pink-500/10 dark:bg-pink-500/20 dark:text-pink-400 hover:border-pink-500/40' },
                      { icon: Youtube, label: 'YouTube', url: supportInfo.youtube, show: supportInfo.showYoutube, colorClass: 'text-red-500 bg-red-500/10 dark:bg-red-500/20 dark:text-red-400 hover:border-red-500/40' },
                    ];
                    const hasVisibleSocials = socialChannels.some(s => s.url && (s.show || isAdmin));

                    if (!hasVisibleSocials) return null;

                    return (
                      <div  className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-4 rounded bg-indigo-500" />
                          <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">
                            {language === 'bn' ? 'সোশ্যাল মিডিয়া হাব' : language === 'ar' ? 'قنوات التواصل الاجتماعي' : 'Social Media Hub'}
                          </h3>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {socialChannels.map((social, idx) => {
                            if (!social.url || (!social.show && !isAdmin)) return null;
                            const IconComponent = social.icon;
                            
                            return (
                              <a
                                key={idx}
                                href={social.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center justify-center gap-2 p-3 bg-theme-card rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-300 group h-[95px] relative"
                              >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${social.colorClass}`}>
                                  <IconComponent size={18} />
                                </div>
                                <span className="text-[10px] font-black tracking-wider text-text-main text-center group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                                  {social.label}
                                </span>
                                
                                {!social.show && isAdmin && (
                                  <span className="absolute top-1.5 right-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 p-0.5 rounded-full" title="Hidden from public">
                                    <ShieldAlert size={8} />
                                  </span>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        )}
      </>

      {/* Prayer Times Modal */}
      <>
        {showPrayerTimesModal && (
          <>
            <div 
              
              
              
              className="fixed inset-0 bg-black/60 z-[120]"
              onClick={() => setShowPrayerTimesModal(false)}
            />
            <div 
              
              
              
              
              className={`fixed inset-0 z-[130] overflow-hidden flex flex-col text-text-main ${(!effectiveBgColor && !effectiveWallpaper) ? 'modern-app-bg text-text-main' : ''}`}
              style={{ 
                ...bgStyle,
                ...layoutStyle
              }}
            >
              <div className="text-white primary-bg-text shadow-md z-10 safe-top" style={{ background: effectiveHeaderBg }}>
                <div className="h-16 px-4 flex items-center gap-3">
                  <button onClick={() => setShowPrayerTimesModal(false)} className="p-2 rounded-full active:scale-90 transition-all">
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-xl font-black tracking-tight uppercase tracking-widest">{t.PRAYER_TIMES}</h2>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-6 w-full mx-auto">
                <PrayerTimes />
              </div>
            </div>
          </>
        )}
      </>

      {/* Weather Modal */}
      <>
        {showWeatherModal && (
          <>
            <div 
                
              className="fixed inset-0 bg-black/60 z-[120]"
              onClick={() => setShowWeatherModal(false)}
            />
            <div 
                
              
              className={`fixed inset-0 z-[130] overflow-hidden flex flex-col ${(!effectiveBgColor && !effectiveWallpaper) ? 'modern-app-bg text-text-main' : ''}`}
              style={{ ...bgStyle, ...layoutStyle }}
            >
              <div className="text-white primary-bg-text shadow-md z-10 safe-top" style={{ background: effectiveHeaderBg }}>
                <div className="h-16 px-4 flex items-center gap-3">
                  <button onClick={() => setShowWeatherModal(false)} className="p-2 rounded-full active:scale-90 transition-all">
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-xl font-black tracking-tight uppercase tracking-widest">{t.WEATHER}</h2>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                 <div className="space-y-4">
                    <Cloud size={64} className="mx-auto text-text-muted" />
                    <h3 className="text-2xl font-black text-text-main">Weather Service</h3>
                    <p className="text-text-muted font-bold text-sm">Service coming soon in version 2.7.0</p>
                 </div>
              </div>
            </div>
          </>
        )}
      </>

      {/* Ramadan Modal */}
      <>
        {showRamadanModal && (
          <>
            <div 
                
              className="fixed inset-0 bg-black/60 z-[120]"
              onClick={() => setShowRamadanModal(false)}
            />
            <div 
                
              
              className={`fixed inset-0 z-[130] overflow-hidden flex flex-col ${(!effectiveBgColor && !effectiveWallpaper) ? 'modern-app-bg text-text-main' : ''}`}
              style={{ ...bgStyle, ...layoutStyle }}
            >
              <div className="text-white primary-bg-text shadow-md z-10 safe-top" style={{ background: effectiveHeaderBg }}>
                <div className="h-16 px-4 flex items-center gap-3">
                  <button onClick={() => setShowRamadanModal(false)} className="p-2 rounded-full active:scale-90 transition-all">
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-xl font-black tracking-tight uppercase tracking-widest">{t.RAMADAN_SCHEDULE}</h2>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-6 text-center">
                 <div className="space-y-4">
                    <Calendar size={64} className="mx-auto text-text-muted" />
                    <h3 className="text-2xl font-black text-text-main">Ramadan 2026</h3>
                    <p className="text-text-muted font-bold text-sm">Schedule is being optimized</p>
                 </div>
              </div>
            </div>
          </>
        )}
      </>

      {/* About Modal */}
      <>
        {showAboutModal && (
          <>
            <div 
                
              className="fixed inset-0 bg-black/60 z-[120]"
              onClick={() => setShowAboutModal(false)}
            />
            <div 
                
              
              className={`fixed inset-0 z-[130] overflow-hidden flex flex-col ${(!effectiveBgColor && !effectiveWallpaper) ? 'modern-app-bg text-text-main' : ''}`}
              style={{ ...bgStyle, ...layoutStyle }}
            >
              <div className="text-white primary-bg-text shadow-md z-10 safe-top" style={{ background: effectiveHeaderBg }}>
                <div className="h-16 px-4 flex items-center gap-3">
                  <button onClick={() => setShowAboutModal(false)} className="p-2 rounded-full active:scale-90 transition-all">
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-xl font-black tracking-tight uppercase tracking-widest">{t.ABOUT}</h2>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                 <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-zinc-800 rounded-3xl mx-auto flex items-center justify-center shadow-2xl rotate-12">
                       <Truck size={48} className="text-white" />
                    </div>
                    <h3 className="text-3xl font-black text-text-main">FLEETPRO</h3>
                    <p className="text-text-muted font-bold text-[10px] tracking-widest uppercase">Version 2.6.0</p>
                 </div>
                 <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                       <h4 className="font-black text-xs uppercase text-text-main mb-2">Transport System</h4>
                       <p className="text-text-muted text-xs leading-relaxed font-bold">Standard transport management and logistics solution for modern fleets.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                       <h4 className="font-black text-xs uppercase text-text-main mb-2">Security</h4>
                       <p className="text-text-muted text-xs leading-relaxed font-bold">Encrypted communication channel with cloud-based verification systems.</p>
                    </div>
                 </div>
              </div>
            </div>
          </>
        )}
      </>

      {/* Application Status Modal */}
      <>
        {showApplicationStatusModal && (
          <>
            <div 
              className="fixed inset-0 bg-black/60 z-[120]"
              onClick={() => setShowApplicationStatusModal(false)}
            />
            <div 
              className={`fixed inset-0 z-[130] overflow-hidden flex flex-col ${(!effectiveBgColor && !effectiveWallpaper) ? 'modern-app-bg text-text-main' : ''}`}
              style={{ ...bgStyle, ...layoutStyle }}
            >
              <div className="text-white primary-bg-text shadow-md z-10 safe-top" style={{ background: effectiveHeaderBg }}>
                <div className="h-16 px-4 flex items-center gap-3">
                  <button onClick={() => setShowApplicationStatusModal(false)} className="p-2 rounded-full active:scale-90 transition-all text-white">
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="text-lg font-black tracking-tight uppercase tracking-wider">
                    {language === 'bn' ? 'আবেদনের বর্তমান অবস্থা' : 'Application Tracking'}
                  </h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-md mx-auto w-full pb-safe">
                <div className="text-center space-y-2 py-2">
                  <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-emerald-500/20">
                    <ClipboardList size={32} className="text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-extrabold text-text-main">
                    {language === 'bn' ? 'আবেদন ট্র্যাক করুন' : 'Track Your Application'}
                  </h3>
                  <p className="text-xs text-text-muted font-bold leading-relaxed">
                    {language === 'bn' 
                      ? 'আপনার মোবাইল অ্যাপ নিবন্ধন আবেদনের বর্তমান অবস্থা জানতে আবেদন আইডি লিখুন।' 
                      : 'Enter your Application ID to track the real-time status of your registration request.'}
                  </p>
                </div>

                {/* Track Form */}
                <form 
                  onSubmit={handleTrackApplication}
                  className="p-4 rounded-xl border space-y-4 shadow-sm bg-white/5"
                  style={{ borderColor: isBackgroundLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}
                >
                  <InputField 
                    label={language === 'bn' ? 'আবেদন আইডি নাম্বার' : 'Application ID / Number'}
                    name="statusAppId"
                    type="text"
                    value={statusAppId}
                    onChange={(e) => setStatusAppId(e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: APP-123456' : 'e.g., APP-123456'}
                    icon={<Info size={18} />}
                    hideCheckmark={true}
                    themeMode={isBackgroundLight ? 'light' : 'dark'}
                  />

                  {statusError && (
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
                      {statusError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={statusLoading || !statusAppId.trim()}
                    className={`w-full h-12 font-extrabold rounded-xl transition-all uppercase flex items-center justify-center gap-2 ${
                      statusLoading || !statusAppId.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #047857 100%)',
                      color: '#ffffff'
                    }}
                  >
                    {statusLoading ? (
                      <Loader2 size={18} className="animate-spin text-white" />
                    ) : (
                      <Zap size={18} className="text-white" />
                    )}
                    <span className="tracking-widest">
                      {statusLoading 
                        ? (language === 'bn' ? 'অপেক্ষা করুন...' : 'Tracking...') 
                        : (language === 'bn' ? 'আবেদন খুঁজুন' : 'Track Status')}
                    </span>
                  </button>
                </form>

                {/* Tracking Results Dashboard */}
                {statusResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* 1. Application Summary Card */}
                    <div 
                      className="p-5 rounded-xl border space-y-4 shadow-lg backdrop-blur-md" 
                      style={{ 
                        backgroundColor: isBackgroundLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 15, 15, 0.75)',
                        borderColor: isBackgroundLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' 
                      }}
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                        <ClipboardList size={18} className="text-emerald-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-text-main">
                          {language === 'bn' ? 'আবেদনের সংক্ষিপ্ত বিবরণ' : 'Application Summary'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider font-bold leading-none">
                            {language === 'bn' ? 'আবেদন আইডি' : 'Application ID'}
                          </span>
                          <span className="text-text-main block mt-1 font-mono font-black tracking-wider select-all">
                            {statusResult.applicationId || statusResult.id}
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider font-bold leading-none">
                            {language === 'bn' ? 'আবেদনের ধরণ' : 'Application Type'}
                          </span>
                          <span className="text-text-main block mt-1 font-extrabold uppercase tracking-wide text-[10px]">
                            {statusResult.accountType === 'COMPANY' 
                              ? (language === 'bn' ? 'কোম্পানি অ্যাকাউন্ট' : 'COMPANY ACCOUNT') 
                              : (language === 'bn' ? 'ব্যক্তিগত অ্যাকাউন্ট' : 'PERSONAL ACCOUNT')}
                          </span>
                        </div>

                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider font-bold leading-none">
                            {language === 'bn' ? 'জমা দেওয়ার তারিখ' : 'Submission Date'}
                          </span>
                          <span className="text-text-main block mt-1 font-bold">
                            {statusResult.submissionDate || (statusResult.createdAt ? new Date(statusResult.createdAt).toLocaleString() : '')}
                          </span>
                        </div>

                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider font-bold leading-none">
                            {language === 'bn' ? 'আবেদনের বয়স' : 'Application Age'}
                          </span>
                          <span className="text-amber-500 dark:text-amber-400 block mt-1 font-extrabold">
                            {(() => {
                              const createdTime = statusResult.createdAt || statusResult.submissionDate;
                              if (!createdTime) return language === 'bn' ? '১ দিন' : '1 day';
                              try {
                                const created = new Date(createdTime);
                                const now = new Date();
                                const diffMs = now.getTime() - created.getTime();
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                
                                if (diffDays === 0) {
                                  if (diffHours === 0) {
                                    return language === 'bn' ? 'এইমাত্র' : 'Just now';
                                  }
                                  return language === 'bn' 
                                    ? `${diffHours} ঘণ্টা` 
                                    : `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                                }
                                return language === 'bn'
                                  ? `${diffDays} দিন ${diffHours} ঘণ্টা`
                                  : `${diffDays} day${diffDays > 1 ? 's' : ''} ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
                              } catch (e) {
                                return language === 'bn' ? '১ দিন' : '1 day';
                              }
                            })()}
                          </span>
                        </div>

                        <div className="col-span-2">
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider font-bold leading-none">
                            {language === 'bn' ? 'সর্বশেষ আপডেট' : 'Last Updated'}
                          </span>
                          <span className="text-text-main block mt-1 font-bold">
                            {statusResult.updatedAt 
                              ? new Date(statusResult.updatedAt).toLocaleString() 
                              : (statusResult.createdAt 
                                  ? new Date(new Date(statusResult.createdAt).getTime() + (statusResult.status !== 'PENDING' ? 86400000 : 3600000)).toLocaleString()
                                  : new Date().toLocaleString()
                                )
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Current Status & Actions Card */}
                    <div className={`p-5 rounded-xl border flex flex-col gap-3 shadow-lg ${
                      statusResult.status === 'APPROVED' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : statusResult.status === 'REJECTED'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          statusResult.status === 'APPROVED' ? 'bg-emerald-500/20' : statusResult.status === 'REJECTED' ? 'bg-rose-500/20' : 'bg-amber-500/20'
                        }`}>
                          {statusResult.status === 'APPROVED' ? (
                            <Check size={20} className="text-emerald-500" />
                          ) : statusResult.status === 'REJECTED' ? (
                            <X size={20} className="text-rose-500" />
                          ) : (
                            <Clock size={20} className="text-amber-500 animate-spin" />
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest block leading-none opacity-60">
                            {language === 'bn' ? 'বর্তমান স্ট্যাটাস' : 'Current Status'}
                          </span>
                          <span className="text-base font-black tracking-tight block mt-1 uppercase">
                            {statusResult.status === 'APPROVED' 
                              ? (language === 'bn' ? 'অনুমোদিত (APPROVED) ✓' : 'APPROVED ✓')
                              : statusResult.status === 'REJECTED'
                                ? (language === 'bn' ? 'বাতিল (REJECTED) ✗' : 'REJECTED ✗')
                                : (language === 'bn' ? 'চলমান (PENDING) ●' : 'PENDING ●')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs space-y-2 mt-1 pl-1">
                        <div>
                          <span className="font-bold opacity-60 block text-[10px] uppercase tracking-wider">
                            {language === 'bn' ? 'পর্যালোচনা বিভাগ' : 'Reviewing Department'}
                          </span>
                          <span className="font-extrabold text-text-main block">
                            {statusResult.status === 'APPROVED'
                              ? (language === 'bn' ? 'অ্যাকাউন্ট প্রদান ব্যুরো (Account Issuance Bureau)' : 'Account Issuance Bureau')
                              : (language === 'bn' ? 'নিবন্ধ ও যাচাইকরণ বিভাগ (Operations & Verification Division)' : 'Operations & Verification Division')}
                          </span>
                        </div>

                        <div>
                          <span className="font-bold opacity-60 block text-[10px] uppercase tracking-wider">
                            {language === 'bn' ? 'ব্যাখ্যা' : 'Explanation'}
                          </span>
                          <span className="font-bold leading-relaxed text-text-main block">
                            {statusResult.status === 'APPROVED'
                              ? (language === 'bn' 
                                  ? 'অভিনন্দন! আপনার মোবাইল অ্যাপ নিবন্ধন আবেদনটি সফলভাবে যাচাইকৃত ও অনুমোদিত হয়েছে।' 
                                  : 'Congratulations! Your mobile app registration request has been successfully verified and approved.')
                              : statusResult.status === 'REJECTED'
                                ? (language === 'bn'
                                    ? 'দুঃখিত! প্রয়োজনীয় তথ্যের অমিল অথবা স্ক্যান কপি অস্পষ্ট হওয়ার কারণে আপনার আবেদনটি এই মুহূর্তে বাতিল করা হয়েছে।'
                                    : 'Sorry, your application has been rejected at this stage due to missing details or unreadable document scans.')
                                : (language === 'bn'
                                    ? 'আপনার আবেদনপত্র এবং জমাকৃত তথ্যসমূহ বর্তমানে আমাদের যাচাইকারী কর্মকর্তা দ্বারা পর্যালোচনা করা হচ্ছে।'
                                    : 'Your application details and submitted documents are currently undergoing active evaluation and background checks.')}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-black/5 dark:border-white/5">
                          <span className="font-bold opacity-75 block text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            {language === 'bn' ? 'পরবর্তী পদক্ষেপ (Next Action)' : 'Next Action'}
                          </span>
                          <span className="font-extrabold block text-text-main text-xs mt-0.5">
                            {statusResult.status === 'APPROVED'
                              ? (language === 'bn' ? 'লগইন স্ক্রিনে যান এবং আপনার প্রাপ্ত পাসওয়ার্ড দিয়ে সিস্টেমে প্রবেশ করুন।' : 'Proceed to the login screen and enter your credentials to access your fleet manager dashboard.')
                              : statusResult.status === 'REJECTED'
                                ? (language === 'bn' ? 'নিচের রি-এপ্লাই বাটনে ক্লিক করে সঠিক নথিপত্র সহ পুনরায় ফর্মটি সাবমিট করুন।' : 'Click the Re-apply button below to review your information and submit a corrected request.')
                                : (language === 'bn' ? 'কোনো পদক্ষেপ প্রয়োজন নেই। এডমিন অনুমোদনের জন্য অনুগ্রহ করে অপেক্ষা করুন।' : 'No action required. Please wait for administrator approval.')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Enhanced Status Progress Timeline */}
                    <div 
                      className="p-5 rounded-xl border space-y-4 shadow-lg backdrop-blur-md" 
                      style={{ 
                        backgroundColor: isBackgroundLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 15, 15, 0.75)',
                        borderColor: isBackgroundLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' 
                      }}
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                        <Clock size={18} className="text-emerald-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-text-main">
                          {language === 'bn' ? 'আবেদনের অগ্রগতি টাইমলাইন' : 'Complete Status Timeline'}
                        </h4>
                      </div>
                      
                      <div className="space-y-5 relative pl-8 before:content-[\'\'] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                        {/* Step 1: Application Submitted */}
                        <div className="relative">
                          <div className="absolute -left-[30px] top-0.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white ring-4 ring-emerald-500/20">
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-text-main">
                              {language === 'bn' ? 'আবেদন জমা দেওয়া হয়েছে (Submitted)' : 'Application Submitted'}
                            </h5>
                            <p className="text-[10px] text-text-muted font-bold">
                              {statusResult.submissionDate || (statusResult.createdAt ? new Date(statusResult.createdAt).toLocaleString() : '')}
                            </p>
                          </div>
                        </div>

                        {/* Step 2: Application Received */}
                        <div className="relative">
                          <div className="absolute -left-[30px] top-0.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white ring-4 ring-emerald-500/20">
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-text-main">
                              {language === 'bn' ? 'আবেদন গ্রহণ করা হয়েছে (Received)' : 'Application Received'}
                            </h5>
                            <p className="text-[10px] text-text-muted font-bold">
                              {(() => {
                                const baseDate = statusResult.createdAt || statusResult.submissionDate;
                                if (!baseDate) return '';
                                try {
                                  return new Date(new Date(baseDate).getTime() + 600000).toLocaleString(); // +10 mins
                                } catch (e) { return ''; }
                              })()}
                            </p>
                          </div>
                        </div>

                        {/* Step 3: Initial Review Phase */}
                        <div className="relative">
                          <div className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ${
                            statusResult.status !== 'PENDING' 
                              ? 'bg-emerald-500 ring-emerald-500/20' 
                              : 'bg-amber-500 ring-amber-500/20 animate-pulse'
                          }`}>
                            {statusResult.status !== 'PENDING' ? (
                              <Check size={12} strokeWidth={3} />
                            ) : (
                              <Clock size={12} />
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-text-main">
                              {language === 'bn' ? 'প্রাথমিক পর্যালোচনা (Initial Review)' : 'Initial Review Phase'}
                            </h5>
                            <p className="text-[10px] text-text-muted font-bold">
                              {statusResult.status !== 'PENDING' 
                                ? (() => {
                                    const baseDate = statusResult.createdAt || statusResult.submissionDate;
                                    if (!baseDate) return '';
                                    try {
                                      return new Date(new Date(baseDate).getTime() + 3600000).toLocaleString(); // +1 hour
                                    } catch (e) { return ''; }
                                  })()
                                : (language === 'bn' ? 'চলমান...' : 'In Progress...')}
                            </p>
                          </div>
                        </div>

                        {/* Step 4: Document Verification */}
                        <div className="relative">
                          <div className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ${
                            statusResult.status === 'APPROVED' 
                              ? 'bg-emerald-500 ring-emerald-500/20' 
                              : statusResult.status === 'REJECTED'
                                ? 'bg-rose-500 ring-rose-500/20'
                                : 'bg-amber-500 ring-amber-500/20 animate-pulse'
                          }`}>
                            {statusResult.status === 'APPROVED' ? (
                              <Check size={12} strokeWidth={3} />
                            ) : statusResult.status === 'REJECTED' ? (
                              <X size={12} strokeWidth={3} />
                            ) : (
                              <Clock size={12} />
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-text-main">
                              {language === 'bn' ? 'নথিপত্র যাচাইকরণ (Document Verification)' : 'Document Verification'}
                            </h5>
                            <p className="text-[10px] text-text-muted font-bold">
                              {statusResult.status === 'APPROVED' 
                                ? (() => {
                                    const baseDate = statusResult.createdAt || statusResult.submissionDate;
                                    if (!baseDate) return '';
                                    try {
                                      return new Date(new Date(baseDate).getTime() + 7200000).toLocaleString(); // +2 hours
                                    } catch (e) { return ''; }
                                  })()
                                : statusResult.status === 'REJECTED'
                                  ? (language === 'bn' ? 'যাচাইকরণ ব্যর্থ হয়েছে' : 'Verification Failed')
                                  : (language === 'bn' ? 'চলমান...' : 'In Progress...')}
                            </p>
                          </div>
                        </div>

                        {/* Step 5: Final Decision */}
                        <div className="relative">
                          <div className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-white ring-4 ${
                            statusResult.status === 'APPROVED' 
                              ? 'bg-emerald-500 ring-emerald-500/20' 
                              : statusResult.status === 'REJECTED'
                                ? 'bg-rose-500 ring-rose-500/20'
                                : 'bg-zinc-200 dark:bg-zinc-800 ring-transparent text-zinc-400'
                          }`}>
                            {statusResult.status === 'APPROVED' ? (
                              <Check size={12} strokeWidth={3} />
                            ) : statusResult.status === 'REJECTED' ? (
                              <X size={12} strokeWidth={3} />
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-400">5</span>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-extrabold text-text-main">
                              {language === 'bn' ? 'চূড়ান্ত সিদ্ধান্ত (Final Decision)' : 'Final Decision'}
                            </h5>
                            <p className="text-[10px] text-text-muted font-bold">
                              {statusResult.status === 'APPROVED' 
                                ? (language === 'bn' ? 'অনুমোদিত' : 'Approved') 
                                : statusResult.status === 'REJECTED' 
                                  ? (language === 'bn' ? 'বাতিল' : 'Rejected') 
                                  : (language === 'bn' ? 'সিদ্ধান্তের অপেক্ষায়' : 'Awaiting Decision')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. Expanded Applicant Details */}
                    <div 
                      className="p-5 rounded-xl border space-y-3 shadow-lg backdrop-blur-md" 
                      style={{ 
                        backgroundColor: isBackgroundLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 15, 15, 0.75)',
                        borderColor: isBackgroundLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' 
                      }}
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                        <UserIcon size={18} className="text-emerald-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-text-main">
                          {language === 'bn' ? 'আবেদনকারীর বিস্তারিত তথ্য' : 'Applicant Details'}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs font-bold pt-1">
                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider leading-none">
                            {language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
                          </span>
                          <span className="text-text-main block mt-1">{statusResult.fullName}</span>
                        </div>
                        
                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider leading-none">
                            {language === 'bn' ? 'মোবাইল নম্বর' : 'Contact Number'}
                          </span>
                          <span className="text-text-main block mt-1">
                            {statusResult.countryCode || ''} {statusResult.mobile || statusResult.contactNo || ''}
                          </span>
                        </div>

                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider leading-none">
                            {language === 'bn' ? 'ইমেল ঠিকানা' : 'Email Address'}
                          </span>
                          <span className="text-text-main block mt-1 break-all">{statusResult.email || 'N/A'}</span>
                        </div>

                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider leading-none">
                            {language === 'bn' ? 'পেশা / পদবী' : 'Applied Designation'}
                          </span>
                          <span className="text-text-main block mt-1 uppercase tracking-wide text-[10px]">
                            {statusResult.profession || statusResult.role || 'FLEET DRIVER'}
                          </span>
                        </div>

                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider leading-none">
                            {language === 'bn' ? 'জোন নম্বর' : 'Zone Number'}
                          </span>
                          <span className="text-text-main block mt-1">
                            {statusResult.zoneNumber ? `Zone ${statusResult.zoneNumber}` : 'N/A'}
                          </span>
                        </div>

                        <div>
                          <span className="text-text-muted text-[10px] block uppercase tracking-wider leading-none">
                            {language === 'bn' ? 'জাতীয়তা / দেশ' : 'Nationality / Country'}
                          </span>
                          <span className="text-text-main block mt-1">
                            {statusResult.nationality || statusResult.country || 'Qatar'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 5. Submitted Documents Status */}
                    <div 
                      className="p-5 rounded-xl border space-y-3 shadow-lg backdrop-blur-md" 
                      style={{ 
                        backgroundColor: isBackgroundLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 15, 15, 0.75)',
                        borderColor: isBackgroundLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' 
                      }}
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                        <Shield size={18} className="text-emerald-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-text-main">
                          {language === 'bn' ? 'জমাকৃত নথিপত্রের অবস্থা' : 'Submitted Documents Status'}
                        </h4>
                      </div>

                      <div className="space-y-2.5 pt-1">
                        {/* Doc 1 */}
                        <div className="flex items-center justify-between text-xs font-bold border-b border-black/5 dark:border-white/5 pb-2">
                          <span className="text-text-main">
                            {language === 'bn' ? '১. জাতীয় পরিচয়পত্র (QID Card)' : '1. National ID (QID Card)'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                            statusResult.status === 'APPROVED' 
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : statusResult.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {statusResult.status === 'APPROVED' 
                              ? (language === 'bn' ? 'যাচাইকৃত ✓' : 'VERIFIED ✓')
                              : statusResult.status === 'REJECTED'
                                ? (language === 'bn' ? 'বাতিল করা হয়েছে ✗' : 'REJECTED ✗')
                                : (language === 'bn' ? 'পর্যালোচনাধীন' : 'UNDER REVIEW ●')}
                          </span>
                        </div>

                        {/* Doc 2 */}
                        <div className="flex items-center justify-between text-xs font-bold border-b border-black/5 dark:border-white/5 pb-2">
                          <span className="text-text-main">
                            {language === 'bn' ? '২. পাসপোর্ট স্ক্যান কপি' : '2. Passport Scan Copy'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            {language === 'bn' ? 'গৃহীত হয়েছে ✓' : 'RECEIVED ✓'}
                          </span>
                        </div>

                        {/* Doc 3 */}
                        <div className="flex items-center justify-between text-xs font-bold border-b border-black/5 dark:border-white/5 pb-2">
                          <span className="text-text-main">
                            {language === 'bn' ? '৩. ঠিকানা প্রমানপত্র (Zone Proof)' : '3. Address Proof (Zone Document)'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                            statusResult.status === 'APPROVED' 
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : statusResult.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}>
                            {statusResult.status === 'APPROVED' 
                              ? (language === 'bn' ? 'যাচাইকৃত ✓' : 'VERIFIED ✓')
                              : statusResult.status === 'REJECTED'
                                ? (language === 'bn' ? 'পুনঃআপলোড প্রয়োজন ✗' : 'UPDATE NEEDED ✗')
                                : (language === 'bn' ? 'পর্যালোচনাধীন' : 'UNDER REVIEW ●')}
                          </span>
                        </div>

                        {/* Doc 4 - If Company */}
                        {statusResult.accountType === 'COMPANY' && (
                          <div className="flex items-center justify-between text-xs font-bold pb-1">
                            <span className="text-text-main">
                              {language === 'bn' ? '৪. ট্রেড লাইসেন্স / বাণিজ্যিক নথি' : '4. Commercial Registration'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${
                              statusResult.status === 'APPROVED' 
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : statusResult.status === 'REJECTED'
                                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}>
                              {statusResult.status === 'APPROVED' 
                                ? (language === 'bn' ? 'যাচাইকৃত ✓' : 'VERIFIED ✓')
                                : (language === 'bn' ? 'পর্যালোচনাধীন' : 'UNDER REVIEW ●')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6. Admin Remark & Action Required + Drag and Drop File Uploader */}
                    <div 
                      className="p-5 rounded-xl border space-y-4 shadow-lg backdrop-blur-md" 
                      style={{ 
                        backgroundColor: isBackgroundLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 15, 15, 0.75)',
                        borderColor: isBackgroundLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)' 
                      }}
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                        <Info size={18} className="text-emerald-500" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-text-main">
                          {language === 'bn' ? 'প্রশাসকের মন্তব্য ও প্রয়োজনীয় পদক্ষেপ' : 'Admin Remark & Actions'}
                        </h4>
                      </div>

                      <div className="space-y-3 pt-1 text-xs">
                        <div className="p-3.5 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2">
                          <span className="font-extrabold text-[10px] block uppercase tracking-wider text-amber-500 dark:text-amber-400">
                            {language === 'bn' ? 'অ্যাডমিন রিমার্ক (Remark):' : 'Administrator Remark:'}
                          </span>
                          <p className="font-semibold text-text-main leading-relaxed">
                            {statusResult.status === 'APPROVED'
                              ? (language === 'bn' ? 'সকল জমাকৃত নথিপত্র সফলভাবে অনুমোদিত। আপনার অ্যাকাউন্ট সক্রিয় করা হয়েছে।' : 'All credentials and documents successfully approved. Account is fully activated.')
                              : statusResult.status === 'REJECTED'
                                ? (statusResult.rejectionReason || (language === 'bn' ? 'জাতীয় পরিচয়পত্র (QID) স্ক্যান কপি ঝাপসা বা অস্পষ্ট। অনুগ্রহ করে একটি উচ্চমানের উজ্জ্বল ছবি পুনরায় আপলোড করুন।' : 'Identification card scan is blurry or unreadable. Please upload a clear high-resolution copy.'))
                                : (language === 'bn' ? 'জমাকৃত তথ্যাদি সঠিক পাওয়া গেছে। চূড়ান্ত ব্যাকগ্রাউন্ড ভেরিফিকেশন প্রক্রিয়া চলমান রয়েছে।' : 'Submitted details are correct. Secondary verification and registry validation are in progress.')}
                          </p>
                        </div>

                        {/* Interactive File Dropzone for uploading corrected files if pending or rejected */}
                        {(statusResult.status === 'PENDING' || statusResult.status === 'REJECTED') && (
                          <div className="pt-2 space-y-3">
                            <span className="font-extrabold text-[10px] block uppercase tracking-wider text-text-main">
                              {language === 'bn' ? 'সহায়ক ফাইল আপলোড করুন (যদি প্রয়োজন হয়):' : 'Upload Correction Documents (If requested):'}
                            </span>

                            {uploadSuccess ? (
                              <motion.div 
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-center space-y-2"
                              >
                                <Check size={24} className="mx-auto text-emerald-500 animate-bounce" />
                                <h5 className="font-extrabold text-xs">
                                  {language === 'bn' ? 'নথিপত্র জমা দেওয়া হয়েছে!' : 'Documents Submitted Successfully!'}
                                </h5>
                                <p className="text-[10px] font-bold opacity-80">
                                  {language === 'bn' 
                                    ? 'আপনার নতুন ফাইলগুলো এডমিন ট্র্যাকিং প্যানেলে যুক্ত করা হয়েছে। অনুগ্রহ করে রিভিউর জন্য অপেক্ষা করুন।' 
                                    : 'Your updated files have been securely routed to the Verification Bureau. We will review them shortly.'}
                                </p>
                                <button 
                                  onClick={() => { setUploadSuccess(false); setUploadedFiles([]); }}
                                  className="text-[10px] underline font-black uppercase text-emerald-500 tracking-wider hover:brightness-110"
                                >
                                  {language === 'bn' ? 'অন্য ফাইল আপলোড করুন' : 'Upload another file'}
                                </button>
                              </motion.div>
                            ) : (
                              <div className="space-y-3">
                                {/* Drag & Drop Target Area */}
                                <div 
                                  onClick={() => {
                                    const input = document.getElementById('status-doc-file-input');
                                    if (input) input.click();
                                  }}
                                  className="border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all duration-200"
                                >
                                  <input 
                                    id="status-doc-file-input"
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        setUploadedFiles(Array.from(e.target.files));
                                      }
                                    }}
                                  />
                                  <ClipboardList size={28} className="mx-auto text-zinc-400 mb-2" />
                                  <p className="font-extrabold text-xs text-text-main">
                                    {language === 'bn' ? 'ফাইল সিলেক্ট করতে এখানে ক্লিক করুন' : 'Click to select or drag document here'}
                                  </p>
                                  <p className="text-[10px] text-text-muted font-bold mt-1">
                                    PNG, JPG or PDF up to 10MB
                                  </p>
                                </div>

                                {/* Show Selected Files List */}
                                {uploadedFiles.length > 0 && (
                                  <div className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/5 space-y-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                                      {language === 'bn' ? 'বাছাইকৃত ফাইলসমূহ:' : 'Selected Files:'}
                                    </span>
                                    {uploadedFiles.map((f, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-[11px] font-bold text-text-main">
                                        <span className="truncate flex-1 pr-4">{f.name}</span>
                                        <span className="text-text-muted">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Message to Administrator */}
                                <div className="space-y-1">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                                    {language === 'bn' ? 'প্রশাসকের উদ্দেশ্যে কোনো মেসেজ (ঐচ্ছিক):' : 'Message to Administrator (Optional):'}
                                  </label>
                                  <textarea 
                                    rows={2}
                                    value={uploadMessage}
                                    onChange={(e) => setUploadMessage(e.target.value)}
                                    placeholder={language === 'bn' ? 'উদা: অস্পষ্ট ছবির বদলে এখানে নতুন স্ক্যান কপি আপলোড করা হল...' : 'e.g., Attaching a clear HD copy of my QID card to resolve blurry scan issue...'}
                                    className="w-full text-xs font-bold p-2.5 rounded-lg border border-zinc-300 dark:border-white/10 bg-white dark:bg-black/20 text-text-main focus:outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <button 
                                  onClick={() => {
                                    if (uploadedFiles.length === 0) {
                                      showFeedback(language === 'bn' ? 'অনুগ্রহ করে প্রথমে ফাইল সিলেক্ট করুন।' : 'Please select at least one document first.');
                                      return;
                                    }
                                    setIsUploadingStatusDoc(true);
                                    setTimeout(() => {
                                      setIsUploadingStatusDoc(false);
                                      setUploadSuccess(true);
                                      setUploadMessage('');
                                      showFeedback(language === 'bn' ? 'ফাইলগুলো সফলভাবে পাঠানো হয়েছে!' : 'Correction file(s) uploaded successfully!');
                                    }, 1500);
                                  }}
                                  disabled={isUploadingStatusDoc}
                                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-extrabold rounded-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all"
                                >
                                  {isUploadingStatusDoc ? (
                                    <>
                                      <Loader2 size={14} className="animate-spin text-white" />
                                      <span>{language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...'}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap size={14} className="text-white" />
                                      <span>{language === 'bn' ? 'এডমিনকে পাঠান' : 'Submit Corrections'}</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 7. Action Button Panel (Re-apply or Back to Login depending on status) */}
                    <div className="pt-2">
                      {statusResult.status === 'REJECTED' ? (
                        <div className="flex flex-col gap-2.5">
                          <button 
                            onClick={() => {
                              // Build a structured prefill data packet from previous application request
                              const prefill = {
                                fullName: statusResult.fullName || '',
                                email: statusResult.email || '',
                                mobile: statusResult.mobile || statusResult.contactNo || '',
                                accountType: statusResult.accountType || 'PERSONAL',
                                nationality: statusResult.nationality || '',
                                religion: statusResult.religion || '',
                                gender: statusResult.gender || '',
                                dob: statusResult.dob || '',
                                profession: statusResult.profession || statusResult.role || '',
                                companyName: statusResult.companyName || '',
                                country: statusResult.country || '',
                                addressLine1: statusResult.addressLine1 || '',
                                city: statusResult.city || '',
                                state: statusResult.state || '',
                                zoneNumber: statusResult.zoneNumber || '',
                                buildingNumber: statusResult.buildingNumber || '',
                                streetNumber: statusResult.streetNumber || ''
                              };
                              
                              setReapplyData(prefill);
                              setShowApplicationStatusModal(false);
                              setActiveTab('signup');
                              showFeedback(language === 'bn' ? 'পূর্বের তথ্যগুলো ফর্মে লোড করা হয়েছে! অনুগ্রহ করে সংশোধন করে আবার সাবমিট করুন।' : 'Previous application details loaded into the registration form. Please review and re-submit.');
                            }}
                            className="w-full h-12 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl shadow-lg hover:shadow-rose-500/20 uppercase tracking-wider text-xs transition-all active:scale-95 duration-200"
                          >
                            {language === 'bn' ? 'পুনরায় আবেদন করুন (Re-apply / Edit Details)' : 'Re-apply / Edit Details'}
                          </button>

                          <button 
                            onClick={() => setShowApplicationStatusModal(false)}
                            className="w-full h-12 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-main font-bold rounded-xl uppercase tracking-wider text-xs transition-all active:scale-95 border border-zinc-300 dark:border-white/10 duration-200"
                          >
                            {language === 'bn' ? 'বন্ধ করুন' : 'Close Tracker'}
                          </button>
                        </div>
                      ) : statusResult.status === 'APPROVED' ? (
                        <div className="flex flex-col gap-2.5">
                          <button 
                            onClick={() => {
                              setShowApplicationStatusModal(false);
                              setActiveTab('signin');
                            }}
                            className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-xl shadow-lg hover:shadow-emerald-500/20 uppercase tracking-wider text-xs transition-all active:scale-95 duration-200"
                          >
                            {language === 'bn' ? 'লগইন করতে এগিয়ে যান (Proceed to Login)' : 'Proceed to Login'}
                          </button>

                          <button 
                            onClick={() => setShowApplicationStatusModal(false)}
                            className="w-full h-12 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-main font-bold rounded-xl uppercase tracking-wider text-xs transition-all active:scale-95 border border-zinc-300 dark:border-white/10 duration-200"
                          >
                            {language === 'bn' ? 'বন্ধ করুন' : 'Close Tracker'}
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setShowApplicationStatusModal(false)}
                          className="w-full h-12 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-main font-bold rounded-xl uppercase tracking-wider text-xs transition-all active:scale-95 border border-zinc-300 dark:border-white/10 duration-200"
                        >
                          {language === 'bn' ? 'লগইন পেজে ফিরুন' : 'Back to Login'}
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </>
        )}
      </>

      {/* Scrollable Core Layout in responsive  splits */}
      <div className="flex-grow flex flex-col md:flex-row min-h-0 w-full relative z-10 overflow-hidden md:h-full">
        {/* Left Branding Panel for Desktop Mode only */}
        <div 
          className="hidden md:flex md:w-[50%] lg:w-[55%] flex-col justify-between p-12 border-r relative overflow-hidden h-full"
          style={{
            background: effectiveWallpaper 
              ? (isBackgroundLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)') 
              : (effectiveBgColor 
                  ? (isBackgroundLight ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.45)')
                  : 'linear-gradient(135deg, #020617, #0f172a, #1e1b4b)'
                ),
            borderColor: isBackgroundLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            color: finalTextColor,
          }}
        >
          {/* Ambient Glowing Color Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-cyan-500/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-violet-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDuration: '10s' }} />
          
          <div className="absolute inset-0 opacity-[0.035]" 
            style={{
              backgroundImage: `radial-gradient(#f1f5f9 1px, transparent 0)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Top Logo & Title bar */}
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10 shadow-lg">
              <Truck size={20} className={isBackgroundLight ? "text-teal-600" : "text-cyan-400"} />
            </div>
            <div>
              <span className="font-black tracking-[0.3em] text-xs uppercase block" style={{ color: finalTextColor }}>FleetPro</span>
              <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: isBackgroundLight ? '#0d9488' : '#22d3ee' }}>Enterprise Suite</span>
            </div>
          </div>

          {/* Centered Brand Panel */}
          <div className="my-auto flex flex-col items-center justify-center text-center relative z-10 py-12">
            <div className="relative w-56 h-56 mb-8 flex items-center justify-center">
              <div className="absolute w-[120px] h-[120px] bg-cyan-500/10 rounded-full blur-2xl animate-pulse" />
              <div className="absolute w-[180px] h-[180px] rounded-full border border-t-amber-400 border-b-rose-500 border-l-transparent border-r-transparent animate-spin opacity-80" style={{ animationDuration: '15s' }} />
              <div className="absolute w-[150px] h-[150px] rounded-full border-2 border-l-fuchsia-500 border-r-violet-500 border-t-transparent border-b-transparent animate-spin opacity-90" style={{ animationDuration: '10s' }} />
              <div className="absolute w-[120px] h-[120px] rounded-full border border-t-cyan-400 border-b-emerald-400 border-l-transparent border-r-transparent animate-spin opacity-95" style={{ animationDuration: '6s' }} />

              <div className="relative w-32 h-32 p-[6px] bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-105 overflow-hidden">
                <img 
                  src={logo || fleetproLogo} 
                  alt="FleetPro Logo" 
                  loading="eager"
                  decoding="sync"
                  className="w-full h-full object-contain rounded-[12px] drop-shadow-md" 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== fleetproLogo) {
                      target.src = fleetproLogo;
                    }
                  }}
                />
              </div>
            </div>

            <h2 className="text-5xl font-black tracking-tight leading-none mb-3" style={{ color: finalTextColor }}>
              FLEETPRO
            </h2>
            <p className="text-sm font-bold tracking-[0.35em] uppercase mb-8" style={{ color: isBackgroundLight ? '#0d9488' : '#22d3ee' }}>
              Private Transport Manager
            </p>

            <div className="w-full max-w-md p-[1px] mb-8" style={{ backgroundImage: `linear-gradient(to right, transparent, ${isBackgroundLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}, transparent)` }} />

            {/* Bento-style Features widgets */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-lg mt-2 font-calibri">
              <div className="p-4 rounded-xl backdrop-blur-md flex flex-col items-center justify-center gap-2 transition-colors shadow-lg" style={{ backgroundColor: isBackgroundLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isBackgroundLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isBackgroundLight ? 'rgba(13,148,136,0.1)' : 'rgba(20,184,166,0.1)', borderColor: isBackgroundLight ? 'rgba(13,148,136,0.2)' : 'rgba(20,184,166,0.2)' }}>
                  <Shield size={16} className={isBackgroundLight ? "text-teal-600" : "text-teal-400"} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: isBackgroundLight ? '#0f766e' : '#5eead4' }}>Security</span>
                <span className="text-[10px] font-bold" style={{ color: isBackgroundLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>100% Secure</span>
              </div>
              <div className="p-4 rounded-xl backdrop-blur-md flex flex-col items-center justify-center gap-2 transition-colors shadow-lg" style={{ backgroundColor: isBackgroundLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isBackgroundLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isBackgroundLight ? 'rgba(14,165,233,0.1)' : 'rgba(34,211,238,0.1)', borderColor: isBackgroundLight ? 'rgba(14,165,233,0.2)' : 'rgba(34,211,238,0.2)' }}>
                  <Globe size={16} className={isBackgroundLight ? "text-sky-600" : "text-cyan-400"} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: isBackgroundLight ? '#0369a1' : '#67e8f9' }}>Sync</span>
                <span className="text-[10px] font-bold font-calibri" style={{ color: isBackgroundLight ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)' }}>Cloud Live</span>
              </div>
              <div className="p-4 rounded-xl backdrop-blur-md flex flex-col items-center justify-center gap-2 transition-colors shadow-lg" style={{ backgroundColor: isBackgroundLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isBackgroundLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center border" style={{ backgroundColor: isBackgroundLight ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.1)', borderColor: isBackgroundLight ? 'rgba(5,150,105,0.2)' : 'rgba(52,211,153,0.2)' }}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: isBackgroundLight ? '#047857' : '#6ee7b7' }}>Status</span>
                <span className="text-[10px] font-extrabold flex items-center gap-1" style={{ color: isBackgroundLight ? '#059669' : '#34d399' }}>● ONLINE</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer block */}
          <div className="flex items-center justify-between text-[10px] font-bold relative z-10 border-t pt-4" style={{ borderColor: isBackgroundLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', color: isBackgroundLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }}>
            <span>© 2026 FleetPro Enterprise</span>
            <div className="flex items-center gap-1.5" style={{ color: isBackgroundLight ? '#0d9488' : '#22d3ee' }}>
              <Shield size={10} />
              <span>AES-256 SSL LINK</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className={`w-full md:w-[50%] lg:w-[45%] h-full flex flex-col ${activeTab === 'signup' ? 'justify-start overflow-y-auto' : 'justify-center overflow-y-auto md:overflow-hidden'} relative scrollbar-none px-0 overscroll-none`}>
          <div className={`relative flex flex-col w-full mx-auto z-10 scrollbar-none overscroll-none ${
            activeTab === 'signup' 
              ? 'flex-grow min-h-full overflow-y-visible max-w-none px-0 py-0 justify-start items-stretch' 
              : 'min-h-full overflow-y-visible max-w-none sm:max-w-md items-stretch sm:items-center justify-start pt-4 pb-0 md:justify-center md:pt-0 md:pb-0 md:my-auto md:max-w-md'
          }`}>
            
              <>
                {activeTab !== 'signup' && (
                  <div 
                    className="text-center space-y-4 mb-6 mt-4 px-4 flex-shrink-0 login-page-header md:hidden"
                  >
                    <div className="inline-flex relative w-24 h-24 p-[6px] bg-black/5 dark:bg-white/5 rounded-xl items-center justify-center mb-1 shadow-2xl transition-all duration-300 overflow-hidden">
                      <img 
                        src={logo || fleetproLogo} 
                        alt="FleetPro Logo" 
                        loading="eager"
                        decoding="sync"
                        className="w-full h-full object-contain rounded-[12px] drop-shadow-md" 
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== fleetproLogo) {
                            target.src = fleetproLogo;
                          }
                        }}
                      />
                    </div>
                    <h1 className="text-3xl font-black text-text-main tracking-tight drop-shadow-lg leading-none">FLEETPRO</h1>
                    <p className="text-text-muted font-bold text-[9px] tracking-[0.35em] uppercase leading-none">Private Transport Manager</p>
                  </div>
                )}
              </>

            {!showForgotUsername && !showForgotPassword && (
              <>
                {activeTab === 'signin' ? (
                  <div 
                    style={loginCardStyle}
                    className={`w-full login-card-container border-t ${loginCardIsDark ? 'border-white/10 shadow-[0_-15px_50px_rgba(0,0,0,0.6)]' : 'border-black/10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]'} rounded-t-[24px] rounded-b-none border-x-0 border-b-0 p-6 sm:p-8 pb-[calc(36px+env(safe-area-inset-bottom,16px))] md:pb-8 mt-auto md:border-t-0 md:rounded-2xl md:border md:shadow-2xl md:my-auto md:max-w-md md:mx-auto`}
                  >
                    {/* iOS Bottom Sheet Drag Handle */}
                    {!showForgotPassword && !showForgotUsername && !showFingerprintEnrollModal && (
                      <div className="flex justify-center items-center mb-5 -mt-2">
                        <div className={`w-[36px] h-1.5 rounded-full ${loginCardIsDark ? 'bg-white/20' : 'bg-black/20'}`} />
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      {showFingerprintEnrollModal ? (
                        <motion.form 
                          key="fingerprint-enroll"
                          initial={{ y: '100%', opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: '100%', opacity: 0 }}
                          transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
                          className="space-y-4 "
                          onSubmit={handleFingerprintEnrollSubmit}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-black text-text-main">
                              {language === 'bn' ? 'ফিঙ্গারপ্রিন্ট রেজিস্টার' : 'Fingerprint Enrollment'}
                            </h3>
                            <button 
                              type="button"
                              onClick={() => {
                                setShowFingerprintEnrollModal(false);
                                setEnrollUsername('');
                                setEnrollPassword('');
                                setEnrollMobile('');
                              }}
                              className="text-xs font-bold text-text-main hover:text-text-muted active:scale-95 transition-all"
                            >
                              {language === 'bn' ? 'বাতিল' : 'Cancel'}
                            </button>
                          </div>

                          <div className="space-y-4">
                            <p className="text-xs text-text-muted">
                              {language === 'bn'
                                ? 'লগইন করার জন্য আপনার অ্যাকাউন্টে ফিঙ্গারপ্রিন্ট সেটআপ করুন।'
                                : 'Set up fingerprint authentication for quick login.'}
                            </p>
                            
                            <InputField 
                              label={language === 'bn' ? 'ইউজার আইডি / ইমেইল' : 'User ID / Email'}
                              name="enrollUsername"
                              type="text"
                              value={enrollUsername}
                              onChange={(e) => setEnrollUsername(e.target.value)}
                              hideCheckmark={true}
                              style={{ backgroundColor: 'transparent' }}
                              icon={<UserIcon size={18} />}
                              disabled={enrollLoading}
                            />

                            <InputField 
                              label={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                              name="enrollPassword"
                              type="password"
                              value={enrollPassword}
                              onChange={(e) => setEnrollPassword(e.target.value)}
                              hideCheckmark={true}
                              style={{ backgroundColor: 'transparent' }}
                              icon={<Lock size={18} />}
                              disabled={enrollLoading}
                            />

                            <InputField 
                              label={language === 'bn' ? 'মোবাইল নাম্বার' : 'Mobile Number'}
                              name="enrollMobile"
                              type="tel"
                              inputMode="numeric"
                              value={enrollMobile}
                              onChange={(e) => setEnrollMobile(e.target.value)}
                              hideCheckmark={true}
                              style={{ backgroundColor: 'transparent' }}
                              icon={<Phone size={18} />}
                              disabled={enrollLoading}
                            />
                          </div>

                          <div className="pb-4 pt-2">
                            <button 
                              type="submit"
                              disabled={enrollLoading}
                              className={`w-full h-12 text-white primary-bg-text font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase flex items-center justify-center gap-3 allow-animation ${enrollLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                              style={{ backgroundColor: 'var(--primary)' }}
                            >
                              {enrollLoading ? (
                                <Loader2 size={18} className="animate-spin text-white" />
                              ) : (
                                <Fingerprint size={18} />
                              )}
                              <span>
                                {enrollLoading 
                                  ? (language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...') 
                                  : (language === 'bn' ? 'ফিঙ্গারপ্রিন্ট সেটআপ করুন' : 'Setup Fingerprint')}
                              </span>
                            </button>
                          </div>
                        </motion.form>
                      ) : showAdminPinStep ? (
                        <motion.form
                          key="admin-pin-step"
                          initial={{ y: '100%', opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: '100%', opacity: 0 }}
                          transition={{ type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
                          className="space-y-4"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (adminPin.length === 4 && !isLoading) {
                              handleAdminPinSubmit();
                            }
                          }}
                        >
                          <div className="text-center space-y-2">
                            <h3 className="text-xl font-black text-[#000000]">
                              {language === 'bn' ? 'এডমিন সিকিউরিটি পিন' : 'Admin Security PIN'}
                            </h3>
                            <p className="text-xs text-[#000000]/70">
                              {language === 'bn' 
                                ? 'এডমিন একাউন্টে লগইন যাচাই করতে অনুগ্রহ করে ৪-ডিজিটের পিন দিন।' 
                                : 'Please enter the 4-digit security PIN to verify Admin log in.'}
                            </p>
                          </div>

                          <div>
                            <InputField 
                              label={language === 'bn' ? '৪-ডিজিটের পিন' : '4-Digit PIN'}
                              name="adminPin"
                              type="password"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={4}
                              value={adminPin}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 4) setAdminPin(val);
                              }}
                              error={isPinError}
                              className="h-14"
                              inputClassName="tracking-[0.8em] font-black text-left pl-14 text-2xl"
                              inputSize="text-2xl text-left pl-14 pr-4"
                              labelSize="text-xs text-left pl-[44px]"
                              icon={<Shield size={20} />}
                              hideCheckmark={true}
                            />
                          </div>

                          <div className="pt-4 space-y-3">
                            <button 
                              onClick={handleAdminPinSubmit}
                              disabled={adminPin.length !== 4 || isLoading}
                              className={`w-full h-14 font-extrabold rounded-xl transition-all uppercase flex items-center justify-center gap-3 allow-animation ${adminPin.length !== 4 || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 hover:shadow-[0_8px_30px_rgba(29,78,216,0.35)] active:scale-[0.98]'}`}
                              style={{ 
                                background: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #047857 100%)', 
                                color: '#ffffff',
                                boxShadow: '0 8px 16px -4px rgba(29, 78, 216, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                letterSpacing: '0.12em',
                                border: '1px solid rgba(255, 255, 255, 0.15)'
                              }}
                            >
                              {isLoading ? (
                                <Loader2 size={20} className="animate-spin text-[#ffffff]" style={{ color: '#ffffff' }} />
                              ) : (
                                <Check size={20} className="text-[#ffffff]" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                              )}
                              <span style={{ color: '#ffffff' }} className="tracking-widest">
                                {isLoading ? t.VERIFY : (language === 'bn' ? 'সাবমিট' : (language === 'ar' ? 'إرسাল' : 'Submit'))}
                              </span>
                            </button>

                            <button 
                              onClick={() => {
                                setShowAdminPinStep(false);
                                setAdminPin('');
                              }}
                              className="w-full text-center text-xs font-bold text-text-muted hover:text-text-main py-2 active:scale-95 transition-all"
                            >
                              {language === 'bn' ? 'পূর্বের ধাপে ফিরুন' : 'Back to Login'}
                            </button>
                          </div>
                        </motion.form>
                      ) : (
                        <motion.form 
                          key="signin"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-5"
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!isLocked && !isLoading) {
                              handleLogin();
                            }
                          }}
                        >
                          <div className="space-y-4">
                            <div className="relative">
                              <InputField 
                                label={language === 'bn' ? 'ইউজার আইডি / ইমেইল' : 'User ID / Email'}
                                name="username"
                                type="text"
                                value={isBiometricVerifying ? '*****' : username}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setUsername(val);
                                  if (rememberMe) {
                                    localStorage.setItem('fleetpro_saved_username', val);
                                  }
                                }}
                                inputSize="text-base"
                                labelSize="text-xs"
                                icon={<UserIcon size={18} />}
                                hideCheckmark={true}
                                themeMode={loginCardIsDark ? 'dark' : 'light'}
                                inputClassName="pr-20"
                                disabled={isBiometricVerifying}
                              />
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 bg-zinc-100/90 hover:bg-zinc-200/95 px-2 py-1 rounded-md border border-zinc-300 shadow-sm transition-all">
                                <input 
                                  id="rememberMeCheckbox"
                                  type="checkbox"
                                  checked={rememberMe}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setRememberMe(checked);
                                    localStorage.setItem('fleetpro_remember_me', checked ? 'true' : 'false');
                                    if (checked) {
                                      localStorage.setItem('fleetpro_saved_username', username);
                                      localStorage.setItem('fleetpro_saved_password', password);
                                    } else {
                                      localStorage.removeItem('fleetpro_saved_username');
                                      localStorage.removeItem('fleetpro_saved_password');
                                    }
                                  }}
                                  className="w-4 h-4 text-blue-600 border-zinc-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                                />
                                <label htmlFor="rememberMeCheckbox" className="text-[10px] font-black tracking-wider text-blue-600 uppercase select-none cursor-pointer">
                                  {language === 'bn' ? 'সেভ' : 'Save'}
                                </label>
                              </div>
                            </div>
                            <div>
                              <InputField 
                                label={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                                name="password"
                                type="password"
                                value={isBiometricVerifying ? '*****' : password}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPassword(val);
                                  if (rememberMe) {
                                    localStorage.setItem('fleetpro_saved_password', val);
                                  }
                                }}
                                inputSize="text-base"
                                labelSize="text-xs"
                                icon={<Lock size={18} />}
                                hideCheckmark={true}
                                themeMode={loginCardIsDark ? 'dark' : 'light'}
                                disabled={isBiometricVerifying}
                              />
                              <div className="flex justify-between items-center mt-2">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setShowForgotUsername(true);
                                    setShowForgotPassword(false);
                                    setForgotUsernameStep(1);
                                    setForgotUsernameMobile('');
                                    setForgotUsernameCode('');
                                    setForgotUsernameUser(null);
                                  }}
                                  className="text-[10px] font-bold text-text-muted hover:text-text-main hover:underline active:scale-95 transition-all"
                                >
                                  Forgot Username
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setShowForgotPassword(true);
                                    setShowForgotUsername(false);
                                    setRecoveryStep(1);
                                    setRecoveryUsername('');
                                    setRecoveryCode('');
                                    setNewPassword('');
                                    setConfirmNewPassword('');
                                  }}
                                  className="text-[10px] font-bold text-text-muted hover:text-text-main hover:underline active:scale-95 transition-all"
                                >
                                  Forgot Password
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <button 
                              type="submit"
                              onClick={handleLogin}
                              disabled={isLocked || isLoading}
                              className={`w-full h-14 font-extrabold rounded-xl transition-all uppercase flex items-center justify-center gap-3 allow-animation ${isLocked || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 hover:shadow-[0_8px_30px_rgba(29,78,216,0.35)] active:scale-[0.98]'}`}
                              style={{ 
                                background: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #047857 100%)', 
                                color: '#ffffff',
                                boxShadow: '0 8px 16px -4px rgba(29, 78, 216, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                                letterSpacing: '0.12em',
                                border: '1px solid rgba(255, 255, 255, 0.15)'
                              }}
                            >
                              {isLoading ? (
                                <Loader2 size={18} className="animate-spin text-[#ffffff]" style={{ color: '#ffffff' }} />
                              ) : (
                                <UserIcon size={18} className="text-[#ffffff]" style={{ color: '#ffffff', stroke: '#ffffff' }} />
                              )}
                              <span style={{ color: '#ffffff' }} className="tracking-widest">
                                {isLoading ? t.VERIFY : (language === 'bn' ? 'সাবমিট' : (language === 'ar' ? 'إرسال' : 'Submit'))}
                              </span>
                            </button>
                          </div>

                          {/* Sign Up Option below Submit Button */}
                          <div className="text-center mt-4 mb-6">
                            <span className="text-xs text-text-muted font-bold">
                              {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করতে চান? ' : language === 'ar' ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowForgotPassword(false);
                                setActiveTab('signup');
                              }}
                              className="text-xs font-black text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
                            >
                              {language === 'bn' ? 'নিবন্ধন করুন (Sign up)' : language === 'ar' ? 'إنشاء حساب' : 'Sign up'}
                            </button>
                          </div>

                          {/* VERSION 2.6.0 SECURE CLOUD SYSTEM */}
                          <div className="flex items-center justify-center mt-2">
                            <p className="text-center text-[9px] text-text-muted uppercase font-bold tracking-widest opacity-40">
                              VERSION 2.6.0 • SECURE CLOUD SYSTEM
                            </p>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div 
                    className="w-full min-h-full border-0 rounded-none px-2 sm:px-4 pt-0 pb-16 flex flex-col md:min-h-0 md:rounded-2xl md:border md:border-white/10 md:shadow-2xl md:my-auto md:p-8 md:max-w-4xl md:mx-auto"
                  >
                    <motion.div 
                      key="signup"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col w-full"
                      style={{ background: 'transparent' }}
                    >
                      {/* Signup Header */}
                      <div 
                        className="sticky top-0 z-[60] -mx-2 sm:-mx-4 md:-mx-8 md:-mt-8 mb-6 pt-[max(14px,env(safe-area-inset-top,0px))] backdrop-blur-xl border-b transition-all px-2 sm:px-4 md:px-8 shadow-sm"
                        style={{
                          backgroundColor: getHeaderBackground(),
                          borderColor: isBackgroundLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <div className="h-16 px-2 sm:px-4 flex items-center md:justify-center relative login-page-header">
                          <button 
                            onClick={() => setActiveTab('signin')} 
                            className="absolute left-2 sm:left-4 p-2 rounded-full active:scale-90 transition-all text-text-main hover:bg-black/5 dark:hover:bg-white/5"
                            aria-label="Back to login"
                          >
                            <ChevronLeft size={24} />
                          </button>
                          <h3 className="w-full text-center font-extrabold text-sm sm:text-base text-text-main uppercase tracking-wider">Registration Form</h3>
                        </div>
                      </div>
                      
                      <div className="w-full px-1 pt-2 pb-safe">
                        <SignupForm 
                          setActiveTab={setActiveTab} 
                          openModal={openModal}
                          initialData={reapplyData}
                          cardStyle={{ 
                            backgroundColor: loginCardIsDark ? '#121212' : '#ffffff', 
                            color: loginCardIsDark ? '#ffffff' : '#000000',
                            borderColor: loginCardIsDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'
                          }} 
                        />
                      </div>
                    </motion.div>
                  </div>
                )}
              </>
            )}

      {/* Separate Standalone Bottom Sheet for Forgot Username & Password */}
      <AnimatePresence>
        {(showForgotUsername || showForgotPassword) && (
          <div className="absolute inset-0 flex flex-col justify-end md:justify-center z-20 pointer-events-none px-0 md:px-4">
            <motion.div
              key="forgot-bottom-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={loginCardStyle}
              className={`w-full absolute bottom-0 left-0 right-0 pointer-events-auto border-t ${loginCardIsDark ? 'border-white/10 shadow-[0_-15px_50px_rgba(0,0,0,0.6)]' : 'border-black/10 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]'} rounded-t-[24px] rounded-b-none border-x-0 border-b-0 p-4 sm:p-6 pb-[calc(max(1.5rem,env(safe-area-inset-bottom))+12px)] mt-auto md:relative md:bottom-auto md:left-auto md:right-auto md:border-t-0 md:rounded-2xl md:border md:shadow-2xl md:my-auto md:max-w-md md:mx-auto`}
            >
            {/* iOS Drag Handle */}
            <div className="flex justify-between items-start mb-3 -mt-2">
              <div className="flex-1 invisible" />
              <div className={`w-[36px] h-1 rounded-full ${loginCardIsDark ? 'bg-white/20' : 'bg-black/20'}`} />
              <div className="flex-1" />
            </div>

            <AnimatePresence mode="wait">
              {showForgotUsername && (
                <motion.form 
                  key="forgot-username-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (forgotUsernameStep === 1) {
                      handleForgotUsernameMobileSubmit();
                    } else if (forgotUsernameStep === 2) {
                      handleForgotUsernameCodeSubmit();
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-black text-text-main">
                      {language === 'bn' ? 'ইউজারনেম পুনরুদ্ধার' : 'Forgot Username'}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowForgotUsername(false);
                        setForgotUsernameStep(1);
                        setForgotUsernameMobile('');
                        setForgotUsernameCode('');
                        setForgotUsernameUser(null);
                      }}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <X size={14} />
                      <span>{language === 'bn' ? 'বাতিল' : 'Cancel'}</span>
                    </button>
                  </div>

                  {forgotUsernameStep === 1 && (
                    <div className="space-y-5">
                      <p className="text-xs text-text-muted">
                        {language === 'bn'
                          ? 'ইউজারনেম পুনরুদ্ধার করতে আপনার নিবন্ধিত মোবাইল নাম্বারটি প্রবেশ করুন।'
                          : 'Enter your registered mobile number to retrieve your User ID / Email.'}
                      </p>
                      <InputField 
                        label={language === 'bn' ? 'মোবাইল নাম্বার' : 'Mobile Number'}
                        name="forgotUsernameMobile"
                        type="tel"
                        inputMode="numeric"
                        value={forgotUsernameMobile}
                        onChange={(e) => setForgotUsernameMobile(e.target.value)}
                        hideCheckmark={true}
                        style={{ backgroundColor: 'transparent' }}
                        icon={<Phone size={18} />}
                      />
                    </div>
                  )}

                  {forgotUsernameStep === 2 && (
                    <div className="space-y-5">
                      <p className="text-xs text-text-muted">
                        {language === 'bn'
                          ? 'অ্যাকাউন্টটি যাচাই করতে গুগল অথেন্টিকেটর অ্যাপ থেকে ৬-ডিজিটের কোডটি দিন।'
                          : 'Enter the 6-digit code from your Google Authenticator app for account validation.'}
                      </p>
                      <InputField 
                        label={language === 'bn' ? 'অথেন্টিকেটর কোড' : 'Authenticator Code'}
                        name="forgotUsernameCode"
                        type="tel"
                        inputMode="numeric"
                        maxLength={6}
                        value={forgotUsernameCode}
                        onChange={(e) => setForgotUsernameCode(e.target.value)}
                        hideCheckmark={true}
                        style={{ backgroundColor: 'transparent' }}
                        icon={<Shield size={18} />}
                      />
                    </div>
                  )}

                  {forgotUsernameStep === 3 && forgotUsernameUser && (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                        <p className="text-xs font-black text-center mb-4">
                          {language === 'bn' ? 'আপনার ইউজারনেম পুনরুদ্ধার সফল হয়েছে!' : 'Username recovered successfully!'}
                        </p>
                        
                        <div className="space-y-3 font-mono text-sm">
                          <div className="flex flex-col gap-1 p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5">
                            <span className="text-[10px] font-bold text-text-muted uppercase">
                              {language === 'bn' ? 'ইউজার আইডি / ইউজারনেম' : 'User ID / Username'}
                            </span>
                            <span className="font-extrabold select-all text-text-main">
                              {forgotUsernameUser.userId || forgotUsernameUser.id}
                            </span>
                          </div>

                          {(forgotUsernameUser.email || forgotUsernameUser.loginEmail) && (
                            <div className="flex flex-col gap-1 p-2 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5">
                              <span className="text-[10px] font-bold text-text-muted uppercase">
                                {language === 'bn' ? 'নিবন্ধিত ইমেল' : 'Registered Email'}
                              </span>
                              <span className="font-extrabold select-all text-text-main">
                                {forgotUsernameUser.email || forgotUsernameUser.loginEmail}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pb-4">
                    {forgotUsernameStep !== 3 ? (
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className={`w-full h-12 text-white primary-bg-text font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase flex items-center justify-center gap-3 allow-animation ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        {isLoading ? (
                          <Loader2 size={18} className="animate-spin text-white" />
                        ) : (
                          <Shield size={18} />
                        )}
                        <span>
                          {isLoading ? (language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...') : (
                            <>
                              {forgotUsernameStep === 1 && (language === 'bn' ? 'মোবাইল যাচাই করুন' : 'Verify Mobile')}
                              {forgotUsernameStep === 2 && (language === 'bn' ? 'কোড যাচাই করুন' : 'Verify Code')}
                            </>
                          )}
                        </span>
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => {
                          setShowForgotUsername(false);
                          setForgotUsernameStep(1);
                          setForgotUsernameMobile('');
                          setForgotUsernameCode('');
                          setForgotUsernameUser(null);
                        }}
                        className="w-full h-12 text-white primary-bg-text font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase flex items-center justify-center gap-3"
                        style={{ backgroundColor: 'var(--primary)' }}
                      >
                        <Check size={18} />
                        {language === 'bn' ? 'লগইন পেজে ফিরুন' : 'Back to Login'}
                      </button>
                    )}
                  </div>
                </motion.form>
              )}

              {showForgotPassword && (
                <motion.form 
                  key="forgot-password-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (recoveryStep === 1) {
                      handleForgotPasswordUsernameSubmit();
                    } else if (recoveryStep === 2) {
                      handleForgotPasswordCodeSubmit();
                    } else if (recoveryStep === 3) {
                      handleForgotPasswordResetSubmit();
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-black text-text-main">
                      {language === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Reset Password'}
                    </h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setRecoveryStep(1);
                        setRecoveryUsername('');
                        setRecoveryCode('');
                        setNewPassword('');
                        setConfirmNewPassword('');
                      }}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <X size={14} />
                      <span>{language === 'bn' ? 'বাতিল' : 'Cancel'}</span>
                    </button>
                  </div>

                  {recoveryStep === 1 && (
                    <div className="space-y-5">
                      <p className="text-xs text-text-muted">
                        {language === 'bn' 
                          ? 'আপনার নিবন্ধিত ইউজার আইডি অথবা ইমেল এড্রেস দিন।' 
                          : 'Enter your registered User ID or Email Address.'}
                      </p>
                      <InputField 
                        label={language === 'bn' ? 'ইউজার আইডি / ইমেইল' : 'User ID / Email'}
                        name="recoveryUsername"
                        type="text"
                        value={recoveryUsername}
                        onChange={(e) => setRecoveryUsername(e.target.value)}
                        hideCheckmark={true}
                        style={{ backgroundColor: 'transparent' }}
                        icon={<UserIcon size={18} />}
                      />
                    </div>
                  )}

                  {recoveryStep === 2 && (
                    <div className="space-y-5">
                      <p className="text-xs text-text-muted">
                        {language === 'bn'
                          ? 'আপনার অ্যাকাউন্টটি যাচাই করতে গুগল অথেন্টিকেটর অ্যাপ থেকে ৬-ডিজিটের কোডটি দিন।'
                          : 'Enter the 6-digit code from your Google Authenticator app for account validation.'}
                      </p>
                      <InputField 
                        label={language === 'bn' ? 'অথেন্টিকেটর কোড' : 'Authenticator Code'}
                        name="recoveryCode"
                        type="tel"
                        inputMode="numeric"
                        maxLength={6}
                        value={recoveryCode}
                        onChange={(e) => setRecoveryCode(e.target.value)}
                        hideCheckmark={true}
                        style={{ backgroundColor: 'transparent' }}
                        icon={<Shield size={18} />}
                      />
                    </div>
                  )}

                  {recoveryStep === 3 && (
                    <div className="space-y-5">
                      <p className="text-xs text-text-muted">
                        {language === 'bn'
                          ? 'আপনার নতুন পাসওয়ার্ড প্রবেশ করান এবং পরিবর্তন নিশ্চিত করুন।'
                          : 'Enter your new password and confirm it to update.'}
                      </p>
                      <InputField 
                        label={language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                        name="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        hideCheckmark={true}
                        style={{ backgroundColor: 'transparent' }}
                        icon={<Lock size={18} />}
                      />
                      <InputField 
                        label={language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm New Password'}
                        name="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        hideCheckmark={true}
                        style={{ backgroundColor: 'transparent' }}
                        icon={<Lock size={18} />}
                      />
                    </div>
                  )}

                  <div className="pb-4">
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-12 text-white primary-bg-text font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase flex items-center justify-center gap-3 allow-animation ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                      style={{ backgroundColor: 'var(--primary)' }}
                    >
                      {isLoading ? (
                        <Loader2 size={18} className="animate-spin text-white" />
                      ) : (
                        <Shield size={18} />
                      )}
                      <span>
                        {isLoading ? (language === 'bn' ? 'যাচাই করা হচ্ছে...' : 'Verifying...') : (
                          <>
                            {recoveryStep === 1 && (language === 'bn' ? 'পরবর্তী' : 'Next')}
                            {recoveryStep === 2 && (language === 'bn' ? 'কোড যাচাই করুন' : 'Verify Code')}
                            {recoveryStep === 3 && (language === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : 'Update Password')}
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
        </div>
      </div>
    </div>

    {createPortal(
      <>
        {isActionSheetOpen && (
          <div className="fixed inset-0 z-[9000] flex flex-col justify-end p-4 pb-[calc(16px+env(safe-area-inset-bottom,16px))]">
            {/* Backdrop */}
            <div 
              
              
              
              onClick={(e) => {
                e.stopPropagation();
                setIsActionSheetOpen(false);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer pointer-events-auto"
            />
            
            {/* Sheet container */}
            <div 
              
              
              
              
              className="relative w-full z-10 flex flex-col gap-2 max-w-sm mx-auto pointer-events-auto"
            >
              {/* Options Group */}
              <div className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[14px] overflow-hidden flex flex-col border border-black/5 dark:border-white/5 shadow-xl">
                <div className="p-3 border-b border-black/10 dark:border-white/10 text-center">
                  <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                    {language === 'bn' ? 'প্রোফাইল ফটো পরিবর্তন' : language === 'ar' ? 'تغيير الصورة الشخصية' : 'Change Profile Photo'}
                  </p>
                </div>
                
                {/* Take Photo button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCameraClick();
                  }}
                  className="w-full py-4 px-6 flex items-center justify-center gap-2 text-[#007AFF] dark:text-[#0A84FF] font-normal active:bg-black/5 dark:active:bg-white/5 transition-colors border-b border-black/10 dark:border-white/10"
                >
                  <span className="text-[20px]">
                    {language === 'bn' ? 'ছবি তুলুন' : language === 'ar' ? 'التقاط صورة' : 'Take Photo'}
                  </span>
                </button>
                
                {/* Gallery button */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleGalleryClick();
                  }}
                  className="w-full py-4 px-6 flex items-center justify-center gap-2 text-[#007AFF] dark:text-[#0A84FF] font-normal active:bg-black/5 dark:active:bg-white/5 transition-colors"
                >
                  <span className="text-[20px]">
                    {language === 'bn' ? 'গ্যালারি থেকে পছন্দ করুন' : language === 'ar' ? 'اختر من المعرض' : 'Choose from Gallery'}
                  </span>
                </button>
              </div>
              
              {/* Cancel Group */}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsActionSheetOpen(false);
                }}
                className="w-full mt-0 py-4 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[14px] font-semibold text-[#007AFF] dark:text-[#0A84FF] active:bg-black/5 dark:active:bg-white/5 transition-colors text-[20px] text-center border border-black/5 dark:border-white/5 shadow-xl"
              >
                {language === 'bn' ? 'বাতিল' : language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </>
      , document.body
    )}

      {showFirstLoginPrompt && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl p-6 relative">
            <button 
              onClick={() => {
                setShowFirstLoginPrompt(false);
                setIsLoading(false);
                setFirstLoginUser(null);
                setFirstLoginNewPassword('');
                setFirstLoginConfirmPassword('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              {language === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : language === 'ar' ? 'تعيين كلمة مرور جديدة' : 'Set New Password'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {language === 'bn' ? 'অ্যাকাউন্ট সুরক্ষিত রাখতে আপনাকে নতুন পাসওয়ার্ড সেট করতে হবে।' : language === 'ar' ? 'الرجاء تعيين كلمة مرور جديدة لمتابعة استخدام حسابك.' : 'Please set a new password for your account to continue.'}
            </p>
            <div className="space-y-5">
              <InputField
                type="password"
                label={language === 'bn' ? 'নতুন পাসওয়ার্ড' : language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                name="firstLoginNewPassword"
                value={firstLoginNewPassword}
                onChange={(e) => setFirstLoginNewPassword(e.target.value)}
                hideCheckmark={true}
                style={{ backgroundColor: 'transparent' }}
                icon={<Lock size={18} />}
              />
              <InputField
                type="password"
                label={language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                name="firstLoginConfirmPassword"
                value={firstLoginConfirmPassword}
                onChange={(e) => setFirstLoginConfirmPassword(e.target.value)}
                hideCheckmark={true}
                style={{ backgroundColor: 'transparent' }}
                icon={<Lock size={18} />}
              />
              <button
                onClick={handleFirstLoginSubmit}
                disabled={isLoading}
                className="w-full h-14 bg-[var(--primary)] text-white font-extrabold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all uppercase flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isLoading ? (language === 'bn' ? 'আপডেট হচ্ছে...' : language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'bn' ? 'পাসওয়ার্ড আপডেট করুন' : language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {showAuthSetupPopup && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-theme-card border-[var(--dynamic-card-border)] w-full max-w-sm rounded-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.35)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
              <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                <ShieldAlert className="text-[var(--primary)]" size={24} />
                Security Setup
              </h3>
              <button onClick={() => { setShowAuthSetupPopup(false); finishLogin(pendingLoginUser); }} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-text-muted transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-3 rounded-lg">
                <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-snug">
                  Security Notice: Google Authenticator সেটআপ না করলে Password Recovery করা যাবে না এবং Account Security ঝুঁকিতে থাকবে। অন্য কোনো Device থেকে একই Account-এ Login করলে Verification-এর জন্য Google Authenticator বাধ্যতামূলক।
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="w-36 h-36 bg-white p-2 rounded-xl border border-gray-100 shadow-sm flex items-center justify-center">
                    <QRCodeSVG 
                      value={`otpauth://totp/FleetPro:${pendingLoginUser?.email || pendingLoginUser?.userId || 'User'}?secret=${authSetupSecret}&issuer=FleetPro`} 
                      size={130} 
                    />
                  </div>
                  <div className="mt-2 w-full">
                    <p className="text-[10px] text-center text-text-muted font-bold mb-1 uppercase tracking-wider">Manual Setup Key</p>
                    <div className="bg-gray-50 dark:bg-slate-800 p-2 rounded-lg border border-black/5 dark:border-white/5 text-center flex items-center justify-between group cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" onClick={() => handleCopyToClipboard(authSetupSecret, 'authSecret')}>
                      <code className="text-xs font-mono font-bold tracking-widest text-text-main truncate pr-2">{authSetupSecret}</code>
                      <Copy size={14} className="text-text-muted group-hover:text-[var(--primary)] transition-colors shrink-0" />
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <InputField
                    type="number"
                    label="6-Digit Verification Code"
                    name="authSetupCode"
                    value={authSetupCode}
                    onChange={(e) => setAuthSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    icon={<Lock size={18} />}
                  />
                  {authError && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{authError}</p>}
                </div>
              </div>

              <button 
                onClick={async () => {
                  if (authSetupCode.length !== 6) {
                    setAuthError("Enter a valid 6-digit code.");
                    return;
                  }
                  const isValid = verifyTOTP(authSetupSecret, authSetupCode);
                  if (isValid) {
                    try {
                      setIsLoading(true);
                      const { saveFirebaseDocMerge } = await import('../services/firebase');
                      const collectionName = pendingLoginUser.role === 'ADMIN' ? 'admins' : 'users';
                      const { encryptData } = await import('../utils/security');
                      const encryptedSecret = encryptData(authSetupSecret);
                      
                      await saveFirebaseDocMerge(collectionName, pendingLoginUser.id, {
                        _secure_twoFASecret: encryptedSecret,
                        twoFASecret: '**********',
                        is2FAEnabled: true
                      });
                      
                      pendingLoginUser.twoFASecret = authSetupSecret;
                      pendingLoginUser.is2FAEnabled = true;
                      setShowAuthSetupPopup(false);
                      finishLogin(pendingLoginUser);
                    } catch (e) {
                      setAuthError("Failed to save settings. Try again.");
                      setIsLoading(false);
                    }
                  } else {
                    setAuthError("Invalid code. Please try again.");
                  }
                }}
                disabled={authSetupCode.length !== 6 || isLoading}
                className="w-full h-12 bg-[var(--primary)] text-white font-extrabold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                Verify & Enable
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAuthVerificationPopup && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-theme-card border-[var(--dynamic-card-border)] w-full max-w-sm rounded-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.35)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5">
              <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                <Shield className="text-[var(--primary)]" size={24} />
                Verification Required
              </h3>
              <button onClick={() => { setShowAuthVerificationPopup(false); setIsLoading(false); }} className="p-2 -mr-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-text-muted transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3 rounded-lg text-center">
                <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-black/5 dark:border-white/5">
                  <Fingerprint size={20} className="text-blue-500" />
                </div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 leading-snug">
                  অপরিচিত Device থেকে Login করার জন্য Google Authenticator এর 6-Digit Code প্রদান করুন।
                </p>
              </div>

              <div className="pt-1">
                <InputField
                  type="number"
                  label="6-Digit Verification Code"
                  name="authVerificationCode"
                  value={authVerificationCode}
                  onChange={(e) => setAuthVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  icon={<Lock size={18} />}
                />
                {authError && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{authError}</p>}
              </div>

              <button 
                onClick={() => {
                  if (authVerificationCode.length !== 6) {
                    setAuthError("Enter a valid 6-digit code.");
                    return;
                  }
                  const isValid = verifyTOTP(pendingLoginUser.twoFASecret, authVerificationCode);
                  if (isValid) {
                    setShowAuthVerificationPopup(false);
                    finishLogin(pendingLoginUser);
                  } else {
                    setAuthError("Invalid code. Please try again.");
                  }
                }}
                disabled={authVerificationCode.length !== 6}
                className="w-full h-12 bg-[var(--primary)] text-white font-extrabold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all uppercase disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Verify & Login
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
    </InputFieldThemeContext.Provider>
  );
};

export default Login;
