// Regenerating store.tsx
const fs = require('fs');

const interfaceBlock = `
  currentView: 'DASHBOARD' | 'PROFILES' | 'FINANCE' | 'ADMIN' | 'LOGIN' | 'SIGNUP' | 'SETTINGS' | 'MONTHLY_FILES' | 'NEW_TRIP' | 'MY_INCOME' | 'PAYMENT' | 'ACCOUNT' | 'ACTIVE_USER' | 'BLOCK_LIST' | 'USER_ACCOUNTS' | 'USER_PROFILE' | 'USER_FILES_LIST' | 'SEARCH' | 'ADMIN_PROFILE_UPDATE' | 'SUPPORT' | 'PRAYER_TIMES' | 'CONTROL_PANEL' | 'MONTHLY_FILE_DETAILS' | 'TRANSACTION_DELETE' | 'RESET_BREAKDOWN' | 'USER_ACCOUNT_RESET' | 'NOTIFICATIONS' | 'NOTIFICATION_DETAIL' | 'CHAT' | 'USER_PASSWORD_RESET' | 'TRIP_DETAILS' | 'TRIPS' | 'LEAVE_SETTLEMENT' | 'DOWNLOADS';
  setView: (view: StoreState['currentView'], addToHistory?: boolean) => void;
  goBack: (fromPopState?: boolean, state?: any) => void;
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
  downloads: DownloadedFile[]; addDownload: (download: DownloadedFile) => void; user: User | null;
  setUser: (user: User | null) => void;
  users: User[];
  addUser: (user: User) => void;
  updateUser: (user: User, oldId?: string) => void;
  approveUser: (userId: string) => void;
  removeUser: (id: string) => void;
  trips: Trip[];
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
  branches: { id: string; name: string; routingNumber?: string; bankId?: string }[];
  addBranch: (branch: { id: string; name: string; routingNumber?: string; bankId?: string }) => void;
  removeBranch: (id: string) => void;
  updateBranch: (id: string, updates: Partial<{ name: string; routingNumber: string; bankId: string }>) => void;
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
  confirmAction: (message: string, onConfirm: () => void, options?: { title?: string; confirmText?: string; cancelText?: string; onSecondaryConfirm?: () => void; secondaryConfirmText?: string }) => void;
  closeConfirm: () => void;
  confirmConfig: { isOpen: boolean; message: string; onConfirm: () => void; title?: string; confirmText?: string; cancelText?: string; onSecondaryConfirm?: () => void; secondaryConfirmText?: string } | null;
  showReceivedBreakdown: boolean;
  setShowReceivedBreakdown: (show: boolean) => void;
  showPendingBreakdown: boolean;
  setShowPendingBreakdown: (show: boolean) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (open: boolean) => void;
  isLoadingView: boolean;
  setIsLoadingView: (loading: boolean) => void;
  prayerTimeOffsets: Record<string, number>;
  setPrayerTimeOffset: (prayer: string, offset: number) => void;
  isEntryFormOpen: boolean;
  setIsEntryFormOpen: (open: boolean) => void;
  selectedNotification: Notification | null;
  setSelectedNotification: (notification: Notification | null) => void;
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  clearAccountNotifications: (userId: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  exportData: () => void;
  importData: (file: File) => Promise<void>;
  resetSystem: () => void;
  resetSections: (sections: string[]) => void;
`;

const stateKeys = [];
for (const line of interfaceBlock.split('\\n')) {
  const match = line.match(/^\\s*([a-zA-Z0-9_]+):/);
  if (match) {
    stateKeys.push(match[1]);
  }
}

// Ensure the old store is read to keep the top imports
let topImports = "";
try {
  const oldStore = fs.readFileSync('src/store.tsx', 'utf-8');
  topImports = oldStore.split("export interface StoreState")[0];
} catch(e) {}

let finalStore = topImports + `
export interface StoreState {
${interfaceBlock}
}

const StoreContext = createContext<StoreState | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('fleetpro_state');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      currentView: 'LOGIN',
      downloads: [],
      users: [],
      trips: [],
      profiles: [],
      finances: [],
      monthlyFiles: [],
      payments: [],
      notifications: []
    };
  });

  const mutate = useCallback((recipe: (draft: any) => void) => {
    setState(prev => {
      const next = { ...prev };
      recipe(next);
      try { localStorage.setItem('fleetpro_state', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const value = useMemo(() => {
    const proxy = new Proxy(state, {
      get(target, prop) {
        if (prop in target) return target[prop];
        
        if (typeof prop === 'string') {
          if (prop === 'setView') return (view) => mutate(d => d.currentView = view);
          if (prop.startsWith('set')) {
            const key = prop.charAt(3).toLowerCase() + prop.slice(4);
            return (val) => mutate(d => d[key] = val);
          }
          if (prop.startsWith('add')) {
            const key = prop.charAt(3).toLowerCase() + prop.slice(4) + 's';
            return (item) => mutate(d => { if (!d[key]) d[key] = []; d[key].push(item); });
          }
          if (prop.startsWith('remove')) {
            const key = prop.charAt(6).toLowerCase() + prop.slice(7) + 's';
            return (id) => mutate(d => { if (d[key]) d[key] = d[key].filter((x: any) => x.id !== id && x !== id); });
          }
          if (prop.startsWith('update')) {
            const key = prop.charAt(6).toLowerCase() + prop.slice(7) + 's';
            return (id, updates) => mutate(d => { 
                if (d[key]) {
                  const idx = d[key].findIndex((x:any) => x.id === id || String(x) === String(id));
                  if (idx >= 0) d[key][idx] = { ...d[key][idx], ...updates };
                }
            });
          }
        }
        
        return undefined;
      }
    });

    // Explicit manual overrides to pass interface boundaries cleanly
    return {
      ...proxy,
      
      showFeedback: (message: string, type: any = 'success') => {
         mutate(d => { d.feedbackMessage = message; d.feedbackType = type; d.isFeedbackOpen = true; });
         setTimeout(() => mutate(d => d.isFeedbackOpen = false), 3000);
      },
      exportData: () => {
         const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
         const node = document.createElement('a'); node.setAttribute("href", dataStr); node.setAttribute("download", "export.json"); node.click();
      },
      importData: async (file: File) => {
         const text = await file.text();
         setState(JSON.parse(text));
      },
      clearPayments: () => mutate(d => d.payments = []),
      clearNotifications: () => mutate(d => d.notifications = []),
      confirmAction: (msg, onConfirm) => {
         if(window.confirm(msg)) onConfirm();
      },
      closeConfirm: () => {},
      logout: () => mutate(d => { d.user = null; d.currentView = 'LOGIN'; })
    } as unknown as StoreState;
  }, [state, mutate]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
`;

fs.writeFileSync('src/store.tsx', finalStore);
