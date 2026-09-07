import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useStore } from '@/store';

export interface GlobalDateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  type?: 'date' | 'time';
  value?: string;
  title?: string;
  language?: string;
}

const GlobalDateTimePicker: React.FC<GlobalDateTimePickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  type = 'date',
  value,
  title,
  language: propLanguage,
}) => {
  const { language: storeLanguage } = useStore();
  const lang = propLanguage || storeLanguage || 'en';
  const isBn = lang === 'bn';

  // ===================== DATE PICKER STATE =====================
  const initialDate = useMemo(() => {
    if (value && type === 'date') {
      if (value.includes(' to ')) {
        const parts = value.split(' to ');
        const d1 = new Date(parts[0]);
        if (!isNaN(d1.getTime())) return d1;
      }
      const parts = value.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[2], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
        } else if (parts[2].length === 4) {
          const y = parseInt(parts[2], 10);
          const m = parseInt(parts[1], 10) - 1;
          const d = parseInt(parts[0], 10);
          if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
        }
      }
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }, [value, type]);

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [viewDate, setViewDate] = useState<Date>(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);

  // Range mode (if needed)
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const isRangeMode = useMemo(() => Boolean(value && value.includes(' to ')), [value]);

  // ===================== TIME PICKER STATE =====================
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');

  // Prevent background scrolling while picker is open
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      const origTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.touchAction = origTouchAction;
      };
    }
  }, [isOpen]);

  // Reset/sync on open
  useEffect(() => {
    if (isOpen) {
      if (type === 'date') {
        let validD = new Date();
        if (value) {
          if (value.includes(' to ')) {
            const parts = value.split(' to ');
            const d1 = new Date(parts[0]);
            const d2 = new Date(parts[1]);
            if (!isNaN(d1.getTime())) {
              setRangeStart(d1);
              validD = d1;
            }
            if (!isNaN(d2.getTime())) {
              setRangeEnd(d2);
            }
          } else {
            const parts = value.split('-');
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                const y = parseInt(parts[0], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[2], 10);
                if (!isNaN(y) && !isNaN(m) && !isNaN(d)) validD = new Date(y, m, d);
              } else if (parts[2].length === 4) {
                const y = parseInt(parts[2], 10);
                const m = parseInt(parts[1], 10) - 1;
                const d = parseInt(parts[0], 10);
                if (!isNaN(y) && !isNaN(m) && !isNaN(d)) validD = new Date(y, m, d);
              }
            } else {
              const parsed = new Date(value);
              if (!isNaN(parsed.getTime())) validD = parsed;
            }
            setRangeStart(null);
            setRangeEnd(null);
          }
        }
        setSelectedDate(validD);
        setViewDate(new Date(validD.getFullYear(), validD.getMonth(), 1));
        setIsYearPickerOpen(false);
      } else if (type === 'time') {
        const now = new Date();
        let h = now.getHours();
        let m = now.getMinutes();
        let p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';

        if (value) {
          const lowerVal = value.toLowerCase().trim();
          if (lowerVal.includes('am') || lowerVal.includes('pm')) {
            const [timeStr, periodStr] = lowerVal.split(' ');
            const [hh, mm] = timeStr.split(':').map(Number);
            if (!isNaN(hh) && !isNaN(mm)) {
              h = hh;
              m = mm;
              p = periodStr.toUpperCase() === 'PM' ? 'PM' : 'AM';
            }
          } else if (value.includes(':')) {
            const [hh, mm] = value.split(':').map(Number);
            if (!isNaN(hh) && !isNaN(mm)) {
              h = hh;
              m = mm;
              p = h >= 12 ? 'PM' : 'AM';
            }
          }
        }
        const dispH = h % 12 || 12;
        setSelectedHour(dispH.toString().padStart(2, '0'));
        setSelectedMinute(m.toString().padStart(2, '0'));
        setSelectedPeriod(p);
      }
    }
  }, [isOpen, type, value]);

  // ===================== LOCALIZED NAMES =====================
  const monthsEnglish = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsBengali = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const monthNames = isBn ? monthsBengali : monthsEnglish;

  const weekdaysShort = isBn 
    ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']
    : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const yearsList = useMemo(() => {
    const currentY = new Date().getFullYear();
    const list = [];
    for (let y = currentY - 20; y <= currentY + 12; y++) {
      list.push(y);
    }
    return list;
  }, []);

  const formatDateKey = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ===================== CONFIRM / CANCEL =====================
  const handleConfirmDate = () => {
    if (isRangeMode && rangeStart && rangeEnd) {
      onSelect(`${formatDateKey(rangeStart)} to ${formatDateKey(rangeEnd)}`);
    } else {
      onSelect(formatDateKey(selectedDate));
    }
    onClose();
  };

  const handleConfirmTime = () => {
    onSelect(`${selectedHour}:${selectedMinute} ${selectedPeriod}`);
    onClose();
  };

  const handleConfirm = () => {
    if (type === 'date') {
      handleConfirmDate();
    } else {
      handleConfirmTime();
    }
  };

  // ===================== QUICK SHORTCUTS =====================
  const selectQuickDate = (preset: 'today' | 'yesterday' | 'tomorrow' | 'firstOfMonth') => {
    const now = new Date();
    let target = new Date();
    if (preset === 'today') {
      target = now;
    } else if (preset === 'yesterday') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    } else if (preset === 'tomorrow') {
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (preset === 'firstOfMonth') {
      target = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    }
    setSelectedDate(target);
    setViewDate(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  const selectQuickTime = (preset: 'now' | 'morning' | 'noon' | 'evening' | 'night') => {
    if (preset === 'now') {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const p: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
      const dispH = h % 12 || 12;
      setSelectedHour(dispH.toString().padStart(2, '0'));
      setSelectedMinute(m.toString().padStart(2, '0'));
      setSelectedPeriod(p);
    } else if (preset === 'morning') {
      setSelectedHour('09');
      setSelectedMinute('00');
      setSelectedPeriod('AM');
    } else if (preset === 'noon') {
      setSelectedHour('01');
      setSelectedMinute('00');
      setSelectedPeriod('PM');
    } else if (preset === 'evening') {
      setSelectedHour('06');
      setSelectedMinute('00');
      setSelectedPeriod('PM');
    } else if (preset === 'night') {
      setSelectedHour('09');
      setSelectedMinute('00');
      setSelectedPeriod('PM');
    }
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // ===================== CALENDAR GRID CALCULATION =====================
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = [];

    // Pad previous month days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        isSelected: formatDateKey(d) === formatDateKey(selectedDate)
      });
    }

    // Current month days
    const todayStr = formatDateKey(new Date());
    const selectedStr = formatDateKey(selectedDate);

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const dStr = formatDateKey(d);
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedStr
      });
    }

    // Pad next month days to 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        isSelected: formatDateKey(d) === formatDateKey(selectedDate)
      });
    }

    return days;
  }, [viewDate, selectedDate]);

  // Formatted display strings
  const selectedDateFormatted = useMemo(() => {
    try {
      return selectedDate.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return formatDateKey(selectedDate);
    }
  }, [selectedDate, isBn]);

  const selectedTimeFormatted = useMemo(() => {
    return `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
  }, [selectedHour, selectedMinute, selectedPeriod]);

  // ===================== ANALOG CLOCK CALCULATIONS =====================
  const renderClock = () => {
    const h = parseInt(selectedHour, 10) || 12;
    const m = parseInt(selectedMinute, 10) || 0;
    const hourDeg = (h % 12) * 30 + m * 0.5;
    const minuteDeg = m * 6;

    return (
      <div className="relative w-[190px] h-[190px] mx-auto my-3 flex items-center justify-center select-none">
        {/* Outer Steel Bezel */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 p-[5px] shadow-xl border border-slate-700/50">
          <div className="w-full h-full rounded-full bg-gradient-to-bl from-slate-800 via-slate-900 to-slate-950 p-[3px] shadow-inner flex items-center justify-center">
            {/* Clock Face */}
            <div className="w-full h-full rounded-full bg-gradient-to-b from-white to-slate-100 dark:from-[#2C2C2E] dark:to-[#1C1C1E] relative overflow-hidden shadow-inner flex items-center justify-center">
              {/* Radial subtle reflection */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.7)_0%,transparent_60%)] pointer-events-none" />

              {/* 12, 3, 6, 9 Numerals */}
              <span className="absolute top-2 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 select-none tracking-tight">12</span>
              <span className="absolute right-2.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 select-none tracking-tight">3</span>
              <span className="absolute bottom-2 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 select-none tracking-tight">6</span>
              <span className="absolute left-2.5 text-[11px] font-extrabold text-slate-800 dark:text-slate-200 select-none tracking-tight">9</span>

              {/* Clock Tick Marks */}
              {Array.from({ length: 12 }).map((_, i) => {
                if (i % 3 === 0) return null;
                return (
                  <div
                    key={i}
                    className="absolute left-[calc(50%-1px)] top-[5px] w-[2px] h-[7px] bg-slate-400 dark:bg-slate-500 origin-[1px_84px]"
                    style={{ transform: `rotate(${i * 30}deg)` }}
                  />
                );
              })}

              {/* Hands Container */}
              <div className="absolute inset-0 pointer-events-none filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]">
                {/* Hour Hand */}
                <div 
                  className="absolute w-[4px] h-[46px] bg-slate-900 dark:bg-white rounded-full origin-bottom transition-transform duration-200 ease-out"
                  style={{ 
                    left: 'calc(50% - 2px)', 
                    top: 'calc(50% - 46px)',
                    transform: `rotate(${hourDeg}deg)` 
                  }}
                >
                  <div className="absolute top-0.5 left-[1px] w-0.5 h-2.5 bg-[#007AFF] rounded-full opacity-80" />
                </div>
                
                {/* Minute Hand */}
                <div 
                  className="absolute w-[2.5px] h-[64px] bg-slate-700 dark:bg-slate-300 rounded-full origin-bottom transition-transform duration-200 ease-out"
                  style={{ 
                    left: 'calc(50% - 1.25px)', 
                    top: 'calc(50% - 64px)',
                    transform: `rotate(${minuteDeg}deg)` 
                  }}
                >
                  <div className="absolute top-0.5 left-[0.5px] w-[1.5px] h-3.5 bg-[#007AFF] rounded-full opacity-80" />
                </div>
              </div>
              
              {/* Center Pivot */}
              <div className="absolute w-[12px] h-[12px] rounded-full bg-slate-900 border-2 border-amber-400 flex items-center justify-center shadow-md z-20">
                <div className="w-[3px] h-[3px] rounded-full bg-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex flex-col justify-end"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {/* iOS Backdrop */}
          <motion.div
            key="global-picker-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-[3px] cursor-pointer touch-none"
          />

          {/* Edge-to-Edge iOS Bottom Sheet Modal */}
          <motion.div
            key="global-picker-sheet"
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="relative w-full left-0 right-0 bottom-0 bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-[28px] sm:rounded-t-[32px] rounded-b-none shadow-2xl border-t border-black/10 dark:border-white/10 flex flex-col max-h-[92vh] overflow-hidden select-none z-10 transform-gpu will-change-transform"
          >
            {/* iOS Grabber Pill */}
            <div className="pt-2.5 pb-1 pointer-events-none">
              <div className="w-9 h-1 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto" />
            </div>

            {/* iOS Top Navigation Bar */}
            <div className="px-4 py-2 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }} 
                className="text-[#007AFF] dark:text-[#0A84FF] text-[17px] font-normal hover:opacity-75 active:opacity-50 transition-opacity py-1 px-2 -ml-2 cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <div className="text-center truncate px-2">
                <span className="text-[17px] font-semibold text-slate-900 dark:text-white tracking-tight">
                  {title || (type === 'date' ? (isBn ? 'তারিখ নির্বাচন' : 'Select Date') : (isBn ? 'সময় নির্বাচন' : 'Select Time'))}
                </span>
              </div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleConfirm();
                }} 
                className="text-[#007AFF] dark:text-[#0A84FF] text-[17px] font-semibold hover:opacity-75 active:opacity-50 transition-opacity py-1 px-2 -mr-2 flex items-center gap-1 cursor-pointer"
              >
                {isBn ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>

            {/* ======================= DATE PICKER VIEW ======================= */}
            {type === 'date' && (
              <>
                {/* iOS Quick Date Shortcuts */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => selectQuickDate('today')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'আজ' : 'Today'}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickDate('yesterday')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'গতকাল' : 'Yesterday'}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickDate('tomorrow')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'আগামীকাল' : 'Tomorrow'}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickDate('firstOfMonth')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'মাসের ১ম দিন' : '1st of Month'}
                  </button>
                </div>

                {/* iOS Calendar Card Container */}
                <div className="px-4 py-2">
                  <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-4 shadow-sm border border-black/[0.04] dark:border-white/[0.06]">
                    {/* Month / Year Bar with Switcher */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setIsYearPickerOpen(!isYearPickerOpen)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#3A3A3C] hover:opacity-85 active:scale-95 transition-all"
                      >
                        <span className="text-[15px] font-bold text-slate-900 dark:text-white">
                          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                        <ChevronRight size={14} className={`text-slate-400 dark:text-slate-500 transition-transform ${isYearPickerOpen ? 'rotate-90' : ''}`} />
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={prevMonth}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] hover:bg-slate-100 dark:hover:bg-[#3A3A3C] active:scale-90 transition-all"
                          aria-label="Previous Month"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={nextMonth}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[#007AFF] dark:text-[#0A84FF] hover:bg-slate-100 dark:hover:bg-[#3A3A3C] active:scale-90 transition-all"
                          aria-label="Next Month"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Year / Month Quick Selector View */}
                    {isYearPickerOpen ? (
                      <div className="py-2 space-y-3">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                            {isBn ? 'মাস নির্বাচন' : 'Select Month'}
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {monthNames.map((mName, idx) => (
                              <button
                                key={mName}
                                type="button"
                                onClick={() => {
                                  setViewDate(new Date(viewDate.getFullYear(), idx, 1));
                                  setIsYearPickerOpen(false);
                                }}
                                className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all ${viewDate.getMonth() === idx ? 'bg-[#007AFF] text-white shadow-xs' : 'bg-slate-50 dark:bg-[#3A3A3C] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                              >
                                {mName}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1.5">
                            {isBn ? 'বছর নির্বাচন' : 'Select Year'}
                          </span>
                          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            {yearsList.map((yr) => (
                              <button
                                key={yr}
                                type="button"
                                onClick={() => {
                                  setViewDate(new Date(yr, viewDate.getMonth(), 1));
                                  setIsYearPickerOpen(false);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-xl shrink-0 transition-all ${viewDate.getFullYear() === yr ? 'bg-[#007AFF] text-white shadow-xs' : 'bg-slate-50 dark:bg-[#3A3A3C] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                              >
                                {yr}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Calendar Days Grid */
                      <div>
                        {/* Weekday labels */}
                        <div className="grid grid-cols-7 gap-1 mb-1.5">
                          {weekdaysShort.map((w, idx) => (
                            <div key={idx} className="text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 py-0.5">
                              {w}
                            </div>
                          ))}
                        </div>

                        {/* Day Cells */}
                        <div className="grid grid-cols-7 gap-1">
                          {calendarDays.map((cell, idx) => {
                            const isSelected = cell.isSelected;
                            const isCurrentMonth = cell.isCurrentMonth;
                            const isToday = cell.isToday;

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedDate(cell.date);
                                  if (!isCurrentMonth) {
                                    setViewDate(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                                  }
                                }}
                                className="aspect-square flex items-center justify-center p-0.5 relative group"
                              >
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[15px] transition-all ${
                                    isSelected
                                      ? 'bg-[#007AFF] text-white font-bold shadow-md shadow-[#007AFF]/30 scale-105'
                                      : isToday
                                      ? 'font-bold text-[#007AFF] dark:text-[#0A84FF] bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100'
                                      : isCurrentMonth
                                      ? 'text-slate-900 dark:text-slate-100 font-medium hover:bg-slate-100 dark:hover:bg-[#3A3A3C]'
                                      : 'text-slate-300 dark:text-slate-600 font-normal hover:bg-slate-100/50 dark:hover:bg-[#3A3A3C]/40'
                                  }`}
                                >
                                  {cell.date.getDate()}
                                </div>
                                {isToday && !isSelected && (
                                  <div className="absolute bottom-1 w-1 h-1 bg-[#007AFF] dark:bg-[#0A84FF] rounded-full" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Date Indicator Banner & Safe Area Padding */}
                <div className="px-4 pb-[calc(18px+env(safe-area-inset-bottom,18px))] pt-1">
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/80 dark:bg-[#2C2C2E]/80 border border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={15} className="text-[#007AFF] dark:text-[#0A84FF]" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {isBn ? 'নির্বাচিত তারিখ:' : 'Selected:'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedDateFormatted}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* ======================= TIME PICKER VIEW ======================= */}
            {type === 'time' && (
              <>
                {/* iOS Quick Time Shortcuts */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <button
                    type="button"
                    onClick={() => selectQuickTime('now')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'এখন' : 'Now'}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickTime('morning')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'সকাল ০৯:০০' : '09:00 AM'}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickTime('noon')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'দুপুর ০১:০০' : '01:00 PM'}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickTime('evening')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'সন্ধ্যা ০৬:০০' : '06:00 PM'}
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuickTime('night')}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs border border-black/5 dark:border-white/5 active:scale-95 transition-all shrink-0 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isBn ? 'রাত ০৯:০০' : '09:00 PM'}
                  </button>
                </div>

                {/* Clock Face Display */}
                {renderClock()}

                {/* Time Selection Controls Card */}
                <div className="px-4 py-1">
                  <div className="bg-white dark:bg-[#2C2C2E] rounded-2xl p-4 shadow-sm border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center gap-3">
                    {/* Hour Select */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        {isBn ? 'ঘণ্টা' : 'Hour'}
                      </span>
                      <select
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(e.target.value)}
                        className="bg-slate-100 dark:bg-[#3A3A3C] text-slate-900 dark:text-white font-bold text-lg py-2 px-3 rounded-xl border border-black/5 dark:border-white/5 outline-none cursor-pointer focus:ring-2 focus:ring-[#007AFF] text-center"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const val = (i + 1).toString().padStart(2, '0');
                          return <option key={`h-${val}`} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>

                    <span className="text-2xl font-black text-slate-400 dark:text-slate-500 mt-4">:</span>

                    {/* Minute Select */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        {isBn ? 'মিনিট' : 'Minute'}
                      </span>
                      <select
                        value={selectedMinute}
                        onChange={(e) => setSelectedMinute(e.target.value)}
                        className="bg-slate-100 dark:bg-[#3A3A3C] text-slate-900 dark:text-white font-bold text-lg py-2 px-3 rounded-xl border border-black/5 dark:border-white/5 outline-none cursor-pointer focus:ring-2 focus:ring-[#007AFF] text-center"
                      >
                        {Array.from({ length: 60 }, (_, i) => {
                          const val = i.toString().padStart(2, '0');
                          return <option key={`m-${val}`} value={val}>{val}</option>;
                        })}
                      </select>
                    </div>

                    {/* AM / PM Segmented Toggle */}
                    <div className="flex flex-col items-center ml-2">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        {isBn ? 'শিফট' : 'Period'}
                      </span>
                      <div className="flex bg-slate-100 dark:bg-[#3A3A3C] p-1 rounded-xl border border-black/5 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('AM')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedPeriod === 'AM'
                              ? 'bg-[#007AFF] text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                          }`}
                        >
                          AM
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPeriod('PM')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            selectedPeriod === 'PM'
                              ? 'bg-[#007AFF] text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                          }`}
                        >
                          PM
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Time Indicator Banner & Safe Area Padding */}
                <div className="px-4 pb-[calc(18px+env(safe-area-inset-bottom,18px))] pt-1">
                  <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/80 dark:bg-[#2C2C2E]/80 border border-black/[0.04] dark:border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-[#007AFF] dark:text-[#0A84FF]" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {isBn ? 'নির্বাচিত সময়:' : 'Selected:'}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {selectedTimeFormatted}
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default GlobalDateTimePicker;
