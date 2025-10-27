'use client';

import { ReactNode } from 'react';
import { Button } from './Button';
import { Lock } from 'lucide-react';

interface FadedContentProps {
  /**
   * Content to show with blur overlay
   */
  children: ReactNode;

  /**
   * Callback when user clicks to unlock
   */
  onUnlock: () => void;

  /**
   * Maximum height before blurring (in pixels)
   * Default: 250px (roughly 3-4 lines of text)
   */
  maxHeight?: number;

  /**
   * Custom className for container
   */
  className?: string;

  /**
   * Whether this content is locked (if false, shows full content)
   */
  isLocked?: boolean;
}

/**
 * Displays content with a blur overlay and "Unlock to read more" CTA
 * Used for premium sections on free tier
 */
export function FadedContent({
  children,
  onUnlock,
  maxHeight = 250,
  className = '',
  isLocked = true,
}: FadedContentProps) {
  // If not locked, just render children normally
  if (!isLocked) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Content with blur filter applied */}
      <div className="blur-sm pointer-events-none select-none">
        {children}
      </div>

      {/* Semi-transparent overlay to darken the blurred content */}
      <div className="absolute inset-0 bg-background/40 pointer-events-none" />

      {/* Unlock CTA - centered over the content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <div className="bg-card/95 border border-border rounded-lg p-6 text-center max-w-sm mx-4 backdrop-blur-sm">
          <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-primary mb-2">Premium Content</h3>
          <p className="text-sm text-secondary mb-4">
            Upgrade to unlock enhanced horoscope insights
          </p>
          <Button
            onClick={onUnlock}
            variant="primary"
            size="medium"
            className="w-full"
          >
            Unlock Now
          </Button>
        </div>
      </div>
    </div>
  );
}
