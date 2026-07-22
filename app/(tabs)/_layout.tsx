import { useEffect } from "react";
import { Text, View } from "react-native";
import { Tabs } from "expo-router";
import { router } from "expo-router";
import { FloatingTabBar } from "../../src/components/navigation/FloatingTabBar";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors } from "../../src/theme";

export default function TabLayout() {
  const { profile, status } = useSessionStore();

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      router.replace("/welcome");
      return;
    }

    if (!(profile?.profile_setup_completed || profile?.onboarding_completed)) {
      router.replace("/setup");
    }
  }, [profile?.onboarding_completed, profile?.profile_setup_completed, status]);

  if (status === "loading" || status !== "authenticated" || !(profile?.profile_setup_completed || profile?.onboarding_completed)) {
    return (
      <View style={{ backgroundColor: colors.black, flex: 1, justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.white }}>Loading FinFlow...</Text>
      </View>
    );
  }

  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.black } }}>
      <Tabs.Screen name="overview" options={{ title: "Inicio" }} />
      <Tabs.Screen name="transactions" options={{ title: "Movimientos" }} />
      <Tabs.Screen name="add" options={{ title: "Agregar" }} />
      <Tabs.Screen name="plan" options={{ title: "Plan" }} />
      <Tabs.Screen name="ai" options={{ title: "IA" }} />
      <Tabs.Screen name="settings" options={{ href: null, title: "Ajustes" }} />
      <Tabs.Screen name="planner" options={{ href: null, title: "Plan" }} />
      <Tabs.Screen name="profile" options={{ href: null, title: "Perfil" }} />
    </Tabs>
  );
}
