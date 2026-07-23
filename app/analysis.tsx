import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Header } from "../src/components/Header";
import { InsightMetric } from "../src/components/InsightMetric";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { categorySummary, overviewMetrics } from "../src/utils/financeInsights";
import { formatMoney } from "../src/utils/money";
import { calculateMovementSummary } from "../src/utils/movementSummary";

export default function Analysis() {
  const { accounts, creditCards, events, goals, loadOverview, overview, recurringPayments, transactions } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const currency = profile?.primary_currency || "UYU";

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  const metrics = overviewMetrics({
    accounts,
    creditCards,
    events,
    goals,
    monthlyIncome: Number(profile?.monthly_income || 0),
    overview,
    payday: profile?.payday,
    primaryCurrency: currency,
    recurringPayments,
    transactions
  });
  const monthlySummary = calculateMovementSummary({ transactions });
  const categories = useMemo(() => categorySummary(monthlySummary.includedExpenses).slice(0, 6), [monthlySummary.includedExpenses]);
  const fixed = recurringPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const variable = Math.max(0, monthlySummary.netExpenses - fixed);
  const antExpenses = monthlySummary.includedExpenses.filter((transaction) => transaction.isAntExpense || transaction.is_ant_expense);
  const antTotal = antExpenses.reduce((sum, transaction) => sum + Math.abs(Number(transaction.rawAmount ?? transaction.raw_amount ?? transaction.amount ?? 0)), 0);

  return (
    <ScreenContainer>
      <Header title="Análisis financiero" back />
      <View style={styles.grid}>
        <InsightMetric label="Ingresos" value={formatMoney(monthlySummary.actualIncome, currency, false)} />
        <InsightMetric label="Gastos" value={formatMoney(monthlySummary.netExpenses, currency, false)} />
        <InsightMetric label="Saldo" value={formatMoney(monthlySummary.balance, currency, true)} />
        <InsightMetric label="Ahorro estimado" value={formatMoney(Math.max(0, metrics.available), currency, false)} />
      </View>

      <Section title="Categorías">
        {categories.length ? (
          categories.map((category) => (
            <View key={category.name} style={styles.row}>
              <Text style={styles.rowTitle}>{category.name}</Text>
              <Text style={styles.rowMeta}>
                {formatMoney(category.total, currency, false)} · {category.percent}%
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Registrá movimientos para ver categorías.</Text>
        )}
      </Section>

      <Section title="Fijos vs variables">
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Gastos fijos</Text>
          <Text style={styles.rowMeta}>{formatMoney(fixed, currency, false)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowTitle}>Gastos variables</Text>
          <Text style={styles.rowMeta}>{formatMoney(variable, currency, false)}</Text>
        </View>
      </Section>

      <Section title="Gastos hormiga">
        <Text style={styles.body}>
          {antExpenses.length} movimientos · total {formatMoney(antTotal, currency, false)}.
        </Text>
      </Section>
    </ScreenContainer>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...typography.body,
    color: colors.transparentWhite
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite
  },
  grid: {
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  row: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  rowMeta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: 3
  },
  rowTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  section: {
    marginTop: spacing.xl
  },
  title: {
    ...typography.title,
    color: colors.white,
    marginBottom: spacing.sm
  }
});
