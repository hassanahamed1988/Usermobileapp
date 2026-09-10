import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';

import { TRANSLATIONS } from '../constants';
import { X, ChevronLeft, ChevronDown, Download, Plus, Check, Edit2, Wallet as WalletIcon, Users, Lock, Shield, User, RefreshCw, UserCheck, Briefcase, Calendar, CreditCard, DollarSign, FileText, UserX, Search } from 'lucide-react';
import { subscribeFirebaseDoc, saveFirebaseDocMerge, subscribeFirebaseCollection, saveFirebaseDoc } from '@/services/firebase';
import GlobalDateTimePicker from '@/components/GlobalDateTimePicker';
import './Wallet.css';

const AVATAR = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="46"><rect width="46" height="46" rx="10" fill="#0E8F6F"/><text x="50%" y="56%" font-size="18" fill="#fff" text-anchor="middle" font-family="sans-serif">W</text></svg>'
)}`;

const fmtDate = (d: string) => {
  if (!d) return '--';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const Wallet: React.FC = () => {
  const { 
    language, 
    activeSection, 
    setActiveSection, 
    navigationDirection, 
    setNavigationDirection,
    walletTransactions,
    allWalletTransactions,
    user,
    users,
    profiles,
    allProfiles,
    addWalletTransaction,
    updateWalletTransaction,
    removeWalletTransaction,
    showFeedback,
    setView,
    confirmAction,
    wallpaper,
    backgroundColor,
    isNightMode,
    appThemeMode,
    isDarkMode,
    currencies,
    selectedCurrency,
    walletIncomeSources,
    walletDeductionReasons,
    walletPaymentMethods
  } = useStore();

  const currency = useMemo(() => {
    return (currencies || []).find((c: any) => c.code === selectedCurrency) || { code: "BDT", symbol: "BDT" };
  }, [currencies, selectedCurrency]);

  const fmt = (n: number) => {
    const code = currency.code || 'BDT';
    const locale = code === 'BDT' ? 'en-IN' : 'en-US';
    return code + ' ' + Number(n).toLocaleString(locale);
  };

  const isAdmin = user?.role === 'ADMIN';
  const currentUserId = user?.id;

  // Local state for tabs, overlays, and forms
  const [activeTab, setActiveTab] = useState<'history' | 'pending'>('history');
  const [balanceTab, setBalanceTab] = useState<'debit' | 'credit'>('debit');
  const [overlay, setOverlay] = useState<'statement' | 'txDetail' | 'pendingDetail' | 'addMoney' | 'userSelection' | null>(null);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Link User Module state
  const [linkTab, setLinkTab] = useState<'link' | 'unlink'>('link');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Wallet Access configuration state
  const [walletConfig, setWalletConfig] = useState<{
    linkedUserId: string | null;
    linkedUserName: string | null;
    linkedUserEmail: string | null;
    linkedUserAvatar: string | null;
    linkedUserPhone: string | null;
    linkedUserCompany: string | null;
    syncedAt: string | null;
    linkedUserIds?: string[];
    linkedUsers?: Record<string, any>;
  } | null>(null);

  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe in real-time to wallet access control settings
    const unsubscribe = subscribeFirebaseDoc('settings', 'walletAccessControl', (data) => {
      if (data) {
        setWalletConfig({
          linkedUserId: data.linkedUserId || null,
          linkedUserName: data.linkedUserName || null,
          linkedUserEmail: data.linkedUserEmail || null,
          linkedUserAvatar: data.linkedUserAvatar || null,
          linkedUserPhone: data.linkedUserPhone || null,
          linkedUserCompany: data.linkedUserCompany || null,
          syncedAt: data.syncedAt || null,
          linkedUserIds: data.linkedUserIds || (data.linkedUserId ? [data.linkedUserId] : []),
          linkedUsers: data.linkedUsers || (data.linkedUserId ? {
            [data.linkedUserId]: {
              id: data.linkedUserId,
              name: data.linkedUserName || '',
              email: data.linkedUserEmail || '',
              avatar: data.linkedUserAvatar || '',
              mobileNumber: data.linkedUserPhone || '',
              companyName: data.linkedUserCompany || '',
              syncedAt: data.syncedAt || ''
            }
          } : {})
        });
      } else {
        setWalletConfig({
          linkedUserId: null,
          linkedUserName: null,
          linkedUserEmail: null,
          linkedUserAvatar: null,
          linkedUserPhone: null,
          linkedUserCompany: null,
          syncedAt: null,
          linkedUserIds: [],
          linkedUsers: {}
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const linkedUserIds = useMemo(() => {
    if (!walletConfig) return [];
    if (walletConfig.linkedUserIds && Array.isArray(walletConfig.linkedUserIds)) {
      return walletConfig.linkedUserIds;
    }
    return walletConfig.linkedUserId ? [walletConfig.linkedUserId] : [];
  }, [walletConfig]);

  const activeLinkedUserId = useMemo(() => {
    if (!isAdmin) return currentUserId;
    if (adminSelectedUserId) return adminSelectedUserId;
    return walletConfig?.linkedUserId || linkedUserIds[0] || null;
  }, [isAdmin, adminSelectedUserId, currentUserId, walletConfig, linkedUserIds]);

  const handleUnlinkUser = async (userIdToUnlink: string) => {
    try {
      const currentLinkedUsers = { ...(walletConfig?.linkedUsers || {}) };
      delete currentLinkedUsers[userIdToUnlink];

      const currentLinkedIds = linkedUserIds.filter((id: string) => id !== userIdToUnlink);

      // Resolve the next default linked user
      const nextActiveUserId = currentLinkedIds[currentLinkedIds.length - 1] || null;
      const nextActiveUser = nextActiveUserId ? currentLinkedUsers[nextActiveUserId] : null;

      const syncData = {
        linkedUserId: nextActiveUserId,
        linkedUserName: nextActiveUser?.name || null,
        linkedUserEmail: nextActiveUser?.email || null,
        linkedUserAvatar: nextActiveUser?.avatar || null,
        linkedUserPhone: nextActiveUser?.mobileNumber || null,
        linkedUserCompany: nextActiveUser?.companyName || null,
        syncedAt: nextActiveUser?.syncedAt || null,
        linkedUserIds: currentLinkedIds,
        linkedUsers: currentLinkedUsers
      };

      await saveFirebaseDoc('settings', 'walletAccessControl', syncData);
      showFeedback(language === 'bn' ? 'ইউজার আনলিঙ্ক করা হয়েছে' : 'User unlinked successfully');
    } catch (error) {
      console.error("Error unlinking user", error);
      showFeedback(language === 'bn' ? 'আনলিঙ্ক করতে ব্যর্থ হয়েছে' : 'Failed to unlink user');
    }
  };

  const handleSelectUser = async (selectedUser: any) => {
    try {
      const selectedProfile = (allProfiles || profiles || []).find((p: any) => p.userId === selectedUser.id);
      
      const currentLinkedIds = [...linkedUserIds];
      const currentLinkedUsers = { ...(walletConfig?.linkedUsers || {}) };

      if (currentLinkedIds.includes(selectedUser.id)) {
        // Toggle: Unlink if already linked
        await handleUnlinkUser(selectedUser.id);
        return;
      }

      // Link: Add user
      const newLinkedUser = {
        id: selectedUser.id,
        name: selectedUser.name || '',
        email: selectedUser.email || selectedUser.loginEmail || '',
        avatar: selectedUser.avatar || '',
        mobileNumber: selectedUser.mobileNumber || selectedUser.mobile || selectedProfile?.mobile || '',
        companyName: selectedUser.companyName || selectedUser.profession || selectedProfile?.type || '',
        syncedAt: new Date().toISOString()
      };

      const updatedLinkedUsers = {
        ...currentLinkedUsers,
        [selectedUser.id]: newLinkedUser
      };

      const updatedLinkedIds = Array.from(new Set([...currentLinkedIds, selectedUser.id]));

      const syncData = {
        linkedUserId: selectedUser.id,
        linkedUserName: selectedUser.name || '',
        linkedUserEmail: selectedUser.email || selectedUser.loginEmail || '',
        linkedUserAvatar: selectedUser.avatar || '',
        linkedUserPhone: selectedUser.mobileNumber || selectedUser.mobile || selectedProfile?.mobile || '',
        linkedUserCompany: selectedUser.companyName || selectedUser.profession || selectedProfile?.type || '',
        syncedAt: new Date().toISOString(),
        linkedUserIds: updatedLinkedIds,
        linkedUsers: updatedLinkedUsers
      };
      
      await saveFirebaseDoc('settings', 'walletAccessControl', syncData);
      showFeedback(language === 'bn' ? `${selectedUser.name}-এর ওয়ালেট অ্যাক্সেস সিঙ্ক করা হয়েছে` : `Access granted & data synced for ${selectedUser.name}`);
      setOverlay(null);
    } catch (error) {
      console.error("Error syncing wallet access", error);
      showFeedback(language === 'bn' ? 'ওয়ালেট লিঙ্ক করতে ব্যর্থ হয়েছে' : 'Failed to grant wallet access');
    }
  };

  const standardUsers = useMemo(() => {
    return (users || []).filter((u: any) => u.role !== 'ADMIN');
  }, [users]);

  const linkedUserObj = useMemo(() => {
    if (!activeLinkedUserId) return null;
    const found = standardUsers.find((u: any) => u.id === activeLinkedUserId);
    if (found) return found;
    
    const mapped = walletConfig?.linkedUsers?.[activeLinkedUserId];
    if (mapped) return mapped;

    return {
      id: activeLinkedUserId,
      name: walletConfig?.linkedUserName || 'Linked User',
      email: walletConfig?.linkedUserEmail || '',
      avatar: walletConfig?.linkedUserAvatar || '',
      mobileNumber: walletConfig?.linkedUserPhone || '',
      companyName: walletConfig?.linkedUserCompany || ''
    };
  }, [standardUsers, activeLinkedUserId, walletConfig]);

  const unlinkedUsers = useMemo(() => {
    return standardUsers.filter((u: any) => !linkedUserIds.includes(u.id));
  }, [standardUsers, linkedUserIds]);

  const filteredUnlinkedUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return unlinkedUsers;
    return unlinkedUsers.filter((u: any) => {
      const nameVal = (u.name || '').toLowerCase();
      const mobileVal = (u.mobileNumber || u.mobile || '').toLowerCase();
      const idVal = (u.id || '').toLowerCase();
      const emailVal = (u.email || u.loginEmail || '').toLowerCase();
      return nameVal.includes(q) || mobileVal.includes(q) || idVal.includes(q) || emailVal.includes(q);
    });
  }, [unlinkedUsers, searchQuery]);

  // Month & Year filtering state (default to current month/year)
  const [statementMonth, setStatementMonth] = useState(new Date().getMonth().toString());
  const [statementYear, setStatementYear] = useState(new Date().getFullYear().toString());
  const [statementFilter, setStatementFilter] = useState<'0' | '1' | '2'>('2'); // 0: Credited, 1: Debited, 2: Both
  const [isManualFilterApplied, setIsManualFilterApplied] = useState(false);

  const [statementPeriod, setStatementPeriod] = useState<'3_months' | '6_months' | '1_year' | 'custom'>('3_months');
  const [statementStartDate, setStatementStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() - 3, new Date().getDate()).toISOString().split('T')[0]
  );
  const [statementEndDate, setStatementEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [walletPicker, setWalletPicker] = useState<{ open: boolean; type: 'start' | 'end' | 'addMoney'; value: string; title: string }>({
    open: false,
    type: 'start',
    value: '',
    title: ''
  });

  const handleSelectPeriod = (period: '3_months' | '6_months' | '1_year' | 'custom') => {
    setStatementPeriod(period);
    const today = new Date();
    if (period === '3_months') {
      const start = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      setStatementStartDate(start.toISOString().split('T')[0]);
      setStatementEndDate(today.toISOString().split('T')[0]);
    } else if (period === '6_months') {
      const start = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      setStatementStartDate(start.toISOString().split('T')[0]);
      setStatementEndDate(today.toISOString().split('T')[0]);
    } else if (period === '1_year') {
      const start = new Date(today.getFullYear(), today.getMonth() - 12, today.getDate());
      setStatementStartDate(start.toISOString().split('T')[0]);
      setStatementEndDate(today.toISOString().split('T')[0]);
    }
  };

  const [addMoneyForm, setAddMoneyForm] = useState<{
    type: 'INCOME' | 'DEDUCTION';
    source: string;
    reason: string;
    date: string;
    method: string;
    amount: string;
    description: string;
  }>({
    type: 'INCOME',
    source: '',
    reason: '',
    date: new Date().toISOString().split('T')[0],
    method: '',
    amount: '',
    description: ''
  });

  const [adminFetchedTransactions, setAdminFetchedTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin && activeLinkedUserId) {
      const targetUser = (users || []).find((u: any) => u.id === activeLinkedUserId);
      const parentCol = targetUser?.role === 'ADMIN' ? 'admins' : 'users';
      const unsub = subscribeFirebaseCollection(`${parentCol}/${activeLinkedUserId}/walletTransactions`, (data) => {
        setAdminFetchedTransactions(data || []);
      });
      return () => unsub();
    } else {
      setAdminFetchedTransactions([]);
    }
  }, [isAdmin, activeLinkedUserId, users]);

  // Clean up any existing seeded demo database documents from Firestore on mount
  useEffect(() => {
    const demoIds = ['PAY-W1', 'PAY-W2', 'PAY-W3', 'PAY-W4', 'PAY-W5', 'PAY-W6', 'PAY-W7'];
    const demoTxIds = ['TXN-840221', 'TXN-840219', 'TXN-840212', 'TXN-840205', 'TXN-840198', 'TXN-PND-1042', 'TXN-PND-1041'];
    const demoNotes = ["Salary deposit", "Office supplies", "Freelance project", "Vendor payment", "Bonus credit", "Project milestone", "Equipment purchase"];

    const currentList = isAdmin ? adminFetchedTransactions : walletTransactions;
    if (currentList && currentList.length > 0) {
      currentList.forEach((p: any) => {
        if (!p || !p.id) return;
        const note = p.details?.note || p.desc || '';
        const isDemo = (
          demoIds.includes(p.id) ||
          demoTxIds.includes(p.transactionId) ||
          demoNotes.includes(note)
        );
        if (isDemo) {
          removeWalletTransaction(p.id, p.userId || activeLinkedUserId);
        }
      });
    }
  }, [walletTransactions, adminFetchedTransactions, isAdmin, removeWalletTransaction]);

  // Read transactions list from Store
  const userPaymentsList = useMemo(() => {
    const rawList = isAdmin ? adminFetchedTransactions : (walletTransactions || []);
    // Filter out seeded demo payments (PAY-W1 to PAY-W7, plus demo transaction IDs/notes)
    const demoIds = ['PAY-W1', 'PAY-W2', 'PAY-W3', 'PAY-W4', 'PAY-W5', 'PAY-W6', 'PAY-W7'];
    const demoTxIds = ['TXN-840221', 'TXN-840219', 'TXN-840212', 'TXN-840205', 'TXN-840198', 'TXN-PND-1042', 'TXN-PND-1041'];
    const demoNotes = ["Salary deposit", "Office supplies", "Freelance project", "Vendor payment", "Bonus credit", "Project milestone", "Equipment purchase"];

    return rawList.filter((p: any) => {
      if (!p) return false;
      const note = p.details?.note || p.desc || '';
      const isDemo = (
        (p.id && demoIds.includes(p.id)) ||
        (p.transactionId && demoTxIds.includes(p.transactionId)) ||
        demoNotes.includes(note)
      );
      return !isDemo;
    });
  }, [walletTransactions, adminFetchedTransactions, isAdmin]);

  // Filter approved transactions and pending requests
  const approvedList = useMemo(() => {
    return userPaymentsList.filter(p => p.status === 'RECEIVED');
  }, [userPaymentsList]);

  const pendingList = useMemo(() => {
    return userPaymentsList.filter(p => p.status === 'PENDING');
  }, [userPaymentsList]);

  // Filter approved transactions for the summary card (always filtered by selected month & year)
  const summaryFilteredList = useMemo(() => {
    const monthIndex = parseInt(statementMonth);
    const targetYear = parseInt(statementYear);
    return approvedList.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      return txDate.getMonth() === monthIndex && txDate.getFullYear() === targetYear;
    });
  }, [approvedList, statementMonth, statementYear]);

  // Filter approved transactions for the list (last 6 months if not manually filtered, otherwise same as summaryFilteredList)
  const filteredApprovedList = useMemo(() => {
    if (!isManualFilterApplied) {
      const now = new Date();
      // Set to 6 months ago relative to today
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return approvedList.filter(t => {
        if (!t.date) return false;
        const txDate = new Date(t.date);
        return txDate >= sixMonthsAgo;
      });
    } else {
      return summaryFilteredList;
    }
  }, [approvedList, isManualFilterApplied, summaryFilteredList]);

  // Approved totals calculations for selected month/year (Summary Card)
  const summaryTotalCredit = useMemo(() => {
    return summaryFilteredList
      .filter(p => p.type === 'INCOME')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [summaryFilteredList]);

  const summaryTotalDebit = useMemo(() => {
    return summaryFilteredList
      .filter(p => p.type === 'DEDUCTION')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [summaryFilteredList]);

  // Approved totals calculations for actual rendered list (Subpages) - ALL TIME as requested
  const listTotalCredit = useMemo(() => {
    return approvedList
      .filter(p => p.type === 'INCOME')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [approvedList]);

  const listTotalDebit = useMemo(() => {
    return approvedList
      .filter(p => p.type === 'DEDUCTION')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [approvedList]);

  // Running cumulative balance at the end of the selected period
  const balance = useMemo(() => {
    const monthIndex = parseInt(statementMonth);
    const targetYear = parseInt(statementYear);
    const endOfPeriod = new Date(targetYear, monthIndex + 1, 1);
    return approvedList
      .filter(p => p.date && new Date(p.date) < endOfPeriod)
      .reduce((sum, p) => sum + (p.type === 'INCOME' ? p.amount : -p.amount), 0);
  }, [approvedList, statementMonth, statementYear]);

  // Open modals & detail view
  const handleTxClick = (tx: any, isPending: boolean) => {
    setSelectedTx(tx);
    setOverlay(isPending ? 'pendingDetail' : 'txDetail');
  };

  const closeOverlay = () => {
    setOverlay(null);
    setSelectedTx(null);
    setEditingId(null);
  };

  // Generate & Print high quality HTML PDF Report
  const generateStatementPdf = (filterType: 'credit' | 'debit' | 'both', optParam1?: string, optParam2?: string) => {
    let start: Date;
    let end: Date;

    if (optParam1 && optParam2 && optParam1.length <= 2 && optParam2.length === 4) {
      const monthIndex = parseInt(optParam1);
      const targetYear = parseInt(optParam2);
      start = new Date(targetYear, monthIndex, 1);
      end = new Date(targetYear, monthIndex + 1, 0);
    } else if (optParam1 && optParam2) {
      start = new Date(optParam1);
      end = new Date(optParam2);
    } else {
      start = new Date(statementStartDate);
      end = new Date(statementEndDate);
    }

    // Set hours to encompass the full days
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const filteredRows = approvedList.filter(t => {
      if (!t.date) return false;
      const txDate = new Date(t.date);
      if (txDate < start || txDate > end) return false;

      if (filterType === 'both') return true;
      if (filterType === 'credit') return t.type === 'INCOME';
      if (filterType === 'debit') return t.type === 'DEDUCTION';
      return true;
    });

    const startingBalance = approvedList
      .filter(t => t.date && new Date(t.date) < start)
      .reduce((sum, t) => sum + (t.type === 'INCOME' ? t.amount : -t.amount), 0);

    const sortedAsc = filteredRows.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = startingBalance;
    const rowsWithBalance = sortedAsc.map(t => {
      const isCredit = t.type === 'INCOME';
      running += (isCredit ? t.amount : -t.amount);
      return {
        ...t,
        rowBalance: running
      };
    });

    const bodyRows = rowsWithBalance.slice().reverse().map(t => {
      const isCredit = t.type === 'INCOME';
      const displayMethod = t.method === 'ONLINE_BANK' ? 'Bank Transfer' : t.method === 'MOBILE_BANKING' ? 'Mobile Banking' : 'Cash';
      return `
        <tr>
          <td>${fmtDate(t.date)}</td>
          <td><span style="font-family: monospace; font-size: 11px;">${t.transactionId || t.id || 'N/A'}</span></td>
          <td>${t.details?.note || t.desc || 'No description'}</td>
          <td>${displayMethod}</td>
          <td class="credit text-right" style="text-align: right; color: #10B981; font-weight: 600;">${isCredit ? fmt(t.amount) : '-'}</td>
          <td class="debit text-right" style="text-align: right; color: #EF4444; font-weight: 600;">${!isCredit ? fmt(t.amount) : '-'}</td>
          <td class="balance text-right" style="text-align: right; font-weight: 700;">${fmt(t.rowBalance)}</td>
        </tr>
      `;
    }).join('');

    const totalCreditAmount = filteredRows
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebitAmount = filteredRows
      .filter(t => t.type === 'DEDUCTION')
      .reduce((sum, t) => sum + t.amount, 0);

    const endingBalance = startingBalance + totalCreditAmount - totalDebitAmount;

    const noDataHtml = `<tr><td colspan="7" style="text-align:center; padding: 36px; color: #64748B; font-weight: 500; font-style: italic; background: #FFFFFF;">No transactions found for this period.</td></tr>`;

    // Resolve target user details for the statement header
    const targetUser = (isAdmin && activeLinkedUserId)
      ? (users || []).find((u: any) => u.id === activeLinkedUserId) || walletConfig?.linkedUsers?.[activeLinkedUserId] || user
      : user;

    const uName = targetUser?.name || 'N/A';
    const uMobile = targetUser?.mobileNumber || targetUser?.mobile || 'N/A';
    const uDob = targetUser?.dob || 'N/A';
    const uNationality = targetUser?.nationality || 'N/A';
    const uEmail = targetUser?.email || targetUser?.loginEmail || 'N/A';

    const formatDateString = (d: Date) => {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>FleetPro - Wallet Statement</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
            <style>
              @page {
                size: A4 portrait;
                margin: 10mm 12mm;
              }
              body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                color: #1E293B;
                margin: 0;
                padding: 0;
                background: #FFFFFF;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                font-size: 11px;
                line-height: 1.4;
              }
              .brand-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #0E8F6F;
                padding-bottom: 15px;
                margin-bottom: 20px;
              }
              .brand-info {
                display: flex;
                flex-direction: column;
              }
              .app-tag {
                font-size: 9px;
                font-weight: 800;
                color: #C9A24B;
                letter-spacing: 1.5px;
                margin-bottom: 2px;
                text-transform: uppercase;
              }
              .app-name {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 22px;
                font-weight: 800;
                color: #0E8F6F;
                margin: 0;
                line-height: 1.1;
                letter-spacing: -0.5px;
              }
              .brand-sub {
                font-size: 11px;
                color: #64748B;
                margin: 2px 0 0 0;
                font-weight: 500;
              }
              .statement-meta {
                text-align: right;
                font-size: 11px;
              }
              .meta-item {
                margin-bottom: 3px;
              }
              .meta-label {
                font-weight: 600;
                color: #64748B;
              }
              .meta-val {
                font-weight: 700;
                color: #0E8F6F;
                margin-left: 6px;
              }
              
              /* Account Summary & User details in beautiful flex grid */
              .info-grid {
                display: flex;
                gap: 20px;
                margin-bottom: 25px;
              }
              .info-card {
                flex: 1;
                border: 1px solid #E2E8F0;
                border-radius: 8px;
                background: #F8FAFC;
                padding: 12px 16px;
              }
              .card-title {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 12px;
                font-weight: 700;
                color: #0F172A;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                border-bottom: 1.5px solid #0E8F6F;
                padding-bottom: 4px;
              }
              .info-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px solid #F1F5F9;
              }
              .info-row:last-child {
                border-bottom: none;
              }
              .info-label {
                color: #475569;
                font-weight: 500;
              }
              .info-value {
                color: #0F172A;
                font-weight: 600;
                text-align: right;
              }

              /* Transaction Table Styles */
              .table-section-title {
                font-family: 'Space Grotesk', sans-serif;
                font-size: 13px;
                font-weight: 700;
                color: #0F172A;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                margin-top: 5px;
                border: 1px solid #E2E8F0;
                border-radius: 6px;
                overflow: hidden;
              }
              th {
                background: #0E8F6F;
                color: #FFFFFF;
                text-align: left;
                padding: 10px 8px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              td {
                padding: 9px 8px;
                border-bottom: 1px solid #E2E8F0;
                color: #334155;
              }
              tr:nth-child(even) {
                background: #F8FAFC;
              }
              .credit {
                color: #10B981;
                font-weight: 600;
              }
              .debit {
                color: #EF4444;
                font-weight: 600;
              }
              .balance {
                font-weight: 700;
                color: #0F172A;
              }
              .footer {
                margin-top: 40px;
                border-top: 1px solid #E2E8F0;
                padding-top: 12px;
                text-align: center;
                font-size: 9px;
                color: #94A3B8;
                font-weight: 500;
              }
            </style>
          </head>
          <body>
            <div class="brand-header">
              <div class="brand-info">
                <span class="app-tag">OFFICIAL ACCOUNT STATEMENT</span>
                <h1 class="app-name">FleetPro Transport Manager</h1>
                <p class="brand-sub">Secure Wallet Ledger Copy</p>
              </div>
              <div class="statement-meta">
                <div class="meta-item">
                  <span class="meta-label">Covered Period:</span>
                  <span class="meta-val" style="color: #C9A24B;">${formatDateString(start)} - ${formatDateString(end)}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Date Generated:</span>
                  <span class="meta-val">${formatDateString(new Date())}</span>
                </div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-card">
                <div class="card-title">Account Holder Details</div>
                <div class="info-row">
                  <span class="info-label">Name</span>
                  <span class="info-value">${uName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Mobile Number</span>
                  <span class="info-value">${uMobile}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email Address</span>
                  <span class="info-value" style="font-size: 10px;">${uEmail}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Nationality / DOB</span>
                  <span class="info-value">${uNationality} / ${uDob}</span>
                </div>
              </div>

              <div class="info-card">
                <div class="card-title">Statement Summary</div>
                <div class="info-row">
                  <span class="info-label">Starting Balance</span>
                  <span class="info-value">${fmt(startingBalance)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total Deposits (Credits)</span>
                  <span class="info-value text-emerald-600" style="color: #10B981;">+${fmt(totalCreditAmount)}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Total DEDUCTIONs (Debits)</span>
                  <span class="info-value text-rose-600" style="color: #EF4444;">-${fmt(totalDebitAmount)}</span>
                </div>
                <div class="info-row" style="border-top: 1.5px solid #0E8F6F; margin-top: 4px; padding-top: 4px;">
                  <span class="info-label" style="font-weight: 700; color: #0F172A;">Closing Balance</span>
                  <span class="info-value" style="font-weight: 800; color: #0E8F6F; font-size: 12px;">${fmt(endingBalance)}</span>
                </div>
              </div>
            </div>

            <div class="table-section-title">Transaction History Ledger</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 14%;">Date</th>
                  <th style="width: 18%;">Transaction ID</th>
                  <th style="width: 25%;">Description</th>
                  <th style="width: 15%;">Method</th>
                  <th class="text-right" style="text-align: right; width: 12%;">Credit (+)</th>
                  <th class="text-right" style="text-align: right; width: 12%;">Debit (-)</th>
                  <th class="text-right" style="text-align: right; width: 14%;">Balance</th>
                </tr>
              </thead>
              <tbody>
                ${bodyRows.length > 0 ? bodyRows : noDataHtml}
              </tbody>
              ${bodyRows.length > 0 ? `
              <tfoot>
                <tr style="font-weight: 800; background: #E2E8F0; border-top: 2px solid #0E8F6F;">
                  <td colspan="4" style="text-align: left; font-weight: 800; color: #0F172A; text-transform: uppercase;">Total Flows</td>
                  <td class="credit text-right" style="color: #10B981; font-weight: 800; text-align: right;">+${fmt(totalCreditAmount)}</td>
                  <td class="debit text-right" style="color: #EF4444; font-weight: 800; text-align: right;">-${fmt(totalDebitAmount)}</td>
                  <td class="balance text-right" style="color: #0E8F6F; font-weight: 800; text-align: right;">${fmt(endingBalance)}</td>
                </tr>
              </tfoot>
              ` : ''}
            </table>

            <div class="footer">
              This statement is a legal computer-generated transaction record processed in A4 format by FleetPro secure bank ledger sync systems. All details are encrypted and verified. © 2026.
            </div>
          </body>
        </html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 400);
    }
  };

  const handleDownloadStatement = () => {
    const filterType = statementFilter === '0' ? 'credit' : statementFilter === '1' ? 'debit' : 'both';
    generateStatementPdf(filterType);
    closeOverlay();
    showFeedback('Statement generated successfully');
  };

  const saveTx = async (tx: any) => {
    const targetUserId = tx.userId || activeLinkedUserId;
    if (targetUserId) {
      const targetUser = (users || []).find((u: any) => u.id === targetUserId);
      const parentCol = targetUser?.role === 'ADMIN' ? 'admins' : 'users';
      const subPath = `${parentCol}/${targetUserId}/walletTransactions`;
      await saveFirebaseDoc(subPath, tx.id, tx);
    }
  };

  // Admin approval flow
  const handleApprovePending = async () => {
    if (!selectedTx) return;
    const approvedTx = {
      ...selectedTx,
      status: 'RECEIVED' as const
    };
    if (isAdmin) {
      // Update local state immediately
      setAdminFetchedTransactions(prev => prev.map(t => t.id === approvedTx.id ? approvedTx : t));
      await saveTx(approvedTx);
    }
    updateWalletTransaction(approvedTx);
    closeOverlay();
    showFeedback('Transaction approved and added to history');
  };

  const handleRejectPending = () => {
    if (!selectedTx) return;
    removeWalletTransaction(selectedTx.id, selectedTx.userId || activeLinkedUserId);
    if (isAdmin) {
      // Update local state immediately
      setAdminFetchedTransactions(prev => prev.filter(t => t.id !== selectedTx.id));
    }
    closeOverlay();
    showFeedback('Pending request rejected');
  };

  const handleDeleteTx = () => {
    if (!selectedTx) return;
    const isBengali = language === 'bn';
    
    // Check if transaction is approved ('RECEIVED') AND logged-in user is NOT an admin
    if (selectedTx.status === 'RECEIVED' && !isAdmin) {
      showFeedback(isBengali ? 'অনুমোদিত লেনদেন মুছে ফেলার অনুমতি নেই' : 'You do not have permission to delete approved transactions');
      return;
    }

    const message = isBengali 
      ? 'আপনি কি নিশ্চিত যে আপনি এই লেনদেনটি মুছে ফেলতে চান?' 
      : 'Are you sure you want to delete this transaction?';
    
    confirmAction(message, () => {
      removeWalletTransaction(selectedTx.id, selectedTx.userId || activeLinkedUserId);
      if (isAdmin) {
        setAdminFetchedTransactions(prev => prev.filter(t => t.id !== selectedTx.id));
      }
      showFeedback(isBengali ? 'লেনদেনটি মুছে ফেলা হয়েছে' : 'Transaction deleted successfully');
      closeOverlay();
    });
  };

  // Edit Pending Request
  const handleEditPending = () => {
    if (!selectedTx) return;
    setEditingId(selectedTx.id);
    const isIncome = selectedTx.type === 'INCOME';
    setAddMoneyForm({
      type: isIncome ? 'INCOME' : 'DEDUCTION',
      source: isIncome ? (selectedTx.details?.source || selectedTx.source || '') : '',
      reason: !isIncome ? (selectedTx.details?.source || selectedTx.source || '') : '',
      date: selectedTx.date || new Date().toISOString().split('T')[0],
      method: selectedTx.method === 'CASH' ? 'Cash' : selectedTx.method === 'ONLINE_BANK' ? 'Bank Transfer' : 'Mobile Banking',
      amount: selectedTx.amount.toString(),
      description: selectedTx.details?.note || selectedTx.desc || ''
    });
    setOverlay('addMoney');
  };

  // Submit Add Money Request
  const handleSubmitAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const isIncome = addMoneyForm.type === 'INCOME';
    const sourceVal = isIncome ? addMoneyForm.source : addMoneyForm.reason;

    if (!addMoneyForm.date || !addMoneyForm.method || !addMoneyForm.amount || !sourceVal) {
      showFeedback('Please fill out all required fields');
      return;
    }

    const mappedMethod = addMoneyForm.method === 'Cash' ? 'CASH' : addMoneyForm.method === 'Bank Transfer' ? 'ONLINE_BANK' : 'MOBILE_BANKING';
    const dateParts = addMoneyForm.date.split('-');
    const amountVal = parseFloat(addMoneyForm.amount);

    if (editingId) {
      const original = userPaymentsList.find(p => p.id === editingId);
      const updatedItem = {
        ...original,
        type: addMoneyForm.type,
        amount: amountVal,
        date: addMoneyForm.date,
        method: mappedMethod,
        category: addMoneyForm.type === 'INCOME' ? 'Add Money' : 'Debit Money',
        details: {
          ...original?.details,
          note: addMoneyForm.description,
          source: sourceVal
        },
        month: parseInt(dateParts[1]),
        year: parseInt(dateParts[0]),
        status: 'PENDING' as const
      };
      if (isAdmin) {
        setAdminFetchedTransactions(prev => prev.map(t => t.id === updatedItem.id ? updatedItem : t));
        saveTx(updatedItem);
      }
      updateWalletTransaction(updatedItem as any);
      showFeedback('Pending request updated successfully');
    } else {
      const generatedId = 'PAY-W' + Math.floor(1000 + Math.random() * 9000);
      const generatedTxId = 'TXN-' + Math.floor(100000 + Math.random() * 900000);
      
      const newReq = {
        id: generatedId,
        transactionId: generatedTxId,
        type: addMoneyForm.type,
        category: addMoneyForm.type === 'INCOME' ? 'Add Money' : 'Debit Money',
        amount: amountVal,
        date: addMoneyForm.date,
        time: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
        details: {
          note: addMoneyForm.description || (addMoneyForm.type === 'INCOME' ? 'Add money request' : 'Debit money request'),
          source: sourceVal
        },
        method: mappedMethod,
        status: 'PENDING' as const,
        userId: activeLinkedUserId || currentUserId || 'default_user',
        month: parseInt(dateParts[1]),
        year: parseInt(dateParts[0])
      };
      addWalletTransaction(newReq as any);
      if (isAdmin) {
        setAdminFetchedTransactions(prev => [newReq, ...prev]);
      }
      showFeedback('Request submitted. Awaiting Admin approval.');
    }

    // Reset Form
    setAddMoneyForm({
      type: 'INCOME',
      source: '',
      reason: '',
      date: new Date().toISOString().split('T')[0],
      method: '',
      amount: '',
      description: ''
    });
    closeOverlay();
    setActiveTab('pending');
  };

  const renderTxCard = (tx: any, isPending: boolean = false) => {
    const isCredit = tx.type === 'INCOME';
    const typeLabel = isCredit ? 'Credit' : 'Debit';
    const sign = isCredit ? '+' : '-';
    const cleanedId = String(tx.transactionId || tx.id).replace(/^TXN-/, '');
    
    // Dynamically resolve avatar
    const targetUserId = tx.userId || activeLinkedUserId;
    const txUser = targetUserId ? (users || []).find((u: any) => u.id === targetUserId) || walletConfig?.linkedUsers?.[targetUserId] : null;
    const resolvedAvatar = txUser?.avatar || AVATAR;
    
    return (
      <button key={tx.id} id={`tx-card-${tx.id}`} className={`tx-card ${isPending ? 'pending' : ''}`} onClick={() => handleTxClick(tx, isPending)}>
        <img className="tx-avatar" src={resolvedAvatar} alt="avatar" />
        <div className="tx-content-wrapper">
          <div className="tx-top-row">
            <span className={`tx-type-label is-${isCredit ? 'credit' : 'debit'}`}>
              {typeLabel} : <span className="tx-date-value">{fmtDate(tx.date)}</span>
            </span>
            <span className={`tx-amount is-${isCredit ? 'credit' : 'debit'}`}>{sign}{fmt(tx.amount)}</span>
          </div>
          <div className="tx-divider-line"></div>
          <div className="tx-bottom-row">
            <div className="tx-id">ID: {cleanedId}</div>
            {isPending && <div className="pending-badge">AWAITING APPROVAL</div>}
          </div>
        </div>
      </button>
    );
  };

  const renderList = (list: any[], isPending: boolean = false) => {
    if (!list.length) {
      return (
        <div className="empty-state">
          {isPending ? 'No pending requests right now.' : 'No transactions to show.'}
        </div>
      );
    }
    // Return sorted descending by date
    const sorted = list.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.map(tx => renderTxCard(tx, isPending));
  };

  // Check if wallet config is loaded
  const isLoaded = walletConfig !== null;
  const isLinkedUser = useMemo(() => {
    return linkedUserIds.map(String).includes(String(currentUserId));
  }, [linkedUserIds, currentUserId]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent)]" />
      </div>
    );
  }

  // Render Access Restricted Screen if not Admin and not the Linked User
  if (!isAdmin && !isLinkedUser) {
    const isBengali = language === 'bn';
    const isDark = (isNightMode || appThemeMode === 'dark' || isDarkMode);
    return (
      <div 
        className="absolute inset-0 w-full h-full flex items-center justify-center px-4 font-sans"
        style={{ background: 'transparent' }}
      >
        <div className={`w-full max-w-md backdrop-blur-xl border p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden rounded-3xl ${
          isDark
            ? 'bg-[#001F35]/80 border-white/10'
            : 'bg-white/95 border-[#BDD5DB]/80 shadow-lg shadow-black/5'
        }`}>
          {/* Ambient Glow Background */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--accent)] opacity-20 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--gold)] opacity-20 blur-3xl rounded-full" />
          
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${
            isDark 
              ? 'bg-gradient-to-tr from-[var(--accent)] to-[var(--gold)] text-[#08110D] shadow-[var(--accent)]/20' 
              : 'bg-gradient-to-tr from-[#159938] to-[#C9A24B] text-white shadow-[#159938]/20'
          }`}>
            <Lock size={36} className="animate-pulse" />
          </div>
          
          <h2 className={`text-2xl font-extrabold mb-3 tracking-tight ${
            isDark ? 'text-white' : 'text-[#12161C]'
          }`}>
            {isBengali ? "অ্যাক্সেস সংরক্ষিত" : "Access Restricted"}
          </h2>
          
          <p className={`text-sm mb-6 leading-relaxed ${
            isDark ? 'text-white/70' : 'text-[#12161C]/70'
          }`}>
            {isBengali 
              ? "আপনার অ্যাকাউন্টটি এই ওয়ালেট মডিউলের সাথে লিংকড নয়। শুধুমাত্র নির্ধারিত ব্যবহারকারীই এই ওয়ালেট অ্যাক্সেস করতে পারবেন। অনুগ্রহ করে অ্যাক্সেস পেতে অ্যাডমিনের সাথে যোগাযোগ করুন।" 
              : "Your account is not linked to this Wallet module. Only the designated user has wallet access. Please contact your administrator to grant access."}
          </p>

          {walletConfig?.linkedUserName && (
            <div className={`w-full border rounded-2xl p-4 mb-6 ${
              isDark
                ? 'bg-white/5 border-white/10'
                : 'bg-[#E1ECE8] border-[#BDD5DB]'
            }`}>
              <span className={`text-[10px] block mb-1 uppercase tracking-wider font-extrabold ${
                isDark ? 'text-white/40' : 'text-[#12161C]/50'
              }`}>
                {isBengali ? "বর্তমান লিংকড ইউজার:" : "Currently Linked User:"}
              </span>
              <span className={`text-base font-black ${
                isDark ? 'text-[var(--gold)]' : 'text-[#159938]'
              }`}>
                {walletConfig.linkedUserName}
              </span>
            </div>
          )}

          <button 
            onClick={() => setView?.('DASHBOARD')} 
            className={`w-full py-3.5 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 border shadow-sm ${
              isDark
                ? 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
                : 'bg-[#159938] hover:bg-[#12802f] border-transparent text-white'
            }`}
          >
            {isBengali ? "ড্যাশবোর্ডে ফিরে যান" : "Go to Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="wallet-module w-full h-full relative font-sans"
      style={{ background: 'transparent' }}
    >
      {!activeSection ? (
        <div 
          key="main-wallet"
          className="absolute inset-0 w-full h-full overflow-y-auto px-global pt-global pb-[calc(76px+env(safe-area-inset-bottom)+80px)] space-y-4"
        >

            {/* ADMIN USER SELECTOR DROPDOWN */}
            {isAdmin && linkedUserIds.length > 0 && (
              <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 mb-2">
                <span className="text-xs font-bold text-white/60 uppercase tracking-wider">
                  {language === 'bn' ? 'ইউজার ওয়ালেট পরিবর্তন করুন:' : 'Switch Wallet User:'}
                </span>
                <div className="relative">
                  <select 
                    value={activeLinkedUserId || ''} 
                    onChange={(e) => setAdminSelectedUserId(e.target.value)}
                    className="w-full py-3 px-4 rounded-xl bg-white/10 text-white font-bold border border-white/10 focus:outline-none focus:border-[var(--accent)]"
                  >
                    {linkedUserIds.map((id) => {
                      const u = (users || []).find((u: any) => String(u.id) === String(id)) || walletConfig?.linkedUsers?.[id];
                      return (
                        <option key={id} value={id} className="text-[#12161C] bg-white">
                          {u?.name || id} (ID: {id})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            {/* SUMMARY CARD */}
            <section id="wallet-summary-card" className="summary-card" style={{ background: '#0A4A70', backgroundColor: '#0A4A70' }}>
              <div className="summary-head">
                <span className="text-sm font-semibold text-white/90">Wallet Summary</span>
                <button className="icon-btn" onClick={() => setOverlay('statement')} aria-label="Download statement">
                  <Download size={18} />
                </button>
              </div>

              <div className="summary-metrics">
                <button className="metric-tile" onClick={() => { setNavigationDirection('forward'); setActiveSection('BALANCE_SUBPAGE'); }}>
                  <span className="metric-label">Available Balance</span>
                  <span className="metric-value">{fmt(balance)}</span>
                </button>
              </div>
            </section>

            {/* TRANSACTION HISTORY & PENDING TABS */}
            <section className="section-block">
              <div className="section-head-tabs flex items-center gap-6 mb-5 border-b border-[var(--border)] pb-2">
                <button 
                  onClick={() => setActiveTab('history')}
                  className={`text-[17px] font-bold transition-all relative pb-2.5 ${activeTab === 'history' ? 'text-[var(--accent)] font-extrabold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  Transaction History
                  {activeTab === 'history' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--accent)] rounded-full" />
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('pending')}
                  className={`text-[17px] font-bold transition-all relative pb-2.5 flex items-center gap-[6px] ${activeTab === 'pending' ? 'text-[var(--gold)] font-extrabold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Pending
                  {pendingList.length > 0 && (
                    <span className="pending-tab-badge animate-pulse">
                      {pendingList.length}
                    </span>
                  )}
                  {activeTab === 'pending' && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--gold)] rounded-full" />
                  )}
                </button>
              </div>

              <div className="tx-list">
                {activeTab === 'history' ? (
                  renderList(filteredApprovedList, false)
                ) : (
                  renderList(pendingList, true)
                )}
              </div>
            </section>
          </div>
        ) : activeSection === 'DEPOSIT_SUBPAGE' ? (
          <div 
            key="deposit-subpage"
            className="absolute inset-0 w-full h-full z-50 flex flex-col"
            style={{ background: (isNightMode || appThemeMode === 'dark' || isDarkMode) ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg)')) }}
          >
            <div className="flex-1 overflow-y-auto px-global pt-global pb-28">
              <div className="tx-list">
                {/* As specified, displays credited transactions history */}
                {renderList(filteredApprovedList.filter(t => t.type === 'INCOME'))}
              </div>
            </div>
            
            {/* Pinned bottom Available Balance dynamic summary card */}
            <div className="absolute left-4 right-4 sm:left-6 sm:right-6 lg:left-8 lg:right-8 bottom-[calc(76px+env(safe-area-inset-bottom)+16px)] p-5 flex items-center justify-between shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-white/5 z-20 !rounded-[10px]" style={{ backgroundColor: (isNightMode || appThemeMode === 'dark' || isDarkMode) ? '#121212' : '#BDD5DB' }}>
              <span className="text-sm font-semibold" style={{ color: (isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'rgba(255,255,255,0.8)' : '#333' }}>Available Balance</span>
              <span className="text-xl font-extrabold" style={{ color: (isNightMode || appThemeMode === 'dark' || isDarkMode) ? '#fff' : '#000' }}>{fmt(balance)}</span>
            </div>
          </div>
        ) : activeSection === 'BALANCE_SUBPAGE' ? (
          <div 
            key="balance-subpage"
            className="absolute inset-0 w-full h-full z-50 flex flex-col"
            style={{ background: (isNightMode || appThemeMode === 'dark' || isDarkMode) ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg)')) }}
          >
            <div className="flex-1 overflow-y-auto px-global pt-global pb-28">
              {/* Modern Grid of side-by-side Balance Summary Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button 
                  onClick={() => { setBalanceTab('credit'); setIsManualFilterApplied(false); }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    balanceTab === 'credit' 
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/5' 
                      : ((isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#BDD5DB] hover:bg-gray-50')
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${balanceTab === 'credit' ? 'text-emerald-400' : 'text-gray-400'}`}>
                      {language === 'bn' ? 'মোট ক্রেডিট' : 'Total Credit'}
                    </span>
                    <div className={`p-1.5 rounded-lg ${balanceTab === 'credit' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      <CreditCard size={16} />
                    </div>
                  </div>
                  <span className={`text-lg font-extrabold truncate ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'text-white' : 'text-gray-900'}`}>
                    {fmt(listTotalCredit)}
                  </span>
                </button>

                <button 
                  onClick={() => { setBalanceTab('debit'); setIsManualFilterApplied(false); }}
                  className={`p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                    balanceTab === 'debit' 
                      ? 'bg-rose-500/10 border-rose-500 shadow-lg shadow-rose-500/5' 
                      : ((isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#BDD5DB] hover:bg-gray-50')
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider ${balanceTab === 'debit' ? 'text-rose-400' : 'text-gray-400'}`}>
                      {language === 'bn' ? 'মোট ডেবিট' : 'Total Debit'}
                    </span>
                    <div className={`p-1.5 rounded-lg ${balanceTab === 'debit' ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-500/10 text-gray-400'}`}>
                      <CreditCard size={16} />
                    </div>
                  </div>
                  <span className={`text-lg font-extrabold truncate ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'text-white' : 'text-gray-900'}`}>
                    {fmt(listTotalDebit)}
                  </span>
                </button>
              </div>

              {/* Statement Card below them */}
              <button 
                onClick={() => setOverlay('statement')}
                className={`w-full p-4 mb-6 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between ${
                  (isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-[#BDD5DB] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className={`font-bold text-sm ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'bn' ? 'অ্যাকাউন্ট স্টেটমেন্ট' : 'Account Statement'}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {language === 'bn' ? 'পিডিএফ স্টেটমেন্ট ডাউনলোড করুন (৩ মাস, ৬ মাস, ১ বছর)' : 'Download PDF Statement (3m, 6m, 1y)'}
                    </p>
                  </div>
                </div>
                <div className={`p-1.5 rounded-lg ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Download size={16} />
                </div>
              </button>

              <div className="tab-panes mt-4">
                {balanceTab === 'debit' ? (
                  <div className="tx-list">
                    {renderList(filteredApprovedList.filter(t => t.type === 'DEDUCTION'))}
                  </div>
                ) : (
                  <div className="tx-list">
                    {renderList(filteredApprovedList.filter(t => t.type === 'INCOME'))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeSection === 'LINK_USER' ? (
          <div 
            key="link-user-subpage"
            className="absolute inset-0 w-full h-full z-50 flex flex-col"
            style={{ background: (isNightMode || appThemeMode === 'dark' || isDarkMode) ? "var(--page-bg-solid, #000000)" : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg)')) }}
          >
            <div className="flex-1 overflow-y-auto px-global pt-global pb-[calc(76px+env(safe-area-inset-bottom)+40px)] space-y-6">
              
              {/* Toggle Card */}
              <div className={`relative p-1 flex w-full rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                (isNightMode || appThemeMode === 'dark' || isDarkMode) 
                  ? 'bg-[#121212]/80 border-white/5' 
                  : 'bg-[#E1ECE8] border-[#BDD5DB]/30'
              }`}>
                {/* Sliding indicator */}
                <div
                  className="absolute inset-y-1 rounded-xl shadow-md z-0"
                  
                  
                  
                />

                <button 
                  onClick={() => setLinkTab('link')}
                  className={`relative z-10 flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 outline-none ${
                    linkTab === 'link'
                      ? 'text-white'
                      : (isNightMode || appThemeMode === 'dark' || isDarkMode)
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-[#12161C]/60 hover:text-[#12161C] hover:bg-black/5'
                  }`}
                >
                  <UserCheck size={18} />
                  <span>{language === 'bn' ? 'লিঙ্কড ইউজার (Link User)' : 'Link User'}</span>
                </button>

                <button 
                  onClick={() => setLinkTab('unlink')}
                  className={`relative z-10 flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 outline-none ${
                    linkTab === 'unlink'
                      ? 'text-white'
                      : (isNightMode || appThemeMode === 'dark' || isDarkMode)
                        ? 'text-white/60 hover:text-white hover:bg-white/5'
                        : 'text-[#12161C]/60 hover:text-[#12161C] hover:bg-black/5'
                  }`}
                >
                  <UserX size={18} />
                  <span>{language === 'bn' ? 'আনলিঙ্কড ইউজার (Unlink User)' : 'Unlink User'}</span>
                </button>
              </div>

              {linkTab === 'link' ? (
                <div className="space-y-4">
                  {linkedUserIds.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wider opacity-60 pl-1">
                        {language === 'bn' ? `লিঙ্কড ইউজার তালিকা (${linkedUserIds.length})` : `Linked Users List (${linkedUserIds.length})`}
                      </p>
                      {linkedUserIds.map((id) => {
                        const u = (users || []).find((u: any) => String(u.id) === String(id)) || 
                                  (walletConfig?.linkedUsers?.[id]) || {
                                    id,
                                    name: 'Linked User',
                                    email: '',
                                    avatar: '',
                                    mobileNumber: '',
                                    companyName: ''
                                  };
                        return (
                          <div 
                            key={id}
                            className={`p-5 rounded-2xl border relative overflow-hidden ${
                              (isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-[#121212]/80 border-white/10' : 'bg-white border-[#BDD5DB] shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--gold)] flex items-center justify-center text-[#08110D] shadow-md overflow-hidden shrink-0">
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name || 'avatar'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <User size={24} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className={`font-black text-base truncate ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'text-white' : 'text-[#12161C]'}`}>
                                    {u.name}
                                  </h4>
                                  <span className={`text-xs block mt-0.5 opacity-70 ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'text-white' : 'text-[#12161C]'}`}>
                                    ID: {id}
                                  </span>
                                </div>
                              </div>
                              
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-gradient-to-r from-[#159938] to-[#0e8f6f] text-white">
                                {language === 'bn' ? 'লিঙ্কড' : 'Linked'}
                              </span>
                            </div>

                            <div className={`mt-4 space-y-2 text-xs p-3.5 rounded-xl ${
                              (isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-white/5' : 'bg-black/5'
                            }`}>
                              {u.mobileNumber && (
                                <div className="flex justify-between">
                                  <span className="opacity-60">{language === 'bn' ? 'মোবাইল:' : 'Mobile:'}</span>
                                  <span className="font-bold">{u.mobileNumber}</span>
                                </div>
                              )}
                              {u.email && (
                                <div className="flex justify-between">
                                  <span className="opacity-60">{language === 'bn' ? 'ইমেইল:' : 'Email:'}</span>
                                  <span className="font-bold">{u.email}</span>
                                </div>
                              )}
                              {u.companyName && (
                                <div className="flex justify-between">
                                  <span className="opacity-60">{language === 'bn' ? 'কোম্পানি/পেশা:' : 'Company/Job:'}</span>
                                  <span className="font-bold">{u.companyName}</span>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleUnlinkUser(id)}
                              className="mt-4 w-full py-2.5 bg-gradient-to-r from-[#ea4335] to-[#f43f5e] hover:brightness-110 active:scale-98 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                              <UserX size={14} />
                              <span>{language === 'bn' ? 'ইউজার আনলিঙ্ক করুন' : 'Unlink User Access'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={`text-center py-16 rounded-2xl border ${
                      (isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-[#001F35]/50 border-white/5 text-white/50' : 'bg-white/50 border-[#BDD5DB]/50 text-[#12161C]/50'
                    }`}>
                      <UserX size={44} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-semibold">
                        {language === 'bn' ? 'কোনো লিঙ্কড ইউজার পাওয়া যায়নি' : 'No user currently linked'}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {language === 'bn' ? 'ওয়ালেট অ্যাক্সেস দিতে প্রথমে কোনো ইউজার লিঙ্ক করুন' : 'Go to Unlink User tab to link a new user'}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Unlink User View (now lists unlinked users) */
                <div className="space-y-4">
                  {/* Search Bar with Floating Label */}
                  <div 
                    className={`relative flex items-center rounded-2xl px-4 border transition-all duration-300 ${
                      isSearchFocused ? 'shadow-lg' : ''
                    }`}
                    style={{
                      borderColor: isSearchFocused 
                        ? 'var(--accent)' 
                        : (isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.35)',
                      backgroundColor: 'transparent',
                      boxShadow: isSearchFocused 
                        ? ((isNightMode || appThemeMode === 'dark' || isDarkMode) 
                            ? '0 10px 25px -5px rgba(47, 217, 166, 0.15)' 
                            : '0 10px 25px -5px rgba(14, 143, 111, 0.12)') 
                        : 'none'
                    }}
                  >
                    <Search 
                      size={18} 
                      className="mr-3 shrink-0 transition-colors duration-200" 
                      style={{ color: isSearchFocused ? 'var(--accent)' : 'var(--text-muted)' }}
                    />
                    
                    <div className="relative flex-1 py-3.5 simple-input-container">
                      <input 
                        id="wallet-user-search"
                        type="text"
                        placeholder={isSearchFocused ? (language === 'bn' ? 'নাম, মোবাইল বা আইডি দিয়ে সার্চ করুন...' : 'Name, Mobile, or ID...') : ''}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="bg-transparent text-sm w-full font-semibold pt-2 text-current"
                        style={{
                          border: 'none',
                          outline: 'none',
                          boxShadow: 'none',
                          padding: '8px 0 0 0',
                          margin: 0,
                          background: 'transparent'
                        }}
                      />
                      
                      <label 
                        htmlFor="wallet-user-search"
                        className={`absolute pointer-events-none transition-all duration-200 font-bold z-10 ${
                          isSearchFocused || searchQuery
                            ? 'text-[11px] top-0 -translate-y-1/2 left-2 px-1.5 opacity-100'
                            : 'text-xs sm:text-sm left-2 top-1/2 -translate-y-1/2 opacity-60'
                        }`}
                        style={{
                          color: isSearchFocused ? 'var(--accent)' : 'var(--text-muted)',
                          background: isSearchFocused || searchQuery 
                            ? ((isNightMode || appThemeMode === 'dark' || isDarkMode) ? '#000000' : (backgroundColor || 'var(--app-bg)')) 
                            : 'transparent'
                        }}
                      >
                        {language === 'bn' ? 'খুঁজুন (Search by)' : 'Search by'}
                      </label>
                    </div>

                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')} 
                        className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full ml-2 text-current" 
                        aria-label="Clear search"
                        style={{ border: 'none', outline: 'none' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Unlinked Users List */}
                  <div className="space-y-3">
                    {filteredUnlinkedUsers.length === 0 ? (
                      <div className={`text-center py-12 rounded-2xl border ${
                        (isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'bg-[#001F35]/50 border-white/5 text-white/50' : 'bg-white/50 border-[#BDD5DB]/50 text-[#12161C]/50'
                      }`}>
                        <X size={40} className="mx-auto mb-3 opacity-30 text-red-500" />
                        <p className="text-sm font-semibold">
                          {language === 'bn' ? 'কোনো আনলিঙ্কড ইউজার পাওয়া যায়নি' : 'No unlinked users found'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-xs font-bold uppercase tracking-wider opacity-60 pl-1">
                          {language === 'bn' ? `আনলিঙ্কড ইউজার তালিকা (${filteredUnlinkedUsers.length})` : `Unlinked Users List (${filteredUnlinkedUsers.length})`}
                        </p>
                        {filteredUnlinkedUsers.map((u) => {
                          return (
                            <div 
                              key={u.id}
                              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                (isNightMode || appThemeMode === 'dark' || isDarkMode)
                                  ? 'bg-[#121212]/60 border-white/5 hover:bg-[#121212]/90'
                                  : 'bg-white border-[#BDD5DB] hover:bg-[#F3F7F5]'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[#08110D] overflow-hidden shrink-0 bg-gradient-to-tr from-[var(--gold)] to-[var(--accent)]`}>
                                  {u.avatar ? (
                                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    u.name ? u.name.charAt(0).toUpperCase() : 'U'
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className={`font-bold text-sm block truncate ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'text-white' : 'text-[#12161C]'}`}>
                                    {u.name}
                                  </span>
                                  <span className={`text-xs block truncate ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'text-white/60' : 'text-[#12161C]/60'}`}>
                                    ID: {u.id} • {u.email || u.loginEmail || 'No Email'}
                                  </span>
                                  {u.mobileNumber && (
                                    <span className={`text-[10px] block mt-0.5 ${(isNightMode || appThemeMode === 'dark' || isDarkMode) ? 'text-white/40' : 'text-[#12161C]/40'}`}>
                                      {u.mobileNumber}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                onClick={() => handleSelectUser(u)}
                                className="px-4 py-2 bg-[#159938] hover:bg-[#12802f] text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-sm shrink-0"
                              >
                                {language === 'bn' ? 'লিঙ্ক করুন' : 'Link Wallet'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : null}
      
      {/* FLOATING ACTION BUTTONS ABOVE SAFE AREA */}
      {!activeSection && (
        isAdmin ? (
          <button 
            id="btn-admin-plus-trigger"
            className="admin-plus-btn fixed left-1/2 -translate-x-1/2 flex items-center justify-center bg-gradient-to-r from-[var(--accent)] to-[var(--gold)] text-[#08110D] w-14 h-14 rounded-full font-bold shadow-lg z-40 transition-transform active:scale-95 hover:brightness-110" 
            style={{ bottom: 'calc(76px + env(safe-area-inset-bottom) + 16px)' }} 
            onClick={() => setOverlay('userSelection')}
            aria-label="Select User for Wallet Access"
            title={language === 'bn' ? "ওয়ালেট অ্যাক্সেসের জন্য ইউজার নির্বাচন করুন" : "Select User for Wallet Access"}
          >
            <Plus size={28} />
          </button>
        ) : (
          <button 
            id="btn-add-money-trigger"
            className="fab-btn" 
            onClick={() => setOverlay('addMoney')}
            aria-label="Add Money"
            title={language === 'bn' ? "টাকা যোগ করুন" : "Add Money"}
          >
            <Plus size={28} />
          </button>
        )
      )}

      {/* MODAL POPUPS (WITH BLURRED BACKDROP) */}
      {createPortal(
        <div className="wallet-module">
          <div className={`overlay ${overlay ? 'open' : ''} backdrop-blur-md`} onClick={(e) => { if (e.target === e.currentTarget) closeOverlay(); }}>
        
        {/* USER ACCESS SELECTION MODAL */}
        {overlay === 'userSelection' && (
          <div className="modal max-h-[85vh] flex flex-col" id="modal-user-selection" style={{ minWidth: '320px', maxWidth: '480px' }}>
            <div className="modal-header border-b border-white/10 pb-4">
              <h3 className="text-lg font-black tracking-tight text-[var(--text-primary)]">
                {language === 'bn' ? "ওয়ালেট অ্যাক্সেস নিয়ন্ত্রণ" : "Select User for Wallet Access"}
              </h3>
              <button className="modal-close p-1 hover:bg-white/5 rounded-full transition-all" onClick={closeOverlay} aria-label="Close modal">
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">
                {language === 'bn' ? "যে ইউজারকে সিলেক্ট করবেন, শুধুমাত্র সেই ইউজারই তার অ্যাকাউন্ট থেকে ওয়ালেট মডিউল অ্যাক্সেস করতে পারবে এবং তার প্রোফাইল তথ্য ওয়ালেটে সিঙ্ক হবে।" : "Selecting a user links their profile information and authorizes only that specific user to access the Wallet from their device."}
              </p>
              
              <div className="space-y-2">
                {users?.filter(u => u.role !== 'ADMIN').length === 0 ? (
                  <div className="text-center py-8 text-[var(--text-muted)] text-sm">
                    {language === 'bn' ? "কোনো সাধারণ ইউজার পাওয়া যায়নি।" : "No standard users found."}
                  </div>
                ) : (
                  users?.filter(u => u.role !== 'ADMIN').map((u) => {
                    const isSelected = linkedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group ${
                          isSelected 
                            ? 'bg-[var(--accent)]/15 border-[var(--accent)]' 
                            : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-[#08110D] overflow-hidden shrink-0 ${
                            isSelected ? 'bg-[var(--accent)]' : 'bg-gradient-to-tr from-[var(--gold)] to-[var(--accent)]'
                          }`}>
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              u.name ? u.name.charAt(0).toUpperCase() : 'U'
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-sm text-[var(--text-primary)] block group-hover:text-[var(--accent)] transition-all">
                              {u.name}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)] block truncate max-w-[200px]">
                              {u.email || u.loginEmail || 'No Email'}
                            </span>
                            {u.mobileNumber && (
                              <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                                {u.mobileNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center text-[#08110D]">
                            <UserCheck size={14} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            
            <div className="modal-footer border-t border-white/10 pt-4 flex gap-3">
              <button 
                type="button"
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[var(--text-primary)] font-bold transition-all text-sm active:scale-98" 
                onClick={closeOverlay}
              >
                {language === 'bn' ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        )}

        {/* STATEMENT DOWNLOAD MODAL */}
        {overlay === 'statement' && (
          <div 
            className="modal flex flex-col p-0 overflow-hidden bg-white text-slate-900 shadow-2xl" 
            id="modal-statement" 
            style={{ 
              minWidth: '340px', 
              maxWidth: '420px', 
              borderRadius: '24px', 
              backgroundColor: '#ffffff', 
              color: '#0f172a' 
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-4 p-6 pb-4 border-b border-slate-100 bg-white relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0E8F6F] to-[#C9A24B] flex items-center justify-center text-white shadow-md">
                <FileText size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">
                  {language === 'bn' ? "অ্যাকাউন্ট স্টেটমেন্ট" : "Account Statement"}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'bn' ? "আপনার ট্রানজেকশন পিডিএফ রিপোর্ট" : "Generate secure PDF transaction ledger"}
                </p>
              </div>
              <button 
                className="absolute top-6 right-6 p-1.5 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600" 
                onClick={closeOverlay} 
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-5 space-y-6 bg-white">
              {/* Period selection grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar size={11} className="text-[#0E8F6F]" />
                  {language === 'bn' ? 'সময়কাল নির্বাচন করুন' : 'Select Period'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: '3_months', labelEn: '3 Months', labelBn: '৩ মাস', descEn: 'Last 90 days', descBn: 'গত ৯০ দিন' },
                    { id: '6_months', labelEn: '6 Months', labelBn: '৬ মাস', descEn: 'Last 180 days', descBn: 'গত ১৮০ দিন' },
                    { id: '1_year', labelEn: '1 Year', labelBn: '১ বছর', descEn: 'Last 365 days', descBn: 'গত ৩৬৫ দিন' },
                    { id: 'custom', labelEn: 'Custom Range', labelBn: 'কাস্টম রেঞ্জ', descEn: 'Choose dates', descBn: 'তারিখ নির্বাচন' }
                  ].map((p) => {
                    const isSelected = statementPeriod === p.id;
                    return (
                      <button 
                        key={p.id}
                        type="button" 
                        onClick={() => handleSelectPeriod(p.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between overflow-hidden group ${
                          isSelected 
                            ? 'bg-[#E7F6F2] border-[#0E8F6F] text-[#0E8F6F] shadow-sm shadow-[#0E8F6F]/5' 
                            : 'bg-slate-50 border-slate-100 hover:bg-slate-100 hover:border-slate-200 text-slate-600'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#0E8F6F]" />
                        )}
                        <span className={`font-black text-xs tracking-tight ${isSelected ? 'text-[#0E8F6F]' : 'text-slate-800'}`}>
                          {language === 'bn' ? p.labelBn : p.labelEn}
                        </span>
                        <span className={`text-[9px] mt-0.5 block ${isSelected ? 'text-[#0E8F6F]/70' : 'text-slate-400'}`}>
                          {language === 'bn' ? p.descBn : p.descEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Date Pickers */}
              {statementPeriod === 'custom' && (
                <div className="grid grid-cols-2 gap-3.5 p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                    </label>
                    <div 
                      onClick={() => setWalletPicker({
                        open: true,
                        type: 'start',
                        value: statementStartDate,
                        title: language === 'bn' ? 'শুরুর তারিখ নির্বাচন' : 'Select Start Date'
                      })}
                      className="w-full p-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900 cursor-pointer flex items-center justify-between shadow-2xs hover:border-[#0E8F6F] transition-all select-none"
                    >
                      <span>{statementStartDate || '--'}</span>
                      <Calendar size={14} className="text-slate-400" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                      {language === 'bn' ? 'শেষ তারিখ' : 'End Date'}
                    </label>
                    <div 
                      onClick={() => setWalletPicker({
                        open: true,
                        type: 'end',
                        value: statementEndDate,
                        title: language === 'bn' ? 'শেষ তারিখ নির্বাচন' : 'Select End Date'
                      })}
                      className="w-full p-2.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-900 cursor-pointer flex items-center justify-between shadow-2xs hover:border-[#0E8F6F] transition-all select-none"
                    >
                      <span>{statementEndDate || '--'}</span>
                      <Calendar size={14} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction types */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <CreditCard size={11} className="text-[#0E8F6F]" />
                  {language === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type'}
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/40">
                  {[
                    { id: '2', labelEn: 'Both', labelBn: 'উভয়', activeClass: 'bg-white border-slate-200 text-slate-900 font-black shadow-sm' },
                    { id: '0', labelEn: 'Credit', labelBn: 'ক্রেডিট', activeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700 font-black shadow-sm' },
                    { id: '1', labelEn: 'Debit', labelBn: 'ডেবিট', activeClass: 'bg-rose-50 border-rose-200 text-rose-700 font-black shadow-sm' }
                  ].map((f) => {
                    const isSelected = statementFilter === f.id;
                    return (
                      <button 
                        key={f.id}
                        type="button" 
                        onClick={() => setStatementFilter(f.id as any)}
                        className={`py-2 rounded-xl font-bold text-xs border transition-all text-center ${
                          isSelected 
                            ? `${f.activeClass}` 
                            : 'border-transparent text-slate-500 bg-transparent hover:bg-white/50'
                        }`}
                      >
                        {language === 'bn' ? f.labelBn : f.labelEn}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-6 pt-2 border-t border-slate-100 bg-white">
              <button 
                id="btn-download-statement" 
                type="button"
                className="w-full py-3.5 bg-[#0E8F6F] hover:bg-[#0c7d61] text-white font-black tracking-tight rounded-2xl text-sm transition-all active:scale-95 hover:brightness-110 shadow-lg shadow-[#0E8F6F]/10 flex items-center justify-center gap-2" 
                onClick={handleDownloadStatement}
              >
                <Download size={15} strokeWidth={3} />
                <span>{language === 'bn' ? "ডাউনলোড" : "Download"}</span>
              </button>
            </div>
          </div>
        )}

        {/* TX DETAIL MODAL */}
        {overlay === 'txDetail' && selectedTx && (
          <div className="modal" id="modal-tx-detail">
            <div className="modal-header">
              <h3>{selectedTx.type === 'INCOME' ? 'Credit' : 'Debit'} Transaction</h3>
              <button className="modal-close" onClick={closeOverlay} aria-label="Close modal"><X size={16} /></button>
            </div>
            <div className="modal-body text-[13.5px]">
              <div className="flex justify-between py-2 border-b border-[var(--border)]"><span className="text-[var(--text-secondary)]">Transaction ID</span><span className="font-bold">{selectedTx.transactionId || selectedTx.id}</span></div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]"><span className="text-[var(--text-secondary)]">Amount</span><span className="font-bold">{selectedTx.type === 'INCOME' ? '+' : '-'}{fmt(selectedTx.amount)}</span></div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]"><span className="text-[var(--text-secondary)]">Date</span><span className="font-bold">{fmtDate(selectedTx.date)}</span></div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]"><span className="text-[var(--text-secondary)]">Payment Method</span><span className="font-bold">{selectedTx.method === 'ONLINE_BANK' ? 'Bank Transfer' : selectedTx.method === 'MOBILE_BANKING' ? 'Mobile Banking' : 'Cash'}</span></div>
              <div className="flex justify-between py-2 border-b border-[var(--border)]"><span className="text-[var(--text-secondary)]">Description</span><span className="font-bold">{selectedTx.details?.note || selectedTx.desc || 'No description provided'}</span></div>
            </div>
            <div className="modal-footer flex gap-3">
              {isAdmin && (
                <button id="btn-tx-delete" className="btn btn-danger flex-1" onClick={handleDeleteTx}>
                  {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                </button>
              )}
              <button id="btn-tx-download" className="btn btn-primary flex-1" onClick={() => generateStatementPdf(selectedTx.type === 'INCOME' ? 'credit' : 'debit', new Date(selectedTx.date).getMonth().toString(), new Date(selectedTx.date).getFullYear().toString())}>
                {language === 'bn' ? 'ডাউনলোড' : 'Download'}
              </button>
              <button id="btn-tx-close" className="btn btn-secondary flex-1" onClick={closeOverlay}>
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        )}

        {/* PENDING DETAIL MODAL */}
        {overlay === 'pendingDetail' && selectedTx && (
          <div className="modal" id="modal-pending-detail">
            <div className="modal-header">
              <h3>Pending Request</h3>
              <button className="modal-edit-icon absolute right-16" onClick={handleEditPending} aria-label="Edit pending"><Edit2 size={15} /></button>
              <button className="modal-close" onClick={closeOverlay} aria-label="Close modal"><X size={16} /></button>
            </div>
            <div className="modal-body addmoney-body text-[13.5px]">
              <div className="flex justify-between py-2 border-b border-black/10 dark:border-white/10"><span className="text-[var(--text-secondary)]">Transaction ID</span><span className="font-bold">{selectedTx.transactionId || selectedTx.id}</span></div>
              <div className="flex justify-between py-2 border-b border-black/10 dark:border-white/10"><span className="text-[var(--text-secondary)]">Type</span><span className="font-bold">{selectedTx.type === 'INCOME' ? 'Credit' : 'Debit'}</span></div>
              <div className="flex justify-between py-2 border-b border-black/10 dark:border-white/10"><span className="text-[var(--text-secondary)]">Amount</span><span className="font-bold">{fmt(selectedTx.amount)}</span></div>
              <div className="flex justify-between py-2 border-b border-black/10 dark:border-white/10"><span className="text-[var(--text-secondary)]">Date</span><span className="font-bold">{fmtDate(selectedTx.date)}</span></div>
              <div className="flex justify-between py-2 border-b border-black/10 dark:border-white/10"><span className="text-[var(--text-secondary)]">Payment Method</span><span className="font-bold">{selectedTx.method === 'ONLINE_BANK' ? 'Bank Transfer' : selectedTx.method === 'MOBILE_BANKING' ? 'Mobile Banking' : 'Cash'}</span></div>
              {(selectedTx.details?.source || selectedTx.source) && <div className="flex justify-between py-2 border-b border-black/10 dark:border-white/10"><span className="text-[var(--text-secondary)]">Source of Income</span><span className="font-bold">{selectedTx.details?.source || selectedTx.source}</span></div>}
              <div className="flex justify-between py-2 border-b border-black/10 dark:border-white/10"><span className="text-[var(--text-secondary)]">Description</span><span className="font-bold">{selectedTx.details?.note || selectedTx.desc || 'No description provided'}</span></div>
            </div>
            <div className="modal-footer flex gap-3">
              {isAdmin ? (
                <>
                  <button id="btn-pending-approve" className="btn btn-approve flex-1" onClick={handleApprovePending}>
                    {language === 'bn' ? 'অনুমোদন' : 'Approval'}
                  </button>
                  <button id="btn-pending-reject" className="btn btn-secondary flex-1" onClick={handleRejectPending}>
                    {language === 'bn' ? 'প্রত্যাখ্যান' : 'Reject'}
                  </button>
                  <button id="btn-pending-delete" className="btn btn-danger flex-1" onClick={handleDeleteTx}>
                    {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                  </button>
                </>
              ) : (
                <>
                  <button id="btn-pending-edit" className="btn btn-primary flex-1" onClick={handleEditPending}>Edit</button>
                  <button id="btn-pending-delete" className="btn btn-danger flex-1" onClick={handleDeleteTx}>Delete</button>
                  <button id="btn-pending-cancel" className="btn btn-secondary flex-1" onClick={closeOverlay}>Close</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ADD MONEY FORM MODAL (WITH FLOATING LABELS & GRADIENT BG) */}
        {overlay === 'addMoney' && (
          <div className="modal" id="modal-add-money">
            <div className="modal-header">
              <h3>{editingId ? (language === 'bn' ? 'অনুরোধ সংশোধন করুন' : 'Edit Money Request') : (language === 'bn' ? 'টাকা যোগ/ডেবিট করুন' : 'Add Money')}</h3>
              <button className="modal-close" onClick={closeOverlay} aria-label="Close modal"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmitAddMoney}>
              <div className="modal-body addmoney-body">
                {/* Credited & Debited Toggle Card */}
                <div className="tx-type-toggle-card flex items-center justify-between p-1 bg-black/5 dark:bg-white/5 rounded-xl h-[50px] relative overflow-hidden mb-4 border border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    className={`flex-1 h-full text-sm font-bold rounded-lg z-10 transition-colors duration-200 ${addMoneyForm.type === 'INCOME' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setAddMoneyForm(prev => ({ ...prev, type: 'INCOME' }))}
                  >
                    {language === 'bn' ? 'ক্রেডিটেড' : 'Credited'}
                  </button>
                  <button
                    type="button"
                    className={`flex-1 h-full text-sm font-bold rounded-lg z-10 transition-colors duration-200 ${addMoneyForm.type === 'DEDUCTION' ? 'text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setAddMoneyForm(prev => ({ ...prev, type: 'DEDUCTION' }))}
                  >
                    {language === 'bn' ? 'ডেবিটেড' : 'Debited'}
                  </button>
                  {/* Background sliding accent */}
                  <div
                    className="absolute top-1 bottom-1 rounded-lg shadow-sm"
                    
                    
                    
                  />
                </div>

                {/* Field 1: Dynamic Source of Income or Select Reason */}
                {addMoneyForm.type === 'INCOME' ? (
                  <div className="field">
                    <Briefcase className="field-icon" size={16} />
                    <select 
                      id="input-source-income"
                      className={addMoneyForm.source ? 'has-value' : ''} 
                      required={addMoneyForm.type === 'INCOME'} 
                      value={addMoneyForm.source} 
                      onChange={e => setAddMoneyForm({ ...addMoneyForm, source: e.target.value })}
                    >
                      <option value="" disabled hidden></option>
                      {(walletIncomeSources || []).map((source: string) => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                    <label htmlFor="input-source-income">{language === 'bn' ? 'আয়ের উৎস' : 'Source of Income'}</label>
                    <ChevronDown className="select-chevron" size={16} />
                  </div>
                ) : (
                  <div className="field">
                    <Briefcase className="field-icon" size={16} />
                    <select 
                      id="input-select-reason"
                      className={addMoneyForm.reason ? 'has-value' : ''} 
                      required={addMoneyForm.type === 'DEDUCTION'} 
                      value={addMoneyForm.reason} 
                      onChange={e => setAddMoneyForm({ ...addMoneyForm, reason: e.target.value })}
                    >
                      <option value="" disabled hidden></option>
                      {(walletDeductionReasons || []).map((reason: string) => (
                        <option key={reason} value={reason}>{reason}</option>
                      ))}
                    </select>
                    <label htmlFor="input-select-reason">{language === 'bn' ? 'কারণ নির্বাচন করুন' : 'Select Reason'}</label>
                    <ChevronDown className="select-chevron" size={16} />
                  </div>
                )}

                {/* Transaction Date Field */}
                <div 
                  className="field cursor-pointer"
                  onClick={() => setWalletPicker({
                    open: true,
                    type: 'addMoney',
                    value: addMoneyForm.date,
                    title: language === 'bn' ? 'লেনদেনের তারিখ নির্বাচন' : 'Select Transaction Date'
                  })}
                >
                  <Calendar className="field-icon" size={16} />
                  <div className={`form-control flex items-center ${addMoneyForm.date ? 'has-value' : ''} text-sm font-semibold select-none pt-4`}>
                    {addMoneyForm.date || ''}
                  </div>
                  <label htmlFor="input-tx-date" className={addMoneyForm.date ? 'active' : ''}>
                    {language === 'bn' ? 'লেনদেনের তারিখ' : 'Transaction Date'}
                  </label>
                </div>

                {/* Field 4: Payment Method on its own line below */}
                <div className="field">
                  <CreditCard className="field-icon" size={16} />
                  <select 
                    id="input-payment-method"
                    className={addMoneyForm.method ? 'has-value' : ''} 
                    required 
                    value={addMoneyForm.method} 
                    onChange={e => setAddMoneyForm({ ...addMoneyForm, method: e.target.value })}
                  >
                    <option value="" disabled hidden></option>
                    {(walletPaymentMethods || []).map((method: string) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  <label htmlFor="input-payment-method">{language === 'bn' ? 'পেমেন্ট মেথড' : 'Payment Method'}</label>
                  <ChevronDown className="select-chevron" size={16} />
                </div>

                {/* Field 4: Amount */}
                <div className="field">
                  <DollarSign className="field-icon" size={16} />
                  <input 
                    id="input-amount"
                    type="number" 
                    placeholder=" " 
                    min="1" 
                    step="0.01" 
                    required 
                    value={addMoneyForm.amount} 
                    onChange={e => setAddMoneyForm({ ...addMoneyForm, amount: e.target.value })}
                  />
                  <label htmlFor="input-amount">Amount</label>
                </div>

                {/* Field 5: Description with automatic text area resizing height */}
                <div className="field">
                  <FileText className="field-icon" size={16} />
                  <textarea 
                    id="input-description"
                    placeholder=" " 
                    rows={1} 
                    value={addMoneyForm.description} 
                    onChange={e => {
                      setAddMoneyForm({ ...addMoneyForm, description: e.target.value });
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                  <label htmlFor="input-description">Description</label>
                </div>
              </div>
              <div className="modal-footer flex gap-3">
                <button id="btn-add-money-cancel" type="button" className="btn btn-secondary" onClick={closeOverlay}>Cancel</button>
                <button id="btn-add-money-submit" type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        )}

          </div>
        </div>,
        document.body
      )}

      <GlobalDateTimePicker
        isOpen={walletPicker.open}
        onClose={() => setWalletPicker(prev => ({ ...prev, open: false }))}
        value={walletPicker.value}
        onSelect={(val) => {
          if (walletPicker.type === 'start') {
            setStatementStartDate(val);
            setIsManualFilterApplied(true);
          } else if (walletPicker.type === 'end') {
            setStatementEndDate(val);
            setIsManualFilterApplied(true);
          } else if (walletPicker.type === 'addMoney') {
            setAddMoneyForm(prev => ({ ...prev, date: val }));
          }
          setWalletPicker(prev => ({ ...prev, open: false }));
        }}
        type="date"
        title={walletPicker.title}
      />
    </div>
  );
};

export default Wallet;
