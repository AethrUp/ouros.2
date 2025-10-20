# Astrology App - Development Architecture & Task Breakdown

## 1. SCREENS (Top-Level User Experiences)

### Authentication Flow
- **`LoginScreen`** - User authentication and registration
- **`OnboardingScreen`** - Birth data collection and app setup
- **`ForgotPasswordScreen`** - Password recovery flow

### Core App Screens
- **`HomeScreen`** - Dashboard with today's insights and quick actions
- **`NatalChartScreen`** - Interactive birth chart display and interpretation
- **`DailyHoroscopeScreen`** - Personalized daily readings
- **`SynastryScreen`** - Relationship compatibility analysis
- **`TarotScreen`** - Tarot card reading interface
- **`ICHingScreen`** - I Ching consultation interface
- **`JournalScreen`** - Personal reflection and logging
- **`HistoryScreen`** - Past readings and insights archive
- **`ProfileScreen`** - User settings and account management

### Secondary Screens
- **`ConnectionsScreen`** - Manage synastry partners
- **`SettingsScreen`** - App preferences and configuration
- **`PremiumScreen`** - Subscription and upgrade options

## TAROT IMAGE MANAGEMENT ARCHITECTURE

### Image Storage Strategy
**Multiple Resolution Support:**
```javascript
TarotImageAsset: {
  cardId: string,                // "fool", "magician", etc.
  deckId: string,                // "rider-waite", "thoth", "modern"
  images: {
    thumbnail: string,           // 100x180px for lists/history
    standard: string,            // 300x540px for normal display  
    highRes: string,             // 600x1080px for detailed view
    placeholder: string          // Low-quality placeholder/loading state
  },
  fileSize: {
    thumbnail: number,           // KB size for preloading decisions
    standard: number,
    highRes: number
  },
  priority: number               // Loading priority (Major Arcana = high)
}
```

### Deck Management System
```javascript
TarotDeck: {
  id: string,                    // "rider-waite-classic"
  name: string,                  // "Rider-Waite Classic"
  artist: string,                // "Pamela Colman Smith"
  description: string,           // Deck description
  cardBacks: string,             // Card back image URL
  style: string,                 // "traditional", "modern", "artistic"
  isPremium: boolean,            // Requires subscription
  totalSize: number,             // Total download size
  imageManifest: TarotImageAsset[]
}
```

### Image Caching Strategy
**Priority-Based Loading:**
1. **Essential Cache (Always Local)**: Card backs + Major Arcana thumbnails
2. **Standard Cache**: Full Major Arcana + Court Cards at standard resolution  
3. **Extended Cache**: All cards at standard resolution
4. **High-Res Cache**: Downloaded on-demand for detailed viewing

**Storage Allocation:**
- **Essential**: ~5MB (card backs + 22 thumbnails)
- **Standard**: ~25MB (Major + Court at standard res)
- **Extended**: ~80MB (all 78 cards at standard res)
- **High-Res**: ~200MB (full deck at high resolution)

### Image Loading Flow
```javascript
ImageLoadingFlow: {
  1. App Launch → Load essential cache (card backs, Major Arcana thumbs)
  2. Deck Selection → Preload selected deck's standard images
  3. Card Display → Load standard resolution immediately
  4. User Zoom/Detail → Load high-resolution on demand
  5. Background → Preload likely next cards based on spread type
  6. Offline → Use cached images with graceful fallbacks
}
```

### Offline Image Strategy
**Critical Images (Always Cached):**
- All card backs for deck switching
- Major Arcana thumbnails for all available decks
- Default deck full images at standard resolution
- Placeholder/loading state images

**Smart Preloading:**
- Detect user's preferred deck and cache fully
- Background download during idle time
- Preload spread-specific cards (e.g., Celtic Cross positions)
- Cache recently viewed high-res images

### Image Optimization
**Responsive Loading:**
```javascript
ImageOptimizationRules: {
  // Connection-based quality
  "wifi": "highRes",
  "cellular-fast": "standard", 
  "cellular-slow": "thumbnail",
  "offline": "cached",
  
  // Device-based sizing
  "phone": { maxWidth: 300, quality: 85 },
  "tablet": { maxWidth: 500, quality: 90 },
  "desktop": { maxWidth: 600, quality: 95 },
  
  // Context-based loading
  "cardList": "thumbnail",
  "singleCard": "standard",
  "detailView": "highRes",
  "background": "lowPriority"
}
```

### Multiple Deck Support
**Deck Switching Flow:**
1. User selects new deck from DeckSelector
2. Check if deck images are cached locally
3. If not cached, show download progress
4. Background download with user consent
5. Switch deck once essential images loaded
6. Continue background download of full deck

**Deck Storage Structure:**
```
assets/
├── tarot/
│   ├── rider-waite/
│   │   ├── thumbnails/        # 100x180 versions
│   │   ├── standard/          # 300x540 versions  
│   │   ├── high-res/          # 600x1080 versions
│   │   └── manifest.json      # Image metadata
│   ├── thoth/
│   │   └── [same structure]
│   └── modern-witch/
│       └── [same structure]
├── placeholders/
│   ├── card-loading.png
│   ├── card-error.png
│   └── deck-preview.png
└── ui/
    ├── card-frames/
    └── spread-layouts/
```

### Image Error Handling
**Fallback Hierarchy:**
1. **Primary**: Requested image (deck-specific, resolution-specific)
2. **Fallback 1**: Lower resolution of same card from same deck
3. **Fallback 2**: Same card from default deck
4. **Fallback 3**: Generic placeholder with card name overlay
5. **Fallback 4**: Solid color card with text-only display

### Performance Optimization
**Memory Management:**
- Unload high-res images when not in view
- Implement LRU cache for image storage
- Compress images using WebP with JPEG fallback
- Use progressive JPEG for smooth loading experience

**Network Optimization:**
- CDN distribution for global image delivery
- Image sprites for small assets (thumbnails)
- HTTP/2 server push for predicted next images
- Lazy loading with intersection observer

---

## CONTENT LIBRARY & AI ARCHITECTURE

### Updated Tarot Card Library Structure
```javascript
TarotCard: {
  id: string,                    // "fool", "magician", etc.
  name: string,                  // "The Fool"
  number: number,                // 0-78
  suit: string,                  // "major", "wands", "cups", etc.
  uprightMeaning: string,        // Basic upright interpretation
  reversedMeaning: string,       // Basic reversed interpretation
  keywords: string[],            // ["beginnings", "innocence", "faith"]
  imagery: string,               // Description of card imagery
  element: string,               // "air", "fire", "water", "earth"
  astrology: string,             // Associated astrological correspondences
  numerology: string,            // Numerical significance
  
  // Image management
  images: {
    [deckId: string]: TarotImageAsset
  },
  defaultDeck: string,           // Fallback deck if user's choice unavailable
  priority: number               // Loading priority (Major Arcana higher)
}
```

### I Ching Hexagram Library Structure
```javascript
Hexagram: {
  number: number,                // 1-64
  name: string,                  // "The Creative"
  chineseName: string,           // "乾"
  trigrams: {
    upper: string,               // "heaven"
    lower: string                // "heaven"
  },
  binaryCode: string,            // "111111"
  judgment: string,              // Classical judgment text
  image: string,                 // Classical image text
  interpretation: string,        // Modern interpretation
  lines: HexagramLine[],         // Individual line meanings
  keywords: string[],            // Key concepts
  advice: string,                // Practical guidance
  warning: string                // Potential pitfalls
}
```

### AI Personalization Context
```javascript
PersonalizationContext: {
  userProfile: {
    birthData: BirthData,
    currentTransits: TransitData,
    recentMoods: MoodLog[],
    journalThemes: string[]
  },
  readingContext: {
    intention: string,
    readingType: "tarot" | "iching" | "horoscope",
    previousReadings: Reading[],
    timeOfDay: string,
    seasonalContext: string
  },
  preferences: {
    interpretationStyle: "mystical" | "psychological" | "practical",
    detailLevel: "brief" | "detailed" | "comprehensive",
    focusAreas: string[]        // ["love", "career", "spiritual", etc.]
  }
}
```

### AI Prompt Templates
**Tarot Reading Prompt:**
```
You are an experienced tarot reader providing a personalized interpretation. 

CONTEXT:
- User's intention: {intention}
- Cards drawn: {cardNames}
- Positions: {spreadPositions}
- User profile: {astrologyData}
- Recent mood: {moodContext}
- Interpretation style: {preferredStyle}

CARDS DETAILS:
{cardMeanings}

Please provide a {detailLevel} interpretation that:
1. Addresses the user's specific intention
2. Connects the cards meaningfully to their situation
3. Incorporates their astrological context
4. Matches their preferred interpretation style
5. Offers practical guidance

Focus on: {focusAreas}
```

**I Ching Consultation Prompt:**
```
You are a wise I Ching consultant providing guidance based on ancient wisdom.

CONSULTATION:
- User's question/intention: {intention} 
- Hexagram received: {hexagramName} (#{hexagramNumber})
- Binary sequence: {binaryCode}
- Changing lines: {changingLines}
- User's astrological context: {birthData}
- Current transits affecting them: {currentTransits}

HEXAGRAM DETAILS:
- Judgment: {judgment}
- Image: {image}
- Modern interpretation: {modernMeaning}

Please provide guidance that:
1. Directly addresses their specific question
2. Explains the hexagram's relevance to their situation  
3. Incorporates changing lines if present
4. Considers their astrological influences
5. Offers both spiritual wisdom and practical steps

Style: {interpretationStyle}
Length: {detailLevel}
```

### Content Storage Strategy
**Local Storage (Always Available):**
- Complete tarot card database (essential for offline)
- All 64 I Ching hexagrams (core meanings)
- Basic astrological correspondences
- User's most recent AI interpretations (last 10)

**Remote Storage (Supabase):**
- Extended interpretation content
- Regular content updates and expansions
- User's complete interpretation history
- AI response caching for popular combinations

**AI Integration Points:**
- **Primary**: OpenAI GPT-4 or Claude API for personalized interpretations
- **Fallback**: Pre-written detailed interpretations stored locally
- **Caching**: Store AI responses with context hash to avoid duplicate calls
- **Rate Limiting**: Implement smart caching and user limits

### Content Update Mechanism
```javascript
ContentUpdateFlow: {
  1. Check version on app startup
  2. Download incremental content updates
  3. Validate content integrity
  4. Update local cache
  5. Migrate user data if needed
  6. Notify user of new features
}
```

---

## DIVINATION FLOW ARCHITECTURE

### Quantum-Powered Divination Process
```
1. User enters reading screen (Tarot or I Ching)
2. IntentionSetter component prompts for intention
3. handleIntentionSet validates and stores intention
4. handleQuantumGenerate requests random numbers from quantum API
5. QuantumGenerator shows visual feedback during generation
6. Numbers used for card selection or hexagram generation
7. CardDrawAnimation or CoinCastAnimation visualizes the process
8. Reading interpretation displayed
9. JournalPrompt offers immediate journaling
10. Reading saved to history with intention and timestamp
```

### Quantum Random Integration Points
**API Requirements:**
- Quantum random number service (e.g., ANU Quantum Random API)
- Fallback to cryptographically secure random for offline
- Rate limiting and caching for API efficiency

**Data Flow:**
```javascript
intention → quantumRequest → randomNumbers → cardSelection/hexagramGeneration → interpretation → journal
```

### Tarot Specific Flow
```
TarotScreen → IntentionSetter → QuantumGenerator → CardDrawAnimation → TarotSpread → InterpretationText → JournalPrompt
```

### I Ching Specific Flow  
```
ICHingScreen → IntentionSetter → QuantumGenerator → CoinCastAnimation → HexagramDisplay → InterpretationText → JournalPrompt
```

---

## 2. COMPONENTS (Reusable Visual Building Blocks)

### Chart Components
- **`ChartWheel`** - Interactive natal chart display
- **`AspectGrid`** - Planetary aspect table
- **`PlanetaryPositions`** - List of planetary positions
- **`HouseDetails`** - House-by-house breakdown
- **`TransitOverlay`** - Current transit indicators

### Divination & Intention Components
- **`IntentionSetter`** - Intention input and confirmation
- **`QuantumGenerator`** - Visual quantum randomness indicator
- **`TarotCard`** - Individual tarot card display
- **`TarotSpread`** - Layout for card arrangements
- **`CardDrawAnimation`** - Animated card selection process
- **`HexagramDisplay`** - I Ching hexagram visualization
- **`CoinCastAnimation`** - Animated coin casting visualization
- **`ReadingCard`** - General reading display container
- **`InterpretationText`** - Formatted interpretation content
- **`JournalPrompt`** - Quick journal entry after reading

### Form & Input Components
- **`BirthDataForm`** - Date, time, location input
- **`LocationPicker`** - City/timezone selection with autocomplete
- **`DateTimePicker`** - Custom date/time selector
- **`JournalEditor`** - Rich text editor for journal entries
- **`MoodSelector`** - Mood and energy level picker

### Navigation & Layout Components
- **`TabNavigation`** - Bottom tab bar
- **`HeaderBar`** - Screen headers with actions
- **`SideDrawer`** - Navigation drawer
- **`LoadingSpinner`** - Loading state indicator
- **`ErrorBoundary`** - Error handling wrapper

### Data Storage & Content Management
- **`TarotCardLibrary`** - Complete tarot deck data with meanings
- **`HexagramLibrary`** - All 64 I Ching hexagrams with interpretations
- **`AstrologicalContent`** - Planet, sign, house, and aspect meanings
- **`ContentManager`** - Handles loading and caching of interpretation data
- **`LocalContentCache`** - Offline storage for essential content
- **`ContentVersioning`** - Handle content updates and synchronization

### AI Interpretation & Personalization
- **`AIInterpretationEngine`** - Coordinates LLM calls for personalized readings
- **`PromptTemplate`** - Manages prompt construction for different reading types
- **`PersonalizationContext`** - User profile data for customized interpretations
- **`InterpretationCache`** - Cache AI responses to reduce API calls
- **`FallbackInterpreter`** - Static interpretations when AI unavailable

### Interactive Components
- **`SwipeableCard`** - Swipeable content cards
- **`ExpandableSection`** - Collapsible content areas
- **`SearchBar`** - History and content search
- **`FilterChips`** - Content filtering options
- **`ShareButton`** - Social sharing functionality

---

## 3. HANDLERS (Action Responders)

### Authentication Handlers
- **`handleLogin`** - Process login credentials
- **`handleRegister`** - Create new user account
- **`handlePasswordReset`** - Initiate password recovery
- **`handleBirthDataSubmit`** - Process onboarding data

### Chart & Calculation Handlers
- **`handleChartGenerate`** - Generate natal chart
- **`handleTransitUpdate`** - Update current transits
- **`handleHouseSystemChange`** - Switch chart calculation methods
- **`handleAspectToggle`** - Show/hide specific aspects

### Divination Flow Handlers
- **`handleIntentionSet`** - Process and validate intention
- **`handleQuantumGenerate`** - Request quantum random numbers
- **`handleTarotCardDraw`** - Use quantum numbers to select cards
- **`handleICHingCast`** - Use quantum numbers to generate hexagram
- **`handleReadingComplete`** - Process finished reading
- **`handleJournalFromReading`** - Navigate to journal with reading context
- **`handleReadingSave`** - Save reading to history

### Social & Synastry Handlers
- **`handlePartnerInvite`** - Send connection invitation
- **`handleSynastryGenerate`** - Create compatibility chart
- **`handleConnectionAccept`** - Accept partner request
- **`handlePrivacyToggle`** - Manage sharing permissions

### Journal & History Handlers
- **`handleJournalSave`** - Save journal entry
- **`handleMoodLog`** - Record mood/energy data
- **`handleHistoryFilter`** - Filter past readings
- **`handleReadingFavorite`** - Mark reading as favorite
- **`handleDataExport`** - Export user data

### Image & Asset Management Handlers
- **`handleImageLoad`** - Load tarot card images with fallbacks
- **`handleImageCache`** - Manage local image storage
- **`handleImageOptimization`** - Serve appropriate image resolution
- **`handleDeckSelection`** - Switch between different tarot decks
- **`handleImagePreload`** - Background load images for smooth UX
- **`handleImageError`** - Fallback when images fail to load

---

## 4. UTILS (Helper Tools)

### Astronomical Calculations
- **`calculateNatalChart()`** - Generate birth chart data
- **`calculateTransits()`** - Get current planetary positions
- **`calculateAspects()`** - Find planetary aspects
- **`calculateHouses()`** - Determine house cusps
- **`getEphemerisData()`** - Fetch astronomical data

### Date & Time Utilities
- **`formatDateTime()`** - Format dates for display
- **`convertTimezone()`** - Handle timezone conversions
- **`validateBirthData()`** - Validate date/time/location
- **`calculateAge()`** - Calculate current age
- **`getLocalDateTime()`** - Get user's local time

### Data Processing
- **`parseLocationData()`** - Process location search results
- **`formatChartData()`** - Structure chart data for display
- **`validateEmail()`** - Email format validation
- **`sanitizeInput()`** - Clean user input
- **`generateUniqueId()`** - Create unique identifiers

### Text & Content
- **`formatInterpretation()`** - Format reading text
- **`truncateText()`** - Limit text length
- **`highlightKeywords()`** - Emphasize important terms
- **`generateSummary()`** - Create reading summaries
- **`translateContent()`** - Handle multiple languages

### Image & Asset Management
- **`loadTarotImages()`** - Load card images for selected deck
- **`optimizeImageSize()`** - Resize images for device/connection
- **`cacheEssentialImages()`** - Store priority images locally
- **`validateImageAssets()`** - Ensure all card images available
- **`generateImageManifest()`** - Create image loading priority list
- **`handleImageFallback()`** - Use backup images or placeholders
- **`preloadNextImages()`** - Background load likely needed images

### AI Integration & Prompting
- **`constructTarotPrompt()`** - Build personalized tarot reading prompt
- **`constructHexagramPrompt()`** - Build I Ching consultation prompt
- **`constructHoroscopePrompt()`** - Build astrological reading prompt
- **`callLLMAPI()`** - Handle API calls to language model
- **`parseAIResponse()`** - Process and validate AI interpretation
- **`cacheInterpretation()`** - Store AI responses for reuse
- **`getFallbackInterpretation()`** - Static backup when AI unavailable

### Quantum Random & Divination Utilities
- **`getQuantumRandomNumbers()`** - Fetch true random numbers from quantum API
- **`generateTarotSelection()`** - Use quantum numbers to select cards
- **`generateHexagram()`** - Use quantum numbers to create I Ching hexagram
- **`interpretTarotSpread()`** - Analyze card combinations
- **`interpretHexagram()`** - Provide I Ching interpretation
- **`validateIntention()`** - Ensure intention is set before reading

---

## 5. STATE MANAGEMENT

### Global App State
```javascript
// User authentication and profile
userState: {
  isAuthenticated: boolean,
  profile: UserProfile,
  birthData: BirthData,
  preferences: UserPreferences
}

// Chart and astronomical data
chartState: {
  natalChart: ChartData,
  currentTransits: TransitData,
  aspectFilter: AspectSettings,
  houseSystem: HouseSystemType
}

// Divination and quantum state
divinationState: {
  currentIntention: string,
  quantumNumbers: number[],
  tarotReading: TarotReading,
  iChingReading: ICHingReading,
  readingInProgress: boolean,
  lastReadingId: string
}

// Social and synastry
socialState: {
  connections: Connection[],
  synastryReadings: SynastryReading[],
  invitations: Invitation[]
}

// Journal and personal data
journalState: {
  entries: JournalEntry[],
  moodLogs: MoodLog[],
  favorites: FavoriteReading[]
}

// Image and asset state
imageState: {
  selectedDeck: DeckType,
  loadedImages: Map<string, ImageData>,
  imageCache: Map<string, string>,
  isPreloading: boolean,
  availableDecks: TarotDeck[],
  imageLoadingProgress: number
}

// Content libraries and AI state
contentState: {
  tarotLibrary: TarotCard[],
  hexagramLibrary: Hexagram[],
  astrologyContent: AstrologyContent,
  contentVersion: string,
  isContentLoaded: boolean
}

// AI interpretation state  
aiState: {
  isGeneratingReading: boolean,
  lastAIResponse: AIInterpretation,
  interpretationCache: Map<string, AIInterpretation>,
  promptContext: PersonalizationContext,
  fallbackMode: boolean
}
```

---

## 6. DEVELOPMENT PHASES & TASKS

### Phase 1: Foundation (Weeks 1-3)
**Priority: Get basic structure working**

1. **Set up project structure and navigation**
   - Create screen components (empty shells)
   - Implement tab navigation
   - Set up state management

2. **Build authentication flow**
   - LoginScreen + components
   - Registration handlers
   - User state management

3. **Create birth data collection**
   - OnboardingScreen
   - BirthDataForm component
   - Location picker with autocomplete
   - Data validation utils

### Phase 2: Core Astrology (Weeks 4-7)
**Priority: Basic chart generation and display**

1. **Implement natal chart system**
   - Astronomical calculation utils
   - ChartWheel component
   - Basic interpretation display
   - Chart data caching

2. **Build daily horoscope feature**
   - DailyHoroscopeScreen
   - Transit calculation utils
   - Reading card components
   - Content management system

3. **Add data persistence**
   - Supabase integration
   - Local storage setup
   - Basic sync functionality

### Phase 2.5: Content Library Setup (Week 4)
**Priority: Load essential divination content**

1. **Create content libraries**
   - Tarot card database (78 cards with complete data)
   - I Ching hexagram database (64 hexagrams)
   - Astrological correspondence tables
   - Content validation and integrity checks

2. **Implement AI integration foundation**
   - LLM API setup and authentication
   - Basic prompt templates
   - Response parsing and validation
   - Fallback content system

### Phase 3: Divination Tools (Weeks 5-7)
**Priority: Quantum-powered readings with AI personalization**

1. **Implement Quantum + AI Tarot System**
   - Intention setting flow
   - Quantum card selection using library
   - AI-powered personalized interpretations
   - Fallback to static meanings
   - Journal integration

2. **Build Quantum + AI I Ching Oracle**
   - Intention setting flow  
   - Quantum hexagram generation using library
   - AI consultation with classical wisdom
   - Changing lines interpretation
   - Journal integration

3. **Content management system**
   - Content versioning and updates
   - AI response caching
   - Offline content availability

### Phase 4: Social Features (Weeks 11-13)
**Priority: Synastry and connections**

1. **Create synastry system**
   - Partner invitation flow
   - Compatibility calculations
   - SynastryScreen components
   - Privacy controls

2. **Build connection management**
   - ConnectionsScreen
   - Invitation handlers
   - Sharing permissions

### Phase 5: Personal Tracking (Weeks 14-15)
**Priority: Journal and history**

1. **Implement journal system**
   - JournalScreen and editor
   - Mood tracking components
   - Entry management

2. **Build history and analytics**
   - HistoryScreen
   - Reading archive
   - Pattern recognition

### Phase 6: Polish & Launch (Weeks 16-18)
**Priority: Performance and user experience**

1. **Optimize performance**
   - Improve sync efficiency
   - Enhance offline capabilities
   - Add loading states

2. **Final UI/UX improvements**
   - Animation and transitions
   - Error handling
   - Accessibility features

---

## 7. FILE ORGANIZATION STRUCTURE

```
src/
├── screens/           # Complete user experiences
├── components/        # Reusable UI building blocks
├── handlers/          # Event and action processors
├── utils/            # Helper functions and calculations
├── state/            # State management setup
├── styles/           # Shared styling and themes
├── types/            # TypeScript type definitions
├── constants/        # App-wide constants
└── assets/           # Images, fonts, static content
```

## 8. DEVELOPMENT BEST PRACTICES

### Component Creation Rules
1. **One component per file** - No exceptions
2. **Single responsibility** - Each component does one thing well
3. **Reusable by default** - Design for multiple use cases
4. **Props interface first** - Define what data component needs

### Handler Organization
1. **Group by feature** - All auth handlers together
2. **Pure functions when possible** - Easier to test and debug
3. **Async/await for external calls** - Consistent error handling
4. **Clear naming convention** - `handle[Action][Object]`

### State Management
1. **Minimal global state** - Only what multiple screens need
2. **Local state for UI** - Component-specific state stays local
3. **Immutable updates** - Always return new objects
4. **Clear action types** - Descriptive action names

### Utils Guidelines
1. **Small and focused** - Each util does one thing
2. **Pure functions** - No side effects
3. **Well documented** - Clear input/output examples
4. **Comprehensive testing** - Utils are easiest to test

This architecture ensures each piece has a clear purpose, promotes reusability, and makes debugging much simpler by keeping related code together while maintaining separation of concerns.