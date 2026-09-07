import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { subscribeFirebaseCollection, saveFirebaseDoc, subscribeFirebaseCollectionGroup } from '@/services/firebase';
import { useStore } from '@/store';
import { TRANSLATIONS } from '@/translations';
import { Users, ChevronRight, Search, ArrowLeft, Plus, Phone, X, Check, Calendar, Globe, MapPin, ShoppingCart, User as UserIcon, Trash2 } from 'lucide-react';
import PartnerProfileCard from '@/components/PartnerProfileCard';
import InputField, { InputFieldThemeContext } from '@/components/InputField';

import { COUNTRIES } from '@/data/locations';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';

export default function ManagerProfile() {
  const { user, isDarkMode: storeIsDarkMode, theme, isNightMode, appThemeMode, showFeedback, goBack, setCustomBackAction, setNavigationDirection, navigationDirection, language } = useStore();
  const currentLanguage = language || 'en';
  const t = (key: keyof typeof TRANSLATIONS['en']) => {
    return TRANSLATIONS[currentLanguage]?.[key] || TRANSLATIONS['en'][key] || key;
  };
  const isDarkMode = storeIsDarkMode || theme === 'night-mode' || isNightMode || appThemeMode === 'dark';

  const [partners, setPartners] = useState<any[]>([]);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [globalItems, setGlobalItems] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [isManagerFullDetailsOpen, setIsManagerFullDetailsOpen] = useState(false);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Partner vs Inactive Partner tab for selected manager
  const [activePartnerTab, setActivePartnerTab] = useState<'active' | 'inactive'>('active');
  const [selectedPartnerDetails, setSelectedPartnerDetails] = useState<any>(null);
  const [isPartnerDeleteConfirmOpen, setIsPartnerDeleteConfirmOpen] = useState(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);

  // Form states matching Purchase section New Partner flow
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserForLinking, setSelectedUserForLinking] = useState<any>(null);
  const [alreadyLinkedUserAlert, setAlreadyLinkedUserAlert] = useState<any>(null);

  const [formAccountType, setFormAccountType] = useState<'PARTNER' | 'MANAGER'>('MANAGER');
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formNationality, setFormNationality] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formStateNumber, setFormStateNumber] = useState('');
  const [formZoneNumber, setFormZoneNumber] = useState('');
  const [formBuildingNumber, setFormBuildingNumber] = useState('');
  const [formElectricityNumber, setFormElectricityNumber] = useState('');
  const [formAreaName, setFormAreaName] = useState('');
  const [formMonthlySalary, setFormMonthlySalary] = useState('');
  const [formPrice, setFormPrice] = useState('');

  const [subSelectModal, setSubSelectModal] = useState<{
    isOpen: boolean;
    name: string;
    label: string;
    options: any[];
  }>({
    isOpen: false,
    name: '',
    label: '',
    options: [],
  });

  useEffect(() => {
    const unsubscribePartners = subscribeFirebaseCollection('partners', (data) => setPartners(data));
    const unsubscribePurchases = subscribeFirebaseCollectionGroup('Purchase', (data) => setPurchases(data));
    const unsubscribeUsers = subscribeFirebaseCollection('users', (data) => setGlobalUsers(data));
    const unsubscribeItems = subscribeFirebaseCollection('items', (data) => setGlobalItems(data));
    return () => {
      unsubscribePartners();
      unsubscribePurchases();
      unsubscribeUsers();
      unsubscribeItems();
    };
  }, []);

  const handleOpenSubSelectModal = (name: string, label: string, options: any[]) => {
    setSubSelectModal({ isOpen: true, name, label, options });
  };

  const handleSubSelectModalChange = (value: string) => {
    if (subSelectModal.name === 'country') {
      setFormCountry(value);
    } else if (subSelectModal.name === 'accountType') {
      setFormAccountType(value as 'PARTNER' | 'MANAGER');
    }
    setSubSelectModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOpenAddManagerProfile = () => {
    setIsUserListOpen(true);
  };

  const handleSelectUser = (u: any) => {
    setSelectedUser(u);
    setFormName(u.name || '');
    setFormMobile(u.mobileNumber || '');
    setFormDob(u.dob || '');
    setFormNationality(u.nationality || '');
    
    setFormCountry(u.presentCountry || u.country || '');
    setFormStateNumber(u.stateNumber || '');
    setFormZoneNumber(u.zoneNumber || '');
    setFormBuildingNumber(u.buildingNumber || '');
    setFormElectricityNumber(u.electricityNumber || '');
    setFormAreaName(u.addressLine1 || u.city || u.manualAddress || '');
    setFormAccountType('MANAGER'); // Default to MANAGER since it is the Add Manager Profile action
    
    setIsUserListOpen(false);
    setIsPartnerFormOpen(true);
  };

  const handleClosePartnerForm = () => {
    setIsPartnerFormOpen(false);
    setFormMonthlySalary('');
    setFormPrice('');
    setFormAccountType('MANAGER');
    setEditingPartnerId(null);
  };

  const handlePartnerSubmit = async () => {
    if (!selectedUser) return;
    
    const existingPartner = editingPartnerId 
      ? partners.find(p => p.id === editingPartnerId)
      : partners.find(p => p.userId === selectedUser.id);
      
    let generatedPartnerId = existingPartner?.partnerId;
    
    if (formAccountType === 'MANAGER' && existingPartner?.accountType !== 'MANAGER') {
      generatedPartnerId = `MGR-${Math.floor(1000000 + Math.random() * 9000000)}`;
    } else if (formAccountType === 'PARTNER' && existingPartner?.accountType !== 'PARTNER') {
      generatedPartnerId = String(Math.floor(1000000 + Math.random() * 9000000));
    } else if (!generatedPartnerId) {
      generatedPartnerId = formAccountType === 'MANAGER' ? `MGR-${Math.floor(1000000 + Math.random() * 9000000)}` : String(Math.floor(1000000 + Math.random() * 9000000));
    }
    
    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false });

    const partnerData = {
      id: existingPartner?.id || editingPartnerId || `PARTNER-${Date.now()}`,
      partnerId: generatedPartnerId,
      userId: selectedUser.id,
      name: formName,
      mobile: formMobile,
      dob: formDob,
      nationality: formNationality,
      country: formCountry,
      stateNumber: formStateNumber,
      zoneNumber: formZoneNumber,
      buildingNumber: formBuildingNumber,
      electricityNumber: formElectricityNumber,
      areaName: formAreaName,
      monthlySalary: formMonthlySalary,
      price: formPrice,
      joiningDate: existingPartner?.joiningDate || currentDate,
      joiningTime: existingPartner?.joiningTime || currentTime,
      createdAt: existingPartner?.createdAt || Date.now(),
      avatar: selectedUser.avatar || null,
      accountType: formAccountType,
      managerId: existingPartner?.managerId || (selectedManager && formAccountType === 'PARTNER' ? selectedManager.id : ''),
      status: existingPartner?.status === 'deleted' ? 'active' : (existingPartner?.status || 'active')
    };

    try {
      await saveFirebaseDoc('partners', partnerData.id, partnerData);
      // Update associated user's role in the database
      await saveFirebaseDoc('users', selectedUser.id, {
        role: formAccountType === 'MANAGER' ? 'MANAGER' : 'USER',
        managerId: partnerData.managerId || ''
      });
      
      // Update selected manager state if it's currently selected
      if (selectedManager && selectedManager.id === partnerData.id) {
        setSelectedManager({ ...selectedManager, ...partnerData });
      }
      
      // Also update selectedPartnerDetails if it's the one we just edited
      if (selectedPartnerDetails && selectedPartnerDetails.id === partnerData.id) {
        setSelectedPartnerDetails({ ...selectedPartnerDetails, ...partnerData });
      }
      
      showFeedback('Profile saved successfully!', 'success');
      handleClosePartnerForm();
    } catch (e: any) {
      console.error("Partner Submit Error:", e);
      showFeedback(`Failed to save profile: ${e.message || 'Unknown error'}`, 'error');
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const managers = partners.filter(p => {
    const isManager = p.accountType === 'MANAGER';
    const status = p.status || 'active';
    return isManager && (activeTab === 'active' ? status === 'active' : status === 'inactive');
  });

  const handleEdit = () => {
    if (!selectedManager) return;
    
    // Find the original user or use selectedManager if not found
    const u = globalUsers.find(user => user.id === selectedManager.userId) || selectedManager;
    setSelectedUser(u);
    
    setFormName(selectedManager.name || u.name || '');
    setFormMobile(selectedManager.mobile || u.mobileNumber || '');
    setFormDob(selectedManager.dob || u.dob || '');
    setFormNationality(selectedManager.nationality || u.nationality || '');
    setFormCountry(selectedManager.country || u.presentCountry || u.country || '');
    setFormStateNumber(selectedManager.stateNumber || u.stateNumber || '');
    setFormZoneNumber(selectedManager.zoneNumber || u.zoneNumber || '');
    setFormBuildingNumber(selectedManager.buildingNumber || u.buildingNumber || '');
    setFormElectricityNumber(selectedManager.electricityNumber || u.electricityNumber || '');
    setFormAreaName(selectedManager.areaName || u.addressLine1 || u.city || u.manualAddress || '');
    setFormAccountType(selectedManager.accountType || 'MANAGER');
    setFormMonthlySalary(selectedManager.monthlySalary || '');
    setFormPrice(selectedManager.price || '');
    
    setIsPartnerFormOpen(true);
  };

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await saveFirebaseDoc('partners', selectedManager.id, { ...selectedManager, status: 'deleted' });
      if (selectedManager.userId) {
        await saveFirebaseDoc('users', selectedManager.userId, { role: 'USER' });
      }
      showFeedback('Manager deleted successfully!', 'success');
      setSelectedManager(null);
      setIsManagerFullDetailsOpen(false);
      setIsDeleteConfirmOpen(false);
    } catch (e) {
      showFeedback('Failed to delete manager', 'error');
    }
  };

  const handleToggleStatus = async () => {
    try {
      const newStatus = selectedManager.status === 'inactive' ? 'active' : 'inactive';
      await saveFirebaseDoc('partners', selectedManager.id, { ...selectedManager, status: newStatus });
      setSelectedManager({ ...selectedManager, status: newStatus });
      showFeedback(`Status changed to ${newStatus}`, 'success');
    } catch (e) {
      showFeedback('Failed to change status', 'error');
    }
  };

  const handlePartnerEdit = () => {
    if (!selectedPartnerDetails) return;
    const u = globalUsers.find(user => user.id === selectedPartnerDetails.userId) || selectedPartnerDetails;
    setSelectedUser(u);
    setFormName(selectedPartnerDetails.name || u.name || '');
    setFormMobile(selectedPartnerDetails.mobile || u.mobileNumber || u.mobile || '');
    setFormDob(selectedPartnerDetails.dob || u.dob || '');
    setFormNationality(selectedPartnerDetails.nationality || u.nationality || '');
    setFormCountry(selectedPartnerDetails.country || u.presentCountry || u.country || '');
    setFormStateNumber(selectedPartnerDetails.stateNumber || u.stateNumber || '');
    setFormZoneNumber(selectedPartnerDetails.zoneNumber || u.zoneNumber || '');
    setFormBuildingNumber(selectedPartnerDetails.buildingNumber || u.buildingNumber || '');
    setFormElectricityNumber(selectedPartnerDetails.electricityNumber || u.electricityNumber || '');
    setFormAreaName(selectedPartnerDetails.areaName || selectedPartnerDetails.manualAddress || u.addressLine1 || u.city || u.manualAddress || '');
    setFormMonthlySalary(selectedPartnerDetails.monthlySalary || '');
    setFormPrice(selectedPartnerDetails.price || '');
    setFormAccountType(selectedPartnerDetails.accountType || 'PARTNER');
    
    setEditingPartnerId(selectedPartnerDetails.id);
    setIsPartnerFormOpen(true);
  };

  const handlePartnerDelete = () => {
    setIsPartnerDeleteConfirmOpen(true);
  };

  const confirmPartnerDelete = async () => {
    try {
      await saveFirebaseDoc('partners', selectedPartnerDetails.id, { ...selectedPartnerDetails, status: 'deleted' });
      showFeedback('Partner deleted successfully!', 'success');
      setSelectedPartnerDetails(null);
      setIsPartnerDeleteConfirmOpen(false);
    } catch (e) {
      showFeedback('Failed to delete partner', 'error');
    }
  };

  const handlePartnerToggleStatus = async () => {
    try {
      const newStatus = selectedPartnerDetails.status === 'inactive' ? 'active' : 'inactive';
      const updated = { ...selectedPartnerDetails, status: newStatus };
      await saveFirebaseDoc('partners', selectedPartnerDetails.id, updated);
      setSelectedPartnerDetails(updated);
      showFeedback(`Status changed to ${newStatus}`, 'success');
    } catch (e) {
      showFeedback('Failed to change status', 'error');
    }
  };

  const handleConfirmLink = async (u: any) => {
    try {
      const existingPartner = partners.find(p => p.userId === u.id);
      if (existingPartner) {
        // Update existing partner document to link with this manager
        await saveFirebaseDoc('partners', existingPartner.id, {
          ...existingPartner,
          managerId: selectedManager.id,
          accountType: 'PARTNER',
          status: 'active'
        });
      } else {
        // Create a new partner document linked with this manager
        const generatedPartnerId = String(Math.floor(1000000 + Math.random() * 9000000));
        const partnerData = {
          id: `PARTNER-${Date.now()}`,
          partnerId: generatedPartnerId,
          userId: u.id,
          name: u.name || '',
          mobile: u.mobileNumber || u.mobile || '',
          dob: u.dob || '',
          nationality: u.nationality || '',
          country: u.presentCountry || u.country || '',
          stateNumber: u.stateNumber || '',
          zoneNumber: u.zoneNumber || '',
          buildingNumber: u.buildingNumber || '',
          electricityNumber: u.electricityNumber || '',
          areaName: u.addressLine1 || u.city || u.manualAddress || '',
          monthlySalary: u.monthlySalary || '',
          price: u.price || '',
          joiningDate: new Date().toISOString().split('T')[0],
          joiningTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
          createdAt: Date.now(),
          avatar: u.avatar || null,
          accountType: 'PARTNER',
          managerId: selectedManager.id,
          status: 'active'
        };
        await saveFirebaseDoc('partners', partnerData.id, partnerData);
      }
      
      // Also update user document
      await saveFirebaseDoc('users', u.id, {
        ...u,
        managerId: selectedManager.id
      });
      
      showFeedback(`Successfully added ${u.name} as a partner under ${selectedManager.name}!`, 'success');
      setSelectedUserForLinking(null);
      setIsAddPartnerModalOpen(false);
    } catch (err) {
      console.error("Error adding partner under manager:", err);
      showFeedback('Failed to assign partner under manager', 'error');
    }
  };

  const handleManagerClick = (manager: any) => {
    setSelectedManager(manager);
    setIsManagerFullDetailsOpen(false);
    window.dispatchEvent(new CustomEvent('change-title', { detail: 'Manager Details' }));
  };

  const handleBack = () => {
    if (selectedPartnerDetails) {
      setSelectedPartnerDetails(null);
    } else if (isManagerFullDetailsOpen) {
      setIsManagerFullDetailsOpen(false);
      window.dispatchEvent(new CustomEvent('change-title', { detail: 'Manager Details' }));
    } else if (selectedManager) {
      setSelectedManager(null);
      window.dispatchEvent(new CustomEvent('change-title', { detail: 'Manager Profile' }));
    } else {
      goBack();
    }
  };

  useEffect(() => {
    const handleGlobalBack = () => {
      if (alreadyLinkedUserAlert) {
        setAlreadyLinkedUserAlert(null);
        setIsAddPartnerModalOpen(true);
      } else if (selectedPartnerDetails) {
        setSelectedPartnerDetails(null);
      } else if (isManagerFullDetailsOpen) {
        setNavigationDirection('backward');
        setIsManagerFullDetailsOpen(false);
        window.dispatchEvent(new CustomEvent('change-title', { detail: 'Manager Details' }));
      } else if (selectedManager) {
        setNavigationDirection('backward');
        setSelectedManager(null);
        window.dispatchEvent(new CustomEvent('change-title', { detail: 'Manager Profile' }));
      } else if (isAddPartnerModalOpen) {
        setIsAddPartnerModalOpen(false);
      } else if (subSelectModal.isOpen) {
        setSubSelectModal(prev => ({ ...prev, isOpen: false }));
      } else if (isPartnerFormOpen) {
        setIsPartnerFormOpen(false);
      } else if (isUserListOpen) {
        setIsUserListOpen(false);
      } else {
        setCustomBackAction(null);
        goBack();
      }
    };

    if (alreadyLinkedUserAlert || selectedPartnerDetails || isManagerFullDetailsOpen || selectedManager || isAddPartnerModalOpen || subSelectModal.isOpen || isPartnerFormOpen || isUserListOpen) {
      setCustomBackAction(handleGlobalBack);
    } else {
      setCustomBackAction(null);
    }

    window.addEventListener('close-permissions-overlay', handleGlobalBack);
    return () => {
      setCustomBackAction(null);
      window.removeEventListener('close-permissions-overlay', handleGlobalBack);
    };
  }, [alreadyLinkedUserAlert, selectedPartnerDetails, isManagerFullDetailsOpen, selectedManager, isAddPartnerModalOpen, isUserListOpen, isPartnerFormOpen, subSelectModal.isOpen, goBack, setCustomBackAction, setNavigationDirection]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('change-title', { detail: 'Manager Profile' }));
    return () => {
      window.dispatchEvent(new CustomEvent('change-title', { detail: null }));
    };
  }, []);

  const totalPurchaseAmount = purchases
    .filter(p => p.status === 'approved' || !p.status)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const filteredUsers = globalUsers.filter(u => {
    const isManager = partners.some(p => p.userId === u.id && p.accountType === 'MANAGER' && p.status !== 'deleted');
    if (isManager || u.role === 'ADMIN') return false;
    
    return u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.mobileNumber?.includes(searchQuery) ||
      u.id?.includes(searchQuery);
  });

  const linkedPartners = partners.filter(p => {
    const isPartner = p.accountType === 'PARTNER';
    const isLinked = selectedManager && String(p.managerId) === String(selectedManager.id);
    const status = p.status || 'active';
    const matchesTab = activePartnerTab === 'active' 
      ? status === 'active' 
      : (status === 'inactive' || status === 'deleted');
    return isPartner && isLinked && matchesTab;
  });

  return (
    <div className="relative min-h-screen">
      {selectedManager ? (
        selectedPartnerDetails ? (
          <div key="partner-details" className="relative z-10 max-w-4xl mx-auto space-y-6 pb-24">
            <PartnerProfileCard 
              selectedPartnerProfile={selectedPartnerDetails}
              globalUsers={globalUsers}
              isDarkMode={isDarkMode}
              user={user}
              purchases={purchases}
              partners={partners}
              totalPurchaseAmount={
                purchases
                  .filter(p => (String(p.userId) === String(selectedPartnerDetails.userId)) && (p.status === 'approved' || !p.status))
                  .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
              }
              isAdmin={isAdmin}
              onEdit={handlePartnerEdit}
              onDelete={handlePartnerDelete}
              onToggleStatus={handlePartnerToggleStatus}
            />
          </div>
        ) : isManagerFullDetailsOpen ? (
          <div key="full-details" className="relative z-10 max-w-4xl mx-auto space-y-6 pb-24">
            <PartnerProfileCard 
              selectedPartnerProfile={selectedManager}
              globalUsers={globalUsers}
              isDarkMode={isDarkMode}
              user={user}
              purchases={purchases}
              partners={partners}
              totalPurchaseAmount={totalPurchaseAmount}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        ) : (
          <div key="simple-card" className="relative z-10 max-w-4xl mx-auto space-y-6 pb-24">
            {/* Active / Inactive Partner Selector */}
            <div className="manager-tab-container bg-gray-100 dark:bg-white/10 rounded-lg p-1.5 flex items-center relative w-full h-14">
              <button
                onClick={() => setActivePartnerTab('active')}
                className={`flex-1 h-full text-center text-sm font-bold transition-all duration-200 relative z-10 rounded-[6px] flex items-center justify-center ${activePartnerTab === 'active' ? 'bg-emerald-600 text-white shadow-md' : 'text-red-500 hover:text-red-600 bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                Active Partner
              </button>
              <button
                onClick={() => setActivePartnerTab('inactive')}
                className={`flex-1 h-full text-center text-sm font-bold transition-all duration-200 relative z-10 rounded-[6px] flex items-center justify-center ${activePartnerTab === 'inactive' ? 'bg-emerald-600 text-white shadow-md' : 'text-red-500 hover:text-red-600 bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                Inactive Partner
              </button>
            </div>

            {/* Simple Manager Card */}
            <div 
              onClick={() => setIsManagerFullDetailsOpen(true)}
              className={`manager-profile-card p-5 rounded-2xl border cursor-pointer transition-all active:scale-95 flex items-center justify-between group ${
                  isDarkMode 
                    ? 'bg-[#121212] border-white/10 hover:border-purple-500/50 hover:bg-[#003853]' 
                    : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-sm hover:border-purple-500/50 hover:shadow-md hover:from-purple-50 hover:to-white'
              }`}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-[2px] border border-[#333333] rounded-[10px] flex-shrink-0">
                  <div className="w-14 h-14 rounded-[8px] bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-[#333333] overflow-hidden">
                    {selectedManager.avatar || globalUsers.find(u => u.id === selectedManager.userId)?.avatar ? (
                      <img src={selectedManager.avatar || globalUsers.find(u => u.id === selectedManager.userId)?.avatar} alt={selectedManager.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="text-purple-500" size={24} />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col items-start gap-1 w-fit">
                    <h3 className={`font-bold truncate text-base leading-tight border-b-[1.5px] border-[#FFD700] w-fit pb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedManager.name}</h3>
                    <div className="flex flex-col gap-0.5 mt-0.5 items-start">
                      <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 border-b-[1.5px] border-[#FFD700] w-fit pb-0.5">
                        <Phone size={10} /> {selectedManager.mobile || globalUsers.find(u => u.id === selectedManager.userId)?.mobileNumber || 'No mobile'}
                      </span>
                      <span className="text-[11px] font-bold font-mono text-gray-600 dark:text-gray-300 border-b-[1.5px] border-[#FFD700] w-fit pb-0.5">Manager ID: {selectedManager.partnerId || selectedManager.userId || globalUsers.find(u => u.id === selectedManager.userId)?.id}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isDarkMode ? 'bg-white/5 group-hover:bg-purple-500/20' : 'bg-gray-100 group-hover:bg-purple-100'
              }`}>
                <ChevronRight size={20} className={`transition-colors ${isDarkMode ? 'text-gray-400 group-hover:text-purple-400' : 'text-gray-500 group-hover:text-purple-600'}`} />
              </div>
            </div>

            {/* Partners List */}
            <div className="space-y-3">
              <h4 className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {activePartnerTab === 'active' ? 'Active Partners' : 'Inactive Partners'} ({linkedPartners.length})
              </h4>
              
              {linkedPartners.length === 0 ? (
                <div className={`p-8 text-center rounded-2xl border ${
                  isDarkMode ? 'bg-[#121212]/50 border-white/5 text-gray-500' : 'bg-gray-50 border-gray-100 text-gray-400'
                }`}>
                  <Users size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No {activePartnerTab} partners linked to this manager.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedPartners.map((partner) => {
                    const partnerUserObj = globalUsers.find(u => u.id === partner.userId);
                    return (
                      <div
                        key={partner.id}
                        onClick={() => setSelectedPartnerDetails(partner)}
                        className={`manager-profile-card p-4 rounded-2xl border cursor-pointer transition-all active:scale-95 flex items-center justify-between group ${
                          isDarkMode 
                            ? 'bg-[#121212] border-white/10 hover:border-purple-500/50 hover:bg-[#003853]' 
                            : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-sm hover:border-purple-500/50 hover:shadow-md hover:from-purple-50 hover:to-white'
                        }`}
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className="p-[2px] border border-gray-300 dark:border-white/10 rounded-[10px] flex-shrink-0">
                            <div className="w-12 h-12 rounded-[8px] bg-gradient-to-br from-purple-500/15 to-indigo-500/15 flex items-center justify-center overflow-hidden">
                              {partner.avatar || partnerUserObj?.avatar ? (
                                <img src={partner.avatar || partnerUserObj?.avatar} alt={partner.name} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="text-purple-500" size={20} />
                              )}
                            </div>
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col items-start gap-1">
                              <h5 className={`font-bold truncate text-sm leading-tight border-b border-gray-200 dark:border-white/10 pb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {partner.name}
                              </h5>
                              <div className="flex flex-col gap-0.5 items-start">
                                <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                                  <Phone size={8} /> {partner.mobile || partnerUserObj?.mobileNumber || 'No mobile'}
                                </span>
                                <span className="text-[10px] font-bold font-mono text-gray-600 dark:text-gray-400">
                                  Partner ID: {partner.partnerId || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await saveFirebaseDoc('partners', partner.id, {
                                    ...partner,
                                    managerId: ""
                                  });
                                  if (partner.userId) {
                                    const fullUserObj = globalUsers.find(u => u.id === partner.userId);
                                    if (fullUserObj) {
                                      await saveFirebaseDoc('users', partner.userId, {
                                        ...fullUserObj,
                                        managerId: ""
                                      });
                                    }
                                  }
                                  showFeedback(`Successfully unlinked ${partner.name} from this manager!`, 'success');
                                } catch (err) {
                                  console.error("Error unlinking partner:", err);
                                  showFeedback('Failed to unlink partner', 'error');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 text-[10px] font-bold transition-all"
                            >
                              Unlink
                            </button>
                          )}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                            isDarkMode ? 'bg-white/5 group-hover:bg-purple-500/20' : 'bg-gray-100 group-hover:bg-purple-100'
                          }`}>
                            <ChevronRight size={16} className={`transition-colors ${isDarkMode ? 'text-gray-400 group-hover:text-purple-400' : 'text-gray-500 group-hover:text-purple-600'}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        <div key="list" className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="manager-tab-container bg-gray-100 dark:bg-white/10 rounded-xl p-1.5 flex items-center relative w-full mb-4 h-14">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 h-full text-center text-sm font-bold transition-all duration-200 relative z-10 rounded-[6px] flex items-center justify-center ${activeTab === 'active' ? 'bg-emerald-600 text-white shadow-md' : 'text-red-500 hover:text-red-600 bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              Active Manager
            </button>
            <button
              onClick={() => setActiveTab('inactive')}
              className={`flex-1 h-full text-center text-sm font-bold transition-all duration-200 relative z-10 rounded-[6px] flex items-center justify-center ${activeTab === 'inactive' ? 'bg-emerald-600 text-white shadow-md' : 'text-red-500 hover:text-red-600 bg-transparent hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              Inactive Manager
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {managers.length === 0 ? (
              <div className="col-span-full py-12 text-center opacity-50">
                <Users size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>No managers found in the system.</p>
              </div>
            ) : (
              managers.map(manager => {
                const u = globalUsers.find(u => u.id === manager.userId);
                return (
                  <div
                    key={manager.id}
                    onClick={() => handleManagerClick(manager)}
                    className={`manager-profile-card p-5 rounded-2xl border cursor-pointer transition-all active:scale-95 flex items-center justify-between group ${
                      isDarkMode 
                        ? 'bg-[#121212] border-white/10 hover:border-purple-500/50 hover:bg-[#003853]' 
                        : 'bg-gradient-to-r from-white to-gray-50 border-gray-200 shadow-sm hover:border-purple-500/50 hover:shadow-md hover:from-purple-50 hover:to-white'
                    }`}
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-[2px] border border-[#333333] rounded-[10px] flex-shrink-0">
                        <div className="w-14 h-14 rounded-[8px] bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-[#333333] overflow-hidden">
                          {manager.avatar || u?.avatar ? (
                            <img src={manager.avatar || u.avatar} alt={manager.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="text-purple-500" size={24} />
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col items-start gap-1 w-fit">
                          <h3 className={`font-bold truncate text-base leading-tight border-b-[1.5px] border-[#FFD700] w-fit pb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{manager.name}</h3>
                          <div className="flex flex-col gap-0.5 mt-0.5 items-start">
                            <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1 border-b-[1.5px] border-[#FFD700] w-fit pb-0.5">
                              <Phone size={10} /> {manager.mobile || u?.mobileNumber || 'No mobile'}
                            </span>
                            <span className="text-[11px] font-bold font-mono text-gray-600 dark:text-gray-300 border-b-[1.5px] border-[#FFD700] w-fit pb-0.5">Manager ID: {manager.partnerId || manager.userId || u?.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                      isDarkMode ? 'bg-white/5 group-hover:bg-purple-500/20' : 'bg-gray-100 group-hover:bg-purple-100'
                    }`}>
                      <ChevronRight size={20} className={`transition-colors ${isDarkMode ? 'text-gray-400 group-hover:text-purple-400' : 'text-gray-500 group-hover:text-purple-600'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Partner Button */}
      {selectedManager && !isManagerFullDetailsOpen && !selectedPartnerDetails && user?.role === 'ADMIN' && (
        <button
          onClick={() => setIsAddPartnerModalOpen(true)}
          className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] lg:bottom-24 right-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white w-14 h-14 rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Add Manager Button */}
      {!selectedManager && user?.role === 'ADMIN' && (
        <button
          onClick={handleOpenAddManagerProfile}
          className="fixed bottom-[calc(85px+env(safe-area-inset-bottom))] lg:bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Add Manager Modal (System Users List) */}
      {isAddPartnerModalOpen && createPortal(
        <div 
          style={{ zIndex: 9999 }}
          className="fixed inset-0 w-full h-full flex items-center justify-center p-4 bg-black/75 backdrop-blur-3xl animate-in fade-in duration-300"
        >
          <div className={`w-full max-w-md rounded-[10px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border ${isDarkMode ? 'bg-gradient-to-br from-[#000000] via-[#001830] to-[#12002b] border-white/10' : 'bg-gradient-to-br from-white via-purple-50 to-indigo-50 border-purple-200'}`}>
            <div className="p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
              <h3 className="font-black text-xl text-white relative z-10 flex items-center gap-2">
                <Users size={22} className="text-purple-200" />
                Select Partner
              </h3>
              <button 
                onClick={() => setIsAddPartnerModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white/20 hover:bg-white/30 text-white relative z-10 backdrop-blur-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
              <InputField
                label="Search users by name, ID or mobile..."
                name="searchUsers"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
                className="h-14 font-semibold"
                labelBgColor={isDarkMode ? '#121212' : '#ffffff'}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-3 space-y-3 custom-scrollbar">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12 opacity-50 flex flex-col items-center">
                  <Users size={48} className={`mb-4 opacity-50 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No users found</p>
                </div>
              ) : (
                filteredUsers.map(u => {
                  const isAlreadyLinked = partners.some(p => p.userId === u.id && p.accountType === 'PARTNER' && p.status !== 'deleted');
                  return (
                    <div 
                      key={u.id}
                      onClick={() => {
                        if (isAlreadyLinked) {
                          setAlreadyLinkedUserAlert(u);
                        } else {
                          setSelectedUserForLinking(u);
                        }
                        setIsAddPartnerModalOpen(false);
                      }}
                      className={`p-4 rounded-[10px] border cursor-pointer transition-all active:scale-95 flex flex-col group ${
                        isDarkMode 
                          ? 'bg-[#121212] border-white/10 hover:border-purple-500/50 hover:bg-[#003853]' 
                          : 'border-gray-200 shadow-sm hover:border-purple-500/50 hover:shadow-md'
                      }`}
                      style={isDarkMode ? {} : { backgroundColor: '#ebebeb' }}
                    >
                      {/* Header: Name and Avatar */}
                      <div className="flex items-center gap-3 pb-2">
                        <div className={`w-10 h-10 rounded-full flex flex-shrink-0 items-center justify-center overflow-hidden border transition-colors ${
                          isDarkMode ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-600 border-purple-200'
                        }`}>
                          {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <Users size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-black truncate text-sm uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>{u.name || 'No Name'}</h4>
                        </div>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${
                          isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'
                        }`}>
                          <ChevronRight size={14} />
                        </div>
                      </div>

                      {/* Divider Line */}
                      <div className="border-t my-1 opacity-70 border-card-divider"></div>

                      {/* Info Rows */}
                      <div className="pt-1.5 space-y-1.5 text-xs">
                        {/* User ID Row */}
                        <div className="flex justify-between items-center py-1 border-b opacity-70 border-card-divider">
                          <span className={`${isDarkMode ? 'text-gray-400 dark:text-gray-500' : 'text-black'} font-bold`}>User ID</span>
                          <span className={`font-mono font-black ${isDarkMode ? 'text-purple-400' : 'text-black'}`}>
                            {u.userId || 'N/A'}
                          </span>
                        </div>

                        {/* Mobile Row */}
                        <div className="flex justify-between items-center py-1 border-b opacity-70 border-card-divider">
                          <span className={`${isDarkMode ? 'text-gray-400 dark:text-gray-500' : 'text-black'} font-bold`}>Mobile Number</span>
                          <span className={`font-black flex items-center gap-1 ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                            <Phone size={10} className="opacity-60" /> {u.mobileNumber || u.mobile || 'No mobile'}
                          </span>
                        </div>

                        {/* Status Row */}
                        <div className="flex justify-between items-center py-1">
                          <span className={`${isDarkMode ? 'text-gray-400 dark:text-gray-500' : 'text-black'} font-bold`}>{t('STATUS')}</span>
                          <span className={`font-black ${
                            isAlreadyLinked 
                              ? 'text-emerald-500 dark:text-emerald-400' 
                              : 'text-amber-500 dark:text-amber-400'
                          }`}>
                            {isAlreadyLinked ? t('USER_ALREADY_LINKED') : t('USER_NOT_LINKED')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL 1: User List for New Partner */}
      {createPortal(
        <>
          {isUserListOpen && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={() => setIsUserListOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div 
                
                
                
                className="relative w-full bg-card-bg max-w-md border border-border-main/80 rounded-[10px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[80vh]"
                style={{ backgroundColor: isDarkMode ? '#121212' : '#ffffff' }}
              >
                <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-white" />
                    <h3 className="text-base font-black tracking-wide">Select User</h3>
                  </div>
                  <button 
                    onClick={() => setIsUserListOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3">
                  {globalUsers.filter(u => {
                    const isManager = partners.some(p => p.userId === u.id && p.accountType === 'MANAGER' && p.status !== 'deleted');
                    return !isManager && u.role !== 'ADMIN';
                  }).map(u => (
                    <div 
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`border border-border-main/50 hover:border-purple-500/50 rounded-[10px] p-4 flex items-center gap-4 cursor-pointer transition-all hover:shadow-sm ${isDarkMode ? 'bg-background-main' : ''}`}
                      style={isDarkMode ? {} : { backgroundColor: '#ebebeb' }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 overflow-hidden">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={24} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{u.name}</p>
                        <p className={`text-xs font-medium mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-black'}`}>ID: {u.userId || u.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* MODAL 2: Add Manager Profile Form */}
      {createPortal(
        <>
          {isPartnerFormOpen && selectedUser && (
            <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={handleClosePartnerForm}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div 
                
                
                
                className="relative w-full bg-card-bg max-w-md border border-border-main/80 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh]"
                style={{ backgroundColor: isDarkMode ? '#121212' : '#ffffff' }}
              >
                <div className="px-6 py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-white" />
                    <h3 className="text-base font-black tracking-wide">
                      {selectedManager && selectedUser && selectedManager.userId === selectedUser.id ? 'Edit Manager Profile' : 'Add Manager Profile'}
                    </h3>
                  </div>
                  <button 
                    onClick={handleClosePartnerForm}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <InputFieldThemeContext.Provider value={isDarkMode ? 'dark' : 'light'}>
                  <div className="p-6 overflow-y-auto space-y-4">
                    <InputField
                      label="Name"
                      name="name"
                      value={formName}
                      onChange={(e: any) => setFormName(e.target.value)}
                      icon={<UserIcon size={16} />}
                    />
                    <InputField
                      label="Account Type"
                      name="accountType"
                      type="select"
                      options={[
                        { value: 'MANAGER', label: 'Manager Profile' },
                        { value: 'PARTNER', label: 'Partner' }
                      ]}
                      value={formAccountType === 'MANAGER' ? 'Manager Profile' : 'Partner'}
                      onChange={() => {}}
                      onOpenModal={handleOpenSubSelectModal}
                      icon={<Users size={16} />}
                    />
                    <InputField
                      label="Mobile Number"
                      name="mobile"
                      value={formMobile}
                      onChange={(e: any) => setFormMobile(e.target.value)}
                      icon={<Phone size={16} />}
                    />
                    <InputField
                      label="Date of Birth"
                      name="dob"
                      type="date"
                      value={formDob}
                      onChange={(e: any) => setFormDob(e.target.value)}
                      icon={<Calendar size={16} />}
                    />
                    <InputField
                      label="Nationality"
                      name="nationality"
                      value={formNationality}
                      onChange={(e: any) => setFormNationality(e.target.value)}
                      icon={<Globe size={16} />}
                    />
                    <div className="space-y-4 pt-2">
                      <h4 className="text-[10px] font-black uppercase text-text-muted tracking-widest border-b border-border-main/50 pb-2">
                        Current Address
                      </h4>
                      
                      <InputField
                        label="Country"
                        name="country"
                        type="select"
                        options={COUNTRIES.map(c => ({ value: c.name, label: `${c.flag} ${c.name}` }))}
                        value={formCountry}
                        onChange={(e: any) => setFormCountry(e.target.value)}
                        onOpenModal={handleOpenSubSelectModal}
                        icon={<Globe size={16} />}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="State Number"
                          name="stateNumber"
                          value={formStateNumber}
                          onChange={(e) => setFormStateNumber(e.target.value)}
                          icon={<MapPin size={16} />}
                        />
                        <InputField
                          label="Zone Number"
                          name="zoneNumber"
                          value={formZoneNumber}
                          onChange={(e) => setFormZoneNumber(e.target.value)}
                          icon={<MapPin size={16} />}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="Building Number"
                          name="buildingNumber"
                          value={formBuildingNumber}
                          onChange={(e) => setFormBuildingNumber(e.target.value)}
                          icon={<MapPin size={16} />}
                        />
                        <InputField
                          label="Electricity Number"
                          name="electricityNumber"
                          value={formElectricityNumber}
                          onChange={(e) => setFormElectricityNumber(e.target.value)}
                          icon={<MapPin size={16} />}
                        />
                      </div>
                      
                      <InputField
                        label="Area Name"
                        name="areaName"
                        value={formAreaName}
                        onChange={(e) => setFormAreaName(e.target.value)}
                        icon={<MapPin size={16} />}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <InputField
                          label="Monthly Salary"
                          name="monthlySalary"
                          type="number"
                          placeholder="Enter salary"
                          value={formMonthlySalary}
                          onChange={(e: any) => {
                            const value = e.target.value;
                            setFormMonthlySalary(value);
                            const salary = parseFloat(value) || 0;
                            const totalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                            const calculatedPrice = (salary / 30) * totalDays;
                            setFormPrice(calculatedPrice > 0 ? calculatedPrice.toFixed(2) : '');
                          }}
                          icon={<ShoppingCart size={16} />}
                        />
                        <InputField
                          label="Price"
                          name="price"
                          type="number"
                          placeholder="Auto-calculated"
                          value={formPrice}
                          onChange={() => {}}
                          icon={<ShoppingCart size={16} />}
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Joining Date"
                        name="joiningDate"
                        value={new Date().toISOString().split('T')[0]}
                        onChange={() => {}}
                        icon={<Calendar size={16} />}
                        readOnly
                      />
                      <InputField
                        label="Joining Time"
                        name="joiningTime"
                        value={new Date().toLocaleTimeString('en-US', { hour12: false })}
                        onChange={() => {}}
                        icon={<Calendar size={16} />}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-border-main/50 bg-background-main/50 flex items-center justify-end gap-3 shrink-0">
                    <button 
                      onClick={handleClosePartnerForm}
                      className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 font-bold rounded-xl text-xs transition-colors active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handlePartnerSubmit}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                      Submit
                    </button>
                  </div>
                </InputFieldThemeContext.Provider>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* MODAL 3: Delete Confirmation */}
      {createPortal(
        <>
          {isDeleteConfirmOpen && (
            <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div 
                
                
                
                className={`relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col ${isDarkMode ? 'bg-[#121212] text-white border border-white/10' : 'bg-white text-gray-900'}`}
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                    <Trash2 size={28} />
                  </div>
                  <h3 className="text-xl font-black mb-2">Delete Manager</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Are you sure you want to delete <span className="font-bold">{selectedManager?.name}</span>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                  <button 
                    onClick={() => setIsDeleteConfirmOpen(false)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDelete}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* MODAL 4: Partner Delete Confirmation */}
      {createPortal(
        <>
          {isPartnerDeleteConfirmOpen && (
            <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
              <div 
                
                
                
                onClick={() => setIsPartnerDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />
              <div 
                
                
                
                className={`relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col ${isDarkMode ? 'bg-[#121212] text-white border border-white/10' : 'bg-white text-gray-900'}`}
              >
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-50">
                    <Trash2 size={28} />
                  </div>
                  <h3 className="text-xl font-black mb-2">Delete Partner</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Are you sure you want to delete <span className="font-bold">{selectedPartnerDetails?.name}</span>? This action cannot be undone.
                  </p>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                  <button 
                    onClick={() => setIsPartnerDeleteConfirmOpen(false)}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmPartnerDelete}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* MODAL 5: Partner Link Details Pop-up Confirmation */}
      {createPortal(
        <>
          {selectedUserForLinking && (
            <div 
              style={{ zIndex: 10005 }}
              className="fixed inset-0 flex items-center justify-center p-4"
            >
              <div 
                
                
                
                onClick={() => {
                  setSelectedUserForLinking(null);
                  setIsAddPartnerModalOpen(true);
                }}
                className="absolute inset-0 bg-black/75 backdrop-blur-md"
              />
              <div 
                
                
                
                className={`relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh] border ${isDarkMode ? 'bg-[#121212] text-white border border-white/10' : 'bg-white text-gray-900 border-gray-200'}`}
              >
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
                      {selectedUserForLinking.avatar ? (
                        <img src={selectedUserForLinking.avatar} alt={selectedUserForLinking.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="text-white" size={20} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-base uppercase leading-tight">{selectedUserForLinking.name || 'No Name'}</h3>
                      <span className="text-[10px] text-purple-200 font-mono font-bold tracking-wider">PREVIEW DETAILS</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedUserForLinking(null);
                      setIsAddPartnerModalOpen(true);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-white/20 hover:bg-white/30 text-white relative z-10 backdrop-blur-sm"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Details Content with Horizontal Lines */}
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                  <div className="space-y-1">
                    <h4 className="text-[10px] font-black uppercase text-purple-500 tracking-widest pb-1 border-b opacity-70 border-card-divider">
                      Account Mapped Information
                    </h4>
                  </div>

                  <div className="divide-y text-sm opacity-70 divide-card-divider">
                    {/* User ID */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">User ID</span>
                      <span className={`font-mono font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                        {selectedUserForLinking.userId || 'N/A'}
                      </span>
                    </div>

                    {/* Email */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Email Address</span>
                      <span className="font-bold truncate max-w-[200px]">
                        {selectedUserForLinking.email || (selectedUserForLinking.id && selectedUserForLinking.id.includes('@') ? selectedUserForLinking.id : 'N/A')}
                      </span>
                    </div>

                    {/* Mobile */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Mobile Number</span>
                      <span className="font-bold flex items-center gap-1">
                        <Phone size={12} className="opacity-60" /> {selectedUserForLinking.mobileNumber || selectedUserForLinking.mobile || 'N/A'}
                      </span>
                    </div>

                    {/* DOB */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Date of Birth</span>
                      <span className="font-bold">{selectedUserForLinking.dob || 'N/A'}</span>
                    </div>

                    {/* Nationality */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Nationality</span>
                      <span className="font-bold">{selectedUserForLinking.nationality || 'N/A'}</span>
                    </div>

                    {/* Country */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Country</span>
                      <span className="font-bold">{selectedUserForLinking.presentCountry || selectedUserForLinking.country || 'N/A'}</span>
                    </div>

                    {/* State Number */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">State Number</span>
                      <span className="font-bold">{selectedUserForLinking.stateNumber || 'N/A'}</span>
                    </div>

                    {/* Zone Number */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Zone Number</span>
                      <span className="font-bold">{selectedUserForLinking.zoneNumber || 'N/A'}</span>
                    </div>

                    {/* Building Number */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Building Number</span>
                      <span className="font-bold">{selectedUserForLinking.buildingNumber || 'N/A'}</span>
                    </div>

                    {/* Electricity Number */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Electricity Number</span>
                      <span className="font-bold">{selectedUserForLinking.electricityNumber || 'N/A'}</span>
                    </div>

                    {/* Area/Address */}
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-gray-400 dark:text-gray-500 font-medium">Area / Address</span>
                      <span className="font-bold truncate max-w-[200px]">
                        {selectedUserForLinking.addressLine1 || selectedUserForLinking.city || selectedUserForLinking.manualAddress || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer with Link and Cancel Buttons */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 shrink-0">
                  <button 
                    onClick={() => {
                      setSelectedUserForLinking(null);
                      setIsAddPartnerModalOpen(true);
                    }}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleConfirmLink(selectedUserForLinking)}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* MODAL 6: Already Linked User Alert Pop-up */}
      {createPortal(
        <>
          {alreadyLinkedUserAlert && (
            <div 
              style={{ zIndex: 10006 }}
              className="fixed inset-0 flex items-center justify-center p-4"
            >
              <div 
                
                
                
                onClick={() => {
                  setAlreadyLinkedUserAlert(null);
                  setIsAddPartnerModalOpen(true);
                }}
                className="absolute inset-0 bg-black/75 backdrop-blur-md"
              />
              <div 
                
                
                
                className={`relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col p-6 border text-center ${
                  isDarkMode 
                    ? 'bg-[#121212] text-white border-white/10' 
                    : 'bg-white text-gray-900 border-gray-200'
                }`}
              >
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                    <Check size={32} className="animate-pulse" />
                  </div>
                  
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    {alreadyLinkedUserAlert.name || 'User'}
                  </h3>
                  
                  <p className={`text-sm px-2 font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t('ALREADY_LINKED_ALERT_MSG')}
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setAlreadyLinkedUserAlert(null);
                    setIsAddPartnerModalOpen(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-purple-500/30"
                >
                  {t('OK_UNDERSTOOD')}
                </button>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      <GlobalFullscreenSelect
        isOpen={subSelectModal.isOpen}
        onClose={() => setSubSelectModal((prev) => ({ ...prev, isOpen: false }))}
        onSelect={handleSubSelectModalChange}
        options={subSelectModal.options}
        title={`Select ${subSelectModal.label}`}
      />
    </div>
  );
}

