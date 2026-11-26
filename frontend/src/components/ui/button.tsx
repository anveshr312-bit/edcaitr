'use client';

import React, { forwardRef } from 'react';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'crimson' | 'destructive';
export type ButtonSize = 'xs' | 'sm' | 'default' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  default:
    'bg-[#030405] dark:bg-[#F1F0ED] text-white dark:text-[#101011] border border-[#030405] dark:border-[#F1F0ED] hover:opacity-90',
  crimson:
    'bg-[#C01E30] text-white border border-[#C01E30] hover:bg-[#9E1625]',
  outline:
    'bg-[var(--surface)] text-[var(--color-2-mood)] border border-[var(--border-strong)] hover:bg-[var(--surface-subtle)] hover:border-[#C01E30]/60',
  secondary:
    'bg-[var(--surface-subtle)] text-[var(--color-2-mood)] border border-[var(--border-hairline)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)]',
  ghost:
    'bg-transparent text-[var(--ink-secondary)] border border-transparent hover:bg-[var(--surface-subtle)] hover:text-[var(--color-2-mood)]',
  destructive:
    'bg-[#FEF2F2] dark:bg-red-950/40 text-[#C01E30] dark:text-[#F87171] border border-[#FECACA] dark:border-red-900/60 hover:bg-[#FEE2E2] dark:hover:bg-red-950/70',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  xs: 'h-8 px-2.5 text-xs gap-1.5',
  sm: 'h-9 px-3.5 text-xs gap-2',
  default: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-9 w-9 p-0 justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', type = 'button', className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center rounded-[9px] font-medium tracking-[-0.01em] whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C01E30] disabled:opacity-45 disabled:pointer-events-none ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${className}`.trim()}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export default Button;
