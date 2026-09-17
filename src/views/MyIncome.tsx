
import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft,
  Filter,
  Calendar,
  Search,
  MoreVertical,
  Printer,
  FileText,
  X,
  ChevronRight,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Receipt,
  AlertCircle,
  DollarSign,
  ArrowLeft,
  Clock,
  Award,
  Heart,
  Zap,
  Utensils,
  AlertTriangle,
  Car,
  Smartphone,
  Fuel,
  Info,
  ChevronLeft,
  Download,
  Trash2,
  Landmark,
  Briefcase,
  CircleDot,
  Truck,
  Bell,
  Moon,
  Sun,
  Check
} from 'lucide-react';
import { useStore, GLOBAL_TRANSITION, GLOBAL_VARIANTS } from '../store';
import { TRANSLATIONS } from '../constants';
import { Payment } from '../types';
import { PaymentManager } from '../services/PaymentManager';
import { getContrastColor } from '../utils/colorUtils';
import { formatCategoryHeader } from '../utils/formatUtils';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import InputField from '@/components/InputField';

const getCategoryCardDetails = (category: string) => {
  const cat = category.toLowerCase().trim();
  if (cat.includes('salary')) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700',
      icon: Wallet,
      label: 'Salary',
    };
  }
  if (cat.includes('commission')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600',
      icon: TrendingUp,
      label: 'Commission',
    };
  }
  if (cat.includes('friday')) {
    return {
      gradient: 'bg-gradient-to-br from-fuchsia-500 via-purple-600 to-pink-600',
      icon: Calendar,
      label: 'Friday',
    };
  }
  if (cat.includes('bonus')) {
    return {
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600',
      icon: Award,
      label: 'Bonus',
    };
  }
  if (cat.includes('advance')) {
    return {
      gradient: 'bg-gradient-to-br from-orange-500 via-amber-600 to-orange-700',
      icon: DollarSign,
      label: 'Advance',
    };
  }
  if (cat.includes('kitchen')) {
    return {
      gradient: 'bg-gradient-to-br from-rose-500 via-rose-600 to-red-600',
      icon: Receipt,
      label: 'Kitchen Service',
    };
  }
  if (cat.includes('penalty')) {
    return {
      gradient: 'bg-gradient-to-br from-red-500 via-red-600 to-rose-700',
      icon: AlertCircle,
      label: 'Penalty',
    };
  }
  if (cat.includes('traffic')) {
    return {
      gradient: 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600',
      icon: AlertCircle,
      label: 'Traffic Fine',
    };
  }
  if (cat.includes('mobile')) {
    return {
      gradient: 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700',
      icon: FileText,
      label: 'Mobile Bills',
    };
  }
  if (cat.includes('vehicle') || cat.includes('inspection') || cat.includes('extra')) {
    return {
      gradient: 'bg-gradient-to-br from-sky-500 via-blue-500 to-blue-600',
      icon: Truck,
      label: 'Vehicle Inspection',
    };
  }
  return {
    gradient: 'bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800',
    icon: Info,
    label: category || 'Other',
  };
};

const getCategoryIcon = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('salary')) return { icon: Wallet, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
  if (cat.includes('commission')) return { icon: TrendingUp, color: '#10b981', bg: 'rgba(59, 130, 246, 0.1)' };
  if (cat.includes('advance')) return { icon: DollarSign, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
  if (cat.includes('friday')) return { icon: Calendar, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' };
  if (cat.includes('bonus')) return { icon: Award, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
  if (cat.includes('tip')) return { icon: Heart, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' };
  if (cat.includes('extra')) return { icon: Zap, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' };
  if (cat.includes('kitchen')) return { icon: Utensils, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' };
  if (cat.includes('penalty')) return { icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
  if (cat.includes('traffic') || cat.includes('fine')) return { icon: Car, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' };
  if (cat.includes('mobile') || cat.includes('bill')) return { icon: Smartphone, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.1)' };
  if (cat.includes('diesel') || cat.includes('fuel')) return { icon: Fuel, color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
  return { icon: Info, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };
};

const MyIncome: React.FC = () => {
  const { language, setView, payments, trips, monthlyFiles, theme, headerBg, headerText, user, addPayment, updatePayment, removePayment, confirmAction, showFeedback, activeSection, setActiveSection, isNightMode, appThemeMode, setAppThemeMode, notifications, setIsLoadingView, backgroundColor, wallpaper, currencies, selectedCurrency, isDarkMode: storeIsDarkMode, advanceReasons, setSelectedTrip, goBack, globalFilterMonth, setGlobalFilterMonth, globalFilterYear, setGlobalFilterYear, walletIncomeSources, walletDeductionReasons } = useStore();
  
  const currency = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency) || currencies[0] || { code: 'QAR', symbol: 'QAR' };
  }, [currencies, selectedCurrency]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0
      }
    }
  };

  const renderHeaderActions = () => {
    const unreadCount = (notifications || []).filter((n: any) => !n.isRead).length;
    return (
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <button 
            onClick={() => {
              setActiveSection(null);
              setView('NOTIFICATIONS');
            }}
            className="p-2 rounded-lg transition-all opacity-70 relative"
            style={{ color: 'var(--header-text)' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <button 
          onClick={() => {
            if (appThemeMode === 'light') {
              setAppThemeMode('dark');
            } else {
              setAppThemeMode('light');
            }
          }}
          className="p-2 rounded-lg transition-all opacity-70"
          style={{ color: 'var(--header-text)' }}
          title="Toggle Theme Mode"
        >
          {appThemeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    );
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
       opacity: 1, 
       y: 0,
      transition: {
        type: 'tween', duration: 0,
        stiffness: 300,
        damping: 25
      }
    }
  };
  
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';
  const t = TRANSLATIONS[language];
  const effectiveBg = useMemo(() => {
    if (isNightMode) return '#000000';
    if (backgroundColor) return backgroundColor;
    if (wallpaper) return '#000000';
    return appThemeMode === 'light' ? '#f8fafc' : '#000000';
  }, [isNightMode, backgroundColor, wallpaper, appThemeMode]);

  const dynamicTextColor = useMemo(() => getContrastColor(effectiveBg), [effectiveBg]);
  const dynamicMutedColor = useMemo(() => dynamicTextColor === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', [dynamicTextColor]);
  
  const selectedYear = globalFilterYear;
  const setSelectedYear = setGlobalFilterYear;
  const selectedMonth = globalFilterMonth;
  const setSelectedMonth = setGlobalFilterMonth;
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number | 'ALL'>('ALL');


const PendingBreakdownPage = ({ data, total, onClose, currency, isDark, wallpaper, backgroundColor, isNightMode, appThemeMode, trips, monthlyFiles, payments }: any) => {
  const { setIsLoadingView, user, removePayment, confirmAction, showFeedback, language, updateTrip, trips: storeTrips, activeSection, setActiveSection, goBack, setView, setSelectedTrip, globalFilterMonth, setGlobalFilterMonth, globalFilterYear, setGlobalFilterYear, notifications, setAppThemeMode } = useStore();
  const selectedCategory = typeof activeSection === 'string' && activeSection.startsWith('PENDING_CATEGORY_')
    ? activeSection.replace('PENDING_CATEGORY_', '')
    : null;
  const [detailedItems, setDetailedItems] = useState<any[]>([]);

  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<number | 'ALL'>('ALL');
  const [filterYear, setFilterYear] = useState<number | 'ALL'>('ALL');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Popup Modal state
  const [selectedItemForPopup, setSelectedItemForPopup] = useState<any | null>(null);

  const renderHeaderActions = () => {
    const unreadCount = (notifications || []).filter((n: any) => !n.isRead).length;
    return (
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <button 
            onClick={() => {
              onClose();
              setView('NOTIFICATIONS');
            }}
            className="p-2 rounded-lg transition-all opacity-70 relative"
            style={{ color: 'var(--header-text)' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <button 
          onClick={() => {
            if (appThemeMode === 'light') {
              setAppThemeMode('dark');
            } else {
              setAppThemeMode('light');
            }
          }}
          className="p-2 rounded-lg transition-all opacity-70"
          style={{ color: 'var(--header-text)' }}
          title="Toggle Theme Mode"
        >
          {appThemeMode === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    );
  };

  const getDynamicCardTitle = (categoryName: string) => {
    const cat = (categoryName || '').toUpperCase();
    if (cat.includes('SALARY')) {
      return language === 'bn' ? 'স্যালারি' : 'Salary';
    }
    if (cat.includes('COMMISSION')) {
      return language === 'bn' ? 'কমিশন' : 'Commission';
    }
    if (cat.includes('DIESEL') || cat.includes('FUEL')) {
      return language === 'bn' ? 'ডিজেল রিসিট' : 'Diesel Receipt';
    }
    if (cat.includes('ADVANCE')) {
      return language === 'bn' ? 'অগ্রিম' : 'Advance';
    }
    if (cat.includes('FRIDAY')) {
      return language === 'bn' ? 'ফ্রাইডে ডিউটি' : 'Friday Duty';
    }
    if (cat.includes('BONUS')) {
      return language === 'bn' ? 'বোনাস' : 'Bonus';
    }
    if (cat.includes('TIP')) {
      return language === 'bn' ? 'টিপস' : 'Tips';
    }
    if (cat.includes('EXTRA')) {
      return language === 'bn' ? 'অতিরিক্ত দায়িত্ব (Extra Duty)' : 'Extra Duty';
    }
    if (cat.includes('KITCHEN')) {
      return language === 'bn' ? 'কিচেন সার্ভিস' : 'Kitchen Service';
    }
    if (cat.includes('PENALTY')) {
      return language === 'bn' ? 'জরিমানা (Penalty)' : 'Penalty';
    }
    if (cat.includes('TRAFFIC')) {
      return language === 'bn' ? 'ট্রাফিক ফাইন' : 'Traffic Fine';
    }
    if (cat.includes('MOBILE')) {
      return language === 'bn' ? 'মোবাইল বিল' : 'Mobile Bill';
    }
    return formatCategoryHeader(categoryName);
  };

  useEffect(() => {
    const currentM = new Date().getMonth() + 1;
    const currentY = new Date().getFullYear();
    setGlobalFilterMonth(currentM);
    setGlobalFilterYear(currentY);
    return () => {
      const exitM = new Date().getMonth() + 1;
      const exitY = new Date().getFullYear();
      setGlobalFilterMonth(exitM);
      setGlobalFilterYear(exitY);
    };
  }, [setGlobalFilterMonth, setGlobalFilterYear]);

  useEffect(() => {
    if (!selectedCategory) {
      setDetailedItems([]);
      return;
    }
    const allPendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments, selectedCategory);
    
    let items: any[] = [];
    allPendingDues.forEach((fileGroup: any) => {
      fileGroup.categories.forEach((catGroup: any) => {
        if ((catGroup.name || '').toLowerCase() === (selectedCategory || '').toLowerCase()) {
          const itemsWithDate = catGroup.items.map((item: any) => ({
            ...item,
            month: fileGroup.month,
            year: fileGroup.year
          }));
          items = [...items, ...itemsWithDate];
        }
      });
    });
    
    setDetailedItems(items);
  }, [selectedCategory, trips, monthlyFiles, payments]);

  const clearPendingDuesForIds = (ids: string[]) => {
    ids.forEach((id: string) => {
      if (!id || typeof id !== 'string') return;
      if (id.startsWith('AGG-')) {
        const parts = id.split('-');
        if (parts.length >= 4) {
          const subKey = parts[1];
          const fileId = parts[2];
          const rawCompany = parts.slice(3).join('-');
          const companyNameClean = rawCompany.replace(/_/g, ' ').trim().toUpperCase();

          const tripsToUpdate = storeTrips.filter(t => {
            const matchesFile = t.fileId === fileId;
            const matchesCompany = (t.companyName || '').trim().toUpperCase() === companyNameClean ||
                                   (t.companyName || 'Unknown Company').trim().toUpperCase() === companyNameClean;
            return matchesFile && matchesCompany;
          });

          tripsToUpdate.forEach(trip => {
            const updatedTrip = { ...trip };
            if (subKey === 'commission') {
              updatedTrip.commissionPaid = updatedTrip.commission || 0;
            } else if (subKey === 'dieselPrice') {
              updatedTrip.dieselPaid = updatedTrip.dieselPrice || 0;
            } else if (subKey === 'generatorDiesel') {
              updatedTrip.generatorDieselPaid = updatedTrip.generatorDiesel || 0;
              if ('genDieselPaid' in updatedTrip) {
                (updatedTrip as any).genDieselPaid = (updatedTrip as any).genDiesel || 0;
              }
            } else if (subKey === 'extraDiesel') {
              updatedTrip.extraDieselPaid = updatedTrip.extraDiesel || 0;
            } else if (subKey === 'bonus') {
              updatedTrip.bonusPaid = updatedTrip.bonus || 0;
            } else if (subKey === 'friday') {
              updatedTrip.fridayPaid = updatedTrip.friday || 0;
            } else if (subKey === 'overtime') {
              updatedTrip.overtimePaid = updatedTrip.overtime || 0;
            }

            const totalAmount = updatedTrip.totalAmount || 0;
            const newPaidAmount = (updatedTrip.commissionPaid || 0) + 
                                  (updatedTrip.dieselPaid || 0) + 
                                  (updatedTrip.extraDieselPaid || 0) + 
                                  (updatedTrip.bonusPaid || 0) + 
                                  (updatedTrip.fridayPaid || 0) + 
                                  (updatedTrip.overtimePaid || 0);
            
            updatedTrip.paidAmount = newPaidAmount;
            if (newPaidAmount <= 0) updatedTrip.paymentStatus = 'UNPAID';
            else if (newPaidAmount < totalAmount) updatedTrip.paymentStatus = 'PARTIAL';
            else updatedTrip.paymentStatus = 'PAID';

            updateTrip(updatedTrip);
          });
        }
      } else if (id.includes('-') && !id.startsWith('PAY-')) {
        const lastIndex = id.lastIndexOf('-');
        const tripId = id.substring(0, lastIndex);
        const subKey = id.substring(lastIndex + 1);
        
        const trip = storeTrips.find(t => t.id === tripId);
        if (trip) {
          const updatedTrip = { ...trip };
          if (subKey === 'commission') {
            updatedTrip.commissionPaid = updatedTrip.commission || 0;
          } else if (subKey === 'dieselPrice') {
            updatedTrip.dieselPaid = updatedTrip.dieselPrice || 0;
          } else if (subKey === 'generatorDiesel') {
            updatedTrip.generatorDieselPaid = updatedTrip.generatorDiesel || 0;
            if ('genDieselPaid' in updatedTrip) {
              (updatedTrip as any).genDieselPaid = (updatedTrip as any).genDiesel || 0;
            }
          } else if (subKey === 'extraDiesel') {
            updatedTrip.extraDieselPaid = updatedTrip.extraDiesel || 0;
          } else if (subKey === 'bonus') {
            updatedTrip.bonusPaid = updatedTrip.bonus || 0;
          } else if (subKey === 'friday') {
            updatedTrip.fridayPaid = updatedTrip.friday || 0;
          } else if (subKey === 'overtime') {
            updatedTrip.overtimePaid = updatedTrip.overtime || 0;
          }
          
          const totalAmount = updatedTrip.totalAmount || 0;
          const newPaidAmount = (updatedTrip.commissionPaid || 0) + 
                                (updatedTrip.dieselPaid || 0) + 
                                (updatedTrip.extraDieselPaid || 0) + 
                                (updatedTrip.bonusPaid || 0) + 
                                (updatedTrip.fridayPaid || 0) + 
                                (updatedTrip.overtimePaid || 0);
          
          updatedTrip.paidAmount = newPaidAmount;
          if (newPaidAmount <= 0) updatedTrip.paymentStatus = 'UNPAID';
          else if (newPaidAmount < totalAmount) updatedTrip.paymentStatus = 'PARTIAL';
          else updatedTrip.paymentStatus = 'PAID';
          
          updateTrip(updatedTrip);
        } else {
          removePayment(id);
        }
      } else {
        removePayment(id);
      }
    });
  };

  const handleDeletePaymentItem = (id: string) => {
        confirmAction(t.TRANSACTION_DELETE_DESC || 'Are you sure you want to delete this transaction?', () => {
      clearPendingDuesForIds([id]);
      showFeedback(t.TRANSACTION_DELETED_SUCCESS || 'Transaction deleted successfully');
      setDetailedItems(prev => prev.filter(p => !p.id.includes(id)));
    });
  };

  const handleCategoryClick = (category: string) => {
    setActiveSection(`PENDING_CATEGORY_${category}`);
  };

  const effectiveBg = useMemo(() => {
    if (isNightMode) return '#000000';
    if (backgroundColor) return backgroundColor;
    if (wallpaper) return '#000000';
    return appThemeMode === 'light' ? '#f8fafc' : '#000000';
  }, [isNightMode, backgroundColor, wallpaper, appThemeMode]);

  const dynamicTextColor = useMemo(() => getContrastColor(effectiveBg), [effectiveBg]);
  const dynamicMutedColor = useMemo(() => dynamicTextColor === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', [dynamicTextColor]);

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-theme-bg fixed inset-0 z-50 ${isDark ? 'dark' : ''}`}
      style={{ background: isDark ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)')) }}
    >
      {!selectedCategory ? (
        <div
          key="main"
          className="flex flex-col h-full w-full absolute inset-0"
        >
          <div 
            className="flex-none shadow-md safe-top"
            style={{ 
              background: 'var(--header-bg)'
            }}
          >
            <div className="h-16 flex items-center justify-between px-4 w-full gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button 
                  onClick={onClose} 
                  className="flex items-center justify-center transition-colors shrink-0"
                  style={{ color: 'var(--header-text)' }}
                >
                  <ChevronLeft size={24} />
                </button>
                <h3 className="text-sm font-bold uppercase tracking-tight truncate" style={{ color: 'var(--header-text)' }}>
                  {language === 'bn' ? 'পেন্ডিং ব্যালেন্স' : 'Pending Balance'}
                </h3>
              </div>
              {renderHeaderActions()}
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div 
              
              
              
              className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-[calc(160px+env(safe-area-inset-bottom))]"
            >
              {/* Pending Balance Top Summary Card */}
              <div className="relative overflow-hidden rounded-[10px] p-6 text-white bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 border border-white/10" style={{ boxShadow: 'var(--dynamic-card-shadow)' }}>
                {/* Watermark: Clock icon */}
                <div className="absolute right-[-24px] bottom-[-24px] opacity-15 pointer-events-none scale-110">
                  <Clock size={140} strokeWidth={1} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-85 mb-2">
                    {language === 'bn' ? 'পেন্ডিং ব্যালেন্স' : 'Pending Balance'}
                  </span>
                  <h2 className="text-3xl font-black tracking-tight mb-3">
                    {currency.code} {total.toLocaleString()}
                  </h2>
                  <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 border border-white/10 w-fit backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-300 shadow-[0_0_8px_rgba(253,186,116,0.8)]"></span>
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {language === 'bn' ? 'পেন্ডিং ব্যালেন্স' : 'Pending balance'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Month & Year Filters */}
              <div className="grid grid-cols-2 gap-3 mb-2">
                {/* Month Selector */}
                <div className="relative">
                  <select
                    value={globalFilterMonth}
                    onChange={(e) => setGlobalFilterMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-[10px] text-xs bg-card-bg border border-black/10 dark:border-white/10 text-text-main focus:outline-none appearance-none cursor-pointer pr-10 font-bold shadow-sm"
                  >
                    <option value="ALL">{language === 'bn' ? 'সকল মাস' : 'All Months'}</option>
                    {[
                      { value: 1, label: language === 'bn' ? 'জানুয়ারি' : 'January' },
                      { value: 2, label: language === 'bn' ? 'ফেব্রুয়ারি' : 'February' },
                      { value: 3, label: language === 'bn' ? 'মার্চ' : 'March' },
                      { value: 4, label: language === 'bn' ? 'এপ্রিল' : 'April' },
                      { value: 5, label: language === 'bn' ? 'মে' : 'May' },
                      { value: 6, label: language === 'bn' ? 'জুন' : 'June' },
                      { value: 7, label: language === 'bn' ? 'জুলাই' : 'July' },
                      { value: 8, label: language === 'bn' ? 'আগস্ট' : 'August' },
                      { value: 9, label: language === 'bn' ? 'সেপ্টেম্বর' : 'September' },
                      { value: 10, label: language === 'bn' ? 'অক্টোবর' : 'October' },
                      { value: 11, label: language === 'bn' ? 'নভেম্বর' : 'November' },
                      { value: 12, label: language === 'bn' ? 'ডিসেম্বর' : 'December' }
                    ].map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
                </div>

                {/* Year Selector */}
                <div className="relative">
                  <select
                    value={globalFilterYear}
                    onChange={(e) => setGlobalFilterYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-[10px] text-xs bg-card-bg border border-black/10 dark:border-white/10 text-text-main focus:outline-none appearance-none cursor-pointer pr-10 font-bold shadow-sm"
                  >
                    <option value="ALL">{language === 'bn' ? 'সকল বছর' : 'All Years'}</option>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {Object.entries(data).map(([key, value]: [string, any], index: number) => {
                const { icon: Icon, color, bg } = getCategoryIcon(key);
                return (
                  <div 
                    key={key} 
                    
                    
                    onClick={() => handleCategoryClick(key)}
                    className="bg-card-bg backdrop-blur-md p-5 rounded-[10px] shadow-sm flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center`} style={{ backgroundColor: bg, color: color }}>
                        <Icon size={18} />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-tight text-text-muted`}>{key}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold text-text-main`}>{currency.code} {value.toLocaleString()}</span>
                      <ChevronRight size={16} style={{ color: dynamicMutedColor, opacity: 0.5 }} />
                    </div>
                  </div>
                );
              })}
              {Object.keys(data).length === 0 && (
                <div className="flex flex-col items-center py-12 opacity-80">
                  <AlertCircle size={48} className="mb-4 text-text-main" />
                  <p className="text-sm font-bold uppercase tracking-widest text-text-main">No pending items</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          key={selectedCategory}
          className={`flex flex-col h-full absolute inset-0 w-full ${isDark ? 'dark' : ''}`}
          style={{ 
            backgroundColor: isDark ? "var(--page-bg-solid, #000000)" : '#f8fafc',
            background: isDark ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)')) 
          }}
        >
            <div 
              className="flex-none shadow-md safe-top"
              style={{ 
                background: 'var(--header-bg)'
              }}
            >
              <div className="h-16 flex items-center justify-between px-4 w-full gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button 
                    onClick={() => {
                      if (selectedCategory) {
                        goBack();
                      } else {
                        onClose();
                      }
                    }}
                    className="flex items-center justify-center transition-colors shrink-0"
                    style={{ color: 'var(--header-text)' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h3 className="text-sm font-bold capitalize tracking-tight truncate" style={{ color: 'var(--header-text)' }}>
                    {selectedCategory ? `Pending ${formatCategoryHeader(selectedCategory)} Details` : 'Pending Details'}
                  </h3>
                </div>
                {renderHeaderActions()}
              </div>
            </div>

            <div 
              
              
              
              className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-6"
            >
              {/* Compute displayItems early */}
              {(() => {
                const displayItems = detailedItems.filter(item => {
                  if (filterMonth !== 'ALL') {
                    if (Number(item.month) !== Number(filterMonth)) return false;
                  }
                  if (filterYear !== 'ALL') {
                    if (Number(item.year) !== Number(filterYear)) return false;
                  }
                  if (searchQuery.trim() !== '') {
                    const query = searchQuery.toLowerCase();
                    const companyName = (item.details?.companyName || '').toLowerCase();
                    const containerNum = (item.details?.containerNumber || '').toLowerCase();
                    const vehicleNum = (item.details?.vehicleNumber || '').toLowerCase();
                    const invoiceNum = (item.details?.invoiceNumber || '').toLowerCase();
                    const label = (item.label || '').toLowerCase();
                    
                    const matchesSearch = companyName.includes(query) ||
                                          containerNum.includes(query) ||
                                          vehicleNum.includes(query) ||
                                          invoiceNum.includes(query) ||
                                          label.includes(query);
                    if (!matchesSearch) return false;
                  }
                  return true;
                });

                const totalAmountNum = displayItems.reduce((acc, item) => acc + (Number(item.pending) || 0), 0);
                
                const monthsList = [
                  { value: 1, label: language === 'bn' ? 'জানুয়ারি' : 'January' },
                  { value: 2, label: language === 'bn' ? 'ফেব্রুয়ারি' : 'February' },
                  { value: 3, label: language === 'bn' ? 'মার্চ' : 'March' },
                  { value: 4, label: language === 'bn' ? 'এপ্রিল' : 'April' },
                  { value: 5, label: language === 'bn' ? 'মে' : 'May' },
                  { value: 6, label: language === 'bn' ? 'জুন' : 'June' },
                  { value: 7, label: language === 'bn' ? 'জুলাই' : 'July' },
                  { value: 8, label: language === 'bn' ? 'আগস্ট' : 'August' },
                  { value: 9, label: language === 'bn' ? 'সেপ্টেম্বর' : 'September' },
                  { value: 10, label: language === 'bn' ? 'অক্টোবর' : 'October' },
                  { value: 11, label: language === 'bn' ? 'নভেম্বর' : 'November' },
                  { value: 12, label: language === 'bn' ? 'ডিসেম্বর' : 'December' }
                ];
                const currentYear = new Date().getFullYear();
                const yearsList = Array.from({ length: 5 }, (_, i) => currentYear - i);

                return (
                  <>
                    {(() => {
                      const cardDetails = getCategoryCardDetails(selectedCategory || '');
                      const CardIcon = cardDetails.icon;
                      return (
                        <div className={`rounded-[10px] p-6 text-white relative overflow-hidden mb-4 ${cardDetails.gradient}`} style={{ boxShadow: 'var(--dynamic-card-shadow)' }}>
                          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-4 translate-y-4">
                            <CardIcon size={120} />
                          </div>
                          <span className="block text-[10px] font-black uppercase tracking-wider opacity-85 mb-1.5 text-center">
                            {language === 'bn' ? `${cardDetails.label} পেন্ডিং ব্যালেন্স` : `Pending ${cardDetails.label} Balance`}
                          </span>
                          <h2 className="text-3xl font-black text-center font-sans tracking-tight mb-3">
                            {currency.code} {totalAmountNum.toLocaleString()}
                          </h2>
                          <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/10 w-fit mx-auto">
                            <Clock size={13} className="animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-wider">
                              {language === 'bn' ? 'স্ট্যাটাস: পেন্ডিং' : 'Status: Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Month Select */}
                        <div className="relative">
                          <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                            className="w-full px-3 py-3 rounded-[10px] text-xs bg-card-bg border border-black/10 dark:border-white/10 text-text-main focus:outline-none appearance-none cursor-pointer pr-8 font-semibold"
                          >
                            <option value="ALL">{language === 'bn' ? 'সকল মাস' : 'All Months'}</option>
                            {monthsList.map(m => (
                              <option key={m.value} value={m.value}>{m.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>

                        {/* Year Select */}
                        <div className="relative">
                          <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                            className="w-full px-3 py-3 rounded-[10px] text-xs bg-card-bg border border-black/10 dark:border-white/10 text-text-main focus:outline-none appearance-none cursor-pointer pr-8 font-semibold"
                          >
                            <option value="ALL">{language === 'bn' ? 'সকল বছর' : 'All Years'}</option>
                            {yearsList.map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="pt-2 mb-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-main">
                  {language === 'bn' ? 'পেন্ডিং হিস্টোরি' : 'Pending History'}
                </h4>
              </div>

              {detailedItems.length === 0 ? (
                <div className="text-center py-20 text-text-main">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase">No pending {selectedCategory} found</p>
                </div>
              ) : (
                (() => {
                  const displayItems = detailedItems.filter(item => {
                    if (filterMonth !== 'ALL') {
                      if (Number(item.month) !== Number(filterMonth)) return false;
                    }
                    if (filterYear !== 'ALL') {
                      if (Number(item.year) !== Number(filterYear)) return false;
                    }
                    if (searchQuery.trim() !== '') {
                      const query = searchQuery.toLowerCase();
                      const companyName = (item.details?.companyName || '').toLowerCase();
                      const containerNum = (item.details?.containerNumber || '').toLowerCase();
                      const vehicleNum = (item.details?.vehicleNumber || '').toLowerCase();
                      const invoiceNum = (item.details?.invoiceNumber || '').toLowerCase();
                      const label = (item.label || '').toLowerCase();
                      
                      const matchesSearch = companyName.includes(query) ||
                                            containerNum.includes(query) ||
                                            vehicleNum.includes(query) ||
                                            invoiceNum.includes(query) ||
                                            label.includes(query);
                      if (!matchesSearch) return false;
                    }
                    return true;
                  });

                  if (displayItems.length === 0) {
                    return (
                      <div className="text-center py-16 text-text-main">
                        <AlertCircle size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
                          {language === 'bn' ? 'কোনো পেন্ডিং ট্রানজেকশন পাওয়া যায়নি' : 'No pending transactions found'}
                        </p>
                      </div>
                    );
                  }

                  return displayItems.map((item, index) => {
                    // Extract Source Name / Company Name
                    const companyName = item.details?.companyName && item.details.companyName !== 'N/A' 
                        ? item.details.companyName 
                        : (item.details?.containerNumber && item.details.containerNumber !== 'N/A'
                          ? item.details.containerNumber
                          : (item.details?.invoiceNumber && item.details.invoiceNumber !== 'N/A'
                            ? item.details.invoiceNumber
                            : (item.label && !/^\d{13}$/.test(item.label) ? item.label : 'Unknown Source')));
                            
                    // Determine Dynamic Title based on selectedCategory or subType
                    let dynamicTitle = selectedCategory || 'Pending Transaction';
                    if (selectedCategory?.toUpperCase() === 'SALARY') {
                        dynamicTitle = language === 'bn' ? 'স্যালারি' : 'Salary';
                    } else if (selectedCategory?.toUpperCase() === 'COMMISSION') {
                        dynamicTitle = language === 'bn' ? 'কমিশন (Commission)' : 'Commission';
                    } else if (item.details?.subType === 'dieselPrice') {
                        dynamicTitle = 'Trip Diesel';
                    } else if (item.details?.subType === 'generatorDiesel') {
                        dynamicTitle = 'Generator Diesel';
                    } else if (item.details?.subType === 'extraDiesel') {
                        dynamicTitle = 'Extra Diesel';
                    } else if (item.details?.subType === 'bonus') {
                        dynamicTitle = 'Bonus';
                    }

                    const { icon: DynamicIcon } = getCategoryIcon(dynamicTitle || selectedCategory || '');

                    return (
                        <div 
                          key={item.id || index}
                          className="group bg-card-bg border border-[var(--dynamic-card-border)] rounded-[8px] p-4 flex items-center justify-between hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-out w-full cursor-pointer relative overflow-hidden pointer-events-auto"
                          style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                          onClick={() => setSelectedItemForPopup(item)}
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            {/* Icon container */}
                            <div className="w-12 h-12 rounded-[8px] flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 transition-transform duration-200 group-hover:scale-105">
                              {DynamicIcon ? <DynamicIcon size={22} className="stroke-[2]" /> : <DollarSign size={22} className="stroke-[2]" />}
                            </div>

                            {/* Center texts */}
                            <div className="flex-1 min-w-0 text-left space-y-1">
                              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                                  {dynamicTitle}
                                </span>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200/40 dark:border-amber-400/10 shrink-0">
                                  <Clock size={8} className="stroke-[3]" />
                                  {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                <span className="truncate max-w-[140px]">{companyName}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span className="font-mono text-[8px]">
                                  {item.date && item.date !== 'N/A' ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Amount */}
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black tracking-tight block text-amber-600 dark:text-amber-400">
                              {currency.code} {(Number(item.pending) || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                    );
                  });
                })()
              )}
              {/* Spacer to prevent overlapping with Total Card */}
              {detailedItems.length > 0 && (
                <div className="h-10 shrink-0 pointer-events-none" />
              )}
            </div>
          </div>
        )}

      {/* Transaction Details Modal */}
      {selectedItemForPopup && createPortal(
        <>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
            {/* Backdrop */}
            <div 
              onClick={() => setSelectedItemForPopup(null)}
              className="absolute inset-0"
            />
            
            {/* Modal Box */}
            <div 
              className="relative w-full max-w-md bg-theme-card rounded-[28px] overflow-hidden border border-[var(--dynamic-card-border)] z-10 flex flex-col h-[520px] animate-scale-in"
              style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
            >
              {/* Premium Header Banner */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                    <Clock size={20} className="stroke-[2.5]" />
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 block">
                      {language === 'bn' ? 'পেন্ডিং লেনদেনের বিবরণ' : 'Pending Details'}
                    </span>
                    <h3 className="text-base font-extrabold text-white truncate mt-0.5">
                      {selectedCategory || selectedItemForPopup.category || (language === 'bn' ? 'পেন্ডিং ইনকাম' : 'Pending Income')}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItemForPopup(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Content container */}
              <div className="p-5 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950/40 space-y-4">
                {/* Hero Amount centerpiece */}
                <div className="bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 rounded-2xl p-5 text-center relative overflow-hidden">
                  <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
                    {language === 'bn' ? 'মোট পেন্ডিং পরিমাণ' : 'Total Pending Amount'}
                  </p>
                  <h2 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                    {currency.code} {(Number(selectedItemForPopup.pending) || 0).toLocaleString()}
                  </h2>
                  
                  {/* Status Badge */}
                  <div className="flex justify-center mt-2 relative z-10">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Clock size={10} className="animate-pulse" />
                      {language === 'bn' ? 'পেন্ডিং' : 'PENDING'}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div 
                  className="bg-card-bg border border-[var(--dynamic-card-border)] rounded-2xl p-4 space-y-3.5 shadow-sm"
                  style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                >
                  {/* Source of Income */}
                  <div className="flex justify-between items-start py-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                      {language === 'bn' ? 'টাকার উৎস (Source)' : 'From / Source'}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 text-right break-words max-w-[200px]">
                      {selectedItemForPopup.details?.companyName && selectedItemForPopup.details.companyName !== 'N/A' 
                        ? selectedItemForPopup.details.companyName 
                        : (selectedItemForPopup.details?.containerNumber && selectedItemForPopup.details.containerNumber !== 'N/A'
                          ? selectedItemForPopup.details.containerNumber
                          : (selectedItemForPopup.details?.invoiceNumber && selectedItemForPopup.details.invoiceNumber !== 'N/A'
                            ? selectedItemForPopup.details.invoiceNumber
                            : (selectedItemForPopup.label && !/^\d{13}$/.test(selectedItemForPopup.label) ? selectedItemForPopup.label : (language === 'bn' ? 'অজানা সোর্স' : 'Unknown Source'))))}
                    </span>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  {/* Category */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 border border-amber-500/15">
                      {selectedCategory || selectedItemForPopup.category || 'N/A'}
                    </span>
                  </div>

                  {selectedItemForPopup.date && selectedItemForPopup.date !== 'N/A' && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      {/* Date */}
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {language === 'bn' ? 'তারিখ' : 'Date'}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {new Date(selectedItemForPopup.date).toLocaleDateString(
                            language === 'bn' ? 'bn-BD' : 'en-GB', 
                            { day: '2-digit', month: 'short', year: 'numeric' }
                          )}
                        </span>
                      </div>
                    </>
                  )}

                  {selectedItemForPopup.details?.containerNumber && selectedItemForPopup.details.containerNumber !== 'N/A' && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      {/* Container/Vehicle if available */}
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {language === 'bn' ? 'কন্টেইনার / গাড়ি' : 'Container / Vehicle'}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {selectedItemForPopup.details.containerNumber}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Timeline Section */}
                <div 
                  className="bg-card-bg border border-[var(--dynamic-card-border)] rounded-2xl p-4 shadow-sm"
                  style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                >
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 text-center">
                    {language === 'bn' ? 'লেনদেনের টাইমলাইন' : 'Transaction Timeline'}
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-2 relative">
                    {/* Progress Line */}
                    <div className="absolute top-2.5 left-8 right-8 h-0.5 bg-slate-100 dark:bg-slate-800" />
                    <div className="absolute top-2.5 left-8 w-1/3 h-0.5 bg-amber-500" />

                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-md shadow-amber-500/20">
                        ✓
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 mt-1.5 leading-none">
                        {language === 'bn' ? 'শুরু' : 'Initiated'}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">
                        {selectedItemForPopup.date && selectedItemForPopup.date !== 'N/A' 
                          ? new Date(new Date(selectedItemForPopup.date).getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
                          : '03 Jul'}
                      </span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center text-[10px] font-bold border border-slate-200/50 dark:border-slate-700">
                        2
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 mt-1.5 leading-none">
                        {language === 'bn' ? 'প্রসেসিং' : 'Processing'}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">
                        {selectedItemForPopup.date && selectedItemForPopup.date !== 'N/A' 
                          ? new Date(selectedItemForPopup.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
                          : '05 Jul'}
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center relative z-10">
                      <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center text-[10px] font-bold border border-slate-200/50 dark:border-slate-700">
                        3
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 mt-1.5 leading-none">
                        {language === 'bn' ? 'পেআউট' : 'Payout'}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase">
                        {selectedItemForPopup.date && selectedItemForPopup.date !== 'N/A' 
                          ? new Date(new Date(selectedItemForPopup.date).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) 
                          : '10 Jul'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedItemForPopup(null)}
                  className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

const SwipeTransactionCard = ({ payment, onClick, currency, isIncome, onDelete, itemVariants, language }: any) => {
  return (
    <div
      onClick={onClick}
      className="group bg-theme-card border-[var(--dynamic-card-border)] hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between shadow-[var(--dynamic-card-shadow)] hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-out w-full cursor-pointer relative overflow-hidden"
    >
      <div className="flex items-center gap-4 min-w-0 w-full">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 group-hover:scale-105 ${payment.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
          {payment.type === 'INCOME' ? <ArrowDownLeft size={22} className="stroke-[2]" /> : <ArrowUpRight size={22} className="stroke-[2]" />}
        </div>
        
        <div className="flex-1 min-w-0 text-left space-y-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate max-w-[130px]">
              {payment.category}
            </span>
            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full border shrink-0 ${
              payment.type === 'INCOME' 
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-500/10' 
                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200/40 dark:border-rose-500/10'
            }`}>
              {payment.type === 'INCOME' ? (
                <>
                  <Check size={8} className="stroke-[3]" />
                  {language === 'bn' ? 'রিসিভড' : 'Received'}
                </>
              ) : (
                <>
                  <TrendingDown size={8} className="stroke-[3]" />
                  {language === 'bn' ? 'কর্তন' : 'Deducted'}
                </>
              )}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[8px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
            <div className="flex items-center gap-1 shrink-0">
              <Calendar size={9} className="opacity-70 shrink-0" />
              <span className="font-mono">
                {new Date(payment.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 shrink-0 pl-2">
          <span className={`text-[13px] sm:text-[15px] font-black tracking-tight font-mono flex items-center ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isIncome ? '+' : '-'} {currency.code} {payment.amount.toLocaleString()}
          </span>
          <ChevronRight size={16} className="text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
        </div>
      </div>
    </div>
  );
};

  
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeCompany, setIncomeCompany] = useState('');
  const [incomeCategory, setIncomeCategory] = useState('Salary');
  const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
  const [advanceType, setAdvanceType] = useState<'TAKEN' | 'RETURNED'>('TAKEN');
  const [advanceReason, setAdvanceReason] = useState('');
  const [showAdvanceReasonSelect, setShowAdvanceReasonSelect] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isReasonFocused, setIsReasonFocused] = useState(false);
  const [advanceMethod, setAdvanceMethod] = useState<'CASH' | 'ONLINE_BANK' | 'MOBILE_BANKING'>('CASH');

  const months = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Filtered Data Logic
  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const yearMatch = selectedYear === 'ALL' ? true : Number(p.year) === Number(selectedYear);
      const monthMatch = selectedMonth === 'ALL' ? true : Number(p.month) === Number(selectedMonth);
      const pDate = new Date(p.date);
      const dateMatch = selectedDate === 'ALL' || pDate.getDate() === selectedDate;
      const isReceived = p.type === 'INCOME' ? p.status === 'RECEIVED' : true;
      // Exclude diesel, user renew, extra fuel, and vehicle inspection from the list
      const isDiesel = p.category ? p.category.toLowerCase().includes('diesel') : false;
      const isRenew = p.category ? p.category.toLowerCase().includes('renew') : false;
      const isExtraFuel = p.category ? p.category.toLowerCase().includes('extra fuel') : false;
      const isVehicleInspection = p.category ? p.category.toLowerCase().includes('vehicle inspection') : false;
      
      const isDieselAdv = p.category?.toLowerCase().includes('advance') && (
        (() => {
          const reason = (p.details?.advanceReason || p.details?.serviceName || p.serviceName || '').toLowerCase();
          return reason.includes('diesel') || reason.includes('ডিজেল') || reason.includes('fuel') || reason.includes('ফুয়েল');
        })()
      );

      return yearMatch && monthMatch && dateMatch && isReceived && !isDiesel && !isRenew && !isExtraFuel && !isVehicleInspection && !isDieselAdv;
    });
  }, [payments, selectedYear, selectedMonth, selectedDate]);

  // Aggregated Totals
  const totals = useMemo(() => {
    const income = {
      Salary: 0,
      Commission: 0,
      Advance: 0,
      Friday: 0,
      Bonus: 0,
      Tip: 0,
      Extra: 0,
      Total: 0,
      Pending: 0
    };
    const pendingIncome: Record<string, number> = {
      'Salary': 0,
      'Commission': 0,
      'Friday': 0,
      'Bonus': 0,
      'Others': 0,
    };
    const pendingItemsByCategory: Record<string, any[]> = {};
    const deduction = {
      'Kitchen Service': 0,
      Penalty: 0,
      'Traffic Fine': 0,
      'Mobile Bills': 0,
      Total: 0
    };

    payments.forEach(p => {
      // Use stored month and year for matching
      const yearMatch = selectedYear === 'ALL' ? true : Number(p.year) === Number(selectedYear);
      const monthMatch = selectedMonth === 'ALL' ? true : Number(p.month) === Number(selectedMonth);
      const pDate = new Date(p.date);
      const dateMatch = selectedDate === 'ALL' || pDate.getDate() === selectedDate;
      const isWithinDate = yearMatch && monthMatch && dateMatch;

      const pAmount = Number(p.amount) || 0;

      // Exclude if it is an advance taken for diesel / fuel
      const isDieselAdv = p.category?.toLowerCase().includes('advance') && (
        (() => {
          const reason = (p.details?.advanceReason || p.details?.serviceName || p.serviceName || '').toLowerCase();
          return reason.includes('diesel') || reason.includes('ডিজেল') || reason.includes('fuel') || reason.includes('ফুয়েল');
        })()
      );
      if (isDieselAdv) return;

      if (p.type === 'INCOME') {
        if (p.status === 'RECEIVED') {
          if (isWithinDate) {
            const cat = (p.category || '').toLowerCase();
            // Exclude diesel and user renew from income summary
            if (!cat.includes('diesel') && !cat.includes('renew') && !cat.includes('extra fuel') && !cat.includes('vehicle inspection')) {
              if (cat.includes('salary')) {
                income.Salary += pAmount;
                income.Total += pAmount;
              } else if (cat.includes('commission')) {
                income.Commission += pAmount;
                income.Total += pAmount;
              } else if (cat.includes('advance')) {
                if (p.details?.advanceType === 'RETURNED') {
                  income.Advance += pAmount;
                  income.Total += pAmount;
                } else {
                  income.Advance -= pAmount;
                  income.Total -= pAmount;
                }
              } else if (cat.includes('friday')) {
                income.Friday += pAmount;
                income.Total += pAmount;
              } else if (cat.includes('bonus')) {
                income.Bonus += pAmount;
                income.Total += pAmount;
              } else if (cat.includes('tip')) {
                income.Tip += pAmount;
                income.Total += pAmount;
              } else if (cat.includes('extra')) {
                income.Extra += pAmount;
                income.Total += pAmount;
              } else {
                income.Total += pAmount;
              }
            }
          }
        }
      } else {
        if (isWithinDate) {
          const cat = (p.category || '').toLowerCase();
          if (cat.includes('kitchen')) deduction['Kitchen Service'] += pAmount;
          else if (cat.includes('penalty')) deduction.Penalty += pAmount;
          else if (cat.includes('traffic')) deduction['Traffic Fine'] += pAmount;
          else if (cat.includes('mobile')) deduction['Mobile Bills'] += pAmount;
          else if (cat === 'advance' && p.details?.advanceType === 'RETURNED') {
            // Keep in calculation for deducting from Net balance/Main Account
          }
          deduction.Total += pAmount;
        }
      }
    });

    // Add pending dues from trips
    const pendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments);
    const matchingPending = pendingDues.filter(p => {
      const mMatch = selectedMonth === 'ALL' ? true : Number(p.month) === Number(selectedMonth);
      const yMatch = selectedYear === 'ALL' ? true : Number(p.year) === Number(selectedYear);
      return mMatch && yMatch;
    });
    
    matchingPending.forEach(currentMonthPending => {
      currentMonthPending.categories.forEach((cat: any) => {
        const catName = cat.name || '';
        const catNameLower = (catName || "").toLowerCase();
        if (!catNameLower.includes('diesel') && !catNameLower.includes('extra fuel') && !catNameLower.includes('vehicle inspection')) {
          const catPending = Number(cat.totalPending) || 0;
          income.Pending += catPending;

          
          const matchingKey = Object.keys(pendingIncome).find(
            k => ((k || "").toLowerCase()) === ((catName || "").toLowerCase())
          );
          
          const targetKey = matchingKey || 'Others';
          pendingIncome[targetKey] = (pendingIncome[targetKey] || 0) + catPending;
          
          if (!pendingItemsByCategory[targetKey]) {
            pendingItemsByCategory[targetKey] = [];
          }
          pendingItemsByCategory[targetKey] = [
            ...pendingItemsByCategory[targetKey],
            ...(cat.items || [])
          ];
        }
      });
    });

    const finalNet = income.Total - deduction.Total;
    return { 
      income, 
      pendingIncome, 
      pendingItemsByCategory, 
      deduction, 
      net: isNaN(finalNet) ? 0 : finalNet 
    };
  }, [payments, trips, monthlyFiles, selectedYear, selectedMonth, selectedDate]);

  const fallbackYear = selectedYear === 'ALL' ? new Date().getFullYear() : Number(selectedYear);
  const fallbackMonth = selectedMonth === 'ALL' ? new Date().getMonth() + 1 : Number(selectedMonth);
  const daysInMonth = new Date(fallbackYear, fallbackMonth, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useLayoutEffect(() => {
    const pendingAction = localStorage.getItem('pendingAction');
    const pendingCategory = localStorage.getItem('pendingCategory');
    const pendingCompanyVal = localStorage.getItem('pendingCompany');
    if (pendingAction === 'ADD_INCOME') {
      setActiveSection('ADD_INCOME');
      if (pendingCategory) {
        setIncomeCategory(pendingCategory);
      }
      if (pendingCompanyVal) {
        setIncomeCompany(pendingCompanyVal);
      }
      localStorage.removeItem('pendingAction');
      localStorage.removeItem('pendingCategory');
      localStorage.removeItem('pendingCompany');
    }
  }, [setActiveSection]);

  const handleSubmitIncome = () => {
    const now = new Date();
    const targetMonth = selectedMonth === 'ALL' ? (now.getMonth() + 1) : Number(selectedMonth);
    const targetYear = selectedYear === 'ALL' ? now.getFullYear() : Number(selectedYear);
    const targetDay = Math.min(now.getDate(), new Date(targetYear, targetMonth, 0).getDate());
    const pad = (n: number) => String(n).padStart(2, '0');
    const currentDate = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`;
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Use iso string representation starting at the computed date to ensure parse safety
    const computedISODate = new Date(`${currentDate}T${now.toTimeString().split(' ')[0]}`).toISOString();

    const newPayment: Payment = {
      id: Date.now().toString(),
      transactionId: 'TXN-' + Date.now(),
      amount: Number(incomeAmount),
      date: computedISODate,
      time: currentTime,
      type: 'INCOME',
      category: incomeCategory,
      method: 'CASH',
      details: { serviceName: incomeDesc, companyName: incomeCompany },
      userId: user?.id || '',
      month: targetMonth,
      year: targetYear,
      status: 'PENDING'
    };
    addPayment(newPayment);
    setActiveSection(null);
    setIncomeAmount('');
    setIncomeDesc('');
    showFeedback('Income added successfully!');
    setView('DASHBOARD');
  };

  const handleSubmitAdvance = () => {
    if (!advanceAmount || isNaN(Number(advanceAmount)) || Number(advanceAmount) <= 0) {
      showFeedback('Please enter a valid amount');
      return;
    }
    if (!advanceReason.trim()) {
      showFeedback('Please write the reason/purpose of the advance');
      return;
    }

    const now = new Date();
    const targetMonth = selectedMonth === 'ALL' ? (now.getMonth() + 1) : Number(selectedMonth);
    const targetYear = selectedYear === 'ALL' ? now.getFullYear() : Number(selectedYear);
    const targetDay = Math.min(now.getDate(), new Date(targetYear, targetMonth, 0).getDate());
    const pad = (n: number) => String(n).padStart(2, '0');
    const currentDate = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`;
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newPayment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      transactionId: 'TXN-' + Date.now(),
      amount: Number(advanceAmount),
      date: currentDate,
      time: currentTime,
      type: advanceType === 'TAKEN' ? 'INCOME' : 'DEDUCTION',
      category: 'Advance',
      method: advanceMethod,
      details: {
        advanceType: advanceType,
        advanceReason: advanceReason.trim(),
        serviceName: advanceReason.trim(),
        companyName: incomeCompany || 'Company',
      },
      userId: user?.id || 'USR1001',
      month: targetMonth,
      year: targetYear,
      status: 'RECEIVED'
    };

    addPayment(newPayment);
    setActiveSection(null);
    setAdvanceAmount('');
    setAdvanceReason('');
    setAdvanceType('TAKEN');
    setIncomeCategory('Salary');
    showFeedback('Advance transaction completed successfully!');
    setView('DASHBOARD');
  };

  const [showYearSelect, setShowYearSelect] = useState(false);
  const [showMonthSelect, setShowMonthSelect] = useState(false);
  const [showNetIncomeBreakdown, setShowNetIncomeBreakdown] = useState(false);
  const [categoryFilterMonth, setCategoryFilterMonth] = useState<number | 'ALL'>('ALL');
  const [categoryFilterYear, setCategoryFilterYear] = useState<number | 'ALL'>('ALL');

  // New state for navigation mapped to activeSection
  const showPendingPage = activeSection === 'PENDING_PAGE';
  const selectedCategoryBreakdown = typeof activeSection === 'string' && activeSection.startsWith('CATEGORY_') ? activeSection.replace('CATEGORY_', '') : null;

  const handleCategoryClick = (category: string | null) => {
    setActiveSection(category ? `CATEGORY_${category}` : null);
  };

  const handlePendingPageClick = (show: boolean) => {
    if (show) {
      setActiveSection('PENDING_PAGE');
    } else {
      setActiveSection(null);
    }
  };

  const handleOpenModal = (name: string, _label?: string, _options?: any[]) => {
    if (name === 'monthSelect') setShowMonthSelect(true);
    if (name === 'yearSelect') setShowYearSelect(true);
  };

  if (selectedCategoryBreakdown) {
    const isIncome = ['Salary', 'Commission', 'Friday', 'Bonus'].includes(selectedCategoryBreakdown);
    const isDeductionCategory = ['kitchen service charge', 'penalty', 'traffic fine', 'mobile bills', 'kitchen service', 'mobile bill'].includes(selectedCategoryBreakdown?.toLowerCase() || '');
    
    // Filter payments for the selected year and category
    const categoryPayments = payments.filter(p => {
      const yearMatch = categoryFilterYear === 'ALL' ? true : Number(p.year) === Number(categoryFilterYear);
      const monthMatch = categoryFilterMonth === 'ALL' ? true : (p.month != null && Number(p.month) === Number(categoryFilterMonth));
      const pCat = p.category ? p.category.toLowerCase() : '';
      const targetCatLower = (selectedCategoryBreakdown || '').toLowerCase();
      const catMatch = pCat.includes(targetCatLower) || 
                       targetCatLower.includes(pCat) || 
                       (selectedCategoryBreakdown === 'Kitchen service charge' && pCat.includes('kitchen')) ||
                       (selectedCategoryBreakdown === 'Penalty' && pCat.includes('penalty')) ||
                       (selectedCategoryBreakdown === 'Traffic Fine' && pCat.includes('traffic')) ||
                       (selectedCategoryBreakdown === 'Mobile bills' && pCat.includes('mobile'));
      
      const typeMatch = isIncome ? p.type === 'INCOME' && p.status === 'RECEIVED' : p.type === 'DEDUCTION';
      
      const isDieselAdv = p.category?.toLowerCase().includes('advance') && (
        (() => {
          const reason = (p.details?.advanceReason || p.details?.serviceName || p.serviceName || '').toLowerCase();
          return reason.includes('diesel') || reason.includes('ডিজেল') || reason.includes('fuel') || reason.includes('ফুয়েল');
        })()
      );

      return yearMatch && monthMatch && catMatch && typeMatch && !isDieselAdv;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
      <div 
        className="flex flex-col h-full"
        style={{ 
          backgroundColor: isDarkMode ? "var(--page-bg-solid, #000000)" : '#f8fafc',
          background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)')) 
        }}
      >
        {/* Header */}
        <div 
          className="flex-none shadow-md safe-top"
          style={{ 
            background: 'var(--header-bg)'
          }}
        >
          <div className="h-16 flex items-center justify-between px-4 w-full gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button 
                onClick={() => goBack()}
                className="flex items-center justify-center transition-colors shrink-0"
                style={{ color: 'var(--header-text)' }}
              >
                <ChevronLeft size={24} />
              </button>
              <h3 className="text-sm font-bold capitalize tracking-tight truncate" style={{ color: 'var(--header-text)' }}>{selectedCategoryBreakdown ? `${formatCategoryHeader(selectedCategoryBreakdown)} ${isDeductionCategory ? 'Details' : 'Received Details'}` : 'Received Details'}</h3>
            </div>
            {renderHeaderActions()}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-[calc(180px+env(safe-area-inset-bottom))]">
          {/* Top Card and Filters */}
          {(() => {
            const totalAmountNum = categoryPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
            
            const monthsList = [
              { value: 1, label: language === 'bn' ? 'জানুয়ারি' : 'January' },
              { value: 2, label: language === 'bn' ? 'ফেব্রুয়ারি' : 'February' },
              { value: 3, label: language === 'bn' ? 'মার্চ' : 'March' },
              { value: 4, label: language === 'bn' ? 'এপ্রিল' : 'April' },
              { value: 5, label: language === 'bn' ? 'মে' : 'May' },
              { value: 6, label: language === 'bn' ? 'জুন' : 'June' },
              { value: 7, label: language === 'bn' ? 'জুলাই' : 'July' },
              { value: 8, label: language === 'bn' ? 'আগস্ট' : 'August' },
              { value: 9, label: language === 'bn' ? 'সেপ্টেম্বর' : 'September' },
              { value: 10, label: language === 'bn' ? 'অক্টোবর' : 'October' },
              { value: 11, label: language === 'bn' ? 'নভেম্বর' : 'November' },
              { value: 12, label: language === 'bn' ? 'ডিসেম্বর' : 'December' }
            ];
            const currentYear = new Date().getFullYear();
            const yearsList = Array.from({ length: 5 }, (_, i) => currentYear - i);
            
            return (
              <>
                {(() => {
                  const cardDetails = getCategoryCardDetails(selectedCategoryBreakdown || '');
                  const CardIcon = cardDetails.icon;
                  return (
                    <div className={`rounded-[10px] p-6 text-white relative overflow-hidden mb-4 ${cardDetails.gradient}`} style={{ boxShadow: 'var(--dynamic-card-shadow)' }}>
                      <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-4 translate-y-4">
                        <CardIcon size={120} />
                      </div>
                      <span className="block text-[10px] font-black uppercase tracking-wider opacity-85 mb-1.5 text-center">
                        {language === 'bn' 
                          ? `${cardDetails.label} ${isIncome ? 'প্রাপ্ত ব্যালেন্স' : 'ডিডাকশন ব্যালেন্স'}` 
                          : `${cardDetails.label} ${isIncome ? 'Received Balance' : 'Deducted Balance'}`}
                      </span>
                      <h2 className="text-3xl font-black text-center font-sans tracking-tight mb-3">
                        {currency.code} {totalAmountNum.toLocaleString()}
                      </h2>
                      <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/10 w-fit mx-auto">
                        <Clock size={13} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {language === 'bn' 
                            ? (isIncome ? 'স্ট্যাটাস: প্রাপ্ত' : 'স্ট্যাটাস: ডিডাক্টেড') 
                            : (isIncome ? 'Status: Received' : 'Status: Deducted')}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Month Select */}
                    <div className="relative">
                      <select
                        value={categoryFilterMonth}
                        onChange={(e) => setCategoryFilterMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                        className="w-full px-3 py-3 rounded-[10px] text-xs bg-card-bg border border-black/10 dark:border-white/10 text-text-main focus:outline-none appearance-none cursor-pointer pr-8 font-semibold"
                      >
                        <option value="ALL">{language === 'bn' ? 'সকল মাস' : 'All Months'}</option>
                        {monthsList.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>

                    {/* Year Select */}
                    <div className="relative">
                      <select
                        value={categoryFilterYear}
                        onChange={(e) => setCategoryFilterYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                        className="w-full px-3 py-3 rounded-[10px] text-xs bg-card-bg border border-black/10 dark:border-white/10 text-text-main focus:outline-none appearance-none cursor-pointer pr-8 font-semibold"
                      >
                        <option value="ALL">{language === 'bn' ? 'সকল বছর' : 'All Years'}</option>
                        {yearsList.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-2 mb-2">
                  <h4 className="text-xs font-black uppercase tracking-widest text-text-main text-left">
                    {isDeductionCategory
                      ? (language === 'bn' ? 'Deductions History' : 'Deductions History')
                      : (language === 'bn' ? 'Payment History' : 'Payment History')}
                  </h4>
                </div>
              </>
            );
          })()}

          <div 
            
            
            
            className="space-y-3"
          >
            {(() => {
              let displayPayments = categoryPayments;
              const isCommissionBreakdown = selectedCategoryBreakdown?.toUpperCase() === 'COMMISSION';
              const isSalaryBreakdown = selectedCategoryBreakdown?.toUpperCase() === 'SALARY';
              
              if (isSalaryBreakdown) {
                const grouped: { [key: string]: any } = {};
                categoryPayments.forEach(p => {
                  const key = `${Number(p.month)}-${Number(p.year)}`;
                  if (!grouped[key]) {
                    grouped[key] = { ...p, id: key, amount: 0, ids: [] };
                  }
                  grouped[key].amount += Number(p.amount) || 0;
                  grouped[key].ids.push(p.id);
                });
                displayPayments = Object.values(grouped);
                displayPayments.sort((a, b) => {
                  if (b.year !== a.year) return b.year - a.year;
                  return b.month - a.month;
                });
              } else if (isCommissionBreakdown) {
                const grouped: { [key: string]: any } = {};
                categoryPayments.forEach(p => {
                  const cName = (p.details?.companyName || p.companyName || user?.companyName || 'Unknown Company').trim().toUpperCase();
                  const key = `${Number(p.month)}-${Number(p.year)}-${cName}`;
                  if (!grouped[key]) {
                    grouped[key] = {
                      ...p,
                      id: key,
                      amount: 0,
                      ids: [],
                      pendingItemsGrouped: {},
                    };
                  }
                  grouped[key].amount += Number(p.amount) || 0;
                  grouped[key].ids.push(p.id);
                  if (p.details?.pendingItems) {
                    Object.assign(grouped[key].pendingItemsGrouped, p.details.pendingItems);
                  }
                });
                displayPayments = Object.values(grouped);
                displayPayments.sort((a, b) => {
                  if (b.year !== a.year) return b.year - a.year;
                  return b.month - a.month;
                });
              }

              if (displayPayments.length === 0) {
                return (
                  <div 
                    className="text-center py-10 bg-card-bg rounded-[10px] border border-[var(--dynamic-card-border)]"
                    style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                  >
                    <p className="text-sm font-bold text-text-muted">No records found for {selectedYear}</p>
                  </div>
                );
              }

              return displayPayments.map((payment, index) => {
                let dynamicTitle = payment.category || 'Transaction';
                if (payment.category?.toUpperCase() === 'SALARY') {
                  dynamicTitle = language === 'bn' ? 'স্যালারি' : 'Salary';
                } else if (payment.category?.toUpperCase() === 'COMMISSION') {
                  dynamicTitle = 'Commission';
                }

                const displayDate = payment.date && payment.date !== 'N/A' 
                  ? new Date(payment.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) 
                  : (payment.year && payment.month ? new Date(payment.year, payment.month - 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A');

                const { icon: DynamicIcon } = getCategoryIcon(payment.category || '');

                return (
                    <div 
                      key={payment.id || index}
                      className="group bg-theme-card border-[var(--dynamic-card-border)] hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-2xl p-4 flex items-center justify-between shadow-[var(--dynamic-card-shadow)] hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-out w-full cursor-pointer relative overflow-hidden pointer-events-auto"
                      onClick={() => setSelectedTransaction(payment)}
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Icon container */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 group-hover:scale-105 ${
                          isIncome 
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                          {DynamicIcon ? <DynamicIcon size={22} className="stroke-[2]" /> : (isIncome ? <ArrowDownLeft size={22} className="stroke-[2]" /> : <ArrowUpRight size={22} className="stroke-[2]" />)}
                        </div>

                        {/* Center texts */}
                        <div className="flex-1 min-w-0 text-left space-y-1">
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                              {dynamicTitle}
                            </span>
                            {isIncome ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/10 shrink-0">
                                <Check size={8} className="stroke-[3]" />
                                {language === 'bn' ? 'রিসিভ' : 'Received'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/40 dark:border-rose-400/10 shrink-0">
                                <ArrowUpRight size={8} className="stroke-[3]" />
                                {language === 'bn' ? 'ডিডাক্টেড' : 'Deducted'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                            <Calendar size={11} className="opacity-70 shrink-0" />
                            <span className="font-mono">
                              {displayDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Amount */}
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-black tracking-tight block ${
                          isIncome 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {isIncome ? '+' : '-'}{currency.code} {(Number(payment.amount) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                );
              });
            })()}
          </div>
          {/* Spacer to prevent overlapping with Total Card */}
          {categoryPayments.length > 0 && (
            <div className="h-10 shrink-0 pointer-events-none" />
          )}
        </div>
        
        {/* DUPLICATED DIALOG FOR BREAKDOWN VIEW */}
        {/* Transaction Details Dialog */}
      {selectedTransaction && createPortal(
        <>
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              onClick={() => setSelectedTransaction(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <div 
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10 z-10 flex flex-col h-[520px]"
            >
              {/* Premium Header Banner */}
              <div className={`bg-gradient-to-r text-white p-5 flex items-center justify-between ${
                selectedTransaction.type === 'INCOME' ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                    {selectedTransaction.type === 'INCOME' ? (
                      <TrendingUp size={20} className="stroke-[2.5]" />
                    ) : (
                      <TrendingDown size={20} className="stroke-[2.5]" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/80 block">
                      {language === 'bn' ? 'লেনদেনের বিবরণ' : 'Transaction Details'}
                    </span>
                    <h3 className="text-base font-extrabold text-white truncate mt-0.5">
                      {selectedTransaction.type === 'INCOME' 
                        ? (language === 'bn' ? 'রিসিভড ইনকাম' : 'Received Income') 
                        : (language === 'bn' ? 'কর্তন / ডিডাকশন' : 'Deducted Statement')
                      }
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Content container */}
              <div className="p-5 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950/40 space-y-4">
                {/* Hero Amount centerpiece */}
                <div className={`border rounded-2xl p-5 text-center relative overflow-hidden ${
                  selectedTransaction.type === 'INCOME' 
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20' 
                    : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20'
                }`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">
                    {t.TOTAL_AMOUNT || "Total Amount"}
                  </p>
                  <h2 className={`text-3xl font-extrabold font-mono tracking-tight ${
                    selectedTransaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {selectedTransaction.type === 'INCOME' ? '+' : '-'} {currency.code} {selectedTransaction.amount.toLocaleString()}
                  </h2>
                  
                  {/* Status Badge */}
                  <div className="flex justify-center mt-2 relative z-10">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                      selectedTransaction.type === 'INCOME' 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                      {selectedTransaction.type === 'INCOME' ? (
                        <>
                          <Check size={10} className="stroke-[3]" />
                          {t.RECEIVED || "RECEIVED"}
                        </>
                      ) : (
                        <>
                          <TrendingDown size={10} />
                          {t.DEDUCTED || "DEDUCTED"}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="bg-card-bg border border-[var(--dynamic-card-border)] rounded-2xl p-4 space-y-3.5 shadow-sm" style={{ boxShadow: 'var(--dynamic-card-shadow)' }}>
                  {/* Category */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t.CATEGORY || "Category"}
                    </span>
                    {(() => {
                      const tag = (() => {
                        const lower = (selectedTransaction.category || '').toLowerCase();
                        if (lower.includes('salary')) {
                          return {
                            name: language === 'bn' ? 'স্যালারি (Salary)' : 'Salary',
                            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                          };
                        }
                        if (lower.includes('commission')) {
                          return {
                            name: language === 'bn' ? 'কমিশন (Commission)' : 'Commission',
                            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/15'
                          };
                        }
                        if (lower.includes('bonus')) {
                          return {
                            name: language === 'bn' ? 'বোনাস (Bonus)' : 'Bonus',
                            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15'
                          };
                        }
                        return {
                          name: selectedTransaction.category || (language === 'bn' ? 'অন্যান্য (Others)' : 'Others'),
                          color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/15'
                        };
                      })();
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${tag.color}`}>
                          {tag.name}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  {/* Period/Month if Salary */}
                  {selectedTransaction.month && (
                    <>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {t.EARNED_MONTH_PERIOD || "Earned Month / Period"}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {(() => {
                            const monthNamesBn = [
                              'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                              'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
                            ];
                            const monthNamesEn = [
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            const mIndex = Number(selectedTransaction.month) - 1;
                            const monthStr = language === 'bn' ? monthNamesBn[mIndex] : monthNamesEn[mIndex];
                            const yearStr = language === 'bn' 
                              ? String(selectedTransaction.year).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)])
                              : selectedTransaction.year;
                            return `${monthStr} ${yearStr}`;
                          })()}
                        </span>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                    </>
                  )}

                  {/* Transaction ID */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t.TRANSACTION_ID || "Transaction ID"}
                    </span>
                    <span className="text-xs font-extrabold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                      {selectedTransaction.transactionId || `TXN-${selectedTransaction.id || Date.now()}`}
                    </span>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  {/* Date & Time */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t.DATE_TIME || "Date & Time"}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {new Date(selectedTransaction.date).toLocaleDateString(
                        language === 'bn' ? 'bn-BD' : 'en-GB', 
                        { day: '2-digit', month: 'short', year: 'numeric' }
                      )} • {selectedTransaction.time || 'N/A'}
                    </span>
                  </div>

                  {/* Remarks */}
                  {selectedTransaction.category && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {language === 'bn' ? 'রিমার্কস (Remarks)' : 'Remarks'}
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 text-right break-words max-w-[180px]">
                          {(() => {
                            const cat = selectedTransaction.category || 'Salary';
                            const monthNamesEn = [
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            const mIndex = selectedTransaction.month ? Number(selectedTransaction.month) - 1 : 6;
                            const monthName = monthNamesEn[mIndex] || 'July';
                            const yearVal = selectedTransaction.year || 2026;
                            return `${cat} for ${monthName} ${yearVal}`;
                          })()}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  {selectedTransaction.details?.serviceName && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {t.DESCRIPTION || "Description"}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 text-right break-words max-w-[180px]">
                          {selectedTransaction.details.serviceName}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className={`w-full py-4 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg active:scale-[0.98] transition-all ${
                    selectedTransaction.type === 'INCOME' 
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                  }`}
                >
                  {t.CLOSE_DETAILS || "Close"}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
      </div>
    );
  }

  if (activeSection === 'ADD_INCOME') {
    if (((incomeCategory || "").toLowerCase()) === 'advance') {
      return createPortal(
        <AnimatePresence>
          <div id="advance_dialog_portal" className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <style>{`
              #advance_amount_input, 
              #payment_advance_amount_input, 
              #advance_reason_select, 
              #payment_advance_reason_select {
                background-color: transparent !important;
                background: transparent !important;
              }
            `}</style>
            {/* Backdrop */}
            <motion.div 
              id="advance_backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setActiveSection(null);
                setIncomeCategory('Salary');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            {/* Centered Dialog Modal */}
            <motion.div 
              id="advance_modal_box"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`relative w-full max-w-md rounded-[32px] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.35)] border z-10 overflow-hidden font-sans allow-animation transition-colors duration-300 ${
                isDarkMode 
                  ? 'bg-theme-card text-white border-white/10 shadow-black/40' 
                  : 'bg-white text-black border-black/10'
              }`}
            >
              {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-[#1e1b4b] to-slate-900 text-white px-6 py-5 rounded-t-[32px] -mx-7 -mt-7 mb-6 flex items-center justify-between border-b border-white/5 shadow-lg">
              <div>
                <h3 className="text-md font-bold tracking-tight text-white">
                  {t.COMPANY_ADVANCE || 'Company Advance'}
                </h3>
                <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest mt-0.5">
                  {t.ADVANCE_RECORD_ENTRY || 'Advance Record Entry'}
                </p>
              </div>
              <button 
                id="close_advance_btn"
                onClick={() => {
                  setActiveSection(null);
                  setIncomeCategory('Salary');
                }}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 transition-all text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step 1: Mode Segmented Control */}
            <div className="mb-6 space-y-2">
              <span className={`text-[10px] font-black uppercase tracking-wide block ${isDarkMode ? 'text-white/50' : 'text-neutral-500'}`}>{t.ADVANCE_TYPE || 'Advance Type'}</span>
              <div className={`relative h-12 p-1 rounded-xl border flex items-stretch select-none ${
                isDarkMode ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5'
              }`}>
                {/* Sliding Background Indicator matching track height nicely */}
                <div
                  className="absolute top-1 bottom-1 rounded-lg shadow-sm"
                  style={{
                    width: 'calc(50% - 4px)',
                    left: advanceType === 'TAKEN' ? '4px' : 'calc(50%)',
                    background: advanceType === 'TAKEN' ? '#10b981' : '#f43f5e',
                  }}
                  
                  
                />
                <button
                  id="tab_advance_taken"
                  type="button"
                  onClick={() => setAdvanceType('TAKEN')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors duration-200 relative z-10 ${
                    advanceType === 'TAKEN' ? 'text-white' : (isDarkMode ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-black')
                  }`}
                >
                  {t.TAKE_ADVANCE || 'Take Advance'}
                </button>
                <button
                  id="tab_advance_returned"
                  type="button"
                  onClick={() => setAdvanceType('RETURNED')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors duration-200 relative z-10 ${
                    advanceType === 'RETURNED' ? 'text-white' : (isDarkMode ? 'text-white/60 hover:text-white' : 'text-neutral-500 hover:text-black')
                  }`}
                >
                  {t.RETURN_ADVANCE || 'Return Advance'}
                </button>
              </div>

              {/* Slide transition description */}
              <div className="overflow-hidden min-h-[28px]">
                <>
                  <p
                    key={advanceType}
                    
                    
                    
                    
                    className={`text-[10px] italic mt-1 leading-normal ${isDarkMode ? 'text-white/40' : 'text-neutral-400'}`}
                  >
                    {advanceType === 'TAKEN' 
                      ? (t.ADVANCE_TAKEN_NOTE || 'Taking advance will be deducted from your Total Income.') 
                      : (t.ADVANCE_RETURNED_NOTE || 'Returning advance will be added back to your Total Income.')}
                  </p>
                </>
              </div>
            </div>

            {/* Inputs Container */}
            <div id="advance_form_fields" className="space-y-5">
              {/* Amount field (Perfect Left-aligned Floating Label Premium Style) */}
              <div className={`relative h-14 rounded-2xl border transition-all ${
                isDarkMode 
                  ? 'bg-transparent border-white/10 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30' 
                  : 'bg-transparent border-black/10 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30'
              }`}>
                <input
                  id="advance_amount_input"
                  type="number"
                  pattern="[0-9]*"
                  inputMode="decimal"
                  placeholder=" "
                  value={advanceAmount}
                  onFocus={() => setIsAmountFocused(true)}
                  onBlur={() => setIsAmountFocused(false)}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className={`w-full h-full pt-5 pb-1 px-4 text-left text-sm font-bold bg-transparent border-0 outline-none focus:ring-0 ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}
                />
                <label
                  htmlFor="advance_amount_input"
                  className={`absolute transition-all duration-200 pointer-events-none origin-[0] uppercase tracking-wider whitespace-nowrap .5 ${
                    isAmountFocused || advanceAmount
                      ? `top-0 -translate-y-1/2 left-4 text-[10px] font-bold ${isDarkMode ? 'bg-theme-card text-emerald-400' : 'bg-white text-emerald-600'}`
                      : `top-1/2 -translate-y-1/2 left-4 text-xs font-bold ${isDarkMode ? 'text-white/30' : 'text-neutral-400'}`
                  }`}
                >
                  {t.AMOUNT_TAKA || 'Amount'}
                </label>
              </div>

              {/* Reason / Purpose field (Clean Premium Select Dropdown) */}
              <div className={`relative h-14 border rounded-2xl transition-all flex items-center ${
                isDarkMode 
                  ? 'bg-transparent border-white/10 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30' 
                  : 'bg-transparent border-black/10 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500/30'
              }`}>
                <select
                  id="advance_reason_select"
                  value={advanceReason}
                  onChange={(e) => setAdvanceReason(e.target.value)}
                  className={`w-full h-full px-4 text-sm font-semibold bg-transparent border-0 outline-none focus:ring-0 appearance-none cursor-pointer ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}
                >
                  <option value="" className={isDarkMode ? 'bg-theme-card text-white/40' : 'bg-card-bg text-neutral-500'}>
                    {t.SELECT_PURPOSE || 'Select Purpose'}
                  </option>
                  {advanceReasons && advanceReasons.map((reason, idx) => (
                    <option key={idx} value={reason} className={isDarkMode ? 'bg-theme-card text-white' : 'bg-card-bg text-black'}>
                      {reason}
                    </option>
                  ))}
                </select>
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDarkMode ? 'text-white/40' : 'text-black/40'}`}>
                  <ChevronDown size={14} />
                </div>
              </div>

              {/* Method selection (Color-Coded By Button Names) */}
              <div id="advance_method_selector" className="space-y-1.5">
                <span className={`text-[10px] font-black uppercase tracking-wide block ${isDarkMode ? 'text-white/50' : 'text-neutral-500'}`}>{t.METHOD_LABEL || 'Method'}</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { 
                      id: 'CASH', 
                      label: t.CASH || 'Cash',
                      activeClass: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 border-transparent',
                      inactiveClass: isDarkMode 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                        : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-600 hover:bg-emerald-500/10'
                    },
                    { 
                      id: 'ONLINE_BANK', 
                      label: t.BANK || 'Bank',
                      activeClass: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/25 border-transparent',
                      inactiveClass: isDarkMode 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' 
                        : 'bg-blue-500/5 border-blue-500/15 text-blue-600 hover:bg-blue-500/10'
                    },
                    { 
                      id: 'MOBILE_BANKING', 
                      label: t.MOBILE_BANKING || 'Mobile',
                      activeClass: 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/25 border-transparent',
                      inactiveClass: isDarkMode 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                        : 'bg-rose-500/5 border-rose-500/15 text-rose-600 hover:bg-rose-500/10'
                    }
                  ].map(m => (
                    <button
                      id={`method_${m.id}`}
                      key={m.id}
                      type="button"
                      onClick={() => setAdvanceMethod(m.id as any)}
                      className={`h-11 rounded-xl text-2xs font-extrabold uppercase transition-all border ${
                        advanceMethod === m.id ? m.activeClass : m.inactiveClass
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date displaying helper */}
              <div className="flex justify-between text-[10px] text-text-muted pt-1 border-t border-black/5 dark:border-white/5">
                <span>{t.MONTH_LBL || 'Month'}: <span className="font-bold text-text-main">{months[selectedMonth - 1]}</span></span>
                <span>{t.YEAR_LBL || 'Year'}: <span className="font-bold text-text-main">{selectedYear}</span></span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  id="cancel_advance_form_btn"
                  type="button"
                  onClick={() => {
                    setActiveSection(null);
                    setIncomeCategory('Salary');
                  }}
                  className={`h-11 rounded-xl text-xs font-extrabold uppercase transition-all ${
                    isDarkMode 
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white' 
                      : 'bg-neutral-100 hover:bg-neutral-200 text-black'
                  }`}
                >
                  {t.CANCEL || 'Cancel'}
                </button>
                <button
                  id="submit_advance_btn"
                  type="button"
                  onClick={handleSubmitAdvance}
                  className="h-11 rounded-xl text-xs font-black uppercase text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: advanceType === 'TAKEN' ? '#10b981' : '#f43f5e' }}
                >
                  {t.CONFIRM_LBL || 'Confirm'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>,
        document.body
      );
    }

    return createPortal(
      <AnimatePresence>
        <div id="add_income_dialog_portal" className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            id="add_income_backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              setActiveSection(null);
              setIncomeAmount('');
              setIncomeDesc('');
            }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          {/* Centered Dialog Modal */}
          <motion.div 
            id="add_income_modal_box"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`relative w-full max-w-md rounded-[32px] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.35)] border z-10 overflow-hidden font-sans transition-colors duration-300 ${
              isDarkMode 
                ? 'bg-theme-card text-white border-white/10 shadow-black/40' 
                : 'bg-white text-black border-black/10'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-[#1e1b4b] to-slate-900 text-white px-6 py-5 rounded-t-[32px] -mx-7 -mt-7 mb-6 flex items-center justify-between border-b border-white/5 shadow-lg">
              <div>
                <h3 className="text-md font-bold tracking-tight text-white">
                  {language === 'bn' ? `${incomeCategory} যোগ করুন` : `Add ${incomeCategory}`}
                </h3>
                <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest mt-0.5">
                  {language === 'bn' ? 'মাসিক আয় এন্ট্রি' : 'Monthly Income Entry'}
                </p>
              </div>
              <button 
                id="close_add_income_btn"
                onClick={() => {
                  setActiveSection(null);
                  setIncomeAmount('');
                  setIncomeDesc('');
                }}
                className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 transition-all text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                    {language === 'bn' ? 'বছর' : 'Year'}
                  </p>
                  <div 
                    onClick={() => setShowYearSelect(true)}
                    className="w-full h-12 px-4 rounded-xl border border-black/10 dark:border-white/10 text-text-main cursor-pointer flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 shadow-sm"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <span className="text-sm font-bold">{selectedYear}</span>
                    <ChevronDown size={16} className="text-text-muted opacity-50" />
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">
                    {language === 'bn' ? 'মাস' : 'Month'}
                  </p>
                  <div 
                    onClick={() => setShowMonthSelect(true)}
                    className="w-full h-12 px-4 rounded-xl border border-black/10 dark:border-white/10 text-text-main cursor-pointer flex items-center justify-between transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 shadow-sm"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <span className="text-sm font-bold">
                      {selectedMonth === 'ALL' ? 'ALL' : months[selectedMonth - 1]?.substring(0, 3)}
                    </span>
                    <ChevronDown size={16} className="text-text-muted opacity-50" />
                  </div>
                </div>
              </div>

              <InputField 
                label={`${incomeCategory} ${language === 'bn' ? 'পরিমাণ' : 'Amount'}`}
                name="incomeAmount"
                type="tel"
                inputMode="decimal"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                icon={<DollarSign size={18} />}
              />
              
              <InputField 
                label={language === 'bn' ? 'বিবরণ (ঐচ্ছিক)' : 'Description (Optional)'}
                name="incomeDesc"
                value={incomeDesc}
                onChange={(e) => setIncomeDesc(e.target.value)}
                icon={<FileText size={18} />}
              />

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  id="cancel_add_income_form_btn"
                  type="button"
                  onClick={() => {
                    setActiveSection(null);
                    setIncomeAmount('');
                    setIncomeDesc('');
                  }}
                  className={`h-11 rounded-xl text-xs font-extrabold uppercase transition-all ${
                    isDarkMode 
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white' 
                      : 'bg-neutral-100 hover:bg-neutral-200 text-black'
                  }`}
                >
                  {t.CANCEL || 'Cancel'}
                </button>
                <button 
                  id="submit_add_income_form_btn"
                  type="button"
                  onClick={handleSubmitIncome} 
                  className="h-11 rounded-xl text-xs font-black uppercase text-white transition-all shadow-lg hover:opacity-90 active:scale-95 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: 'var(--primary, #2B7A78)' }}
                >
                  {language === 'bn' ? 'নিশ্চিত করুন' : 'Confirm'}
                </button>
              </div>
            </div>
          </motion.div>

          <GlobalFullscreenSelect
            isOpen={showYearSelect}
            onClose={() => setShowYearSelect(false)}
            onSelect={(value) => {
              setSelectedYear(Number(value));
              setShowYearSelect(false);
            }}
            options={years.map(String)}
            title={language === 'bn' ? 'বছর সিলেক্ট করুন' : 'Select Year'}
          />
          <GlobalFullscreenSelect
            isOpen={showMonthSelect}
            onClose={() => setShowMonthSelect(false)}
            onSelect={(value) => {
              setSelectedMonth(months.indexOf(value) + 1);
              setShowMonthSelect(false);
            }}
            options={months}
            title={language === 'bn' ? 'মাস সিলেক্ট করুন' : 'Select Month'}
          />
        </div>
      </AnimatePresence>,
      document.body
    );
  }

  if (activeSection === 'INCOME') {
    return (
      <div 
        className="flex-1 flex flex-col min-h-0 w-full"
      >
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto pt-global px-global pb-[calc(160px+env(safe-area-inset-bottom))] space-y-4">
          {/* Net Balance Summary Card with Watermark */}
          <div className="relative overflow-hidden rounded-[10px] p-6 text-white bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 border border-white/10" style={{ boxShadow: 'var(--dynamic-card-shadow)' }}>
            {/* Watermark: Wallet icon */}
            <div className="absolute right-[-24px] bottom-[-24px] opacity-15 pointer-events-none scale-110">
              <Wallet size={140} strokeWidth={1} className="text-white" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-85 mb-2">
                {language === 'bn' ? 'নেট ব্যালেন্স' : 'Net Balance'}
              </span>
              <h2 className="text-3xl font-black tracking-tight mb-3">
                {currency.code} {(totals.income.Total - totals.deduction.Total).toLocaleString()}
              </h2>
              <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 border border-white/10 w-fit backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]"></span>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {language === 'bn' ? 'সক্রিয় হিসাব' : 'Active Account'}
                </span>
              </div>
            </div>
          </div>

          {/* Month & Year Filters */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            {/* Month Selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full px-4 py-3 rounded-[10px] text-xs bg-card-bg border border-black/10 dark:border-white/10 text-text-main focus:outline-none appearance-none cursor-pointer pr-10 font-bold shadow-sm"
              >
                <option value="ALL">{language === 'bn' ? 'সকল মাস' : 'All Months'}</option>
                {[
                  { value: 1, label: language === 'bn' ? 'জানুয়ারি' : 'January' },
                  { value: 2, label: language === 'bn' ? 'ফেব্রুয়ারি' : 'February' },
                  { value: 3, label: language === 'bn' ? 'মার্চ' : 'March' },
                  { value: 4, label: language === 'bn' ? 'এপ্রিল' : 'April' },
                  { value: 5, label: language === 'bn' ? 'মে' : 'May' },
                  { value: 6, label: language === 'bn' ? 'জুন' : 'June' },
                  { value: 7, label: language === 'bn' ? 'জুলাই' : 'July' },
                  { value: 8, label: language === 'bn' ? 'আগস্ট' : 'August' },
                  { value: 9, label: language === 'bn' ? 'সেপ্টেম্বর' : 'September' },
                  { value: 10, label: language === 'bn' ? 'অক্টোবর' : 'October' },
                  { value: 11, label: language === 'bn' ? 'নভেম্বর' : 'November' },
                  { value: 12, label: language === 'bn' ? 'ডিসেম্বর' : 'December' }
                ].map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="w-full px-4 py-3 rounded-[10px] text-xs bg-card-bg border border-black/10 dark:border-white/10 text-text-main focus:outline-none appearance-none cursor-pointer pr-10 font-bold shadow-sm"
              >
                <option value="ALL">{language === 'bn' ? 'সকল বছর' : 'All Years'}</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          {/* Income Section */}
          <div 
            className="bg-card-bg rounded-[10px] overflow-hidden border-[var(--dynamic-card-border)]"
            style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
          >
            <div className="bg-emerald-500/10 px-4 py-3 border-b border-emerald-500/20">
              <h4 className="text-[10px] font-black text-text-main opacity-90 uppercase tracking-widest">Income Breakdown</h4>
            </div>
            <div 
              className="p-4 flex flex-col"
            >
              {[
                { label: 'Salary', value: totals.income.Salary, icon: Wallet, color: '#10b981' },
                { label: 'Commission', value: totals.income.Commission, icon: TrendingUp, color: '#10b981' },
                { label: 'Friday', value: totals.income.Friday, icon: Calendar, color: '#6366f1' },
                { label: 'Bonus', value: totals.income.Bonus, icon: Plus, color: '#f59e0b' },
                { label: 'Advance', value: totals.income.Advance, icon: DollarSign, color: '#f97316' }
              ].map((item, index, arr) => (
                <React.Fragment key={item.label}>
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 py-3 px-2 -mx-2 rounded-2xl transition-colors"
                    onClick={() => handleCategoryClick(item.label)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `${item.color}1a`, color: item.color }}>
                        <item.icon size={20} />
                      </div>
                      <span className="text-xs font-black text-text-main opacity-90 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-text-main">{currency.code} {(Number(item.value) || 0).toLocaleString()}</span>
                      <ChevronRight size={16} className="text-text-main opacity-50" />
                    </div>
                  </div>
                  {index !== arr.length - 1 && (
                    <div className="h-[1px] bg-black/10 dark:bg-white/40 mx-2 my-1" />
                  )}
                </React.Fragment>
              ))}
              <div className="pt-4 mt-2 border-t border-black/10 dark:border-white/40 flex justify-between items-center">
                <span className="text-xs font-black text-text-main opacity-90 uppercase tracking-widest">TOTAL INCOME</span>
                <span className="text-lg font-black text-text-main">{currency.code} {(Number(totals.income.Total) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Deduction Section */}
          <div 
            className="bg-card-bg rounded-[10px] overflow-hidden border-[var(--dynamic-card-border)]"
            style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
          >
            <div className="bg-rose-500/10 px-4 py-3 border-b border-rose-500/20">
              <h4 className="text-[10px] font-black text-text-main opacity-90 uppercase tracking-widest">Deduction Breakdown</h4>
            </div>
            <div 
              className="p-4 flex flex-col"
            >
              {[
                { label: 'Kitchen service charge', value: totals.deduction['Kitchen Service'], icon: Receipt, color: '#f43f5e' },
                { label: 'Penalty', value: totals.deduction.Penalty, icon: AlertCircle, color: '#ef4444' },
                { label: 'Traffic Fine', value: totals.deduction['Traffic Fine'], icon: AlertCircle, color: '#f97316' },
                { label: 'Mobile bills', value: totals.deduction['Mobile Bills'], icon: FileText, color: '#a855f7' }
              ].map((item, index, arr) => (
                <React.Fragment key={item.label}>
                  <div 
                    className="flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 py-3 px-2 -mx-2 rounded-2xl transition-colors"
                    onClick={() => handleCategoryClick(item.label)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center`} style={{ backgroundColor: `${item.color}1a`, color: item.color }}>
                        <item.icon size={20} />
                      </div>
                      <span className="text-xs font-black text-text-main opacity-90 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-text-main">{currency.code} {(Number(item.value) || 0).toLocaleString()}</span>
                      <ChevronRight size={16} className="text-text-main opacity-50" />
                    </div>
                  </div>
                  {index !== arr.length - 1 && (
                    <div className="h-[1px] bg-black/10 dark:bg-white/40 mx-2 my-1" />
                  )}
                </React.Fragment>
              ))}
              <div className="pt-4 mt-2 border-t border-black/10 dark:border-white/40 flex justify-between items-center">
                <span className="text-xs font-black text-text-main opacity-90 uppercase tracking-widest">TOTAL DEDUCTIONS</span>
                <span className="text-lg font-black text-text-main">{currency.code} {(Number(totals.deduction.Total) || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeSection === 'DEDUCTION') {
    return (
      <div 
        className="min-h-screen pb-[120px]"
      >
        <div className="pb-6 w-full mx-auto space-y-4 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Kitchen Service', value: totals.deduction['Kitchen Service'], icon: Receipt, color: 'rose' },
              { label: 'Penalty', value: totals.deduction.Penalty, icon: AlertCircle, color: 'orange' },
              { label: 'Traffic Fine', value: totals.deduction['Traffic Fine'], icon: FileText, color: 'red' },
              { label: 'Mobile Bills', value: totals.deduction['Mobile Bills'], icon: MoreVertical, color: 'pink' }
            ].map((item, index) => (
              <div 
                key={item.label} 
                onClick={() => alert(`Showing monthly breakdown for ${item.label}`)}
                className="bg-card-bg border-[var(--dynamic-card-border)] rounded-2xl p-5 flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-500`}>
                    <item.icon size={20} />
                  </div>
                  <span className="text-xs font-black text-text-muted uppercase tracking-widest">{item.label}</span>
                </div>
                <span className="text-base font-black text-text-main">{currency.code} {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom)+16px)] left-4 right-4 z-20">
            <div className="bg-rose-500 rounded-2xl p-6 text-white flex justify-between items-center shadow-xl shadow-rose-500/20">
              <span className="text-xs font-black uppercase tracking-widest opacity-90">Total Deductions</span>
              <span className="text-2xl font-black tracking-tighter">{currency.code} {totals.deduction.Total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // New Pending Breakdown Page
  if (showPendingPage || (typeof activeSection === 'string' && activeSection.startsWith('PENDING_CATEGORY_'))) {
    return (
      <PendingBreakdownPage 
        data={totals.pendingIncome}
        total={totals.income.Pending}
        onClose={() => goBack()}
        currency={currency}
        isDark={isDarkMode}
        wallpaper={wallpaper}
        backgroundColor={backgroundColor}
        isNightMode={isNightMode}
        appThemeMode={appThemeMode}
        trips={trips}
        monthlyFiles={monthlyFiles}
        payments={payments}
      />
    );
  }

  return (
    <div 
      className="flex flex-col h-[calc(100dvh-140px)] md:h-[calc(100dvh-100px)] w-full mx-auto"
    >
      {/* Header with Filters & Unified Balance Display */}
      <div className="z-20 pb-4  shrink-0">
        <div className="mx-0 relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-4">
            <div className="">
              <div 
                className="relative overflow-hidden rounded-2xl p-5 min-h-[190px] md:min-h-[220px] flex flex-col justify-between text-white shadow-[var(--dynamic-card-shadow)] bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] border border-white/10"
              >
                {/* Visual accents */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/10 rounded-full blur-[80px]"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-[80px]"></div>
                
                <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowMonthSelect(true)}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        {selectedMonth === 'ALL' ? (language === 'bn' ? 'সব মাস' : 'All Month') : months[selectedMonth - 1]}
                        <ChevronDown size={10} className="text-white/70" />
                      </button>
                      <button 
                        onClick={() => setShowYearSelect(true)}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer"
                      >
                        {selectedYear === 'ALL' ? (language === 'bn' ? 'সব বছর' : 'All Years') : selectedYear}
                        <ChevronDown size={10} className="text-white/70" />
                      </button>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm shadow-inner">
                      <Wallet size={20} className="text-cyan-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setActiveSection('INCOME')}
                      className="group relative overflow-hidden flex flex-col items-start justify-between min-h-[96px] md:min-h-[112px] p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/20 text-left"
                      style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                    >
                      {/* Watermark Icon */}
                      <div className="absolute right-[-16px] bottom-[-16px] opacity-15 pointer-events-none scale-100">
                        <Wallet size={80} strokeWidth={1.5} className="text-white" />
                      </div>

                      <div className="relative z-10 w-full h-full flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-emerald-100 whitespace-nowrap">Net Balance</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] font-black text-emerald-100/70">{currency.code}</span>
                          <span className="text-xl font-black tracking-tighter text-white drop-shadow-sm">{(totals.income.Total - totals.deduction.Total).toLocaleString()}</span>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setActiveSection('DEDUCTION')}
                      className="group relative overflow-hidden flex flex-col items-start justify-between min-h-[96px] md:min-h-[112px] p-4 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border border-rose-400/20 text-left hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                      style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                    >
                      {/* Watermark Icon */}
                      <div className="absolute right-[-16px] bottom-[-16px] opacity-15 pointer-events-none scale-100">
                        <Receipt size={80} strokeWidth={1.5} className="text-white" />
                      </div>

                      <div className="relative z-10 w-full h-full flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                          <span className="text-[8px] font-black uppercase tracking-wider text-rose-100 whitespace-nowrap">{language === 'bn' ? 'ডিডাকশন' : 'Deduction'}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] font-black text-rose-100/70">{currency.code}</span>
                          <span className="text-xl font-black tracking-tighter text-white drop-shadow-sm">{totals.deduction.Total.toLocaleString()}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
      </div>

      {/* List of Payments */}
      <div className="flex-1 overflow-y-auto scrollbar-hide pb-[80px] " id="myincome-scroll-container">
      <div className="w-full mx-auto space-y-4">
        {/* Transaction History Section Title */}
        <div className="flex items-center justify-between  mb-2 pt-2 border-t border-black/[0.03] dark:border-white/[0.03]">
          <h3 className="text-xs font-black text-text-main uppercase tracking-widest">
            {t.TRANSACTION_HISTORY || "Transaction History"}
          </h3>
          <span className="text-[9px] font-black uppercase tracking-wider text-text-muted bg-black/5 dark:bg-white/10 py-0.5 px-2 rounded-full">
            {filteredPayments.length} {t.TRANSACTIONS || "Transactions"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPayments.map((payment) => (
            <SwipeTransactionCard
              key={payment.id}
              payment={payment}
              onClick={() => setSelectedTransaction(payment)}
              currency={currency}
              isIncome={payment.type === 'INCOME'}
              onDelete={(id: string) => {
                                 confirmAction(t.TRANSACTION_DELETE_DESC || 'Are you sure you want to delete this transaction?', () => {
                  removePayment(id);
                  showFeedback(t.TRANSACTION_DELETED_SUCCESS || 'Transaction deleted successfully');
                 });
              }}
              itemVariants={itemVariants}
              language={language}
              trips={trips}
              monthlyFiles={monthlyFiles}
              payments={payments}
            />
          ))}
        </div>
      </div>
      <GlobalFullscreenSelect
        isOpen={showYearSelect}
        onClose={() => setShowYearSelect(false)}
        onSelect={(val) => {
          setSelectedYear(val === 'ALL' ? 'ALL' : parseInt(val));
          setShowYearSelect(false);
        }}
        options={[
          { label: language === 'bn' ? 'সব বছর' : 'All Years', value: 'ALL' },
          ...years.map(y => ({ label: String(y), value: String(y) }))
        ]}
        title={t.SELECT_YEAR || "Select Year"}
        selectedValue={String(selectedYear)}
        searchable={false}
      />
      <GlobalFullscreenSelect
        isOpen={showMonthSelect}
        onClose={() => setShowMonthSelect(false)}
        onSelect={(val) => {
          setSelectedMonth(val === 'ALL' ? 'ALL' : parseInt(val));
          setShowMonthSelect(false);
        }}
        options={[
          { label: language === 'bn' ? 'সব মাস' : 'All Month', value: 'ALL' },
          ...months.map((m, i) => ({
            label: m,
            value: String(i + 1)
          }))
        ]}
        title={t.SELECT_MONTH || "Select Month"}
        selectedValue={String(selectedMonth)}
        searchable={false}
      />
      
      {/* Transaction Details Dialog */}
      {selectedTransaction && createPortal(
        <>
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
              onClick={() => setSelectedTransaction(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <div 
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/10 z-10 flex flex-col h-[520px]"
            >
              {/* Premium Header Banner */}
              <div className={`bg-gradient-to-r text-white p-5 flex items-center justify-between ${
                selectedTransaction.type === 'INCOME' ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                    {selectedTransaction.type === 'INCOME' ? (
                      <TrendingUp size={20} className="stroke-[2.5]" />
                    ) : (
                      <TrendingDown size={20} className="stroke-[2.5]" />
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/80 block">
                      {language === 'bn' ? 'লেনদেনের বিবরণ' : 'Transaction Details'}
                    </span>
                    <h3 className="text-base font-extrabold text-white truncate mt-0.5">
                      {selectedTransaction.type === 'INCOME' 
                        ? (language === 'bn' ? 'রিসিভড ইনকাম' : 'Received Income') 
                        : (language === 'bn' ? 'কর্তন / ডিডাকশন' : 'Deducted Statement')
                      }
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white active:scale-90"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Content container */}
              <div className="p-5 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950/40 space-y-4">
                {/* Hero Amount centerpiece */}
                <div className={`border rounded-2xl p-5 text-center relative overflow-hidden ${
                  selectedTransaction.type === 'INCOME' 
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/20' 
                    : 'bg-rose-500/10 dark:bg-rose-500/20 border-rose-500/20'
                }`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">
                    {t.TOTAL_AMOUNT || "Total Amount"}
                  </p>
                  <h2 className={`text-3xl font-extrabold font-mono tracking-tight ${
                    selectedTransaction.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {selectedTransaction.type === 'INCOME' ? '+' : '-'} {currency.code} {selectedTransaction.amount.toLocaleString()}
                  </h2>
                  
                  {/* Status Badge */}
                  <div className="flex justify-center mt-2 relative z-10">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${
                      selectedTransaction.type === 'INCOME' 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                      {selectedTransaction.type === 'INCOME' ? (
                        <>
                          <Check size={10} className="stroke-[3]" />
                          {t.RECEIVED || "RECEIVED"}
                        </>
                      ) : (
                        <>
                          <TrendingDown size={10} />
                          {t.DEDUCTED || "DEDUCTED"}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="bg-card-bg border border-[var(--dynamic-card-border)] rounded-2xl p-4 space-y-3.5 shadow-sm" style={{ boxShadow: 'var(--dynamic-card-shadow)' }}>
                  {/* Category */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t.CATEGORY || "Category"}
                    </span>
                    {(() => {
                      const tag = (() => {
                        const lower = (selectedTransaction.category || '').toLowerCase();
                        if (lower.includes('salary')) {
                          return {
                            name: language === 'bn' ? 'স্যালারি (Salary)' : 'Salary',
                            color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15'
                          };
                        }
                        if (lower.includes('commission')) {
                          return {
                            name: language === 'bn' ? 'কমিশন (Commission)' : 'Commission',
                            color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/15'
                          };
                        }
                        if (lower.includes('bonus')) {
                          return {
                            name: language === 'bn' ? 'বোনাস (Bonus)' : 'Bonus',
                            color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/15'
                          };
                        }
                        return {
                          name: selectedTransaction.category || (language === 'bn' ? 'অন্যান্য (Others)' : 'Others'),
                          color: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/15'
                        };
                      })();
                      return (
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${tag.color}`}>
                          {tag.name}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  {/* Period/Month if Salary */}
                  {selectedTransaction.month && (
                    <>
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {t.EARNED_MONTH_PERIOD || "Earned Month / Period"}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {(() => {
                            const monthNamesBn = [
                              'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                              'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
                            ];
                            const monthNamesEn = [
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            const mIndex = Number(selectedTransaction.month) - 1;
                            const monthStr = language === 'bn' ? monthNamesBn[mIndex] : monthNamesEn[mIndex];
                            const yearStr = language === 'bn' 
                              ? String(selectedTransaction.year).replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)])
                              : selectedTransaction.year;
                            return `${monthStr} ${yearStr}`;
                          })()}
                        </span>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                    </>
                  )}

                  {/* Transaction ID */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t.TRANSACTION_ID || "Transaction ID"}
                    </span>
                    <span className="text-xs font-extrabold tracking-wider font-mono text-slate-700 dark:text-slate-300">
                      {selectedTransaction.transactionId || `TXN-${selectedTransaction.id || Date.now()}`}
                    </span>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800" />

                  {/* Date & Time */}
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {t.DATE_TIME || "Date & Time"}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {new Date(selectedTransaction.date).toLocaleDateString(
                        language === 'bn' ? 'bn-BD' : 'en-GB', 
                        { day: '2-digit', month: 'short', year: 'numeric' }
                      )} • {selectedTransaction.time || 'N/A'}
                    </span>
                  </div>

                  {/* Remarks */}
                  {selectedTransaction.category && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {language === 'bn' ? 'রিমার্কস (Remarks)' : 'Remarks'}
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 text-right break-words max-w-[180px]">
                          {(() => {
                            const cat = selectedTransaction.category || 'Salary';
                            const monthNamesEn = [
                              'January', 'February', 'March', 'April', 'May', 'June',
                              'July', 'August', 'September', 'October', 'November', 'December'
                            ];
                            const mIndex = selectedTransaction.month ? Number(selectedTransaction.month) - 1 : 6;
                            const monthName = monthNamesEn[mIndex] || 'July';
                            const yearVal = selectedTransaction.year || 2026;
                            return `${cat} for ${monthName} ${yearVal}`;
                          })()}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  {selectedTransaction.details?.serviceName && (
                    <>
                      <div className="h-px bg-slate-100 dark:bg-slate-800" />
                      <div className="flex justify-between items-start py-0.5">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {t.DESCRIPTION || "Description"}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 text-right break-words max-w-[180px]">
                          {selectedTransaction.details.serviceName}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedTransaction(null)}
                  className={`w-full py-4 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg active:scale-[0.98] transition-all ${
                    selectedTransaction.type === 'INCOME' 
                      ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' 
                      : 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20'
                  }`}
                >
                  {t.CLOSE_DETAILS || "Close"}
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
      </div>
      <GlobalFullscreenSelect 
        isOpen={showAdvanceReasonSelect}
        onClose={() => setShowAdvanceReasonSelect(false)}
        title={t.SELECT_PURPOSE || 'Select Purpose'}
        selectedValue={advanceReason}
        options={(advanceReasons || []).map(r => ({ label: r, value: r }))}
        onSelect={(val) => setAdvanceReason(val)}
      />

      {/* Net Income Breakdown Sheet */}
      {showNetIncomeBreakdown && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            
            
            
            onClick={() => setShowNetIncomeBreakdown(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          {/* Sheet */}
          <div 
            
            
            
            
            className="relative w-full max-w-md bg-theme-card rounded-t-3xl p-6 border-t border-[var(--dynamic-card-border)] pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto z-50"
            style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
          >
            {/* Top notch */}
            <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-5" />
            
            <h3 className="text-sm font-black uppercase tracking-widest text-text-main text-center mb-6">
              Net Income Breakdown
            </h3>

            {/* Progress visual comparison */}
            <div className="space-y-4 mb-6">
              <div className="h-4 w-full bg-rose-500/10 rounded-full overflow-hidden flex">
                {totals.income.Total > 0 && (
                  <div 
                    style={{ width: `${(totals.income.Total / (totals.income.Total + totals.deduction.Total || 1)) * 100}%` }}
                    className="h-full bg-emerald-500"
                  />
                )}
                {totals.deduction.Total > 0 && (
                  <div 
                    style={{ width: `${(totals.deduction.Total / (totals.income.Total + totals.deduction.Total || 1)) * 100}%` }}
                    className="h-full bg-rose-500"
                  />
                )}
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-text-muted">
                <span className="text-emerald-500">Gross Income: {totals.income.Total > 0 ? ((totals.income.Total / (totals.income.Total + totals.deduction.Total || 1)) * 100).toFixed(0) : 0}%</span>
                <span className="text-rose-500">Deductions: {totals.deduction.Total > 0 ? ((totals.deduction.Total / (totals.income.Total + totals.deduction.Total || 1)) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>

            {/* Breakdown Rows */}
            <div className="space-y-3.5 bg-black/[0.02] dark:bg-white/[0.02] p-5 rounded-2xl border border-black/5 dark:border-white/5 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Gross Income</span>
                </div>
                <span className="text-sm font-black text-emerald-500 font-mono">
                  + {currency.code} {totals.income.Total.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-dashed border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Deductions</span>
                </div>
                <span className="text-sm font-black text-rose-500 font-mono">
                  - {currency.code} {totals.deduction.Total.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-solid border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-black text-text-main uppercase tracking-widest">Net Income</span>
                </div>
                <span className="text-base font-black text-blue-500 font-mono">
                  {currency.code} {(totals.income.Total - totals.deduction.Total).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowNetIncomeBreakdown(false)}
              className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all"
            >
              Close Breakdown
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MyIncome;
