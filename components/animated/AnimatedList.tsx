import React, { useEffect } from 'react';
import { Animated, ViewStyle, StyleProp, View } from 'react-native';

interface AnimatedListProps {
  children: React.ReactNode[];
  style?: StyleProp<ViewStyle>;
  itemDelay?: number;
  initialDelay?: number;
}

const AnimatedList = ({
  children,
  style,
  itemDelay = 100,
  initialDelay = 0,
}: AnimatedListProps) => {
  const animations = children.map(() => new Animated.Value(0));

  useEffect(() => {
    const staggerAnimations = animations.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: initialDelay + i * itemDelay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(itemDelay, staggerAnimations).start();
  }, [children.length]);

  return (
    <View style={style}>
      {children.map((child, index) => (
        <Animated.View
          key={index}
          style={{
            opacity: animations[index],
            transform: [
              {
                translateY: animations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          }}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
};

export default AnimatedList;