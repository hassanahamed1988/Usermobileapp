import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useStore ,GLOBAL_TRANSITION ,GLOBAL_VARIANTS } from '@/store';
import { TRANSLATIONS } from '@/constants';
import { Plus ,Users ,ShoppingCart ,User as UserIcon ,Phone ,Calendar ,Globe ,MapPin ,X ,Check ,Eye ,Trash2 ,Edit ,Power ,Scan ,Camera ,Download ,Banknote ,CreditCard ,ArrowLeft ,ChevronDown ,CheckCircle2 ,Clock ,Store ,Package ,FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import InputField, { InputFieldThemeContext } from '@/components/InputField';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import { COUNTRIES } from '@/data/locations';
import { User } from '@/types';
import { saveFirebaseDoc ,subscribeFirebaseCollection ,deleteFirebaseDoc ,subscribeFirebaseCollectionGroup ,subscribeFirebaseDoc } from '@/services/firebase';
import { compressReceiptImage } from '@/utils/imageUtils';
import { downloadPdf } from '../utils/fileUtils';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Filesystem ,Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { FileOpener } from "@capacitor-community/file-opener";

// Assuming we add Partner type to types later defining it here for now if needed.
// Or we just save it to Firebase under 'partners' collection.

const SimpleInput = ({ 
  label 
  ,value 
  ,onChange 
  ,icon: Icon 
  ,type = 'text'
  ,readOnly = false
  ,onClick
  ,isDarkMode
}: any) => {
  const [isFocused ,setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== null && value !== '';

  return (
    <div 
      className="simple-input-container relative border rounded-xl flex items-center transition-all h-14 w-full bg-transparent"
      style={{
        borderColor: isFocused 
          ? (isDarkMode ? '#10b981' : '#059669')
          : (isDarkMode ? 'rgba(2552552550.2)' : 'rgba(0000.2)')
      }}
      onClick={onClick}
    >
      {Icon && (
        <div className="pl-4 opacity-50 flex-shrink-0" style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
          {Icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full bg-transparent px-4 outline-none border-none focus:ring-0 focus:outline-none focus:border-none font-medium h-full text-sm"
        style={{ color: isDarkMode ? '#ffffff' : '#000000' ,boxShadow: 'none' }}
      />
      <label
        className={`absolute font-extrabold tracking-wider transition-all duration-200 pointer-events-none z-20
          ${isFocused || hasValue 
            ? 'left-3 top-0 -translate-y-1/2 text-[10px] px-1 opacity-100' 
            : `top-1/2 -translate-y-1/2 text-[12px] px-1 opacity-70 ${Icon ? 'left-10' : 'left-3'}`
          }
        `}
        style={{
          color: isFocused 
            ? (isDarkMode ? '#60a5fa' : '#059669') 
            : (isDarkMode ? '#9ca3af' : '#4b5563')
          ,backgroundColor: (isFocused || hasValue) ? (isDarkMode ? 'var(--card-bg-solid, #000000)' : 'var(--card-bg-solid, #ffffff)') : 'transparent'
          ,borderRadius: 0
        }}
      >
        {label}
      </label>
    </div>
  );
};

import PartnerProfileCard from '@/components/PartnerProfileCard';

export default function Purchase() {
  const { language ,user ,isNightMode ,users ,showFeedback ,appThemeMode ,backgroundColor ,wallpaper ,confirmAction ,currentView ,setView ,goBack ,theme ,isDarkMode: storeIsDarkMode ,globalFilterMonth ,setGlobalFilterMonth ,globalFilterYear ,setGlobalFilterYear ,countries ,banks ,branches ,walletPaymentMethods, activeSection, setActiveSection } = useStore();

  React.useEffect(() => {
    if (currentView === 'PURCHASE' && activeSection) {
      if (activeSection === 'ADD_PARTNER') {
        setIsUserListOpen(true);
        setActiveSection(null);
      } else if (activeSection === 'PARTNER_LIST') {
        setIsPartnerListModalOpen(true);
        setPartnerFilter('active');
        setActiveSection(null);
      }
    }
  }, [currentView, activeSection, setActiveSection]);

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

  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';
  const currentLanguage = language || 'en';
  const t = (key: keyof typeof TRANSLATIONS['en']) => {
    return TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS['en'][key] || key;
  };
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  
  const [isFabMenuOpen ,setIsFabMenuOpen] = useState(false);
  const [isUserListOpen ,setIsUserListOpen] = useState(false);
  const [isPartnerFormOpen ,setIsPartnerFormOpen] = useState(false);
  const [selectedUser ,setSelectedUser] = useState<User | null>(null);

  // Pay Bill States
  const [messPayments ,setMessPayments] = useState<any[]>([]);
  const [isPayBillOpen ,setIsPayBillOpen] = useState(false);
  const [payPartnerId ,setPayPartnerId] = useState('');
  const [payAmount ,setPayAmount] = useState('');
  const [payMethod ,setPayMethod] = useState('Cash');
  const [payTxnId ,setPayTxnId] = useState('');
  const [payDate ,setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payRemarks ,setPayRemarks] = useState('');

  // Additional payment method details states
  const [bankCountry ,setBankCountry] = useState('');
  const [bankName ,setBankName] = useState('');
  const [bankBranch ,setBankBranch] = useState('');
  const [bankAccountTitle ,setBankAccountTitle] = useState('');
  const [bankAccountNumber ,setBankAccountNumber] = useState('');
  
  const [mobileProvider ,setMobileProvider] = useState('bKash');
  const [mobileSenderNumber ,setMobileSenderNumber] = useState('');
  const [mobileTxnId ,setMobileTxnId] = useState('');
  
  const [cardType ,setCardType] = useState('Visa');
  const [cardHolderName ,setCardHolderName] = useState('');
  const [cardLastFour ,setCardLastFour] = useState('');

  const [showThirdPartyAlert ,setShowThirdPartyAlert] = useState(false);

  // Form State
  const [formAccountType ,setFormAccountType] = useState<'PARTNER' | 'MANAGER'>('PARTNER');
  const [formName ,setFormName] = useState('');
  const [formMobile ,setFormMobile] = useState('');
  const [formDob ,setFormDob] = useState('');
  const [formNationality ,setFormNationality] = useState('');
  const [formCountry ,setFormCountry] = useState('');
  const [formStateNumber ,setFormStateNumber] = useState('');
  const [formZoneNumber ,setFormZoneNumber] = useState('');
  const [formBuildingNumber ,setFormBuildingNumber] = useState('');
  const [formElectricityNumber ,setFormElectricityNumber] = useState('');
  const [formAreaName ,setFormAreaName] = useState('');
  const [formMonthlySalary ,setFormMonthlySalary] = useState('');
  const [formPrice ,setFormPrice] = useState('');

  const [subSelectModal ,setSubSelectModal] = useState<{
    isOpen: boolean;
    name: string;
    label: string;
    options: any[];
  }>({
    isOpen: false
    ,name: ''
    ,label: ''
    ,options: []
  });

  const handleOpenSubSelectModal = (name: string ,label: string ,options: any[]) => {
    setSubSelectModal({ isOpen: true ,name ,label ,options });
  };

  const handleSubSelectModalChange = (value: string) => {
    if (subSelectModal.name === 'country') {
      setFormCountry(value);
    } else if (subSelectModal.name === 'accountType') {
      setFormAccountType(value as 'PARTNER' | 'MANAGER');
    } else if (subSelectModal.name === 'payPartnerId') {
      setPayPartnerId(value);
    } else if (subSelectModal.name === 'payMethod') {
      setPayMethod(value);
    } else if (subSelectModal.name === 'bankCountry') {
      setBankCountry(value);
      setBankName('');
      setBankBranch('');
    } else if (subSelectModal.name === 'bankName') {
      setBankName(value);
      setBankBranch('');
    } else if (subSelectModal.name === 'bankBranch') {
      setBankBranch(value);
    } else if (subSelectModal.name === 'mobileProvider') {
      setMobileProvider(value);
    } else if (subSelectModal.name === 'cardType') {
      setCardType(value);
    } else if (subSelectModal.name.startsWith('item-')) {
      const parts = subSelectModal.name.split('-');
      const index = parseInt(parts[1] ,10);
      const field = parts[2];
      
      setPurchaseItems(prev => {
        const updatedItems = [...prev];
        updatedItems[index] = { ...updatedItems[index] , [field]: value };
        
        if (['price' ,'quantity' ,'unit'].includes(field)) {
          const price = parseFloat(updatedItems[index].price) || 0;
          const qty = parseFloat(updatedItems[index].quantity) || 0;
          const unit = updatedItems[index].unit;
          
          let total = 0;
          if (unit.toLowerCase() === 'gram') {
            total = (price * qty) / 1000;
          } else {
            total = price * qty;
          }
          updatedItems[index].total = Number(total.toFixed(2));
        }
        
        return updatedItems;
      });
    }
    setSubSelectModal((prev) => ({ ...prev ,isOpen: false }));
  };

  // Auto generated
  const currentDate = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString('en-US' ,{ hour12: false });

  const handleOpenNewPartner = () => {
    setIsFabMenuOpen(false);
    setIsUserListOpen(true);
  };

  const handleOpenPurchase = () => {
    setIsFabMenuOpen(false);
    
    // Partner ID Check
    if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      const userPartner = partners.find(p => String(p.userId) === String(user?.id) || String(p.userId) === String(user?.userId));
      if (!userPartner || !userPartner.partnerId) {
        showFeedback('Your Partner ID is not created. Please contact the System Admin.' ,'error');
        return;
      }
    }

    setEditingPurchaseId(null);
    setHypermarketName('');
    setPurchaseItems([]);
    setReceiptImage(null);
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setPurchaseTime(() => {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    });
    setView('NEW_PURCHASE');
  };

  const handleSelectUser = (u: User) => {
    setSelectedUser(u);
    setFormName(u.name || '');
    setFormMobile(u.mobileNumber || '');
    setFormDob(u.dob || '');
    setFormNationality(u.nationality || '');
    
    setFormCountry(u.presentCountry || u.country || '');
    setFormStateNumber(u.stateNumber || '');
    setFormZoneNumber(u.zoneNumber || '');
    setFormBuildingNumber(u.buildingNumber || '');
    setFormElectricityNumber(u.electricityNumber || '');
    setFormAreaName(u.addressLine1 || u.city || u.manualAddress || '');
    setFormAccountType(isAdmin && (u.role as any) === 'MANAGER' ? 'MANAGER' : 'PARTNER');
    
    setIsUserListOpen(false);
    setIsPartnerFormOpen(true);
  };

  const selectedYear = globalFilterYear;
  const setSelectedYear = setGlobalFilterYear;
  const selectedMonth = globalFilterMonth;
  const setSelectedMonth = setGlobalFilterMonth;
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [partners ,setPartners] = useState<any[]>([]);
  const [purchases ,setPurchases] = useState<any[]>([]);
  const [globalUsers ,setGlobalUsers] = useState<any[]>([]);
  const [isPartnerListModalOpen ,setIsPartnerListModalOpen] = useState(false);
  const [partnerFilter ,setPartnerFilter] = useState<'active' | 'inactive'>('active');
  const [editingPartnerId ,setEditingPartnerId] = useState<string | null>(null);
  const [editingPurchaseId ,setEditingPurchaseId] = useState<string | null>(null);
  const [isPurchaseFormModalOpen ,setIsPurchaseFormModalOpen] = useState(false);
  const [isDownloadModalOpen ,setIsDownloadModalOpen] = useState(false);
  const [downloadMonth ,setDownloadMonth] = useState<number>(new Date().getMonth() + 1);
  const [downloadYear ,setDownloadYear] = useState<number>(new Date().getFullYear());
  const [hypermarketName ,setHypermarketName] = useState('');
  const [purchaseDate ,setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchaseTime ,setPurchaseTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [purchaseItems ,setPurchaseItems] = useState<{ id: string, name: string, price: string, quantity: string, unit: string, total: number }[]>([]);
  const [globalItems ,setGlobalItems] = useState<any[]>([]);
  const [hypermarkets, setHypermarkets] = useState<any[]>([]);
  const [isScanning ,setIsScanning] = useState(false);
  const [isActionSheetOpen ,setIsActionSheetOpen] = useState(false);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const [receiptImage ,setReceiptImage] = useState<string | null>(() => localStorage.getItem('temp_scanned_receipt') || null);
  const [activeTab ,setActiveTab] = useState<'history' | 'pending'>('history');
  
  const [isPendingDetailsModalOpen ,setIsPendingDetailsModalOpen] = useState(false);
  const [selectedPendingPurchase ,setSelectedPendingPurchase] = useState<any>(null);
  const livePurchase = selectedPendingPurchase ? (purchases.find((p: any) => p.id === selectedPendingPurchase.id) || selectedPendingPurchase) : null;

  const [isPaymentDetailsOpen ,setIsPaymentDetailsOpen] = useState(false);
  const [selectedPayment ,setSelectedPayment] = useState<any>(null);
  const [isReceiptViewerOpen ,setIsReceiptViewerOpen] = useState(false);
  const [receiptViewerUrl ,setReceiptViewerUrl] = useState<string | null>(null);
  const livePayment = selectedPayment ? (messPayments.find((p: any) => p.id === selectedPayment.id) || selectedPayment) : null;

  const [isPartnerProfileModalOpen ,setIsPartnerProfileModalOpen] = useState(false);
  const [selectedPartnerProfile ,setSelectedPartnerProfile] = useState<any>(null);

  // Wallet Access Integration
  const [walletAccess ,setWalletAccess] = useState<any>(null);
  const [linkedUserWalletTxns ,setLinkedUserWalletTxns] = useState<any[]>([]);

  React.useEffect(() => {
    const unsub = subscribeFirebaseDoc('settings', 'walletAccessControl', (data) => {
      setWalletAccess(data);
    });
    return () => unsub();
  }, []);

  const linkedUserIds = useMemo(() => {
    if (!walletAccess) return [];
    if (walletAccess.linkedUserIds && Array.isArray(walletAccess.linkedUserIds)) {
      return walletAccess.linkedUserIds;
    }
    return walletAccess.linkedUserId ? [walletAccess.linkedUserId] : [];
  }, [walletAccess]);

  const payBillTargetUserId = useMemo(() => {
    const targetPartner = partners.find(p => p.id === payPartnerId || String(p.userId) === String(payPartnerId));
    return targetPartner?.userId || user?.id;
  }, [partners ,payPartnerId ,user]);

  const hasWalletAccess = useMemo(() => {
    if (!payBillTargetUserId || linkedUserIds.length === 0) return false;
    return linkedUserIds.map(String).includes(String(payBillTargetUserId));
  }, [linkedUserIds ,payBillTargetUserId]);

  React.useEffect(() => {
    if (hasWalletAccess && payBillTargetUserId) {
      const targetUser = (globalUsers || []).find((u: any) => String(u.id) === String(payBillTargetUserId) || String(u.userId) === String(payBillTargetUserId))
        || (users || []).find((u: any) => String(u.id) === String(payBillTargetUserId) || String(u.userId) === String(payBillTargetUserId));
      const parentCol = targetUser?.role === 'ADMIN' ? 'admins' : 'users';
      const path = `${parentCol}/${payBillTargetUserId}/walletTransactions`;

      const unsub = subscribeFirebaseCollection(path, (data) => {
        setLinkedUserWalletTxns(data || []);
      });
      return () => unsub();
    } else {
      setLinkedUserWalletTxns([]);
    }
  }, [hasWalletAccess ,payBillTargetUserId ,globalUsers ,users]);

  const getWalletTxnSubPath = (userId: string) => {
    const targetUser = (globalUsers || []).find((u: any) => String(u.id) === String(userId) || String(u.userId) === String(userId))
      || (users || []).find((u: any) => String(u.id) === String(userId) || String(u.userId) === String(userId));
    const parentCol = targetUser?.role === 'ADMIN' ? 'admins' : 'users';
    return `${parentCol}/${targetUser?.id || userId}/walletTransactions`;
  };

  const linkedWalletBalance = useMemo(() => {
    const demoIds = ['PAY-W1' ,'PAY-W2' ,'PAY-W3' ,'PAY-W4' ,'PAY-W5' ,'PAY-W6' ,'PAY-W7'];
    const demoTxIds = ['TXN-840221' ,'TXN-840219' ,'TXN-840212' ,'TXN-840205' ,'TXN-840198' ,'TXN-PND-1042' ,'TXN-PND-1041'];
    const demoNotes = ["Salary deposit" ,"Office supplies" ,"Freelance project" ,"Vendor payment" ,"Bonus credit" ,"Project milestone" ,"Equipment purchase"];

    const nonDemo = linkedUserWalletTxns.filter((p: any) => {
      if (!p) return false;
      const note = p.details?.note || p.desc || '';
      const isDemo = (
        (p.id && demoIds.includes(p.id)) ||
        (p.transactionId && demoTxIds.includes(p.transactionId)) ||
        demoNotes.includes(note)
      );
      return !isDemo;
    });

    const approved = nonDemo.filter(p => p.status === 'RECEIVED');
    return approved.reduce((sum, p) => sum + (p.type === 'INCOME' ? p.amount : -p.amount), 0);
  }, [linkedUserWalletTxns]);

  const paymentMethodOptions = useMemo(() => {
    const methods = walletPaymentMethods && walletPaymentMethods.length > 0 
      ? walletPaymentMethods 
      : ['Cash' ,'Bank Transfer' ,'Card' ,'Mobile Banking'];
    
    const options = methods.map(method => {
      let label = method;
      if (method === 'Cash' && language === 'bn') label = 'ক্যাশ';
      else if (method === 'Bank Transfer' && language === 'bn') label = 'ব্যাংক ট্রান্সফার';
      else if (method === 'Card' && language === 'bn') label = 'কার্ড';
      else if (method === 'Mobile Banking' && language === 'bn') label = 'মোবাইল ব্যাংকিং';
      return {
        value: method
        ,label: label
      };
    });

    if (hasWalletAccess) {
      if (!methods.some(m => m.toLowerCase() === 'wallet')) {
        options.push({
          value: 'Wallet'
          ,label: language === 'bn' ? 'ওয়ালেট ব্যালেন্স' : 'Wallet Balance'
        });
      }
    }
    return options;
  }, [walletPaymentMethods ,hasWalletAccess ,language]);

  const bankCountryOptions = useMemo(() => {
    const list = countries || [];
    return list.map(c => ({
      value: c.name
      ,label: `${c.flag || ''} ${c.name}`.trim()
    }));
  }, [countries]);

  const selectedCountryCode = useMemo(() => {
    if (!bankCountry) return null;
    const list = countries || [];
    const countryObj = list.find(c => c.name === bankCountry);
    return countryObj ? countryObj.code : null;
  }, [countries ,bankCountry]);

  const bankNameOptions = useMemo(() => {
    const list = banks || [];
    const filtered = selectedCountryCode ? list.filter(b => b.countryCode === selectedCountryCode) : list;
    return filtered.map(b => ({
      value: b.name
      ,label: b.name
    }));
  }, [banks ,selectedCountryCode]);

  const selectedBankId = useMemo(() => {
    if (!bankName) return null;
    const list = banks || [];
    const bankObj = list.find(b => b.name === bankName && (selectedCountryCode ? b.countryCode === selectedCountryCode : true));
    return bankObj ? bankObj.id : null;
  }, [banks ,bankName ,selectedCountryCode]);

  const bankBranchOptions = useMemo(() => {
    const list = branches || [];
    const filtered = selectedBankId ? list.filter(b => b.bankId === selectedBankId) : list;
    return filtered.map(b => ({
      value: b.name
      ,label: b.name
    }));
  }, [branches ,selectedBankId]);

  const mobileProviderOptions = useMemo(() => [
    { value: 'bKash' ,label: 'bKash' }
    ,{ value: 'Nagad' ,label: 'Nagad' }
    ,{ value: 'Rocket' ,label: 'Rocket' }
    ,{ value: 'Upay' ,label: 'Upay' }
  ], []);

  const cardTypeOptions = useMemo(() => [
    { value: 'Visa' ,label: 'Visa' }
    ,{ value: 'MasterCard' ,label: 'MasterCard' }
    ,{ value: 'American Express' ,label: 'American Express' }
    ,{ value: 'UnionPay' ,label: 'UnionPay' }
  ], []);

  const getPurchaseSubPath = (purchaseUserId: string | null | undefined) => {
    const lookupId = purchaseUserId || user?.userId || user?.id;
    if (!lookupId) return 'purchases';
    
    // Find the actual user object to get their real Firestore ID (user.id) and role
    const targetUser = globalUsers.find(u => String(u.id) === String(lookupId) || String(u.userId) === String(lookupId))
      || (users || []).find(u => String(u.id) === String(lookupId) || String(u.userId) === String(lookupId));
    
    const finalId = targetUser ? targetUser.id : (user?.id || lookupId);
    const isTargetAdmin = targetUser ? targetUser.role === 'ADMIN' : (user?.role === 'ADMIN' && String(user?.id) === String(lookupId));
    
    const parentCol = isTargetAdmin ? 'admins' : 'users';
    return `${parentCol}/${finalId}/Purchase`;
  };

  const getMessPaymentSubPath = (paymentUserId: string | null | undefined) => {
    const lookupId = paymentUserId || user?.userId || user?.id;
    if (!lookupId) return 'messPayments';
    
    const targetUser = globalUsers.find(u => String(u.id) === String(lookupId) || String(u.userId) === String(lookupId))
      || (users || []).find(u => String(u.id) === String(lookupId) || String(u.userId) === String(lookupId));
    
    const finalId = targetUser ? targetUser.id : (user?.id || lookupId);
    const isTargetAdmin = targetUser ? targetUser.role === 'ADMIN' : (user?.role === 'ADMIN' && String(user?.id) === String(lookupId));
    
    const parentCol = isTargetAdmin ? 'admins' : 'users';
    return `${parentCol}/${finalId}/MessPayment`;
  };

  const currentUserPartner = useMemo(() => {
    return partners.find(p => String(p.userId) === String(user?.id) || String(p.userId) === String(user?.userId));
  }, [partners ,user]);

  const currentManagerId = isManager ? currentUserPartner?.id : currentUserPartner?.managerId;

  const accessiblePartners = useMemo(() => {
    if (isAdmin) {
      // For Admins: Main Total Partner section shows Managers and Unassigned Partners
      return partners.filter(p => {
        const isManagerAccount = p.accountType === 'MANAGER' || (p.partnerId && String(p.partnerId).startsWith('MGR-'));
        const isUnassigned = !p.managerId || p.managerId === 'null' || p.managerId === 'undefined' || p.managerId === '';
        return isManagerAccount || isUnassigned;
      });
    }

    // For Managers AND normal partners linked to a manager:
    if (currentManagerId) {
      return partners.filter(p => 
        p.managerId === currentManagerId || 
        p.id === currentManagerId ||
        String(p.userId) === String(user?.id)
      );
    }

    // Fallback for unlinked normal partner
    return partners.filter(p => String(p.userId) === String(user?.id) || String(p.userId) === String(user?.userId));
  }, [partners ,isAdmin ,currentManagerId ,user]);

  const myAssignedPartnerUserIds = useMemo(() => {
    const ids = new Set<string>();
    
    // 1. From accessiblePartners
    accessiblePartners.forEach(p => {
      if (p.userId) ids.add(String(p.userId));
    });
    
    // 2. From globalUsers and users if they are assigned to this manager
    if (currentManagerId) {
      globalUsers.forEach(u => {
        if (String(u.managerId) === String(currentManagerId)) {
          if (u.id) ids.add(String(u.id));
          if (u.userId) ids.add(String(u.userId));
        }
      });
      if (users && Array.isArray(users)) {
        users.forEach(u => {
          if (String(u.managerId) === String(currentManagerId)) {
            if (u.id) ids.add(String(u.id));
            if (u.userId) ids.add(String(u.userId));
          }
        });
      }
    }
    
    return Array.from(ids);
  }, [accessiblePartners ,currentManagerId ,globalUsers ,users]);

  const accessiblePurchases = useMemo(() => {
    if (isAdmin) return purchases;
    
    // Both Managers and Partners use the same visibility logic now based on accessiblePartners
    return purchases.filter(p => 
      p.userId && (
        myAssignedPartnerUserIds.includes(String(p.userId)) || 
        String(p.userId) === String(user?.id) ||
        String(p.userId) === String(user?.userId) ||
        globalUsers.some(u => 
          (String(u.id) === String(p.userId) || String(u.userId) === String(p.userId)) && 
          (myAssignedPartnerUserIds.includes(String(u.id)) || myAssignedPartnerUserIds.includes(String(u.userId)))
        )
      )
    );
  }, [purchases ,isAdmin ,myAssignedPartnerUserIds ,user ,globalUsers]);

  const accessibleMessPayments = useMemo(() => {
    if (isAdmin) return messPayments;
    
    return messPayments.filter(p => 
      p.userId && (
        myAssignedPartnerUserIds.includes(String(p.userId)) || 
        String(p.userId) === String(user?.id) ||
        String(p.userId) === String(user?.userId) ||
        globalUsers.some(u => 
          (String(u.id) === String(p.userId) || String(u.userId) === String(p.userId)) && 
          (myAssignedPartnerUserIds.includes(String(u.id)) || myAssignedPartnerUserIds.includes(String(u.userId)))
        )
      )
    );
  }, [messPayments ,isAdmin ,myAssignedPartnerUserIds ,user ,globalUsers]);

  React.useEffect(() => {
    const unsubscribePartners = subscribeFirebaseCollection('partners', (data) => setPartners(data));
    const unsubscribePurchases = subscribeFirebaseCollectionGroup('Purchase', (data) => setPurchases(data));
    const unsubscribeItems = subscribeFirebaseCollection('items', (data) => setGlobalItems(data));
    const unsubscribeUsers = subscribeFirebaseCollection('users', (data) => setGlobalUsers(data));
    const unsubscribeMessPayments = subscribeFirebaseCollectionGroup('MessPayment', (data) => setMessPayments(data));
    const unsubscribeHypermarkets = subscribeFirebaseCollection('hypermarkets', (data) => setHypermarkets(data));
    return () => {
      unsubscribePartners();
      unsubscribePurchases();
      unsubscribeItems();
      unsubscribeUsers();
      unsubscribeMessPayments();
      unsubscribeHypermarkets();
    };
  }, []);

  const combinedHistory = useMemo(() => {
    const approvedPurchases = accessiblePurchases.filter(p => {
      if ((p.status !== 'approved' && p.status) || !p.date) return false;
      const [year ,month] = p.date.split('-');
      const monthMatch = selectedMonth === 'ALL' ? true : parseInt(month ,10) === selectedMonth;
      const yearMatch = selectedYear === 'ALL' ? true : parseInt(year ,10) === selectedYear;
      return monthMatch && yearMatch;
    }).map(p => ({ ...p ,type: 'PURCHASE' }));

    const approvedPayments = accessibleMessPayments.filter(p => {
      if (!p.date) return false;
      const [year ,month] = p.date.split('-');
      const isApproved = p.status === 'approved' || !p.status;
      const monthMatch = selectedMonth === 'ALL' ? true : parseInt(month ,10) === selectedMonth;
      const yearMatch = selectedYear === 'ALL' ? true : parseInt(year ,10) === selectedYear;
      return isApproved && monthMatch && yearMatch;
    }).map(p => ({ ...p ,type: 'BILL_PAYMENT' }));

    const combined = [...approvedPurchases ,...approvedPayments];
    combined.sort((a: any ,b: any) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      const timeA = a.time || '00:00:00';
      const timeB = b.time || '00:00:00';
      return timeB.localeCompare(timeA);
    });

    return combined;
  }, [accessiblePurchases ,accessibleMessPayments ,selectedMonth ,selectedYear]);

  const combinedPending = useMemo(() => {
    const pendingPurchases = accessiblePurchases.filter(p => p.status === 'pending')
      .map(p => ({ ...p ,type: 'PURCHASE' }));

    const pendingPayments = accessibleMessPayments.filter(p => p.status === 'pending')
      .map(p => ({ ...p ,type: 'BILL_PAYMENT' }));

    const combined = [...pendingPurchases ,...pendingPayments];
    combined.sort((a: any ,b: any) => {
      const dateCompare = (b.date || '').localeCompare(a.date || '');
      if (dateCompare !== 0) return dateCompare;
      const timeA = a.time || '00:00:00';
      const timeB = b.time || '00:00:00';
      return timeB.localeCompare(timeA);
    });

    return combined;
  }, [accessiblePurchases ,accessibleMessPayments]);

  React.useEffect(() => {
    if (globalUsers.length > 0) {
      const partnersToFix = globalUsers.filter(u => u.role === 'PARTNER');
      partnersToFix.forEach(async (u) => {
        try {
          await saveFirebaseDoc('users' ,u.id ,{ role: 'USER' });
          console.log(`Auto-migrated partner user ${u.name} role back to USER`);
        } catch (e) {
          console.error(`Failed to migrate user ${u.id}:` ,e);
        }
      });
    }
  }, [globalUsers]);

  React.useEffect(() => {
    if (isPartnerProfileModalOpen) {
      window.dispatchEvent(new CustomEvent('change-title' ,{ detail: 'Partner Profile' }));
      const handleBack = () => setIsPartnerProfileModalOpen(false);
      window.addEventListener('close-permissions-overlay' ,handleBack);
      return () => {
        window.removeEventListener('close-permissions-overlay' ,handleBack);
        window.dispatchEvent(new CustomEvent('change-title' ,{ detail: isPartnerListModalOpen || isAdmin ? 'Purchase' : null }));
      };
    } else if (isPartnerListModalOpen || isAdmin) {
      window.dispatchEvent(new CustomEvent('change-title' ,{ detail: 'Purchase' }));
      const handleBack = () => {
        if (isAdmin && !isPartnerListModalOpen) {
          goBack();
        } else {
          setIsPartnerListModalOpen(false);
        }
      };
      window.addEventListener('close-permissions-overlay' ,handleBack);
      return () => {
        window.removeEventListener('close-permissions-overlay' ,handleBack);
        window.dispatchEvent(new CustomEvent('change-title' ,{ detail: null }));
      };
    } else {
      window.dispatchEvent(new CustomEvent('change-title' ,{ detail: null }));
    }
  }, [isPartnerListModalOpen ,isPartnerProfileModalOpen ,isAdmin ,isManager]);

  const handleDownloadStatement = async () => {
    try {
      const doc = new jsPDF();
      
      const filteredPurchases = accessiblePurchases.filter(p => {
        if (p.status !== 'approved' && p.status) return false;
        if (!p.date) return false;
        const [year ,month] = p.date.split('-');
        return parseInt(month ,10) === downloadMonth && parseInt(year ,10) === downloadYear;
      });

      if (filteredPurchases.length === 0) {
        showFeedback('No approved purchases found for selected month.' ,'error');
        return;
      }

      let fontLoaded = false;
      const fontUrls = [
        "https://cdn.jsdelivr.net/gh/maateen/Siyam-Rupali@master/SiyamRupali.ttf"
        ,"https://cdn.jsdelivr.net/gh/maateen/solaimanlipi@master/solaimanlipi.ttf"
        ,"https://raw.githubusercontent.com/maateen/Siyam-Rupali/master/SiyamRupali.ttf"
        ,"https://raw.githubusercontent.com/maateen/solaimanlipi/master/solaimanlipi.ttf"
        ,"https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansbengali/static/NotoSansBengali-Regular.ttf"
        ,"https://raw.githubusercontent.com/google/fonts/main/ofl/notosansbengali/static/NotoSansBengali-Regular.ttf"
      ];

      for (const url of fontUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            let binary = "";
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Font = window.btoa(binary);
            doc.addFileToVFS("NotoSansBengali-Regular.ttf" ,base64Font);
            doc.addFont("NotoSansBengali-Regular.ttf" ,"NotoSansBengali" ,"normal");
            doc.addFont("NotoSansBengali-Regular.ttf" ,"NotoSansBengali" ,"bold");
            doc.addFont("NotoSansBengali-Regular.ttf" ,"NotoSansBengali" ,"italic");
            doc.addFont("NotoSansBengali-Regular.ttf" ,"NotoSansBengali" ,"bolditalic");
            fontLoaded = true;
            break;
          }
        } catch (e) {
          console.error(`Failed to load Noto Sans Bengali font from ${url}:` ,e);
        }
      }

      // Professional Marketing Style PDF Header
      doc.setFillColor(79 ,70 ,229); // Indigo 600
      doc.rect(0 ,0 ,210 ,40 ,'F');
      
      doc.setTextColor(255 ,255 ,255);
      doc.setFont("helvetica" ,"bold");
      doc.setFontSize(24);
      doc.text("PURCHASE STATEMENT" ,15 ,25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica" ,"normal");
      const monthName = new Date(downloadYear ,downloadMonth - 1).toLocaleString('default' ,{ month: 'long' });
      doc.text(`Period: ${monthName} ${downloadYear}` ,15 ,33);

      let allItems: any[] = [];
      filteredPurchases.forEach(p => {
        if (p.items && Array.isArray(p.items)) {
          p.items.forEach((item: any) => {
            allItems.push({
              date: p.date
              ,name: item.name
              ,quantity: `${item.quantity} ${item.unit || ''}`.trim()
              ,price: item.price
              ,amount: item.total
            });
          });
        }
      });

      const tableData = allItems.map((item, i) => [
        item.date
        ,item.name
        ,item.quantity
        `${item.price} QAR`
        `${item.amount} QAR`
      ]);

      const totalAmount = allItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      autoTable(doc ,{
        startY: 50
        ,head: [['Date' ,'Item Name' ,'Quantity' ,'Price' ,'Amount']]
        ,body: tableData
        ,theme: 'grid'
        ,headStyles: { fillColor: [79 ,70 ,229] ,textColor: 255 ,fontStyle: 'bold' ,font: 'helvetica' }
        ,styles: { fontSize: 10 ,cellPadding: 5 ,font: 'helvetica' }
        ,alternateRowStyles: { fillColor: [249 ,250 ,251] }
        ,didParseCell: function(data) {
          if (data.cell.text) {
            const cellTextStr = Array.isArray(data.cell.text) 
              ? data.cell.text.join(' ') 
              : String(data.cell.text);
            if (/[\u0980-\u09FF]/.test(cellTextStr)) {
              data.cell.styles.font = fontLoaded ? 'NotoSansBengali' : 'helvetica';
            }
          }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("helvetica" ,"bold");
      doc.setFontSize(14);
      doc.setTextColor(50 ,50 ,50);
      doc.text(`Total Monthly Purchase: ${totalAmount.toFixed(2)} QAR` ,15 ,finalY);

      doc.setFontSize(10);
      doc.setFont("helvetica" ,"normal");
      doc.setTextColor(150 ,150 ,150);
      doc.text(`Generated on ${new Date().toLocaleString()}` ,15 ,finalY + 15);

      const pdfBase64 = doc.output('datauristring');
      
      const fileName = `Statement_${monthName}_${downloadYear}.pdf`;
      await downloadPdf(doc, fileName, showFeedback, language);
      setIsDownloadModalOpen(false);
    } catch (error) {
      console.error('Error generating PDF:' ,error);
      showFeedback('Failed to generate statement.' ,'error');
    }
  };

  const handleDownloadInvoice = async (purchase: any) => {
    try {
      const doc = new jsPDF();
      const userObj = globalUsers.find(u => u.userId === purchase.userId || u.id === purchase.userId);
      const userName = userObj?.name || 'Unknown User';

      let fontLoaded = false;
      const fontUrls = [
        "https://cdn.jsdelivr.net/gh/maateen/Siyam-Rupali@master/SiyamRupali.ttf"
        ,"https://cdn.jsdelivr.net/gh/maateen/solaimanlipi@master/solaimanlipi.ttf"
        ,"https://raw.githubusercontent.com/maateen/Siyam-Rupali/master/SiyamRupali.ttf"
        ,"https://raw.githubusercontent.com/maateen/solaimanlipi/master/solaimanlipi.ttf"
        ,"https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansbengali/static/NotoSansBengali-Regular.ttf"
        ,"https://raw.githubusercontent.com/google/fonts/main/ofl/notosansbengali/static/NotoSansBengali-Regular.ttf"
      ];

      for (const url of fontUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            let binary = "";
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Font = window.btoa(binary);
            doc.addFileToVFS("NotoSansBengali-Regular.ttf" ,base64Font);
            doc.addFont("NotoSansBengali-Regular.ttf" ,"NotoSansBengali" ,"normal");
            doc.addFont("NotoSansBengali-Regular.ttf" ,"NotoSansBengali" ,"bold");
            doc.addFont("NotoSansBengali-Regular.ttf" ,"NotoSansBengali" ,"italic");
            doc.addFont("NotoSansBengali-Regular.ttf" ,"NotoSansBengali" ,"bolditalic");
            fontLoaded = true;
            break;
          }
        } catch (e) {
          console.error(`Failed to load Noto Sans Bengali font from ${url}:` ,e);
        }
      }

      // Professional Marketing Style PDF Header
      doc.setFillColor(79 ,70 ,229); // Indigo 600
      doc.rect(0 ,0 ,210 ,40 ,'F');
      
      doc.setTextColor(255 ,255 ,255);
      doc.setFont("helvetica" ,"bold");
      doc.setFontSize(24);
      doc.text("PURCHASE INVOICE" ,15 ,25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica" ,"normal");
      doc.text(`ID: ${purchase.id}` ,15 ,33);

      doc.setTextColor(50 ,50 ,50);
      doc.setFontSize(12);
      doc.setFont("helvetica" ,"bold");
      doc.text("Hypermarket Details" ,15 ,55);

      // Helper to set font based on text content (fallback mechanism)
      const setFontSafe = (style: 'normal' | 'bold' | 'italic' | 'bolditalic' ,text: string) => {
        const containsBengali = /[\u0980-\u09FF]/.test(text);
        if (containsBengali && fontLoaded) {
          doc.setFont("NotoSansBengali" ,style);
        } else {
          doc.setFont("helvetica" ,style);
        }
      };

      setFontSafe("normal" ,purchase.hypermarketName || 'N/A');
      doc.setFontSize(10);
      doc.text(`Name: ${purchase.hypermarketName || 'N/A'}` ,15 ,62);
      doc.text(`Date: ${purchase.date || 'N/A'}` ,15 ,68);
      doc.text(`Time: ${purchase.time || 'N/A'}` ,15 ,74);

      doc.setFontSize(12);
      doc.setFont("helvetica" ,"bold");
      doc.text("Submitter Information" ,110 ,55);
      
      setFontSafe("normal" ,userName);
      doc.setFontSize(10);
      doc.text(`Name: ${userName}` ,110 ,62);
      doc.text(`User ID: ${userObj?.userId || userObj?.id || 'N/A'}` ,110 ,68);
      const subTime = new Date(purchase.createdAt).toLocaleString();
      doc.text(`Submitted: ${subTime}` ,110 ,74);

      const tableData = purchase.items.map((item: any ,i: number) => [
        (i + 1).toString()
        ,item.name
        `${item.price} QAR`
        `${item.quantity} ${item.unit}`
        `${item.total} QAR`
      ]);

      autoTable(doc ,{
        startY: 90
        ,head: [['#' ,'Item Name' ,'Price' ,'Qty/Unit' ,'Total']]
        ,body: tableData
        ,theme: 'grid'
        ,headStyles: { fillColor: [79 ,70 ,229] ,textColor: 255 ,fontStyle: 'bold' ,font: 'helvetica' }
        ,styles: { fontSize: 10 ,cellPadding: 5 ,font: 'helvetica' }
        ,alternateRowStyles: { fillColor: [249 ,250 ,251] }
        ,didParseCell: function(data) {
          if (data.cell.text) {
            const cellTextStr = Array.isArray(data.cell.text) 
              ? data.cell.text.join(' ') 
              : String(data.cell.text);
            if (/[\u0980-\u09FF]/.test(cellTextStr)) {
              data.cell.styles.font = fontLoaded ? 'NotoSansBengali' : 'helvetica';
            }
          }
        }
      });

      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFont("helvetica" ,"bold");
      doc.setFontSize(12);
      doc.text(`Total Amount: QAR ${purchase.amount}` ,15 ,finalY);

      doc.setFont("helvetica" ,"italic");
      doc.setFontSize(9);
      doc.setTextColor(150 ,150 ,150);
      doc.text("Thank you for your business." ,105 ,finalY + 20 ,{ align: 'center' });

      // Save/Share logic
const fileName = `Invoice_${purchase.id}.pdf`;
      await downloadPdf(doc, fileName, showFeedback, language);
    } catch (error) {
      console.error("PDF generation failed:" ,error);
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!hypermarketName) {
      showFeedback('Please enter hypermarket name' ,'error');
      return;
    }
    if (purchaseItems.length === 0) {
      showFeedback('Please add at least one item' ,'error');
      return;
    }

    const totalAmount = purchaseItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

    let finalReceipt = receiptImage || localStorage.getItem('temp_scanned_receipt') || null;
    if (finalReceipt) {
      try {
        finalReceipt = await compressReceiptImage(finalReceipt);
      } catch (compressErr) {
        console.warn('Receipt compression during submit fallback:', compressErr);
      }
    }

    const purchaseId = editingPurchaseId || `PURCHASE-${Date.now()}`;
    const purchaseData = {
      id: purchaseId
      ,userId: editingPurchaseId ? (selectedPendingPurchase?.userId || user?.userId || user?.id) : (user?.userId || user?.id)
      ,hypermarketName
      ,date: purchaseDate
      ,time: editingPurchaseId ? (selectedPendingPurchase?.time || purchaseTime) : purchaseTime
      ,items: purchaseItems
      ,amount: totalAmount
      ,status: (user?.role === 'ADMIN' || user?.role === 'MANAGER') ? 'approved' : (editingPurchaseId ? (selectedPendingPurchase?.status || 'pending') : 'pending')
      ,createdAt: editingPurchaseId ? selectedPendingPurchase?.createdAt : Date.now()
      ,receipt: finalReceipt
    };

    try {
      await saveFirebaseDoc(getPurchaseSubPath(purchaseData.userId) ,purchaseData.id ,purchaseData);
      
      // Clear local storage copy of scanned receipt upon successful submission
      localStorage.removeItem('temp_scanned_receipt');
      
      // Notify admins if submitted by a normal user and it's not an edit
      if (user?.role !== 'ADMIN' && user?.role !== 'MANAGER' && !editingPurchaseId) {
        const adminUsers = globalUsers.filter((u: any) => u.role === 'ADMIN');
        adminUsers.forEach(admin => {
          const notifId = `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2 ,5)}`;
          saveFirebaseDoc(`admins/${admin.id}/notifications` ,notifId ,{
            id: notifId
            ,title: 'New Purchase Submitted'
            ,message: `${user?.name || 'A user'} has submitted a new purchase for QAR ${totalAmount.toFixed(2)}.`
            ,type: 'INFO'
            ,timestamp: new Date().toISOString()
            ,isRead: false
          });
        });
      }

      showFeedback((user?.role === 'ADMIN' || user?.role === 'MANAGER') ? 'Purchase automatically approved!' : 'Purchase submitted for approval!' ,'success');
      setView('PURCHASE');
      setEditingPurchaseId(null);
      setHypermarketName('');
      setPurchaseItems([]);
      setReceiptImage(null);
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setPurchaseTime(() => {
        const d = new Date();
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      });
    } catch (e) {
      showFeedback('Failed to submit purchase' ,'error');
    }
  };

  const handleAddItem = () => {
    setPurchaseItems([
      ...purchaseItems 
      ,{ id: Date.now().toString() ,name: '' ,price: '' ,quantity: '1' ,unit: 'Piece' ,total: 0 }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setPurchaseItems(purchaseItems.filter(item => item.id !== id));
  };

  const handleItemChange = (index: number ,field: string ,value: any) => {
    const updatedItems = [...purchaseItems];
    updatedItems[index] = { ...updatedItems[index] , [field]: value };
    
    // Auto calculate total
    if (['price' ,'quantity' ,'unit'].includes(field)) {
      const price = parseFloat(updatedItems[index].price) || 0;
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const unit = updatedItems[index].unit;
      
      let total = 0;
      if (unit.toLowerCase() === 'gram') {
        total = (price * qty) / 1000;
      } else {
        total = price * qty;
      }
      updatedItems[index].total = Number(total.toFixed(2));
    }
    
    setPurchaseItems(updatedItems);
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsActionSheetOpen(false);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    showFeedback('Scanning receipt...' ,'info');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawBase64 = reader.result as string;
          let base64Image = rawBase64;
          try {
            // Compress immediately so it stays comfortably within Firestore & localStorage limits (< 150KB)
            base64Image = await compressReceiptImage(rawBase64);
          } catch (compressErr) {
            console.warn('Initial receipt compression error:', compressErr);
          }
          setReceiptImage(base64Image);
          try {
            localStorage.setItem('temp_scanned_receipt', base64Image);
          } catch (storageErr) {
            console.warn('LocalStorage save warning:', storageErr);
          }

          const response = await fetch('/api/purchase-ocr' ,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'OCR failed');
          }
          const data = await response.json();

          if (data.hypermarketName) {
            const name = data.hypermarketName.trim();
            setHypermarketName(name);

            // Save the extracted hypermarket name automatically and prevent duplicates using unique normalized document ID
            const shopId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            if (shopId) {
              saveFirebaseDoc('hypermarkets' ,shopId ,{ id: shopId ,name: name });
            }
          }

          if (data.date) {
            setPurchaseDate(data.date);
          }
          if (data.time) {
            setPurchaseTime(data.time);
          }
          
          if (data.items && data.items.length > 0) {
            const newItems = data.items.map((item: any ,idx: number) => {
              // Use pricePerUnit (calculated on server) or fall back to price
              const price = parseFloat(item.pricePerUnit) || parseFloat(item.price) || 0;
              const qty = parseFloat(item.quantity) || 1;
              const unit = item.unit || 'Piece';
              // Use totalAmount (actual cost paid) or fall back to calculation
              const total = parseFloat(item.totalAmount) || (price * qty);

              if (item.name) {
                const existingItem = globalItems.find(g => g.name.toLowerCase() === item.name.toLowerCase());
                if (!existingItem) {
                  const newItemId = `ITEM-${Date.now()}-${idx}`;
                  saveFirebaseDoc('items' ,newItemId ,{ id: newItemId ,name: item.name });
                }
              }

              return {
                id: Date.now().toString() + idx
                ,name: item.name || ''
                ,price: price.toFixed(2)
                ,quantity: qty.toString()
                ,unit: unit
                ,total: Number(total.toFixed(2))
              };
            });
            setPurchaseItems(prev => [...prev ,...newItems]);
          }
          showFeedback('Receipt scanned successfully!' ,'success');
        } catch (err: any) {
          console.error(err);
          const errorMsg = err?.message || 'Failed to scan receipt';
          showFeedback(errorMsg, 'error');
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err?.message || 'Failed to scan receipt';
      showFeedback(errorMsg, 'error');
      setIsScanning(false);
    }
  };
  const handleTogglePartnerStatus = async () => {
    if (!selectedPartnerProfile) return;
    const currentStatus = selectedPartnerProfile.status || 'active';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await saveFirebaseDoc('partners' ,selectedPartnerProfile.id ,{
        ...selectedPartnerProfile
        ,status: newStatus
      });
      setSelectedPartnerProfile({ ...selectedPartnerProfile ,status: newStatus });
      showFeedback(`Partner is now ${newStatus}` ,'success');
    } catch (error) {
      showFeedback('Failed to update status' ,'error');
    }
  };

  const handleDeletePartner = async () => {
    if (!selectedPartnerProfile) return;
    confirmAction(
      language === 'bn' 
        ? 'আপনি কি নিশ্চিত যে আপনি এই অ্যাকাউন্টটি মুছে ফেলতে চান?' 
        : 'Are you sure you want to delete this account?'
      ,async () => {
        try {
          await deleteFirebaseDoc('partners' ,selectedPartnerProfile.id);
          showFeedback(language === 'bn' ? 'অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে' : 'Partner deleted successfully' ,'success');
          setIsPartnerProfileModalOpen(false);
        } catch (error) {
          showFeedback(language === 'bn' ? 'অ্যাকাউন্ট মুছতে ব্যর্থ হয়েছে' : 'Failed to delete partner' ,'error');
        }
      }
    );
  };

  const handleDeletePurchase = (purchase: any) => {
    confirmAction(
      language === 'bn' 
        ? 'আপনি কি নিশ্চিত যে আপনি এই ট্রানজেকশন হিস্ট্রিটি মুছে ফেলতে চান?' 
        : 'Are you sure you want to delete this purchase transaction?'
      ,async () => {
        try {
          await deleteFirebaseDoc(getPurchaseSubPath(purchase.userId) ,purchase.id);
          showFeedback(
            language === 'bn' 
              ? 'ট্রানজেকশনটি সফলভাবে মুছে ফেলা হয়েছে' 
              : 'Transaction deleted successfully' 
            ,'success'
          );
        } catch (error) {
          showFeedback(
            language === 'bn' 
              ? 'ট্রানজেকশনটি মুছতে ব্যর্থ হয়েছে' 
              : 'Failed to delete transaction' 
            ,'error'
          );
        }
      }
    );
  };

  const handleClosePartnerForm = () => {
    setIsPartnerFormOpen(false);
    setEditingPartnerId(null);
    setFormMonthlySalary('');
    setFormPrice('');
    setFormAccountType('PARTNER');
  };

  const handlePartnerSubmit = async () => {
    if (!selectedUser) return;
    
    const existingPartner = editingPartnerId ? partners.find(p => p.id === editingPartnerId) : null;
    let generatedPartnerId = existingPartner?.partnerId;
    
    if (formAccountType === 'MANAGER' && existingPartner?.accountType !== 'MANAGER') {
      generatedPartnerId = `MGR-${Math.floor(1000000 + Math.random() * 9000000)}`;
    } else if (formAccountType === 'PARTNER' && existingPartner?.accountType !== 'PARTNER') {
      generatedPartnerId = String(Math.floor(1000000 + Math.random() * 9000000));
    } else if (!generatedPartnerId) {
      generatedPartnerId = formAccountType === 'MANAGER' ? `MGR-${Math.floor(1000000 + Math.random() * 9000000)}` : String(Math.floor(1000000 + Math.random() * 9000000));
    }
    
    const partnerData = {
      id: editingPartnerId || `PARTNER-${Date.now()}`
      ,partnerId: generatedPartnerId
      ,userId: selectedUser.id
      ,name: formName
      ,mobile: formMobile
      ,dob: formDob
      ,nationality: formNationality
      ,country: formCountry
      ,stateNumber: formStateNumber
      ,zoneNumber: formZoneNumber
      ,buildingNumber: formBuildingNumber
      ,electricityNumber: formElectricityNumber
      ,areaName: formAreaName
      ,monthlySalary: formMonthlySalary
      ,price: formPrice
      ,joiningDate: currentDate
      ,joiningTime: currentTime
      ,createdAt: Date.now()
      ,avatar: selectedUser.avatar || null
      ,accountType: formAccountType
      ,managerId: existingPartner?.managerId || (isManager ? (currentManagerId || user?.id || '') : (selectedUser.managerId || ''))
    };

    try {
      await saveFirebaseDoc('partners' ,partnerData.id ,partnerData);
      // Update associated user's role and managerId in the database
      await saveFirebaseDoc('users' ,selectedUser.id ,{
        role: formAccountType === 'MANAGER' ? 'MANAGER' : 'USER',
        managerId: partnerData.managerId || selectedUser.managerId || ''
      });
      showFeedback('Partner saved successfully!' ,'success');
      handleClosePartnerForm();
    } catch (e) {
      showFeedback('Failed to save partner' ,'error');
    }
  };

  const totalPurchaseAmount = useMemo(() => {
    const total = accessiblePurchases
      .filter(p => {
        if (p.status !== 'approved' && p.status) return false;
        if (!p.date) return false;
        const [year ,month] = p.date.split('-');
        const monthMatch = selectedMonth === 'ALL' ? true : parseInt(month ,10) === selectedMonth;
        const yearMatch = selectedYear === 'ALL' ? true : parseInt(year ,10) === selectedYear;
        return monthMatch && yearMatch;
      })
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    return total.toFixed(2);
  }, [accessiblePurchases ,selectedMonth ,selectedYear]);

  const selectedPayPartnerObj = useMemo(() => {
    return partners.find(p => p.id === payPartnerId || String(p.userId) === String(payPartnerId));
  }, [partners ,payPartnerId]);

  const selectedPayPartnerBalance = useMemo(() => {
    if (!selectedPayPartnerObj) return 0;
    const partnerUser = globalUsers.find(u => String(u.id) === String(selectedPayPartnerObj.userId));
    
    // Purchases
    const partnerPurchases = accessiblePurchases.filter(p => {
      const pId = String(p.userId);
      const matchId = pId === String(selectedPayPartnerObj.userId) || pId === String(partnerUser?.userId) || pId === String(partnerUser?.id);
      const matchStatus = p.status === 'approved' || !p.status;
      return matchId && matchStatus;
    });
    const partnerTotalPurchases = partnerPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    // Payments
    const partnerPayments = messPayments.filter(py => {
      const pyId = String(py.userId);
      const matchId = pyId === String(selectedPayPartnerObj.userId) || pyId === String(partnerUser?.userId) || pyId === String(partnerUser?.id);
      const matchStatus = py.status === 'approved' || !py.status;
      return matchId && matchStatus;
    });
    const partnerTotalPayments = partnerPayments.reduce((sum, py) => sum + (Number(py.amount) || 0), 0);

    const averagePerPartner = accessiblePartners.length > 0 ? Number(totalPurchaseAmount) / accessiblePartners.length : 0;
    const balance = (partnerTotalPurchases + partnerTotalPayments) - averagePerPartner;
    return balance;
  }, [selectedPayPartnerObj ,globalUsers ,accessiblePurchases ,messPayments ,accessiblePartners ,totalPurchaseAmount]);

  const handleOpenPayBill = () => {
    setIsFabMenuOpen(false);
    if (currentUserPartner) {
      setPayPartnerId(currentUserPartner.id);
    } else if (accessiblePartners.length > 0) {
      setPayPartnerId(accessiblePartners[0].id);
    } else {
      setPayPartnerId('');
    }
    setPayAmount('');
    setPayTxnId('');
    setPayRemarks('');
    setPayMethod('Cash');
    setPayDate(new Date().toISOString().split('T')[0]);
    
    // Reset bank and other payment options fields
    setBankCountry('');
    setBankName('');
    setBankBranch('');
    setBankAccountTitle('');
    setBankAccountNumber('');
    setMobileProvider('bKash');
    setMobileSenderNumber('');
    setMobileTxnId('');
    setCardType('Visa');
    setCardHolderName('');
    setCardLastFour('');
    setShowThirdPartyAlert(false);

    setIsPayBillOpen(true);
  };

  const handlePayBillSubmit = async () => {
    const amt = parseFloat(payAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      showFeedback(t('ENTER_VALID_AMOUNT') ,'error');
      return;
    }
    if (!payPartnerId) {
      showFeedback('Please select a partner' ,'error');
      return;
    }

    const targetPartner = partners.find(p => p.id === payPartnerId || String(p.userId) === String(payPartnerId));
    const targetUserId = targetPartner?.userId || user?.id;

    // Payment Method Specific Validations
    if (payMethod === 'Bank Transfer') {
      if (!bankCountry) {
        showFeedback(language === 'bn' ? 'দয়া করে দেশ সিলেক্ট করুন' : 'Please select country' ,'error');
        return;
      }
      if (!bankName) {
        showFeedback(language === 'bn' ? 'দয়া করে ব্যাংক সিলেক্ট করুন' : 'Please select bank' ,'error');
        return;
      }
      if (!bankBranch) {
        showFeedback(language === 'bn' ? 'দয়া করে ব্রাঞ্চ সিলেক্ট করুন' : 'Please select branch' ,'error');
        return;
      }
      if (!bankAccountTitle.trim()) {
        showFeedback(language === 'bn' ? 'দয়া করে অ্যাকাউন্ট টাইটেল লিখুন' : 'Please enter bank account title' ,'error');
        return;
      }
      if (!bankAccountNumber.trim()) {
        showFeedback(language === 'bn' ? 'দয়া করে অ্যাকাউন্ট নাম্বার লিখুন' : 'Please enter bank account number' ,'error');
        return;
      }

      // Check if account title matches selected user's name
      const targetName = (targetPartner?.name || user?.name || '').trim().toLowerCase();
      const enteredTitle = bankAccountTitle.trim().toLowerCase();
      if (enteredTitle !== targetName) {
        setShowThirdPartyAlert(true);
        return;
      }
    } else if (payMethod === 'Mobile Banking') {
      if (!mobileProvider) {
        showFeedback('Please select mobile banking provider' ,'error');
        return;
      }
      if (!mobileSenderNumber.trim()) {
        showFeedback(language === 'bn' ? 'দয়া করে সেন্ডার নাম্বার লিখুন' : 'Please enter sender number' ,'error');
        return;
      }
      if (!mobileTxnId.trim()) {
        showFeedback(language === 'bn' ? 'দয়া করে ট্রানজেকশন আইডি লিখুন' : 'Please enter transaction ID' ,'error');
        return;
      }
    } else if (payMethod === 'Card') {
      if (!cardType) {
        showFeedback('Please select card type' ,'error');
        return;
      }
      if (!cardHolderName.trim()) {
        showFeedback(language === 'bn' ? 'দয়া করে কার্ড হোল্ডার নেম লিখুন' : 'Please enter cardholder name' ,'error');
        return;
      }
      if (!cardLastFour.trim() || cardLastFour.trim().length !== 4) {
        showFeedback(language === 'bn' ? 'দয়া করে কার্ডের শেষ ৪ টি সংখ্যা লিখুন' : 'Please enter card last 4 digits (4 digits)' ,'error');
        return;
      }
    } else if (payMethod === 'Wallet') {
      if (!hasWalletAccess) {
        showFeedback(language === 'bn' ? 'এই ইউজারের ওয়ালেট সিস্টেম এক্সেস নেই!' : 'This user does not have wallet system access!' ,'error');
        return;
      }
      if (amt > linkedWalletBalance) {
        showFeedback(language === 'bn' ? 'ওয়ালেটে পর্যাপ্ত এভেলেবেল ব্যালেন্স নেই!' : 'Insufficient wallet available balance!' ,'error');
        return;
      }
    }

    const generatedTxnId = `TXN-${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedDate = new Date().toISOString().split('T')[0];
    const generatedTime = new Date().toLocaleTimeString('en-US' ,{ hour12: false });
    const autoStatus = (user?.role === 'ADMIN' || user?.role === 'MANAGER') ? 'approved' : 'pending';

    const paymentData = {
      id: `PAY-${Date.now()}`
      ,userId: targetUserId
      ,partnerId: targetPartner?.partnerId || ''
      ,amount: amt
      ,method: payMethod
      ,transactionId: generatedTxnId
      ,date: generatedDate
      ,time: generatedTime
      ,remarks: payRemarks
      ,status: autoStatus
      ,createdAt: Date.now()
      ,bankDetails: payMethod === 'Bank Transfer' ? {
        country: bankCountry
        ,bankName: bankName
        ,branch: bankBranch
        ,accountTitle: bankAccountTitle
        ,accountNumber: bankAccountNumber
      } : null
      ,mobileDetails: payMethod === 'Mobile Banking' ? {
        provider: mobileProvider
        ,senderNumber: mobileSenderNumber
        ,txnId: mobileTxnId
      } : null
      ,cardDetails: payMethod === 'Card' ? {
        cardType: cardType
        ,cardHolderName: cardHolderName
        ,cardLastFour: cardLastFour
      } : null
    };

    try {
      const subPath = getMessPaymentSubPath(targetUserId);
      await saveFirebaseDoc(subPath ,paymentData.id ,paymentData);

      if (payMethod === 'Wallet') {
        try {
          const walletTxnId = `WTXN-${paymentData.id}`;
          const walletTxnData = {
            id: walletTxnId
            ,transactionId: `TXN-${paymentData.id.slice(-6)}`
            ,type: 'DEDUCTION'
            ,category: 'Debit Money'
            ,amount: amt
            ,date: generatedDate
            ,time: generatedTime.slice(0 ,5)
            ,details: {
              note: payRemarks || (language === 'bn' ? 'বিল পেমেন্ট (ওয়ালেট)' : 'Bill payment (Wallet)')
              ,source: language === 'bn' ? 'পারচেস পেমেন্ট সিস্টেম' : 'Purchase Payment System'
            }
            ,method: 'ONLINE_BANK'
            ,status: autoStatus === 'approved' ? 'RECEIVED' : 'PENDING'
            ,userId: targetUserId
            ,month: parseInt(generatedDate.split('-')[1])
            ,year: parseInt(generatedDate.split('-')[0])
            ,paymentId: paymentData.id
            ,createdAt: Date.now()
          };

          const walletSubPath = getWalletTxnSubPath(targetUserId);
          await saveFirebaseDoc(walletSubPath ,walletTxnId ,walletTxnData);
        } catch (err) {
          console.error('Failed to create linked wallet transaction:' ,err);
        }
      }
      
      if (autoStatus === 'pending') {
        showFeedback(language === 'bn' ? 'বিল পরিশোধ সফলভাবে সাবমিট হয়েছে এবং অনুমোদনের জন্য অপেক্ষমান!' : 'Bill payment submitted successfully and pending approval!' ,'success');
      } else {
        showFeedback(t('PAY_BILL_SUCCESS') ,'success');
      }
      
      setIsPayBillOpen(false);
      setPayAmount('');
      setPayTxnId('');
      setPayRemarks('');
      setPayMethod('Cash');
    } catch (e) {
      showFeedback(t('PAY_BILL_ERROR') ,'error');
    }
  };

  const handleDeleteMessPayment = async (payment: any) => {
    confirmAction(
      language === 'bn' 
        ? 'আপনি কি নিশ্চিত যে আপনি এই পেমেন্ট হিস্ট্রিটি মুছে ফেলতে চান?' 
        : 'Are you sure you want to delete this payment record?'
      ,async () => {
        try {
          const subPath = getMessPaymentSubPath(payment.userId);
          await deleteFirebaseDoc(subPath ,payment.id);

          if (payment.method === 'Wallet') {
            try {
              const walletSubPath = getWalletTxnSubPath(payment.userId);
              await deleteFirebaseDoc(walletSubPath, `WTXN-${payment.id}`);
            } catch (err) {
              console.error('Failed to delete linked wallet transaction:' ,err);
            }
          }

          showFeedback(language === 'bn' ? 'পেমেন্ট সফলভাবে মুছে ফেলা হয়েছে' : 'Payment deleted successfully' ,'success');
          setIsPaymentDetailsOpen(false);
        } catch (e) {
          showFeedback(language === 'bn' ? 'পেমেন্ট মুছতে ব্যর্থ হয়েছে' : 'Failed to delete payment' ,'error');
        }
      }
    );
  };

  const handleApproveMessPayment = async (payment: any) => {
    try {
      const subPath = getMessPaymentSubPath(payment.userId);
      await saveFirebaseDoc(subPath ,payment.id ,{ ...payment ,status: 'approved' });

      if (payment.method === 'Wallet') {
        try {
          const walletSubPath = getWalletTxnSubPath(payment.userId);
          const walletTxnId = `WTXN-${payment.id}`;
          
          // Fetch existing wallet transaction or construct it to ensure we set it to RECEIVED
          const generatedDate = payment.date || new Date().toISOString().split('T')[0];
          const generatedTime = payment.time || new Date().toLocaleTimeString('en-US' ,{ hour12: false });
          const walletTxnData = {
            id: walletTxnId
            ,transactionId: `TXN-${payment.id.slice(-6)}`
            ,type: 'DEDUCTION'
            ,category: 'Debit Money'
            ,amount: Number(payment.amount)
            ,date: generatedDate
            ,time: generatedTime.slice(0 ,5)
            ,details: {
              note: payment.remarks || (language === 'bn' ? 'বিল পেমেন্ট (ওয়ালেট)' : 'Bill payment (Wallet)')
              ,source: language === 'bn' ? 'পারচেস পেমেন্ট সিস্টেম' : 'Purchase Payment System'
            }
            ,method: 'ONLINE_BANK'
            ,status: 'RECEIVED'
            ,userId: payment.userId
            ,month: parseInt(generatedDate.split('-')[1])
            ,year: parseInt(generatedDate.split('-')[0])
            ,paymentId: payment.id
            ,createdAt: payment.createdAt || Date.now()
          };

          await saveFirebaseDoc(walletSubPath ,walletTxnId ,walletTxnData);
        } catch (err) {
          console.error('Failed to approve linked wallet transaction:' ,err);
        }
      }

      showFeedback(language === 'bn' ? 'পেমেন্ট অনুমোদিত হয়েছে!' : 'Payment approved successfully!' ,'success');
      
      if (payment.userId) {
        const notifId = `NOTIF-${Date.now()}`;
        saveFirebaseDoc(`users/${payment.userId}/notifications` ,notifId ,{
          id: notifId
          ,title: language === 'bn' ? 'পেমেন্ট অনুমোদিত' : 'Payment Approved'
          ,message: language === 'bn' ? `আপনার QAR ${payment.amount} বিল পেমেন্ট অনুমোদিত হয়েছে।` : `Your bill payment of QAR ${payment.amount} has been approved.`
          ,type: 'SUCCESS'
          ,timestamp: new Date().toISOString()
          ,isRead: false
        });
      }
      setIsPaymentDetailsOpen(false);
    } catch (e) {
      showFeedback(language === 'bn' ? 'অনুমোদন করতে ব্যর্থ হয়েছে' : 'Failed to approve payment' ,'error');
    }
  };

  const handleRejectMessPayment = async (payment: any) => {
    try {
      const subPath = getMessPaymentSubPath(payment.userId);
      await saveFirebaseDoc(subPath ,payment.id ,{ ...payment ,status: 'rejected' });

      if (payment.method === 'Wallet') {
        try {
          const walletSubPath = getWalletTxnSubPath(payment.userId);
          await deleteFirebaseDoc(walletSubPath, `WTXN-${payment.id}`);
        } catch (err) {
          console.error('Failed to reject/delete linked wallet transaction:' ,err);
        }
      }

      showFeedback(language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যান করা হয়েছে!' : 'Payment rejected!' ,'success');
      
      if (payment.userId) {
        const notifId = `NOTIF-${Date.now()}`;
        saveFirebaseDoc(`users/${payment.userId}/notifications` ,notifId ,{
          id: notifId
          ,title: language === 'bn' ? 'পেমেন্ট প্রত্যাখ্যান করা হয়েছে' : 'Payment Rejected'
          ,message: language === 'bn' ? `আপনার QAR ${payment.amount} বিল পেমেন্ট প্রত্যাখ্যান করা হয়েছে।` : `Your bill payment of QAR ${payment.amount} has been rejected.`
          ,type: 'ERROR'
          ,timestamp: new Date().toISOString()
          ,isRead: false
        });
      }
      setIsPaymentDetailsOpen(false);
    } catch (e) {
      showFeedback(language === 'bn' ? 'প্রত্যাখ্যান করতে ব্যর্থ হয়েছে' : 'Failed to reject payment' ,'error');
    }
  };

  const renderModals = () => (
    <>
      {/* MODAL 1: User List for New Partner */}
      {createPortal(
        <>
          {isUserListOpen && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={() => setIsUserListOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div 
                
                
                
                className="relative w-full bg-card-bg max-w-md border border-border-main/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[80vh]"
                style={{ backgroundColor: isDarkMode ? '#121212' : '#ffffff' }}
              >
                <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-white" />
                    <h3 className="text-base font-black tracking-wide">Select User</h3>
                  </div>
                  <button 
                    onClick={() => setIsUserListOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3">
                  {(() => {
                    const selectableUsers = globalUsers.filter(u => {
                      if (u.role === 'ADMIN') return false;
                      const isAlreadyPartner = partners.some(p => String(p.userId) === String(u.id) && p.status !== 'deleted');
                      if (isAlreadyPartner) return false;

                      if (isAdmin) {
                        return true;
                      }

                      if (isManager) {
                        // Managers can ONLY see users assigned to them by Admin
                        const isAssignedToMe = (currentManagerId && (String(u.managerId) === String(currentManagerId))) ||
                          (currentUserPartner?.id && (String(u.managerId) === String(currentUserPartner.id))) ||
                          (currentUserPartner?.partnerId && (String(u.managerId) === String(currentUserPartner.partnerId))) ||
                          (user?.id && String(u.managerId) === String(user.id)) ||
                          (user?.userId && String(u.managerId) === String(user.userId));
                        return Boolean(isAssignedToMe);
                      }

                      // Normal users cannot add partners/users
                      return false;
                    });

                    if (selectableUsers.length === 0) {
                      return (
                        <div className="text-center py-8 px-4">
                          <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                            {isManager 
                              ? (language === 'bn' 
                                  ? 'এডমিন কর্তৃক আপনার অধীনে কোনো ইউজার যোগ করা হয়নি।' 
                                  : 'No users have been assigned to you by the Admin.')
                              : (language === 'bn' 
                                  ? 'কোনো ইউজার পাওয়া যায়নি।' 
                                  : 'No available users found.')}
                          </p>
                        </div>
                      );
                    }

                    return selectableUsers.map(u => (
                      <div 
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className="bg-background-main border border-border-main/50 hover:border-purple-500/50 rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon size={24} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.name}</p>
                          <p className="text-xs font-medium mt-0.5 text-gray-600 dark:text-gray-400">ID: {u.userId || u.id.slice(0 ,8)}</p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}
        </>
        ,document.body
      )}

      {/* MODAL 2: New Partnership Form */}
      {createPortal(
        <>
          {isPartnerFormOpen && selectedUser && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={handleClosePartnerForm}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div 
                
                
                
                className="relative w-full bg-card-bg max-w-md border border-border-main/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]"
                style={{ backgroundColor: isDarkMode ? '#121212' : '#ffffff' }}
              >
                <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-white" />
                    <h3 className="text-base font-black tracking-wide">New Partnership</h3>
                  </div>
                  <button 
                    onClick={handleClosePartnerForm}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <InputFieldThemeContext.Provider value={(isNightMode || appThemeMode === 'dark') ? 'dark' : 'light'}>
                  <div className="p-6 overflow-y-auto space-y-4">
                    <InputField
                    label="Name"
                    name="name"
                    value={formName}
                    onChange={(e: any) => setFormName(e.target.value)}
                    icon={<UserIcon size={16} />}
                  />
                  {isAdmin ? (
                    <InputField
                      label="Account Type"
                      name="accountType"
                      type="select"
                      options={[
                        { value: 'MANAGER' ,label: 'Manager Profile' }
                        ,{ value: 'PARTNER' ,label: 'Partner' }
                      ]}
                      value={formAccountType === 'MANAGER' ? 'Manager Profile' : 'Partner'}
                      onChange={() => {}}
                      onOpenModal={handleOpenSubSelectModal}
                      icon={<Users size={16} />}
                    />
                  ) : (
                    <InputField
                      label="Account Type"
                      name="accountType"
                      value="Partner"
                      onChange={() => {}}
                      icon={<Users size={16} />}
                      readOnly
                    />
                  )}
                  <InputField
                    label="Mobile Number"
                    name="mobile"
                    value={formMobile}
                    onChange={(e: any) => setFormMobile(e.target.value)}
                    icon={<Phone size={16} />}
                  />
                  <InputField
                    label="Date of Birth"
                    name="dob"
                    type="date"
                    value={formDob}
                    onChange={(e: any) => setFormDob(e.target.value)}
                    icon={<Calendar size={16} />}
                  />
                  <InputField
                    label="Nationality"
                    name="nationality"
                    value={formNationality}
                    onChange={(e: any) => setFormNationality(e.target.value)}
                    icon={<Globe size={16} />}
                  />
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border-main/50 pb-2">
                      Current Address
                    </h4>
                    
                    <InputField
                      label="Country"
                      name="country"
                      type="select"
                      options={COUNTRIES.map(c => ({ value: c.name ,label: `${c.flag} ${c.name}` }))}
                      value={formCountry}
                      onChange={(e: any) => setFormCountry(e.target.value)}
                      onOpenModal={handleOpenSubSelectModal}
                      icon={<Globe size={16} />}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="State Number"
                        name="stateNumber"
                        value={formStateNumber}
                        onChange={(e) => setFormStateNumber(e.target.value)}
                        icon={<MapPin size={16} />}
                      />
                      <InputField
                        label="Zone Number"
                        name="zoneNumber"
                        value={formZoneNumber}
                        onChange={(e) => setFormZoneNumber(e.target.value)}
                        icon={<MapPin size={16} />}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Building Number"
                        name="buildingNumber"
                        value={formBuildingNumber}
                        onChange={(e) => setFormBuildingNumber(e.target.value)}
                        icon={<MapPin size={16} />}
                      />
                      <InputField
                        label="Electricity Number"
                        name="electricityNumber"
                        value={formElectricityNumber}
                        onChange={(e) => setFormElectricityNumber(e.target.value)}
                        icon={<MapPin size={16} />}
                      />
                    </div>
                    
                    <InputField
                      label="Area Name"
                      name="areaName"
                      value={formAreaName}
                      onChange={(e) => setFormAreaName(e.target.value)}
                      icon={<MapPin size={16} />}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Monthly Salary"
                        name="monthlySalary"
                        type="number"
                        placeholder="Enter salary"
                        value={formMonthlySalary}
                        onChange={(e: any) => {
                          const value = e.target.value;
                          setFormMonthlySalary(value);
                          const salary = parseFloat(value) || 0;
                          const totalDays = new Date(new Date().getFullYear() ,new Date().getMonth() + 1 ,0).getDate();
                          const calculatedPrice = (salary / 30) * totalDays;
                          setFormPrice(calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '');
                        }}
                        icon={<ShoppingCart size={16} />}
                      />
                      <InputField
                        label="Price"
                        name="price"
                        type="number"
                        placeholder="Auto-calculated"
                        value={formPrice}
                        onChange={() => {}}
                        icon={<ShoppingCart size={16} />}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Joining Date"
                      name="joiningDate"
                      value={currentDate}
                      onChange={() => {}}
                      icon={<Calendar size={16} />}
                      readOnly
                    />
                    <InputField
                      label="Joining Time"
                      name="joiningTime"
                      value={currentTime}
                      onChange={() => {}}
                      icon={<Calendar size={16} />}
                      readOnly
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border-main/50 bg-background-main/50 flex items-center justify-end gap-3 shrink-0">
                  <button 
                    onClick={handleClosePartnerForm}
                    className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 font-bold rounded-xl text-xs transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePartnerSubmit}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    Submit
                  </button>
                </div>
                </InputFieldThemeContext.Provider>
              </div>
            </div>
          )}
        </>
        ,document.body
      )}

      {createPortal(
        <>
          {isPayBillOpen && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={() => setIsPayBillOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div 
                
                
                
                className="relative w-full bg-card-bg max-w-md border border-border-main/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]"
                
              >
                {/* Premium Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-700 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-white animate-pulse" />
                    <h3 className="text-base font-black tracking-wide uppercase">{t('PAY_BILL')}</h3>
                  </div>
                  <button 
                    onClick={() => setIsPayBillOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Balance & Name Info - First Line */}
                <div className="px-6 py-4 bg-purple-50/50 dark:bg-purple-950/20 border-b border-border-main/40 flex flex-col gap-1 shrink-0">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {language === 'bn' ? 'অংশীদারের ব্যালেন্স স্থিতি' : 'Partner Balance Status'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-text-main">
                      {partners.find(p => p.id === payPartnerId || String(p.userId) === String(payPartnerId))?.name || 'N/A'}
                    </span>
                    <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                      {Number(partners.find(p => p.id === payPartnerId || String(p.userId) === String(payPartnerId))?.balance || 0).toFixed(2)} QAR
                    </span>
                  </div>
                </div>

                {/* Scrollable Form Body */}
                <InputFieldThemeContext.Provider value={{ isSearch: false }}>
                  <div className="p-6 overflow-y-auto space-y-4 flex-1">
                    {/* Select Partner Input */}
                    {accessiblePartners.length > 1 && (
                      <InputField
                        label={language === 'bn' ? 'অংশীদার নির্বাচন করুন' : 'Select Partner'}
                        name="payPartnerId"
                        type="select"
                        options={accessiblePartners.map(p => ({ value: p.id ,label: p.name }))}
                        value={payPartnerId}
                        onChange={() => {}}
                        onOpenModal={handleOpenSubSelectModal}
                        icon={<UserIcon size={16} />}
                        required
                      />
                    )}

                    {/* Select Payment Method */}
                    <InputField
                      label={language === 'bn' ? 'পেমেন্ট মেথড সিলেক্ট করুন' : 'Select Payment Method'}
                      name="payMethod"
                      type="select"
                      options={paymentMethodOptions}
                      value={payMethod}
                      onChange={() => {}}
                      onOpenModal={handleOpenSubSelectModal}
                      icon={<Banknote size={16} />}
                      required
                    />

                    {/* Pay Date */}
                    <InputField
                      label={language === 'bn' ? 'তারিখ' : 'Payment Date'}
                      name="payDate"
                      type="date"
                      value={payDate}
                      onChange={(e: any) => setPayDate(e.target.value)}
                      icon={<Calendar size={16} />}
                      required
                    />

                    {payMethod === 'Bank Transfer' && (
                      <div className="space-y-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                          {language === 'bn' ? 'ব্যাংক একাউন্ট ইনফরমেশন' : 'Bank Account Information'}
                        </p>
                        
                        <InputField
                          label={language === 'bn' ? 'Account Title' : 'Account Title'}
                          name="bankAccountTitle"
                          type="text"
                          placeholder="Enter Name"
                          value={bankAccountTitle}
                          onChange={(e: any) => setBankAccountTitle(e.target.value)}
                          icon={<UserIcon size={16} />}
                          required
                        />

                        <InputField
                          label={language === 'bn' ? 'Account Number' : 'Account Number'}
                          name="bankAccountNumber"
                          type="text"
                          placeholder="Enter account Number"
                          value={bankAccountNumber}
                          onChange={(e: any) => setBankAccountNumber(e.target.value)}
                          icon={<CreditCard size={16} />}
                          required
                        />
                      </div>
                    )}


                    {payMethod === 'Mobile Banking' && (
                      <div className="space-y-4 p-4 rounded-2xl bg-pink-500/5 border border-pink-500/10">
                        <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">
                          {language === 'bn' ? 'মোবাইল ব্যাংকিং ইনফরমেশন' : 'Mobile Banking Information'}
                        </p>

                        <InputField
                          label={language === 'bn' ? 'প্রোভাইডার সিলেক্ট করুন' : 'Select Provider'}
                          name="mobileProvider"
                          type="select"
                          options={mobileProviderOptions}
                          value={mobileProvider}
                          onChange={() => {}}
                          onOpenModal={handleOpenSubSelectModal}
                          icon={<Phone size={16} />}
                          required
                        />

                        <InputField
                          label={language === 'bn' ? 'সেন্ডার মোবাইল নাম্বার' : 'Sender Mobile Number'}
                          name="mobileSenderNumber"
                          type="tel"
                          placeholder="e.g. 017xxxxxxxx"
                          value={mobileSenderNumber}
                          onChange={(e: any) => setMobileSenderNumber(e.target.value)}
                          icon={<Phone size={16} />}
                          required
                        />

                        <InputField
                          label={language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID'}
                          name="mobileTxnId"
                          type="text"
                          placeholder="e.g. TRX1029384"
                          value={mobileTxnId}
                          onChange={(e: any) => setMobileTxnId(e.target.value)}
                          icon={<Check size={16} />}
                          required
                        />
                      </div>
                    )}

                    {payMethod === 'Card' && (
                      <div className="space-y-4 p-4 rounded-2xl bg-purple-500/5 border border-purple-500/10">
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">
                          {language === 'bn' ? 'কার্ড পেমেন্ট ইনফরমেশন' : 'Card Payment Information'}
                        </p>

                        <InputField
                          label={language === 'bn' ? 'কার্ড টাইপ সিলেক্ট করুন' : 'Select Card Type'}
                          name="cardType"
                          type="select"
                          options={cardTypeOptions}
                          value={cardType}
                          onChange={() => {}}
                          onOpenModal={handleOpenSubSelectModal}
                          icon={<CreditCard size={16} />}
                          required
                        />

                        <InputField
                          label={language === 'bn' ? 'কার্ডহোল্ডার এর নাম' : 'Cardholder Name'}
                          name="cardHolderName"
                          type="text"
                          placeholder="e.g. Md Hassan Ahamed"
                          value={cardHolderName}
                          onChange={(e: any) => setCardHolderName(e.target.value)}
                          icon={<UserIcon size={16} />}
                          required
                        />

                        <InputField
                          label={language === 'bn' ? 'কার্ডের শেষ ৪ ডিজিট' : 'Card Last 4 Digits'}
                          name="cardLastFour"
                          type="text"
                          maxLength={4}
                          placeholder="e.g. 4321"
                          value={cardLastFour}
                          onChange={(e: any) => setCardLastFour(e.target.value)}
                          icon={<CreditCard size={16} />}
                          required
                        />
                      </div>
                    )}

                    {/* Wallet Available Balance Card */}
                    {hasWalletAccess && payMethod === 'Wallet' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex flex-col gap-1.5 shadow-xs">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                          <CreditCard size={16} className="animate-bounce" />
                          <span className="text-[11px] font-black uppercase tracking-wider">
                            {language === 'bn' ? 'ওয়ালেট এভেলেবেল ব্যালেন্স' : 'Wallet Available Balance'}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            {linkedWalletBalance.toFixed(2)} <span className="text-xs font-bold text-text-muted">QAR</span>
                          </span>
                          {payMethod === 'Wallet' && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                              {language === 'bn' ? 'ওয়ালেট দিয়ে পেমেন্ট সিলেক্টেড' : 'Wallet payment selected'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Amount */}
                    <InputField
                      label={language === 'bn' ? 'অ্যামাউন্ট' : 'Payment Amount'}
                      name="payAmount"
                      type="number"
                      placeholder="e.g. 100"
                      value={payAmount}
                      onChange={(e: any) => setPayAmount(e.target.value)}
                      icon={<Banknote size={16} />}
                      required
                    />

                    {/* Remarks */}
                    <InputField
                      label={t('REMARKS')}
                      name="payRemarks"
                      placeholder="Remarks / Note"
                      value={payRemarks}
                      onChange={(e: any) => setPayRemarks(e.target.value)}
                      icon={<Edit size={16} />}
                    />
                  </div>

                  <div className="px-6 py-4 border-t border-border-main/50 bg-background-main/50 flex items-center justify-end gap-3 shrink-0">
                    <button 
                      onClick={() => setIsPayBillOpen(false)}
                      className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 font-bold rounded-xl text-xs transition-colors active:scale-95"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button 
                      onClick={handlePayBillSubmit}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      {language === 'bn' ? 'সাবমিট' : 'Submit'}
                    </button>
                  </div>
                </InputFieldThemeContext.Provider>
              </div>
            </div>
          )}
        </>
        ,document.body
      )}

      {createPortal(
        <>
          {showThirdPartyAlert && (
            <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={() => setShowThirdPartyAlert(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <div 
                
                
                
                
                className="relative w-full bg-card-bg max-w-sm border border-border-main/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
                
              >
                <div className="px-6 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Power className="w-5 h-5 text-white rotate-45" />
                    <h3 className="text-base font-black tracking-wide">
                      {language === 'bn' ? 'সতর্কতা!' : 'Warning!'}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setShowThirdPartyAlert(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-500 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-black text-rose-500 uppercase tracking-wide">
                      {language === 'bn' ? 'থার্ড পার্টি পেমেন্ট নট এলাও!' : 'Third Party Payment Not Allowed!'}
                    </h4>
                    <p className="text-sm mt-2 text-text-muted">
                      {language === 'bn' 
                        ? 'ব্যাংক একাউন্ট হোল্ডারের নামের সাথে ইউজারের নামের মিল থাকা আবশ্যক। মিল না থাকলে ব্যাংক ট্রান্সফারের পেমেন্ট গ্রহণ করা হবে না।' 
                        : 'The Bank Account Title must match the user\'s name. Otherwise bank transfer payments are not allowed.'}
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-border-main/50 bg-background-main/50 flex items-center justify-end gap-3 shrink-0">
                  <button 
                    onClick={() => setShowThirdPartyAlert(false)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-95"
                  >
                    {language === 'bn' ? 'ঠিক আছে' : 'OK I Understand'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
        ,document.body
      )}

      {createPortal(
        <>
          {isPaymentDetailsOpen && livePayment && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <div
                
                
                
                onClick={() => setIsPaymentDetailsOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <div
                
                
                
                className="relative w-full max-w-md bg-card-bg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-black/5 dark:border-white/5"
                style={{ backgroundColor: isDarkMode ? '#121212' : '#ffffff' }}
              >
                {/* Premium Header */}
                <div className="p-5 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md z-10">
                  <div>
                    <h3 className="text-base font-black text-white tracking-wide uppercase">
                      {language === 'bn' ? 'পেমেন্ট বিবরণ' : 'Payment Details'}
                    </h3>
                    <p className="text-[10px] text-emerald-100 mt-1 uppercase tracking-wider font-bold">
                      {language === 'bn' ? 'স্ট্যাটাস: ' : 'Status: '}
                      <span className="text-white font-black">
                        {livePayment?.status === 'approved' || !livePayment?.status
                          ? (language === 'bn' ? 'অনুমোদিত' : 'APPROVED')
                          : livePayment?.status === 'rejected'
                          ? (language === 'bn' ? 'প্রত্যাখ্যাত' : 'REJECTED')
                          : (language === 'bn' ? 'অপেক্ষমান' : 'PENDING')}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {livePayment && (isAdmin || 
                      (isManager && livePayment?.userId && myAssignedPartnerUserIds.includes(String(livePayment?.userId))) || 
                      ((user?.id === livePayment?.userId || user?.userId === livePayment?.userId) && livePayment?.status === 'pending')
                    ) && (
                      <button 
                        onClick={() => {
                          handleDeleteMessPayment(livePayment);
                          setIsPaymentDetailsOpen(false);
                        }}
                        className="w-8 h-8 rounded-full bg-red-500/20 text-red-100 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                        title={language === 'bn' ? 'ডিলিট করুন' : 'Delete Payment'}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => setIsPaymentDetailsOpen(false)}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Submitter Info */}
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-text-muted">
                        {language === 'bn' ? 'পরিশোধকারী' : 'Paid By'}
                      </p>
                      <p className="text-sm font-black text-text-main mt-0.5">
                        {globalUsers.find(u => u.id === livePayment?.userId || u.userId === livePayment?.userId)?.name || 'Unknown User'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-text-muted">
                        {language === 'bn' ? 'পদ্ধতি' : 'Method'}
                      </p>
                      <span className="inline-block bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs px-2.5 py-0.5 rounded border border-emerald-500/10 mt-0.5">
                        {livePayment?.method || 'Cash'}
                      </span>
                    </div>
                  </div>

                  {/* Payment Amount Display */}
                  <div className="text-center py-5 border border-border-main/50 rounded-xl bg-background-main/30">
                    <p className="text-[10px] uppercase font-bold text-text-muted tracking-widest">
                      {language === 'bn' ? 'পরিশোধিত অর্থ' : 'Amount Paid'}
                    </p>
                    <p className="font-black text-3xl text-emerald-600 dark:text-emerald-400 mt-1">
                      {livePayment?.amount} <span className="text-sm font-bold text-text-muted">QAR</span>
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-border-main/40 pb-2">
                      <span className="text-xs font-bold text-text-muted">
                        {language === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}
                      </span>
                      <span className="text-xs font-bold text-text-main">
                        {livePayment?.date} • {livePayment?.time || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-border-main/40 pb-2">
                      <span className="text-xs font-bold text-text-muted">
                        {language === 'bn' ? 'ট্রানজেকশন আইডি' : 'Transaction ID'}
                      </span>
                      <span className="text-xs font-mono font-bold text-text-main">
                        {livePayment?.transactionId || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-start pb-2">
                      <span className="text-xs font-bold text-text-muted shrink-0 pt-0.5">
                        {language === 'bn' ? 'মন্তব্য' : 'Remarks'}
                      </span>
                      <span className="text-xs font-bold text-text-main text-right max-w-[200px] break-words">
                        {livePayment?.remarks || 'No remarks'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 border-t border-border-main/50 bg-background-main/50 flex flex-col gap-2 shrink-0">
                  {/* Approval Actions for ADMIN/MANAGER when status is pending */}
                  {livePayment?.status === 'pending' && (isAdmin || (isManager && livePayment?.userId && myAssignedPartnerUserIds.includes(String(livePayment?.userId)))) && (
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button 
                        onClick={() => handleRejectMessPayment(livePayment)}
                        className="py-2.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 rounded-xl font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X size={14} /> {language === 'bn' ? 'প্রত্যাখ্যান করুন' : 'Reject'}
                      </button>
                      <button 
                        onClick={() => handleApproveMessPayment(livePayment)}
                        className="py-2.5 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                      >
                        <Check size={14} /> {language === 'bn' ? 'অনুমোদন করুন' : 'Approve'}
                      </button>
                    </div>
                  )}

                  {/* Delete button (Admins can delete any managers can delete assigned users partners can delete their own only if still pending) */}
                  {(isAdmin || 
                    (isManager && livePayment?.userId && myAssignedPartnerUserIds.includes(String(livePayment?.userId))) || 
                    ((user?.id === livePayment?.userId || user?.userId === livePayment?.userId) && livePayment?.status === 'pending')
                  ) && (
                    <button 
                      onClick={() => handleDeleteMessPayment(livePayment)}
                      className="py-2.5 w-full bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={14} /> {language === 'bn' ? 'ডিলিট করুন' : 'Delete Record'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
        ,document.body
      )}
      
      {/* MODAL 3 is now a local page view */}

      {createPortal(
        <>
          {isActionSheetOpen && (
            <div className="fixed inset-0 z-[9000] flex flex-col justify-end p-4 pb-[calc(76px+env(safe-area-inset-bottom,16px))]">
              <div 
                
                
                
                onClick={(e) => {
                  e.stopPropagation();
                  setIsActionSheetOpen(false);
                }}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer"
              />
              <div 
                
                
                
                
                className="relative w-full z-10 flex flex-col gap-2 max-w-sm mx-auto"
              >
                <div className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[14px] overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-black/10 dark:border-white/10 text-center">
                    <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">Upload Receipt</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                      setIsActionSheetOpen(false);
                    }}
                    className="w-full py-4 px-6 flex items-center justify-center gap-2 text-[#007AFF] dark:text-[#0A84FF] font-normal active:bg-black/5 dark:active:bg-white/5 transition-colors border-b border-black/10 dark:border-white/10"
                  >
                    <span className="text-[20px]">Take Photo</span>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      galleryInputRef.current?.click();
                      setIsActionSheetOpen(false);
                    }}
                    className="w-full py-4 px-6 flex items-center justify-center gap-2 text-[#007AFF] dark:text-[#0A84FF] font-normal active:bg-black/5 dark:active:bg-white/5 transition-colors"
                  >
                    <span className="text-[20px]">Choose from Gallery</span>
                  </button>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsActionSheetOpen(false);
                  }}
                  className="w-full mt-0 py-4 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[14px] font-semibold text-[#007AFF] dark:text-[#0A84FF] active:bg-black/5 dark:active:bg-white/5 transition-colors text-[20px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
        ,document.body
      )}
      
      {createPortal(
        <>
          {isDownloadModalOpen && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={() => setIsDownloadModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <div 
                
                
                
                
                className="relative w-full bg-card-bg max-w-sm border border-border-main/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col"
                style={{ backgroundColor: isDarkMode ? '#121212' : '#ffffff' }}
              >
                <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-white" />
                    <h3 className="text-base font-black tracking-wide">Download</h3>
                  </div>
                  <button 
                    onClick={() => setIsDownloadModalOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                 <div className="p-6">
                  <p className="text-sm font-bold mb-4 text-center" style={{ color: '#333333' }}>Select the month and year for your statement</p>
                  <style>{`
                    .download-modal-select {
                      color: #000000 !important;
                      -webkit-text-fill-color: #000000 !important;
                      background-color: #F3F4F6 !important;
                    }
                    .download-modal-select option {
                      color: #000000 !important;
                      background-color: #ffffff !important;
                    }
                    .dark select.download-modal-select
                    .dark-mode select.download-modal-select
                    .dark-theme select.download-modal-select {
                      color: #000000 !important;
                      -webkit-text-fill-color: #000000 !important;
                      background-color: #F3F4F6 !important;
                    }
                    .dark select.download-modal-select option
                    .dark-mode select.download-modal-select option
                    .dark-theme select.download-modal-select option {
                      color: #000000 !important;
                      background-color: #ffffff !important;
                    }
                  `}</style>
                  <div className="flex gap-4">
                    <select 
                      value={downloadMonth}
                      onChange={(e) => setDownloadMonth(Number(e.target.value))}
                      className="flex-1 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors download-modal-select"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m} className="!text-black">{new Date(0, m - 1).toLocaleString('default' ,{ month: 'long' })}</option>
                      ))}
                    </select>
                    <select 
                      value={downloadYear}
                      onChange={(e) => setDownloadYear(Number(e.target.value))}
                      className="flex-1 text-sm font-bold rounded-xl px-4 py-3 outline-none focus:border-purple-500 transition-colors download-modal-select"
                    >
                      {[...Array(5)].map((_, i) => {
                        const y = new Date().getFullYear() - 2 + i;
                        return <option key={y} value={y} className="!text-black">{y}</option>;
                      })}
                    </select>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-border-main/50 bg-background-main/50 flex items-center justify-end gap-3 shrink-0">
                  <button 
                    onClick={() => setIsDownloadModalOpen(false)}
                    className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 font-bold rounded-xl text-sm transition-colors active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDownloadStatement}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
        ,document.body
      )}

      <GlobalFullscreenSelect
        isOpen={subSelectModal.isOpen}
        onClose={() => setSubSelectModal((prev) => ({ ...prev ,isOpen: false }))}
        onSelect={handleSubSelectModalChange}
        options={subSelectModal.options}
        title={`Select ${subSelectModal.label}`}
      />

      {createPortal(
        <>
          {isPendingDetailsModalOpen && selectedPendingPurchase && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
              <div
                
                
                
                onClick={() => setIsPendingDetailsModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <div
                
                
                
                className="relative w-full max-w-lg bg-card-bg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-black/5 dark:border-white/5"
                style={{ backgroundColor: isDarkMode ? '#121212' : '#ffffff' }}
              >
                <div className="p-5 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md z-10">
                  <div>
                    <h3 className="text-lg font-black text-white">Purchase Details</h3>
                    <p className="text-xs text-indigo-100 mt-1">Status: <span className="text-white uppercase tracking-widest font-bold">{livePurchase?.status === 'approved' ? 'APPROVED' : (livePurchase?.status === 'rejected' ? 'REJECTED' : 'PENDING APPROVAL')}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    {livePurchase && (
                      isAdmin || 
                      (isManager && livePurchase?.userId && myAssignedPartnerUserIds.includes(String(livePurchase?.userId))) ||
                      ((user?.id === livePurchase?.userId || user?.userId === livePurchase?.userId) && livePurchase?.status === 'pending')
                    ) && (
                      <button 
                        onClick={() => {
                          confirmAction(
                            language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই পারচেস রেকর্ডটি ডিলিট করতে চান?' : 'Are you sure you want to delete this purchase record?',
                            async () => {
                              try {
                                if (livePurchase?._path) {
                                  await deleteFirebaseDoc(livePurchase._path);
                                } else {
                                  await deleteFirebaseDoc(getPurchaseSubPath(livePurchase?.userId), livePurchase?.id);
                                }
                                showFeedback(language === 'bn' ? 'পারচেস রেকর্ডটি সফলভাবে ডিলিট করা হয়েছে' : 'Purchase record deleted successfully', 'success');
                                setIsPendingDetailsModalOpen(false);
                              } catch (err) {
                                console.error(err);
                                showFeedback('Failed to delete purchase record', 'error');
                              }
                            }
                          );
                        }}
                        className="w-10 h-10 rounded-full bg-red-500/20 text-red-100 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                        title={language === 'bn' ? 'ডিলিট করুন' : 'Delete Purchase'}
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDownloadInvoice(livePurchase)}
                      className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
                      title="Download PDF"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </button>
                    <button 
                      onClick={() => setIsPendingDetailsModalOpen(false)}
                      className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* Meta Data */}
                  <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>Submitter Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] uppercase font-bold" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#9ca3af' : '#000000' }}>Name</p>
                        <p className="text-sm font-black" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>
                          {globalUsers.find(u => u.id === livePurchase?.userId || u.userId === livePurchase?.userId)?.name || 'Unknown User'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#9ca3af' : '#000000' }}>User ID</p>
                        <p className="text-sm font-black" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>
                          {livePurchase?.userId?.slice(0,8) || 'N/A'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] uppercase font-bold" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#9ca3af' : '#000000' }}>Submitted At</p>
                        <p className="text-sm font-black" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>
                          {livePurchase ? new Date(livePurchase.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Purchase Details */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>Purchase Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-border-main/50 pb-2">
                        <span className="text-sm font-bold" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#9ca3af' : '#000000' }}>Hypermarket Name</span>
                        <span className="text-sm font-black" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>{livePurchase?.hypermarketName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-border-main/50 pb-2">
                        <span className="text-sm font-bold" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#9ca3af' : '#000000' }}>Date & Time</span>
                        <span className="text-sm font-black" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>{livePurchase?.date} • {livePurchase?.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>Items List ({livePurchase?.items?.length || 0})</h4>
                    <div className="space-y-2">
                      {livePurchase?.items?.map((item: any ,i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg border" style={{ backgroundColor: (isNightMode || appThemeMode === 'dark') ? '#001f35' : '#f3f4f6' ,borderColor: (isNightMode || appThemeMode === 'dark') ? '#374151' : '#d1d5db' }}>
                          <div>
                            <p className="text-sm font-black" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>{item.name}</p>
                            <p className="text-[10px] mt-0.5 font-bold" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#9ca3af' : '#000000' }}>{item.quantity} {item.unit} × QAR {item.price}</p>
                          </div>
                          <p className="font-black" style={{ color: (isNightMode || appThemeMode === 'dark') ? '#ffffff' : '#000000' }}>QAR {item.total}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Receipt (if any) */}
                  {livePurchase?.receipt && (
                    <div className="pt-3 border-t border-border-main/50">
                      <button
                        onClick={() => {
                          setReceiptViewerUrl(livePurchase.receipt);
                          setIsReceiptViewerOpen(true);
                          setIsPendingDetailsModalOpen(false); // Instantly hide details modal
                        }}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 animate-pulse"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        {language === 'bn' ? 'রসিদ দেখুন (View Receipt)' : 'View Receipt'}
                      </button>
                    </div>
                  )}
                </div>

                {livePurchase?.status !== 'approved' && (
                  <div className="p-4 border-t border-border-main/50 bg-background-main/50 grid grid-cols-2 gap-3 shrink-0">
                    {(user?.role === 'ADMIN' || 
                      (user?.role === 'MANAGER' && livePurchase?.userId && myAssignedPartnerUserIds.includes(String(livePurchase?.userId))) ||
                      ((user?.id === livePurchase?.userId || user?.userId === livePurchase?.userId) && livePurchase?.status === 'pending')
                    ) && (
                      <button 
                        onClick={() => {
                          confirmAction(
                            language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই পারচেস রেকর্ডটি ডিলিট করতে চান?' : 'Are you sure you want to delete this purchase record?',
                            async () => {
                              try {
                                if (livePurchase?._path) {
                                  await deleteFirebaseDoc(livePurchase._path);
                                } else {
                                  await deleteFirebaseDoc(getPurchaseSubPath(livePurchase?.userId), livePurchase?.id);
                                }
                                showFeedback(language === 'bn' ? 'পারচেস রেকর্ডটি সফলভাবে ডিলিট করা হয়েছে' : 'Purchase record deleted successfully', 'success');
                                setIsPendingDetailsModalOpen(false);
                              } catch (err) {
                                console.error(err);
                                showFeedback('Failed to delete purchase record', 'error');
                              }
                            }
                          );
                        }}
                        className="py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    )}

                    {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && livePurchase?.userId && myAssignedPartnerUserIds.includes(String(livePurchase?.userId)))) && livePurchase?.status !== 'approved' && (
                      <button 
                        onClick={() => {
                          setSelectedPendingPurchase((prev: any) => ({ ...prev ,status: 'rejected' }));
                          saveFirebaseDoc(getPurchaseSubPath(livePurchase?.userId) ,livePurchase?.id ,{ ...livePurchase ,status: 'rejected' });
                          setIsPendingDetailsModalOpen(false);
                        }}
                        className="py-3 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-xl font-bold text-sm hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={16} /> Reject
                      </button>
                    )}

                    {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && livePurchase?.userId && myAssignedPartnerUserIds.includes(String(livePurchase?.userId)))) && (
                      <button 
                        onClick={() => {
                          setEditingPurchaseId(livePurchase?.id);
                          setHypermarketName(livePurchase?.hypermarketName || '');
                          setPurchaseItems(livePurchase?.items || []);
                          setPurchaseDate(livePurchase?.date || new Date().toISOString().split('T')[0]);
                          setPurchaseTime(livePurchase?.time || (() => {
                            const d = new Date();
                            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                          })());
                          setReceiptImage(livePurchase?.receipt || null);
                          setIsPendingDetailsModalOpen(false);
                          setView('NEW_PURCHASE');
                        }}
                        className="py-3 bg-black/5 dark:bg-white/5 text-text-main rounded-xl font-bold text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-2 col-span-2"
                      >
                        <Edit size={16} /> Edit
                      </button>
                    )}

                    {(user?.role === 'ADMIN' || (user?.role === 'MANAGER' && livePurchase?.userId && myAssignedPartnerUserIds.includes(String(livePurchase?.userId)))) && (
                      <button 
                        onClick={() => {
                          setSelectedPendingPurchase((prev: any) => ({ ...prev ,status: 'approved' }));
                          saveFirebaseDoc(getPurchaseSubPath(livePurchase?.userId) ,livePurchase?.id ,{ ...livePurchase ,status: 'approved' });
                          setIsPendingDetailsModalOpen(false); // Instantly close modal on approval
                          
                          // Notify the user who submitted the purchase
                          if (livePurchase?.userId) {
                            const notifId = `NOTIF-${Date.now()}`;
                            saveFirebaseDoc(`users/${livePurchase.userId}/notifications` ,notifId ,{
                              id: notifId
                              ,title: 'Purchase Approved'
                              ,message: `Your purchase of QAR ${livePurchase.amount} at ${livePurchase.hypermarketName} has been approved.`
                              ,type: 'SUCCESS'
                              ,timestamp: new Date().toISOString()
                              ,isRead: false
                            });
                          }
                        }}
                        className="py-3 bg-indigo-500 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 col-span-2 shadow-lg shadow-indigo-500/20"
                      >
                        <Check size={16} /> Approve Purchase
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
        ,document.body
      )}

      {createPortal(
        <>
          {isReceiptViewerOpen && receiptViewerUrl && (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
              <button 
                onClick={() => setIsReceiptViewerOpen(false)}
                className="absolute top-4 right-4 z-[10000] w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all shadow-lg active:scale-95"
                title={language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              >
                <X size={24} />
              </button>
              
              <div className="w-full max-w-xl flex flex-col max-h-[85vh] overflow-hidden rounded-2xl bg-[#1C1C1E] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                  <h3 className="text-sm font-black text-zinc-100 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {language === 'bn' ? 'ক্রয়কৃত রসিদের প্রমাণ' : 'Purchase Receipt Proof'}
                  </h3>
                  <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    QAR {livePurchase?.amount || '0.00'}
                  </span>
                </div>
                
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/40">
                  <img 
                    src={receiptViewerUrl} 
                    alt="Receipt Proof" 
                    className="max-w-full max-h-[65vh] object-contain rounded-lg border border-white/5 shadow-lg select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="p-4 border-t border-white/10 bg-zinc-900/50 flex justify-end">
                  <button
                    onClick={() => setIsReceiptViewerOpen(false)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    {language === 'bn' ? 'বন্ধ করুন (Close)' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
        ,document.body
      )}
    </>
  );

  if (isPartnerProfileModalOpen && selectedPartnerProfile) {
    const partnerUser = globalUsers.find(u => u.id === selectedPartnerProfile.userId);
    const partnerMobile = selectedPartnerProfile.mobile || partnerUser?.mobileNumber || partnerUser?.mobile || 'No Mobile';
    const partnerAvatar = selectedPartnerProfile.avatar || partnerUser?.avatar;

    return (
      <div className="relative min-h-screen bg-transparent">
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <PartnerProfileCard 
            selectedPartnerProfile={selectedPartnerProfile}
            globalUsers={globalUsers}
            isDarkMode={isDarkMode}
            user={user}
            purchases={accessiblePurchases}
            partners={accessiblePartners}
            totalPurchaseAmount={totalPurchaseAmount}
            isAdmin={isAdmin}
            onEdit={() => {
              setSelectedUser(globalUsers.find((u: any) => u.id === selectedPartnerProfile.userId) || null);
              setFormName(selectedPartnerProfile.name || '');
              setFormMobile(selectedPartnerProfile.mobile || '');
              setFormDob(selectedPartnerProfile.dob || '');
              setFormNationality(selectedPartnerProfile.nationality || '');
              setFormCountry(selectedPartnerProfile.country || '');
              setFormStateNumber(selectedPartnerProfile.stateNumber || '');
              setFormZoneNumber(selectedPartnerProfile.zoneNumber || '');
              setFormBuildingNumber(selectedPartnerProfile.buildingNumber || '');
              setFormElectricityNumber(selectedPartnerProfile.electricityNumber || '');
              setFormAreaName(selectedPartnerProfile.areaName || '');
              setFormMonthlySalary(selectedPartnerProfile.monthlySalary || '');
              setFormPrice(selectedPartnerProfile.price || '');
              setFormAccountType(selectedPartnerProfile.accountType || 'PARTNER');
              setEditingPartnerId(selectedPartnerProfile.id);
              setIsPartnerProfileModalOpen(false);
              setIsPartnerFormOpen(true);
            }}
            onDelete={handleDeletePartner}
            onToggleStatus={handleTogglePartnerStatus}
          />
        </div>
        {renderModals()}
      </div>
    );
  }

  if (isPartnerListModalOpen || isAdmin) {
    const filteredPartners = accessiblePartners.filter(p => {
      const status = p.status || 'active';
      return status === partnerFilter;
    });

    return (
      <div className="relative min-h-screen bg-transparent">
        <div className="relative z-10 max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
          
          {/* Status Toggle Card */}
          <div 
            className="bg-white dark:bg-[#121212] rounded-[8px] p-1.5 shadow-[var(--dynamic-card-shadow)] relative flex gap-1.5"
            style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
          >
            <button
              onClick={() => setPartnerFilter('active')}
              className={`flex-1 py-2 md:py-2.5 text-xs md:text-sm font-black rounded-[6px] transition-all duration-200 ${
                partnerFilter === 'active' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Active Partner
            </button>
            <button
              onClick={() => setPartnerFilter('inactive')}
              className={`flex-1 py-2 md:py-2.5 text-xs md:text-sm font-black rounded-[6px] transition-all duration-200 ${
                partnerFilter === 'inactive' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              Inactive Partner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPartners.map(partner => {
              const partnerUser = globalUsers.find(u => String(u.id) === String(partner.userId));
              const partnerPurchases = accessiblePurchases.filter(p => {
                const pId = String(p.userId);
                const matchId = pId === String(partner.userId) || pId === String(partnerUser?.userId) || pId === String(partnerUser?.id);
                const matchStatus = p.status === 'approved' || !p.status;
                return matchId && matchStatus;
              });
              const partnerPayments = messPayments.filter(py => {
                const pyId = String(py.userId);
                const matchId = pyId === String(partner.userId) || pyId === String(partnerUser?.userId) || pyId === String(partnerUser?.id);
                const matchStatus = py.status === 'approved' || !py.status;
                if (!py.date) return false;
                const [year ,month] = py.date.split('-');
                const monthMatch = selectedMonth === 'ALL' ? true : parseInt(month ,10) === selectedMonth;
                const yearMatch = selectedYear === 'ALL' ? true : parseInt(year ,10) === selectedYear;
                return matchId && matchStatus && monthMatch && yearMatch;
              });
              const partnerTotalPayments = partnerPayments.reduce((sum, py) => sum + (Number(py.amount) || 0), 0);
              const partnerTotal = partnerPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) + partnerTotalPayments;
              const averagePerPartner = accessiblePartners.length > 0 ? Number(totalPurchaseAmount) / accessiblePartners.length : 0;
              const balance = partnerTotal - averagePerPartner;

              let balanceStr = "";
              let balanceClass = "";

              if (balance > 0) {
                balanceStr = `Plus (+${balance.toFixed(2)})`;
                balanceClass = "text-emerald-600 dark:text-emerald-400";
              } else if (balance < 0) {
                balanceStr = `Minus (${balance.toFixed(2)})`;
                balanceClass = "text-rose-600 dark:text-rose-400";
              } else {
                balanceStr = "0.00";
                balanceClass = "text-text-muted";
              }

              // Retrieve mobile and avatar from either partner record or the linked user record
              const partnerMobile = partner.mobile || partnerUser?.mobileNumber || partnerUser?.mobile || 'No Mobile';
              const partnerAvatar = partner.avatar || partnerUser?.avatar;

              return (
                <div 
                  key={partner.id} 
                  className="relative overflow-hidden rounded-[12px] flex flex-col group bg-theme-card border border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] text-text-main transition-all hover:shadow-md"
                  style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                >
                  {/* View Icon */}
                  <button 
                    onClick={() => {
                      setSelectedPartnerProfile(partner);
                      setIsPartnerProfileModalOpen(true);
                    }}
                    className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-colors z-20 text-text-muted hover:text-text-main shadow-xs"
                    title="View Details"
                  >
                    <Eye size={15} />
                  </button>

                  {/* Profile Header */}
                  <div className="p-5 flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 rounded-[12px] bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 overflow-hidden border-2 border-purple-500/20 shadow-sm group-hover:scale-105 transition-transform duration-300">
                      {partnerAvatar ? (
                        <img src={partnerAvatar} alt={partner.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={28} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h4 className="font-black text-text-main text-lg truncate">{partner.name}</h4>
                      <p className="text-xs font-medium text-text-muted mt-1 truncate flex items-center gap-1.5">
                        <Phone size={13} className="text-purple-500 shrink-0" />
                        {partnerMobile}
                      </p>
                    </div>
                  </div>
                  
                  {/* Account Card (Expense Calculation) */}
                  {!isAdmin && (
                    <div className="p-3.5 bg-slate-50/80 dark:bg-white/5 border-t border-[var(--dynamic-card-border)] mt-auto relative z-10">
                      <div className="flex items-center justify-between mb-2.5 px-0.5">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Total Purchase</span>
                        <span className="font-black text-sm text-text-main">{partnerTotal.toFixed(2)} <span className="text-[10px] text-text-muted">QAR</span></span>
                      </div>
                      
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-xs relative overflow-hidden">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest relative z-10">Mess Balance</span>
                        <span className={`font-black text-sm relative z-10 ${balanceClass}`}>
                          {balanceStr}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] right-6 z-40">
          <button
            onClick={handleOpenNewPartner}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl transition-transform active:scale-95"
          >
            <Plus size={24} className="stroke-[3px]" />
          </button>
        </div>

        {renderModals()}
      </div>
    );
  }

  if (currentView === 'NEW_PURCHASE') {
    return (
      <div className="relative min-h-screen bg-transparent">
        <div className="relative z-10 max-w-lg mx-auto flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300"
             style={{ background: 'transparent' }}
        >
          <div className="py-6 space-y-6 purchase-form-container">
            {/* Single Premium Card containing Camera/Scanner, Hypermarket Name, and Purchase Date */}
            <div 
              className="bg-card-bg p-5 rounded-2xl border space-y-5 shadow-sm"
              style={{ 
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
              }}
            >
              {/* Premium Camera/Scanner Section (First Line inside Card) */}
              <div className="flex flex-col items-center py-4 bg-black/5 dark:bg-white/5 rounded-xl border border-dashed" style={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  onChange={handleScanReceipt}
                  ref={cameraInputRef}
                  className="hidden"
                  onClick={(e) => e.stopPropagation()}
                />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleScanReceipt}
                  ref={galleryInputRef}
                  className="hidden"
                  onClick={(e) => e.stopPropagation()}
                />
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isScanning) setIsActionSheetOpen(true);
                  }}
                  className="relative overflow-hidden rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 group"
                >
                  <div 
                    className={`w-16 h-16 rounded-full flex flex-col items-center justify-center relative z-10 transition-colors ${
                      isScanning ? 'animate-pulse' : ''
                    }`}
                    style={{ 
                      backgroundColor: isDarkMode ? '#121212' : '#ffffff' 
                    }}
                  >
                    <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-5 transition-opacity" style={{ color: 'var(--primary)' }}></div>
                    
                    {isScanning ? (
                      <Scan size={24} className="animate-spin text-teal-500" />
                    ) : (
                      <Camera size={24} className="text-teal-500 group-hover:text-cyan-500 transition-colors" />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 blur-md opacity-40 group-hover:opacity-75 transition-opacity duration-300 -z-10"></div>
                </div>
                <p className="text-[11px] font-black uppercase mt-2 tracking-wider" style={{ color: isDarkMode ? '#e4e4e7' : '#27272a' }}>
                  {isScanning ? 'Scanning Receipt...' : 'Scan Receipt'}
                </p>
                {receiptImage && !isScanning && (
                  <div className="mt-3 flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptViewerUrl(receiptImage);
                        setIsReceiptViewerOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-all active:scale-95 shadow-sm"
                    >
                      <Eye size={15} />
                      <span>{language === 'bn' ? 'রসিদ দেখুন (View Receipt)' : 'View Receipt'}</span>
                    </button>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {language === 'bn' ? 'রসিদ ডিভাইসে সংরক্ষিত আছে' : 'Receipt saved on device'}
                    </span>
                  </div>
                )}
              </div>

              {/* Hypermarket Name Section */}
              <InputFieldThemeContext.Provider value={isDarkMode ? 'dark' : 'light'}>
                <InputField
                  label="Hypermarket Name"
                  name="hypermarketName"
                  value={hypermarketName}
                  onChange={(e: any) => setHypermarketName(e.target.value)}
                  icon={<Store size={16} />}
                  suggestions={hypermarkets.map(h => h.name)}
                  required
                />

                {/* Purchase Date Section */}
                <InputField
                  label="Purchase Date"
                  name="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e: any) => setPurchaseDate(e.target.value)}
                  icon={<Calendar size={16} />}
                  required
                />

                {/* Purchase Time Section */}
                <InputField
                  label="Purchase Time"
                  name="purchaseTime"
                  type="time"
                  value={purchaseTime}
                  onChange={(e: any) => setPurchaseTime(e.target.value)}
                  icon={<Clock size={16} />}
                  required
                />
              </InputFieldThemeContext.Provider>
            </div>

            <div className="pt-4 border-t" style={{ borderColor: isDarkMode ? 'rgba(255 255 255 0.1)' : 'rgba(0 0 0 0.1)' }}>
              {/* Heading: "Purchase Items" */}
              <h4 className="text-sm font-black uppercase tracking-wider mb-4" style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Purchase Items</h4>

              <div className="space-y-4">
                {purchaseItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className="bg-card-bg p-4 border rounded-xl space-y-3 relative"
                    style={{ 
                      borderColor: isDarkMode ? 'rgba(255 255 255 0.2)' : 'rgba(0 0 0 0.2)'
                    }}
                  >
                    <div className="flex justify-between items-center pb-2 border-b border-dashed" style={{ borderColor: isDarkMode ? 'rgba(255 255 255 0.1)' : 'rgba(0 0 0 0.1)' }}>
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>
                        Item #{index + 1}
                      </span>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm transition-all active:scale-90"
                        style={{
                          backgroundColor: isDarkMode ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.1)',
                          color: '#f43f5e'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <InputField
                      label="Item Name"
                      name={`item-${index}-name`}
                      value={item.name}
                      onChange={(e: any) => handleItemChange(index ,'name' ,e.target.value)}
                      type="select"
                      options={globalItems.map(g => ({ value: g.name ,label: g.name }))}
                      onOpenModal={() => {
                        setSubSelectModal({
                          isOpen: true
                          ,label: "Item"
                          ,options: globalItems.map(g => ({ value: g.name ,label: g.name }))
                          ,name: `item-${index}-name`
                        });
                      }}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <SimpleInput
                        label="Price"
                        type="number"
                        value={item.price}
                        onChange={(e: any) => handleItemChange(index ,'price' ,e.target.value)}
                        isDarkMode={isDarkMode}
                      />
                      <SimpleInput
                        label="Quantity"
                        type="number"
                        value={item.quantity}
                        onChange={(e: any) => handleItemChange(index ,'quantity' ,e.target.value)}
                        isDarkMode={isDarkMode}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Unit"
                        name={`item-${index}-unit`}
                        type="select"
                        options={[{value: 'KG' ,label: 'KG'} ,{value: 'Gram' ,label: 'Gram'} ,{value: 'Piece' ,label: 'Piece'}]}
                        value={item.unit}
                        onChange={(e: any) => handleItemChange(index ,'unit' ,e.target.value)}
                        onOpenModal={() => {
                          setSubSelectModal({
                            isOpen: true
                            ,label: "Unit"
                            ,options: [{value: 'KG' ,label: 'KG'} ,{value: 'Gram' ,label: 'Gram'} ,{value: 'Piece' ,label: 'Piece'}]
                            ,name: `item-${index}-unit`
                          });
                        }}
                      />
                      <SimpleInput
                        label="Total (Auto)"
                        value={item.total.toString()}
                        readOnly
                        onChange={() => {}}
                        isDarkMode={isDarkMode}
                      />
                    </div>
                  </div>
                ))}
                
                {purchaseItems.length === 0 && (
                  <div className="bg-card-bg text-center p-6 border border-dashed rounded-xl text-xs text-text-main" style={{ 
                    borderColor: isDarkMode ? 'rgba(255 255 255 0.2)' : 'rgba(0 0 0 0.2)'
                  }}>
                    No items added yet. Scan a receipt or add manually.
                  </div>
                )}

                {/* Dynamic "+ Add Item" Button with Beautiful Premium violet/indigo Gradient */}
                <button
                  onClick={handleAddItem}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-bold transition-all mt-2 active:scale-[0.98] shadow-md hover:brightness-110"
                  style={{ 
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    color: '#ffffff'
                  }}
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>
            </div>
            
            {purchaseItems.length > 0 && (
              <div className="bg-card-bg p-4 rounded-xl flex items-center justify-between border" style={{
                borderColor: isDarkMode ? 'rgba(255 255 255 0.2)' : 'rgba(0 0 0 0.2)'
              }}>
                <span className="font-bold text-text-main">Total Amount</span>
                <span className="font-black text-lg text-text-main">
                  QAR {purchaseItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div 
            className="py-4 flex items-center gap-3 shrink-0 w-full"
          >
            <button 
              onClick={handlePurchaseSubmit}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-sm transition-all shadow-lg hover:shadow-xl active:scale-95 text-center"
            >
              SUBMIT
            </button>
          </div>
        </div>

        {renderModals()}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Top Layout */}
      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        
        {/* Main Summary Card */}
        <div 
          className="relative overflow-hidden rounded-2xl p-5 min-h-[190px] md:min-h-[220px] flex flex-col justify-between bg-theme-card border border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] transition-colors duration-200"
        >
          {/* Visual accents */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between">
            {/* Top Row: Date Selectors & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => setIsMonthSelectOpen(true)}
                  className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main transition-all border border-black/5 dark:border-white/10 flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                >
                  <span>{selectedMonth === 'ALL' ? (language === 'bn' ? 'সব মাস' : 'All Month') : new Date(0, (typeof selectedMonth === 'number' ? selectedMonth : 1) - 1).toLocaleString('default', { month: 'long' })}</span>
                  <ChevronDown size={12} className="text-text-muted" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsYearSelectOpen(true)}
                  className="bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-text-main transition-all border border-black/5 dark:border-white/10 flex items-center gap-1.5 active:scale-95 shadow-xs cursor-pointer"
                >
                  <span>{selectedYear === 'ALL' ? (language === 'bn' ? 'সব বছর' : 'All Years') : selectedYear}</span>
                  <ChevronDown size={12} className="text-text-muted" />
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
                    ...[...Array(5)].map((_, i) => {
                      const y = new Date().getFullYear() - 2 + i;
                      return { label: String(y), value: String(y) };
                    })
                  ]}
                  title={language === 'bn' ? 'বছর নির্বাচন করুন' : 'Select Year'}
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
                    ...Array.from({ length: 12 }, (_, i) => i + 1).map(m => ({
                      label: new Date(0, m - 1).toLocaleString('default', { month: 'long' }),
                      value: String(m)
                    }))
                  ]}
                  title={language === 'bn' ? 'মাস নির্বাচন করুন' : 'Select Month'}
                  selectedValue={String(selectedMonth)}
                  searchable={false}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDownloadModalOpen(true)}
                  className="w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-text-main rounded-xl transition-all border border-black/5 dark:border-white/10 shadow-xs active:scale-95 cursor-pointer"
                  title="Download Statement"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>

            {/* Bottom Row: Total Partner & Total Purchase */}
            <div className="grid grid-cols-2 gap-3">
              {/* Total Partner */}
              <button
                type="button"
                onClick={() => setIsPartnerListModalOpen(true)}
                className="group relative overflow-hidden flex flex-col items-start justify-between min-h-[96px] md:min-h-[112px] p-4 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 border border-indigo-400/20 text-left shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <div className="absolute right-[-16px] bottom-[-16px] opacity-15 pointer-events-none scale-100 group-hover:scale-110 transition-transform duration-300">
                  <Users size={80} strokeWidth={1.5} className="text-white" />
                </div>
                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-indigo-100 whitespace-nowrap">
                      {language === 'bn' ? 'মোট পার্টনার' : 'Total Partner'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black tracking-tighter text-white drop-shadow-sm">{accessiblePartners.length}</span>
                  </div>
                </div>
              </button>

              {/* Total Purchase */}
              <div
                className="group relative overflow-hidden flex flex-col items-start justify-between min-h-[96px] md:min-h-[112px] p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-400/20 text-left shadow-lg"
              >
                <div className="absolute right-[-16px] bottom-[-16px] opacity-15 pointer-events-none scale-100">
                  <ShoppingCart size={80} strokeWidth={1.5} className="text-white" />
                </div>
                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-100 whitespace-nowrap">
                      {language === 'bn' ? 'মোট পারচেস' : 'Total Purchase'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black tracking-tighter text-white drop-shadow-sm">{totalPurchaseAmount}</span>
                    <span className="text-[10px] font-black text-emerald-100/70">QAR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Tabs */}
        <div className="bg-card-bg rounded-xl p-1.5 flex border border-border-main/50 relative shadow-[var(--dynamic-card-shadow)]">
          <div 
            className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 rounded-lg transition-transform duration-300 ease-out border border-purple-500/20"
            style={{ transform: activeTab === 'history' ? 'translateX(0)' : 'translateX(100%)' ,left: '6px' }}
          />
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg relative z-10 transition-colors uppercase tracking-wider ${activeTab === 'history' ? 'text-purple-600 dark:text-purple-400' : 'text-text-muted hover:text-text-main'}`}
          >
            {language === 'bn' ? 'পারচেস হিস্টরি' : 'Purchase History'}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg relative z-10 transition-colors uppercase tracking-wider ${activeTab === 'pending' ? 'text-indigo-600 dark:text-indigo-400' : 'text-text-muted hover:text-text-main'}`}
          >
            {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
          </button>
        </div>

        {/* Tab Content */}
        <div className="pb-24">
          <>
            {activeTab === 'history' && (
              <div
                key="history"
                className="space-y-2.5"
              >
                {combinedHistory.length > 0 ? (
                  combinedHistory.map(item => {
                    const purchaseUser = globalUsers.find(u => u.userId === item.userId || u.id === item.userId);
                    const partnerName = purchaseUser?.name || 'Unknown Partner';
                    
                    if (item.type === 'BILL_PAYMENT') {
                      return (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setSelectedPayment(item);
                            setIsPaymentDetailsOpen(true);
                          }}
                          className="bg-theme-card border border-[var(--dynamic-card-border)] rounded-xl p-3.5 sm:p-4 shadow-[var(--dynamic-card-shadow)] cursor-pointer active:scale-[0.99] transition-all hover:shadow-md relative overflow-hidden flex items-center gap-3.5 sm:gap-4"
                          style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                        >
                          {/* Left Payment Icon with equal space on top, bottom, and left */}
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <CreditCard size={22} className="stroke-[2.2]" />
                          </div>

                          {/* Center Details with equal spacing top/middle/bottom */}
                          <div className="flex-1 min-w-0 h-12 flex flex-col justify-between py-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="font-black text-text-main text-sm truncate leading-tight">{partnerName}</p>
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0 leading-none">
                                <CheckCircle2 size={10} className="stroke-[2.5]" />
                                {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-text-muted leading-tight flex-wrap">
                              <span className="flex items-center gap-1 shrink-0 font-medium">
                                <Calendar size={12} className="text-slate-400" />
                                {item.date} • {item.time}
                              </span>
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                                {item.method || (language === 'bn' ? 'বিল পেমেন্ট' : 'Bill Payment')}
                              </span>
                              {item.remarks && (
                                <span className="flex items-center gap-1 truncate text-text-muted text-[10px] max-w-[120px]">
                                  <FileText size={10} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{item.remarks}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Vertically Centered Amount */}
                          <div className="text-right shrink-0 h-12 flex items-center justify-center pl-1 my-auto">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-lg whitespace-nowrap leading-none">
                              +{item.amount} <span className="text-[10px] font-bold text-text-muted">QAR</span>
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedPendingPurchase(item);
                          setIsPendingDetailsModalOpen(true);
                        }}
                        className="bg-theme-card border border-[var(--dynamic-card-border)] rounded-xl p-3.5 sm:p-4 shadow-[var(--dynamic-card-shadow)] cursor-pointer active:scale-[0.99] transition-all hover:shadow-md relative overflow-hidden flex items-center gap-3.5 sm:gap-4"
                        style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                      >
                        {/* Left Marketing Icon with equal space on top, bottom, and left */}
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                          <ShoppingCart size={22} className="stroke-[2.2]" />
                        </div>

                        {/* Center Details with equal spacing top/middle/bottom */}
                        <div className="flex-1 min-w-0 h-12 flex flex-col justify-between py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="font-black text-text-main text-sm truncate leading-tight">{partnerName}</p>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0 leading-none">
                              <CheckCircle2 size={10} className="stroke-[2.5]" />
                              {language === 'bn' ? 'অনুমোদিত' : 'Approved'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted leading-tight flex-wrap">
                            <span className="flex items-center gap-1 shrink-0 font-medium">
                              <Calendar size={12} className="text-slate-400" />
                              {item.date} • {item.time}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 shrink-0">
                              <Package size={11} className="shrink-0" />
                              <span>{item.items?.length || 0} {language === 'bn' ? 'আইটেম' : 'Items'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Right Side: Vertically Centered Amount */}
                        <div className="text-right shrink-0 h-12 flex items-center justify-center pl-1 my-auto">
                          <span className="font-black text-purple-600 dark:text-purple-400 text-base md:text-lg whitespace-nowrap leading-none">
                            {item.amount} <span className="text-[10px] font-bold text-text-muted">QAR</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 border border-dashed border-border-main/50 rounded-xl bg-card-bg shadow-[var(--dynamic-card-shadow)]">
                    <p className="text-text-muted text-sm font-bold">{language === 'bn' ? 'কোন পারচেস হিস্টরি পাওয়া যায়নি' : 'No Purchase History'}</p>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'pending' && (
              <div
                key="pending"
                className="space-y-2.5"
              >
                {combinedPending.length > 0 ? (
                  combinedPending.map(item => {
                    const purchaseUser = globalUsers.find(u => u.userId === item.userId || u.id === item.userId);
                    const partnerName = purchaseUser?.name || 'Unknown Partner';

                    if (item.type === 'BILL_PAYMENT') {
                      return (
                        <div 
                          key={item.id}
                          onClick={() => {
                            setSelectedPayment(item);
                            setIsPaymentDetailsOpen(true);
                          }}
                          className="bg-theme-card border border-[var(--dynamic-card-border)] rounded-xl p-3.5 sm:p-4 shadow-[var(--dynamic-card-shadow)] cursor-pointer active:scale-[0.99] transition-all hover:shadow-md relative overflow-hidden flex items-center gap-3.5 sm:gap-4"
                          style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                        >
                          {/* Left Payment Icon with equal space on top, bottom, and left */}
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                            <CreditCard size={22} className="stroke-[2.2]" />
                          </div>

                          {/* Center Details with equal spacing top/middle/bottom */}
                          <div className="flex-1 min-w-0 h-12 flex flex-col justify-between py-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className="font-black text-text-main text-sm truncate leading-tight">{partnerName}</p>
                              <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0 leading-none">
                                <Clock size={10} className="stroke-[2.5]" />
                                {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-text-muted leading-tight flex-wrap">
                              <span className="flex items-center gap-1 shrink-0 font-medium">
                                <Calendar size={12} className="text-slate-400" />
                                {item.date} • {item.time}
                              </span>
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                                {item.method || (language === 'bn' ? 'বিল পেমেন্ট' : 'Bill Payment')}
                              </span>
                              {item.remarks && (
                                <span className="flex items-center gap-1 truncate text-text-muted text-[10px] max-w-[120px]">
                                  <FileText size={10} className="text-slate-400 shrink-0" />
                                  <span className="truncate">{item.remarks}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right Side: Vertically Centered Amount */}
                          <div className="text-right shrink-0 h-12 flex items-center justify-center pl-1 my-auto">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-base md:text-lg whitespace-nowrap leading-none">
                              +{item.amount} <span className="text-[10px] font-bold text-text-muted">QAR</span>
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedPendingPurchase(item);
                          setIsPendingDetailsModalOpen(true);
                        }}
                        className="bg-theme-card border border-[var(--dynamic-card-border)] rounded-xl p-3.5 sm:p-4 shadow-[var(--dynamic-card-shadow)] cursor-pointer active:scale-[0.99] transition-all hover:shadow-md relative overflow-hidden flex items-center gap-3.5 sm:gap-4"
                        style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
                      >
                        {/* Left Marketing Icon with equal space on top, bottom, and left */}
                        <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                          <ShoppingCart size={22} className="stroke-[2.2]" />
                        </div>

                        {/* Center Details with equal spacing top/middle/bottom */}
                        <div className="flex-1 min-w-0 h-12 flex flex-col justify-between py-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p className="font-black text-text-main text-sm truncate leading-tight">{partnerName}</p>
                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0 leading-none">
                              <Clock size={10} className="stroke-[2.5]" />
                              {language === 'bn' ? 'পেন্ডিং' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-text-muted leading-tight flex-wrap">
                            <span className="flex items-center gap-1 shrink-0 font-medium">
                              <Calendar size={12} className="text-slate-400" />
                              {item.date} • {item.time}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="flex items-center gap-1 font-semibold text-purple-600 dark:text-purple-400 shrink-0">
                              <Package size={11} className="shrink-0" />
                              <span>{item.items?.length || 0} {language === 'bn' ? 'আইটেম' : 'Items'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Right Side: Vertically Centered Amount */}
                        <div className="text-right shrink-0 h-12 flex items-center justify-center pl-1 my-auto">
                          <span className="font-black text-purple-600 dark:text-purple-400 text-base md:text-lg whitespace-nowrap leading-none">
                            {item.amount} <span className="text-[10px] font-bold text-text-muted">QAR</span>
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 border border-dashed border-border-main/50 rounded-xl bg-card-bg shadow-[var(--dynamic-card-shadow)]">
                    <p className="text-text-muted text-sm font-bold">No Pending Approvals</p>
                  </div>
                )}
              </div>
            )}
          </>
        </div>

      </div>

      {/* FAB and Menus (PORTALED TO COVER BOTTOM NAV & SCREEN) */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Full-screen Soft/Light Backdrop Blur */}
          <AnimatePresence>
            {isFabMenuOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setIsFabMenuOpen(false)} 
                className="fixed inset-0 z-[1200] bg-black/10 backdrop-blur-[2px] cursor-pointer"
              />
            )}
          </AnimatePresence>

          <div className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] right-6 z-[1250]">
            <AnimatePresence>
              {isFabMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 15 }}
                  transition={{ duration: 0.18 }}
                  className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
                >
                  <button
                    onClick={handleOpenPurchase}
                    className="flex items-center justify-end gap-3 group cursor-pointer"
                  >
                    <span className="bg-card-bg text-text-main px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-border-main/50">
                      Purchase
                    </span>
                    <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg border-2 border-white/20">
                      <ShoppingCart size={20} />
                    </div>
                  </button>

                  <button
                    onClick={handleOpenPayBill}
                    className="flex items-center justify-end gap-3 group cursor-pointer"
                  >
                    <span className="bg-card-bg text-text-main px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-border-main/50">
                      {t('PAY_BILL')}
                    </span>
                    <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg border-2 border-white/20">
                      <Banknote size={20} />
                    </div>
                  </button>
                  
                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                    <button
                      onClick={handleOpenNewPartner}
                      className="flex items-center justify-end gap-3 group cursor-pointer"
                    >
                      <span className="bg-card-bg text-text-main px-3 py-1.5 rounded-lg text-xs font-bold shadow-md border border-border-main/50">
                        New Partner
                      </span>
                      <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg border-2 border-white/20">
                        <Users size={20} />
                      </div>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
              className={`w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl transition-transform active:scale-95 cursor-pointer ${isFabMenuOpen ? 'rotate-45' : ''}`}
            >
              <Plus size={24} className="stroke-[3px]" />
            </button>
          </div>
        </>,
        document.body
      )}

      {renderModals()}
    </div>
  );
}
