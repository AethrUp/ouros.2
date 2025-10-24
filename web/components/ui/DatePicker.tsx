'use client';

import React, { forwardRef } from 'react';
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
      ...props
    },
    ref
  ) => {
    const inputId = id || `date-${Math.random().toString(36).substr(2, 9)}`;

    // Default max date to today (can't pick future dates for birth date)
    const defaultMaxDate = maxDate || new Date().toISOString().split('T')[0];

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-white mb-2"
          >
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none">
            <Calendar className="w-5 h-5" />
          </div>
          <input
            id={inputId}
            type="date"
            className={cn(
              'flex h-12 w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3',
              'text-base text-white',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200',
              '[color-scheme:dark]', // Makes native date picker dark
              error && 'border-error focus:ring-error',
              className
            )}
            ref={ref}
            disabled={disabled}
            max={defaultMaxDate}
            min={minDate}
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
