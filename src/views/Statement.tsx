import React, { useState, useEffect } from "react";
import { useStore } from "../store";

import {
  FileText,
  Download,
  Calendar,
  ArrowLeft,
  Search,
  Check,
  AlertCircle,
  X,
  Clock,
  CreditCard,
  ChevronLeft,
} from "lucide-react";
import { TRANSLATIONS } from "../constants";
import { downloadPdf } from '../utils/fileUtils';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { subscribeFirebaseCollection } from "../services/firebase";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { FileOpener } from "@capacitor-community/file-opener";
import { Capacitor } from "@capacitor/core";
import { PaymentManager } from "../services/PaymentManager";
import GlobalDateTimePicker from "../components/GlobalDateTimePicker";

const Statement: React.FC = () => {
  const { showFeedback,
    user,
    payments,
    trips,
    monthlyFiles,
    users,
    language,
    setView,
    currencies,
    selectedCurrency,
  } = useStore();
  const currency = currencies?.find(
    (c: any) => c.code === selectedCurrency,
  ) || { code: "BDT", symbol: "৳" };
  const t = TRANSLATIONS[language];
  const isAdmin = user?.role === "ADMIN";

  // State
  const [selectedType, setSelectedType] = useState<string>("TRIP");
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "PAYMENT">("PAYMENT");
  const [dateRangePreset, setDateRangePreset] = useState<string>("CUSTOM");
  const [fromDate, setFromDate] = useState<string>(() => {
    const today = new Date();
    // Default to 1st day of current month
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  
  const handleDateRangePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    const today = new Date();
    if (preset === "1_MONTH") {
      const past = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      setFromDate(past.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);
    } else if (preset === "3_MONTHS") {
      const past = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
      setFromDate(past.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);
    } else if (preset === "6_MONTHS") {
      const past = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
      setFromDate(past.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);
    } else if (preset === "1_YEAR") {
      const past = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      setFromDate(past.toISOString().split("T")[0]);
      setToDate(today.toISOString().split("T")[0]);
    }
  };
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [datePickerConfig, setDatePickerConfig] = useState<{
    open: boolean;
    type: 'from' | 'to';
    value: string;
    title: string;
  }>({
    open: false,
    type: 'from',
    value: '',
    title: '',
  });

  const [isColumnSelectModalOpen, setIsColumnSelectModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<
    { id: string; label: string; mandatory: boolean }[]
  >([]);

  // Real-time payments from all users for User Renew Statement
  const [allRenewPayments, setAllRenewPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribes: (() => void)[] = [];
    const paymentsByUser: Record<string, any[]> = {};

    const handleUpdate = () => {
      const mergedPayments: any[] = [];
      Object.values(paymentsByUser).forEach((list) => {
        mergedPayments.push(...list);
      });
      // Filter only renewal payments
      const renewals = mergedPayments.filter(
        (p) =>
          p.category?.toUpperCase() === "USER RENEW" ||
          (p.category || "").toLowerCase().includes("renew"),
      );
      // Sort payments descending by date
      renewals.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setAllRenewPayments(renewals);
    };

    // Subscriptions for all users under "users/{id}/payments"
    users.forEach((u) => {
      if (u.role === "ADMIN") return;
      const path = `users/${u.id}/payments`;
      try {
        const unsub = subscribeFirebaseCollection(path, (data) => {
          paymentsByUser[u.id] = data;
          handleUpdate();
        });
        unsubscribes.push(unsub);
      } catch (err) {
        console.error("Error subscribing to payments of user", u.id, err);
      }
    });

    // Also include payments from admin's path if any
    if (user && user.id) {
      const path = `admins/${user.id}/payments`;
      try {
        const unsub = subscribeFirebaseCollection(path, (data) => {
          paymentsByUser[user.id] = data;
          handleUpdate();
        });
        unsubscribes.push(unsub);
      } catch (err) {
        console.error("Error subscribing to admin payments", err);
      }
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [users, user, isAdmin]);

  // Translate statement types for display
  const statementTypes = [
    {
      id: "TRIP",
      label: language === "bn" ? "ট্রিপ স্টেটমেন্ট" : "Trip Statement",
    },
    {
      id: "SALARY_ONLY",
      label: language === "bn" ? "শুধু স্যালারি (Only Salary)" : "Only Salary",
    },
    {
      id: "SALARY_COMMISSION",
      label:
        language === "bn"
          ? "স্যালারি এবং কমিশন (Salary & Commission)"
          : "Salary & Commission",
    },
    {
      id: "COMMISSION",
      label: language === "bn" ? "কমিশন স্টেটমেন্ট" : "Commission Statement",
    },
    {
      id: "DIESEL",
      label: language === "bn" ? "ডিজেল স্টেটমেন্ট" : "Diesel Statement",
    },
    {
      id: "GENERATOR_DIESEL",
      label:
        language === "bn"
          ? "জেনারেটর ডিজেল স্টেটমেন্ট"
          : "Generator Diesel Statement",
    },
    ...(isAdmin
      ? [
          {
            id: "USER_RENEW",
            label:
              language === "bn"
                ? "ইউজার রিনিউ স্টেটমেন্ট"
                : "User Renew Statement",
          },
        ]
      : []),
  ];

  // Formatting helpers
  const formatNum = (num: number) => {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 }).format(
      num,
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const monthNames = [
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
    const year = d.getFullYear();
    return `${day} ${monthNames[d.getMonth()]} ${year}`;
  };

  const start = fromDate ? new Date(fromDate) : null;
  const end = toDate ? new Date(toDate) : null;
  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(23, 59, 59, 999);

  const getIsInRange = (dateStr: string | undefined | null) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return true;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  };

  // Extract statement data
  const getStatementData = () => {
    let rows: any[] = [];

    if (selectedType === "TRIP") {
      const matched = (trips || []).filter((t) => getIsInRange(t.loadingDate));
      rows = matched.map((t) => {
        let t_dieselPaid = 0;
        let t_generatorDieselPaid = 0;
        let t_commissionPaid = 0;
        let t_extraDieselPaid = 0;
        let t_fridayPaid = 0;
        let t_bonusPaid = 0;
        let t_overtimePaid = 0;

        (payments || []).filter(p => p.status === 'RECEIVED').forEach(p => {
          if (!p.details?.pendingItems) return;
          const items = p.details.pendingItems;
          const cat = p.category?.toUpperCase() || '';
          
          Object.keys(items).forEach(key => {
            const val = Number(items[key]) || 0;
            if (key === `${t.id}-dieselPrice`) { t_dieselPaid += val; }
            else if (key === `${t.id}-generatorDiesel`) { t_generatorDieselPaid += val; }
            else if (key === `${t.id}-commission`) { t_commissionPaid += val; }
            else if (key === `${t.id}-extraDiesel`) { t_extraDieselPaid += val; }
            else if (key === `${t.id}-friday`) { t_fridayPaid += val; }
            else if (key === `${t.id}-bonus`) { t_bonusPaid += val; }
            else if (key === `${t.id}-overtime`) { t_overtimePaid += val; }
            else if (key === t.id) {
              if (cat === 'TRIP DIESEL') {
                if (t.dieselPrice) t_dieselPaid += val;
              }
              else if (cat === 'COMMISSION') t_commissionPaid += val;
              else if (cat === 'FRIDAY') t_fridayPaid += val;
              else if (cat === 'BONUS') t_bonusPaid += val;
              else if (cat === 'OVERTIME') t_overtimePaid += val;
            } else if (key.startsWith(`AGG-`)) {
              if (key.startsWith(`AGG-dieselPrice-${t.fileId}-`)) t_dieselPaid += (Number(t.dieselPrice) || 0);
              else if (key.startsWith(`AGG-generatorDiesel-${t.fileId}-`)) t_generatorDieselPaid += (Number(t.generatorDiesel) || 0);
              else if (key.startsWith(`AGG-commission-${t.fileId}-`)) t_commissionPaid += (Number(t.commission) || 0);
              else if (key.startsWith(`AGG-extraDiesel-${t.fileId}-`)) t_extraDieselPaid += (Number(t.extraDiesel) || 0);
              else if (key.startsWith(`AGG-friday-${t.fileId}-`)) t_fridayPaid += (Number(t.friday) || 0);
              else if (key.startsWith(`AGG-bonus-${t.fileId}-`)) t_bonusPaid += (Number(t.bonus) || 0);
              else if (key.startsWith(`AGG-overtime-${t.fileId}-`)) t_overtimePaid += (Number(t.overtime) || 0);
            }
          });
        });

        const computedTotal = (Number(t.dieselPrice) || 0) + (Number(t.commission) || 0) + (Number(t.extraDiesel) || 0) + (Number(t.friday) || 0) + (Number(t.bonus) || 0) + (Number(t.overtime) || 0);
        const computedPaid = t_dieselPaid + t_commissionPaid + t_extraDieselPaid + t_fridayPaid + t_bonusPaid + t_overtimePaid;
        const status = computedPaid <= 0 ? "UNPAID" : computedPaid >= computedTotal ? "PAID" : "PARTIAL";

        return {
          date: t.loadingDate,
          loadingDate: t.loadingDate || "-",
          loadingTime: t.loadingTime || "-",
          fromCountry: t.fromCountry || "-",
          loadingPlace: t.loadingPlace || "-",
          arrivalCountry: t.arrivalCountry || "-",
          deliveryPlace: t.deliveryPlace || "-",
          deliveryDate: t.deliveryDate || "-",
          deliveryTime: t.deliveryTime || "-",
          customerName: t.companyName || "-",
          bayanNumber: t.bayanNumber || "-",
          containerNumber: t.containerNumber || "-",
          loadingType: t.loadingType || "-",
          containerType: t.containerTitle || "-",
          invoiceNumber: t.invoiceNumber || "-",
          tripStatus: t.tripStatus || "-",
          emptyReturnYard: t.emptyReturnYard || "-",
          truckNumber: t.vehicleNumber || "-",
          trailerNumber: t.trailerNumber || "-",
          tripDiesel: t.dieselPrice || 0,
          commission: t.commission || 0,
          amount: computedTotal,
          paidAmount: computedPaid,
          status: status,
          pendingAmount: Math.max(0, computedTotal - computedPaid),
          extraDiesel: t.extraDiesel || 0,
          generatorDiesel: t.generatorDiesel || 0,
          extraDieselReason: t.extraDieselReason || "-",
        };
      });
    } else if (
      selectedType === "SALARY_ONLY" ||
      selectedType === "SALARY_COMMISSION"
    ) {
      const isBoth = selectedType === "SALARY_COMMISSION";
      const monthYears = new Map<string, { month: number; year: number }>();

      monthlyFiles.forEach((f) => {
        monthYears.set(`${f.year}-${f.month}`, {
          month: f.month,
          year: f.year,
        });
      });
      payments
        .filter((p) =>
          ["SALARY", "COMMISSION"].includes(p.category?.toUpperCase() || ""),
        )
        .forEach((p) => {
          if (p.month && p.year)
            monthYears.set(`${p.year}-${p.month}`, {
              month: p.month,
              year: p.year,
            });
        });

      const allPendingDues = PaymentManager.getPendingDues(
        trips,
        monthlyFiles,
        payments,
      );

      Array.from(monthYears.values()).forEach(({ month, year }) => {
        const d = new Date(year, month - 1, 1);
        if (!getIsInRange(d.toISOString())) return;

        let salReceived = 0;
        let salPending = 0;
        let commReceived = 0;
        let commPending = 0;

        let salPaymentDate = "";
        let commPaymentDate = "";

        const mPayments = payments.filter(
          (p) => p.month === month && p.year === year,
        );
        let deduction = 0;
        let deductionDescList: string[] = [];
        mPayments.forEach((p) => {
          const amt = Math.abs(Number(p.amount) || 0);
          if (p.type === "DEDUCTION") {
            deduction += amt;
            const desc = p.category || p.details?.note || "Deduction";
            if (!deductionDescList.includes(desc)) {
              deductionDescList.push(desc);
            }
          } else {
            const cat = p.category?.toUpperCase() || "";
            if (cat === "SALARY") {
              if (p.type === "INCOME" && p.status === "RECEIVED") {
                salReceived += amt;
                if (
                  !salPaymentDate ||
                  new Date(p.date) > new Date(salPaymentDate)
                ) {
                  salPaymentDate = p.date;
                }
              }
            } else if (cat === "COMMISSION") {
              if (p.type === "INCOME" && p.status === "RECEIVED") {
                commReceived += amt;
                if (
                  !commPaymentDate ||
                  new Date(p.date) > new Date(commPaymentDate)
                ) {
                  commPaymentDate = p.date;
                }
              }
            }
          }
        });

        const deductionDesc = deductionDescList.join(", ") || "-";

        const fileGroup = allPendingDues.find(
          (f) => f.month === month && f.year === year,
        );
        if (fileGroup) {
          const sCat = fileGroup.categories.find(
            (c: any) => (c.name || '').toUpperCase() === "SALARY",
          );
          if (sCat) salPending = sCat.totalPending;
          const cCat = fileGroup.categories.find(
            (c: any) => (c.name || '').toUpperCase() === "COMMISSION",
          );
          if (cCat) commPending = cCat.totalPending;
        }

        const salTotal = salReceived + salPending;
        const commTotal = commReceived + commPending;

        if (salTotal === 0 && (!isBoth || commTotal === 0)) return;

        const totalAmt = isBoth ? salTotal + commTotal : salTotal;
        const totalPaid = isBoth ? salReceived + commReceived : salReceived;
        const totalPend = isBoth ? salPending + commPending : salPending;
        let status = "Unpaid";
        if (totalPend <= 0 && totalPaid > 0) status = "Paid";
        else if (totalPaid > 0 && totalPend > 0) {
          if (isBoth && salPending === 0 && commPending > 0) {
            status = "Unpaid";
          } else {
            status = "Partial";
          }
        }

        let desc = "";
        const monthName = d.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });
        if (salTotal > 0 && commTotal > 0) {
          desc = `Salary & Commission for ${monthName}`;
        } else if (salTotal > 0) {
          desc = `Salary for ${monthName}`;
        } else {
          desc = `Commission for ${monthName}`;
        }

        let paymentDate = "";
        if (status === "Paid" || status === "Partial") {
          if (salPaymentDate && commPaymentDate) {
            paymentDate =
              new Date(salPaymentDate) > new Date(commPaymentDate)
                ? salPaymentDate
                : commPaymentDate;
          } else {
            paymentDate = salPaymentDate || commPaymentDate;
          }
        }

        rows.push({
          date: d.toLocaleString("en-US", { month: "long", year: "numeric" }),
          sortKey: d.getTime(),
          description: desc,
          paymentDate: paymentDate,
          salaryAmount: salTotal,
          salaryPaid: salReceived,
          salaryPending: salPending,
          commAmount: commTotal,
          commPaid: commReceived,
          commPending: commPending,
          amount: totalAmt,
          totalPaid: totalPaid,
          totalPending: totalPend,
          status,
          deduction,
          deductionDesc,
          netIncome: totalAmt - deduction,
        });
      });
      rows.sort((a, b) => a.sortKey - b.sortKey);
      let rBal = 0;
      rows = rows.map((r) => {
        rBal += r.totalPending;
        return { ...r, balance: rBal };
      });
    } else if (selectedType === "COMMISSION") {
      const matched = (trips || []).filter((t) => getIsInRange(t.loadingDate));
      rows = matched.map((t) => {
        let t_commissionPaid = 0;

        (payments || []).filter(p => p.status === 'RECEIVED').forEach(p => {
          if (!p.details?.pendingItems) return;
          const items = p.details.pendingItems;
          const cat = p.category?.toUpperCase() || '';
          
          Object.keys(items).forEach(key => {
            const val = Number(items[key]) || 0;
            if (key === `${t.id}-commission`) { t_commissionPaid += val; }
            else if (key === t.id && cat === 'COMMISSION') { t_commissionPaid += val; }
            else if (key.startsWith(`AGG-commission-${t.fileId}-`)) { t_commissionPaid += (Number(t.commission) || 0); }
          });
        });

        return {
          date: t.loadingDate,
          loadingDate: t.loadingDate,
          customerName: t.companyName,
          loadingType: t.loadingType || "",
          containerNumber: t.containerNumber || "-",
          truckNumber: t.vehicleNumber,
          invoiceNumber: t.invoiceNumber || "-",
          amount: t.commission || 0,
          paidAmount: t_commissionPaid,
          status:
            (t.commission || 0) === 0
              ? "UNPAID"
              : (t.commission || 0) <= t_commissionPaid
                ? "PAID"
                : t_commissionPaid > 0
                  ? "PARTIAL"
                  : "UNPAID",
        };
      });
    } else if (selectedType === "DIESEL") {
      const matched = (trips || []).filter((t) => getIsInRange(t.loadingDate));
      rows = matched.map((t) => {
        const tripDieselAmt = t.dieselPrice || 0;
        const extraDieselAmt = t.extraDiesel || 0;
        const genDieselAmt = t.generatorDiesel || 0;
        
        let t_dieselPaid = 0;
        let t_extraDieselPaid = 0;
        let t_generatorDieselPaid = 0;

        (payments || []).filter(p => p.status === 'RECEIVED').forEach(p => {
          if (!p.details?.pendingItems) return;
          const items = p.details.pendingItems;
          const cat = p.category?.toUpperCase() || '';
          
          Object.keys(items).forEach(key => {
            const val = Number(items[key]) || 0;
            if (key === `${t.id}-dieselPrice`) { t_dieselPaid += val; }
            else if (key === `${t.id}-extraDiesel`) { t_extraDieselPaid += val; }
            else if (key === `${t.id}-generatorDiesel`) { t_generatorDieselPaid += val; }
            else if (key === t.id && cat === 'TRIP DIESEL') { t_dieselPaid += val; }
            else if (key.startsWith(`AGG-dieselPrice-${t.fileId}-`)) { t_dieselPaid += (Number(t.dieselPrice) || 0); }
            else if (key.startsWith(`AGG-extraDiesel-${t.fileId}-`)) { t_extraDieselPaid += (Number(t.extraDiesel) || 0); }
            else if (key.startsWith(`AGG-generatorDiesel-${t.fileId}-`)) { t_generatorDieselPaid += (Number(t.generatorDiesel) || 0); }
          });
        });

        const totalDiesel = tripDieselAmt + extraDieselAmt;
        const totalPaid = t_dieselPaid + t_extraDieselPaid;
        const pendingAmount = Math.max(0, totalDiesel - totalPaid);
        let status = "UNPAID";
        if (totalDiesel === 0) {
          status = "UNPAID";
        } else if (totalPaid >= totalDiesel) {
          status = "PAID";
        } else if (totalPaid > 0) {
          status = "PARTIAL";
        }

        return {
          date: t.loadingDate,
          loadingDate: t.loadingDate,
          bayanNumber: t.bayanNumber || "-",
          customerName: t.companyName,
          deliveryPlace: t.deliveryPlace || "-",
          loadingType: t.loadingType || "-",
          containerNumber: t.containerNumber || "-",
          containerType: t.containerTitle || "-",
          truckNumber: t.vehicleNumber || "-",
          invoiceNumber: t.invoiceNumber || "-",
          tripDiesel: tripDieselAmt,
          extraDiesel: extraDieselAmt,
          generatorDiesel: genDieselAmt,
          description: t.extraDieselReason || "-",
          paidAmount: totalPaid,
          pendingAmount: pendingAmount,
          status: status,
        };
      });
    } else if (selectedType === "GENERATOR_DIESEL") {
      const matched = payments.filter(
        (p) =>
          p.category?.toUpperCase() === "TRIP DIESEL" && getIsInRange(p.date),
      );
      rows = matched
        .map((p) => {
          const isDeduction = p.type === "DEDUCTION";
          const isGenerator =
            (p.details?.pendingItems &&
              Object.keys(p.details.pendingItems).some(
                (k) =>
                  k.toLowerCase().includes("generate") ||
                  k.toLowerCase().includes("generator"),
              )) ||
            p.details?.note?.toLowerCase().includes("generator") ||
            p.details?.serviceName?.toLowerCase().includes("generator");

          if (!isGenerator) return null;

          return {
            date: p.date,
            description: isDeduction
              ? p.details?.note ||
                (language === "bn"
                  ? "জেনারেটর ডিজেল খরচ"
                  : "Generator Diesel Expense")
              : `${language === "bn" ? "জেনারেটর ডিজেল পরিশোধ" : "Generator Diesel Paid"}${p.details?.containerNumber && p.details.containerNumber !== "N/A" ? ` (${p.details.containerNumber})` : ""}`,
            amount: isDeduction ? -Math.abs(p.amount) : Math.abs(p.amount),
            type: p.type,
          };
        })
        .filter(Boolean);
    } else if (selectedType === "USER_RENEW") {
      const matched = allRenewPayments.filter((p) => getIsInRange(p.date));
      matched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      rows = matched.map((p) => {
        const isDeduction = p.type === "DEDUCTION";
        return {
          date: p.date,
          description:
            language === "bn"
              ? `রিনিউ: ${p.details?.userName || "ইউজার"} (${p.details?.duration || "১ মাস"})`
              : `Renew: ${p.details?.userName || "User"} (${p.details?.duration || "1 Month"})`,
          amount: isDeduction ? -Math.abs(p.amount) : Math.abs(p.amount),
          type: p.type,
        };
      });
    }

    // Sort ascending by date
    rows.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate running balance
    let currentBalance = 0;
    return rows.map((r) => {
      currentBalance += r.amount;
      return {
        ...r,
        balance: currentBalance,
      };
    });
  };

  const rawReportData = getStatementData();
  const reportData = rawReportData.filter((row) => {
    if (statusFilter === "PENDING") {
      if (selectedType === "TRIP") {
        return row.pendingAmount > 0;
      } else if (selectedType === "SALARY_ONLY" || selectedType === "SALARY_COMMISSION") {
        return row.totalPending > 0;
      } else if (selectedType === "COMMISSION") {
        return (row.amount - row.paidAmount) > 0;
      } else if (selectedType === "DIESEL") {
        return row.pendingAmount > 0;
      } else {
        return row.type === "DEDUCTION" || row.amount < 0;
      }
    } else { // "PAYMENT"
      if (selectedType === "TRIP") {
        return row.paidAmount > 0;
      } else if (selectedType === "SALARY_ONLY" || selectedType === "SALARY_COMMISSION") {
        return row.totalPaid > 0;
      } else if (selectedType === "COMMISSION") {
        return (row.paidAmount || 0) > 0;
      } else if (selectedType === "DIESEL") {
        return (row.paidAmount || 0) > 0;
      } else {
        return row.type === "INCOME" || row.amount >= 0;
      }
    }
  }).map((row) => {
    if (selectedType === "SALARY_ONLY") {
      if (statusFilter === "PENDING") {
        return {
          ...row,
          amount: row.totalPending || 0,
          netIncome: row.totalPending || 0,
          deduction: 0,
        };
      } else if (statusFilter === "PAYMENT") {
        return {
          ...row,
          amount: row.totalPaid || 0,
          netIncome: row.totalPaid || 0,
          deduction: 0,
        };
      }
    } else if (selectedType === "SALARY_COMMISSION") {
      if (statusFilter === "PENDING") {
        return {
          ...row,
          salaryAmount: row.salaryPending || 0,
          commAmount: row.commPending || 0,
          amount: row.totalPending || 0,
          totalPaid: 0,
          balance: row.totalPending || 0,
        };
      } else if (statusFilter === "PAYMENT") {
        return {
          ...row,
          salaryAmount: row.salaryPaid || 0,
          commAmount: row.commPaid || 0,
          amount: row.totalPaid || 0,
          totalPending: row.totalPending || 0,
          balance: row.totalPending || 0,
        };
      }
    }
    return row;
  });

  // Stats calculation
  const totalReceived =
    selectedType === "TRIP"
      ? 0
      : reportData.reduce(
          (acc, row) => (row.amount > 0 ? acc + row.amount : acc),
          0,
        );
  const totalDeductions =
    selectedType === "TRIP"
      ? 0
      : reportData.reduce(
          (acc, row) => (row.amount < 0 ? acc + row.amount : acc),
          0,
        );
  const netBalance = totalReceived + totalDeductions;

  const totalTripsCount = selectedType === "TRIP" ? reportData.length : 0;
  const totalDiesel =
    selectedType === "TRIP"
      ? reportData.reduce((acc, row) => acc + (row.diesel || 0), 0)
      : 0;
  const totalCommission =
    selectedType === "TRIP"
      ? reportData.reduce((acc, row) => acc + (row.commission || 0), 0)
      : 0;

  const commTripsCount =
    selectedType === "COMMISSION"
      ? reportData.length
      : 0;
  const commExpected =
    selectedType === "COMMISSION"
      ? reportData.reduce((acc, t) => acc + (t.amount || 0), 0)
      : 0;
  const commPaid =
    selectedType === "COMMISSION"
      ? reportData.reduce((acc, t) => acc + (t.paidAmount || 0), 0)
      : 0;
  const commPending =
    selectedType === "COMMISSION"
      ? reportData.reduce((acc, t) => acc + (t.pendingAmount || 0), 0)
      : 0;

  // PDF Download Handler

  const handleDownloadClick = () => {
    if (
      selectedType === "TRIP" ||
      selectedType === "DIESEL" ||
      selectedType === "COMMISSION"
    ) {
      let cols: { id: string; label: string; mandatory: boolean }[] = [];
      if (selectedType === "TRIP") {
        cols = [
          { id: "From Country", label: "From Country", mandatory: false },
          { id: "Loading Place", label: "Loading Place", mandatory: false },
          { id: "Loading Date", label: "Loading Date", mandatory: false },
          { id: "Loading Time", label: "Loading Time", mandatory: false },
          { id: "Arrival Country", label: "Arrival Country", mandatory: false },
          { id: "Delivery Place", label: "Delivery Place", mandatory: false },
          { id: "Delivery Date", label: "Delivery Date", mandatory: false },
          { id: "Delivery Time", label: "Delivery Time", mandatory: false },
          { id: "Company Name", label: "Company Name", mandatory: false },
          { id: "Bayan Number", label: "Bayan Number", mandatory: false },
          {
            id: "Container Number",
            label: "Container Number",
            mandatory: false,
          },
          { id: "Loading Type", label: "Loading Type", mandatory: false },
          { id: "Container Title", label: "Container Title", mandatory: false },
          { id: "Invoice Number", label: "Invoice Number", mandatory: false },
          { id: "Trip Status", label: "Trip Status", mandatory: false },
          {
            id: "Empty Return Yard",
            label: "Empty Return Yard",
            mandatory: false,
          },
          { id: "Vehicle Number", label: "Vehicle Number", mandatory: false },
          { id: "Trailer Number", label: "Trailer Number", mandatory: false },
          { id: "Trip Diesel", label: "Trip Diesel", mandatory: false },
          { id: "Extra Diesel", label: "Extra Diesel", mandatory: false },
          { id: "Description", label: "Description", mandatory: false },
          { id: "Commission", label: "Commission", mandatory: false },
          { id: "Amount", label: "Amount", mandatory: false },
          { id: "Paid Amount", label: "Paid Amount", mandatory: true },
          { id: "Pending Amount", label: "Pending Amount", mandatory: true },
          { id: "Status", label: "Status", mandatory: true },
        ];
      } else if (selectedType === "DIESEL") {
        cols = [
          { id: "Loading Date", label: "Loading Date", mandatory: false },
          { id: "Customer Name", label: "Customer Name", mandatory: false },
          { id: "Delivery Place", label: "Delivery Place", mandatory: false },
          { id: "Loading Type", label: "Loading Type", mandatory: false },
          { id: "Container No.", label: "Container No.", mandatory: false },
          { id: "Container Type", label: "Container Type", mandatory: false },
          { id: "Truck No.", label: "Truck No.", mandatory: false },
          { id: "Invoice No.", label: "Invoice No.", mandatory: false },
          { id: "Bayan Number", label: "Bayan Number", mandatory: false },
          { id: "Trip Diesel", label: "Trip Diesel", mandatory: false },
          { id: "Extra Diesel", label: "Extra Diesel", mandatory: false },
          { id: "Description", label: "Description", mandatory: false },
          { id: "Paid Amount", label: "Paid Amount", mandatory: true },
          { id: "Pending Amount", label: "Pending Amount", mandatory: true },
          { id: "Status", label: "Status", mandatory: true },
        ];
      } else if (selectedType === "COMMISSION") {
        cols = [
          { id: "Loading Date", label: "Loading Date", mandatory: false },
          { id: "Customer Name", label: "Customer Name", mandatory: false },
          { id: "Loading Type", label: "Loading Type", mandatory: false },
          { id: "Container No.", label: "Container No.", mandatory: false },
          { id: "Truck No.", label: "Truck No.", mandatory: false },
          { id: "Invoice No.", label: "Invoice No.", mandatory: false },
          { id: "Amount", label: "Amount", mandatory: false },
          { id: "Paid Amount", label: "Paid Amount", mandatory: true },
          { id: "Status", label: "Status", mandatory: true },
        ];
      }
      setAvailableColumns(cols);
      setSelectedColumns(cols.map((c) => c.id));
      setIsColumnSelectModalOpen(true);
    } else {
      downloadPDF();
    }
  };

  const downloadPDF = async (customCols?: string[]) => {
    const isTripReport = selectedType === "TRIP";
    const isCommissionReport = selectedType === "COMMISSION";
    const isDieselReport = selectedType === "DIESEL";
    const isLandscape = isTripReport || isCommissionReport || isDieselReport;

    // Get table headers & data first to calculate dynamic width
    let originalHeaders: string[] = [];
    let allRowData: string[][] = [];
    let summaryData: { label: string; value: string; isHeader?: boolean }[] =
      [];

    if (isTripReport) {
      originalHeaders = [
        "From Country",
        "Loading Place",
        "Loading Date",
        "Loading Time",
        "Arrival Country",
        "Delivery Place",
        "Delivery Date",
        "Delivery Time",
        "Company Name",
        "Bayan Number",
        "Container Number",
        "Loading Type",
        "Container Title",
        "Invoice Number",
        "Trip Status",
        "Empty Return Yard",
        "Vehicle Number",
        "Trailer Number",
        "Trip Diesel",
        "Extra Diesel",
        "Description",
        "Commission",
        "Amount",
        "Paid Amount",
        "Pending Amount",
        "Status",
      ];
    } else if (isDieselReport) {
      originalHeaders = [
        "Loading Date",
        "Customer Name",
        "Delivery Place",
        "Loading Type",
        "Container No.",
        "Container Type",
        "Truck No.",
        "Invoice No.",
        "Bayan Number",
        "Trip Diesel",
        "Extra Diesel",
        "Description",
        "Paid Amount",
        "Pending Amount",
        "Status",
      ];
    } else if (isCommissionReport) {
      originalHeaders = [
        "Loading Date",
        "Customer Name",
        "Loading Type",
        "Container No.",
        "Truck No.",
        "Invoice No.",
        "Amount",
        "Paid Amount",
        "Status",
      ];
    } else if (
      selectedType === "SALARY_ONLY" ||
      selectedType === "SALARY_COMMISSION"
    ) {
      originalHeaders =
        selectedType === "SALARY_COMMISSION"
          ? [
              "Month",
              "Description",
              "Basic Salary",
              "Commission",
              "Total",
              "Payment",
              "balance",
              "Payment Date",
              "Status",
            ]
          : [
              "Month",
              "Basic Salary",
              "Deduction",
              "Description",
              "Net Income",
              "Payment Date",
              "Status",
            ];
    } else {
      originalHeaders = ["Date", "Description", "Amount", "Balance"];
    }

    const indicesToKeep = originalHeaders
      .map((h, i) => {
        if (!customCols) {
          if (isTripReport && h === "Description") return -1;
          if (selectedType === "SALARY_COMMISSION") {
            if (h === "Payment" || h === "Payment Date") return -1;
          }
          return i;
        }
        if (customCols.includes(h)) return i;
        if (
          isTripReport &&
          h === "Description" &&
          customCols.includes("Extra Diesel")
        )
          return i;
        return -1;
      })
      .filter((i) => i !== -1);
    const headers = indicesToKeep.map((i) => originalHeaders[i]);

    // Populate data
    if (isTripReport) {
      reportData.forEach((row) => {
        const fullRowData = [
          String(row.fromCountry || ""),
          String(row.loadingPlace || ""),
          String(row.loadingDate || ""),
          String(row.loadingTime || ""),
          String(row.arrivalCountry || ""),
          String(row.deliveryPlace || ""),
          String(row.deliveryDate || ""),
          String(row.deliveryTime || ""),
          String(row.customerName || ""),
          String(row.bayanNumber || ""),
          String(row.containerNumber || ""),
          String(row.loadingType || ""),
          String(row.containerType || ""),
          String(row.invoiceNumber || ""),
          String(row.tripStatus || ""),
          String(row.emptyReturnYard || ""),
          String(row.truckNumber || ""),
          String(row.trailerNumber || ""),
          `${currency.code} ${formatNum(row.tripDiesel)}`,
          `${currency.code} ${formatNum(row.extraDiesel)}`,
          String(row.extraDieselReason || "-"),
          `${currency.code} ${formatNum(row.commission)}`,
          `${currency.code} ${formatNum(row.amount)}`,
          `${currency.code} ${formatNum(row.paidAmount)}`,
          `${currency.code} ${formatNum(row.pendingAmount)}`,
          String(row.status || ""),
        ];
        allRowData.push(indicesToKeep.map((i) => fullRowData[i]));
      });
      const tripAmount = reportData.reduce(
        (acc, r: any) => acc + (r.amount || 0),
        0,
      );
      const tripPaid = reportData.reduce(
        (acc, r: any) => acc + (r.paidAmount || 0),
        0,
      );
      const tripPending = reportData.reduce(
        (acc, r: any) => acc + (r.pendingAmount || 0),
        0,
      );
      const tripCommission = reportData.reduce(
        (acc, r: any) => acc + (r.commission || 0),
        0,
      );
      summaryData = [
        { label: "Total Trips:", value: String(totalTripsCount) },
        {
          label: "Total Commission:",
          value: `${currency.code} ${formatNum(tripCommission)}`,
        },
        {
          label: "Total Paid:",
          value: `${currency.code} ${formatNum(tripPaid)}`,
        },
        {
          label: "Total Pending:",
          value: `${currency.code} ${formatNum(tripPending)}`,
        },
        {
          label: "Total Expected:",
          value: `${currency.code} ${formatNum(tripAmount)}`,
          isHeader: true,
        },
      ];
    } else if (isDieselReport) {
      reportData.forEach((row) => {
        const fullRowData = [
          formatDate(row.loadingDate || ""),
          row.customerName || "",
          row.deliveryPlace || "",
          row.loadingType || "",
          row.containerNumber || "",
          row.containerType || "",
          row.truckNumber || "",
          row.invoiceNumber || "",
          row.bayanNumber || "",
          `${currency.code} ${formatNum(row.tripDiesel || 0)}`,
          `${currency.code} ${formatNum(row.extraDiesel || 0)}`,
          row.description || "-",
          `${currency.code} ${formatNum(row.paidAmount || 0)}`,
          `${currency.code} ${formatNum(row.pendingAmount || 0)}`,
          row.status || "",
        ];
        allRowData.push(indicesToKeep.map((i) => fullRowData[i]));
      });
      const tripDieselTotal = reportData.reduce(
        (acc, r: any) => acc + (r.tripDiesel || 0),
        0,
      );
      const extraDieselTotal = reportData.reduce(
        (acc, r: any) => acc + (r.extraDiesel || 0),
        0,
      );
      const totalPaidTotal = reportData.reduce(
        (acc, r: any) => acc + (r.paidAmount || 0),
        0,
      );
      const totalPendingTotal = reportData.reduce(
        (acc, r: any) => acc + (r.pendingAmount || 0),
        0,
      );
      summaryData = [
        { label: "Total Trips:", value: String(reportData.length) },
        {
          label: "Total Trip Diesel:",
          value: `${currency.code} ${formatNum(tripDieselTotal)}`,
        },
        {
          label: "Total Extra Diesel:",
          value: `${currency.code} ${formatNum(extraDieselTotal)}`,
        },
        {
          label: "Total Paid:",
          value: `${currency.code} ${formatNum(totalPaidTotal)}`,
        },
        {
          label: "Total Pending:",
          value: `${currency.code} ${formatNum(totalPendingTotal)}`,
        },
      ];
    } else if (isCommissionReport) {
      reportData.forEach((row) => {
        const fullRowData = [
          String(row.loadingDate || ""),
          String(row.customerName || ""),
          String(row.loadingType || ""),
          String(row.containerNumber || ""),
          String(row.truckNumber || ""),
          String(row.invoiceNumber || ""),
          `${currency.code} ${formatNum(row.amount)}`,
          `${currency.code} ${formatNum(row.paidAmount)}`,
          String(row.status || ""),
        ];
        allRowData.push(indicesToKeep.map((i) => fullRowData[i]));
      });
      summaryData = [
        { label: "Total Trips:", value: String(commTripsCount) },
        {
          label: "Total Paid:",
          value: `${currency.code} ${formatNum(commPaid)}`,
        },
        {
          label: "Total Pending:",
          value: `${currency.code} ${formatNum(commPending)}`,
        },
        {
          label: "Total Expected:",
          value: `${currency.code} ${formatNum(commExpected)}`,
          isHeader: true,
        },
      ];
    } else if (
      selectedType === "SALARY_ONLY" ||
      selectedType === "SALARY_COMMISSION"
    ) {
      const isBoth = selectedType === "SALARY_COMMISSION";
      reportData.forEach((row) => {
        let fullRowData: string[];
        if (isBoth) {
          fullRowData = [
            String(row.date),
            String(row.description),
            `${currency.code} ${formatNum(row.salaryAmount)}`,
            `${currency.code} ${formatNum(row.commAmount)}`,
            `${currency.code} ${formatNum(row.amount)}`,
            `${currency.code} ${formatNum(row.totalPaid)}`,
            `${currency.code} ${formatNum(row.balance)}`,
            row.paymentDate ? formatDate(row.paymentDate) : "",
            String(row.status),
          ];
        } else {
          fullRowData = [
            String(row.date),
            `${currency.code} ${formatNum(row.amount)}`,
            `${currency.code} ${formatNum(row.deduction || 0)}`,
            String(row.deductionDesc || "-"),
            `${currency.code} ${formatNum(row.netIncome || 0)}`,
            row.paymentDate ? formatDate(row.paymentDate) : "",
            String(row.status),
          ];
        }
        allRowData.push(indicesToKeep.map((i) => fullRowData[i]));
      });
      const allPaid = reportData.reduce((acc, r) => acc + r.totalPaid, 0);
      const allPendObj = reportData.reduce((acc, r) => acc + r.totalPending, 0);
      const allAmt = reportData.reduce((acc, r) => acc + r.amount, 0);
      const allDeduction = reportData.reduce((acc, r) => acc + (r.deduction || 0), 0);
      const allNetIncome = reportData.reduce((acc, r) => acc + (r.netIncome || 0), 0);
      const allSal = reportData.reduce((acc, r) => acc + (r.salaryAmount || 0), 0);
      const allComm = reportData.reduce((acc, r) => acc + (r.commAmount || 0), 0);

      let totalRow: string[];
      if (isBoth) {
        totalRow = [
          "Total",
          "-",
          `${currency.code} ${formatNum(allSal)}`,
          `${currency.code} ${formatNum(allComm)}`,
          `${currency.code} ${formatNum(allAmt)}`,
          `${currency.code} ${formatNum(allPaid)}`,
          `${currency.code} ${formatNum(allPendObj)}`,
          "-",
          "-",
        ];
      } else {
        totalRow = [
          "Total",
          `${currency.code} ${formatNum(allAmt)}`,
          `${currency.code} ${formatNum(allDeduction)}`,
          "-",
          `${currency.code} ${formatNum(allNetIncome)}`,
          "-",
          "-",
        ];
      }
      allRowData.push(indicesToKeep.map((i) => totalRow[i]));

      summaryData = [
        {
          label: "Total Paid:",
          value: `${currency.code} ${formatNum(allPaid)}`,
        },
        {
          label: "Total Pending:",
          value: `${currency.code} ${formatNum(allPendObj)}`,
        },
        {
          label: "Total Expected:",
          value: `${currency.code} ${formatNum(allAmt)}`,
          isHeader: true,
        },
      ];
    } else {
      reportData.forEach((row) => {
        const fullRowData = [
          formatDate(row.date),
          row.description,
          `${currency.code} ${formatNum(row.amount)}`,
          `${currency.code} ${formatNum(row.balance)}`,
        ];
        allRowData.push(indicesToKeep.map((i) => fullRowData[i]));
      });
      summaryData = [
        {
          label: "Total Received:",
          value: `${currency.code} ${formatNum(totalReceived)}`,
        },
        {
          label: "Total Deductions:",
          value: `- ${currency.code} ${formatNum(Math.abs(totalDeductions))}`,
        },
        {
          label: "Net Balance:",
          value: `${currency.code} ${formatNum(netBalance)}`,
          isHeader: true,
        },
      ];
    }

    const numCols = headers.length;

    // Dynamically adjust font sizes and paddings based on the number of columns to completely prevent overflow
    let tableFontSize = 8.5;
    let tableHeadFontSize = 9;
    let tableCellPadding = 2.5;

    if (numCols > 18) {
      tableFontSize = 5.5;
      tableHeadFontSize = 6;
      tableCellPadding = 1.0;
    } else if (numCols > 12) {
      tableFontSize = 6.5;
      tableHeadFontSize = 7;
      tableCellPadding = 1.5;
    } else if (numCols > 7) {
      tableFontSize = 7.5;
      tableHeadFontSize = 8;
      tableCellPadding = 2.0;
    }

    const docForCalc = new jsPDF();
    docForCalc.setFont("helvetica", "normal");
    docForCalc.setFontSize(tableFontSize);

    const estimatedColWidths = headers.map((h, i) => {
      let maxW = docForCalc.getTextWidth(h);
      allRowData.forEach((row) => {
        const val = String(row[i] || "");
        const w = docForCalc.getTextWidth(val);
        if (w > maxW) {
          maxW = w;
        }
      });
      return maxW + tableCellPadding * 2 + 1; // dynamically padded content width
    });
    const tableCalculatedWidth = estimatedColWidths.reduce((a, b) => a + b, 0);

    const isSalary =
      selectedType === "SALARY_ONLY" || selectedType === "SALARY_COMMISSION";

    // Dynamic width & orientation of the PDF page
    // Automatically switch to Landscape if we have more than 6 columns, but force Portrait A4 for Salary Statement
    const dynamicIsLandscape = isSalary ? false : (numCols > 6 || isLandscape);
    let stdWidth = dynamicIsLandscape ? 297 : 210;
    let stdHeight = dynamicIsLandscape ? 210 : 297;

    // Page expands gracefully if estimated table width is larger than standard printable area,
    // ensuring columns never get squeezed to be completely unreadable, while maintaining neat  margins.
    const printableArea = stdWidth - 30; // 15mm left, 15mm right margin
    const requiredWidth =
      tableCalculatedWidth > printableArea
        ? Math.max(stdWidth, tableCalculatedWidth + 30)
        : stdWidth;

    const doc = new jsPDF({
      orientation: requiredWidth > stdHeight ? "landscape" : "portrait",
      unit: "mm",
      format: [requiredWidth, stdHeight],
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const activeTypeObj = statementTypes.find((t) => t.id === selectedType);
    const statementLabel = activeTypeObj ? activeTypeObj.label : "Statement";

    const formatLongDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      });
    };

    const dateRangeStr = `${formatLongDate(fromDate)} - ${formatLongDate(toDate)}`;
    const currentDateTimeForPDF = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const generatedOnStr = currentDateTimeForPDF.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
    const formattedDateForPDF = `${pad(currentDateTimeForPDF.getDate())}-${pad(currentDateTimeForPDF.getMonth() + 1)}-${currentDateTimeForPDF.getFullYear()}`;
    let pdfHours = currentDateTimeForPDF.getHours();
    const ampm = pdfHours >= 12 ? "PM" : "AM";
    pdfHours = pdfHours % 12;
    pdfHours = pdfHours ? pdfHours : 12;
    const formattedTimeForPDF = `${pad(pdfHours)}:${pad(currentDateTimeForPDF.getMinutes())} ${ampm}`;

    const drawWatermark = () => {
      // Create watermark text right in the center of the page
      doc.setTextColor(200, 200, 200); // Light gray
      doc.setFontSize(50);
      doc.setFont("helvetica", "bold");
      doc.saveGraphicsState();
      doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
      doc.text(
        "FleetPro Manager",
        pageWidth / 2,
        doc.internal.pageSize.getHeight() / 2,
        {
          align: "center",
          angle: 45,
        },
      );
      doc.restoreGraphicsState();
    };

    drawWatermark();

    const targetUser = user;
    let currentY = 50;

    if (isSalary) {
      // CENTERED TITLE & SUBTITLE (A4 Portrait Layout as per the screenshot)
      // Main Title: "FLEETPRO MANAGEMENT"
      doc.setTextColor(27, 54, 93); // Dark slate blue
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("FLEETPRO MANAGEMENT", pageWidth / 2, 22, { align: "center" });

      // Subtitle: "SALARY STATEMENT"
      doc.setTextColor(100, 116, 139); // Slate 500
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      const bnSubtitle = language === "bn" ? "স্যালারি স্টেটমেন্ট" : "SALARY STATEMENT";
      doc.text(bnSubtitle, pageWidth / 2, 30, { align: "center" });

      // Solid Thick Divider Line
      doc.setLineWidth(0.8);
      doc.setDrawColor(27, 54, 93); // dark blue/slate gray
      doc.line(15, 36, pageWidth - 15, 36);

      // 1. Statement Period & Generated On info bar
      const infoBarY = 42;
      const infoBarH = 10;
      doc.setFillColor(248, 250, 252); // light slate background
      doc.setDrawColor(226, 232, 240); // light gray border
      doc.setLineWidth(0.1);
      doc.roundedRect(15, infoBarY, pageWidth - 30, infoBarH, 1.5, 1.5, "FD");

      // Text inside info bar
      doc.setFontSize(8.5);
      
      // Left side text
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Statement Period:", 20, infoBarY + 6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(` ${dateRangeStr}`, 47, infoBarY + 6.5);

      // Right side text
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      const generatedPrefix = "Generated On: ";
      const generatedVal = `${generatedOnStr} | ${formattedTimeForPDF}`;
      const rightX = pageWidth - 20;
      doc.text(generatedVal, rightX, infoBarY + 6.5, { align: "right" });
      const valW = doc.getTextWidth(generatedVal);
      doc.text(generatedPrefix, rightX - valW, infoBarY + 6.5, { align: "right" });

      // 2. Profile Block (User Card with vertical thick border)
      const profileY = 57;
      const profileH = 22;
      
      // Background fill
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(241, 245, 249);
      doc.roundedRect(15, profileY, pageWidth - 30, profileH, 1, 1, "FD");

      // Thick left accent border
      doc.setFillColor(27, 54, 93);
      doc.rect(15, profileY, 2.5, profileH, "F");

      // Profile details columns
      doc.setFontSize(9);
      const col1X = 22;
      const col2X = pageWidth / 2 + 5;

      // Column 1 Row 1: Name
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Name:", col1X, profileY + 7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(` ${targetUser?.name || "-"}`, col1X + 11, profileY + 7);

      // Column 1 Row 2: Mobile
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Mobile:", col1X, profileY + 15);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(` ${targetUser?.mobileNumber || "-"}`, col1X + 12, profileY + 15);

      // Column 2 Row 1: Sponsor Name
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Sponsor Name:", col2X, profileY + 7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(` ${targetUser?.companyName || "-"}`, col2X + 25, profileY + 7);

      // Column 2 Row 2: Email
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Email:", col2X, profileY + 15);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(` ${targetUser?.email || "-"}`, col2X + 11, profileY + 15);

      currentY = profileY + profileH + 10; // Set starting Y for the table
    } else {
      // Header Background Strip for non-salary reports
      doc.setFillColor(248, 250, 252); // Slate 50
      doc.rect(0, 0, pageWidth, 40, "F");

      doc.setTextColor(15, 23, 42); // Slate 900
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("FleetPro Manager", 15, 20);

      doc.setTextColor(71, 85, 105); // Slate 500
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      let headerTitle = (statementLabel || "ACCOUNT STATEMENT").toUpperCase();
      if (
        !headerTitle.includes("STATEMENT") &&
        !headerTitle.includes("স্টেটমেন্ট")
      ) {
        headerTitle += " STATEMENT";
      }
      doc.text(headerTitle, pageWidth - 15, 18, { align: "right" });

      // Subtitle Date Range
      const statMonthYear = new Date(fromDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`Statement for ${statMonthYear}`, pageWidth - 15, 23, {
        align: "right",
      });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Date Range: ${dateRangeStr}`, pageWidth - 15, 28, {
        align: "right",
      });
      doc.text(
        `Generated: ${formattedDateForPDF} at ${formattedTimeForPDF}`,
        pageWidth - 15,
        33,
        { align: "right" },
      );

      // Divider
      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 40, pageWidth - 15, 40);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59); // Slate 800
      doc.text("Statement For", 15, currentY);

      currentY += 6;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, currentY, pageWidth - 30, 24, 2, 2, "FD");

      doc.setFontSize(9);

      // Split columns exactly 50/50. Left column ends at pageWidth/2 - 10, Right column starts at pageWidth/2 + 5
      const leftColStart = 20;
      const rightColStart = pageWidth / 2 + 5;
      const labelW = 25;
      const valueMaxW = pageWidth / 2 - leftColStart - labelW - 5;

      const printLabelVal = (
        label: string,
        val: string,
        startX: number,
        y: number,
      ) => {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139);
        doc.text(label, startX, y);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);

        // Truncate string gracefully if it overrides max width using jsPDF split
        const textLines = doc.splitTextToSize(val || "-", valueMaxW);
        const finalStr =
          textLines.length > 1 ? textLines[0] + "..." : textLines[0];
        doc.text(finalStr, startX + labelW, y);
      };

      printLabelVal(
        "User Name:",
        targetUser?.name || "",
        leftColStart,
        currentY + 8,
      );
      printLabelVal(
        "Sponsor Name:",
        targetUser?.companyName || "",
        rightColStart,
        currentY + 8,
      );
      printLabelVal(
        "Mobile Number:",
        targetUser?.mobileNumber || "",
        leftColStart,
        currentY + 16,
      );
      printLabelVal(
        "Nationality:",
        targetUser?.nationality || "",
        rightColStart,
        currentY + 16,
      );

      currentY += 38; // Increased spacing after the box for a balanced premium look

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Statement Report", 15, currentY);

      currentY += 8; // Increased spacing between heading and table
    }

    // Use AutoTable for the grid
    autoTable(doc, {
      startY: currentY,
      head: [headers],
      body: allRowData,
      theme: "grid",
      tableWidth: "auto",
      styles: {
        font: "helvetica",
        fontSize: tableFontSize,
        textColor: [71, 85, 105],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        cellPadding: tableCellPadding,
        minCellHeight: 6,
        overflow: "ellipsize",
      },
      headStyles: {
        fillColor: isSalary ? [27, 54, 93] : [241, 245, 249],
        textColor: isSalary ? [255, 255, 255] : [15, 23, 42],
        fontStyle: "bold",
        fontSize: tableHeadFontSize,
        halign: "center",
        valign: "middle",
      },
      columnStyles: {
        // Automatically right align monetary columns without hardcoded fixed widths
        ...headers.reduce((acc, h, i) => {
          acc[i] = {};
          if (
            /(Amount|Balance|Diesel|Commission|Amt|Paid|Pending|Expected|Salary|Income)$/i.test(
              h,
            )
          ) {
            acc[i].halign = "right";
          }
          if (h === "Status") {
            acc[i].halign = "center";
            acc[i].fontStyle = "bold";
          }
          return acc;
        }, {} as any),
      },
      didParseCell: function (data) {
        const isTotalRow = isSalary && data.row.index === data.table.body.length - 1;
        if (isTotalRow) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [241, 245, 249]; // light gray background like table header but lighter
          data.cell.styles.textColor = [15, 23, 42]; // dark text
        } else if (
          data.section === "body" &&
          headers[data.column.index] === "Status"
        ) {
          const val = String(data.cell.raw || "");
          if (val === "PAID" || val === "Paid")
            data.cell.styles.textColor = [21, 128, 61]; // Green
          else if (val === "PARTIAL" || val === "Partial")
            data.cell.styles.textColor = [194, 65, 12]; // Orange
          else if (val === "UNPAID" || val === "Unpaid") data.cell.styles.textColor = [185, 28, 28]; // Red
        }
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      margin: { top: 20, left: 15, right: 15 },
      didDrawPage: function (data) {
        // Redraw watermark on new pages that autotable dynamically created
        if (data.pageNumber > 1) {
          drawWatermark();
        }
      },
    });

    // Summary Box
    const finalY = (doc as any).lastAutoTable.finalY + 12; // Increased spacing above summary box

    if (summaryData.length > 0 && !isSalary) {
      const summaryBoxW = 95; // Slightly wider for large numbers
      const summaryBoxX = pageWidth - summaryBoxW - 15;
      const summaryBoxH = summaryData.length * 8 + 8; // Extra padding inside

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(
        summaryBoxX,
        finalY,
        summaryBoxW,
        summaryBoxH,
        2,
        2,
        "FD",
      );

      let sY = finalY + 9;
      summaryData.forEach((item) => {
        if (item.isHeader) {
          doc.setFillColor(241, 245, 249);
          doc.rect(summaryBoxX + 0.2, sY - 5.5, summaryBoxW - 0.4, 11, "F");
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(100, 116, 139);
          doc.setFont("helvetica", "normal");
        }
        doc.text(item.label, summaryBoxX + 5, sY);

        if (item.isHeader) {
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(15, 23, 42);
          doc.setFont("helvetica", "bold");
        }
        doc.text(item.value, summaryBoxX + summaryBoxW - 5, sY, {
          align: "right",
        });
        sY += 8;
      });
    }

    // DRAW FOOTER
    const pageNum = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageNum; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(
        15,
        doc.internal.pageSize.getHeight() - 15,
        pageWidth - 15,
        doc.internal.pageSize.getHeight() - 15,
      );
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "This is a system-generated statement.",
        15,
        doc.internal.pageSize.getHeight() - 10,
        { align: "left" },
      );
      doc.text(
        `Date: ${formattedDateForPDF} | Time: ${formattedTimeForPDF}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" },
      );
      doc.text(
        `Page ${i} of ${pageNum}`,
        pageWidth - 15,
        doc.internal.pageSize.getHeight() - 10,
        { align: "right" },
      );
    }

    // Save document
    let baseFileName = statementLabel.replace(/\s+/g, "_");
    if (
      selectedType === "SALARY_ONLY" ||
      selectedType === "SALARY_COMMISSION"
    ) {
      baseFileName = "Salary_Statement";
    }
    const fileName = `${baseFileName}_${generatedOnStr}.pdf`;

    await downloadPdf(doc, fileName, showFeedback, language);
  };

  const titleText = isColumnSelectModalOpen
    ? language === "bn"
      ? "কলাম নির্বাচন করুন"
      : "Select Columns"
    : selectedType === "SALARY_ONLY" ||
        selectedType === "SALARY_COMMISSION"
      ? language === "bn"
        ? "স্যালারি স্টেটমেন্ট"
        : "Salary Statement"
      : null;

  return (
    <div className="w-full mx-auto relative overflow-hidden pb-16 px-1 sm:px-2 pt-1">
      {/* Title block */}
      {titleText && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 dark:border-white/5 pb-4 gap-4 px-0.5 mb-4">
          <div className="flex items-center gap-3">
            {isColumnSelectModalOpen && (
              <button
                onClick={() => setIsColumnSelectModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-text-muted hover:text-text-main transition-colors shrink-0"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-text-main">
                {titleText}
              </h1>
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <>
          {!isColumnSelectModalOpen ? (
            <div
              key="main-content"
              className={`space-y-6 ${titleText ? "pt-2" : "pt-0"}`}
            >
              {/* Selection Panel card */}
              <div className="bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 rounded-2xl px-3 py-5 sm:p-6 shadow-md space-y-5">
                <div className="flex flex-col gap-5">
                  {/* Status Options: Pending, Payment */}
                  <div className="grid grid-cols-2 gap-3 pb-1">
                    <button
                      type="button"
                      id="status-filter-pending-btn"
                      onClick={() => setStatusFilter("PENDING")}
                      className={`h-12 rounded-[10px] text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                        statusFilter === "PENDING"
                          ? "bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20"
                          : "bg-[#D9D9D9] dark:bg-white/5 border-transparent text-[#001F3F] dark:text-gray-300 hover:bg-[#c8c8c8] dark:hover:bg-white/10"
                      }`}
                    >
                      <Clock size={16} />
                      {language === "bn" ? "বাকি (Pending)" : "Pending"}
                    </button>
                    <button
                      type="button"
                      id="status-filter-payment-btn"
                      onClick={() => setStatusFilter("PAYMENT")}
                      className={`h-12 rounded-[10px] text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                        statusFilter === "PAYMENT"
                          ? "bg-green-600 border-green-600 text-white shadow-md shadow-green-600/20"
                          : "bg-[#D9D9D9] dark:bg-white/5 border-transparent text-[#001F3F] dark:text-gray-300 hover:bg-[#c8c8c8] dark:hover:bg-white/10"
                      }`}
                    >
                      <CreditCard size={16} />
                      {language === "bn" ? "পরিশোধ (Payment)" : "Payment"}
                    </button>
                  </div>

                  {/* Statement Type */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">
                      {language === "bn"
                        ? "স্টেটমেন্টের ধরন"
                        : "Statement Type"}
                    </label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="custom-statement-select w-full h-12 px-4 rounded-[10px] bg-[#D9D9D9] dark:bg-white/5 text-[#001F3F] dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 text-sm font-bold shadow-sm transition-all"
                    >
                      {statementTypes.map((type) => (
                        <option key={type.id} value={type.id} className="bg-white dark:bg-[#1A1A1A]">
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(selectedType === "SALARY_ONLY" || selectedType === "SALARY_COMMISSION") && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">
                        {language === "bn" ? "সময়কাল" : "Duration"}
                      </label>
                      <select
                        value={dateRangePreset}
                        onChange={(e) => handleDateRangePresetChange(e.target.value)}
                        className="custom-statement-select w-full h-12 px-4 rounded-[10px] bg-[#D9D9D9] dark:bg-white/5 text-[#001F3F] dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/20 text-sm font-bold shadow-sm transition-all"
                      >
                        <option value="1_MONTH" className="bg-white dark:bg-[#1A1A1A]">
                          {language === "bn" ? "১ মাস" : "1 Month"}
                        </option>
                        <option value="3_MONTHS" className="bg-white dark:bg-[#1A1A1A]">
                          {language === "bn" ? "৩ মাস" : "3 Months"}
                        </option>
                        <option value="6_MONTHS" className="bg-white dark:bg-[#1A1A1A]">
                          {language === "bn" ? "৬ মাস" : "6 Months"}
                        </option>
                        <option value="1_YEAR" className="bg-white dark:bg-[#1A1A1A]">
                          {language === "bn" ? "১ বছর" : "1 Year"}
                        </option>
                        <option value="CUSTOM" className="bg-white dark:bg-[#1A1A1A]">
                          {language === "bn" ? "কাস্টম" : "Custom"}
                        </option>
                      </select>
                    </div>
                  )}

                  {(!(selectedType === "SALARY_ONLY" || selectedType === "SALARY_COMMISSION") || dateRangePreset === "CUSTOM") && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* From Date */}
                      <div className="flex flex-col space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">
                          {language === "bn" ? "শুরুর তারিখ" : "From Date"}
                        </label>
                        <div
                          onClick={() => setDatePickerConfig({
                            open: true,
                            type: 'from',
                            value: fromDate,
                            title: language === "bn" ? "শুরুর তারিখ নির্বাচন করুন" : "Select Start Date"
                          })}
                          className="w-full h-12 px-4 rounded-[10px] bg-[#D9D9D9] dark:bg-white/5 text-[#001F3F] dark:text-white border border-transparent hover:border-green-500/30 text-sm font-bold shadow-sm transition-all flex items-center justify-between cursor-pointer select-none"
                        >
                          <span className="truncate">{fromDate || "--"}</span>
                          <Calendar size={16} className="text-text-muted shrink-0 ml-2" />
                        </div>
                      </div>

                      {/* To Date */}
                      <div className="flex flex-col space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-widest text-text-muted ml-1">
                          {language === "bn" ? "শেষের তারিখ" : "To Date"}
                        </label>
                        <div
                          onClick={() => setDatePickerConfig({
                            open: true,
                            type: 'to',
                            value: toDate,
                            title: language === "bn" ? "শেষের তারিখ নির্বাচন করুন" : "Select End Date"
                          })}
                          className="w-full h-12 px-4 rounded-[10px] bg-[#D9D9D9] dark:bg-white/5 text-[#001F3F] dark:text-white border border-transparent hover:border-green-500/30 text-sm font-bold shadow-sm transition-all flex items-center justify-between cursor-pointer select-none"
                        >
                          <span className="truncate">{toDate || "--"}</span>
                          <Calendar size={16} className="text-text-muted shrink-0 ml-2" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PDF Download Button line */}
                <div className="pt-2">
                  <button
                    onClick={handleDownloadClick}
                    disabled={reportData.length === 0}
                    className={`flex items-center justify-center gap-2 h-11 w-full rounded-lg text-sm font-bold text-white shadow transition-all ${
                      reportData.length > 0
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 active:scale-[0.98]"
                        : "bg-gray-400 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <Download size={16} />
                    {language === "bn" ? "পিডিএফ ডাউনলোড করুন" : "Download PDF"}
                  </button>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">
                  {language === "bn"
                    ? "স্টেটমেন্ট প্রিভিউ"
                    : "Statement Preview"}
                </h3>

                {reportData.length === 0 ? (
                  <div className="bg-theme-card border border-dashed border-black/10 dark:border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                    <AlertCircle
                      size={40}
                      className="text-text-muted/40 mb-3"
                    />
                    <p className="text-sm font-bold text-text-muted">
                      {language === "bn"
                        ? "এই সময়ের মধ্যে কোনো স্টেটমেন্ট ডেটা পাওয়া যায়নি।"
                        : "No statement data found for the selected parameters."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Screen Data Table wrapper */}
                    <div className="bg-theme-card border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-md">
                      <div className="overflow-x-auto">
                        {selectedType === "TRIP" ? (
                          <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-800 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">
                                <th className="py-3 px-4 xl:px-5">
                                  Loading Date
                                </th>
                                <th className="py-3 px-4 xl:px-5 whitespace-nowrap">
                                  Customer Name
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Loading Type
                                </th>
                                <th className="py-3 px-4 xl:px-5">Bayan No.</th>
                                <th className="py-3 px-4 xl:px-5">
                                  Container No.
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Container Type
                                </th>
                                <th className="py-3 px-4 xl:px-5">Truck No.</th>
                                <th className="py-3 px-4 xl:px-5">
                                  Invoice No.
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Trip Diesel
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Extra Diesel
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  {language === "bn" ? "কমিশন" : "Commission"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-center">
                                  Description
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Amount
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Paid Amount
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Pending Amount
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[11px] sm:text-[13px] text-text-main">
                              {reportData.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className={`${idx % 2 === 1 ? "bg-slate-50 dark:bg-slate-900/40" : "bg-transparent"} hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors`}
                                >
                                  <td className="py-3 px-4 xl:px-5">
                                    {formatDate(row.loadingDate)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 font-medium whitespace-nowrap">
                                    {row.customerName}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.loadingType}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.bayanNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.containerNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.containerType}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.truckNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.invoiceNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.tripDiesel)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.extraDiesel)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.commission)}
                                  </td>
                                  <td
                                    className="py-3 px-4 xl:px-5 text-center whitespace-nowrap"
                                    title={row.extraDieselReason}
                                  >
                                    {row.extraDieselReason || "-"}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.amount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.paidAmount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.pendingAmount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right">
                                    <span
                                      className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${row.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : row.status === "PARTIAL" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : selectedType === "COMMISSION" ? (
                          <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-800 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">
                                <th className="py-3 px-4 xl:px-5">
                                  Loading Date
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Customer Name
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Loading Type
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Container No.
                                </th>
                                <th className="py-3 px-4 xl:px-5">Truck No.</th>
                                <th className="py-3 px-4 xl:px-5">
                                  Invoice No.
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Amount
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Paid Amount
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[11px] sm:text-[13px] text-text-main">
                              {reportData.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className={`${idx % 2 === 1 ? "bg-slate-50 dark:bg-slate-900/40" : "bg-transparent"} hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors`}
                                >
                                  <td className="py-3 px-4 xl:px-5">
                                    {formatDate(row.loadingDate)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 font-medium">
                                    {row.customerName}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.loadingType}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.containerNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.truckNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.invoiceNumber}
                                  </td>
                                  <td
                                    className={`py-3 px-4 xl:px-5 text-right font-bold`}
                                  >
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.amount)}
                                  </td>
                                  <td
                                    className={`py-3 px-4 xl:px-5 text-right font-bold`}
                                  >
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.paidAmount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    <span
                                      className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${row.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : row.status === "PARTIAL" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : selectedType === "DIESEL" ? (
                          <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-800 text-white text-[11px] sm:text-xs font-black tracking-wider">
                                <th className="py-3 px-4 xl:px-5">
                                  Loading Date
                                </th>
                                <th className="py-3 px-4 xl:px-5 whitespace-nowrap">
                                  Customer Name
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Delivery Place
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Loading Type
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Container No.
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Container Type
                                </th>
                                <th className="py-3 px-4 xl:px-5">Truck No.</th>
                                <th className="py-3 px-4 xl:px-5">
                                  Invoice No.
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  Bayan Number
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Trip Diesel
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Extra Diesel
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-center">
                                  Description
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Paid Amount
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  Pending Amount
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-center">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[11px] sm:text-[13px] text-text-main">
                              {reportData.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className={`${idx % 2 === 1 ? "bg-slate-50 dark:bg-slate-900/40" : "bg-transparent"} hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors`}
                                >
                                  <td className="py-3 px-4 xl:px-5">
                                    {formatDate(row.loadingDate)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 font-medium whitespace-nowrap">
                                    {row.customerName}
                                  </td>
                                  <td
                                    className="py-3 px-4 xl:px-5"
                                    title={row.deliveryPlace}
                                  >
                                    {row.deliveryPlace}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.loadingType}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.containerNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.containerType}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.truckNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.invoiceNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.bayanNumber}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.tripDiesel)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.extraDiesel)}
                                  </td>
                                  <td
                                    className="py-3 px-4 xl:px-5 text-center whitespace-nowrap"
                                    title={row.description}
                                  >
                                    {row.description}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.paidAmount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-bold text-orange-500">
                                    <span className="text-[10px] sm:text-xs text-orange-500/80 mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.pendingAmount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-center">
                                    <span
                                      className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${row.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : row.status === "PARTIAL" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : selectedType === "SALARY_ONLY" ? (
                          <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-800 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">
                                <th className="py-3 px-4 xl:px-5 whitespace-nowrap">
                                  {language === "bn" ? "মাস" : "Month"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right whitespace-nowrap">
                                  {language === "bn" ? "মূল বেতন" : "Basic Salary"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right whitespace-nowrap">
                                  {language === "bn" ? "কর্তন" : "Deduction"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 whitespace-nowrap">
                                  {language === "bn" ? "বিবরণ" : "Description"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right whitespace-nowrap">
                                  {language === "bn" ? "নিট আয়" : "Net Income"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-center whitespace-nowrap">
                                  {language === "bn" ? "পরিশোধের তারিখ" : "Payment Date"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-center whitespace-nowrap">
                                  {language === "bn" ? "অবস্থা" : "Status"}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[11px] sm:text-[13px] text-text-main hover:bg-transparent">
                              {reportData.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className={`${idx % 2 === 1 ? "bg-slate-50 dark:bg-slate-900/40" : "bg-transparent"} hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors`}
                                >
                                  <td className="py-3 px-4 xl:px-5 font-medium whitespace-nowrap break-words">
                                    {row.date}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right whitespace-nowrap text-text-main break-words font-bold">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.amount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right whitespace-nowrap font-bold text-red-500 break-words">
                                    <span className="text-[10px] sm:text-[11px] opacity-70 mr-0.5">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.deduction || 0)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 whitespace-nowrap break-words">
                                    {row.deductionDesc || "-"}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right whitespace-nowrap font-bold text-green-500 break-words">
                                    <span className="text-[10px] sm:text-[11px] opacity-70 mr-0.5">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.netIncome || 0)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-center font-medium whitespace-nowrap">
                                    {row.paymentDate ? formatDate(row.paymentDate) : ""}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-center">
                                    <span
                                      className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${row.status === "Paid" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : row.status === "Partial" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : selectedType === "SALARY_COMMISSION" ? (
                          <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-800 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">
                                <th className="py-3 px-4 xl:px-5 whitespace-nowrap">
                                  {language === "bn" ? "মাস" : "Month"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 whitespace-nowrap">
                                  {language === "bn" ? "বিবরণ" : "Description"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right whitespace-nowrap">
                                  {language === "bn" ? "মূল বেতন" : "Basic Salary"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right whitespace-nowrap">
                                  {language === "bn" ? "কমিশন" : "Commission"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right whitespace-nowrap">
                                  {language === "bn" ? "মোট" : "Total"}
                                </th>
                                {statusFilter !== "PENDING" && (
                                  <th className="py-3 px-4 xl:px-5 text-right whitespace-nowrap">
                                    {language === "bn" ? "পরিশোধ" : "Payment"}
                                  </th>
                                )}
                                <th className="py-3 px-4 xl:px-5 text-right whitespace-nowrap">
                                  {language === "bn" ? "ব্যালেন্স" : "balance"}
                                </th>
                                {statusFilter !== "PENDING" && (
                                  <th className="py-3 px-4 xl:px-5 text-center whitespace-nowrap">
                                    {language === "bn" ? "পরিশোধের তারিখ" : "Payment Date"}
                                  </th>
                                )}
                                <th className="py-3 px-4 xl:px-5 text-center whitespace-nowrap">
                                  {language === "bn" ? "অবস্থা" : "Status"}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[11px] sm:text-[13px] text-text-main hover:bg-transparent">
                              {reportData.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className={`${idx % 2 === 1 ? "bg-slate-50 dark:bg-slate-900/40" : "bg-transparent"} hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors`}
                                >
                                  <td className="py-3 px-4 xl:px-5 font-medium whitespace-nowrap break-words">
                                    {row.date}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 whitespace-nowrap break-words">
                                    {row.description}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right whitespace-nowrap text-text-main break-words">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.salaryAmount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right whitespace-nowrap text-text-main break-words">
                                    <span className="text-[10px] sm:text-xs text-text-muted mr-1">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.commAmount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right whitespace-nowrap font-black text-blue-500 break-words">
                                    <span className="text-[10px] sm:text-[11px] opacity-70 mr-0.5">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.amount)}
                                  </td>
                                  {statusFilter !== "PENDING" && (
                                    <td className="py-3 px-4 xl:px-5 text-right whitespace-nowrap font-black text-green-500 break-words">
                                      <span className="text-[10px] sm:text-[11px] opacity-70 mr-0.5">
                                        {currency.code}
                                      </span>
                                      {formatNum(row.totalPaid)}
                                    </td>
                                  )}
                                  <td className="py-3 px-4 xl:px-5 text-right font-black text-red-500 break-words">
                                    <span className="text-[10px] sm:text-[11px] opacity-70 mr-0.5">
                                      {currency.code}
                                    </span>
                                    {formatNum(row.balance)}
                                  </td>
                                  {statusFilter !== "PENDING" && (
                                    <td className="py-3 px-4 xl:px-5 text-center font-medium whitespace-nowrap">
                                      {row.paymentDate
                                        ? formatDate(row.paymentDate)
                                        : ""}
                                    </td>
                                  )}
                                  <td className="py-3 px-4 xl:px-5 text-center">
                                    <span
                                      className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${row.status === "Paid" ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : row.status === "Partial" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
                                    >
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <table className="w-full text-left border-collapse table-auto whitespace-nowrap">
                            <thead>
                              <tr className="bg-slate-800 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider">
                                <th className="py-3 px-4 xl:px-5">
                                  {language === "bn" ? "তারিখ" : "Date"}
                                </th>
                                <th className="py-3 px-4 xl:px-5">
                                  {language === "bn" ? "বিবরণ" : "Description"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  {language === "bn" ? "পরিমাণ" : "Amount"}
                                </th>
                                <th className="py-3 px-4 xl:px-5 text-right">
                                  {language === "bn" ? "ব্যালেন্স" : "Balance"}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[11px] sm:text-[13px] text-text-main">
                              {reportData.map((row, idx) => (
                                <tr
                                  key={idx}
                                  className={`${idx % 2 === 1 ? "bg-slate-50 dark:bg-slate-900/40" : "bg-transparent"} hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors`}
                                >
                                  <td className="py-3 px-4 xl:px-5 font-medium whitespace-nowrap">
                                    {formatDate(row.date)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5">
                                    {row.description}
                                  </td>
                                  <td
                                    className={`py-3 px-4 xl:px-5 text-right font-black ${
                                      row.amount > 0
                                        ? "text-green-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {row.amount > 0 ? "+" : ""}
                                    {formatNum(row.amount)}
                                  </td>
                                  <td className="py-3 px-4 xl:px-5 text-right font-black text-text-main">
                                    {formatNum(row.balance)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>

                    {/* Bottom calculation summary  block */}
                    <div className="flex justify-end">
                      <div className="w-full sm:w-80 bg-theme-card border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-md divide-y divide-black/5 dark:divide-white/5">
                        {selectedType === "TRIP" ? (
                          <>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Trips:
                              </span>
                              <span className="font-extrabold text-blue-500">
                                {totalTripsCount}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                {language === "bn" ? "সর্বমোট কমিশন:" : "Total Commission:"}
                              </span>
                              <span className="font-extrabold text-text-main">
                                <span className="text-[10px] text-text-muted mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + (r.commission || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Amount:
                              </span>
                              <span className="font-extrabold text-text-main">
                                <span className="text-[10px] text-text-muted mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + (r.amount || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Paid:
                              </span>
                              <span className="font-extrabold text-green-500">
                                <span className="text-[10px] text-green-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + (r.paidAmount || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Pending:
                              </span>
                              <span className="font-extrabold text-orange-500">
                                <span className="text-[10px] text-orange-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) =>
                                      acc + (r.pendingAmount || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                          </>
                        ) : selectedType === "DIESEL" ? (
                          <>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs bg-slate-50 dark:bg-slate-900/40 border-b border-black/5 dark:border-white/5">
                              <span className="font-bold text-text-muted">
                                Total Trips:
                              </span>
                              <span className="font-extrabold text-blue-500">
                                {reportData.length}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Trip Diesel:
                              </span>
                              <span className="font-extrabold text-text-main">
                                <span className="text-[10px] text-text-muted mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + (r.tripDiesel || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Extra Diesel:
                              </span>
                              <span className="font-extrabold text-text-main">
                                <span className="text-[10px] text-text-muted mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + (r.extraDiesel || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs bg-slate-50 dark:bg-slate-900/40 border-t border-black/5 dark:border-white/5">
                              <span className="font-bold text-text-muted">
                                Total Paid:
                              </span>
                              <span className="font-extrabold text-green-500">
                                <span className="text-[10px] text-green-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + (r.paidAmount || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs bg-slate-50 dark:bg-slate-900/40">
                              <span className="font-bold text-text-muted">
                                Total Pending:
                              </span>
                              <span className="font-extrabold text-orange-500">
                                <span className="text-[10px] text-orange-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) =>
                                      acc + (r.pendingAmount || 0),
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                          </>
                        ) : selectedType === "SALARY_ONLY" ||
                          selectedType === "SALARY_COMMISSION" ? (
                          <>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Paid:
                              </span>
                              <span className="font-extrabold text-green-500">
                                <span className="text-[10px] text-green-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + r.totalPaid,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Pending:
                              </span>
                              <span className="font-extrabold text-orange-500">
                                <span className="text-[10px] text-orange-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + r.totalPending,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40">
                              <span className="font-bold text-text-muted">
                                Total Expected:
                              </span>
                              <span className="font-black text-text-main text-sm">
                                <span className="text-xs text-text-muted mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(
                                  reportData.reduce(
                                    (acc, r: any) => acc + r.amount,
                                    0,
                                  ),
                                )}
                              </span>
                            </div>
                          </>
                        ) : selectedType === "COMMISSION" ? (
                          <>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Trips:
                              </span>
                              <span className="font-extrabold text-blue-500">
                                {commTripsCount}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Paid:
                              </span>
                              <span className="font-extrabold text-green-500">
                                <span className="text-[10px] text-green-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(commPaid)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                Total Pending:
                              </span>
                              <span className="font-extrabold text-orange-500">
                                <span className="text-[10px] text-orange-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(commPending)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40">
                              <span className="font-bold text-text-muted">
                                Total Expected:
                              </span>
                              <span className="font-black text-text-main text-sm">
                                <span className="text-xs text-text-muted mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(commExpected)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Total Received */}
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                {language === "bn"
                                  ? "মোট রিসিভড:"
                                  : "Total Received:"}
                              </span>
                              <span className="font-extrabold text-green-500">
                                <span className="text-xs text-green-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(totalReceived)}
                              </span>
                            </div>

                            {/* Total Deductions */}
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-xs">
                              <span className="font-bold text-text-muted">
                                {language === "bn"
                                  ? "মোট কর্তন:"
                                  : "Total Deductions:"}
                              </span>
                              <span className="font-extrabold text-red-500">
                                -
                                <span className="text-xs text-red-600/80 mx-1">
                                  {currency.code}
                                </span>
                                {formatNum(Math.abs(totalDeductions))}
                              </span>
                            </div>

                            {/* Net Balance Highlight */}
                            <div className="flex items-center justify-between p-3.5 sm:p-4 text-sm bg-slate-900/[0.03] dark:bg-white/[0.03] border-t-2 border-green-500">
                              <span className="font-black text-text-main">
                                {language === "bn"
                                  ? "নিট ব্যালেন্স:"
                                  : "Net Balance:"}
                              </span>
                              <span className="font-black text-text-main">
                                <span className="text-xs text-blue-600/80 mr-1">
                                  {currency.code}
                                </span>
                                {formatNum(netBalance)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Print Info Footer */}
                    <p className="text-center text-[10px] text-text-muted mt-4 italic">
                      *{" "}
                      {language === "bn"
                        ? "এটি একটি সিস্টেম-জেনারেটেড স্টেটমেন্ট রিপোর্ট।"
                        : "This is a system-generated statement block."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              key="column-select"
              
              
              
              
              className="space-y-6 pt-4 flex flex-col pb-20"
            >
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {availableColumns
                    .filter((col) => !col.mandatory)
                    .map((col) => (
                      <label
                        key={col.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                          col.mandatory
                            ? "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-70 cursor-not-allowed"
                            : "bg-theme-card border-black/5 dark:border-white/5 cursor-pointer hover:border-green-500/50 hover:bg-black-[0.02] dark:hover:bg-white-[0.02]"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center transition-colors shrink-0 ${
                            selectedColumns.includes(col.id)
                              ? "bg-green-500 text-white"
                              : "bg-black/5 dark:bg-white/5 text-transparent border border-black/10 dark:border-white/10"
                          }`}
                        >
                          <Check
                            size={16}
                            className={
                              selectedColumns.includes(col.id)
                                ? "opacity-100"
                                : "opacity-0"
                            }
                          />
                        </div>
                        <span
                          className={`text-[15px] font-bold truncate ${col.mandatory ? "text-text-muted" : "text-text-main"}`}
                        >
                          {col.label}{" "}
                          {col.mandatory && (
                            <span className="ml-2 text-[10px] uppercase text-text-muted">
                              (Default)
                            </span>
                          )}
                        </span>

                        {/* Invisible checkbox for accessibility */}
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedColumns.includes(col.id)}
                          disabled={col.mandatory}
                          onChange={(e) => {
                            if (col.mandatory) return;
                            if (e.target.checked) {
                              setSelectedColumns([...selectedColumns, col.id]);
                            } else {
                              setSelectedColumns(
                                selectedColumns.filter((c) => c !== col.id),
                              );
                            }
                          }}
                        />
                      </label>
                    ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => {
                    setIsColumnSelectModalOpen(false);
                    downloadPDF(selectedColumns);
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-bold text-white bg-green-500 hover:bg-green-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  {language === "bn" ? "পিডিএফ ডাউনলোড করুন" : "Download PDF"}
                </button>
              </div>
            </div>
          )}
        </>
      </div>

      <GlobalDateTimePicker
        isOpen={datePickerConfig.open}
        onClose={() => setDatePickerConfig(prev => ({ ...prev, open: false }))}
        value={datePickerConfig.value}
        onSelect={(val) => {
          if (datePickerConfig.type === 'from') {
            setFromDate(val);
          } else if (datePickerConfig.type === 'to') {
            setToDate(val);
          }
          setDatePickerConfig(prev => ({ ...prev, open: false }));
        }}
        type="date"
        title={datePickerConfig.title}
        language={language}
      />
    </div>
  );
};

export default Statement;
