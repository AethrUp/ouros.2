'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'HOME',
    href: '/dashboard',
  },
  {
    label: 'ORACLE',
    href: '/oracle',
  },
  {
    label: 'CHART',
    href: '/chart',
  },
  {
    label: 'JOURNAL',
    href: '/journal',
  },
  {
    label: 'FRIENDS',
    href: '/friends',
  },
  {
    label: 'PROFILE',
    href: '/profile',
  },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-border lg:bg-card lg:pt-20">
        <nav className="flex-1 px-4 py-6 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 transition-all border-b-2',
                'hover:border-white',
                isActive(item.href)
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50'
              )}
            >
              <span className="text-base" style={{ letterSpacing: '0.15em' }}>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-2 text-xs text-white bg-primary rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 min-w-[60px] transition-all border-b-2',
                'hover:border-white',
                isActive(item.href)
                  ? 'border-white text-white'
                  : 'border-transparent text-white/50'
              )}
            >
              <span className="text-xs" style={{ letterSpacing: '0.15em' }}>
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-xs text-white bg-error rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

// Content wrapper that accounts for navigation spacing
export const NavigationContentWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'min-h-screen',
        'pb-20 lg:pb-0', // Bottom padding for mobile nav
        'lg:pl-64', // Left padding for desktop sidebar
        className
      )}
    >
      {children}
    </div>
  );
};
