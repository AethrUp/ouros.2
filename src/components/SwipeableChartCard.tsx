import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../styles';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_WIDTH = 120;
const OPEN_THRESHOLD = 60;

interface SwipeableChartCardProps {
  onConfirmDelete: () => Promise<void>;
  onDelete: () => Promise<void>;
  children: React.ReactNode;
}

export const SwipeableChartCard: React.FC<SwipeableChartCardProps> = ({
  onConfirmDelete,
  onDelete,
  children,
}) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const handleDelete = async () => {
    try {
      await onConfirmDelete();

      translateX.value = withTiming(
        -SCREEN_WIDTH,
        { duration: 300 },
        (finished) => {
          if (finished) {
            runOnJS(onDelete)();
          }
        }
      );
    } catch (error) {
      translateX.value = withTiming(0, { duration: 200 });
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newTranslateX = startX.value + event.translationX;
      if (newTranslateX <= 0 && newTranslateX >= -DELETE_WIDTH) {
        translateX.value = newTranslateX;
      }
    })
    .onEnd((event) => {
      const distanceSwiped = Math.abs(translateX.value);
      const shouldOpen = distanceSwiped > OPEN_THRESHOLD || event.velocityX < -500;

      if (shouldOpen) {
        translateX.value = withTiming(-DELETE_WIDTH, { duration: 200 });
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const animatedDeleteStyle = useAnimatedStyle(() => {
    const isDeleting = translateX.value < -DELETE_WIDTH;
    return {
      opacity: translateX.value < -20 ? 1 : 0,
      transform: [{ translateX: isDeleting ? translateX.value : 0 }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.deleteContainer, animatedDeleteStyle]}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={24} color="#FFF" />
          <Text style={styles.deleteText}>DELETE</Text>
        </TouchableOpacity>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedCardStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    height: '100%',
    width: DELETE_WIDTH,
    backgroundColor: '#AF3449',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    ...typography.caption,
    color: '#FFF',
    fontWeight: '700',
    marginTop: spacing.xs,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
