import CryptoJS from 'crypto-js';

const SECRET_KEY = 'fleetpro_secure_key_2026';

export const encryptData = (data: string | undefined | null): string => {
  if (!data) return '';
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (encryptedData: string | undefined | null): string => {
  if (!encryptedData) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedData;
  } catch (e) {
    return encryptedData;
  }
};

export const maskValue = (value: string | undefined | null, fieldType: 'userId' | 'email' | 'dob' | 'nid_etc'): string => {
  if (!value) return '';
  return value.toString().trim();
};

export const maskSensitiveData = (data: string | undefined | null): string => {
  return maskValue(data, 'nid_etc');
};

const SENSITIVE_FIELD_MAPPING: { [key: string]: 'userId' | 'email' | 'dob' | 'nid_etc' } = {
  userId: 'userId',
  email: 'email',
  loginEmail: 'email',
  emailAddress: 'email',
  userEmail: 'email',
  dob: 'dob',
  birthDate: 'dob',
  dateOfBirth: 'dob',
  mobileNumber: 'nid_etc',
  mobile: 'nid_etc',
  phoneNumber: 'nid_etc',
  phone: 'nid_etc',
  idNumber: 'nid_etc',
  idNo: 'nid_etc',
  nationalId: 'nid_etc',
  nid: 'nid_etc',
  nidNumber: 'nid_etc',
  passportNumber: 'nid_etc',
  passport: 'nid_etc',
  bankAccountNumber: 'nid_etc',
  accountNumber: 'nid_etc',
  cardNumber: 'nid_etc',
  cardNo: 'nid_etc',
  twoFASecret: 'nid_etc'
};

export const applyMaskingBeforeSave = (data: any): any => {
  if (!data) return data;
  if (data instanceof Date) return data;
  const processed = Array.isArray(data) ? [...data] : { ...data };
  
  for (const [field, type] of Object.entries(SENSITIVE_FIELD_MAPPING)) {
    if (processed[field] !== undefined && processed[field] !== null) {
      const value = processed[field].toString().trim();
      // Only mask if it is a string/number and not already masked
      if (value && !value.includes('***') && value !== '**********') {
        processed[`_secure_${field}`] = encryptData(value);
        if (!['accountNumber', 'bankAccountNumber'].includes(field)) {
          if (field === 'twoFASecret' || field === 'password') {
            processed[field] = '**********';
          } else {
            processed[field] = maskValue(value, type);
          }
        }
      }
    }
  }
  
  // Recursively process nested structures
  for (const key of Object.keys(processed)) {
    if (processed[key] !== null && typeof processed[key] === 'object' && !(processed[key] instanceof Date)) {
      processed[key] = applyMaskingBeforeSave(processed[key]);
    }
  }
  
  return processed;
};

export const decryptSensitiveFields = (userObj: any): any => {
  if (!userObj) return userObj;
  const processed = Array.isArray(userObj) ? [...userObj] : { ...userObj };

  for (const field of Object.keys(SENSITIVE_FIELD_MAPPING)) {
    const secureField = `_secure_${field}`;
    if (processed[secureField]) {
      const decrypted = decryptData(processed[secureField]);
      if (decrypted) {
        processed[field] = decrypted;
      }
      delete processed[secureField];
    }
  }

  // Recursively process nested structures
  for (const key of Object.keys(processed)) {
    if (processed[key] !== null && typeof processed[key] === 'object' && !(processed[key] instanceof Date)) {
      processed[key] = decryptSensitiveFields(processed[key]);
    }
  }

  return processed;
};
