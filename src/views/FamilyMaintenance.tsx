import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store';
import { TRANSLATIONS } from '@/constants';
import InputField from '@/components/InputField';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  ArrowLeft, Plus, Edit2, Trash2, Eye, 
  Home, Users, CreditCard, Calendar, FileText, Check, X, Download, ChevronDown, TrendingUp, TrendingDown
} from 'lucide-react';
import { auth, saveFirebaseDoc, subscribeFirebaseCollection, deleteFirebaseDoc } from '@/services/firebase';
import { decryptSensitiveFields } from '@/utils/security';
import { where } from 'firebase/firestore';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';

interface Transaction {
  id: string;
  userId: string;
  firebaseUid?: string;
  category: 'Family' | 'Others';
  amount: number;
  type: 'Income' | 'Expense';
  date: string;
  paymentMethod: string;
  description: string;
  attachment?: string;
  
  // Bank fields
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  transactionReference?: string;
  
  // Mobile banking fields
  mobileBankingWallet?: string;
  transactionId?: string;

  // Family specific
  familyMemberName?: string;
  relationship?: string;
  // Others specific
  otherCategory?: string;
  createdAt: string;
  
  // Currency conversion fields
  payoutCurrency?: string;
  payoutAmount?: number;
  exchangeRate?: number;
  receiveCurrency?: string;
  receiveAmount?: number;
  sourceOfIncome?: string;
  purpose?: string;
}

const purposeOptions = [
  { value: 'Family Support', label: 'Family Support (পরিবারকে সাহায্য)' },
  { value: 'Medical', label: 'Medical (চিকিৎসা)' },
  { value: 'Education', label: 'Education (শিক্ষা)' },
  { value: 'Monthly Expense', label: 'Monthly Expense (মাসিক খরচ)' },
  { value: 'Other', label: 'Other (অন্যান্য)' }
];

const incomeSources = [
  { value: 'Salary', label: 'Salary (বেতন)' },
  { value: 'Business', label: 'Business (ব্যবসা)' },
  { value: 'Freelancing', label: 'Freelancing (মুক্তপেশা)' },
  { value: 'Remittance', label: 'Remittance (রেমিট্যান্স)' },
  { value: 'Investments', label: 'Investments (বিনিয়োগ)' },
  { value: 'Other', label: 'Other (অন্যান্য)' }
];

const FamilyMaintenance: React.FC = () => {
  const { user, language, setView, showFeedback, theme, confirmAction, bankNames, mobileBankingWallets, relationships, currencies } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const currentUserId = user?.id || null;
  const [mode, setMode] = useState<'LIST' | 'FORM_FAMILY' | 'FORM_OTHERS' | 'VIEW'>('LIST');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Income' | 'Expense'>('Expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Mobile Banking' | ''>('');
  
  // Currency Conversion Fields
  const [payoutCurrency, setPayoutCurrency] = useState('QAR');
  const [receiveCurrency, setReceiveCurrency] = useState('BDT');
  const [exchangeRate, setExchangeRate] = useState('32.258');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [sourceOfIncome, setSourceOfIncome] = useState('');
  const [purpose, setPurpose] = useState('');

  const getRateInQar = (curr: string): number => {
    if (curr === 'QAR') return 1.0;
    if (curr === 'USD') return 3.64;
    if (curr === 'BDT') return 0.031;
    return 1.0;
  };

  const getDefaultExchangeRate = (fromCurr: string, toCurr: string): string => {
    if (fromCurr === toCurr) return '1.0';
    const fromRateInQar = fromCurr === 'QAR' ? 1.0 : fromCurr === 'USD' ? 3.64 : 0.031;
    const toRateInQar = toCurr === 'QAR' ? 1.0 : toCurr === 'USD' ? 3.64 : 0.031;
    const calculatedRate = fromRateInQar / toRateInQar;
    return calculatedRate.toFixed(4).replace(/\.?0+$/, '');
  };

  const handlePayoutAmountChange = (val: string) => {
    setPayoutAmount(val);
    const pAmt = parseFloat(val);
    const exRate = parseFloat(exchangeRate);
    if (!isNaN(pAmt) && !isNaN(exRate)) {
      setReceiveAmount((pAmt * exRate).toFixed(2));
      const rateInQar = getRateInQar(payoutCurrency);
      setAmount((pAmt * rateInQar).toFixed(2));
    } else {
      setReceiveAmount('');
      setAmount('');
    }
  };

  const handleReceiveAmountChange = (val: string) => {
    setReceiveAmount(val);
    const rAmt = parseFloat(val);
    const exRate = parseFloat(exchangeRate);
    if (!isNaN(rAmt) && !isNaN(exRate) && exRate !== 0) {
      const pAmt = rAmt / exRate;
      setPayoutAmount(pAmt.toFixed(2));
      const rateInQar = getRateInQar(payoutCurrency);
      setAmount((pAmt * rateInQar).toFixed(2));
    } else {
      setPayoutAmount('');
      setAmount('');
    }
  };

  const handleExchangeRateChange = (val: string) => {
    setExchangeRate(val);
    const exRate = parseFloat(val);
    const pAmt = parseFloat(payoutAmount);
    if (!isNaN(pAmt) && !isNaN(exRate)) {
      setReceiveAmount((pAmt * exRate).toFixed(2));
      const rateInQar = getRateInQar(payoutCurrency);
      setAmount((pAmt * rateInQar).toFixed(2));
    }
  };

  const handlePayoutCurrencyChange = (newCurr: string) => {
    setPayoutCurrency(newCurr);
    const newRate = getDefaultExchangeRate(newCurr, receiveCurrency);
    setExchangeRate(newRate);
    const pAmt = parseFloat(payoutAmount);
    const rate = parseFloat(newRate);
    if (!isNaN(pAmt) && !isNaN(rate)) {
      setReceiveAmount((pAmt * rate).toFixed(2));
      const rateInQar = getRateInQar(newCurr);
      setAmount((pAmt * rateInQar).toFixed(2));
    }
  };

  const handleReceiveCurrencyChange = (newCurr: string) => {
    setReceiveCurrency(newCurr);
    const newRate = getDefaultExchangeRate(payoutCurrency, newCurr);
    setExchangeRate(newRate);
    const pAmt = parseFloat(payoutAmount);
    const rate = parseFloat(newRate);
    if (!isNaN(pAmt) && !isNaN(rate)) {
      setReceiveAmount((pAmt * rate).toFixed(2));
      const rateInQar = getRateInQar(payoutCurrency);
      setAmount((pAmt * rateInQar).toFixed(2));
    }
  };
  
  // Bank fields
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  
  // Mobile fields
  const [mobileBankingWallet, setMobileBankingWallet] = useState('');
  const [transactionId, setTransactionId] = useState('');

  const [description, setDescription] = useState('');
  const [familyMemberName, setFamilyMemberName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [otherCategory, setOtherCategory] = useState('');

  const targetUserObj = user;
  const parentCol = targetUserObj?.role === 'ADMIN' ? 'admins' : 'users';
  const collectionPath = targetUserObj ? `${parentCol}/${targetUserObj.id}/Familymaintenance` : 'Familymaintenance';

  useEffect(() => {
    if (!currentUserId || !targetUserObj) {
      setTransactions([]);
      return;
    }
    const unsub = subscribeFirebaseCollection(
      collectionPath,
      (data) => {
        // Decrypt sensitive fields
        const decryptedData = data.map((d: any) => decryptSensitiveFields(d));
        // Sort by date descending
        const sorted = (decryptedData as Transaction[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(sorted);
      }
    );
    return () => unsub();
  }, [currentUserId, collectionPath]);

  const [selectedMonth, setSelectedMonth] = useState<number | 'ALL'>('ALL');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const dynamicYears = new Set<number>();
    
    // Always include current year and previous 5 years dynamically
    for (let i = 0; i <= 5; i++) {
      dynamicYears.add(currentYear - i);
    }
    
    // Also include any years from recorded transactions if present
    transactions.forEach(t => {
      if (t.date) {
        const y = new Date(t.date).getFullYear();
        if (!isNaN(y) && y > 1970) {
          dynamicYears.add(y);
        }
      }
    });

    return Array.from(dynamicYears).sort((a, b) => b - a);
  }, [transactions]);
  const months = [
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

  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    const mMatch = selectedMonth === 'ALL' ? true : d.getMonth() + 1 === selectedMonth;
    const yMatch = selectedYear === 'ALL' ? true : d.getFullYear() === Number(selectedYear);
    return mMatch && yMatch;
  });

  const totalSend = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const totalReceive = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const resetForm = () => {
    setAmount('');
    setType('Expense');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('');
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setTransactionReference('');
    setMobileBankingWallet('');
    setTransactionId('');
    setDescription('');
    setFamilyMemberName('');
    setRelationship('');
    setOtherCategory('');
    setSelectedTxn(null);
    setPayoutCurrency('QAR');
    setReceiveCurrency('BDT');
    setExchangeRate('32.258');
    setPayoutAmount('');
    setReceiveAmount('');
    setSourceOfIncome('');
    setPurpose('');
  };

  const handleOpenForm = (category: 'Family' | 'Others', txn?: Transaction) => {
    resetForm();
    setShowFabMenu(false);
    if (txn) {
      setSelectedTxn(txn);
      setAmount(txn.amount.toString());
      setType(txn.type);
      setDate(txn.date);
      setPaymentMethod((txn.paymentMethod as any) || '');
      setBankName(txn.bankName || '');
      setAccountName(txn.accountName || '');
      setAccountNumber(txn.accountNumber || '');
      setTransactionReference(txn.transactionReference || '');
      setMobileBankingWallet(txn.mobileBankingWallet || '');
      setTransactionId(txn.transactionId || '');
      setDescription(txn.description || '');
      setPayoutCurrency(txn.payoutCurrency || 'QAR');
      setReceiveCurrency(txn.receiveCurrency || 'BDT');
      
      const rateVal = txn.exchangeRate ? txn.exchangeRate.toString() : '32.258';
      setExchangeRate(rateVal);
      
      const payVal = txn.payoutAmount ? txn.payoutAmount.toString() : txn.amount.toString();
      setPayoutAmount(payVal);
      
      const pAmt = parseFloat(payVal);
      const exRate = parseFloat(rateVal);
      const calculatedReceive = (!isNaN(pAmt) && !isNaN(exRate)) ? (pAmt * exRate).toFixed(2) : '';
      setReceiveAmount(txn.receiveAmount ? txn.receiveAmount.toString() : calculatedReceive);
      
      setSourceOfIncome(txn.sourceOfIncome || '');
      setPurpose(txn.purpose || '');

      if (category === 'Family') {
        setFamilyMemberName(txn.familyMemberName || '');
        setRelationship(txn.relationship || '');
      } else {
        setOtherCategory(txn.otherCategory || '');
      }
    }
    setMode(category === 'Family' ? 'FORM_FAMILY' : 'FORM_OTHERS');
  };

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      showFeedback(language === 'bn' ? 'দয়া করে একটি সঠিক পরিমাণ লিখুন' : 'Please enter a valid amount', 'error');
      return;
    }

    const category = mode === 'FORM_FAMILY' ? 'Family' : 'Others';
    const txnId = selectedTxn ? selectedTxn.id : Date.now().toString();

    const data: Transaction = {
      id: txnId,
      userId: currentUserId || auth.currentUser?.uid || user?.id || '',
      category,
      amount: Number(amount),
      type,
      date: selectedTxn ? selectedTxn.date : new Date().toLocaleString('en-US', { hour12: true }),
      paymentMethod,
      bankName,
      accountName,
      accountNumber,
      transactionReference,
      mobileBankingWallet,
      transactionId,
      description,
      payoutCurrency,
      payoutAmount: payoutAmount ? Number(payoutAmount) : Number(amount),
      exchangeRate: Number(exchangeRate),
      receiveCurrency,
      receiveAmount: receiveAmount ? Number(receiveAmount) : undefined,
      sourceOfIncome,
      purpose,
      createdAt: selectedTxn ? selectedTxn.createdAt : new Date().toISOString(),
      ...(category === 'Family' ? { familyMemberName, relationship } : { otherCategory })
    };

    try {
      await saveFirebaseDoc(collectionPath, txnId, data);
      showFeedback(language === 'bn' ? 'সফলভাবে সংরক্ষিত হয়েছে' : 'Saved successfully', 'success');
      setMode('LIST');
    } catch (e) {
      showFeedback(language === 'bn' ? 'সংরক্ষণ করতে ব্যর্থ হয়েছে' : 'Failed to save', 'error');
    }
  };

  const handleDelete = (id: string) => {
    confirmAction(
      language === 'bn' ? 'এই লেনদেন মুছে ফেলা হবে।' : 'This transaction will be deleted.',
      async () => {
        try {
          await deleteFirebaseDoc(collectionPath, id);
          showFeedback(language === 'bn' ? 'মুছে ফেলা হয়েছে' : 'Deleted successfully', 'success');
          if (mode === 'VIEW') setMode('LIST');
        } catch (e) {
          showFeedback(language === 'bn' ? 'মুছে ফেলতে ব্যর্থ হয়েছে' : 'Failed to delete', 'error');
        }
      },
      {
        title: language === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?'
      }
    );
  };

  const handleDownloadPDF = (txn: Transaction) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Helper to right-align text
    const rightAlignText = (text: string, y: number, rightX: number) => {
      const textWidth = doc.getTextWidth(text);
      doc.text(text, rightX - textWidth, y);
    };

    // Helper to center text
    const centerText = (text: string, y: number, centerX: number) => {
      const textWidth = doc.getTextWidth(text);
      doc.text(text, centerX - (textWidth / 2), y);
    };

    // --- Header Section ---
    // Title
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('FAMILY MAINTENANCE', 40, 60);

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL REMITTANCE STATEMENT & RECEIPT', 40, 80);

    // Badge "PROCESSED / COMPLETED"
    doc.setFillColor(220, 252, 231); // green-100
    doc.roundedRect(pageWidth - 210, 42, 170, 24, 12, 12, 'F');
    doc.setFontSize(10);
    doc.setTextColor(21, 128, 61); // green-700
    doc.setFont('helvetica', 'bold');
    centerText('PROCESSED / COMPLETED', 54, pageWidth - 125);

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFont('helvetica', 'normal');
    rightAlignText(`Date: ${txn.date || new Date().toLocaleDateString()}`, 80, pageWidth - 40);

    // Divider Line
    doc.setDrawColor(15, 23, 42); // slate-900
    doc.setLineWidth(1.5);
    doc.line(40, 95, pageWidth - 40, 95);

    // --- Dark Blue Summary Box ---
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(40, 115, pageWidth - 80, 85, 8, 8, 'F');

    // Sent Amount
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    doc.text('SENT AMOUNT', 60, 145);
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    const sentAmtText = `${(txn.payoutAmount ?? txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${txn.payoutCurrency ?? 'QAR'}`;
    doc.text(sentAmtText, 60, 175);

    // Exchange Rate Center Box
    doc.setDrawColor(71, 85, 105); // slate-600
    doc.setLineWidth(1);
    doc.roundedRect(pageWidth / 2 - 55, 135, 110, 45, 6, 6, 'S');
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    centerText('EXCHANGE RATE', 152, pageWidth / 2);
    
    doc.setFontSize(10);
    doc.setTextColor(226, 232, 240); // slate-200
    doc.setFont('helvetica', 'normal');
    centerText(`1 ${txn.payoutCurrency ?? 'QAR'} = ${txn.exchangeRate ?? '1.0'} ${txn.receiveCurrency ?? 'BDT'}`, 168, pageWidth / 2);

    // Received Amount
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    rightAlignText('RECEIVED AMOUNT', 145, pageWidth - 60);

    const receiveAmt = txn.receiveAmount ?? (txn.payoutAmount && txn.exchangeRate ? (txn.payoutAmount * txn.exchangeRate) : txn.amount);
    doc.setFontSize(22);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.setFont('helvetica', 'bold');
    rightAlignText(`${receiveAmt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${txn.receiveCurrency ?? 'BDT'}`, 175, pageWidth - 60);

    // --- Details Columns ---
    const leftColX = 40;
    const rightColX = pageWidth / 2 + 10;
    const colWidth = (pageWidth - 90) / 2;
    const detailsStartY = 230;

    // Sender Info Items
    const senderItems = [
      { label: 'Full Name', value: targetUserObj?.name || 'N/A' },
      { label: 'Mobile Number', value: targetUserObj?.mobileNumber || targetUserObj?.mobile || 'N/A' },
      { label: 'Nationality', value: targetUserObj?.nationality || 'N/A' },
      { label: 'Date of Birth', value: targetUserObj?.dob || 'N/A' },
      { label: targetUserObj?.idType || 'ID Number', value: targetUserObj?.idNumber || 'N/A' },
      { label: 'Source of Income', value: txn.sourceOfIncome || 'Salary' },
      { label: 'Purpose', value: txn.purpose || 'N/A' },
    ];

    // Beneficiary Info Items
    const beneficiaryItems: {label: string, value: string}[] = [];
    if (txn.category === 'Family') {
      beneficiaryItems.push({ label: 'Beneficiary Name', value: txn.familyMemberName || 'N/A' });
      beneficiaryItems.push({ label: 'Relationship', value: txn.relationship || 'N/A' });
    } else {
      beneficiaryItems.push({ label: 'Category', value: txn.otherCategory || 'N/A' });
      beneficiaryItems.push({ label: 'Description', value: txn.description || 'N/A' });
    }
    
    beneficiaryItems.push({ label: 'Payment Method', value: txn.paymentMethod || 'N/A' });

    if (txn.paymentMethod === 'Bank Transfer') {
      beneficiaryItems.push({ label: 'Bank Name', value: txn.bankName || 'N/A' });
      beneficiaryItems.push({ label: 'Account Name', value: txn.accountName || 'N/A' });
      beneficiaryItems.push({ label: 'Account Number', value: txn.accountNumber || 'N/A' });
      if (txn.transactionReference) beneficiaryItems.push({ label: 'Ref No', value: txn.transactionReference });
    } else if (txn.paymentMethod === 'Mobile Banking') {
      beneficiaryItems.push({ label: 'Wallet', value: txn.mobileBankingWallet || 'N/A' });
      beneficiaryItems.push({ label: 'Account No', value: txn.accountNumber || 'N/A' });
      if (txn.transactionId) beneficiaryItems.push({ label: 'Txn ID', value: txn.transactionId });
    }

    // Determine max items for equal height boxes
    const maxItems = Math.max(senderItems.length, beneficiaryItems.length);
    const boxHeight = 70 + (maxItems * 35); // base header + spacing per item

    // Draw Column Boxes
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.setFillColor(248, 250, 252); // slate-50 (optional light bg, or white)
    // using very light gray or white, lets stick to transparent inside, just stroke
    doc.roundedRect(leftColX, detailsStartY, colWidth, boxHeight, 8, 8, 'S');
    doc.roundedRect(rightColX, detailsStartY, colWidth, boxHeight, 8, 8, 'S');

    // Box Background optional: doc.setFillColor(255,255,255); doc.roundedRect(...)

    // Column Headers
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text('SENDER INFORMATION', leftColX + 15, detailsStartY + 30);
    doc.text('BENEFICIARY & BANK DETAILS', rightColX + 15, detailsStartY + 30);

    // Header Dividers
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(leftColX + 15, detailsStartY + 45, leftColX + colWidth - 15, detailsStartY + 45);
    doc.line(rightColX + 15, detailsStartY + 45, rightColX + colWidth - 15, detailsStartY + 45);

    // Render Items Function
    const renderList = (items: {label: string, value: string}[], startX: number, startY: number, width: number) => {
      let currentY = startY;
      items.forEach((item, index) => {
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('helvetica', 'bold');
        doc.text(item.label, startX + 15, currentY);

        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.setFont('helvetica', 'bold');
        
        // Handle long values by truncating or adjusting if necessary, 
        // but rightAlignText should generally work for short fields.
        let val = item.value;
        if (doc.getTextWidth(val) > width - doc.getTextWidth(item.label) - 40) {
           val = val.substring(0, 25) + '...';
        }
        rightAlignText(val, currentY, startX + width - 15);
        
        if (index < items.length - 1) {
          doc.setDrawColor(226, 232, 240); // slate-200
          doc.setLineDashPattern([3, 3], 0);
          doc.line(startX + 15, currentY + 15, startX + width - 15, currentY + 15);
          doc.setLineDashPattern([], 0);
        }

        currentY += 35;
      });
    };

    renderList(senderItems, leftColX, detailsStartY + 75, colWidth);
    renderList(beneficiaryItems, rightColX, detailsStartY + 75, colWidth);

    const afterBoxesY = detailsStartY + boxHeight + 40;

    // --- Footer Section ---
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(1);
    doc.line(40, afterBoxesY, pageWidth - 40, afterBoxesY);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'normal');
    
    centerText(`This document serves as an official summary record of family maintenance transaction created on ${txn.date || new Date().toLocaleDateString()}.`, afterBoxesY + 30, pageWidth / 2);
    centerText('All details herein are verified for administrative and personal record maintenance.', afterBoxesY + 45, pageWidth / 2);

    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFont('helvetica', 'bold');
    doc.setLineDashPattern([4, 2], 0);
    // doc.text('— FLEETPRO MANAGEMENT SYSTEM —', ... )
    centerText('— FLEETPRO MANAGEMENT SYSTEM —', afterBoxesY + 70, pageWidth / 2);

    // Reset dashed line if needed
    doc.setLineDashPattern([], 0);

    doc.save(`Family_Maintenance_${txn.date}.pdf`);
  };

  const renderInputField = (label: string, value: string, onChange: (val: string) => void, type: string = 'text', placeholder: string = '') => (
    <InputField
      label={label}
      name={label}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6" style={{ paddingBottom: 'max(140px, calc(env(safe-area-inset-bottom) + 110px))' }}>
      {mode === 'LIST' && (
        <div className="animate-in slide-in-from-right-8 fade-in duration-300 space-y-6">
          {/* Summary Card */}
          <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-4">
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                {language === 'bn' ? 'সারাংশ (Summary)' : 'Summary'}
              </h2>
              <div className="flex items-center gap-2">
                {/* Month Filter */}
                <button
                  type="button"
                  onClick={() => setIsMonthSelectOpen(true)}
                  className="px-3 py-2 rounded-[8px] text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold flex items-center justify-between gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer select-none"
                >
                  <span>
                    {selectedMonth === 'ALL'
                      ? (language === 'bn' ? 'সকল মাস' : 'All Months')
                      : (months.find(m => m.value === selectedMonth)?.label || selectedMonth)}
                  </span>
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
                </button>

                {/* Year Filter */}
                <button
                  type="button"
                  onClick={() => setIsYearSelectOpen(true)}
                  className="px-3 py-2 rounded-[8px] text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold flex items-center justify-between gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer select-none"
                >
                  <span>
                    {selectedYear === 'ALL'
                      ? (language === 'bn' ? 'সকল বছর' : 'All Years')
                      : selectedYear}
                  </span>
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-xl border border-red-100 dark:border-red-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                    <TrendingDown size={16} />
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
                    {language === 'bn' ? 'সেন্ড অ্যামাউন্ট (Send Amount)' : 'Send Amount'}
                  </p>
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  {totalSend.toLocaleString()} QAR
                </p>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={16} />
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                    {language === 'bn' ? 'রিসিভ অ্যামাউন্ট (Receive Amount)' : 'Receive Amount'}
                  </p>
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                  {totalReceive.toLocaleString()} QAR
                </p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-[#10b981]" />
              Transaction History
            </h2>
            {filteredTransactions.length === 0 ? (
              <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-2xl p-8 text-center border-dashed">
                <FileText size={32} className="mx-auto text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map(txn => (
                  <div key={txn.id} className="bg-theme-card p-4 rounded-xl border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-xl ${txn.category === 'Family' ? 'bg-pink-50 text-pink-500 dark:bg-pink-500/10' : 'bg-purple-50 text-purple-500 dark:bg-purple-500/10'}`}>
                        {txn.category === 'Family' ? <Home size={20} /> : <Users size={20} />}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {txn.category} 
                          {txn.sourceOfIncome && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#10b981]/10 text-[#10b981] font-bold">
                              {txn.sourceOfIncome}
                            </span>
                          )}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${txn.type === 'Income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {txn.type}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">{txn.date} • {txn.description || 'No description'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:w-auto w-full border-t sm:border-t-0 border-gray-100 dark:border-white/5 pt-3 sm:pt-0">
                      <div className="text-right flex-1 sm:flex-none">
                        <p className={`text-base font-black ${txn.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.type === 'Income' ? '+' : '-'}{txn.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => { setSelectedTxn(txn); setMode('VIEW'); }} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 transition-colors">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleOpenForm(txn.category, txn)} className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-[#10b981] transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(txn.id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FAB */}
          <div className="fixed right-6 z-50 flex flex-col items-end gap-3" style={{ bottom: 'max(96px, calc(env(safe-area-inset-bottom) + 80px))' }}>
            {showFabMenu && (
              <div className="flex flex-col gap-2 mb-2 animate-in slide-in-from-bottom-4 fade-in">
                <button 
                  onClick={() => handleOpenForm('Family')}
                  className="flex items-center gap-3 bg-white dark:bg-[#1e293b] px-4 py-3 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-all"
                >
                  Family
                  <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                    <Home size={16} />
                  </div>
                </button>
                <button 
                  onClick={() => handleOpenForm('Others')}
                  className="flex items-center gap-3 bg-white dark:bg-[#1e293b] px-4 py-3 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition-all"
                >
                  Others
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Users size={16} />
                  </div>
                </button>
              </div>
            )}
            <button
              onClick={() => setShowFabMenu(!showFabMenu)}
              className="w-14 h-14 rounded-full bg-[#10b981] text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              style={{ boxShadow: '0 8px 24px -4px rgba(59,130,246,0.6)' }}
            >
              <Plus size={28} className={`transition-transform duration-300 ${showFabMenu ? 'rotate-45' : ''}`} />
            </button>
          </div>
          
          {showFabMenu && (
            <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowFabMenu(false)} />
          )}
        </div>
      )}

      {(mode === 'FORM_FAMILY' || mode === 'FORM_OTHERS') && (
        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
          {/* Exchange Calculation Card */}
          <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-2xl overflow-hidden">
            <div className="bg-gray-50/50 dark:bg-white/5 px-6 py-4 border-b border-[var(--dynamic-card-border)]">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Foreign Exchange</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Amount with integrated currency selector -> Named Send amount */}
            <div className="relative">
              <InputField
                label="Send amount"
                name="payoutAmount"
                type="number"
                value={payoutAmount}
                onChange={(e) => handlePayoutAmountChange(e.target.value)}
                placeholder="0.00"
                inputClassName="!pl-[58px]"
                leftActionIcon={<div className="w-8" />}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center pr-1 border-r border-gray-200 dark:border-white/10 h-6 select-none">
                <select
                  value={payoutCurrency}
                  onChange={(e) => handlePayoutCurrencyChange(e.target.value)}
                  className="bg-transparent text-[12px] font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer appearance-none pr-3 focus:ring-0 focus:outline-none"
                  style={{ color: 'var(--text-main)', border: 'none' }}
                >
                  <option value="QAR" className="text-black bg-white">QAR</option>
                  <option value="BDT" className="text-black bg-white">BDT</option>
                  <option value="USD" className="text-black bg-white">USD</option>
                </select>
                <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Exchange Rate Input */}
            <InputField
              label="Exchange Rate"
              name="Exchange Rate"
              type="number"
              value={exchangeRate}
              onChange={(e) => handleExchangeRateChange(e.target.value)}
              placeholder="1.0"
            />

            {/* Receive Amount with integrated currency selector -> Named Receive Amount */}
            <div className="relative">
              <InputField
                label="Receive Amount"
                name="receiveAmount"
                type="number"
                value={receiveAmount}
                onChange={(e) => handleReceiveAmountChange(e.target.value)}
                placeholder="0.00"
                inputClassName="!pl-[58px]"
                leftActionIcon={<div className="w-8" />}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex items-center pr-1 border-r border-gray-200 dark:border-white/10 h-6 select-none">
                <select
                  value={receiveCurrency}
                  onChange={(e) => handleReceiveCurrencyChange(e.target.value)}
                  className="bg-transparent text-[12px] font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer appearance-none pr-3 focus:ring-0 focus:outline-none"
                  style={{ color: 'var(--text-main)', border: 'none' }}
                >
                  <option value="BDT" className="text-black bg-white">BDT</option>
                  <option value="QAR" className="text-black bg-white">QAR</option>
                  <option value="USD" className="text-black bg-white">USD</option>
                </select>
                <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
            </div>
            
            </div>
          </div>
          
          {/* Details Card */}
          <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-2xl overflow-hidden">
            <div className="bg-gray-50/50 dark:bg-white/5 px-6 py-4 border-b border-[var(--dynamic-card-border)]">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Additional Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Source of Income Dropdown */}
              <div className="space-y-1">
                <div className="relative">
                  <select
                    value={sourceOfIncome}
                    onChange={(e) => setSourceOfIncome(e.target.value)}
                    className="w-full px-4 h-12 rounded-xl border border-gray-200 dark:border-white/10 bg-[#ebebeb] dark:bg-white/5 text-sm font-medium text-text-main focus:ring-2 focus:ring-[#10b981] outline-none transition-all appearance-none"
                  >
                    <option value="" className="text-black bg-white">
                      {language === 'bn' ? 'আয়ের উৎস (Source of Income)' : 'Source of Income'}
                    </option>
                    {incomeSources.map((source) => (
                      <option key={source.value} value={source.value} className="text-black bg-white">
                        {source.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>

              {/* Purpose Dropdown */}
              <div className="space-y-1">
                <div className="relative">
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 h-12 rounded-xl border border-gray-200 dark:border-white/10 bg-[#ebebeb] dark:bg-white/5 text-sm font-medium text-text-main focus:ring-2 focus:ring-[#10b981] outline-none transition-all appearance-none"
                  >
                    <option value="" className="text-black bg-white">
                      {language === 'bn' ? 'উদ্দেশ্য (Purpose)' : 'Purpose'}
                    </option>
                    {purposeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="text-black bg-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>
              
              {mode === 'FORM_FAMILY' ? (
                <>
                  {renderInputField('Family Member Name', familyMemberName, setFamilyMemberName, 'text', 'Enter name')}
                  <div className="space-y-1">
                    <div className="relative">
                      <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        className="w-full px-4 h-12 rounded-xl border border-gray-200 dark:border-white/10 bg-[#ebebeb] dark:bg-white/5 text-sm font-medium text-text-main focus:ring-2 focus:ring-[#10b981] outline-none transition-all appearance-none"
                      >
                        <option value="">
                          {language === 'bn' ? 'সম্পর্ক (Select Relationship)' : 'Select Relationship'}
                        </option>
                        {relationships.map((rel: string, idx: number) => (
                          <option key={idx} value={rel}>{rel}</option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                renderInputField('Category', otherCategory, setOtherCategory, 'text', 'Enter category')
              )}
            </div>
          </div>
            
          {/* Payment Details Card */}
          <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-2xl overflow-hidden">
            <div className="bg-gray-50/50 dark:bg-white/5 px-6 py-4 border-b border-[var(--dynamic-card-border)]">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Payment Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Payment Method</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setPaymentMethod('Bank Transfer')}
                    className={`flex-1 h-12 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'Bank Transfer' ? 'border-[#10b981] bg-[#10b981]/5 text-[#10b981]' : 'border-gray-200 dark:border-white/10 bg-[#ebebeb] dark:bg-white/5 text-gray-500 hover:border-gray-300'}`}
                  >
                    Bank Transfer
                  </button>
                  <button
                    onClick={() => setPaymentMethod('Mobile Banking')}
                    className={`flex-1 h-12 rounded-xl border-2 transition-all font-bold text-sm ${paymentMethod === 'Mobile Banking' ? 'border-[#10b981] bg-[#10b981]/5 text-[#10b981]' : 'border-gray-200 dark:border-white/10 bg-[#ebebeb] dark:bg-white/5 text-gray-500 hover:border-gray-300'}`}
                  >
                    Mobile Banking
                  </button>
                </div>
              </div>

              {paymentMethod === 'Bank Transfer' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Bank Name</label>
                    <div className="relative">
                      <select
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 h-12 rounded-xl border border-gray-200 dark:border-white/10 bg-[#ebebeb] dark:bg-white/5 text-sm font-medium text-text-main focus:ring-2 focus:ring-[#10b981] outline-none transition-all appearance-none pr-10"
                      >
                        <option value="">Select Bank Name</option>
                        {bankNames.map((bank: string, idx: number) => (
                          <option key={idx} value={bank}>{bank}</option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  {renderInputField('Account Name', accountName, setAccountName, 'text', 'Enter Account Name')}
                  {renderInputField('Account Number', accountNumber, setAccountNumber, 'text', 'Bank Account number')}
                  {renderInputField('Transaction Reference (Optional)', transactionReference, setTransactionReference, 'text', 'Enter Reference')}
                </>
              )}

              {paymentMethod === 'Mobile Banking' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider ml-1">Mobile Banking Wallet</label>
                    <div className="relative">
                      <select
                        value={mobileBankingWallet}
                        onChange={(e) => setMobileBankingWallet(e.target.value)}
                        className="w-full px-4 h-12 rounded-xl border border-gray-200 dark:border-white/10 bg-[#ebebeb] dark:bg-white/5 text-sm font-medium text-text-main focus:ring-2 focus:ring-[#10b981] outline-none transition-all appearance-none pr-10"
                      >
                        <option value="">Select Wallet</option>
                        {mobileBankingWallets.map((wallet: string, idx: number) => (
                          <option key={idx} value={wallet}>{wallet}</option>
                        ))}
                      </select>
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  {(() => {
                    let placeholder = 'Account/Wallet Number';
                    const walletStr = mobileBankingWallet.toLowerCase();
                    if (walletStr === 'bkash' || walletStr === 'b-kash') {
                      placeholder = 'Bkash Account number';
                    } else if (walletStr === 'nagad') {
                      placeholder = 'Nagad Account Number';
                    } else if (mobileBankingWallet) {
                      placeholder = `${mobileBankingWallet} Account number`;
                    }
                    return renderInputField('Account/Wallet Number', accountNumber, setAccountNumber, 'text', placeholder);
                  })()}
                  {renderInputField('Transaction ID (Optional)', transactionId, setTransactionId, 'text', 'Enter TrxID')}
                </>
              )}
            </div>
          </div>
          
          <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-2xl p-6 space-y-6">

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description / Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter details here..."
              className="w-full h-24 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-medium text-text-main focus:ring-2 focus:ring-[#10b981] outline-none transition-all resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Attachment (Optional)</label>
            <input
              type="file"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm font-medium text-text-main focus:ring-2 focus:ring-[#10b981] outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#10b981]/10 file:text-[#10b981] hover:file:bg-[#10b981]/20 cursor-pointer"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-solid border-black/90 dark:border-white/90">
            <button 
              onClick={() => setMode('LIST')}
              className="w-full sm:flex-1 h-12 flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-600 font-bold rounded-[12px] hover:bg-gray-200 transition-all text-sm uppercase tracking-wider"
            >
              {TRANSLATIONS[language as keyof typeof TRANSLATIONS]?.CANCEL || 'Cancel'}
            </button>
            <button 
              onClick={handleSave}
              className="w-full sm:flex-[2] h-12 flex items-center justify-center gap-2 bg-[#10b981] text-white font-black rounded-[12px] shadow-lg hover:opacity-90 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              <Check size={18} />
              {TRANSLATIONS[language as keyof typeof TRANSLATIONS]?.SUBMIT || 'Submit'}
            </button>
          </div>
        </div>
        </div>
      )}

      {mode === 'VIEW' && selectedTxn && (
        <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] rounded-2xl p-6 space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="flex items-center justify-between border-b border-solid border-black/90 dark:border-white/90 pb-4">
            <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <div className={`p-3 rounded-xl ${selectedTxn.category === 'Family' ? 'bg-pink-50 text-pink-500 dark:bg-pink-500/10' : 'bg-purple-50 text-purple-500 dark:bg-purple-500/10'}`}>
                {selectedTxn.category === 'Family' ? <Home size={24} /> : <Users size={24} />}
              </div>
              {selectedTxn.category} Record
            </h2>
            <button
              onClick={() => handleDownloadPDF(selectedTxn)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-[#ec4899] hover:text-white transition-colors"
              title="Download PDF"
            >
              <Download size={20} />
            </button>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Send Amount</p>
              <p className="text-base font-black text-[#10b981]">
                {(selectedTxn.payoutAmount ?? selectedTxn.amount).toLocaleString()} <span className="text-xs font-medium text-gray-500">{selectedTxn.payoutCurrency ?? 'QAR'}</span>
              </p>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Receive Amount</p>
              <p className="text-base font-black text-green-600">
                {((selectedTxn.receiveAmount ?? (selectedTxn.payoutAmount && selectedTxn.exchangeRate ? (selectedTxn.payoutAmount * selectedTxn.exchangeRate) : selectedTxn.amount))).toLocaleString()} <span className="text-xs font-medium text-gray-500">{selectedTxn.receiveCurrency ?? 'BDT'}</span>
              </p>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Exchange Rate</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">1 {selectedTxn.payoutCurrency ?? 'QAR'} = {selectedTxn.exchangeRate ?? '1.0'} {selectedTxn.receiveCurrency ?? 'BDT'}</p>
            </div>
            {selectedTxn.sourceOfIncome && (
              <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Source of Income</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.sourceOfIncome}</p>
              </div>
            )}
            <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction Date</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.date}</p>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCard size={14} className="text-gray-400" />
                {selectedTxn.paymentMethod || 'N/A'}
              </p>
            </div>

            {selectedTxn.paymentMethod === 'Bank Transfer' && (
              <>
                <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bank Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.bankName || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Name</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.accountName || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Number</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.accountNumber || 'N/A'}</p>
                </div>
                {selectedTxn.transactionReference && (
                  <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction Reference</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.transactionReference}</p>
                  </div>
                )}
              </>
            )}

            {selectedTxn.paymentMethod === 'Mobile Banking' && (
              <>
                <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile Banking Wallet</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.mobileBankingWallet || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account/Wallet Number</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.accountNumber || 'N/A'}</p>
                </div>
                {selectedTxn.transactionId && (
                  <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction ID</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.transactionId}</p>
                  </div>
                )}
              </>
            )}
            
            {selectedTxn.category === 'Family' ? (
              <>
                <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Family Member</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.familyMemberName || 'N/A'}</p>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Relationship</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.relationship || 'N/A'}</p>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center py-3 border-b border-solid border-black/90 dark:border-white/90">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedTxn.otherCategory || 'N/A'}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-1 pt-4 border-t border-solid border-black/90 dark:border-white/90">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-4 rounded-xl leading-relaxed whitespace-pre-wrap">
              {selectedTxn.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => handleOpenForm(selectedTxn.category, selectedTxn)}
              className="flex-1 h-12 bg-gray-100 dark:bg-white/5 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Edit2 size={16} />
              Edit Record
            </button>
            <button 
              onClick={() => handleDelete(selectedTxn.id)}
              className="flex-1 h-12 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete Record
            </button>
          </div>
        </div>
      )}

      {/* Global Month Selection Modal */}
      <GlobalFullscreenSelect
        isOpen={isMonthSelectOpen}
        onClose={() => setIsMonthSelectOpen(false)}
        onSelect={(val) => {
          setSelectedMonth(val === 'ALL' ? 'ALL' : Number(val));
          setIsMonthSelectOpen(false);
        }}
        options={[
          { label: language === 'bn' ? 'সকল মাস' : 'All Months', value: 'ALL' },
          ...months.map(m => ({ label: m.label, value: String(m.value) }))
        ]}
        title={language === 'bn' ? 'মাস নির্বাচন করুন' : 'Select Month'}
        selectedValue={String(selectedMonth)}
        searchable={false}
        allowAdd={false}
      />

      {/* Global Year Selection Modal */}
      <GlobalFullscreenSelect
        isOpen={isYearSelectOpen}
        onClose={() => setIsYearSelectOpen(false)}
        onSelect={(val) => {
          setSelectedYear(val === 'ALL' ? 'ALL' : Number(val));
          setIsYearSelectOpen(false);
        }}
        options={[
          { label: language === 'bn' ? 'সকল বছর' : 'All Years', value: 'ALL' },
          ...years.map(y => ({ label: String(y), value: String(y) }))
        ]}
        title={language === 'bn' ? 'বছর নির্বাচন করুন' : 'Select Year'}
        selectedValue={String(selectedYear)}
        searchable={false}
        allowAdd={false}
      />
    </div>
  );
};

export default FamilyMaintenance;
