import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { translate } from "../src/i18n";
import { spacing, typography } from "../src/theme";
import { useSessionStore } from "../src/store/useSessionStore";

export default function Login() {
  const { language, login, profile, status } = useSessionStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const t = (key: string) => translate(language, key);

  async function submit() {
    if (!email.includes("@")) {
      Alert.alert("FinFlow", t("auth.invalidEmail"));
      return;
    }

    if (password.length < 6) {
      Alert.alert("FinFlow", t("auth.invalidPassword"));
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace(profile?.onboarding_completed ? "/(tabs)/overview" : "/setup");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : t("auth.configMissing"));
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <Header title={t("auth.login")} back />
      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>
        <InputField accessibilityLabel={t("auth.email")} autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder={t("auth.email")} value={email} />
        <InputField accessibilityLabel={t("auth.password")} onChangeText={setPassword} placeholder={t("auth.password")} secureTextEntry value={password} />
        <PrimaryButton onPress={submit}>{status === "loading" ? t("common.loading") : t("auth.login")}</PrimaryButton>
        <SecondaryButton onPress={() => router.push("/forgot-password")}>{t("auth.forgot")}</SecondaryButton>
        <SecondaryButton onPress={() => router.push("/register")}>{t("auth.register")}</SecondaryButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl
  },
  form: {
    gap: spacing.md
  },
  title: {
    ...typography.display,
    marginBottom: spacing.md
  }
});
