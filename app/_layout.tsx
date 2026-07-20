import "react-native-gesture-handler";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFinFlowStore } from "../src/store/useFinFlowStore";

export default function RootLayout() {
  const hydrate = useFinFlowStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="settings/[section]" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
