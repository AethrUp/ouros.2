'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { cn } from '@/lib/utils';

type SyncStatus = 'idle' | 'syncing' | 'error';

interface HeaderAction {
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  badge?: number;
  label: string;
}

export interface HeaderProps {
  title?: string;
  showProfile?: boolean;
  showBack?: boolean;
  leftAction?: {
    icon?: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    label: string;
  };
  rightActions?: HeaderAction[];
  showSync?: boolean;
  syncStatus?: SyncStatus;
  onSyncPress?: () => void;
  className?: string;
}

const getSyncIcon = (status: SyncStatus) => {
  switch (status) {
    case 'syncing':
      return <Cloud className="w-5 h-5 animate-pulse" />;
    case 'error':
      return <AlertCircle className="w-5 h-5" />;
    default:
      return <CloudOff className="w-5 h-5" />;
  }
};

const getSyncColor = (status: SyncStatus) => {
  switch (status) {
    case 'syncing':
      return 'text-primary';
    case 'error':
      return 'text-error';
    default:
      return 'text-success';
  }
};

export const Header: React.FC<HeaderProps> = ({
  title = 'Ouros',
  showProfile = true,
  showBack = false,
  leftAction,
  rightActions = [],
  showSync = false,
  syncStatus = 'idle',
  onSyncPress,
  className,
}) => {
  const router = useRouter();
  const { user, logout } = useAppStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-border bg-card shadow-sm',
        className
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        {/* Left Section */}
        <div className="flex items-center gap-2 min-w-0">
          {(showBack || leftAction) && (
            <button
              onClick={leftAction?.onClick || (() => router.back())}
              disabled={leftAction?.disabled}
              className={cn(
                'p-2 rounded-lg transition-colors',
                'hover:bg-background-secondary active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={leftAction?.label || 'Go back'}
            >
              {leftAction?.icon || <ArrowLeft className="w-6 h-6" />}
            </button>
          )}

          <Link href="/dashboard">
            <h1 className="text-xl font-serif text-white truncate hover:text-primary transition-colors cursor-pointer">
              {title}
            </h1>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {showSync && onSyncPress && (
            <button
              onClick={onSyncPress}
              className={cn(
                'p-2 rounded-lg transition-colors hover:bg-background-secondary',
                getSyncColor(syncStatus)
              )}
              aria-label={`Sync status: ${syncStatus}`}
            >
              {getSyncIcon(syncStatus)}
            </button>
          )}

          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                'relative p-2 rounded-lg transition-colors',
                'hover:bg-background-secondary active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              aria-label={action.label}
            >
              {action.icon}
              {action.badge !== undefined && action.badge > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-error rounded-full">
                  {action.badge > 99 ? '99+' : action.badge}
                </span>
              )}
            </button>
          ))}

          {showProfile && user && (
            <>
              <span className="text-sm text-secondary hidden sm:inline truncate max-w-[150px]">
                {user.email}
              </span>
              <Link
                href="/profile"
                className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                aria-label="Profile"
              >
                <User className="w-6 h-6" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
