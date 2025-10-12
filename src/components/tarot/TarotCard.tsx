import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { TarotCard as TarotCardType } from '../../types/tarot';
import { theme } from '../../styles/theme';
import CardBackSvg from '../../../assets/tarot/rider-waite/card-back.svg';

interface TarotCardProps {
  card?: TarotCardType;
  isRevealed: boolean;
  onReveal?: () => void;
  orientation?: 'upright' | 'reversed';
  positionName?: string;
  size?: 'small' | 'medium' | 'large';
  isSelected?: boolean;
}

export const TarotCard: React.FC<TarotCardProps> = ({
  card,
  isRevealed,
  onReveal,
  orientation = 'upright',
  positionName,
  size = 'medium',
  isSelected = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected]);

  const sizeStyles = getSizeStyles(size);
  const dimensions = getDimensions(size);

  return (
    <TouchableOpacity
      activeOpacity={onReveal ? 0.7 : 1}
      onPress={onReveal}
      disabled={!onReveal || isRevealed}
    >
      <Animated.View
        style={[
          sizeStyles.container,
          isSelected && styles.selected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Show back if not revealed */}
        {!isRevealed && (
          <View style={[styles.cardFace, sizeStyles.container, styles.cardBack]}>
            <CardBackSvg
              width={dimensions.width}
              height={dimensions.height}
            />
          </View>
        )}

        {/* Show front if revealed */}
        {isRevealed && (
          <View
            style={[
              styles.cardFace,
              sizeStyles.container,
              styles.cardFront,
              orientation === 'reversed' && styles.reversed,
            ]}
            onLayout={(e) => {
              console.log('📐 Card Front Container Layout:', {
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
                x: e.nativeEvent.layout.x,
                y: e.nativeEvent.layout.y,
              });
            }}
          >
            {card && card.imageUri && (
              (() => {
                const SvgComponent = card.imageUri;
                console.log('🎴 TarotCard DEBUG:', {
                  cardName: card.name,
                  cardId: card.id,
                  hasImageUri: !!card.imageUri,
                  imageUriType: typeof card.imageUri,
                  isFunction: typeof SvgComponent === 'function',
                  dimensions: dimensions,
                  size: size,
                  orientation: orientation,
                  isRevealed: isRevealed,
                });

                // Check if it's an SVG component or an image source
                if (typeof SvgComponent === 'function') {
                  console.log('✅ Rendering SVG component:', card.name, `${dimensions.width}x${dimensions.height}`);
                  return (
                    <SvgComponent
                      width={dimensions.width}
                      height={dimensions.height}
                    />
                  );
                } else if (typeof SvgComponent === 'number') {
                  // SVG imported as asset (number ID) - need to use Image with proper source
                  console.log('📷 Rendering SVG as Image asset:', card.name, 'assetId:', SvgComponent);
                  return (
                    <Image
                      source={SvgComponent}
                      style={[sizeStyles.image, { width: dimensions.width, height: dimensions.height }]}
                      resizeMode="contain"
                      onLoad={() => console.log('✅ Image loaded successfully:', card.name)}
                      onError={(e) => console.error('❌ Image load error:', card.name, e.nativeEvent.error)}
                      onLayout={(e) => console.log('📐 Image layout:', card.name, e.nativeEvent.layout)}
                    />
                  );
                } else {
                  console.log('📷 Rendering Image component:', card.name);
                  return (
                    <Image
                      source={SvgComponent}
                      style={sizeStyles.image}
                      resizeMode="contain"
                    />
                  );
                }
              })()
            )}
            {!card && (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>?</Text>
              </View>
            )}
            {!card?.imageUri && card && (
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>NO IMAGE</Text>
                <Text style={styles.positionText}>{card.name}</Text>
              </View>
            )}
          </View>
        )}

        {positionName && (
          <Text style={[sizeStyles.positionText, styles.positionText]}>
            {positionName}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const getDimensions = (size: 'small' | 'medium' | 'large') => {
  const dimensions = {
    small: { width: 80, height: 140 },
    medium: { width: 120, height: 210 },
    large: { width: 160, height: 280 },
  };
  return dimensions[size];
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  const dim = getDimensions(size);

  return StyleSheet.create({
    container: {
      width: dim.width,
      height: dim.height,
      borderRadius: theme.borderRadius.md,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: theme.borderRadius.md,
    },
    positionText: {
      fontSize: size === 'small' ? 10 : size === 'large' ? 14 : 12,
    },
  });
};

const styles = StyleSheet.create({
  cardFace: {
    // No absolute positioning - cards are stacked via conditional rendering
  },
  cardBack: {
    backgroundColor: theme.colors.background.card,
    borderWidth: 3,
    borderColor: '#D4AF37', // Gold
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardFront: {
    backgroundColor: theme.colors.background.card,
    borderWidth: 2,
    borderColor: theme.colors.text.primary,
    overflow: 'hidden',
  },
  reversed: {
    transform: [{ rotate: '180deg' }],
  },
  selected: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    color: theme.colors.text.secondary,
    fontFamily: 'Libre Baskerville',
  },
  positionText: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
});
