import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

export const isNativeBiometricSupported = async (): Promise<boolean> => {
  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch (error) {
    console.warn("Biometric availability check failed:", error);
    return false;
  }
};

export const verifyNativeBiometric = async (
  reason: string = 'Please authenticate', 
  subtitle: string = '',
  language: 'en' | 'bn' = 'en',
  showFeedback?: (msg: string, type?: 'success' | 'error') => void
): Promise<boolean> => {
  try {
    await NativeBiometric.verifyIdentity({
      reason,
      title: 'Biometric Authentication',
      subtitle,
      description: 'Use your fingerprint or face to authenticate',
    });
    return true;
  } catch (error: any) {
    console.warn('Native Biometric Verification Failed:', error);
    
    if (showFeedback) {
      let errStr = '';
      let errCode: any = undefined;
      
      if (error && typeof error === 'object') {
        errStr = error.message || error.description || JSON.stringify(error);
        errCode = error.code;
      } else {
        errStr = String(error);
      }
      
      const lowerErr = errStr.toLowerCase();
      
      let isCancel = false;
      let isLockout = false;
      let isNotRecognized = false;
      
      // Check standard error codes first
      if (errCode === 13 || errCode === 10) {
        isCancel = true;
      } else if (errCode === 7 || errCode === 9) {
        isLockout = true;
      }
      
      // Fallback to text checks if code doesn't match
      if (!isCancel && !isLockout) {
        if (
          lowerErr.includes('cancel') || 
          lowerErr.includes('user_canceled') || 
          lowerErr.includes('user_cancelled') || 
          lowerErr.includes('cancelled') ||
          lowerErr.includes('canceled')
        ) {
          isCancel = true;
        } else if (
          lowerErr.includes('lockout') || 
          lowerErr.includes('too many attempts') || 
          lowerErr.includes('locked out') || 
          lowerErr.includes('too_many_attempts') ||
          lowerErr.includes('blocked')
        ) {
          isLockout = true;
        } else if (
          lowerErr.includes('not recognized') || 
          lowerErr.includes('notmatch') || 
          lowerErr.includes('not match') || 
          lowerErr.includes('failed to authenticate') || 
          lowerErr.includes('failed') || 
          lowerErr.includes('unrecognized') || 
          lowerErr.includes('invalid') || 
          lowerErr.includes('mismatch') ||
          lowerErr.includes('wrong')
        ) {
          isNotRecognized = true;
        }
      }
      
      let finalMsg = '';
      if (isCancel) {
        finalMsg = language === 'bn' 
          ? 'ফিঙ্গারপ্রিন্ট যাচাইকরণ বাতিল করা হয়েছে।' 
          : 'Fingerprint verification cancelled.';
      } else if (isLockout) {
        finalMsg = language === 'bn' 
          ? 'অনেকবার ভুল চেষ্টা করা হয়েছে। অনুগ্রহ করে আপনার পাসওয়ার্ড দিয়ে সাইন ইন করুন।' 
          : 'Too many failed attempts. Please sign in with your password.';
      } else if (isNotRecognized) {
        finalMsg = language === 'bn' 
          ? 'ফিঙ্গারপ্রিন্ট সনাক্ত করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।' 
          : 'Fingerprint not recognized. Please try again.';
      } else {
        // Fallback to native Android/iOS message if descriptive, else default to unrecognized
        if (errStr && errStr !== '{}' && !lowerErr.includes('error')) {
          finalMsg = errStr;
        } else {
          finalMsg = language === 'bn' 
            ? 'ফিঙ্গারপ্রিন্ট সনাক্ত করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।' 
            : 'Fingerprint not recognized. Please try again.';
        }
      }
      
      showFeedback(finalMsg, 'error');
    }
    
    return false;
  }
};

export const setNativeBiometricCredentials = async (username: string, passwordHash: string): Promise<boolean> => {
  try {
    await NativeBiometric.setCredentials({
      username,
      password: passwordHash,
      server: 'fleetpro_biometric'
    });
    return true;
  } catch (error) {
    console.warn('Failed to set biometric credentials:', error);
    return false;
  }
};

export const getNativeBiometricCredentials = async (): Promise<{ username?: string; password?: string } | null> => {
  try {
    const result = await NativeBiometric.getCredentials({
      server: 'fleetpro_biometric'
    });
    return result;
  } catch (error) {
    console.warn('Failed to get biometric credentials:', error);
    return null;
  }
};

export const deleteNativeBiometricCredentials = async (): Promise<boolean> => {
  try {
    await NativeBiometric.deleteCredentials({
      server: 'fleetpro_biometric'
    });
    return true;
  } catch (error) {
    console.warn('Failed to delete biometric credentials:', error);
    return false;
  }
};

export const registerNativeBiometric = async (userId: string, username: string): Promise<boolean> => {
  return setNativeBiometricCredentials(username, userId);
};

export const authenticateNativeBiometric = async (): Promise<boolean> => {
  return verifyNativeBiometric();
};

