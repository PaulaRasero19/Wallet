import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { translate } from "../src/i18n";
import { useSessionStore } from "../src/store/useSessionStore";
import { spacing, typography } from "../src/theme";

export default function Register() {
  const { language, register, status } = useSessionStore();
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [password, setPassword] = useState("");
  const t = (key: string) => translate(language, key);

  async function submit() {
    setFormMessage("");

    if (!name.trim()) {
      setFormMessage(t("auth.name"));
      return;
    }

    if (!email.includes("@")) {
      setFormMessage(t("auth.invalidEmail"));
      return;
    }

    if (password.length < 6) {
      setFormMessage(t("auth.invalidPassword"));
      return;
    }

    try {
      const message = await register(email.trim(), password, name.trim());

      if (message) {
        Alert.alert("FinFlow", message);
        setFormMessage(message);
        router.replace("/login");
        return;
      }

      router.replace("/setup");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("auth.configMissing");
      setFormMessage(message);
    }
  }

  return (
    <ScreenContainer style={styles.content}>
      <Header title={t("auth.register")} back />
      <View style={styles.form}>
        <Text style={styles.title}>Start flowing</Text>
        <InputField
          inputRef={nameInputRef}
          accessibilityLabel={t("auth.name")}
          autoComplete="name"
          blurOnSubmit={false}
          editable
          onChangeText={setName}
          onSubmitEditing={() => emailInputRef.current?.focus()}
          placeholder={t("auth.name")}
          returnKeyType="next"
          textContentType="name"
          value={name}
        />
        <InputField
          inputRef={emailInputRef}
          accessibilityLabel={t("auth.email")}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          blurOnSubmit={false}
          editable
          keyboardType="email-address"
          onChangeText={setEmail}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          placeholder={t("auth.email")}
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        <InputField
          inputRef={passwordInputRef}
          accessibilityLabel={t("auth.password")}
          autoComplete="password"
          autoCorrect={false}
          editable
          onChangeText={setPassword}
          placeholder={t("auth.password")}
          returnKeyType="done"
          secureTextEntry
          textContentType="password"
          value={password}
        />
        {formMessage ? <Text style={styles.message}>{formMessage}</Text> : null}
        <PrimaryButton onPress={submit}>{status === "loading" ? t("common.loading") : t("auth.register")}</PrimaryButton>
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
  },
  message: {
    ...typography.body,
    color: "#ff4b1f"
  }
});
