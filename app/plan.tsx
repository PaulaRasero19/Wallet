import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CalendarEventItem } from "../src/components/CalendarEventItem";
import { GoalProgressItem } from "../src/components/GoalProgressItem";
import { Header } from "../src/components/Header";
import { InsightMetric } from "../src/components/InsightMetric";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { categorySummary, getInstallments, overviewMetrics } from "../src/utils/financeInsights";
import { formatMoney } from "../src/utils/money";

const tabs = ["Presupuesto", "Ahorro", "Tarjetas", "Calendario"] as const;
type Tab = (typeof tabs)[number];

export default function Plan() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(params.tab || "Presupuesto");
  const { accounts, creditCards, events, goals, loadOverview, overview, recurringPayments, transactions, toggleEventDone } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const primaryCurrency = profile?.primary_currency || "UYU";
  const metrics = overviewMetrics({ accounts, creditCards, events, goals, overview, payday: profile?.payday, primaryCurrency, recurringPayments, transactions, monthlyIncome: Number(profile?.monthly_income || 0) });
  const categories = categorySummary(transactions);
  const installments = getInstallments(transactions);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Plan financiero" back />
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable key={item} accessibilityRole="button" onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "Presupuesto" ? (
        <View style={styles.section}>
          <InsightMetric label="Disponible real" value={formatMoney(metrics.available, primaryCurrency, false)} meta="Saldo menos compromisos próximos" />
          <InsightMetric label="Límite diario recomendado" value={formatMoney(metrics.dailyLimit, primaryCurrency, false)} meta={`Hasta cobrar en ${metrics.nextPayday.days} días`} />
          {categories.slice(0, 5).map((category) => (
            <View key={category.name} style={styles.row}>
              <Text style={styles.rowTitle}>{category.name}</Text>
              <Text style={styles.rowMeta}>{formatMoney(category.total, primaryCurrency, false)} · {category.percent}%</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "Ahorro" ? (
        <View style={styles.section}>
          {goals.length === 0 ? <Text style={styles.empty}>Sin meta de ahorro cargada.</Text> : null}
          {goals.map((goal) => (
            <View key={goal.id}>
              <GoalProgressItem goal={goal} onAdd={() => undefined} onDelete={() => undefined} />
              <InsightMetric label="Importe restante" value={formatMoney(Math.max(0, goal.target - goal.saved), goal.currency, false)} />
              <InsightMetric label="Ritmo recomendado" value={formatMoney(goal.monthlyContribution, goal.currency, false)} meta="Aporte mensual planificado" />
            </View>
          ))}
        </View>
      ) : null}

      {tab === "Tarjetas" ? (
        <View style={styles.section}>
          {creditCards.map((card) => (
            <View key={card.id} style={styles.block}>
              <Text style={styles.title}>{card.name}</Text>
              <InsightMetric label="Límite" value={formatMoney(card.limit, card.currency, false)} />
              <InsightMetric label="Usado / disponible" value={`${formatMoney(card.used, card.currency, false)} / ${formatMoney(card.limit - card.used, card.currency, false)}`} />
              <InsightMetric label="Cierre y vencimiento" value={`${String(card.closingDate).slice(5, 10)} · ${String(card.dueDate).slice(5, 10)}`} />
            </View>
          ))}
          <Text style={styles.title}>Cuotas</Text>
          {installments.map((transaction) => (
            <View key={transaction.id} style={styles.row}>
              <Text style={styles.rowTitle}>{transaction.merchant}</Text>
              <Text style={styles.rowMeta}>Cuota {transaction.installment?.current}/{transaction.installment?.total} · {formatMoney(transaction.installment?.amountPerInstallment || 0, transaction.currency, false)} · restante {formatMoney(transaction.installment?.remainingAmount || 0, transaction.currency, false)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "Calendario" ? (
        <View style={styles.section}>
          {events.map((event) => <CalendarEventItem key={event.id} event={event} onToggle={() => toggleEventDone(event.id)} />)}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  tab: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  activeTab: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  tabText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "700"
  },
  activeTabText: {
    color: colors.black
  },
  section: {
    marginTop: spacing.xl
  },
  block: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700",
    marginBottom: spacing.sm
  },
  row: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  rowTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  rowMeta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: spacing.xs
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite
  }
});
