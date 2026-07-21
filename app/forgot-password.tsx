import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { translate } from "../src/i18n";
import { useSessionStore } from "../src/store/useSessionStore";
import { spacing, typography } from "../src/theme";

export default function ForgotPassword() {
  const { language, recoverPassword } = useSessionStore();
  const [email, setEmail] = useState("");
  const t = (key: string) => translate(language, key);

  async function submit() {
    if (!email.includes("@")) {
      Alert.alert("FinFlow", t("auth.invalidEmail"));
      return;
    }

    try {
      await recoverPassword(email.trim());
      Alert.alert("FinFlow", t("auth.recoverySent"));
      router.back();
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : t("auth.configMissing"));
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <Header title={t("auth.forgot")} back />
      <View style={styles.form}>
        <Text style={styles.title}>Reset access</Text>
        <Text style={styles.copy}>Enter your email and Supabase will send a recovery message.</Text>
        <InputField accessibilityLabel={t("auth.email")} autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder={t("auth.email")} value={email} />
        <PrimaryButton onPress={submit}>Send recovery link</PrimaryButton>
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
    ...typography.display
  },
  copy: {
    ...typography.body
  }
});
