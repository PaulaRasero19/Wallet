import { useRef, useState } from "react";
import { Alert, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { router } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PreloginLiquidBackground } from "../src/components/prelogin/PreloginLiquidBackground";
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
  const [focused, setFocused] = useState<"name" | "email" | "password" | "confirmPassword" | null>(null);
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

      const { authUser, profile } = useSessionStore.getState();
      if (!authUser || !profile) {
        throw new Error("La cuenta se creó, pero no pudimos abrir su configuración. Iniciá sesión para continuar.");
      }

      Keyboard.dismiss();
      await new Promise((resolve) => setTimeout(resolve, 220));
      router.replace("/setup");
    } catch (error) {
      const message = error instanceof Error ? error.message : t("auth.configMissing");
      setErrors({ form: message });
    }
  }

  const canSubmit = status !== "loading";

  return (
    <View style={styles.screen}>
      <PreloginLiquidBackground variant="register" />
      <ScreenContainer backgroundColor="transparent" style={styles.content}>
        <Header title="" back />
        <Animated.View entering={FadeInUp.duration(440)} style={styles.heading}>
          <Text accessibilityRole="header" style={styles.brand}>
            <Text style={styles.brandFin}>Fin</Text>
            <Text style={styles.brandFlow}>Flow</Text>
          </Text>
          <Text style={styles.title}>Crear cuenta</Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(80).duration(460)} style={styles.form}>
        <Text style={styles.label}>Nombre</Text>
        <InputField
          inputRef={nameInputRef}
          accessibilityLabel={t("auth.name")}
          autoComplete="name"
          blurOnSubmit={false}
          editable
          onBlur={() => setFocused(null)}
          onChangeText={(value) => {
            setName(value);
            setErrors((current) => ({ ...current, name: undefined, form: undefined }));
          }}
          onSubmitEditing={() => emailInputRef.current?.focus()}
          onFocus={() => setFocused("name")}
          placeholder="Nombre completo"
          returnKeyType="next"
          style={[styles.input, focused === "name" && styles.inputFocused]}
          textContentType="name"
          value={name}
        />
        {errors.name ? <Text style={styles.message}>{errors.name}</Text> : null}
        <Text style={styles.label}>Correo electrónico</Text>
        <InputField
          inputRef={emailInputRef}
          accessibilityLabel={t("auth.email")}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          blurOnSubmit={false}
          editable
          keyboardType="email-address"
          onBlur={() => setFocused(null)}
          onChangeText={(value) => {
            updateEmail(value);
            setErrors((current) => ({ ...current, email: undefined, form: undefined }));
          }}
          onSubmitEditing={() => passwordInputRef.current?.focus()}
          onFocus={() => setFocused("email")}
          placeholder="Correo electrónico"
          returnKeyType="next"
          style={[styles.input, focused === "email" && styles.inputFocused]}
          textContentType="emailAddress"
          value={email}
        />
        {errors.email ? <Text style={styles.message}>{errors.email}</Text> : null}
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordWrap}>
          <InputField
            inputRef={passwordInputRef}
            accessibilityLabel={t("auth.password")}
            autoComplete="password"
            autoCorrect={false}
            blurOnSubmit={false}
            editable
            onBlur={() => setFocused(null)}
            onChangeText={(value) => {
              setPassword(value);
              setErrors((current) => ({ ...current, password: undefined, confirmPassword: undefined, form: undefined }));
            }}
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            onFocus={() => setFocused("password")}
            placeholder={t("auth.password")}
            returnKeyType="next"
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput, focused === "password" && styles.inputFocused]}
            textContentType="password"
            value={password}
          />
          <Pressable accessibilityLabel={showPassword ? t("auth.hidePassword") : t("auth.showPassword")} accessibilityRole="button" onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
            {showPassword ? <EyeOff color={colors.white} size={20} /> : <Eye color={colors.white} size={20} />}
          </Pressable>
        </View>
        {errors.password ? <Text style={styles.message}>{errors.password}</Text> : null}
        <Text style={styles.label}>Confirmar contraseña</Text>
        <View style={styles.passwordWrap}>
          <InputField
            inputRef={confirmPasswordInputRef}
            accessibilityLabel={t("auth.confirmPassword")}
            autoComplete="password"
            autoCorrect={false}
            editable
            onBlur={() => setFocused(null)}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setErrors((current) => ({ ...current, confirmPassword: undefined, form: undefined }));
            }}
            onFocus={() => setFocused("confirmPassword")}
            placeholder={t("auth.confirmPassword")}
            returnKeyType="done"
            secureTextEntry={!showConfirmPassword}
            style={[styles.input, styles.passwordInput, focused === "confirmPassword" && styles.inputFocused]}
            textContentType="password"
            value={confirmPassword}
          />
          <Pressable accessibilityLabel={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")} accessibilityRole="button" onPress={() => setShowConfirmPassword((current) => !current)} style={styles.eyeButton}>
            {showConfirmPassword ? <EyeOff color={colors.white} size={20} /> : <Eye color={colors.white} size={20} />}
          </Pressable>
        </View>
        {errors.confirmPassword ? <Text style={styles.message}>{errors.confirmPassword}</Text> : null}
        {errors.form ? <Text style={styles.message}>{errors.form}</Text> : null}
        <PrimaryButton disabled={!canSubmit} onPress={submit} style={styles.primary}>{status === "loading" ? "Creando cuenta…" : t("auth.register")}</PrimaryButton>
        <View style={styles.loginBlock}>
          <Text style={styles.loginCopy}>¿Ya tenés una cuenta?{" "}</Text>
          <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.replace("/login")}><Text style={styles.loginLink}>Iniciar sesión</Text></Pressable>
        </View>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#1C1C1B",
    flex: 1
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: 30
  },
  heading: {
    alignItems: "center",
    gap: spacing.xl,
    marginBottom: 34,
    marginTop: 0
  },
  brand: { ...typography.title, fontSize: 25, fontWeight: "700", letterSpacing: -0.7 },
  brandFin: { color: colors.white, fontWeight: "800" },
  brandFlow: { color: colors.brandOrange, fontWeight: "800" },
  form: {
    gap: spacing.sm
  },
  title: {
    ...typography.display,
    color: colors.white,
    fontSize: 34,
    fontWeight: "500",
    lineHeight: 40,
    textAlign: "center"
  },
  input: {
    backgroundColor: "rgba(63,64,59,0.9)",
    borderColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderRadius: 20,
    minHeight: 62,
    paddingHorizontal: 20
  },
  inputFocused: {
    backgroundColor: "rgba(75,75,71,0.96)",
    borderColor: "rgba(255,255,255,0.38)"
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite,
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xs
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
  primary: {
    backgroundColor: "#BDBDBD",
    marginTop: spacing.md,
    minHeight: 62
  },
  loginBlock: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingBottom: spacing.xl,
    paddingTop: spacing.lg
  },
  loginCopy: {
    ...typography.body,
    color: colors.transparentWhite
  },
  loginLink: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700",
    textDecorationLine: "underline"
  }
});
