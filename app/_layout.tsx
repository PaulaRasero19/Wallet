import "react-native-gesture-handler";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";

export default function RootLayout() {
  const clearFinancialData = useFinFlowStore((state) => state.clearFinancialData);
  const initialize = useSessionStore((state) => state.initialize);

  useEffect(() => {
    clearFinancialData();
    void initialize();
  }, [clearFinancialData, initialize]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="language" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="forecast" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="settings/[section]" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
