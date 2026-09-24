import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { FileOpener } from '@capacitor-community/file-opener';

import { useStore } from '../store';
import { ChevronLeft, Truck, MapPin, Calendar, User, Receipt, DollarSign, Clock, Hash, Package, Fuel, Eye, Trash2, X, Camera, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { compressDocumentImage } from '../utils/imageUtils';

const TripDetails: React.FC = () => {
  const { selectedTrip, goBack, language, users, appThemeMode, isEyeComfort, currencies, selectedCurrency, updateTrip, showFeedback } = useStore();
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [modalType, setModalType] = useState<'receipt' | 'delivery_note'>('receipt');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in e && e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      pinchStartDistanceRef.current = dist;
      pinchStartZoomRef.current = zoom;
      setIsDragging(false);
      return;
    }

    if (zoom <= 1) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ('touches' in e && e.touches.length === 2) {
      if (pinchStartDistanceRef.current !== null) {
        const currentDist = getTouchDistance(e.touches);
        if (currentDist > 0) {
          const scale = currentDist / pinchStartDistanceRef.current;
          const targetZoom = Math.min(Math.max(pinchStartZoomRef.current * scale, 1), 4);
          setZoom(targetZoom);
        }
      }
      return;
    }

    if (!isDragging || zoom <= 1) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPan({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    pinchStartDistanceRef.current = null;
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDownloadReceipt = async () => {
    if (!trip) return;
    const isReceipt = modalType === 'receipt';
    const targetImg = isReceipt ? trip.receiptImage : trip.deliveryNoteImage;
    if (!targetImg) return;

    const base64Data = targetImg.includes(',') 
      ? targetImg.split(',')[1] 
      : targetImg;

    const prefix = isReceipt ? 'receipt' : 'delivery_note';
    const fileName = `${prefix}_trip_${trip.id || 'unknown'}_${Date.now()}.jpg`;

    if (Capacitor.isNativePlatform()) {
      try {
        // Try writing to Cache first (doesn't require permissions on Android)
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });

        showFeedback?.(
          language === 'bn' ? 'ডাউনলোড সফল হয়েছে!' : 'Download successful!',
          'success'
        );

        // Try opening the image file
        try {
          await FileOpener.open({
            filePath: writeResult.uri,
            contentType: 'image/jpeg',
            openWithDefault: false
          });
        } catch (openErr) {
          // If file-opener fails, try to share it
          try {
            await Share.share({
              title: fileName,
              url: writeResult.uri,
              dialogTitle: language === 'bn' ? (isReceipt ? 'রসিদটি সেভ বা শেয়ার করুন' : 'ডেলিভারি নোটটি সেভ বা শেয়ার করুন') : (isReceipt ? 'Save or Share Receipt' : 'Save or Share Delivery Note')
            });
          } catch (shareErr) {
            console.error('Sharing failed:', shareErr);
          }
        }
      } catch (err: any) {
        console.error('Error saving image to Cache:', err);
        // Fallback to Documents directory
        try {
          const writeResult = await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents
          });

          showFeedback?.(
            language === 'bn' ? 'ডাউনলোড সফল হয়েছে! ডকুমেন্টস ফোল্ডারে সেভ করা হয়েছে।' : 'Download successful! Saved to Documents.',
            'success'
          );

          try {
            await FileOpener.open({
              filePath: writeResult.uri,
              contentType: 'image/jpeg',
              openWithDefault: false
            });
          } catch (openErr2) {
            try {
              await Share.share({
                title: fileName,
                url: writeResult.uri,
                dialogTitle: language === 'bn' ? (isReceipt ? 'রসিদটি সেভ বা শেয়ার করুন' : 'ডেলিভারি নোটটি সেভ বা শেয়ার করুন') : (isReceipt ? 'Save or Share Receipt' : 'Save or Share Delivery Note')
              });
            } catch (shareErr2) {
              console.error('Sharing fallback failed:', shareErr2);
            }
          }
        } catch (docErr) {
          console.error('Error saving image to Documents:', docErr);
          showFeedback?.(
            language === 'bn' ? 'ডাউনলোড ব্যর্থ হয়েছে। অনুগ্রহ করে পারমিশন চেক করুন।' : 'Download failed. Please check permissions.',
            'error'
          );
        }
      }
    } else {
      // Browser fallback
      const link = document.createElement('a');
      link.href = targetImg;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showFeedback?.(
        language === 'bn' ? 'ডাউনলোড সফল হয়েছে!' : 'Download successful!',
        'success'
      );
    }
  };

  const currency = currencies?.find(c => c.code === selectedCurrency) || { symbol: '$', code: 'USD', name: 'US Dollar' };
  const t = TRANSLATIONS[language];
  const trip = selectedTrip;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !trip) return;

    setIsUploading(true);
    try {
      const rawBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const compressedBase64 = await compressDocumentImage(rawBase64, 1100, 0.55);

      const updated = { 
        ...trip, 
        [modalType === 'receipt' ? 'receiptImage' : 'deliveryNoteImage']: compressedBase64 
      };
      updateTrip(updated);
    } catch (err) {
      console.error('Error compressing and saving image', err);
    } finally {
      setIsUploading(false);
    }
  };

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
              {trip.deliveryNoteImage ? (
                <button
                  onClick={() => {
                    setModalType('delivery_note');
                    setShowReceiptModal(true);
                  }}
                  className="mt-3 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm w-fit cursor-pointer active:scale-95"
                >
                  <Eye size={12} />
                  <span>{language === 'bn' ? 'ডেলিভারি নোট দেখুন' : 'View Delivery Note'}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setModalType('delivery_note');
                    fileInputRef.current?.click();
                  }}
                  className="mt-3 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-main font-bold text-[10px] uppercase rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm border border-gray-200/50 dark:border-white/5 w-fit cursor-pointer active:scale-95"
                >
                  <Camera size={12} />
                  <span>{language === 'bn' ? 'ডেলিভারি নোট যুক্ত করুন' : 'Add Delivery Note'}</span>
                </button>
              )}
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

              {/* View Receipt Option */}
              {trip.receiptImage && (
                <button
                  onClick={() => {
                    setModalType('receipt');
                    setShowReceiptModal(true);
                  }}
                  className="w-full mt-2 py-2.5 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Eye size={14} />
                  <span>{language === 'bn' ? 'রসিদ দেখুন' : 'View Receipt'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input for Uploading Receipt */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Receipt / Delivery Note View Modal */}
      {showReceiptModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => { setShowReceiptModal(false); resetZoom(); }}>
          <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
              <div className="text-left">
                <span className="text-[10px] font-black uppercase text-cyan-500 tracking-wider">
                  {modalType === 'receipt' 
                    ? (language === 'bn' ? 'সংরক্ষিত রসিদ' : 'Stored Receipt') 
                    : (language === 'bn' ? 'সংরক্ষিত ডেলিভারি নোট' : 'Stored Delivery Note')}
                </span>
                <h3 className="text-sm font-black text-text-main truncate mt-0.5">
                  {modalType === 'receipt' 
                    ? (trip.generatorReceiveNumber ? `${language === 'bn' ? 'রিসিট নম্বর' : 'Receipt No'}: ${trip.generatorReceiveNumber}` : (language === 'bn' ? 'রসিদ ছবি' : 'Receipt Image'))
                    : (language === 'bn' ? 'ডেলিভারি নোট ছবি' : 'Delivery Note Image')}
                </h3>
              </div>
              <button 
                onClick={() => { setShowReceiptModal(false); resetZoom(); }}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-text-muted hover:text-text-main"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-hidden flex-1 flex flex-col items-center justify-center bg-gray-900/10 min-h-[350px] relative select-none">
              {(modalType === 'receipt' ? trip.receiptImage : trip.deliveryNoteImage) ? (
                <>
                  {/* Zoom Controls Overlay */}
                  <div className="absolute top-4 right-4 z-50 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm p-1.5 rounded-xl border border-white/10 shadow-lg">
                    <button
                      type="button"
                      onClick={() => setZoom(prev => Math.min(prev + 0.25, 4))}
                      title="Zoom In"
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all active:scale-95"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <span className="text-[10px] font-mono font-bold text-white px-1">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(prev => {
                          const next = Math.max(prev - 0.25, 1);
                          if (next === 1) setPan({ x: 0, y: 0 });
                          return next;
                        });
                      }}
                      title="Zoom Out"
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all active:scale-95"
                    >
                      <ZoomOut size={16} />
                    </button>
                    {zoom > 1 && (
                      <button
                        type="button"
                        onClick={resetZoom}
                        title="Reset"
                        className="p-1.5 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white transition-all active:scale-95"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>

                  {/* Zoomable Image Wrapper */}
                  <div 
                    className="w-full h-full min-h-[250px] max-h-[50vh] overflow-hidden flex items-center justify-center cursor-move rounded-lg"
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchEnd={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <div
                      style={{
                        transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                        transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                        transformOrigin: 'center center'
                      }}
                      className="flex items-center justify-center max-w-full max-h-full"
                    >
                      <img 
                        src={modalType === 'receipt' ? trip.receiptImage : trip.deliveryNoteImage} 
                        alt={modalType === 'receipt' ? 'Receipt' : 'Delivery Note'} 
                        className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-md pointer-events-none"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  
                  {/* Hint helper */}
                  <p className="text-[10px] text-text-muted mt-3">
                    {language === 'bn' 
                      ? 'জুম করতে + / - ব্যবহার করুন এবং ড্র্যাগ করে নড়াচড়া করুন' 
                      : 'Use + / - to zoom and drag to pan'}
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center text-center p-6 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-2xl bg-white/5 w-full">
                  <Camera size={48} className="text-gray-400 dark:text-zinc-600 mb-3" />
                  <p className="text-xs font-bold text-text-main mb-1">
                    {modalType === 'receipt' 
                      ? (language === 'bn' ? 'কোনো রসিদ আপলোড করা হয়নি' : 'No Receipt Uploaded')
                      : (language === 'bn' ? 'কোনো ডেলিভারি নোট আপলোড করা হয়নি' : 'No Delivery Note Uploaded')}
                  </p>
                  <p className="text-[10px] text-text-muted mb-4 max-w-[240px]">
                    {modalType === 'receipt'
                      ? (language === 'bn' ? 'এই ট্রিপের জন্য কোনো রসিদ সংযুক্ত নেই। নিচে ক্লিক করে আপলোড করুন।' : 'There is no receipt attached to this trip yet. Click below to upload.')
                      : (language === 'bn' ? 'এই ট্রিপের জন্য কোনো ডেলিভারি নোট সংযুক্ত নেই। নিচে ক্লিক করে আপলোড করুন।' : 'There is no delivery note attached to this trip yet. Click below to upload.')}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="py-2 px-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Camera size={12} />
                    <span>{isUploading ? (language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...') : (modalType === 'receipt' ? (language === 'bn' ? 'রসিদ আপলোড করুন' : 'Upload Receipt') : (language === 'bn' ? 'ডেলিভারি নোট আপলোড করুন' : 'Upload Delivery Note'))}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex gap-3">
              {(modalType === 'receipt' ? trip.receiptImage : trip.deliveryNoteImage) ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const deleteMsg = modalType === 'receipt'
                        ? (language === 'bn' ? 'আপনি কি রসিদটি ডিলিট করতে চান?' : 'Are you sure you want to delete this receipt?')
                        : (language === 'bn' ? 'আপনি কি ডেলিভারি নোটটি ডিলিট করতে চান?' : 'Are you sure you want to delete this delivery note?');
                      if (confirm(deleteMsg)) {
                        const updated = { 
                          ...trip, 
                          [modalType === 'receipt' ? 'receiptImage' : 'deliveryNoteImage']: '' 
                        };
                        updateTrip(updated);
                        setShowReceiptModal(false);
                      }
                    }}
                    className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>{language === 'bn' ? 'ডিলিট করুন' : 'Delete'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadReceipt}
                    className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => { setShowReceiptModal(false); resetZoom(); }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-text-main text-xs font-black uppercase rounded-xl transition-all cursor-pointer"
                >
                  {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TripDetails;
