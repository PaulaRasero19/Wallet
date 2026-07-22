import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bell } from "lucide-react-native";
import { colors, typography } from "../../theme";
import { Currency, DailyHistoryPoint } from "../../types/finflow";
import { formatCompactMoney } from "../../utils/money";
import { ChartMetric, InteractiveFinanceChart } from "../charts/InteractiveFinanceChart";
import { AnimatedLavaBackground } from "./AnimatedLavaBackground";
import { HomePeriod } from "./HomePeriodSelector";

export function HomeHero({
  available,
  chartMetric,
  currency,
  firstName,
  history,
  nextIncomeLabel,
  onMetricChange,
  onPeriodChange,
  period
}: {
  available: number;
  chartMetric: ChartMetric;
  currency: Currency;
  firstName: string;
  history: DailyHistoryPoint[];
  nextIncomeLabel: string;
  onMetricChange: (metric: ChartMetric) => void;
  onPeriodChange: (period: HomePeriod) => void;
  period: HomePeriod;
}) {
  return (
    <View style={styles.hero}>
      <AnimatedLavaBackground />
      <View style={styles.header}>
        <View style={styles.identity}>
          <View style={styles.avatar} />
          <Text style={styles.hello}>Hola {firstName}!</Text>
        </View>
        <Pressable accessibilityLabel="Notificaciones" accessibilityRole="button" style={styles.bell}>
          <Bell color={colors.white} size={18} strokeWidth={1.9} />
        </Pressable>
      </View>

      <View style={styles.valueBlock}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.value}>{formatCompactMoney(Math.max(0, available), currency, false)}</Text>
        <Text style={styles.subtitle}>{nextIncomeLabel}</Text>
      </View>

      <View style={styles.chartWrap}>
        <InteractiveFinanceChart
          currency={currency}
          history={history}
          metric={chartMetric}
          onMetricChange={onMetricChange}
          onPeriodChange={onPeriodChange}
          period={period}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: "#F1F1F1",
    borderRadius: 20,
    height: 40,
    width: 40
  },
  bell: {
    alignItems: "center",
    backgroundColor: "rgba(18,18,18,0.52)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingTop: 20,
    width: "100%"
  },
  chartWrap: {
    paddingHorizontal: 22,
    width: "100%"
  },
  hello: {
    ...typography.body,
    color: colors.white,
    fontSize: 13,
    lineHeight: 16
  },
  hero: {
    flex: 1,
    justifyContent: "space-between",
    overflow: "hidden",
    paddingBottom: 86
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 14,
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center"
  },
  value: {
    ...typography.value,
    color: colors.white,
    fontSize: 52,
    fontWeight: "700",
    lineHeight: 58,
    textAlign: "center"
  },
  valueBlock: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 18
  }
});
