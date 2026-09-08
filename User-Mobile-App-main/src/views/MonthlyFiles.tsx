import React, { useState } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS, THEMES } from '../constants';
import { MonthlyFile } from '@/types';
import { FileText, Calendar, ChevronRight, Trash2, FolderOpen, ChevronLeft, Check, Truck, Wallet } from 'lucide-react';

import { getContrastColor } from '../utils/colorUtils';
import { useMemo } from 'react';

const MonthlyFiles: React.FC = () => {
  const { 
    language, 
    monthlyFiles, 
    addMonthlyFile, 
    setCurrentFile, 
    setView, 
    trips,
    theme,
    removeMonthlyFile,
    showFeedback,
    currencies,
    selectedCurrency,
    user,
    payments,
    isNightMode,
    appThemeMode,
    backgroundColor,
    wallpaper,
    selectedUser
  } = useStore();

  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];

  const effectiveBg = useMemo(() => {
    if (isNightMode) return '#000000';
    if (backgroundColor) return backgroundColor;
    if (wallpaper) return '#000000';
    return appThemeMode === 'light' ? '#f8fafc' : '#000000';
  }, [isNightMode, backgroundColor, wallpaper, appThemeMode]);

  const dynamicTextColor = useMemo(() => getContrastColor(effectiveBg), [effectiveBg]);
  const dynamicMutedColor = useMemo(() => dynamicTextColor === '#000000' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)', [dynamicTextColor]);

  const t = TRANSLATIONS[language];
  const [isCreating, setIsCreating] = useState(false);

  const handleDeleteFile = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation();
    alert('Deleting file ' + fileId);
    removeMonthlyFile(fileId);
    showFeedback('File deleted successfully');
  };

  const currency = currencies.find(c => c.code === selectedCurrency) || { symbol: '$', code: 'USD', name: 'US Dollar' };

  // Group trips by fileId to calculate stats
  const getFileStats = (fileId: string, month: number, year: number) => {
    const fileTrips = trips.filter(t => t.fileId === fileId);
    const totalTrips = fileTrips.length;
    const completedTrips = fileTrips.filter(t => t.status === 'COMPLETED').length;
    
    const tripDues = fileTrips.reduce((acc, trip) => {
      const categories = [
        { due: (trip.dieselPrice || 0) - (trip.dieselPaid || 0) },
        { due: (trip.extraDiesel || 0) - (trip.extraDieselPaid || 0) },
        { due: (trip.commission || 0) - (trip.commissionPaid || 0) },
        { due: (trip.friday || 0) - (trip.fridayPaid || 0) },
        { due: (trip.bonus || 0) - (trip.bonusPaid || 0) },
        { due: (trip.overtime || 0) - (trip.overtimePaid || 0) },
      ];
      const tripDue = categories.reduce((sum, cat) => sum + Math.max(0, cat.due), 0);
      return acc + tripDue;
    }, 0);
    
    // Pending income payments for this month
    const pendingIncome = payments
      .filter(p => p.month === month && p.year === year && p.type === 'INCOME' && p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);
      
    return { totalTrips, completedTrips, totalPending: tripDues, pendingIncome };
  };

  const handleCreateFile = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Check if file already exists
    const exists = monthlyFiles.find(f => f.month === currentMonth && f.year === currentYear);
    
    if (exists) {
      alert('File for this month already exists!');
      return;
    }

    const newFile: MonthlyFile = {
      id: `MF-${Date.now()}`,
      month: currentMonth,
      year: currentYear,
      status: 'OPEN',
      createdAt: today.toISOString(),
      userId: (user?.role === 'ADMIN' && selectedUser) ? selectedUser.id : (user?.id || '')
    };

    addMonthlyFile(newFile);
    setIsCreating(false);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleFileClick = (file: MonthlyFile) => {
    setCurrentFile(file);
    setView('MONTHLY_FILE_DETAILS');
  };

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
      
      
      
      className="pb-[60px] space-y-6 animate-fade-in"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {monthlyFiles.length === 0 ? (
          <div  className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-[8px]">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 text-text-muted">
              <FolderOpen size={32} />
            </div>
            <h3 className="text-lg font-bold text-text-main mb-2">No Files Found</h3>
            <p className="text-sm text-text-muted mb-6 max-w-xs mx-auto">
              Create a new monthly file to start recording your trips and expenses.
            </p>
            <button
              onClick={handleCreateFile}
              className="px-6 py-2 text-white text-sm font-bold uppercase tracking-wider rounded-[8px] shadow-lg transition-colors"
              style={{ background: 'var(--primary)' }}
            >
              Create Now
            </button>
          </div>
        ) : (
          monthlyFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((file) => {
            const stats = getFileStats(file.id, file.month, file.year);
            const isCurrentMonth = new Date().getMonth() + 1 === file.month && new Date().getFullYear() === file.year;
            const filePayments = payments.filter(p => p.month === file.month && p.year === file.year);
            const lastPayment = filePayments.length > 0 ? filePayments[0] : null;

            return (
              <div
                key={file.id}
                
                
                onClick={() => handleFileClick(file)}
                className="relative overflow-hidden rounded-xl p-3 text-white shadow-2xl bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] border border-white/5 cursor-pointer group hover:shadow-purple-500/20 hover:-translate-y-1 min-h-[110px] flex flex-col justify-between"
              >
                {/* Visual accents */}
                <div className="absolute -top-10 -right-10 w-28 h-28 bg-fuchsia-400/10 rounded-full blur-[50px]"></div>
                <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-indigo-400/10 rounded-full blur-[60px]"></div>
                
                <div className="relative z-10 space-y-2 h-full flex flex-col justify-between">
                  {/* Top Row: Month/Year & Actions mapped in single row */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform ">
                        <Calendar size={14} className="text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black tracking-tight leading-tight uppercase">{monthNames[file.month - 1]}</h3>
                        <p className="text-[8px] font-bold text-white/70 tracking-widest">{file.year}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isCurrentMonth && (
                        <span className="px-1 py-0.5 text-[6px] font-black rounded bg-blue-500 text-white uppercase tracking-widest border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]">CURRENT</span>
                      )}
                      <span className={`px-1 py-0.5 text-[6px] font-black rounded uppercase tracking-widest border ${
                        file.status === 'OPEN' 
                          ? 'bg-emerald-500 text-white border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                          : 'bg-zinc-500 text-white border-zinc-500/30'
                      }`}>
                        {file.status}
                      </span>
                      <button 
                        onClick={(e) => handleDeleteFile(e, file.id)}
                        className="p-1 rounded bg-white/10 text-white/50 hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                      >
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-1.5 bg-white/10 rounded-lg border border-white/10 hover:bg-white/20 transition-all">
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className="w-1 h-1 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]"></div>
                          <span className="text-[7px] font-black uppercase tracking-widest text-blue-300">Trips</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black">{stats.totalTrips}</span>
                          <span className="text-[7px] font-black text-white/40 uppercase">Units</span>
                        </div>
                      </div>

                      <div className="p-1.5 bg-white/10 rounded-lg border border-white/10 hover:bg-white/20 transition-all">
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"></div>
                          <span className="text-[7px] font-black uppercase tracking-widest text-emerald-300">Payment</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black">{lastPayment ? lastPayment.amount.toLocaleString() : '0'}</span>
                          <span className="text-[7px] font-black text-white/40 uppercase">{currency.code}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Stats */}
                    <div className="pt-1.5 border-t border-white/10 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[7px] font-black uppercase tracking-widest text-white/50 whitespace-nowrap">Pending Balance</span>
                        <span className="text-lg font-black text-rose-400 tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                          {currency.code} {stats.totalPending.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm group-hover:bg-rose-500/40 group-hover:border-rose-400 transition-all shadow-inner">
                        <Wallet size={12} className="text-white/70 group-hover:text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress highlight line */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5 overflow-hidden">
                  <div 
                    
                    
                    className="h-full bg-gradient-to-r from-fuchsia-400 to-indigo-500 shadow-[0_0_10px_rgba(192,38,211,0.3)]"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MonthlyFiles;
