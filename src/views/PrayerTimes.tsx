import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { TRANSLATIONS } from '../constants.tsx';
import { MapPin, Clock, Info, RefreshCw } from 'lucide-react';


interface PrayerTimeData {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

interface LocationData {
  city: string;
  country: string;
  area: string;
}

const IQAMAH_OFFSETS: Record<string, number> = {
  Fajr: 20,
  Dhuhr: 15,
  Asr: 15,
  Maghrib: 7,
  Isha: 15,
};

const PrayerTimes: React.FC = () => {
  const { language, setView, prayerTimeOffsets } = useStore();
  const t = TRANSLATIONS[language];
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPrayerTimes = async (lat: number, lng: number) => {
    try {
      // Fetch location info
      const locRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const locData = await locRes.json();
      setLocation({
        city: locData.city || locData.locality || 'Unknown City',
        country: locData.countryName || 'Unknown Country',
        area: locData.principalSubdivision || ''
      });

      // Fetch prayer times
      const date = new Date();
      const timestamp = Math.floor(date.getTime() / 1000);
      const prayerRes = await fetch(`https://api.aladhan.com/v1/timings/${timestamp}?latitude=${lat}&longitude=${lng}&method=2`);
      const prayerData = await prayerRes.json();
      
      if (prayerData.code === 200) {
        setPrayerTimes(prayerData.data.timings);
      } else {
        throw new Error('Failed to fetch prayer times');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchPrayerTimes(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        setError(t.LOCATION_ERROR + ': ' + err.message);
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const formatTime = (time24: string, prayerId: string) => {
    const offset = prayerTimeOffsets[prayerId] || 0;
    const [hours, minutes] = time24.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes) + offset);

    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  };

  const getIqamahTime = (adhanTime: string, offset: number, prayerId: string) => {
    const adhanOffset = prayerTimeOffsets[prayerId] || 0;
    const [hours, minutes] = adhanTime.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes) + adhanOffset + offset);
    
    let h = date.getHours();
    const m = date.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${m} ${ampm}`;
  };

  const prayerList = [
    { id: 'Fajr', label: t.FAJR, icon: '🌅' },
    { id: 'Sunrise', label: t.SUNRISE, icon: '☀️' },
    { id: 'Dhuhr', label: t.DHUHR, icon: '☀️' },
    { id: 'Asr', label: t.ASR, icon: '🌤️' },
    { id: 'Maghrib', label: t.MAGHRIB, icon: '🌇' },
    { id: 'Isha', label: t.ISHA, icon: '🌙' },
  ];

  return (
    <div className="min-h-screen pb-[60px] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-end mb-6">
        <button 
          onClick={detectLocation}
          className="p-2 bg-black/5 dark:bg-white/10 rounded-full text-text-main hover:bg-black/10 dark:hover:bg-white/20 transition-all"
          disabled={loading}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Location Info */}
      <div className="bg-card-bg backdrop-blur-md rounded-lg p-4 mb-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ color: 'var(--primary)' }}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundColor: 'var(--primary)' }} />
              <MapPin size={20} className="relative z-10" />
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{t.LOCATION_DETECTED}</p>
              <h2 className="text-text-main font-black text-sm">
                {loading ? t.DETECTING_LOCATION : `${location?.city}, ${location?.country}`}
              </h2>
              {location?.area && <p className="text-[10px] text-text-muted">{location.area}</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg">
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest pr-2">
                {currentTime.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-text-main font-black text-sm">
                {currentTime.toLocaleTimeString(language === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <p className="text-[9px] text-text-muted uppercase font-bold tracking-[0.2em]">
              {currentTime.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'long' })}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 rounded-xl p-4 text-red-600 dark:text-red-200 text-sm mb-6 flex items-center gap-3">
          <Info size={18} />
          {error}
        </div>
      )}

      {/* Prayer Times List - Line by Line */}
      <div className="space-y-3">
        {prayerList.map((prayer) => {
          const time = prayerTimes ? (prayerTimes as any)[prayer.id] : '--:--';
          const offset = IQAMAH_OFFSETS[prayer.id];
          const iqamah = prayerTimes && offset ? getIqamahTime(time, offset, prayer.id) : null;

          return (
            <div
              key={prayer.id}
              
              
              className="bg-card-bg backdrop-blur-lg rounded-xl p-4 shadow-lg flex items-center justify-between group overflow-hidden relative"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'var(--primary)' }} />
              
              <div className="flex items-center gap-4">
                <div className="text-2xl w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg">
                  {prayer.icon}
                </div>
                <div>
                  <h3 className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-0.5">{prayer.label}</h3>
                  <p className="text-text-main font-black text-lg">
                    {prayerTimes ? formatTime(time, prayer.id) : '--:--'}
                  </p>
                </div>
              </div>

              {iqamah && (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-[9px] font-bold uppercase mb-0.5" style={{ color: 'var(--primary)' }}>
                    <Clock size={10} />
                    {t.IQAMAH}
                  </div>
                  <p className="text-text-main font-bold text-sm">{iqamah}</p>
                  <p className="text-[8px] text-text-muted">
                    {offset} {t.MINUTES_AFTER_ADHAN}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Footer */}
      <div className="mt-6 p-4 bg-card-bg rounded-xl">
        <p className="text-[10px] text-text-muted leading-relaxed italic">
          * {t.IQAMAH} times are calculated based on standard offsets from Adhan. Please check your local mosque for exact timings.
        </p>
      </div>
    </div>
  );
};

export default PrayerTimes;
