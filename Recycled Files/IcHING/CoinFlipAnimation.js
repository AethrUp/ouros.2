/**
 * I-Ching Coin Flip Animation Component
 * Physics-based 3-coin simultaneous flip with table drop effect
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import PhysicsCoin from './PhysicsCoin';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COIN_SPACING = 100;

/**
 * Staggered Physics Coin - adds delay to coin animation for variety
 */
const StaggeredCoin = ({ delay = 0, animate, ...props }) => {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (animate) {
      if (delay === 0) {
        setShouldAnimate(true);
      } else {
        const timer = setTimeout(() => {
          setShouldAnimate(true);
        }, delay);
        return () => clearTimeout(timer);
      }
    } else {
      setShouldAnimate(false);
    }
  }, [animate, delay]);

  return (
    <PhysicsCoin
      {...props}
      animate={shouldAnimate}
    />
  );
};

/**
 * Three Coin Toss with Physics
 * @param {Object} props - Component props
 * @param {Array} props.results - Array of 3 boolean values (true = heads)
 * @param {Function} props.onTossComplete - Callback when all coins show
 * @param {boolean} props.animate - Start animation trigger
 */
export const ThreeCoinToss = ({ results = [true, true, false], onTossComplete, animate = false }) => {
  const [completedCoins, setCompletedCoins] = useState(0);
  const [animationKey, setAnimationKey] = useState(0);

  const handleCoinComplete = useCallback((coinId) => {
    setCompletedCoins(prev => {
      const newCount = prev + 1;
      if (newCount === 3 && onTossComplete) {
        setTimeout(() => onTossComplete(), 100);
      }
      return newCount;
    });
  }, [onTossComplete]);

  // Reset counter when animation starts
  useEffect(() => {
    if (animate) {
      setCompletedCoins(0);
      setAnimationKey(prev => prev + 1); // Force re-render with fresh animations
    }
  }, [animate]);

  // Calculate stagger delay for each coin
  const getStaggerDelay = (index) => {
    // Slight stagger for more natural feel
    return index * 50; // 0ms, 50ms, 100ms
  };

  return (
    <View style={styles.container}>
      <View style={styles.coinsRow}>
        {results.map((isHeads, index) => (
          <View key={`${animationKey}-coin-${index}`} style={styles.coinWrapper}>
            <StaggeredCoin
              coinId={index}
              isHeads={isHeads}
              onFlipComplete={handleCoinComplete}
              animate={animate}
              delay={getStaggerDelay(index)}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    isolation: 'isolate'
  },
  coinsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
    height: 200,
    gap: COIN_SPACING - 80, // Account for coin size
  },
  coinWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    isolation: 'isolate'
  },
});

export default ThreeCoinToss;