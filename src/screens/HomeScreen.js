import { ScrollView, StyleSheet, Text } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { colors, spacing } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";

export function HomeScreen({ navigation }) {
  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>FinFlow</Text>
      <Text style={globalStyles.subtitle}>Los datos financieros se cargan desde Supabase.</Text>

      <Card style={styles.balanceCard}>
        <Text style={styles.label}>Sin datos financieros locales.</Text>
        <Text style={styles.percent}>La pantalla activa esta en app/(tabs)/overview.</Text>
      </Card>

      <AppButton title="Ver insights de IA" onPress={() => navigation.navigate("IA")} style={styles.action} />
      <AppButton title="Notificaciones inteligentes" onPress={() => navigation.navigate("Notifications")} variant="secondary" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    marginTop: spacing.md
  },
  label: {
    color: colors.muted,
    fontSize: 14
  },
  percent: {
    color: colors.muted,
    marginTop: spacing.sm
  },
  action: {
    marginBottom: spacing.sm
  }
});
