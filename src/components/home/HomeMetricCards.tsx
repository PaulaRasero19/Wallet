import { StyleSheet, Text, View } from "react-native";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { colors, typography } from "../../theme";
import { Currency, Goal, Transaction } from "../../types/finflow";

export function HomeMetricCards({
  currency,
  expenses,
  goal,
  income,
  monthlyIncome,
  transactions
}: {
  currency: Currency;
  expenses: number;
  goal?: Goal;
  income: number;
  monthlyIncome?: number;
  transactions: Transaction[];
}) {
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <View style={styles.largeCard}>
        <View style={styles.cardTop}>
          <Text style={styles.largeTitle}>Gastos hormiga</Text>
        </View>
        <TrendIcon direction="down" />
        <View>
          <Text style={styles.meta}>Ahorro potencial $U 482,50</Text>
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.largeValue}>2 gastos $U 965</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.smallCard}>
          <View style={styles.cardTop}>
            <Text numberOfLines={2} style={styles.smallTitle}>Objetivo de ahorro{"\n"}mensual</Text>
          </View>
          <TrendIcon direction="up" />
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.smallValue}>+41.6%</Text>
        </View>
        <View style={styles.smallCard}>
          <View style={styles.incomeHeader}>
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.incomeTitle}>
              Ingresos utilizados
            </Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.incomeMeta}>
              Más que el mes pasado
            </Text>
          </View>
          <TrendIcon direction="down" />
          <Text adjustsFontSizeToFit numberOfLines={1} style={styles.incomeValue}>+60%</Text>
        </View>
      </View>
    </View>
  );
}

function TrendIcon({ direction }: { direction: "down" | "up" }) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  return (
    <View style={styles.trendIcon}>
      <Icon color={direction === "up" ? "#5EBA43" : "#B73732"} size={15} strokeWidth={3.1} />
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
    borderRadius: 20,
    borderWidth: 1,
    height: 118,
    justifyContent: "space-between",
    padding: 14,
    paddingRight: 58,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 18
  },
  largeValue: {
    ...typography.value,
    color: colors.white,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 38
  },
  largeTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 19
  },
  meta: {
    ...typography.label,
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    lineHeight: 15
  },
  incomeHeader: {
    paddingRight: 34
  },
  incomeMeta: {
    ...typography.body,
    color: colors.white,
    fontSize: 11,
    lineHeight: 14,
    marginTop: 18
  },
  incomeTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20
  },
  incomeValue: {
    ...typography.value,
    color: colors.white,
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42,
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
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    height: 108,
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
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
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 42,
    marginTop: 0
  },
  smallTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
    paddingRight: 0
  },
  trendIcon: {
    alignItems: "center",
    backgroundColor: "rgba(28,28,27,0.94)",
    borderRadius: 14,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 28
  },
  wrap: {
    gap: 5,
    marginTop: 0,
    paddingHorizontal: 12
  }
});
