import { StyleSheet, Text, View } from "react-native";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { colors, typography } from "../../theme";
import { Currency } from "../../types/finflow";
import { HomeFinancialInsights, InsightTone } from "../../utils/homeFinancialInsights";
import { formatCompactMoney, formatMoney } from "../../utils/money";

export function HomeMetricCards({
  currency,
  insights
}: {
  currency: Currency;
  insights: HomeFinancialInsights;
}) {
  const smallExpenseLabel = insights.smallExpenses.count === 1 ? "1 gasto" : `${insights.smallExpenses.count} gastos`;
  const smallExpenseMeta = !insights.hasMovements
    ? "Todavía no hay movimientos"
    : insights.smallExpenses.count > 0
      ? `Ahorro potencial ${formatMoney(insights.smallExpenses.potentialSavings, currency, false)}`
      : "Buen control este mes";
  const smallExpenseValue = !insights.hasMovements
    ? formatCompactMoney(0, currency, false)
    : insights.smallExpenses.count > 0
      ? `${smallExpenseLabel} · ${formatCompactMoney(insights.smallExpenses.total, currency, false)}`
      : "Sin gastos detectados";
  const savingsValue = !insights.hasMovements || insights.savings.rate === null
    ? "0 %"
    : insights.savings.goalProgress !== null
      ? `${formatPercent(insights.savings.goalProgress)}`
      : `${formatPercent(insights.savings.rate)}`;
  const incomeUsedValue = !insights.hasMovements || insights.incomeUsed.percentage === null ? "0 %" : formatPercent(insights.incomeUsed.percentage);

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.largeCard}>
        <View style={styles.cardTop}>
          <Text style={styles.largeTitle}>Gastos hormiga</Text>
        </View>
        <TrendIcon direction={insights.smallExpenses.trendState.direction} tone={insights.smallExpenses.trendState.tone} />
        <View>
          <Text style={styles.meta}>{smallExpenseMeta}</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.largeValue}>{smallExpenseValue}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.smallCard}>
          <View style={styles.cardTop}>
            <Text numberOfLines={2} style={styles.smallTitle}>{insights.hasMovements ? insights.savings.title : "Ahorro del mes"}</Text>
          </View>
          <TrendIcon direction={insights.savings.trendState.direction} tone={insights.savings.trendState.tone} />
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.smallValue}>{savingsValue}</Text>
        </View>
        <View style={styles.smallCard}>
          <View style={styles.cardTop}>
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.incomeTitle}>
              Ingresos usados
            </Text>
          </View>
          <TrendIcon direction={insights.incomeUsed.trendState.direction} tone={insights.incomeUsed.trendState.tone} />
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.incomeValue}>{incomeUsedValue}</Text>
        </View>
      </View>
    </View>
  );
}

function formatPercent(value: number) {
  return `${Number(value.toFixed(1)).toLocaleString("es-UY", { maximumFractionDigits: 1 })} %`;
}

function colorForTone(tone: InsightTone) {
  if (tone === "positive") return "#5EBA43";
  if (tone === "negative") return "#B73732";
  return "rgba(255,255,255,0.72)";
}

function TrendIcon({ direction, tone }: { direction: "down" | "up"; tone: InsightTone }) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <View style={styles.trendIcon}>
      <Icon color={colorForTone(tone)} size={15} strokeWidth={3.1} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8
  },
  largeCard: {
    backgroundColor: "rgba(41,41,39,0.68)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 23,
    borderWidth: 1,
    height: 142,
    justifyContent: "space-between",
    padding: 16,
    paddingRight: 66,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18
  },
  largeValue: {
    ...typography.value,
    color: colors.white,
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 46
  },
  largeTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20
  },
  meta: {
    ...typography.label,
    color: "rgba(255,255,255,0.76)",
    fontSize: 14,
    lineHeight: 18
  },
  incomeTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20
  },
  incomeValue: {
    ...typography.value,
    color: colors.white,
    fontSize: 50,
    fontWeight: "700",
    lineHeight: 54,
    marginTop: 0
  },
  smallMeta: {
    ...typography.label,
    color: "rgba(255,255,255,0.82)",
    fontSize: 11,
    lineHeight: 13
  },
  row: {
    flexDirection: "row",
    gap: 5
  },
  smallCard: {
    backgroundColor: "rgba(41,41,39,0.68)",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    height: 137,
    justifyContent: "space-between",
    paddingBottom: 14,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingRight: 13,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18
  },
  smallValue: {
    ...typography.value,
    color: colors.white,
    fontSize: 47,
    fontWeight: "700",
    lineHeight: 52,
    marginTop: 0
  },
  smallTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 14.5,
    fontWeight: "600",
    lineHeight: 19,
    paddingRight: 0
  },
  trendIcon: {
    alignItems: "center",
    backgroundColor: "rgba(28,28,27,0.94)",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    top: 14,
    width: 30
  },
  wrap: {
    gap: 5,
    marginTop: 0,
    paddingHorizontal: 12
  }
});
