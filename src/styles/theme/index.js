// SkyChart Theme System
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { borderRadius } from './borderRadius';
import { fontSize } from './fontSize';
import { fontWeight } from './fontWeight';
import { shadows } from './shadows';

// Create theme object
const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

// Debug: Log theme structure
console.log('[Theme] Loaded theme:', {
  hasColors: !!theme.colors,
  hasFontSize: !!theme.fontSize,
  hasBorderRadius: !!theme.borderRadius,
  hasShadows: !!theme.shadows,
  fontSizeKeys: theme.fontSize ? Object.keys(theme.fontSize) : 'undefined'
});

// Export theme object for backward compatibility
export { theme };

// Also export individual parts
export { colors, typography, spacing, borderRadius, fontSize, fontWeight, shadows };