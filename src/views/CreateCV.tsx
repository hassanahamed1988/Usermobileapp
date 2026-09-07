import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { THEMES } from '@/constants';
import InputField from '@/components/InputField';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import { downloadPdf } from '@/utils/fileUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Download, Plus, Trash2, User, Briefcase, 
  GraduationCap, Award, ShieldAlert, Phone, 
  X, Calendar, FileText, Check, ArrowLeft, Image,
  Eye, Clock, Edit2
} from 'lucide-react';

interface ExperienceItem {
  company: string;
  designation: string;
  duration: string;
  description: string;
}

interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  result: string;
}

interface CertificationItem {
  name: string;
  institution: string;
  year: string;
}

interface ReferenceItem {
  name: string;
  designation: string;
  contact: string;
}

interface CvItem {
  id: string;
  fullName: string;
  profession: string;
  lastUpdated: string;
  photo: string | null;
  formData: {
    fullName: string;
    dob: string;
    nationality: string;
    gender: string;
    maritalStatus: string;
    mobileNumber: string;
    emailAddress: string;
    currentAddress: string;
    permanentAddress: string;
    profession: string;
    careerObjective: string;
    skills: string;
    languages: string;
    nidNumber: string;
    nidExpiry: string;
    passportNumber: string;
    passportExpiry: string;
    drivingLicenseNumber: string;
    drivingLicenseExpiry: string;
    visaNumber: string;
    visaExpiry: string;
    otherDocumentDetails: string;
    emergencyContactPerson: string;
    emergencyRelationship: string;
    emergencyMobile: string;
    emergencyAddress: string;
  };
  experiences: ExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
  references: ReferenceItem[];
}

const CreateCV: React.FC = () => {
  const { theme, user, language, showFeedback, setView } = useStore();
  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0];
  const primaryColor = currentThemeObj.primary || '#10b981';

  // Localized Texts Dictionary
  const LOCAL_TEXTS = {
    en: {
      cvList: 'My CV List',
      cvSubtitle: 'Manage and download your professional resumes',
      noCvs: 'No CVs created yet. Tap the floating (+) button to create your first professional CV!',
      fullName: 'Full Name',
      profession: 'Profession',
      lastUpdated: 'Last Updated',
      view: 'View',
      edit: 'Edit',
      delete: 'Delete',
      download: 'Download PDF',
      createNew: 'Create New CV',
      editCv: 'Edit CV',
      save: 'Save CV',
      cancel: 'Cancel',
      successDelete: 'CV deleted successfully!',
      successSave: 'CV saved successfully!',
      confirmDelete: 'Are you sure you want to delete this CV?',
      saveAndDownload: 'Save & Download',
      backToList: 'Back to List'
    },
    bn: {
      cvList: 'আমার সিভি তালিকা',
      cvSubtitle: 'আপনার পেশাদার সিভি পরিচালনা এবং ডাউনলোড করুন',
      noCvs: 'এখনো কোনো সিভি তৈরি করা হয়নি। আপনার প্রথম পেশাদার সিভি তৈরি করতে নিচের (+) বোতামে চাপুন!',
      fullName: 'পূর্ণ নাম',
      profession: 'পেশা',
      lastUpdated: 'সর্বশেষ আপডেট',
      view: 'দেখুন',
      edit: 'সম্পাদনা',
      delete: 'মুছুন',
      download: 'ডাউনলোড পিডিএফ',
      createNew: 'নতুন সিভি তৈরি করুন',
      editCv: 'সিভি সম্পাদন করুন',
      save: 'সিভি সংরক্ষণ করুন',
      cancel: 'বাতিল',
      successDelete: 'সিভি সফলভাবে মুছে ফেলা হয়েছে!',
      successSave: 'সিভি সফলভাবে সংরক্ষণ করা হয়েছে!',
      confirmDelete: 'আপনি কি নিশ্চিত যে আপনি এই সিভিটি মুছে ফেলতে চান?',
      saveAndDownload: 'সংরক্ষণ ও ডাউনলোড',
      backToList: 'তালিকায় ফিরে যান'
    },
    ar: {
      cvList: 'قائمة السير الذاتية',
      cvSubtitle: 'إدارة وتنزيل سيرتك الذاتية المهنية',
      noCvs: 'لم يتم إنشاء أي سيرة ذاتية بعد. اضغط على الزر العائم (+) لإنشاء أول سيرة ذاتية مهنية لك!',
      fullName: 'الاسم الكامل',
      profession: 'المهنة',
      lastUpdated: 'آخر تحديث',
      view: 'عرض',
      edit: 'تعديل',
      delete: 'حذف',
      download: 'تحميل PDF',
      createNew: 'إنشاء سيرة ذاتية جديدة',
      editCv: 'تعديل السيرة الذاتية',
      save: 'حفظ السيرة الذاتية',
      cancel: 'إلغاء',
      successDelete: 'تم حذف السيرة الذاتية بنجاح!',
      successSave: 'تم حفظ السيرة الذاتية بنجاح!',
      confirmDelete: 'هل أنت متأكد أنك تريد حذف هذه السيرة الذاتية؟',
      saveAndDownload: 'حفظ وتحميل',
      backToList: 'العودة للقائمة'
    }
  };

  const t = (key: keyof typeof LOCAL_TEXTS['en']) => {
    const lang = (language === 'bn' || language === 'ar') ? language : 'en';
    return LOCAL_TEXTS[lang][key] || LOCAL_TEXTS['en'][key];
  };

  // State for Navigation / CV List
  const [mode, setMode] = useState<'LIST' | 'FORM' | 'VIEW'>('LIST');
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [cvs, setCvs] = useState<CvItem[]>([]);

  // Load CVs on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fleetpro_cvs');
      if (stored) {
        setCvs(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load CVs from localStorage:", e);
    }
  }, []);

  const saveCvsList = (updatedCvs: CvItem[]) => {
    try {
      localStorage.setItem('fleetpro_cvs', JSON.stringify(updatedCvs));
      setCvs(updatedCvs);
    } catch (e) {
      console.error("Failed to save CVs to localStorage:", e);
    }
  };

  const formatLastUpdated = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreateNew = () => {
    setPhoto(user?.photo || user?.profileImage || null);
    setFormData({
      fullName: user?.name || user?.fullName || '',
      dob: user?.dob || '',
      nationality: user?.nationality || '',
      gender: user?.gender || '',
      maritalStatus: '',
      mobileNumber: user?.mobileNumber || '',
      emailAddress: user?.email || user?.loginEmail || '',
      currentAddress: user?.presentAddress || user?.addressLine1 || '',
      permanentAddress: '',
      profession: user?.profession || '',
      careerObjective: '',
      skills: '',
      languages: '',
      nidNumber: user?.idNumber || '',
      nidExpiry: user?.idExpiryDate || '',
      passportNumber: '',
      passportExpiry: '',
      drivingLicenseNumber: user?.drivingLicenseNumber || '',
      drivingLicenseExpiry: '',
      visaNumber: '',
      visaExpiry: '',
      otherDocumentDetails: '',
      emergencyContactPerson: '',
      emergencyRelationship: '',
      emergencyMobile: '',
      emergencyAddress: ''
    });
    setExperiences([]);
    setEducations([]);
    setCertifications([]);
    setReferences([]);
    setSelectedCvId(null);
    setMode('FORM');
  };

  const handleEditCv = (cv: CvItem) => {
    setSelectedCvId(cv.id);
    setPhoto(cv.photo);
    setFormData(cv.formData);
    setExperiences(cv.experiences || []);
    setEducations(cv.educations || []);
    setCertifications(cv.certifications || []);
    setReferences(cv.references || []);
    setMode('FORM');
  };

  const handleViewCv = (cv: CvItem) => {
    setSelectedCvId(cv.id);
    setPhoto(cv.photo);
    setFormData(cv.formData);
    setExperiences(cv.experiences || []);
    setEducations(cv.educations || []);
    setCertifications(cv.certifications || []);
    setReferences(cv.references || []);
    setMode('VIEW');
  };

  const handleDeleteCv = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('confirmDelete'))) {
      const updated = cvs.filter(c => c.id !== id);
      saveCvsList(updated);
      showFeedback(t('successDelete'), 'success');
    }
  };

  const handleSaveCV = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.fullName.trim()) {
      showFeedback(
        language === 'bn' ? 'অনুগ্রহ করে কমপক্ষে আপনার পুরো নাম লিখুন।' : 'Please enter at least your full name.',
        'warning'
      );
      return;
    }

    const updatedCvs = [...cvs];
    const timestamp = new Date().toISOString();

    if (selectedCvId) {
      const index = updatedCvs.findIndex(c => c.id === selectedCvId);
      if (index !== -1) {
        updatedCvs[index] = {
          ...updatedCvs[index],
          fullName: formData.fullName,
          profession: formData.profession,
          lastUpdated: timestamp,
          photo,
          formData,
          experiences,
          educations,
          certifications,
          references
        };
      }
    } else {
      const newCv: CvItem = {
        id: Date.now().toString(),
        fullName: formData.fullName,
        profession: formData.profession || 'Professional',
        lastUpdated: timestamp,
        photo,
        formData,
        experiences,
        educations,
        certifications,
        references
      };
      updatedCvs.unshift(newCv);
    }

    saveCvsList(updatedCvs);
    showFeedback(t('successSave'), 'success');
    setMode('LIST');
  };

  const handleSaveAndDownload = async () => {
    if (!formData.fullName.trim()) {
      showFeedback(
        language === 'bn' ? 'অনুগ্রহ করে কমপক্ষে আপনার পুরো নাম লিখুন।' : 'Please enter at least your full name.',
        'warning'
      );
      return;
    }

    handleSaveCV();
    await handleDownloadCV();
  };

  const handleDownloadCVDirect = (cv: CvItem) => {
    setPhoto(cv.photo);
    setFormData(cv.formData);
    setExperiences(cv.experiences || []);
    setEducations(cv.educations || []);
    setCertifications(cv.certifications || []);
    setReferences(cv.references || []);
    setTimeout(() => {
      handleDownloadCV();
    }, 100);
  };

  // State for Photo
  const [photo, setPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Form Data State
  const [formData, setFormData] = useState({
    // Personal
    fullName: '',
    dob: '',
    nationality: '',
    gender: '',
    maritalStatus: '',
    mobileNumber: '',
    emailAddress: '',
    currentAddress: '',
    permanentAddress: '',
    
    // Professional
    profession: '',
    careerObjective: '',
    skills: '',
    languages: '',
    
    // Documents
    nidNumber: '',
    nidExpiry: '',
    passportNumber: '',
    passportExpiry: '',
    drivingLicenseNumber: '',
    drivingLicenseExpiry: '',
    visaNumber: '',
    visaExpiry: '',
    otherDocumentDetails: '',

    // Emergency Contact
    emergencyContactPerson: '',
    emergencyRelationship: '',
    emergencyMobile: '',
    emergencyAddress: ''
  });

  // Dynamic Repeaters State
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [certifications, setCertifications] = useState<CertificationItem[]>([]);
  const [references, setReferences] = useState<ReferenceItem[]>([]);

  // Dropdown Modal State
  const [selectModal, setSelectModal] = useState<{
    isOpen: boolean;
    name: string;
    label: string;
    options: { label: string; value: string }[];
  }>({
    isOpen: false,
    name: '',
    label: '',
    options: []
  });

  // Pre-fill with current logged-in user data
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || user.fullName || prev.fullName,
        dob: user.dob || prev.dob,
        nationality: user.nationality || prev.nationality,
        gender: user.gender || prev.gender,
        mobileNumber: user.mobileNumber || prev.mobileNumber,
        emailAddress: user.email || user.loginEmail || prev.emailAddress,
        currentAddress: user.presentAddress || user.addressLine1 || prev.currentAddress,
        nidNumber: user.idNumber || prev.nidNumber,
        nidExpiry: user.idExpiryDate || prev.nidExpiry,
        drivingLicenseNumber: user.drivingLicenseNumber || prev.drivingLicenseNumber,
        profession: user.profession || prev.profession,
      }));
      
      if (user.photo || user.profileImage) {
        setPhoto(user.photo || user.profileImage);
      }
    }
  }, [user]);

  // Form Field Change Handler
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Image Upload and Compression (to fit nicely in PDF)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 300;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
            setPhoto(compressedBase64);
            showFeedback(
              language === 'bn' ? 'প্রোফাইল ফটো যুক্ত করা হয়েছে!' : 'Profile photo added!',
              'success'
            );
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic Item List Handlers
  const addExperience = () => {
    setExperiences(prev => [...prev, { company: '', designation: '', duration: '', description: '' }]);
  };
  const removeExperience = (index: number) => {
    setExperiences(prev => prev.filter((_, i) => i !== index));
  };
  const updateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    setExperiences(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addEducation = () => {
    setEducations(prev => [...prev, { degree: '', institution: '', year: '', result: '' }]);
  };
  const removeEducation = (index: number) => {
    setEducations(prev => prev.filter((_, i) => i !== index));
  };
  const updateEducation = (index: number, field: keyof EducationItem, value: string) => {
    setEducations(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addCertification = () => {
    setCertifications(prev => [...prev, { name: '', institution: '', year: '' }]);
  };
  const removeCertification = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };
  const updateCertification = (index: number, field: keyof CertificationItem, value: string) => {
    setCertifications(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addReference = () => {
    setReferences(prev => [...prev, { name: '', designation: '', contact: '' }]);
  };
  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };
  const updateReference = (index: number, field: keyof ReferenceItem, value: string) => {
    setReferences(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  // Select Modal Open Helper
  const openSelectModal = (name: string, label: string, options: { label: string; value: string }[]) => {
    setSelectModal({
      isOpen: true,
      name,
      label,
      options
    });
  };

  // Select Item Handler
  const handleSelect = (val: string) => {
    handleChange(selectModal.name, val);
    setSelectModal(prev => ({ ...prev, isOpen: false }));
  };

  // Professional PDF Generation Logic
  const handleDownloadCV = async () => {
    if (!formData.fullName) {
      showFeedback(
        language === 'bn' ? 'অনুগ্রহ করে কমপক্ষে আপনার পুরো নাম লিখুন।' : 'Please enter at least your full name.',
        'warning'
      );
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Theme colors
      const hexToRgb = (hex: string): [number, number, number] => {
        const cleanHex = hex.replace("#", "");
        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);
        return [isNaN(r) ? 37 : r, isNaN(g) ? 99 : g, isNaN(b) ? 235 : b];
      };
      
      const [pR, pG, pB] = hexToRgb(primaryColor);
      let currentY = 15;

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

      // Draw Top Brand Main Header Banner inside the PDF
      doc.setFillColor(pR, pG, pB);
      doc.rect(15, currentY, pageWidth - 30, 32, 'F');

      // Check and embed Photo
      let hasImage = false;
      if (photo) {
        try {
          doc.addImage(photo, 'JPEG', pageWidth - 42, currentY + 3, 22, 26);
          hasImage = true;
        } catch (e) {
          console.error("Failed to add image to PDF:", e);
        }
      }

      // Main Header Text (Inside Primary Colored Rectangle)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text(formData.fullName.toUpperCase(), 20, currentY + 11);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(230, 242, 255);
      doc.text(formData.profession.toUpperCase() || 'PROFESSIONAL', 20, currentY + 17);

      // Compact Contacts Row
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(240, 249, 255);
      const contactText = [
        formData.mobileNumber ? `Phone: ${formData.mobileNumber}` : '',
        formData.emailAddress ? `Email: ${formData.emailAddress}` : '',
        formData.currentAddress ? `Loc: ${formData.currentAddress}` : ''
      ].filter(Boolean).join('  |  ');
      doc.text(contactText, 20, currentY + 24, { maxWidth: pageWidth - (hasImage ? 65 : 45) });

      currentY += 40;

      // Helper for drawing Section Headers
      const drawSectionHeader = (title: string) => {
        // Prevent overflow
        if (currentY + 15 > pageHeight) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFillColor(pR, pG, pB);
        doc.rect(15, currentY - 4.5, 2.5, 5, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(pR, pG, pB);
        doc.text(title.toUpperCase(), 20, currentY);

        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.line(15, currentY + 2, pageWidth - 15, currentY + 2);

        currentY += 7;
      };

      // 1. Career Objective Section
      if (formData.careerObjective) {
        drawSectionHeader(language === 'bn' ? 'ক্যারিয়ার অবজেক্টিভ' : 'Career Objective');
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85); // Slate 700
        const objectiveLines = doc.splitTextToSize(formData.careerObjective, pageWidth - 30);
        doc.text(objectiveLines, 15, currentY);
        currentY += (objectiveLines.length * 4.5) + 6;
      }

      // 2. Personal Information Section (Compact Grid Table)
      drawSectionHeader(language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Information');
      const personalData = [
        [
          labelCell(language === 'bn' ? 'পূর্ণ নাম:' : 'Full Name:'),
          valueCell(formData.fullName, 1, true),
          labelCell(language === 'bn' ? 'জন্ম তারিখ:' : 'Date of Birth:'),
          valueCell(formData.dob)
        ],
        [
          labelCell(language === 'bn' ? 'জাতীয়তা:' : 'Nationality:'),
          valueCell(formData.nationality),
          labelCell(language === 'bn' ? 'লিঙ্গ:' : 'Gender:'),
          valueCell(formData.gender)
        ],
        [
          labelCell(language === 'bn' ? 'বৈবাহিক অবস্থা:' : 'Marital Status:'),
          valueCell(formData.maritalStatus),
          labelCell(language === 'bn' ? 'ইমেইল ঠিকানা:' : 'Email Address:'),
          valueCell(formData.emailAddress)
        ],
        [
          labelCell(language === 'bn' ? 'মোবাইল নম্বর:' : 'Mobile Number:'),
          valueCell(formData.mobileNumber),
          labelCell(language === 'bn' ? 'স্থায়ী ঠিকানা:' : 'Permanent Address:'),
          valueCell(formData.permanentAddress)
        ]
      ];

      autoTable(doc, {
        startY: currentY,
        body: personalData,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 2,
          lineColor: [241, 245, 249],
          lineWidth: 0.1,
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 65 },
          2: { cellWidth: 30 },
          3: { cellWidth: 65 },
        },
        margin: { left: 15, right: 15 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;

      // 3. Work Experience Section
      if (experiences.length > 0) {
        drawSectionHeader(language === 'bn' ? 'কর্ম অভিজ্ঞতা' : 'Work Experience');
        
        experiences.forEach((exp) => {
          if (currentY + 22 > pageHeight) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42); // Slate 900
          doc.text(exp.designation || 'Designation', 15, currentY);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(pR, pG, pB);
          doc.text(exp.company || 'Company Name', 15, currentY + 4);

          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139); // Slate 500
          doc.text(exp.duration || 'Duration', pageWidth - 15, currentY + 4, { align: 'right' });

          currentY += 8;

          if (exp.description) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105); // Slate 600
            const descLines = doc.splitTextToSize(exp.description, pageWidth - 30);
            doc.text(descLines, 15, currentY);
            currentY += (descLines.length * 4) + 4;
          } else {
            currentY += 2;
          }
        });
        currentY += 2;
      }

      // 4. Education Section
      if (educations.length > 0) {
        drawSectionHeader(language === 'bn' ? 'শিক্ষা' : 'Education');
        
        const eduBody = educations.map(edu => [
          edu.degree || '--',
          edu.institution || '--',
          edu.year || '--',
          edu.result || '--'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [[
            language === 'bn' ? 'ডিগ্রী / পরীক্ষা' : 'Degree / Certificate',
            language === 'bn' ? 'শিক্ষা প্রতিষ্ঠান' : 'Institution',
            language === 'bn' ? 'বছর' : 'Year',
            language === 'bn' ? 'ফলফল' : 'Result/GPA'
          ]],
          body: eduBody,
          theme: "striped",
          headStyles: {
            fillColor: [pR, pG, pB],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
          },
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 2,
          },
          margin: { left: 15, right: 15 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // 5. Skills & Languages
      if (formData.skills || formData.languages) {
        drawSectionHeader(language === 'bn' ? 'দক্ষতা ও ভাষা' : 'Skills & Languages');
        
        if (currentY + 15 > pageHeight) {
          doc.addPage();
          currentY = 20;
        }

        const skillCols = [
          [
            labelCell(language === 'bn' ? 'দক্ষতা:' : 'Skills:'),
            valueCell(formData.skills)
          ],
          [
            labelCell(language === 'bn' ? 'ভাষা:' : 'Languages:'),
            valueCell(formData.languages)
          ]
        ];

        autoTable(doc, {
          startY: currentY,
          body: skillCols,
          theme: "plain",
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 2,
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 155 }
          },
          margin: { left: 15, right: 15 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // 6. Documents Section
      const hasDocs = formData.nidNumber || formData.passportNumber || formData.drivingLicenseNumber || formData.visaNumber || formData.otherDocumentDetails;
      if (hasDocs) {
        drawSectionHeader(language === 'bn' ? 'নথিপত্র তথ্য' : 'Document Information');
        
        const docRows = [
          [
            labelCell('NID Number:'),
            valueCell(formData.nidNumber),
            labelCell('NID Expiry Date:'),
            valueCell(formData.nidExpiry)
          ],
          [
            labelCell('Passport Number:'),
            valueCell(formData.passportNumber),
            labelCell('Passport Expiry:'),
            valueCell(formData.passportExpiry)
          ],
          [
            labelCell('Driving License:'),
            valueCell(formData.drivingLicenseNumber),
            labelCell('License Expiry:'),
            valueCell(formData.drivingLicenseExpiry)
          ],
          [
            labelCell('Visa Number:'),
            valueCell(formData.visaNumber),
            labelCell('Visa Expiry:'),
            valueCell(formData.visaExpiry)
          ]
        ];

        if (formData.otherDocumentDetails) {
          docRows.push([
            labelCell('Other Details:'),
            valueCell(formData.otherDocumentDetails, 3)
          ]);
        }

        autoTable(doc, {
          startY: currentY,
          body: docRows,
          theme: "plain",
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 2,
            lineColor: [241, 245, 249],
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 60 },
            2: { cellWidth: 35 },
            3: { cellWidth: 60 },
          },
          margin: { left: 15, right: 15 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // 7. Emergency Contact
      const hasEmergency = formData.emergencyContactPerson || formData.emergencyMobile;
      if (hasEmergency) {
        drawSectionHeader(language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact');
        
        const emergencyData = [
          [
            labelCell('Contact Person:'),
            valueCell(formData.emergencyContactPerson),
            labelCell('Relationship:'),
            valueCell(formData.emergencyRelationship)
          ],
          [
            labelCell('Mobile Number:'),
            valueCell(formData.emergencyMobile),
            labelCell('Address:'),
            valueCell(formData.emergencyAddress)
          ]
        ];

        autoTable(doc, {
          startY: currentY,
          body: emergencyData,
          theme: "plain",
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 2,
            lineColor: [241, 245, 249],
            lineWidth: 0.1,
          },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 60 },
            2: { cellWidth: 35 },
            3: { cellWidth: 60 },
          },
          margin: { left: 15, right: 15 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // 8. References
      if (references.length > 0) {
        drawSectionHeader(language === 'bn' ? 'রেফারেন্স' : 'References');
        
        const refBody = references.map(ref => [
          ref.name || '--',
          ref.designation || '--',
          ref.contact || '--'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [[
            language === 'bn' ? 'নাম' : 'Name',
            language === 'bn' ? 'পদবী' : 'Designation',
            language === 'bn' ? 'যোগাযোগ তথ্য' : 'Contact Information'
          ]],
          body: refBody,
          theme: "striped",
          headStyles: {
            fillColor: [pR, pG, pB],
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
          },
          styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 2,
          },
          margin: { left: 15, right: 15 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Trigger standard download helper
      const sanitizedFilename = `CV_${formData.fullName.replace(/\s+/g, '_')}.pdf`;
      await downloadPdf(doc, sanitizedFilename, showFeedback, language);

    } catch (err) {
      console.error("PDF download failed:", err);
      showFeedback(
        language === 'bn' ? 'পিডিএফ তৈরি করতে সমস্যা হয়েছে।' : 'Error generating PDF.',
        'error'
      );
    }
  };

  const renderListMode = () => {
    return (
      <div className="space-y-6 pb-24 relative min-h-[70vh]">
        {/* Header Card */}
        <div className="bg-theme-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-xl text-white flex items-center justify-center shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-text-main flex items-center gap-1.5 uppercase">
                {t('cvList')}
              </h2>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                {t('cvSubtitle')}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setView('DASHBOARD')}
            className="self-start sm:self-center h-10 px-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-xs font-bold text-text-muted flex items-center gap-1.5 uppercase"
          >
            <ArrowLeft size={14} />
            {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
          </button>
        </div>

        {/* CV Grid/List */}
        {cvs.length === 0 ? (
          <div className="bg-theme-card rounded-2xl p-8 text-center border border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-gray-50 dark:bg-white/5 text-text-muted">
              <FileText size={48} className="stroke-[1.5]" />
            </div>
            <p className="text-sm text-text-muted max-w-md font-medium leading-relaxed">
              {t('noCvs')}
            </p>
            <button
              onClick={handleCreateNew}
              className="px-5 h-11 text-white font-bold rounded-xl active:scale-95 transition-all text-xs uppercase tracking-wider flex items-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus size={16} />
              {t('createNew')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cvs.map((cv) => (
              <div 
                key={cv.id} 
                className="bg-theme-card p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-4">
                  {/* Photo or Placeholder */}
                  {cv.photo ? (
                    <img 
                      src={cv.photo} 
                      alt={cv.fullName} 
                      className="w-14 h-14 rounded-xl object-cover border border-gray-100 dark:border-white/10 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-50 dark:bg-white/5 text-text-muted flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/10">
                      <User size={24} />
                    </div>
                  )}
                  
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-base font-bold text-text-main truncate">
                      {cv.fullName}
                    </h3>
                    <p className="text-xs text-text-muted font-semibold truncate flex items-center gap-1.5">
                      <Briefcase size={12} style={{ color: primaryColor }} />
                      {cv.profession || 'Professional'}
                    </p>
                    <p className="text-[10px] text-text-muted font-medium flex items-center gap-1">
                      <Clock size={10} />
                      {t('lastUpdated')}: {formatLastUpdated(cv.lastUpdated)}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleViewCv(cv)}
                    className="flex-1 min-w-[70px] h-9 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all text-xs font-bold text-text-main flex items-center justify-center gap-1"
                  >
                    <Eye size={12} />
                    <span>{t('view')}</span>
                  </button>
                  <button
                    onClick={() => handleEditCv(cv)}
                    className="flex-1 min-w-[70px] h-9 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 active:scale-95 transition-all text-xs font-bold text-text-main flex items-center justify-center gap-1"
                  >
                    <Edit2 size={12} />
                    <span>{t('edit')}</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteCv(cv.id, e)}
                    className="h-9 w-9 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all text-red-500 flex items-center justify-center"
                    title={t('delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDownloadCVDirect(cv)}
                    className="flex-1 min-w-[100px] h-9 text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs flex items-center justify-center gap-1"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Download size={12} />
                    <span>{t('download')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Floating Action Button (FAB) */}
        <button
          onClick={handleCreateNew}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full text-white shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-40 cursor-pointer"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 8px 24px -4px ${primaryColor}60`
          }}
          title={t('createNew')}
        >
          <Plus size={28} />
        </button>
      </div>
    );
  };

  const renderViewMode = () => {
    return (
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="bg-theme-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMode('LIST')}
              className="p-2.5 rounded-xl border border-gray-100 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-text-muted flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 className="text-lg font-black tracking-tight text-text-main flex items-center gap-1.5 uppercase">
                {formData.fullName || 'CV Preview'}
              </h2>
              <p className="text-xs text-text-muted font-medium mt-0.5">
                {formData.profession || 'Professional'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => selectedCvId && handleEditCv(cvs.find(c => c.id === selectedCvId)!)}
              className="h-10 px-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-xs font-bold text-text-main flex items-center gap-1.5 uppercase"
            >
              <Edit2 size={14} />
              {t('edit')}
            </button>
            <button 
              onClick={handleDownloadCV}
              className="h-10 px-4 text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs flex items-center gap-1.5 uppercase"
              style={{ backgroundColor: primaryColor }}
            >
              <Download size={14} />
              {t('download')}
            </button>
          </div>
        </div>

        {/* Paper Resume View layout */}
        <div className="bg-white text-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 max-w-3xl mx-auto space-y-8 font-sans">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b-2" style={{ borderColor: primaryColor }}>
            <div className="space-y-2 flex-1">
              <h1 className="text-3xl font-black tracking-tight text-gray-900 uppercase">
                {formData.fullName || '--'}
              </h1>
              <h3 className="text-lg font-bold tracking-wide uppercase" style={{ color: primaryColor }}>
                {formData.profession || '--'}
              </h3>
              {formData.careerObjective && (
                <p className="text-sm text-gray-600 italic leading-relaxed pt-2">
                  "{formData.careerObjective}"
                </p>
              )}
            </div>

            {photo ? (
              <img 
                src={photo} 
                alt={formData.fullName} 
                className="w-24 h-24 rounded-xl object-cover border-2 shrink-0"
                style={{ borderColor: primaryColor }}
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>

          {/* Contact & Personal Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-2">
              <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                Contact Details
              </h4>
              <p><span className="font-semibold text-gray-700">Email:</span> {formData.emailAddress || '--'}</p>
              <p><span className="font-semibold text-gray-700">Mobile:</span> {formData.mobileNumber || '--'}</p>
              <p><span className="font-semibold text-gray-700">Current Address:</span> {formData.currentAddress || '--'}</p>
              <p><span className="font-semibold text-gray-700">Permanent Address:</span> {formData.permanentAddress || '--'}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                Personal Information
              </h4>
              <p><span className="font-semibold text-gray-700">Date of Birth:</span> {formData.dob || '--'}</p>
              <p><span className="font-semibold text-gray-700">Gender:</span> {formData.gender || '--'}</p>
              <p><span className="font-semibold text-gray-700">Nationality:</span> {formData.nationality || '--'}</p>
              <p><span className="font-semibold text-gray-700">Marital Status:</span> {formData.maritalStatus || '--'}</p>
            </div>
          </div>

          {/* Documents & Identification Grid */}
          {(formData.nidNumber || formData.passportNumber || formData.drivingLicenseNumber || formData.visaNumber) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {formData.nidNumber && (
                <div className="space-y-1">
                  <p><span className="font-semibold text-gray-700">National ID (NID):</span> {formData.nidNumber}</p>
                  {formData.nidExpiry && <p className="text-xs text-gray-500">Expiry: {formData.nidExpiry}</p>}
                </div>
              )}
              {formData.passportNumber && (
                <div className="space-y-1">
                  <p><span className="font-semibold text-gray-700">Passport Number:</span> {formData.passportNumber}</p>
                  {formData.passportExpiry && <p className="text-xs text-gray-500">Expiry: {formData.passportExpiry}</p>}
                </div>
              )}
              {formData.drivingLicenseNumber && (
                <div className="space-y-1">
                  <p><span className="font-semibold text-gray-700">Driving License:</span> {formData.drivingLicenseNumber}</p>
                  {formData.drivingLicenseExpiry && <p className="text-xs text-gray-500">Expiry: {formData.drivingLicenseExpiry}</p>}
                </div>
              )}
              {formData.visaNumber && (
                <div className="space-y-1">
                  <p><span className="font-semibold text-gray-700">Visa Details:</span> {formData.visaNumber}</p>
                  {formData.visaExpiry && <p className="text-xs text-gray-500">Expiry: {formData.visaExpiry}</p>}
                </div>
              )}
            </div>
          )}

          {/* Skills & Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {formData.skills && (
              <div className="space-y-2">
                <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                  Skills
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.skills.split(',').map((skill, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {formData.languages && (
              <div className="space-y-2">
                <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                  Languages
                </h4>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.languages.split(',').map((lang, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                      {lang.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Work Experience */}
          {experiences.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                Work Experience
              </h4>
              <div className="space-y-4">
                {experiences.map((exp, index) => (
                  <div key={index} className="space-y-1 text-sm">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{exp.designation || '--'}</span>
                      <span className="text-xs font-medium text-gray-500">{exp.duration || '--'}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-600">{exp.company || '--'}</div>
                    {exp.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {educations.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                Education
              </h4>
              <div className="space-y-4">
                {educations.map((edu, index) => (
                  <div key={index} className="space-y-1 text-sm">
                    <div className="flex justify-between font-bold text-gray-900">
                      <span>{edu.degree || '--'}</span>
                      <span className="text-xs font-medium text-gray-500">{edu.year || '--'}</span>
                    </div>
                    <div className="text-xs font-semibold text-gray-600">{edu.institution || '--'}</div>
                    {edu.result && <div className="text-xs text-gray-500">Result: {edu.result}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                Certifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="text-sm border-l-2 pl-3 py-1 space-y-0.5" style={{ borderColor: primaryColor }}>
                    <div className="font-bold text-gray-900">{cert.name || '--'}</div>
                    <div className="text-xs text-gray-600">{cert.institution || '--'}</div>
                    <div className="text-[10px] text-gray-500">Year: {cert.year || '--'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {formData.emergencyContactPerson && (
            <div className="space-y-3">
              <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                Emergency Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><span className="font-semibold text-gray-700">Contact Person:</span> {formData.emergencyContactPerson}</p>
                <p><span className="font-semibold text-gray-700">Relationship:</span> {formData.emergencyRelationship || '--'}</p>
                <p><span className="font-semibold text-gray-700">Mobile:</span> {formData.emergencyMobile || '--'}</p>
                <p><span className="font-semibold text-gray-700">Address:</span> {formData.emergencyAddress || '--'}</p>
              </div>
            </div>
          )}

          {/* References */}
          {references.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-bold border-b pb-1 uppercase tracking-wider text-xs text-gray-500">
                References
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {references.map((ref, index) => (
                  <div key={index} className="text-sm bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                    <div className="font-bold text-gray-900">{ref.name || '--'}</div>
                    <div className="text-xs text-gray-600 font-semibold">{ref.designation || '--'}</div>
                    <div className="text-xs text-gray-500">Contact: {ref.contact || '--'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  if (mode === 'LIST') {
    return renderListMode();
  }

  if (mode === 'VIEW') {
    return renderViewMode();
  }

  return (
    <div className="space-y-6 pb-24">
      
      {/* 2. Header Design */}
      <div className="bg-theme-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={handleDownloadCV}
            className="p-3 rounded-xl text-white cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md shadow-blue-500/10 flex items-center justify-center shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            <Download size={22} className="animate-bounce" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-text-main flex items-center gap-1.5 uppercase">
              {language === 'bn' ? 'সিভি তৈরি করুন' : 'Create CV'}
            </h2>
            <p className="text-xs text-text-muted font-medium mt-0.5">
              {language === 'bn' ? 'আপনার তথ্য দিন এবং ডাউনলোড করুন উন্নত পেশাদার পিডিএফ সিভি।' : 'Enter your professional details and generate your premium PDF CV.'}
            </p>
          </div>
        </div>
        
        {/* Back navigation button to CV List */}
        <button 
          onClick={() => setMode('LIST')}
          className="self-start sm:self-center h-10 px-4 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-xs font-bold text-text-muted flex items-center gap-1.5 uppercase"
        >
          <ArrowLeft size={14} />
          {t('backToList')}
        </button>
      </div>

      {/* 3. Cards Structured Form */}
      <div className="space-y-6">

        {/* --- PERSONAL INFORMATION CARD --- */}
        <div className="bg-theme-card p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
            <User size={18} style={{ color: primaryColor }} />
            <h3 className="text-xs font-black uppercase tracking-wider text-text-muted">
              {language === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Information'}
            </h3>
          </div>

          {/* Photo uploader */}
          <div className="flex flex-col sm:flex-row items-center gap-4 py-2">
            <div className="relative group shrink-0 w-24 h-24 rounded-2xl border border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-white/5">
              {photo ? (
                <>
                  <img src={photo} alt="CV Photo" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setPhoto(null)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center gap-1.5 text-center cursor-pointer p-2"
                >
                  <Image size={22} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-[9px] font-bold text-gray-400 tracking-wide uppercase select-none">
                    {language === 'bn' ? 'ফটো আপলোড' : 'Add Photo'}
                  </span>
                </div>
              )}
            </div>
            <div className="text-center sm:text-left space-y-1">
              <h4 className="text-xs font-bold text-text-main uppercase">
                {language === 'bn' ? 'পেশাদার সিভি ছবি' : 'Professional CV Photo'}
              </h4>
              <p className="text-[10px] text-text-muted font-medium max-w-xs">
                {language === 'bn' ? 'একটি পরিষ্কার ছবি আপলোড করুন যা সিভির উপরে সংযুক্ত হবে।' : 'Upload a formal portrait with a solid background for your premium PDF CV.'}
              </p>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label={language === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
              name="fullName"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              required
            />
            <InputField 
              label={language === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth'}
              name="dob"
              type="date"
              value={formData.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'জাতীয়তা' : 'Nationality'}
              name="nationality"
              value={formData.nationality}
              onChange={(e) => handleChange('nationality', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'লিঙ্গ' : 'Gender'}
              name="gender"
              type="select"
              value={formData.gender}
              options={[
                { label: language === 'bn' ? 'পুরুষ' : 'MALE', value: 'MALE' },
                { label: language === 'bn' ? 'নারী' : 'FEMALE', value: 'FEMALE' },
                { label: language === 'bn' ? 'অন্যান্য' : 'OTHER', value: 'OTHER' }
              ]}
              onOpenModal={(name, label, options) => openSelectModal(name, label, options)}
            />
            <InputField 
              label={language === 'bn' ? 'বৈবাহিক অবস্থা' : 'Marital Status'}
              name="maritalStatus"
              type="select"
              value={formData.maritalStatus}
              options={[
                { label: language === 'bn' ? 'বিবাহিত' : 'MARRIED', value: 'MARRIED' },
                { label: language === 'bn' ? 'অবিবাহিত' : 'SINGLE', value: 'SINGLE' }
              ]}
              onOpenModal={(name, label, options) => openSelectModal(name, label, options)}
            />
            <InputField 
              label={language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
              name="mobileNumber"
              type="tel"
              value={formData.mobileNumber}
              onChange={(e) => handleChange('mobileNumber', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
              name="emailAddress"
              type="email"
              value={formData.emailAddress}
              onChange={(e) => handleChange('emailAddress', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'বর্তমান ঠিকানা' : 'Current Address'}
              name="currentAddress"
              value={formData.currentAddress}
              onChange={(e) => handleChange('currentAddress', e.target.value)}
            />
            <div className="md:col-span-2">
              <InputField 
                label={language === 'bn' ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
                name="permanentAddress"
                value={formData.permanentAddress}
                onChange={(e) => handleChange('permanentAddress', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- PROFESSIONAL INFORMATION CARD --- */}
        <div className="bg-theme-card p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
            <Briefcase size={18} style={{ color: primaryColor }} />
            <h3 className="text-xs font-black uppercase tracking-wider text-text-muted">
              {language === 'bn' ? 'পেশাদার তথ্য' : 'Professional Information'}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <InputField 
              label={language === 'bn' ? 'পেশা / পদবী' : 'Profession / Designation'}
              name="profession"
              value={formData.profession}
              onChange={(e) => handleChange('profession', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'ক্যারিয়ার অবজেক্টিভ' : 'Career Objective'}
              name="careerObjective"
              type="textarea"
              value={formData.careerObjective}
              onChange={(e) => handleChange('careerObjective', e.target.value)}
              className="h-24"
            />
            <InputField 
              label={language === 'bn' ? 'দক্ষতা (কমা দিয়ে লিখুন)' : 'Skills (Comma separated, e.g. Driving, Logistics, Excel)'}
              name="skills"
              value={formData.skills}
              onChange={(e) => handleChange('skills', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'ভাষা (কমা দিয়ে লিখুন)' : 'Languages (Comma separated, e.g. English, Bengali, Arabic)'}
              name="languages"
              value={formData.languages}
              onChange={(e) => handleChange('languages', e.target.value)}
            />
          </div>

          {/* Dynamic Work Experience Repeater */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-t border-dashed border-gray-100 dark:border-white/5 pt-4">
              <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                {language === 'bn' ? 'কর্ম অভিজ্ঞতা' : 'Work Experience'}
              </h4>
              <button 
                onClick={addExperience}
                className="h-8 px-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-[10px] font-extrabold uppercase flex items-center gap-1"
                style={{ color: primaryColor }}
              >
                <Plus size={12} />
                {language === 'bn' ? 'অভিজ্ঞতা যোগ করুন' : 'Add Experience'}
              </button>
            </div>

            {experiences.length === 0 ? (
              <p className="text-[10px] text-text-muted italic text-center py-2">
                {language === 'bn' ? 'কোন অভিজ্ঞতার তথ্য যোগ করা হয়নি।' : 'No work experience added yet.'}
              </p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5/20 space-y-3 relative">
                    <button 
                      onClick={() => removeExperience(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="text-[10px] font-black uppercase text-gray-400">
                      #{idx + 1} {language === 'bn' ? 'কর্মক্ষেত্র' : 'Job Entry'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <InputField 
                        label={language === 'bn' ? 'কোম্পানির নাম' : 'Company Name'}
                        name={`company-${idx}`}
                        value={exp.company}
                        onChange={(e) => updateExperience(idx, 'company', e.target.value)}
                      />
                      <InputField 
                        label={language === 'bn' ? 'পদবী' : 'Designation'}
                        name={`designation-${idx}`}
                        value={exp.designation}
                        onChange={(e) => updateExperience(idx, 'designation', e.target.value)}
                      />
                      <InputField 
                        label={language === 'bn' ? 'সময়কাল' : 'Duration (e.g. 2021 - Present)'}
                        name={`duration-${idx}`}
                        value={exp.duration}
                        onChange={(e) => updateExperience(idx, 'duration', e.target.value)}
                      />
                      <div className="md:col-span-3">
                        <InputField 
                          label={language === 'bn' ? 'বিবরণ / দায়িত্ব' : 'Job Description / Responsibilities'}
                          name={`desc-${idx}`}
                          type="textarea"
                          value={exp.description}
                          onChange={(e) => updateExperience(idx, 'description', e.target.value)}
                          className="h-20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- EDUCATION & CERTIFICATION CARD --- */}
        <div className="bg-theme-card p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
            <GraduationCap size={18} style={{ color: primaryColor }} />
            <h3 className="text-xs font-black uppercase tracking-wider text-text-muted">
              {language === 'bn' ? 'শিক্ষা ও প্রশিক্ষণ' : 'Education & Certifications'}
            </h3>
          </div>

          {/* Dynamic Education Repeater */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                {language === 'bn' ? 'শিক্ষা ইতিহাস' : 'Educational History'}
              </h4>
              <button 
                onClick={addEducation}
                className="h-8 px-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-[10px] font-extrabold uppercase flex items-center gap-1"
                style={{ color: primaryColor }}
              >
                <Plus size={12} />
                {language === 'bn' ? 'শিক্ষা যোগ করুন' : 'Add Education'}
              </button>
            </div>

            {educations.length === 0 ? (
              <p className="text-[10px] text-text-muted italic text-center py-2">
                {language === 'bn' ? 'কোন শিক্ষা তথ্য যোগ করা হয়নি।' : 'No education history added yet.'}
              </p>
            ) : (
              <div className="space-y-4">
                {educations.map((edu, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5/20 space-y-3 relative">
                    <button 
                      onClick={() => removeEducation(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="text-[10px] font-black uppercase text-gray-400">
                      #{idx + 1} {language === 'bn' ? 'শিক্ষা স্তর' : 'Education Entry'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <InputField 
                          label={language === 'bn' ? 'পরীক্ষা / ডিগ্রী' : 'Degree / Examination'}
                          name={`degree-${idx}`}
                          value={edu.degree}
                          onChange={(e) => updateEducation(idx, 'degree', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <InputField 
                          label={language === 'bn' ? 'প্রতিষ্ঠান' : 'School / College / University'}
                          name={`inst-${idx}`}
                          value={edu.institution}
                          onChange={(e) => updateEducation(idx, 'institution', e.target.value)}
                        />
                      </div>
                      <InputField 
                        label={language === 'bn' ? 'পাশের বছর' : 'Passing Year'}
                        name={`year-${idx}`}
                        value={edu.year}
                        onChange={(e) => updateEducation(idx, 'year', e.target.value)}
                      />
                      <div className="md:col-span-3">
                        <InputField 
                          label={language === 'bn' ? 'ফলফল / জিপিএ' : 'Result / CGPA / Grade'}
                          name={`result-${idx}`}
                          value={edu.result}
                          onChange={(e) => updateEducation(idx, 'result', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dynamic Certifications Repeater */}
          <div className="space-y-4 border-t border-dashed border-gray-100 dark:border-white/5 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                {language === 'bn' ? 'সার্টিফিকেশন এবং প্রশিক্ষণ' : 'Certifications & Training'}
              </h4>
              <button 
                onClick={addCertification}
                className="h-8 px-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-[10px] font-extrabold uppercase flex items-center gap-1"
                style={{ color: primaryColor }}
              >
                <Plus size={12} />
                {language === 'bn' ? 'সার্টিফিকেট যোগ করুন' : 'Add Certificate'}
              </button>
            </div>

            {certifications.length === 0 ? (
              <p className="text-[10px] text-text-muted italic text-center py-2">
                {language === 'bn' ? 'কোন সার্টিফিকেট তথ্য যোগ করা হয়নি।' : 'No certifications added yet.'}
              </p>
            ) : (
              <div className="space-y-4">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5/20 space-y-3 relative">
                    <button 
                      onClick={() => removeCertification(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="text-[10px] font-black uppercase text-gray-400">
                      #{idx + 1} {language === 'bn' ? 'সার্টিফিকেট' : 'Certification Entry'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <InputField 
                        label={language === 'bn' ? 'সার্টিফিকেট নাম' : 'Certification Name'}
                        name={`cert-${idx}`}
                        value={cert.name}
                        onChange={(e) => updateCertification(idx, 'name', e.target.value)}
                      />
                      <InputField 
                        label={language === 'bn' ? 'প্রতিষ্ঠান' : 'Issuing Institution'}
                        name={`cert-inst-${idx}`}
                        value={cert.institution}
                        onChange={(e) => updateCertification(idx, 'institution', e.target.value)}
                      />
                      <InputField 
                        label={language === 'bn' ? 'বছর' : 'Year Obtained'}
                        name={`cert-year-${idx}`}
                        value={cert.year}
                        onChange={(e) => updateCertification(idx, 'year', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- DOCUMENT INFORMATION CARD --- */}
        <div className="bg-theme-card p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
            <Award size={18} style={{ color: primaryColor }} />
            <h3 className="text-xs font-black uppercase tracking-wider text-text-muted">
              {language === 'bn' ? 'নথিপত্র বিবরণ' : 'Document Information'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label={language === 'bn' ? 'এনআইডি নম্বর' : 'National ID Number'}
              name="nidNumber"
              type="tel"
              value={formData.nidNumber}
              onChange={(e) => handleChange('nidNumber', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'এনআইডি মেয়াদের তারিখ' : 'National ID Expiry Date'}
              name="nidExpiry"
              type="date"
              value={formData.nidExpiry}
              onChange={(e) => handleChange('nidExpiry', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'পাসপোর্ট নম্বর' : 'Passport Number'}
              name="passportNumber"
              value={formData.passportNumber}
              onChange={(e) => handleChange('passportNumber', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'পাসপোর্ট মেয়াদের তারিখ' : 'Passport Expiry Date'}
              name="passportExpiry"
              type="date"
              value={formData.passportExpiry}
              onChange={(e) => handleChange('passportExpiry', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'ড্রাইভিং লাইসেন্স নম্বর' : 'Driving License Number'}
              name="drivingLicenseNumber"
              value={formData.drivingLicenseNumber}
              onChange={(e) => handleChange('drivingLicenseNumber', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'লাইসেন্স মেয়াদের তারিখ' : 'Driving License Expiry Date'}
              name="drivingLicenseExpiry"
              type="date"
              value={formData.drivingLicenseExpiry}
              onChange={(e) => handleChange('drivingLicenseExpiry', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'ভিসা নম্বর' : 'Visa Number'}
              name="visaNumber"
              value={formData.visaNumber}
              onChange={(e) => handleChange('visaNumber', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'ভিসা মেয়াদের তারিখ' : 'Visa Expiry Date'}
              name="visaExpiry"
              type="date"
              value={formData.visaExpiry}
              onChange={(e) => handleChange('visaExpiry', e.target.value)}
            />
            <div className="md:col-span-2">
              <InputField 
                label={language === 'bn' ? 'অন্যান্য নথি বিবরণ' : 'Other Document Details (if available)'}
                name="otherDocumentDetails"
                value={formData.otherDocumentDetails}
                onChange={(e) => handleChange('otherDocumentDetails', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- EMERGENCY CONTACT CARD --- */}
        <div className="bg-theme-card p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
            <ShieldAlert size={18} style={{ color: primaryColor }} />
            <h3 className="text-xs font-black uppercase tracking-wider text-text-muted">
              {language === 'bn' ? 'জরুরি যোগাযোগ' : 'Emergency Contact'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField 
              label={language === 'bn' ? 'যোগাযোগের ব্যক্তি' : 'Contact Person'}
              name="emergencyContactPerson"
              value={formData.emergencyContactPerson}
              onChange={(e) => handleChange('emergencyContactPerson', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'সম্পর্ক' : 'Relationship (e.g. Spouse, Brother)'}
              name="emergencyRelationship"
              value={formData.emergencyRelationship}
              onChange={(e) => handleChange('emergencyRelationship', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
              name="emergencyMobile"
              type="tel"
              value={formData.emergencyMobile}
              onChange={(e) => handleChange('emergencyMobile', e.target.value)}
            />
            <InputField 
              label={language === 'bn' ? 'ঠিকানা' : 'Address'}
              name="emergencyAddress"
              value={formData.emergencyAddress}
              onChange={(e) => handleChange('emergencyAddress', e.target.value)}
            />
          </div>
        </div>

        {/* --- REFERENCES CARD --- */}
        <div className="bg-theme-card p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
            <Phone size={18} style={{ color: primaryColor }} />
            <h3 className="text-xs font-black uppercase tracking-wider text-text-muted">
              {language === 'bn' ? 'রেফারেন্স' : 'References'}
            </h3>
          </div>

          {/* Dynamic References Repeater */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-text-main uppercase tracking-wider">
                {language === 'bn' ? 'রেফারেন্স সমূহ' : 'References'}
              </h4>
              <button 
                onClick={addReference}
                className="h-8 px-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-all text-[10px] font-extrabold uppercase flex items-center gap-1"
                style={{ color: primaryColor }}
              >
                <Plus size={12} />
                {language === 'bn' ? 'রেফারেন্স যোগ করুন' : 'Add Reference'}
              </button>
            </div>

            {references.length === 0 ? (
              <p className="text-[10px] text-text-muted italic text-center py-2">
                {language === 'bn' ? 'কোন রেফারেন্স যোগ করা হয়নি।' : 'No references added yet.'}
              </p>
            ) : (
              <div className="space-y-4">
                {references.map((ref, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5/20 space-y-3 relative">
                    <button 
                      onClick={() => removeReference(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className="text-[10px] font-black uppercase text-gray-400">
                      #{idx + 1} {language === 'bn' ? 'রেফারেন্স' : 'Reference Entry'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <InputField 
                        label={language === 'bn' ? 'নাম' : 'Name'}
                        name={`ref-name-${idx}`}
                        value={ref.name}
                        onChange={(e) => updateReference(idx, 'name', e.target.value)}
                      />
                      <InputField 
                        label={language === 'bn' ? 'পদবী' : 'Designation'}
                        name={`ref-desig-${idx}`}
                        value={ref.designation}
                        onChange={(e) => updateReference(idx, 'designation', e.target.value)}
                      />
                      <InputField 
                        label={language === 'bn' ? 'যোগাযোগ (মোবাইল/ইমেইল)' : 'Contact (Phone / Email)'}
                        name={`ref-contact-${idx}`}
                        value={ref.contact}
                        onChange={(e) => updateReference(idx, 'contact', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 6. Main Download Action Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={() => setMode('LIST')}
          className="flex-1 h-14 bg-gray-100 dark:bg-white/5 text-text-muted hover:bg-gray-200 dark:hover:bg-white/10 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
        >
          {t('cancel')}
        </button>
        <button 
          onClick={() => handleSaveCV()}
          className="flex-1 h-14 border border-gray-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 font-bold rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-xs text-text-main"
        >
          <Check size={16} />
          {t('save')}
        </button>
        <button 
          onClick={handleSaveAndDownload}
          className="flex-[2] h-14 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2.5 uppercase tracking-widest text-xs hover:opacity-95"
          style={{ 
            backgroundColor: primaryColor,
            boxShadow: `0 10px 20px -5px ${primaryColor}40`
          }}
        >
          <Download size={18} className="animate-bounce" />
          {t('saveAndDownload')}
        </button>
      </div>

      {/* Global selector modal */}
      <GlobalFullscreenSelect 
        isOpen={selectModal.isOpen}
        onClose={() => setSelectModal(prev => ({ ...prev, isOpen: false }))}
        onSelect={handleSelect}
        options={selectModal.options}
        title={selectModal.label}
        selectedValue={formData[selectModal.name as keyof typeof formData] as string}
      />

    </div>
  );
};

export default CreateCV;
