import React from 'react';

import { useStore } from '../store';
import { ChevronLeft, Truck, MapPin, Calendar, User, Receipt, DollarSign, Clock, Hash, Package, Fuel } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

const TripDetails: React.FC = () => {
  const { selectedTrip, goBack, language, users, appThemeMode, isEyeComfort, currencies, selectedCurrency } = useStore();
  const currency = currencies?.find(c => c.code === selectedCurrency) || { symbol: '$', code: 'USD', name: 'US Dollar' };
  const t = TRANSLATIONS[language];
  const trip = selectedTrip;

  if (!trip) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">No trip selected.</p>
        <button onClick={() => goBack()} className="ml-4 text-cyan-500 underline">Go Back</button>
      </div>
    );
  }

  const driver = users.find(u => u.id === trip.userId);
  const driverName = driver ? driver.name : trip.userId;

  return (
    <div 
      
      
      
      
      className={`flex flex-col text-text-main ${isEyeComfort ? 'eye-comfort' : ''} ${language === 'ar' ? 'rtl' : 'ltr'}`}
    >
      <div className="pt-4 pb-32 space-y-6 flex-1 max-w-lg mx-auto w-full">
        {/* Status Card */}
        <div 
          
          
          
          className="bg-theme-card p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-bl-full -mr-16 -mt-16 z-0 pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10 mb-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Company</p>
              <h2 className="text-xl font-black text-text-main">{trip.companyName || 'Unknown Company'}</h2>
            </div>
            <div className={`px-3 py-1.5 rounded-xl flex items-center justify-center font-bold text-[10px] uppercase tracking-wider ${
              trip.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
              trip.paymentStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
              'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
            }`}>
              {trip.paymentStatus}
            </div>
          </div>

          {/* Timeline Route View */}
          <div className="relative pl-6 space-y-8 py-2">
            {/* Vertical Line */}
            <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-gray-200 dark:bg-white/10 rounded-full" />
            
            {/* Origin */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-theme-bg border-4 border-cyan-500 z-10 box-content shadow-sm" />
              <p className="text-[10px] font-bold text-cyan-500 mb-0.5 tracking-wider uppercase">Loading Point</p>
              <h3 className="font-bold text-base text-text-main pr-2 leading-tight">{trip.loadingPlace || 'Not Specified'}, {trip.fromCountry || ''}</h3>
              <div className="flex items-center gap-2 mt-1.5 opacity-70">
                <Calendar size={12} className="text-text-muted" />
                <span className="text-xs font-medium text-text-muted">{trip.loadingDate}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <Clock size={12} className="text-text-muted" />
                <span className="text-xs font-medium text-text-muted">{trip.loadingTime}</span>
              </div>
            </div>

            {/* Destination */}
            <div className="relative">
              <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-theme-bg border-4 border-emerald-500 z-10 box-content shadow-sm" />
              <p className="text-[10px] font-bold text-emerald-500 mb-0.5 tracking-wider uppercase">Delivery Point</p>
              <h3 className="font-bold text-base text-text-main pr-2 leading-tight">{trip.deliveryPlace || 'Not Specified'}, {trip.arrivalCountry || ''}</h3>
              <div className="flex items-center gap-2 mt-1.5 opacity-70">
                <Calendar size={12} className="text-text-muted" />
                <span className="text-xs font-medium text-text-muted">{trip.deliveryDate}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <Clock size={12} className="text-text-muted" />
                <span className="text-xs font-medium text-text-muted">{trip.deliveryTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div 
          
          
          
          className="grid grid-cols-2 gap-3"
        >
          {/* Driver & Vehicle */}
          <div className="col-span-2 bg-theme-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 flex items-center">
            <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
              <User size={24} />
            </div>
            <div className="ml-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driver</p>
              <h3 className="font-black text-sm text-text-main uppercase">{driverName}</h3>
            </div>
          </div>
          
          <div className="bg-theme-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            <Truck size={18} className="text-gray-400 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vehicle</p>
            <h3 className="font-black text-sm text-text-main">{trip.vehicleNumber || 'N/A'}</h3>
          </div>
          
          <div className="bg-theme-card p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
            <Package size={18} className="text-gray-400 mb-2" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trailer</p>
            <h3 className="font-black text-sm text-text-main">{trip.trailerNumber || 'N/A'}</h3>
          </div>
        </div>

        {/* Documents */}
        <div 
          
          
          
          className="bg-theme-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5"
        >
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-white/5">
            <Receipt size={18} className="text-cyan-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-text-main">Documents & Cargo</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-y-4 gap-x-2">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bayan No</p>
              <p className="text-sm font-bold text-text-main mt-0.5">{trip.bayanNumber || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice No</p>
              <p className="text-sm font-bold text-text-main mt-0.5">{trip.invoiceNumber || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Container</p>
              <p className="text-sm font-bold text-text-main mt-0.5">{trip.containerNumber || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Size/Type</p>
              <p className="text-sm font-bold text-text-main mt-0.5">{trip.containerTitle || '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading Type</p>
              <p className="text-sm font-bold text-text-main mt-0.5">{trip.loadingType || '-'}</p>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div 
          
          
          
          className="bg-theme-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5"
        >
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-white/5">
            <DollarSign size={18} className="text-emerald-500" />
            <h3 className="font-black text-xs uppercase tracking-widest text-text-main">Financials</h3>
          </div>
          
          <div className="space-y-3 mb-6">
            {trip.dieselPrice ? (
              <div className="flex justify-between items-start text-sm">
                <span className="text-text-muted font-medium mt-1">Diesel</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-text-main">{((trip.dieselPrice || 0) - (trip.dieselPaid || 0)).toFixed(2)}</span>
                  {(trip.dieselPaid || 0) > 0 && <span className="text-[10px] text-emerald-500 block font-bold mt-0.5">-{trip.dieselPaid} Paid</span>}
                </div>
              </div>
            ) : null}
            {trip.commission ? (
              <div className="flex justify-between items-start text-sm">
                <span className="text-text-muted font-medium mt-1">Commission</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-text-main">{((trip.commission || 0) - (trip.commissionPaid || 0)).toFixed(2)}</span>
                  {(trip.commissionPaid || 0) > 0 && <span className="text-[10px] text-emerald-500 block font-bold mt-0.5">-{trip.commissionPaid} Paid</span>}
                </div>
              </div>
            ) : null}
            {trip.friday ? (
              <div className="flex justify-between items-start text-sm">
                <span className="text-text-muted font-medium mt-1">Friday Allowance</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-text-main">{((trip.friday || 0) - (trip.fridayPaid || 0)).toFixed(2)}</span>
                  {(trip.fridayPaid || 0) > 0 && <span className="text-[10px] text-emerald-500 block font-bold mt-0.5">-{trip.fridayPaid} Paid</span>}
                </div>
              </div>
            ) : null}
            {trip.bonus ? (
              <div className="flex justify-between items-start text-sm">
                <span className="text-text-muted font-medium mt-1">Bonus</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-text-main">{((trip.bonus || 0) - (trip.bonusPaid || 0)).toFixed(2)}</span>
                  {(trip.bonusPaid || 0) > 0 && <span className="text-[10px] text-emerald-500 block font-bold mt-0.5">-{trip.bonusPaid} Paid</span>}
                </div>
              </div>
            ) : null}
            {trip.overtime ? (
              <div className="flex justify-between items-start text-sm">
                <span className="text-text-muted font-medium mt-1">Overtime</span>
                <div className="text-right">
                  <span className="font-mono font-bold text-text-main">{((trip.overtime || 0) - (trip.overtimePaid || 0)).toFixed(2)}</span>
                  {(trip.overtimePaid || 0) > 0 && <span className="text-[10px] text-emerald-500 block font-bold mt-0.5">-{trip.overtimePaid} Paid</span>}
                </div>
              </div>
            ) : null}
            {trip.extraDiesel ? (
              <div className="flex justify-between items-start text-sm text-amber-500">
                <div className="flex flex-col text-left">
                  <span className="font-bold text-xs uppercase tracking-widest text-amber-500">
                    {language === 'bn' ? 'এক্সট্রা ডিজেল' : 'Extra Diesel'}
                  </span>
                  <span className="text-sm font-semibold text-text-main mt-0.5">
                    {trip.extraDieselReason || 'Other'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold">{((trip.extraDiesel || 0) - (trip.extraDieselPaid || 0)).toFixed(2)}</span>
                  {(trip.extraDieselPaid || 0) > 0 && <span className="text-[10px] text-emerald-500 block font-bold mt-0.5">-{trip.extraDieselPaid} Paid</span>}
                </div>
              </div>
            ) : null}
          </div>
          
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-widest text-gray-500">Total Amount</span>
              <span className="font-mono font-black text-lg text-text-main">{(trip.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-xs uppercase tracking-widest text-emerald-500">Paid Amount</span>
              <span className="font-mono font-black text-emerald-500">{(trip.paidAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-white/10 mt-2">
              <span className="font-black text-xs uppercase tracking-widest text-rose-500">Remaining</span>
              <span className="font-mono font-black text-rose-500">{((trip.totalAmount || 0) - (trip.paidAmount || 0)).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Diesel Receipt Card */}
        {!!(trip.generatorReceiveNumber || (trip.generatorDiesel && Number(trip.generatorDiesel) > 0) || trip.dieselReceiptDate) && (
          <div 
            
            
            
            className="bg-theme-card p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5"
          >
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-white/5">
              <Fuel size={18} className="text-cyan-500" />
              <h3 className="font-black text-xs uppercase tracking-widest text-text-main">
                {language === 'bn' ? 'ডিজেল রিসিট' : 'Diesel Receipt'}
              </h3>
            </div>

            <div className="space-y-4">
              {/* Row 1: Diesel Type & Receipt Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#E6E6E6] dark:bg-white/5 p-3 rounded-xl border border-gray-200/50 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'ডিজেল টাইপ' : 'Diesel Type'}
                  </p>
                  <p className="text-xs font-black text-text-main uppercase">
                    {trip.dieselReceiptType === 'truck'
                      ? (language === 'bn' ? 'ট্রাক ডিজেল' : 'Truck Diesel')
                      : trip.dieselReceiptType === 'light_vehicle'
                        ? (language === 'bn' ? 'লাইট ভেহিকেল ডিজেল' : 'Light vehicle Diesel')
                        : (trip.dieselReceiptType === 'generator' || trip.generatorDiesel > 0
                          ? (language === 'bn' ? 'জেনারেটর ডিজেল' : 'Generator Diesel')
                          : '-')}
                  </p>
                </div>
                <div className="bg-[#E6E6E6] dark:bg-white/5 p-3 rounded-xl border border-gray-200/50 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'রিসিট নম্বর' : 'Receipt Number'}
                  </p>
                  <p className="text-xs font-black text-text-main font-mono">
                    {trip.generatorReceiveNumber || '-'}
                  </p>
                </div>
              </div>

              {/* Row 2: Transaction Date & Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#E6E6E6] dark:bg-white/5 p-3 rounded-xl border border-gray-200/50 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'ট্রানজেকশন ডেট' : 'Transaction Date'}
                  </p>
                  <p className="text-xs font-black text-text-main">
                    {trip.dieselReceiptDate || '-'}
                  </p>
                </div>
                <div className="bg-[#E6E6E6] dark:bg-white/5 p-3 rounded-xl border border-gray-200/50 dark:border-white/5">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {language === 'bn' ? 'টাকা (Amount)' : 'Amount'}
                  </p>
                  <p className="text-sm font-black text-[#117651] dark:text-emerald-400 font-mono">
                    {trip.generatorDiesel ? `${currency.code} ${trip.generatorDiesel.toLocaleString()}` : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetails;
