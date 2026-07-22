import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { translate } from "../src/i18n";
import { colors, spacing, typography } from "../src/theme";
import { useSessionStore } from "../src/store/useSessionStore";

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function Login() {
  const { language, login, status } = useSessionStore();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [password, setPassword] = useState("");
  const t = (key: string) => translate(language, key);

  function validate() {
    const nextErrors: LoginErrors = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      nextErrors.email = t("auth.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = t("auth.invalidEmail");
    }

    if (!password) {
      nextErrors.password = t("auth.passwordRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit() {
    if (!validate()) return;

    try {
      await login(email.trim().toLowerCase(), password);
      const nextProfile = useSessionStore.getState().profile;
      router.replace(nextProfile?.profile_setup_completed || nextProfile?.onboarding_completed ? "/(tabs)/overview" : "/setup");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("auth.configMissing");
      setErrors({ form: message });
      Alert.alert("FinFlow", message);
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <Header title={t("auth.login")} back />
      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>
        <InputField
          accessibilityLabel={t("auth.email")}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={(value) => {
            setEmail(value.trim().toLowerCase());
            setErrors((current) => ({ ...current, email: undefined, form: undefined }));
          }}
          placeholder={t("auth.email")}
          value={email}
        />
        {errors.email ? <Text style={styles.message}>{errors.email}</Text> : null}
        <InputField
          accessibilityLabel={t("auth.password")}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined, form: undefined }));
          }}
          placeholder={t("auth.password")}
          secureTextEntry
          value={password}
        />
        {errors.password ? <Text style={styles.message}>{errors.password}</Text> : null}
        {errors.form ? <Text style={styles.message}>{errors.form}</Text> : null}
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
    color: colors.white,
    marginBottom: spacing.md
  },
  message: {
    ...typography.body,
    color: "#ff4b1f"
  }
});
