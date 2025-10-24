# Ouros Web Styling System

## Overview
This document defines the complete styling architecture for the Ouros web application, mapping React Native patterns to web-native solutions using Tailwind CSS + CSS custom properties.

## Design Tokens

### Colors
All colors are defined as RGB values in CSS custom properties for Tailwind integration.

```css
--color-primary: 129 184 181        /* #81B8B5 - Teal brand */
--color-secondary: 133 121 141      /* #85798D - Purple-gray */
--color-accent: 129 184 181         /* Same as primary */

--color-background-primary: 37 37 37       /* #252525 */
--color-background-secondary: 26 26 26     /* #1A1A1A */
--color-background-card: 67 67 67          /* #434343 */

--color-border: 67 67 67
--color-surface: 67 67 67
--color-success: 129 184 181
--color-warning: 246 217 159        /* #F6D99F */
--color-error: 239 68 68
```

### Typography

**Fonts:**
- `Inter` (400, 500, 600, 700) - Body text, UI
- `PT Serif` (400, 700) - Headings, mystical content

**Font Sizes:**
```typescript
xs: 12px    // Small labels
sm: 14px    // Body small
base: 16px  // Body default
lg: 18px    // Large body
xl: 20px    // H3
2xl: 24px   // H2
3xl: 30px   // H1
4xl: 36px   // Hero
```

**Font Weights:**
- 400: Regular
- 500: Medium (buttons, labels)
- 600: Semibold (section headers)
- 700: Bold (headings)

### Spacing Scale
```typescript
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Border Radius
```typescript
sm: 4px    // Input fields
md: 8px    // Buttons, cards
lg: 12px   // Large cards
xl: 16px   // Modal corners
full: 9999px  // Pills, avatars
```

### Shadows
```css
sm: 0 1px 2px 0 rgb(0 0 0 / 0.05)
md: 0 4px 6px -1px rgb(0 0 0 / 0.1)
lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

## Component Patterns

### React Native → Web Mapping

| React Native | Web Equivalent | Implementation |
|--------------|----------------|----------------|
| `View` | `div` | Use semantic HTML where possible |
| `Text` | `p`, `span`, `h1-h6` | Semantic elements |
| `TouchableOpacity` | `button` | Always use `<button>` for actions |
| `ScrollView` | `div` with `overflow-auto` | Virtual scrolling for long lists |
| `TextInput` | `input`, `textarea` | HTML5 form elements |
| `Image` | `img`, Next.js `Image` | Use Next Image for optimization |
| `FlatList` | `div + map()` | react-window for virtualization |
| `Modal` | `dialog`, portal | HTML5 dialog or Radix UI |
| `ActivityIndicator` | CSS spinner | Framer Motion animations |
| `SafeAreaView` | Remove or `padding` | Not needed on web |
| `KeyboardAvoidingView` | Remove | Not needed on web |
| `Animated.View` | Framer Motion | `motion.div` |

### StyleSheet Migration Pattern

**React Native:**
```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  }
});

<View style={styles.container}>
```

**Web (Tailwind):**
```typescript
<div className="flex flex-col min-h-screen bg-background p-4">
```

### Animation Migration

**React Native (Reanimated):**
```typescript
const opacity = useSharedValue(0);
useEffect(() => {
  opacity.value = withTiming(1, { duration: 500 });
}, []);

<Animated.View style={[{ opacity }]}>
```

**Web (Framer Motion):**
```typescript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
```

## Responsive Design

### Breakpoints
```typescript
sm: 640px   // Tablet portrait
md: 768px   // Tablet landscape
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

### Usage Pattern
```typescript
// Mobile-first approach
<div className="
  px-4         /* Mobile: 16px padding */
  md:px-8      /* Tablet: 32px padding */
  lg:px-16     /* Desktop: 64px padding */
  max-w-7xl    /* Max width constraint */
  mx-auto      /* Center content */
">
```

## Component Variants System

Using `class-variance-authority` (CVA) for type-safe variants:

```typescript
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:opacity-90',
        secondary: 'bg-card border border-border hover:bg-background-secondary',
        ghost: 'hover:bg-card hover:text-primary',
        destructive: 'bg-error/10 text-error hover:bg-error/20',
      },
      size: {
        small: 'px-4 py-2 text-sm',
        medium: 'px-6 py-3 text-base',
        large: 'px-8 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
    },
  }
);
```

## Accessibility Guidelines

### Focus States
All interactive elements must have visible focus indicators:
```css
.button:focus-visible {
  outline: 2px solid rgb(var(--color-primary));
  outline-offset: 2px;
}
```

### Keyboard Navigation
- Tab order follows visual hierarchy
- Enter/Space activates buttons
- Escape closes modals
- Arrow keys for lists/menus

### ARIA Labels
```typescript
<button
  aria-label="Close modal"
  aria-pressed={isActive}
  aria-expanded={isOpen}
>
```

## Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
const NatalChartWheel = dynamic(() => import('@/components/NatalChartWheel'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Client-side only
});
```

### Image Optimization
```typescript
import Image from 'next/image';

<Image
  src="/images/avatar.jpg"
  alt="User avatar"
  width={48}
  height={48}
  quality={85}
  loading="lazy"
/>
```

### CSS Optimization
- Tailwind purges unused styles automatically
- Critical CSS inlined in `<head>`
- Font display: swap for web fonts

## Dark Mode Support

Currently single dark theme. Future light mode:

```typescript
// In globals.css
@media (prefers-color-scheme: light) {
  :root {
    --color-background-primary: 255 255 255;
    --color-text-primary: 0 0 0;
    /* ... */
  }
}
```

## Component Composition Patterns

### Container Pattern
```typescript
// Consistent max-width + padding
<div className="container-padding">
  {children}
</div>

// In globals.css
.container-padding {
  @apply px-4 md:px-8 max-w-7xl mx-auto;
}
```

### Card Pattern
```typescript
<Card variant="outlined" className="p-6">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Form Pattern
```typescript
<form onSubmit={handleSubmit}>
  <div className="space-y-4">
    <Input
      label="Email"
      type="email"
      error={errors.email}
      {...register('email')}
    />
    <Button type="submit" loading={isSubmitting}>
      Submit
    </Button>
  </div>
</form>
```

## Migration Checklist

For each React Native component:

1. ✅ Replace `View` with semantic HTML
2. ✅ Convert `StyleSheet.create` to Tailwind classes
3. ✅ Replace touch handlers with click/submit
4. ✅ Update animations to Framer Motion
5. ✅ Add hover states for desktop
6. ✅ Implement keyboard navigation
7. ✅ Add ARIA attributes
8. ✅ Test responsive behavior
9. ✅ Optimize for performance
10. ✅ Document component props

## Naming Conventions

### Component Files
- PascalCase: `LoadingScreen.tsx`
- Co-located styles (if needed): `LoadingScreen.module.css`

### CSS Classes
- Tailwind utilities: `flex items-center gap-4`
- Custom utilities: `container-padding`, `text-gradient`
- Component classes (rare): `.modal-overlay`, `.chart-wheel`

### Props
- camelCase: `isLoading`, `onSubmit`, `errorMessage`
- Boolean props: `loading`, `disabled`, `open` (not `isLoading`)
- Handlers: `onX` pattern (`onClick`, `onSubmit`)

## Best Practices

1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Semantic HTML**: Use proper elements (`button`, `nav`, `main`)
3. **Accessibility**: Include ARIA, keyboard nav, focus states
4. **Performance**: Lazy load, optimize images, minimize bundle
5. **Consistency**: Use design tokens, component library
6. **Type Safety**: TypeScript + CVA for all components
7. **Testing**: Test responsive, keyboard, screen readers

## Tools & Libraries

- **Styling**: Tailwind CSS 4
- **Variants**: class-variance-authority
- **Animations**: Framer Motion
- **Icons**: lucide-react
- **Forms**: React Hook Form + Zod
- **Utils**: clsx, tailwind-merge
- **Date/Time**: date-fns
