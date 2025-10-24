'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(
        (shortcut) =>
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          (shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey) &&
          (shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey) &&
          (shortcut.altKey === undefined || shortcut.altKey === event.altKey) &&
          (shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey)
      );

      if (matchingShortcut) {
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }

        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

/**
 * Global keyboard shortcuts for navigation
 * Usage: Call this hook in your main layout or app component
 */
export const useGlobalKeyboardShortcuts = () => {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'h',
      description: 'Go to Home/Dashboard',
      action: () => router.push('/dashboard'),
    },
    {
      key: 'o',
      description: 'Go to Oracle',
      action: () => router.push('/oracle'),
    },
    {
      key: 'c',
      description: 'Go to Chart',
      action: () => router.push('/chart'),
    },
    {
      key: 'j',
      description: 'Go to Journal',
      action: () => router.push('/journal'),
    },
    {
      key: 'p',
      description: 'Go to Profile',
      action: () => router.push('/profile'),
    },
    {
      key: 'f',
      description: 'Go to Friends',
      action: () => router.push('/friends'),
    },
    {
      key: '/',
      description: 'Focus search (if available)',
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
    },
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts help',
      action: () => {
        // This can be connected to a help modal later
        console.log('Keyboard shortcuts help requested');
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
};

/**
 * Hook for modal keyboard interactions
 * Handles Escape, Enter, and Tab navigation within modals
 */
export const useModalKeyboardNav = (
  isOpen: boolean,
  onClose: () => void,
  onConfirm?: () => void,
  options: {
    closeOnEscape?: boolean;
    confirmOnEnter?: boolean;
  } = {}
) => {
  const { closeOnEscape = true, confirmOnEnter = false } = options;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.preventDefault();
        onClose();
      }

      if (event.key === 'Enter' && confirmOnEnter && onConfirm) {
        const target = event.target as HTMLElement;
        // Don't trigger if user is in a textarea
        if (target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          onConfirm();
        }
      }

      // Trap focus within modal
      if (event.key === 'Tab') {
        const modal = document.querySelector('[role="dialog"]');
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, onConfirm, closeOnEscape, confirmOnEnter]);
};
