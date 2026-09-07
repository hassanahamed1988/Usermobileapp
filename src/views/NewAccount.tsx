import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  UserPlus, Shield, ShieldCheck, Building2, CheckCircle2, ChevronRight, Search, Check, User, X, MapPin, Building, ChevronLeft,
  LayoutDashboard, Clock, FileText, PlusCircle, Files, UserCheck, UserX, CreditCard, LifeBuoy, Settings, Wallet, UserCircle, Trash2, MessageSquare,
  Lock, Bell, Sun, Moon, Diamond, Truck, Sliders, DollarSign, Headphones, Palette, RefreshCw, Users, Calendar, Flag, Mail, Phone, Globe, Briefcase
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Clock, FileText, PlusCircle, User, Files, UserCheck, UserX, CreditCard, LifeBuoy, Settings, Search, Wallet, UserCircle, Shield, Trash2, MessageSquare
};

import { useStore } from '@/store';
import { TRANSLATIONS, APP_MODULES, THEMES, GLOBAL_DASHBOARD_MODULES } from '@/constants';
import { getContrastColor } from '@/utils/colorUtils';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import InputField, { InputFieldThemeContext } from '@/components/InputField';
import FormWindow from '@/components/FormWindow';

const FormSection: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => {
  const { appThemeMode } = useStore();
  const isWhiteMode = appThemeMode === 'light';
  return (
    <div className={`glass-card !border-none rounded-[10px] px-3 pt-1 pb-6 shadow-lg space-y-3 relative overflow-hidden group hover:shadow-xl ${isWhiteMode ? 'bg-white' : 'bg-theme-card'}`}>
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity " />
      <div className="flex items-center gap-3 pb-2 mb-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 ${isWhiteMode ? 'bg-gray-100 text-blue-600' : 'bg-transparent text-white'}`}>
          <Icon size={16} />
        </div>
        <h3 className={`font-black text-xs uppercase tracking-wider text-text-main`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
};

const NewAccount: React.FC = () => {
  const { theme, language, setView, addUser, showFeedback, addPayment, users, wallpaper, backgroundColor, headerBg, appThemeMode, setAppThemeMode, isNightMode, isDarkMode: storeIsDarkMode, notifications, appGrid, nationalities, countries, idTypes, companies, postOffices } = useStore();
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];
  const isWhiteMode = appThemeMode === 'light';
  const isLightBackground = React.useMemo(() => {
    if (appThemeMode === 'light') return true;
    if (backgroundColor) return getContrastColor(backgroundColor) === '#000000';
    return false;
  }, [appThemeMode, backgroundColor]);

  const appBgStyle = {
    background: isWhiteMode 
      ? (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg)'))
      : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor ? backgroundColor : 'var(--card-bg)')),
    backdropFilter: isWhiteMode ? 'none' : 'blur(16px)',
    WebkitBackdropFilter: isWhiteMode ? 'none' : 'blur(16px)'
  } as React.CSSProperties;
  const t = TRANSLATIONS[language];
  const refs = React.useRef<Record<string, HTMLInputElement | null>>({});
  
  const handleKeyDown = (e: React.KeyboardEvent, nextField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      refs.current[nextField]?.focus();
    }
  };
  
  const [accountType, setAccountType] = useState<'PERSONAL' | 'COMPANY'>('PERSONAL');
  const [formData, setFormData] = useState({
    fullName: '',
    nationality: '',
    dob: '',
    profession: '',
    companyName: '',
    countryCode: '',
    mobile: '',
    email: '',
    idIssueCountry: '',
    idType: '',
    idNumber: '',
    idIssueDate: '',
    idExpiryDate: '',
    loginEmail: '',
    userId: '',
    password: '',
    confirmPassword: '',
    gender: '',
    religion: '',
    bloodGroup: '',
    emergencyContact: '',
    country: '',
    division: '',
    district: '',
    city: '',
    upazila: '',
    policeStation: '',
    postOffice: '',
    postalCode: '',
    area: '',
    building: '',
    state: '',
    zone: '',
    electricity: '',
    buildingNumber: '',
    streetNumber: '',
    zoneNumber: '',
    addressLine1: '',
    addressLine2: '',
    manualAddress: '',
    // Admin specific
    permissions: [] as string[],
    duration: '1 Month',
    price: '',
    package: '',
    packagePrice: '',
    profileAccountType: 'Transport Account'
  });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    field: string | null;
    title: string;
    options: any[];
  }>({
    isOpen: false,
    field: null,
    title: '',
    options: []
  });

  const handleOpenModal = (field: string, title: string, options: any[]) => {
    setModalConfig({
      isOpen: true,
      field,
      title,
      options
    });
  };

  const handleSelect = (value: string) => {
    setModalConfig(prev => {
      if (prev.field) {
        setFormData(fd => {
          const newData = { ...fd, [prev.field]: value };
          if (prev.field === 'email') {
            newData.loginEmail = value;
            newData.userId = value;
          }
          if (prev.field === 'postOffice') {
            const found = postOffices.find(po => po.name === value);
            newData.postOffice = value;
            newData.postalCode = found ? found.code : fd.postalCode;
          }
          return newData;
        });
      }
      return { ...prev, isOpen: false };
    });
  };

  const handleInputChange = (field: keyof typeof formData) => (value: string | React.ChangeEvent<HTMLInputElement>) => {
    const val = typeof value === 'string' ? value : value.target.value;
    setFormData(prev => {
      const newData = { ...prev, [field]: val };
      // Sync loginEmail and userId with email if email is changed
      if (field === 'email') {
        newData.loginEmail = val;
        newData.userId = val;
      }
      return newData;
    });
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const [showTypeSelection, setShowTypeSelection] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  useEffect(() => {
    if (showPermissionsModal) {
      window.dispatchEvent(new CustomEvent('change-title', { detail: t.MODULE_PERMISSIONS }));
    } else {
      window.dispatchEvent(new CustomEvent('change-title', { detail: null }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('change-title', { detail: null }));
    };
  }, [showPermissionsModal, language]);

  useEffect(() => {
    const handleCloseOverlay = () => {
      setShowPermissionsModal(false);
    };
    window.addEventListener('close-permissions-overlay', handleCloseOverlay);
    return () => window.removeEventListener('close-permissions-overlay', handleCloseOverlay);
  }, []);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  const passwordsMatch = formData.password === formData.confirmPassword;
  const passwordError = (formData.password !== '' && formData.confirmPassword !== '') && !passwordsMatch;

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  const renderPermissionsModal = () => {
    if (!showPermissionsModal) return null;

    return (
      <div
        
        
        
        className="w-full flex-1 flex flex-col overflow-hidden"
      >
        {/* Content */}
        <div className="flex-1 w-full mx-auto pt-2 pb-4 overflow-y-auto scrollbar-hide">
          <div className={`grid ${appGrid === '3x6' ? 'grid-cols-3' : 'grid-cols-4'} sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4`}>
            {[
              { id: 'NEW_TRIP', label: t.NEW_TRIP, icon: <Truck size={18} />, color: '#facc15' },
              { id: 'MONTHLY_FILES', label: t.MONTHLY_FILES, icon: <FileText size={18} />, color: '#2dd4bf' },
              { id: 'ADMIN', label: t.ADMIN, icon: <ShieldCheck size={18} />, color: '#f97316' },
              { id: 'CONTROL_PANEL', label: t.CONTROL_PANEL, icon: <Sliders size={18} />, color: '#f97316' },
              { id: 'ACCOUNT', label: t.ACCOUNT, icon: <UserPlus size={18} />, color: '#22d3ee' },
              { id: 'USER_ACCOUNTS', label: t.USER_ACCOUNTS, icon: <Users size={18} />, color: '#10b981' },
              { id: 'USER_RENEW', label: t.USER_RENEW || 'User Renew', icon: <RefreshCw size={18} />, color: '#f43f5e' },
              { id: 'SEARCH', label: t.SEARCH || 'Search', icon: <Search size={18} />, color: '#818cf8' },
              { id: 'MY_INCOME', label: t.MY_INCOME, icon: <Wallet size={18} />, color: '#10b981' },
              { id: 'PAYMENT', label: t.PAYMENT, icon: <Wallet size={18} />, color: '#fbbf24' },
              { id: 'ADD_MONEY', label: t.ADD_MONEY || 'Add Money', icon: <DollarSign size={18} />, color: '#10b981' },
              { id: 'SETTINGS', label: t.SETTINGS, icon: <Settings size={18} />, color: '#9ca3af' },
              { id: 'SUPPORT', label: t.SUPPORT, icon: <Headphones size={18} />, color: '#f472b6' },
              { id: 'USER_PROFILE', label: t.NAV_PROFILE, icon: <User size={18} />, color: '#6366f1' },
              { id: 'CHAT', label: t.CHAT, icon: <MessageSquare size={18} />, color: '#ec4899' },
              { id: 'THEME', label: t.THEME, icon: <Palette size={18} />, color: '#a855f7' },
              { id: 'SECURITY', label: t.SECURITY, icon: <Lock size={18} />, color: '#ef4444' },
              { id: 'RESET_SYSTEM', label: t.GLOBAL_RESET || 'Global Reset', icon: <RefreshCw size={18} />, color: '#ef4444' },
            ].map((item: any) => {
              const isSelected = formData.permissions.includes(item.id);
              const customTextColor = getContrastColor(item.color);
              return (
                <button
                  key={item.id}
                  onClick={() => togglePermission(item.id)}
                  className={`bg-card-bg border-white/10 py-3 px-1 rounded-lg shadow-sm flex flex-col items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all aspect-square w-full h-full border relative ${isSelected ? 'ring-2 ring-offset-1 dark:ring-offset-black' : ''}`}
                  style={isSelected ? { ringColor: currentThemeObj.primary } : {}}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center z-10 shadow-sm" style={{ backgroundColor: currentThemeObj.primary }}>
                      <Check size={10} className="text-white font-black" />
                    </div>
                  )}
                  <div 
                    className={`${appGrid === '3x6' ? 'w-14 h-14' : 'w-11 h-11'} shrink-0 rounded-[6px] flex items-center justify-center shadow-sm`}
                    style={{ backgroundColor: item.color, color: customTextColor }}
                  >
                    {React.cloneElement(item.icon as React.ReactElement, { size: appGrid === '3x6' ? 24 : 18 })}
                  </div>
                  <span className={`${appGrid === '3x6' ? 'text-[11px]' : 'text-[10px]'} font-black text-text-main text-center leading-tight w-full px-0.5 whitespace-normal line-clamp-2`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="w-full px-2 py-4 border-t border-white/5 bg-app-bg shrink-0">
          <div className="w-full max-w-4xl mx-auto">
            <button
              onClick={() => setShowPermissionsModal(false)}
              className="w-full h-14 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm"
              style={{ 
                background: currentThemeObj.primary,
                boxShadow: `0 10px 25px -5px ${currentThemeObj.primary}66`
              }}
            >
              Done ({formData.permissions.length} Selected)
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-generate 7-digit User ID on mount
  useEffect(() => {
    // ID is now generated dynamically on submit if empty
  }, []);

  const handleSubmit = async () => {
    // 0. Check Required Fields
    if (!formData.fullName || !formData.mobile || !formData.email || !formData.password || !formData.country || !formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
      showFeedback(t.REQUIRED_FIELDS_ERROR || "Please fill all required fields correctly.");
      return;
    }

    // Generate unique 7 digit User ID
    let finalUserId = formData.userId;
    if (!finalUserId) {
      let isUnique = false;
      while(!isUnique) {
        finalUserId = Math.floor(1000000 + Math.random() * 9000000).toString();
        if (!users.some(u => u.userId === finalUserId || u.id === finalUserId)) {
          isUnique = true;
        }
      }
      setFormData(prev => ({ ...prev, userId: finalUserId }));
    }

    // 1. Check Mobile Number
    if (users.some(u => u.mobileNumber === formData.mobile)) {
      showFeedback(t.MOBILE_EXISTS);
      return;
    }

    // 2. Check ID Number
    if (users.some(u => u.idNumber === formData.idNumber)) {
      showFeedback(t.ID_NUMBER_EXISTS);
      return;
    }

    // 3. Check Email ID
    if (users.some(u => u.email === formData.email || u.email === formData.loginEmail)) {
      showFeedback(t.EMAIL_EXISTS);
      return;
    }

    // 4. Check User ID and Password
    const existingUser = users.find(u => u.userId === finalUserId || u.id === finalUserId);
    if (existingUser) {
      if (existingUser.password === formData.password) {
        showFeedback(t.USER_ID_PASSWORD_EXISTS);
      } else {
        showFeedback(t.USER_ID_EXISTS);
      }
      return;
    }

    // 5. Check Password Confirmation
    if (formData.password !== formData.confirmPassword) {
      showFeedback(t.PASSWORDS_DONT_MATCH);
      return;
    }

    setIsSubmitting(true);
    
    // Create new user object with automatic timestamp
    const now = new Date();
    const timestamp = now.toLocaleString('en-US', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });

    // Generate Account Number: 2050 + 10 random digits
    const random10Digits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const accountNumber = `2050${random10Digits}`;

    const newUser = {
      id: formData.fullName,
      userId: finalUserId,
      accountNumber: accountNumber,
      name: formData.fullName,
      email: formData.email,
      loginEmail: formData.loginEmail,
      role: accountType === 'COMPANY' ? 'ADMIN' : 'USER',
      status: 'ENABLED',
      isFirstLogin: true,
      avatar: '', // Default avatar
      nationality: formData.nationality,
      dob: formData.dob,
      countryCode: formData.countryCode,
      mobileNumber: formData.mobile,
      idIssueCountry: formData.idIssueCountry,
      idType: formData.idType,
      idNumber: formData.idNumber,
      idIssueDate: formData.idIssueDate,
      idExpiryDate: formData.idExpiryDate,
      presentCountry: formData.country,
      country: formData.country,
      buildingNumber: formData.buildingNumber,
      streetNumber: formData.streetNumber,
      zoneNumber: formData.zoneNumber,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      postOffice: formData.postOffice,
      postalCode: formData.postalCode,
      manualAddress: formData.manualAddress,
      division: formData.city,
      district: formData.state,
      upazila: formData.addressLine2,
      policeStation: formData.addressLine2,
      area: formData.addressLine1,
      building: formData.buildingNumber,
      stateNumber: formData.streetNumber,
      zoomNumber: formData.zoneNumber,
      electricityNumber: formData.electricity,
      password: await (await import('bcryptjs')).hash(formData.password, 10),
      gender: formData.gender,
      religion: formData.religion,
      permissions: formData.permissions,
      accountType: formData.profileAccountType || 'Transport Account',
      duration: formData.duration,
      price: formData.price,
      package: formData.package,
      packagePrice: parseFloat(formData.packagePrice) || 0,
      activationDate: new Date().toISOString().split('T')[0],
      expiryDate: (() => {
        const date = new Date();
        if (formData.duration === '1 MONTH') date.setMonth(date.getMonth() + 1);
        else if (formData.duration === '3 MONTHS') date.setMonth(date.getMonth() + 3);
        else if (formData.duration === '6 MONTHS') date.setMonth(date.getMonth() + 6);
        else if (formData.duration === '1 YEAR') date.setFullYear(date.getFullYear() + 1);
        else return ''; // Lifetime
        return date.toISOString().split('T')[0];
      })(),
      registrationDate: timestamp
    };

    // Create initial payment record if price > 0
    if (formData.price && parseFloat(formData.price) > 0) {
      const paymentId = 'PAY-' + Math.floor(100000 + Math.random() * 900000).toString();
      const payment = {
        id: paymentId,
        transactionId: 'TXN-' + Math.floor(10000000 + Math.random() * 90000000).toString(),
        amount: parseFloat(formData.price),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        type: 'INCOME',
        category: 'Subscription',
        method: 'CASH', // Default to CASH for manual entry
        details: {
          serviceName: `Subscription - ${formData.duration}`
        },
        userId: newUser.id,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      };
      // @ts-ignore
      addPayment(payment);
    }

    try {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to register authentication credentials.');
      }
    } catch (authErr: any) {
      console.error("Firebase Authentication registration error:", authErr);
      showFeedback(language === 'bn' 
        ? `অথেনটিকেশন অ্যাকাউন্ট তৈরি করতে ব্যর্থ হয়েছে: ${authErr.message || ''}` 
        : `Failed to register authentication credentials: ${authErr.message || ''}`);
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      addUser(newUser as any);
      setIsSubmitting(false);
      showFeedback(t.ACCOUNT_CREATED_SUCCESS);
      setTimeout(() => {
        setView('DASHBOARD');
      }, 1500);
    }, 500);
  };

  const renderForm = () => {
    let idNumberLabel = t.ID_NUMBER || 'ID Number';
    let idNumberIcon = <CreditCard size={16} />;
    
    if (formData.idType) {
      const selectedIdType = formData.idType.toUpperCase();
      if (selectedIdType === 'PASSPORT') {
        idNumberLabel = 'Passport number';
        idNumberIcon = <Globe size={16} />;
      } else if (selectedIdType.includes('BIRTH') || selectedIdType.includes('REGISTRATION')) {
        idNumberLabel = 'Birth registration number';
        idNumberIcon = <FileText size={16} />;
      } else if (selectedIdType === 'NID' || selectedIdType.includes('NATIONAL')) {
        idNumberLabel = 'National id numbers';
        idNumberIcon = <Shield size={16} />;
      } else if (selectedIdType.includes('RESIDENT') || selectedIdType === 'VISA' || selectedIdType.includes('PERMIT') || selectedIdType === 'QID' || selectedIdType === 'IQAMA') {
        idNumberLabel = 'Resident id numbers';
        idNumberIcon = <CreditCard size={16} />;
      } else if (selectedIdType === 'DRIVING LICENSE' || selectedIdType.includes('LICENSE')) {
        idNumberLabel = 'License Number';
        idNumberIcon = <CreditCard size={16} />;
      } else {
        idNumberLabel = `${formData.idType} number`;
        idNumberIcon = <CreditCard size={16} />;
      }
    }

    return (
    <div className="space-y-6 pb-20">
      {/* Personal Info */}
      <div>
        <FormSection title={t.PERSONAL_INFO} icon={User}>
          <div className="grid grid-cols-10 gap-4">
            <div className="col-span-10">
              <InputField ref={(el) => refs.current['fullName'] = el} label={t.FULL_NAME} name="fullName" value={formData.fullName} onChange={handleInputChange('fullName')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'gender')} required icon={<User size={16} />} />
            </div>
            <div className="col-span-5">
              <InputField 
                ref={(el) => refs.current['gender'] = el}
                label={t.GENDER} 
                name="gender"
                type="select" 
                options={['MALE', 'FEMALE', 'OTHER'].map(g => ({ value: g, label: g }))} 
                value={formData.gender} 
                onChange={() => {}}
                onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                onKeyDown={(e) => handleKeyDown(e, 'religion')}
                icon={<UserCircle size={16} />}
              />
            </div>
            <div className="col-span-5">
              <InputField 
                ref={(el) => refs.current['religion'] = el}
                label={t.RELIGION} 
                name="religion"
                type="select" 
                options={['ISLAM', 'HINDUISM', 'CHRISTIANITY', 'BUDDHISM', 'OTHER'].map(r => ({ value: r, label: r }))} 
                value={formData.religion} 
                onChange={() => {}}
                onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                onKeyDown={(e) => handleKeyDown(e, 'nationality')}
                icon={<Shield size={16} />}
              />
            </div>
            {accountType !== 'COMPANY' && (
              <div className="col-span-10">
                <InputField 
                  label="Account Type"
                  name="profileAccountType"
                  type="select"
                  options={[
                    { value: 'Transport Account', label: 'Transport Account' },
                    { value: 'Personal Account', label: 'Personal Account' },
                    { value: 'Company Account', label: 'Company Account' }
                  ]}
                  value={formData.profileAccountType || 'Transport Account'}
                  onChange={() => {}}
                  onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                  icon={<UserPlus size={16} />}
                />
              </div>
            )}
            <div className="col-span-5">
              <InputField 
                ref={(el) => refs.current['nationality'] = el}
                label={t.NATIONALITY} 
                name="nationality"
                type="select" 
                options={nationalities.map(n => ({ value: n.name, label: n.name, icon: n.flag }))} 
                value={formData.nationality} 
                onChange={() => {}}
                onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                onKeyDown={(e) => handleKeyDown(e, 'dob')}
                icon={<Globe size={16} />}
              />
            </div>
            <div className="col-span-5">
              <InputField ref={(el) => refs.current['dob'] = el} label={t.DATE_OF_BIRTH} name="dob" type="date" value={formData.dob} onChange={handleInputChange('dob')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'profession')} icon={<Calendar size={16} />} />
            </div>

            <div className="col-span-10">
              <InputField 
                ref={(el) => refs.current['profession'] = el}
                label={t.PROFESSION} 
                name="profession" 
                value={formData.profession} 
                onChange={handleInputChange('profession')} 
                type="select" 
                options={['Driver', 'Manager', 'Technician', 'Administrator', 'Other'].map(p => ({ value: p, label: p }))} 
                onOpenModal={(name, label, options) => handleOpenModal(name, label, options)} 
                onKeyDown={(e) => handleKeyDown(e, 'companyName')}
                icon={<Briefcase size={16} />}
              />
            </div>
            {accountType !== 'COMPANY' && (
              <div className="col-span-10 md:col-span-5">
                <InputField 
                  ref={(el) => refs.current['companyName'] = el}
                  label={t.SPONSOR_NAME} 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleInputChange('companyName')} 
                  type="select" 
                  options={(companies.length > 0 ? companies : ['FleetPro Transport', 'Internal Sponsor', 'Standard Company']).map(c => ({ value: c, label: c }))} 
                  onOpenModal={(name, label, options) => handleOpenModal(name, label, options)} 
                  onKeyDown={(e) => handleKeyDown(e, 'idIssueCountry')}
                  icon={<Building2 size={16} />}
                />
              </div>
            )}

            <div className="col-span-10">
              <InputField 
                ref={(el) => refs.current['idIssueCountry'] = el}
                label={t.ID_ISSUE_COUNTRY} 
                name="idIssueCountry"
                type="select" 
                options={countries.map(c => ({ value: c.name, label: c.name, icon: c.flag }))} 
                value={formData.idIssueCountry} 
                onChange={() => {}}
                onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                onKeyDown={(e) => handleKeyDown(e, 'idType')}
                icon={<Globe size={16} />}
              />
            </div>

            <>
              {formData.idIssueCountry && (
                <div 
                   
                   
                  
                  className="col-span-10 grid grid-cols-10 gap-4"
                >
                  <div className="col-span-10 md:col-span-5">
                    <InputField 
                      ref={(el) => refs.current['idType'] = el}
                      label={t.ID_TYPE} 
                      name="idType"
                      type="select" 
                      options={(idTypes.length > 0 ? idTypes : ['NID', 'PASSPORT', 'DRIVING LICENSE', 'VISA', 'WORK PERMIT']).map(t => ({ value: t, label: t }))} 
                      value={formData.idType} 
                      onChange={() => {}}
                      onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                      onKeyDown={(e) => handleKeyDown(e, 'idNumber')}
                      icon={<Shield size={16} />}
                    />
                  </div>
                  <div className="col-span-10 md:col-span-5">
                    <InputField ref={(el) => refs.current['idNumber'] = el} label={idNumberLabel} placeholder={idNumberLabel} name="idNumber" type="tel" inputMode="numeric" value={formData.idNumber} onChange={handleInputChange('idNumber')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'idExpiryDate')} icon={idNumberIcon} />
                  </div>
                  <div className="col-span-10 md:col-span-5">
                    <InputField ref={(el) => refs.current['idExpiryDate'] = el} label={t.ID_EXPIRY_DATE} name="idExpiryDate" type="date" value={formData.idExpiryDate} onChange={handleInputChange('idExpiryDate')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'countryCode')} icon={<Calendar size={16} />} />
                  </div>
                </div>
              )}
            </>

            <div className="col-span-3 md:col-span-3">
              <InputField 
                ref={(el) => refs.current['countryCode'] = el}
                label={t.COUNTRY_CODE || 'Code'} 
                name="countryCode"
                type="select" 
                className="h-14"
                options={countries.map(c => ({ value: c.code, label: c.code, icon: c.flag, subLabel: c.name }))} 
                value={formData.countryCode} 
                onChange={() => {}}
                onOpenModal={(name, label, options) => handleOpenModal(name, "Select Country Code", options)}
                onKeyDown={(e) => handleKeyDown(e, 'mobile')}
                icon={<Phone size={16} />}
              />
            </div>
            <div className="col-span-7 md:col-span-7">
              <InputField ref={(el) => refs.current['mobile'] = el} label={t.MOBILE_NUMBER} name="mobile" type="tel" inputMode="numeric" value={formData.mobile} onChange={handleInputChange('mobile')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'email')} required icon={<Phone size={16} />} />
            </div>
            <div className="col-span-10">
              <InputField ref={(el) => refs.current['email'] = el} label={t.EMAIL_ID} name="email" type="email" value={formData.email} onChange={handleInputChange('email')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'userId')} required icon={<Mail size={16} />} />
            </div>
          </div>
        </FormSection>
      </div>

      {/* User Login Details */}
      <FormSection title={t.USER_LOGIN_DETAILS} icon={Shield}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <InputField ref={(el) => refs.current['userId'] = el} label={t.USER_ID} name="userId" type="text" value={formData.userId} onChange={handleInputChange('userId')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'password')} required icon={<User size={16} />} />
          </div>
          <div className="col-span-1">
            <InputField ref={(el) => refs.current['password'] = el} label={t.PASSWORD} name="password" type="password" value={formData.password} onChange={handleInputChange('password')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'confirmPassword')} hideCheckmark error={passwordError} required icon={<Lock size={16} />} />
          </div>
          <div className="col-span-1">
            <InputField ref={(el) => refs.current['confirmPassword'] = el} label={t.CONFIRM_PASSWORD} name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange('confirmPassword')} enterKeyHint="next" onKeyDown={(e) => handleKeyDown(e, 'country')} hideCheckmark error={passwordError} required icon={<Lock size={16} />} />
          </div>
        </div>
      </FormSection>

      {/* Present address */}
      <FormSection title="Address Information" icon={MapPin}>
        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-1">
            <InputField 
              label={t.COUNTRY} 
              name="country"
              type="select" 
              options={countries.map(c => ({ value: c.name, label: c.name, icon: c.flag }))} 
              value={formData.country} 
              onChange={() => {}}
              onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
              required
              icon={<Globe size={16} />}
            />
          </div>
          <>
            {formData.country && (
              <div   className="col-span-1 grid grid-cols-2 gap-4">
                <InputField 
                  label="Building Number" 
                  name="buildingNumber" 
                  type="tel" 
                  inputMode="numeric" 
                  value={formData.buildingNumber} 
                  onChange={handleInputChange('buildingNumber')} 
                  icon={<Building size={16} />}
                />
                <InputField 
                  label="Street Number" 
                  name="streetNumber" 
                  type="tel" 
                  inputMode="numeric" 
                  value={formData.streetNumber} 
                  onChange={handleInputChange('streetNumber')} 
                  icon={<MapPin size={16} />}
                />
                <InputField 
                  label="Zone Number" 
                  name="zoneNumber" 
                  type="tel" 
                  inputMode="numeric" 
                  value={formData.zoneNumber} 
                  onChange={handleInputChange('zoneNumber')} 
                  icon={<MapPin size={16} />}
                />
                 <InputField 
                  label="Postal code *" 
                  name="postalCode" 
                  type="tel" 
                  inputMode="numeric" 
                  value={formData.postalCode} 
                  onChange={handleInputChange('postalCode')} 
                  icon={<MapPin size={16} />}
                  required
                />
                
                <div className="col-span-2">
                  <InputField 
                    label="Area" 
                    name="addressLine1" 
                    value={formData.addressLine1} 
                    onChange={handleInputChange('addressLine1')} 
                    icon={<MapPin size={16} />}
                    required
                  />
                </div>
                
                <div className="col-span-2">
                  <InputField 
                    label="Address line 2" 
                    name="addressLine2" 
                    value={formData.addressLine2} 
                    onChange={handleInputChange('addressLine2')} 
                    icon={<MapPin size={16} />}
                  />
                </div>

                <InputField 
                  label="Ciyt / Town *" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleInputChange('city')} 
                  icon={<MapPin size={16} />}
                  required
                />

                <InputField 
                  label="State / Region *" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleInputChange('state')} 
                  icon={<MapPin size={16} />}
                  required
                />

                <div className="col-span-2">
                  <InputField 
                    label="Post office Name" 
                    name="postOffice" 
                    type="select"
                    value={formData.postOffice} 
                    options={postOffices.map(po => ({ value: po.name, label: `${po.name} (${po.code})` }))}
                    onOpenModal={(name, label, options) => handleOpenModal(name, label, options)} 
                    icon={<MapPin size={16} />}
                  />
                </div>

                <div className="col-span-2 h-28">
                  <InputField 
                    label="Manual Address (Type your full address here)" 
                    name="manualAddress" 
                    type="textarea"
                    value={formData.manualAddress} 
                    onChange={handleInputChange('manualAddress')} 
                    className="h-28"
                  />
                </div>
              </div>
            )}
          </>
        </div>
      </FormSection>

      {/* Admin Controls */}
      <FormSection title={t.ADMIN_CONTROLS} icon={ShieldCheck}>
        <div className="space-y-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-1">
              {t.ACCOUNT_ROLE}
            </label>
            <div className={`relative flex items-center p-1 rounded-xl w-full h-14 ${isWhiteMode ? 'bg-gray-100' : 'bg-white/10'}`}>
              <div
                className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 shadow-sm"
                style={{
                  backgroundColor: accountType === 'COMPANY' ? '#ef4444' : '#10b981',
                  left: accountType === 'COMPANY' ? 'calc(50% + 2px)' : '4px',
                  width: 'calc(50% - 6px)'
                }}
              />
              {['USER', 'ADMIN'].map((r) => {
                const isActive = (r === 'ADMIN' && accountType === 'COMPANY') || (r === 'USER' && accountType === 'PERSONAL');
                const activeBgColor = accountType === 'COMPANY' ? '#ef4444' : '#10b981';
                const activeTextColor = getContrastColor(activeBgColor);
                return (
                  <button
                    key={r}
                    onClick={() => setAccountType(r === 'ADMIN' ? 'COMPANY' : 'PERSONAL')}
                    className={`relative z-10 flex-1 h-full rounded-lg text-xs font-bold uppercase transition-colors duration-300 ${
                      isActive ? '' : 'text-text-muted hover:text-text-main'
                    }`}
                    style={isActive ? { color: activeTextColor } : {}}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
              {t.MODULE_PERMISSIONS}
            </label>
            <button
              onClick={() => setShowPermissionsModal(true)}
              className={`w-full p-4 rounded-lg flex items-center justify-between transition-all ${
                formData.permissions.length > 0
                  ? ''
                  : `${isWhiteMode ? 'bg-gray-100' : 'bg-white/10'} text-text-muted hover:bg-gray-200 dark:hover:bg-white/20`
              }`}
              style={formData.permissions.length > 0 ? {
                backgroundColor: `${currentThemeObj.primary}0D`,
                borderColor: `${currentThemeObj.primary}4D`,
                color: currentThemeObj.primary
              } : {}}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  formData.permissions.length > 0 ? 'text-white' : 'bg-theme-hover text-text-muted'
                }`}
                style={formData.permissions.length > 0 ? { background: headerBg || currentThemeObj.primary } : {}}
                >
                  <Lock size={18} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-xs uppercase">Module Permissions</p>
                  <p className="text-[10px] opacity-70">{formData.permissions.length} Modules Selected</p>
                </div>
              </div>
              <ChevronRight size={18} className="opacity-50" />
            </button>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">
              {t.ACCESS_DURATION}
            </label>
            <div className="grid grid-cols-3 gap-2 relative">
              {['1 MONTH', '3 MONTHS', '6 MONTHS', '1 YEAR', 'LIFETIME'].map((d) => {
                const isActive = formData.duration === d;
                return (
                  <button
                    key={d}
                    onClick={() => setFormData({...formData, duration: d})}
                    className={`relative h-14 px-2 rounded-lg text-[10px] font-bold uppercase transition-all duration-300 overflow-hidden ${
                      isActive
                        ? 'text-white shadow-lg shadow-blue-500/20'
                        : `${isWhiteMode ? 'bg-gray-100' : 'bg-white/10'} text-text-muted hover:bg-gray-200 dark:hover:bg-white/20`
                    }`}
                  >
                    {isActive && (
                      <div
                        
                        className="absolute inset-0 bg-[var(--primary)]"
                        
                      />
                    )}
                    <span className="relative z-10">{d}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div className="pt-2">
            <InputField 
              label={t.ACCOUNT_PRICE_VALUE} 
              name="price"
              type="tel"
              inputMode="decimal"
              value={formData.price} 
              onChange={handleInputChange('price')} 
              icon={<DollarSign size={16} />}
            />
          </div>
          
          <div className="pt-2">
            <InputField 
              label={t.PACKAGE_NAME} 
              name="package"
              type="select"
              options={[
                { label: 'Basic', value: 'Basic' },
                { label: 'Standard', value: 'Standard' },
                { label: 'Premium', value: 'Premium' },
                { label: 'Pro', value: 'Pro' },
                { label: 'VIP', value: 'VIP' },
                { label: 'Custom', value: 'Custom' }
              ]}
              value={formData.package} 
              onChange={() => {}}
              onOpenModal={(name, label, options) => handleOpenModal(name, "Select Package Name", options)}
              icon={<Diamond size={16} />}
            />
          </div>

          <div className="pt-2">
            <InputField 
              label={t.PACKAGE_PRICE} 
              name="packagePrice"
              type="tel"
              inputMode="decimal"
              value={formData.packagePrice} 
              onChange={handleInputChange('packagePrice')} 
              icon={<DollarSign size={16} />}
            />
          </div>
        </div>
      </FormSection>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6 pb-6">
        <button 
          onClick={() => setView('DASHBOARD')}
          className="flex-1 h-14 bg-red-500 text-white font-bold rounded-lg active:scale-95 transition-all uppercase hover:bg-red-600 shadow-lg shadow-red-500/20 text-xs flex items-center justify-center"
        >
          {t.CANCEL || 'Cancel'}
        </button>
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 h-14 bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-500/20 active:scale-95 transition-all uppercase flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-green-600 text-xs"
        >
          {isSubmitting ? 'Processing...' : (t.SUBMIT || 'Submit')} <CheckCircle2 size={16} />
        </button>
      </div>
    </div>
  );
  };

  return (
    <InputFieldThemeContext.Provider value={isWhiteMode ? 'light' : null}>
      <div className="animate-fade-in pb-6">
        <>
          {showPermissionsModal ? (
          <div 
            key="permissions" 
            className="w-full flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 w-full mx-auto pt-18 pb-4 overflow-y-auto scrollbar-hide min-h-0">
              <div className={`grid ${appGrid === '3x6' ? 'grid-cols-3' : 'grid-cols-4'} sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4`}>
                {GLOBAL_DASHBOARD_MODULES.map((m) => {
                  const label = t[m.labelKey as keyof typeof t] || m.labelKey || m.id;
                  return {
                    id: m.id,
                    label,
                    icon: m.icon,
                    color: m.color
                  };
                }).map((item: any) => {
                  const isSelected = formData.permissions.includes(item.id);
                  const customTextColor = getContrastColor(item.color);
                  return (
                    <button
                      key={item.id}
                      onClick={() => togglePermission(item.id)}
                      className={`bg-card-bg border-white/10 py-3 px-1 rounded-lg shadow-sm flex flex-col items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all aspect-square w-full h-full border relative ${isSelected ? 'ring-2 ring-offset-1 dark:ring-offset-black' : ''}`}
                      style={isSelected ? { ringColor: currentThemeObj.primary } : {}}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center z-10 shadow-sm" style={{ backgroundColor: currentThemeObj.primary }}>
                          <Check size={10} className="text-white font-black" />
                        </div>
                      )}
                      <div 
                        className={`${appGrid === '3x6' ? 'w-14 h-14' : 'w-11 h-11'} shrink-0 rounded-[6px] flex items-center justify-center shadow-sm`}
                        style={{ backgroundColor: item.color, color: customTextColor }}
                      >
                        {React.cloneElement(item.icon as React.ReactElement, { size: appGrid === '3x6' ? 24 : 18 })}
                      </div>
                      <span className={`${appGrid === '3x6' ? 'text-[11px]' : 'text-[10px]'} font-black text-text-main text-center leading-tight w-full px-0.5 whitespace-normal line-clamp-2`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="w-full px-2 py-4 border-t border-white/5 bg-app-bg shrink-0">
              <div className="w-full max-w-4xl mx-auto">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="w-full h-14 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm"
                  style={{ 
                    background: currentThemeObj.primary,
                    boxShadow: `0 10px 25px -5px ${currentThemeObj.primary}66`
                  }}
                >
                  Done ({formData.permissions.length} Selected)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            key="content"
            className="w-full"
          >
            {showSuccess && (
              <div 
                
                
                className="fixed top-16 left-0 right-0 bottom-32 z-[60] bg-app-bg flex flex-col items-center justify-center px-3 pb-6"
              >
                <div className="relative mb-8">
                  <div
                    
                    
                    className="w-24 h-24 rounded-full border-4 border-t-cyan-500"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      
                      
                      
                    >
                      <Check size={48} strokeWidth={4} className="text-cyan-500" />
                    </div>
                  </div>
                </div>
                
                <h3 className={`text-2xl font-black uppercase mb-4 tracking-tight text-text-main`}>
                  {t.ACCOUNT_CREATED || 'Account Created'}
                </h3>
                <p className="text-text-muted font-bold text-sm mb-12 leading-relaxed uppercase tracking-wide text-center max-w-xs">
                  {t.ACCOUNT_CREATED_SUCCESS || 'The account has been created successfully and is now active.'}
                </p>
                
                <button 
                  onClick={() => { setShowSuccess(false); setView('DASHBOARD'); }}
                  className="w-full max-w-xs h-14 bg-cyan-500 text-white font-black rounded-lg shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  {t.BACK_TO_DASHBOARD || 'Back to Dashboard'}
                </button>
              </div>
            )}

            {!showSuccess && (
              <>
                {showTypeSelection ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 space-y-6 min-h-[calc(100dvh-180px)] pb-6">
                    <div className="text-center space-y-2">
                       <h3 className="text-xl font-black uppercase text-text-main">{t.ACCOUNT_TYPE_QUESTION}</h3>
                       <p className="text-xs text-text-muted font-bold uppercase tracking-widest">
                         {t.PREFERRED_ACCOUNT_TYPE_SUB || 'Select your preferred account type to continue'}
                       </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                      <button
                        onClick={() => { setAccountType('PERSONAL'); setShowTypeSelection(false); }}
                        className={`p-6 rounded-lg flex items-center gap-4 transition-all border shadow-sm hover:shadow-md ${isDarkMode ? 'bg-[#121212] border-white/10 hover:border-blue-500' : 'bg-white border-zinc-200 hover:border-blue-500'}`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-lg shrink-0">
                          <User size={24} />
                        </div>
                        <div className="text-left">
                          <p className={`font-black uppercase text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.PERSONAL_ACCOUNT}</p>
                          <p className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-white/60' : 'text-zinc-500'}`}>{t.INDIVIDUAL_ACCOUNT}</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { setAccountType('COMPANY'); setShowTypeSelection(false); }}
                        className={`p-6 rounded-lg flex items-center gap-4 transition-all border shadow-sm hover:shadow-md ${isDarkMode ? 'bg-[#121212] border-white/10 hover:border-indigo-500' : 'bg-white border-zinc-200 hover:border-indigo-500'}`}
                      >
                        <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0">
                          <Building2 size={24} />
                        </div>
                        <div className="text-left">
                          <p className={`font-black uppercase text-sm ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{t.COMPANY_ACCOUNT}</p>
                          <p className={`text-[10px] font-bold uppercase ${isDarkMode ? 'text-white/60' : 'text-zinc-500'}`}>{t.BUSINESS_ACCOUNT}</p>
                        </div>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => setView('DASHBOARD')}
                      className="mt-8 py-2 px-6 text-gray-400 font-black uppercase text-xs hover:text-gray-600 transition-colors"
                    >
                      {t.CANCEL || "Cancel"}
                    </button>
                  </div>
                ) : (
                  isDesktop ? (
                    <FormWindow title="New Account" onClose={() => setView('DASHBOARD')}>
                      {renderForm()}
                    </FormWindow>
                  ) : (
                    renderForm()
                  )
                )}
              </>
            )}
          </div>
        )}
      </>

      <GlobalFullscreenSelect
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSelect={handleSelect}
        options={modalConfig.options}
        title={modalConfig.title}
        selectedValue={modalConfig.field ? (formData as any)[modalConfig.field] : ''}
      />
    </div>
    </InputFieldThemeContext.Provider>
  );
};

export default NewAccount;
