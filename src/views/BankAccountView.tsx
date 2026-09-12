import React, { useState, useMemo } from 'react';
import { 
  Landmark, 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard, 
  Smartphone, 
  Monitor, 
  MapPin, 
  Info, 
  ArrowLeft, 
  Building2,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Download,
  Globe,
  User as UserIcon,
  Lock,
  Mail,
  Phone,
  Hash,
  Calendar,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { useStore } from '@/store';
import { TRANSLATIONS } from '@/translations';
import { BankAccount } from '@/types';
import Button from '@/components/Button';
import FormWindow from '@/components/FormWindow';
import InputField from '@/components/InputField';
import SearchBar from '@/components/SearchBar';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import { BankBrandIcon } from '@/components/BankBrandIcon';
import { WORLD_COUNTRIES } from '@/utils/countryUtils';

// Standard System Dropdown Options
const BANK_NAMES = [
  'Dutch-Bangla Bank',
  'BRAC Bank',
  'Islami Bank Bangladesh',
  'City Bank',
  'Eastern Bank',
  'Standard Chartered',
  'HSBC',
  'Mutual Trust Bank',
  'Prime Bank',
  'Sonali Bank',
  'Agrani Bank',
  'Janata Bank',
  'Rupali Bank',
  'Bank Asia',
  'Dhaka Bank',
  'United Commercial Bank (UCB)',
  'Southeast Bank',
  'Trust Bank',
  'National Bank',
  'Pubali Bank',
  'AB Bank',
  'Commercial Bank of Qatar',
  'Qatar National Bank (QNB)',
  'Doha Bank',
  'Al Rayan Bank',
  'Other Bank'
];

const ACCOUNT_TYPES = [
  'Savings Account',
  'Current Account',
  'Salary Account',
  'Fixed Deposit Account (FDR)',
  'Recurring Deposit (DPS)',
  'Business Account',
  'Student Account',
  'Foreign Currency Account',
  'Loan Account',
  'Other'
];

const ACCOUNT_STATUSES = [
  'Active',
  'Inactive',
  'Dormant',
  'Frozen',
  'Closed'
];

const CARD_TYPES = [
  'Debit Card',
  'Credit Card',
  'Prepaid Card',
  'Dual Currency Card',
  'Virtual Card'
];

const CARD_STATUSES = [
  'Active',
  'Inactive',
  'Blocked',
  'Expired',
  'Pending Activation'
];

const MOBILE_PROVIDERS = [
  'bKash',
  'Nagad',
  'Rocket (DBBL)',
  'Upay (UCB)',
  'CellFin (IBBL)',
  'SureCash',
  'TAP',
  'Other Wallet'
];

const MOBILE_STATUSES = [
  'Active',
  'Inactive',
  'Suspended'
];

const I_BANKING_STATUSES = [
  'Active',
  'Inactive',
  'Locked',
  'Pending Registration'
];

const POPULAR_BRANCHES = [
  'Principal / Main Branch',
  'Motijheel Branch',
  'Dilkusha Branch',
  'Gulshan Branch',
  'Gulshan-1 Branch',
  'Gulshan-2 Branch',
  'Banani Branch',
  'Dhanmondi Branch',
  'Uttara Branch',
  'Mirpur Branch',
  'Karwan Bazar Branch',
  'Mohakhali Branch',
  'Elephant Road Branch',
  'Kakrail Branch',
  'Agrabad Branch (Chattogram)',
  'Khatunganj Branch (Chattogram)',
  'GEC Circle Branch (Chattogram)',
  'Sylhet Main Branch',
  'Zindabazar Branch (Sylhet)',
  'Rajshahi Branch',
  'Khulna Main Branch',
  'Bogura Branch',
  'Barishal Branch',
  'Rangpur Branch',
  'Comilla Branch',
  'Narayanganj Branch',
  'Gazipur Branch',
  'Savar Branch',
  'Cox\'s Bazar Branch',
  'Doha Main Branch (Qatar)',
  'Corporate Branch'
];

// Helper to mask sensitive numbers
const maskAccountNumber = (accNo?: string) => {
  if (!accNo) return '-';
  const clean = accNo.trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  const firstCount = Math.min(8, Math.max(4, clean.length - 4));
  return '•••• '.repeat(Math.ceil(firstCount / 4)) + last4;
};

const maskCardNumber = (cardNo?: string) => {
  if (!cardNo) return '-';
  const clean = cardNo.replace(/\s+/g, '');
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return '•••• •••• •••• ' + last4;
};

// Known App / Play Store link lookup
const DEFAULT_APP_LINKS: Record<string, string> = {
  'bkash': 'https://play.google.com/store/apps/details?id=com.bkash.app',
  'nagad': 'https://play.google.com/store/apps/details?id=com.konapayment.nagad',
  'rocket': 'https://play.google.com/store/apps/details?id=com.dbbl.mbb.mobilebanking',
  'rocket (dbbl)': 'https://play.google.com/store/apps/details?id=com.dbbl.mbb.mobilebanking',
  'upay': 'https://play.google.com/store/apps/details?id=com.ucb.upay',
  'upay (ucb)': 'https://play.google.com/store/apps/details?id=com.ucb.upay',
  'cellfin': 'https://play.google.com/store/apps/details?id=com.ibbl.cellfin',
  'cellfin (ibbl)': 'https://play.google.com/store/apps/details?id=com.ibbl.cellfin',
  'surecash': 'https://play.google.com/store/apps/details?id=com.progoti.surecash',
  'tap': 'https://play.google.com/store/apps/details?id=bd.com.pbl.tap',
  'dutch-bangla bank': 'https://play.google.com/store/apps/details?id=com.dbbl.nexuspay',
  'brac bank': 'https://play.google.com/store/apps/details?id=com.bracbank.astha',
  'islami bank bangladesh': 'https://play.google.com/store/apps/details?id=com.ibbl.cellfin',
  'city bank': 'https://play.google.com/store/apps/details?id=com.thecitybank.citytouch',
  'eastern bank': 'https://play.google.com/store/apps/details?id=com.ebl.skybanking',
  'standard chartered': 'https://play.google.com/store/apps/details?id=com.sc.scmobile.bd',
  'mutual trust bank': 'https://play.google.com/store/apps/details?id=com.mtb.mtbsmartbanking',
  'prime bank': 'https://play.google.com/store/apps/details?id=com.primebank.myprime',
  'bank asia': 'https://play.google.com/store/apps/details?id=com.bankasia.smartapp',
  'united commercial bank (ucb)': 'https://play.google.com/store/apps/details?id=com.ucb.upay',
};

const handleOpenApp = (customLink?: string, appName?: string, providerOrBankName?: string) => {
  let url = (customLink || '').trim();

  if (!url) {
    const key1 = (appName || '').trim().toLowerCase();
    const key2 = (providerOrBankName || '').trim().toLowerCase();
    
    if (key1 && DEFAULT_APP_LINKS[key1]) {
      url = DEFAULT_APP_LINKS[key1];
    } else if (key2 && DEFAULT_APP_LINKS[key2]) {
      url = DEFAULT_APP_LINKS[key2];
    } else {
      const matchedKey = Object.keys(DEFAULT_APP_LINKS).find(k => 
        (key1 && (k.includes(key1) || key1.includes(k))) || 
        (key2 && (k.includes(key2) || key2.includes(k)))
      );
      if (matchedKey) {
        url = DEFAULT_APP_LINKS[matchedKey];
      } else {
        const query = encodeURIComponent(appName || providerOrBankName || 'banking app');
        url = `https://play.google.com/store/search?q=${query}&c=apps`;
      }
    }
  }

  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.includes('://')) {
      url = 'https://' + url;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

type TabType = 'ACCOUNT_INFO' | 'CARD_INFO' | 'MOBILE_BANKING_INFO' | 'I_BANKING_INFO' | 'BRANCH_INFO';

const BankAccountView: React.FC = () => {
  const { 
    user, 
    bankAccounts, 
    allBankAccounts, 
    addBankAccount, 
    updateBankAccount, 
    removeBankAccount, 
    language, 
    setConfirmModal, 
    showFeedback 
  } = useStore();

  const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] || TRANSLATIONS['en'];
  const accounts = user?.role === 'ADMIN' ? allBankAccounts : bankAccounts;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // View state: 'LIST' or 'DETAILS'
  const [activeView, setActiveView] = useState<'LIST' | 'DETAILS'>('LIST');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('ACCOUNT_INFO');
  const [showFullNumbers, setShowFullNumbers] = useState<boolean>(false);

  // Form state (Full Form vs Section Form)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BankAccount | null>(null);
  const [editingSection, setEditingSection] = useState<TabType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dropdown modal triggers
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [showBankSelect, setShowBankSelect] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  const [showStatusSelect, setShowStatusSelect] = useState(false);
  const [showCardTypeSelect, setShowCardTypeSelect] = useState(false);
  const [showCardStatusSelect, setShowCardStatusSelect] = useState(false);
  const [showMobileProviderSelect, setShowMobileProviderSelect] = useState(false);
  const [showMobileStatusSelect, setShowMobileStatusSelect] = useState(false);
  const [showIBankingStatusSelect, setShowIBankingStatusSelect] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState<Partial<BankAccount>>({
    country: 'Bangladesh',
    accountHolderName: '',
    bankName: '',
    accountNumber: '',
    accountType: 'Savings Account',
    accountStatus: 'Active',
    cardHolderName: '',
    cardNumber: '',
    cardType: 'Debit Card',
    cardExpiryDate: '',
    cardStatus: 'Active',
    mobileProviderName: '',
    mobileRegisteredNumber: '',
    mobileAccountNumber: '',
    mobilePin: '',
    mobileStatus: 'Active',
    mobileAppName: '',
    mobileAppLink: '',
    ibankingUserId: '',
    ibankingPassword: '',
    ibankingTpin: '',
    ibankingRegisteredContact: '',
    ibankingRegisteredMobile: '',
    ibankingRegisteredEmail: '',
    ibankingStatus: 'Active',
    ibankingAppName: '',
    ibankingAppLink: '',
    branchName: '',
    branchCode: '',
    routingNumber: '',
    branchAddress: '',
    branchContactNumber: '',
    assistantOfficerNumber: '',
    branchManagerNumber: ''
  });

  const [isGeneratingSlip, setIsGeneratingSlip] = useState(false);

  // Extract dynamically saved branches + popular branches list
  const branchOptions = useMemo(() => {
    const existingBranches = accounts
      .map(a => a.branchName)
      .filter((b): b is string => !!b && b.trim().length > 0);
    return Array.from(new Set([...POPULAR_BRANCHES, ...existingBranches]));
  }, [accounts]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const bank = (account.bankName || '').toLowerCase();
      const holder = (account.accountHolderName || account.accountName || '').toLowerCase();
      const accNum = (account.accountNumber || '').toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch = !query || bank.includes(query) || holder.includes(query) || accNum.includes(query);
      
      if (!matchesSearch) return false;

      if (statusFilter === 'All') return true;
      if (statusFilter === 'Active') return (account.accountStatus || 'Active').toLowerCase() === 'active';
      if (statusFilter === 'Inactive') return (account.accountStatus || '').toLowerCase() !== 'active';

      return true;
    });
  }, [accounts, searchQuery, statusFilter]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  const handleOpenForm = (account?: BankAccount) => {
    if (account) {
      setEditingItem(account);
      setFormData({
        country: account.country || 'Bangladesh',
        accountHolderName: account.accountHolderName || account.accountName || '',
        bankName: account.bankName || '',
        accountNumber: account.accountNumber || '',
        accountType: account.accountType || 'Savings Account',
        accountStatus: account.accountStatus || 'Active',
        cardHolderName: account.cardHolderName || '',
        cardNumber: account.cardNumber || '',
        cardType: account.cardType || 'Debit Card',
        cardExpiryDate: account.cardExpiryDate || '',
        cardStatus: account.cardStatus || 'Active',
        mobileProviderName: account.mobileProviderName || '',
        mobileRegisteredNumber: account.mobileRegisteredNumber || '',
        mobileAccountNumber: account.mobileAccountNumber || '',
        mobilePin: account.mobilePin || '',
        mobileStatus: account.mobileStatus || 'Active',
        mobileAppName: account.mobileAppName || '',
        mobileAppLink: account.mobileAppLink || '',
        ibankingUserId: account.ibankingUserId || '',
        ibankingPassword: account.ibankingPassword || '',
        ibankingTpin: account.ibankingTpin || '',
        ibankingRegisteredContact: account.ibankingRegisteredContact || '',
        ibankingRegisteredMobile: account.ibankingRegisteredMobile || '',
        ibankingRegisteredEmail: account.ibankingRegisteredEmail || '',
        ibankingStatus: account.ibankingStatus || 'Active',
        ibankingAppName: account.ibankingAppName || '',
        ibankingAppLink: account.ibankingAppLink || '',
        branchName: account.branchName || '',
        branchCode: account.branchCode || '',
        routingNumber: account.routingNumber || '',
        branchAddress: account.branchAddress || '',
        branchContactNumber: account.branchContactNumber || '',
        assistantOfficerNumber: account.assistantOfficerNumber || '',
        branchManagerNumber: account.branchManagerNumber || ''
      });
    } else {
      setEditingItem(null);
      setFormData({
        country: 'Bangladesh',
        accountHolderName: user?.name || '',
        bankName: '',
        accountNumber: '',
        accountType: 'Savings Account',
        accountStatus: 'Active',
        cardHolderName: '',
        cardNumber: '',
        cardType: 'Debit Card',
        cardExpiryDate: '',
        cardStatus: 'Active',
        mobileProviderName: '',
        mobileRegisteredNumber: '',
        mobileAccountNumber: '',
        mobileStatus: 'Active',
        mobileAppName: '',
        mobileAppLink: '',
        ibankingUserId: '',
        ibankingRegisteredContact: '',
        ibankingRegisteredMobile: '',
        ibankingRegisteredEmail: '',
        ibankingStatus: 'Active',
        ibankingAppName: '',
        ibankingAppLink: '',
        branchName: '',
        branchCode: '',
        routingNumber: '',
        branchAddress: '',
        branchContactNumber: '',
        assistantOfficerNumber: '',
        branchManagerNumber: ''
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  // Section-specific form open handler
  const handleOpenSectionForm = (section: TabType) => {
    if (!selectedAccount) return;
    setEditingSection(section);
    setFormData({
      country: selectedAccount.country || 'Bangladesh',
      accountHolderName: selectedAccount.accountHolderName || selectedAccount.accountName || '',
      bankName: selectedAccount.bankName || '',
      accountNumber: selectedAccount.accountNumber || '',
      accountType: selectedAccount.accountType || 'Savings Account',
      accountStatus: selectedAccount.accountStatus || 'Active',
      cardHolderName: selectedAccount.cardHolderName || '',
      cardNumber: selectedAccount.cardNumber || '',
      cardType: selectedAccount.cardType || 'Debit Card',
      cardExpiryDate: selectedAccount.cardExpiryDate || '',
      cardStatus: selectedAccount.cardStatus || 'Active',
      mobileProviderName: selectedAccount.mobileProviderName || '',
      mobileRegisteredNumber: selectedAccount.mobileRegisteredNumber || '',
      mobileAccountNumber: selectedAccount.mobileAccountNumber || '',
      mobilePin: selectedAccount.mobilePin || '',
      mobileStatus: selectedAccount.mobileStatus || 'Active',
      mobileAppName: selectedAccount.mobileAppName || '',
      mobileAppLink: selectedAccount.mobileAppLink || '',
      ibankingUserId: selectedAccount.ibankingUserId || '',
      ibankingPassword: selectedAccount.ibankingPassword || '',
      ibankingTpin: selectedAccount.ibankingTpin || '',
      ibankingRegisteredContact: selectedAccount.ibankingRegisteredContact || '',
      ibankingRegisteredMobile: selectedAccount.ibankingRegisteredMobile || '',
      ibankingRegisteredEmail: selectedAccount.ibankingRegisteredEmail || '',
      ibankingStatus: selectedAccount.ibankingStatus || 'Active',
      ibankingAppName: selectedAccount.ibankingAppName || '',
      ibankingAppLink: selectedAccount.ibankingAppLink || '',
      branchName: selectedAccount.branchName || '',
      branchCode: selectedAccount.branchCode || '',
      routingNumber: selectedAccount.routingNumber || '',
      branchAddress: selectedAccount.branchAddress || '',
      branchContactNumber: selectedAccount.branchContactNumber || '',
      assistantOfficerNumber: selectedAccount.assistantOfficerNumber || '',
      branchManagerNumber: selectedAccount.branchManagerNumber || ''
    });
  };

  const handleCloseSectionForm = () => {
    setEditingSection(null);
  };

  const handleFieldChange = (field: keyof BankAccount, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Save handler for section-specific updates
  const handleSaveSection = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedAccount || !editingSection) return;

    if (editingSection === 'ACCOUNT_INFO') {
      if (!formData.accountHolderName?.trim() || !formData.accountNumber?.trim() || !formData.bankName?.trim()) {
        showFeedback(language === 'bn' ? 'অনুগ্রহ করে আবশ্যক তথ্য পূরণ করুন।' : 'Please fill in all required fields.', 'error');
        return;
      }
    }

    setIsSaving(true);
    const now = new Date().toISOString();

    try {
      let updatedAccount: BankAccount = {
        ...selectedAccount,
        updatedAt: now
      };

      if (editingSection === 'ACCOUNT_INFO') {
        updatedAccount = {
          ...updatedAccount,
          country: formData.country || 'Bangladesh',
          accountHolderName: formData.accountHolderName?.trim() || '',
          accountName: formData.accountHolderName?.trim() || '',
          bankName: formData.bankName?.trim() || '',
          accountNumber: formData.accountNumber?.trim() || '',
          accountType: formData.accountType || 'Savings Account',
          accountStatus: formData.accountStatus || 'Active'
        };
      } else if (editingSection === 'BRANCH_INFO') {
        updatedAccount = {
          ...updatedAccount,
          branchName: formData.branchName?.trim() || '',
          branchCode: formData.branchCode?.trim() || '',
          routingNumber: formData.routingNumber?.trim() || '',
          branchAddress: formData.branchAddress?.trim() || '',
          branchContactNumber: formData.branchContactNumber?.trim() || '',
          assistantOfficerNumber: formData.assistantOfficerNumber?.trim() || '',
          branchManagerNumber: formData.branchManagerNumber?.trim() || ''
        };
      } else if (editingSection === 'CARD_INFO') {
        updatedAccount = {
          ...updatedAccount,
          cardHolderName: formData.cardHolderName?.trim() || '',
          cardNumber: formData.cardNumber?.trim() || '',
          cardType: formData.cardType || 'Debit Card',
          cardExpiryDate: formData.cardExpiryDate?.trim() || '',
          cardStatus: formData.cardStatus || 'Active'
        };
      } else if (editingSection === 'MOBILE_BANKING_INFO') {
        updatedAccount = {
          ...updatedAccount,
          mobileProviderName: formData.mobileProviderName?.trim() || '',
          mobileRegisteredNumber: formData.mobileRegisteredNumber?.trim() || '',
          mobileAccountNumber: formData.mobileAccountNumber?.trim() || '',
          mobilePin: formData.mobilePin?.trim() || '',
          mobileStatus: formData.mobileStatus || 'Active',
          mobileAppName: formData.mobileAppName?.trim() || '',
          mobileAppLink: formData.mobileAppLink?.trim() || ''
        };
      } else if (editingSection === 'I_BANKING_INFO') {
        updatedAccount = {
          ...updatedAccount,
          ibankingUserId: formData.ibankingUserId?.trim() || '',
          ibankingPassword: formData.ibankingPassword?.trim() || '',
          ibankingTpin: formData.ibankingTpin?.trim() || '',
          ibankingRegisteredContact: formData.ibankingRegisteredMobile?.trim() || formData.ibankingRegisteredContact?.trim() || '',
          ibankingRegisteredMobile: formData.ibankingRegisteredMobile?.trim() || '',
          ibankingRegisteredEmail: formData.ibankingRegisteredEmail?.trim() || '',
          ibankingStatus: formData.ibankingStatus || 'Active',
          ibankingAppName: formData.ibankingAppName?.trim() || '',
          ibankingAppLink: formData.ibankingAppLink?.trim() || ''
        };
      }

      updateBankAccount(updatedAccount);
      showFeedback(language === 'bn' ? 'তথ্য সফলভাবে আপডেট করা হয়েছে।' : 'Information updated successfully.', 'success');
      handleCloseSectionForm();
    } catch (err: any) {
      showFeedback(err.message || 'Operation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Premium High-Resolution Account Slip Image Download Function
  const handleDownloadAccountSlip = async () => {
    if (!selectedAccount) return;
    setIsGeneratingSlip(true);

    try {
      const holder = selectedAccount.accountHolderName || selectedAccount.accountName || user?.name || 'Account Holder';
      const bank = selectedAccount.bankName || 'Bank Account';
      const branch = selectedAccount.branchName || 'Main Branch';
      const accNum = selectedAccount.accountNumber || 'N/A';
      const routing = selectedAccount.routingNumber || 'N/A';
      const accType = selectedAccount.accountType || 'Savings Account';
      const country = selectedAccount.country || 'Bangladesh';

      // All fields to be cleanly rendered
      const rows: Array<{ labelBn: string; labelEn: string; value: string; isHighlight?: boolean; isMono?: boolean }> = [
        { labelBn: 'দেশ', labelEn: 'Country', value: country },
        { labelBn: 'অ্যাকাউন্ট হোল্ডারের নাম', labelEn: 'Account Holder Name', value: holder },
        { labelBn: 'ব্যাংকের নাম', labelEn: 'Bank Name', value: bank },
        { labelBn: 'শাখার নাম', labelEn: 'Branch Name', value: branch },
        { labelBn: 'অ্যাকাউন্ট নম্বর', labelEn: 'Account Number', value: accNum, isHighlight: true, isMono: true },
        { labelBn: 'রাউটিং নম্বর', labelEn: 'Routing Number', value: routing, isMono: true },
        { labelBn: 'অ্যাকাউন্টের ধরন', labelEn: 'Account Type', value: accType }
      ];

      // Proportional and compact dimensions (No extra height, no excessive width)
      const width = 640;
      const contentLeft = 36;
      const contentRight = width - 36;
      const topPadding = 22;
      const headerH = 95;
      const footerH = 75;
      const rowGap = 10;

      let computedHeight = topPadding + headerH + 16;
      rows.forEach(r => {
        computedHeight += (r.isHighlight ? 66 : 46) + rowGap;
      });
      computedHeight += footerH + 16;

      const height = Math.round(computedHeight);
      const scale = 2; // 2x high-resolution supersampling for ultra crispness
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.scale(scale, scale);

      // 1. Pure White Card Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Card outer frame border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, width - 2, height - 2);

      // Top decorative primary header bar
      const topGrad = ctx.createLinearGradient(0, 0, width, 0);
      topGrad.addColorStop(0, '#0284c7');
      topGrad.addColorStop(0.5, '#0369a1');
      topGrad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, 5);

      // 2. Header Content
      let currentY = topPadding + 24;

      // Bank Name (Bold, High Contrast)
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(bank.toUpperCase(), width / 2, currentY);

      currentY += 25;
      // Transfer Details Badge
      const badgeText = 'BANK ACCOUNT & TRANSFER DETAILS • ব্যাংক হিসাব বিবরণী';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const badgeW = ctx.measureText(badgeText).width + 28;
      const badgeH = 22;
      const badgeX = (width - badgeW) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(badgeX, currentY - 14, badgeW, badgeH, 11);
      ctx.fillStyle = '#f0f9ff';
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#0284c7';
      ctx.fillText(badgeText, width / 2, currentY + 1);

      currentY += 30;

      // Header Bottom Divider
      ctx.beginPath();
      ctx.moveTo(contentLeft, currentY);
      ctx.lineTo(contentRight, currentY);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      currentY += 18;

      // 3. Render Data Rows (Left-aligned Labels, Right-aligned Values)
      rows.forEach(r => {
        if (r.isHighlight) {
          const boxH = 64;
          // Highlight Box for Core Account Number (For Payee/Sender)
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(contentLeft, currentY - 12, contentRight - contentLeft, boxH, 10);
          ctx.fillStyle = '#f0fdf4'; // subtle soft mint highlight
          ctx.fill();
          ctx.strokeStyle = '#86efac';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();

          // Left Label
          ctx.textAlign = 'left';
          ctx.fillStyle = '#15803d';
          ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(r.labelBn, contentLeft + 16, currentY + 14);

          ctx.fillStyle = '#16a34a';
          ctx.font = '500 11px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(r.labelEn, contentLeft + 16, currentY + 31);

          // Right Value (Prominent Core Account Number)
          ctx.textAlign = 'right';
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 21px "Courier New", Courier, monospace';
          ctx.fillText(r.value, contentRight - 16, currentY + 25);

          currentY += boxH + rowGap;
        } else {
          const rowH = 44;

          // Left Label
          ctx.textAlign = 'left';
          ctx.fillStyle = '#475569';
          ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(r.labelBn, contentLeft, currentY + 12);

          ctx.fillStyle = '#94a3b8';
          ctx.font = 'normal 11px -apple-system, BlinkMacSystemFont, sans-serif';
          ctx.fillText(r.labelEn, contentLeft, currentY + 27);

          // Right Value
          ctx.textAlign = 'right';
          ctx.fillStyle = '#0f172a';
          ctx.font = r.isMono 
            ? 'bold 15px "Courier New", Courier, monospace' 
            : 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(r.value, contentRight, currentY + 21);

          // Row Divider
          ctx.beginPath();
          ctx.moveTo(contentLeft, currentY + 35);
          ctx.lineTo(contentRight, currentY + 35);
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1;
          ctx.stroke();

          currentY += rowH + rowGap;
        }
      });

      // 4. Compact Footer (Verification & Timestamp)
      currentY += 8;
      ctx.beginPath();
      ctx.moveTo(contentLeft, currentY);
      ctx.lineTo(contentRight, currentY);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      currentY += 24;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('✓ Verified Bank Payee Slip • Generated via FleetPro', width / 2, currentY);

      currentY += 18;
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'normal 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`Generated: ${dateStr}, ${timeStr} • Please verify details before fund transfer`, width / 2, currentY);

      // 5. Download PNG file
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const cleanBank = bank.replace(/[^a-zA-Z0-9]/g, '_');
      const cleanAcc = accNum.replace(/[^a-zA-Z0-9]/g, '');
      link.download = `Bank_Slip_${cleanBank}_${cleanAcc || 'account'}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showFeedback(
        language === 'bn' 
          ? 'প্রিমিয়াম ব্যাংক স্লিপ কার্ড ইমেজ সফলভাবে ডাউনলোড হয়েছে।' 
          : 'Premium bank slip card downloaded successfully.', 
        'success'
      );
    } catch (error: any) {
      console.error('Error generating slip image:', error);
      showFeedback(language === 'bn' ? 'ইমেজ তৈরিতে ত্রুটি হয়েছে।' : 'Failed to generate slip image.', 'error');
    } finally {
      setIsGeneratingSlip(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.accountHolderName?.trim() || !formData.accountNumber?.trim() || !formData.bankName?.trim()) {
      showFeedback(language === 'bn' ? 'অনুগ্রহ করে আবশ্যক তথ্য পূরণ করুন।' : 'Please fill in all required fields.', 'error');
      return;
    }

    setIsSaving(true);
    const now = new Date().toISOString();

    try {
      if (editingItem) {
        const updatedAccount: BankAccount = {
          ...editingItem,
          ...(formData as any),
          accountName: formData.accountHolderName,
          updatedAt: now
        };
        updateBankAccount(updatedAccount);
        showFeedback(language === 'bn' ? 'অ্যাকাউন্ট সফলভাবে আপডেট করা হয়েছে।' : 'Bank account updated successfully.', 'success');
      } else {
        const newAccount: BankAccount = {
          id: crypto.randomUUID(),
          userId: user?.id || '',
          country: formData.country || 'Bangladesh',
          accountHolderName: formData.accountHolderName?.trim() || '',
          accountName: formData.accountHolderName?.trim() || '',
          bankName: formData.bankName?.trim() || '',
          accountNumber: formData.accountNumber?.trim() || '',
          accountType: formData.accountType || 'Savings Account',
          accountStatus: formData.accountStatus || 'Active',
          cardHolderName: formData.cardHolderName?.trim() || '',
          cardNumber: formData.cardNumber?.trim() || '',
          cardType: formData.cardType || 'Debit Card',
          cardExpiryDate: formData.cardExpiryDate?.trim() || '',
          cardStatus: formData.cardStatus || 'Active',
          mobileProviderName: formData.mobileProviderName?.trim() || '',
          mobileRegisteredNumber: formData.mobileRegisteredNumber?.trim() || '',
          mobileAccountNumber: formData.mobileAccountNumber?.trim() || '',
          mobilePin: formData.mobilePin?.trim() || '',
          mobileStatus: formData.mobileStatus || 'Active',
          ibankingUserId: formData.ibankingUserId?.trim() || '',
          ibankingPassword: formData.ibankingPassword?.trim() || '',
          ibankingTpin: formData.ibankingTpin?.trim() || '',
          ibankingRegisteredContact: formData.ibankingRegisteredContact?.trim() || '',
          ibankingRegisteredMobile: formData.ibankingRegisteredMobile?.trim() || '',
          ibankingRegisteredEmail: formData.ibankingRegisteredEmail?.trim() || '',
          ibankingStatus: formData.ibankingStatus || 'Active',
          branchName: formData.branchName?.trim() || '',
          branchCode: formData.branchCode?.trim() || '',
          routingNumber: formData.routingNumber?.trim() || '',
          branchAddress: formData.branchAddress?.trim() || '',
          branchContactNumber: formData.branchContactNumber?.trim() || '',
          assistantOfficerNumber: formData.assistantOfficerNumber?.trim() || '',
          branchManagerNumber: formData.branchManagerNumber?.trim() || '',
          createdAt: now,
          updatedAt: now
        };
        addBankAccount(newAccount);
        showFeedback(language === 'bn' ? 'অ্যাকাউন্ট সফলভাবে সংরক্ষণ করা হয়েছে।' : 'Bank account saved successfully.', 'success');
      }
      handleCloseForm();
    } catch (err: any) {
      showFeedback(err.message || 'Operation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: language === 'bn' ? 'ব্যাংক অ্যাকাউন্ট মুছুন' : 'Delete Bank Account',
      message: language === 'bn' 
        ? 'আপনি কি নিশ্চিত যে আপনি এই ব্যাংক অ্যাকাউন্টটি মুছতে চান? এই কাজটি পুনরায় ফিরিয়ে আনা যাবে না।' 
        : 'Are you sure you want to delete this bank account? This action cannot be undone.',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          removeBankAccount(id, user?.id);
          showFeedback(language === 'bn' ? 'অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।' : 'Bank account deleted successfully.', 'success');
          if (selectedAccountId === id) {
            setActiveView('LIST');
            setSelectedAccountId(null);
          }
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'ACCOUNT_INFO', label: language === 'bn' ? 'অ্যাকাউন্ট তথ্য' : 'Account Info', icon: <Info size={18} /> },
    { id: 'BRANCH_INFO', label: language === 'bn' ? 'শাখার তথ্য' : 'Branch Info', icon: <MapPin size={18} /> },
    { id: 'CARD_INFO', label: language === 'bn' ? 'কার্ড তথ্য' : 'Card Info', icon: <CreditCard size={18} /> },
    { id: 'MOBILE_BANKING_INFO', label: language === 'bn' ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking', icon: <Smartphone size={18} /> },
    { id: 'I_BANKING_INFO', label: language === 'bn' ? 'ইন্টারনেট ব্যাংকিং' : 'I-Banking', icon: <Monitor size={18} /> },
  ];

  /* ==================== LIST VIEW ==================== */
  const renderList = () => (
    <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
      
      {/* Search and Action Row */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1">
          <SearchBar 
            label={language === 'bn' ? 'সার্চ' : 'Search'}
            activePlaceholder={language === 'bn' ? 'ব্যাংক বা অ্যাকাউন্ট নম্বর খুঁজুন...' : 'Search by bank or account number...'}
            value={searchQuery} 
            onChange={setSearchQuery} 
          />
        </div>
        
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleOpenForm()}
          icon={<Plus size={20} />}
          className="shrink-0 h-14 hidden sm:flex"
          title={language === 'bn' ? 'নতুন অ্যাকাউন্ট যোগ করুন' : 'Add Bank Account'}
        >
          {language === 'bn' ? 'অ্যাকাউন্ট যোগ' : 'Add Account'}
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
        <span className="text-[11px] font-black tracking-wider text-text-muted uppercase mr-1 flex items-center gap-1">
          <SlidersHorizontal size={12} /> {language === 'bn' ? 'ফিল্টার:' : 'Filters:'}
        </span>
        {(['All', 'Active', 'Inactive'] as const).map(tab => (
          <Button
            key={tab}
            variant={statusFilter === tab ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab)}
            className="shrink-0"
          >
            {tab === 'All' ? (language === 'bn' ? 'সকল' : 'All') : (tab === 'Active' ? (language === 'bn' ? 'সক্রিয়' : 'Active') : (language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'))}
          </Button>
        ))}
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl">
          <div className="w-16 h-16 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center mb-4 border border-sky-500/20">
            <Landmark size={32} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-text-main mb-1">
            {language === 'bn' ? 'কোনো ব্যাংক অ্যাকাউন্ট পাওয়া যায়নি' : 'No Bank Accounts Found'}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mb-6">
            {searchQuery 
              ? (language === 'bn' ? 'আপনার অনুসন্ধানের সাথে কোনো অ্যাকাউন্ট মেলেনি।' : 'No accounts matched your search criteria.')
              : (language === 'bn' 
                ? 'আপনার ব্যাংক অ্যাকাউন্ট, ডেবিট/ক্রেডিট কার্ড এবং মোবাইল ব্যাংকিং ওয়ালেট যুক্ত করতে নিচের বাটনে চাপুন।' 
                : 'Keep track of your bank account details, cards, mobile wallets, and branch information in one secure place.')}
          </p>
          <Button onClick={() => handleOpenForm()}>
            <Plus size={18} className="mr-2" />
            {language === 'bn' ? 'নতুন অ্যাকাউন্ট যোগ করুন' : 'Add Bank Account'}
          </Button>
        </div>
      ) : (
        /* Multi-column layout: Desktop: 3-col, Tablet: 2-col, Mobile: 1-col */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map(account => {
            const holderName = account.accountHolderName || account.accountName || 'Unknown Holder';
            const bankTitle = account.bankName || 'Unknown Bank';
            const maskedNumber = maskAccountNumber(account.accountNumber);
            const isActive = (account.accountStatus || 'Active').toLowerCase() === 'active';

            return (
              <div 
                key={account.id}
                id={`bank-card-${account.id}`}
                onClick={() => {
                  setSelectedAccountId(account.id);
                  setActiveTab('ACCOUNT_INFO');
                  setActiveView('DETAILS');
                }}
                className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl p-4 sm:p-5 cursor-pointer hover:brightness-105 active:scale-[0.99] transition-all flex flex-col justify-between group"
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 group-hover:scale-105 transition-transform">
                        <BankBrandIcon name={account.bankName} size="md" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-text-main truncate group-hover:text-sky-500 transition-colors">
                          {bankTitle}
                        </h3>
                        <p className="text-xs text-text-muted truncate">
                          {holderName}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {account.accountStatus || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Left & Right Aligned Data Section */}
                  <div className="space-y-2 pt-3 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-muted font-medium flex items-center gap-1.5">
                        <CreditCard size={13} className="text-emerald-500 shrink-0" />
                        {language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}
                      </span>
                      <span className="font-mono font-semibold text-text-main tracking-wider">
                        {maskedNumber}
                      </span>
                    </div>
                    
                    {account.accountType && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted font-medium flex items-center gap-1.5">
                          <Building2 size={13} className="text-sky-500 shrink-0" />
                          {language === 'bn' ? 'অ্যাকাউন্টের ধরন' : 'Account Type'}
                        </span>
                        <span className="text-text-main font-medium">
                          {account.accountType}
                        </span>
                      </div>
                    )}

                    {account.branchName && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted font-medium flex items-center gap-1.5">
                          <MapPin size={13} className="text-teal-500 shrink-0" />
                          {language === 'bn' ? 'শাখার নাম' : 'Branch Name'}
                        </span>
                        <span className="text-text-main font-medium truncate max-w-[160px] text-right">
                          {account.branchName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer action bar */}
                <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-sky-500 font-bold group-hover:translate-x-1 transition-transform">
                    {language === 'bn' ? 'বিস্তারিত দেখুন' : 'View Details'}
                    <ChevronRight size={14} />
                  </span>
                  
                  <div className="flex items-center gap-2 text-text-muted text-[11px]">
                    {account.cardNumber && (
                      <span className="flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-medium" title={language === 'bn' ? 'এটিএম কার্ড যুক্ত' : 'ATM Card Linked'}>
                        <CreditCard size={12} />
                        {language === 'bn' ? 'কার্ড' : 'Card'}
                      </span>
                    )}
                    {account.mobileAccountNumber && (
                      <span className="flex items-center gap-1 bg-pink-500/10 text-pink-600 dark:text-pink-400 px-2 py-0.5 rounded font-medium" title={language === 'bn' ? 'মোবাইল ওয়ালেট যুক্ত' : 'Mobile Wallet Linked'}>
                        <Smartphone size={12} />
                        {language === 'bn' ? 'ওয়ালেট' : 'Wallet'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (+ FAB) for Mobile & Tablet with Dynamic Safe Area Padding - ONLY visible when Form is closed */}
      {!isFormOpen && (
        <div className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] md:bottom-8 right-4 sm:right-6 z-[1250] lg:hidden">
          <button
            id="fab-add-bank-account"
            onClick={() => handleOpenForm()}
            className="w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-sky-400/20 cursor-pointer"
            aria-label="Add Bank Account"
          >
            <Plus size={26} />
          </button>
        </div>
      )}
    </div>
  );

  /* ==================== DETAILS VIEW ==================== */
  const renderDetails = () => {
    if (!selectedAccount) {
      return (
        <div className="max-w-7xl mx-auto w-full flex flex-col items-center justify-center py-16 text-center">
          <p className="text-text-muted mb-4">{language === 'bn' ? 'অ্যাকাউন্ট পাওয়া যায়নি' : 'Account not found'}</p>
          <Button onClick={() => setActiveView('LIST')}>
            <ArrowLeft size={16} className="mr-2" />
            {language === 'bn' ? 'তালিকায় ফিরে যান' : 'Back to List'}
          </Button>
        </div>
      );
    }

    const holderName = selectedAccount.accountHolderName || selectedAccount.accountName || 'Unknown';
    const isActive = (selectedAccount.accountStatus || 'Active').toLowerCase() === 'active';

    return (
      <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Details Top Bar Card */}
        <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="shrink-0">
                <BankBrandIcon name={selectedAccount.bankName} size="md" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap justify-between">
                  <h1 className="text-base sm:text-xl font-black text-text-main truncate">
                    {selectedAccount.bankName}
                  </h1>
                  <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedAccount.accountStatus || 'Active'}
                  </span>
                </div>
                <p className="text-xs text-text-muted truncate mt-0.5">
                  {holderName} • {showFullNumbers ? selectedAccount.accountNumber : maskAccountNumber(selectedAccount.accountNumber)}
                </p>
              </div>
            </div>

            {/* Equal Width Action Buttons across full card width */}
            <div className="grid grid-cols-3 gap-2 w-full pt-3 border-t border-black/5 dark:border-white/5">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setShowFullNumbers(!showFullNumbers)}
                icon={showFullNumbers ? <EyeOff size={15} /> : <Eye size={15} />}
                className="justify-center text-xs font-bold"
                title={showFullNumbers ? 'Hide sensitive data' : 'Show full numbers'}
              >
                {language === 'bn' ? (showFullNumbers ? 'লুকান' : 'দেখুন') : (showFullNumbers ? 'Hide' : 'View')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => handleOpenForm(selectedAccount)}
                icon={<Edit2 size={15} />}
                className="justify-center text-xs font-bold"
              >
                {language === 'bn' ? 'এডিট' : 'Edit'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                disabled={isDeleting}
                onClick={() => handleDelete(selectedAccount.id)}
                icon={<Trash2 size={15} />}
                className="justify-center text-xs font-bold"
              >
                {language === 'bn' ? 'মুছুন' : 'Delete'}
              </Button>
            </div>
          </div>

          {/* Global Tab Navigation */}
          <div className="border-t border-black/5 dark:border-white/5 mt-4 pt-2 flex overflow-x-auto scrollbar-none gap-1 sm:gap-2">
            {tabs.map(tab => {
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id.toLowerCase()}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-bold whitespace-nowrap rounded-lg transition-all ${
                    isCurrent 
                      ? 'bg-sky-500/10 text-sky-500 font-black' 
                      : 'text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* TAB 1: Core Account Info */}
          {activeTab === 'ACCOUNT_INFO' && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl p-4 sm:p-6 divide-y divide-black/5 dark:divide-white/5">
                <div className="pb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-sky-500" />
                    <h3 className="font-bold text-sm text-text-main">
                      {language === 'bn' ? 'অ্যাকাউন্টের বিবরণ' : 'Account Details'}
                    </h3>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    icon={<Edit2 size={14} />}
                    onClick={() => handleOpenSectionForm('ACCOUNT_INFO')}
                  >
                    {language === 'bn' ? 'তথ্য সম্পাদনা' : 'Edit Details'}
                  </Button>
                </div>
                <DetailRow label={language === 'bn' ? 'দেশ' : 'Country'} value={selectedAccount.country || 'Bangladesh'} icon={<Globe size={15} className="text-sky-500" />} />
                <DetailRow label={language === 'bn' ? 'অ্যাকাউন্ট হোল্ডারের নাম' : 'Account Holder Name'} value={holderName} icon={<UserIcon size={15} className="text-sky-500" />} />
                <DetailRow label={language === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name'} value={selectedAccount.bankName} icon={<Landmark size={15} className="text-sky-500" />} />
                <DetailRow label={language === 'bn' ? 'শাখার নাম' : 'Branch Name'} value={selectedAccount.branchName} icon={<MapPin size={15} className="text-teal-500" />} />
                <DetailRow 
                  label={language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'} 
                  value={showFullNumbers ? selectedAccount.accountNumber : maskAccountNumber(selectedAccount.accountNumber)} 
                  isMono 
                  icon={<CreditCard size={15} className="text-emerald-500" />}
                />
                {selectedAccount.routingNumber && (
                  <DetailRow label={language === 'bn' ? 'রাউটিং নম্বর' : 'Routing Number'} value={selectedAccount.routingNumber} isMono icon={<Hash size={15} className="text-blue-500" />} />
                )}
                <DetailRow label={language === 'bn' ? 'অ্যাকাউন্টের ধরন' : 'Account Type'} value={selectedAccount.accountType} icon={<Building2 size={15} className="text-sky-500" />} />
                <DetailRow label={language === 'bn' ? 'স্ট্যাটাস' : 'Status'} value={selectedAccount.accountStatus} icon={<Info size={15} className="text-emerald-500" />} />
              </div>

              {/* Full Width Download Account Slip Button */}
              <div className="pt-1">
                <Button
                  type="button"
                  size="lg"
                  onClick={handleDownloadAccountSlip}
                  disabled={isGeneratingSlip}
                  isLoading={isGeneratingSlip}
                  loadingText={language === 'bn' ? 'ইমেজ তৈরি হচ্ছে...' : 'Generating Image...'}
                  className="w-full h-13 sm:h-14 font-bold text-sm bg-gradient-to-r from-sky-600 via-sky-700 to-blue-700 hover:from-sky-700 hover:via-sky-800 hover:to-blue-800 text-white shadow-md justify-center gap-2 rounded-xl active:scale-[0.99] transition-all"
                  icon={<Download size={18} />}
                >
                  {language === 'bn' ? 'অ্যাকাউন্ট স্লিপ ইমেজ ডাউনলোড করুন' : 'Download Account Slip Image'}
                </Button>
              </div>
            </div>
          )}

          {/* TAB 2: Branch Info */}
          {activeTab === 'BRANCH_INFO' && (
            <div className="space-y-4 sm:space-y-6">
              {!selectedAccount.branchName && !selectedAccount.routingNumber && !selectedAccount.branchContactNumber && !selectedAccount.branchManagerNumber ? (
                <EmptyTabState 
                  icon={<MapPin size={36} />}
                  title={language === 'bn' ? 'কোনো শাখার তথ্য নেই' : 'No Branch Information'}
                  description={language === 'bn' ? 'ব্যাংকের নির্দিষ্ট শাখা, রাউটিং নম্বর, ঠিকানা ও কন্টাক্ট নম্বর যুক্ত করতে এডিট করুন।' : 'Branch name, routing number, address, or contact numbers have not been configured.'}
                  onAdd={() => handleOpenSectionForm('BRANCH_INFO')}
                  buttonLabel={language === 'bn' ? 'শাখার তথ্য যোগ করুন' : 'Add Branch Info'}
                />
              ) : (
                <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl p-4 sm:p-6 divide-y divide-black/5 dark:divide-white/5">
                  <div className="pb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-teal-500" />
                      <h3 className="font-bold text-sm text-text-main">
                        {language === 'bn' ? 'শাখা ও রাউটিং বিবরণ' : 'Branch & Routing Details'}
                      </h3>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      icon={<Edit2 size={14} />}
                      onClick={() => handleOpenSectionForm('BRANCH_INFO')}
                    >
                      {language === 'bn' ? 'তথ্য সম্পাদনা' : 'Edit Details'}
                    </Button>
                  </div>

                  <DetailRow label={language === 'bn' ? 'শাখার নাম' : 'Branch Name'} value={selectedAccount.branchName} icon={<MapPin size={15} className="text-teal-500" />} />
                  <DetailRow label={language === 'bn' ? 'শাখা কোড' : 'Branch Code'} value={selectedAccount.branchCode} isMono icon={<Hash size={15} className="text-teal-500" />} />
                  <DetailRow label={language === 'bn' ? 'রাউটিং নম্বর' : 'Routing Number'} value={selectedAccount.routingNumber} isMono icon={<Hash size={15} className="text-blue-500" />} />
                  <DetailRow label={language === 'bn' ? 'শাখার ঠিকানা' : 'Branch Address'} value={selectedAccount.branchAddress} icon={<Building2 size={15} className="text-teal-500" />} />
                  <DetailRow label={language === 'bn' ? 'ব্রাঞ্চ কন্টাক্ট নম্বর' : 'Branch Contact Number'} value={selectedAccount.branchContactNumber} isMono icon={<Phone size={15} className="text-teal-500" />} />
                  <DetailRow label={language === 'bn' ? 'অ্যাসিস্ট্যান্ট অফিসার নম্বর' : 'Assistant Officer Number'} value={selectedAccount.assistantOfficerNumber} isMono icon={<Phone size={15} className="text-teal-500" />} />
                  <DetailRow label={language === 'bn' ? 'ব্রাঞ্চ ম্যানেজার নম্বর' : 'Branch Manager Number'} value={selectedAccount.branchManagerNumber} isMono icon={<Phone size={15} className="text-teal-500" />} />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATM Card Info */}
          {activeTab === 'CARD_INFO' && (
            <div className="space-y-4 sm:space-y-6">
              {!selectedAccount.cardNumber && !selectedAccount.cardHolderName ? (
                <EmptyTabState 
                  icon={<CreditCard size={36} />}
                  title={language === 'bn' ? 'কোনো এটিএম কার্ড তথ্য নেই' : 'No ATM Card Details'}
                  description={language === 'bn' ? 'এই অ্যাকাউন্টের সাথে কোনো এটিএম কার্ডের তথ্য যুক্ত করা হয়নি।' : 'No ATM or Debit/Credit card has been associated with this account.'}
                  onAdd={() => handleOpenSectionForm('CARD_INFO')}
                  buttonLabel={language === 'bn' ? 'কার্ড তথ্য যোগ করুন' : 'Add Card Info'}
                />
              ) : (
                <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl p-4 sm:p-6 divide-y divide-black/5 dark:divide-white/5">
                  <div className="pb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className="text-purple-500" />
                      <h3 className="font-bold text-sm text-text-main">
                        {language === 'bn' ? 'কার্ডের বিবরণ' : 'ATM Card Details'}
                      </h3>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      icon={<Edit2 size={14} />}
                      onClick={() => handleOpenSectionForm('CARD_INFO')}
                    >
                      {language === 'bn' ? 'তথ্য সম্পাদনা' : 'Edit Details'}
                    </Button>
                  </div>

                  <DetailRow label={language === 'bn' ? 'কার্ড হোল্ডারের নাম' : 'Card Holder Name'} value={selectedAccount.cardHolderName || holderName} icon={<UserIcon size={15} className="text-purple-500" />} />
                  <DetailRow 
                    label={language === 'bn' ? 'কার্ড নম্বর' : 'Card Number'} 
                    value={showFullNumbers ? selectedAccount.cardNumber : maskCardNumber(selectedAccount.cardNumber)} 
                    isMono 
                    icon={<CreditCard size={15} className="text-purple-500" />}
                  />
                  <DetailRow label={language === 'bn' ? 'কার্ডের ধরন' : 'Card Type'} value={selectedAccount.cardType} icon={<CreditCard size={15} className="text-purple-500" />} />
                  <DetailRow label={language === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ' : 'Expiry Date'} value={selectedAccount.cardExpiryDate} isMono icon={<Calendar size={15} className="text-purple-500" />} />
                  <DetailRow label={language === 'bn' ? 'কার্ড স্ট্যাটাস' : 'Card Status'} value={selectedAccount.cardStatus} icon={<Info size={15} className="text-purple-500" />} />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Mobile Banking Info */}
          {activeTab === 'MOBILE_BANKING_INFO' && (
            <div className="space-y-4 sm:space-y-6">
              {!selectedAccount.mobileProviderName && !selectedAccount.mobileAccountNumber && !selectedAccount.mobileAppName ? (
                <EmptyTabState 
                  icon={<Smartphone size={36} />}
                  title={language === 'bn' ? 'কোনো মোবাইল ব্যাংকিং তথ্য নেই' : 'No Mobile Banking Details'}
                  description={language === 'bn' ? 'এই অ্যাকাউন্টের সাথে বিকাশ, নগদ বা রকেট ওয়ালেট যুক্ত নেই।' : 'No mobile wallet (bKash, Nagad, Rocket, etc.) is linked to this account.'}
                  onAdd={() => handleOpenSectionForm('MOBILE_BANKING_INFO')}
                  buttonLabel={language === 'bn' ? 'মোবাইল ব্যাংকিং যোগ করুন' : 'Add Mobile Banking'}
                />
              ) : (
                <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl p-4 sm:p-6 divide-y divide-black/5 dark:divide-white/5">
                  <div className="pb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Smartphone size={18} className="text-pink-500" />
                      <h3 className="font-bold text-sm text-text-main">
                        {language === 'bn' ? 'মোবাইল ব্যাংকিং বিবরণ' : 'Mobile Banking Details'}
                      </h3>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      icon={<Edit2 size={14} />}
                      onClick={() => handleOpenSectionForm('MOBILE_BANKING_INFO')}
                    >
                      {language === 'bn' ? 'তথ্য সম্পাদনা' : 'Edit Details'}
                    </Button>
                  </div>

                  <DetailRow label={language === 'bn' ? 'প্রোভাইডারের নাম' : 'Provider Name'} value={selectedAccount.mobileProviderName} icon={<Smartphone size={15} className="text-pink-500" />} />
                  <DetailRow label={language === 'bn' ? 'নিবন্ধিত মোবাইল নম্বর' : 'Registered Mobile'} value={selectedAccount.mobileRegisteredNumber} isMono icon={<Phone size={15} className="text-pink-500" />} />
                  <DetailRow label={language === 'bn' ? 'ওয়ালেট/অ্যাকাউন্ট নম্বর' : 'Wallet / Account Number'} value={selectedAccount.mobileAccountNumber} isMono icon={<Wallet size={15} className="text-pink-500" />} />
                  <DetailRow 
                    label={language === 'bn' ? 'পিন নম্বর' : 'PIN Number'} 
                    value={selectedAccount.mobilePin ? (showFullNumbers ? selectedAccount.mobilePin : '•••••') : ''} 
                    isMono 
                    icon={<Lock size={15} className="text-pink-500" />}
                  />
                  <DetailRow label={language === 'bn' ? 'অ্যাপ্লিকেশনের নাম' : 'Application Name'} value={selectedAccount.mobileAppName || selectedAccount.mobileProviderName} icon={<Smartphone size={15} className="text-pink-500" />} />
                  <DetailRow label={language === 'bn' ? 'স্ট্যাটাস' : 'Status'} value={selectedAccount.mobileStatus} icon={<Info size={15} className="text-pink-500" />} />

                  {/* Open App Action Row */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Smartphone size={15} className="text-pink-500 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-text-main truncate">
                          {selectedAccount.mobileAppName || (selectedAccount.mobileProviderName ? `${selectedAccount.mobileProviderName} App` : 'Mobile App')}
                        </h4>
                        <p className="text-[11px] text-text-muted truncate">
                          {language === 'bn' ? 'অ্যাপ ইনস্টল করা থাকলে ওপেন হবে বা প্লে স্টোরে যাবে' : 'Launches app or redirects to Play Store'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenApp(selectedAccount.mobileAppLink, selectedAccount.mobileAppName, selectedAccount.mobileProviderName)}
                      icon={<ExternalLink size={14} />}
                      className="bg-pink-600 hover:bg-pink-700 text-white w-full sm:w-auto font-bold px-3.5 py-1.5 shrink-0 justify-center text-xs"
                    >
                      {language === 'bn' ? 'ওপেন অ্যাপ' : 'Open App'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: I-Banking Info */}
          {activeTab === 'I_BANKING_INFO' && (
            <div className="space-y-4 sm:space-y-6">
              {!selectedAccount.ibankingUserId && !selectedAccount.ibankingRegisteredMobile && !selectedAccount.ibankingRegisteredEmail && !selectedAccount.ibankingRegisteredContact && !selectedAccount.ibankingAppName ? (
                <EmptyTabState 
                  icon={<Monitor size={36} />}
                  title={language === 'bn' ? 'কোনো ইন্টারনেট ব্যাংকিং তথ্য নেই' : 'No Internet Banking Details'}
                  description={language === 'bn' ? 'ইন্টারনেট ব্যাংকিং ইউজার আইডি বা তথ্য এখনো যুক্ত করা হয়নি।' : 'No online banking portal user credentials or contacts have been recorded.'}
                  onAdd={() => handleOpenSectionForm('I_BANKING_INFO')}
                  buttonLabel={language === 'bn' ? 'ই-ব্যাংকিং তথ্য যোগ করুন' : 'Add I-Banking Info'}
                />
              ) : (
                <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl p-4 sm:p-6 divide-y divide-black/5 dark:divide-white/5">
                  <div className="pb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Monitor size={18} className="text-amber-500" />
                      <h3 className="font-bold text-sm text-text-main">
                        {language === 'bn' ? 'ইন্টারনেট ব্যাংকিং বিবরণ' : 'Internet Banking Details'}
                      </h3>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      icon={<Edit2 size={14} />}
                      onClick={() => handleOpenSectionForm('I_BANKING_INFO')}
                    >
                      {language === 'bn' ? 'তথ্য সম্পাদনা' : 'Edit Details'}
                    </Button>
                  </div>

                  <DetailRow label={language === 'bn' ? 'ইউজার আইডি' : 'User ID'} value={selectedAccount.ibankingUserId} isMono icon={<UserIcon size={15} className="text-amber-500" />} />
                  <DetailRow 
                    label={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'} 
                    value={selectedAccount.ibankingPassword ? (showFullNumbers ? selectedAccount.ibankingPassword : '••••••••') : ''} 
                    isMono 
                    icon={<Lock size={15} className="text-amber-500" />}
                  />
                  <DetailRow 
                    label={language === 'bn' ? 'টিপিন (TPIN)' : 'TPIN'} 
                    value={selectedAccount.ibankingTpin ? (showFullNumbers ? selectedAccount.ibankingTpin : '••••') : ''} 
                    isMono 
                    icon={<Lock size={15} className="text-amber-500" />}
                  />
                  <DetailRow 
                    label={language === 'bn' ? 'নিবন্ধিত মোবাইল নম্বর' : 'Registered Mobile'} 
                    value={selectedAccount.ibankingRegisteredMobile || selectedAccount.ibankingRegisteredContact} 
                    isMono 
                    icon={<Phone size={15} className="text-amber-500" />}
                  />
                  <DetailRow 
                    label={language === 'bn' ? 'নিবন্ধিত ইমেইল' : 'Registered Email'} 
                    value={selectedAccount.ibankingRegisteredEmail} 
                    icon={<Mail size={15} className="text-amber-500" />}
                  />
                  <DetailRow label={language === 'bn' ? 'অ্যাপ্লিকেশনের নাম' : 'Application Name'} value={selectedAccount.ibankingAppName || `${selectedAccount.bankName || ''} App`.trim()} icon={<Monitor size={15} className="text-amber-500" />} />
                  <DetailRow label={language === 'bn' ? 'স্ট্যাটাস' : 'Status'} value={selectedAccount.ibankingStatus} icon={<Info size={15} className="text-amber-500" />} />

                  {/* Open App Action Row */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Monitor size={15} className="text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-text-main truncate">
                          {selectedAccount.ibankingAppName || `${selectedAccount.bankName || 'I-Banking'} App`}
                        </h4>
                        <p className="text-[11px] text-text-muted truncate">
                          {language === 'bn' ? 'অ্যাপ ইনস্টল করা থাকলে ওপেন হবে বা প্লে স্টোরে যাবে' : 'Launches app or redirects to Play Store'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenApp(selectedAccount.ibankingAppLink, selectedAccount.ibankingAppName, selectedAccount.bankName)}
                      icon={<ExternalLink size={14} />}
                      className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto font-bold px-3.5 py-1.5 shrink-0 justify-center text-xs"
                    >
                      {language === 'bn' ? 'ওপেন অ্যাপ' : 'Open App'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    );
  };

  /* ==================== FORM / POPUP MODAL ==================== */
  return (
    <div className="w-full">
      {activeView === 'LIST' ? renderList() : renderDetails()}

      {/* Global FormWindow for Add / Edit */}
      {isFormOpen && (
        <FormWindow
          title={editingItem 
            ? (language === 'bn' ? 'ব্যাংক অ্যাকাউন্ট সম্পাদনা' : 'Edit Bank Account')
            : (language === 'bn' ? 'নতুন ব্যাংক অ্যাকাউন্ট যোগ করুন' : 'Add Bank Account')
          }
          onClose={handleCloseForm}
        >
          <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-10">
            
            {/* Section 1: Account Information */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Landmark size={18} className="text-sky-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? '১. অ্যাকাউন্ট তথ্য' : '1. Account Information'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setShowCountrySelect(true)} className="relative cursor-pointer group md:col-span-2">
                  <InputField
                    label={language === 'bn' ? 'দেশ' : 'Country'}
                    name="country"
                    value={formData.country || 'Bangladesh'}
                    onChange={() => {}}
                    placeholder="Select Country"
                    readOnly
                    required
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>

                <InputField
                  label={language === 'bn' ? 'অ্যাকাউন্ট হোল্ডারের নাম' : 'Account Holder Name'}
                  name="accountHolderName"
                  value={formData.accountHolderName || ''}
                  onChange={e => handleFieldChange('accountHolderName', e.target.value)}
                  placeholder="Enter Account Holder Name"
                  required
                />

                <div onClick={() => setShowBankSelect(true)} className="relative cursor-pointer group">
                  <InputField
                    label={language === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name'}
                    name="bankName"
                    value={formData.bankName || ''}
                    onChange={() => {}}
                    placeholder="Enter Bank Name"
                    readOnly
                    required
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>

                <InputField
                  label={language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}
                  name="accountNumber"
                  value={formData.accountNumber || ''}
                  onChange={e => handleFieldChange('accountNumber', e.target.value)}
                  placeholder="Enter Account Number"
                  required
                />

                <div onClick={() => setShowTypeSelect(true)} className="relative cursor-pointer group">
                  <InputField
                    label={language === 'bn' ? 'অ্যাকাউন্টের ধরন' : 'Account Type'}
                    name="accountType"
                    value={formData.accountType || ''}
                    onChange={() => {}}
                    placeholder="Select Account Type"
                    readOnly
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>

                <div onClick={() => setShowStatusSelect(true)} className="relative cursor-pointer group">
                  <InputField
                    label={language === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
                    name="accountStatus"
                    value={formData.accountStatus || ''}
                    onChange={() => {}}
                    placeholder="Select Account Status"
                    readOnly
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Branch Information */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <MapPin size={18} className="text-teal-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? '২. শাখার তথ্য' : '2. Branch Information'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setShowBranchSelect(true)} className="relative cursor-pointer group">
                  <InputField
                    label={language === 'bn' ? 'শাখার নাম' : 'Branch Name'}
                    name="branchName"
                    value={formData.branchName || ''}
                    onChange={() => {}}
                    placeholder="Select Branch Name"
                    readOnly
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>

                <InputField
                  label={language === 'bn' ? 'শাখা কোড' : 'Branch Code'}
                  name="branchCode"
                  value={formData.branchCode || ''}
                  onChange={e => handleFieldChange('branchCode', e.target.value)}
                  placeholder="Enter Branch Code"
                />

                <InputField
                  label={language === 'bn' ? 'রাউটিং নম্বর' : 'Routing Number'}
                  name="routingNumber"
                  value={formData.routingNumber || ''}
                  onChange={e => handleFieldChange('routingNumber', e.target.value)}
                  placeholder="Enter Routing Number"
                />

                <InputField
                  label={language === 'bn' ? 'শাখার ঠিকানা' : 'Branch Address'}
                  name="branchAddress"
                  value={formData.branchAddress || ''}
                  onChange={e => handleFieldChange('branchAddress', e.target.value)}
                  placeholder="Enter Branch Address"
                />

                <InputField
                  label={language === 'bn' ? 'ব্রাঞ্চ কন্টাক্ট নম্বর' : 'Branch Contact Number'}
                  name="branchContactNumber"
                  value={formData.branchContactNumber || ''}
                  onChange={e => handleFieldChange('branchContactNumber', e.target.value)}
                  placeholder="e.g. 01700000000"
                />

                <InputField
                  label={language === 'bn' ? 'অ্যাসিস্ট্যান্ট অফিসার নম্বর' : 'Assistant Officer Number'}
                  name="assistantOfficerNumber"
                  value={formData.assistantOfficerNumber || ''}
                  onChange={e => handleFieldChange('assistantOfficerNumber', e.target.value)}
                  placeholder="e.g. 01800000000"
                />

                <div className="md:col-span-2">
                  <InputField
                    label={language === 'bn' ? 'ব্রাঞ্চ ম্যানেজার নম্বর' : 'Branch Manager Number'}
                    name="branchManagerNumber"
                    value={formData.branchManagerNumber || ''}
                    onChange={e => handleFieldChange('branchManagerNumber', e.target.value)}
                    placeholder="e.g. 01900000000"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: ATM Card Information */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <CreditCard size={18} className="text-purple-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? '৩. এটিএম কার্ড তথ্য' : '3. ATM Card Information'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label={language === 'bn' ? 'কার্ড হোল্ডারের নাম' : 'Card Holder Name'}
                  name="cardHolderName"
                  value={formData.cardHolderName || ''}
                  onChange={e => handleFieldChange('cardHolderName', e.target.value)}
                  placeholder="Enter Card Holder Name"
                />

                <InputField
                  label={language === 'bn' ? 'কার্ড নম্বর (১৬ ডিজিট)' : 'Card Number'}
                  name="cardNumber"
                  value={formData.cardNumber || ''}
                  onChange={e => handleFieldChange('cardNumber', e.target.value)}
                  placeholder="Enter Card Number"
                />

                <div onClick={() => setShowCardTypeSelect(true)} className="relative cursor-pointer group">
                  <InputField
                    label={language === 'bn' ? 'কার্ডের ধরন' : 'Card Type'}
                    name="cardType"
                    value={formData.cardType || ''}
                    onChange={() => {}}
                    placeholder="Select Card Type"
                    readOnly
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>

                <InputField
                  label={language === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ (MM/YY)' : 'Expiry Date (MM/YY)'}
                  name="cardExpiryDate"
                  value={formData.cardExpiryDate || ''}
                  onChange={e => handleFieldChange('cardExpiryDate', e.target.value)}
                  placeholder="MM/YY"
                />

                <div onClick={() => setShowCardStatusSelect(true)} className="relative cursor-pointer group md:col-span-2">
                  <InputField
                    label={language === 'bn' ? 'কার্ড স্ট্যাটাস' : 'Card Status'}
                    name="cardStatus"
                    value={formData.cardStatus || ''}
                    onChange={() => {}}
                    placeholder="Select Card Status"
                    readOnly
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Mobile Banking Information */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Smartphone size={18} className="text-pink-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? '৪. মোবাইল ব্যাংকিং তথ্য' : '4. Mobile Banking Information'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setShowMobileProviderSelect(true)} className="relative cursor-pointer group">
                  <InputField
                    label={language === 'bn' ? 'প্রোভাইডারের নাম' : 'Provider Name'}
                    name="mobileProviderName"
                    value={formData.mobileProviderName || ''}
                    onChange={() => {}}
                    placeholder="Select Provider (bKash, Nagad...)"
                    readOnly
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>

                <InputField
                  label={language === 'bn' ? 'নিবন্ধিত মোবাইল নম্বর' : 'Registered Mobile Number'}
                  name="mobileRegisteredNumber"
                  value={formData.mobileRegisteredNumber || ''}
                  onChange={e => handleFieldChange('mobileRegisteredNumber', e.target.value)}
                  placeholder="Enter Registered Mobile"
                />

                <InputField
                  label={language === 'bn' ? 'ওয়ালেট / অ্যাকাউন্ট নম্বর' : 'Account/Wallet Number'}
                  name="mobileAccountNumber"
                  value={formData.mobileAccountNumber || ''}
                  onChange={e => handleFieldChange('mobileAccountNumber', e.target.value)}
                  placeholder="Enter Wallet Number"
                />

                <InputField
                  label={language === 'bn' ? 'পিন নম্বর' : 'PIN Number'}
                  name="mobilePin"
                  type="password"
                  value={formData.mobilePin || ''}
                  onChange={e => handleFieldChange('mobilePin', e.target.value)}
                  placeholder="Enter PIN Number"
                />

                <InputField
                  label={language === 'bn' ? 'অ্যাপ্লিকেশনের নাম (App Name)' : 'Application Name'}
                  name="mobileAppName"
                  value={formData.mobileAppName || ''}
                  onChange={e => handleFieldChange('mobileAppName', e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: bKash / Nagad App' : 'e.g. bKash, Nagad App'}
                />

                <InputField
                  label={language === 'bn' ? 'অ্যাপ্লিকেশনের লিংক (App Link / Play Store)' : 'Application Link (Play Store / Deep Link)'}
                  name="mobileAppLink"
                  value={formData.mobileAppLink || ''}
                  onChange={e => handleFieldChange('mobileAppLink', e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                />

                <div onClick={() => setShowMobileStatusSelect(true)} className="relative cursor-pointer group md:col-span-2">
                  <InputField
                    label={language === 'bn' ? 'মোবাইল ওয়ালেট স্ট্যাটাস' : 'Wallet Status'}
                    name="mobileStatus"
                    value={formData.mobileStatus || ''}
                    onChange={() => {}}
                    placeholder="Select Status"
                    readOnly
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 5: I-Banking Information */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Monitor size={18} className="text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? '৫. ইন্টারনেট ব্যাংকিং তথ্য' : '5. I-Banking Information'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label={language === 'bn' ? 'ইউজার আইডি' : 'User ID'}
                  name="ibankingUserId"
                  value={formData.ibankingUserId || ''}
                  onChange={e => handleFieldChange('ibankingUserId', e.target.value)}
                  placeholder="Enter User ID"
                />

                <InputField
                  label={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                  name="ibankingPassword"
                  type="password"
                  value={formData.ibankingPassword || ''}
                  onChange={e => handleFieldChange('ibankingPassword', e.target.value)}
                  placeholder="Enter Password"
                />

                <InputField
                  label={language === 'bn' ? 'টিপিন (TPIN)' : 'TPIN'}
                  name="ibankingTpin"
                  type="password"
                  value={formData.ibankingTpin || ''}
                  onChange={e => handleFieldChange('ibankingTpin', e.target.value)}
                  placeholder="Enter TPIN"
                />

                <InputField
                  label={language === 'bn' ? 'নিবন্ধিত মোবাইল নম্বর' : 'Registered Mobile'}
                  name="ibankingRegisteredMobile"
                  value={formData.ibankingRegisteredMobile || ''}
                  onChange={e => handleFieldChange('ibankingRegisteredMobile', e.target.value)}
                  placeholder="e.g. +880 1700 000000"
                />

                <InputField
                  label={language === 'bn' ? 'নিবন্ধিত ইমেইল' : 'Registered Email'}
                  name="ibankingRegisteredEmail"
                  value={formData.ibankingRegisteredEmail || ''}
                  onChange={e => handleFieldChange('ibankingRegisteredEmail', e.target.value)}
                  placeholder="e.g. user@example.com"
                />

                <InputField
                  label={language === 'bn' ? 'অ্যাপ্লিকেশনের নাম (App Name)' : 'Application Name'}
                  name="ibankingAppName"
                  value={formData.ibankingAppName || ''}
                  onChange={e => handleFieldChange('ibankingAppName', e.target.value)}
                  placeholder={language === 'bn' ? 'যেমন: Citytouch / Astha / Skybanking' : 'e.g. Citytouch, Astha, Skybanking'}
                />

                <InputField
                  label={language === 'bn' ? 'অ্যাপ্লিকেশনের লিংক (App Link / Play Store)' : 'Application Link (Play Store / Deep Link)'}
                  name="ibankingAppLink"
                  value={formData.ibankingAppLink || ''}
                  onChange={e => handleFieldChange('ibankingAppLink', e.target.value)}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                />

                <div onClick={() => setShowIBankingStatusSelect(true)} className="relative cursor-pointer group">
                  <InputField
                    label={language === 'bn' ? 'আই-ব্যাংকিং স্ট্যাটাস' : 'I-Banking Status'}
                    name="ibankingStatus"
                    value={formData.ibankingStatus || ''}
                    onChange={() => {}}
                    placeholder="Select Status"
                    readOnly
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                    <ChevronDown size={18} />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons: Save/Update + Cancel */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 w-full">
              <Button
                type="submit"
                size="lg"
                disabled={isSaving || !formData.accountHolderName?.trim() || !formData.accountNumber?.trim() || !formData.bankName?.trim()}
                isLoading={isSaving}
                loadingText={editingItem ? (language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...') : (language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')}
                className="w-full sm:flex-1 h-14 text-sm font-bold uppercase tracking-wider justify-center"
              >
                {editingItem 
                  ? (language === 'bn' ? 'অ্যাকাউন্ট আপডেট করুন' : 'Update Account')
                  : (language === 'bn' ? 'অ্যাকাউন্ট সংরক্ষণ করুন' : 'Save Account')
                }
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={handleCloseForm}
                className="w-full sm:flex-1 h-14 text-sm font-bold uppercase tracking-wider justify-center bg-rose-600 hover:bg-rose-700 text-white shadow-sm border-none transition-all active:scale-[0.99]"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
            </div>
          </form>

          {/* ==================== GLOBAL DROPDOWN MODALS ==================== */}
          <GlobalFullscreenSelect
            isOpen={showBankSelect}
            onClose={() => setShowBankSelect(false)}
            title={language === 'bn' ? 'ব্যাংক নির্বাচন করুন' : 'Select Bank'}
            options={BANK_NAMES}
            selectedValue={formData.bankName}
            onSelect={(v) => {
              handleFieldChange('bankName', v);
              setShowBankSelect(false);
            }}
            allowAdd
            onAddNew={(val) => {
              handleFieldChange('bankName', val);
              setShowBankSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showBranchSelect}
            onClose={() => setShowBranchSelect(false)}
            title={language === 'bn' ? 'শাখার নাম নির্বাচন করুন' : 'Select Branch Name'}
            options={branchOptions}
            selectedValue={formData.branchName}
            onSelect={(v) => {
              handleFieldChange('branchName', v);
              setShowBranchSelect(false);
            }}
            allowAdd
            onAddNew={(val) => {
              handleFieldChange('branchName', val);
              setShowBranchSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showTypeSelect}
            onClose={() => setShowTypeSelect(false)}
            title={language === 'bn' ? 'অ্যাকাউন্টের ধরন নির্বাচন করুন' : 'Select Account Type'}
            options={ACCOUNT_TYPES}
            selectedValue={formData.accountType}
            onSelect={(v) => {
              handleFieldChange('accountType', v);
              setShowTypeSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showCountrySelect}
            onClose={() => setShowCountrySelect(false)}
            title={language === 'bn' ? 'দেশ নির্বাচন করুন' : 'Select Country'}
            options={WORLD_COUNTRIES}
            selectedValue={formData.country || 'Bangladesh'}
            onSelect={(v) => {
              handleFieldChange('country', v);
              setShowCountrySelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showStatusSelect}
            onClose={() => setShowStatusSelect(false)}
            title={language === 'bn' ? 'স্ট্যাটাস নির্বাচন করুন' : 'Select Account Status'}
            options={ACCOUNT_STATUSES}
            selectedValue={formData.accountStatus}
            onSelect={(v) => {
              handleFieldChange('accountStatus', v);
              setShowStatusSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showCardTypeSelect}
            onClose={() => setShowCardTypeSelect(false)}
            title={language === 'bn' ? 'কার্ডের ধরন নির্বাচন করুন' : 'Select Card Type'}
            options={CARD_TYPES}
            selectedValue={formData.cardType}
            onSelect={(v) => {
              handleFieldChange('cardType', v);
              setShowCardTypeSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showCardStatusSelect}
            onClose={() => setShowCardStatusSelect(false)}
            title={language === 'bn' ? 'কার্ড স্ট্যাটাস নির্বাচন করুন' : 'Select Card Status'}
            options={CARD_STATUSES}
            selectedValue={formData.cardStatus}
            onSelect={(v) => {
              handleFieldChange('cardStatus', v);
              setShowCardStatusSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showMobileProviderSelect}
            onClose={() => setShowMobileProviderSelect(false)}
            title={language === 'bn' ? 'মোবাইল ওয়ালেট প্রোভাইডার' : 'Select Mobile Provider'}
            options={MOBILE_PROVIDERS}
            selectedValue={formData.mobileProviderName}
            onSelect={(v) => {
              handleFieldChange('mobileProviderName', v);
              setShowMobileProviderSelect(false);
            }}
            allowAdd
            onAddNew={(val) => {
              handleFieldChange('mobileProviderName', val);
              setShowMobileProviderSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showMobileStatusSelect}
            onClose={() => setShowMobileStatusSelect(false)}
            title={language === 'bn' ? 'মোবাইল ওয়ালেট স্ট্যাটাস' : 'Select Wallet Status'}
            options={MOBILE_STATUSES}
            selectedValue={formData.mobileStatus}
            onSelect={(v) => {
              handleFieldChange('mobileStatus', v);
              setShowMobileStatusSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showIBankingStatusSelect}
            onClose={() => setShowIBankingStatusSelect(false)}
            title={language === 'bn' ? 'আই-ব্যাংকিং স্ট্যাটাস' : 'Select I-Banking Status'}
            options={I_BANKING_STATUSES}
            selectedValue={formData.ibankingStatus}
            onSelect={(v) => {
              handleFieldChange('ibankingStatus', v);
              setShowIBankingStatusSelect(false);
            }}
          />
        </FormWindow>
      )}

      {/* Dedicated Section-Specific FormWindow */}
      {editingSection && (
        <FormWindow
          title={
            editingSection === 'ACCOUNT_INFO'
              ? (language === 'bn' ? 'অ্যাকাউন্ট তথ্য সম্পাদনা' : 'Edit Account Details')
              : editingSection === 'BRANCH_INFO'
              ? (language === 'bn' ? 'শাখার তথ্য সম্পাদনা' : 'Edit Branch Information')
              : editingSection === 'CARD_INFO'
              ? (language === 'bn' ? 'কার্ড তথ্য সম্পাদনা' : 'Edit Card Details')
              : editingSection === 'MOBILE_BANKING_INFO'
              ? (language === 'bn' ? 'মোবাইল ব্যাংকিং তথ্য সম্পাদনা' : 'Edit Mobile Banking Details')
              : (language === 'bn' ? 'ইন্টারনেট ব্যাংকিং তথ্য সম্পাদনা' : 'Edit Internet Banking Details')
          }
          onClose={handleCloseSectionForm}
        >
          <form onSubmit={handleSaveSection} className="space-y-6 max-w-2xl mx-auto pb-10">
            
            {/* Account Info Fields */}
            {editingSection === 'ACCOUNT_INFO' && (
              <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <Landmark size={18} className="text-sky-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-text-main">
                    {language === 'bn' ? 'মৌলিক অ্যাকাউন্ট তথ্য' : 'Core Account Information'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => setShowCountrySelect(true)} className="relative cursor-pointer group md:col-span-2">
                    <InputField
                      label={language === 'bn' ? 'দেশ' : 'Country'}
                      name="country"
                      value={formData.country || 'Bangladesh'}
                      onChange={() => {}}
                      placeholder="Select Country"
                      readOnly
                      required
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <InputField
                    label={language === 'bn' ? 'অ্যাকাউন্ট হোল্ডারের নাম' : 'Account Holder Name'}
                    name="accountHolderName"
                    value={formData.accountHolderName || ''}
                    onChange={e => handleFieldChange('accountHolderName', e.target.value)}
                    placeholder="Enter Account Holder Name"
                    required
                  />

                  <div onClick={() => setShowBankSelect(true)} className="relative cursor-pointer group">
                    <InputField
                      label={language === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name'}
                      name="bankName"
                      value={formData.bankName || ''}
                      onChange={() => {}}
                      placeholder="Enter Bank Name"
                      readOnly
                      required
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <InputField
                    label={language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}
                    name="accountNumber"
                    value={formData.accountNumber || ''}
                    onChange={e => handleFieldChange('accountNumber', e.target.value)}
                    placeholder="Enter Account Number"
                    required
                  />

                  <div onClick={() => setShowTypeSelect(true)} className="relative cursor-pointer group">
                    <InputField
                      label={language === 'bn' ? 'অ্যাকাউন্টের ধরন' : 'Account Type'}
                      name="accountType"
                      value={formData.accountType || ''}
                      onChange={() => {}}
                      placeholder="Select Account Type"
                      readOnly
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <div onClick={() => setShowStatusSelect(true)} className="relative cursor-pointer group">
                    <InputField
                      label={language === 'bn' ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
                      name="accountStatus"
                      value={formData.accountStatus || ''}
                      onChange={() => {}}
                      placeholder="Select Account Status"
                      readOnly
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Branch Info Fields */}
            {editingSection === 'BRANCH_INFO' && (
              <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <MapPin size={18} className="text-teal-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-text-main">
                    {language === 'bn' ? 'শাখা ও রাউটিং বিবরণ' : 'Branch & Routing Information'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => setShowBranchSelect(true)} className="relative cursor-pointer group">
                    <InputField
                      label={language === 'bn' ? 'শাখার নাম' : 'Branch Name'}
                      name="branchName"
                      value={formData.branchName || ''}
                      onChange={() => {}}
                      placeholder="Select Branch Name"
                      readOnly
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <InputField
                    label={language === 'bn' ? 'শাখা কোড' : 'Branch Code'}
                    name="branchCode"
                    value={formData.branchCode || ''}
                    onChange={e => handleFieldChange('branchCode', e.target.value)}
                    placeholder="Enter Branch Code"
                  />

                  <InputField
                    label={language === 'bn' ? 'রাউটিং নম্বর' : 'Routing Number'}
                    name="routingNumber"
                    value={formData.routingNumber || ''}
                    onChange={e => handleFieldChange('routingNumber', e.target.value)}
                    placeholder="Enter Routing Number"
                  />

                  <InputField
                    label={language === 'bn' ? 'শাখার ঠিকানা' : 'Branch Address'}
                    name="branchAddress"
                    value={formData.branchAddress || ''}
                    onChange={e => handleFieldChange('branchAddress', e.target.value)}
                    placeholder="Enter Branch Address"
                  />

                  <InputField
                    label={language === 'bn' ? 'ব্রাঞ্চ কন্টাক্ট নম্বর' : 'Branch Contact Number'}
                    name="branchContactNumber"
                    value={formData.branchContactNumber || ''}
                    onChange={e => handleFieldChange('branchContactNumber', e.target.value)}
                    placeholder="e.g. 01700000000"
                  />

                  <InputField
                    label={language === 'bn' ? 'অ্যাসিস্ট্যান্ট অফিসার নম্বর' : 'Assistant Officer Number'}
                    name="assistantOfficerNumber"
                    value={formData.assistantOfficerNumber || ''}
                    onChange={e => handleFieldChange('assistantOfficerNumber', e.target.value)}
                    placeholder="e.g. 01800000000"
                  />

                  <div className="md:col-span-2">
                    <InputField
                      label={language === 'bn' ? 'ব্রাঞ্চ ম্যানেজার নম্বর' : 'Branch Manager Number'}
                      name="branchManagerNumber"
                      value={formData.branchManagerNumber || ''}
                      onChange={e => handleFieldChange('branchManagerNumber', e.target.value)}
                      placeholder="e.g. 01900000000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ATM Card Info Fields */}
            {editingSection === 'CARD_INFO' && (
              <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <CreditCard size={18} className="text-purple-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-text-main">
                    {language === 'bn' ? 'এটিএম কার্ড তথ্য' : 'ATM Card Details'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label={language === 'bn' ? 'কার্ড হোল্ডারের নাম' : 'Card Holder Name'}
                    name="cardHolderName"
                    value={formData.cardHolderName || ''}
                    onChange={e => handleFieldChange('cardHolderName', e.target.value)}
                    placeholder="Enter Card Holder Name"
                  />

                  <InputField
                    label={language === 'bn' ? 'কার্ড নম্বর (১৬ ডিজিট)' : 'Card Number'}
                    name="cardNumber"
                    value={formData.cardNumber || ''}
                    onChange={e => handleFieldChange('cardNumber', e.target.value)}
                    placeholder="Enter Card Number"
                  />

                  <div onClick={() => setShowCardTypeSelect(true)} className="relative cursor-pointer group">
                    <InputField
                      label={language === 'bn' ? 'কার্ডের ধরন' : 'Card Type'}
                      name="cardType"
                      value={formData.cardType || ''}
                      onChange={() => {}}
                      placeholder="Select Card Type"
                      readOnly
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <InputField
                    label={language === 'bn' ? 'মেয়াদ উত্তীর্ণের তারিখ (MM/YY)' : 'Expiry Date (MM/YY)'}
                    name="cardExpiryDate"
                    value={formData.cardExpiryDate || ''}
                    onChange={e => handleFieldChange('cardExpiryDate', e.target.value)}
                    placeholder="MM/YY"
                  />

                  <div onClick={() => setShowCardStatusSelect(true)} className="relative cursor-pointer group md:col-span-2">
                    <InputField
                      label={language === 'bn' ? 'কার্ড স্ট্যাটাস' : 'Card Status'}
                      name="cardStatus"
                      value={formData.cardStatus || ''}
                      onChange={() => {}}
                      placeholder="Select Card Status"
                      readOnly
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Banking Fields */}
            {editingSection === 'MOBILE_BANKING_INFO' && (
              <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <Smartphone size={18} className="text-pink-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-text-main">
                    {language === 'bn' ? 'মোবাইল ব্যাংকিং তথ্য' : 'Mobile Banking Details'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div onClick={() => setShowMobileProviderSelect(true)} className="relative cursor-pointer group">
                    <InputField
                      label={language === 'bn' ? 'প্রোভাইডারের নাম' : 'Provider Name'}
                      name="mobileProviderName"
                      value={formData.mobileProviderName || ''}
                      onChange={() => {}}
                      placeholder="Select Provider (bKash, Nagad...)"
                      readOnly
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>

                  <InputField
                    label={language === 'bn' ? 'নিবন্ধিত মোবাইল নম্বর' : 'Registered Mobile Number'}
                    name="mobileRegisteredNumber"
                    value={formData.mobileRegisteredNumber || ''}
                    onChange={e => handleFieldChange('mobileRegisteredNumber', e.target.value)}
                    placeholder="Enter Registered Mobile"
                  />

                  <InputField
                    label={language === 'bn' ? 'ওয়ালেট / অ্যাকাউন্ট নম্বর' : 'Account/Wallet Number'}
                    name="mobileAccountNumber"
                    value={formData.mobileAccountNumber || ''}
                    onChange={e => handleFieldChange('mobileAccountNumber', e.target.value)}
                    placeholder="Enter Wallet Number"
                  />

                  <InputField
                    label={language === 'bn' ? 'পিন নম্বর' : 'PIN Number'}
                    name="mobilePin"
                    type="password"
                    value={formData.mobilePin || ''}
                    onChange={e => handleFieldChange('mobilePin', e.target.value)}
                    placeholder="Enter PIN Number"
                  />

                  <InputField
                    label={language === 'bn' ? 'অ্যাপ্লিকেশনের নাম (App Name)' : 'Application Name'}
                    name="mobileAppName"
                    value={formData.mobileAppName || ''}
                    onChange={e => handleFieldChange('mobileAppName', e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: bKash / Nagad App' : 'e.g. bKash, Nagad App'}
                  />

                  <InputField
                    label={language === 'bn' ? 'অ্যাপ্লিকেশনের লিংক (App Link / Play Store)' : 'Application Link (Play Store / Deep Link)'}
                    name="mobileAppLink"
                    value={formData.mobileAppLink || ''}
                    onChange={e => handleFieldChange('mobileAppLink', e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />

                  <div onClick={() => setShowMobileStatusSelect(true)} className="relative cursor-pointer group md:col-span-2">
                    <InputField
                      label={language === 'bn' ? 'মোবাইল ওয়ালেট স্ট্যাটাস' : 'Wallet Status'}
                      name="mobileStatus"
                      value={formData.mobileStatus || ''}
                      onChange={() => {}}
                      placeholder="Select Status"
                      readOnly
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* I-Banking Fields */}
            {editingSection === 'I_BANKING_INFO' && (
              <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <Monitor size={18} className="text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-text-main">
                    {language === 'bn' ? 'ইন্টারনেট ব্যাংকিং তথ্য' : 'I-Banking Details'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label={language === 'bn' ? 'ইউজার আইডি' : 'User ID'}
                    name="ibankingUserId"
                    value={formData.ibankingUserId || ''}
                    onChange={e => handleFieldChange('ibankingUserId', e.target.value)}
                    placeholder="Enter User ID"
                  />

                  <InputField
                    label={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                    name="ibankingPassword"
                    type="password"
                    value={formData.ibankingPassword || ''}
                    onChange={e => handleFieldChange('ibankingPassword', e.target.value)}
                    placeholder="Enter Password"
                  />

                  <InputField
                    label={language === 'bn' ? 'টিপিন (TPIN)' : 'TPIN'}
                    name="ibankingTpin"
                    type="password"
                    value={formData.ibankingTpin || ''}
                    onChange={e => handleFieldChange('ibankingTpin', e.target.value)}
                    placeholder="Enter TPIN"
                  />

                  <InputField
                    label={language === 'bn' ? 'নিবন্ধিত মোবাইল নম্বর' : 'Registered Mobile'}
                    name="ibankingRegisteredMobile"
                    value={formData.ibankingRegisteredMobile || ''}
                    onChange={e => handleFieldChange('ibankingRegisteredMobile', e.target.value)}
                    placeholder="e.g. +880 1700 000000"
                  />

                  <InputField
                    label={language === 'bn' ? 'নিবন্ধিত ইমেইল' : 'Registered Email'}
                    name="ibankingRegisteredEmail"
                    value={formData.ibankingRegisteredEmail || ''}
                    onChange={e => handleFieldChange('ibankingRegisteredEmail', e.target.value)}
                    placeholder="e.g. user@example.com"
                  />

                  <InputField
                    label={language === 'bn' ? 'অ্যাপ্লিকেশনের নাম (App Name)' : 'Application Name'}
                    name="ibankingAppName"
                    value={formData.ibankingAppName || ''}
                    onChange={e => handleFieldChange('ibankingAppName', e.target.value)}
                    placeholder={language === 'bn' ? 'যেমন: Citytouch / Astha / Skybanking' : 'e.g. Citytouch, Astha, Skybanking'}
                  />

                  <InputField
                    label={language === 'bn' ? 'অ্যাপ্লিকেশনের লিংক (App Link / Play Store)' : 'Application Link (Play Store / Deep Link)'}
                    name="ibankingAppLink"
                    value={formData.ibankingAppLink || ''}
                    onChange={e => handleFieldChange('ibankingAppLink', e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                  />

                  <div onClick={() => setShowIBankingStatusSelect(true)} className="relative cursor-pointer group">
                    <InputField
                      label={language === 'bn' ? 'আই-ব্যাংকিং স্ট্যাটাস' : 'I-Banking Status'}
                      name="ibankingStatus"
                      value={formData.ibankingStatus || ''}
                      onChange={() => {}}
                      placeholder="Select Status"
                      readOnly
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-hover:text-text-main transition-colors">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons for Section Form: Save/Update + Cancel */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 w-full">
              <Button
                type="submit"
                size="lg"
                disabled={isSaving}
                isLoading={isSaving}
                loadingText={language === 'bn' ? 'আপডেট হচ্ছে...' : 'Updating...'}
                className="w-full sm:flex-1 h-14 text-sm font-bold uppercase tracking-wider justify-center"
              >
                {language === 'bn' ? 'তথ্য আপডেট করুন' : 'Update Information'}
              </Button>

              <Button
                type="button"
                size="lg"
                onClick={handleCloseSectionForm}
                className="w-full sm:flex-1 h-14 text-sm font-bold uppercase tracking-wider justify-center bg-rose-600 hover:bg-rose-700 text-white shadow-sm border-none transition-all active:scale-[0.99]"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
            </div>
          </form>

          {/* Section Dropdowns */}
          <GlobalFullscreenSelect
            isOpen={showBankSelect}
            onClose={() => setShowBankSelect(false)}
            title={language === 'bn' ? 'ব্যাংক নির্বাচন করুন' : 'Select Bank'}
            options={BANK_NAMES}
            selectedValue={formData.bankName}
            onSelect={(v) => {
              handleFieldChange('bankName', v);
              setShowBankSelect(false);
            }}
            allowAdd
            onAddNew={(val) => {
              handleFieldChange('bankName', val);
              setShowBankSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showBranchSelect}
            onClose={() => setShowBranchSelect(false)}
            title={language === 'bn' ? 'শাখার নাম নির্বাচন করুন' : 'Select Branch Name'}
            options={branchOptions}
            selectedValue={formData.branchName}
            onSelect={(v) => {
              handleFieldChange('branchName', v);
              setShowBranchSelect(false);
            }}
            allowAdd
            onAddNew={(val) => {
              handleFieldChange('branchName', val);
              setShowBranchSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showTypeSelect}
            onClose={() => setShowTypeSelect(false)}
            title={language === 'bn' ? 'অ্যাকাউন্টের ধরন নির্বাচন করুন' : 'Select Account Type'}
            options={ACCOUNT_TYPES}
            selectedValue={formData.accountType}
            onSelect={(v) => {
              handleFieldChange('accountType', v);
              setShowTypeSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showCountrySelect}
            onClose={() => setShowCountrySelect(false)}
            title={language === 'bn' ? 'দেশ নির্বাচন করুন' : 'Select Country'}
            options={WORLD_COUNTRIES}
            selectedValue={formData.country || 'Bangladesh'}
            onSelect={(v) => {
              handleFieldChange('country', v);
              setShowCountrySelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showStatusSelect}
            onClose={() => setShowStatusSelect(false)}
            title={language === 'bn' ? 'স্ট্যাটাস নির্বাচন করুন' : 'Select Account Status'}
            options={ACCOUNT_STATUSES}
            selectedValue={formData.accountStatus}
            onSelect={(v) => {
              handleFieldChange('accountStatus', v);
              setShowStatusSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showCardTypeSelect}
            onClose={() => setShowCardTypeSelect(false)}
            title={language === 'bn' ? 'কার্ডের ধরন নির্বাচন করুন' : 'Select Card Type'}
            options={CARD_TYPES}
            selectedValue={formData.cardType}
            onSelect={(v) => {
              handleFieldChange('cardType', v);
              setShowCardTypeSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showCardStatusSelect}
            onClose={() => setShowCardStatusSelect(false)}
            title={language === 'bn' ? 'কার্ড স্ট্যাটাস নির্বাচন করুন' : 'Select Card Status'}
            options={CARD_STATUSES}
            selectedValue={formData.cardStatus}
            onSelect={(v) => {
              handleFieldChange('cardStatus', v);
              setShowCardStatusSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showMobileProviderSelect}
            onClose={() => setShowMobileProviderSelect(false)}
            title={language === 'bn' ? 'মোবাইল ওয়ালেট প্রোভাইডার' : 'Select Mobile Provider'}
            options={MOBILE_PROVIDERS}
            selectedValue={formData.mobileProviderName}
            onSelect={(v) => {
              handleFieldChange('mobileProviderName', v);
              setShowMobileProviderSelect(false);
            }}
            allowAdd
            onAddNew={(val) => {
              handleFieldChange('mobileProviderName', val);
              setShowMobileProviderSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showMobileStatusSelect}
            onClose={() => setShowMobileStatusSelect(false)}
            title={language === 'bn' ? 'মোবাইল ওয়ালেট স্ট্যাটাস' : 'Select Wallet Status'}
            options={MOBILE_STATUSES}
            selectedValue={formData.mobileStatus}
            onSelect={(v) => {
              handleFieldChange('mobileStatus', v);
              setShowMobileStatusSelect(false);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showIBankingStatusSelect}
            onClose={() => setShowIBankingStatusSelect(false)}
            title={language === 'bn' ? 'আই-ব্যাংকিং স্ট্যাটাস' : 'Select I-Banking Status'}
            options={I_BANKING_STATUSES}
            selectedValue={formData.ibankingStatus}
            onSelect={(v) => {
              handleFieldChange('ibankingStatus', v);
              setShowIBankingStatusSelect(false);
            }}
          />
        </FormWindow>
      )}
    </div>
  );
};

/* ==================== HELPER SUBCOMPONENTS ==================== */
interface DetailRowProps {
  label: string;
  value?: string | number | null;
  isMono?: boolean;
  icon?: React.ReactNode;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value, isMono = false, icon }) => (
  <div className="flex items-center justify-between py-3 sm:py-3.5 px-3 sm:px-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors rounded-lg gap-4">
    <div className="flex items-center gap-2.5 shrink-0 min-w-0">
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="text-xs sm:text-sm text-text-muted font-medium truncate">
        {label}
      </span>
    </div>
    <span className={`text-xs sm:text-sm font-bold text-text-main text-right break-words ${isMono ? 'font-mono' : ''}`}>
      {value || '-'}
    </span>
  </div>
);

interface EmptyTabStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onAdd: () => void;
  buttonLabel: string;
}

const EmptyTabState: React.FC<EmptyTabStateProps> = ({ icon, title, description, onAdd, buttonLabel }) => (
  <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-[10px] sm:rounded-xl">
    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black/5 dark:bg-white/5 text-text-muted flex items-center justify-center mb-3">
      {icon}
    </div>
    <h4 className="text-sm sm:text-base font-bold text-text-main mb-1">{title}</h4>
    <p className="text-xs text-text-muted max-w-sm mb-5">{description}</p>
    <Button onClick={onAdd} size="sm">
      <Plus size={16} className="mr-1.5" />
      {buttonLabel}
    </Button>
  </div>
);

export default BankAccountView;
