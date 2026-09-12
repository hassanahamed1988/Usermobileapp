
import React from 'react';
import { 
  Truck, 
  FileText, 
  Search, 
  Wallet, 
  CalendarCheck, 
  DollarSign, 
  Settings, 
  Headphones, 
  User as UserIcon, 
  MessageSquare, 
  Palette, 
  Fuel, 
  Download, 
  ShoppingCart, 
  Lock,
  Receipt,
  Home,
  Contact,
  Landmark
} from "lucide-react";

import { TRANSLATIONS } from './translations';
export { TRANSLATIONS };

export const GLOBAL_DASHBOARD_MODULES = [
  { id: 'NEW_TRIP', labelKey: 'NEW_TRIP', icon: <Truck size={18} />, color: '#facc15', type: 'user' },
  { id: 'MONTHLY_FILES', labelKey: 'MONTHLY_FILES', icon: <FileText size={18} />, color: '#2dd4bf', type: 'user' },
  { id: 'CONTACTS', labelKey: 'CONTACTS', icon: <Contact size={18} />, color: '#10b981', type: 'user' },
  { id: 'SEARCH', labelKey: 'SEARCH', icon: <Search size={18} />, color: '#818cf8', type: 'user' },
  { id: 'MY_INCOME', labelKey: 'MY_INCOME', icon: <Wallet size={18} />, color: '#10b981', type: 'user' },
  { id: 'PAYMENT', labelKey: 'PAYMENT', icon: <Wallet size={18} />, color: '#fbbf24', type: 'user' },
  { id: 'FAMILY_MAINTENANCE', labelKey: 'FAMILY_MAINTENANCE', icon: <Home size={18} />, color: '#ec4899', type: 'user' },
  { id: 'LEAVE_SETTLEMENT', labelKey: 'LEAVE_SETTLEMENT', icon: <CalendarCheck size={18} />, color: '#10b981', type: 'user' },
  { id: 'ADD_MONEY', labelKey: 'ADD_MONEY', icon: <DollarSign size={18} />, color: '#10b981', type: 'user' },
  { id: 'SETTINGS', labelKey: 'SETTINGS', icon: <Settings size={18} />, color: '#9ca3af', type: 'user' },
  { id: 'SUPPORT', labelKey: 'SUPPORT', icon: <Headphones size={18} />, color: '#f472b6', type: 'user' },
  { id: 'USER_PROFILE', labelKey: 'NAV_PROFILE', icon: <UserIcon size={18} />, color: '#6366f1', type: 'user' },
  { id: 'CHAT', labelKey: 'CHAT', icon: <MessageSquare size={18} />, color: '#ec4899', type: 'user' },
  { id: 'THEME', labelKey: 'THEME', icon: <Palette size={18} />, color: '#a855f7', type: 'user' },
  { id: 'FUEL', labelKey: 'FUEL', icon: <Fuel size={18} />, color: '#f97316', type: 'user' },
  { id: 'LOAN', labelKey: 'LOAN', icon: <DollarSign size={18} />, color: '#0ea5e9', type: 'user' },
  { id: 'DOWNLOAD', labelKey: 'DOWNLOAD', icon: <Download size={18} />, color: '#6366f1', type: 'user' },
  { id: 'STATEMENT', labelKey: 'STATEMENT', icon: <FileText size={18} />, color: '#0ea5e9', type: 'user' },
  { id: 'INVOICE', labelKey: 'INVOICE_MENU', icon: <Receipt size={18} />, color: '#a855f7', type: 'user' },
  { id: 'PURCHASE', labelKey: 'PURCHASE', icon: <ShoppingCart size={18} />, color: '#facc15', type: 'user' },
  { id: 'WALLET', labelKey: 'WALLET', icon: <Wallet size={18} />, color: '#10b981', type: 'user' },
  { id: 'SECURITY', labelKey: 'SECURITY', icon: <Lock size={18} />, color: '#ef4444', type: 'user' },
  { id: 'BANK_ACCOUNT', labelKey: 'BANK_ACCOUNT', icon: <Landmark size={18} />, color: '#0ea5e9', type: 'user' },
];

export const PRESET_BACKGROUNDS = [
  { name: 'Midnight', color: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
  { name: 'Ocean', color: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)' },
  { name: 'Forest', color: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)' },
  { name: 'Sunset', color: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 50%, #facc15 100%)' },
  { name: 'Aurora', color: 'linear-gradient(135deg, #22c55e 0%, #10b981 50%, #a855f7 100%)' },
  { name: 'Deep Space', color: 'linear-gradient(135deg, #000000 0%, #4c1d95 50%, #1e1b4b 100%)' },
  { name: 'Vibrant Berry', color: 'linear-gradient(135deg, #be123c 0%, #701a75 100%)' },
  { name: 'Tropical', color: 'linear-gradient(135deg, #0d9488 0%, #65a30d 100%)' },
  { name: 'Cyberpunk', color: 'linear-gradient(135deg, #06b6d4 0%, #d946ef 100%)' },
  { name: 'Lavender', color: 'linear-gradient(135deg, #818cf8 0%, #f472b6 100%)' },
  { name: 'Rose Gold', color: 'linear-gradient(135deg, #f43f5e 0%, #fbcfe8 100%)' },
  { name: 'Neon Breeze', color: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' },
  { name: 'Solar Flare', color: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' },
  { name: 'Grape Soda', color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { name: 'Warm Ocean', color: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)' },
  { name: 'Cosmic Fusion', color: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)' },
  { name: 'Electric Purple', color: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
  { name: 'Magma', color: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Emerald Dream', color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: 'Plum', color: 'linear-gradient(135deg, #cc208e 0%, #6713d2 100%)' },
  { name: 'Orange Juice', color: 'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)' },
  { name: 'Steel', color: 'linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)' },
  { name: 'Slate', color: '#94a3b8' },
  { name: 'Stone', color: '#a8a29e' },
  { name: 'Zinc', color: '#a1a1aa' },
];

export const LIGHT_THEME_PRESETS = [
  { 
    id: 'default', 
    name: 'Default Emerald', 
    bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
    header: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    primary: '#10b981'
  },
  { 
    id: 'emerald', 
    name: 'Emerald Green', 
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
    header: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    primary: '#10b981'
  },
  { 
    id: 'rose', 
    name: 'Soft Rose', 
    bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', 
    header: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    primary: '#f43f5e'
  },
  { 
    id: 'amber', 
    name: 'Golden Amber', 
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
    header: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    primary: '#f59e0b'
  },
  { 
    id: 'violet', 
    name: 'Royal Violet', 
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', 
    header: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    primary: '#8b5cf6'
  },
  { 
    id: 'cyan', 
    name: 'Ocean Cyan', 
    bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', 
    header: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    primary: '#06b6d4'
  },
  { 
    id: 'slate', 
    name: 'Modern Slate', 
    bg: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
    header: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
    primary: '#475569'
  },
  { 
    id: 'crimson', 
    name: 'Crimson Red', 
    bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
    header: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    primary: '#dc2626'
  },
  { 
    id: 'light-black', 
    name: 'Light Black', 
    bg: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', 
    header: 'linear-gradient(135deg, #4b5563 0%, #374151 100%)',
    primary: '#4b5563'
  },
  { 
    id: 'light-white', 
    name: 'Light White', 
    bg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
    header: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    primary: '#64748b'
  },
  {
    id: 'teal',
    name: 'Teal Breeze',
    bg: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
    header: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
    primary: '#14b8a6'
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    header: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
    primary: '#f97316'
  },
  {
    id: 'fuchsia',
    name: 'Fuchsia Pink',
    bg: 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)',
    header: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
    primary: '#d946ef'
  },
  {
    id: 'indigo',
    name: 'Indigo Night',
    bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
    header: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
    primary: '#6366f1'
  },
  {
    id: 'lime',
    name: 'Lime Fresh',
    bg: 'linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%)',
    header: 'linear-gradient(135deg, #84cc16 0%, #4d7c0f 100%)',
    primary: '#84cc16'
  },
  {
    id: 'sky',
    name: 'Sky Blue',
    bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    header: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
    primary: '#0ea5e9'
  },
  {
    id: 'pink',
    name: 'Pink Ribbon',
    bg: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)',
    header: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    primary: '#ec4899'
  },
  {
    id: 'yellow',
    name: 'Yellow Sunshine',
    bg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)',
    header: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)',
    primary: '#eab308'
  },
  {
    id: 'purple',
    name: 'Purple Haze',
    bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    header: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
    primary: '#a855f7'
  },
  {
    id: 'cherry',
    name: 'Cherry Red',
    bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
    header: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)',
    primary: '#e11d48'
  }
];

export const THEMES = [
  { 
    id: 'day-mode', 
    label: 'DAY MODE', 
    color: '#ffffff', 
    dark: false, 
    primary: '#10b981', 
    bg: '#1e293b', 
    card: '#ffffff', 
    previewBg: '#1e293b', 
    previewCard: '#ffffff' 
  },
  { 
    id: 'night-mode', 
    label: 'NIGHT MODE', 
    color: '#0f172a', 
    dark: true, 
    primary: '#10b981', 
    bg: '#000000', 
    card: '#ffffff', 
    previewBg: '#000000', 
    previewCard: '#ffffff' 
  },
];

export const LOCATIONS: any[] = [];
export const QATAR_COMPANIES: any[] = [];
export const NATIONALITIES: any[] = [];

export const APP_MODULES = GLOBAL_DASHBOARD_MODULES.map(m => {
  let iconName = 'Shield';
  if (m.id === 'NEW_TRIP') iconName = 'Truck';
  else if (m.id === 'MONTHLY_FILES') iconName = 'FileText';
  else if (m.id === 'SEARCH') iconName = 'Search';
  else if (m.id === 'MY_INCOME' || m.id === 'PAYMENT' || m.id === 'WALLET') iconName = 'Wallet';
  else if (m.id === 'LEAVE_SETTLEMENT') iconName = 'CalendarCheck';
  else if (m.id === 'FAMILY_MAINTENANCE') iconName = 'Home';
  else if (m.id === 'ADD_MONEY') iconName = 'DollarSign';
  else if (m.id === 'SETTINGS') iconName = 'Settings';
  else if (m.id === 'SUPPORT') iconName = 'Headphones';
  else if (m.id === 'USER_PROFILE') iconName = 'User';
  else if (m.id === 'CHAT') iconName = 'MessageSquare';
  else if (m.id === 'THEME') iconName = 'Palette';
  else if (m.id === 'FUEL') iconName = 'Fuel';
  else if (m.id === 'LOAN') iconName = 'Landmark';
  else if (m.id === 'DOWNLOAD') iconName = 'Download';
  else if (m.id === 'STATEMENT') iconName = 'FileText';
  else if (m.id === 'INVOICE') iconName = 'Receipt';
  else if (m.id === 'PURCHASE') iconName = 'ShoppingCart';
  else if (m.id === 'SECURITY') iconName = 'Lock';
  else if (m.id === 'DUMMY_MODULE') iconName = 'Lock';
  
  return {
    id: m.id,
    label: m.id.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
    icon: iconName,
    color: m.color
  };
});

export const DASHBOARD_ICONS = [
  { id: 'Home', label: 'Home' },
  { id: 'LayoutDashboard', label: 'Dashboard' },
  { id: 'Activity', label: 'Activity' },
  { id: 'BarChart2', label: 'Chart' },
];
