import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-[0.12em]',
  {
    variants: {
      variant: {
        primary: 'bg-white text-black hover:bg-gray-100',
        secondary: 'bg-[#F6D99F] text-black hover:opacity-90',
        ghost: 'bg-transparent text-white border border-white hover:bg-white/10',
        destructive: 'bg-[rgba(255,255,255,0.5)] text-white hover:opacity-90',
      },
      size: {
        small: 'px-4 py-2 text-sm h-8',
        medium: 'px-6 py-3 text-sm h-11',
        large: 'px-8 py-4 text-base h-14',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'small',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, fullWidth, ...props }, ref) => {
    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
