import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Bell, Brain, CircleHelp, CreditCard, Shield, UserRound, WalletCards } from "lucide-react-native";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { colors, spacing, typography } from "../src/theme";

const sections = [
  { icon: UserRound, label: "Perfil", route: "/settings/account", value: "Nombre, email y país" },
  { icon: WalletCards, label: "Finanzas", route: "/settings/finance", value: "Monedas, ingresos, cuentas y categorías" },
  { icon: Bell, label: "Notificaciones", route: "/settings/notifications", value: "Push, WhatsApp, email y horarios" },
  { icon: Brain, label: "IA", route: "/settings/ai", value: "Análisis personalizado e historial" },
  { icon: Shield, label: "Seguridad", route: "/settings/security", value: "Contraseña, sesiones y cuenta" },
  { icon: CreditCard, label: "Tarjetas", route: "/settings/cards", value: "Límites, cierres y vencimientos" },
  { icon: CircleHelp, label: "General", route: "/settings/general", value: "Ayuda, privacidad y acerca de FinFlow" }
] as const;

export default function SettingsIndex() {
  return (
    <ScreenContainer>
      <Header title="Perfil y Ajustes" back />
      <View style={styles.list}>
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Pressable accessibilityRole="button" key={section.label} onPress={() => router.push(section.route as never)} style={styles.row}>
              <View style={styles.icon}>
                <Icon color={colors.white} size={19} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.label}>{section.label}</Text>
                <Text style={styles.value}>{section.value}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  copy: {
    flex: 1,
    minWidth: 0
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  label: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  list: {
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 66,
    paddingVertical: spacing.sm
  },
  value: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: 3
  }
});
