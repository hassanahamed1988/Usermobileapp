export interface CountryType {
  name: string;
  flag: string;
  dial_code: string;
  nationality: string;
}

export const COUNTRIES: CountryType[] = [
  { name: 'Bangladesh', flag: '🇧🇩', dial_code: '+880', nationality: 'Bangladeshi' },
  { name: 'Saudi Arabia', flag: '🇸🇦', dial_code: '+966', nationality: 'Saudi' },
  { name: 'Qatar', flag: '🇶🇦', dial_code: '+974', nationality: 'Qatari' },
  { name: 'United Arab Emirates', flag: '🇦🇪', dial_code: '+971', nationality: 'Emirati' },
  { name: 'Kuwait', flag: '🇰🇼', dial_code: '+965', nationality: 'Kuwaiti' },
  { name: 'Oman', flag: '🇴🇲', dial_code: '+968', nationality: 'Omani' },
  { name: 'Bahrain', flag: '🇧🇭', dial_code: '+973', nationality: 'Bahraini' },
  { name: 'Egypt', flag: '🇪🇬', dial_code: '+20', nationality: 'Egyptian' },
  { name: 'India', flag: '🇮🇳', dial_code: '+91', nationality: 'Indian' },
  { name: 'Pakistan', flag: '🇵🇰', dial_code: '+92', nationality: 'Pakistani' },
  { name: 'Nepal', flag: '🇳🇵', dial_code: '+977', nationality: 'Nepalese' },
  { name: 'Sri Lanka', flag: '🇱🇰', dial_code: '+94', nationality: 'Sri Lankan' },
  { name: 'Yemen', flag: '🇾🇪', dial_code: '+967', nationality: 'Yemeni' },
  { name: 'Jordan', flag: '🇯🇴', dial_code: '+962', nationality: 'Jordanian' },
  { name: 'Lebanon', flag: '🇱🇧', dial_code: '+961', nationality: 'Lebanese' },
  { name: 'Syria', flag: '🇸🇾', dial_code: '+963', nationality: 'Syrian' },
  { name: 'Iraq', flag: '🇮🇶', dial_code: '+964', nationality: 'Iraqi' },
  { name: 'Iran', flag: '🇮🇷', dial_code: '+98', nationality: 'Iranian' },
  { name: 'Turkey', flag: '🇹🇷', dial_code: '+90', nationality: 'Turkish' },
  { name: 'United States', flag: '🇺🇸', dial_code: '+1', nationality: 'American' },
  { name: 'United Kingdom', flag: '🇬🇧', dial_code: '+44', nationality: 'British' },
  { name: 'Canada', flag: '🇨🇦', dial_code: '+1', nationality: 'Canadian' },
  { name: 'Australia', flag: '🇦🇺', dial_code: '+61', nationality: 'Australian' },
  { name: 'Singapore', flag: '🇸🇬', dial_code: '+65', nationality: 'Singaporean' },
  { name: 'Malaysia', flag: '🇲🇾', dial_code: '+60', nationality: 'Malaysian' },
  { name: 'Germany', flag: '🇩🇪', dial_code: '+49', nationality: 'German' },
  { name: 'France', flag: '🇫🇷', dial_code: '+33', nationality: 'French' },
  { name: 'Italy', flag: '🇮🇹', dial_code: '+39', nationality: 'Italian' },
  { name: 'Japan', flag: '🇯🇵', dial_code: '+81', nationality: 'Japanese' },
  { name: 'China', flag: '🇨🇳', dial_code: '+86', nationality: 'Chinese' },
  { name: 'Maldives', flag: '🇲🇻', dial_code: '+960', nationality: 'Maldivian' },
  { name: 'Bhutan', flag: '🇧🇹', dial_code: '+975', nationality: 'Bhutanese' },
  { name: 'Myanmar', flag: '🇲🇲', dial_code: '+95', nationality: 'Burmese' },
  { name: 'Indonesia', flag: '🇮🇩', dial_code: '+62', nationality: 'Indonesian' },
  { name: 'Philippines', flag: '🇵🇭', dial_code: '+63', nationality: 'Filipino' },
  { name: 'Thailand', flag: '🇹🇭', dial_code: '+66', nationality: 'Thai' },
  { name: 'Vietnam', flag: '🇻🇳', dial_code: '+84', nationality: 'Vietnamese' },
  { name: 'Russia', flag: '🇷🇺', dial_code: '+7', nationality: 'Russian' }
];

export const DIVISIONS: Record<string, string[]> = {};

export const DISTRICTS: Record<string, string[]> = {};

export const POLICE_STATIONS: Record<string, string[]> = {};

export const POST_OFFICES: Record<string, { name: string; code: string }[]> = {};
