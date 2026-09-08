import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStore, GLOBAL_TRANSITION, LOCAL_VARIANTS } from '@/store';
import { getFirebaseCollection, saveFirebaseDoc, deleteFirebaseDoc, subscribeFirebaseCollection, clearFirebaseCollection } from '@/services/firebase';
import { Camera, Plus, Search, Trash2, X, Phone, Mail, Building, MapPin, Map as MapIcon, Navigation, AlignLeft, User, PhoneCall, ChevronLeft, Eye, Edit, Download, Globe, FileText, Share2, Smartphone, CreditCard, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import InputField from '@/components/InputField';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import CountryCodeDropdown from '@/components/CountryCodeDropdown';
import { motion, AnimatePresence } from 'framer-motion';
import { compressImage } from '@/utils/imageUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { downloadPdf } from '@/utils/fileUtils';
import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';
import { NativeSettings, AndroidSettings } from 'capacitor-native-settings';

export default function ContactsView() {
  const { 
    language, user, countries, nationalities, idTypes, setView, primaryColor: storePrimaryColor, 
    currentThemeObj, setCustomHeaderTitle, setCustomBackAction, showFeedback, confirmAction, 
    setIsContactSelectionMode, theme, appThemeMode, isNightMode, isDarkMode: storeIsDarkMode 
  } = useStore();
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';
  const primaryColor = storePrimaryColor || currentThemeObj?.primary || '#10b981';

  const getDocumentNumberLabel = (docType: string) => {
    if (!docType) return '';
    const upperType = docType.toUpperCase().trim();
    if (upperType === 'NID' || upperType === 'NATIONAL ID' || upperType === 'NATIONALID') {
      return 'National ID Numbers';
    }
    const formatted = docType
      .split(' ')
      .filter(Boolean)
      .map(word => {
        const uWord = word.toUpperCase();
        if (uWord === 'ID') return 'ID';
        if (uWord === 'NID') return 'National ID';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
    return `${formatted} Numbers`;
  };

  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectModalOpen, setSelectModalOpen] = useState(false);
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [nationalityModalOpen, setNationalityModalOpen] = useState(false);
  const [documentTypeModalOpen, setDocumentTypeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [viewingContact, setViewingContact] = useState<any | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  // FAB Menu state
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Multi-Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const pressTimer = React.useRef<any>(null);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsContactSelectionMode(isSelectionMode);
    return () => {
      setIsContactSelectionMode(false);
    };
  }, [isSelectionMode, setIsContactSelectionMode]);

  // Source Selection State
  const [isSourceSelectionOpen, setIsSourceSelectionOpen] = useState(false);
  const [selectedSourceForScan, setSelectedSourceForScan] = useState<string | null>(null);
  const [scannedSourceContacts, setScannedSourceContacts] = useState<any[]>([]);
  const [scannedSourceCounts, setScannedSourceCounts] = useState<{ [key: string]: number }>({});
  const [isScanningSource, setIsScanningSource] = useState(false);
  const [sourcePreviewModalOpen, setSourcePreviewModalOpen] = useState(false);

  // Duplicate Resolution States
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [pendingImportList, setPendingImportList] = useState<any[]>([]);
  const [pendingDuplicateList, setPendingDuplicateList] = useState<any[]>([]);
  const [duplicateWarningPopup, setDuplicateWarningPopup] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    contactName?: string;
    phoneNumber?: string;
  } | null>(null);

  const countryOptions = (countries || []).map(c => ({
    label: c.name,
    value: c.name,
    icon: c.flag
  }));

  const nationalityOptions = (nationalities || []).map(n => ({
    label: n.name,
    value: n.name,
    icon: n.flag
  }));

  const documentTypeOptions = (idTypes && idTypes.length > 0 
    ? idTypes 
    : ['NID', 'Passport', 'Driving License', 'Visa', 'Work Permit']
  ).map(t => ({
    label: t,
    value: t
  }));
  
  const [formData, setFormData] = useState({
    photo: '',
    fullName: '',
    mobileNumber: '',
    countryCode: '',
    alternativeMobileNumber: '',
    alternativeCountryCode: '',
    emailAddress: '',
    companyName: '',
    designation: '',
    relationship: 'Client',
    nationality: '',
    documentType: '',
    documentNumber: '',
    country: '',
    city: '',
    address: '',
    notes: ''
  });

  // Automatically default countryCode and alternativeCountryCode when countries are loaded from control panel
  useEffect(() => {
    if (countries && countries.length > 0) {
      const defaultCode = countries[0].code;
      setFormData(prev => ({
        ...prev,
        countryCode: prev.countryCode || defaultCode,
        alternativeCountryCode: prev.alternativeCountryCode || defaultCode
      }));
    }
  }, [countries]);

  const relationshipOptions = [
    { label: 'Client', value: 'Client' },
    { label: 'Vendor', value: 'Vendor' },
    { label: 'Supplier', value: 'Supplier' },
    { label: 'Partner', value: 'Partner' },
    { label: 'Employee', value: 'Employee' },
    { label: 'Other', value: 'Other' },
  ];

  const getContactsSubPath = () => {
    if (!user) return '';
    const parentCol = user.role === 'ADMIN' ? 'admins' : 'users';
    return `${parentCol}/${user.id}/Contacts`;
  };

  useEffect(() => {
    if (!user) return;
    const path = getContactsSubPath();
    if (!path) return;

    // Load instantly from localStorage cache for this user
    try {
      const cachedKey = `fleetpro_contacts_cache_${user.id}`;
      const cached = localStorage.getItem(cachedKey);
      if (cached) {
        setContacts(JSON.parse(cached));
      }
    } catch (e) {
      console.warn('Failed to load contacts from cache:', e);
    }

    const unsubscribe = subscribeFirebaseCollection(path, (data) => {
      const contactsList = data || [];
      setContacts(contactsList);
      // Update cache
      try {
        const cachedKey = `fleetpro_contacts_cache_${user.id}`;
        localStorage.setItem(cachedKey, JSON.stringify(contactsList));
      } catch (e) {
        console.warn('Failed to save contacts to cache:', e);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const fetchContacts = async () => {
    // Real-time synchronization is handled automatically by subscribeFirebaseCollection
  };

  const cleanPhoneNumber = (num: string) => {
    if (!num) return '';
    const digits = num.replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  const cleanName = (name: string) => {
    if (!name) return '';
    return name.trim().toLowerCase();
  };

  const handleImportFromPhone = async () => {
    if (!Capacitor.isNativePlatform()) {
      setIsSourceSelectionOpen(true);
      return;
    }
    
    // Check permissions first before showing source selection
    let permStatus;
    try {
      permStatus = await Contacts.checkPermissions();
    } catch (err) {
      console.error('checkPermissions error:', err);
    }

    if (!permStatus || permStatus.contacts !== 'granted') {
      try {
        permStatus = await Contacts.requestPermissions();
      } catch (err) {
        console.error('requestPermissions error:', err);
      }
    }

    if (!permStatus || (permStatus.contacts !== 'granted' && permStatus.contacts !== 'limited')) {
      showFeedback(
        language === 'bn'
          ? 'কন্টাক্ট পারমিশন দেওয়া হয়নি। অনুগ্রহ করে আপনার অ্যান্ড্রোয়েড সেটিংস থেকে কন্টাক্ট পারমিশন চালু করুন।'
          : 'Contacts permission required. Please enable it in Settings.',
        'error'
      );
      try {
        await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
      } catch (e) {
        console.error('Failed to open settings', e);
      }
      return;
    }
    
    // Open source selection modal
    setIsSourceSelectionOpen(true);
  };

  const scanSourceContacts = async (sourceId: string) => {
    setIsSourceSelectionOpen(false);
    setIsScanningSource(true);
    setSelectedSourceForScan(sourceId);

    try {
      let mappedContacts: any[] = [];

      if (!Capacitor.isNativePlatform()) {
        // Web simulation contacts with exact count
        const simCounts: { [key: string]: number } = {
          'Google Account': 248,
          'Device Storage': 112,
          'SIM Card': 45
        };
        const targetCount = simCounts[sourceId] || 50;

        for (let i = 1; i <= targetCount; i++) {
          mappedContacts.push({
            fullName: `Simulated Contact ${i}`,
            mobileNumber: `01${Math.floor(100000000 + Math.random() * 900000000)}`,
            countryCode: '+880',
            emailAddress: `contact${i}@example.com`,
            companyName: sourceId === 'Google Account' ? 'Google Cloud' : sourceId === 'Device Storage' ? 'Local Enterprise' : 'Telecom Partner',
            designation: 'Professional',
            relationship: 'Client',
            photo: '',
            alternativeMobileNumber: '',
            alternativeCountryCode: '',
            country: 'Bangladesh',
            city: 'Dhaka',
            address: 'Main Street',
            notes: `Scanned from ${sourceId}`
          });
        }
      } else {
        const result = await Contacts.getContacts({
          projection: {
            name: true,
            phones: true,
            emails: true,
            organization: true
          }
        });

        const phoneContacts = result.contacts || [];
        mappedContacts = phoneContacts.map((c: any) => {
          const fullName = c.name?.display || [c.name?.given, c.name?.family].filter(Boolean).join(' ') || '';
          const rawPhone = c.phones?.[0]?.number || '';
          const email = c.emails?.[0]?.address || '';
          const company = c.organization?.company || '';
          const designation = c.organization?.jobTitle || '';

          // Extract country code if starts with +
          let countryCode = '';
          let mobileNumber = rawPhone;
          if (rawPhone.startsWith('+')) {
            if (rawPhone.startsWith('+880')) {
              countryCode = '+880';
              mobileNumber = rawPhone.slice(4);
            } else {
              const match = rawPhone.match(/^(\+\d{1,4})/);
              if (match) {
                countryCode = match[1];
                mobileNumber = rawPhone.slice(countryCode.length);
              }
            }
          }

          return {
            fullName: fullName.trim(),
            mobileNumber: mobileNumber.trim(),
            countryCode,
            emailAddress: email.trim(),
            companyName: company.trim(),
            designation: designation.trim(),
            relationship: 'Client',
            photo: '',
            alternativeMobileNumber: '',
            alternativeCountryCode: '',
            country: '',
            city: '',
            address: '',
            notes: `Scanned from ${sourceId}`
          };
        });
      }

      // Rule 8, 9, 10: Filter out invalid, empty, hidden, temp, or duplicate phone numbers within the source
      const validContactsMap = new Map<string, any>();
      for (const c of mappedContacts) {
        const cleanedPhone = cleanPhoneNumber(c.mobileNumber);
        // Rule 9: Invalid, empty, hidden, temporary, cached or sync records must never be counted or imported
        if (!cleanedPhone || cleanedPhone.length < 5) continue;
        if (!c.fullName && !c.mobileNumber) continue;
        // Rule 8: Duplicate detection based only on mobile number within source
        if (!validContactsMap.has(cleanedPhone)) {
          validContactsMap.set(cleanedPhone, c);
        }
      }

      const finalValidList = Array.from(validContactsMap.values());
      
      setScannedSourceContacts(finalValidList);
      setScannedSourceCounts(prev => ({
        ...prev,
        [sourceId]: finalValidList.length
      }));
      setSourcePreviewModalOpen(true);
    } catch (err) {
      console.error('Scan source error:', err);
      showFeedback(
        language === 'bn' ? 'সোর্স স্ক্যান করতে সমস্যা হয়েছে।' : 'Failed to scan source contacts.',
        'error'
      );
    } finally {
      setIsScanningSource(false);
    }
  };

  const confirmImportFromScanned = async () => {
    setSourcePreviewModalOpen(false);
    setLoading(true);
    try {
      const toImport: any[] = [];
      const toProcessDuplicates: any[] = [];

      for (const phoneContact of scannedSourceContacts) {
        const cleanPhoneInput = cleanPhoneNumber(phoneContact.mobileNumber);

        const duplicate = contacts.find(existing => {
          const cleanExistPhone = cleanPhoneNumber(existing.mobileNumber);
          return cleanPhoneInput && cleanExistPhone && cleanPhoneInput === cleanExistPhone;
        });

        if (duplicate) {
          toProcessDuplicates.push({
            phoneContact,
            existingContact: duplicate
          });
        } else {
          toImport.push(phoneContact);
        }
      }

      if (toProcessDuplicates.length === 0) {
        if (toImport.length === 0) {
          showFeedback(
            language === 'bn' ? 'কোনো নতুন কন্টাক্ট পাওয়া যায়নি।' : 'No new contacts found.',
            'info'
          );
          setLoading(false);
          return;
        }
        await saveImportedContacts(toImport);
        return;
      }

      setPendingImportList(toImport);
      setPendingDuplicateList(toProcessDuplicates);
      setDuplicateModalOpen(true);
      setLoading(false);
    } catch (err) {
      console.error(err);
      showFeedback(
        language === 'bn' ? 'কন্টাক্ট ইম্পোর্ট করতে সমস্যা হয়েছে।' : 'Failed to import phone contacts.',
        'error'
      );
      setLoading(false);
    }
  };

  const saveImportedContacts = async (newContactsList: any[], duplicatesToUpdate: any[] = []) => {
    setLoading(true);
    try {
      const path = getContactsSubPath();
      if (!path) return;

      let importedCount = 0;
            
      const savePromises: Promise<void>[] = [];

      for (const contactData of newContactsList) {
        const id = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9);
        const payload = {
          ...contactData,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        savePromises.push(saveFirebaseDoc(path, id, payload));
        importedCount++;
      }

      for (const dup of duplicatesToUpdate) {
        const existing = dup.existingContact;
        const phone = dup.phoneContact;
        const payload = {
          ...existing,
          fullName: phone.fullName || existing.fullName,
          mobileNumber: phone.mobileNumber || existing.mobileNumber,
          countryCode: phone.countryCode || existing.countryCode,
          emailAddress: phone.emailAddress || existing.emailAddress,
          companyName: phone.companyName || existing.companyName,
          designation: phone.designation || existing.designation,
          updatedAt: new Date().toISOString()
        };
        savePromises.push(saveFirebaseDoc(path, existing.id, payload));
        importedCount++;
      }

      await Promise.all(savePromises);

      await fetchContacts();
      showFeedback(
        language === "bn"
          ? `${importedCount}টি কন্টাক্ট সফলভাবে ইম্পোর্ট করা হয়েছে!`
          : `${importedCount} Contacts Imported Successfully.`,
        "success"
      );
    } catch (e) {
      console.error(e);
      showFeedback(
        language === "bn"
          ? "কন্টাক্ট সংরক্ষণ করতে সমস্যা হয়েছে।"
          : "Failed to save imported contacts.",
        "error"
      );
    } finally {
      setLoading(false);
      setDuplicateModalOpen(false);
      setPendingImportList([]);
      setPendingDuplicateList([]);
    }
  };

  const resetForm = () => {
    const defaultCode = countries && countries.length > 0 ? countries[0].code : '';
    setFormData({
      photo: '',
      fullName: '',
      mobileNumber: '',
      countryCode: defaultCode,
      alternativeMobileNumber: '',
      alternativeCountryCode: defaultCode,
      emailAddress: '',
      companyName: '',
      designation: '',
      relationship: 'Client',
      nationality: '',
      documentType: '',
      documentNumber: '',
      country: '',
      city: '',
      address: '',
      notes: ''
    });
    setEditingId(null);
  };

  const handleOpenForm = (contact?: any) => {
    if (contact) {
      const defaultCode = countries && countries.length > 0 ? countries[0].code : '';
      setFormData({
        photo: contact.photo || '',
        fullName: contact.fullName || '',
        mobileNumber: contact.mobileNumber || '',
        countryCode: contact.countryCode || defaultCode,
        alternativeMobileNumber: contact.alternativeMobileNumber || '',
        alternativeCountryCode: contact.alternativeCountryCode || defaultCode,
        emailAddress: contact.emailAddress || '',
        companyName: contact.companyName || '',
        designation: contact.designation || '',
        relationship: contact.relationship || 'Client',
        nationality: contact.nationality || '',
        documentType: contact.documentType || '',
        documentNumber: contact.documentNumber || '',
        country: contact.country || '',
        city: contact.city || '',
        address: contact.address || '',
        notes: contact.notes || ''
      });
      setEditingId(contact.id);
    } else {
      resetForm();
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const handleCancel = () => {
    setIsCancelling(true);
    setTimeout(() => {
      setIsCancelling(false);
      handleCloseForm();
    }, 600);
  };

  useEffect(() => {
    if (viewingContact) {
      setCustomHeaderTitle(language === 'bn' ? `ভিউ কন্টাক্ট - ${viewingContact.fullName}` : `View Contact - ${viewingContact.fullName}`);
      setCustomBackAction(() => {
        setViewingContact(null);
      });
    } else if (isFormOpen) {
      setCustomHeaderTitle(editingId ? (language === 'bn' ? 'কন্টাক্ট এডিট করুন' : 'Edit Contact') : (language === 'bn' ? 'নতুন কন্টাক্ট' : 'New Contact'));
      setCustomBackAction(() => {
        handleCancel();
      });
    } else {
      setCustomHeaderTitle(null);
      setCustomBackAction(null);
    }
    return () => {
      setCustomHeaderTitle(null);
      setCustomBackAction(null);
    };
  }, [viewingContact, isFormOpen, editingId, language, setCustomHeaderTitle, setCustomBackAction]);

  const duplicateMatch = useMemo(() => {
    if (!isFormOpen) return null;
    const cleanMobile = cleanPhoneNumber(formData.mobileNumber);
    const cleanAlt = cleanPhoneNumber(formData.alternativeMobileNumber);

    if ((!cleanMobile || cleanMobile.length < 6) && (!cleanAlt || cleanAlt.length < 6)) {
      return null;
    }

    for (const c of contacts) {
      if (editingId && c.id === editingId) continue;

      const existMobile = cleanPhoneNumber(c.mobileNumber);
      const existAlt = cleanPhoneNumber(c.alternativeMobileNumber);

      if (cleanMobile && cleanMobile.length >= 6) {
        if ((existMobile && cleanMobile === existMobile) || (existAlt && cleanMobile === existAlt)) {
          return { contact: c, field: 'mobileNumber' };
        }
      }

      if (cleanAlt && cleanAlt.length >= 6) {
        if ((existMobile && cleanAlt === existMobile) || (existAlt && cleanAlt === existAlt)) {
          return { contact: c, field: 'alternativeMobileNumber' };
        }
      }
    }

    if (cleanMobile && cleanAlt && cleanMobile.length >= 6 && cleanMobile === cleanAlt) {
      return { contact: null, field: 'sameInForm' };
    }

    return null;
  }, [formData.mobileNumber, formData.alternativeMobileNumber, contacts, editingId, isFormOpen]);

  const handleSave = async () => {
    if (!user) return;
    if (!formData.fullName || !formData.mobileNumber) {
      showFeedback(
        language === 'bn' 
          ? 'অনুগ্রহ করে নাম এবং মোবাইল নম্বর লিখুন!' 
          : 'Please enter Name and Mobile Number!', 
        'warning'
      );
      return;
    }

    if (duplicateMatch) {
      if (duplicateMatch.field === 'sameInForm') {
        setDuplicateWarningPopup({
          isOpen: true,
          title: language === 'bn' ? 'ডুপ্লিকেট নম্বর সতর্কতা' : 'Duplicate Number Warning',
          message: language === 'bn'
            ? 'মোবাইল নম্বর এবং অল্টারনেটিভ নম্বর একই হতে পারবে না! অনুগ্রহ করে ভিন্ন নম্বর ব্যবহার করুন।'
            : 'Mobile and Alternative Mobile numbers cannot be the same! Please use different numbers.',
          phoneNumber: formData.mobileNumber
        });
      } else {
        const contactName = duplicateMatch.contact?.fullName || (language === 'bn' ? 'অন্য একটি কন্টাক্ট' : 'Another contact');
        const dupPhone = duplicateMatch.field === 'mobileNumber' ? formData.mobileNumber : formData.alternativeMobileNumber;
        setDuplicateWarningPopup({
          isOpen: true,
          title: language === 'bn' ? 'নম্বর পূর্বে অ্যাড করা আছে!' : 'Number Already Exists!',
          message: language === 'bn'
            ? `এই নম্বরটি (${dupPhone}) ইতিমধ্যে আপনার তালিকায় অন্য কন্টাক্টে যোগ করা আছে। একই নম্বর একাধিকবার অ্যাড করা যাবে না।`
            : `This number (${dupPhone}) is already saved in another contact. Duplicate numbers cannot be added.`,
          contactName: contactName,
          phoneNumber: dupPhone
        });
      }
      return;
    }
    
    setIsSaving(true);
    try {
      const id = editingId || Date.now().toString();
      const payload = {
        ...formData,
        id,
        updatedAt: new Date().toISOString(),
        ...(editingId ? {} : { createdAt: new Date().toISOString() })
      };
      const path = getContactsSubPath();
      if (!path) return;
      await saveFirebaseDoc(path, id, payload);
      await fetchContacts();
      showFeedback(
        language === 'bn'
          ? 'কন্টাক্ট সফলভাবে সংরক্ষণ করা হয়েছে!'
          : 'Contact saved successfully!',
        'success'
      );
      handleCloseForm();
    } catch (e) {
      console.error(e);
      showFeedback(
        language === 'bn'
          ? 'কন্টাক্ট সংরক্ষণ করতে ব্যর্থ হয়েছে'
          : 'Failed to save contact',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    confirmAction(
      language === 'bn' 
        ? 'আপনি কি এই কন্টাক্টটি ডিলিট করতে চান?' 
        : 'Are you sure you want to delete this contact?',
      async () => {
        try {
          const path = getContactsSubPath();
          if (!path) return;
          await deleteFirebaseDoc(path, id);
          await fetchContacts();
          showFeedback(
            language === 'bn'
              ? 'কন্টাক্ট সফলভাবে ডিলিট করা হয়েছে!'
              : 'Contact deleted successfully!',
            'success'
          );
        } catch (e) {
          console.error(e);
          showFeedback(
            language === 'bn'
              ? 'কন্টাক্ট ডিলিট করতে ব্যর্থ হয়েছে'
              : 'Failed to delete contact',
            'error'
          );
        }
      }
    );
  };

  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const originalDataUrl = reader.result as string;
            const compressedDataUrl = await compressImage(originalDataUrl, 400, 400, 0.7);
            setFormData(prev => ({ ...prev, photo: compressedDataUrl }));
          } catch (error) {
            console.error('Image compression failed:', error);
            // Fallback to original image if compression fails
            setFormData(prev => ({ ...prev, photo: reader.result as string }));
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleDownloadPDF = async (contact: any) => {
    try {
      showFeedback(
        language === 'bn' ? 'পিডিএফ তৈরি হচ্ছে...' : 'Generating PDF...',
        'success'
      );

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header Banner
      doc.setFillColor(30, 60, 114); // #1e3c72
      doc.rect(0, 0, 210, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text((contact.fullName || '').toUpperCase(), 15, 16);
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(
        language === 'bn' ? 'ফ্লিটপ্রো কন্টাক্ট ইনফরমেশন রিপোর্ট' : 'FLEETPRO CONTACT INFORMATION REPORT', 
        15, 
        25
      );

      // Add profile photo if available or custom circular initial avatar
      if (contact.photo && contact.photo.startsWith('data:image')) {
        try {
          doc.addImage(contact.photo, 'JPEG', 165, 5, 25, 25);
        } catch (e) {
          console.error('Error adding photo to PDF:', e);
        }
      } else {
        doc.setFillColor(255, 255, 255);
        doc.ellipse(177.5, 17.5, 12, 12, 'F');
        doc.setTextColor(30, 60, 114);
        doc.setFontSize(14);
        doc.setFont('Helvetica', 'bold');
        const initial = contact.fullName ? contact.fullName.charAt(0).toUpperCase() : 'C';
        doc.text(initial, 177.5, 21.5, { align: 'center' });
      }

      // Personal details rows
      const personalRows = [
        [language === 'bn' ? 'পূর্ণ নাম' : 'FULL NAME', contact.fullName || '--'],
        [language === 'bn' ? 'সম্পর্ক' : 'RELATIONSHIP', contact.relationship || 'Employee'],
        [language === 'bn' ? 'মোবাইল নম্বর' : 'MOBILE NUMBER', (contact.countryCode ? contact.countryCode + ' ' : '') + contact.mobileNumber],
      ];

      if (contact.alternativeMobileNumber) {
        personalRows.push([
          language === 'bn' ? 'বিকল্প মোবাইল নম্বর' : 'ALTERNATIVE MOBILE', 
          (contact.alternativeCountryCode ? contact.alternativeCountryCode + ' ' : '') + contact.alternativeMobileNumber
        ]);
      }

      personalRows.push([language === 'bn' ? 'ইমেইল এড্রেস' : 'EMAIL ADDRESS', contact.emailAddress || '--']);

      if (contact.nationality) {
        personalRows.push([language === 'bn' ? 'জাতীয়তা' : 'NATIONALITY', contact.nationality]);
      }

      if (contact.documentType) {
        personalRows.push([language === 'bn' ? 'ডকুমেন্ট টাইপ' : 'DOCUMENT TYPE', contact.documentType]);
      }

      if (contact.documentNumber) {
        personalRows.push([
          getDocumentNumberLabel(contact.documentType).toUpperCase(), 
          contact.documentNumber
        ]);
      }

      if (contact.notes) {
        personalRows.push([language === 'bn' ? 'নোটস' : 'NOTES', contact.notes]);
      }

      // Company and Location details rows
      const companyRows = [
        [
          language === 'bn' ? 'কোম্পানি ও পদবী' : 'COMPANY & DESIGNATION', 
          [contact.designation, contact.companyName].filter(Boolean).join(', ') || '--'
        ],
        [
          language === 'bn' ? 'ঠিকানা' : 'ADDRESS', 
          [contact.address, contact.city, contact.country].filter(Boolean).join(', ') || '--'
        ]
      ];

      autoTable(doc, {
        startY: 45,
        head: [[language === 'bn' ? 'ব্যক্তিগত বিবরণ' : 'PERSONAL DETAILS', '']],
        body: personalRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 60, 114], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold', textColor: [127, 140, 141] },
          1: { textColor: [44, 62, 80] }
        }
      });

      const nextY = (doc as any).lastAutoTable.finalY + 10;

      autoTable(doc, {
        startY: nextY,
        head: [[language === 'bn' ? 'কোম্পানি এবং অবস্থান বিবরণ' : 'COMPANY & LOCATION DETAILS', '']],
        body: companyRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 60, 114], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold', textColor: [127, 140, 141] },
          1: { textColor: [44, 62, 80] }
        }
      });

      const footerY = (doc as any).lastAutoTable.finalY + 15;
      
      doc.setDrawColor(203, 213, 225);
      doc.line(15, footerY, 195, footerY);

      doc.setTextColor(136, 136, 136);
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'bold');
      doc.text('FLEETPRO MANAGEMENT SYSTEM', 105, footerY + 8, { align: 'center' });
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      const dateStr = new Date().toLocaleDateString();
      doc.text(`Report Generated on: ${dateStr}`, 105, footerY + 14, { align: 'center' });

      const pdfFileName = `Contact_${contact.fullName.replace(/\s+/g, '_')}.pdf`;
      await downloadPdf(doc, pdfFileName, showFeedback, language);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      showFeedback(
        language === 'bn' ? 'পিডিএফ তৈরি করতে সমস্যা হয়েছে।' : 'Error generating PDF.',
        'error'
      );
    }
  };

  const searchTerms = searchQuery.toLowerCase().split(' ').filter(Boolean);
  const filteredContacts = contacts.filter(c => {
    if (searchTerms.length === 0) return true;
    const name = c.fullName?.toLowerCase() || '';
    const mobile = c.mobileNumber || '';
    const cCode = c.countryCode || '';
    const altMobile = c.alternativeMobileNumber || '';
    const altCCode = c.alternativeCountryCode || '';
    const fullMobile1 = cCode + mobile;
    const fullMobile2 = altCCode + altMobile;
    const company = c.companyName?.toLowerCase() || '';

    return searchTerms.every(term => 
      name.includes(term) ||
      mobile.includes(term) ||
      fullMobile1.includes(term) ||
      fullMobile2.includes(term) ||
      company.includes(term)
    );
  });

  const wasLongPressed = React.useRef(false);

  const handlePressStart = (contactId: string) => {
    if (isSelectionMode) return;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    wasLongPressed.current = false;
    pressTimer.current = setTimeout(() => {
      pressTimer.current = null;
      wasLongPressed.current = true;
      setIsSelectionMode(true);
      setSelectedContactIds(new Set([contactId]));
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = (contactId: string, contact: any) => {
    if (wasLongPressed.current) {
      wasLongPressed.current = false;
      return;
    }
    if (isSelectionMode) {
      toggleSelection(contactId);
    } else {
      setViewingContact(contact);
    }
  };

  const toggleSelection = (contactId: string) => {
    const next = new Set(selectedContactIds);
    if (next.has(contactId)) {
      next.delete(contactId);
      if (next.size === 0) setIsSelectionMode(false);
    } else {
      next.add(contactId);
    }
    setSelectedContactIds(next);
  };

  const handleSelectAll = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedContactIds(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    confirmAction(
      language === 'bn' ? 'আপনি কি নির্বাচিত কন্টাক্টগুলো মুছে ফেলতে চান?' : 'Are you sure you want to delete selected contacts?',
      async () => {
        setLoading(true);
        try {
          const path = getContactsSubPath();
          const itemsToDelete = Array.from(selectedContactIds as Set<string>).map(id => ({ id }));
          await clearFirebaseCollection(path, itemsToDelete);
          setIsSelectionMode(false);
          setSelectedContactIds(new Set());
          showFeedback(language === 'bn' ? 'সফলভাবে মুছে ফেলা হয়েছে' : 'Successfully deleted', 'success');
        } catch (e) {
          showFeedback('Error deleting contacts', 'error');
        }
        setLoading(false);
      }
    );
  };

  const handleBulkShare = async () => {
    const selected = contacts.filter(c => selectedContactIds.has(c.id));
    const text = selected.map(c => `${c.fullName}: ${c.countryCode || ''}${c.mobileNumber}`).join('\\n');
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared Contacts',
          text
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      await navigator.clipboard.writeText(text);
      showFeedback('Contacts copied to clipboard', 'success');
    }
  };

  const handleBulkExport = () => {
    const selected = contacts.filter(c => selectedContactIds.has(c.id));
    let csv = "Name,Phone,Email,Company\\n";
    selected.forEach(c => {
      csv += `"${c.fullName || ''}","${c.countryCode || ''}${c.mobileNumber || ''}","${c.emailAddress || ''}","${c.companyName || ''}"\\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "contacts_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    setIsSelectionMode(false);
    setSelectedContactIds(new Set());
  };

  return (
    <div className="flex-1 flex flex-col relative">
      {typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {isSelectionMode && (
            <>
              {/* Backdrop overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={() => { setIsSelectionMode(false); setSelectedContactIds(new Set()); }}
                className={`fixed top-0 left-0 right-0 bottom-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/30'} backdrop-blur-md md:backdrop-blur-lg z-[10000] global-select-backdrop`}
              />
              
              {/* Main Selection Sheet (Floating Modal Card matching screenshot) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className={`fixed left-4 right-4 bottom-8 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-auto md:w-full max-w-[420px] rounded-[24px] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200/80 dark:border-white/10 z-[10001] flex flex-col space-y-4 ${
                  isDarkMode 
                    ? 'bg-[#121212] text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
                    : 'bg-white text-zinc-900'
                }`}
              >
                {/* Header row: Count and Cancel button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">
                    {selectedContactIds.size} {language === 'bn' ? 'কন্টাক্ট সিলেক্ট করা হয়েছে' : 'Contacts Selected'}
                  </span>
                  <button 
                    onClick={() => { setIsSelectionMode(false); setSelectedContactIds(new Set()); }} 
                    className={`px-4 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                      isDarkMode 
                        ? 'border-white/10 bg-white/10 hover:bg-white/15 text-zinc-200' 
                        : 'border-zinc-200/80 bg-[#f4f4f6] hover:bg-zinc-200/70 text-zinc-800'
                    }`}
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>

                {/* Horizontal divider line */}
                <div className="border-b border-zinc-200/70 dark:border-white/10 w-full my-0.5" />

                {/* 2x2 Grid of Actions */}
                <div className="grid grid-cols-2 gap-3.5">
                  {/* 1. Select All */}
                  <button
                    onClick={handleSelectAll}
                    className={`flex items-center gap-3 p-3 rounded-2xl border border-transparent cursor-pointer transition-all text-left w-full h-[70px] ${
                      isDarkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white' 
                        : 'bg-[#f4f4f6] hover:bg-zinc-200/60 text-zinc-900'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-100/90 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      <AlignLeft size={20} />
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="font-bold text-xs sm:text-[13px] text-zinc-900 dark:text-white truncate">
                        {selectedContactIds.size === filteredContacts.length ? (language === 'bn' ? 'সব বাতিল' : 'Deselect All') : (language === 'bn' ? 'সব সিলেক্ট' : 'Select All')}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate">
                        {selectedContactIds.size === filteredContacts.length ? (language === 'bn' ? 'সব ক্লিয়ার' : 'Clear selections') : (language === 'bn' ? 'সব আইটেম' : 'All items')}
                      </span>
                    </div>
                  </button>

                  {/* 2. Share */}
                  <button
                    onClick={handleBulkShare}
                    disabled={selectedContactIds.size === 0}
                    className={`flex items-center gap-3 p-3 rounded-2xl border border-transparent cursor-pointer transition-all text-left w-full h-[70px] disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDarkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white' 
                        : 'bg-[#f4f4f6] hover:bg-zinc-200/60 text-zinc-900'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <Share2 size={20} />
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="font-bold text-xs sm:text-[13px] text-zinc-900 dark:text-white truncate">
                        {language === 'bn' ? 'শেয়ার' : 'Share'}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate">
                        {language === 'bn' ? 'নির্বাচিত পাঠান' : 'Send selected'}
                      </span>
                    </div>
                  </button>

                  {/* 3. Export / Input */}
                  <button
                    onClick={handleBulkExport}
                    disabled={selectedContactIds.size === 0}
                    className={`flex items-center gap-3 p-3 rounded-2xl border border-transparent cursor-pointer transition-all text-left w-full h-[70px] disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDarkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white' 
                        : 'bg-[#f4f4f6] hover:bg-zinc-200/60 text-zinc-900'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-100/90 dark:bg-indigo-500/20 text-blue-600 dark:text-indigo-400">
                      <Download size={20} />
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="font-bold text-xs sm:text-[13px] text-zinc-900 dark:text-white truncate">
                        {language === 'bn' ? 'এক্সপোর্ট/ইনপুট' : 'Export / Input'}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate">
                        {language === 'bn' ? 'সিএসভি সেভ করুন' : 'Save CSV'}
                      </span>
                    </div>
                  </button>

                  {/* 4. Delete */}
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedContactIds.size === 0}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all text-left w-full h-[70px] disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDarkMode 
                        ? 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 text-rose-400' 
                        : 'bg-rose-50/80 border-rose-200/60 hover:bg-rose-100/60 text-rose-600'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-rose-100 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400">
                      <Trash2 size={20} />
                    </div>
                    <div className="flex flex-col min-w-0 leading-tight">
                      <span className="font-bold text-xs sm:text-[13px] text-rose-600 dark:text-rose-400 truncate">
                        {language === 'bn' ? 'ডিলিট' : 'Delete'}
                      </span>
                      <span className="text-[11px] text-rose-400 dark:text-rose-300/80 font-normal mt-0.5 truncate">
                        {language === 'bn' ? 'আইটেম মুছুন' : 'Remove items'}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Close Panel Button */}
                <button 
                  onClick={() => { setIsSelectionMode(false); setSelectedContactIds(new Set()); }} 
                  className={`w-full h-12 active:scale-98 transition-all font-semibold rounded-xl text-sm flex items-center justify-center mt-1 ${
                    isDarkMode 
                      ? 'bg-white/10 hover:bg-white/15 text-white' 
                      : 'bg-[#f4f4f6] hover:bg-zinc-200/70 text-zinc-800'
                  }`}
                >
                  {language === 'bn' ? 'প্যানেল বন্ধ করুন' : 'Close Panel'}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      ) : null}

      <div className="flex-1 flex flex-col">
        {!isFormOpen ? (
        <div className="space-y-4 md:space-y-6 pb-24 transition-all duration-300">
          
          {/* Search */}
          <InputField
            label={language === 'bn' ? 'কন্টাক্ট খুঁজুন...' : 'Search contacts...'}
            name="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { setIsSearchFocused(true); setIsFabMenuOpen(false); }}
            onBlur={() => setIsSearchFocused(false)}
            icon={<Search size={20} />}
            className="h-14 mb-2"
          />

          {/* Contact Count */}
          <div className="text-sm font-semibold text-text-muted px-1 -mt-2">
            {language === 'bn' 
              ? `মোট কন্টাক্ট: ${filteredContacts.length}টি` 
              : `Total Contacts: ${filteredContacts.length}`}
          </div>

          {/* Contact List */}
          {filteredContacts.length === 0 ? (
            <div className="text-center text-text-muted mt-10">
              {language === 'bn' ? 'কোনো কন্টাক্ট পাওয়া যায়নি।' : 'No contacts found.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContacts.map(contact => (
                <div 
                   key={contact.id} 
                   className={`bg-card-bg p-4 rounded-[10px] border shadow-sm flex items-center gap-4 cursor-pointer transition-all ${selectedContactIds.has(contact.id) ? 'border-primary bg-primary/5' : 'border-black/5 dark:border-white/5 hover:border-primary/30'}`}
                   onClick={() => handleClick(contact.id, contact)}
                   onTouchStart={() => handlePressStart(contact.id)}
                   onTouchEnd={handlePressEnd}
                   onTouchCancel={handlePressEnd}
                   onTouchMove={handlePressEnd}
                   onMouseDown={() => handlePressStart(contact.id)}
                   onMouseUp={handlePressEnd}
                   onMouseLeave={handlePressEnd}
                >
                  <div className="w-14 h-14 rounded-[10px] bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {contact.photo ? (
                      <img src={contact.photo} alt={contact.fullName} className="w-full h-full object-cover rounded-[10px]" />
                    ) : (
                      <User className="text-primary" size={24} />
                    )}
                    {isSelectionMode && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-[10px]">
                        {selectedContactIds.has(contact.id) ? (
                          <CheckCircle2 className="text-white fill-primary" size={24} />
                        ) : (
                          <Circle className="text-white/80" size={24} />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-main truncate">{contact.fullName}</h3>
                    <div className="mt-0.5">
                      <a 
                        href={`tel:${contact.countryCode || ''}${contact.mobileNumber}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-primary hover:underline font-medium inline-block"
                      >
                        {(contact.countryCode ? contact.countryCode + ' ' : '') + contact.mobileNumber}
                      </a>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setViewingContact(contact); }}
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors flex items-center justify-center"
                    title={language === 'bn' ? 'কন্টাক্ট দেখুন' : 'View Contact'}
                  >
                    <Eye size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 pb-24">
          {/* Main Card with all components inside */}
          <div className="bg-card-bg p-4 md:p-6 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm space-y-6 max-w-4xl mx-auto">
            
            {/* Photo Upload and Form Fields with reduced gap in between */}
            <div className="flex flex-col">
              {/* Photo Upload inside the card */}
              <div className="flex flex-col items-center justify-center">
                <div 
                  onClick={handlePhotoUpload}
                  className="w-24 h-24 rounded-[10px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center cursor-pointer overflow-hidden relative group"
                >
                  {formData.photo ? (
                    <>
                      <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera className="text-white" size={24} />
                      </div>
                    </>
                  ) : (
                    <Camera className="text-text-muted/50" size={32} />
                  )}
                </div>
                {formData.photo && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, photo: '' })); }}
                    className="mt-2 text-xs text-red-500 font-medium"
                  >
                    Remove Photo
                  </button>
                )}
              </div>

              {/* Form Fields - directly below with a tiny margin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <InputField
                  label="Full Name *"
                  name="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({...prev, fullName: e.target.value}))}
                  icon={<User size={18} />}
                />
                <div className="flex gap-2">
                  <CountryCodeDropdown
                    selectedCode={formData.countryCode}
                    onSelect={(code) => setFormData(prev => ({ ...prev, countryCode: code }))}
                  />
                  <div className="flex-1">
                    <InputField
                      label="Mobile Number *"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData(prev => ({...prev, mobileNumber: e.target.value}))}
                      icon={<Phone size={18} />}
                    />
                    {duplicateMatch && (duplicateMatch.field === 'mobileNumber' || duplicateMatch.field === 'sameInForm') && (
                      <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                          {duplicateMatch.field === 'sameInForm'
                            ? (language === 'bn' ? 'মোবাইল এবং অল্টারনেটিভ নম্বর একই হতে পারবে না!' : 'Mobile and Alternative numbers cannot be the same!')
                            : (language === 'bn' 
                                ? `এই নম্বর পূর্বে অ্যাড করা আছে! (${duplicateMatch.contact?.fullName || 'অন্য কন্টাক্ট'})` 
                                : `This number is already added! (${duplicateMatch.contact?.fullName || 'Another contact'})`
                              )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <CountryCodeDropdown
                    selectedCode={formData.alternativeCountryCode}
                    onSelect={(code) => setFormData(prev => ({ ...prev, alternativeCountryCode: code }))}
                  />
                  <div className="flex-1">
                    <InputField
                      label="Alternative Mobile Number"
                      name="alternativeMobileNumber"
                      value={formData.alternativeMobileNumber}
                      onChange={(e) => setFormData(prev => ({...prev, alternativeMobileNumber: e.target.value}))}
                      icon={<PhoneCall size={18} />}
                    />
                    {duplicateMatch && duplicateMatch.field === 'alternativeMobileNumber' && (
                      <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                        <AlertTriangle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>
                          {language === 'bn' 
                            ? `এই নম্বর পূর্বে অ্যাড করা আছে! (${duplicateMatch.contact?.fullName || 'অন্য কন্টাক্ট'})` 
                            : `This number is already added! (${duplicateMatch.contact?.fullName || 'Another contact'})`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <InputField
                  label="Email Address"
                  name="emailAddress"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => setFormData(prev => ({...prev, emailAddress: e.target.value}))}
                  icon={<Mail size={18} />}
                />
                <InputField
                  label="Company Name"
                  name="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({...prev, companyName: e.target.value}))}
                  icon={<Building size={18} />}
                />
                <InputField
                  label="Designation"
                  name="designation"
                  value={formData.designation}
                  onChange={(e) => setFormData(prev => ({...prev, designation: e.target.value}))}
                  icon={<User size={18} />}
                />
                <InputField
                  label="Relationship"
                  name="relationship"
                  type="select"
                  options={relationshipOptions}
                  value={formData.relationship}
                  onChange={(e) => setFormData(prev => ({...prev, relationship: e.target.value}))}
                  onOpenModal={() => setSelectModalOpen(true)}
                  icon={<User size={18} />}
                />
                <InputField
                  label={language === 'bn' ? 'জাতীয়তা' : 'Nationality'}
                  name="nationality"
                  type="select"
                  options={nationalityOptions}
                  value={formData.nationality}
                  onChange={(e) => setFormData(prev => ({...prev, nationality: e.target.value}))}
                  onOpenModal={() => setNationalityModalOpen(true)}
                  icon={<Globe size={18} />}
                />
                <InputField
                  label={language === 'bn' ? 'ডকুমেন্ট টাইপ' : 'Document Type'}
                  name="documentType"
                  type="select"
                  options={documentTypeOptions}
                  value={formData.documentType}
                  onChange={(e) => setFormData(prev => ({...prev, documentType: e.target.value}))}
                  onOpenModal={() => setDocumentTypeModalOpen(true)}
                  icon={<FileText size={18} />}
                />
                {formData.documentType && (
                  <InputField
                    label={getDocumentNumberLabel(formData.documentType)}
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData(prev => ({...prev, documentNumber: e.target.value}))}
                    icon={<FileText size={18} />}
                  />
                )}
                <InputField
                  label="Country"
                  name="country"
                  type="select"
                  options={countryOptions}
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({...prev, country: e.target.value}))}
                  onOpenModal={() => setCountryModalOpen(true)}
                  icon={<MapIcon size={18} />}
                />
                <InputField
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({...prev, city: e.target.value}))}
                  icon={<Navigation size={18} />}
                />
                <div className="md:col-span-2">
                  <InputField
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                    icon={<MapPin size={18} />}
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="input-field-container relative w-full h-[100px] border border-black/10 dark:border-white/10 rounded-2xl group transition-all duration-300 focus-within:border-primary">
                    <div className="absolute left-4 top-4 text-text-muted/60 pointer-events-none group-focus-within:text-primary transition-colors z-10">
                      <AlignLeft size={18} />
                    </div>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                      placeholder="Notes (Optional)"
                      className="w-full h-full bg-transparent outline-none resize-none pt-4 pb-4 pl-12 pr-4 text-text-main"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-black/5 dark:border-white/5 pt-2" />

            {/* Cancel and Save/Submit Buttons on the bottom of the Card */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving || isCancelling}
                className="flex-1 py-4 rounded-lg font-bold bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-500/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'বাতিল হচ্ছে...' : 'Cancelling...'}</span>
                  </>
                ) : (
                  language === 'bn' ? 'বাতিল' : 'Cancel'
                )}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isCancelling}
                className="flex-1 py-4 rounded-lg font-bold bg-green-500 text-white hover:bg-green-600 transition-all shadow-lg shadow-green-500/10 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{language === 'bn' ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                  </>
                ) : (
                  language === 'bn' ? 'কন্টাক্ট সেভ করুন' : 'Save Contact'
                )}
              </button>
            </div>

          </div>
        </div>
      )}
      </div>
      {/* FAB Menu & Overlay (PORTALED TO COVER BOTTOM NAV & SCREEN) */}
      {!isFormOpen && !isSearchFocused && !isSelectionMode && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop Blur */}
          <AnimatePresence>
            {isFabMenuOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[1200] bg-black/10 backdrop-blur-[2px] cursor-pointer"
                onClick={() => setIsFabMenuOpen(false)}
              />
            )}
          </AnimatePresence>

          <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+80px)] right-6 z-[1250] flex flex-col items-end gap-3">
            <AnimatePresence>
              {isFabMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="bg-white dark:bg-card rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/10 p-2 min-w-[220px] flex flex-col gap-1"
                >
                  <button
                    onClick={() => {
                      setIsFabMenuOpen(false);
                      handleOpenForm();
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer w-full text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Plus size={18} />
                    </div>
                    <span className="font-medium">
                      {language === 'bn' ? 'নতুন কন্টাক্ট' : 'New Contact'}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setIsFabMenuOpen(false);
                      handleImportFromPhone();
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer w-full text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 flex items-center justify-center">
                      <Download size={18} />
                    </div>
                    <span className="font-medium">
                      {language === 'bn' ? 'ফোন থেকে ইম্পোর্ট করুন' : 'Import from Phone Contacts'}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main FAB */}
            <button
              onClick={() => setIsFabMenuOpen(!isFabMenuOpen)}
              className="w-14 h-14 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus 
                size={24} 
                className={`transform transition-transform duration-200 ${isFabMenuOpen ? 'rotate-45' : ''}`}
              />
            </button>
          </div>
        </>,
        document.body
      )}

      {/* Hidden printable div for PDF rendering */}
      <div 
        ref={printRef} 
        className="fixed -left-[9999px] top-0"
        style={{ 
          display: 'none', 
          fontFamily: 'Arial, Helvetica, sans-serif',
          width: '800px',
          backgroundColor: '#f4f7f6',
          padding: '30px',
          boxSizing: 'border-box'
        }}
      >
        {viewingContact && (
          <div style={{ width: '100%', boxSizing: 'border-box' }}>
            {/* HEADER CARD */}
            <table 
              style={{
                width: '100%',
                backgroundColor: '#1e3c72',
                borderRadius: '14px',
                marginBottom: '20px',
                borderCollapse: 'collapse',
                boxSizing: 'border-box'
              }} 
              cellSpacing="0" 
              cellPadding="0"
            >
              <tbody>
                <tr>
                  <td align="center" style={{ padding: '25px 20px', textAlign: 'center' }}>
                    {viewingContact.photo ? (
                      <img 
                        src={viewingContact.photo} 
                        style={{
                          width: '130px',
                          height: '130px',
                          borderRadius: '65px',
                          border: '4px solid #ffffff',
                          objectFit: 'cover',
                          display: 'inline-block'
                        }} 
                        alt="Profile" 
                        crossOrigin="anonymous" 
                      />
                    ) : (
                      <div 
                        style={{
                          width: '130px',
                          height: '130px',
                          borderRadius: '65px',
                          border: '4px solid #ffffff',
                          backgroundColor: '#ffffff',
                          color: '#1e3c72',
                          display: 'inline-block',
                          fontSize: '48px',
                          fontWeight: 'bold',
                          lineHeight: '122px',
                          textAlign: 'center'
                        }}
                      >
                        {viewingContact.fullName ? viewingContact.fullName.charAt(0).toUpperCase() : 'C'}
                      </div>
                    )}
                    <br />
                    <div 
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginTop: '10px',
                        marginBottom: '6px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        textAlign: 'center'
                      }}
                    >
                      {viewingContact.fullName}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* PERSONAL DETAILS CARD */}
            <table 
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                marginBottom: '20px',
                borderCollapse: 'collapse',
                boxSizing: 'border-box'
              }} 
              cellSpacing="0" 
              cellPadding="0"
            >
              <tbody>
                <tr>
                  <td style={{ padding: '0px 24px 12px 24px' }}>
                    <div 
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#1e3c72',
                        textTransform: 'uppercase',
                        borderBottom: '2px solid #cbd5e1',
                        paddingTop: '8px',
                        paddingBottom: '12px',
                        marginBottom: '8px',
                        letterSpacing: '0.5px',
                        textAlign: 'left',
                        lineHeight: '1'
                      }}
                    >
                      {language === 'bn' ? 'ব্যক্তিগত বিবরণ' : 'PERSONAL DETAILS'}
                    </div>
                    <table 
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                      }} 
                      cellSpacing="0" 
                      cellPadding="0"
                    >
                      <tbody>
                        {[
                          { label: language === 'bn' ? 'পূর্ণ নাম' : 'FULL NAME', value: viewingContact.fullName },
                          { label: language === 'bn' ? 'সম্পর্ক' : 'RELATIONSHIP', value: viewingContact.relationship || 'Employee' },
                          { label: language === 'bn' ? 'মোবাইল নম্বর' : 'MOBILE NUMBER', value: (viewingContact.countryCode ? viewingContact.countryCode + ' ' : '') + viewingContact.mobileNumber },
                          viewingContact.alternativeMobileNumber ? { label: language === 'bn' ? 'বিকল্প মোবাইল নম্বর' : 'ALTERNATIVE MOBILE', value: (viewingContact.alternativeCountryCode ? viewingContact.alternativeCountryCode + ' ' : '') + viewingContact.alternativeMobileNumber } : null,
                          { label: language === 'bn' ? 'ইমেইল এড্রেস' : 'EMAIL ADDRESS', value: viewingContact.emailAddress || '--' },
                          viewingContact.nationality ? { label: language === 'bn' ? 'জাতীয়তা' : 'NATIONALITY', value: viewingContact.nationality } : null,
                          viewingContact.documentType ? { label: language === 'bn' ? 'ডকুমেন্ট টাইপ' : 'DOCUMENT TYPE', value: viewingContact.documentType } : null,
                          viewingContact.documentNumber ? { label: getDocumentNumberLabel(viewingContact.documentType).toUpperCase(), value: viewingContact.documentNumber } : null,
                          viewingContact.notes ? { label: language === 'bn' ? 'নোটস' : 'NOTES', value: viewingContact.notes } : null,
                        ].filter(Boolean).map((item, index, arr) => (
                           <tr key={index}>
                             <td 
                              style={{
                                width: '35%',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#7f8c8d',
                                textTransform: 'uppercase',
                                paddingTop: '4px',
                                paddingBottom: '16px',
                                paddingLeft: '4px',
                                paddingRight: '4px',
                                borderBottom: index === arr.length - 1 ? 'none' : '1px solid #cbd5e1',
                                verticalAlign: 'middle',
                                textAlign: 'left',
                                lineHeight: '1.2'
                              }}
                            >
                              {item.label}
                            </td>
                            <td 
                              style={{
                                width: '65%',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#2c3e50',
                                paddingTop: '4px',
                                paddingBottom: '16px',
                                paddingLeft: '4px',
                                paddingRight: '4px',
                                borderBottom: index === arr.length - 1 ? 'none' : '1px solid #cbd5e1',
                                verticalAlign: 'middle',
                                textAlign: 'left',
                                lineHeight: '1.2',
                                whiteSpace: item.label === (language === 'bn' ? 'নোটস' : 'NOTES') ? 'pre-wrap' : 'normal'
                              }}
                            >
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* COMPANY DETAILS CARD */}
            <table 
              style={{
                width: '100%',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                marginBottom: '20px',
                borderCollapse: 'collapse',
                boxSizing: 'border-box'
              }} 
              cellSpacing="0" 
              cellPadding="0"
            >
              <tbody>
                <tr>
                  <td style={{ padding: '0px 24px 12px 24px' }}>
                    <div 
                      style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#1e3c72',
                        textTransform: 'uppercase',
                        borderBottom: '2px solid #cbd5e1',
                        paddingTop: '8px',
                        paddingBottom: '12px',
                        marginBottom: '8px',
                        letterSpacing: '0.5px',
                        textAlign: 'left',
                        lineHeight: '1'
                      }}
                    >
                      {language === 'bn' ? 'কোম্পানি এবং অবস্থান বিবরণ' : 'COMPANY & LOCATION DETAILS'}
                    </div>
                    <table 
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                      }} 
                      cellSpacing="0" 
                      cellPadding="0"
                    >
                      <tbody>
                        {[
                          { label: language === 'bn' ? 'কোম্পানি ও পদবী' : 'COMPANY & DESIGNATION', value: [viewingContact.designation, viewingContact.companyName].filter(Boolean).join(', ') || '--' },
                          { label: language === 'bn' ? 'ঠিকানা' : 'ADDRESS', value: [viewingContact.address, viewingContact.city, viewingContact.country].filter(Boolean).join(', ') || '--' },
                        ].map((item, index, arr) => (
                          <tr key={index}>
                            <td 
                              style={{
                                width: '35%',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#7f8c8d',
                                textTransform: 'uppercase',
                                paddingTop: '4px',
                                paddingBottom: '16px',
                                paddingLeft: '4px',
                                paddingRight: '4px',
                                borderBottom: index === arr.length - 1 ? 'none' : '1px solid #cbd5e1',
                                verticalAlign: 'middle',
                                textAlign: 'left',
                                lineHeight: '1.2'
                              }}
                            >
                              {item.label}
                            </td>
                            <td 
                              style={{
                                width: '65%',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: '#2c3e50',
                                paddingTop: '4px',
                                paddingBottom: '16px',
                                paddingLeft: '4px',
                                paddingRight: '4px',
                                borderBottom: index === arr.length - 1 ? 'none' : '1px solid #cbd5e1',
                                verticalAlign: 'middle',
                                textAlign: 'left',
                                lineHeight: '1.2'
                              }}
                            >
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* FOOTER */}
            <div 
              style={{
                textAlign: 'center',
                marginTop: '30px',
                paddingTop: '15px',
                borderTop: '1px solid #cbd5e1',
                color: '#888888',
                fontSize: '11px',
                lineHeight: '1.6'
              }}
            >
              <span 
                style={{
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  letterSpacing: '0.8px'
                }}
              >
                FLEETPRO MANAGEMENT SYSTEM
              </span>
              <br />
              {language === 'bn'
                ? 'এই ডকুমেন্টটি একটি অফিসিয়াল সিস্টেম জেনারেটে কন্টাক্ট ইনফরমেশন রিপোর্ট'
                : 'This document is an official system-generated contact information report'}
              <br />
              Report Generated: {new Date().toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* View Contact Pop-up Modal using createPortal to overlay the whole app including navigation */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {viewingContact && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              onClick={() => setViewingContact(null)}
              className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="bg-card-bg w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                  <h3 className="font-bold text-lg text-text-main">
                    {language === 'bn' ? 'কন্টাক্ট এর বিবরণ' : 'Contact Details'}
                  </h3>
                  <button 
                    onClick={() => setViewingContact(null)} 
                    className="text-text-muted hover:text-text-main p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content Grid */}
                <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Photo and Name */}
                      <div className="flex items-center gap-4 p-3 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                        <div className="w-16 h-16 rounded-[10px] bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
                          {viewingContact.photo ? (
                            <img src={viewingContact.photo} alt={viewingContact.fullName} className="w-full h-full object-cover rounded-[10px]" />
                          ) : (
                            <User className="text-primary" size={32} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-lg text-text-main truncate">{viewingContact.fullName}</h4>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mt-1">
                            {viewingContact.relationship || 'Client'}
                          </span>
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5 space-y-4">
                        <div>
                          <span className="text-xs text-text-muted font-bold block mb-1">
                            {language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
                          </span>
                          <a 
                            href={`tel:${viewingContact.countryCode || ''}${viewingContact.mobileNumber}`}
                            className="font-bold text-primary hover:underline text-base flex items-center gap-1.5 cursor-pointer w-fit animate-pulse"
                          >
                            <Phone size={16} />
                            {(viewingContact.countryCode ? viewingContact.countryCode + ' ' : '') + viewingContact.mobileNumber}
                          </a>
                        </div>

                        {viewingContact.alternativeMobileNumber && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {language === 'bn' ? 'বিকল্প মোবাইল নম্বর' : 'Alternative Mobile Number'}
                            </span>
                            <a 
                              href={`tel:${viewingContact.alternativeCountryCode || ''}${viewingContact.alternativeMobileNumber}`}
                              className="font-bold text-primary hover:underline text-base flex items-center gap-1.5 cursor-pointer w-fit"
                            >
                              <PhoneCall size={16} />
                              {(viewingContact.alternativeCountryCode ? viewingContact.alternativeCountryCode + ' ' : '') + viewingContact.alternativeMobileNumber}
                            </a>
                          </div>
                        )}

                        {viewingContact.emailAddress && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'}
                            </span>
                            <span className="text-text-main font-semibold block break-all">
                              {viewingContact.emailAddress}
                            </span>
                          </div>
                        )}

                        {viewingContact.nationality && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {language === 'bn' ? 'জাতীয়তা' : 'Nationality'}
                            </span>
                            <span className="text-text-main font-semibold block">
                              {viewingContact.nationality}
                            </span>
                          </div>
                        )}

                        {viewingContact.documentType && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {language === 'bn' ? 'ডকুমেন্ট টাইপ' : 'Document Type'}
                            </span>
                            <span className="text-text-main font-semibold block">
                              {viewingContact.documentType}
                            </span>
                          </div>
                        )}

                        {viewingContact.documentNumber && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {getDocumentNumberLabel(viewingContact.documentType)}
                            </span>
                            <span className="text-text-main font-semibold block">
                              {viewingContact.documentNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl border border-black/5 dark:border-white/5 space-y-4 h-full flex flex-col justify-start">
                        {viewingContact.companyName && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {language === 'bn' ? 'কোম্পানির নাম' : 'Company Name'}
                            </span>
                            <span className="text-text-main font-semibold block">
                              {viewingContact.companyName}
                            </span>
                          </div>
                        )}

                        {viewingContact.designation && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {language === 'bn' ? 'পদবী' : 'Designation'}
                            </span>
                            <span className="text-text-main font-semibold block">
                              {viewingContact.designation}
                            </span>
                          </div>
                        )}

                        {(viewingContact.address || viewingContact.city || viewingContact.country) && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {language === 'bn' ? 'ঠিকানা' : 'Address'}
                            </span>
                            <span className="text-text-main font-semibold block">
                              {[viewingContact.address, viewingContact.city, viewingContact.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        )}

                        {viewingContact.notes && (
                          <div>
                            <span className="text-xs text-text-muted font-bold block mb-1">
                              {language === 'bn' ? 'নোটস' : 'Notes'}
                            </span>
                            <p className="text-text-main/90 text-sm whitespace-pre-wrap leading-relaxed">
                              {viewingContact.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons in Footer */}
                <div className="p-4 border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-center gap-6">
                  {/* Delete button */}
                  <button
                    onClick={() => {
                      handleDelete(viewingContact.id);
                      setViewingContact(null);
                    }}
                    className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-red-500/5 cursor-pointer"
                    title={language === 'bn' ? 'ডিলিট করুন' : 'Delete Contact'}
                  >
                    <Trash2 size={20} />
                  </button>
                  {/* Edit button */}
                  <button
                    onClick={() => {
                      handleOpenForm(viewingContact);
                      setViewingContact(null);
                    }}
                    className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-blue-500/5 cursor-pointer"
                    title={language === 'bn' ? 'এডিট করুন' : 'Edit Contact'}
                  >
                    <Edit size={20} />
                  </button>
                  {/* Download button */}
                  <button
                    onClick={() => {
                      handleDownloadPDF(viewingContact);
                      setViewingContact(null);
                    }}
                    className="w-12 h-12 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all duration-200 shadow-md shadow-green-500/5 cursor-pointer"
                    title={language === 'bn' ? 'পিডিএফ ডাউনলোড করুন' : 'Download PDF'}
                  >
                    <Download size={20} />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Source Selection Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isSourceSelectionOpen && (
            <>
              {/* Backdrop overlay with blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={() => setIsSourceSelectionOpen(false)}
                className={`fixed top-0 left-0 right-0 bottom-0 ${isDarkMode ? 'bg-black/60' : 'bg-black/30'} backdrop-blur-md md:backdrop-blur-lg z-[10000] global-select-backdrop`}
              />

              {/* Floating Modal Card matching screenshot style */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className={`fixed left-4 right-4 bottom-8 md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-auto md:w-full max-w-[420px] rounded-[24px] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.18)] border border-zinc-200/80 dark:border-white/10 z-[10001] flex flex-col space-y-4 ${
                  isDarkMode 
                    ? 'bg-[#121212] text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
                    : 'bg-white text-zinc-900'
                }`}
              >
                {/* Header row: Title and Close button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-white">
                    {language === 'bn' ? 'কন্টাক্ট সোর্স নির্বাচন করুন' : 'Select Contact Source'}
                  </span>
                  <button 
                    onClick={() => setIsSourceSelectionOpen(false)}
                    className={`p-1.5 rounded-full transition-all cursor-pointer ${
                      isDarkMode 
                        ? 'hover:bg-white/10 text-zinc-300' 
                        : 'hover:bg-zinc-100 text-zinc-500'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Horizontal divider line */}
                <div className="border-b border-zinc-200/70 dark:border-white/10 w-full my-0.5" />

                {/* Source Items */}
                <div className="space-y-3">
                  {/* Device Storage */}
                  <button
                    onClick={() => scanSourceContacts('Device Storage')}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border border-transparent cursor-pointer transition-all text-left ${
                      isDarkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white' 
                        : 'bg-[#f4f4f6] hover:bg-zinc-200/60 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-blue-100/90 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        <Smartphone size={20} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {language === 'bn' ? 'ডিভাইস স্টোরেজ' : 'Device / Phone Storage'}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate">
                          {scannedSourceCounts['Device Storage'] !== undefined 
                            ? `Total Contacts: ${scannedSourceCounts['Device Storage']}` 
                            : (language === 'bn' ? 'স্ক্যান করতে ট্যাপ করুন' : 'Tap to scan')}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                      isDarkMode 
                        ? 'bg-white/10 text-zinc-200' 
                        : 'bg-white text-zinc-800 border border-zinc-200/80 shadow-xs'
                    }`}>
                      {language === 'bn' ? 'স্ক্যান' : 'Scan'}
                    </span>
                  </button>

                  {/* SIM Card */}
                  <button
                    onClick={() => scanSourceContacts('SIM Card')}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border border-transparent cursor-pointer transition-all text-left ${
                      isDarkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white' 
                        : 'bg-[#f4f4f6] hover:bg-zinc-200/60 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <CreditCard size={20} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {language === 'bn' ? 'সিম কার্ড' : 'SIM Card'}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate">
                          {scannedSourceCounts['SIM Card'] !== undefined 
                            ? `Total Contacts: ${scannedSourceCounts['SIM Card']}` 
                            : (language === 'bn' ? 'স্ক্যান করতে ট্যাপ করুন' : 'Tap to scan')}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                      isDarkMode 
                        ? 'bg-white/10 text-zinc-200' 
                        : 'bg-white text-zinc-800 border border-zinc-200/80 shadow-xs'
                    }`}>
                      {language === 'bn' ? 'স্ক্যান' : 'Scan'}
                    </span>
                  </button>

                  {/* Google Account */}
                  <button
                    onClick={() => scanSourceContacts('Google Account')}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border border-transparent cursor-pointer transition-all text-left ${
                      isDarkMode 
                        ? 'bg-white/5 hover:bg-white/10 text-white' 
                        : 'bg-[#f4f4f6] hover:bg-zinc-200/60 text-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-rose-100/90 dark:bg-rose-500/20 text-rose-500 dark:text-rose-400">
                        <Globe size={20} />
                      </div>
                      <div className="text-left min-w-0">
                        <div className="font-bold text-sm text-zinc-900 dark:text-white truncate">
                          {language === 'bn' ? 'গুগল অ্যাকাউন্ট' : 'Google Account'}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5 truncate">
                          {scannedSourceCounts['Google Account'] !== undefined 
                            ? `Total Contacts: ${scannedSourceCounts['Google Account']}` 
                            : (language === 'bn' ? 'স্ক্যান করতে ট্যাপ করুন' : 'Tap to scan')}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all ${
                      isDarkMode 
                        ? 'bg-white/10 text-zinc-200' 
                        : 'bg-white text-zinc-800 border border-zinc-200/80 shadow-xs'
                    }`}>
                      {language === 'bn' ? 'স্ক্যান' : 'Scan'}
                    </span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Source Preview & Count Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {sourcePreviewModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative p-6 flex flex-col gap-5 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedSourceForScan}
                    </h3>
                    <p className="text-xs text-primary font-semibold mt-0.5">
                      {language === 'bn' ? `মোট কন্টাক্ট: ${scannedSourceContacts.length}` : `Total Contacts: ${scannedSourceContacts.length}`}
                    </p>
                  </div>
                  <button onClick={() => setSourcePreviewModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                    <X size={20} />
                  </button>
                </div>

                {/* List preview */}
                <div className="max-h-[260px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-50 dark:divide-slate-800/50">
                  {scannedSourceContacts.map((c, index) => (
                    <div key={index} className="p-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{c.fullName || 'Unnamed'}</span>
                        <span className="text-xs text-slate-400">{c.mobileNumber}</span>
                      </div>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">{c.companyName || 'Contact'}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    onClick={confirmImportFromScanned}
                    className="w-full py-3 px-4 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer text-sm text-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {language === 'bn' ? `কনফার্ম ইম্পোর্ট (${scannedSourceContacts.length})` : `Confirm Import (${scannedSourceContacts.length})`}
                  </button>
                  <button
                    onClick={() => setSourcePreviewModalOpen(false)}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all cursor-pointer text-sm text-center"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Duplicate Resolution Pop-up Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {duplicateModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative p-6 flex flex-col gap-6"
              >
                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500 flex items-center justify-center shrink-0">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {language === 'bn' ? 'ডুপ্লিকেট কন্টাক্ট পাওয়া গেছে!' : 'Duplicate Contacts Found!'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {language === 'bn' 
                        ? `${pendingDuplicateList.length}টি কন্টাক্ট ইতিমধ্যেই তালিকায় রয়েছে` 
                        : `${pendingDuplicateList.length} contacts already exist in your list`}
                    </p>
                  </div>
                </div>

                {/* Content description */}
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {language === 'bn'
                    ? 'এই কন্টাক্টগুলো কি আপনি আপডেট করতে চান নাকি এড়িয়ে যেতে চান? আপডেট করলে বিদ্যমান তথ্য নতুন ফোন ডাটা দিয়ে প্রতিস্থাপিত হবে।'
                    : 'How would you like to handle these existing contacts? Updating will overwrite current information with the new phone data, while skipping will keep them as is.'}
                </div>

                {/* Preview of duplicates */}
                <div className="max-h-[160px] overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-50 dark:divide-slate-800/50">
                  {pendingDuplicateList.map((dup, i) => (
                    <div key={i} className="p-3 flex flex-col gap-0.5">
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        {dup.phoneContact.fullName}
                      </span>
                      {dup.phoneContact.mobileNumber && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {dup.phoneContact.mobileNumber}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => saveImportedContacts(pendingImportList, pendingDuplicateList)}
                    className="w-full py-3 px-4 text-white font-medium rounded-xl shadow-md transition-all cursor-pointer text-sm text-center font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {language === 'bn' ? 'আপডেট করুন' : 'Update Existing'}
                  </button>

                  <button
                    onClick={() => saveImportedContacts(pendingImportList)}
                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all cursor-pointer text-sm text-center"
                  >
                    {language === 'bn' ? 'এড়িয়ে যান (শুধু নতুন ইম্পোর্ট করুন)' : 'Skip Duplicates'}
                  </button>

                  <button
                    onClick={() => {
                      setDuplicateModalOpen(false);
                      setPendingImportList([]);
                      setPendingDuplicateList([]);
                    }}
                    className="w-full py-2 px-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs text-center transition-all cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল করুন' : 'Cancel Import'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {duplicateWarningPopup?.isOpen && (
            <>
              {/* Backdrop Overlay with Blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                onClick={() => setDuplicateWarningPopup(null)}
                className={`fixed top-0 left-0 right-0 bottom-0 ${isDarkMode ? 'bg-black/75' : 'bg-black/40'} backdrop-blur-md z-[10005]`}
              />

              {/* Floating Popup Modal Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={`fixed left-5 right-5 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-auto md:w-full max-w-[400px] rounded-[24px] p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)] border border-amber-300/50 dark:border-amber-500/30 z-[10006] flex flex-col items-center text-center space-y-4 ${
                  isDarkMode 
                    ? 'bg-[#121212] text-white' 
                    : 'bg-white text-zinc-900'
                }`}
              >
                {/* Warning Icon Badge */}
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                  <AlertTriangle size={30} />
                </div>

                <div className="space-y-1.5 w-full">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    {duplicateWarningPopup.title}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed px-1">
                    {duplicateWarningPopup.message}
                  </p>
                </div>

                {duplicateWarningPopup.contactName && (
                  <div className={`w-full p-3.5 rounded-2xl flex items-center gap-3 text-left border ${
                    isDarkMode ? 'bg-white/5 border-white/10' : 'bg-amber-50/80 border-amber-200/80'
                  }`}>
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <User size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        {language === 'bn' ? 'বিদ্যমান কন্টাক্ট:' : 'Existing Contact:'}
                      </div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {duplicateWarningPopup.contactName}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setDuplicateWarningPopup(null)}
                  className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer mt-1"
                >
                  {language === 'bn' ? 'ঠিক আছে (বুঝেছি)' : 'Got It (OK)'}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      <GlobalFullscreenSelect
        isOpen={selectModalOpen}
        onClose={() => setSelectModalOpen(false)}
        onSelect={(val) => {
          setFormData(prev => ({ ...prev, relationship: val }));
          setSelectModalOpen(false);
        }}
        options={relationshipOptions}
        title="Select Relationship"
        selectedValue={formData.relationship}
      />

      <GlobalFullscreenSelect
        isOpen={countryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        onSelect={(val) => {
          setFormData(prev => ({ ...prev, country: val }));
          setCountryModalOpen(false);
        }}
        options={countryOptions}
        title="Select Country"
        selectedValue={formData.country}
      />

      <GlobalFullscreenSelect
        isOpen={nationalityModalOpen}
        onClose={() => setNationalityModalOpen(false)}
        onSelect={(val) => {
          setFormData(prev => ({ ...prev, nationality: val }));
          setNationalityModalOpen(false);
        }}
        options={nationalityOptions}
        title={language === 'bn' ? 'জাতীয়তা নির্বাচন করুন' : 'Select Nationality'}
        selectedValue={formData.nationality}
      />

      <GlobalFullscreenSelect
        isOpen={documentTypeModalOpen}
        onClose={() => setDocumentTypeModalOpen(false)}
        onSelect={(val) => {
          setFormData(prev => ({ ...prev, documentType: val }));
          setDocumentTypeModalOpen(false);
        }}
        options={documentTypeOptions}
        title={language === 'bn' ? 'ডকুমেন্ট টাইপ নির্বাচন করুন' : 'Select Document Type'}
        selectedValue={formData.documentType}
      />
    </div>
  );
}
