import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Car, 
  Calendar, 
  User, 
  ChevronRight, 
  X, 
  Edit, 
  History, 
  AlertCircle, 
  SlidersHorizontal,
  Trash2,
  Info,
  Download,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useStore } from '@/store';
import { Vehicle, VehicleHistoryRecord } from '@/types';
import SearchBar from '@/components/SearchBar';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import FormWindow from '@/components/FormWindow';
import { exportVehicleToPDF, exportVehicleToPNG } from '@/utils/exportUtils';

const formatDateDMY = (dateStr?: string) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  return dateStr;
};

const isExpired = (dateStr?: string) => {
  if (!dateStr) return false;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = dateStr.split('-');
    let parsedDate: Date;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        parsedDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      } else {
        parsedDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      parsedDate.setHours(0, 0, 0, 0);
      return parsedDate < today;
    }
  } catch (e) {}
  return false;
};

const downloadVehicleDetails = (v: Vehicle) => {
  const content = `VEHICLE INFORMATION REPORT
==================================
Vehicle Details & Specifications
==================================
Vehicle Number        : ${v.vehicleNumber}
Trailer Number        : ${v.trailerNumber || '—'}
Vehicle Permit Expiry : ${formatDateDMY(v.vehiclePermitExpiry)}
Trailer Permit Expiry : ${formatDateDMY(v.trailerPermitExpiry)}
Assigned Date         : ${formatDateDMY(v.vehicleAssignedDate)}
Current Status        : ${v.status}
==================================
Report Generated on: ${new Date().toLocaleString()}
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${v.vehicleNumber}_Vehicle_Details.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const VehicleList: React.FC = () => {
  const { 
    vehicles, 
    addVehicle, 
    updateVehicle, 
    removeVehicle,
    user, 
    language,
    confirmAction,
    showFeedback
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'In Service' | 'Inactive'>('All');
  
  // Modal toggle states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Form states
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [vehiclePermitExpiry, setVehiclePermitExpiry] = useState('');
  const [trailerPermitExpiry, setTrailerPermitExpiry] = useState('');
  const [driverName, setDriverName] = useState('');
  const [vehicleAssignedDate, setVehicleAssignedDate] = useState('');
  const [status, setStatus] = useState<'Active' | 'In Service' | 'Inactive'>('Active');

  // Select dropdown state
  const [showStatusSelect, setShowStatusSelect] = useState(false);

  // Filter vehicles based on search query & status tab
  const filteredVehicles = useMemo(() => {
    return (vehicles || []).filter(v => {
      const numQuery = searchQuery.toLowerCase().trim();
      const matchesSearch = !numQuery || 
        (v.vehicleNumber || '').toLowerCase().includes(numQuery) ||
        (v.trailerNumber || '').toLowerCase().includes(numQuery);
      
      const matchesStatus = statusFilter === 'All' || v.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchQuery, statusFilter]);

  const resetForm = () => {
    setVehicleNumber('');
    setTrailerNumber('');
    setVehiclePermitExpiry('');
    setTrailerPermitExpiry('');
    setDriverName('');
    setVehicleAssignedDate('');
    setStatus('Active');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber.trim()) {
      showFeedback(language === 'bn' ? 'যানবাহন নম্বর প্রয়োজন' : 'Vehicle number is required', 'error');
      return;
    }

    const newVehicle: Vehicle = {
      id: `VEH-${Date.now()}`,
      userId: user?.id || '',
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      trailerNumber: trailerNumber.trim().toUpperCase() || undefined,
      vehiclePermitExpiry: vehiclePermitExpiry || undefined,
      trailerPermitExpiry: trailerPermitExpiry || undefined,
      driverName: driverName.trim() || undefined,
      vehicleAssignedDate: vehicleAssignedDate || undefined,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: []
    };

    addVehicle(newVehicle);
    setIsAddOpen(false);
    resetForm();
    showFeedback(
      language === 'bn' 
        ? 'নতুন যানবাহন সফলভাবে যুক্ত করা হয়েছে' 
        : 'Vehicle added successfully'
    );
  };

  const startEditing = (vehicle: Vehicle) => {
    setVehicleNumber(vehicle.vehicleNumber);
    setTrailerNumber(vehicle.trailerNumber || '');
    setVehiclePermitExpiry(vehicle.vehiclePermitExpiry || '');
    setTrailerPermitExpiry(vehicle.trailerPermitExpiry || '');
    setDriverName(vehicle.driverName || '');
    setVehicleAssignedDate(vehicle.vehicleAssignedDate || '');
    setStatus(vehicle.status);
    setIsEditMode(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle || !vehicleNumber.trim()) return;

    const updatedHistory: VehicleHistoryRecord[] = [...(selectedVehicle.history || [])];
    const updaterName = user?.name || user?.email || 'System User';
    const timestamp = new Date().toISOString();

    const compareAndLog = (fieldName: string, prevVal: any, newVal: any, label: string) => {
      const formattedPrev = prevVal || 'N/A';
      const formattedNew = newVal || 'N/A';
      if (formattedPrev !== formattedNew) {
        updatedHistory.push({
          id: `H-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          fieldName: label,
          previousValue: String(formattedPrev),
          newValue: String(formattedNew),
          updatedBy: updaterName,
          updatedAt: timestamp
        });
      }
    };

    compareAndLog('vehicleNumber', selectedVehicle.vehicleNumber, vehicleNumber.trim().toUpperCase(), 'Vehicle Number');
    compareAndLog('trailerNumber', selectedVehicle.trailerNumber, trailerNumber.trim().toUpperCase(), 'Trailer Number');
    compareAndLog('vehiclePermitExpiry', selectedVehicle.vehiclePermitExpiry, vehiclePermitExpiry, 'Vehicle Permit Expiry');
    compareAndLog('trailerPermitExpiry', selectedVehicle.trailerPermitExpiry, trailerPermitExpiry, 'Trailer Permit Expiry');
    compareAndLog('driverName', selectedVehicle.driverName, driverName.trim(), 'Driver Name');
    compareAndLog('vehicleAssignedDate', selectedVehicle.vehicleAssignedDate, vehicleAssignedDate, 'Vehicle Assigned Date');
    compareAndLog('status', selectedVehicle.status, status, 'Status');

    const updatedVehicle: Vehicle = {
      ...selectedVehicle,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      trailerNumber: trailerNumber.trim().toUpperCase() || undefined,
      vehiclePermitExpiry: vehiclePermitExpiry || undefined,
      trailerPermitExpiry: trailerPermitExpiry || undefined,
      driverName: driverName.trim() || undefined,
      vehicleAssignedDate: vehicleAssignedDate || undefined,
      status,
      updatedAt: timestamp,
      history: updatedHistory
    };

    updateVehicle(updatedVehicle);
    setSelectedVehicle(updatedVehicle);
    setIsEditMode(false);
    showFeedback(
      language === 'bn' 
        ? 'যানবাহনের তথ্য সফলভাবে আপডেট করা হয়েছে' 
        : 'Vehicle updated successfully'
    );
  };

  const handleDelete = (vehicleId: string) => {
    confirmAction({
      title: language === 'bn' ? 'যানবাহন ডিলিট করুন' : 'Delete Vehicle',
      message: language === 'bn' 
        ? 'আপনি কি নিশ্চিত যে এই যানবাহনটি সম্পূর্ণভাবে ডিলিট করতে চান?' 
        : 'Are you sure you want to permanently delete this vehicle?',
      confirmText: language === 'bn' ? 'ডিলিট করুন' : 'Delete',
      cancelText: language === 'bn' ? 'বাতিল' : 'Cancel',
      onConfirm: () => {
        removeVehicle(vehicleId);
        setSelectedVehicle(null);
        setIsEditMode(false);
        setIsHistoryOpen(false);
        showFeedback(
          language === 'bn' 
            ? 'যানবাহন ডিলিট করা হয়েছে' 
            : 'Vehicle deleted successfully'
        );
      }
    });
  };

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case 'Active':
        return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'In Service':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'Inactive':
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-500/10';
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 pb-10">
      
      {/* Search and Action Row */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1">
          <SearchBar 
            label={language === 'bn' ? 'সার্চ' : 'Search'}
            activePlaceholder={language === 'bn' ? 'Search by Vehicle number' : 'Search by Vehicle number'}
            value={searchQuery} 
            onChange={setSearchQuery} 
          />
        </div>
        
        <Button
          variant="primary"
          size="lg"
          onClick={handleOpenAdd}
          icon={<Plus size={20} />}
          className="shrink-0 h-14"
          title={language === 'bn' ? 'যানবাহন যুক্ত করুন' : 'Add Vehicle'}
        >
          {language === 'bn' ? 'যোগ করুন' : 'Add'}
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
        <span className="text-[11px] font-black tracking-wider text-text-muted uppercase mr-1 flex items-center gap-1">
          <SlidersHorizontal size={12} /> {language === 'bn' ? 'ফিল্টার:' : 'Filters:'}
        </span>
        {(['All', 'Active', 'In Service', 'Inactive'] as const).map(tab => (
          <Button
            key={tab}
            variant={statusFilter === tab ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab)}
            className="shrink-0"
          >
            {tab === 'All' ? (language === 'bn' ? 'সব' : 'All') : tab}
          </Button>
        ))}
      </div>

      {/* Vehicle Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredVehicles.map(v => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              key={v.id}
              onClick={() => setSelectedVehicle(v)}
              className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] p-4 rounded-[10px] cursor-pointer hover:brightness-105 hover:shadow-md active:scale-[0.99] transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-[8px] shrink-0">
                  <Car size={20} />
                </div>
                <div className="flex flex-col space-y-1 min-w-0 flex-1">
                  <h3 className="font-extrabold text-xs text-text-main group-hover:text-sky-500 transition-colors leading-tight truncate">
                    Vehicle Details
                  </h3>
                  <div className="text-xs font-bold text-text-main truncate">
                    Vehicle Number : {v.vehicleNumber} | Trailer Number : {v.trailerNumber || '—'}
                  </div>
                  <div className="text-xs font-bold text-text-main truncate">
                    Assigned Date : {formatDateDMY(v.vehicleAssignedDate)}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-muted group-hover:text-sky-500 transition-colors group-hover:translate-x-0.5 shrink-0" />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredVehicles.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-black/10 dark:border-white/10 rounded-[8px] bg-theme-card">
            <AlertCircle size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm font-bold text-text-muted uppercase">
              {language === 'bn' ? 'কোনো যানবাহন পাওয়া যায়নি' : 'No vehicles found'}
            </p>
          </div>
        )}
      </div>

      {/* ==================== ADD VEHICLE MODAL ==================== */}
      {isAddOpen && createPortal(
        <FormWindow 
          title={language === 'bn' ? 'নতুন যানবাহন যুক্ত করুন' : 'Add New Vehicle'} 
          onClose={() => setIsAddOpen(false)}
        >
          <form onSubmit={handleAddSubmit} className="space-y-5 max-w-4xl mx-auto">
            
            {/* Card 1: Vehicle & Trailer Identification */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Car size={16} className="text-sky-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? 'যানবাহন ও ট্রেইলার তথ্য' : 'Vehicle & Trailer Info'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label={language === 'bn' ? 'যানবাহন নম্বর *' : 'Vehicle Number *'}
                  name="vehicleNumber"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                  required
                  icon={<Car size={18} />}
                />
                <InputField 
                  label={language === 'bn' ? 'ট্রেইলার নম্বর' : 'Trailer Number'}
                  name="trailerNumber"
                  value={trailerNumber}
                  onChange={e => setTrailerNumber(e.target.value.toUpperCase())}
                  icon={<Car size={18} />}
                />
              </div>
            </div>

            {/* Card 2: Permit & Validity Dates */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Calendar size={16} className="text-sky-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? 'পারমিট ও মেয়াদ তথ্য' : 'Permit & Validity Dates'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label={language === 'bn' ? 'ভেহিকল পারমিট মেয়াদ উত্তীর্ণের তারিখ' : 'Vehicle Permit Expiry'}
                  name="vehiclePermitExpiry"
                  type="date"
                  value={vehiclePermitExpiry}
                  onChange={e => setVehiclePermitExpiry(e.target.value)}
                />
                <InputField 
                  label={language === 'bn' ? 'ট্রেইলার পারমিট মেয়াদ উত্তীর্ণের তারিখ' : 'Trailer Permit Expiry'}
                  name="trailerPermitExpiry"
                  type="date"
                  value={trailerPermitExpiry}
                  onChange={e => setTrailerPermitExpiry(e.target.value)}
                />
              </div>
            </div>

            {/* Card 3: Assignment Details */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Calendar size={16} className="text-sky-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? 'অ্যাসাইনমেন্ট বিবরণ' : 'Assignment Details'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label={language === 'bn' ? 'ভেহিকল এসাইনড ডেট' : 'Vehicle Assigned Date'}
                  name="vehicleAssignedDate"
                  type="date"
                  value={vehicleAssignedDate}
                  onChange={e => setVehicleAssignedDate(e.target.value)}
                />
                <div onClick={() => setShowStatusSelect(true)} className="cursor-pointer">
                  <InputField 
                    label={language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                    name="status"
                    value={status}
                    onChange={() => {}}
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Stacked vertically, Full Width */}
            <div className="pt-4 flex flex-col gap-3 w-full">
              <Button
                type="submit"
                variant="emerald"
                size="lg"
                className="w-full h-14 text-sm font-black uppercase tracking-wider justify-center"
              >
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Vehicle'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setIsAddOpen(false)}
                className="w-full h-14 text-sm font-bold uppercase tracking-wider justify-center"
              >
                {language === 'bn' ? 'বাতিল' : 'Cancel'}
              </Button>
            </div>
          </form>

          <GlobalFullscreenSelect
            isOpen={showStatusSelect}
            onClose={() => setShowStatusSelect(false)}
            title={language === 'bn' ? 'স্ট্যাটাস নির্বাচন করুন' : 'Select Status'}
            options={['Active', 'In Service', 'Inactive']}
            onSelect={(v) => setStatus(v as any)}
          />
        </FormWindow>,
        document.body
      )}

      {/* ==================== VEHICLE DETAILS / EDIT / HISTORY MODAL ==================== */}
      {selectedVehicle && createPortal(
        <FormWindow
          title={language === 'bn' ? 'যানবাহন তথ্য' : 'Vehicle Information'}
          onClose={() => {
            setSelectedVehicle(null);
            setIsEditMode(false);
            setIsHistoryOpen(false);
          }}
        >
          <div className="space-y-6">
            
            {/* Options Table (Details, Edit, History - Equal Full Width) */}
            <div className="grid grid-cols-3 w-full border border-black/5 dark:border-white/10 rounded-[8px] overflow-hidden bg-black/5 dark:bg-white/5 text-center text-xs font-bold shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(false);
                  setIsHistoryOpen(false);
                }}
                className={`py-3 transition-colors border-r border-black/5 dark:border-white/10 ${
                  !isEditMode && !isHistoryOpen 
                    ? 'bg-sky-500 text-white font-black' 
                    : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {language === 'bn' ? 'বিবরণ' : 'Details'}
              </button>
              <button
                type="button"
                onClick={() => {
                  startEditing(selectedVehicle);
                  setIsHistoryOpen(false);
                }}
                className={`py-3 transition-colors border-r border-black/5 dark:border-white/10 ${
                  isEditMode 
                    ? 'bg-sky-500 text-white font-black' 
                    : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {language === 'bn' ? 'সংশোধন' : 'Edit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(true);
                  setIsEditMode(false);
                }}
                className={`py-3 transition-colors ${
                  isHistoryOpen 
                    ? 'bg-sky-500 text-white font-black' 
                    : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {language === 'bn' ? 'ইতিহাস' : 'History'}
              </button>
            </div>

            {/* 1. View Details mode */}
            {!isEditMode && !isHistoryOpen && (
              <div className="space-y-5">
                
                {/* Details Table */}
                <div className="border border-black/5 dark:border-white/10 rounded-[8px] overflow-hidden bg-theme-card shadow-sm">
                  {/* Row 1 & 2: Vehicle Number & Trailer Number side-by-side with Permit Expiries */}
                  <div className="grid grid-cols-2 border-b border-black/5 dark:border-white/10 divide-x divide-black/5 dark:divide-white/10">
                    
                    {/* Left Column */}
                    <div className="p-4 flex flex-col space-y-3.5">
                      <div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">
                          {language === 'bn' ? 'যানবাহন নম্বর' : 'Vehicle Number'}
                        </span>
                        <p className="text-sm font-extrabold text-text-main mt-0.5 tracking-wide uppercase">
                          {selectedVehicle.vehicleNumber}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">
                          {language === 'bn' ? 'ভেহিকল পারমিট মেয়াদ' : 'VEHICLE PERMIT EXPIRY'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar size={13} className={isExpired(selectedVehicle.vehiclePermitExpiry) ? 'text-red-500 animate-pulse' : 'text-sky-500'} />
                          <span className={`text-xs font-bold ${isExpired(selectedVehicle.vehiclePermitExpiry) ? 'text-red-500 font-black animate-pulse' : 'text-text-main'}`}>
                            {formatDateDMY(selectedVehicle.vehiclePermitExpiry)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="p-4 flex flex-col space-y-3.5">
                      <div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">
                          {language === 'bn' ? 'ট্রেইলার নম্বর' : 'Trailer Number'}
                        </span>
                        <p className="text-sm font-extrabold text-text-main mt-0.5 tracking-wide uppercase">
                          {selectedVehicle.trailerNumber || '—'}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wide">
                          {language === 'bn' ? 'ট্রেইলার পারমিট মেয়াদ' : 'TRAILER PERMIT EXPIRY'}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar size={13} className={isExpired(selectedVehicle.trailerPermitExpiry) ? 'text-red-500 animate-pulse' : 'text-sky-500'} />
                          <span className={`text-xs font-bold ${isExpired(selectedVehicle.trailerPermitExpiry) ? 'text-red-500 font-black animate-pulse' : 'text-text-main'}`}>
                            {formatDateDMY(selectedVehicle.trailerPermitExpiry)}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Row 3: Assigned Date (full width since Driver Name is removed) */}
                  <div className="border-b border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] flex justify-between items-center p-3.5">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {language === 'bn' ? 'বরাদ্দকরণ তারিখ' : 'Assigned Date'}
                    </span>
                    <span className="text-xs font-extrabold text-text-main">
                      {formatDateDMY(selectedVehicle.vehicleAssignedDate)}
                    </span>
                  </div>

                  {/* Status Row */}
                  <div className="flex justify-between items-center p-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {language === 'bn' ? 'বর্তমান স্ট্যাটাস' : 'Current Status'}
                    </span>
                    <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-[4px] uppercase ${getStatusBadgeClass(selectedVehicle.status)}`}>
                      {selectedVehicle.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Edit details mode */}
            {isEditMode && (
              <form onSubmit={handleUpdateSubmit} className="space-y-5">
                
                {/* Card 1: Vehicle & Trailer Info */}
                <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                    <Car size={16} className="text-sky-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-text-main">
                      {language === 'bn' ? 'যানবাহন ও ট্রেইলার তথ্য' : 'Vehicle & Trailer Info'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label={language === 'bn' ? 'যানবাহন নম্বর *' : 'Vehicle Number *'}
                      name="vehicleNumber"
                      value={vehicleNumber}
                      onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                      required
                      icon={<Car size={18} />}
                    />
                    <InputField 
                      label={language === 'bn' ? 'ট্রেইলার নম্বর' : 'Trailer Number'}
                      name="trailerNumber"
                      value={trailerNumber}
                      onChange={e => setTrailerNumber(e.target.value.toUpperCase())}
                      icon={<Car size={18} />}
                    />
                  </div>
                </div>

                {/* Card 2: Permit & Validity Dates */}
                <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                    <Calendar size={16} className="text-sky-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-text-main">
                      {language === 'bn' ? 'পারমিট ও মেয়াদ তথ্য' : 'Permit & Validity Dates'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label={language === 'bn' ? 'ভেহিকল পারমিট মেয়াদ' : 'Vehicle Permit Expiry'}
                      name="vehiclePermitExpiry"
                      type="date"
                      value={vehiclePermitExpiry}
                      onChange={e => setVehiclePermitExpiry(e.target.value)}
                    />
                    <InputField 
                      label={language === 'bn' ? 'ট্রেইলার পারমিট মেয়াদ' : 'Trailer Permit Expiry'}
                      name="trailerPermitExpiry"
                      type="date"
                      value={trailerPermitExpiry}
                      onChange={e => setTrailerPermitExpiry(e.target.value)}
                    />
                  </div>
                </div>

                {/* Card 3: Assignment Details */}
                <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                    <Calendar size={16} className="text-sky-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-text-main">
                      {language === 'bn' ? 'অ্যাসাইনমেন্ট বিবরণ' : 'Assignment Details'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label={language === 'bn' ? 'এসাইনড ডেট' : 'Assigned Date'}
                      name="vehicleAssignedDate"
                      type="date"
                      value={vehicleAssignedDate}
                      onChange={e => setVehicleAssignedDate(e.target.value)}
                    />
                    <div onClick={() => setShowStatusSelect(true)} className="cursor-pointer">
                      <InputField 
                        label={language === 'bn' ? 'স্ট্যাটাস' : 'Status'}
                        name="status"
                        value={status}
                        onChange={() => {}}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Stacked vertically, Full Width */}
                <div className="pt-4 flex flex-col gap-3 w-full">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full h-14 text-sm font-black uppercase tracking-wider justify-center"
                  >
                    {language === 'bn' ? 'আপডেট করুন' : 'Update Info'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    onClick={() => setIsEditMode(false)}
                    className="w-full h-14 text-sm font-bold uppercase tracking-wider justify-center"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </Button>
                </div>
              </form>
            )}

            {/* 3. Modification History log mode */}
            {isHistoryOpen && (
              <div className="space-y-4">
                <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] p-3.5 rounded-[8px] flex items-center gap-2.5 text-text-muted">
                  <Info size={16} className="text-sky-500 shrink-0" />
                  <p className="text-[11px] font-bold leading-normal">
                    {language === 'bn' 
                      ? 'পরিবর্তন ইতিহাস অপরিবর্তনীয় এবং প্রতিটি পরিবর্তন ট্র্যাক করে।' 
                      : 'Change history log is immutable and tracks every single configuration revision.'}
                  </p>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {selectedVehicle.history && selectedVehicle.history.length > 0 ? (
                    [...selectedVehicle.history].reverse().map((h) => (
                      <div 
                        key={h.id} 
                        className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] p-4 rounded-[8px] space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-[10px] font-black text-sky-500 uppercase tracking-wider pb-1.5 border-b border-black/5 dark:border-white/5">
                          <span>{h.fieldName}</span>
                          <span className="text-text-muted">{new Date(h.updatedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-text-muted block uppercase">
                              {language === 'bn' ? 'আগের তথ্য' : 'Previous'}
                            </span>
                            <span className="font-bold text-text-main truncate block mt-0.5">
                              {h.previousValue}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-[9px] font-bold text-text-muted block uppercase">
                              {language === 'bn' ? 'নতুন তথ্য' : 'New'}
                            </span>
                            <span className="font-bold text-emerald-500 truncate block mt-0.5">
                              {h.newValue}
                            </span>
                          </div>
                        </div>

                        <div className="text-[9px] font-bold text-text-muted pt-2 border-t border-black/5 dark:border-white/5 flex justify-between">
                          <span>By: {h.updatedBy}</span>
                          <span>{new Date(h.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-text-muted">
                      <History size={24} className="mx-auto mb-2 opacity-55" />
                      <p className="text-xs font-semibold">
                        {language === 'bn' ? 'কোনো পরিবর্তনের রেকর্ড নেই' : 'No modification records yet'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Stacked Full-Width Buttons */}
            {!isEditMode && !isHistoryOpen && (
              <div className="pt-5 border-t border-black/5 dark:border-white/5 flex flex-col gap-3 w-full">
                {/* Download Options */}
                <div className="space-y-1.5 w-full">
                  <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block">
                    {language === 'bn' ? 'রিপোর্ট ডাউনলোড করুন' : 'Download Report'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => exportVehicleToPDF(selectedVehicle, language)}
                      className="w-full h-11 text-xs font-bold uppercase tracking-wider justify-center flex items-center gap-1.5"
                    >
                      <FileText size={15} />
                      PDF (A4)
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => exportVehicleToPNG('vehicle-details-png-card', selectedVehicle.vehicleNumber)}
                      className="w-full h-11 text-xs font-bold uppercase tracking-wider justify-center flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700"
                    >
                      <ImageIcon size={15} />
                      PNG (Image)
                    </Button>
                  </div>
                </div>

                {/* Full Width Delete Button */}
                <Button
                  type="button"
                  variant="danger"
                  onClick={() => handleDelete(selectedVehicle.id)}
                  className="w-full h-12 text-sm font-extrabold uppercase tracking-wider justify-center flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  {language === 'bn' ? 'যানবাহন ডিলিট করুন' : 'Delete Vehicle'}
                </Button>

                {/* Hidden Container Optimized for Full Mobile Screen PNG Export */}
                <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
                  <div 
                    id="vehicle-details-png-card"
                    className="w-[390px] min-h-[600px] bg-slate-900 text-white p-6 flex flex-col justify-between font-sans shadow-2xl rounded-[16px] border border-slate-800"
                  >
                    <div className="space-y-5">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div>
                          <h2 className="text-xl font-black text-sky-400 tracking-wide uppercase">FLEETPRO</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Vehicle Details Report</p>
                        </div>
                        <div className="px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full text-xs font-bold uppercase">
                          {selectedVehicle.status}
                        </div>
                      </div>

                      {/* Vehicle Header Badge */}
                      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Number</span>
                          <span className="text-lg font-black text-white uppercase mt-0.5 block">{selectedVehicle.vehicleNumber}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trailer Number</span>
                          <span className="text-sm font-bold text-sky-300 font-mono mt-0.5 block">{selectedVehicle.trailerNumber || '—'}</span>
                        </div>
                      </div>

                      {/* Detail Table */}
                      <div className="bg-slate-800/40 rounded-xl border border-slate-800 divide-y divide-slate-800 overflow-hidden text-xs">
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">Vehicle Permit Expiry</span>
                          <span className="font-bold text-white font-mono">{formatDateDMY(selectedVehicle.vehiclePermitExpiry)}</span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">Trailer Permit Expiry</span>
                          <span className="font-bold text-white font-mono">{formatDateDMY(selectedVehicle.trailerPermitExpiry)}</span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">Assigned Date</span>
                          <span className="font-bold text-white font-mono">{formatDateDMY(selectedVehicle.vehicleAssignedDate)}</span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">Current Status</span>
                          <span className="font-bold text-sky-400 uppercase">{selectedVehicle.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-slate-800 text-center space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">FleetPro Vehicle Management System</p>
                      <p className="text-[9px] text-slate-600 font-mono">Generated: {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          <GlobalFullscreenSelect
            isOpen={showStatusSelect}
            onClose={() => setShowStatusSelect(false)}
            title={language === 'bn' ? 'স্ট্যাটাস নির্বাচন করুন' : 'Select Status'}
            options={['Active', 'In Service', 'Inactive']}
            onSelect={(v) => setStatus(v as any)}
          />
        </FormWindow>,
        document.body
      )}

    </div>
  );
};

export default VehicleList;
