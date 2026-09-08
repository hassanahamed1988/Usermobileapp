import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, CreditCard, ChevronLeft, ChevronRight, DollarSign, 
  Calendar, User, Building, Phone, Mail, MapPin, FileText, CheckCircle2, 
  Clock, AlertCircle, ArrowUpRight, ArrowDownRight, ArrowRight, ArrowDownLeft, X, Wallet, Hash, 
  Tag, Info, Percent, RefreshCw, Trash2, ShieldCheck, Check, Pencil, Edit2, Download, ArrowLeft,
  Loader2, Share2, Image as ImageIcon
} from 'lucide-react';
import { useStore } from '@/store';
import { TRANSLATIONS } from '@/constants';
import { Loan, LoanPayment } from '@/types';
import InputField from '@/components/InputField';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import GlobalDateTimePicker from '@/components/GlobalDateTimePicker';
import CountryCodeDropdown from '@/components/CountryCodeDropdown';
import Button from '@/components/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function LoanManagement() {
  const { 
    user, loans = [], loanPayments = [], addLoan, updateLoan, removeLoan, 
    addLoanPayment, updateLoanPayment, removeLoanPayment, language, setView, isNightMode, 
    backgroundColor, currentThemeObj,
    showFeedback, selectedCurrency, primaryColor, confirmConfig, confirmAction,
    setCustomHeaderTitle, setCustomBackAction,
    countries = [], idTypes = [], banks = [], branches = [], currencies = [], loanPurposes = []
  } = useStore();

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const defaultCountryCode = useMemo(() => {
    return countries && countries.length > 0 ? countries[0].code : '+974';
  }, [countries]);

  // Local state
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isFabOpen, setIsFabOpen] = useState<boolean>(false);
  const [isNewLoanSubpageOpen, setIsNewLoanSubpageOpen] = useState<boolean>(false);
  const [isEditLoanMode, setIsEditLoanMode] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeButtonAction, setActiveButtonAction] = useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState<boolean>(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState<boolean>(false);
  const [isEditingInterest, setIsEditingInterest] = useState<boolean>(false);
  const [tempInterestAmount, setTempInterestAmount] = useState<string>('');
  const [isFrequencySelectOpen, setIsFrequencySelectOpen] = useState<boolean>(false);

  // Receipt Generation State
  const [showReceipt, setShowReceipt] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const receiptRef = React.useRef<HTMLDivElement>(null);

  const generateReceiptPhoto = async () => {
    const node = receiptRef.current;
    if (!node) return;
    
    // Create a clone to render while the modal closes instantly
    const clone = node.cloneNode(true) as HTMLElement;
    const rect = node.getBoundingClientRect();
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.position = 'fixed';
    // Position at top: 0 to ensure mobile browsers render it (avoids empty captures from -9999px)
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-9999';
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);
    
    try {
      const canvas = await html2canvas(clone, {
        scale: 3, // High quality
        backgroundColor: currentThemeObj?.background || (isNightMode ? '#0f172a' : '#ffffff'),
        logging: false,
        useCORS: true
      });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `Receipt_${receiptData?.id || Date.now()}.png`;
      link.click();
      showFeedback?.(language === 'bn' ? 'ফটো সফলভাবে তৈরি হয়েছে!' : 'Receipt photo generated!', 'success');
    } catch (error) {
      console.error('Error generating receipt:', error);
      showFeedback?.('Failed to generate photo', 'error');
    } finally {
      if (document.body.contains(clone)) {
        document.body.removeChild(clone);
      }
    }
  };

  const exportAndPromptPDF = async (doc: jsPDF, filename: string) => {
    try {
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Force standard download (Best approach for Chrome Android to trigger the "Open" snackbar)
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Keep the blob alive for a few seconds to ensure download finishes
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      showFeedback?.(
        language === 'bn' 
          ? 'পিডিএফ ডাউনলোড হয়েছে। স্ক্রিনের নিচে বা নোটিফিকেশন থেকে "Open" এ ক্লিক করে ভিউয়ার সিলেক্ট করুন।' 
          : 'PDF downloaded. Click "Open" from the notification to select a viewer.', 
        'success'
      );
    } catch (error) {
      console.error('PDF Export Error:', error);
      showFeedback?.(language === 'bn' ? 'পিডিএফ তৈরি করতে সমস্যা হয়েছে' : 'Error generating PDF', 'error');
    }
  };
  const [isPurposeSelectOpen, setIsPurposeSelectOpen] = useState<boolean>(false);
  const [isCurrencySelectOpen, setIsCurrencySelectOpen] = useState<boolean>(false);
  const [isPayLoanModalOpen, setIsPayLoanModalOpen] = useState<boolean>(false);
  const [isEditingPayment, setIsEditingPayment] = useState<boolean>(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [isLoanDetailModalOpen, setIsLoanDetailModalOpen] = useState<boolean>(false);
  const [selectedLoanDetail, setSelectedLoanDetail] = useState<any>(null);
  const [isInstallmentVoucherOpen, setIsInstallmentVoucherOpen] = useState<boolean>(false);
  const [selectedInstallmentData, setSelectedInstallmentData] = useState<any>(null);
  const [manualEditLoanRecord, setManualEditLoanRecord] = useState<Loan | null>(null);
  const [isIdTypeSelectOpen, setIsIdTypeSelectOpen] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [isBankSelectOpen, setIsBankSelectOpen] = useState<{ open: boolean, type: 'sender' | 'receiver' }>({ open: false, type: 'sender' });
  const [isBranchSelectOpen, setIsBranchSelectOpen] = useState<{ open: boolean, type: 'sender' | 'receiver' }>({ open: false, type: 'sender' });

  // Borrower Subpage and Editing States
  const [isBorrowerSubpageOpen, setIsBorrowerSubpageOpen] = useState<boolean>(false);
  const [isEditingBorrower, setIsEditingBorrower] = useState<boolean>(false);
  const [borrowerForm, setBorrowerForm] = useState({
    borrowerName: '',
    borrowerMobile: '',
    borrowerEmail: '',
    borrowerCountryCode: '',
    borrowerIdType: '',
    borrowerIdNumber: '',
    borrowerAddress: '',
    borrowerReference: '',
    loanPurpose: '',
    notes: ''
  });

  const handleBorrowerFormChange = (name: string, value: string) => {
    setBorrowerForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Set Custom Header Title and Back Button behavior for Subpages & Views
  useEffect(() => {
    if (isPayLoanModalOpen) {
      setCustomHeaderTitle(
        isEditingPayment
          ? (language === 'bn' ? 'পেমেন্ট এডিট' : 'Edit Payment')
          : (language === 'bn' ? 'নতুন পেমেন্ট' : 'New Payment')
      );
      setCustomBackAction(() => {
        setIsPayLoanModalOpen(false);
        setIsEditingPayment(false);
        setEditingPaymentId(null);
      });
    } else if (isBorrowerSubpageOpen) {
      setCustomHeaderTitle(language === 'bn' ? 'ঋণগ্রহীতার তথ্য' : 'Borrower Details');
      setCustomBackAction(() => {
        setIsBorrowerSubpageOpen(false);
        setIsEditingBorrower(false);
      });
    } else if (isNewLoanSubpageOpen) {
      setCustomHeaderTitle(language === 'bn' 
        ? (isEditLoanMode ? 'লোন আপডেট' : 'নতুন লোন রেজিস্ট্রেশন') 
        : (isEditLoanMode ? 'Edit Loan Registration' : 'New Loan Registration'));
      setCustomBackAction(() => {
        setIsNewLoanSubpageOpen(false);
        setIsEditLoanMode(false);
        setManualEditLoanRecord(null);
      });
    } else if (selectedCompany) {
      setCustomHeaderTitle(language === 'bn' ? 'লোন ডিটেইলস' : 'Loan Details');
      setCustomBackAction(() => {
        setSelectedCompany(null);
      });
    } else {
      setCustomHeaderTitle(null);
      setCustomBackAction(null);
    }
    return () => {
      setCustomHeaderTitle(null);
      setCustomBackAction(null);
    };
  }, [isPayLoanModalOpen, isEditingPayment, isNewLoanSubpageOpen, selectedCompany, isBorrowerSubpageOpen, isEditLoanMode, language, setCustomHeaderTitle, setCustomBackAction]);

  // Currency symbol & theme helper
  const globalCurrencySymbol = selectedCurrency?.symbol || 'QAR';
  const getLocalCurrencySymbol = (code?: string) => {
    if (code === 'BDT') return '৳';
    if (code === 'USD') return '$';
    if (code === 'QAR') return 'QR';
    return globalCurrencySymbol;
  };

  const getReferenceLabel = (method: string) => {
    switch (method) {
      case 'Check': return language === 'bn' ? 'চেক নম্বর লিখুন' : 'Enter Check Number';
      case 'Bank Transfer': return language === 'bn' ? 'ট্রানজেকশন আইডি লিখুন' : 'Enter Transaction ID';
      case 'Mobile Banking':
      case 'bKash':
      case 'Nagad': return language === 'bn' ? `${method} ট্রানজেকশন আইডি লিখুন` : `Enter ${method} Transaction ID`;
      default: return language === 'bn' ? 'রেফারেন্স / ট্রানজেকশন আইডি' : 'Reference / Transaction ID';
    }
  };

  const activePrimaryColor = primaryColor || '#10b981';

  // Filter user's personal loans & payments
  const userLoans = useMemo(() => {
    return loans.filter((l: Loan) => l && (l.userId === user?.id || !l.userId));
  }, [loans, user]);

  const userPayments = useMemo(() => {
    return loanPayments.filter((p: LoanPayment) => p && (p.userId === user?.id || !p.userId));
  }, [loanPayments, user]);

  // Group user loans by company name
  const companySummaries = useMemo(() => {
    const map = new Map<string, {
      companyName: string;
      companyContact?: string;
      companyAddress?: string;
      currency: string;
      loans: Loan[];
      totalLoanAmount: number;
      totalPaidAmount: number;
      totalSavingsAmount: number;
      outstandingBalance: number;
      activeLoansCount: number;
    }>();

    userLoans.forEach((loan) => {
      const companyKey = (loan.companyName || 'Unknown Company').trim().toUpperCase();
      const existing = map.get(companyKey);

      // Compute total payments for this specific loan
      const paymentsForLoan = userPayments.filter(p => p.loanId === loan.id);
      const paidForLoan = paymentsForLoan.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const savingsForLoan = paymentsForLoan.reduce((sum, p) => sum + (Number(p.savingsAmount) || 0), 0);
      const loanTotalPaid = (Number(loan.totalPaid) || 0) > paidForLoan ? Number(loan.totalPaid) : paidForLoan;
      const loanTotalSavings = (Number(loan.totalSavings) || 0) > savingsForLoan ? Number(loan.totalSavings) : savingsForLoan;
      const loanAmount = Number(loan.loanAmount) || 0;
      const interestAmount = Number(loan.interestAmount) || 0;
      const totalPayable = loanAmount + interestAmount;
      const loanBalance = Math.max(0, totalPayable - loanTotalPaid);

      if (!existing) {
        map.set(companyKey, {
          companyName: loan.companyName,
          companyContact: loan.companyContact,
          companyAddress: loan.companyAddress,
          currency: loan.currency || 'BDT',
          loans: [loan],
          totalLoanAmount: totalPayable,
          totalPaidAmount: loanTotalPaid,
          totalSavingsAmount: loanTotalSavings,
          outstandingBalance: loanBalance,
          activeLoansCount: loanBalance > 0 ? 1 : 0
        });
      } else {
        existing.loans.push(loan);
        existing.totalLoanAmount += totalPayable;
        existing.totalPaidAmount += loanTotalPaid;
        existing.totalSavingsAmount += loanTotalSavings;
        existing.outstandingBalance += loanBalance;
        if (loanBalance > 0) existing.activeLoansCount += 1;
        if (!existing.companyContact && loan.companyContact) existing.companyContact = loan.companyContact;
        if (!existing.companyAddress && loan.companyAddress) existing.companyAddress = loan.companyAddress;
      }
    });

    return Array.from(map.values());
  }, [userLoans, userPayments]);

  // Filtered companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companySummaries;
    const q = searchQuery.toLowerCase();
    return companySummaries.filter(c => 
      c.companyName.toLowerCase().includes(q) ||
      (c.companyContact && c.companyContact.toLowerCase().includes(q))
    );
  }, [companySummaries, searchQuery]);

  // Selected Loan Details Data
  const selectedSummary = useMemo(() => {
    if (!selectedCompany) return null;
    return companySummaries.find(c => c.companyName.toUpperCase() === selectedCompany.toUpperCase());
  }, [companySummaries, selectedCompany]);

  const selectedLoanRecord = useMemo(() => {
    if (!selectedSummary || selectedSummary.loans.length === 0) return null;
    // Primary or latest loan record for detail view
    return selectedSummary.loans[selectedSummary.loans.length - 1];
  }, [selectedSummary]);

  const selectedLoanPayments = useMemo(() => {
    if (!selectedSummary) return [];
    const loanIds = selectedSummary.loans.map(l => l.id);
    return userPayments
      .filter(p => loanIds.includes(p.loanId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedSummary, userPayments]);

  const combinedHistory = useMemo(() => {
    if (!selectedSummary) return [];
    
    const loanIds = selectedSummary.loans.map(l => l.id);
    const payments = userPayments.filter(p => loanIds.includes(p.loanId));
    
    const history = [
      ...selectedSummary.loans.map(loan => ({
        id: loan.id,
        loanData: loan,
        historyType: 'LOAN_RECEIVE' as const,
        date: loan.loanDate || loan.createdAt || new Date().toISOString(),
        amount: Number(loan.loanAmount) || 0,
        currency: loan.currency,
      })),
      ...payments.map(payment => {
        const loan = selectedSummary.loans.find(l => l.id === payment.loanId);
        return {
          id: payment.id,
          loanData: loan,
          paymentData: payment,
          historyType: 'INSTALLMENT_PAID' as const,
          date: payment.date || payment.createdAt || new Date().toISOString(),
          amount: (Number(payment.amount) || 0) + (Number(payment.savingsAmount) || 0),
          currency: loan?.currency,
        };
      })
    ];
    
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedSummary, userPayments]);

  const handleOpenBorrowerDetails = (startInEditMode: boolean = false) => {
    if (!selectedLoanRecord) return;
    setBorrowerForm({
      borrowerName: selectedLoanRecord.borrowerName || '',
      borrowerMobile: selectedLoanRecord.borrowerMobile || '',
      borrowerEmail: selectedLoanRecord.borrowerEmail || '',
      borrowerCountryCode: selectedLoanRecord.borrowerCountryCode || defaultCountryCode,
      borrowerIdType: selectedLoanRecord.borrowerIdType || '',
      borrowerIdNumber: selectedLoanRecord.borrowerIdNumber || '',
      borrowerAddress: selectedLoanRecord.borrowerAddress || '',
      borrowerReference: selectedLoanRecord.borrowerReference || '',
      loanPurpose: selectedLoanRecord.loanPurpose || '',
      notes: selectedLoanRecord.notes || ''
    });
    setIsEditingBorrower(startInEditMode);
    setIsNewLoanSubpageOpen(false); // Close other subpage
    setIsBorrowerSubpageOpen(true);
  };

  const handleSaveBorrowerDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanRecord) return;
    if (!borrowerForm.borrowerName.trim()) {
      showFeedback?.(language === 'bn' ? 'দয়া করে নাম লিখুন' : 'Please enter Borrower Name', 'error');
      return;
    }
    if (!borrowerForm.borrowerMobile.trim()) {
      showFeedback?.(language === 'bn' ? 'দয়া করে মোবাইল নম্বর লিখুন' : 'Please enter Mobile Number', 'error');
      return;
    }

    const updatedLoan: Loan = {
      ...selectedLoanRecord,
      borrowerName: borrowerForm.borrowerName.trim(),
      borrowerMobile: borrowerForm.borrowerMobile.trim(),
      borrowerEmail: borrowerForm.borrowerEmail.trim() || undefined,
      borrowerCountryCode: borrowerForm.borrowerCountryCode || undefined,
      borrowerIdType: borrowerForm.borrowerIdType || undefined,
      borrowerIdNumber: borrowerForm.borrowerIdNumber.trim() || undefined,
      borrowerAddress: borrowerForm.borrowerAddress.trim() || undefined,
      borrowerReference: borrowerForm.borrowerReference.trim() || undefined,
      loanPurpose: borrowerForm.loanPurpose.trim() || undefined,
      notes: borrowerForm.notes.trim() || undefined,
    };

    updateLoan?.(updatedLoan);
    showFeedback?.(language === 'bn' ? 'তথ্য সফলভাবে সংরক্ষণ করা হয়েছে' : 'Loan details updated successfully', 'success');
    setIsEditingBorrower(false);
  };

  const handleDownloadPDF = async () => {
    if (!selectedLoanRecord || !selectedSummary) return;

    setIsDownloadingPDF(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Helper for currency
      const currency = selectedSummary.currency || 'BDT';
      const symbol = getLocalCurrencySymbol(currency);

      // Header
      doc.setFillColor(243, 244, 246); // Light gray bg for header
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'bn' ? 'ঋণ বিবরণী রিপোর্ট' : 'Loan Statement Report', 20, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(language === 'bn' ? `তারিখ: ${new Date().toLocaleDateString()}` : `Date Generated: ${new Date().toLocaleDateString()}`, 20, 28);
      
      // Line under header
      doc.setDrawColor(203, 213, 225);
      doc.line(20, 35, 190, 35);

      // Borrower Information Section
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'bn' ? 'ঋণগ্রহীতার তথ্য' : 'Borrower Information', 20, 50);

      const borrowerRows = [
        [language === 'bn' ? 'নাম' : 'Full Name', borrowerForm.borrowerName || '—'],
        [language === 'bn' ? 'মোবাইল' : 'Mobile Number', `${borrowerForm.borrowerCountryCode} ${borrowerForm.borrowerMobile}`],
        [language === 'bn' ? 'ইমেইল' : 'Email Address', borrowerForm.borrowerEmail || '—'],
        [language === 'bn' ? 'ঠিকানা' : 'Address', borrowerForm.borrowerAddress || '—'],
        [language === 'bn' ? 'ডকুমেন্ট টাইপ' : 'Document Type', borrowerForm.borrowerIdType || '—'],
        [language === 'bn' ? 'আইডি নম্বর' : 'ID Number', borrowerForm.borrowerIdNumber || '—'],
        [language === 'bn' ? 'রেফারেন্স' : 'Reference', borrowerForm.borrowerReference || '—'],
      ];

      autoTable(doc, {
        startY: 55,
        head: [],
        body: borrowerRows,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        margin: { left: 20 }
      });

      // Company & Loan Details Section
      let currentY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(language === 'bn' ? 'কোম্পানি ও ঋণের বিবরণ' : 'Company & Loan Details', 20, currentY);

      const totalAmount = (selectedLoanRecord.loanAmount || 0) + (selectedLoanRecord.interestAmount || 0);

      const loanRows = [
        [language === 'bn' ? 'কোম্পানির নাম' : 'Company Name', selectedSummary.companyName || '—'],
        [language === 'bn' ? 'কোম্পানি কন্টাক্ট' : 'Company Contact', selectedSummary.companyContact || '—'],
        [language === 'bn' ? 'কোম্পানি ঠিকানা' : 'Company Address', selectedSummary.companyAddress || '—'],
        [language === 'bn' ? 'লোন কারেন্সি' : 'Currency', currency],
        [language === 'bn' ? 'মূল ঋণ' : 'Principal Amount', `${symbol} ${selectedLoanRecord.loanAmount?.toLocaleString()}`],
        [language === 'bn' ? 'সুদের হার' : 'Interest Rate', `${selectedLoanRecord.interestRate}%`],
        [language === 'bn' ? 'সুদ পরিমাণ' : 'Interest Amount', `${symbol} ${selectedLoanRecord.interestAmount?.toLocaleString()}`],
        [language === 'bn' ? 'মোট ঋণের পরিমাণ' : 'Total Loan Amount', `${symbol} ${totalAmount.toLocaleString()}`],
        [language === 'bn' ? 'কিস্তির পরিমাণ' : 'Installment Amount', `${symbol} ${selectedLoanRecord.installmentAmount?.toLocaleString()}`],
        [language === 'bn' ? 'কিস্তির সংখ্যা' : 'Installments', `${selectedLoanRecord.paidInstallments || 0} / ${selectedLoanRecord.numberOfInstallments}`],
        [language === 'bn' ? 'পেমেন্ট ফ্রিকোয়েন্সি' : 'Payment Frequency', selectedLoanRecord.paymentFrequency || 'MONTHLY'],
        [language === 'bn' ? 'ঋণের তারিখ' : 'Loan Date', selectedLoanRecord.loanDate || '—'],
        [language === 'bn' ? 'বর্তমান বকেয়া' : 'Outstanding Balance', `${symbol} ${selectedLoanRecord.outstandingBalance?.toLocaleString()}`],
        [language === 'bn' ? 'লোন স্ট্যাটাস' : 'Loan Status', selectedLoanRecord.status || 'ACTIVE'],
      ];

      autoTable(doc, {
        startY: currentY + 5,
        head: [],
        body: loanRows,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3, lineColor: [226, 232, 240] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } },
        margin: { left: 20 }
      });

      // Summary Box
      currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(20, currentY, 170, 30, 3, 3, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(language === 'bn' ? 'বর্তমান বকেয়া ব্যালেন্স:' : 'Current Outstanding Balance:', 30, currentY + 12);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(2, 132, 199); // sky-600
      doc.text(`${symbol} ${selectedLoanRecord.outstandingBalance?.toLocaleString()}`, 30, currentY + 22);

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          language === 'bn' ? `পৃষ্ঠা ${i} / ${pageCount}` : `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
        doc.text(
          'FleetPro Loan Management System',
          20,
          doc.internal.pageSize.height - 10
        );
      }

      await exportAndPromptPDF(doc, `${(borrowerForm.borrowerName || 'Borrower').replace(/\s+/g, '_')}_Loan_Details.pdf`);
    } catch (err) {
      console.error(err);
      showFeedback?.('Failed to download PDF', 'error');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDeleteBorrowerProfile = () => {
    if (!selectedLoanRecord) return;
    
    confirmAction(
      language === 'bn' 
        ? 'আপনি কি নিশ্চিত যে এই ঋণগ্রহীতার প্রোফাইলটি ডিলিট করতে চান? এই লোন সংক্রান্ত সকল তথ্য মুছে যাবে।' 
        : 'Are you sure you want to delete this borrower profile? All associated loan data will be removed.',
      async () => {
        setIsDeletingProfile(true);
        try {
          if (removeLoan && selectedLoanRecord.id) {
            removeLoan(selectedLoanRecord.id);
          }
          showFeedback?.(
            language === 'bn' ? 'প্রোফাইল সফলভাবে ডিলিট করা হয়েছে!' : 'Profile deleted successfully!',
            'success'
          );
          setIsBorrowerSubpageOpen(false);
          setIsEditingBorrower(false);
          setSelectedCompany(null);
        } catch {
          showFeedback?.(
            language === 'bn' ? 'প্রোফাইল ডিলিট করতে ব্যর্থ হয়েছে!' : 'Failed to delete profile!',
            'error'
          );
        } finally {
          setIsDeletingProfile(false);
        }
      }
    );
  };

  const handleOpenEditLoan = () => {
    if (!selectedLoanRecord) return;
    setNewLoanForm({
      borrowerName: selectedLoanRecord.borrowerName || '',
      borrowerMobile: selectedLoanRecord.borrowerMobile || '',
      borrowerCountryCode: selectedLoanRecord.borrowerCountryCode || defaultCountryCode,
      borrowerIdType: selectedLoanRecord.borrowerIdType || '',
      borrowerIdNumber: selectedLoanRecord.borrowerIdNumber || '',
      borrowerEmail: selectedLoanRecord.borrowerEmail || '',
      borrowerAddress: selectedLoanRecord.borrowerAddress || '',
      borrowerReference: selectedLoanRecord.borrowerReference || '',
      companyName: selectedLoanRecord.companyName || '',
      companyContact: selectedLoanRecord.companyContact || '',
      companyAddress: selectedLoanRecord.companyAddress || '',
      loanAmount: String(selectedLoanRecord.loanAmount || ''),
      loanDate: selectedLoanRecord.loanDate || new Date().toISOString().split('T')[0],
      interestRate: String(selectedLoanRecord.interestRate || ''),
      loanTerm: String(selectedLoanRecord.loanTerm || '12'),
      paymentFrequency: selectedLoanRecord.paymentFrequency || 'MONTHLY',
      installmentAmount: String(selectedLoanRecord.installmentAmount || ''),
      numberOfInstallments: String(selectedLoanRecord.numberOfInstallments || '12'),
      firstPaymentDate: selectedLoanRecord.firstPaymentDate || new Date().toISOString().split('T')[0],
      loanPurpose: selectedLoanRecord.loanPurpose || '',
      notes: selectedLoanRecord.notes || '',
      currency: selectedLoanRecord.currency || 'BDT'
    });
    setIsBorrowerSubpageOpen(false); // Close other subpage
    setIsEditLoanMode(true);
    setIsNewLoanSubpageOpen(true);
  };

  // New Loan Form State
  const [newLoanForm, setNewLoanForm] = useState({
    borrowerName: user?.name || '',
    borrowerMobile: user?.mobile || '',
    borrowerCountryCode: defaultCountryCode,
    borrowerIdType: '',
    borrowerIdNumber: '',
    borrowerEmail: user?.email || '',
    borrowerAddress: '',
    borrowerReference: '',
    companyName: '',
    companyContact: '',
    companyAddress: '',
    loanAmount: '',
    loanDate: new Date().toISOString(),
    interestRate: '',
    loanTerm: '12',
    paymentFrequency: '' as any,
    installmentAmount: '',
    numberOfInstallments: '12',
    firstPaymentDate: new Date().toISOString(),
    loanPurpose: '',
    notes: '',
    currency: ''
  });

  // Calculate installment amount dynamically when loan amount or installments change
  const handleLoanFormChange = (field: string, value: string) => {
    setNewLoanForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'loanAmount' || field === 'numberOfInstallments') {
        const amt = parseFloat(updated.loanAmount);
        const num = parseInt(updated.numberOfInstallments, 10);
        if (!isNaN(amt) && !isNaN(num) && num > 0) {
          updated.installmentAmount = (amt / num).toFixed(2);
        }
      }
      return updated;
    });
  };

  // Submit New Loan
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!newLoanForm.companyName.trim()) {
      showFeedback?.('Please enter loan company name', 'error');
      return;
    }
    if (!newLoanForm.borrowerName.trim()) {
      showFeedback?.('Please enter borrower full name', 'error');
      return;
    }
    const amount = parseFloat(newLoanForm.loanAmount);
    if (isNaN(amount) || amount <= 0) {
      showFeedback?.('Please enter a valid loan amount', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // Allow visual feedback of processing state
      await new Promise(resolve => setTimeout(resolve, 600));

      const numInstallments = parseInt(newLoanForm.numberOfInstallments, 10) || 1;
      const instAmt = parseFloat(newLoanForm.installmentAmount) || (amount / numInstallments);
      const activeEditRecord = manualEditLoanRecord || selectedLoanRecord;
      const loanId = isEditLoanMode && activeEditRecord ? activeEditRecord.id : 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const newLoanObj: Loan = {
        id: loanId,
        userId: isEditLoanMode && activeEditRecord ? activeEditRecord.userId : (user?.id || 'guest'),
        borrowerName: newLoanForm.borrowerName.trim(),
        borrowerMobile: newLoanForm.borrowerMobile.trim(),
        borrowerCountryCode: newLoanForm.borrowerCountryCode,
        borrowerIdType: newLoanForm.borrowerIdType.trim() || undefined,
        borrowerIdNumber: newLoanForm.borrowerIdNumber.trim() || undefined,
        borrowerEmail: newLoanForm.borrowerEmail.trim() || undefined,
        borrowerAddress: newLoanForm.borrowerAddress.trim() || undefined,
        borrowerReference: newLoanForm.borrowerReference.trim() || undefined,
        companyName: newLoanForm.companyName.trim(),
        companyContact: newLoanForm.companyContact.trim() || undefined,
        companyAddress: newLoanForm.companyAddress.trim() || undefined,
        loanAmount: amount,
        loanDate: newLoanForm.loanDate,
        interestRate: parseFloat(newLoanForm.interestRate) || 0,
        interestAmount: (amount * (parseFloat(newLoanForm.interestRate) || 0)) / 100,
        loanTerm: parseInt(newLoanForm.loanTerm, 10) || 12,
        paymentFrequency: newLoanForm.paymentFrequency || 'MONTHLY',
        installmentAmount: instAmt,
        numberOfInstallments: numInstallments,
        firstPaymentDate: newLoanForm.firstPaymentDate,
        loanPurpose: newLoanForm.loanPurpose.trim() || undefined,
        notes: newLoanForm.notes.trim() || undefined,
        currency: newLoanForm.currency || (selectedCurrency || 'BDT'),
        totalPaid: isEditLoanMode && activeEditRecord ? activeEditRecord.totalPaid : 0,
        outstandingBalance: isEditLoanMode && activeEditRecord ? Math.max(0, amount - (activeEditRecord.totalPaid || 0)) : amount,
        paidInstallments: isEditLoanMode && activeEditRecord ? activeEditRecord.paidInstallments : 0,
        remainingInstallments: isEditLoanMode && activeEditRecord ? Math.max(0, numInstallments - (activeEditRecord.paidInstallments || 0)) : numInstallments,
        status: isEditLoanMode && activeEditRecord ? activeEditRecord.status : 'ACTIVE',
        createdAt: isEditLoanMode && activeEditRecord ? activeEditRecord.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isEditLoanMode) {
        updateLoan?.(newLoanObj);
        showFeedback?.(language === 'bn' ? 'লোন সফলভাবে আপডেট হয়েছে!' : 'Loan updated successfully!', 'success');
        setIsEditLoanMode(false);
        setManualEditLoanRecord(null);
      } else {
        addLoan?.(newLoanObj);
        showFeedback?.('Loan registered successfully!', 'success');
        
        // Prepare receipt for photo generation
        setReceiptData({
          historyType: 'LOAN_RECEIVE',
          id: newLoanObj.id,
          date: newLoanObj.loanDate,
          amount: newLoanObj.loanAmount,
          currency: newLoanObj.currency,
          borrowerName: newLoanObj.borrowerName,
          companyName: newLoanObj.companyName,
          details: [
            { label: language === 'bn' ? 'ঋণগ্রহীতা' : 'Borrower', value: newLoanObj.borrowerName },
            { label: language === 'bn' ? 'কোম্পানি' : 'Company', value: newLoanObj.companyName },
            { label: language === 'bn' ? 'পরিমাণ' : 'Amount', value: `${newLoanObj.loanAmount} ${newLoanObj.currency}` },
            { label: language === 'bn' ? 'তারিখ' : 'Date', value: new Date(newLoanObj.loanDate).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') },
          ]
        });
        
        // Show receipt after feedback (3 seconds delay to allow toast to finish)
        setTimeout(() => {
          setShowReceipt(true);
        }, 3000);
      }
      
      setIsNewLoanSubpageOpen(false);
      setSelectedCompany(newLoanObj.companyName);

      // Reset form
      setNewLoanForm({
        borrowerName: user?.name || '',
        borrowerMobile: user?.mobile || '',
        borrowerCountryCode: defaultCountryCode,
        borrowerIdType: '',
        borrowerIdNumber: '',
        borrowerEmail: user?.email || '',
        borrowerAddress: '',
        borrowerReference: '',
        companyName: '',
        companyContact: '',
        companyAddress: '',
        loanAmount: '',
        loanDate: new Date().toISOString(),
        interestRate: '',
        loanTerm: '12',
        paymentFrequency: '' as any,
        installmentAmount: '',
        numberOfInstallments: '12',
        firstPaymentDate: new Date().toISOString(),
        loanPurpose: '',
        notes: '',
        currency: ''
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Pay Loan Form State
  const [payLoanForm, setPayLoanForm] = useState({
    selectedCompanyName: '',
    paymentAmount: '',
    savingsAmount: '',
    paymentDate: new Date().toISOString(),
    paymentMethod: 'Cash',
    transactionDetails: '',
    paymentReference: '',
    senderBankName: '',
    senderBranchName: '',
    senderAccountHolder: '',
    senderAccountNumber: '',
    receiverBankName: '',
    receiverBranchName: '',
    receiverAccountHolder: '',
    receiverAccountNumber: ''
  });

  // Open Pay Loan Modal
  const handleOpenPayLoan = (companyName?: string) => {
    const targetComp = companyName || selectedCompany || (companySummaries[0]?.companyName || '');
    setPayLoanForm({
      selectedCompanyName: targetComp,
      paymentAmount: '',
      savingsAmount: '',
      paymentDate: new Date().toISOString(),
      paymentMethod: 'Cash',
      transactionDetails: '',
      paymentReference: '',
      senderBankName: '',
      senderBranchName: '',
      senderAccountHolder: '',
      senderAccountNumber: '',
      receiverBankName: '',
      receiverBranchName: '',
      receiverAccountHolder: '',
      receiverAccountNumber: ''
    });
    setIsPayLoanModalOpen(true);
    setIsFabOpen(false);
  };

  const handleViewLoanDetails = (item: any) => {
    if (item.historyType === 'LOAN_RECEIVE' && item.loanData) {
      setSelectedLoanDetail(item.loanData);
      setIsLoanDetailModalOpen(true);
    } else if (item.historyType === 'INSTALLMENT_PAID') {
      setSelectedInstallmentData(item);
      setIsInstallmentVoucherOpen(true);
    }
  };

  // Submit Pay Loan
  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payLoanForm.selectedCompanyName) {
      showFeedback?.('Please select a loan company', 'error');
      return;
    }

    const totalInputAmt = parseFloat(payLoanForm.paymentAmount);
    if (isNaN(totalInputAmt) || totalInputAmt <= 0) {
      showFeedback?.('Please enter a valid payment amount', 'error');
      return;
    }
    
    const savingsAmt = parseFloat(payLoanForm.savingsAmount) || 0;
    const payAmt = Math.max(0, totalInputAmt - savingsAmt);

    // Find summary and loan record for this company
    const targetSummary = companySummaries.find(c => c.companyName.toUpperCase() === payLoanForm.selectedCompanyName.toUpperCase());
    if (!targetSummary || targetSummary.loans.length === 0) {
      showFeedback?.('No active loan found for selected company', 'error');
      return;
    }

    // Select active loan (prefer loan with outstanding balance)
    let targetLoan = targetSummary.loans.find(l => {
      const pForL = userPayments.filter(p => p.loanId === l.id);
      const paid = pForL.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      return (l.loanAmount - paid) > 0;
    }) || targetSummary.loans[0];

    const paymentId = isEditingPayment && editingPaymentId ? editingPaymentId : ('pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

    const paymentObj: LoanPayment = {
      id: paymentId,
      loanId: targetLoan.id,
      userId: user?.id || 'guest',
      amount: payAmt,
      savingsAmount: savingsAmt,
      date: payLoanForm.paymentDate,
      method: payLoanForm.paymentMethod,
      transactionDetails: payLoanForm.transactionDetails.trim() || undefined,
      paymentReference: payLoanForm.paymentReference.trim() || undefined,
      senderBankName: payLoanForm.senderBankName || undefined,
      senderBranchName: payLoanForm.senderBranchName || undefined,
      senderAccountHolder: payLoanForm.senderAccountHolder || undefined,
      senderAccountNumber: payLoanForm.senderAccountNumber || undefined,
      receiverBankName: payLoanForm.receiverBankName || undefined,
      receiverBranchName: payLoanForm.receiverBranchName || undefined,
      receiverAccountHolder: payLoanForm.receiverAccountHolder || undefined,
      receiverAccountNumber: payLoanForm.receiverAccountNumber || undefined,
      createdAt: isEditingPayment ? (userPayments.find(p => p.id === editingPaymentId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };

    // Calculate updated loan numbers
    const currentPaidForLoan = userPayments
      .filter(p => p.loanId === targetLoan.id && (!isEditingPayment || p.id !== editingPaymentId))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0) + payAmt;
      
    const currentTotalSavings = userPayments
      .filter(p => p.loanId === targetLoan.id && (!isEditingPayment || p.id !== editingPaymentId))
      .reduce((sum, p) => sum + Number(p.savingsAmount || 0), 0) + savingsAmt;

    const newOutstanding = Math.max(0, targetLoan.loanAmount - currentPaidForLoan);
    const paidInst = targetLoan.installmentAmount > 0 
      ? Math.min(targetLoan.numberOfInstallments, Math.floor(currentPaidForLoan / targetLoan.installmentAmount))
      : 0;
    const remainingInst = Math.max(0, targetLoan.numberOfInstallments - paidInst);

    const updatedLoanObj: Loan = {
      ...targetLoan,
      totalPaid: currentPaidForLoan,
      totalSavings: currentTotalSavings,
      outstandingBalance: newOutstanding,
      paidInstallments: paidInst,
      remainingInstallments: remainingInst,
      status: newOutstanding <= 0 ? 'PAID' : 'ACTIVE',
      updatedAt: new Date().toISOString()
    };

    if (isEditingPayment) {
      updateLoanPayment?.(paymentObj);
    } else {
      addLoanPayment?.(paymentObj);
    }
    updateLoan?.(updatedLoanObj);

    showFeedback?.(isEditingPayment ? 'Payment updated successfully!' : 'Payment recorded successfully!', 'success');
    
    // Prepare receipt for photo generation
    setReceiptData({
      historyType: 'INSTALLMENT_PAID',
      id: paymentObj.id,
      date: paymentObj.date,
      amount: paymentObj.amount,
      currency: targetLoan.currency,
      borrowerName: targetLoan.borrowerName,
      companyName: targetLoan.companyName,
      details: [
        { label: language === 'bn' ? 'ঋণগ্রহীতা' : 'Borrower', value: targetLoan.borrowerName },
        { label: language === 'bn' ? 'কোম্পানি' : 'Company', value: targetLoan.companyName },
        { label: language === 'bn' ? 'পরিমাণ' : 'Amount', value: `${paymentObj.amount} ${targetLoan.currency}` },
        { label: language === 'bn' ? 'তারিখ' : 'Date', value: new Date(paymentObj.date).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') },
        { label: language === 'bn' ? 'পদ্ধতি' : 'Method', value: paymentObj.method },
        { label: language === 'bn' ? 'রেফারেন্স' : 'Reference', value: paymentObj.paymentReference || 'N/A' },
      ]
    });
    
    // Show receipt after feedback (3 seconds delay to allow toast to finish)
    setTimeout(() => {
      setShowReceipt(true);
    }, 3000);

    setIsPayLoanModalOpen(false);
    setIsEditingPayment(false);
    setEditingPaymentId(null);
    setSelectedCompany(targetSummary.companyName);
  };

  const handleEditInstallment = (installmentItem: any) => {
    setIsEditingPayment(true);
    setEditingPaymentId(installmentItem.id);
    
    setPayLoanForm({
      selectedCompanyName: installmentItem.loanData?.companyName || '',
      paymentAmount: String(installmentItem.amount || ''),
      savingsAmount: String(installmentItem.paymentData?.savingsAmount || ''),
      paymentDate: installmentItem.date || new Date().toISOString(),
      paymentMethod: installmentItem.paymentData?.method || 'Cash',
      transactionDetails: installmentItem.paymentData?.transactionDetails || '',
      paymentReference: installmentItem.paymentData?.paymentReference || '',
      senderBankName: installmentItem.paymentData?.senderBankName || '',
      senderBranchName: installmentItem.paymentData?.senderBranchName || '',
      senderAccountHolder: installmentItem.paymentData?.senderAccountHolder || '',
      senderAccountNumber: installmentItem.paymentData?.senderAccountNumber || '',
      receiverBankName: installmentItem.paymentData?.receiverBankName || '',
      receiverBranchName: installmentItem.paymentData?.receiverBranchName || '',
      receiverAccountHolder: installmentItem.paymentData?.receiverAccountHolder || '',
      receiverAccountNumber: installmentItem.paymentData?.receiverAccountNumber || ''
    });

    setIsInstallmentVoucherOpen(false);
    setIsPayLoanModalOpen(true);
  };

  // Delete payment handler
  const handleDeletePayment = (paymentId: string) => {
    confirmAction(
      language === 'bn' ? 'আপনি কি এই পেমেন্ট রেকর্ডটি ডিলিট করতে চান?' : 'Are you sure you want to delete this payment record?',
      () => {
        removeLoanPayment?.(paymentId);
        showFeedback?.(
          language === 'bn' ? 'পেমেন্ট রেকর্ড সফলভাবে ডিলিট করা হয়েছে!' : 'Payment record deleted',
          'success'
        );
      }
    );
  };

  const handleDownloadStatement = async () => {
    if (!selectedSummary) {
      showFeedback?.('No summary available for download', 'error');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const isBn = language === 'bn';
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(isBn ? 'Loan Statement' : 'Loan Statement', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth / 2, 26, { align: 'center' });

    // Company & Summary Info
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`Company: ${selectedSummary.companyName}`, 14, 40);
    if (selectedSummary.companyContact) doc.text(`Contact: ${selectedSummary.companyContact}`, 14, 46);
    
    // Draw a line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.line(14, 52, pageWidth - 14, 52);

    // Key Figures Table
    autoTable(doc, {
      startY: 58,
      head: [[
        'Total Loan Amount', 
        'Total Paid', 
        'Total Savings', 
        'Outstanding'
      ]],
      body: [[
        `${getLocalCurrencySymbol(selectedSummary.currency)} ${selectedSummary.totalLoanAmount.toLocaleString()}`,
        `${getLocalCurrencySymbol(selectedSummary.currency)} ${selectedSummary.totalPaidAmount.toLocaleString()}`,
        `${getLocalCurrencySymbol(selectedSummary.currency)} ${(selectedSummary.totalSavingsAmount || 0).toLocaleString()}`,
        `${getLocalCurrencySymbol(selectedSummary.currency)} ${selectedSummary.outstandingBalance.toLocaleString()}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 10, halign: 'center' }
    });

    // Recent Payments Table
    const tableStartY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text('Payment History', 14, tableStartY - 5);

    const paymentRows = selectedLoanPayments.map(p => [
      new Date(p.date).toLocaleDateString(),
      p.method || 'N/A',
      p.transactionDetails || '-',
      `${getLocalCurrencySymbol(selectedSummary.currency)} ${(p.savingsAmount || 0).toLocaleString()}`,
      `${getLocalCurrencySymbol(selectedSummary.currency)} ${p.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['Date', 'Method', 'Details', 'Savings', 'Loan Paid']],
      body: paymentRows,
      theme: 'striped',
      headStyles: { fillColor: [51, 65, 85] },
      styles: { fontSize: 9 }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('This is a computer generated document. No signature is required.', pageWidth / 2, finalY, { align: 'center' });

    // Save
    await exportAndPromptPDF(doc, `Loan_Statement_${selectedSummary.companyName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
  };

  const ReceiptOverlay = () => {
    if (!showReceipt || !receiptData) return null;

    return createPortal(
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-hidden">
        <motion.div 
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-[24px] overflow-hidden shadow-[var(--dynamic-card-shadow)] border-[var(--dynamic-card-border)] max-w-sm w-full flex flex-col max-h-[90vh]"
        >
          {/* Scrollable Receipt Content for Capture */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div ref={receiptRef} className="p-8 space-y-8 bg-white text-slate-900">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 transform rotate-3">
                  <CheckCircle2 size={40} />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Receipt</h2>
                  <p className="text-[11px] font-black text-emerald-500 tracking-[0.3em] uppercase">Transaction Verified</p>
                </div>
              </div>

              {/* Content Table */}
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b-2 border-slate-900 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Information</span>
                </div>
                
                <div className="space-y-4">
                  {receiptData.details.map((detail: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <span className="text-xs font-bold text-slate-500 shrink-0">{detail.label}</span>
                      <span className="text-xs font-black text-slate-900 text-right">{detail.value}</span>
                    </div>
                  ))}
                </div>

                {/* Amount Highlight */}
                <div className="pt-4 border-t border-dashed border-slate-200">
                  <div className="bg-slate-50 rounded-2xl p-5 flex flex-col items-center gap-1">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Transaction Value</span>
                     <div className="text-3xl font-black text-slate-900 tracking-tighter">
                        {receiptData.currency} {Number(receiptData.amount).toLocaleString()}
                     </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 pb-4">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Receipt ID</div>
                <div className="text-[9px] font-bold text-slate-400 font-mono bg-slate-50 py-1 px-3 rounded-full inline-block">
                  {receiptData.id}
                </div>
                <p className="mt-6 text-[10px] font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Thank you for using FleetPro Management System. This is a computer generated receipt.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons (Not Captured) */}
          <div className="p-6 grid grid-cols-2 gap-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <button 
              onClick={() => setShowReceipt(false)}
              className="h-14 rounded-[16px] bg-slate-200 text-slate-700 border-none font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
            <button 
              onClick={() => {
                generateReceiptPhoto();
                setShowReceipt(false);
              }}
              className="h-14 rounded-[16px] text-white font-black text-xs uppercase tracking-widest shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-none bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5"
            >
              <Download size={16} />
              {language === 'bn' ? 'ভাউচার' : 'Voucher'}
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };

  const LoanDetailModal = () => {
    if (!isLoanDetailModalOpen || !selectedLoanDetail) return null;

    const details = [
      { label: language === 'bn' ? 'ঋণগ্রহীতা' : 'Borrower', value: selectedLoanDetail.borrowerName },
      { label: language === 'bn' ? 'কোম্পানি' : 'Company', value: selectedLoanDetail.companyName },
      { label: language === 'bn' ? 'যোগাযোগ নম্বর' : 'Contact', value: selectedLoanDetail.companyContact },
      { label: language === 'bn' ? 'ঠিকানা' : 'Address', value: selectedLoanDetail.companyAddress },
      { label: language === 'bn' ? 'লোনের তারিখ' : 'Loan Date', value: new Date(selectedLoanDetail.loanDate).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') },
      { label: language === 'bn' ? 'সুদের হার' : 'Interest', value: `${selectedLoanDetail.interestRate}%` },
      { label: language === 'bn' ? 'লোনের মেয়াদ' : 'Term', value: `${selectedLoanDetail.loanTerm} ${language === 'bn' ? 'মাস' : 'Months'}` },
      { label: language === 'bn' ? 'ফ্রিকোয়েন্সি' : 'Frequency', value: selectedLoanDetail.paymentFrequency },
      { label: language === 'bn' ? 'কিস্তি' : 'Installments', value: selectedLoanDetail.numberOfInstallments },
      { label: language === 'bn' ? 'প্রথম পেমেন্ট' : 'First Payment', value: new Date(selectedLoanDetail.firstPaymentDate).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US') },
      { label: language === 'bn' ? 'উদ্দেশ্য' : 'Purpose', value: selectedLoanDetail.loanPurpose },
      { label: language === 'bn' ? 'নোট' : 'Notes', value: selectedLoanDetail.notes || '—' },
    ];

    const detailReceiptRef = React.useRef<HTMLDivElement>(null);

    const downloadVoucher = async () => {
      const node = detailReceiptRef.current;
      if (!node) return;
      
      const clone = node.cloneNode(true) as HTMLElement;
      const rect = node.getBoundingClientRect();
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.zIndex = '-9999';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);

      try {
        const canvas = await html2canvas(clone, {
          scale: 3,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `Loan_Receive_${selectedLoanDetail.id}.png`;
        link.click();
        showFeedback?.(language === 'bn' ? 'ভাউচার সফলভাবে ডাউনলোড হয়েছে' : 'Voucher downloaded successfully', 'success');
      } catch (error) {
        console.error('Error generating voucher:', error);
        showFeedback?.('Failed to download voucher', 'error');
      } finally {
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
      }
    };

    const downloadLoanPDF = async () => {
      const doc = new jsPDF({ format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Page Background - Light Gray Tint (as in the screenshot outer space)
      doc.setFillColor(244, 244, 249);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Main Card Container
      const margin = 12;
      const cardW = pageWidth - margin * 2;
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(margin, margin, cardW, 235, 4, 4, 'F');
      
      // Top Header (Dark Navy)
      doc.setFillColor(26, 26, 46); // Very Dark Blue
      doc.roundedRect(margin, margin, cardW, 35, 4, 4, 'F');
      doc.rect(margin, margin + 20, cardW, 15, 'F'); // Square off bottom
      doc.setFillColor(6, 182, 212); // Cyan line
      doc.rect(margin, margin + 35 - 1, cardW, 1, 'F');
      
      // Header Texts
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text((selectedLoanDetail.companyName || 'COMPANY').toUpperCase(), margin + 10, margin + 15);
      
      doc.setTextColor(56, 189, 248); // Light Blue Text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL LOAN DISBURSEMENT & TRANSACTION ADVICE', margin + 10, margin + 25);
      
      // Reset line width
      doc.setLineWidth(0.1);
      
      let yPos = margin + 38;
      
      // Loan Amount Hero Card
      doc.setFillColor(224, 242, 254); // Light Sky Blue
      doc.roundedRect(margin + 10, yPos, cardW - 20, 24, 3, 3, 'F');
      doc.setTextColor(2, 132, 199);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('LOAN RECEIVED AMOUNT (PRINCIPAL)', pageWidth / 2, yPos + 8, { align: 'center' });
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedLoanDetail.currency || 'BDT'} ${Number(selectedLoanDetail.loanAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth / 2, yPos + 18, { align: 'center' });
      
      yPos += 32;
      
      // Two Columns: Org Details & Borrower Details
      const colW = (cardW - 30) / 2;
      const leftX = margin + 10;
      const rightX = margin + 20 + colW;
      
      // Organization Details Card
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(leftX, yPos, colW, 42, 2, 2, 'D');
      doc.setFillColor(56, 189, 248);
      doc.rect(leftX + 4, yPos + 4, 4, 4, 'F'); // Small icon replacement
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('ORGANIZATION DETAILS', leftX + 10, yPos + 7);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('COMPANY NAME', leftX + 4, yPos + 15);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedLoanDetail.companyName || 'N/A'}`, leftX + 4, yPos + 19);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('HELPLINE / CONTACT', leftX + 4, yPos + 25);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedLoanDetail.companyContact || 'N/A'}`, leftX + 4, yPos + 29);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('BRANCH / ADDRESS', leftX + 4, yPos + 35);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      const addressLines = doc.splitTextToSize(`${selectedLoanDetail.companyAddress || 'N/A'}`, colW - 8);
      doc.text(addressLines.slice(0, 1), leftX + 4, yPos + 39); // ensure single line
      
      // Borrower Details Card
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(rightX, yPos, colW, 42, 2, 2, 'D');
      doc.setFillColor(37, 99, 235);
      doc.rect(rightX + 4, yPos + 4, 4, 4, 'F'); // Small icon replacement
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('BORROWER DETAILS', rightX + 10, yPos + 7);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('BORROWER NAME', rightX + 4, yPos + 15);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedLoanDetail.borrowerName || 'N/A'}`, rightX + 4, yPos + 19);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('MOBILE NUMBER', rightX + 4, yPos + 25);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedLoanDetail.borrowerMobile ? `${selectedLoanDetail.borrowerCountryCode || ''}${selectedLoanDetail.borrowerMobile}` : 'N/A'}`, rightX + 4, yPos + 29);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`NATIONAL ID (${selectedLoanDetail.borrowerIdType || 'NID'})`, rightX + 4, yPos + 35);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedLoanDetail.borrowerIdNumber || 'N/A'}`, rightX + 4, yPos + 39);
      
      yPos += 50;
      
      // LOAN TERMS & SCHEDULE SUMMARY
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('LOAN TERMS & SCHEDULE SUMMARY', margin + 10, yPos);
      
      yPos += 5;
      
      const bodyData = [
        ['Loan Disbursed Date', new Date(selectedLoanDetail.loanDate).toLocaleString()],
        ['Purpose of Loan', selectedLoanDetail.loanPurpose || 'Personal Loan'],
        ['Interest Rate', `${selectedLoanDetail.interestRate}% (Interest)`],
        ['Loan Term / Duration', `${selectedLoanDetail.loanTerm} ${selectedLoanDetail.termType || 'Months'}`],
        ['Payment Frequency', selectedLoanDetail.paymentFrequency || 'MONTHLY'],
        ['Total Installments', `${selectedLoanDetail.numberOfInstallments} Installments`],
        ['First Payment Date', selectedLoanDetail.firstPaymentDate ? new Date(selectedLoanDetail.firstPaymentDate).toLocaleDateString() : 'N/A']
      ];
      
      autoTable(doc, {
        startY: yPos,
        margin: { left: margin + 10, right: margin + 10 },
        head: [['DESCRIPTION', 'PARTICULARS']],
        body: bodyData,
        theme: 'grid', 
        styles: { 
          fontSize: 8.5, 
          cellPadding: 3.5,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240], // Light elegant border
          lineWidth: 0.5,
        },
        headStyles: { 
          fillColor: [30, 41, 59], // Slate 800
          textColor: [255, 255, 255], 
          fontStyle: 'bold' as any,
          lineColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold' as any },
          1: { textColor: [71, 85, 105] }
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      
      // Footer Alert (Green)
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin + 10, finalY + 10, cardW - 20, 16, 2, 2, 'FD');
      
      // Padlock simulation
      doc.setFillColor(250, 204, 21); // Yellow
      doc.rect(margin + 15, finalY + 16, 4, 4, 'F');
      
      doc.setTextColor(22, 163, 74);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('SECURED & ENCRYPTED DIGITAL BANKING PROTOCOL', margin + 22, finalY + 16);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This is an official computer-generated loan receipt and transaction advice. No physical signature is required.', margin + 22, finalY + 22);
      
      // Meta Text
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(7.5);
      doc.text(`Transaction Advice Ref: BRAC-LN-${new Date().getFullYear()}-${selectedLoanDetail.id?.substring(0,6).toUpperCase() || 'XXX'} • System Generated on ${new Date().toLocaleString()}`, pageWidth / 2, finalY + 40, { align: 'center' });
      
      await exportAndPromptPDF(doc, `Loan_Receive_${selectedLoanDetail.id}.pdf`);
    };

    const handleTriggerEditFromVoucher = () => {
      setNewLoanForm({
        borrowerName: selectedLoanDetail.borrowerName || '',
        borrowerMobile: selectedLoanDetail.borrowerMobile || '',
        borrowerCountryCode: selectedLoanDetail.borrowerCountryCode || defaultCountryCode,
        borrowerIdType: selectedLoanDetail.borrowerIdType || '',
        borrowerIdNumber: selectedLoanDetail.borrowerIdNumber || '',
        borrowerEmail: selectedLoanDetail.borrowerEmail || '',
        borrowerAddress: selectedLoanDetail.borrowerAddress || '',
        borrowerReference: selectedLoanDetail.borrowerReference || '',
        companyName: selectedLoanDetail.companyName || '',
        companyContact: selectedLoanDetail.companyContact || '',
        companyAddress: selectedLoanDetail.companyAddress || '',
        loanAmount: String(selectedLoanDetail.loanAmount || ''),
        loanDate: selectedLoanDetail.loanDate || new Date().toISOString(),
        interestRate: String(selectedLoanDetail.interestRate || ''),
        loanTerm: String(selectedLoanDetail.loanTerm || '12'),
        paymentFrequency: selectedLoanDetail.paymentFrequency || 'MONTHLY',
        installmentAmount: String(selectedLoanDetail.installmentAmount || ''),
        numberOfInstallments: String(selectedLoanDetail.numberOfInstallments || '12'),
        firstPaymentDate: selectedLoanDetail.firstPaymentDate || new Date().toISOString(),
        loanPurpose: selectedLoanDetail.loanPurpose || '',
        notes: selectedLoanDetail.notes || '',
        currency: selectedLoanDetail.currency || 'BDT'
      });
      setManualEditLoanRecord(selectedLoanDetail);
      setIsEditLoanMode(true);
      setIsNewLoanSubpageOpen(true);
      setIsLoanDetailModalOpen(false);
    };

    const handleDeleteLoanRecord = () => {
      confirmAction(
        language === 'bn' 
          ? 'আপনি কি এই লোন রেকর্ডটি ডিলিট করতে চান? এই লোন সংক্রান্ত সকল তথ্য মুছে যাবে।' 
          : 'Are you sure you want to delete this loan record? All associated loan data will be removed.',
        () => {
          if (removeLoan && selectedLoanDetail.id) {
            removeLoan(selectedLoanDetail.id);
            setIsLoanDetailModalOpen(false);
            showFeedback?.(
              language === 'bn' ? 'লোন রেকর্ড সফলভাবে ডিলিট করা হয়েছে!' : 'Loan record deleted successfully!',
              'success'
            );
          }
        }
      );
    };

    return createPortal(
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-hidden">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] overflow-hidden shadow-2xl max-w-[420px] w-full flex flex-col max-h-[90vh]"
        >
          {/* Scrollable Receipt Content for Capture */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div ref={detailReceiptRef} className="px-5 py-5 space-y-4 bg-white text-slate-900 w-full mx-auto" style={{ maxWidth: '420px' }}>
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-amber-500/20 transform -rotate-3">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Loan Voucher</h2>
                  <p className="text-[10px] font-black text-amber-500 tracking-[0.3em] uppercase">Official Loan Record</p>
                </div>
              </div>

              {/* Content Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b-2 border-slate-900 pb-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                </div>
                
                <div className="space-y-1.5">
                  {details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-3">
                      <span className="text-[11px] font-bold text-slate-500 shrink-0">{detail.label}</span>
                      <span className="text-[11px] font-black text-slate-900 text-right">{detail.value}</span>
                    </div>
                  ))}
                </div>

                {/* Amount Highlight */}
                <div className="pt-3 border-t border-dashed border-slate-200">
                  <div className="bg-slate-50 rounded-[16px] p-3.5 flex flex-col items-center gap-0.5">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principal Amount</span>
                     <div className="text-2xl font-black text-slate-900 tracking-tighter">
                        {selectedLoanDetail.currency} {Number(selectedLoanDetail.loanAmount || 0).toLocaleString()}
                     </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-1 pb-1">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Loan ID</div>
                <div className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 py-1 px-3 rounded-full inline-block">
                  {selectedLoanDetail.id}
                </div>
                <p className="mt-2 text-[9px] font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Computer generated loan record. Verified by FleetPro Management System.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-5 flex flex-col gap-3 bg-slate-50 border-t border-slate-100 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  handleTriggerEditFromVoucher();
                }}
                className="h-12 rounded-xl border-none font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-white bg-sky-500 hover:bg-sky-600 hover:-translate-y-0.5"
              >
                <Edit2 size={16} />
                {language === 'bn' ? 'এডিট' : 'Edit'}
              </button>
              
              <button 
                onClick={() => {
                  setIsLoanDetailModalOpen(false);
                  handleDeleteLoanRecord();
                }}
                className="h-12 rounded-xl border-none font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-white bg-rose-500 hover:bg-rose-600 hover:-translate-y-0.5"
              >
                <Trash2 size={16} />
                {language === 'bn' ? 'ডিলিট' : 'Delete'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  downloadVoucher();
                  setIsLoanDetailModalOpen(false);
                }}
                className="h-12 rounded-xl border-none font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-white bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5"
              >
                <ImageIcon size={16} />
                {language === 'bn' ? 'সেভ ইমেজ' : 'Save Image'}
              </button>
              
              <button 
                onClick={() => {
                  downloadLoanPDF();
                  setIsLoanDetailModalOpen(false);
                }}
                className="h-12 rounded-xl border-none font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-white bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5"
              >
                <FileText size={16} />
                {language === 'bn' ? 'ডাউনলোড পিডিএফ' : 'Download PDF'}
              </button>
            </div>
            <button 
              onClick={() => setIsLoanDetailModalOpen(false)}
              className="mt-1 w-full h-14 rounded-[16px] bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };

  const InstallmentVoucherModal = () => {
    if (!isInstallmentVoucherOpen || !selectedInstallmentData) return null;

    const installmentReceiptRef = React.useRef<HTMLDivElement>(null);

    const details = [
      { label: language === 'bn' ? 'ঋণগ্রহীতা' : 'Borrower', value: selectedInstallmentData.loanData?.borrowerName || 'N/A' },
      { label: language === 'bn' ? 'কোম্পানি' : 'Company', value: selectedInstallmentData.loanData?.companyName || 'N/A' },
      { 
        label: language === 'bn' ? 'কিস্তি মাস' : 'Installment For', 
        value: new Date(selectedInstallmentData.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' }) 
      },
      { label: language === 'bn' ? 'পেমেন্টের তারিখ' : 'Payment Date', value: new Date(selectedInstallmentData.date).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US') },
      { label: language === 'bn' ? 'পদ্ধতি' : 'Method', value: selectedInstallmentData.paymentData?.method || 'N/A' },
      { label: language === 'bn' ? 'রেফারেন্স' : 'Reference', value: selectedInstallmentData.paymentData?.paymentReference || 'N/A' },
      
      { label: language === 'bn' ? 'প্রেরক ব্যাংক ডিটেইলস' : 'Sender Bank Details', value: '', isHeader: true },
      { label: language === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name', value: selectedInstallmentData.paymentData?.senderBankName || 'N/A' },
      { label: language === 'bn' ? 'একাউন্ট হোল্ডার' : 'A/C Holder Name', value: selectedInstallmentData.paymentData?.senderAccountHolder || 'N/A' },
      { label: language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number', value: selectedInstallmentData.paymentData?.senderAccountNumber || 'N/A' },

      { label: language === 'bn' ? 'প্রাপক ব্যাংক ডিটেইলস' : 'Receiver Bank Details', value: '', isHeader: true },
      { label: language === 'bn' ? 'ব্যাংকের নাম' : 'Bank Name', value: selectedInstallmentData.paymentData?.receiverBankName || 'N/A' },
      { label: language === 'bn' ? 'একাউন্ট হোল্ডার' : 'A/C Holder Name', value: selectedInstallmentData.paymentData?.receiverAccountHolder || 'N/A' },
      { label: language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number', value: selectedInstallmentData.paymentData?.receiverAccountNumber || 'N/A' },

      { label: language === 'bn' ? 'ট্রানজেকশন ডিটেইলস' : 'Details', value: selectedInstallmentData.paymentData?.transactionDetails || '—' },
      { label: language === 'bn' ? 'সঞ্চয়' : 'Savings', value: `${selectedInstallmentData.currency} ${Number(selectedInstallmentData.paymentData?.savingsAmount || 0).toLocaleString()}` },
    ];

    const downloadInstallmentVoucher = async () => {
      const node = installmentReceiptRef.current;
      if (!node) return;
      
      const clone = node.cloneNode(true) as HTMLElement;
      const rect = node.getBoundingClientRect();
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      clone.style.position = 'fixed';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.zIndex = '-9999';
      clone.style.pointerEvents = 'none';
      document.body.appendChild(clone);

      try {
        const canvas = await html2canvas(clone, {
          scale: 3,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true
        });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `Installment_Voucher_${selectedInstallmentData.id}.png`;
        link.click();
        showFeedback?.(language === 'bn' ? 'ভাউচার সফলভাবে ডাউনলোড হয়েছে' : 'Voucher downloaded successfully', 'success');
      } catch (error) {
        console.error('Error generating voucher:', error);
        showFeedback?.('Failed to download voucher', 'error');
      } finally {
        if (document.body.contains(clone)) {
          document.body.removeChild(clone);
        }
      }
    };

    
    
    const downloadInstallmentPDF = async () => {
      const doc = new jsPDF({ format: 'a4' });
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Page Background - Clean Slate Tint
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Top Thin Accent Bar
      doc.setFillColor(30, 27, 75); // Deep Indigo
      doc.rect(0, 0, pageWidth, 4, 'F');
      
      // Main Header Block
      doc.setFillColor(30, 27, 75);
      doc.rect(0, 4, pageWidth, 36, 'F');
      
      // Company Name & Subtitle
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text((selectedInstallmentData.loanData?.companyName || 'COMPANY').toUpperCase(), 14, 23);
      
      doc.setTextColor(199, 210, 254);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL INSTALLMENT PAYMENT RECEIPT', 14, 30);
      
      
      // Right Header - Document Title & Status Pill
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT VOUCHER', pageWidth - 14, 21, { align: 'right' });
      
      // Verified Status Pill
      const pillW = 48;
      const pillX = pageWidth - 14 - pillW;
      doc.setFillColor(16, 185, 129); // Emerald
      doc.roundedRect(pillX, 26, pillW, 7, 3.5, 3.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT SUCCESSFUL', pillX + (pillW / 2), 30.8, { align: 'center' });
      
      // Reference & Date Meta Bar
      let yPos = 46;
      doc.setFillColor(241, 245, 249);
      doc.rect(0, yPos - 6, pageWidth, 12, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.line(0, yPos - 6, pageWidth, yPos - 6);
      doc.line(0, yPos + 6, pageWidth, yPos + 6);
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Txn ID:`, 14, yPos + 1.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedInstallmentData.id}`, 28, yPos + 1.5);
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text(`Payment Date:`, pageWidth - 80, yPos + 1.5);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${new Date(selectedInstallmentData.date).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US')}`, pageWidth - 55, yPos + 1.5);
      
      yPos += 14;
      
      // Party & Overview Cards
      const cardWidth = 88;
      const cardHeight = 32;
      
      // BORROWER CARD
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, yPos, cardWidth, cardHeight, 3, 3, 'FD');
      
      doc.setFillColor(14, 165, 233); // Sky Blue Accent
      doc.rect(14, yPos, 2, cardHeight, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 165, 233);
      doc.text('BORROWER DETAILS', 20, yPos + 8);
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Name:', 20, yPos + 16);
      doc.text('Mobile:', 20, yPos + 22);
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${selectedInstallmentData.loanData?.borrowerName || 'N/A'}`, 38, yPos + 16);
      doc.text(`${selectedInstallmentData.loanData?.borrowerMobile ? `${selectedInstallmentData.loanData?.borrowerCountryCode || ''}${selectedInstallmentData.loanData?.borrowerMobile}` : 'N/A'}`, 38, yPos + 22);
      
      // PAYMENT OVERVIEW CARD
      const rightCardX = 108;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(rightCardX, yPos, cardWidth, cardHeight, 3, 3, 'FD');
      
      doc.setFillColor(245, 158, 11); // Amber Accent
      doc.rect(rightCardX, yPos, 2, cardHeight, 'F');
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 158, 11);
      doc.text('PAYMENT SUMMARY', rightCardX + 6, yPos + 8);
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('For Month:', rightCardX + 6, yPos + 16);
      doc.text('Method:', rightCardX + 6, yPos + 22);
      
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text(`${new Date(selectedInstallmentData.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' })}`, rightCardX + 30, yPos + 16);
      doc.text(`${selectedInstallmentData.paymentData?.method || 'N/A'}`, rightCardX + 30, yPos + 22);
      
      yPos += 40;

      if (selectedInstallmentData.paymentData?.method === 'Bank Transfer') {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('INTERBANK TRANSFER ROUTE', 14, yPos);
        yPos += 6;
        
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(14, yPos, cardWidth, cardHeight, 3, 3, 'FD');
        doc.setFillColor(16, 185, 129);
        doc.rect(14, yPos, 2, cardHeight, 'F');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('SENDER BANK ACCOUNT', 20, yPos + 8);
        
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Bank Name:', 20, yPos + 16);
        doc.text('Account Holder:', 20, yPos + 22);
        doc.text('Account Number:', 20, yPos + 28);
        
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`${selectedInstallmentData.paymentData?.senderBankName || 'N/A'}`, 48, yPos + 16);
        doc.text(`${selectedInstallmentData.paymentData?.senderAccountHolder || 'N/A'}`, 48, yPos + 22);
        doc.text(`${selectedInstallmentData.paymentData?.senderAccountNumber || 'N/A'}`, 48, yPos + 28);

        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(rightCardX, yPos, cardWidth, cardHeight, 3, 3, 'FD');
        doc.setFillColor(79, 70, 229);
        doc.rect(rightCardX, yPos, 2, cardHeight, 'F');
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text('RECEIVER BANK ACCOUNT', rightCardX + 6, yPos + 8);
        
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Bank Name:', rightCardX + 6, yPos + 16);
        doc.text('Account Holder:', rightCardX + 6, yPos + 22);
        doc.text('Account Number:', rightCardX + 6, yPos + 28);
        
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`${selectedInstallmentData.paymentData?.receiverBankName || 'N/A'}`, rightCardX + 34, yPos + 16);
        doc.text(`${selectedInstallmentData.paymentData?.receiverAccountHolder || 'N/A'}`, rightCardX + 34, yPos + 22);
        doc.text(`${selectedInstallmentData.paymentData?.receiverAccountNumber || 'N/A'}`, rightCardX + 34, yPos + 28);

        yPos += 40;
      }
      
      // Payment Breakdown Table
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('PAYMENT BREAKDOWN', 14, yPos);
      
      yPos += 4;
      
      const currency = selectedInstallmentData.currency || 'BDT';
      const totalAmount = Number(selectedInstallmentData.amount || 0);
      const savingsAmount = Number(selectedInstallmentData.paymentData?.savingsAmount || 0);
      const mainAmount = totalAmount - savingsAmount;
      
      const breakdownData = [
        ['Main Installment Amount', `${currency} ${mainAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Savings / Deposit Amount', `${currency} ${savingsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [['DESCRIPTION', 'AMOUNT']],
        body: breakdownData as any,
        theme: 'grid',
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240]
        },
        headStyles: { 
          fillColor: [30, 41, 59], // Slate 800
          textColor: [255, 255, 255], 
          fontStyle: 'bold' as any,
          lineColor: [30, 41, 59]
        },
        columnStyles: {
          0: { cellWidth: 100, fontStyle: 'bold' as any, textColor: [71, 85, 105] },
          1: { halign: 'right' as any, fontStyle: 'bold' as any, textColor: [15, 23, 42] }
        },
        alternateRowStyles: {
          fillColor: [255, 255, 255]
        }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY || 160;
      
      // Highlight Total Paid Banner
      doc.setFillColor(240, 253, 244); // Green 50
      doc.setDrawColor(34, 197, 94); // Green 500
      doc.setLineWidth(0.6);
      doc.roundedRect(14, finalY + 8, pageWidth - 28, 22, 3, 3, 'FD');
      doc.setLineWidth(0.1);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 128, 61);
      doc.text('TOTAL PAID AMOUNT', 22, finalY + 21);
      
      doc.setFontSize(16);
      doc.text(`${currency} ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 22, finalY + 22, { align: 'right' });
      
      // Footer & Verification Block
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text('This is an official computer-generated installment receipt. Verified by FleetPro System.', pageWidth / 2, pageHeight - 14, { align: 'center' });
      
      doc.setTextColor(16, 185, 129);
      doc.setFont('helvetica', 'bold');
      doc.text('Secured & Verified via Digital Financial Protocol', pageWidth / 2, pageHeight - 9, { align: 'center' });
      
      await exportAndPromptPDF(doc, `Installment_Payment_${selectedInstallmentData.id}.pdf`);
    };

    return createPortal(
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-hidden">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] overflow-hidden shadow-2xl max-w-[420px] w-full flex flex-col max-h-[90vh]"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
            <div ref={installmentReceiptRef} className="px-5 py-5 space-y-4 bg-white text-slate-900 w-full mx-auto" style={{ maxWidth: '420px' }}>
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 transform rotate-6">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900">Installment Payment</h2>
                  <p className="text-[10px] font-black text-emerald-500 tracking-[0.3em] uppercase">Transaction Verified</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end border-b-2 border-slate-900 pb-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</span>
                </div>
                
                <div className="space-y-1.5">
                  {details.map((detail, idx) => (
                    <div key={idx} className={`flex justify-between items-start gap-3 ${detail.isHeader ? 'pt-2 pb-0.5 border-b border-slate-100' : ''}`}>
                      <span className={`text-[11px] ${detail.isHeader ? 'font-black text-slate-900 uppercase tracking-widest underline' : 'font-bold text-slate-500'} shrink-0`}>
                        {detail.label}
                      </span>
                      {detail.value && (
                        <span className="text-[11px] font-black text-slate-900 text-right">{detail.value}</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Interbank Transfer Route Cards */}
                <div className="pt-3 border-t border-dashed border-slate-200">
                  <div className="bg-slate-50 rounded-[16px] p-3.5 flex flex-col items-center gap-0.5">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Amount</span>
                     <div className="text-2xl font-black text-slate-900 tracking-tighter">
                        {selectedInstallmentData.currency} {Number(selectedInstallmentData.amount || 0).toLocaleString()}
                     </div>
                  </div>
                </div>
              </div>

              <div className="text-center pt-1 pb-1">
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Transaction ID</div>
                <div className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 py-1 px-3 rounded-full inline-block">
                  {selectedInstallmentData.id}
                </div>
                <p className="mt-2 text-[9px] font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed">
                  Computer generated payment voucher. Verified by FleetPro Management System.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-3 bg-slate-50 border-t border-slate-100 shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  handleEditInstallment(selectedInstallmentData);
                }}
                className="h-12 rounded-xl border-none font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-white bg-sky-500 hover:bg-sky-600 hover:-translate-y-0.5"
              >
                <Edit2 size={16} />
                {language === 'bn' ? 'এডিট' : 'Edit'}
              </button>
              
              <button 
                onClick={() => {
                  setIsInstallmentVoucherOpen(false);
                  handleDeletePayment(selectedInstallmentData.id);
                }}
                className="h-12 rounded-xl border-none font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-white bg-rose-500 hover:bg-rose-600 hover:-translate-y-0.5"
              >
                <Trash2 size={16} />
                {language === 'bn' ? 'ডিলিট' : 'Delete'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => {
                  downloadInstallmentVoucher();
                  setIsInstallmentVoucherOpen(false);
                }}
                className="h-12 rounded-xl border-none font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-white bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5"
              >
                <ImageIcon size={16} />
                {language === 'bn' ? 'সেভ ইমেজ' : 'Save Image'}
              </button>
              
              <button 
                onClick={() => {
                  downloadInstallmentPDF();
                  setIsInstallmentVoucherOpen(false);
                }}
                className="h-12 rounded-xl border-none font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] text-white bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5"
              >
                <FileText size={16} />
                {language === 'bn' ? 'ডাউনলোড পিডিএফ' : 'Download PDF'}
              </button>
            </div>
            <button 
              onClick={() => setIsInstallmentVoucherOpen(false)}
              className="mt-1 w-full h-14 rounded-[16px] bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative min-h-screen pb-[calc(110px+env(safe-area-inset-bottom,24px))] text-foreground selection:bg-primary selection:text-primary-foreground loan-management-scope">
      <style>{`
        .loan-management-scope .text-foreground {
          color: #0f172a !important; /* Slate 900 for absolute legibility in light mode */
        }
        .loan-management-scope .text-muted-foreground {
          color: #475569 !important; /* Slate 600 for clean sub-elements */
        }
        
        /* Dark theme overrides strictly when active */
        .dark .loan-management-scope .text-foreground,
        .dark-theme .loan-management-scope .text-foreground,
        .dark-mode .loan-management-scope .text-foreground {
          color: #f8fafc !important; /* Slate 50 */
        }
        .dark .loan-management-scope .text-muted-foreground,
        .dark-theme .loan-management-scope .text-muted-foreground,
        .dark-mode .loan-management-scope .text-muted-foreground {
          color: #cbd5e1 !important; /* Slate 300 */
        }
      `}</style>
      <ReceiptOverlay />
      <LoanDetailModal />
      <InstallmentVoucherModal />
      {/* MAIN CONTENT AREA */}
      <div className="max-w-5xl mx-auto space-y-6">

        {/* 1. LOAN REGISTRATION VIEW (COMPANY LIST) */}
        {!selectedCompany && !isNewLoanSubpageOpen && !isPayLoanModalOpen && (
          <div className="space-y-5">
            {/* SEARCH BAR */}
            <div className="mb-2">
              <InputField
                label={language === 'bn' ? 'রেজিস্টার্ড লোন কোম্পানি খুঁজুন...' : 'Search registered Loan Company...'}
                name="search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                icon={<Search size={20} />}
                className="h-14"
                style={{
                  borderColor: isSearchFocused 
                    ? activePrimaryColor 
                    : (isNightMode ? 'rgba(255, 255, 255, 0.25)' : `${activePrimaryColor}60`),
                  '--search-border-color': activePrimaryColor,
                  '--input-label-active-color': activePrimaryColor,
                } as React.CSSProperties}
              />
            </div>

            {/* COMPANY CARDS LIST */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Registered Loan Companies ({filteredCompanies.length})
              </h2>

              {filteredCompanies.length === 0 ? (
                <div className="p-10 text-center rounded-[24px] bg-theme-card border border-dashed border-black/10 dark:border-white/10 space-y-3">
                  <Building size={40} className="mx-auto text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery ? 'No Loan Company matching search query.' : 'No registered Loan Companies found.'}
                  </p>
                  <button
                    onClick={() => { setIsNewLoanSubpageOpen(true); setIsFabOpen(false); }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 text-white font-medium text-xs shadow-md shadow-sky-600/20 hover:bg-sky-500 transition-all"
                  >
                    <Plus size={16} /> Register New Loan
                  </button>
                </div>
              ) : (
                filteredCompanies.map((company) => (
                  <motion.div
                    key={company.companyName}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => setSelectedCompany(company.companyName)}
                    className="p-4 sm:p-5 rounded-2xl bg-theme-card border border-black/5 dark:border-white/5 hover:border-sky-500/50 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-lg group-hover:bg-sky-500 group-hover:text-white transition-all">
                          <Building size={20} />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground group-hover:text-sky-500 transition-colors">
                            {company.companyName}
                          </h3>
                          {company.companyContact && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone size={12} /> {company.companyContact}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {company.outstandingBalance <= 0 ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 size={13} /> Paid Off
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-xs font-semibold">
                            {company.activeLoansCount} Active Loan{company.activeLoansCount > 1 ? 's' : ''}
                          </span>
                        )}
                        <ChevronRight size={18} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground font-medium">Total Loan:</span>
                        <span className="font-semibold text-foreground ml-1.5">
                          {getLocalCurrencySymbol(company.currency)} {company.totalLoanAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground font-medium">Amount Payable:</span>
                        <span className={`font-bold ml-1.5 ${company.outstandingBalance > 0 ? 'text-sky-500' : 'text-emerald-500'}`}>
                          {getLocalCurrencySymbol(company.currency)} {company.outstandingBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. REGISTER/EDIT LOAN SUBPAGE */}
        {isNewLoanSubpageOpen && !isPayLoanModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <form onSubmit={handleCreateLoan} className="space-y-6">
              {/* 1. Borrower Information Card */}
              <div className="p-5 sm:p-6 bg-card-bg border border-border rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                    <User size={18} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sky-500">
                    Borrower Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Full Name *"
                    name="borrowerName"
                    value={newLoanForm.borrowerName}
                    onChange={(e) => handleLoanFormChange('borrowerName', e.target.value)}
                  />
                  <div className="flex gap-2">
                    <CountryCodeDropdown
                      selectedCode={newLoanForm.borrowerCountryCode}
                      onSelect={(code) => handleLoanFormChange('borrowerCountryCode', code)}
                    />
                    <div className="flex-1">
                      <InputField
                        label="Mobile Number *"
                        name="borrowerMobile"
                        value={newLoanForm.borrowerMobile}
                        onChange={(e) => handleLoanFormChange('borrowerMobile', e.target.value)}
                      />
                    </div>
                  </div>
                  <InputField
                    label={language === 'bn' ? 'ডকুমেন্ট টাইপ' : 'Document Type'}
                    name="borrowerIdType"
                    value={newLoanForm.borrowerIdType}
                    type="select"
                    onOpenModal={() => setIsIdTypeSelectOpen(true)}
                  />
                  {newLoanForm.borrowerIdType && (
                    <InputField
                      label={language === 'bn' ? `${newLoanForm.borrowerIdType} নম্বর *` : `${newLoanForm.borrowerIdType === 'NID' ? 'National ID' : newLoanForm.borrowerIdType.charAt(0).toUpperCase() + newLoanForm.borrowerIdType.slice(1).toLowerCase()} Number *`}
                      name="borrowerIdNumber"
                      value={newLoanForm.borrowerIdNumber}
                      placeholder={(() => {
                        if (language === 'bn') {
                          return `${newLoanForm.borrowerIdType} নম্বরটি লিখুন`;
                        }
                        const normalized = newLoanForm.borrowerIdType.trim().toUpperCase();
                        if (normalized === 'NID' || normalized === 'NATIONAL ID') {
                          return 'National id numbers';
                        }
                        if (normalized === 'PASSPORT') {
                          return 'Passport Numbers';
                        }
                        const formatted = newLoanForm.borrowerIdType.charAt(0).toUpperCase() + newLoanForm.borrowerIdType.slice(1).toLowerCase();
                        return `${formatted} Numbers`;
                      })()}
                      onChange={(e) => handleLoanFormChange('borrowerIdNumber', e.target.value)}
                    />
                  )}
                  <InputField
                    label="Email Address"
                    name="borrowerEmail"
                    type="email"
                    value={newLoanForm.borrowerEmail}
                    onChange={(e) => handleLoanFormChange('borrowerEmail', e.target.value)}
                  />
                  <div className="sm:col-span-2">
                    <InputField
                      label="Address"
                      name="borrowerAddress"
                      value={newLoanForm.borrowerAddress}
                      onChange={(e) => handleLoanFormChange('borrowerAddress', e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <InputField
                      label="User / Contact Reference"
                      name="borrowerReference"
                      value={newLoanForm.borrowerReference}
                      onChange={(e) => handleLoanFormChange('borrowerReference', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Loan Company Information Card */}
              <div className="p-5 sm:p-6 bg-card-bg border border-border rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                    <Building size={18} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sky-500">
                    Loan Company Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Loan Company Name *"
                    name="companyName"
                    value={newLoanForm.companyName}
                    onChange={(e) => handleLoanFormChange('companyName', e.target.value)}
                    suggestions={companySummaries.map(c => c.companyName)}
                  />
                  <InputField
                    label="Company Contact Number"
                    name="companyContact"
                    value={newLoanForm.companyContact}
                    onChange={(e) => handleLoanFormChange('companyContact', e.target.value)}
                  />
                  <div className="sm:col-span-2">
                    <InputField
                      label="Company Address"
                      name="companyAddress"
                      value={newLoanForm.companyAddress}
                      onChange={(e) => handleLoanFormChange('companyAddress', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Loan & Term Details Card */}
              <div className="p-5 sm:p-6 bg-card-bg border border-border rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-border/40 pb-3">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                    <DollarSign size={18} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sky-500">
                    Loan & Term Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label={`Loan Amount (${getLocalCurrencySymbol(newLoanForm.currency)}) *`}
                    name="loanAmount"
                    type="number"
                    value={newLoanForm.loanAmount}
                    onChange={(e) => handleLoanFormChange('loanAmount', e.target.value)}
                  />
                  <InputField
                    label={language === 'bn' ? 'কারেন্সি *' : 'Currency *'}
                    name="currency"
                    type="select"
                    value={
                      newLoanForm.currency
                        ? (() => {
                            const found = currencies?.find(c => c.code === newLoanForm.currency);
                            return found ? `${found.code} (${found.symbol}) - ${found.name}` : newLoanForm.currency;
                          })()
                        : ''
                    }
                    placeholder="Select Currency"
                    onOpenModal={() => setIsCurrencySelectOpen(true)}
                  />
                  <InputField
                    label="Loan Start Date *"
                    name="loanDate"
                    type="date"
                    value={newLoanForm.loanDate}
                    onChange={(e) => handleLoanFormChange('loanDate', e.target.value)}
                  />
                  <InputField
                    label="Interest Rate (%)"
                    name="interestRate"
                    type="number"
                    value={newLoanForm.interestRate}
                    onChange={(e) => handleLoanFormChange('interestRate', e.target.value)}
                  />
                  <InputField
                    label="Loan Term (Months)"
                    name="loanTerm"
                    type="number"
                    value={newLoanForm.loanTerm}
                    onChange={(e) => handleLoanFormChange('loanTerm', e.target.value)}
                  />
                  <InputField
                    label="Number of Installments"
                    name="numberOfInstallments"
                    type="number"
                    value={newLoanForm.numberOfInstallments}
                    onChange={(e) => handleLoanFormChange('numberOfInstallments', e.target.value)}
                  />
                  <InputField
                    label={`Installment Amount (${getLocalCurrencySymbol(newLoanForm.currency)})`}
                    name="installmentAmount"
                    type="number"
                    value={newLoanForm.installmentAmount}
                    onChange={(e) => handleLoanFormChange('installmentAmount', e.target.value)}
                  />
                  <InputField
                    label="First Payment Due Date"
                    name="firstPaymentDate"
                    type="date"
                    value={newLoanForm.firstPaymentDate}
                    onChange={(e) => handleLoanFormChange('firstPaymentDate', e.target.value)}
                  />
                  <InputField
                    label={language === 'bn' ? 'পেমেন্ট ফ্রিকোয়েন্সি' : 'Payment Frequency'}
                    name="paymentFrequency"
                    type="select"
                    value={
                      newLoanForm.paymentFrequency === 'MONTHLY' ? 'Monthly' :
                      newLoanForm.paymentFrequency === 'WEEKLY' ? 'Weekly' :
                      newLoanForm.paymentFrequency === 'BI-WEEKLY' ? 'Bi-Weekly' :
                      newLoanForm.paymentFrequency === 'YEARLY' ? 'Yearly' :
                      newLoanForm.paymentFrequency === 'LUMP_SUM' ? 'Lump Sum' :
                      (newLoanForm.paymentFrequency || '')
                    }
                    placeholder="Select Payment Frequency"
                    onOpenModal={() => setIsFrequencySelectOpen(true)}
                  />
                  <div className="sm:col-span-2">
                    <InputField
                      label={language === 'bn' ? 'লোনের উদ্দেশ্য' : 'Loan Purpose'}
                      name="loanPurpose"
                      type="select"
                      value={newLoanForm.loanPurpose}
                      placeholder={language === 'bn' ? 'লোনের উদ্দেশ্য নির্বাচন করুন' : 'Select Loan Purpose'}
                      onOpenModal={() => setIsPurposeSelectOpen(true)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <InputField
                      label="Notes / Description"
                      name="notes"
                      value={newLoanForm.notes}
                      onChange={(e) => handleLoanFormChange('notes', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewLoanSubpageOpen(false);
                    setIsEditLoanMode(false);
                    setManualEditLoanRecord(null);
                  }}
                  disabled={isProcessing}
                  className="h-12 w-full rounded-[9px] border border-red-500/30 bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-[0_2px_10px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="h-12 w-full rounded-[9px] border border-sky-500/30 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-[0_2px_10px_rgba(2,132,199,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-85 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin shrink-0" />
                      <span>Processing</span>
                    </>
                  ) : (
                    isEditLoanMode 
                      ? (language === 'bn' ? 'আপডেট করুন' : 'Save Changes') 
                      : (language === 'bn' ? 'নতুন লোন যোগ করুন' : 'Register Loan')
                  )}
                </button>
              </div>
            </form>

            {/* CURRENCY GLOBAL SELECT */}
            <GlobalFullscreenSelect
              isOpen={isCurrencySelectOpen}
              onClose={() => setIsCurrencySelectOpen(false)}
              title={language === 'bn' ? 'কারেন্সি নির্বাচন করুন' : 'Select Currency'}
              selectedValue={newLoanForm.currency}
              options={
                currencies && currencies.length > 0
                  ? currencies.map(c => ({
                      label: `${c.code} (${c.symbol}) - ${c.name}`,
                      value: c.code
                    }))
                  : [
                      { label: 'BDT (৳) - Bangladeshi Taka', value: 'BDT' },
                      { label: 'USD ($) - US Dollar', value: 'USD' },
                      { label: 'QAR (QR) - Qatari Riyal', value: 'QAR' },
                      { label: 'EUR (€) - Euro', value: 'EUR' },
                      { label: 'SAR (SR) - Saudi Riyal', value: 'SAR' }
                    ]
              }
              onSelect={(val) => {
                handleLoanFormChange('currency', val);
                setIsCurrencySelectOpen(false);
              }}
              searchable={true}
            />

            {/* PAYMENT FREQUENCY GLOBAL SELECT */}
            <GlobalFullscreenSelect
              isOpen={isFrequencySelectOpen}
              onClose={() => setIsFrequencySelectOpen(false)}
              title={language === 'bn' ? 'পেমেন্ট ফ্রিকোয়েন্সি নির্বাচন করুন' : 'Select Payment Frequency'}
              selectedValue={newLoanForm.paymentFrequency}
              options={[
                { label: 'Monthly', value: 'MONTHLY' },
                { label: 'Weekly', value: 'WEEKLY' },
                { label: 'Bi-Weekly', value: 'BI-WEEKLY' },
                { label: 'Yearly', value: 'YEARLY' },
                { label: 'Lump Sum', value: 'LUMP_SUM' }
              ]}
              onSelect={(val) => {
                handleLoanFormChange('paymentFrequency', val as any);
                setIsFrequencySelectOpen(false);
              }}
              searchable={false}
            />
          </motion.div>
        )}

        {/* 2. LOAN DETAILS VIEW */}
        {selectedCompany && selectedSummary && !isBorrowerSubpageOpen && !isNewLoanSubpageOpen && !isPayLoanModalOpen && (
          <div className="space-y-6">

            {/* SUMMARY CARD */}
            <div className="pt-0 sm:pt-1 px-5 sm:px-6 pb-5 sm:pb-6 rounded-3xl bg-theme-card border border-black/5 dark:border-white/5 shadow-sm space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Company Header Info */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
                    <Building size={20} className="sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-foreground line-clamp-1">{selectedSummary.companyName}</h2>
                      <button
                        onClick={() => {
                          handleOpenBorrowerDetails();
                          setIsBorrowerSubpageOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        {language === 'bn' ? 'ভিউ' : 'View'} <ChevronRight size={14} />
                      </button>
                    </div>
                    {selectedSummary.companyContact && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Phone size={13} /> {selectedSummary.companyContact}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Outstanding Balance Full-Width Card */}
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 block">
                    {language === 'bn' ? 'বর্তমান বকেয়া ব্যালেন্স' : 'Current Outstanding Balance'}
                  </span>
                  <p className="text-xl sm:text-2xl font-black text-sky-900 dark:text-sky-100 mt-0.5">
                    {getLocalCurrencySymbol(selectedSummary?.currency)} {selectedSummary.outstandingBalance.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <DollarSign size={22} />
                </div>
              </div>

              {/* Key Figures Side-by-Side Animated Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Card 1: Total Loan Amount */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-3 sm:p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/40 shadow-xs flex items-center justify-between gap-1.5"
                >
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span className="text-[10px] xl:text-[11px] text-sky-700 dark:text-sky-300 font-semibold block capitalize whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {language === 'bn' ? 'মোট ঋণের পরিমাণ' : 'Total Loan Amount'}
                    </span>
                    <span className="font-black text-sm sm:text-base text-sky-900 dark:text-sky-100 mt-0.5 block truncate">
                      {getLocalCurrencySymbol(selectedSummary?.currency)} {selectedSummary.totalLoanAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Wallet size={20} />
                  </div>
                </motion.div>

                {/* Card 2: Total Amount Paid */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-3 sm:p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs flex items-center justify-between gap-1.5"
                >
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span className="text-[10px] xl:text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block capitalize whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {language === 'bn' ? 'পরিশোধিত মোট টাকা' : 'Total Amount Paid'}
                    </span>
                    <span className="font-black text-sm sm:text-base text-emerald-900 dark:text-emerald-100 mt-0.5 block truncate">
                      {getLocalCurrencySymbol(selectedSummary?.currency)} {selectedSummary.totalPaidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                </motion.div>

                {/* Card 3: Installment Amount */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-3 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 shadow-xs flex items-center justify-between gap-1.5"
                >
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span className="text-[10px] xl:text-[11px] text-amber-700 dark:text-amber-300 font-semibold block capitalize whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {language === 'bn' ? 'কিস্তির পরিমাণ' : 'Installment Amount'}
                    </span>
                    <span className="font-black text-sm sm:text-base text-amber-900 dark:text-amber-100 mt-0.5 block truncate">
                      {getLocalCurrencySymbol(selectedSummary?.currency)} {(selectedLoanRecord?.installmentAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                </motion.div>

                {/* Card 4: Installments Paid/Total */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-3 sm:p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/40 shadow-xs flex items-center justify-between gap-1.5"
                >
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span className="text-[10px] xl:text-[11px] text-purple-700 dark:text-purple-300 font-semibold block capitalize whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {language === 'bn' ? 'কিস্তি (পরিশোধিত/মোট)' : 'Installments (Paid/Total)'}
                    </span>
                    <span className="font-black text-sm sm:text-base text-purple-900 dark:text-purple-100 mt-0.5 block truncate">
                      {selectedLoanRecord ? `${selectedLoanRecord.paidInstallments} / ${selectedLoanRecord.numberOfInstallments}` : 'N/A'}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Hash size={20} />
                  </div>
                </motion.div>
              </div>

              {/* Interest & Additional Key Figures */}
              <div className="grid grid-cols-2 gap-3">
                {/* Card 5: Interest rates */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-3 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/40 shadow-xs flex items-center justify-between gap-1.5"
                >
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span className="text-[10px] xl:text-[11px] text-rose-700 dark:text-rose-300 font-semibold block capitalize whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {language === 'bn' ? 'সুদের হার' : 'Interest Rates'}
                    </span>
                    <span className="font-black text-sm sm:text-base text-rose-900 dark:text-rose-100 mt-0.5 block truncate">
                      {selectedLoanRecord?.interestRate || 0}%
                    </span>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <Percent size={18} className="sm:w-5 sm:h-5" />
                  </div>
                </motion.div>

                {/* Card 6: Total Interest */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  whileHover={!isEditingInterest ? { scale: 1.02, y: -2 } : {}}
                  onClick={() => {
                    if (!isEditingInterest && selectedLoanRecord) {
                       setTempInterestAmount(String(selectedLoanRecord.interestAmount || 0));
                       setIsEditingInterest(true);
                    }
                  }}
                  className={`p-3 sm:p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/40 shadow-xs flex items-center justify-between gap-1.5 ${!isEditingInterest ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span className="text-[10px] xl:text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold block capitalize whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {language === 'bn' ? 'মোট সুদ' : 'Total Interest'}
                    </span>
                    {isEditingInterest ? (
                      <div className="flex items-center gap-1.5 mt-0.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-indigo-900 dark:text-indigo-100 font-black text-sm sm:text-base">{getLocalCurrencySymbol(selectedSummary?.currency)}</span>
                        <input
                           type="number"
                           autoFocus
                           className="w-full max-w-[100px] bg-white dark:bg-black/20 border border-indigo-300 dark:border-indigo-700 rounded px-1.5 py-0.5 text-sm sm:text-base font-black text-indigo-900 dark:text-indigo-100 outline-none focus:ring-1 focus:ring-indigo-500"
                           value={tempInterestAmount}
                           onChange={(e) => setTempInterestAmount(e.target.value)}
                           onBlur={() => {
                              if (selectedLoanRecord && updateLoan) {
                                 const newInterestAmt = parseFloat(tempInterestAmount) || 0;
                                 const baseLoan = Number(selectedLoanRecord.loanAmount) || 0;
                                 let newRate = selectedLoanRecord.interestRate || 0;
                                 if (baseLoan > 0) {
                                   newRate = parseFloat(((newInterestAmt / baseLoan) * 100).toFixed(2));
                                 }
                                 updateLoan({
                                   ...selectedLoanRecord,
                                   interestAmount: newInterestAmt,
                                   interestRate: newRate
                                 });
                              }
                              setIsEditingInterest(false);
                           }}
                           onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                           }}
                        />
                      </div>
                    ) : (
                      <span className="font-black text-sm sm:text-base text-indigo-900 dark:text-indigo-100 mt-0.5 block truncate">
                        {getLocalCurrencySymbol(selectedSummary?.currency)} {(selectedLoanRecord?.interestAmount || 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Tag size={18} className="sm:w-5 sm:h-5" />
                  </div>
                </motion.div>
              </div>

              {/* Savings & Statement Grid */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                {/* Card 7: Total Savings */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.35 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className="p-3 sm:p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/40 shadow-xs flex items-center justify-between gap-1.5"
                >
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span className="text-[10px] xl:text-[11px] text-teal-700 dark:text-teal-300 font-semibold block capitalize whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {language === 'bn' ? 'মোট সেভিংস' : 'Total Savings'}
                    </span>
                    <span className="font-black text-sm sm:text-base text-teal-900 dark:text-teal-100 mt-0.5 block truncate">
                      {getLocalCurrencySymbol(selectedSummary?.currency)} {(selectedSummary?.totalSavingsAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Wallet size={18} className="sm:w-5 sm:h-5" />
                  </div>
                </motion.div>

                {/* Card 8: Statement Download */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  onClick={handleDownloadStatement}
                  className="p-3 sm:p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/40 shadow-xs flex items-center justify-between gap-1.5 cursor-pointer"
                >
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <span className="text-[10px] xl:text-[11px] text-orange-700 dark:text-orange-300 font-semibold block capitalize whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                      {language === 'bn' ? 'স্টেটমেন্ট ডাউনলোড' : 'Statement Download'}
                    </span>
                    <span className="font-black text-sm sm:text-base text-orange-900 dark:text-orange-100 mt-0.5 block truncate">
                      {language === 'bn' ? 'পিডিএফ (A4)' : 'PDF (A4)'}
                    </span>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <Download size={18} className="sm:w-5 sm:h-5" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* PAYMENT HISTORY SECTION */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Clock size={18} className="text-sky-500" /> {language === 'bn' ? 'পেমেন্ট হিস্ট্রি' : 'Payment History'}
                </h3>
                <button
                  onClick={() => handleOpenPayLoan(selectedCompany)}
                  className="px-3 py-1.5 rounded-xl bg-sky-600/10 hover:bg-sky-600 text-sky-500 hover:text-white font-semibold text-xs transition-all flex items-center gap-1"
                >
                  <Plus size={14} /> {language === 'bn' ? 'পেমেন্ট যোগ করুন' : 'Add Payment'}
                </button>
              </div>

              {combinedHistory.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-theme-card border border-black/5 dark:border-white/5 space-y-2 shadow-sm">
                  <Clock size={32} className="mx-auto text-muted-foreground/40" />
                  <p className="text-xs font-medium text-muted-foreground">No records found for this loan company.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {combinedHistory.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => handleViewLoanDetails(item)}
                      className={`p-4 rounded-xl bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] flex items-center justify-between gap-4 transition-all hover:shadow-md ${(item.historyType === 'LOAN_RECEIVE' || item.historyType === 'INSTALLMENT_PAID') ? 'cursor-pointer active:scale-[0.99]' : ''}`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          item.historyType === 'LOAN_RECEIVE' 
                            ? 'bg-amber-500/10 text-amber-500' 
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {item.historyType === 'LOAN_RECEIVE' ? <ArrowDownLeft size={20} /> : <CheckCircle2 size={20} />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          {item.historyType === 'LOAN_RECEIVE' ? (
                            <>
                              <h4 className="font-bold text-sm text-foreground truncate flex items-center gap-2">
                                <span>{language === 'bn' ? 'লোন' : 'Loan'}</span>
                                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest shadow-sm shadow-amber-500/20 flex items-center gap-1">
                                  <ArrowDownLeft size={10} />
                                  {language === 'bn' ? 'রিসিভ' : 'Received'}
                                </span>
                              </h4>
                              <div className="mt-1.5">
                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                  <Calendar size={12} className="text-sky-500" />
                                  <span>{language === 'bn' ? 'তারিখ:' : 'Date:'} {new Date(item.date).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                  })}</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <h4 className="font-bold text-sm text-foreground truncate flex items-center gap-2">
                                <span>{language === 'bn' ? 'কিস্তি' : 'Installment'}</span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-sm shadow-emerald-500/20">
                                  {language === 'bn' ? 'পেইড' : 'Paid'}
                                </span>
                              </h4>
                              <div className="mt-1.5 space-y-1">
                                <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                  <Calendar size={12} className="text-emerald-500" />
                                  <span>{language === 'bn' ? 'তারিখ:' : 'Date:'} {new Date(item.date).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                  })}</span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className={`font-black text-sm sm:text-base ${
                          item.historyType === 'LOAN_RECEIVE' ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {item.historyType === 'LOAN_RECEIVE' ? '+' : '-'}{getLocalCurrencySymbol(item.currency)} {item.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 3. BORROWER DETAILS & EDIT SUBPAGE */}
        {selectedCompany && selectedLoanRecord && isBorrowerSubpageOpen && !isPayLoanModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Main Info Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-theme-card border border-black/5 dark:border-white/5 shadow-sm space-y-6">
              
              {!isEditingBorrower ? (
                // VIEW MODE
                <div className="space-y-6">
                  {/* Avatar & Header with Edit Button on Right */}
                  <div className="flex items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-2xl shadow-inner">
                        {borrowerForm.borrowerName ? borrowerForm.borrowerName.charAt(0).toUpperCase() : 'B'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{borrowerForm.borrowerName}</h3>
                        <p className="text-xs text-muted-foreground">{language === 'bn' ? 'ব্যক্তিগত তথ্য প্রোফাইল' : 'Personal Information Profile'}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenEditLoan}
                      className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                      title={language === 'bn' ? 'সম্পাদনা করুন' : 'Edit Details'}
                    >
                      <Edit2 size={14} /> {language === 'bn' ? 'এডিট' : 'Edit'}
                    </button>
                  </div>

                  {/* Profile Grid (Borrower Details) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/30">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{language === 'bn' ? 'নাম' : 'Full Name'}</span>
                      <p className="text-foreground font-bold">{borrowerForm.borrowerName || '—'}</p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/30">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}</span>
                      <p className="text-foreground font-bold flex items-center gap-1.5">
                        <span className="text-sky-500">{borrowerForm.borrowerCountryCode}</span>
                        <span>{borrowerForm.borrowerMobile}</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/30">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}</span>
                      <p className="text-foreground font-bold">{borrowerForm.borrowerEmail || '—'}</p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/30">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{language === 'bn' ? 'ডকুমেন্ট টাইপ' : 'Document Type'}</span>
                      <p className="text-foreground font-bold">{borrowerForm.borrowerIdType || '—'}</p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {borrowerForm.borrowerIdType ? `${borrowerForm.borrowerIdType}` : (language === 'bn' ? 'ডকুমেন্ট নম্বর' : 'ID Number')}
                      </span>
                      <p className="text-foreground font-bold">{borrowerForm.borrowerIdNumber || '—'}</p>
                    </div>

                    <div className="flex items-center justify-between p-3.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{language === 'bn' ? 'অ্যাড্রেস' : 'Address'}</span>
                      <p className="text-foreground font-bold truncate max-w-[150px]">{borrowerForm.borrowerAddress || '—'}</p>
                    </div>

                    <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 md:col-span-2">
                      <span className="text-xs text-muted-foreground block font-medium uppercase tracking-wider">{language === 'bn' ? 'ইউজার রেফারেন্স' : 'User Reference'}</span>
                      <p className="text-foreground font-bold">{borrowerForm.borrowerReference || '—'}</p>
                    </div>
                  </div>

                  {/* Loan & Timeline Information Section (2 Columns) */}
                  <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-4">
                    <h4 className="text-sm font-bold text-sky-500 uppercase tracking-wider">
                      {language === 'bn' ? 'কোম্পানি ও ঋণের বিবরণ' : 'Company & Loan Details'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'কোম্পানির নাম' : 'Company Name'}</span>
                        <p className="text-foreground font-bold">{selectedSummary?.companyName || '—'}</p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'কোম্পানি কন্টাক্ট' : 'Company Contact'}</span>
                        <p className="text-foreground font-bold">{selectedSummary?.companyContact || '—'}</p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/30 md:col-span-2">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'কোম্পানি ঠিকানা' : 'Company Address'}</span>
                        <p className="text-foreground font-bold truncate max-w-[200px]">{selectedSummary?.companyAddress || '—'}</p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'কারেন্সি' : 'Currency'}</span>
                        <p className="text-foreground font-bold">{selectedSummary?.currency || 'BDT'}</p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'মোট ঋণ পরিমাণ' : 'Total Loan Amount'}</span>
                        <p className="text-foreground font-bold">
                          {getLocalCurrencySymbol(selectedSummary?.currency)} {((selectedLoanRecord?.loanAmount || 0) + (selectedLoanRecord?.interestAmount || 0)).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'মূল লোন পরিমাণ' : 'Principal Amount'}</span>
                        <p className="text-foreground font-bold">
                          {getLocalCurrencySymbol(selectedSummary?.currency)} {(selectedLoanRecord?.loanAmount || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'সুদের পরিমাণ' : 'Interest Amount'}</span>
                        <p className="text-foreground font-bold">
                          {getLocalCurrencySymbol(selectedSummary?.currency)} {(selectedLoanRecord?.interestAmount || 0).toLocaleString()} ({selectedLoanRecord?.interestRate || 0}%)
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'কিস্তির পরিমাণ' : 'Installment Amount'}</span>
                        <p className="text-foreground font-bold">
                          {getLocalCurrencySymbol(selectedSummary?.currency)} {(selectedLoanRecord?.installmentAmount || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'কিস্তির সংখ্যা' : 'Number of Installments'}</span>
                        <p className="text-foreground font-bold">
                          {selectedLoanRecord?.paidInstallments || 0} / {selectedLoanRecord?.numberOfInstallments || 12}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'পেমেন্ট ফ্রিকোয়েন্সি' : 'Payment Frequency'}</span>
                        <p className="text-foreground font-bold">{selectedLoanRecord?.paymentFrequency || 'MONTHLY'}</p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'বর্তমান বকেয়া' : 'Outstanding Balance'}</span>
                        <p className="text-foreground font-bold text-sky-600 dark:text-sky-400">
                          {getLocalCurrencySymbol(selectedSummary?.currency)} {(selectedLoanRecord?.outstandingBalance || 0).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'ঋণ নেওয়ার তারিখ' : 'Loan Start Date'}</span>
                        <p className="text-foreground font-bold">{selectedLoanRecord?.loanDate || '—'}</p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'প্রথম পেমেন্টের তারিখ (নির্ধারিত)' : 'First Payment Due Date'}</span>
                        <p className="text-foreground font-bold">{selectedLoanRecord?.firstPaymentDate || '—'}</p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'সর্বপ্রথম পেমেন্ট করার তারিখ' : 'First Payment Made Date'}</span>
                        <p className="text-foreground font-bold">
                          {(() => {
                            const pList = userPayments.filter(p => p.loanId === selectedLoanRecord?.id);
                            const sorted = [...pList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                            return sorted.length > 0 ? sorted[0].date : (language === 'bn' ? 'কোনো পেমেন্ট হয়নি' : 'No payments yet');
                          })()}
                        </p>
                      </div>

                      <div className="flex items-center justify-between p-3.5 rounded-lg bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/30">
                        <span className="text-xs text-muted-foreground font-medium">{language === 'bn' ? 'লোনের অবস্থান ও স্ট্যাটাস' : 'Loan Status'}</span>
                        <p className="text-foreground font-bold uppercase">{selectedLoanRecord?.status || 'ACTIVE'}</p>
                      </div>

                      <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 md:col-span-2">
                        <span className="text-xs text-muted-foreground block font-medium">{language === 'bn' ? 'লোনের উদ্দেশ্য' : 'Loan Purpose'}</span>
                        <p className="text-foreground font-semibold">{selectedLoanRecord?.loanPurpose || '—'}</p>
                      </div>

                      <div className="space-y-1 bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 md:col-span-2">
                        <span className="text-xs text-muted-foreground block font-medium">{language === 'bn' ? 'নোটস / বিবরণ' : 'Notes / Description'}</span>
                        <p className="text-foreground font-semibold">{selectedLoanRecord?.notes || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-black/5 dark:border-white/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Delete Profile Button */}
                      <Button
                        id="btn-delete-borrower-profile"
                        type="button"
                        variant="danger"
                        size="md"
                        isLoading={isDeletingProfile}
                        loadingText={language === 'bn' ? 'ডিলিট হচ্ছে...' : 'Deleting'}
                        icon={<Trash2 size={18} />}
                        onClick={handleDeleteBorrowerProfile}
                        fullWidth
                      >
                        {language === 'bn' ? 'প্রোফাইল ডিলিট' : 'Delete Profile'}
                      </Button>

                      {/* Download PDF Button */}
                      <Button
                        id="btn-download-borrower-pdf"
                        type="button"
                        variant="primary"
                        size="md"
                        isLoading={isDownloadingPDF}
                        loadingText={language === 'bn' ? 'ডাউনলোড হচ্ছে...' : 'Downloading'}
                        icon={<Download size={18} />}
                        onClick={handleDownloadPDF}
                        fullWidth
                      >
                        {language === 'bn' ? 'লোন ডিটেইলস ডাউনলোড' : 'Download Details'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <form onSubmit={handleSaveBorrowerDetails} className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-black/5 dark:border-white/5 pb-5">
                    <div className="w-14 h-14 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold text-2xl shadow-inner">
                      {borrowerForm.borrowerName ? borrowerForm.borrowerName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{language === 'bn' ? 'তথ্য এডিট করুন' : 'Edit Borrower Information'}</h3>
                      <p className="text-xs text-muted-foreground">{language === 'bn' ? 'ঋণগ্রহীতার বিবরণ পরিবর্তন করুন' : 'Modify the borrower personal details'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label={language === 'bn' ? 'ঋণগ্রহীতার নাম *' : 'Borrower Name *'}
                      name="borrowerName"
                      value={borrowerForm.borrowerName}
                      onChange={(e) => handleBorrowerFormChange('borrowerName', e.target.value)}
                    />

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {language === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
                      </label>
                      <div className="flex gap-2">
                        <CountryCodeDropdown
                          selectedCode={borrowerForm.borrowerCountryCode || defaultCountryCode}
                          onSelect={(code) => handleBorrowerFormChange('borrowerCountryCode', code)}
                        />
                        <div className="flex-1">
                          <InputField
                            label=""
                            name="borrowerMobile"
                            value={borrowerForm.borrowerMobile}
                            onChange={(e) => handleBorrowerFormChange('borrowerMobile', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <InputField
                      label={language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                      name="borrowerEmail"
                      value={borrowerForm.borrowerEmail}
                      onChange={(e) => handleBorrowerFormChange('borrowerEmail', e.target.value)}
                    />

                    <InputField
                      label={language === 'bn' ? 'ঠিকানা' : 'Address'}
                      name="borrowerAddress"
                      value={borrowerForm.borrowerAddress}
                      onChange={(e) => handleBorrowerFormChange('borrowerAddress', e.target.value)}
                    />

                    <InputField
                      label={language === 'bn' ? 'ডকুমেন্ট টাইপ' : 'Document Type'}
                      name="borrowerIdType"
                      value={borrowerForm.borrowerIdType}
                      type="select"
                      onOpenModal={() => setIsIdTypeSelectOpen(true)}
                    />

                    {borrowerForm.borrowerIdType && (
                      <InputField
                        label={language === 'bn' ? `${borrowerForm.borrowerIdType} নম্বর` : `${borrowerForm.borrowerIdType === 'NID' ? 'National ID' : borrowerForm.borrowerIdType.charAt(0).toUpperCase() + borrowerForm.borrowerIdType.slice(1).toLowerCase()} Number`}
                        name="borrowerIdNumber"
                        value={borrowerForm.borrowerIdNumber}
                        placeholder={(() => {
                          if (language === 'bn') {
                            return `${borrowerForm.borrowerIdType} নম্বরটি লিখুন`;
                          }
                          const normalized = borrowerForm.borrowerIdType.trim().toUpperCase();
                          if (normalized === 'NID' || normalized === 'NATIONAL ID') {
                            return 'National id numbers';
                          }
                          if (normalized === 'PASSPORT') {
                            return 'Passport Numbers';
                          }
                          const formatted = borrowerForm.borrowerIdType.charAt(0).toUpperCase() + borrowerForm.borrowerIdType.slice(1).toLowerCase();
                          return `${formatted} Numbers`;
                        })()}
                        onChange={(e) => handleBorrowerFormChange('borrowerIdNumber', e.target.value)}
                      />
                    )}

                    <div className="md:col-span-2">
                      <InputField
                        label={language === 'bn' ? 'ইউজার রেফারেন্স' : 'User Reference'}
                        name="borrowerReference"
                        value={borrowerForm.borrowerReference}
                        onChange={(e) => handleBorrowerFormChange('borrowerReference', e.target.value)}
                      />
                    </div>

                    <InputField
                      label={language === 'bn' ? 'ঋণের উদ্দেশ্য' : 'Loan Purpose'}
                      name="loanPurpose"
                      type="select"
                      value={borrowerForm.loanPurpose}
                      placeholder={language === 'bn' ? 'লোনের উদ্দেশ্য নির্বাচন করুন' : 'Select Loan Purpose'}
                      onOpenModal={() => setIsPurposeSelectOpen(true)}
                    />

                    <div className="md:col-span-2">
                      <InputField
                        label={language === 'bn' ? 'অতিরিক্ত নোট' : 'Additional Notes'}
                        name="notes"
                        value={borrowerForm.notes}
                        onChange={(e) => handleBorrowerFormChange('notes', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-black/5 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsEditingBorrower(false)}
                      className="h-12 w-full rounded-[9px] border border-red-500/30 bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-[0_2px_10px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center cursor-pointer active:scale-[0.98]"
                    >
                      {language === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="h-12 w-full rounded-[9px] border border-sky-500/30 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-[0_2px_10px_rgba(2,132,199,0.3)] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
                    >
                      {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </motion.div>
        )}

        {/* 4. RECORD PAYMENT SUBPAGE */}
        {isPayLoanModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <form onSubmit={handleCreatePayment} className="space-y-6">
              {/* Card 1: Payment Details Card */}
              <div className="p-5 sm:p-6 bg-theme-card border border-black/5 dark:border-white/5 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-black/5 dark:border-white/5 pb-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <DollarSign size={18} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {language === 'bn' ? 'পেমেন্ট বিবরণী' : 'Payment Details'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Loan Company */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      {language === 'bn' ? 'লোন কোম্পানি নির্বাচন করুন *' : 'Select Loan Company *'}
                    </label>
                    <select
                      value={payLoanForm.selectedCompanyName}
                      onChange={(e) => setPayLoanForm(prev => ({ ...prev, selectedCompanyName: e.target.value }))}
                      className="w-full h-14 px-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border text-foreground text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                    >
                      {companySummaries.map(c => (
                        <option key={c.companyName} value={c.companyName} className="bg-white dark:bg-slate-950">
                          {c.companyName} ({language === 'bn' ? 'বকেয়া' : 'Outstanding'}: {getLocalCurrencySymbol(c.currency)} {c.outstandingBalance.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Amount */}
                  <InputField
                    label={language === 'bn' 
                      ? `পেমেন্ট পরিমাণ (${getLocalCurrencySymbol(companySummaries.find(c => c.companyName === payLoanForm.selectedCompanyName)?.currency)}) *`
                      : `Payment Amount (${getLocalCurrencySymbol(companySummaries.find(c => c.companyName === payLoanForm.selectedCompanyName)?.currency)}) *`}
                    name="paymentAmount"
                    type="number"
                    value={payLoanForm.paymentAmount}
                    onChange={(e) => setPayLoanForm(prev => ({ ...prev, paymentAmount: e.target.value }))}
                  />

                  {/* Savings Amount */}
                  <InputField
                    label={language === 'bn' ? 'সেভিংস (যদি থাকে)' : 'Savings (Optional)'}
                    name="savingsAmount"
                    type="number"
                    value={payLoanForm.savingsAmount}
                    onChange={(e) => setPayLoanForm(prev => ({ ...prev, savingsAmount: e.target.value }))}
                  />

                  {/* Payment Date */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      {language === 'bn' ? 'পেমেন্টের তারিখ *' : 'Payment Date *'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(true)}
                      className="w-full h-14 px-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border flex items-center justify-between hover:border-emerald-500/50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                          <Calendar size={18} />
                        </div>
                        <span className="text-sm font-bold text-foreground">
                          {payLoanForm.paymentDate || (language === 'bn' ? 'তারিখ নির্বাচন করুন' : 'Select Date')}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground" />
                    </button>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      {language === 'bn' ? 'পেমেন্ট মাধ্যম *' : 'Payment Method *'}
                    </label>
                    <select
                      value={payLoanForm.paymentMethod}
                      onChange={(e) => setPayLoanForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="w-full h-14 px-3.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border text-foreground text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
                    >
                      <option value="Cash" className="bg-white dark:bg-slate-950">Cash</option>
                      <option value="Bank Transfer" className="bg-white dark:bg-slate-950">Bank Transfer</option>
                      <option value="Check" className="bg-white dark:bg-slate-950">Check</option>
                      <option value="Mobile Banking" className="bg-white dark:bg-slate-950">Mobile Banking</option>
                      <option value="bKash" className="bg-white dark:bg-slate-950">bKash</option>
                      <option value="Nagad" className="bg-white dark:bg-slate-950">Nagad</option>
                    </select>
                  </div>

                  {/* Dynamic Reference Field */}
                  {payLoanForm.paymentMethod !== 'Cash' && (
                    <div className="sm:col-span-2">
                      <InputField
                        label={getReferenceLabel(payLoanForm.paymentMethod)}
                        name="paymentReference"
                        value={payLoanForm.paymentReference}
                        onChange={(e) => setPayLoanForm(prev => ({ ...prev, paymentReference: e.target.value }))}
                        placeholder={getReferenceLabel(payLoanForm.paymentMethod)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Sender Information Card (if Bank Transfer) */}
              {payLoanForm.paymentMethod === 'Bank Transfer' && (
                <div className="p-5 sm:p-6 bg-theme-card border border-black/5 dark:border-white/5 rounded-3xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-black/5 dark:border-white/5 pb-3">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <ArrowUpRight size={18} />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {language === 'bn' ? 'প্রেরক ব্যাংকের তথ্য' : 'Sender Bank Information'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        {language === 'bn' ? 'প্রেরক ব্যাংক' : 'Sender Bank'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsBankSelectOpen({ open: true, type: 'sender' })}
                        className="w-full h-14 px-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border flex items-center justify-between text-xs font-bold text-foreground"
                      >
                        <span className={payLoanForm.senderBankName ? '' : 'text-muted-foreground'}>
                          {payLoanForm.senderBankName || (language === 'bn' ? 'ব্যাংক সিলেক্ট করুন' : 'Select Sender Bank')}
                        </span>
                        <Building size={16} className="text-muted-foreground" />
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                        {language === 'bn' ? 'ব্রাঞ্চ' : 'Branch'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsBranchSelectOpen({ open: true, type: 'sender' })}
                        className="w-full h-14 px-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border flex items-center justify-between text-xs font-bold text-foreground"
                      >
                        <span className={payLoanForm.senderBranchName ? '' : 'text-muted-foreground'}>
                          {payLoanForm.senderBranchName || (language === 'bn' ? 'ব্রাঞ্চ সিলেক্ট করুন' : 'Select Branch')}
                        </span>
                        <MapPin size={16} className="text-muted-foreground" />
                      </button>
                    </div>

                    {payLoanForm.senderBranchName && (
                      <>
                        <InputField
                          label={language === 'bn' ? 'অ্যাকাউন্ট হোল্ডারের নাম' : 'Account Holder Name'}
                          name="senderAccountHolder"
                          value={payLoanForm.senderAccountHolder}
                          onChange={(e) => setPayLoanForm(prev => ({ ...prev, senderAccountHolder: e.target.value }))}
                        />
                        <InputField
                          label={language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}
                          name="senderAccountNumber"
                          value={payLoanForm.senderAccountNumber}
                          onChange={(e) => setPayLoanForm(prev => ({ ...prev, senderAccountNumber: e.target.value }))}
                          placeholder="Enter Account number"
                        />
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Card 3: Receiver Information Card */}
              <div className="p-5 sm:p-6 bg-theme-card border border-black/5 dark:border-white/5 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-black/5 dark:border-white/5 pb-3">
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                    <ArrowDownLeft size={18} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                    {language === 'bn' ? 'প্রাপক ব্যাংকের তথ্য' : 'Receiver Bank Information'}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      {language === 'bn' ? 'প্রাপক ব্যাংক' : 'Receiver Bank'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBankSelectOpen({ open: true, type: 'receiver' })}
                      className="w-full h-14 px-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border flex items-center justify-between text-xs font-bold text-foreground"
                    >
                      <span className={payLoanForm.receiverBankName ? '' : 'text-muted-foreground'}>
                        {payLoanForm.receiverBankName || (language === 'bn' ? 'ব্যাংক সিলেক্ট করুন' : 'Select Receiver Bank')}
                      </span>
                      <Building size={16} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
                      {language === 'bn' ? 'ব্রাঞ্চ' : 'Branch'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsBranchSelectOpen({ open: true, type: 'receiver' })}
                      className="w-full h-14 px-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-border flex items-center justify-between text-xs font-bold text-foreground"
                    >
                      <span className={payLoanForm.receiverBranchName ? '' : 'text-muted-foreground'}>
                        {payLoanForm.receiverBranchName || (language === 'bn' ? 'ব্রাঞ্চ সিলেক্ট করুন' : 'Select Branch')}
                      </span>
                      <MapPin size={16} className="text-muted-foreground" />
                    </button>
                  </div>

                  <InputField
                    label={language === 'bn' ? 'অ্যাকাউন্ট হোল্ডারের নাম' : 'Account Holder Name'}
                    name="receiverAccountHolder"
                    value={payLoanForm.receiverAccountHolder}
                    onChange={(e) => setPayLoanForm(prev => ({ ...prev, receiverAccountHolder: e.target.value }))}
                  />
                  <InputField
                    label={language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}
                    name="receiverAccountNumber"
                    value={payLoanForm.receiverAccountNumber}
                    onChange={(e) => setPayLoanForm(prev => ({ ...prev, receiverAccountNumber: e.target.value }))}
                    placeholder="Enter Account number"
                  />
                </div>
              </div>

              {/* Card 4: Transaction Details & Notes Card */}
              <div className="p-5 sm:p-6 bg-theme-card border border-black/5 dark:border-white/5 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-black/5 dark:border-white/5 pb-3">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <FileText size={18} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {language === 'bn' ? 'ট্রানজেকশন বিবরণী / নোট' : 'Transaction Details & Notes'}
                  </h3>
                </div>
                <InputField
                  label={language === 'bn' ? 'ট্রানজেকশন বিবরণ / নোটস' : 'Transaction Details / Notes'}
                  name="transactionDetails"
                  type="textarea"
                  value={payLoanForm.transactionDetails}
                  onChange={(e) => setPayLoanForm(prev => ({ ...prev, transactionDetails: e.target.value }))}
                />
              </div>

              {/* Form Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 pb-12">
                <button
                  type="button"
                  onClick={() => {
                    setIsPayLoanModalOpen(false);
                    setIsEditingPayment(false);
                    setEditingPaymentId(null);
                  }}
                  className="h-12 w-full rounded-[9px] border border-red-500/30 bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-[0_2px_10px_rgba(220,38,38,0.3)] transition-all flex items-center justify-center cursor-pointer active:scale-[0.98]"
                >
                  {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="h-12 w-full rounded-[9px] border border-emerald-500/30 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-[0_2px_10px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check size={18} />
                  {isEditingPayment 
                    ? (language === 'bn' ? 'পেমেন্ট আপডেট করুন' : 'Update Payment')
                    : (language === 'bn' ? 'পেমেন্ট জমা দিন' : 'Submit Payment')
                  }
                </button>
              </div>
            </form>
          </motion.div>
        )}

      </div>

      {/* FLOATING ACTION BUTTON (FAB) & BACKDROP BLUR (PORTALED TO COVER BOTTOM NAV & SCREEN) */}
      {!selectedCompany && !isNewLoanSubpageOpen && !isBorrowerSubpageOpen && !isPayLoanModalOpen && typeof document !== 'undefined' && createPortal(
        <>
          {/* Full-screen Soft/Light Backdrop Blur covering bottom navigation bar and page */}
          <AnimatePresence>
            {isFabOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setIsFabOpen(false)} 
                className="fixed inset-0 z-[1200] bg-black/10 backdrop-blur-[2px] cursor-pointer"
              />
            )}
          </AnimatePresence>

          {/* Floating Actions Container (Elevated on top of blurred screen & bottom nav) */}
          <div className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] right-6 z-[1250] sm:bottom-8">
            <AnimatePresence>
              {isFabOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.94 }}
                  transition={{ duration: 0.16 }}
                  className="absolute bottom-16 right-0 mb-2 w-52 rounded-2xl bg-white dark:bg-card bg-theme-card border border-black/10 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-2 space-y-1.5 z-[1250]"
                >
                  <button
                    type="button"
                    onClick={() => { setIsNewLoanSubpageOpen(true); setIsFabOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sky-500/10 text-slate-800 dark:text-slate-100 hover:text-sky-600 dark:hover:text-sky-400 font-semibold text-sm transition-colors text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                      <Plus size={18} />
                    </div>
                    <span>{language === 'bn' ? 'নতুন লোন' : 'New Loan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleOpenPayLoan(); setIsFabOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-500/10 text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-sm transition-colors text-left cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <DollarSign size={18} />
                    </div>
                    <span>{language === 'bn' ? 'লোন পেমেন্ট' : 'Pay Loan'}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={() => setIsFabOpen(!isFabOpen)}
              className={`w-14 h-14 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/30 flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer ${isFabOpen ? 'rotate-45' : ''}`}
              aria-label="Loan Actions FAB"
            >
              <Plus size={28} />
            </button>
          </div>
        </>,
        document.body
      )}

      <GlobalFullscreenSelect
        isOpen={isIdTypeSelectOpen}
        onClose={() => setIsIdTypeSelectOpen(false)}
        title={language === 'bn' ? 'ডকুমেন্ট টাইপ সিলেক্ট করুন' : 'Select Document Type'}
        options={(idTypes.length > 0 ? idTypes : ['NID', 'PASSPORT', 'DRIVING LICENSE', 'VISA', 'WORK PERMIT']).map(t => ({ label: t, value: t }))}
        onSelect={(val) => {
          if (isBorrowerSubpageOpen) {
            handleBorrowerFormChange('borrowerIdType', val);
          } else {
            handleLoanFormChange('borrowerIdType', val);
          }
          setIsIdTypeSelectOpen(false);
        }}
        selectedValue={isBorrowerSubpageOpen ? borrowerForm.borrowerIdType : newLoanForm.borrowerIdType}
      />

      <GlobalDateTimePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        value={payLoanForm.paymentDate}
        onSelect={(val) => setPayLoanForm(prev => ({ ...prev, paymentDate: val }))}
        type="date"
        title={language === 'bn' ? 'তারিখ নির্বাচন' : 'Select Date'}
      />

      <GlobalFullscreenSelect
        isOpen={isBankSelectOpen.open}
        onClose={() => setIsBankSelectOpen({ open: false, type: 'sender' })}
        title={isBankSelectOpen.type === 'sender' ? (language === 'bn' ? 'ব্যাংক সিলেক্ট করুন' : 'Select Sender Bank') : (language === 'bn' ? 'ব্যাংক সিলেক্ট করুন' : 'Select Receiver Bank')}
        options={banks.map(b => ({ label: b.name, value: b.name }))}
        onSelect={(val) => {
          setPayLoanForm(prev => ({
            ...prev,
            [isBankSelectOpen.type === 'sender' ? 'senderBankName' : 'receiverBankName']: val
          }));
          setIsBankSelectOpen({ open: false, type: 'sender' });
        }}
        selectedValue={isBankSelectOpen.type === 'sender' ? payLoanForm.senderBankName : payLoanForm.receiverBankName}
      />

      <GlobalFullscreenSelect
        isOpen={isBranchSelectOpen.open}
        onClose={() => setIsBranchSelectOpen({ open: false, type: 'sender' })}
        title={isBranchSelectOpen.type === 'sender' ? (language === 'bn' ? 'ব্রাঞ্চ সিলেক্ট করুন' : 'Select Sender Branch') : (language === 'bn' ? 'ব্রাঞ্চ সিলেক্ট করুন' : 'Select Receiver Branch')}
        options={branches.map(b => ({ label: b.name, value: b.name }))}
        onSelect={(val) => {
          setPayLoanForm(prev => ({
            ...prev,
            [isBranchSelectOpen.type === 'sender' ? 'senderBranchName' : 'receiverBranchName']: val
          }));
          setIsBranchSelectOpen({ open: false, type: 'sender' });
        }}
        selectedValue={isBranchSelectOpen.type === 'sender' ? payLoanForm.senderBranchName : payLoanForm.receiverBranchName}
      />

      {/* LOAN PURPOSE GLOBAL SELECT */}
      <GlobalFullscreenSelect
        isOpen={isPurposeSelectOpen}
        onClose={() => setIsPurposeSelectOpen(false)}
        title={language === 'bn' ? 'লোনের উদ্দেশ্য নির্বাচন করুন' : 'Select Loan Purpose'}
        selectedValue={newLoanForm.loanPurpose || borrowerForm.loanPurpose}
        options={
          loanPurposes && loanPurposes.length > 0
            ? loanPurposes.map(lp => ({ label: lp, value: lp }))
            : [
                { label: 'PERSONAL', value: 'PERSONAL' },
                { label: 'BUSINESS', value: 'BUSINESS' },
                { label: 'MEDICAL', value: 'MEDICAL' },
                { label: 'EDUCATION', value: 'EDUCATION' },
                { label: 'HOME / CONSTRUCTION', value: 'HOME / CONSTRUCTION' },
                { label: 'VEHICLE', value: 'VEHICLE' },
                { label: 'OTHER', value: 'OTHER' }
              ]
        }
        onSelect={(val) => {
          handleLoanFormChange('loanPurpose', val);
          handleBorrowerFormChange('loanPurpose', val);
          setIsPurposeSelectOpen(false);
        }}
        searchable={true}
      />

    </div>
  );
}
