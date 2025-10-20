import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Ellipse } from 'react-native-svg';
import { ZodiacIcon } from './ZodiacIcon';

const ZODIAC_SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

const RadionicSpinner = () => {
  // Rotation values for different elements
  const ring1Rotation = useSharedValue(0);
  const ring2Rotation = useSharedValue(0);
  const ellipseAngle = useSharedValue(0);
  const zodiacOpacity = useSharedValue(1);
  const [currentZodiacIndex, setCurrentZodiacIndex] = useState(0);

  // Entrance animation
  const spinnerOpacity = useSharedValue(0);
  const spinnerScale = useSharedValue(0.9);

  useEffect(() => {
    // Entrance animation (staggered slightly after parent)
    spinnerOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    spinnerScale.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    // First ring rotation (5 seconds, counter-clockwise)
    ring1Rotation.value = withRepeat(
      withTiming(-360, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );

    // Second ring rotation (7 seconds)
    ring2Rotation.value = withRepeat(
      withTiming(360, { duration: 7000, easing: Easing.linear }),
      -1,
      false
    );

    // Ellipse planet rotation (8 seconds)
    ellipseAngle.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Function to change zodiac sign (wrapped for runOnJS)
    const changeZodiacSign = () => {
      setCurrentZodiacIndex((prevIndex) => (prevIndex + 1) % ZODIAC_SIGNS.length);
    };

    // Cycle through zodiac symbols with fade animation (3 seconds per symbol)
    const zodiacInterval = setInterval(() => {
      // Fade out
      zodiacOpacity.value = withTiming(0, { duration: 500, easing: Easing.ease }, (finished) => {
        if (finished) {
          // Change zodiac sign in the middle of fade (on JS thread)
          runOnJS(changeZodiacSign)();
          // Fade in
          zodiacOpacity.value = withTiming(1, { duration: 500, easing: Easing.ease });
        }
      });
    }, 3000);

    return () => clearInterval(zodiacInterval);
  }, []);

  const ring1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring1Rotation.value}deg` }],
  }));

  const ring2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ring2Rotation.value}deg` }],
  }));

  const zodiacAnimatedStyle = useAnimatedStyle(() => ({
    opacity: zodiacOpacity.value,
  }));

  const spinnerContainerStyle = useAnimatedStyle(() => ({
    opacity: spinnerOpacity.value,
    transform: [{ scale: spinnerScale.value }],
  }));

  // Calculate planet position on ellipse
  const ellipsePlanetStyle = useAnimatedStyle(() => {
    'worklet';
    const angleInRadians = (ellipseAngle.value * Math.PI) / 180;
    const tiltAngle = -20; // degrees
    const tiltRadians = (tiltAngle * Math.PI) / 180;

    const a = 125; // semi-major axis (horizontal) - wider
    const b = 65; // semi-minor axis (vertical)

    // Calculate position on ellipse
    const xEllipse = a * Math.cos(angleInRadians);
    const yEllipse = b * Math.sin(angleInRadians);

    // Apply rotation to match the tilted ellipse
    const x = xEllipse * Math.cos(tiltRadians) - yEllipse * Math.sin(tiltRadians);
    const y = xEllipse * Math.sin(tiltRadians) + yEllipse * Math.cos(tiltRadians);

    return {
      transform: [
        { translateX: x },
        { translateY: y },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinnerContainer, spinnerContainerStyle]}>
        {/* Elliptical orbit - outermost */}
        <View style={styles.ellipseRing}>
          <Svg width={260} height={150} style={styles.svgContainer}>
            <Ellipse
              cx={130}
              cy={75}
              rx={123}
              ry={63}
              stroke="#F6D99F"
              strokeWidth={2}
              fill="none"
              opacity={0.5}
              rotation={-20}
              origin="130, 75"
            />
          </Svg>
          {/* Planet on ellipse */}
          <Animated.View style={[styles.ellipsePlanet, ellipsePlanetStyle]} />
        </View>

        {/* First ring - full circle */}
        <View style={styles.ring1}>
          <View style={styles.ring1Inner} />
          {/* Planet on first ring */}
          <Animated.View style={[styles.planet1Container, ring1AnimatedStyle]}>
            <View style={styles.planet1} />
          </Animated.View>
        </View>

        {/* Second ring - full circle */}
        <View style={styles.ring2}>
          <View style={styles.ring2Inner} />
          {/* Planet on second ring */}
          <Animated.View style={[styles.planet2Container, ring2AnimatedStyle]}>
            <View style={styles.planet2} />
          </Animated.View>
        </View>

        {/* Center zodiac symbol */}
        <Animated.View style={[styles.centerIcon, zodiacAnimatedStyle]}>
          <ZodiacIcon sign={ZODIAC_SIGNS[currentZodiacIndex]} size={32} color="#F6D99F" />
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  spinnerContainer: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ellipseRing: {
    position: 'absolute',
    width: 260,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  ellipsePlanet: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F6D99F',
  },
  ring1: {
    position: 'absolute',
    width: 192,
    height: 192,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring1Inner: {
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 2,
    borderColor: '#F6D99F',
    opacity: 0.5,
  },
  planet1Container: {
    position: 'absolute',
    width: 192,
    height: 192,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  planet1: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F6D99F',
    marginTop: -6,
  },
  ring2: {
    position: 'absolute',
    width: 144,
    height: 144,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring2Inner: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 2,
    borderColor: '#F6D99F',
    opacity: 0.5,
  },
  planet2Container: {
    position: 'absolute',
    width: 144,
    height: 144,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  planet2: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F6D99F',
    marginTop: -5,
  },
  centerIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    width: 50,
    height: 50,
  },
});

export default RadionicSpinner;
