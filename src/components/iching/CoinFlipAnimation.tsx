/**
 * I Ching Coin Flip Animation Component
 * Simple 3-coin simultaneous flip animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface CoinProps {
  isHeads: boolean;
  delay?: number;
  animate: boolean;
  animationVersion: number;
  onComplete?: () => void;
}

/**
 * Single Coin Component with flip animation
 */
const AnimatedCoin: React.FC<CoinProps> = ({ isHeads, delay = 0, animate, animationVersion, onComplete }) => {
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const [showResult, setShowResult] = React.useState(false);

  useEffect(() => {
    if (animate) {
      // Hide result during animation
      setShowResult(false);

      // Reset to starting position
      rotation.value = 0;
      translateY.value = 0;

      // Coin toss animation
      rotation.value = withDelay(
        delay,
        withSequence(
          // Spin multiple times
          withTiming(1080 + (isHeads ? 0 : 180), {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
          })
        )
      );

      translateY.value = withDelay(
        delay,
        withSequence(
          // Toss up
          withTiming(-80, {
            duration: 400,
            easing: Easing.out(Easing.quad),
          }),
          // Fall down
          withTiming(0, {
            duration: 800,
            easing: Easing.in(Easing.bounce),
          })
        )
      );

      // Reveal result and call onComplete after animation finishes
      setTimeout(() => {
        setShowResult(true);
        if (onComplete) {
          onComplete();
        }
      }, delay + 1250);
    }
  }, [animate, animationVersion, isHeads, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotateY: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // During animation, show neutral color. After animation, show result
  const coinColor = showResult
    ? (isHeads ? styles.headsColor : styles.tailsColor)
    : styles.animatingColor;

  return (
    <Animated.View style={[styles.coin, animatedStyle]}>
      <View style={[styles.coinFace, coinColor]}>
        <View style={styles.coinInner}>
          {/* Simple representation - can be replaced with images */}
          <View style={styles.coinSymbol} />
        </View>
      </View>
    </Animated.View>
  );
};

interface ThreeCoinTossProps {
  results: [boolean, boolean, boolean]; // [coin1, coin2, coin3] - true = heads
  onTossComplete?: () => void;
  animate: boolean;
}

/**
 * Three Coin Toss Animation
 */
export const ThreeCoinToss: React.FC<ThreeCoinTossProps> = ({
  results,
  onTossComplete,
  animate,
}) => {
  const [completedCoins, setCompletedCoins] = React.useState(0);
  const [animationKey, setAnimationKey] = React.useState(0);

  const handleCoinComplete = () => {
    setCompletedCoins((prev) => {
      const newCount = prev + 1;
      if (newCount === 3 && onTossComplete) {
        setTimeout(() => onTossComplete(), 100);
      }
      return newCount;
    });
  };

  // Reset counter and trigger new animation when results change
  useEffect(() => {
    if (animate) {
      setCompletedCoins(0);
      setAnimationKey(prev => prev + 1);
    }
  }, [animate, results]);

  return (
    <View style={styles.container}>
      <View style={styles.coinsRow}>
        {results.map((isHeads, index) => (
          <View key={`coin-${index}`} style={styles.coinWrapper}>
            <AnimatedCoin
              isHeads={isHeads}
              animate={animate}
              animationVersion={animationKey}
              delay={index * 50} // Slight stagger: 0ms, 50ms, 100ms
              onComplete={handleCoinComplete} // All coins call handleCoinComplete
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 200,
  },
  coinsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    height: 180,
  },
  coinWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: 80,
    height: 180,
  },
  coin: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  coinFace: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  headsColor: {
    backgroundColor: '#FFD700', // Gold for heads (yang)
  },
  tailsColor: {
    backgroundColor: '#C0C0C0', // Silver for tails (yin)
  },
  animatingColor: {
    backgroundColor: '#B8860B', // Dark goldenrod - neutral during animation
  },
  coinInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinSymbol: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});
