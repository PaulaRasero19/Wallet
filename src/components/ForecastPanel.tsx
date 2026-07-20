import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowUpRight } from "lucide-react-native";
import { router } from "expo-router";
import { ForecastResult } from "../services/forecastService";
import { colors, spacing, typography } from "../theme";
import { formatUYU } from "../utils/money";
import { Dot } from "./Dot";
import { DotProgress } from "./DotProgress";

export function ForecastPanel({ forecast, dark = false }: { forecast: ForecastResult; dark?: boolean }) {
  const textColor = dark ? colors.white : colors.black;
  const muted = dark ? colors.transparentWhite : colors.grayMedium;
  const border = dark ? colors.grayDark : colors.grayLight;
  const panel = dark ? colors.darkSurface : colors.white;

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push("/forecast")} style={[styles.wrap, { backgroundColor: panel, borderColor: border }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.label, { color: muted }]}>FinFlow Forecast</Text>
          <Text style={[styles.title, { color: textColor }]}>End-of-month projection</Text>
        </View>
        <ArrowUpRight color={textColor} size={18} />
      </View>
      <View style={styles.metrics}>
        <View>
          <Text style={[styles.metricLabel, { color: muted }]}>Really available</Text>
          <Text style={[styles.value, { color: textColor }]}>{formatUYU(forecast.realAvailable, false)}</Text>
        </View>
        <View>
          <Text style={[styles.metricLabel, { color: muted }]}>Daily limit</Text>
          <Text style={[styles.valueSmall, { color: textColor }]}>{formatUYU(forecast.dailyLimit, false)}</Text>
        </View>
      </View>
      <View style={styles.riskRow}>
        <Dot color={forecast.financialRisk === "High" ? "orange" : forecast.financialRisk === "Medium" ? "lavender" : "lime"} size={8} />
        <Text style={[styles.risk, { color: muted }]}>Risk: {forecast.financialRisk}</Text>
      </View>
      <DotProgress progress={forecast.financialRisk === "High" ? 86 : forecast.financialRisk === "Medium" ? 56 : 28} color={forecast.financialRisk === "High" ? "orange" : "lime"} total={12} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  label: {
    ...typography.label
  },
  title: {
    ...typography.body,
    fontWeight: "600",
    marginTop: 2
  },
  metrics: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metricLabel: {
    ...typography.label
  },
  value: {
    ...typography.title,
    marginTop: spacing.xs
  },
  valueSmall: {
    ...typography.body,
    fontWeight: "600",
    marginTop: spacing.xs
  },
  riskRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  risk: {
    ...typography.label
  }
});
