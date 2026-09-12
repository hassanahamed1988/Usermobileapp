import React from 'react';
import { Landmark, Building2, CreditCard, Smartphone, Monitor, Globe, Wallet } from 'lucide-react';

interface BankBrandIconProps {
  name?: string;
  type?: 'bank' | 'card' | 'wallet' | 'ibanking' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

export const BankBrandIcon: React.FC<BankBrandIconProps> = ({
  name = '',
  type = 'auto',
  size = 'md',
  className = ''
}) => {
  const normName = name.trim().toLowerCase();

  const iconPixel = typeof size === 'number' 
    ? size 
    : size === 'xs' ? 14 
    : size === 'sm' ? 18 
    : size === 'md' ? 22 
    : size === 'lg' ? 28 
    : 34;

  const boxPixel = typeof size === 'number' 
    ? size + 10 
    : size === 'xs' ? 24 
    : size === 'sm' ? 32 
    : size === 'md' ? 40 
    : size === 'lg' ? 48 
    : 56;

  let IconComponent = Landmark;
  let bgClass = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20';

  if (type === 'card' || normName.includes('card') || normName.includes('visa') || normName.includes('mastercard') || normName.includes('debit') || normName.includes('credit')) {
    IconComponent = CreditCard;
    bgClass = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
  } else if (type === 'wallet' || normName.includes('bkash') || normName.includes('nagad') || normName.includes('rocket') || normName.includes('upay') || normName.includes('cellfin') || normName.includes('wallet')) {
    IconComponent = Wallet;
    bgClass = 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20';
  } else if (type === 'ibanking' || normName.includes('ibanking') || normName.includes('net') || normName.includes('online')) {
    IconComponent = Globe;
    bgClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
  } else if (normName.includes('islami') || normName.includes('ibbl') || normName.includes('al rayan')) {
    IconComponent = Building2;
    bgClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
  } else if (normName.includes('dutch') || normName.includes('dbbl')) {
    IconComponent = Building2;
    bgClass = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
  } else if (normName.includes('brac')) {
    IconComponent = Landmark;
    bgClass = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20';
  } else if (normName.includes('city')) {
    IconComponent = Building2;
    bgClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
  } else if (normName.includes('eastern') || normName.includes('ebl')) {
    IconComponent = Landmark;
    bgClass = 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20';
  } else if (normName.includes('standard chartered') || normName.includes('hsbc') || normName.includes('qatar') || normName.includes('qnb') || normName.includes('doha')) {
    IconComponent = Globe;
    bgClass = 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20';
  } else if (normName.includes('sonali') || normName.includes('agrani') || normName.includes('janata') || normName.includes('rupali')) {
    IconComponent = Landmark;
    bgClass = 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
  } else if (normName.includes('prime') || normName.includes('dhaka') || normName.includes('ucb') || normName.includes('united commercial')) {
    IconComponent = Building2;
    bgClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
  } else if (normName.includes('trust') || normName.includes('pubali') || normName.includes('mutual')) {
    IconComponent = Landmark;
    bgClass = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
  }

  return (
    <div 
      className={`inline-flex items-center justify-center rounded-xl shrink-0 select-none transition-transform ${bgClass} ${className}`}
      style={{ width: boxPixel, height: boxPixel }}
    >
      <IconComponent size={iconPixel} />
    </div>
  );
};

export default BankBrandIcon;
