'use client';

import { Header } from './Header';
import { Navigation } from './Navigation';
import { EmailVerificationBanner } from './EmailVerificationBanner';

export interface MainLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  showProfile?: boolean;
  showBack?: boolean;
  showNavigation?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  headerTitle,
  showProfile = true,
  showBack = false,
  showNavigation = true,
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <EmailVerificationBanner />
      <Header title={headerTitle} showProfile={showProfile} showBack={showBack} />

      <div className="flex flex-1">
        {showNavigation && <Navigation />}

        <main className={`flex-1 min-w-0 ${showNavigation ? 'lg:ml-64' : ''} pb-20 lg:pb-0`}>
          {children}
        </main>
      </div>
    </div>
  );
};
