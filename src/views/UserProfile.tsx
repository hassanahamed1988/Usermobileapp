import { decryptData, decryptSensitiveFields } from "../utils/security";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../store";
import { subscribeFirebaseCollection } from "../services/firebase";
import { isExpired } from "../utils/dateUtils";
import {
  User as UserIcon,
  Eye,
  EyeOff,
  Edit,
  Phone,
  MapPin,
  CreditCard,
  UserCheck,
  UserX,
  Shield,
  ShieldAlert,
  X,
  Check,
  Ban,
  Power,
  CheckCircle2,
  Calendar,
  Clock,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Zap,
  DollarSign,
  Lock,
  LogOut,
  Palette,
  Sun,
  Moon,
  Diamond,
  Truck,
  Users,
  Wallet,
  ShieldCheck,
  Settings,
  FileText,
  Headphones,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Activity,
  UserPlus,
  Search,
  Banknote,
  Plus,
  Car,
  Sliders,
  RefreshCw,
  MessageSquare,
  ArrowUpRight,
  Briefcase,
  LifeBuoy,
} from "lucide-react";
import { compressImage } from "../utils/imageUtils";
import { THEMES, APP_MODULES, TRANSLATIONS } from "../constants";

import InputField from "../components/InputField";
import GlobalFullscreenSelect from "../components/GlobalFullscreenSelect";
import { downloadPdf } from '../utils/fileUtils';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";
import { Capacitor } from "@capacitor/core";

const ICON_MAP: Record<string, any> = {
  Truck,
  Users,
  Wallet,
  ShieldCheck,
  Settings,
  FileText,
  Headphones,
  Moon,
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Activity,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Banknote,
  CreditCard,
  Plus,
  Car,
  User: UserIcon,
  DollarSign,
  Clock,
  Sliders,
  RefreshCw,
  MessageSquare,
  Palette,
  Lock,
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0,
    },
  },
};

const InfoItem: React.FC<{
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}> = ({ label, value, className, valueClassName }) => (
  <div
    className={`bg-black/[0.03] dark:bg-white/5 h-12 px-3 flex flex-col justify-center rounded-md !border-solid !border !border-black/15 dark:!border-white/20 ${className}`}
  >
    <p className="text-[10px] font-bold text-text-muted uppercase mb-0.5 leading-none">
      {label}
    </p>
    <p
      className={`text-[12px] font-bold text-text-main leading-tight ${valueClassName}`}
    >
      {value || "--"}
    </p>
  </div>
);

const CompactInfoItem: React.FC<{
  label: string;
  value: React.ReactNode;
  className?: string;
  valueClassName?: string;
}> = ({ label, value, className, valueClassName }) => (
  <div
    className={`bg-black/[0.03] dark:bg-white/5 px-3 py-2 flex flex-col justify-center rounded-md !border-solid !border !border-black/15 dark:!border-white/20 ${className}`}
  >
    <p className="text-[8px] font-black text-text-muted uppercase mb-0.5">
      {label}
    </p>
    <p className={`text-[10px] font-black text-text-main ${valueClassName}`}>
      {value || "--"}
    </p>
  </div>
);

const formatMobileNumber = (mobile: any, code: any) => {
  if (mobile === undefined || mobile === null || mobile === "") return "--";
  const cleanMobile = String(mobile).trim();
  const cleanCode = code ? String(code).trim() : "";
  
  if (cleanCode && cleanMobile.startsWith(cleanCode)) {
    return cleanMobile;
  }
  
  if (cleanMobile.startsWith("+") || cleanMobile.startsWith("00")) {
    return cleanMobile;
  }
  
  return `${cleanCode}${cleanMobile}`;
};

const UserProfile: React.FC = () => {
  const { theme, selectedUser, user: loggedInUser, language, selectedCurrency, removePayment, showFeedback, updatePayment, updateUser, appThemeMode, backgroundColor, setAppThemeMode, activeSection, goBack, setSelectedUser, setView, setActiveSection, logout, allPayments, payments, allFinances, confirmAction, setCustomBackAction, addNotification } = useStore();

  const handleLogout = () => {
    confirmAction(
      language === 'bn' ? 'আপনি কি লগআউট করতে চান?' : 'Are you sure you want to log out?',
      () => {
        logout();
      },
      {
        title: language === 'bn' ? 'লগআউট' : 'Logout',
        confirmText: language === 'bn' ? 'হ্যাঁ' : 'Yes',
        cancelText: language === 'bn' ? 'না' : 'No'
      }
    );
  };
  
  

  const [filterMonth, setFilterMonth] = useState<number | 'ALL'>(new Date().getMonth());
  const [filterYear, setFilterYear] = useState<number | 'ALL'>(new Date().getFullYear());
  const [showTransactions, setShowTransactions] = useState(false);
  const [isMonthSelectOpen, setIsMonthSelectOpen] = useState(false);
  const [isYearSelectOpen, setIsYearSelectOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];
  const t = TRANSLATIONS[language];
  const [showStatusOptions, setShowStatusOptions] = useState(false);
  const [showBlockOptions, setShowBlockOptions] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [adminViewTab, setAdminViewTab] = useState<"Personal Info" | "Subscription Info" | "Payment Info" | "Login Session" | "Account Controls">("Personal Info");
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const blockDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setShowStatusOptions(false);
      }
      if (
        blockDropdownRef.current &&
        !blockDropdownRef.current.contains(event.target as Node)
      ) {
        setShowBlockOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Use selectedUser if available (admin viewing user), otherwise loggedInUser (user viewing self)
  const rawDisplayUser = selectedUser || loggedInUser;
  const [isDataUnmasked, setIsDataUnmasked] = useState(false);
  
  const displayUser = useMemo(() => {
    if (!rawDisplayUser) return rawDisplayUser;
    return decryptSensitiveFields(rawDisplayUser);
  }, [rawDisplayUser]);
  
  const isAdmin = loggedInUser?.role === "ADMIN";
  const isViewingSelf = !selectedUser || selectedUser.id === loggedInUser?.id;

  const [fetchedPayments, setFetchedPayments] = useState<any[]>([]);

  useEffect(() => {
    let unsub = () => {};
    if (
      loggedInUser?.role === "ADMIN" &&
      displayUser &&
      displayUser.id !== loggedInUser.id
    ) {
      const userDocPath =
        displayUser.role === "ADMIN"
          ? `admins/${displayUser.id}`
          : `users/${displayUser.id}`;
      unsub = subscribeFirebaseCollection(`${userDocPath}/payments`, (data) => {
        setFetchedPayments(data);
      });
    }
    return () => unsub();
  }, [loggedInUser?.id, loggedInUser?.role, displayUser?.id, displayUser?.role]);

  const combinedPayments = useMemo(() => {
    if (
      loggedInUser?.role === "ADMIN" &&
      displayUser &&
      displayUser.id !== loggedInUser.id
    ) {
      // Merge allPayments and fetchedPayments to ensure immediately added payments (via UserRenew)
      // are shown along with remote ones before the local store gets wiped.
      const map = new Map();
      allPayments.forEach((p) => map.set(p.id, p));
      fetchedPayments.forEach((p) => map.set(p.id, p));
      return Array.from(map.values());
    }
    return allPayments;
  }, [allPayments, fetchedPayments, loggedInUser, displayUser]);

  const userPayments = useMemo(() => {
    return combinedPayments
      .filter((p) => {
        const isUserMatch =
          p.userId === displayUser?.id || p.userId === displayUser?.userId;
        const cat = p.category?.toLowerCase() || "";
        const isRenew = cat.includes("renew") || cat.includes("subscription");
        return isUserMatch && isRenew;
      })
      .sort((a, b) => {
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        if (yearB !== yearA) return yearB - yearA;

        const monthA = a.month || 0;
        const monthB = b.month || 0;
        if (monthB !== monthA) return monthB - monthA;

        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        if (dateB !== dateA) return dateB - dateA;

        return String(b.id).localeCompare(String(a.id));
      });
  }, [combinedPayments, displayUser?.id, displayUser?.userId]);

  const totalSubscriptionPaid = userPayments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );
  const lastPayment = userPayments.length > 0 ? userPayments[0] : null;

  const formatPaymentDate = (dateStr: string) => {
    if (!dateStr) return "--";
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, "0");
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const monthStr = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${monthStr} ${year}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [isEditingPaymentInfo, setIsEditingPaymentInfo] = useState(false);
  const [isEditingLoginInfo, setIsEditingLoginInfo] = useState(false);
  const [sessionPopupData, setSessionPopupData] = useState<any>(null);
  
  const [subscriptionForm, setSubscriptionForm] = useState({
    activationDate: displayUser?.activationDate || "",
    duration: displayUser?.duration || "1 MONTH",
    package: displayUser?.package || "",
    packagePrice: displayUser?.packagePrice?.toString() || "0",
    expiryDate: displayUser?.expiryDate || "",
  });

  const [paymentForm, setPaymentForm] = useState({
    accountType: displayUser?.accountType || "Transport Account",
  });

  const [loginForm, setLoginForm] = useState({
    loginEmail: displayUser?.loginEmail || "",
    mobileNumber: displayUser?.mobileNumber || "",
    role: displayUser?.role || "USER",
  });

  useEffect(() => {
    if (activeSection !== "PAYMENT_SUMMARY") {
      setIsEditingSubscription(false);
    }
  }, [activeSection]);

  useEffect(() => {
    if (selectedUser && selectedUser.id !== loggedInUser?.id) {
      setCustomBackAction(() => {
        if (activeSection) {
          setActiveSection(null);
        } else {
          setSelectedUser(null);
          setView("USER_ACCOUNTS");
        }
      });
    } else {
      setCustomBackAction(null);
    }
    return () => {
      setCustomBackAction(null);
    };
  }, [selectedUser?.id, activeSection, loggedInUser?.id]);

  const infoFields = useMemo(() => {
    if (!displayUser) return [];
    return [
      { key: "fullName", label: language === "bn" ? "পূর্ণ নাম" : "Full Name", value: displayUser.name },
      { key: "userId", label: language === "bn" ? "ইউজার আইডি" : "User ID", value: displayUser.userId },
      { key: "loginEmail", label: language === "bn" ? "লগইন ইমেল" : "Login Email", value: displayUser.loginEmail },
      { key: "email", label: language === "bn" ? "ইমেল ঠিকানা" : "Email Address", value: displayUser.email },
      { key: "mobileNumber", label: language === "bn" ? "মোবাইল নম্বর" : "Mobile Number", value: formatMobileNumber(displayUser.mobileNumber || displayUser.mobile, displayUser.countryCode) },
      { key: "role", label: language === "bn" ? "রোল" : "Role", value: displayUser.role },
      { key: "nationality", label: language === "bn" ? "জাতীয়তা" : "Nationality", value: displayUser.nationality },
      { key: "dob", label: language === "bn" ? "জন্ম তারিখ" : "Date of Birth", value: displayUser.dob },
      { key: "gender", label: language === "bn" ? "লিঙ্গ" : "Gender", value: displayUser.gender },
      { key: "religion", label: language === "bn" ? "ধর্ম" : "Religion", value: displayUser.religion },
      { key: "bloodGroup", label: language === "bn" ? "রক্তের গ্রুপ" : "Blood Group", value: displayUser.bloodGroup },
      { key: "emergencyContact", label: language === "bn" ? "জরুরি যোগাযোগ" : "Emergency Contact", value: displayUser.emergencyContact },
      { key: "companyName", label: language === "bn" ? "স্পন্সর / কোম্পানি" : "Sponsor / Company", value: displayUser.companyName || displayUser.sponsorName || "--" },
      { key: "loginSession", label: language === "bn" ? "লগইন সেশন" : "Login Session", value: displayUser.isLoggedIn !== false ? (language === "bn" ? "লগইন" : "Login") : (language === "bn" ? "লগআউট" : "Logout") },
      { 
        key: "loginHistory", 
        label: language === "bn" ? "হিস্ট্রি" : "History", 
        value: (() => {
          const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const historyArr = (displayUser.loginHistory || []).filter((h: any) => !h.timestamp || h.timestamp >= sevenDaysAgo);
          if (historyArr.length > 0) {
            return historyArr.map((h: any) => `${h.action || (h.type === 'LOGOUT' ? (language === "bn" ? "লগআউট" : "Logout") : (language === "bn" ? "লগইন" : "Login"))} (${h.time || h.date || ''})`).join('\n');
          }
          const loginStr = displayUser.lastLogin || displayUser.loginTime || new Date().toLocaleString();
          const logoutStr = displayUser.lastLogout ? ` | ${language === "bn" ? "লগআউট" : "Logout"}: ${displayUser.lastLogout}` : '';
          return `${language === "bn" ? "লগইন" : "Login"}: ${loginStr}${logoutStr}`;
        })()
      },
      { key: "idType", label: language === "bn" ? "আইডি টাইপ" : "ID Type", value: displayUser.idType },
      { key: "idNumber", label: language === "bn" ? "আইডি নম্বর" : "ID Number", value: displayUser.idNumber },
      { key: "idIssueCountry", label: language === "bn" ? "আইডি প্রদানের দেশ" : "ID Issue Country", value: displayUser.idIssueCountry },
      { key: "idExpiryDate", label: language === "bn" ? "আইডি মেয়াদের তারিখ" : "ID Expiry Date", value: displayUser.idExpiryDate },
      { key: "country", label: language === "bn" ? "বর্তমান দেশ" : "Present Country", value: displayUser.country || displayUser.presentCountry },
      { key: "division", label: language === "bn" ? "বিভাগ" : "Division", value: displayUser.division },
      { key: "district", label: language === "bn" ? "জেলা" : "District", value: displayUser.district },
      { key: "city", label: language === "bn" ? "শহর" : "City", value: displayUser.city },
      { key: "upazila", label: language === "bn" ? "উপজেলা" : "Upazila", value: displayUser.upazila },
      { key: "policeStation", label: language === "bn" ? "থানা" : "Police Station", value: displayUser.policeStation },
      { key: "postOffice", label: language === "bn" ? "পোস্ট অফিস" : "Post Office", value: displayUser.postOffice },
      { key: "postalCode", label: language === "bn" ? "পোস্টাল কোড" : "Postal Code", value: displayUser.postalCode },
      { key: "area", label: language === "bn" ? "এলাকা" : "Area", value: displayUser.area },
      { key: "buildingNumber", label: language === "bn" ? "বিল্ডিং নম্বর" : "Building Number", value: displayUser.buildingNumber || displayUser.building },
      { key: "streetNumber", label: language === "bn" ? "স্ট্রিট নম্বর" : "Street Number", value: displayUser.streetNumber },
      { key: "zoneNumber", label: language === "bn" ? "জোন নম্বর" : "Zone Number", value: displayUser.zoneNumber || displayUser.zone || displayUser.zoomNumber },
      { key: "electricityNumber", label: language === "bn" ? "বিদ্যুৎ বিল নম্বর" : "Electricity Number", value: displayUser.electricityNumber || displayUser.electricity },
      { key: "addressLine1", label: language === "bn" ? "ঠিকানা লাইন ১" : "Address Line 1", value: displayUser.addressLine1 },
      { key: "addressLine2", label: language === "bn" ? "ঠিকানা লাইন ২" : "Address Line 2", value: displayUser.addressLine2 },
      { key: "manualAddress", label: language === "bn" ? "ম্যানুয়াল ঠিকানা" : "Manual Address", value: displayUser.manualAddress },
      { key: "accountType", label: language === "bn" ? "অ্যাকাউন্টের ধরন" : "Account Type", value: displayUser.accountType },
      { key: "duration", label: language === "bn" ? "মেয়াদকাল" : "Duration", value: displayUser.duration },
      { key: "package", label: language === "bn" ? "প্যাকেজ" : "Package", value: displayUser.package },
      { key: "packagePrice", label: language === "bn" ? "প্যাকেজ মূল্য" : "Package Price", value: displayUser.packagePrice ? `${selectedCurrency} ${displayUser.packagePrice}` : displayUser.price ? `${selectedCurrency} ${displayUser.price}` : "" },
      { key: "activationDate", label: language === "bn" ? "অ্যাক্টিভেশনের তারিখ" : "Activation Date", value: displayUser.activationDate },
      { key: "expiryDate", label: language === "bn" ? "অ্যাকাউন্টের মেয়াদোত্তীর্ণ" : "Account Expiry", value: displayUser.expiryDate },
      { key: "status", label: language === "bn" ? "স্ট্যাটাস" : "Status", value: displayUser.status === "ENABLED" ? (language === "bn" ? "সক্রিয়" : "Active") : displayUser.status },
    ];
  }, [displayUser, language, selectedCurrency]);

  useEffect(() => {
    setSubscriptionForm({
      activationDate: displayUser?.activationDate || "",
      duration: displayUser?.duration || "1 MONTH",
      package: displayUser?.package || "",
      packagePrice: displayUser?.packagePrice?.toString() || "0",
      expiryDate: displayUser?.expiryDate || "",
    });
    setPaymentForm({
      accountType: displayUser?.accountType || "Transport Account",
    });
    setLoginForm({
      loginEmail: displayUser?.loginEmail || "",
      mobileNumber: displayUser?.mobileNumber || "",
      role: displayUser?.role || "USER",
    });
  }, [displayUser?.id]);

  const [subSelectModal, setSubSelectModal] = useState<{
    isOpen: boolean;
    name: string;
    label: string;
    options: any[];
    formType: "subscription" | "payment" | "login";
  }>({ isOpen: false, name: "", label: "", options: [], formType: "subscription" });

  const handleOpenSubSelectModal = (
    name: string,
    label: string,
    options: any[],
    formType: "subscription" | "payment" | "login" = "subscription"
  ) => {
    setSubSelectModal({
      isOpen: true,
      name,
      label,
      options,
      formType,
    });
  };

  const handleSubSelectModalChange = (value: string) => {
    if (subSelectModal.formType === "payment") {
       setPaymentForm((prev) => ({ ...prev, [subSelectModal.name]: value }));
    } else if (subSelectModal.formType === "login") {
       setLoginForm((prev) => ({ ...prev, [subSelectModal.name]: value }));
    } else {
       setSubscriptionForm((prev) => ({ ...prev, [subSelectModal.name]: value }));
    }
    setSubSelectModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    if (activeSection === "PAYMENT_SUMMARY") {
      window.dispatchEvent(
        new CustomEvent("change-title", {
          detail:
            language === "bn" ? "ম্যানেজ সাবস্ক্রিপশন" : "Manage Subscription",
        }),
      );
    } else {
      window.dispatchEvent(new CustomEvent("change-title", { detail: null }));
    }
  }, [activeSection, language]);

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const ResetPasswordModal = (
    <>
      {createPortal(
        <>
          {showResetPassword && (
            <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center p-4">
              <div
                
                
                
                onClick={() => setShowResetPassword(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <div
                
                
                
                
                className="relative bg-theme-card border border-black/5 dark:border-white/5 w-full max-w-sm rounded-[16px] shadow-2xl overflow-hidden z-10"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-amber-600">
                    <Lock
                      size={24}
                      style={{ color: currentThemeObj.primary }}
                    />
                    <h3 className="text-lg font-black text-text-main">
                      {language === "bn"
                        ? "পাসওয়ার্ড রিসেট করুন"
                        : "Reset Password"}
                    </h3>
                  </div>
                  <p className="text-sm text-text-muted">
                    {language === "bn"
                      ? `${displayUser.name} এর জন্য একটি নতুন পাসওয়ার্ড প্রবেশ করান।`
                      : `Enter a new password for ${displayUser.name}.`}
                  </p>
                  <div className="pt-2">
                    <InputField
                      label={
                        language === "bn" ? "নতুন পাসওয়ার্ড" : "New Password"
                      }
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      icon={<Lock size={16} />}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setShowResetPassword(false)}
                      className="flex-1 h-12 rounded-[12px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-black uppercase text-xs hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      {language === "bn" ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      onClick={async () => {
                        if (!newPassword) {
                          return showFeedback(
                            language === "bn"
                              ? "অনুগ্রহ করে একটি পাসওয়ার্ড লিখুন"
                              : "Please enter a password",
                          );
                        }
                        
                        try {
                          const bcrypt = await import('bcryptjs');
                          const hashedPassword = await bcrypt.hash(newPassword, 10);
                          
                          // Sync to Firebase Auth
                          try {
                            const response = await fetch('/api/auth/update-password', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({
                                email: displayUser.email,
                                password: newPassword
                              })
                            });
                            if (!response.ok) {
                              const errData = await response.json();
                              console.warn("Failed to sync updated password to Firebase Auth:", errData);
                            }
                          } catch (authErr) {
                            console.warn("Failed to contact Firebase Auth sync endpoint:", authErr);
                          }

                          const { saveFirebaseDocMerge } = await import('@/services/firebase');
                          const coll = displayUser.role === 'ADMIN' ? 'admins' : 'users';
                          await saveFirebaseDocMerge(coll, displayUser.id, { password: hashedPassword });
                          
                          updateUser({ ...displayUser, password: hashedPassword });
                          
                          const now = new Date();
                          const formattedDateTime = now.toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit', 
                            hour12: true 
                          });

                          addNotification({
                            title: language === 'bn' ? 'পাসওয়ার্ড পরিবর্তিত হয়েছে' : 'Password Changed',
                            message: `Success: Password changed successfully.\nDate & Time: ${formattedDateTime}`,
                            type: 'INFO',
                            userId: displayUser.id,
                            targetUserId: displayUser.id
                          });

                          showFeedback(
                            language === "bn"
                              ? "পাসওয়ার্ড সফলভাবে রিসেট হয়েছে"
                              : "Password reset successfully",
                          );
                          setShowResetPassword(false);
                          setNewPassword("");
                        } catch (err) {
                          console.error("Failed to update password:", err);
                          
                          const now = new Date();
                          const formattedDateTime = now.toLocaleString('en-US', { 
                            year: 'numeric', 
                            month: '2-digit', 
                            day: '2-digit', 
                            hour: '2-digit', 
                            minute: '2-digit', 
                            second: '2-digit', 
                            hour12: true 
                          });

                          addNotification({
                            title: language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ' : 'Password Change Failed',
                            message: `Failed: Password change failed. Please try again.\nDate & Time: ${formattedDateTime}`,
                            type: 'INFO',
                            userId: displayUser.id,
                            targetUserId: displayUser.id
                          });

                          showFeedback(
                            language === "bn"
                              ? "পাসওয়ার্ড আপডেট করতে ব্যর্থ হয়েছে"
                              : "Failed to update password in database",
                            "error"
                          );
                        }
                      }}
                      className="flex-1 h-12 rounded-[12px] bg-cyan-500 font-black uppercase text-xs text-white shadow-lg shadow-cyan-500/30 hover:bg-cyan-600 transition-colors"
                    >
                      {language === "bn" ? "রিসেট" : "Reset"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body,
      )}
    </>
  );

  const EditPaymentModal = (
    <>
      {createPortal(
        <>
          {editingPayment && (
            <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center p-4">
              <div
                
                
                
                onClick={() => setEditingPayment(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <div
                
                
                
                
                className="relative bg-theme-card border border-black/5 dark:border-white/5 w-full max-w-md rounded-[16px] shadow-2xl overflow-hidden z-10"
              >
                {/* Premium Beautiful Gradient Header */}
                <div
                  className="px-6 py-5 flex items-center gap-4 text-white relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${currentThemeObj.primary || "#0f172a"} 0%, #064e3b 60%, #0d9488 100%)`,
                  }}
                >
                  <div className="absolute -top-10 -right-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-400/20 rounded-full blur-lg pointer-events-none" />

                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md text-white flex items-center justify-center shadow-lg border border-white/20 z-10">
                    <Banknote
                      size={22}
                      className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
                    />
                  </div>
                  <div className="flex flex-col z-10">
                    <h3 className="text-sm font-black uppercase tracking-[0.14em] text-white drop-shadow-sm font-sans">
                      {language === "bn"
                        ? "ট্রানজেকশন ডিটেলস"
                        : "Transaction Details"}
                    </h3>
                    <span className="text-[10px] font-black tracking-widest text-white/90 uppercase mt-0.5 opacity-95">
                      {language === "bn"
                        ? "রসিদ ও পেমেন্ট বিবরণ"
                        : "Receipt & Payment Summary"}
                    </span>
                  </div>
                  
                </div>

                <div className="p-6 pt-5 space-y-4">
                  <div className="space-y-3 bg-black/[0.03] dark:bg-white/[0.05] p-4 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-muted uppercase tracking-wider">
                        {language === "bn" ? "তারিখ" : "Date & Time"}
                      </span>
                      <span className="font-black text-text-main">
                        {editingPayment.date} • {editingPayment.time}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-muted uppercase tracking-wider">
                        {language === "bn"
                          ? "ট্রানজেকশন আইডি"
                          : "Transaction ID"}
                      </span>
                      <span className="font-mono font-bold text-text-main bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                        {editingPayment.transactionId ||
                          editingPayment.id?.slice(-8)?.toUpperCase() || ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-muted uppercase tracking-wider">
                        {language === "bn" ? "ইউজার নাম" : "User Name"}
                      </span>
                      <span className="font-black text-text-main">
                        {editingPayment.details?.userName ||
                          displayUser?.name ||
                          "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-text-muted uppercase tracking-wider">
                        {language === "bn" ? "ইউজার আইডি" : "User ID"}
                      </span>
                      <span className="font-mono font-bold text-text-main bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded">
                        {editingPayment.userId || displayUser?.userId || "--"}
                      </span>
                    </div>
                  </div>

                  {isAdmin ? (
                    <div className="pt-2">
                      <InputField
                        label={language === "bn" ? "অ্যামাউন্ট" : "Amount"}
                        type="number"
                        value={editingPayment.amount?.toString() || ""}
                        onChange={(e) =>
                          setEditingPayment({
                            ...editingPayment,
                            amount: e.target.value,
                          })
                        }
                        icon={<Banknote size={16} />}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3 bg-black/[0.03] dark:bg-white/[0.05] p-4 rounded-xl mt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-text-muted uppercase tracking-wider">
                          {language === "bn" ? "অ্যামাউন্ট" : "Amount"}
                        </span>
                        <span className="font-black text-emerald-500 text-sm">
                          {selectedCurrency}{" "}
                          {Number(editingPayment.amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-black/5 dark:border-white/5 mt-2">
                    {!isAdmin ? (
                      <button
                        onClick={() => setEditingPayment(null)}
                        className="w-full py-3 h-12 rounded-[12px] bg-gray-100 dark:bg-white/5 font-black uppercase text-xs text-text-main hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                      >
                        {language === "bn" ? "বন্ধ করুন" : "Close"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingPayment(null)}
                          className="flex-1 py-3 h-12 rounded-[12px] bg-gray-100 dark:bg-white/5 font-black uppercase text-xs text-text-main hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                        >
                          {language === "bn" ? "বাতিল" : "Cancel"}
                        </button>
                        <button
                          onClick={() => {
                            removePayment(
                              editingPayment.id,
                              editingPayment.userId,
                            );
                            setEditingPayment(null);
                            showFeedback(
                              language === "bn"
                                ? "ট্রানজেকশন মুছে ফেলা হয়েছে"
                                : "Transaction deleted successfully",
                            );
                          }}
                          className="flex-1 py-3 h-12 rounded-[12px] bg-red-500/10 text-red-500 font-black uppercase text-xs hover:bg-red-500/20 transition-colors"
                        >
                          {language === "bn" ? "ডিলিট" : "Delete"}
                        </button>
                        <button
                          onClick={() => {
                            const parsedAmount = parseFloat(
                              editingPayment.amount || "0",
                            );
                            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                              removePayment(
                                editingPayment.id,
                                editingPayment.userId,
                              );
                              showFeedback(
                                language === "bn"
                                  ? "ট্রানজেকশন মুছে ফেলা হয়েছে (০ অ্যামাউন্ট)"
                                  : "Transaction deleted due to zero amount",
                              );
                            } else {
                              updatePayment({
                                ...editingPayment,
                                amount: parsedAmount,
                              });
                              showFeedback(
                                language === "bn"
                                  ? "ট্রানজেকশন আপডেট হয়েছে"
                                  : "Transaction updated successfully",
                              );
                            }
                            setEditingPayment(null);
                          }}
                          className="flex-1 py-3 h-12 rounded-[12px] bg-emerald-500 text-white font-black uppercase text-xs hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
                        >
                          {language === "bn" ? "আপডেট" : "Update"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body,
      )}
    </>
  );

  const handlePrint = () => {
    setShowDownloadMenu(false);
    setTimeout(() => window.print(), 100);
  };

  const handleDownloadPDF = async () => {
    setShowDownloadMenu(false);
    if (!displayUser) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Helper functions
      const hexToRgb = (hex: string): [number, number, number] => {
        const cleanHex = hex.replace("#", "");
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return [isNaN(r) ? 15 : r, isNaN(g) ? 23 : g, isNaN(b) ? 42 : b];
      };

      const formatDate = (dateStr?: string) => {
        if (!dateStr) return "--";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };

      // Theme Colors
      const primaryHex = currentThemeObj.primary || "#0f172a";
      const [pR, pG, pB] = hexToRgb(primaryHex);

      // Current system dates for report
      const d = new Date();
      const todayDateStr = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

      // Let's resolve status string beautifully
      let statusText = "Verified Profile";
      let statusColor: [number, number, number] = [21, 128, 61]; // green
      if (displayUser.status === "BLOCKED") {
        statusText = "Blocked Profile";
        statusColor = [220, 38, 38]; // red
      } else if (displayUser.status === "PENDING") {
        statusText = "Pending Profile";
        statusColor = [217, 119, 6]; // amber
      } else if (displayUser.status === "DISABLED") {
        statusText = "Disabled Profile";
        statusColor = [100, 116, 139]; // slate
      }

      // Draw Top Brand Main Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(pR, pG, pB);
      doc.text("PERSONAL PROFILE REPORT", 15, 20);

      // Top Right Meta Info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text("Date:", pageWidth - 55, 17, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(todayDateStr, pageWidth - 15, 17, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.text("Status:", pageWidth - 55, 22, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusText, pageWidth - 15, 22, { align: "right" });

      // Drawing horizontal rule line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 28, pageWidth - 15, 28);

      let currentY = 38;

      // 1. Label formatting function
      const labelCell = (text: string) => ({
        content: text,
        styles: {
          fontStyle: "bold" as const,
          fillColor: [248, 250, 252] as [number, number, number],
          textColor: [71, 85, 105] as [number, number, number],
        },
      });

      // 2. Value formatting function
      const valueCell = (text?: string, colSpan = 1, isHighlight = false) => ({
        content: text || "--",
        colSpan,
        styles: {
          fontStyle: isHighlight ? ("bold" as const) : ("normal" as const),
          textColor: isHighlight
            ? ([pR, pG, pB] as [number, number, number])
            : ([15, 23, 42] as [number, number, number]),
        },
      });

      // ---- SECTION 1: PERSONAL INFORMATION ----
      // Left vertical line for Section header
      doc.setFillColor(pR, pG, pB);
      doc.rect(15, currentY - 4.5, 2.5, 6, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(pR, pG, pB);
      doc.text("PERSONAL INFORMATION", 20, currentY);

      currentY += 4;

      const personalRows = [
        [labelCell("Full Name"), valueCell(displayUser.name, 3, true)],
        [
          labelCell("Date of Birth"),
          valueCell(formatDate(displayUser.dob)),
          labelCell("Nationality"),
          valueCell(displayUser.nationality),
        ],
        [
          labelCell("Gender"),
          valueCell(displayUser.gender),
          labelCell("Religion"),
          valueCell(displayUser.religion),
        ],
        [
          labelCell("Email Address"),
          valueCell(displayUser.email || displayUser.loginEmail, 3),
        ],
        [labelCell("Mobile Number"), valueCell(displayUser.mobileNumber, 3)],
        [
          labelCell("ID Type"),
          valueCell(displayUser.idType),
          labelCell("ID Number"),
          valueCell(displayUser.idNumber),
        ],
        [
          labelCell("Issue Country"),
          valueCell(displayUser.idIssueCountry),
          labelCell("Expiry Date"),
          valueCell(formatDate(displayUser.idExpiryDate)),
        ],
      ];

      autoTable(doc, {
        startY: currentY,
        body: personalRows,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { cellWidth: 40 },
          3: { cellWidth: 50 },
        },
        margin: { left: 15, right: 15 },
      });

      const finalYOfPersonal = (doc as any).lastAutoTable.finalY || currentY;
      currentY = finalYOfPersonal + 12;

      // ---- SECTION 2: ADDRESS INFORMATION ----
      // Left vertical line for section header
      doc.setFillColor(pR, pG, pB);
      doc.rect(15, currentY - 4.5, 2.5, 6, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(pR, pG, pB);
      doc.text("ADDRESS INFORMATION", 20, currentY);

      currentY += 4;

      const addressRows = [
        [
          labelCell("Country"),
          valueCell(displayUser.presentCountry),
          labelCell("Division"),
          valueCell(displayUser.division),
        ],
        [
          labelCell("District"),
          valueCell(displayUser.district),
          labelCell("City"),
          valueCell(displayUser.city),
        ],
        [
          labelCell("Upazila"),
          valueCell(displayUser.upazila),
          labelCell("Postal Code"),
          valueCell(displayUser.postalCode),
        ],
        [
          labelCell("Area"),
          valueCell(displayUser.area),
          labelCell("Building No."),
          valueCell(displayUser.buildingNumber),
        ],
        [
          labelCell("State No."),
          valueCell(displayUser.stateNumber),
          labelCell("Zone No."),
          valueCell(displayUser.zoomNumber || (displayUser as any).zoneNumber),
        ],
      ];

      autoTable(doc, {
        startY: currentY,
        body: addressRows,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 8.5,
          lineColor: [226, 232, 240],
          lineWidth: 0.1,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 50 },
          2: { cellWidth: 40 },
          3: { cellWidth: 50 },
        },
        margin: { left: 15, right: 15 },
      });

      // Draw footer line and footer systems tag
      const docHeight = doc.internal.pageSize.getHeight();
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(15, docHeight - 15, pageWidth - 15, docHeight - 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        "FleetPro Manager System Generated Document © 2026. All rights reserved.",
        pageWidth / 2,
        docHeight - 10,
        { align: "center" },
      );

      // Save / Export implementation
      const timestampStr = d.toISOString().replace(/[:.]/g, "-");
      const baseFilename = displayUser.name.replace(/\s+/g, "_") || "user";
      const fileName = `${baseFilename}_Profile_${timestampStr}.pdf`;

      await downloadPdf(doc, fileName, showFeedback, language);
    } catch (error) {
      console.error("Error generating profile PDF:", error);
      showFeedback(
        language === "bn"
          ? "পিডিএফ তৈরি করার সময় একটি সমস্যা হয়েছে।"
          : "An error occurred while generating the PDF.",
      );
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && displayUser) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const originalDataUrl = reader.result as string;
          const compressedDataUrl = await compressImage(originalDataUrl);

          updateUser({
            ...displayUser,
            avatar: compressedDataUrl,
          });
          showFeedback("Profile picture updated successfully!");
        } catch (error) {
          console.error("Image compression failed:", error);
          showFeedback("Failed to process image. Please try another one.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = (newStatus: "ENABLED" | "DISABLED") => {
    if (!displayUser) return;

    const timestamp = new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    updateUser({
      ...displayUser,
      status: newStatus,
      statusTimestamp: timestamp,
    });

    setShowStatusOptions(false);
    showFeedback(
      `User ${newStatus === "ENABLED" ? "Activated" : "Deactivated"} Successfully`,
    );
  };

  const handleBlockChange = (shouldBlock: boolean) => {
    if (!displayUser) return;

    const timestamp = new Date().toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    updateUser({
      ...displayUser,
      status: shouldBlock ? "BLOCKED" : "ENABLED", // Revert to ENABLED when unblocked
      blockTimestamp: timestamp,
    });

    setShowBlockOptions(false);
    showFeedback(`User ${shouldBlock ? "Blocked" : "Unblocked"} Successfully`);
  };

  if (!displayUser) return null;

  const isWhiteBg =
    appThemeMode === "light" &&
    (!backgroundColor || (backgroundColor?.toLowerCase() || "") === "#ffffff");

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onClick,
    color = "var(--text-main)",
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onClick: () => void;
    color?: string;
  }) => {
    const isHex = color.startsWith('#');
    const bgStyle = isHex 
      ? { color: color, backgroundColor: `${color}18` } 
      : { color: color, backgroundColor: 'rgba(var(--primary-rgb, 16, 185, 129), 0.1)' };

    return (
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-theme-card rounded-[10px] border border-black/[0.04] dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.04)] hover:bg-gray-50/50 dark:hover:bg-white/5 active:scale-[0.985] transition-all duration-200 text-left rtl:text-right"
      >
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className="w-12 h-12 rounded-[8px] grid place-items-center flex-shrink-0"
            style={bgStyle}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              size: 22,
              className: "w-5.5 h-5.5 flex-shrink-0 select-none mx-auto my-auto block",
              style: { display: 'block', margin: 'auto', width: '22px', height: '22px', minWidth: '22px', minHeight: '22px' }
            })}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[15px] sm:text-base text-text-main leading-tight truncate">
              {title}
            </span>
            {subtitle && (
              <span className="text-[12px] sm:text-[13px] text-text-muted mt-1 leading-normal font-medium block">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={20} className="text-text-muted ml-3 rtl:mr-3 rtl:ml-0 rtl:rotate-180 flex-shrink-0" />
      </button>
    );
  };

  // Sub-page Renderer
  const renderSubPage = () => {
    const AccountInfoItems = (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <InfoItem
          label="Account Title"
          value={displayUser.name}
          className="col-span-2 md:col-span-3 lg:col-span-4"
        />
        <InfoItem
          label="account number"
          value={displayUser.accountNumber}
          className="col-span-2 md:col-span-3 lg:col-span-4"
        />
        <InfoItem
          label="Bank Name"
          value={displayUser.bankName}
          className="col-span-2 md:col-span-2 lg:col-span-2"
        />
        <InfoItem label="Branch Name" value={displayUser.branchName} />
        <InfoItem label="Routing Number" value={displayUser.routingNumber} />

        <InfoItem label="User ID" value={displayUser.id} />
        <InfoItem label="Role" value={displayUser.role} />
        <InfoItem label="Account Type" value={displayUser.accountType || "Transport Account"} />

        {isAdmin && (
          <>
            <InfoItem label="Password" value="••••••••" />

            <div className="bg-theme-card h-9 px-2 flex flex-col justify-center rounded-[8px] relative group border border-solid border-black/15 dark:border-white/20">
              <p className="text-[10px] font-bold text-text-muted uppercase mb-0 leading-none">
                New Password
              </p>
              <input
                type="password"
                value={newPassword}
                className="bg-transparent text-[12px] font-bold text-text-main outline-none w-full placeholder:text-text-muted dark:placeholder:text-text-main leading-tight"
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {newPassword && (
                <button
                  onClick={async () => {
                    try {
                      const bcrypt = await import('bcryptjs');
                      const hashedPassword = await bcrypt.hash(newPassword, 10);
                      
                      // Sync to Firebase Auth
                      try {
                        const response = await fetch('/api/auth/update-password', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            email: displayUser.email,
                            password: newPassword
                          })
                        });
                        if (!response.ok) {
                          const errData = await response.json();
                          console.warn("Failed to sync updated password to Firebase Auth:", errData);
                        }
                      } catch (authErr) {
                        console.warn("Failed to contact Firebase Auth sync endpoint:", authErr);
                      }

                      const { saveFirebaseDocMerge } = await import('@/services/firebase');
                      const coll = displayUser.role === 'ADMIN' ? 'admins' : 'users';
                      await saveFirebaseDocMerge(coll, displayUser.id, { password: hashedPassword });
                      
                      updateUser({ ...displayUser, password: hashedPassword });

                      const now = new Date();
                      const formattedDateTime = now.toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit', 
                        hour12: true 
                      });

                      addNotification({
                        title: language === 'bn' ? 'পাসওয়ার্ড পরিবর্তিত হয়েছে' : 'Password Changed',
                        message: `Success: Password changed successfully.\nDate & Time: ${formattedDateTime}`,
                        type: 'INFO',
                        userId: displayUser.id,
                        targetUserId: displayUser.id
                      });

                      showFeedback("Password updated successfully");
                      setNewPassword("");
                    } catch (err) {
                      console.error("Failed to update password:", err);

                      const now = new Date();
                      const formattedDateTime = now.toLocaleString('en-US', { 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit', 
                        hour12: true 
                      });

                      addNotification({
                        title: language === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ' : 'Password Change Failed',
                        message: `Failed: Password change failed. Please try again.\nDate & Time: ${formattedDateTime}`,
                        type: 'INFO',
                        userId: displayUser.id,
                        targetUserId: displayUser.id
                      });

                      showFeedback("Failed to update password", "error");
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-green-500 text-white rounded-[8px] shadow-sm hover:bg-green-600 transition-colors"
                >
                  <Check size={12} />
                </button>
              )}
            </div>
          </>
        )}

        <InfoItem
          label="Create Date"
          value={displayUser.registrationDate}
          className="col-span-2 md:col-span-3 lg:col-span-4"
        />
      </div>
    );

    const AccountStatusToggle = (
      <div className="col-span-2 bg-theme-card h-9 px-2 flex items-center justify-between rounded-[8px] mt-3 border border-solid border-black/15 dark:border-white/20">
        <p className="text-[10px] font-bold text-text-main uppercase">
          Account Status
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleStatusChange("ENABLED")}
            className={`px-3 py-0.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${
              displayUser.status === "ENABLED"
                ? "bg-green-500 text-white shadow-md shadow-green-500/20"
                : "bg-gray-200 dark:bg-white/10 text-text-main hover:bg-gray-300 dark:hover:bg-white/20"
            }`}
          >
            {(t as any).ENABLED}
          </button>
          <button
            onClick={() => handleStatusChange("DISABLED")}
            className={`px-3 py-0.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${
              displayUser.status === "DISABLED"
                ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                : "bg-gray-200 dark:bg-white/10 text-text-main hover:bg-gray-300 dark:hover:bg-white/20"
            }`}
          >
            {(t as any).DISABLED}
          </button>
        </div>
      </div>
    );

    const PersonalContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoItem
          label={language === "bn" ? "একাউন্ট টাইটেল" : "Account Title"}
          value={displayUser.name}
          className="md:col-span-2"
        />
        <InfoItem
          label={language === "bn" ? "লগইন ইমেইল আইডি" : "Login Email ID"}
          value={displayUser.loginEmail || displayUser.email}
          className="md:col-span-2"
        />
        <InfoItem
          label={language === "bn" ? "ইউজার আইডি" : "User ID"}
          value={displayUser.userId || displayUser.id}
        />
        <InfoItem
          label={language === "bn" ? "মোবাইল নাম্বার" : "Mobile Number"}
          value={formatMobileNumber(displayUser.mobileNumber || displayUser.mobile, displayUser.countryCode)}
        />
        <InfoItem
          label={language === "bn" ? "রোল" : "Role"}
          value={
            displayUser.role === "ADMIN"
              ? language === "bn"
                ? "এডমিন"
                : "Admin"
              : language === "bn"
                ? "ইউজার"
                : "User"
          }
          valueClassName="text-cyan-500"
        />
        <InfoItem
          label={language === "bn" ? "রেজিস্ট্রেশন ডেট" : "Registration Date"}
          value={displayUser.registrationDate || displayUser.createdAt}
        />
      </div>
    );

    const DocumentsContent = (
      <div className="grid grid-cols-2 gap-3">
        <InfoItem label="ID Type" value={displayUser.idType} />
        <InfoItem label="ID Number" value={displayUser.idNumber} />
        <InfoItem label="Issue Country" value={displayUser.idIssueCountry} />
        <InfoItem label="Expiry Date" value={displayUser.idExpiryDate} />
      </div>
    );

    const SubscriptionContent = (
      <div className="space-y-4">
        {/* Subscription Stats Card */}
        <div className="bg-theme-card h-fit p-5 rounded-[12px] border border-black/5 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 mb-5 px-1">
            <ShieldCheck size={16} className="text-emerald-500" />
            <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest">
              {displayUser.package || "Plan Membership"}
            </h3>
            <div className="ml-auto">
              <div
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  displayUser.status === "ENABLED" &&
                  !isExpired(displayUser.expiryDate)
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-red-500/10 text-red-500"
                }`}
              >
                {displayUser.status === "ENABLED" &&
                !isExpired(displayUser.expiryDate)
                  ? "Active"
                  : "Expired"}
              </div>
            </div>
          </div>

          {isEditingSubscription ? (
            <div className="space-y-4">
              <InputField
                label="Plan Duration"
                name="duration"
                type="select"
                value={subscriptionForm.duration}
                options={[
                  { label: "1 Month", value: "1 MONTH" },
                  { label: "3 Months", value: "3 MONTHS" },
                  { label: "6 Months", value: "6 MONTHS" },
                  { label: "1 Year", value: "12 MONTHS" },
                  { label: "Lifetime", value: "LIFETIME" },
                ]}
                onOpenModal={handleOpenSubSelectModal}
                icon={<Clock size={16} />}
              />
              <InputField
                label="Package Name"
                name="package"
                type="select"
                value={subscriptionForm.package}
                options={[
                  { label: "Basic", value: "Basic" },
                  { label: "Standard", value: "Standard" },
                  { label: "Premium", value: "Premium" },
                  { label: "Pro", value: "Pro" },
                  { label: "VIP", value: "VIP" },
                  { label: "Custom", value: "Custom" },
                ]}
                onOpenModal={handleOpenSubSelectModal}
                icon={<FileText size={16} />}
              />
              <InputField
                label="Package Price"
                name="packagePrice"
                type="number"
                value={subscriptionForm.packagePrice}
                onChange={(e) =>
                  setSubscriptionForm((prev) => ({
                    ...prev,
                    packagePrice: e.target.value,
                  }))
                }
                icon={<CreditCard size={16} />}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center py-3 px-4 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl border border-black/5 dark:border-white/5">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Package Name
                </span>
                <span className="text-sm font-bold text-text-main">
                  {displayUser.package || "--"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl border border-black/5 dark:border-white/5">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Plan Period
                </span>
                <span className="text-sm font-bold text-text-main">
                  {displayUser.duration || "--"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl border border-black/5 dark:border-white/5">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Package Value
                </span>
                <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                  {selectedCurrency}{" "}
                  {displayUser.packagePrice || displayUser.price || "0"}
                </span>
              </div>
              {displayUser.discountAmount ? (
                <div className="flex justify-between items-center py-3 px-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                    Discount applied
                  </span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    -{selectedCurrency} {displayUser.discountAmount}
                  </span>
                </div>
              ) : null}
              {displayUser.dueAmount ? (
                <div className="flex justify-between items-center py-3 px-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20">
                  <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
                    Remaining Due
                  </span>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-500">
                    {selectedCurrency} {displayUser.dueAmount}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between items-center py-3 px-4 bg-black/[0.03] dark:bg-white/[0.05] rounded-xl border border-black/5 dark:border-white/5">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Valid Until
                </span>
                <span
                  className={`text-sm font-black ${isExpired(displayUser.expiryDate) ? "text-red-500" : "text-emerald-500"}`}
                >
                  {displayUser.expiryDate || "Lifetime"}
                </span>
              </div>
            </div>
          )}
        </div>

        {isAdmin && displayUser.role !== "ADMIN" && (
          <div className="bg-theme-card p-5 rounded-[12px] border border-black/5 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Edit size={16} className="text-blue-500" />
              <h3 className="text-xs font-black text-text-main">
                Edit Subscription
              </h3>
            </div>
            {isEditingSubscription ? (
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingSubscription(false)}
                    className="flex-1 py-3 rounded-[8px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 transition-all font-black text-xs uppercase tracking-widest shadow-sm hover:bg-red-100 dark:hover:bg-red-500/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      updateUser({
                        ...displayUser,
                        activationDate: subscriptionForm.activationDate,
                        duration: subscriptionForm.duration,
                        package: subscriptionForm.package,
                        packagePrice:
                          parseFloat(subscriptionForm.packagePrice) || 0,
                        price: subscriptionForm.packagePrice,
                        expiryDate: subscriptionForm.expiryDate,
                      });
                      setIsEditingSubscription(false);
                      showFeedback("Subscription updated successfully");
                    }}
                    className="flex-1 py-3 rounded-[8px] bg-blue-500 hover:bg-blue-600 text-white transition-all shadow-md shadow-blue-500/10 font-black text-xs uppercase tracking-widest flex justify-center items-center gap-2"
                  >
                    <Check size={16} />
                    Update
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingSubscription(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[8px] border-2 border-dashed border-black/10 dark:border-white/10 hover:border-blue-500 hover:text-blue-500 text-text-muted transition-all font-bold text-sm"
              >
                <Edit size={16} />
                Edit Subscription
              </button>
            )}
          </div>
        )}

        {/* Special Permissions Card */}
        {Array.isArray(displayUser.permissions) && displayUser.permissions.length > 0 && (
          <div className="bg-theme-card p-5 rounded-[12px] border border-black/5 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-5 px-1">
              <Shield size={16} className="text-primary" />
              <h3 className="text-[10px] font-black text-text-main uppercase tracking-widest">
                Special Privileges
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {displayUser.permissions.map((p) => {
                const module = APP_MODULES.find((m) => m.id === p);
                if (!module) return null;
                const Icon = ICON_MAP[module.icon] || Shield;

                return (
                  <div
                    key={p}
                    className="flex items-center gap-2.5 p-2.5 bg-black/[0.03] dark:bg-white/[0.05] border border-black/5 dark:border-white/5 rounded-lg group transition-colors hover:border-primary/20"
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                      <Icon size={14} />
                    </div>
                    <span className="text-[10px] font-black text-text-main uppercase tracking-tight leading-tight truncate">
                      {module.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );

    const totalSubscriptionPaid = userPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    const filteredPayments = userPayments.filter((p) => {
      const monthMatch = filterMonth === 'ALL' ? true : Number(p.month) === filterMonth + 1;
      const yearMatch = filterYear === 'ALL' ? true : Number(p.year) === filterYear;
      return monthMatch && yearMatch;
    });

    const totalPaidInFilter = filteredPayments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    const planPrice = parseInt(displayUser.price || "0");
    const dueBalance = Math.max(0, planPrice - totalPaidInFilter);

    const PaymentsContent = (
      <div className="space-y-4">
        {/* Main Summary Card - High-End Premium Multi-color Style */}
        <div
          className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#312e81] p-6 rounded-[12px] border border-white/5 shadow-2xl relative overflow-hidden group"
        >
          {/* Subtle light flares */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"></div>
              <h3 className="text-[9px] font-black uppercase text-white tracking-[0.25em]">
                {t.summaryTitle || "Payment Summary"}
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsMonthSelectOpen(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase text-white transition-all active:scale-95 flex items-center gap-1.5"
              >
                {
                  filterMonth === 'ALL' ? (language === 'bn' ? 'সব মাস' : 'All Month') : [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ][filterMonth]
                }
                <ChevronRight size={10} className="rotate-90 text-white/50" />
              </button>
              <button
                onClick={() => setIsYearSelectOpen(true)}
                className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase text-white transition-all active:scale-95 flex items-center gap-1.5"
              >
                {filterYear === 'ALL' ? (language === 'bn' ? 'সব বছর' : 'All Years') : filterYear}
                <ChevronRight size={10} className="rotate-90 text-white/50" />
              </button>

              <GlobalFullscreenSelect
                isOpen={isMonthSelectOpen}
                onClose={() => setIsMonthSelectOpen(false)}
                onSelect={(val) => {
                  setFilterMonth(val === 'ALL' ? 'ALL' : parseInt(val));
                  setIsMonthSelectOpen(false);
                }}
                options={[
                  { label: language === 'bn' ? 'সব মাস' : 'All Month', value: 'ALL' },
                  ...[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((m, i) => ({
                    label: m,
                    value: String(i),
                  }))
                ]}
                title="Select Month"
                selectedValue={String(filterMonth)}
                searchable={false}
                allowAdd={false}
              />

              <GlobalFullscreenSelect
                isOpen={isYearSelectOpen}
                onClose={() => setIsYearSelectOpen(false)}
                onSelect={(val) => {
                  setFilterYear(val === 'ALL' ? 'ALL' : parseInt(val));
                  setIsYearSelectOpen(false);
                }}
                options={[
                  { label: language === 'bn' ? 'সব বছর' : 'All Years', value: 'ALL' },
                  ...Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => ({
                    label: String(y),
                    value: String(y),
                  }))
                ]}
                title="Select Year"
                selectedValue={String(filterYear)}
                searchable={false}
                allowAdd={false}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="relative overflow-hidden p-3.5 rounded-xl bg-white/[0.03] border border-white/5 transition-all text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1 h-1 rounded-full bg-red-400"></div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-red-200">
                    Due Balance
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white tracking-widest leading-none">
                    {dueBalance.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-black text-red-300">
                    {selectedCurrency}
                  </span>
                </div>
              </div>

              <div className="relative overflow-hidden p-3.5 rounded-xl bg-white/[0.03] border border-white/5 transition-all text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1 h-1 rounded-full bg-emerald-400"></div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-emerald-200">
                    Total Paid
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-white tracking-widest leading-none">
                    {totalPaidInFilter.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-black text-emerald-300">
                    {selectedCurrency}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
                  Period Volume
                </span>
              </div>
              <span className="text-[9px] font-black text-white/90 tracking-widest">
                {selectedCurrency} {planPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Banknote size={16} className="text-primary" />
            <h3 className="text-xs font-black uppercase text-text-main tracking-widest">
              Transaction History
            </h3>
          </div>

          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                onClick={() => setEditingPayment(payment)}
                className="group p-4 bg-theme-card rounded-[16px] border border-black/5 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors ">
                    <Banknote size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-text-main uppercase tracking-tight">
                      {payment.paymentMethod || "System Collection"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar size={10} className="text-text-muted/60" />
                      <p className="text-[9px] font-bold text-text-muted uppercase tracking-tighter">
                        {payment.date} • {payment.time}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500">
                    {selectedCurrency}{" "}
                    {Number(payment.amount || 0).toLocaleString()}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <Check size={10} className="text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                      Settled
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-black/10 dark:border-white/10">
              <Banknote size={32} className="mx-auto mb-3 text-text-muted/20" />
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                No payment records found
              </p>
            </div>
          )}
        </div>
      </div>
    );

    const AccountStatusContent = (
      <div className="space-y-6">
        <div className="bg-theme-card p-4 rounded-[16px] border border-black/5 dark:border-white/5 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#105f77] dark:text-cyan-400 border-b border-black/5 dark:border-white/5 pb-2">
            Account Actions
          </h3>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowResetPassword(true)}
              className="w-full flex items-center justify-between p-4 rounded-[12px] bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock size={20} />
                <span className="font-bold text-sm">
                  Reset Password
                </span>
              </div>
            </button>

            <h3 className="text-xs font-black uppercase tracking-widest text-[#105f77] dark:text-cyan-400 border-b border-black/5 dark:border-white/5 pb-2 pt-2">
              User Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {/* 1. Approved / Active */}
              <button
                onClick={() => {
                  const timestamp = new Date().toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  updateUser({
                    ...displayUser,
                    status: "ENABLED",
                    userId:
                      displayUser.userId ||
                      Math.floor(
                        10000000 + Math.random() * 90000000,
                      ).toString(),
                    permissions: displayUser.permissions || [
                      "TRIPS",
                      "MONTHLY_FILES",
                    ],
                    statusTimestamp: timestamp,
                  });
                  showFeedback("Account Status updated to Approved/Active");
                }}
                className={`p-4 rounded-[12px] border flex flex-col items-center justify-center gap-2 transition-all ${
                  displayUser.status === "ENABLED"
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                }`}
              >
                <Check size={24} />
                <span className="font-bold text-xs uppercase tracking-wider text-center">
                  Approved
                </span>
              </button>

              {/* 2. Pending Approval */}
              <button
                onClick={() => {
                  const timestamp = new Date().toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  updateUser({
                    ...displayUser,
                    status: "PENDING",
                    statusTimestamp: timestamp,
                  });
                  showFeedback("Account Status updated to Pending Approval");
                }}
                className={`p-4 rounded-[12px] border flex flex-col items-center justify-center gap-2 transition-all ${
                  displayUser.status === "PENDING"
                    ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                }`}
              >
                <Clock size={24} />
                <span className="font-bold text-xs uppercase tracking-wider text-center">
                  Pending
                </span>
              </button>

              {/* 3. Deactivated / Disabled */}
              <button
                onClick={() => {
                  const timestamp = new Date().toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  updateUser({
                    ...displayUser,
                    status: "DISABLED",
                    statusTimestamp: timestamp,
                  });
                  showFeedback("Account Status updated to Disabled");
                }}
                className={`p-4 rounded-[12px] border flex flex-col items-center justify-center gap-2 transition-all ${
                  displayUser.status === "DISABLED"
                    ? "bg-gray-500 text-white border-gray-500 shadow-md shadow-gray-500/20"
                    : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 hover:bg-gray-500/20"
                }`}
              >
                <Power size={24} />
                <span className="font-bold text-xs uppercase tracking-wider text-center">
                  Disabled
                </span>
              </button>

              {/* 4. Blocked */}
              <button
                onClick={() => {
                  const timestamp = new Date().toLocaleString("en-US", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  });
                  updateUser({
                    ...displayUser,
                    status: "BLOCKED",
                    statusTimestamp: timestamp,
                  });
                  showFeedback("Account Status updated to Blocked");
                }}
                className={`p-4 rounded-[12px] border flex flex-col items-center justify-center gap-2 transition-all ${
                  displayUser.status === "BLOCKED"
                    ? "bg-red-500 text-white border-red-500 shadow-md shadow-red-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20"
                }`}
              >
                <Ban size={24} />
                <span className="font-bold text-xs uppercase tracking-wider text-center">
                  Blocked
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    const subPages: Record<
      string,
      {
        title: string;
        icon: React.ReactNode;
        color: string;
        content: React.ReactNode;
      }
    > = {
      FULL_PROFILE: {
        title: language === "bn" ? "পার্সোনাল ডিটেলস" : "Personal Details",
        icon: <UserCheck size={20} />,
        color: "text-indigo-500",
        content: (
          <div className="space-y-6 print:space-y-4">
            {/* 1. Personal Information Section Card */}
            <div className="bg-theme-card border border-neutral-100 dark:border-neutral-800/60 rounded-[10px] p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800/50 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goBack()}
                    className="p-1 -ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors print:hidden"
                    title={language === "bn" ? "পিছনে যান" : "Go Back"}
                  >
                    <ChevronLeft
                      size={18}
                      style={{ color: currentThemeObj.primary }}
                    />
                  </button>
                  <h3 className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-widest">
                    Personal Information
                  </h3>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2 print:hidden">
                    <button
                      onClick={() => {
                        setSelectedUser(displayUser);
                        setView("ADMIN_PROFILE_UPDATE");
                      }}
                      className="p-2 rounded-[8px] bg-theme-card border border-neutral-200/50 dark:border-neutral-800/50 text-text-main hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm flex items-center justify-center"
                      title={
                        language === "bn"
                          ? "প্রোফাইল এডিট করুন"
                          : "Edit Profile"
                      }
                    >
                      <Edit
                        size={18}
                        style={{ color: currentThemeObj.primary }}
                      />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        className="p-2 rounded-[8px] bg-theme-card border border-neutral-200/50 dark:border-neutral-800/50 text-text-main hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors shadow-sm flex items-center justify-center"
                      >
                        <Download
                          size={18}
                          style={{ color: currentThemeObj.primary }}
                        />
                      </button>
                      {showDownloadMenu && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-theme-card rounded-[8px] shadow-xl overflow-hidden z-50 border border-neutral-200/50 dark:border-neutral-800/50">
                          <button
                            onClick={handleDownloadPDF}
                            className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5 text-text-main flex items-center gap-2"
                          >
                            <Download
                              size={14}
                              style={{ color: currentThemeObj.primary }}
                            />{" "}
                            PDF Download
                          </button>
                          <button
                            onClick={handlePrint}
                            className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5 text-text-main flex items-center gap-2"
                          >
                            <div className="w-3.5 h-3.5 rounded-[2px] bg-current opacity-20" />{" "}
                            Print
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <InfoItem
                  label="Full Name"
                  value={displayUser.name}
                  className="col-span-2 md:col-span-3 lg:col-span-4"
                />
                <InfoItem label="Date of Birth" value={displayUser.dob} />
                <InfoItem label="Nationality" value={displayUser.nationality} />
                <InfoItem label="Gender" value={displayUser.gender} />
                <InfoItem label="Religion" value={displayUser.religion} />

                {/* Contact Information merged here */}
                <InfoItem
                  label="Email Address"
                  value={displayUser.email}
                  className="col-span-2 md:col-span-2 lg:col-span-2"
                />
                <InfoItem
                  label="Mobile Number"
                  value={formatMobileNumber(displayUser.mobileNumber || displayUser.mobile, displayUser.countryCode)}
                  className="col-span-2 md:col-span-2 lg:col-span-2"
                />

                {/* ID & Documents merged here */}
                <InfoItem label="ID Type" value={displayUser.idType} />
                <InfoItem label="ID Number" value={displayUser.idNumber} />
                <InfoItem
                  label="Issue Country"
                  value={displayUser.idIssueCountry}
                />
                <InfoItem
                  label="Expiry Date"
                  value={displayUser.idExpiryDate}
                />
              </div>
            </div>

            {/* 2. Address Information Section Card */}
            <div className="bg-theme-card border border-neutral-100 dark:border-neutral-800/60 rounded-[10px] p-6 md:p-8 shadow-md hover:shadow-lg transition-shadow duration-200 space-y-5">
              <h3 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest border-b border-neutral-100 dark:border-neutral-800/50 pb-2">
                Address Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <InfoItem label="Country" value={displayUser.presentCountry || displayUser.country} />
                <InfoItem label="State / Region" value={displayUser.state} />
                <InfoItem label="City / Town" value={displayUser.city} />
                <InfoItem label="Postal Code" value={displayUser.postalCode} />
                <InfoItem label="Building No." value={displayUser.buildingNumber || displayUser.building} />
                <InfoItem label="Street No." value={displayUser.streetNumber} />
                <InfoItem label="Zone No." value={displayUser.zoneNumber || displayUser.zone} />
                <InfoItem label="Address" value={displayUser.addressLine1} className="col-span-2 md:col-span-3 lg:col-span-4" />
              </div>
            </div>
          </div>
        ),
      },
      PERSONAL: {
        title: language === "bn" ? "একাউন্ট ডিটেলস" : "Account Details",
        icon: <UserIcon size={20} />,
        color: `text-[${currentThemeObj.primary}]`,
        content: PersonalContent,
      },

      DOCUMENTS: {
        title: "ID & Documents",
        icon: <CreditCard size={20} />,
        color: `text-[${currentThemeObj.primary}]`,
        content: DocumentsContent,
      },
      SUBSCRIPTION: {
        title: "Subscription Details",
        icon: <ShieldCheck size={20} />,
        color: "#10b981",
        content: SubscriptionContent,
      },
      PAYMENT_SUMMARY: {
        title: "Manage Subscription",
        icon: <CreditCard size={20} />,
        color: "#f59e0b",
        content: SubscriptionContent,
      },
      PAYMENTS: {
        title: "Payment Details",
        icon: <Wallet size={20} />,
        color: "#10b981",
        content: PaymentsContent,
      },
      THEME: {
        title: "App Theme",
        icon: <Palette size={20} />,
        color: `text-[${currentThemeObj.primary}]`,
        content: (
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                id: "dark",
                label: "Dark Mode",
                icon: <Sun size={18} />,
                color: "bg-orange-500",
              },
              {
                id: "light",
                label: "Light Mode",
                icon: <Diamond size={18} />,
                color: "bg-cyan-500",
              },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  setAppThemeMode(mode.id as any);
                  showFeedback(`${mode.label} activated`);
                }}
                className={`flex items-center justify-between h-14 px-4 rounded-[8px] transition-all active:scale-[0.98] ${
                  appThemeMode === mode.id
                    ? "bg-cyan-50 dark:bg-cyan-900/20 shadow-sm"
                    : "bg-theme-card hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-[8px] bg-transparent flex items-center justify-center text-primary`}
                  >
                    {mode.icon}
                  </div>
                  <span className="font-black text-xs text-text-main uppercase tracking-tight">
                    {mode.label}
                  </span>
                </div>
                {appThemeMode === mode.id && (
                  <div className="w-5 h-5 rounded-full bg-transparent flex items-center justify-center text-cyan-500">
                    <Check size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
        ),
      },
      ACCOUNT_STATUS: {
        title: language === "bn" ? "একাউন্ট স্ট্যাটাস" : "Account Status",
        icon: <Settings size={20} />,
        color: "#6b7280",
        content: AccountStatusContent,
      },
    };

    if (
      (activeSection === "PAYMENT_SUMMARY" || activeSection === "PAYMENTS") &&
      displayUser.role === "ADMIN"
    )
      return null;
    const active = activeSection && subPages[activeSection];
    if (!active) return null;

    return (
      <div className="flex flex-col gap-4 pb-[60px] print:pb-0 print:bg-white print:static print:h-auto print:overflow-visible w-full mx-auto">
        <div className="print:overflow-visible print:h-auto print:p-0 w-full mx-auto">
          <div
            className={`relative ${activeSection === "SUBSCRIPTION" || activeSection === "PAYMENTS" || activeSection === "FULL_PROFILE" || activeSection === "PAYMENT_SUMMARY" ? "" : "bg-theme-card rounded-[8px] p-3 md:p-6 shadow-sm"} print:p-0`}
          >
            {activeSection !== "SUBSCRIPTION" &&
              activeSection !== "PAYMENTS" &&
              activeSection !== "PAYMENT_SUMMARY" &&
              activeSection !== "FULL_PROFILE" && (
                <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-black/5 dark:border-white/5 print:hidden">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => goBack()}
                      className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <ChevronLeft
                        size={24}
                        style={{ color: currentThemeObj.primary }}
                      />
                    </button>
                    <div
                      className={`p-2 rounded-[8px] bg-transparent`}
                      style={{ color: currentThemeObj.primary }}
                    >
                      {active.icon}
                    </div>
                    <h2 className="text-lg md:text-xl font-black uppercase text-text-main tracking-tight">
                      {active.title}
                    </h2>
                  </div>
                </div>
              )}
            {active.content}
          </div>
        </div>
      </div>
    );
  };

  // Main Profile View
  const subPage = renderSubPage();

  return (
    <>
        {activeSection && subPage ? (
          <div 
            key="subpage"
            className="w-full flex flex-col"
          >
            {subPage}
          </div>
        ) : isAdmin && !isViewingSelf ? (
          <div 
            key="admin_user_view"
            className="w-full mx-auto pb-[60px] space-y-6"
          >
            {/* Top Segmented Tabs */}
            <div className="flex bg-black/[0.04] dark:bg-white/[0.04] p-1 rounded-xl overflow-x-auto no-scrollbar snap-x">
              {["Personal Info", "Subscription Info", "Payment Info", "Login Session", "Account Controls"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAdminViewTab(tab as any)}
                  className={`flex-1 min-w-min whitespace-nowrap snap-center py-2.5 px-4 rounded-[10px] text-xs font-bold transition-colors duration-200 border-0 ${
                    adminViewTab === tab
                      ? "shadow-sm font-extrabold"
                      : "text-text-muted hover:text-text-main hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  }`}
                  style={{
                    backgroundColor: adminViewTab === tab
                      ? (appThemeMode === 'dark' || theme === 'night-mode' ? '#1f2937' : '#ffffff')
                      : 'transparent',
                    color: adminViewTab === tab
                      ? (currentThemeObj.primary || '#10b981')
                      : undefined
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={`space-y-6 ${adminViewTab === "Login Session" ? "md:bg-theme-card md:p-6 md:rounded-[16px] md:border md:border-black/5 md:dark:border-white/5 md:shadow-md" : "bg-theme-card p-5 md:p-6 rounded-[16px] border border-black/5 dark:border-white/5 shadow-md"}`}>
              
              {/* Heading */}
              {adminViewTab !== "Login Session" && (
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.08] dark:border-white/[0.08]">
                  <h2 className="text-lg font-black uppercase tracking-wider text-text-main flex items-center gap-3">
                    {adminViewTab}
                    {adminViewTab !== "Account Controls" && (
                      <button
                        onClick={() => {
                          if (adminViewTab === "Subscription Info") {
                            setIsEditingSubscription(true);
                          } else if (adminViewTab === "Payment Info") {
                            setIsEditingPaymentInfo(true);
                          } else {
                            setSelectedUser(displayUser);
                            setView("ADMIN_PROFILE_UPDATE");
                          }
                        }}
                        className="p-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                        title={language === "bn" ? "এডিট করুন" : "Edit"}
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {adminViewTab === "Personal Info" && (
                      <button
                        onClick={handleDownloadPDF}
                        className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                        title={language === "bn" ? "ডাউনলোড করুন" : "Download"}
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </h2>
                </div>
              )}

              {/* Mapped registration details with horizontal lines above and below each */}
              {adminViewTab !== "Account Controls" && adminViewTab !== "Login Session" && (
                <div className="space-y-[-1px] border-t border-b border-black/[0.08] dark:border-white/[0.08]">
                  {infoFields.filter(f => {
                     const personalInfoKeys = ["fullName", "userId", "nationality", "dob", "gender", "religion", "companyName", "mobileNumber", "idType", "idNumber", "idIssueCountry", "idExpiryDate", "country", "division", "city", "postalCode", "area", "buildingNumber", "streetNumber", "zoneNumber", "addressLine1", "addressLine2"];
                     const subscriptionInfoKeys = ["duration", "package", "packagePrice", "activationDate", "expiryDate", "status"];
                     const paymentInfoKeys = ["accountType"];
                     
                     if (adminViewTab === "Personal Info") return personalInfoKeys.includes(f.key);
                     if (adminViewTab === "Subscription Info") return subscriptionInfoKeys.includes(f.key);
                     if (adminViewTab === "Payment Info") return paymentInfoKeys.includes(f.key);
                     return false;
                  }).map((field) => {
                    const val = field.value !== undefined && field.value !== null && field.value !== "" ? field.value : "--";
                    return (
                      <div 
                        key={field.key} 
                        className="flex items-center justify-between py-4 border-t border-b border-black/[0.08] dark:border-white/[0.08] -mt-[1px] text-xs sm:text-sm font-sans"
                      >
                        <span className="font-semibold text-text-muted select-none">
                          {field.label}
                        </span>
                        <span className="font-black text-text-main text-right break-all ml-4 uppercase whitespace-pre-line">
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {adminViewTab === "Login Session" && (
                <div className="flex flex-col gap-3">
                  {(displayUser.loginHistory || []).slice().reverse().map((h: any, idx: number) => {
                    const isLogin = h.type === 'LOGIN';
                    return (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-8 flex flex-col items-center justify-center rounded-[8px] font-bold text-[10px] tracking-wider border ${
                            isLogin 
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                          }`}>
                             {h.type}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-text-main uppercase tracking-wider">{displayUser.name || displayUser.fullName || displayUser.id}</span>
                             <span className="text-xs font-semibold text-text-muted mt-0.5">{h.date} - {h.time}</span>
                          </div>
                        </div>
                        {(h.type === 'LOGOUT' || h.type === 'LOGIN') && (
                          <button
                            onClick={() => setSessionPopupData(h)}
                            className="p-2.5 bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {(!displayUser.loginHistory || displayUser.loginHistory.length === 0) && (
                     <div className="text-center py-6 text-text-muted text-sm font-medium">No session history available</div>
                  )}
                </div>
              )}

              {/* Account Controls Section for Admin */}
              {adminViewTab === "Account Controls" && (
                <div className="mt-4 flex flex-col gap-6">
                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowResetPassword(true)}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-[12px] bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors font-bold text-sm"
                    >
                      <Lock size={14} />
                      {language === "bn" ? "পাসওয়ার্ড রিসেট" : "Reset Password"}
                    </button>
                    
                    <button
                      onClick={() => setIsEditingSubscription(true)}
                      className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-[12px] bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-colors font-bold text-sm"
                    >
                      <CreditCard size={14} />
                      {language === "bn" ? "সাবস্ক্রিপশন এডিট" : "Edit Subscription"}
                    </button>
                  </div>

                  {/* Status selection */}
                  <div className="space-y-2 pt-2 border-t border-black/5 dark:border-white/5">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest block select-none">
                      {language === "bn" ? "ইউজার স্ট্যাটাস পরিবর্তন করুন" : "Change User Status"}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* Active */}
                      <button
                        onClick={() => {
                          if (displayUser.status === "ENABLED") return;
                          confirmAction(
                            language === "bn" 
                              ? `আপনি কি নিশ্চিত যে আপনি এই ইউজারের স্ট্যাটাস "সক্রিয়" করতে চান?` 
                              : `Are you sure you want to change status to Active?`,
                            () => {
                              const timestamp = new Date().toLocaleString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              });
                              updateUser({
                                ...displayUser,
                                status: "ENABLED",
                                userId: displayUser.userId || Math.floor(10000000 + Math.random() * 90000000).toString(),
                                permissions: displayUser.permissions || ["TRIPS", "MONTHLY_FILES"],
                                statusTimestamp: timestamp,
                              });
                              showFeedback(language === "bn" ? "অ্যাকাউন্ট সক্রিয় করা হয়েছে" : "Account Status updated to Active");
                            },
                            {
                              title: language === "bn" ? "স্ট্যাটাস পরিবর্তন" : "Change Status",
                              confirmText: language === "bn" ? "হ্যাঁ" : "Yes",
                              cancelText: language === "bn" ? "না" : "No"
                            }
                          );
                        }}
                        className={`relative py-3 px-2 rounded-[10px] border flex flex-col items-center justify-center gap-1 transition-all overflow-visible ${
                          displayUser.status === "ENABLED"
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-[#1e293b]"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/20 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                        }`}
                      >
                        {displayUser.status === "ENABLED" && (
                          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#1e293b]">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                        <CheckCircle2 size={16} />
                        <span className="font-bold text-[10px] uppercase tracking-wider">{language === "bn" ? "সক্রিয়" : "Active"}</span>
                      </button>

                      {/* Pending */}
                      <button
                        onClick={() => {
                          if (displayUser.status === "PENDING") return;
                          confirmAction(
                            language === "bn" 
                              ? `আপনি কি নিশ্চিত যে আপনি এই ইউজারের স্ট্যাটাস "পেন্ডিং" করতে চান?` 
                              : `Are you sure you want to change status to Pending?`,
                            () => {
                              const timestamp = new Date().toLocaleString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              });
                              updateUser({
                                ...displayUser,
                                status: "PENDING",
                                statusTimestamp: timestamp,
                              });
                              showFeedback(language === "bn" ? "অ্যাকাউন্ট পেন্ডিং করা হয়েছে" : "Account Status updated to Pending");
                            },
                            {
                              title: language === "bn" ? "স্ট্যাটাস পরিবর্তন" : "Change Status",
                              confirmText: language === "bn" ? "হ্যাঁ" : "Yes",
                              cancelText: language === "bn" ? "না" : "No"
                            }
                          );
                        }}
                        className={`relative py-3 px-2 rounded-[10px] border flex flex-col items-center justify-center gap-1 transition-all overflow-visible ${
                          displayUser.status === "PENDING"
                            ? "bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-[#1e293b]"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/10 hover:bg-amber-500/20 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                        }`}
                      >
                        {displayUser.status === "PENDING" && (
                          <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#1e293b]">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                        <Clock size={16} />
                        <span className="font-bold text-[10px] uppercase tracking-wider">{language === "bn" ? "পেন্ডিং" : "Pending"}</span>
                      </button>

                      {/* Disabled */}
                      <button
                        onClick={() => {
                          if (displayUser.status === "DISABLED") return;
                          confirmAction(
                            language === "bn" 
                              ? `আপনি কি নিশ্চিত যে আপনি এই ইউজারের স্ট্যাটাস "নিষ্ক্রিয়" করতে চান?` 
                              : `Are you sure you want to change status to Disabled?`,
                            () => {
                              const timestamp = new Date().toLocaleString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              });
                              updateUser({
                                ...displayUser,
                                status: "DISABLED",
                                statusTimestamp: timestamp,
                              });
                              showFeedback(language === "bn" ? "অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে" : "Account Status updated to Disabled");
                            },
                            {
                              title: language === "bn" ? "স্ট্যাটাস পরিবর্তন" : "Change Status",
                              confirmText: language === "bn" ? "হ্যাঁ" : "Yes",
                              cancelText: language === "bn" ? "না" : "No"
                            }
                          );
                        }}
                        className={`relative py-3 px-2 rounded-[10px] border flex flex-col items-center justify-center gap-1 transition-all overflow-visible ${
                          displayUser.status === "DISABLED"
                            ? "bg-gray-500 text-white border-gray-500 shadow-md ring-2 ring-gray-500 ring-offset-2 dark:ring-offset-[#1e293b]"
                            : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/10 hover:bg-gray-500/20 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                        }`}
                      >
                        {displayUser.status === "DISABLED" && (
                          <div className="absolute -top-2 -right-2 bg-gray-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#1e293b]">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                        <UserX size={16} />
                        <span className="font-bold text-[10px] uppercase tracking-wider">{language === "bn" ? "নিষ্ক্রিয়" : "Disabled"}</span>
                      </button>

                      {/* Blocked */}
                      <button
                        onClick={() => {
                          if (displayUser.status === "BLOCKED") return;
                          confirmAction(
                            language === "bn" 
                              ? `আপনি কি নিশ্চিত যে আপনি এই ইউজারের স্ট্যাটাস "ব্লক" করতে চান?` 
                              : `Are you sure you want to change status to Blocked?`,
                            () => {
                              const timestamp = new Date().toLocaleString("en-US", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              });
                              updateUser({
                                ...displayUser,
                                status: "BLOCKED",
                                statusTimestamp: timestamp,
                              });
                              showFeedback(language === "bn" ? "অ্যাকাউন্ট ব্লক করা হয়েছে" : "Account Status updated to Blocked");
                            },
                            {
                              title: language === "bn" ? "স্ট্যাটাস পরিবর্তন" : "Change Status",
                              confirmText: language === "bn" ? "হ্যাঁ" : "Yes",
                              cancelText: language === "bn" ? "না" : "No"
                            }
                          );
                        }}
                        className={`relative py-3 px-2 rounded-[10px] border flex flex-col items-center justify-center gap-1 transition-all overflow-visible ${
                          displayUser.status === "BLOCKED"
                            ? "bg-red-500 text-white border-red-500 shadow-md ring-2 ring-red-500 ring-offset-2 dark:ring-offset-[#1e293b]"
                            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/10 hover:bg-red-500/20 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                        }`}
                      >
                        {displayUser.status === "BLOCKED" && (
                          <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#1e293b]">
                            <Check size={12} strokeWidth={4} />
                          </div>
                        )}
                        <UserX size={16} />
                        <span className="font-bold text-[10px] uppercase tracking-wider">{language === "bn" ? "ব্লকড" : "Blocked"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div 
            key="main"
            className="w-full mx-auto pb-[60px] space-y-6"
          >
            {/* Profile Card */}
            <div
              className={`rounded-[12px] shadow-lg border relative overflow-hidden flex flex-col justify-between ${showBlockOptions || showStatusOptions ? "z-30" : "z-10"} ${
                displayUser.role?.toUpperCase() === "ADMIN" ? "pt-4 px-4 pb-3.5 md:pt-5 md:px-6 md:pb-4 min-h-[210px] md:min-h-[240px]" : "p-3 md:p-4"
              }`}
        style={{
          background: "linear-gradient(to bottom right, #ffffff, #f0f9ff)",
          borderColor: "#bae6fd",
        }}
      >
        {/* Decorative Background Elements */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"
          style={{ backgroundColor: "rgba(6, 182, 212, 0.1)" }}
        ></div>
        <div
          className="absolute bottom-0 left-0 w-40 h-40 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"
          style={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
        ></div>

        {/* New Profile Card Layout */}
        <div className="relative z-10 w-full flex flex-col items-center mb-3">
          <h2
            className="text-center font-extrabold text-[15px] md:text-[17px] tracking-widest uppercase"
            style={{ color: "#105f77" }}
          >
            {displayUser.role?.toUpperCase() === "ADMIN" ? "ADMIN ID CARD" : "USER ID CARD"}
          </h2>
          <div
            className="h-[3px] w-[80%] mt-1 opacity-80"
            style={{
              background:
                "linear-gradient(to right, transparent, #105f77, transparent)",
            }}
          ></div>
        </div>

        <div className="flex justify-between items-start gap-4 w-full relative z-10">
          {/* Info Details List */}
          <div className={`flex-1 ${displayUser.role?.toUpperCase() === "ADMIN" ? "space-y-3" : "space-y-1"} mt-0 relative z-10 w-[calc(100%-110px)]`}>
            {(displayUser.role?.toUpperCase() === "ADMIN" ? [
              { label: "Nationality", value: displayUser.nationality },
              { label: "ID Number", value: displayUser.idNumber },
              { label: "Mobile Number", value: displayUser.mobileNumber },
              { label: "Role", value: "Admin" },
            ] : [
              { label: language === "bn" ? "পূর্ণ নাম" : "Full Name", value: displayUser.name },
              { label: language === "bn" ? "জন্ম তারিখ" : "Date of birth", value: displayUser.dob },
              { label: language === "bn" ? "জাতীয়তা" : "Nationality", value: displayUser.nationality },
              { label: language === "bn" ? "আইডি নাম্বার" : "ID Numbers", value: displayUser.idNumber },
              { label: language === "bn" ? "মোবাইল নাম্বার" : "Mobile Number", value: displayUser.mobileNumber },
              { label: language === "bn" ? "পেশা" : "Profession", value: displayUser.profession },
            ]).map((item, idx) => (
              <div
                key={item.label}
                className="flex text-[12px] font-sans"
              >
                <span
                  className="w-[95px] md:w-[110px] whitespace-nowrap font-normal leading-tight shrink-0"
                  style={{ color: "#4b5563" }}
                >
                  {item.label}
                </span>
                <span
                  className="mx-1 font-normal leading-tight"
                  style={{ color: "#4b5563" }}
                >
                  :
                </span>
                <span
                  className="flex-1 font-normal truncate leading-tight uppercase"
                  style={{ color: '#000000' }}
                >
                  {item.value || ""}
                </span>
              </div>
            ))}
          </div>

          {/* Photo Frame */}
          <div className="flex flex-col items-center gap-3 shrink-0 absolute right-0 top-0 z-20">
            <div
              className="relative w-[85px] h-[95px] md:w-[100px] md:h-[110px] rounded-[4px] border-[1.5px] flex items-center justify-center cursor-pointer group transition-none"
              style={{ backgroundColor: "#ffffff", borderColor: "#e5e7eb" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="absolute inset-1 border-[1.5px] border-solid rounded-[2px] pointer-events-none transition-none"
                style={{ borderColor: "#f3f4f6" }}
              />
              {displayUser.avatar ? (
                <img
                  src={displayUser.avatar}
                  alt={displayUser.name}
                  className="w-[calc(100%-8px)] h-[calc(100%-8px)] rounded-[2px] object-cover transition-none"
                />
              ) : (
                <span
                  className="text-[13px] md:text-base font-normal transition-colors group-hover:text-primary z-10 px-1"
                  style={{ color: "#6b7280", backgroundColor: "#ffffff" }}
                >
                  Photos
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-[4px] flex items-center justify-center z-20">
                <Camera size={24} className="text-white" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Thick Divider Line */}
        <div
          className={`w-full h-[3px] md:h-[4px] rounded-full opacity-90 relative z-10 ${
            displayUser.role?.toUpperCase() === "ADMIN" ? "mt-2 md:mt-2.5 mb-1.5" : "mt-3 mb-2"
          }`}
          style={{
            background: "linear-gradient(to right, #105f77, #0891b2, #105f77)",
          }}
        />

        {/* Sponsor Name / Footer line */}
        <div className={`flex text-[12px] font-sans pb-0 items-start font-normal relative z-10 w-full ${
          displayUser.role?.toUpperCase() === "ADMIN" ? "mt-0.5 mb-0.5" : ""
        }`}>
          <span
            className="w-[85px] sm:w-[100px] md:w-[130px] shrink-0 leading-[1.2]"
            style={{ color: "#105f77" }}
          >
            {displayUser.role?.toUpperCase() === "ADMIN" ? "Admin Name" : "Sponsor Name"}
          </span>
          <span
            className="mx-1 leading-[1.2]"
            style={{ color: "#105f77" }}
          >
            :
          </span>
          <span
            className="flex-1 uppercase break-words whitespace-normal leading-[1.2]"
            style={{ color: '#000000' }}
          >
            {displayUser.role?.toUpperCase() === "ADMIN"
              ? (displayUser.name || "")
              : (displayUser.companyName || "AL SAWAID AL QATARI TRANSPORT")}
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MenuItem
          icon={<Eye />}
          title={language === "bn" ? "পার্সোনাল ডিটেলস" : "Personal Details"}
          subtitle={language === "bn" ? "আপনার ব্যক্তিগত প্রোফাইল তথ্য দেখুন" : "View your personal profile information"}
          onClick={() => setActiveSection("FULL_PROFILE")}
          color="#8b5cf6"
        />
        <MenuItem
          icon={<UserIcon />}
          title={language === "bn" ? "একাউন্ট ডিটেলস" : "Account Details"}
          subtitle={language === "bn" ? "আপনার লগইন ইমেইল, ইউজার আইডি ও একাউন্টের তথ্য দেখুন" : "View your login email, user ID, and account info"}
          onClick={() => setActiveSection("PERSONAL")}
          color="#06b6d4"
        />

        {displayUser.role === "USER" && (
          <>
            <MenuItem
              icon={<Wallet />}
              title={language === "bn" ? "পেমেন্ট ডিটেলস" : "Payment Details"}
              subtitle={language === "bn" ? "আপনার সাবস্ক্রিপশন পেমেন্ট দেখুন" : "View your subscription payments"}
              onClick={() => setActiveSection("PAYMENTS")}
              color="#10b981"
            />
            {!isAdmin && (
              <MenuItem
                icon={<ShieldCheck />}
                title={
                  language === "bn"
                    ? "সাবস্ক্রিপশন ডিটেলস"
                    : "Subscription Details"
                }
                subtitle={language === "bn" ? "প্ল্যানের মেয়াদ এবং সক্রিয় সময়কাল দেখুন" : "View plan validity and active period"}
                onClick={() => setActiveSection("SUBSCRIPTION")}
                color="#14b8a6"
              />
            )}
          </>
        )}

        {isAdmin && displayUser.role !== "ADMIN" && (
          <MenuItem
            icon={<CreditCard />}
            title="Manage Subscription"
            subtitle={language === "bn" ? "ব্যবহারকারীর সাবস্ক্রিপশন প্ল্যান ও অনুমোদন দেখুন" : "Review and approve user plans"}
            onClick={() => setActiveSection("PAYMENT_SUMMARY")}
            color="#f59e0b"
          />
        )}
        {isAdmin && !isViewingSelf && (
          <MenuItem
            icon={<Settings />}
            title={language === "bn" ? "একাউন্ট স্ট্যাটাস" : "Account Status"}
            subtitle={language === "bn" ? "ব্যবহারকারীর রোল এবং স্ট্যাটাস পরিবর্তন করুন" : "Modify user role and state"}
            onClick={() => setActiveSection("ACCOUNT_STATUS")}
            color="#6b7280"
          />
        )}
        {isViewingSelf && (
          <MenuItem
            icon={<LogOut />}
            title={t.LOGOUT}
            subtitle={language === "bn" ? "আপনার অ্যাকাউন্ট থেকে নিরাপদে সাইন আউট করুন" : "Sign out of your account securely"}
            onClick={handleLogout}
            color="#ef4444"
          />
        )}
        </div>
          </div>
        )}

      <GlobalFullscreenSelect
        isOpen={subSelectModal.isOpen}
        onClose={() =>
          setSubSelectModal((prev) => ({ ...prev, isOpen: false }))
        }
        onSelect={handleSubSelectModalChange}
        options={subSelectModal.options}
        title={subSelectModal.label}
        selectedValue={
          subscriptionForm[
            subSelectModal.name as keyof typeof subscriptionForm
          ] as string
        }
      />
      {ResetPasswordModal}
      {EditPaymentModal}
      {/* Edit Payment Info Modal */}
      {createPortal(
        <>
          {isEditingPaymentInfo && (
            <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center p-4">
              <div
                
                
                
                onClick={() => setIsEditingPaymentInfo(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <div
                
                
                
                
                className="relative bg-theme-card border border-black/5 dark:border-white/5 w-full max-w-sm rounded-[16px] shadow-2xl overflow-hidden z-10"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Wallet
                      size={24}
                      style={{ color: currentThemeObj.primary }}
                    />
                    <h3 className="text-lg font-black uppercase text-text-main">
                      {language === "bn" ? "পেমেন্ট এডিট" : "Edit Payment Info"}
                    </h3>
                  </div>

                  <div className="space-y-4 pt-2">
                    <InputField
                      label={language === "bn" ? "অ্যাকাউন্টের ধরন" : "Account Type"}
                      name="accountType"
                      type="select"
                      value={paymentForm.accountType}
                      options={[
                        { label: "Transport Account", value: "Transport Account" },
                        { label: "Personal Account", value: "Personal Account" },
                        { label: "Company Account", value: "Company Account" },
                      ]}
                      onOpenModal={(name, label, options) => handleOpenSubSelectModal(name, label, options, "payment")}
                      icon={<Briefcase size={16} />}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsEditingPaymentInfo(false)}
                      className="flex-1 h-12 rounded-[12px] bg-gray-100 dark:bg-white/5 font-black uppercase text-xs text-text-main hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                      {language === "bn" ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      onClick={() => {
                        updateUser({
                          ...displayUser,
                          accountType: paymentForm.accountType,
                        });
                        setIsEditingPaymentInfo(false);
                        showFeedback(
                          language === "bn"
                            ? "পেমেন্ট ইনফো আপডেট হয়েছে"
                            : "Payment info updated successfully"
                        );
                      }}
                      className="flex-1 h-12 rounded-[12px] bg-blue-500 font-black uppercase text-xs text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                    >
                      {language === "bn" ? "সংরক্ষণ" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* Session Details Popup */}
      {createPortal(
        <>
          {sessionPopupData && (
            <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-theme-card w-full max-w-sm rounded-[24px] p-6 shadow-2xl relative">
                <button
                  onClick={() => setSessionPopupData(null)}
                  className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-main bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <h3 className="text-xl font-black text-text-main mb-6 uppercase tracking-wider">
                  {language === 'bn' ? 'সেশন ডিটেইলস' : 'Session Details'}
                </h3>
                <div className="space-y-4">
                    {(() => {
                      if (sessionPopupData.type === 'LOGIN') {
                        return (
                          <div className="flex flex-col gap-3 text-sm">
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'লগইন তারিখ ও সময়' : 'Login Date & Time'}</span>
                                <span className="text-text-main font-semibold">{sessionPopupData.date} {sessionPopupData.time}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'লগইন স্থান' : 'Login Location'}</span>
                                <span className="text-text-main font-semibold">{sessionPopupData.location || 'Unavailable'}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'দেশ' : 'Country'}</span>
                                <span className="text-text-main font-semibold">{sessionPopupData.country || 'Unavailable'}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'আইপি অ্যাড্রেস' : 'IP Address'}</span>
                                <span className="text-text-main font-semibold">{sessionPopupData.ip || 'Unavailable'}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'ডিভাইস তথ্য' : 'Device Information'}</span>
                                <span className="text-text-main font-semibold text-right max-w-[150px] truncate" title={sessionPopupData.device || 'Unavailable'}>{sessionPopupData.device || 'Unavailable'}</span>
                             </div>
                          </div>
                        );
                      } else {
                        const history = displayUser.loginHistory || [];
                        const logoutIdx = history.indexOf(sessionPopupData);
                        let loginEvent = null;
                        if (logoutIdx !== -1) {
                          for (let i = logoutIdx - 1; i >= 0; i--) {
                            if (history[i].type === 'LOGIN') {
                              loginEvent = history[i];
                              break;
                            }
                          }
                        }
                        const loginLoc = sessionPopupData.loginLocation || loginEvent?.location || sessionPopupData.location || (displayUser.city ? `${displayUser.city}, ${displayUser.country || 'Bangladesh'}` : 'Dhaka, Bangladesh');

                        return (
                          <div className="flex flex-col gap-3 text-sm">
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'লগআউট তারিখ ও সময়' : 'Logout Date & Time'}</span>
                                <span className="text-text-main font-semibold">{sessionPopupData.date} {sessionPopupData.time}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'লগইন স্থান' : 'Login Location'}</span>
                                <span className="text-text-main font-semibold">{loginLoc}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'দেশ' : 'Country'}</span>
                                <span className="text-text-main font-semibold">{sessionPopupData.country || 'Unavailable'}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'আইপি অ্যাড্রেস' : 'IP Address'}</span>
                                <span className="text-text-main font-semibold">{sessionPopupData.ip || 'Unavailable'}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'ডিভাইস তথ্য' : 'Device Information'}</span>
                                <span className="text-text-main font-semibold text-right max-w-[150px] truncate" title={sessionPopupData.device || 'Unavailable'}>{sessionPopupData.device || 'Unavailable'}</span>
                             </div>
                             <div className="flex justify-between border-b border-black/5 dark:border-white/5 pb-2">
                                <span className="text-text-muted font-bold">{language === 'bn' ? 'সেশন সময়কাল' : 'Session Duration'}</span>
                                <span className="text-text-main font-semibold">{sessionPopupData.sessionDuration || '--'}</span>
                             </div>
                          </div>
                        );
                      }
                    })()}
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* Edit Login Session Modal */}
      {createPortal(
        <>
          {isEditingLoginInfo && (
            <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center p-4">
              <div
                
                
                
                onClick={() => setIsEditingLoginInfo(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <div
                
                
                
                
                className="relative bg-theme-card border border-black/5 dark:border-white/5 w-full max-w-sm rounded-[16px] shadow-2xl overflow-hidden z-10"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-blue-600">
                    <Lock
                      size={24}
                      style={{ color: currentThemeObj.primary }}
                    />
                    <h3 className="text-lg font-black uppercase text-text-main">
                      {language === "bn" ? "লগইন সেশন এডিট" : "Edit Login Session"}
                    </h3>
                  </div>

                  <div className="space-y-4 pt-2">
                    <InputField
                      label={language === "bn" ? "লগইন ইমেল" : "Login Email"}
                      name="loginEmail"
                      type="email"
                      value={loginForm.loginEmail}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, loginEmail: e.target.value }))}
                      icon={<UserIcon size={16} />}
                    />
                    <InputField
                      label={language === "bn" ? "মোবাইল নম্বর" : "Mobile Number"}
                      name="mobileNumber"
                      type="text"
                      value={loginForm.mobileNumber}
                      onChange={(e) => setLoginForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                      icon={<LifeBuoy size={16} />}
                    />
                    <InputField
                      label={language === "bn" ? "রোল" : "Role"}
                      name="role"
                      type="select"
                      value={loginForm.role}
                      options={[
                        { label: "USER", value: "USER" },
                        { label: "ADMIN", value: "ADMIN" },
                        { label: "MANAGER", value: "MANAGER" },
                      ]}
                      onOpenModal={(name, label, options) => handleOpenSubSelectModal(name, label, options, "login")}
                      icon={<Shield size={16} />}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsEditingLoginInfo(false)}
                      className="flex-1 h-12 rounded-[12px] bg-gray-100 dark:bg-white/5 font-black uppercase text-xs text-text-main hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                      {language === "bn" ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      onClick={() => {
                        updateUser({
                          ...displayUser,
                          loginEmail: loginForm.loginEmail,
                          mobileNumber: loginForm.mobileNumber,
                          role: loginForm.role,
                        });
                        setIsEditingLoginInfo(false);
                        showFeedback(
                          language === "bn"
                            ? "লগইন ইনফো আপডেট হয়েছে"
                            : "Login info updated successfully"
                        );
                      }}
                      className="flex-1 h-12 rounded-[12px] bg-blue-500 font-black uppercase text-xs text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                    >
                      {language === "bn" ? "সংরক্ষণ" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}

      {/* Edit Subscription Modal for Admin page */}
      {createPortal(
        <>
          {isEditingSubscription && (
            <div className="fixed inset-0 z-[5000] flex flex-col items-center justify-center p-4">
              <div
                
                
                
                onClick={() => setIsEditingSubscription(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <div
                
                
                
                
                className="relative bg-theme-card border border-black/5 dark:border-white/5 w-full max-w-sm rounded-[16px] shadow-2xl overflow-hidden z-10"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-blue-600">
                    <CreditCard
                      size={24}
                      style={{ color: currentThemeObj.primary }}
                    />
                    <h3 className="text-lg font-black text-text-main">
                      {language === "bn"
                        ? "সাবস্ক্রিপশন এডিট"
                        : "Edit Subscription"}
                    </h3>
                  </div>

                  <div className="space-y-4 pt-2">
                    <InputField
                      label="Plan Duration"
                      name="duration"
                      type="select"
                      value={subscriptionForm.duration}
                      options={[
                        { label: "1 Month", value: "1 MONTH" },
                        { label: "3 Months", value: "3 MONTHS" },
                        { label: "6 Months", value: "6 MONTHS" },
                        { label: "1 Year", value: "12 MONTHS" },
                        { label: "Lifetime", value: "LIFETIME" },
                      ]}
                      onOpenModal={handleOpenSubSelectModal}
                      icon={<Clock size={16} />}
                    />
                    <InputField
                      label="Package Name"
                      name="package"
                      type="select"
                      value={subscriptionForm.package}
                      options={[
                        { label: "Basic", value: "Basic" },
                        { label: "Standard", value: "Standard" },
                        { label: "Premium", value: "Premium" },
                        { label: "Pro", value: "Pro" },
                        { label: "VIP", value: "VIP" },
                        { label: "Custom", value: "Custom" },
                      ]}
                      onOpenModal={handleOpenSubSelectModal}
                      icon={<FileText size={16} />}
                    />
                    <InputField
                      label="Package Price"
                      name="packagePrice"
                      type="number"
                      value={subscriptionForm.packagePrice}
                      onChange={(e) =>
                        setSubscriptionForm((prev) => ({
                          ...prev,
                          packagePrice: e.target.value,
                        }))
                      }
                      icon={<CreditCard size={16} />}
                    />
                    <InputField
                      label="Activation Date"
                      name="activationDate"
                      type="date"
                      value={subscriptionForm.activationDate}
                      onChange={(e) =>
                        setSubscriptionForm((prev) => ({
                          ...prev,
                          activationDate: e.target.value,
                        }))
                      }
                      icon={<Calendar size={16} />}
                    />
                    <InputField
                      label="Expiry Date"
                      name="expiryDate"
                      type="date"
                      value={subscriptionForm.expiryDate}
                      onChange={(e) =>
                        setSubscriptionForm((prev) => ({
                          ...prev,
                          expiryDate: e.target.value,
                        }))
                      }
                      icon={<Calendar size={16} />}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setIsEditingSubscription(false)}
                      className="flex-1 h-12 rounded-[12px] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-black uppercase text-xs hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      {language === "bn" ? "বাতিল" : "Cancel"}
                    </button>
                    <button
                      onClick={() => {
                        updateUser({
                          ...displayUser,
                          activationDate: subscriptionForm.activationDate,
                          duration: subscriptionForm.duration,
                          package: subscriptionForm.package,
                          packagePrice: parseFloat(subscriptionForm.packagePrice) || 0,
                          price: subscriptionForm.packagePrice,
                          expiryDate: subscriptionForm.expiryDate,
                        });
                        setIsEditingSubscription(false);
                        showFeedback(
                          language === "bn"
                            ? "সাবস্ক্রিপশন সফলভাবে আপডেট হয়েছে"
                            : "Subscription updated successfully"
                        );
                      }}
                      className="flex-1 h-12 rounded-[12px] bg-blue-500 font-black uppercase text-xs text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors"
                    >
                      {language === "bn" ? "আপডেট" : "Update"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body,
      )}
    </>
  );
};

export default UserProfile;
