import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, CircleHelp, CreditCard, LogOut, Settings, Shield, UserRound } from "lucide-react-native";
import { router } from "expo-router";
import { DotLogo } from "../../src/components/DotLogo";
import { ProfileMenuItem } from "../../src/components/ProfileMenuItem";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { languageOptions, translate } from "../../src/i18n";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";

export default function Profile() {
  const clearFinancialData = useFinFlowStore((state) => state.clearFinancialData);
  const { language, logout, profile, setLanguage } = useSessionStore();
  const t = (key: string) => translate(language, key);

  async function submitLogout() {
    try {
      clearFinancialData();
      await logout();
      router.replace("/welcome");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo cerrar sesión.");
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <DotLogo light />
        <View>
          {profile?.is_demo ? <Text style={styles.demo}>{t("dashboard.demoMode")}</Text> : null}
          <Text style={styles.name}>{profile?.full_name || "FinFlow"}</Text>
          <Text style={styles.email}>{profile?.id}</Text>
        </View>
      </View>
      <View style={styles.languagePanel}>
        <Text style={styles.languageTitle}>{t("profile.language")}</Text>
        <View style={styles.languageRow}>
          {languageOptions.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.code}
              onPress={() => void setLanguage(option.code)}
              style={[styles.languageButton, language === option.code && styles.languageButtonActive]}
            >
              <Text style={[styles.languageText, language === option.code && styles.languageTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
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
      <Text onPress={submitLogout} style={styles.logout}>
        {t("profile.logout")}
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
    color: colors.white,
    fontWeight: "600"
  },
  email: {
    ...typography.label,
    color: colors.transparentWhite
  },
  demo: {
    ...typography.label,
    color: colors.orange,
    fontWeight: "700",
    marginBottom: 2
  },
  languagePanel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md
  },
  languageTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600"
  },
  languageRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  languageButton: {
    borderColor: colors.appGrayBorder,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  languageButtonActive: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  languageText: {
    ...typography.label,
    color: colors.white,
    textAlign: "center"
  },
  languageTextActive: {
    color: colors.black
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
