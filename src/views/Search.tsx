import React, { useState } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { ChevronLeft, ChevronRight, Search as SearchIcon, User, Ban, Truck, FileText } from 'lucide-react';
import InputField from '../components/InputField';


type SearchTab = 'USER' | 'TRIP' | null;
type UserSearchType = 'ID' | 'MOBILE' | 'ID_NUMBER' | null;
type TripSearchType = 'BAYAN' | 'CONTAINER' | 'INVOICE' | null;

const Search: React.FC = () => {
  const { language, setView, users, trips, user, setSelectedUser, setSelectedTrip, setEditingTrip } = useStore();
  const t = TRANSLATIONS[language];
  const isAdmin = user?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<SearchTab>(isAdmin ? 'USER' : 'TRIP');
  const [userSearchType, setUserSearchType] = useState<UserSearchType>(null);
  const [tripSearchType, setTripSearchType] = useState<TripSearchType>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const hasSearchTerm = searchTerm.trim().length > 0;

  const isSearchDisabled = !activeTab || (activeTab === 'USER' && !userSearchType) || (activeTab === 'TRIP' && !tripSearchType);

  let searchLabel = 'Select a category...';
  if (activeTab === 'USER') {
    if (userSearchType === 'ID') {
      searchLabel = 'Search by id numbers';
    } else if (userSearchType === 'MOBILE') {
      searchLabel = 'Search by mobile numbers';
    } else if (userSearchType === 'ID_NUMBER') {
      searchLabel = 'Search by id numbers';
    } else {
      searchLabel = 'Select user search type...';
    }
  } else if (activeTab === 'TRIP') {
    if (tripSearchType === 'CONTAINER') {
      searchLabel = 'Search by Container numbers';
    } else if (tripSearchType === 'BAYAN') {
      searchLabel = 'Search by bayan numbers';
    } else if (tripSearchType === 'INVOICE') {
      searchLabel = 'Search by invoice numbers';
    } else {
      searchLabel = 'Select trip search type...';
    }
  }

  const normalizeDigits = (str: string) => {
    const bengaliToLatin: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    return str.replace(/[০-৯]/g, m => bengaliToLatin[m]);
  };

  const filteredUsers = userSearchType && hasSearchTerm ? (users || []).filter(u => {
    try {
      const normalizedTerm = normalizeDigits(searchTerm.toLowerCase()).trim();
      const cleanTerm = normalizedTerm.replace(/\D/g, '');
      
      switch (userSearchType) {
        case 'ID': {
          const userId = normalizeDigits(String(u.id || '').toLowerCase());
          return userId.includes(normalizedTerm) || (cleanTerm !== '' && userId.replace(/\D/g, '').includes(cleanTerm));
        }
        case 'MOBILE': {
          const mobile = normalizeDigits(String(u.mobileNumber || '').toLowerCase());
          const emergency = normalizeDigits(String(u.emergencyContact || '').toLowerCase());
          const cleanMobile = mobile.replace(/\D/g, '');
          const cleanEmergency = emergency.replace(/\D/g, '');
          
          // Try exact match, direct inclusion, and cleaned digit inclusion
          const matchesMobile = mobile.includes(normalizedTerm) || 
                              (cleanTerm !== '' && cleanMobile.includes(cleanTerm)) ||
                              (cleanTerm !== '' && cleanTerm.includes(cleanMobile));
          
          const matchesEmergency = emergency.includes(normalizedTerm) || 
                                 (cleanTerm !== '' && cleanEmergency.includes(cleanTerm)) ||
                                 (cleanTerm !== '' && cleanTerm.includes(cleanEmergency));
          
          return matchesMobile || matchesEmergency;
        }
        case 'ID_NUMBER': {
          const idNum = normalizeDigits(String(u.idNumber || '').toLowerCase());
          return idNum.includes(normalizedTerm) || (cleanTerm !== '' && idNum.replace(/\D/g, '').includes(cleanTerm));
        }
        default: return false;
      }
    } catch (err) {
      console.error("Search filter error:", err);
      return false;
    }
  }) : [];

  const filteredTrips = tripSearchType && hasSearchTerm ? trips.filter(trip => {
    const term = searchTerm.toLowerCase();
    switch (tripSearchType) {
      case 'BAYAN': return (trip.bayanNumber || '').toLowerCase().includes(term);
      case 'CONTAINER': return (trip.containerNumber || '').toLowerCase().includes(term);
      case 'INVOICE': return (trip.invoiceNumber || '').toLowerCase().includes(term);
      default: return false;
    }
  }) : [];

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
        type: 'tween', duration: 0,
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <div 
      
      
      
      className="h-full flex flex-col px-global pt-global pb-0"
    >
      {/* Main Tabs */}
      {isAdmin && (
        <>
          <div className="flex p-1 bg-theme-card border-gray-100 dark:border-white/5 rounded-[10px] mb-[20px] relative allow-animation">
            <button
              onClick={() => { setActiveTab('USER'); setUserSearchType(null); setSearchTerm(''); }}
              className={`flex-1 relative py-3 rounded-[8px] font-bold text-sm transition-colors duration-200 ${
                activeTab === 'USER' 
                  ? 'text-white' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {activeTab === 'USER' && (
                <div
                  
                  className="absolute inset-0 bg-cyan-500 z-0 rounded-[8px]"
                  
                />
              )}
              <span className="relative z-10">User</span>
            </button>
            
            <button
              onClick={() => { setActiveTab('TRIP'); setTripSearchType(null); setSearchTerm(''); }}
              className={`flex-1 relative py-3 rounded-[8px] font-bold text-sm transition-colors duration-200 ${
                activeTab === 'TRIP' 
                  ? 'text-white' 
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {activeTab === 'TRIP' && (
                <div
                  
                  className="absolute inset-0 bg-cyan-500 z-0 rounded-[8px]"
                  
                />
              )}
              <span className="relative z-10">Trip</span>
            </button>
          </div>
        </>
      )}

      {activeTab && (
        <div   >
          {/* Sub Tabs based on Main Tab */}
          <>
            <div className="flex p-1 bg-theme-card border-gray-100 dark:border-white/5 rounded-[10px] mb-[18px] relative allow-animation">
              {activeTab === 'USER' ? (
                <>
                  <button
                    onClick={() => { setUserSearchType('ID'); }}
                    className={`flex-1 relative h-10 rounded-[8px] text-[10px] font-bold transition-colors duration-200 ${
                      userSearchType === 'ID' 
                        ? 'text-white' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {userSearchType === 'ID' && (
                      <div
                        
                        className="absolute inset-0 bg-cyan-500 z-0 rounded-[8px]"
                        
                      />
                    )}
                    <span className="relative z-10">User ID</span>
                  </button>
                  <button
                    onClick={() => { setUserSearchType('MOBILE'); }}
                    className={`flex-1 relative h-10 rounded-[8px] text-[10px] font-bold transition-colors duration-200 ${
                      userSearchType === 'MOBILE' 
                        ? 'text-white' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {userSearchType === 'MOBILE' && (
                      <div
                        
                        className="absolute inset-0 bg-cyan-500 z-0 rounded-[8px]"
                        
                      />
                    )}
                    <span className="relative z-10">Mobile Number</span>
                  </button>
                  <button
                    onClick={() => { setUserSearchType('ID_NUMBER'); }}
                    className={`flex-1 relative h-10 rounded-[8px] text-[10px] font-bold transition-colors duration-200 ${
                      userSearchType === 'ID_NUMBER' 
                        ? 'text-white' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {userSearchType === 'ID_NUMBER' && (
                      <div
                        
                        className="absolute inset-0 bg-cyan-500 z-0 rounded-[8px]"
                        
                      />
                    )}
                    <span className="relative z-10">ID Number</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setTripSearchType('BAYAN'); }}
                    className={`flex-1 relative h-10 rounded-[8px] text-[10px] font-bold transition-colors duration-200 ${
                      tripSearchType === 'BAYAN' 
                        ? 'text-white' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {tripSearchType === 'BAYAN' && (
                      <div
                        
                        className="absolute inset-0 bg-cyan-500 z-0 rounded-[8px]"
                        
                      />
                    )}
                    <span className="relative z-10">Bayan</span>
                  </button>
                  <button
                    onClick={() => { setTripSearchType('CONTAINER'); }}
                    className={`flex-1 relative h-10 rounded-[8px] text-[10px] font-bold transition-colors duration-200 ${
                      tripSearchType === 'CONTAINER' 
                        ? 'text-white' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {tripSearchType === 'CONTAINER' && (
                      <div
                        
                        className="absolute inset-0 bg-cyan-500 z-0 rounded-[8px]"
                        
                      />
                    )}
                    <span className="relative z-10">Container</span>
                  </button>
                  <button
                    onClick={() => { setTripSearchType('INVOICE'); }}
                    className={`flex-1 relative h-10 rounded-[8px] text-[10px] font-bold transition-colors duration-200 ${
                      tripSearchType === 'INVOICE' 
                        ? 'text-white' 
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {tripSearchType === 'INVOICE' && (
                      <div
                        
                        className="absolute inset-0 bg-cyan-500 z-0 rounded-[8px]"
                        
                      />
                    )}
                    <span className="relative z-10">Invoice</span>
                  </button>
                </>
              )}
            </div>
          </>
        </div>
      )}

      {/* Search Input */}
      <div  className="mb-[8px]">
        <style>{`
          #global-search-input {
            color: var(--search-text-color, #ffffff) !important;
            -webkit-text-fill-color: var(--search-text-color, #ffffff) !important;
          }
          #global-search-input::placeholder {
            color: var(--search-label-color, rgba(255,255,255,0.7)) !important;
            -webkit-text-fill-color: var(--search-label-color, rgba(255,255,255,0.7)) !important;
          }
        `}</style>
        <div 
          className="bg-transparent p-0 rounded-[16px] border-none">
          <InputField
            id="global-search-input"
            label={searchLabel}
            placeholder={searchLabel}
            name="search"
            type={(activeTab === 'USER' && (userSearchType === 'MOBILE' || userSearchType === 'ID')) || (activeTab === 'TRIP' && tripSearchType === 'BAYAN') ? 'tel' : 'text'}
            inputMode={(activeTab === 'USER' && (userSearchType === 'MOBILE' || userSearchType === 'ID' || userSearchType === 'ID_NUMBER')) || (activeTab === 'TRIP' && tripSearchType === 'BAYAN') ? 'numeric' : undefined}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<SearchIcon size={22} className="text-white/70" />}
            className="h-14 text-lg bg-theme-card"
            inputClassName="!text-white !placeholder-white/70 font-bold"
            readOnly={isSearchDisabled}
          />
        </div>
      </div>

      {/* Results Header */}
      {activeTab === 'USER' && hasSearchTerm && filteredUsers.length > 0 && (
        <div  className="flex items-center justify-between px-1 mb-1">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
            {userSearchType?.replace('_', ' ')} Search Results
          </span>
          <span className="text-[10px] font-black bg-cyan-500 text-white px-2 py-0.5 rounded-full shadow-sm">
            {filteredUsers.length}
          </span>
        </div>
      )}

      {activeTab === 'TRIP' && hasSearchTerm && filteredTrips.length > 0 && (
        <div  className="flex items-center justify-between px-1 mb-2">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
            {tripSearchType?.replace('_', ' ')} Search Results
          </span>
          <span className="text-[10px] font-black bg-cyan-500 text-white px-2 py-0.5 rounded-full shadow-sm">
            {filteredTrips.length}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pt-2 pb-[calc(76px+env(safe-area-inset-bottom)+40px)] scrollbar-hide">
        {!activeTab ? (
          <div    className="h-full flex flex-col items-center justify-center text-text-muted">
            <SearchIcon size={64} className="mb-4 text-text-muted" />
            <p className="text-lg font-medium text-text-main">Select a category to start searching</p>
          </div>
        ) : activeTab === 'USER' ? (
          filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredUsers.map(u => (
                <div 
                  key={u.id}
                  
                  
                  
                  
                  onClick={() => {
                    setSelectedUser(u);
                    setView('USER_PROFILE');
                  }}
                  className="bg-theme-card py-3 px-5 rounded-[10px] flex items-center justify-between shadow-sm border-gray-100 dark:border-white/5 cursor-pointer group min-h-[75px]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      u.status === 'BLOCKED' 
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400'
                    }`}>
                      {u.status === 'BLOCKED' ? <Ban size={24} /> : <User size={24} />}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-text-main group-hover:text-cyan-400 transition-colors uppercase text-sm">{u.name}</h3>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          u.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                            : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-medium text-text-muted mt-0.5">
                        {u.id}
                      </span>
                      {userSearchType === 'MOBILE' && (u.mobileNumber || u.emergencyContact) && (
                        <span className="text-[10px] text-cyan-400 mt-0.5 font-bold">
                          {u.mobileNumber || u.emergencyContact}
                        </span>
                      )}
                      {userSearchType === 'ID_NUMBER' && u.idNumber && (
                        <span className="text-[10px] text-cyan-400 mt-0.5 font-bold">
                          {u.idNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                      u.status === 'BLOCKED'
                        ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {u.status}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(u);
                        setView('USER_PROFILE');
                      }}
                      className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:underline"
                    >
                      {t.VIEW_PROFILE_LABEL}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div    className="h-full flex flex-col items-center justify-center text-text-muted">
              <SearchIcon size={64} className="mb-4 text-text-muted" />
              <p className="text-lg font-medium text-text-main">No users found</p>
            </div>
          )
        ) : (
          filteredTrips.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredTrips.map(trip => {
                const isCompleted = trip.status === 'COMPLETED' || trip.tariffStatus?.toLowerCase() === 'complete' || trip.tariffStatus?.toLowerCase() === 'completed';
                return (
                  <div 
                    key={trip.id}
                    
                    
                    
                    
                    onClick={() => {
                      setSelectedTrip(trip);
                      setView('TRIP_DETAILS');
                    }}
                    className="bg-[#FFFDF9] dark:bg-[#1C1A17] px-4 pt-2 pb-2 rounded-[10px] flex items-center justify-between shadow-sm border-[1.5px] border-[#E5D5B8] dark:border-amber-500/20 cursor-pointer group transition-all duration-300 hover:shadow-md hover:border-[#D4AF37] min-h-[72px]"
                  >
                    {/* Left content block */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Standalone brown truck icon */}
                      <div className="text-[#8C6239] dark:text-amber-500/80 shrink-0">
                        <Truck size={28} strokeWidth={1.8} />
                      </div>
                      
                      {/* Text block with divider lines */}
                      <div className="flex-1 min-w-0 flex">
                        <div className="flex flex-col items-start w-full max-w-full">
                          <h3 className="font-extrabold text-[12px] text-[#0A2540] dark:text-amber-100 uppercase truncate leading-tight tracking-wide group-hover:text-[#8C6239] transition-colors max-w-full">
                            {trip.companyName || 'Unknown Customer'}
                          </h3>
                          
                          <div className="w-fit flex flex-col items-start">
                            {/* Top divider */}
                            <div className="h-[1px] bg-[#E5D5B8] dark:bg-amber-500/15 my-1 w-full" />
                            
                            {/* Container / Invoice info */}
                            <div className="text-[10px] text-slate-700 dark:text-amber-200/80 font-bold tracking-wide -ml-[1px] whitespace-nowrap">
                              C: {trip.containerNumber || 'N/A'} <span className="text-[#E5D5B8] mx-0.5">|</span> {trip.invoiceNumber || 'N/A'}
                            </div>
                            
                            {/* Bottom divider */}
                            <div className="h-[1px] bg-[#E5D5B8] dark:bg-amber-500/15 my-1 w-full" />
                          </div>
                          
                          {/* Loading Date */}
                          <div className="text-[10px] text-[#8C6239] dark:text-amber-400/90 font-bold tracking-wide flex items-center gap-1 max-w-full">
                            <span className="opacity-70 font-medium">Loading Date:</span> 
                            <span>{trip.loadingDate || trip.date || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right controls block (Only COMPLETE/INCOMPLETE badge and chevron, NO UNPAID badge) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[8px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full leading-none shadow-md border-2 ${
                        isCompleted
                          ? 'bg-[#024B30] text-white border-[#D4AF37]'
                          : 'bg-amber-800 text-white border-[#D4AF37]'
                      }`}>
                        {isCompleted ? 'COMPLETE' : 'INCOMPLETE'}
                      </span>
                      <ChevronRight size={18} className="text-[#8C6239] dark:text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div    className="h-full flex flex-col items-center justify-center text-text-muted">
              <SearchIcon size={64} className="mb-4 text-text-muted" />
              <p className="text-lg font-medium text-text-main">No trips found</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Search;
