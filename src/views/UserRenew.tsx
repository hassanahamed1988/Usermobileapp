import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';

import { ChevronLeft, RefreshCw, DollarSign, User as UserIcon, Calendar, Clock, CheckCircle, UserX, Search, Filter, Hash, CreditCard, Tag, Banknote } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import InputField from '../components/InputField';
import { parseExpiryDate, isExpired } from '../utils/dateUtils';
import { subscribeFirebaseCollection } from '../services/firebase';

const UserRenew: React.FC = () => {
  const { user, setView, language, users, allPayments, addPayment, updatePayment, removePayment, addNotification, clearAccountNotifications, updateUser, showFeedback, confirmAction, setCustomHeaderTitle, setCustomBackAction, currencies, selectedCurrency } = useStore();
  const t = TRANSLATIONS[language];
  const currency = useMemo(() => {
    return currencies?.find((c: any) => c.code === selectedCurrency) || currencies?.[0] || { code: 'QAR', symbol: 'QAR' };
  }, [currencies, selectedCurrency]);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PENDING_LIST' | 'PAYMENT' | 'HISTORY'>('DASHBOARD');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyExpired, setShowOnlyExpired] = useState(true);

  // Real-time payments from all users
  const [allRenewPayments, setAllRenewPayments] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    const paymentsByUser: Record<string, any[]> = {};

    const handleUpdate = () => {
      const mergedPayments: any[] = [];
      Object.values(paymentsByUser).forEach(list => {
        mergedPayments.push(...list);
      });
      // Sort payments descending by transaction date
      mergedPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllRenewPayments(mergedPayments);
    };

    // Subscriptions for all users under "users/{id}/payments"
    users.forEach(u => {
      if (u.role === 'ADMIN') return;
      const path = `users/${u.id}/payments`;
      try {
        const unsub = subscribeFirebaseCollection(path, (data) => {
          paymentsByUser[u.id] = data;
          handleUpdate();
        });
        unsubscribes.push(unsub);
      } catch (err) {
        console.error("Error subscribing to payments of user", u.id, err);
      }
    });

    // Also include payments from admin's path if any
    if (user && user.id) {
      const path = `admins/${user.id}/payments`;
      try {
        const unsub = subscribeFirebaseCollection(path, (data) => {
          paymentsByUser[user.id] = data;
          handleUpdate();
        });
        unsubscribes.push(unsub);
      } catch (err) {
        console.error("Error subscribing to admin self payments", err);
      }
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [users, user]);

  // Renewal Form State
  const [renewDuration, setRenewDuration] = useState('1');
  const [renewUnit, setRenewUnit] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [renewAmount, setRenewAmount] = useState(''); // Deprecated but kept for backup
  const [packageAmount, setPackageAmount] = useState('500');
  const [renewDiscount, setRenewDiscount] = useState('0');
  const [paidAmount, setPaidAmount] = useState('500');
  const [selectedTransactionForDetails, setSelectedTransactionForDetails] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'PAYMENT') {
      setCustomHeaderTitle('Process Renewal');
      setCustomBackAction(() => () => { setActiveTab('PENDING_LIST'); setSelectedUser(null); });
    } else if (activeTab === 'DASHBOARD') {
      setCustomHeaderTitle('Payment Summary');
      setCustomBackAction(null);
    } else if (activeTab === 'PENDING_LIST') {
      setCustomHeaderTitle('Renew User List');
      setCustomBackAction(() => () => setActiveTab('DASHBOARD'));
    } else if (activeTab === 'HISTORY') {
      setCustomHeaderTitle('Renewal History');
      setCustomBackAction(() => () => setActiveTab('DASHBOARD'));
    } else {
      setCustomHeaderTitle(null);
      setCustomBackAction(null);
    }
    return () => {
      setCustomHeaderTitle(null);
      setCustomBackAction(null);
    };
  }, [activeTab, setCustomHeaderTitle, setCustomBackAction]);

  const expiredUsers = useMemo(() => {
    return (users || []).filter(user => {
      if (user.role === 'ADMIN') return false;
      return isExpired(user.expiryDate);
    });
  }, [users]);

  const displayedUsers = useMemo(() => {
    let list = (showOnlyExpired ? expiredUsers : users).filter(u => u.role !== 'ADMIN');
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(u => 
        (u.name || '').toLowerCase().includes(term) ||
        (u.userId || '').toLowerCase().includes(term) ||
        (u.mobileNumber || '').toLowerCase().includes(term) ||
        (u.id || '').toLowerCase().includes(term)
      );
    }
    
    return list;
  }, [showOnlyExpired, expiredUsers, users, searchTerm]);

  const totalPendingBalance = useMemo(() => {
    return (users || []).filter(u => u.role !== 'ADMIN').reduce((sum, user) => {
      let userDue = 0;
      if (typeof user.dueAmount === 'number' && user.dueAmount > 0) {
        userDue += user.dueAmount;
      }
      if (isExpired(user.expiryDate)) {
        userDue += parseFloat((user.packagePrice || user.price || '0').toString()) || 0;
      }
      return sum + userDue;
    }, 0);
  }, [users]);

  const receivedTransactions = useMemo(() => {
    return allRenewPayments.filter(p => p.category === 'User Renew');
  }, [allRenewPayments]);

  const totalReceived = useMemo(() => {
    return receivedTransactions.reduce((sum, p) => sum + p.amount, 0);
  }, [receivedTransactions]);

  const handleRenewFinal = () => {
    if (!selectedUser) return;
    
    // Process finances
    const pkgAmount = parseFloat(packageAmount) || 0;
    const previousDue = selectedUser.dueAmount || 0;
    const discount = parseFloat(renewDiscount) || 0;
    const totalPayable = pkgAmount + previousDue - discount;
    const pAmount = totalPayable;
    let newDue = totalPayable - pAmount;
    if (newDue < 0) newDue = 0; // Don't handle overpayment complexities yet, or handle as 0
    
    // Calculate new expiry date
    let baseDate = new Date();
    const currentExpiry = parseExpiryDate(selectedUser.expiryDate);
    
    // If not expired, extend from current expiry
    if (currentExpiry && !isExpired(selectedUser.expiryDate)) {
      baseDate = currentExpiry;
    }
    
    const newExpiry = new Date(baseDate);
    const durationNum = parseInt(renewDuration) || 1;
    if (renewUnit === 'MONTH') {
      newExpiry.setMonth(newExpiry.getMonth() + durationNum);
    } else {
      newExpiry.setFullYear(newExpiry.getFullYear() + durationNum);
    }
    
    const formattedExpiry = `${String(newExpiry.getDate()).padStart(2, '0')}-${String(newExpiry.getMonth() + 1).padStart(2, '0')}-${newExpiry.getFullYear()}`;
    
    // Update user in store
    updateUser({
      ...selectedUser,
      expiryDate: formattedExpiry,
      status: 'ENABLED',
      paidAmount: (selectedUser.paidAmount || 0) + pAmount,
      discountAmount: discount,
      dueAmount: newDue
    });
    
    // Add payment record
    addPayment({
      id: Date.now().toString(),
      type: 'INCOME',
      status: 'RECEIVED',
      amount: pAmount,
      category: 'User Renew',
      userId: selectedUser.id || selectedUser.userId || '',
      date: new Date().toISOString(),
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      details: { 
        userName: selectedUser.name, 
        userId: selectedUser.userId || selectedUser.id, 
        duration: `${renewDuration} ${renewUnit}`,
        newExpiry: formattedExpiry,
        discount: discount.toString()
      }
    });

    // Clear old account-related notifications for this user
    clearAccountNotifications(selectedUser.id || selectedUser.userId);

    // Add persistent notification for the user
    addNotification({
      targetUserId: selectedUser.id || selectedUser.userId,
      title: language === 'bn' ? 'রিনিউ সফল হয়েছে' : 'Renewal Successful',
      message: language === 'bn' 
        ? `আপনার অ্যাকাউন্টটি সফলভাবে ${formattedExpiry} তারিখ পর্যন্ত রিনিউ করা হয়েছে।` 
        : `Your account has been successfully renewed until ${formattedExpiry}.`,
      type: 'INFO'
    });
    
    // Add notification for admin
    addNotification({
      title: 'User Renewed',
      message: `User ${selectedUser.name} has been renewed until ${formattedExpiry}. Paid ৳${pAmount}, Due ৳${newDue}.`,
      type: 'INFO'
    });
    
    showFeedback(`Successfully renewed ${selectedUser.name} until ${formattedExpiry}`);
    setActiveTab('DASHBOARD');
    setSelectedUser(null);
    setRenewAmount('');
    setPackageAmount('500');
    setPaidAmount('500');
    setRenewDiscount('0');
    setRenewDuration('1');
  };

  return (
    <div className="flex flex-col h-full bg-theme-bg px-0 pt-0 pb-4 relative">
      {selectedTransactionForDetails && createPortal(
        <>
          <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center p-4">
            <div 
              
              
              
              onClick={() => setSelectedTransactionForDetails(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <div 
              className="relative bg-theme-card border border-black/5 dark:border-white/5 w-full max-w-md h-[520px] rounded-[16px] shadow-2xl overflow-hidden z-10 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-black/5 dark:border-white/5 flex items-center gap-3 text-blue-600">
                <Banknote size={24} />
                <h3 className="text-lg font-black uppercase text-text-main">
                  Transaction Details
                </h3>
              </div>
              
              {/* Scrollable Content */}
              <div className="p-6 pt-4 flex-1 overflow-y-auto space-y-4">
                <div className="space-y-3 bg-black/[0.03] dark:bg-white/[0.05] p-4 rounded-xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider">Date & Time</span>
                    <span className="font-black text-text-main">{new Date(selectedTransactionForDetails.date).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider">Transaction ID</span>
                    <span className="font-mono font-bold text-text-main bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">{selectedTransactionForDetails.transactionId || selectedTransactionForDetails.id?.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider">User Name</span>
                    <span className="font-black text-text-main uppercase">{selectedTransactionForDetails.details?.userName || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider">User ID</span>
                    <span className="font-mono font-bold text-text-main bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">{selectedTransactionForDetails.details?.userId || '--'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider">New Expiry</span>
                    <span className="font-black text-text-main">{selectedTransactionForDetails.details?.newExpiry}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider">Duration Added</span>
                    <span className="font-black text-text-main uppercase">{selectedTransactionForDetails.details?.duration}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-text-muted uppercase tracking-wider">Discount Amount</span>
                    <span className="font-black text-rose-500">{currency.code} {selectedTransactionForDetails.details?.discount || '0'}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <InputField 
                    label="Amount"
                    type="number"
                    value={selectedTransactionForDetails.amount?.toString() || ''}
                    onChange={(e) => setSelectedTransactionForDetails({ ...selectedTransactionForDetails, amount: e.target.value })}
                    icon={<Banknote size={16} />}
                  />
                </div>
              </div>
              
              {/* Footer Actions */}
              <div className="p-6 pt-4 border-t border-black/5 dark:border-white/5 flex gap-2">
                <button 
                  onClick={() => setSelectedTransactionForDetails(null)}
                  className="flex-1 py-3 h-12 rounded-[12px] bg-gray-100 dark:bg-white/5 font-black uppercase text-xs text-text-main hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    removePayment(selectedTransactionForDetails.id, selectedTransactionForDetails.userId);
                    setSelectedTransactionForDetails(null);
                    showFeedback('Transaction deleted successfully');
                  }}
                  className="flex-1 py-3 h-12 rounded-[12px] bg-red-500/10 text-red-500 font-black uppercase text-xs hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
                <button 
                  onClick={() => {
                    const parsedAmount = parseFloat(selectedTransactionForDetails.amount || '0');
                    if (isNaN(parsedAmount) || parsedAmount <= 0) {
                      removePayment(selectedTransactionForDetails.id, selectedTransactionForDetails.userId);
                      showFeedback('Transaction deleted due to zero amount');
                    } else {
                      updatePayment({ ...selectedTransactionForDetails, amount: parsedAmount });
                      showFeedback('Transaction updated successfully');
                    }
                    setSelectedTransactionForDetails(null);
                  }}
                  className="flex-1 py-3 h-12 rounded-[12px] bg-blue-500 text-white font-black uppercase text-xs hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {activeTab === 'DASHBOARD' && (
        <div className="flex-1 flex flex-col gap-4">
          <div className="border border-blue-900 px-4 pt-4 pb-4 rounded-[10px] bg-[#001f5f]">
            <div className="flex gap-4">
              <div className="flex-1 bg-[#001f5f] p-5 rounded-[10px] shadow-xl cursor-pointer text-white flex flex-col justify-between border border-blue-500 relative overflow-hidden" onClick={() => setActiveTab('PENDING_LIST')}>
                  {/* Visual arc */}
                  <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full border-4 border-white/10" />                
                  <div className="w-12 h-9 bg-slate-300 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      <div className="w-1.5 h-full bg-slate-500" />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Pending Balance</p>
                      <h3 className="text-xl font-black">{selectedCurrency} {totalPendingBalance.toLocaleString()}</h3>
                      <p className="text-[9px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full inline-block mt-2">
                          {expiredUsers.length} Users Expired
                      </p>
                  </div>
              </div>
              <div className="flex-1 bg-[#001f5f] p-5 rounded-[10px] shadow-xl cursor-pointer text-white flex flex-col justify-between border border-blue-500 relative overflow-hidden" onClick={() => setActiveTab('HISTORY')}>
                  {/* Visual arc */}
                  <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full border-4 border-white/10" />                
                  <div className="w-12 h-9 bg-slate-300 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      <div className="w-1.5 h-full bg-slate-500" />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Received Amount</p>
                      <h3 className="text-xl font-black">{selectedCurrency} {totalReceived.toLocaleString()}</h3>
                  </div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hidden-scrollbar pb-24">
            <h3 className="text-sm font-black text-text-main uppercase tracking-tight mb-3">Transaction History</h3>
            <div className="space-y-3">
                {receivedTransactions.length === 0 ? (
                  <div className="bg-theme-card p-12 rounded-3xl text-center shadow-sm border border-black/5 dark:border-white/5">
                    <Clock size={40} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No history recorded yet</p>
                  </div>
                ) : receivedTransactions.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedTransactionForDetails(p)}
                      className="bg-theme-card p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm active:scale-95 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <p className="text-xs font-black text-text-main uppercase">{p.details?.userName}</p>
                              <p className="text-[9px] font-bold text-text-muted uppercase">ID: {p.details?.userId}</p>
                           </div>
                           <span className="text-xs font-black text-emerald-600">{selectedCurrency} {p.amount}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar size={12} />
                                <span className="text-[9px] font-bold">{new Date(p.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Received</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'PENDING_LIST' && (
        <div className="flex-1 flex flex-col">
            <div className="space-y-4 mb-6 mt-2">
              <InputField 
                label="Search by Name/ID/Mobile..."
                name="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={18} className="text-cyan-500" />}
              />
              
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filters:</span>
                </div>
                <button 
                  onClick={() => setShowOnlyExpired(!showOnlyExpired)}
                  className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border-2 transition-all ${
                    showOnlyExpired 
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                      : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500'
                  }`}
                >
                  {showOnlyExpired ? 'Showing Expired Only' : 'Showing All Users'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {displayedUsers.length === 0 ? (
                <div className="bg-theme-card p-8 rounded-xl shadow-sm text-center">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserX size={32} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-text-muted uppercase tracking-widest">No matching accounts found</p>
                  <p className="text-[10px] text-gray-400 mt-1 italic">
                    {showOnlyExpired ? '* Use filters to search in active accounts.' : '* Try a different search term.'}
                  </p>
                </div>
              ) : displayedUsers.map(user => {
                const userIsExpired = isExpired(user.expiryDate);
                return (
                  <div key={user.id} className="bg-theme-card p-4 rounded-xl shadow-sm flex items-center justify-between border border-transparent hover:border-cyan-500/30 transition-all">
                      <div>
                          <p className="text-sm font-black text-text-main flex items-center gap-2 uppercase">
                            {user.name}
                            {userIsExpired && (
                              <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap">EXPIRED</span>
                            )}
                          </p>
                          <p className="text-[10px] font-bold text-text-muted mt-0.5 uppercase tracking-widest">ID: {user.userId || user.id}</p>
                          <p className="text-[10px] font-bold text-text-muted mt-0.5">Expiry: {user.expiryDate || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-emerald-600 mt-0.5">
                            Package: {user.package || 'Standard'} ({selectedCurrency} {user.packagePrice || user.price || 0})
                          </p>
                          {(userIsExpired || (user.dueAmount && user.dueAmount > 0)) && (
                            <p className="text-[10px] font-black text-rose-500 mt-0.5">
                              Pending: {selectedCurrency} {(user.dueAmount || 0) + (userIsExpired ? (parseFloat((user.packagePrice || user.price || '0').toString()) || 0) : 0)}
                            </p>
                          )}
                      </div>
                      <button 
                          className={`text-[10px] font-black uppercase px-4 py-2 rounded shadow-sm transition-all active:scale-95 ${
                            userIsExpired ? 'bg-rose-500 text-white' : 'bg-cyan-500 text-white'
                          }`}
                          onClick={() => { 
                            setSelectedUser(user); 
                            setActiveTab('PAYMENT'); 
                            setPackageAmount((user.packagePrice || user.price || '0').toString());
                            setPaidAmount((user.packagePrice || user.price || '0').toString());
                            
                            // Auto-fill custom plan duration based on user's active membership plan structure
                            const durationStr = user.duration || '1 MONTH';
                            let unit: 'MONTH' | 'YEAR' = 'MONTH';
                            let durationVal = '1';
                            
                            const parts = durationStr.trim().toUpperCase().split(/\s+/);
                            if (parts.length === 2) {
                              durationVal = parts[0];
                              if (parts[1].startsWith('YEAR')) {
                                unit = 'YEAR';
                              } else if (parts[1].startsWith('MONTH')) {
                                unit = 'MONTH';
                              }
                            } else if (parts[0] === 'LIFETIME') {
                              durationVal = '99';
                              unit = 'YEAR';
                            } else {
                              const numericPart = parseInt(parts[0]);
                              if (!isNaN(numericPart)) {
                                durationVal = numericPart.toString();
                              }
                            }
                            setRenewDuration(durationVal);
                            setRenewUnit(unit);
                          }}
                      >
                          Renew Now
                      </button>
                  </div>
                );
              })}
            </div>
            
            <button 
               onClick={() => setActiveTab('DASHBOARD')}
               className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-400 py-3 hover:text-cyan-500 transition-colors"
            >
              <ChevronLeft size={14} /> Back to summary
            </button>
        </div>
      )}

      {activeTab === 'PAYMENT' && (
        <div className="flex-1 flex flex-col pt-2">
          {selectedUser && (
            <div className="flex-1 space-y-4 pb-[80px] overflow-y-auto hidden-scrollbar">
              {/* User Identity Card */}
              <div 
                
                
                
                className="bg-gradient-to-br from-cyan-600 to-blue-700 p-5 rounded-3xl text-white shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                      <UserIcon size={24} className="text-white" />
                    </div>
                    {isExpired(selectedUser.expiryDate) && (
                      <span className="bg-red-500/30 backdrop-blur-md border border-white/20 text-[8px] font-black uppercase px-2 py-1 rounded-lg tracking-widest mt-1">Expired</span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-lg font-black uppercase tracking-tight leading-none">{selectedUser.name}</h4>
                    <div className="flex items-center gap-2 opacity-70 mt-1">
                      <Hash size={10} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">ID: {selectedUser.userId || selectedUser.id}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Current Expiry</p>
                      <p className="text-sm font-black leading-none">{selectedUser.expiryDate || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-1">Status</p>
                      <p className="text-sm font-black uppercase leading-none">{selectedUser.status || 'Active'}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
                    <button
                      onClick={() => {
                        confirmAction(`Are you sure you want to reset validity for ${selectedUser.name}?`, () => {
                          const today = new Date();
                          const todayFormatted = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
                          const updated = { 
                            ...selectedUser, 
                            expiryDate: todayFormatted, 
                            status: 'DISABLED'
                          };
                          updateUser(updated);
                          setSelectedUser(updated);
                          setPackageAmount((updated.packagePrice || updated.price || '0').toString());
                          setPaidAmount('0');
                          setRenewDiscount('0');
                          setRenewDuration('');
                          showFeedback('User validity has been reset to today\'s date.');
                        });
                      }}
                      className="text-[10px] px-3 py-1.5 uppercase font-bold text-white bg-rose-500/80 rounded-full shadow-sm hover:bg-rose-500 transition-colors"
                    >
                      Reset Validity
                    </button>
                  </div>
                </div>
              </div>

              {/* Advanced Renewal Form */}
              <div className="bg-theme-card p-5 rounded-3xl shadow-sm border border-black/5 dark:border-white/5 space-y-6">
                
                {/* Packages Selection Removed */}
                <div className="space-y-4 pt-2 border-t border-black/5 dark:border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Custom Plan Duration</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <InputField 
                          label="Number"
                          name="duration"
                          type="number"
                          value={renewDuration}
                          onChange={(e) => {
                             setRenewDuration(e.target.value);
                          }}
                          icon={<Clock size={16} className="text-cyan-500" />}
                          className="h-14"
                        />
                      </div>
                      <div className="flex bg-black/[0.03] dark:bg-white/[0.05] rounded-[8px] border border-[rgba(0,0,0,0.45)] dark:border-[rgba(255,255,255,0.25)] h-14 w-full overflow-hidden">
                        <button 
                          onClick={() => {
                             setRenewUnit('MONTH');
                          }}
                          className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black uppercase transition-all h-full border-r border-[rgba(0,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] ${
                            renewUnit === 'MONTH' ? 'bg-cyan-500 text-white' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          Months
                        </button>
                        <button 
                          onClick={() => {
                             setRenewUnit('YEAR');
                          }}
                          className={`flex-1 flex flex-col items-center justify-center text-[10px] font-black uppercase transition-all h-full ${
                            renewUnit === 'YEAR' ? 'bg-cyan-500 text-white' : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                          }`}
                        >
                          Years
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField 
                      label={`Package/Fees (${selectedCurrency})`}
                      name="packageAmount"
                      type="number"
                      placeholder="0"
                      value={packageAmount}
                      onChange={(e) => setPackageAmount(e.target.value)}
                    />

                    <InputField 
                      label={`Discount (${selectedCurrency})`}
                      name="discount"
                      type="number"
                      placeholder="0"
                      value={renewDiscount}
                      onChange={(e) => setRenewDiscount(e.target.value)}
                      icon={<Tag size={16} className="text-rose-500" />}
                    />
                  </div>

                  {selectedUser?.dueAmount ? (
                    <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-3 rounded-xl flex items-center justify-between">
                       <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Previous Due Balance</span>
                       <span className="text-sm font-black text-rose-600 dark:text-rose-400">{selectedCurrency} {selectedUser.dueAmount}</span>
                    </div>
                  ) : null}

                  <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 p-3 rounded-xl flex items-center justify-between">
                     <span className="text-xs font-black text-text-main uppercase tracking-widest">Total Payable</span>
                     <span className="text-lg font-black text-cyan-600 dark:text-cyan-400">
                       {selectedCurrency} {((parseFloat(packageAmount) || 0) + (selectedUser?.dueAmount || 0) - (parseFloat(renewDiscount) || 0)).toLocaleString()}
                     </span>
                  </div>

                  {/* Paid Amount and Remaining Due removed as requested */}
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleRenewFinal}
                    disabled={!renewAmount && !packageAmount}
                    className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-cyan-500/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                  >
                    <RefreshCw size={18} className="animate-spin-slow" />
                    Confirm Payment & Renew
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="flex-1 flex flex-col pt-2">
            
            <div className="flex-1 overflow-y-auto space-y-3">
                {receivedTransactions.length === 0 ? (
                  <div className="bg-theme-card p-12 rounded-3xl text-center shadow-sm border border-black/5 dark:border-white/5">
                    <Clock size={40} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No history recorded yet</p>
                  </div>
                ) : receivedTransactions.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedTransactionForDetails(p)}
                      className="bg-theme-card p-4 rounded-xl border border-black/5 dark:border-white/5 shadow-sm active:scale-95 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                    >
                        <div className="flex justify-between items-start mb-2">
                           <div>
                              <p className="text-xs font-black text-text-main uppercase">{p.details?.userName}</p>
                              <p className="text-[9px] font-bold text-text-muted uppercase">ID: {p.details?.userId}</p>
                           </div>
                           <span className="text-xs font-black text-cyan-600">{selectedCurrency} {p.amount}</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                            <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar size={12} />
                                <span className="text-[9px] font-bold">{new Date(p.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Received</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default UserRenew;
