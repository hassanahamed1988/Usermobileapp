
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import fleetproLogo from '../assets/logo.png';
import { TRANSLATIONS, THEMES, PRESET_BACKGROUNDS, LIGHT_THEME_PRESETS } from '../constants';
import MultiColorCreator from '@/components/MultiColorCreator';
import { Moon, Sun, Diamond, Globe, Check, ChevronDown, Palette, LogOut, Settings as SettingsIcon, ZoomIn, ZoomOut, Image as ImageIcon, CreditCard, Lock, Shield, Smartphone, Copy, ChevronLeft, ChevronRight, User as UserIcon, X, Plus, Download, Upload, Database, LayoutGrid, RefreshCw, ArrowLeft, Fingerprint, Scan, Sparkles } from 'lucide-react';

import { Theme, Language } from '../types';
import InputField from '../components/InputField';
import { QRCodeSVG } from 'qrcode.react';
import { storageService } from '@/services/storageService';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import * as OTPAuth from 'otpauth';
import { isNativeBiometricSupported, setNativeBiometricCredentials, verifyNativeBiometric, deleteNativeBiometricCredentials } from '@/utils/nativeBiometrics';
import { getFirebaseCollection, saveFirebaseDoc, deleteFirebaseDoc, saveFirebaseDocMerge } from '@/services/firebase';
import bcrypt from 'bcryptjs';

const Settings: React.FC = () => {
  const { theme, setTheme, language, setLanguage, user, setUser, updateUser, logout, setView, zoom, setZoom, wallpaper, setWallpaper, loginWallpaper, setLoginWallpaper, loginBackgroundColor, setLoginBackgroundColor, backgroundColor, setBackgroundColor, fontStyle, setFontStyle, fontSize, setFontSize, fontBold, setFontBold, currencies, selectedCurrency, setSelectedCurrency, showFeedback, setSelectedUser, headerBg, setHeaderBg, setNavBg, appThemeMode, setAppThemeMode, appGrid, setAppGrid, activeSection, setActiveSection, logo, setLogo, exportData, importData, exportLocalData, importLocalData, currentThemeObj, adminPin, setAdminPin, confirmAction, primaryColor: storePrimaryColor, setPrimaryColor, setNavigationDirection, navigationDirection, isNightMode } = useStore();
  const isDarkMode = isNightMode || appThemeMode === 'dark' || theme === 'night-mode';
  const t = TRANSLATIONS[language];
  const primaryColor = storePrimaryColor || currentThemeObj?.primary || '#10b981';

  // PWA Install States and Handlers
  const [isInstallable, setIsInstallable] = useState(() => !!(window as any).deferredPrompt);

  useEffect(() => {
    const handleInstallable = () => {
      setIsInstallable(true);
    };
    const handleInstalled = () => {
      setIsInstallable(false);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) {
      showFeedback(language === 'bn' ? 'অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে বা এই ব্রাউজারে ইনস্টল যোগ্য নয়।' : 'The app is already installed or not supported for direct installation in this browser.', 'error');
      return;
    }
    try {
      promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      if (outcome === 'accepted') {
        showFeedback(language === 'bn' ? 'ইনস্টলেশন শুরু হয়েছে!' : 'Installation started!');
      }
      (window as any).deferredPrompt = null;
      setIsInstallable(false);
    } catch (err) {
      console.error('Error triggering PWA prompt:', err);
    }
  };

  // Biometrics States
  const [isLoginFingerprint, setIsLoginFingerprint] = useState(() => localStorage.getItem('fleetpro_biometric_login_enabled') === 'true');
  const [isFaceLock, setIsFaceLock] = useState(() => localStorage.getItem('fleetpro_biometric_face_enabled') === 'true');
  const [isTransactionFingerprint, setIsTransactionFingerprint] = useState(() => localStorage.getItem('fleetpro_biometric_transaction_enabled') === 'true');
  
  const [showBioVerifyModal, setShowBioVerifyModal] = useState(false);
  const [bioVerifyPassword, setBioVerifyPassword] = useState('');
  const [bioVerifyLoading, setBioVerifyLoading] = useState(false);
  const [pendingToggleType, setPendingToggleType] = useState<'login' | 'face' | 'transaction' | null>(null);

  const handleVerifyBioPassword = async () => {
    if (!bioVerifyPassword) {
      showFeedback(language === 'bn' ? 'পাসওয়ার্ড দিন' : 'Please enter your password', 'error');
      return;
    }
    
    if (!user) return;
    
    setBioVerifyLoading(true);
    
    try {
      const collName = user.role === 'ADMIN' ? 'admins' : 'users';
      const usersCol = await getFirebaseCollection(collName) || [];
      const currentUser = usersCol.find((u: any) => u.id === user.id);
      
      if (!currentUser) {
        showFeedback(language === 'bn' ? 'ব্যবহারকারী পাওয়া যায়নি' : 'User not found', 'error');
        setBioVerifyLoading(false);
        return;
      }
      
      const isCorrect = await bcrypt.compare(bioVerifyPassword, currentUser.password);
      if (!isCorrect) {
        showFeedback(language === 'bn' ? 'ভুল পাসওয়ার্ড!' : 'Incorrect password!', 'error');
        setBioVerifyLoading(false);
        return;
      }
      
      // Save plain password locally before clearing state
      const plainPassword = bioVerifyPassword;
      // Password verified, now check native biometrics
      setShowBioVerifyModal(false);
      setBioVerifyPassword('');
      setBioVerifyLoading(false);
      
      const isSupported = await isNativeBiometricSupported();
      if (!isSupported) {
        showFeedback(language === 'bn' ? 'আপনার ডিভাইসে ফিঙ্গারপ্রিন্ট সাপোর্ট করে না' : 'Biometrics not supported on this device', 'error');
        return;
      }
      
      const verified = await verifyNativeBiometric(
        language === 'bn' ? 'ফিঙ্গারপ্রিন্ট সেটআপ করুন' : 'Setup Fingerprint',
        language === 'bn' ? 'ফিঙ্গারপ্রিন্ট নিশ্চিত করুন' : 'Confirm fingerprint to enable',
        language,
        showFeedback
      );
      
      if (verified) {
        // Use currentUser.userId or currentUser.email or currentUser.id
        const bioUsername = currentUser.userId || currentUser.email || currentUser.id;
        const success = await setNativeBiometricCredentials(bioUsername, plainPassword);
        
        if (success) {
          if (pendingToggleType === 'login') {
            setIsLoginFingerprint(true);
            localStorage.setItem('fleetpro_biometric_login_enabled', 'true');
            showFeedback(language === 'bn' ? 'লগইন ফিঙ্গারপ্রিন্ট সফলভাবে সক্রিয় করা হয়েছে!' : 'Login Fingerprint activated successfully!');
          } else if (pendingToggleType === 'face') {
            setIsFaceLock(true);
            localStorage.setItem('fleetpro_biometric_face_enabled', 'true');
            showFeedback(language === 'bn' ? 'ফেস লক সফলভাবে সক্রিয় করা হয়েছে!' : 'Face Lock activated successfully!');
          } else if (pendingToggleType === 'transaction') {
            setIsTransactionFingerprint(true);
            localStorage.setItem('fleetpro_biometric_transaction_enabled', 'true');
            showFeedback(language === 'bn' ? 'ট্রানজেকশন ফিঙ্গারপ্রিন্ট সফলভাবে সক্রিয় করা হয়েছে!' : 'Transaction Fingerprint activated successfully!');
          }
        } else {
          showFeedback(language === 'bn' ? 'ফিঙ্গারপ্রিন্ট সংরক্ষণ করতে সমস্যা হয়েছে' : 'Failed to save biometric credentials', 'error');
        }
      }
      setPendingToggleType(null);
    } catch (err: any) {
      console.error(err);
      showFeedback(err.message || 'Verification error', 'error');
      setBioVerifyLoading(false);
    }
  };
  
  const handleLogout = () => {
    confirmAction(
      language === 'bn' ? 'আপনি কি লগআউট করতে চান?' : 'Are you sure you want to log out?',
      () => {
        logout();
      },
      {
        title: language === 'bn' ? 'লগআউট' : 'Logout',
        confirmText: language === 'bn' ? 'হ্যাঁ' : 'Yes',
        cancelText: language === 'bn' ? 'না' : 'No'
      }
    );
  };
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const [is2FAEnabled, setIs2FAEnabled] = useState(user?.is2FAEnabled || false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFAUrl, setTwoFAUrl] = useState('');
  const [isFontSelectOpen, setIsFontSelectOpen] = useState(false);
  const [tempApiUrl, setTempApiUrl] = useState(() => localStorage.getItem('API_BASE_URL') || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        await importLocalData(content);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset selection
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const handlePasswordChange = async () => {
    if (newPassword.trim() !== confirmPassword.trim()) {
      showFeedback('New passwords do not match');
      return;
    }
    if (!currentPassword.trim() || !newPassword.trim()) {
      showFeedback('Please fill all password fields');
      return;
    }
    if (user) {
      const bcrypt = await import('bcryptjs');
      const coll = user.role === 'ADMIN' ? 'admins' : 'users';
      
      // Fetch latest user data from Firestore to evaluate Single Source of Truth
      try {
        const { getDocFromServer, doc } = await import('firebase/firestore');
        const { db } = await import('@/services/firebase');
        
        const userDocRef = doc(db, coll, user.id);
        const userDocSnap = await getDocFromServer(userDocRef);
        
        if (!userDocSnap.exists()) {
          showFeedback('User not found in database');
          return;
        }

        const latestUserData = userDocSnap.data();
        const storedPassword = (latestUserData.password || user.password || '').toString();
        const isHashed = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');
        
        let isPasswordCorrect = false;

        // Try standard Firebase Auth reauthenticateWithCredential if we have an active Auth user
        // to conform with instructions, otherwise fallback to database single-source verification.
        try {
          const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
          const { auth } = await import('@/services/firebase');
          if (auth.currentUser && auth.currentUser.email) {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword.trim());
            await reauthenticateWithCredential(auth.currentUser, credential);
            isPasswordCorrect = true;
          }
        } catch (firebaseErr: any) {
          console.log("Firebase Auth reauthentication skipped/unavailable, falling back to database verification:", firebaseErr?.message);
        }
        
        // Log the validation context for debugging (without exposing the actual password strings)
        console.log('Firebase Auth Re-authentication Logic Check:', { 
           hasStoredPassword: !!storedPassword, 
           isHashed 
        });

        if (!isPasswordCorrect) {
          if (isHashed) {
            isPasswordCorrect = await bcrypt.compare(currentPassword.trim(), storedPassword);
            // Default password fallback for admin first-time logins
            if (!isPasswordCorrect && user.role === 'ADMIN' && (user.isFirstLogin !== false) && currentPassword.trim().toLowerCase() === 'admin') {
              isPasswordCorrect = true;
            }
          } else {
            isPasswordCorrect = storedPassword.trim() === currentPassword.trim() || 
                                storedPassword === currentPassword.trim() ||
                                (user.role === 'ADMIN' && currentPassword.trim().toLowerCase() === 'admin');
          }
        }

        if (!isPasswordCorrect) {
          showFeedback('Incorrect Password');
          return;
        }
        
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
        
        // Sync to Firebase Auth
        try {
          const response = await fetch('/api/auth/update-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: user.email,
              password: newPassword.trim()
            })
          });
          if (!response.ok) {
            const errData = await response.json();
            console.warn("Failed to sync updated password to Firebase Auth:", errData);
          }
        } catch (authErr) {
          console.warn("Failed to contact Firebase Auth sync endpoint:", authErr);
        }

        const { saveFirebaseDocMerge } = await import('@/services/firebase');
        
        await saveFirebaseDocMerge(coll, user.id, { 
          password: hashedPassword,
          isFirstLogin: false 
        });
        
        const updatedUser = { ...user, ...latestUserData, password: hashedPassword, isFirstLogin: false };
        updateUser(updatedUser);
        setUser(updatedUser);
        
        showFeedback('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangePasswordModalOpen(false);
      } catch (err) {
        console.error('Failed to update password:', err);
        showFeedback('Failed to update password in database');
      }
    }
  };

  const handleToggle2FA = () => {
    if (!is2FAEnabled) {
      const secret = generateSecret();
      setTwoFASecret(secret);
      const email = user?.email || 'user';
      const totp = new OTPAuth.TOTP({
        issuer: 'FleetPro',
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret)
      });
      setTwoFAUrl(totp.toString());
      setShow2FASetup(true);
    } else {
      if (user) {
        const updatedUser = { ...user, is2FAEnabled: false, twoFASecret: undefined };
        updateUser(updatedUser);
        setIs2FAEnabled(false);
        showFeedback('Google Authenticator disabled');
      }
    }
  };

  const handleConfirm2FA = () => {
    if (authCode.length === 6) {
      if (user) {
        const totp = new OTPAuth.TOTP({
          issuer: 'FleetPro',
          label: user.email || 'user',
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(twoFASecret)
        });
        const delta = totp.validate({ token: authCode, window: 1 });
        if (delta !== null) {
          const updatedUser = { ...user, is2FAEnabled: true, twoFASecret: twoFASecret };
          updateUser(updatedUser);
          setIs2FAEnabled(true);
          setShow2FASetup(false);
          setAuthCode('');
          showFeedback('Google Authenticator enabled successfully');
        } else {
          showFeedback('Invalid or expired code. Please try again.');
        }
      }
    } else {
      showFeedback('Please enter a valid 6-digit code');
    }
  };

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { id: 'ar', label: 'العربية', flag: '🇶🇦' },
    { id: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  ];

  const handleThemeClick = (themeId: Theme) => {
    setTheme(themeId);
    showFeedback('Theme updated successfully');
  };

  const availableThemes = THEMES;

  const isWhiteBg = appThemeMode === 'light' && (!backgroundColor || (backgroundColor?.toLowerCase() || '') === '#ffffff');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  };

  const MenuItem = ({ 
    icon, 
    title, 
    subtitle, 
    onClick, 
    color = "var(--text-main)" 
  }: { 
    icon: React.ReactNode; 
    title: string; 
    subtitle?: string; 
    onClick: () => void; 
    color?: string; 
  }) => {
    const isHex = color.startsWith('#');
    const bgStyle = isHex 
      ? { color: color, backgroundColor: `${color}18` } 
      : { color: color, backgroundColor: 'rgba(var(--primary-rgb, 16, 185, 129), 0.1)' };

    return (
      <button 
        onClick={onClick} 
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] hover:bg-gray-50/50 dark:hover:bg-white/5 active:scale-[0.985] transition-all duration-200 text-left rtl:text-right"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div 
            className="w-12 h-12 rounded-[8px] grid place-items-center flex-shrink-0"
            style={bgStyle}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              size: 22,
              className: "w-5.5 h-5.5 flex-shrink-0 select-none mx-auto my-auto block",
              style: { display: 'block', margin: 'auto', width: '22px', height: '22px', minWidth: '22px', minHeight: '22px' }
            })}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[15px] sm:text-base text-text-main leading-tight truncate">
              {title}
            </span>
            {subtitle && (
              <span className="text-[12px] sm:text-[13px] text-text-muted mt-1 leading-normal font-medium block">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={20} className="text-text-muted ml-3 rtl:mr-3 rtl:ml-0 rtl:rotate-180 flex-shrink-0" />
      </button>
    );
  };

  return (
    <div className="w-full h-full relative">
        {!activeSection ? (
          <div 
            key="main-list"
            className="absolute inset-0 w-full h-full flex flex-col overflow-y-auto px-global pt-global pb-[calc(76px+env(safe-area-inset-bottom)+16px)] space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MenuItem 
                icon={<UserIcon />} 
                title={t.MY_PROFILE} 
                subtitle={language === 'bn' ? 'ব্যক্তিগত প্রোফাইল তথ্য দেখুন' : 'View and edit your personal details'}
                onClick={() => {
                  setSelectedUser(null);
                  setView('USER_PROFILE');
                }} 
                color="#2563eb"
              />
              <MenuItem 
                icon={<Palette />} 
                title={t.APP_THEME} 
                subtitle={language === 'bn' ? 'লাইট, ডার্ক বা নাইট মোড নির্বাচন করুন' : 'Choose light, dark, or night mode'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('THEME');
                }} 
                color="#ea580c"
              />
              <MenuItem 
                icon={<Sparkles />} 
                title={language === 'bn' ? 'অ্যাপ লোগো' : 'App Logo'} 
                subtitle={language === 'bn' ? 'কাস্টম অ্যাপ লোগো আপলোড এবং পরিবর্তন করুন' : 'Upload and customize application logo'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('APP_LOGO');
                }} 
                color="#10b981"
              />
              <MenuItem 
                icon={<ImageIcon />} 
                title={t.THEME_SETTINGS} 
                subtitle={language === 'bn' ? 'প্রিসেট কালার প্যালেটসমূহ' : 'Preset color palettes'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('THEME_SETTINGS');
                }} 
                color="#8b5cf6"
              />
              <MenuItem 
                icon={<Shield />} 
                title={t.SECURITY_PASSWORD} 
                subtitle={language === 'bn' ? 'লগইন পাসওয়ার্ড পরিবর্তন ও আপডেট করুন' : 'Update your login password'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('SECURITY');
                }} 
                color="#f43f5e"
              />
              <MenuItem 
                icon={<Fingerprint />} 
                title={language === 'bn' ? 'বায়োমেট্রিক সিকিউরিটি' : 'Biometric Security'} 
                subtitle={language === 'bn' ? 'ফিঙ্গারপ্রিন্ট এবং ফেস আইডি লগইন' : 'Fingerprint and Face ID login'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('BIOMETRICS');
                }} 
                color="#6366f1"
              />
              <MenuItem 
                icon={<ZoomIn />} 
                title={t.SCREEN_ZOOM} 
                subtitle={language === 'bn' ? 'ডিসপ্লে ইন্টারফেসের স্কেল পরিবর্তন করুন' : 'Adjust display interface scale'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('ZOOM');
                }} 
                color="#3b82f6"
              />
              <MenuItem 
                icon={<SettingsIcon />} 
                title={t.TYPOGRAPHY} 
                subtitle={language === 'bn' ? 'অ্যাপের ফন্ট এবং ফন্ট সাইজ কাস্টমাইজ করুন' : 'Customize app fonts and sizes'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('TYPOGRAPHY');
                }} 
                color="#06b6d4"
              />
              <MenuItem 
                icon={<Globe />} 
                title={t.LANGUAGE} 
                subtitle={language === 'bn' ? 'বাংলা, ইংরেজি, আরবি, হিন্দি' : language === 'ar' ? 'العربية، الإنجليزية، البنغالية، الهندية' : language === 'hi' ? 'हिन्दी, अंग्रेज़ी, बांग्ला, अरबी' : 'Bangla, English, Arabic, Hindi'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('LANGUAGE');
                }} 
                color="#0d9488"
              />
              <MenuItem 
                icon={<CreditCard />} 
                title={t.CURRENCY} 
                subtitle={language === 'bn' ? 'বিডিটি, কিউএআর, ইউএসডি' : 'BDT, QAR, USD'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('CURRENCY');
                }} 
                color="#d97706"
              />
              <MenuItem 
                icon={<Download />} 
                title={language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install FleetPro App'} 
                subtitle={language === 'bn' ? 'হোম স্ক্রিনে শর্টকাট হিসেবে যুক্ত করুন' : 'Add to home screen as PWA'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('PWA_INSTALL');
                }} 
                color="#10b981"
              />
              <MenuItem 
                icon={<Database />} 
                title={t.DATA_BACKUP} 
                subtitle={language === 'bn' ? 'অফলাইনে ডাটাবেস এক্সপোর্ট এবং ইম্পোর্ট করুন' : 'Export and import database offline'}
                onClick={() => {
                  setNavigationDirection('forward');
                  setActiveSection('BACKUP');
                }} 
                color="#0f766e"
              />
              {user?.role === 'ADMIN' && (
                <MenuItem 
                  icon={<Smartphone />} 
                  title="Server Connection (APK)" 
                  subtitle={language === 'bn' ? 'এক্সটার্নাল সার্ভার হোস্ট কনফিগার করুন' : 'Configure external server hosts'}
                  onClick={() => {
                    setNavigationDirection('forward');
                    setActiveSection('SERVER_CONNECTION');
                  }} 
                  color="#4b5563"
                />
              )}
            </div>

             <div className="mt-8">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 sm:p-5 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] hover:bg-red-50/10 dark:hover:bg-red-950/20 active:scale-[0.985] transition-all duration-200 text-left rtl:text-right"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div 
                    className="w-12 h-12 rounded-[8px] grid place-items-center flex-shrink-0"
                    style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                  >
                    <LogOut 
                      size={22} 
                      className="w-5.5 h-5.5 flex-shrink-0 select-none mx-auto my-auto block"
                      style={{ display: 'block', margin: 'auto', width: '22px', height: '22px', minWidth: '22px', minHeight: '22px' }}
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-[15px] sm:text-base text-red-600 leading-snug truncate">
                      {t.LOGOUT}
                    </span>
                    <span className="text-[12px] sm:text-[13px] text-red-500/80 mt-1 leading-normal font-medium block">
                      {language === 'bn' ? 'আপনার অ্যাকাউন্ট থেকে নিরাপদে সাইন আউট করুন' : 'Sign out of your account securely'}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-red-500/60 ml-3 rtl:mr-3 rtl:ml-0 rtl:rotate-180 flex-shrink-0" />
              </button>
            </div>

          </div>
        ) : (
          <div 
            key={activeSection}
            className={`absolute inset-0 w-full h-full flex flex-col overflow-y-auto px-global pt-global pb-[calc(76px+env(safe-area-inset-bottom)+16px)] space-y-4 settings-active-container`}
          >

            {activeSection === 'APP_LOGO' && (
              <div className="space-y-6">
                <div className="p-4 bg-theme-card rounded-lg border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-6">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-24 h-24 bg-black/5 dark:bg-white/5 rounded-2xl flex items-center justify-center p-2 mb-1 border border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
                      <img 
                        src={logo || fleetproLogo} 
                        alt="App Logo" 
                        loading="eager"
                        decoding="sync"
                        className="w-full h-full object-contain rounded-lg drop-shadow-md"
                        onError={(e) => {
                          if (e.currentTarget.src !== fleetproLogo) {
                            e.currentTarget.src = fleetproLogo;
                          }
                        }}
                      />
                    </div>
                    <h2 className="text-lg font-black text-text-main uppercase">
                      {language === 'bn' ? 'অ্যাপ লোগো কাস্টমাইজেশন' : 'App Logo Customization'}
                    </h2>
                    <p className="text-xs text-text-muted font-bold max-w-[320px]">
                      {language === 'bn'
                        ? 'আপনার পছন্দের অ্যাপ লোগো নির্বাচন করুন। ফাইলটি তার অরিজিনাল সাইজ ও ফরমেটে সংরক্ষণ থাকবে।'
                        : 'Upload your application logo. The image will be preserved in its exact original format and quality.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-text-main uppercase mb-2">
                        {language === 'bn' ? 'নতুন লোগো আপলোড করুন' : 'Upload New Logo'}
                      </label>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const res = reader.result as string;
                              if (res) {
                                setLogo(res);
                                showFeedback(
                                  language === 'bn' 
                                    ? 'অ্যাপ লোগো সফলভাবে আপডেট করা হয়েছে' 
                                    : 'App logo updated successfully'
                                );
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-xs text-text-main file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[var(--primary)] file:text-white hover:file:opacity-90 cursor-pointer file:cursor-pointer transition-all !border-0 !outline-none"
                      />
                    </div>

                    {logo && logo !== fleetproLogo && (
                      <button 
                        type="button"
                        onClick={() => {
                          setLogo(fleetproLogo);
                          showFeedback(
                            language === 'bn' 
                              ? 'ডিফল্ট লোগো পুনরায় সেট করা হয়েছে' 
                              : 'Default logo restored'
                          );
                        }}
                        className="w-full py-2.5 px-4 text-red-500 hover:text-red-600 font-bold text-xs rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-[0.98] transition-all border border-red-500/20 flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={14} />
                        <span>{language === 'bn' ? 'ডিফল্ট লোগোতে ফিরে যান' : 'Restore Default Logo'}</span>
                      </button>
                    )}

                    <div className="flex gap-2.5 bg-blue-50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[11px] text-blue-700 dark:text-blue-400 font-bold leading-normal">
                        {language === 'bn' 
                          ? 'বি.দ্র.: কাস্টম লোগো আপলোড করলে এটি অ্যাপের হেডার, নেভিগেশন ও লগইন স্ক্রিনে পরিবর্তন হবে। কাস্টম লোগো এবং অ্যান্ড্রয়েড APK অ্যাপ্লিকেশন বিল্ডের লোগো সম্পূর্ণ ভিন্ন ও স্বাধীন থাকবে।'
                          : 'Note: Uploading a custom logo updates all web/app headers and sign-in screens in real time. Custom web logo and native Android APK launcher build logos are independent.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'SERVER_CONNECTION' && (
              <div className="space-y-6">
                <div className="p-4 bg-theme-card rounded-lg border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-6">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-2" style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                      <Smartphone size={32} />
                    </div>
                    <h2 className="text-lg font-black text-text-main uppercase">Server Connection</h2>
                    <p className="text-xs text-text-muted font-bold max-w-[280px]">
                      Configure the remote backend API address for document scanning (OCR) and Gemini AI Chat inside the Release APK.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <InputField
                        label="API Base URL / Server Domain"
                        name="apiUrl"
                        type="url"
                        value={tempApiUrl}
                        onChange={(e) => setTempApiUrl(e.target.value)}
                      />
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-2 font-black uppercase">
                        Current Effective API Endpoint:
                        <code className="block bg-gray-100 dark:bg-zinc-850 p-2 rounded mt-1 font-mono break-all text-xs text-[var(--primary)] font-normal normal-case">
                          {tempApiUrl.trim() || 'https://fleetpromanager-1991.web.app'}
                        </code>
                      </p>
                    </div>
                    <div className="flex gap-2 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                      <p className="text-[10px] text-yellow-700 dark:text-yellow-500 font-bold leading-normal">
                        Note: Leave empty to automatically fallback to FleetPro's default system servers. If you host a private backend server, enter its full secure address starting with https://.
                      </p>
                    </div>
                    <div className="flex justify-end pt-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTempApiUrl('');
                          localStorage.removeItem('API_BASE_URL');
                          deleteFirebaseDoc('settings', 'backend');
                          showFeedback('Reset to Default Server URL for all users');
                        }}
                        className="text-xs font-black uppercase tracking-wider text-red-500 bg-red-500/10 hover:bg-red-500/20 h-10 px-4 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <X size={14} />
                        Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (tempApiUrl.trim()) {
                            localStorage.setItem('API_BASE_URL', tempApiUrl.trim());
                            saveFirebaseDoc('settings', 'backend', { url: tempApiUrl.trim() });
                            showFeedback('Server URL saved for all users');
                          }
                        }}
                        className="text-xs font-black uppercase tracking-wider text-white h-10 px-6 rounded-lg flex items-center gap-1 transition-colors"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Check size={14} />
                        Save for All Users
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'PWA_INSTALL' && (
              <div className="space-y-6">
                <div className="p-5 bg-theme-card rounded-xl border-[var(--dynamic-card-border)] space-y-6 shadow-[var(--dynamic-card-shadow)]">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-2" style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                      <Download size={32} />
                    </div>
                    <h2 className="text-lg font-black text-text-main uppercase">
                      {language === 'bn' ? 'অ্যাপ ইনস্টল করুন' : 'Install FleetPro'}
                    </h2>
                    <p className="text-xs text-text-muted font-bold max-w-[280px]">
                      {language === 'bn' 
                        ? 'আপনার ডিভাইসে সরাসরি Fleetpro ইনস্টল করুন এবং অফলাইন সুবিধা সহ একটি নেটিভ অ্যাপের মতো ব্যবহার করুন।' 
                        : 'Install FleetPro directly on your device and use it like a native application with offline support.'}
                    </p>
                  </div>

                  {isInstallable ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-center">
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                          {language === 'bn' 
                            ? 'অভিনন্দন! আপনার ব্রাউজার সরাসরি ইনস্টলেশন সমর্থন করে।' 
                            : 'Great! Your browser supports direct PWA installation.'}
                        </p>
                      </div>
                      <button
                        onClick={handleInstallApp}
                        className="w-full h-14 text-white rounded-lg font-bold text-xs shadow-sm active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Download size={18} />
                        {language === 'bn' ? 'ইনস্টল শুরু করুন' : 'Install Now'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-left space-y-3">
                        <p className="text-xs text-yellow-700 dark:text-yellow-500 font-black uppercase">
                          {language === 'bn' ? 'কীভাবে ইনস্টল করবেন (How to Install)' : 'How to Install'}
                        </p>
                        <ul className="text-xs text-text-main font-bold list-disc pl-4 space-y-2">
                          {language === 'bn' ? (
                            <>
                              <li>ব্রাউজারের উপরের ডানদিকের <b>৩-ডট মেনু (⋮)</b> বা শেয়ার আইকনে ক্লিক করুন।</li>
                              <li>মেনু থেকে <b>"Add to Home Screen"</b> বা <b>"Install App"</b> নির্বাচন করুন।</li>
                              <li>নিশ্চিত করতে <b>"Add"</b> বা <b>"Install"</b> বোতামে ক্লিক করুন।</li>
                              <li>অ্যাপটি আপনার হোম স্ক্রিনে ইনস্টল হয়ে যাবে এবং নেটিভ অ্যাপের মতো চলবে।</li>
                            </>
                          ) : (
                            <>
                              <li>Click the <b>3-dots menu (⋮)</b> or Share button in your browser's toolbar.</li>
                              <li>Select <b>"Add to Home Screen"</b> or <b>"Install App"</b> from the options.</li>
                              <li>Tap <b>"Add"</b> or <b>"Install"</b> to confirm.</li>
                              <li>The app will launch in full screen, without a browser bar, just like a native app.</li>
                            </>
                          )}
                        </ul>
                      </div>
                      <button
                        disabled
                        className="w-full h-14 bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 rounded-lg font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
                      >
                        <Check size={18} />
                        {language === 'bn' ? 'ইনস্টলেশন অপশন সক্রিয়' : 'Install Option Enabled'}
                      </button>
                    </div>
                  )}

                  <div className="p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg space-y-2">
                    <p className="text-[10px] text-text-muted font-black uppercase">
                      {language === 'bn' ? 'সুবিধাসমূহ' : 'Key Benefits'}
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-text-main uppercase">
                          {language === 'bn' ? 'অফলাইন অ্যাক্সেস' : 'Offline Access'}
                        </p>
                        <p className="text-[10px] text-text-muted font-bold">
                          {language === 'bn' ? 'ইন্টারনেট ছাড়াই লোড হবে' : 'Loads instantly without internet'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-text-main uppercase">
                          {language === 'bn' ? 'ফুল স্ক্রিন মোড' : 'Standalone Mode'}
                        </p>
                        <p className="text-[10px] text-text-muted font-bold">
                          {language === 'bn' ? 'কোনো ব্রাউজার বার থাকবে না' : 'No address bar or tabs'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'BACKUP' && (
              <div className="space-y-6">
                <div className="p-5 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] space-y-6 shadow-[var(--dynamic-card-shadow)]">
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-2" style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                      <Database size={32} />
                    </div>
                    <h2 className="text-lg font-black text-text-main uppercase">Backup & Restore</h2>
                    <p className="text-xs text-text-muted font-bold max-w-[280px]">
                      Securely export or restore your application data offline or to the cloud.
                    </p>
                  </div>

                  {/* 2. Google Drive Backup Option */}
                  <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 bg-theme-card/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1 px-2.5 rounded text-[10px] uppercase font-black tracking-widest bg-emerald-500 text-white">
                          Cloud
                        </div>
                        <h3 className="text-xs font-black uppercase text-text-main">Google Drive Cloud</h3>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted font-bold leading-relaxed">
                      Save your backup file directly in a secure, hidden folder in your Google Drive cloud storage. Firestore serves as the application's real-time sync database, while Google Drive acts as standard file-level cloud backups.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        
                        onClick={exportData}
                        className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
                      >
                        <Download size={16} />
                        Cloud Export
                      </button>

                      <button
                        
                        onClick={importData}
                        className="h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-md cursor-pointer transition-colors"
                      >
                        <Upload size={16} />
                        Cloud Import
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-900/20">
                    <p className="text-[10px] text-yellow-700 dark:text-yellow-500 font-bold leading-relaxed">
                      <span className="uppercase block mb-1">Important:</span>
                      Restoring data will overwrite your current local data and reload the application. Please ensure you have backed up your current data securely if needed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'THEME' && (
              <>
                <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-3 allow-animation">
                  <div className="flex items-center gap-2 mb-1">
                    <Palette size={18} style={{ color: primaryColor }} />
                    <p className="text-xs font-black text-text-main uppercase">
                      {language === 'bn' ? 'অ্যাপ থিম মোড' : 'App Theme Mode'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'dark', label: language === 'bn' ? 'ডার্ক মোড' : 'Dark Mode', icon: <Moon size={18} /> },
                      { id: 'light', label: language === 'bn' ? 'লাইট মোড' : 'Light Mode', icon: <Sun size={18} /> }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setAppThemeMode(mode.id as any);
                          showFeedback(`${mode.label} activated`);
                        }}
                        className={`relative flex items-center justify-center gap-2 p-4 rounded-[10px] border transition-all duration-300 ${
                          appThemeMode === mode.id
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-bold'
                            : 'border-[var(--dynamic-card-border)] bg-theme-card hover:bg-gray-50/50 dark:hover:bg-white/5 text-text-main'
                        }`}
                      >
                        {mode.icon}
                        <span className="text-xs sm:text-sm uppercase tracking-tight">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeSection === 'SECURITY' && (
              <div className="space-y-6">
                <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black text-text-main uppercase mb-1">
                      {language === 'bn' ? 'লগইন পাসওয়ার্ড' : 'Change Password'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {language === 'bn' ? 'আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করুন' : 'Ensure your account security'}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    className="px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-colors uppercase tracking-widest text-white whitespace-nowrap"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {language === 'bn' ? 'চেঞ্জ পাসওয়ার্ড' : 'Update Password'}
                  </button>
                </div>

                <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone size={16} style={{ color: 'var(--text-main)' }} />
                      <p className="text-xs font-black text-text-main uppercase">Google Authenticator</p>
                    </div>
                    <button 
                      onClick={handleToggle2FA}
                      className={`w-12 h-6 rounded-full transition-colors relative ${is2FAEnabled ? '' : 'bg-gray-300 dark:bg-gray-600'}`}
                      style={is2FAEnabled ? { backgroundColor: primaryColor } : {}}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${is2FAEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                  
                  {show2FASetup && !is2FAEnabled && (
                    <div className="mt-4 space-y-4">
                      <p className="text-xs font-black text-text-main text-center">Scan this QR code with your Google Authenticator app</p>
                      <div className="flex justify-center bg-white p-2 rounded-lg inline-block mx-auto shadow-sm">
                        {twoFAUrl && <QRCodeSVG value={twoFAUrl} size={150} />}
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-text-main uppercase font-black mb-1">Or enter this code manually</p>
                        <div className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg">
                          <p className="text-xs font-mono font-black text-text-main tracking-widest">{twoFASecret}</p>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(twoFASecret);
                              showFeedback('Secret key copied to clipboard');
                            }}
                            className={`p-1 text-text-main hover:text-[var(--primary)] transition-colors`}
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <InputField 
                        label="Authentication Code" 
                        type="tel" 
                        inputMode="numeric" 
                        value={authCode} 
                        onChange={(e) => setAuthCode(e.target.value)} 
                      />
                      <div className="flex gap-2 pb-2">
                        <button 
                          onClick={() => setShow2FASetup(false)}
                          className="flex-1 h-14 bg-red-500 text-white rounded-lg font-bold text-xs active:scale-95 transition-colors uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleConfirm2FA}
                          className="flex-1 h-14 text-white rounded-lg font-bold text-xs shadow-sm active:scale-95 transition-colors uppercase tracking-widest"
                          style={{ backgroundColor: primaryColor }}
                        >
                          Verify & Enable
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                </div>
            )}

            {activeSection === 'ZOOM' && (
              <div className="flex items-center justify-between p-4 bg-theme-card rounded-lg border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)]">
                <button 
                  
                  onClick={() => {
                    setZoom(Math.max(0.5, zoom - 0.1));
                    showFeedback('Zoom level decreased');
                  }}
                  className={`w-16 h-16 flex items-center justify-center bg-transparent rounded-full text-text-main transition-colors shadow-sm`}
                >
                  <ZoomOut size={24} />
                </button>
                <div className="text-center">
                  <p className="text-4xl font-black" style={{ color: primaryColor }}>{Math.round(zoom * 100)}%</p>
                  <p className="text-xs font-black text-text-main uppercase mt-2">Zoom</p>
                </div>
                <button 
                  
                  onClick={() => {
                    setZoom(Math.min(1.5, zoom + 0.1));
                    showFeedback('Zoom level increased');
                  }}
                  className={`w-16 h-16 flex items-center justify-center bg-transparent rounded-full text-text-main transition-colors shadow-sm`}
                >
                  <ZoomIn size={24} />
                </button>
              </div>
            )}

            {activeSection === 'TYPOGRAPHY' && (
              <div className="space-y-4">
                <div className="p-3 bg-theme-card rounded-lg border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-2">
                  <div>
                    <label className="text-xs font-black text-text-main uppercase mb-2 block">Font Style</label>
                    <button
                      type="button"
                      onClick={() => setIsFontSelectOpen(true)}
                      className="w-full h-14 px-4 rounded-lg bg-white dark:bg-gray-800 border border-neutral-200 dark:border-zinc-850 flex items-center justify-between font-bold text-sm text-text-main transition-colors active:scale-[0.99]"
                    >
                      <span>{fontStyle}</span>
                      <ChevronDown size={16} className="text-text-muted" />
                    </button>

                    <GlobalFullscreenSelect
                      isOpen={isFontSelectOpen}
                      onClose={() => setIsFontSelectOpen(false)}
                      onSelect={(val) => {
                        setFontStyle(val);
                        setIsFontSelectOpen(false);
                      }}
                      options={["Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Calibri"].map(f => ({ label: f, value: f }))}
                      title={language === 'bn' ? 'ফন্ট স্টাইল নির্বাচন' : 'Select Font Style'}
                      selectedValue={fontStyle}
                      searchable={false}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-black text-text-main uppercase">Font Size</label>
                      <span className="text-xs font-bold" style={{ color: primaryColor }}>{fontSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="24" 
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: primaryColor }}
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="text-xs font-black text-text-main uppercase">Bold Font</label>
                    <button 
                      onClick={() => setFontBold(!fontBold)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${fontBold ? '' : 'bg-gray-300 dark:bg-gray-600'}`}
                      style={fontBold ? { backgroundColor: primaryColor } : {}}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${fontBold ? 'left-7' : 'left-1'}`} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-theme-card rounded-lg border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)]">
                  <p className="text-xs font-bold text-text-muted uppercase mb-2">Preview</p>
                  <p className="text-text-main mt-2">The quick brown fox jumps over the lazy dog.</p>
                  <p className="text-text-main mt-2">১২৩৪৫৬৭৮৯০</p>
                </div>
              </div>
            )}

            {activeSection === 'THEME_SETTINGS' && (
              <div className="space-y-3">
                {/* Default Preset Themes Card */}
                <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette size={18} style={{ color: primaryColor }} />
                    <p className="text-xs font-black text-text-main uppercase">
                      {language === 'bn' ? 'ডিফল্ট থিম কালার' : 'Default Theme Colors'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LIGHT_THEME_PRESETS.map((preset) => {
                      const isSelected = primaryColor === preset.primary && backgroundColor === preset.bg;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => {
                            setPrimaryColor(preset.primary);
                            setBackgroundColor(preset.bg);
                            setHeaderBg(preset.header);
                            setNavBg(preset.header);
                            setWallpaper('');
                            showFeedback(
                              language === 'bn' 
                                ? `${preset.name} থিম সেট করা হয়েছে` 
                                : `${preset.name} theme activated`
                            );
                          }}
                          className="p-2.5 rounded-[10px] border flex flex-col items-center gap-1.5 transition-colors text-center group cursor-pointer"
                          style={{
                            backgroundColor: isSelected
                              ? `${primaryColor}20`
                              : (isDarkMode ? '#121212' : '#e3e3e3'),
                            border: isSelected
                              ? `1px solid ${primaryColor}`
                              : 'var(--dynamic-card-border)'
                          }}
                        >
                          {/* Sample Color Bubbles */}
                          <div className="flex gap-1">
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-inner" style={{ background: preset.header }} />
                            <span className="w-5 h-5 rounded-full border border-black/10 shadow-inner" style={{ background: preset.bg }} />
                          </div>
                          <span 
                            className="text-[10px] font-black uppercase tracking-tight"
                            style={{ 
                              color: isSelected 
                                ? primaryColor 
                                : (isDarkMode ? '#ffffff' : '#000000') 
                            }}
                          >
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Layout Color Selector */}
                <MenuItem 
                  icon={<LayoutGrid size={20} />} 
                  title="Layout Color" 
                  onClick={() => setActiveSection('LAYOUT_COLOR_SETTINGS')} 
                  color={primaryColor}
                />

                {/* Multiple Color Menu Item */}
                <MenuItem 
                  icon={<Palette size={20} />} 
                  title={t.MULTI_COLOR_THEME} 
                  onClick={() => setActiveSection('MULTI_COLOR_SETTINGS')} 
                  color="var(--primary)"
                />

                {/* Main App Background Image */}
                <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon size={18} style={{ color: primaryColor }} />
                    <p className="text-xs font-black text-text-main uppercase">App Background Image</p>
                  </div>
                  
                  <div className="space-y-2">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setWallpaper(reader.result as string);
                            // A solid backgroundColor takes priority over wallpaper when
                            // computing text/header contrast (see App.tsx effectiveBg), so
                            // clear it here — otherwise a stale color from a previous
                            // preset can make text illegible against the new photo.
                            setBackgroundColor('');
                            showFeedback('App wallpaper updated');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-text-main file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[var(--primary)] file:text-white hover:file:opacity-90 cursor-pointer file:cursor-pointer transition-colors !border-0 !outline-none"
                    />
                  </div>

                  {wallpaper && (
                    <button 
                      onClick={() => {
                        setWallpaper('');
                        showFeedback('App wallpaper removed');
                      }}
                      className="w-full py-2 text-red-500 font-bold text-xs rounded-lg hover:bg-red-50 active:scale-[0.98] transition-colors border border-red-500/10"
                    >
                      Remove App Wallpaper
                    </button>
                  )}
                </div>

                {/* Login Page Background Image */}
                {user?.role === 'ADMIN' && (
                  <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={18} style={{ color: primaryColor }} />
                      <p className="text-xs font-black text-text-main uppercase">Login Page Background Image</p>
                    </div>
                    
                    <div className="space-y-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLoginWallpaper(reader.result as string);
                              showFeedback('Login wallpaper updated');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-xs text-text-main file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[var(--primary)] file:text-white hover:file:opacity-90 cursor-pointer file:cursor-pointer transition-colors !border-0 !outline-none"
                      />
                    </div>

                    {loginWallpaper && (
                      <button 
                        onClick={() => {
                          setLoginWallpaper('');
                          showFeedback('Login wallpaper removed');
                        }}
                        className="w-full py-2 text-red-500 font-bold text-xs rounded-lg hover:bg-red-50 transition-colors border border-red-500/10"
                      >
                        Remove Login Wallpaper
                      </button>
                    )}
                  </div>
                )}

                {/* Login Page Custom Background Color */}
                {user?.role === 'ADMIN' && (
                  <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Palette size={18} style={{ color: primaryColor }} />
                      <p className="text-xs font-black text-text-main uppercase">
                        {language === 'bn' ? 'লগইন পেজ ব্যাকগ্রাউন্ড কালার' : 'Login Page Background Color'}
                      </p>
                    </div>
                    <MultiColorCreator 
                      onApply={(gradient) => {
                        setLoginBackgroundColor(gradient);
                        showFeedback(language === 'bn' ? 'লগইন ব্যাকগ্রাউন্ড কালার আপডেট করা হয়েছে' : 'Login background color updated');
                      }} 
                      showFeedback={showFeedback} 
                      initialGradient={loginBackgroundColor}
                      hidePresets={true}
                    />
                    {loginBackgroundColor && (
                      <button 
                        onClick={() => {
                          setLoginBackgroundColor('');
                          showFeedback(language === 'bn' ? 'লগইন ব্যাকগ্রাউন্ড কালার রিসেট করা হয়েছে' : 'Login background color reset');
                        }}
                        className="w-full py-2 text-red-500 font-bold text-xs rounded-lg hover:bg-red-50 transition-colors border border-red-500/10"
                      >
                        {language === 'bn' ? 'রিসেট লগইন ব্যাকগ্রাউন্ড কালার' : 'Reset Login Background Color'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'LAYOUT_COLOR_SETTINGS' && (
              <div className="space-y-6">
                <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)]">
                  <div className="flex items-center gap-2 mb-6 pb-2 border-b border-gray-100 dark:border-white/5">
                    <Plus size={20} style={{ color: primaryColor }} />
                    <p className="text-sm font-black uppercase tracking-widest" style={{ color: primaryColor }}>Custom Layout Color</p>
                  </div>
                  <MultiColorCreator 
                    onApply={(gradient) => {
                      setHeaderBg(gradient);
                      setNavBg(gradient);
                      showFeedback('Custom  color applied');
                    }} 
                    showFeedback={showFeedback} 
                    initialGradient={headerBg}
                    hidePresets={true}
                  />
                </div>
              </div>
            )}

            {(activeSection === 'MULTI_COLOR_SETTINGS' || activeSection === 'MULTI_COLOR_SETTINGS_APP') && (
              <div className="space-y-4">
                <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone size={18} className="text-[var(--primary)]" />
                    <p className="text-xs font-black text-text-main uppercase">
                      {language === 'bn' ? 'কাস্টম মাল্টি-কালার মিক্সার' : language === 'ar' ? 'مزيج متعدد الألوان مخصص' : 'Custom Multi-Color Mixer'}
                    </p>
                  </div>
                  <MultiColorCreator 
                    onApply={(gradient) => {
                      setBackgroundColor(gradient);
                      setHeaderBg(gradient);
                      setNavBg(gradient);
                      setWallpaper('');
                      showFeedback(
                        language === 'bn'
                          ? 'অ্যাপ ব্যাকগ্রাউন্ড, হেডার ও নেভিগেশন একই সাথে আপডেট করা হয়েছে'
                          : 'App background, header, and navigation updated together'
                      );
                    }} 
                    showFeedback={showFeedback} 
                    initialGradient={backgroundColor}
                    hidePresets={true}
                  />
                  <div className="pt-2">
                    <button 
                      
                      onClick={() => {
                        setBackgroundColor('');
                        setHeaderBg('');
                        setNavBg('');
                        showFeedback(
                          language === 'bn'
                            ? 'অ্যাপ ব্যাকগ্রাউন্ড ও লেআউট কালার রিসেট করা হয়েছে'
                            : 'App background and  colors reset'
                        );
                      }}
                      className="w-full py-2 bg-transparent text-text-muted rounded text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border border-dashed border-gray-300 dark:border-white/10"
                    >
                      {language === 'bn' ? 'রিসেট অ্যাপ কালার' : 'Reset App Color'}
                    </button>
                  </div>
                </div>

                {/* Popular Presets in a SEPARATE Card */}
                <div className="p-4 bg-theme-card rounded-[10px] border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Palette size={18} className="text-[var(--primary)]" />
                    <p className="text-xs font-black text-text-main uppercase">
                      {language === 'bn' ? 'পপুলার প্রিসেটস' : language === 'ar' ? 'الإعدادات المسبقة الشائعة' : 'Popular Presets'}
                    </p>
                  </div>
                  <p className="text-[10px] text-text-muted font-semibold leading-relaxed">
                    {language === 'bn' 
                      ? 'নিচের যেকোনো একটি ব্যাকগ্রাউন্ড সিলেক্ট করে অ্যাপে সরাসরি মাল্টি-কালার থিম যুক্ত করুন:' 
                      : 'Select any of the gradients below to apply a beautiful preset theme directly to your app:'}
                  </p>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                    {PRESET_BACKGROUNDS.filter(p => p.color.includes('gradient')).map((preset, idx) => (
                      <button
                        key={idx}
                        
                        onClick={() => {
                          setBackgroundColor(preset.color);
                          setHeaderBg(preset.color);
                          setNavBg(preset.color);
                          setWallpaper('');
                          showFeedback(
                            language === 'bn'
                              ? `${preset.name} প্রিসেট থিম সফলভাবে সেট করা হয়েছে`
                              : `${preset.name} preset theme applied successfully`
                          );
                        }}
                        className="aspect-square rounded-lg shadow-sm border border-black/5 dark:border-white/10 overflow-hidden relative group"
                        style={{ background: preset.color }}
                        title={preset.name}
                      >
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Plus size={16} className="text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'LANGUAGE' && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 allow-animation">
                  {languages.map((item) => {
                    const isSelected = language === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setLanguage(item.id);
                          showFeedback(`Language changed to ${item.label}`);
                        }}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-[12px] border transition-all duration-300 gap-2 cursor-pointer ${
                          isSelected
                            ? 'border-2 shadow-md font-bold'
                            : 'border-black/5 dark:border-white/10 shadow-sm bg-theme-card hover:bg-gray-50/50 dark:hover:bg-white/5'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}1a`,
                                boxShadow: `0 4px 14px ${primaryColor}30`,
                              }
                            : {}
                        }
                      >
                        <span className="text-3xl transform transition-transform duration-300">{item.flag}</span>
                        <span 
                          className="font-bold text-xs sm:text-sm text-center truncate w-full transition-colors duration-300"
                          style={isSelected ? { color: primaryColor } : { color: 'var(--text-main, currentColor)' }}
                        >
                          {item.label}
                        </span>
                        {isSelected && (
                          <div 
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {activeSection === 'CURRENCY' && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 allow-animation">
                  {currencies.map((item) => {
                    const isSelected = selectedCurrency === item.code;
                    return (
                      <button
                        key={item.code}
                        onClick={() => {
                          setSelectedCurrency(item.code);
                          showFeedback(`Currency changed to ${item.code}`);
                        }}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-[12px] border transition-all duration-300 gap-1 cursor-pointer ${
                          isSelected
                            ? 'border-2 shadow-md'
                            : 'border-black/5 dark:border-white/10 shadow-sm bg-theme-card hover:bg-gray-50/50 dark:hover:bg-white/5'
                        }`}
                        style={
                          isSelected
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}1a`,
                                boxShadow: `0 4px 14px ${primaryColor}30`,
                              }
                            : {}
                        }
                      >
                        <span 
                          className="font-black text-base sm:text-lg tracking-widest text-center truncate w-full transition-colors duration-300"
                          style={isSelected ? { color: primaryColor } : { color: 'var(--text-main, currentColor)' }}
                        >
                          {item.code}
                        </span>
                        <span 
                          className="text-[11px] font-bold text-center truncate w-full transition-colors duration-300"
                          style={isSelected ? { color: `${primaryColor}cc` } : { color: 'var(--text-muted, currentColor)' }}
                        >
                          {item.name}
                        </span>
                        {isSelected && (
                          <div 
                            className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {activeSection === 'BIOMETRICS' && (
              <div className="space-y-6 allow-animation">
                <div className="p-4 bg-theme-card rounded-lg border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] space-y-6">
                  <div className="flex flex-col items-center text-center gap-2 mb-4">
                    <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mb-2" style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}>
                      <Fingerprint size={32} />
                    </div>
                    <h2 className="text-lg font-black text-text-main uppercase">
                      {language === 'bn' ? 'বায়োমেট্রিক সিকিউরিটি' : 'Biometric Security'}
                    </h2>
                    <p className="text-xs text-text-muted font-bold max-w-[280px]">
                      {language === 'bn' ? 'আপনার ডিভাইস বায়োমেট্রিকস (ফিঙ্গারপ্রিন্ট বা ফেস লক) ব্যবহার করে অ্যাপ্লিকেশন সুরক্ষিত করুন।' : 'Secure your application using your device biometrics (Fingerprint or Face Lock).'}
                    </p>
                  </div>

                  {/* Settings toggles */}
                  <div className="space-y-4 divide-y divide-gray-100 dark:divide-white/5">
                    {/* Item 1: Login Fingerprint */}
                    <div className="flex items-center justify-between pt-3 first:pt-0">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-text-main">
                          <Fingerprint size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-text-main">
                            {language === 'bn' ? 'লগইন ফিঙ্গারপ্রিন্ট' : 'Login Fingerprint'}
                          </p>
                          <p className="text-[10px] text-text-muted font-semibold">
                            {language === 'bn' ? 'অ্যাপ্লিকেশনে ফিঙ্গারপ্রিন্ট দিয়ে লগইন করুন' : 'Authenticate using fingerprint on app startup'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Modern Switch */}
                      <button 
                        onClick={async () => {
                          if (isLoginFingerprint) {
                            setIsLoginFingerprint(false);
                            localStorage.removeItem('fleetpro_biometric_login_enabled');
                            await deleteNativeBiometricCredentials();
                            showFeedback(language === 'bn' ? 'লগইন ফিঙ্গারপ্রিন্ট নিষ্ক্রিয় করা হয়েছে' : 'Login Fingerprint disabled');
                          } else {
                            setPendingToggleType('login');
                            setShowBioVerifyModal(true);
                          }
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isLoginFingerprint ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'}`}
                        style={{ backgroundColor: isLoginFingerprint ? '#10b981' : undefined }}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isLoginFingerprint ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Item 2: Face Lock */}
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-text-main">
                          <Scan size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-text-main">
                            {language === 'bn' ? 'ফেস লক' : 'Face Lock'}
                          </p>
                          <p className="text-[10px] text-text-muted font-semibold">
                            {language === 'bn' ? 'মুখমণ্ডল স্ক্যান করে অ্যাপ আনলক করুন' : 'Unlock app using face recognition'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Modern Switch */}
                      <button 
                        onClick={async () => {
                          if (isFaceLock) {
                            setIsFaceLock(false);
                            localStorage.removeItem('fleetpro_biometric_face_enabled');
                            await deleteNativeBiometricCredentials();
                            showFeedback(language === 'bn' ? 'ফেস লক নিষ্ক্রিয় করা হয়েছে' : 'Face Lock disabled');
                          } else {
                            setPendingToggleType('face');
                            setShowBioVerifyModal(true);
                          }
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isFaceLock ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'}`}
                        style={{ backgroundColor: isFaceLock ? '#10b981' : undefined }}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isFaceLock ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    {/* Item 3: Transaction Fingerprint */}
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-text-main">
                          <Fingerprint size={20} className="text-amber-500" />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-sm text-text-main">
                            {language === 'bn' ? 'ট্রানজেকশন ফিঙ্গার' : 'Transaction Fingerprint'}
                          </p>
                          <p className="text-[10px] text-text-muted font-semibold">
                            {language === 'bn' ? 'লেনদেন অনুমোদনের জন্য ফিঙ্গারপ্রিন্ট ব্যবহার করুন' : 'Authorize transactions with fingerprint'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Modern Switch */}
                      <button 
                        onClick={async () => {
                          if (isTransactionFingerprint) {
                            setIsTransactionFingerprint(false);
                            localStorage.removeItem('fleetpro_biometric_transaction_enabled');
                            await deleteNativeBiometricCredentials();
                            showFeedback(language === 'bn' ? 'ট্রানজেকশন ফিঙ্গার নিষ্ক্রিয় করা হয়েছে' : 'Transaction Fingerprint disabled');
                          } else {
                            setPendingToggleType('transaction');
                            setShowBioVerifyModal(true);
                          }
                        }}
                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isTransactionFingerprint ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'}`}
                        style={{ backgroundColor: isTransactionFingerprint ? '#10b981' : undefined }}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${isTransactionFingerprint ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>


            )}
          </div>
        )}

        {showBioVerifyModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div 
              className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-zinc-800/80 p-6 transition-all duration-300"
              style={{
                backgroundColor: (appThemeMode === 'dark' || theme === 'night-mode') ? '#121212' : '#ffffff',
                color: (appThemeMode === 'dark' || theme === 'night-mode') ? '#ffffff' : '#111827'
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-text-main">
                  {language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                </h3>
                <button
                  onClick={() => {
                    setShowBioVerifyModal(false);
                    setBioVerifyPassword('');
                    setPendingToggleType(null);
                  }}
                  className="p-2 text-text-muted hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-text-muted mb-6">
                {language === 'bn' 
                  ? 'ফিঙ্গারপ্রিন্ট বা ফেস লক সেটআপ করার আগে আপনার অ্যাকাউন্টের বর্তমান পাসওয়ার্ড দিন।'
                  : 'Please enter your current account password before setting up biometric authentication.'}
              </p>

              <div className="space-y-4">
                <InputField
                  name="bioVerifyPassword"
                  label={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  type="password"
                  value={bioVerifyPassword}
                  onChange={(e) => setBioVerifyPassword(e.target.value)}
                  icon={<Lock size={20} />}
                  disabled={bioVerifyLoading}
                />

                <button
                  onClick={handleVerifyBioPassword}
                  disabled={bioVerifyLoading || !bioVerifyPassword}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {bioVerifyLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    language === 'bn' ? 'যাচাই করুন' : 'Verify & Continue'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {isChangePasswordModalOpen && (
              <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-md" 
                  onClick={() => setIsChangePasswordModalOpen(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 1.05, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-zinc-800/80 p-6 relative z-10"
                  style={{
                    backgroundColor: (appThemeMode === 'dark' || theme === 'night-mode') ? '#121212' : '#ffffff',
                    color: (appThemeMode === 'dark' || theme === 'night-mode') ? '#ffffff' : '#111827'
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-text-main">
                      {language === 'bn' ? 'লগইন পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                    </h3>
                    <button
                      onClick={() => setIsChangePasswordModalOpen(false)}
                      className="p-2 text-text-muted hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <InputField 
                      label={language === 'bn' ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
                      type="password" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      icon={<Lock size={16} />}
                    />
                    <InputField 
                      label={language === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      icon={<Lock size={16} />}
                    />
                    <InputField 
                      label={language === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      icon={<Lock size={16} />}
                    />
                    
                    <div className="pt-2">
                      <button 
                        onClick={handlePasswordChange}
                        disabled={!currentPassword || !newPassword || !confirmPassword}
                        className="w-full h-12 rounded-xl font-bold text-sm shadow-sm transition-all uppercase tracking-widest text-white disabled:opacity-50 active:scale-95"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {language === 'bn' ? 'আপডেট করুন' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );

};

export default Settings;
