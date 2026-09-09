import { COUNTRIES as BASE_COUNTRIES, CountryType } from '../constants/countries';

export interface CountryInfo {
  name: string;
  code: string;
  flag: string;
  dial_code?: string;
  nationality?: string;
}

// Full comprehensive world countries list with ISO codes and flags
export const WORLD_COUNTRIES: CountryInfo[] = [
  { name: 'Qatar', code: 'QA', flag: '🇶🇦', dial_code: '+974', nationality: 'Qatari' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', dial_code: '+966', nationality: 'Saudi' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', dial_code: '+971', nationality: 'Emirati' },
  { name: 'Bahrain', code: 'BH', flag: '🇧🇭', dial_code: '+973', nationality: 'Bahraini' },
  { name: 'Kuwait', code: 'KW', flag: '🇰🇼', dial_code: '+965', nationality: 'Kuwaiti' },
  { name: 'Oman', code: 'OM', flag: '🇴🇲', dial_code: '+968', nationality: 'Omani' },
  { name: 'Bangladesh', code: 'BD', flag: '🇧🇩', dial_code: '+880', nationality: 'Bangladeshi' },
  { name: 'India', code: 'IN', flag: '🇮🇳', dial_code: '+91', nationality: 'Indian' },
  { name: 'Pakistan', code: 'PK', flag: '🇵🇰', dial_code: '+92', nationality: 'Pakistani' },
  { name: 'Nepal', code: 'NP', flag: '🇳🇵', dial_code: '+977', nationality: 'Nepalese' },
  { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰', dial_code: '+94', nationality: 'Sri Lankan' },
  { name: 'Egypt', code: 'EG', flag: '🇪🇬', dial_code: '+20', nationality: 'Egyptian' },
  { name: 'Jordan', code: 'JO', flag: '🇯🇴', dial_code: '+962', nationality: 'Jordanian' },
  { name: 'Lebanon', code: 'LB', flag: '🇱🇧', dial_code: '+961', nationality: 'Lebanese' },
  { name: 'Syria', code: 'SY', flag: '🇸🇾', dial_code: '+963', nationality: 'Syrian' },
  { name: 'Iraq', code: 'IQ', flag: '🇮🇶', dial_code: '+964', nationality: 'Iraqi' },
  { name: 'Iran', code: 'IR', flag: '🇮🇷', dial_code: '+98', nationality: 'Iranian' },
  { name: 'Yemen', code: 'YE', flag: '🇾🇪', dial_code: '+967', nationality: 'Yemeni' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', dial_code: '+90', nationality: 'Turkish' },
  { name: 'United States', code: 'US', flag: '🇺🇸', dial_code: '+1', nationality: 'American' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dial_code: '+44', nationality: 'British' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dial_code: '+1', nationality: 'Canadian' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', dial_code: '+61', nationality: 'Australian' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dial_code: '+49', nationality: 'German' },
  { name: 'France', code: 'FR', flag: '🇫🇷', dial_code: '+33', nationality: 'French' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', dial_code: '+39', nationality: 'Italian' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', dial_code: '+34', nationality: 'Spanish' },
  { name: 'Portugal', code: 'PT', flag: '🇵🇹', dial_code: '+351', nationality: 'Portuguese' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', dial_code: '+31', nationality: 'Dutch' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪', dial_code: '+32', nationality: 'Belgian' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', dial_code: '+41', nationality: 'Swiss' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪', dial_code: '+46', nationality: 'Swedish' },
  { name: 'Norway', code: 'NO', flag: '🇳🇴', dial_code: '+47', nationality: 'Norwegian' },
  { name: 'Denmark', code: 'DK', flag: '🇩🇰', dial_code: '+45', nationality: 'Danish' },
  { name: 'Finland', code: 'FI', flag: '🇫🇮', dial_code: '+358', nationality: 'Finnish' },
  { name: 'Poland', code: 'PL', flag: '🇵🇱', dial_code: '+48', nationality: 'Polish' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹', dial_code: '+43', nationality: 'Austrian' },
  { name: 'Greece', code: 'GR', flag: '🇬🇷', dial_code: '+30', nationality: 'Greek' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪', dial_code: '+353', nationality: 'Irish' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', dial_code: '+64', nationality: 'New Zealander' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', dial_code: '+65', nationality: 'Singaporean' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', dial_code: '+60', nationality: 'Malaysian' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', dial_code: '+62', nationality: 'Indonesian' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', dial_code: '+63', nationality: 'Filipino' },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭', dial_code: '+66', nationality: 'Thai' },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', dial_code: '+84', nationality: 'Vietnamese' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', dial_code: '+81', nationality: 'Japanese' },
  { name: 'China', code: 'CN', flag: '🇨🇳', dial_code: '+86', nationality: 'Chinese' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', dial_code: '+82', nationality: 'South Korean' },
  { name: 'Russia', code: 'RU', flag: '🇷🇺', dial_code: '+7', nationality: 'Russian' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', dial_code: '+55', nationality: 'Brazilian' },
  { name: 'Argentina', code: 'AR', flag: '🇦🇷', dial_code: '+54', nationality: 'Argentine' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽', dial_code: '+52', nationality: 'Mexican' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', dial_code: '+27', nationality: 'South African' },
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬', dial_code: '+234', nationality: 'Nigerian' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪', dial_code: '+254', nationality: 'Kenyan' },
  { name: 'Morocco', code: 'MA', flag: '🇲🇦', dial_code: '+212', nationality: 'Moroccan' },
  { name: 'Algeria', code: 'DZ', flag: '🇩🇿', dial_code: '+213', nationality: 'Algerian' },
  { name: 'Tunisia', code: 'TN', flag: '🇹🇳', dial_code: '+216', nationality: 'Tunisian' },
  { name: 'Sudan', code: 'SD', flag: '🇸🇩', dial_code: '+249', nationality: 'Sudanese' },
  { name: 'Libya', code: 'LY', flag: '🇱🇾', dial_code: '+218', nationality: 'Libyan' },
  { name: 'Maldives', code: 'MV', flag: '🇲🇻', dial_code: '+960', nationality: 'Maldivian' },
  { name: 'Bhutan', code: 'BT', flag: '🇧🇹', dial_code: '+975', nationality: 'Bhutanese' },
  { name: 'Myanmar', code: 'MM', flag: '🇲🇲', dial_code: '+95', nationality: 'Burmese' },
  { name: 'Afghanistan', code: 'AF', flag: '🇦🇫', dial_code: '+93', nationality: 'Afghan' },
  { name: 'Palestine', code: 'PS', flag: '🇵🇸', dial_code: '+970', nationality: 'Palestinian' },
  { name: 'Cyprus', code: 'CY', flag: '🇨🇾', dial_code: '+357', nationality: 'Cypriot' },
  { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿', dial_code: '+994', nationality: 'Azerbaijani' },
  { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿', dial_code: '+998', nationality: 'Uzbek' },
  { name: 'Kazakhstan', code: 'KZ', flag: '🇰🇿', dial_code: '+7', nationality: 'Kazakh' },
  { name: 'Georgia', code: 'GE', flag: '🇬🇪', dial_code: '+995', nationality: 'Georgian' },
  { name: 'Armenia', code: 'AM', flag: '🇦🇲', dial_code: '+374', nationality: 'Armenian' },
  { name: 'Somalia', code: 'SO', flag: '🇸🇴', dial_code: '+252', nationality: 'Somali' },
  { name: 'Ethiopia', code: 'ET', flag: '🇪🇹', dial_code: '+251', nationality: 'Ethiopian' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭', dial_code: '+233', nationality: 'Ghanaian' },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬', dial_code: '+256', nationality: 'Ugandan' },
  { name: 'Tanzania', code: 'TZ', flag: '🇹🇿', dial_code: '+255', nationality: 'Tanzanian' },
  { name: 'Chile', code: 'CL', flag: '🇨🇱', dial_code: '+56', nationality: 'Chilean' },
  { name: 'Colombia', code: 'CO', flag: '🇨🇴', dial_code: '+57', nationality: 'Colombian' },
  { name: 'Peru', code: 'PE', flag: '🇵🇪', dial_code: '+51', nationality: 'Peruvian' },
  { name: 'Venezuela', code: 'VE', flag: '🇻🇪', dial_code: '+58', nationality: 'Venezuelan' },
  { name: 'Cuba', code: 'CU', flag: '🇨🇺', dial_code: '+53', nationality: 'Cuban' },
  { name: 'Jamaica', code: 'JM', flag: '🇯🇲', dial_code: '+1876', nationality: 'Jamaican' },
  { name: 'Ukraine', code: 'UA', flag: '🇺🇦', dial_code: '+380', nationality: 'Ukrainian' },
  { name: 'Romania', code: 'RO', flag: '🇷🇴', dial_code: '+40', nationality: 'Romanian' },
  { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿', dial_code: '+420', nationality: 'Czech' },
  { name: 'Hungary', code: 'HU', flag: '🇭🇺', dial_code: '+36', nationality: 'Hungarian' },
  { name: 'Bulgaria', code: 'BG', flag: '🇧🇬', dial_code: '+359', nationality: 'Bulgarian' },
  { name: 'Croatia', code: 'HR', flag: '🇭🇷', dial_code: '+385', nationality: 'Croatian' },
  { name: 'Serbia', code: 'RS', flag: '🇷🇸', dial_code: '+381', nationality: 'Serbian' },
  { name: 'Hong Kong', code: 'HK', flag: '🇭🇰', dial_code: '+852', nationality: 'Hong Konger' },
  { name: 'Taiwan', code: 'TW', flag: '🇹🇼', dial_code: '+886', nationality: 'Taiwanese' }
];

// Common aliases mapping for robust detection
const ALIAS_MAP: Record<string, string> = {
  'usa': 'United States',
  'us': 'United States',
  'america': 'United States',
  'united states of america': 'United States',
  'uk': 'United Kingdom',
  'britain': 'United Kingdom',
  'great britain': 'United Kingdom',
  'england': 'United Kingdom',
  'uae': 'United Arab Emirates',
  'emirates': 'United Arab Emirates',
  'dubai': 'United Arab Emirates',
  'ksa': 'Saudi Arabia',
  'saudi': 'Saudi Arabia',
  'bangla': 'Bangladesh',
  'bd': 'Bangladesh',
  'qatar': 'Qatar',
  'qa': 'Qatar',
  'ind': 'India',
  'pak': 'Pakistan',
  'oman': 'Oman',
  'kuwait': 'Kuwait',
  'bahrain': 'Bahrain',
  'russia': 'Russia',
  'turkey': 'Turkey',
  'turkiye': 'Turkey',
  'china': 'China',
  'japan': 'Japan',
  'germany': 'Germany',
  'france': 'France',
  'italy': 'Italy',
  'spain': 'Spain',
  'canada': 'Canada',
  'australia': 'Australia',
  'egypt': 'Egypt',
  'malaysia': 'Malaysia',
  'singapore': 'Singapore',
  'philippines': 'Philippines',
  'indonesia': 'Indonesia',
  'thailand': 'Thailand',
  'vietnam': 'Vietnam',
};

/**
 * Generate a flag emoji from an ISO 3166-1 alpha-2 code
 */
export function getFlagEmojiFromCode(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const code = countryCode.toUpperCase();
  const codePoints = [...code].map(c => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Scan and detect country info, logo, code, and flag from user input
 */
export function scanAndDetectCountry(input: string): CountryInfo {
  if (!input || !input.trim()) {
    return { name: '', code: '', flag: '🌐' };
  }

  const clean = input.trim();
  const lower = clean.toLowerCase();

  // 1. Check alias map
  if (ALIAS_MAP[lower]) {
    const aliasTarget = ALIAS_MAP[lower];
    const match = WORLD_COUNTRIES.find(c => c.name.toLowerCase() === aliasTarget.toLowerCase());
    if (match) return match;
  }

  // 2. Exact match in world countries
  const exactMatch = WORLD_COUNTRIES.find(c => 
    c.name.toLowerCase() === lower || 
    c.code.toLowerCase() === lower ||
    (c.dial_code && c.dial_code.replace('+', '') === lower.replace('+', ''))
  );
  if (exactMatch) return exactMatch;

  // 3. Partial / Starts-with match
  const partialMatch = WORLD_COUNTRIES.find(c => 
    c.name.toLowerCase().startsWith(lower) || 
    lower.startsWith(c.name.toLowerCase())
  );
  if (partialMatch) return partialMatch;

  // 4. Word-boundary inclusion match
  const wordMatch = WORLD_COUNTRIES.find(c => 
    c.name.toLowerCase().includes(lower) || 
    lower.includes(c.name.toLowerCase())
  );
  if (wordMatch) return wordMatch;

  // 5. If 2-letter input, generate standard flag
  if (clean.length === 2 && /^[a-zA-Z]{2}$/.test(clean)) {
    const code = clean.toUpperCase();
    return {
      name: code,
      code: code,
      flag: getFlagEmojiFromCode(code),
    };
  }

  // 6. Fallback: Capitalize properly and assign globe flag
  const formattedName = clean
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    name: formattedName,
    code: formattedName.slice(0, 2).toUpperCase(),
    flag: '🌐',
  };
}
