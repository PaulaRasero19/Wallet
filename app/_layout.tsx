import "react-native-gesture-handler";
import { useEffect } from "react";
import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors } from "../src/theme";

export default function RootLayout() {
  const clearFinancialData = useFinFlowStore((state) => state.clearFinancialData);
  const initialize = useSessionStore((state) => state.initialize);

  useEffect(() => {
    clearFinancialData();
    void initialize();
  }, [clearFinancialData, initialize]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      const type = String(data.relatedEntityType || "");
      const id = String(data.relatedEntityId || data.id || "");
      if (!id) return;
      if (type === "payment") router.push({ pathname: "/payment/[id]", params: { id } });
      if (type === "installment") router.push({ pathname: "/installment/[id]", params: { id, installmentId: String(data.installmentId || "") } });
      if (type === "card") router.push({ pathname: "/card/[id]", params: { id } });
      if (type === "transaction") router.push({ pathname: "/transaction/[id]", params: { id } });
      if (type === "goal") router.push({ pathname: "/goal/[id]", params: { id } });
    });
    return () => subscription.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ backgroundColor: colors.black, flex: 1 }}>
      <StatusBar backgroundColor="transparent" translucent style="light" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: colors.black }, headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="language" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="setup" />
        <Stack.Screen name="statistics" />
        <Stack.Screen name="ant-expenses" />
        <Stack.Screen name="plan" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="forecast" />
        <Stack.Screen name="goals" />
        <Stack.Screen name="insights" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="settings/[section]" />
        <Stack.Screen name="analysis" />
        <Stack.Screen name="transaction/[id]" />
        <Stack.Screen name="goal/[id]" />
        <Stack.Screen name="card/[id]" />
        <Stack.Screen name="payment/[id]" />
        <Stack.Screen name="installment/[id]" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
