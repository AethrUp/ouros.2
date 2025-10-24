/**
 * Type Guards for Reading Format Detection
 * Used to determine which version of reading structure is being used
 */

import {
  DailySynastryForecastContent,
  DailySynastryForecastContentV2,
} from '../types/synastry';
import { TarotInterpretation } from '../types/tarot';
import { IChingInterpretation, IChingInterpretationV2 } from '../types/iching';

// =====================================================
// SYNASTRY TYPE GUARDS
// =====================================================

/**
 * Check if synastry forecast content is V2 format
 */
export function isSynastryV2Format(
  content: any
): content is DailySynastryForecastContentV2 {
  return (
    content &&
    typeof content === 'object' &&
    'timeBasedForecasts' in content &&
    'introduction' in content &&
    'transitAnalysis' in content &&
    typeof content.transitAnalysis === 'object' &&
    'primary' in content.transitAnalysis
  );
}

/**
 * Check if synastry forecast content is legacy V1 format
 */
export function isSynastryV1Format(
  content: any
): content is DailySynastryForecastContent {
  return (
    content &&
    typeof content === 'object' &&
    'morningForecast' in content &&
    'afternoonForecast' in content &&
    'eveningForecast' in content &&
    typeof content.transitAnalysis === 'string' // V1 has string, V2 has object
  );
}

// =====================================================
// TAROT TYPE GUARDS
// =====================================================

/**
 * Check if tarot interpretation is structured format (V2)
 */
export function isStructuredTarot(
  interpretation: any
): interpretation is TarotInterpretation {
  return (
    interpretation &&
    typeof interpretation === 'object' &&
    'preview' in interpretation &&
    'fullContent' in interpretation &&
    interpretation.fullContent &&
    'cardInsights' in interpretation.fullContent &&
    Array.isArray(interpretation.fullContent.cardInsights)
  );
}

/**
 * Check if tarot interpretation is legacy string format (V1)
 */
export function isLegacyTarot(interpretation: any): interpretation is string {
  return typeof interpretation === 'string';
}

// =====================================================
// I CHING TYPE GUARDS
// =====================================================

/**
 * Check if I Ching interpretation is V2 format
 */
export function isIChingV2(
  interpretation: any
): interpretation is IChingInterpretationV2 {
  return (
    interpretation &&
    typeof interpretation === 'object' &&
    'preview' in interpretation &&
    'fullContent' in interpretation &&
    interpretation.fullContent &&
    'trigramDynamics' in interpretation.fullContent &&
    typeof interpretation.fullContent.trigramDynamics === 'object' &&
    'interaction' in interpretation.fullContent.trigramDynamics
  );
}

/**
 * Check if I Ching interpretation is V1 structured format
 */
export function isIChingV1(
  interpretation: any
): interpretation is IChingInterpretation {
  return (
    interpretation &&
    typeof interpretation === 'object' &&
    'interpretation' in interpretation &&
    'tone' in interpretation &&
    'confidence' in interpretation &&
    typeof interpretation.interpretation === 'object' &&
    'overview' in interpretation.interpretation &&
    !('preview' in interpretation) // V2 has preview, V1 doesn't
  );
}

/**
 * Check if I Ching interpretation is legacy string format
 */
export function isLegacyIChing(interpretation: any): interpretation is string {
  return typeof interpretation === 'string';
}

// =====================================================
// GENERIC TYPE GUARDS
// =====================================================

/**
 * Check if a reading has a preview section (common to all V2 formats)
 */
export function hasPreviewSection(reading: any): boolean {
  return reading && typeof reading === 'object' && 'preview' in reading;
}

/**
 * Check if a reading has fullContent section (common to all V2 formats)
 */
export function hasFullContentSection(reading: any): boolean {
  return reading && typeof reading === 'object' && 'fullContent' in reading;
}

/**
 * Check if content is a simple string (legacy format)
 */
export function isStringContent(content: any): content is string {
  return typeof content === 'string';
}

/**
 * Check if content is a structured object (V1 or V2 format)
 */
export function isStructuredContent(content: any): content is object {
  return content && typeof content === 'object' && !Array.isArray(content);
}
