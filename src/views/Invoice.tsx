import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { 
  FileText, 
  Download, 
  Calendar, 
  ArrowLeft, 
  Search, 
  Check, 
  Printer, 
  User, 
  FileCheck,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Info
} from "lucide-react";

import { downloadPdf } from '../utils/fileUtils';
import { jsPDF } from 'jspdf';
import GlobalDateTimePicker from '../components/GlobalDateTimePicker';

// Standard A4 aspect ratio helper style (Width: 210mm, Height: 297mm)
// For web, we represent it beautifully using standard Tailwind styling.


const InvoiceInput = ({ label, value, onChange, type = "text", options = [], placeholder, isDark, icon, className = "h-14", rows = 2 }: any) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const hasValue = value !== undefined && value !== null && value !== "";
  const isActive = isFocused || hasValue;
  const isDate = type === 'date';
  const isSearchInput = (label || '').toLowerCase().includes('search') || (label || '').toLowerCase().includes('অনুসন্ধান') || (placeholder || '').toLowerCase().includes('search');

  return (
    <div 
      onClick={(e) => {
        if (isDate) {
          e.preventDefault();
          e.stopPropagation();
          setIsPickerOpen(true);
        }
      }}
      className={`relative transition-colors duration-200 rounded-lg bg-transparent border ${className} ${isDate ? 'cursor-pointer' : ''} shadow-none
        ${isFocused 
          ? `z-50 border-[2px] border-purple-500 shadow-none` 
          : `z-20 border-[1px] shadow-none ${isDark ? 'border-white/40 hover:border-white/50' : 'border-black/40 hover:border-black/50'}`}`}
      style={{ boxShadow: 'none' }}
    >
      <label 
        className={`absolute font-extrabold tracking-wider transition-all duration-200 pointer-events-none z-20 shadow-none
          ${isActive 
            ? `top-0 -translate-y-1/2 left-3 text-[10px] px-2 opacity-100 ${isDark ? 'bg-[#121212]' : 'bg-white'} ${isFocused ? 'text-purple-500' : (isDark ? 'text-white/80' : 'text-black/80')}` 
            : `top-1/2 -translate-y-1/2 text-xs opacity-60 ${isDark ? 'text-white' : 'text-gray-900'} ${icon ? 'left-10' : 'left-3'} ${type === 'textarea' ? '!top-4 translate-y-0' : ''}`}`}
        style={{ boxShadow: 'none', textShadow: 'none', filter: 'none' }}
      >
        {label}
      </label>

      {icon && (
        <div className={`absolute left-3 pointer-events-none ${isDark ? 'text-white/60' : 'text-gray-500'} ${type === 'textarea' ? 'top-4' : 'top-1/2 -translate-y-1/2'}`}>
          {icon}
        </div>
      )}

      {type === 'select' ? (
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full h-full rounded-lg outline-none border-none focus:ring-0 transition-all duration-300 bg-transparent ${icon ? 'pl-10' : 'pl-3'} pr-8 text-sm font-normal ${isDark ? 'text-white' : 'text-gray-900'} cursor-pointer appearance-none relative z-10`}
        >
          {options.map((opt: any) => (
            <option key={opt.value} value={opt.value} className={isDark ? 'bg-[#111827] text-white' : 'bg-white text-black'}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ""}
          rows={rows}
          className={`w-full h-full rounded-lg outline-none border-none focus:ring-0 transition-all duration-300 bg-transparent pt-4 pb-2 ${icon ? 'pl-10' : 'pl-3'} pr-3 text-sm font-normal ${isDark ? 'text-white' : 'text-gray-900'} resize-none relative z-10`}
        />
      ) : isDate ? (
        <div className={`w-full h-full flex items-center ${icon ? 'pl-10' : 'pl-3'} pr-3 text-sm font-normal ${isDark ? 'text-white' : 'text-gray-900'} cursor-pointer relative z-10 select-none`}>
          {value || ''}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFocused ? placeholder : ""}
          className={`w-full h-full rounded-lg outline-none border-none focus:ring-0 transition-all duration-300 bg-transparent ${icon ? 'pl-10' : 'pl-3'} pr-3 text-sm font-normal ${isDark ? 'text-white' : 'text-gray-900'} relative z-10`}
          style={{ color: isDark ? 'white' : 'black' }}
        />
      )}
      
      {type === 'select' && (
        <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-white/60' : 'text-gray-500'} z-10`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      )}

      {isDate && (
        <GlobalDateTimePicker
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={(val) => {
            onChange({ target: { value: val } });
          }}
          type="date"
          value={value}
          title={label}
        />
      )}
    </div>
  );
};

const InvoiceView: React.FC = () => {
  const { 
    setView,
    showFeedback, 
    trips, 
    language, 
    currencies, 
    selectedCurrency,
    isDarkMode,
    isNightMode,
    appThemeMode,
    user
  } = useStore();

  const isDark = isNightMode || appThemeMode === 'dark' || isDarkMode;
  const t = TRANSLATIONS[language];
  const isBn = language === 'bn';

  // Currency helper
  const currency = React.useMemo(() => {
    return currencies?.find((c: any) => c.code === selectedCurrency) || { code: "BDT", symbol: "৳" };
  }, [currencies, selectedCurrency]);

  // Filtering states
  const [fromDate, setFromDate] = React.useState<string>(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return firstDay.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = React.useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [selectedCompany, setSelectedCompany] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  
  // Selection and preview
  const [selectedTripIds, setSelectedTripIds] = React.useState<string[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = React.useState<number>(0);

  // Billing customization state
  const [invoiceMetadata, setInvoiceMetadata] = React.useState<any>({
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    preparedBy: "Accounts Department",
    companyName: "Fleetpro Management",
    companyAddress: "Birkat Al Awamer, al wukair, Doha, Qatar",
    companyPhone: "+974 5555 5555",
    companyEmail: "info@fleetpro.qa",
    terms: "Payment is due within 15 days.\nPlease make checks payable to Fleetpro Management."
  });

  React.useEffect(() => {
    if (user) {
      setInvoiceMetadata((prev: any) => ({
        ...prev,
        preparedBy: user.name || prev.preparedBy,
        companyPhone: user.mobileNumber || prev.companyPhone,
        companyEmail: user.email || user.loginEmail || prev.companyEmail,
      }));
    }
  }, [user]);

  const companiesList = React.useMemo(() => {
    const companies = new Set<string>();
    trips.forEach((t: any) => {
      if (t.companyName) companies.add(t.companyName);
    });
    return Array.from(companies);
  }, [trips]);

  const filteredTrips = React.useMemo(() => {
    return trips.filter((t: any) => {
      if (selectedCompany !== "ALL" && t.companyName !== selectedCompany) return false;
      const tDate = new Date(t.date || t.startDate);
      if (fromDate && tDate < new Date(fromDate)) return false;
      if (toDate && tDate > new Date(toDate)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (t.invoiceNo && t.invoiceNo.toLowerCase().includes(q)) ||
          (t.containerNo && t.containerNo.toLowerCase().includes(q)) ||
          (t.vehicleNo && t.vehicleNo.toLowerCase().includes(q)) ||
          (t.companyName && t.companyName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [trips, selectedCompany, fromDate, toDate, searchQuery]);

  // Retrieve actual selected trips
  const selectedTrips = useMemo(() => {
    return trips.filter(t => selectedTripIds.includes(t.id));
  }, [trips, selectedTripIds]);

  // Active trip for preview
  const activePreviewTrip = useMemo(() => {
    if (selectedTrips.length === 0) return null;
    return selectedTrips[activePreviewIndex] || selectedTrips[0];
  }, [selectedTrips, activePreviewIndex]);

  const handleSelectTrip = (id: string) => {
    setSelectedTripIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTripIds.length === filteredTrips.length) {
      setSelectedTripIds([]);
    } else {
      setSelectedTripIds(filteredTrips.map(t => t.id));
    }
  };

  // Formatting helpers
  const formatNum = (num: number) => {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  // PDF Export Engine
  const handleDownloadPDF = async () => {
    if (selectedTrips.length === 0) return;

    // A4 Paper: 210mm x 297mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    selectedTrips.forEach((trip, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Palette
      const primaryColor = [12, 45, 72]; // #0C2D48 Dark Navy
      const secondaryColor = [80, 90, 100]; // Slate Gray
      const borderGrey = [218, 224, 233]; // Clean light gray for borders
      const tableRowTint = [247, 249, 252]; // Soft corporate background tint
      
      // Top decorative Accent Strip
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 5, 'F');

      // Left vertical accent bar
      doc.setFillColor(168, 85, 247); // #a855f7 Purple Accent
      doc.rect(0, 5, 4, 292, 'F');

      // Header Brand
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(invoiceMetadata.companyName.toUpperCase(), 15, 22);

      // Corporate subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`${invoiceMetadata.companyAddress}`, 15, 27);
      doc.text(`Phone: ${invoiceMetadata.companyPhone}   |   Email: ${invoiceMetadata.companyEmail}`, 15, 31.5);

      // Divider line
      doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
      doc.setLineWidth(0.3);
      doc.line(15, 36, 195, 36);

      // Title - Left
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(24, 30, 38);
      doc.text("INVOICE", 15, 48);

      // Metadata card - Right aligned
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("INVOICE SPECIFICS", 135, 45);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(60, 66, 74);
      doc.text(`Invoice No:`, 135, 50.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`INV-${trip.invoiceNumber || trip.id.substring(0, 8).toUpperCase()}`, 157, 50.5);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Date:`, 135, 55.5);
      doc.text(`${formatDate(invoiceMetadata.invoiceDate)}`, 157, 55.5);
      
      doc.text(`Currency:`, 135, 60.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${currency.code} (${currency.symbol})`, 157, 60.5);

      // Bill To Box (Left Aligned)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("CLIENT / BILLED TO:", 15, 61);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(24, 30, 38);
      doc.text(trip.companyName || "N/A", 15, 66.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      
      // Handle potential multiple lines in billing address
      const billingLines = doc.splitTextToSize(invoiceMetadata.billToAddress, 100);
      doc.text(billingLines, 15, 71.5);

      // Section: Shipment Info Card Layout
      const infoBoxY = 83;
      doc.setFillColor(250, 251, 253);
      doc.rect(15, infoBoxY, 180, 38, 'F');
      
      doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
      doc.setLineWidth(0.4);
      doc.rect(15, infoBoxY, 180, 38, 'S');

      // Card Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, infoBoxY, 180, 7.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("SHIPMENT & TRANSPORTATION LOGISTICS", 19, infoBoxY + 5);

      // Column 1 Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      
      doc.text("From:", 18, infoBoxY + 13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(`${trip.loadingPlace || '-'} (${trip.fromCountry || '-'})`, 42, infoBoxY + 13);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Loading Date:", 18, infoBoxY + 18.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(`${formatDate(trip.loadingDate)} ${trip.loadingTime || ''}`, 42, infoBoxY + 18.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Destination:", 18, infoBoxY + 24);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(`${trip.deliveryPlace || '-'} (${trip.arrivalCountry || '-'})`, 42, infoBoxY + 24);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Delivery Date:", 18, infoBoxY + 29.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(`${formatDate(trip.deliveryDate)} ${trip.deliveryTime || ''}`, 42, infoBoxY + 29.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Trip Type:", 18, infoBoxY + 35);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(trip.loadingType || 'N/A', 42, infoBoxY + 35);

      // Column 2 Info
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Vehicle No:", 112, infoBoxY + 13);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(trip.vehicleNumber || 'N/A', 141, infoBoxY + 13);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Trailer No:", 112, infoBoxY + 18.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(trip.trailerNumber || 'N/A', 141, infoBoxY + 18.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Container No:", 112, infoBoxY + 24);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(`${trip.containerNumber || 'N/A'} (${trip.containerTitle || 'N/A'})`, 141, infoBoxY + 24);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Bayan / Custom:", 112, infoBoxY + 29.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(trip.bayanNumber || 'N/A', 141, infoBoxY + 29.5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("Diesel Receipt No:", 112, infoBoxY + 35);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(trip.generatorReceiveNumber || 'N/A', 141, infoBoxY + 35);

      // Items Table Generation
      const tableY = 127;
      
      // Draw Table Header Background
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, tableY, 180, 9, 'F');

      // Table Header Titles
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("SL", 20, tableY + 6, { align: 'center' });
      doc.text("Transportation Service / Item Description", 28, tableY + 6);
      doc.text("Category", 125, tableY + 6);
      doc.text("Amount", 190, tableY + 6, { align: 'right' });

      // Financial components
      const baseFare = Number(trip.dieselPrice) || 0;
      const commission = Number(trip.commission) || 0;
      const extraDiesel = Number(trip.extraDiesel) || 0;
      const generatorDiesel = Number(trip.generatorDiesel) || 0;
      const friday = Number(trip.friday) || 0;
      const bonus = Number(trip.bonus) || 0;
      const overtime = Number(trip.overtime) || 0;

      const items = [
        { desc: `Base trip transportation fare (${trip.loadingPlace || '-'} to ${trip.deliveryPlace || '-'})`, cat: 'Base Fare', val: baseFare },
        { desc: 'Driver surcharge & operations commission', cat: 'Commission', val: commission },
        ...(extraDiesel > 0 ? [{ desc: `Additional fuel diesel allowance (${trip.extraDieselReason || 'Special Route'})`, cat: 'Extra Fuel', val: extraDiesel }] : []),
        ...(generatorDiesel > 0 ? [{ desc: 'Refrigerated container auxiliary generator fuel', cat: 'Gen Diesel', val: generatorDiesel }] : []),
        ...(friday > 0 ? [{ desc: 'Friday or official weekend service charge', cat: 'Weekend Fee', val: friday }] : []),
        ...(bonus > 0 ? [{ desc: 'Safe cargo delivery incentive / driver bonus', cat: 'Incentive', val: bonus }] : []),
        ...(overtime > 0 ? [{ desc: 'Overtime operations and waiting compensation', cat: 'Overtime', val: overtime }] : []),
      ];

      let currentY = tableY + 9;
      doc.setFontSize(8);

      items.forEach((item, itemIdx) => {
        const wrappedDesc = doc.splitTextToSize(item.desc, 90);
        const rowHeight = Math.max(9, wrappedDesc.length * 4 + 4);

        // Alternating zebra striping
        if (itemIdx % 2 === 1) {
          doc.setFillColor(tableRowTint[0], tableRowTint[1], tableRowTint[2]);
          doc.rect(15, currentY, 180, rowHeight, 'F');
        }

        // Horizontal row separator line
        doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
        doc.setLineWidth(0.2);
        doc.line(15, currentY + rowHeight, 195, currentY + rowHeight);

        // Render cell contents
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 56, 64);
        doc.text(String(itemIdx + 1), 20, currentY + 5.5, { align: 'center' });
        doc.text(wrappedDesc, 28, currentY + 5.5);
        doc.text(item.cat, 125, currentY + 5.5);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(24, 30, 38);
        doc.text(`${currency.symbol} ${formatNum(item.val)}`, 190, currentY + 5.5, { align: 'right' });

        // Vertical divider lines for columns to make it look professional
        doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
        doc.line(25, currentY, 25, currentY + rowHeight);
        doc.line(121, currentY, 121, currentY + rowHeight);
        doc.line(155, currentY, 155, currentY + rowHeight);

        currentY += rowHeight;
      });

      // Outer table border outline
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.4);
      doc.rect(15, tableY, 180, currentY - tableY, 'S');

      // Summary block spacing
      currentY += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      
      // Subtotal Row
      doc.text("SUBTOTAL:", 135, currentY + 3);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(40, 44, 52);
      doc.text(`${currency.code} ${formatNum(trip.totalAmount || 0)}`, 190, currentY + 3, { align: 'right' });

      // Paid Row
      currentY += 6.5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text("TOTAL PAID:", 135, currentY + 3);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(16, 124, 65); // Corporate green for paid
      doc.text(`${currency.code} ${formatNum(trip.paidAmount || 0)}`, 190, currentY + 3, { align: 'right' });

      // Balance Due Highlighted row
      currentY += 6.5;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(130, currentY, 65, 8.5, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text("BALANCE DUE:", 134, currentY + 5.5);
      doc.text(`${currency.code} ${formatNum(Math.max(0, (trip.totalAmount || 0) - (trip.paidAmount || 0)))}`, 190, currentY + 5.5, { align: 'right' });

      // Footer - Terms & Conditions Box
      const termsY = 236;
      doc.setFillColor(252, 252, 253);
      doc.rect(15, termsY, 105, 26, 'F');
      doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
      doc.setLineWidth(0.3);
      doc.rect(15, termsY, 105, 26, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("TERMS & CONDITIONS", 18, termsY + 5);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      const termsLines = doc.splitTextToSize(invoiceMetadata.terms, 98);
      doc.text(termsLines, 18, termsY + 10);

      // Signatures
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(40, 44, 52);
      doc.text("Prepared & Authorized By", 142, termsY + 12);
      doc.line(138, termsY + 8, 188, termsY + 8); // Signature line
      doc.setFont('helvetica', 'normal');
      doc.text(invoiceMetadata.preparedBy, 142, termsY + 16.5);

      // Footer brand automation trace
      doc.setFontSize(6.5);
      doc.setTextColor(170, 180, 190);
      doc.text(`This is a computer generated invoice document powered by FleetPro TMS. Trace Key: ${trip.id.substring(0,12).toUpperCase()}`, 15, 282);
    });

    const fileCount = selectedTrips.length;
    const fileName = fileCount === 1 
      ? `Invoice_INV-${selectedTrips[0].invoiceNumber || selectedTrips[0].id.substring(0,8)}.pdf`
      : `Batch_Invoices_${fileCount}_Trips.pdf`;

    await downloadPdf(doc, fileName, showFeedback, language);
  };

  return (
    <div className="flex flex-col gap-6 p-1 md:p-4 max-w-7xl mx-auto">
      

      {/* Top Header section containing the Download button */}
      {selectedTrips.length > 0 && (
        <div className="flex justify-end border-b border-white/10 pb-4">
          <button
            
            
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/20 transition-all text-sm"
          >
            <Download size={16} />
            {isBn 
              ? `ডাউনলোড করুন (${selectedTrips.length} টি ইনভয়েস PDF)` 
              : `Download (${selectedTrips.length} Invoice PDF)`
            }
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left pane: Query, List of trips, configurations */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* SEARCH & FILTERS PANEL */}
          <div className="p-5 bg-theme-card rounded-[10px] border border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] transition-all invoice-panel">
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-4 flex items-center gap-2 text-text-main">
              <Sliders size={16} className="text-[#a855f7]" />
              {isBn ? 'ফিল্টার এবং অনুসন্ধান' : 'Filter & Search Trips'}
            </h3>

            <div className="space-y-4">
              {/* Date Filters */}
              <div className="grid grid-cols-2 gap-3">
                <InvoiceInput label={isBn ? 'শুরুর তারিখ' : 'From Date'} type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} isDark={isDark} />
                <InvoiceInput label={isBn ? 'শেষ তারিখ' : 'To Date'} type="date" value={toDate} onChange={e => setToDate(e.target.value)} isDark={isDark} />
              </div>

              {/* Company Filter */}
              <InvoiceInput label={isBn ? 'কোম্পানি' : 'Client / Company'} type="select" value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} isDark={isDark} options={[{value: 'ALL', label: isBn ? 'সকল কোম্পানি' : 'All Companies'}, ...companiesList.map(name => ({value: name, label: name}))]} />

              {/* Search text query */}
              <InvoiceInput label={isBn ? 'অনুসন্ধান করুন' : 'Search container, invoice, vehicle'} type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g. MSKU9045, Truck, Invoice No..." icon={<Search size={16} />} isDark={isDark} />
            </div>
          </div>

          {/* TRIPS LIST */}
          <div className="p-5 bg-theme-card rounded-[10px] border border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] transition-all invoice-panel">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-text-main flex items-center gap-2">
                <FileCheck size={16} className="text-emerald-500" />
                {isBn ? 'ট্রিপসমূহ' : 'Available Trips'} ({filteredTrips.length})
              </h3>
              {filteredTrips.length > 0 && (
                <button 
                  onClick={handleSelectAll}
                  className="text-xs font-black text-purple-600 hover:text-purple-700 hover:underline bg-transparent"
                >
                  {selectedTripIds.length === filteredTrips.length 
                    ? (isBn ? 'সব মুছুন' : 'Deselect All') 
                    : (isBn ? 'সব সিলেক্ট' : 'Select All')
                  }
                </button>
              )}
            </div>

            {filteredTrips.length === 0 ? (
              <div className="text-center py-10 text-text-muted flex flex-col items-center justify-center gap-2">
                <Info size={28} className="opacity-40" />
                <span className="text-xs font-semibold">
                  {isBn ? 'কোন ট্রিপ পাওয়া যায়নি।' : 'No trips matched your filter.'}
                </span>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredTrips.map(trip => {
                  const isSelected = selectedTripIds.includes(trip.id);
                  return (
                    <div 
                      key={trip.id}
                      onClick={() => handleSelectTrip(trip.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected 
                          ? (isDark 
                              ? 'bg-purple-950/40 border-purple-500' 
                              : 'bg-purple-50/90 border-purple-600 ring-2 ring-purple-600/10'
                            )
                          : (isDark 
                              ? 'bg-black/10 border-white/5 hover:bg-black/20' 
                              : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-slate-100/90 shadow-sm'
                            )
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                          isSelected 
                            ? 'bg-purple-600 border-purple-600 text-white' 
                            : (isDark ? 'border-white/20 bg-black/20' : 'border-gray-300 bg-white shadow-inner')
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="text-left">
                          <p className={`text-xs font-black ${isDark ? 'text-text-main' : 'text-gray-900'}`}>
                            {trip.containerNumber || 'No Container'}
                          </p>
                          <p className={`text-[10px] mt-0.5 font-medium ${isDark ? 'text-text-muted' : 'text-gray-500'}`}>
                            {trip.companyName || 'N/A'} • {formatDate(trip.loadingDate)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-extrabold ${isDark ? 'text-text-main' : 'text-gray-900'}`}>
                          {currency.symbol} {formatNum(trip.totalAmount || 0)}
                        </p>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">
                          {trip.invoiceNumber ? `INV: ${trip.invoiceNumber}` : 'No Invoice ID'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* EDITABLE BILLING SETTINGS */}
          <div className="p-5 bg-theme-card rounded-[10px] border border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] transition-all invoice-panel">
            <h3 className="font-extrabold text-xs uppercase tracking-wider mb-4 text-text-main flex items-center gap-2">
              <Sliders size={16} className="text-[#a855f7]" />
              {isBn ? 'ইনভয়েস ইনফরমেশন কাস্টমাইজ' : 'Customize Billing Details'}
            </h3>

            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <InvoiceInput label={isBn ? 'ইনভয়েস ডেট' : 'Invoice Date'} type="date" value={invoiceMetadata.invoiceDate} onChange={e => setInvoiceMetadata(prev => ({ ...prev, invoiceDate: e.target.value }))} isDark={isDark} />
                <InvoiceInput label={isBn ? 'ডু ডেট' : 'Due Date'} type="date" value={invoiceMetadata.dueDate} onChange={e => setInvoiceMetadata(prev => ({ ...prev, dueDate: e.target.value }))} isDark={isDark} />
              </div>

              <InvoiceInput label={isBn ? 'প্রস্তুতকারক' : 'Prepared By'} type="text" value={invoiceMetadata.preparedBy} onChange={e => setInvoiceMetadata(prev => ({ ...prev, preparedBy: e.target.value }))} placeholder="Prepared By Name/Title" isDark={isDark} />

              <InvoiceInput label={isBn ? 'কোম্পানির নাম' : 'Our Company Name'} type="text" value={invoiceMetadata.companyName} onChange={e => setInvoiceMetadata(prev => ({ ...prev, companyName: e.target.value }))} isDark={isDark} />

              <div className="grid grid-cols-2 gap-3">
                <InvoiceInput label={isBn ? 'মোবাইল নাম্বার' : 'Our Mobile Number'} type="text" value={invoiceMetadata.companyPhone} onChange={e => setInvoiceMetadata(prev => ({ ...prev, companyPhone: e.target.value }))} isDark={isDark} />
                <InvoiceInput label={isBn ? 'ইমেইল আইডি' : 'Our Email ID'} type="text" value={invoiceMetadata.companyEmail} onChange={e => setInvoiceMetadata(prev => ({ ...prev, companyEmail: e.target.value }))} isDark={isDark} />
              </div>

              <InvoiceInput label={isBn ? 'বিলিং এড্রেস' : 'Company Address'} type="textarea" value={invoiceMetadata.companyAddress} onChange={e => setInvoiceMetadata(prev => ({ ...prev, companyAddress: e.target.value }))} isDark={isDark} rows={2} className="h-24" />

              <InvoiceInput label={isBn ? 'পেমেন্ট শর্তাবলী' : 'Payment Terms & Notes'} type="textarea" value={invoiceMetadata.terms} onChange={e => setInvoiceMetadata(prev => ({ ...prev, terms: e.target.value }))} isDark={isDark} rows={2} className="h-24" />
            </div>
          </div>

        </div>

        {/* Right pane: Interactive A4 Invoice Preview */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-black uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Sparkles size={14} className="text-amber-500 animate-pulse" />
              {isBn ? 'ইনভয়েস লাইভ প্রিভিউ (A4 সাইজ)' : 'Live Invoice Preview (A4 Size Paper)'}
            </span>

            {selectedTrips.length > 1 && (
              <div className="flex items-center gap-2">
                <button 
                  disabled={activePreviewIndex === 0}
                  onClick={() => setActivePreviewIndex(prev => Math.max(0, prev - 1))}
                  className={`px-2 py-1 rounded-md text-xs font-bold border transition-all ${
                    activePreviewIndex === 0 
                      ? 'opacity-40 cursor-not-allowed text-text-muted border-white/5' 
                      : 'hover:bg-purple-600 hover:text-white border-white/10 text-text-main'
                  }`}
                >
                  {isBn ? 'পূর্ববর্তী' : 'Prev'}
                </button>
                <span className="text-xs font-bold text-text-main">
                  {activePreviewIndex + 1} / {selectedTrips.length}
                </span>
                <button 
                  disabled={activePreviewIndex === selectedTrips.length - 1}
                  onClick={() => setActivePreviewIndex(prev => Math.min(selectedTrips.length - 1, prev + 1))}
                  className={`px-2 py-1 rounded-md text-xs font-bold border transition-all ${
                    activePreviewIndex === selectedTrips.length - 1 
                      ? 'opacity-40 cursor-not-allowed text-text-muted border-white/5' 
                      : 'hover:bg-purple-600 hover:text-white border-white/10 text-text-main'
                  }`}
                >
                  {isBn ? 'পরবর্তী' : 'Next'}
                </button>
              </div>
            )}
          </div>

          {!activePreviewTrip ? (
            <div className="p-12 bg-theme-card rounded-[10px] border border-dashed border-[var(--dynamic-card-border)] shadow-[var(--dynamic-card-shadow)] flex flex-col items-center justify-center text-center min-h-[500px] transition-all">
              <FileText className="text-text-muted opacity-30 animate-bounce mb-4" size={56} />
              <h4 className="font-bold text-lg text-text-main">
                {isBn ? 'কোন ট্রিপ সিলেক্ট করা হয়নি' : 'No Trip Selected'}
              </h4>
              <p className="text-xs text-text-muted max-w-sm mt-1.5 leading-relaxed">
                {isBn 
                  ? 'বামপাশের তালিকা থেকে ইনভয়েস তৈরি করার জন্য এক বা একাধিক ট্রিপ সিলেক্ট করুন।' 
                  : 'Select one or multiple trips from the list on the left to instantly generate and preview A4 invoices.'
                }
              </p>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              {/* Paper container styled exactly with A4 Aspect Ratio */}
              <div 
                id="invoice-print-area"
                className="w-full aspect-[1/1.414] bg-white text-gray-900 p-8 sm:p-12 shadow-2xl rounded-sm border border-gray-200 flex flex-col justify-between text-left text-sm relative"
                style={{ contentVisibility: 'auto' }}
              >
                {/* Colored Left Accent Bar */}
                <div className="absolute top-0 left-0 bottom-0 w-2.5 bg-[#0A4A70]"></div>

                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="flex justify-between items-start gap-4 border-b border-gray-200 pb-5">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#0A4A70] uppercase tracking-wide leading-tight">
                        {invoiceMetadata.companyName}
                      </h2>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-xs font-semibold">
                        {invoiceMetadata.companyAddress}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-semibold">
                        Phone: {invoiceMetadata.companyPhone} | Email: {invoiceMetadata.companyEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-2xl font-black text-gray-800 tracking-wider">INVOICE</h3>
                      <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
                        Invoice No: <span className="text-[#0A4A70]">INV-{activePreviewTrip.invoiceNumber || activePreviewTrip.id.substring(0, 8).toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Billing Metadata & Billing Address */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Billed To:</span>
                      <h4 className="font-bold text-xs text-gray-800 mt-1 uppercase">
                        {activePreviewTrip.companyName || 'N/A'}
                      </h4>
                      <p className="text-[10px] text-gray-500 mt-1 max-w-xs font-medium whitespace-pre-wrap">
                        {invoiceMetadata.billToAddress}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Invoice Date:</span>
                        <p className="text-[10px] font-bold text-gray-700 mt-0.5">{formatDate(invoiceMetadata.invoiceDate)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Due Date:</span>
                        <p className="text-[10px] font-bold text-gray-700 mt-0.5">{formatDate(invoiceMetadata.dueDate)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Currency:</span>
                        <p className="text-[10px] font-bold text-gray-700 mt-0.5">{currency.code} ({currency.symbol})</p>
                      </div>
                    </div>
                  </div>

                  {/* Transportation specifics table */}
                  <div className="bg-gray-50 p-4 rounded border border-gray-150">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2 border-b border-gray-200 pb-1">
                      Shipment & Trip Logistics
                    </span>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px]">
                      <div>
                        <span className="font-bold text-gray-500">From:</span> <span className="font-medium text-gray-800">{activePreviewTrip.loadingPlace || '-'} ({activePreviewTrip.fromCountry || '-'})</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500">Vehicle / Truck No:</span> <span className="font-medium text-gray-800">{activePreviewTrip.vehicleNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500">Loading Date:</span> <span className="font-medium text-gray-800">{formatDate(activePreviewTrip.loadingDate)} {activePreviewTrip.loadingTime || ''}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500">Trailer Number:</span> <span className="font-medium text-gray-800">{activePreviewTrip.trailerNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500">Destination:</span> <span className="font-medium text-gray-800">{activePreviewTrip.deliveryPlace || '-'} ({activePreviewTrip.arrivalCountry || '-'})</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500">Container No:</span> <span className="font-medium text-gray-800">{activePreviewTrip.containerNumber || 'N/A'} ({activePreviewTrip.containerTitle || 'N/A'})</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500">Delivery Date:</span> <span className="font-medium text-gray-800">{formatDate(activePreviewTrip.deliveryDate)} {activePreviewTrip.deliveryTime || ''}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500">Bayan / Custom No:</span> <span className="font-medium text-gray-800">{activePreviewTrip.bayanNumber || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-bold text-gray-500">Diesel Receipt No:</span> <span className="font-medium text-gray-800">{activePreviewTrip.generatorReceiveNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Breakdown Items list */}
                  <div className="border border-gray-200 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-[#0A4A70] text-white font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-8 text-center">Sl</th>
                          <th className="py-2.5 px-3">Transportation Item Description</th>
                          <th className="py-2.5 px-3 text-right">Unit Category</th>
                          <th className="py-2.5 px-3 text-right w-24">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {/* Alternate rows */}
                        <tr className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-center text-gray-500">1</td>
                          <td className="py-2.5 px-3 font-semibold text-gray-800">
                            Base Transportation Fare from {activePreviewTrip.loadingPlace || '-'} to {activePreviewTrip.deliveryPlace || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-500">Base Trip</td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                            {currency.symbol} {formatNum(activePreviewTrip.dieselPrice || 0)}
                          </td>
                        </tr>

                        <tr className="bg-gray-50/50 hover:bg-gray-50">
                          <td className="py-2.5 px-3 text-center text-gray-500">2</td>
                          <td className="py-2.5 px-3 font-semibold text-gray-800">Driver surcharge / trip commission</td>
                          <td className="py-2.5 px-3 text-right text-gray-500">Commission</td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                            {currency.symbol} {formatNum(activePreviewTrip.commission || 0)}
                          </td>
                        </tr>

                        {(activePreviewTrip.extraDiesel || 0) > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 text-center text-gray-500">3</td>
                            <td className="py-2.5 px-3 font-semibold text-gray-800">
                              Additional Diesel Allowance ({activePreviewTrip.extraDieselReason || 'Extra Diesel'})
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-500">Extra Fuel</td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                              {currency.symbol} {formatNum(activePreviewTrip.extraDiesel || 0)}
                            </td>
                          </tr>
                        )}

                        {(activePreviewTrip.generatorDiesel || 0) > 0 && (
                          <tr className="bg-gray-50/50 hover:bg-gray-50">
                            <td className="py-2.5 px-3 text-center text-gray-500">4</td>
                            <td className="py-2.5 px-3 font-semibold text-gray-800">Generator auxiliary diesel fuel</td>
                            <td className="py-2.5 px-3 text-right text-gray-500">Gen Fuel</td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                              {currency.symbol} {formatNum(activePreviewTrip.generatorDiesel || 0)}
                            </td>
                          </tr>
                        )}

                        {(activePreviewTrip.friday || 0) > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 text-center text-gray-500">5</td>
                            <td className="py-2.5 px-3 font-semibold text-gray-800">Weekend operations service</td>
                            <td className="py-2.5 px-3 text-right text-gray-500">Weekend</td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                              {currency.symbol} {formatNum(activePreviewTrip.friday || 0)}
                            </td>
                          </tr>
                        )}

                        {(activePreviewTrip.bonus || 0) > 0 && (
                          <tr className="bg-gray-50/50 hover:bg-gray-50">
                            <td className="py-2.5 px-3 text-center text-gray-500">6</td>
                            <td className="py-2.5 px-3 font-semibold text-gray-800">Trip performance safety bonus</td>
                            <td className="py-2.5 px-3 text-right text-gray-500">Bonus</td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                              {currency.symbol} {formatNum(activePreviewTrip.bonus || 0)}
                            </td>
                          </tr>
                        )}

                        {(activePreviewTrip.overtime || 0) > 0 && (
                          <tr className="hover:bg-gray-50">
                            <td className="py-2.5 px-3 text-center text-gray-500">7</td>
                            <td className="py-2.5 px-3 font-semibold text-gray-800">Overtime hours operations</td>
                            <td className="py-2.5 px-3 text-right text-gray-500">Overtime</td>
                            <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                              {currency.symbol} {formatNum(activePreviewTrip.overtime || 0)}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Calculations summary row */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-1.5 text-[10px] text-gray-700">
                      <div className="flex justify-between border-b border-gray-100 pb-1">
                        <span className="font-medium">Subtotal:</span>
                        <span className="font-bold text-gray-900">{currency.symbol} {formatNum(activePreviewTrip.totalAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1">
                        <span className="font-medium">Paid Amount:</span>
                        <span className="font-bold text-emerald-600">{currency.symbol} {formatNum(activePreviewTrip.paidAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between bg-[#0A4A70] text-white p-1.5 rounded font-bold">
                        <span>Balance Due:</span>
                        <span>{currency.code} {formatNum(Math.max(0, (activePreviewTrip.totalAmount || 0) - (activePreviewTrip.paidAmount || 0)))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer notes & signatures */}
                <div className="flex justify-between items-end gap-6 pt-6 border-t border-gray-200">
                  <div className="max-w-[320px]">
                    <p className="text-[9px] uppercase font-bold text-gray-400">Terms & Notes:</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 leading-normal">
                      {invoiceMetadata.terms}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="w-32 border-b border-gray-300 mx-auto"></div>
                    <p className="text-[9px] font-bold text-gray-700">Prepared By</p>
                    <p className="text-[9px] text-gray-500">{invoiceMetadata.preparedBy}</p>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
