import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/store';
import { Phone, Mail, Facebook, Instagram, Youtube, MessageCircle, User, Globe, Edit2, Check, X, Copy, ExternalLink, ShieldAlert, Sparkles, Camera, Image as ImageIcon } from 'lucide-react';
import { SupportInfo } from '@/types';
import InputField from '@/components/InputField';
import GlobalFullscreenSelect from '@/components/GlobalFullscreenSelect';
import { TRANSLATIONS } from '@/constants';


const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = "" }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    className={className}
    fill="currentColor"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.486 0 9.95-4.46 9.954-9.94.002-2.657-1.033-5.155-2.915-7.037C16.53 1.745 14.036.712 11.41.712 5.923.712 1.46 5.174 1.456 10.66c-.001 1.708.452 3.374 1.312 4.842l-.993 3.63 3.717-.975zm10.156-5.416c-.28-.141-1.66-.82-1.916-.914-.258-.094-.446-.141-.634.141-.188.281-.727.914-.891 1.102-.164.187-.328.21-.607.07-.28-.141-1.18-.435-2.249-1.39-1.291-1.152-1.34-1.242-1.425-1.336-.086-.094-.01-.11.062-.181.063-.063.14-.164.21-.247.072-.082.095-.141.143-.235.047-.094.024-.176-.012-.247-.035-.071-.634-1.528-.868-2.09-.228-.549-.46-.474-.634-.482-.164-.008-.352-.01-.54-.01-.188 0-.493.07-.75.352-.259.282-.987.962-.987 2.348 0 1.387 1.008 2.72 1.149 2.91.14.187 1.984 3.029 4.809 4.244.672.29 1.198.463 1.608.593.676.215 1.29.185 1.777.113.543-.08 1.66-.679 1.895-1.336.235-.656.235-1.22.164-1.336-.07-.117-.258-.188-.539-.329z" />
  </svg>
);


const FormSection: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="bg-theme-card rounded-[8px] p-3 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all ">
    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="flex items-center gap-3 pb-2 mb-2">
      <div className="w-8 h-8 rounded-[8px] bg-gray-100 dark:bg-white/10 flex items-center justify-center text-text-main shadow-sm group-hover:scale-110 transition-transform duration-300">
        <Icon size={16} />
      </div>
      <h3 className="font-black text-xs uppercase tracking-wider text-text-main">
        {title}
      </h3>
    </div>
    {children}
  </div>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: 'spring', 
      stiffness: 100, 
      damping: 14 
    } 
  }
};

const Support: React.FC = () => {
  const { language, supportInfo: supportInfoFromStore, setSupportInfo, showFeedback, user, setView, countries, nationalities } = useStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS['en'];

  const supportInfo = supportInfoFromStore || {
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
  };
  const isAdmin = user?.role === 'ADMIN';
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<SupportInfo>(supportInfo);
  const [mobileCountryCode, setMobileCountryCode] = useState(supportInfo.mobileCountryCode || '');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState(supportInfo.whatsappCountryCode || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const updatedInfo = { ...supportInfo, developerPhoto: base64String };
        setSupportInfo(updatedInfo);
        showFeedback(language === 'bn' ? 'ফটো আপডেট করা হয়েছে!' : 'Photo updated successfully!');
        setIsActionSheetOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyToClipboard = (text: string, fieldKey: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(fieldKey);
        showFeedback(language === 'bn' ? 'কপি করা হয়েছে!' : language === 'ar' ? 'تم النسخ!' : 'Copied successfully!');
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(() => {
        // Fallback for sandboxed iframes
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopiedField(fieldKey);
        showFeedback(language === 'bn' ? 'কপি করা হয়েছে!' : language === 'ar' ? 'تم النسخ!' : 'Copied successfully!');
        setTimeout(() => setCopiedField(null), 2000);
      });
    } catch (err) {
      showFeedback('Failed to copy');
    }
  };


  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    field: string | null;
    title: string;
    options: any[];
  }>({
    isOpen: false,
    field: null,
    title: '',
    options: []
  });

  const handleOpenModal = (field: string, title: string, options: any[]) => {
    setModalConfig({
      isOpen: true,
      field,
      title,
      options
    });
  };

  const handleSelect = (value: string) => {
    setModalConfig(prev => {
      const field = prev.field;
      if (field) {
        if (field === 'mobileCountryCode') {
          setMobileCountryCode(value);
        } else if (field === 'whatsappCountryCode') {
          setWhatsappCountryCode(value);
        } else {
          setFormData(fd => ({ ...fd, [field]: value }));
        }
      }
      return { ...prev, isOpen: false };
    });
  };

  const handleSave = () => {
    setSupportInfo({ ...formData, mobileCountryCode, whatsappCountryCode });
    setIsEditing(false);
    showFeedback('Support information updated!');
  };

  const handleCancel = () => {
    setFormData(supportInfo || {});
    setMobileCountryCode(supportInfo.mobileCountryCode || '');
    setWhatsappCountryCode(supportInfo.whatsappCountryCode || '');
    setIsEditing(false);
  };

  const toggleVisibility = (field: keyof SupportInfo) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field: keyof SupportInfo) => (value: string | React.ChangeEvent<HTMLInputElement>) => {
    const val = typeof value === 'string' ? value : value.target.value;
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const VisibilityToggle: React.FC<{ field: keyof SupportInfo; label: string; active?: boolean }> = ({ field, label, active }) => (
    <button
      onClick={() => toggleVisibility(field)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
        active 
          ? 'bg-green-500 text-white shadow-sm' 
          : 'bg-gray-100 dark:bg-white/10 text-text-muted hover:bg-gray-200 dark:hover:bg-white/20'
      }`}
    >
      {active ? <Check size={12} /> : <X size={12} />}
      {label}
    </button>
  );

  return (
    <div className="w-full mx-auto space-y-6 pb-[60px]">
      {/* Header with Edit/Submit Buttons */}
      <div className="flex items-center justify-end mb-4">
        {isAdmin && !isEditing && (
          <button 
            onClick={() => {
              setFormData(supportInfo || {});
              setMobileCountryCode(supportInfo.mobileCountryCode || '');
              setWhatsappCountryCode(supportInfo.whatsappCountryCode || '');
              setIsEditing(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-[8px] hover:bg-cyan-600 transition-colors text-sm font-bold shadow-sm"
          >
            <Edit2 size={16} />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        /* Edit Mode Form */
        <div className="space-y-6">
          <FormSection title="Contact Details" icon={User}>
            <div className="grid grid-cols-10 gap-4">
              <div className="col-span-10 space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showDeveloperName" label="Public" active={formData.showDeveloperName} />
                </div>
                <InputField 
                  label="Developer Name" 
                  name="developerName" 
                  value={formData.developerName || ''} 
                  onChange={handleChange('developerName')} 
                />
              </div>
              <div className="col-span-10 space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showMobile" label="Public" active={formData.showMobile} />
                </div>
                <div className="grid grid-cols-10 gap-4">
                  <div className="col-span-4">
                    <InputField 
                      label="Code" 
                      name="mobileCountryCode"
                      type="select" 
                      options={countries.map(c => ({ value: c.code, label: c.code, icon: c.flag, subLabel: c.name }))} 
                      value={mobileCountryCode ? `${countries.find(c => c.code === mobileCountryCode)?.flag || ''} ${mobileCountryCode}` : ''} 
                      onChange={() => {}}
                      onOpenModal={(name, label, options) => handleOpenModal(name, "Select Country Code", options)}
                    />
                  </div>
                  <div className="col-span-6">
                    <InputField 
                      label="Mobile Number" 
                      name="mobile" 
                      type="tel" 
                      inputMode="numeric" 
                      value={formData.mobile || ''} 
                      onChange={handleChange('mobile')} 
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-10 space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showWhatsapp" label="Public" active={formData.showWhatsapp} />
                </div>
                <div className="grid grid-cols-10 gap-4">
                  <div className="col-span-4">
                    <InputField 
                      label="Code" 
                      name="whatsappCountryCode"
                      type="select" 
                      options={countries.map(c => ({ value: c.code, label: c.code, icon: c.flag, subLabel: c.name }))} 
                      value={whatsappCountryCode ? `${countries.find(c => c.code === whatsappCountryCode)?.flag || ''} ${whatsappCountryCode}` : ''} 
                      onChange={() => {}}
                      onOpenModal={(name, label, options) => handleOpenModal(name, "Select Country Code", options)}
                    />
                  </div>
                  <div className="col-span-6">
                    <InputField 
                      label="WhatsApp Number" 
                      name="whatsapp" 
                      type="tel" 
                      inputMode="numeric" 
                      value={formData.whatsapp || ''} 
                      onChange={handleChange('whatsapp')} 
                    />
                  </div>
                </div>
              </div>
              <div className="col-span-10 space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showNationality" label="Public" active={formData.showNationality} />
                </div>
                <InputField 
                  label="Nationality" 
                  name="nationality"
                  type="select" 
                  options={nationalities.map(n => ({ value: n.name, label: n.name, icon: n.flag }))} 
                  value={formData.nationality ? `${nationalities.find(n => n.name === formData.nationality)?.flag || ''} ${formData.nationality}` : ''} 
                  onChange={() => {}}
                  onOpenModal={(name, label, options) => handleOpenModal(name, label, options)}
                />
              </div>
              <div className="col-span-10 space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showEmail" label="Public" active={formData.showEmail} />
                </div>
                <InputField 
                  label="Email ID" 
                  name="email" 
                  type="email" 
                  value={formData.email || ''} 
                  onChange={handleChange('email')} 
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="Social Media" icon={Globe}>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showFacebookProfile" label="Public" active={formData.showFacebookProfile} />
                </div>
                <InputField 
                  label="Facebook Profile URL" 
                  name="facebookProfile" 
                  type="url" 
                  value={formData.facebookProfile || ''} 
                  onChange={handleChange('facebookProfile')} 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showFacebookPage" label="Public" active={formData.showFacebookPage} />
                </div>
                <InputField 
                  label="Facebook Page URL" 
                  name="facebookPage" 
                  type="url" 
                  value={formData.facebookPage || ''} 
                  onChange={handleChange('facebookPage')} 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showInstagram" label="Public" active={formData.showInstagram} />
                </div>
                <InputField 
                  label="Instagram URL" 
                  name="instagram" 
                  type="url" 
                  value={formData.instagram || ''} 
                  onChange={handleChange('instagram')} 
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-end">
                  <VisibilityToggle field="showYoutube" label="Public" active={formData.showYoutube} />
                </div>
                <InputField 
                  label="YouTube Channel URL" 
                  name="youtube" 
                  type="url" 
                  value={formData.youtube || ''} 
                  onChange={handleChange('youtube')} 
                />
              </div>
            </div>
          </FormSection>

          {/* Action Buttons for Edit Mode (inside form) */}
          <div className="flex gap-4 mt-6 pb-[60px]">
            <button 
              onClick={handleCancel}
              className="flex-1 h-11 bg-red-500 text-white font-bold rounded-[8px] active:scale-95 transition-all uppercase hover:bg-red-600 shadow-sm text-xs flex items-center justify-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 h-11 bg-green-500 text-white font-bold rounded-[8px] shadow-lg shadow-green-500/20 active:scale-95 transition-all uppercase flex items-center justify-center gap-2 hover:bg-green-600 text-xs"
            >
              <Check size={16} />
              Submit
            </button>
          </div>
        </div>
      ) : (
        /* View Mode */
        <div 
          
          
          
          className="space-y-6"
        >
          {/* Live Support Hub Header Banner */}
          <div 
            
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-5 text-white shadow-lg shadow-indigo-500/10"
          >
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-cyan-300 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200">
                    {language === 'bn' ? 'সাপোর্ট ডেস্ক' : language === 'ar' ? 'مكتب المساعدة المباشر' : 'Live Support Hub'}
                  </span>
                </div>
                <h2 className="text-lg font-black tracking-tight">
                  {language === 'bn' ? 'আমরা কীভাবে সাহায্য করতে পারি?' : language === 'ar' ? 'كيف يمكننا مساعدتك اليوم؟' : 'How Can We Help You Today?'}
                </h2>
                <p className="text-xs text-indigo-100 max-w-md font-medium">
                  {language === 'bn' ? 'যেকোনো জিজ্ঞাসা বা সহায়তার জন্য আমাদের সাথে সরাসরি যোগাযোগ করুন।' : language === 'ar' ? 'اتصل بنا مباشرة لأي استفسارات أو دعم فني للمؤسسة.' : 'Get in touch with our official support channels directly for instant support.'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 self-start sm:self-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20 shadow-inner">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-white">
                  {language === 'bn' ? 'অনলাইন সহায়তা' : language === 'ar' ? 'الدعم المباشر متصل' : 'Active Support'}
                </span>
              </div>
            </div>
          </div>

          {/* Details Cards Grid - Compact and Standardized Height of 130px */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-4 rounded bg-cyan-500" />
              <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">
                {language === 'bn' ? 'যোগাযোগের বিস্তারিত' : language === 'ar' ? 'تفاصيل الاتصال' : 'Contact Details'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Developer / Owner Card */}
              {supportInfo.developerName && (supportInfo.showDeveloperName || isAdmin) && (
                <div 
                  
                  className="bg-theme-card rounded-xl p-3 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-h-[190px] flex flex-col justify-between relative overflow-hidden group col-span-1 sm:col-span-2"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Hidden File Inputs */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  <input 
                    type="file" 
                    ref={cameraInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleFileChange} 
                  />

                  {/* Absolute Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {supportInfo.showDeveloperName ? (
                      <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                        <span>{language === 'bn' ? 'ডেভেলপার' : language === 'ar' ? 'المطور' : 'Developer'}</span>
                      </div>
                    ) : (
                      isAdmin && (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                          <ShieldAlert size={10} />
                          <span>{language === 'bn' ? 'লুকানো' : language === 'ar' ? 'مخفي' : 'Hidden'}</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Main Content: Centered Photo Frame & Name */}
                  <div className="flex flex-col items-center justify-center pt-2 pb-1 text-center w-full">
                    {/* Centered Photo Frame */}
                    <div 
                      onClick={() => setIsActionSheetOpen(true)}
                      className="relative w-16 h-16 rounded-[8px] overflow-hidden border-2 border-indigo-500/20 shadow-md group/photo cursor-pointer active:scale-95 transition-all duration-200 shrink-0 bg-gray-50 dark:bg-neutral-800"
                    >
                      {supportInfo.developerPhoto ? (
                        <img 
                          src={supportInfo.developerPhoto} 
                          alt={supportInfo.developerName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-indigo-400 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/40">
                          <User size={28} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity duration-200">
                        <Camera size={14} className="text-white" />
                      </div>
                    </div>

                    {/* Developer Name underneath */}
                    <div className="mt-2 text-center">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t.DEVELOPER_NAME || 'Developer Name'}</p>
                      <p className="font-extrabold text-sm text-text-main mt-0.5 select-all">
                        {supportInfo.developerName}
                      </p>
                    </div>
                  </div>

                  {/* Footer: Nationality & Copy Button */}
                  <div className="flex items-center justify-between gap-3 pt-2 mt-1 border-t border-gray-100 dark:border-white/5 w-full">
                    <div className="flex items-center gap-1 text-[11px] text-text-muted font-extrabold uppercase tracking-wider">
                      <Globe size={12} className="text-indigo-500" />
                      <span>{supportInfo.nationality || (language === 'bn' ? 'গ্লোবাল' : language === 'ar' ? 'عالمي' : 'Global')}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyToClipboard(supportInfo.developerName || '', 'developerName');
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all duration-200 ${
                        copiedField === 'developerName'
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-500/20 dark:text-indigo-400'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                      }`}
                    >
                      {copiedField === 'developerName' ? <Check size={11} className="text-indigo-500" /> : <Copy size={11} />}
                      <span>{copiedField === 'developerName' ? (language === 'bn' ? 'কপি হয়েছে' : language === 'ar' ? 'تم' : 'Copied') : (language === 'bn' ? 'কপি' : language === 'ar' ? 'نسখ' : 'Copy')}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* WhatsApp Card */}
              {supportInfo.whatsapp && (supportInfo.showWhatsapp || isAdmin) && (
                <div 
                  
                  className="bg-theme-card rounded-xl p-2.5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-[100px] flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div>
                    {/* Aligned Title and Live Status */}
                    <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t.WHATSAPP || 'WhatsApp'}</p>
                      
                      {supportInfo.showWhatsapp ? (
                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                          </span>
                          <span>{language === 'bn' ? 'সক্রিয় চ্যাট' : language === 'ar' ? 'نشط الآن' : 'Active Chat'}</span>
                        </div>
                      ) : (
                        isAdmin && (
                          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                            <ShieldAlert size={10} />
                            <span>{language === 'bn' ? 'লুকানো' : language === 'ar' ? 'مখফি' : 'Hidden'}</span>
                          </div>
                        )
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-0.5 min-w-0">
                      <div className="w-[26px] h-[26px] rounded-[8px] bg-gradient-to-br from-[#29E06D] to-[#19B958] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <WhatsAppIcon size={14} />
                      </div>
                      <p className="font-extrabold text-sm text-text-main mt-0.5 truncate select-all">
                        {supportInfo.whatsappCountryCode ? `${supportInfo.whatsappCountryCode} ` : ''}{supportInfo.whatsapp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={() => handleCopyToClipboard(`${supportInfo.whatsappCountryCode || ''}${supportInfo.whatsapp}`, 'whatsapp')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all duration-200 ${
                        copiedField === 'whatsapp'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                      }`}
                    >
                      {copiedField === 'whatsapp' ? <Check size={11} className="text-emerald-500 animate-pulse" /> : <Copy size={11} />}
                      <span>{copiedField === 'whatsapp' ? (language === 'bn' ? 'কপি হয়েছে' : language === 'ar' ? 'تم' : 'Copied') : (language === 'bn' ? 'কপি' : language === 'ar' ? 'نسখ' : 'Copy')}</span>
                    </button>

                    <a
                      href={`https://wa.me/${(supportInfo.whatsappCountryCode || '').replace('+', '')}${supportInfo.whatsapp?.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/10 active:scale-95 transition-all duration-200"
                    >
                      <WhatsAppIcon size={11} />
                      <span>{language === 'bn' ? 'চ্যাট করুন' : language === 'ar' ? 'محادثة' : 'Chat'}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Mobile Support Card */}
              {supportInfo.mobile && (supportInfo.showMobile || isAdmin) && (
                <div 
                  
                  className="bg-theme-card rounded-xl p-2.5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-[100px] flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div>
                    {/* Aligned Title and Live Status */}
                    <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t.MOBILE_NUMBER || 'Mobile Number'}</p>
                      
                      {supportInfo.showMobile ? (
                        <div className="flex items-center gap-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500"></span>
                          </span>
                          <span>{language === 'bn' ? 'সরাসরি কল' : language === 'ar' ? 'اتصال مباشر' : 'Live Support'}</span>
                        </div>
                      ) : (
                        isAdmin && (
                          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                            <ShieldAlert size={10} />
                            <span>{language === 'bn' ? 'লুকানো' : language === 'ar' ? 'মখফি' : 'Hidden'}</span>
                          </div>
                        )
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-0.5 min-w-0">
                      <div className="w-[26px] h-[26px] rounded-[8px] bg-gradient-to-br from-[#1F8FFF] to-[#0062E0] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Phone size={13} />
                      </div>
                      <p className="font-extrabold text-sm text-text-main mt-0.5 truncate select-all">
                        {supportInfo.mobileCountryCode ? `${supportInfo.mobileCountryCode} ` : ''}{supportInfo.mobile}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={() => handleCopyToClipboard(`${supportInfo.mobileCountryCode || ''}${supportInfo.mobile}`, 'mobile')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all duration-200 ${
                        copiedField === 'mobile'
                          ? 'bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                      }`}
                    >
                      {copiedField === 'mobile' ? <Check size={11} className="text-cyan-500 animate-pulse" /> : <Copy size={11} />}
                      <span>{copiedField === 'mobile' ? (language === 'bn' ? 'কপি হয়েছে' : language === 'ar' ? 'تم' : 'Copied') : (language === 'bn' ? 'কপি' : language === 'ar' ? 'نسখ' : 'Copy')}</span>
                    </button>

                    <a
                      href={`tel:${supportInfo.mobileCountryCode || ''}${supportInfo.mobile}`}
                      className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm shadow-cyan-500/10 active:scale-95 transition-all duration-200"
                    >
                      <Phone size={11} />
                      <span>{language === 'bn' ? 'কল করুন' : language === 'ar' ? 'اتصال' : 'Call'}</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Email Support Card */}
              {supportInfo.email && (supportInfo.showEmail || isAdmin) && (
                <div 
                  
                  className="bg-theme-card rounded-xl p-2.5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 h-[100px] flex flex-col justify-between relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div>
                    {/* Aligned Title and Live Status */}
                    <div className="flex items-center justify-between mb-1 gap-2 min-w-0">
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">{t.EMAIL_ID || 'Email ID'}</p>
                      
                      {supportInfo.showEmail ? (
                        <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                          <span>{language === 'bn' ? '২৪/৭ সাপোর্ট' : language === 'ar' ? '٢٤/٧ دعم' : '24/7 Support'}</span>
                        </div>
                      ) : (
                        isAdmin && (
                          <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest shrink-0">
                            <ShieldAlert size={10} />
                            <span>{language === 'bn' ? 'লুকানো' : language === 'ar' ? 'মখফি' : 'Hidden'}</span>
                          </div>
                        )
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-0.5 min-w-0">
                      <div className="w-[26px] h-[26px] rounded-[8px] bg-gradient-to-br from-[#FF5E55] to-[#E0241B] flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Mail size={13} />
                      </div>
                      <p className="font-extrabold text-sm text-text-main mt-0.5 truncate select-all">
                        {supportInfo.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-100 dark:border-white/5">
                    <button
                      onClick={() => handleCopyToClipboard(supportInfo.email || '', 'email')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all duration-200 ${
                        copiedField === 'email'
                          ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10'
                      }`}
                    >
                      {copiedField === 'email' ? <Check size={11} className="text-rose-500 animate-pulse" /> : <Copy size={11} />}
                      <span>{copiedField === 'email' ? (language === 'bn' ? 'কপি হয়েছে' : language === 'ar' ? 'تم' : 'Copied') : (language === 'bn' ? 'কপি' : language === 'ar' ? 'نسখ' : 'Copy')}</span>
                    </button>

                    <a
                      href={`mailto:${supportInfo.email}`}
                      className="flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/10 active:scale-95 transition-all duration-200"
                    >
                      <Mail size={11} />
                      <span>{language === 'bn' ? 'ইমেইল করুন' : language === 'ar' ? 'إرسাল بريد' : 'Email'}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Links Hub - Staggered compact cards */}
          {(() => {
            const socialChannels = [
              { icon: Facebook, label: 'Facebook', url: supportInfo.facebookProfile, show: supportInfo.showFacebookProfile, colorClass: 'text-blue-500 bg-blue-500/10 dark:bg-blue-500/20 dark:text-blue-400 hover:border-blue-500/40' },
              { icon: Facebook, label: language === 'bn' ? 'এফবি পেজ' : language === 'ar' ? 'صفحة فيسبوك' : 'FB Page', url: supportInfo.facebookPage, show: supportInfo.showFacebookPage, colorClass: 'text-sky-600 bg-sky-500/10 dark:bg-sky-500/20 dark:text-sky-400 hover:border-sky-500/40' },
              { icon: Instagram, label: 'Instagram', url: supportInfo.instagram, show: supportInfo.showInstagram, colorClass: 'text-pink-500 bg-pink-500/10 dark:bg-pink-500/20 dark:text-pink-400 hover:border-pink-500/40' },
              { icon: Youtube, label: 'YouTube', url: supportInfo.youtube, show: supportInfo.showYoutube, colorClass: 'text-red-500 bg-red-500/10 dark:bg-red-500/20 dark:text-red-400 hover:border-red-500/40' },
            ];
            const hasVisibleSocials = socialChannels.some(s => s.url && (s.show || isAdmin));

            if (!hasVisibleSocials) return null;

            return (
              <div  className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-4 rounded bg-indigo-500" />
                  <h3 className="text-xs font-black text-text-muted uppercase tracking-widest">
                    {language === 'bn' ? 'সোশ্যাল মিডিয়া হাব' : language === 'ar' ? 'قنوات التواصل الاجتماعي' : 'Social Media Hub'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {socialChannels.map((social, idx) => {
                    if (!social.url || (!social.show && !isAdmin)) return null;
                    const IconComponent = social.icon;
                    
                    return (
                      <a
                        key={idx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col items-center justify-center gap-2 p-3 bg-theme-card rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all duration-300 group h-[95px] relative"
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${social.colorClass}`}>
                          <IconComponent size={18} />
                        </div>
                        <span className="text-[10px] font-black tracking-wider text-text-main text-center group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
                          {social.label}
                        </span>
                        
                        {!social.show && isAdmin && (
                          <span className="absolute top-1.5 right-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-500 p-0.5 rounded-full" title="Hidden from public">
                            <ShieldAlert size={8} />
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <GlobalFullscreenSelect
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onSelect={handleSelect}
        options={modalConfig.options}
        title={modalConfig.title}
        selectedValue={
          modalConfig.field === 'mobileCountryCode' ? mobileCountryCode :
          modalConfig.field === 'whatsappCountryCode' ? whatsappCountryCode :
          modalConfig.field ? (formData as any)[modalConfig.field] : ''
        }
      />

      {/* iPhone style Action Sheet / Bottom Sheet */}
      {createPortal(
        <>
          {isActionSheetOpen && (
            <div className="fixed inset-0 z-[9999] flex flex-col justify-end p-4 pb-[calc(76px+env(safe-area-inset-bottom,16px))]">
              {/* Backdrop */}
              <div 
                
                
                
                onClick={(e) => {
                  e.stopPropagation();
                  setIsActionSheetOpen(false);
                }}
                className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer pointer-events-auto"
              />
              
              {/* Sheet container */}
              <div 
                
                
                
                
                className="relative w-full z-10 flex flex-col gap-2 max-w-sm mx-auto pointer-events-auto"
              >
                {/* Options Group */}
                <div className="bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[14px] overflow-hidden flex flex-col border border-black/5 dark:border-white/5 shadow-xl">
                  <div className="p-3 border-b border-black/10 dark:border-white/10 text-center">
                    <p className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                      {language === 'bn' ? 'প্রোফাইল ফটো পরিবর্তন' : 'Change Profile Photo'}
                    </p>
                  </div>
                  
                  {/* Take Photo button */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCameraClick();
                    }}
                    className="w-full py-4 px-6 flex items-center justify-center gap-2 text-[#007AFF] dark:text-[#0A84FF] font-normal active:bg-black/5 dark:active:bg-white/5 transition-colors border-b border-black/10 dark:border-white/10"
                  >
                    <span className="text-[20px]">
                      {language === 'bn' ? 'ছবি তুলুন' : 'Take Photo'}
                    </span>
                  </button>
                  
                  {/* Gallery button */}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleGalleryClick();
                    }}
                    className="w-full py-4 px-6 flex items-center justify-center gap-2 text-[#007AFF] dark:text-[#0A84FF] font-normal active:bg-black/5 dark:active:bg-white/5 transition-colors"
                  >
                    <span className="text-[20px]">
                      {language === 'bn' ? 'গ্যালারি থেকে পছন্দ করুন' : 'Choose from Gallery'}
                    </span>
                  </button>
                </div>
                
                {/* Cancel Group */}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsActionSheetOpen(false);
                  }}
                  className="w-full mt-0 py-4 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl rounded-[14px] font-semibold text-[#007AFF] dark:text-[#0A84FF] active:bg-black/5 dark:active:bg-white/5 transition-colors text-[20px] text-center border border-black/5 dark:border-white/5 shadow-xl"
                >
                  {language === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </>
        , document.body
      )}
    </div>
  );
};

export default Support;
