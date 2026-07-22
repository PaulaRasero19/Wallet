import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Header } from "../src/components/Header";
import { InsightMetric } from "../src/components/InsightMetric";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { ValueDotChart } from "../src/components/ValueDotChart";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { categorySummary, getInstallments, overviewMetrics, percentage, positiveAmount } from "../src/utils/financeInsights";
import { formatMoney } from "../src/utils/money";

const tabs = ["Resumen", "Categorías", "Tendencias", "Tarjetas"] as const;
type Tab = (typeof tabs)[number];

export default function Statistics() {
  const [tab, setTab] = useState<Tab>("Resumen");
  const { accounts, creditCards, events, goals, loadOverview, overview, recurringPayments, transactions } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const primaryCurrency = profile?.primary_currency || "UYU";
  const metrics = overviewMetrics({
    accounts,
    creditCards,
    events,
    goals,
    overview,
    payday: profile?.payday,
    primaryCurrency,
    recurringPayments,
    transactions,
    monthlyIncome: Number(profile?.monthly_income || 0)
  });
  const categories = useMemo(() => categorySummary(transactions), [transactions]);
  const fixed = recurringPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const variable = Math.max(0, metrics.expenses - fixed);
  const savedPercent = metrics.goal ? percentage(metrics.goal.saved, metrics.goal.target) : 0;
  const installments = getInstallments(transactions);

  useEffect(() => {
    void loadOverview("6m");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Estadísticas" back />
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable key={item} accessibilityRole="button" onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "Resumen" ? (
        <View style={styles.section}>
          <InsightMetric label="Sueldo gastado" value={`${metrics.salarySpentPercent}%`} meta={`${formatMoney(metrics.expenses, primaryCurrency, false)} gastados del período`} />
          <InsightMetric label="Porcentaje ahorrado" value={`${savedPercent}%`} meta={metrics.goal ? metrics.goal.name : "Sin meta activa"} />
          <InsightMetric label="Gasto diario promedio" value={formatMoney(overview?.average_daily_expense || 0, primaryCurrency, false)} />
          <InsightMetric label="Fijos vs variables" value={`${formatMoney(fixed, primaryCurrency, false)} / ${formatMoney(variable, primaryCurrency, false)}`} meta="Fijos detectados y resto de gastos" />
          <Text style={styles.explain}>Este mes tu lectura central es: {metrics.priorityInsight}</Text>
        </View>
      ) : null}

      {tab === "Categorías" ? (
        <View style={styles.section}>
          {categories.length === 0 ? <Text style={styles.empty}>No hay gastos para distribuir todavía.</Text> : null}
          {categories.slice(0, 8).map((category) => (
            <View key={category.name} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowTitle}>{category.name}</Text>
                <Text style={styles.rowMeta}>{category.count} movimientos · {category.percent}% del gasto</Text>
              </View>
              <Text style={styles.rowValue}>{formatMoney(category.total, primaryCurrency, false)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {tab === "Tendencias" ? (
        <View style={styles.section}>
          <View style={styles.filters}>
            {["7d", "30d", "3m", "6m", "1y"].map((period) => (
              <Pressable key={period} accessibilityRole="button" onPress={() => loadOverview(period)} style={styles.filter}>
                <Text style={styles.filterText}>{period}</Text>
              </Pressable>
            ))}
          </View>
          <ValueDotChart title="Saldo, ingresos y gastos" period={overview?.period || "6m"} points={overview?.history || []} />
          <Text style={styles.explain}>Compará mínimos, máximos y el punto seleccionado para entender qué día cambió tu saldo.</Text>
        </View>
      ) : null}

      {tab === "Tarjetas" ? (
        <View style={styles.section}>
          {creditCards.length === 0 ? <Text style={styles.empty}>No hay tarjetas cargadas.</Text> : null}
          {creditCards.map((card) => (
            <View key={card.id} style={styles.cardBlock}>
              <Text style={styles.rowTitle}>{card.name}</Text>
              <InsightMetric label="Utilizado" value={formatMoney(card.used, card.currency, false)} />
              <InsightMetric label="Disponible" value={formatMoney(Math.max(0, card.limit - card.used), card.currency, false)} />
              <InsightMetric label="Cuotas futuras" value={`${installments.length}`} meta={`${formatMoney(installments.reduce((sum, item) => sum + (item.installment?.amountPerInstallment || 0), 0), card.currency, false)} comprometidos por mes`} />
              <Text style={styles.rowMeta}>Cierre {String(card.closingDate).slice(5, 10)} · vencimiento {String(card.dueDate).slice(5, 10)}</Text>
            </View>
          ))}
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
    borderColor: colors.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  activeTab: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  tabText: {
    ...typography.label,
    color: colors.black,
    fontWeight: "700"
  },
  activeTabText: {
    color: colors.white
  },
  section: {
    marginTop: spacing.xl
  },
  explain: {
    ...typography.body,
    color: colors.grayDark,
    marginTop: spacing.lg
  },
  empty: {
    ...typography.body,
    color: colors.grayDark
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.grayLight,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm
  },
  rowMain: {
    flex: 1
  },
  rowTitle: {
    ...typography.body,
    color: colors.black,
    fontWeight: "700"
  },
  rowMeta: {
    ...typography.label,
    color: colors.grayDark,
    marginTop: spacing.xs
  },
  rowValue: {
    ...typography.body,
    color: colors.black,
    fontWeight: "700"
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  filter: {
    borderColor: colors.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  filterText: {
    ...typography.label,
    color: colors.black,
    fontWeight: "700"
  },
  cardBlock: {
    borderColor: colors.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.lg
  }
});
