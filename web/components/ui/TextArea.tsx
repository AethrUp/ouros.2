'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      resize = 'vertical',
      disabled,
      ...props
    },
    ref
  ) => {
    const resizeClass = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    }[resize];

    return (
      <div className="w-full">
        <textarea
          ref={ref}
          placeholder={label}
          className={cn(
            'flex min-h-[120px] w-full rounded-lg px-5 py-4',
            'text-base text-white placeholder:text-white/50 placeholder:uppercase placeholder:tracking-wide placeholder:text-sm',
            'bg-[#141414]',
            'border-0',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200',
            error && 'ring-2 ring-error focus:ring-error',
            resizeClass,
            className
          )}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? 'error-message' : helperText ? 'helper-text' : undefined
          }
          {...props}
        />
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

TextArea.displayName = 'TextArea';
