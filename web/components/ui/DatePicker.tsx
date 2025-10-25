'use client';

import React, { forwardRef, useId } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  maxDate?: string; // ISO date string (YYYY-MM-DD)
  minDate?: string; // ISO date string (YYYY-MM-DD)
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      disabled,
      id,
      maxDate,
      minDate,
      onFocus,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    // Default max date to today (can't pick future dates for birth date)
    const defaultMaxDate = maxDate || new Date().toISOString().split('T')[0];

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Try to show the picker on focus
      try {
        e.target.showPicker?.();
      } catch (error) {
        // Silently fail if showPicker is not supported
      }
      onFocus?.(e);
    };

    return (
      <div className="w-full">
        <div className="relative">
          <input
            id={inputId}
            type="date"
            placeholder={label}
            className={cn(
              'flex h-14 w-full rounded-lg pl-6 pr-5 py-4 mb-4',
              'text-base text-white placeholder:text-white/50 placeholder:uppercase placeholder:tracking-wide placeholder:text-sm',
              'bg-[#141414]',
              'border-0',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200',
              '[color-scheme:dark]', // Makes native date picker dark
              error && 'ring-2 ring-error focus:ring-error',
              className
            )}
            ref={ref}
            disabled={disabled}
            max={defaultMaxDate}
            min={minDate}
            onFocus={handleFocus}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? 'error-message' : helperText ? 'helper-text' : undefined
            }
            {...props}
          />
        </div>
        {error && (
          <p id="error-message" className="mt-1.5 text-sm text-error">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id="helper-text" className="mt-1.5 text-sm text-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
