import React from 'react';
import { Edit, Trash2, User as UserIcon, Power, Users, Phone, Calendar, Globe, MapPin, ShoppingCart } from 'lucide-react';

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
    <div className={`relative overflow-hidden rounded-[12px] flex flex-col text-white shadow-2xl border border-white/10 p-5 md:p-6 ${isDarkMode ? 'bg-[#121212]' : 'bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a]'}`}>
      {/* Visual accents */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
      
      {/* Action Buttons */}
      {user?.role === 'ADMIN' && (
        <div className="absolute top-4 right-4 flex gap-2 z-20">
          <button 
            onClick={onEdit}
            className="w-10 h-10 rounded-[12px] bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors text-blue-400">
            <Edit size={18} />
          </button>
          <button 
            onClick={onDelete}
            className="w-10 h-10 rounded-[12px] bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors text-red-400">
            <Trash2 size={18} />
          </button>
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center text-center space-y-4 mb-8">
        <div className="w-24 h-24 rounded-[10px] bg-white/5 text-purple-400 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white/10 shadow-xl">
          {partnerAvatar ? (
            <img src={partnerAvatar} alt={selectedPartnerProfile.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={40} />
          )}
        </div>
        <div>
          <div className="flex flex-col items-center justify-center gap-1 mt-1 mx-auto w-fit">
            <h2 className="text-2xl font-black text-white leading-tight border-b-[1.5px] border-[#FFD700] w-fit pb-1">{selectedPartnerProfile.name}</h2>
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            {user?.role === 'ADMIN' ? (
              <button 
                onClick={onToggleStatus}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider transition-colors ${
                  (selectedPartnerProfile.status || 'active') === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                }`}
              >
                <Power size={12} /> {(selectedPartnerProfile.status || 'active') === 'active' ? 'Active' : 'Inactive'}
              </button>
            ) : (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                (selectedPartnerProfile.status || 'active') === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {(selectedPartnerProfile.status || 'active') === 'active' ? 'Active' : 'Inactive'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Account Type</span>
          <span className="font-bold text-white text-sm flex items-center gap-2">
            <Users size={14} className="text-purple-400" /> {selectedPartnerProfile.accountType === 'MANAGER' ? 'Manager Profile' : 'Partner'}
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            {selectedPartnerProfile.accountType === 'MANAGER' ? 'Manager ID' : 'Partner ID'}
          </span>
          <span className="font-bold text-white text-sm flex items-center gap-2 font-mono">
             {selectedPartnerProfile.partnerId || 'N/A'}
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Date of Birth</span>
          <span className="font-bold text-white text-sm flex items-center gap-2">
            <Calendar size={14} className="text-purple-400" /> {selectedPartnerProfile.dob || 'N/A'}
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nationality</span>
          <span className="font-bold text-white text-sm flex items-center gap-2">
            <Globe size={14} className="text-purple-400" /> {selectedPartnerProfile.nationality || 'N/A'}
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Country</span>
          <span className="font-bold text-white text-sm flex items-center gap-2">
            <MapPin size={14} className="text-purple-400" /> {selectedPartnerProfile.country || 'N/A'}
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Monthly Salary</span>
          <span className="font-bold text-white text-sm flex items-center gap-2">
            <ShoppingCart size={14} className="text-purple-400" /> {selectedPartnerProfile.monthlySalary ? `${selectedPartnerProfile.monthlySalary} QAR` : 'N/A'}
          </span>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Price (Current Month)</span>
          <span className="font-bold text-white text-sm flex items-center gap-2">
            <ShoppingCart size={14} className="text-purple-400" /> {selectedPartnerProfile.price ? `${selectedPartnerProfile.price} QAR` : 'N/A'}
          </span>
        </div>
        
        {/* Address Section */}
        <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4 mt-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3 border-b border-white/10 pb-2">Address Details</span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">State No</span>
              <span className="text-sm font-medium text-white">{selectedPartnerProfile.stateNumber || '-'}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Zone No</span>
              <span className="text-sm font-medium text-white">{selectedPartnerProfile.zoneNumber || '-'}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Building No</span>
              <span className="text-sm font-medium text-white">{selectedPartnerProfile.buildingNumber || '-'}</span>
            </div>
            <div className="col-span-2 md:col-span-3">
              <span className="text-[9px] text-slate-400 uppercase block">Area Name</span>
              <span className="text-sm font-medium text-white">{selectedPartnerProfile.areaName || '-'}</span>
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
            balanceClass = "text-emerald-400";
          } else if (balance < 0) {
            balanceStr = `Minus (${balance.toFixed(2)})`;
            balanceClass = "text-rose-400";
          } else {
            balanceStr = "0.00";
            balanceClass = "text-slate-300";
          }

          return (
            <div className="md:col-span-2 bg-black/20 border border-white/10 rounded-xl mt-2 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Purchase</span>
                <span className="font-bold text-sm text-white">{partnerTotal.toFixed(2)} <span className="text-[10px] text-slate-400">QAR</span></span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest relative z-10">Mess Balance</span>
                <span className={`font-black text-sm relative z-10 ${balanceClass}`}>
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
