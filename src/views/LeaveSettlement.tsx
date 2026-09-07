import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { 
  CheckCircle, ArrowLeft, CalendarCheck, TrendingUp, X, Plus, Wallet, FileText, Download, Briefcase, User, Calendar, CreditCard, Trash2
} from 'lucide-react';

import { downloadPdf } from '../utils/fileUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getFirebaseCollection, saveFirebaseDoc, deleteFirebaseDoc } from '@/services/firebase';
import { PaymentManager } from '../services/PaymentManager';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { FileOpener } from '@capacitor-community/file-opener';
import { Share } from '@capacitor/share';

type CartItemCategory = 'Basic Salary' | 'Commission' | 'Leave Salary' | 'Bonus' | 'Friday' | 'Advance' | 'Deduction' | 'Others';

interface CartItem {
  id: string; 
  category: CartItemCategory;
  title: string;          
  subtitle: string;
  sourceName?: string;
  amount: number;         
  isDeduction?: boolean;
  
  isDatabaseItem?: boolean;
  fileId?: string;
  month?: number;
  year?: number;
  rawItems?: any[];       
}

export default function LeaveSettlement() {
  const { user, users, language, setView, currencies, selectedCurrency, addPayment, trips, monthlyFiles, payments, isNightMode, confirmAction, showFeedback } = useStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  
  const currency = React.useMemo(() => {
    return currencies?.find((c: any) => c.code === selectedCurrency) || currencies?.[0] || { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal' };
  }, [currencies, selectedCurrency]);
  const isAdmin = user?.role === 'ADMIN';

  // Core Form states
  const [employeeId, setEmployeeId] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Selection States
  const [selectedCategory, setSelectedCategory] = useState<CartItemCategory>('Basic Salary');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  
  // Manual Input States
  const [manualAmount, setManualAmount] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  
  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeSettlementObj, setActiveSettlementObj] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'NEW' | 'ARCHIVE'>('NEW');
  const [archiveItems, setArchiveItems] = useState<any[]>([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);

  // Fetch Archive
  useEffect(() => {
    if (activeTab === 'ARCHIVE' && employeeId) {
      setIsLoadingArchive(true);
      const subPath = `users/${employeeId}/settlements`;
      getFirebaseCollection(subPath).then((data) => {
        // Sort descending by date
        setArchiveItems((data || []).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }).catch(e => {
         console.warn("Failed to fetch archive", e);
      }).finally(() => {
        setIsLoadingArchive(false);
      });
    }
  }, [activeTab, employeeId]);

  const employeeUsers = useMemo(() => {
    return users?.filter((u: any) => u.role === 'USER' || u.role === 'ADMIN') || [];
  }, [users]);

  useEffect(() => {
    if (!isAdmin && user) {
      setEmployeeId(user.id);
      setEmployeeName(user.name);
      if (user.companyName) setCompanyName(user.companyName);
    }
  }, [isAdmin, user]);

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id);
    const selected = employeeUsers.find((u: any) => u.id === id);
    if (selected) {
      setEmployeeName(selected.name);
      if (selected.companyName) setCompanyName(selected.companyName);
    } else {
      setEmployeeName('');
    }
    setCartItems([]);
  };

  const empTrips = useMemo(() => trips.filter(t => t.userId === employeeId), [trips, employeeId]);
  const empFiles = useMemo(() => monthlyFiles.filter(f => f.userId === employeeId), [monthlyFiles, employeeId]);
  const empPayments = useMemo(() => payments.filter(p => p.userId === employeeId), [payments, employeeId]);

  const availableGroups = useMemo(() => {
    if (!employeeId) return [];
    if (selectedCategory === 'Commission') {
        const pending = PaymentManager.getPendingDues(empTrips, empFiles, empPayments, 'Commission');
        return pending;
    } else if (selectedCategory === 'Basic Salary') {
        const pending = PaymentManager.getPendingDues(empTrips, empFiles, empPayments, 'SALARY');
        return pending;
    } else if (selectedCategory === 'Friday') {
        const pending = PaymentManager.getPendingDues(empTrips, empFiles, empPayments, 'Friday');
        return pending;
    }
    return [];
  }, [employeeId, selectedCategory, empTrips, empFiles, empPayments]);

  const advanceData = useMemo(() => {
    if (!employeeId) return null;
    const totalAdvance = empPayments
      .filter(p => p.type === 'INCOME' && p.category === 'ADVANCE' && p.status === 'RECEIVED')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
    const paidAdvance = empPayments
      .filter(p => p.type === 'DEDUCTION' && (p.category === 'ADVANCE DEDUCTION' || p.category === 'ADVANCE' || p.category === 'ADVANCE_DEDUCTION'))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
    const remaining = Math.max(0, totalAdvance - paidAdvance);
    
    if (totalAdvance === 0) return null;
    return { totalAdvance, paidAdvance, remaining };
  }, [empPayments, employeeId]);

  const toggleAdvance = () => {
     if (!advanceData || advanceData.remaining <= 0) return;
     const cartId = `ADVANCE-DEDUCTION-${employeeId}`;
     const exists = cartItems.find(c => c.id === cartId);
     if (exists) {
        removeCartItem(cartId);
     } else {
        const newItem: CartItem = {
          id: cartId,
          category: 'Advance',
          title: `Advance Deduction`,
          subtitle: `Company Advance Restitution`,
          sourceName: companyName || 'Company',
          amount: advanceData.remaining,
          isDeduction: true,
          isDatabaseItem: true
        };
        setCartItems([...cartItems, newItem]);
     }
  };

  const handleAddManualToCart = () => {
    if (!manualAmount || Number(manualAmount) <= 0) return;
    
    const isDeduction = selectedCategory === 'Deduction';
    
    const newItem: CartItem = {
      id: `${selectedCategory}-${Date.now()}`,
      category: selectedCategory,
      title: manualTitle || (isDeduction ? 'Deduction' : `${selectedCategory} Payment`),
      subtitle: `Manual Entry`,
      sourceName: manualTitle ? (companyName ? `${companyName} • ${manualTitle}` : manualTitle) : (companyName || 'General System'),
      amount: Number(manualAmount),
      isDatabaseItem: false,
      isDeduction
    };
    
    setCartItems([...cartItems, newItem]);
    setManualAmount('');
    setManualTitle('');
  };

  const toggleDatabaseGroup = (group: any, categoryName: string) => {
    const catData = group.categories.find((c: any) => (c.name || '').toUpperCase() === categoryName.toUpperCase());
    if (!catData || catData.totalPending <= 0) return;

    const cartId = `${group.fileId}-${categoryName}`;
    const exists = cartItems.find(c => c.id === cartId);
    
    if (exists) {
      setCartItems(cartItems.filter(c => c.id !== cartId));
    } else {
      const monthName = new Date(0, group.month - 1).toLocaleString('default', { month: 'long' });
      const firstItem = catData.items[0];
      const sourceName = firstItem?.companyName || companyName || 'General System';

      const newItem: CartItem = {
        id: cartId,
        category: selectedCategory,
        title: `${selectedCategory} - ${monthName} ${group.year}`,
        subtitle: `Total Items: ${catData.items.length}`,
        sourceName: sourceName,
        amount: catData.totalPending,
        isDatabaseItem: true,
        fileId: group.fileId,
        month: group.month,
        year: group.year,
        rawItems: catData.items
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const removeCartItem = (id: string) => {
    setCartItems(cartItems.filter(c => c.id !== id));
  };

  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      return sum + (item.isDeduction ? -item.amount : item.amount);
    }, 0);
  }, [cartItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !employeeName) {
      alert(language === 'bn' ? 'দয়া করে কর্মচারী নির্বাচন করুন।' : 'Please select an employee.');
      return;
    }
    if (cartItems.length === 0) {
      alert(language === 'bn' ? 'সেটেলমেন্ট করার জন্য কোনো আইটেম সিলেক্ট করা হয়নি।' : 'No items selected for settlement.');
      return;
    }

    setIsSubmitting(true);
    try {
      const settlementId = `SET-${Date.now()}`;
      
      const settlementData = {
        id: settlementId,
        userId: employeeId,
        employeeName,
        companyName: companyName || 'N/A',
        totalPaidAmount: totalCartAmount,
        settlementDate,
        itemsCount: cartItems.length,
        status: 'COMPLETED' as const,
        createdAt: new Date().toISOString(),
        cartItems: cartItems
      };

      const subPath = `users/${employeeId}/settlements`;
      await saveFirebaseDoc(subPath, settlementId, settlementData);

      const dateParts = settlementDate.split('-');
      const sYear = Number(dateParts[0]) || new Date().getFullYear();
      const sMonth = Number(dateParts[1]) || (new Date().getMonth() + 1);

      for (const item of cartItems) {
        const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        
        let paymentCategory = 'OTHERS';
        if (item.category === 'Commission') paymentCategory = 'COMMISSION';
        else if (item.category === 'Basic Salary' || item.category === 'Leave Salary') paymentCategory = 'SALARY';
        else if (item.category === 'Bonus') paymentCategory = 'BONUS';

        const pendingItemsMap: Record<string, number> = {};
        if (item.isDatabaseItem && item.rawItems) {
           item.rawItems.forEach(ri => {
             pendingItemsMap[ri.id] = ri.pending;
           });
        }

        const paymentDoc = {
          id: paymentId,
          transactionId: paymentId,
          amount: item.amount,
          date: settlementDate,
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          type: 'INCOME' as const,
          category: paymentCategory,
          method: 'CASH' as const,
          details: {
            serviceName: item.title,
            companyName: companyName || 'N/A',
            userName: employeeName,
            userId: employeeId,
            ...(Object.keys(pendingItemsMap).length > 0 ? { pendingItems: pendingItemsMap } : {})
          },
          month: item.month || sMonth,
          year: item.year || sYear,
          status: 'RECEIVED' as const,
          userId: employeeId
        };
        addPayment(paymentDoc);
      }

      setLastSubmittedId(settlementId);
      setActiveSettlementObj(settlementData);
      const doc = generatePDFDoc(settlementData);
      if (doc) {
        const blob = doc.output('blob');
        setPreviewUrl(URL.createObjectURL(blob));
      }
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Error saving settlement:', error);
      alert(language === 'bn' ? 'সেটেলমেন্ট ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।' : 'Settlement submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDFDoc = (dataObj?: any) => {
    const empName = dataObj?.employeeName || employeeName;
    const cmpName = dataObj?.companyName || companyName;
    const sDate = dataObj?.settlementDate || settlementDate;
    const items = dataObj?.cartItems || cartItems;
    const totalAmount = dataObj?.totalPaidAmount || totalCartAmount;
    const empId = dataObj?.userId || employeeId;

    if (!empName) return null;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(32, 126, 74); 
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('FLEETPRO TRANSPORT MANAGER', 15, 12);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Remittance & Settlement Receipt', 15, 18);

    const todayStr = new Date(sDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Date: ${todayStr}`, pageWidth - 15, 15, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Name:', 17, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(empName, 55, 40);

    doc.setFont('helvetica', 'bold');
    doc.text('Employee UID:', 17, 47);
    doc.setFont('helvetica', 'normal');
    doc.text(empId.substring(0, 10).toUpperCase(), 55, 47);

    doc.setFont('helvetica', 'bold');
    doc.text('Company Name:', 17, 54);
    doc.setFont('helvetica', 'normal');
    doc.text(cmpName || 'N/A', 55, 54);

    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.3);
    doc.line(15, 62, pageWidth - 15, 62);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    doc.text('Settlement Summary (Cart Breakdown)', 15, 72);

    const tableRows = items.map((item: any, index: number) => [
      `${index + 1}.`,
      item.title,
      item.category,
      `${item.isDeduction ? '-' : ''}${currency.code} ${item.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 76,
      head: [['#', 'Description', 'Category', 'Amount']],
      body: tableRows,
      margin: { left: 15, right: 15 },
      theme: 'grid',
      headStyles: {
        fillColor: [32, 126, 74],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 90 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40, halign: 'right' }
      },
      foot: [
        ['', 'Grand Total Paid Out', '', `${currency.code} ${totalAmount.toLocaleString()}`]
      ],
      footStyles: {
        fillColor: [230, 244, 234],
        textColor: [22, 101, 52],
        fontStyle: 'bold',
        fontSize: 11
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 140;

    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'italic');
    doc.text('This matches the automated real-time My Income financial registry.', 15, finalY + 15);

    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.4);
    doc.line(15, finalY + 45, 65, finalY + 45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(31, 41, 55);
    doc.text("Employee Signature", 40, finalY + 50, { align: 'center' });

    doc.line(pageWidth - 65, finalY + 45, pageWidth - 15, finalY + 45);
    doc.text("Authorized Admin", pageWidth - 40, finalY + 50, { align: 'center' });

    return doc;
  };

  const downloadPDFReport = async () => {
    const doc = generatePDFDoc(activeSettlementObj);
    if (!doc) return;
    
    const empName = activeSettlementObj?.employeeName || employeeName || 'Employee';
    const fileName = `Settlement-${empName.replace(/\s+/g, '-')}-${Date.now()}.pdf`;

    await downloadPdf(doc, fileName, showFeedback, language);
  };

  const handleOpenPDF = async () => {
    try {
      const doc = generatePDFDoc(activeSettlementObj);
      if (!doc) {
        alert(language === 'bn' ? 'পিডিএফ ফাইল তৈরি করা যায়নি।' : 'Could not generate PDF file.');
        return;
      }

      const empName = activeSettlementObj?.employeeName || employeeName || 'Employee';
      const tempFileName = `Settlement_${empName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

      if (Capacitor.isNativePlatform()) {
        try {
          const pdfOutput = doc.output('datauristring') as string;
          const base64Data = pdfOutput.split(',')[1];
          
          let fileUri = '';

          try {
            // Write to Cache directory (less permission issues)
            const result = await Filesystem.writeFile({
              path: tempFileName,
              data: base64Data,
              directory: Directory.Cache,
            });
            fileUri = result.uri;
          } catch (writeErr: any) {
            console.error("Write cache error:", writeErr);
            // Fallback to Documents directory
            const result = await Filesystem.writeFile({
              path: tempFileName,
              data: base64Data,
              directory: Directory.Documents,
            });
            fileUri = result.uri;
          }

          try {
            // Instead of FileOpener which has deep strict scoped-storage requirements on Android 11+, 
            // we use Share API. The Share sheet natively provides "Drive PDF Viewer", "Print", "Save to Files".
            await Share.share({
              title: tempFileName,
              text: 'Here is the Leave & Settlement PDF document.',
              url: fileUri,
              dialogTitle: 'Open or Share PDF'
            });
          } catch (shareErr: any) {
            console.error("Share Error:", shareErr);
            // Fallback to FileOpener if Share fails
            try {
              await FileOpener.open({
                filePath: fileUri,
                contentType: 'application/pdf',
                openWithDefault: false,
              });
            } catch (openErr: any) {
              alert(`Error opening PDF: ${openErr.message || 'Unknown'}`);
            }
          }
        } catch (err: any) {
          console.error('File saving or opening error:', err);
          alert(`Error processing PDF: ${err.message || 'Unknown'}`);
        }
      } else {
        const targetUrl = previewUrl || URL.createObjectURL(doc.output('blob'));
        const newWindow = window.open(targetUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.warn('Popup blocked, falling back to direct download');
          await downloadPdf(doc, tempFileName, showFeedback, language);
        }
      }
    } catch (criticalErr: any) {
       alert(`Critical Error generating PDF: ${criticalErr?.message || criticalErr}`);
    }
  };

  const viewArchivePDF = (archivedObj: any) => {
    const doc = generatePDFDoc(archivedObj);
    if (doc) {
      const blob = doc.output('blob');
      setPreviewUrl(URL.createObjectURL(blob));
      setActiveSettlementObj(archivedObj);
      setSubmitSuccess(true);
    }
  };

  const deleteArchiveItem = async (itemId: string) => {
    confirmAction(
      language === 'bn' ? 'আর্কাইভটি নিশ্চিত মুছে ফেলতে চান?' : 'Are you sure you want to delete this settlement archive?',
      async () => {
        try {
          const subPath = `users/${employeeId}/settlements`;
          await deleteFirebaseDoc(subPath, itemId);
          setArchiveItems(prev => prev.filter(i => i.id !== itemId));
          showFeedback(language === 'bn' ? 'আর্কাইভটি সফলভাবে মুছে ফেলা হয়েছে' : 'Archive deleted successfully');
        } catch (e) {
          console.error('Delete error', e);
          showFeedback(language === 'bn' ? 'ডিলিট করতে ব্যর্থ হয়েছে' : 'Failed to delete');
        }
      }
    );
  };

  const resetForm = () => {
    if (isAdmin) {
      setEmployeeId('');
      setEmployeeName('');
      setCompanyName('');
    }
    setCartItems([]);
    setSubmitSuccess(false);
    setLastSubmittedId(null);
    setPreviewUrl(null);
    setActiveSettlementObj(null);
  };

  const categoryOptions: CartItemCategory[] = ['Basic Salary', 'Commission', 'Friday', 'Leave Salary', 'Bonus', 'Advance', 'Deduction', 'Others'];

  return (
    <div className="w-full">
      <>
        {!submitSuccess ? (
          <div    className="space-y-3 sm:space-y-4">
            
            {/* Tabs */}
            <div className="relative flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-gray-200/50 dark:border-zinc-700 w-full mb-3 h-10 select-none items-center">
              <button 
                onClick={() => setActiveTab('NEW')} 
                className={`relative z-10 flex-1 h-8 text-[11px] sm:text-xs font-black rounded-lg transition-colors flex items-center justify-center outline-none ${activeTab === 'NEW' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
              >
                <span className="relative z-10">New Settlement</span>
                {activeTab === 'NEW' && (
                  <div 
                     
                    className="absolute inset-0 bg-emerald-500 rounded-lg shadow-sm z-0"
                    
                  />
                )}
              </button>
              <button 
                onClick={() => setActiveTab('ARCHIVE')} 
                className={`relative z-10 flex-1 h-8 text-[11px] sm:text-xs font-black rounded-lg transition-colors flex items-center justify-center outline-none ${activeTab === 'ARCHIVE' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'}`}
              >
                <span className="relative z-10">History/Archive</span>
                {activeTab === 'ARCHIVE' && (
                  <div 
                     
                    className="absolute inset-0 bg-emerald-500 rounded-lg shadow-sm z-0"
                    
                  />
                )}
              </button>
            </div>

            {/* Top Selection */}
            <div className="bg-white dark:bg-zinc-800/95 rounded-[8px] p-5 sm:p-6 shadow-md border border-slate-200/80 dark:border-zinc-700">
              <div className={`grid grid-cols-1 ${activeTab === 'NEW' ? 'md:grid-cols-2' : ''} gap-3 sm:gap-4`}>
                <div>
                  <label className="block text-[11px] font-black text-black dark:text-white mb-1.5 uppercase tracking-wider">
                    {language === 'bn' ? 'কর্মচারী' : 'Employee'} <span className="text-red-500">*</span>
                  </label>
                  {isAdmin ? (
                    <div className="relative">
                      <select
                        value={employeeId}
                        onChange={(e) => handleEmployeeChange(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-zinc-700/50 text-black dark:text-white rounded-xl px-4 py-3.5 border border-gray-200 dark:border-zinc-700 font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none"
                      >
                        <option value="">-- Choose Employee --</option>
                        {employeeUsers.map((emp: any) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                      <User size={16} className="absolute right-4 top-4 text-gray-500 dark:text-white/60 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex items-center w-full bg-gray-100 dark:bg-zinc-700/30 text-black dark:text-white rounded-xl px-4 py-3 border border-gray-200 dark:border-zinc-700 font-bold opacity-80 gap-2">
                      <User size={16} className="text-emerald-500" />
                      <span>{employeeName}</span>
                    </div>
                  )}
                </div>

                {activeTab === 'NEW' && (
                  <div>
                    <label className="block text-[11px] font-black text-black dark:text-white mb-1.5 uppercase tracking-wider">
                      {language === 'bn' ? 'সেটেলমেন্ট ক্যাটাগরি' : 'Settlement Category'}
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value as CartItemCategory)}
                      className="w-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-white font-black text-sm rounded-xl px-4 py-3.5 border border-emerald-200 dark:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {activeTab === 'ARCHIVE' ? (
              <div className="bg-slate-50/70 dark:bg-zinc-950/80 rounded-xl p-3 sm:p-4 border border-slate-200/50 dark:border-zinc-800 relative overflow-hidden shadow-inner min-h-[300px]">
                <h3 className="text-xs sm:text-sm font-black text-black dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-emerald-500"/>
                  Archived Settlements
                </h3>
                
                {isLoadingArchive ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : !employeeId ? (
                  <div className="text-center py-10">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Please select an employee to view archives.</p>
                  </div>
                ) : archiveItems.length > 0 ? (
                  <div className="space-y-3">
                     {archiveItems.map((item, idx) => {
                       const isSwiped = swipedItemId === item.id;
                       return (
                         <div key={item.id} className="relative mb-3 overflow-hidden rounded-xl">
                           {/* Swiped Underlay with Delete Button visible on left drag */}
                           <div 
                             className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-red-500 text-white rounded-xl"
                             style={{ zIndex: isSwiped ? 20 : 0 }}
                           >
                             <button
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 deleteArchiveItem(item.id); 
                                 setSwipedItemId(null);
                                }}
                               className="w-full h-full flex flex-col items-center justify-center gap-1 bg-red-500 hover:bg-red-600 active:scale-95 transition-all text-white font-black"
                               title="Delete Settlement Plan"
                             >
                               <Trash2 size={20} strokeWidth={2.5} />
                               <span className="text-[10px] uppercase tracking-wider font-extrabold">{language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}</span>
                             </button>
                           </div>

                           {/* Draggable Top Layer */}
                           <motion.div
                             drag="x"
                             dragDirectionLock
                             dragConstraints={{ left: isSwiped ? -96 : 0, right: 0 }}
                             style={{ touchAction: 'pan-y' }}
                             dragElastic={0.1}
                             
                             onDragEnd={(event, info) => {
                               if (info.offset.x < -30) {
                                 setSwipedItemId(item.id);
                               } else if (info.offset.x > 30) {
                                 setSwipedItemId(null);
                               }
                             }}
                             onClick={(e) => {
                               if (isSwiped) {
                                 e.stopPropagation();
                                 setSwipedItemId(null);
                               }
                             }}
                             className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-800/95 p-4 border border-slate-200/80 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 rounded-xl shadow-md hover:shadow-lg shadow-slate-100/50 dark:shadow-none transition-all group relative z-10 cursor-grab active:cursor-grabbing select-none"
                           >
                             <div 
                               className="flex items-center gap-4 flex-1 cursor-pointer"
                               onClick={(e) => {
                                 if (!isSwiped) {
                                   viewArchivePDF(item);
                                 }
                               }}
                             >
                                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-200/50">
                                   <FileText size={18} />
                                </div>
                                <div className="pointer-events-none">
                                   <div className="font-extrabold text-sm text-black dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Settlement #{idx + 1} ({item.itemsCount} Items)</div>
                                   <div className="text-[10px] uppercase font-black text-zinc-500 dark:text-zinc-400 mt-1">
                                     {new Date(item.settlementDate).toLocaleDateString()} • {item.id}
                                   </div>
                                </div>
                             </div>
                             <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 pointer-events-none">
                               <div className="font-mono font-black text-lg text-black dark:text-white">
                                  {currency.code} {item.totalPaidAmount?.toLocaleString()}
                               </div>
                             </div>
                           </motion.div>
                         </div>
                       );
                     })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-white/30">
                      <FileText size={24} />
                    </div>
                    <p className="text-sm font-bold text-zinc-500 dark:text-white/70">No completed settlements found.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
            {/* Dynamic Content Area based on Category */}
            <div className="bg-slate-50/70 dark:bg-zinc-950/80 rounded-xl p-3 sm:p-4 border border-slate-200/50 dark:border-zinc-800 relative overflow-hidden shadow-inner">
               <h3 className="text-xs sm:text-sm font-black text-black dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2 z-10 relative">
                 {selectedCategory === 'Commission' ? <TrendingUp size={16} className="text-blue-500"/> : <Wallet size={16} className="text-amber-500"/>}
                 Add {selectedCategory} to Cart
               </h3>

               {employeeId ? (
                 <>
                   {(selectedCategory === 'Commission' || selectedCategory === 'Basic Salary' || selectedCategory === 'Friday') ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 z-10 relative">
                        {availableGroups.length > 0 ? (
                          availableGroups.map((group) => {
                            const internalCat = selectedCategory === 'Basic Salary' ? 'SALARY' : (selectedCategory === 'Friday' ? 'FRIDAY' : 'COMMISSION');
                            const catData = group.categories.find((c: any) => (c.name || '').toUpperCase() === internalCat);
                            
                            if (!catData || catData.totalPending <= 0) return null;
                            
                            const cartId = `${group.fileId}-${internalCat}`;
                            const isSelected = cartItems.some(c => c.id === cartId);
                            const monthName = new Date(0, group.month - 1).toLocaleString('default', { month: 'long' });
                            
                            const firstItem = catData.items[0];
                            const sourceName = firstItem?.companyName || companyName || 'General System';

                            return (
                              <div 
                                key={cartId}
                                onClick={() => toggleDatabaseGroup(group, internalCat)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between relative overflow-hidden ${
                                  isSelected 
                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/15' 
                                    : 'bg-white dark:bg-zinc-800/95 border-slate-200/80 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-500/35 shadow-md hover:shadow-lg shadow-slate-100/50 dark:shadow-none'
                                }`}
                              >
                                {/* Watermark */}
                                <div className={`absolute -right-4 -bottom-4 pointer-events-none transition-opacity  ${isSelected ? 'opacity-20 text-emerald-500' : 'opacity-5 dark:opacity-[0.03] text-gray-900 dark:text-white'}`}>
                                  {internalCat === 'COMMISSION' ? <TrendingUp size={90} strokeWidth={1} /> : <Wallet size={90} strokeWidth={1} />}
                                </div>
                                
                                <div className="z-10 flex-1 min-w-0 pr-3">
                                  {(() => {
                                    const sourceFontSize = sourceName.length > 25 
                                      ? 'text-[7.5px] sm:text-[9px]' 
                                      : sourceName.length > 15 
                                      ? 'text-[8.5px] sm:text-[10px]' 
                                      : 'text-[10px] sm:text-[11px]';
                                    return (
                                      <div className={`flex items-center gap-1.5 font-black uppercase tracking-widest mb-1.5 text-black dark:text-white ${sourceFontSize}`}>
                                        <Briefcase size={12} className="flex-shrink-0" />
                                        <span className="truncate w-full block" title={sourceName}>{sourceName}</span>
                                      </div>
                                    );
                                  })()}
                                  <div className="font-bold text-sm sm:text-base truncate text-black dark:text-white font-black">
                                    {monthName} {group.year}
                                  </div>
                                  <div className="text-[10px] sm:text-[11px] mt-2 uppercase font-black tracking-wider flex items-center gap-1.5 text-black dark:text-white">
                                    {internalCat === 'COMMISSION' ? 'TOTAL TRIPS:' : 'TOTAL LOGS:'}
                                    <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-black/10 text-black dark:bg-white/20 dark:text-white">
                                      {catData.items.length}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2 z-10 flex-shrink-0">
                                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600'}`}>
                                    {isSelected && <CheckCircle size={16} strokeWidth={3} className="text-white" />}
                                  </div>
                                  <div className="mt-1 text-right">
                                     <div className="text-[9px] uppercase font-black mb-0.5 text-black dark:text-white">Pending</div>
                                     <div className="font-mono font-bold text-sm sm:text-base px-1.5 py-0.5 rounded-md border text-black bg-black/5 border-black/15 dark:text-white dark:bg-white/10 dark:border-white/20">
                                       {currency.code} {catData.totalPending.toLocaleString()}
                                     </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-1 md:col-span-2 border border-dashed border-slate-300 dark:border-zinc-700 rounded-xl p-8 text-center bg-white dark:bg-zinc-800/95 shadow-md shadow-slate-100/50 dark:shadow-none">
                             <p className="text-sm font-bold text-zinc-500 dark:text-white">No pending database {selectedCategory} found for this employee.</p>
                          </div>
                        )}
                     </div>
                   ) : selectedCategory === 'Advance' ? (
                     <div className="z-10 relative">
                       {advanceData && advanceData.remaining > 0 ? (
                         <div 
                           onClick={toggleAdvance}
                           className={`max-w-lg p-5 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                             cartItems.some(c => c.id === `ADVANCE-DEDUCTION-${employeeId}`)
                               ? 'bg-red-50/50 dark:bg-red-950/20 border-red-500 shadow-md shadow-red-500/15' 
                               : 'bg-white dark:bg-zinc-800/95 border-slate-200/80 dark:border-zinc-700 hover:border-red-300 shadow-md hover:shadow-lg shadow-slate-100/50 dark:shadow-none'
                           }`}
                         >
                           <div className="flex items-start justify-between mb-4">
                             <div>
                               <h4 className="font-black text-black dark:text-white text-lg">Company Advance</h4>
                               <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-1">Select to deduct remaining balance</p>
                             </div>
                             <div className={`w-6 h-6 rounded-md flex items-center justify-center border-2 transition-all ${cartItems.some(c => c.id === `ADVANCE-DEDUCTION-${employeeId}`) ? 'bg-red-500 border-red-500 text-white' : 'bg-gray-50 dark:bg-zinc-700 border-gray-300 dark:border-zinc-600'}`}>
                               {cartItems.some(c => c.id === `ADVANCE-DEDUCTION-${employeeId}`) && <CheckCircle size={16} strokeWidth={3} className="text-white" />}
                             </div>
                           </div>
                           
                           <div className="grid grid-cols-3 gap-2">
                             <div className="bg-gray-50 dark:bg-zinc-700/50 p-2 rounded-lg text-center">
                               <div className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase">Total</div>
                               <div className="font-mono font-bold text-sm text-black dark:text-white">{currency.code} {advanceData.totalAdvance.toLocaleString()}</div>
                             </div>
                             <div className="bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg text-center">
                               <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Paid</div>
                               <div className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-300">{currency.code} {advanceData.paidAdvance.toLocaleString()}</div>
                             </div>
                             <div className="bg-red-50 dark:bg-red-500/10 p-2 rounded-lg text-center border border-red-200 dark:border-red-500/30">
                               <div className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase">Remain</div>
                               <div className="font-mono font-black text-sm text-red-700 dark:text-red-300">{currency.code} {advanceData.remaining.toLocaleString()}</div>
                             </div>
                           </div>
                         </div>
                       ) : (
                          <div className="max-w-lg border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-8 text-center bg-white dark:bg-zinc-800/50">
                             <p className="text-sm font-bold text-zinc-500 dark:text-white">No active advance records found for this employee.</p>
                          </div>
                       )}
                     </div>
                   ) : (
                     <div className="flex flex-col sm:flex-row items-end gap-3 max-w-2xl bg-white dark:bg-zinc-800/95 p-4 rounded-xl border border-slate-200/80 dark:border-zinc-700 shadow-md shadow-slate-100/50 dark:shadow-none z-10 relative">
                        <div className="flex-1 w-full">
                          <label className="block text-[11px] font-black text-black dark:text-white mb-1.5 text-left uppercase tracking-wider">
                            {selectedCategory === 'Deduction' ? 'Deduction Reason' : 'Name / Source'}
                          </label>
                          {selectedCategory === 'Deduction' ? (
                            <select
                              value={manualTitle}
                              onChange={(e) => setManualTitle(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-zinc-700/50 text-black dark:text-white rounded-lg px-4 py-3 text-sm border border-gray-200 dark:border-white/20 font-bold focus:ring-2 focus:ring-red-500 outline-none"
                            >
                              <option value="">-- Select Reason --</option>
                              <option value="Fine">Fine</option>
                              <option value="Damage">Damage</option>
                              <option value="Visa Cost">Visa Cost</option>
                              <option value="Medical">Medical</option>
                              <option value="Traffic Fine">Traffic Fine</option>
                              <option value="Others">Others</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder={selectedCategory}
                              value={manualTitle}
                              onChange={(e) => setManualTitle(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-zinc-700/50 text-black dark:text-white rounded-lg px-4 py-3 text-sm border border-gray-200 dark:border-white/20 font-bold focus:ring-2 focus:ring-emerald-500 outline-none placeholder-zinc-400 dark:placeholder-white/50"
                            />
                          )}
                        </div>
                        <div className="flex-1 w-full">
                          <label className="block text-[11px] font-black text-black dark:text-white mb-1.5 text-left uppercase tracking-wider">Amount ({currency.code})</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0.00"
                            value={manualAmount}
                            onChange={(e) => setManualAmount(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-zinc-700/50 text-black dark:text-white rounded-lg px-4 py-3 text-sm border border-gray-200 dark:border-white/20 font-mono focus:ring-2 focus:ring-emerald-500 outline-none placeholder-zinc-400 dark:placeholder-white/50"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={handleAddManualToCart}
                          className={`w-full sm:w-auto px-6 py-3 text-white font-black text-sm rounded-lg flex items-center justify-center gap-2 transition-all shadow-md ${
                            selectedCategory === 'Deduction' 
                              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                              : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
                          }`}
                        >
                          <Plus size={16} strokeWidth={3} /> ADD 
                        </button>
                     </div>
                   )}
                 </>
               ) : (
                 <p className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20">
                    <User className="inline mr-2" size={14}/> Please select an employee first to load {selectedCategory}.
                 </p>
               )}
            </div>

            {/* Cart Section (Stacked Items) */}
            <div className="bg-slate-50/70 dark:bg-zinc-950/80 rounded-xl border-l-[6px] border-emerald-500 shadow-inner p-3 sm:p-4 border-y border-r border-slate-200/50 dark:border-zinc-800/50 relative overflow-hidden">
               <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-zinc-700/60 pb-3">
                 <h3 className="text-sm sm:text-md font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                   <CreditCard size={18} />
                   Settlement Cart Stack
                 </h3>
                 <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest shadow-sm">
                   {cartItems.length} {cartItems.length === 1 ? 'ITEM' : 'ITEMS'}
                 </span>
               </div>
               
               {cartItems.length > 0 ? (
                 <div className="space-y-3">
                   {cartItems.map((item) => (
                     <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-800/95 border border-slate-200/80 dark:border-zinc-700 p-4 rounded-xl shadow-md hover:shadow-lg shadow-slate-100/50 dark:shadow-none group hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all relative overflow-hidden">
                       <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-emerald-50 dark:from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                       <div className="flex items-center gap-4 z-10 w-full sm:w-auto overflow-hidden">
                          <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-white dark:bg-zinc-800 shadow-sm border-2
                            ${item.isDeduction ? 'text-red-500 border-red-200' : (item.category === 'Commission' ? 'text-blue-500 border-blue-200' : 'text-emerald-500 border-emerald-200')}
                          `}>
                            {item.isDeduction ? '-' : item.category.charAt(0)}
                          </div>
                          <div className="min-w-0 pr-4">
                            {item.sourceName && (
                              <div className="text-[9px] uppercase font-black text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mb-0.5">
                                <Briefcase size={10} /> {item.sourceName}
                              </div>
                            )}
                            <div className="font-extrabold text-[13px] sm:text-sm truncate text-black dark:text-white">{item.title}</div>
                            <div className="text-[10px] uppercase font-black tracking-wider flex items-center gap-2 mt-1 text-black/60 dark:text-white/80">
                               <span className="font-extrabold text-black dark:text-white">{item.category}</span> • <span className="text-black/90 dark:text-white/90">{item.subtitle}</span>
                            </div>
                          </div>
                       </div>
                       <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-6 z-10 w-full sm:w-auto">
                         <div className={`font-mono font-black text-lg ${item.isDeduction ? 'text-red-500 dark:text-red-400' : 'text-black dark:text-white'}`}>
                           {item.isDeduction ? '-' : ''}{currency.code} {item.amount.toLocaleString()}
                         </div>
                         <button 
                           type="button"
                           onClick={() => removeCartItem(item.id)}
                           className="p-2 sm:p-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                         >
                           <X size={16} strokeWidth={3} />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-10">
                   <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-white/30">
                     <CreditCard size={24} />
                   </div>
                   <p className="text-sm font-bold text-zinc-500 dark:text-white/70">Cart is empty. Select items to settle.</p>
                 </div>
               )}
            </div>

            {/* Final Actions Row */}
            {cartItems.length > 0 && (
              <div className="bg-emerald-500 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm shadow-emerald-500/20 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 opacity-10 pointer-events-none">
                  <CheckCircle size={150} strokeWidth={2} />
                </div>
                <div className="text-center sm:text-left z-10 w-full sm:w-auto">
                  <span className="text-[11px] font-black text-emerald-100 uppercase tracking-widest block mb-1">GRAND TOTAL</span>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-emerald-100 font-bold text-xl">{currency.code}</span>
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono drop-shadow-sm truncate">
                      {totalCartAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-white text-emerald-600 rounded-xl font-black text-sm uppercase tracking-wider shadow-md hover:bg-emerald-50 active:scale-95 disabled:opacity-50 transition-all z-10"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm & Receive'}
                </button>
              </div>
            )}
            </>
            )}

          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col justify-center items-center py-6 px-3" style={{ minHeight: 'calc(100vh - 180px)' }}>
            <div   className="bg-white dark:bg-zinc-800/80 rounded-3xl p-5 border border-gray-100 dark:border-gray-700/60 shadow-xl flex flex-col items-center max-w-sm mx-auto w-full">
              <div className="flex items-center gap-2.5 mb-4 w-full justify-center">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                  {activeTab === 'ARCHIVE' ? <FileText size={20} /> : <CheckCircle size={20} className="animate-pulse" />}
                </div>
                <div>
                   <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50 leading-tight">{activeTab === 'ARCHIVE' ? 'Settlement Archive' : 'Settlement Complete'}</h2>
                   <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{activeTab === 'ARCHIVE' ? 'Viewing historical record.' : 'Booked into My Income.'}</p>
                </div>
              </div>
              
              {previewUrl && (
                <div className="w-full mb-4">
                  <div className="flex justify-start items-center mb-1.5 px-1">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      {language === 'bn' ? 'পিডিএফ প্রিভিউ' : 'PDF Preview'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 relative shadow-inner" style={{ height: '160px' }}>
                    {Capacitor.isNativePlatform() ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-zinc-50 dark:bg-zinc-900">
                        <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 mb-2 shadow-sm">
                          <FileText size={20} />
                        </div>
                        <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 max-w-[90%] truncate mb-1">
                          {activeSettlementObj?.employeeName || employeeName || 'Employee'}'s Settlement PDF
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-2.5 leading-tight">
                          {language === 'bn' ? 'পিডিএফ দেখতে নিচের বাটনে ক্লিক করুন।' : 'Click View to open PDF.'}
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenPDF}
                          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-95 transition-all cursor-pointer w-full max-w-[120px] z-10"
                        >
                          <FileText size={12} /> {language === 'bn' ? 'ভিউ করুন' : 'View'}
                        </button>
                      </div>
                    ) : (
                      <iframe 
                        src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                        className="w-full h-full border-0 absolute inset-0 bg-white"
                        title="PDF Preview"
                      />
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                <button type="button" onClick={downloadPDFReport} className="w-full flex justify-center items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-500/10 active:scale-95 transition-all">
                  <Download size={14} /> Download
                </button>
                <button type="button" onClick={resetForm} className="w-full px-4 py-2.5 bg-gray-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-xl font-bold text-xs active:scale-95 transition-all">
                  {activeTab === 'ARCHIVE' ? 'Close Preview' : 'Start New Settlement'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    </div>
  );
}
