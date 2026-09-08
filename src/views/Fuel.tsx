import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { 
  Plus, Calendar, Trash2, Edit2, Download, Eye, FileText, Upload, ChevronLeft, Droplets, Receipt, Sparkles, TrendingUp, DollarSign, Activity, Image as ImageIcon, Fuel, Trash, Check, ChevronDown, X
} from 'lucide-react';

import { downloadPdf } from '../utils/fileUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FuelPurchase } from '../types';
import GlobalFullscreenSelect from '../components/GlobalFullscreenSelect';
import InputField from '../components/InputField';

export default function FuelView() {
  const { 
    user, allFuels, addFuel, updateFuel, removeFuel, payments, language, setView, primaryColor, isNightMode, confirmAction, showFeedback, selectedCurrency, wallpaper, backgroundColor, globalFilterMonth, setGlobalFilterMonth, globalFilterYear, setGlobalFilterYear
  } = useStore();

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

  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Bilingual translation support
  const localT = {
    en: {
      fuelManagement: 'Fuel Management',
      summary: 'Fuel Summary',
      totalBuy: 'Buy',
      totalSell: 'Sell',
      totalProfit: 'Total Profit',
      qty: 'Qty',
      liters: 'Liters',
      currentPrice: 'Current Diesel Price',
      buyEntries: 'Diesel Buy History',
      addBuyEntry: 'Add Buy Entry',
      editBuyEntry: 'Edit Buy Entry',
      buyDetails: 'Buy Details Page',
      transactionList: 'Diesel Buy Ledger',
      date: 'Transaction Date',
      receiptNo: 'Receipt Number',
      pricePerLiter: 'Price / Liter',
      volume: 'Volume / Liters',
      amountTaka: 'Amount',
      totalAmount: 'Total Amount',
      action: 'Action',
      save: 'Save',
      cancel: 'Cancel',
      uploadReceipt: 'Upload Receipt Image',
      receiptImage: 'Receipt Proof',
      noReceipt: 'No Proof Uploaded',
      downloadReceipt: 'Download Receipt PDF',
      profitFormula: 'Total Profit = Total Sell - Total Buy',
      allTransactions: 'All Transactions',
      filter: 'Filter',
      emptyState: 'No records found for this period.',
      watermark: 'FLEETPRO FUEL',
      successAdd: 'Fuel buy entry added successfully!',
      successUpdate: 'Fuel buy entry updated successfully!',
      successDelete: 'Fuel buy entry deleted successfully!',
      validationError: 'Please fill out all fields with valid numbers.',
      fileOption: 'Choose File or Drop Here',
      riyalLabel: 'Riyal',
      back: 'Back to Summary',
      totalBuyTitle: 'Total Buy',
      totalVolumeTitle: 'Total Volume',
      totalSellTitle: 'Total Sell',
      sellDetails: 'Sell Details Page',
      sellTransactionList: 'Diesel Sell Ledger'
    },
    bn: {
      fuelManagement: 'জ্বালানি ব্যবস্থাপনা',
      summary: 'জ্বালানি সামারি',
      totalBuy: 'Buy',
      totalSell: 'Sell',
      totalProfit: 'মোট লাভ (Total Profit)',
      qty: 'পরিমাণ',
      liters: 'লিটার',
      currentPrice: 'বর্তমান ডিজেলের দাম',
      buyEntries: 'ডিজেল ক্রয় হিস্ট্রি',
      addBuyEntry: 'নতুন ক্রয় এন্ট্রি',
      editBuyEntry: 'ক্রয় এন্ট্রি এডিট',
      buyDetails: 'Buy বিস্তারিত তথ্য',
      transactionList: 'ডিজেল ক্রয়ের লেজার',
      date: 'Transaction Date',
      receiptNo: 'Receipt Number',
      pricePerLiter: 'লিটার প্রতি দর',
      volume: 'Volume / Liters',
      amountTaka: 'Amount',
      totalAmount: 'মোট টাকা',
      action: 'অ্যাকশন',
      save: 'সংরক্ষণ করুন',
      cancel: 'বাতিল',
      uploadReceipt: 'রিসিপ্ট কপি আপলোড করুন',
      receiptImage: 'রিসিপ্ট প্রমাণ',
      noReceipt: 'কোনো প্রমাণ আপলোড করা হয়নি',
      downloadReceipt: 'রিসিপ্ট PDF ডাউনলোড করুন',
      profitFormula: 'মোট লাভ = মোট বিক্রয় - মোট ক্রয়',
      allTransactions: 'সকল ট্রানজেকশন',
      filter: 'ফিল্টার করুন',
      emptyState: 'এই সময়ের জন্য কোনো রেকর্ড পাওয়া যায়নি।',
      watermark: 'ফ্লিটপ্রো ফুয়েল',
      successAdd: 'নতুন জ্বালানি রেকর্ড সফলভাবে যুক্ত হয়েছে!',
      successUpdate: 'রেকর্ড সফলভাবে আপডেট করা হয়েছে!',
      successDelete: 'রেকর্ড সফলভাবে মুছে ফেলা হয়েছে!',
      validationError: 'দয়া করে সবগুলো ঘর সঠিক তথ্য দিয়ে পূরণ করুন।',
      fileOption: 'ফাইল সিলেক্ট বা ড্রপ করুন',
      riyalLabel: 'রিয়াল',
      back: 'সামারিতে ফিরে যান',
      totalBuyTitle: 'মোট ক্রয়',
      totalVolumeTitle: 'মোট পরিমাণ',
      totalSellTitle: 'মোট বিক্রয়',
      sellDetails: 'Sell বিস্তারিত তথ্য',
      sellTransactionList: 'ডিজেল বিক্রয়ের লেজার'
    }
  };

  const currT = localT[language === 'bn' ? 'bn' : 'en'];

  // Months lists
  const months = useMemo(() => {
    if (language === 'bn') {
      return [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
    }
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }, [language]);

  const years = useMemo(() => {
    const startYear = 2024;
    const currentYear = new Date().getFullYear();
    const list = [];
    for (let y = currentYear + 1; y >= startYear; y--) {
      list.push(y);
    }
    return list;
  }, []);

  // Filter States
  const selectedYear = globalFilterYear;
  const setSelectedYear = setGlobalFilterYear;
  const selectedMonth = globalFilterMonth;
  const setSelectedMonth = setGlobalFilterMonth;
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);

  // Navigation Subview
  const [currentSubview, setCurrentSubview] = useState<'LIST' | 'BUY_DETAILS' | 'SELL_DETAILS'>('LIST');

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formFuelId, setFormFuelId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formReceiptNo, setFormReceiptNo] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formVolume, setFormVolume] = useState<string>('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formReceiptImage, setFormReceiptImage] = useState<string>(''); // base64 string

  // Detail Modal States
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState<FuelPurchase | null>(null);

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current Diesel Price calculation based on latest chronological fuel entry
  const currentDieselPrice = useMemo(() => {
    if (!allFuels || allFuels.length === 0) return 2.5; // Default price fallback
    const sorted = [...allFuels].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[sorted.length - 1].price;
  }, [allFuels]);

  // Filter diesel buy entries for selected month and year
  const monthlyBuys = useMemo(() => {
    return (allFuels || []).filter(f => {
      const matchMonth = selectedMonth === 'ALL' ? true : Number(f.month) === Number(selectedMonth);
      const matchYear = selectedYear === 'ALL' ? true : Number(f.year) === Number(selectedYear);
      return matchMonth && matchYear;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allFuels, selectedMonth, selectedYear]);

  // Sum of Buy values
  const totalBuyAmount = useMemo(() => {
    return monthlyBuys.reduce((sum, f) => sum + f.totalAmount, 0);
  }, [monthlyBuys]);

  const totalBuyVolume = useMemo(() => {
    return monthlyBuys.reduce((sum, f) => sum + f.volume, 0);
  }, [monthlyBuys]);

  // Automated Sync: Fetch all diesel-related payments from store
  const dieselPayments = useMemo(() => {
    return (payments || []).filter(p => {
      const monthMatch = selectedMonth === 'ALL' ? true : Number(p.month) === Number(selectedMonth);
      const yearMatch = selectedYear === 'ALL' ? true : Number(p.year) === Number(selectedYear);
      const isDateMatch = monthMatch && yearMatch;
      if (!isDateMatch) return false;
      
      const category = String(p.category).toUpperCase();
      const subType = String(p.details?.subType || '').toUpperCase();
      
      return (
        category === 'TRIP DIESEL' || 
        subType === 'DIESELPRICE' || 
        subType === 'GENERATORDIESEL' || 
        subType === 'EXTRADIESEL'
      );
    });
  }, [payments, selectedMonth, selectedYear]);

  // Sell metrics
  const totalSellAmount = useMemo(() => {
    return dieselPayments.reduce((sum, p) => sum + p.amount, 0);
  }, [dieselPayments]);

  const totalSellVolume = useMemo(() => {
    if (currentDieselPrice <= 0) return 0;
    return totalSellAmount / currentDieselPrice;
  }, [totalSellAmount, currentDieselPrice]);

  // Profit calculation (Total Sell - Total Buy)
  const totalProfit = useMemo(() => {
    return totalSellAmount - totalBuyAmount;
  }, [totalSellAmount, totalBuyAmount]);

  // Auto calculate amount in real-time in the form
  const autoCalculatedTotal = useMemo(() => {
    return parseFloat(formAmount) || 0;
  }, [formAmount]);

  // Save / Update logic
  const handleSave = () => {
    const parsedPrice = parseFloat(formPrice);
    const parsedVolume = parseFloat(formVolume);
    const parsedAmount = parseFloat(formAmount);

    if (!formDate || !formReceiptNo || isNaN(parsedPrice) || isNaN(parsedVolume) || isNaN(parsedAmount) || parsedPrice <= 0 || parsedVolume <= 0 || parsedAmount <= 0) {
      showFeedback(currT.validationError, 'error');
      return;
    }

    const dateObj = new Date(formDate);
    const recordMonth = dateObj.getMonth() + 1;
    const recordYear = dateObj.getFullYear();

    const record: any = {
      id: formFuelId || `FUEL-${Date.now()}`,
      date: formDate,
      receiptNumber: formReceiptNo,
      price: parsedPrice,
      volume: parsedVolume,
      totalAmount: parsedAmount,
      userId: user?.id || 'unknown',
      month: recordMonth,
      year: recordYear,
      receiptImage: formReceiptImage || ''
    };

    if (formFuelId) {
      updateFuel(record);
      showFeedback(currT.successUpdate, 'success');
    } else {
      addFuel(record);
      showFeedback(currT.successAdd, 'success');
    }

    setIsFormOpen(false);
    setFormFuelId(null);
    setFormReceiptNo('');
    setFormPrice('');
    setFormVolume('');
    setFormAmount('');
    setFormReceiptImage('');
  };

  // Synchronized change handlers
  const handlePriceChange = (val: string) => {
    setFormPrice(val);
    const p = parseFloat(val) || 0;
    if (p > 0) {
      if (formVolume) {
        const v = parseFloat(formVolume) || 0;
        setFormAmount((p * v).toFixed(2));
      } else if (formAmount) {
        const a = parseFloat(formAmount) || 0;
        setFormVolume((a / p).toFixed(2));
      }
    }
  };

  const handleVolumeChange = (val: string) => {
    setFormVolume(val);
    const v = parseFloat(val) || 0;
    const p = parseFloat(formPrice) || 0;
    if (p > 0) {
      setFormAmount((p * v).toFixed(2));
    } else {
      setFormAmount('');
    }
  };

  const handleAmountChange = (val: string) => {
    setFormAmount(val);
    const a = parseFloat(val) || 0;
    const p = parseFloat(formPrice) || 0;
    if (p > 0) {
      setFormVolume((a / p).toFixed(2));
    } else {
      setFormVolume('');
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormFuelId(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormReceiptNo('');
    setFormPrice(currentDieselPrice.toString());
    setFormVolume('');
    setFormAmount('');
    setFormReceiptImage('');
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (fuel: FuelPurchase) => {
    setFormFuelId(fuel.id);
    setFormDate(fuel.date);
    setFormReceiptNo(fuel.receiptNumber);
    setFormPrice(fuel.price.toString());
    setFormVolume(fuel.volume.toString());
    setFormAmount((fuel.price * fuel.volume).toFixed(2));
    setFormReceiptImage((fuel as any).receiptImage || '');
    setIsFormOpen(true);
  };

  // Delete Action
  const handleDelete = (id: string) => {
    confirmAction(
      language === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই রেকর্ডটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this record?',
      () => {
        removeFuel(id);
        showFeedback(currT.successDelete, 'success');
        if (isDetailOpen) setIsDetailOpen(false);
      }
    );
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormReceiptImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Download PDF Receipt
  const downloadPDFReceipt = async (fuel: FuelPurchase) => {
    const doc = new jsPDF();
    const brand = 'FLEETPRO TRANSPORT SOLUTIONS';

    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('Helvetica', 'bold');
    doc.text(brand, 15, 18);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('DIESEL PURCHASE RECEIPT - OFFICIAL AUDIT LEDGER', 15, 26);

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.text('Transaction Details', 15, 50);

    const rows = [
      ['Receipt Ref Number:', fuel.receiptNumber],
      ['Transaction Date:', fuel.date],
      ['Price per Liter:', `${fuel.price.toFixed(2)} ${selectedCurrency}`],
      ['Volume Bought:', `${fuel.volume.toFixed(2)} Liters`],
      ['Total Cost:', `${fuel.totalAmount.toLocaleString()} ${selectedCurrency}`],
      ['Ledger Period:', `${months[fuel.month - 1]} ${fuel.year}`],
      ['Authorized Operator:', user?.name || 'Administrator']
    ];

    autoTable(doc, {
      startY: 55,
      head: [['Metric', 'Value']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
      styles: { fontSize: 11, cellPadding: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('This is a computer-generated transaction copy verified by FleetPro systems.', 15, finalY);
    doc.text('System Integrity Reference: ' + fuel.id, 15, finalY + 5);

    await downloadPdf(doc, `Receipt_${fuel.receiptNumber}.pdf`, showFeedback, language);
  };

  return (
    <div className="relative pb-6">
      
      {/* Page Watermark Background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none opacity-[0.015] dark:opacity-[0.01]">
        <div className="grid grid-cols-2 gap-16 p-10 rotate-[-15deg] scale-110">
          {Array.from({ length: 16 }).map((_, idx) => (
            <div key={idx} className="font-sans text-6xl font-black tracking-widest uppercase">
              {currT.watermark}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        
        {/* SUBVIEW 1: MAIN FUEL SUMMARY & HISTORY */}
        <div className="space-y-6">
          
          {/* MAIN SUMMARY CARD */}
          <div 
            className="relative overflow-hidden rounded-xl p-5 md:p-6 min-h-[175px] flex flex-col justify-between text-white shadow-2xl bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] border border-white/10 -mx-1"
          >
            {/* Visual accents */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px]"></div>

            <div className="relative z-10 space-y-4 flex-1 flex flex-col justify-between">
              {/* Top Row: Selectors & Title */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMonthSelectOpen(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 active:scale-95 shadow-lg cursor-pointer animate-fade-in"
                  >
                    <span>{selectedMonth === 'ALL' ? (language === 'bn' ? 'সব মাস' : 'All Month') : months[selectedMonth - 1]}</span>
                    <ChevronDown size={10} className="text-white/70" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsYearSelectOpen(true)}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10 backdrop-blur-md flex items-center gap-1.5 active:scale-95 shadow-lg cursor-pointer animate-fade-in"
                  >
                    <span>{selectedYear === 'ALL' ? (language === 'bn' ? 'সব বছর' : 'All Years') : selectedYear}</span>
                    <ChevronDown size={10} className="text-white/70" />
                  </button>
                </div>

                {/* Right side status */}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.8)] animate-pulse"></div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-orange-300">{currT.summary}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Balance Display Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCurrentSubview('BUY_DETAILS')}
                    className="relative overflow-hidden group/btn p-5 rounded-[10px] bg-white/10 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all text-left shadow-xl cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-blue-300 whitespace-nowrap">{currT.totalBuyTitle}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">{totalBuyAmount.toLocaleString()}</span>
                      <span className="text-[11px] font-black text-blue-400">{selectedCurrency}</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => setCurrentSubview('SELL_DETAILS')}
                    className="relative overflow-hidden group/btn p-5 rounded-[10px] bg-white/10 border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all text-left shadow-xl cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 whitespace-nowrap">{currT.totalSellTitle}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-md">{totalSellAmount.toLocaleString()}</span>
                      <span className="text-[11px] font-black text-emerald-400">{selectedCurrency}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* TRANSACTION HISTORY */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black text-text-main uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-orange-500" />
                {currT.buyEntries} ({monthlyBuys.length})
              </h3>
              <span className="text-[10px] font-bold text-text-muted">
                {selectedMonth === 'ALL' ? (language === 'bn' ? 'সব মাস' : 'All Month') : months[selectedMonth - 1]} {selectedYear === 'ALL' ? (language === 'bn' ? 'সব বছর' : 'All Years') : selectedYear}
              </span>
            </div>

            {monthlyBuys.length === 0 ? (
              <div className="bg-card-bg border border-border-main/50 rounded-[10px] text-center py-12 px-4 space-y-3 shadow-sm">
                <FileText className="w-10 h-10 mx-auto text-text-muted opacity-30" />
                <p className="text-xs text-text-muted font-bold">{currT.emptyState}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyBuys.map((f) => (
                  <div 
                    key={f.id}
                    onClick={() => {
                      setSelectedFuel(f);
                      setIsDetailOpen(true);
                    }}
                    className="bg-card-bg border border-border-main/50 hover:border-orange-500/50 rounded-[10px] p-4 flex items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-sm active:scale-[0.99] group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 group-hover:scale-110 transition-all">
                        <Droplets className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-text-main flex items-center gap-2">
                          <span className="font-mono text-text-muted select-all">#{f.receiptNumber}</span>
                        </p>
                        <p className="text-[10px] font-bold text-text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {f.date}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-0.5">
                      <p className="text-sm font-black text-orange-500">
                        {f.totalAmount.toLocaleString()} {selectedCurrency}
                      </p>
                      <p className="text-[10px] font-bold text-text-muted">
                        {f.volume.toFixed(1)} L • {f.price.toFixed(2)} /L
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* FLOATING ACTION BUTTON (FAB) FOR ADDING NEW ENTRY */}
      {currentSubview === 'LIST' && (
        <button 
          onClick={openAddModal}
          className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] right-6 z-40 bg-orange-500 hover:bg-orange-600 text-white rounded-full w-14 h-14 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border border-orange-400/20"
          id="fuel-add-fab"
          title={currT.addBuyEntry}
        >
          <Plus size={28} className="stroke-[3px]" />
        </button>
      )}

      {/* PORTAL FOR DETAILS VIEW SUBPAGE TRANSITION */}
      {createPortal(
        <>
          {currentSubview === 'BUY_DETAILS' && (
            <div 
              key="buy_details"
              className="fixed inset-0 z-[100] flex flex-col pb-[calc(76px+env(safe-area-inset-bottom))]"
              style={{ 
                backgroundColor: isNightMode ? "var(--page-bg-solid, #000000)" : '#f8fafc',
                background: isNightMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)')) 
              }}
            >
              {/* Header */}
              <div 
                className="flex-none shadow-sm safe-top transition-colors border-b border-black/5"
                style={{ 
                  background: 'var(--header-bg)'
                }}
              >
                <div className="h-16 flex items-center justify-between px-4 sm:px-6 md:px-8 max-w-4xl mx-auto w-full">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentSubview('LIST')}
                      className="p-2 rounded-lg transition-colors flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--header-text)' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--header-text)' }}>
                      {currT.buyDetails}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Scrollable Main Area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pb-32">
                <div className="relative z-10 max-w-4xl mx-auto space-y-6">

                  {/* TOP CARDS: Two cards side-by-side at the very top */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Card 1: Total Buy Amount */}
                    <div className="relative overflow-hidden bg-card-bg border border-border-main/60 rounded-[10px] p-5 shadow-sm">
                      
                      {/* Subtle Watermark */}
                      <div className="absolute right-2 bottom-2 text-text-muted opacity-[0.02] pointer-events-none select-none z-0">
                        <Receipt className="w-20 h-20 transform rotate-12" />
                      </div>

                      <div className="relative z-10 space-y-1">
                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">
                          {currT.totalBuyTitle}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-text-main leading-tight mt-2">
                          {totalBuyAmount.toLocaleString()}{' '}
                          <span className="text-xs font-medium text-text-muted">
                            {selectedCurrency}
                          </span>
                        </h3>
                      </div>
                    </div>

                    {/* Card 2: Total Volume */}
                    <div className="relative overflow-hidden bg-card-bg border border-border-main/60 rounded-[10px] p-5 shadow-sm">
                      
                      {/* Subtle Watermark */}
                      <div className="absolute right-2 bottom-2 text-text-muted opacity-[0.02] pointer-events-none select-none z-0">
                        <Droplets className="w-20 h-20 transform rotate-12" />
                      </div>

                      <div className="relative z-10 space-y-1">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">
                          {currT.totalVolumeTitle}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-text-main leading-tight mt-2">
                          {totalBuyVolume.toFixed(2)}{' '}
                          <span className="text-xs font-medium text-text-muted">
                            {currT.liters}
                          </span>
                        </h3>
                      </div>
                    </div>

                  </div>

                  {/* TRANSACTIONS LIST */}
                  <div className="space-y-3">
                    <div className="px-1">
                      <h3 className="text-xs font-black text-text-main uppercase tracking-wider">
                        {currT.transactionList}
                      </h3>
                    </div>

                    {monthlyBuys.length === 0 ? (
                      <div className="bg-card-bg border border-border-main/50 rounded-[10px] text-center py-12 px-4 shadow-sm">
                        <FileText className="w-10 h-10 mx-auto text-text-muted opacity-30" />
                        <p className="text-xs text-text-muted font-bold">{currT.emptyState}</p>
                      </div>
                    ) : (
                      <div className="bg-card-bg border border-border-main/60 rounded-[10px] divide-y divide-border-main/20 overflow-hidden shadow-sm">
                        {monthlyBuys.map((f) => (
                          <div 
                            key={f.id} 
                            onClick={() => {
                              setSelectedFuel(f);
                              setIsDetailOpen(true);
                            }}
                            className="p-4 hover:bg-background-main/30 cursor-pointer transition-all flex justify-between items-center group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Receipt className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-text-main font-mono">
                                  #{f.receiptNumber}
                                </p>
                                <p className="text-[10px] font-semibold text-text-muted mt-0.5">
                                  {f.date}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-black text-blue-500">
                                {f.totalAmount.toLocaleString()} {selectedCurrency}
                              </p>
                              <p className="text-[10px] font-bold text-text-muted mt-0.5">
                                {f.volume.toFixed(1)} L × {f.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Sticky/Fixed Footer Above Bottom Navigation Bar */}
              <div className="flex-none p-4 border-t border-border-main/40 bg-card-bg/95 backdrop-blur-md shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                <div className="max-w-4xl mx-auto">
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] border border-white/10 rounded-2xl p-4 text-white shadow-lg">
                    {/* Visual accents */}
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-[40px]"></div>
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${totalProfit >= 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]'}`}></div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/70 block">{currT.totalProfit}</span>
                          <span className="text-[9px] text-white/50 font-medium">{currT.profitFormula}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black tracking-tight leading-none">
                          {totalProfit.toLocaleString()}{' '}
                          <span className={`text-xs font-black ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{selectedCurrency}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </>,
        document.body
      ) /* END OF BUY_DETAILS PORTAL */}

      {/* PORTAL FOR SELL DETAILS VIEW SUBPAGE TRANSITION */}
      {createPortal(
        <>
          {currentSubview === 'SELL_DETAILS' && (
            <div 
              key="sell_details"
              className="fixed inset-0 z-[100] flex flex-col pb-[calc(76px+env(safe-area-inset-bottom))]"
              style={{ 
                backgroundColor: isNightMode ? "var(--page-bg-solid, #000000)" : '#f8fafc',
                background: isNightMode ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--theme-bg)')) 
              }}
            >
              {/* Header */}
              <div 
                className="flex-none shadow-sm safe-top transition-colors border-b border-black/5"
                style={{ 
                  background: 'var(--header-bg)'
                }}
              >
                <div className="h-16 flex items-center justify-between px-4 sm:px-6 md:px-8 max-w-4xl mx-auto w-full">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentSubview('LIST')}
                      className="p-2 rounded-lg transition-colors flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--header-text)' }}
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: 'var(--header-text)' }}>
                      {currT.sellDetails}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Scrollable Main Area */}
              <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 pb-32">
                <div className="relative z-10 max-w-4xl mx-auto space-y-6">

                  {/* TOP CARDS: Two cards side-by-side at the very top */}
                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Card 1: Total Sell Amount */}
                    <div className="relative overflow-hidden bg-card-bg border border-border-main/60 rounded-[10px] p-5 shadow-sm">
                      {/* Subtle Watermark */}
                      <div className="absolute right-2 bottom-2 text-text-muted opacity-[0.02] pointer-events-none select-none z-0">
                        <Receipt className="w-20 h-20 transform rotate-12" />
                      </div>

                      <div className="relative z-10 space-y-1">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">
                          {currT.totalSellTitle}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-text-main leading-tight mt-2">
                          {totalSellAmount.toLocaleString()}{' '}
                          <span className="text-xs font-medium text-text-muted">
                            {selectedCurrency}
                          </span>
                        </h3>
                      </div>
                    </div>

                    {/* Card 2: Total Volume */}
                    <div className="relative overflow-hidden bg-card-bg border border-border-main/60 rounded-[10px] p-5 shadow-sm">
                      {/* Subtle Watermark */}
                      <div className="absolute right-2 bottom-2 text-text-muted opacity-[0.02] pointer-events-none select-none z-0">
                        <Droplets className="w-20 h-20 transform rotate-12" />
                      </div>

                      <div className="relative z-10 space-y-1">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">
                          {currT.totalVolumeTitle}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-text-main leading-tight mt-2">
                          {totalSellVolume.toFixed(2)}{' '}
                          <span className="text-xs font-medium text-text-muted">
                            {currT.liters}
                          </span>
                        </h3>
                      </div>
                    </div>

                  </div>

                  {/* TRANSACTIONS LIST */}
                  <div className="space-y-3">
                    <div className="px-1">
                      <h3 className="text-xs font-black text-text-main uppercase tracking-wider">
                        {currT.sellTransactionList}
                      </h3>
                    </div>

                    {dieselPayments.length === 0 ? (
                      <div className="bg-card-bg border border-border-main/50 rounded-[10px] text-center py-12 px-4 shadow-sm">
                        <FileText className="w-10 h-10 mx-auto text-text-muted opacity-30" />
                        <p className="text-xs text-text-muted font-bold">{currT.emptyState}</p>
                      </div>
                    ) : (
                      <div className="bg-card-bg border border-border-main/60 rounded-[10px] divide-y divide-border-main/20 overflow-hidden shadow-sm">
                        {dieselPayments.map((p) => {
                          const estimatedVolume = currentDieselPrice > 0 ? p.amount / currentDieselPrice : 0;
                          return (
                            <div 
                              key={p.id} 
                              className="p-4 hover:bg-background-main/30 transition-all flex justify-between items-center group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                  <Receipt className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-text-main font-mono">
                                    #{p.transactionId || 'N/A'}
                                  </p>
                                  <p className="text-[10px] font-semibold text-text-muted mt-0.5 flex items-center gap-1">
                                    <span>{p.date}</span>
                                    {p.time && <span>• {p.time}</span>}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className="text-sm font-black text-emerald-500">
                                  {p.amount.toLocaleString()} {selectedCurrency}
                                </p>
                                <p className="text-[10px] font-bold text-text-muted mt-0.5">
                                  {estimatedVolume.toFixed(1)} L × {currentDieselPrice.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>
          )}
        </>,
        document.body
      ) /* END OF SELL_DETAILS PORTAL */}

      {/* MODAL 1: ADD / EDIT BUY ENTRY POP-UP */}
      {createPortal(
        <>
          {isFormOpen && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
              
              {/* Backdrop */}
              <div 
                
                
                
                onClick={() => setIsFormOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

              {/* Modal Content */}
              <div 
                
                
                
                className="relative w-full max-w-md bg-card-bg border border-border-main/80 rounded-3xl overflow-hidden shadow-2xl z-10"
              >
              
              {/* HEADER with beautiful gradient background color */}
              <div className="px-6 py-5 bg-gradient-to-r from-orange-500 to-amber-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-white animate-pulse" />
                  <h3 className="text-base font-black tracking-wide">
                    {formFuelId ? currT.editBuyEntry : currT.addBuyEntry}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                
                {/* ROW 1: Transaction Date & Receipt Number (Side-by-side) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <InputField
                    label={currT.date}
                    name="date"
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    icon={<Calendar size={14} />}
                  />

                  {/* Receipt Number */}
                  <InputField
                    label={currT.receiptNo}
                    name="receiptNo"
                    type="text"
                    value={formReceiptNo}
                    onChange={(e) => setFormReceiptNo(e.target.value)}
                    icon={<Receipt size={14} />}
                  />
                </div>

                {/* Price per Liter */}
                <InputField
                  label={currT.pricePerLiter}
                  name="pricePerLiter"
                  type="number"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  icon={<Fuel size={14} />}
                />

                {/* ROW 2: Volume & Amount (Side-by-side) */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Volume (Liters) */}
                  <InputField
                    label={currT.volume}
                    name="volume"
                    type="number"
                    step="0.01"
                    value={formVolume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    icon={<Droplets size={14} />}
                  />

                  {/* Amount */}
                  <InputField
                    label={currT.amountTaka}
                    name="amountTaka"
                    type="number"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    icon={<DollarSign size={14} />}
                  />
                </div>

                {/* AUTO CALCULATION SHOWCASE */}
                <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex justify-between items-center">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                    {currT.totalAmount}:
                  </span>
                  <span className="text-base font-black text-orange-500 select-all">
                    {autoCalculatedTotal.toLocaleString()} {selectedCurrency}
                  </span>
                </div>

                {/* File/Receipt image input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                    {currT.uploadReceipt}
                  </label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border-main/50 hover:border-orange-500 rounded-2xl p-5 text-center cursor-pointer transition-all hover:bg-orange-500/5 flex flex-col items-center justify-center gap-1.5 group"
                  >
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    {formReceiptImage ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md">
                        <img 
                          src={formReceiptImage} 
                          alt="Receipt proof" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <span className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold">
                            Change Image
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-text-muted opacity-50 group-hover:text-orange-500 transition-all" />
                        <p className="text-[11px] font-bold text-text-main">{currT.fileOption}</p>
                        <p className="text-[9px] text-text-muted">{currT.watermark} receipt snapshot</p>
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Form Footer Actions */}
              <div className="px-6 py-4 border-t border-border-main/50 bg-background-main/50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 font-bold rounded-xl text-xs transition-colors active:scale-95"
                >
                  {currT.cancel}
                </button>
                <button 
                  onClick={handleSave}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
                >
                  {currT.save}
                </button>
              </div>

            </div>
          </div>
          )}
        </>,
        document.body
      )}

      {/* MODAL 2: TRANSACTION DETAIL POP-UP */}
      {createPortal(
        <>
          {isDetailOpen && selectedFuel && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
              
              {/* Backdrop */}
              <div 
                
                
                
                onClick={() => setIsDetailOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Modal Content */}
              <div 
                
                
                
                className="relative w-full max-w-md bg-card-bg border border-border-main/80 rounded-[10px] overflow-hidden shadow-2xl z-10"
              >
                
                {/* HEADER with beautiful blue gradient background color */}
                <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-white animate-pulse" />
                    <h3 className="text-base font-black tracking-wide">
                      {currT.receiptNo}: {selectedFuel.receiptNumber}
                    </h3>
                  </div>
                  
                  {/* Header Actions: Close / X Icon */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setIsDetailOpen(false)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Detail Body */}
                <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
                  
                  {/* Specific items grid details */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="bg-background-main p-3 rounded-[8px] border border-border-main/20">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">{currT.date}</p>
                      <p className="text-xs font-black text-text-main mt-1">{selectedFuel.date}</p>
                    </div>
                    <div className="bg-background-main p-3 rounded-[8px] border border-border-main/20">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">{currT.pricePerLiter}</p>
                      <p className="text-xs font-black text-text-main mt-1">{selectedFuel.price.toFixed(2)} {selectedCurrency}/L</p>
                    </div>
                    <div className="bg-background-main p-3 rounded-[8px] border border-border-main/20">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">{currT.volume}</p>
                      <p className="text-xs font-black text-text-main mt-1">{selectedFuel.volume.toFixed(1)} Liters</p>
                    </div>
                    <div className="bg-background-main p-3 rounded-[8px] border border-border-main/20">
                      <p className="text-[9px] font-black text-text-muted uppercase tracking-wider">{currT.totalAmount}</p>
                      <p className="text-xs font-black text-orange-500 mt-1">{selectedFuel.totalAmount.toLocaleString()} {selectedCurrency}</p>
                    </div>
                  </div>

                  {/* Receipt snap proof display */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">
                      {currT.receiptImage}
                    </p>

                    {selectedFuel.receiptImage ? (
                      <div className="w-full aspect-video rounded-[8px] overflow-hidden shadow-md border border-border-main/30 bg-background-main flex items-center justify-center">
                        <img 
                          src={selectedFuel.receiptImage} 
                          alt="Scanned diesel receipt proof document" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-[8px] border border-border-main/20 flex flex-col items-center justify-center gap-1.5 text-text-muted py-6 bg-background-main/30">
                        <FileText className="w-6 h-6 opacity-45" />
                        <p className="text-[10px] font-black">{currT.noReceipt}</p>
                      </div>
                    )}
                  </div>

                </div>

                {/* DETAIL FOOTER */}
                <div className="px-6 py-5 border-t border-border-main/50 bg-background-main/50 flex items-center justify-around gap-4">
                  
                  {/* Edit Icon Button */}
                  <button 
                    onClick={() => {
                      setIsDetailOpen(false);
                      openEditModal(selectedFuel);
                    }}
                    className="p-3.5 rounded-full bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center border border-blue-500/20"
                    title="Edit Entry"
                  >
                    <Edit2 className="w-6 h-6" />
                  </button>

                  {/* Delete Icon Button */}
                  <button 
                    onClick={() => handleDelete(selectedFuel.id)}
                    className="p-3.5 rounded-full bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center border border-rose-500/20"
                    title="Delete Entry"
                  >
                    <Trash className="w-6 h-6" />
                  </button>

                  {/* Download Icon Button */}
                  <button 
                    onClick={() => downloadPDFReceipt(selectedFuel)}
                    className="p-3.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-all shadow-md active:scale-95 flex items-center justify-center border border-emerald-500/20"
                    title="Download PDF"
                  >
                    <Download className="w-6 h-6" />
                  </button>

                </div>

              </div>
            </div>
          )}
        </>,
        document.body
      )}

      <GlobalFullscreenSelect
        isOpen={isMonthSelectOpen}
        onClose={() => setIsMonthSelectOpen(false)}
        onSelect={(val) => {
          setSelectedMonth(val === 'ALL' ? 'ALL' : parseInt(val));
          setIsMonthSelectOpen(false);
        }}
        options={[
          { label: language === 'bn' ? 'সব মাস' : 'All Month', value: 'ALL' },
          ...months.map((m, idx) => ({
            label: m,
            value: String(idx + 1)
          }))
        ]}
        title={language === 'bn' ? 'মাস নির্বাচন করুন' : 'Select Month'}
        selectedValue={String(selectedMonth)}
        searchable={false}
      />

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
        title={language === 'bn' ? 'বছর নির্বাচন করুন' : 'Select Year'}
        selectedValue={String(selectedYear)}
        searchable={false}
      />

    </div>
  );
}
