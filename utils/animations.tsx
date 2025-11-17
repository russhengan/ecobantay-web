import { Animated } from 'react-native';

// Fade in animation
export const useFadeIn = (duration = 500) => {
  const fadeAnim = new Animated.Value(0);
  
  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return { fadeAnim, fadeIn };
};

// Slide up animation
export const useSlideUp = (duration = 500) => {
  const slideAnim = new Animated.Value(50);
  
  const slideUp = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  };

  return { slideAnim, slideUp };
};

// Scale animation
export const useScale = (duration = 300) => {
  const scaleAnim = new Animated.Value(0.95);
  
  const scaleIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  return { scaleAnim, scaleIn };
};

// Press animation for buttons
export const usePressAnimation = () => {
  const pressAnim = new Animated.Value(1);

  const pressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  return { pressAnim, pressIn, pressOut };
};

// Stagger animation for lists
export const useStaggerAnimation = (items: any[], baseDelay = 100) => {
  const animations = items.map(() => new Animated.Value(0));

  const startStagger = () => {
    const staggerAnimations = animations.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: i * baseDelay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(baseDelay, staggerAnimations).start();
  };

  return { animations, startStagger };
};

// Pulse animation
export const usePulse = (duration = 1500) => {
  const pulseAnim = new Animated.Value(1);

  const startPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]).start(() => startPulse());
  };

  return { pulseAnim, startPulse };
};