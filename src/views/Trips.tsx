import React, { useState } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';

import { Truck, Calendar, MapPin, Search, Filter, ChevronRight, MoreVertical, Check } from 'lucide-react';
import InputField from '../components/InputField';

const Trips: React.FC = () => {
  const { language, trips, setView, setSelectedTrip, setEditingTrip } = useStore();
  const t = TRANSLATIONS[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');

  const filteredTrips = trips.filter(trip => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (trip.bayanNumber || '').toLowerCase().includes(term) ||
      (trip.containerNumber || '').toLowerCase().includes(term) ||
      (trip.driverName || '').toLowerCase().includes(term);
    
    const matchesStatus = filterStatus === 'ALL' || trip.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div 
      
      
      
      className="pb-[80px]"
    >
      <div className="flex items-center justify-end mb-6">
        <button
          
          
          onClick={() => setView('NEW_TRIP')}
          className="bg-[var(--primary)] text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-[var(--primary)]/20"
        >
          New Trip
        </button>
      </div>

      <div  className="space-y-4 mb-6">
        <InputField
          label="Search Bayan, Container or Driver..."
          name="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          icon={<Search size={20} />}
        />

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['ALL', 'PENDING', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative overflow-hidden ${
                filterStatus === status 
                  ? 'text-white shadow-md' 
                  : 'bg-theme-card text-text-muted border border-gray-200 dark:border-white/10'
              }`}
            >
              {filterStatus === status && (
                <div
                  
                  className="absolute inset-0 bg-[var(--primary)]"
                  
                />
              )}
              <span className="relative z-10">{status}</span>
            </button>
          ))}
        </div>
      </div>

      <div  className="space-y-3">
        <>
          {filteredTrips.length > 0 ? (
            filteredTrips.map((trip) => {
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
            })
          ) : (
            <div 
              
              className="py-20 flex flex-col items-center justify-center text-text-muted opacity-40"
            >
              <Truck size={48} className="mb-4" />
              <p className="font-bold uppercase tracking-widest text-sm">No Trips Found</p>
            </div>
          )}
        </>
      </div>
    </div>
  );
};

export default Trips;
