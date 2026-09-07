import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Wrench, 
  Calendar, 
  Clock, 
  DollarSign, 
  MapPin, 
  ChevronRight, 
  X, 
  Edit, 
  History, 
  AlertCircle, 
  Droplet, 
  Info,
  SlidersHorizontal,
  Trash2,
  Download,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useStore } from '@/store';
import { VehicleService, ServiceHistoryRecord } from '@/types';
import SearchBar from '@/components/SearchBar';
import InputField from '@/components/InputField';
import Button from '@/components/Button';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import FormWindow from '@/components/FormWindow';
import { exportServiceRecordToPDF, exportServiceRecordToPNG } from '@/utils/exportUtils';

const SERVICE_TYPES = [
  'Oil', 
  'Engine', 
  'Brake', 
  'Steering', 
  'Gearbox', 
  'Differential', 
  'Suspension', 
  'Ac', 
  'Body', 
  'Electrical', 
  'Tyres', 
  'Others'
];

const VehicleServices: React.FC = () => {
  const { 
    vehicles, 
    vehicleServices, 
    addVehicleService, 
    updateVehicleService, 
    removeVehicleService,
    user, 
    language,
    confirmAction,
    showFeedback
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modal toggle states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<VehicleService | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('Oil');
  const [serviceDate, setServiceDate] = useState('');
  const [currentKilometer, setCurrentKilometer] = useState<number | ''>('');
  const [serviceCost, setServiceCost] = useState<number | ''>('');
  const [workshopProvider, setWorkshopProvider] = useState('');
  const [descriptionNotes, setDescriptionNotes] = useState('');
  const [nextServiceInfo, setNextServiceInfo] = useState('');

  // Oil Specific Form states
  const [lastOilServiceKm, setLastOilServiceKm] = useState<number>(0);
  const [nextServiceKilometer, setNextServiceKilometer] = useState<number | ''>('');
  const [oilType, setOilType] = useState('');
  const [oilQuantity, setOilQuantity] = useState<number | ''>('');
  const [oilValidity, setOilValidity] = useState<number | ''>('');

  // Dropdown Select triggers
  const [showVehicleSelect, setShowVehicleSelect] = useState(false);
  const [showServiceTypeSelect, setShowServiceTypeSelect] = useState(false);

  // Auto-fetch Last Oil Service Kilometer for selected vehicle & Auto-calculate Next Service Kilometer for Oil
  useEffect(() => {
    if (serviceType === 'Oil' && vehicleId) {
      const selectedVeh = vehicles?.find(v => v.id === vehicleId);
      if (selectedVeh) {
        const priorOilServices = (vehicleServices || [])
          .filter(s => s.vehicleNumber === selectedVeh.vehicleNumber && s.serviceType === 'Oil')
          .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
        
        if (priorOilServices.length > 0) {
          setLastOilServiceKm(priorOilServices[0].currentKilometer);
        } else {
          setLastOilServiceKm(0);
        }
      }
    }
  }, [serviceType, vehicleId, vehicleServices, vehicles]);

  // Next Oil Service calculation: Current KM + Oil Validity
  useEffect(() => {
    if (serviceType === 'Oil') {
      if (currentKilometer !== '' && oilValidity !== '') {
        const calculated = Number(currentKilometer) + Number(oilValidity);
        setNextServiceKilometer(calculated >= 0 ? calculated : '');
      } else {
        setNextServiceKilometer('');
      }
    }
  }, [currentKilometer, oilValidity, serviceType]);

  // Filter service records
  const filteredServices = useMemo(() => {
    return (vehicleServices || []).filter(s => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        (s.vehicleNumber || '').toLowerCase().includes(query) ||
        (s.workshopProvider || '').toLowerCase().includes(query) ||
        (s.serviceType || '').toLowerCase().includes(query);
      
      const matchesType = typeFilter === 'All' || s.serviceType === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [vehicleServices, searchQuery, typeFilter]);

  const resetForm = () => {
    setVehicleId(vehicles && vehicles.length > 0 ? vehicles[0].id : '');
    setServiceType('Oil');
    setServiceDate(new Date().toISOString().split('T')[0]);
    setCurrentKilometer('');
    setServiceCost('');
    setWorkshopProvider('');
    setDescriptionNotes('');
    setNextServiceInfo('');
    setLastOilServiceKm(0);
    setNextServiceKilometer('');
    setOilType('');
    setOilQuantity('');
    setOilValidity('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) {
      showFeedback(language === 'bn' ? 'যানবাহন নির্বাচন করুন' : 'Please select a vehicle', 'error');
      return;
    }
    if (!serviceType) return;

    if (serviceType === 'Oil') {
      if (oilValidity === '' || Number(oilValidity) < 0) {
        showFeedback(language === 'bn' ? 'সঠিক অয়েল ভ্যালিডিটি লিখুন' : 'Please enter a valid Oil Validity (KM)', 'error');
        return;
      }
    }

    const selectedVeh = vehicles?.find(v => v.id === vehicleId);
    if (!selectedVeh) return;

    const newService: VehicleService = {
      id: `SRV-${Date.now()}`,
      userId: user?.id || '',
      vehicleId: selectedVeh.id,
      vehicleNumber: selectedVeh.vehicleNumber,
      serviceType,
      serviceDate,
      currentKilometer: Number(currentKilometer) || 0,
      serviceCost: serviceType === 'Oil' ? 0 : (Number(serviceCost) || 0),
      oilValidity: serviceType === 'Oil' ? Number(oilValidity) : undefined,
      workshopProvider: workshopProvider.trim(),
      descriptionNotes: descriptionNotes.trim(),
      nextServiceInfo: nextServiceInfo.trim() || undefined,
      oilType: serviceType === 'Oil' ? oilType.trim() || undefined : undefined,
      oilQuantity: serviceType === 'Oil' && oilQuantity !== '' ? Number(oilQuantity) : undefined,
      nextOilServiceAfterKm: serviceType === 'Oil' ? lastOilServiceKm : undefined,
      nextServiceKilometer: nextServiceKilometer !== '' ? Number(nextServiceKilometer) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.name || user?.email || 'System User',
      history: []
    };

    addVehicleService(newService);
    setIsAddOpen(false);
    resetForm();
    showFeedback(
      language === 'bn' 
        ? 'সার্ভিস রেকর্ড সফলভাবে যুক্ত করা হয়েছে' 
        : 'Service record added successfully'
    );
  };

  const startEditing = (srv: VehicleService) => {
    setVehicleId(srv.vehicleId || '');
    setServiceType(srv.serviceType);
    setServiceDate(srv.serviceDate);
    setCurrentKilometer(srv.currentKilometer);
    setServiceCost(srv.serviceCost);
    setWorkshopProvider(srv.workshopProvider);
    setDescriptionNotes(srv.descriptionNotes);
    setNextServiceInfo(srv.nextServiceInfo || '');
    setLastOilServiceKm(srv.nextOilServiceAfterKm || 0);
    setNextServiceKilometer(srv.nextServiceKilometer || '');
    setOilType(srv.oilType || '');
    setOilQuantity(srv.oilQuantity || '');
    setOilValidity(srv.oilValidity || '');
    setIsEditMode(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    if (serviceType === 'Oil') {
      if (oilValidity === '' || Number(oilValidity) < 0) {
        showFeedback(language === 'bn' ? 'সঠিক অয়েল ভ্যালিডিটি লিখুন' : 'Please enter a valid Oil Validity (KM)', 'error');
        return;
      }
    }

    const selectedVeh = vehicles?.find(v => v.id === vehicleId);
    if (!selectedVeh) return;

    const updatedHistory: ServiceHistoryRecord[] = [...(selectedService.history || [])];
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

    compareAndLog('vehicleNumber', selectedService.vehicleNumber, selectedVeh.vehicleNumber, 'Vehicle Number');
    compareAndLog('serviceType', selectedService.serviceType, serviceType, 'Service Type');
    compareAndLog('serviceDate', selectedService.serviceDate, serviceDate, 'Service Date');
    compareAndLog('currentKilometer', selectedService.currentKilometer, currentKilometer, 'Current Kilometer');
    compareAndLog('serviceCost', selectedService.serviceCost, serviceType === 'Oil' ? 0 : serviceCost, 'Service Cost');
    compareAndLog('oilValidity', selectedService.oilValidity, serviceType === 'Oil' ? oilValidity : undefined, 'Oil Validity');
    compareAndLog('workshopProvider', selectedService.workshopProvider, workshopProvider, 'Workshop Provider');
    compareAndLog('descriptionNotes', selectedService.descriptionNotes, descriptionNotes, 'Description Notes');
    compareAndLog('oilType', selectedService.oilType, oilType, 'Oil Type');
    compareAndLog('oilQuantity', selectedService.oilQuantity, oilQuantity, 'Oil Quantity');
    compareAndLog('nextServiceKilometer', selectedService.nextServiceKilometer, nextServiceKilometer, 'Next Service Kilometer');

    const updatedService: VehicleService = {
      ...selectedService,
      vehicleId: selectedVeh.id,
      vehicleNumber: selectedVeh.vehicleNumber,
      serviceType,
      serviceDate,
      currentKilometer: Number(currentKilometer) || 0,
      serviceCost: serviceType === 'Oil' ? 0 : (Number(serviceCost) || 0),
      oilValidity: serviceType === 'Oil' ? Number(oilValidity) : undefined,
      workshopProvider: workshopProvider.trim(),
      descriptionNotes: descriptionNotes.trim(),
      nextServiceInfo: nextServiceInfo.trim() || undefined,
      oilType: serviceType === 'Oil' ? oilType.trim() : undefined,
      oilQuantity: serviceType === 'Oil' && oilQuantity !== '' ? Number(oilQuantity) : undefined,
      nextOilServiceAfterKm: serviceType === 'Oil' ? lastOilServiceKm : undefined,
      nextServiceKilometer: nextServiceKilometer !== '' ? Number(nextServiceKilometer) : undefined,
      updatedAt: timestamp,
      updatedBy: updaterName,
      history: updatedHistory
    };

    updateVehicleService(updatedService);
    setSelectedService(updatedService);
    setIsEditMode(false);
    showFeedback(
      language === 'bn' 
        ? 'সার্ভিস রেকর্ড সফলভাবে আপডেট করা হয়েছে' 
        : 'Service record updated successfully'
    );
  };

  const handleDelete = (serviceId: string) => {
    confirmAction({
      title: language === 'bn' ? 'সার্ভিস রেকর্ড ডিলিট করুন' : 'Delete Service Record',
      message: language === 'bn' 
        ? 'আপনি কি নিশ্চিত যে এই সার্ভিসিং রেকর্ডটি ডিলিট করতে চান?' 
        : 'Are you sure you want to permanently delete this service record?',
      confirmText: language === 'bn' ? 'ডিলিট করুন' : 'Delete',
      cancelText: language === 'bn' ? 'বাতিল' : 'Cancel',
      onConfirm: () => {
        removeVehicleService(serviceId);
        setSelectedService(null);
        setIsEditMode(false);
        setIsHistoryOpen(false);
        showFeedback(
          language === 'bn' 
            ? 'সার্ভিস রেকর্ড ডিলিট করা হয়েছে' 
            : 'Service record deleted successfully'
        );
      }
    });
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
          title={language === 'bn' ? 'সার্ভিস যুক্ত করুন' : 'Add Service'}
        >
          {language === 'bn' ? 'যোগ করুন' : 'Add'}
        </Button>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
        <span className="text-[11px] font-black tracking-wider text-text-muted uppercase mr-1 flex items-center gap-1">
          <SlidersHorizontal size={12} /> {language === 'bn' ? 'ক্যাটাগরি:' : 'Category:'}
        </span>
        {['All', ...SERVICE_TYPES].map(type => (
          <Button
            key={type}
            variant={typeFilter === type ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(type)}
            className="shrink-0"
          >
            {type === 'All' ? (language === 'bn' ? 'সব' : 'All') : type}
          </Button>
        ))}
      </div>

      {/* Services List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredServices.map(s => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              key={s.id}
              onClick={() => setSelectedService(s)}
              className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] p-3.5 rounded-[8px] cursor-pointer hover:brightness-105 hover:shadow-md active:scale-[0.99] transition-all flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-sky-500/10 text-sky-500 rounded-[8px]">
                      {s.serviceType === 'Oil' ? <Droplet size={18} /> : <Wrench size={18} />}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm tracking-wide text-text-main group-hover:text-sky-500 transition-colors uppercase">
                        {s.vehicleNumber}
                      </h3>
                      <p className="text-[10px] font-black tracking-wider text-text-muted uppercase mt-0.5">
                        {s.serviceType} Service
                      </p>
                    </div>
                  </div>
                  
                  {s.serviceType === 'Oil' ? (
                    <span className="text-xs font-black text-sky-500 bg-sky-500/10 border border-sky-500/10 px-2.5 py-0.5 rounded-[4px]">
                      {(s.oilValidity || 0).toLocaleString()} KM {language === 'bn' ? 'ভ্যালিডিটি' : 'Validity'}
                    </span>
                  ) : (
                    <span className="text-xs font-black text-sky-500 bg-sky-500/10 border border-sky-500/10 px-2.5 py-0.5 rounded-[4px]">
                      ৳{s.serviceCost.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Primary KM details */}
                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-black/5 dark:border-white/5">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted block uppercase tracking-wide">
                      {language === 'bn' ? 'সার্ভিস ডেট' : 'Service Date'}
                    </span>
                    <span className="text-xs font-bold text-text-main mt-0.5 block">
                      {s.serviceDate}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-text-muted block uppercase tracking-wide">
                        {language === 'bn' ? 'বর্তমান কিমি' : 'Current Kilometer'}
                      </span>
                      <span className="text-xs font-bold text-text-main mt-0.5 block">
                        {s.currentKilometer.toLocaleString()} KM
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-sky-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </div>

                {/* Workshop name */}
                {s.workshopProvider && (
                  <div className="pt-1 text-[10px] font-bold text-text-muted flex items-center gap-1">
                    <MapPin size={12} className="text-sky-500" />
                    <span className="truncate max-w-full">{s.workshopProvider}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredServices.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-black/10 dark:border-white/10 rounded-[8px] bg-theme-card">
            <AlertCircle size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm font-bold text-text-muted uppercase">
              {language === 'bn' ? 'কোনো সার্ভিস রেকর্ড পাওয়া যায়নি' : 'No service records found'}
            </p>
          </div>
        )}
      </div>

      {/* ==================== ADD SERVICE MODAL ==================== */}
      {isAddOpen && createPortal(
        <FormWindow 
          title={language === 'bn' ? 'নতুন সার্ভিস রেকর্ড যুক্ত করুন' : 'Add Service Record'} 
          onClose={() => setIsAddOpen(false)}
        >
          <form onSubmit={handleAddSubmit} className="space-y-5 max-w-4xl mx-auto">
            
            {/* Card 1: Vehicle & Service Category */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Wrench size={16} className="text-sky-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? 'যানবাহন ও সার্ভিস ক্যাটাগরি' : 'Vehicle & Service Category'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => setShowVehicleSelect(true)} className="cursor-pointer">
                  <InputField 
                    label={language === 'bn' ? 'যানবাহন নির্বাচন *' : 'Select Vehicle *'}
                    name="vehicleId"
                    value={vehicles.find(v => v.id === vehicleId)?.vehicleNumber || ''}
                    onChange={() => {}}
                    readOnly
                    required
                    icon={<Wrench size={18} />}
                  />
                </div>

                <div onClick={() => setShowServiceTypeSelect(true)} className="cursor-pointer">
                  <InputField 
                    label={language === 'bn' ? 'সার্ভিস টাইপ *' : 'Service Type *'}
                    name="serviceType"
                    value={serviceType}
                    onChange={() => {}}
                    readOnly
                    required
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Service Metrics & Workshop Details */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Calendar size={16} className="text-sky-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? 'তারিখ, রিডিং ও খরচ' : 'Date, Mileage & Workshop'}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField 
                  label={language === 'bn' ? 'সার্ভিস ডেট *' : 'Service Date *'}
                  name="serviceDate"
                  type="date"
                  required
                  value={serviceDate}
                  onChange={e => setServiceDate(e.target.value)}
                />
                
                <InputField 
                  label={language === 'bn' ? 'বর্তমান কিমি *' : 'Current Kilometer *'}
                  name="currentKilometer"
                  type="number"
                  required
                  value={currentKilometer}
                  onChange={e => setCurrentKilometer(e.target.value === '' ? '' : Number(e.target.value))}
                  icon={<Clock size={18} />}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {serviceType === 'Oil' ? (
                  <InputField 
                    label={language === 'bn' ? 'অয়েল ভ্যালিডিটি (KM) *' : 'Oil Validity (KM) *'}
                    name="oilValidity"
                    type="number"
                    required
                    value={oilValidity}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setOilValidity('');
                      } else {
                        const num = Number(val);
                        if (num >= 0) {
                          setOilValidity(num);
                        }
                      }
                    }}
                    placeholder={language === 'bn' ? 'যেমন: ১২০০' : 'e.g. 1200'}
                    icon={<Clock size={18} />}
                  />
                ) : (
                  <InputField 
                    label={language === 'bn' ? 'সার্ভিস খরচ (৳) *' : 'Service Cost (৳) *'}
                    name="serviceCost"
                    type="number"
                    required
                    value={serviceCost}
                    onChange={e => setServiceCost(e.target.value === '' ? '' : Number(e.target.value))}
                    icon={<DollarSign size={18} />}
                  />
                )}
                
                <InputField 
                  label={language === 'bn' ? 'ওয়ার্কশপ / প্রোভাইডার' : 'Workshop Name'}
                  name="workshopProvider"
                  value={workshopProvider}
                  onChange={e => setWorkshopProvider(e.target.value)}
                  icon={<MapPin size={18} />}
                />
              </div>
            </div>

            {/* Card 3: Oil Service & Next Due Configurations */}
            {serviceType === 'Oil' ? (
              <div className="bg-theme-card border border-sky-500/20 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4 bg-sky-500/[0.02]">
                <div className="flex items-center gap-2 pb-2 border-b border-sky-500/10">
                  <Droplet size={16} className="text-sky-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-sky-500">
                    {language === 'bn' ? 'অেইল সার্ভিস কনফিগারেশন' : 'Oil Service Configuration'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
                      {language === 'bn' ? 'পূর্ববর্তী অয়েল সার্ভিস কিমি' : 'Last Oil Service KM'}
                    </span>
                    <div className="py-3 px-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[8px] text-sm text-text-muted font-bold">
                      {lastOilServiceKm.toLocaleString()} KM
                    </div>
                  </div>

                  <InputField 
                    label={language === 'bn' ? 'পরবর্তী অয়েল পরিবর্তন কিমি' : 'Next Oil Change KM'}
                    name="nextServiceKilometer"
                    type="number"
                    value={nextServiceKilometer}
                    readOnly
                    required
                    onChange={() => {}}
                    className="h-14 opacity-90"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <InputField 
                    label={language === 'bn' ? 'অেইল টাইপ / গ্রেড' : 'Oil Type / Grade'}
                    name="oilType"
                    value={oilType}
                    onChange={e => setOilType(e.target.value)}
                    placeholder="e.g. 15W-40 Synthetic"
                  />

                  <InputField 
                    label={language === 'bn' ? 'অেইল পরিমাণ (লিটার)' : 'Oil Qty (Liters)'}
                    name="oilQuantity"
                    type="number"
                    value={oilQuantity}
                    onChange={e => setOilQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 8.5"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <Clock size={16} className="text-sky-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-text-main">
                    {language === 'bn' ? 'পরবর্তী সার্ভিস শিডিউল' : 'Next Service Due Schedule'}
                  </span>
                </div>
                <InputField 
                  label={language === 'bn' ? 'পরবর্তী সার্ভিস কিলোমিটার (ঐচ্ছিক)' : 'Next Service Kilometer (Optional)'}
                  name="nextServiceKilometer"
                  type="number"
                  value={nextServiceKilometer}
                  onChange={e => setNextServiceKilometer(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            )}

            {/* Card 4: Description Notes */}
            <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <Info size={16} className="text-sky-500" />
                <span className="text-xs font-black uppercase tracking-wider text-text-main">
                  {language === 'bn' ? 'সার্ভিস বিবরণ ও নোট' : 'Service Notes & Description'}
                </span>
              </div>
              <textarea
                rows={3}
                value={descriptionNotes}
                onChange={(e) => setDescriptionNotes(e.target.value)}
                placeholder={language === 'bn' ? 'সার্ভিসিং কাজের বিবরণ লিখুন...' : 'Add notes regarding repairs, parts replaced, etc.'}
                className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[8px] text-sm font-bold text-text-main focus:outline-none focus:border-sky-500 transition-all uppercase"
              />
            </div>

            {/* Action Buttons: Full Width, Stacked */}
            <div className="pt-4 flex flex-col gap-3 w-full">
              <Button
                type="submit"
                variant="emerald"
                size="lg"
                className="w-full h-14 text-sm font-black uppercase tracking-wider justify-center"
              >
                {language === 'bn' ? 'সার্ভিস রেকর্ড সংরক্ষণ করুন' : 'Save Record'}
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
            isOpen={showVehicleSelect}
            onClose={() => setShowVehicleSelect(false)}
            title={language === 'bn' ? 'যানবাহন নির্বাচন করুন' : 'Select Vehicle'}
            options={vehicles.map(v => v.vehicleNumber)}
            onSelect={(val) => {
              const v = vehicles.find(veh => veh.vehicleNumber === val);
              if (v) setVehicleId(v.id);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showServiceTypeSelect}
            onClose={() => setShowServiceTypeSelect(false)}
            title={language === 'bn' ? 'সার্ভিস টাইপ নির্বাচন করুন' : 'Select Service Type'}
            options={SERVICE_TYPES}
            onSelect={setServiceType}
          />
        </FormWindow>,
        document.body
      )}

      {/* ==================== SERVICE DETAILS & EDIT & HISTORY MODAL ==================== */}
      {selectedService && createPortal(
        <FormWindow
          title={
            isEditMode 
              ? (language === 'bn' ? 'সার্ভিস রেকর্ড সংশোধন' : 'Edit Service Record')
              : isHistoryOpen
              ? (language === 'bn' ? 'পরিবর্তন ইতিহাস' : 'Modification Audit Logs')
              : (language === 'bn' ? 'সার্ভিস রেকর্ড বিবরণ' : 'Service Record Details')
          }
          onClose={() => {
            setSelectedService(null);
            setIsEditMode(false);
            setIsHistoryOpen(false);
          }}
        >
          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Action Toggles Card (Full Width, Equal Width Options) */}
            <div className="grid grid-cols-3 w-full border border-black/5 dark:border-white/10 rounded-[8px] overflow-hidden bg-black/5 dark:bg-white/5 text-center text-xs font-bold shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(false);
                  setIsHistoryOpen(false);
                }}
                className={`py-3 flex items-center justify-center gap-1.5 transition-colors border-r border-black/5 dark:border-white/10 ${
                  !isEditMode && !isHistoryOpen 
                    ? 'bg-sky-500 text-white font-black' 
                    : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Info size={15} />
                {language === 'bn' ? 'বিবরণ' : 'Details'}
              </button>
              <button
                type="button"
                onClick={() => {
                  startEditing(selectedService);
                  setIsHistoryOpen(false);
                }}
                className={`py-3 flex items-center justify-center gap-1.5 transition-colors border-r border-black/5 dark:border-white/10 ${
                  isEditMode 
                    ? 'bg-sky-500 text-white font-black' 
                    : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Edit size={15} />
                {language === 'bn' ? 'সংশোধন' : 'Edit'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(true);
                  setIsEditMode(false);
                }}
                className={`py-3 flex items-center justify-center gap-1.5 transition-colors ${
                  isHistoryOpen 
                    ? 'bg-sky-500 text-white font-black' 
                    : 'text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <History size={15} />
                {language === 'bn' ? 'ইতিহাস' : 'History'}
              </button>
            </div>

            {/* 1. View Details mode */}
            {!isEditMode && !isHistoryOpen && (
              <div className="space-y-4">
                <div className="border border-black/5 dark:border-white/10 rounded-[10px] overflow-hidden bg-theme-card shadow-sm divide-y divide-black/5 dark:divide-white/10">
                  
                  {/* Vehicle Number */}
                  <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {language === 'bn' ? 'যানবাহন নম্বর' : 'Vehicle Number'}
                    </span>
                    <span className="text-xs font-extrabold text-text-main uppercase">
                      {selectedService.vehicleNumber}
                    </span>
                  </div>

                  {/* Service Type */}
                  <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {language === 'bn' ? 'সার্ভিস ক্যাটাগরি' : 'Service Type'}
                    </span>
                    <span className="text-xs font-extrabold text-sky-500 uppercase">
                      {selectedService.serviceType} Service
                    </span>
                  </div>

                  {/* Cost / Validity */}
                  <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {selectedService.serviceType === 'Oil' 
                        ? (language === 'bn' ? 'অয়েল ভ্যালিডিটি' : 'Oil Validity')
                        : (language === 'bn' ? 'মোট সার্ভিস খরচ' : 'Service Cost')}
                    </span>
                    <span className="text-xs font-extrabold text-sky-500">
                      {selectedService.serviceType === 'Oil' 
                        ? `${(selectedService.oilValidity || 0).toLocaleString()} KM`
                        : `৳${selectedService.serviceCost.toLocaleString()}`}
                    </span>
                  </div>

                  {/* Service Date */}
                  <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {language === 'bn' ? 'সার্ভিস তারিখ' : 'Service Date'}
                    </span>
                    <span className="text-xs font-extrabold text-text-main font-mono">
                      {selectedService.serviceDate}
                    </span>
                  </div>

                  {/* Current Kilometer */}
                  <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {language === 'bn' ? 'বর্তমান কিমি' : 'Current Kilometer'}
                    </span>
                    <span className="text-xs font-extrabold text-text-main font-mono">
                      {selectedService.currentKilometer.toLocaleString()} KM
                    </span>
                  </div>

                  {/* Next Service Due Kilometer */}
                  {selectedService.nextServiceKilometer ? (
                    <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        {language === 'bn' ? 'পরবর্তী সার্ভিস কিমি' : 'Next Service Due'}
                      </span>
                      <span className="text-xs font-extrabold text-sky-500 font-mono">
                        {selectedService.nextServiceKilometer.toLocaleString()} KM
                      </span>
                    </div>
                  ) : null}

                  {/* Oil Grade */}
                  {selectedService.serviceType === 'Oil' && selectedService.oilType ? (
                    <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        {language === 'bn' ? 'অয়েল গ্রেড' : 'Oil Grade'}
                      </span>
                      <span className="text-xs font-extrabold text-text-main">
                        {selectedService.oilType}
                      </span>
                    </div>
                  ) : null}

                  {/* Oil Quantity */}
                  {selectedService.serviceType === 'Oil' && selectedService.oilQuantity ? (
                    <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        {language === 'bn' ? 'অয়েল পরিমাণ' : 'Oil Quantity'}
                      </span>
                      <span className="text-xs font-extrabold text-text-main">
                        {selectedService.oilQuantity} L
                      </span>
                    </div>
                  ) : null}

                  {/* Workshop / Provider */}
                  <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {language === 'bn' ? 'ওয়ার্কশপ / প্রোভাইডার' : 'Workshop Name'}
                    </span>
                    <span className="text-xs font-extrabold text-text-main truncate max-w-[180px]">
                      {selectedService.workshopProvider || '—'}
                    </span>
                  </div>

                  {/* Recorded By */}
                  <div className="flex items-center justify-between p-3.5 bg-black/[0.01] dark:bg-white/[0.01]">
                    <span className="text-[10px] font-bold text-text-muted uppercase">
                      {language === 'bn' ? 'এন্ট্রি করেছেন' : 'Recorded By'}
                    </span>
                    <span className="text-xs font-extrabold text-text-main truncate max-w-[180px]">
                      {selectedService.createdBy || 'System'}
                    </span>
                  </div>

                  {/* Notes / Description */}
                  {selectedService.descriptionNotes ? (
                    <div className="flex flex-col p-3.5 bg-black/[0.01] dark:bg-white/[0.01] gap-1">
                      <span className="text-[10px] font-bold text-text-muted uppercase">
                        {language === 'bn' ? 'বিবরণ ও নোট' : 'Notes / Description'}
                      </span>
                      <span className="text-xs font-semibold text-text-main uppercase whitespace-pre-line leading-relaxed">
                        {selectedService.descriptionNotes}
                      </span>
                    </div>
                  ) : null}

                </div>

                {/* Download Options & Full Width Delete Button */}
                <div className="pt-2 flex flex-col gap-3 w-full">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-text-muted tracking-wider block">
                      {language === 'bn' ? 'রিপোর্ট ডাউনলোড করুন' : 'Download Report'}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => exportServiceRecordToPDF(selectedService, language)}
                        className="w-full h-11 text-xs font-bold uppercase tracking-wider justify-center flex items-center gap-1.5"
                      >
                        <FileText size={15} />
                        PDF (A4)
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => exportServiceRecordToPNG('service-record-png-card', selectedService.vehicleNumber)}
                        className="w-full h-11 text-xs font-bold uppercase tracking-wider justify-center flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700"
                      >
                        <ImageIcon size={15} />
                        PNG (Image)
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleDelete(selectedService.id)}
                    className="w-full h-12 text-sm font-extrabold uppercase tracking-wider justify-center flex items-center gap-2 mt-1"
                  >
                    <Trash2 size={16} />
                    {language === 'bn' ? 'সার্ভিস রেকর্ড মুছুন' : 'Delete Record'}
                  </Button>
                </div>

                {/* Hidden Container Optimized for Full Mobile Screen PNG Export */}
                <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none">
                  <div 
                    id="service-record-png-card"
                    className="w-[390px] min-h-[680px] bg-slate-900 text-white p-6 flex flex-col justify-between font-sans shadow-2xl rounded-[16px] border border-slate-800"
                  >
                    <div className="space-y-5">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                        <div>
                          <h2 className="text-xl font-black text-sky-400 tracking-wide uppercase">FLEETPRO</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Service Record Details</p>
                        </div>
                        <div className="px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-full text-xs font-bold uppercase">
                          {selectedService.serviceType}
                        </div>
                      </div>

                      {/* Vehicle Header Badge */}
                      <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle Number</span>
                          <span className="text-lg font-black text-white uppercase mt-0.5 block">{selectedService.vehicleNumber}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Date</span>
                          <span className="text-sm font-bold text-sky-300 font-mono mt-0.5 block">{selectedService.serviceDate}</span>
                        </div>
                      </div>

                      {/* Detail Table */}
                      <div className="bg-slate-800/40 rounded-xl border border-slate-800 divide-y divide-slate-800 overflow-hidden text-xs">
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">Service Category</span>
                          <span className="font-bold text-white uppercase">{selectedService.serviceType} Service</span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">
                            {selectedService.serviceType === 'Oil' ? 'Oil Validity' : 'Service Cost'}
                          </span>
                          <span className="font-bold text-sky-400">
                            {selectedService.serviceType === 'Oil' 
                              ? `${(selectedService.oilValidity || 0).toLocaleString()} KM`
                              : `৳${selectedService.serviceCost.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">Current Kilometer</span>
                          <span className="font-bold text-white font-mono">{selectedService.currentKilometer.toLocaleString()} KM</span>
                        </div>
                        {selectedService.nextServiceKilometer && (
                          <div className="flex justify-between p-3.5">
                            <span className="font-semibold text-slate-400">Next Service Due</span>
                            <span className="font-bold text-sky-400 font-mono">{selectedService.nextServiceKilometer.toLocaleString()} KM</span>
                          </div>
                        )}
                        {selectedService.serviceType === 'Oil' && selectedService.oilType && (
                          <div className="flex justify-between p-3.5">
                            <span className="font-semibold text-slate-400">Oil Grade</span>
                            <span className="font-bold text-white">{selectedService.oilType}</span>
                          </div>
                        )}
                        {selectedService.serviceType === 'Oil' && selectedService.oilQuantity && (
                          <div className="flex justify-between p-3.5">
                            <span className="font-semibold text-slate-400">Oil Quantity</span>
                            <span className="font-bold text-white">{selectedService.oilQuantity} L</span>
                          </div>
                        )}
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">Workshop / Provider</span>
                          <span className="font-bold text-white max-w-[180px] truncate text-right">{selectedService.workshopProvider || '—'}</span>
                        </div>
                        <div className="flex justify-between p-3.5">
                          <span className="font-semibold text-slate-400">Recorded By</span>
                          <span className="font-bold text-white max-w-[180px] truncate text-right">{selectedService.createdBy || 'System'}</span>
                        </div>
                        {selectedService.descriptionNotes && (
                          <div className="p-3.5 space-y-1">
                            <span className="font-semibold text-slate-400 block text-[10px] uppercase">Notes & Description</span>
                            <span className="font-medium text-slate-200 block text-xs uppercase leading-relaxed">{selectedService.descriptionNotes}</span>
                          </div>
                        )}
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

            {/* 2. Edit details mode */}
            {isEditMode && (
              <form onSubmit={handleUpdateSubmit} className="space-y-5">
                
                {/* Card 1: Vehicle & Service Category */}
                <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                    <Wrench size={16} className="text-sky-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-text-main">
                      {language === 'bn' ? 'যানবাহন ও সার্ভিস ক্যাটাগরি' : 'Vehicle & Service Category'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div onClick={() => setShowVehicleSelect(true)} className="cursor-pointer">
                      <InputField 
                        label={language === 'bn' ? 'যানবাহন নির্বাচন *' : 'Select Vehicle *'}
                        name="vehicleId"
                        value={vehicles.find(v => v.id === vehicleId)?.vehicleNumber || ''}
                        onChange={() => {}}
                        readOnly
                        required
                        icon={<Wrench size={18} />}
                      />
                    </div>

                    <div onClick={() => setShowServiceTypeSelect(true)} className="cursor-pointer">
                      <InputField 
                        label={language === 'bn' ? 'সার্ভিস টাইপ *' : 'Service Type *'}
                        name="serviceType"
                        value={serviceType}
                        onChange={() => {}}
                        readOnly
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Service Metrics & Workshop Details */}
                <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                    <Calendar size={16} className="text-sky-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-text-main">
                      {language === 'bn' ? 'তারিখ, রিডিং ও খরচ' : 'Date, Mileage & Workshop'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                      label={language === 'bn' ? 'সার্ভিস ডেট *' : 'Service Date *'}
                      name="serviceDate"
                      type="date"
                      required
                      value={serviceDate}
                      onChange={e => setServiceDate(e.target.value)}
                    />
                    
                    <InputField 
                      label={language === 'bn' ? 'বর্তমান কিমি *' : 'Current Kilometer *'}
                      name="currentKilometer"
                      type="number"
                      required
                      value={currentKilometer}
                      onChange={e => setCurrentKilometer(e.target.value === '' ? '' : Number(e.target.value))}
                      icon={<Clock size={18} />}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {serviceType === 'Oil' ? (
                      <InputField 
                        label={language === 'bn' ? 'অয়েল ভ্যালিডিটি (KM) *' : 'Oil Validity (KM) *'}
                        name="oilValidity"
                        type="number"
                        required
                        value={oilValidity}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === '') {
                            setOilValidity('');
                          } else {
                            const num = Number(val);
                            if (num >= 0) {
                              setOilValidity(num);
                            }
                          }
                        }}
                        placeholder={language === 'bn' ? 'যেমন: ১২০০' : 'e.g. 1200'}
                        icon={<Clock size={18} />}
                      />
                    ) : (
                      <InputField 
                        label={language === 'bn' ? 'সার্ভিস খরচ (৳) *' : 'Service Cost (৳) *'}
                        name="serviceCost"
                        type="number"
                        required
                        value={serviceCost}
                        onChange={e => setServiceCost(e.target.value === '' ? '' : Number(e.target.value))}
                        icon={<DollarSign size={18} />}
                      />
                    )}
                    
                    <InputField 
                      label={language === 'bn' ? 'ওয়ার্কশপ / প্রোভাইডার' : 'Workshop Name'}
                      name="workshopProvider"
                      value={workshopProvider}
                      onChange={e => setWorkshopProvider(e.target.value)}
                      icon={<MapPin size={18} />}
                    />
                  </div>
                </div>

                {/* Card 3: Oil / Next due specs */}
                {serviceType === 'Oil' ? (
                  <div className="bg-theme-card border border-sky-500/20 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4 bg-sky-500/[0.02]">
                    <div className="flex items-center gap-2 pb-2 border-b border-sky-500/10">
                      <Droplet size={16} className="text-sky-500" />
                      <span className="text-xs font-black uppercase tracking-wider text-sky-500">
                        {language === 'bn' ? 'অেইল সার্ভিস কনফিগারেশন' : 'Oil Service Configuration'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField 
                        label="Oil Grade"
                        name="oilType"
                        value={oilType}
                        onChange={e => setOilType(e.target.value)}
                      />
                      <InputField 
                        label="Oil Qty (Liters)"
                        name="oilQuantity"
                        type="number"
                        value={oilQuantity}
                        onChange={e => setOilQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                    <Clock size={16} className="text-sky-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-text-main">
                      {serviceType === 'Oil' 
                        ? (language === 'bn' ? 'পরবর্তী অয়েল পরিবর্তন কিমি' : 'Next Oil Change KM')
                        : (language === 'bn' ? 'পরবর্তী সার্ভিস কিলোমিটার' : 'Next Due Kilometer')}
                    </span>
                  </div>
                  {serviceType === 'Oil' ? (
                    <InputField 
                      label={language === 'bn' ? 'পরবর্তী অয়েল পরিবর্তন কিমি' : 'Next Oil Change KM'}
                      name="nextServiceKilometer"
                      type="number"
                      value={nextServiceKilometer}
                      readOnly
                      required
                      onChange={() => {}}
                      className="h-14 opacity-90"
                    />
                  ) : (
                    <InputField 
                      label={language === 'bn' ? 'পরবর্তী সার্ভিস কিলোমিটার (ঐচ্ছিক)' : 'Next Service Kilometer (Optional)'}
                      name="nextServiceKilometer"
                      type="number"
                      value={nextServiceKilometer}
                      onChange={e => setNextServiceKilometer(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  )}
                </div>

                <div className="bg-theme-card border border-black/5 dark:border-white/10 shadow-sm p-4 sm:p-5 rounded-[10px] space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                    <Info size={16} className="text-sky-500" />
                    <span className="text-xs font-black uppercase tracking-wider text-text-main">
                      {language === 'bn' ? 'নোট' : 'Notes & Description'}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={descriptionNotes}
                    onChange={(e) => setDescriptionNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-[8px] text-sm font-bold text-text-main focus:outline-none focus:border-sky-500 transition-all uppercase"
                  />
                </div>

                {/* Action Buttons: Full width stacked */}
                <div className="pt-4 flex flex-col gap-3 w-full">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full h-14 text-sm font-black uppercase tracking-wider justify-center"
                  >
                    {language === 'bn' ? 'রেকর্ড আপডেট করুন' : 'Update Record'}
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

            {/* 3. Immutable Change History */}
            {isHistoryOpen && (
              <div className="space-y-4">
                <div className="bg-theme-card border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] p-3.5 rounded-[8px] flex items-center gap-2.5 text-text-muted">
                  <Info size={16} className="text-sky-500 shrink-0" />
                  <p className="text-[11px] font-bold leading-normal">
                    Service audit trail records are immutable and track all details of historical modifications.
                  </p>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {selectedService.history && selectedService.history.length > 0 ? (
                    [...selectedService.history].reverse().map((h) => (
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
                            <span className="text-[9px] font-bold text-text-muted block uppercase">Previous Value</span>
                            <span className="font-bold text-text-main truncate block mt-0.5">
                              {h.previousValue}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-[9px] font-bold text-text-muted block uppercase">New Value</span>
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
                        No modification audit records yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          <GlobalFullscreenSelect
            isOpen={showVehicleSelect}
            onClose={() => setShowVehicleSelect(false)}
            title={language === 'bn' ? 'যানবাহন নির্বাচন করুন' : 'Select Vehicle'}
            options={vehicles.map(v => v.vehicleNumber)}
            onSelect={(val) => {
              const v = vehicles.find(veh => veh.vehicleNumber === val);
              if (v) setVehicleId(v.id);
            }}
          />

          <GlobalFullscreenSelect
            isOpen={showServiceTypeSelect}
            onClose={() => setShowServiceTypeSelect(false)}
            title={language === 'bn' ? 'সার্ভিস টাইপ নির্বাচন করুন' : 'Select Service Type'}
            options={SERVICE_TYPES}
            onSelect={setServiceType}
          />
        </FormWindow>,
        document.body
      )}

    </div>
  );
};

export default VehicleServices;
