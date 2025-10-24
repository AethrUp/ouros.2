// Base Component Props
export interface BaseComponentProps {
  className?: string;
  testId?: string;
  isLoading?: boolean;
  error?: string;
  onError?: (error: Error) => void;
}

// Navigation Types
export interface NavigationProps {
  navigation: any;
  route: any;
}

// Tab Config
export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  disabled?: boolean;
  badge?: number;
}

// Tab Navigation Props
export interface TabNavigationProps extends BaseComponentProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: TabConfig[];
  showBadges?: boolean;
  badgeCounts?: Record<string, number>;
}

// Header Action
export interface HeaderAction {
  icon: string;
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: number;
}

// Header Bar Props
export interface HeaderBarProps extends BaseComponentProps {
  title: string;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
  showSync?: boolean;
  syncStatus?: 'idle' | 'syncing' | 'error';
  onSyncPress?: () => void;
  backgroundColor?: string;
}

// Button Props
export interface ButtonProps extends BaseComponentProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

// Export all types - explicit exports to avoid conflicts
export * from './auth';
export * from './user';
export * from './chart';
export * from './reading';
export * from './tarot';
export * from './dream';
export * from './journal';

// Export synastry types but exclude duplicates (TransitData, AspectData already in chart.ts)
export type {
  SynastryChart,
  SynastryReading,
  DailySynastryForecast,
  DailySynastryForecastContent,
  DailySynastryForecastContentV2,
  FriendConnection,
  SavedChart,
  Connection,
  ConnectionInvitation,
  ConnectionStatus,
  SynastryPartner,
  SynastryAspectCategory,
  RelationshipType,
  CompatibilityRating,
} from './synastry';
