import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Platform, I18nManager } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ErrorBoundary } from "./error-boundary";
import { useThemeColor } from '@/hooks/useThemeColor';

// Import test functions for debugging
import { testTimerLogic } from '../utils/timerTest';
import { testSupersetLogic } from '../utils/supersetTest'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

// Enable RTL for the entire app
if (Platform.OS !== 'web') {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });
  const backgroundColor = useThemeColor({}, 'background');

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  // Get theme colors for Stack navigator
  const stackBackgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: stackBackgroundColor },
        headerTintColor: textColor,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="create-workout" 
        options={{ 
          title: "הוסף אימון חדש",
          headerTitleAlign: 'center',
        }} 
      />
      <Stack.Screen 
        name="workout/[id]" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}