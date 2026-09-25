
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { 
  Home, 
  Users, 
  Truck, 
  Wallet, 
  ShieldCheck, 
  ChevronLeft,
  Lock,
  Menu, 
  X, 
  Moon, 
  Sun, 
  Diamond,
  Car,
  Globe,
  LogOut,
  Settings,
  User as UserIcon,
  LifeBuoy,
  Info,
  Edit3,
  Check,
  Clock,
  LogIn,
  ChevronDown,
  UserPlus,
  FileText,
  CalendarCheck,
  Ban,
  Search,
  ZoomIn,
  ZoomOut,
  LayoutDashboard,
  Activity,
  BarChart2,
  Eye,
  EyeOff,
  Bell,
  Trash2,
  RefreshCw,
  MessageSquare,
  UserX,
  Fuel,
  Download,
  Landmark,
  ShoppingCart,
  Scan
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, GLOBAL_TRANSITION, GLOBAL_VARIANTS } from '../store';
import { TRANSLATIONS, isModuleVisible } from '../constants';

import { THEMES } from '../constants';
import { getContrastColor, getHexColor } from '../utils/colorUtils';
import { useNavigation } from '../contexts/NavigationContext';

const toSentenceCase = (str: string | undefined | null): string => {
  if (!str) return '';
  const trimStr = String(str).trim();
  return trimStr.charAt(0).toUpperCase() + trimStr.slice(1).toLowerCase();
};

const toTitleCase = (str: string | undefined | null): string => {
  if (!str) return '';
  const trimStr = String(str).trim();
  return trimStr.split(/\s+/).map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  hideHeader?: boolean;
  hideBottomNav?: boolean;
  fullWidth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, hideHeader, hideBottomNav, fullWidth }) => {
  const { 
    currentView, setView, goBack, user, logout, loginTime, zoom, setCurrentFile, 
    monthlyFiles, addMonthlyFile,
    publicMenuItems, selectedUser, setSelectedUser, language, setLanguage,
    isNightMode, setIsNightMode, isEyeComfort, setIsEyeComfort,
    appThemeMode, setAppThemeMode,
    headerBg, setHeaderBg, navBg, setNavBg, theme, wallpaper, backgroundColor,
    activeDetailView, activeSection, setActiveSection,
    showReceivedBreakdown, setShowReceivedBreakdown,
    showPendingBreakdown, setShowPendingBreakdown,
    setEditingTrip, isEntryFormOpen, isPaymentPopupOpen,
    showAvailableBalancePage, showPendingBreakdownPage,
    notifications, removeNotification, markNotificationAsRead, clearNotifications, selectedNotification,
    logo, dashboardIcon, dashboardIconColor,
    confirmConfig, isDropdownOpen, confirmAction,
    customHeaderTitle, customBackAction,
    isDrawerOpen, setIsDrawerOpen,
    isDarkMode: storeIsDarkMode
  } = useStore();

  const nav = useNavigation();

  const isAnyPopupOpen = !!(
    isPaymentPopupOpen || 
    isEntryFormOpen || 
    showReceivedBreakdown || 
    showPendingBreakdown || 
    showAvailableBalancePage || 
    showPendingBreakdownPage || 
    confirmConfig?.isOpen
  );

  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';

  const isFirstLoginRequired = false;

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


  const iconMap: Record<string, any> = {
    Home,
    LayoutDashboard,
    Activity,
    BarChart2,
    MessageSquare
  };

  const DashboardIcon = ({ size, className, style, color }: { size: number, className?: string, style?: React.CSSProperties, color?: string }) => {
    const isCustomColor = className?.includes('text-') || !!color || !!style?.color;
    const finalColor = isCustomColor ? (color || style?.color || 'currentColor') : dashboardIconColor;
    
    if (dashboardIcon && typeof dashboardIcon === 'string' && dashboardIcon.startsWith('data:image/')) {
      return (
        <div 
          className={className}
          style={{ 
            width: size, 
            height: size,
            maskImage: `url(${dashboardIcon})`, 
            maskSize: 'contain', 
            maskRepeat: 'no-repeat',
            backgroundColor: finalColor,
            ...style
          }} 
        />
      );
    }
    const IconComponent = iconMap[dashboardIcon] || Home;
    return <IconComponent size={size} className={className} style={{ color: finalColor, ...style }} color={color} />;
  };
  const [isTripManagementOpen, setIsTripManagementOpen] = useState(false);
  const [isUserViewOpen, setIsUserViewOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isPartnerAccountOpen, setIsPartnerAccountOpen] = useState(false);
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);
  const [isMessManagementOpen, setIsMessManagementOpen] = useState(false);

  useEffect(() => {
    if (!isDrawerOpen) {
      setIsTripManagementOpen(false);
      setIsUserViewOpen(false);
      setIsWalletOpen(false);
      setIsPartnerAccountOpen(false);
      setIsVehicleOpen(false);
      setIsMessManagementOpen(false);
    }
  }, [isDrawerOpen]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [overrideTitle, setOverrideTitle] = useState<string | null>(null);
  const mainRef = React.useRef<HTMLDivElement>(null);

  
  useEffect(() => {
    // Reset scroll of the main container when view or section changes
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    setOverrideTitle(null);
  }, [currentView, activeSection, activeDetailView]);
  
  useEffect(() => {
    const handleTitleChange = (e: Event) => {
      setOverrideTitle((e as CustomEvent).detail);
    };
    window.addEventListener('change-title', handleTitleChange);
    return () => window.removeEventListener('change-title', handleTitleChange);
  }, []);

  const handleBackClick = () => {
    if (customBackAction) {
      customBackAction();
      return;
    }
    if (overrideTitle) {
      window.dispatchEvent(new CustomEvent('close-permissions-overlay'));
      return;
    }
    goBack();
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const t = TRANSLATIONS[language];
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  const isLightMode = appThemeMode === 'light';
  const hasCustomBackground = !!(backgroundColor || wallpaper);
  
  const addOpacityToHex = (hex: any, opacity: number) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
    const r = parseInt(hex.length === 4 ? hex[1]+hex[1] : hex.substr(1, 2), 16);
    const g = parseInt(hex.length === 4 ? hex[2]+hex[2] : hex.substr(3, 2), 16);
    const b = parseInt(hex.length === 4 ? hex[3]+hex[3] : hex.substr(5, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const headerColor = 'var(--header-bg)';
   const isCustomBg = !isDarkMode && !!backgroundColor;
   const activePrimaryColor = currentThemeObj.primary || '#10b981';

   const rawHeaderBg = 
     isDarkMode
       ? '#000000' : (headerBg
           ? headerBg
           : (isCustomBg 
               ? backgroundColor 
               : (backgroundColor || '#f8fafc')));

   const effectiveHeaderBg = getHexColor(rawHeaderBg, isDarkMode ? '#000000' : '#FFFFFF');

   const rawNavBg = 
     isDarkMode
       ? '#000000' : (navBg
           ? navBg
           : (isCustomBg 
               ? backgroundColor 
               : (backgroundColor || '#f8fafc')));

   const effectiveNavBg = getHexColor(rawNavBg, isDarkMode ? '#000000' : '#FFFFFF');

   const navTextColor = getContrastColor(effectiveNavBg);
   const headerTextColor = getContrastColor(effectiveHeaderBg);

  const isAdmin = user?.role === 'ADMIN';

  const filterItems = (items: any[]) => {
    if (isAdmin) return items;
    // DASHBOARD (the home button) and PRAYER_TIMES aren't entries in
    // GLOBAL_DASHBOARD_MODULES at all — they're plain navigation, not
    // permission-gated modules — so they stay unconditionally visible
    // exactly as before.
    const alwaysVisible = ['DASHBOARD', 'PRAYER_TIMES'];
    return items.filter(item => {
      if (alwaysVisible.includes(item.id) || publicMenuItems.includes(item.id)) return true;
      return isModuleVisible(item.id, user?.permissions, user?.deniedPermissions);
    });
  };

  const menuItems = filterItems([
    { id: 'DASHBOARD', icon: <DashboardIcon size={22} />, label: t.DASHBOARD },
    { id: 'PRAYER_TIMES', icon: <Clock size={22} />, label: t.PRAYER_TIMES },
  ]);

  const tripManagementItems = user ? filterItems([
    { id: 'MONTHLY_FILES', icon: <FileText size={20} />, label: t.MONTHLY_FILES, color: '#2dd4bf' },
    { id: 'NEW_TRIP', icon: <Truck size={20} />, label: t.NEW_TRIP_MENU, color: '#facc15' },
    { id: 'SCANNER', icon: <Scan size={20} />, label: language === 'bn' ? 'স্ক্যানার' : 'Scanner', color: '#06b6d4' },
  ]) : [];

  const userViewItems = user ? filterItems([
    { id: 'USER_ACCOUNTS', icon: <Users size={20} />, label: t.USER_ACCOUNTS, color: '#10b981' },
    { id: 'USER_PASSWORD_RESET', icon: <Lock size={20} />, label: t.USER_PASSWORD_RESET || 'User Reset', color: '#f43f5e' },
    { id: 'USER_RENEW', icon: <RefreshCw size={20} />, label: t.USER_RENEW || 'User Renew', color: '#f97316' },
  ]) : [];

  const partnerAccountItems = user ? filterItems([
    { id: 'MANAGER_PROFILE', icon: <UserPlus size={20} />, label: language === 'bn' ? 'ম্যানেজার প্রোফাইল' : 'Manager Profile', color: '#8b5cf6' },
  ]) : [];

  const hasPurchasePermission = isAdmin || (Array.isArray(user?.permissions) && user.permissions.includes('PURCHASE'));

  const messManagementItems = user && hasPurchasePermission ? [
    { id: 'MESS_ADD_PARTNER', icon: <UserPlus size={20} />, label: language === 'bn' ? 'পার্টনার যোগ করুন' : 'Add Partner', color: '#10b981' },
    { id: 'MESS_PARTNER_LIST', icon: <Users size={20} />, label: language === 'bn' ? 'পার্টনার তালিকা' : 'Partner List', color: '#3b82f6' },
  ] : [];

  const walletItems = user ? filterItems([
    { id: 'WALLET_DASHBOARD', icon: <Wallet size={20} />, label: language === 'bn' ? 'ওয়ালেট ড্যাশবোর্ড' : 'Wallet Dashboard', color: '#159938' },
    { id: 'WALLET_LINK_USER', icon: <UserPlus size={20} />, label: language === 'bn' ? 'ওয়ালেট লিঙ্ক ইউজার' : 'Wallet Link User', color: '#fbbf24' },
  ]) : [];

  const vehicleItems = user ? filterItems([
    { id: 'VEHICLE_LIST', icon: <Car size={20} />, label: language === 'bn' ? 'যানবাহন তালিকা' : 'Vehicle List', color: '#10b981' },
    { id: 'VEHICLE_SERVICES', icon: <Settings size={20} />, label: language === 'bn' ? 'যানবাহন সার্ভিস' : 'Vehicle Services', color: '#3b82f6' }
  ]) : [];

  const paymentItem = { id: 'PAYMENT', icon: <Wallet size={22} />, label: t.PAYMENT };
  const showPayment = user && (isAdmin || publicMenuItems.includes('PAYMENT'));

  const infoItems = filterItems([
    { id: 'SUPPORT', icon: <LifeBuoy size={22} />, label: t.SUPPORT },
  ]);

  const settingsItem = { id: 'SETTINGS', icon: <Settings size={22} />, label: t.SETTINGS };
  const showSettings = !!user;

  const bottomNavItems = filterItems([
    { id: 'DASHBOARD', icon: <DashboardIcon size={22} className="text-current" />, label: t.DASHBOARD },
    { id: 'SEARCH', icon: <Search size={22} />, label: t.SEARCH },
    { id: 'PAYMENT', icon: <Wallet size={22} />, label: t.PAYMENT },
    { id: 'USER_PROFILE', icon: <UserIcon size={22} />, label: t.NAV_PROFILE },
  ]);

  const toggleHeaderColor = () => {
    const currentPrimary = headerBg || backgroundColor || currentThemeObj.primary;
    // Find index based on color match, or default to 0
    const currentIndex = THEMES.findIndex(t => t.primary === currentPrimary);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    const nextColor = THEMES[nextIndex].primary;
    
    setHeaderBg(nextColor);
    setNavBg(nextColor);
  };

  const toggleLanguage = () => {
    if (language === 'en') setLanguage('bn');
    else if (language === 'bn') setLanguage('ar');
    else setLanguage('en');
  };

  const isArabic = language === 'ar';
  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  const sidebarItems = [
    { id: 'DASHBOARD', icon: <DashboardIcon size={26} />, label: t.DASHBOARD, show: true, color: '#10b981' },
    { id: 'SEARCH', icon: <Search size={26} />, label: t.SEARCH, show: isAdmin, color: '#818cf8' },
    { id: 'PAYMENT', icon: <Wallet size={26} />, label: t.PAYMENT, show: showPayment, color: '#fbbf24' },
    { id: 'BANK_ACCOUNT', icon: <Landmark size={26} />, label: t.BANK_ACCOUNT || 'Bank Accounts', show: isAdmin || isModuleVisible('BANK_ACCOUNT', user?.permissions, user?.deniedPermissions), color: '#0ea5e9' },
    { id: 'WALLET', icon: <Wallet size={26} />, label: t.WALLET, show: isAdmin, isAccordion: true, subItems: walletItems, isOpen: isWalletOpen, toggle: () => setIsWalletOpen(!isWalletOpen), color: '#159938' },
    { id: 'STATEMENT', icon: <FileText size={26} />, label: t.STATEMENT, show: !!user, color: '#10b981' },
    { id: 'LEAVE_SETTLEMENT', icon: <CalendarCheck size={26} />, label: t.LEAVE_SETTLEMENT || 'Leave & Settlement', show: !!user, color: '#ef4444' },
    { id: 'FUEL', icon: <Fuel size={26} />, label: t.FUEL || 'Fuel', show: !!user, color: '#f97316' },
    { id: 'DOWNLOAD', icon: <Download size={26} />, label: t.DOWNLOAD || 'Download', show: !!user, color: '#6366f1' },
    { id: 'TRIP_MANAGEMENT', icon: <Truck size={26} />, label: t.TRIP_MANAGEMENT, show: isAdmin || tripManagementItems.length > 0, isAccordion: true, subItems: tripManagementItems, isOpen: isTripManagementOpen, toggle: () => setIsTripManagementOpen(!isTripManagementOpen), color: '#facc15' },
    { id: 'VEHICLES', icon: <Car size={26} />, label: language === 'bn' ? 'যানবাহন ব্যবস্থাপনা' : 'Vehicle Management', show: !isAdmin, isAccordion: true, subItems: vehicleItems, isOpen: isVehicleOpen, toggle: () => setIsVehicleOpen(!isVehicleOpen), color: '#3b82f6' },
    { id: 'PARTNER_ACCOUNT', icon: <UserPlus size={26} />, label: language === 'bn' ? 'পারচেজ ম্যানেজার' : 'Purchase Manager', show: isAdmin || partnerAccountItems.length > 0, isAccordion: true, subItems: partnerAccountItems, isOpen: isPartnerAccountOpen, toggle: () => setIsPartnerAccountOpen(!isPartnerAccountOpen), color: '#8b5cf6' },
    { id: 'MESS_MANAGEMENT', icon: <ShoppingCart size={26} />, label: language === 'bn' ? 'মেস ম্যানেজমেন্ট' : 'Mess Management', show: hasPurchasePermission, isAccordion: true, subItems: messManagementItems, isOpen: isMessManagementOpen, toggle: () => setIsMessManagementOpen(!isMessManagementOpen), color: '#facc15' },
    { id: 'PRAYER_TIMES', icon: <Clock size={26} />, label: t.PRAYER_TIMES, show: true, color: '#06b6d4' },
    { id: 'SUPPORT', icon: <LifeBuoy size={26} />, label: t.SUPPORT, show: true, color: '#f472b6' },
    { id: 'SETTINGS', icon: <Settings size={26} />, label: t.SETTINGS, show: showSettings, color: '#9ca3af' },
  ];

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 1024 : true;
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const sidebarVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rootBgColor = isDarkMode
    ? '#000000' : (wallpaper 
        ? '#000000' : (backgroundColor || (isLightMode ? '#f8fafc' : currentThemeObj.bg || '#ffffff')));
  const rootTextColor = getContrastColor(rootBgColor);

  const effectiveRootText = isDarkMode ? '#ffffff' : (rootTextColor || '#000000');

  const dynamicActiveBg = isDarkMode || effectiveRootText === '#ffffff'
    ? addOpacityToHex(currentThemeObj.primary, 0.2)
    : addOpacityToHex(currentThemeObj.primary, 0.1);

  const hexToRgbString = (hex: string, defaultRgb = '16, 185, 129') => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return defaultRgb;
    const cleanHex = hex.trim();
    const r = parseInt(cleanHex.length === 4 ? cleanHex[1]+cleanHex[1] : cleanHex.substr(1, 2), 16);
    const g = parseInt(cleanHex.length === 4 ? cleanHex[2]+cleanHex[2] : cleanHex.substr(3, 2), 16);
    const b = parseInt(cleanHex.length === 4 ? cleanHex[3]+cleanHex[3] : cleanHex.substr(5, 2), 16);
    return `${r}, ${g}, ${b}`;
  };

  const isBgTooDark = isDarkMode || (backgroundColor && getContrastColor(backgroundColor) === '#ffffff');
  const shadowColorHex = isBgTooDark 
    ? (currentThemeObj.primary || '#10b981')
    : (backgroundColor && backgroundColor.startsWith('#') ? backgroundColor : (currentThemeObj.primary || '#10b981'));

  const rgbShadow = hexToRgbString(shadowColorHex);
  const rgbPrimary = hexToRgbString(currentThemeObj.primary || '#10b981');

  const dynamicCardShadow = `0 0 14px rgba(0, 0, 0, 0.12), 0 0 4px rgba(0, 0, 0, 0.06), 0 0 0 1.5px rgba(255, 255, 255, 0.25), 0 0 8px rgba(255, 255, 255, 0.12)`;

  const dynamicCardShadowHover = `0 0 20px rgba(0, 0, 0, 0.18), 0 0 6px rgba(0, 0, 0, 0.08), 0 0 0 2px rgba(255, 255, 255, 0.35), 0 0 12px rgba(255, 255, 255, 0.18)`;

  const dynamicCardBorder = isDarkMode
    ? `1px solid transparent`
    : `1px solid transparent`;

  return (
    <div 
      className={`flex fixed inset-0 w-full h-full overflow-hidden [transition:background-color_0.2s_ease,color_0.2s_ease] ${isDarkMode ? 'dark dark-mode' : 'light'} text-text-main ${isArabic ? 'rtl' : 'ltr'} ${isEyeComfort ? 'eye-comfort' : ''} ${isDropdownOpen ? 'pointer-events-none' : ''} ${wallpaper ? 'has-wallpaper' : ''} ${isAnyPopupOpen ? 'popup-open' : ''}`}
      style={{
        background: wallpaper 
          ? `url(${wallpaper}) center/cover no-repeat` 
          : (isDarkMode ? '#000000' : (backgroundColor ? backgroundColor : 'var(--app-bg)')),
        color: effectiveRootText,
        '--text-main': effectiveRootText,
        '--text-muted': effectiveRootText === '#ffffff' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
        '--sidebar-bg': effectiveHeaderBg || 'var(--sidebar-bg)',
        '--sidebar-text': headerTextColor,
        '--header-bg': effectiveHeaderBg || 'var(--header-bg)',
        '--header-text': headerTextColor,
        '--nav-bg': effectiveNavBg || 'var(--nav-bg)',
        '--nav-text': navTextColor,
        '--dynamic-card-shadow': dynamicCardShadow,
        '--dynamic-card-shadow-hover': dynamicCardShadowHover,
        '--dynamic-card-border': dynamicCardBorder,
      } as React.CSSProperties}
    >
      {/* Disable transition for background elements when popup is open */}
      {isAnyPopupOpen && (
        <style dangerouslySetInnerHTML={{ __html: `
          .popup-open .app-container,
          .popup-open .app-container * {
            transition: none !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            animation: none !important;
            animation-duration: 0s !important;
            animation-delay: 0s !important;
          }
        ` }} />
      )}
      {/* Fixed Background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ 
          background: isDarkMode ? '#000000' : (backgroundColor || 'var(--app-bg)'),
        }}
      >
        {wallpaper && (
          <img 
            src={wallpaper} 
            alt="App Wallpaper" 
            loading="eager" 
            decoding="sync" 
            className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" 
          />
        )}
      </div>

      {/* Desktop Sidebar Spacer */}
      {user && !isFirstLoginRequired && (
        <div 
          className="hidden lg:block flex-shrink-0 transition-all duration-200 sidebar-transition"
          style={{ width: isDesktopSidebarOpen ? '260px' : '80px' }}
        />
      )}

      {/* Desktop Sidebar */}
      {user && !isFirstLoginRequired && (
        <aside 
          className={`hidden lg:flex flex-col h-screen transition-all duration-200 z-[200] fixed sidebar-transition ${isArabic ? 'right-0' : 'left-0'} top-0 font-calibri ${(isLightMode && !hasCustomBackground) ? '' : (backgroundColor && getContrastColor(backgroundColor) === '#000000' ? '' : '')}`}
          style={{ 
            width: isDesktopSidebarOpen ? '260px' : '80px', 
            background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : 'var(--sidebar-bg)',
            color: 'var(--sidebar-text)'
          } as React.CSSProperties}
        >
          <div className="safe-top">
            <div 
              className="h-16 flex items-center justify-between px-6"
            >
              {isDesktopSidebarOpen && (
                <div className="flex items-center gap-3">
                  <span className="font-black tracking-widest text-[10px]">FleetPro</span>
                </div>
              )}
              <button 
                onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors ml-auto"
              >
                {isDesktopSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          <div 
            className="flex-1 overflow-y-auto py-1 space-y-2 scrollbar-hide"
          >
            {sidebarItems.filter(item => item.show).map(item => (
              <div key={item.id} className="space-y-1">
                {item.isAccordion ? (
                  <div className="space-y-1">
                    <button
                      onClick={item.toggle}
                      className={`w-full flex items-center justify-between h-10 px-5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-[0.98]`}
                      style={{ color: 'var(--sidebar-text)' }}
                    >
                      <div className="flex items-center gap-5">
                        {React.cloneElement(item.icon as React.ReactElement, { style: { color: item.color } })}
                        {isDesktopSidebarOpen && <span className="font-bold text-[11px] tracking-wide whitespace-nowrap">{item.label}</span>}
                      </div>
                      {isDesktopSidebarOpen && <ChevronDown size={16} className={`transition-transform ${item.isOpen ? 'rotate-180' : ''}`} />}
                    </button>
                    {item.isOpen && isDesktopSidebarOpen && (
                      <div className="pl-8 space-y-1">
                        {item.subItems?.map(subItem => (
                          <button
                            key={subItem.id}
                            onClick={() => {
                              nav.clear();
                              if (subItem.id === 'MONTHLY_FILES') {
                                const today = new Date();
                                const currentMonth = today.getMonth() + 1;
                                const currentYear = today.getFullYear();
                                let file = monthlyFiles.find(f => f.month === currentMonth && f.year === currentYear);
                                if (!file) {
                                  file = {
                                    id: `MF-${Date.now()}`,
                                    month: currentMonth,
                                    year: currentYear,
                                    status: 'OPEN',
                                    createdAt: today.toISOString(),
                                    userId: user?.id || ''
                                  };
                                  addMonthlyFile(file);
                                }
                                setCurrentFile(file);
                                setView('MONTHLY_FILE_DETAILS');
                              } else if (subItem.id === 'WALLET_DASHBOARD') {
                                setView('WALLET');
                                setActiveSection(null);
                              } else if (subItem.id === 'WALLET_LINK_USER') {
                                setView('WALLET');
                                setActiveSection('LINK_USER');
                              } else if (subItem.id === 'MESS_ADD_PARTNER') {
                                setView('PURCHASE');
                                setActiveSection('ADD_PARTNER');
                              } else if (subItem.id === 'MESS_PARTNER_LIST') {
                                setView('PURCHASE');
                                setActiveSection('PARTNER_LIST');
                              } else {
                                if (subItem.id === 'NEW_TRIP') {
                                                      setCurrentFile(null);
                                                      setEditingTrip(null);
                                }
                                setView(subItem.id as any);
                              }
                            }}
                            className={`w-full flex items-center gap-4 h-9 px-5 rounded-md transition-all active:scale-[0.98] ${
                              (subItem.id === 'WALLET_DASHBOARD' && currentView === 'WALLET' && !activeSection) ||
                              (subItem.id === 'WALLET_LINK_USER' && currentView === 'WALLET' && activeSection === 'LINK_USER') ||
                              (subItem.id === 'MESS_ADD_PARTNER' && currentView === 'PURCHASE' && activeSection === 'ADD_PARTNER') ||
                              (subItem.id === 'MESS_PARTNER_LIST' && currentView === 'PURCHASE' && activeSection === 'PARTNER_LIST') ||
                              (subItem.id !== 'WALLET_DASHBOARD' && subItem.id !== 'WALLET_LINK_USER' && subItem.id !== 'MESS_ADD_PARTNER' && subItem.id !== 'MESS_PARTNER_LIST' && currentView === subItem.id)
                                ? 'bg-black/20 dark:bg-white/20' 
                                : 'hover:bg-black/10 dark:hover:bg-white/10'
                            }`}
                            style={{ 
                              color: 'var(--sidebar-text)', 
                              opacity: (subItem.id === 'WALLET_DASHBOARD' && currentView === 'WALLET' && !activeSection) ||
                                       (subItem.id === 'WALLET_LINK_USER' && currentView === 'WALLET' && activeSection === 'LINK_USER') ||
                                       (subItem.id === 'MESS_ADD_PARTNER' && currentView === 'PURCHASE' && activeSection === 'ADD_PARTNER') ||
                                       (subItem.id === 'MESS_PARTNER_LIST' && currentView === 'PURCHASE' && activeSection === 'PARTNER_LIST') ||
                                       (subItem.id !== 'WALLET_DASHBOARD' && subItem.id !== 'WALLET_LINK_USER' && subItem.id !== 'MESS_ADD_PARTNER' && subItem.id !== 'MESS_PARTNER_LIST' && currentView === subItem.id)
                                         ? 1 
                                         : 0.8 
                            }}
                          >
                            {React.cloneElement(subItem.icon as React.ReactElement, { size: 22, style: { color: subItem.color } })}
                            <span className="text-[11px] font-bold tracking-wide whitespace-nowrap">{subItem.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      nav.clear();
                      if (item.id === 'MONTHLY_FILES') {
                        const today = new Date();
                        const currentMonth = today.getMonth() + 1;
                        const currentYear = today.getFullYear();
                        let file = monthlyFiles.find(f => f.month === currentMonth && f.year === currentYear);
                        if (!file) {
                          file = {
                            id: `MF-${Date.now()}`,
                            month: currentMonth,
                            year: currentYear,
                            status: 'OPEN',
                            createdAt: today.toISOString(),
                            userId: user?.id || ''
                          };
                          addMonthlyFile(file);
                        }
                        setCurrentFile(file);
                        setView('MONTHLY_FILE_DETAILS');
                      } else {
                        setView(item.id as any);
                      }
                    }}
                    className={`w-full flex items-center gap-5 h-10 px-5 rounded-none transition-all active:scale-[0.98] group ${currentView === item.id ? 'bg-black/20 dark:bg-white/20' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                    style={{ borderBottom: `1px solid ${addOpacityToHex(currentThemeObj.primary, 0.3)}`, color: 'var(--sidebar-text)' }}
                  >
                    {React.cloneElement(item.icon as React.ReactElement, { 
                      style: { color: item.color } 
                    })}
                    {isDesktopSidebarOpen && <span className="font-bold text-[11px] tracking-wide whitespace-nowrap">{item.label}</span>}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="py-4 mt-auto border-t border-black/5 dark:border-white/5 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 h-8 px-3 rounded-md text-red-500 hover:bg-red-500/10 transition-all active:scale-[0.98] font-bold text-[10px] tracking-wider mb-2"
            >
              <LogOut size={26} />
              {isDesktopSidebarOpen && <span className="whitespace-nowrap">{toSentenceCase(t.LOGOUT)}</span>}
            </button>
            <div className="px-3 py-1 text-center">
              <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest opacity-40">
                {isDesktopSidebarOpen ? "VERSION 2.6.0 • SECURE CLOUD SYSTEM" : "v2.6.0"}
              </p>
            </div>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden safe-left safe-right border-x border-black/5 dark:border-white/5">

        {/* Drawer (Mobile Only) */}
        {typeof document !== 'undefined' ? createPortal(
          <AnimatePresence>
            {isDrawerOpen && !isFirstLoginRequired && (
              <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                className="fixed inset-0 z-[1200] bg-black/45 lg:hidden"
                onClick={() => setIsDrawerOpen(false)}
              />
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', ease: [0.2, 0, 0, 1], duration: 0.3 }}
                className={`fixed inset-y-0 left-0 w-80 shadow-2xl flex flex-col z-[1201] drawer-content font-calibri overflow-hidden rounded-tr-3xl rounded-br-3xl lg:hidden`}
                style={{ 
                   background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : 'var(--app-bg)',
                  '--sidebar-text': effectiveRootText,
                  color: effectiveRootText,
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none',
                  willChange: 'transform'
                } as React.CSSProperties}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Sidebar Header */}
                <div 
                  className={`w-full p-4 bg-black/15 space-y-1 relative z-10 safe-top pb-3`}
                  style={{ color: 'var(--sidebar-text)' }}
                >
                  <div className="flex items-center justify-between pt-1 mb-1">
                    <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ opacity: 0.75 }}>
                      {user ? (currentTime.getHours() < 12 ? 'Good morning,' : (currentTime.getHours() < 18 ? 'Good afternoon,' : 'Good evening,')) : 'Welcome,'}
                    </p>
                    <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-white/10 rounded-full" style={{ color: 'var(--sidebar-text)' }}>
                      <X size={18} />
                    </button>
                  </div>
                  
                  <h2 className="text-xl font-black tracking-widest text-[#FFD700] uppercase pt-0.5 leading-none">
                    {user?.name || 'Guest'}
                  </h2>

                  {/* Current Date & Time Display */}
                  <div className="flex items-center gap-1.5 pt-1.5 text-[10px] font-bold text-cyan-400">
                    <span>{currentTime.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span className="opacity-40">•</span>
                    <span>{currentTime.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>

                  {user && (
                    <div className="pt-2">
                      <p className="text-[9px] font-bold tracking-wider" style={{ opacity: 0.5 }}>
                        Last login: <span style={{ color: headerTextColor, opacity: 0.9 }}>{new Date(loginTime || currentTime).toLocaleDateString()} {new Date(loginTime || currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  )}
                </div>
                
                <nav 
                  className="flex-1 overflow-y-auto scrollbar-hide py-2 relative z-10 space-y-1"
                >
                  {sidebarItems.filter(item => item.show).map((item) => (
                    <div 
                      key={item.id} 
                      className="w-full"
                    >
                      {item.isAccordion ? (
                        <div className="w-full space-y-1">
                          <button
                            onClick={item.toggle}
                            className={`w-[calc(100%-28px)] ml-4 mr-3 rounded-xl flex items-center justify-between h-12 pl-4 pr-4 bg-transparent font-black text-[11px] tracking-wide transition-all hover:bg-white/5 active:scale-[0.98]`}
                            style={{ color: 'var(--sidebar-text)' }}
                          >
                            <div className="flex items-center gap-4">
                              {React.cloneElement(item.icon as React.ReactElement, { style: { color: item.color } })}
                              <span className="whitespace-nowrap">{item.label}</span>
                            </div>
                            <ChevronDown size={18} className={`transition-transform ${item.isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {item.isOpen && (
                            <div className="w-full py-1 space-y-1">
                              {item.subItems?.map(subItem => {
                                const isSubSelected = (subItem.id === 'WALLET_DASHBOARD' && currentView === 'WALLET' && !activeSection) ||
                                                      (subItem.id === 'WALLET_LINK_USER' && currentView === 'WALLET' && activeSection === 'LINK_USER') ||
                                                      (subItem.id === 'MESS_ADD_PARTNER' && currentView === 'PURCHASE' && activeSection === 'ADD_PARTNER') ||
                                                      (subItem.id === 'MESS_PARTNER_LIST' && currentView === 'PURCHASE' && activeSection === 'PARTNER_LIST') ||
                                                      (subItem.id !== 'WALLET_DASHBOARD' && subItem.id !== 'WALLET_LINK_USER' && subItem.id !== 'MESS_ADD_PARTNER' && subItem.id !== 'MESS_PARTNER_LIST' && currentView === subItem.id);
                                return (
                                  <div key={subItem.id} className="w-full">
                                    <button
                                      onClick={() => {
                                        nav.clear();
                                        if (subItem.id === 'MONTHLY_FILES') {
                                          const today = new Date();
                                          const currentMonth = today.getMonth() + 1;
                                          const currentYear = today.getFullYear();
                                          let file = monthlyFiles.find(f => f.month === currentMonth && f.year === currentYear);
                                          if (!file) {
                                            file = {
                                              id: `MF-${Date.now()}`,
                                              month: currentMonth,
                                              year: currentYear,
                                              status: 'OPEN',
                                              createdAt: today.toISOString(),
                                              userId: user?.id || ''
                                            };
                                            addMonthlyFile(file);
                                          }
                                          setCurrentFile(file);
                                          setView('MONTHLY_FILE_DETAILS');
                                        } else if (subItem.id === 'WALLET_DASHBOARD') {
                                          setView('WALLET');
                                          setActiveSection(null);
                                        } else if (subItem.id === 'WALLET_LINK_USER') {
                                          setView('WALLET');
                                          setActiveSection('LINK_USER');
                                        } else if (subItem.id === 'MESS_ADD_PARTNER') {
                                          setView('PURCHASE');
                                          setActiveSection('ADD_PARTNER');
                                        } else if (subItem.id === 'MESS_PARTNER_LIST') {
                                          setView('PURCHASE');
                                          setActiveSection('PARTNER_LIST');
                                        } else {
                                          if (subItem.id === 'NEW_TRIP') {
                                            setCurrentFile(null);
                                            setEditingTrip(null);
                                          }
                                          if (subItem.id === 'USER_PROFILE') {
                                            setSelectedUser(null);
                                          }
                                          setView(subItem.id as any);
                                        }
                                        setIsDrawerOpen(false);
                                      }}
                                      className="w-[calc(100%-28px)] ml-4 mr-3 rounded-xl flex items-center gap-4 h-10 pl-8 pr-4 transition-all font-black text-[11px] tracking-wide active:scale-[0.98] hover:bg-white/5"
                                      style={{ 
                                        color: 'var(--sidebar-text)', 
                                        backgroundColor: isSubSelected ? dynamicActiveBg : 'transparent',
                                        opacity: isSubSelected ? 1 : 0.8 
                                      }}
                                    >
                                      {React.cloneElement(subItem.icon as React.ReactElement, { size: 20, style: { color: subItem.color } })}
                                      <span className="whitespace-nowrap">{subItem.label}</span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                          <div>
                            <button
                              onClick={() => {
                                nav.clear();
                                if (item.id === 'MONTHLY_FILES') {
                                  const today = new Date();
                                  const currentMonth = today.getMonth() + 1;
                                  const currentYear = today.getFullYear();
                                  let file = monthlyFiles.find(f => f.month === currentMonth && f.year === currentYear);
                                  if (!file) {
                                    file = {
                                      id: `MF-${Date.now()}`,
                                      month: currentMonth,
                                      year: currentYear,
                                      status: 'OPEN',
                                      createdAt: today.toISOString(),
                                      userId: user?.id || ''
                                    };
                                    addMonthlyFile(file);
                                  }
                                  setCurrentFile(file);
                                  setView('MONTHLY_FILE_DETAILS');
                                } else {
                                  setView(item.id as any);
                                }
                                setIsDrawerOpen(false);
                              }}
                              className="w-[calc(100%-28px)] ml-4 mr-3 rounded-xl flex items-center gap-4 h-12 pl-4 pr-4 transition-all font-black text-[11px] tracking-wide active:scale-[0.98] hover:bg-white/5"
                              style={{ 
                                color: 'var(--sidebar-text)',
                                backgroundColor: currentView === item.id ? dynamicActiveBg : 'transparent'
                              }}
                            >
                              {React.cloneElement(item.icon as React.ReactElement, { style: { color: item.color } })}
                              <span className="whitespace-nowrap">{item.label}</span>
                            </button>
                          </div>
                      )}
                    </div>
                  ))}

                  {/* Auth Button */}
                  <div 
                    className="w-full pb-[calc(30px+env(safe-area-inset-bottom))] pt-4"
                  >
                    <button
                      onClick={() => { 
                        if (user) handleLogout(); 
                        else setView('LOGIN');
                        setIsDrawerOpen(false); 
                      }}
                      className="w-[calc(100%-28px)] ml-4 mr-3 rounded-xl flex items-center gap-4 h-12 pl-4 pr-4 transition-all font-black text-[11px] tracking-wide bg-transparent text-red-500 hover:bg-red-500/5 active:scale-[0.98] mb-3"
                    >
                      {user ? <LogOut size={26} /> : <LogIn size={26} />}
                      <span className="whitespace-nowrap">{user ? t.LOGOUT : t.LOGIN}</span>
                    </button>
                    <div className="px-6 py-1 text-center">
                      <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest opacity-40">
                        VERSION 2.6.0 • SECURE CLOUD SYSTEM
                      </p>
                    </div>
                  </div>
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
        ) : null}

        {/* Main Content */}
        {(() => {
          const effectiveHideBottomNav = !!hideBottomNav;
          return (
            <main 
              ref={mainRef}
              className={`flex-1 min-h-0 ${fullWidth ? 'flex flex-col overflow-hidden' : 'overscroll-none overflow-y-auto overflow-x-hidden glass-layout'} transition-colors relative z-10 ${fullWidth ? 'pb-0' : (!effectiveHideBottomNav ? 'pb-[calc(76px+env(safe-area-inset-bottom))]' : 'pb-[calc(1.2rem+env(safe-area-inset-bottom))]')}`}
              style={{ background: 'transparent' }}
            >
              <div 
                className={fullWidth ? "w-full flex-1 flex flex-col min-h-0" : "w-full max-w-7xl mx-auto px-global pt-6 pb-6 lg:pb-10"}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              >
                {children}
              </div>
            </main>
          );
        })()}

        {/* Bottom Nav (Mobile/Tablet Only) */}
        {!isFirstLoginRequired && typeof document !== 'undefined' ? createPortal(
        (() => {
          const effectiveHideBottomNav = !!hideBottomNav;
          return (
            <nav 
              className={`lg:hidden fixed bottom-0 w-full flex flex-col z-[1100] shadow-[0_-4px_10px_rgba(0,0,0,0.05)] bottom-nav-solid transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${(!effectiveHideBottomNav) ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}`}
              style={{ 
                paddingBottom: 'env(safe-area-inset-bottom)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : rawNavBg,
                backdropFilter: 'none',
                WebkitBackdropFilter: 'none'
              }}
            >
              <div className="h-[60px] flex items-center justify-evenly px-0 relative">
                {bottomNavItems.map((item) => {
              const isActive = item.id === 'USER_PROFILE' 
                ? (currentView === 'USER_PROFILE' && !selectedUser)
                : currentView === item.id;

              const isNavBgDark = navTextColor === '#ffffff';
              const activeItemColor = navTextColor;
              const inactiveItemColor = isNavBgDark 
                ? 'rgba(255, 255, 255, 0.55)' 
                : 'rgba(0, 0, 0, 0.5)';
              const activeItemBg = isNavBgDark 
                ? 'rgba(255, 255, 255, 0.15)' 
                : addOpacityToHex(activePrimaryColor, 0.12);
              const activeItemBorder = isNavBgDark
                ? '1px solid rgba(255, 255, 255, 0.15)'
                : `1px solid ${addOpacityToHex(activePrimaryColor, 0.2)}`;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    nav.clear();
                    if (item.id === 'USER_PROFILE') setSelectedUser(null);
                    setView(item.id as any);
                  }}
                  className={`relative z-10 flex flex-col items-center justify-center gap-0.5 p-1 w-full h-[90%] transition-all ${
                    isActive 
                      ? 'opacity-100 font-black' 
                      : 'opacity-60 hover:opacity-85'
                  }`}
                  style={{ 
                    color: isActive ? activeItemColor : inactiveItemColor,
                  }}
                >
                  {isActive && (
                    <div
                      
                      className="absolute rounded-xl z-[-1]"
                      style={{
                        background: activeItemBg,
                        border: activeItemBorder,
                        boxShadow: isNavBgDark ? 'inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 2px 4px rgba(0, 0, 0, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                        top: '4%',
                        bottom: '4%',
                        left: '15%',
                        right: '15%',
                      }}
                      
                    />
                  )}
                  <div
                    className={isActive ? 'scale-110' : 'scale-100'}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-black tracking-widest">{toSentenceCase(item.label)}</span>
                </button>
              );
            })}
          </div>
        </nav>
          );
        })(),
        document.body
        ) : null}
      </div>
    </div>
  );
};

export default Layout;
