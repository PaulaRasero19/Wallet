import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.content}>
      <Header title={t("auth.login")} back />
      <LinearGradient colors={["#2A0000", "#B91909", "#F05208", "#D8B600"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.accent}>
        <Text style={styles.accentEyebrow}>FINFLOW</Text>
        <Text style={styles.accentTitle}>Tu plata,{"\n"}más clara.</Text>
      </LinearGradient>
      <View style={styles.form}>
        <View style={styles.intro}>
          <Text style={styles.title}>Qué bueno verte de nuevo</Text>
          <Text style={styles.subtitle}>Ingresá para revisar tus movimientos, pagos y metas.</Text>
        </View>
        <Text style={styles.label}>{t("auth.email")}</Text>
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
          style={styles.input}
          value={email}
        />
        {errors.email ? <Text style={styles.message}>{errors.email}</Text> : null}
        <Text style={styles.label}>{t("auth.password")}</Text>
        <InputField
          accessibilityLabel={t("auth.password")}
          onChangeText={(value) => {
            setPassword(value);
            setErrors((current) => ({ ...current, password: undefined, form: undefined }));
          }}
          placeholder={t("auth.password")}
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {errors.password ? <Text style={styles.message}>{errors.password}</Text> : null}
        {errors.form ? <Text style={styles.message}>{errors.form}</Text> : null}
        <PrimaryButton onPress={submit} style={styles.primary}>{status === "loading" ? t("common.loading") : t("auth.login")}</PrimaryButton>
        <SecondaryButton onPress={() => router.push("/forgot-password")} style={styles.linkButton}>{t("auth.forgot")}</SecondaryButton>
        <View style={styles.registerRow}>
          <Text style={styles.registerCopy}>¿Todavía no tenés cuenta?</Text>
          <SecondaryButton onPress={() => router.push("/register")} style={styles.registerButton}>{t("auth.register")}</SecondaryButton>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg
  },
  accent: {
    borderRadius: 34,
    height: 184,
    justifyContent: "flex-end",
    overflow: "hidden",
    padding: spacing.lg
  },
  accentEyebrow: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "700",
    letterSpacing: 1.8
  },
  accentTitle: {
    ...typography.display,
    color: colors.white,
    fontSize: 38,
    lineHeight: 40,
    marginTop: spacing.xs
  },
  form: {
    gap: spacing.sm
  },
  intro: {
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  title: {
    ...typography.title,
    color: colors.white
  },
  subtitle: {
    ...typography.body,
    color: colors.transparentWhite
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "700",
    marginTop: spacing.xs
  },
  input: {
    backgroundColor: "#595958",
    borderColor: "transparent",
    borderRadius: 22,
    minHeight: 58
  },
  primary: {
    marginTop: spacing.md,
    minHeight: 58
  },
  linkButton: {
    borderWidth: 0,
    minHeight: 40
  },
  registerRow: {
    alignItems: "center",
    borderTopColor: colors.appGrayBorder,
    borderTopWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.md
  },
  registerCopy: {
    ...typography.body,
    color: colors.transparentWhite
  },
  registerButton: {
    borderColor: colors.appGrayBorder,
    minHeight: 46,
    width: "100%"
  },
  message: {
    ...typography.body,
    color: colors.negative
  }
});
