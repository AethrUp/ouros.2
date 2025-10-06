import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

// SkyChart App Button Styles
export const buttonStyles = {
  primary: {
    height: 75,
    paddingVertical: spacing.buttonPaddingVertical, // 25
    paddingHorizontal: spacing.buttonPaddingHorizontal, // 50
    backgroundColor: colors.button, // #81B8B5
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch', // w-fit to width
  },
  
  primaryText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  
  secondary: {
    height: 75,
    paddingVertical: spacing.buttonPaddingVertical,
    paddingHorizontal: spacing.buttonPaddingHorizontal,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  
  secondaryText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '500',
  },
};