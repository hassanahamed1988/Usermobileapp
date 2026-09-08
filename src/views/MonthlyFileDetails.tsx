import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { createPortal } from 'react-dom';
import { useStore, GLOBAL_TRANSITION, GLOBAL_VARIANTS } from '../store';
import { THEMES, APP_MODULES, TRANSLATIONS } from '../constants';
import { useNavigation } from '../contexts/NavigationContext';
import { Trip, Currency, Payment, MonthlyFile } from '../types';
import { PaymentManager } from '../services/PaymentManager';
import { 
  FileText, 
  Eye, 
  ChevronLeft, 
  ArrowLeft,
  AlertCircle,
  Truck,
  MapPin,
  Calendar,
  Clock,
  X,
  Edit2,
  History,
  Banknote,
  Wallet,
  Check,
  Hash,
  Globe,
  Tag,
  Car,
  Info,
  Trash2,
  Fuel,
  Coins,
  Award,
  Zap,
  Power,
  Search,
  TrendingUp,
  DollarSign,
  Heart,
  Utensils,
  AlertTriangle,
  Smartphone,
  ChevronDown,
  Download,
  ChevronRight,
  ArrowDownLeft,
  Package,
  Bell,
  Moon,
  Sun,
} from 'lucide-react';
import { getContrastColor } from '../utils/colorUtils';
import { formatCategoryHeader } from '../utils/formatUtils';
import InputField from '../components/InputField';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

const SwipeToDeleteWrapper = ({ children, onDelete, itemVariants: customVariants }: any) => {
  const [showDelete, setShowDelete] = useState(false);
  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.x < -40) setShowDelete(true);
    else if (info.offset.x > 40) setShowDelete(false);
  };
  return (
    <div className="relative mb-3 rounded-2xl overflow-hidden bg-transparent border-none">
      <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-rose-500 z-0 rounded-2xl">
        <button onClick={(e) => { e.stopPropagation(); onDelete(); setShowDelete(false); }} className="w-full h-full flex flex-col items-center justify-center text-white p-2 hover:bg-rose-600 transition-colors">
          <Trash2 size={20} className="mx-auto" />
          <span className="text-[10px] font-bold uppercase mt-1">Delete</span>
        </button>
      </div>
      <motion.div
        
        drag="x"
        dragConstraints={{ left: showDelete ? -80 : 0, right: 0 }}
        
        onDragEnd={handleDragEnd}
        onClick={(e: React.MouseEvent) => {
          if (showDelete) { e.stopPropagation(); setShowDelete(false); }
        }}
        className="relative z-10 w-full h-full"
        style={{ touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-text-main shadow-sm">
      <Icon size={14} />
    </div>
    <div>
      <p className="text-[10px] font-medium text-text-main tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-text-main">{value || '-'}</p>
    </div>
  </div>
);

const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('salary')) return { icon: Wallet, color: '#10b981', bg: '#10b98120' };
  if (cat.includes('commission')) return { icon: TrendingUp, color: '#10b981', bg: '#10b98120' };
  if (cat.includes('advance')) return { icon: DollarSign, color: '#f97316', bg: '#f9731620' };
  if (cat.includes('friday')) return { icon: Calendar, color: '#6366f1', bg: '#6366f120' };
  if (cat.includes('bonus')) return { icon: Award, color: '#f59e0b', bg: '#f59e0b20' };
  if (cat.includes('vehicle') || cat.includes('inspection')) return { icon: Truck, color: '#10b981', bg: '#10b98120' };
  if (cat.includes('tip')) return { icon: Heart, color: '#f43f5e', bg: '#f43f5e20' };
  if (cat.includes('extra')) return { icon: Zap, color: '#06b6d4', bg: '#06b6d420' };
  if (cat.includes('kitchen')) return { icon: Utensils, color: '#8b5cf6', bg: '#8b5cf620' };
  if (cat.includes('penalty')) return { icon: AlertTriangle, color: '#ef4444', bg: '#ef444420' };
  if (cat.includes('traffic') || cat.includes('fine')) return { icon: Car, color: '#f43f5e', bg: '#f43f5e20' };
  if (cat.includes('mobile') || cat.includes('bill')) return { icon: Smartphone, color: '#0ea5e9', bg: '#0ea5e920' };
  if (cat.includes('diesel') || cat.includes('fuel')) return { icon: Fuel, color: '#f97316', bg: '#f9731620' };
  return { icon: Info, color: '#6b7280', bg: '#6b728020' };
};

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
  if (cat.includes('vehicle') || cat.includes('inspection') || cat.includes('extra')) {
    return {
      gradient: 'bg-gradient-to-br from-sky-500 via-blue-500 to-blue-600',
      icon: Truck,
      label: 'Vehicle Inspection',
    };
  }
  return {
    gradient: 'bg-gradient-to-br from-slate-500 via-slate-600 to-slate-700',
    icon: Info,
    label: 'Other',
  };
};

const BreakdownModal = ({ title, data, total, onClose, colorClass, currency }: any) => {
  const { wallpaper, backgroundColor, isNightMode, appThemeMode } = useStore();
  const isDark = isNightMode || appThemeMode !== 'light';
  return createPortal(
  <div className="smooth-slide-in fixed inset-0 z-[100] flex flex-col justify-end"
    style={{ background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)') }}
  >
    <div 
      className="absolute inset-0 bg-transparent" 
      onClick={onClose} 
    />
    <div 
      className="relative bg-card-bg backdrop-blur-md w-full rounded-t-[8px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
    >
      <div className="p-4 flex items-center justify-between bg-transparent">
        <h3 className="text-xs font-bold text-text-main uppercase tracking-widest">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-hover-bg transition-colors">
          <X size={18} className="text-text-muted" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto space-y-4 flex-1">
        {Object.entries(data).map(([key, value]: [string, any]) => {
          const { icon: Icon, color, bg } = getCategoryIcon(key);
          return (
            <div key={key} className="flex justify-between items-center group bg-card-bg p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: bg, color: color }}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-tight group-hover:text-text-main transition-colors">{key}</span>
              </div>
              <span className={`text-xs font-semibold ${colorClass}`}>{currency.code} {value.toLocaleString()}</span>
            </div>
          );
        })}
        {Object.keys(data).length === 0 && (
          <div className="flex flex-col items-center py-8 opacity-40">
            <AlertCircle size={24} className="mb-2 text-text-main" />
            <p className="text-[10px] font-bold text-text-main uppercase tracking-widest">No data available</p>
          </div>
        )}
      </div>
      <div className="p-4 bg-transparent flex justify-between items-center flex-none">
        <span className="text-[10px] font-bold uppercase text-text-muted tracking-widest">Total Summary</span>
        <span className={`text-sm font-semibold ${colorClass}`}>{currency.code} {total.toLocaleString()}</span>
      </div>
    </div>
  </div>,
  document.body
);
};

const AvailableBalancePage = ({ 
  navigationDirection,
  setNavigationDirection,
  data, 
  total, 
  onClose, 
  currency, 
  isDark, 
  wallpaper, 
  backgroundColor, 
  isNightMode, 
  appThemeMode, 
  trips, 
  monthlyFiles, 
  payments, 
  currentFile, 
  isItemBelongsToCurrentFile, 
  fileTrips 
}: any) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVehicleInspectionItem, setSelectedVehicleInspectionItem] = useState<any | null>(null);
  const { user, removePayment, confirmAction, showFeedback, language, setAppThemeMode, notifications, setView } = useStore();

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
          {appThemeMode === 'light' ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
        </button>
      </div>
    );
  };

  const [filterMonth, setFilterMonth] = useState<string>(String(currentFile?.month || 'ALL'));
  const [filterYear, setFilterYear] = useState<string>(String(currentFile?.year || 'ALL'));

  const [detailFilterMonth, setDetailFilterMonth] = useState<string>('ALL');
  const [detailFilterYear, setDetailFilterYear] = useState<string>('ALL');
  const [localDeletedIds, setLocalDeletedIds] = useState<Set<string>>(new Set());

  const handleCategoryClick = (categoryName: string) => {
    setDetailFilterMonth(filterMonth);
    setDetailFilterYear(filterYear);
    setLocalDeletedIds(new Set());
    setNavigationDirection('forward');
    setSelectedCategory(categoryName);
  };

  const availableByCategoryFiltered = useMemo(() => {
    // 1. Find the monthly file(s) matching filterMonth and filterYear
    const matchedFiles = monthlyFiles.filter((f: any) => {
      const mMatch = filterMonth === 'ALL' ? true : Number(f.month) === Number(filterMonth);
      const yMatch = filterYear === 'ALL' ? true : Number(f.year) === Number(filterYear);
      return mMatch && yMatch;
    });

    // 2. Collect all trip IDs belonging to these matched files
    const fileTripIds = new Set<string>();
    matchedFiles.forEach((mFile: any) => {
      const tripsForFile = trips.filter((t: any) => t.fileId === mFile.id);
      tripsForFile.forEach((t: any) => fileTripIds.add(t.id));
    });

    // 3. Initialize default categories as requested
    const acc: Record<string, number> = {
      'Salary': 0,
      'Commission': 0,
      'Friday': 0,
      'Bonus': 0,
      'Trip Diesel': 0,
      'Overtime': 0,
      'Vehicle Inspection': 0,
      'Other': 0
    };

    // 4. Sum up received payment amounts
    payments
      .filter((p: any) => p.status === 'RECEIVED' && p.details?.pendingItems)
      .forEach((p: any) => {
        let category = p.category || 'Other';
        if (category.toUpperCase() === 'EXTRA FUEL' || category.toUpperCase() === 'EXTRA_FUEL') {
          category = 'Vehicle Inspection';
        }
        
        const relevantAmount = Object.entries(p.details.pendingItems || {})
          .filter(([id]) => {
            if (fileTripIds.has(id)) return true;
            if (id.includes('-')) {
              if (id.startsWith('TRIP-') || id.startsWith('EF-')) {
                const index = id.lastIndexOf('-');
                if (index !== -1) {
                  const potentialTripId = id.substring(0, index);
                  if (fileTripIds.has(potentialTripId)) return true;
                }
              }
              if (id.startsWith('AGG-')) {
                return matchedFiles.some((mFile: any) => id.includes(mFile.id));
              }
            }
            return false;
          })
          .reduce((sum, [_, amount]) => sum + (Number(amount) || 0), 0);
        
        if (relevantAmount > 0) {
          const matchingKey = Object.keys(acc).find(
            k => k.toLowerCase() === category.toLowerCase()
          );
          if (matchingKey) {
            acc[matchingKey] = (acc[matchingKey] || 0) + relevantAmount;
          } else {
            acc['Other'] = (acc['Other'] || 0) + relevantAmount;
          }
        }
      });

    return acc;
  }, [payments, trips, monthlyFiles, filterMonth, filterYear]);

  const totalFilteredReceived = useMemo(() => {
    return Object.values(availableByCategoryFiltered).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
  }, [availableByCategoryFiltered]);

  const filteredCategoryItems = useMemo(() => {
    if (!selectedCategory) return [];

    let searchCategory = selectedCategory;
    if (selectedCategory === 'Vehicle Inspection') {
      searchCategory = 'EXTRA FUEL';
    }

    // Find matched files for detailFilterMonth & detailFilterYear
    const matchedFiles = monthlyFiles.filter((f: any) => {
      const mMatch = detailFilterMonth === 'ALL' ? true : Number(f.month) === Number(detailFilterMonth);
      const yMatch = detailFilterYear === 'ALL' ? true : Number(f.year) === Number(detailFilterYear);
      return mMatch && yMatch;
    });

    // Collect all trip IDs belonging to these matched files
    const fileTripIds = new Set<string>();
    matchedFiles.forEach((mFile: any) => {
      const tripsForFile = trips.filter((t: any) => t.fileId === mFile.id);
      tripsForFile.forEach((t: any) => fileTripIds.add(t.id));
    });

    return payments.filter((p: any) => {
      if (p.status !== 'RECEIVED' || !p.details?.pendingItems) return false;
      
      let isCatMatch = false;
      const paymentCategoryNormalized = (p.category || '').trim().toUpperCase();
      if (searchCategory === 'Other') {
        const defaultCategories = ['SALARY', 'COMMISSION', 'FRIDAY', 'BONUS', 'TRIP DIESEL', 'OVERTIME', 'EXTRA FUEL', 'EXTRA_FUEL', 'VEHICLE INSPECTION'];
        isCatMatch = !defaultCategories.includes(paymentCategoryNormalized);
      } else {
        isCatMatch = paymentCategoryNormalized === searchCategory.trim().toUpperCase() ||
                     (searchCategory === 'EXTRA FUEL' && paymentCategoryNormalized === 'EXTRA_FUEL') ||
                     (searchCategory === 'Trip Diesel' && paymentCategoryNormalized === 'TRIP DIESEL') ||
                     (searchCategory === 'Overtime' && paymentCategoryNormalized === 'OVERTIME');
      }

      if (!isCatMatch) return false;
      
      const relevantAmount = Object.entries(p.details.pendingItems || {})
        .filter(([id]) => {
          if (fileTripIds.has(id)) return true;
          if (id.includes('-')) {
            if (id.startsWith('TRIP-') || id.startsWith('EF-')) {
              const index = id.lastIndexOf('-');
              if (index !== -1) {
                const potentialTripId = id.substring(0, index);
                if (fileTripIds.has(potentialTripId)) return true;
              }
            }
            if (id.startsWith('AGG-')) {
              return matchedFiles.some((mFile: any) => id.includes(mFile.id));
            }
          }
          return false;
        })
        .reduce((sum, [_, amount]) => sum + (Number(amount) || 0), 0);
      
      return relevantAmount > 0;
    });
  }, [selectedCategory, detailFilterMonth, detailFilterYear, payments, trips, monthlyFiles]);

  const filteredCategoryItemsFinal = useMemo(() => {
    return filteredCategoryItems.filter(item => !localDeletedIds.has(item.id));
  }, [filteredCategoryItems, localDeletedIds]);

  const detailTotalSum = useMemo(() => {
    if (!selectedCategory) return 0;
    
    // Find matched files for detailFilterMonth & detailFilterYear
    const matchedFiles = monthlyFiles.filter((f: any) => {
      const mMatch = detailFilterMonth === 'ALL' ? true : Number(f.month) === Number(detailFilterMonth);
      const yMatch = detailFilterYear === 'ALL' ? true : Number(f.year) === Number(detailFilterYear);
      return mMatch && yMatch;
    });

    // Collect all trip IDs belonging to these matched files
    const fileTripIds = new Set<string>();
    matchedFiles.forEach((mFile: any) => {
      const tripsForFile = trips.filter((t: any) => t.fileId === mFile.id);
      tripsForFile.forEach((t: any) => fileTripIds.add(t.id));
    });

    let sum = 0;
    filteredCategoryItemsFinal.forEach((payment: any) => {
      const relevantAmount = Object.entries(payment.details?.pendingItems || {})
        .filter(([id]) => {
          if (fileTripIds.has(id)) return true;
          if (id.includes('-')) {
            if (id.startsWith('TRIP-') || id.startsWith('EF-')) {
              const index = id.lastIndexOf('-');
              if (index !== -1) {
                const potentialTripId = id.substring(0, index);
                if (fileTripIds.has(potentialTripId)) return true;
              }
            }
            if (id.startsWith('AGG-')) {
              return matchedFiles.some((mFile: any) => id.includes(mFile.id));
            }
          }
          return false;
        })
        .reduce((total, [_, amt]) => total + (Number(amt) || 0), 0);
      
      sum += (relevantAmount > 0 ? relevantAmount : Number(payment.amount) || 0);
    });
    return sum;
  }, [filteredCategoryItemsFinal, selectedCategory, detailFilterMonth, detailFilterYear, monthlyFiles, trips]);

  const effectiveBg = useMemo(() => {
    if (isNightMode) return '#000000';
    if (backgroundColor) return backgroundColor;
    if (wallpaper) return '#000000';
    return appThemeMode === 'light' ? '#207E4A' : '#000000';
  }, [isNightMode, backgroundColor, wallpaper, appThemeMode]);

  const dynamicTextColor = useMemo(() => getContrastColor(effectiveBg), [effectiveBg]);
  const dynamicMutedColor = useMemo(() => dynamicTextColor === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', [dynamicTextColor]);

  return (
    <div 
      className="w-full h-full flex flex-col"
      style={{ 
        background: isNightMode ? '#000000' : (backgroundColor || 'var(--page-bg-solid, #f8fafc)') 
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
              onClick={onClose} 
              className="flex items-center justify-center transition-colors shrink-0"
              style={{ color: 'var(--header-text)' }}
            >
              <ChevronLeft size={24} />
            </button>
            <h3 className="text-sm font-bold capitalize tracking-tight truncate" style={{ color: 'var(--header-text)' }}>Available Balance</h3>
          </div>
          {renderHeaderActions()}
        </div>
      </div>
      <div 
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-[180px] font-sans">
          
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[10px] p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
              <Wallet size={120} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-100 mb-1">
              {language === 'bn' ? 'মোট প্রাপ্ত ব্যালেন্স' : 'Total Received Balance'}
            </p>
            <h2 className="text-3xl font-black font-sans tracking-tight">
              {`${currency.code} ${totalFilteredReceived.toLocaleString()}`}
            </h2>
            <div className="mt-2.5 h-px bg-white/20 w-full" />
            <p className="text-[9px] text-emerald-100/80 font-bold mt-1">
              {language === 'bn' ? 'সকল সোর্স থেকে সংগ্রহকৃত' : 'Collected from all sources'}
            </p>
          </div>

          {/* Month and Year Filter selectors */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="flex flex-col">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-xl px-3 py-3.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">{language === 'bn' ? 'সব মাস' : 'All Months'}</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-xl px-3 py-3.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="ALL">{language === 'bn' ? 'সব বছর' : 'All Years'}</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of categories */}
          {Object.entries(availableByCategoryFiltered).map(([key, value]: [string, any], index: number) => {
            const { icon: Icon, color, bg } = getCategoryIcon(key);
            return (
              <div 
                key={key} 
                onClick={() => handleCategoryClick(key)}
                className="bg-card-bg backdrop-blur-md p-5 rounded-[10px] shadow-sm flex justify-between items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-black/5 dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: bg, color: color }}
                  >
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tight text-text-muted`}>{key}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold text-emerald-600 dark:text-emerald-500`}>{`${currency.code} ${value.toLocaleString()}`}</span>
                  <ChevronRight size={16} className="text-text-muted opacity-50" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedCategory && createPortal(
            <div
              key="monthly-file-selected-category-received"
              className={`fixed inset-0 z-[100] flex flex-col tms-page-enter-fwd ${isDark ? 'dark' : ''}`}
              style={{ 
                backgroundColor: isDark ? '#000000' : (backgroundColor || '#f1f5f9'),
                background: isDark ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg, #f1f5f9)')) 
              }}
            >
              <div 
                className="flex-none shadow-md safe-top"
                style={{ 
                  background: 'var(--header-bg)'
                }}
              >
                <div className="h-14 flex items-center justify-between px-4 w-full gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button 
                      onClick={() => {
                        setNavigationDirection('backward');
                        setSelectedCategory(null);
                      }}
                    className="flex items-center justify-center transition-colors shrink-0"
                    style={{ color: 'var(--header-text)' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h3 className="text-sm font-bold capitalize tracking-tight truncate" style={{ color: 'var(--header-text)' }}>
                    {selectedCategory ? `${formatCategoryHeader(selectedCategory)} Received Details` : 'Received Details'}
                  </h3>
                </div>
                {renderHeaderActions()}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-[140px] safe-bottom">
              {/* 1. Category Summary Card */}
              {(() => {
                const cardDetails = getCategoryCardDetails(selectedCategory);
                const CardIcon = cardDetails.icon;
                return (
                  <div className={`rounded-[10px] p-5 text-white shadow-lg relative overflow-hidden ${cardDetails.gradient}`}>
                    <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-4 translate-y-4">
                      <CardIcon size={120} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-wider opacity-85 mb-1">
                      {language === 'bn' ? `${cardDetails.label} সামারি` : `${cardDetails.label} Summary`}
                    </p>
                    <h2 className="text-3xl font-black font-sans tracking-tight">
                      {`${currency.code} ${detailTotalSum.toLocaleString()}`}
                    </h2>
                    <div className="mt-2.5 h-px bg-white/20 w-full" />
                    <p className="text-[9px] opacity-75 font-bold mt-1">
                      {language === 'bn' ? 'ফিল্টার অনুযায়ী সর্বমোট' : 'Total based on active filters'}
                    </p>
                  </div>
                );
              })()}

              {/* 2. Detail Month and Year Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <select
                    value={detailFilterMonth}
                    onChange={(e) => setDetailFilterMonth(e.target.value)}
                    className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">{language === 'bn' ? 'সব মাস' : 'All Months'}</option>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                      <option key={m} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <select
                    value={detailFilterYear}
                    onChange={(e) => setDetailFilterYear(e.target.value)}
                    className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">{language === 'bn' ? 'সব বছর' : 'All Years'}</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Transaction History heading */}
              <div className="pt-2 mb-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-main">
                  {language === 'bn' ? 'ট্রানজেকশন হিস্টোরি' : 'Transaction History'}
                </h4>
              </div>

              {/* List of items */}
              {filteredCategoryItemsFinal.length === 0 ? (
                <div className="text-center py-12 text-text-main bg-card-bg/30 rounded-xl border border-dashed border-black/10 dark:border-white/10">
                  <AlertCircle size={40} className="mx-auto mb-3 opacity-20 text-text-main" />
                  <p className="text-xs font-bold uppercase tracking-wide">
                    {language === 'bn' ? 'কোনো রেকর্ড পাওয়া যায়নি' : `No records found for ${selectedCategory}`}
                  </p>
                </div>
              ) : (
                (() => {
                  const isSalary = selectedCategory.trim().toUpperCase() === 'SALARY';
                  const isCommission = selectedCategory.trim().toUpperCase() === 'COMMISSION';
                  
                  if (isSalary) {
                    return filteredCategoryItemsFinal.map((payment, index) => {
                      const sourceName = payment.details?.companyName || payment.companyName || user?.companyName || 'Unknown Company';
                      
                      const getSalaryForShort = () => {
                        if (payment.month != null && !Number.isNaN(Number(payment.month))) {
                          const monthNum = Number(payment.month);
                          if (monthNum >= 1 && monthNum <= 12 && payment.year) {
                            const mName = new Date(0, monthNum - 1).toLocaleString('en-US', { month: 'short' });
                            const yyyy = String(payment.year).length === 2 ? `20${payment.year}` : String(payment.year);
                            return `${mName}-${yyyy}`;
                          }
                        }
                        const rawVal = payment.tripMonthAndYear;
                        if (rawVal && rawVal !== 'N/A') {
                          const parts = rawVal.trim().replace('-', ' ').split(/\s+/);
                          if (parts.length >= 2) {
                            const m = parts[0].substring(0, 3);
                            const capMonth = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
                            const y = parts[1];
                            const yyyy = y.length === 2 ? `20${y}` : y;
                            return `${capMonth}-${yyyy}`;
                          }
                          return rawVal;
                        }
                        if (currentFile) {
                          const mName = new Date(0, Number(currentFile.month) - 1).toLocaleString('en-US', { month: 'short' });
                          const yyyy = String(currentFile.year).length === 2 ? `20${currentFile.year}` : String(currentFile.year);
                          return `${mName}-${yyyy}`;
                        }
                        return 'N/A';
                      };

                      const getPaymentDateStr = (dateVal: any) => {
                        if (!dateVal) return 'N/A';
                        try {
                          const d = new Date(dateVal);
                          if (Number.isNaN(d.getTime())) return String(dateVal);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = d.toLocaleString('en-US', { month: 'short' });
                          const year = d.getFullYear();
                          return `${day}-${month}-${year}`;
                        } catch (e) {
                          return String(dateVal);
                        }
                      };

                      const getSalaryPendingBalance = () => {
                        try {
                          const allPending = PaymentManager.getPendingDues(trips, monthlyFiles, payments, 'SALARY');
                          const fileGroup = allPending.find(f => f.month === currentFile.month && f.year === currentFile.year);
                          if (fileGroup) {
                            const salaryCat = fileGroup.categories.find((c: any) => c.name.toUpperCase() === 'SALARY');
                            if (salaryCat) {
                              const itemCompany = (payment.details?.companyName || payment.companyName || '').trim().toUpperCase();
                              const matching = salaryCat.items.filter((i: any) => {
                                const cName = (i.details?.companyName || i.companyName || '').trim().toUpperCase();
                                return cName === itemCompany || cName.includes(itemCompany) || itemCompany.includes(cName);
                              });
                              if (matching.length > 0) {
                                const sum = matching.reduce((acc: number, i: any) => acc + (i.pending || 0), 0);
                                return sum > 0 ? (sum < 10 && sum > 0 ? `0${sum}` : sum.toLocaleString()) : '00';
                              }
                            }
                          }
                        } catch (error) {
                          console.error("Error calculating pending balance:", error);
                        }
                        return '00';
                      };

                      const getPayAmountValue = () => {
                        const fileTripIds = new Set(fileTrips.map((t: any) => t.id));
                        const sum = Object.entries(payment.details?.pendingItems || {})
                          .filter(([id]) => isItemBelongsToCurrentFile(id, fileTripIds))
                          .reduce((total, [_, amt]) => total + (Number(amt) || 0), 0);
                        return sum > 0 ? sum : Number(payment.amount) || 0;
                      };

                      const getSalaryFullMonthYear = () => {
                        let mNum = Number(payment.month);
                        let yNum = Number(payment.year);
                        if (payment.month == null || Number.isNaN(mNum)) {
                          if (currentFile) {
                            mNum = Number(currentFile.month);
                            yNum = Number(currentFile.year);
                          }
                        }
                        if (!Number.isNaN(mNum) && mNum >= 1 && mNum <= 12) {
                          const monthNames = [
                            "January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"
                          ];
                          const monthName = monthNames[mNum - 1];
                          const fullYear = yNum ? (String(yNum).length === 2 ? `20${yNum}` : String(yNum)) : new Date().getFullYear();
                          return `${monthName}-${fullYear}`;
                        }
                        return 'July-2026';
                      };

                      return (
                        <SwipeToDeleteWrapper
                          key={payment.id || index}
                          itemVariants={itemVariants}
                          onDelete={() => {
                            confirmAction(language === 'bn' ? 'আপনি কি লেনদেনটি ডিলেট করতে চান?' : 'Are you sure you want to delete this transaction?', () => {
                              removePayment(payment.id);
                              showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Transaction deleted successfully');
                              setLocalDeletedIds(prev => {
                                const next = new Set(prev);
                                next.add(payment.id);
                                return next;
                              });
                            });
                          }}
                        >
                          <div 
                            className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all pointer-events-none"
                          >
                            {/* Far Left: Clock Pending Icon */}
                            <div className="w-10 h-10 rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                              <Clock size={20} strokeWidth={2.5} className="animate-pulse" />
                            </div>

                            {/* Left/Center: Information */}
                            <div className="flex-1 min-w-0 flex flex-col text-left font-sans text-xs pointer-events-auto">
                              {/* Row 1: Title (Salary) & Pending Badge */}
                              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                                <span className="text-sm font-black text-text-main">
                                  {language === 'bn' ? 'সেলারী' : 'Salary'}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                  <Clock size={10} className="animate-pulse shrink-0" />
                                  {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                </span>
                              </div>

                               {/* Info Table with aligned colon column */}
                               <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                 <span className="text-text-muted font-medium whitespace-nowrap">Source of Income</span>
                                 <span className="text-text-muted font-medium">:</span>
                                 <span className="font-bold text-text-main truncate">Salary</span>

                                 <span className="text-text-muted font-medium whitespace-nowrap">Salary for</span>
                                 <span className="text-text-muted font-medium">:</span>
                                 <span className="font-bold text-text-main truncate">{getSalaryFullMonthYear()}</span>
                               </div>
                            </div>

                            {/* Right Side: Centered Amount */}
                            <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto pointer-events-auto">
                              <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                {getSalaryPendingBalance()} {currency.code}
                              </span>
                            </div>
                          </div>
                        </SwipeToDeleteWrapper>
                      );
                    });
                  }

                  if (isCommission) {
                    const grouped: { [key: string]: any } = {};
                    filteredCategoryItemsFinal.forEach(payment => {
                      const key = `${payment.month || currentFile?.month}-${payment.year || currentFile?.year}`;
                      if (!grouped[key]) {
                        grouped[key] = {
                          ...payment,
                          id: key,
                          amount: 0,
                          ids: [],
                          pendingItemsGrouped: {},
                          month: payment.month || currentFile?.month,
                          year: payment.year || currentFile?.year,
                        };
                      }
                      grouped[key].amount += Number(payment.amount) || 0;
                      grouped[key].ids.push(payment.id);
                      if (payment.details?.pendingItems) {
                        Object.assign(grouped[key].pendingItemsGrouped, payment.details.pendingItems);
                      }
                    });
                    const displayItems = Object.values(grouped);
                    displayItems.sort((a, b) => {
                      if (b.year !== a.year) return b.year - a.year;
                      return b.month - a.month;
                    });

                    return displayItems.map((payment, index) => {
                      const sourceName = payment.details?.companyName || payment.companyName || user?.companyName || 'Unknown Company';
                      
                      const getCommissionForShort = () => {
                        if (payment.month != null && !Number.isNaN(Number(payment.month))) {
                          const monthNum = Number(payment.month);
                          if (monthNum >= 1 && monthNum <= 12 && payment.year) {
                            const mName = new Date(0, monthNum - 1).toLocaleString('en-US', { month: 'short' });
                            const yyyy = String(payment.year).length === 2 ? `20${payment.year}` : String(payment.year);
                            return `${mName}-${yyyy}`;
                          }
                        }
                        const rawVal = payment.tripMonthAndYear;
                        if (rawVal && rawVal !== 'N/A') {
                          const parts = rawVal.trim().replace('-', ' ').split(/\s+/);
                          if (parts.length >= 2) {
                            const m = parts[0].substring(0, 3);
                            const capMonth = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
                            const y = parts[1];
                            const yyyy = y.length === 2 ? `20${y}` : y;
                            return `${capMonth}-${yyyy}`;
                          }
                          return rawVal;
                        }
                        if (currentFile) {
                          const mName = new Date(0, Number(currentFile.month) - 1).toLocaleString('en-US', { month: 'short' });
                          const yyyy = String(currentFile.year).length === 2 ? `20${currentFile.year}` : String(currentFile.year);
                          return `${mName}-${yyyy}`;
                        }
                        return 'N/A';
                      };

                      const getPaymentDateStr = (dateVal: any) => {
                        if (!dateVal) return 'N/A';
                        try {
                          const d = new Date(dateVal);
                          if (Number.isNaN(d.getTime())) return String(dateVal);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = d.toLocaleString('en-US', { month: 'short' });
                          const year = d.getFullYear();
                          return `${day}-${month}-${year}`;
                        } catch (e) {
                          return String(dateVal);
                        }
                      };

                      const getTotalTripValue = () => {
                        const pendingItemsObj = payment.pendingItemsGrouped || payment.details?.pendingItems;
                        if (pendingItemsObj) {
                          const keys = Object.keys(pendingItemsObj || {});
                          const fileTripIds = new Set(fileTrips.map((t: any) => t.id));
                          const filteredKeys = keys.filter(id => isItemBelongsToCurrentFile(id, fileTripIds));
                          const tripIds = new Set(filteredKeys.map(k => k.includes('-') ? k.substring(0, k.lastIndexOf('-')) : k));
                          return tripIds.size || 1;
                        }
                        return 1;
                      };

                      const getCommissionPendingBalance = () => {
                        try {
                          const allPending = PaymentManager.getPendingDues(trips, monthlyFiles, payments, 'COMMISSION');
                          const fileGroup = allPending.find(f => f.month === currentFile.month && f.year === currentFile.year);
                          if (fileGroup) {
                            const commCat = fileGroup.categories.find((c: any) => c.name.toUpperCase() === 'COMMISSION');
                            if (commCat) {
                              const itemCompany = (payment.details?.companyName || payment.companyName || '').trim().toUpperCase();
                              const matching = commCat.items.filter((i: any) => {
                                const cName = (i.details?.companyName || i.companyName || '').trim().toUpperCase();
                                return cName === itemCompany || cName.includes(itemCompany) || itemCompany.includes(cName);
                              });
                              if (matching.length > 0) {
                                const sum = matching.reduce((acc: number, i: any) => acc + (i.pending || 0), 0);
                                return sum > 0 ? (sum < 10 && sum > 0 ? `${sum.toFixed(1)}` : sum.toLocaleString()) : '0.0';
                              }
                            }
                          }
                        } catch (error) {
                          console.error("Error calculating pending Commission balance:", error);
                        }
                        return '0.0';
                      };

                      const getPayAmountValue = () => {
                        const fileTripIds = new Set(fileTrips.map((t: any) => t.id));
                        const pendingItemsObj = payment.pendingItemsGrouped || payment.details?.pendingItems;
                        const sum = Object.entries(pendingItemsObj || {})
                          .filter(([id]) => isItemBelongsToCurrentFile(id, fileTripIds))
                          .reduce((total, [_, amt]) => total + (Number(amt) || 0), 0);
                        return sum > 0 ? sum : Number(payment.amount) || 0;
                      };

                      return (
                        <SwipeToDeleteWrapper
                          key={payment.id || index}
                          itemVariants={itemVariants}
                          onDelete={() => {
                            confirmAction(language === 'bn' ? 'আপনি কি কমিশন লেনদেনগুলো ডিলেট করতে চান?' : 'Are you sure you want to delete these commission transactions?', () => {
                              if (payment.ids && payment.ids.length > 0) {
                                payment.ids.forEach((id: string) => removePayment(id));
                              } else {
                                removePayment(payment.id);
                              }
                              showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Transactions deleted successfully');
                              setLocalDeletedIds(prev => {
                                const next = new Set(prev);
                                const toAdd = payment.ids || [payment.id];
                                toAdd.forEach((id: string) => next.add(id));
                                return next;
                              });
                            });
                          }}
                        >
                          <div 
                            className="bg-card-bg p-3.5 rounded-2xl shadow-sm flex flex-col gap-1.5 border border-black/10 dark:border-white/10 pointer-events-none"
                          >
                            <div className="flex flex-col gap-1.5 w-full text-left font-sans text-xs text-text-main pointer-events-auto">
                              {/* Form / Source Row with border-b spacer exactly like screenshot */}
                              <div className="flex items-center justify-between w-full border-b border-black/10 dark:border-white/10 pb-1.5 mb-1 min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Form / Source</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main truncate uppercase text-[11px] sm:text-[13px]">
                                  {sourceName}
                                </span>
                              </div>
                              
                              {/* Total Trip Row */}
                              <div className="flex items-center justify-between w-full min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Total Trip</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs font-mono">
                                  {getTotalTripValue()}
                                </span>
                              </div>

                              {/* Commission for Row with border-b spacer exactly like screenshot */}
                              <div className="flex items-center justify-between w-full border-b border-black/10 dark:border-white/10 pb-1.5 mb-1 min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Commission for</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs">
                                  {getCommissionForShort()}
                                </span>
                              </div>

                              {/* Payment Amount Row */}
                              <div className="flex items-center justify-between w-full min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Payment Amount</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs">
                                  {getPayAmountValue().toLocaleString()} {currency.code}
                                </span>
                              </div>

                              {/* Last balance Row */}
                              <div className="flex items-center justify-between w-full min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Last balance</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs">
                                  {getCommissionPendingBalance()} {currency.code}
                                </span>
                              </div>
                            </div>
                          </div>
                        </SwipeToDeleteWrapper>
                      );
                    });
                  }

                  // Default rendering for other categories in Available Details
                  let renderItems = filteredCategoryItemsFinal;
                  const isTripDiesel = selectedCategory?.toUpperCase() === 'TRIP DIESEL';
                  if (isTripDiesel) {
                    const groupedTripDiesel: Record<string, any> = {};
                    filteredCategoryItemsFinal.forEach(payment => {
                      const fileTripIds = new Set(fileTrips.map((t: any) => t.id));
                      const entries = Object.entries(payment.details?.pendingItems || {})
                        .filter(([id]) => isItemBelongsToCurrentFile(id, fileTripIds));

                      entries.forEach(([fullKey, amtVal]) => {
                        const amt = Number(amtVal) || 0;
                        if (amt <= 0) return;

                        const parts = fullKey.split('-');
                        let targetId = '';
                        let subType = '';
                        const KNOWN_SUBKEYS = ['dieselPrice', 'extraDiesel'];
                        const lastPart = parts[parts.length - 1];
                        if (KNOWN_SUBKEYS.includes(lastPart)) {
                          targetId = parts.slice(0, parts.length - 1).join('-');
                          subType = lastPart;
                        } else {
                          targetId = fullKey;
                          subType = 'dieselPrice'; // default
                        }

                        const trip = fileTrips.find((t: any) => 
                          t.id === targetId || 
                          t.invoiceNumber === targetId || 
                          t.containerNumber === targetId || 
                          t.vehicleNumber === targetId
                        );

                        const companyName = trip?.companyName || payment.details?.companyName || payment.companyName || 'Unknown Company';
                        const tripKey = trip?.id || targetId || companyName;

                        if (!groupedTripDiesel[tripKey]) {
                          groupedTripDiesel[tripKey] = {
                            id: tripKey,
                            tripId: trip?.id || targetId,
                            companyName,
                            containerNumber: trip?.containerNumber || 'N/A',
                            invoiceNumber: trip?.invoiceNumber || 'N/A',
                            tripDieselAllocations: {
                              dieselPaid: 0,
                              extraDieselPaid: 0
                            },
                            amount: 0,
                            paymentIds: [],
                            dates: []
                          };
                        }

                        if (subType === 'extraDiesel') {
                          groupedTripDiesel[tripKey].tripDieselAllocations.extraDieselPaid += amt;
                        } else {
                          groupedTripDiesel[tripKey].tripDieselAllocations.dieselPaid += amt;
                        }

                        groupedTripDiesel[tripKey].amount += amt;
                        if (!groupedTripDiesel[tripKey].paymentIds.includes(payment.id)) {
                          groupedTripDiesel[tripKey].paymentIds.push(payment.id);
                        }
                        if (payment.date) {
                          groupedTripDiesel[tripKey].dates.push(payment.date);
                        }
                      });
                    });

                    renderItems = Object.values(groupedTripDiesel).map((g: any) => {
                      const sortedDates = g.dates.filter(Boolean).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
                      return {
                        ...g,
                        date: sortedDates[0] || null
                      };
                    });
                  }

                  return renderItems.map((item, index) => {
                    if (isTripDiesel) {
                      const sourceName = item.companyName || 'Unknown Company';
                      const getPaymentDateStr = (dateVal: any) => {
                        if (!dateVal) return 'N/A';
                        try {
                          const d = new Date(dateVal);
                          if (Number.isNaN(d.getTime())) return String(dateVal);
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = d.toLocaleString('en-US', { month: 'short' });
                          const year = d.getFullYear();
                          return `${day}-${month}-${year}`;
                        } catch (e) {
                          return String(dateVal);
                        }
                      };

                      const getTripDieselPendingBalance = () => {
                        try {
                          const totalAmount = (item.tripDieselAllocations?.dieselPaid || 0) + 
                                              (item.tripDieselAllocations?.extraDieselPaid || 0);
                          const paymentAmount = item.amount || 0;
                          const pending = totalAmount - Math.abs(paymentAmount);
                          return pending > 0 ? (pending < 10 && pending > 0 ? `${pending.toFixed(1)}` : pending.toLocaleString()) : '0';
                        } catch (error) {
                          console.error("Error calculating pending Trip Diesel balance:", error);
                        }
                        return '0';
                      };

                      return (
                        <SwipeToDeleteWrapper
                          key={item.id || index}
                          itemVariants={itemVariants}
                          onDelete={() => {
                            confirmAction(language === 'bn' ? 'আপনি কি ট্রিপ ডিজেলের লেনদেনগুলো ডিলেট করতে চান?' : 'Are you sure you want to delete these Trip Diesel transactions?', () => {
                              if (item.paymentIds && item.paymentIds.length > 0) {
                                item.paymentIds.forEach((id: string) => removePayment(id));
                              } else {
                                removePayment(item.paymentId || item.id);
                              }
                              showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Transactions deleted successfully');
                              setLocalDeletedIds(prev => {
                                const next = new Set(prev);
                                const toAdd = item.paymentIds || [item.paymentId || item.id];
                                toAdd.forEach((id: string) => next.add(id));
                                return next;
                              });
                            });
                          }}
                        >
                          <div 
                            className="bg-card-bg p-3.5 rounded-2xl shadow-sm flex flex-col gap-1.5 border border-black/10 dark:border-white/10 pointer-events-none"
                          >
                            <div className="flex flex-col gap-1.5 w-full text-left font-sans text-xs text-text-main pointer-events-auto">
                              {/* Customer name Row */}
                              <div className="flex items-center justify-between w-full border-b border-black/10 dark:border-white/10 pb-1.5 mb-1 min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Customer name</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main truncate uppercase text-[11px] sm:text-[13px]">
                                  {sourceName}
                                </span>
                              </div>

                              {/* Conditionally Render Trip Diesel if amount > 0 */}
                              {(item.tripDieselAllocations?.dieselPaid || item.amount || 0) > 0 && (
                                <div className="flex items-center justify-between w-full min-w-0">
                                  <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Trip Diesel</span>
                                  <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                  <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs">
                                    {(item.tripDieselAllocations?.dieselPaid || item.amount || 0).toLocaleString()} {currency.code}
                                  </span>
                                </div>
                              )}

                              {/* Conditionally Render Extra Diesel if amount > 0 */}
                              {(item.tripDieselAllocations?.extraDieselPaid || 0) > 0 && (
                                <div className="flex items-center justify-between w-full min-w-0">
                                  <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Extra Diesel</span>
                                  <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                  <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs font-mono">
                                    {(item.tripDieselAllocations?.extraDieselPaid || 0).toLocaleString()} {currency.code}
                                  </span>
                                </div>
                              )}

                              {/* Total Row */}
                              <div className="flex items-center justify-between w-full min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Total</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs font-mono">
                                  {((item.tripDieselAllocations?.dieselPaid || 0) + 
                                    (item.tripDieselAllocations?.generatorDieselPaid || 0) + 
                                    (item.tripDieselAllocations?.extraDieselPaid || 0)).toLocaleString()} {currency.code}
                                </span>
                              </div>

                              {/* Payment Amount Row with border-b spacer */}
                              <div className="flex items-center justify-between w-full border-b border-black/10 dark:border-white/10 pb-1.5 mb-1 min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Payment Amount</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs font-mono">
                                  {(item.amount || 0).toLocaleString()} {currency.code}
                                </span>
                              </div>

                              {/* Last balance Row */}
                              <div className="flex items-center justify-between w-full min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Last balance</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs">
                                  {getTripDieselPendingBalance()} {currency.code}
                                </span>
                              </div>

                              {/* Payment Date Row */}
                              <div className="flex items-center justify-between w-full min-w-0">
                                <span className="w-[110px] sm:w-[130px] shrink-0 text-text-muted opacity-80 font-bold text-[11px] sm:text-xs">Payment Date</span>
                                <span className="shrink-0 text-text-muted opacity-80 font-bold mr-4">:</span>
                                <span className="flex-1 text-right font-black text-text-main text-[11px] sm:text-xs font-mono">
                                  {getPaymentDateStr(item.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </SwipeToDeleteWrapper>
                      );
                    }

                    const isVehicleInspection = selectedCategory === 'Vehicle Inspection' || selectedCategory?.toUpperCase() === 'EXTRA FUEL' || selectedCategory?.toUpperCase() === 'EXTRA_FUEL';

                    if (isVehicleInspection) {
                      const isPaid = true;
                      return (
                        <SwipeToDeleteWrapper
                          key={item.id || index}
                          itemVariants={itemVariants}
                          onDelete={() => {
                            confirmAction(language === 'bn' ? 'আপনি কি লেনদেনটি ডিলেট করতে চান?' : 'Are you sure you want to delete this transaction?', () => {
                              removePayment(item.id);
                              showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Transaction deleted successfully');
                              setLocalDeletedIds(prev => {
                                const next = new Set(prev);
                                next.add(item.id);
                                return next;
                              });
                            });
                          }}
                        >
                          <div 
                            className="bg-[#FFFBF2] dark:bg-[#1A1A1A] py-1.5 px-4 rounded-[10px] flex items-center justify-between shadow-sm border border-black/10 dark:border-white/10 cursor-pointer group min-h-[72px] relative pointer-events-auto"
                            onClick={() => {
                              setSelectedVehicleInspectionItem(item);
                            }}
                          >
                            <div className="flex items-center gap-4 flex-1 mr-2">
                              <div className="w-10 h-10 rounded-xl bg-[#F4EBE0] dark:bg-yellow-500/10 flex items-center justify-center text-[#8B5E3C] dark:text-yellow-400 shrink-0">
                                <Truck size={20} strokeWidth={2.5} />
                              </div>
                              <div className="overflow-hidden flex-1 text-left">
                                <h3 className="font-bold text-[12px] text-[#001F3F] dark:text-white transition-colors uppercase truncate w-full mb-1 pr-16">
                                  {item.label || item.details?.extraDieselReason || item.details?.note || (language === 'bn' ? 'এক্সট্রা ফিউল' : 'Extra Fuel')}
                                </h3>
                                <div className="flex items-center gap-2 text-[10px] text-[#2C3E50] dark:text-gray-300 font-bold border-y border-[#D4AF37] py-1 w-fit max-w-full">
                                  <span className="truncate">{language === 'bn' ? 'ভেইকেল' : 'Vehicle'}: {item.details?.vehicleNumber || item.vehicleNumber || 'N/A'}</span>
                                  <span className="text-[#D4AF37] shrink-0">|</span>
                                  <span className="truncate">{language === 'bn' ? 'টাইপ' : 'Type'}: {item.details?.deliveryPlace || item.details?.vehicleType || 'N/A'}</span>
                                </div>
                                <div className="mt-1.5 flex items-center gap-1">
                                   <span className="text-[10px] text-[#A67C52] font-semibold">{language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date'}:</span>
                                   <span className="text-[10px] text-[#8B5E3C] font-black">
                                     {item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                   </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <span 
                                style={{ fontSize: '10px' }}
                                className={`absolute top-1/2 -translate-y-1/2 right-10 font-black px-3 py-1 rounded-full shadow-sm border transition-all bg-[#004D2C] text-white border-[#A67C52]`}>
                                {language === 'bn' ? 'পেইড' : 'Paid'}
                              </span>
                              <ChevronRight size={20} className="text-[#8B5E3C] transition-colors" />
                            </div>
                          </div>
                        </SwipeToDeleteWrapper>
                      );
                    }

                    return (
                      <SwipeToDeleteWrapper
                        key={item.id || index}
                        itemVariants={itemVariants}
                        onDelete={() => {
                          confirmAction(language === 'bn' ? 'আপনি কি লেনদেনটি ডিলেট করতে চান?' : 'Are you sure you want to delete this transaction?', () => {
                            removePayment(item.id);
                            showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Transaction deleted successfully');
                            setLocalDeletedIds(prev => {
                              const next = new Set(prev);
                              next.add(item.id);
                              return next;
                            });
                          });
                        }}
                      >
                        <div 
                          className="bg-card-bg px-4 py-3 rounded-2xl shadow-sm flex flex-col gap-1.5 border border-black/5 dark:border-white/5 pointer-events-none"
                        >
                          <div className="flex justify-between items-start pointer-events-auto w-full">
                            <div>
                              <p className="text-sm font-black text-text-main line-clamp-1 mb-1" style={{ color: 'var(--primary)' }}>
                                {item.details?.companyName || item.companyName || 'N/A'}
                              </p>
                              <div className="space-y-0.5 text-[10px] font-bold text-text-muted">
                                <p>{selectedCategory}</p>
                                {item.tripMonthAndYear && <p>Salary for {item.tripMonthAndYear}</p>}
                              </div>
                              {item.date && (
                                <p className="text-[10px] font-semibold text-text-muted mt-2">
                                  Date: {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-base font-black text-emerald-500">
                                {currency.code} {(() => {
                                  const fileTripIds = new Set(fileTrips.map((t: any) => t.id));
                                  const sum = Object.entries(item.details?.pendingItems || {})
                                    .filter(([id]) => isItemBelongsToCurrentFile(id, fileTripIds))
                                    .reduce((total, [_, amt]) => total + (Number(amt) || 0), 0);
                                  return (sum > 0 ? sum : Number(item.amount) || 0).toLocaleString();
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </SwipeToDeleteWrapper>
                    );
                  });
                })()
              )}
              {/* Extra Safe-Area Spacer to prevent content from being covered by the bottom navigation bar */}
              <div className="h-44 sm:h-48 w-full shrink-0" />
            </div>
          </div>,
        document.body
      )}
      

      {selectedVehicleInspectionItem && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in" onClick={() => setSelectedVehicleInspectionItem(null)}>
          <div 
            className="bg-theme-card border border-black/5 dark:border-white/10 rounded-[10px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                  {language === 'bn' ? 'যানবাহন পরিদর্শন' : 'Vehicle Inspection'}
                </span>
                <h3 className="text-base font-black text-text-main truncate mt-1">
                  {selectedVehicleInspectionItem.label || selectedVehicleInspectionItem.details?.extraDieselReason || selectedVehicleInspectionItem.details?.note || (language === 'bn' ? 'এক্সট্রা ফিউল' : 'Extra Fuel')}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedVehicleInspectionItem(null)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left bg-theme-card">
              {/* Trip Metadata */}
              <div className="rounded-2xl p-4 space-y-2 border bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10 text-zinc-950 dark:text-text-main">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date'}</span>
                  <span className="font-bold">
                    {selectedVehicleInspectionItem.date ? new Date(selectedVehicleInspectionItem.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                
                <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}</span>
                  <span className="font-bold">
                    {selectedVehicleInspectionItem.details?.vehicleNumber || selectedVehicleInspectionItem.vehicleNumber || 'N/A'}
                  </span>
                </div>
                <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'ভেইকেল টাইপ' : 'Vehicle Type'}</span>
                  <span className="font-bold">
                    {selectedVehicleInspectionItem.details?.deliveryPlace || selectedVehicleInspectionItem.details?.vehicleType || 'N/A'}
                  </span>
                </div>
                {selectedVehicleInspectionItem.details?.extraDieselReason && (
                  <>
                    <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel'}</span>
                      <span className="font-bold">
                        {selectedVehicleInspectionItem.details.extraDieselReason}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Sub-items List */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block mb-1">
                  {language === 'bn' ? 'বকেয়া আইটেম সমূহ' : 'Dues Sub-items'}
                </span>
                
                {/* Outstanding Details Box */}
                <div className="rounded-2xl p-4 border flex items-center justify-between gap-3 bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                      <Check size={10} strokeWidth={4} />
                    </div>
                    <span className="text-xs font-black text-text-main block truncate leading-tight">
                      {language === 'bn' ? 'পেইড' : 'Paid'}
                    </span>
                  </div>
                  <span className="font-extrabold text-xs text-emerald-500">
                    {(() => {
                      const fileTripIds = new Set(fileTrips.map((t: any) => t.id));
                      const sum = Object.entries(selectedVehicleInspectionItem.details?.pendingItems || {})
                        .filter(([id]) => isItemBelongsToCurrentFile(id, fileTripIds))
                        .reduce((total, [_, amt]) => total + (Number(amt) || 0), 0);
                      return (sum > 0 ? sum : Number(selectedVehicleInspectionItem.amount) || 0).toLocaleString();
                    })()} {currency.code}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const PendingBreakdownPage = ({ navigationDirection, setNavigationDirection, data, total, onClose, currency, isDark, wallpaper, backgroundColor, isNightMode, appThemeMode, trips, monthlyFiles, payments, currentFile }: any) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVehicleInspectionItem, setSelectedVehicleInspectionItem] = useState<any | null>(null);
  const [selectedTripDetailsPopup, setSelectedTripDetailsPopup] = useState<any | null>(null);
  const { setIsLoadingView, user, language, setAppThemeMode, notifications, setView, setSelectedTrip } = useStore();

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
          {appThemeMode === 'light' ? <Moon size={20} strokeWidth={2.5} /> : <Sun size={20} strokeWidth={2.5} />}
        </button>
      </div>
    );
  };

  const [filterMonth, setFilterMonth] = useState<string>(String(currentFile?.month || 'ALL'));
  const [filterYear, setFilterYear] = useState<string>(String(currentFile?.year || 'ALL'));

  const [detailFilterMonth, setDetailFilterMonth] = useState<string>('ALL');
  const [detailFilterYear, setDetailFilterYear] = useState<string>('ALL');

  const pendingByCategoryFiltered = useMemo(() => {
    const breakdown: Record<string, number> = {
      'Salary': 0,
      'Commission': 0,
      'Friday': 0,
      'Bonus': 0,
      'Vehicle Inspection': 0,
      'Others': 0,
    };
    
    const pendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments);
    
    const matchedGroups = pendingDues.filter((f: any) => {
      const mMatch = filterMonth === 'ALL' ? true : Number(f.month) === Number(filterMonth);
      const yMatch = filterYear === 'ALL' ? true : Number(f.year) === Number(filterYear);
      return mMatch && yMatch;
    });

    matchedGroups.forEach((fileGroup: any) => {
      fileGroup.categories.forEach((cat: any) => {
        let catName = cat.name || 'Others';
        if (catName.toUpperCase() === 'EXTRA FUEL' || catName.toUpperCase() === 'EXTRA_FUEL') {
          catName = 'Vehicle Inspection';
        }
        const catPending = Number(cat.totalPending) || 0;
        
        const matchingKey = Object.keys(breakdown).find(
          k => k.toLowerCase() === catName.toLowerCase()
        ) || catName;
        
        breakdown[matchingKey] = (breakdown[matchingKey] || 0) + catPending;
      });
    });

    return breakdown;
  }, [trips, monthlyFiles, payments, filterMonth, filterYear]);

  const totalFilteredPending = useMemo(() => {
    return Object.values(pendingByCategoryFiltered).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
  }, [pendingByCategoryFiltered]);

  const filteredCategoryItemsFinal = useMemo(() => {
    if (!selectedCategory) return [];

    let searchCategory = selectedCategory;
    if (selectedCategory === 'Vehicle Inspection') {
      searchCategory = 'EXTRA FUEL';
    }

    const allPendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments, searchCategory);
    
    let items: any[] = [];
    allPendingDues.forEach((fileGroup: any) => {
      const mMatch = detailFilterMonth === 'ALL' ? true : Number(fileGroup.month) === Number(detailFilterMonth);
      const yMatch = detailFilterYear === 'ALL' ? true : Number(fileGroup.year) === Number(detailFilterYear);
      if (!mMatch || !yMatch) return;

      fileGroup.categories.forEach((catGroup: any) => {
        if (catGroup.name.toLowerCase() === searchCategory.toLowerCase() ||
            (searchCategory === 'EXTRA FUEL' && catGroup.name.toLowerCase() === 'extra_fuel')) {
          const itemsWithDate = catGroup.items.map((item: any) => ({
            ...item,
            month: fileGroup.month,
            year: fileGroup.year
          }));
          items = [...items, ...itemsWithDate];
        }
      });
    });

    return items;
  }, [trips, monthlyFiles, payments, selectedCategory, detailFilterMonth, detailFilterYear]);

  const detailTotalSum = useMemo(() => {
    return filteredCategoryItemsFinal.reduce((sum, item) => sum + (Number(item.pending) || 0), 0);
  }, [filteredCategoryItemsFinal]);

  const handleCategoryClick = (category: string) => {
    setDetailFilterMonth(filterMonth);
    setDetailFilterYear(filterYear);
    setNavigationDirection('forward');
    setSelectedCategory(category);
  };

  const effectiveBg = useMemo(() => {
    if (isNightMode) return '#000000';
    if (backgroundColor) return backgroundColor;
    if (wallpaper) return '#000000';
    return appThemeMode === 'light' ? '#207E4A' : '#000000';
  }, [isNightMode, backgroundColor, wallpaper, appThemeMode]);

  const dynamicTextColor = useMemo(() => getContrastColor(effectiveBg), [effectiveBg]);
  const dynamicMutedColor = useMemo(() => dynamicTextColor === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', [dynamicTextColor]);

  return (
    <div 
      className="w-full h-full flex flex-col"
      style={{ 
        background: isNightMode ? '#000000' : (backgroundColor || 'var(--page-bg-solid, #f8fafc)') 
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
              onClick={onClose} 
              className="flex items-center justify-center transition-colors shrink-0"
              style={{ color: 'var(--header-text)' }}
            >
              <ChevronLeft size={24} />
            </button>
            <h3 className="text-sm font-bold uppercase tracking-tight truncate" style={{ color: 'var(--header-text)' }}>Pending Balance</h3>
          </div>
          {renderHeaderActions()}
        </div>
      </div>
      <div 
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-[180px]">
          
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[10px] p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
              <Wallet size={120} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-wider text-orange-100 mb-1">
              {language === 'bn' ? 'মোট পেন্ডিং ব্যালেন্স' : 'Total Pending Balance'}
            </p>
            <h2 className="text-3xl font-black font-sans tracking-tight">
              {`${currency.code} ${totalFilteredPending.toLocaleString()}`}
            </h2>
            <div className="mt-2.5 h-px bg-white/20 w-full" />
            <p className="text-[9px] text-orange-100/80 font-bold mt-1">
              {language === 'bn' ? 'সকল পেন্ডিং পেমেন্ট বকেয়া' : 'Outstanding pending payments'}
            </p>
          </div>

          {/* Month and Year Filter selectors */}
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="flex flex-col">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-xl px-3 py-3.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="ALL">{language === 'bn' ? 'সব মাস' : 'All Months'}</option>
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                  <option key={m} value={String(i + 1)}>{m}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-xl px-3 py-3.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="ALL">{language === 'bn' ? 'সব বছর' : 'All Years'}</option>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List of categories */}
          {Object.entries(pendingByCategoryFiltered).map(([key, value]: [string, any], index: number) => {
            const { icon: Icon, color, bg } = getCategoryIcon(key);
            const isGoldenCategory = ['SALARY', 'COMMISSION', 'FRIDAY', 'BONUS', 'VEHICLE INSPECTION', 'OTHERS'].includes(key.trim().toUpperCase());
            return (
              <div 
                key={key} 
                onClick={() => handleCategoryClick(key)}
                className={`bg-card-bg backdrop-blur-md p-5 rounded-[10px] shadow-sm flex justify-between items-center animate-fade-in cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  border: isGoldenCategory ? '2.5px solid #D4AF37' : '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: bg, color: color }}
                  >
                    <Icon size={18} />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-tight text-text-muted`}>{key}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-semibold text-text-main`}>{`${currency.code} ${value.toLocaleString()}`}</span>
                  <ChevronRight size={16} className="text-text-muted opacity-50" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      
      {selectedCategory && createPortal(
            <div
              key="monthly-file-selected-category-pending"
              className={`fixed inset-0 z-[100] flex flex-col tms-page-enter-fwd ${isDark ? 'dark' : ''}`}
              style={{ 
                backgroundColor: isDark ? '#000000' : (backgroundColor || '#f1f5f9'),
                background: isDark ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg, #f1f5f9)')) 
              }}
            >
              <div 
                className="flex-none shadow-md safe-top"
                style={{ 
                  background: 'var(--header-bg)'
                }}
              >
                <div className="h-14 flex items-center justify-between px-4 w-full gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button 
                      onClick={() => {
                        setNavigationDirection('backward');
                        setSelectedCategory(null);
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

            <div className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-[140px] safe-bottom">
              {/* 1. Category Summary Card */}
              {(() => {
                const cardDetails = getCategoryCardDetails(selectedCategory);
                const CardIcon = cardDetails.icon;
                return (
                  <div className={`rounded-[10px] p-5 text-white shadow-lg relative overflow-hidden ${cardDetails.gradient}`}>
                    <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-4 translate-y-4">
                      <CardIcon size={120} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-wider opacity-85 mb-1">
                      {language === 'bn' ? `${cardDetails.label} সামারি` : `${cardDetails.label} Summary`}
                    </p>
                    <h2 className="text-3xl font-black font-sans tracking-tight">
                      {`${currency.code} ${detailTotalSum.toLocaleString()}`}
                    </h2>
                    <div className="mt-2.5 h-px bg-white/20 w-full" />
                    <p className="text-[9px] opacity-75 font-bold mt-1">
                      {language === 'bn' ? 'ফিল্টার অনুযায়ী সর্বমোট' : 'Total based on active filters'}
                    </p>
                  </div>
                );
              })()}

              {/* 2. Detail Month and Year Filters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <select
                    value={detailFilterMonth}
                    onChange={(e) => setDetailFilterMonth(e.target.value)}
                    className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">{language === 'bn' ? 'সব মাস' : 'All Months'}</option>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                      <option key={m} value={String(i + 1)}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <select
                    value={detailFilterYear}
                    onChange={(e) => setDetailFilterYear(e.target.value)}
                    className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-xl px-3 py-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="ALL">{language === 'bn' ? 'সব বছর' : 'All Years'}</option>
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Pending History heading */}
              <div className="pt-2 mb-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-main">
                  {language === 'bn' ? 'পেন্ডিং হিস্টোরি' : 'Pending History'}
                </h4>
              </div>

              {/* List of items */}
              {filteredCategoryItemsFinal.length === 0 ? (
                <div className="text-center py-12 text-text-main bg-card-bg/30 rounded-xl border border-dashed border-black/10 dark:border-white/10">
                  <AlertCircle size={40} className="mx-auto mb-3 opacity-20 text-text-main" />
                  <p className="text-xs font-bold uppercase tracking-wide">
                    {language === 'bn' ? 'কোনো রেকর্ড পাওয়া যায়নি' : `No records found for ${selectedCategory}`}
                  </p>
                </div>
              ) : (
                (() => {
                  let displayItems: any[] = filteredCategoryItemsFinal;

                  if (selectedCategory?.toUpperCase() === 'TRIP DIESEL') {
                     const groupedTripDues: Record<string, any> = {};
                     filteredCategoryItemsFinal.forEach(item => {
                        const tripId = item.id.includes('-') ? item.id.substring(0, item.id.lastIndexOf('-')) : item.id;
                        const foundTrip = trips?.find((t: any) => String(t.id) === String(tripId)) || item.trip || item.details?.trip;
                        if (!groupedTripDues[tripId]) {
                           groupedTripDues[tripId] = {
                              tripId,
                              trip: foundTrip,
                              companyName: item.details?.companyName || foundTrip?.companyName || 'Unknown Company',
                              date: item.date || foundTrip?.loadingDate,
                              containerNumber: item.details?.containerNumber || foundTrip?.containerNumber || item.details?.vehicleNumber || foundTrip?.vehicleNumber || 'N/A',
                              deliveryPlace: item.details?.deliveryPlace || foundTrip?.deliveryPlace || 'N/A',
                              diesels: {},
                              totalPending: 0
                           };
                        }
                        if (item.details?.subType) {
                           if (item.details?.subType !== "generatorDiesel") { groupedTripDues[tripId].diesels[item.details.subType] = Number(item.pending) || 0; }
                        } else {
                           groupedTripDues[tripId].diesels['dieselPrice'] = (groupedTripDues[tripId].diesels['dieselPrice'] || 0) + (Number(item.pending) || 0);
                        }
                        if (item.details?.subType !== "generatorDiesel") { groupedTripDues[tripId].totalPending += Number(item.pending) || 0; }
                     });

                     return Object.values(groupedTripDues).map((group, index) => {
                        const formattedDate = group.date && group.date !== 'N/A' 
                          ? new Date(group.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') 
                          : 'N/A';

                        const targetTrip = group.trip || trips?.find((t: any) => String(t.id) === String(group.tripId)) || {
                          id: group.tripId,
                          companyName: group.companyName,
                          loadingDate: group.date,
                          containerNumber: group.containerNumber,
                          deliveryPlace: group.deliveryPlace,
                          dieselPrice: group.diesels['dieselPrice'] || 0,
                          extraDiesel: group.diesels['extraDiesel'] || 0,
                          bonus: group.diesels['bonus'] || 0,
                          totalAmount: group.totalPending,
                          paidAmount: 0,
                          payments: []
                        };

                        return (
                          <div 
                            key={group.tripId || index} 
                            onClick={() => {
                              setSelectedTripDetailsPopup({
                                ...group,
                                trip: targetTrip,
                                formattedDate
                              });
                            }}
                            className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all cursor-pointer active:scale-[0.99]"
                          >
                             {/* Far Left: Clock Pending Icon */}
                             <div className="w-10 h-10 rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                               <Clock size={20} strokeWidth={2.5} className="animate-pulse" />
                             </div>

                             {/* Left/Center: Information */}
                             <div className="flex-1 min-w-0 flex flex-col text-left font-sans text-xs">
                                 {/* Row 1: Title (Trip Diesel) & Pending Badge */}
                                 <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                                    <span className="text-sm font-black text-text-main">
                                      {language === 'bn' ? 'ট্রিপ ডিজেল' : 'Trip Diesel'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                      <Clock size={10} className="animate-pulse shrink-0" />
                                      {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                    </span>
                                 </div>

                                 {/* Info Table with aligned colon column */}
                                 <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                    <span className="text-text-muted font-medium whitespace-nowrap">
                                      {language === 'bn' ? 'কন্টেইনার নম্বর' : 'Container Number'}
                                    </span>
                                    <span className="text-text-muted font-medium">:</span>
                                    <span className="font-bold text-text-main truncate">{group.containerNumber}</span>

                                    <span className="text-text-muted font-medium whitespace-nowrap">
                                      {language === 'bn' ? 'লোডিং ডেট' : 'Loading Date'}
                                    </span>
                                    <span className="text-text-muted font-medium">:</span>
                                    <span className="font-bold text-text-main truncate">{formattedDate}</span>
                                 </div>
                             </div>

                             {/* Right Side: Centered Amount */}
                             <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                                <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                   {group.totalPending.toLocaleString()} {currency.code}
                                </span>
                             </div>
                          </div>
                        );
                     });
                  }

                  if (selectedCategory?.toUpperCase() === 'SALARY') {
                     const groupedMonthlyDues: Record<string, any> = {};
                     filteredCategoryItemsFinal.forEach(item => {
                        const month = item.month || currentFile?.month;
                        const year = item.year || currentFile?.year;
                        const groupId = `${month}-${year}`;
                        if (!groupedMonthlyDues[groupId]) {
                           groupedMonthlyDues[groupId] = {
                               groupId,
                               month,
                               year,
                               count: 0,
                               totalPending: 0
                           };
                        }
                        groupedMonthlyDues[groupId].count += 1;
                        groupedMonthlyDues[groupId].totalPending += (Number(item.pending) || 0);
                     });

                     return Object.values(groupedMonthlyDues).map((group, index) => {
                        const getFormattedPeriod = (m: any, y: any) => {
                          let mNum = Number(m);
                          let yNum = Number(y);
                          if (m == null || Number.isNaN(mNum)) {
                            if (currentFile?.month) mNum = Number(currentFile.month);
                          }
                          if (y == null || Number.isNaN(yNum)) {
                            if (currentFile?.year) yNum = Number(currentFile.year);
                          }
                          const monthNames = [
                            "January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"
                          ];
                          const mName = (!Number.isNaN(mNum) && mNum >= 1 && mNum <= 12) ? monthNames[mNum - 1] : (currentFile?.monthName || 'August');
                          const fullYear = !Number.isNaN(yNum) && yNum > 0 ? (String(yNum).length === 2 ? `20${yNum}` : String(yNum)) : (currentFile?.year ? String(currentFile.year) : '2026');
                          return `${mName}-${fullYear}`;
                        };

                        return (
                          <div 
                            key={group.groupId || index} 
                            className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all"
                          >
                             {/* Far Left: Clock Pending Icon */}
                             <div className="w-10 h-10 rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                               <Clock size={20} strokeWidth={2.5} className="animate-pulse" />
                             </div>

                             {/* Left/Center: Information */}
                             <div className="flex-1 min-w-0 flex flex-col text-left font-sans text-xs">
                                 {/* Row 1: Title (Salary) & Pending Badge */}
                                 <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                                    <span className="text-sm font-black text-text-main">
                                      {language === 'bn' ? 'সেলারী' : 'Salary'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                      <Clock size={10} className="animate-pulse shrink-0" />
                                      {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                    </span>
                                 </div>

                                 {/* Info Table with aligned colon column */}
                                 <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                    <span className="text-text-muted font-medium whitespace-nowrap">Source of Income</span>
                                    <span className="text-text-muted font-medium">:</span>
                                    <span className="font-bold text-text-main truncate">Salary</span>

                                    <span className="text-text-muted font-medium whitespace-nowrap">Salary for</span>
                                    <span className="text-text-muted font-medium">:</span>
                                    <span className="font-bold text-text-main truncate">{getFormattedPeriod(group.month, group.year)}</span>
                                 </div>
                             </div>

                             {/* Right Side: Centered Amount */}
                             <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                                <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                   {group.totalPending.toLocaleString()} {currency.code}
                                </span>
                             </div>
                          </div>
                        );
                     });
                  }

                  if (selectedCategory?.toUpperCase() === 'COMMISSION') {
                     const groupedMonthlyDues: Record<string, any> = {};
                     filteredCategoryItemsFinal.forEach(item => {
                        const month = item.month;
                        const year = item.year;
                        const groupId = `${month}-${year}`;
                        if (!groupedMonthlyDues[groupId]) {
                           groupedMonthlyDues[groupId] = {
                               groupId,
                               month,
                               year,
                               count: 0,
                               totalPending: 0
                           };
                        }
                        groupedMonthlyDues[groupId].count += 1;
                        groupedMonthlyDues[groupId].totalPending += (Number(item.pending) || 0);
                     });

                     return Object.values(groupedMonthlyDues).map((group, index) => {
                        const getFormattedPeriod = (m: any, y: any) => {
                          let mNum = Number(m);
                          let yNum = Number(y);
                          if (m == null || Number.isNaN(mNum)) {
                            if (currentFile?.month) mNum = Number(currentFile.month);
                          }
                          if (y == null || Number.isNaN(yNum)) {
                            if (currentFile?.year) yNum = Number(currentFile.year);
                          }
                          const monthNames = [
                            "January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"
                          ];
                          const mName = (!Number.isNaN(mNum) && mNum >= 1 && mNum <= 12) ? monthNames[mNum - 1] : (currentFile?.monthName || 'August');
                          const fullYear = !Number.isNaN(yNum) && yNum > 0 ? (String(yNum).length === 2 ? `20${yNum}` : String(yNum)) : (currentFile?.year ? String(currentFile.year) : '2026');
                          return `${mName}-${fullYear}`;
                        };
                        
                        const formattedPeriod = getFormattedPeriod(group.month, group.year);

                        return (
                          <div 
                            key={group.groupId || index} 
                            className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all"
                          >
                             {/* Far Left: Clock Pending Icon */}
                             <div className="w-10 h-10 rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                               <Clock size={20} strokeWidth={2.5} className="animate-pulse" />
                             </div>

                             {/* Left/Center: Information */}
                             <div className="flex-1 min-w-0 flex flex-col text-left font-sans text-xs">
                                 {/* Row 1: Title (Commission) & Pending Badge */}
                                 <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                                    <span className="text-sm font-black text-text-main">
                                      {language === 'bn' ? 'কমিশন' : 'Commission'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                      <Clock size={10} className="animate-pulse shrink-0" />
                                      {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                    </span>
                                 </div>

                                 {/* Info Table with aligned colon column */}
                                 <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                    <span className="text-text-muted font-medium whitespace-nowrap">
                                      {language === 'bn' ? 'কমিশন মাস' : 'Commission for'}
                                    </span>
                                    <span className="text-text-muted font-medium">:</span>
                                    <span className="font-bold text-text-main truncate">{formattedPeriod}</span>

                                    <span className="text-text-muted font-medium whitespace-nowrap">
                                      {language === 'bn' ? 'মোট ট্রিপ' : 'Total Trip'}
                                    </span>
                                    <span className="text-text-muted font-medium">:</span>
                                    <span className="font-bold text-text-main truncate">{group.count}</span>
                                 </div>
                             </div>

                             {/* Right Side: Centered Amount */}
                             <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                                <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                   {group.totalPending.toLocaleString()} {currency.code}
                                </span>
                             </div>
                          </div>
                        );
                     });
                  }

                  // Default rendering for other categories (Vehicle Inspection, Extra Fuel, Bonus, Friday, Overtime, Advance, Others, etc.)
                  return displayItems.map((item, index) => {
                    const isVehicleInspection = selectedCategory === 'Vehicle Inspection' || selectedCategory?.toUpperCase() === 'EXTRA FUEL' || selectedCategory?.toUpperCase() === 'EXTRA_FUEL';

                    // Extract Dynamic Category Title
                    const dynamicCategoryTitle = (() => {
                      if (isVehicleInspection) {
                        return language === 'bn' ? 'যানবাহন পরিদর্শন' : 'Vehicle Inspection';
                      }
                      if (item.details?.subType === 'dieselPrice') return language === 'bn' ? 'ট্রিপ ডিজেল' : 'Trip Diesel';
                      if (item.details?.subType === 'generatorDiesel') return language === 'bn' ? 'জেনারেটর ডিজেল' : 'Generator Diesel';
                      if (item.details?.subType === 'extraDiesel') return language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel';
                      if (item.details?.subType === 'bonus') return language === 'bn' ? 'বোনাস' : 'Bonus';
                      if (item.details?.subType === 'friday') return language === 'bn' ? 'ফ্রাইডে বিল' : 'Friday Allowance';
                      if (item.details?.subType === 'overtime') return language === 'bn' ? 'ওভারটাইম' : 'Overtime';
                      if (item.details?.subType === 'advance') return language === 'bn' ? 'অ্যাডভান্স' : 'Advance';
                      if (item.label && !/^\d{13}$/.test(item.label)) return item.label;
                      return selectedCategory || (language === 'bn' ? 'পেন্ডিং আইটেম' : 'Pending Item');
                    })();

                    const companyName = item.details?.companyName && item.details.companyName !== 'N/A' 
                        ? item.details.companyName 
                        : (item.details?.containerNumber && item.details.containerNumber !== 'N/A'
                          ? item.details.containerNumber
                          : (item.details?.invoiceNumber && item.details.invoiceNumber !== 'N/A'
                            ? item.details.invoiceNumber
                            : (item.label && !/^\d{13}$/.test(item.label) ? item.label : selectedCategory || 'N/A')));

                    const formattedDate = item.date && item.date !== 'N/A'
                        ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
                        : (item.details?.loadingDate || item.details?.period || 'N/A');

                    const containerOrVehicle = item.details?.containerNumber && item.details.containerNumber !== 'N/A' 
                        ? item.details.containerNumber 
                        : (item.details?.vehicleNumber && item.details.vehicleNumber !== 'N/A' ? item.details.vehicleNumber : null);

                    const deliveryOrType = item.details?.deliveryPlace && item.details.deliveryPlace !== 'N/A'
                        ? item.details.deliveryPlace
                        : (item.details?.vehicleType && item.details.vehicleType !== 'N/A' ? item.details.vehicleType : null);

                    return (
                      <div 
                        key={item.id || index} 
                        className={`bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all ${isVehicleInspection ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (isVehicleInspection) {
                            setSelectedVehicleInspectionItem(item);
                          }
                        }}
                      >
                         {/* Far Left: Clock Pending Icon */}
                         <div className="w-10 h-10 rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                           <Clock size={20} strokeWidth={2.5} className="animate-pulse" />
                         </div>

                         {/* Left/Center: Information */}
                         <div className="flex-1 min-w-0 flex flex-col text-left font-sans text-xs">
                             {/* Row 1: Dynamic Title & Pending Badge */}
                             <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                                <span className="text-sm font-black text-text-main truncate">
                                  {dynamicCategoryTitle}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                                  <Clock size={10} className="animate-pulse shrink-0" />
                                  {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                </span>
                             </div>

                             {/* Info Table with aligned colon column */}
                             <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                <span className="text-text-muted font-medium whitespace-nowrap">
                                  {isVehicleInspection ? (language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number') : (language === 'bn' ? 'উৎস' : 'Source Name')}
                                </span>
                                <span className="text-text-muted font-medium">:</span>
                                <span className="font-bold text-text-main truncate">
                                  {isVehicleInspection ? (item.details?.vehicleNumber || item.vehicleNumber || 'N/A') : companyName}
                                </span>

                                <span className="text-text-muted font-medium whitespace-nowrap">
                                  {isVehicleInspection ? (language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date') : (language === 'bn' ? 'তারিখ' : 'Date / For')}
                                </span>
                                <span className="text-text-muted font-medium">:</span>
                                <span className="font-bold text-text-main truncate">{formattedDate}</span>

                                {containerOrVehicle && !isVehicleInspection && (
                                  <>
                                    <span className="text-text-muted font-medium whitespace-nowrap">Container / Vehicle</span>
                                    <span className="text-text-muted font-medium">:</span>
                                    <span className="font-bold text-text-main truncate">{containerOrVehicle}</span>
                                  </>
                                )}

                                {deliveryOrType && (
                                  <>
                                    <span className="text-text-muted font-medium whitespace-nowrap">
                                      {isVehicleInspection ? (language === 'bn' ? 'ভেইকেল টাইপ' : 'Vehicle Type') : (language === 'bn' ? 'ডেলিভারি প্লেস' : 'Delivery Place')}
                                    </span>
                                    <span className="text-text-muted font-medium">:</span>
                                    <span className="font-bold text-text-main truncate">{deliveryOrType}</span>
                                  </>
                                )}
                             </div>
                         </div>

                         {/* Right Side: Centered Amount */}
                         <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                            <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                               {(Number(item.pending) || 0).toLocaleString()} {currency.code}
                            </span>
                         </div>
                      </div>
                    );
                  });
                })()
              )}
              {/* Extra Safe-Area Spacer to prevent content from being covered by the bottom navigation bar */}
              <div className="h-44 sm:h-48 w-full shrink-0" />
            </div>
          </div>,
        document.body
      )}
      

      {selectedVehicleInspectionItem && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in" onClick={() => setSelectedVehicleInspectionItem(null)}>
          <div 
            className="bg-theme-card border border-black/5 dark:border-white/10 rounded-[10px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                  {language === 'bn' ? 'যানবাহন পরিদর্শন' : 'Vehicle Inspection'}
                </span>
                <h3 className="text-base font-black text-text-main truncate mt-1">
                  {selectedVehicleInspectionItem.label || selectedVehicleInspectionItem.details?.extraDieselReason || selectedVehicleInspectionItem.details?.note || (language === 'bn' ? 'এক্সট্রা ফিউল' : 'Extra Fuel')}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedVehicleInspectionItem(null)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left bg-theme-card">
              {/* Trip Metadata */}
              <div className="rounded-2xl p-4 space-y-2 border bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10 text-zinc-950 dark:text-text-main">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date'}</span>
                  <span className="font-bold">
                    {selectedVehicleInspectionItem.date ? new Date(selectedVehicleInspectionItem.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                
                <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}</span>
                  <span className="font-bold">
                    {selectedVehicleInspectionItem.details?.vehicleNumber || selectedVehicleInspectionItem.vehicleNumber || 'N/A'}
                  </span>
                </div>
                <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'ভেইকেল টাইপ' : 'Vehicle Type'}</span>
                  <span className="font-bold">
                    {selectedVehicleInspectionItem.details?.deliveryPlace || selectedVehicleInspectionItem.details?.vehicleType || 'N/A'}
                  </span>
                </div>
                {selectedVehicleInspectionItem.details?.extraDieselReason && (
                  <>
                    <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel'}</span>
                      <span className="font-bold">
                        {selectedVehicleInspectionItem.details.extraDieselReason}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Sub-items List */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block mb-1">
                  {language === 'bn' ? 'বকেয়া আইটেম সমূহ' : 'Dues Sub-items'}
                </span>
                
                {/* Outstanding Details Box */}
                <div className="rounded-2xl p-4 border flex items-center justify-between gap-3 bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-4 h-4 rounded-full border-2 border-orange-500 bg-orange-500 flex items-center justify-center shrink-0 text-white animate-pulse">
                      <Clock size={10} strokeWidth={4} />
                    </div>
                    <span className="text-xs font-black text-text-main block truncate leading-tight">
                      {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                    </span>
                  </div>
                  <span className="font-extrabold text-xs text-rose-500 dark:text-rose-400">
                    {Number(selectedVehicleInspectionItem.pending || 0).toLocaleString()} {currency.code}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedTripDetailsPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in" onClick={() => setSelectedTripDetailsPopup(null)}>
          <div 
            className="bg-theme-card border border-black/5 dark:border-white/10 rounded-[10px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                  {language === 'bn' ? 'ট্রিপ ডিজেল বিবরণ' : 'Trip Diesel Details'}
                </span>
                <h3 className="text-base font-black text-text-main truncate mt-1">
                  {selectedTripDetailsPopup.containerNumber && selectedTripDetailsPopup.containerNumber !== 'N/A'
                    ? selectedTripDetailsPopup.containerNumber
                    : (selectedTripDetailsPopup.companyName || (language === 'bn' ? 'ট্রিপ বিবরণ' : 'Trip Details'))}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTripDetailsPopup(null)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left bg-theme-card">
              {/* Trip Information Box */}
              <div className="rounded-2xl p-4 space-y-2 border bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10 text-zinc-950 dark:text-text-main">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'কন্টেইনার নম্বর' : 'Container Number'}</span>
                  <span className="font-bold">{selectedTripDetailsPopup.containerNumber || 'N/A'}</span>
                </div>
                
                <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'কোম্পানি' : 'Company'}</span>
                  <span className="font-bold">{selectedTripDetailsPopup.companyName || 'N/A'}</span>
                </div>
                
                <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'লোডিং ডেট' : 'Loading Date'}</span>
                  <span className="font-bold">{selectedTripDetailsPopup.formattedDate || 'N/A'}</span>
                </div>

                {selectedTripDetailsPopup.deliveryPlace && selectedTripDetailsPopup.deliveryPlace !== 'N/A' && (
                  <>
                    <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'ডেলিভারি প্লেস' : 'Delivery Place'}</span>
                      <span className="font-bold">{selectedTripDetailsPopup.deliveryPlace}</span>
                    </div>
                  </>
                )}

                {(selectedTripDetailsPopup.trip?.vehicleNumber && selectedTripDetailsPopup.trip.vehicleNumber !== 'N/A') && (
                  <>
                    <div className="h-px my-1 bg-zinc-300/60 dark:bg-white/10" />
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-600 dark:text-text-muted">{language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}</span>
                      <span className="font-bold">{selectedTripDetailsPopup.trip.vehicleNumber}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Diesel Breakdown Items */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block mb-1">
                  {language === 'bn' ? 'ডিজেল ও বকেয়ার বিবরণ' : 'Diesel & Allowance Breakdown'}
                </span>

                {selectedTripDetailsPopup.diesels?.['dieselPrice'] > 0 && (
                  <div className="rounded-xl p-3 border flex items-center justify-between gap-3 bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10">
                    <span className="text-xs font-bold text-text-main">
                      {language === 'bn' ? 'ট্রিপ ডিজেল' : 'Trip Diesel'}
                    </span>
                    <span className="font-black text-xs text-text-main">
                      {selectedTripDetailsPopup.diesels['dieselPrice'].toLocaleString()} {currency.code}
                    </span>
                  </div>
                )}

                {selectedTripDetailsPopup.diesels?.['extraDiesel'] > 0 && (
                  <div className="rounded-xl p-3 border flex items-center justify-between gap-3 bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10">
                    <span className="text-xs font-bold text-text-main">
                      {language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel'}
                    </span>
                    <span className="font-black text-xs text-text-main">
                      {selectedTripDetailsPopup.diesels['extraDiesel'].toLocaleString()} {currency.code}
                    </span>
                  </div>
                )}

                {selectedTripDetailsPopup.diesels?.['friday'] > 0 && (
                  <div className="rounded-xl p-3 border flex items-center justify-between gap-3 bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10">
                    <span className="text-xs font-bold text-text-main">
                      {language === 'bn' ? 'শুক্রবার বিল' : 'Friday'}
                    </span>
                    <span className="font-black text-xs text-text-main">
                      {selectedTripDetailsPopup.diesels['friday'].toLocaleString()} {currency.code}
                    </span>
                  </div>
                )}

                {selectedTripDetailsPopup.diesels?.['bonus'] > 0 && (
                  <div className="rounded-xl p-3 border flex items-center justify-between gap-3 bg-[#ebebeb] dark:bg-[#252525] border-zinc-300 dark:border-white/10">
                    <span className="text-xs font-bold text-text-main">
                      {language === 'bn' ? 'বোনাস' : 'Bonus'}
                    </span>
                    <span className="font-black text-xs text-text-main">
                      {selectedTripDetailsPopup.diesels['bonus'].toLocaleString()} {currency.code}
                    </span>
                  </div>
                )}
              </div>

              {/* Total Pending Balance Box */}
              <div className="rounded-2xl p-4 border flex items-center justify-between gap-3 bg-amber-500/10 border-amber-500/20">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0 text-white animate-pulse">
                    <Clock size={12} strokeWidth={3} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-700 dark:text-amber-300 block leading-tight">
                      {language === 'bn' ? 'মোট পেন্ডিং ব্যালেন্স' : 'Total Pending Balance'}
                    </span>
                  </div>
                </div>
                <span className="font-black text-sm sm:text-base text-orange-500 dark:text-orange-400">
                  {(selectedTripDetailsPopup.totalPending || 0).toLocaleString()} {currency.code}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/5 dark:border-white/5 flex items-center gap-3 bg-black/[0.02] dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setSelectedTripDetailsPopup(null)}
                className="flex-1 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main text-xs font-black uppercase rounded-xl transition-all"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const MonthlyFileDetails: React.FC = () => {
  const { language, currentFile, setView, trips, currencies, selectedCurrency, setEditingTrip, updateTrip, removeTrip, showFeedback, addPayment, payments, theme, wallpaper, backgroundColor, setIsLoadingView, isNightMode, appThemeMode, selectedTrip, setSelectedTrip, monthlyFiles, setCurrentFile, addMonthlyFile, isDarkMode: storeIsDarkMode, confirmAction, user } = useStore();
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';
  const isDark = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode !== 'light';
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');
  const nav = useNavigation();

  useEffect(() => {
    return () => {
      nav.clear();
    };
  }, []);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showPendingBreakdownPage, setShowPendingBreakdownPage] = useState(false);
  const [showAvailableBalancePage, setShowAvailableBalancePage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mainVisible, setMainVisible] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);

  const [isEditingExtraFuel, setIsEditingExtraFuel] = useState(false);
  const [extraFuelForm, setExtraFuelForm] = useState({
    loadingDate: '',
    vehicleNumber: '',
    deliveryPlace: '',
    companyName: '',
    extraDieselReason: '',
    extraDiesel: 0
  });

  useEffect(() => {
    if (selectedTrip && selectedTrip.category === 'EXTRA_FUEL') {
      setExtraFuelForm({
        loadingDate: selectedTrip.loadingDate || '',
        vehicleNumber: selectedTrip.vehicleNumber || '',
        deliveryPlace: selectedTrip.deliveryPlace || '',
        companyName: selectedTrip.companyName || '',
        extraDieselReason: selectedTrip.extraDieselReason || '',
        extraDiesel: Number(selectedTrip.extraDiesel) || 0
      });
      setIsEditingExtraFuel(false);
    }
  }, [selectedTrip]);

  const handleSaveExtraFuelEdit = () => {
    if (!selectedTrip) return;
    if (!extraFuelForm.loadingDate || !extraFuelForm.vehicleNumber || !extraFuelForm.deliveryPlace || !extraFuelForm.companyName || !extraFuelForm.extraDiesel) {
      showFeedback(language === 'bn' ? 'সবগুলো ঘর পূরণ করুন' : 'Please fill all fields', 'error');
      return;
    }
    const amt = Number(extraFuelForm.extraDiesel);
    if (isNaN(amt) || amt <= 0) {
      showFeedback(language === 'bn' ? 'দয়া করে সঠিক অ্যামাউন্ট লিখুন।' : 'Please enter a valid amount.', 'error');
      return;
    }

    const updatedTrip: any = {
      ...selectedTrip,
      loadingDate: extraFuelForm.loadingDate,
      vehicleNumber: extraFuelForm.vehicleNumber.toUpperCase(),
      deliveryPlace: extraFuelForm.deliveryPlace,
      companyName: extraFuelForm.companyName,
      extraDieselReason: extraFuelForm.extraDieselReason,
      extraDiesel: amt,
      totalAmount: amt,
      containerNumber: extraFuelForm.vehicleNumber.toUpperCase()
    };

    updateTrip(updatedTrip);
    setSelectedTrip(null);
    setIsEditingExtraFuel(false);
    showFeedback(language === 'bn' ? 'আপডেট সম্পন্ন হয়েছে' : 'Updated successfully', 'success');
  };

  const effectiveBg = useMemo(() => {
    if (isNightMode) return '#000000';
    if (backgroundColor) return backgroundColor;
    if (wallpaper) return '#000000';
    return appThemeMode === 'light' ? '#207E4A' : '#000000';
  }, [isNightMode, backgroundColor, wallpaper, appThemeMode]);

  const dynamicTextColor = useMemo(() => getContrastColor(effectiveBg), [effectiveBg]);

  if (!currentFile) return null;

  const handleMonthYearChange = (newMonth: number, newYear: number) => {
    const existingFile = monthlyFiles.find(f => f.userId === currentFile.userId && f.month === newMonth && f.year === newYear);
    if (existingFile) {
      setCurrentFile(existingFile);
    } else {
      const newFile: MonthlyFile = {
        id: `FILE-${Date.now()}`,
        userId: currentFile.userId,
        month: newMonth,
        year: newYear,
        status: 'OPEN',
        createdAt: new Date().toISOString()
      };
      addMonthlyFile(newFile);
      setCurrentFile(newFile);
    }
  };

  const handleDeleteTrip = (e: React.MouseEvent | null | undefined, tripId: string) => {
    if (e) e.stopPropagation();
    confirmAction('Are you sure you want to delete this trip?', () => {
      removeTrip(tripId);
      showFeedback('Trip deleted successfully');
    });
  };

  const handleRecordPayment = () => {
    if (!selectedTrip || !paymentAmount) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (isNaN(amount) || amount <= 0) return;

    const newPayment: Payment = {
      id: `PAY-${Date.now()}`,
      transactionId: `TXN-${Date.now()}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      type: 'INCOME',
      category: 'Trip Payment',
      method: 'CASH',
      details: { pendingItems: { [selectedTrip.id]: amount } },
      userId: 'USR1001',
      month: currentFile.month,
      year: currentFile.year,
      monthlyFileId: currentFile.id,
      status: 'PENDING'
    };

    addPayment(newPayment);

    const updatedTrip: Trip = {
      ...selectedTrip,
      payments: [...(selectedTrip.payments || []), newPayment]
    };

    updateTrip(updatedTrip);
    setSelectedTrip(updatedTrip);
    setPaymentAmount('');
    showFeedback('Payment recorded as pending');
  };

  const currency: Currency = currencies.find(c => c.code === selectedCurrency) || { symbol: '$', code: 'USD', name: 'US Dollar' };

  const fileTrips = trips.filter(t => t.fileId === currentFile.id);
  
  const isItemBelongsToCurrentFile = useCallback((key: string, fileTripIds: Set<string>) => {
    // If the key is exact tripId
    if (fileTripIds.has(key)) return true;
    
    // If the key is of style tripId-subKey (e.g., TRIP-123456-dieselPrice)
    if (key.includes('-')) {
      // See if any prefix is a valid tripId
      // trip IDs start with TRIP- or EF-
      if (key.startsWith('TRIP-') || key.startsWith('EF-')) {
        const index = key.lastIndexOf('-');
        if (index !== -1) {
          const potentialTripId = key.substring(0, index);
          if (fileTripIds.has(potentialTripId)) return true;
        }
      }
      
      // If the key is an aggregated item: AGG-commission-MF-timestamp-CompanyName
      if (key.startsWith('AGG-')) {
        return key.includes(currentFile.id);
      }
    }

    return false;
  }, [currentFile.id]);

  const totalIncome = useMemo(() => {
    const fileTripIds = new Set(fileTrips.map(t => t.id));
    const rawTotal = payments
      .filter(p => p.status === 'RECEIVED' && p.details?.pendingItems)
      .reduce((acc, p) => {
        const relevantAmount = Object.entries(p.details.pendingItems || {})
          .filter(([id]) => isItemBelongsToCurrentFile(id, fileTripIds))
          .reduce((sum, [_, amount]) => sum + (Number(amount) || 0), 0);
        return acc + relevantAmount;
      }, 0);
    return isNaN(rawTotal) ? 0 : rawTotal;
  }, [payments, fileTrips, isItemBelongsToCurrentFile]);

  const getTripDue = (trip: Trip) => {
    const dieselDue = (Number(trip.dieselPrice) || 0) - (Number(trip.dieselPaid) || 0);
    const commDue = (Number(trip.commission) || 0) - (Number(trip.commissionPaid) || 0);
    const fridayDue = (Number(trip.friday) || 0) - (Number(trip.fridayPaid) || 0);
    const bonusDue = (Number(trip.bonus) || 0) - (Number(trip.bonusPaid) || 0);
    const overtimeDue = (Number(trip.overtime) || 0) - (Number(trip.overtimePaid) || 0);
    const genDieselDue = (Number(trip.generatorDiesel || (trip as any).genDiesel) || 0) - (Number(trip.generatorDieselPaid || (trip as any).genDieselPaid) || 0);
    const extraDieselDue = (Number(trip.extraDiesel) || 0) - (Number(trip.extraDieselPaid) || 0);
    
    const total = Math.max(0, dieselDue) + Math.max(0, commDue) + Math.max(0, fridayDue) + 
           Math.max(0, bonusDue) + Math.max(0, overtimeDue) + 
           Math.max(0, extraDieselDue);
    return isNaN(total) ? 0 : total;
  };

  const totalCommDue = fileTrips.reduce((acc, trip) => acc + Math.max(0, (trip.commission || 0) - (trip.commissionPaid || 0)), 0);
  
  const incomeByCompany = useMemo(() => {
    const fileTripIds = new Set(fileTrips.map(t => t.id));
    const acc: Record<string, number> = {};
    
    payments
      .filter(p => p.status === 'RECEIVED' && p.details?.pendingItems)
      .forEach(p => {
        Object.entries(p.details.pendingItems || {}).forEach(([key, amount]) => {
          if (isItemBelongsToCurrentFile(key, fileTripIds)) {
            let company = 'Unknown';
            if (fileTripIds.has(key)) {
              const trip = fileTrips.find(t => t.id === key);
              company = trip?.companyName || 'Unknown';
            } else if (key.startsWith('TRIP-') || key.startsWith('EF-')) {
              const lastDash = key.lastIndexOf('-');
              if (lastDash !== -1) {
                const realTripId = key.substring(0, lastDash);
                const trip = fileTrips.find(t => t.id === realTripId);
                company = trip?.companyName || 'Unknown';
              }
            } else if (key.startsWith('AGG-')) {
              const separator = currentFile.id + '-';
              const index = key.indexOf(separator);
              if (index !== -1) {
                const escapedCompany = key.substring(index + separator.length);
                const matchingTrip = fileTrips.find(t => t.companyName.replace(/\s+/g, '_') === escapedCompany);
                company = matchingTrip?.companyName || escapedCompany.replace(/_/g, ' ');
              }
            }
            acc[company] = (acc[company] || 0) + (amount as number);
          }
        });
      });
    return acc;
  }, [payments, fileTrips, isItemBelongsToCurrentFile, currentFile.id]);

  const dueByCompany = useMemo(() => fileTrips.reduce((acc, trip) => {
    const company = trip.companyName || 'Unknown';
    const due = getTripDue(trip);
    if (due > 0) {
      acc[company] = (acc[company] || 0) + due;
    }
    return acc;
  }, {} as Record<string, number>), [fileTrips]);

  const commDueByCompany = fileTrips.reduce((acc, trip) => {
    const company = trip.companyName || 'Unknown';
    const due = (trip.commission || 0) - (trip.commissionPaid || 0);
    if (due > 0) {
      acc[company] = (acc[company] || 0) + due;
    }
    return acc;
  }, {} as Record<string, number>);

  const pendingByCategory = useMemo(() => {
    const breakdown: Record<string, number> = {
      'Salary': 0,
      'Commission': 0,
      'Friday': 0,
      'Bonus': 0,
      'Trip Diesel': 0,
      'Overtime': 0,
      'Vehicle Inspection': 0,
      'Others': 0,
    };
    
    // Add pending dues from PaymentManager
    const pendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments);
    const fileGroup = pendingDues.find(f => f.month === currentFile.month && f.year === currentFile.year);
    
    if (fileGroup) {
      fileGroup.categories.forEach((cat: any) => {
        let catName = cat.name;
        if (catName.toUpperCase() === 'EXTRA FUEL' || catName.toUpperCase() === 'EXTRA_FUEL') {
          catName = 'Vehicle Inspection';
        }
        const catPending = Number(cat.totalPending) || 0;
        
        // Find if there is an existing key that matches case-insensitively
        const matchingKey = Object.keys(breakdown).find(
          k => k.toLowerCase() === catName.toLowerCase()
        ) || catName;
        
        breakdown[matchingKey] = (breakdown[matchingKey] || 0) + catPending;
      });
    }
    
    return breakdown;
  }, [trips, monthlyFiles, payments, currentFile.month, currentFile.year]);

  const totalDue = useMemo(() => {
    const total = (Object.values(pendingByCategory) as number[]).reduce((sum: number, val: number) => sum + val, 0);
    return isNaN(total) ? 0 : total;
  }, [pendingByCategory]);

  const availableByCategory = useMemo(() => {
    const fileTripIds = new Set(fileTrips.map(t => t.id));
    const acc: Record<string, number> = {
      'Salary': 0,
      'Commission': 0,
      'Friday': 0,
      'Bonus': 0,
      'Trip Diesel': 0,
      'Overtime': 0,
      'Vehicle Inspection': 0
    };

    payments
      .filter(p => p.status === 'RECEIVED' && p.details?.pendingItems)
      .forEach(p => {
        let category = p.category || 'General Income';
        if (category.toUpperCase() === 'EXTRA FUEL' || category.toUpperCase() === 'EXTRA_FUEL') {
          category = 'Vehicle Inspection';
        }
        const relevantAmount = Object.entries(p.details.pendingItems || {})
          .filter(([id]) => isItemBelongsToCurrentFile(id, fileTripIds))
          .reduce((sum, [_, amount]) => sum + (amount as number), 0);
        
        if (relevantAmount > 0) {
          const matchingKey = Object.keys(acc).find(
            k => k.toLowerCase() === category.toLowerCase()
          ) || category;
          acc[matchingKey] = (acc[matchingKey] || 0) + relevantAmount;
        }
      });
    return acc;
  }, [payments, fileTrips, isItemBelongsToCurrentFile]);

  const filteredTrips = fileTrips.filter(trip => 
    trip.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.containerNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trip.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-28 space-y-4 w-full px-1 sm:px-2 monthly-file-details-container">
       
      

      {mainVisible && (
        <>
      <div 
        className="relative overflow-hidden rounded-[10px] p-5 min-h-[190px] md:min-h-[220px] flex flex-col justify-between text-white shadow-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] border border-white/10 mb-3"
      >
        {/* Visual accents */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-400/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-[80px]"></div>

        <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between">
          {/* Top Row: Selectors & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsMonthSelectOpen(true)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white  border border-white/10 backdrop-blur-md flex items-center gap-1.5 active:scale-95 shadow-lg"
              >
                <span>{["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][currentFile.month - 1]}</span>
                <ChevronDown size={10} className="text-white/70" />
              </button>

              <button
                type="button"
                onClick={() => setIsYearSelectOpen(true)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 active:scale-95 shadow-lg"
              >
                <span>{currentFile.year}</span>
                <ChevronDown size={10} className="text-white/70" />
              </button>

              <GlobalFullscreenSelect
                isOpen={isYearSelectOpen}
                onClose={() => setIsYearSelectOpen(false)}
                onSelect={(val) => {
                  handleMonthYearChange(currentFile.month, parseInt(val));
                  setIsYearSelectOpen(false);
                }}
                options={Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => ({ label: String(y), value: String(y) }))}
                title={currencies[0]?.code === 'BDT' || selectedCurrency?.code === 'BDT' ? 'বছর নির্বাচন করুন' : 'Select Year'}
                selectedValue={String(currentFile.year)}
                searchable={false}
              />

              <GlobalFullscreenSelect
                isOpen={isMonthSelectOpen}
                onClose={() => setIsMonthSelectOpen(false)}
                onSelect={(val) => {
                  handleMonthYearChange(parseInt(val), currentFile.year);
                  setIsMonthSelectOpen(false);
                }}
                options={["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => ({
                  label: m,
                  value: String(i + 1)
                }))}
                title={currencies[0]?.code === 'BDT' || selectedCurrency?.code === 'BDT' ? 'মাস নির্বাচন করুন' : 'Select Month'}
                selectedValue={String(currentFile.month)}
                searchable={false}
              />
            </div>
            
            <button 
              onClick={() => {}} // TODO: Implement export if needed
              className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
              title="Download Statement"
            >
              <Download size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Simplified Single Total Trip Summary Card */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-white/10 flex items-center justify-between">
              {/* Watermark Icon */}
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 pointer-events-none">
                <Truck size={90} strokeWidth={1.5} className="text-white" />
              </div>

              <div className="relative z-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-cyan-200">
                    {language === 'bn' ? 'মোট ট্রিপ' : 'TOTAL TRIP'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                    {filteredTrips.length}
                  </span>
                  <span className="text-xs font-bold text-white/70">
                    {language === 'bn' ? 'টি ট্রিপ' : 'Trips'}
                  </span>
                </div>
              </div>

              {/* Icon Container */}
              <div className="relative z-10 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                <Truck size={24} className="text-cyan-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
            
          <div className="flex items-center px-2 mt-0 mb-1.5 text-xs font-bold text-text-muted uppercase tracking-wider">
            <span>{language === 'bn' ? 'ট্রিপ হিস্ট্রি' : (language === 'ar' ? 'سجل الرحلات' : 'Trip History')}</span>
          </div>

          <div className="flex flex-col gap-3">
             {filteredTrips.map((trip) => {
               const isExtraFuel = trip.category === 'EXTRA_FUEL';
               const tripAmount = isExtraFuel 
                 ? (trip.extraDiesel || trip.totalAmount || 0)
                 : (trip.totalAmount || 0);
               const isCompleted = isExtraFuel 
                 ? ((trip.extraDieselPaid || 0) >= (trip.extraDiesel || 0) && (trip.extraDiesel || 0) > 0)
                 : (trip.status === 'COMPLETED' || trip.tariffStatus?.toLowerCase() === 'complete' || trip.tariffStatus?.toLowerCase() === 'completed');
               const statusText = (() => {
                 if (isExtraFuel) {
                   return isCompleted ? 'Paid' : 'Pending';
                 }
                 if (isCompleted) return 'Complete';
                 const raw = trip.tariffStatus || trip.status || 'Incomplete';
                 return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
               })();

               return (
                 <div 
                   key={trip.id} 
                   className="bg-[#FFFBF2] dark:bg-[#1A1A1A] py-1.5 px-4 rounded-[10px] flex items-center justify-between shadow-sm border-[1.5px] border-solid border-[#D4AF37] dark:border-white/10 cursor-pointer group min-h-[72px] relative"
                   onClick={() => {
                     setSelectedTrip(trip);
                   }}
                 >
                   <div className="flex items-center gap-4 flex-1 mr-2 min-w-0">
                     <div className="w-10 h-10 rounded-xl bg-[#F4EBE0] dark:bg-yellow-500/10 flex items-center justify-center text-[#8B5E3C] dark:text-yellow-400 shrink-0">
                       <Truck size={20} strokeWidth={2.5} />
                     </div>
                     <div className="overflow-hidden flex-1 min-w-0">
                       {isExtraFuel ? (
                         <>
                           <div className="flex items-center gap-2 mb-1 flex-wrap">
                             <h3 className="font-bold text-[12px] text-[#001F3F] dark:text-white transition-colors uppercase truncate">
                               {trip.extraDieselReason || (language === 'bn' ? 'এক্সট্রা ফিউল' : 'Extra Fuel')}
                             </h3>
                             <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                               isCompleted
                                 ? 'bg-[#004D2C] text-white border border-[#A67C52]'
                                 : 'bg-[#B45309] text-white border border-[#78350F]'
                             }`}>
                               {statusText}
                             </span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] text-[#2C3E50] dark:text-gray-300 font-bold border-y border-[#D4AF37] py-1 w-fit max-w-full">
                             <span className="truncate">{language === 'bn' ? 'ভেইকেল' : 'Vehicle'}: {trip.vehicleNumber || 'N/A'}</span>
                             <span className="text-[#D4AF37] shrink-0">|</span>
                             <span className="truncate">{language === 'bn' ? 'টাইপ' : 'Type'}: {trip.deliveryPlace || 'N/A'}</span>
                           </div>
                           <div className="mt-1.5 flex items-center gap-1">
                              <span className="text-[10px] text-[#A67C52] font-semibold">{language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date'}:</span>
                              <span className="text-[10px] text-[#8B5E3C] font-black">
                                {trip.loadingDate || trip.date ? (typeof (trip.loadingDate || trip.date) === 'string' ? (trip.loadingDate || trip.date).split('T')[0] : new Date(trip.loadingDate || trip.date).toISOString().split('T')[0]) : 'N/A'}
                              </span>
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="flex items-center gap-2 mb-1 flex-wrap">
                             <h3 className="font-bold text-[12px] text-[#001F3F] dark:text-white transition-colors uppercase truncate">
                               {trip.companyName || 'Unknown Customer'}
                             </h3>
                             <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                               isCompleted
                                 ? 'bg-[#004D2C] text-white border border-[#A67C52]'
                                 : 'bg-[#B45309] text-white border border-[#78350F]'
                             }`}>
                               {statusText}
                             </span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] text-[#2C3E50] dark:text-gray-300 font-bold border-y border-[#D4AF37] py-1 w-fit max-w-full">
                             <span className="truncate">C: {trip.containerNumber || 'N/A'}</span>
                             <span className="text-[#D4AF37] shrink-0">|</span>
                             <span className="truncate">{trip.invoiceNumber || 'N/A'}</span>
                           </div>
                           <div className="mt-1.5 flex items-center gap-1">
                              <span className="text-[10px] text-[#A67C52] font-semibold">Loading Date:</span>
                              <span className="text-[10px] text-[#8B5E3C] font-black">
                                {trip.loadingDate || trip.date ? (typeof (trip.loadingDate || trip.date) === 'string' ? (trip.loadingDate || trip.date).split('T')[0] : new Date(trip.loadingDate || trip.date).toISOString().split('T')[0]) : 'N/A'}
                              </span>
                           </div>
                         </>
                       )}
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2 shrink-0 ml-2">
                     <span className="text-[12px] sm:text-[13px] font-black font-mono text-[#001F3F] dark:text-white tracking-tight whitespace-nowrap">
                       {currency.code} {tripAmount.toLocaleString()}
                     </span>
                     <ChevronRight size={20} className="text-[#8B5E3C] transition-colors shrink-0" />
                   </div>
                 </div>
               );
             })}
          </div>
        </>
      )}

      {showBreakdown && (
        <BreakdownModal 
          title=""
          data={pendingByCategory}
          total={totalDue}
          onClose={() => setShowBreakdown(false)}
          colorClass={isDark ? "text-white" : "text-rose-500"}
          currency={currency}
        />
      )}

      {selectedTrip && selectedTrip.category === 'EXTRA_FUEL' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in">
          <div 
            className="bg-theme-card border border-black/5 dark:border-white/10 rounded-[10px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                  {(selectedTrip.category?.toUpperCase() === 'EXTRA FUEL' || selectedTrip.category?.toUpperCase() === 'EXTRA_FUEL') ? (language === 'bn' ? 'যানবাহন পরিদর্শন' : 'Vehicle Inspection') : (language === 'bn' ? 'সোর্স নাম' : 'Source Name')}
                </span>
                <h3 className="text-base font-black text-text-main truncate mt-1">
                  {isEditingExtraFuel 
                    ? (language === 'bn' ? 'তথ্য পরিবর্তন করুন' : 'Edit Inspection Details')
                    : ((selectedTrip.category?.toUpperCase() === 'EXTRA FUEL' || selectedTrip.category?.toUpperCase() === 'EXTRA_FUEL') ? (selectedTrip.deliveryPlace || selectedTrip.vehicleType || selectedTrip.companyName || 'N/A') : (selectedTrip.companyName || 'N/A'))}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTrip(null)}
                className={`p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors ${isDarkMode ? 'text-text-main' : 'text-zinc-600'}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            {isEditingExtraFuel ? (
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left bg-theme-card">
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold uppercase text-text-muted tracking-wider block mb-1.5">
                      {language === 'bn' ? 'সোর্স নাম / কোম্পানি' : 'Source Name / Company'}
                    </label>
                    <input
                      type="text"
                      value={extraFuelForm.companyName}
                      onChange={(e) => setExtraFuelForm(prev => ({ ...prev, companyName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-[8px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-text-muted tracking-wider block mb-1.5">
                      {language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date'}
                    </label>
                    <input
                      type="date"
                      value={extraFuelForm.loadingDate}
                      onChange={(e) => setExtraFuelForm(prev => ({ ...prev, loadingDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-[8px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-text-muted tracking-wider block mb-1.5">
                      {language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}
                    </label>
                    <input
                      type="text"
                      value={extraFuelForm.vehicleNumber}
                      onChange={(e) => setExtraFuelForm(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 rounded-[8px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-text-muted tracking-wider block mb-1.5">
                      {language === 'bn' ? 'ভেইকেল টাইপ' : 'Vehicle Type'}
                    </label>
                    <input
                      type="text"
                      value={extraFuelForm.deliveryPlace}
                      onChange={(e) => setExtraFuelForm(prev => ({ ...prev, deliveryPlace: e.target.value }))}
                      className="w-full px-3 py-2 rounded-[8px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-text-muted tracking-wider block mb-1.5">
                      {language === 'bn' ? 'কারণ' : 'Reason'}
                    </label>
                    <input
                      type="text"
                      value={extraFuelForm.extraDieselReason}
                      onChange={(e) => setExtraFuelForm(prev => ({ ...prev, extraDieselReason: e.target.value }))}
                      className="w-full px-3 py-2 rounded-[8px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-text-muted tracking-wider block mb-1.5">
                      {language === 'bn' ? 'অ্যামাউন্ট / বকেয়া পরিমাণ' : 'Amount / Outstanding'}
                    </label>
                    <input
                      type="number"
                      value={extraFuelForm.extraDiesel === 0 ? '' : extraFuelForm.extraDiesel}
                      onChange={(e) => setExtraFuelForm(prev => ({ ...prev, extraDiesel: Number(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-[8px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-sm font-semibold text-text-main focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left bg-theme-card">
                {/* Trip Metadata */}
                <div className={`rounded-2xl p-4 space-y-2 border ${isDarkMode ? 'bg-white/5 border-white/5 text-text-main' : 'bg-[#E8E8E8] border-zinc-300 text-zinc-950'}`}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'সোর্স নাম' : 'Source Name'}</span>
                    <span className="font-bold">
                      {selectedTrip.companyName || 'N/A'}
                    </span>
                  </div>
                  <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date'}</span>
                    <span className="font-bold">
                      {selectedTrip.loadingDate || 'N/A'}
                    </span>
                  </div>
                  
                  {/* No Container or Invoice Number for EXTRA_FUEL */}
                  
                  <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}</span>
                    <span className="font-bold">
                      {selectedTrip.vehicleNumber || 'N/A'}
                    </span>
                  </div>
                  <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'ভেইকেল টাইপ' : 'Vehicle Type'}</span>
                    <span className="font-bold">
                      {selectedTrip.deliveryPlace || 'N/A'}
                    </span>
                  </div>
                  {selectedTrip.extraDieselReason && (
                    <>
                      <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel'}</span>
                        <span className="font-bold">
                          {selectedTrip.extraDieselReason}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Sub-items List */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block mb-1">
                    {language === 'bn' ? 'বকেয়া আইটেম সমূহ' : 'Dues Sub-items'}
                  </span>
                  
                  {/* Outstanding Details Box */}
                  <div className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-[#E8E8E8] border-zinc-300'}`}>
                    {(() => {
                      const pendingAmount = (selectedTrip.extraDiesel || 0) - (selectedTrip.extraDieselPaid || 0);
                      const isPaid = pendingAmount <= 0;
                      return (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isPaid ? (
                              <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                                <Check size={10} strokeWidth={4} />
                              </div>
                            ) : (
                              <Clock size={16} className="text-orange-500 shrink-0" />
                            )}
                            <span className="text-xs font-black text-text-main block truncate leading-tight">
                              {isPaid 
                                ? (language === 'bn' ? 'পেইড' : 'Paid') 
                                : (language === 'bn' ? 'পেন্ডিং ব্যালেন্স' : 'Pending balance')}
                            </span>
                          </div>
                          <span className={`font-extrabold text-xs ${isPaid ? 'text-emerald-500' : 'text-rose-500 dark:text-rose-400'}`}>
                            {pendingAmount.toLocaleString()} {currency.code}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex gap-3">
              {isEditingExtraFuel ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingExtraFuel(false)}
                    className="flex-1 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main text-xs font-black uppercase rounded-2xl transition-all"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExtraFuelEdit}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-1.5"
                  >
                    {language === 'bn' ? 'আপডেট করুন' : 'Update'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setSelectedTrip(null)}
                    className="flex-1 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main text-xs font-black uppercase rounded-2xl transition-all"
                  >
                    {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingExtraFuel(true)}
                    className="py-2.5 px-4 rounded-2xl font-black text-xs bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={14} />
                    <span>{language === 'bn' ? 'এডিট' : 'Edit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      confirmAction(language === 'bn' ? 'আপনি কি এটি ডিলিট করতে চান?' : 'Are you sure you want to delete this?', () => {
                        removeTrip(selectedTrip.id);
                        setSelectedTrip(null);
                        showFeedback(language === 'bn' ? 'ডিলিট সম্পন্ন হয়েছে' : 'Deleted successfully', 'success');
                      });
                    }}
                    className="py-2.5 px-4 rounded-2xl font-black text-xs bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={14} />
                    <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedTrip && selectedTrip.category !== 'EXTRA_FUEL' && createPortal(
        <div className="smooth-slide-in fixed inset-0 z-[450] flex flex-col md:items-center md:justify-center md:p-8"
          style={{ 
            background: backgroundColor || (wallpaper 
              ? `url(${wallpaper}) center/cover no-repeat` 
              : 'var(--app-bg) fixed') 
          }}
        >
          <div 
            className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl bg-transparent md:rounded-lg shadow-2xl overflow-hidden flex flex-col"
          >
            <div 
              className="relative shadow-md z-10 safe-top shrink-0"
              style={{ 
                background: 'var(--header-bg)',
                color: 'var(--header-text)'
              }}
            >
              <div className="h-16 flex items-center px-4">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedTrip(null)} 
                    className="flex items-center justify-center transition-colors"
                    style={{ color: 'var(--header-text)' }}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h3 className="text-lg font-black uppercase tracking-widest" style={{ color: 'var(--header-text)' }}>Trip Details</h3>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-global pt-global space-y-6 pb-[140px] md:pb-6">
              
              {/* Card 1: Dates & Times */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100/80 dark:border-white/5 overflow-hidden flex flex-col relative w-full">
                {/* Top Section */}
                <div className="relative border-l-[6px] border-[#117651] p-5 flex flex-col bg-[#f0f9f4] dark:bg-emerald-950/20 border-b border-gray-100 dark:border-zinc-800">
                   {/* Street Map Background Watermark */}
                   <div className="absolute inset-0 pointer-events-none opacity-[0.22] dark:opacity-[0.35]" style={{ 
                     backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M0,15 L120,15 M0,55 L120,55 M0,95 L120,95 M20,0 L20,120 M70,0 L70,120 M110,0 L110,120' stroke='%23117651' stroke-width='1.5' fill='none'/%3E%3Cpath d='M-10,30 L130,105 M15,-10 L105,130' stroke='%23117651' stroke-width='1' stroke-dasharray='3,3' fill='none'/%3E%3Ccircle cx='45' cy='35' r='12' stroke='%23117651' stroke-width='1' fill='none'/%3E%3Cpath d='M50,85 A20,20 0 0,0 90,85' stroke='%23117651' stroke-width='1.2' fill='none'/%3E%3C/svg%3E")` 
                   }}></div>
                   
                   <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                     <div className="flex gap-3">
                       <Calendar size={18} className="text-[#117651] mt-0.5 shrink-0" />
                       <div className="flex flex-col">
                         <span className="text-[11px] text-[#117651] font-bold uppercase tracking-wider">Loading Date</span>
                         <span className="text-[15px] font-black text-gray-900 dark:text-white mt-0.5">{selectedTrip.loadingDate || '-'}</span>
                       </div>
                     </div>
                     <div className="flex gap-3">
                       <Clock size={18} className="text-[#117651] mt-0.5 shrink-0" />
                       <div className="flex flex-col">
                         <span className="text-[11px] text-[#117651] font-bold uppercase tracking-wider">Loading Time</span>
                         <span className="text-[15px] font-black text-gray-900 dark:text-white mt-0.5">{selectedTrip.loadingTime || '-'}</span>
                       </div>
                     </div>
                   </div>
                </div>

                {/* Bottom Section */}
                <div className="relative border-l-[6px] border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900/40 p-5 flex">
                   <div className="grid grid-cols-2 gap-4 w-full relative z-10">
                     <div className="flex gap-3">
                       <Calendar size={18} className="text-gray-400 mt-0.5 shrink-0" />
                       <div className="flex flex-col">
                         <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Delivery Date</span>
                         <span className="text-[15px] font-black text-gray-900 dark:text-white mt-0.5">{selectedTrip.deliveryDate || '-'}</span>
                       </div>
                     </div>
                     <div className="flex gap-3">
                       <Clock size={18} className="text-gray-400 mt-0.5 shrink-0" />
                       <div className="flex flex-col">
                         <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Delivery Time</span>
                         <span className="text-[15px] font-black text-gray-900 dark:text-white mt-0.5">{selectedTrip.deliveryTime || '-'}</span>
                       </div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Card 2: Origin & Destination */}
              <div className="bg-[#fcfdfd] dark:bg-zinc-900/90 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none p-6 relative overflow-hidden border-l-[6px] border-[#e7f7ed] dark:border-green-900/40 min-h-[140px]">
                {/* World Map Backdrop with Curved Shipping Routes */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.25] dark:opacity-35 z-0 flex items-center justify-center">
                  <svg className="w-full h-full min-w-[340px]" viewBox="0 0 340 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Outline stylized world continents */}
                    <path d="M15 25 C20 18, 30 14, 40 14 C50 14, 52 24, 62 20 C72 16, 82 24, 82 34 C78 44, 62 44, 52 54 C42 64, 25 54, 20 44 Z" fill="#93c5fd" opacity="0.35" stroke="#10b981" strokeWidth="0.8" />
                    <path d="M40 55 C50 55, 55 65, 50 75 C45 85, 40 95, 35 105 C30 115, 25 110, 20 95 C20 80, 30 70, 35 60 Z" fill="#93c5fd" opacity="0.35" stroke="#10b981" strokeWidth="0.8" />
                    <path d="M125 50 C135 40, 155 40, 165 50 C175 60, 170 75, 165 85 C155 95, 145 105, 135 95 C130 85, 125 75, 120 65 C120 55, 120 50, 125 50 Z" fill="#93c5fd" opacity="0.35" stroke="#10b981" strokeWidth="0.8" />
                    <path d="M120 25 C130 15, 150 10, 170 10 C190 10, 220 5, 240 10 C260 15, 270 25, 280 30 C290 35, 270 45, 260 40 C250 35, 230 40, 220 45 C200 50, 185 40, 170 45 C160 50, 150 50, 140 45 C130 40, 125 35, 120 25 Z" fill="#93c5fd" opacity="0.35" stroke="#10b981" strokeWidth="0.8" />
                    <path d="M240 85 C250 80, 265 80, 275 85 C285 90, 280 105, 270 105 C260 105, 250 100, 240 95 Z" fill="#93c5fd" opacity="0.35" stroke="#10b981" strokeWidth="0.8" />
                    <path d="M50 35 Q140 15 155 55" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7" />
                    <path d="M155 55 Q215 40 265 90" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.7" />
                    <path d="M50 75 Q125 65 265 90" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3,3" opacity="0.5" />
                  </svg>
                </div>
                
                {/* Truck Watermark containing clean stylized speed container truck */}
                <div className="absolute top-[40%] right-6 md:right-10 opacity-90 pointer-events-none z-10 flex items-center">
                  <svg width="70" height="30" viewBox="0 0 70 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                    <path d="M2 10 H12 M0 16 H8 M4 22 H14" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                    <rect x="16" y="5" width="34" height="16" rx="2" fill="#117651" />
                    <path d="M21 5 V21 M26 5 V21 M31 5 V21 M36 5 V21 M41 5 V21 M46 5 V21" stroke="#064e3b" strokeWidth="1" opacity="0.4" />
                    <path d="M50 9 H56 C58.5 9 60 10.5 60 13 V21 H50 V9 Z" fill="#0d9488" />
                    <path d="M54 11 H57 C58 11 58.5 12 58.5 13 V16 H54 V11 Z" fill="#ffffff" opacity="0.9" />
                    <rect x="18" y="21" width="38" height="3" fill="#1f2937" />
                    <circle cx="23" cy="24" r="4" fill="#374151" stroke="#ffffff" strokeWidth="0.8" />
                    <circle cx="23" cy="24" r="1.5" fill="#9ca3af" />
                    <circle cx="31" cy="24" r="4" fill="#374151" stroke="#ffffff" strokeWidth="0.8" />
                    <circle cx="31" cy="24" r="1.5" fill="#9ca3af" />
                    <circle cx="45" cy="24" r="4" fill="#374151" stroke="#ffffff" strokeWidth="0.8" />
                    <circle cx="45" cy="24" r="1.5" fill="#9ca3af" />
                    <circle cx="53" cy="24" r="4" fill="#374151" stroke="#ffffff" strokeWidth="0.8" />
                    <circle cx="53" cy="24" r="1.5" fill="#9ca3af" />
                  </svg>
                </div>

                <div className="relative z-10 pl-1 mt-1">
                  {/* Timeline vertical line */}
                  <div className="absolute left-[7.5px] top-[14px] bottom-[20px] w-[2px] bg-gray-200 dark:bg-gray-700 z-0" />
                  
                  {/* Origin */}
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="w-4 h-4 rounded-full border-[3px] border-[#e7f7ed] dark:border-green-900 bg-[#117651] dark:bg-emerald-500 shadow-sm flex items-center justify-center shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Origin ({selectedTrip.fromCountry || 'Qatar'})</span>
                      <span className="text-[18px] md:text-[20px] font-black text-gray-900 dark:text-white uppercase leading-tight mt-0.5">{selectedTrip.loadingPlace || '-'}</span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-4 h-4 rounded-full border-[3px] border-[#ffe4e6] dark:border-red-900 bg-[#F472B6] dark:bg-rose-500 shadow-sm flex items-center justify-center shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Destination ({selectedTrip.arrivalCountry || 'Qatar'})</span>
                      <span className="text-[18px] md:text-[20px] font-black text-gray-900 dark:text-white uppercase leading-tight mt-0.5">{selectedTrip.deliveryPlace || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Shipment Info */}
              <div className="bg-white dark:bg-zinc-900/90 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none p-6 relative overflow-hidden border-l-[6px] border-[#bfdbfe] dark:border-blue-900/50">
                {/* Ship and Containers Watermark */}
                <div className="absolute bottom-0 right-0 opacity-[0.25] dark:opacity-35 pointer-events-none z-0">
                  <svg width="220" height="90" viewBox="0 0 220 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 80 Q 30 75 60 80 T 120 80 T 180 80 T 240 80" stroke="#2563eb" strokeWidth="1.2" strokeLinecap="round" />
                    <path d="M10 85 Q 40 82 70 85 T 130 85 T 190 85 T 250 85" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
                    <path d="M 40 76 L 195 76 L 210 60 L 195 54 L 60 54 L 40 76 Z" fill="#4b5563" stroke="#374151" strokeWidth="0.8" />
                    <rect x="175" y="32" width="18" height="22" fill="#d1d5db" stroke="#374151" strokeWidth="0.8" />
                    <rect x="178" y="36" width="12" height="4" fill="#1f2937" />
                    <rect x="180" y="24" width="8" height="8" fill="#9ca3af" stroke="#374151" strokeWidth="0.8" />
                    <rect x="184" y="24" x2="184" y2="14" stroke="#374151" strokeWidth="1.5" />
                    <rect x="65" y="42" width="22" height="12" fill="#93c5fd" stroke="#2563eb" strokeWidth="0.8" />
                    <rect x="65" y="30" width="22" height="12" fill="#fca5a5" stroke="#dc2626" strokeWidth="0.8" />
                    <rect x="90" y="42" width="22" height="12" fill="#86efac" stroke="#16a34a" strokeWidth="0.8" />
                    <rect x="90" y="30" width="22" height="12" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
                    <rect x="90" y="18" width="22" height="12" fill="#93c5fd" stroke="#2563eb" strokeWidth="0.8" />
                    <rect x="115" y="42" width="22" height="12" fill="#fca5a5" stroke="#dc2626" strokeWidth="0.8" />
                    <rect x="115" y="30" width="22" height="12" fill="#c084fc" stroke="#7c3aed" strokeWidth="0.8" />
                    <rect x="140" y="42" width="22" height="12" fill="#fde047" stroke="#ca8a04" strokeWidth="0.8" />
                    <rect x="140" y="30" width="22" height="12" fill="#86efac" stroke="#16a34a" strokeWidth="0.8" />
                  </svg>
                </div>
                {/* Left side single container stack */}
                <div className="absolute bottom-0 left-0 opacity-[0.25] dark:opacity-35 pointer-events-none z-0">
                  <svg width="140" height="110" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="60" width="36" height="14" fill="#93c5fd" stroke="#2563eb" strokeWidth="0.8" />
                    <line x1="11" y1="60" x2="11" y2="74" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="17" y1="60" x2="17" y2="74" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="23" y1="60" x2="23" y2="74" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="29" y1="60" x2="29" y2="74" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="35" y1="60" x2="35" y2="74" stroke="#2563eb" strokeWidth="0.5" />

                    <rect x="5" y="76" width="36" height="14" fill="#93c5fd" stroke="#2563eb" strokeWidth="0.8" />
                    <line x1="11" y1="76" x2="11" y2="90" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="17" y1="76" x2="17" y2="90" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="23" y1="76" x2="23" y2="90" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="29" y1="76" x2="29" y2="90" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="35" y1="76" x2="35" y2="90" stroke="#2563eb" strokeWidth="0.5" />

                    <rect x="5" y="92" width="36" height="14" fill="#93c5fd" stroke="#2563eb" strokeWidth="0.8" />
                    <line x1="11" y1="92" x2="11" y2="106" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="17" y1="92" x2="17" y2="106" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="23" y1="92" x2="23" y2="106" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="29" y1="92" x2="29" y2="106" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="35" y1="92" x2="35" y2="106" stroke="#2563eb" strokeWidth="0.5" />

                    <rect x="43" y="44" width="36" height="14" fill="#93c5fd" stroke="#2563eb" strokeWidth="0.8" />
                    <line x1="49" y1="44" x2="49" y2="58" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="55" y1="44" x2="55" y2="58" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="61" y1="44" x2="61" y2="58" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="67" y1="44" x2="67" y2="58" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="73" y1="44" x2="73" y2="58" stroke="#2563eb" strokeWidth="0.5" />

                    <rect x="43" y="60" width="36" height="14" fill="#93c5fd" stroke="#2563eb" strokeWidth="0.8" />
                    <line x1="49" y1="60" x2="49" y2="74" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="55" y1="60" x2="55" y2="74" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="61" y1="60" x2="61" y2="74" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="67" y1="60" x2="67" y2="74" stroke="#2563eb" strokeWidth="0.5" />
                    <line x1="73" y1="60" x2="73" y2="74" stroke="#2563eb" strokeWidth="0.5" />

                    <rect x="43" y="76" width="36" height="14" fill="#60a5fa" stroke="#047857" strokeWidth="0.8" />
                    <line x1="49" y1="76" x2="49" y2="90" stroke="#047857" strokeWidth="0.5" />
                    <line x1="55" y1="76" x2="55" y2="90" stroke="#047857" strokeWidth="0.5" />
                    <line x1="61" y1="76" x2="61" y2="90" stroke="#047857" strokeWidth="0.5" />
                    <line x1="67" y1="76" x2="67" y2="90" stroke="#047857" strokeWidth="0.5" />

                    <rect x="43" y="92" width="36" height="14" fill="#60a5fa" stroke="#047857" strokeWidth="0.8" />
                    <line x1="49" y1="92" x2="49" y2="106" stroke="#047857" strokeWidth="0.5" />
                    <line x1="55" y1="92" x2="55" y2="106" stroke="#047857" strokeWidth="0.5" />
                    <line x1="61" y1="92" x2="61" y2="106" stroke="#047857" strokeWidth="0.5" />
                  </svg>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Package size={18} className="text-gray-500" />
                    <span className="text-[14px] text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider">Shipment Info</span>
                  </div>
                  <div className="border-b border-black dark:border-white mb-2"></div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-6">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Loading Type</span>
                      <span className="text-[14px] font-black text-gray-900 dark:text-white uppercase mt-0.5">{selectedTrip.loadingType || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Bayan Number</span>
                      <span className="text-[14px] font-black text-gray-900 dark:text-white uppercase mt-0.5">{selectedTrip.bayanNumber || '-'}</span>
                    </div>

                    <div className="col-span-2 border-b border-black dark:border-white"></div>

                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Container Number</span>
                      <span className="text-[14px] font-black text-gray-900 dark:text-white uppercase mt-0.5">{selectedTrip.containerNumber || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Container Title</span>
                      <span className="text-[14px] font-black text-gray-900 dark:text-white uppercase mt-0.5">{selectedTrip.containerTitle || '-'}</span>
                    </div>

                    <div className="col-span-2 border-b border-black dark:border-white"></div>

                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Invoice Number</span>
                      <span className="text-[14px] font-black text-gray-900 dark:text-white uppercase mt-0.5">{selectedTrip.invoiceNumber || '-'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Trip Status</span>
                      <span className="text-[14px] font-black text-[#117651] dark:text-emerald-400 uppercase mt-0.5">{selectedTrip.tariffStatus || 'INCOMPLETE'}</span>
                    </div>
                    <div className="col-span-2 border-b border-black dark:border-white"></div>
                    {selectedTrip.emptyReturnYard && (
                      <>
                        <div className="flex flex-col col-span-2">
                          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Empty Return Yard</span>
                          <span className="text-[14px] font-black text-gray-900 dark:text-white uppercase mt-0.5">{selectedTrip.emptyReturnYard}</span>
                        </div>
                        <div className="col-span-2 border-b border-black dark:border-white"></div>
                      </>
                    )}
                  </div>
                </div>
              </div>

            <div className="bg-card-bg p-4 rounded-2xl shadow-sm">
              <h4 className="text-xs font-bold text-text-main tracking-widest mb-4 flex items-center gap-2">
                <Car size={12} /> Vehicle & Driver
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem icon={Truck} label="Vehicles Number" value={selectedTrip.vehicleNumber} />
                <DetailItem icon={Truck} label="Taylor Number" value={selectedTrip.trailerNumber} />
              </div>
            </div>

            <div className="bg-card-bg p-4 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">Pending balance</h4>
                <div className="flex gap-1 text-[8px] font-bold text-gray-400 uppercase">
                  <span className="w-[45px] text-right">Total</span>
                  <span className="w-[45px] text-right">Paid</span>
                  <span className={`w-[45px] text-right ${isDark ? 'text-white' : 'text-rose-500'}`}>Due</span>
                </div>
              </div>
              
              <div className="space-y-2.5">
                {[
                  { 
                    label: language === 'bn' ? 'ট্রিপ ডিজেল' : 'Trip Diesel', 
                    total: (selectedTrip.dieselPrice || 0) + (selectedTrip.extraDiesel || 0), 
                    paid: (selectedTrip.dieselPaid || 0) + (selectedTrip.extraDieselPaid || 0), 
                    icon: Fuel, 
                    color: 'blue', 
                    isIncome: false,
                    subtext: [
                      selectedTrip.extraDiesel > 0 ? `${language === 'bn' ? 'এক্সট্রা' : 'Extra'}: ${selectedTrip.extraDiesel} (${selectedTrip.extraDieselReason || (language === 'bn' ? 'অন্যান্য' : 'Other')})` : undefined
                    ].filter(Boolean).join(' | ')
                  },
                  { label: language === 'bn' ? 'জেনারেটর ডিজেল' : 'Generator Diesel', total: selectedTrip.generatorDiesel || 0, paid: selectedTrip.generatorDieselPaid || 0, icon: Fuel, color: 'sky', isIncome: false },
                  { label: language === 'bn' ? 'কমিশন' : 'Commission', total: selectedTrip.commission || 0, paid: selectedTrip.commissionPaid || 0, icon: Coins, color: 'emerald', isIncome: true },
                  { label: language === 'bn' ? 'শুক্রবার বিল' : 'Friday', total: selectedTrip.friday || 0, paid: selectedTrip.fridayPaid || 0, icon: Calendar, color: 'orange', isIncome: true },
                  { label: language === 'bn' ? 'বোনাস' : 'Bonus', total: selectedTrip.bonus || 0, paid: selectedTrip.bonusPaid || 0, icon: Award, color: 'purple', isIncome: true },
                  { label: language === 'bn' ? 'ওভারটাইম' : 'Overtime', total: selectedTrip.overtime || 0, paid: selectedTrip.overtimePaid || 0, icon: Zap, color: 'amber', isIncome: true },
                  { label: language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel', total: selectedTrip.extraDiesel || 0, paid: selectedTrip.extraDieselPaid || 0, icon: Fuel, color: 'indigo', isIncome: false, subtext: selectedTrip.extraDieselReason || (language === 'bn' ? 'অন্যান্য' : 'Other') },
                ].filter(item => item.total > 0).map((item) => {
                  const due = item.total - item.paid;
                  return (
                    <div key={item.label} className={`flex items-center justify-between group gap-2 bg-${item.color}-200/40 dark:bg-white/20 p-3.5 rounded-[8px] shadow-sm`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`w-6 h-6 flex-shrink-0 rounded-[8px] bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center`}>
                          <item.icon size={12} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-bold text-text-muted uppercase truncate">{item.label}</span>
                          {item.subtext && <span className="text-[7px] font-bold text-gray-400 truncate">{item.subtext}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-right flex-shrink-0">
                        <div className="w-[45px]">
                          <p className="text-[9px] font-semibold text-text-main truncate">{item.total.toLocaleString()}</p>
                        </div>
                        <div className="w-[45px]">
                          <p className={`text-[9px] font-semibold truncate ${isDark ? 'text-white' : 'text-emerald-600'}`}>{item.paid.toLocaleString()}</p>
                        </div>
                        <div className="w-[45px]">
                          <p className={`text-[9px] font-semibold truncate ${due > 0 ? (isDark ? 'text-white' : 'text-rose-500') : 'text-gray-300'}`}>
                            {due.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Diesel Receipt Card */}
            {!!(selectedTrip.generatorReceiveNumber || (selectedTrip.generatorDiesel && Number(selectedTrip.generatorDiesel) > 0) || selectedTrip.dieselReceiptDate) && (
              <div className="bg-card-bg p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200 dark:shadow-none">
                    <Fuel size={20} />
                  </div>
                  <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">
                    DIESEL RECEIPT
                  </h4>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Diesel Type</p>
                      <p className="text-xs font-black text-text-main uppercase">
                        {selectedTrip.dieselReceiptType === 'truck'
                          ? 'Truck Diesel'
                          : selectedTrip.dieselReceiptType === 'light_vehicle'
                            ? 'Light vehicle Diesel'
                            : (selectedTrip.dieselReceiptType === 'generator' || selectedTrip.generatorDiesel > 0
                              ? 'Generator Diesel'
                              : '-')}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Receipt Number</p>
                      <p className="text-xs font-black text-text-main font-mono">
                        {selectedTrip.generatorReceiveNumber || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Transaction Date</p>
                      <p className="text-xs font-black text-text-main">
                        {selectedTrip.dieselReceiptDate || '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="text-sm font-black text-[#117651] dark:text-emerald-400 font-mono">
                        {selectedTrip.generatorDiesel ? `${currency.code} ${selectedTrip.generatorDiesel.toLocaleString()}` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary Dashboard */}
            <div className="bg-card-bg rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-900 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-400" />
                    <h4 className="text-xs font-bold uppercase tracking-widest">Financial Summary</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-2xl text-[10px] font-bold uppercase ${((selectedTrip.totalAmount || 0) - (selectedTrip.paidAmount || 0)) <= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {((selectedTrip.totalAmount || 0) - (selectedTrip.paidAmount || 0)) <= 0 ? 'Settled' : 'Outstanding'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-white/50">Available Balance</p>
                    <p className="text-2xl font-bold text-emerald-400 dark:text-white leading-none">
                      {currency.code} {(selectedTrip.paidAmount || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold uppercase text-white/50">PENDING BALANCE</p>
                    <p className="text-2xl font-bold text-rose-400 dark:text-white leading-none">
                      {currency.code} {((selectedTrip.totalAmount || 0) - (selectedTrip.paidAmount || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase text-white/50">
                    <span>Payment Progress</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all " 
                      style={{ width: `${(selectedTrip.totalAmount || 0) > 0 ? Math.min(100, ((selectedTrip.paidAmount || 0) / (selectedTrip.totalAmount || 0)) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center text-gray-400">
                    <Banknote size={14} />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Total Value</p>
                    <p className="text-xs font-semibold text-text-main">{currency.code} {(selectedTrip.totalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 justify-end text-right">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Last Activity</p>
                    <p className="text-xs font-semibold text-text-main">
                      {selectedTrip.payments && selectedTrip.payments.length > 0 
                        ? selectedTrip.payments[selectedTrip.payments.length - 1].date
                        : 'No records'}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center text-gray-400">
                    <Clock size={14} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History Ledger */}
            <div className="bg-card-bg rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-gray-400" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-text-main">Payment Ledger</h4>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">{selectedTrip.payments?.length || 0} Entries</span>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {selectedTrip.payments && selectedTrip.payments.length > 0 ? (
                  (() => {
                    const totalPaid = selectedTrip.payments!.reduce((sum, p) => sum + p.amount, 0);
                    let runningPaid = totalPaid;
                    return [...selectedTrip.payments].reverse().map((payment) => {
                      const remaining = (selectedTrip.totalAmount || 0) - runningPaid;
                      runningPaid -= payment.amount;
                      
                      return (
                        <div key={payment.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-0.5">{payment.category}</p>
                              <p className="text-sm font-bold text-text-main">
                                {currency.code} {payment.amount.toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Remaining</p>
                              <p className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-rose-500'}`}>
                                {currency.code} {remaining > 0 ? remaining.toLocaleString() : '0'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase">
                            <div className="flex items-center gap-1">
                              <Calendar size={10} />
                              {payment.date}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={10} />
                              {payment.time}
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <div className="p-10 text-center">
                    <Banknote size={32} className="mx-auto text-text-muted mb-2" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No payment history</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trip Action Card: Edit & Delete buttons */}
            <div className="bg-card-bg p-4 rounded-2xl shadow-sm flex flex-col gap-3">
              <h4 className="text-xs font-bold text-text-main uppercase tracking-widest flex items-center gap-2">
                Trip Actions
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setEditingTrip(selectedTrip);
                    setSelectedTrip(null);
                    setView('NEW_TRIP');
                  }}
                  className="py-3 bg-blue-500/10 text-blue-500 font-bold uppercase tracking-widest rounded-lg text-xs hover:bg-blue-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Edit2 size={14} /> Edit Trip
                </button>
                <button
                  onClick={(e) => {
                    handleDeleteTrip(e, selectedTrip.id);
                    setSelectedTrip(null);
                  }}
                  className="py-3 bg-rose-500/10 text-rose-500 font-bold uppercase tracking-widest rounded-lg text-xs hover:bg-rose-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} /> Delete Trip
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>,
      document.body
    )}

    </div>
  );
};

export default MonthlyFileDetails;
