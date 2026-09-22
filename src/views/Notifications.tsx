import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, 
  Trash2, 
  ChevronRight, 
  User as UserIcon, 
  Info, 
  Check, 
  X, 
  Edit2, 
  Calendar, 
  DollarSign, 
  Smartphone, 
  Mail, 
  Loader2,
  FileText,
  Clock,
  Shield,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  MapPin,
  ShoppingCart,
  Store,
  Tag
} from 'lucide-react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { saveFirebaseDoc, deleteFirebaseDoc, getFirebaseCollection } from '../services/firebase';

const LOCAL_TRANSLATIONS: Record<'en' | 'bn', any> = {
  en: {
    modalTitle: "Notification Details",
    approve: "Approve",
    reject: "Reject",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    userProfile: "User Profile Request",
    purchaseRequest: "Purchase Request",
    paymentRequest: "Payment Request",
    name: "Name",
    email: "Email",
    mobile: "Mobile Number",
    whatsapp: "WhatsApp",
    role: "Role",
    status: "Status",
    expiryDate: "Expiry Date",
    saveSuccess: "Updated successfully!",
    approveSuccess: "Approved successfully!",
    rejectSuccess: "Rejected successfully!",
    deleteSuccess: "Deleted successfully!",
    confirmDeleteUser: "Are you sure you want to delete this user account?",
    confirmDeletePurchase: "Are you sure you want to delete this purchase?",
    confirmDeletePayment: "Are you sure you want to delete this payment?",
    hypermarketName: "Hypermarket Name",
    amount: "Amount (QAR)",
    date: "Date",
    paymentMethod: "Payment Method",
    noRecords: "No records found.",
    loading: "Loading details...",
    enterName: "Enter Name",
    enterMobile: "Enter mobile number",
    enterWhatsapp: "Enter WhatsApp number",
    enterEmail: "Enter Email",
    enterHypermarket: "Enter Hypermarket Name",
    enterAmount: "Enter Amount"
  },
  bn: {
    modalTitle: "বিজ্ঞপ্তি বিস্তারিত",
    approve: "অনুমোদন করুন",
    reject: "প্রত্যাখ্যান করুন",
    edit: "সংশোধন করুন",
    delete: "মুছে ফেলুন",
    save: "সংরক্ষণ করুন",
    cancel: "বাতিল করুন",
    close: "বন্ধ করুন",
    userProfile: "ইউজার প্রোফাইল রিকোয়েস্ট",
    purchaseRequest: "ক্রয় আবেদন (Purchase)",
    paymentRequest: "পেমেন্ট আবেদন",
    name: "নাম",
    email: "ইমেইল",
    mobile: "মোবাইল নাম্বার",
    whatsapp: "হোয়াটসঅ্যাপ",
    role: "রোল",
    status: "স্ট্যাটাস",
    expiryDate: "মেয়াদ শেষ হওয়ার তারিখ",
    saveSuccess: "সফলভাবে আপডেট করা হয়েছে!",
    approveSuccess: "সফলভাবে অনুমোদন করা হয়েছে!",
    rejectSuccess: "সফলভাবে প্রত্যাখ্যান করা হয়েছে!",
    deleteSuccess: "সফলভাবে মুছে ফেলা হয়েছে!",
    confirmDeleteUser: "আপনি কি নিশ্চিত যে এই ইউজার অ্যাকাউন্টটি মুছে ফেলতে চান?",
    confirmDeletePurchase: "আপনি কি নিশ্চিত যে এই ক্রয় আবেদনটি মুছে ফেলতে চান?",
    confirmDeletePayment: "আপনি কি নিশ্চিত যে এই পেমেন্ট আবেদনটি মুছে ফেলতে চান?",
    hypermarketName: "হাইপারমার্কেট নাম",
    amount: "পরিমাণ (QAR)",
    date: "তারিখ",
    paymentMethod: "পেমেন্ট মাধ্যম",
    noRecords: "কোন রেকর্ড পাওয়া যায়নি।",
    loading: "লোড হচ্ছে...",
    enterName: "Enter Name",
    enterMobile: "Enter mobile number",
    enterWhatsapp: "Enter WhatsApp number",
    enterEmail: "Enter Email",
    enterHypermarket: "Enter Hypermarket Name",
    enterAmount: "Enter Amount"
  }
};

const NotificationsView: React.FC = () => {
  const { 
    notifications, 
    removeNotification, 
    markNotificationAsRead, 
    clearNotifications,
    users,
    language,
    updateUser,
    approveUser,
    removeUser,
    showFeedback,
    user,
    confirmAction
  } = useStore();

  const [selectedNotif, setSelectedNotif] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [isLongPressed, setIsLongPressed] = useState(false);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setIsSelectionMode(false);
    }
  }, [selectedIds]);

  const startPress = (e: React.PointerEvent, id: string) => {
    // Only handle main pointer (left click / touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.no-long-press')) {
      return;
    }

    setIsLongPressed(false);
    
    const timer = setTimeout(() => {
      setIsLongPressed(true);
      setIsSelectionMode(true);
      setSelectedIds(prev => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 600); // 600ms hold
    
    setLongPressTimer(timer);
  };

  const endPress = (e: React.PointerEvent, n: any) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.no-long-press')) {
      return;
    }

    if (!isLongPressed) {
      if (isSelectionMode) {
        if (selectedIds.includes(n.id)) {
          setSelectedIds(prev => prev.filter(id => id !== n.id));
        } else {
          setSelectedIds(prev => [...prev, n.id]);
        }
      } else {
        handleNotificationClick(n);
      }
    }
  };

  const cancelPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const tGlobal = TRANSLATIONS[language] || {};
  const tLocal = LOCAL_TRANSLATIONS[language === 'bn' ? 'bn' : 'en'];

  const getDisplayMessage = (n: any) => {
    const safeTitle = n.title || '';
    const safeMsg = n.message || '';
    
    if (n.type === 'LOGIN_INFO') {
      if (n.loginDetails) {
        return `${n.loginDetails.areaName || 'Unknown Area'} • ${n.loginDetails.device || 'Web Browser'} • IP: ${n.loginDetails.ip || 'N/A'}`;
      } else if (safeMsg.includes('IP Address') || safeMsg.includes('আইপি অ্যাড্রেস')) {
        const ipMatch = safeMsg.match(/(?:IP Address|আইপি অ্যাড্রেস):\s*([^\n]+)/i);
        const areaMatch = safeMsg.match(/(?:Area Name|এরিয়া নাম):\s*([^\n]+)/i);
        const deviceMatch = safeMsg.match(/(?:Device|ডিভাইস):\s*([^\n]+)/i);
        return `${areaMatch ? areaMatch[1].trim() : 'Unknown Area'} • ${deviceMatch ? deviceMatch[1].trim() : 'Web Browser'} • IP: ${ipMatch ? ipMatch[1].trim() : 'N/A'}`;
      }
    }
    
    if (safeTitle && safeMsg.startsWith(safeTitle)) {
      return safeMsg.substring(safeTitle.length).replace(/^[\s\-:]+/, '');
    }
    
    return safeMsg;
  };

  // Sort array and pin the latest LOGIN_INFO to the top
  const displayedNotifications = useMemo(() => {
    if (!notifications || notifications.length === 0) return [];
    
    const sorted = [...notifications].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestLoginNotifIndex = sorted.findIndex(n => n.type === 'LOGIN_INFO');
    
    if (latestLoginNotifIndex > 0) {
      const latestLoginNotif = sorted[latestLoginNotifIndex];
      const otherNotifs = sorted.filter((_, idx) => idx !== latestLoginNotifIndex);
      return [latestLoginNotif, ...otherNotifs].slice(0, 50);
    }
    
    return sorted.slice(0, 50);
  }, [notifications]);

  const handleNotificationClick = (n: any) => {
    markNotificationAsRead(n.id);
    setSelectedNotif(n);
    setIsModalOpen(true);
  };

  const hasAnySelected = selectedIds.length > 0;
  const isAllSelected = notifications.length > 0 && selectedIds.length === notifications.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const handleToggleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleDeleteSelected = async () => {
    const isBn = language === 'bn';
    const count = selectedIds.length;
    confirmAction(
      isBn ? `আপনি কি সিলেক্ট করা ${count} টি বিজ্ঞপ্তি মুছে ফেলতে চান?` : `Are you sure you want to delete ${count} selected notifications?`,
      async () => {
        showFeedback(isBn ? "মুছে ফেলা হচ্ছে..." : "Deleting...", 'success');
        const idsToDelete = [...selectedIds];
        setSelectedIds([]);
        setIsSelectionMode(false);
        for (const id of idsToDelete) {
          await removeNotification(id);
        }
        showFeedback(isBn ? "বিজ্ঞপ্তিগুলো সফলভাবে মুছে ফেলা হয়েছে!" : "Selected notifications deleted successfully!", 'success');
      }
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto relative select-none">
      {/* SELECTION CONTROL TOOLBAR (Only shown when selection mode is active) */}
      {isSelectionMode && notifications.length > 0 && createPortal(
        <div 
          className="fixed left-0 right-0 z-50 h-14 flex justify-between items-center px-4 shadow-md border-b animate-fade-in backdrop-blur-md"
          style={{ 
            top: 'calc(3.5rem + env(safe-area-inset-top))',
            backgroundColor: 'var(--header-bg)',
            borderBottomColor: 'rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                isAllSelected 
                  ? 'text-white scale-105' 
                  : 'border-black/20 dark:border-white/20 bg-transparent'
              }`}
              style={{
                backgroundColor: isAllSelected ? 'var(--primary)' : undefined,
                borderColor: isAllSelected ? 'var(--primary)' : undefined
              }}>
                {isAllSelected && <Check size={12} strokeWidth={4} />}
              </div>
              <span className="text-sm font-semibold opacity-90" style={{ color: 'var(--header-text)' }}>
                All Select
              </span>
            </div>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-500 text-sm font-semibold rounded-lg transition-all active:scale-[0.98]"
            >
              <Trash2 size={16} />
              {language === 'bn' ? `মুছুন` : `Delete`}
            </button>
          )}
        </div>,
        document.body
      )}

      {/* Spacer when selection toolbar is open to prevent covering top notification cards */}
      {isSelectionMode && notifications.length > 0 && (
        <div className="h-14 w-full shrink-0 -mb-2" aria-hidden="true" />
      )}

      <div className="grid grid-cols-1 gap-4">
        {notifications.length === 0 ? (
          <div className="py-20 text-center bg-card-bg/20 rounded-3xl border border-dashed border-black/10 dark:border-white/10">
            <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-text-muted opacity-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
              {language === 'bn' ? 'কোন বিজ্ঞপ্তি নেই' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          displayedNotifications.map((n, index) => (
            <div
              key={n.id || `notif-${index}-${n.timestamp || Date.now()}`}
              onPointerDown={(e) => startPress(e, n.id)}
              onPointerUp={(e) => endPress(e, n)}
              onPointerCancel={cancelPress}
              onPointerLeave={cancelPress}
              className={`group relative p-4 rounded-2xl border transition-all cursor-pointer hover:scale-[1.005] active:scale-[0.995] bg-white dark:bg-[#161616] ${
                !n.isRead 
                  ? 'border-primary/40' 
                  : 'border-black/[0.08] dark:border-white/[0.08] opacity-90 hover:opacity-100'
              }`}
              style={{
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)'
              }}
            >
              <div className="flex items-center gap-4">
                {/* Round Checkbox for Multi-Select (Only visible in selection mode) */}
                {isSelectionMode && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleToggleSelectOne(e as any, n.id); }}
                    className="shrink-0 flex items-center justify-center cursor-pointer p-1 -m-1 no-long-press"
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      selectedIds.includes(n.id)
                        ? 'text-white scale-110'
                        : 'border-black/20 dark:border-white/20 bg-transparent'
                    }`}
                    style={{
                      backgroundColor: selectedIds.includes(n.id) ? 'var(--primary)' : undefined,
                      borderColor: selectedIds.includes(n.id) ? 'var(--primary)' : undefined
                    }}>
                      {selectedIds.includes(n.id) && <Check size={12} strokeWidth={4} />}
                    </div>
                  </div>
                )}

                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                  <div 
                    className="absolute inset-0" 
                    style={{ 
                      background: n.type === 'REGISTRATION' ? 'var(--success)' : (n.type === 'PURCHASE' ? '#10b981' : 'var(--primary)'),
                      opacity: 0.1
                    }} 
                  />
                  {n.type === 'REGISTRATION' ? (
                    <UserIcon size={18} className="relative z-10" style={{ color: 'var(--success)' }} />
                  ) : n.type === 'PURCHASE' ? (
                    <ShoppingCart size={18} className="relative z-10 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Info size={18} className="relative z-10" style={{ color: 'var(--primary)' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs font-black uppercase tracking-tight ${!n.isRead ? '' : 'text-text-main'}`}
                        style={!n.isRead ? { color: 'var(--primary)' } : {}}
                      >
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span className="px-1.5 py-0.5 text-white text-[7px] font-black uppercase rounded-full animate-pulse"
                          style={{ background: 'var(--primary)' }}
                        >
                          New
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] font-bold text-text-muted opacity-50 whitespace-nowrap ml-2">
                      {new Date(n.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-tight transition-all mt-1 line-clamp-2">
                    {n.type === 'LOGIN_INFO' ? (
                      <span className="font-medium">{getDisplayMessage(n)}</span>
                    ) : (
                      getDisplayMessage(n)
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      confirmAction(
                        language === 'bn' ? "আপনি কি এই বিজ্ঞপ্তিটি মুছে ফেলতে চান?" : "Are you sure you want to delete this notification?",
                        async () => {
                          await removeNotification(n.id);
                          showFeedback(language === 'bn' ? "সফলভাবে মুছে ফেলা হয়েছে!" : "Deleted successfully!", 'success');
                        }
                      );
                    }}
                    className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all no-long-press"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={14} className="text-text-muted opacity-30 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))
        )}
        
        {notifications.length > 50 && (
          <div className="text-center py-4">
            <p className="text-xs font-bold text-text-muted">{notifications.length - 50} more notifications...</p>
            <button 
              onClick={clearNotifications}
              className="mt-2 text-[10px] font-black uppercase tracking-wider text-red-500 hover:underline"
            >
              Clear all to see new
            </button>
          </div>
        )}
      </div>

      {/* POPUP ACTION MODAL */}
      {isModalOpen && selectedNotif && (
        <NotificationModal 
          notification={selectedNotif} 
          users={users}
          language={language}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedNotif(null);
          }}
          updateUser={updateUser}
          approveUser={approveUser}
          removeUser={removeUser}
          showFeedback={showFeedback}
          removeNotification={removeNotification}
          confirmAction={confirmAction}
        />
      )}
    </div>
  );
};

// MULTI-FUNCTIONAL MODAL COMPONENT
interface NotificationModalProps {
  notification: any;
  users: any[];
  language: string;
  onClose: () => void;
  updateUser: (user: any) => void;
  approveUser: (userId: string, tempPassword?: string) => void;
  removeUser: (userId: string) => void;
  showFeedback: (msg: string, type?: 'success' | 'error') => void;
  removeNotification: (id: string) => void;
  confirmAction: (msg: string, action: () => void) => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  notification,
  users,
  language,
  onClose,
  updateUser,
  approveUser,
  removeUser,
  showFeedback,
  removeNotification,
  confirmAction
}) => {
  const t = LOCAL_TRANSLATIONS[language === 'bn' ? 'bn' : 'en'];

  // Parse login details dynamically for the LOGIN_INFO type
  const parsedLoginDetails = useMemo(() => {
    if (notification.loginDetails) return notification.loginDetails;
    
    // Fallback parsing from notification.message via Regex if loginDetails is not set directly
    const msg = notification.message || '';
    const userIdMatch = msg.match(/(?:User ID|ইউজার আইডি):\s*([^\n]+)/i);
    const dateTimeMatch = msg.match(/(?:Date & Time|তারিখ ও সময়):\s*([^\n]+)/i);
    const ipMatch = msg.match(/(?:IP Address|আইপি অ্যাড্রেস):\s*([^\n]+)/i);
    const areaMatch = msg.match(/(?:Area Name|এরিয়া নাম):\s*([^\n]+)/i);
    const deviceMatch = msg.match(/(?:Device|ডিভাইস):\s*([^\n]+)/i);

    return {
      userId: userIdMatch ? userIdMatch[1].trim() : (notification.userId || 'N/A'),
      dateTime: dateTimeMatch ? dateTimeMatch[1].trim() : new Date(notification.timestamp).toLocaleString(),
      ip: ipMatch ? ipMatch[1].trim() : 'Unavailable',
      areaName: areaMatch ? areaMatch[1].trim() : 'Unavailable',
      device: deviceMatch ? deviceMatch[1].trim() : 'Web Browser'
    };
  }, [notification]);

  // If notification is a Login notification, render ONLY the login-related information and nothing else
  if (notification.type === 'LOGIN_INFO') {
    const isBn = language === 'bn';
    const info = parsedLoginDetails;

    return createPortal(
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        <div className="bg-white dark:bg-[#121212] rounded-2xl max-w-md w-full shadow-2xl border border-black/10 dark:border-white/10 flex flex-col overflow-hidden animate-scale-up">
          {/* HEADER SECTION - GRADIENT */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 relative shrink-0">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button 
                onClick={() => {
                  confirmAction(
                    isBn ? "আপনি কি এই নোটিফিকেশনটি মুছে ফেলতে চান?" : "Are you sure you want to delete this notification?",
                    async () => {
                      await removeNotification(notification.id);
                      onClose();
                      showFeedback(isBn ? "বিজ্ঞপ্তিটি মুছে ফেলা হয়েছে!" : "Notification deleted successfully!", 'success');
                    }
                  );
                }}
                className="text-white/80 hover:text-red-400 hover:bg-white/10 p-1.5 rounded-full transition-colors"
                title={isBn ? "মুছে ফেলুন" : "Delete"}
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3 pr-16">
              <div className="bg-white/10 p-2 rounded-xl">
                <Bell size={24} className="text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight leading-tight">
                  {isBn ? "লগইন সংক্রান্ত তথ্য" : "Login Information"}
                </h3>
                <p className="text-[10px] text-white/75 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                  <Clock size={10} />
                  {info.dateTime}
                </p>
              </div>
            </div>
          </div>

          {/* LOGIN INFO BODY */}
          <div className="p-6 space-y-4">
            <div className="space-y-3 bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800">
              {/* User ID */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "ইউজার আইডি / অ্যাকাউন্ট" : "User ID / Account"}
                </span>
                <span className="text-xs font-black text-text-main">
                  {info.userId}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "তারিখ ও সময়" : "Date & Time"}
                </span>
                <span className="text-xs font-extrabold text-text-main">
                  {info.dateTime}
                </span>
              </div>

              {/* IP Address */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "আইপি অ্যাড্রেস" : "IP Address"}
                </span>
                <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md font-mono">
                  {info.ip}
                </span>
              </div>

              {/* Area / Location Name */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "এলাকা / লোকেশন" : "Area / Location"}
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {info.areaName}
                </span>
              </div>

              {/* Device */}
              <div className="flex justify-between items-center py-2">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "ডিভাইস" : "Device"}
                </span>
                <span className="text-xs font-extrabold text-text-main truncate max-w-[200px]" title={info.device}>
                  {info.device}
                </span>
              </div>
            </div>

            {/* CLOSE BUTTON */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // If notification is a Purchase Partner notification, render the dedicated purchase partner modal
  if (notification.type === 'PURCHASE') {
    const isBn = language === 'bn';
    const details = notification.purchaseDetails || {};
    const purchaseId = notification.purchaseId || details.purchaseId || 'N/A';
    const managerId = notification.managerId || details.managerId || 'N/A';
    const partnerId = notification.partnerId || details.partnerId || 'N/A';
    const submitterName = notification.submitterName || details.submitterName || 'Partner';
    const hypermarketName = details.hypermarketName || 'Hypermarket';
    const amount = details.amount !== undefined ? Number(details.amount) : null;
    const date = details.date || (notification.timestamp ? notification.timestamp.split('T')[0] : 'N/A');
    const time = details.time || (notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A');
    const itemsCount = details.itemsCount || 1;
    const itemsSummary = details.itemsSummary || '';

    return createPortal(
      <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        <div className="bg-white dark:bg-[#121212] rounded-2xl max-w-md w-full shadow-2xl border border-black/10 dark:border-white/10 flex flex-col overflow-hidden animate-scale-up">
          {/* HEADER SECTION - GRADIENT */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 relative shrink-0">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button 
                onClick={() => {
                  confirmAction(
                    isBn ? "আপনি কি এই নোটিফিকেশনটি মুছে ফেলতে চান?" : "Are you sure you want to delete this notification?",
                    async () => {
                      await removeNotification(notification.id);
                      onClose();
                      showFeedback(isBn ? "বিজ্ঞপ্তিটি মুছে ফেলা হয়েছে!" : "Notification deleted successfully!", 'success');
                    }
                  );
                }}
                className="text-white/80 hover:text-red-400 hover:bg-white/10 p-1.5 rounded-full transition-colors"
                title={isBn ? "মুছে ফেলুন" : "Delete"}
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex items-center gap-3 pr-16">
              <div className="bg-white/10 p-2 rounded-xl">
                <ShoppingCart size={24} className="text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight leading-tight">
                  {isBn ? "পার্টনার ক্রয় (Purchase) বিবরণ" : "Partner Purchase Details"}
                </h3>
                <p className="text-[10px] text-white/75 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                  <Clock size={10} />
                  {date} • {time}
                </p>
              </div>
            </div>
          </div>

          {/* PURCHASE INFO BODY */}
          <div className="p-6 space-y-4">
            <div className="space-y-3 bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-slate-100 dark:border-zinc-800">
              {/* Submitting Partner */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "পার্টনারের নাম" : "Partner Name"}
                </span>
                <span className="text-xs font-black text-text-main flex items-center gap-1">
                  <UserIcon size={12} className="text-emerald-600" />
                  {submitterName}
                </span>
              </div>

              {/* Partner ID */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "পার্টনার আইডি (Partner ID)" : "Partner ID"}
                </span>
                <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  {partnerId}
                </span>
              </div>

              {/* Manager ID */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "ম্যানেজার আইডি (Manager ID)" : "Manager ID"}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  {managerId}
                </span>
              </div>

              {/* Purchase ID */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "পারচেজ আইডি (Purchase ID)" : "Purchase ID"}
                </span>
                <span className="text-xs font-mono font-bold text-text-main">
                  {purchaseId}
                </span>
              </div>

              {/* Hypermarket / Store */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "হাইপারমার্কেট / দোকান" : "Store / Hypermarket"}
                </span>
                <span className="text-xs font-extrabold text-text-main">
                  {hypermarketName}
                </span>
              </div>

              {/* Amount */}
              {amount !== null && (
                <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                  <span className="text-xs font-bold text-text-muted">
                    {isBn ? "মোট পরিমাণ (Amount)" : "Total Amount"}
                  </span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    QAR {amount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Date & Time */}
              <div className="flex justify-between items-center py-2 border-b border-black/5 dark:border-white/5">
                <span className="text-xs font-bold text-text-muted">
                  {isBn ? "সাবমিট তারিখ ও সময়" : "Submission Date & Time"}
                </span>
                <span className="text-xs font-extrabold text-text-main">
                  {date} {time}
                </span>
              </div>

              {/* Items Summary */}
              {itemsSummary ? (
                <div className="py-2">
                  <span className="text-xs font-bold text-text-muted block mb-1">
                    {isBn ? "পণ্য সামগ্রী (Items)" : "Items Summary"}
                  </span>
                  <p className="text-xs font-medium text-text-main bg-black/5 dark:bg-white/5 p-2.5 rounded-lg leading-relaxed">
                    {itemsSummary}
                  </p>
                </div>
              ) : null}
            </div>

            {/* CLOSE BUTTON */}
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
              >
                {isBn ? "বন্ধ করুন" : "Close"}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Identify Target User
  const targetUser = useMemo(() => {
    const userId = notification.userId || notification.targetUserId || notification.details?.userId;
    if (userId) {
      return users.find(u => String(u.id) === String(userId) || String(u.userId) === String(userId));
    }
    // Search by name in message
    if (notification.message) {
      return users.find(u => notification.message.includes(u.name));
    }
    return null;
  }, [notification, users]);

  // Request Type Classification
  const requestType = useMemo(() => {
    const title = (notification.title || '').toLowerCase();
    const msg = (notification.message || '').toLowerCase();
    
    if (notification.type === 'REGISTRATION' || title.includes('register') || title.includes('sign up') || title.includes('new user')) {
      return 'USER';
    }
    if (title.includes('purchase') || msg.includes('purchase') || title.includes('ক্রয়') || msg.includes('ক্রয়')) {
      return 'PURCHASE';
    }
    if (title.includes('payment') || msg.includes('payment') || title.includes('পেমেন্ট') || msg.includes('পেমেন্ট')) {
      return 'PAYMENT';
    }
    return 'GENERAL';
  }, [notification]);

  // States
  const [mode, setMode] = useState<'VIEW' | 'EDIT_USER' | 'EDIT_PURCHASE' | 'EDIT_PAYMENT'>('VIEW');
  const [loading, setLoading] = useState(false);

  // Firestore records state
  const [purchases, setPurchases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  // Edit Forms state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    mobile: '',
    whatsapp: '',
    role: '',
    status: '',
    expiryDate: ''
  });

  const [purchaseForm, setPurchaseForm] = useState({
    id: '',
    hypermarketName: '',
    amount: '',
    date: '',
    status: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    id: '',
    amount: '',
    date: '',
    paymentMethod: '',
    status: ''
  });

  const [selectedItemForEdit, setSelectedItemForEdit] = useState<any | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load related documents for Purchases or Payments from Firestore
  useEffect(() => {
    if (!targetUser) return;
    const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';

    if (requestType === 'PURCHASE') {
      setLoading(true);
      getFirebaseCollection(`${parentCol}/${targetUser.id}/Purchase`)
        .then(data => {
          if (data && Array.isArray(data)) {
            // Sort by Date/CreatedAt descending
            const sorted = [...data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setPurchases(sorted);
          }
        })
        .catch(err => console.error("Error load purchases", err))
        .finally(() => setLoading(false));
    } else if (requestType === 'PAYMENT') {
      setLoading(true);
      getFirebaseCollection(`${parentCol}/${targetUser.id}/messPayments`)
        .then(data => {
          if (data && Array.isArray(data)) {
            const sorted = [...data].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            setPayments(sorted);
          }
        })
        .catch(err => console.error("Error load payments", err))
        .finally(() => setLoading(false));
    }
  }, [targetUser, requestType]);

  // Initializing User Form
  useEffect(() => {
    if (targetUser) {
      setUserForm({
        name: targetUser.name || '',
        email: targetUser.email || '',
        mobile: targetUser.mobile || targetUser.phone || '',
        whatsapp: targetUser.whatsapp || '',
        role: targetUser.role || 'USER',
        status: targetUser.status || 'PENDING',
        expiryDate: targetUser.expiryDate || targetUser.expiry || ''
      });
    }
  }, [targetUser]);

  // ACTIONS FOR USER
  const handleApproveUser = () => {
    if (!targetUser) return;
    if (!showPasswordPrompt) {
      setShowPasswordPrompt(true);
      return;
    }
    if (!tempPassword || tempPassword.length < 4) {
      setPasswordError(language === 'bn' ? 'পাসওয়ার্ডটি অবশ্যই অন্তত ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
      return;
    }
    approveUser(targetUser.id, tempPassword);
    showFeedback(t.approveSuccess, 'success');
    onClose();
  };

  const handleRejectUser = () => {
    if (!targetUser) return;
    const updated = { ...targetUser, status: 'DISABLED', statusTimestamp: new Date().toISOString() };
    updateUser(updated);
    showFeedback(t.rejectSuccess, 'success');
    onClose();
  };

  const handleDeleteUser = () => {
    if (!targetUser) return;
    confirmAction(
      t.confirmDeleteUser,
      () => {
        removeUser(targetUser.id);
        showFeedback(t.deleteSuccess, 'success');
        onClose();
      }
    );
  };

  const handleSaveUserEdit = () => {
    if (!targetUser) return;
    const updated = {
      ...targetUser,
      name: userForm.name,
      email: userForm.email,
      mobile: userForm.mobile,
      whatsapp: userForm.whatsapp,
      role: userForm.role,
      status: userForm.status,
      expiryDate: userForm.expiryDate,
      statusTimestamp: new Date().toISOString()
    };
    updateUser(updated);
    showFeedback(t.saveSuccess, 'success');
    setMode('VIEW');
  };

  // ACTIONS FOR PURCHASES
  const handleApprovePurchase = async (purchase: any) => {
    if (!targetUser) return;
    const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';
    const updated = { ...purchase, status: 'approved' };
    
    setLoading(true);
    try {
      await saveFirebaseDoc(`${parentCol}/${targetUser.id}/Purchase`, purchase.id, updated);
      
      // Notify user
      const notifId = `NOTIF-${Date.now()}`;
      await saveFirebaseDoc(`users/${targetUser.id}/notifications`, notifId, {
        id: notifId,
        title: 'Purchase Approved',
        message: `Your purchase of QAR ${purchase.amount || purchase.totalAmount || 0} at ${purchase.hypermarketName} has been approved.`,
        type: 'SUCCESS',
        timestamp: new Date().toISOString(),
        isRead: false
      });

      // Update local state
      setPurchases(prev => prev.map(p => p.id === purchase.id ? updated : p));
      showFeedback(t.approveSuccess, 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPurchase = async (purchase: any) => {
    if (!targetUser) return;
    const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';
    const updated = { ...purchase, status: 'rejected' };

    setLoading(true);
    try {
      await saveFirebaseDoc(`${parentCol}/${targetUser.id}/Purchase`, purchase.id, updated);
      setPurchases(prev => prev.map(p => p.id === purchase.id ? updated : p));
      showFeedback(t.rejectSuccess, 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePurchase = async (purchase: any) => {
    if (!targetUser) return;
    confirmAction(
      t.confirmDeletePurchase,
      async () => {
        const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';
        setLoading(true);
        try {
          await deleteFirebaseDoc(`${parentCol}/${targetUser.id}/Purchase`, purchase.id);
          setPurchases(prev => prev.filter(p => p.id !== purchase.id));
          showFeedback(t.deleteSuccess, 'success');
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const startEditPurchase = (purchase: any) => {
    setSelectedItemForEdit(purchase);
    setPurchaseForm({
      id: purchase.id,
      hypermarketName: purchase.hypermarketName || '',
      amount: String(purchase.amount || purchase.totalAmount || ''),
      date: purchase.date || '',
      status: purchase.status || 'pending'
    });
    setMode('EDIT_PURCHASE');
  };

  const handleSavePurchaseEdit = async () => {
    if (!targetUser || !selectedItemForEdit) return;
    const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';
    const updated = {
      ...selectedItemForEdit,
      hypermarketName: purchaseForm.hypermarketName,
      amount: Number(purchaseForm.amount),
      totalAmount: Number(purchaseForm.amount),
      date: purchaseForm.date,
      status: purchaseForm.status
    };

    setLoading(true);
    try {
      await saveFirebaseDoc(`${parentCol}/${targetUser.id}/Purchase`, updated.id, updated);
      setPurchases(prev => prev.map(p => p.id === updated.id ? updated : p));
      showFeedback(t.saveSuccess, 'success');
      setMode('VIEW');
      setSelectedItemForEdit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ACTIONS FOR PAYMENTS
  const handleApprovePayment = async (payment: any) => {
    if (!targetUser) return;
    const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';
    const updated = { ...payment, status: 'approved' };
    
    setLoading(true);
    try {
      await saveFirebaseDoc(`${parentCol}/${targetUser.id}/messPayments`, payment.id, updated);
      setPayments(prev => prev.map(p => p.id === payment.id ? updated : p));
      showFeedback(t.approveSuccess, 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPayment = async (payment: any) => {
    if (!targetUser) return;
    const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';
    const updated = { ...payment, status: 'rejected' };

    setLoading(true);
    try {
      await saveFirebaseDoc(`${parentCol}/${targetUser.id}/messPayments`, payment.id, updated);
      setPayments(prev => prev.map(p => p.id === payment.id ? updated : p));
      showFeedback(t.rejectSuccess, 'success');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (payment: any) => {
    if (!targetUser) return;
    confirmAction(
      t.confirmDeletePayment,
      async () => {
        const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';
        setLoading(true);
        try {
          await deleteFirebaseDoc(`${parentCol}/${targetUser.id}/messPayments`, payment.id);
          setPayments(prev => prev.filter(p => p.id !== payment.id));
          showFeedback(t.deleteSuccess, 'success');
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const startEditPayment = (payment: any) => {
    setSelectedItemForEdit(payment);
    setPaymentForm({
      id: payment.id,
      amount: String(payment.amount || ''),
      date: payment.date || '',
      paymentMethod: payment.paymentMethod || 'Cash',
      status: payment.status || 'pending'
    });
    setMode('EDIT_PAYMENT');
  };

  const handleSavePaymentEdit = async () => {
    if (!targetUser || !selectedItemForEdit) return;
    const parentCol = targetUser.role === 'ADMIN' ? 'admins' : 'users';
    const updated = {
      ...selectedItemForEdit,
      amount: Number(paymentForm.amount),
      date: paymentForm.date,
      paymentMethod: paymentForm.paymentMethod,
      status: paymentForm.status
    };

    setLoading(true);
    try {
      await saveFirebaseDoc(`${parentCol}/${targetUser.id}/messPayments`, updated.id, updated);
      setPayments(prev => prev.map(p => p.id === updated.id ? updated : p));
      showFeedback(t.saveSuccess, 'success');
      setMode('VIEW');
      setSelectedItemForEdit(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#121212] rounded-2xl max-w-lg w-full shadow-2xl border border-black/10 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* HEADER SECTION - GRADIENT */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 relative shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button 
              onClick={() => {
                confirmAction(
                  language === 'bn' ? "আপনি কি এই নোটিফিকেশনটি মুছে ফেলতে চান?" : "Are you sure you want to delete this notification?",
                  async () => {
                    await removeNotification(notification.id);
                    onClose();
                    showFeedback(language === 'bn' ? "বিজ্ঞপ্তিটি মুছে ফেলা হয়েছে!" : "Notification deleted successfully!", 'success');
                  }
                );
              }}
              className="text-white/80 hover:text-red-400 hover:bg-white/10 p-1.5 rounded-full transition-colors"
              title={language === 'bn' ? "মুছে ফেলুন" : "Delete"}
            >
              <Trash2 size={18} />
            </button>
            <button 
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3 pr-16">
            <div className="bg-white/10 p-2 rounded-xl">
              <Bell size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight">{notification.title}</h3>
              <p className="text-[10px] text-white/75 flex items-center gap-1 mt-1 font-bold uppercase tracking-wider">
                <Clock size={10} />
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* BODY - SCROLLABLE */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Notification Message Display */}
          <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Message</h4>
            <p className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-medium">
              {notification.message}
            </p>
          </div>

          {/* VIEW MODE */}
          {mode === 'VIEW' && (
            <div className="space-y-6">
              
              {/* TARGET USER INFORMATION */}
              {targetUser ? (
                <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                      <UserIcon size={14} />
                      {t.userProfile}
                    </h4>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      targetUser.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                      targetUser.status === 'ENABLED' ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400' :
                      'bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}>
                      {targetUser.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold text-[10px] uppercase">{t.name}</p>
                      <p className="font-bold text-slate-800 dark:text-zinc-100 mt-0.5">{targetUser.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold text-[10px] uppercase">{t.email}</p>
                      <p className="font-bold text-slate-800 dark:text-zinc-100 mt-0.5 break-all">{targetUser.email}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold text-[10px] uppercase">{t.mobile}</p>
                      <p className="font-bold text-slate-800 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                        <Smartphone size={12} className="opacity-50" />
                        {targetUser.mobile || targetUser.phone || '-'}
                      </p>
                    </div>
                    {targetUser.whatsapp && (
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">{t.whatsapp}</p>
                        <p className="font-bold text-slate-800 dark:text-zinc-100 mt-0.5">{targetUser.whatsapp}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400 font-bold text-[10px] uppercase">{t.role}</p>
                      <p className="font-bold text-slate-800 dark:text-zinc-100 mt-0.5">{targetUser.role}</p>
                    </div>
                    {targetUser.expiryDate && (
                      <div>
                        <p className="text-slate-400 font-bold text-[10px] uppercase">{t.expiryDate}</p>
                        <p className="font-bold text-slate-800 dark:text-zinc-100 mt-0.5 flex items-center gap-1">
                          <Calendar size={12} className="opacity-50" />
                          {targetUser.expiryDate}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* USER REQUEST CONTROL ACTIONS */}
                  <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap gap-2 justify-end">
                    <button 
                      onClick={() => setMode('EDIT_USER')}
                      className="px-4 py-2 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all flex items-center gap-1.5 font-bold shadow-sm"
                    >
                      <Edit2 size={12} /> {t.edit}
                    </button>
                    
                    <button 
                      onClick={handleDeleteUser}
                      className="px-4 py-2 text-xs bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all flex items-center gap-1.5 font-bold shadow-sm"
                    >
                      <Trash2 size={12} /> {t.delete}
                    </button>

                    {showPasswordPrompt ? (
                      <div className="w-full bg-slate-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 space-y-3">
                        <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                          {language === 'bn' ? 'ব্যবহারকারীর জন্য ওয়ান-টাইম পাসওয়ার্ড সেট করুন:' : 'Set One-Time Password (Temporary Password) for the user:'}
                        </p>
                        <input 
                          type="text"
                          value={tempPassword}
                          onChange={(e) => {
                            setTempPassword(e.target.value);
                            setPasswordError('');
                          }}
                          placeholder={language === 'bn' ? 'পাসওয়ার্ড লিখুন' : 'Enter temporary password'}
                          className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 bg-white dark:bg-zinc-800 text-text-main border-neutral-200 dark:border-neutral-800"
                        />
                        {passwordError && (
                          <p className="text-[10px] font-bold text-red-500">{passwordError}</p>
                        )}
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => {
                              setShowPasswordPrompt(false);
                              setTempPassword('');
                              setPasswordError('');
                            }}
                            className="px-3 py-1.5 text-xs bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg hover:bg-slate-300 transition-all font-bold"
                          >
                            {language === 'bn' ? 'বাতিল' : 'Cancel'}
                          </button>
                          <button 
                            onClick={handleApproveUser}
                            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-bold"
                          >
                            {language === 'bn' ? 'অনুমোদন নিশ্চিত করুন' : 'Confirm Approval'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      targetUser.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={handleRejectUser}
                            className="px-4 py-2 text-xs bg-amber-500 text-white hover:bg-amber-600 rounded-xl transition-all flex items-center gap-1.5 font-bold shadow-sm"
                          >
                            <X size={12} /> {t.reject}
                          </button>
                          <button 
                            onClick={handleApproveUser}
                            className="px-4 py-2 text-xs bg-green-600 text-white hover:bg-green-700 rounded-xl transition-all flex items-center gap-1.5 font-bold shadow-sm"
                          >
                            <Check size={12} /> {t.approve}
                          </button>
                        </>
                      )
                    )}
                  </div>
                </div>
              ) : null}

              {/* RELATED PURCHASES VIEW FOR USER */}
              {requestType === 'PURCHASE' && targetUser && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <FileText size={14} />
                    {t.purchaseRequest}
                  </h4>
                  
                  {loading ? (
                    <div className="py-10 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-indigo-600" />
                    </div>
                  ) : purchases.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">{t.noRecords}</p>
                  ) : (
                    <div className="space-y-4">
                      {purchases.map((p) => (
                        <div key={p.id} className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase">ID: {p.id}</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              p.status === 'pending' || p.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                              p.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400' :
                              'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                            }`}>
                              {p.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400 font-bold text-[9px] uppercase">{t.hypermarketName}</p>
                              <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{p.hypermarketName || '-'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 font-bold text-[9px] uppercase">{t.amount}</p>
                              <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-0.5">
                                <DollarSign size={12} />
                                {(p.amount || p.totalAmount || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 font-bold text-[9px] uppercase">{t.date}</p>
                              <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{p.date || '-'}</p>
                            </div>
                          </div>

                          {p.receipt && (
                            <div className="relative group rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800 max-h-40">
                              <img src={p.receipt} alt="Receipt" className="w-full object-cover max-h-40 group-hover:scale-105 transition-all" />
                              <a 
                                href={p.receipt} 
                                target="_blank" 
                                referrerPolicy="no-referrer"
                                rel="noreferrer"
                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity"
                              >
                                View Full Receipt
                              </a>
                            </div>
                          )}

                          {/* Purchase Action Buttons */}
                          <div className="pt-3 border-t border-slate-50 dark:border-zinc-900 flex justify-end gap-2">
                            <button 
                              onClick={() => startEditPurchase(p)}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1 font-bold shadow-sm"
                            >
                              <Edit2 size={10} /> {t.edit}
                            </button>
                            <button 
                              onClick={() => handleDeletePurchase(p)}
                              className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all flex items-center gap-1 font-bold shadow-sm"
                            >
                              <Trash2 size={10} /> {t.delete}
                            </button>
                            {(p.status === 'pending' || p.status === 'PENDING' || p.status === 'rejected') && (
                              <>
                                {p.status !== 'rejected' && (
                                  <button 
                                    onClick={() => handleRejectPurchase(p)}
                                    className="px-3 py-1.5 text-xs bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-all flex items-center gap-1 font-bold shadow-sm"
                                  >
                                    <X size={10} /> {t.reject}
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleApprovePurchase(p)}
                                  className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all flex items-center gap-1 font-bold shadow-sm"
                                >
                                  <Check size={10} /> {t.approve}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* RELATED MESS PAYMENTS VIEW FOR USER */}
              {requestType === 'PAYMENT' && targetUser && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-2">
                    <CreditCard size={14} />
                    {t.paymentRequest}
                  </h4>
                  
                  {loading ? (
                    <div className="py-10 flex items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-indigo-600" />
                    </div>
                  ) : payments.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">{t.noRecords}</p>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((p) => (
                        <div key={p.id} className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-slate-400 uppercase">ID: {p.id}</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              p.status === 'pending' || p.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' :
                              p.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400' :
                              'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                            }`}>
                              {p.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-slate-400 font-bold text-[9px] uppercase">{t.amount}</p>
                              <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-0.5">
                                <DollarSign size={12} />
                                {(p.amount || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 font-bold text-[9px] uppercase">{t.paymentMethod}</p>
                              <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{p.paymentMethod || '-'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 font-bold text-[9px] uppercase">{t.date}</p>
                              <p className="font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{p.date || '-'}</p>
                            </div>
                          </div>

                          {/* Payment Action Buttons */}
                          <div className="pt-3 border-t border-slate-50 dark:border-zinc-900 flex justify-end gap-2">
                            <button 
                              onClick={() => startEditPayment(p)}
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1 font-bold shadow-sm"
                            >
                              <Edit2 size={10} /> {t.edit}
                            </button>
                            <button 
                              onClick={() => handleDeletePayment(p)}
                              className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 rounded-lg transition-all flex items-center gap-1 font-bold shadow-sm"
                            >
                              <Trash2 size={10} /> {t.delete}
                            </button>
                            {(p.status === 'pending' || p.status === 'PENDING' || p.status === 'rejected') && (
                              <>
                                {p.status !== 'rejected' && (
                                  <button 
                                    onClick={() => handleRejectPayment(p)}
                                    className="px-3 py-1.5 text-xs bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-all flex items-center gap-1 font-bold shadow-sm"
                                  >
                                    <X size={10} /> {t.reject}
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleApprovePayment(p)}
                                  className="px-3 py-1.5 text-xs bg-green-600 text-white hover:bg-green-700 rounded-lg transition-all flex items-center gap-1 font-bold shadow-sm"
                                >
                                  <Check size={10} /> {t.approve}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* EDIT USER FORM */}
          {mode === 'EDIT_USER' && targetUser && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1">
                <Edit2 size={12} />
                Edit Profile: {targetUser.name}
              </h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.name}</label>
                  <input 
                    type="text" 
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t.enterName}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.email}</label>
                  <input 
                    type="email" 
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder={t.enterEmail}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.mobile}</label>
                  <input 
                    type="tel" 
                    value={userForm.mobile}
                    onChange={(e) => setUserForm(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder={t.enterMobile}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.whatsapp}</label>
                  <input 
                    type="tel" 
                    value={userForm.whatsapp}
                    onChange={(e) => setUserForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder={t.enterWhatsapp}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold uppercase text-[9px]">{t.role}</label>
                    <select 
                      value={userForm.role}
                      onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white dark:bg-zinc-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="USER" className="dark:bg-zinc-900">USER</option>
                      <option value="ADMIN" className="dark:bg-zinc-900">ADMIN</option>
                      <option value="MANAGER" className="dark:bg-zinc-900">MANAGER</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold uppercase text-[9px]">{t.status}</label>
                    <select 
                      value={userForm.status}
                      onChange={(e) => setUserForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white dark:bg-zinc-900 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="PENDING" className="dark:bg-zinc-900">PENDING</option>
                      <option value="ENABLED" className="dark:bg-zinc-900">ENABLED</option>
                      <option value="DISABLED" className="dark:bg-zinc-900">DISABLED</option>
                      <option value="BLOCKED" className="dark:bg-zinc-900">BLOCKED</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.expiryDate}</label>
                  <input 
                    type="date" 
                    value={userForm.expiryDate}
                    onChange={(e) => setUserForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Edit User Actions */}
              <div className="pt-4 flex justify-end gap-2">
                <button 
                  onClick={() => setMode('VIEW')}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSaveUserEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5"
                >
                  <Check size={12} /> {t.save}
                </button>
              </div>
            </div>
          )}

          {/* EDIT PURCHASE FORM */}
          {mode === 'EDIT_PURCHASE' && selectedItemForEdit && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1">
                <Edit2 size={12} />
                Edit Purchase Request
              </h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.hypermarketName}</label>
                  <input 
                    type="text" 
                    value={purchaseForm.hypermarketName}
                    onChange={(e) => setPurchaseForm(prev => ({ ...prev, hypermarketName: e.target.value }))}
                    placeholder={t.enterHypermarket}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.amount}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={purchaseForm.amount}
                    onChange={(e) => setPurchaseForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder={t.enterAmount}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.date}</label>
                  <input 
                    type="date" 
                    value={purchaseForm.date}
                    onChange={(e) => setPurchaseForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.status}</label>
                  <select 
                    value={purchaseForm.status}
                    onChange={(e) => setPurchaseForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white dark:bg-zinc-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pending" className="dark:bg-zinc-900">pending</option>
                    <option value="approved" className="dark:bg-zinc-900">approved</option>
                    <option value="rejected" className="dark:bg-zinc-900">rejected</option>
                  </select>
                </div>
              </div>

              {/* Edit Purchase Actions */}
              <div className="pt-4 flex justify-end gap-2">
                <button 
                  onClick={() => setMode('VIEW')}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSavePurchaseEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5"
                >
                  <Check size={12} /> {t.save}
                </button>
              </div>
            </div>
          )}

          {/* EDIT PAYMENT FORM */}
          {mode === 'EDIT_PAYMENT' && selectedItemForEdit && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 border-b border-slate-100 dark:border-zinc-800 pb-2 flex items-center gap-1">
                <Edit2 size={12} />
                Edit Payment Request
              </h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.amount}</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder={t.enterAmount}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.paymentMethod}</label>
                  <select 
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white dark:bg-zinc-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Cash" className="dark:bg-zinc-900">Cash</option>
                    <option value="Bank Transfer" className="dark:bg-zinc-900">Bank Transfer</option>
                    <option value="Mobile Banking" className="dark:bg-zinc-900">Mobile Banking</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.date}</label>
                  <input 
                    type="date" 
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold uppercase text-[9px]">{t.status}</label>
                  <select 
                    value={paymentForm.status}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full mt-1 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-transparent dark:text-white dark:bg-zinc-900 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="pending" className="dark:bg-zinc-900">pending</option>
                    <option value="approved" className="dark:bg-zinc-900">approved</option>
                    <option value="rejected" className="dark:bg-zinc-900">rejected</option>
                  </select>
                </div>
              </div>

              {/* Edit Payment Actions */}
              <div className="pt-4 flex justify-end gap-2">
                <button 
                  onClick={() => setMode('VIEW')}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSavePaymentEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-bold text-xs flex items-center gap-1.5"
                >
                  <Check size={12} /> {t.save}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 flex justify-end shrink-0 gap-2">
          {mode === 'VIEW' ? (
            <button 
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center"
            >
              {t.close}
            </button>
          ) : (
            <button 
              onClick={() => setMode('VIEW')}
              className="px-6 py-2.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center"
            >
              {t.cancel}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

// Fallback legacy component so route mapping in App.tsx remains intact
const NotificationDetailView: React.FC = () => {
  const { setView } = useStore();
  React.useEffect(() => {
    setView('NOTIFICATIONS');
  }, [setView]);
  return null;
};

export { NotificationsView, NotificationDetailView };
