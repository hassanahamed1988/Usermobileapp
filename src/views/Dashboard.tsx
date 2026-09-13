import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store'; import { TRANSLATIONS, GLOBAL_DASHBOARD_MODULES, isModuleVisible } from '../constants';
import { 
  Truck, 
  Users, 
  Wallet, 
  Settings, 
  FileText, 
  Headphones, 
  Moon, 
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  Banknote,
  CreditCard,
  Plus,
  Car,
  User as UserIcon,
  DollarSign,
  Clock,
  Receipt,
  RefreshCw,
  MessageSquare,
  Palette,
  Lock,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CalendarCheck,
  Fuel,
  Download,
  ShoppingCart,
  X,
  Building2,
  Tag,
  Hash
} from "lucide-react";

import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import FloatingInput from '@/components/FloatingInput';
import { PaymentManager } from '../services/PaymentManager';
import { getContrastColor } from '../utils/colorUtils';
import { subscribeFirebaseCollection, subscribeFirebaseCollectionGroup } from '../services/firebase';
import { translateDigits, formatNumber, formatDate, formatTime } from '../utils/formatUtils';

const LOCAL_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    REASON_VEHICLE_INSPECTION: 'Vehicle Inspection',
    REASON_GENERATOR_AUXILIARY: 'Generator Auxiliary',
    REASON_EMERGENCY_BREAKDOWN: 'Emergency Breakdown',
    REASON_SPECIAL_ROUTE_ALLOWANCE: 'Special Route Allowance',
    REASON_PUMP_OVERCHARGE: 'Pump Overcharge',
    REASON_AC_RADIATOR_ISSUE: 'AC / Radiator Issue',
    VEHICLE_TRUCK: 'Truck',
    VEHICLE_LIGHT_TRUCK: 'Light Truck',
    VEHICLE_MEDIUM_TRUCK: 'Medium Truck',
    VEHICLE_TRAILER: 'Trailer',
    VEHICLE_HEAVY_EQUIPMENT: 'Heavy Equipment',
    VEHICLE_GENERATOR: 'Generator',
    LEAVE_SETTLEMENT: 'Settlement',
    FILL_ALL_FIELDS: 'Please fill all fields.',
    VALID_AMOUNT: 'Please enter a valid amount.',
    EXTRA_FUEL_ADDED: 'Extra Fuel added successfully!',
    ALL_MONTH: 'All Month',
    ALL_YEARS: 'All Years',
    NET_BALANCE: 'Net Balance',
    DEDUCTION: 'Deduction',
    SALARY: 'Salary',
    ADVANCE: 'Advance',
    BONUS: 'Bonus',
    FRIDAY: 'Friday',
    EXTRA_FUEL: 'Extra Fuel',
    EXTRA_FUEL_FORM: 'Extra Fuel Form',
    ADD_COMPANY_EXTRA_FUEL: 'Add company extra fuel transaction',
    COMPANY_NAME: 'Company Name',
    REASON: 'Reason',
    VEHICLE_TYPE: 'Vehicle Type',
    VEHICLE_NUMBER: 'Vehicle Number',
    AMOUNT: 'Amount',
    SUBMIT: 'Submit',
    SELECT_REASON: 'Select Reason',
    SELECT_VEHICLE_TYPE: 'Select Vehicle Type',
  },
  bn: {
    REASON_VEHICLE_INSPECTION: 'ভেইকেল ইন্সপেকশন (Vehicle Inspection)',
    REASON_GENERATOR_AUXILIARY: 'অক্সিলিয়ারি জেনারেটর (Generator Auxiliary)',
    REASON_EMERGENCY_BREAKDOWN: 'জরুরী ব্রেকডাউন (Emergency Breakdown)',
    REASON_SPECIAL_ROUTE_ALLOWANCE: 'विशेष রুট ভাতা (Special Route Allowance)',
    REASON_PUMP_OVERCHARGE: 'পাম্প ওভারচার্জ (Pump Overcharge)',
    REASON_AC_RADIATOR_ISSUE: 'এসি / রেডিয়েটর সমস্যা (AC / Radiator Issue)',
    VEHICLE_TRUCK: 'ট্রাক (Truck)',
    VEHICLE_LIGHT_TRUCK: 'লাইট ট্রাক (Light Truck)',
    VEHICLE_MEDIUM_TRUCK: 'মিডিয়াম ট্রাক (Medium Truck)',
    VEHICLE_TRAILER: 'ট্রেইলার (Trailer)',
    VEHICLE_HEAVY_EQUIPMENT: 'ভারী যন্ত্রপাতি (Heavy Equipment)',
    VEHICLE_GENERATOR: 'জেনারেটর (Generator)',
    LEAVE_SETTLEMENT: 'নিষ্পত্তি',
    FILL_ALL_FIELDS: 'দয়া করে সবগুলো ঘর পূরণ করুন।',
    VALID_AMOUNT: 'দয়া করে সঠিক অ্যামাউন্ট লিখুন।',
    EXTRA_FUEL_ADDED: 'এক্সট্রা ফিউল সফলভাবে যোগ করা হয়েছে!',
    ALL_MONTH: 'সব মাস',
    ALL_YEARS: 'সব বছর',
    NET_BALANCE: 'নেট ব্যালেন্স',
    DEDUCTION: 'ডিডাকশন',
    SALARY: 'স্যালারি',
    ADVANCE: 'অ্যাডভান্স',
    BONUS: 'বোনাস',
    FRIDAY: 'শুক্রবার',
    EXTRA_FUEL: 'এক্সট্রা ফিউল',
    EXTRA_FUEL_FORM: 'এক্সট্রা ফিউল ফরম',
    ADD_COMPANY_EXTRA_FUEL: 'কোম্পানি ট্রানজেকশন যুক্ত করুন',
    COMPANY_NAME: 'কোম্পানির নাম',
    REASON: 'রিজন / কারণ',
    VEHICLE_TYPE: 'ভেইকেল টাইপ',
    VEHICLE_NUMBER: 'ভেইকেল নাম্বার',
    AMOUNT: 'অ্যামাউন্ট / টাকা',
    SUBMIT: 'সাবমিট করুন',
    SELECT_REASON: 'রিজন সিলেক্ট করুন',
    SELECT_VEHICLE_TYPE: 'ভেইকেল টাইপ সিলেক্ট করুন',
  },
  ar: {
    REASON_VEHICLE_INSPECTION: 'فحص المركبة (Vehicle Inspection)',
    REASON_GENERATOR_AUXILIARY: 'المولد المساعد (Generator Auxiliary)',
    REASON_EMERGENCY_BREAKDOWN: 'عطل طارئ (Emergency Breakdown)',
    REASON_SPECIAL_ROUTE_ALLOWANCE: 'بدل طريق خاص (Special Route Allowance)',
    REASON_PUMP_OVERCHARGE: 'زيادة رسوم المضخة (Pump Overcharge)',
    REASON_AC_RADIATOR_ISSUE: 'مشكلة التكييف / الرديتر (AC / Radiator Issue)',
    VEHICLE_TRUCK: 'شاحنة (Truck)',
    VEHICLE_LIGHT_TRUCK: 'شاحنة خفيفة (Light Truck)',
    VEHICLE_MEDIUM_TRUCK: 'شاحنة متوسطة (Medium Truck)',
    VEHICLE_TRAILER: 'مقطورة (Trailer)',
    VEHICLE_HEAVY_EQUIPMENT: 'معدات ثقيلة (Heavy Equipment)',
    VEHICLE_GENERATOR: 'مولد كهربائي (Generator)',
    LEAVE_SETTLEMENT: 'التسوية',
    FILL_ALL_FIELDS: 'يرجى ملء جميع الحقول.',
    VALID_AMOUNT: 'يرجى إدخال مبلغ صحيح.',
    EXTRA_FUEL_ADDED: 'تم إضافة الوقود الإضافي بنجاح!',
    ALL_MONTH: 'كل الأشهر',
    ALL_YEARS: 'كل السنوات',
    NET_BALANCE: 'صافي الرصيد',
    DEDUCTION: 'خصم',
    SALARY: 'الراتب',
    ADVANCE: 'سلفة',
    BONUS: 'مكافأة',
    FRIDAY: 'الجمعة',
    EXTRA_FUEL: 'الوقود الإضافي',
    EXTRA_FUEL_FORM: 'نموذج الوقود الإضافي',
    ADD_COMPANY_EXTRA_FUEL: 'إضافة معاملة وقود إضافي للشركة',
    COMPANY_NAME: 'اسم الشركة',
    REASON: 'السبب',
    VEHICLE_TYPE: 'نوع المركبة',
    VEHICLE_NUMBER: 'رقم المركبة',
    AMOUNT: 'المبلغ',
    SUBMIT: 'إرسال',
    SELECT_REASON: 'اختر السبب',
    SELECT_VEHICLE_TYPE: 'اختر نوع المركبة',
  },
  hi: {
    REASON_VEHICLE_INSPECTION: 'वाहन निरीक्षण (Vehicle Inspection)',
    REASON_GENERATOR_AUXILIARY: 'जनरेटर सहायक (Generator Auxiliary)',
    REASON_EMERGENCY_BREAKDOWN: 'आपातकालीन ब्रेकडाउन (Emergency Breakdown)',
    REASON_SPECIAL_ROUTE_ALLOWANCE: 'विशेष मार्ग भत्ता (Special Route Allowance)',
    REASON_PUMP_OVERCHARGE: 'पंप ओवरचार्ज (Pump Overcharge)',
    REASON_AC_RADIATOR_ISSUE: 'एसी / रेडिएटर समस्या (AC / Radiator Issue)',
    VEHICLE_TRUCK: 'ट्रक (Truck)',
    VEHICLE_LIGHT_TRUCK: 'हल्का ट्रक (Light Truck)',
    VEHICLE_MEDIUM_TRUCK: 'मध्यम ट्रक (Medium Truck)',
    VEHICLE_TRAILER: 'ट्रेलर (Trailer)',
    VEHICLE_HEAVY_EQUIPMENT: 'भारी उपकरण (Heavy Equipment)',
    VEHICLE_GENERATOR: 'जनरेटर (Generator)',
    LEAVE_SETTLEMENT: 'निपटान',
    FILL_ALL_FIELDS: 'कृपया सभी फ़ील्ड भरें।',
    VALID_AMOUNT: 'कृपया एक वैध राशि दर्ज करें।',
    EXTRA_FUEL_ADDED: 'अतिरिक्त ईंधन सफलतापूर्वक जोड़ा गया!',
    ALL_MONTH: 'सभी महीने',
    ALL_YEARS: 'सभी वर्ष',
    NET_BALANCE: 'शुद्ध शेष',
    DEDUCTION: 'कटौती',
    SALARY: 'वेतन',
    ADVANCE: 'अग्रिम',
    BONUS: 'बोनस',
    FRIDAY: 'शुक्रवार',
    EXTRA_FUEL: 'अतिरिक्त ईंधन',
    EXTRA_FUEL_FORM: 'अतिरिक्त ईंधन फॉर्म',
    ADD_COMPANY_EXTRA_FUEL: 'कंपनी अतिरिक्त ईंधन लेनदेन जोड़ें',
    COMPANY_NAME: 'कंपनी का नाम',
    REASON: 'कारण',
    VEHICLE_TYPE: 'वाहन का प्रकार',
    VEHICLE_NUMBER: 'वाहन संख्या',
    AMOUNT: 'राशि',
    SUBMIT: 'जमा करें',
    SELECT_REASON: 'कारण चुनें',
    SELECT_VEHICLE_TYPE: 'वाहन का प्रकार चुनें',
  }
};

const Dashboard: React.FC = () => {
  const { language, setView, setCurrentFile, addMonthlyFile, user, publicMenuItems, isDarkMode: storeIsDarkMode, isNightMode, appThemeMode, setIsLoadingView, setEditingTrip, appGrid, dashboardOrder, setDashboardOrder, resetSystem, confirmAction, setActiveSection, currentThemeObj, companies, payments, trips, monthlyFiles, currencies, selectedCurrency, setIsEntryFormOpen, globalFilterMonth, setGlobalFilterMonth, globalFilterYear, setGlobalFilterYear, addTrip, showFeedback } = useStore();
  const isDarkMode = storeIsDarkMode || isNightMode || appThemeMode === 'dark';
  const t = TRANSLATIONS[language];
  const localT = LOCAL_TRANSLATIONS[language] || LOCAL_TRANSLATIONS.en;
  const primaryColor = currentThemeObj?.primary || '#10b981';

  const [purchases, setPurchases] = React.useState<any[]>([]);

  React.useEffect(() => {
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

  React.useEffect(() => {
    const unsubscribePurchases = subscribeFirebaseCollectionGroup('Purchase', (data) => setPurchases(data));
    return () => {
      unsubscribePurchases();
    };
  }, []);

  const hasMyIncomePermission = (Array.isArray(user?.permissions) && user.permissions.includes('MY_INCOME')) || false;

  const [showAddMoneyModal, setShowAddMoneyModal] = React.useState(false);

  // Extra Fuel states
  const [showExtraFuelModal, setShowExtraFuelModal] = React.useState(false);
  const [extraFuelCompany, setExtraFuelCompany] = React.useState('');
  const [extraFuelReason, setExtraFuelReason] = React.useState('');
  const [extraFuelVehicleType, setExtraFuelVehicleType] = React.useState('');
  const [extraFuelVehicleNumber, setExtraFuelVehicleNumber] = React.useState('');
  const [extraFuelAmount, setExtraFuelAmount] = React.useState('');

  const [showReasonSelect, setShowReasonSelect] = React.useState(false);
  const [showVehicleTypeSelect, setShowVehicleTypeSelect] = React.useState(false);

  React.useEffect(() => {
    setIsEntryFormOpen(showExtraFuelModal);
    return () => {
      setIsEntryFormOpen(false);
    };
  }, [showExtraFuelModal, setIsEntryFormOpen]);

  const reasonOptions = React.useMemo(() => [
    { label: localT.REASON_VEHICLE_INSPECTION, value: 'Vehicle Inspection', icon: '🔍' },
    { label: localT.REASON_GENERATOR_AUXILIARY, value: 'Generator Auxiliary', icon: '⚙️' },
    { label: localT.REASON_EMERGENCY_BREAKDOWN, value: 'Emergency Breakdown', icon: '🚨' },
    { label: localT.REASON_SPECIAL_ROUTE_ALLOWANCE, value: 'Special Route Allowance', icon: '🛣️' },
    { label: localT.REASON_PUMP_OVERCHARGE, value: 'Pump Overcharge', icon: '⛽' },
    { label: localT.REASON_AC_RADIATOR_ISSUE, value: 'AC / Radiator Issue', icon: '❄️' }
  ], [localT]);

  const vehicleTypeOptions = React.useMemo(() => [
    { label: localT.VEHICLE_TRUCK, value: 'Truck', icon: '🚚' },
    { label: localT.VEHICLE_LIGHT_TRUCK, value: 'Light Truck', icon: '🛻' },
    { label: localT.VEHICLE_MEDIUM_TRUCK, value: 'Medium Truck', icon: '🚛' },
    { label: localT.VEHICLE_TRAILER, value: 'Trailer', icon: '🚊' },
    { label: localT.VEHICLE_HEAVY_EQUIPMENT, value: 'Heavy Equipment', icon: '🚜' },
    { label: localT.VEHICLE_GENERATOR, value: 'Generator', icon: '⚡' }
  ], [localT]);

  const selectedYear = globalFilterYear;
  const setSelectedYear = setGlobalFilterYear;
  const selectedMonth = globalFilterMonth;
  const setSelectedMonth = setGlobalFilterMonth;

  const approvedPurchasesTotal = React.useMemo(() => {
    return purchases
      .filter(p => {
        if (p.status !== 'approved' && p.status) return false;
        if (!p.date) return false;
        const purchaseDateObj = new Date(p.date);
        const monthMatch = selectedMonth === 'ALL' ? true : purchaseDateObj.getMonth() + 1 === selectedMonth;
        const yearMatch = selectedYear === 'ALL' ? true : purchaseDateObj.getFullYear() === selectedYear;
        return monthMatch && yearMatch;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [purchases, selectedMonth, selectedYear]);

  const pendingPurchasesTotal = React.useMemo(() => {
    return purchases
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [purchases]);

  const [showYearSelect, setShowYearSelect] = React.useState(false);
  const [showMonthSelect, setShowMonthSelect] = React.useState(false);

  const months = React.useMemo(() => {
    const localeMap = { en: 'en-US', bn: 'bn-BD', ar: 'ar-SA', hi: 'hi-IN' };
    return Array.from({ length: 12 }, (_, i) => 
      new Date(0, i).toLocaleString(
        localeMap[language] || 'en-US', 
        { month: 'long' }
      )
    );
  }, [language]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  const currency = React.useMemo(() => {
    return currencies.find(c => c.code === selectedCurrency) || currencies[0] || { code: 'QAR', symbol: 'QAR' };
  }, [currencies, selectedCurrency]);

  const totals = React.useMemo(() => {
    const income = { Total: 0, Pending: 0 };
    const deduction = { Total: 0 };

    payments.forEach(p => {
      const yearMatch = selectedYear === 'ALL' ? true : Number(p.year) === Number(selectedYear);
      const monthMatch = selectedMonth === 'ALL' ? true : Number(p.month) === Number(selectedMonth);
      if (!yearMatch || !monthMatch || p.category === 'User Renew') return;

      // Exclude if it is an advance taken for diesel / fuel
      const isDieselAdv = p.category?.toLowerCase().includes('advance') && (
        (() => {
          const reason = (p.details?.advanceReason || p.details?.serviceName || p.serviceName || '').toLowerCase();
          return reason.includes('diesel') || reason.includes('ডিজেল') || reason.includes('fuel') || reason.includes('ফুয়েল');
        })()
      );
      if (isDieselAdv) return;

      const pAmount = Number(p.amount) || 0;
      if (p.type === 'INCOME') {
        if (p.status === 'RECEIVED') {
          const categoryLower = (p.category || '').toLowerCase();
          if (!categoryLower.includes('diesel') && !categoryLower.includes('extra fuel') && !categoryLower.includes('vehicle inspection')) {
            if (categoryLower === 'advance' && p.details?.advanceType !== 'RETURNED') {
              income.Total -= pAmount;
            } else {
              income.Total += pAmount;
            }
          }
        }
      } else {
        const cat = (p.category || '').toLowerCase();
        if (cat === 'advance' && p.details?.advanceType === 'RETURNED') {
          income.Total += pAmount;
        }
        deduction.Total += pAmount;
      }
    });

    const pendingDues = PaymentManager.getPendingDues(trips, monthlyFiles, payments);
    const matchingPending = pendingDues.filter(p => {
      const mMatch = selectedMonth === 'ALL' ? true : Number(p.month) === Number(selectedMonth);
      const yMatch = selectedYear === 'ALL' ? true : Number(p.year) === Number(selectedYear);
      return mMatch && yMatch;
    });
    
    matchingPending.forEach(currentMonthPending => {
      currentMonthPending.categories.forEach((cat: any) => {
        const catNameLower = (cat.name || '').toLowerCase();
        if (!catNameLower.includes('diesel') && !catNameLower.includes('extra fuel') && !catNameLower.includes('vehicle inspection')) {
          income.Pending += (Number(cat.totalPending) || 0);
        }
      });
    });

    return { 
      net: income.Total - deduction.Total,
      deduction: deduction.Total,
      income: income.Total,
      pending: income.Pending,
      gross: income.Total + income.Pending
    };
  }, [payments, trips, monthlyFiles, selectedYear, selectedMonth]);

  const allItems = GLOBAL_DASHBOARD_MODULES.map(m => {
    // resolve translation label
    let label = t[m.labelKey as keyof typeof t] || m.labelKey || m.id;
    if (m.id === 'LEAVE_SETTLEMENT') {
      label = localT.LEAVE_SETTLEMENT;
    }

    // attach action handlers if any
    let action = undefined;
    if (m.id === 'MONTHLY_FILES') {
      action = () => {
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
      };
    } else if (m.id === 'ADD_MONEY') {
      action = () => {
        setShowAddMoneyModal(true);
      };

    } else if (m.id === 'THEME') {
      action = () => {
        setView('SETTINGS');
        setActiveSection('THEME_SETTINGS');
      };
    } else if (m.id === 'SECURITY') {
      action = () => {
        setView('SETTINGS');
        setActiveSection('SECURITY');
      };
    } else if (m.id === 'RESET_SYSTEM') {
      action = () => setView('RESET_BREAKDOWN');
    }

    return {
      id: m.id,
      label,
      icon: m.icon,
      color: primaryColor,
      type: m.type,
      action
    };
  });

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action();
    } else {
      if (item.id === 'TRIPS' || item.id === 'NEW_TRIP') {
        setCurrentFile(null);
        setEditingTrip(null);
      }
      setView(item.id);
    }
  };

  const visibleItems = allItems.filter(item => {
    // Admin-type modules are completely removed — never show them
    if (item.type === 'admin') return false;

    // Admins themselves bypass the permission system entirely — it exists
    // to control what a regular mobile-app USER can see, not to restrict
    // an admin's own access to their own tools.
    if (user?.role === 'ADMIN') return true;

    return isModuleVisible(item.id, user?.permissions, user?.deniedPermissions);
  });

  const sortedItems: any[] = [...visibleItems];

  const handleExtraFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraFuelCompany || !extraFuelReason || !extraFuelVehicleType || !extraFuelVehicleNumber || !extraFuelAmount) {
      showFeedback(localT.FILL_ALL_FIELDS, 'error');
      return;
    }

    const amt = Number(extraFuelAmount);
    if (isNaN(amt) || amt <= 0) {
      showFeedback(localT.VALID_AMOUNT, 'error');
      return;
    }

    // Auto-generate date and time
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // Find or create monthly file for current date
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    let file = monthlyFiles.find(f => f.month === currentMonth && f.year === currentYear);
    if (!file) {
      file = {
        id: `MF-${Date.now()}`,
        month: currentMonth,
        year: currentYear,
        status: 'OPEN',
        createdAt: now.toISOString(),
        userId: user?.id || 'USR1001'
      };
      addMonthlyFile(file);
    }

    // Create the extra fuel Trip object
    const newTrip: any = {
      id: `EF-${Date.now()}`,
      category: 'EXTRA_FUEL',
      fileId: file.id,
      userId: user?.id || 'USR1001',
      loadingDate: dateStr,
      loadingTime: timeStr,
      companyName: extraFuelCompany,
      extraDieselReason: extraFuelReason,
      extraDiesel: amt,
      extraDieselPaid: 0,
      dieselPrice: 0,
      dieselPaid: 0,
      vehicleNumber: extraFuelVehicleNumber.toUpperCase(),
      deliveryPlace: extraFuelVehicleType, // Vehicle Type
      containerNumber: extraFuelVehicleNumber.toUpperCase(),
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      totalAmount: amt,
      paidAmount: 0,
      payments: [],
      createdAt: now.toISOString()
    };

    addTrip(newTrip);

    showFeedback(localT.EXTRA_FUEL_ADDED, 'success');

    // Reset states and close modal
    setExtraFuelReason('');
    setExtraFuelVehicleType('');
    setExtraFuelVehicleNumber('');
    setExtraFuelAmount('');
    setShowExtraFuelModal(false);
  };

  return (
    <div 
      className="flex flex-col h-auto md:h-[calc(100dvh-100px)] md:grid md:grid-cols-12 md:gap-4 md:overflow-hidden"
    >
      {/* Income / Purchase Summary Card Container */}
      <div className="z-20 pb-4  shrink-0 md:col-span-5 lg:col-span-4 flex flex-col justify-start md:h-full md:overflow-y-auto scrollbar-hide">
        {user?.accountType !== "Personal Account" ? (
          <div 
            className="relative overflow-hidden rounded-xl p-5 min-h-[175px] md:min-h-[290px] lg:min-h-[240px] flex flex-col justify-between text-white shadow-2xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] border border-white/10"
          >
            {/* Visual accents */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-400/10 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowMonthSelect(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
                  >
                    {selectedMonth === 'ALL' ? localT.ALL_MONTH : months[selectedMonth - 1]}
                    <ChevronDown size={10} className="text-white/70" />
                  </button>
                  <button 
                    onClick={() => setShowYearSelect(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
                  >
                    {selectedYear === 'ALL' ? localT.ALL_YEARS : selectedYear}
                    <ChevronDown size={10} className="text-white/70" />
                  </button>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm shadow-inner transition-all">
                  <Wallet size={20} className="text-cyan-400 md:scale-110" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setView('MY_INCOME');
                    setActiveSection('INCOME');
                  }}
                  className="group relative overflow-hidden flex flex-col items-start justify-between min-h-[96px] md:min-h-[112px] p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/20 hover:brightness-110 active:scale-95 transition-all text-left shadow-lg"
                >
                  {/* Watermark Icon */}
                  <div className="absolute right-[-16px] bottom-[-16px] opacity-15 pointer-events-none transform group-hover:scale-110 transition-transform duration-300">
                    <Wallet size={80} strokeWidth={1.5} className="text-white" />
                  </div>

                  <div className="relative z-10 w-full h-full flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                      <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-wider text-emerald-100 whitespace-nowrap">
                        {localT.NET_BALANCE}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] md:text-[11px] lg:text-[12px] font-black text-emerald-100/70">{currency.code}</span>
                      <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter text-white drop-shadow-sm">{formatNumber(totals.net, language)}</span>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setView('MY_INCOME');
                    setActiveSection('INCOME');
                  }}
                  className="group relative overflow-hidden flex flex-col items-start justify-between min-h-[96px] md:min-h-[112px] p-4 rounded-xl bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 border border-rose-400/20 hover:brightness-110 active:scale-95 transition-all text-left shadow-lg"
                >
                  {/* Watermark Icon */}
                  <div className="absolute right-[-16px] bottom-[-16px] opacity-15 pointer-events-none transform group-hover:scale-110 transition-transform duration-300">
                    <Receipt size={80} strokeWidth={1.5} className="text-white" />
                  </div>

                  <div className="relative z-10 w-full h-full flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                      <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-wider text-rose-100 whitespace-nowrap">
                        {localT.DEDUCTION}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] md:text-[11px] lg:text-[12px] font-black text-rose-100/70">{currency.code}</span>
                      <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter text-white drop-shadow-sm">
                        {formatNumber(totals.deduction, language)}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="relative overflow-hidden rounded-xl p-5 min-h-[175px] md:min-h-[220px] lg:min-h-[240px] flex flex-col justify-between text-white shadow-2xl bg-gradient-to-br from-[#0f172a] via-[#581c87] to-[#0f172a] border border-white/10"
          >
            {/* Visual accents */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowMonthSelect(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
                  >
                    {selectedMonth === 'ALL' ? localT.ALL_MONTH : months[selectedMonth - 1]}
                    <ChevronDown size={10} className="text-white/70" />
                  </button>
                  <button 
                    onClick={() => setShowYearSelect(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
                  >
                    {selectedYear === 'ALL' ? localT.ALL_YEARS : selectedYear}
                    <ChevronDown size={10} className="text-white/70" />
                  </button>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm shadow-inner transition-all">
                  <ShoppingCart size={20} className="text-purple-400 md:scale-110" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    setView('PURCHASE');
                  }}
                  className="group flex flex-col items-start p-4 bg-white/10 rounded-xl border border-white/10 hover:border-purple-500/50 hover:bg-white/20 text-left shadow-lg transition-all"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.7)]"></div>
                    <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-wider text-purple-300 whitespace-nowrap">Total Approved</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] md:text-[11px] lg:text-[12px] font-black text-white/50">{currency.code}</span>
                    <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter text-white drop-shadow-sm">
                      {formatNumber(approvedPurchasesTotal, language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setView('PURCHASE');
                  }}
                  className="group flex flex-col items-start p-4 bg-white/10 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-white/20 text-left shadow-lg transition-all"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.7)]"></div>
                    <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-wider text-amber-300 whitespace-nowrap">Total Pending</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[10px] md:text-[11px] lg:text-[12px] font-black text-white/50">{currency.code}</span>
                    <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter text-white drop-shadow-sm">
                      {formatNumber(pendingPurchasesTotal, language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </button>
              </div>

              {/* Total Purchase Row */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                  <span className="text-[8px] md:text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-white/30">Total Purchase</span>
                </div>
                <span className="text-[10px] md:text-[12px] lg:text-[13px] font-black text-white/70 tracking-widest">
                  {currency.code} {formatNumber(approvedPurchasesTotal + pendingPurchasesTotal, language, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-visible md:overflow-y-auto scrollbar-hide pb-6 md:pb-6 md:col-span-7 lg:col-span-8">
        <div className={` pb-4 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6`}>
          {sortedItems.map(item => {
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="bg-card-bg p-2 sm:p-3 md:py-6 md:px-2 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-1.5 md:gap-4 transition-all duration-200 aspect-square w-full group relative z-10 hover:-translate-y-1 active:scale-95 border border-black/5 dark:border-white/5"
                style={{
                  boxShadow: 'none'
                }}
              >
                <div 
                  className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 shrink-0 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { 
                    size: 18, 
                    className: "w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] md:w-[32px] md:h-[32px] lg:w-[40px] lg:h-[40px]" 
                  })}
                </div>
                <span className="text-[11px] sm:text-[12px] md:text-[14px] lg:text-[15px] font-medium text-text-main text-center leading-tight w-full px-0.5 whitespace-normal mt-1 md:mt-2">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <GlobalFullscreenSelect
        isOpen={showYearSelect}
        onClose={() => setShowYearSelect(false)}
        onSelect={(value) => {
          setSelectedYear(value === 'ALL' ? 'ALL' : Number(value));
          setShowYearSelect(false);
        }}
        options={[
          { label: localT.ALL_YEARS, value: 'ALL' },
          ...years.map(y => ({ label: translateDigits(y, language), value: String(y) }))
        ]}
        title={t.SELECT_YEAR || 'Select Year'}
        selectedValue={String(selectedYear)}
      />
      <GlobalFullscreenSelect
        isOpen={showMonthSelect}
        onClose={() => setShowMonthSelect(false)}
        onSelect={(value) => {
          setSelectedMonth(value === 'ALL' ? 'ALL' : months.indexOf(value) + 1);
          setShowMonthSelect(false);
        }}
        options={[
          { label: localT.ALL_MONTH, value: 'ALL' },
          ...months.map(m => ({ label: m, value: m }))
        ]}
        title={t.SELECT_MONTH || 'Select Month'}
        selectedValue={selectedMonth === 'ALL' ? 'ALL' : months[selectedMonth - 1]}
      />
      <GlobalFullscreenSelect
        isOpen={showAddMoneyModal}
        onClose={() => setShowAddMoneyModal(false)}
        onSelect={(value) => {
          const upperVal = value.toUpperCase();
          if (upperVal === 'EXTRA_FUEL') {
            setShowAddMoneyModal(false);
            setExtraFuelCompany(user?.companyName || (companies.length > 0 ? companies[0] : ''));
            setShowExtraFuelModal(true);
          } else if (['SALARY', 'ADVANCE', 'BONUS', 'FRIDAY'].includes(upperVal)) {
            setActiveSection('ADD_INCOME');
            localStorage.setItem('pendingAction', 'ADD_INCOME');
            const map: Record<string, string> = {
              'SALARY': 'Salary',
              'ADVANCE': 'Advance',
              'BONUS': 'Bonus',
              'FRIDAY': 'Friday'
            };
            localStorage.setItem('pendingCategory', map[upperVal] || value);
            setView('MY_INCOME');
            setShowAddMoneyModal(false);
          }
        }}
        options={[
          { label: localT.SALARY, value: 'SALARY' },
          { label: localT.ADVANCE, value: 'ADVANCE' },
          { label: localT.BONUS, value: 'BONUS' },
          { label: localT.FRIDAY, value: 'FRIDAY' },
          { label: localT.EXTRA_FUEL, value: 'EXTRA_FUEL' }
        ]}
        title={t.ADD_MONEY_TITLE || t.ADD_MONEY || 'Add Money'}
        searchable={false}
      />

      {/* Extra Fuel Form Modal */}
      {createPortal(
        <AnimatePresence>
          {showExtraFuelModal && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setShowExtraFuelModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

              {/* Modal Box */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative z-10 bg-card-bg w-full max-w-md max-h-[85vh] rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
                style={{ 
                  background: isDarkMode ? '#111111' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#111111'
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-black/5 dark:border-white/10 flex-shrink-0">
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      {localT.EXTRA_FUEL_FORM}
                    </h3>
                    <p className="text-xs text-text-muted opacity-80 mt-0.5">
                      {localT.ADD_COMPANY_EXTRA_FUEL}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowExtraFuelModal(false)}
                    className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Scrollable Form Body */}
                <form onSubmit={handleExtraFuelSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Company Name (Read-Only) */}
                  <FloatingInput 
                    label={localT.COMPANY_NAME} 
                    value={extraFuelCompany} 
                    onChange={() => {}} 
                    readOnly={true}
                    icon={<Building2 size={18} />}
                  />

                  {/* Reason (Dropdown) */}
                  <div onClick={() => setShowReasonSelect(true)} className="cursor-pointer">
                    <FloatingInput 
                      label={localT.REASON} 
                      value={
                        reasonOptions.find(o => o.value === extraFuelReason)?.label || extraFuelReason || ''
                      } 
                      onChange={() => {}} 
                      readOnly={true}
                      icon={<Tag size={18} />}
                    />
                  </div>

                  {/* Vehicle Type (Dropdown) */}
                  <div onClick={() => setShowVehicleTypeSelect(true)} className="cursor-pointer">
                    <FloatingInput 
                      label={localT.VEHICLE_TYPE} 
                      value={
                        vehicleTypeOptions.find(o => o.value === extraFuelVehicleType)?.label || extraFuelVehicleType || ''
                      } 
                      onChange={() => {}} 
                      readOnly={true}
                      icon={<Truck size={18} />}
                    />
                  </div>

                  {/* Vehicle Number (Text Input) */}
                  <FloatingInput 
                    label={localT.VEHICLE_NUMBER} 
                    value={extraFuelVehicleNumber} 
                    onChange={(v) => setExtraFuelVehicleNumber(v)} 
                    icon={<Hash size={18} />}
                  />

                  {/* Amount (Numeric Input) */}
                  <FloatingInput 
                    label={localT.AMOUNT} 
                    value={extraFuelAmount} 
                    onChange={(v) => setExtraFuelAmount(v)}
                    type="text"
                    inputMode="decimal"
                    icon={<DollarSign size={18} />}
                  />

                  {/* Submit Button */}
                  <div className="pt-4 pb-2">
                    <button 
                      type="submit"
                      className="w-full h-14 bg-cyan-500 hover:bg-cyan-600 text-white font-black rounded-xl shadow-lg active:scale-95 duration-200 transition-all uppercase text-sm tracking-wider flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      {localT.SUBMIT}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Reasons Select Modal */}
      <GlobalFullscreenSelect
        isOpen={showReasonSelect}
        onClose={() => setShowReasonSelect(false)}
        onSelect={(value) => {
          setExtraFuelReason(value);
          setShowReasonSelect(false);
        }}
        options={reasonOptions}
        title={localT.SELECT_REASON}
        searchable={true}
      />

      {/* Vehicle Type Select Modal */}
      <GlobalFullscreenSelect
        isOpen={showVehicleTypeSelect}
        onClose={() => setShowVehicleTypeSelect(false)}
        onSelect={(value) => {
          setExtraFuelVehicleType(value);
          setShowVehicleTypeSelect(false);
        }}
        options={vehicleTypeOptions}
        title={localT.SELECT_VEHICLE_TYPE}
        searchable={true}
      />
    </div>
  );
};

export default Dashboard;
