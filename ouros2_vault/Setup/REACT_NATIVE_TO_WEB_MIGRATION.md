# React Native to Web Migration Plan

## Executive Summary

This document outlines the comprehensive changes required to pivot Ouros2 from a React Native mobile app to a web application. The app currently uses Expo and React Native with several native-specific dependencies that need to be replaced or adapted for web compatibility.

## Current Architecture Analysis

### Tech Stack
- **Framework**: Expo + React Native
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: Zustand
- **Backend**: Supabase (Auth, Database, Storage)
- **AI**: Anthropic Claude API
- **Styling**: React Native StyleSheet API
- **Fonts**: Expo Google Fonts (Inter, PT Serif)

### Native Dependencies Inventory

#### Critical Native Dependencies (Must Replace)
1. **react-native-purchases** (RevenueCat)
   - Used for: iOS in-app purchases and subscription management
   - Files: `src/services/subscriptionService.ts`
   - Replacement: Web-based payment system (Stripe, Paddle, or direct RevenueCat web SDK)

2. **expo-image-picker**
   - Used for: Avatar upload functionality
   - Files: `src/handlers/avatarUpload.ts`, `src/screens/ProfileEditScreen.tsx`
   - Replacement: HTML5 file input (`<input type="file">`)

3. **@react-native-community/datetimepicker**
   - Used for: Birth date/time selection
   - Files: `src/screens/BirthDateTimeScreen.tsx`
   - Replacement: HTML5 date/time inputs or web date picker library (react-datepicker, date-fns with custom UI)

4. **react-native-reanimated**
   - Used for: Complex animations
   - Files: Multiple (coin flips, card reveals, UI transitions)
   - Found in 13 files including:
     - `src/components/iching/CoinFlipAnimation.tsx`
     - `src/components/tarot/QuantumCardReveal.tsx`
     - `src/components/RadionicSpinner.tsx`
   - Replacement: CSS animations, Framer Motion, or React Spring

5. **react-native-gesture-handler**
   - Used for: Swipe gestures and touch interactions
   - Files: `src/components/SwipeableChartCard.tsx`, App.js wrapper
   - Replacement: Web gesture libraries (react-use-gesture) or native touch events

#### Moderate Impact Dependencies (May Need Adaptation)
1. **react-native-svg** (15 files)
   - Used for: Chart visualizations, icons
   - Files: Natal chart wheel, transit graphs, zodiac icons
   - Status: Has web support but may need adjustments
   - Action: Test and adjust SVG implementations for web

2. **expo-blur**
   - Used for: UI effects
   - Replacement: CSS backdrop-filter or alternatives

3. **expo-linear-gradient**
   - Used for: Gradient backgrounds
   - Replacement: CSS gradients

4. **react-native-safe-area-context**
   - Used for: SafeAreaView in 17+ files
   - Replacement: CSS with viewport units or remove (not needed on web)

5. **expo-status-bar**
   - Used for: Mobile status bar styling
   - Replacement: Remove (not applicable to web)

#### Compatible Dependencies (No Change Needed)
- **@supabase/supabase-js** ✓
- **@anthropic-ai/sdk** ✓
- **react-navigation** ✓ (has web support)
- **zustand** ✓
- **date-fns** ✓
- **react** / **react-dom** ✓

## Migration Strategy

### Phase 1: Foundation Setup

#### 1.1 Project Configuration
**Priority: CRITICAL**

**Current State:**
- `app.json`: Expo config with iOS/Android targets
- `metro.config.js`: Metro bundler with SVG transformer
- `babel.config.js`: React Native preset with Reanimated plugin
- `tsconfig.json`: jsx: "react-native"

**Changes Needed:**

1. **Create Next.js or Vite Setup**
   ```bash
   # Option A: Next.js (Recommended for SSR/SEO)
   npx create-next-app@latest ouros-web --typescript --app --tailwind

   # Option B: Vite (Faster dev, simpler)
   npm create vite@latest ouros-web -- --template react-ts
   ```

2. **Update package.json**
   - Remove: expo, react-native, react-native-purchases, expo-image-picker, @react-native-community/datetimepicker, react-native-reanimated, react-native-gesture-handler
   - Add: Web-specific routing (if using Vite), CSS framework, web animation library
   - Keep: @supabase/supabase-js, @anthropic-ai/sdk, zustand, date-fns

3. **Create new tsconfig.json**
   ```json
   {
     "compilerOptions": {
       "jsx": "react-jsx", // Change from "react-native"
       "lib": ["DOM", "ESNext"],
       "target": "ESNext",
       "module": "ESNext",
       "moduleResolution": "bundler", // or "node"
       "esModuleInterop": true,
       "strict": true
     }
   }
   ```

4. **Environment Variables**
   - Current: Uses `react-native-dotenv` with `@env` module
   - Change to: `.env.local` with `VITE_` or `NEXT_PUBLIC_` prefixes
   - Update `env.d.ts` accordingly

#### 1.2 Entry Point Refactor
**Priority: CRITICAL**

**Current:** `App.js` with GestureHandlerRootView and SafeAreaProvider
**New:** Standard React app entry

```typescript
// main.tsx (Vite) or app/layout.tsx (Next.js)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppNavigator } from './src/navigation'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppNavigator />
  </React.StrictMode>,
)
```

### Phase 2: Navigation Migration

#### 2.1 React Navigation Web Adapter
**Priority: HIGH**

**Current Files:**
- `src/navigation/index.tsx` - Main app navigator
- `src/navigation/TabNavigator.tsx` - Bottom tab navigation
- `src/navigation/AuthNavigator.tsx` - Auth flow
- `src/navigation/OnboardingNavigator.tsx` - Onboarding flow

**Changes:**
1. React Navigation supports web, but Bottom Tabs may need visual adjustments
2. Consider replacing Bottom Tabs with a side navigation or top nav bar for web
3. Update navigation theme for web-appropriate styling

**Alternative:**
Replace with React Router v6:
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
```

### Phase 3: Styling Migration

#### 3.1 StyleSheet to CSS Modules/Tailwind/Styled-Components
**Priority: HIGH**
**Affected: 68+ files with StyleSheet usage**

**Options:**

**Option A: Keep StyleSheet.create (React Native Web)**
- Use `react-native-web` to maintain StyleSheet API
- Pros: Minimal code changes
- Cons: Larger bundle size, limited CSS features

**Option B: Migrate to CSS Modules**
```typescript
// Before
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#252525' }
})

// After
import styles from './HomeScreen.module.css'
// In CSS file:
.container {
  display: flex;
  flex-direction: column;
  background-color: #252525;
}
```

**Option C: Migrate to Tailwind CSS**
```typescript
// Before
<View style={styles.container}>

// After
<div className="flex flex-col bg-zinc-900">
```

**Option D: Styled Components**
```typescript
const Container = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #252525;
`
```

#### 3.2 Component Mapping
**Priority: HIGH**

Map React Native components to web equivalents:

| React Native | Web Alternative | Notes |
|--------------|----------------|-------|
| View | div | Direct replacement |
| Text | span/p | Add semantic HTML |
| ScrollView | div with overflow-y: auto | Consider virtual scrolling |
| TouchableOpacity | button | Use semantic buttons |
| TextInput | input/textarea | HTML5 form controls |
| Image | img | Or Next.js Image component |
| FlatList | div + .map() | Or react-window for performance |
| SafeAreaView | div | Remove or use viewport units |
| KeyboardAvoidingView | Remove | Not needed on web |
| Modal | dialog element | Or portal-based modal |
| ActivityIndicator | Custom spinner | CSS animation |

### Phase 4: Critical Feature Replacements

#### 4.1 Subscription System (RevenueCat → Web Payments)
**Priority: CRITICAL**
**Files:** `src/services/subscriptionService.ts`, `src/screens/SubscriptionScreen.tsx`, `src/components/PaywallModal.tsx`

**Current Implementation:**
- Uses `react-native-purchases` SDK
- Handles iOS App Store purchases
- Syncs with RevenueCat servers
- Updates Supabase subscription_state table

**Replacement Options:**

**Option A: Stripe (Recommended)**
```typescript
// New file: src/services/stripeService.ts
import { loadStripe } from '@stripe/stripe-js';

export async function createCheckoutSession(priceId: string) {
  const stripe = await loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY);
  // Create session via Supabase Edge Function
  const { data } = await supabase.functions.invoke('create-checkout', {
    body: { priceId }
  });
  await stripe?.redirectToCheckout({ sessionId: data.sessionId });
}
```

**Option B: Paddle**
- Similar to Stripe but handles VAT/taxes globally
- Good for international SaaS

**Option C: RevenueCat Web SDK**
- RevenueCat does have web support (experimental)
- May allow keeping some existing logic

**Implementation Steps:**
1. Set up Stripe/Paddle account and products
2. Create Supabase Edge Functions for webhook handling
3. Update `subscriptionService.ts` to use web payment provider
4. Modify UI to use web checkout flow
5. Update Supabase triggers to handle web purchase webhooks
6. Test subscription flow end-to-end

#### 4.2 Image Upload (expo-image-picker → HTML5 File Input)
**Priority: HIGH**
**Files:** `src/handlers/avatarUpload.ts`, `src/screens/ProfileEditScreen.tsx`

**Current Implementation:**
```typescript
const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
});
```

**Replacement:**
```typescript
// New implementation in avatarUpload.ts
export const pickImage = async (): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      resolve(file || null);
    };
    input.click();
  });
};

export const uploadAvatar = async (userId: string, file: File) => {
  const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
  const filePath = `avatars/${fileName}`;

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });
  // ... rest of logic
};
```

Or use a library like `react-dropzone` for better UX:
```typescript
import { useDropzone } from 'react-dropzone';

const { getRootProps, getInputProps } = useDropzone({
  accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
  maxFiles: 1,
  onDrop: (files) => handleUpload(files[0])
});
```

#### 4.3 Date/Time Picker
**Priority: HIGH**
**Files:** `src/screens/BirthDateTimeScreen.tsx`

**Current Implementation:**
```typescript
import DateTimePicker from '@react-native-community/datetimepicker';
// Platform-specific modal picker
```

**Replacement Options:**

**Option A: HTML5 Native Inputs**
```typescript
<input
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
<input
  type="time"
  value={time}
  onChange={(e) => setTime(e.target.value)}
/>
```

**Option B: React DatePicker Library**
```typescript
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

<DatePicker
  selected={date}
  onChange={setDate}
  showTimeSelect
  dateFormat="MMMM d, yyyy h:mm aa"
/>
```

**Option C: DayJS/Date-fns with Custom UI**
- You already have `date-fns` installed
- Build custom calendar UI with full control

#### 4.4 Animations (Reanimated → Web Animations)
**Priority: MEDIUM-HIGH**
**Affected Files:** 13 files with complex animations

**Critical Animation Components:**
1. `src/components/iching/CoinFlipAnimation.tsx` - 3D coin toss
2. `src/components/tarot/QuantumCardReveal.tsx` - Card flip reveal
3. `src/components/RadionicSpinner.tsx` - Loading spinner
4. `src/components/TransitEffectivenessGraph.tsx` - Chart animations
5. Sequential fade-ins in `HomeScreen.tsx`

**Replacement Options:**

**Option A: Framer Motion (Recommended)**
```typescript
import { motion } from 'framer-motion';

// Before (Reanimated)
const fadeAnim = useSharedValue(0);
useEffect(() => {
  fadeAnim.value = withTiming(1, { duration: 500 });
}, []);

// After (Framer Motion)
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  {content}
</motion.div>
```

**Option B: React Spring**
```typescript
import { useSpring, animated } from '@react-spring/web';

const props = useSpring({
  opacity: 1,
  from: { opacity: 0 }
});

<animated.div style={props}>{content}</animated.div>
```

**Option C: CSS Animations**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.fade-in { animation: fadeIn 0.5s ease-in; }
```

**Migration Strategy:**
1. Start with simple fade/slide animations (CSS)
2. Use Framer Motion for complex sequences (card reveals, coin tosses)
3. Consider using Lottie for intricate animations (export from After Effects)

#### 4.5 Gestures (react-native-gesture-handler → Web Gestures)
**Priority: MEDIUM**
**Files:** `src/components/SwipeableChartCard.tsx`, `App.js`

**Current:**
```typescript
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
```

**Replacement:**
```typescript
// Option A: react-use-gesture
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => handleDelete(),
  onSwipedRight: () => handleEdit(),
  trackMouse: true
});

<div {...handlers}>Content</div>

// Option B: Native touch events
const handleTouchStart = (e: TouchEvent) => { /* ... */ }
const handleTouchMove = (e: TouchEvent) => { /* ... */ }
const handleTouchEnd = (e: TouchEvent) => { /* ... */ }
```

### Phase 5: UI/UX Adaptations

#### 5.1 Responsive Design
**Priority: HIGH**

**Mobile-First Components to Adapt:**
- Bottom tab navigation → Side nav or top nav
- Full-screen modals → Centered modal dialogs
- SafeAreaView padding → Standard margins
- Mobile-optimized spacing → Desktop-appropriate spacing

**Responsive Breakpoints:**
```css
/* Mobile: < 640px (current design) */
/* Tablet: 640px - 1024px */
/* Desktop: > 1024px */

@media (min-width: 640px) {
  .container { max-width: 640px; margin: 0 auto; }
}
@media (min-width: 1024px) {
  .container { max-width: 1024px; }
  .tab-nav { flex-direction: row; }
}
```

#### 5.2 Navigation Layout
**Current:** Bottom tab bar (mobile pattern)
**Web Options:**

1. **Sidebar Navigation**
   - Left sidebar with sections
   - Main content area
   - Better for desktop

2. **Top Navigation**
   - Horizontal nav bar
   - Dropdown menus for sub-sections
   - More traditional web pattern

3. **Hybrid Approach**
   - Top nav on desktop
   - Bottom tab on mobile (responsive)

#### 5.3 Keyboard vs Touch Interactions
**Changes Needed:**
- Add `:hover` states to all interactive elements
- Implement keyboard navigation (Tab, Enter, Escape)
- Add focus styles for accessibility
- Consider adding keyboard shortcuts

**Example:**
```css
.button {
  cursor: pointer;
  transition: background-color 0.2s;
}
.button:hover {
  background-color: var(--color-primary-hover);
}
.button:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### Phase 6: Asset Migration

#### 6.1 Fonts
**Current:** Expo Google Fonts (Inter, PT Serif)
**Web Options:**

**Option A: Google Fonts CDN**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=PT+Serif:wght@400&display=swap" rel="stylesheet">
```

**Option B: Self-hosted (Better performance)**
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

#### 6.2 Images & Icons
**Current State:**
- SVG icons in `assets/icons/` (tarot, iching, dream, natal, journal)
- PNG images for splash, icon, adaptive-icon
- SVG imported as components

**Web Migration:**
- Keep SVG icons (works on web)
- May need to adjust imports depending on bundler
- Create favicon from icon.png
- Consider using SVG sprite sheets for performance

**Vite:**
```typescript
import IconComponent from './icon.svg?react'; // Vite syntax
```

**Next.js:**
```typescript
import { ReactComponent as Icon } from './icon.svg'; // with SVGR
```

#### 6.3 App Icons & Meta
**Create:**
- `favicon.ico`
- `manifest.json` (PWA)
- `robots.txt`
- Open Graph images for social sharing
- Apple touch icons

### Phase 7: Platform-Specific Code Removal

#### 7.1 Remove Mobile-Only Features
**Files to Update:**

1. **SafeAreaView** (17 files)
   ```typescript
   // Before
   import { SafeAreaView } from 'react-native-safe-area-context';
   <SafeAreaView style={styles.container}>

   // After
   <div className="container">
   ```

2. **KeyboardAvoidingView** (7 files)
   ```typescript
   // Remove completely - not needed on web
   ```

3. **Platform.OS checks** (3 files)
   ```typescript
   // Remove or replace with browser detection if needed
   if (Platform.OS === 'ios') { /* ... */ }
   ```

4. **StatusBar** (App.js)
   ```typescript
   // Remove expo-status-bar import
   ```

5. **Alert** (7 files using Alert)
   ```typescript
   // Before
   import { Alert } from 'react-native';
   Alert.alert('Title', 'Message');

   // After
   // Use custom modal or browser confirm/alert
   if (window.confirm('Message')) { /* ... */ }
   // Or better: custom modal component
   ```

#### 7.2 Location Picker Web Adaptation
**File:** `src/components/LocationPicker.tsx`

**Current:** Already uses Google Places API (web-compatible!)
**Changes:**
- Minimal - just update UI components
- Replace `TextInput` with `<input>`
- Replace `FlatList` with `<div>` + map
- Keep all Google Places logic

### Phase 8: State Management & Business Logic

#### 8.1 Zustand Store (No Changes Needed!)
**Files:** `src/store/` (all slices)

**Good news:** Zustand is platform-agnostic. All store logic should work as-is.

**Considerations:**
- Verify AsyncStorage usage → May need to switch to localStorage
- Check if any stores import React Native modules

#### 8.2 API Handlers (Mostly Unchanged)
**Files:** `src/handlers/`, `src/utils/`

These should largely work as-is:
- ✓ Supabase client
- ✓ Anthropic AI calls
- ✓ Swiss Ephemeris calculations
- ✓ Horoscope generation
- ✓ Tarot/I-Ching logic
- ✓ Dream interpretation

**Only changes:**
- Remove any React Native imports
- Update types if needed

### Phase 9: Testing & Validation

#### 9.1 Feature Checklist

**Authentication:**
- [ ] Login
- [ ] Register
- [ ] Password reset
- [ ] Session management

**Onboarding:**
- [ ] Birth date/time picker (NEW COMPONENT)
- [ ] Location search
- [ ] Chart generation

**Core Features:**
- [ ] Daily horoscope
- [ ] Natal chart visualization (SVG)
- [ ] Tarot readings
- [ ] I-Ching readings
- [ ] Dream interpretation
- [ ] Journal entries
- [ ] Synastry calculations
- [ ] Transit tracking

**Subscription:**
- [ ] View plans (NEW PAYMENT PROVIDER)
- [ ] Purchase subscription
- [ ] Manage subscription
- [ ] Feature gating

**Profile:**
- [ ] View profile
- [ ] Edit profile
- [ ] Avatar upload (NEW IMPLEMENTATION)
- [ ] Security settings

#### 9.2 Browser Compatibility Testing
Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers (responsive)

#### 9.3 Performance Optimization
- [ ] Code splitting (lazy load routes)
- [ ] Image optimization
- [ ] Font optimization (subset, preload)
- [ ] Bundle size analysis
- [ ] Lighthouse audit (aim for 90+ scores)

### Phase 10: Deployment

#### 10.1 Hosting Options

**Static Hosting (if using Vite):**
- Vercel (recommended)
- Netlify
- Cloudflare Pages

**SSR Hosting (if using Next.js):**
- Vercel (built for Next.js)
- Railway
- Fly.io

**Configuration:**
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Configure environment variables
- [ ] Set up domain and SSL
- [ ] Configure CORS for Supabase
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics

#### 10.2 Supabase Configuration
**Update Supabase project settings:**
- Add web domain to allowed redirect URLs
- Update CORS settings
- Configure webhook endpoints for payment provider
- Test RLS policies from web context

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Set up web project (Vite/Next.js)
- [ ] Migrate configuration files
- [ ] Set up new build system
- [ ] Install web dependencies

### Week 3-4: Core UI Migration
- [ ] Migrate navigation
- [ ] Convert StyleSheet to CSS
- [ ] Replace RN components with web equivalents
- [ ] Set up responsive design system

### Week 5-6: Critical Features
- [ ] Implement web payment system
- [ ] Replace image picker
- [ ] Replace date/time picker
- [ ] Migrate animations (high-priority ones)

### Week 7-8: Feature Completion
- [ ] Complete all animation migrations
- [ ] Complete all screen migrations
- [ ] Implement gesture replacements
- [ ] Remove mobile-specific code

### Week 9-10: Polish & Testing
- [ ] Responsive design refinements
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Accessibility improvements

### Week 11-12: Deployment
- [ ] Set up hosting
- [ ] Configure production environment
- [ ] Deploy and test
- [ ] Monitor and fix issues

## Risk Assessment

### High Risk Items
1. **Subscription System Migration** - Critical revenue path, needs thorough testing
2. **Animation Complexity** - Coin tosses and card reveals are signature features
3. **SVG Chart Rendering** - Natal charts are core functionality

### Medium Risk Items
1. **Navigation UX** - Bottom tabs to web nav may feel different to users
2. **Touch to Mouse** - Gesture interactions need to feel natural with mouse
3. **Performance** - Bundle size needs to be managed carefully

### Low Risk Items
1. **Business Logic** - Most calculation/API code is platform-agnostic
2. **State Management** - Zustand works on web
3. **Backend** - Supabase works on web

## Key Decisions to Make

1. **Framework Choice:** Vite (SPA) vs Next.js (SSR)?
   - Vite: Faster, simpler, client-side only
   - Next.js: SEO benefits, API routes, image optimization

2. **Styling Approach:** CSS Modules, Tailwind, Styled Components, or keep React Native Web?
   - Recommend: Tailwind for rapid development

3. **Payment Provider:** Stripe, Paddle, or RevenueCat Web?
   - Recommend: Stripe (most mature, best docs)

4. **Animation Library:** Framer Motion, React Spring, or CSS?
   - Recommend: Framer Motion for complex, CSS for simple

5. **Navigation:** Keep React Navigation or switch to React Router?
   - Recommend: React Router for more web-native patterns

## Migration Checklist Summary

### Configuration (6 tasks)
- [ ] Choose and set up web framework
- [ ] Update package.json dependencies
- [ ] Create new tsconfig.json
- [ ] Update environment variable system
- [ ] Configure bundler (Vite/Webpack)
- [ ] Set up development environment

### Core Infrastructure (8 tasks)
- [ ] Migrate entry point (App.js → main.tsx)
- [ ] Set up navigation (web-appropriate)
- [ ] Choose and implement styling solution
- [ ] Set up responsive design system
- [ ] Configure fonts
- [ ] Set up SVG handling
- [ ] Configure asset pipeline
- [ ] Set up error boundaries

### Critical Features (5 tasks)
- [ ] Replace subscription system (RevenueCat → Stripe/Paddle)
- [ ] Replace image picker (expo-image-picker → HTML5)
- [ ] Replace date/time picker (RN picker → web picker)
- [ ] Migrate animations (Reanimated → Framer Motion/CSS)
- [ ] Replace gestures (gesture-handler → web gestures)

### Component Migration (70+ components)
- [ ] Replace View with div
- [ ] Replace Text with span/p
- [ ] Replace ScrollView with div
- [ ] Replace TouchableOpacity with button
- [ ] Replace TextInput with input
- [ ] Replace FlatList with virtual lists or map
- [ ] Remove SafeAreaView
- [ ] Remove KeyboardAvoidingView
- [ ] Replace Alert with custom modal
- [ ] Update Modal components

### Screen Migration (29 screens)
- [ ] HomeScreen
- [ ] OracleScreen
- [ ] TarotScreen
- [ ] IChingScreen
- [ ] DreamInterpretationScreen
- [ ] NatalChartScreen
- [ ] DailyHoroscopeScreen
- [ ] JournalScreen
- [ ] ReadingsScreen
- [ ] ProfileScreen
- [ ] SubscriptionScreen
- [ ] (and 18 more screens...)

### Testing & Validation (15 tasks)
- [ ] Test all authentication flows
- [ ] Test all oracle features
- [ ] Test natal chart rendering
- [ ] Test subscription flow
- [ ] Test avatar upload
- [ ] Cross-browser testing
- [ ] Mobile responsive testing
- [ ] Accessibility audit
- [ ] Performance audit
- [ ] SEO optimization
- [ ] Error handling
- [ ] Loading states
- [ ] Edge cases
- [ ] User acceptance testing
- [ ] Security audit

### Deployment (10 tasks)
- [ ] Choose hosting provider
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment variables
- [ ] Set up domain and SSL
- [ ] Configure Supabase for web
- [ ] Set up error tracking
- [ ] Set up analytics
- [ ] Set up monitoring
- [ ] Create deployment documentation
- [ ] Plan rollout strategy

## Conclusion

**Total Estimated Effort:** 10-12 weeks for a single developer

**Most Time-Consuming Areas:**
1. Component/screen migration (40% of time)
2. Subscription system replacement (15% of time)
3. Animation migration (15% of time)
4. Testing and refinement (20% of time)
5. Deployment and monitoring (10% of time)

**Key Success Factors:**
1. Choose the right web framework upfront (Vite vs Next.js)
2. Decide on styling approach early (Tailwind recommended)
3. Prioritize subscription system (revenue-critical)
4. Don't skimp on animation quality (brand differentiation)
5. Maintain feature parity with mobile version

**Recommended Approach:**
Start with Vite + React + TypeScript + Tailwind CSS + Framer Motion. This stack offers:
- Fast development speed
- Minimal learning curve if coming from React Native
- Great performance
- Modern developer experience
- Easy deployment

This migration is definitely **achievable** but requires careful planning and systematic execution. The good news is that much of your business logic, state management, and API integration can be reused with minimal changes.
