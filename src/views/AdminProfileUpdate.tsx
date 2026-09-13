
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { 
  Save, Edit, Eye, MapPin, User as UserIcon, CreditCard, Zap, Home, ChevronDown, Search, Camera, Check, ChevronLeft, Shield, Calendar, Clock, DollarSign, Lock, X, ChevronRight,
  LayoutDashboard, FileText, PlusCircle, Files, UserCheck, UserX, LifeBuoy, Settings, Wallet, UserCircle, Trash2, MessageSquare, ShieldCheck, Bell, Sun, Moon, Diamond, Truck, Sliders, UserPlus, RefreshCw, Headphones, Palette, Users, Globe, Briefcase
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Clock, FileText, PlusCircle, User: UserIcon, Files, UserCheck, UserX, CreditCard, LifeBuoy, Settings, Search, Wallet, UserCircle, Shield, Trash2, MessageSquare
};
import { DIVISIONS, DISTRICTS, POLICE_STATIONS, POST_OFFICES } from '../constants/countries';
import { THEMES, APP_MODULES, GLOBAL_DASHBOARD_MODULES, DEFAULT_OVERRIDABLE_PERMISSIONS } from '../constants';
import { compressImage } from '@/utils/imageUtils';
import { getContrastColor } from '@/utils/colorUtils';

import InputField from '@/components/InputField';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import FormWindow from '@/components/FormWindow';

const ID_TYPES = ['DRIVING LICENSE', 'NATIONAL ID', 'BIRTH CERTIFICATE', 'PASSPORT'];

// DEFAULT_OVERRIDABLE_PERMISSIONS now imported from '../constants' (single
// source of truth shared with Dashboard.tsx, Layout.tsx, and the web
// admin app's permissionModules.ts).

const AdminProfileUpdate: React.FC = () => {
  const { setView, language, user, setUser, countries, idTypes, showFeedback, theme, selectedUser, setSelectedUser, updateUser, payments, wallpaper, backgroundColor, headerBg, appThemeMode, setIsEntryFormOpen, setAppThemeMode, notifications, appGrid, postOffices, policeStations, cities, states } = useStore();
  const isAdmin = user?.role === 'ADMIN';
  const targetUser = isAdmin && selectedUser ? selectedUser : user;
  const isEditingSelf = targetUser?.id === user?.id;
  const t = TRANSLATIONS[language];
  const pageTitle = isEditingSelf ? t.ADMIN_EDIT_SELF_PROFILE : t.USER_EDIT_OTHER_PROFILE;
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[1];
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const [formData, setFormData] = useState({
    fullName: targetUser?.name || '',
    nationality: targetUser?.nationality || '',
    dob: targetUser?.dob || '',
    profession: targetUser?.profession || '',
    companyName: targetUser?.companyName || '',
    countryCode: targetUser?.countryCode || '',
    mobileNumber: targetUser?.mobileNumber || '',
    email: targetUser?.email || '',
    idIssueCountry: targetUser?.idIssueCountry || '',
    idType: targetUser?.idType || '',
    idNumber: targetUser?.idNumber || '',
    
    // Address
    presentCountry: targetUser?.presentCountry || targetUser?.country || '',
    division: targetUser?.division || '',
    district: targetUser?.district || '',
    city: targetUser?.city || '',
    policeStation: targetUser?.policeStation || '',
    upazila: targetUser?.upazila || '',
    postOffice: targetUser?.postOffice || '',
    postalCode: targetUser?.postalCode || '',
    area: targetUser?.area || '',
    buildingNumber: targetUser?.buildingNumber || '',
    stateNumber: targetUser?.stateNumber || '',
    zoomNumber: targetUser?.zoomNumber || '',
    electricityNumber: targetUser?.electricityNumber || '',
    streetNumber: targetUser?.streetNumber || '',
    zoneNumber: targetUser?.zoneNumber || '',
    addressLine1: targetUser?.addressLine1 || '',
    addressLine2: targetUser?.addressLine2 || '',
    state: targetUser?.state || '',
    manualAddress: targetUser?.manualAddress || '',
    gender: targetUser?.gender || '',
    religion: targetUser?.religion || '',
    
    // Subscription & Admin only
    password: '',
    duration: targetUser?.duration || '1 MONTH',
    price: targetUser?.price || '0',
    package: targetUser?.package || '',
    packagePrice: targetUser?.packagePrice?.toString() || '0',
    activationDate: targetUser?.activationDate || new Date().toISOString().split('T')[0],
    expiryDate: targetUser?.expiryDate || '',
    permissions: targetUser?.permissions || [] as string[],
    deniedPermissions: targetUser?.deniedPermissions || [] as string[],
    accountType: targetUser?.accountType || 'Transport Account'
  });

  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  useEffect(() => {
    if (showPermissionsModal) {
      window.dispatchEvent(new CustomEvent('change-title', { detail: language === 'bn' ? 'মডিউল পারমিশন' : 'Module Permissions' }));
    } else {
      window.dispatchEvent(new CustomEvent('change-title', { detail: null }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('change-title', { detail: null }));
    };
  }, [showPermissionsModal, language]);

  useEffect(() => {
    const handleCloseOverlay = () => {
      setShowPermissionsModal(false);
    };
    window.addEventListener('close-permissions-overlay', handleCloseOverlay);
    return () => window.removeEventListener('close-permissions-overlay', handleCloseOverlay);
  }, []);

  const togglePermission = (perm: string) => {
    if (!isAdmin) return;
    setFormData(prev => {
      if (DEFAULT_OVERRIDABLE_PERMISSIONS.includes(perm)) {
        const denied = prev.deniedPermissions || [];
        const isDenied = denied.includes(perm);
        return {
          ...prev,
          deniedPermissions: isDenied
            ? denied.filter(p => p !== perm)
            : [...denied, perm]
        };
      } else {
        return {
          ...prev,
          permissions: prev.permissions.includes(perm)
            ? prev.permissions.filter(p => p !== perm)
            : [...prev.permissions, perm]
        };
      }
    });
  };

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  const renderPermissionsModal = () => { /* fully replaced inside JSX */ return null; };

  // legacy render removed

  const [selectModal, setSelectModal] = useState<{
    isOpen: boolean;
    name: string;
    label: string;
    options: any[];
  }>({
    isOpen: false,
    name: '',
    label: '',
    options: []
  });

  const handleOpenModal = (name: string, label: string, options: any[]) => {
    setSelectModal({
      isOpen: true,
      name,
      label,
      options
    });
  };

  const handleSelect = (value: string) => {
    if (selectModal.name) {
      handleChange(selectModal.name, value);
    }
    setSelectModal(prev => ({ ...prev, isOpen: false }));
  };

  const initializedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (targetUser && targetUser.id !== initializedIdRef.current) {
      initializedIdRef.current = targetUser.id;
      setFormData({
        fullName: targetUser.name || '',
        nationality: targetUser.nationality || '',
        dob: targetUser.dob || '',
        profession: targetUser.profession || '',
        companyName: targetUser.companyName || '',
        countryCode: targetUser.countryCode || '',
        mobileNumber: targetUser.mobileNumber || '',
        email: targetUser.email || '',
        idIssueCountry: targetUser.idIssueCountry || '',
        idType: targetUser.idType || '',
        idNumber: targetUser.idNumber || '',
        presentCountry: targetUser.presentCountry || targetUser.country || '',
        division: targetUser.division || '',
        district: targetUser.district || '',
        city: targetUser.city || '',
        policeStation: targetUser.policeStation || '',
        upazila: targetUser.upazila || '',
        postOffice: targetUser.postOffice || '',
        postalCode: targetUser.postalCode || '',
        area: targetUser.area || '',
        buildingNumber: targetUser.buildingNumber || '',
        stateNumber: targetUser.stateNumber || '',
        zoomNumber: targetUser.zoomNumber || '',
        electricityNumber: targetUser.electricityNumber || '',
        streetNumber: targetUser.streetNumber || '',
        zoneNumber: targetUser.zoneNumber || '',
        addressLine1: targetUser.addressLine1 || '',
        addressLine2: targetUser.addressLine2 || '',
        state: targetUser.state || '',
        manualAddress: targetUser.manualAddress || '',
        gender: targetUser.gender || '',
        religion: targetUser.religion || '',
        password: '',
        duration: targetUser.duration || '1 MONTH',
        price: targetUser.price || '0',
        package: targetUser.package || '',
        packagePrice: targetUser.packagePrice?.toString() || '0',
        activationDate: targetUser.activationDate || new Date().toISOString().split('T')[0],
        expiryDate: targetUser.expiryDate || '',
        permissions: targetUser.permissions || [],
        deniedPermissions: targetUser.deniedPermissions || [],
        accountType: targetUser.accountType || 'Transport Account'
      });
      setProfileImage(targetUser.avatar || null);
      setIsAddressEnabled(!!(targetUser.presentCountry || targetUser.country));
    }
  }, [targetUser?.id]);

  // Calculate Expiry Date automatically only when inputs change from initial data
  useEffect(() => {
    if (formData.activationDate && formData.duration && !isNaN(Date.parse(formData.activationDate))) {
      // Only auto-calculate if the values have actually CHANGED in this edit session
      // to avoid overwriting a custom manual expiry date on component mount
      const isInitialActivationDate = formData.activationDate === targetUser?.activationDate;
      const isInitialDuration = formData.duration === targetUser?.duration;
      
      // If none changed, don't overwrite the existing expiry date from targetUser
      if (isInitialActivationDate && isInitialDuration && formData.expiryDate === targetUser?.expiryDate) {
        return;
      }

      const date = new Date(formData.activationDate);
      const months = parseInt(formData.duration) || 1;
      if (formData.duration === 'LIFETIME') {
        setFormData(prev => ({ ...prev, expiryDate: 'LIFETIME' }));
      } else {
        date.setMonth(date.getMonth() + months);
        const calculated = date.toISOString().split('T')[0];
        // Only update if it's different to avoid loops
        if (formData.expiryDate !== calculated) {
          setFormData(prev => ({ ...prev, expiryDate: calculated }));
        }
      }
    }
  }, [formData.activationDate, formData.duration]);

  const [isAddressEnabled, setIsAddressEnabled] = useState(!!(targetUser?.presentCountry || targetUser?.country));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Handlers
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Special logic for address fields
    if (field === 'presentCountry') {
      setIsAddressEnabled(!!value);
      setFormData(prev => ({ 
        ...prev, 
        presentCountry: value,
        division: '', district: '', city: '', policeStation: '', upazila: '', postOffice: '', postalCode: '' 
      }));
    }

    if (field === 'division') {
        setFormData(prev => ({ 
            ...prev, 
            division: value,
            district: '', policeStation: '', upazila: '', postOffice: '', postalCode: '' 
        }));
    }

    if (field === 'district') {
        setFormData(prev => ({ 
            ...prev, 
            district: value,
            policeStation: ''
        }));
    }

    if (field === 'postOffice') {
      // Find code
      const office = postOffices.find(p => p.name === value);
      if (office) {
        setFormData(prev => ({ ...prev, postOffice: value, postalCode: office.code }));
      } else {
        const legacyOffice = POST_OFFICES[formData.division]?.find(p => p.name === value);
        setFormData(prev => ({ ...prev, postOffice: value, postalCode: legacyOffice ? legacyOffice.code : '' }));
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const originalDataUrl = reader.result as string;
          const compressedDataUrl = await compressImage(originalDataUrl);
          setProfileImage(compressedDataUrl);
        } catch (error) {
          console.error('Image compression failed:', error);
          showFeedback('Failed to process image. Please try another one.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    if (targetUser) {
      
      let finalPassword = targetUser.password;
      if (formData.password) {
        const bcrypt = await import('bcryptjs');
        finalPassword = await bcrypt.hash(formData.password, 10);
      }

      const updatedUser = {
        ...targetUser,
        id: targetUser.id, // Preserve ID - do not change it based on fullName
        name: formData.fullName || targetUser.name,
        email: formData.email || targetUser.email,
        userId: formData.email || targetUser.userId || targetUser.email,
        loginEmail: formData.email || targetUser.loginEmail || targetUser.email,
        nationality: formData.nationality,
        dob: formData.dob,
        profession: formData.profession,
        companyName: formData.companyName,
        countryCode: formData.countryCode,
        mobileNumber: formData.mobileNumber,
        idIssueCountry: formData.idIssueCountry,
        idType: formData.idType,
        idNumber: formData.idNumber,
        presentCountry: formData.presentCountry,
        division: formData.division,
        district: formData.district,
        city: formData.city,
        policeStation: formData.policeStation,
        upazila: formData.upazila,
        postOffice: formData.postOffice,
        postalCode: formData.postalCode,
        area: formData.area,
        buildingNumber: formData.buildingNumber,
        stateNumber: formData.stateNumber,
        zoomNumber: formData.zoomNumber,
        electricityNumber: formData.electricityNumber,
        streetNumber: formData.streetNumber,
        zoneNumber: formData.zoneNumber,
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        state: formData.state,
        manualAddress: formData.manualAddress,
        gender: formData.gender,
        religion: formData.religion,
        avatar: profileImage || targetUser.avatar,
        // Admin only fields
        duration: formData.duration,
        price: formData.price,
        package: formData.package,
        packagePrice: parseFloat(formData.packagePrice) || 0,
        activationDate: formData.activationDate,
        expiryDate: formData.expiryDate,
        permissions: formData.permissions,
        deniedPermissions: formData.deniedPermissions || [],
        accountType: formData.accountType || 'Transport Account',
        ...(formData.password ? { password: finalPassword } : {})
      };
      
      try {
        const { saveFirebaseDocMerge } = await import('@/services/firebase');
        const coll = updatedUser.role === 'ADMIN' ? 'admins' : 'users';
        await saveFirebaseDocMerge(coll, targetUser.id, updatedUser);

        if (formData.password) {
          try {
            const response = await fetch('/api/auth/update-password', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                email: formData.email || targetUser.email,
                password: formData.password
              })
            });
            if (!response.ok) {
              const resData = await response.json().catch(() => ({}));
              // Attempt create if update fails (user might not exist in Auth yet)
              await fetch('/api/auth/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: formData.email || targetUser.email,
                  password: formData.password
                })
              }).catch(console.error);
            }
          } catch (authErr) {
            console.error("Firebase Authentication update error:", authErr);
          }
        }

        if (isAdmin && !isEditingSelf) {
          updateUser(updatedUser, targetUser.id);
          setSelectedUser(updatedUser);
        } else {
          setUser(updatedUser);
          updateUser(updatedUser, targetUser.id);
        }
      } catch (err) {
        console.error('Failed to update profile:', err);
        showFeedback('Failed to update profile in database', 'error');
        setIsSubmitting(false);
        return;
      }
    }
    showFeedback('Profile updated successfully!');
    setTimeout(() => {
        setIsSubmitting(false);
        setView('USER_PROFILE');
    }, 1500);
  };

  const renderForm = () => {
    let idNumberLabel = 'ID Number';
    let idNumberIcon = <CreditCard size={16} />;
    
    if (formData.idType) {
      const selectedIdType = formData.idType.toUpperCase();
      if (selectedIdType === 'PASSPORT') {
        idNumberLabel = 'Passport number';
        idNumberIcon = <Globe size={16} />;
      } else if (selectedIdType.includes('BIRTH') || selectedIdType.includes('REGISTRATION')) {
        idNumberLabel = 'Birth registration number';
        idNumberIcon = <FileText size={16} />;
      } else if (selectedIdType === 'NID' || selectedIdType.includes('NATIONAL')) {
        idNumberLabel = 'National id numbers';
        idNumberIcon = <Shield size={16} />;
      } else if (selectedIdType.includes('RESIDENT') || selectedIdType === 'VISA' || selectedIdType.includes('PERMIT') || selectedIdType === 'QID' || selectedIdType === 'IQAMA') {
        idNumberLabel = 'Resident id numbers';
        idNumberIcon = <CreditCard size={16} />;
      } else if (selectedIdType === 'DRIVING LICENSE' || selectedIdType.includes('LICENSE')) {
        idNumberLabel = 'License Number';
        idNumberIcon = <CreditCard size={16} />;
      } else {
        idNumberLabel = `${formData.idType} number`;
        idNumberIcon = <CreditCard size={16} />;
      }
    }

    return (
    <div className="space-y-2 pb-6 w-full">
      {/* Profile Picture Card */}
      <div className="bg-card-bg rounded-[8px] p-6 flex flex-col items-center justify-center gap-2 shadow-sm">
        <h3 className="text-sm font-bold text-text-main capitalize w-full text-left pb-2">profile picture</h3>
        <div className={`relative group ${isAdmin || isEditingSelf ? 'cursor-pointer' : 'cursor-default'}`} onClick={() => (isAdmin || isEditingSelf) && fileInputRef.current?.click()}>
          <div 
            className="w-24 h-24 rounded-[8px] bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden transition-colors"
          >
            {profileImage || targetUser?.avatar ? (
              <img src={profileImage || targetUser?.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} style={{ color: currentThemeObj.primary }} />
            )}
          </div>
          {(isAdmin || isEditingSelf) && (
            <div 
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: currentThemeObj.primary }}
            >
              <Edit size={14} />
            </div>
          )}
        </div>
        {(isAdmin || isEditingSelf) && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tap to upload photo</p>}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>

      {/* Personal Information */}
      <div className="bg-card-bg p-4 rounded-[8px] shadow-sm">
        <h3 className="text-sm font-bold text-text-main mb-4 capitalize pb-2">personal information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2">
            <InputField 
              label="Full Name"
              name="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              readOnly={!isAdmin}
            />
          </div>
          <InputField 
            label="Nationality"
            name="nationality"
            type="select"
            value={formData.nationality}
            options={countries.map(c => ({ label: c.name, value: c.name, icon: c.flag }))}
            onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
            readOnly={!isAdmin}
          />
          <InputField 
            label="Date of Birth"
            name="dob"
            type="date"
            value={formData.dob}
            onChange={(e) => handleChange('dob', e.target.value)}
            readOnly={!isAdmin}
          />
          <div className="col-span-2 md:col-span-4">
            <InputField 
              label="Profession"
              name="profession"
              type="select"
              value={formData.profession}
              options={[
                { label: 'Driver', value: 'Driver' },
                { label: 'Manager', value: 'Manager' },
                { label: 'Technician', value: 'Technician' },
                { label: 'Administrator', value: 'Administrator' },
                { label: 'Other', value: 'Other' },
              ]}
              onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
              readOnly={!isAdmin}
            />
          </div>
          <div className="col-span-2">
            <InputField 
              label="Sponsor Name"
              name="companyName"
              type="select"
              value={formData.companyName}
              options={[
                { label: 'AL SAWAID AL QATARI TRANSPORT', value: 'AL SAWAID AL QATARI TRANSPORT' },
                { label: 'FAST FREIGHT', value: 'FAST FREIGHT' },
                { label: 'OTHER', value: 'OTHER' },
              ]}
              onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
              readOnly={!isAdmin}
            />
          </div>
          
          {/* Contact Details merged here */}
          <div className="col-span-2 flex gap-3">
              <div className="w-[42%]">
                <InputField 
                  label="Code"
                  name="countryCode"
                  type="select"
                  value={formData.countryCode}
                  options={countries.map(c => ({ label: c.code, value: c.code, icon: c.flag, key: c.name, subLabel: c.name }))}
                  onOpenModal={(name, label, options) => handleOpenModal(name, "Select Country Code", options)}
                  readOnly={!isAdmin}
                />
              </div>
              <div className="w-[58%]">
                <InputField 
                  label="Mobile Number"
                  name="mobileNumber"
                  type="tel"
                  inputMode="numeric"
                  value={formData.mobileNumber}
                  onChange={(e) => handleChange('mobileNumber', e.target.value)}
                  readOnly={!isAdmin}
                />
              </div>
          </div>
          <div className="col-span-2">
            <InputField 
              label="Email ID"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              readOnly={!isAdmin}
            />
          </div>

          {/* ID & Documents merged here */}
          <InputField 
            label="ID Issues Country"
            name="idIssueCountry"
            type="select"
            value={formData.idIssueCountry}
            options={countries.map(c => ({ label: c.name, value: c.name, icon: c.flag }))}
            onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
            readOnly={!isAdmin}
          />
          <InputField 
            label="ID Type"
            name="idType"
            type="select"
            value={formData.idType}
            options={idTypes.map(t => ({ label: t, value: t }))}
            onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
            readOnly={!isAdmin}
          />
          <div className="col-span-2">
            <InputField 
              label={idNumberLabel}
              placeholder={idNumberLabel}
              name="idNumber"
              type="tel"
              inputMode="numeric"
              value={formData.idNumber}
              onChange={(e) => handleChange('idNumber', e.target.value)}
              readOnly={!isAdmin}
              icon={idNumberIcon}
            />
          </div>
          <InputField 
            label="Gender"
            name="gender"
            type="select"
            value={formData.gender}
            options={[
              { label: 'MALE', value: 'MALE' },
              { label: 'FEMALE', value: 'FEMALE' },
              { label: 'OTHER', value: 'OTHER' }
            ]}
            onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
            readOnly={!isAdmin}
          />
          <InputField 
            label="Religion"
            name="religion"
            type="select"
            value={formData.religion}
            options={[
              { label: 'ISLAM', value: 'ISLAM' },
              { label: 'HINDUISM', value: 'HINDUISM' },
              { label: 'CHRISTIANITY', value: 'CHRISTIANITY' },
              { label: 'BUDDHISM', value: 'BUDDHISM' },
              { label: 'OTHER', value: 'OTHER' }
            ]}
            onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
            readOnly={!isAdmin}
          />

          {/* Hide Account Type field */}
          {false && isAdmin && (
            <div className="col-span-2">
              <InputField 
                label="Account Type"
                name="accountType"
                type="select"
                value={formData.accountType || 'Transport Account'}
                options={[
                  { label: 'Transport Account', value: 'Transport Account' },
                  { label: 'Personal Account', value: 'Personal Account' },
                  { label: 'Company Account', value: 'Company Account' }
                ]}
                onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                readOnly={!isAdmin}
              />
            </div>
          )}

        </div>
      </div>

      {/* Address Information */}
      <div className="bg-card-bg p-4 rounded-[8px] shadow-sm">
        <h3 className="text-sm font-bold text-text-main mb-4 capitalize pb-2">address information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2">
            <InputField 
              label="Country"
              name="presentCountry"
              type="select"
              value={formData.presentCountry}
              options={countries.map(c => ({ label: c.name, value: c.name, icon: c.flag }))}
              onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
              readOnly={!isAdmin}
            />
          </div>

          <>
            {isAddressEnabled && (
              <>
                <div   >
                  <InputField 
                    label="Police Station"
                    name="policeStation"
                    type="select"
                    value={formData.policeStation}
                    options={policeStations.filter((ps: any) => ps.country === formData.presentCountry).map((ps: any) => ({ label: ps.name, value: ps.name }))}
                    onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                    readOnly={!isAdmin}
                  />
                </div>

                <div   >
                  <InputField 
                    label="Post office Name"
                    name="postOffice"
                    type="select"
                    value={formData.postOffice}
                    options={postOffices.filter((po: any) => !po.country || po.country === formData.presentCountry).map((po: any) => ({ label: `${po.name} (${po.code})`, value: po.name }))}
                    onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                    readOnly={!isAdmin}
                  />
                </div>
                
                <div   >
                  <InputField 
                    label="Postal code"
                    name="postalCode"
                    value={formData.postalCode}
                    readOnly
                    className="h-14 bg-gray-50 cursor-not-allowed text-gray-400"
                    onChange={() => {}}
                  />
                </div>

                <div   >
                  <InputField 
                    label="State / Region"
                    name="state"
                    type="select"
                    value={formData.state}
                    options={states.filter((s: any) => s.country === formData.presentCountry).map((s: any) => ({ label: s.name, value: s.name }))}
                    onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                    readOnly={!isAdmin}
                  />
                </div>

                <div   >
                  <InputField 
                    label="Ciyt / Town"
                    name="city"
                    type="select"
                    value={formData.city}
                    options={cities.filter((c: any) => c.country === formData.presentCountry).map((c: any) => ({ label: c.name, value: c.name }))}
                    onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                    readOnly={!isAdmin}
                  />
                </div>

                <div    className="col-span-2">
                  <InputField 
                    label="Address"
                    name="addressLine1"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    readOnly={!isAdmin}
                  />
                </div>
                
                <div   >
                  <InputField 
                    label="Building Number"
                    name="buildingNumber"
                    type="tel"
                    inputMode="numeric"
                    value={formData.buildingNumber}
                    onChange={(e) => handleChange('buildingNumber', e.target.value)}
                    readOnly={!isAdmin}
                  />
                </div>

                <div   >
                  <InputField 
                    label="Street Number"
                    name="streetNumber"
                    type="tel"
                    inputMode="numeric"
                    value={formData.streetNumber}
                    onChange={(e) => handleChange('streetNumber', e.target.value)}
                    readOnly={!isAdmin}
                  />
                </div>

                <div   >
                  <InputField 
                    label="Zone Number"
                    name="zoneNumber"
                    type="tel"
                    inputMode="numeric"
                    value={formData.zoneNumber}
                    onChange={(e) => handleChange('zoneNumber', e.target.value)}
                    readOnly={!isAdmin}
                  />
                </div>

                <div   >
                  <InputField 
                    label="Electricity Number"
                    name="electricityNumber"
                    type="tel"
                    inputMode="numeric"
                    value={formData.electricityNumber}
                    onChange={(e) => handleChange('electricityNumber', e.target.value)}
                    readOnly={!isAdmin}
                  />
                </div>
              </>
            )}
          </>
        </div>
      </div>

      {/* Permissions Management (All Users can view, Only Admin can edit) */}

      {/* Subscription & Permissions (Admin Only - but not for other admins) */}
      {isAdmin && !isEditingSelf && targetUser?.role !== 'ADMIN' && (
        <div className="bg-card-bg p-4 rounded-[8px] shadow-sm">
          <h3 className="text-sm font-bold text-text-main mb-4 capitalize pb-2">Subscription & Permissions</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-3">
              <button
                onClick={() => setShowPermissionsModal(true)}
                className="w-full h-12 rounded-lg border-2 border-dashed border-black/5 dark:border-white/10 flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-cyan-500 hover:text-cyan-500 transition-all"
              >
                <Shield size={16} />
                Manage Module Permissions ({GLOBAL_DASHBOARD_MODULES.filter(m => DEFAULT_OVERRIDABLE_PERMISSIONS.includes(m.id) ? !(formData.deniedPermissions || []).includes(m.id) : formData.permissions.includes(m.id)).length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex gap-4 mt-6 pb-6">
          {(isAdmin || isEditingSelf) && (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ 
                backgroundColor: currentThemeObj.primary,
                boxShadow: `0 10px 15px -3px ${currentThemeObj.primary}33`
              }}
              className="flex-1 flex items-center justify-center gap-2 h-14 rounded-[8px] text-white font-bold text-xs hover:opacity-90 transition-all shadow-lg uppercase tracking-widest active:scale-95 animate-pulse"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} className="animate-bounce" />
              )}
              {language === 'bn' ? 'আপডেট ডেটা' : 'Update Data'}
            </button>
          )}
      </div>
    </div>
    );
  };

  return (
    <>
        {showPermissionsModal ? (
          <div 
            key="permissions"
            className="w-full flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 w-full mx-auto pt-18 pb-4 overflow-y-auto scrollbar-hide min-h-0">
              <div className={`grid ${appGrid === '3x6' ? 'grid-cols-3' : 'grid-cols-4'} sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4`}>
                {GLOBAL_DASHBOARD_MODULES.map((m) => {
                  const label = t[m.labelKey as keyof typeof t] || m.labelKey || m.id;
                  return {
                    id: m.id,
                    label,
                    icon: m.icon,
                    color: m.color
                  };
                }).map((item: any) => {
                  const isSelected = DEFAULT_OVERRIDABLE_PERMISSIONS.includes(item.id)
                    ? !(formData.deniedPermissions || []).includes(item.id)
                    : formData.permissions.includes(item.id);
                  const customTextColor = getContrastColor(item.color);
                  return (
                    <button
                      key={item.id}
                      onClick={() => togglePermission(item.id)}
                      className={`bg-card-bg border-white/10 py-3 px-1 rounded-lg shadow-sm flex flex-col items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all aspect-square w-full h-full border relative ${isSelected ? 'ring-2 ring-offset-1 dark:ring-offset-black' : ''}`}
                      style={isSelected ? { ringColor: currentThemeObj.primary } : {}}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center z-10 shadow-sm" style={{ backgroundColor: currentThemeObj.primary }}>
                          <Check size={10} className="text-white font-black" />
                        </div>
                      )}
                      <div 
                        className={`${appGrid === '3x6' ? 'w-14 h-14' : 'w-11 h-11'} shrink-0 rounded-[6px] flex items-center justify-center shadow-sm`}
                        style={{ backgroundColor: item.color, color: customTextColor }}
                      >
                        {React.cloneElement(item.icon as React.ReactElement, { size: appGrid === '3x6' ? 24 : 18 })}
                      </div>
                      <span className={`${appGrid === '3x6' ? 'text-[11px]' : 'text-[10px]'} font-black text-text-main text-center leading-tight w-full px-0.5 whitespace-normal line-clamp-2`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="w-full px-2 py-4 border-t border-white/5 bg-app-bg shrink-0">
              <div className="w-full max-w-4xl mx-auto">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="w-full h-14 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm"
                  style={{ 
                    background: currentThemeObj.primary,
                    boxShadow: `0 10px 25px -5px ${currentThemeObj.primary}66`
                  }}
                >
                  Done ({GLOBAL_DASHBOARD_MODULES.filter(m => DEFAULT_OVERRIDABLE_PERMISSIONS.includes(m.id) ? !(formData.deniedPermissions || []).includes(m.id) : formData.permissions.includes(m.id)).length} Selected)
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            key="form"
            className="w-full"
          >
            {isDesktop ? (
              <FormWindow title={pageTitle} onClose={() => {
                setView('USER_PROFILE');
              }}>
                {renderForm()}
              </FormWindow>
            ) : (
              renderForm()
            )}
          </div>
        )}
      <GlobalFullscreenSelect 
        isOpen={selectModal.isOpen}
        onClose={() => setSelectModal(prev => ({ ...prev, isOpen: false }))}
        onSelect={handleSelect}
        options={selectModal.options}
        title={selectModal.label}
        selectedValue={formData[selectModal.name as keyof typeof formData] as string}
      />
    </>
  );
};

export default AdminProfileUpdate;
