import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'danger' | 'emerald' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  // Height and padding sizing
  let sizeClasses = 'h-12 px-4 text-sm';
  if (size === 'sm') sizeClasses = 'h-10 px-3 text-xs';
  if (size === 'lg') sizeClasses = 'h-14 px-6 text-base';

  // Variant styles following the application's global design rules (8-9px radius, shadows, borders)
  let variantClasses = '';
  switch (variant) {
    case 'primary':
      variantClasses =
        'bg-sky-600 hover:bg-sky-500 text-white border border-sky-500/30 shadow-[0_2px_10px_rgba(2,132,199,0.3)] dark:shadow-[0_2px_10px_rgba(2,132,199,0.25)]';
      break;
    case 'danger':
      variantClasses =
        'bg-red-600 hover:bg-red-700 text-white border border-red-500/30 shadow-[0_2px_10px_rgba(220,38,38,0.3)] dark:shadow-[0_2px_10px_rgba(220,38,38,0.25)]';
      break;
    case 'emerald':
      variantClasses =
        'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/30 shadow-[0_2px_10px_rgba(16,185,129,0.3)] dark:shadow-[0_2px_10px_rgba(16,185,129,0.25)]';
      break;
    case 'secondary':
    case 'outline':
      variantClasses =
        'bg-card hover:bg-black/5 dark:hover:bg-white/5 text-foreground border border-black/10 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]';
      break;
    case 'ghost':
      variantClasses = 'bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-foreground border-none';
      break;
  }

  const baseClasses =
    'relative inline-flex items-center justify-center gap-2 font-bold rounded-[9px] transition-all cursor-pointer select-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100';

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${widthClass} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} className="animate-spin shrink-0" />
          <span>{loadingText || 'Processing'}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
