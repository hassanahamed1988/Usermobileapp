import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { isExpired } from '../utils/dateUtils';
import { Search, UserCheck, UserX, Ban, Users, Shield, ArrowRight } from 'lucide-react';
import InputField from '../components/InputField';


const UserAccounts: React.FC = () => {
  const { language, setView, users, setSelectedUser, currentThemeObj, selectedCurrency } = useStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];
  
  // Tab State: 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'INACTIVE' | 'BLOCKED'>('ACTIVE');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Active Users (status is ENABLED and account is NOT expired and not Admin)
  const activeUsersList = useMemo(() => {
    return (users || []).filter(u => u.role !== 'ADMIN' && u.status === 'ENABLED' && !isExpired(u.expiryDate));
  }, [users]);

  // 2. Inactive Users (account is expired and not Admin and not Blocked)
  const inactiveUsersList = useMemo(() => {
    return (users || []).filter(u => u.role !== 'ADMIN' && u.status !== 'BLOCKED' && isExpired(u.expiryDate));
  }, [users]);

  // 3. Blocked Users (status is BLOCKED and not Admin)
  const blockedUsersList = useMemo(() => {
    return (users || []).filter(u => u.role !== 'ADMIN' && u.status === 'BLOCKED');
  }, [users]);

  // Search filter for the currently selected list below
  const currentFilteredList = useMemo(() => {
    const list = 
      activeTab === 'ACTIVE' ? activeUsersList :
      activeTab === 'INACTIVE' ? inactiveUsersList :
      blockedUsersList;

    return list.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.id && u.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.userId && u.userId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [activeTab, activeUsersList, inactiveUsersList, blockedUsersList, searchTerm]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0,
        delayChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <div 
      className="space-y-5 pb-10"
    >
      {/* First Row Card - Tab Controller Card */}
      <div 
        className="bg-theme-card border border-black/5 dark:border-white/5 p-5 rounded-2xl shadow-xl space-y-4"
      >
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Active User Tab */}
          <button
            onClick={() => { setActiveTab('ACTIVE'); setSearchTerm(''); }}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-colors duration-200 ${
              activeTab === 'ACTIVE'
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 active-scale-95'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-text-muted hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'
            }`}
          >
            <UserCheck size={22} className="mb-1.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest block">
              {language === 'bn' ? 'অ্যাক্টিভ ইউজার' : 'Active User'}
            </span>
            <span className="text-lg font-black mt-0.5">{activeUsersList.length}</span>
          </button>

          {/* Inactive User Tab */}
          <button
            onClick={() => { setActiveTab('INACTIVE'); setSearchTerm(''); }}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-colors duration-200 ${
              activeTab === 'INACTIVE'
                ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 active-scale-95'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-text-muted hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'
            }`}
          >
            <UserX size={22} className="mb-1.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest block">
              {language === 'bn' ? 'ইন অ্যাক্টিভ ইউজার' : 'Inactive User'}
            </span>
            <span className="text-lg font-black mt-0.5">{inactiveUsersList.length}</span>
          </button>

          {/* Block User Tab */}
          <button
            onClick={() => { setActiveTab('BLOCKED'); setSearchTerm(''); }}
            className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-colors duration-200 ${
              activeTab === 'BLOCKED'
                ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 active-scale-95'
                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 text-text-muted hover:bg-black/[0.05] dark:hover:bg-white/[0.05]'
            }`}
          >
            <Ban size={22} className="mb-1.5" />
            <span className="text-xs font-extrabold uppercase tracking-widest block">
              {language === 'bn' ? 'ব্লক ইউজার' : 'Block User'}
            </span>
            <span className="text-lg font-black mt-0.5">{blockedUsersList.length}</span>
          </button>
        </div>
      </div>

      {/* Search Input for currently active tab */}
      <div  className="relative z-0">
        <InputField
          label={
            activeTab === 'ACTIVE' 
              ? (language === 'bn' ? 'সক্রিয় ইউজার খুঁজুন...' : 'Search active users...') 
              : activeTab === 'INACTIVE'
                ? (language === 'bn' ? 'নিষ্ক্রিয় ইউজার খুঁজুন...' : 'Search inactive users...')
                : (language === 'bn' ? 'ব্লকড ইউজার খুঁজুন...' : 'Search blocked users...')
          }
          name="searchAccounts"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search size={20} />}
          className="h-14 font-medium"
        />
      </div>

      {/* Main List Display of Selected Tab */}
      <div className="pb-8">
        <>
          <div
            key={activeTab + searchTerm}
            
            
            
            
            className="flex flex-col gap-4 p-1"
          >
            {currentFilteredList.length > 0 ? (
              currentFilteredList.map(user => (
                <button 
                  key={user.id} 
                  
                  onClick={() => {
                    setSelectedUser(user);
                    setView('USER_PROFILE');
                  }}
                  className="w-full bg-theme-card p-4 rounded-xl border border-black/5 dark:border-white/5 flex flex-col text-left hover:border-cyan-500 dark:hover:border-cyan-400/50 hover:shadow-lg transition-all relative overflow-hidden group gap-3"
                >
                  <div className="w-full flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                        activeTab === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20' 
                          : activeTab === 'INACTIVE'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500/20'
                      }`}>
                        {activeTab === 'ACTIVE' ? <UserCheck size={20} /> : activeTab === 'INACTIVE' ? <UserX size={20} /> : <Ban size={20} />}
                      </div>
                      <h3 className="font-extrabold text-sm text-text-main group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors uppercase tracking-wide">{user.name}</h3>
                    </div>
                    
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                      activeTab === 'ACTIVE' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                        : activeTab === 'INACTIVE'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase'
                    }`}>
                      {activeTab === 'ACTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                      {activeTab === 'ACTIVE' ? 'Active' : activeTab === 'INACTIVE' ? (language === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'EXPIRED') : (language === 'bn' ? 'ব্লকড' : 'BLOCKED')}
                    </span>
                  </div>

                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded text-text-muted font-mono font-bold">ID: {user.id}</span>
                      {user.expiryDate && (
                        <>
                          <span className="text-black/20 dark:text-white/20">|</span>
                          <span className="text-[10px] text-text-muted font-bold">Exp: {user.expiryDate}</span>
                        </>
                      )}
                    </div>
                    <div className="text-text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="col-span-full h-48 flex flex-col items-center justify-center text-text-muted opacity-60">
                <Users size={48} className="mb-2" />
                <p className="text-sm font-black uppercase tracking-wider">{language === 'bn' ? 'কোন ব্যবহারকারী পাওয়া যায়নি' : 'No users found'}</p>
                {searchTerm && <p className="text-xs mt-1">{language === 'bn' ? 'ভিন্ন কিছু লিখে খুঁজুন' : 'Try searching for something else'}</p>}
              </div>
            )}
          </div>
        </>
      </div>
    </div>
  );
};

export default UserAccounts;
