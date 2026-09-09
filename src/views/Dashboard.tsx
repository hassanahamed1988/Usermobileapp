import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store'; import { TRANSLATIONS, GLOBAL_DASHBOARD_MODULES } from '../constants';
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

const Dashboard: React.FC = () => {
  const { language, setView, setCurrentFile, addMonthlyFile, user, publicMenuItems, isDarkMode: storeIsDarkMode, isNightMode, appThemeMode, setIsLoadingView, setEditingTrip, appGrid, dashboardOrder, setDashboardOrder, resetSystem, confirmAction, setActiveSection, currentThemeObj, companies, payments, trips, monthlyFiles, currencies, selectedCurrency, setIsEntryFormOpen, globalFilterMonth, setGlobalFilterMonth, globalFilterYear, setGlobalFilterYear, addTrip, showFeedback } = useStore();
  const isDarkMode = storeIsDarkMode || isNightMode || appThemeMode === 'dark';
  const t = TRANSLATIONS[language];
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
    { label: language === 'bn' ? 'ভেইকেল ইন্সপেকশন (Vehicle Inspection)' : 'Vehicle Inspection', value: 'Vehicle Inspection', icon: '🔍' },
    { label: language === 'bn' ? 'অক্সিলিয়ারি জেনারেটর (Generator Auxiliary)' : 'Generator Auxiliary', value: 'Generator Auxiliary', icon: '⚙️' },
    { label: language === 'bn' ? 'জরুরী ব্রেকডাউন (Emergency Breakdown)' : 'Emergency Breakdown', value: 'Emergency Breakdown', icon: '🚨' },
    { label: language === 'bn' ? 'विशेष রুট ভাতা (Special Route Allowance)' : 'Special Route Allowance', value: 'Special Route Allowance', icon: '🛣️' },
    { label: language === 'bn' ? 'পাম্প ওভারচার্জ (Pump Overcharge)' : 'Pump Overcharge', value: 'Pump Overcharge', icon: '⛽' },
    { label: language === 'bn' ? 'এসি / রেডিয়েটর সমস্যা (AC / Radiator Issue)' : 'AC / Radiator Issue', value: 'AC / Radiator Issue', icon: '❄️' }
  ], [language]);

  const vehicleTypeOptions = React.useMemo(() => [
    { label: language === 'bn' ? 'ট্রাক (Truck)' : 'Truck', value: 'Truck', icon: '🚚' },
    { label: language === 'bn' ? 'লাইট ট্রাক (Light Truck)' : 'Light Truck', value: 'Light Truck', icon: '🛻' },
    { label: language === 'bn' ? 'মিডিয়াম ট্রাক (Medium Truck)' : 'Medium Truck', value: 'Medium Truck', icon: '🚛' },
    { label: language === 'bn' ? 'ট্রেইলার (Trailer)' : 'Trailer', value: 'Trailer', icon: '🚊' },
    { label: language === 'bn' ? 'ভারী যন্ত্রপাতি (Heavy Equipment)' : 'Heavy Equipment', value: 'Heavy Equipment', icon: '🚜' },
    { label: language === 'bn' ? 'জেনারেটর (Generator)' : 'Generator', value: 'Generator', icon: '⚡' }
  ], [language]);

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
    return Array.from({ length: 12 }, (_, i) => 
      new Date(0, i).toLocaleString(
        language === 'bn' ? 'bn-BD' : language === 'ar' ? 'ar-SA' : 'en-US', 
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
      label = language === 'bn' ? 'নিষ্পত্তি' : (language === 'ar' ? 'التسوية' : 'Settlement');
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
        setTimeout(() => setActiveSection('THEME_SETTINGS'), 0);
      };
    } else if (m.id === 'SECURITY') {
      action = () => {
        setView('SETTINGS');
        setTimeout(() => setActiveSection('SECURITY'), 0);
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

    // All user-type modules are visible to all users
    // Only respect explicit deniedPermissions from user profile
    if (user?.deniedPermissions && user.deniedPermissions.includes(item.id)) {
      return false;
    }

    return true;
  });

  const sortedItems: any[] = [...visibleItems];

  const handleExtraFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraFuelCompany || !extraFuelReason || !extraFuelVehicleType || !extraFuelVehicleNumber || !extraFuelAmount) {
      showFeedback(language === 'bn' ? 'দয়া করে সবগুলো ঘর পূরণ করুন।' : 'Please fill all fields.', 'error');
      return;
    }

    const amt = Number(extraFuelAmount);
    if (isNaN(amt) || amt <= 0) {
      showFeedback(language === 'bn' ? 'দয়া করে সঠিক অ্যামাউন্ট লিখুন।' : 'Please enter a valid amount.', 'error');
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

    showFeedback(language === 'bn' ? 'এক্সট্রা ফিউল সফলভাবে যোগ করা হয়েছে!' : 'Extra Fuel added successfully!', 'success');

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
                    {selectedMonth === 'ALL' ? (language === 'bn' ? 'সব মাস' : 'All Month') : months[selectedMonth - 1]}
                    <ChevronDown size={10} className="text-white/70" />
                  </button>
                  <button 
                    onClick={() => setShowYearSelect(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
                  >
                    {selectedYear === 'ALL' ? (language === 'bn' ? 'সব বছর' : 'All Years') : selectedYear}
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
                        {language === 'bn' ? 'নেট ব্যালেন্স' : 'Net Balance'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] md:text-[11px] lg:text-[12px] font-black text-emerald-100/70">{currency.code}</span>
                      <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter text-white drop-shadow-sm">{totals.net.toLocaleString()}</span>
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
                        {language === 'bn' ? 'ডিডাকশন' : 'Deduction'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] md:text-[11px] lg:text-[12px] font-black text-rose-100/70">{currency.code}</span>
                      <span className="text-xl md:text-2xl lg:text-3xl font-black tracking-tighter text-white drop-shadow-sm">
                        {totals.deduction.toLocaleString()}
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
                    {selectedMonth === 'ALL' ? (language === 'bn' ? 'সব মাস' : 'All Month') : months[selectedMonth - 1]}
                    <ChevronDown size={10} className="text-white/70" />
                  </button>
                  <button 
                    onClick={() => setShowYearSelect(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-lg"
                  >
                    {selectedYear === 'ALL' ? (language === 'bn' ? 'সব বছর' : 'All Years') : selectedYear}
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
                      {approvedPurchasesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      {pendingPurchasesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  {currency.code} {(approvedPurchasesTotal + pendingPurchasesTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          { label: language === 'bn' ? 'সব বছর' : 'All Years', value: 'ALL' },
          ...years.map(y => ({ label: String(y), value: String(y) }))
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
          { label: language === 'bn' ? 'সব মাস' : 'All Month', value: 'ALL' },
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
          { label: language === 'bn' ? 'স্যালারি' : 'Salary', value: 'SALARY' },
          { label: language === 'bn' ? 'অগ্রিম' : 'Advance', value: 'ADVANCE' },
          { label: language === 'bn' ? 'বোনাস' : 'Bonus', value: 'BONUS' },
          { label: language === 'bn' ? 'শুক্রবার' : 'Friday', value: 'FRIDAY' },
          { label: language === 'bn' ? 'এক্সট্রা ফিউল' : 'Extra Fuel', value: 'EXTRA_FUEL' }
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
                      {language === 'bn' ? 'এক্সট্রা ফিউল ফরম' : 'Extra Fuel Form'}
                    </h3>
                    <p className="text-xs text-text-muted opacity-80 mt-0.5">
                      {language === 'bn' ? 'কোম্পানি ট্রানজেকশন যুক্ত করুন' : 'Add company extra fuel transaction'}
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
                    label={language === 'bn' ? 'কোম্পানির নাম' : 'Company Name'} 
                    value={extraFuelCompany} 
                    onChange={() => {}} 
                    readOnly={true}
                    icon={<Building2 size={18} />}
                  />

                  {/* Reason (Dropdown) */}
                  <div onClick={() => setShowReasonSelect(true)} className="cursor-pointer">
                    <FloatingInput 
                      label={language === 'bn' ? 'রিজন / কারণ' : 'Reason'} 
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
                      label={language === 'bn' ? 'ভেইকেল টাইপ' : 'Vehicle Type'} 
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
                    label={language === 'bn' ? 'ভেইকেল নাম্বার' : 'Vehicle Number'} 
                    value={extraFuelVehicleNumber} 
                    onChange={(v) => setExtraFuelVehicleNumber(v)} 
                    icon={<Hash size={18} />}
                  />

                  {/* Amount (Numeric Input) */}
                  <FloatingInput 
                    label={language === 'bn' ? 'অ্যামাউন্ট / টাকা' : 'Amount'} 
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
                      {language === 'bn' ? 'সাবমিট করুন' : 'Submit'}
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
        title={language === 'bn' ? 'রিজন সিলেক্ট করুন' : 'Select Reason'}
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
        title={language === 'bn' ? 'ভেইকেল টাইপ সিলেক্ট করুন' : 'Select Vehicle Type'}
        searchable={true}
      />
    </div>
  );
};

export default Dashboard;
