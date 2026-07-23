import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";

const sections: Record<string, { title: string; rows: Array<{ label: string; value: string }> }> = {
  account: {
    title: "Perfil",
    rows: [
      { label: "Nombre", value: "Se toma de tu cuenta autenticada" },
      { label: "Email", value: "Privado y asociado al usuario" },
      { label: "País", value: "Uruguay" }
    ]
  },
  finance: {
    title: "Finanzas",
    rows: [
      { label: "Moneda principal", value: "Configurada en onboarding" },
      { label: "Próximo ingreso", value: "Según perfil financiero" },
      { label: "Cuentas, tarjetas y categorías", value: "Datos guardados en MongoDB" },
      { label: "Límite de gastos hormiga", value: "Usado para detectar alertas" }
    ]
  },
  notifications: {
    title: "Canales de notificación",
    rows: [
      { label: "Notificaciones de la app", value: "Disponibles con Expo Push Token" },
      { label: "WhatsApp", value: "WhatsApp no está configurado en esta versión." },
      { label: "Email", value: "Preparado como canal futuro" },
      { label: "Horarios silenciosos", value: "Arquitectura preparada" }
    ]
  },
  ai: {
    title: "IA",
    rows: [
      { label: "Análisis personalizado", value: "Usa datos del usuario autenticado" },
      { label: "Uso de datos financieros", value: "Solo backend; nunca Gemini desde Expo" },
      { label: "Historial", value: "No se guarda localmente" }
    ]
  },
  security: {
    title: "Seguridad",
    rows: [
      { label: "Contraseña", value: "Gestionada por autenticación real" },
      { label: "Sesiones", value: "Refresh tokens en backend" },
      { label: "Eliminar cuenta", value: "Requiere flujo explícito" }
    ]
  },
  cards: {
    title: "Tarjetas",
    rows: [
      { label: "Carga manual", value: "Disponible desde Plan" },
      { label: "Importar estado", value: "Preparado para una integración futura" },
      { label: "Conexión bancaria", value: "Futura, no simulada" }
    ]
  },
  general: {
    title: "General",
    rows: [
      { label: "Ayuda", value: "Centro de ayuda de FinFlow" },
      { label: "Privacidad", value: "Datos financieros aislados por userId" },
      { label: "Acerca de FinFlow", value: "Finanzas personales y organización" }
    ]
  }
};

export default function SettingSection() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const profile = useSessionStore((state) => state.profile);
  const page = sections[section || "account"] || sections.account;
  const rows = page.rows.map((row) => {
    if (row.label === "Nombre") return { ...row, value: profile?.full_name || row.value };
    if (row.label === "Moneda principal") return { ...row, value: profile?.primary_currency || row.value };
    if (row.label === "Próximo ingreso") return { ...row, value: profile?.payday ? `Día ${profile.payday} de cada mes` : row.value };
    if (row.label === "Límite de gastos hormiga") return { ...row, value: `$U ${Number(profile?.ant_expense_threshold || 0).toLocaleString("es-UY")}` };
    return row;
  });

  return (
    <ScreenContainer>
      <Header title={page.title} back />
      <View style={styles.panel}>
        {rows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  panel: {
    marginTop: spacing.xl
  },
  row: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  value: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.xs
  }
});
