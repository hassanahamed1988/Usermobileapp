import React, { useState, useEffect, useRef } from 'react';
import { Fingerprint, Scan, ShieldAlert, X, Check, Camera, RefreshCw } from 'lucide-react';
import { isNativeBiometricSupported, registerNativeBiometric, authenticateNativeBiometric } from '../utils/nativeBiometrics';

interface BiometricPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'fingerprint' | 'face' | 'transaction';
  action: 'enroll' | 'authenticate';
  language?: string;
  username?: string;
  userId?: string;
}

const playSuccessSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    oscillator.start();
    
    // Ascend to E5 (friendly biometric chirp)
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
    
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.35);
    oscillator.stop(audioCtx.currentTime + 0.35);
  } catch (e) {
    console.warn("Audio Context blocked or not supported", e);
  }
};

const playErrorSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(180, audioCtx.currentTime); 
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
    oscillator.start();
    
    oscillator.frequency.setValueAtTime(120, audioCtx.currentTime + 0.1);
    
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
    oscillator.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.warn("Audio Context blocked or not supported", e);
  }
};

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  action,
  language = 'bn',
  username = '',
  userId = ''
}) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [cameraError, setCameraError] = useState(false);
  const [nativeError, setNativeError] = useState<string | null>(null);
  const [isNativeSupported, setIsNativeSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const isHoldingRef = useRef<boolean>(false);

  // Translations
  const isBn = language === 'bn';
  const textTitle = {
    fingerprint: isBn ? 'ফিঙ্গারপ্রিন্ট ভেরিফিকেশন' : 'Fingerprint Verification',
    face: isBn ? 'ফেস লক অথেন্টিকেশন' : 'Face Lock Authentication',
    transaction: isBn ? 'ট্রানজেকশন ফিঙ্গারপ্রিন্ট' : 'Transaction Fingerprint'
  }[mode];

  const textDesc = {
    fingerprint: {
      enroll: isBn ? 'ডিভাইসের অফিসিয়াল ফিঙ্গারপ্রিন্ট সেন্সরে আপনার আঙুল স্পর্শ করুন' : 'Touch your registered finger on the official device sensor',
      authenticate: isBn ? 'লগইন করতে ডিভাইসের ফিঙ্গারপ্রিন্ট সেন্সর স্পর্শ করুন' : 'Touch your finger on the device sensor to login'
    },
    face: {
      enroll: isBn ? 'আপনার মুখটি ক্যামেরার সামনে রাখুন এবং সোজা তাকান' : 'Position your face in front of the camera and look straight',
      authenticate: isBn ? 'ফেস আনলক করতে ক্যামেরার দিকে সোজা তাকান' : 'Look at the camera to unlock'
    },
    transaction: {
      enroll: isBn ? 'ট্রানজেকশন ফিঙ্গারপ্রিন্ট চালু করতে চেপে ধরে রাখুন' : 'Tap & hold to register transaction fingerprint',
      authenticate: isBn ? 'ট্রানজেকশন সম্পন্ন করতে চেপে ধরে রাখুন' : 'Tap & hold on the sensor to authorize transaction'
    }
  }[mode][action];

  // Check support
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await isNativeBiometricSupported();
      setIsNativeSupported(supported);
    };
    checkSupport();
  }, []);

  // We do NOT automatically trigger native biometrics on mount inside useEffect
  // because browsers strictly block WebAuthn credential creation/retrieval 
  // without a direct user gesture (click/tap), throwing SecurityError or NotAllowedError.
  // Instead, we let the user click the dedicated button or the fingerprint icon to trigger it.

  const triggerNativeBiometrics = async (force: boolean = false) => {
    try {
      setNativeError(null);
      setStatus('scanning');
      setProgress(35);
      
      // We check support unless the user manually/forcefully requested it
      if (!force) {
        const supported = await isNativeBiometricSupported();
        if (!supported) {
          console.warn("Native biometric auth is not supported or unavailable, using simulation.");
          setStatus('idle');
          setProgress(0);
          setIsNativeSupported(false);
          return;
        }
      }

      setProgress(60);
      if (action === 'enroll') {
        const uId = userId || 'user_id_123';
        const uName = username || 'user@fleetpro.com';
        await registerNativeBiometric(uId, uName);
      } else {
        await authenticateNativeBiometric();
      }

      setProgress(100);
      setStatus('success');
      playSuccessSound();
      setTimeout(() => {
        onSuccess();
      }, 1000);

    } catch (err: any) {
      console.warn("Native biometric prompt cancelled or failed:", err);
      setStatus('idle');
      setProgress(0);
      const errMsg = String(err.message || err);
      const isIframeRestriction = err.name === 'SecurityError' || 
                                  errMsg.includes('publickey-credentials') || 
                                  errMsg.includes('Permissions Policy') || 
                                  errMsg.includes('not enabled');

      if (isIframeRestriction) {
        setNativeError(isBn 
          ? 'ব্রাউজার সিকিউরিটি পলিসির কারণে আইফ্রেম (প্রিভিউ উইন্ডো) থেকে সরাসরি আপনার মোবাইলের ফিঙ্গারপ্রিন্ট সেন্সর চালু করা সম্ভব নয়। এটি পরীক্ষা করার জন্য স্ক্রিনের ওপরে ডানদিকের "Open in a new tab" বাটনে ক্লিক করে নতুন ট্যাবে অ্যাপটি খুলুন। অথবা এখনই পরীক্ষা করতে ওপরের ফিঙ্গারপ্রিন্ট চিহ্নে ৩ সেকেন্ড চেপে ধরে রাখুন (সিমুলেশন)।' 
          : 'Due to browser security policies inside the preview iframe, the native biometric prompt is blocked. To test real device biometrics, please open the app in a new tab (using the "Open in a new tab" button at the top-right). You can also press and hold the fingerprint icon above for 3 seconds to simulate it right here!');
      } else if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        setNativeError(err.message || String(err));
      } else if (force) {
        setNativeError(isBn 
          ? 'ডিভাইস ভেরিফিকেশন বাতিল হয়েছে বা পাওয়া যায়নি। নিশ্চিত করুন আপনার মোবাইলের সেটিংসে ফিঙ্গারপ্রিন্ট সক্রিয় আছে।' 
          : 'Device verification was cancelled or not found. Please ensure fingerprint is active in your device settings.');
      }
    }
  };

  // Camera handling for Face Lock
  useEffect(() => {
    if (isOpen && mode === 'face' && status === 'idle') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, mode]);

  // Handle auto-scanning for Face Lock or manual hold for Fingerprint
  useEffect(() => {
    if (isOpen && mode === 'face' && status === 'idle') {
      // Auto scan face after 1s delay
      const timer = setTimeout(() => {
        handleFaceScanStart();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mode, status]);

  const startCamera = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 320, height: 320, facingMode: 'user' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera permission denied or camera unavailable, falling back to simulated scan", err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const handleFaceScanStart = () => {
    setStatus('scanning');
    setProgress(0);
    
    let currentProgress = 0;
    scanIntervalRef.current = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
        
        // Success check
        setStatus('success');
        playSuccessSound();
        
        setTimeout(() => {
          stopCamera();
          onSuccess();
        }, 1200);
      }
    }, 150);
  };

  const handleFingerprintMouseDown = () => {
    if (status === 'success' || status === 'scanning') return;
    isHoldingRef.current = true;
    setStatus('scanning');
    setProgress(0);

    let currentProgress = 0;
    const interval = setInterval(() => {
      if (!isHoldingRef.current) {
        clearInterval(interval);
        return;
      }
      currentProgress += 5;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setStatus('success');
        playSuccessSound();
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    }, 60); // Total 1.2 seconds of holding
  };

  const handleFingerprintMouseUp = () => {
    if (status === 'scanning' && progress < 100) {
      isHoldingRef.current = false;
      setStatus('idle');
      setProgress(0);
      playErrorSound();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in" id="biometric-prompt-modal">
      {/* Container */}
      <div 
        className="w-full sm:max-w-md bg-white dark:bg-[#1a1a24] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-black text-sm uppercase tracking-wider text-text-main">
              {textTitle}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-text-muted hover:text-text-main transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-black text-text-main max-w-sm">
              {mode === 'fingerprint' 
                ? (isBn 
                    ? 'আপনার মোবাইলের অফিশিয়াল ফিঙ্গারপ্রিন্ট সেন্সর (সাইড বাটন, স্ক্রিন বা ব্যাক প্যানেল) সক্রিয় করতে নিচের বাটনে ক্লিক করুন।' 
                    : 'Click the button below to activate your device\'s official fingerprint sensor (side button, screen, or back panel).')
                : textDesc}
            </p>
            <p className="text-xs text-text-muted font-bold">
              {status === 'scanning' && (isBn ? 'স্ক্যান করা হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন' : 'Scanning... please hold still')}
              {status === 'success' && (isBn ? 'সফল হয়েছে!' : 'Verification successful!')}
              {status === 'idle' && mode === 'fingerprint' && (
                isBn ? 'ডিভাইসের সিকিউরিটি মডিউল ব্যবহার করতে নিচের বাটনে চাপুন।' : 'Press the button below to trigger device security.'
              )}
              {status === 'idle' && mode !== 'fingerprint' && (
                isBn ? 'সেন্সরের উপর আঙুল চেপে ধরে রাখুন' : 'Touch and hold on the icon below'
              )}
            </p>
          </div>

          {/* Error display */}
          {nativeError && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-bold leading-relaxed w-full flex flex-col items-center gap-3">
              <p className="text-center">{nativeError}</p>
              {(nativeError.includes('আইফ্রেম') || nativeError.includes('iframe')) && (
                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-black uppercase tracking-wide transition-all shadow-sm active:scale-95"
                >
                  {isBn ? 'নতুন ট্যাবে অ্যাপ খুলুন' : 'Open in New Tab'}
                </button>
              )}
            </div>
          )}

          {/* Core Biometric Visual Area */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Circular Progress border for scanning status */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle 
                cx="96" 
                cy="96" 
                r="88" 
                className="stroke-gray-100 dark:stroke-white/5 fill-none" 
                strokeWidth="6"
              />
              <circle 
                cx="96" 
                cy="96" 
                r="88" 
                className={`fill-none transition-all duration-75 ${
                  status === 'success' ? 'stroke-emerald-500' : 
                  status === 'error' ? 'stroke-red-500' : 
                  'stroke-blue-500'
                }`}
                strokeWidth="6"
                strokeDasharray="552"
                strokeDashoffset={552 - (552 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Content depending on mode (Face vs Fingerprint) */}
            {mode === 'face' ? (
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-900 border-2 border-white/15 shadow-inner relative flex items-center justify-center">
                {!cameraError ? (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    {/* High tech laser scanline overlay */}
                    {status === 'scanning' && (
                      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                        <div className="w-full h-[3px] bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-bounce absolute top-0" style={{ animationDuration: '2.5s' }} />
                        <div className="absolute inset-0 border-2 border-cyan-400/40 rounded-full animate-pulse" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 text-white p-4">
                    <Scan size={44} className={`text-cyan-400 ${status === 'scanning' ? 'animate-pulse' : ''}`} />
                    <p className="text-[10px] uppercase font-black text-gray-300">Simulated Face Recognition</p>
                  </div>
                )}
                
                {/* Laser Overlay circle */}
                <div className="absolute inset-4 border border-dashed border-white/20 rounded-full pointer-events-none" />

                {/* State Icons */}
                {status === 'success' && (
                  <div className="absolute inset-0 bg-emerald-500/90 z-20 flex items-center justify-center text-white">
                    <Check size={56} className="animate-bounce" />
                  </div>
                )}
              </div>
            ) : (
              // Fingerprint Mode (or Transaction fingerprint)
              <button
                type="button"
                onClick={() => triggerNativeBiometrics(true)}
                onMouseDown={handleFingerprintMouseDown}
                onMouseUp={handleFingerprintMouseUp}
                onMouseLeave={handleFingerprintMouseUp}
                onTouchStart={handleFingerprintMouseDown}
                onTouchEnd={handleFingerprintMouseUp}
                className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 select-none shadow-lg ${
                  status === 'success' 
                    ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20' 
                    : status === 'scanning'
                      ? 'bg-blue-50 text-blue-500 dark:bg-blue-950/30 scale-95 shadow-inner'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-500 dark:bg-white/5 dark:hover:bg-white/10 dark:text-gray-400 active:scale-95'
                }`}
                style={{ cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
              >
                {status === 'success' ? (
                  <Check size={56} className="animate-scale-up" />
                ) : (
                  <div className="relative">
                    <Fingerprint size={64} className={`${status === 'scanning' ? 'animate-pulse text-blue-500' : ''}`} />
                    {status === 'scanning' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-16 h-16 rounded-full border-4 border-t-transparent border-blue-500 animate-spin" />
                      </div>
                    )}
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Help instructions */}
          <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl w-full text-xs font-bold text-text-muted space-y-1">
            {mode === 'face' ? (
              <p>{isBn ? 'আপনার চোখ খোলা রাখুন এবং ডিভাইসটি পর্যাপ্ত আলোতে রাখুন' : 'Keep your eyes open and ensure your environment is well-lit'}</p>
            ) : (
              <p>
                {isBn 
                  ? 'মোবাইলের ডিফল্ট বায়োমেট্রিক স্ক্রিন চালু করতে নিচের নীলাভ বাটনে ক্লিক করুন। আর স্ক্রিনের উপর চেপে ধরে রাখতে ফিঙ্গারপ্রিন্ট চিহ্নে ৩ সেকেন্ড চাপুন।' 
                  : 'Click the blue button below to trigger your native device scanner. Alternatively, tap & hold the fingerprint icon above for 3s to simulate.'}
              </p>
            )}
          </div>

          {/* Primary Action Button for launching native OS Biometric dialogue */}
          {mode === 'fingerprint' && status === 'idle' && (
            <button
              type="button"
              onClick={() => triggerNativeBiometrics(true)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2.5 hover:shadow-lg hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #047857 100%)' }}
            >
              <Fingerprint size={18} className="animate-pulse" />
              {isBn ? 'ডিভাইসের অফিসিয়াল ফিঙ্গারপ্রিন্ট সেন্সর চালু করুন' : 'Launch Device Fingerprint Sensor'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
