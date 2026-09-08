
import { uploadToDrive, downloadFromDrive, googleSignIn, getAccessToken } from '@/services/googleDrive';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { User, Trip, Profile, Language, Theme, FinancialRecord, SupportInfo, MonthlyFile, Currency, Payment, Notification, DownloadedFile, FuelPurchase, Loan, LoanPayment, Vehicle, VehicleService } from '@/types';
import { storageService } from '@/services/storageService';
import { getFirebaseCollection, subscribeFirebaseCollection, subscribeFirebaseCollectionGroup, saveFirebaseDoc, deleteFirebaseDoc, clearFirebaseCollection, syncFirebaseCollection, subscribeFirebaseDoc, saveFirebaseDocMerge, auth } from '@/services/firebase';
import { where } from 'firebase/firestore';
import { parseExpiryDate, isExpired, isExpiringSoon } from './utils/dateUtils';
import { decryptSensitiveFields } from './utils/security';
import { WORLD_COUNTRIES, scanAndDetectCountry } from './utils/countryUtils';
import fleetproLogo from './assets/logo.png';
import defaultLoginWallpaper from './assets/login_wallpaper.png';

export const GLOBAL_TRANSITION = {
  duration: 0
};

export const GLOBAL_VARIANTS = {
  initial: { opacity: 1, x: 0 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 1, x: 0 }
};
export const LOCAL_VARIANTS = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 1 }
};

export interface StoreState {
  routeHistory: string[];

  currentView: string;
  setView: (view: any, addToHistory?: boolean) => void;
  goBack: (fromPopState?: boolean, state?: any) => void;
  navigationDirection: 'forward' | 'backward';
  setNavigationDirection: (dir: 'forward' | 'backward') => void;
  logo: string;
  setLogo: (logo: string) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  wallpaper: string;
  setWallpaper: (wallpaper: string) => void;
  loginWallpaper: string;
  setLoginWallpaper: (wallpaper: string) => void;
  loginBackgroundColor: string;
  setLoginBackgroundColor: (color: string) => void;
  loginCardColor: string;
  setLoginCardColor: (color: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
   user: User | null;
  setUser: (user: User | null) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (user: User, oldId?: string) => void;
  approveUser: (userId: string, tempPassword?: string) => void;
  removeUser: (id: string) => void;
  trips: Trip[];
  loans: Loan[];
  allLoans: Loan[];
  addLoan: (loan: Loan) => void;
  updateLoan: (loan: Loan) => void;
  removeLoan: (id: string, userId?: string) => void;
  loanPayments: LoanPayment[];
  allLoanPayments: LoanPayment[];
  addLoanPayment: (payment: LoanPayment) => void;
  updateLoanPayment: (payment: LoanPayment) => void;
  removeLoanPayment: (id: string, userId?: string) => void;
  vehicles: Vehicle[];
  allVehicles: Vehicle[];
  addVehicle: (vehicle: Vehicle) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  removeVehicle: (id: string, userId?: string) => void;
  vehicleServices: VehicleService[];
  allVehicleServices: VehicleService[];
  addVehicleService: (service: VehicleService) => void;
  updateVehicleService: (service: VehicleService) => void;
  removeVehicleService: (id: string, userId?: string) => void;
  allTrips: Trip[];
  addTrip: (trip: Trip) => void;
  profiles: Profile[];
  allProfiles: Profile[];
  addProfile: (profile: Profile) => void;
  finances: FinancialRecord[];
  allFinances: FinancialRecord[];
  logout: (force?: boolean) => void;
  isFeedbackOpen: boolean;
  setIsFeedbackOpen: (open: boolean) => void;
  feedbackMessage: string;
  feedbackType: 'success' | 'error' | 'warning' | 'info';
  showFeedback: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  customHeaderTitle: string | null;
  setCustomHeaderTitle: (title: string | null) => void;
  customBackAction: (() => void) | null;
  setCustomBackAction: (action: (() => void) | null) => void;
  pendingTheme: Theme | null;
  setPendingTheme: (theme: Theme | null) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  loginTime: Date | null;
  setLoginTime: (time: Date | null) => void;
  headerBg: string;
  setHeaderBg: (color: string) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  headerText: string;
  setHeaderText: (color: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  navBg: string;
  setNavBg: (color: string) => void;
  navText: string;
  setNavText: (color: string) => void;
  fontStyle: string;
  setFontStyle: (style: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  fontBold: boolean;
  setFontBold: (bold: boolean) => void;
  supportInfo: SupportInfo;
  setSupportInfo: (info: SupportInfo) => void;
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  activeDetailView: string | null;
  setActiveDetailView: (view: string | null) => void;
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  monthlyFiles: MonthlyFile[];
  allMonthlyFiles: MonthlyFile[];
  addMonthlyFile: (file: MonthlyFile) => void;
  removeMonthlyFile: (id: string) => void;
  currentFile: MonthlyFile | null;
  setCurrentFile: (file: MonthlyFile | null) => void;
  editingTrip: Trip | null;
  setEditingTrip: (trip: Trip | null) => void;
  updateTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
  locations: { country: string, name: string }[];
  addLocation: (location: { country: string, name: string }) => void;
  removeLocation: (country: string, name: string) => void;
  updateLocation: (country: string, oldName: string, newName: string) => void;
  countries: { code: string; name: string; flag: string }[];
  addCountry: (country: { code: string; name: string; flag: string }) => void;
  removeCountry: (code: string) => void;
  updateCountry: (code: string, updatedCountry: { code: string; name: string; flag: string }) => void;
  banks: { id: string; name: string; countryCode?: string }[];
  addBank: (bank: { id: string; name: string; countryCode?: string }) => void;
  removeBank: (id: string) => void;
  updateBank: (id: string, updates: Partial<{ name: string; countryCode: string }>) => void;
  branches: { id: string; name: string; routingNumber?: string; swiftCode?: string; accountTitle?: string; accountNumber?: string; bankId?: string }[];
  addBranch: (branch: { id: string; name: string; routingNumber?: string; swiftCode?: string; accountTitle?: string; accountNumber?: string; bankId?: string }) => void;
  removeBranch: (id: string) => void;
  updateBranch: (id: string, updates: Partial<{ name: string; routingNumber: string; swiftCode: string; accountTitle: string; accountNumber: string; bankId: string }>) => void;
  routingNumbers: { id: string; number: string }[];
  addRoutingNumber: (routing: { id: string; number: string }) => void;
  removeRoutingNumber: (id: string) => void;
  updateRoutingNumber: (id: string, number: string) => void;
  companies: string[];
  addCompany: (company: string) => void;
  removeCompany: (company: string) => void;
  updateCompany: (oldCompany: string, newCompany: string) => void;
  nationalities: { name: string; flag: string }[];
  addNationality: (nationality: { name: string; flag: string }) => void;
  removeNationality: (name: string) => void;
  updateNationality: (oldName: string, updatedNationality: { name: string; flag: string }) => void;
  containerTypes: string[];
  addContainerType: (type: string) => void;
  removeContainerType: (type: string) => void;
  updateContainerType: (oldType: string, newType: string) => void;
  loadingTypes: string[];
  addLoadingType: (type: string) => void;
  removeLoadingType: (type: string) => void;
  updateLoadingType: (oldType: string, newType: string) => void;
  idTypes: string[];
  addIdType: (type: string) => void;
  removeIdType: (type: string) => void;
  updateIdType: (oldType: string, newType: string) => void;
  extraDieselReasons: string[];
  addExtraDieselReason: (reason: string) => void;
  removeExtraDieselReason: (reason: string) => void;
  updateExtraDieselReason: (oldReason: string, newReason: string) => void;
  advanceReasons: string[];
  addAdvanceReason: (reason: string) => void;
  removeAdvanceReason: (reason: string) => void;
  updateAdvanceReason: (oldReason: string, newReason: string) => void;
  emptyReturnYards: string[];
  addEmptyReturnYard: (yard: string) => void;
  removeEmptyReturnYard: (yard: string) => void;
  updateEmptyReturnYard: (oldYard: string, newYard: string) => void;
  genders: string[];
  addGender: (gender: string) => void;
  removeGender: (gender: string) => void;
  updateGender: (oldGender: string, newGender: string) => void;
  religions: string[];
  addReligion: (religion: string) => void;
  removeReligion: (religion: string) => void;
  updateReligion: (oldReligion: string, newReligion: string) => void;
  professions: string[];
  addProfession: (profession: string) => void;
  removeProfession: (profession: string) => void;
  updateProfession: (oldProfession: string, newProfession: string) => void;
  walletIncomeSources: string[];
  addWalletIncomeSource: (source: string) => void;
  removeWalletIncomeSource: (source: string) => void;
  updateWalletIncomeSource: (oldSource: string, newSource: string) => void;
  walletDeductionReasons: string[];
  addWalletDeductionReason: (reason: string) => void;
  removeWalletDeductionReason: (reason: string) => void;
  updateWalletDeductionReason: (oldReason: string, newReason: string) => void;
  walletPaymentMethods: string[];
  bankNames: string[];
  mobileBankingWallets: string[];
  relationships: string[];
  loanPurposes: string[];
  addLoanPurpose: (purpose: string) => void;
  removeLoanPurpose: (purpose: string) => void;
  updateLoanPurpose: (oldPurpose: string, newPurpose: string) => void;
  addWalletPaymentMethod: (method: string) => void;
  removeWalletPaymentMethod: (method: string) => void;
  updateWalletPaymentMethod: (oldMethod: string, newMethod: string) => void;
  addBankName: (name: string) => void;
  removeBankName: (name: string) => void;
  updateBankName: (oldName: string, newName: string) => void;
  addMobileBankingWallet: (name: string) => void;
  removeMobileBankingWallet: (name: string) => void;
  updateMobileBankingWallet: (oldName: string, newName: string) => void;
  addRelationship: (name: string) => void;
  removeRelationship: (name: string) => void;
  updateRelationship: (oldName: string, newName: string) => void;
  adminPin: string;
  setAdminPin: (pin: string) => void;
  selectedTrip: Trip | null;
  setSelectedTrip: (trip: Trip | null) => void;
  currencies: Currency[];
  addCurrency: (currency: Currency) => void;
  removeCurrency: (code: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (code: string) => void;
  publicMenuItems: string[];
  setPublicMenuItems: (items: string[]) => void;
  isNightMode: boolean;
  setIsNightMode: (isDark: boolean) => void;
  appThemeMode: 'light' | 'dark';
  setAppThemeMode: (mode: 'light' | 'dark') => void;
  isEyeComfort: boolean;
  setIsEyeComfort: (isComfort: boolean) => void;
  appGrid: '3x6' | '4x5';
  setAppGrid: (grid: '3x6' | '4x5') => void;
  dashboardOrder: string[];
  setDashboardOrder: (order: string[]) => void;
  dashboardIcon: string;
  setDashboardIcon: (icon: string) => void;
  dashboardIconColor: string;
  setDashboardIconColor: (color: string) => void;
  payments: Payment[];
  allPayments: Payment[];
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  removePayment: (id: string) => void;
  clearPayments: () => void;
  walletTransactions: Payment[];
  allWalletTransactions: Payment[];
  addWalletTransaction: (transaction: Payment) => void;
  updateWalletTransaction: (transaction: Payment) => void;
  removeWalletTransaction: (id: string) => void;
  clearWalletTransactions: () => void;
  fuels: FuelPurchase[];
  allFuels: FuelPurchase[];
  addFuel: (fuel: FuelPurchase) => void;
  updateFuel: (fuel: FuelPurchase) => void;
  removeFuel: (id: string) => void;
  confirmAction: (message: string, onConfirm: () => void, options?: { title?: string; confirmText?: string; cancelText?: string; onSecondaryConfirm?: () => void; secondaryConfirmText?: string }) => void;
  closeConfirm: () => void;
  confirmConfig: { isOpen: boolean; message: string; onConfirm: () => void; title?: string; confirmText?: string; cancelText?: string; onSecondaryConfirm?: () => void; secondaryConfirmText?: string } | null;
  showReceivedBreakdown: boolean;
  setShowReceivedBreakdown: (show: boolean) => void;
  showPendingBreakdown: boolean;
  setShowPendingBreakdown: (show: boolean) => void;
  showAvailableBalancePage: boolean;
  setShowAvailableBalancePage: (show: boolean) => void;
  showPendingBreakdownPage: boolean;
  setShowPendingBreakdownPage: (show: boolean) => void;
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  isLoadingView: boolean;
  setIsLoadingView: (loading: boolean) => void;
  prayerTimeOffsets: Record<string, number>;
  setPrayerTimeOffset: (prayer: string, offset: number) => void;
  isEntryFormOpen: boolean;
  setIsEntryFormOpen: (open: boolean) => void;
  isPaymentPopupOpen: boolean;
  setIsPaymentPopupOpen: (open: boolean) => void;
  isContactSelectionMode: boolean;
  setIsContactSelectionMode: (active: boolean) => void;
  isKeyboardOpen: boolean;
  setIsKeyboardOpen: (open: boolean) => void;
  selectedNotification: Notification | null;
  setSelectedNotification: (notification: Notification | null) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  clearAccountNotifications: (userId: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  exportData: () => void;
  importData: () => Promise<void>;
  exportLocalData: () => Promise<void>;
  importLocalData: (fileContent: string) => Promise<boolean>;
  resetSystem: () => void;
  resetSections: (sections: string[]) => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  policeStations: { country: string, name: string }[];
  addPoliceStation: (policeStation: { country: string, name: string }) => void;
  removePoliceStation: (country: string, name: string) => void;
  updatePoliceStation: (country: string, oldName: string, newName: string) => void;
  cities: { country: string, name: string }[];
  addCity: (city: { country: string, name: string }) => void;
  removeCity: (country: string, name: string) => void;
  updateCity: (country: string, oldName: string, newName: string) => void;
  states: { country: string, name: string }[];
  addState: (state: { country: string, name: string }) => void;
  removeState: (country: string, name: string) => void;
  updateState: (country: string, oldName: string, newName: string) => void;
  postOffices: { country: string; name: string; code: string }[];
  addPostOffice: (postOffice: { country: string; name: string; code: string }) => void;
  removePostOffice: (country: string, name: string) => void;
  updatePostOffice: (country: string, oldName: string, newPostOffice: { country: string; name: string; code: string }) => void;
  globalFilterMonth: number | 'ALL';
  setGlobalFilterMonth: (month: number | 'ALL') => void;
  globalFilterYear: number | 'ALL';
  setGlobalFilterYear: (year: number | 'ALL') => void;
}

const getAffectedTripIds = (payment: any, state: any) => {
  const affectedIds = new Set<string>();
  if (payment && payment.details && payment.details.pendingItems) {
    Object.keys(payment.details.pendingItems).forEach(key => {
      if (key.startsWith('AGG-')) {
        const parts = key.split('-');
        if (parts.length >= 4) {
          const fileId = parts[2];
          const rawCompany = parts.slice(3).join('-');
          const companyNameClean = rawCompany.replace(/_/g, ' ').trim().toUpperCase();
          const matchingTrips = (state.trips || []).filter((t: any) => {
            const matchesFile = t.fileId === fileId;
            const matchesCompany = (t.companyName || '').trim().toUpperCase() === companyNameClean ||
                                   (t.companyName || 'Unknown Company').trim().toUpperCase() === companyNameClean;
            return matchesFile && matchesCompany;
          });
          matchingTrips.forEach((t: any) => affectedIds.add(t.id));
        }
      } else if (key.includes('-') && !key.startsWith('PAY-')) {
        const lastIndex = key.lastIndexOf('-');
        const tripId = key.substring(0, lastIndex);
        affectedIds.add(tripId);
      } else {
        affectedIds.add(key);
      }
    });
  }
  return Array.from(affectedIds);
};

const recalculateTripPayments = (tripId: string, d: any) => {
  const trip = d.trips?.find((t: any) => t.id === tripId);
  if (!trip) return;

  const listPayments = d.payments || [];
  
  // Helper to sum received payments for a specific sub-key
  const getSumOfReceivedPayments = (subKey: string, categoryName: string) => {
    return listPayments
      .filter((p: any) => p.category?.toUpperCase() === categoryName.toUpperCase() && p.status === 'RECEIVED')
      .reduce((sum: number, p: any) => {
        if (!p.details?.pendingItems) return sum;
        
        // Exact match
        const exactVal = p.details.pendingItems[`${tripId}-${subKey}`];
        if (exactVal !== undefined) return sum + (Number(exactVal) || 0);

        // Fallback for old style/legacy entries
        const legacyVal = p.details.pendingItems[tripId];
        if (legacyVal !== undefined) {
          if (
            (subKey === 'dieselPrice' && categoryName.toUpperCase() === 'TRIP DIESEL') ||
            (subKey === 'commission' && categoryName.toUpperCase() === 'COMMISSION') ||
            (subKey === 'friday' && categoryName.toUpperCase() === 'FRIDAY') ||
            (subKey === 'bonus' && categoryName.toUpperCase() === 'BONUS') ||
            (subKey === 'bonus' && categoryName.toUpperCase() === 'TRIP DIESEL') || // fallback for bonus in trip diesel category
            (subKey === 'overtime' && categoryName.toUpperCase() === 'OVERTIME')
          ) {
            return sum + (Number(legacyVal) || 0);
          }
        }

        // AGG- matches
        // AGG-${subKey}-${file.id}-${companyName}
        const aggPrefix = `AGG-${subKey}-${trip.fileId}-`;
        const matchingAggKey = Object.keys(p.details.pendingItems).find(k => k.startsWith(aggPrefix));
        if (matchingAggKey) {
          const originalValue = Number(trip[subKey] || (subKey === 'generatorDiesel' ? trip['genDiesel'] : 0)) || 0;
          return sum + originalValue;
        }

        return sum;
      }, 0);
  };

  const commissionPaid = getSumOfReceivedPayments('commission', 'Commission');
  const dieselPaid = getSumOfReceivedPayments('dieselPrice', 'Trip Diesel');
  const generatorDieselPaid = getSumOfReceivedPayments('generatorDiesel', 'Trip Diesel');
  const extraDieselPaid = getSumOfReceivedPayments('extraDiesel', 'Trip Diesel') + getSumOfReceivedPayments('extraDiesel', 'Extra Fuel');
  const bonusPaid = Math.max(
    getSumOfReceivedPayments('bonus', 'Bonus'),
    getSumOfReceivedPayments('bonus', 'Trip Diesel')
  );
  const fridayPaid = getSumOfReceivedPayments('friday', 'Friday');
  const overtimePaid = getSumOfReceivedPayments('overtime', 'Overtime');

  trip.commissionPaid = commissionPaid;
  trip.dieselPaid = dieselPaid;
  trip.generatorDieselPaid = generatorDieselPaid;
  if ('genDieselPaid' in trip) {
    trip.genDieselPaid = generatorDieselPaid;
  }
  trip.extraDieselPaid = extraDieselPaid;
  trip.bonusPaid = bonusPaid;
  trip.fridayPaid = fridayPaid;
  trip.overtimePaid = overtimePaid;

  const totalAmount = (Number(trip.dieselPrice) || 0) + 
                      (Number(trip.commission) || 0) + 
                      (Number(trip.extraDiesel) || 0) +
                      (Number(trip.friday) || 0) +
                      (Number(trip.bonus) || 0) +
                      (Number(trip.overtime) || 0);
  trip.totalAmount = totalAmount;
  
  const newPaidAmount = commissionPaid + dieselPaid + extraDieselPaid + bonusPaid + fridayPaid + overtimePaid;
  trip.paidAmount = newPaidAmount;

  if (newPaidAmount <= 0) {
    trip.paymentStatus = 'UNPAID';
  } else if (newPaidAmount < totalAmount) {
    trip.paymentStatus = 'PARTIAL';
  } else {
    trip.paymentStatus = 'PAID';
  }

  // Save updated trip to Firebase
  const parentCol = d.user?.role === 'ADMIN' ? 'admins' : 'users';
  const subPath = d.user ? `${parentCol}/${d.user.id}/trips` : 'trips';
  saveFirebaseDoc(subPath, trip.id, trip);
};

export const StoreContext = createContext<StoreState | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<any>(() => {
    const defaults = {
      currentView: 'LOGIN',
      routeHistory: [],
      navigationDirection: 'forward',
      isDrawerOpen: false,
      users: [],
      trips: [],
      loans: [],
      allLoans: [],
      loanPayments: [],
      allLoanPayments: [],
      vehicles: [],
      allVehicles: [],
      vehicleServices: [],
      allVehicleServices: [],
      allTrips: [],
      profiles: [],
      allProfiles: [],
      finances: [],
      allFinances: [],
      monthlyFiles: [],
      allMonthlyFiles: [],
      payments: [],
      allPayments: [],
      walletTransactions: [],
      allWalletTransactions: [],
      fuels: [],
      allFuels: [],
      notifications: [],
      language: 'en',
      theme: 'day-mode',
      appThemeMode: 'light',
      isNightMode: false,
      selectedCurrency: 'USD',
      logo: fleetproLogo,
      zoom: 1,
      headerBg: '',
      primaryColor: '#10b981',
      headerText: '',
      backgroundColor: '',
      navBg: '',
      navText: '#4B5563',
      fontStyle: 'sans',
      fontSize: 14,
      fontBold: false,
      loginWallpaper: '',
      loginBackgroundColor: '',
      loginCardColor: '',
      wallpaper: '',
      transactions: [],
      documents: [],
      publicMenuItems: [],
      locations: [
        { country: 'Qatar', name: 'Doha' },
        { country: 'Qatar', name: 'Industrial Area' },
        { country: 'Qatar', name: 'Hamad Port' },
        { country: 'Qatar', name: 'Al Wakrah' },
        { country: 'Qatar', name: 'Al Rayyan' },
        { country: 'Qatar', name: 'Ras Laffan' },
        { country: 'Qatar', name: 'Mesaieed' },
        { country: 'Qatar', name: 'Lusail' },
        { country: 'Qatar', name: 'Al Khor' },
        { country: 'Saudi Arabia', name: 'Riyadh' },
        { country: 'Saudi Arabia', name: 'Jeddah' },
        { country: 'Saudi Arabia', name: 'Dammam' },
        { country: 'United Arab Emirates', name: 'Dubai' },
        { country: 'United Arab Emirates', name: 'Abu Dhabi' },
        { country: 'Kuwait', name: 'Kuwait City' },
        { country: 'Bahrain', name: 'Manama' },
        { country: 'Oman', name: 'Muscat' },
        { country: 'Bangladesh', name: 'Dhaka' },
        { country: 'Bangladesh', name: 'Chittagong' }
      ],
      countries: WORLD_COUNTRIES.slice(0, 35).map(c => ({ code: c.code, name: c.name, flag: c.flag })),
      companies: [],
      nationalities: [],
      containerTypes: [],
      loadingTypes: [],
      idTypes: [],
      extraDieselReasons: [],
      advanceReasons: [],
      emptyReturnYards: ['GWC YARD', 'GAC YARD', 'HAMAD PORT', 'CTC YARD'],
      genders: ['MALE', 'FEMALE', 'OTHER'],
      religions: ['ISLAM', 'HINDUISM', 'CHRISTIANITY', 'BUDDHISM', 'OTHER'],
      professions: ['DRIVER', 'MANAGER', 'TECHNICIAN', 'ADMINISTRATOR', 'OTHER'],
      walletIncomeSources: ['Salary', 'Bonus', 'Freelance', 'Business Income', 'Investment Return', 'Other'],
      walletDeductionReasons: ['Bill Payment', 'Transport', 'Food & Dining', 'Rent & Utilities', 'Office Expense', 'Others'],
      walletPaymentMethods: ['Cash', 'Bank Transfer', 'Mobile Banking'],
      bankNames: ['Islami Bank', 'Dutch-Bangla Bank', 'Brac Bank', 'City Bank', 'Pubali Bank'],
      mobileBankingWallets: ['bKash', 'Nagad', 'Rocket', 'Upay'],
      relationships: ['Father', 'Mother', 'Brother', 'Sister', 'Wife', 'Son', 'Daughter'],
      loanPurposes: ['Personal Loan', 'Business Loan', 'Vehicle Loan', 'Emergency Medical', 'Education', 'Home Improvement', 'Travel', 'Wedding', 'Debt Consolidation', 'Others'],
      policeStations: [],
      cities: [],
      states: [],
      postOffices: [
        { name: 'Dhaka GPO', code: '1000' },
        { name: 'Chittagong GPO', code: '4000' },
        { name: 'Sylhet GPO', code: '3100' },
        { name: 'Khulna GPO', code: '9000' },
        { name: 'Rajshahi GPO', code: '6000' }
      ],
      dashboardOrder: ['ACTIVE_TRIPS', 'DASHBOARD_STATS', 'CHART', 'RECENT_ACTIVITY'],
      banks: [],
      branches: [],
      routingNumbers: [],
      prayerTimeOffsets: {},
      currencies: [
        { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', exchangeRate: 1.0, isActive: true },
        { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', exchangeRate: 0.031, isActive: true },
        { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 3.64, isActive: true },
        { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 3.92, isActive: true },
        { code: 'SAR', symbol: 'SR', name: 'Saudi Riyal', exchangeRate: 0.97, isActive: true },
        { code: 'AED', symbol: 'DH', name: 'UAE Dirham', exchangeRate: 0.99, isActive: true }
      ],
      adminPin: '1515',
      globalFilterMonth: new Date().getMonth() + 1,
      globalFilterYear: new Date().getFullYear(),
      isFeedbackOpen: false,
      feedbackMessage: '',
      feedbackType: 'success' as const,
      isLoadingView: false,
      isDropdownOpen: false,
      isEntryFormOpen: false,
      isPaymentPopupOpen: false,
      isContactSelectionMode: false,
      isKeyboardOpen: false,
      confirmConfig: null,
      supportInfo: {
        developerName: '',
        mobile: '',
        whatsapp: '',
        nationality: '',
        email: '',
        facebookProfile: '',
        facebookPage: '',
        instagram: '',
        youtube: '',
        mobileCountryCode: '',
        whatsappCountryCode: '',
        showDeveloperName: false,
        showMobile: false,
        showWhatsapp: false,
        showNationality: false,
        showEmail: false,
        showFacebookProfile: false,
        showFacebookPage: false,
        showInstagram: false,
        showYoutube: false,
      }
    };
    try {
      const saved = localStorage.getItem('fleetpro_state');
      if (saved) {
         const parsed = JSON.parse(saved);
         // Filter out undefined keys from parsed so they don't overwrite defaults
         Object.keys(parsed).forEach(key => {
            if (parsed[key] === undefined) {
               delete parsed[key];
            } else if (Array.isArray(parsed[key]) && parsed[key].length === 0 && Array.isArray(defaults[key as keyof StoreState]) && (defaults[key as keyof StoreState] as any[]).length > 0) {
               // Do not let empty arrays override non-empty defaults for config lists
               delete parsed[key];
            }
         });
         if (parsed.loginBackgroundColor === '#F3F4F6') parsed.loginBackgroundColor = '';
         if (parsed.loginCardColor === '') parsed.loginCardColor = '';
         
         // Hydrate login wallpaper
         if (parsed.loginWallpaper && typeof parsed.loginWallpaper === 'string' && (parsed.loginWallpaper.startsWith('data:') || parsed.loginWallpaper.startsWith('http') || parsed.loginWallpaper.startsWith('blob:'))) {
           // Keep saved custom wallpaper
         } else {
           parsed.loginWallpaper = '';
         }
         
         if (!parsed.language) parsed.language = 'en';
         if (!parsed.user) {
           parsed.appThemeMode = 'light';
           parsed.theme = 'day-mode';
           parsed.isNightMode = false;
           parsed.backgroundColor = '';
           parsed.wallpaper = '';
           parsed.headerBg = '';
           parsed.navBg = '';
           parsed.primaryColor = '#10b981';
           parsed.fontStyle = 'sans';
           parsed.fontSize = 14;
           parsed.fontBold = false;
           parsed.loginWallpaper = '';
           parsed.loginBackgroundColor = '';
           parsed.loginCardColor = '';
         } else {
           if (!parsed.appThemeMode || parsed.appThemeMode === 'system') parsed.appThemeMode = 'light';
           if (!parsed.theme || parsed.theme === 'system') parsed.theme = 'day-mode';
           // Keep isNightMode in sync with the resolved theme mode so a stale/legacy
           // isNightMode value (e.g. from an older app version's saved state) can't
           // desync from appThemeMode and force dark mode to stick.
           parsed.isNightMode = parsed.appThemeMode === 'dark';
         }
          if (parsed.logo && typeof parsed.logo === 'string' && (parsed.logo.startsWith('data:') || parsed.logo.startsWith('http') || parsed.logo.startsWith('blob:') || parsed.logo.startsWith('/assets/'))) {
            // Keep saved custom logo synchronously from localStorage
          } else {
            parsed.logo = fleetproLogo;
          }
         
         // Instant 0ms synchronous background color & wallpaper hydration
         if (typeof document !== 'undefined') {
           try {
             const root = document.documentElement;
             const isAuth = !!parsed.user && parsed.currentView !== 'LOGIN' && parsed.currentView !== 'SIGNUP';
             const activeBgColor = isAuth ? (parsed.backgroundColor || '') : (parsed.loginBackgroundColor || parsed.backgroundColor || '');
             const activeWallpaper = isAuth ? (parsed.wallpaper || '') : (parsed.loginWallpaper || parsed.wallpaper || '');
             if (activeWallpaper) {
               root.style.setProperty('--app-bg', `url(${activeWallpaper}) center/cover no-repeat`);
               root.style.setProperty('--theme-bg', `url(${activeWallpaper}) center/cover no-repeat`);
             } else if (activeBgColor) {
               root.style.setProperty('--app-bg', activeBgColor);
               root.style.setProperty('--theme-bg', activeBgColor);
               root.style.setProperty('--page-bg-solid', activeBgColor);
             }
           } catch {}
         }
         
         // Always reset transient visual states to prevent non-dismissible persistent popup bugs
         parsed.isFeedbackOpen = false;
         parsed.feedbackMessage = '';
         parsed.feedbackType = 'success';
         parsed.isLoadingView = false;
         parsed.isDropdownOpen = false;
         parsed.isEntryFormOpen = false;
         parsed.isPaymentPopupOpen = false;
         parsed.confirmConfig = null;
         parsed.currencies = defaults.currencies;

         if (parsed.user) {
           parsed.user = decryptSensitiveFields(parsed.user);
         }
         if (Array.isArray(parsed.users)) {
           parsed.users = parsed.users.map((u: any) => decryptSensitiveFields(u));
         }

         // Clean up payments from local storage to remove corrupt or undefined category records
         if (Array.isArray(parsed.payments)) {
           parsed.payments = parsed.payments.filter((p: any) => p && p.id !== 'PAY-W6970' && p.category !== 'undefined' && p.category !== undefined && p.category !== '');
         }
         if (Array.isArray(parsed.allPayments)) {
           parsed.allPayments = parsed.allPayments.filter((p: any) => p && p.id !== 'PAY-W6970' && p.category !== 'undefined' && p.category !== undefined && p.category !== '');
         }

         return { ...defaults, ...parsed };
      }
    } catch {}
    return defaults;
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const syncTimeoutRef = useRef<any>(null);
  const feedbackTimeoutRef = useRef<any>(null);
  const pendingBrandingSettings = useRef<Record<string, any>>({});

  const mutate = useCallback((recipe: (draft: any, prev: any) => void) => {
    let next;
    let rest: any = {};
    try {
      // Don't stringify functions or they will be dropped
      const { confirmConfig, customBackAction, ...extractedRest } = stateRef.current;
      rest = extractedRest;
      next = JSON.parse(JSON.stringify(rest));
      next.confirmConfig = confirmConfig ? { ...confirmConfig } : null;
      next.customBackAction = customBackAction;
    } catch {
      next = { ...stateRef.current };
    }
    
    // Save the stringified representation of serializable parts before mutation
    let beforeStr = "";
    try {
      beforeStr = JSON.stringify(rest);
    } catch {
      beforeStr = "";
    }
    
    recipe(next, stateRef.current);
    
    // Extract serializable parts of the next state after mutation
    let afterStr = "";
    try {
      const { confirmConfig: nextConfirm, customBackAction: nextBack, ...nextRest } = next;
      afterStr = JSON.stringify(nextRest);
    } catch {
      afterStr = "";
    }
    
    // Also compare non-serializable properties (confirmConfig and customBackAction references)
    const prevConfirm = stateRef.current.confirmConfig;
    const nextConfirm = next.confirmConfig;
    const isConfirmConfigEqual = prevConfirm === nextConfirm || 
      (Boolean(prevConfirm?.isOpen) === Boolean(nextConfirm?.isOpen) && prevConfirm?.message === nextConfirm?.message);
    const isCustomBackActionEqual = next.customBackAction === stateRef.current.customBackAction;
    
    // If absolutely nothing changed, skip calling setState to completely stop unnecessary re-renders/loops
    if (beforeStr && afterStr && beforeStr === afterStr && isConfirmConfigEqual && isCustomBackActionEqual) {
      return;
    }
    
    stateRef.current = next;
    setState(next);
    try { 
       const { confirmConfig, customBackAction, globalFilterMonth, globalFilterYear, ...restToSave } = next;
       localStorage.setItem('fleetpro_state', JSON.stringify(restToSave)); 
    } catch {}
  }, []);

  const scheduleFirebaseSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      // Sync Branding Settings (shared pre-login screen fields only — theme/
      // wallpaper/background/color are local-device-only and never reach here)
      const hasPendingBranding = Object.keys(pendingBrandingSettings.current).length > 0;
      if (hasPendingBranding) {
        const payload = { ...pendingBrandingSettings.current };
        pendingBrandingSettings.current = {};
        saveFirebaseDocMerge('settings', 'branding', payload).catch((err) => {
          console.error('Failed to sync branding key to firebase', err);
        });
      }
    }, 250);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

// Clean handler references approach
  const handlersRef = useRef<Record<string, any>>({});
  
  if (!handlersRef.current['__init']) {
     handlersRef.current['__init'] = true;
     handlersRef.current['showFeedback'] = (message: string, type: any = 'success') => {
        if (feedbackTimeoutRef.current) {
          clearTimeout(feedbackTimeoutRef.current);
        }
        mutate((d: any) => { d.feedbackMessage = message; d.feedbackType = type; d.isFeedbackOpen = true; });
        feedbackTimeoutRef.current = setTimeout(() => {
          mutate((d: any) => d.isFeedbackOpen = false);
          feedbackTimeoutRef.current = null;
        }, 4200);
     };
     handlersRef.current['exportData'] = async () => {
         mutate((d: any) => d.isLoadingView = true);
         const currentUser = stateRef.current.user;
         if (!currentUser) {
            handlersRef.current['showFeedback'](
               stateRef.current.language === 'bn' 
                 ? 'ডাটা এক্সপোর্ট করার জন্য অনুগ্রহ করে প্রথমে লগইন করুন।' 
                 : 'Please log in first to export your data.', 
               'error'
            );
            mutate((d: any) => d.isLoadingView = false);
            return;
         }

         handlersRef.current['showFeedback'](
            stateRef.current.language === 'bn' 
              ? 'গুগল ড্রাইভে ব্যক্তিগত ডাটা এক্সপোর্ট করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...' 
              : 'Exporting personal data to Google Drive, please wait...', 
            'success'
         );
         try {
           let token = await getAccessToken();
           if (!token) {
              const result = await googleSignIn();
              if (result) token = result.accessToken;
           }
           if (token) {
              const currentState = stateRef.current;
              
              // Adhering strictly to user request: ONLY export this specific user's personal data
              const personalStateBackup = {
                 isPersonalBackup: true,
                 userId: currentUser.id,
                 userEmail: currentUser.email,
                 user: currentUser,
                 // Filter out other users for security
                 users: [currentUser],
                 
                 // User's personal app records
                 trips: currentState.trips || [],
                 allTrips: currentState.allTrips || [],
                 profiles: currentState.profiles || [],
                 allProfiles: currentState.allProfiles || [],
                 finances: currentState.finances || [],
                 allFinances: currentState.allFinances || [],
                 monthlyFiles: currentState.monthlyFiles || [],
                 allMonthlyFiles: currentState.allMonthlyFiles || [],
                 payments: currentState.payments || [],
                 allPayments: currentState.allPayments || [],
                 walletTransactions: currentState.walletTransactions || [],
                 allWalletTransactions: currentState.allWalletTransactions || [],
                 notifications: currentState.notifications || [],
                 
                 // System configurations (dropdowns)
                 locations: currentState.locations || [],
                 countries: currentState.countries || [],
                 companies: currentState.companies || [],
                 nationalities: currentState.nationalities || [],
                 containerTypes: currentState.containerTypes || [],
                 loadingTypes: currentState.loadingTypes || [],
                 idTypes: currentState.idTypes || [],
                 extraDieselReasons: currentState.extraDieselReasons || [],
                 advanceReasons: currentState.advanceReasons || [],
                 emptyReturnYards: currentState.emptyReturnYards || [],
                 genders: currentState.genders || [],
                 religions: currentState.religions || [],
                 professions: currentState.professions || [],
                  walletIncomeSources: currentState.walletIncomeSources || [],
                  walletDeductionReasons: currentState.walletDeductionReasons || [],
                  walletPaymentMethods: currentState.walletPaymentMethods || [],
                 bankNames: currentState.bankNames || [],
                 mobileBankingWallets: currentState.mobileBankingWallets || [],
                 relationships: currentState.relationships || [],
                 loanPurposes: currentState.loanPurposes || [],
                 policeStations: currentState.policeStations || [],
                 cities: currentState.cities || [],
                 states: currentState.states || [],
                 postOffices: currentState.postOffices || [],
                 banks: currentState.banks || [],
                 branches: currentState.branches || [],
                 routingNumbers: currentState.routingNumbers || [],
                 
                 // User presentation preferences
                 language: currentState.language,
                 theme: currentState.theme,
                 appThemeMode: currentState.appThemeMode,
                 isNightMode: currentState.isNightMode,
                 selectedCurrency: currentState.selectedCurrency,
                 zoom: currentState.zoom,
                 headerBg: currentState.headerBg,
                 primaryColor: currentState.primaryColor,
                 backgroundColor: currentState.backgroundColor,
                 navBg: currentState.navBg,
                 navText: currentState.navText,
                 fontStyle: currentState.fontStyle,
                 fontSize: currentState.fontSize,
                 fontBold: currentState.fontBold,
                 wallpaper: currentState.wallpaper,
                 loginWallpaper: currentState.loginWallpaper,
                 loginBackgroundColor: currentState.loginBackgroundColor,
                 loginCardColor: currentState.loginCardColor
              };

              const success = await uploadToDrive(personalStateBackup, `fleetpro_backup_user_${currentUser.id}.json`);
              if (success) {
                 handlersRef.current['showFeedback'](
                    currentState.language === 'bn'
                      ? 'সফলভাবে আপনার সকল ব্যক্তিগত ডাটা গুগল ড্রাইভে ব্যাকআপ করা হয়েছে।'
                      : 'Successfully backed up your personal data to Google Drive.',
                    'success'
                 );
              } else {
                 handlersRef.current['showFeedback'](
                    currentState.language === 'bn'
                      ? 'গুগল ড্রাইভে ডাটা ব্যাকআপ আপলোড করা ব্যর্থ হয়েছে।'
                      : 'Failed to upload backup to Google Drive.',
                    'error'
                 );
              }
           }
         } catch (e) {
           console.error(e);
           handlersRef.current['showFeedback'](
              stateRef.current.language === 'bn'
                ? 'ডাটা এক্সপোর্ট ট্রুটি: লগইন প্রয়োজন বা ব্যর্থ হয়েছে।'
                : 'Error exporting data: Login required or failed.',
              'error'
           );
         } finally {
           mutate((d: any) => d.isLoadingView = false);
         }
      };
      handlersRef.current['importData'] = async () => {
         mutate((d: any) => d.isLoadingView = true);
         const currentUser = stateRef.current.user;
         if (!currentUser) {
            handlersRef.current['showFeedback'](
               stateRef.current.language === 'bn'
                 ? 'ডাটা ইমপোর্ট করার জন্য অনুগ্রহ করে প্রথমে লগইন করুন।'
                 : 'Please log in first to import your data.',
               'error'
            );
            mutate((d: any) => d.isLoadingView = false);
            return;
         }

         handlersRef.current['showFeedback'](
            stateRef.current.language === 'bn'
              ? 'গুগল ড্রাইভ থেকে ব্যক্তিগত ডাটা ইমপোর্ট করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...'
              : 'Importing personal data from Google Drive, please wait...',
            'success'
         );
         try {
           let token = await getAccessToken();
           if (!token) {
              const result = await googleSignIn();
              if (result) token = result.accessToken;
           }
           if (token) {
              const data = await downloadFromDrive(`fleetpro_backup_user_${currentUser.id}.json`);
              if (data) {
                 // Check if it belongs to another user
                 if (data.isPersonalBackup && data.userId !== currentUser.id) {
                    handlersRef.current['showFeedback'](
                       stateRef.current.language === 'bn'
                         ? 'নিরাপত্তা ত্রুটি: এই ব্যাকআপ ফাইলটি অন্য কোন ইউজারের। আপনি শুধুমাত্র নিজের ডাটা ইমপোর্ট করতে পারবেন।'
                         : 'Security Error: This backup file belongs to another user. You can only import your own personal data.',
                       'error'
                    );
                    mutate((d: any) => d.isLoadingView = false);
                    return;
                 }

                 const currentState = stateRef.current;
                 const mergedState = {
                    ...currentState,
                    users: currentState.users.map((u: any) => u.id === currentUser.id ? (data.user || u) : u),
                    
                    // Restored personal data
                    trips: data.trips || currentState.trips || [],
                    allTrips: data.allTrips || currentState.allTrips || [],
                    profiles: data.profiles || currentState.profiles || [],
                    allProfiles: data.allProfiles || currentState.allProfiles || [],
                    finances: data.finances || currentState.finances || [],
                    allFinances: data.allFinances || currentState.allFinances || [],
                    monthlyFiles: data.monthlyFiles || currentState.monthlyFiles || [],
                    allMonthlyFiles: data.allMonthlyFiles || currentState.allMonthlyFiles || [],
                    payments: data.payments || currentState.payments || [],
                    allPayments: data.allPayments || currentState.allPayments || [],
                    walletTransactions: data.walletTransactions || currentState.walletTransactions || [],
                    allWalletTransactions: data.allWalletTransactions || currentState.allWalletTransactions || [],
                    loans: data.loans || currentState.loans || [],
                    allLoans: data.allLoans || currentState.allLoans || [],
                    loanPayments: data.loanPayments || currentState.loanPayments || [],
                    allLoanPayments: data.allLoanPayments || currentState.allLoanPayments || [],
                    notifications: data.notifications || currentState.notifications || [],
                    
                    // Restored lookup list dropdowns
                    locations: data.locations || currentState.locations,
                    countries: data.countries || currentState.countries,
                    companies: data.companies || currentState.companies,
                    nationalities: data.nationalities || currentState.nationalities,
                    containerTypes: data.containerTypes || currentState.containerTypes,
                    loadingTypes: data.loadingTypes || currentState.loadingTypes,
                    idTypes: data.idTypes || currentState.idTypes,
                    extraDieselReasons: data.extraDieselReasons || currentState.extraDieselReasons,
                     walletIncomeSources: data.walletIncomeSources || currentState.walletIncomeSources,
                     walletDeductionReasons: data.walletDeductionReasons || currentState.walletDeductionReasons,
                     walletPaymentMethods: data.walletPaymentMethods || currentState.walletPaymentMethods,
                     bankNames: data.bankNames || currentState.bankNames,
                     mobileBankingWallets: data.mobileBankingWallets || currentState.mobileBankingWallets,
                     relationships: data.relationships || currentState.relationships,
                     loanPurposes: data.loanPurposes || currentState.loanPurposes,
                    advanceReasons: data.advanceReasons || currentState.advanceReasons,
                    
                    // Restored preferences
                    language: data.language || currentState.language,
                    theme: data.theme || currentState.theme,
                    appThemeMode: data.appThemeMode || currentState.appThemeMode,
                    isNightMode: typeof data.isNightMode === 'boolean' ? data.isNightMode : currentState.isNightMode,
                    selectedCurrency: data.selectedCurrency || currentState.selectedCurrency,
                    zoom: data.zoom || currentState.zoom,
                    headerBg: data.headerBg || currentState.headerBg,
                    primaryColor: data.primaryColor || currentState.primaryColor,
                    backgroundColor: data.backgroundColor || currentState.backgroundColor,
                    navBg: data.navBg || currentState.navBg,
                    navText: data.navText || currentState.navText,
                    fontStyle: data.fontStyle || currentState.fontStyle,
                    fontSize: data.fontSize || currentState.fontSize,
                    fontBold: typeof data.fontBold === 'boolean' ? data.fontBold : currentState.fontBold,
                    wallpaper: data.wallpaper || currentState.wallpaper,
                    loginWallpaper: data.loginWallpaper || currentState.loginWallpaper,
                    loginBackgroundColor: data.loginBackgroundColor || currentState.loginBackgroundColor,
                    loginCardColor: data.loginCardColor || currentState.loginCardColor
                 };

                 localStorage.setItem('fleetpro_state', JSON.stringify(mergedState));
                 mutate(() => mergedState);
                 
                 handlersRef.current['showFeedback'](
                    stateRef.current.language === 'bn'
                      ? 'ব্যক্তিগত ব্যাকআপ ডাটা সফলভাবে ডাউনলোড ও রিস্টোর করা হয়েছে। রিলোড হচ্ছে...'
                      : 'Personal backup successfully imported. Reloading...',
                    'success'
                 );
                 setTimeout(() => window.location.reload(), 1500);
              } else {
                 handlersRef.current['showFeedback'](
                    stateRef.current.language === 'bn'
                      ? 'গুগল ড্রাইভে কোনো ব্যাকআপ ফাইল পাওয়া যায়নি।'
                      : 'No backup file found in Google Drive.',
                    'error'
                 );
              }
           }
         } catch (e) {
           console.error(e);
           handlersRef.current['showFeedback'](
              stateRef.current.language === 'bn'
                ? 'ডাটা ইমপোর্ট ট্রুটি: লগইন প্রয়োজন বা ব্যর্থ হয়েছে।'
                : 'Error importing data: Login required or failed.',
              'error'
           );
         } finally {
            mutate((d: any) => d.isLoadingView = false);
         }
      };
      handlersRef.current['exportLocalData'] = async () => {
        mutate((d: any) => d.isLoadingView = true);
        try {
          const currentState = stateRef.current;
          const fileName = `fleetpro_backup_${new Date().toISOString().split('T')[0]}.json`;
          const fileContent = JSON.stringify(currentState, null, 2);

          if (Capacitor.isNativePlatform()) {
             // Write a temporary file first
             const writeResult = await Filesystem.writeFile({
               path: fileName,
               data: fileContent,
               directory: Directory.Cache,
               encoding: Encoding.UTF8
             });
             
             // Share the file
             await Share.share({
               title: 'Export FleetPro Backup',
               url: writeResult.uri,
               dialogTitle: 'Export Backup'
             });
             handlersRef.current['showFeedback']('Local backup initiated successfully', 'success');
          } else {
             // Web platform download
             const blob = new Blob([fileContent], { type: 'application/json' });
             const url = URL.createObjectURL(blob);
             const a = window.document.createElement('a');
             a.href = url;
             a.download = fileName;
             window.document.body.appendChild(a);
             a.click();
             window.document.body.removeChild(a);
             URL.revokeObjectURL(url);
             handlersRef.current['showFeedback']('Backup downloaded successfully', 'success');
          }
        } catch (e: any) {
          console.error('Local export error:', e);
          handlersRef.current['showFeedback'](e.message || 'Failed to export local backup', 'error');
        } finally {
          mutate((d: any) => d.isLoadingView = false);
        }
     };
     handlersRef.current['importLocalData'] = async (fileContent: string) => {
        mutate((d: any) => d.isLoadingView = true);
        try {
          const parsed = JSON.parse(fileContent);
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid backup file structure');
          }
          
          // Verify some essential structures (e.g. users, currentView) to make sure it is a valid FleetPro backup
          if (!parsed.currentView && !parsed.user && !parsed.trips) {
            throw new Error('This file does not appear to be a valid backup from this application.');
          }
          
          localStorage.setItem('fleetpro_state', JSON.stringify(parsed));
          handlersRef.current['showFeedback']('Successfully restored backup. Reloading...', 'success');
          setTimeout(() => window.location.reload(), 1500);
          return true;
        } catch (e: any) {
          console.error('Local import error:', e);
          handlersRef.current['showFeedback'](e.message || 'Failed to import backup file', 'error');
          return false;
        } finally {
          mutate((d: any) => d.isLoadingView = false);
        }
     };
     handlersRef.current['clearPayments'] = () => mutate((d: any) => {
       d.payments = [];
       if (d.trips) {
         d.trips.forEach((trip: any) => {
           trip.commissionPaid = 0;
           trip.dieselPaid = 0;
           trip.generatorDieselPaid = 0;
           if ('genDieselPaid' in trip) {
             trip.genDieselPaid = 0;
           }
           trip.extraDieselPaid = 0;
           trip.bonusPaid = 0;
           trip.fridayPaid = 0;
           trip.overtimePaid = 0;
           trip.paidAmount = 0;
           trip.paymentStatus = 'UNPAID';
           
           // Save to Firebase
           const parentCol = d.user?.role === 'ADMIN' ? 'admins' : 'users';
           const subPath = d.user ? `${parentCol}/${d.user.id}/trips` : 'trips';
           saveFirebaseDoc(subPath, trip.id, trip);
         });
       }
     });
     handlersRef.current['clearNotifications'] = () => mutate((d: any) => d.notifications = []);
      handlersRef.current['approveUser'] = async (userId: string, tempPassword?: string) => {
         let hashedPassword = '';
         if (tempPassword) {
            const bcrypt = await import('bcryptjs');
            hashedPassword = await bcrypt.hash(tempPassword, 10);
         }
         mutate((d: any) => {
            if (d.users) {
               const idx = d.users.findIndex((u: any) => u.id === userId);
               if (idx >= 0) {
                  d.users[idx].status = 'ENABLED';
                  d.users[idx].statusTimestamp = new Date().toISOString();
                  if (hashedPassword) {
                     d.users[idx].password = hashedPassword;
                  }
                  const updatedUser = d.users[idx];
                  const coll = updatedUser.role === 'ADMIN' ? 'admins' : 'users';
                  saveFirebaseDoc(coll, updatedUser.id, updatedUser);
               }
            }
         });
      };
     handlersRef.current['addNotification'] = (notification: any) => {
        const id = Date.now().toString() + Math.random().toString(36).substring(7);
        const fullNotification = {
          ...notification,
          id,
          timestamp: new Date().toISOString(),
          isRead: false
        };
        mutate((d: any) => {
           if (!d.notifications) d.notifications = [];
           d.notifications.unshift(fullNotification);
        });
        
        const targetUserId = notification.userId || notification.targetUserId;
        const parentCol = stateRef.current.user?.role === 'ADMIN' ? 'admins' : 'users';
        let subPath = stateRef.current.user ? `${parentCol}/${stateRef.current.user.id}/notifications` : 'notifications';
        
        if (targetUserId) {
          const targetUser = stateRef.current.users?.find((u: any) => u.id === targetUserId);
          const tCol = targetUser?.role === 'ADMIN' ? 'admins' : 'users';
          subPath = `${tCol}/${targetUserId}/notifications`;
        }
        saveFirebaseDoc(subPath, id, fullNotification);
     };
     handlersRef.current['clearAccountNotifications'] = (userId: string) => {
        mutate((d: any) => {
           if (d.notifications) {
              d.notifications = d.notifications.filter((n: any) => n.targetUserId !== userId && n.userId !== userId);
           }
        });
        
        // Let's attempt to delete from Firebase. We don't have all the IDs easily but we can try to fetch them and delete, or just rely on local state updates for now to fix the crash.
        // The most critical part is preventing the app from crashing.
     };
     handlersRef.current['markNotificationAsRead'] = (id: string) => {
        mutate((d: any) => {
           if (d.notifications) {
              const notif = d.notifications.find((n: any) => n.id === id);
              if (notif) {
                 notif.isRead = true;
              }
           }
        });
     };
     handlersRef.current['confirmAction'] = (msg: string, onConfirm: () => void, options?: any) => {
        mutate((d: any) => {
           d.confirmConfig = {
              isOpen: true,
              message: msg,
              onConfirm,
              ...options
           };
        });
     };
     handlersRef.current['closeConfirm'] = () => {
        mutate((d: any) => {
           d.confirmConfig = null;
        });
     };
     handlersRef.current['logout'] = () => {
         const currentUser = stateRef.current.user;
         if (currentUser) {
            const history = currentUser.loginHistory || [];
            const lastLogin = history.filter((h: any) => h.type === 'LOGIN').pop();
            let sessionDuration = '';
            if (lastLogin && lastLogin.timestamp) {
               const diff = Date.now() - lastLogin.timestamp;
               const m = Math.floor(diff / 60000);
               sessionDuration = `${Math.floor(m / 60)}h ${m % 60}m`;
            }
            const newEntry = {
               type: 'LOGOUT',
               timestamp: Date.now(),
               date: new Date().toLocaleDateString('en-GB'),
               time: new Date().toLocaleTimeString('en-US'),
               sessionDuration,
               location: lastLogin?.location || 'Unavailable',
               country: lastLogin?.country || 'Unavailable',
               ip: lastLogin?.ip || 'Unavailable',
               device: lastLogin?.device || 'Unavailable',
            };
            const updatedUser = { ...currentUser, loginHistory: [...history, newEntry] };
            if (handlersRef.current['updateUser']) {
               handlersRef.current['updateUser'](updatedUser);
            }
         }
         
         mutate((d: any) => { 
           d.user = null; 
           d.currentView = 'LOGIN'; 
           d.theme = 'day-mode';
           d.appThemeMode = 'light';
           d.isNightMode = false;
           d.backgroundColor = '';
           d.wallpaper = '';
           d.headerBg = '';
           d.navBg = '';
           d.primaryColor = '#10b981';
           d.fontStyle = 'sans';
           d.fontSize = 14;
           d.fontBold = false;
           d.loginWallpaper = '';
           d.loginBackgroundColor = '';
           d.loginCardColor = '';
           d.trips = [];
           d.allTrips = [];
           d.profiles = [];
           d.allProfiles = [];
           d.finances = [];
           d.allFinances = [];
           d.monthlyFiles = [];
           d.allMonthlyFiles = [];
           d.payments = [];
           d.allPayments = [];
           d.walletTransactions = [];
           d.allWalletTransactions = [];
           d.fuels = [];
           d.allFuels = [];
           d.vehicles = [];
           d.allVehicles = [];
           d.vehicleServices = [];
           d.allVehicleServices = [];
           d.notifications = [];
         });
      };
     handlersRef.current['setNavigationDirection'] = (dir: 'forward' | 'backward') => {
        mutate((d: any) => {
           d.navigationDirection = dir;
        });
     };

     handlersRef.current['goBack'] = (fromPopState: boolean = false, state?: any) => {
        if (fromPopState) {
           mutate((d: any) => {
              d.navigationDirection = 'backward';
              if (state && state.view) {
                 if (d.currentView !== state.view) {
                   if ((state.view === 'LOGIN' || state.view === 'SIGNUP') && d.user) {
                     d.currentView = 'DASHBOARD';
                   } else {
                     d.currentView = state.view;
                   }
                   if (d.routeHistory && d.routeHistory.length > 0) {
                     const idx = d.routeHistory.indexOf(d.currentView);
                     if (idx >= 0) {
                       d.routeHistory = d.routeHistory.slice(0, idx);
                     } else {
                       d.routeHistory.pop();
                     }
                   }
                 }
               } else {
                 if (d.routeHistory && d.routeHistory.length > 0) {
                   d.currentView = d.routeHistory.pop();
                 } else {
                   d.currentView = 'DASHBOARD';
                 }
               }
             d.activeSection = state ? (state.activeSection || null) : null;
             d.activeDetailView = state ? (state.activeDetailView || null) : null;
             d.showReceivedBreakdown = state ? (state.showReceivedBreakdown || false) : false;
             d.showPendingBreakdown = state ? (state.showPendingBreakdown || false) : false;
             d.showAvailableBalancePage = state ? (state.showAvailableBalancePage || false) : false;
             d.showPendingBreakdownPage = state ? (state.showPendingBreakdownPage || false) : false;
             d.selectedCategory = state ? (state.selectedCategory || null) : null;
             if (state && state.view !== 'TRIP_DETAILS' && state.view !== 'NEW_TRIP') {
                d.selectedTrip = null;
                d.editingTrip = null;
             }
              d.isEntryFormOpen = state ? (state.isEntryFormOpen || false) : false;
              d.isPaymentPopupOpen = state ? (state.isPaymentPopupOpen || false) : false;
             d.customHeaderTitle = null;
             d.selectedNotification = null;
           });
        } else {
           window.history.back();
        }
     };
  }

      handlersRef.current['resetSystem'] = async () => {
        mutate((d: any, prev: any) => {
          d.trips = [];
          d.allTrips = [];
          d.profiles = [];
          d.allProfiles = [];
          d.finances = [];
          d.allFinances = [];
          d.monthlyFiles = [];
          d.allMonthlyFiles = [];
          d.payments = [];
          d.allPayments = [];
          d.walletTransactions = [];
          d.allWalletTransactions = [];
          d.fuels = [];
          d.allFuels = [];
          d.loans = [];
          d.allLoans = [];
          d.loanPayments = [];
          d.allLoanPayments = [];
          d.vehicles = [];
          d.allVehicles = [];
          d.vehicleServices = [];
          d.allVehicleServices = [];
          d.notifications = [];
          d.logo = fleetproLogo;
          d.headerBg = '';
          d.backgroundColor = '';
          d.navBg = '';
          d.wallpaper = '';
          d.loginWallpaper = '';
          d.loginBackgroundColor = '';
          d.loginCardColor = '';
          
          const parentCol = prev.user?.role === 'ADMIN' ? 'admins' : 'users';
          if (prev.user) {
            const subCols = ['trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'notifications', 'fuels', 'walletTransactions', 'loans', 'loanPayments', 'vehicles', 'vehicleServices'];
            for (const col of subCols) {
              clearFirebaseCollection(`${parentCol}/${prev.user.id}/${col}`, d[col] || []).catch(() => {});
            }
          }
        });
        
        saveFirebaseDocMerge('settings', 'branding', {
          logo: fleetproLogo,
          headerBg: '',
          backgroundColor: '',
          navBg: '',
          wallpaper: '',
          loginWallpaper: '',
          loginBackgroundColor: '',
          loginCardColor: ''
        }).catch(() => {});
      };

      handlersRef.current['resetSections'] = async (sections: string[]) => {
        mutate((d: any, prev: any) => {
          sections.forEach(sec => {
            const key = sec.toLowerCase();
            if (['trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'notifications', 'fuels', 'walletTransactions', 'loans', 'loanpayments', 'vehicles', 'vehicleservices'].includes(key)) {
              d[key] = [];
              const targetKey = 'all' + key.charAt(0).toUpperCase() + key.slice(1);
              if (d[targetKey]) d[targetKey] = [];
            }
          });
          
          const parentCol = prev.user?.role === 'ADMIN' ? 'admins' : 'users';
          if (prev.user) {
            sections.forEach(sec => {
              const key = sec.toLowerCase();
              if (['trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'notifications', 'fuels', 'walletTransactions', 'loans', 'loanpayments', 'vehicles', 'vehicleservices'].includes(key)) {
                clearFirebaseCollection(`${parentCol}/${prev.user.id}/${key}`, d[key] || []).catch(() => {});
              }
            });
          }
        });
      };

  useEffect(() => {
    const unsubscribes: any[] = [];

    // Assuming local user login means we should sync down data
    if (state.user) {
      const parentCol = state.user.role === 'ADMIN' ? 'admins' : 'users';
      const parentPath = `${parentCol}/${state.user.id}`;

      // 1. Subscribe to own profile document to keep it always in sync
      unsubscribes.push(
        subscribeFirebaseDoc(parentCol, state.user.id, (data) => {
          if (data) {
            mutate((d: any) => {
              const decryptedData = decryptSensitiveFields(data);
              const updatedUser = { ...d.user, ...decryptedData };
              // Theme/wallpaper/background settings are local-device-only now
              // (never written to Firestore, see setter logic below) — so never
              // let a remote profile update carry a userThemeSettings payload
              // in and overwrite what's on this device.
              if (updatedUser.userThemeSettings) {
                delete updatedUser.userThemeSettings;
              }
              d.user = updatedUser;
              // For standard users, they should only see themselves in the users array for privacy
              if (updatedUser.role !== 'ADMIN') {
                d.users = [updatedUser];
              }
              if (d.selectedUser && d.selectedUser.id === updatedUser.id) {
                d.selectedUser = updatedUser;
              }
            });
          }
        })
      );

      // 2. Load trips, profiles, finances, monthlyFiles, payments, notifications from OWN subcollections
      const userSubCollections = [
        'trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'notifications', 'fuels', 'walletTransactions', 'loans', 'loanPayments', 'vehicles', 'vehicleServices'
      ];

      userSubCollections.forEach(col => {
        const subPath = `${parentPath}/${col}`;
        unsubscribes.push(
          subscribeFirebaseCollection(subPath, (data) => {
            mutate((d: any) => {
              let targetKey = col;
              if (['trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'fuels', 'walletTransactions', 'loans', 'loanPayments', 'vehicles', 'vehicleServices'].includes(col)) {
                targetKey = 'all' + col.charAt(0).toUpperCase() + col.slice(1);
              }
              let cleanData = data || [];
              if (col === 'payments') {
                cleanData = cleanData.filter((p: any) => p && p.id !== 'PAY-W6970' && p.category !== 'undefined' && p.category !== undefined && p.category !== '');
              }
              d[col] = cleanData;
              d[targetKey] = cleanData;
            });
          })
        );
      });



      // 3. For ADMINs, subscribe to all users and admins root collections so they can view user account profiles
      // Admins will NOT subscribe to user trips or payments, satisfying the constraint
      if (state.user.role === 'ADMIN') {
        // Run a background delete of the duplicate users/Admin document if present
        deleteFirebaseDoc('users', 'Admin').catch(() => {});

        unsubscribes.push(
          subscribeFirebaseCollection('users', (data) => {
            mutate((d: any) => {
              const decryptedList = (data || []).map((u: any) => decryptSensitiveFields(u));
              const cleanData = decryptedList.filter((u: any) => u.id !== 'Admin');
              const existingAdmins = d.users ? d.users.filter((u: any) => u.role === 'ADMIN') : [];
              d.users = [...cleanData, ...existingAdmins];
              
              if (d.selectedUser) {
                const updatedSelected = cleanData.find((u: any) => u.id === d.selectedUser.id);
                if (updatedSelected) {
                  d.selectedUser = updatedSelected;
                }
              }
            });
          })
        );

        unsubscribes.push(
          subscribeFirebaseCollection('admins', (data) => {
            mutate((d: any) => {
              const decryptedList = (data || []).map((u: any) => decryptSensitiveFields(u));
              const cleanData = decryptedList;
              const adminsWithRole = cleanData.map(u => ({...u, role: u.role || 'ADMIN'}));
              const existingUsers = d.users ? d.users.filter((u: any) => u.role !== 'ADMIN') : [];
              d.users = [...existingUsers, ...adminsWithRole];
              
              if (d.user && d.user.role === 'ADMIN') {
                const updatedAdmin = adminsWithRole.find((u: any) => u.id === d.user.id);
                if (updatedAdmin) {
                  d.user = { ...d.user, ...updatedAdmin };
                }
              }

              if (d.selectedUser) {
                const updatedSelectedAdmin = adminsWithRole.find((u: any) => u.id === d.selectedUser.id);
                if (updatedSelectedAdmin) {
                  d.selectedUser = updatedSelectedAdmin;
                }
              }
            });
          })
        );
      }
    }
      
      const configCols = ['locations', 'countries', 'companies', 'nationalities', 'containerTypes', 'loadingTypes', 'idTypes', 'extraDieselReasons', 'advanceReasons', 'emptyReturnYards', 'banks', 'branches', 'routingNumbers', 'currencies', 'genders', 'religions', 'professions', 'postOffices', 'policeStations', 'cities', 'states', 'walletIncomeSources', 'walletDeductionReasons', 'walletPaymentMethods', 'bankNames', 'mobileBankingWallets', 'relationships', 'loanPurposes'];
      
      // 1. Subscribe to individual documents in 'dropdowns' collection (locations, companies, extraDieselReasons, etc.)
      configCols.forEach(col => {
        unsubscribes.push(
          subscribeFirebaseDoc('dropdowns', col, (docData) => {
            if (docData) {
              const arrayData = Array.isArray(docData.data) ? docData.data : (Array.isArray(docData) ? docData : null);
              if (arrayData && Array.isArray(arrayData) && arrayData.length > 0) {
                mutate((d: any) => {
                  const localList = Array.isArray(d[col]) ? d[col] : [];
                  // Start with arrayData from Firestore and merge with local list (deduplicated)
                  const merged = [...arrayData];
                  localList.forEach((locItem: any) => {
                    const alreadyExists = merged.some((mItem: any) => {
                      if (typeof mItem === 'string' && typeof locItem === 'string') {
                        return mItem.trim().toUpperCase() === locItem.trim().toUpperCase();
                      }
                      if (col === 'countries' && mItem && typeof mItem === 'object' && locItem && typeof locItem === 'object') {
                        const mName = (mItem.name || '').trim().toLowerCase();
                        const lName = (locItem.name || '').trim().toLowerCase();
                        const mCode = (mItem.code || '').trim().toLowerCase();
                        const lCode = (locItem.code || '').trim().toLowerCase();
                        return (mName && lName && mName === lName) || (mCode && lCode && mCode === lCode);
                      }
                      if (col === 'locations' && mItem && typeof mItem === 'object' && locItem && typeof locItem === 'object') {
                        return String(mItem.country || '').trim().toLowerCase() === String(locItem.country || '').trim().toLowerCase() &&
                               String(mItem.name || '').trim().toLowerCase() === String(locItem.name || '').trim().toLowerCase();
                      }
                      if (mItem && typeof mItem === 'object' && locItem && typeof locItem === 'object') {
                        const mId = mItem.id || mItem.code || mItem.name || mItem.number;
                        const lId = locItem.id || locItem.code || locItem.name || locItem.number;
                        return mId && lId && String(mId).trim().toUpperCase() === String(lId).trim().toUpperCase();
                      }
                      return false;
                    });
                    if (!alreadyExists) {
                      merged.push(locItem);
                    }
                  });
                  d[col] = merged;
                });

                // If local state had additional items not yet in Firestore, sync merged array back to Firestore
                setTimeout(() => {
                  const currentArr = stateRef.current[col];
                  if (currentArr && currentArr.length > arrayData.length) {
                    saveFirebaseDocMerge('dropdowns', col, { data: currentArr }).catch(() => {});
                  }
                }, 100);
              } else if (docData && (!arrayData || arrayData.length === 0)) {
                // If remote document exists but is empty, populate with local values
                const currentArray = stateRef.current[col];
                if (currentArray && currentArray.length > 0) {
                  saveFirebaseDocMerge('dropdowns', col, { data: currentArray }).catch(() => {});
                }
              }
            } else if (docData === null) {
              // Try to bootstrap dropdowns document if it doesn't exist yet but has local values
              const currentArray = stateRef.current[col];
              if (currentArray && currentArray.length > 0) {
                saveFirebaseDocMerge('dropdowns', col, { data: currentArray }).catch(() => {});
              }
            }
          })
        );
      });

      // 2. Subscribe to global branding settings (logo, colors, backgrounds, wallpapers, etc.) in Firestore
      unsubscribes.push(
        subscribeFirebaseDoc('settings', 'backend', (docData) => {
          if (docData && docData.url) {
            const url = docData.url.trim();
            const isDevUrl = 
              url.includes('ais-dev-') || 
              url.includes('ais-pre-') || 
              url.includes('gen-lang-client-') ||
              (url.includes('.run.app') && !url.includes('fleetpromanager-1991'));
              
            // NOTE: capacitor.config.ts uses androidScheme: 'https', so on a real
            // APK window.location.origin is "https://localhost", not "capacitor:"
            // or "file:". Capacitor.isNativePlatform() is the reliable check.
            const isNative = typeof window !== 'undefined' && (
              Capacitor.isNativePlatform() ||
              window.location.origin.startsWith('capacitor:') || 
              window.location.origin.startsWith('file:') ||
              window.location.origin === 'null'
            );
            
            if (!(isNative && isDevUrl)) {
              localStorage.setItem('API_BASE_URL', url);
            }
          }
        })
      );

      unsubscribes.push(
        subscribeFirebaseDoc('settings', 'branding', (docData) => {
          if (docData) {
            mutate((d: any) => {
              // Only the pre-login screen's own fields stay global here.
              // headerBg/navBg/backgroundColor/wallpaper/primaryColor are personal
              // per-user theme settings (see userSpecificKeys) and must never be
              // pulled in from this shared document, or one user's color choice
              // would silently overwrite every other logged-in user's app.
              const brandingKeys = [
                'loginWallpaper', 'loginBackgroundColor', 'loginCardColor'
              ];
              brandingKeys.forEach(k => {
                if (docData[k] !== undefined && docData[k] !== null && (docData[k] !== '' || !d[k])) {
                  d[k] = docData[k];
                }
              });
              if (docData.logo) {
                d.logo = (typeof docData.logo === 'string' && (docData.logo.startsWith('data:') || docData.logo.startsWith('http'))) ? docData.logo : fleetproLogo;
              } else {
                d.logo = fleetproLogo;
              }
            });
          } else if (docData === null) {
            // Bootstrap remote settings with local defaults
            const brandingData: any = {};
            // Same scope restriction as the read branch above: only bootstrap
            // the pre-login screen fields to the shared document, never the
            // personal per-user theme fields.
            const brandingKeys = [
              'loginWallpaper', 'loginBackgroundColor', 'loginCardColor'
            ];
            let hasLocalBranding = false;
            brandingKeys.forEach(k => {
              const val = stateRef.current[k];
              if (val !== undefined && val !== null && val !== '') {
                brandingData[k] = val;
                hasLocalBranding = true;
              }
            });
            if (hasLocalBranding) {
              saveFirebaseDocMerge('settings', 'branding', brandingData).catch(() => {});
            }
          }
        })
      );

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [mutate, state.user?.id]);

  const value = useMemo(() => {
    return new Proxy(state, {
      get(target, prop) {
        if (typeof prop === 'string' && handlersRef.current[prop]) return handlersRef.current[prop];
        
        // Theme/wallpaper/background/color values are read straight off the
        // top-level state (local-device-only, see setter below) — no more
        // reading through target.user.userThemeSettings.
        
        if (typeof prop === 'string') {
          if (prop === 'setView') {
             handlersRef.current[prop] = (view: string, addToHistory: boolean = true) => {
               if (addToHistory) {
                 window.history.pushState({
                   view,
                   activeSection: null,
                   activeDetailView: null,
                   showReceivedBreakdown: false,
                   isEntryFormOpen: false,
                   isPaymentPopupOpen: false,
                   showPendingBreakdown: false,
                   showAvailableBalancePage: false,
                   showPendingBreakdownPage: false,
                   selectedCategory: null
                 }, '', '');
               }
               mutate((d: any, prev: any) => {
                 d.navigationDirection = 'forward';
                 const prevView = prev?.currentView;

                 if (prevView && prevView !== view) {
                   if (!d.routeHistory) d.routeHistory = [];
                   if (d.routeHistory.length === 0 || d.routeHistory[d.routeHistory.length - 1] !== prevView) {
                     d.routeHistory.push(prevView);
                   }
                 }
                 d.currentView = view;
                 d.customHeaderTitle = null;
                 d.activeSection = null;
                 d.activeDetailView = null;
                 d.showReceivedBreakdown = false;
                 d.isEntryFormOpen = false;
                 d.isPaymentPopupOpen = false;
                 d.showPendingBreakdown = false;
                 d.showAvailableBalancePage = false;
                 d.showPendingBreakdownPage = false;
                 d.selectedCategory = null;
                 d.selectedNotification = null;
                 if (view !== 'TRIP_DETAILS' && view !== 'NEW_TRIP') {
                   d.selectedTrip = null;
                   d.editingTrip = null;
                 }
               });
             };
             return handlersRef.current[prop];
          }
          if (prop.startsWith('set')) {
            const key = prop.charAt(3).toLowerCase() + prop.slice(4);
            const fn = (val: any) => {
              const userSpecificKeys = [
                'theme', 'appThemeMode', 'isNightMode', 
                'headerBg', 'headerText', 'backgroundColor', 
                'navBg', 'navText', 'wallpaper', 'primaryColor'
              ];

              // Theme/wallpaper/background/color values now live only on the
              // top-level state mirror (local-device-only), so compare against
              // that directly.
              const currentVal = stateRef.current[key];
              // Theme/appThemeMode/isNightMode are kept in sync with each other below,
              // but they can drift out of sync (e.g. stale data from an older app
              // version). Never bail out early for these keys, or a toggle can look
              // like a no-op when the field being set already matches while a linked
              // field (like isNightMode) is still desynced.
              const themeSyncKeys = ['theme', 'appThemeMode', 'isNightMode'];
              // Early exit if primitive/identical value to prevent infinite loop triggers
              if (currentVal === val && typeof val !== 'object' && typeof val !== 'function' && !themeSyncKeys.includes(key)) {
                return;
              }
              
              mutate((d: any, prev: any) => {
                let finalVal = val;
                if ((key === 'user' || key === 'selectedUser') && val) {
                  finalVal = decryptSensitiveFields(val);
                } else if (key === 'users' && Array.isArray(val)) {
                  finalVal = val.map(u => decryptSensitiveFields(u));
                }
                const oldVal = prev[key];
                d[key] = finalVal;

                // Sync theme, appThemeMode, isNightMode
                if (key === 'appThemeMode') {
                  d.isNightMode = val === 'dark';
                  d.theme = val === 'dark' ? 'night-mode' : 'day-mode';
                } else if (key === 'isNightMode') {
                  d.appThemeMode = val ? 'dark' : 'light';
                  d.theme = val ? 'night-mode' : 'day-mode';
                } else if (key === 'theme') {
                  d.isNightMode = val === 'night-mode';
                  d.appThemeMode = val === 'night-mode' ? 'dark' : 'light';
                }
                
                // Theme/wallpaper/background/color settings are local-device-only:
                // they live on the top-level state mirror (set above / via d[key] = finalVal)
                // and persist only through localStorage (see mutate()). They are
                // deliberately NOT written into d.user.userThemeSettings anymore,
                // since that object gets pushed to Firestore whenever the user
                // profile is saved — keeping them off d.user is what keeps them
                // out of Firestore and confined to this device.
                
                const isNavigatingForward = (
                  (key === 'activeSection' || key === 'activeDetailView') && val !== null && oldVal !== val
                ) || (
                  (key === 'isEntryFormOpen' || key === 'isPaymentPopupOpen' || key === 'showReceivedBreakdown' || key === 'showPendingBreakdown') && val === true && oldVal !== val
                );

                const isNavigatingBackward = (
                  (key === 'activeSection' || key === 'activeDetailView') && val === null && oldVal !== val
                ) || (
                  (key === 'isEntryFormOpen' || key === 'isPaymentPopupOpen' || key === 'showReceivedBreakdown' || key === 'showPendingBreakdown') && val === false && oldVal !== val
                );

                if (isNavigatingForward) {
                  d.navigationDirection = 'forward';
                  window.history.pushState({
                    view: d.currentView,
                    activeSection: d.activeSection,
                    activeDetailView: d.activeDetailView,
                    showReceivedBreakdown: d.showReceivedBreakdown || false,
                    showPendingBreakdown: d.showPendingBreakdown || false,
                    isEntryFormOpen: d.isEntryFormOpen || false,
                    isPaymentPopupOpen: d.isPaymentPopupOpen || false
                  }, '', '');
                } else if (isNavigatingBackward) {
                  d.navigationDirection = 'backward';
                }
              });

              // userSpecificKeys (theme, appThemeMode, isNightMode, headerBg,
              // headerText, backgroundColor, navBg, navText, wallpaper,
              // primaryColor) are local-device-only: they were already written
              // to the top-level state above and persist via localStorage
              // (see mutate()). Deliberately no Firestore sync call here — that
              // is what keeps them off Firestore and confined to this device.

              // loginWallpaper/loginBackgroundColor/loginCardColor/logo are the
              // pre-login screen's shared branding and still sync to the
              // shared 'settings/branding' Firestore document.
              const brandingKeys = [
                'loginWallpaper', 'loginBackgroundColor', 'loginCardColor', 'logo'
              ];
              if (brandingKeys.includes(key)) {
                pendingBrandingSettings.current[key] = val;
                scheduleFirebaseSync();
              }
            };
            handlersRef.current[prop] = fn; return fn;
          }
          if (prop.startsWith('add')) {
            let key = prop.charAt(3).toLowerCase() + prop.slice(4) + 's';
            if (key === 'countrys') key = 'countries';
            if (key === 'nationalitys') key = 'nationalities';
            if (key === 'companys') key = 'companies';
            if (key === 'branchs') key = 'branches';
            if (key === 'currencys') key = 'currencies';
            const fn = (item: any) => {
              let processedItem = item;
              if (key === 'countries') {
                const rawName = typeof item === 'string' ? item : (item.name || item.code || '');
                const detected = scanAndDetectCountry(rawName);
                processedItem = {
                  code: detected.code || (typeof item === 'object' && item.code ? item.code : detected.name.slice(0, 2).toUpperCase()),
                  name: detected.name || (typeof item === 'object' && item.name ? item.name : rawName),
                  flag: detected.flag || (typeof item === 'object' && item.flag ? item.flag : '🌐')
                };
              } else if (key === 'locations' && typeof item === 'string') {
                processedItem = { country: 'Qatar', name: item.trim() };
              } else if (key === 'companies' && typeof item === 'string') {
                processedItem = item.trim().toUpperCase();
              }

              mutate((d: any) => {
                if (!d[key]) d[key] = [];
                const isDuplicate = d[key].some((x: any) => {
                  if (typeof x === 'string' && typeof processedItem === 'string') {
                    return x.trim().toUpperCase() === processedItem.trim().toUpperCase();
                  }
                  if (key === 'countries' && x && typeof x === 'object' && processedItem && typeof processedItem === 'object') {
                    const xName = (x.name || '').trim().toUpperCase();
                    const xCode = (x.code || '').trim().toUpperCase();
                    const pName = (processedItem.name || '').trim().toUpperCase();
                    const pCode = (processedItem.code || '').trim().toUpperCase();
                    return (xName && pName && xName === pName) || (xCode && pCode && xCode === pCode);
                  }
                  if (x && typeof x === 'object' && processedItem && typeof processedItem === 'object') {
                    if (key === 'locations') {
                      return String(x.country || '').trim().toUpperCase() === String(processedItem.country || '').trim().toUpperCase() && 
                             String(x.name || '').trim().toUpperCase() === String(processedItem.name || '').trim().toUpperCase();
                    }
                    const xId = x.id || x.code || x.name || x.number;
                    const itemId = processedItem.id || processedItem.code || processedItem.name || processedItem.number;
                    return xId && itemId && String(xId).trim().toUpperCase() === String(itemId).trim().toUpperCase();
                  }
                  return false;
                });
                if (!isDuplicate) {
                  d[key].push(processedItem);
                }

                if (key === 'payments' && item) {
                  const affectedTripIds = getAffectedTripIds(item, d);
                  affectedTripIds.forEach(tripId => {
                    recalculateTripPayments(tripId, d);
                  });
                }

                // Auto-add trip details to other dropdown arrays if missing
                if (key === 'trips' && item) {
                  // 1. Company Name
                  if (item.companyName && item.companyName.trim() !== '') {
                    const company = item.companyName.trim().toUpperCase();
                    if (!d.companies) d.companies = [];
                    if (!d.companies.some((x: any) => typeof x === 'string' ? x.toUpperCase() === company.toUpperCase() : (x && x.name && x.name.toUpperCase() === company.toUpperCase()))) {
                      d.companies.push(company);
                    }
                  }
                  // 2. Loading Place (locations)
                  if (item.loadingPlace && item.loadingPlace.trim() !== '') {
                    const name = item.loadingPlace.trim();
                    const country = item.fromCountry || 'Qatar';
                    if (!d.locations) d.locations = [];
                    if (!d.locations.some((x: any) => x && x.country && x.name && x.country.toUpperCase() === country.toUpperCase() && x.name.toUpperCase() === name.toUpperCase())) {
                      d.locations.push({ country, name });
                    }
                  }
                  // 3. Delivery Place (locations)
                  if (item.deliveryPlace && item.deliveryPlace.trim() !== '') {
                    const name = item.deliveryPlace.trim();
                    const country = item.arrivalCountry || 'Qatar';
                    if (!d.locations) d.locations = [];
                    if (!d.locations.some((x: any) => x && x.country && x.name && x.country.toUpperCase() === country.toUpperCase() && x.name.toUpperCase() === name.toUpperCase())) {
                      d.locations.push({ country, name });
                    }
                  }
                  // 4. Container Title / Types
                  if (item.containerTitle && item.containerTitle.trim() !== '') {
                    const cType = item.containerTitle.trim();
                    if (!d.containerTypes) d.containerTypes = [];
                    if (!d.containerTypes.some((x: any) => typeof x === 'string' ? x.toUpperCase() === cType.toUpperCase() : (x && x.name && x.name.toUpperCase() === cType.toUpperCase()))) {
                      d.containerTypes.push(cType);
                    }
                  }
                  // 5. Loading Type
                  if (item.loadingType && item.loadingType.trim() !== '') {
                    const lType = item.loadingType.trim();
                    if (!d.loadingTypes) d.loadingTypes = [];
                    if (!d.loadingTypes.some((x: any) => typeof x === 'string' ? x.toUpperCase() === lType.toUpperCase() : (x && x.name && x.name.toUpperCase() === lType.toUpperCase()))) {
                      d.loadingTypes.push(lType);
                    }
                  }
                  // 6. Empty Return Yard
                  if (item.emptyReturnYard && item.emptyReturnYard.trim() !== '') {
                    const rYard = item.emptyReturnYard.trim();
                    if (!d.emptyReturnYards) d.emptyReturnYards = [];
                    if (!d.emptyReturnYards.some((x: any) => typeof x === 'string' ? x.toUpperCase() === rYard.toUpperCase() : (x && x.name && x.name.toUpperCase() === rYard.toUpperCase()))) {
                      d.emptyReturnYards.push(rYard);
                    }
                  }
                }
              });
              const configCols = ['locations', 'countries', 'companies', 'nationalities', 'containerTypes', 'loadingTypes', 'idTypes', 'extraDieselReasons', 'advanceReasons', 'emptyReturnYards', 'banks', 'branches', 'routingNumbers', 'currencies', 'genders', 'religions', 'professions', 'postOffices', 'policeStations', 'cities', 'states', 'walletIncomeSources', 'walletDeductionReasons', 'walletPaymentMethods', 'bankNames', 'mobileBankingWallets', 'relationships', 'loanPurposes'];
              if (['users', 'trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'notifications', 'fuels', 'walletTransactions', 'loans', 'loanPayments', 'vehicles', 'vehicleServices'].includes(key)) {
                if (item && item.id) {
                  if (key === 'users') {
                    const coll = item.role === 'ADMIN' ? 'admins' : 'users';
                    saveFirebaseDoc(coll, item.id, item);
                  } else {
                    let targetUserId = item.userId;
                    let parentCol = stateRef.current.user?.role === 'ADMIN' ? 'admins' : 'users';
                    let subPath = stateRef.current.user ? `${parentCol}/${stateRef.current.user.id}/${key}` : key;
                    if (targetUserId) {
                      const targetUser = stateRef.current.users?.find((u: any) => u.id === targetUserId);
                      const tCol = targetUser?.role === 'ADMIN' ? 'admins' : 'users';
                      subPath = `${tCol}/${targetUserId}/${key}`;
                    }
                    saveFirebaseDoc(subPath, item.id, item);
                  }
                }

                if (key === 'trips' && item) {
                  setTimeout(() => {
                    try {
                      const saved = localStorage.getItem('fleetpro_state');
                      if (saved) {
                        const parsed = JSON.parse(saved);
                        const keysToSave = ['companies', 'locations', 'containerTypes', 'loadingTypes', 'emptyReturnYards'];
                        keysToSave.forEach(k => {
                          if (parsed[k]) {
                            saveFirebaseDocMerge('dropdowns', k, { data: parsed[k] }).catch(() => {});
                          }
                        });
                      }
                    } catch {}
                  }, 100);
                }
              } else if (configCols.includes(key)) {
                try {
                  const currentArray = stateRef.current[key];
                  if (currentArray) {
                    saveFirebaseDocMerge('dropdowns', key, { data: currentArray }).catch(() => {});
                  }
                } catch {}
              }
            };
            handlersRef.current[prop] = fn; return fn;
          }
          if (prop.startsWith('remove')) {
            let key = prop.charAt(6).toLowerCase() + prop.slice(7) + 's';
            if (key === 'countrys') key = 'countries';
            if (key === 'nationalitys') key = 'nationalities';
            if (key === 'companys') key = 'companies';
            if (key === 'branchs') key = 'branches';
            if (key === 'currencys') key = 'currencies';
            const fn = (id: any, secondValue?: any) => {
              let extractedUserId = '';
              mutate((d: any) => {
                if (d[key]) {
                  const itemToRemove = d[key].find((x: any) => x && (x.id === id || String(x) === String(id)));
                  if (itemToRemove && typeof itemToRemove === 'object' && itemToRemove.userId) {
                    extractedUserId = itemToRemove.userId;
                  }

                  let affectedTripIds: string[] = [];
                  if (key === 'payments') {
                    const paymentToRemove = d[key].find((x: any) => x && x.id === id);
                    if (paymentToRemove) {
                      affectedTripIds = getAffectedTripIds(paymentToRemove, d);
                    }
                  }

                  if (key === 'locations') {
                    d[key] = d[key].filter((x: any) => !(x.country === id && x.name === secondValue));
                  } else if (key === 'nationalities') {
                    d[key] = d[key].filter((x: any) => {
                      const itemVal = typeof x === 'object' && x ? x.name : String(x);
                      return itemVal !== id;
                    });
                  } else if (key === 'companies') {
                    d[key] = d[key].filter((x: any) => {
                      const itemVal = typeof x === 'object' && x ? x.name : String(x);
                      return itemVal !== id;
                    });
                  } else if (key === 'countries') {
                    d[key] = d[key].filter((x: any) => {
                      const itemCode = typeof x === 'object' && x ? x.code : String(x);
                      return itemCode !== id;
                    });
                  } else if (key === 'currencies') {
                    d[key] = d[key].filter((x: any) => {
                      const itemCode = typeof x === 'object' && x ? x.code : String(x);
                      return itemCode !== id;
                    });
                  } else if (key === 'postOffices') {
                    d[key] = d[key].filter((x: any) => x && x.name !== id && x.code !== id);
                  } else {
                    d[key] = d[key].filter((x: any) => x && x.id !== id && String(x) !== String(id) && x.code !== id && x.name !== id);
                  }

                  let targetKey = key;
                  if (['trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'fuels', 'walletTransactions', 'loans', 'loanPayments', 'vehicles', 'vehicleServices'].includes(key)) {
                    targetKey = 'all' + key.charAt(0).toUpperCase() + key.slice(1);
                  }
                  if (d[targetKey] && targetKey !== key) {
                    d[targetKey] = d[targetKey].filter((x: any) => x && x.id !== id && String(x) !== String(id) && x.code !== id && x.name !== id);
                  }

                  if (key === 'payments' && affectedTripIds.length > 0) {
                    affectedTripIds.forEach(tripId => {
                      recalculateTripPayments(tripId, d);
                    });
                  }
                }
              });
              const configCols = ['locations', 'countries', 'companies', 'nationalities', 'containerTypes', 'loadingTypes', 'idTypes', 'extraDieselReasons', 'advanceReasons', 'emptyReturnYards', 'banks', 'branches', 'routingNumbers', 'currencies', 'genders', 'religions', 'professions', 'postOffices', 'policeStations', 'cities', 'states', 'walletIncomeSources', 'walletDeductionReasons', 'walletPaymentMethods', 'bankNames', 'mobileBankingWallets', 'relationships', 'loanPurposes'];
              if (['users', 'trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'notifications', 'fuels', 'walletTransactions', 'loans', 'loanPayments', 'vehicles', 'vehicleServices'].includes(key)) {
                if (key === 'users') {
                  deleteFirebaseDoc('users', String(id));
                  deleteFirebaseDoc('admins', String(id));
                  
                  // Cascading delete for subcollections
                  const subCollections = ['trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'notifications', 'fuels', 'walletTransactions', 'settlements', 'Purchase', 'loans', 'loanPayments', 'vehicles', 'vehicleServices'];
                  ['users', 'admins'].forEach(parentCol => {
                    subCollections.forEach(sub => {
                      const subPath = `${parentCol}/${id}/${sub}`;
                      getFirebaseCollection(subPath).then((docs) => {
                        if (docs && Array.isArray(docs)) {
                          docs.forEach((doc: any) => {
                            deleteFirebaseDoc(subPath, doc.id).catch(e => console.error(`Error cascading ${sub} delete:`, e));
                          });
                        }
                      }).catch(e => console.error(`Error fetching ${subPath} for cascading delete:`, e));
                    });
                  });

                  // Cascading delete for partners linked to this user
                  getFirebaseCollection('partners').then((partners) => {
                    if (partners && Array.isArray(partners)) {
                      const partnersToDelete = partners.filter((p: any) => String(p.userId) === String(id));
                      partnersToDelete.forEach((partner: any) => {
                        deleteFirebaseDoc('partners', partner.id).catch(e => console.error("Error cascading partner delete:", e));
                      });
                    }
                  }).catch(e => console.error("Error fetching partners for cascading delete:", e));
                } else {
                  let subPath = '';
                  let targetUserId = (secondValue && typeof secondValue === 'string') ? secondValue : extractedUserId;
                  if (targetUserId) {
                    const targetUser = stateRef.current.users?.find((u: any) => u.id === targetUserId);
                    const parentCol = targetUser?.role === 'ADMIN' ? 'admins' : 'users';
                    subPath = `${parentCol}/${targetUserId}/${key}`;
                  } else {
                    const parentCol = stateRef.current.user?.role === 'ADMIN' ? 'admins' : 'users';
                    subPath = stateRef.current.user ? `${parentCol}/${stateRef.current.user.id}/${key}` : key;
                  }
                  deleteFirebaseDoc(subPath, String(id));
                }
              } else if (configCols.includes(key)) {
                try {
                  const currentArray = stateRef.current[key];
                  if (currentArray) {
                    saveFirebaseDocMerge('dropdowns', key, { data: currentArray }).catch(() => {});
                  }
                } catch {}
              }
            };
            handlersRef.current[prop] = fn; return fn;
          }
          if (prop.startsWith('update')) {
            let key = prop.charAt(6).toLowerCase() + prop.slice(7) + 's';
            if (key === 'countrys') key = 'countries';
            if (key === 'nationalitys') key = 'nationalities';
            if (key === 'companys') key = 'companies';
            if (key === 'branchs') key = 'branches';
            if (key === 'currencys') key = 'currencies';
            const fn = (idOrObj: any, updates?: any) => {
              let updatedItem: any = null;
              mutate((d: any) => {
                if (d[key]) {
                  let targetId: any;
                  let actualUpdates: any;
                  if (updates === undefined && idOrObj && typeof idOrObj === 'object') {
                    targetId = idOrObj.id || idOrObj.userId || idOrObj.code || idOrObj.name;
                    actualUpdates = idOrObj;
                  } else if (typeof idOrObj === 'object' && typeof updates === 'string') {
                    // First arg is object, second arg is oldId
                    targetId = updates;
                    actualUpdates = idOrObj;
                  } else if (typeof idOrObj === 'string' && typeof updates === 'object') {
                    // First arg is oldId, second arg is object
                    targetId = idOrObj;
                    actualUpdates = updates;
                  } else {
                    targetId = idOrObj;
                    actualUpdates = updates;
                  }
                  const idx = d[key].findIndex((x: any) => 
                    x && (x.id === targetId || x.userId === targetId || String(x) === String(targetId) || x.code === targetId || (typeof x === 'object' && x.name === targetId))
                  );
                  if (idx >= 0) {
                     const oldItem = d[key][idx];
                     const oldAffectedTripIds = key === 'payments' ? getAffectedTripIds(oldItem, d) : [];

                     if (typeof d[key][idx] === 'object') {
                       d[key][idx] = { ...d[key][idx], ...actualUpdates };
                     } else {
                       d[key][idx] = actualUpdates;
                     }
                     updatedItem = d[key][idx];

                     if (key === 'users') {
                       if (d.selectedUser && (d.selectedUser.id === updatedItem.id || d.selectedUser.userId === updatedItem.userId)) {
                         d.selectedUser = updatedItem;
                       }
                       if (d.user && (d.user.id === updatedItem.id || d.user.userId === updatedItem.userId)) {
                         d.user = updatedItem;
                       }
                     }

                     if (key === 'payments' && updatedItem) {
                       const newAffectedTripIds = getAffectedTripIds(updatedItem, d);
                       const allAffectedTripIds = Array.from(new Set([...oldAffectedTripIds, ...newAffectedTripIds]));
                       allAffectedTripIds.forEach(tripId => {
                         recalculateTripPayments(tripId, d);
                       });
                     }
                  }
                }

                // If a trip is being updated, automatically ensure fields exist in dropdown collections
                if (key === 'trips' && updatedItem) {
                  // 1. Company Name
                  if (updatedItem.companyName && updatedItem.companyName.trim() !== '') {
                    const company = updatedItem.companyName.trim();
                    if (!d.companies) d.companies = [];
                    if (!d.companies.some((x: any) => typeof x === 'string' ? x.toUpperCase() === company.toUpperCase() : (x && x.name && x.name.toUpperCase() === company.toUpperCase()))) {
                      d.companies.push(company.toUpperCase());
                    }
                  }
                  // 2. Loading Place (locations)
                  if (updatedItem.loadingPlace && updatedItem.loadingPlace.trim() !== '') {
                    const name = updatedItem.loadingPlace.trim();
                    const country = updatedItem.fromCountry || 'Qatar';
                    if (!d.locations) d.locations = [];
                    if (!d.locations.some((x: any) => x && x.country && x.name && x.country.toUpperCase() === country.toUpperCase() && x.name.toUpperCase() === name.toUpperCase())) {
                      d.locations.push({ country, name });
                    }
                  }
                  // 3. Delivery Place (locations)
                  if (updatedItem.deliveryPlace && updatedItem.deliveryPlace.trim() !== '') {
                    const name = updatedItem.deliveryPlace.trim();
                    const country = updatedItem.arrivalCountry || 'Qatar';
                    if (!d.locations) d.locations = [];
                    if (!d.locations.some((x: any) => x && x.country && x.name && x.country.toUpperCase() === country.toUpperCase() && x.name.toUpperCase() === name.toUpperCase())) {
                      d.locations.push({ country, name });
                    }
                  }
                  // 4. Container Title / Types
                  if (updatedItem.containerTitle && updatedItem.containerTitle.trim() !== '') {
                    const cType = updatedItem.containerTitle.trim();
                    if (!d.containerTypes) d.containerTypes = [];
                    if (!d.containerTypes.some((x: any) => typeof x === 'string' ? x.toUpperCase() === cType.toUpperCase() : (x && x.name && x.name.toUpperCase() === cType.toUpperCase()))) {
                      d.containerTypes.push(cType);
                    }
                  }
                  // 5. Loading Type
                  if (updatedItem.loadingType && updatedItem.loadingType.trim() !== '') {
                    const lType = updatedItem.loadingType.trim();
                    if (!d.loadingTypes) d.loadingTypes = [];
                    if (!d.loadingTypes.some((x: any) => typeof x === 'string' ? x.toUpperCase() === lType.toUpperCase() : (x && x.name && x.name.toUpperCase() === lType.toUpperCase()))) {
                      d.loadingTypes.push(lType);
                    }
                  }
                  // 6. Empty Return Yard
                  if (updatedItem.emptyReturnYard && updatedItem.emptyReturnYard.trim() !== '') {
                    const rYard = updatedItem.emptyReturnYard.trim();
                    if (!d.emptyReturnYards) d.emptyReturnYards = [];
                    if (!d.emptyReturnYards.some((x: any) => typeof x === 'string' ? x.toUpperCase() === rYard.toUpperCase() : (x && x.name && x.name.toUpperCase() === rYard.toUpperCase()))) {
                      d.emptyReturnYards.push(rYard);
                    }
                  }
                }
              });
              const configCols = ['locations', 'countries', 'companies', 'nationalities', 'containerTypes', 'loadingTypes', 'idTypes', 'extraDieselReasons', 'advanceReasons', 'emptyReturnYards', 'banks', 'branches', 'routingNumbers', 'currencies', 'genders', 'religions', 'professions', 'postOffices', 'policeStations', 'cities', 'states', 'walletIncomeSources', 'walletDeductionReasons', 'walletPaymentMethods', 'bankNames', 'mobileBankingWallets', 'relationships', 'loanPurposes'];
              if (updatedItem && ['users', 'trips', 'profiles', 'finances', 'monthlyFiles', 'payments', 'notifications', 'fuels', 'walletTransactions', 'loans', 'loanPayments'].includes(key)) {
                if (key === 'users') {
                  const coll = updatedItem.role === 'ADMIN' ? 'admins' : 'users';
                  saveFirebaseDoc(coll, updatedItem.id, updatedItem);
                } else {
                  let targetUserId = updatedItem.userId;
                  let parentCol = stateRef.current.user?.role === 'ADMIN' ? 'admins' : 'users';
                  let subPath = stateRef.current.user ? `${parentCol}/${stateRef.current.user.id}/${key}` : key;
                  if (targetUserId) {
                    const targetUser = stateRef.current.users?.find((u: any) => u.id === targetUserId);
                    const tCol = targetUser?.role === 'ADMIN' ? 'admins' : 'users';
                    subPath = `${tCol}/${targetUserId}/${key}`;
                  }
                  saveFirebaseDoc(subPath, updatedItem.id, updatedItem);
                }

                if (key === 'trips' && updatedItem) {
                  setTimeout(() => {
                    try {
                      const saved = localStorage.getItem('fleetpro_state');
                      if (saved) {
                        const parsed = JSON.parse(saved);
                        const keysToSave = ['companies', 'locations', 'containerTypes', 'loadingTypes', 'emptyReturnYards'];
                        keysToSave.forEach(k => {
                          if (parsed[k]) {
                            saveFirebaseDocMerge('dropdowns', k, { data: parsed[k] }).catch(() => {});
                          }
                        });
                      }
                    } catch {}
                  }, 100);
                }
              } else if (configCols.includes(key)) {
                try {
                  const currentArray = stateRef.current[key];
                  if (currentArray) {
                    saveFirebaseDocMerge('dropdowns', key, { data: currentArray }).catch(() => {});
                  }
                } catch {}
              }
            };
            handlersRef.current[prop] = fn; return fn;
          }
        }
        
        const EMPTY_ARRAY: any[] = [];
        const arrayProps = [
          'users', 'trips', 'allTrips', 'profiles', 'allProfiles', 'finances', 'allFinances', 'monthlyFiles', 'allMonthlyFiles', 'payments', 'allPayments', 
          'walletTransactions', 'allWalletTransactions', 'fuels', 'allFuels', 'loans', 'allLoans', 'loanPayments', 'allLoanPayments', 'notifications', 'publicMenuItems', 'locations', 'countries', 'companies', 
          'nationalities', 'containerTypes', 'loadingTypes', 'idTypes', 'extraDieselReasons', 'advanceReasons', 'emptyReturnYards',
          'genders', 'religions', 'professions', 'postOffices', 'policeStations', 'cities', 'states',
          'walletIncomeSources', 'walletDeductionReasons', 'walletPaymentMethods', 'bankNames', 'mobileBankingWallets', 'relationships', 'loanPurposes',
          'dashboardOrder', 'banks', 'branches', 'routingNumbers', 'currencies', 'transactions', 'documents'
        ];
        if (typeof prop === 'string' && arrayProps.includes(prop)) {
          return target[prop] || EMPTY_ARRAY;
        }
        
        if (prop in target) return target[prop];
        return undefined;
      }
    }) as unknown as StoreState;
  }, [state, mutate]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
