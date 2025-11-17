import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [userIsLoggedIn, setUserIsLoggedIn] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsAuthChecked(true);
      setUserIsLoggedIn(false); // set TRUE after login
    }, 500);
  }, []);

  const onLayout = useCallback(async () => {
    if (loaded && isAuthChecked) {
      await SplashScreen.hideAsync();
    }
  }, [loaded, isAuthChecked]);

  if (!loaded || !isAuthChecked) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <ThemeProvider value={DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            {!userIsLoggedIn ? (
              <Stack.Screen name="index" />    // LOGIN
            ) : (
              <Stack.Screen name="(tabs)" />           // AFTER LOGIN
            )}
          </Stack>
        </ThemeProvider>
      </View>
      <StatusBar hidden />
    </SafeAreaProvider>
  );
}
