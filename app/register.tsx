import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { translate } from "../src/i18n";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";

type RegisterErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

export default function Register() {
  const { language, register, status } = useSessionStore();
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const t = (key: string) => translate(language, key);

  function validate() {
    const nextErrors: RegisterErrors = {};
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      nextErrors.name = t("auth.nameRequired");
    } else if (trimmedName.length < 2) {
      nextErrors.name = t("auth.nameTooShort");
    } else if (trimmedName.length > 80) {
      nextErrors.name = t("auth.nameTooLong");
    }

    if (!normalizedEmail) {
      nextErrors.email = t("auth.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = t("auth.invalidEmail");
    }

    if (!password) {
      nextErrors.password = t("auth.passwordRequired");
    } else if (password.length < 8) {
      nextErrors.password = t("auth.passwordTooShort");
    } else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password)) {
      nextErrors.password = t("auth.passwordNeedsLetter");
    } else if (!/\d/.test(password)) {
      nextErrors.password = t("auth.passwordNeedsNumber");
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t("auth.confirmRequired");
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = t("auth.passwordMismatch");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function updateEmail(value: string) {
    setEmail(value.trim().toLowerCase());
  }

  async function submit() {
    if (!validate()) return;

    try {
      const message = await register(email.trim().toLowerCase(), password, name.trim());

      if (message) {
        Alert.alert("FinFlow", message);
        setErrors({ form: message });
        router.replace("/login");
        return;
      }

      router.replace("/setup");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("auth.configMissing");
      setErrors({ form: message });
    }
  }

  const canSubmit = status !== "loading";

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
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined, form: undefined }));
          }}
          onSubmitEditing={() => emailInputRef.current?.focus()}
          placeholder={t("auth.name")}
          returnKeyType="next"
          textContentType="name"
          value={name}
        />
        {errors.name ? <Text style={styles.message}>{errors.name}</Text> : null}
        <InputField
          inputRef={emailInputRef}
          accessibilityLabel={t("auth.email")}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          blurOnSubmit={false}
          editable
          keyboardType="email-address"
          onChangeText={(value) => {
            updateEmail(value);
            setErrors((current) => ({ ...current, email: undefined, form: undefined }));
          }}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          placeholder={t("auth.email")}
          returnKeyType="next"
          textContentType="emailAddress"
          value={email}
        />
        {errors.email ? <Text style={styles.message}>{errors.email}</Text> : null}
        <View style={styles.passwordWrap}>
          <InputField
            inputRef={passwordInputRef}
            accessibilityLabel={t("auth.password")}
            autoComplete="password"
            autoCorrect={false}
            blurOnSubmit={false}
            editable
            onChangeText={(value) => {
              setPassword(value);
              setErrors((current) => ({ ...current, password: undefined, confirmPassword: undefined, form: undefined }));
            }}
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            placeholder={t("auth.password")}
            returnKeyType="next"
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            textContentType="password"
            value={password}
          />
          <Pressable accessibilityLabel={showPassword ? t("auth.hidePassword") : t("auth.showPassword")} accessibilityRole="button" onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
            {showPassword ? <EyeOff color={colors.grayDark} size={20} /> : <Eye color={colors.grayDark} size={20} />}
          </Pressable>
        </View>
        {errors.password ? <Text style={styles.message}>{errors.password}</Text> : null}
        <View style={styles.passwordWrap}>
          <InputField
            inputRef={confirmPasswordInputRef}
            accessibilityLabel={t("auth.confirmPassword")}
            autoComplete="password"
            autoCorrect={false}
            editable
            onChangeText={(value) => {
              setConfirmPassword(value);
              setErrors((current) => ({ ...current, confirmPassword: undefined, form: undefined }));
            }}
            placeholder={t("auth.confirmPassword")}
            returnKeyType="done"
            secureTextEntry={!showConfirmPassword}
            style={styles.passwordInput}
            textContentType="password"
            value={confirmPassword}
          />
          <Pressable accessibilityLabel={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")} accessibilityRole="button" onPress={() => setShowConfirmPassword((current) => !current)} style={styles.eyeButton}>
            {showConfirmPassword ? <EyeOff color={colors.grayDark} size={20} /> : <Eye color={colors.grayDark} size={20} />}
          </Pressable>
        </View>
        {errors.confirmPassword ? <Text style={styles.message}>{errors.confirmPassword}</Text> : null}
        {errors.form ? <Text style={styles.message}>{errors.form}</Text> : null}
        <PrimaryButton disabled={!canSubmit} onPress={submit}>{status === "loading" ? t("common.loading") : t("auth.register")}</PrimaryButton>
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
  },
  passwordWrap: {
    position: "relative"
  },
  passwordInput: {
    paddingRight: 52
  },
  eyeButton: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    right: 0,
    top: 0,
    width: 52,
    zIndex: 2
  }
});
