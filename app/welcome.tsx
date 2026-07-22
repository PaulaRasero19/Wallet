import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { DotLogo } from "../src/components/DotLogo";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { translate } from "../src/i18n";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";

export default function Welcome() {
  const { language } = useSessionStore();
  const t = (key: string) => translate(language, key);

  return (
    <View style={styles.screen}>
      <View style={styles.top}>
        <DotLogo light />
        <Text style={styles.title}>FinFlow</Text>
        <Text style={styles.subtitle}>Organizá tu plata, tus pagos{"\n"}y tus metas en un solo lugar.</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton onPress={() => router.push("/register")}>{t("auth.register")}</PrimaryButton>
        <SecondaryButton onPress={() => router.push("/login")}>{t("auth.login")}</SecondaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: colors.appGray,
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
    color: colors.white,
    fontSize: 25,
    lineHeight: 30,
    textAlign: "center"
  },
  subtitle: {
    ...typography.label,
    color: colors.transparentWhite,
    textAlign: "center"
  },
  actions: {
    gap: spacing.sm,
    width: "100%"
  }
});
