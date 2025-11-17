import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const useAppearAnimation = (delay = 0) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  const startAnimation = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { opacity, translateY, startAnimation };
};

export const useButtonScale = () => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  return { scale, onPressIn, onPressOut };
};

export const useStaggeredList = (items: any[], delay = 100) => {
  const itemAnimations = useRef(items.map(() => new Animated.Value(0))).current;

  const startAnimation = () => {
    const animations = itemAnimations.map((animation, index) =>
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        delay: index * delay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(delay, animations).start();
  };

  return { itemAnimations, startAnimation };
};