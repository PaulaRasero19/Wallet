import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, Brain, CircleHelp, CreditCard, LogOut, Settings, Shield, UserRound, WalletCards } from "lucide-react-native";
import { router } from "expo-router";
import { DotLogo } from "../../src/components/DotLogo";
import { ProfileMenuItem } from "../../src/components/ProfileMenuItem";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { languageOptions, translate } from "../../src/i18n";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";

export default function Profile() {
  const clearFinancialData = useFinFlowStore((state) => state.clearFinancialData);
  const { authUser, language, logout, profile, setLanguage } = useSessionStore();
  const t = (key: string) => translate(language, key);

  async function submitLogout() {
    try {
      clearFinancialData();
      await logout();
      router.replace("/welcome");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo cerrar sesión.");
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <DotLogo light />
        <View>
          {profile?.is_demo ? <Text style={styles.demo}>{t("dashboard.demoMode")}</Text> : null}
          <Text style={styles.name}>{profile?.full_name || "FinFlow"}</Text>
          <Text style={styles.email}>{authUser?.email || "Cuenta FinFlow"}</Text>
        </View>
      </View>
      <View style={styles.languagePanel}>
        <Text style={styles.languageTitle}>{t("profile.language")}</Text>
        <View style={styles.languageRow}>
          {languageOptions.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.code}
              onPress={() => void setLanguage(option.code)}
              style={[styles.languageButton, language === option.code && styles.languageButtonActive]}
            >
              <Text style={[styles.languageText, language === option.code && styles.languageTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.menu}>
        <ProfileMenuItem icon={UserRound} title="Perfil" description="Nombre, email, país e idioma" onPress={() => router.push("/settings/account")} />
        <ProfileMenuItem icon={WalletCards} title="Finanzas" description="Monedas, ingresos, cuentas y categorías" onPress={() => router.push("/settings/finance")} />
        <ProfileMenuItem icon={Bell} title="Notificaciones" description="Push, WhatsApp, email y horarios" onPress={() => router.push("/settings/notifications")} />
        <ProfileMenuItem icon={Brain} title="IA" description="Análisis personalizado e historial" onPress={() => router.push("/settings/ai")} />
        <ProfileMenuItem icon={CreditCard} title="Tarjetas" description="Carga manual e importación futura" onPress={() => router.push("/settings/cards")} />
        <ProfileMenuItem icon={Shield} title="Seguridad" description="Contraseña, sesiones y cuenta" onPress={() => router.push("/settings/security")} />
        <ProfileMenuItem icon={CircleHelp} title="General" description="Ayuda, privacidad y acerca de FinFlow" onPress={() => router.push("/settings/general")} />
        <ProfileMenuItem icon={Settings} title="Todos los ajustes" description="Ver perfil y ajustes completos" onPress={() => router.push("/settings")} />
      </View>
      <Text onPress={submitLogout} style={styles.logout}>
        {t("profile.logout")}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg
  },
  name: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600"
  },
  email: {
    ...typography.label,
    color: colors.transparentWhite
  },
  demo: {
    ...typography.label,
    color: colors.orange,
    fontWeight: "700",
    marginBottom: 2
  },
  languagePanel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.xl,
    padding: spacing.md
  },
  languageTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600"
  },
  languageRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  languageButton: {
    borderColor: colors.appGrayBorder,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  languageButtonActive: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  languageText: {
    ...typography.label,
    color: colors.white,
    textAlign: "center"
  },
  languageTextActive: {
    color: colors.black
  },
  menu: {
    marginTop: spacing.xl
  },
  logout: {
    ...typography.label,
    color: colors.orange,
    fontWeight: "600",
    marginTop: spacing.lg
  }
});
