import React, { useState, useMemo, useEffect, useLayoutEffect } from 'react';

import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  ChevronRight, 
  ArrowDownLeft,
  ArrowDown,
  ArrowUpRight,
  Wallet, 
  Banknote, 
  CreditCard, 
  Smartphone,
  Calendar,
  Clock,
  Hash,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  Save,
  Trash2,
  Edit,
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Award,
  Heart,
  Zap,
  Utensils,
  AlertTriangle,
  Car,
  Fuel,
  Info,
  Globe,
  MapPin,
  Tag,
  FileText,
  Truck,
  Coins,
  Power,
  History,
  Check,
  User as UserIcon,
  Building,
  Scale,
  Sparkles,
  Square,
  CheckSquare,
  Bell,
  Moon,
  Sun
} from 'lucide-react';

import { downloadPdf } from '../utils/fileUtils';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useStore, GLOBAL_TRANSITION, GLOBAL_VARIANTS, LOCAL_VARIANTS } from '../store';
import { TRANSLATIONS, THEMES } from '../constants';
import { Payment, INCOME_CATEGORIES, DEDUCTION_CATEGORIES, Trip, User } from '../types';
import { PaymentManager } from '../services/PaymentManager';
import { getContrastColor } from '../utils/colorUtils';
import { formatCategoryHeader } from '../utils/formatUtils';
import InputField from '../components/InputField';
import GlobalFullscreenSelect from '../components/GlobalFullscreenSelect';

import FormWindow from '../components/FormWindow';

const getCategoryIcon = (category: string) => {
  const cat = (category || "").toLowerCase();
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

const getCategoryDisplayLabel = (category: string, lang: string) => {
  if (lang === 'bn') {
    const catUpper = category.toUpperCase();
    if (catUpper === 'SALARY') return 'বেতন';
    if (catUpper === 'COMMISSION') return 'কমিশন';
    if (catUpper === 'TRIP DIESEL') return 'ট্রিপ ডিজেল';
    if (catUpper === 'FRIDAY') return 'শুক্রবার';
    if (catUpper === 'BONUS') return 'বোনাস';
    if (catUpper === 'VEHICLE INSPECTION' || catUpper === 'EXTRA FUEL' || catUpper === 'EXTRA_FUEL') return 'যানবাহন পরিদর্শন';
    if (catUpper === 'OTHERS') return 'অন্যান্য';
  }
  return category;
};

const DetailItem = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-start gap-2.5 p-1 rounded min-w-0">
    <div className="w-6 h-6 rounded-md bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-muted flex-shrink-0">
      <Icon size={12} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className="text-xs font-semibold text-text-main leading-tight truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const KNOWN_SUBKEYS = ['DIESELPRICE', 'GENERATORDIESEL', 'EXTRADIESEL', 'BONUS', 'COMMISSION', 'FRIDAY', 'OVERTIME', 'SALARY'];

const parsePendingItemKey = (k: any) => {
  if (!k || typeof k !== 'string') return { tripId: null, subKey: null };
  
  const parts = k.split('-');
  if (parts.length === 1) {
    return { tripId: k, subKey: null };
  }

  const lastPart = parts[parts.length - 1];
  const lastPartUpper = lastPart.toUpperCase();

  if (parts.length >= 3) {
    if (KNOWN_SUBKEYS.includes(lastPartUpper)) {
      const tripId = parts.slice(0, parts.length - 1).join('-');
      return { tripId, subKey: lastPart };
    }
  }

  if ((parts[0] === 'TRIP' || parts[0] === 'EF') && /^\d{13}$/.test(parts[1]) && parts.length === 2) {
    return { tripId: k, subKey: null };
  }

  const firstPartUpper = parts[0].toUpperCase();
  if (KNOWN_SUBKEYS.includes(firstPartUpper)) {
    const tripId = parts.slice(1).join('-');
    return { tripId, subKey: parts[0] };
  }

  if (KNOWN_SUBKEYS.includes(lastPartUpper)) {
    const tripId = parts.slice(0, parts.length - 1).join('-');
    return { tripId, subKey: lastPart };
  }

  return { tripId: k, subKey: null };
};

const SwipeToDeleteWrapper = ({ children, onDelete, itemVariants }: any) => {
  return (
    <div className="w-full mb-4">
      {children}
    </div>
  );
};

const DEFAULT_BANKS_BY_COUNTRY: Record<string, { name: string; branches?: { name: string; routingNumber?: string; swiftCode?: string }[] }[]> = {
  QA: [
    { name: 'Qatar National Bank (QNB)', branches: [{ name: 'Main Branch - Grand Hamad', routingNumber: 'QNBAQAQA001', swiftCode: 'QNBAQAQA' }, { name: 'Al Sadd Branch', routingNumber: 'QNBAQAQA002', swiftCode: 'QNBAQAQA' }, { name: 'D-Ring Road Branch', routingNumber: 'QNBAQAQA003', swiftCode: 'QNBAQAQA' }, { name: 'City Center Branch', routingNumber: 'QNBAQAQA004', swiftCode: 'QNBAQAQA' }] },
    { name: 'Qatar Islamic Bank (QIB)', branches: [{ name: 'Corporate Branch - Grand Hamad', routingNumber: 'QIBKQAQA001', swiftCode: 'QIBKQAQA' }, { name: 'Salwa Road Branch', routingNumber: 'QIBKQAQA002', swiftCode: 'QIBKQAQA' }, { name: 'Al Fanar Branch', routingNumber: 'QIBKQAQA003', swiftCode: 'QIBKQAQA' }] },
    { name: 'Commercial Bank of Qatar (CBQ)', branches: [{ name: 'Grand Hamad Branch', routingNumber: 'CBQAQAQA001', swiftCode: 'CBQAQAQA' }, { name: 'D-Ring Branch', routingNumber: 'CBQAQAQA002', swiftCode: 'CBQAQAQA' }, { name: 'West Bay Branch', routingNumber: 'CBQAQAQA003', swiftCode: 'CBQAQAQA' }] },
    { name: 'Masraf Al Rayan', branches: [{ name: 'Head Office - Grand Hamad', routingNumber: 'MARYQAQA001', swiftCode: 'MARYQAQA' }, { name: 'Al Sadd Branch', routingNumber: 'MARYQAQA002', swiftCode: 'MARYQAQA' }] },
    { name: 'Doha Bank', branches: [{ name: 'Main Branch - Corniche Street', routingNumber: 'DOHBQAQA001', swiftCode: 'DOHBQAQA' }, { name: 'Grand Hamad Branch', routingNumber: 'DOHBQAQA002', swiftCode: 'DOHBQAQA' }] },
    { name: 'Dukhan Bank', branches: [{ name: 'Grand Hamad Branch', routingNumber: 'BARQQAQA001', swiftCode: 'BARQQAQA' }, { name: 'Al Sadd Branch', routingNumber: 'BARQQAQA002', swiftCode: 'BARQQAQA' }] },
    { name: 'Ahlibank', branches: [{ name: 'Al Sadd Branch', routingNumber: 'AHLIQAQA001', swiftCode: 'AHLIQAQA' }, { name: 'Old Airport Branch', routingNumber: 'AHLIQAQA002', swiftCode: 'AHLIQAQA' }] },
    { name: 'Qatar International Islamic Bank (QIIB)', branches: [{ name: 'Grand Hamad Branch', routingNumber: 'QIIBQAQA001', swiftCode: 'QIIBQAQA' }, { name: 'Al Gharafa Branch', routingNumber: 'QIIBQAQA002', swiftCode: 'QIIBQAQA' }] }
  ],
  BD: [
    { name: 'Islami Bank Bangladesh Ltd', branches: [{ name: 'Principal Branch - Motijheel', routingNumber: '125271234', swiftCode: 'IBBLBDDH' }, { name: 'Gulshan Branch', routingNumber: '125271235', swiftCode: 'IBBLBDDH' }, { name: 'Agrabad Branch - Chattogram', routingNumber: '125271236', swiftCode: 'IBBLBDDH' }] },
    { name: 'Dutch-Bangla Bank Ltd', branches: [{ name: 'Local Office - Motijheel', routingNumber: '090271234', swiftCode: 'DBBLBDDH' }, { name: 'Banani Branch', routingNumber: '090271235', swiftCode: 'DBBLBDDH' }, { name: 'Dhanmondi Branch', routingNumber: '090271236', swiftCode: 'DBBLBDDH' }] },
    { name: 'BRAC Bank', branches: [{ name: 'Gulshan Branch', routingNumber: '060271234', swiftCode: 'BRAKBDDH' }, { name: 'Asad Gate Branch', routingNumber: '060271235', swiftCode: 'BRAKBDDH' }] },
    { name: 'City Bank', branches: [{ name: 'Principal Branch', routingNumber: '225271234', swiftCode: 'CIBLBDDH' }, { name: 'Dhanmondi Branch', routingNumber: '225271235', swiftCode: 'CIBLBDDH' }] },
    { name: 'Pubali Bank', branches: [{ name: 'Principal Branch', routingNumber: '175271234', swiftCode: 'PUBABDDA' }] },
    { name: 'Sonali Bank', branches: [{ name: 'Principal Branch', routingNumber: '200271234', swiftCode: 'BSONBDDH' }] },
    { name: 'Eastern Bank Ltd (EBL)', branches: [{ name: 'Principal Branch', routingNumber: '095271234', swiftCode: 'EBLBBDDH' }] },
    { name: 'Mutual Trust Bank (MTB)', branches: [{ name: 'Principal Branch', routingNumber: '145271234', swiftCode: 'MTBLBDDH' }] }
  ],
  SA: [
    { name: 'Al Rajhi Bank', branches: [{ name: 'Main Branch - Riyadh', routingNumber: 'RJHI001', swiftCode: 'RJHISARI' }] },
    { name: 'Saudi National Bank (SNB / AlAhli)', branches: [{ name: 'Head Office - Jeddah', routingNumber: 'NCB001', swiftCode: 'NCBSASJI' }] },
    { name: 'Riyad Bank', branches: [{ name: 'Main Branch - Riyadh', routingNumber: 'RIBL001', swiftCode: 'RIBLSARI' }] },
    { name: 'Alinma Bank', branches: [{ name: 'Main Branch - Riyadh', routingNumber: 'INMA001', swiftCode: 'INMASARI' }] },
    { name: 'Banque Saudi Fransi', branches: [{ name: 'Head Office - Riyadh', routingNumber: 'BSFR001', swiftCode: 'BSFRSARI' }] },
    { name: 'Arab National Bank', branches: [{ name: 'Main Branch - Riyadh', routingNumber: 'ARNB001', swiftCode: 'ARNBSARI' }] }
  ],
  AE: [
    { name: 'Emirates NBD', branches: [{ name: 'Deira Branch - Dubai', routingNumber: 'ENBD001', swiftCode: 'EBILAEAD' }] },
    { name: 'First Abu Dhabi Bank (FAB)', branches: [{ name: 'Main Branch - Abu Dhabi', routingNumber: 'FAB001', swiftCode: 'NBADAEAA' }] },
    { name: 'Abu Dhabi Commercial Bank (ADCB)', branches: [{ name: 'Head Office - Abu Dhabi', routingNumber: 'ADCB001', swiftCode: 'ADCBAEAA' }] },
    { name: 'Dubai Islamic Bank (DIB)', branches: [{ name: 'Main Branch - Dubai', routingNumber: 'DIB001', swiftCode: 'DUBIAEAD' }] },
    { name: 'Mashreq Bank', branches: [{ name: 'Head Office - Dubai', routingNumber: 'MASQ001', swiftCode: 'BOMLAEAD' }] }
  ]
};

const DEFAULT_MOBILE_WALLETS_BY_COUNTRY: Record<string, string[]> = {
  QA: ['Ooredoo Money', 'Vodafone Cash', 'iPay', 'CBQ Mobile Wallet'],
  BD: ['bKash', 'Nagad', 'Rocket', 'Upay', 'Tap', 'SureCash', 'MCash'],
  SA: ['STC Pay', 'Urpay', 'Mobily Pay', 'Tiqmo', 'Friendi Pay'],
  AE: ['e& money (Etisalat)', 'Payit', 'Careem Pay', 'Liv', 'Botim Pay'],
  IN: ['Paytm', 'Google Pay (GPay)', 'PhonePe', 'Amazon Pay'],
  PK: ['JazzCash', 'EasyPaisa', 'Nayapay', 'Sadapay']
};

const PaymentView: React.FC = () => {
  const { 
    language, 
    navigationDirection, 
    setNavigationDirection, payments, addPayment, updatePayment, removePayment, clearPayments, 
    confirmAction, currentFile, setCurrentFile, trips, showFeedback, theme, updateTrip, 
    headerBg, headerText, monthlyFiles, setView, user, users, updateUser, 
    isNightMode, appThemeMode, setAppThemeMode, notifications, backgroundColor, wallpaper, 
    showReceivedBreakdown, setShowReceivedBreakdown, 
    showPendingBreakdown, setShowPendingBreakdown, 
    countries, banks, branches, routingNumbers, setIsLoadingView, isEntryFormOpen, setIsEntryFormOpen,
    setIsPaymentPopupOpen,
    selectedCurrency, isDarkMode: storeIsDarkMode,
    selectedTrip, setSelectedTrip, currencies, advanceReasons,
    globalFilterMonth, setGlobalFilterMonth, globalFilterYear, setGlobalFilterYear,
    bankNames, mobileBankingWallets
  } = useStore();

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
  
  const [selectedPendingCategory, setSelectedPendingCategory] = useState<string | null>(null);
  const [selectedVehicleInspectionItem, setSelectedVehicleInspectionItem] = useState<any | null>(null);
  const [selectedSalaryPendingForPopup, setSelectedSalaryPendingForPopup] = useState<any | null>(null);
  const [selectedCommissionPendingForPopup, setSelectedCommissionPendingForPopup] = useState<any | null>(null);
  const [selectedGenericPendingForPopup, setSelectedGenericPendingForPopup] = useState<any | null>(null);
  const [pendingFilterMonth, setPendingFilterMonth] = useState<number | 'ALL'>('ALL');
  const [pendingFilterYear, setPendingFilterYear] = useState<number | 'ALL'>('ALL');
  const [pendingSearchQuery, setPendingSearchQuery] = useState('');

  const [receivedFilterMonth, setReceivedFilterMonth] = useState<number | 'ALL'>('ALL');
  const [receivedFilterYear, setReceivedFilterYear] = useState<number | 'ALL'>('ALL');
  const [receivedSearchQuery, setReceivedSearchQuery] = useState('');

  const [receivedListFilterMonth, setReceivedListFilterMonth] = useState<number | 'ALL'>('ALL');
  const [receivedListFilterYear, setReceivedListFilterYear] = useState<number | 'ALL'>('ALL');
  const [receivedListSearchQuery, setReceivedListSearchQuery] = useState('');

  const [pendingListFilterMonth, setPendingListFilterMonth] = useState<number | 'ALL'>('ALL');
  const [pendingListFilterYear, setPendingListFilterYear] = useState<number | 'ALL'>('ALL');
  const [pendingListSearchQuery, setPendingListSearchQuery] = useState('');
  // User Renew State
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';

  const currency = useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency) || currencies[0] || { code: 'QAR', symbol: 'QAR' };
  }, [currencies, selectedCurrency]);

  useLayoutEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    
    // Handle pending actions from Dashboard
    const pendingAction = localStorage.getItem('pendingAction');
    const pendingCategory = localStorage.getItem('pendingCategory');
    
    if (pendingAction === 'ADD_INCOME') {
      setIsEntryFormOpen(true);
      setFormType('INCOME');
      if (pendingCategory) {
        setFormCategory(pendingCategory);
        setTimeout(() => localStorage.removeItem('pendingCategory'), 500);
      } else {
        setFormCategory('');
      }
      setTimeout(() => localStorage.removeItem('pendingAction'), 500);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [setIsEntryFormOpen]);

  const t = TRANSLATIONS[language];
  const isAdmin = user?.role === 'ADMIN';
  const currentTheme = THEMES.find(th => th.id === theme) || THEMES[0];
  const isLightWhite = appThemeMode === 'light';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const effectiveBg = useMemo(() => {
    if (isNightMode) return '#000000';
    if (backgroundColor) return backgroundColor;
    if (wallpaper) return '#000000';
    return appThemeMode === 'light' ? '#f8fafc' : '#000000';
  }, [isNightMode, backgroundColor, wallpaper, appThemeMode]);

  const dynamicTextColor = useMemo(() => getContrastColor(effectiveBg), [effectiveBg]);
  const dynamicMutedColor = useMemo(() => dynamicTextColor === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', [dynamicTextColor]);

  const handleClearAll = () => {
    confirmAction('Are you sure you want to remove all transaction data? This action cannot be undone.', () => {
      clearPayments();
      showFeedback('All transaction data removed successfully');
    });
  };

  const selectedYear = globalFilterYear;
  const setSelectedYear = setGlobalFilterYear;
  const selectedMonth = globalFilterMonth;
  const setSelectedMonth = setGlobalFilterMonth;
  const [activeTab, setActiveTab] = useState<'INCOME' | 'DEDUCTION'>('INCOME');
  
  const [selectedTransaction, setSelectedTransaction] = useState<Payment | null>(null);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [viewingCategory, setViewingCategory] = useState<string | null>(null);
  const [showSalaryCard, setShowSalaryCard] = useState(true);

  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showBankSelect, setShowBankSelect] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  const [showRoutingSelect, setShowRoutingSelect] = useState(false);
  const [showServiceProviderSelect, setShowServiceProviderSelect] = useState(false);

  // User Renew State
  const [detailedPendingItems, setDetailedPendingItems] = useState<any[]>([]);
  const [selectedReceivedCategory, setSelectedReceivedCategory] = useState<string | null>(null);
  const [detailedReceivedItems, setDetailedReceivedItems] = useState<any[]>([]);
  const [salaryFilterMonth, setSalaryFilterMonth] = useState<number | 'ALL'>('ALL');
  const [salaryFilterYear, setSalaryFilterYear] = useState<number | 'ALL'>('ALL');
  const [extraFuelFilterMonth, setExtraFuelFilterMonth] = useState<number | 'ALL'>('ALL');
  const [extraFuelFilterYear, setExtraFuelFilterYear] = useState<number | 'ALL'>('ALL');
  const [receivedSubpageFilterMonth, setReceivedSubpageFilterMonth] = useState<number | 'ALL'>('ALL');
  const [receivedSubpageFilterYear, setReceivedSubpageFilterYear] = useState<number | 'ALL'>('ALL');

  const getAdvanceTargetCategory = (p: any): string | null => {
    if ((p.category || '').toUpperCase() !== 'ADVANCE') return null;
    const reason = (p.details?.advanceReason || p.details?.serviceName || p.details?.note || p.serviceName || '').toLowerCase();
    if (reason.includes('diesel') || reason.includes('ডিজেল') || reason.includes('fuel')) return 'Trip Diesel';
    if (reason.includes('salary') || reason.includes('স্যালারি') || reason.includes('বেতন')) return 'Salary';
    if (reason.includes('commission') || reason.includes('কমিশন')) return 'Commission';
    if (reason.includes('friday') || reason.includes('ফ্রাইডে') || reason.includes('শুক্রবার')) return 'Friday';
    if (reason.includes('bonus') || reason.includes('বোনাস')) return 'Bonus';
    if (reason.includes('overtime') || reason.includes('ওভারটাইম')) return 'Overtime';
    if (reason.includes('extra fuel') || reason.includes('এক্সট্রা ফুয়েল') || reason.includes('extra_fuel') || reason.includes('vehicle inspection') || reason.includes('পরিদর্শন')) return 'Extra Fuel';
    return null;
  };

  const getCategoryUnadjustedAdvance = (paymentList: Payment[], category: string, month: number | 'ALL', year: number | 'ALL'): number => {
    let normCategory = (category || '').toUpperCase();
    if (normCategory === 'VEHICLE INSPECTION' || normCategory === 'EXTRA_FUEL') {
      normCategory = 'EXTRA FUEL';
    }

    let totalTaken = 0;
    let totalReturned = 0;
    let totalDeducted = 0;

    paymentList.forEach(p => {
      if (p.status !== 'RECEIVED') return;
      const monthMatch = month === 'ALL' ? true : Number(p.month) === Number(month);
      const yearMatch = year === 'ALL' ? true : Number(p.year) === Number(year);
      if (!monthMatch || !yearMatch) return;

      const pCat = (p.category || '').toUpperCase();
      let targetCat = getAdvanceTargetCategory(p);
      if (targetCat && (targetCat.toUpperCase() === 'VEHICLE INSPECTION' || targetCat.toUpperCase() === 'EXTRA_FUEL')) {
        targetCat = 'Extra Fuel';
      }

      const isTargetMatch = targetCat ? targetCat.toUpperCase() === normCategory : (pCat === normCategory || normCategory === 'ALL');

      if (pCat === 'ADVANCE') {
        if (p.details?.advanceType === 'TAKEN' && (isTargetMatch || (!targetCat && normCategory === 'OTHERS'))) {
          totalTaken += Number(p.amount) || 0;
        } else if (p.details?.advanceType === 'RETURNED' && (isTargetMatch || (!targetCat && normCategory === 'OTHERS'))) {
          totalReturned += Number(p.amount) || 0;
        }
      }

      // Also count advances that were already deducted in payments for this category
      let pCatNorm = pCat;
      if (pCatNorm === 'VEHICLE INSPECTION' || pCatNorm === 'EXTRA_FUEL') {
        pCatNorm = 'EXTRA FUEL';
      }
      if (isTargetMatch || pCatNorm === normCategory) {
        const advDeducted = Number(p.details?.advanceDeducted) || Number(p.details?.advanceAmount) || 0;
        totalDeducted += advDeducted;
      }
    });

    return Math.max(0, totalTaken - totalReturned - totalDeducted);
  };

  const getCategoryAdvanceAmount = (paymentList: Payment[], category: string, month: number | 'ALL', year: number | 'ALL'): number => {
    return getCategoryUnadjustedAdvance(paymentList, category, month, year);
  };

  const filteredDetailedPendingItems = useMemo(() => {
    return detailedPendingItems.filter(item => {
      if (pendingFilterMonth !== 'ALL') {
        if (Number(item.month) !== Number(pendingFilterMonth)) return false;
      }
      if (pendingFilterYear !== 'ALL') {
        if (Number(item.year) !== Number(pendingFilterYear)) return false;
      }
      if (pendingSearchQuery.trim() !== '') {
        const query = pendingSearchQuery.toLowerCase();
        const companyName = (item.companyName || item.details?.companyName || '').toLowerCase();
        const containerNum = (item.containerNumber || item.details?.containerNumber || '').toLowerCase();
        const vehicleNum = (item.vehicleNumber || item.details?.vehicleNumber || '').toLowerCase();
        const invoiceNum = (item.invoiceNumber || item.details?.invoiceNumber || '').toLowerCase();
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
  }, [detailedPendingItems, pendingFilterMonth, pendingFilterYear, pendingSearchQuery]);

  const consolidatedPendingItems = useMemo(() => {
    const itemsToUse = filteredDetailedPendingItems;
    if (selectedPendingCategory?.toUpperCase() !== 'TRIP DIESEL') {
      return itemsToUse;
    }

    const groupedMap = new Map<string, any>();

    itemsToUse.forEach(item => {
      const lastIndex = item.id.lastIndexOf('-');
      const tripId = lastIndex !== -1 ? item.id.substring(0, lastIndex) : item.id;
      
      if (!groupedMap.has(tripId)) {
        const trip = trips.find(t => t.id === tripId);
        if (trip) {
          groupedMap.set(tripId, {
            tripId,
            trip,
            month: item.month,
            year: item.year,
            itemDate: item.date,
          });
        } else {
          groupedMap.set(tripId, {
            tripId,
            month: item.month,
            year: item.year,
            itemDate: item.date,
            fallbackItems: [item]
          });
        }
      } else {
        const existing = groupedMap.get(tripId);
        if (existing.fallbackItems) {
          existing.fallbackItems.push(item);
        }
      }
    });

    const result: any[] = [];
    groupedMap.forEach((val) => {
      if (val.trip) {
        const t = val.trip;
        const subItemsMap: { [key: string]: any } = {};
        const configs = [
          { key: 'dieselPrice', paidField: 'dieselPaid', label: 'Trip Diesel', category: 'Trip Diesel' },
          { key: 'extraDiesel', paidField: 'extraDieselPaid', label: 'Generator Diesel', category: 'Trip Diesel' },
          { key: 'friday', paidField: 'fridayPaid', label: 'Friday', category: 'Trip Diesel' },
          { key: 'bonus', paidField: 'bonusPaid', label: 'Bonus', category: 'Bonus' },
        ];

        configs.forEach(sub => {
          const existingItem = itemsToUse.find(i => i.id === `${t.id}-${sub.key}`);
          if (existingItem) {
            subItemsMap[sub.key] = {
              id: existingItem.id,
              key: sub.key,
              label: existingItem.label ? existingItem.label.split(' - ')[0] : sub.label,
              total: existingItem.total,
              paid: existingItem.paid,
              pending: existingItem.pending,
            };
          }
        });

        const subItemsList = Object.values(subItemsMap);
        if (subItemsList.length > 0) {
          const totalPending = subItemsList.reduce((sum, item) => sum + item.pending, 0);
          result.push({
            id: t.id,
            isGrouped: true,
            companyName: t.companyName,
            loadingDate: t.loadingDate,
            loadingPlace: t.loadingPlace || (t as any).loadingPlace || '',
            deliveryPlace: (t as any).deliveryPlace || '',
            containerNumber: t.containerNumber,
            vehicleNumber: t.vehicleNumber,
            month: val.month,
            year: val.year,
            subItems: subItemsList,
            totalPending: totalPending,
            paymentIds: subItemsList.map(item => item.id),
          });
        }
      } else if (val.fallbackItems) {
        const totalPending = val.fallbackItems.reduce((sum: number, item: any) => sum + (item.pending || 0), 0);
        result.push({
          id: val.tripId,
          isGrouped: true,
          companyName: val.fallbackItems[0]?.details?.companyName || 'Unknown Company',
          loadingDate: val.itemDate || 'N/A',
          loadingPlace: val.fallbackItems[0]?.details?.loadingPlace || '',
          deliveryPlace: val.fallbackItems[0]?.details?.deliveryPlace || '',
          containerNumber: val.fallbackItems[0]?.details?.containerNumber || 'N/A',
          vehicleNumber: val.fallbackItems[0]?.details?.vehicleNumber || 'N/A',
          month: val.month,
          year: val.year,
          subItems: val.fallbackItems.map((fi: any) => ({
            id: fi.id,
            key: fi.details?.subType || 'dieselPrice',
            label: fi.label?.split('-')[0]?.trim() || 'Trip Diesel',
            total: fi.total || 0,
            paid: fi.paid || 0,
            pending: fi.pending || 0,
          })),
          totalPending: totalPending,
          paymentIds: val.fallbackItems.map((fi: any) => fi.id),
        });
      }
    });

    return result;
  }, [filteredDetailedPendingItems, trips, payments, selectedPendingCategory]);

  const salaryAndCommissionMonths = useMemo(() => {
    const monthsMap = new Map<string, {
      month: number;
      year: number;
      salary: { total: number; items: any[] } | null;
      commission: { total: number; items: any[] } | null;
      totalTrips: number;
    }>();

    const salaryDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments, 'SALARY');
    const commissionDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments, 'COMMISSION');

    salaryDues.forEach(group => {
      const key = `${group.month}-${group.year}`;
      const salaryCat = group.categories.find((c: any) => (c.name || '').toUpperCase() === 'SALARY');
      if (salaryCat && salaryCat.totalPending > 0) {
        monthsMap.set(key, {
          month: group.month,
          year: group.year,
          salary: { total: salaryCat.totalPending, items: salaryCat.items || [] },
          commission: null,
          totalTrips: 0
        });
      }
    });

    commissionDues.forEach(group => {
      const key = `${group.month}-${group.year}`;
      const commCat = group.categories.find((c: any) => (c.name || '').toUpperCase() === 'COMMISSION');
      if (commCat && commCat.totalPending > 0) {
        const existing = monthsMap.get(key);
        if (existing) {
          existing.commission = { total: commCat.totalPending, items: commCat.items || [] };
        } else {
          monthsMap.set(key, {
            month: group.month,
            year: group.year,
            salary: null,
            commission: { total: commCat.totalPending, items: commCat.items || [] },
            totalTrips: 0
          });
        }
      }
    });

    monthsMap.forEach((val, key) => {
      const mFile = monthlyFiles.find(f => Number(f.month) === Number(val.month) && Number(f.year) === Number(val.year));
      let count = 0;
      if (mFile) {
        const fileTrips = trips.filter(t => t.fileId === mFile.id);
        count = fileTrips.filter(t => !t.status || t.status === 'COMPLETED').length;
      }
      if (!count) {
        const dateTrips = trips.filter(t => {
          const dateStr = t.loadingDate || (t as any).date;
          if (!dateStr) return false;
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            return (d.getMonth() + 1) === Number(val.month) && d.getFullYear() === Number(val.year);
          }
          return false;
        });
        count = dateTrips.length;
      }
      if (!count) {
        count = (val.commission?.items?.length || 0) || (val.salary?.items?.length || 0);
      }
      val.totalTrips = count;
    });

    return Array.from(monthsMap.values()).sort((a, b) => b.year - a.year || b.month - a.month);
  }, [trips, monthlyFiles, payments]);

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

          const tripsToUpdate = trips.filter(t => {
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
                                  (updatedTrip.overtimePaid || 0) +
                                  (updatedTrip.generatorDieselPaid || 0);
            
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
        
        const trip = trips.find(t => t.id === tripId);
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
                                (updatedTrip.overtimePaid || 0) +
                                (updatedTrip.generatorDieselPaid || 0);
          
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

  const deletePaymentItemDirect = (id: string, isPending: boolean) => {
    if (isPending) {
      clearPendingDuesForIds([id]);
    } else {
      removePayment(id);
    }
    showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : (t.TRANSACTION_DELETED_SUCCESS || 'Transaction deleted successfully'));
    
    if (isPending) {
      setDetailedPendingItems(prev => prev.filter(p => p.id !== id && !p.id.includes(id)));
    } else {
      setDetailedReceivedItems(prev => prev.filter(p => p.id !== id && !p.id.includes(id)));
    }
  };

  const handleDeletePaymentItem = (id: string, isPending: boolean) => {
    confirmAction(t.TRANSACTION_DELETE_DESC || (language === 'bn' ? 'আপনি কি এটি ডিলিট করতে চান?' : 'Are you sure you want to delete this transaction?'), () => {
      deletePaymentItemDirect(id, isPending);
    });
  };

  const handleReceivedCategoryClick = (category: string) => {
    const normCategory = category.toUpperCase();
    const matchedPayments = payments.filter(p => {
      if (p.type !== 'INCOME' || p.status !== 'RECEIVED') return false;
      
      const pCat = (p.category || '').toUpperCase();
      if (pCat === 'ADVANCE') return false; // Exclude all Advance transactions from category received details
      
      if (normCategory === 'VEHICLE INSPECTION') {
        if (pCat === 'EXTRA FUEL' || pCat === 'EXTRA_FUEL') return true;
        return false;
      }

      if (pCat === normCategory) return true;

      return false;
    });

    let items: any[] = [];
    const KNOWN_SUBKEYS = ['DIESELPRICE', 'GENERATORDIESEL', 'EXTRADIESEL', 'BONUS', 'COMMISSION', 'FRIDAY', 'OVERTIME', 'SALARY'];

    const parsePendingItemKey = (k: any) => {
      if (!k || typeof k !== 'string') return { tripId: null, subKey: null };
      
      const parts = k.split('-');
      if (parts.length === 1) {
        return { tripId: k, subKey: null };
      }

      const lastPart = parts[parts.length - 1];
      const lastPartUpper = lastPart.toUpperCase();

      if (parts.length >= 3) {
        if (KNOWN_SUBKEYS.includes(lastPartUpper)) {
          const tripId = parts.slice(0, parts.length - 1).join('-');
          return { tripId, subKey: lastPart };
        }
      }

      if ((parts[0] === 'TRIP' || parts[0] === 'EF') && /^\d{13}$/.test(parts[1]) && parts.length === 2) {
        return { tripId: k, subKey: null };
      }

      const firstPartUpper = parts[0].toUpperCase();
      if (KNOWN_SUBKEYS.includes(firstPartUpper)) {
        const tripId = parts.slice(1).join('-');
        return { tripId, subKey: parts[0] };
      }

      if (KNOWN_SUBKEYS.includes(lastPartUpper)) {
        const tripId = parts.slice(0, parts.length - 1).join('-');
        return { tripId, subKey: lastPart };
      }

      return { tripId: k, subKey: null };
    };

    const matchStr = (a: any, b: any) => {
      if (a === undefined || a === null || b === undefined || b === null) return false;
      return String(a).trim().toUpperCase() === String(b).trim().toUpperCase();
    };

    matchedPayments.forEach(p => {
      const keys = Object.keys(p.details?.pendingItems || {});
      
      if (keys.length > 0) {
        keys.forEach(key => {
          const parsed = parsePendingItemKey(key);
          let targetId = parsed.tripId;
          const subKey = parsed.subKey;

          // Resolve payment ID to actual trip key if needed
          if (targetId && typeof targetId === 'string' && (targetId.startsWith('PAY-') || (!targetId.startsWith('TRIP-') && !targetId.startsWith('EF-')))) {
            const linkedPayment = payments.find(pay => pay.id === targetId || pay.id === key);
            if (linkedPayment) {
              if (linkedPayment.details?.tripId) {
                targetId = linkedPayment.details.tripId;
              } else if (linkedPayment.details?.pendingItems) {
                const subKeys = Object.keys(linkedPayment.details.pendingItems);
                if (subKeys.length > 0) {
                  const subParsed = parsePendingItemKey(subKeys[0]);
                  if (subParsed.tripId) {
                    targetId = subParsed.tripId;
                  }
                }
              }
            }
          }
          
          const trip = trips.find(t => 
            matchStr(t.id, targetId) || 
            matchStr(t.invoiceNumber, targetId) || 
            matchStr(t.containerNumber, targetId) ||
            matchStr(t.vehicleNumber, targetId) ||
            (subKey && (
              matchStr(t.id, subKey) || 
              matchStr(t.invoiceNumber, subKey) || 
              matchStr(t.containerNumber, subKey) ||
              matchStr(t.vehicleNumber, subKey)
            )) ||
            (p.details?.tripId && matchStr(t.id, p.details.tripId)) ||
            (p.details?.containerNumber && matchStr(t.containerNumber, p.details.containerNumber)) ||
            (p.details?.invoiceNumber && matchStr(t.invoiceNumber, p.details.invoiceNumber)) ||
            (p.details?.vehicleNumber && matchStr(t.vehicleNumber, p.details.vehicleNumber)) ||
            (p.details?.tripNo && matchStr(t.invoiceNumber, p.details.tripNo)) ||
            (p.details?.tripNo && matchStr(t.containerNumber, p.details.tripNo))
          );
          
          const amountPaid = p.details.pendingItems?.[key] || 0;
          
          const file = monthlyFiles.find(f => f.id === trip?.fileId);
          const fileMonthName = file ? new Date(0, file.month - 1).toLocaleString('default', { month: 'long' }) : '';
          const fileYear = file ? file.year : '';

          let displayAllocation = '';
          if (subKey) {
            if (subKey === 'dieselPrice') displayAllocation = 'Trip Diesel';
            else if (subKey === 'generatorDiesel') displayAllocation = 'Generator Diesel';
            else if (subKey === 'extraDiesel') displayAllocation = trip?.extraDieselReason || 'Extra Diesel';
            else if (subKey === 'bonus') displayAllocation = 'Bonus';
            else displayAllocation = subKey;
          } else {
            displayAllocation = p.category;
          }

          items.push({
            id: `${p.id}-${key}`,
            paymentId: p.id,
            tripId: trip?.id || p.details?.tripId || '',
            amount: amountPaid,
            date: p.date,
            time: p.time,
            category: p.category,
            method: p.method,
            containerNumber: trip?.containerNumber || p.details?.containerNumber || 'N/A',
            invoiceNumber: trip?.invoiceNumber || p.details?.invoiceNumber || 'N/A',
            vehicleNumber: trip?.vehicleNumber || p.details?.vehicleNumber || 'N/A',
            loadingPlace: trip?.loadingPlace || p.details?.loadingPlace || 'N/A',
            deliveryPlace: trip?.deliveryPlace || p.details?.deliveryPlace || 'N/A',
            loadingDate: trip?.loadingDate || p.details?.loadingDate || 'N/A',
            companyName: trip?.companyName || p.details?.companyName || 'N/A',
            tripMonthAndYear: file ? `${fileMonthName} ${fileYear}` : 'N/A',
            month: p.month,
            year: p.year,
            tripDieselAllocations: (normCategory === 'TRIP DIESEL' && trip) ? {
              dieselPaid: subKey === 'dieselPrice' || !subKey ? amountPaid : 0,
              generatorDieselPaid: subKey === 'generatorDiesel' ? amountPaid : 0,
              extraDieselPaid: subKey === 'extraDiesel' ? amountPaid : 0,
              bonusPaid: subKey === 'bonus' ? amountPaid : 0
            } : null
          });
        });
      } else {
        // Fallback: try to find trip based on details if keys are missing
        const trip = trips.find(t => 
          matchStr(t.id, p.details?.tripId) || 
          matchStr(t.invoiceNumber, p.details?.invoiceNumber) ||
          matchStr(t.containerNumber, p.details?.containerNumber) ||
          matchStr(t.vehicleNumber, p.details?.vehicleNumber) ||
          (p.details?.containerNumber && matchStr(t.containerNumber, p.details.containerNumber)) ||
          (p.details?.invoiceNumber && matchStr(t.invoiceNumber, p.details.invoiceNumber))
        );

        const isAdvance = (p.category || '').toUpperCase() === 'ADVANCE';
        items.push({
          id: p.id,
          paymentId: p.id,
          amount: p.amount,
          date: p.date,
          time: p.time,
          category: p.category,
          method: p.method,
          containerNumber: trip?.containerNumber || p.details?.containerNumber || 'N/A',
          invoiceNumber: trip?.invoiceNumber || p.details?.invoiceNumber || 'N/A',
          vehicleNumber: trip?.vehicleNumber || p.details?.vehicleNumber || 'N/A',
          loadingPlace: trip?.loadingPlace || p.details?.loadingPlace || 'N/A',
          deliveryPlace: trip?.deliveryPlace || p.details?.deliveryPlace || 'N/A',
          loadingDate: trip?.loadingDate || p.details?.loadingDate || 'N/A',
          companyName: isAdvance ? (p.details?.advanceReason || p.details?.serviceName || p.details?.note || 'Advance Taken') : (trip?.companyName || p.details?.companyName || 'N/A'),
          note: isAdvance ? (language === 'bn' ? 'অগ্রিম পেমেন্ট' : 'Advance Payment') : (p.details?.serviceName || p.details?.bankName || p.details?.note || ''),
          month: p.month,
          year: p.year,
          tripMonthAndYear: p.details?.tripMonthAndYear || 'N/A',
          tripId: isAdvance ? p.id : (trip?.id || p.details?.tripId || ''),
          tripDieselAllocations: (normCategory === 'TRIP DIESEL') ? {
            dieselPaid: Number(p.amount) || 0,
            generatorDieselPaid: 0,
            extraDieselPaid: 0,
            bonusPaid: 0
          } : null
        });
      }
    });

    setDetailedReceivedItems(items);
    setNavigationDirection('forward');
    setShowReceivedBreakdown(true);
    setTimeout(() => {
      setSelectedReceivedCategory(category);
    }, 150);
  };

  const handleCategoryBreakdownClick = (category: string) => {
    let searchCategory = category;
    if (category === 'Vehicle Inspection') {
      searchCategory = 'EXTRA FUEL';
    }
    const allPendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments, searchCategory);
    
    let items: any[] = [];
    allPendingDues.forEach(fileGroup => {
      fileGroup.categories.forEach((catGroup: any) => {
        const catName = catGroup.name || '';
        if (catName.toUpperCase() === searchCategory.toUpperCase() ||
            (searchCategory === 'EXTRA FUEL' && catName.toUpperCase() === 'EXTRA_FUEL')) {
          const itemsWithDate = catGroup.items.map((item: any) => ({
            ...item,
            month: fileGroup.month,
            year: fileGroup.year
          }));
          items = [...items, ...itemsWithDate];
        }
      });
    });
    
    setDetailedPendingItems(items);
    setNavigationDirection('forward');
    setShowPendingBreakdown(true);
    setTimeout(() => {
      setSelectedPendingCategory(category);
    }, 150);
  };

  // Pending Dues Selection State
  const [showPendingSelection, setShowPendingSelection] = useState(false);
  const [showTripDieselSubPage, setShowTripDieselSubPage] = useState(false);
  const [enabledSubCats, setEnabledSubCats] = useState<{ [key: string]: boolean }>({
    dieselPrice: true,
    generatorDiesel: true,
    extraDiesel: true,
    bonus: true
  });
  const [showUserRenewSelection, setShowUserRenewSelection] = useState(false);
  const [renewingUser, setRenewingUser] = useState<User | null>(null);
  const [pendingDues, setPendingDues] = useState<any[]>([]);
  const [selectedPendingFile, setSelectedPendingFile] = useState<any | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({}); // itemId -> amount
  const [selectedTripGroupForPopup, setSelectedTripGroupForPopup] = useState<any | null>(null);
  const [selectedConsolidatedTripForPopup, setSelectedConsolidatedTripForPopup] = useState<any | null>(null);
  const [selectedReceivedItemForPopup, setSelectedReceivedItemForPopup] = useState<any | null>(null);

  const renderHeaderActions = () => {
    const unreadCount = (notifications || []).filter((n: any) => !n.isRead).length;
    return (
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <button 
            onClick={() => {
              setSelectedPendingCategory(null);
              setSelectedReceivedCategory(null);
              setNavigationDirection('backward');
setShowReceivedBreakdown(false);
              setNavigationDirection('backward');
setShowPendingBreakdown(false);
              setViewingCategory(null);
              setIsEntryFormOpen(false);
              setNavigationDirection('backward');
setShowPendingSelection(false);
              setNavigationDirection('backward');
setShowTripDieselSubPage(false);
              setNavigationDirection('backward');
setShowUserRenewSelection(false);
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

  useEffect(() => {
    const isOpen = !!(
      selectedTransaction ||
      selectedTripGroupForPopup ||
      selectedConsolidatedTripForPopup ||
      selectedReceivedItemForPopup ||
      selectedVehicleInspectionItem
    );
    setIsPaymentPopupOpen(isOpen);
    
    return () => {
      if (isOpen) {
        setIsPaymentPopupOpen(false);
      }
    };
  }, [
    selectedTransaction,
    selectedTripGroupForPopup,
    selectedConsolidatedTripForPopup,
    selectedReceivedItemForPopup,
    selectedVehicleInspectionItem,
    setIsPaymentPopupOpen
  ]);



  // Form State
  const [formType, setFormType] = useState<'INCOME' | 'DEDUCTION'>('INCOME');
  const [formCategory, setFormCategory] = useState('');
  const [formRemainingBalance, setFormRemainingBalance] = useState('');
  const [formAdvance, setFormAdvance] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formMethod, setFormMethod] = useState<'CASH' | 'ONLINE_BANK' | 'MOBILE_BANKING'>('CASH');
  const [formDetails, setFormDetails] = useState<any>({});

  const handleRemainingBalanceChange = (val: string) => {
    setFormRemainingBalance(val);
    const rem = parseFloat(val);
    const adv = parseFloat(formAdvance) || 0;
    if (!isNaN(rem)) {
      const net = Math.max(0, rem - adv);
      setFormAmount(net.toString());
    } else {
      setFormAmount('');
    }
  };

  const handleAdvanceChange = (val: string) => {
    setFormAdvance(val);
    const adv = parseFloat(val) || 0;
    const rem = parseFloat(formRemainingBalance);
    if (!isNaN(rem)) {
      const net = Math.max(0, rem - adv);
      setFormAmount(net.toString());
    }
  };
  
  const getBankDisplayName = (bankVal?: string) => {
    if (!bankVal) return '';
    const found = (banks || []).find((b: any) => 
      typeof b === 'object' ? (b.id === bankVal || b.name === bankVal) : b === bankVal
    );
    if (found) return typeof found === 'object' ? found.name : found;
    return bankVal;
  };

  const getBranchDisplayName = (branchVal?: string) => {
    if (!branchVal) return '';
    const found = (branches || []).find((b: any) => 
      typeof b === 'object' ? (b.id === branchVal || b.name === branchVal) : b === branchVal
    );
    if (found) return typeof found === 'object' ? found.name : found;
    return branchVal;
  };

  const availableBankOptions = useMemo(() => {
    const selectedCountryCode = formDetails.country || 'QA';
    const countryObj = (countries || []).find(c => c.code === selectedCountryCode || c.name === selectedCountryCode);
    const normalizedCountryCode = (countryObj?.code || selectedCountryCode || 'QA').toUpperCase();
    
    const countryDefaults = DEFAULT_BANKS_BY_COUNTRY[normalizedCountryCode] || DEFAULT_BANKS_BY_COUNTRY['QA'] || [];
    
    const combined = new Map<string, { label: string; value: string }>();
    
    countryDefaults.forEach(b => {
      combined.set(b.name.toLowerCase(), { label: b.name, value: b.name });
    });

    (banks || []).forEach((b: any) => {
      const name = typeof b === 'object' ? (b.name || b.id) : b;
      if (name) {
        combined.set(name.toLowerCase(), { label: name, value: typeof b === 'object' ? (b.id || b.name) : b });
      }
    });

    (bankNames || []).forEach((name: string) => {
      if (name) {
        combined.set(name.toLowerCase(), { label: name, value: name });
      }
    });

    return Array.from(combined.values());
  }, [formDetails.country, countries, banks, bankNames]);

  const availableBranchOptions = useMemo(() => {
    const selectedCountryCode = formDetails.country || 'QA';
    const countryObj = (countries || []).find(c => c.code === selectedCountryCode || c.name === selectedCountryCode);
    const normalizedCountryCode = (countryObj?.code || selectedCountryCode || 'QA').toUpperCase();
    
    const countryDefaults = DEFAULT_BANKS_BY_COUNTRY[normalizedCountryCode] || DEFAULT_BANKS_BY_COUNTRY['QA'] || [];
    const currentBankName = getBankDisplayName(formDetails.bankName);
    
    const matchedBank = countryDefaults.find(b => 
      b.name.toLowerCase() === currentBankName.toLowerCase() || 
      b.name.toLowerCase().includes(currentBankName.toLowerCase()) || 
      currentBankName.toLowerCase().includes(b.name.toLowerCase())
    );
    
    const combined = new Map<string, { label: string; value: string; routingNumber?: string; swiftCode?: string }>();
    
    if (matchedBank && matchedBank.branches) {
      matchedBank.branches.forEach(br => {
        combined.set(br.name.toLowerCase(), { 
          label: br.name, 
          value: br.name, 
          routingNumber: br.routingNumber, 
          swiftCode: br.swiftCode 
        });
      });
    }

    (branches || []).forEach((br: any) => {
      const name = typeof br === 'object' ? (br.name || br.id) : br;
      if (name) {
        if (!formDetails.bankName || !br.bankId || br.bankId === formDetails.bankName || br.bankId === currentBankName) {
          combined.set(name.toLowerCase(), { 
            label: name, 
            value: typeof br === 'object' ? (br.id || br.name) : br,
            routingNumber: br.routingNumber,
            swiftCode: br.swiftCode
          });
        }
      }
    });

    return Array.from(combined.values());
  }, [formDetails.country, formDetails.bankName, countries, branches]);

  const availableMobileProviders = useMemo(() => {
    const selectedCountryCode = formDetails.country || 'QA';
    const countryObj = (countries || []).find(c => c.code === selectedCountryCode || c.name === selectedCountryCode);
    const normalizedCountryCode = (countryObj?.code || selectedCountryCode || 'QA').toUpperCase();
    
    const countryDefaults = DEFAULT_MOBILE_WALLETS_BY_COUNTRY[normalizedCountryCode] || DEFAULT_MOBILE_WALLETS_BY_COUNTRY['QA'] || ['bKash', 'Nagad', 'Rocket', 'Upay', 'Ooredoo Money', 'Vodafone Cash'];
    
    const combined = new Map<string, { label: string; value: string }>();
    
    countryDefaults.forEach(w => {
      combined.set(w.toLowerCase(), { label: w, value: w });
    });

    (mobileBankingWallets || []).forEach((w: string) => {
      if (w) {
        combined.set(w.toLowerCase(), { label: w, value: w });
      }
    });

    return Array.from(combined.values());
  }, [formDetails.country, countries, mobileBankingWallets]);
  
  // Custom states for Advance Dialog Box pop-up
  const [advanceType, setAdvanceType] = useState<'TAKEN' | 'RETURNED'>('TAKEN');
  const [advanceReason, setAdvanceReason] = useState('');
  const [showAdvanceReasonSelect, setShowAdvanceReasonSelect] = useState(false);
  const [isPurposeDropdownOpen, setIsPurposeDropdownOpen] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isReasonFocused, setIsReasonFocused] = useState(false);
  const [advanceMethod, setAdvanceMethod] = useState<'CASH' | 'ONLINE_BANK' | 'MOBILE_BANKING'>('CASH');

  const summary = useMemo(() => 
    PaymentManager.calculateSummary(payments, selectedMonth, selectedYear),
    [payments, selectedMonth, selectedYear]
  );

  const filteredPayments = useMemo(() => 
    summary.transactions.filter(p => p.type === activeTab && p.status !== 'PENDING'),
    [summary.transactions, activeTab]
  );

  const categoryTransactions = useMemo(() => 
    viewingCategory ? summary.transactions.filter(p => p.category === viewingCategory) : [],
    [summary.transactions, viewingCategory]
  );

  const flatPendingItems = useMemo(() => {
    if (!showTripDieselSubPage || !formCategory) return [];
    const items: any[] = [];
    const seenIds = new Set<string>();

    pendingDues.forEach(file => {
      file.categories.forEach((cat: any) => {
        const catUpper = (cat.name || '').toUpperCase();
        const isMatch = (formCategory.toUpperCase() === 'TRIP DIESEL')
          ? ['TRIP DIESEL', 'FRIDAY', 'BONUS', 'OVERTIME'].includes(catUpper)
          : (formCategory.toUpperCase() === 'SALARY')
            ? ['SALARY', 'COMMISSION'].includes(catUpper)
            : catUpper === formCategory.toUpperCase();

        if (isMatch) {
          cat.items.forEach((item: any) => {
            // Apply subkey/subcategory filter ONLY for Trip Diesel
            if (formCategory.toUpperCase() === 'TRIP DIESEL') {
              const subType = item.details?.subType;
              if (subType && enabledSubCats[subType as keyof typeof enabledSubCats] === false) {
                return;
              }
            }
            
            // Deduplicate to prevent duplicates from overlapping category lists (e.g. Trip Diesel and Bonus categories both including bonus)
            if (seenIds.has(item.id)) {
              return;
            }
            seenIds.add(item.id);

            items.push({
              ...item,
              category: catUpper,
              fileId: file.fileId,
              month: file.month,
              year: file.year,
              monthName: new Date(2026, file.month - 1).toLocaleString('en-US', { month: 'long' })
            });
          });
        }
      });
    });
    return items;
  }, [pendingDues, showTripDieselSubPage, formCategory, enabledSubCats]);

  const groupedTripItems = useMemo(() => {
    const groups: { [groupKey: string]: {
      tripId: string;
      tripDetails: any;
      monthName: string;
      month: number;
      year: number;
      date: string;
      category?: string;
      items: any[];
    } } = {};

    flatPendingItems.forEach(item => {
      const parsed = parsePendingItemKey(item.id);
      let groupKey = parsed.tripId || item.id;
      
      const itemCategory = item.category || formCategory;

      if (['COMMISSION', 'SALARY'].includes(formCategory?.toUpperCase() || '')) {
         groupKey = `MonthWise-${itemCategory}-${item.monthName}-${item.year}`;
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          tripId: groupKey, 
          tripDetails: item.details || {},
          monthName: item.monthName,
          month: item.month,
          year: item.year,
          date: item.date,
          category: itemCategory,
          items: []
        };
        if (['COMMISSION', 'SALARY'].includes(formCategory?.toUpperCase() || '')) {
           groups[groupKey].tripDetails = {
              ...groups[groupKey].tripDetails,
              companyName: user?.companyName || 'N/A'
           };
        }
      }
      
      groups[groupKey].items.push(item);
    });

    const result = Object.values(groups);
    if (['COMMISSION', 'SALARY'].includes(formCategory?.toUpperCase() || '')) {
      result.sort((a, b) => {
        const aCat = (a.category || '').toUpperCase();
        const bCat = (b.category || '').toUpperCase();
        if (aCat === 'SALARY' && bCat !== 'SALARY') return -1;
        if (aCat !== 'SALARY' && bCat === 'SALARY') return 1;
        
        // If they are the same category, sort by year descending, then month descending
        if (a.year !== b.year) {
          return b.year - a.year;
        }
        return b.month - a.month;
      });
    }

    return result;
  }, [flatPendingItems, formCategory, user?.companyName]);

  const subTypeTotals = useMemo(() => {
    const totals = { dieselPrice: 0, generatorDiesel: 0, extraDiesel: 0, bonus: 0, friday: 0, commission: 0, overtime: 0 };
    pendingDues.forEach(file => {
      file.categories.forEach((cat: any) => {
        const catUpper = (cat.name || '').toUpperCase();
        if (catUpper === 'TRIP DIESEL') {
          cat.items.forEach((item: any) => {
            const subType = item.details?.subType as keyof typeof totals;
            if (subType && totals[subType] !== undefined) {
              totals[subType] += item.pending || 0;
            }
          });
        } else if (catUpper === 'FRIDAY') {
          cat.items.forEach((item: any) => {
            totals.friday += item.pending || 0;
          });
        } else if (catUpper === 'COMMISSION') {
          cat.items.forEach((item: any) => {
            totals.commission += item.pending || 0;
          });
        } else if (catUpper === 'OVERTIME') {
          cat.items.forEach((item: any) => {
            totals.overtime += item.pending || 0;
          });
        }
      });
    });
    return totals;
  }, [pendingDues]);

  const handleSubCatToggle = (subKey: string) => {
    const nextEnabled = !enabledSubCats[subKey];
    setEnabledSubCats(prev => ({ ...prev, [subKey]: nextEnabled }));

    const items: any[] = [];
    pendingDues.forEach(file => {
      file.categories.forEach((cat: any) => {
        if ((cat.name || '').toUpperCase() === 'TRIP DIESEL') {
          cat.items.forEach((item: any) => {
            if (item.details?.subType === subKey) {
              items.push(item);
            }
          });
        }
      });
    });

    const newSelected = { ...selectedItems };
    items.forEach(item => {
      if (nextEnabled) {
        newSelected[item.id] = item.pending;
      } else {
        delete newSelected[item.id];
      }
    });
    setSelectedItems(newSelected);
  };

  const handleTripDieselAllocationSave = () => {
    const totalAmount = (Object.values(selectedItems) as number[]).reduce((sum, val) => sum + (val || 0), 0);
    if (totalAmount > 0) {
      setFormRemainingBalance(totalAmount.toString());
      const adv = parseFloat(formAdvance) || 0;
      const net = Math.max(0, totalAmount - adv);
      setFormAmount(net.toString());
      setFormDetails({ ...formDetails, pendingItems: selectedItems, remainingBalance: totalAmount });
      
      const firstItemId = Object.keys(selectedItems)[0];
      if (firstItemId) {
        const tripId = firstItemId.split('-')[0];
        const trip = trips.find(t => t.id === tripId);
        const file = monthlyFiles.find(f => f.id === trip?.fileId);
        if (file) setCurrentFile(file);
      }
      showFeedback(`Allocated ${totalAmount.toLocaleString()} from Trip Diesel`);
    } else {
      setFormRemainingBalance('');
      setFormAmount('');
      const cleanedDetails = { ...formDetails };
      delete cleanedDetails.pendingItems;
      delete cleanedDetails.remainingBalance;
      setFormDetails(cleanedDetails);
    }
    setNavigationDirection('backward');
setShowTripDieselSubPage(false);
  };

  const handleCategoryChange = (category: string) => {
    setShowCategorySelect(false);
    setSelectedItems({}); // Reset selected items when category changes
    
    setFormCategory(category);

    if (category === 'User Renew') {
      setNavigationDirection('forward');
      setTimeout(() => {
        setShowUserRenewSelection(true);
      }, 150);
      return;
    }

    if (formType === 'INCOME') {
      const isTripDiesel = category.toUpperCase() === 'TRIP DIESEL';
      const isSalary = category.toUpperCase() === 'SALARY';
      const rawDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments, (isTripDiesel || isSalary) ? undefined : category);
      
      let dues = rawDues;
      if (isSalary) {
        dues = rawDues.map(file => {
          const salaryCats = file.categories.filter((cat: any) => 
            ['SALARY', 'COMMISSION'].includes((cat.name || '').toUpperCase())
          );
          if (salaryCats.length > 0) {
            return {
              ...file,
              categories: salaryCats,
              totalPending: salaryCats.reduce((sum: number, c: any) => sum + c.totalPending, 0)
            };
          }
          return null;
        }).filter(Boolean) as any[];
      }

      if (dues.length > 0) {
        setPendingDues(dues);
        const initialSelection: { [key: string]: number } = {};
        dues.forEach(file => {
          file.categories.forEach((cat: any) => {
            const catUpper = (cat.name || '').toUpperCase();
            const isMatch = isTripDiesel
              ? ['TRIP DIESEL', 'FRIDAY', 'BONUS', 'OVERTIME'].includes(catUpper)
              : isSalary 
                ? ['SALARY', 'COMMISSION'].includes(catUpper)
                : catUpper === category.toUpperCase();

            if (isMatch) {
              cat.items.forEach((item: any) => {
                initialSelection[item.id] = item.pending;
              });
            }
          });
        });
        setSelectedItems({}); // Do not pre-fill selected items per user request to keep them unchecked by default
        if (isTripDiesel) {
          setEnabledSubCats({
            dieselPrice: true,
            generatorDiesel: true,
            extraDiesel: true,
            bonus: true,
            friday: true,
            overtime: true
          });
        }
        setNavigationDirection('forward');
        setTimeout(() => {
          setShowTripDieselSubPage(true);
        }, 150);
      } else if (['TRIP DIESEL', 'COMMISSION', 'FRIDAY', 'BONUS', 'SALARY', 'OVERTIME'].includes(category.toUpperCase())) {
        showFeedback('No pending dues found for this category');
      }
    }
  };

  const handlePendingItemSelect = (itemId: string, amount: number, isSelected: boolean) => {
    const newSelected = { ...selectedItems };
    if (isSelected) {
      newSelected[itemId] = amount;
    } else {
      delete newSelected[itemId];
    }
    setSelectedItems(newSelected);
  };

  const handlePendingItemAmountChange = (itemId: string, amount: number) => {
    if (selectedItems[itemId] !== undefined) {
      setSelectedItems({ ...selectedItems, [itemId]: amount });
    }
  };

  const handlePendingSelectionNext = () => {
    const totalAmount = (Object.values(selectedItems) as number[]).reduce((sum, val) => sum + val, 0);
    if (totalAmount > 0) {
      setFormRemainingBalance(totalAmount.toString());
      const adv = parseFloat(formAdvance) || 0;
      const net = Math.max(0, totalAmount - adv);
      setFormAmount(net.toString());
      // Store selected items in details for reference
      setFormDetails({ ...formDetails, pendingItems: selectedItems, remainingBalance: totalAmount });
      
      // Update current file to the selected pending file so the payment is linked correctly
      if (selectedPendingFile) {
        const file = monthlyFiles.find(f => f.id === selectedPendingFile.fileId);
        if (file) setCurrentFile(file);
      }
    } else {
      setFormRemainingBalance('');
      setFormAmount('');
    }
    setNavigationDirection('backward');
setShowPendingSelection(false);
    setSelectedPendingFile(null);
    setSelectedItems({}); // Clear selection after moving to form
  };

  const handleRenewUserSelect = (selectedUser: User) => {
    setRenewingUser(selectedUser);
    setFormCategory('User Renew');
    const price = selectedUser.price && selectedUser.price !== '0' ? selectedUser.price : '';
    setFormRemainingBalance(price);
    const adv = parseFloat(formAdvance) || 0;
    const rem = parseFloat(price) || 0;
    const net = Math.max(0, rem - adv);
    setFormAmount(price ? net.toString() : '');
    setFormDetails({ 
      ...formDetails, 
      userId: selectedUser.id, 
      userName: selectedUser.name,
      serviceName: `Renewal - ${selectedUser.duration || 'Monthly'}`,
      remainingBalance: price ? parseFloat(price) : undefined
    });
    setNavigationDirection('backward');
setShowUserRenewSelection(false);
    setIsEntryFormOpen(true);
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
        companyName: user?.companyName || 'Company',
      },
      userId: user?.id || 'USR1001',
      month: targetMonth,
      year: targetYear,
      status: 'RECEIVED'
    };

    addPayment(newPayment);
    setIsEntryFormOpen(false);
    setFormCategory('');
    setAdvanceAmount('');
    setAdvanceReason('');
    setAdvanceType('TAKEN');
    showFeedback('Advance transaction completed successfully!');
  };

  const handleSubmit = () => {
    if (!formCategory || !formAmount) {
      showFeedback('Please fill all required fields');
      return;
    }

    // Handle User Renewal
    if (formCategory === 'User Renew' && renewingUser) {
        let startDate = new Date();
        if (renewingUser.expiryDate) {
            const expiry = new Date(renewingUser.expiryDate);
            if (expiry > new Date()) {
                startDate = expiry;
            }
        }

        const duration = renewingUser.duration || '1 Month';
        const match = duration.match(/(\d+)\s*(Month|Year)/i);
        let quantity = 1;
        let unit = 'Month';
        if (match) {
            quantity = parseInt(match[1]);
            unit = match[2];
        } else if (((duration || "").toLowerCase()).includes('year')) {
             unit = 'Year';
        }

        const newExpiry = new Date(startDate);
        if (((unit || "").toLowerCase()).startsWith('year')) {
            newExpiry.setFullYear(newExpiry.getFullYear() + quantity);
        } else {
            newExpiry.setMonth(newExpiry.getMonth() + quantity);
        }

        const updatedUser = {
            ...renewingUser,
            expiryDate: newExpiry.toISOString().split('T')[0],
            status: 'ENABLED' as const,
            statusTimestamp: new Date().toLocaleString()
        };
        
        updateUser(updatedUser);
        
        // Update form details to include new expiry
        formDetails.newExpiryDate = updatedUser.expiryDate;
        formDetails.previousExpiryDate = renewingUser.expiryDate;
    }

    // 2. Build or augment details with pending Items
    let finalDetails = { 
      ...formDetails, 
      note: formNote,
      remainingBalance: formRemainingBalance ? parseFloat(formRemainingBalance) : undefined,
      advanceDeducted: formAdvance ? parseFloat(formAdvance) : undefined
    };
    const amountVal = parseFloat(formAmount) || 0;

    if (editingPayment) {
      updatePayment({
        ...editingPayment,
        amount: amountVal,
        category: formCategory,
        method: formMethod,
        details: {
          ...editingPayment.details,
          ...finalDetails
        }
      });
      showFeedback('Transaction updated successfully');
      setEditingPayment(null);
      setIsEntryFormOpen(false);
      resetForm();
      setView('DASHBOARD');
      return;
    }

    // Auto-link to pending dues if none selected explicitly
    const tripLinkedCategories = ['COMMISSION', 'TRIP DIESEL', 'EXTRA FUEL', 'FRIDAY', 'BONUS', 'OVERTIME', 'SALARY'];
    if (formType === 'INCOME' && tripLinkedCategories.includes(formCategory.toUpperCase()) && (!finalDetails.pendingItems || Object.keys(finalDetails.pendingItems).length === 0)) {
        const pendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments, formCategory);
        let remainingAmount = amountVal;
        let linkedItems: { [key: string]: number } = {};

        for (const fileGroup of pendingDues) {
            if (remainingAmount <= 0) break;
            const catGroup = fileGroup.categories.find((c: any) => (c.name || '').toUpperCase() === formCategory.toUpperCase());
            if (catGroup && catGroup.items.length > 0) {
                for (const item of catGroup.items) {
                    if (remainingAmount <= 0) break;
                    const amountToLink = Math.min(item.pending, remainingAmount);
                    if (amountToLink > 0) {
                        linkedItems[item.id] = amountToLink;
                        remainingAmount -= amountToLink;
                    }
                }
            }
        }
        
        if (Object.keys(linkedItems).length > 0) {
            finalDetails.pendingItems = linkedItems;
        }
    }

    // Check if we are receiving direct PENDING payments (either manually selected or auto-linked)
    const pendingPaymentIds = Object.keys(finalDetails.pendingItems || {}).filter(id => 
      payments.some(p => p.id === id && p.status === 'PENDING')
    );

    if (pendingPaymentIds.length > 0) {
      const now = new Date();
      
      pendingPaymentIds.forEach(id => {
        const existingPayment = payments.find(p => p.id === id);
        if (existingPayment) {
          const targetMonth = existingPayment.month;
          const targetYear = existingPayment.year;
          const targetDay = Math.min(now.getDate(), new Date(targetYear, targetMonth, 0).getDate());
          const pad = (n: number) => String(n).padStart(2, '0');
          const currentDate = `${targetYear}-${pad(targetMonth)}-${pad(targetDay)}`;
          const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

          const receivedAmount = finalDetails.pendingItems[id];
          
          if (receivedAmount < existingPayment.amount) {
            // Partial Payment: Update existing to remaining, create new for received
            const remainingAmount = existingPayment.amount - receivedAmount;
            
            // 1. Update existing payment (keep as PENDING with reduced amount)
            updatePayment({
              ...existingPayment,
              amount: remainingAmount
            });

            // 2. Create new RECEIVED payment
            const receivedPayment: Payment = {
              id: Math.random().toString(36).substr(2, 9),
              transactionId: PaymentManager.generateTransactionId(),
              amount: receivedAmount,
              date: currentDate,
              time: currentTime,
              type: 'INCOME',
              category: existingPayment.category,
              method: formMethod,
              details: (() => {
                const combinedDetails = {
                  ...existingPayment.details,
                  ...finalDetails,
                  parentPendingId: existingPayment.id
                };
                
                const pItems: Record<string, number> = {};
                if (existingPayment.details?.pendingItems && Object.keys(existingPayment.details.pendingItems).length > 0) {
                  const origKeys = Object.keys(existingPayment.details.pendingItems);
                  if (origKeys.length === 1) {
                    pItems[origKeys[0]] = receivedAmount;
                  } else {
                    const totalOrig: number = Object.values(existingPayment.details.pendingItems).reduce<number>((sum: number, v: any) => sum + (Number(v) || 0), 0);
                    origKeys.forEach(k => {
                      const origVal = Number(existingPayment.details!.pendingItems![k]) || 0;
                      pItems[k] = totalOrig > 0 ? (origVal / totalOrig) * receivedAmount : 0;
                    });
                  }
                } else {
                  pItems[existingPayment.id] = receivedAmount;
                }
                
                combinedDetails.pendingItems = pItems;
                return combinedDetails;
              })(),
              userId: existingPayment.userId,
              month: existingPayment.month,
              year: existingPayment.year,
              status: 'RECEIVED'
            };
            addPayment(receivedPayment);
          } else {
            // Full Payment: Just mark as RECEIVED
            const mergedDetails = { 
              ...existingPayment.details, 
              ...finalDetails,
              pendingItems: existingPayment.details?.pendingItems || finalDetails.pendingItems
            };
            
            updatePayment({
              ...existingPayment,
              status: 'RECEIVED',
              method: formMethod,
              details: mergedDetails,
              category: formCategory,
              amount: receivedAmount,
              date: currentDate,
              time: currentTime,
              month: existingPayment.month,
              year: existingPayment.year
            });
          }
        }
      });
      showFeedback('Payment processed successfully');
      setIsEntryFormOpen(false);
      resetForm();
      setView('DASHBOARD');
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
      transactionId: PaymentManager.generateTransactionId(),
      amount: amountVal,
      date: currentDate,
      time: currentTime,
      type: formType,
      category: formCategory,
      method: formMethod,
      details: finalDetails,
      userId: renewingUser ? renewingUser.id : (user?.id || 'USR1001'),
      month: targetMonth,
      year: targetYear,
      monthlyFileId: currentFile?.id,
      status: 'RECEIVED'
    };

    addPayment(newPayment);
    showFeedback('Transaction submitted successfully');
    setIsEntryFormOpen(false);
    setRenewingUser(null);
    resetForm();
    setView('DASHBOARD');
  };

  const resetForm = () => {
    setFormCategory('');
    setFormRemainingBalance('');
    setFormAdvance('');
    setFormAmount('');
    setFormNote('');
    setFormMethod('CASH');
    setFormDetails({});
    setSelectedItems({});
    setEditingPayment(null);
  };

  // Reset form inputs specifically when the entry form is closed or when navigating away/tab clicked again
  useEffect(() => {
    if (!isEntryFormOpen) {
      resetForm();
    }
  }, [isEntryFormOpen]);

  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      setIsEntryFormOpen(false);
      resetForm();
    };
  }, []);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const monthsList = useMemo(() => [
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
  ], [language]);
  const yearsList = useMemo(() => Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i), []);

  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);

  // States for received list filters bottom sheets
  const [isReceivedMonthSelectOpen, setIsReceivedMonthSelectOpen] = useState(false);
  const [isReceivedYearSelectOpen, setIsReceivedYearSelectOpen] = useState(false);

  // States for pending list filters bottom sheets
  const [isPendingListMonthSelectOpen, setIsPendingListMonthSelectOpen] = useState(false);
  const [isPendingListYearSelectOpen, setIsPendingListYearSelectOpen] = useState(false);

  // States for pending details filters bottom sheets
  const [isPendingMonthSelectOpen, setIsPendingMonthSelectOpen] = useState(false);
  const [isPendingYearSelectOpen, setIsPendingYearSelectOpen] = useState(false);

  // States for received subpage filters bottom sheets
  const [isReceivedSubpageMonthSelectOpen, setIsReceivedSubpageMonthSelectOpen] = useState(false);
  const [isReceivedSubpageYearSelectOpen, setIsReceivedSubpageYearSelectOpen] = useState(false);

  const totalGlobalPending = useMemo(() => {
    return payments
      .filter(p => p.type === 'INCOME' && p.status === 'PENDING')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [payments]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { pending: number, received: number }> = {
      'SALARY': { pending: 0, received: 0 },
      'COMMISSION': { pending: 0, received: 0 },
      'FRIDAY': { pending: 0, received: 0 },
      'BONUS': { pending: 0, received: 0 },
      'TRIP DIESEL': { pending: 0, received: 0 },
      'EXTRA FUEL': { pending: 0, received: 0 },
      'ADVANCE': { pending: 0, received: 0 },
      'OTHERS': { pending: 0, received: 0 },
    };
    
    // 1. Process Received Payments for the selected month/year
    payments.forEach(p => {
      const monthMatch = selectedMonth === 'ALL' ? true : Number(p.month) === Number(selectedMonth);
      const yearMatch = selectedYear === 'ALL' ? true : Number(p.year) === Number(selectedYear);
      if (monthMatch && yearMatch) {
        const catKey = (p.category || 'OTHERS').toUpperCase();
        if (catKey === 'USER RENEW') return;
        if (!breakdown[catKey]) {
          breakdown[catKey] = { pending: 0, received: 0 };
        }
        if (p.status === 'RECEIVED') {
          const pAmount = Number(p.amount) || 0;
          if (p.type === 'INCOME') {
            if (catKey === 'ADVANCE' && p.details?.advanceType !== 'RETURNED') {
              const reason = (p.details?.advanceReason || p.details?.serviceName || '').toLowerCase();
              const hasTarget = reason.includes('diesel') || reason.includes('ডিজেল') ||
                             reason.includes('salary') || reason.includes('স্যালারি') ||
                             reason.includes('commission') || reason.includes('কমিশন') ||
                             reason.includes('friday') || reason.includes('ফ্রাইডে') ||
                             reason.includes('bonus') || reason.includes('বোনাস') ||
                             reason.includes('overtime') || reason.includes('ওভারটাইম') ||
                             reason.includes('extra fuel') || reason.includes('এক্সট্রা ফুয়েল') || reason.includes('extra_fuel');
              if (!hasTarget) {
                breakdown[catKey].received -= pAmount;
              }
            } else {
              breakdown[catKey].received += pAmount;
            }
          } else if (p.type === 'DEDUCTION') {
            if (catKey === 'ADVANCE' && p.details?.advanceType === 'RETURNED') {
              breakdown['ADVANCE'].received += pAmount;
            }
          }
        }
      }
    });

    // 2. Process Trip Dues for the selected month/year using PaymentManager
    // This correctly handles trip dues and avoids double-counting with PENDING payments
    const pendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments);
    const matchingPending = pendingDues.filter(p => {
      const mMatch = selectedMonth === 'ALL' ? true : Number(p.month) === Number(selectedMonth);
      const yMatch = selectedYear === 'ALL' ? true : Number(p.year) === Number(selectedYear);
      return mMatch && yMatch;
    });
    
    matchingPending.forEach(currentMonthPending => {
      currentMonthPending.categories.forEach((cat: any) => {
        const catKey = (cat.name || 'OTHERS').toUpperCase();
        if (!breakdown[catKey]) {
          breakdown[catKey] = { pending: 0, received: 0 };
        }
        const amount = Number(cat.totalPending) || 0;
        breakdown[catKey].pending += amount;
      });
    });

    // 3. For any Advance TAKEN, deduct only the unadjusted active advance from the target category's pending balance
    const categoriesToCheck = ['TRIP DIESEL', 'SALARY', 'COMMISSION', 'FRIDAY', 'BONUS', 'OVERTIME', 'EXTRA FUEL', 'OTHERS'];
    categoriesToCheck.forEach(catKey => {
      const unadjustedAdv = getCategoryUnadjustedAdvance(payments, catKey, selectedMonth, selectedYear);
      if (!breakdown[catKey]) {
        breakdown[catKey] = { pending: 0, received: 0 };
      }
      breakdown[catKey].pending = Math.max(0, (breakdown[catKey].pending || 0) - unadjustedAdv);
    });

    return breakdown;
  }, [payments, trips, monthlyFiles, selectedMonth, selectedYear]);

  const totalMonthPending = useMemo(() => {
    const total: number = (Object.values(categoryBreakdown) as any[]).reduce((sum: number, data: any) => sum + (Number(data.pending) || 0), 0);
    return isNaN(total) ? 0 : total;
  }, [categoryBreakdown]);

  const renderEntryFormContent = () => (
    <div className={isDesktop ? 'space-y-6' : 'flex-1 overflow-y-auto p-4 sm:p-6 pb-[60px] space-y-6 min-h-0'}>
      {/* Type Selector Card */}
      <div className="bg-theme-card px-4 py-4 rounded-[10px] shadow-sm space-y-2">
        <label className="block text-[10px] font-black uppercase text-text-main tracking-widest mb-1">{t.TRANSACTION_TYPE || "Transaction Type"}</label>
        <div className="flex bg-nested-card border border-black/5 dark:border-white/5 rounded-[10px] items-center shadow-sm relative">
          <button 
            onClick={() => { setFormType('INCOME'); setFormCategory(''); }}
            className={`relative flex-1 py-3 px-6 rounded-[10px] font-bold text-sm  z-10 ${
              formType === 'INCOME' 
                ? 'text-white shadow-md' 
                : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {formType === 'INCOME' && (
              <div
                className="absolute inset-0 bg-emerald-500 rounded-[10px] -z-10 animate-none"
              />
            )}
            Receive
          </button>
          <button 
            onClick={() => { setFormType('DEDUCTION'); setFormCategory(''); }}
            className={`relative flex-1 py-3 px-6 rounded-[10px] font-bold text-sm transition-all z-10 ${
              formType === 'DEDUCTION' 
                ? 'text-white shadow-md' 
                : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
            }`}
          >
            {formType === 'DEDUCTION' && (
              <div
                className="absolute inset-0 bg-rose-500 rounded-[10px] -z-10 animate-none"
              />
            )}
            Deduction
          </button>
        </div>
      </div>

      {/* Category Selector Card */}
      <div className="bg-theme-card px-4 py-4 rounded-[10px] shadow-sm space-y-1">
        <label className="block text-[10px] font-black uppercase text-text-main tracking-widest mb-1">{t.CATEGORY || "Category"}</label>
        <button 
          onClick={() => setShowCategorySelect(true)}
          className="w-full h-14 px-4 rounded-[10px] bg-nested-card border border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-text-main mt-1"
        >
          {formCategory || 'Select Category'}
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Payment Method Card */}
      <div className="bg-theme-card px-4 py-4 rounded-[10px] shadow-sm space-y-2">
        <label 
          className="block text-[10px] font-black uppercase tracking-widest mb-1"
          style={{ color: dynamicTextColor }}
        >
          {t.PAYMENT_METHOD || 'Payment Method'}
        </label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {[
            { id: 'CASH', label: 'Cash', icon: <Banknote size={18} />, color: '#10b981' },
            { id: 'ONLINE_BANK', label: 'Bank', icon: <CreditCard size={18} />, color: '#10b981' },
            { id: 'MOBILE_BANKING', label: 'Mobile', icon: <Smartphone size={18} />, color: '#8b5cf6' }
          ].map(m => (
            <button 
              key={m.id}
              onClick={() => setFormMethod(m.id as any)}
              className={`relative flex flex-col items-center justify-center gap-2 h-20 rounded-[10px] border transition-all duration-300 ${
                formMethod === m.id 
                  ? 'text-white scale-105 shadow-lg border-transparent' 
                  : 'bg-nested-card border-black/5 dark:border-white/5 text-text-main hover:bg-black/5 dark:hover:bg-white/5 mb-0'
              }`}
            >
              {formMethod === m.id && (
                <div
                  className={`absolute inset-0 rounded-[10px] animate-none`}
                  style={{ backgroundColor: m.color }}
                />
              )}
              <div className="relative z-10 flex flex-col items-center gap-2">
                {m.icon}
                <span className="text-[10px] font-bold uppercase tracking-tighter">{m.label}</span>
              </div>
              {formMethod === m.id && (
                <div 
                  
                  
                  className="absolute -top-1 -right-1 w-5 h-5 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-md z-20"
                >
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

        <div key="method-container">
          {formMethod === 'ONLINE_BANK' && (
              <div 
                key="bank"
                className="bg-theme-card px-4 py-4 rounded-[10px] shadow-sm space-y-4 animate-none"
                style={{ transition: 'none' }}
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-main tracking-widest">{t.COUNTRY || "Country"}</label>
                  <button 
                    type="button"
                    onClick={() => setShowCountrySelect(true)}
                    className="w-full h-14 px-4 rounded-[10px] bg-nested-card border border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-text-main"
                  >
                    {formDetails.country ? (
                      <span className="flex items-center gap-2 truncate">
                        <span>{countries.find(c => c.code === formDetails.country || c.name === formDetails.country)?.flag || '🌐'}</span>
                        <span className="truncate">{countries.find(c => c.code === formDetails.country || c.name === formDetails.country)?.name || formDetails.country}</span>
                      </span>
                    ) : (
                      <span>Select Country</span>
                    )}
                    <ChevronDown size={16} className="shrink-0" />
                  </button>
                </div>
              <GlobalFullscreenSelect 
                isOpen={showCountrySelect}
                onClose={() => setShowCountrySelect(false)}
                title="Select Country"
                selectedValue={formDetails.country}
                options={countries.map(c => ({ label: c.name, value: c.code, icon: c.flag }))}
                onSelect={(val) => {
                  setFormDetails((prev: any) => ({ 
                    ...prev, 
                    country: val,
                    bankName: '',
                    branchName: '',
                    routingNumber: '',
                    swiftCode: ''
                  }));
                  setShowCountrySelect(false);
                }}
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-main tracking-widest">{t.BANK_NAME || "Bank Name"}</label>
                <button 
                  type="button"
                  onClick={() => setShowBankSelect(true)}
                  className="w-full h-14 px-4 rounded-[10px] bg-nested-card border border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-text-main"
                >
                  <span className="truncate">{getBankDisplayName(formDetails.bankName) || 'Select Bank'}</span>
                  <ChevronDown size={16} className="shrink-0" />
                </button>
              </div>
              <GlobalFullscreenSelect 
                isOpen={showBankSelect}
                onClose={() => setShowBankSelect(false)}
                title="Select Bank"
                selectedValue={formDetails.bankName}
                options={availableBankOptions}
                onSelect={(val) => {
                  setFormDetails((prev: any) => ({ 
                    ...prev, 
                    bankName: val,
                    branchName: '',
                    routingNumber: '',
                    swiftCode: ''
                  }));
                  setShowBankSelect(false);
                }}
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-main tracking-widest">{t.BRANCH_NAME || "Branch Name"}</label>
                <button 
                  type="button"
                  onClick={() => setShowBranchSelect(true)}
                  className="w-full h-14 px-4 rounded-[10px] bg-nested-card border border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-text-main"
                >
                  <span className="truncate">{getBranchDisplayName(formDetails.branchName) || 'Select Branch'}</span>
                  <ChevronDown size={16} className="shrink-0" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-main tracking-widest">{t.ROUTING_NUMBER || "Routing Number"}</label>
                  <div className="w-full h-14 px-4 rounded-[10px] bg-nested-card border border-black/5 dark:border-white/5 flex items-center text-xs font-bold text-text-muted">
                    <span className="truncate">{formDetails.routingNumber || 'Auto-filled'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-main tracking-widest">{t.SWIFT_CODE || "SWIFT Code"}</label>
                  <div className="w-full h-14 px-4 rounded-[10px] bg-nested-card border border-black/5 dark:border-white/5 flex items-center text-xs font-bold text-text-muted">
                    <span className="truncate">{formDetails.swiftCode || 'Auto-filled'}</span>
                  </div>
                </div>
              </div>

              <GlobalFullscreenSelect 
                isOpen={showBranchSelect}
                onClose={() => setShowBranchSelect(false)}
                title="Select Branch"
                selectedValue={formDetails.branchName}
                options={availableBranchOptions}
                onSelect={(val) => {
                  const selectedBranch = availableBranchOptions.find(b => b.value === val || b.label === val);
                  const storeBranch = (branches || []).find((b: any) => typeof b === 'object' && (b.id === val || b.name === val));
                  
                  setFormDetails((prev: any) => ({ 
                    ...prev, 
                    branchName: val,
                    routingNumber: selectedBranch?.routingNumber || storeBranch?.routingNumber || prev.routingNumber || '',
                    swiftCode: selectedBranch?.swiftCode || storeBranch?.swiftCode || prev.swiftCode || '',
                    accountTitle: storeBranch?.accountTitle || prev.accountTitle || '',
                    accountNumber: storeBranch?.accountNumber || prev.accountNumber || ''
                  }));
                  setShowBranchSelect(false);
                }}
              />

              <InputField 
                label={t.ACCOUNT_TITLE || "Account Title"}
                name="accountTitle"
                type="text"
                value={formDetails.accountTitle || ''}
                onChange={(e) => setFormDetails((prev: any) => ({ ...prev, accountTitle: e.target.value }))}
              />
              
              <InputField 
                label={t.ACCOUNT_NUMBER || "Account Number"}
                name="accountNumber"
                type="tel"
                inputMode="numeric"
                value={formDetails.accountNumber || ''}
                onChange={(e) => setFormDetails((prev: any) => ({ ...prev, accountNumber: e.target.value }))}
              />

              <InputField 
                label={t.TRANSACTION_ID_REFERENCE || "Transaction ID / Reference"}
                name="reference"
                type="text"
                value={formDetails.reference || ''}
                onChange={(e) => setFormDetails((prev: any) => ({ ...prev, reference: e.target.value }))}
              />
            </div>
          )}

          {formMethod === 'MOBILE_BANKING' && (
              <div 
                key="mobile"
                className="bg-theme-card px-4 py-4 rounded-[10px] shadow-sm space-y-4 animate-none"
                style={{ transition: 'none' }}
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-main tracking-widest">{t.COUNTRY || "Country"}</label>
                  <button 
                    type="button"
                    onClick={() => setShowCountrySelect(true)}
                    className="w-full h-14 px-4 rounded-[10px] bg-nested-card border border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-text-main"
                  >
                    {formDetails.country ? (
                      <span className="flex items-center gap-2 truncate">
                        <span>{countries.find(c => c.code === formDetails.country || c.name === formDetails.country)?.flag || '🌐'}</span>
                        <span className="truncate">{countries.find(c => c.code === formDetails.country || c.name === formDetails.country)?.name || formDetails.country}</span>
                      </span>
                    ) : (
                      <span>Select Country</span>
                    )}
                    <ChevronDown size={16} className="shrink-0" />
                  </button>
                </div>
              <GlobalFullscreenSelect 
                isOpen={showCountrySelect}
                onClose={() => setShowCountrySelect(false)}
                title="Select Country"
                selectedValue={formDetails.country}
                options={countries.map(c => ({ label: c.name, value: c.code, icon: c.flag }))}
                onSelect={(val) => {
                  setFormDetails((prev: any) => ({ 
                    ...prev, 
                    country: val,
                    serviceName: ''
                  }));
                  setShowCountrySelect(false);
                }}
              />

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-main tracking-widest">{t.SERVICE_PROVIDER || "Service Provider"}</label>
                <button 
                  type="button"
                  onClick={() => setShowServiceProviderSelect(true)}
                  className="w-full h-14 px-4 rounded-[10px] bg-nested-card border border-black/5 dark:border-white/5 flex items-center justify-between text-xs font-bold text-text-main"
                >
                  <span className="truncate">{formDetails.serviceName || 'Select Provider'}</span>
                  <ChevronDown size={16} className="shrink-0" />
                </button>
              </div>
              <GlobalFullscreenSelect 
                isOpen={showServiceProviderSelect}
                onClose={() => setShowServiceProviderSelect(false)}
                title="Select Provider"
                selectedValue={formDetails.serviceName}
                options={availableMobileProviders}
                onSelect={(val) => {
                  setFormDetails((prev: any) => ({ ...prev, serviceName: val }));
                  setShowServiceProviderSelect(false);
                }}
              />
              <InputField 
                label={t.WALLET_NUMBER || "Wallet Number"}
                name="wallet"
                type="tel"
                inputMode="numeric"
                value={formDetails.walletNumber || ''}
                onChange={(e) => setFormDetails((prev: any) => ({ ...prev, walletNumber: e.target.value }))}
              />
              <InputField 
                label={t.TRANSACTION_ID || "Transaction ID"}
                name="transactionId"
                type="text"
                value={formDetails.transactionId || ''}
                onChange={(e) => setFormDetails((prev: any) => ({ ...prev, transactionId: e.target.value }))}
              />
            </div>
          )}
        </div>

      <GlobalFullscreenSelect 
        isOpen={showCategorySelect}
        onClose={() => setShowCategorySelect(false)}
        title="Select Category"
        selectedValue={formCategory}
        options={(formType === 'INCOME' ? INCOME_CATEGORIES : DEDUCTION_CATEGORIES)
          .filter(cat => cat !== 'User Renew')
        }
        onSelect={(val) => handleCategoryChange(val)}
      />

      <GlobalFullscreenSelect 
        isOpen={showAdvanceReasonSelect}
        onClose={() => setShowAdvanceReasonSelect(false)}
        title={t.SELECT_PURPOSE || 'Select Purpose'}
        selectedValue={advanceReason}
        options={(advanceReasons || []).map(r => ({ label: r, value: r }))}
        onSelect={(val) => setAdvanceReason(val)}
      />

        {/* Amount Card */}
        <div className="bg-theme-card px-4 py-4 rounded-[10px] shadow-sm space-y-4">
          <InputField 
            label={language === 'bn' ? 'রিমাইনিং ব্যালেন্স' : 'Remaining Balance'}
            name="remainingBalance"
            type="tel"
            inputMode="decimal"
            value={formRemainingBalance}
            onChange={(e) => handleRemainingBalanceChange(e.target.value)}
          />

          <InputField 
            label={language === 'bn' ? 'অ্যাডভান্স' : 'Advance'}
            name="advance"
            type="tel"
            inputMode="decimal"
            value={formAdvance}
            onChange={(e) => handleAdvanceChange(e.target.value)}
          />

          <InputField 
            label={t.LBL_AMOUNT || (language === 'bn' ? 'অ্যামাউন্ট' : 'Amount')}
            name="amount"
            type="tel"
            inputMode="decimal"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
          />
          
          <div className="relative group mt-4">
            <textarea 
              id="formNote"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder=" "
              className="peer w-full h-24 px-4 py-3 rounded-lg bg-transparent border border-slate-300 dark:border-zinc-600 text-xs font-bold text-text-main focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none resize-none transition-colors duration-200"
            />
            <label 
              htmlFor="formNote"
              className="absolute font-extrabold tracking-wider transition-all duration-200 pointer-events-none z-20 rounded-lg text-gray-500 peer-focus:text-[var(--primary)] text-[12px] left-3 top-4  peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:text-[10px]"
              style={{ backgroundColor: 'var(--card-bg, #ffffff)' }}
            >
              Note / Description
            </label>
          </div>
        </div>

        {/* Action Buttons Card */}
        <div className="flex gap-4 pb-[100px]">
          <button 
            onClick={() => setIsEntryFormOpen(false)}
            className="flex-1 h-14 bg-rose-500 text-white rounded-[10px] text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center"
          >
            {t.CANCEL || "Cancel"}
          </button>
          <button 
            onClick={handleSubmit}
            className="flex-1 h-14 bg-emerald-500 text-white rounded-[10px] text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center"
          >
            {t.SUBMIT || "Submit"}
          </button>
        </div>
    </div>
  );

  return (
    <div 
      className={`flex flex-col h-[calc(100dvh-140px)] md:h-[calc(100dvh-100px)] w-full mx-auto ${isEntryFormOpen ? 'hidden' : 'opacity-100'}`}
    >
      {/* Detailed Pending Category Breakdown Page */}
      {createPortal(
          selectedPendingCategory && (
            <div
              key="selected-pending-category-page"
              className="fixed inset-0 z-[120] bg-theme-bg flex flex-col pb-[calc(16px+env(safe-area-inset-bottom))] tms-page-enter-fwd"
              style={{ 
                backgroundColor: isDarkMode ? '#000000' : (backgroundColor || '#f8fafc'),
                background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg, #f8fafc)')),
                '--header-bg': isDarkMode ? '#000000' : (headerBg || '#FFFFFF'),
                '--header-text': isDarkMode ? '#FFFFFF' : (getContrastColor(headerBg || '#FFFFFF'))
              } as React.CSSProperties}
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
                      onClick={() => {
                        setNavigationDirection('backward');
                        setSelectedPendingCategory(null);
                        setPendingFilterMonth('ALL');
                        setPendingFilterYear('ALL');
                        setPendingSearchQuery('');
                      }}
                      className="flex items-center justify-center transition-colors shrink-0"
                      style={{ color: 'var(--header-text)' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-sm font-bold uppercase tracking-tight truncate" style={{ color: 'var(--header-text)' }}>
                      {selectedPendingCategory ? `Pending ${formatCategoryHeader(selectedPendingCategory)} Details` : 'Pending Details'}
                    </h3>
                  </div>
                  {renderHeaderActions()}
                </div>
              </div>

              {/* Content */}
              <div 
                className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-32"
              >
                {(() => {
                  const filteredSalaryMonths = salaryAndCommissionMonths.filter(val => {
                    if (pendingFilterMonth !== 'ALL' && Number(val.month) !== Number(pendingFilterMonth)) return false;
                    if (pendingFilterYear !== 'ALL' && Number(val.year) !== Number(pendingFilterYear)) return false;
                    
                    const hasSalary = val.salary && val.salary.total > 0;
                    if (!hasSalary) return false;
                    
                    if (pendingSearchQuery.trim() !== '') {
                      const query = pendingSearchQuery.toLowerCase();
                      const matchesItem = val.salary?.items.some((item: any) => {
                        const serviceName = (item.details?.serviceName || item.label || 'Salary').toLowerCase();
                        const companyName = (item.companyName || item.details?.companyName || '').toLowerCase();
                        const containerNum = (item.details?.containerNumber || '').toLowerCase();
                        const vehicleNum = (item.details?.vehicleNumber || '').toLowerCase();
                        const invoiceNum = (item.details?.invoiceNumber || '').toLowerCase();
                        const label = (item.label || '').toLowerCase();
                        
                        return serviceName.includes(query) ||
                               companyName.includes(query) ||
                               containerNum.includes(query) ||
                               vehicleNum.includes(query) ||
                               invoiceNum.includes(query) ||
                               label.includes(query);
                      });
                      if (!matchesItem) return false;
                    }
                    return true;
                  });

                  const filteredCommissionMonths = salaryAndCommissionMonths.filter(val => {
                    if (pendingFilterMonth !== 'ALL' && Number(val.month) !== Number(pendingFilterMonth)) return false;
                    if (pendingFilterYear !== 'ALL' && Number(val.year) !== Number(pendingFilterYear)) return false;
                    
                    const hasCommission = val.commission && val.commission.total > 0;
                    if (!hasCommission) return false;
                    
                    if (pendingSearchQuery.trim() !== '') {
                      const query = pendingSearchQuery.toLowerCase();
                      const matchesItem = val.commission?.items.some((item: any) => {
                        const containerNum = (item.details?.containerNumber || '').toLowerCase();
                        const vehicleNum = (item.details?.vehicleNumber || '').toLowerCase();
                        const invoiceNum = (item.details?.invoiceNumber || '').toLowerCase();
                        const companyName = (item.details?.companyName || item.companyName || '').toLowerCase();
                        return containerNum.includes(query) ||
                               vehicleNum.includes(query) ||
                               invoiceNum.includes(query) ||
                               companyName.includes(query);
                      });
                      if (!matchesItem) return false;
                    }
                    return true;
                  });

                  const rawTotalAmountNum = selectedPendingCategory?.toUpperCase() === 'SALARY'
                    ? filteredSalaryMonths.reduce((acc, m) => acc + (m.salary?.total || 0), 0)
                    : selectedPendingCategory?.toUpperCase() === 'COMMISSION'
                    ? filteredCommissionMonths.reduce((acc, m) => acc + (m.commission?.total || 0), 0)
                    : consolidatedPendingItems.reduce((acc, item) => {
                        if (item.isGrouped) {
                          return acc + (Number(item.totalPending) || 0);
                        }
                        return acc + (Number(item.pending) || 0);
                      }, 0);

                  const categoryAdvanceAmount = getCategoryAdvanceAmount(payments, selectedPendingCategory || '', pendingFilterMonth, pendingFilterYear);
                  const totalAmountNum = rawTotalAmountNum - categoryAdvanceAmount;

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
                      {/* Summary Card */}
                      {(() => {
                        const cardDetails = getCategoryCardDetails(selectedPendingCategory || '');
                        const CardIcon = cardDetails.icon;
                        return (
                          <div className={`rounded-[10px] p-6 text-white shadow-lg relative overflow-hidden mb-4 ${cardDetails.gradient}`}>
                            <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-4 translate-y-4">
                              <CardIcon size={120} />
                            </div>
                            <span className="block text-[10px] font-black uppercase tracking-wider opacity-85 mb-1.5 text-center">
                              {language === 'bn' ? `${cardDetails.label} পেন্ডিং ব্যালেন্স` : `Pending ${cardDetails.label} Balance`}
                            </span>
                            <h2 className="text-3xl font-black text-center font-sans tracking-tight mb-3">
                              {selectedCurrency} {totalAmountNum.toLocaleString()}
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

                      {/* Filters Panel */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Month Select Button-Card */}
                          <button
                            type="button"
                            onClick={() => setIsPendingMonthSelectOpen(true)}
                            className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-[8px] px-3 py-3.5 text-xs font-bold flex items-center justify-between active:scale-95 transition-all"
                          >
                            <span>
                              {pendingFilterMonth === 'ALL'
                                ? (language === 'bn' ? 'সব মাস' : 'All Months')
                                : monthsList.find(m => m.value === pendingFilterMonth)?.label || pendingFilterMonth}
                            </span>
                            <ChevronDown size={14} className="text-text-muted shrink-0" />
                          </button>

                          {/* Year Select Button-Card */}
                          <button
                            type="button"
                            onClick={() => setIsPendingYearSelectOpen(true)}
                            className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-[8px] px-3 py-3.5 text-xs font-bold flex items-center justify-between active:scale-95 transition-all"
                          >
                            <span>
                              {pendingFilterYear === 'ALL'
                                ? (language === 'bn' ? 'সব বছর' : 'All Years')
                                : pendingFilterYear}
                            </span>
                            <ChevronDown size={14} className="text-text-muted shrink-0" />
                          </button>
                        </div>

                        <div className="pt-2 pb-1 border-b border-black/5 dark:border-white/5 flex justify-start">
                          <h4 className="text-xs font-black uppercase tracking-wider text-text-muted text-left">
                            {language === 'bn' ? 'Pending History' : 'Pending History'}
                          </h4>
                        </div>
                      </div>

                      {/* Items Listing */}
                      {selectedPendingCategory?.toUpperCase() === 'SALARY' ? (
                        filteredSalaryMonths.length === 0 ? (
                          <div className="text-center py-20 text-text-main">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase">
                              {language === 'bn' ? 'কোনো বকেয়া স্যালারি পাওয়া যায়নি' : 'No pending Salary found'}
                            </p>
                          </div>
                        ) : (
                          filteredSalaryMonths.map((val) => {
                            const monthNameEn = new Date(val.year, val.month - 1).toLocaleString('en-US', { month: 'long' });
                            const monthNameBn = new Date(val.year, val.month - 1).toLocaleString('bn-BD', { month: 'long' });
                            const monthYearLabel = language === 'bn' ? `${monthNameBn} ${val.year}` : `${monthNameEn} ${val.year}`;
                            
                            return (
                              <div key={`${val.month}-${val.year}`} className="space-y-3 mb-3">
                                {val.salary && val.salary.total > 0 && (
                                  val.salary.items
                                    .filter((item: any) => {
                                      if (pendingSearchQuery.trim() === '') return true;
                                      const query = pendingSearchQuery.toLowerCase();
                                      const serviceName = (item.details?.serviceName || item.label || 'Salary').toLowerCase();
                                      const companyName = (item.companyName || item.details?.companyName || '').toLowerCase();
                                      const containerNum = (item.details?.containerNumber || '').toLowerCase();
                                      const vehicleNum = (item.details?.vehicleNumber || '').toLowerCase();
                                      const invoiceNum = (item.details?.invoiceNumber || '').toLowerCase();
                                      const label = (item.label || '').toLowerCase();
                                      
                                      return serviceName.includes(query) ||
                                             companyName.includes(query) ||
                                             containerNum.includes(query) ||
                                             vehicleNum.includes(query) ||
                                             invoiceNum.includes(query) ||
                                             label.includes(query);
                                    })
                                    .map((item: any, i: number) => {
                                      return (
                                        <SwipeToDeleteWrapper
                                          key={item.id || i}
                                          itemVariants={itemVariants}
                                          onDelete={() => handleDeletePaymentItem(item.id, true)}
                                        >
                                          <div 
                                            onClick={() => setSelectedSalaryPendingForPopup({ item, monthYear: monthYearLabel, val })}
                                            className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all cursor-pointer w-full pointer-events-auto"
                                          >
                                            {/* Far Left: Clock Pending Icon */}
                                            <div className="w-10 h-10 rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                              <Clock size={20} strokeWidth={2.5} className="animate-pulse" />
                                            </div>

                                            {/* Left/Center: Information */}
                                            <div className="flex-1 min-w-0 flex flex-col text-left font-sans text-xs">
                                              {/* Row 1: Title (Salary) & Pending Badge */}
                                              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                                                <span className="text-sm font-black text-text-main truncate">
                                                  {language === 'bn' ? 'সেলারী' : 'Salary'}
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                                                  <Clock size={10} className="animate-pulse shrink-0" />
                                                  {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                                </span>
                                              </div>

                                              {/* Info Table with aligned colon column */}
                                              <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                                <span className="text-text-muted font-medium whitespace-nowrap">
                                                  {language === 'bn' ? 'আয়ের উৎস' : 'Source of Income'}
                                                </span>
                                                <span className="text-text-muted font-medium">:</span>
                                                <span className="font-bold text-text-main truncate">
                                                  {language === 'bn' ? 'স্যালারি' : 'Salary'}
                                                </span>

                                                <span className="text-text-muted font-medium whitespace-nowrap">
                                                  {language === 'bn' ? 'স্যালারি মাস' : 'Salary for'}
                                                </span>
                                                <span className="text-text-muted font-medium">:</span>
                                                <span className="font-bold text-text-main truncate">{monthYearLabel}</span>
                                              </div>
                                            </div>

                                            {/* Right Side: Centered Amount */}
                                            <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                                              <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                                {(Number(item.pending) || 0).toLocaleString()} {selectedCurrency}
                                              </span>
                                            </div>
                                          </div>
                                        </SwipeToDeleteWrapper>
                                      );
                                    })
                                )}
                              </div>
                            );
                          })
                        )
                      ) : selectedPendingCategory?.toUpperCase() === 'COMMISSION' ? (
                        filteredCommissionMonths.length === 0 ? (
                          <div className="text-center py-20 text-text-main">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase">
                              {language === 'bn' ? 'কোনো বকেয়া কমিশন পাওয়া যায়নি' : 'No pending Commission found'}
                            </p>
                          </div>
                        ) : (
                          filteredCommissionMonths.map((val) => {
                            const monthName = new Date(val.year, val.month - 1).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long' });
                            const monthYearLabel = `${monthName} ${val.year}`;
                            const commissionItemIds = val.commission?.items.map((item: any) => item.id) || [];
                            
                            return (
                              <SwipeToDeleteWrapper
                                key={`${val.month}-${val.year}`}
                                itemVariants={itemVariants}
                                onDelete={() => {
                                  confirmAction(
                                    language === 'bn' 
                                      ? 'আপনি কি এই মাসের সমস্ত বকেয়া কমিশন মুছে ফেলতে চান?' 
                                      : 'Are you sure you want to delete all pending commission for this month?',
                                    () => {
                                      clearPendingDuesForIds(commissionItemIds);
                                      showFeedback(
                                        language === 'bn' 
                                          ? 'সফলভাবে ডিলেট হয়েছে' 
                                          : 'Pending commission deleted successfully'
                                      );
                                    }
                                  );
                                }}
                              >
                                <div 
                                  onClick={() => setSelectedCommissionPendingForPopup({ val, monthYear: monthYearLabel })}
                                  className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all cursor-pointer w-full pointer-events-auto"
                                >
                                  {/* Far Left: Clock Pending Icon */}
                                  <div className="w-10 h-10 rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                    <Clock size={20} strokeWidth={2.5} className="animate-pulse" />
                                  </div>

                                  {/* Left/Center: Information */}
                                  <div className="flex-1 min-w-0 flex flex-col text-left font-sans text-xs">
                                      {/* Row 1: Title & Pending Badge */}
                                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-black/5 dark:border-white/5">
                                         <span className="text-sm font-black text-text-main">
                                           {language === 'bn' ? 'কমিশন' : 'Commission'}
                                         </span>
                                         <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
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
                                         <span className="font-bold text-text-main truncate">{monthYearLabel}</span>

                                         <span className="text-text-muted font-medium whitespace-nowrap">
                                           {language === 'bn' ? 'মোট ট্রিপ' : 'Total Trip'}
                                         </span>
                                         <span className="text-text-muted font-medium">:</span>
                                         <span className="font-bold text-text-main truncate">{val.commission?.items?.length || val.totalTrips || 0}</span>
                                      </div>
                                  </div>

                                  {/* Right Side: Centered Amount */}
                                  <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                                     <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                        {(val.commission?.total || 0).toLocaleString()} {selectedCurrency}
                                     </span>
                                  </div>
                                </div>
                              </SwipeToDeleteWrapper>
                            );
                          })
                        )
                      ) : (
                        consolidatedPendingItems.length === 0 ? (
                          <div className="text-center py-20 text-text-main">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase">No pending {selectedPendingCategory} found</p>
                          </div>
                        ) : (
                          consolidatedPendingItems.map((item, index) => {
                            if (item.isGrouped) {
                              return (
                                <SwipeToDeleteWrapper
                                  key={item.id || index} 
                                  itemVariants={itemVariants}
                                  onDelete={() => {
                                    confirmAction(
                                      language === 'bn' 
                                        ? 'আপনি কি ট্রিপের সমস্ত বকেয়া লেনদেনগুলো মুছে ফেলতে চান?' 
                                        : 'Are you sure you want to delete all pending dues for this trip?',
                                      () => {
                                        clearPendingDuesForIds(item.paymentIds);
                                        showFeedback(
                                          language === 'bn' 
                                            ? 'সফলভাবে ডিলেট হয়েছে' 
                                            : 'Pending dues deleted successfully'
                                        );
                                      }
                                    );
                                  }}
                                >
                                  <div 
                                    onClick={() => setSelectedConsolidatedTripForPopup(item)}
                                    className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all cursor-pointer w-full pointer-events-auto"
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
                                             {selectedPendingCategory ? selectedPendingCategory : (language === 'bn' ? 'ট্রিপ বকেয়া' : 'Trip Dues')}
                                           </span>
                                           <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                                             <Clock size={10} className="animate-pulse shrink-0" />
                                             {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                           </span>
                                        </div>

                                        {/* Info Table with aligned colon column */}
                                        <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                           <span className="text-text-muted font-medium whitespace-nowrap">
                                             {language === 'bn' ? 'লোড ডেট' : 'Loading Date'}
                                           </span>
                                           <span className="text-text-muted font-medium">:</span>
                                           <span className="font-bold text-text-main truncate">{item.loadingDate || 'N/A'}</span>

                                           {(item.containerNumber || item.vehicleNumber) && (
                                             <>
                                               <span className="text-text-muted font-medium whitespace-nowrap">
                                                 {language === 'bn' ? 'কন্টেইনার নম্বর' : 'Container Number'}
                                               </span>
                                               <span className="text-text-muted font-medium">:</span>
                                               <span className="font-bold text-text-main truncate">
                                                 {item.containerNumber || item.vehicleNumber || 'N/A'}
                                               </span>
                                             </>
                                           )}
                                        </div>
                                    </div>

                                    {/* Right Side: Centered Amount */}
                                    <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                                       <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                          {(item.totalPending || 0).toLocaleString()} {selectedCurrency}
                                       </span>
                                    </div>
                                  </div>
                                </SwipeToDeleteWrapper>
                              );
                            }

                            const isVehicleInspection = selectedPendingCategory === 'Vehicle Inspection' || selectedPendingCategory?.toUpperCase() === 'EXTRA FUEL' || selectedPendingCategory?.toUpperCase() === 'EXTRA_FUEL';

                            if (isVehicleInspection) {
                              return (
                                <SwipeToDeleteWrapper
                                  key={item.id || index} 
                                  itemVariants={itemVariants}
                                  onDelete={() => handleDeletePaymentItem(item.id, true)}
                                >
                                  <div 
                                    onClick={() => setSelectedVehicleInspectionItem(item)}
                                    className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all cursor-pointer w-full pointer-events-auto"
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
                                             {selectedPendingCategory === 'Vehicle Inspection' 
                                               ? (language === 'bn' ? 'যানবাহন পরিদর্শন' : 'Vehicle Inspection')
                                               : (language === 'bn' ? 'অতিরিক্ত জ্বালানি' : 'Extra Fuel')}
                                           </span>
                                           <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                                             <Clock size={10} className="animate-pulse shrink-0" />
                                             {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                           </span>
                                        </div>

                                        {/* Info Table with aligned colon column */}
                                        <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                           <span className="text-text-muted font-medium whitespace-nowrap">
                                             {selectedPendingCategory === 'Vehicle Inspection' ? (language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number') : (language === 'bn' ? 'উৎস' : 'Source Name')}
                                           </span>
                                           <span className="text-text-muted font-medium">:</span>
                                           <span className="font-bold text-text-main truncate">
                                             {selectedPendingCategory === 'Vehicle Inspection' ? (item.details?.vehicleNumber || item.vehicleNumber || 'N/A') : (item.label || item.details?.extraDieselReason || item.details?.note || 'Extra Fuel')}
                                           </span>

                                           <span className="text-text-muted font-medium whitespace-nowrap">
                                             {selectedPendingCategory === 'Vehicle Inspection' ? (language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date') : (language === 'bn' ? 'তারিখ' : 'Date / For')}
                                           </span>
                                           <span className="text-text-muted font-medium">:</span>
                                           <span className="font-bold text-text-main truncate">{item.date || item.details?.loadingDate || 'N/A'}</span>

                                           {(item.details?.vehicleNumber || item.vehicleNumber) && selectedPendingCategory !== 'Vehicle Inspection' && (
                                             <>
                                               <span className="text-text-muted font-medium whitespace-nowrap">Vehicle / Type</span>
                                               <span className="text-text-muted font-medium">:</span>
                                               <span className="font-bold text-text-main truncate">
                                                 {item.details?.vehicleNumber || item.vehicleNumber || 'N/A'} {item.details?.deliveryPlace || item.details?.vehicleType ? `(${item.details?.deliveryPlace || item.details?.vehicleType})` : ''}
                                               </span>
                                             </>
                                           )}
                                        </div>
                                    </div>

                                    {/* Right Side: Centered Amount */}
                                    <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                                       <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                          {(item.pending || item.amount || 0).toLocaleString()} {selectedCurrency}
                                       </span>
                                    </div>
                                  </div>
                                </SwipeToDeleteWrapper>
                              );
                            }

                            return (
                              <SwipeToDeleteWrapper
                                key={item.id || index} 
                                itemVariants={itemVariants}
                                onDelete={() => handleDeletePaymentItem(item.id, true)}
                              >
                                <div 
                                  onClick={() => setSelectedGenericPendingForPopup(item)}
                                  className="bg-card-bg rounded-[8px] p-3.5 sm:p-4 shadow-sm border border-black/10 dark:border-white/10 flex items-center justify-between gap-3 relative overflow-hidden group hover:border-amber-500/30 transition-all cursor-pointer w-full pointer-events-auto"
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
                                           {selectedPendingCategory || (language === 'bn' ? 'লেনদেন' : 'Transaction')}
                                         </span>
                                         <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                                           <Clock size={10} className="animate-pulse shrink-0" />
                                           {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                         </span>
                                      </div>

                                      {/* Info Table with aligned colon column */}
                                      <div className="grid grid-cols-[auto_auto_1fr] items-center gap-x-2 gap-y-1.5 text-[11px] sm:text-xs">
                                         <span className="text-text-muted font-medium whitespace-nowrap">
                                           {language === 'bn' ? 'উৎস' : 'Source Name'}
                                         </span>
                                         <span className="text-text-muted font-medium">:</span>
                                         <span className="font-bold text-text-main truncate">
                                           {item.details?.companyName || item.companyName || item.details?.serviceName || (item.label && !/^\d{13}$/.test(item.label) ? item.label : 'N/A')}
                                         </span>

                                         <span className="text-text-muted font-medium whitespace-nowrap">
                                           {language === 'bn' ? 'তারিখ' : 'Date / For'}
                                         </span>
                                         <span className="text-text-muted font-medium">:</span>
                                         <span className="font-bold text-text-main truncate">{item.date && item.date !== 'N/A' ? item.date : 'N/A'}</span>

                                         {item.details?.containerNumber && item.details.containerNumber !== 'N/A' && (
                                           <>
                                             <span className="text-text-muted font-medium whitespace-nowrap">Container</span>
                                             <span className="text-text-muted font-medium">:</span>
                                             <span className="font-bold text-text-main truncate">{item.details.containerNumber}</span>
                                           </>
                                         )}
                                      </div>
                                  </div>

                                  {/* Right Side: Centered Amount */}
                                  <div className="flex flex-col items-end justify-center shrink-0 pl-3.5 sm:pl-4 border-l border-black/10 dark:border-white/10 self-stretch my-auto">
                                     <span className="text-base sm:text-lg font-black text-orange-500 dark:text-orange-400 tracking-tight whitespace-nowrap">
                                        {(item.pending || 0).toLocaleString()} {selectedCurrency}
                                     </span>
                                  </div>
                                </div>
                              </SwipeToDeleteWrapper>
                            );
                          })
                        )
                      )}
                    </>
                  );
                })()}

              </div>

              {/* Consolidated Trip Dues Popup Modal */}
              {createPortal(
                <>
                  {selectedSalaryPendingForPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                      <div 
                        className="bg-theme-card border border-black/5 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                              {language === 'bn' ? 'বকেয়া স্যালারি' : 'Pending Salary'}
                            </span>
                            <h3 className="text-base font-black text-text-main truncate mt-1">
                              {language === 'bn' ? 'স্যালারি বিবরণী' : 'Salary Details'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setSelectedSalaryPendingForPopup(null)}
                              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-left">
                          {/* Metadata Grid */}
                          <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 border border-black/5 dark:border-white/5 space-y-3">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'স্যালারি মাস' : 'Salary Month'}</span>
                              <span className="text-text-main font-bold">
                                {selectedSalaryPendingForPopup.monthYear}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'আয়ের উৎস' : 'Source of Income'}</span>
                              <span className="text-text-main font-bold">
                                {language === 'bn' ? 'স্যালারি' : 'Salary'}
                              </span>
                            </div>
                            {selectedSalaryPendingForPopup.item.details?.invoiceNumber && (
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-text-muted">{language === 'bn' ? 'ইনভয়েস নম্বর' : 'Invoice Number'}</span>
                                <span className="text-text-main font-bold font-mono">
                                  {selectedSalaryPendingForPopup.item.details.invoiceNumber}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'তারিখ' : 'Date'}</span>
                              <span className="text-text-main font-bold font-mono">
                                {selectedSalaryPendingForPopup.item.date || 'N/A'}
                              </span>
                            </div>
                          </div>

                          {/* Extra info/Note */}
                          {selectedSalaryPendingForPopup.item.details?.note && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">
                                {language === 'bn' ? 'মন্তব্য/নোট' : 'Remarks / Note'}
                              </span>
                              <p className="text-xs font-semibold text-text-main bg-black/[0.01] dark:bg-white/[0.01] p-3 rounded-xl border border-black/5 dark:border-white/5">
                                {selectedSalaryPendingForPopup.item.details.note}
                              </p>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="flex items-center justify-between p-3.5 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                            <div className="flex items-center gap-2">
                              <Clock size={16} className="text-orange-500 shrink-0" />
                              <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400">
                                {language === 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}
                              </span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider">
                              {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                            </span>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex flex-col gap-3">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black uppercase text-text-main">
                              {language === 'bn' ? 'মোট বকেয়া স্যালারি' : 'Total Pending Salary'}
                            </span>
                            <span className="text-base font-black text-orange-500">
                              {selectedSalaryPendingForPopup.item.pending?.toLocaleString()} {selectedCurrency}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                confirmAction(
                                  language === 'bn' ? 'আপনি কি এই বকেয়া স্যালারি মুছে ফেলতে চান?' : 'Are you sure you want to delete this pending salary?',
                                  () => {
                                    deletePaymentItemDirect(selectedSalaryPendingForPopup.item.id, true);
                                    setSelectedSalaryPendingForPopup(null);
                                  }
                                );
                              }}
                              className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                              title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                            >
                              <Trash2 size={16} />
                              <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedSalaryPendingForPopup(null)}
                              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-md shadow-orange-500/10"
                            >
                              {language === 'bn' ? 'ঠিক আছে' : 'OK'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCommissionPendingForPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                      <div 
                        className="bg-theme-card border border-black/5 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                              {language === 'bn' ? 'বকেয়া কমিশন' : 'Pending Commission'}
                            </span>
                            <h3 className="text-base font-black text-text-main truncate mt-1">
                              {language === 'bn' ? 'কমিশন বিবরণী' : 'Commission Details'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setSelectedCommissionPendingForPopup(null)}
                              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left">
                          {/* Metadata Summary */}
                          <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 border border-black/5 dark:border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'কমিশন মাস' : 'Commission Month'}</span>
                              <span className="text-text-main font-bold">
                                {selectedCommissionPendingForPopup.monthYear}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'আয়ের উৎস' : 'Source of Income'}</span>
                              <span className="text-text-main font-bold">
                                {language === 'bn' ? 'কমিশন' : 'Commission'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'মোট ট্রিপ সংখ্যা' : 'Total Trips Count'}</span>
                              <span className="text-text-main font-bold">
                                {selectedCommissionPendingForPopup.val.commission?.items?.length || selectedCommissionPendingForPopup.val.totalTrips || 0} {language === 'bn' ? 'টি' : 'Trips'}
                              </span>
                            </div>
                          </div>

                          {/* Individual Trip Commission Items */}
                          <div className="space-y-2.5">
                            <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block">
                              {language === 'bn' ? 'ট্রিপ ভিত্তিক বকেয়া কমিশন' : 'Trip-wise Pending Commissions'}
                            </span>
                            
                            <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                              {selectedCommissionPendingForPopup.val.commission?.items?.map((item: any, idx: number) => (
                                <div 
                                  key={item.id || idx}
                                  className="bg-black/[0.01] dark:bg-white/[0.01] px-4 py-3 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between"
                                >
                                  <div className="text-left space-y-0.5">
                                    <p className="text-xs font-extrabold text-text-main">
                                      {item.details?.companyName || item.companyName || (language === 'bn' ? 'অজানা কোম্পানি' : 'Unknown Company')}
                                    </p>
                                    <p className="text-[10px] font-bold text-text-muted font-mono">
                                      {item.date || 'N/A'} • {item.details?.vehicleNumber || 'N/A'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-orange-500 font-mono">
                                      {item.pending?.toLocaleString()} {selectedCurrency}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        confirmAction(
                                          language === 'bn' ? 'আপনি কি এই ট্রিপের বকেয়া কমিশন মুছে ফেলতে চান?' : 'Are you sure you want to delete this trip pending commission?',
                                          () => {
                                            clearPendingDuesForIds([item.id]);
                                            showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Deleted successfully');
                                            const updatedItems = selectedCommissionPendingForPopup.val.commission?.items?.filter((i: any) => i.id !== item.id);
                                            if (!updatedItems || updatedItems.length === 0) {
                                              setSelectedCommissionPendingForPopup(null);
                                            } else {
                                              setSelectedCommissionPendingForPopup({
                                                ...selectedCommissionPendingForPopup,
                                                val: {
                                                  ...selectedCommissionPendingForPopup.val,
                                                  commission: {
                                                    ...selectedCommissionPendingForPopup.val.commission,
                                                    items: updatedItems
                                                  }
                                                }
                                              });
                                            }
                                          }
                                        );
                                      }}
                                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                      title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex flex-col gap-3">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black uppercase text-text-main">
                              {language === 'bn' ? 'মোট কমিশন বকেয়া' : 'Total Commission Dues'}
                            </span>
                            <span className="text-base font-black text-orange-500">
                              {selectedCommissionPendingForPopup.val.commission?.total?.toLocaleString()} {selectedCurrency}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                confirmAction(
                                  language === 'bn' ? 'আপনি কি এই মাসের সমস্ত বকেয়া কমিশন মুছে ফেলতে চান?' : 'Are you sure you want to delete all pending commission for this month?',
                                  () => {
                                    const ids = selectedCommissionPendingForPopup.val.commission?.items?.map((i: any) => i.id).filter(Boolean) || [];
                                    if (ids.length > 0) {
                                      clearPendingDuesForIds(ids);
                                      showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Pending commission deleted successfully');
                                    }
                                    setSelectedCommissionPendingForPopup(null);
                                  }
                                );
                              }}
                              className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                              title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                            >
                              <Trash2 size={16} />
                              <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCommissionPendingForPopup(null)}
                              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-md shadow-orange-500/10"
                            >
                              {language === 'bn' ? 'ঠিক আছে' : 'OK'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedGenericPendingForPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                      <div 
                        className="bg-theme-card border border-black/5 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                              {selectedPendingCategory || 'Transaction'}
                            </span>
                            <h3 className="text-base font-black text-text-main truncate mt-1">
                              {language === 'bn' ? 'লেনদেন বিবরণী' : 'Transaction Details'}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setSelectedGenericPendingForPopup(null)}
                              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left">
                          {/* Metadata Grid */}
                          <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 border border-black/5 dark:border-white/5 space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'কোম্পানি' : 'Company'}</span>
                              <span className="text-text-main font-bold">
                                {selectedGenericPendingForPopup.details?.companyName || selectedGenericPendingForPopup.companyName || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'তারিখ' : 'Date'}</span>
                              <span className="text-text-main font-bold font-mono">
                                {selectedGenericPendingForPopup.date || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'কন্টেইনার নম্বর' : 'Container Number'}</span>
                              <span className="text-text-main font-bold font-mono">
                                {selectedGenericPendingForPopup.details?.containerNumber || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}</span>
                              <span className="text-text-main font-bold">
                                {selectedGenericPendingForPopup.details?.vehicleNumber || selectedGenericPendingForPopup.vehicleNumber || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
                              <span className="text-text-main font-bold">
                                {selectedGenericPendingForPopup.details?.subType || selectedPendingCategory || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'আয়ের উৎস' : 'Source of Income'}</span>
                              <span className="text-text-main font-bold">
                                {(() => {
                                  const catName = selectedGenericPendingForPopup.details?.subType || selectedPendingCategory || '';
                                  const catUpper = catName.toUpperCase();
                                  if (catUpper === 'SALARY') {
                                    return language === 'bn' ? 'স্যালারি' : 'Salary';
                                  } else if (catUpper === 'COMMISSION') {
                                    return language === 'bn' ? 'কমিশন' : 'Commission';
                                  } else if (catUpper === 'FRIDAY' || catUpper.includes('FRIDAY')) {
                                    return language === 'bn' ? 'ফ্রাইডে' : 'Friday';
                                  } else {
                                    return getCategoryDisplayLabel(catName, language);
                                  }
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Extra info/Note */}
                          {(selectedGenericPendingForPopup.label || selectedGenericPendingForPopup.details?.note) && (
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">
                                {language === 'bn' ? 'বিবরণ / মন্তব্য' : 'Description / Remarks'}
                              </span>
                              <p className="text-xs font-semibold text-text-main bg-black/[0.01] dark:bg-white/[0.01] p-3 rounded-xl border border-black/5 dark:border-white/5">
                                {selectedGenericPendingForPopup.label || selectedGenericPendingForPopup.details?.note}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex flex-col gap-3">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black uppercase text-text-main">
                              {language === 'bn' ? 'বকেয়া ব্যালেন্স' : 'Pending Balance'}
                            </span>
                            <span className="text-base font-black text-orange-500">
                              {selectedGenericPendingForPopup.pending?.toLocaleString()} {selectedCurrency}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                confirmAction(
                                  language === 'bn' ? 'আপনি কি এই বকেয়া লেনদেন মুছে ফেলতে চান?' : 'Are you sure you want to delete this pending transaction?',
                                  () => {
                                    const idToDelete = selectedGenericPendingForPopup.id || (selectedGenericPendingForPopup.paymentIds && selectedGenericPendingForPopup.paymentIds[0]);
                                    if (idToDelete) {
                                      deletePaymentItemDirect(idToDelete, true);
                                    }
                                    setSelectedGenericPendingForPopup(null);
                                  }
                                );
                              }}
                              className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                              title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                            >
                              <Trash2 size={16} />
                              <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedGenericPendingForPopup(null)}
                              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-md shadow-orange-500/10"
                            >
                              {language === 'bn' ? 'ঠিক আছে' : 'OK'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedConsolidatedTripForPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                      <div 
                        
                        
                        
                        className="bg-theme-card border border-black/5 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Modal Header */}
                        <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                          <div className="text-left">
                            <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                              {selectedPendingCategory?.toUpperCase() === 'EXTRA FUEL' || selectedConsolidatedTripForPopup.category === 'EXTRA FUEL'
                                ? (language === 'bn' ? 'ভেইকেল ইন্সপেকশন' : 'Vehicle Inspection')
                                : (language === 'bn' ? 'বকেয়া ট্রিপের বিস্তারিত' : 'Pending Trip Details')}
                            </span>
                            <h3 className="text-base font-black text-text-main truncate mt-1">
                              {(selectedPendingCategory?.toUpperCase() === 'EXTRA FUEL' || selectedConsolidatedTripForPopup.category === 'EXTRA FUEL' || selectedConsolidatedTripForPopup.category === 'EXTRA_FUEL') ? (selectedConsolidatedTripForPopup.deliveryPlace || selectedConsolidatedTripForPopup.vehicleType || selectedConsolidatedTripForPopup.companyName || 'N/A') : (selectedConsolidatedTripForPopup.companyName || 'N/A')}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setSelectedConsolidatedTripForPopup(null)}
                              className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left">
                          {/* Trip Metadata */}
                          <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl p-4 border border-black/5 dark:border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'লোডিং ডেট' : 'Loading Date'}</span>
                              <span className="text-text-main font-bold">
                                {selectedConsolidatedTripForPopup.loadingDate || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'লোডিং প্লেস' : 'Loading Place'}</span>
                              <span className="text-text-main font-bold truncate max-w-[200px]">
                                {selectedConsolidatedTripForPopup.loadingPlace || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'ডেলিভারি প্লেস' : 'Delivery Place'}</span>
                              <span className="text-text-main font-bold truncate max-w-[200px]">
                                {selectedConsolidatedTripForPopup.deliveryPlace || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'কন্টেইনার নম্বর' : 'Container Number'}</span>
                              <span className="text-text-main font-bold font-mono">
                                {selectedConsolidatedTripForPopup.containerNumber || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}</span>
                              <span className="text-text-main font-bold">
                                {selectedConsolidatedTripForPopup.vehicleNumber || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-text-muted">{language === 'bn' ? 'আয়ের উৎস' : 'Source of Income'}</span>
                              <span className="text-text-main font-bold">
                                {(() => {
                                  const catName = selectedPendingCategory || selectedConsolidatedTripForPopup.category || '';
                                  const catUpper = catName.toUpperCase();
                                  if (catUpper === 'SALARY') {
                                    return language === 'bn' ? 'স্যালারি' : 'Salary';
                                  } else if (catUpper === 'COMMISSION') {
                                    return language === 'bn' ? 'কমিশন' : 'Commission';
                                  } else if (catUpper === 'FRIDAY' || catUpper.includes('FRIDAY')) {
                                    return language === 'bn' ? 'ফ্রাইডে' : 'Friday';
                                  } else {
                                    return getCategoryDisplayLabel(catName, language);
                                  }
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Sub-items List */}
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">
                              {language === 'bn' ? 'বকেয়া আইটেম সমূহ' : 'Dues Sub-items'}
                            </span>

                            <div className="space-y-2.5">
                              {selectedConsolidatedTripForPopup.subItems?.map((subItem: any) => {
                                const isVehicleInspection = selectedPendingCategory?.toUpperCase() === 'EXTRA FUEL' || selectedConsolidatedTripForPopup.category === 'EXTRA FUEL';
                                const isPaid = subItem.pending === 0;
                                const labelText = isVehicleInspection 
                                  ? (isPaid 
                                      ? (language === 'bn' ? 'পেইড' : 'Paid') 
                                      : (language === 'bn' ? 'পেন্ডিং ব্যালেন্স' : 'Pending balance'))
                                  : subItem.key === 'friday'
                                    ? (language === 'bn' ? 'শুক্রবার বিল' : 'Friday')
                                    : subItem.key === 'dieselPrice'
                                      ? (language === 'bn' ? 'ট্রিপ ডিজেল' : 'Trip Diesel')
                                      : subItem.key === 'generatorDiesel'
                                        ? (language === 'bn' ? 'জেনারেটর ডিজেল' : 'Generator Diesel')
                                        : subItem.key === 'extraDiesel'
                                          ? (language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel')
                                          : subItem.label;

                                return (
                                  <div 
                                    key={subItem.id} 
                                    className="bg-black/[0.01] dark:bg-white/[0.01] px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm border border-black/5 dark:border-white/5"
                                  >
                                    <div className="flex items-center gap-2">
                                      {isVehicleInspection && (
                                        isPaid ? (
                                          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                                            <Check size={10} strokeWidth={4} />
                                          </div>
                                        ) : (
                                          <Clock size={16} className="text-orange-500 shrink-0" />
                                        )
                                      )}
                                      <span className="text-xs font-extrabold text-text-main">
                                        {labelText}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-black ${isPaid ? 'text-emerald-500' : 'text-orange-500'}`}>
                                        {subItem.pending.toLocaleString()} {selectedCurrency}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          confirmAction(
                                            language === 'bn' ? 'আপনি কি এই বকেয়া আইটেম মুছে ফেলতে চান?' : 'Are you sure you want to delete this pending item?',
                                            () => {
                                              clearPendingDuesForIds([subItem.id]);
                                              showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Deleted successfully');
                                              const updatedSub = selectedConsolidatedTripForPopup.subItems?.filter((s: any) => s.id !== subItem.id);
                                              if (!updatedSub || updatedSub.length === 0) {
                                                setSelectedConsolidatedTripForPopup(null);
                                              } else {
                                                setSelectedConsolidatedTripForPopup({
                                                  ...selectedConsolidatedTripForPopup,
                                                  subItems: updatedSub
                                                });
                                              }
                                            }
                                          );
                                        }}
                                        className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                        title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex flex-col gap-3">
                          <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-black uppercase text-text-main">
                              {language === 'bn' ? 'মোট বকেয়া ব্যালেন্স' : 'Total Pending Balance'}
                            </span>
                            <span className="text-base font-black text-orange-500">
                              {selectedConsolidatedTripForPopup.totalPending?.toLocaleString()} {selectedCurrency}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                confirmAction(
                                  language === 'bn' ? 'আপনি কি এই ট্রিপের সমস্ত বকেয়া মুছে ফেলতে চান?' : 'Are you sure you want to delete all pending dues for this trip?',
                                  () => {
                                    const ids = selectedConsolidatedTripForPopup.subItems?.map((s: any) => s.id).filter(Boolean) || selectedConsolidatedTripForPopup.paymentIds || [selectedConsolidatedTripForPopup.id];
                                    if (ids && ids.length > 0) {
                                      clearPendingDuesForIds(ids);
                                      showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Deleted successfully');
                                    }
                                    setSelectedConsolidatedTripForPopup(null);
                                  }
                                );
                              }}
                              className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                              title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                            >
                              <Trash2 size={16} />
                              <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedConsolidatedTripForPopup(null)}
                              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-md shadow-orange-500/10"
                            >
                              {language === 'bn' ? 'ঠিক আছে' : 'OK'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>,
                document.body
              )}

              <GlobalFullscreenSelect
                isOpen={isPendingMonthSelectOpen}
                onClose={() => setIsPendingMonthSelectOpen(false)}
                onSelect={(val) => {
                  setPendingFilterMonth(val === 'ALL' ? 'ALL' : parseInt(val));
                  setIsPendingMonthSelectOpen(false);
                }}
                options={[
                  { label: language === 'bn' ? 'সব মাস' : 'All Months', value: 'ALL' },
                  ...monthsList.map(m => ({ label: m.label, value: String(m.value) }))
                ]}
                title={t.SELECT_MONTH || "Select Month"}
                selectedValue={String(pendingFilterMonth)}
                searchable={false}
              />

              <GlobalFullscreenSelect
                isOpen={isPendingYearSelectOpen}
                onClose={() => setIsPendingYearSelectOpen(false)}
                onSelect={(val) => {
                  setPendingFilterYear(val === 'ALL' ? 'ALL' : parseInt(val));
                  setIsPendingYearSelectOpen(false);
                }}
                options={[
                  { label: language === 'bn' ? 'সব বছর' : 'All Years', value: 'ALL' },
                  ...yearsList.map(y => ({ label: String(y), value: String(y) }))
                ]}
                title={t.SELECT_YEAR || "Select Year"}
                selectedValue={String(pendingFilterYear)}
                searchable={false}
              />
            </div>
          ),
        document.body
      )}

      {createPortal(
          selectedReceivedCategory && (
            <div
              key="selected-received-category-page"
              className="fixed inset-0 z-[120] bg-theme-bg flex flex-col pb-[calc(16px+env(safe-area-inset-bottom))] tms-page-enter-fwd"
              style={{ 
                backgroundColor: isDarkMode ? '#000000' : (backgroundColor || '#f8fafc'),
                background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg, #f8fafc)')),
                '--header-bg': isDarkMode ? '#000000' : (headerBg || '#FFFFFF'),
                '--header-text': isDarkMode ? '#FFFFFF' : (getContrastColor(headerBg || '#FFFFFF'))
              } as React.CSSProperties}
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
                      onClick={() => {
                        setSelectedReceivedCategory(null);
                        setSalaryFilterMonth('ALL');
                        setSalaryFilterYear('ALL');
                        setExtraFuelFilterMonth('ALL');
                        setExtraFuelFilterYear('ALL');
                        setNavigationDirection('backward');
setShowReceivedBreakdown(false);
                      }}
                      className="flex items-center justify-center transition-colors shrink-0"
                      style={{ color: 'var(--header-text)' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-sm font-bold uppercase tracking-tight truncate" style={{ color: 'var(--header-text)' }}>
                      {selectedReceivedCategory ? `${formatCategoryHeader(selectedReceivedCategory)} Received Details` : 'Received Details'}
                    </h3>
                  </div>
                  {renderHeaderActions()}
                </div>
              </div>

              {/* Content */}
              <div 
                className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-32"
                
                
                
              >
                {(() => {
                  const isSalaryItemType = selectedReceivedCategory?.toUpperCase() === 'SALARY';
                  const isCommissionItemType = selectedReceivedCategory?.toUpperCase() === 'COMMISSION';
                  const isTripDieselItemType = selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL';
                  const isExtraFuelItemType = selectedReceivedCategory?.toUpperCase() === 'EXTRA FUEL' || selectedReceivedCategory?.toUpperCase() === 'EXTRA_FUEL';

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

                  // 1. Calculate and filter raw items based on sub-page filters
                  const filteredRawItems = detailedReceivedItems.filter(item => {
                    const monthMatch = receivedSubpageFilterMonth === 'ALL' ? true : Number(item.month) === Number(receivedSubpageFilterMonth);
                    const yearMatch = receivedSubpageFilterYear === 'ALL' ? true : Number(item.year) === Number(receivedSubpageFilterYear);
                    return monthMatch && yearMatch;
                  });

                  // 2. Generate displayItems
                  let displayItems: any[] = [];
                  if (isSalaryItemType) {
                    const grouped: { [key: string]: any } = {};
                    filteredRawItems.forEach(item => {
                      const key = `${item.month}-${item.year}`;
                      if (!grouped[key]) {
                        grouped[key] = {
                          ...item,
                          id: key,
                          amount: 0,
                          paymentIds: [],
                        };
                      }
                      grouped[key].amount += Number(item.amount) || 0;
                      if (!grouped[key].paymentIds.includes(item.paymentId || item.id)) {
                        grouped[key].paymentIds.push(item.paymentId || item.id);
                      }
                    });
                    displayItems = Object.values(grouped);
                    displayItems.sort((a, b) => {
                      if (b.year !== a.year) return b.year - a.year;
                      return b.month - a.month;
                    });
                  } else if (isCommissionItemType) {
                    const grouped: { [key: string]: any } = {};
                    filteredRawItems.forEach(item => {
                      const key = `${item.month}-${item.year}`;
                      if (!grouped[key]) {
                        grouped[key] = {
                          ...item,
                          id: key,
                          amount: 0,
                          ids: [],
                          pendingItemsGrouped: {},
                        };
                      }
                      grouped[key].amount += Number(item.amount) || 0;
                      grouped[key].ids.push(item.paymentId || item.id);
                      if (item.details?.pendingItems) {
                        Object.assign(grouped[key].pendingItemsGrouped, item.details.pendingItems);
                      }
                    });
                    displayItems = Object.values(grouped);
                    displayItems.sort((a, b) => {
                      if (b.year !== a.year) return b.year - a.year;
                      return b.month - a.month;
                    });
                  } else if (isTripDieselItemType) {
                    const grouped: { [key: string]: any } = {};
                    filteredRawItems.forEach(item => {
                      const key = item.tripId || item.companyName || 'Unknown';
                      if (!grouped[key]) {
                        grouped[key] = {
                          ...item,
                          id: key,
                          amount: 0,
                          paymentIds: [],
                          dates: [],
                          tripDieselAllocations: {
                            dieselPaid: 0,
                            generatorDieselPaid: 0,
                            extraDieselPaid: 0,
                            bonusPaid: 0
                          }
                        };
                      }
                      grouped[key].amount += Number(item.amount) || 0;
                      if (!grouped[key].paymentIds.includes(item.paymentId || item.id)) {
                        grouped[key].paymentIds.push(item.paymentId || item.id);
                      }
                      if (item.date) {
                        grouped[key].dates.push(item.date);
                      }
                      if (item.tripDieselAllocations) {
                        grouped[key].tripDieselAllocations.dieselPaid += Number(item.tripDieselAllocations.dieselPaid) || 0;
                        grouped[key].tripDieselAllocations.generatorDieselPaid += Number(item.tripDieselAllocations.generatorDieselPaid) || 0;
                        grouped[key].tripDieselAllocations.extraDieselPaid += Number(item.tripDieselAllocations.extraDieselPaid) || 0;
                        grouped[key].tripDieselAllocations.bonusPaid += Number(item.tripDieselAllocations.bonusPaid) || 0;
                      }
                    });
                    displayItems = Object.values(grouped).map(g => {
                      const sortedDates = g.dates.filter(Boolean).sort((a: any, b: any) => new Date(b).getTime() - new Date(a).getTime());
                      return {
                        ...g,
                        date: sortedDates[0] || null
                      };
                    });
                  } else {
                    displayItems = filteredRawItems;
                  }

                  // 3. Unified rendering of filters and card
                  const renderCategoryFiltersAndCard = () => {
                    if (!selectedReceivedCategory) return null;
                    const displayCatLabel = getCategoryDisplayLabel(selectedReceivedCategory, language);
                    const totalCatReceived = filteredRawItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
                    const cardDetails = getCategoryCardDetails(selectedReceivedCategory);
                    const CardIcon = cardDetails.icon;

                    return (
                      <div className="space-y-3 mb-4">
                        {/* Summary Card */}
                        <div className={`text-white py-8 px-6 rounded-[10px] shadow-md border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[130px] ${cardDetails.gradient}`}>
                          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none translate-x-4 translate-y-4">
                            <CardIcon size={120} />
                          </div>
                          <span className="text-[10px] font-black tracking-wider uppercase opacity-90">
                            {language === 'bn' ? `${displayCatLabel} মোট রিসিভড` : `Total Received ${displayCatLabel}`}
                          </span>
                          <h2 className="text-3xl font-black mt-2 font-sans drop-shadow-md">
                            {`${selectedCurrency} ${totalCatReceived.toLocaleString()}`}
                          </h2>
                        </div>

                        {/* Month & Year Selectors */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Month Select Button-Card */}
                          <button
                            type="button"
                            onClick={() => setIsReceivedSubpageMonthSelectOpen(true)}
                            className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-[8px] px-3 py-3.5 text-xs font-bold flex items-center justify-between active:scale-95 transition-all shadow-sm"
                          >
                            <span>
                              {receivedSubpageFilterMonth === 'ALL'
                                ? (language === 'bn' ? 'সকল মাস' : 'All Months')
                                : monthsList.find(m => m.value === receivedSubpageFilterMonth)?.label || receivedSubpageFilterMonth}
                            </span>
                            <ChevronDown size={14} className="text-text-muted shrink-0" />
                          </button>

                          {/* Year Select Button-Card */}
                          <button
                            type="button"
                            onClick={() => setIsReceivedSubpageYearSelectOpen(true)}
                            className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-[8px] px-3 py-3.5 text-xs font-bold flex items-center justify-between active:scale-95 transition-all shadow-sm"
                          >
                            <span>
                              {receivedSubpageFilterYear === 'ALL'
                                ? (language === 'bn' ? 'সকল বছর' : 'All Years')
                                : receivedSubpageFilterYear}
                            </span>
                            <ChevronDown size={14} className="text-text-muted shrink-0" />
                          </button>
                        </div>

                        {/* Payment History Header */}
                        <div className="pt-2 pb-1 border-b border-black/5 dark:border-white/5 flex justify-start">
                          <h4 className="text-xs font-black uppercase tracking-wider text-text-muted text-left">
                            {language === 'bn' ? 'Payment History' : 'Payment History'}
                          </h4>
                        </div>
                      </div>
                    );
                  };

                  if (displayItems.length === 0) {
                    return (
                      <>
                        {renderCategoryFiltersAndCard()}
                        <div  className="text-center py-20 text-text-main">
                          <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                          <p className="text-xs font-bold uppercase">
                            {language === 'bn' ? 'কোনো রিসিভড পেমেন্ট পাওয়া যায়নি' : `No received ${getCategoryDisplayLabel(selectedReceivedCategory, language)} found`}
                          </p>
                        </div>
                      </>
                    );
                  }

                  const mappedList = displayItems.map((item, index) => {
                    const isSalaryItem = selectedReceivedCategory?.toUpperCase() === 'SALARY';
                    const isCommissionItem = selectedReceivedCategory?.toUpperCase() === 'COMMISSION';
                    const isExtraFuelItem = selectedReceivedCategory?.toUpperCase() === 'EXTRA FUEL' || selectedReceivedCategory?.toUpperCase() === 'EXTRA_FUEL';
                    
                    const isAdvanceItem = (item.category || '').toUpperCase() === 'ADVANCE';
                    const displayTitle = (isAdvanceItem && item.companyName && item.companyName !== 'N/A' && item.companyName !== 'Unknown')
                      ? `${getCategoryDisplayLabel(selectedReceivedCategory, language)} (${item.companyName})`
                      : getCategoryDisplayLabel(selectedReceivedCategory, language);

                    const sourceName = item.details?.companyName || item.companyName || (item.label && !/^\d{13}$/.test(item.label) ? item.label : '') || 'Unknown Company';
                    
                    const getSalaryForShort = () => {
                      if (item.month != null && !Number.isNaN(Number(item.month)) && item.year) {
                        const monthNum = Number(item.month);
                        if (monthNum >= 1 && monthNum <= 12) {
                          const mName = new Date(0, monthNum - 1).toLocaleString('en-US', { month: 'short' });
                          const yyyy = String(item.year).length === 2 ? `20${item.year}` : String(item.year);
                          return `${mName}-${yyyy}`;
                        }
                      }
                      const rawVal = item.tripMonthAndYear;
                      if (rawVal && rawVal !== 'N/A') {
                        const parts = rawVal.trim().replace('-', ' ').split(/\s+/);
                        if (parts.length >= 2) {
                          const m = parts[0].substring(0, 3);
                          const textMonth = m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
                          const y = parts[1];
                          const yyyy = y.length === 2 ? `20${y}` : y;
                          return `${textMonth}-${yyyy}`;
                        }
                        return rawVal;
                      }
                      return 'N/A';
                    };

                    const getYYYYMMDD = (dateVal: any) => {
                      if (!dateVal) return 'N/A';
                      try {
                        const d = new Date(dateVal);
                        if (Number.isNaN(d.getTime())) return String(dateVal);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${yyyy}-${mm}-${dd}`;
                      } catch (e) {
                        return String(dateVal);
                      }
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
                        const fileGroup = allPending.find(f => Number(f.month) === Number(item.month) && Number(f.year) === Number(item.year));
                        if (fileGroup) {
                          const salaryCat = fileGroup.categories.find((c: any) => (c.name || '').toUpperCase() === 'SALARY');
                          if (salaryCat) {
                            const itemCompany = (item.details?.companyName || item.companyName || '').trim().toUpperCase();
                            const matching = (salaryCat.items || []).filter((i: any) => {
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

                    const getCommissionPendingBalance = () => {
                      try {
                        const allPending = PaymentManager.getPendingDues(trips, monthlyFiles, payments, 'COMMISSION');
                        const fileGroup = allPending.find(f => Number(f.month) === Number(item.month) && Number(f.year) === Number(item.year));
                        if (fileGroup) {
                          const commCat = fileGroup.categories.find((c: any) => (c.name || '').toUpperCase() === 'COMMISSION');
                          if (commCat) {
                            const itemCompany = (item.details?.companyName || item.companyName || '').trim().toUpperCase();
                            const matching = (commCat.items || []).filter((i: any) => {
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

                    const getTripDieselPendingBalance = () => {
                      try {
                        const totalAmount = (item.tripDieselAllocations?.dieselPaid || Number(item.amount) || 0) + 
                                            (item.tripDieselAllocations?.extraDieselPaid || 0);
                        const paymentAmount = item.amount || 0;
                        const pending = totalAmount - Math.abs(paymentAmount);
                        return pending > 0 ? (pending < 10 ? `${pending.toFixed(1)}` : pending.toLocaleString()) : '0';
                      } catch (error) {
                        console.error("Error calculating pending Trip Diesel balance:", error);
                      }
                      return '0';
                    };

                    const getTotalTripValue = () => {
                      const pendingItemsObj = item.pendingItemsGrouped || item.details?.pendingItems;
                      if (pendingItemsObj) {
                        const keys = Object.keys(pendingItemsObj || {});
                        const tripIds = new Set(keys.map(k => k.includes('-') ? k.substring(0, k.lastIndexOf('-')) : k));
                        return tripIds.size || 1;
                      }
                      return 1;
                    };

                    const getCommissionForShort = () => {
                      if (item.month != null && !Number.isNaN(Number(item.month)) && item.year) {
                        const monthNum = Number(item.month);
                        if (monthNum >= 1 && monthNum <= 12) {
                          const mName = new Date(0, monthNum - 1).toLocaleString('en-US', { month: 'short' });
                          const yyyy = String(item.year).length === 2 ? `20${item.year}` : String(item.year);
                          return `${mName}-${yyyy}`;
                        }
                      }
                      const rawVal = item.tripMonthAndYear;
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
                      return 'N/A';
                    };

                    return (
                      <SwipeToDeleteWrapper 
                        key={item.id || index} 
                        itemVariants={itemVariants}
                        onDelete={() => {
                          if (isCommissionItem && item.ids && item.ids.length > 0) {
                            confirmAction(t.TRANSACTION_DELETE_DESC || 'Are you sure you want to delete these transactions?', () => {
                              item.ids.forEach((payId: string) => removePayment(payId));
                              showFeedback(t.TRANSACTION_DELETED_SUCCESS || 'Transactions deleted successfully');
                              setDetailedReceivedItems(prev => prev.filter(p => !item.ids.includes(p.paymentId || p.id)));
                            });
                          } else if (isSalaryItem && item.paymentIds && item.paymentIds.length > 0) {
                            confirmAction(t.TRANSACTION_DELETE_DESC || 'Are you sure you want to delete these Salary transactions?', () => {
                              item.paymentIds.forEach((payId: string) => removePayment(payId));
                              showFeedback(t.TRANSACTION_DELETED_SUCCESS || 'Transactions deleted successfully');
                              setDetailedReceivedItems(prev => prev.filter(p => !item.paymentIds.includes(p.paymentId || p.id)));
                            });
                          } else if (selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' && item.paymentIds && item.paymentIds.length > 0) {
                            confirmAction(t.TRANSACTION_DELETE_DESC || 'Are you sure you want to delete these Trip Diesel transactions?', () => {
                              item.paymentIds.forEach((payId: string) => removePayment(payId));
                              showFeedback(t.TRANSACTION_DELETED_SUCCESS || 'Transactions deleted successfully');
                              setDetailedReceivedItems(prev => prev.filter(p => !item.paymentIds.includes(p.paymentId || p.id)));
                            });
                          } else {
                            handleDeletePaymentItem(item.id, false);
                          }
                        }}
                      >
                        <div 
                          onClick={() => {
                            setSelectedReceivedItemForPopup({
                              item,
                              category: selectedReceivedCategory,
                              sourceName,
                              salaryFor: isSalaryItem ? getSalaryForShort() : undefined,
                              paymentAmount: (!Number.isNaN(Number(item.amount)) ? (item.amount || 0).toLocaleString() : '0'),
                              paymentDate: isSalaryItem ? getPaymentDateStr(item.date) : (selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' ? getPaymentDateStr(item.date) : (item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A')),
                              pendingBalance: isSalaryItem ? getSalaryPendingBalance() : (isCommissionItem ? getCommissionPendingBalance() : (selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' ? getTripDieselPendingBalance() : undefined)),
                              totalTrip: isCommissionItem ? getTotalTripValue() : undefined,
                              commissionFor: isCommissionItem ? getCommissionForShort() : undefined,
                              tripDiesel: selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' ? (item.tripDieselAllocations?.dieselPaid || 0) : undefined,
                              generatorDiesel: selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' ? (item.tripDieselAllocations?.generatorDieselPaid || 0) : undefined,
                              extraDiesel: selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' ? (item.tripDieselAllocations?.extraDieselPaid || 0) : undefined,
                              totalDiesel: selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' ? ((item.tripDieselAllocations?.dieselPaid || Number(item.amount) || 0) + (item.tripDieselAllocations?.extraDieselPaid || 0)) : undefined,
                              note: item.note,
                              method: item.method,
                              time: item.time,
                              tripMonthAndYear: item.tripMonthAndYear
                            });
                          }}
                          className="group bg-theme-card border border-black/5 dark:border-white/5 rounded-[10px] p-4 flex items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 ease-out w-full cursor-pointer pointer-events-auto relative overflow-hidden"
                        >
                          {/* Inner content wrapper */}
                          <div className="flex items-center gap-4 min-w-0 w-full">
                            {/* Icon container */}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105 ${
                              isSalaryItem 
                                ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" 
                                : isCommissionItem 
                                ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" 
                                : selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' 
                                ? "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400" 
                                : isExtraFuelItem 
                                ? "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" 
                                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                            }`}>
                              {isSalaryItem ? (
                                <Banknote size={22} className="stroke-[2]" />
                              ) : isCommissionItem ? (
                                <Award size={22} className="stroke-[2]" />
                              ) : selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' ? (
                                <Fuel size={22} className="stroke-[2]" />
                              ) : isExtraFuelItem ? (
                                <Truck size={22} className="stroke-[2]" />
                              ) : (
                                <Wallet size={22} className="stroke-[2]" />
                              )}
                            </div>

                            {/* Center texts & details */}
                            <div className="flex-1 min-w-0 text-left space-y-1">
                              {isExtraFuelItem ? (
                                <>
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                                      {displayTitle}
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/10 shrink-0">
                                      <Check size={8} className="stroke-[3]" />
                                      {language === 'bn' ? 'রিসিভ' : 'Received'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[8px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Truck size={9} className="opacity-70 shrink-0" />
                                      <span>
                                        {language === 'bn' ? 'ধরন' : 'TYPE'}: {item.deliveryPlace || item.vehicleType || (language === 'bn' ? 'ট্রেইলার' : 'Trailer')}
                                      </span>
                                    </div>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Calendar size={9} className="opacity-70 shrink-0" />
                                      <span className="font-mono">
                                        {language === 'bn' ? 'তারিখ' : 'DATE'}: {getYYYYMMDD(item.date)}
                                      </span>
                                    </div>
                                  </div>
                                </>
                              ) : isSalaryItem ? (
                                <>
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                                      {displayTitle}
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/10 shrink-0">
                                      <Check size={8} className="stroke-[3]" />
                                      {language === 'bn' ? 'রিসিভ' : 'Received'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[8px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Calendar size={9} className="opacity-70 shrink-0" />
                                      <span className="font-mono">
                                        {language === 'bn' ? 'তারিখ' : 'DATE'}: {getPaymentDateStr(item.date)}
                                      </span>
                                    </div>
                                    {item.time && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Clock size={9} className="opacity-70 shrink-0" />
                                          <span className="font-mono">{item.time}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </>
                              ) : isCommissionItem ? (
                                <>
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                                      {displayTitle}
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/10 shrink-0">
                                      <Check size={8} className="stroke-[3]" />
                                      {language === 'bn' ? 'রিসিভ' : 'Received'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[8px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
                                    {item.tripMonthAndYear && item.tripMonthAndYear !== 'N/A' && (
                                      <>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Calendar size={9} className="opacity-70 shrink-0" />
                                          <span className="bg-slate-50 dark:bg-slate-800/50 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold">
                                            {item.tripMonthAndYear}
                                          </span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                      </>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Clock size={9} className="opacity-70 shrink-0" />
                                      <span className="font-mono">
                                        {item.date ? new Date(item.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                </>
                              ) : selectedReceivedCategory?.toUpperCase() === 'TRIP DIESEL' ? (
                                <>
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                                      {displayTitle}
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/10 shrink-0">
                                      <Check size={8} className="stroke-[3]" />
                                      {language === 'bn' ? 'রিসিভ' : 'Received'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[8px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
                                    {item.tripMonthAndYear && item.tripMonthAndYear !== 'N/A' && (
                                      <>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Calendar size={9} className="opacity-70 shrink-0" />
                                          <span className="bg-slate-50 dark:bg-slate-800/50 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold">
                                            {item.tripMonthAndYear}
                                          </span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                      </>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Clock size={9} className="opacity-70 shrink-0" />
                                      <span className="font-mono">
                                        {item.date ? new Date(item.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                      </span>
                                    </div>
                                    {item.vehicleNumber && item.vehicleNumber !== 'N/A' && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded text-[8px] font-mono">
                                          {item.vehicleNumber}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight truncate">
                                      {displayTitle}
                                    </span>
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/10 shrink-0">
                                      <Check size={8} className="stroke-[3]" />
                                      {language === 'bn' ? 'রিসিভ' : 'Received'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[8px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
                                    {item.tripMonthAndYear && item.tripMonthAndYear !== 'N/A' && (
                                      <>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Calendar size={9} className="opacity-70 shrink-0" />
                                          <span className="bg-slate-50 dark:bg-slate-800/50 px-1 py-0.5 rounded text-slate-500 dark:text-slate-400 font-bold">
                                            {item.tripMonthAndYear}
                                          </span>
                                        </div>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                      </>
                                    )}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Clock size={9} className="opacity-70 shrink-0" />
                                      <span className="font-mono">
                                        {item.date ? new Date(item.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                      </span>
                                    </div>
                                    {item.vehicleNumber && item.vehicleNumber !== 'N/A' && (
                                      <>
                                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1 py-0.5 rounded text-[8px] font-mono">
                                          {item.vehicleNumber}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Right container: Amount, Method Badge & Chevron */}
                            <div className="flex items-center gap-3 shrink-0 pl-1">
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-black text-xs sm:text-sm text-emerald-500 dark:text-emerald-400 font-mono flex items-center">
                                  +{(!Number.isNaN(Number(item.amount)) ? (item.amount || 0).toLocaleString() : '0')}
                                  <span className="text-[10px] font-bold ml-1 font-sans">{selectedCurrency}</span>
                                </span>

                                {/* Payment Method/Status badge */}
                                {item.method && (String(item.method).toUpperCase() === 'BANK' || String(item.method).toUpperCase() === 'BANK_TRANSFER' || String(item.method).toUpperCase() === 'BANK TRANSFER') ? (
                                  <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                    {language === 'bn' ? 'ব্যাংক' : 'Bank'}
                                  </span>
                                ) : null}
                              </div>
                              
                              <div className="flex items-center text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200">
                                <ChevronRight size={15} className="stroke-[2.5]" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </SwipeToDeleteWrapper>
                    );
                  });

                  return (
                    <div className="space-y-4">
                      {renderCategoryFiltersAndCard()}
                      <div className="space-y-3">
                        {mappedList}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Received Detail Item Popup Modal */}
              {createPortal(
                <>
                  {selectedReceivedItemForPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div 
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header (Category Based Stylings) */}
                      {(() => {
                        const cat = selectedReceivedItemForPopup.category?.toUpperCase();
                        let headerBg = "bg-emerald-500 text-white";
                        let bannerIcon = <Wallet size={20} />;
                        let categoryText = language === 'bn' ? 'অন্যান্য রিসিভ' : 'Other Income';

                        if (cat === 'SALARY') {
                          headerBg = "bg-gradient-to-r from-indigo-600 to-violet-600 text-white";
                          bannerIcon = <Banknote size={20} />;
                          categoryText = language === 'bn' ? 'স্যালারি পেমেন্ট' : 'Salary Payment';
                        } else if (cat === 'COMMISSION') {
                          headerBg = "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
                          bannerIcon = <Award size={20} />;
                          categoryText = language === 'bn' ? 'কমিশন পেমেন্ট' : 'Commission Payment';
                        } else if (cat === 'TRIP DIESEL' || cat === 'TRIP_DIESEL') {
                          headerBg = "bg-gradient-to-r from-teal-600 to-emerald-600 text-white";
                          bannerIcon = <Fuel size={20} />;
                          categoryText = language === 'bn' ? 'ডিজেল বরাদ্দ বিবরণী' : 'Trip Diesel Allocation';
                        } else if (cat === 'EXTRA FUEL' || cat === 'EXTRA_FUEL') {
                          headerBg = "bg-gradient-to-r from-sky-500 to-blue-600 text-white";
                          bannerIcon = <Truck size={20} />;
                          categoryText = language === 'bn' ? 'যানবাহন পরিদর্শন পেমেন্ট' : 'Vehicle Inspection';
                        }

                        return (
                          <div className={`p-5 relative ${headerBg} flex items-center justify-between`}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                                {bannerIcon}
                              </div>
                              <div className="text-left">
                                <span className="text-[10px] font-black uppercase tracking-wider text-white/70 block">
                                  {language === 'bn' ? 'রিসিভড বিবরণী' : 'Received Details'}
                                </span>
                                <h3 className="text-base font-extrabold text-white truncate mt-0.5">
                                  {categoryText}
                                </h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setSelectedReceivedItemForPopup(null)}
                                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Modal Content */}
                      <div className="p-5 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950/40">
                        {/* Hero Amount Box */}
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl p-4 text-center mb-4">
                          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest block mb-1">
                            {language === 'bn' ? 'মোট প্রাপ্ত অর্থ' : 'Total Amount Received'}
                          </span>
                          <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight flex items-center justify-center gap-1">
                            +{selectedReceivedItemForPopup.paymentAmount}
                            <span className="text-sm font-black font-sans text-emerald-500">{selectedCurrency}</span>
                          </span>
                        </div>

                        {/* Grid Details */}
                        {(() => {
                          const isTripDieselCat = selectedReceivedItemForPopup.category?.toUpperCase() === 'TRIP DIESEL' || selectedReceivedItemForPopup.category?.toUpperCase() === 'TRIP_DIESEL';
                          return (
                            <div className="grid grid-cols-2 gap-2.5">
                              {(() => {
                                const isTripDieselCat = selectedReceivedItemForPopup.category?.toUpperCase() === 'TRIP DIESEL' || selectedReceivedItemForPopup.category?.toUpperCase() === 'TRIP_DIESEL';
                                if (isTripDieselCat) {
                                  return (
                                    <>
                                      {/* Row 1: Company Name (Full Width) with Container Number inside */}
                                      <div className="col-span-2 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <Building size={11} className="text-indigo-500" />
                                          {language === 'bn' ? 'কোম্পানি নেম' : 'Company Name'}
                                        </span>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mt-0.5">
                                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate">
                                            {selectedReceivedItemForPopup.sourceName || 'N/A'}
                                          </span>
                                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                                            Container Number: {selectedReceivedItemForPopup.item?.containerNumber || 'N/A'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Row 2: Loading Point beside Delivery Point */}
                                      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <MapPin size={11} className="text-emerald-500" />
                                          {language === 'bn' ? 'লোডিং পয়েন্ট' : 'Loading Point'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                                          {selectedReceivedItemForPopup.item?.loadingPlace || 'N/A'}
                                        </span>
                                      </div>

                                      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <MapPin size={11} className="text-rose-500" />
                                          {language === 'bn' ? 'ডেলিভারি পয়েন্ট' : 'Delivery Point'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5 truncate">
                                          {selectedReceivedItemForPopup.item?.deliveryPlace || 'N/A'}
                                        </span>
                                      </div>

                                      {/* Row 3: Trip Diesel beside Generator Diesel */}
                                      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <Fuel size={11} className="text-orange-500" />
                                          {language === 'bn' ? 'ট্রিপ ডিজেল' : 'Trip Diesel'}
                                        </span>
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate font-mono mt-0.5">
                                          {(selectedReceivedItemForPopup.tripDiesel || 0).toLocaleString()} {selectedCurrency}
                                        </span>
                                      </div>

                                      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <Fuel size={11} className="text-amber-500" />
                                          {language === 'bn' ? 'জেনারেটর ডিজেল' : 'Generator Diesel'}
                                        </span>
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate font-mono mt-0.5">
                                          {(selectedReceivedItemForPopup.extraDiesel || 0).toLocaleString()} {selectedCurrency}
                                        </span>
                                      </div>

                                      {/* Row 4: Payment Method beside Payment Status */}
                                      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <CreditCard size={11} className="text-violet-500" />
                                          {language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
                                        </span>
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate uppercase mt-0.5">
                                          {selectedReceivedItemForPopup.method || (language === 'bn' ? 'ক্যাশ' : 'Cash')}
                                        </span>
                                      </div>

                                      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <CheckCircle2 size={11} className="text-emerald-500" />
                                          {language === 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}
                                        </span>
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate uppercase mt-0.5">
                                          {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                                        </span>
                                      </div>

                                      {/* Row 5: Payment Date beside Payment Time */}
                                      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <Calendar size={11} className="text-teal-500" />
                                          {language === 'bn' ? 'পেমেন্ট ডেট' : 'Payment Date'}
                                        </span>
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5 truncate">
                                          {selectedReceivedItemForPopup.paymentDate || 'N/A'}
                                        </span>
                                      </div>

                                      <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-[8px] shadow-sm p-3.5 flex flex-col gap-1 text-left">
                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                          <Clock size={11} className="text-sky-500" />
                                          {language === 'bn' ? 'পেমেন্ট টাইম' : 'Payment Time'}
                                        </span>
                                        <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5 truncate">
                                          {selectedReceivedItemForPopup.time || 'N/A'}
                                        </span>
                                      </div>


                                    </>
                                  );
                                }

                                // Default/Common category layout
                                return (
                                  <>
                                    {/* Common Source Card */}
                                    <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 p-3.5 flex flex-col gap-1 text-left rounded-xl">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <Building size={11} className="text-indigo-500" />
                                        {language === 'bn' ? 'আয়ের উৎস' : 'Source of Income'}
                                      </span>
                                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase truncate mt-0.5">
                                        {(() => {
                                          const catUpper = selectedReceivedItemForPopup.category?.toUpperCase() || '';
                                          if (catUpper === 'SALARY') {
                                            return language === 'bn' ? 'স্যালারি' : 'Salary';
                                          } else if (catUpper === 'COMMISSION') {
                                            return language === 'bn' ? 'কমিশন' : 'Commission';
                                          } else if (catUpper === 'FRIDAY' || catUpper.includes('FRIDAY')) {
                                            return language === 'bn' ? 'ফ্রাইডে' : 'Friday';
                                          } else {
                                            return getCategoryDisplayLabel(selectedReceivedItemForPopup.category || '', language);
                                          }
                                        })()}
                                      </span>
                                    </div>

                                    {/* Common Payment Date Card */}
                                    <div className="col-span-2 bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 p-3.5 flex flex-col gap-1 text-left rounded-xl">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <Calendar size={11} className="text-teal-500" />
                                        {language === 'bn' ? 'পেমেন্ট ডেট ও সময়' : 'Payment Date & Time'}
                                      </span>
                                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                                        {selectedReceivedItemForPopup.paymentDate || 'N/A'}
                                        {selectedReceivedItemForPopup.time ? ` • ${selectedReceivedItemForPopup.time}` : ''}
                                      </span>
                                    </div>

                                    {/* Render Category Specifics inside beautiful grid items */}
                                    {selectedReceivedItemForPopup.category?.toUpperCase() === 'SALARY' ? (
                                      <>
                                        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1 text-left col-span-2">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <Clock size={11} className="text-cyan-500" />
                                            {language === 'bn' ? 'স্যালারি মাস' : 'Salary For'}
                                          </span>
                                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                            {selectedReceivedItemForPopup.salaryFor || 'N/A'}
                                          </span>
                                        </div>
                                      </>
                                    ) : selectedReceivedItemForPopup.category?.toUpperCase() === 'COMMISSION' ? (
                                      <>
                                        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1 text-left col-span-2">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <Truck size={11} className="text-blue-500" />
                                            {language === 'bn' ? 'মোট ট্রিপ' : 'Total Trips'}
                                          </span>
                                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate font-mono">
                                            {selectedReceivedItemForPopup.totalTrip || '0'}
                                          </span>
                                        </div>
                                      </>
                                    ) : (selectedReceivedItemForPopup.category?.toUpperCase() === 'EXTRA FUEL' || selectedReceivedItemForPopup.category?.toUpperCase() === 'EXTRA_FUEL') ? (
                                      <>
                                        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1 text-left">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <Truck size={11} className="text-blue-500" />
                                            {language === 'bn' ? 'গাড়ির ধরন' : 'Vehicle Type'}
                                          </span>
                                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                            {selectedReceivedItemForPopup.item?.deliveryPlace || selectedReceivedItemForPopup.item?.vehicleType || (language === 'bn' ? 'ট্রেইলার' : 'Trailer')}
                                          </span>
                                        </div>

                                        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1 text-left">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <Tag size={11} className="text-purple-500" />
                                            {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                                          </span>
                                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                            {selectedReceivedItemForPopup.category || 'N/A'}
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1 text-left">
                                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                            <Tag size={11} className="text-purple-500" />
                                            {language === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                                          </span>
                                          <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                            {selectedReceivedItemForPopup.category || 'N/A'}
                                          </span>
                                        </div>

                                        {selectedReceivedItemForPopup.tripMonthAndYear && selectedReceivedItemForPopup.tripMonthAndYear !== 'N/A' && (
                                          <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1 text-left">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                              <Clock size={11} className="text-amber-500" />
                                              {language === 'bn' ? 'মাস ও বছর' : 'Month & Year'}
                                            </span>
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                              {selectedReceivedItemForPopup.tripMonthAndYear}
                                            </span>
                                          </div>
                                        )}
                                      </>
                                    )}

                                    {/* Common Payment Method Card */}
                                    <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1 text-left">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <CreditCard size={11} className="text-violet-500" />
                                        {language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'Payment Method'}
                                      </span>
                                      <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate uppercase">
                                        {selectedReceivedItemForPopup.method || (language === 'bn' ? 'ক্যাশ' : 'Cash')}
                                      </span>
                                    </div>

                                    {/* Common Payment Status Card - Always Paid */}
                                    <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col gap-1 text-left">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <CheckCircle2 size={11} className="text-emerald-500" />
                                        {language === 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}
                                      </span>
                                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate uppercase">
                                        {language === 'bn' ? 'পরিশোধিত' : 'Paid'}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}

                              {/* Custom Notes / Description Section - Span 2 Columns if present */}
                              {selectedReceivedItemForPopup.note && (
                                <div className="col-span-2 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 rounded-xl p-3.5 flex flex-col gap-1.5 text-left">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                    <FileText size={11} className="text-amber-500" />
                                    {language === 'bn' ? 'বিশেষ নোট / বিবরণ' : 'Note / Description'}
                                  </span>
                                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                    "{selectedReceivedItemForPopup.note}"
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            confirmAction(
                              language === 'bn' ? 'আপনি কি এই প্রাপ্ত পেমেন্ট ট্রানজ্যাকশন মুছে ফেলতে চান?' : 'Are you sure you want to delete this received payment transaction?',
                              () => {
                                if (selectedReceivedItemForPopup.id) {
                                  deletePaymentItemDirect(selectedReceivedItemForPopup.id, false);
                                }
                                setSelectedReceivedItemForPopup(null);
                              }
                            );
                          }}
                          className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
                          title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        >
                          <Trash2 size={16} />
                          <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedReceivedItemForPopup(null)}
                          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md shadow-emerald-500/15"
                        >
                          {language === 'bn' ? 'ঠিক আছে' : 'OK'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>,
              document.body
            )}

            <GlobalFullscreenSelect
              isOpen={isReceivedSubpageMonthSelectOpen}
              onClose={() => setIsReceivedSubpageMonthSelectOpen(false)}
              onSelect={(val) => {
                setReceivedSubpageFilterMonth(val === 'ALL' ? 'ALL' : parseInt(val));
                setIsReceivedSubpageMonthSelectOpen(false);
              }}
              options={[
                { label: language === 'bn' ? 'সকল মাস' : 'All Months', value: 'ALL' },
                ...monthsList.map(m => ({ label: m.label, value: String(m.value) }))
              ]}
              title={t.SELECT_MONTH || "Select Month"}
              selectedValue={String(receivedSubpageFilterMonth)}
              searchable={false}
            />

            <GlobalFullscreenSelect
              isOpen={isReceivedSubpageYearSelectOpen}
              onClose={() => setIsReceivedSubpageYearSelectOpen(false)}
              onSelect={(val) => {
                setReceivedSubpageFilterYear(val === 'ALL' ? 'ALL' : parseInt(val));
                setIsReceivedSubpageYearSelectOpen(false);
              }}
              options={[
                { label: language === 'bn' ? 'সকল বছর' : 'All Years', value: 'ALL' },
                ...yearsList.map(y => ({ label: String(y), value: String(y) }))
              ]}
              title={t.SELECT_YEAR || "Select Year"}
              selectedValue={String(receivedSubpageFilterYear)}
              searchable={false}
            />
            </div>
          ),
        document.body
      )}

      {showReceivedBreakdown && createPortal(
            <div
              key="show-received-breakdown-page"
              className="fixed inset-0 z-[100] flex flex-col pb-[calc(76px+env(safe-area-inset-bottom))] tms-page-enter-fwd"
              style={{ 
                backgroundColor: isDarkMode ? '#000000' : (backgroundColor || '#f8fafc'),
                background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg, #f8fafc)')),
                '--header-bg': isDarkMode ? '#000000' : (headerBg || '#FFFFFF'),
                '--header-text': isDarkMode ? '#FFFFFF' : (getContrastColor(headerBg || '#FFFFFF'))
              } as React.CSSProperties}
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
                      onClick={() => {
                        setNavigationDirection('backward');
setShowReceivedBreakdown(false);
                        setReceivedListFilterMonth('ALL');
                        setReceivedListFilterYear('ALL');
                        setReceivedListSearchQuery('');
                      }}
                      className="flex items-center justify-center transition-colors shrink-0"
                      style={{ color: 'var(--header-text)' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-sm font-bold uppercase tracking-tight truncate" style={{ color: 'var(--header-text)' }}>
                      {language === 'bn' ? 'রিসিভড বিবরণী' : 'Received Details'}
                    </h3>
                  </div>
                  {renderHeaderActions()}
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden relative">
                {(() => {
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

                  const getCategoryTotalReceived = (category: string, month: number | 'ALL', year: number | 'ALL'): number => {
                    const normCategory = category.toUpperCase();
                    const matchedPayments = payments.filter(p => {
                      if (p.type !== 'INCOME' || p.status !== 'RECEIVED') return false;
                      
                      const mMatch = month === 'ALL' ? true : Number(p.month) === Number(month);
                      const yMatch = year === 'ALL' ? true : Number(p.year) === Number(year);
                      if (!mMatch || !yMatch) return false;

                      const pCat = (p.category || '').toUpperCase();
                      if (pCat === 'ADVANCE') return false; // Exclude Advance from Received Details
                      
                      if (normCategory === 'VEHICLE INSPECTION') {
                        if (pCat === 'EXTRA FUEL' || pCat === 'EXTRA_FUEL') return true;
                        return false;
                      }

                      if (pCat === normCategory) return true;

                      return false;
                    });

                    // Sum up the amounts precisely mapped
                    let total = 0;
                    matchedPayments.forEach(p => {
                      const keys = Object.keys(p.details?.pendingItems || {});
                      if (keys.length > 0) {
                        keys.forEach(key => {
                          const amountPaid = p.details.pendingItems?.[key] || 0;
                          total += Number(amountPaid) || 0;
                        });
                      } else {
                        total += Number(p.amount) || 0;
                      }
                    });

                    return total;
                  };

                  const normalizeCategoryName = (name: string): string => {
                    const upper = name.toUpperCase().trim();
                    if (upper === 'SALARY') return 'Salary';
                    if (upper === 'COMMISSION') return 'Commission';
                    if (upper === 'TRIP DIESEL' || upper === 'TRIP_DIESEL') return 'Trip Diesel';
                    if (upper === 'FRIDAY') return 'Friday';
                    if (upper === 'BONUS') return 'Bonus';
                    if (upper === 'VEHICLE INSPECTION') return 'Vehicle Inspection';
                    if (upper === 'OTHERS') return 'Others';
                    
                    return name.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                  };

                  const categoriesSet = new Set(['Salary', 'Commission', 'Trip Diesel', 'Friday', 'Bonus', 'Vehicle Inspection', 'Others']);
                  payments.forEach(p => {
                    if (p.category) {
                      let cat = p.category;
                      if (cat.toUpperCase() === 'EXTRA FUEL' || cat.toUpperCase() === 'EXTRA_FUEL') {
                        cat = 'Vehicle Inspection';
                      }
                      const norm = normalizeCategoryName(cat);
                      if (norm.toUpperCase() !== 'ADVANCE' && norm.toUpperCase() !== 'USER RENEW') {
                        categoriesSet.add(norm);
                      }
                    }
                  });

                  const localBreakdown: Record<string, number> = {};
                  categoriesSet.forEach(cat => {
                    localBreakdown[cat] = getCategoryTotalReceived(cat, receivedListFilterMonth, receivedListFilterYear);
                  });

                  const filteredEntries = Object.entries(localBreakdown).filter(([category, amount]) => {
                    const defaultCategories = ['Salary', 'Commission', 'Trip Diesel', 'Friday', 'Bonus', 'Vehicle Inspection', 'Others'];
                    const isNonEmpty = Math.abs(amount) > 0 || defaultCategories.includes(category);
                    if (!isNonEmpty) return false;
                    if (receivedListSearchQuery.trim() !== '') {
                      const query = receivedListSearchQuery.toLowerCase();
                      if (!category.toLowerCase().includes(query)) return false;
                    }
                    return true;
                  });

                  const totalReceivedAmount = filteredEntries.reduce((acc, [_, amt]) => acc + amt, 0);

                  return (
                    <>
                      <div 
                        className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-12"
                        
                        
                        
                      >
                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[10px] p-5 text-white shadow-lg relative overflow-hidden">
                          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
                            <Wallet size={120} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 mb-1">
                            {language === 'bn' ? 'মোট রিসিভড' : 'Total Received'}
                          </span>
                          <h2 className="text-3xl font-black font-sans tracking-tight">
                            {`${selectedCurrency} ${totalReceivedAmount.toLocaleString()}`}
                          </h2>
                          <div className="mt-2.5 h-px bg-white/20 w-full" />
                          <p className="text-[9px] text-emerald-100/80 font-bold mt-1">
                            {language === 'bn' ? 'সকল সোর্স থেকে সংগ্রহকৃত' : 'Collected from all sources'}
                          </p>
                        </div>

                        {/* Filters Panel */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Month Select Button-Card */}
                          <button
                            type="button"
                            onClick={() => setIsReceivedMonthSelectOpen(true)}
                            className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-[8px] px-3 py-3.5 text-xs font-bold flex items-center justify-between active:scale-95 transition-all"
                          >
                            <span>
                              {receivedListFilterMonth === 'ALL'
                                ? (language === 'bn' ? 'সব মাস' : 'All Months')
                                : monthsList.find(m => m.value === receivedListFilterMonth)?.label || receivedListFilterMonth}
                            </span>
                            <ChevronDown size={14} className="text-text-muted shrink-0" />
                          </button>

                          {/* Year Select Button-Card */}
                          <button
                            type="button"
                            onClick={() => setIsReceivedYearSelectOpen(true)}
                            className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-[8px] px-3 py-3.5 text-xs font-bold flex items-center justify-between active:scale-95 transition-all"
                          >
                            <span>
                              {receivedListFilterYear === 'ALL'
                                ? (language === 'bn' ? 'সব বছর' : 'All Years')
                                : receivedListFilterYear}
                            </span>
                            <ChevronDown size={14} className="text-text-muted shrink-0" />
                          </button>
                        </div>

                        {/* List entries */}
                        {filteredEntries.map(([category, amount]: [string, any]) => {
                          const { icon: Icon, color: iconColor } = getCategoryIcon(category);
                          const displayLabel = getCategoryDisplayLabel(category, language);

                          return (
                            <div 
                              key={category} 
                              
                              onClick={() => {
                                handleReceivedCategoryClick(category);
                                setReceivedSubpageFilterMonth(receivedListFilterMonth);
                                setReceivedSubpageFilterYear(receivedListFilterYear);
                              }}
                              className="bg-card-bg p-5 rounded-[10px] shadow-sm flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-black/5"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                                  style={{ 
                                    backgroundColor: `${iconColor}20`,
                                    color: iconColor
                                  }}
                                >
                                  <Icon size={20} />
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="text-[10px] font-black uppercase text-text-main leading-tight">
                                    {displayLabel}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-emerald-500 font-sans">
                                    {`${selectedCurrency} ${amount.toLocaleString()}`}
                                  </span>
                                </div>
                                <ChevronRight size={16} className="text-text-muted opacity-50 shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                        
                        {filteredEntries.length === 0 && (
                          <div  className="text-center py-20 text-text-main">
                            <Banknote size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase">No received data found</p>
                          </div>
                        )}
                      </div>
                      <GlobalFullscreenSelect
                        isOpen={isReceivedMonthSelectOpen}
                        onClose={() => setIsReceivedMonthSelectOpen(false)}
                        onSelect={(val) => {
                          setReceivedListFilterMonth(val === 'ALL' ? 'ALL' : parseInt(val));
                          setIsReceivedMonthSelectOpen(false);
                        }}
                        options={[
                          { label: language === 'bn' ? 'সব মাস' : 'All Months', value: 'ALL' },
                          ...monthsList.map(m => ({ label: m.label, value: String(m.value) }))
                        ]}
                        title={t.SELECT_MONTH || "Select Month"}
                        selectedValue={String(receivedListFilterMonth)}
                        searchable={false}
                      />

                      <GlobalFullscreenSelect
                        isOpen={isReceivedYearSelectOpen}
                        onClose={() => setIsReceivedYearSelectOpen(false)}
                        onSelect={(val) => {
                          setReceivedListFilterYear(val === 'ALL' ? 'ALL' : parseInt(val));
                          setIsReceivedYearSelectOpen(false);
                        }}
                        options={[
                          { label: language === 'bn' ? 'সব বছর' : 'All Years', value: 'ALL' },
                          ...yearsList.map(y => ({ label: String(y), value: String(y) }))
                        ]}
                        title={t.SELECT_YEAR || "Select Year"}
                        selectedValue={String(receivedListFilterYear)}
                        searchable={false}
                      />
                    </>
                  );
                })()}
              </div>
            </div>,
        document.body
      )}

      {showPendingBreakdown && createPortal(
            <div
              key="show-pending-breakdown-page"
              className="fixed inset-0 z-[100] flex flex-col pb-[calc(76px+env(safe-area-inset-bottom))] tms-page-enter-fwd"
              style={{ 
                backgroundColor: isDarkMode ? '#000000' : (backgroundColor || '#f8fafc'),
                background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg, #f8fafc)')),
                '--header-bg': isDarkMode ? '#000000' : (headerBg || '#FFFFFF'),
                '--header-text': isDarkMode ? '#FFFFFF' : (getContrastColor(headerBg || '#FFFFFF'))
              } as React.CSSProperties}
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
                      onClick={() => {
                        setNavigationDirection('backward');
setShowPendingBreakdown(false);
                        setPendingListFilterMonth('ALL');
                        setPendingListFilterYear('ALL');
                        setPendingListSearchQuery('');
                      }}
                      className="flex items-center justify-center transition-colors shrink-0"
                      style={{ color: 'var(--header-text)' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-sm font-bold uppercase tracking-tight truncate" style={{ color: 'var(--header-text)' }}>
                      {language === 'bn' ? 'পেন্ডিং ব্যালেন্স বিবরণী' : 'Pending Balance Details'}
                    </h3>
                  </div>
                  {renderHeaderActions()}
                </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden relative">
                {(() => {
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

                  const localBreakdown: Record<string, number> = {
                    'Salary': 0,
                    'Commission': 0,
                    'Trip Diesel': 0,
                    'Friday': 0,
                    'Bonus': 0,
                    'Vehicle Inspection': 0,
                    'Others': 0
                  };

                  const pendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments);
                  const matchingPending = pendingDues.filter(p => {
                    const mMatch = pendingListFilterMonth === 'ALL' ? true : Number(p.month) === Number(pendingListFilterMonth);
                    const yMatch = pendingListFilterYear === 'ALL' ? true : Number(p.year) === Number(pendingListFilterYear);
                    return mMatch && yMatch;
                  });
                  
                  matchingPending.forEach(currentMonthPending => {
                    currentMonthPending.categories.forEach((cat: any) => {
                      let catName = cat.name || 'Others';
                      if (catName.toUpperCase() === 'EXTRA FUEL' || catName.toUpperCase() === 'EXTRA_FUEL') {
                        catName = 'Vehicle Inspection';
                      }
                      const catPending = Number(cat.totalPending) || 0;
                      
                      const matchingKey = Object.keys(localBreakdown).find(
                        k => k.toLowerCase() === catName.toLowerCase()
                      ) || catName;
                      
                      localBreakdown[matchingKey] = (localBreakdown[matchingKey] || 0) + catPending;
                    });
                  });

                  // Subtract unadjusted active advance taken from respective pending balances in localBreakdown
                  Object.keys(localBreakdown).forEach(key => {
                    const targetLookup = key === 'Vehicle Inspection' ? 'Extra Fuel' : key;
                    const unadjustedAdv = getCategoryUnadjustedAdvance(payments, targetLookup, pendingListFilterMonth, pendingListFilterYear);
                    localBreakdown[key] = Math.max(0, (localBreakdown[key] || 0) - unadjustedAdv);
                  });

                  let totalExcessDieselAdvance = 0;
                  const dieselRawPending = matchingPending.reduce((sum, cp) => {
                    const c = cp.categories.find((cat: any) => (cat.name || '').toLowerCase().includes('diesel'));
                    return sum + (Number(c?.totalPending) || 0);
                  }, 0);
                  const dieselUnadjustedAdv = getCategoryUnadjustedAdvance(payments, 'Trip Diesel', pendingListFilterMonth, pendingListFilterYear);
                  if (dieselUnadjustedAdv > dieselRawPending) {
                    totalExcessDieselAdvance = dieselUnadjustedAdv - dieselRawPending;
                  }

                  const filteredEntries = Object.entries(localBreakdown).filter(([category, amount]) => {
                    const defaultCategories = ['Salary', 'Commission', 'Trip Diesel', 'Friday', 'Bonus', 'Vehicle Inspection', 'Others'];
                    const isNonEmpty = Math.abs(amount) > 0 || defaultCategories.includes(category);
                    if (!isNonEmpty) return false;
                    if (pendingListSearchQuery.trim() !== '') {
                      const query = pendingListSearchQuery.toLowerCase();
                      if (!category.toLowerCase().includes(query)) return false;
                    }
                    return true;
                  });

                  const totalPendingAmount = filteredEntries.reduce((acc, [_, amt]) => acc + amt, 0);

                  return (
                    <>
                      <div 
                        className="flex-1 overflow-y-auto pt-global px-global space-y-4 pb-12"
                        
                        
                        
                      >
                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-[10px] p-5 text-white shadow-lg relative overflow-hidden">
                          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
                            <Clock size={120} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-100 mb-1">
                            {language === 'bn' ? 'মোট পেন্ডিং ব্যালেন্স' : 'Total Pending Balance'}
                          </span>
                          <h2 className="text-3xl font-black font-sans tracking-tight">
                            {`${selectedCurrency} ${totalPendingAmount.toLocaleString()}`}
                          </h2>
                          <div className="mt-2.5 h-px bg-white/20 w-full" />
                          <p className="text-[9px] text-orange-100/80 font-bold mt-1">
                            {language === 'bn' ? 'সকল পেন্ডিং পেমেন্ট বকেয়া' : 'Outstanding pending payments'}
                          </p>
                        </div>

                        {/* Excess Advance Taken Highlight Banner */}
                        {totalExcessDieselAdvance > 0 && (
                          <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-[10px] flex items-center justify-between gap-3 text-orange-500">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                                <Sparkles size={16} className="text-orange-500 animate-pulse" />
                              </div>
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wider">
                                  {language === 'bn' ? 'বেশি নেওয়া অ্যাডভান্স টাকা' : 'Excess Advance Taken'}
                                </p>
                                <p className="text-[10px] font-bold text-orange-500/80">
                                  {language === 'bn' ? 'অগ্রিম ডিজেল বকেয়ার চেয়ে বেশি নেওয়া হয়েছে' : 'Diesel advance taken exceeds pending dues'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black tracking-tight leading-none">
                                {selectedCurrency} {totalExcessDieselAdvance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Filters Panel */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Month Select Button-Card */}
                          <button
                            type="button"
                            onClick={() => setIsPendingListMonthSelectOpen(true)}
                            className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-[8px] px-3 py-3.5 text-xs font-bold flex items-center justify-between active:scale-95 transition-all"
                          >
                            <span>
                              {pendingListFilterMonth === 'ALL'
                                ? (language === 'bn' ? 'সব মাস' : 'All Months')
                                : monthsList.find(m => m.value === pendingListFilterMonth)?.label || pendingListFilterMonth}
                            </span>
                            <ChevronDown size={14} className="text-text-muted shrink-0" />
                          </button>

                          {/* Year Select Button-Card */}
                          <button
                            type="button"
                            onClick={() => setIsPendingListYearSelectOpen(true)}
                            className="w-full bg-card-bg text-text-main border border-black/10 dark:border-white/10 rounded-[8px] px-3 py-3.5 text-xs font-bold flex items-center justify-between active:scale-95 transition-all"
                          >
                            <span>
                              {pendingListFilterYear === 'ALL'
                                ? (language === 'bn' ? 'সব বছর' : 'All Years')
                                : pendingListFilterYear}
                            </span>
                            <ChevronDown size={14} className="text-text-muted shrink-0" />
                          </button>
                        </div>

                        {/* List entries */}
                        {filteredEntries.map(([category, amount]: [string, any]) => {
                          const { icon: Icon, color: iconColor } = getCategoryIcon(category);
                          const displayLabel = getCategoryDisplayLabel(category, language);

                          return (
                            <div 
                              key={category} 
                              
                              onClick={() => {
                                handleCategoryBreakdownClick(category);
                                setPendingFilterMonth(pendingListFilterMonth);
                                setPendingFilterYear(pendingListFilterYear);
                              }}
                              className="bg-card-bg p-5 rounded-[10px] shadow-sm flex items-center justify-between cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-black/5"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                                  style={{ 
                                    backgroundColor: `${iconColor}20`,
                                    color: iconColor
                                  }}
                                >
                                  <Icon size={20} />
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className="text-[10px] font-black uppercase text-text-main leading-tight">
                                    {displayLabel}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-[10px] font-black text-text-main font-sans">
                                    {`${selectedCurrency} ${amount.toLocaleString()}`}
                                  </span>
                                </div>
                                <ChevronRight size={16} className="text-text-muted opacity-50 shrink-0" />
                              </div>
                            </div>
                          );
                        })}
                        
                        {filteredEntries.length === 0 && (
                          <div  className="text-center py-20 text-text-main">
                            <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase">No pending data found</p>
                          </div>
                        )}
                      </div>
                      <GlobalFullscreenSelect
                        isOpen={isPendingListMonthSelectOpen}
                        onClose={() => setIsPendingListMonthSelectOpen(false)}
                        onSelect={(val) => {
                          setPendingListFilterMonth(val === 'ALL' ? 'ALL' : parseInt(val));
                          setIsPendingListMonthSelectOpen(false);
                        }}
                        options={[
                          { label: language === 'bn' ? 'সব মাস' : 'All Months', value: 'ALL' },
                          ...monthsList.map(m => ({ label: m.label, value: String(m.value) }))
                        ]}
                        title={t.SELECT_MONTH || "Select Month"}
                        selectedValue={String(pendingListFilterMonth)}
                        searchable={false}
                      />

                      <GlobalFullscreenSelect
                        isOpen={isPendingListYearSelectOpen}
                        onClose={() => setIsPendingListYearSelectOpen(false)}
                        onSelect={(val) => {
                          setPendingListFilterYear(val === 'ALL' ? 'ALL' : parseInt(val));
                          setIsPendingListYearSelectOpen(false);
                        }}
                        options={[
                          { label: language === 'bn' ? 'সব বছর' : 'All Years', value: 'ALL' },
                          ...yearsList.map(y => ({ label: String(y), value: String(y) }))
                        ]}
                        title={t.SELECT_YEAR || "Select Year"}
                        selectedValue={String(pendingListFilterYear)}
                        searchable={false}
                      />
                    </>
                  );
                })()}
              </div>
            </div>,
        document.body
      )}

      <>
      {/* Global Delete Button Removed as per request */}


      <div className="z-20 pb-4 px-4 pt-4 shrink-0">
        {/* Summary Card */}
        <div 
          className="relative overflow-hidden rounded-xl p-5 min-h-[190px] md:min-h-[220px] flex flex-col justify-between text-white shadow-md bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] border border-white/10"
        >
        {/* Visual accents */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-[80px]"></div>
        
        <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between">
          {/* Top Row: Selectors & Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsMonthSelectOpen(true)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 active:scale-95 shadow-lg"
              >
                <span>{selectedMonth === 'ALL' ? (language === 'bn' ? 'সব মাস' : 'All Month') : new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</span>
                <ChevronDown size={10} className="text-white/70" />
              </button>

              <button
                type="button"
                onClick={() => setIsYearSelectOpen(true)}
                className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-[8px] text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 active:scale-95 shadow-lg"
              >
                <span>{selectedYear === 'ALL' ? (language === 'bn' ? 'সব বছর' : 'All Years') : selectedYear}</span>
                <ChevronDown size={10} className="text-white/70" />
              </button>

              <GlobalFullscreenSelect
                isOpen={isYearSelectOpen}
                onClose={() => setIsYearSelectOpen(false)}
                onSelect={(val) => {
                  setSelectedYear(val === 'ALL' ? 'ALL' : parseInt(val));
                  setIsYearSelectOpen(false);
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
                isOpen={isMonthSelectOpen}
                onClose={() => setIsMonthSelectOpen(false)}
                onSelect={(val) => {
                  setSelectedMonth(val === 'ALL' ? 'ALL' : parseInt(val));
                  setIsMonthSelectOpen(false);
                }}
                options={[
                  { label: language === 'bn' ? 'সব মাস' : 'All Month', value: 'ALL' },
                  ...months.map(m => ({
                    label: new Date(0, m - 1).toLocaleString('default', { month: 'long' }),
                    value: String(m)
                  }))
                ]}
                title={t.SELECT_MONTH || "Select Month"}
                selectedValue={String(selectedMonth)}
                searchable={false}
              />
            </div>
            
            <button 
              onClick={() => PaymentManager.exportToCSV(summary.transactions)}
              className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl border border-white/5 backdrop-blur-sm text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90"
              title="Export Statement"
            >
              <Download size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Balance Display */}
            <div 
              className="grid grid-cols-2 gap-4"
            >
              <button 
                onClick={() => { setNavigationDirection('forward'); setShowReceivedBreakdown(true); }}
                className="relative overflow-hidden group/btn min-h-[96px] md:min-h-[112px] p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/20 hover:brightness-110 active:scale-95 transition-all text-left shadow-md flex flex-col justify-between"
              >
                {/* Watermark Icon */}
                <div className="absolute right-[-16px] bottom-[-16px] opacity-15 pointer-events-none transform group-hover/btn:scale-110 transition-transform duration-300">
                  <Wallet size={80} strokeWidth={1.5} className="text-white" />
                </div>

                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-100 whitespace-nowrap">
                      {language === 'bn' ? 'মোট রিসিভড' : 'Total Received'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">{summary.totalIncome.toLocaleString()}</span>
                    <span className="text-[11px] font-black text-emerald-100">{selectedCurrency}</span>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => { setNavigationDirection('forward'); setShowPendingBreakdown(true); }}
                className="relative overflow-hidden group/btn min-h-[96px] md:min-h-[112px] p-4 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 border border-orange-400/20 hover:brightness-110 active:scale-95 transition-all text-left shadow-md flex flex-col justify-between"
              >
                {/* Watermark Icon */}
                <div className="absolute right-[-16px] bottom-[-16px] opacity-15 pointer-events-none transform group-hover/btn:scale-110 transition-transform duration-300">
                  <Clock size={80} strokeWidth={1.5} className="text-white" />
                </div>

                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-orange-100 whitespace-nowrap">
                      {language === 'bn' ? 'বকেয়া ব্যালেন্স' : 'Pending Balance'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">{totalMonthPending.toLocaleString()}</span>
                    <span className="text-[11px] font-black text-orange-100">{selectedCurrency}</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-[80px] px-4 pt-2" id="payment-scroll-container">
      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-text-main uppercase tracking-widest">Transaction History</h3>
          <div className="flex bg-gray-100/80 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[10px] items-center relative p-0.5">
            <button 
              onClick={() => setActiveTab('INCOME')}
              className={`relative flex-1 py-3 px-6 rounded-[10px] font-bold text-sm transition-all z-10 ${
                activeTab === 'INCOME' 
                  ? 'text-white shadow-md' 
                  : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {activeTab === 'INCOME' && (
                <div
                  className="absolute inset-0 bg-blue-500 rounded-[10px] -z-10 animate-none"
                />
              )}
              Income
            </button>
            <button 
              onClick={() => setActiveTab('DEDUCTION')}
              className={`relative flex-1 py-3 px-6 rounded-[10px] font-bold text-sm transition-all z-10 ${
                activeTab === 'DEDUCTION' 
                  ? 'text-white shadow-md' 
                  : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              {activeTab === 'DEDUCTION' && (
                <div
                  className="absolute inset-0 bg-rose-500 rounded-[10px] -z-10 animate-none"
                />
              )}
              Deduction
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-[60px]">
          {filteredPayments.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted opacity-50">
              <Banknote size={48} strokeWidth={1} />
              <p className="text-xs font-bold mt-2">No transactions found</p>
            </div>
          ) : (
            filteredPayments.map(p => {
              const isVehicleInspection = p.category === 'Vehicle Inspection' || p.category?.toUpperCase() === 'EXTRA FUEL' || p.category?.toUpperCase() === 'EXTRA_FUEL';

              if (isVehicleInspection) {
                const isPaid = p.status === 'RECEIVED' || p.status === 'PAID';
                return (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedVehicleInspectionItem(p)}
                    className="bg-[#FFFBF2] dark:bg-[#1A1A1A] py-2 px-4 rounded-[10px] flex items-center justify-between shadow-sm border-[1.5px] border-[#D4AF37] dark:border-white/10 cursor-pointer group min-h-[72px] relative pointer-events-auto w-full text-left"
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center gap-4 flex-1 mr-2">
                      <div className="w-10 h-10 rounded-xl bg-[#F4EBE0] dark:bg-yellow-500/10 flex items-center justify-center text-[#8B5E3C] dark:text-yellow-400 shrink-0">
                        <Truck size={20} strokeWidth={2.5} />
                      </div>
                      <div className="overflow-hidden flex-1 text-left">
                        <h3 className="font-bold text-[10px] text-[#001F3F] dark:text-white transition-colors uppercase truncate w-full mb-1 pr-16">
                          {p.label || p.details?.extraDieselReason || p.details?.note || (language === 'bn' ? 'এক্সট্রা ফিউল' : 'Extra Fuel')}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-[#2C3E50] dark:text-gray-300 font-bold border-y border-[#D4AF37] py-1 w-fit max-w-full">
                          <span className="truncate">{language === 'bn' ? 'ভেইকেল' : 'Vehicle'}: {p.details?.vehicleNumber || p.vehicleNumber || 'N/A'}</span>
                          <span className="text-[#D4AF37] shrink-0">|</span>
                          <span className="truncate">{language === 'bn' ? 'টাইপ' : 'Type'}: {p.details?.deliveryPlace || p.details?.vehicleType || 'N/A'}</span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                           <span className="text-[10px] text-[#A67C52] font-semibold">{language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date'}:</span>
                           <span className="text-[10px] text-[#8B5E3C] font-black">
                             {p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (p.details?.loadingDate || 'N/A')}
                           </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      {!isPaid && (
                        <span 
                          style={{ fontSize: '10px' }}
                          className="absolute top-1/2 -translate-y-1/2 right-10 font-black px-3 py-1 rounded-full shadow-sm border transition-all bg-[#B45309] text-white border-[#78350F]"
                        >
                          {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                        </span>
                      )}
                      <ChevronRight size={20} className="text-[#8B5E3C] transition-colors" />
                    </div>
                  </div>
                );
              }

              const CatIcon = p.type === 'INCOME' ? ArrowDownLeft : ArrowUpRight;
              const iconColor = p.type === 'INCOME' ? '#10b981' : '#f43f5e';
              const iconBg = p.type === 'INCOME' ? '#10b98115' : '#f43f5e15';

              return (
                <div 
                  key={p.id}
                  onClick={() => setSelectedTransaction(p)}
                  className="group w-full bg-theme-card hover:bg-slate-50/50 dark:hover:bg-slate-800/50 border border-[var(--dynamic-card-border)] rounded-[10px] py-2 px-4 min-h-[72px] flex items-center justify-between transition-all duration-200 ease-out cursor-pointer relative text-left"
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Icon Container */}
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 group-hover:scale-105"
                      style={{ backgroundColor: iconBg, color: iconColor }}
                    >
                      <CatIcon size={20} className="stroke-[2.5]" />
                    </div>

                    {/* Details container */}
                    <div className="text-left min-w-0 flex-1 space-y-1 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[10px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide break-words leading-tight">
                          {getCategoryDisplayLabel(p.category, language)}
                        </p>
                        {p.type === 'INCOME' ? (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider shrink-0 ${
                            p.status === 'RECEIVED' 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}>
                            {p.status === 'RECEIVED' ? (language === 'bn' ? 'রিসিভড' : 'Received') : (language === 'bn' ? 'পেন্ডিং' : 'Pending')}
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 shrink-0">
                            {language === 'bn' ? 'ডীডাকশন' : 'Deduction'}
                          </span>
                        )}
                      </div>

                      {/* Date & Time Row - Now inside details container to align perfectly under the title */}
                      <div className="flex items-center gap-1.5 text-[8px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
                        <div className="flex items-center gap-1 shrink-0">
                          <Calendar size={9} className="opacity-70 shrink-0" />
                          <span className="font-mono">
                            {new Date(p.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                        <div className="flex items-center gap-1 shrink-0">
                          <Clock size={9} className="opacity-70 shrink-0" />
                          <span className="font-mono text-[8px]">{p.time}</span>
                        </div>
                      </div>

                      {/* User Renew Details */}
                      {p.category === 'User Renew' && p.details?.userName && (
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="inline-block text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded break-all">
                            User: {p.details.userName}
                          </span>
                        </div>
                      )}

                      {/* Notes Details */}
                      {p.details?.note && (
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic break-words leading-normal max-w-full mt-0.5">
                          "{p.details.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right container: Amount */}
                  <div className="flex items-center gap-3 shrink-0 pl-2">
                    {p.type === 'INCOME' && p.status === 'PENDING' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmAction('Mark this payment as received?', () => {
                            const now = new Date();
                            updatePayment({ 
                              ...p, 
                              status: 'RECEIVED',
                              date: now.toISOString().split('T')[0],
                              time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                            });
                            showFeedback('Payment marked as received');
                          });
                        }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase rounded-xl shadow-md shadow-emerald-500/10 active:scale-95 transition-all shrink-0"
                      >
                        {language === 'bn' ? 'রিসিভ' : 'Receive'}
                      </button>
                    )}

                    <div className="text-right flex flex-col items-end justify-center">
                      <p className={`text-[15px] sm:text-[16px] font-black font-mono flex items-center justify-end leading-none ${
                        p.type === 'INCOME' ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                      }`}>
                        {p.type === 'INCOME' ? '+' : '-'} {p.amount.toLocaleString()} <span className="text-[10px] font-bold ml-1 font-sans">{selectedCurrency}</span>
                      </p>
                    </div>

                    <div className="flex items-center text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200 shrink-0">
                      <ChevronRight size={16} className="stroke-[2.5]" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>




      {/* Category Detail Modal */}
      {viewingCategory && createPortal(
            <div
              key="viewing-category-page"
              className="fixed inset-0 z-[100] flex flex-col pb-[calc(76px+env(safe-area-inset-bottom))] tms-page-enter-fwd"
              style={{ 
                backgroundColor: isDarkMode ? '#000000' : (backgroundColor || '#f8fafc'),
                background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg, #f8fafc)')),
                '--header-bg': isDarkMode ? '#000000' : (headerBg || '#FFFFFF'),
                '--header-text': isDarkMode ? '#FFFFFF' : (getContrastColor(headerBg || '#FFFFFF'))
              } as React.CSSProperties}
            >
              <div 
                className="flex flex-col flex-1 overflow-hidden"
              >
                <div 
                  className="shrink-0 shadow-sm safe-top"
                  style={{ background: 'var(--header-bg)', color: 'var(--header-text)' }}
                >
                  <div className="h-16 flex items-center justify-between px-4 w-full gap-2">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <button 
                        onClick={() => {
                          setNavigationDirection('backward');
                          setViewingCategory(null);
                        }} 
                        className="p-2 hover:bg-white/10 rounded-full transition-colors shrink-0"
                      >
                        <X size={20} />
                      </button>
                      <h3 className="text-sm font-black uppercase tracking-widest truncate">{viewingCategory} History</h3>
                    </div>
                    {renderHeaderActions()}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-6 min-h-0">
                  {categoryTransactions.length === 0 ? (
                    <div className="py-20 text-center text-text-muted">No transactions for this category</div>
                  ) : (
                    categoryTransactions.map(p => (
                      <div 
                        key={p.id} 
                        className="bg-theme-card p-4 rounded-[10px] tx-history-card border border-black/5 dark:border-white/5 transition-shadow flex items-center justify-between cursor-pointer"
                        onClick={() => setSelectedTransaction(p)}
                      >
                        <div>
                          <p className="text-xs font-black text-text-main uppercase">{(p.method || 'CASH').replace('_', ' ')}</p>
                          <p className="text-[10px] font-bold text-text-main uppercase">
                            {new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {p.time}
                          </p>
                        </div>
                        <p className={`text-sm font-black ${p.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {p.type === 'INCOME' ? '+' : '-'} {`${selectedCurrency} ${p.amount.toLocaleString()}`}
                        </p>
                      </div>
                    ))
                  )}
                  {/* Spacer to prevent overlapping with Total Card */}
                  {categoryTransactions.length > 0 && (
                    <div className="h-10 shrink-0 pointer-events-none" />
                  )}
                </div>

                {/* Dynamic Total Calculation Card */}
                {(() => {
                  const { icon: Icon, color, bg } = getCategoryIcon(viewingCategory || '');
                  const label = `Total ${formatCategoryHeader(viewingCategory)} History`;
                  const totalAmount = categoryTransactions.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
                  const isIncome = INCOME_CATEGORIES.includes((viewingCategory || '') as any) || (categoryTransactions[0]?.type === 'INCOME');
                  return (
                    <div className="flex-none p-5 bg-card-bg backdrop-blur-xl rounded-2xl mx-4 mb-4 shadow-[0_12px_40px_rgb(0,0,0,0.15)] border border-black/5 dark:border-white/5 z-20">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: bg || 'rgba(16, 185, 129, 0.1)', color: color || '#10b981' }}>
                            {Icon ? <Icon size={20} /> : <Wallet size={20} />}
                          </div>
                          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                            {label}
                          </span>
                        </div>
                        <span className={`text-xl font-black ${isIncome ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {`${selectedCurrency} ${totalAmount.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>,
        document.body
      )}



      {/* Received Breakdown Page - REMOVED PORTAL */}
      {/* Pending Breakdown Page - REMOVED PORTAL */}

      {/* Entry Form Modal */}
      {isEntryFormOpen && formCategory?.toUpperCase() === 'ADVANCE' ? createPortal(
        <div id="payment_advance_dialog" className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            id="payment_advance_backdrop"
            onClick={() => {
              setIsEntryFormOpen(false);
              setFormCategory('');
            }}
            className="absolute inset-0 z-0 bg-slate-950/45 backdrop-blur-[6px] transition-all duration-300 animate-in fade-in"
          />
          <div 
            id="payment_advance_box"
            className={`relative w-full max-w-md rounded-[24px] p-6 md:p-8 shadow-2xl border z-[10000] overflow-visible font-sans allow-animation transition-all duration-300 transform animate-in zoom-in-95 duration-200 ${
              isDarkMode 
                ? 'bg-zinc-950 text-white border-zinc-800/80 shadow-black/80' 
                : 'bg-white text-zinc-900 border-zinc-100 shadow-zinc-200/50'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
              <div>
                <h3 className="text-md font-bold tracking-tight">
                  {language === 'bn' ? 'অগ্রিম ট্রানজেকশন' : (language === 'ar' ? 'معاملة الدفعة المقدمة' : 'Advance Transaction')}
                </h3>
                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 mt-1">
                  {language === 'bn' ? 'নতুন অগ্রিম রেকর্ড যুক্ত করুন' : 'Record a new advance payment'}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsEntryFormOpen(false);
                  setFormCategory('');
                }}
                className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 space-y-1.5">
              <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                {language === 'bn' ? 'অগ্রিমের ধরণ' : (language === 'ar' ? 'نوع الدفعة المقدمة' : 'Advance Type')}
              </label>
              <div className={`relative h-12 p-1 rounded-[8px] border flex items-stretch select-none ${
                isDarkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200/60'
              }`}>
                {/* Sliding Background Indicator */}
                <div
                  className="absolute top-1 bottom-1 rounded-[6px] shadow-sm transition-all duration-300 ease-out"
                  style={{
                    width: 'calc(50% - 4px)',
                    left: advanceType === 'TAKEN' ? '4px' : 'calc(50%)',
                    background: advanceType === 'TAKEN' ? '#10b981' : '#f43f5e',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setAdvanceType('TAKEN')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors duration-200 relative z-10 ${
                    advanceType === 'TAKEN' ? 'text-white' : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900')
                  }`}
                >
                  {language === 'bn' ? 'অগ্রিম গ্রহণ' : 'Take Advance'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdvanceType('RETURNED')}
                  className={`flex-1 flex items-center justify-center text-xs font-bold transition-colors duration-200 relative z-10 ${
                    advanceType === 'RETURNED' ? 'text-white' : (isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-900')
                  }`}
                >
                  {language === 'bn' ? 'অগ্রিম ফেরত' : 'Return Advance'}
                </button>
              </div>

              {/* Dynamic Note */}
              <div className="min-h-[20px] transition-all duration-300">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 mt-1 italic leading-normal">
                  <span className="inline-block w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  {advanceType === 'TAKEN' 
                    ? (language === 'bn' ? 'অগ্রিম নেওয়া হলে তা মোট আয় থেকে কর্তন হবে।' : 'Taking advance will be deducted from your Total Income.') 
                    : (language === 'bn' ? 'অগ্রিম ফেরত দেওয়া হলে তা মোট আয়ে যুক্ত হবে।' : 'Returning advance will be added back to your Total Income.')}
                </p>
              </div>
            </div>

            {/* Inputs Container */}
            <div id="payment_advance_fields" className="space-y-5">
              {/* Amount field (Global Floating Label Style) */}
              <div 
                className={`relative h-14 w-full transition-colors duration-200 rounded-[8px] border ${isAmountFocused ? 'z-40' : 'z-10'}`}
                style={{
                  backgroundColor: isDarkMode ? '#121212' : '#f9fafb',
                  borderWidth: isAmountFocused ? '2px' : '1px',
                  borderColor: isAmountFocused 
                    ? '#10b981' 
                    : (isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                }}
              >
                <input
                  id="payment_advance_amount_input"
                  type="number"
                  pattern="[0-9]*"
                  inputMode="decimal"
                  placeholder={isAmountFocused ? "Enter Amount" : " "}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  onFocus={() => setIsAmountFocused(true)}
                  onBlur={() => setIsAmountFocused(false)}
                  className={`peer w-full h-full rounded-[8px] bg-transparent outline-none transition-all duration-300 pl-3 pr-4 text-sm font-semibold border-0 focus:ring-0 ${
                    isDarkMode ? 'text-white' : 'text-zinc-900'
                  }`}
                  style={{ 
                    color: isDarkMode ? '#ffffff' : '#000000',
                    caretColor: '#10b981',
                  }}
                />
                <label 
                  htmlFor="payment_advance_amount_input"
                  className={`absolute font-extrabold tracking-wider text-[12px] floating-label-transition pointer-events-none z-20 rounded-none origin-left left-3 top-1/2 px-1.5`}
                  style={{
                    color: isAmountFocused 
                      ? '#10b981' 
                      : (isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
                    backgroundColor: (isAmountFocused || !!advanceAmount) 
                      ? (isDarkMode ? '#09090b' : '#ffffff') 
                      : 'transparent',
                    transform: (isAmountFocused || !!advanceAmount) 
                      ? 'translateY(-30px) scale(0.83) translateX(0px)' 
                      : 'translateY(-50%) scale(1) translateX(0px)',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), top 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.25s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {language === 'bn' ? 'টাকার পরিমাণ' : (language === 'ar' ? 'المبلغ' : 'Amount')}
                </label>
              </div>

              {/* Reason / Purpose field with dynamic floating popup */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  {language === 'bn' ? 'উদ্দেশ্য নির্বাচন করুন' : (language === 'ar' ? 'تحديد الغرض' : 'Select Purpose')}
                </label>
                <button
                  id="payment_advance_reason_button"
                  type="button"
                  onClick={() => setIsPurposeDropdownOpen(!isPurposeDropdownOpen)}
                  className={`relative w-full h-14 rounded-[8px] border transition-all duration-200 flex items-center justify-between px-4 text-left ${
                    isDarkMode 
                      ? 'bg-zinc-900/40 border-zinc-800 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20' 
                      : 'bg-zinc-50/50 border-zinc-200 hover:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10'
                  }`}
                >
                  <span className={`text-xs font-semibold ${
                    advanceReason ? (isDarkMode ? 'text-white' : 'text-zinc-900') : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {advanceReason 
                      ? (
                          language === 'bn' 
                            ? (advanceReason === 'Trip Diesel' ? 'ট্রিপ ডিজেল' :
                               advanceReason === 'Salary' ? 'স্যালারি' :
                               advanceReason === 'Commission' ? 'কমিশন' :
                               advanceReason === 'Friday' ? 'ফ্রাইডে' :
                               advanceReason === 'Bonus' ? 'বোনাস' :
                               advanceReason === 'Overtime' ? 'ওভারটাইম' :
                               advanceReason === 'Extra Fuel' ? 'এক্সট্রা ফুয়েল' :
                               advanceReason === 'Vehicle Inspection' ? 'গাড়ি পরিদর্শন' :
                               advanceReason)
                            : advanceReason
                        )
                      : (language === 'bn' ? 'উদ্দেশ্য নির্বাচন করুন...' : 'Select purpose...')
                    }
                  </span>
                  <ChevronDown size={16} className={`text-zinc-400 shrink-0 transition-transform duration-200 ${isPurposeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPurposeDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[10001]" 
                      onClick={() => setIsPurposeDropdownOpen(false)}
                    />
                    <div 
                      className={`absolute left-0 right-0 top-[calc(100%+4px)] z-[10002] rounded-[8px] p-1.5 shadow-xl border overflow-y-auto max-h-[200px] animate-in fade-in slide-in-from-top-2 duration-150 w-full bg-white text-zinc-900 border-zinc-200/80 shadow-zinc-200/40 dark:bg-zinc-900 dark:text-white dark:border-zinc-800 dark:shadow-black/80`}
                    >
                      {[
                        { value: 'Trip Diesel', label: language === 'bn' ? 'ট্রিপ ডিজেল' : (language === 'ar' ? 'ديزل الرحلة' : 'Trip Diesel') },
                        { value: 'Salary', label: language === 'bn' ? 'স্যালারি' : (language === 'ar' ? 'راتب' : 'Salary') },
                        { value: 'Commission', label: language === 'bn' ? 'কমিশন' : (language === 'ar' ? 'عمولة' : 'Commission') },
                        { value: 'Friday', label: language === 'bn' ? 'ফ্রাইডে' : (language === 'ar' ? 'الجمعة' : 'Friday') },
                        { value: 'Bonus', label: language === 'bn' ? 'বোনাস' : (language === 'ar' ? 'مكافأة' : 'Bonus') },
                        { value: 'Overtime', label: language === 'bn' ? 'ওভারটাইম' : (language === 'ar' ? 'عمل إضافي' : 'Overtime') },
                        { value: 'Extra Fuel', label: language === 'bn' ? 'এক্সট্রা ফুয়েল' : (language === 'ar' ? 'وقود إضافي' : 'Extra Fuel') },
                        { value: 'Vehicle Inspection', label: language === 'bn' ? 'গাড়ি পরিদর্শন' : (language === 'ar' ? 'فحص المركبة' : 'Vehicle Inspection') },
                        { value: 'Others', label: language === 'bn' ? 'অন্যান্য' : (language === 'ar' ? 'أخرى' : 'Others') }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setAdvanceReason(opt.value);
                            setIsPurposeDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-bold rounded-[6px] transition-colors whitespace-nowrap block ${
                            advanceReason === opt.value
                              ? 'bg-emerald-500 !text-white'
                              : 'hover:bg-zinc-100/80 text-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Method selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  {language === 'bn' ? 'পেমেন্ট মাধ্যম' : (language === 'ar' ? 'طريقة الدفع' : 'Payment Method')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { 
                      id: 'CASH', 
                      label: language === 'bn' ? 'ক্যাশ' : (language === 'ar' ? 'نقدي' : 'Cash'),
                      activeClass: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 border-transparent',
                      inactiveClass: isDarkMode 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-white' 
                        : 'bg-zinc-50 border-zinc-200/60 text-zinc-600 hover:bg-zinc-100'
                    },
                    { 
                      id: 'ONLINE_BANK', 
                      label: language === 'bn' ? 'ব্যাংক' : (language === 'ar' ? 'البنك' : 'Bank'),
                      activeClass: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 border-transparent',
                      inactiveClass: isDarkMode 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-white' 
                        : 'bg-zinc-50 border-zinc-200/60 text-zinc-600 hover:bg-zinc-100'
                    },
                    { 
                      id: 'MOBILE_BANKING', 
                      label: language === 'bn' ? 'মোবাইল' : (language === 'ar' ? 'الهاتف' : 'Mobile'),
                      activeClass: 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 border-transparent',
                      inactiveClass: isDarkMode 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-white' 
                        : 'bg-zinc-50 border-zinc-200/60 text-zinc-600 hover:bg-zinc-100'
                    }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setAdvanceMethod(m.id as any)}
                      className={`h-11 rounded-[8px] text-[11px] font-bold transition-all border ${
                        advanceMethod === m.id ? m.activeClass : m.inactiveClass
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  id="payment_cancel_advance"
                  type="button"
                  onClick={() => {
                    setIsEntryFormOpen(false);
                    setFormCategory('');
                  }}
                  className={`h-12 rounded-[8px] text-xs font-bold transition-all ${
                    isDarkMode 
                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300' 
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {language === 'bn' ? 'বাতিল' : (language === 'ar' ? 'إلغاء' : 'Cancel')}
                </button>
                <button
                  id="payment_confirm_advance"
                  type="button"
                  onClick={handleSubmitAdvance}
                  className="h-12 rounded-[8px] text-xs font-bold text-white transition-all hover:opacity-95 active:scale-[0.98] shadow-lg shadow-emerald-500/10"
                  style={{ backgroundColor: advanceType === 'TAKEN' ? '#10b981' : '#f43f5e' }}
                >
                  {language === 'bn' ? 'নিশ্চিত করুন' : (language === 'ar' ? 'تأكيد' : 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : isDesktop ? (
        isEntryFormOpen && (
          <FormWindow title={editingPayment ? "Edit Transaction" : "New Transaction"} onClose={() => { setIsEntryFormOpen(false); setEditingPayment(null); }}>
            {renderEntryFormContent()}
          </FormWindow>
        )
      ) : (
        createPortal(
            isEntryFormOpen && (
              <div
                key="payment-entry-form-mobile-page"
                className={`fixed inset-0 z-[250] flex flex-col overflow-hidden ${isLightWhite ? 'bg-[#f8fafc]' : ''}`}
                style={{ 
                  backgroundColor: isDarkMode ? '#000000' : (backgroundColor || '#f8fafc'),
                  background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg, #f8fafc)')),
                  backdropFilter: 'none',
                  WebkitBackdropFilter: 'none'
                }}
              >
                <div 
                  className="flex flex-col h-full overflow-hidden bg-black/5 dark:bg-black/90"
                  style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                >
                  {/* Header */}
                  <div 
                    className="shrink-0 shadow-sm safe-top border-b border-black/5 dark:border-white/5"
                    style={{ background: 'var(--header-bg)', color: 'var(--header-text)' }}
                  >
                    <div className="h-16 flex items-center justify-between px-4 w-full gap-2">
                      <div className="flex items-center flex-1 min-w-0">
                        <button 
                          onClick={() => { setIsEntryFormOpen(false); setEditingPayment(null); }} 
                          className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors mr-2 cursor-pointer active:scale-95 shrink-0"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <h3 className="text-sm font-black uppercase tracking-widest truncate">{editingPayment ? "Edit Transaction" : "New Transaction"}</h3>
                      </div>
                      {renderHeaderActions()}
                    </div>
                  </div>

                  {/* Form Content */}
                  {renderEntryFormContent()}

                </div>
              </div>
            ),
          document.body
        )
      )}

          {/* Pending Dues Selection Modal */}
    {createPortal(
          showPendingSelection && (
            <div
              key="show-pending-selection-page"
              className="fixed top-0 left-0 right-0 bottom-[calc(60px+env(safe-area-inset-bottom))] lg:bottom-0 z-[280] flex flex-col overflow-hidden"
              style={{ 
                backgroundColor: isDarkMode ? '#000000' : (backgroundColor || '#f8fafc'),
                background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg, #f8fafc)')) 
              }}
            >
              <div 
                className="flex flex-col h-full overflow-hidden"
              >
                {/* Header */}
                <div 
                  className="shrink-0 shadow-sm border-b border-black/5 dark:border-white/10 safe-top"
                  style={{ 
                    background: 'var(--header-bg)',
                    color: 'var(--header-text)'
                  }}
                >
                  <div className="h-16 flex items-center justify-between px-4 w-full gap-2">
                    <div className="flex items-center flex-1 min-w-0">
                      <button 
                        onClick={() => {
                          if (selectedPendingFile) {
                            setSelectedPendingFile(null);
                          } else {
                            setNavigationDirection('backward');
setShowPendingSelection(false);
                          }
                        }} 
                        className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2 shrink-0"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <h3 className="text-sm font-black uppercase tracking-widest truncate">
                        {selectedPendingFile ? 'Select Items' : 'Pending Monthly Files'}
                      </h3>
                    </div>
                    {renderHeaderActions()}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
                  {!selectedPendingFile ? (
                    // Level 1: List of Monthly Files
                    pendingDues.map(file => (
                      <button
                        key={file.fileId}
                        onClick={() => setSelectedPendingFile(file)}
                        className="w-full bg-theme-card p-5 rounded-2xl shadow-sm flex items-center justify-between hover:scale-[1.01] active:scale-95 transition-all"
                      >
                        <div className="text-left">
                          <p className="text-xs font-black text-text-main uppercase tracking-widest">
                            {new Date(0, file.month - 1).toLocaleString('default', { month: 'long' })} {file.year}
                          </p>
                          <p className="text-[10px] font-bold text-text-muted mt-1">
                            {file.categories.length} Categories Pending
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-rose-500">
                            {file.totalPending.toLocaleString()}
                          </p>
                          <p className="text-[8px] font-bold text-text-muted uppercase tracking-tighter">Pending balance</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    // Level 2: Breakdown by Category
                    <>
                      {selectedPendingFile.categories.map((cat: any) => (
                        <div key={cat.name} className="bg-theme-card rounded-2xl shadow-sm overflow-hidden">
                          <div className="p-4 bg-black/5 dark:bg-white/5 flex justify-between items-center">
                            <p className="text-xs font-black text-text-main uppercase tracking-widest">{cat.name}</p>
                            <p className="text-xs font-black text-rose-500">{cat.totalPending.toLocaleString()}</p>
                          </div>
                          <div className="p-4 space-y-3">
                            {cat.items.map((item: any) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <input 
                                  type="checkbox"
                                  checked={!!selectedItems[item.id]}
                                  onChange={(e) => handlePendingItemSelect(item.id, item.pending, e.target.checked)}
                                  className="w-5 h-5 rounded-2xl accent-green-500 focus:ring-green-500"
                                />
                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-text-main whitespace-normal break-words">{item.label}</p>
                                  <p className="text-[10px] text-text-muted">Pending: {item.pending.toLocaleString()}</p>
                                </div>
                                {selectedItems[item.id] !== undefined && (
                                    <input 
                                      type="tel"
                                      inputMode="decimal"
                                      pattern="[0-9]*[.,]?[0-9]*"
                                      value={selectedItems[item.id]}
                                      onChange={(e) => handlePendingItemAmountChange(item.id, parseFloat(e.target.value) || 0)}
                                      className="w-24 px-2 py-1 text-xs font-bold text-right bg-transparent rounded-2xl focus:ring-[3px] focus:ring-[var(--primary)]/40 focus:shadow-[0_0_12px_var(--primary)] outline-none transition-all text-text-main"
                                    />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Inline Summary and Action Cards - Scrolling with page as requested */}
                      <div className="pt-4 pb-8 space-y-3">
                        <div className="grid grid-cols-2 gap-4 bg-theme-card p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                          <div className="text-left">
                            <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Total Selected</p>
                            <p className="text-lg font-black text-emerald-500 mt-1">
                              {selectedCurrency} {(Object.values(selectedItems) as number[]).reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right border-l border-black/10 dark:border-white/10 pl-4">
                            <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Remaining Balance</p>
                            <p className="text-lg font-black text-rose-500 mt-1">
                              {selectedCurrency} {((selectedPendingFile.totalPending || 0) - (Object.values(selectedItems) as number[]).reduce((sum, val) => sum + (val || 0), 0)).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={handlePendingSelectionNext}
                          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <span>Next</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ),
      document.body
    )}
    
    {/* Trip Diesel Allocation Sub-Page */}
    {createPortal(
          showTripDieselSubPage && (
          <div
            key="show-trip-diesel-sub-page"
            className="fixed top-0 left-0 right-0 bottom-[calc(60px+env(safe-area-inset-bottom))] lg:bottom-0 z-[280] flex flex-col overflow-hidden"
            style={{ 
              backgroundColor: isDarkMode ? '#000000' : (backgroundColor || '#f8fafc'),
              background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg, #f8fafc)')) 
            }}
          >
            <div 
              className="flex flex-col h-full overflow-hidden"
            >
              {/* Header */}
              <div 
                className="shrink-0 shadow-sm border-b border-black/5 dark:border-white/10 safe-top"
                style={{ 
                  background: 'var(--header-bg)',
                  color: 'var(--header-text)'
                }}
              >
                <div className="h-16 flex items-center justify-between px-4 w-full gap-2">
                  <div className="flex items-center flex-1 min-w-0">
                    <button 
                      onClick={() => {
                        setNavigationDirection('backward');
setShowTripDieselSubPage(false);
                      }} 
                      className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2 shrink-0"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-sm font-black uppercase tracking-widest truncate">
                      {formCategory || 'Category'} Allocation
                    </h3>
                  </div>
                  {renderHeaderActions()}
                </div>
              </div>

              {/* Sub-Page Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 min-h-0">
                {/* Custom Category Filter Panel - Render ONLY for TRIP DIESEL Category */}
                {formCategory?.toUpperCase() === 'TRIP DIESEL' && (
                  <div className="bg-theme-card p-4 rounded-xl shadow-md border border-black/5 dark:border-white/5 space-y-3">
                    <h4 className="text-[10px] font-black uppercase text-text-muted tracking-wide">
                      Custom-select Sub-categories
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {[
                        { key: 'dieselPrice', label: 'Trip Diesel', icon: Fuel, color: 'text-blue-500 bg-blue-500/10' },
                        { key: 'generatorDiesel', label: 'Generator Diesel', icon: Zap, color: 'text-purple-500 bg-purple-500/10' },
                        { key: 'extraDiesel', label: 'Extra Diesel', icon: Plus, color: 'text-orange-500 bg-orange-500/10' },
                        { key: 'bonus', label: 'Bonus', icon: Award, color: 'text-emerald-500 bg-emerald-500/10' },
                        { key: 'friday', label: 'Friday', icon: Calendar, color: 'text-rose-500 bg-rose-500/10' },
                      ].map(sub => {
                        const Icon = sub.icon;
                        const hasItems = (subTypeTotals[sub.key as keyof typeof subTypeTotals] || 0) > 0;
                        return (
                          <button
                            key={sub.key}
                            type="button"
                            disabled={!hasItems}
                            onClick={() => handleSubCatToggle(sub.key)}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-[8px] border text-left transition-all ${
                              !hasItems 
                                ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5 border-transparent text-text-muted' 
                                : enabledSubCats[sub.key]
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-text-main shadow-sm'
                                  : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 text-text-muted'
                            }`}
                          >
                            <div className={`w-7 h-7 shrink-0 rounded-md flex items-center justify-center ${sub.color}`}>
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] font-black uppercase tracking-tight truncate leading-none mb-0.5 text-text-muted">{sub.label}</p>
                              <p className="text-[10px] font-black truncate leading-none text-text-main">
                                {selectedCurrency} {(subTypeTotals[sub.key as keyof typeof subTypeTotals] || 0).toLocaleString()}
                              </p>
                            </div>
                            {hasItems && (
                              <input 
                                type="checkbox"
                                checked={!!enabledSubCats[sub.key]}
                                readOnly
                                className="w-3.5 h-3.5 rounded accent-emerald-500 pointer-events-none"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flat Trip Items list */}
                <div className="space-y-3">
                  <div className="bg-theme-card px-4 py-3 rounded-[8px] shadow-sm flex justify-between items-center border border-black/5 dark:border-white/5">
                    <h4 className="text-[10px] font-black uppercase text-text-main tracking-widest">
                      Trip Wise Outstanding Dues ({groupedTripItems.length})
                    </h4>
                    <span className="bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest">
                      POOLED
                    </span>
                  </div>

                  {groupedTripItems.length === 0 ? (
                    <div className="py-12 bg-theme-card text-center rounded-[8px] text-text-muted opacity-50 flex flex-col items-center">
                      <AlertCircle size={32} />
                      <p className="text-xs font-bold mt-2">No pending {formCategory} dues available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <style>{`
                        input.to-receive-input-fixed {
                          background-color: #ffffff !important;
                          background: #ffffff !important;
                          color: #000000 !important;
                          border: 1px solid #d1d5db !important;
                          border-radius: 2px !important;
                        }
                        input.to-receive-input-fixed::placeholder {
                          color: #9ca3af !important;
                        }
                      `}</style>
                      {groupedTripItems.map((group, index) => {
                        // Check if all items in this group are selected
                        const isAllSelected = group.items.every(sub => selectedItems[sub.id] !== undefined);
                        const isAnySelected = group.items.some(sub => selectedItems[sub.id] !== undefined);
                        
                        // We can fetch a trip object for viewing detailed modal
                        const tripObj = trips.find(t => t.id === group.tripId);
                        
                        // Check if this group's details are exactly identical to the previous group's details
                        const prevGroup = index > 0 ? groupedTripItems[index - 1] : null;
                        const isDuplicateDetails = prevGroup && 
                          (group.tripDetails?.companyName || 'N/A') === (prevGroup.tripDetails?.companyName || 'N/A') &&
                          (group.tripDetails?.invoiceNumber || 'N/A') === (prevGroup.tripDetails?.invoiceNumber || 'N/A') &&
                          (group.tripDetails?.containerNumber || 'N/A') === (prevGroup.tripDetails?.containerNumber || 'N/A') &&
                          (group.tripDetails?.vehicleNumber || 'N/A') === (prevGroup.tripDetails?.vehicleNumber || 'N/A') &&
                          (group.date || group.tripDetails?.loadingDate || 'N/A') === (prevGroup.date || prevGroup.tripDetails?.loadingDate || 'N/A');

                        if (['SALARY', 'COMMISSION'].includes(formCategory?.toUpperCase() || '')) {
                           const groupCategory = (group.category || group.items[0]?.category || formCategory || '').toUpperCase();
                           const isSalary = groupCategory === 'SALARY';
                           const totalPendingForGroup = group.items.reduce((sum, item) => sum + (item.pending || 0), 0);

                           return (
                             <div 
                               key={group.tripId} 
                               className={`p-3 rounded-xl border transition-all duration-300 relative cursor-pointer overflow-hidden ${
                                 isAnySelected 
                                   ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20 shadow-[0_4px_16px_rgba(16,185,129,0.08)]' 
                                   : 'bg-theme-card border-black/10 dark:border-white/10 shadow-sm hover:border-black/20 dark:hover:border-white/20'
                               }`}
                               onClick={() => {
                                 const isAll = group.items.every(sub => selectedItems[sub.id] !== undefined);
                                 const newSelected = { ...selectedItems };
                                 group.items.forEach(sub => {
                                   if (!isAll) {
                                     newSelected[sub.id] = sub.pending;
                                   } else {
                                     delete newSelected[sub.id];
                                   }
                                 });
                                 setSelectedItems(newSelected);
                               }}
                             >
                               <div className="flex items-center gap-3">
                                 {/* Left Column: Clock Icon Box */}
                                 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                                   isSalary 
                                     ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' 
                                     : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                 }`}>
                                   <Clock size={18} className="stroke-[2.2]" />
                                 </div>

                                 {/* Middle Column: Details Block */}
                                 <div className="flex-1 min-w-0 flex flex-col gap-1 text-[11px] text-left">
                                   {/* Row 1: Title with Pending status on Right */}
                                   <div className="flex items-center gap-1.5">
                                     <h4 className="font-black text-[12px] text-text-main leading-tight">
                                       {isSalary 
                                         ? (language === 'bn' ? 'স্যালারি' : 'Salary')
                                         : (language === 'bn' ? 'কমিশন' : 'Commission')
                                       }
                                     </h4>
                                     <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 leading-none">
                                       <Clock size={9} className="shrink-0 animate-pulse" />
                                       {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                     </span>
                                   </div>

                                   {/* Row 2: Months : Month-Year */}
                                   <div className="flex items-center justify-between">
                                     <div className="flex items-center text-left flex-1 min-w-0">
                                       <span className="text-text-muted font-bold w-[95px] shrink-0">
                                         {language === 'bn' ? 'মাস' : 'Months'}
                                       </span>
                                       <span className="text-text-muted font-bold shrink-0 mr-1.5">:</span>
                                       <span className="font-extrabold text-text-main text-right flex-1 truncate">
                                         {group.monthName && group.year ? `${group.monthName}-${group.year}` : 'N/A'}
                                       </span>
                                     </div>
                                   </div>

                                   {/* Row 3: Source of Income : Salary/Commission */}
                                   <div className="flex items-center justify-between">
                                     <div className="flex items-center text-left flex-1 min-w-0">
                                       <span className="text-text-muted font-bold w-[95px] shrink-0">
                                         {language === 'bn' ? 'আয়ের উৎস' : 'Source of Income'}
                                       </span>
                                       <span className="text-text-muted font-bold shrink-0 mr-1.5">:</span>
                                       <span className={`font-black text-right flex-1 truncate ${isSalary ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                         {isSalary 
                                           ? (language === 'bn' ? 'স্যালারি' : 'Salary') 
                                           : (language === 'bn' ? 'কমিশন' : 'Commission')
                                         }
                                       </span>
                                     </div>
                                   </div>
                                 </div>

                                 {/* Right Column: Amount & Checkbox */}
                                 <div className="flex items-center gap-3 shrink-0 pl-2.5 border-l border-black/5 dark:border-white/5 h-8">
                                   <div className="text-right">
                                     <p className="text-sm font-black text-emerald-500 dark:text-emerald-400 tracking-tight leading-none">
                                       {totalPendingForGroup.toLocaleString()} {selectedCurrency}
                                     </p>
                                   </div>
                                   <input 
                                     type="checkbox"
                                     checked={isAllSelected}
                                     ref={el => { if (el) el.indeterminate = isAnySelected && !isAllSelected; }}
                                     readOnly
                                     className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-emerald-500 cursor-pointer pointer-events-none"
                                   />
                                 </div>
                               </div>
                             </div>
                           );
                        }

                        const totalPendingForGroup = group.items.reduce((sum, item) => sum + (item.pending || 0), 0);

                        return (
                          <div 
                            key={group.tripId} 
                            onClick={() => {
                              const newSelected = { ...selectedItems };
                              if (isAllSelected) {
                                // Deselect all items in this group
                                group.items.forEach(item => {
                                  delete newSelected[item.id];
                                });
                              } else {
                                // Select all items in this group
                                group.items.forEach(item => {
                                  newSelected[item.id] = item.pending || 0;
                                });
                              }
                              setSelectedItems(newSelected);
                            }}
                            className={`p-3 rounded-xl border transition-all duration-300 relative cursor-pointer overflow-hidden ${
                              isAnySelected 
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/20 shadow-[0_4px_16px_rgba(16,185,129,0.08)]' 
                                : 'bg-theme-card border-black/10 dark:border-white/10 shadow-sm hover:border-black/20 dark:hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Left Column: Clock Icon Box */}
                              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20`}>
                                <Clock size={18} className="stroke-[2.2]" />
                              </div>

                              {/* Middle Column: Details Block */}
                              <div className="flex-1 min-w-0 flex flex-col gap-1 text-[11px] text-left">
                                {/* Row 1: Title with Pending status on Right */}
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-black text-[12px] text-text-main leading-tight truncate">
                                    {group.tripDetails?.companyName || 'N/A'}
                                  </h4>
                                  <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider shrink-0 leading-none">
                                    <Clock size={9} className="shrink-0 animate-pulse" />
                                    {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                                  </span>
                                </div>

                                {/* Row 2: Container Number */}
                                <div className="flex items-center text-left flex-1 min-w-0">
                                  <span className="text-text-muted font-bold w-[100px] shrink-0">
                                    {language === 'bn' ? 'কন্টেইনার নম্বর' : 'Container Number'}
                                  </span>
                                  <span className="text-text-muted font-bold shrink-0 mr-1.5">:</span>
                                  <span className="font-extrabold text-text-main text-right flex-1 truncate">
                                    {group.tripDetails?.containerNumber || 'N/A'}
                                  </span>
                                </div>

                                {/* Row 3: Loading Date */}
                                <div className="flex items-center text-left flex-1 min-w-0">
                                  <span className="text-text-muted font-bold w-[100px] shrink-0">
                                    {language === 'bn' ? 'লোডিং ডেট' : 'Loading Date'}
                                  </span>
                                  <span className="text-text-muted font-bold shrink-0 mr-1.5">:</span>
                                  <span className="font-extrabold text-text-main text-right flex-1 truncate">
                                    {group.date || group.tripDetails?.loadingDate || 'N/A'}
                                  </span>
                                </div>

                                {/* View & Allocate link */}
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTripGroupForPopup(group);
                                  }}
                                  className="flex items-center gap-1 text-text-muted hover:text-text-main text-[10px] font-bold mt-1 self-start cursor-pointer transition-colors"
                                >
                                  <Eye size={12} className="text-text-muted" />
                                  <span>{language === 'bn' ? 'বিস্তারিত এবং বরাদ্দ' : 'View & Allocate'}</span>
                                </div>
                              </div>

                              {/* Right Column: Amount & Checkbox */}
                              <div className="flex items-center gap-3 shrink-0 pl-2.5 border-l border-black/5 dark:border-white/5 h-8">
                                <div className="text-right">
                                  <p className="text-sm font-black text-rose-500 dark:text-rose-400 tracking-tight leading-none">
                                    {totalPendingForGroup.toLocaleString()} {selectedCurrency}
                                  </p>
                                </div>
                                <input 
                                  type="checkbox"
                                  checked={isAllSelected}
                                  ref={el => { if (el) el.indeterminate = isAnySelected && !isAllSelected; }}
                                  readOnly
                                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-emerald-500 cursor-pointer pointer-events-none"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Summary and Action Cards - Scrolling with page as requested */}
                  <div className="pt-4 pb-8 space-y-3">
                    <div className="grid grid-cols-2 gap-4 bg-theme-card p-4 rounded-2xl shadow-sm border border-black/5 dark:border-white/5">
                      <div className="text-left">
                        <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Total Received</p>
                        <p className="text-lg font-black text-emerald-500 mt-1">
                          {selectedCurrency} {(Object.values(selectedItems) as number[]).reduce((sum, val) => sum + (val || 0), 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right border-l border-black/10 dark:border-white/10 pl-4">
                        <p className="text-[10px] font-black text-text-main uppercase tracking-wider">Remaining Dues Balance</p>
                        <p className="text-lg font-black text-rose-500 mt-1">
                          {selectedCurrency} {
                            (
                              flatPendingItems.reduce((sum, item) => sum + item.pending, 0) -
                              (Object.values(selectedItems) as number[]).reduce((sum, val) => sum + (val || 0), 0)
                            ).toLocaleString()
                          }
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={handleTripDieselAllocationSave}
                      className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Save & Apply Allocation</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Trip Group Popup Modal */}
              {createPortal(
                <>
                  {selectedTripGroupForPopup && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div 
                      
                      
                      
                      className="bg-theme-card border border-black/5 dark:border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="p-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
                        <div className="text-left">
                          <span className="text-[10px] font-black uppercase text-orange-500 tracking-wider">
                            {selectedTripGroupForPopup.category === 'EXTRA FUEL'
                              ? (language === 'bn' ? 'ভেইকেল ইন্সপেকশন' : 'Vehicle Inspection')
                              : (language === 'bn' ? 'বকেয়া বণ্টন বিস্তারিত' : 'Dues Allocation Details')}
                          </span>
                          <h3 className="text-base font-black text-text-main truncate mt-1">
                            {(selectedTripGroupForPopup.tripDetails?.category?.toUpperCase() === 'EXTRA FUEL' || selectedTripGroupForPopup.tripDetails?.category?.toUpperCase() === 'EXTRA_FUEL' || selectedTripGroupForPopup.category === 'EXTRA FUEL') ? (selectedTripGroupForPopup.tripDetails?.deliveryPlace || selectedTripGroupForPopup.tripDetails?.vehicleType || selectedTripGroupForPopup.tripDetails?.companyName || 'N/A') : (selectedTripGroupForPopup.tripDetails?.companyName || 'N/A')}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setSelectedTripGroupForPopup(null)}
                            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Modal Body */}
                      <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left bg-theme-card">
                        {/* Trip Metadata */}
                        {(() => {
                          const isExtraFuel = selectedTripGroupForPopup.category?.toUpperCase() === 'EXTRA FUEL' || selectedTripGroupForPopup.tripDetails?.category === 'EXTRA_FUEL';
                          return (
                            <div className={`rounded-2xl p-4 space-y-2 border ${isDarkMode ? 'bg-white/5 border-white/5 text-text-main' : 'bg-[#E8E8E8] border-zinc-200 text-zinc-950'}`}>
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>
                                  {isExtraFuel 
                                    ? (language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date')
                                    : (language === 'bn' ? 'লোডিং ডেট' : 'Loading Date')}
                                </span>
                                <span className="font-bold">
                                  {selectedTripGroupForPopup.date || selectedTripGroupForPopup.tripDetails?.loadingDate || 'N/A'}
                                </span>
                              </div>
                              
                              {!isExtraFuel && (
                                <>
                                  <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                                  <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'লোডিং প্লেস' : 'Loading Place'}</span>
                                    <span className="font-bold truncate max-w-[200px]">
                                      {selectedTripGroupForPopup.tripDetails?.loadingPlace || selectedTripGroupForPopup.loadingPlace || 'N/A'}
                                    </span>
                                  </div>
                                  <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                                  <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'ডেলিভারি প্লেস' : 'Delivery Place'}</span>
                                    <span className="font-bold truncate max-w-[200px]">
                                      {selectedTripGroupForPopup.tripDetails?.deliveryPlace || selectedTripGroupForPopup.deliveryPlace || 'N/A'}
                                    </span>
                                  </div>
                                  <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                                  <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'ইনভয়েস নম্বর' : 'Invoice Number'}</span>
                                    <span className="font-bold">
                                      {selectedTripGroupForPopup.tripDetails?.invoiceNumber || 'N/A'}
                                    </span>
                                  </div>
                                  <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                                  <div className="flex items-center justify-between text-xs font-semibold">
                                    <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'কন্টেইনার নম্বর' : 'Container Number'}</span>
                                    <span className="font-bold">
                                      {selectedTripGroupForPopup.tripDetails?.containerNumber || 'N/A'}
                                    </span>
                                  </div>
                                </>
                              )}
                              
                              <div className={`h-px my-1 ${isDarkMode ? 'bg-white/10' : 'bg-zinc-300/60'}`} />
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className={isDarkMode ? 'text-text-muted' : 'text-zinc-600'}>{language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}</span>
                                <span className="font-bold">
                                  {selectedTripGroupForPopup.tripDetails?.vehicleNumber || 'N/A'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Sub-items List */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-text-muted tracking-wider">
                              {language === 'bn' ? 'বকেয়া আইটেম সমূহ' : 'Dues Sub-items'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const allSelected = selectedTripGroupForPopup.items.every((sub: any) => selectedItems[sub.id] !== undefined);
                                const newSelected = { ...selectedItems };
                                selectedTripGroupForPopup.items.forEach((sub: any) => {
                                  if (!allSelected) {
                                    newSelected[sub.id] = sub.pending;
                                  } else {
                                    delete newSelected[sub.id];
                                  }
                                });
                                setSelectedItems(newSelected);
                              }}
                              className="text-[10px] font-bold text-orange-500 hover:underline"
                            >
                              {selectedTripGroupForPopup.items.every((sub: any) => selectedItems[sub.id] !== undefined)
                                ? (language === 'bn' ? 'সবগুলো বাদ দিন' : 'Deselect All')
                                : (language === 'bn' ? 'সবগুলো সিলেক্ট করুন' : 'Select All')}
                            </button>
                          </div>

                          <div className="space-y-2.5">
                            {selectedTripGroupForPopup.items.map((subItem: any) => {
                              const isItemSelected = selectedItems[subItem.id] !== undefined;
                              const subType = subItem.details?.subType;
                              
                              const parsedLabel = subType === 'dieselPrice' ? (language === 'bn' ? 'ট্রিপ ডিজেল' : 'Trip Diesel') :
                                            subType === 'generatorDiesel' ? (language === 'bn' ? 'জেনারেটর ডিজেল' : 'Generator Diesel') :
                                            subType === 'extraDiesel' ? (language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel') :
                                            subType === 'bonus' ? (language === 'bn' ? 'বোনাস' : 'Bonus') :
                                            subType === 'friday' ? (language === 'bn' ? 'শুক্রবার বিল' : 'Friday') :
                                            subType === 'commission' ? (language === 'bn' ? 'কমিশন' : 'Commission') :
                                            subType === 'overtime' ? (language === 'bn' ? 'ওভারটাইম' : 'Overtime') : subItem.label || 'Other';
                              let label = language === 'bn' ? `পেন্ডিং ${parsedLabel}` : `Pending ${parsedLabel}`;
                              if (subType === 'extraDiesel' || selectedTripGroupForPopup.category === 'EXTRA FUEL') {
                                label = language === 'bn' ? 'পেন্ডিং এক্সট্রা ডিজেল' : 'Pending Extra Diesel';
                              }

                              const pendingVal = subItem.pending || 0;
                              const receivedVal = isItemSelected ? (selectedItems[subItem.id] ?? 0) : 0;
                              const balanceVal = pendingVal - receivedVal;

                              return (
                                <div 
                                  key={subItem.id} 
                                  className={`px-4 py-3 rounded-2xl flex flex-col gap-2 shadow-sm border ${isDarkMode ? 'bg-white/5 border-white/5 text-text-main' : 'bg-[#E8E8E8] border-zinc-200 text-zinc-950'}`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                      <input 
                                        type="checkbox"
                                        id={`popup-check-${subItem.id}`}
                                        checked={isItemSelected}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          const newSelected = { ...selectedItems };
                                          if (checked) {
                                            newSelected[subItem.id] = pendingVal;
                                          } else {
                                            delete newSelected[subItem.id];
                                          }
                                          setSelectedItems(newSelected);
                                        }}
                                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                                      />
                                      <div className="flex flex-col text-left">
                                        <label 
                                          htmlFor={`popup-check-${subItem.id}`}
                                          className="text-xs font-extrabold text-text-main cursor-pointer select-none"
                                        >
                                          {label}
                                        </label>
                                        {(subType === 'extraDiesel' || selectedTripGroupForPopup.category === 'EXTRA FUEL') && (subItem.details?.extraDieselReason) && (
                                          <span className="text-[10px] font-bold text-orange-500">
                                            {subItem.details.extraDieselReason}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-semibold text-text-muted">
                                        {language === 'bn' ? 'পাওয়া যাবে :' : 'To Receive :'}
                                      </span>
                                      <div className="relative">
                                        <input 
                                          type="number"
                                          value={isItemSelected ? (selectedItems[subItem.id] ?? '') : ''}
                                          onChange={(e) => {
                                            const enteredVal = parseFloat(e.target.value);
                                            let finalVal = isNaN(enteredVal) ? 0 : enteredVal;
                                            if (finalVal < 0) finalVal = 0;
                                            if (finalVal > pendingVal) finalVal = pendingVal;
                                            
                                            const newSelected = { ...selectedItems };
                                            
                                            if (finalVal > 0) {
                                              newSelected[subItem.id] = finalVal;
                                            } else {
                                              if (e.target.value === '') {
                                                delete newSelected[subItem.id];
                                              } else {
                                                newSelected[subItem.id] = 0;
                                              }
                                            }
                                            setSelectedItems(newSelected);
                                          }}
                                          placeholder="0"
                                          className="w-20 h-8 text-center text-xs font-black border border-black/10 dark:border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-zinc-800 text-text-main"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] font-semibold text-text-muted">
                                    <span>{language === 'bn' ? 'বকেয়া অবশিষ্টাংশ :' : 'Bal Outstanding :'}</span>
                                    <span className="font-extrabold text-rose-500 dark:text-rose-400">
                                      {balanceVal.toLocaleString()} {selectedCurrency}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            confirmAction(
                              language === 'bn' ? 'আপনি কি এই ট্রিপের সমস্ত বকেয়া মুছে ফেলতে চান?' : 'Are you sure you want to delete all pending dues for this trip?',
                              () => {
                                const ids = selectedTripGroupForPopup.items?.map((s: any) => s.id).filter(Boolean) || [];
                                if (ids.length > 0) {
                                  clearPendingDuesForIds(ids);
                                  showFeedback(language === 'bn' ? 'সফলভাবে ডিলেট হয়েছে' : 'Deleted successfully');
                                }
                                setSelectedTripGroupForPopup(null);
                              }
                            );
                          }}
                          className="py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 text-xs font-black uppercase rounded-2xl transition-all flex items-center justify-center gap-1 shrink-0"
                          title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                        >
                          <Trash2 size={15} />
                          <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedTripGroupForPopup(null)}
                          className="flex-1 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main text-xs font-black uppercase rounded-2xl transition-all"
                        >
                          {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTripGroupForPopup(null);
                            showFeedback(language === 'bn' ? 'বরাদ্দ করা বকেয়া প্রয়োগ করা হয়েছে' : 'Allocated dues applied');
                          }}
                          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-md shadow-emerald-500/10"
                        >
                          {language === 'bn' ? 'প্রয়োগ করুন' : 'Apply'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>,
              document.body
            )}
            </div>
          </div>
        ),
      document.body
    )}

    {/* Sync Popup / Pending Details (Legacy - Keeping for fallback or other categories) */}
    {/* Removed Legacy Sync Popup */}

      {/* User Renewal Selection Modal */}
      {createPortal(
        <>
          {showUserRenewSelection && (
            <div
              className="fixed inset-0 z-[280] flex flex-col overflow-hidden"
              style={{ background: isDarkMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg)')) }}
            >
              <div 
                className="flex flex-col h-full overflow-hidden"
              >
                {/* Header */}
                <div 
                  className="shrink-0 shadow-sm border-b border-black/5 dark:border-white/10 safe-top"
                  style={{ 
                    background: 'var(--header-bg)',
                    color: 'var(--header-text)'
                  }}
                >
                  <div className="h-16 flex items-center justify-between px-4 w-full gap-2">
                    <div className="flex items-center flex-1 min-w-0">
                      <button 
                        onClick={() => { setNavigationDirection('backward'); setShowUserRenewSelection(false); }} 
                        className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2 shrink-0"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <h3 className="text-sm font-black uppercase tracking-widest truncate">Select User to Renew</h3>
                    </div>
                    {renderHeaderActions()}
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {(users || []).filter(u => u.role === 'USER').map(u => {
                    const isExpired = u.expiryDate ? new Date(u.expiryDate) < new Date() : false;
                    const isExpiringSoon = u.expiryDate ? new Date(u.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : false;
                    
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleRenewUserSelect(u)}
                        className={`w-full p-4 rounded-2xl shadow-none border border-black/5 dark:border-white/5 flex items-center justify-between hover:scale-[1.01] active:scale-95 transition-all ${
                          isExpired ? 'bg-rose-50 dark:bg-rose-900/10' : 
                          isExpiringSoon ? 'bg-amber-50 dark:bg-amber-900/10' : 
                          'bg-theme-card'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            isExpired ? 'bg-rose-500' : isExpiringSoon ? 'bg-amber-500' : 'bg-blue-500'
                          }`}>
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-black text-text-main">{u.name}</p>
                            <p className="text-[10px] font-bold text-text-muted">ID: {u.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-black uppercase tracking-wider ${
                            isExpired ? 'text-rose-500' : isExpiringSoon ? 'text-amber-500' : 'text-emerald-500'
                          }`}>
                            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring Soon' : 'Active'}
                          </p>
                          <p className="text-[10px] text-text-muted">{u.expiryDate || 'No Date'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* Transaction Details Modal */}
      {createPortal(
        <>
          {(() => {
            if (!selectedTransaction) return null;

            const getSourceName = () => {
              return selectedTransaction.details.companyName 
                || selectedTransaction.details.userName 
                || users.find(u => u.id === selectedTransaction.userId)?.name 
                || selectedTransaction.details.serviceName 
                || (language === 'bn' ? 'সাধারণ প্রশাসন' : 'General Admin');
            };

            interface PayoutTripDetails {
              tripId: string;
              containerNumber: string;
              invoiceNumber: string;
              amount: number;
              subKeys: { label: string; amount: number }[];
              loadingPoint?: string;
              deliveryPoint?: string;
            }

            const getPayoutTrips = (): PayoutTripDetails[] => {
              if (!selectedTransaction.details?.pendingItems) return [];
              
              const pendingItems = selectedTransaction.details.pendingItems;
              const tripMap: Record<string, PayoutTripDetails> = {};

              Object.entries(pendingItems).forEach(([key, amount]) => {
                const numericAmount = Number(amount) || 0;
                if (numericAmount <= 0) return;

                if (key.startsWith('AGG-')) {
                  const parts = key.split('-');
                  if (parts.length >= 4) {
                    const subKey = parts[1];
                    const fileId = parts[2];
                    const companyNameClean = parts.slice(3).join('-').replace(/_/g, ' ');

                    const matchingTrips = trips.filter(t => 
                      t.fileId === fileId && 
                      t.companyName && t.companyName.replace(/\s+/g, ' ').toLowerCase() === ((companyNameClean || "").replace(/\s+/g, ' ').toLowerCase())
                    );

                    if (matchingTrips.length > 0) {
                      const totalTripVal = matchingTrips.reduce((sum, t) => sum + (Number(t[subKey as keyof Trip]) || 0), 0);
                      matchingTrips.forEach(t => {
                        const tripVal = Number(t[subKey as keyof Trip]) || 0;
                        if (tripVal <= 0) return;
                        const share = totalTripVal > 0 ? (tripVal / totalTripVal) * numericAmount : 0;
                        if (share <= 0) return;

                        const tripId = t.id;
                        if (!tripMap[tripId]) {
                          tripMap[tripId] = {
                            tripId,
                            containerNumber: t.containerNumber || 'N/A',
                            invoiceNumber: t.invoiceNumber || 'N/A',
                            amount: 0,
                            subKeys: [],
                            loadingPoint: t.loadingPlace || '',
                            deliveryPoint: t.deliveryPlace || ''
                          };
                        }
                        tripMap[tripId].amount += share;
                        let subLabel = subKey;
                        if (subKey === 'commission') subLabel = language === 'bn' ? 'কমিশন' : 'Commission';
                        tripMap[tripId].subKeys.push({ label: subLabel, amount: share });
                      });
                    }
                  }
                } else {
                  let tripId = key;
                  let subKey = '';

                  if (key.includes('-')) {
                    const dashIndex = key.lastIndexOf('-');
                    const potentialTripId = key.substring(0, dashIndex);
                    const potentialSubKey = key.substring(dashIndex + 1);
                    if (trips.some(t => t.id === potentialTripId)) {
                      tripId = potentialTripId;
                      subKey = potentialSubKey;
                    }
                  }

                  const trip = trips.find(t => t.id === tripId);
                  if (trip) {
                    if (!tripMap[tripId]) {
                      tripMap[tripId] = {
                        tripId,
                        containerNumber: trip.containerNumber || 'N/A',
                        invoiceNumber: trip.invoiceNumber || 'N/A',
                        amount: 0,
                        subKeys: [],
                        loadingPoint: trip.loadingPlace || '',
                        deliveryPoint: trip.deliveryPlace || ''
                      };
                    }
                    tripMap[tripId].amount += numericAmount;
                    if (subKey) {
                      let label = subKey;
                      if (subKey === 'dieselPrice') label = language === 'bn' ? 'ডিজেল' : 'Diesel';
                      else if (subKey === 'extraDiesel') label = trip.extraDieselReason || (language === 'bn' ? 'অতিরিক্ত ডিজেল' : 'Extra Diesel');
                      else if (subKey === 'generatorDiesel') label = language === 'bn' ? 'জেনারেটর ডিজেল' : 'Gen Diesel';
                      else if (subKey === 'commission') label = language === 'bn' ? 'কমিশন' : 'Commission';
                      else if (subKey === 'friday') label = language === 'bn' ? 'শুক্রবার বিল' : 'Friday';
                      else if (subKey === 'bonus') label = language === 'bn' ? 'বোনাস' : 'Bonus';
                      else if (subKey === 'overtime') label = language === 'bn' ? 'ওভারটাইম' : 'Overtime';

                      tripMap[tripId].subKeys.push({ label, amount: numericAmount });
                    } else {
                      tripMap[tripId].subKeys.push({ label: selectedTransaction.category || (language === 'bn' ? 'অন্যান্য' : 'Other'), amount: numericAmount });
                    }
                  }
                }
              });

              return Object.values(tripMap);
            };

            const downloadTransactionReceipt = async (txn: Payment, tripsList: PayoutTripDetails[]) => {
              const doc = new jsPDF('p', 'mm', 'a4');
              const sourceName = getSourceName();
              
              // Get the associated user info
              const txnUser = users.find(u => u.id === txn.userId) || user;
              const employeeName = txnUser?.name || 'N/A';
              const mobileNumber = txnUser?.mobileNumber || 'N/A';
              const idNumber = txnUser?.idNumber || txnUser?.id || 'N/A';
              
              const dateStr = txn.date;
              const timeStr = txn.time;

              // --- 1. Draw Premium Header Card ---
              // Rounded rectangle with deep navy fill
              doc.setFillColor(14, 25, 44); // Deep navy blue #0E192C
              doc.roundedRect(15, 15, 180, 42, 4, 4, 'F');

              // Text inside Header Card
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(22);
              doc.text("FleetPro Transport Manager", 22, 28);

              doc.setFont('helvetica', 'bold');
              doc.setFontSize(11);
              doc.text("Transaction History Statement", 22, 36);

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              doc.setTextColor(180, 180, 180);
              doc.text("Official bulk payment history statement", 22, 43);

              // Generated info on the right
              doc.setTextColor(255, 255, 255);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              
              // Standard date-time format matching the screenshot
              let displayGeneratedTime = `${dateStr}, ${timeStr}`;
              try {
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj.getTime())) {
                  displayGeneratedTime = `${dateObj.toLocaleDateString('en-US')}, ${timeStr}`;
                }
              } catch (e) {
                // fallback to original
              }
              const generatedText = `Generated: ${displayGeneratedTime}`;
              const textWidth = doc.getTextWidth(generatedText);
              doc.text(generatedText, 195 - textWidth - 5, 28);

              // --- 2. Info Section (Employee and Source) ---
              // Draw light background card
              doc.setFillColor(248, 250, 252); // Slate 50
              doc.roundedRect(15, 63, 180, 32, 2, 2, 'F');
              
              // Draw border around the card
              doc.setDrawColor(226, 232, 240); // Slate 200
              doc.roundedRect(15, 63, 180, 32, 2, 2, 'D');

              // Information labels and values
              doc.setTextColor(15, 23, 42); // Slate 900
              doc.setFontSize(9);

              const leftColX = 22;
              const rightColX = 110;

              // Row 1
              doc.setFont('helvetica', 'bold');
              doc.text("Employee Name:", leftColX, 71);
              doc.setFont('helvetica', 'normal');
              doc.text(employeeName, leftColX + 30, 71);

              doc.setFont('helvetica', 'bold');
              doc.text("Mobile Number:", rightColX, 71);
              doc.setFont('helvetica', 'normal');
              doc.text(mobileNumber, rightColX + 30, 71);

              // Row 2
              doc.setFont('helvetica', 'bold');
              doc.text("ID Number:", leftColX, 81);
              doc.setFont('helvetica', 'normal');
              doc.text(idNumber, leftColX + 30, 81);

              doc.setFont('helvetica', 'bold');
              doc.text((selectedTransaction.details?.category?.toUpperCase() === 'EXTRA FUEL' || selectedTransaction.details?.category?.toUpperCase() === 'EXTRA_FUEL') ? "Vehicle Inspection:" : "Source Name:", rightColX, 81);
              doc.setFont('helvetica', 'normal');
              doc.text(sourceName, rightColX + 30, 81);

              // --- 3. Build Table Rows ---
              const tableRows: any[] = [];
              let grandTotal = 0;

              tripsList.forEach(t => {
                const tripObj = trips.find(tr => tr.id === t.tripId);
                const loadingDate = tripObj?.loadingDate || 'N/A';
                const companyName = tripObj?.companyName || 'N/A';
                const containerNumber = t.containerNumber || 'N/A';

                if (t.subKeys && t.subKeys.length > 0) {
                  t.subKeys.forEach(sk => {
                    tableRows.push([
                      loadingDate,
                      companyName,
                      containerNumber,
                      sk.label,
                      `${selectedCurrency} ${sk.amount.toLocaleString()}`,
                      `${selectedCurrency} ${sk.amount.toLocaleString()}`
                    ]);
                    grandTotal += sk.amount;
                  });
                } else {
                  tableRows.push([
                    loadingDate,
                    companyName,
                    containerNumber,
                    txn.category || 'N/A',
                    `${selectedCurrency} ${t.amount.toLocaleString()}`,
                    `${selectedCurrency} ${t.amount.toLocaleString()}`
                  ]);
                  grandTotal += t.amount;
                }
              });

              // Add total row at the end matching the screenshot
              tableRows.push([
                { content: 'Total', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', font: 'helvetica' } },
                { content: `${selectedCurrency} ${grandTotal.toLocaleString()}`, styles: { fontStyle: 'bold', font: 'helvetica' } }
              ]);

              // --- 4. Render Table using autoTable ---
              autoTable(doc, {
                startY: 103,
                margin: { left: 15, right: 15 },
                head: [['Loading Date', 'Company Name', 'Container Number', 'Diesel Type', 'Amount', 'Total']],
                body: tableRows,
                theme: 'striped',
                headStyles: {
                  fillColor: [14, 25, 44], // #0e192c Dark Navy Blue
                  textColor: [255, 255, 255],
                  fontSize: 9,
                  fontStyle: 'bold',
                  halign: 'left',
                },
                bodyStyles: {
                  fontSize: 8.5,
                  textColor: [30, 41, 59], // Slate 800
                },
                columnStyles: {
                  0: { cellWidth: 22 },
                  1: { cellWidth: 45 },
                  2: { cellWidth: 33 },
                  3: { cellWidth: 40 },
                  4: { cellWidth: 20, halign: 'right' },
                  5: { cellWidth: 20, halign: 'right' }
                },
                styles: {
                  font: 'helvetica',
                  cellPadding: 3,
                  overflow: 'ellipsize',
                },
                didParseCell: (data) => {
                  // align header amount and total columns to the right
                  if (data.section === 'head' && (data.column.index === 4 || data.column.index === 5)) {
                    data.cell.styles.halign = 'right';
                  }
                }
              });

              // --- 5. Payment Method & Bank Details Section ---
              // Get end-Y of the table
              const finalY = (doc as any).lastAutoTable.finalY || 180;

              // Draw light background card for Payment Method Details
              doc.setFillColor(248, 250, 252); // Slate 50
              doc.roundedRect(15, finalY + 10, 180, 24, 2, 2, 'F');
              doc.setDrawColor(226, 232, 240); // Slate 200
              doc.roundedRect(15, finalY + 10, 180, 24, 2, 2, 'D');

              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(15, 23, 42); // Slate 900
              doc.text("Payment Details", 22, finalY + 16);

              // Values
              doc.setFontSize(8.5);
              
              // Row 1: Payment Method & Bank Name (if ONLINE_BANK)
              doc.setFont('helvetica', 'bold');
              doc.text("Payment Method:", 22, finalY + 22);
              doc.setFont('helvetica', 'normal');
              doc.text(txn.method === 'ONLINE_BANK' ? 'Online Bank Transfer' : (txn.method || 'Cash'), 52, finalY + 22);

              if (txn.method === 'ONLINE_BANK') {
                doc.setFont('helvetica', 'bold');
                doc.text("Bank Name:", 110, finalY + 22);
                doc.setFont('helvetica', 'normal');
                const bankName = txn.details?.bankName ? (banks.find(b => b.id === txn.details.bankName)?.name || txn.details.bankName) : 'N/A';
                doc.text(bankName, 135, finalY + 22);

                // Row 2: Account Number & Branch Name
                doc.setFont('helvetica', 'bold');
                doc.text("Account Number:", 22, finalY + 28);
                doc.setFont('helvetica', 'normal');
                doc.text(txn.details?.accountNumber || 'N/A', 52, finalY + 28);

                doc.setFont('helvetica', 'bold');
                doc.text("Branch Name:", 110, finalY + 28);
                doc.setFont('helvetica', 'normal');
                const branchName = txn.details?.branchName ? (branches.find(b => b.id === txn.details.branchName)?.name || txn.details.branchName) : 'N/A';
                doc.text(branchName, 135, finalY + 28);
              } else {
                // If Cash or other method
                doc.setFont('helvetica', 'bold');
                doc.text("Transaction ID:", 110, finalY + 22);
                doc.setFont('helvetica', 'normal');
                doc.text(txn.transactionId || 'N/A', 135, finalY + 22);

                doc.setFont('helvetica', 'bold');
                doc.text("Date & Time:", 22, finalY + 28);
                doc.setFont('helvetica', 'normal');
                doc.text(`${txn.date} ${txn.time || ''}`, 52, finalY + 28);
              }

              // --- 6. Official Note / Footer Section ---
              const footerStartY = finalY + 41;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(15, 23, 42); // Slate 900
              doc.text("Official Note", 15, footerStartY);

              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8.5);
              doc.setTextColor(71, 85, 105); // Slate 600
              doc.text("This statement is generated for the Transaction History / Bulk Payment Details module only.", 15, footerStartY + 6);
              doc.text("All colors and  follow the current app theme contrast logic.", 15, footerStartY + 11);

              // --- 6. Save PDF ---
              await downloadPdf(doc, `receipt_${txn.transactionId}.pdf`, showFeedback, language);
            };

            const tripsList = getPayoutTrips();
            const tripsCount = tripsList.length;

            const categoryUpper = selectedTransaction.category?.toUpperCase() || '';
            const isIncome = selectedTransaction.type === 'INCOME';
            const catIconInfo = getCategoryIcon(selectedTransaction.category);
            const CatIcon = catIconInfo?.icon || (isIncome ? ArrowDownLeft : ArrowUpRight);
            const iconBg = catIconInfo?.bg || (isIncome ? '#10b98115' : '#f43f5e15');
            const iconColor = catIconInfo?.color || (isIncome ? '#10b981' : '#f43f5e');
            const catDisplay = getCategoryDisplayLabel(selectedTransaction.category, language);

            const getMonthName = (mNum: number) => {
              const idx = mNum - 1;
              if (language === 'bn') {
                const monthsBn = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
                return monthsBn[idx] || '';
              } else {
                const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                return monthsEn[idx] || '';
              }
            };

            const displayMonth = selectedTransaction.month ? getMonthName(selectedTransaction.month) : '';
            const displayYear = selectedTransaction.year || '';

            // Build dynamic data attributes list based on Category
            const detailsList: { label: string; value: string; isMono?: boolean; icon?: React.ReactNode }[] = [];

            // 1. Common Transaction Identity Fields
            detailsList.push({
              label: language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID',
              value: selectedTransaction.transactionId || 'N/A',
              isMono: true,
              icon: <Hash size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
            });
            
            detailsList.push({
              label: language === 'bn' ? 'তারিখ ও সময়' : 'Date & Time',
              value: `${selectedTransaction.date} • ${selectedTransaction.time || ''}`,
              icon: <Calendar size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
            });

            // 2. Category Specific Fields
            if (categoryUpper === 'USER RENEW') {
              detailsList.push({
                label: language === 'bn' ? 'ইউজার নাম' : 'User Name',
                value: selectedTransaction.details?.userName || 'N/A',
                icon: <UserIcon size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
              });
              if (selectedTransaction.details?.duration) {
                detailsList.push({
                  label: language === 'bn' ? 'মেয়াদ কাল' : 'Duration',
                  value: selectedTransaction.details?.duration,
                  icon: <Clock size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });
              }
              if (selectedTransaction.details?.previousExpiryDate) {
                detailsList.push({
                  label: language === 'bn' ? 'পূর্ববর্তী মেয়াদ' : 'Prev Expiry',
                  value: selectedTransaction.details?.previousExpiryDate,
                  icon: <Calendar size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });
              }
              if (selectedTransaction.details?.newExpiryDate) {
                detailsList.push({
                  label: language === 'bn' ? 'নতুন মেয়াদ' : 'New Expiry',
                  value: selectedTransaction.details?.newExpiryDate,
                  icon: <Calendar size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });
              }
            } else if (categoryUpper === 'VEHICLE INSPECTION' || categoryUpper === 'EXTRA FUEL' || categoryUpper === 'EXTRA_FUEL') {
              detailsList.push({
                label: language === 'bn' ? 'যানবাহন নম্বর' : 'Vehicle Number',
                value: selectedTransaction.details?.vehicleNumber || selectedTransaction.vehicleNumber || 'N/A',
                icon: <Car size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
              });
              detailsList.push({
                label: language === 'bn' ? 'পরিদর্শনের স্থান/টাইপ' : 'Inspection Place/Type',
                value: selectedTransaction.details?.deliveryPlace || selectedTransaction.details?.vehicleType || 'N/A',
                icon: <MapPin size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
              });
              if (selectedTransaction.details?.extraDieselReason) {
                detailsList.push({
                  label: language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel',
                  value: selectedTransaction.details?.extraDieselReason,
                  icon: <Fuel size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });
              } else if (selectedTransaction.details?.note) {
                detailsList.push({
                  label: language === 'bn' ? 'কারণ / বিবরণ' : 'Reason / Note',
                  value: selectedTransaction.details?.note || 'N/A',
                  icon: <FileText size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });
              }
            } else if (categoryUpper === 'ADVANCE') {
              detailsList.push({
                label: language === 'bn' ? 'অ্যাডভান্স টাইপ' : 'Advance Type',
                value: selectedTransaction.details?.advanceType || 'N/A',
                icon: <Coins size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
              });
              if (selectedTransaction.details?.advanceReason) {
                detailsList.push({
                  label: language === 'bn' ? 'কারণ' : 'Reason',
                  value: selectedTransaction.details?.advanceReason,
                  icon: <FileText size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });
              }
              if (selectedTransaction.details?.companyName) {
                detailsList.push({
                  label: language === 'bn' ? 'কোম্পানি নাম' : 'Company Name',
                  value: selectedTransaction.details?.companyName,
                  icon: <Building size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });
              }
            } else if (categoryUpper === 'SALARY' || categoryUpper === 'COMMISSION') {
              if (selectedTransaction.month) {
                detailsList.push({
                  label: language === 'bn' ? 'স্যালারি মাস' : 'Salary Period',
                  value: `${displayMonth} ${displayYear}`,
                  icon: <Calendar size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });
              }
            } else {
              // Default Fallback details
              if (selectedTransaction.type === 'INCOME') {
                // Removed Source Name as requested by user
              } else {
                // Deduction/Expense fallback details: Remove Source Name, show relevant fields
                const txnUser = users.find(u => u.id === selectedTransaction.userId);
                if (txnUser) {
                  detailsList.push({
                    label: language === 'bn' ? 'কর্মচারী / ব্যবহারকারী' : 'Employee / User',
                    value: txnUser.name,
                    icon: <UserIcon size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                  });
                }
                
                detailsList.push({
                  label: language === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method',
                  value: selectedTransaction.method ? selectedTransaction.method.replace('_', ' ') : 'CASH',
                  icon: <CreditCard size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                });

                if (selectedTransaction.details?.serviceName) {
                  detailsList.push({
                    label: language === 'bn' ? 'সার্ভিস নাম' : 'Service Name',
                    value: selectedTransaction.details.serviceName,
                    icon: <Tag size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                  });
                }
              }
            }

            // Note field if present and not already displayed
            if (selectedTransaction.details?.note && 
                categoryUpper !== 'VEHICLE INSPECTION' && 
                categoryUpper !== 'EXTRA FUEL' && 
                categoryUpper !== 'EXTRA_FUEL' &&
                !detailsList.some(item => item.label === (language === 'bn' ? 'মন্তব্য' : 'Note') || item.label === (language === 'bn' ? 'বিবরণ / নোট' : 'Note / Reason'))
            ) {
              detailsList.push({
                label: language === 'bn' ? 'মন্তব্য' : 'Note',
                value: selectedTransaction.details.note,
                icon: <FileText size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
              });
            }

            return (
              <div 
                className="fixed inset-0 z-[9999] bg-black/40 sm:bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center pt-[56px] pb-[calc(64px+env(safe-area-inset-bottom))] sm:pt-8 sm:pb-8 px-4 sm:px-6 animate-fade-in"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setSelectedTransaction(null);
                  }
                }}
              >
                {/* THE SINGLE UNIFIED ALL-IN-ONE DETAILS CARD */}
                <div 
                  className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-[0_12px_35px_-5px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)] relative z-10 animate-scale-in flex flex-col overflow-hidden h-[82vh] max-h-[85vh] sm:h-auto sm:max-h-[82vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Scrollable Details Body */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
                    {/* Top Row: Category Header and Close X Button */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: iconBg, color: iconColor }}
                        >
                          <CatIcon size={16} />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xs font-black text-slate-800 dark:text-zinc-100 tracking-tight">
                            {language === 'bn' ? 'ট্রানজেকশন বিবরণ' : 'Transaction Details'}
                          </h3>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                            {catDisplay}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedTransaction(null)}
                        className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-400 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors active:scale-90"
                        title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {/* Top Centered Section: Animated Tick/Clock Circle, Category, Amount & Status */}
                    <div className="flex flex-col items-center justify-center text-center">
                      {/* Live Animated Success Tick Mark or Clock Ring */}
                      {(() => {
                        const isPaid = selectedTransaction.status === 'RECEIVED' || selectedTransaction.status === 'COMPLETED';
                        if (isPaid) {
                          return (
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] mb-1.5">
                              <motion.svg 
                                className="w-6 h-6 text-emerald-500" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              >
                                <motion.path 
                                  d="M20 6L9 17L4 12" 
                                  initial={{ pathLength: 0 }} 
                                  animate={{ pathLength: 1 }} 
                                  transition={{ duration: 0.5, ease: "easeInOut", delay: 0.15 }} 
                                />
                              </motion.svg>
                            </div>
                          );
                        } else {
                          return (
                            <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)] mb-1.5">
                              <Clock size={20} className="text-amber-500 animate-pulse" />
                            </div>
                          );
                        }
                      })()}

                      {(() => {
                        const isPaid = selectedTransaction.status === 'RECEIVED' || selectedTransaction.status === 'COMPLETED';
                        const amountBgClass = isPaid
                          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/10 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/10 dark:border-amber-500/20 text-amber-700 dark:text-amber-400';

                        return (
                          <div className={`w-full rounded-2xl p-3 border flex flex-col items-center justify-center text-center my-2 ${amountBgClass}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">
                              {catDisplay}
                            </span>
                            
                            {/* Money Amount in the Center */}
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight font-sans flex items-baseline justify-center gap-1.5 leading-tight">
                              <span className="opacity-60 font-semibold">{isIncome ? '+' : '-'}</span>
                              <span>{selectedTransaction.amount.toLocaleString()}</span>
                              <span className="text-xs sm:text-sm font-bold opacity-60 tracking-normal ml-0.5">{selectedCurrency}</span>
                            </h2>

                            {/* Status Badge inside the card */}
                            <div className="mt-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                isPaid
                                  ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isPaid
                                    ? 'bg-emerald-500 animate-pulse'
                                    : 'bg-amber-500'
                                }`} />
                                {selectedTransaction.status === 'RECEIVED' ? (language === 'bn' ? 'পরিশোধিত' : 'Paid') : (language === 'bn' ? 'পেন্ডিং' : 'Pending')}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Subtle Divider Line */}
                    <div className="my-2.5 sm:my-3 border-t border-slate-100 dark:border-zinc-800/80" />

                    {/* Remaining Details Inside the SAME Single Card */}
                    <div className="space-y-0">
                      {(categoryUpper === 'SALARY' || categoryUpper === 'COMMISSION') ? (
                        <>
                          {selectedTransaction.month && (
                            <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100/80 dark:border-zinc-800/60 text-left">
                              <div className="flex items-center gap-2 min-w-0">
                                <Calendar size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                                  {language === 'bn' ? 'বেতন মাস' : 'Salary Period'}
                                </span>
                              </div>
                              <span className="text-xs font-black text-slate-800 dark:text-zinc-200 text-right">
                                {displayMonth} {displayYear}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100/80 dark:border-zinc-800/60 text-left">
                            <div className="flex items-center gap-2 min-w-0">
                              <Hash size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                                {language === 'bn' ? 'রেফারেন্স আইডি' : 'Reference ID'}
                              </span>
                            </div>
                            <span className="text-xs font-black font-mono text-slate-800 dark:text-zinc-200 text-right">
                              {selectedTransaction.transactionId || 'N/A'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100/80 dark:border-zinc-800/60 text-left">
                            <div className="flex items-center gap-2 min-w-0">
                              <Clock size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                                {language === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}
                              </span>
                            </div>
                            <span className="text-xs font-black text-slate-800 dark:text-zinc-200 text-right">
                              {selectedTransaction.date} {selectedTransaction.time ? `• ${selectedTransaction.time}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100/80 dark:border-zinc-800/60 text-left">
                            <div className="flex items-center gap-2 min-w-0">
                              <CreditCard size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                                {language === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'}
                              </span>
                            </div>
                            <span className="text-xs font-black text-slate-800 dark:text-zinc-200 text-right uppercase">
                              {selectedTransaction.method ? selectedTransaction.method.replace('_', ' ') : 'CASH'}
                            </span>
                          </div>

                          {selectedTransaction.details?.note && (
                            <div className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100/80 dark:border-zinc-800/60 text-left">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText size={14} className="text-slate-400 dark:text-zinc-500 shrink-0" />
                                <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                                  {language === 'bn' ? 'মন্তব্য' : 'Note'}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 text-right max-w-[65%] leading-relaxed">
                                {selectedTransaction.details.note}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        detailsList.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-100/80 dark:border-zinc-800/60 last:border-0 text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {item.icon}
                              <span className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider truncate">
                                {item.label}
                              </span>
                            </div>
                            <span className={`text-xs font-black text-slate-800 dark:text-zinc-200 text-right break-words max-w-[65%] leading-relaxed ${item.isMono ? 'font-mono' : ''}`}>
                              {item.value}
                            </span>
                          </div>
                        ))
                      )}

                      {/* Online Bank Details if method === 'ONLINE_BANK' inside the SAME card */}
                      {selectedTransaction.method === 'ONLINE_BANK' && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 space-y-1 text-left">
                          <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">
                            {language === 'bn' ? 'ব্যাংক লেনদেনের তথ্য' : 'Bank Transfer Information'}
                          </span>
                          {selectedTransaction.details?.bankName && (
                            <div className="flex justify-between items-center text-[11px] py-1">
                              <span className="text-slate-400 dark:text-zinc-500 font-bold">{language === 'bn' ? 'ব্যাংক নাম' : 'Bank Name'}</span>
                              <span className="font-black text-slate-800 dark:text-zinc-200 text-right">
                                {banks.find(b => b.id === selectedTransaction.details.bankName)?.name || selectedTransaction.details.bankName}
                              </span>
                            </div>
                          )}
                          {selectedTransaction.details?.accountNumber && (
                            <div className="flex justify-between items-center text-[11px] py-1">
                              <span className="text-slate-400 dark:text-zinc-500 font-bold">{language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}</span>
                              <span className="font-mono font-black text-slate-800 dark:text-zinc-200 text-right">{selectedTransaction.details.accountNumber}</span>
                            </div>
                          )}
                          {selectedTransaction.details?.branchName && (
                            <div className="flex justify-between items-center text-[11px] py-1">
                              <span className="text-slate-400 dark:text-zinc-500 font-bold">{language === 'bn' ? 'ব্রাঞ্চ নাম' : 'Branch Name'}</span>
                              <span className="font-black text-slate-800 dark:text-zinc-200 text-right">
                                {branches.find(b => b.id === selectedTransaction.details.branchName)?.name || selectedTransaction.details.branchName}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Paid Trips Breakdown if present inside the SAME card */}
                      {tripsList.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2 text-left">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                              {language === 'bn' ? 'পরিশোধিত ট্রিপ সমূহের তালিকা' : 'Paid Trips Breakdown'}
                            </span>
                            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                              {tripsCount} {tripsCount === 1 ? (language === 'bn' ? 'ট্রিপ' : 'Trip') : (language === 'bn' ? 'ট্রিপ' : 'Trips')}
                            </span>
                          </div>
                          <div className={`overflow-y-auto pr-1 custom-scrollbar ${
                            categoryUpper === 'TRIP DIESEL' || categoryUpper === 'TRIP_DIESEL' 
                              ? 'max-h-[380px] sm:max-h-[420px]' 
                              : 'max-h-[160px]'
                          } space-y-2`}>
                            {tripsList.map(t => {
                              const isTripDieselCat = categoryUpper === 'TRIP DIESEL' || categoryUpper === 'TRIP_DIESEL';
                              return (
                                <div 
                                  key={t.tripId} 
                                  className={`flex flex-col py-3 last:border-0 text-[11px] gap-2 transition-all ${
                                    isTripDieselCat 
                                      ? 'bg-white dark:bg-zinc-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 my-2 shadow-sm' 
                                      : 'border-b border-slate-100/60 dark:border-zinc-800/40'
                                  }`}
                                >
                                  <div className="flex justify-between items-center gap-2">
                                    <div className="flex items-center text-left min-w-0 flex-1 gap-1.5">
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isTripDieselCat ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                      {!isTripDieselCat && (
                                        <span className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                                          {language === 'bn' ? 'কন্টেইনার:' : 'Cont:'}
                                        </span>
                                      )}
                                      <span className="font-black text-slate-800 dark:text-zinc-100">{t.containerNumber}</span>
                                    </div>
                                    <div className="font-mono font-black text-slate-800 dark:text-zinc-200 shrink-0 text-right bg-slate-50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-zinc-800/60 shadow-2xs">
                                      {selectedCurrency} {t.amount.toLocaleString()}
                                    </div>
                                  </div>

                                  {!isTripDieselCat && t.subKeys.length > 0 && (
                                    <div className="text-[9px] text-slate-400 dark:text-zinc-500 break-words leading-normal ml-3 font-semibold text-left">
                                      ({t.subKeys.map(sk => `${sk.label}: ${sk.amount.toLocaleString()}`).join(' | ')})
                                    </div>
                                  )}

                                  {/* Beautiful side-by-side Loading/Delivery Point inside specific Trip card */}
                                  {isTripDieselCat && (t.loadingPoint || t.deliveryPoint) && (
                                    <div className="ml-3 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9.5px] leading-relaxed text-slate-500 dark:text-zinc-400">
                                      {t.loadingPoint && (
                                        <span className="flex items-center gap-1">
                                          <span className="font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[8px]">
                                            {language === 'bn' ? 'লোডিং পয়েন্ট' : 'Loading Point'}
                                          </span>
                                          <span className="font-black text-slate-700 dark:text-zinc-200">{t.loadingPoint}</span>
                                        </span>
                                      )}
                                      {t.loadingPoint && t.deliveryPoint && (
                                        <span className="text-slate-300 dark:text-zinc-700 mx-0.5 font-bold">•</span>
                                      )}
                                      {t.deliveryPoint && (
                                        <span className="flex items-center gap-1">
                                          <span className="font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[8px]">
                                            {language === 'bn' ? 'ডেলিভারি পয়েন্ট' : 'Delivery Point'}
                                          </span>
                                          <span className="font-black text-slate-700 dark:text-zinc-200">{t.deliveryPoint}</span>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* FIXED CARD FOOTER: DEDICATED ACTION BUTTONS (Download, Edit, Delete, Done) INSIDE THE SAME SINGLE CARD */}
                  <div className="border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 p-3 sm:p-3.5 flex items-center gap-2 shrink-0">
                    {/* Download Button */}
                    <button
                      onClick={() => downloadTransactionReceipt(selectedTransaction, tripsList)}
                      className="flex-1 py-2.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-slate-200/60 dark:border-zinc-700/60 shadow-xs"
                      title={language === 'bn' ? 'রসিদ ডাউনলোড করুন' : 'Download Receipt'}
                    >
                      <Download size={16} className="text-slate-600 dark:text-zinc-300" />
                      <span className="text-[11px] font-bold">{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => {
                        setFormCategory(selectedTransaction.category);
                        const adv = selectedTransaction.details?.advanceDeducted?.toString() || selectedTransaction.details?.advanceAmount?.toString() || '';
                        const rem = selectedTransaction.details?.remainingBalance?.toString() || (adv ? (selectedTransaction.amount + parseFloat(adv)).toString() : selectedTransaction.amount.toString());
                        setFormAdvance(adv);
                        setFormRemainingBalance(rem);
                        setFormAmount(selectedTransaction.amount.toString());
                        setFormNote(selectedTransaction.details?.note || '');
                        setFormMethod(selectedTransaction.method);
                        setFormType(selectedTransaction.type);
                        setFormDetails(selectedTransaction.details || {});
                        setEditingPayment(selectedTransaction);
                        setIsEntryFormOpen(true);
                        setSelectedTransaction(null);
                      }}
                      className="flex-1 py-2.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-blue-200/60 dark:border-blue-500/20 shadow-xs"
                      title={language === 'bn' ? 'সম্পাদনা করুন' : 'Edit Transaction'}
                    >
                      <Edit size={16} />
                      <span className="text-[11px] font-bold">{language === 'bn' ? 'সম্পাদনা' : 'Edit'}</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        confirmAction(language === 'bn' ? 'আপনি কি এই ট্রানজ্যাকশনটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this transaction?', () => {
                          removePayment(selectedTransaction.id);
                          showFeedback(language === 'bn' ? 'ট্রানজ্যাকশন মোছা হয়েছে' : 'Transaction deleted');
                          setSelectedTransaction(null);
                        });
                      }}
                      className="flex-1 py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-rose-200/60 dark:border-rose-500/20 shadow-xs"
                      title={language === 'bn' ? 'মুছে ফেলুন' : 'Delete Transaction'}
                    >
                      <Trash2 size={16} />
                      <span className="text-[11px] font-bold">{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
                    </button>

                    {/* Done Button */}
                    <button 
                      onClick={() => setSelectedTransaction(null)}
                      className="py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 shadow-sm shadow-emerald-500/20 shrink-0"
                      title={language === 'bn' ? 'সম্পন্ন' : 'Done'}
                    >
                      <CheckCircle2 size={15} />
                      <span className="text-[11px] font-bold">{language === 'bn' ? 'সম্পন্ন' : 'Done'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </>,
        document.body
      )}
      </div>
        </>

      {/* Vehicle Inspection Detail Item Popup Modal */}
      {selectedVehicleInspectionItem && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-lg animate-fade-in">
          <div 
            className="bg-theme-card border border-black/5 dark:border-white/10 rounded-[10px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-in"
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
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setSelectedVehicleInspectionItem(null)}
                  className={`p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors ${isDarkMode ? 'text-text-main' : 'text-zinc-600'}`}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left bg-theme-card">
              {/* Trip Metadata */}
              <div className={`rounded-2xl p-4 space-y-3 border ${isDarkMode ? 'bg-[#252525] border-[#ebebeb]/30 text-text-main' : 'bg-[#ebebeb] border-zinc-300 text-zinc-950'}`}>
                {/* Inspection Date */}
                <div className="flex items-center justify-between text-xs font-semibold py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar size={14} className={isDarkMode ? 'text-text-muted shrink-0' : 'text-zinc-600 shrink-0'} />
                    <span className={`truncate ${isDarkMode ? 'text-text-muted' : 'text-zinc-600'}`}>{language === 'bn' ? 'ইন্সপেকশন ডেট' : 'Inspection Date'}</span>
                  </div>
                  <span className="font-bold shrink-0">
                    {selectedVehicleInspectionItem.date || selectedVehicleInspectionItem.details?.loadingDate || 'N/A'}
                  </span>
                </div>
                
                <div className={`h-px my-1 ${isDarkMode ? 'bg-[#ebebeb]/30' : 'bg-zinc-300/60'}`} />
                
                {/* Vehicle Number */}
                <div className="flex items-center justify-between text-xs font-semibold py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Car size={14} className={isDarkMode ? 'text-text-muted shrink-0' : 'text-zinc-600 shrink-0'} />
                    <span className={`truncate ${isDarkMode ? 'text-text-muted' : 'text-zinc-600'}`}>{language === 'bn' ? 'গাড়ী নম্বর' : 'Vehicle Number'}</span>
                  </div>
                  <span className="font-bold shrink-0">
                    {selectedVehicleInspectionItem.details?.vehicleNumber || selectedVehicleInspectionItem.vehicleNumber || 'N/A'}
                  </span>
                </div>
                
                <div className={`h-px my-1 ${isDarkMode ? 'bg-[#ebebeb]/30' : 'bg-zinc-300/60'}`} />
                
                {/* Vehicle Type */}
                <div className="flex items-center justify-between text-xs font-semibold py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <Truck size={14} className={isDarkMode ? 'text-text-muted shrink-0' : 'text-zinc-600 shrink-0'} />
                    <span className={`truncate ${isDarkMode ? 'text-text-muted' : 'text-zinc-600'}`}>{language === 'bn' ? 'ভেইকেল টাইপ' : 'Vehicle Type'}</span>
                  </div>
                  <span className="font-bold shrink-0">
                    {selectedVehicleInspectionItem.details?.deliveryPlace || selectedVehicleInspectionItem.details?.vehicleType || 'N/A'}
                  </span>
                </div>
                
                {selectedVehicleInspectionItem.details?.extraDieselReason && (
                  <>
                    <div className={`h-px my-1 ${isDarkMode ? 'bg-[#ebebeb]/30' : 'bg-zinc-300/60'}`} />
                    {/* Extra Diesel Reason */}
                    <div className="flex items-center justify-between text-xs font-semibold py-0.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <Fuel size={14} className={isDarkMode ? 'text-text-muted shrink-0' : 'text-zinc-600 shrink-0'} />
                        <span className={`truncate ${isDarkMode ? 'text-text-muted' : 'text-zinc-600'}`}>{language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel'}</span>
                      </div>
                      <span className="font-bold shrink-0">
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
                
                {(() => {
                  const pendingAmount = selectedVehicleInspectionItem.pending || selectedVehicleInspectionItem.amount || 0;
                  const isPaid = selectedVehicleInspectionItem.pending === 0 || selectedVehicleInspectionItem.status === 'RECEIVED' || selectedVehicleInspectionItem.status === 'PAID' || selectedVehicleInspectionItem.isPaid === true;
                  
                  const amountBgClass = isPaid
                    ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700')
                    : (isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-700');

                  return (
                    <div className="space-y-3 w-full">
                      {/* Status row */}
                      <div className={`rounded-2xl p-4 border flex items-center justify-between gap-3 ${isDarkMode ? 'bg-[#252525] border-[#ebebeb]/30' : 'bg-[#ebebeb] border-zinc-300'}`}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isPaid ? (
                            <div className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center shrink-0 text-white">
                              <Check size={12} strokeWidth={4} />
                            </div>
                          ) : (
                            <Clock size={18} className="text-orange-500 shrink-0" />
                          )}
                          <span className="text-xs font-black text-text-main block truncate leading-tight">
                            {language === 'bn' ? 'পেমেন্ট স্ট্যাটাস' : 'Payment Status'}
                          </span>
                        </div>
                        <span className={`font-black text-xs px-2.5 py-1 rounded-full ${isPaid ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}>
                          {isPaid 
                            ? (language === 'bn' ? 'পেইড' : 'Paid') 
                            : (language === 'bn' ? 'পেন্ডিং' : 'Pending')}
                        </span>
                      </div>

                      {/* Full width amount box with soft background color */}
                      <div className={`rounded-2xl p-4 border flex flex-col items-center justify-center text-center w-full ${amountBgClass}`}>
                        <span className="text-[10px] font-black uppercase tracking-wider mb-1 opacity-80">
                          {isPaid 
                            ? (language === 'bn' ? 'পরিশোধিত এমাউন্ট' : 'Paid Amount') 
                            : (language === 'bn' ? 'বকেয়া এমাউন্ট' : 'Pending Amount')}
                        </span>
                        <span className="text-xl font-extrabold tracking-tight">
                          {pendingAmount.toLocaleString()} {selectedCurrency}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedVehicleInspectionItem(null)}
                className="flex-1 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main text-xs font-black uppercase rounded-2xl transition-all"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmAction(language === 'bn' ? 'আপনি কি এটি ডিলিট করতে চান?' : 'Are you sure you want to delete this?', () => {
                    deletePaymentItemDirect(selectedVehicleInspectionItem.id, true);
                    setSelectedVehicleInspectionItem(null);
                  });
                }}
                className="py-2.5 px-4 rounded-2xl font-black text-xs bg-rose-500 hover:bg-rose-600 text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>{language === 'bn' ? 'ডিলিট' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Action Button for New Transaction */}
      {!isEntryFormOpen && (
        <button
          onClick={() => {
            setFormType('INCOME');
            setFormCategory('');
            setFormRemainingBalance('');
            setFormAdvance('');
            setFormAmount('');
            setFormNote('');
            setFormMethod('CASH');
            setFormDetails({});
            setEditingPayment(null);
            setIsEntryFormOpen(true);
          }}
          className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] md:bottom-8 right-4 md:right-8 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:bg-emerald-600 active:scale-90 transition-all z-[90] cursor-pointer"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

export default PaymentView;
