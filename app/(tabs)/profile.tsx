import { Alert, StyleSheet, Text, View } from "react-native";
import { Bell, Brain, CircleHelp, CreditCard, LogOut, Settings, Shield, UserRound, WalletCards } from "lucide-react-native";
import { router } from "expo-router";
import { ProfileMenuItem } from "../../src/components/ProfileMenuItem";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { FlowMark } from "../../src/components/prelogin/FlowMark";
import { UserAvatar } from "../../src/components/profile/UserAvatar";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, layout, spacing, typography } from "../../src/theme";

export default function Profile() {
  const clearFinancialData = useFinFlowStore((state) => state.clearFinancialData);
  const { authUser, logout, profile } = useSessionStore();

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
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screen}>
      <View style={styles.brand}>
        <FlowMark size={38} />
        <Text style={styles.wordmark}><Text style={styles.wordmarkLight}>Fin</Text><Text style={styles.wordmarkAccent}>Flow</Text></Text>
      </View>
      <View style={styles.profileCard}>
        <UserAvatar fullName={profile?.full_name || "FinFlow"} size={62} uri={profile?.avatar_url || profile?.avatarUrl} />
        <View style={styles.profileCopy}>
          {profile?.is_demo ? <Text style={styles.demo}>MODO DEMOSTRACIÓN</Text> : null}
          <Text style={styles.name}>{profile?.full_name || "FinFlow"}</Text>
          <Text style={styles.email}>{authUser?.email || "Cuenta FinFlow"}</Text>
        </View>
      </View>
      <View style={styles.menu}>
        <ProfileMenuItem icon={UserRound} title="Perfil" description="Nombre, email y país" onPress={() => router.push("/settings/account")} />
        <ProfileMenuItem icon={WalletCards} title="Finanzas" description="Monedas, ingresos, cuentas y categorías" onPress={() => router.push("/settings/finance")} />
        <ProfileMenuItem icon={Bell} title="Notificaciones" description="Push, WhatsApp, email y horarios" onPress={() => router.push("/settings/notifications")} />
        <ProfileMenuItem icon={Brain} title="IA" description="Análisis personalizado e historial" onPress={() => router.push("/settings/ai")} />
        <ProfileMenuItem icon={CreditCard} title="Tarjetas" description="Carga manual e importación futura" onPress={() => router.push("/settings/cards")} />
        <ProfileMenuItem icon={Shield} title="Seguridad" description="Contraseña, sesiones y cuenta" onPress={() => router.push("/settings/security")} />
        <ProfileMenuItem icon={CircleHelp} title="General" description="Ayuda, privacidad y acerca de FinFlow" onPress={() => router.push("/settings/general")} />
        <ProfileMenuItem icon={Settings} title="Todos los ajustes" description="Ver perfil y ajustes completos" onPress={() => router.push("/settings")} />
      </View>
      <Text onPress={submitLogout} style={styles.logout}>
        Cerrar sesión
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: layout.mainScreenTop
  },
  brand: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  wordmark: {
    ...typography.title,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -1
  },
  wordmarkAccent: {
    color: colors.brandOrange
  },
  wordmarkLight: {
    color: colors.white
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: "#292927",
    borderColor: "rgba(191,48,32,0.5)",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: 18
  },
  profileCopy: {
    flex: 1,
    minWidth: 0
  },
  name: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  email: {
    ...typography.label,
    color: colors.transparentWhite
  },
  demo: {
    ...typography.label,
    color: colors.brandOrange,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 3
  },
  menu: {
    marginTop: spacing.lg
  },
  logout: {
    ...typography.label,
    color: colors.brandOrange,
    fontWeight: "800",
    marginTop: spacing.md,
    textAlign: "center"
  }
});
