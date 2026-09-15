import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';
import { TRANSLATIONS, THEMES } from '@/constants';
import { Currency, Trip, Payment } from '@/types';
import { Truck, MapPin, Calendar, Clock, Building, FileText, Package, Hash, DollarSign, Fuel, Briefcase, Power, ToggleLeft, ToggleRight, Check, X, Search, ChevronDown, Scan, Camera, Image, AlertTriangle, Layers, Activity, Gift } from 'lucide-react';

import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import InputField, { InputFieldThemeContext } from '@/components/InputField';
import { getApiUrl } from '@/utils/apiUrl';
import { scanAndDetectCountry } from '@/utils/countryUtils';
import { Capacitor, CapacitorHttp } from '@capacitor/core';

import FormWindow from '@/components/FormWindow';

const NewTrip: React.FC = () => {
  const { 
    language, addTrip, setView, setActiveSection, addPayment, user,
    locations, countries, companies, containerTypes, loadingTypes, extraDieselReasons, emptyReturnYards,
    currentFile, monthlyFiles, setCurrentFile, addMonthlyFile, trips,
    currencies, selectedCurrency, showFeedback,
    editingTrip, setEditingTrip, updateTrip,
    wallpaper, backgroundColor, theme,
    isNightMode, appThemeMode, goBack,
    isDarkMode: storeIsDarkMode,
    addCompany, addLocation, addCountry, addLoadingType, addContainerType, addEmptyReturnYard, addExtraDieselReason
  } = useStore();
  
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';
  
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];
  const isWhiteMode = appThemeMode === 'light';
  
  const appBgStyle = {
    background: isWhiteMode 
      ? (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor || 'var(--app-bg)'))
      : (wallpaper ? `url(${wallpaper}) center/cover no-repeat` : (backgroundColor ? backgroundColor : 'var(--card-bg)')),
    backdropFilter: isWhiteMode ? 'none' : 'blur(16px)',
    WebkitBackdropFilter: isWhiteMode ? 'none' : 'blur(16px)'
  } as React.CSSProperties;
  const t = TRANSLATIONS[language];
  const currency: Currency = currencies.find(c => c.code === selectedCurrency) || { symbol: '$', code: 'USD', name: 'US Dollar' };

  const [showFileSelectModal, setShowFileSelectModal] = useState(!currentFile);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentFile) {
      setShowFileSelectModal(true);
    }
  }, [currentFile]);

  const [formData, setFormData] = useState({
    fromCountry: '',
    arrivalCountry: '',
    loadingDate: '',
    loadingTime: '',
    loadingPlace: '',
    deliveryPlace: '',
    deliveryDate: '',
    deliveryTime: '',
    companyName: '',
    bayanNumber: '',
    lodgingType: '', // This will be used for "Loading Type"
    containerTitle: '',
    containerNumber: '',
    invoiceNumber: '',
    tariffStatus: 'Incomplete',
    emptyReturnYard: '',
    vehicleNumber: '',
    trailerNumber: '',
    dieselPrice: '',
    generatorDiesel: '',
    generatorReceiveNumber: '',
    dieselReceiptDate: '',
    dieselReceiptType: 'generator',
    pumpName: '',
    extraDiesel: '',
    extraDieselReason: '',
    commission: '',
    friday: '',
    bonus: '',
    overtime: '',
  });

  const loadedTripIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (editingTrip) {
      setHasEnteredForm(true);
      if (loadedTripIdRef.current === editingTrip.id) {
        return;
      }
      loadedTripIdRef.current = editingTrip.id;
      setFormData({
        fromCountry: editingTrip.fromCountry || '',
        arrivalCountry: editingTrip.arrivalCountry || '',
        loadingDate: editingTrip.loadingDate || '',
        loadingTime: editingTrip.loadingTime || '',
        loadingPlace: editingTrip.loadingPlace || '',
        deliveryPlace: editingTrip.deliveryPlace || '',
        deliveryDate: editingTrip.deliveryDate || '',
        deliveryTime: editingTrip.deliveryTime || '',
        companyName: editingTrip.companyName || '',
        bayanNumber: editingTrip.bayanNumber || '',
        lodgingType: editingTrip.loadingType || '',
        containerTitle: editingTrip.containerTitle || '',
        containerNumber: editingTrip.containerNumber || '',
        invoiceNumber: editingTrip.invoiceNumber || '',
        tariffStatus: (editingTrip.tariffStatus && (editingTrip.tariffStatus.toLowerCase() === 'complete' || editingTrip.tariffStatus.toLowerCase() === 'completed')) ? 'Complete' : 'Incomplete',
        emptyReturnYard: editingTrip.emptyReturnYard || '',
        vehicleNumber: editingTrip.vehicleNumber || '',
        trailerNumber: editingTrip.trailerNumber || '',
        dieselPrice: (editingTrip.dieselPrice && Number(editingTrip.dieselPrice) !== 0) ? editingTrip.dieselPrice.toString() : '',
        generatorDiesel: (editingTrip.generatorDiesel && Number(editingTrip.generatorDiesel) !== 0) ? editingTrip.generatorDiesel.toString() : '',
        generatorReceiveNumber: editingTrip.generatorReceiveNumber || '',
        dieselReceiptDate: editingTrip.dieselReceiptDate || '',
        dieselReceiptType: (editingTrip as any).dieselReceiptType || 'generator',
        pumpName: (editingTrip as any).pumpName || '',
        extraDiesel: (editingTrip.extraDiesel && Number(editingTrip.extraDiesel) !== 0) ? editingTrip.extraDiesel.toString() : '',
        extraDieselReason: editingTrip.extraDieselReason || '',
        commission: (editingTrip.commission && Number(editingTrip.commission) !== 0) ? editingTrip.commission.toString() : '',
        friday: (editingTrip.friday && Number(editingTrip.friday) !== 0) ? editingTrip.friday.toString() : '',
        bonus: (editingTrip.bonus && Number(editingTrip.bonus) !== 0) ? editingTrip.bonus.toString() : '',
        overtime: (editingTrip.overtime && Number(editingTrip.overtime) !== 0) ? editingTrip.overtime.toString() : '',
      });
      if (editingTrip.generatorDiesel || editingTrip.generatorReceiveNumber || editingTrip.dieselReceiptDate) setShowGenerator(true);
      if (editingTrip.generatorReceiveNumber) setHasGeneratorReceipt(true);
      if (editingTrip.extraDiesel) setShowExtraDiesel(true);
      if (editingTrip.friday) setShowFriday(true);
      if (editingTrip.bonus) setShowBonus(true);
      if (editingTrip.overtime) setShowOvertime(true);
      if (editingTrip.generatorDiesel || editingTrip.extraDiesel || editingTrip.friday || editingTrip.bonus || editingTrip.overtime) setShowOptionalFields(true);
    } else {
      loadedTripIdRef.current = null;
    }
  }, [editingTrip]);

  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [hasGeneratorReceipt, setHasGeneratorReceipt] = useState(false);
  const [showExtraDiesel, setShowExtraDiesel] = useState(false);
  const [showFriday, setShowFriday] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [showOvertime, setShowOvertime] = useState(false);

  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    field: string;
    label: string;
    options: any[];
  }>({ isOpen: false, field: '', label: '', options: [] });

  const [isScanning, setIsScanning] = useState(false);
  const [showScanOptions, setShowScanOptions] = useState(false);
  const [scannedImagePreview, setScannedImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [scanErrorMsg, setScanErrorMsg] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [hasEnteredForm, setHasEnteredForm] = useState(!editingTrip ? false : true);
  const [showScanPromptModal, setShowScanPromptModal] = useState(false);
  const hasShownPrompt = useRef(!!editingTrip);

  useEffect(() => {
    if (!editingTrip && currentFile && !showFileSelectModal && !hasShownPrompt.current) {
      setShowScanPromptModal(true);
      hasShownPrompt.current = true;
    }
  }, [currentFile, showFileSelectModal, editingTrip]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const isPickingFileRef = useRef(false);
  const fileSelectedRef = useRef(false);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (isPickingFileRef.current) {
        // Short delay for onChange to fire if user selected a file
        setTimeout(() => {
          if (isPickingFileRef.current && !fileSelectedRef.current) {
            isPickingFileRef.current = false;
            setView('DASHBOARD');
          }
        }, 150);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [setView]);

  const handleOcrResult = (data: any) => {
    if (!data) return;
    console.log('Received OCR data to process:', data);

    // Normalize keys from the returned object to ignore case and spacing
    const getNormalizedVal = (keys: string[]): string => {
      for (const k of keys) {
        // Direct match
        if (data[k] !== undefined && data[k] !== null && data[k] !== '') {
          return String(data[k]).trim();
        }
        // Match case-insensitive
        const lowerK = k.toLowerCase();
        for (const actualKey of Object.keys(data)) {
          if (actualKey.toLowerCase() === lowerK && data[actualKey] !== undefined && data[actualKey] !== null && data[actualKey] !== '') {
            return String(data[actualKey]).trim();
          }
        }
      }
      return '';
    };

    const invoiceNumber = getNormalizedVal(['invoiceNumber', 'invoice', 'invoiceNo', 'no', 'No.']);
    const companyName = getNormalizedVal(['companyName', 'company', 'compName']);
    const bayanNumber = getNormalizedVal(['bayanNumber', 'bayan', 'docNo', 'docDocNo', 'bayanNo']);
    const truckNumber = getNormalizedVal(['truckNumber', 'vehicleNumber', 'truckNo', 'vehicleNo', 'truck', 'vehicle']);
    const containerNumber = getNormalizedVal(['containerNumber', 'container', 'containerNo']);
    const loadingPlace = getNormalizedVal(['loadingPlace', 'from', 'loading']);
    const deliveryPlace = getNormalizedVal(['deliveryPlace', 'to', 'delivery']);
    const loadingDate = getNormalizedVal(['loadingDate', 'portEnterDate', 'date', 'loadDate']);
    const loadingTime = getNormalizedVal(['loadingTime', 'portEnterTime', 'time', 'loadTime']);
    const deliveryDate = getNormalizedVal(['deliveryDate', 'trailerExitDate', 'exitDate', 'deliveryDateVal']);
    const deliveryTime = getNormalizedVal(['deliveryTime', 'trailerExitTime', 'exitTime', 'deliveryTimeVal']);

    const targetFromCountry = data.fromCountry || formData.fromCountry || (countries && countries[0]?.name) || 'Qatar';
    const targetArrivalCountry = data.arrivalCountry || formData.arrivalCountry || (countries && countries[0]?.name) || 'Qatar';

    // 1. Auto-add Company Name if not exists
    if (companyName && companyName !== "") {
      const trimmedCompany = companyName;
      const isCompanyExist = companies.some(c => c.toLowerCase() === trimmedCompany.toLowerCase());
      if (!isCompanyExist) {
        addCompany(trimmedCompany.toUpperCase());
        showFeedback(isBangla 
          ? `নতুন কোম্পানি "${trimmedCompany.toUpperCase()}" অটোমেটিক যুক্ত করা হয়েছে!` 
          : `New company "${trimmedCompany.toUpperCase()}" auto-added to database!`
        );
      }
    }

    // 2. Auto-add Delivery Place if not exists
    if (deliveryPlace && deliveryPlace !== "") {
      const trimmedDelivery = deliveryPlace;
      const isDeliveryExist = locations.some(l => 
        l.name.toLowerCase() === trimmedDelivery.toLowerCase() && 
        l.country.toLowerCase() === targetArrivalCountry.toLowerCase()
      );
      if (!isDeliveryExist) {
        addLocation({ country: targetArrivalCountry, name: trimmedDelivery });
        showFeedback(isBangla 
          ? `নতুন ডেলিভারি স্থান "${trimmedDelivery}" (${targetArrivalCountry}) অটোমেটিক যুক্ত করা হয়েছে!` 
          : `New delivery place "${trimmedDelivery}" (${targetArrivalCountry}) auto-added to database!`
        );
      }
    }

    // 3. Auto-add Loading Place if not exists
    if (loadingPlace && loadingPlace !== "") {
      const trimmedLoading = loadingPlace;
      const isLoadingExist = locations.some(l => 
        l.name.toLowerCase() === trimmedLoading.toLowerCase() && 
        l.country.toLowerCase() === targetFromCountry.toLowerCase()
      );
      if (!isLoadingExist) {
        addLocation({ country: targetFromCountry, name: trimmedLoading });
        showFeedback(isBangla 
          ? `নতুন লোডিং স্থান "${trimmedLoading}" (${targetFromCountry}) অটোমেটিক যুক্ত করা হয়েছে!` 
          : `New loading place "${trimmedLoading}" (${targetFromCountry}) auto-added to database!`
        );
      }
    }

    setFormData(prev => {
      const nextData = { ...prev };
      if (invoiceNumber) nextData.invoiceNumber = invoiceNumber;
      if (companyName) nextData.companyName = companyName;
      if (bayanNumber) nextData.bayanNumber = bayanNumber;
      if (truckNumber) nextData.vehicleNumber = truckNumber;
      if (containerNumber) nextData.containerNumber = containerNumber;
      if (loadingPlace) nextData.loadingPlace = loadingPlace;
      if (deliveryPlace) nextData.deliveryPlace = deliveryPlace;
      if (loadingDate) nextData.loadingDate = loadingDate;
      if (loadingTime) nextData.loadingTime = loadingTime;
      if (deliveryDate) nextData.deliveryDate = deliveryDate;
      if (deliveryTime) nextData.deliveryTime = deliveryTime;
      return nextData;
    });
  };

  const isBangla = language === 'bn';

  const handleScanFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      if (isPickingFileRef.current && !fileSelectedRef.current) {
        isPickingFileRef.current = false;
        setView('DASHBOARD');
      }
      return;
    }

    fileSelectedRef.current = true;
    isPickingFileRef.current = false;
    setIsScanning(true);
    setExtractedData(null);

    try {
      const rawBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Compress Image to reduce payload size
      const compressedBase64 = await new Promise<string>((resolve) => {
        const img = document.createElement('img');
        img.src = rawBase64;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_SIZE = 1200;
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6)); // 60% quality jpeg
          } else {
            resolve(rawBase64);
          }
        };
        img.onerror = () => resolve(rawBase64); // Fallback to raw on error
      });

      // Show preview image during scanning
      setScannedImagePreview(compressedBase64);

      const targetUrl = getApiUrl('/api/ocr');
      console.log('Initiating OCR scan request to endpoint:', targetUrl);

      let responseText: string;
      let ok: boolean;
      let status: number;

      if (Capacitor.isNativePlatform()) {
         try {
           const options = {
             url: targetUrl,
             headers: { 'Content-Type': 'application/json' },
             data: { image: compressedBase64 },
             connectTimeout: 120000,
             readTimeout: 120000 
           };
           const response = await CapacitorHttp.post(options);
           responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
           status = response.status;
           ok = status >= 200 && status < 300;
         } catch (capError: any) {
           console.warn('CapacitorHttp plugin failed or threw. Falling back to standard browser fetch:', capError);
           
           const controller = new AbortController();
           const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

           const response = await fetch(targetUrl, {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify({ image: compressedBase64 }),
             signal: controller.signal
           });
           
           clearTimeout(timeoutId);
           responseText = await response.text();
           status = response.status;
           ok = response.ok;
         }
      } else {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: compressedBase64 }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        responseText = await response.text();
        status = response.status;
        ok = response.ok;
      }

      if (!ok) {
        let errorMsg = '';
        try {
          const errData = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
          if (errData && errData.error) {
            errorMsg = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error, null, 2);
          } else if (errData && errData.message) {
            errorMsg = errData.message;
          } else {
            errorMsg = typeof errData === 'object' ? JSON.stringify(errData, null, 2) : String(errData);
          }
        } catch {
          errorMsg = typeof responseText === 'string' ? responseText : `Server HTTP Status: ${status}`;
        }
        throw new Error(errorMsg || `Server returned HTTP ${status}`);
      }

      let data;
      try {
        data = typeof responseText === 'string' ? JSON.parse(responseText) : responseText;
      } catch (parseError: any) {
        console.error('JSON Parse Error. Server raw response began with:', typeof responseText === 'string' ? responseText.substring(0, 300) : responseText);
        if (typeof responseText === 'string' && responseText.toLowerCase().includes('<!doctype html>')) {
           throw new Error('সার্ভার কানেকশন ব্লকড! এটি AI Studio এর ডিফল্ট প্রিভিউ সার্ভার, যা এপিকে-তে কাজ করে না। অনুগ্রহ করে সেটিংস (Settings) থেকে আপনার নিজের ক্লাউড সার্ভারের "API Base URL" সেট করুন।');
        }
        throw new Error(`Data format error (Not valid JSON). Server returned: ${typeof responseText === 'string' ? responseText.substring(0, 120) : 'Object'}...`);
      }

      // Normalize before presenting to the user so the fields represent clean human-readable text
      const getNormalizedVal = (keys: string[]): string => {
        for (const k of keys) {
          if (data[k] !== undefined && data[k] !== null && data[k] !== '') {
            return String(data[k]).trim();
          }
          const lowerK = k.toLowerCase();
          for (const actualKey of Object.keys(data)) {
            if (actualKey.toLowerCase() === lowerK && data[actualKey] !== undefined && data[actualKey] !== null && data[actualKey] !== '') {
              return String(data[actualKey]).trim();
            }
          }
        }
        return '';
      };

      const normalizedData = {
        invoiceNumber: getNormalizedVal(['invoiceNumber', 'invoice', 'invoiceNo', 'no', 'No.']),
        companyName: getNormalizedVal(['companyName', 'company', 'compName']),
        bayanNumber: getNormalizedVal(['bayanNumber', 'bayan', 'docNo', 'docDocNo', 'bayanNo']),
        truckNumber: getNormalizedVal(['truckNumber', 'vehicleNumber', 'truckNo', 'vehicleNo', 'truck', 'vehicle']),
        containerNumber: getNormalizedVal(['containerNumber', 'container', 'containerNo']),
        loadingPlace: getNormalizedVal(['loadingPlace', 'from', 'loading']),
        deliveryPlace: getNormalizedVal(['deliveryPlace', 'to', 'delivery']),
        loadingDate: getNormalizedVal(['loadingDate', 'portEnterDate', 'date', 'loadDate']),
        loadingTime: getNormalizedVal(['loadingTime', 'portEnterTime', 'time', 'loadTime']),
        deliveryDate: getNormalizedVal(['deliveryDate', 'trailerExitDate', 'exitDate', 'deliveryDateVal']),
        deliveryTime: getNormalizedVal(['deliveryTime', 'trailerExitTime', 'exitTime', 'deliveryTimeVal']),
      };

      setExtractedData(normalizedData);
      setScannedImagePreview(null);
      setShowScanPromptModal(false);
      showFeedback(isBangla ? 'ডকুমেন্ট স্ক্যান সম্পন্ন হয়েছে! অনুগ্রহ করে যাচাই করুন।' : 'Document scan completed! Please review and verify.');
    } catch (err: any) {
      console.error('Scan Error detailed dump:', err);
      setScannedImagePreview(null);
      setShowScanPromptModal(false); 

      // Show original server feedback directly without custom messages
      const serverFeedback = err?.message || (typeof err === 'object' ? JSON.stringify(err, null, 2) : String(err));
      setScanErrorMsg(serverFeedback);
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  const renderScanningFeatures = () => (
    <>
      {/* Hidden Inputs */}
      <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        ref={cameraInputRef}
        onChange={handleScanFileChange}
        onCancel={() => {
          if (isPickingFileRef.current && !fileSelectedRef.current) {
            isPickingFileRef.current = false;
            setView('DASHBOARD');
          }
        }}
        className="hidden" 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={galleryInputRef}
        onChange={handleScanFileChange}
        onCancel={() => {
          if (isPickingFileRef.current && !fileSelectedRef.current) {
            isPickingFileRef.current = false;
            setView('DASHBOARD');
          }
        }}
        className="hidden" 
      />

      {/* Camera / Gallery Selection iOS Style Bottom Sheet */}
      {createPortal(
        <AnimatePresence>
          {showScanOptions && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={() => {
                  setShowScanOptions(false);
                  setShowScanPromptModal(true);
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] pointer-events-auto"
              />
              {/* Bottom Sheet */}
              <motion.div
                initial={isDesktop ? { opacity: 0, scale: 0.95, x: '-50%', y: '-40%' } : { y: '100%' }}
                animate={isDesktop ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' } : { y: 0 }}
                exit={isDesktop ? { opacity: 0, scale: 0.95, x: '-50%', y: '-40%' } : { y: '100%' }}
                transition={isDesktop 
                  ? { type: 'spring', damping: 25, stiffness: 280 }
                  : { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.28 }
                }
                className={`fixed ${isDesktop ? 'top-1/2 left-1/2 w-full max-w-md rounded-2xl' : 'left-0 right-0 bottom-0 max-w-md mx-auto rounded-t-[2rem]'} bg-slate-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 z-[10000] shadow-2xl overflow-hidden pointer-events-auto`}
                style={{
                  paddingBottom: isDesktop ? '1.5rem' : 'calc(env(safe-area-inset-bottom, 16px) + 1.25rem)'
                }}
              >
                {/* iOS Drag Handle */}
                {!isDesktop && <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-800 rounded-full mx-auto mt-4 mb-2" />}
                {isDesktop && <div className="h-4" />}

                <div className="px-6 pb-2">
                  <h4 className="text-center text-sm font-extrabold text-gray-800 dark:text-gray-100 mb-1">
                    {isBangla ? 'ছবি তোলার মাধ্যম' : 'Scan Document'}
                  </h4>
                  <p className="text-center text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-6">
                    {isBangla ? 'পছন্দসই ছবি তোলার মাধ্যম নির্বাচন করুন' : 'Choose your scan source option'}
                  </p>

                  {/* Side-by-side Layout */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        isPickingFileRef.current = true;
                        fileSelectedRef.current = false;
                        setShowScanOptions(false);
                        setShowScanPromptModal(false);
                        if (cameraInputRef.current) {
                          cameraInputRef.current.value = '';
                          cameraInputRef.current.click();
                        }
                      }}
                      className="relative flex flex-col items-center justify-center p-[2px] rounded-[8px] transition-all active:scale-95 shadow-md overflow-hidden text-center cursor-pointer min-h-[142px]"
                    >
                      {/* Premium Rotating Border Animation */}
                      <div 
                        className="absolute inset-[-150%] animate-[spin_3s_linear_infinite]"
                        style={{
                          background: `conic-gradient(from 0deg, ${currentThemeObj.primary} 0%, ${currentThemeObj.primary}33 25%, ${currentThemeObj.primary} 50%, ${currentThemeObj.primary}33 75%, ${currentThemeObj.primary} 100%)`
                        }}
                      />
                      {/* Inner Card representing contrast background */}
                      <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-slate-100/90 dark:bg-zinc-900/90 rounded-[8px] z-10">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md"
                          style={{ background: `linear-gradient(135deg, ${currentThemeObj.primary}dd, ${currentThemeObj.primary})` }}
                        >
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                          {isBangla ? 'ক্যামেরা' : 'Camera'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">
                          {isBangla ? 'সরাসরি ছবি তুলুন' : 'Take a photo'}
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        isPickingFileRef.current = true;
                        fileSelectedRef.current = false;
                        setShowScanOptions(false);
                        setShowScanPromptModal(false);
                        if (galleryInputRef.current) {
                          galleryInputRef.current.value = '';
                          galleryInputRef.current.click();
                        }
                      }}
                      className="flex flex-col items-center justify-center p-4 bg-slate-100/90 dark:bg-zinc-900/90 border border-black/10 dark:border-white/10 rounded-[8px] transition-all active:scale-95 shadow-sm hover:border-black/20 dark:hover:border-white/20 text-center cursor-pointer min-h-[142px]"
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-md bg-zinc-200/80 dark:bg-zinc-800 border border-black/5 dark:border-white/5">
                        <Image className="w-6 h-6" style={{ color: currentThemeObj.primary }} />
                      </div>
                      <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                        {isBangla ? 'গ্যালারি' : 'Gallery'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">
                        {isBangla ? 'ফাইল নির্বাচন করুন' : 'Select a file'}
                      </span>
                    </button>
                  </div>

                  {/* iOS Cancel Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowScanOptions(false);
                      setShowScanPromptModal(true);
                    }}
                    className="w-full h-[52px] bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-[8px] text-xs font-black text-gray-700 dark:text-gray-200 transition-colors active:scale-98"
                  >
                    {isBangla ? 'বাতিল' : (t.CANCEL || "Cancel")}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delivery Note Scanning iOS Style Bottom Sheet */}
      {createPortal(
        <AnimatePresence>
          {showScanPromptModal && !showScanOptions && !editingTrip && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={() => {
                  setHasEnteredForm(true);
                  setShowScanPromptModal(false);
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9999] pointer-events-auto"
              />
              {/* Bottom Sheet */}
              <motion.div
                initial={isDesktop ? { opacity: 0, scale: 0.95, x: '-50%', y: '-40%' } : { y: '100%' }}
                animate={isDesktop ? { opacity: 1, scale: 1, x: '-50%', y: '-50%' } : { y: 0 }}
                exit={isDesktop ? { opacity: 0, scale: 0.95, x: '-50%', y: '-40%' } : { y: '100%' }}
                transition={isDesktop 
                  ? { type: 'spring', damping: 25, stiffness: 280 }
                  : { type: 'tween', ease: [0.16, 1, 0.3, 1], duration: 0.28 }
                }
                className={`fixed ${isDesktop ? 'top-1/2 left-1/2 w-full max-w-md rounded-2xl' : 'left-0 right-0 bottom-0 max-w-md mx-auto rounded-t-[2rem]'} bg-slate-50 dark:bg-zinc-950 border border-black/10 dark:border-white/10 z-[10000] shadow-2xl overflow-hidden pointer-events-auto`}
                style={{
                  paddingBottom: isDesktop ? '1.5rem' : 'calc(env(safe-area-inset-bottom, 16px) + 1.25rem)'
                }}
              >
                {/* iOS Drag Handle */}
                {!isDesktop && <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-800 rounded-full mx-auto mt-4 mb-2" />}
                {isDesktop && <div className="h-4" />}

                <div className="px-6 pb-2">
                  {/* Header icon block */}
                  <div className="flex flex-col items-center justify-center text-center mt-2">
                    <div 
                      className="w-16 h-16 rounded-[2rem] flex items-center justify-center mb-4 shadow-xl relative overflow-hidden group"
                      style={{ background: `linear-gradient(135deg, ${currentThemeObj.primary}22, ${currentThemeObj.primary}44)` }}
                    >
                      {/* Outer scanning pulse */}
                      <div className="absolute inset-0 border-2 border-dashed border-primary/40 rounded-[2rem] animate-[spin_12s_linear_infinite]" style={{ borderColor: currentThemeObj.primary }} />
                      <Scan size={28} style={{ color: currentThemeObj.primary }} className="relative z-10 animate-[pulse_2s_infinite]" />
                    </div>

                    <h2 className={`text-lg font-black tracking-tight mb-1.5 ${isWhiteMode ? 'text-gray-900' : 'text-white'}`}>
                      {isBangla ? 'ডেলিভারি নোট স্ক্যানিং' : 'Delivery Note Scanning'}
                    </h2>
                    
                    <p className={`text-[11px] font-bold px-4 leading-relaxed text-center ${isWhiteMode ? 'text-gray-600' : 'text-white/70'}`}>
                      {isBangla 
                        ? 'ডেলিভারি নোট স্ক্যান করে ট্রিপের তথ্যগুলো নিমিষেই অটো-ফিল করে নিন' 
                        : 'Scan your delivery note to automatically extract and populate trip fields instantly.'}
                    </p>
                  </div>

                  {/* Action Area */}
                  <div className="mt-6 space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowScanPromptModal(false);
                        setShowScanOptions(true);
                      }}
                      className="w-full h-12 text-white rounded-[8px] text-xs font-black shadow-lg active:scale-95 duration-100 transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                      style={{ background: currentThemeObj.primary }}
                    >
                      <Scan className="w-4 h-4" />
                      <span>{isBangla ? 'স্ক্যান শুরু করুন' : 'Start Scan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHasEnteredForm(true);
                        setShowScanPromptModal(false);
                      }}
                      className={`w-full h-12 rounded-[8px] text-xs font-black transition-all active:scale-95 duration-105 cursor-pointer ${
                        isWhiteMode 
                          ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-gray-200'
                      }`}
                    >
                      {isBangla ? 'স্কিপ করুন (ম্যানুয়াল এন্ট্রি)' : 'Skip & Manual Entry'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowScanPromptModal(false);
                        setShowScanOptions(false);
                        setView('DASHBOARD');
                      }}
                      className={`w-full h-12 rounded-[8px] text-xs font-black transition-all active:scale-95 duration-105 cursor-pointer ${
                        isWhiteMode 
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-500' 
                          : 'bg-zinc-900 hover:bg-zinc-800 text-gray-400'
                      }`}
                    >
                      {isBangla ? 'ড্যাশবোর্ডে ফিরে যান' : 'Go Back to Dashboard'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Immersive Fullscreen Laser Scanner Overlay */}
      {createPortal(
        <>
          {isScanning && (
            <div
              
              
              
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10001] flex flex-col items-center justify-center p-4 pointer-events-auto"
            >
              <div className="max-w-md w-full flex flex-col items-center justify-center">
                {/* Laser Scanner Hologram container */}
                <div 
                  
                  
                  
                  className="relative w-72 h-96 md:w-80 md:h-[26rem] bg-zinc-950 border-2 border-cyan-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.25)]"
                >
                  {scannedImagePreview ? (
                    <>
                      {/* Base Layer: Unscanned dark / grayscale raw document */}
                      <img 
                        src={scannedImagePreview} 
                        alt="Raw Document"
                        className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-[0.4] contrast-75 saturate-0"
                        referrerPolicy="no-referrer"
                      />

                      {/* Mask Layer: Scanned bright / fully-vibrant document revealed perfectly behind the laser */}
                      <img 
                        src={scannedImagePreview} 
                        alt="Scanned Draft"
                        className="absolute inset-0 w-full h-full object-cover z-10 filter brightness-[1.1] saturate-[1.1] contrast-[1.15] pointer-events-none"
                        referrerPolicy="no-referrer"
                        
                        
                        
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-500 z-0">
                      <Scan className="w-12 h-12 mb-3 text-cyan-500 animate-pulse" />
                      <p className="text-xs font-bold">{isBangla ? 'ডকুমেন্ট ইমেজ লোড হচ্ছে...' : 'Loading document image...'}</p>
                    </div>
                  )}

                  {/* Interactive vertical glowing scan line (CamScanner style, perfectly synchronized) */}
                  <div
                    
                    
                    
                    className="absolute left-0 right-0 z-20 pointer-events-none flex flex-col justify-end"
                    style={{ height: '128px', marginTop: '-128px' }}
                  >
                    {/* Moving cyan ambient laser sheet trail trailing UP from the scanning path line */}
                    <div className="w-full h-full bg-gradient-to-t from-cyan-400/10 to-transparent pointer-events-none" />

                    {/* Main laser line with rich cyan glowing shadow */}
                    <div className="relative w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee,0_0_25px_#06b6d4,0_0_40px_#0891b2] z-30">
                      {/* Super bright core glint in center of scanning line */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-48 h-[4px] bg-white rounded-full blur-[1px] opacity-90" />
                    </div>
                  </div>

                  {/* Traditional Corner Bracket Target elements */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-cyan-400 rounded-tl-md z-30 opacity-70" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-cyan-400 rounded-tr-md z-30 opacity-70" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-cyan-400 rounded-bl-md z-30 opacity-70" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-cyan-400 rounded-br-md z-30 opacity-70" />

                  {/* Grid background mesh and lens tint overlays */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none z-15" />
                  <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-cyan-950/20 to-transparent pointer-events-none z-10" />
                </div>

                {/* Status indicator console */}
                <div className="mt-8 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <h3 className="text-white text-sm font-black tracking-wider uppercase">
                      {isBangla ? 'ডকুমেন্ট স্ক্যান করা হচ্ছে...' : 'Analyzing Document...'}
                    </h3>
                  </div>
                  <p className="text-gray-400 text-xs font-bold max-w-xs leading-relaxed animate-pulse">
                    {isBangla ? 'এআই জেনারেティブ মডেল ডকুমেন্ট থেকে ডেটা এক্সট্রাক্ট করছে।' : 'Generative AI is parsing delivery notes. Keeping values pristine...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* OCR Results Verification Modal */}
      {extractedData && (() => {
        const fields = [
          { key: 'invoiceNumber', label: isBangla ? 'ডেলিভারি নোট নং' : 'Invoice Number' },
          { key: 'companyName', label: isBangla ? 'কোম্পানির নাম' : 'Company Name' },
          { key: 'bayanNumber', label: isBangla ? 'বায়ান নম্বর' : 'Bayan Doc. No.' },
          { key: 'truckNumber', label: isBangla ? 'ট্রাক নম্বর' : 'Truck Number' },
          { key: 'containerNumber', label: isBangla ? 'কন্টেইনার নম্বর' : 'Container Number' },
          { key: 'loadingPlace', label: isBangla ? 'লোডিং স্থান' : 'Loading Place' },
          { key: 'deliveryPlace', label: isBangla ? 'ডেলিভারি স্থান' : 'Delivery Place' },
          { key: 'loadingDate', label: isBangla ? 'লোড তারিখ' : 'Loading Date' },
          { key: 'loadingTime', label: isBangla ? 'লোড সময়' : 'Loading Time' },
          { key: 'deliveryDate', label: isBangla ? 'ডেলিভারি তারিখ' : 'Delivery Date' },
          { key: 'deliveryTime', label: isBangla ? 'ডেলিভারি সময়' : 'Delivery Time' },
        ];
        
        const missingFields = fields.filter(
          f => !extractedData[f.key] || String(extractedData[f.key]).trim() === ''
        );

        return createPortal(
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10005] flex items-center justify-center p-4 overflow-y-auto pointer-events-auto">
              <div
                
                
                
                
                className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-3xl border border-black/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
              >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/50 flex items-start gap-4 justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-cyan-500 shadow-sm animate-pulse">
                        <Scan size={18} />
                      </div>
                      <h3 className="text-base font-black text-gray-900 dark:text-gray-100">
                        {isBangla ? 'ডকুমেন্ট স্ক্যানকৃত ডাটা রিভিউ' : 'Document Scan Review'}
                      </h3>
                    </div>
                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {isBangla
                        ? 'অটো-ফিল করার পূর্বে নিচে স্ক্যানকৃত তথ্যগুলো নিশ্চিত বা সংশোধন করুন।'
                        : 'Please verify or edit the extracted values before applying them to the form.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExtractedData(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Missing/Blurred Field Warnings inside the Pop-up Modal */}
                {missingFields.length > 0 && (
                  <div className="mx-6 mt-4 p-4 rounded-[14px] bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 dark:border-amber-500/10 flex items-start gap-3">
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-black text-amber-700 dark:text-amber-400">
                        {isBangla ? 'কিছু ডেটা অস্পষ্ট বা অনুপস্থিত!' : 'Some data unclear or missing!'}
                      </h4>
                      <p className="text-[11px] font-bold text-amber-600/90 dark:text-amber-500/90 leading-relaxed">
                        {isBangla 
                          ? `নিচের ফিল্ডগুলো অস্পষ্ট ছবি বা ডিক্লেয়ারেশনের কারণে স্ক্যান করা সম্ভব হয়নি: ${missingFields.map(f => f.label).join(', ')}। অনুগ্রহ করে এগুলো ম্যানুয়ালি ফিলাপ করুন।`
                          : `The following fields could not be clearly read from the document: ${missingFields.map(f => f.label).join(', ')}. Please manually type them in.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Scrollable Form Fields list */}
                <div className="p-6 overflow-y-auto space-y-4 max-h-[48vh] scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'invoiceNumber', label: isBangla ? 'ডেলিভারি নোট নং' : 'Invoice Number', icon: Hash, placeholder: 'e.g. 90450/1' },
                      { key: 'companyName', label: isBangla ? 'কোম্পানির নাম' : 'Company Name', icon: Building, placeholder: 'e.g. FedEx Qatar' },
                      { key: 'bayanNumber', label: isBangla ? 'বায়ান নম্বর' : 'Bayan Doc. No.', icon: FileText, placeholder: 'e.g. 5SI60041242560' },
                      { key: 'truckNumber', label: isBangla ? 'ট্রাক নম্বর' : 'Truck Number', icon: Truck, placeholder: 'e.g. 257086' },
                      { key: 'containerNumber', label: isBangla ? 'কন্টেইনার নম্বর' : 'Container Number', icon: Package, placeholder: 'e.g. TTNU 8702418' },
                      { key: 'loadingPlace', label: isBangla ? 'লোডিং স্থান' : 'Loading Place', icon: MapPin, placeholder: 'e.g. Hamad Port' },
                      { key: 'deliveryPlace', label: isBangla ? 'ডেলিভারি স্থান' : 'Delivery Place', icon: MapPin, placeholder: 'e.g. Sanaiya' },
                      { key: 'loadingDate', label: isBangla ? 'লোড তারিখ' : 'Loading Date', icon: Calendar, type: 'date' },
                      { key: 'loadingTime', label: isBangla ? 'লোড সময়' : 'Loading Time', icon: Clock, type: 'time' },
                      { key: 'deliveryDate', label: isBangla ? 'ডেলিভারি তারিখ' : 'Delivery Date', icon: Calendar, type: 'date' },
                      { key: 'deliveryTime', label: isBangla ? 'ডেলিভারি সময়' : 'Delivery Time', icon: Clock, type: 'time' },
                    ].map(field => {
                      const IconComponent = field.icon;
                      return (
                        <div key={field.key} className="w-full">
                          <InputField
                            label={field.label}
                            name={field.key}
                            type={field.type || 'text'}
                            value={extractedData[field.key] || ''}
                            placeholder={field.placeholder || ''}
                            onChange={(e) => setExtractedData({ ...extractedData, [field.key]: e.target.value })}
                            icon={<IconComponent size={16} />}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setExtractedData(null);
                      setShowScanPromptModal(true);
                    }}
                    className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-black text-gray-700 dark:text-gray-200 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    {isBangla ? 'বাতিল করুন' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleOcrResult(extractedData);
                      setExtractedData(null);
                      setHasEnteredForm(true);
                      showFeedback(isBangla ? 'ফর্মে ডেটা অটো-ফিল করা হয়েছে!' : 'Form fields successfully populated!');
                    }}
                    className="px-6 py-2.5 text-xs font-black text-white rounded-xl transition-all active:scale-95 flex items-center gap-2 shadow-md cursor-pointer"
                    style={{
                      backgroundColor: currentThemeObj.primary
                    }}
                  >
                    <Check size={14} />
                    <span>{isBangla ? 'ফর্মে প্রয়োগ করুন' : 'Apply to Form'}</span>
                  </button>
                </div>
              </div>
            </div>
          </>,
          document.body
        );
      })()}

      {/* Server Feedback Modal */}
      {scanErrorMsg && createPortal(
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10005] flex items-center justify-center p-4 overflow-y-auto pointer-events-auto">
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl border border-rose-500/30 shadow-2xl flex flex-col overflow-hidden text-left">
              <div className="p-5 flex flex-col space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                      {isBangla ? 'সার্ভার ফিডব্যাক' : 'Server Feedback'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isBangla ? 'সার্ভার থেকে প্রাপ্ত সরাসরি রেসপন্স মেসেজ:' : 'Raw response directly from the server:'}
                    </p>
                  </div>
                </div>

                <div className="w-full">
                  <pre className="text-xs font-mono bg-gray-900 dark:bg-black text-rose-300 p-4 rounded-2xl border border-zinc-800 overflow-x-auto max-h-64 whitespace-pre-wrap break-all select-all">
                    {scanErrorMsg}
                  </pre>
                </div>

                <div className="flex gap-2 w-full pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(scanErrorMsg);
                      showFeedback(isBangla ? 'সার্ভার রেসপন্স কপি করা হয়েছে' : 'Copied server response to clipboard');
                    }}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-gray-700 dark:text-gray-200 rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    {isBangla ? 'কপি করুন' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScanErrorMsg(null);
                    }}
                    className="flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
                  >
                    {isBangla ? 'বন্ধ করুন' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* Removed success alert since we auto-redirect now */}
    </>
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModalSelect = (selectedOption: any) => {
    let val = selectedOption;
    if (typeof selectedOption === 'object' && selectedOption !== null) {
      val = 'value' in selectedOption ? selectedOption.value : selectedOption.label || String(selectedOption);
    }
    
    setModalConfig(prev => {
      if (prev.field) {
        setFormData(fd => ({ ...fd, [prev.field]: val }));
      }
      return { ...prev, isOpen: false };
    });
  };

  const handleModalAddNew = (newValue: string) => {
    const field = modalConfig.field;
    const trimmed = newValue.trim();
    if (!trimmed || !field) return;

    if (field === 'fromCountry' || field === 'arrivalCountry') {
      const detected = scanAndDetectCountry(trimmed);
      const isExist = countries.some(c => 
        c.name.toLowerCase() === detected.name.toLowerCase() || 
        c.name.toLowerCase() === trimmed.toLowerCase() ||
        c.code.toLowerCase() === detected.code.toLowerCase()
      );
      if (!isExist) {
        addCountry({
          code: detected.code,
          name: detected.name,
          flag: detected.flag
        });
        showFeedback(
          isBangla 
            ? `নতুন দেশ "${detected.flag} ${detected.name}" ডাটাবেজে সংরক্ষণ করা হয়েছে!` 
            : `Country "${detected.flag} ${detected.name}" saved to database!`,
          'success'
        );
      }
      setFormData(prev => ({ ...prev, [field]: detected.name }));
    } else if (field === 'loadingPlace') {
      const country = formData.fromCountry || (countries && countries[0]?.name) || 'Qatar';
      const isExist = locations.some(l => 
        String(l.country || '').trim().toLowerCase() === country.trim().toLowerCase() && 
        String(l.name || '').trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (!isExist) {
        addLocation({ country, name: trimmed });
        showFeedback(
          isBangla 
            ? `নতুন লোডিং স্থান "${trimmed}" (${country}) ডাটাবেজে যুক্ত হয়েছে!` 
            : `Loading place "${trimmed}" (${country}) added to database!`,
          'success'
        );
      }
      setFormData(prev => ({ ...prev, loadingPlace: trimmed }));
    } else if (field === 'deliveryPlace') {
      const country = formData.arrivalCountry || (countries && countries[0]?.name) || 'Qatar';
      const isExist = locations.some(l => 
        String(l.country || '').trim().toLowerCase() === country.trim().toLowerCase() && 
        String(l.name || '').trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (!isExist) {
        addLocation({ country, name: trimmed });
        showFeedback(
          isBangla 
            ? `নতুন ডেলিভারি স্থান "${trimmed}" (${country}) ডাটাবেজে যুক্ত হয়েছে!` 
            : `Delivery place "${trimmed}" (${country}) added to database!`,
          'success'
        );
      }
      setFormData(prev => ({ ...prev, deliveryPlace: trimmed }));
    } else if (field === 'companyName') {
      const upper = trimmed.toUpperCase();
      const isExist = companies.some(c => c.toUpperCase() === upper);
      if (!isExist) {
        addCompany(upper);
        showFeedback(
          isBangla 
            ? `নতুন কোম্পানি "${upper}" ডাটাবেজে যুক্ত হয়েছে!` 
            : `Company "${upper}" added to database!`,
          'success'
        );
      }
      setFormData(prev => ({ ...prev, companyName: upper }));
    } else if (field === 'lodgingType') {
      const isExist = loadingTypes.some(lt => lt.toLowerCase() === trimmed.toLowerCase());
      if (!isExist) {
        addLoadingType(trimmed);
      }
      setFormData(prev => ({ ...prev, lodgingType: trimmed }));
    } else if (field === 'containerTitle') {
      const isExist = containerTypes.some(ct => ct.toLowerCase() === trimmed.toLowerCase());
      if (!isExist) {
        addContainerType(trimmed);
      }
      setFormData(prev => ({ ...prev, containerTitle: trimmed }));
    } else if (field === 'emptyReturnYard') {
      const isExist = emptyReturnYards.some(y => y.toLowerCase() === trimmed.toLowerCase());
      if (!isExist) {
        addEmptyReturnYard(trimmed);
      }
      setFormData(prev => ({ ...prev, emptyReturnYard: trimmed }));
    } else if (field === 'extraDieselReason') {
      const isExist = extraDieselReasons.some(r => r.toLowerCase() === trimmed.toLowerCase());
      if (!isExist) {
        addExtraDieselReason(trimmed);
      }
      setFormData(prev => ({ ...prev, extraDieselReason: trimmed }));
    }
  };

  const getFieldSuggestions = (fieldName: keyof Trip) => {
    return Array.from(new Set(trips.map(t => t[fieldName]).filter(v => v !== null && v !== undefined && v !== ''))).map(String);
  };

  const getFieldUsageCount = (fieldName: keyof Trip, value: any) => {
    if (!value) return 0;
    return trips.filter(t => t[fieldName]?.toString().toLowerCase() === value.toString().toLowerCase()).length;
  };

  const openModal = (field: string, label: string, options: any[]) => {
    setModalConfig({ isOpen: true, field, label, options });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isFormEmpty = 
      !formData.loadingPlace.trim() && 
      !formData.deliveryPlace.trim() && 
      !formData.companyName.trim() && 
      !formData.vehicleNumber.trim() && 
      !formData.loadingDate.trim() &&
      !formData.containerNumber.trim() &&
      !formData.bayanNumber.trim() &&
      !formData.dieselPrice.toString().trim() &&
      !formData.generatorDiesel.toString().trim() &&
      !formData.extraDiesel.toString().trim() &&
      !formData.commission.toString().trim() &&
      !formData.friday.toString().trim() &&
      !formData.bonus.toString().trim() &&
      !formData.overtime.toString().trim() &&
      !formData.emptyReturnYard.trim() &&
      !formData.trailerNumber.trim() &&
      !formData.containerTitle.trim() &&
      !formData.invoiceNumber.trim();

    if (isFormEmpty) {
      const warningMsg = isBangla 
        ? 'ট্রিপ ফর্মে কোনো তথ্য প্রবেশ করানো হয়নি! অনুগ্রহ করে তথ্য পূরণ করুন।' 
        : 'No data entered! Please fill in the trip form details.';
      showFeedback(warningMsg, 'error');
      return;
    }

    if (!currentFile) {
      showFeedback('No monthly file selected!', 'error');
      return;
    }

    if (showGenerator && !formData.generatorDiesel.trim()) {
      showFeedback(isBangla ? 'অনুগ্রহ করে টাকা প্রদান করুন' : 'Please provide Amount', 'error');
      return;
    }

    if (showGenerator && !formData.dieselReceiptDate.trim()) {
      showFeedback(isBangla ? 'অনুগ্রহ করে ট্রানজেকশন ডেট প্রদান করুন' : 'Please provide Transaction Date', 'error');
      return;
    }

    if (showGenerator && !formData.generatorReceiveNumber.trim()) {
      showFeedback(isBangla ? 'অনুগ্রহ করে রসিদ নম্বর প্রদান করুন' : 'Please provide Receipt Number', 'error');
      return;
    }
    
    if (parseFloat(formData.extraDiesel) > 0 && !formData.extraDieselReason) {
      showFeedback('Please select a reason for Extra Diesel', 'error');
      return;
    }

    setIsSubmitting(true);

    const isCompleted = (formData.tariffStatus && (formData.tariffStatus.toLowerCase() === 'complete' || formData.tariffStatus.toLowerCase() === 'completed'));

    const tripData: any = {
      ...formData,
      status: isCompleted ? 'COMPLETED' : 'PENDING',
      tariffStatus: isCompleted ? 'Complete' : 'Incomplete',
      generatorReceiveNumber: !showGenerator ? '' : formData.generatorReceiveNumber,
      dieselReceiptDate: !showGenerator ? '' : formData.dieselReceiptDate,
      dieselReceiptType: !showGenerator ? '' : formData.dieselReceiptType,
      pumpName: !showGenerator ? '' : formData.pumpName,
      dieselPrice: parseFloat(formData.dieselPrice) || 0,
      generatorDiesel: parseFloat(formData.generatorDiesel) || 0,
      extraDiesel: parseFloat(formData.extraDiesel) || 0,
      commission: parseFloat(formData.commission) || 0,
      friday: parseFloat(formData.friday) || 0,
      bonus: parseFloat(formData.bonus) || 0,
      overtime: parseFloat(formData.overtime) || 0,
      loadingType: formData.lodgingType,
      totalAmount: (parseFloat(formData.dieselPrice) || 0) + 
                  (parseFloat(formData.commission) || 0) + 
                  (parseFloat(formData.extraDiesel) || 0) +
                  (parseFloat(formData.friday) || 0) +
                  (parseFloat(formData.bonus) || 0) +
                  (parseFloat(formData.overtime) || 0)
    };

    if (editingTrip) {
      const updatedTrip: Trip = {
        ...editingTrip,
        ...tripData,
        paidAmount: editingTrip.paidAmount || 0,
        dieselPaid: editingTrip.dieselPaid || 0,
        generatorDieselPaid: editingTrip.generatorDieselPaid || 0,
        commissionPaid: editingTrip.commissionPaid || 0,
        fridayPaid: editingTrip.fridayPaid || 0,
        bonusPaid: editingTrip.bonusPaid || 0,
        overtimePaid: editingTrip.overtimePaid || 0,
        paymentStatus: editingTrip.paymentStatus || 'UNPAID',
        payments: editingTrip.payments || []
      };
      updateTrip(updatedTrip);
      showFeedback('Trip updated successfully!');
      setEditingTrip(null);
    } else {
      const newTrip: Trip = {
        id: `TRIP-${Date.now()}`,
        fileId: currentFile.id,
        userId: currentFile.userId || user?.id || 'USR1001',
        ...tripData,
        paidAmount: 0,
        dieselPaid: 0,
        generatorDieselPaid: 0,
        commissionPaid: 0,
        fridayPaid: 0,
        bonusPaid: 0,
        overtimePaid: 0,
        paymentStatus: 'UNPAID',
        payments: []
      };
      addTrip(newTrip);
      
      // Add payments for financial fields
      const paymentCategories = [
        { key: 'bonus', label: 'Bonus' },
        { key: 'commission', label: 'Commission' },
        { key: 'friday', label: 'Friday' },
        { key: 'overtime', label: 'Overtime' },
      ];

      paymentCategories.forEach(cat => {
        const amount = newTrip[cat.key as keyof Trip] as number || 0;
        if (amount > 0) {
          addPayment({
            id: `PAY-${Date.now()}-${cat.key}`,
            transactionId: `TXN-${Date.now()}-${cat.key}`,
            amount,
            date: newTrip.loadingDate,
            time: newTrip.loadingTime,
            type: 'INCOME',
            category: cat.label,
            method: 'CASH',
            details: { pendingItems: { [newTrip.id]: amount } },
            userId: newTrip.userId,
            month: currentFile.month,
            year: currentFile.year,
            monthlyFileId: currentFile.id,
            status: 'PENDING'
          });
        }
      });
      
      showFeedback('Trip created successfully!');
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setView('MONTHLY_FILE_DETAILS');
    }, 1500);
  };



  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const [newFileMonth, setNewFileMonth] = useState(new Date().getMonth() + 1);
  const [newFileYear, setNewFileYear] = useState(new Date().getFullYear());
  const [isMonthSheetOpen, setIsMonthSheetOpen] = useState(false);
  const [isYearSheetOpen, setIsYearSheetOpen] = useState(false);

  const handleCreateFile = () => {
    const newFile: any = {
      id: `MF-${Date.now()}`,
      month: newFileMonth,
      year: newFileYear,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    addMonthlyFile(newFile);
    setCurrentFile(newFile);
    setShowFileSelectModal(false);
  };

  const loadingPlaces = locations
    .filter(l => l && l.name && String(l.country || '').trim().toLowerCase() === String(formData.fromCountry || '').trim().toLowerCase())
    .map(l => ({ label: l.name, value: l.name }));

  const deliveryPlaces = locations
    .filter(l => l && l.name && String(l.country || '').trim().toLowerCase() === String(formData.arrivalCountry || '').trim().toLowerCase())
    .map(l => ({ label: l.name, value: l.name }));

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-theme-card rounded-lg shadow-sm overflow-hidden border border-black/5 dark:border-white/5 relative">
        {/* Background Watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.18] dark:opacity-[0.12] text-gray-400 dark:text-gray-500 z-0">
          <MapPin size={160} className="transform rotate-12" />
        </div>

        {/* Card Header with background color */}
        <div className="bg-neutral-100/80 dark:bg-white/5 border-b border-neutral-200/50 dark:border-white/5 p-3 px-4 flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
            <MapPin size={16} />
          </div>
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main">{isBangla ? 'উৎসের তথ্য' : 'Origin Details'}</h3>
        </div>
        
        {/* Card Content */}
        <div className="p-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
            <InputField
              label={t.FROM_COUNTRY || "From Country"}
              name="fromCountry"
              icon={<MapPin size={16} />}
              value={formData.fromCountry}
              onChange={handleChange}
              type="select"
              options={countries.map(c => ({ label: c.name, value: c.name, icon: c.flag }))}
              onOpenModal={openModal}
            />
            <InputField
              label={t.LOADING_PLACE || "Loading Place"}
              name="loadingPlace"
              icon={<MapPin size={16} />}
              value={formData.loadingPlace}
              onChange={handleChange}
              type="select"
              options={loadingPlaces.length > 0 ? loadingPlaces : [{ label: 'Select From Country First', value: '' }]}
              onOpenModal={openModal}
            />
            <InputField
              label={t.LOADING_DATE || "Loading Date"}
              name="loadingDate"
              icon={<Calendar size={16} />}
              type="date"
              value={formData.loadingDate}
              onChange={handleChange}
            />
            <InputField
              label={t.LOADING_TIME || "Loading Time"}
              name="loadingTime"
              icon={<Clock size={16} />}
              type="time"
              value={formData.loadingTime}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="bg-theme-card rounded-lg shadow-sm overflow-hidden border border-black/5 dark:border-white/5 relative">
        {/* Background Watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.18] dark:opacity-[0.12] text-gray-400 dark:text-gray-500 z-0">
          <MapPin size={160} className="transform -rotate-12" />
        </div>

        {/* Card Header with background color */}
        <div className="bg-neutral-100/80 dark:bg-white/5 border-b border-neutral-200/50 dark:border-white/5 p-3 px-4 flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
            <MapPin size={16} />
          </div>
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main">{t.DESTINATION_DETAILS || "Destination Details"}</h3>
        </div>

        {/* Card Content */}
        <div className="p-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
            <InputField
              label={t.ARRIVAL_COUNTRY || "Arrival Country"}
              name="arrivalCountry"
              value={formData.arrivalCountry}
              onChange={handleChange}
              type="select"
              options={countries.map(c => ({ label: c.name, value: c.name, icon: c.flag }))}
              onOpenModal={openModal}
            />
            <InputField
              label={t.DELIVERY_PLACE || "Delivery Place"}
              name="deliveryPlace"
              value={formData.deliveryPlace}
              onChange={handleChange}
              type="select"
              options={deliveryPlaces.length > 0 ? deliveryPlaces : [{ label: 'Select Arrival Country First', value: '' }]}
              onOpenModal={openModal}
            />
            <InputField
              label={t.DELIVERY_DATE || "Delivery Date"}
              name="deliveryDate"
              icon={<Calendar size={16} />}
              type="date"
              value={formData.deliveryDate}
              onChange={handleChange}
            />
            <InputField
              label={t.DELIVERY_TIME || "Delivery Time"}
              name="deliveryTime"
              icon={<Clock size={16} />}
              type="time"
              value={formData.deliveryTime}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="bg-theme-card rounded-lg shadow-sm overflow-hidden border border-black/5 dark:border-white/5 relative">
        {/* Background Watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.18] dark:opacity-[0.12] text-gray-400 dark:text-gray-500 z-0">
          <Building size={160} className="transform rotate-6" />
        </div>

        {/* Card Header with background color */}
        <div className="bg-neutral-100/80 dark:bg-white/5 border-b border-neutral-200/50 dark:border-white/5 p-3 px-4 flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
            <Building size={16} />
          </div>
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main">{t.COMPANY_CONTAINER || "Company & Container"}</h3>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-6 relative z-10">
          {/* Single-column fields for Company name, and side-by-side row for Bayan & Container numbers */}
          <div className="flex flex-col gap-y-6">
            <InputField
              label={t.COMPANY_NAME || "Company Name"}
              name="companyName"
              icon={<Building size={16} />}
              value={formData.companyName}
              onChange={handleChange}
              type="select"
              options={companies.map(c => ({ label: c, value: c }))}
              onOpenModal={openModal}
            />
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              <InputField
                label={t.BAYAN_NUMBER || "Bayan Number"}
                name="bayanNumber"
              icon={<FileText size={16} />}
                type="text"
                value={formData.bayanNumber}
                onChange={handleChange}
                suggestions={getFieldSuggestions('bayanNumber')}
              />
              <InputField
                label={t.CONTAINER_NUMBER || "Container Number"}
                name="containerNumber"
              icon={<Package size={16} />}
                value={formData.containerNumber}
                onChange={handleChange}
                suggestions={getFieldSuggestions('containerNumber')}
              />
            </div>
          </div>

          {/* Other remaining fields in a standard responsive grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 border-t border-black/5 dark:border-white/5 !mt-4 pt-4">
            <InputField
              label={t.LOADING_TYPE || "Loading Type"}
              name="lodgingType"
              icon={<Layers size={16} />}
              value={formData.lodgingType}
              onChange={handleChange}
              type="select"
              options={loadingTypes.map(lt => ({ label: lt, value: lt }))}
              onOpenModal={openModal}
            />
            <InputField
              label={t.CONTAINER_TITLE || "Container Title"}
              name="containerTitle"
              icon={<Package size={16} />}
              value={formData.containerTitle}
              onChange={handleChange}
              type="select"
              options={containerTypes.map(ct => ({ label: ct, value: ct }))}
              onOpenModal={openModal}
            />
            <InputField
              label={t.INVOICE_NUMBER || "Invoice Number"}
              name="invoiceNumber"
              icon={<FileText size={16} />}
              value={formData.invoiceNumber}
              onChange={handleChange}
              suggestions={getFieldSuggestions('invoiceNumber')}
            />
            <InputField
              label={t.TRIP_STATUS || "Trip Status"}
              name="tariffStatus"
              icon={<Activity size={16} />}
              value={formData.tariffStatus}
              onChange={handleChange}
              type="select"
              onOpenModal={openModal}
              options={[
                { label: 'Incomplete', value: 'Incomplete' },
                { label: 'Complete', value: 'Complete' }
              ]}
            />
            <div className="col-span-2 md:col-span-4">
              <InputField
                label={t.EMPTY_RETURN_YARD || "Empty Return Yard"}
                name="emptyReturnYard"
              icon={<MapPin size={16} />}
                value={formData.emptyReturnYard}
                onChange={handleChange}
                type="select"
                onOpenModal={openModal}
                options={emptyReturnYards.map(yard => ({ label: yard, value: yard }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-theme-card rounded-lg shadow-sm overflow-hidden border border-black/5 dark:border-white/5 relative">
        {/* Background Watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.18] dark:opacity-[0.12] text-gray-400 dark:text-gray-500 z-0">
          <Truck size={160} className="transform -rotate-6" />
        </div>

        {/* Card Header with background color */}
        <div className="bg-neutral-100/80 dark:bg-white/5 border-b border-neutral-200/50 dark:border-white/5 p-3 px-4 flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
            <Truck size={16} />
          </div>
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main">{t.VEHICLE_DRIVER || "Vehicle & Driver"}</h3>
        </div>

        {/* Card Content */}
        <div className="p-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
            <InputField
              label={t.VEHICLE_NUMBER || "Vehicle Number"}
              name="vehicleNumber"
              icon={<Truck size={16} />}
              type="tel"
              inputMode="numeric"
              value={formData.vehicleNumber}
              onChange={handleChange}
              suggestions={getFieldSuggestions('vehicleNumber')}
            />
            <InputField
              label={t.TRAILER_NUMBER || "Trailer Number"}
              name="trailerNumber"
              icon={<Truck size={16} />}
              type="tel"
              inputMode="numeric"
              value={formData.trailerNumber}
              onChange={handleChange}
              suggestions={getFieldSuggestions('trailerNumber')}
            />
          </div>
        </div>
      </div>

      <div className="bg-theme-card rounded-lg shadow-sm overflow-hidden border border-black/5 dark:border-white/5 relative">
        {/* Background Watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.18] dark:opacity-[0.12] text-gray-400 dark:text-gray-500 z-0">
          <DollarSign size={160} className="transform rotate-12" />
        </div>

        {/* Card Header with background color */}
        <div className="bg-neutral-100/80 dark:bg-white/5 border-b border-neutral-200/50 dark:border-white/5 p-3 px-4 flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
            <DollarSign size={16} />
          </div>
          <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main">{t.FINANCIAL_DETAILS || "Financial Details"}</h3>
        </div>

        {/* Card Content */}
        <div className="p-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
            <InputField
              label={t.TRIP_DIESEL || "Trip Diesel"}
              name="dieselPrice"
              icon={<Fuel size={16} />}
              value={formData.dieselPrice}
              onChange={handleChange}
              type="tel"
              inputMode="decimal"
              suggestions={getFieldSuggestions('dieselPrice')}
            />
            <InputField
              label={t.COMMISSION || "Commission"}
              name="commission"
              icon={<DollarSign size={16} />}
              value={formData.commission}
              onChange={handleChange}
              type="tel"
              inputMode="decimal"
              suggestions={getFieldSuggestions('commission')}
            />
          </div>
          
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className={`font-bold text-sm text-text-main`}>Show Optional Fields</span>
              <StyledSwitch checked={showOptionalFields} onChange={() => setShowOptionalFields(!showOptionalFields)} />
            </div>
            
            <>
              {showOptionalFields && (
                <div
                  
                  
                  
                  
                  className="flex flex-col gap-6 pt-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`font-bold text-xs text-text-main`}>Extra Diesel</span>
                      <StyledSwitch checked={showExtraDiesel} onChange={() => setShowExtraDiesel(!showExtraDiesel)} />
                    </div>
                    <>
                      {showExtraDiesel && (
                        <div
                          
                          
                          
                        >
                          <InputField
                            label={t.ENTER_AMOUNT || "Enter Amount"}
                            name="extraDiesel"
              icon={<Fuel size={16} />}
                            value={formData.extraDiesel}
                            onChange={handleChange}
                            type="tel"
                            inputMode="decimal"
                            suggestions={getFieldSuggestions('extraDiesel')}
                          />
                        </div>
                      )}
                    </>
                  </div>

                  <>
                    {showExtraDiesel && parseFloat(formData.extraDiesel) > 0 && (
                      <div
                        
                        
                        
                      >
                        <InputField
                          label={t.REASON_MANDATORY || "Reason (Mandatory)"}
                          name="extraDieselReason"
              icon={<FileText size={16} />}
                          value={formData.extraDieselReason}
                          onChange={handleChange}
                          type="select"
                          onOpenModal={openModal}
                          options={[
                            { label: 'SELECT REASON', value: '' },
                            ...(extraDieselReasons.some(r => r.toLowerCase() === 'generator diesel') 
                              ? extraDieselReasons 
                              : ['Generator Diesel', ...extraDieselReasons]
                            ).map(r => ({ label: r, value: r }))
                          ]}
                          required={parseFloat(formData.extraDiesel) > 0}
                        />
                      </div>
                    )}
                  </>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`font-bold text-xs text-text-main`}>Friday</span>
                      <StyledSwitch checked={showFriday} onChange={() => setShowFriday(!showFriday)} />
                    </div>
                    <>
                      {showFriday && (
                        <div
                          
                          
                          
                        >
                          <InputField
                            label={t.ENTER_AMOUNT || "Enter Amount"}
                            name="friday"
              icon={<Calendar size={16} />}
                            value={formData.friday}
                            onChange={handleChange}
                            type="tel"
                            inputMode="decimal"
                            suggestions={getFieldSuggestions('friday')}
                          />
                        </div>
                      )}
                    </>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className={`font-bold text-xs text-text-main`}>Bonus</span>
                      <StyledSwitch checked={showBonus} onChange={() => setShowBonus(!showBonus)} />
                    </div>
                    <>
                      {showBonus && (
                        <div
                          
                          
                          
                        >
                          <InputField
                            label={t.ENTER_AMOUNT || "Enter Amount"}
                            name="bonus"
              icon={<Gift size={16} />}
                            value={formData.bonus}
                            onChange={handleChange}
                            type="tel"
                            inputMode="decimal"
                            suggestions={getFieldSuggestions('bonus')}
                          />
                        </div>
                      )}
                    </>
                  </div>
                </div>
              )}
            </>
          </div>
        </div>
      </div>

      {/* Standalone Diesel Receipt Card */}
      <div className="bg-theme-card rounded-lg shadow-sm overflow-hidden border border-black/5 dark:border-white/5 relative">
        {/* Background Watermark */}
        <div className="absolute right-[-20px] bottom-[-20px] pointer-events-none opacity-[0.18] dark:opacity-[0.12] text-gray-400 dark:text-gray-500 z-0">
          <Fuel size={160} className="transform rotate-12" />
        </div>

        {/* Card Header with background color and switch aligned right */}
        <div className="bg-neutral-100/80 dark:bg-white/5 border-b border-neutral-200/50 dark:border-white/5 p-3 px-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: 'var(--primary)' }}>
              <Fuel size={16} />
            </div>
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main">{isBangla ? 'ডিজেল রিসিট' : 'Diesel Receipt'}</h3>
          </div>
          <StyledSwitch checked={showGenerator} onChange={() => setShowGenerator(!showGenerator)} />
        </div>

        {/* Card Content with customized top/bottom padding */}
        <div className="p-4 pt-1.5 pb-4 relative z-10">
          <>
            {showGenerator && (
              <div
                
                
                
                className="space-y-4 pt-1 relative z-10"
              >
                {/* Added Type dropdown and Pump Name input on top of the card */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <InputField
                    label={isBangla ? 'ডিজেল টাইপ (Diesel Type)' : 'Diesel Type'}
                    name="dieselReceiptType"
              icon={<Fuel size={16} />}
                    value={
                      formData.dieselReceiptType === 'truck'
                        ? (isBangla ? 'ট্রাক ডিজেল' : 'Truck Diesel')
                        : formData.dieselReceiptType === 'light_vehicle'
                          ? (isBangla ? 'লাইট ভেহিকেল ডিজেল' : 'Light vehicle Diesel')
                          : (isBangla ? 'জেনারেটর ডিজেল' : 'Generator Diesel')
                    }
                    onChange={handleChange}
                    type="select"
                    onOpenModal={openModal}
                    options={[
                      { label: isBangla ? 'ট্রাক ডিজেল' : 'Truck Diesel', value: 'truck' },
                      { label: isBangla ? 'জেনারেটর ডিজেল' : 'Generator Diesel', value: 'generator' },
                      { label: isBangla ? 'লাইট ভেহিকেল ডিজেল' : 'Light vehicle Diesel', value: 'light_vehicle' }
                    ]}
                  />
                  <InputField
                    label={isBangla ? 'পাম্পের নাম (Pump Name)' : 'Pump Name'}
                    name="pumpName"
              icon={<Fuel size={16} />}
                    value={formData.pumpName}
                    onChange={handleChange}
                    type="text"
                    placeholder={isBangla ? 'যেমন: মদিনা পাম্প' : 'e.g. Madina Pump'}
                  />
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <InputField
                    label={isBangla ? 'টাকা (Amount)' : 'Amount'}
                    name="generatorDiesel"
              icon={<DollarSign size={16} />}
                    value={formData.generatorDiesel}
                    onChange={handleChange}
                    type="tel"
                    inputMode="decimal"
                    suggestions={getFieldSuggestions('generatorDiesel')}
                  />
                  <InputField
                    label={isBangla ? 'ট্রানজেকশন ডেট' : 'Transaction Date'}
                    name="dieselReceiptDate"
              icon={<Calendar size={16} />}
                    value={formData.dieselReceiptDate}
                    onChange={handleChange}
                    type="date"
                  />
                  <InputField
                    label={isBangla ? 'রিসিট নম্বর' : 'Receipt Number'}
                    name="generatorReceiveNumber"
              icon={<FileText size={16} />}
                    value={formData.generatorReceiveNumber}
                    onChange={handleChange}
                    type="text"
                  />
                </div>
              </div>
            )}
          </>
        </div>
      </div>
    
      <div className="flex items-center gap-4 mt-8 pb-6">
        <motion.button
          type="button"
          onClick={() => {
            setEditingTrip(null);
            setView('MONTHLY_FILE_DETAILS');
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="flex-1 h-14 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
        >
          <X size={16} />
          {t.CANCEL || "Cancel"}
        </motion.button>
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={isSubmitting ? {} : { scale: 1.02 }}
          whileTap={isSubmitting ? {} : { scale: 0.95 }}
          className={`flex-1 h-14 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-md hover:shadow-lg transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
          ) : (
            <Check size={16} />
          )}
          {editingTrip ? (t.UPDATE_TRIP || "Update Trip") : (t.SUBMIT || "Submit")}
        </motion.button>
      </div>
    </form>
  );

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  // Determine preceding month and year relative to current date
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = currentYear - 1;
  }

  const openFiles = monthlyFiles.filter(f => {
    if (f.status !== 'OPEN') return false;
    
    // Future years are always open
    if (f.year > currentYear) return true;
    
    // Past years are closed except for the special transition rule (e.g. Dec of last year when today is Jan 1st)
    if (f.year < currentYear) {
      if (f.year === prevYear && f.month === prevMonth && currentDay === 1) {
        return true;
      }
      return false;
    }
    
    // Current year:
    // - Current or future months are open
    if (f.month >= currentMonth) return true;
    
    // - Preceding month: stays open only until the 1st day of the next month (inclusive of the 1st day)
    if (f.month === prevMonth && currentDay === 1) {
      return true;
    }
    
    return false;
  });

  if (!currentFile && (openFiles.length === 0 || showFileSelectModal)) {
    return (
      <div 
        className="w-full flex-1 flex flex-col items-center justify-center p-4 min-h-[70vh] py-12"
      >
        <div 
          className={`rounded-[14px] w-full max-w-md shadow-xl border border-black/5 dark:border-white/5 overflow-hidden flex flex-col max-h-full animate-scale-in trip-file-modal ${isWhiteMode ? 'bg-white' : 'bg-theme-card'}`}
          style={isWhiteMode ? {} : { background: 'var(--theme-card)' }}
        >
          <div 
            className={`flex-none p-6 flex justify-between items-center bg-transparent`}
          >
            <div>
              <h2 className={`text-xl font-black tracking-tight ${isWhiteMode ? 'text-gray-900' : 'text-white'}`}>
                {openFiles.length === 0 ? 'Create Monthly File' : 'Select Monthly File'}
              </h2>
              <p className={`text-xs mt-1 font-medium ${isWhiteMode ? 'text-gray-600' : 'text-white/80'}`}>
                {openFiles.length === 0 ? 'No active file found. Please create one.' : 'Choose a file to add this trip to'}
              </p>
            </div>
            <button 
              onClick={() => setView('DASHBOARD')}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} style={{ color: currentThemeObj.primary }} />
            </button>
          </div>
          
          <div 
            className={`flex-1 overflow-y-auto p-4 space-y-4 ${isWhiteMode ? 'bg-transparent' : 'bg-transparent'}`}
          >
            {openFiles.length === 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase ${isWhiteMode ? 'text-gray-600' : 'text-white/80'}`}>{t.MONTH || "Month"}</label>
                    <button
                      type="button"
                      onClick={() => setIsMonthSheetOpen(true)}
                      className={`w-full h-14 px-4 rounded-lg font-bold text-xs outline-none text-left ${isWhiteMode ? 'text-gray-900' : 'text-white'} flex items-center justify-between shadow-sm active:scale-95 duration-200 transition-all ${isWhiteMode ? 'bg-gray-100' : 'bg-theme-card'}`}
                    >
                      <span>{monthNames[newFileMonth - 1]}</span>
                      <ChevronDown size={14} className={isWhiteMode ? 'text-gray-500' : 'text-white/60'} />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className={`text-[10px] font-bold uppercase ${isWhiteMode ? 'text-gray-600' : 'text-white/80'}`}>{t.YEAR || "Year"}</label>
                    <button
                      type="button"
                      onClick={() => setIsYearSheetOpen(true)}
                      className={`w-full h-14 px-4 rounded-lg font-bold text-xs outline-none text-left ${isWhiteMode ? 'text-gray-900' : 'text-white'} flex items-center justify-between shadow-sm active:scale-95 duration-200 transition-all ${isWhiteMode ? 'bg-gray-100' : 'bg-theme-card'}`}
                    >
                      <span>{newFileYear}</span>
                      <ChevronDown size={14} className={isWhiteMode ? 'text-gray-500' : 'text-white/60'} />
                    </button>
                  </div>

                  <GlobalFullscreenSelect
                    isOpen={isMonthSheetOpen}
                    onClose={() => setIsMonthSheetOpen(false)}
                    onSelect={(val) => {
                      setNewFileMonth(parseInt(val));
                      setIsMonthSheetOpen(false);
                    }}
                    options={monthNames.map((name, i) => ({ label: name, value: String(i + 1) }))}
                    title={t.SELECT_MONTH || "Select Month"}
                    selectedValue={String(newFileMonth)}
                    searchable={false}
                  />

                  <GlobalFullscreenSelect
                    isOpen={isYearSheetOpen}
                    onClose={() => setIsYearSheetOpen(false)}
                    onSelect={(val) => {
                      setNewFileYear(parseInt(val));
                      setIsYearSheetOpen(false);
                    }}
                    options={[2024, 2025, 2026, 2027].map(y => ({ label: String(y), value: String(y) }))}
                    title={t.SELECT_YEAR || "Select Year"}
                    selectedValue={String(newFileYear)}
                    searchable={false}
                  />
                </div>
                <button 
                  onClick={handleCreateFile}
                  className="w-full h-14 text-white rounded-lg font-bold text-sm shadow-lg active:scale-95 transition-all uppercase tracking-wider"
                  style={{ background: currentThemeObj.primary }}
                >
                  Create & Continue
                </button>
              </div>
            ) : (
              openFiles.map(file => {
                const fileTripsCount = trips.filter(t => t.fileId === file.id).length;
                const formattedDate = new Date(file.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric'
                });
                
                return (
                    <button
                    key={file.id}
                    onClick={() => {
                      setCurrentFile(file);
                      setShowFileSelectModal(false);
                    }}
                    className="w-full text-left p-4 rounded-lg transition-all group relative overflow-hidden bg-theme-card border border-transparent hover:border-primary"
                    style={{ '--hover-bg': 'var(--primary)' } as any}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0" style={{ background: currentThemeObj.primary, opacity: 0.1 }} />
                          <FileText size={20} style={{ color: currentThemeObj.primary }} className="relative z-10" />
                        </div>
                        <div>
                          <span className={`block font-bold text-lg leading-none ${isWhiteMode ? 'text-gray-900' : 'text-white'}`}>
                            {monthNames[file.month - 1]} {file.year}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider mt-1 block ${isWhiteMode ? 'text-gray-500' : 'text-white/60'}`}>
                            {file.status}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold">
                        {fileTripsCount} Trips
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs font-medium bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                      <Calendar size={14} style={{ color: currentThemeObj.primary }} />
                      <span className={isWhiteMode ? 'text-gray-600' : 'text-white/80'}>Created on: {formattedDate}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // No early return for showScanPromptModal. It is now rendered as a premium sliding bottom sheet inside renderScanningFeatures!

  return (
    <>
      <GlobalFullscreenSelect
        key={modalConfig.field || 'select'}
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.label}
        options={modalConfig.options}
        onSelect={handleModalSelect}
        selectedValue={formData[modalConfig.field as keyof typeof formData]}
        allowAdd={modalConfig.field !== 'tariffStatus'}
        onAddNew={handleModalAddNew}
        fieldId={modalConfig.field}
      />

      <InputFieldThemeContext.Provider value={isWhiteMode ? 'light' : null}>
        {!hasEnteredForm ? null : isDesktop ? (
          <FormWindow title={editingTrip ? 'Edit Trip' : 'Save Trip'} onClose={() => goBack()}>
            {renderForm()}
          </FormWindow>
        ) : (
          <div className="animate-fade-in pb-6 w-full mx-auto">
            {renderForm()}
          </div>
        )}
      </InputFieldThemeContext.Provider>

      {renderScanningFeatures()}
    </>
  );
};


const SectionHeader = ({ title, icon: Icon, inline = false }: { title: string; icon: any; inline?: boolean }) => {
  const { appThemeMode } = useStore();
  const isWhiteMode = appThemeMode === 'light';
  
  if (inline) {
    return (
      <div className="flex items-center gap-2 section-header">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white section-icon shadow-sm" style={{ backgroundColor: 'var(--primary)' }}>
          <Icon size={16} />
        </div>
        <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main">{title}</h3>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/50 dark:border-white/5 mb-4 section-header w-full">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white section-icon shadow-sm" style={{ backgroundColor: 'var(--primary)' }}>
        <Icon size={16} />
      </div>
      <h3 className="text-xs font-extrabold tracking-wider uppercase text-text-main">{title}</h3>
    </div>
  );
};

const StyledSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => {
  const { appThemeMode } = useStore();
  const isWhiteMode = appThemeMode === 'light';
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors  ease-in-out focus:outline-none ${
        !checked ? (isWhiteMode ? 'bg-gray-300' : 'bg-black/20 dark:bg-white/20') : ''
      }`}
      style={checked ? { background: 'var(--primary)' } : {}}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export default NewTrip;
