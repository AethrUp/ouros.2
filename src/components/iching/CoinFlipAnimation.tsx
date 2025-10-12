/**
 * I Ching Coin Flip Animation Component
 * Simple 3-coin simultaneous flip animation
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
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
  const resultOpacity = useSharedValue(0); // For crossfade effect
  const [showResult, setShowResult] = React.useState(false);

  useEffect(() => {
    if (animate) {
      // Hide result during animation
      setShowResult(false);

      // Reset to starting position
      rotation.value = 0;
      translateY.value = 0;
      resultOpacity.value = 0; // Start with casting image visible

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

      // Crossfade to result after animation finishes
      setTimeout(() => {
        setShowResult(true);
        // Fade in the result image
        resultOpacity.value = withTiming(1, {
          duration: 400,
          easing: Easing.inOut(Easing.ease),
        });
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

  const resultAnimatedStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  // Result image (heads or tails)
  const resultImage = isHeads
    ? require('../../../assets/iching/coinHeads.png')
    : require('../../../assets/iching/coinTails.png');

  return (
    <Animated.View style={[styles.coin, animatedStyle]}>
      {/* Casting image - always visible during flip */}
      <Image
        source={require('../../../assets/iching/coincasting.png')}
        style={styles.coinImage}
        resizeMode="cover"
      />
      {/* Result image - fades in when showResult is true */}
      {showResult && (
        <Animated.Image
          source={resultImage}
          style={[styles.coinImage, styles.coinImageAbsolute, resultAnimatedStyle]}
          resizeMode="cover"
        />
      )}
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
    borderWidth: 2,
    borderColor: '#F6DAA1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden', // Ensures image is clipped to borderRadius
  },
  coinImage: {
    width: '100%',
    height: '100%',
  },
  coinImageAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
