import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { DotLogo } from "../src/components/DotLogo";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { translate } from "../src/i18n";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";

export default function Welcome() {
  const { language, loginDemo, profile, status } = useSessionStore();
  const t = (key: string) => translate(language, key);

  async function startDemo() {
    try {
      await loginDemo();
      router.replace(profile?.onboarding_completed ? "/(tabs)/overview" : "/setup");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : t("auth.configMissing"));
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <DotLogo />
        <Text style={styles.title}>Welcome to{"\n"}FinFlow</Text>
        <Text style={styles.subtitle}>Take control of your finances{"\n"}and time.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton onPress={() => router.push("/register")}>{t("auth.register")}</PrimaryButton>
        <SecondaryButton onPress={startDemo}>{status === "loading" ? t("common.loading") : t("auth.demo")}</SecondaryButton>
        <SecondaryButton onPress={() => router.push("/login")}>{t("auth.login")}</SecondaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl,
    paddingTop: 118
  },
  top: {
    alignItems: "center",
    gap: spacing.lg
  },
  title: {
    ...typography.title,
    fontSize: 25,
    lineHeight: 30,
    textAlign: "center"
  },
  subtitle: {
    ...typography.label,
    color: colors.black,
    textAlign: "center"
  },
  actions: {
    gap: spacing.sm,
    width: "100%"
  }
});
