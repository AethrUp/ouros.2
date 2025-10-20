# Astrology App - State Management & Data Flow

## STATE ARCHITECTURE OVERVIEW

### State Organization Principles
1. **Single Source of Truth**: Each piece of data has one authoritative location
2. **Minimal Global State**: Only shared data lives globally
3. **Local State for UI**: Component-specific state stays in components
4. **Immutable Updates**: Always create new objects, never mutate existing
5. **Predictable Flow**: Data flows down, events flow up

### State Layer Hierarchy
```
Global State (Redux/Zustand)
    ↓
Screen State (useState/useReducer)
    ↓
Component State (local useState)
    ↓
Derived State (computed from above)
```

---

## GLOBAL STATE STRUCTURE

### Core State Slices
```typescript
interface AppState {
  auth: AuthState;
  user: UserState;
  charts: ChartState;
  readings: ReadingState;
  divination: DivinationState;
  content: ContentState;
  images: ImageState;
  journal: JournalState;
  social: SocialState;
  app: AppState;
}
```

### 1. Authentication State
```typescript
interface AuthState {
  // Authentication status
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // User session
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
}

// Used by: LoginScreen, all authenticated screens
// Updated by: login/logout handlers
// Persisted: Yes (tokens in secure storage)
```

### 2. User Profile State
```typescript
interface UserState {
  // Profile data
  profile: UserProfile | null;
  birthData: BirthData | null;
  preferences: UserPreferences;
  
  // Loading states
  isLoadingProfile: boolean;
  isSavingProfile: boolean;
  profileError: string | null;
  
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateBirthData: (birthData: BirthData) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  timezone: string;
  language: string;
  createdAt: string;
}

interface UserPreferences {
  // Reading preferences
  interpretationStyle: 'mystical' | 'psychological' | 'practical';
  detailLevel: 'brief' | 'detailed' | 'comprehensive';
  focusAreas: string[];
  
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  selectedDeck: string;
  houseSystem: 'placidus' | 'whole-sign' | 'equal';
  
  // Notification preferences
  dailyHoroscope: boolean;
  readingReminders: boolean;
  journalPrompts: boolean;
}

// Used by: ProfileScreen, all reading components (for personalization)
// Updated by: onboarding, settings, reading preferences
// Persisted: Yes (profile in database, preferences locally)
```

### 3. Chart & Astrology State
```typescript
interface ChartState {
  // Current chart data
  natalChart: NatalChartData | null;
  currentTransits: TransitData | null;
  
  // Chart calculation state
  isCalculating: boolean;
  calculationError: string | null;
  lastCalculated: number | null;
  
  // Chart display preferences
  selectedPlanet: string | null;
  selectedHouse: number | null;
  selectedAspect: string | null;
  aspectFilter: AspectType[];
  showTransits: boolean;
  
  // Actions
  generateChart: (birthData: BirthData) => Promise<void>;
  updateTransits: () => Promise<void>;
  selectPlanet: (planet: string | null) => void;
  selectHouse: (house: number | null) => void;
  toggleAspectFilter: (aspectType: AspectType) => void;
}

// Used by: NatalChartScreen, ChartWheel, AspectGrid, PlanetaryPositions
// Updated by: chart generation, user interactions
// Persisted: Partially (chart data cached, preferences saved)
```

### 4. Reading History State
```typescript
interface ReadingState {
  // Reading history
  readings: ReadingData[];
  favoriteReadings: string[];
  
  // Current daily reading
  dailyHoroscope: HoroscopeData | null;
  lastHoroscopeDate: string | null;
  
  // Loading states
  isLoadingHistory: boolean;
  isLoadingDailyReading: boolean;
  historyError: string | null;
  
  // Pagination
  hasMoreReadings: boolean;
  lastReadingId: string | null;
  
  // Actions
  addReading: (reading: ReadingData) => void;
  toggleFavorite: (readingId: string) => void;
  deleteReading: (readingId: string) => Promise<void>;
  loadMoreReadings: () => Promise<void>;
  loadDailyHoroscope: () => Promise<void>;
}

// Used by: HistoryScreen, HomeScreen, all reading displays
// Updated by: completing readings, user interactions
// Persisted: Yes (database + local cache)
```

### 5. Divination Session State
```typescript
interface DivinationState {
  // Current session
  currentSession: DivinationSession | null;
  sessionType: 'tarot' | 'iching' | null;
  
  // Session flow
  step: 'intention' | 'quantum' | 'divination' | 'interpretation' | 'complete';
  intention: string;
  quantumNumbers: number[];
  
  // Tarot specific
  selectedSpread: SpreadLayout | null;
  selectedCards: TarotCardData[];
  cardPositions: Record<string, number>;
  revealedCards: boolean[];
  
  // I Ching specific
  hexagram: HexagramData | null;
  changingLines: number[];
  castingMethod: 'coins' | 'yarrow';
  
  // AI interpretation
  aiInterpretation: string | null;
  isGeneratingAI: boolean;
  
  // Actions
  startSession: (type: 'tarot' | 'iching') => void;
  setIntention: (intention: string) => void;
  setQuantumNumbers: (numbers: number[]) => void;
  selectSpread: (spread: SpreadLayout) => void;
  drawCard: (position: string) => void;
  castHexagram: () => void;
  generateInterpretation: () => Promise<void>;
  saveReading: () => Promise<void>;
  clearSession: () => void;
}

interface DivinationSession {
  id: string;
  type: 'tarot' | 'iching';
  startedAt: number;
  intention: string;
  quantumNumbers: number[];
}

// Used by: TarotScreen, ICHingScreen, divination components
// Updated by: divination flow actions
// Persisted: No (session state only)
```

### 6. Content Library State
```typescript
interface ContentState {
  // Library data
  tarotLibrary: TarotCard[];
  hexagramLibrary: Hexagram[];
  astrologyContent: AstrologyContent;
  availableDecks: TarotDeck[];
  
  // Loading states
  isLoadingContent: boolean;
  contentError: string | null;
  contentVersion: string;
  lastUpdated: number | null;
  
  // Actions
  loadContent: () => Promise<void>;
  updateContent: () => Promise<void>;
  validateContent: () => boolean;
}

// Used by: All divination components, chart components
// Updated by: app initialization, content updates
// Persisted: Yes (local cache for offline access)
```

### 7. Image Asset State
```typescript
interface ImageState {
  // Deck management
  selectedDeck: string;
  availableDecks: TarotDeck[];
  downloadedDecks: string[];
  
  // Image cache
  imageCache: Map<string, CachedImage>;
  preloadedImages: Set<string>;
  
  // Loading states
  isPreloading: boolean;
  downloadProgress: Record<string, number>;
  imageErrors: Map<string, string>;
  
  // Actions
  selectDeck: (deckId: string) => void;
  downloadDeck: (deckId: string) => Promise<void>;
  preloadImages: (cardIds: string[]) => Promise<void>;
  clearImageCache: () => void;
  getCardImage: (cardId: string, resolution: ImageResolution) => string;
}

// Used by: TarotCard, DeckSelector, image components
// Updated by: deck selection, image loading
// Persisted: Yes (image cache and preferences)
```

### 8. Journal State
```typescript
interface JournalState {
  // Journal entries
  entries: JournalEntry[];
  currentEntry: JournalEntry | null;
  
  // Mood tracking
  recentMoods: MoodLog[];
  moodTrends: MoodTrend[];
  
  // Loading states
  isLoadingEntries: boolean;
  isSavingEntry: boolean;
  journalError: string | null;
  
  // Actions
  createEntry: (content: string, linkedReadingId?: string) => Promise<void>;
  updateEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  logMood: (mood: MoodLevel, energy: EnergyLevel) => void;
  loadEntries: (limit?: number) => Promise<void>;
}

// Used by: JournalScreen, JournalEditor, MoodSelector
// Updated by: journal actions, mood logging
// Persisted: Yes (database with local cache)
```

---

## DATA FLOW PATTERNS

### 1. Reading Generation Flow
```
User Input → Component State → Global Action → API Call → Global State → UI Update

Example: Tarot Reading
1. User sets intention in IntentionSetter
   → calls onIntentionSet(intention)
2. Parent screen updates DivinationState.intention
   → triggers setIntention(intention)
3. QuantumGenerator requests random numbers
   → calls handleQuantumGenerate()
4. Random numbers stored in DivinationState.quantumNumbers
5. TarotSpread uses quantum numbers to select cards
   → updates DivinationState.selectedCards
6. AI interpretation generated
   → updates DivinationState.aiInterpretation
7. Reading saved to history
   → adds to ReadingState.readings
```

### 2. Chart Display Flow
```
Birth Data → Chart Calculation → Chart State → Chart Display

1. User enters birth data in BirthDataForm
   → calls onDataChange(birthData)
2. Screen validates and stores in UserState.birthData
3. Chart generation triggered
   → calls generateChart(birthData)
4. ChartState updated with calculation results
5. ChartWheel subscribes to ChartState
   → re-renders with new data
6. User interactions update ChartState selections
   → triggers chart display updates
```

### 3. Offline Sync Flow
```
Local Action → Offline Queue → Online Detection → Sync → State Update

1. User performs action while offline
   → stored in OfflineAction queue
2. Connection restored
   → triggers syncOfflineActions()
3. Actions uploaded to server
   → server responses update global state
4. Conflict resolution if needed
   → merges changes appropriately
```

---

## STATE MANAGEMENT IMPLEMENTATION

### Using Zustand (Recommended)
```typescript
// auth-store.ts
export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  accessToken: null,
  
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(credentials);
      set({
        isAuthenticated: true,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  logout: () => {
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      error: null
    });
  }
}));

// Usage in components
const LoginScreen = () => {
  const { login, isLoading, error } = useAuthStore();
  
  const handleLogin = (credentials) => {
    login(credentials);
  };
  
  return (
    <LoginForm 
      onSubmit={handleLogin}
      isLoading={isLoading}
      error={error}
    />
  );
};
```

### State Persistence Strategy
```typescript
// persist-config.ts
export const persistConfig = {
  // Always persist
  essential: ['auth', 'user', 'content'],
  
  // Persist with expiration
  cached: {
    charts: { ttl: 24 * 60 * 60 * 1000 }, // 24 hours
    readings: { ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days
    images: { ttl: 30 * 24 * 60 * 60 * 1000 } // 30 days
  },
  
  // Never persist (session only)
  session: ['divination', 'app']
};
```

---

## COMPONENT-STATE INTEGRATION

### Screen-Level State Management
```typescript
// TarotScreen.tsx
const TarotScreen = () => {
  // Global state
  const { 
    currentSession, 
    step, 
    startSession, 
    setIntention,
    generateInterpretation 
  } = useDivinationStore();
  
  const { selectedDeck } = useImageStore();
  const { addReading } = useReadingStore();
  
  // Local state for UI
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Derived state
  const canProceed = currentSession?.intention && step === 'intention';
  const isComplete = step === 'complete';
  
  // Event handlers
  const handleIntentionSet = (intention: string) => {
    setIntention(intention);
    setShowIntentionModal(false);
  };
  
  const handleReadingComplete = async () => {
    const reading = await generateInterpretation();
    addReading(reading);
    // Navigate to reading result
  };
  
  return (
    <View>
      {step === 'intention' && (
        <IntentionSetter 
          onIntentionSet={handleIntentionSet}
          readingType="tarot"
        />
      )}
      
      {step === 'divination' && (
        <TarotSpread
          cards={currentSession.selectedCards}
          onSpreadComplete={handleReadingComplete}
          selectedDeck={selectedDeck}
        />
      )}
    </View>
  );
};
```

### Component State Guidelines
```typescript
// When to use local state vs global state

// ✅ Local State - UI concerns only
const [isExpanded, setIsExpanded] = useState(false);
const [selectedTab, setSelectedTab] = useState('overview');
const [showModal, setShowModal] = useState(false);

// ✅ Global State - Shared data
const { readings } = useReadingStore();
const { natalChart } = useChartStore();
const { user } = useUserStore();

// ❌ Don't put UI state globally
// const { selectedTab } = useAppStore(); // Wrong!

// ❌ Don't keep shared data locally  
// const [readings, setReadings] = useState([]); // Wrong!
```

---

## PERFORMANCE OPTIMIZATIONS

### Selective Subscriptions
```typescript
// Only subscribe to specific state slices
const TarotCard = ({ cardId }) => {
  // Only re-render when this specific card's image changes
  const cardImage = useImageStore(
    useCallback(
      (state) => state.getCardImage(cardId, 'standard'),
      [cardId]
    )
  );
  
  return <Image src={cardImage} />;
};
```

### Memoization Strategy
```typescript
// Expensive computations
const ChartWheel = () => {
  const { natalChart, selectedPlanet } = useChartStore();
  
  // Memoize expensive calculations
  const aspectLines = useMemo(() => 
    calculateAspectLines(natalChart.aspects),
    [natalChart.aspects]
  );
  
  const highlightedPlanet = useMemo(() =>
    natalChart.planets.find(p => p.planet === selectedPlanet),
    [natalChart.planets, selectedPlanet]
  );
  
  return (
    <ChartDisplay 
      aspects={aspectLines}
      highlighted={highlightedPlanet}
    />
  );
};
```

### Background State Updates
```typescript
// Update non-critical state in background
const useBackgroundSync = () => {
  const { updateTransits } = useChartStore();
  const { loadDailyHoroscope } = useReadingStore();
  
  useEffect(() => {
    // Update transits every hour
    const transitInterval = setInterval(updateTransits, 60 * 60 * 1000);
    
    // Load daily horoscope at midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
      loadDailyHoroscope();
      setInterval(loadDailyHoroscope, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    
    return () => {
      clearInterval(transitInterval);
    };
  }, []);
};
```

---

## ERROR HANDLING & LOADING STATES

### Consistent Error Patterns
```typescript
// Every async action follows this pattern
const asyncAction = async (payload) => {
  set({ isLoading: true, error: null });
  
  try {
    const result = await apiCall(payload);
    set({ 
      data: result,
      isLoading: false,
      lastUpdated: Date.now()
    });
  } catch (error) {
    set({ 
      error: error.message,
      isLoading: false 
    });
    
    // Log for debugging
    console.error('Action failed:', error);
    
    // Report to error tracking
    errorReporting.captureException(error);
  }
};
```

### Loading State Composition
```typescript
// Combine multiple loading states
const isAppLoading = useAppStore(state => 
  state.auth.isLoading || 
  state.content.isLoadingContent ||
  state.charts.isCalculating
);

// Show appropriate loading UI
if (isAppLoading) {
  return <LoadingSpinner text="Initializing app..." />;
}
```

This state management architecture ensures:
1. **Predictable Data Flow**: Clear patterns for how data moves through the app
2. **Performance**: Only components that need specific data re-render
3. **Maintainability**: Easy to debug and reason about state changes
4. **Offline Support**: Proper caching and sync strategies
5. **Type Safety**: Full TypeScript support for state shape and actions

Ready for **step 4 - creating development tasks**?