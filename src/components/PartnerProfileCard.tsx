import React from 'react';
import { 
  Edit, 
  Trash2, 
  User as UserIcon, 
  Power, 
  Users, 
  Phone, 
  Calendar, 
  Globe, 
  MapPin, 
  ShoppingCart, 
  Shield, 
  Wallet, 
  Tag, 
  Navigation, 
  Compass, 
  Building, 
  Zap, 
  Home,
  Scale
} from 'lucide-react';

interface PartnerProfileCardProps {
  selectedPartnerProfile: any;
  globalUsers: any[];
  isDarkMode: boolean;
  user: any;
  purchases: any[];
  partners: any[];
  totalPurchaseAmount: number | string;
  isAdmin: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStatus?: () => void;
}

const PartnerProfileCard: React.FC<PartnerProfileCardProps> = ({
  selectedPartnerProfile,
  globalUsers,
  isDarkMode,
  user,
  purchases,
  partners,
  totalPurchaseAmount,
  isAdmin,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const partnerUser = globalUsers.find(u => u.id === selectedPartnerProfile.userId);
  const partnerMobile = selectedPartnerProfile.mobile || partnerUser?.mobileNumber || partnerUser?.mobile || 'No Mobile';
  const partnerAvatar = selectedPartnerProfile.avatar || partnerUser?.avatar;

  return (
    <div 
      className="relative overflow-hidden rounded-[12px] flex flex-col bg-theme-card border border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] p-5 md:p-6 text-text-main"
      style={{ boxShadow: 'var(--dynamic-card-shadow)' }}
    >
      {/* Visual accents */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      {/* Action Buttons */}
      {user?.role === 'ADMIN' && (
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button 
            onClick={onEdit}
            className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/5 dark:border-white/10 flex items-center justify-center transition-colors text-blue-600 dark:text-blue-400 shadow-xs"
            title="Edit Partner"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={onDelete}
            className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-black/5 dark:border-white/10 flex items-center justify-center transition-colors text-rose-600 dark:text-rose-400 shadow-xs"
            title="Delete Partner"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Header Info */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-3 mb-6">
        <div className="w-24 h-24 rounded-2xl bg-black/5 dark:bg-white/5 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 overflow-hidden border-2 border-purple-500/20 shadow-md">
          {partnerAvatar ? (
            <img src={partnerAvatar} alt={selectedPartnerProfile.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={40} />
          )}
        </div>
        <div>
          <div className="flex flex-col items-center justify-center gap-1 mt-1 mx-auto w-fit">
            <h2 className="text-2xl font-black text-text-main leading-tight border-b-2 border-amber-400 w-fit pb-1">
              {selectedPartnerProfile.name}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            {user?.role === 'ADMIN' ? (
              <button 
                onClick={onToggleStatus}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  (selectedPartnerProfile.status || 'active') === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                }`}
              >
                <Power size={12} /> {(selectedPartnerProfile.status || 'active') === 'active' ? 'Active' : 'Inactive'}
              </button>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                (selectedPartnerProfile.status || 'active') === 'active' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {(selectedPartnerProfile.status || 'active') === 'active' ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid: Left-Right layout with matching icons */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Account Type */}
        <div className="bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Account Type</span>
          </div>
          <span className="font-black text-text-main text-sm">
            {selectedPartnerProfile.accountType === 'MANAGER' ? 'Manager Profile' : 'Partner'}
          </span>
        </div>

        {/* Manager ID / Partner ID */}
        <div className="bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Shield size={16} />
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              {selectedPartnerProfile.accountType === 'MANAGER' ? 'Manager ID' : 'Partner ID'}
            </span>
          </div>
          <span className="font-black text-text-main text-sm font-mono">
            {selectedPartnerProfile.partnerId || 'N/A'}
          </span>
        </div>

        {/* Mobile Number */}
        <div className="bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Phone size={16} />
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Mobile Number</span>
          </div>
          <span className="font-black text-text-main text-sm">
            {partnerMobile}
          </span>
        </div>

        {/* Date of Birth */}
        <div className="bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Date of Birth</span>
          </div>
          <span className="font-black text-text-main text-sm">
            {selectedPartnerProfile.dob || 'N/A'}
          </span>
        </div>

        {/* Nationality */}
        <div className="bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Globe size={16} />
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Nationality</span>
          </div>
          <span className="font-black text-text-main text-sm">
            {selectedPartnerProfile.nationality || 'N/A'}
          </span>
        </div>

        {/* Country */}
        <div className="bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <MapPin size={16} />
            </div>
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Country</span>
          </div>
          <span className="font-black text-text-main text-sm">
            {selectedPartnerProfile.country || 'N/A'}
          </span>
        </div>

        {/* Monthly Salary */}
        {selectedPartnerProfile.monthlySalary && (
          <div className="bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Wallet size={16} />
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Monthly Salary</span>
            </div>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
              {selectedPartnerProfile.monthlySalary} QAR
            </span>
          </div>
        )}

        {/* Price (Current Month) */}
        {selectedPartnerProfile.price && (
          <div className="bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <Tag size={16} />
              </div>
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Price (Current Month)</span>
            </div>
            <span className="font-black text-purple-600 dark:text-purple-400 text-sm">
              {selectedPartnerProfile.price} QAR
            </span>
          </div>
        )}
        
        {/* Address Section */}
        <div className="md:col-span-2 bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-4 shadow-xs mt-1">
          <span className="text-xs font-black text-text-muted uppercase tracking-widest block mb-3 border-b border-black/5 dark:border-white/10 pb-2">
            Address Details
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-white dark:bg-white/5 p-2.5 rounded-lg border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Navigation size={14} className="text-purple-500" />
                <span className="text-[10px] font-bold text-text-muted uppercase">State No</span>
              </div>
              <span className="text-xs font-black text-text-main">{selectedPartnerProfile.stateNumber || '-'}</span>
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-white/5 p-2.5 rounded-lg border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Compass size={14} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-text-muted uppercase">Zone No</span>
              </div>
              <span className="text-xs font-black text-text-main">{selectedPartnerProfile.zoneNumber || '-'}</span>
            </div>
            <div className="flex items-center justify-between bg-white dark:bg-white/5 p-2.5 rounded-lg border border-black/5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <Building size={14} className="text-blue-500" />
                <span className="text-[10px] font-bold text-text-muted uppercase">Building No</span>
              </div>
              <span className="text-xs font-black text-text-main">{selectedPartnerProfile.buildingNumber || '-'}</span>
            </div>
            {selectedPartnerProfile.electricityNumber && (
              <div className="flex items-center justify-between bg-white dark:bg-white/5 p-2.5 rounded-lg border border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-amber-500" />
                  <span className="text-[10px] font-bold text-text-muted uppercase">Electricity No</span>
                </div>
                <span className="text-xs font-black text-text-main">{selectedPartnerProfile.electricityNumber}</span>
              </div>
            )}
            <div className="flex items-center justify-between bg-white dark:bg-white/5 p-2.5 rounded-lg border border-black/5 dark:border-white/5 md:col-span-2">
              <div className="flex items-center gap-2">
                <Home size={14} className="text-emerald-500" />
                <span className="text-[10px] font-bold text-text-muted uppercase">Area Name</span>
              </div>
              <span className="text-xs font-black text-text-main">{selectedPartnerProfile.areaName || '-'}</span>
            </div>
          </div>
        </div>

        {/* Expense Calculation (For Users) */}
        {!isAdmin && (() => {
          const partnerPurchases = purchases.filter(p => {
            const pId = String(p.userId);
            const matchId = pId === String(selectedPartnerProfile.userId) || pId === String(partnerUser?.userId) || pId === String(partnerUser?.id);
            const matchStatus = p.status === 'approved' || !p.status;
            return matchId && matchStatus;
          });
          const partnerTotal = partnerPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const averagePerPartner = partners.length > 0 ? Number(totalPurchaseAmount) / partners.length : 0;
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

          return (
            <div className="md:col-span-2 bg-slate-50/80 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl mt-1 overflow-hidden shadow-xs">
              <div className="flex items-center justify-between p-3.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={16} className="text-purple-500" />
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Purchase</span>
                </div>
                <span className="font-black text-sm text-text-main">{partnerTotal.toFixed(2)} <span className="text-xs font-bold text-text-muted">QAR</span></span>
              </div>
              
              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-indigo-500" />
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Mess Balance</span>
                </div>
                <span className={`font-black text-sm ${balanceClass}`}>
                  {balanceStr}
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default PartnerProfileCard;
