'use client';

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="w-full">
        <div className="relative">
          <input
            id={inputId}
            type={inputType}
            placeholder={label}
            className={cn(
              'flex h-14 w-full rounded-lg px-5 py-4 mb-4',
              'text-base text-white placeholder:text-white/50 placeholder:uppercase placeholder:tracking-wide placeholder:text-sm',
              'bg-[#141414]',
              'border-0',
              'focus:outline-none focus:ring-2 focus:ring-primary/50',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all duration-200',
              error && 'ring-2 ring-error focus:ring-error',
              className
            )}
            ref={ref}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? 'error-message' : helperText ? 'helper-text' : undefined
            }
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary hover:text-white transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
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

Input.displayName = 'Input';
