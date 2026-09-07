
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate?: number;
  isActive?: boolean;
}

export type Language = 'en' | 'bn' | 'ar' | 'hi';
export type Theme = string;

export interface User {
  id: string;
  userId?: string;
  name: string;
  email: string;
  loginEmail?: string;
  password?: string;
  is2FAEnabled?: boolean;
  twoFASecret?: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
  status: 'PENDING' | 'ENABLED' | 'DISABLED' | 'BLOCKED';
  expiryDate?: string;
  avatar?: string;
  nationality?: string;
  dob?: string;
  religion?: string;
  gender?: string;
  countryCode?: string;
  mobileNumber?: string;
  idIssueCountry?: string;
  idType?: string;
  isFirstLogin?: boolean;
  idNumber?: string;
  idIssueDate?: string;
  idExpiryDate?: string;
  profession?: string;
  companyName?: string;
  presentCountry?: string;
  country?: string;
  division?: string;
  district?: string;
  city?: string;
  state?: string;
  policeStation?: string;
  upazila?: string;
  postOffice?: string;
  postalCode?: string;
  area?: string;
  buildingNumber?: string;
  streetNumber?: string;
  stateNumber?: string;
  zoneNumber?: string;
  zoomNumber?: string;
  electricityNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  manualAddress?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  duration?: string;
  price?: string;
  package?: string;
  activationDate?: string;
  packagePrice?: number;
  paidAmount?: number;
  discountAmount?: number;
  dueAmount?: number;
  permissions?: string[];
  deniedPermissions?: string[];
  statusTimestamp?: string;
  blockTimestamp?: string;
  registrationDate?: string;
  accountNumber?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  firebaseUid?: string;
}

export interface Profile {
  id: string;
  name: string;
  idNumber: string;
  mobile: string;
  nationality: string;
  joiningDate: string;
  type: 'COMPANY' | 'EMPLOYEE';
  userId: string;
  firebaseUid?: string;
}

export interface MonthlyFile {
  id: string;
  month: number; // 1-12
  year: number;
  status: 'OPEN' | 'CLOSED';
  createdAt: string;
  userId: string;
  firebaseUid?: string;
}

export interface DownloadedFile { id: string; transactionId: string; title: string; date: string; amount: number; currency: string; type: 'RECEIPT' | 'STATEMENT' | 'OTHER'; } export interface Payment {
  id: string;
  transactionId: string;
  amount: number;
  date: string;
  time: string;
  type: 'INCOME' | 'DEDUCTION';
  category: string;
  method: 'CASH' | 'ONLINE_BANK' | 'MOBILE_BANKING';
  details: {
    country?: string;
    bankName?: string;
    branchName?: string;
    branchCode?: string;
    routingNumber?: string;
    walletNumber?: string;
    serviceName?: string;
    pendingItems?: Record<string, number>;
    companyName?: string;
    userName?: string;
    userId?: string;
    expiryDate?: string;
    advanceType?: 'TAKEN' | 'RETURNED';
    advanceReason?: string;
    accountNumber?: string;
    accountTitle?: string;
    swiftCode?: string;
    note?: string;
  };
  monthlyFileId?: string;
  userId: string;
  month: number;
  year: number;
  status: 'PENDING' | 'RECEIVED';
  firebaseUid?: string;
}

export const INCOME_CATEGORIES = [
  'SALARY',
  'COMMISSION',
  'FRIDAY',
  'BONUS',
  'TRIP DIESEL',
  'EXTRA FUEL',
  'ADVANCE',
  'OVERTIME',
  'OTHERS'
];

export const ADD_MONEY_REASONS = [
  'SALARY',
  'COMMISSION',
  'BONUS',
  'REIMBURSEMENT',
  'OTHER'
];

export const DEDUCTION_CATEGORIES = [
  'KITCHEN SERVICE CHARGE',
  'PENALTY',
  'TRAFFIC FINE',
  'MOBILE BILLS',
  'LOAN',
  'ADVANCE DEDUCTION',
  'OTHERS'
];

export interface Trip {
  id: string;
  fileId: string; // Link to MonthlyFile
  
  // Origin
  fromCountry: string;
  loadingPlace: string;
  loadingDate: string;
  loadingTime: string;
  
  // Destination
  arrivalCountry: string;
  deliveryPlace: string;
  deliveryDate: string;
  deliveryTime: string;
  
  // Company & Container
  companyName: string;
  loadingType: string;
  bayanNumber: string;
  containerNumber: string;
  containerTitle: string;
  invoiceNumber: string;
  tariffStatus?: 'Complete' | 'Incomplete';
  status?: 'COMPLETED' | 'PENDING';
  category?: string;
  emptyReturnYard?: string;
  
  // Vehicle & Driver
  vehicleNumber: string;
  trailerNumber: string;
  userId: string;
  
  // Financials
  dieselPrice: number;
  dieselPaid?: number;
  generatorDiesel: number;
  generatorDieselPaid?: number;
  generatorReceiveNumber?: string;
  dieselReceiptDate?: string;
  dieselReceiptType?: 'generator' | 'truck' | string;
  pumpName?: string;
  extraDiesel?: number;
  extraDieselPaid?: number;
  extraDieselReason?: string;
  commission: number;
  commissionPaid?: number;
  friday?: number;
  fridayPaid?: number;
  bonus?: number;
  bonusPaid?: number;
  overtime?: number;
  overtimePaid?: number;
  
  // Totals & Payments
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  payments?: Payment[];
  firebaseUid?: string;
}

export interface FinancialRecord {
  id: string;
  date: string;
  amount: number;
  type: 'SALARY' | 'ADVANCE' | 'COMMISSION';
  status: 'PAID' | 'PENDING';
  userId: string;
  firebaseUid?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'EXPIRY' | 'REGISTRATION' | 'INFO';
  timestamp: string;
  isRead: boolean;
  userId?: string;
  targetUserId?: string;
  firebaseUid?: string;
}

export interface SupportInfo {
  developerName?: string;
  developerPhoto?: string;
  mobile?: string;
  whatsapp?: string;
  nationality?: string;
  email?: string;
  facebookProfile?: string;
  facebookPage?: string;
  instagram?: string;
  youtube?: string;
  mobileCountryCode?: string;
  whatsappCountryCode?: string;
  // Visibility flags
  showDeveloperName?: boolean;
  showMobile?: boolean;
  showWhatsapp?: boolean;
  showNationality?: boolean;
  showEmail?: boolean;
  showFacebookProfile?: boolean;
  showFacebookPage?: boolean;
  showInstagram?: boolean;
  showYoutube?: boolean;
}

export interface FuelPurchase {
  id: string;
  date: string;
  receiptNumber: string;
  price: number;
  volume: number;
  totalAmount: number;
  userId: string;
  month: number;
  year: number;
  firebaseUid?: string;
}


export interface Loan {
  id: string;
  userId: string;
  
  // Borrower Information
  borrowerName: string;
  borrowerMobile: string;
  borrowerCountryCode?: string;
  borrowerIdType?: string;
  borrowerIdNumber?: string;
  borrowerEmail?: string;
  borrowerAddress?: string;
  borrowerReference?: string;
  
  // Loan Company Information
  companyName: string;
  companyContact?: string;
  companyAddress?: string;
  
  // Loan Information
  loanAmount: number;
  loanDate: string;
  interestRate?: number;
  interestAmount?: number;
  loanTerm?: number; // In months
  paymentFrequency: 'MONTHLY' | 'WEEKLY' | 'BI-WEEKLY' | 'YEARLY' | 'LUMP_SUM';
  installmentAmount: number;
  numberOfInstallments: number;
  firstPaymentDate: string;
  loanPurpose?: string;
  notes?: string;
  currency?: string;
  
  // Calculated & Tracking
  totalPaid: number;
  totalSavings?: number;
  outstandingBalance: number;
  paidInstallments: number;
  remainingInstallments: number;
  status: 'ACTIVE' | 'PAID' | 'DEFAULTED';
  
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  userId: string;
  amount: number;
  savingsAmount?: number;
  date: string;
  method: string;
  transactionDetails?: string;
  paymentReference?: string;
  senderBankName?: string;
  senderBranchName?: string;
  senderAccountHolder?: string;
  senderAccountNumber?: string;
  receiverBankName?: string;
  receiverBranchName?: string;
  receiverAccountHolder?: string;
  receiverAccountNumber?: string;
  createdAt: string;
}

export interface VehicleHistoryRecord {
  id: string;
  fieldName: string;
  previousValue: string;
  newValue: string;
  updatedBy: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  vehicleNumber: string;
  trailerNumber?: string;
  vehiclePermitExpiry?: string;
  trailerPermitExpiry?: string;
  driverName?: string;
  vehicleAssignedDate?: string;
  status: 'Active' | 'In Service' | 'Inactive';
  createdAt: string;
  updatedAt: string;
  history?: VehicleHistoryRecord[];
}

export interface ServiceHistoryRecord {
  id: string;
  fieldName: string;
  previousValue: string;
  newValue: string;
  updatedBy: string;
  updatedAt: string;
}

export interface VehicleService {
  id: string;
  userId: string;
  vehicleId: string;
  vehicleNumber: string;
  serviceType: string;
  serviceDate: string;
  currentKilometer: number;
  serviceCost: number;
  workshopProvider: string;
  descriptionNotes: string;
  nextServiceInfo?: string;

  // Oil Service Specific
  oilType?: string;
  oilQuantity?: number;
  oilValidity?: number;
  nextOilServiceAfterKm?: number;
  nextServiceKilometer?: number;

  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  history?: ServiceHistoryRecord[];
}

