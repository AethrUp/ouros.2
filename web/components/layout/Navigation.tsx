'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  User,
  BookOpen,
  Users,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: <Home className="w-6 h-6" />,
  },
  {
    label: 'Oracle',
    href: '/oracle',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    label: 'Chart',
    href: '/chart',
    icon: <Star className="w-6 h-6" />,
  },
  {
    label: 'Journal',
    href: '/journal',
    icon: <BookOpen className="w-6 h-6" />,
  },
  {
    label: 'Friends',
    href: '/friends',
    icon: <Users className="w-6 h-6" />,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: <User className="w-6 h-6" />,
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
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                'hover:bg-background-secondary',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-white'
              )}
            >
              {item.icon}
              <span className="text-base">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-2 text-xs font-bold text-white bg-primary rounded-full">
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
                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] transition-colors',
                isActive(item.href) ? 'text-primary' : 'text-secondary'
              )}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-xs font-bold text-white bg-error rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
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
