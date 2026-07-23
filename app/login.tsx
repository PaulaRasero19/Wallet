import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { router } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PreloginLiquidBackground } from "../src/components/prelogin/PreloginLiquidBackground";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { translate } from "../src/i18n";
import { colors, spacing, typography } from "../src/theme";
import { useSessionStore } from "../src/store/useSessionStore";

type LoginErrors = { email?: string; password?: string; form?: string };

export default function Login() {
  const { height, width } = useWindowDimensions();
  const compact = height < 760 || width < 360;
  const { language, login, status } = useSessionStore();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<LoginErrors>({});
  const [focused, setFocused] = useState<"email" | "password" | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const t = (key: string) => translate(language, key);

  function validate() {
    const nextErrors: LoginErrors = {};
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) nextErrors.email = t("auth.emailRequired");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) nextErrors.email = t("auth.invalidEmail");
    if (!password) nextErrors.password = t("auth.passwordRequired");
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
    <View style={styles.screen}>
      <PreloginLiquidBackground variant="login" />
      <ScreenContainer backgroundColor="transparent" style={[styles.content, compact && styles.compactContent]}>
        <Header title="" back />
        <Animated.View entering={FadeInUp.duration(440)} style={[styles.heading, compact && styles.compactHeading]}>
          <Text accessibilityRole="header" style={styles.brand}>
            <Text style={styles.brandFin}>Fin</Text>
            <Text style={styles.brandFlow}>Flow</Text>
          </Text>
          <Text style={[styles.title, compact && styles.compactTitle]}>Iniciar sesión</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(460)} style={[styles.form, compact && styles.compactForm]}>
          <Text style={styles.label}>Correo electrónico</Text>
          <InputField
            accessibilityLabel={t("auth.email")}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onBlur={() => setFocused(null)}
            onChangeText={(value) => {
              setEmail(value.trim().toLowerCase());
              setErrors((current) => ({ ...current, email: undefined, form: undefined }));
            }}
            onFocus={() => setFocused("email")}
            placeholder="Correo electrónico"
            style={[styles.input, focused === "email" && styles.inputFocused]}
            value={email}
          />
          {errors.email ? <Text style={styles.message}>{errors.email}</Text> : null}

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordWrap}>
            <InputField
              key={showPassword ? "password-visible" : "password-hidden"}
              accessibilityLabel={t("auth.password")}
              onBlur={() => setFocused(null)}
              onChangeText={(value) => {
                setPassword(value);
                setErrors((current) => ({ ...current, password: undefined, form: undefined }));
              }}
              onFocus={() => setFocused("password")}
              placeholder="Contraseña"
              secureTextEntry={!showPassword}
              style={[styles.input, styles.passwordInput, focused === "password" && styles.inputFocused]}
              value={password}
            />
            <Pressable accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} accessibilityRole="button" hitSlop={10} onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
              {showPassword ? <EyeOff color={colors.white} size={20} /> : <Eye color={colors.white} size={20} />}
            </Pressable>
          </View>
          {errors.password ? <Text style={styles.message}>{errors.password}</Text> : null}
          {errors.form ? <Text style={styles.message}>{errors.form}</Text> : null}

          <Pressable accessibilityRole="button" onPress={() => router.push("/forgot-password")} style={styles.forgot}>
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <PrimaryButton disabled={status === "loading"} onPress={submit} style={styles.primary}>
            {status === "loading" ? "Iniciando…" : "Iniciar sesión"}
          </PrimaryButton>

          <View style={styles.registerBlock}>
            <Text style={styles.registerCopy}>¿No tenés una cuenta?{" "}</Text>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.replace("/register")}><Text style={styles.registerLink}>Crear cuenta</Text></Pressable>
          </View>
        </Animated.View>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: "#1C1C1B", flex: 1 },
  content: { gap: spacing.md, paddingBottom: 24, paddingHorizontal: 30, zIndex: 1 },
  compactContent: { paddingHorizontal: 22, paddingTop: 12 },
  heading: { alignItems: "center", gap: spacing.xl, marginBottom: 38, marginTop: spacing.sm },
  compactHeading: { gap: spacing.md, marginBottom: 18, marginTop: 0 },
  brand: { ...typography.title, fontSize: 25, fontWeight: "700", letterSpacing: -0.7 },
  brandFin: { color: colors.white, fontWeight: "800" },
  brandFlow: { color: colors.brandOrange, fontWeight: "800" },
  title: { ...typography.display, color: colors.white, fontSize: 34, fontWeight: "500", lineHeight: 40, textAlign: "center" },
  compactTitle: { fontSize: 30, lineHeight: 34 },
  form: { gap: spacing.sm },
  compactForm: { gap: 6 },
  label: { ...typography.label, color: colors.transparentWhite, fontSize: 13, fontWeight: "700", marginTop: spacing.xs },
  input: { backgroundColor: "rgba(63,64,59,0.9)", borderColor: "rgba(255,255,255,0.15)", borderRadius: 20, borderWidth: 1, minHeight: 62, paddingHorizontal: 20 },
  inputFocused: { backgroundColor: "rgba(75,75,71,0.96)", borderColor: "rgba(255,255,255,0.38)" },
  passwordWrap: { position: "relative" },
  passwordInput: { paddingRight: 52 },
  eyeButton: { alignItems: "center", bottom: 0, elevation: 3, justifyContent: "center", position: "absolute", right: 0, top: 0, width: 58, zIndex: 4 },
  message: { ...typography.body, color: "#D65B54" },
  forgot: { alignSelf: "flex-end", paddingVertical: spacing.xs },
  forgotText: { ...typography.label, color: colors.transparentWhite, fontWeight: "600" },
  primary: { backgroundColor: "#BDBDBD", marginTop: spacing.md, minHeight: 62 },
  registerBlock: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: 24, paddingBottom: spacing.md },
  registerCopy: { ...typography.body, color: colors.transparentWhite },
  registerLink: { ...typography.body, color: colors.white, fontWeight: "700", textDecorationLine: "underline" }
});
