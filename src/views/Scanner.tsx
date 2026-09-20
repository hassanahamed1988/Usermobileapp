import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants';
import { 
  Scan, 
  Camera, 
  Type, 
  FileText, 
  Image as ImageIcon, 
  Crop, 
  Sparkles, 
  History, 
  Share2, 
  X, 
  Upload, 
  ChevronLeft, 
  ChevronRight,
  Download, 
  Trash2, 
  RotateCw, 
  RotateCcw,
  Check, 
  Sliders, 
  FileDown, 
  Eye, 
  Copy,
  IdCard,
  Globe,
  Fingerprint,
  Zap,
  ZapOff,
  RefreshCw,
  Maximize,
  Grid,
  Settings,
  Volume2,
  VolumeX,
  Layers,
  Focus,
  User,
  Edit3,
  Edit,
  Palette
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { 
  PdfSettingsScreen, 
  PdfSettingsConfig, 
  DEFAULT_PAGE_SIZES 
} from '../components/PdfSettingsScreen';

// ----------------------------------------------------------------------
// CENTRAL CONFIGURATION FOR SCANNER FEATURES
// ----------------------------------------------------------------------
export interface ScannerFeatureItem {
  id: string;
  icon: React.ReactNode;
  labelEn: string;
  labelBn: string;
  color: string;
  descriptionEn: string;
  descriptionBn: string;
}

export const SCANNER_FEATURES: ScannerFeatureItem[] = [
  { 
    id: 'SCAN_ID_CARD', 
    icon: <IdCard size={24} />, 
    color: '#3b82f6', 
    labelEn: 'ID Card Scan', 
    labelBn: 'আইডি কার্ড স্ক্যান', 
    descriptionEn: 'Scan and extract National ID cards / badges', 
    descriptionBn: 'জাতীয় পরিচয়পত্র বা কাজের আইডি কার্ড স্ক্যান করুন' 
  },
  { 
    id: 'SCAN_PASSPORT', 
    icon: <Globe size={24} />, 
    color: '#10b981', 
    labelEn: 'Passport Scan', 
    labelBn: 'পাসপোর্ট স্ক্যান', 
    descriptionEn: 'Scan and process international passport pages', 
    descriptionBn: 'আন্তর্জাতিক পাসপোর্ট স্ক্যান ও প্রসেস করুন' 
  },
  { 
    id: 'SCAN_DRIVING_LICENSE', 
    icon: <Fingerprint size={24} />, 
    color: '#f59e0b', 
    labelEn: 'Driving License Scan', 
    labelBn: 'ড্রাইভিং লাইসেন্স স্ক্যান', 
    descriptionEn: 'Scan and verify driver licenses & permits', 
    descriptionBn: 'ড্রাইভিং লাইসেন্স স্ক্যান ও তথ্য যাচাই করুন' 
  },
  { 
    id: 'DOCUMENT_SCAN', 
    icon: <Camera size={24} />, 
    color: '#06b6d4', 
    labelEn: 'Document Scan', 
    labelBn: 'ডকুমেন্ট স্ক্যান', 
    descriptionEn: 'Scan invoices, receipts or notes using camera', 
    descriptionBn: 'ক্যামেরা দিয়ে ইনভয়েস, রসিদ বা নোট স্ক্যান করুন' 
  },
  { 
    id: 'OCR_EXTRACT', 
    icon: <Type size={24} />, 
    color: '#818cf8', 
    labelEn: 'OCR / Text Extract', 
    labelBn: 'ওসিআর / লেখা নিষ্কাশন', 
    descriptionEn: 'Convert scanned images to editable digital text', 
    descriptionBn: 'স্ক্যান করা ছবি থেকে এডিটেবল ডিজিটাল টেক্সট বের করুন' 
  },
  { 
    id: 'SCAN_PDF', 
    icon: <FileText size={24} />, 
    color: '#ef4444', 
    labelEn: 'Scan to PDF', 
    labelBn: 'পিডিএফ এ রূপান্তর', 
    descriptionEn: 'Export scanned documents as professional PDFs', 
    descriptionBn: 'স্ক্যান করা ফাইল হাই-কোয়ালিটি পিডিএফ হিসেবে সংরক্ষণ করুন' 
  },
  { 
    id: 'SCAN_IMAGE', 
    icon: <ImageIcon size={24} />, 
    color: '#10b981', 
    labelEn: 'Scan to Image', 
    labelBn: 'ছবি হিসেবে সেভ করুন', 
    descriptionEn: 'Save processed document directly to your gallery', 
    descriptionBn: 'সম্পাদিত ডকুমেন্ট সরাসরি গ্যালারিতে সংরক্ষণ করুন' 
  },
  { 
    id: 'CROP_ADJUST', 
    icon: <Crop size={24} />, 
    color: '#fbbf24', 
    labelEn: 'Crop & Adjust', 
    labelBn: 'ক্রপ ও সাইজ পরিবর্তন', 
    descriptionEn: 'Rotate, crop borders and adjust aspect ratio', 
    descriptionBn: 'বর্ডার ক্রপ করুন, ঘোরান এবং অ্যাসপেক্ট রেশিও ঠিক করুন' 
  },
  { 
    id: 'ENHANCE', 
    icon: <Sparkles size={24} />, 
    color: '#a855f7', 
    labelEn: 'Enhance / Auto Improve', 
    labelBn: 'উজ্জ্বলতা ও স্পষ্ট করুন', 
    descriptionEn: 'Auto whiten paper and increase text contrast', 
    descriptionBn: 'কাগজ সাদা করুন এবং টেক্সট কন্ট্রাস্ট বাড়িয়ে স্পষ্ট করুন' 
  },
  { 
    id: 'HISTORY', 
    icon: <History size={24} />, 
    color: '#6b7280', 
    labelEn: 'Scan History', 
    labelBn: 'স্ক্যান ইতিহাস', 
    descriptionEn: 'View, edit or download your previous scans', 
    descriptionBn: 'পূর্বে স্ক্যান করা সব ফাইলের তালিকা দেখুন' 
  },
  { 
    id: 'SHARE', 
    icon: <Share2 size={24} />, 
    color: '#ec4899', 
    labelEn: 'Share / Export', 
    labelBn: 'শেয়ার ও এক্সপোর্ট', 
    descriptionEn: 'Instantly share via Email, WhatsApp or Bluetooth', 
    descriptionBn: 'ইমেইল, হোয়াটসঅ্যাপ বা ব্লুটুথে ফাইল শেয়ার করুন' 
  }
];

const MOCK_OCR_TEXT = `FLEETPRO LOGISTICS INC.
INVOICE / RECEIPT SUMMARY
Date: 2026-09-19
Invoice No: FP-992014
Customer: National Transport Services Ltd.
Vehicle Plate: DHAKA METRO-TA 11-4092
------------------------------------------------
Item 1: Diesel Refuel (450 Liters)     BDT 49,500.00
Item 2: Highway Toll & Transit Pass     BDT 1,200.00
Item 3: Routine Maintenance & Filters   BDT 4,800.00
------------------------------------------------
SUBTOTAL:                              BDT 55,500.00
VAT / TAX (5%):                         BDT  2,775.00
TOTAL AMOUNT:                          BDT 58,275.00
------------------------------------------------
Status: PAID IN FULL (Cash / Digital Payment)`;

interface ScannedItem {
  id: string;
  name: string;
  date: string;
  image: string;
  text?: string;
  size: string;
}

// Predefined Demo Documents for seamless simulation
const DEMO_DOCUMENTS = [
  {
    name: 'Invoice_1082_Sample.jpg',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:%23FFF"><rect x="30" y="30" width="540" height="740" fill="none" stroke="%23333" stroke-width="2"/><text x="60" y="80" font-family="monospace" font-size="24" font-weight="bold" fill="%23000">FLEETPRO LOGISTICS INC.</text><text x="60" y="110" font-family="monospace" font-size="12" fill="%23666">128 Industrial Parkway, Sector 4</text><text x="420" y="80" font-family="monospace" font-size="14" font-weight="bold" fill="%23333">INVOICE: %231082</text><text x="420" y="100" font-family="monospace" font-size="12" fill="%23666">Date: 2026-09-18</text><line x1="60" y1="140" x2="540" y2="140" stroke="%23333" stroke-width="1.5"/><text x="60" y="180" font-family="monospace" font-size="14" font-weight="bold" fill="%23000">BILL TO:</text><text x="60" y="200" font-family="monospace" font-size="12" fill="%23333">Al-Jazeera Transport Co.</text><text x="60" y="215" font-family="monospace" font-size="12" fill="%23666">Riyadh, Saudi Arabia</text><line x1="60" y1="250" x2="540" y2="250" stroke="%23ccc" stroke-dasharray="4"/><text x="60" y="280" font-family="monospace" font-size="12" font-weight="bold" fill="%23000">DESCRIPTION</text><text x="360" y="280" font-family="monospace" font-size="12" font-weight="bold" fill="%23000">QTY</text><text x="460" y="280" font-family="monospace" font-size="12" font-weight="bold" fill="%23000">AMOUNT</text><line x1="60" y1="290" x2="540" y2="290" stroke="%23333" stroke-width="1"/><text x="60" y="320" font-family="monospace" font-size="12" fill="%23333">Diesel Fuel Refill - Generator A2</text><text x="360" y="320" font-family="monospace" font-size="12" fill="%23333">450L</text><text x="460" y="320" font-family="monospace" font-size="12" fill="%23333">SAR 980.00</text><text x="60" y="345" font-family="monospace" font-size="12" fill="%23333">Trailer Brake Pad Maintenance</text><text x="360" y="345" font-family="monospace" font-size="12" fill="%23333">1 Set</text><text x="460" y="345" font-family="monospace" font-size="12" fill="%23333">SAR 420.00</text><text x="60" y="370" font-family="monospace" font-size="12" fill="%23333">Lubricant Oil Change (Synthetics)</text><text x="360" y="370" font-family="monospace" font-size="12" fill="%23333">2 Can</text><text x="460" y="370" font-family="monospace" font-size="12" fill="%23333">SAR 180.00</text><line x1="60" y1="410" x2="540" y2="410" stroke="%23ccc" stroke-width="1"/><text x="320" y="440" font-family="monospace" font-size="14" font-weight="bold" fill="%23000">TOTAL AMOUNT:</text><text x="460" y="440" font-family="monospace" font-size="14" font-weight="bold" fill="%23000">SAR 1,580.00</text><line x1="60" y1="470" x2="540" y2="470" stroke="%23333" stroke-width="1.5"/><text x="60" y="500" font-family="monospace" font-size="12" font-weight="bold" fill="%23000">TERMS %26 INSTRUCTIONS</text><text x="60" y="520" font-family="monospace" font-size="11" fill="%23666">Payment is due within 15 days of invoice date.</text><text x="60" y="535" font-family="monospace" font-size="11" fill="%23666">Please reference Invoice %231082 on payment transfer.</text><text x="240" y="680" font-family="monospace" font-size="12" font-style="italic" fill="%23888">Thank you for your business!</text></svg>',
    text: "FLEETPRO LOGISTICS INC.\n128 Industrial Parkway, Sector 4\nINVOICE: #1082\nDate: 2026-09-18\nBILL TO: Al-Jazeera Transport Co.\nRiyadh, Saudi Arabia\nDESCRIPTION            QTY     AMOUNT\nDiesel Fuel (Generator) 450L    SAR 980.00\nTrailer Brake Pad      1 Set   SAR 420.00\nLubricant Oil Change   2 Can   SAR 180.00\nTOTAL AMOUNT:                  SAR 1,580.00\nTerms: Due in 15 days."
  },
  {
    name: 'Delivery_Note_0944.jpg',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" style="background:%23F9F9FB"><rect x="30" y="30" width="540" height="740" fill="none" stroke="%234f46e5" stroke-width="2"/><text x="60" y="80" font-family="sans-serif" font-size="22" font-weight="bold" fill="%234f46e5">DELIVERY NOTE</text><text x="60" y="105" font-family="sans-serif" font-size="11" fill="%23555">TRANS-GULF LOGISTICS PARTNERS</text><text x="420" y="80" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23333">NOTE NO: DN-0944</text><text x="420" y="100" font-family="sans-serif" font-size="11" fill="%23666">Date: 2026-09-19</text><line x1="60" y1="130" x2="540" y2="130" stroke="%234f46e5" stroke-width="1.5"/><text x="60" y="165" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23333">DELIVERED TO:</text><text x="60" y="185" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23000">RED SEA WAREHOUSING DEPOT</text><text x="60" y="200" font-family="sans-serif" font-size="11" fill="%23666">Gate 12, Terminal Avenue, Jeddah Port</text><line x1="60" y1="230" x2="540" y2="230" stroke="%23ccc" stroke-dasharray="2"/><text x="60" y="260" font-family="sans-serif" font-size="11" font-weight="bold" fill="%234f46e5">ITEM NO.</text><text x="160" y="260" font-family="sans-serif" font-size="11" font-weight="bold" fill="%234f46e5">PRODUCT DESCRIPTION</text><text x="360" y="260" font-family="sans-serif" font-size="11" font-weight="bold" fill="%234f46e5">STATUS</text><text x="460" y="260" font-family="sans-serif" font-size="11" font-weight="bold" fill="%234f46e5">QTY</text><line x1="60" y1="270" x2="540" y2="270" stroke="%234f46e5" stroke-width="1"/><text x="60" y="300" font-family="sans-serif" font-size="11" fill="%23333">01</text><text x="160" y="300" font-family="sans-serif" font-size="11" fill="%23333">Industrial Steel Pipes (30cm)</text><text x="360" y="300" font-family="sans-serif" font-size="11" fill="%2310b981">Verified</text><text x="460" y="300" font-family="sans-serif" font-size="11" fill="%23333">120 Units</text><text x="60" y="325" font-family="sans-serif" font-size="11" fill="%23333">02</text><text x="160" y="325" font-family="sans-serif" font-size="11" fill="%23333">High-Pressure Hydraulic Seals</text><text x="360" y="325" font-family="sans-serif" font-size="11" fill="%2310b981">Verified</text><text x="460" y="325" font-family="sans-serif" font-size="11" fill="%23333">40 Boxes</text><text x="60" y="350" font-family="sans-serif" font-size="11" fill="%23333">03</text><text x="160" y="350" font-family="sans-serif" font-size="11" fill="%23333">Heavy-Duty Steel Bracket Joints</text><text x="360" y="350" font-family="sans-serif" font-size="11" fill="%2310b981">Verified</text><text x="460" y="350" font-family="sans-serif" font-size="11" fill="%23333">250 Pcs</text><line x1="60" y1="390" x2="540" y2="390" stroke="%23ccc" stroke-width="1"/><text x="60" y="420" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23333">CARRIER DETAILS:</text><text x="60" y="440" font-family="sans-serif" font-size="11" fill="%23555">Trailer Plate: TL-4982-KSA</text><text x="60" y="455" font-family="sans-serif" font-size="11" fill="%23555">Driver: Muhammad Rahim</text><line x1="60" y1="520" x2="540" y2="520" stroke="%234f46e5" stroke-dasharray="4"/><text x="60" y="555" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23333">RECEIVED BY (SIGNATURE):</text><rect x="60" y="575" width="200" height="60" fill="none" stroke="%23ccc" stroke-width="1" rx="5"/><text x="80" y="610" font-family="monospace" font-size="16" fill="%23333" font-style="italic" opacity="0.6">Hassan Al-Saeed</text><text x="60" y="650" font-family="sans-serif" font-size="9" fill="%23777">Authorized Warehouse Signee</text><text x="360" y="555" font-family="sans-serif" font-size="11" font-weight="bold" fill="%23333">DATE %26 TIME:</text><text x="360" y="580" font-family="sans-serif" font-size="11" fill="%23555">2026-09-19 11:30 AM</text></svg>',
    text: "DELIVERY NOTE\nTRANS-GULF LOGISTICS PARTNERS\nNOTE NO: DN-0944\nDate: 2026-09-19\nDELIVERED TO: RED SEA WAREHOUSING DEPOT\nGate 12, Terminal Avenue, Jeddah Port\nITEM NO.   PRODUCT DESCRIPTION             STATUS    QTY\n01         Industrial Steel Pipes (30cm)   Verified  120 Units\n02         High-Pressure Hydraulic Seals   Verified  40 Boxes\n03         Heavy-Duty Steel Joints         Verified  250 Pcs\nTrailer: TL-4982-KSA | Driver: Muhammad Rahim\nReceived by: Hassan Al-Saeed\nDate: 2026-09-19 11:30 AM"
  }
];

const Scanner: React.FC = () => {
  const { language, setView, showFeedback, appThemeMode, setCustomBackAction } = useStore();
  const t = TRANSLATIONS[language];

  // Component States
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [scannedHistory, setScannedHistory] = useState<ScannedItem[]>([]);
  
  // Scanned Document State
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const [selectedDocName, setSelectedDocName] = useState<string>('Scanned_Document.jpg');
  const [selectedDocText, setSelectedDocText] = useState<string>('');
  
  // Editing States
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('original');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrResult, setOcrResult] = useState<string>('');

  // Two-sided ID Card Scanning States
  const [idCardFrontImage, setIdCardFrontImage] = useState<string | null>(null);
  const [idCardBackImage, setIdCardBackImage] = useState<string | null>(null);
  const [idCardCurrentSide, setIdCardCurrentSide] = useState<'front' | 'back'>('front');

  // PDF Layout Settings States
  const [pdfLayoutMode, setPdfLayoutMode] = useState<'vertical_stack' | 'horizontal' | 'separate_pages'>('vertical_stack');
  const [pdfCardSize, setPdfCardSize] = useState<'standard' | 'compact' | 'large'>('standard');
  const [pdfShowLabels, setPdfShowLabels] = useState<boolean>(true);
  const [pdfMargin, setPdfMargin] = useState<number>(30);
  const [pdfShowGrid, setPdfShowGrid] = useState<boolean>(false);

  // CamScanner PDF Settings Configuration
  const [pdfConfig, setPdfConfig] = useState<PdfSettingsConfig>({
    isLocked: false,
    password: '',
    pageNumber: 'No page number',
    direction: 'landscape',
    pageSize: 'A4',
    hasMargin: true,
  });
  const [showPdfSettingsModal, setShowPdfSettingsModal] = useState<boolean>(false);

  // ID Card, Passport, and Driving License specific states
  const [scanStep, setScanStep] = useState<'viewfinder' | 'processing' | 'result'>('viewfinder');
  
  const [idCardData, setIdCardData] = useState({
    idNo: '5539482710',
    fullName: 'Md Hassan Ahamed',
    dob: '12 Nov 1994',
    fatherName: 'Md Rahim Ahamed',
    address: 'Sector 10, Uttara, Dhaka'
  });

  const [passportData, setPassportData] = useState({
    passportNo: 'EG8832941',
    givenName: 'Md Hassan',
    surname: 'Ahamed',
    nationality: 'Bangladeshi (BGD)',
    dob: '12 Nov 1994',
    expiryDate: '18 Sep 2031',
    mrz: 'P<BGDHASSAN<<MD<HASSAN<<<<<<<<<<<<<<<<<<'
  });

  const [licenseData, setLicenseData] = useState({
    licenseNo: 'DL-938472-KSA',
    driverName: 'MD HASSAN AHAMED',
    categories: 'Heavy Truck (C), Light Vehicle (B)',
    issueDate: '2020-04-10',
    expiryDate: '2030-04-09',
    authority: 'Riyadh Traffic Department'
  });

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);

  const [pendingScanMode, setPendingScanMode] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState<boolean>(false);
  const [autoCaptureTimer, setAutoCaptureTimer] = useState<number | null>(null);
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [cameraPermissionState, setCameraPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showCameraSettingsModal, setShowCameraSettingsModal] = useState<boolean>(false);
  const [cameraSound, setCameraSound] = useState<boolean>(true);

  // Real-time alignment boundary feedback
  const [detectState, setDetectState] = useState<'searching' | 'aligning' | 'ready' | 'snapping'>('searching');
  const [detectProgress, setDetectProgress] = useState<number>(10);

  // Crop adjustments
  const [originalCapturedImage, setOriginalCapturedImage] = useState<string | null>(null);
  const [showInteractiveCrop, setShowInteractiveCrop] = useState<boolean>(false);
  const [activeDragCorner, setActiveDragCorner] = useState<'tl' | 'tr' | 'br' | 'bl' | null>(null);
  const [cropCorners, setCropCorners] = useState<{
    tl: { x: number; y: number };
    tr: { x: number; y: number };
    br: { x: number; y: number };
    bl: { x: number; y: number };
  }>({
    tl: { x: 8, y: 10 },
    tr: { x: 92, y: 10 },
    br: { x: 92, y: 90 },
    bl: { x: 8, y: 90 }
  });

  // Photo Review, Manual Crop, Edit Menu & Laser Scan States
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [isLaserScanning, setIsLaserScanning] = useState<boolean>(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState<boolean>(false);
  const [activeEditSubTool, setActiveEditSubTool] = useState<'crop' | 'filter' | 'text' | null>('crop');
  const [showTextEditModal, setShowTextEditModal] = useState<boolean>(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [customDocNotes, setCustomDocNotes] = useState<string>('');

  // Start Camera Session
  const startCamera = async (modeId?: string, facing: 'environment' | 'user' = cameraFacing) => {
    if (modeId) {
      setActiveMode(modeId);
    }
    setCameraError(null);
    setIsStreaming(true);
    setDetectState('searching');
    setDetectProgress(15);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setCameraPermissionState('granted');
      setCameraFacing(facing);
      
      // Delay to allow video ref to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraPermissionState('denied');
      setCameraError(err.message || 'Could not access device camera');
      setIsStreaming(false);
      showFeedback(
        language === 'bn' 
          ? 'ক্যামেরা পারমিশন পাওয়া যায়নি বা ডিভাইস এটি সাপোর্ট করে না!' 
          : 'Camera permission denied or not supported. Please select from gallery/upload.',
        'error'
      );
    }
  };

  // Stop Camera Session
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsStreaming(false);
    setAutoCaptureTimer(null);
    setShowCameraSettingsModal(false);
  };

  // Switch between Rear and Front cameras
  const handleSwitchCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    await startCamera(activeMode || 'DOCUMENT_SCAN', nextFacing);
    showFeedback(
      language === 'bn'
        ? (nextFacing === 'user' ? 'ফ্রন্ট ক্যামেরা সক্রিয়' : 'ব্যাক ক্যামেরা সক্রিয়')
        : (nextFacing === 'user' ? 'Front camera activated' : 'Rear camera activated'),
      'success'
    );
  };

  // Zoom control
  const handleZoomChange = async (newZoom: number) => {
    setZoomLevel(newZoom);
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const caps = track.getCapabilities() as any;
        if (caps.zoom) {
          await track.applyConstraints({
            advanced: [{ zoom: newZoom } as any]
          });
        }
      } catch (e) {
        console.warn("Hardware zoom not available, applying digital scale", e);
      }
    }
  };

  // Toggle Torch/Flash light
  const toggleFlash = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      try {
        const capabilities = videoTrack.getCapabilities() as any;
        if (capabilities.torch) {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !isFlashOn } as any]
          });
          setIsFlashOn(!isFlashOn);
          showFeedback(
            language === 'bn' 
              ? (isFlashOn ? 'ফ্ল্যাশ বন্ধ করা হয়েছে' : 'ফ্ল্যাশ চালু করা হয়েছে') 
              : (isFlashOn ? 'Flashlight off' : 'Flashlight activated'), 
            'success'
          );
        } else {
          showFeedback(
            language === 'bn' ? 'ডিভাইস ফ্ল্যাশ সাপোর্ট করে না!' : 'Flashlight constraint is not supported on this device/browser!',
            'error'
          );
        }
      } catch (e) {
        console.warn("Torch control not allowed:", e);
        showFeedback(
          language === 'bn' ? 'ফ্ল্যাশ নিয়ন্ত্রণ করা যাচ্ছে না!' : 'Flashlight could not be toggled.',
          'error'
        );
      }
    }
  };

  // Shutter Snapshot Capture
  const captureSnapshot = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    
    // Play subtle shutter sound feedback
    if (cameraSound) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } catch (e) {
        // Ignore audio playback exceptions
      }
    }

    // Determine target dimensions and aspect ratio from mode
    let targetRatio = 1.58; // Standard ISO-7810 ID card & Driving License ratio
    let targetW = 1012;
    let targetH = 638;

    if (activeMode === 'SCAN_PASSPORT') {
      targetRatio = 1 / 1.414;
      targetW = 880;
      targetH = 1250;
    } else if (activeMode === 'DOCUMENT_SCAN' || activeMode === 'SCAN_PDF' || activeMode === 'OCR_EXTRACT') {
      targetRatio = 1 / 1.414;
      targetW = 1000;
      targetH = 1414;
    } else if (activeMode === 'SCAN_IMAGE') {
      targetRatio = vw / vh;
      targetW = vw;
      targetH = vh;
    }

    // Calculate center bounding box aligned with viewfinder guide overlay
    let cropWidth = vw * 0.82;
    let cropHeight = cropWidth / targetRatio;
    if (cropHeight > vh * 0.85) {
      cropHeight = vh * 0.85;
      cropWidth = cropHeight * targetRatio;
    }
    const cropX = (vw - cropWidth) / 2;
    const cropY = (vh - cropHeight) / 2;

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw high-resolution frame from video stream directly onto canvas
    ctx.drawImage(video, 0, 0, vw, vh);
    
    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      stopCamera();
      
      // Open Manual Crop & Review page immediately without auto laser scan!
      setOriginalCapturedImage(dataUrl);
      setShowInteractiveCrop(true);
      setIsReviewMode(true);
      setIsLaserScanning(false);
      setIsEditMenuOpen(false);
      setActiveEditSubTool('crop');
      setCropCorners({
        tl: { x: 8, y: 10 },
        tr: { x: 92, y: 10 },
        br: { x: 92, y: 90 },
        bl: { x: 8, y: 90 }
      });

      showFeedback(
        language === 'bn' 
          ? 'ছবি তোলা সম্পন্ন হয়েছে! প্রয়োজনীয় অংশ ক্রপ বা এডিট করুন।' 
          : 'Photo captured! Crop boundaries or edit before confirming.',
        'success'
      );
    } catch (err) {
      console.error("Frame capture failed:", err);
    }
  };

  // Confirm Button Handler: Triggers Perspective Crop & High-Tech Laser Scan Animation
  const handleConfirmAndLaserScan = () => {
    if (!originalCapturedImage) return;
    
    setIsProcessing(true);
    const img = new Image();
    img.src = originalCapturedImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      const imgW = img.naturalWidth;
      const imgH = img.naturalHeight;

      // Translate coordinates percentages to absolute source pixel sizes
      const tlX = (cropCorners.tl.x / 100) * imgW;
      const tlY = (cropCorners.tl.y / 100) * imgH;
      const trX = (cropCorners.tr.x / 100) * imgW;
      const trY = (cropCorners.tr.y / 100) * imgH;
      const brX = (cropCorners.br.x / 100) * imgW;
      const brY = (cropCorners.br.y / 100) * imgH;
      const blX = (cropCorners.bl.x / 100) * imgW;
      const blY = (cropCorners.bl.y / 100) * imgH;

      // Extract bounding box of selected quadrilateral coordinates
      const minX = Math.max(0, Math.min(tlX, blX, trX, brX));
      const maxX = Math.min(imgW, Math.max(tlX, blX, trX, brX));
      const minY = Math.max(0, Math.min(tlY, blY, trY, brY));
      const maxY = Math.min(imgH, Math.max(tlY, blY, trY, brY));

      let cropW = maxX - minX;
      let cropH = maxY - minY;

      if (cropW <= 0) cropW = imgW;
      if (cropH <= 0) cropH = imgH;

      // Map aspect ratio targets professionally
      let targetW = cropW;
      let targetH = cropH;

      if (activeMode === 'SCAN_ID_CARD' || activeMode === 'SCAN_DRIVING_LICENSE') {
        targetW = 1012; // Standard ID-1 card aspect ratio
        targetH = 638;  
      } else if (activeMode === 'SCAN_PASSPORT') {
        targetW = 880;
        targetH = 1250; // Passport page ratio
      } else {
        targetW = 1000;
        targetH = 1414; // Standard A4 Document ratio
      }

      canvas.width = targetW;
      canvas.height = targetH;

      // Apply filter transformations onto canvas if selected
      if (selectedFilter === 'whiten') {
        ctx.filter = 'contrast(125%) brightness(110%)';
      } else if (selectedFilter === 'magic') {
        ctx.filter = 'saturate(135%) contrast(120%) brightness(105%)';
      } else if (selectedFilter === 'bw') {
        ctx.filter = 'grayscale(100%) contrast(200%) brightness(115%)';
      } else if (selectedFilter === 'grayscale') {
        ctx.filter = 'grayscale(100%) contrast(110%)';
      }

      ctx.drawImage(img, minX, minY, cropW, cropH, 0, 0, targetW, targetH);

      try {
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        // Activate Laser Scan Animation over the cropped viewport!
        setIsLaserScanning(true);
        setIsEditMenuOpen(false);

        // Laser scan sweep sound effect
        if (cameraSound) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1400, audioCtx.currentTime + 1.4);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.4);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.4);
          } catch (e) {}
        }

        // Complete laser scanning sweep animation after 1.5s
        setTimeout(() => {
          setIsLaserScanning(false);
          setIsProcessing(false);
          setIsReviewMode(false);
          setShowInteractiveCrop(false);
          setOriginalCapturedImage(null);

          if (activeMode === 'SCAN_ID_CARD' || activeMode === 'SCAN_DRIVING_LICENSE') {
            if (idCardCurrentSide === 'front' || !idCardFrontImage) {
              setIdCardFrontImage(croppedDataUrl);
              setIdCardCurrentSide('back');
              setScanStep('result');
              showFeedback(
                language === 'bn' 
                  ? 'সামনের সাইট লেজার স্ক্যান সম্পন্ন! এবার পিছনের সাইট যোগ করুন।' 
                  : 'Front side laser scanned! Now add back side.',
                'success'
              );
            } else {
              setIdCardBackImage(croppedDataUrl);
              setScanStep('result');
              showFeedback(
                language === 'bn' 
                  ? 'পিছনের সাইট লেজার স্ক্যান সম্পন্ন! সম্পূর্ণ কার্ড প্রস্তুত।' 
                  : 'Back side laser scanned! Document sheet ready.',
                'success'
              );
            }
          } else if (activeMode === 'SCAN_PASSPORT') {
            setSelectedDocImage(croppedDataUrl);
            setSelectedDocName(`Passport_${Date.now().toString().slice(-6)}.jpg`);
            setScanStep('result');
            showFeedback(
              language === 'bn' ? 'পাসপোর্ট লেজার স্ক্যান সম্পন্ন!' : 'Passport laser scanned!',
              'success'
            );
          } else if (activeMode === 'OCR_EXTRACT') {
            setSelectedDocImage(croppedDataUrl);
            setOcrResult(MOCK_OCR_TEXT);
            setActiveMode('OCR_EXTRACT');
            showFeedback(
              language === 'bn' ? 'লেজার ওসিআর টেক্সট এক্সট্রাক্ট সম্পন্ন!' : 'Laser OCR extracted successfully!',
              'success'
            );
          } else {
            setSelectedDocImage(croppedDataUrl);
            setRotation(0);
            setBrightness(12);
            setContrast(22);
            setSelectedFilter('whiten');
            setSelectedDocName(`Scanned_Doc_${Date.now().toString().slice(-6)}.jpg`);
            setSelectedDocText(customDocNotes || "Scanned and laser-enhanced document.");
            setActiveMode('ENHANCE');
            showFeedback(
              language === 'bn' ? 'ডকুমেন্ট লেজার স্ক্যান সম্পন্ন!' : 'Document laser scan completed!',
              'success'
            );
          }
        }, 1500);
      } catch (err) {
        console.error("Canvas crop extraction failed:", err);
        setIsProcessing(false);
        setIsLaserScanning(false);
      }
    };
    img.onerror = () => {
      setIsProcessing(false);
      setIsLaserScanning(false);
      showFeedback("Error processing image.", "error");
    };
  };

  // Math-guided polygon crop stretch + Perspective straightening simulation on HTML Canvas
  const applyCropAndWarp = () => {
    handleConfirmAndLaserScan();
  };

  // Drag coordinates calculation on mouse/touch moves
  const handleCornerDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeDragCorner || !cropContainerRef.current) return;
    e.preventDefault();
    
    const rect = cropContainerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    let px = ((clientX - rect.left) / rect.width) * 100;
    let py = ((clientY - rect.top) / rect.height) * 100;
    
    px = Math.max(0, Math.min(100, px));
    py = Math.max(0, Math.min(100, py));
    
    setCropCorners(prev => ({
      ...prev,
      [activeDragCorner]: { x: Math.round(px), y: Math.round(py) }
    }));
  };

  const handleDragEnd = () => {
    setActiveDragCorner(null);
  };

  // Handle direct camera captures
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mode = pendingScanMode || activeMode || 'DOCUMENT_SCAN';
      setActiveMode(mode);

      // Open Manual Crop & Review page
      setOriginalCapturedImage(result);
      setShowInteractiveCrop(true);
      setIsReviewMode(true);
      setIsLaserScanning(false);
      setIsEditMenuOpen(false);
      setActiveEditSubTool('crop');
      setCropCorners({
        tl: { x: 8, y: 10 },
        tr: { x: 92, y: 10 },
        br: { x: 92, y: 90 },
        bl: { x: 8, y: 90 }
      });
      setIsProcessing(false);

      showFeedback(
        language === 'bn' 
          ? 'ছবি প্রস্তুত! প্রয়োজনীয় অংশ ক্রপ বা এডিট করে কনফার্ম করুন।' 
          : 'Photo loaded! Adjust crop boundaries or edit before confirming.',
        'success'
      );
    };
    reader.onerror = () => {
      setIsProcessing(false);
      showFeedback(
        language === 'bn' ? 'ক্যামেরা ইমেজ পড়তে সমস্যা হয়েছে!' : 'Error reading camera image!',
        'error'
      );
    };
    reader.readAsDataURL(file);
  };

  // Handle main header back button action dynamically
  useEffect(() => {
    if (activeMode) {
      setCustomBackAction(() => {
        if (['SCAN_ID_CARD', 'SCAN_PASSPORT', 'SCAN_DRIVING_LICENSE', 'DOCUMENT_SCAN'].includes(activeMode) && scanStep !== 'viewfinder') {
          setScanStep('viewfinder');
        } else {
          stopCamera();
          setActiveMode(null);
          setOcrResult('');
        }
      });
    } else {
      setCustomBackAction(null);
    }
    return () => {
      setCustomBackAction(null);
    };
  }, [activeMode, scanStep, setCustomBackAction, stream]);

  // Real-time document boundary detection simulation & Auto Capture loop
  useEffect(() => {
    if (!isStreaming || !autoCaptureEnabled) {
      setDetectState('searching');
      setDetectProgress(10);
      setAutoCaptureTimer(null);
      return;
    }

    let intervalId: any;
    let countdownIntervalId: any;

    // Simulate boundary detection stages over the camera feed
    intervalId = setInterval(() => {
      setDetectProgress(prev => {
        const next = prev + Math.floor(Math.random() * 15) + 5;
        if (next >= 100) {
          clearInterval(intervalId);
          setDetectState('ready');
          setAutoCaptureTimer(3);
          return 100;
        } else if (next >= 60) {
          setDetectState('aligning');
        } else {
          setDetectState('searching');
        }
        return next;
      });
    }, 450);

    return () => {
      clearInterval(intervalId);
      clearInterval(countdownIntervalId);
    };
  }, [isStreaming, autoCaptureEnabled]);

  // Auto capture countdown ticking loop
  useEffect(() => {
    if (autoCaptureTimer === null) return;
    if (autoCaptureTimer === 0) {
      setDetectState('snapping');
      captureSnapshot();
      return;
    }

    const timer = setTimeout(() => {
      setAutoCaptureTimer(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoCaptureTimer]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('fleetpro_scanned_documents');
    if (saved) {
      try {
        setScannedHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load scanned history', e);
      }
    }
  }, []);

  // Sync history to localStorage
  const saveHistory = (items: ScannedItem[]) => {
    setScannedHistory(items);
    localStorage.setItem('fleetpro_scanned_documents', JSON.stringify(items));
  };

  // Pre-load a demo document if none is active to ensure instant use
  useEffect(() => {
    if (!selectedDocImage) {
      setSelectedDocImage(DEMO_DOCUMENTS[0].image);
      setSelectedDocName(DEMO_DOCUMENTS[0].name);
      setSelectedDocText(DEMO_DOCUMENTS[0].text);
    }
  }, [selectedDocImage]);

  // Handle uploaded file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      
      setSelectedDocName(file.name || 'Uploaded_Document.jpg');
      setSelectedDocText('Uploaded Custom Scanned Document Image.');

      const mode = activeMode || pendingScanMode || 'DOCUMENT_SCAN';
      setActiveMode(mode);

      // Open Manual Crop & Review page
      setOriginalCapturedImage(result);
      setShowInteractiveCrop(true);
      setIsReviewMode(true);
      setIsLaserScanning(false);
      setIsEditMenuOpen(false);
      setActiveEditSubTool('crop');
      setCropCorners({
        tl: { x: 8, y: 10 },
        tr: { x: 92, y: 10 },
        br: { x: 92, y: 90 },
        bl: { x: 8, y: 90 }
      });

      showFeedback(
        language === 'bn' 
          ? 'ডকুমেন্ট আপলোড হয়েছে! প্রয়োজনীয় অংশ ক্রপ বা এডিট করুন।' 
          : 'Document uploaded! Adjust crop boundaries or edit before confirming.',
        'success'
      );

      setIsProcessing(false);
    };
    reader.onerror = () => {
      setIsProcessing(false);
      showFeedback(
        language === 'bn' ? 'ফাইল পড়তে সমস্যা হয়েছে!' : 'Error reading file!',
        'error'
      );
    };
    reader.readAsDataURL(file);
  };

  // Switch demo documents
  const handleLoadDemoDoc = (index: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      setSelectedDocImage(DEMO_DOCUMENTS[index].image);
      setSelectedDocName(DEMO_DOCUMENTS[index].name);
      setSelectedDocText(DEMO_DOCUMENTS[index].text);
      setRotation(0);
      setBrightness(0);
      setContrast(0);
      setSelectedFilter('original');
      setIsProcessing(false);
      showFeedback(
        language === 'bn' ? 'ডেমো ডকুমেন্ট লোড হয়েছে!' : 'Demo document loaded!',
        'success'
      );
    }, 200);
  };

  // Apply Rotation, Contrast, Filter adjustments onto a virtual canvas for true saving
  const getProcessedDataUrlAsync = (callback: (dataUrl: string) => void) => {
    if (!selectedDocImage) {
      callback('');
      return;
    }
    
    const img = new Image();
    img.src = selectedDocImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(selectedDocImage);
        return;
      }

      // Handle orientation dimensions
      const is90or270 = (rotation / 90) % 2 !== 0;
      const width = is90or270 ? img.naturalHeight : img.naturalWidth;
      const height = is90or270 ? img.naturalWidth : img.naturalHeight;

      canvas.width = width;
      canvas.height = height;

      // Apply CSS Filters directly to Canvas rendering
      ctx.filter = getFilterCSS();

      // Translate & Rotate around center
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        callback(dataUrl);
      } catch (err) {
        console.error("Canvas export failed:", err);
        callback(selectedDocImage);
      }
    };
    img.onerror = () => {
      callback(selectedDocImage);
    };
  };

  // Perform Simulated OCR text extraction with real output
  const handleExtractText = () => {
    if (!selectedDocImage) {
      showFeedback(
        language === 'bn' ? 'প্রথমে একটি ডকুমেন্ট সিলেক্ট করুন!' : 'Please select a document first!',
        'error'
      );
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setOcrResult(selectedDocText || "FLEETPRO SCANNER AUTOMATED OCR\n-----------------------------\nNo structured text detected.");
      setIsProcessing(false);
      showFeedback(
        language === 'bn' ? 'ওসিআর টেক্সট নিষ্কাশন সফল হয়েছে!' : 'OCR Text extraction completed!',
        'success'
      );
    }, 1200);
  };

  // PDF Export Simulation with dynamic print preview / download trigger
  const handleExportPDF = () => {
    if (!selectedDocImage) return;
    setIsProcessing(true);
    
    getProcessedDataUrlAsync((processedUrl) => {
      setIsProcessing(false);
      
      // Simulate real file download of PDF (as image container fallback)
      const link = document.createElement('a');
      link.href = processedUrl;
      link.download = selectedDocName.replace(/\.[^/.]+$/, "") + ".pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save to history
      const newHistoryItem: ScannedItem = {
        id: `pdf-${Date.now()}`,
        name: selectedDocName.replace(/\.[^/.]+$/, "") + ".pdf",
        date: new Date().toLocaleDateString(),
        image: processedUrl,
        text: 'PDF Document generated from scanned page.',
        size: '142 KB'
      };
      saveHistory([newHistoryItem, ...scannedHistory]);

      showFeedback(
        language === 'bn' ? 'পিডিএফ ফাইলটি ডাউনলোড করা হয়েছে!' : 'PDF file downloaded successfully!',
        'success'
      );
    });
  };

  // Image Saving Simulation with real processed canvas
  const handleSaveImage = () => {
    if (!selectedDocImage) return;
    setIsProcessing(true);

    getProcessedDataUrlAsync((processedUrl) => {
      setIsProcessing(false);
      
      // Real file download trigger
      const link = document.createElement('a');
      link.href = processedUrl;
      link.download = "scanned_" + selectedDocName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save to History
      const newHistoryItem: ScannedItem = {
        id: `img-${Date.now()}`,
        name: "scanned_" + selectedDocName,
        date: new Date().toLocaleDateString(),
        image: processedUrl,
        text: selectedDocText,
        size: '72 KB'
      };
      saveHistory([newHistoryItem, ...scannedHistory]);

      showFeedback(
        language === 'bn' ? 'ছবিটি সফলভাবে গ্যালারিতে সেভ হয়েছে!' : 'Image saved to gallery successfully!',
        'success'
      );
    });
  };

  // Share Document simulation
  const handleShareDoc = () => {
    if (!selectedDocImage) return;
    
    if (navigator.share) {
      navigator.share({
        title: selectedDocName,
        text: 'Sharing Scanned Document from FleetPro Manager Scanner',
        url: window.location.href
      }).catch(console.error);
    } else {
      // Fallback modal info
      showFeedback(
        language === 'bn' ? 'লিঙ্ক ক্লিপবোর্ডে কপি করা হয়েছে!' : 'Link copied to clipboard for sharing!',
        'success'
      );
    }
  };

  // Delete scanned history item
  const handleDeleteHistoryItem = (id: string) => {
    const updated = scannedHistory.filter(item => item.id !== id);
    saveHistory(updated);
    showFeedback(
      language === 'bn' ? 'ডকুমেন্টটি মুছে ফেলা হয়েছে!' : 'Document deleted successfully!',
      'success'
    );
  };

  // Active filter CSS styles
  const getFilterCSS = () => {
    let base = '';
    switch (selectedFilter) {
      case 'bw': base = 'contrast(150%) grayscale(100%)'; break;
      case 'high_contrast': base = 'contrast(180%) brightness(105%)'; break;
      case 'whiten': base = 'contrast(120%) brightness(115%) saturate(80%)'; break;
      case 'onyx': base = 'contrast(200%) grayscale(100%) invert(0)'; break;
      default: base = 'contrast(100%) brightness(100%)'; break;
    }
    
    // Append fine-tune sliders dynamically
    const brightnessPercent = 100 + brightness;
    const contrastPercent = 100 + contrast;
    
    return `${base} brightness(${brightnessPercent}%) contrast(${contrastPercent}%)`;
  };

  // Header Title Resolver based on Active Mode
  const getModeTitle = () => {
    const feat = SCANNER_FEATURES.find(f => f.id === activeMode);
    if (!feat) return language === 'bn' ? 'ডকুমেন্ট স্ক্যানার' : 'Document Scanner';
    return language === 'bn' ? feat.labelBn : feat.labelEn;
  };

  // Bespoke native In-App Camera overlay with active laser and boundary trackers
  const renderBespokeCameraView = () => {
    if (!isStreaming) return null;

    const isIdCard = activeMode === 'SCAN_ID_CARD';
    const isDrivingLicense = activeMode === 'SCAN_DRIVING_LICENSE';
    const isPassport = activeMode === 'SCAN_PASSPORT';
    const isDoc = activeMode === 'DOCUMENT_SCAN' || activeMode === 'SCAN_PDF' || activeMode === 'OCR_EXTRACT';

    // Adapt aspect ratio guides and color themes depending on current active mode
    let guideRatio = "aspect-[1.58/1]"; // ID Card standard ISO-7810
    let frameBorderColor = "border-blue-400";
    let cornerBorderColor = "border-blue-400";
    let laserGradient = "from-transparent via-blue-400 to-transparent";
    let laserShadow = "shadow-[0_0_12px_#38bdf8]";
    let modeThemeBadge = "bg-blue-500/25 text-blue-300 border-blue-400/40";
    let pulseColor = "bg-blue-400";

    let guideLabelEn = "National ID Card";
    let guideLabelBn = "জাতীয় পরিচয়পত্র";
    let guideTipEn = idCardCurrentSide === 'front'
      ? "Align the FRONT side of your ID card inside the blue card frame"
      : "Align the BACK side of your ID card inside the blue card frame";
    let guideTipBn = idCardCurrentSide === 'front'
      ? "আইডি কার্ডের সামনের দিকটি (FRONT) নীল কার্ড ফ্রেমের সাথে মেলান"
      : "আইডি কার্ডের পিছনের দিকটি (BACK) নীল কার্ড ফ্রেমের সাথে মেলান";

    if (isPassport) {
      guideRatio = "aspect-[1/1.4]"; // Passport tall bio-data page
      frameBorderColor = "border-purple-400";
      cornerBorderColor = "border-purple-400";
      laserGradient = "from-transparent via-purple-400 to-transparent";
      laserShadow = "shadow-[0_0_12px_#c084fc]";
      modeThemeBadge = "bg-purple-500/25 text-purple-300 border-purple-400/40";
      pulseColor = "bg-purple-400";
      guideLabelEn = "Passport Page";
      guideLabelBn = "পাসপোর্ট পৃষ্ঠা";
      guideTipEn = "Align bio-data page & machine readable zone (MRZ)";
      guideTipBn = "পাসপোর্টের তথ্য পৃষ্ঠা ও এমআরজেড জোনে এলাইন করুন";
    } else if (isDrivingLicense) {
      guideRatio = "aspect-[1.58/1]";
      frameBorderColor = "border-amber-400";
      cornerBorderColor = "border-amber-400";
      laserGradient = "from-transparent via-amber-400 to-transparent";
      laserShadow = "shadow-[0_0_12px_#fbbf24]";
      modeThemeBadge = "bg-amber-500/25 text-amber-300 border-amber-400/40";
      pulseColor = "bg-amber-400";
      guideLabelEn = "Driving License";
      guideLabelBn = "ড্রাইভিং লাইসেন্স";
      guideTipEn = "Align your driving license card within the frame";
      guideTipBn = "আপনার ড্রাইভিং লাইসেন্স কার্ডটি ফ্রেমের সাথে মেলান";
    } else if (isDoc) {
      guideRatio = "aspect-[1/1.414]"; // A4 paper
      frameBorderColor = "border-emerald-400";
      cornerBorderColor = "border-emerald-400";
      laserGradient = "from-transparent via-emerald-400 to-transparent";
      laserShadow = "shadow-[0_0_12px_#10b981]";
      modeThemeBadge = "bg-emerald-500/25 text-emerald-300 border-emerald-400/40";
      pulseColor = "bg-emerald-400";
      guideLabelEn = activeMode === 'SCAN_PDF' ? "Scan to PDF" : activeMode === 'OCR_EXTRACT' ? "OCR Scan" : "Document Scan";
      guideLabelBn = activeMode === 'SCAN_PDF' ? "পিডিএফ স্ক্যান" : activeMode === 'OCR_EXTRACT' ? "ওসিআর স্ক্যান" : "ডকুমেন্ট স্ক্যান";
      guideTipEn = "Align the receipt, invoice or document page";
      guideTipBn = "রসিদ, ইনভয়েস বা ডকুমেন্টের পাতা ফ্রেমের সাথে মেলান";
    }

    return createPortal(
      <div className="fixed inset-0 z-[999999] bg-black text-white flex flex-col justify-between w-screen h-screen overflow-hidden select-none">
        
        {/* ========================================================================= */}
        {/* 1. TOP BAR REPLACEMENT: CAMERA SETTINGS & STATUS (Safe-area-top)          */}
        {/* ========================================================================= */}
        <div className="flex-none bg-gradient-to-b from-black/95 via-black/80 to-transparent pt-[calc(env(safe-area-inset-top)+10px)] pb-3 px-4 z-40">
          <div className="flex items-center justify-between gap-2 max-w-2xl mx-auto w-full">
            
            {/* Left: Back / Close Camera */}
            <button
              onClick={() => {
                stopCamera();
                setActiveMode(null);
              }}
              className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full backdrop-blur-md transition-all text-white cursor-pointer shadow-md"
              title={language === 'bn' ? 'ক্যামেরা বন্ধ করুন' : 'Close Camera'}
            >
              <ChevronLeft size={22} />
            </button>

            {/* Center: Mode Badge & Live Pulse */}
            <div className={`flex items-center gap-2 backdrop-blur-md border px-3.5 py-1.5 rounded-full shadow-lg ${modeThemeBadge}`}>
              <span className={`w-2 h-2 rounded-full ${pulseColor} animate-ping`} />
              <span className="text-[11px] font-black uppercase tracking-wider">
                {activeMode === 'SCAN_ID_CARD' 
                  ? (idCardCurrentSide === 'front' 
                      ? (language === 'bn' ? 'আইডি কার্ড • সামনের সাইট (১/২)' : 'ID Card • Front (1/2)')
                      : (language === 'bn' ? 'আইডি কার্ড • পিছনের সাইট (২/২)' : 'ID Card • Back (2/2)'))
                  : activeMode === 'SCAN_PASSPORT'
                  ? (language === 'bn' ? 'পাসপোর্ট বায়ো-পেজ' : 'Passport Bio-Page')
                  : activeMode === 'SCAN_DRIVING_LICENSE'
                  ? (language === 'bn' ? 'ড্রাইভিং লাইসেন্স' : 'Driving License')
                  : activeMode === 'SCAN_PDF'
                  ? (language === 'bn' ? 'পিডিএফ স্ক্যানার' : 'PDF Scanner')
                  : activeMode === 'OCR_EXTRACT'
                  ? (language === 'bn' ? 'ওসিআর টেক্সট স্ক্যান' : 'OCR Text Scanner')
                  : (language === 'bn' ? 'ডকুমেন্ট স্ক্যানার' : 'Document Scanner')}
              </span>
            </div>

            {/* Right: Camera Settings Toolbar */}
            <div className="flex items-center gap-2">
              {/* Flashlight toggle */}
              <button
                onClick={toggleFlash}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md ${
                  isFlashOn 
                    ? 'bg-amber-400/25 text-amber-300 border border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.5)]' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={language === 'bn' ? 'ফ্ল্যাশ লাইট' : 'Flashlight'}
              >
                {isFlashOn ? <Zap size={18} className="text-amber-400" /> : <ZapOff size={18} />}
              </button>

              {/* 3x3 Grid Toggle */}
              <button
                onClick={() => {
                  setShowGridLines(!showGridLines);
                  showFeedback(
                    language === 'bn'
                      ? (showGridLines ? 'গ্রিড বন্ধ করা হয়েছে' : 'গ্রিড লাইন চালু করা হয়েছে')
                      : (showGridLines ? 'Grid guides off' : 'Grid guides on'),
                    'success'
                  );
                }}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-md ${
                  showGridLines 
                    ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/50' 
                    : 'bg-white/10 hover:bg-white/20 text-white/60'
                }`}
                title={language === 'bn' ? 'গ্রিড গাইড' : 'Grid Guides'}
              >
                <Grid size={18} />
              </button>

              {/* Camera Switch/Flip (Front / Rear) */}
              <button
                onClick={handleSwitchCamera}
                className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full backdrop-blur-md transition-all text-white cursor-pointer shadow-md"
                title={language === 'bn' ? 'ক্যামেরা পরিবর্তন' : 'Flip Camera (Rear/Front)'}
              >
                <RefreshCw size={18} className="hover:rotate-180 transition-transform duration-300" />
              </button>

              {/* Camera Quick Settings Modal */}
              <button
                onClick={() => setShowCameraSettingsModal(true)}
                className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-90 rounded-full backdrop-blur-md transition-all text-white cursor-pointer shadow-md"
                title={language === 'bn' ? 'ক্যামেরা সেটিংস' : 'Camera Settings'}
              >
                <Settings size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER VIEWFINDER: LIVE VIDEO & ADAPTIVE SCANNING GUIDES              */}
        {/* ========================================================================= */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
          {/* HTML5 Live Video Stream Layer */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover absolute inset-0"
            style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
          />

          {/* 3x3 Rule-of-Thirds Grid Overlay */}
          {showGridLines && (
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-10 opacity-30">
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div className="border-r border-b border-white/40" />
              <div />
            </div>
          )}

          {/* Shaded Area outside the designated guide frame */}
          <div className="absolute inset-0 bg-black/40 z-5 pointer-events-none" />

          {/* Dynamic Aspect Ratio Guide Frame overlay */}
          <div className={`w-[88%] max-w-[390px] ${guideRatio} bg-transparent border-2 ${frameBorderColor} rounded-2xl relative z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.65)] flex flex-col justify-between overflow-hidden transition-all duration-300`}>
            
            {/* Laser scanning line effect */}
            <div className={`absolute w-full h-1 bg-gradient-to-r ${laserGradient} top-0 left-0 animate-[scanLaser_2.2s_infinite] z-20 ${laserShadow}`} />

            {/* Guide bracket corners */}
            <div className={`absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 ${cornerBorderColor} rounded-tl-lg`} />
            <div className={`absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 ${cornerBorderColor} rounded-tr-lg`} />
            <div className={`absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 ${cornerBorderColor} rounded-bl-lg`} />
            <div className={`absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 ${cornerBorderColor} rounded-br-lg`} />

            {/* 💳 ID CARD SPECIFIC WATERMARK OVERLAY */}
            {isIdCard && (
              <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between opacity-40">
                {/* Header of simulated card */}
                <div className="flex items-center justify-between border-b border-blue-400/25 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-blue-400/30 flex items-center justify-center">
                      <IdCard size={10} className="text-blue-300" />
                    </div>
                    <span className="text-[8px] font-black tracking-widest uppercase text-blue-200">
                      {language === 'bn' ? 'জাতীয় পরিচয়পত্র' : 'NATIONAL ID CARD'}
                    </span>
                  </div>
                  <div className="w-5 h-3.5 rounded border border-blue-400/30 bg-blue-400/10 flex items-center justify-center">
                    <span className="text-[6px] font-mono text-blue-200">CHIP</span>
                  </div>
                </div>

                {/* Body of simulated card */}
                {idCardCurrentSide === 'front' ? (
                  <div className="flex items-center gap-3 my-auto">
                    {/* Portrait Photo box on the left */}
                    <div className="w-16 h-20 rounded-lg border-2 border-dashed border-blue-400/50 bg-blue-500/10 flex flex-col items-center justify-center gap-1 shrink-0">
                      <div className="w-7 h-7 rounded-full bg-blue-400/20 flex items-center justify-center text-blue-300">
                        <User size={14} />
                      </div>
                      <span className="text-[7px] font-black uppercase text-blue-300">
                        {language === 'bn' ? 'ছবি' : 'PHOTO'}
                      </span>
                    </div>

                    {/* Placeholder Lines for Name, ID, DOB */}
                    <div className="flex-1 space-y-2 text-left">
                      <div className="w-24 h-2 bg-blue-400/30 rounded" />
                      <div className="w-32 h-1.5 bg-blue-400/20 rounded" />
                      <div className="w-20 h-1.5 bg-blue-400/20 rounded" />
                      <div className="w-28 h-1.5 bg-blue-400/20 rounded" />
                    </div>
                  </div>
                ) : (
                  <div className="my-auto space-y-2.5">
                    {/* Barcode & Fingerprint slot */}
                    <div className="h-9 border border-dashed border-blue-400/40 bg-blue-500/10 rounded flex items-center justify-center">
                      <span className="text-[8px] font-mono tracking-[4px] uppercase text-blue-300">
                        BARCODE / QR CODE
                      </span>
                    </div>
                    <div className="space-y-1.5 text-left">
                      <div className="w-3/4 h-1.5 bg-blue-400/25 rounded" />
                      <div className="w-1/2 h-1.5 bg-blue-400/20 rounded" />
                    </div>
                  </div>
                )}

                {/* Bottom Side Indicator Tag */}
                <div className="flex items-center justify-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600/60 border border-blue-400/40 text-[9px] font-black tracking-wider uppercase text-blue-100">
                    {idCardCurrentSide === 'front' 
                      ? (language === 'bn' ? 'সামনের দিক (FRONT • ১/২)' : 'FRONT SIDE (1/2)') 
                      : (language === 'bn' ? 'পিছনের দিক (BACK • ২/২)' : 'BACK SIDE (2/2)')}
                  </span>
                </div>
              </div>
            )}

            {/* 🚗 DRIVING LICENSE SPECIFIC WATERMARK OVERLAY */}
            {isDrivingLicense && (
              <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between opacity-40">
                <div className="flex items-center justify-between border-b border-amber-400/25 pb-1.5">
                  <span className="text-[8px] font-black tracking-widest uppercase text-amber-200">
                    {language === 'bn' ? 'ড্রাইভিং লাইসেন্স' : 'DRIVING LICENSE'}
                  </span>
                  <span className="text-[7px] font-mono text-amber-200">PERMIT</span>
                </div>
                <div className="flex items-center gap-3 my-auto">
                  <div className="w-16 h-20 rounded-lg border-2 border-dashed border-amber-400/50 bg-amber-500/10 flex flex-col items-center justify-center gap-1 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-300">
                      <User size={14} />
                    </div>
                    <span className="text-[7px] font-black uppercase text-amber-300">
                      {language === 'bn' ? 'ছবি' : 'PHOTO'}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2 text-left">
                    <div className="w-24 h-2 bg-amber-400/30 rounded" />
                    <div className="w-32 h-1.5 bg-amber-400/20 rounded" />
                    <div className="w-20 h-1.5 bg-amber-400/20 rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-600/60 border border-amber-400/40 text-[9px] font-black tracking-wider uppercase text-amber-100">
                    {language === 'bn' ? 'ড্রাইভিং লাইসেন্স কার্ড' : 'DRIVING LICENSE CARD'}
                  </span>
                </div>
              </div>
            )}

            {/* 🛂 PASSPORT MRZ GUIDE BOX OVERLAY */}
            {isPassport && (
              <div className="mt-auto h-1/4 border-t border-dashed border-purple-400/40 bg-purple-500/10 flex items-center justify-center">
                <span className="text-[8px] font-mono tracking-[4px] uppercase text-purple-300/80">
                  ALIGN PASSPORT MRZ LINES HERE
                </span>
              </div>
            )}

            {/* Auto Align or Manual feedback label overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 p-4">
              {autoCaptureEnabled ? (
                <div className="bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-center animate-pulse z-20 shadow-lg">
                  {detectState === 'searching' && (
                    <p className="text-[9px] font-black tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>
                        {isIdCard 
                          ? (language === 'bn' ? 'আইডি কার্ড অনুসন্ধান করা হচ্ছে...' : 'Searching for ID card...')
                          : isDrivingLicense
                          ? (language === 'bn' ? 'ড্রাইভিং লাইসেন্স খোঁজা হচ্ছে...' : 'Searching for license...')
                          : isPassport
                          ? (language === 'bn' ? 'পাসপোর্ট পৃষ্ঠা খোঁজা হচ্ছে...' : 'Searching for passport...')
                          : (language === 'bn' ? 'ডকুমেন্ট অনুসন্ধান করা হচ্ছে...' : 'Searching for boundaries...')}
                      </span>
                    </p>
                  )}
                  {detectState === 'aligning' && (
                    <p className="text-[9px] font-black tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                      <Maximize size={10} className="animate-pulse" />
                      <span>
                        {isIdCard 
                          ? (idCardCurrentSide === 'front' 
                              ? (language === 'bn' ? 'আইডি কার্ডের সামনের অংশ মেলান...' : 'Align ID card front side...') 
                              : (language === 'bn' ? 'আইডি কার্ডের পিছনের অংশ মেলান...' : 'Align ID card back side...'))
                          : isDrivingLicense
                          ? (language === 'bn' ? 'লাইসেন্সটি ফ্রেমের সাথে মেলান...' : 'Align driving license...')
                          : (language === 'bn' ? 'গাইডলাইনের সাথে এলাইন করুন...' : 'Aligning document guidelines...')}
                      </span>
                    </p>
                  )}
                  {detectState === 'ready' && (
                    <p className="text-[9px] font-black tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                      <Check size={10} />
                      <span>
                        {language === 'bn' 
                          ? `স্থির রাখুন! ${autoCaptureTimer} সেকেন্ডে ক্যাপচার হবে...` 
                          : `Hold Steady! Snapping in ${autoCaptureTimer}s...`}
                      </span>
                    </p>
                  )}
                  {detectState === 'snapping' && (
                    <p className="text-[9px] font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                      <span>{language === 'bn' ? 'ক্যাপচার হচ্ছে...' : 'Capturing...'}</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 text-center z-20 shadow-lg">
                  <p className="text-[9px] font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                    <Camera size={11} className="text-emerald-400" />
                    <span>
                      {language === 'bn' 
                        ? 'ম্যানুয়াল মোড: ছবি তুলতে নিচের শাটার বাটনে চাপুন' 
                        : 'Manual Mode: Tap shutter button to snap'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Zoom Pill Selector */}
          <div className="absolute bottom-16 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/15 px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            {[0.5, 1, 2].map((z) => (
              <button
                key={z}
                onClick={() => handleZoomChange(z)}
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all cursor-pointer ${
                  zoomLevel === z 
                    ? 'bg-emerald-500 text-white shadow' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {z}x
              </button>
            ))}
          </div>

          {/* Lower Tip Guide info */}
          <div className="absolute bottom-4 inset-x-4 text-center z-10 pointer-events-none">
            <p className="text-[10px] font-black tracking-wider text-white bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl inline-block border border-white/10 shadow-lg">
              {language === 'bn' ? guideTipBn : guideTipEn}
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BOTTOM BAR REPLACEMENT: CAMERA CONTROLS, SHUTTER & MODE SLIDER        */}
        {/* ========================================================================= */}
        <div className="flex-none bg-gradient-to-t from-black via-black/95 to-transparent pb-[calc(env(safe-area-inset-bottom)+14px)] pt-3 px-4 z-40 space-y-3">
          
          {/* Mode Switcher Carousel */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto scrollbar-hide py-1 max-w-xl mx-auto">
            {[
              { id: 'SCAN_ID_CARD', labelEn: 'ID Card', labelBn: 'আইডি কার্ড' },
              { id: 'DOCUMENT_SCAN', labelEn: 'Document', labelBn: 'ডকুমেন্ট' },
              { id: 'SCAN_PASSPORT', labelEn: 'Passport', labelBn: 'পাসপোর্ট' },
              { id: 'SCAN_DRIVING_LICENSE', labelEn: 'License', labelBn: 'লাইসেন্স' },
              { id: 'SCAN_PDF', labelEn: 'To PDF', labelBn: 'পিডিএফ' },
              { id: 'OCR_EXTRACT', labelEn: 'OCR Text', labelBn: 'ওসিআর' },
              { id: 'SCAN_IMAGE', labelEn: 'Image', labelBn: 'ছবি' }
            ].map((m) => {
              const isActive = activeMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.id === 'SCAN_ID_CARD' && activeMode !== 'SCAN_ID_CARD') {
                      setIdCardFrontImage(null);
                      setIdCardBackImage(null);
                      setIdCardCurrentSide('front');
                    }
                    setActiveMode(m.id);
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#00af80] text-white shadow-md scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-white/70'
                  }`}
                >
                  {language === 'bn' ? m.labelBn : m.labelEn}
                </button>
              );
            })}
          </div>

          {/* Main Action Row (Gallery / Large Shutter / Side Thumbnail or Auto Toggle) */}
          <div className="flex items-center justify-between max-w-md mx-auto px-4 relative">
            {/* Left: Gallery / Upload button */}
            <button
              onClick={() => {
                stopCamera();
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-white transition cursor-pointer active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center backdrop-blur-md shadow-md">
                <Upload size={20} className="text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold tracking-wide">
                {language === 'bn' ? 'গ্যালারি' : 'Gallery'}
              </span>
            </button>

            {/* Center: CamScanner Big Shutter Button */}
            <div className="flex flex-col items-center">
              <button
                onClick={captureSnapshot}
                className="w-18 h-18 rounded-full bg-white/20 border-4 border-white p-1 hover:scale-105 active:scale-95 transition-all shadow-[0_0_24px_rgba(0,175,128,0.4)] flex items-center justify-center cursor-pointer"
                title={language === 'bn' ? 'ছবি তুলুন' : 'Capture Photo'}
              >
                <div className="w-full h-full rounded-full bg-[#00af80] flex items-center justify-center shadow-inner">
                  <Camera size={26} className="text-white" />
                </div>
              </button>
            </div>

            {/* Right: ID Card Front Thumbnail (when on back) or Auto-Capture Toggle */}
            {activeMode === 'SCAN_ID_CARD' && idCardFrontImage ? (
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl border-2 border-emerald-400 overflow-hidden bg-white shadow-md">
                  <img src={idCardFrontImage} alt="Front" className="w-full h-full object-cover" />
                </div>
                <span className="text-[9px] font-bold text-emerald-400">
                  {language === 'bn' ? 'সামনের ১/২' : 'Front 1/2'}
                </span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAutoCaptureEnabled(!autoCaptureEnabled);
                  showFeedback(
                    language === 'bn'
                      ? (autoCaptureEnabled ? 'ম্যানুয়াল মোড সক্রিয়' : 'স্বয়ংক্রিয় ক্যাপচার সক্রিয়')
                      : (autoCaptureEnabled ? 'Manual Shutter Mode' : 'Auto Capture Mode'),
                    'success'
                  );
                }}
                className="flex flex-col items-center gap-1 p-2 text-white/80 hover:text-white transition cursor-pointer active:scale-95"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center backdrop-blur-md shadow-md ${
                  autoCaptureEnabled 
                    ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                    : 'bg-white/10 border-white/15 text-white/60'
                }`}>
                  <Sparkles size={20} className={autoCaptureEnabled ? 'animate-pulse' : ''} />
                </div>
                <span className="text-[10px] font-bold tracking-wide">
                  {autoCaptureEnabled ? (language === 'bn' ? 'অটো' : 'Auto') : (language === 'bn' ? 'ম্যানুয়াল' : 'Manual')}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CAMERA SETTINGS MODAL SHEET                                            */}
        {/* ========================================================================= */}
        {showCameraSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-md space-y-5 text-white shadow-2xl animate-scale-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Settings size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold tracking-wide">
                    {language === 'bn' ? 'ক্যামেরা সেটিংস' : 'Camera Settings'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCameraSettingsModal(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {/* 1. Auto Capture */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="font-bold">{language === 'bn' ? 'অটো ক্যাপচার' : 'Auto Boundary Capture'}</p>
                    <p className="text-[10px] text-white/50">{language === 'bn' ? 'বর্ডার ঠিক থাকলে স্বয়ংক্রিয় ছবি' : 'Auto-snap when boundaries align'}</p>
                  </div>
                  <button
                    onClick={() => setAutoCaptureEnabled(!autoCaptureEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      autoCaptureEnabled ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      autoCaptureEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 2. Grid lines */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="font-bold">{language === 'bn' ? 'গ্রিড লাইন' : 'Rule-of-Thirds Grid'}</p>
                    <p className="text-[10px] text-white/50">{language === 'bn' ? 'সঠিক এলাইনমেন্টের জন্য গাইড' : 'Show alignment grid on viewfinder'}</p>
                  </div>
                  <button
                    onClick={() => setShowGridLines(!showGridLines)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      showGridLines ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      showGridLines ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 3. Camera Sound */}
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <p className="font-bold">{language === 'bn' ? 'শাটার সাউন্ড' : 'Shutter Audio Feedback'}</p>
                    <p className="text-[10px] text-white/50">{language === 'bn' ? 'ছবি তোলার সময় ক্লিকের শব্দ' : 'Play click sound on capture'}</p>
                  </div>
                  <button
                    onClick={() => setCameraSound(!cameraSound)}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      cameraSound ? 'bg-emerald-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      cameraSound ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* 4. Active Lens */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-bold">{language === 'bn' ? 'ক্যামেরা লেন্স' : 'Active Lens'}</p>
                    <p className="text-[10px] text-white/50">{cameraFacing === 'environment' ? 'Rear Camera (Back)' : 'Front Camera (Selfie)'}</p>
                  </div>
                  <button
                    onClick={handleSwitchCamera}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-[11px] text-emerald-400 cursor-pointer"
                  >
                    {language === 'bn' ? 'পরিবর্তন করুন' : 'Switch Lens'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowCameraSettingsModal(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
              >
                {language === 'bn' ? 'সম্পন্ন' : 'Done'}
              </button>
            </div>
          </div>
        )}
      </div>,
      document.body
    );
  };

  // Rotate captured raw image by 90 degrees clockwise
  const handleRotateOriginalImage = () => {
    if (!originalCapturedImage) return;
    const img = new Image();
    img.src = originalCapturedImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
      setOriginalCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
    };
  };

  // Interactive 4-Corner Draggable Quad Perspective Correction Editor & Laser Scan Workflow
  const renderInteractiveCropEditor = () => {
    if (!showInteractiveCrop || !originalCapturedImage) return null;

    const filterOptions = [
      { id: 'original', nameBn: 'স্বাভাবিক', nameEn: 'Original', css: 'none' },
      { id: 'whiten', nameBn: 'সাদা পাতা (স্পষ্ট)', nameEn: 'Whiten (Crisp)', css: 'contrast(125%) brightness(110%)' },
      { id: 'magic', nameBn: 'ম্যাজিক কালার', nameEn: 'Magic Color', css: 'saturate(135%) contrast(120%) brightness(105%)' },
      { id: 'bw', nameBn: 'কালো-সাদা', nameEn: 'B&W', css: 'grayscale(100%) contrast(200%) brightness(115%)' },
      { id: 'grayscale', nameBn: 'ধূসর', nameEn: 'Grayscale', css: 'grayscale(100%) contrast(110%)' },
    ];

    const currentFilterCss = filterOptions.find(f => f.id === selectedFilter)?.css || 'none';

    return (
      <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl max-w-2xl mx-auto space-y-4 animate-scale-in pb-28">
        {/* Header with status badge */}
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-500">
              {language === 'bn' ? 'ডকুমেন্ট ক্রপ ও অ্যাডজাস্টমেন্ট' : 'Adjust Crop Boundaries & Edit'}
            </span>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-500 rounded-full flex items-center gap-1">
            <Crop size={11} />
            <span>Manual Crop Mode</span>
          </span>
        </div>

        {/* Quick adjustments toolstrip */}
        <div className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-2 rounded-xl text-xs gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCropCorners({ tl: { x: 8, y: 10 }, tr: { x: 92, y: 10 }, br: { x: 92, y: 90 }, bl: { x: 8, y: 90 } })}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-text-main font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
          >
            <Focus size={13} className="text-emerald-500" />
            <span>{language === 'bn' ? 'অটো বাউন্ডারি' : 'Auto Boundary'}</span>
          </button>
          <button
            onClick={() => setCropCorners({ tl: { x: 0, y: 0 }, tr: { x: 100, y: 0 }, br: { x: 100, y: 100 }, bl: { x: 0, y: 100 } })}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-text-main font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
          >
            <Maximize size={13} className="text-blue-500" />
            <span>{language === 'bn' ? 'সম্পূর্ণ ছবি' : 'Full Image'}</span>
          </button>
          <button
            onClick={handleRotateOriginalImage}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-text-main font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
          >
            <RotateCw size={13} className="text-amber-500" />
            <span>{language === 'bn' ? 'ঘোরান ৯০০' : 'Rotate 90°'}</span>
          </button>
          <button
            onClick={() => {
              setCropCorners({ tl: { x: 8, y: 10 }, tr: { x: 92, y: 10 }, br: { x: 92, y: 90 }, bl: { x: 8, y: 90 } });
              setSelectedFilter('whiten');
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-lg text-text-main font-bold text-[11px] transition cursor-pointer whitespace-nowrap"
          >
            <RefreshCw size={13} className="text-purple-500" />
            <span>{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
          </button>
        </div>

        {/* Interactive Drag Canvas Box Container with Live Laser Scan Effect */}
        <div 
          ref={cropContainerRef}
          className="w-full aspect-[4/3] bg-black/90 rounded-2xl relative overflow-hidden border border-black/10 dark:border-white/10 select-none touch-none shadow-inner"
          onMouseMove={handleCornerDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchMove={handleCornerDrag}
          onTouchEnd={handleDragEnd}
        >
          {/* Source Image background */}
          <img 
            src={originalCapturedImage} 
            alt="Cropping target source" 
            style={{ filter: currentFilterCss }}
            className="w-full h-full object-contain pointer-events-none select-none"
            referrerPolicy="no-referrer"
          />

          {/* SVG Overlay connecting the 4 handles (hidden during laser scanning) */}
          {!isLaserScanning && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
              {/* Shaded mask area outside the quad */}
              <path 
                d={`M 0,0 L 100,0 L 100,100 L 0,100 Z M ${cropCorners.tl.x}%,${cropCorners.tl.y}% L ${cropCorners.tr.x}%,${cropCorners.tr.y}% L ${cropCorners.br.x}%,${cropCorners.br.y}% L ${cropCorners.bl.x}%,${cropCorners.bl.y}% Z`}
                fill="rgba(0, 0, 0, 0.65)"
                fillRule="evenodd"
              />
              {/* Polygon boundary lines with neon green accent */}
              <line x1={`${cropCorners.tl.x}%`} y1={`${cropCorners.tl.y}%`} x2={`${cropCorners.tr.x}%`} y2={`${cropCorners.tr.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" />
              <line x1={`${cropCorners.tr.x}%`} y1={`${cropCorners.tr.y}%`} x2={`${cropCorners.br.x}%`} y2={`${cropCorners.br.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" />
              <line x1={`${cropCorners.br.x}%`} y1={`${cropCorners.br.y}%`} x2={`${cropCorners.bl.x}%`} y2={`${cropCorners.bl.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" />
              <line x1={`${cropCorners.bl.x}%`} y1={`${cropCorners.bl.y}%`} x2={`${cropCorners.tl.x}%`} y2={`${cropCorners.tl.y}%`} stroke="#10b981" strokeWidth="2.5" strokeDasharray="6 4" />
            </svg>
          )}

          {/* 4 Interactive Drag Handles (hidden during laser scanning) */}
          {!isLaserScanning && ([
            { id: 'tl', label: 'TL', x: cropCorners.tl.x, y: cropCorners.tl.y },
            { id: 'tr', label: 'TR', x: cropCorners.tr.x, y: cropCorners.tr.y },
            { id: 'br', label: 'BR', x: cropCorners.br.x, y: cropCorners.br.y },
            { id: 'bl', label: 'BL', x: cropCorners.bl.x, y: cropCorners.bl.y }
          ] as const).map((corner) => (
            <div
              key={corner.id}
              onMouseDown={() => setActiveDragCorner(corner.id)}
              onTouchStart={() => setActiveDragCorner(corner.id)}
              style={{ 
                left: `${corner.x}%`, 
                top: `${corner.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 20
              }}
              className={`absolute w-8 h-8 rounded-full bg-emerald-500 border-2 border-white shadow-xl cursor-grab active:cursor-grabbing flex items-center justify-center transition-transform hover:scale-125 ${
                activeDragCorner === corner.id ? 'scale-125 ring-4 ring-emerald-400/50' : ''
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-white shadow" />
            </div>
          ))}

          {/* Magnifier zoom loupe while dragging handle */}
          {activeDragCorner && !isLaserScanning && (
            <div 
              className="absolute top-3 left-3 w-20 h-20 rounded-2xl border-2 border-emerald-400 shadow-2xl bg-black overflow-hidden z-30 pointer-events-none ring-2 ring-white/40"
              style={{ 
                backgroundImage: `url(${originalCapturedImage})`,
                backgroundSize: '400%',
                backgroundPosition: `${cropCorners[activeDragCorner].x}% ${cropCorners[activeDragCorner].y}%`
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white" />
              </div>
            </div>
          )}

          {/* 🌟 LASER SCANNING OVERLAY WHEN CONFIRM IS TRIGGERED 🌟 */}
          {isLaserScanning && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-between p-6 pointer-events-none bg-emerald-950/20 backdrop-blur-[1px] animate-fade-in">
              {/* Laser Line Sweeping Vertically */}
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_4px_rgba(52,211,153,0.95)] animate-[laserSweepDown_1.5s_ease-in-out_infinite]" />
              
              {/* Corner brackets HUD */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

              {/* Status indicator badge */}
              <div className="mt-4 px-4 py-2 rounded-full bg-black/80 border border-emerald-400/50 shadow-2xl flex items-center gap-2 animate-pulse">
                <Sparkles size={16} className="text-emerald-400 animate-spin" />
                <span className="text-xs font-black text-emerald-400 tracking-wider">
                  {language === 'bn' ? 'লেজার স্ক্যান ও এনহ্যান্সিং সম্পন্ন হচ্ছে...' : 'Laser Scanning & Aligning...'}
                </span>
              </div>

              {/* Radar pulse bottom */}
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300/80 bg-black/70 px-3 py-1 rounded-full border border-emerald-500/20">
                AI PERSPECTIVE CORRECTION ACTIVE
              </div>
            </div>
          )}
        </div>

        {/* Filter selection drawer */}
        {showFilterDrawer && (
          <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3 space-y-2 animate-slide-up">
            <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
              <span className="text-xs font-bold text-text-main flex items-center gap-1.5">
                <Palette size={14} className="text-purple-500" />
                <span>{language === 'bn' ? 'ডকুমেন্ট কালার ফিল্টার' : 'Document Color Filter'}</span>
              </span>
              <button 
                onClick={() => setShowFilterDrawer(false)}
                className="text-text-muted hover:text-text-main p-1 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {filterOptions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={`p-2 rounded-xl text-center transition border cursor-pointer ${
                    selectedFilter === f.id
                      ? 'bg-purple-600 text-white border-purple-500 font-black shadow-md'
                      : 'bg-black/5 dark:bg-white/5 text-text-muted hover:text-text-main border-transparent'
                  }`}
                >
                  <p className="text-[11px] font-bold truncate">{language === 'bn' ? f.nameBn : f.nameEn}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Edit Text modal */}
        {showTextEditModal && (
          <div className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-theme-card border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-2xl max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-cyan-500" />
                  <h3 className="text-sm font-black text-text-main">
                    {language === 'bn' ? 'ডকুমেন্ট টেক্সট ও নোট এডিট' : 'Edit Document Text & Notes'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowTextEditModal(false)}
                  className="p-1 rounded-lg text-text-muted hover:text-text-main cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-text-muted mb-1 block">
                    {language === 'bn' ? 'ডকুমেন্টের নাম' : 'Document Title'}
                  </label>
                  <input
                    type="text"
                    value={selectedDocName}
                    onChange={(e) => setSelectedDocName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted mb-1 block">
                    {language === 'bn' ? 'নোট ও বর্ণনা' : 'Notes & Metadata'}
                  </label>
                  <textarea
                    rows={4}
                    value={customDocNotes || selectedDocText}
                    onChange={(e) => setCustomDocNotes(e.target.value)}
                    placeholder={language === 'bn' ? 'ডকুমেন্টের প্রয়োজনীয় তথ্য বা নোট লিখুন...' : 'Enter custom document notes or OCR text...'}
                    className="w-full px-3 py-2 text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTextEditModal(false)}
                  className="flex-1 py-2 text-xs font-bold text-text-muted hover:text-text-main bg-black/5 dark:bg-white/5 rounded-xl transition cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setShowTextEditModal(false);
                    showFeedback(language === 'bn' ? 'টেক্সট সংরক্ষিত হয়েছে!' : 'Text saved!', 'success');
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition cursor-pointer"
                >
                  {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Text'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 EDIT SUB-MENU ACTION TRAY (APPEARS WHEN EDIT IS CLICKED) 🌟 */}
        {isEditMenuOpen && (
          createPortal(
            <div className="fixed bottom-24 left-4 right-4 max-w-md mx-auto z-[1260] bg-neutral-900/95 backdrop-blur-2xl border border-white/15 p-3 rounded-2xl shadow-2xl animate-slide-up">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Edit3 size={13} />
                  <span>{language === 'bn' ? 'এডিট অপশন সমূহ' : 'Edit Options'}</span>
                </span>
                <button
                  onClick={() => setIsEditMenuOpen(false)}
                  className="text-white/60 hover:text-white p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {/* 1. Crop */}
                <button
                  onClick={() => {
                    setActiveEditSubTool('crop');
                    setIsEditMenuOpen(false);
                    showFeedback(language === 'bn' ? 'ম্যানুয়াল ক্রপ মোড সক্রিয়' : 'Manual Crop Activated', 'info');
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-white/90 hover:text-emerald-400 transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1 group-hover:scale-110 transition">
                    <Crop size={16} />
                  </div>
                  <span className="text-[11px] font-bold">Crop</span>
                </button>

                {/* 2. Filter */}
                <button
                  onClick={() => {
                    setShowFilterDrawer(!showFilterDrawer);
                    setIsEditMenuOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-purple-500/20 text-white/90 hover:text-purple-400 transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-1 group-hover:scale-110 transition">
                    <Palette size={16} />
                  </div>
                  <span className="text-[11px] font-bold">Filter</span>
                </button>

                {/* 3. Edit Text */}
                <button
                  onClick={() => {
                    setShowTextEditModal(true);
                    setIsEditMenuOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-cyan-500/20 text-white/90 hover:text-cyan-400 transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-1 group-hover:scale-110 transition">
                    <FileText size={16} />
                  </div>
                  <span className="text-[11px] font-bold whitespace-nowrap">Edit Text</span>
                </button>

                {/* 4. Retake */}
                <button
                  onClick={() => {
                    setIsEditMenuOpen(false);
                    setOriginalCapturedImage(null);
                    setShowInteractiveCrop(false);
                    setIsReviewMode(false);
                    startCamera(activeMode || 'DOCUMENT_SCAN');
                  }}
                  className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/20 text-white/90 hover:text-amber-400 transition cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 mb-1 group-hover:scale-110 transition">
                    <RotateCcw size={16} />
                  </div>
                  <span className="text-[11px] font-bold">Retake</span>
                </button>
              </div>
            </div>,
            document.body
          )
        )}

        {/* 🌟 REPLACEMENT FOR APPLICATION'S BOTTOM NAVIGATION BAR 🌟 */}
        {createPortal(
          <div className="fixed bottom-0 left-0 right-0 z-[1250] bg-neutral-950/95 backdrop-blur-2xl border-t border-white/10 px-4 py-2.5 shadow-2xl pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="max-w-xl mx-auto flex items-center justify-between">
              {/* 1. Add (Camera Icon) */}
              <button
                onClick={() => {
                  setIsEditMenuOpen(false);
                  startCamera(activeMode || 'DOCUMENT_SCAN');
                }}
                className="flex flex-col items-center justify-center gap-1 py-1 px-4 text-white/80 hover:text-white transition cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition">
                  <Camera size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Add
                </span>
              </button>

              {/* 2. Edit (Edit Icon) */}
              <button
                onClick={() => setIsEditMenuOpen(!isEditMenuOpen)}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-4 transition cursor-pointer group ${
                  isEditMenuOpen ? 'text-blue-400 font-bold' : 'text-white/80 hover:text-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                  isEditMenuOpen ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/10 text-blue-400 group-hover:bg-blue-500/20'
                }`}>
                  <Edit3 size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Edit
                </span>
              </button>

              {/* 3. Confirm (কনফার্ম Button to trigger laser scan) */}
              <button
                onClick={handleConfirmAndLaserScan}
                disabled={isLaserScanning}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition cursor-pointer disabled:opacity-50"
              >
                <Sparkles size={16} className={isLaserScanning ? "animate-spin" : ""} />
                <span>
                  {isLaserScanning 
                    ? (language === 'bn' ? 'স্ক্যান হচ্ছে...' : 'Scanning...') 
                    : (language === 'bn' ? 'কনফার্ম' : 'Confirm')}
                </span>
              </button>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  };

  const handleDownloadCombinedIDCard = () => {
    if (!idCardFrontImage && !idCardBackImage) return;
    
    setIsProcessing(true);
    
    const frontImg = idCardFrontImage ? new Image() : null;
    const backImg = idCardBackImage ? new Image() : null;
    
    const requiredImages = [frontImg, backImg].filter(Boolean) as HTMLImageElement[];
    let loadedCount = 0;

    const renderCardCanvas = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      
      const selectedSize = DEFAULT_PAGE_SIZES.find(s => s.id === pdfConfig.pageSize) || { widthCm: 21.0, heightCm: 29.7 };
      const baseW = Math.round((selectedSize.widthCm || 21.0) * 59.05); // ~150 DPI
      const baseH = Math.round((selectedSize.heightCm || 29.7) * 59.05);

      let isLandscape = pdfConfig.direction === 'landscape';
      if (pdfConfig.direction === 'auto') {
        isLandscape = pdfLayoutMode === 'horizontal';
      }

      const canvasW = isLandscape ? Math.max(baseW, baseH) : Math.min(baseW, baseH);
      const canvasH = isLandscape ? Math.min(baseW, baseH) : Math.max(baseW, baseH);
      const effectiveMargin = pdfConfig.hasMargin ? pdfMargin : 8;
      
      canvas.width = canvasW;
      canvas.height = canvasH;
      
      // Draw background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasW, canvasH);
      
      // Draw gridlines if enabled
      if (pdfShowGrid) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < canvasW; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvasH);
          ctx.stroke();
        }
        for (let y = 0; y < canvasH; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvasW, y);
          ctx.stroke();
        }
      }

      // Draw lock indicator if encrypted
      if (pdfConfig.isLocked) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('🔒 Password Protected', canvasW - 30, 35);
      }

      // Draw page numbers if enabled
      if (pdfConfig.pageNumber && pdfConfig.pageNumber !== 'No page number') {
        ctx.fillStyle = '#6b7280';
        ctx.font = '16px sans-serif';
        if (pdfConfig.pageNumber.includes('Center')) {
          ctx.textAlign = 'center';
          ctx.fillText('1', canvasW / 2, canvasH - 30);
        } else if (pdfConfig.pageNumber.includes('Right')) {
          ctx.textAlign = 'right';
          ctx.fillText('1', canvasW - 40, canvasH - 30);
        } else {
          ctx.textAlign = 'center';
          ctx.fillText('1', canvasW / 2, canvasH - 30);
        }
      }
      
      // Define card size based on selection
      let cardW = 500;
      let cardH = 316;
      
      if (pdfCardSize === 'compact') {
        cardW = 440;
        cardH = 278;
      } else if (pdfCardSize === 'large') {
        cardW = 560;
        cardH = 354;
      }
      
      const hasBoth = !!(frontImg && backImg);

      if (!hasBoth) {
        // Only one side captured so far
        const singleImg = frontImg || backImg;
        if (singleImg) {
          const startX = (canvasW - cardW) / 2;
          const startY = (canvasH - cardH) / 2;
          ctx.drawImage(singleImg, startX, startY, cardW, cardH);
          if (pdfShowLabels) {
            ctx.fillStyle = '#4b5563';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(frontImg ? (language === 'bn' ? 'সামনের অংশ (FRONT SIDE)' : 'FRONT SIDE') : (language === 'bn' ? 'পিছনের অংশ (BACK SIDE)' : 'BACK SIDE'), canvasW / 2, startY - 20);
          }
        }
      } else if (pdfLayoutMode === 'vertical_stack') {
        const startX = (canvasW - cardW) / 2;
        const startY = Math.max(80, (canvasH - (cardH * 2 + effectiveMargin * 3)) / 2);
        
        if (frontImg) {
          ctx.drawImage(frontImg, startX, startY, cardW, cardH);
          if (pdfShowLabels) {
            ctx.fillStyle = '#4b5563';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(language === 'bn' ? 'সামনের অংশ (FRONT SIDE)' : 'FRONT SIDE', canvasW / 2, startY - 20);
          }
        }
        
        const nextY = startY + cardH + effectiveMargin * 3;
        if (backImg) {
          ctx.drawImage(backImg, startX, nextY, cardW, cardH);
          if (pdfShowLabels) {
            ctx.fillStyle = '#4b5563';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(language === 'bn' ? 'পিছনের অংশ (BACK SIDE)' : 'BACK SIDE', canvasW / 2, nextY - 20);
          }
        }
      } else if (pdfLayoutMode === 'horizontal') {
        const gap = effectiveMargin * 2;
        const totalW = cardW * 2 + gap;
        const startX = (canvasW - totalW) / 2;
        const startY = (canvasH - cardH) / 2;
        
        if (frontImg) {
          ctx.drawImage(frontImg, startX, startY, cardW, cardH);
          if (pdfShowLabels) {
            ctx.fillStyle = '#4b5563';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(language === 'bn' ? 'সামনের অংশ (FRONT)' : 'FRONT SIDE', startX + cardW / 2, startY - 20);
          }
        }
        
        if (backImg) {
          ctx.drawImage(backImg, startX + cardW + gap, startY, cardW, cardH);
          if (pdfShowLabels) {
            ctx.fillStyle = '#4b5563';
            ctx.font = 'bold 18px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(language === 'bn' ? 'পিছনের অংশ (BACK)' : 'BACK SIDE', startX + cardW + gap + cardW / 2, startY - 20);
          }
        }
      } else {
        // Separate Pages
        canvas.height = canvasH * 2;
        
        // Page 1
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);
        if (frontImg) {
          ctx.drawImage(frontImg, (canvasW - cardW) / 2, (canvasH - cardH) / 2, cardW, cardH);
          if (pdfShowLabels) {
            ctx.fillStyle = '#4b5563';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(language === 'bn' ? 'সামনের অংশ (FRONT)' : 'FRONT SIDE', canvasW / 2, ((canvasH - cardH) / 2) - 30);
          }
        }
        
        // Page 2 separator line
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, canvasH, canvasW, 10);
        
        // Page 2
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, canvasH + 10, canvasW, canvasH);
        if (backImg) {
          ctx.drawImage(backImg, (canvasW - cardW) / 2, canvasH + 10 + (canvasH - cardH) / 2, cardW, cardH);
          if (pdfShowLabels) {
            ctx.fillStyle = '#4b5563';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(language === 'bn' ? 'পিছনের অংশ (BACK)' : 'BACK SIDE', canvasW / 2, canvasH + 10 + ((canvasH - cardH) / 2) - 30);
          }
        }
      }
      
      try {
        const downloadUrl = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `FleetPro_ID_Card_${pdfConfig.pageSize}_${pdfConfig.direction}.jpg`;
        link.href = downloadUrl;
        link.click();
        showFeedback(
          language === 'bn' 
            ? 'আইডি কার্ড পেজ লেআউট ডাউনলোড সফল!' 
            : 'ID Card page layout successfully generated and downloaded!', 
          'success'
        );
      } catch (err) {
        console.error("Combined download failed:", err);
      }
      setIsProcessing(false);
    };

    const onImgLoad = () => {
      loadedCount++;
      if (loadedCount === requiredImages.length) {
        renderCardCanvas();
      }
    };

    requiredImages.forEach(img => {
      img.onload = onImgLoad;
      img.onerror = () => setIsProcessing(false);
    });

    if (frontImg && idCardFrontImage) frontImg.src = idCardFrontImage;
    if (backImg && idCardBackImage) backImg.src = idCardBackImage;
  };

  return (
    <div className="min-h-screen pb-24 bg-transparent text-text-main">
      <style>{`
        @keyframes scanLaser {
          0%, 100% { top: 5%; }
          50% { top: 95%; }
        }
      `}</style>

      {/* HIDDEN INPUT FOR FILE UPLOADS */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      {/* HIDDEN INPUT FOR DIRECT CAMERA CAPTURES */}
      <input 
        type="file" 
        ref={cameraCaptureInputRef} 
        onChange={handleCameraCapture} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* MAIN SCREEN ROUTING */}
      {!activeMode ? (
        // ======================================================================
        // GRID MENUS VIEW (PRIMARY SCANNER PAGE)
        // ======================================================================
        <div className="space-y-6 animate-fade-in">
          {/* Feature Grid Component */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SCANNER_FEATURES.map((feat) => (
              <button
                key={feat.id}
                onClick={() => {
                  if (feat.id === 'SCAN_ID_CARD') {
                    setIdCardFrontImage(null);
                    setIdCardBackImage(null);
                    setIdCardCurrentSide('front');
                  }
                  if (['SCAN_ID_CARD', 'SCAN_PASSPORT', 'SCAN_DRIVING_LICENSE', 'DOCUMENT_SCAN'].includes(feat.id)) {
                    setActiveMode(feat.id);
                    setScanStep('viewfinder');
                    startCamera(feat.id);
                  } else {
                    setActiveMode(feat.id);
                    if (feat.id === 'ENHANCE') setSelectedFilter('whiten');
                  }
                }}
                className="bg-theme-card hover:bg-black/[0.02] dark:hover:bg-white/[0.02] border border-black/5 dark:border-white/10 rounded-2xl p-5 flex flex-col items-start text-left shadow-sm hover:shadow-md hover:border-black/15 dark:hover:border-white/20 transition-all duration-300 relative group cursor-pointer active:scale-[0.98]"
              >
                {/* Glow Background Effect on Hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none rounded-2xl" 
                  style={{ backgroundColor: feat.color }}
                />

                {/* Rounded Icon Box */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-sm"
                  style={{ backgroundColor: feat.color }}
                >
                  {feat.icon}
                </div>

                <h3 className="font-extrabold text-sm text-text-main group-hover:text-[var(--primary)] transition-colors">
                  {language === 'bn' ? feat.labelBn : feat.labelEn}
                </h3>
                
                <p className="text-[10px] text-text-muted mt-1.5 leading-relaxed">
                  {language === 'bn' ? feat.descriptionBn : feat.descriptionEn}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // ======================================================================
        // DEDICATED FEATURE INTERFACES
        // ======================================================================
        <div className="space-y-6 animate-scale-in">
          
          {isStreaming && renderBespokeCameraView()}
          
          {showInteractiveCrop && renderInteractiveCropEditor()}

          {!isStreaming && !showInteractiveCrop && (
            <>
              {/* 🌟 1A. ID CARD & DRIVING LICENSE SCAN (DUAL SIDE PAGE BUILDER) */}
              {(activeMode === 'SCAN_ID_CARD' || activeMode === 'SCAN_DRIVING_LICENSE') && (
                <div className={`mx-auto animate-fade-in ${scanStep === 'result' ? 'max-w-6xl' : 'max-w-2xl'} space-y-6`}>
                  {/* Title & Stats */}
                  <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-wider text-blue-500">
                          {activeMode === 'SCAN_DRIVING_LICENSE'
                            ? (language === 'bn' ? 'ড্রাইভিং লাইসেন্স স্ক্যানার ও পেজ লেআউট' : 'Driving License Scanner & Page Layout')
                            : (language === 'bn' ? 'জাতীয় পরিচয়পত্র স্ক্যানার ও পেজ লেআউট' : 'National ID Card Scanner & Page Layout')
                          }
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-500 rounded-full">
                        {activeMode === 'SCAN_DRIVING_LICENSE' ? 'Driving Permit Dual Side' : 'ISO-7810 Dual Side'}
                      </span>
                    </div>

                    {/* VIEWPORT STEP 1 & 2: VIEWFINDER & UPLOADS */}
                    {scanStep === 'viewfinder' && (
                      <div className="space-y-6 text-center py-4">
                        <div className="flex justify-center items-center gap-2 mb-2">
                          <button
                            type="button"
                            onClick={() => setIdCardCurrentSide('front')}
                            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                              idCardCurrentSide === 'front' 
                                ? 'bg-blue-500 text-white shadow-sm' 
                                : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-black/10'
                            }`}
                          >
                            {language === 'bn' ? '১. সামনের দিক (Front)' : '1. Front Side'}
                          </button>
                          <span className="text-text-muted">➔</span>
                          <button
                            type="button"
                            onClick={() => setIdCardCurrentSide('back')}
                            className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                              idCardCurrentSide === 'back' 
                                ? 'bg-blue-500 text-white shadow-sm' 
                                : 'bg-black/5 dark:bg-white/5 text-text-muted hover:bg-black/10'
                            }`}
                          >
                            {language === 'bn' ? '২. পিছনের দিক (Back)' : '2. Back Side'}
                          </button>
                        </div>

                        <p className="text-xs text-text-muted max-w-md mx-auto">
                          {idCardCurrentSide === 'front'
                            ? (language === 'bn'
                              ? 'আপনার কার্ডের সামনের অংশটি ক্যামেরার সামনে সোজা করে ধরুন বা ছবি আপলোড করুন। এটি সরাসরি পেজে যোগ হবে।'
                              : 'Align the FRONT of your card. It will be added onto the document page immediately.')
                            : (language === 'bn'
                              ? 'এখন কার্ডের পিছনের অংশটি ক্যামেরার সামনে ধরুন বা আপলোড করুন। এটি পেজের ২য় স্লটে যোগ হবে।'
                              : 'Now align and capture the BACK side. It will be placed into the second slot on the page.')}
                        </p>

                        {/* ID Card Simulated Viewfinder Frame */}
                        <div className="w-full aspect-[1.58/1] max-w-md mx-auto rounded-xl border-2 border-dashed border-blue-500 bg-black/90 relative overflow-hidden flex items-center justify-center p-4 shadow-inner">
                          <div className="absolute inset-2 border border-blue-400/15 rounded-lg">
                            <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-20 pointer-events-none">
                              <div className="border-r border-b border-white/10"></div>
                              <div className="border-r border-b border-white/10"></div>
                              <div className="border-r border-b border-white/10"></div>
                              <div className="border-b border-white/10"></div>
                              <div className="border-r border-b border-white/10"></div>
                              <div className="border-r border-b border-white/10"></div>
                              <div className="border-r border-b border-white/10"></div>
                              <div className="border-b border-white/10"></div>
                            </div>

                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

                            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-20 border border-blue-500/30 rounded-lg flex flex-col items-center justify-center bg-blue-500/5">
                              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500/60">
                                <IdCard size={16} />
                              </div>
                              <span className="text-[7px] text-blue-400/60 uppercase font-black mt-2">
                                {idCardCurrentSide === 'front' ? 'FRONT PHOTO' : 'BACK / BARCODE'}
                              </span>
                            </div>

                            <div className="absolute left-24 top-6 space-y-2 text-left">
                              <div className="w-24 h-2 bg-blue-500/20 rounded" />
                              <div className="w-32 h-1.5 bg-blue-500/10 rounded" />
                              <div className="w-16 h-1.5 bg-blue-500/10 rounded" />
                              <div className="w-28 h-1.5 bg-blue-500/10 rounded" />
                            </div>

                            {/* Center Guideline Text Inside Viewfinder */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="px-3 py-1 bg-blue-600/80 text-white font-extrabold text-[10px] rounded-lg tracking-wider animate-pulse uppercase">
                                {idCardCurrentSide === 'front' 
                                  ? (language === 'bn' ? 'সামনের দিক রাখুন' : 'FRONT SIDE HERE') 
                                  : (language === 'bn' ? 'পিছনের দিক রাখুন' : 'BACK SIDE HERE')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Capture Buttons */}
                        <div className="flex gap-3 max-w-md mx-auto pt-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Upload size={14} />
                            <span>{language === 'bn' ? 'ফাইল আপলোড' : 'Upload Side'}</span>
                          </button>
                          <button
                            onClick={() => startCamera(activeMode || 'SCAN_ID_CARD')}
                            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Camera size={14} />
                            <span>
                              {idCardCurrentSide === 'front' 
                                ? (language === 'bn' ? 'সামনের দিক তুলুন' : 'Capture Front')
                                : (language === 'bn' ? 'পিছনের দিক তুলুন' : 'Capture Back')}
                            </span>
                          </button>
                        </div>

                        {/* Progress Status Thumbnail of captured front side */}
                        {idCardFrontImage && (
                          <div className="border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-3 max-w-md mx-auto flex items-center gap-3">
                            <div className="w-16 aspect-[1.58/1] rounded border border-blue-500/20 overflow-hidden bg-white">
                              <img src={idCardFrontImage} alt="Front Thumbnail" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="text-[10px] font-black uppercase text-blue-500">
                                {language === 'bn' ? '১ম সাইট পেজে যোগ হয়েছে' : 'FRONT SIDE ON PAGE'}
                              </p>
                              <p className="text-[9px] text-text-muted">
                                {language === 'bn' ? 'এখন পিছনের দিকটি তুলুন।' : 'Ready for the back side photo.'}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setIdCardFrontImage(null);
                                setIdCardCurrentSide('front');
                              }}
                              className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase"
                            >
                              {language === 'bn' ? 'মুছুন' : 'Reset'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SCAN PROCESSING VIEW */}
                    {scanStep === 'processing' && (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin flex items-center justify-center">
                          <IdCard size={24} className="text-blue-500 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-black text-text-main">
                            {language === 'bn' ? 'কার্ড প্রসেস করে পেজে বসানো হচ্ছে...' : 'Processing & Adding to Page...'}
                          </h3>
                          <p className="text-[10px] text-text-muted max-w-xs">
                            {language === 'bn' ? 'বর্ডার ডিটেকশন এবং পেজ লেআউট তৈরি হচ্ছে।' : 'Straightening edges and positioning on page...'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* SCAN COMPLETED SEQUENTIAL PAGE LAYOUT BUILDER */}
                    {scanStep === 'result' && (idCardFrontImage || idCardBackImage) && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                        
                        {/* 1. PDF LAYOUT SETTINGS PANEL (CAMSCANNER STYLE) */}
                        <div className="lg:col-span-5 space-y-5">
                          
                          {/* Sequential Addition Status Banner */}
                          {(!idCardFrontImage || !idCardBackImage) ? (
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 text-left space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                                  <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                    {language === 'bn' ? '১/২ অংশ পেজে যোগ হয়েছে' : '1 of 2 Sides on Page'}
                                  </h4>
                                </div>
                                <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
                                  {language === 'bn' ? 'আংশিক লেআউট' : 'Partial Layout'}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted leading-relaxed">
                                {language === 'bn'
                                  ? (!idCardFrontImage ? 'সামনের অংশটি এখনও যোগ করা হয়নি। স্ক্যান করে পেজে সরাসরি বসিয়ে নিন।' : 'চমৎকার! সামনের অংশ পেজে বসেছে। এখন পিছনের অংশ স্ক্যান করে পেজের ২য় স্লটে যুক্ত করুন।')
                                  : (!idCardFrontImage ? 'Front side missing. Capture to complete the sheet.' : 'Front side placed! Now scan the back side to complete your dual-sided sheet.')}
                              </p>
                              <div className="flex gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIdCardCurrentSide(!idCardFrontImage ? 'front' : 'back');
                                    startCamera(activeMode || 'SCAN_ID_CARD');
                                  }}
                                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Camera size={14} />
                                  <span>
                                    {!idCardFrontImage 
                                      ? (language === 'bn' ? '+ সামনের সাইট তুলুন' : '+ Scan Front') 
                                      : (language === 'bn' ? '+ পিছনের সাইট তুলুন' : '+ Scan Back')}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIdCardCurrentSide(!idCardFrontImage ? 'front' : 'back');
                                    fileInputRef.current?.click();
                                  }}
                                  className="py-2.5 px-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 text-text-main rounded-xl text-xs font-black uppercase transition-all border border-black/5 dark:border-white/5 flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Upload size={14} />
                                  <span>{language === 'bn' ? 'আপলোড' : 'Upload'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 text-left flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                  <Check size={14} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">
                                    {language === 'bn' ? '২/২ উভয় সাইট পেজে প্রস্তুত' : 'Both Sides Added to Page'}
                                  </h4>
                                  <p className="text-[10px] text-text-muted">
                                    {language === 'bn' ? 'পেজ বিন্যাস ডাউনলোড বা সেভ করতে পারেন।' : 'Complete document ready for export.'}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full">
                                100% READY
                              </span>
                            </div>
                          )}

                          <div className="bg-neutral-900 text-white rounded-2xl p-5 border border-white/10 space-y-4 text-left shadow-lg">
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                              <div className="flex items-center gap-2">
                                <FileText size={16} className="text-[#00af80]" />
                                <h3 className="text-sm font-bold text-white tracking-wide">
                                  PDF Settings
                                </h3>
                              </div>
                              <button
                                onClick={() => setShowPdfSettingsModal(true)}
                                className="text-[11px] font-bold text-[#00af80] hover:text-[#00af80]/80 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>{language === 'bn' ? 'সব সেটিংস' : 'All Settings'}</span>
                                <ChevronRight size={13} />
                              </button>
                            </div>

                            {/* CamScanner Setting Rows */}
                            <div className="divide-y divide-white/5 text-xs">
                              {/* 1. Lock */}
                              <button 
                                onClick={() => setShowPdfSettingsModal(true)}
                                className="w-full py-3 flex items-center justify-between hover:bg-white/5 px-2 rounded-lg transition-colors cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-400 font-bold text-sm">👑</span>
                                  <span className="font-semibold text-white">Lock</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-neutral-400">
                                  <span className="text-[11px]">
                                    {pdfConfig.isLocked ? (language === 'bn' ? 'সুরক্ষিত' : 'Protected') : (language === 'bn' ? 'লক নেই' : 'Not set')}
                                  </span>
                                  <ChevronRight size={14} className="text-neutral-500" />
                                </div>
                              </button>

                              {/* 2. Page Number */}
                              <button 
                                onClick={() => setShowPdfSettingsModal(true)}
                                className="w-full py-3 flex items-center justify-between hover:bg-white/5 px-2 rounded-lg transition-colors cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-400 font-bold text-sm">👑</span>
                                  <span className="font-semibold text-white">Page Number</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-neutral-400">
                                  <span className="text-[11px] truncate max-w-[140px]">{pdfConfig.pageNumber}</span>
                                  <ChevronRight size={14} className="text-neutral-500" />
                                </div>
                              </button>

                              {/* 3. PDF Direction */}
                              <div className="py-3 flex items-center justify-between px-2">
                                <span className="font-semibold text-white">PDF Direction</span>
                                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
                                  <button
                                    onClick={() => setPdfConfig(prev => ({ ...prev, direction: 'auto' }))}
                                    className={`px-2 py-1 text-[10px] font-bold rounded ${
                                      pdfConfig.direction === 'auto' ? 'bg-[#00af80] text-white shadow' : 'text-neutral-400 hover:text-white'
                                    }`}
                                  >
                                    Auto
                                  </button>
                                  <button
                                    onClick={() => setPdfConfig(prev => ({ ...prev, direction: 'portrait' }))}
                                    className={`px-2 py-1 text-[10px] font-bold rounded ${
                                      pdfConfig.direction === 'portrait' ? 'bg-[#00af80] text-white shadow' : 'text-neutral-400 hover:text-white'
                                    }`}
                                  >
                                    Portrait
                                  </button>
                                  <button
                                    onClick={() => setPdfConfig(prev => ({ ...prev, direction: 'landscape' }))}
                                    className={`px-2 py-1 text-[10px] font-bold rounded ${
                                      pdfConfig.direction === 'landscape' ? 'bg-[#00af80] text-white shadow' : 'text-neutral-400 hover:text-white'
                                    }`}
                                  >
                                    Landscape
                                  </button>
                                </div>
                              </div>

                              {/* 4. PDF Page Size */}
                              <button 
                                onClick={() => setShowPdfSettingsModal(true)}
                                className="w-full py-3 flex items-center justify-between hover:bg-white/5 px-2 rounded-lg transition-colors cursor-pointer text-left"
                              >
                                <span className="font-semibold text-white">PDF Page Size</span>
                                <div className="flex items-center gap-1.5 text-neutral-400">
                                  <span className="text-[11px]">
                                    {pdfConfig.pageSize} {DEFAULT_PAGE_SIZES.find(s => s.id === pdfConfig.pageSize)?.dimensions}
                                  </span>
                                  <ChevronRight size={14} className="text-neutral-500" />
                                </div>
                              </button>

                              {/* 5. PDF Page Margin */}
                              <div className="py-3 flex items-center justify-between px-2">
                                <div>
                                  <div className="font-semibold text-white">PDF Page Margin</div>
                                  <div className="text-[10px] text-neutral-400">Add Margin on PDF Page</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setPdfConfig(prev => ({ ...prev, hasMargin: !prev.hasMargin }))}
                                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                                    pdfConfig.hasMargin ? 'bg-[#00af80]' : 'bg-neutral-700'
                                  }`}
                                >
                                  <div
                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                      pdfConfig.hasMargin ? 'translate-x-6' : 'translate-x-0'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Secondary ID Card Arrangement Panel */}
                          <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-xl p-4 border border-black/5 dark:border-white/5 space-y-4 text-left">
                            {/* Layout Mode Option */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block">
                                {language === 'bn' ? 'কার্ড বিন্যাস (Layout)' : 'ID Card Arrangement'}
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => setPdfLayoutMode('vertical_stack')}
                                  className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    pdfLayoutMode === 'vertical_stack'
                                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                      : 'bg-theme-card border-black/5 dark:border-white/15 text-text-main hover:bg-black/5'
                                  }`}
                                >
                                  {language === 'bn' ? 'উপরে-নিচে' : 'Vertical Stack'}
                                </button>
                                <button
                                  onClick={() => setPdfLayoutMode('horizontal')}
                                  className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    pdfLayoutMode === 'horizontal'
                                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                      : 'bg-theme-card border-black/5 dark:border-white/15 text-text-main hover:bg-black/5'
                                  }`}
                                >
                                  {language === 'bn' ? 'পাশাপাশি' : 'Side-by-Side'}
                                </button>
                                <button
                                  onClick={() => setPdfLayoutMode('separate_pages')}
                                  className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    pdfLayoutMode === 'separate_pages'
                                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                      : 'bg-theme-card border-black/5 dark:border-white/15 text-text-main hover:bg-black/5'
                                  }`}
                                >
                                  {language === 'bn' ? 'আলাদা পৃষ্ঠা' : 'Separate Pages'}
                                </button>
                              </div>
                            </div>

                            {/* Card Sizing Mode */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block">
                                {language === 'bn' ? 'কার্ড আকার (Size)' : 'Card Size'}
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                <button
                                  onClick={() => setPdfCardSize('compact')}
                                  className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    pdfCardSize === 'compact'
                                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                      : 'bg-theme-card border-black/5 dark:border-white/15 text-text-main hover:bg-black/5'
                                  }`}
                                >
                                  Compact
                                </button>
                                <button
                                  onClick={() => setPdfCardSize('standard')}
                                  className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    pdfCardSize === 'standard'
                                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                      : 'bg-theme-card border-black/5 dark:border-white/15 text-text-main hover:bg-black/5'
                                  }`}
                                >
                                  Standard
                                </button>
                                <button
                                  onClick={() => setPdfCardSize('large')}
                                  className={`py-1.5 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                                    pdfCardSize === 'large'
                                      ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                      : 'bg-theme-card border-black/5 dark:border-white/15 text-text-main hover:bg-black/5'
                                  }`}
                                >
                                  Large
                                </button>
                              </div>
                            </div>

                            {/* Toggles */}
                            <div className="grid grid-cols-2 gap-4 pt-1">
                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={pdfShowLabels}
                                  onChange={(e) => setPdfShowLabels(e.target.checked)}
                                  className="rounded border-black/10 text-blue-500 focus:ring-blue-500/20 w-4 h-4"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-main group-hover:text-blue-500 transition-colors">
                                  {language === 'bn' ? 'হেডার লেবেল' : 'Show Labels'}
                                </span>
                              </label>

                              <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={pdfShowGrid}
                                  onChange={(e) => setPdfShowGrid(e.target.checked)}
                                  className="rounded border-black/10 text-blue-500 focus:ring-blue-500/20 w-4 h-4"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-text-main group-hover:text-blue-500 transition-colors">
                                  {language === 'bn' ? 'গ্রিড গাইড' : 'Grid Guide'}
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Action Controls Column */}
                          <div className="space-y-3">
                            <button
                              onClick={handleDownloadCombinedIDCard}
                              className="w-full py-3.5 bg-[#00af80] hover:bg-[#009e73] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Download size={16} />
                              <span>{language === 'bn' ? 'পিডিএফ লেআউট ডাউনলোড করুন' : 'Download ID PDF / JPG'}</span>
                            </button>

                            <button
                              onClick={() => {
                                const newHistoryItem: ScannedItem = {
                                  id: `id-layout-${Date.now()}`,
                                  name: `${activeMode === 'SCAN_DRIVING_LICENSE' ? 'Driving_License' : 'ID_Card'}_${pdfConfig.pageSize}_${Date.now().toString().slice(-4)}.jpg`,
                                  date: new Date().toLocaleDateString(),
                                  image: idCardFrontImage || idCardBackImage || '',
                                  text: `Card Page Layout:\nPage Format: ${pdfConfig.pageSize} (${pdfConfig.direction})\nLayout: ${pdfLayoutMode}\nMargin: ${pdfConfig.hasMargin ? 'Yes' : 'No'}`,
                                  size: '72 KB'
                                };
                                saveHistory([newHistoryItem, ...scannedHistory]);
                                setActiveMode(null);
                                showFeedback(
                                  language === 'bn' 
                                    ? 'কার্ড লেআউট সফলভাবে ইতিহাসে সেভ করা হয়েছে!' 
                                    : 'Saved card layout to history successfully!', 
                                  'success'
                                );
                              }}
                              className="w-full py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main font-bold text-xs uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Check size={14} className="text-[#00af80]" />
                              <span>{language === 'bn' ? 'ইতিহাসে সেভ করুন' : 'Save Layout to History'}</span>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setIdCardCurrentSide('front');
                                  setScanStep('viewfinder');
                                }}
                                className="py-2 bg-black/5 hover:bg-amber-500/10 dark:bg-white/5 text-text-main hover:text-amber-500 font-bold text-[10px] uppercase rounded-lg border border-black/5 dark:border-white/5 cursor-pointer"
                              >
                                {language === 'bn' ? 'সামনে পুনরায় তুলুন' : 'Retake Front'}
                              </button>
                              <button
                                onClick={() => {
                                  setIdCardCurrentSide('back');
                                  setScanStep('viewfinder');
                                }}
                                className="py-2 bg-black/5 hover:bg-amber-500/10 dark:bg-white/5 text-text-main hover:text-amber-500 font-bold text-[10px] uppercase rounded-lg border border-black/5 dark:border-white/5 cursor-pointer"
                              >
                                {language === 'bn' ? 'পিছনে পুনরায় তুলুন' : 'Retake Back'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* 2. LIVE DOCUMENT SHEET REAL-TIME PREVIEW PANEL */}
                        <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-3">
                          <div className="flex items-center justify-between w-full max-w-sm px-1">
                            <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase">
                              {pdfConfig.pageSize} • {pdfConfig.direction === 'landscape' ? 'Landscape' : pdfConfig.direction === 'portrait' ? 'Portrait' : 'Auto'}
                            </span>
                            {pdfConfig.isLocked && (
                              <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                                🔒 Locked
                              </span>
                            )}
                          </div>

                          {/* Outer Sheet Container */}
                          <div className="w-full max-w-sm border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-xl bg-neutral-100 dark:bg-neutral-900 p-5 flex items-center justify-center">
                            
                            {/* Paper Layout representation */}
                            <div 
                              className={`w-full relative shadow-lg bg-white border border-neutral-200 text-neutral-800 transition-all duration-300 ${
                                (pdfConfig.direction === 'landscape' || (pdfConfig.direction === 'auto' && pdfLayoutMode === 'horizontal'))
                                  ? 'aspect-[1.414/1]' 
                                  : 'aspect-[1/1.414]'
                              }`}
                              style={{
                                backgroundImage: pdfShowGrid 
                                  ? 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)' 
                                  : 'none',
                                backgroundSize: '16px 16px',
                                padding: pdfConfig.hasMargin ? '18px' : '6px'
                              }}
                            >
                              {/* Layout Mode Content Placement */}
                              <div className="absolute inset-0 flex flex-col justify-between p-4 overflow-hidden">
                                
                                {pdfLayoutMode === 'vertical_stack' && (
                                  <div 
                                    className="w-full flex flex-col items-center justify-center h-full"
                                    style={{ gap: pdfConfig.hasMargin ? '12px' : '6px' }}
                                  >
                                    {/* Front Card Slot */}
                                    <div className="w-full flex flex-col items-center">
                                      {pdfShowLabels && (
                                        <span className="text-[7px] font-black uppercase text-neutral-500 mb-0.5">
                                          {language === 'bn' ? '১ম অংশ (সামনের সাইট)' : 'SIDE 1 (FRONT)'}
                                        </span>
                                      )}
                                      {idCardFrontImage ? (
                                        <div 
                                          className={`rounded-lg border border-neutral-300 shadow-sm overflow-hidden bg-neutral-50 aspect-[1.58/1] transition-all relative group ${
                                            pdfCardSize === 'compact' ? 'w-[75%]' : pdfCardSize === 'large' ? 'w-[95%]' : 'w-[85%]'
                                          }`}
                                        >
                                          <img src={idCardFrontImage} alt="Card Front Preview" className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setIdCardCurrentSide('front');
                                              startCamera(activeMode || 'SCAN_ID_CARD');
                                            }}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                          >
                                            {language === 'bn' ? 'বদলান' : 'Change'}
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setIdCardCurrentSide('front');
                                            startCamera(activeMode || 'SCAN_ID_CARD');
                                          }}
                                          className={`rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-950/30 flex flex-col items-center justify-center p-3 cursor-pointer transition-all aspect-[1.58/1] group shadow-inner ${
                                            pdfCardSize === 'compact' ? 'w-[75%]' : pdfCardSize === 'large' ? 'w-[95%]' : 'w-[85%]'
                                          }`}
                                        >
                                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow">
                                            <Camera size={14} />
                                          </div>
                                          <span className="text-[9px] font-extrabold text-blue-700 dark:text-blue-300 uppercase">
                                            {language === 'bn' ? '+ সামনের সাইট পেজে বসান' : '+ Add Front Side'}
                                          </span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Back Card Slot */}
                                    <div className="w-full flex flex-col items-center">
                                      {pdfShowLabels && (
                                        <span className="text-[7px] font-black uppercase text-neutral-500 mb-0.5">
                                          {language === 'bn' ? '২য় অংশ (পিছনের সাইট)' : 'SIDE 2 (BACK)'}
                                        </span>
                                      )}
                                      {idCardBackImage ? (
                                        <div 
                                          className={`rounded-lg border border-neutral-300 shadow-sm overflow-hidden bg-neutral-50 aspect-[1.58/1] transition-all relative group ${
                                            pdfCardSize === 'compact' ? 'w-[75%]' : pdfCardSize === 'large' ? 'w-[95%]' : 'w-[85%]'
                                          }`}
                                        >
                                          <img src={idCardBackImage} alt="Card Back Preview" className="w-full h-full object-cover" />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setIdCardCurrentSide('back');
                                              startCamera(activeMode || 'SCAN_ID_CARD');
                                            }}
                                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                          >
                                            {language === 'bn' ? 'বদলান' : 'Change'}
                                          </button>
                                        </div>
                                      ) : (
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setIdCardCurrentSide('back');
                                            startCamera(activeMode || 'SCAN_ID_CARD');
                                          }}
                                          className={`rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-50/60 hover:bg-blue-100 dark:bg-blue-950/30 flex flex-col items-center justify-center p-3 cursor-pointer transition-all aspect-[1.58/1] group shadow-inner ${
                                            pdfCardSize === 'compact' ? 'w-[75%]' : pdfCardSize === 'large' ? 'w-[95%]' : 'w-[85%]'
                                          }`}
                                        >
                                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow">
                                            <Camera size={14} />
                                          </div>
                                          <span className="text-[9px] font-extrabold text-blue-700 dark:text-blue-300 uppercase">
                                            {language === 'bn' ? '+ পিছনের সাইট পেজে বসান' : '+ Add Back Side'}
                                          </span>
                                          <span className="text-[7px] text-neutral-500 font-medium">
                                            {language === 'bn' ? 'ক্লিক করে পেজে সরাসরি যোগ করুন' : 'Tap to scan and add to page'}
                                          </span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {pdfLayoutMode === 'horizontal' && (
                                  <div 
                                    className="w-full flex flex-row items-center justify-center h-full"
                                    style={{ gap: pdfConfig.hasMargin ? '10px' : '4px' }}
                                  >
                                    {/* Front Card */}
                                    <div className="flex-1 flex flex-col items-center">
                                      {pdfShowLabels && (
                                        <span className="text-[7px] font-black uppercase text-neutral-500 mb-0.5 text-center">
                                          {language === 'bn' ? '১ম (সামনে)' : 'SIDE 1'}
                                        </span>
                                      )}
                                      {idCardFrontImage ? (
                                        <div className="w-full rounded-md border border-neutral-300 shadow-sm overflow-hidden bg-neutral-50 aspect-[1.58/1]">
                                          <img src={idCardFrontImage} alt="Card Front Preview" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIdCardCurrentSide('front');
                                            startCamera(activeMode || 'SCAN_ID_CARD');
                                          }}
                                          className="w-full rounded-md border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100 flex flex-col items-center justify-center p-2 aspect-[1.58/1] cursor-pointer"
                                        >
                                          <Camera size={14} className="text-blue-600 mb-1" />
                                          <span className="text-[8px] font-bold text-blue-600 uppercase">+ Front</span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Back Card */}
                                    <div className="flex-1 flex flex-col items-center">
                                      {pdfShowLabels && (
                                        <span className="text-[7px] font-black uppercase text-neutral-500 mb-0.5 text-center">
                                          {language === 'bn' ? '২য় (পিছনে)' : 'SIDE 2'}
                                        </span>
                                      )}
                                      {idCardBackImage ? (
                                        <div className="w-full rounded-md border border-neutral-300 shadow-sm overflow-hidden bg-neutral-50 aspect-[1.58/1]">
                                          <img src={idCardBackImage} alt="Card Back Preview" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIdCardCurrentSide('back');
                                            startCamera(activeMode || 'SCAN_ID_CARD');
                                          }}
                                          className="w-full rounded-md border-2 border-dashed border-blue-400 bg-blue-50/50 hover:bg-blue-100 flex flex-col items-center justify-center p-2 aspect-[1.58/1] cursor-pointer"
                                        >
                                          <Camera size={14} className="text-blue-600 mb-1" />
                                          <span className="text-[8px] font-bold text-blue-600 uppercase">+ Back</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {pdfLayoutMode === 'separate_pages' && (
                                  <div className="w-full flex flex-col items-center justify-between h-full py-2">
                                    {/* Front Card (Page 1) */}
                                    <div className="w-full flex flex-col items-center">
                                      <span className="text-[7px] font-black uppercase text-blue-500 mb-0.5 bg-blue-50 px-1 py-0.5 rounded">
                                        PAGE 1: FRONT
                                      </span>
                                      {idCardFrontImage ? (
                                        <div 
                                          className={`rounded-lg border border-neutral-300 shadow-sm overflow-hidden bg-neutral-50 aspect-[1.58/1] transition-all ${
                                            pdfCardSize === 'compact' ? 'w-[75%]' : pdfCardSize === 'large' ? 'w-[95%]' : 'w-[85%]'
                                          }`}
                                        >
                                          <img src={idCardFrontImage} alt="Card Front Preview" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIdCardCurrentSide('front');
                                            startCamera(activeMode || 'SCAN_ID_CARD');
                                          }}
                                          className="w-[85%] rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 p-2 flex items-center justify-center aspect-[1.58/1] cursor-pointer"
                                        >
                                          <span className="text-[8px] font-bold text-blue-600 uppercase">+ Scan Page 1</span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Page Separator visual label */}
                                    <div className="w-full border-t border-dashed border-neutral-300 my-1 relative">
                                      <span className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 text-[6px] font-black tracking-widest text-neutral-400 uppercase bg-white px-1">
                                        PAGE BREAK
                                      </span>
                                    </div>

                                    {/* Back Card (Page 2) */}
                                    <div className="w-full flex flex-col items-center">
                                      <span className="text-[7px] font-black uppercase text-blue-500 mb-0.5 bg-blue-50 px-1 py-0.5 rounded">
                                        PAGE 2: BACK
                                      </span>
                                      {idCardBackImage ? (
                                        <div 
                                          className={`rounded-lg border border-neutral-300 shadow-sm overflow-hidden bg-neutral-50 aspect-[1.58/1] transition-all ${
                                            pdfCardSize === 'compact' ? 'w-[75%]' : pdfCardSize === 'large' ? 'w-[95%]' : 'w-[85%]'
                                          }`}
                                        >
                                          <img src={idCardBackImage} alt="Card Back Preview" className="w-full h-full object-cover" />
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIdCardCurrentSide('back');
                                            startCamera(activeMode || 'SCAN_ID_CARD');
                                          }}
                                          className="w-[85%] rounded-lg border-2 border-dashed border-blue-400 bg-blue-50 p-2 flex items-center justify-center aspect-[1.58/1] cursor-pointer"
                                        >
                                          <span className="text-[8px] font-bold text-blue-600 uppercase">+ Scan Page 2</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Page Number indicator at bottom if enabled */}
                                {pdfConfig.pageNumber && pdfConfig.pageNumber !== 'No page number' && (
                                  <div className={`text-[8px] font-bold text-neutral-400 w-full ${
                                    pdfConfig.pageNumber.includes('Center') ? 'text-center' : pdfConfig.pageNumber.includes('Right') ? 'text-right pr-1' : 'text-left pl-1'
                                  }`}>
                                    1
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              )}

          {/* 🌟 1B. PASSPORT SCAN */}
          {activeMode === 'SCAN_PASSPORT' && (
            <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-500">
                  {language === 'bn' ? 'আন্তর্জাতিক পাসপোর্ট স্ক্যানার' : 'Biometric Passport Scanner'}
                </span>
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 rounded-full">
                  ICAO Doc 9303 Compliant
                </span>
              </div>

              {scanStep === 'viewfinder' && (
                <div className="space-y-6 text-center">
                  <p className="text-xs text-text-muted max-w-md mx-auto">
                    {language === 'bn'
                      ? 'পাসপোর্টের ছবি ও নিচে থাকা ২ লাইনের MRZ কোডটি ফ্রেমে সোজাভাবে রাখুন।'
                      : 'Place the photo page with the MRZ lines aligned inside the bottom highlight box.'}
                  </p>

                  {/* Passport booklet simulated viewfinder */}
                  <div className="w-full aspect-[1/1.4] max-w-[320px] mx-auto rounded-xl border-2 border-dashed border-emerald-500 bg-black/90 relative overflow-hidden flex items-center justify-center p-4 shadow-inner">
                    <div className="absolute inset-2 border border-emerald-400/15 rounded-lg flex flex-col justify-between">
                      {/* Top bio page simulation */}
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="w-12 h-12 border border-emerald-500/20 bg-emerald-500/5 rounded flex items-center justify-center text-emerald-500/40">
                            <Globe size={20} />
                          </div>
                          <div className="space-y-1.5 text-right flex-1 ml-4">
                            <div className="w-16 h-2 bg-emerald-500/30 rounded ml-auto" />
                            <div className="w-24 h-1.5 bg-emerald-500/10 rounded ml-auto" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full h-1.5 bg-emerald-500/15 rounded" />
                          <div className="w-4/5 h-1.5 bg-emerald-500/15 rounded" />
                          <div className="w-3/5 h-1.5 bg-emerald-500/15 rounded" />
                        </div>
                      </div>

                      {/* Bottom MRZ Overlay Marker */}
                      <div className="border-t border-dashed border-emerald-400/30 bg-emerald-500/5 p-2 rounded-b-lg relative">
                        <div className="absolute top-0 inset-x-0 h-0.5 bg-emerald-500/25" />
                        <span className="text-[6px] tracking-widest font-mono text-emerald-400/60 block mb-1">MACHINE READABLE ZONE (MRZ)</span>
                        <div className="space-y-1 font-mono text-[7px] text-emerald-400/40 tracking-wider text-left">
                          <div>P&lt;BGDHASSAN&lt;&lt;MD&lt;HASSAN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                          <div>EG88329415BGD9411124M3109181&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02</div>
                        </div>
                      </div>

                      {/* Corner marks */}
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-500 rounded-tl-md" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-500 rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-500 rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-500 rounded-br-md" />

                      {/* Laser Line */}
                      <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-1/4 left-0 animate-[scanLaser_3s_infinite]" />
                    </div>
                  </div>

                  <div className="flex gap-3 max-w-sm mx-auto">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 cursor-pointer"
                    >
                      {language === 'bn' ? 'ফাইল আপলোড' : 'Upload'}
                    </button>
                    <button
                      onClick={() => {
                        setScanStep('processing');
                        setTimeout(() => {
                          setScanStep('result');
                          showFeedback(language === 'bn' ? 'পাসপোর্ট ডেটা সফলভাবে পার্স হয়েছে!' : 'Passport parsed and verified successfully!', 'success');
                        }, 1600);
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      {language === 'bn' ? 'স্ক্যান করুন' : 'Scan Passport'}
                    </button>
                  </div>
                </div>
              )}

              {scanStep === 'processing' && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center">
                    <Globe size={24} className="text-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-text-main">{language === 'bn' ? 'পাসপোর্ট MRZ ডিকোড করা হচ্ছে...' : 'Decoding MRZ & Parsing Bio Data...'}</h3>
                    <p className="text-[10px] text-text-muted max-w-xs">
                      {language === 'bn' ? 'আন্তর্জাতিক ডাটাবেজ ফরম্যাট অনুযায়ী ভেরিফিকেশন করা হচ্ছে।' : 'Running checksum checks on passport details...'}
                    </p>
                  </div>
                </div>
              )}

              {scanStep === 'result' && (
                <div className="space-y-6">
                  {/* Results Verification Badge */}
                  <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-emerald-500" />
                      <span className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400">
                        {language === 'bn' ? 'ICAO MRZ পার্স সম্পন্ন' : 'ICAO MRZ Parsing Complete'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-500 rounded-full">
                      {language === 'bn' ? 'মেয়াদ আছে' : 'VALID'}
                    </span>
                  </div>

                  {/* Form inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        {language === 'bn' ? 'পাসপোর্ট নম্বর (Passport No.)' : 'Passport Number'}
                      </label>
                      <input
                        type="text"
                        value={passportData.passportNo}
                        onChange={(e) => setPassportData({ ...passportData, passportNo: e.target.value })}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        {language === 'bn' ? 'বংশনাম (Surname)' : 'Surname'}
                      </label>
                      <input
                        type="text"
                        value={passportData.surname}
                        onChange={(e) => setPassportData({ ...passportData, surname: e.target.value })}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        {language === 'bn' ? 'নাম (Given Name)' : 'Given Name'}
                      </label>
                      <input
                        type="text"
                        value={passportData.givenName}
                        onChange={(e) => setPassportData({ ...passportData, givenName: e.target.value })}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        {language === 'bn' ? 'জাতীয়তা (Nationality)' : 'Nationality'}
                      </label>
                      <input
                        type="text"
                        value={passportData.nationality}
                        onChange={(e) => setPassportData({ ...passportData, nationality: e.target.value })}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        {language === 'bn' ? 'জন্ম তারিখ (Date of Birth)' : 'Date of Birth'}
                      </label>
                      <input
                        type="text"
                        value={passportData.dob}
                        onChange={(e) => setPassportData({ ...passportData, dob: e.target.value })}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                        {language === 'bn' ? 'মেয়াদ শেষের তারিখ (Expiry Date)' : 'Date of Expiry'}
                      </label>
                      <input
                        type="text"
                        value={passportData.expiryDate}
                        onChange={(e) => setPassportData({ ...passportData, expiryDate: e.target.value })}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-text-main outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 text-left sm:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-wider text-text-muted font-mono">
                        MRZ Code Block
                      </label>
                      <textarea
                        value={passportData.mrz}
                        onChange={(e) => setPassportData({ ...passportData, mrz: e.target.value })}
                        rows={2}
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-text-main outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      onClick={() => setScanStep('viewfinder')}
                      className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 cursor-pointer"
                    >
                      {language === 'bn' ? 'আবার স্ক্যান' : 'Retake Scan'}
                    </button>
                    <button
                      onClick={() => {
                        const newHistoryItem: ScannedItem = {
                          id: `passport-${Date.now()}`,
                          name: `Passport_${passportData.passportNo}.jpg`,
                          date: new Date().toLocaleDateString(),
                          image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="190" style="background:%23047857"><rect width="300" height="190" fill="%23047857" rx="10"/><text x="20" y="30" fill="white" font-family="sans-serif" font-size="14" font-weight="bold">PASSPORT OFFICE</text><text x="20" y="70" fill="%23a7f3d0" font-family="sans-serif" font-size="8">PASSPORT NUMBER</text><text x="20" y="85" fill="white" font-family="sans-serif" font-size="12" font-weight="bold">' + passportData.passportNo + '</text><text x="20" y="115" fill="%23a7f3d0" font-family="sans-serif" font-size="8">SURNAME</text><text x="20" y="130" fill="white" font-family="sans-serif" font-size="10" font-weight="bold">' + passportData.surname + ' ' + passportData.givenName + '</text><text x="20" y="155" fill="%23a7f3d0" font-family="sans-serif" font-size="8">EXPIRY DATE</text><text x="20" y="168" fill="white" font-family="sans-serif" font-size="9" font-weight="bold">' + passportData.expiryDate + '</text><circle cx="240" cy="110" r="30" fill="%23065f46"/></svg>',
                          text: `Passport Details:\nPassport No: ${passportData.passportNo}\nSurname: ${passportData.surname}\nGiven Name: ${passportData.givenName}\nNationality: ${passportData.nationality}\nDOB: ${passportData.dob}\nExpiry: ${passportData.expiryDate}\nMRZ: ${passportData.mrz}`,
                          size: '48 KB'
                        };
                        saveHistory([newHistoryItem, ...scannedHistory]);
                        setActiveMode(null);
                        showFeedback(language === 'bn' ? 'পাসপোর্ট ডেটা সংরক্ষণ করা হয়েছে!' : 'Passport saved in history successfully!', 'success');
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      {language === 'bn' ? 'ইতিহাসে সংরক্ষণ' : 'Save to History'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 📷 1. DOCUMENT SCAN MODAL/MODE */}
          {activeMode === 'DOCUMENT_SCAN' && (
            <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-6">
              <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500">
                <Camera size={40} />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-black">{language === 'bn' ? 'ক্যামেরা স্ক্যানার' : 'Smart Camera Capture'}</h2>
                <p className="text-xs text-text-muted max-w-sm">
                  {language === 'bn' 
                    ? 'আপনার ফোনের ক্যামেরা সচল করে যেকোনো ডকুমেন্ট বা ইনভয়েস অটোমেটিক ডিটেক্ট করে ক্রপ করতে পারবেন।' 
                    : 'Turn on your device camera to automatically detect edges and crop document receipts.'}
                </p>
              </div>

              {/* Simulated Camera Feed Viewfinder */}
              <div className="w-full aspect-[3/4] max-w-xs rounded-xl border-4 border-dashed border-cyan-500/40 relative overflow-hidden bg-black/90 flex items-center justify-center">
                <div className="absolute inset-4 border border-cyan-400/20 rounded-lg flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                  
                  {/* Glowing Laser Scan Bar animation */}
                  <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-1/2 left-0 animate-bounce" />
                  
                  <span className="text-[10px] uppercase font-black text-cyan-400/80 tracking-widest bg-black/60 px-3 py-1.5 rounded-full border border-cyan-400/20">
                    {language === 'bn' ? 'ক্যামেরা রেডি' : 'Camera Ready'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 active:scale-95 cursor-pointer"
                >
                  {language === 'bn' ? 'গ্যালারি থেকে নিন' : 'Choose from Gallery'}
                </button>
                <button
                  onClick={() => {
                    handleLoadDemoDoc(selectedDocName === DEMO_DOCUMENTS[0].name ? 1 : 0);
                    setActiveMode(null);
                  }}
                  className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {language === 'bn' ? 'অটো ক্যাপচার' : 'Auto Capture'}
                </button>
              </div>
            </div>
          )}

          {/* 🔤 2. OCR TEXT EXTRACT MODE */}
          {activeMode === 'OCR_EXTRACT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Document Display Panel */}
              <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                  {language === 'bn' ? 'উৎস ডকুমেন্ট' : 'Source Document'}
                </span>
                
                {selectedDocImage ? (
                  <div className="w-full flex justify-center bg-gray-900/5 dark:bg-white/5 rounded-xl p-4 min-h-[300px] items-center border border-black/5 dark:border-white/5">
                    <img 
                      src={selectedDocImage} 
                      alt="Ocr source" 
                      className="max-h-[350px] object-contain rounded-lg shadow"
                      style={{ filter: getFilterCSS() }}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="h-[300px] border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl flex items-center justify-center">
                    <p className="text-xs text-text-muted">{language === 'bn' ? 'কোনো ডকুমেন্ট সিলেক্ট করা নেই' : 'No document selected'}</p>
                  </div>
                )}

                <button
                  onClick={handleExtractText}
                  disabled={isProcessing}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Sparkles size={14} className={isProcessing ? 'animate-spin' : ''} />
                  <span>{isProcessing ? (language === 'bn' ? 'টেক্সট নিষ্কাশন হচ্ছে...' : 'Extracting Text...') : (language === 'bn' ? 'টেক্সট নিষ্কাশন শুরু করুন' : 'Start Text Extraction')}</span>
                </button>
              </div>

              {/* Extracted Text Display Panel */}
              <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[400px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">
                      {language === 'bn' ? 'নিষ্কাশিত টেক্সট' : 'Extracted Text Output'}
                    </span>
                    {ocrResult && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ocrResult);
                          showFeedback(language === 'bn' ? 'কপি সফল হয়েছে!' : 'Copied to clipboard!', 'success');
                        }}
                        className="p-1.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main rounded-lg border border-black/5 dark:border-white/5 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                  </div>

                  {ocrResult ? (
                    <textarea
                      value={ocrResult}
                      onChange={(e) => setOcrResult(e.target.value)}
                      className="w-full h-80 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl p-4 text-xs font-mono text-text-main leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <div className="h-80 border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-center p-6 text-text-muted">
                      <Type size={32} className="mb-2 opacity-50" />
                      <p className="text-xs font-bold">{language === 'bn' ? 'টেক্সট আউটপুট খালি' : 'Text Output Empty'}</p>
                      <p className="text-[10px] mt-1 max-w-[200px] leading-relaxed">
                        {language === 'bn' ? 'বাম পাশের ইনভয়েস থেকে ওসিআর করতে সাবমিট বাটন চাপুন।' : 'Click the extract text button on the left panel to scan data.'}
                      </p>
                    </div>
                  )}
                </div>

                {ocrResult && (
                  <button
                    onClick={() => {
                      setView('DASHBOARD');
                      showFeedback(language === 'bn' ? 'ওসিআর টেক্সট সংরক্ষণ করা হয়েছে' : 'OCR text saved', 'success');
                    }}
                    className="w-full mt-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow cursor-pointer"
                  >
                    {language === 'bn' ? 'সংরক্ষণ ও বন্ধ করুন' : 'Save & Close'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 📑 3. SCAN TO PDF */}
          {activeMode === 'SCAN_PDF' && (
            <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl mx-auto flex flex-col items-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                <FileText size={32} />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-base font-black">{language === 'bn' ? 'পিডিএফ কনভার্টার' : 'Document to PDF Converter'}</h2>
                <p className="text-xs text-text-muted">{language === 'bn' ? 'আপনার ফাইলটি হাই-কোয়ালিটি ভেক্টর পিডিএফ ফাইলে রূপান্তর করুন।' : 'Convert your scanned document to clear scalable PDF.'}</p>
              </div>

              {/* CamScanner PDF Settings quick access button */}
              <button
                onClick={() => setShowPdfSettingsModal(true)}
                className="w-full py-2.5 px-3.5 bg-neutral-900 text-white rounded-xl flex items-center justify-between border border-white/10 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileText size={15} className="text-[#00af80]" />
                  <span className="text-xs font-bold">PDF Settings</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                  <span className="bg-white/10 px-2 py-0.5 rounded font-mono">{pdfConfig.pageSize}</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded capitalize">{pdfConfig.direction}</span>
                  <span className="bg-white/10 px-2 py-0.5 rounded">{pdfConfig.hasMargin ? 'Margin' : 'No Margin'}</span>
                  {pdfConfig.isLocked && <span className="text-amber-400">🔒</span>}
                  <ChevronRight size={14} className="text-neutral-400" />
                </div>
              </button>

              {/* Dynamic Mock PDF Viewer frame */}
              <div className="w-full p-4 bg-gray-100 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2 text-xs text-text-muted">
                  <span>PDF Document Preview</span>
                  <span>1 Page</span>
                </div>
                <div className="aspect-[3/4] max-w-xs mx-auto bg-white rounded shadow-md overflow-hidden p-6 relative">
                  <div className="w-full h-full border border-gray-200 p-3 space-y-3 text-[5px] text-gray-400 font-mono flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span className="font-bold text-[7px] text-gray-800">FLEETPRO LOGISTICS</span>
                        <span className="text-[6px] text-gray-500">{selectedDocName}</span>
                      </div>
                      <div className="w-full flex justify-center py-2">
                        <img 
                          src={selectedDocImage || ''} 
                          className="max-h-[140px] object-contain" 
                          alt="PDF Embed mock" 
                          style={{ filter: getFilterCSS() }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <div className="text-center border-t border-gray-100 pt-2 text-[4px]">
                      Generated via FleetPro smart mobile scanner.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setActiveMode(null)}
                  className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 active:scale-95 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                >
                  <Download size={14} />
                  <span>{language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 🖼️ 4. SCAN TO IMAGE */}
          {activeMode === 'SCAN_IMAGE' && (
            <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl mx-auto flex flex-col items-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ImageIcon size={32} />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-base font-black">{language === 'bn' ? 'গ্যালারিতে ইমেজ সেভ' : 'Save Document to Gallery'}</h2>
                <p className="text-xs text-text-muted">{language === 'bn' ? 'প্রসেস করা ছবিটি সরাসরি গ্যালারিতে স্পষ্ট ও উজ্জ্বল ফাইলে সেভ করুন।' : 'Download the enhanced image output directly as JPEG.'}</p>
              </div>

              {selectedDocImage && (
                <div className="max-w-xs rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow bg-black/10">
                  <img 
                    src={selectedDocImage} 
                    alt="Save Preview" 
                    className="max-h-[250px] object-contain w-full" 
                    style={{ filter: getFilterCSS() }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setActiveMode(null)}
                  className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 active:scale-95 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleSaveImage}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                >
                  <Download size={14} />
                  <span>{language === 'bn' ? 'ছবি সেভ করুন' : 'Save Image'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ✂️ 5. CROP & ADJUST */}
          {activeMode === 'CROP_ADJUST' && (
            <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">
                {language === 'bn' ? 'ক্রপ ও ওরিয়েন্টেশন সমন্বয়' : 'Crop & Rotate Tuning'}
              </span>

              {selectedDocImage && (
                <div className="w-full flex justify-center bg-gray-900/5 dark:bg-white/5 rounded-xl p-4 min-h-[250px] items-center border border-black/5 dark:border-white/5 overflow-hidden">
                  <div 
                    className="transition-transform duration-300 relative"
                    style={{ transform: `rotate(${rotation}deg)` }}
                  >
                    {/* Simulated Crop Grid Lines overlay */}
                    <div className="absolute inset-0 border-2 border-amber-500 grid grid-cols-3 grid-rows-3 pointer-events-none z-10">
                      <div className="border border-white/40" />
                      <div className="border border-white/40" />
                      <div className="border border-white/40" />
                      <div className="border border-white/40" />
                      <div className="border border-white/40" />
                      <div className="border border-white/40" />
                      <div className="border border-white/40" />
                      <div className="border border-white/40" />
                      <div className="border border-white/40" />
                    </div>
                    
                    <img 
                      src={selectedDocImage} 
                      alt="Crop adjust preview" 
                      className="max-h-[250px] object-contain shadow"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              {/* Adjusters tools */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => setRotation(prev => (prev - 90) % 360)}
                  className="py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-[10px] font-black uppercase rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCw size={14} className="rotate-180" />
                  <span>{language === 'bn' ? 'বাম দিকে ঘোরান' : 'Rotate Left'}</span>
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-[10px] font-black uppercase rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCw size={14} />
                  <span>{language === 'bn' ? 'ডান দিকে ঘোরান' : 'Rotate Right'}</span>
                </button>
                <button
                  onClick={() => {
                    setRotation(0);
                    showFeedback(language === 'bn' ? 'রিসেট করা হয়েছে' : 'Rotation reset', 'success');
                  }}
                  className="py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-[10px] font-black uppercase rounded-xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sliders size={14} />
                  <span>{language === 'bn' ? 'রিসেট' : 'Reset'}</span>
                </button>
              </div>

              {/* Manual adjustment sliders */}
              <div className="space-y-4 pt-2 border-t border-black/5 dark:border-white/5">
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-xs font-bold text-text-main">
                    <span>{language === 'bn' ? 'ব্রাইটনেস' : 'Brightness'}</span>
                    <span>{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-[var(--primary)] h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none" 
                  />
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-xs font-bold text-text-main">
                    <span>{language === 'bn' ? 'কন্ট্রাস্ট' : 'Contrast'}</span>
                    <span>{contrast > 0 ? `+${contrast}` : contrast}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full accent-[var(--primary)] h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none" 
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveMode(null)}
                  className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 cursor-pointer"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    setActiveMode(null);
                    showFeedback(language === 'bn' ? 'পরিবর্তন সফলভাবে প্রয়োগ হয়েছে!' : 'Adjustments applied successfully!', 'success');
                  }}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {language === 'bn' ? 'প্রয়োগ করুন' : 'Apply Crop'}
                </button>
              </div>
            </div>
          )}

          {/* ✨ 6. ENHANCE / AUTO IMPROVE */}
          {activeMode === 'ENHANCE' && (
            <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">
                  {language === 'bn' ? 'ডকুমেন্ট ব্যাকগ্রাউন্ড ক্লিনার ও ফিল্টার' : 'Document Background Cleaner & Filters'}
                </span>
                <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-purple-500/10 text-purple-500 rounded-full">
                  Smart Paper Clear
                </span>
              </div>

              {selectedDocImage && (
                <div className="w-full flex justify-center bg-gray-900/5 dark:bg-white/5 rounded-xl p-4 min-h-[250px] items-center border border-black/5 dark:border-white/5 relative overflow-hidden">
                  <img 
                    src={selectedDocImage} 
                    alt="Enhance preview" 
                    className="max-h-[250px] object-contain shadow rounded-lg transition-transform duration-200"
                    style={{ 
                      filter: getFilterCSS(),
                      transform: `rotate(${rotation}deg)`
                    }}
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Adjusters tools for Rotation */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRotation(prev => (prev - 90) % 360)}
                  className="py-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-[10px] font-black uppercase rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCw size={12} className="scale-x-[-1]" />
                  <span>{language === 'bn' ? 'বামে ঘোরান' : 'Rotate Left'}</span>
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="py-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-[10px] font-black uppercase rounded-xl border border-black/5 dark:border-white/5 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCw size={12} />
                  <span>{language === 'bn' ? 'ডানে ঘোরান' : 'Rotate Right'}</span>
                </button>
              </div>

              {/* Filters selector grid */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-muted block text-left">
                  {language === 'bn' ? 'ব্যাকগ্রাউন্ড ক্লিয়ারিং মোড' : 'Background Clearing Mode'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'whiten', labelEn: 'Clear Background (Default)', labelBn: 'সাদা ব্যাকগ্রাউন্ড (ডিফল্ট)' },
                    { id: 'bw', labelEn: 'B&W Sharp Document', labelBn: 'সাদাকালো শার্প' },
                    { id: 'high_contrast', labelEn: 'High Contrast', labelBn: 'হাই কন্ট্রাস্ট' },
                    { id: 'original', labelEn: 'Original Scan', labelBn: 'মূল ছবি' }
                  ].map((filt) => (
                    <button
                      key={filt.id}
                      onClick={() => {
                        setSelectedFilter(filt.id);
                        showFeedback(language === 'bn' ? `${filt.labelBn} ফিল্টার সেট হয়েছে` : `${filt.labelEn} filter selected`, 'success');
                      }}
                      className={`py-2 px-3 border text-[10px] font-black uppercase rounded-lg transition-all text-left flex items-center justify-between cursor-pointer ${
                        selectedFilter === filt.id 
                          ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold'
                          : 'border-black/5 dark:border-white/10 bg-black/[0.01] dark:bg-white/[0.01] text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <span>{language === 'bn' ? filt.labelBn : filt.labelEn}</span>
                      {selectedFilter === filt.id && <Check size={12} className="shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual brightness and contrast adjustments */}
              <div className="space-y-4 pt-3 border-t border-black/5 dark:border-white/5">
                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-text-muted">
                    <span>{language === 'bn' ? 'ব্রাইটনেস / আলো' : 'Fine-Tune Brightness'}</span>
                    <span>{brightness > 0 ? `+${brightness}` : brightness}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none animate-none" 
                  />
                </div>

                <div className="space-y-1 text-left">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-text-muted">
                    <span>{language === 'bn' ? 'কন্ট্রাস্ট / স্পষ্টতা' : 'Fine-Tune Contrast'}</span>
                    <span>{contrast > 0 ? `+${contrast}` : contrast}</span>
                  </div>
                  <input 
                    type="range" 
                    min="-50" 
                    max="50" 
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full accent-purple-500 h-1 bg-black/10 dark:bg-white/10 rounded-full appearance-none animate-none" 
                  />
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <div className="flex gap-2 flex-1">
                  <button
                    onClick={() => {
                      setSelectedFilter('original');
                      setRotation(0);
                      setBrightness(0);
                      setContrast(0);
                      setActiveMode(null);
                    }}
                    className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl transition-all border border-black/5 dark:border-white/5 cursor-pointer"
                  >
                    {language === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => {
                      cameraCaptureInputRef.current?.click();
                    }}
                    className="flex-1 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase rounded-xl transition-all border border-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Camera size={14} />
                    <span>{language === 'bn' ? 'আবার স্ক্যান' : 'Retake'}</span>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    handleSaveImage();
                    setActiveMode(null);
                  }}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 font-bold"
                >
                  <Check size={14} />
                  <span>{language === 'bn' ? 'গ্যালারিতে সেভ করুন' : 'Save to Gallery'}</span>
                </button>
              </div>
            </div>
          )}

          {/* 📂 7. SCAN HISTORY */}
          {activeMode === 'HISTORY' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  {language === 'bn' ? 'সংরক্ষিত ডকুমেন্টের তালিকা' : 'Scanned Documents List'}
                </span>
                {scannedHistory.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm(language === 'bn' ? 'সব ইতিহাস ডিলিট করবেন?' : 'Clear all history?')) {
                        saveHistory([]);
                        showFeedback(language === 'bn' ? 'সব মুছে ফেলা হয়েছে!' : 'All cleared!', 'success');
                      }
                    }}
                    className="text-[10px] text-rose-500 font-bold uppercase cursor-pointer"
                  >
                    {language === 'bn' ? 'সব মুছুন' : 'Clear All'}
                  </button>
                )}
              </div>

              {scannedHistory.length > 0 ? (
                <div className="space-y-3">
                  {scannedHistory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-theme-card border border-black/5 dark:border-white/10 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-12 bg-black/5 dark:bg-white/5 rounded-lg border border-black/5 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          <img 
                            src={item.image} 
                            alt="Scanned item thumb" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-left min-w-0">
                          <h4 className="text-xs font-bold text-text-main truncate max-w-[180px] sm:max-w-[240px]">
                            {item.name}
                          </h4>
                          <p className="text-[9px] text-text-muted mt-0.5">
                            {item.date} <span className="mx-1">|</span> {item.size}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Download / View Button */}
                        <a
                          href={item.image}
                          download={item.name}
                          className="p-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main rounded-lg transition-all"
                          title="Download"
                        >
                          <Download size={14} />
                        </a>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteHistoryItem(item.id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center text-gray-500 mx-auto">
                    <History size={24} />
                  </div>
                  <p className="text-xs text-text-muted">
                    {language === 'bn' ? 'কোনো স্ক্যান ইতিহাস নেই' : 'No scanning history yet.'}
                  </p>
                </div>
              )}

              <button
                onClick={() => setActiveMode(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl border border-black/5 dark:border-white/5 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'ফিরে যান' : 'Back to Menu'}
              </button>
            </div>
          )}

          {/* 📤 8. SHARE / EXPORT */}
          {activeMode === 'SHARE' && (
            <div className="bg-theme-card border border-black/5 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-xl mx-auto flex flex-col items-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                <Share2 size={32} />
              </div>
              <div className="text-center space-y-1">
                <h2 className="text-base font-black">{language === 'bn' ? 'শেয়ার ও এক্সপোর্ট' : 'Share Scanned Document'}</h2>
                <p className="text-xs text-text-muted">{language === 'bn' ? 'আপনার স্ক্যান করা ডকুমেন্টটি অন্য কারোর সাথে শেয়ার করুন।' : 'Export and share this document file to any platform.'}</p>
              </div>

              {selectedDocImage && (
                <div className="max-w-xs rounded-xl overflow-hidden border border-black/10 dark:border-white/10 shadow bg-black/10 relative">
                  <img 
                    src={selectedDocImage} 
                    alt="Share Preview" 
                    className="max-h-[200px] object-contain w-full" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-[10px] font-bold flex justify-between items-center">
                    <span className="truncate max-w-[120px]">{selectedDocName}</span>
                    <span>JPEG</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleShareDoc}
                className="w-full py-3 bg-[var(--primary)] text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
              >
                <Share2 size={14} />
                <span>{language === 'bn' ? 'লিঙ্ক শেয়ার করুন' : 'Share File'}</span>
              </button>

              <button
                onClick={() => setActiveMode(null)}
                className="w-full py-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-text-main text-xs font-black uppercase rounded-xl border border-black/5 dark:border-white/5 transition-all cursor-pointer"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          )}

            </>
          )}

        </div>
      )}

      {/* 👑 CamScanner PDF Settings Screen (Full Modal) */}
      <PdfSettingsScreen
        isOpen={showPdfSettingsModal}
        onClose={() => setShowPdfSettingsModal(false)}
        config={pdfConfig}
        onChange={setPdfConfig}
        language={language}
      />
    </div>
  );
};

export default Scanner;
