import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { ProgressBar } from "../components/ProgressBar";
import { colors, spacing } from "../styles/theme";
import { globalStyles } from "../styles/globalStyles";
import { formatCurrency, getProgress } from "../utils/formatters";

const dashboard = {
  totalBalance: 125430,
  monthExpenses: 68900,
  monthlyBudget: 90000,
  savings: 42000,
  income: 45000
};

export function HomeScreen({ navigation }) {
  const budgetProgress = getProgress(dashboard.monthExpenses, dashboard.monthlyBudget);

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Hola, Paula</Text>
      <Text style={globalStyles.subtitle}>Asi viene tu dinero este mes.</Text>

      <Card style={styles.balanceCard}>
        <Text style={styles.label}>Saldo total</Text>
        <Text style={styles.balance}>{formatCurrency(dashboard.totalBalance)}</Text>
        <View style={styles.budgetRow}>
          <Text style={styles.budgetText}>Gastos: {formatCurrency(dashboard.monthExpenses)}</Text>
          <Text style={styles.budgetText}>Presupuesto: {formatCurrency(dashboard.monthlyBudget)}</Text>
        </View>
        <ProgressBar progress={budgetProgress} color={budgetProgress > 85 ? colors.warning : colors.primary} />
        <Text style={styles.percent}>{budgetProgress}% del presupuesto usado</Text>
      </Card>

      <View style={styles.metrics}>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Gastos</Text>
          <Text style={styles.metricValue}>{formatCurrency(dashboard.monthExpenses)}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Ahorro</Text>
          <Text style={styles.metricValue}>{formatCurrency(dashboard.savings)}</Text>
        </Card>
        <Card style={styles.metricCard}>
          <Text style={styles.metricLabel}>Ingresos</Text>
          <Text style={styles.metricValue}>{formatCurrency(dashboard.income)}</Text>
        </Card>
      </View>

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
  balance: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "800",
    marginVertical: spacing.sm
  },
  budgetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
    marginBottom: spacing.sm
  },
  budgetText: {
    color: colors.muted,
    fontSize: 13
  },
  percent: {
    color: colors.muted,
    marginTop: spacing.sm
  },
  metrics: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.md
  },
  metricCard: {
    flex: 1,
    minHeight: 86
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13
  },
  metricValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: spacing.sm
  },
  action: {
    marginBottom: spacing.sm
  }
});
