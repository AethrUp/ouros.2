// SkyChart App Color Palette
export const colors = {
  // Main brand colors
  primary: '#81B8B5',
  secondary: '#85798D',
  accent: '#81B8B5',

  // Nested structure for new components
  background: {
    primary: '#252525',
    secondary: '#1A1A1A',
    card: '#434343',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#85798D',
  },

  // UI elements
  border: '#434343',
  button: '#81B8B5',
  callout: '#81B8B5',

  // Status colors
  success: '#81B8B5',
  warning: '#85798D',
  error: '#85798D',

  // Legacy flat structure (for backward compatibility with existing components)
  textPrimary: '#FFFFFF',
  textSecondary: '#85798D',
  textLight: '#85798D',
  textInverse: '#FFFFFF',
  textPlaceholder: '#85798D',
  backgroundDark: '#1A1A1A',
  backgroundFlat: '#252525',
  surface: '#434343',
  surfaceDark: '#1A1A1A',
  textFlat: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.7)',
  info: '#81B8B5',
};

// Add legacy support for colors.background as a string (for existing components)
// This allows both colors.background and colors.background.primary to work
Object.defineProperty(colors.background, 'toString', {
  value: () => '#252525',
  enumerable: false
});

Object.defineProperty(colors.background, 'valueOf', {
  value: () => '#252525',
  enumerable: false
});

// Add a direct reference for easier access
colors.backgroundFlat = '#252525';