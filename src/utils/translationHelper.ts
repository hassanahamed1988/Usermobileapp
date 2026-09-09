import { TRANSLATIONS } from '../translations';
import { Language } from '../types';

// Reverse lookup map to find translation keys by English or Bengali values
const reverseLookup: Record<string, string> = {};

// Populates the reverse lookup map
const initializeReverseLookup = () => {
  if (Object.keys(reverseLookup).length > 0) return;

  const languages = ['en', 'bn'] as const;
  for (const lang of languages) {
    const dict = TRANSLATIONS[lang] as Record<string, string>;
    if (!dict) continue;

    for (const [key, value] of Object.entries(dict)) {
      if (typeof value === 'string' && value.trim()) {
        const lowerVal = value.trim().toLowerCase();
        reverseLookup[lowerVal] = key;
      }
    }
  }
};

// High-quality manual dictionary for common hardcoded phrases in view files
const EXTRA_DICTIONARY: Record<string, Record<Language, string>> = {
  'saving...': {
    en: 'Saving...',
    bn: 'সংরক্ষণ হচ্ছে...',
    ar: 'جاري الحفظ...',
    hi: 'सहेज रहा है...'
  },
  'save contact': {
    en: 'Save Contact',
    bn: 'কন্টাক্ট সেভ করুন',
    ar: 'حفظ جهة الاتصال',
    hi: 'संपर्क सहेजें'
  },
  'new contact': {
    en: 'New Contact',
    bn: 'নতুন কন্টাক্ট',
    ar: 'جهة اتصال جديدة',
    hi: 'नया संपर्क'
  },
  'import from phone contacts': {
    en: 'Import from Phone Contacts',
    bn: 'ফোন থেকে ইম্পোর্ট করুন',
    ar: 'استيراد من جهات اتصال الهاتف',
    hi: 'फ़ोन संपर्कों से आयात करें'
  },
  'personal details': {
    en: 'Personal Details',
    bn: 'ব্যক্তিগত বিবরণ',
    ar: 'تفاصيل شخصية',
    hi: 'व्यक्तिगत विवरण'
  },
  'full name': {
    en: 'Full Name',
    bn: 'পূর্ণ নাম',
    ar: 'الاسم الكامل',
    hi: 'पूरा नाम'
  },
  'relationship': {
    en: 'Relationship',
    bn: 'সম্পর্ক',
    ar: 'العلاقة',
    hi: 'संबंध'
  },
  'mobile number': {
    en: 'Mobile Number',
    bn: 'মোবাইল নম্বর',
    ar: 'رقم الهاتف المحمول',
    hi: 'मोबाइल नंबर'
  },
  'alternative mobile number': {
    en: 'Alternative Mobile Number',
    bn: 'بিকল্প মোবাইল নম্বর',
    ar: 'رقم هاتف محمول بديل',
    hi: 'वैकल्पिक मोबाइल नंबर'
  },
  'email address': {
    en: 'Email Address',
    bn: 'ইমেইল এড্রেস',
    ar: 'البريد الإلكتروني',
    hi: 'ईमेल पता'
  },
  'nationality': {
    en: 'Nationality',
    bn: 'জাতীয়তা',
    ar: 'الجنسية',
    hi: 'राष्ट्रीयता'
  },
  'document type': {
    en: 'Document Type',
    bn: 'ডকুমেন্ট টাইপ',
    ar: 'نوع المستند',
    hi: 'दस्तावेज़ का प्रकार'
  },
  'notes': {
    en: 'Notes',
    bn: 'নোটস',
    ar: 'ملاحظات',
    hi: 'टिप्पणियाँ'
  },
  'company & location details': {
    en: 'Company & Location Details',
    bn: 'কোম্পানি এবং অবস্থান বিবরণ',
    ar: 'تفاصيل الشركة والموقع',
    hi: 'कंपनी और स्थान विवरण'
  },
  'company & designation': {
    en: 'Company & Designation',
    bn: 'কোম্পানি ও পদবী',
    ar: 'الشركة والمسمى الوظيفي',
    hi: 'कंपनी और पद'
  },
  'address': {
    en: 'Address',
    bn: 'ঠিকানা',
    ar: 'العنوان',
    hi: 'पता'
  },
  'contact details': {
    en: 'Contact Details',
    bn: 'কন্টাক্ট এর বিবরণ',
    ar: 'تفاصيل الاتصال',
    hi: 'संपर्क विवरण'
  },
  'delete contact': {
    en: 'Delete Contact',
    bn: 'ডিলিট করুন',
    ar: 'حذف جهة الاتصال',
    hi: 'संपर्क हटाएं'
  },
  'edit contact': {
    en: 'Edit Contact',
    bn: 'এডিট করুন',
    ar: 'تعديل جهة الاتصال',
    hi: 'संपर्क संपादित करें'
  },
  'download pdf': {
    en: 'Download PDF',
    bn: 'পিডিএফ ডাউনলোড করুন',
    ar: 'تحميل PDF',
    hi: 'पीडीएफ डाउनलोड करें'
  },
  'select contact source': {
    en: 'Select Contact Source',
    bn: 'কন্টাক্ট সোর্স নির্বাচন করুন',
    ar: 'حدد مصدر جهة الاتصال',
    hi: 'संपर्क स्रोत चुनें'
  },
  'device / phone storage': {
    en: 'Device / Phone Storage',
    bn: 'ডিভাইস স্টোরেজ',
    ar: 'ذاكرة تخزين الجهاز',
    hi: 'डिवाइस स्टोरेज'
  },
  'sim card': {
    en: 'SIM Card',
    bn: 'সিম কার্ড',
    ar: 'بطاقة SIM',
    hi: 'सिम कार्ड'
  },
  'google account': {
    en: 'Google Account',
    bn: 'গুগল অ্যাকাউন্ট',
    ar: 'حساب جوجل',
    hi: 'गूगल खाता'
  },
  'scan': {
    en: 'Scan',
    bn: 'স্ক্যান',
    ar: 'مسح',
    hi: 'स्कैन'
  },
  'total contacts': {
    en: 'Total Contacts',
    bn: 'মোট কন্টাক্ট',
    ar: 'إجمالي جهات الاتصال',
    hi: 'कुल संपर्क'
  },
  'confirm import': {
    en: 'Confirm Import',
    bn: 'কনফার্ম ইম্পোর্ট',
    ar: 'تأكيد الاستيراد',
    hi: 'आयात की पुष्टि करें'
  },
  'cancel': {
    en: 'Cancel',
    bn: 'বাতিল',
    ar: 'إلغاء',
    hi: 'रद्द करें'
  },
  'duplicate contacts found!': {
    en: 'Duplicate Contacts Found!',
    bn: 'ডুপ্লিকেট কন্টাক্ট পাওয়া গেছে!',
    ar: 'تم العثور على جهات اتصال مكررة!',
    hi: 'डुप्लिकेट संपर्क पाए गए!'
  },
  'update existing': {
    en: 'Update Existing',
    bn: 'আপডেট করুন',
    ar: 'تحديث الحالي',
    hi: 'मौजूदा अपडेट करें'
  },
  'skip duplicates': {
    en: 'Skip Duplicates',
    bn: 'এড়িয়ে যান (শুধু নতুন ইম্পোর্ট করুন)',
    ar: 'تخطي المكرر',
    hi: 'डुप्लिकेट छोड़ें'
  },
  'cancel import': {
    en: 'Cancel Import',
    bn: 'বাতিল করুন',
    ar: 'إلغاء الاستيراد',
    hi: 'आयात रद्द करें'
  },
  'existing contact': {
    en: 'Existing Contact',
    bn: 'বিদ্যমান কন্টাক্ট',
    ar: 'جهة الاتصال الحالية',
    hi: 'मौजूदा संपर्क'
  },
  'got it (ok)': {
    en: 'Got It (OK)',
    bn: 'ঠিক আছে (বুঝেছি)',
    ar: 'موافق',
    hi: 'समझ गया'
  },
  'select nationality': {
    en: 'Select Nationality',
    bn: 'জাতীয়তা নির্বাচন করুন',
    ar: 'حدد الجنسية',
    hi: 'राष्ट्रीयता चुनें'
  },
  'select document type': {
    en: 'Select Document Type',
    bn: 'ডকুমেন্ট টাইপ নির্বাচন করুন',
    ar: 'حدد نوع المستند',
    hi: 'दस्तावेज़ का प्रकार चुनें'
  },
  'are you sure you want to log out?': {
    en: 'Are you sure you want to log out?',
    bn: 'আপনি কি লগআউট করতে চান?',
    ar: 'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
    hi: 'क्या आप वाकई लॉग आउट करना चाहते हैं?'
  },
  'yes': {
    en: 'Yes',
    bn: 'হ্যাঁ',
    ar: 'نعم',
    hi: 'हाँ'
  },
  'no': {
    en: 'No',
    bn: 'না',
    ar: 'لا',
    hi: 'नहीं'
  },
  'please enter your password': {
    en: 'Please enter your password',
    bn: 'পাসওয়ার্ড দিন',
    ar: 'الرجاء إدخال كلمة المرور الخاص بك',
    hi: 'कृपया अपना पासवर्ड दर्ज करें'
  },
  'user not found': {
    en: 'User not found',
    bn: 'ব্যবহারকারী পাওয়া যায়নি',
    ar: 'المستخدم غير موجود',
    hi: 'उपयोगकर्ता नहीं मिला'
  },
  'incorrect password!': {
    en: 'Incorrect password!',
    bn: 'ভুল পাসওয়ার্ড!',
    ar: 'كلمة المرور غير صحيحة!',
    hi: 'गलत पासवर्ड!'
  },
  'biometrics not supported on this device': {
    en: 'Biometrics not supported on this device',
    bn: 'আপনার ডিভাইসে ফিঙ্গারপ্রিন্ট সাপোর্ট করে না',
    ar: 'المقاييس الحيوية غير مدعومة على هذا الجهاز',
    hi: 'इस डिवाइस पर बायोमेट्रिक्स समर्थित नहीं है'
  },
  'setup fingerprint': {
    en: 'Setup Fingerprint',
    bn: 'ফিঙ্গারপ্রিন্ট সেটআপ করুন',
    ar: 'إعداد بصمة الإصبع',
    hi: 'फ़िंगरप्रिंट सेटअप करें'
  },
  'confirm fingerprint to enable': {
    en: 'Confirm fingerprint to enable',
    bn: 'ফিঙ্গারপ্রিন্ট নিশ্চিত করুন',
    ar: 'تأكيد بصمة الإصبع للتمكين',
    hi: 'सक्रिय करने के लिए फ़िंगरप्रिंट की पुष्टि करें'
  },
  'login fingerprint activated successfully!': {
    en: 'Login Fingerprint activated successfully!',
    bn: 'লগইন ফিঙ্গারপ্রিন্ট সফলভাবে সক্রিয় করা হয়েছে!',
    ar: 'تم تفعيل بصمة تسجيل الدخول بنجاح!',
    hi: 'लॉगिन फ़िंगरप्रिंट सफलतापूर्वक सक्रिय हो गया!'
  },
  'face lock activated successfully!': {
    en: 'Face Lock activated successfully!',
    bn: 'ফেস লক সফলভাবে সক্রিয় করা হয়েছে!',
    ar: 'تم تفعيل قفل الوجه بنجاح!',
    hi: 'फेस लॉक सफलतापूर्वक सक्रिय हो गया!'
  },
  'transaction fingerprint activated successfully!': {
    en: 'Transaction Fingerprint activated successfully!',
    bn: 'ট্রানজেকশন ফিঙ্গারপ্রিন্ট সফলভাবে সক্রিয় করা হয়েছে!',
    ar: 'تم تفعيل بصمة المعاملة بنجاح!',
    hi: 'लेनदेन फ़िंगरप्रिंट सफलतापूर्वक सक्रिय हो गया!'
  },
  'failed to save biometric credentials': {
    en: 'Failed to save biometric credentials',
    bn: 'ফিঙ্গারপ্রিন্ট সংরক্ষণ করতে সমস্যা হয়েছে',
    ar: 'فشل حفظ بيانات البصمة',
    hi: 'बायोमेट्रिक क्रेडेंशियल सहेजने में विफल'
  },
  'the app is already installed or not supported for direct installation in this browser.': {
    en: 'The app is already installed or not supported for direct installation in this browser.',
    bn: 'অ্যাপটি ইতিমধ্যেই ইনস্টল করা আছে বা এই ব্রাউজারে ইনস্টল যোগ্য নয়।',
    ar: 'التطبيق مثبت بالفعل أو غير مدعوم للتثبيت المباشر في هذا المتصفح.',
    hi: 'ऐप पहले से इंस्टॉल है या इस ब्राउज़र में सीधे इंस्टॉलेशन के लिए समर्थित नहीं है।'
  },
  'installation started!': {
    en: 'Installation started!',
    bn: 'ইনস্টলেশন শুরু হয়েছে!',
    ar: 'بدأ التثبيت!',
    hi: 'स्थापना शुरू हो गई!'
  }
};

/**
 * Translates a single text string based on active language and dictionaries.
 */
export const translateText = (text: string, currentLang: Language): string => {
  const trimmed = text.trim();
  if (!trimmed) return text;

  // 1. Check Extra Manual Dictionary
  const lowerText = trimmed.toLowerCase();
  if (EXTRA_DICTIONARY[lowerText]) {
    return EXTRA_DICTIONARY[lowerText][currentLang] || text;
  }

  // 2. Try Exact Key in Global Translations
  initializeReverseLookup();
  const key = reverseLookup[lowerText];
  if (key) {
    const translation = TRANSLATIONS[currentLang]?.[key as keyof typeof TRANSLATIONS['en']];
    if (translation) {
      // Retain original trailing/leading spacing if present
      const startSpace = text.startsWith(' ') ? ' ' : '';
      const endSpace = text.endsWith(' ') ? ' ' : '';
      return startSpace + translation + endSpace;
    }
  }

  // 3. Fallback: if Bengali is selected but string is English and we didn't find direct translation,
  // we do not mutate to keep standard terms unless necessary.
  return text;
};

/**
 * Recursively translates text nodes of a DOM element
 */
export const translateDOMNode = (node: Node, currentLang: Language) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const originalText = node.nodeValue || '';
    const translatedText = translateText(originalText, currentLang);
    if (translatedText !== originalText) {
      node.nodeValue = translatedText;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element;
    // Don't translate contents of script/style elements, or typing input areas
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'script' || tagName === 'style' || tagName === 'textarea') {
      return;
    }

    // Translate placeholder attributes if input or textarea
    if (tagName === 'input' || tagName === 'textarea') {
      const placeholder = element.getAttribute('placeholder');
      if (placeholder) {
        const translated = translateText(placeholder, currentLang);
        if (translated !== placeholder) {
          element.setAttribute('placeholder', translated);
        }
      }
    }

    // Translate child nodes
    node.childNodes.forEach(child => translateDOMNode(child, currentLang));
  }
};

let observerInstance: MutationObserver | null = null;
let isObserverRunning = false;

/**
 * Activates the global real-time translation observer
 */
export const startTranslationObserver = (getSelectedLanguage: () => Language) => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  if (observerInstance) {
    observerInstance.disconnect();
  }

  const runTranslation = () => {
    if (isObserverRunning) return;
    isObserverRunning = true;
    if (observerInstance) observerInstance.disconnect();

    try {
      const currentLang = getSelectedLanguage();
      translateDOMNode(document.body, currentLang);
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      if (observerInstance) {
        observerInstance.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['placeholder']
        });
      }
      isObserverRunning = false;
    }
  };

  observerInstance = new MutationObserver((mutations) => {
    runTranslation();
  });

  observerInstance.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['placeholder']
  });

  // Run initial translation
  runTranslation();
};
