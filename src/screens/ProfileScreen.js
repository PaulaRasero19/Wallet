import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { colors, spacing } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";

export function ProfileScreen({ navigation }) {
  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Perfil</Text>
      <Text style={globalStyles.subtitle}>Perfil conectado a autenticacion real en la app activa.</Text>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Nombre</Text>
          <Text style={styles.value}>Sin datos locales</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>Gestionado por Supabase Auth</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Moneda</Text>
          <Text style={styles.value}>Gestionada por profiles</Text>
        </View>
      </Card>

      <AppButton title="Configurar notificaciones" onPress={() => navigation.navigate("Notifications")} style={styles.button} />
      <AppButton title="Objetivos de ahorro" onPress={() => navigation.navigate("Goals")} variant="secondary" style={styles.button} />
      <AppButton title="Suscripciones" onPress={() => navigation.navigate("Subscriptions")} variant="secondary" style={styles.button} />
      <AppButton title="Cerrar sesion" onPress={() => {}} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  label: {
    color: colors.muted,
    fontSize: 13
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 3
  },
  button: {
    marginBottom: spacing.sm,
    marginTop: spacing.md
  }
});
