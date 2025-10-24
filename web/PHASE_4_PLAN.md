# Phase 4: Screen Migration Plan

## Overview

Phase 4 migrates **28 React Native screens** to web pages using the component library and design system from Phase 3.

## Current State Analysis

### React Native Screens (28 total)
```
src/screens/
├── Auth & Onboarding (4)
│   ├── LoginScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── OnboardingScreen.tsx
│   └── SplashScreen.tsx
├── Home & Navigation (2)
│   ├── HomeScreen.tsx
│   └── DevMenuScreen.tsx
├── Oracle (5)
│   ├── OracleScreen.tsx
│   ├── TarotScreen.tsx
│   ├── IChingScreen.tsx
│   ├── DreamInterpretationScreen.tsx
│   └── ReadingsScreen.tsx
├── Oracle Details (2)
│   ├── TarotReadingDetailScreen.tsx
│   └── IChingReadingDetailScreen.tsx
├── Chart & Astrology (4)
│   ├── NatalChartScreen.tsx
│   ├── DailyHoroscopeScreen.tsx
│   ├── PlanetDetailScreen.tsx
│   └── BirthDateTimeScreen.tsx
├── Profile (4)
│   ├── ProfileScreen.tsx
│   ├── ProfileEditScreen.tsx
│   ├── SecurityDataScreen.tsx
│   └── SubscriptionScreen.tsx
├── Journal (2)
│   ├── JournalScreen.tsx
│   └── JournalEntryScreen.tsx
├── Friends & Synastry (4)
│   ├── FriendsScreen.tsx
│   ├── SynastryScreen.tsx
│   ├── DailySynastryForecastScreen.tsx
│   └── SavedChartsScreen.tsx
└── Onboarding Flow (1)
    └── BirthDataScreen.tsx
```

### Web Pages (Current - 15 exist)
```
web/app/
├── page.tsx                 # ✅ Landing
├── login/page.tsx          # ✅ Basic login (needs enhancement)
├── register/page.tsx       # ✅ Basic register (needs enhancement)
├── dashboard/page.tsx      # ⚠️  Stub (needs full migration)
├── onboarding/page.tsx     # ⚠️  Stub (needs full migration)
├── chart/page.tsx          # ⚠️  Stub
├── horoscope/page.tsx      # ⚠️  Stub
├── oracle/page.tsx         # ⚠️  Stub
├── oracle/tarot/page.tsx   # ⚠️  Stub
├── oracle/iching/page.tsx  # ⚠️  Stub
├── oracle/dreams/page.tsx  # ⚠️  Stub
├── journal/page.tsx        # ⚠️  Stub
├── friends/page.tsx        # ⚠️  Stub
├── profile/page.tsx        # ⚠️  Stub
└── auth/callback/route.ts  # ✅ Auth handler
```

## Migration Strategy

### Priority Tiers

**Tier 1: Critical Path (Auth → Onboarding → Home)**
Must work for user to access app
- Login ✅ (enhance)
- Register ✅ (enhance)
- Onboarding (birth date/time picker)
- Dashboard/HomeScreen (main hub)

**Tier 2: Core Features (Oracle + Chart)**
Main value propositions
- Oracle hub
- Tarot reading
- I Ching reading
- Dream interpretation
- Natal Chart
- Daily Horoscope

**Tier 3: User Management**
Profile and settings
- Profile view
- Profile edit
- Subscription management

**Tier 4: Secondary Features**
Journal and social
- Journal list/entry
- Friends list
- Synastry readings

## Screen-by-Screen Migration Plan

### TIER 1: Critical Path

#### 1. LoginScreen → login/page.tsx ✅ (Enhance)
**Status:** Basic version exists, needs enhancement
**Enhancements Needed:**
- Add social login buttons (Apple, Google) UI
- Add forgot password link
- Add loading states
- Add entrance animations
- Improve error handling
- Add field validation

**Components:** Input, Button, LoadingScreen
**Animations:** fadeInUp for form, sequentialFadeIn for fields

---

#### 2. RegisterScreen → register/page.tsx ✅ (Enhance)
**Status:** Basic version exists, needs enhancement
**Enhancements Needed:**
- Add terms & privacy policy checkboxes
- Add password strength indicator
- Add entrance animations
- Improve validation
- Add success state before redirect

**Components:** Input, Button, LoadingScreen, Modal
**Animations:** fadeInUp, staggerContainer

---

#### 3. OnboardingScreen → onboarding/page.tsx ⚠️ (Major Work)
**React Native Features:**
- Multi-step wizard (birth date, time, location)
- DateTimePicker (React Native component)
- LocationPicker (Google Places)
- Progress indicator
- Skip functionality

**Migration Needs:**
- Create web DatePicker component (replace @react-native-community/datetimepicker)
- Adapt LocationPicker for web
- Create step wizard component
- Add progress bar/steps indicator
- Animations between steps

**New Components Needed:**
```typescript
// web/components/ui/DatePicker.tsx
// web/components/ui/TimePicker.tsx
// web/components/ui/StepWizard.tsx
```

**Components:** DatePicker (new), TimePicker (new), Input, Button, StepWizard (new)
**Animations:** slideInRight for steps, fadeIn for progress

---

#### 4. HomeScreen → dashboard/page.tsx ⚠️ (Complex)
**React Native Features:**
- Daily horoscope card
- Transit effectiveness graph
- Transit strength bars
- Cosmic weather chart
- Category insights
- Journal prompts
- Synastry section
- Quick actions
- Sequential fade-in animations (7 sections)

**Migration Complexity:** HIGH
**Why:** Most complex screen, many custom components, heavy use of animations

**Components Used:**
- TransitEffectivenessGraph (needs web SVG version)
- TransitStrengthBar
- CosmicWeatherChart (needs web SVG version)
- ZodiacIcon
- LoadingScreen
- Button
- Cards

**New Components Needed:**
```typescript
// web/components/charts/TransitGraph.tsx (SVG for web)
// web/components/charts/CosmicWeatherChart.tsx (SVG for web)
// web/components/ui/ProgressBar.tsx
```

**Animations:** sequentialFadeIn(index) for 7 sections

---

### TIER 2: Core Features

#### 5. OracleScreen → oracle/page.tsx
**Features:**
- Oracle type cards (Tarot, I Ching, Dreams)
- Navigation to each oracle type
- Descriptions
- Premium feature gates

**Components:** Card, Badge (for premium), Button
**Animations:** staggerContainer + staggerItem

---

#### 6. TarotScreen → oracle/tarot/page.tsx
**Features:**
- Spread selection
- Card deck shuffling animation
- Card reveal animation (QuantumCardReveal)
- Reading generation
- Save/share functionality

**Migration Complexity:** HIGH (custom animations)
**Components Needed:**
- TarotCard component
- Card flip animations
- Spread layouts

**Animations:** tarotDraw, cardReveal, flipCard

---

#### 7. IChingScreen → oracle/iching/page.tsx
**Features:**
- Coin flip animation (3 coins, 6 tosses)
- Hexagram building animation
- Line changing indicators
- Reading generation

**Migration Complexity:** HIGH (3D coin animation)
**Components Needed:**
- CoinFlip animation (3D rotate)
- Hexagram builder
- Line renderer

**Animations:** coinFlip, hexagramLine

---

#### 8. DreamInterpretationScreen → oracle/dreams/page.tsx
**Features:**
- Dream text input
- Symbol extraction
- AI interpretation
- Save dreams

**Migration Complexity:** MEDIUM
**Components:** TextArea, Button, Card, LoadingScreen

---

#### 9. NatalChartScreen → chart/page.tsx
**Features:**
- SVG natal chart wheel
- Planet positions
- House positions
- Aspect lines
- Interactive zoom/pan

**Migration Complexity:** HIGH (SVG rendering)
**Components:** NatalChartWheel (SVG), planet/sign icons

---

#### 10. DailyHoroscopeScreen → horoscope/page.tsx ✅ (Exists, enhance)
**Features:**
- Section navigation (horizontal scroll)
- V2 structured reading display
- Previous/Next navigation
- Loading states

**Status:** Already has V2 section navigation pattern
**Migration:** Adapt existing React Native to web

---

### TIER 3: User Management

#### 11. ProfileScreen → profile/page.tsx
**Features:**
- Avatar display
- User info
- Birth data
- Subscription tier badge
- Edit button

**Components:** Card, Badge, Button, Avatar

---

#### 12. ProfileEditScreen → profile/edit/page.tsx (new route)
**Features:**
- Avatar upload (expo-image-picker → HTML5 file input)
- Name edit
- Email edit
- Birth data edit

**Migration Needs:**
- File upload handler
- Image preview
- Form validation

**New Components:**
```typescript
// web/components/ui/AvatarUpload.tsx
```

---

#### 13. SubscriptionScreen → profile/subscription/page.tsx (new route)
**Features:**
- Tier display
- Plan cards (Free, Premium, Pro)
- Feature comparison
- Upgrade buttons
- Manage subscription

**Migration Complexity:** HIGH (payment integration)
**Note:** RevenueCat → Stripe/web payment provider

---

### TIER 4: Secondary Features

#### 14. JournalScreen → journal/page.tsx
**Features:**
- Journal entry list
- Search/filter
- New entry button
- Date grouping

**Components:** Card, Input (search), Button

---

#### 15. JournalEntryScreen → journal/[id]/page.tsx (dynamic route)
**Features:**
- Entry display
- Edit/delete
- Timestamp
- Associated reading link

**Components:** TextArea, Button, Card

---

#### 16. FriendsScreen → friends/page.tsx
**Features:**
- Connections list
- Add friend
- Swipeable cards (delete)
- Synastry quick view

**Migration Needs:**
- Replace react-native-gesture-handler swipe
- Use framer-motion drag or web swipe library

---

#### 17. SynastryScreen → friends/[id]/synastry/page.tsx (dynamic route)
**Features:**
- Compatibility meters
- Aspect analysis
- Chart comparison

**Components:** CompatibilityMeter, Card

---

## Migration Execution Order

### Week 1: Critical Path
```
Day 1-2: Enhance Login + Register
Day 3-5: Build DatePicker, TimePicker, StepWizard
Day 6-7: Migrate Onboarding flow
```

### Week 2: Dashboard
```
Day 1-3: Build chart components (Transit graphs, Cosmic weather)
Day 4-5: Migrate HomeScreen sections
Day 6-7: Test and polish animations
```

### Week 3: Oracle Features
```
Day 1-2: Oracle hub + Dream interpretation
Day 3-4: Tarot (animations complex)
Day 5-6: I Ching (coin flip animation)
Day 7: Polish and test
```

### Week 4: Chart & Profile
```
Day 1-3: Natal Chart (SVG rendering)
Day 4-5: Daily Horoscope (adapt from RN)
Day 6-7: Profile screens
```

### Week 5: Secondary Features & Polish
```
Day 1-2: Journal
Day 3-4: Friends/Synastry
Day 5-7: Testing, responsive, accessibility, bug fixes
```

## Component Reusability Matrix

### Need to Build (New for Web)
- ✅ DatePicker
- ✅ TimePicker
- ✅ StepWizard
- ✅ AvatarUpload
- ✅ TransitGraph (SVG web version)
- ✅ CosmicWeatherChart (SVG web version)
- ✅ TarotCard + flip animations
- ✅ CoinFlip (3D animation)
- ✅ HexagramBuilder
- ✅ CompatibilityMeter (web version)
- ✅ NatalChartWheel (web SVG version)

### Can Reuse from Phase 3
- ✅ Button
- ✅ Input
- ✅ TextArea
- ✅ Card
- ✅ Badge
- ✅ Modal
- ✅ LoadingScreen
- ✅ Header
- ✅ Navigation
- ✅ All animation presets

### Adapt from React Native (Logic Only)
- ✅ LocationPicker (Google Places API works on web)
- ✅ ZodiacIcon (SVG works on web)
- ✅ PlanetIcon (SVG works on web)
- ✅ Oracle icons (SVG works on web)

## Technical Challenges

### 1. Date/Time Picker
**Challenge:** @react-native-community/datetimepicker → web
**Solution:** Build custom with date-fns or use react-datepicker library
**Priority:** HIGH (blocks onboarding)

### 2. SVG Charts
**Challenge:** React Native SVG → web SVG
**Solution:** Use standard SVG, may need adjustments
**Priority:** HIGH (natal chart, transit graphs)

### 3. Animations
**Challenge:** Reanimated → Framer Motion
**Solution:** Use animation presets from Phase 3, build oracle-specific
**Priority:** HIGH (signature features)

### 4. File Upload
**Challenge:** expo-image-picker → HTML5 file input
**Solution:** Standard <input type="file"> + preview
**Priority:** MEDIUM (profile only)

### 5. Gestures
**Challenge:** react-native-gesture-handler → web gestures
**Solution:** Framer Motion drag or react-swipeable
**Priority:** MEDIUM (swipeable cards)

### 6. Payment Integration
**Challenge:** RevenueCat → Stripe
**Solution:** Stripe Checkout (web version)
**Priority:** HIGH (revenue critical)

## Success Criteria

Each migrated screen must:
- ✅ Feature parity with React Native version
- ✅ Responsive (mobile + desktop)
- ✅ Accessible (ARIA, keyboard nav)
- ✅ Animations smooth and appropriate
- ✅ Loading states handled
- ✅ Error states handled
- ✅ TypeScript types complete
- ✅ Builds without errors
- ✅ Navigation works correctly

## Risk Mitigation

### High Risk Items
1. **Natal Chart SVG** - Complex rendering
   - Mitigation: Test early, consider using existing libraries

2. **Oracle Animations** - Signature features
   - Mitigation: Build coin flip and card reveal first, iterate

3. **Payment Integration** - Revenue critical
   - Mitigation: Stripe has excellent docs, test thoroughly in sandbox

### Medium Risk Items
1. **Date/Time Picker** - UX must be good
   - Mitigation: Use proven library (react-datepicker)

2. **Image Upload** - File handling can be tricky
   - Mitigation: Standard HTML5, well documented

## Next Actions

1. ✅ Create Phase 4 plan (this document)
2. ⏭️ Enhance Login/Register screens
3. ⏭️ Build DatePicker/TimePicker/StepWizard
4. ⏭️ Migrate Onboarding flow
5. ⏭️ Build chart components
6. ⏭️ Migrate Dashboard/HomeScreen
7. ⏭️ Continue with Oracle screens...

**Current Status:** Phase 4 Planning Complete
**Ready to Begin:** Login/Register Enhancement
