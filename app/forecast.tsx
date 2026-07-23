import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ForecastScenarioCard } from "../src/components/ForecastScenarioCard";
import { Header } from "../src/components/Header";
import { RecurringDetectionItem } from "../src/components/RecurringDetectionItem";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { buildForecast } from "../src/services/forecastService";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";
import { formatUYU } from "../src/utils/money";

export default function Forecast() {
  const {
    accounts,
    budgets,
    confirmRecurringPayment,
    creditCards,
    exchangeRates,
    goals,
    recurringPayments,
    rejectRecurringPayment,
    transactions
  } = useFinFlowStore();
  const loadOverview = useFinFlowStore((state) => state.loadOverview);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);
  const hasFinancialData = accounts.length > 0 || transactions.length > 0 || budgets.length > 0 || goals.length > 0;
  const forecast = useMemo(
    () =>
      buildForecast({
        accounts,
        budgets,
        creditCards,
        exchangeRates,
        goals,
        recurringPayments,
        transactions
      }),
    [accounts, budgets, creditCards, exchangeRates, goals, recurringPayments, transactions]
  );

  return (
    <ScreenContainer>
      <Header title="FinFlow Forecast" back />
      {!hasFinancialData ? (
        <View style={styles.panel}>
          <Text style={styles.section}>Sin datos financieros reales</Text>
          <Text style={styles.detail}>La proyección se habilitará cuando existan cuentas, movimientos y pagos reales en MongoDB.</Text>
        </View>
      ) : (
        <>
      <Text style={styles.question}>How will I finish the month?</Text>

      <View style={styles.summary}>
        <Metric label="Really available" value={formatUYU(forecast.realAvailable, false)} />
        <Metric label="Projected end balance" value={formatUYU(forecast.projectedEndBalance, false)} />
        <Metric label="Daily limit" value={formatUYU(forecast.dailyLimit, false)} />
        <Metric label="Days to income" value={`${forecast.daysUntilIncome}`} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.section}>Money map</Text>
        <Line label="Current balance" value={forecast.currentBalance} />
        <Line label="Expected income" value={forecast.expectedIncome} />
        <Line label="Accumulated expenses" value={forecast.accumulatedExpenses} />
        <Line label="Pending fixed payments" value={forecast.pendingFixedPayments} />
        <Line label="Pending subscriptions" value={forecast.pendingSubscriptions} />
        <Line label="Future installments" value={forecast.pendingInstallments} />
        <Line label="Committed savings" value={forecast.committedSavings} />
      </View>

      <Text style={styles.section}>Scenarios</Text>
      <View style={styles.scenarios}>
        {forecast.scenarios.map((scenario) => (
          <ForecastScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </View>

      <View style={styles.panel}>
        <Text style={styles.section}>Advanced ant expenses</Text>
        <Text style={styles.antText}>
          Your ant expenses add up to {formatUYU(forecast.antExpenses.total, false)} across {forecast.antExpenses.count} purchases.
        </Text>
        <Text style={styles.detail}>Average: {formatUYU(forecast.antExpenses.average, false)}</Text>
        <Text style={styles.detail}>Main merchant: {forecast.antExpenses.mainMerchant}</Text>
        <Text style={styles.detail}>Main category: {forecast.antExpenses.mainCategory}</Text>
        <Text style={styles.detail}>
          Pattern: {forecast.antExpenses.frequentDay}, {forecast.antExpenses.frequentTime}
        </Text>
        <Text style={styles.detail}>Annual projection: {formatUYU(forecast.antExpenses.annualProjection, false)}</Text>
        <Text style={styles.detail}>
          Save 25/50/75%: {formatUYU(forecast.antExpenses.savings25, false)} · {formatUYU(forecast.antExpenses.savings50, false)} ·{" "}
          {formatUYU(forecast.antExpenses.savings75, false)}
        </Text>
        <Text style={styles.goal}>{forecast.antExpenses.goalRelation}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.section}>Recurring payments detected</Text>
        {recurringPayments.map((payment) => (
          <RecurringDetectionItem
            key={payment.id}
            payment={payment}
            onConfirm={() => confirmRecurringPayment(payment.id)}
            onReject={() => rejectRecurringPayment(payment.id)}
          />
        ))}
      </View>

      <Text style={styles.disclaimer}>
        FinFlow calcula estas proyecciones desde datos persistidos en MongoDB. Las recomendaciones son educativas y no reemplazan asesoramiento financiero profesional.
      </Text>
        </>
      )}
    </ScreenContainer>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Line({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineValue}>{formatUYU(value, false)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  question: {
    ...typography.display,
    color: colors.white,
    fontSize: 34,
    marginTop: spacing.xl
  },
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  metric: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 86,
    padding: spacing.md,
    width: "48%"
  },
  metricLabel: {
    ...typography.label,
    color: colors.transparentWhite
  },
  metricValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600",
    marginTop: spacing.sm
  },
  panel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md
  },
  section: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600"
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  lineLabel: {
    ...typography.label,
    color: colors.transparentWhite
  },
  lineValue: {
    ...typography.label,
    color: colors.white,
    fontWeight: "600"
  },
  scenarios: {
    gap: spacing.md,
    marginTop: spacing.sm
  },
  antText: {
    ...typography.body,
    color: colors.white
  },
  detail: {
    ...typography.label,
    color: colors.transparentWhite
  },
  goal: {
    ...typography.label,
    color: colors.white,
    fontWeight: "600"
  },
  disclaimer: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: spacing.lg
  }
});
