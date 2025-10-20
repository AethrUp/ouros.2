# Astrology App - Detailed Component APIs

## COMPONENT API DESIGN PRINCIPLES

### Universal Props Pattern
Every component follows this pattern:
```typescript
interface BaseComponentProps {
  className?: string;           // For styling overrides
  testId?: string;             // For testing
  isLoading?: boolean;         // Loading state
  error?: string;              // Error message to display
  onError?: (error: Error) => void;  // Error callback
}
```

### Data Flow Rules
1. **Props Down, Events Up**: Data flows down via props, changes flow up via callbacks
2. **Single Source of Truth**: Each piece of data has one authoritative source
3. **Immutable Data**: Components never mutate props directly
4. **Clear Interfaces**: Each component has a well-defined API contract

---

## AUTHENTICATION & ONBOARDING COMPONENTS

### LoginScreen
```typescript
interface LoginScreenProps extends BaseComponentProps {
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onForgotPassword: () => void;
  initialEmail?: string;
  isAuthenticating?: boolean;
}
```

### BirthDataForm
```typescript
interface BirthDataFormProps extends BaseComponentProps {
  initialData?: Partial<BirthData>;
  onDataChange: (data: BirthData) => void;
  onSubmit: (data: BirthData) => void;
  onValidationChange: (isValid: boolean) => void;
  requiredFields?: ('date' | 'time' | 'location')[];
  showTimeUnknownOption?: boolean;
}

interface BirthData {
  date: string;                 // ISO date string
  time: string;                 // HH:MM format
  timeUnknown: boolean;
  location: LocationData;
  timezone: string;
}
```

### LocationPicker
```typescript
interface LocationPickerProps extends BaseComponentProps {
  value?: LocationData;
  onLocationSelect: (location: LocationData) => void;
  onLocationError: (error: string) => void;
  placeholder?: string;
  showRecentLocations?: boolean;
  maxSuggestions?: number;
}

interface LocationData {
  name: string;                 // "New York, NY, USA"
  latitude: number;
  longitude: number;
  timezone: string;             // "America/New_York"
  country: string;
  region: string;
}
```

---

## CHART & ASTROLOGY COMPONENTS

### ChartWheel
```typescript
interface ChartWheelProps extends BaseComponentProps {
  chartData: NatalChartData;
  showTransits?: boolean;
  transitData?: TransitData;
  selectedPlanet?: string;
  selectedHouse?: number;
  onPlanetSelect: (planet: string) => void;
  onHouseSelect: (house: number) => void;
  onAspectSelect: (aspect: AspectData) => void;
  interactionMode?: 'view' | 'explore' | 'compare';
  size?: 'small' | 'medium' | 'large';
}

interface NatalChartData {
  planets: PlanetPosition[];
  houses: HousePosition[];
  aspects: AspectData[];
  chartMetadata: ChartMetadata;
}

interface PlanetPosition {
  planet: string;               // "sun", "moon", etc.
  sign: string;                 // "aries", "taurus", etc.
  degree: number;               // 0-359.99
  house: number;                // 1-12
  retrograde: boolean;
}
```

### AspectGrid
```typescript
interface AspectGridProps extends BaseComponentProps {
  aspects: AspectData[];
  selectedAspect?: string;
  onAspectSelect: (aspectId: string) => void;
  showOrbs?: boolean;
  filterByType?: AspectType[];
  sortBy?: 'strength' | 'type' | 'planets';
}

interface AspectData {
  id: string;
  planet1: string;
  planet2: string;
  type: AspectType;             // "conjunction", "trine", etc.
  orb: number;                  // Degrees difference from exact
  strength: number;             // 0-1, calculated strength
  applying: boolean;            // Is aspect getting closer?
}
```

### PlanetaryPositions
```typescript
interface PlanetaryPositionsProps extends BaseComponentProps {
  planets: PlanetPosition[];
  selectedPlanet?: string;
  onPlanetSelect: (planet: string) => void;
  showDegrees?: boolean;
  showHouses?: boolean;
  groupBy?: 'element' | 'modality' | 'house' | 'none';
  format?: 'list' | 'table' | 'cards';
}
```

---

## DIVINATION COMPONENTS

### IntentionSetter
```typescript
interface IntentionSetterProps extends BaseComponentProps {
  onIntentionSet: (intention: string) => void;
  onSkip?: () => void;
  maxLength?: number;
  placeholder?: string;
  readingType: 'tarot' | 'iching';
  showGuidance?: boolean;
  previousIntentions?: string[];
}
```

### QuantumGenerator
```typescript
interface QuantumGeneratorProps extends BaseComponentProps {
  isGenerating: boolean;
  onComplete: (numbers: number[]) => void;
  onError: (error: QuantumError) => void;
  numbersNeeded: number;
  showVisualization?: boolean;
  fallbackToRandom?: boolean;
}

interface QuantumError {
  type: 'network' | 'quota' | 'service';
  message: string;
  canRetry: boolean;
}
```

### TarotCard
```typescript
interface TarotCardProps extends BaseComponentProps {
  card: TarotCardData;
  position?: string;            // "past", "present", "future", etc.
  isRevealed?: boolean;
  isSelected?: boolean;
  orientation?: 'upright' | 'reversed';
  size?: 'thumbnail' | 'small' | 'medium' | 'large';
  deck?: string;                // Deck ID to use
  onCardClick?: (card: TarotCardData) => void;
  onImageLoad?: () => void;
  onImageError?: (error: Error) => void;
  showMeaning?: boolean;
  animationDelay?: number;
}

interface TarotCardData {
  id: string;
  name: string;
  number: number;
  suit: string;
  keywords: string[];
  uprightMeaning: string;
  reversedMeaning: string;
  images: Record<string, TarotImageAsset>;
}
```

### TarotSpread
```typescript
interface TarotSpreadProps extends BaseComponentProps {
  spread: SpreadLayout;
  cards: TarotCardData[];
  positions: SpreadPosition[];
  onCardSelect: (cardIndex: number, position: string) => void;
  onSpreadComplete: () => void;
  revealCards?: boolean;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  selectedDeck: string;
}

interface SpreadLayout {
  id: string;                   // "celtic-cross", "three-card", etc.
  name: string;
  description: string;
  positions: SpreadPosition[];
  cardsNeeded: number;
}

interface SpreadPosition {
  id: string;
  name: string;                 // "Past", "Present", "Future"
  description: string;
  x: number;                    // Position coordinates (0-1)
  y: number;
  rotation?: number;            // Card rotation in degrees
}
```

### HexagramDisplay
```typescript
interface HexagramDisplayProps extends BaseComponentProps {
  hexagram: HexagramData;
  showLines?: boolean;
  showBinary?: boolean;
  showTrigrams?: boolean;
  onLineSelect?: (lineNumber: number) => void;
  selectedLines?: number[];
  animateFormation?: boolean;
  size?: 'small' | 'medium' | 'large';
}

interface HexagramData {
  number: number;               // 1-64
  name: string;
  chineseName: string;
  trigrams: { upper: string; lower: string };
  binaryCode: string;           // "111111"
  lines: HexagramLine[];
  changingLines?: number[];
}

interface HexagramLine {
  position: number;             // 1-6 (bottom to top)
  type: 'broken' | 'solid';
  changing: boolean;
  meaning: string;
}
```

---

## READING & INTERPRETATION COMPONENTS

### ReadingCard
```typescript
interface ReadingCardProps extends BaseComponentProps {
  reading: ReadingData;
  onSave?: (reading: ReadingData) => void;
  onShare?: (reading: ReadingData) => void;
  onJournal?: (reading: ReadingData) => void;
  onDelete?: (readingId: string) => void;
  showActions?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  layout?: 'compact' | 'detailed' | 'preview';
}

interface ReadingData {
  id: string;
  type: 'tarot' | 'iching' | 'horoscope' | 'synastry';
  timestamp: string;
  intention?: string;
  interpretation: string;
  metadata: ReadingMetadata;
  isFavorite: boolean;
  tags: string[];
}

interface ReadingMetadata {
  // Tarot specific
  cards?: TarotCardData[];
  spread?: string;
  
  // I Ching specific
  hexagram?: number;
  changingLines?: number[];
  
  // Horoscope specific
  transitDate?: string;
  focusArea?: string;
  
  // Synastry specific
  partner?: string;
  compatibilityScore?: number;
}
```

### InterpretationText
```typescript
interface InterpretationTextProps extends BaseComponentProps {
  text: string;
  source: 'ai' | 'static' | 'cached';
  isGenerating?: boolean;
  onRegenerate?: () => void;
  onSave?: (text: string) => void;
  allowRegeneration?: boolean;
  highlightKeywords?: boolean;
  readingLevel?: 'brief' | 'detailed' | 'comprehensive';
  maxLength?: number;
}
```

---

## JOURNAL & HISTORY COMPONENTS

### JournalEditor
```typescript
interface JournalEditorProps extends BaseComponentProps {
  initialContent?: string;
  onContentChange: (content: string) => void;
  onSave: (entry: JournalEntry) => void;
  onCancel?: () => void;
  linkedReading?: ReadingData;
  showMoodSelector?: boolean;
  showTagEditor?: boolean;
  autoSave?: boolean;
  placeholder?: string;
}

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  mood?: MoodLevel;
  energy?: EnergyLevel;
  tags: string[];
  linkedReadingId?: string;
  isPrivate: boolean;
}
```

### MoodSelector
```typescript
interface MoodSelectorProps extends BaseComponentProps {
  mood?: MoodLevel;
  energy?: EnergyLevel;
  onMoodChange: (mood: MoodLevel) => void;
  onEnergyChange: (energy: EnergyLevel) => void;
  showLabels?: boolean;
  allowNeutral?: boolean;
  layout?: 'horizontal' | 'vertical' | 'grid';
}

type MoodLevel = 1 | 2 | 3 | 4 | 5;  // 1=low, 5=high
type EnergyLevel = 1 | 2 | 3 | 4 | 5;
```

### HistoryList
```typescript
interface HistoryListProps extends BaseComponentProps {
  readings: ReadingData[];
  onReadingSelect: (reading: ReadingData) => void;
  onReadingDelete: (readingId: string) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  groupBy?: 'date' | 'type' | 'none';
  sortBy?: 'date' | 'type' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  showFilters?: boolean;
  selectedType?: ReadingType;
}
```

---

## NAVIGATION & LAYOUT COMPONENTS

### TabNavigation
```typescript
interface TabNavigationProps extends BaseComponentProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: TabConfig[];
  showBadges?: boolean;
  badgeCounts?: Record<string, number>;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;                 // Icon name or component
  disabled?: boolean;
  badge?: number;
}
```

### HeaderBar
```typescript
interface HeaderBarProps extends BaseComponentProps {
  title: string;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
  showSync?: boolean;
  syncStatus?: 'idle' | 'syncing' | 'error';
  onSyncPress?: () => void;
  backgroundColor?: string;
}

interface HeaderAction {
  icon: string;
  label?: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: number;
}
```

### LoadingSpinner
```typescript
interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;            // Cover entire screen
  progress?: number;            // 0-1 for progress indication
}
```

---

## FORM & INPUT COMPONENTS

### Button
```typescript
interface ButtonProps extends BaseComponentProps {
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
```

### SearchBar
```typescript
interface SearchBarProps extends BaseComponentProps {
  value: string;
  onValueChange: (text: string) => void;
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  showHistory?: boolean;
  searchHistory?: string[];
}
```

---

## IMAGE & ASSET COMPONENTS

### ImageAssetManager
```typescript
interface ImageAssetManagerProps extends BaseComponentProps {
  children: (imageManager: ImageManager) => React.ReactNode;
  selectedDeck: string;
  preloadPriority?: 'essential' | 'standard' | 'extended';
  onLoadingChange?: (isLoading: boolean) => void;
  onError?: (error: ImageError) => void;
}

interface ImageManager {
  getCardImage: (cardId: string, resolution?: ImageResolution) => string;
  preloadImages: (cardIds: string[]) => Promise<void>;
  getCacheStatus: () => CacheStatus;
  clearCache: () => void;
  downloadDeck: (deckId: string) => Promise<void>;
}
```

### DeckSelector
```typescript
interface DeckSelectorProps extends BaseComponentProps {
  availableDecks: TarotDeck[];
  selectedDeck: string;
  onDeckChange: (deckId: string) => void;
  onDeckDownload?: (deckId: string) => void;
  showDownloadProgress?: boolean;
  downloadProgress?: Record<string, number>;
  layout?: 'grid' | 'list' | 'carousel';
}
```

---

## COMPONENT COMMUNICATION PATTERNS

### Event Bubbling Pattern
```typescript
// Child component emits specific events
<TarotCard 
  onCardClick={(card) => handleCardSelect(card)}
  onImageError={(error) => handleImageError(card.id, error)}
/>

// Parent handles and potentially bubbles up
const handleCardSelect = (card: TarotCardData) => {
  setSelectedCard(card);
  onReadingUpdate?.(card);  // Bubble to grandparent
}
```

### State Lifting Pattern
```typescript
// State lives in parent, passed down as props
<TarotSpread
  cards={selectedCards}
  positions={spreadPositions}
  onCardSelect={handleCardSelect}
  revealCards={isReadingComplete}
/>
```

### Provider Pattern for Complex State
```typescript
<ReadingProvider>
  <IntentionSetter onIntentionSet={setIntention} />
  <QuantumGenerator onComplete={generateReading} />
  <TarotSpread cards={cards} onComplete={completeReading} />
  <InterpretationText reading={reading} />
</ReadingProvider>
```

---

## TESTING INTERFACES

### Test Props
Every component includes testId props for reliable testing:
```typescript
<TarotCard 
  testId="tarot-card-fool"
  card={foolCard}
  onCardClick={handleClick}
/>

// Test can reliably find element
const card = screen.getByTestId('tarot-card-fool');
```

### Mock Data Factories
```typescript
export const createMockTarotCard = (overrides?: Partial<TarotCardData>): TarotCardData => ({
  id: 'fool',
  name: 'The Fool',
  number: 0,
  suit: 'major',
  keywords: ['beginnings', 'innocence'],
  uprightMeaning: 'New beginnings...',
  reversedMeaning: 'Recklessness...',
  images: createMockImageAssets(),
  ...overrides
});
```

This component API structure ensures that:
1. **Every component has a clear, predictable interface**
2. **Data flows in one direction (down via props)**
3. **Events flow up via callbacks**
4. **Components are testable and mockable**
5. **TypeScript provides compile-time safety**
6. **Components can be built and tested independently**

Ready for **step 3 - mapping out state management**?