# Phase 3: Quick Reference Guide

## What Was Accomplished

Phase 3 successfully created a **complete web-native styling system** with:
- ✅ 10 core UI components (Button, Input, TextArea, Card, Badge, Spinner, LoadingScreen, Modal)
- ✅ 30+ Framer Motion animation presets
- ✅ Responsive navigation (desktop sidebar + mobile bottom tabs)
- ✅ Comprehensive design system documentation
- ✅ Full TypeScript type safety
- ✅ Accessibility built-in
- ✅ **Build verification: PASSING ✅**

## Component Import Guide

```typescript
// UI Components
import {
  Button,
  Input,
  TextArea,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge,
  Spinner, DotsSpinner,
  LoadingScreen,
  Modal, ConfirmModal,
} from '@/components/ui';

// Layout Components
import { Header, Navigation, NavigationContentWrapper } from '@/components/layout';

// Animations
import { fadeInUp, staggerContainer, cardReveal, transitions } from '@/lib/animations';
import { motion } from 'framer-motion';

// Utils
import { cn } from '@/lib/utils';
```

## Quick Component Examples

### Button with Loading
```typescript
<Button
  variant="primary"
  size="medium"
  loading={isLoading}
  onClick={handleClick}
>
  Submit
</Button>
```

### Input with Icon & Error
```typescript
<Input
  label="Email"
  type="email"
  leftIcon={<Mail className="w-5 h-5" />}
  error={errors.email}
  helperText="Enter your email address"
  required
  {...register('email')}
/>
```

### Modal
```typescript
<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Confirm Action"
  size="medium"
  footer={
    <>
      <Button variant="ghost" onClick={handleClose}>Cancel</Button>
      <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

### Animated Card
```typescript
<motion.div
  variants={fadeInUp}
  initial="initial"
  animate="animate"
>
  <Card>
    <CardHeader>
      <CardTitle>Title</CardTitle>
      <CardDescription>Description</CardDescription>
    </CardHeader>
    <CardContent>
      Your content here
    </CardContent>
  </Card>
</motion.div>
```

### Sequential Animation (HomeScreen Pattern)
```typescript
<motion.div variants={staggerContainer} initial="initial" animate="animate">
  {items.map((item, index) => (
    <motion.div key={item.id} variants={staggerItem}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

### Loading Screen
```typescript
<LoadingScreen
  context="tarot"
  overlay={true}
  messages={['Custom', 'Loading', 'Messages']} // Optional
/>
```

## Styling Patterns

### Tailwind Classes
```typescript
<div className={cn(
  'flex items-center justify-between gap-4',
  'p-6 bg-card border border-border rounded-lg',
  'hover:bg-background-secondary transition-all',
  isActive && 'border-primary',
  className // Allow overrides
)} />
```

### Responsive Design
```typescript
<div className="
  px-4 md:px-8 lg:px-16          // Responsive padding
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  // Responsive grid
  hidden lg:block                 // Show only on desktop
  lg:hidden                       // Show only on mobile/tablet
" />
```

## Animation Patterns

### Basic Fade In
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>
```

### With Preset
```typescript
<motion.div
  variants={fadeInUp}
  initial="initial"
  animate="animate"
  transition={transitions.spring}
/>
```

### Custom Delay
```typescript
import { sequentialFadeIn } from '@/lib/animations';

<motion.div
  variants={sequentialFadeIn(index, 0.15)}
  initial="initial"
  animate="animate"
/>
```

## Design Tokens

### Colors
```typescript
// In className
'bg-primary'           // #81B8B5
'bg-secondary'         // #85798D
'bg-background'        // #252525
'bg-card'              // #434343
'text-primary'         // white
'text-secondary'       // #85798D
'border-border'        // #434343
```

### Spacing
```typescript
'gap-2'    // 8px
'gap-4'    // 16px
'gap-6'    // 24px
'p-4'      // 16px padding
'm-4'      // 16px margin
```

### Typography
```typescript
'text-sm'      // 14px
'text-base'    // 16px
'text-lg'      // 18px
'text-xl'      // 20px
'text-2xl'     // 24px

'font-sans'    // Inter
'font-serif'   // PT Serif
```

## Layout Structure

```typescript
// Full page with navigation
<>
  <Header title="Page Title" showBack={true} />
  <Navigation />
  <NavigationContentWrapper>
    <div className="container mx-auto px-4 py-6">
      {/* Your content */}
    </div>
  </NavigationContentWrapper>
</>
```

## File Locations

- **Components:** `web/components/ui/` and `web/components/layout/`
- **Animations:** `web/lib/animations.ts`
- **Utils:** `web/lib/utils.ts` (cn helper)
- **Styles:** `web/app/globals.css` (design tokens)
- **Documentation:** `web/STYLING_SYSTEM.md` (full guide)

## Build & Test

```bash
# Development
cd web && npm run dev

# Build (verify everything compiles)
cd web && npm run build

# Expected output: ✓ Compiled successfully
```

## Migration Pattern (React Native → Web)

```typescript
// BEFORE (React Native)
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const Component = () => (
  <ScrollView style={styles.container}>
    <TouchableOpacity onPress={handlePress}>
      <Text style={styles.title}>Title</Text>
    </TouchableOpacity>
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, color: '#fff' },
});

// AFTER (Web)
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/animations';

const Component = () => (
  <div className="flex-1 p-4 overflow-y-auto">
    <motion.button
      onClick={handlePress}
      className="text-2xl text-white"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Title
    </motion.button>
  </div>
);
```

## Common Patterns

### Form with Validation
```typescript
<form onSubmit={handleSubmit} className="space-y-4">
  <Input
    label="Name"
    error={errors.name}
    {...register('name', { required: 'Name is required' })}
  />
  <TextArea
    label="Description"
    error={errors.description}
    {...register('description')}
  />
  <Button type="submit" loading={isSubmitting}>
    Submit
  </Button>
</form>
```

### Card Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map((item, index) => (
    <motion.div
      key={item.id}
      variants={sequentialFadeIn(index)}
      initial="initial"
      animate="animate"
    >
      <Card>
        <CardContent>
          {item.content}
        </CardContent>
      </Card>
    </motion.div>
  ))}
</div>
```

### Badge Usage
```typescript
<div className="flex items-center gap-2">
  <span>Status:</span>
  <Badge variant="success">Active</Badge>
  <Badge variant="warning" size="small">Beta</Badge>
</div>
```

## Performance Tips

1. **Use `motion.div` sparingly** - Only animate what needs animation
2. **Lazy load heavy components** - Use Next.js `dynamic()`
3. **Optimize images** - Use Next.js `<Image>` component
4. **Minimize re-renders** - Use `React.memo` for expensive components
5. **CSS transforms** - Animations use GPU acceleration automatically

## Accessibility

All components include:
- ✅ ARIA labels and roles
- ✅ Keyboard navigation
- ✅ Focus states
- ✅ Screen reader support
- ✅ Semantic HTML

## Next Steps

You're ready for **Phase 4: Screen Migration**!

Start migrating React Native screens to web using:
1. This component library
2. Animation presets from `/lib/animations.ts`
3. Design tokens from `globals.css`
4. Patterns from `STYLING_SYSTEM.md`

Each screen should:
- Replace RN components with web components
- Add Framer Motion animations
- Implement responsive design
- Maintain accessibility
- Test on mobile and desktop

**Build status: ✅ PASSING**
**Ready for production: ✅ YES**
