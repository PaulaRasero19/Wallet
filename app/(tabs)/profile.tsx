import { Alert, StyleSheet, Text, View } from "react-native";
import { Bell, CircleHelp, CreditCard, LogOut, Settings, Shield, UserRound } from "lucide-react-native";
import { router } from "expo-router";
import { DotLogo } from "../../src/components/DotLogo";
import { ProfileMenuItem } from "../../src/components/ProfileMenuItem";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";

export default function Profile() {
  const user = useFinFlowStore((state) => state.user);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <DotLogo />
        <View>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>
      <View style={styles.menu}>
        <ProfileMenuItem icon={UserRound} title="Account" description="Manage your account" onPress={() => router.push("/settings/account")} />
        <ProfileMenuItem icon={Settings} title="Preferences" description="App settings and preferences" onPress={() => router.push("/settings/preferences")} />
        <ProfileMenuItem icon={Bell} title="Notifications" description="Manage alerts and reminders" onPress={() => router.push("/settings/notifications")} />
        <ProfileMenuItem icon={CreditCard} title="Bank accounts" description="Manage connected accounts" onPress={() => router.push("/settings/bank-accounts")} />
        <ProfileMenuItem icon={Shield} title="Security" description="Password and biometric" onPress={() => router.push("/settings/security")} />
        <ProfileMenuItem icon={CircleHelp} title="Help & Support" description="FAQs and contact us" onPress={() => router.push("/settings/help")} />
      </View>
      <Text onPress={() => Alert.alert("FinFlow", "Demo log out action.")} style={styles.logout}>
        Log Out
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  name: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600"
  },
  email: {
    ...typography.label
  },
  menu: {
    marginTop: spacing.xl
  },
  logout: {
    ...typography.label,
    color: colors.orange,
    fontWeight: "600",
    marginTop: spacing.lg
  }
});
