import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Filesystem } from '@capacitor/filesystem';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { NavigationBar, Style as NavigationBarStyle } from '@capawesome/capacitor-navigation-bar';
import { useStore, StoreProvider, GLOBAL_TRANSITION, GLOBAL_VARIANTS, StoreContext, StoreState } from '@/store';
import fleetproLogo from './assets/logo.png';
import defaultLoginWallpaper from './assets/login_wallpaper.png';
import { ShoppingCart, Wallet as WalletIcon, ArrowLeft, Bell, Moon, Sun, Menu, ChevronLeft } from 'lucide-react';
import { getContrastColor, getHexColor, isColorLight } from './utils/colorUtils';
import Layout from '@/components/Layout';

import { THEMES, TRANSLATIONS } from '@/constants';
import Dashboard from '@/views/Dashboard';
import VehicleList from '@/views/VehicleList';
import VehicleServices from '@/views/VehicleServices';
import BankAccountView from '@/views/BankAccountView';
import ContactsView from '@/views/Contacts';
import Profiles from '@/views/Profiles';
import Trips from '@/views/Trips';
import NewTrip from '@/views/NewTrip';
import LoanManagement from '@/views/LoanManagement';
import Login from '@/views/Login';
import Settings from '@/views/Settings';
import UserProfile from '@/views/UserProfile';
import Search from '@/views/Search';
import NewAccount from '@/views/NewAccount';
import ActiveUser from '@/views/ActiveUser';
import BlockList from '@/views/BlockList';
import UserAccounts from '@/views/UserAccounts';
import MonthlyFiles from '@/views/MonthlyFiles';
import Support from '@/views/Support';
import CreateCV from '@/views/CreateCV';
import FamilyMaintenance from '@/views/FamilyMaintenance';
import PrayerTimes from '@/views/PrayerTimes';
import UserPasswordReset from '@/views/UserPasswordReset';
import PaymentView from '@/views/Payment';
import MyIncome from '@/views/MyIncome';
import LeaveSettlement from '@/views/LeaveSettlement';
import FuelView from '@/views/Fuel';
import PurchaseView from '@/views/Purchase';
import WalletView from '@/views/Wallet';
import ManagerProfile from '@/views/ManagerProfile';
import UserRenew from '@/views/UserRenew';
import { NotificationsView, NotificationDetailView } from '@/views/Notifications';
import ThemeConfirmation from '@/components/ThemeConfirmation';
import MonthlyFileDetails from '@/views/MonthlyFileDetails';
import TripDetails from '@/views/TripDetails';
import Chat from '@/views/Chat';
import Statement from '@/views/Statement';
import InvoiceView from '@/views/Invoice';
import FeedbackModal from '@/components/FeedbackModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { ViewTransition } from '@/components/ViewTransition';
import { initPushNotifications } from './services/notificationService';
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';
import { NavigationOverlayOutlet } from '@/components/NavigationOverlayOutlet';

const LocationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const ViewContainer: React.FC = () => {
    const { clear: clearOverlays } = useNavigation();
    const [isAppLoading, setIsAppLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const { 
      currentView, user, setView, theme, selectedUser, fontStyle, fontSize, fontBold, 
      backgroundColor, wallpaper, loginWallpaper, loginBackgroundColor, isNightMode, isEyeComfort, appThemeMode, isLoadingView, editingTrip,
      logo, logout, activeSection, activeDetailView, headerBg, navBg, goBack, confirmAction, language,
      monthlyFiles, addMonthlyFile, setCurrentFile, primaryColor, isEntryFormOpen, isPaymentPopupOpen, setIsPaymentPopupOpen, isContactSelectionMode, isKeyboardOpen, setIsKeyboardOpen, customBackAction, navigationDirection,
      showReceivedBreakdown, showPendingBreakdown, customHeaderTitle,
      confirmConfig, showAvailableBalancePage, showPendingBreakdownPage, notifications, setAppThemeMode,
      isDrawerOpen, setIsDrawerOpen
    } = useStore();

    useEffect(() => {
      clearOverlays();
    }, [currentView]);

    const isAnyPopupOpen = !!(
      isPaymentPopupOpen || 
      isEntryFormOpen || 
      showReceivedBreakdown || 
      showPendingBreakdown || 
      showAvailableBalancePage || 
      showPendingBreakdownPage || 
      confirmConfig?.isOpen
    );

    const isDarkMode = isNightMode || appThemeMode === 'dark' || theme === 'night-mode';
    const isMainDashboard = currentView === 'DASHBOARD' && !activeSection && !activeDetailView;
    const hasBack = !isMainDashboard;
    const unreadCount = (notifications || []).filter((n: any) => !n.isRead).length;

    const formatHeaderDisplayTitle = (title: string | null | undefined): string => {
      if (!title) return '';
      // If the string contains non-latin scripts (like Bengali), return as is without casing changes
      if (/[\u0980-\u09FF]/.test(title)) {
        return title;
      }
      // Replace underscore with space
      const cleanTitle = title.replace(/_/g, ' ').trim();
      // If it's all uppercase or screaming snake case (e.g. BORROWER_DETAILS, DASHBOARD), convert to Title Case (Borrower Details)
      if (cleanTitle === cleanTitle.toUpperCase()) {
        return cleanTitle
          .toLowerCase()
          .split(' ')
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      return cleanTitle;
    };

    const getHeaderTitle = () => {
      let finalTitle = '';
      if (customHeaderTitle) {
        finalTitle = customHeaderTitle;
      } else {
        const rawTitle = getTitle();
        const t = TRANSLATIONS[language as 'en' | 'bn'] || TRANSLATIONS.en;
        
        if (currentView === 'NOTIFICATIONS') finalTitle = language === 'bn' ? 'বিজ্ঞপ্তি' : 'Notifications';
        else if (currentView === 'NOTIFICATION_DETAIL') finalTitle = language === 'bn' ? 'বিজ্ঞপ্তি বিবরণ' : 'Notification Detail';
        else if (currentView === 'VEHICLE_LIST') finalTitle = language === 'bn' ? 'যানবাহন তালিকা' : 'Vehicle List';
        else if (currentView === 'VEHICLE_SERVICES') finalTitle = language === 'bn' ? 'যানবাহন সার্ভিস' : 'Vehicle Services';
        else if (activeSection) {
          finalTitle = activeSection;
        } else if (activeDetailView) {
          if (activeDetailView === 'NEW') finalTitle = t.NEW_PROFILE;
          else finalTitle = language === 'bn' ? 'প্রোফাইল বিবরণ' : 'Profile Detail';
        } else {
          finalTitle = t[rawTitle as keyof typeof t] || rawTitle;
        }
      }

      return formatHeaderDisplayTitle(finalTitle);
    };

    const handleBackClick = () => {
      if (customBackAction) {
        customBackAction();
      } else {
        goBack();
      }
    };

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [prevView, setPrevView] = useState<typeof currentView | null>(null);
    // Starts true so the very first paint (app launch, or any freshly-mounted
    // screen) already has transitions disabled — a normal useEffect runs
    // AFTER the browser paints, so by the time it flipped this on, the
    // flash had already happened. useLayoutEffect below (which runs before
    // paint) then keeps it in sync on every view change too.
    const [noTransitions, setNoTransitions] = useState(true);
    const customBackActionRef = useRef(customBackAction);

    // Reset keyboard open state on view change and ensure it is false initially
    useEffect(() => {
      setIsKeyboardOpen(false);
    }, [currentView, setIsKeyboardOpen]);

    useEffect(() => {
      // Ensure initial state is false on load
      setIsKeyboardOpen(false);

      const isInputElement = (el: Element | null): boolean => {
        if (!el || !(el instanceof HTMLElement)) return false;
        if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable) {
          return true;
        }
        if (el.tagName === 'INPUT') {
          const type = (el as HTMLInputElement).type?.toLowerCase();
          const nonTypingTypes = ['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'image', 'range', 'color'];
          return !nonTypingTypes.includes(type);
        }
        return false;
      };

      const handleFocusIn = (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        if (isInputElement(target)) {
          setIsKeyboardOpen(true);
        }
      };

      const handleFocusOut = () => {
        setTimeout(() => {
          if (!isInputElement(document.activeElement)) {
            setIsKeyboardOpen(false);
          }
        }, 50);
      };

      window.addEventListener('focusin', handleFocusIn);
      window.addEventListener('focusout', handleFocusOut);

      return () => {
        window.removeEventListener('focusin', handleFocusIn);
        window.removeEventListener('focusout', handleFocusOut);
      };
    }, [setIsKeyboardOpen]);

    useEffect(() => {
      // We moved initPushNotifications to the sequenced requestPermissions below
      // so we just define the handler here or rely on the sequenced block.
    }, [user, setView]);

    useEffect(() => {
      customBackActionRef.current = customBackAction;
    }, [customBackAction]);

    // Auto-redirect Monthly Files to the current month's Trip Details page
    useEffect(() => {
      if (currentView === 'MONTHLY_FILES' && user) {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        
        let file = monthlyFiles.find(f => f.month === currentMonth && f.year === currentYear);
        if (!file) {
          const newFileId = `MF-${Date.now()}`;
          file = {
            id: newFileId,
            month: currentMonth,
            year: currentYear,
            status: 'OPEN',
            createdAt: today.toISOString(),
            userId: user.id
          };
          addMonthlyFile(file);
        }
        setCurrentFile(file);
        setView('MONTHLY_FILE_DETAILS', false);
      }
    }, [currentView, user?.id]);

    useEffect(() => {
      setIsInitialLoad(false);
    }, []);

    useEffect(() => {
      document.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }, [language]);

    useEffect(() => {
      setPrevView(prev => prev !== currentView ? currentView : prev);
    }, [currentView]);

    // useLayoutEffect runs synchronously after DOM mutations but BEFORE the
    // browser paints, so the no-initial-transitions class is guaranteed to
    // already be on the element for the first paint of every freshly
    // mounted screen — unlike useEffect, which fires after paint and was
    // letting one frame of animated border/shadow flash through first.
    useLayoutEffect(() => {
      setNoTransitions(true);
      const timer = setTimeout(() => {
        setNoTransitions(false);
      }, 150);
      return () => clearTimeout(timer);
    }, [currentView, activeSection, activeDetailView, showReceivedBreakdown, showPendingBreakdown]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' as any });
      }
    }, [currentView, activeSection, activeDetailView, showReceivedBreakdown, showPendingBreakdown]);

    useEffect(() => {
      const handlePopState = (event: PopStateEvent) => {
        const state = event.state;
        
        if (customBackActionRef.current) {
          window.history.pushState(state, '', ''); // Restore popped state
          customBackActionRef.current();
          return;
        }

        console.log('PopState event:', { currentView, activeSection, state });
        
        // If we are at the root view and try to go back
        // Or if the popped state is LOGIN/SIGNUP, we should treat it as an exit attempt from Dashboard
        const isLoginView = currentView === 'LOGIN' || currentView === 'SIGNUP';
        const isDashboardView = currentView === 'DASHBOARD' && !activeSection && !isLoadingView && !activeDetailView && !showReceivedBreakdown && !showPendingBreakdown;
        
        if (isDashboardView || isLoginView || (state && (state.view === 'LOGIN' || state.view === 'SIGNUP') && (currentView === 'DASHBOARD' || currentView === 'LOGIN' || currentView === 'SIGNUP') && !activeSection && !activeDetailView && !showReceivedBreakdown && !showPendingBreakdown)) {
          console.log('Exit condition met');
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

          // Push current state back so the user can try again or cancel
          window.history.pushState({ 
            view: currentView,
            activeSection: activeSection,
            activeDetailView: activeDetailView,
            showReceivedBreakdown: showReceivedBreakdown || false,
            showPendingBreakdown: showPendingBreakdown || false
          }, '', '');
          return;
        }
        
        // Otherwise, use our unified back logic with the popped state
        goBack(true, state);
      };

      window.addEventListener('popstate', handlePopState);
      
      let cleanupNative = false;
      let nativeBackListener: any;
      if (Capacitor.isNativePlatform()) {
        CapacitorApp.addListener('backButton', ({ canGoBack }) => {
          if (customBackActionRef.current) {
             customBackActionRef.current();
             return;
          }

          const isLoginView = currentView === 'LOGIN' || currentView === 'SIGNUP';
          const isDashboardView = currentView === 'DASHBOARD' && !activeSection && !isLoadingView && !activeDetailView && !showReceivedBreakdown && !showPendingBreakdown;
          
          if (isDashboardView || isLoginView) {
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
          } else {
            goBack(false);
          }
        }).then(listener => {
          if (cleanupNative) {
            listener.remove();
          } else {
            nativeBackListener = listener;
          }
        });
      }
      
      // Initial state push to enable back button handling from the start
      if (!window.history.state) {
        window.history.pushState({ 
          view: currentView,
          activeSection: null,
          activeDetailView: null,
          showReceivedBreakdown: false,
          showPendingBreakdown: false
        }, '', '');
      }

      return () => {
        cleanupNative = true;
        window.removeEventListener('popstate', handlePopState);
        if (nativeBackListener) {
          nativeBackListener.remove();
        }
      };
    }, [currentView, activeSection, isLoadingView, goBack, confirmAction, language, logout, setView, activeDetailView, showReceivedBreakdown, showPendingBreakdown]);

    useEffect(() => {
      const requestPermissions = async () => {
        if (Capacitor.isNativePlatform()) {
          // Add a small delay to ensure the app is fully in the foreground 
          // before triggering native OS dialogs, preventing them from being swallowed.
          await new Promise(resolve => setTimeout(resolve, 1500));

          try {
            if (Capacitor.isPluginAvailable('Geolocation')) {
              const geoStatus = await Geolocation.checkPermissions();
              if (geoStatus.location !== 'granted') {
                await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
              }
            }
          } catch (error) {
            console.error('Error requesting Geolocation permissions:', error);
          }
          
          try {
            if (Capacitor.isPluginAvailable('Camera')) {
              const camStatus = await Camera.checkPermissions();
              if (camStatus.camera !== 'granted' || camStatus.photos !== 'granted') {
                await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
              }
            }
          } catch (error) {
            console.error('Error requesting Camera permissions:', error);
          }
          
          try {
            if (Capacitor.isPluginAvailable('Filesystem')) {
              const fsStatus = await Filesystem.checkPermissions();
              if (fsStatus.publicStorage !== 'granted') {
                await Filesystem.requestPermissions();
              }
            }
          } catch (error) {
            console.error('Error requesting Filesystem permissions:', error);
          }

          // Initialize push notifications AFTER other permissions to prevent concurrent dialog crashes
          setTimeout(async () => {
            try {
              await initPushNotifications((data) => {
                if (data?.view) {
                  setView(data.view, false);
                }
              });
            } catch (error) {
              console.error('Error initializing push notifications:', error);
            }
          }, 1000);
        }
      };
      requestPermissions();
    }, [setView]);

    useEffect(() => {
      // Control Status Bar style specifically during splash screen to keep network/battery visible
      if (isAppLoading) {
        if (Capacitor.isNativePlatform()) {
          try {
            StatusBar.setOverlaysWebView({ overlay: true }).catch(console.warn);
            StatusBar.setStyle({ style: Style.Dark }).catch(console.warn);
          } catch (e) {
            console.warn('Error setting status bar style during loading:', e);
          }
        }
      } else {
        // Remove preload class after page load finishes so transitions can animate normally afterward
        const timer = setTimeout(() => {
          document.body.classList.remove('preload');
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [isAppLoading]);

    useEffect(() => {
      // Balanced simulated progress loader that is smooth, fast, but gives a beautiful visual experience
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          const next = prev + 4; // smooth loading
          if (next >= 100) {
            clearInterval(interval);
            setIsAppLoading(false);
            return 100;
          }
          return next;
        });
      }, 40);
      return () => clearInterval(interval);
    }, []);

    useEffect(() => {
      if (user && currentView === 'LOGIN') {
        setView('DASHBOARD');
      }
    }, [user, currentView, setView]);



    useEffect(() => {
        const root = document.documentElement;
        const isNightModeActive = isNightMode || appThemeMode === 'dark' || theme === 'night-mode';
        const isAuthScreen = !user || currentView === 'LOGIN' || currentView === 'SIGNUP';
        
        // Apply Theme Mode Class
        if (isNightModeActive) {
          root.classList.add('dark');
          root.classList.add('dark-mode');
        } else {
          root.classList.remove('dark');
          root.classList.remove('dark-mode');
        }

        // Apply Eye Comfort Shield (Night Mode)
        if (isEyeComfort) {
          root.classList.add('eye-comfort');
        } else {
          root.classList.remove('eye-comfort');
        }

        const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];
        root.style.setProperty('--primary', currentThemeObj.primary, 'important');
        
        // Apply Font Settings
        root.style.setProperty('--font-sans', `"${fontStyle}", ui-sans-serif, system-ui, sans-serif`, 'important');
        root.style.fontSize = `${fontSize}px`;
        
        if (fontBold) {
            document.body.classList.add('font-bold-override');
        } else {
            document.body.classList.remove('font-bold-override');
        }

        const addOpacityToHex = (hex: any, opacity: number) => {
          if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return hex;
          const r = parseInt(hex.length === 4 ? hex[1]+hex[1] : hex.substr(1, 2), 16);
          const g = parseInt(hex.length === 4 ? hex[2]+hex[2] : hex.substr(3, 2), 16);
          const b = parseInt(hex.length === 4 ? hex[3]+hex[3] : hex.substr(5, 2), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        const adjustColor = (color: any, amount: number, opacity: number = 1) => {
          if (!color || typeof color !== 'string' || color.startsWith('url') || color.includes('gradient')) return color;
          
          let hex = color;
          if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match && match.length >= 3) {
              const r = Math.max(0, Math.min(255, parseInt(match[0]) + amount));
              const g = Math.max(0, Math.min(255, parseInt(match[1]) + amount));
              const b = Math.max(0, Math.min(255, parseInt(match[2]) + amount));
              return `rgba(${r}, ${g}, ${b}, ${opacity})`;
            }
            return color;
          }

          hex = hex.replace('#', '');
          if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
          if (hex.length !== 6) return color;

          let r = parseInt(hex.substring(0, 2), 16);
          let g = parseInt(hex.substring(2, 4), 16);
          let b = parseInt(hex.substring(4, 6), 16);

          r = Math.max(0, Math.min(255, r + amount));
          g = Math.max(0, Math.min(255, g + amount));
          b = Math.max(0, Math.min(255, b + amount));

          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        };

        const blendColors = (baseHex: any, overlayRgb: { r: number, g: number, b: number }, opacity: number, fallbackHex = '#ffffff') => {
          if (!baseHex || typeof baseHex !== 'string') return fallbackHex;
          let hex = baseHex.trim();
          if (hex.includes('gradient')) {
            const match = hex.match(/#([0-9a-fA-F]{3,6})/);
            if (match) hex = match[0];
            else return fallbackHex;
          }
          hex = hex.replace('#', '');
          if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
          if (hex.length !== 6) return fallbackHex;
          
          const r1 = parseInt(hex.substring(0, 2), 16);
          const g1 = parseInt(hex.substring(2, 4), 16);
          const b1 = parseInt(hex.substring(4, 6), 16);
          
          const rCombined = Math.round(r1 * (1 - opacity) + overlayRgb.r * opacity);
          const gCombined = Math.round(g1 * (1 - opacity) + overlayRgb.g * opacity);
          const bCombined = Math.round(b1 * (1 - opacity) + overlayRgb.b * opacity);
          
          const toHex = (c: number) => {
            const h = Math.max(0, Math.min(255, c)).toString(16);
            return h.length === 1 ? '0' + h : h;
          };
          return `#${toHex(rCombined)}${toHex(gCombined)}${toHex(bCombined)}`;
        };

        let effectiveBg = backgroundColor;
        if (!effectiveBg) {
          effectiveBg = wallpaper ? "var(--page-bg-solid, #000000)" : (isNightModeActive ? '#000000' : '#f8fafc');
        }
        
        // Force effective background to pure black if night mode is active for contrast calculations
        if (isNightModeActive) {
          effectiveBg = '#000000';
        }
        
        // Explicit logic for dynamic text color based on background brightness
        let customContrast = '#000000';
        try {
          let testHex = effectiveBg;
          if (testHex.includes('gradient')) {
            const match = testHex.match(/#([0-9a-fA-F]{3,6})/);
            if (match) testHex = match[0];
          }
          testHex = testHex.replace('#', '');
          if (testHex.length === 3) {
            testHex = testHex[0] + testHex[0] + testHex[1] + testHex[1] + testHex[2] + testHex[2];
          }
          if (testHex.length === 6) {
            const r = parseInt(testHex.substr(0, 2), 16);
            const g = parseInt(testHex.substr(2, 2), 16);
            const b = parseInt(testHex.substr(4, 2), 16);
            // YIQ calculation to determine brightness
            const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            // If background is light (high YIQ), text should be dark/black
            // If background is dark (low YIQ), text should be white
            customContrast = (yiq >= 128) ? '#000000' : '#ffffff';
          } else {
            customContrast = getContrastColor(effectiveBg) || '#000000';
          }
        } catch (e) {
          customContrast = getContrastColor(effectiveBg) || '#000000';
        }

        const isDarkBg = customContrast === '#ffffff';
         
        // Calculate distinct header and nav backgrounds
        const headerBgBase = isDarkBg ? adjustColor(effectiveBg, 15, 0.85) : adjustColor(effectiveBg, -10, 0.85);
        const navBgBase = isDarkBg ? adjustColor(effectiveBg, 10, 0.85) : adjustColor(effectiveBg, -5, 0.85);

        const activePrimaryColor = primaryColor || currentThemeObj.primary || '#10b981';
        const isCustomBg = !isNightModeActive && !!backgroundColor;
        const layoutColor = headerBg ? headerBg : (isCustomBg ? backgroundColor : activePrimaryColor);

        // Determine effective Header and Navigation backgrounds
        const effectiveHeaderBg = 
          isNightModeActive
            ? '#000000' : (headerBg
                ? headerBg
                : (backgroundColor || '#f8fafc'));

        const effectiveNavBg = 
          isNightModeActive
            ? '#000000' : (navBg
                ? navBg
                : (backgroundColor || '#f8fafc'));

        const solidHeaderBg = getHexColor(effectiveHeaderBg, isNightModeActive ? '#000000' : '#FFFFFF');
        const solidNavBg = getHexColor(effectiveNavBg, isNightModeActive ? '#000000' : '#FFFFFF');
        const headerTextColor = isNightModeActive ? '#FFFFFF' : (getContrastColor(solidHeaderBg) || '#000000');
        const navTextColor = isNightModeActive ? '#FFFFFF' : (getContrastColor(solidNavBg) || '#000000');

        root.style.setProperty('--primary', activePrimaryColor);
        root.style.setProperty('--header-bg', solidHeaderBg);
        root.style.setProperty('--header-text', headerTextColor);
        root.style.setProperty('--sidebar-bg', solidHeaderBg);
        root.style.setProperty('--sidebar-text', headerTextColor);
        root.style.setProperty('--nav-bg', solidNavBg);
        root.style.setProperty('--nav-text', navTextColor);

        // Update PWA theme-color meta tag dynamically
        try {
          let meta = document.querySelector('meta[name="theme-color"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'theme-color');
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', solidHeaderBg);
        } catch (e) {
          console.warn('Error setting PWA theme-color meta tag:', e);
        }

        // Update StatusBar & NavigationBar for native mobile devices
        if (!isAppLoading && Capacitor.isNativePlatform()) {
          try {
            // Disable overlays so status bar gets a native, solid background color
            StatusBar.setOverlaysWebView({ overlay: false }).catch(console.warn);
            StatusBar.setBackgroundColor({ color: solidHeaderBg }).catch(console.warn);
            
            // Dynamic light/dark icon themes depending on header brightness
            const statusBarStyle = isColorLight(solidHeaderBg) ? Style.Light : Style.Dark;
            StatusBar.setStyle({ style: statusBarStyle }).catch(console.warn);

            // Dynamic bottom system navigation bar color matched exactly to footer navigation bar
            NavigationBar.setColor({ color: solidNavBg }).catch(console.warn);
            
            // Dynamic bottom system navigation bar icon themes matched to bottom navigation bar brightness
            const navBarStyle = isColorLight(solidNavBg) ? NavigationBarStyle.Light : NavigationBarStyle.Dark;
            NavigationBar.setStyle({ style: navBarStyle }).catch(console.warn);
          } catch (e) {
            console.warn('Error setting native system bars:', e);
          }
        }
         
        // Use layoutColor directly if it's set by the user, otherwise use the theme's default gradient logic
        const headerGradient = headerBg ? headerBg : (isNightModeActive ? 
          `linear-gradient(135deg, ${adjustColor(layoutColor, -40)} 0%, ${adjustColor(layoutColor, -20)} 50%, ${layoutColor} 100%)` :
          `linear-gradient(135deg, ${layoutColor} 0%, ${adjustColor(layoutColor, 20)} 50%, ${adjustColor(layoutColor, 40)} 100%)`
        );

        const lightAppGradient = 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)';
        const darkAppGradient = 'linear-gradient(135deg, #000000 0%, #000000 100%)';
         
        // Ensure the active nav item has a solid, distinct color from the background
        let navActiveBg = activePrimaryColor;
        // If the primary color is too similar to the background (e.g. both are light or both are dark),
        // we use the contrast color of the background to guarantee it is completely different.
        if (getContrastColor(activePrimaryColor) === getContrastColor(effectiveBg)) {
            navActiveBg = customContrast;
        }
        const navActiveText = getContrastColor(navActiveBg) || '#ffffff';
         
        root.style.setProperty('--nav-active-bg', navActiveBg);
        root.style.setProperty('--nav-active-text', navActiveText);
         
        // Set root text main contrast colors
        root.style.setProperty('--root-text-main', customContrast);
        root.style.setProperty('--root-text-muted', customContrast === '#000000' ? '#4b5563' : '#94a3b8');
         
        // Dynamically set search border & text colors on root to respond perfectly to background contrast
        root.style.setProperty('--search-border-color', customContrast === '#000000' ? 'rgba(0, 0, 0, 0.22)' : '#ffffff');
        root.style.setProperty('--search-text-color', customContrast === '#000000' ? '#111827' : '#ffffff');
        root.style.setProperty('--search-label-color', customContrast === '#000000' ? '#4b5563' : 'rgba(255, 255, 255, 0.7)');
        root.style.setProperty('--search-focus-border-color', isDarkBg ? '#ffffff' : activePrimaryColor);
        root.style.setProperty('--search-label-active-color', isDarkBg ? '#ffffff' : activePrimaryColor);
        root.style.setProperty('--input-label-active-color', isDarkBg ? '#ffffff' : activePrimaryColor);
         
        // Semantic Colors
        root.style.setProperty('--success', '#10b981'); // emerald-500
        root.style.setProperty('--danger', '#f43f5e');  // rose-500
        root.style.setProperty('--warning', '#f59e0b'); // amber-500
        root.style.setProperty('--info', '#10b981');    // blue-500

        if (isNightModeActive) {
          root.style.setProperty('--app-bg', '#000000', 'important');
          root.style.setProperty('--theme-bg', '#000000', 'important');
          // Updated Card Color to slightly darker for contrast with #000000
          root.style.setProperty('--card-bg', '#121212', 'important');
          root.style.setProperty('--nested-card-bg', '#1a1a1a', 'important');
          root.style.setProperty('--theme-card', '#121212', 'important');
          root.style.setProperty('--card-dark', '#121212', 'important');
          root.style.setProperty('--card-blur', '0px', 'important');
          
          root.style.setProperty('--card-bg-solid', '#121212', 'important');
          root.style.setProperty('--page-bg-solid', '#000000', 'important');
          
          root.style.setProperty('--input-border-color', '#333333', 'important');
          root.style.setProperty('--sidebar-bg', '#121212', 'important');
          root.style.setProperty('--sidebar-text', '#ffffff', 'important');
          root.style.setProperty('--form-bg', '#121212', 'important');
          root.style.setProperty('--header-bg', '#000000', 'important');
          root.style.setProperty('--nav-bg', '#000000', 'important');
          root.style.setProperty('--text-main', '#ffffff', 'important');
          root.style.setProperty('--text-muted', '#a1a1aa', 'important');
          root.style.setProperty('--text-inverse', '#000000', 'important');
          root.style.setProperty('--hover-bg', 'rgba(255, 255, 255, 0.1)', 'important');
          root.style.setProperty('--active-bg', addOpacityToHex(currentThemeObj.primary, 0.25), 'important');
          root.style.setProperty('--input-bg', 'rgba(255, 255, 255, 0.05)', 'important');
          document.documentElement.classList.remove('light');
          document.documentElement.classList.remove('dark-theme');
          document.documentElement.classList.add('dark');
          document.documentElement.classList.add('dark-mode');
        } else if (appThemeMode === 'light') {
          const authBg = wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || lightAppGradient);

          root.style.setProperty('--app-bg', authBg);
          root.style.setProperty('--theme-bg', authBg);
          
          root.style.setProperty('--card-bg-solid', '#ffffff');
          root.style.setProperty('--input-border-color', 'rgba(0, 0, 0, 0.22)');
          
          root.style.setProperty('--page-bg-solid', backgroundColor || '#f8fafc');
          
          root.style.setProperty('--card-bg', `#ffffff`);
          root.style.setProperty('--nested-card-bg', `#f3f4f6`);
          root.style.setProperty('--theme-card', `#ffffff`);
          root.style.setProperty('--card-dark', `#ffffff`);
          root.style.setProperty('--card-blur', `0px`);
          root.style.setProperty('--sidebar-bg', solidHeaderBg);
          root.style.setProperty('--sidebar-text', headerTextColor);
          root.style.setProperty('--form-bg', `#ffffff`);
          root.style.setProperty('--header-bg', solidHeaderBg);
          root.style.setProperty('--header-text', headerTextColor);
          root.style.setProperty('--nav-bg', solidNavBg);
          root.style.setProperty('--text-main', customContrast);
          root.style.setProperty('--text-muted', customContrast === '#000000' ? '#4b5563' : '#94a3b8');
          root.style.setProperty('--text-inverse', customContrast === '#000000' ? '#ffffff' : '#000000');
          root.style.setProperty('--hover-bg', 'rgba(0, 0, 0, 0.05)');
          root.style.setProperty('--active-bg', addOpacityToHex(currentThemeObj.primary, 0.15));
          root.style.setProperty('--input-bg', '#F4F6F8');
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.remove('dark-mode');
          document.documentElement.classList.remove('dark-theme');
        } else {
          // Safety fallback: appThemeMode should only ever be 'light' or 'dark'.
          // If it's ever an unexpected/corrupted value (e.g. stale data from an
          // older app version), default to light styling instead of forcing a
          // dark look — the app must never silently lock into dark mode.
          const authBg = wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || lightAppGradient);

          root.style.setProperty('--app-bg', authBg);
          root.style.setProperty('--theme-bg', authBg);

          root.style.setProperty('--card-bg-solid', '#ffffff');
          root.style.setProperty('--input-border-color', 'rgba(0, 0, 0, 0.22)');

          root.style.setProperty('--page-bg-solid', backgroundColor || '#f8fafc');

          root.style.setProperty('--card-bg', `#ffffff`);
          root.style.setProperty('--nested-card-bg', `#f3f4f6`);
          root.style.setProperty('--theme-card', `#ffffff`);
          root.style.setProperty('--card-dark', `#ffffff`);
          root.style.setProperty('--card-blur', `0px`);
          root.style.setProperty('--sidebar-bg', solidHeaderBg);
          root.style.setProperty('--sidebar-text', headerTextColor);
          root.style.setProperty('--form-bg', `#ffffff`);
          root.style.setProperty('--header-bg', solidHeaderBg);
          root.style.setProperty('--header-text', headerTextColor);
          root.style.setProperty('--nav-bg', solidNavBg);
          root.style.setProperty('--text-main', customContrast);
          root.style.setProperty('--text-muted', customContrast === '#000000' ? '#4b5563' : '#94a3b8');
          root.style.setProperty('--text-inverse', customContrast === '#000000' ? '#ffffff' : '#000000');
          root.style.setProperty('--hover-bg', 'rgba(0, 0, 0, 0.05)');
          root.style.setProperty('--active-bg', addOpacityToHex(currentThemeObj.primary, 0.15));
          root.style.setProperty('--input-bg', '#F4F6F8');
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.remove('dark-mode');
          document.documentElement.classList.remove('dark-theme');
        }
    }, [theme, fontStyle, fontSize, fontBold, backgroundColor, wallpaper, loginWallpaper, isNightMode, isEyeComfort, appThemeMode, headerBg, navBg, primaryColor, isAppLoading, user, currentView]);

    if (isAppLoading) {
      const effectiveLoginWallpaper = loginWallpaper || wallpaper || defaultLoginWallpaper;
      const isBackgroundLight = effectiveLoginWallpaper
        ? (appThemeMode === 'light' && theme !== 'night-mode')
        : (loginBackgroundColor ? getContrastColor(loginBackgroundColor) === '#000000' : false);
      const finalTextColor = isBackgroundLight ? '#0f172a' : '#ffffff';

      return (
        <div 
          className="fixed inset-0 z-[999999999] flex flex-col items-center justify-center overflow-hidden allow-animation"
          style={{
            backgroundImage: effectiveLoginWallpaper ? `url(${effectiveLoginWallpaper})` : undefined,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundColor: loginBackgroundColor || '#0f172a',
            color: finalTextColor,
          }}
        >
          <div className="relative flex flex-col items-center justify-center animate-scale-in">
            {/* Concentric Rotating Multi-Colored Rings around the centered Logo */}
            <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
              {/* Ring 1 (Outer Ring - Amber & Rose Accented) */}
              <div className="absolute w-[164px] h-[164px] rounded-full border border-t-amber-400 border-b-rose-500 border-l-transparent border-r-transparent animate-spin-cw-slow opacity-80" />

              {/* Ring 2 (Middle Ring - Fuchsia & Purple Accent) */}
              <div className="absolute w-[136px] h-[136px] rounded-full border-2 border-l-fuchsia-500 border-r-violet-500 border-t-transparent border-b-transparent animate-spin-ccw opacity-90" />

              {/* Ring 3 (Inner Ring - Cyan & Emerald Accent) */}
              <div className="absolute w-[108px] h-[108px] rounded-full border border-t-cyan-400 border-b-emerald-400 border-l-transparent border-r-transparent animate-spin-cw opacity-95" />

              {/* Centered Floating Application Logo */}
              <div className="relative w-20 h-20 rounded-[12px] overflow-hidden flex items-center justify-center animate-float bg-transparent">
                <img 
                  src={logo || fleetproLogo} 
                  alt="FleetPro Logo" 
                  loading="eager"
                  decoding="sync"
                  className="w-20 h-20 object-contain rounded-[12px] bg-transparent drop-shadow-[0_4px_12px_rgba(34,211,238,0.4)]" 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== fleetproLogo) {
                      target.src = fleetproLogo;
                    }
                  }}
                />
              </div>
            </div>

            {/* Glowing Text Header */}
            <div className="relative mb-1">
              <h1 className={`text-4xl font-extrabold tracking-[0.25em] uppercase bg-clip-text text-transparent drop-shadow-md ${
                isBackgroundLight 
                  ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700' 
                  : 'bg-gradient-to-r from-white via-slate-100 to-slate-400'
              }`}>
                FleetPro
              </h1>
            </div>
            
            <p className="text-xs font-black tracking-[0.6em] text-cyan-400 uppercase drop-shadow opacity-95 mb-10">
              Manager
            </p>

            {/* Premium Illuminated Progress Indicator */}
            <div className="flex flex-col items-center w-60">
              <div className={`w-full h-1.5 rounded-full overflow-hidden relative shadow-inner ${isBackgroundLight ? 'bg-slate-300/80 backdrop-blur-sm' : 'bg-black/40 backdrop-blur-sm'}`}>
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(6,182,212,0.8)]"
                  style={{ width: `${loadingProgress}%` }}
                >
                  <div className="absolute inset-0 animate-shimmer opacity-40"></div>
                </div>
              </div>
              <div className="mt-3.5 flex items-center justify-between w-full px-1">
                <span className={`text-[9px] font-black tracking-widest uppercase drop-shadow ${isBackgroundLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Connecting...
                </span>
                <span className="text-[10px] font-black tracking-widest text-cyan-400 drop-shadow">
                  {loadingProgress}%
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Attribution */}
          <div className="absolute bottom-10 flex flex-col items-center gap-2">
            <div className={`w-6 h-[1px] ${isBackgroundLight ? 'bg-slate-400/60' : 'bg-slate-500/60'}`}></div>
            <div className={`text-[9px] font-black tracking-[0.3em] uppercase drop-shadow ${isBackgroundLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Powering Logistics Excellence
            </div>
          </div>
        </div>
      );
    }

    // STRICT LOGIN PROTECTION: If no user, ALWAYS return Login view
    if (!user && currentView !== 'SIGNUP' && currentView !== 'SUPPORT' && currentView !== 'PRAYER_TIMES') {
      return (
        <>
          <Login />
          <FeedbackModal />
          <ConfirmationModal />
        </>
      );
    }

  if (currentView === 'LOGIN') {
    return (
      <>
        <Login />
        <FeedbackModal />
        <ConfirmationModal />
      </>
    );
  }

const renderView = (view: StoreState['currentView'], language: string) => {
  switch (view) { 
    case 'DASHBOARD': return <Dashboard />;
    case 'VEHICLE_LIST': return <VehicleList />;
    case 'VEHICLE_SERVICES': return <VehicleServices />;
    case 'TRIPS': return <Trips />;
    case 'PROFILES': return <Profiles />;
    case 'MONTHLY_FILES': return <MonthlyFiles />;
    case 'CONTACTS': return <ContactsView />;
    case 'NEW_TRIP': return <NewTrip />;
    case 'LOAN': return <LoanManagement />;
    case 'FINANCE': return <div className="text-center py-20 font-black uppercase text-gray-400 opacity-50">{TRANSLATIONS[language]?.COMING_SOON || 'Coming Soon...'}</div>;
    case 'FUEL': return <FuelView />;
    case 'DOWNLOAD': return <CreateCV />;
    case 'PURCHASE':
    case 'NEW_PURCHASE': return <PurchaseView />;
    case 'WALLET': return <WalletView />;
    case 'BANK_ACCOUNT': return <BankAccountView />;
    case 'ADMIN': return <Dashboard />;
    case 'SETTINGS': return <Settings />;
    case 'USER_PROFILE': return <UserProfile />;
    case 'MY_INCOME': return <MyIncome />;
    case 'FAMILY_MAINTENANCE': return <FamilyMaintenance />;
    case 'LEAVE_SETTLEMENT': return <LeaveSettlement />;
    case 'USER_RENEW': return <UserRenew />;
    case 'PAYMENT': return <PaymentView />;
    case 'STATEMENT': return <Statement />;
    case 'INVOICE': return <InvoiceView />;
    case 'ACCOUNT': return <NewAccount />;
    case 'ACTIVE_USER': return <ActiveUser />;
    case 'BLOCK_LIST': return <BlockList />;
    case 'USER_ACCOUNTS': return <UserAccounts />;
    case 'MANAGER_PROFILE': return <ManagerProfile />;
    case 'SEARCH': return <Search />;
    case 'ADMIN_PROFILE_UPDATE': return <UserProfile />;
    case 'SUPPORT': return <Support />;
    case 'PRAYER_TIMES': return <PrayerTimes />;
    case 'MONTHLY_FILE_DETAILS': return <MonthlyFileDetails />;
    case 'TRIP_DETAILS': return <TripDetails />;
    case 'CHAT': return <Chat />;
    case 'USER_PASSWORD_RESET': return <UserPasswordReset />;
    case 'NOTIFICATIONS': return <NotificationsView />;
    case 'NOTIFICATION_DETAIL': return <NotificationDetailView />;
    default: return <Dashboard />;
  }
};

  const isFullscreenView = [
    'MONTHLY_FILE_DETAILS',
    'CHAT',
    'NEW_TRIP',
    'NEW_PURCHASE',
    'MONTHLY_FILES',
    'SETTINGS',
    'ACTIVE_USER',
    'BLOCK_LIST',
    'SEARCH',
    'ADMIN_PROFILE_UPDATE',
    'SUPPORT',
    'PRAYER_TIMES',
    'USER_PASSWORD_RESET',
    'NOTIFICATIONS',
    'NOTIFICATION_DETAIL'
  ].includes(currentView);

  const getTitle = () => {
    if (currentView === 'USER_PROFILE') {
      const displayUser = selectedUser || user;
      const isViewingSelf = !selectedUser || selectedUser.id === user?.id;
      if (isViewingSelf) return 'MY_PROFILE';
      return 'USER_PROFILE';
    }
    if (currentView === 'ADMIN_PROFILE_UPDATE') {
      return 'USER_PROFILE';
    }
    if (currentView === 'NEW_TRIP' && editingTrip) {
      return 'EDIT_TRIP';
    }
    if (currentView === 'USER_RENEW') {
      return 'ACCOUNT_EXPIRED';
    }
    const isPendingIncome = localStorage.getItem('pendingAction') === 'ADD_INCOME';
    if (currentView === 'PAYMENT' && (isEntryFormOpen || isPendingIncome)) {
      return "New Transaction";
    }
    return currentView;
  };

  const isPendingIncome = localStorage.getItem('pendingAction') === 'ADD_INCOME';
  const shouldHideHeader = (currentView === 'MY_INCOME' && (activeSection === 'PENDING_PAGE' || (typeof activeSection === 'string' && (activeSection.startsWith('CATEGORY_') || activeSection.startsWith('PENDING_CATEGORY_'))))) || (currentView === 'PAYMENT' && (isEntryFormOpen || isPendingIncome)) || currentView === 'CHAT';
  const shouldBeFullWidth = (currentView === 'MY_INCOME' && (activeSection === 'PENDING_PAGE' || activeSection === 'INCOME' || activeSection === 'DEDUCTION' || (typeof activeSection === 'string' && (activeSection.startsWith('CATEGORY_') || activeSection.startsWith('PENDING_CATEGORY_'))) || activeSection === 'ADD_INCOME')) || currentView === 'CHAT' || currentView === 'SETTINGS' || currentView === 'WALLET' || currentView === 'SEARCH';

  const mainNavViews = ['DASHBOARD', 'SEARCH', 'PAYMENT', 'USER_PROFILE', 'TRIPS', 'PROFILES', 'MONTHLY_FILES', 'SETTINGS', 'FINANCE', 'MY_INCOME', 'CHAT', 'NOTIFICATIONS', 'FUEL', 'DOWNLOAD', 'BANK_ACCOUNT'];
  const isNavTransition = prevView && mainNavViews.includes(prevView) && mainNavViews.includes(currentView);

  const isBottomNavHidden = !user || currentView === 'CHAT' || isKeyboardOpen;
  const isLayoutPaddingHidden = !user || currentView === 'CHAT' || isKeyboardOpen;

  const viewKey = `${currentView}-${activeSection || ''}-${activeDetailView || ''}`;

  return (
    <>
      <Layout 
        title={getTitle()}
        hideBottomNav={isBottomNavHidden}
      hideHeader={true}
      fullWidth={true}
    >
      <div 
        className="w-full h-full flex flex-col relative z-20 overflow-hidden app-container"
        style={{ background: wallpaper ? 'transparent' : ((isNightMode || appThemeMode === 'dark' || theme === 'night-mode') ? "var(--page-bg-solid, #000000)" : (backgroundColor || 'var(--app-bg)')) }}
      >
                <div
          className="w-full h-full flex flex-col absolute inset-0 overflow-hidden"
          style={{ 
            backgroundColor: (isNightMode || appThemeMode === 'dark' || theme === 'night-mode') ? "#000000" : (backgroundColor || '#f8fafc'),
            background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : ((isNightMode || appThemeMode === 'dark' || theme === 'night-mode') ? "var(--page-bg-solid, #000000)" : (backgroundColor || 'var(--app-bg, #f8fafc)')) 
          }}
        >
          <ViewTransition currentKey={viewKey} className="w-full h-full flex flex-col">
            <div 
              className={`w-full h-full flex flex-col ${isNightMode || appThemeMode === 'dark' || theme === 'night-mode' ? 'dark' : ''} ${noTransitions ? 'no-initial-transitions' : ''}`}
              style={{ background: wallpaper ? 'transparent' : ((isNightMode || appThemeMode === 'dark' || theme === 'night-mode') ? "var(--page-bg-solid, #000000)" : (backgroundColor || 'var(--app-bg)')) }}
            >
              {/* Toper (Top Bar Header) */}
              {!shouldHideHeader && (
                <div 
                  className="flex-none shadow-sm safe-top z-40 transition-colors duration-300"
                  style={{ 
                    background: 'var(--header-bg)',
                    borderBottom: isDarkMode ? '1px solid #1f2937' : '1px solid #e2e8f0'
                  }}
                >
                  <div className="h-14 flex items-center justify-between px-4 w-full gap-2">
                    {/* Left: Menu Icon (Dashboard only) or Back Button (Subpages) & Title */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {(() => {
                        const iconColor = 'var(--header-text)';
                        const isLightIcon = isDarkMode || getContrastColor(headerBg || backgroundColor || '#ffffff') === '#ffffff';
                        const hoverBgClass = isLightIcon 
                          ? 'hover:bg-white/10 active:bg-white/20' 
                          : 'hover:bg-black/5 active:bg-black/10';
                        const btnClass = `p-2 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform duration-100 ease-out select-none ${hoverBgClass}`;

                        if (isMainDashboard) {
                          return (
                            <button 
                              onClick={() => setIsDrawerOpen(true)}
                              className={`${btnClass} lg:hidden`}
                              style={{ color: iconColor }}
                            >
                              <Menu size={22} />
                            </button>
                          );
                        } else {
                          return (
                            <button 
                              onClick={handleBackClick}
                              className={btnClass}
                              style={{ color: iconColor }}
                            >
                              <ChevronLeft size={24} />
                            </button>
                          );
                        }
                      })()}
                      
                      {/* Center/Left Title */}
                      <h2 
                        className="font-bold text-lg tracking-tight truncate"
                        style={{ color: 'var(--header-text)' }}
                      >
                        {getHeaderTitle()}
                      </h2>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Notifications Bell */}
                      <button 
                        onClick={() => setView('NOTIFICATIONS')}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors relative flex items-center justify-center"
                        style={{ color: 'var(--header-text)' }}
                      >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-extrabold text-white animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      {/* Theme Toggle Button */}
                      <button 
                        onClick={() => {
                          if (isDarkMode) {
                            setAppThemeMode('light');
                          } else {
                            setAppThemeMode('dark');
                          }
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center"
                        style={{ color: 'var(--header-text)' }}
                      >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex-1 relative overflow-hidden">
                <div 
                  ref={scrollContainerRef}
                  className={`w-full h-full ${shouldBeFullWidth ? 'flex flex-col' : `overflow-y-auto px-global pt-global ${isLayoutPaddingHidden ? 'pb-[calc(1.2rem+env(safe-area-inset-bottom))]' : 'pb-[calc(76px+env(safe-area-inset-bottom)+16px)]'}`}`}
                >
                  {renderView(currentView, language)}
                </div>
              </div>
            </div>
          </ViewTransition>
        </div>
      </div>
      {isLoadingView && createPortal(
        <div
          className="fixed inset-0 z-[99999999] flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-md"
        >
          <div className="flex items-center space-x-2 h-12">
            <div className="w-2 h-full rounded-sm animate-wave-1" style={{ backgroundColor: 'var(--primary)' }}></div>
            <div className="w-2 h-full rounded-sm animate-wave-2" style={{ backgroundColor: 'var(--primary)' }}></div>
            <div className="w-2 h-full rounded-sm animate-wave-3" style={{ backgroundColor: 'var(--primary)' }}></div>
            <div className="w-2 h-full rounded-sm animate-wave-4" style={{ backgroundColor: 'var(--primary)' }}></div>
          </div>
        </div>,
        document.body
      )}
      <ThemeConfirmation />
      <FeedbackModal />
      <ConfirmationModal />
    </Layout>
    </>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <LocationGuard>
        <NavigationProvider>
          <ViewContainer />
          <NavigationOverlayOutlet />
        </NavigationProvider>
      </LocationGuard>
    </StoreProvider>
  );
};

export default App;
