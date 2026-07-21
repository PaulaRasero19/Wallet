import { useEffect } from "react";
import { Text, View } from "react-native";
import { Tabs } from "expo-router";
import { router } from "expo-router";
import { BottomNavigation } from "../../src/components/BottomNavigation";
import { useSessionStore } from "../../src/store/useSessionStore";

export default function TabLayout() {
  const { profile, status } = useSessionStore();

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated") {
      router.replace("/welcome");
      return;
    }

    if (!profile?.onboarding_completed) {
      router.replace("/setup");
    }
  }, [profile?.onboarding_completed, status]);

  if (status === "loading" || status !== "authenticated" || !profile?.onboarding_completed) {
    return (
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text>Loading FinFlow...</Text>
      </View>
    );
  }

  return (
    <Tabs tabBar={(props) => <BottomNavigation {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="overview" options={{ title: "Overview" }} />
      <Tabs.Screen name="transactions" options={{ title: "Transactions" }} />
      <Tabs.Screen name="add" options={{ title: "Add" }} />
      <Tabs.Screen name="planner" options={{ title: "Planner" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
