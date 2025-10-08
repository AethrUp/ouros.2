/**
 * Hexagram Display Component
 * Shows hexagram lines building from bottom to top
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HexagramLine } from '../../types/iching';
import { getLineSymbol } from '../../utils/ichingCasting';
import { colors, typography, spacing } from '../../styles';

interface HexagramLineDisplayProps {
  line?: HexagramLine;
  position: number; // 1-6
}

/**
 * Single Hexagram Line Display
 */
const HexagramLineDisplay: React.FC<HexagramLineDisplayProps> = ({ line, position }) => {
  const hasLine = !!line;
  const isYang = line?.type === 'yang' || line?.type === 'changing-yang';
  const isChanging = line?.isChanging || false;

  // Debug logging
  if (hasLine) {
    console.log(`Rendering line ${position}: type=${line?.type}, isYang=${isYang}, isChanging=${isChanging}`);
  }

  return (
    <View style={styles.hexagramLine}>
      {hasLine ? (
        <View style={styles.lineContent}>
          {/* Line Visual */}
          <View style={styles.lineVisual}>
            {isYang ? (
              // Yang line (solid) ——
              <View style={[styles.yangLine, isChanging && styles.changingLine]} />
            ) : (
              // Yin line (broken) — —
              <View style={styles.yinLine}>
                <View style={[styles.yinSegment, isChanging && styles.changingLine]} />
                <View style={styles.yinGap} />
                <View style={[styles.yinSegment, isChanging && styles.changingLine]} />
              </View>
            )}
          </View>

          {/* Changing Line Indicator */}
          {isChanging && (
            <View style={styles.changingIndicator}>
              <Text style={styles.changingStar}>✦</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.lineContent, { opacity: 0.2 }]}>
          {/* Empty line placeholder */}
          <View style={styles.lineVisual}>
            <View style={styles.yangLine} />
          </View>
        </View>
      )}
    </View>
  );
};

interface HexagramDisplayProps {
  lines: HexagramLine[]; // Array of completed lines
  maxLines?: number; // Total lines to show (default 6)
}

/**
 * Complete Hexagram Display - Building from bottom to top
 */
export const HexagramDisplay: React.FC<HexagramDisplayProps> = ({ lines = [], maxLines = 6 }) => {
  // Create array of 6 positions (or maxLines)
  const positions = Array.from({ length: maxLines }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.hexagramLines}>
        {/* Display from top (6) to bottom (1) for visual layout */}
        {positions.reverse().map((position) => {
          const line = lines.find((l) => l.position === position);
          return <HexagramLineDisplay key={`line-${position}`} line={line} position={position} />;
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  hexagramLines: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexagramLine: {
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    position: 'relative',
  },
  lineVisual: {
    width: 100,
  },
  yangLine: {
    height: 8,
    backgroundColor: colors.text.primary,
    borderRadius: 2,
  },
  yinLine: {
    flexDirection: 'row',
    height: 8,
    width: '100%',
  },
  yinSegment: {
    flex: 1,
    backgroundColor: colors.text.primary,
    borderRadius: 2,
  },
  yinGap: {
    width: 16,
    backgroundColor: 'transparent',
  },
  changingLine: {
    backgroundColor: '#F6D99F', // Golden color for changing lines
    shadowColor: '#F6D99F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  changingIndicator: {
    position: 'absolute',
    right: -30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changingStar: {
    color: '#F6D99F',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
