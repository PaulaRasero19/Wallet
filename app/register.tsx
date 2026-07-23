import { useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
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
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.content}>
      <Header title={t("auth.register")} back />
      <LinearGradient colors={["#280000", "#A51208", "#EC4205", "#D8B600"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.accent}>
        <Text style={styles.accentEyebrow}>EMPEZÁ HOY</Text>
        <Text style={styles.accentTitle}>Ordená tu plata{"\n"}a tu manera.</Text>
      </LinearGradient>
      <View style={styles.form}>
        <View style={styles.intro}>
          <Text style={styles.title}>Creá tu cuenta</Text>
          <Text style={styles.subtitle}>Solo necesitamos estos datos para preparar tu experiencia.</Text>
        </View>
        <Text style={styles.label}>{t("auth.name")}</Text>
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
          style={styles.input}
          textContentType="name"
          value={name}
        />
        {errors.name ? <Text style={styles.message}>{errors.name}</Text> : null}
        <Text style={styles.label}>{t("auth.email")}</Text>
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
          style={styles.input}
          textContentType="emailAddress"
          value={email}
        />
        {errors.email ? <Text style={styles.message}>{errors.email}</Text> : null}
        <Text style={styles.label}>{t("auth.password")}</Text>
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
            style={[styles.input, styles.passwordInput]}
            textContentType="password"
            value={password}
          />
          <Pressable accessibilityLabel={showPassword ? t("auth.hidePassword") : t("auth.showPassword")} accessibilityRole="button" onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
            {showPassword ? <EyeOff color={colors.white} size={20} /> : <Eye color={colors.white} size={20} />}
          </Pressable>
        </View>
        {errors.password ? <Text style={styles.message}>{errors.password}</Text> : null}
        <Text style={styles.label}>{t("auth.confirmPassword")}</Text>
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
            style={[styles.input, styles.passwordInput]}
            textContentType="password"
            value={confirmPassword}
          />
          <Pressable accessibilityLabel={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")} accessibilityRole="button" onPress={() => setShowConfirmPassword((current) => !current)} style={styles.eyeButton}>
            {showConfirmPassword ? <EyeOff color={colors.white} size={20} /> : <Eye color={colors.white} size={20} />}
          </Pressable>
        </View>
        {errors.confirmPassword ? <Text style={styles.message}>{errors.confirmPassword}</Text> : null}
        {errors.form ? <Text style={styles.message}>{errors.form}</Text> : null}
        <Text style={styles.terms}>Al continuar aceptás que FinFlow organice la información financiera que vos decidas registrar.</Text>
        <PrimaryButton disabled={!canSubmit} onPress={submit} style={styles.primary}>{status === "loading" ? t("common.loading") : t("auth.register")}</PrimaryButton>
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
    height: 170,
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
    fontSize: 34,
    lineHeight: 37,
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
  message: {
    ...typography.body,
    color: colors.negative
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
  },
  terms: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: spacing.sm
  },
  primary: {
    marginTop: spacing.sm,
    minHeight: 58
  }
});
