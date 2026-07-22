import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Header } from "../src/components/Header";
import { InsightMetric } from "../src/components/InsightMetric";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { TransactionItem } from "../src/components/TransactionItem";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { getAntExpenses, percentage, positiveAmount } from "../src/utils/financeInsights";
import { formatMoney } from "../src/utils/money";
import { calculateMovementSummary } from "../src/utils/movementSummary";

export default function AntExpenses() {
  const { goals, loadOverview, overview, transactions } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const currency = profile?.primary_currency || "UYU";
  const monthlySummary = calculateMovementSummary({ transactions });
  const ant = useMemo(() => getAntExpenses(monthlySummary.includedExpenses), [monthlySummary.includedExpenses]);
  const total = ant.reduce((sum, transaction) => sum + positiveAmount(transaction), 0);
  const average = ant.length ? total / ant.length : 0;
  const merchant = top(ant.map((transaction) => transaction.merchant));
  const category = top(ant.map((transaction) => String(transaction.category || transaction.title || "Otros")));
  const day = top(ant.map((transaction) => transaction.weekday || "sin día"));
  const hour = top(ant.map((transaction) => (transaction.hour == null ? "sin hora" : `${transaction.hour}:00`)));
  const monthlyPercent = percentage(total, monthlySummary.netExpenses);
  const goal = goals[0];

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Gastos hormiga" back />
      <Text style={styles.lead}>Pequeños gastos repetidos que pueden cambiar tu cierre de mes.</Text>
      <View style={styles.metrics}>
        <InsightMetric label="Total" value={formatMoney(total, currency, false)} />
        <InsightMetric label="Cantidad y promedio" value={`${ant.length} · ${formatMoney(average, currency, false)}`} />
        <InsightMetric label="Comercio principal" value={merchant} meta={`${category} · ${day} · ${hour}`} />
        <InsightMetric label="Peso mensual" value={`${monthlyPercent}%`} meta={`Proyección anual ${formatMoney(total * 12, currency, false)}`} />
      </View>
      <View style={styles.scenarios}>
        <Text style={styles.title}>Escenarios de reducción</Text>
        <Text style={styles.line}>Reducir 25%: ahorrarías {formatMoney(total * 0.25, currency, false)} por mes.</Text>
        <Text style={styles.line}>Reducir 50%: ahorrarías {formatMoney(total * 0.5, currency, false)} por mes.</Text>
        <Text style={styles.line}>Reducir 75%: ahorrarías {formatMoney(total * 0.75, currency, false)} por mes.</Text>
        {goal ? <Text style={styles.line}>Con 50%, aportarías {percentage(total * 0.5, goal.monthlyContribution)}% del aporte mensual de "{goal.name}".</Text> : null}
      </View>
      <Text style={styles.title}>Movimientos detectados</Text>
      {ant.length === 0 ? <Text style={styles.line}>No hay gastos hormiga marcados todavía.</Text> : null}
      {ant.map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} />)}
    </ScreenContainer>
  );
}

function top(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const key = value || "Sin dato";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sin dato";
}

const styles = StyleSheet.create({
  lead: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.lg
  },
  metrics: {
    marginTop: spacing.lg
  },
  scenarios: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700",
    marginTop: spacing.xl
  },
  line: {
    ...typography.body,
    color: colors.transparentWhite
  }
});
