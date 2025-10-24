/**
 * Animation Utilities for Framer Motion
 * Replacing React Native Reanimated patterns with web-optimized animations
 */

import { Variants, Transition } from 'framer-motion';

// ===== FADE ANIMATIONS =====

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// ===== SLIDE ANIMATIONS =====

export const slideInLeft: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

export const slideInRight: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
};

export const slideInUp: Variants = {
  initial: { y: 100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 100, opacity: 0 },
};

export const slideInDown: Variants = {
  initial: { y: -100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -100, opacity: 0 },
};

// ===== SCALE ANIMATIONS =====

export const scaleIn: Variants = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  exit: { scale: 0 },
};

export const scaleUp: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

// ===== ROTATION ANIMATIONS =====

export const rotateIn: Variants = {
  initial: { rotate: -180, opacity: 0 },
  animate: { rotate: 0, opacity: 1 },
  exit: { rotate: 180, opacity: 0 },
};

export const flipCard: Variants = {
  front: {
    rotateY: 0,
    transition: { duration: 0.6 },
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.6 },
  },
};

// ===== BOUNCE & SPRING =====

export const bounceIn: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
  exit: { scale: 0, opacity: 0 },
};

// ===== STAGGER CONTAINER =====

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// ===== MODAL ANIMATIONS =====

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
};

// ===== CARD ANIMATIONS =====

export const cardReveal: Variants = {
  initial: {
    rotateY: 180,
    opacity: 0,
  },
  animate: {
    rotateY: 0,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
    },
  },
  tap: {
    scale: 0.95,
  },
};

// ===== TRANSITION PRESETS =====

export const transitions = {
  default: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,

  fast: {
    duration: 0.15,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,

  slow: {
    duration: 0.5,
    ease: [0.4, 0, 0.2, 1],
  } as Transition,

  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
  } as Transition,

  bounce: {
    type: 'spring',
    stiffness: 260,
    damping: 20,
  } as Transition,
};

// ===== SEQUENTIAL FADE-IN (Like HomeScreen) =====

export const sequentialFadeIn = (index: number, delay: number = 0.15) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delay: index * delay,
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
});

// ===== LOADING ANIMATIONS =====

export const pulseAnimation = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.3, 0.6, 0.3],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const spinAnimation = {
  animate: { rotate: 360 },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
};

// ===== GESTURE ANIMATIONS =====

export const swipeableCard: Variants = {
  initial: { x: 0 },
  swipeLeft: {
    x: -300,
    opacity: 0,
    transition: { duration: 0.3 },
  },
  swipeRight: {
    x: 300,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

// ===== ORACLE SPECIFIC ANIMATIONS =====

// Coin Flip Animation
export const coinFlip = {
  initial: { rotateY: 0, rotateX: 0 },
  animate: {
    rotateY: [0, 360, 720, 1080],
    rotateX: [0, 180, 0, 180],
    transition: {
      duration: 1.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Tarot Card Draw
export const tarotDraw: Variants = {
  initial: {
    y: 100,
    opacity: 0,
    rotateZ: -10,
  },
  animate: (custom: number) => ({
    y: 0,
    opacity: 1,
    rotateZ: 0,
    transition: {
      delay: custom * 0.3,
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// I Ching Hexagram Build
export const hexagramLine: Variants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: (custom: number) => ({
    scaleX: 1,
    opacity: 1,
    transition: {
      delay: custom * 0.15,
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

// ===== PAGE TRANSITIONS =====

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: {
      duration: 0.2,
    },
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Create a custom delay for sequential animations
 */
export const withDelay = (delay: number, variants: Variants): Variants => {
  return {
    ...variants,
    animate: {
      ...variants.animate,
      transition: {
        ...(typeof variants.animate === 'object' && 'transition' in variants.animate
          ? variants.animate.transition
          : {}),
        delay,
      },
    },
  };
};

/**
 * Create a loop animation
 */
export const createLoop = (animation: any, duration: number = 1) => ({
  ...animation,
  transition: {
    ...animation.transition,
    repeat: Infinity,
    duration,
  },
});
