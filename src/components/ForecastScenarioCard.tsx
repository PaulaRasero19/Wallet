import { StyleSheet, Text, View } from "react-native";
import { ForecastScenario } from "../services/forecastService";
import { colors, spacing, typography } from "../theme";
import { formatUYU } from "../utils/money";
import { Dot } from "./Dot";
import { DotProgress } from "./DotProgress";

export function ForecastScenarioCard({ scenario }: { scenario: ForecastScenario }) {
  const riskProgress = scenario.risk === "High" ? 88 : scenario.risk === "Medium" ? 55 : 28;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{scenario.title}</Text>
        <View style={styles.risk}>
          <Dot color={scenario.risk === "High" ? "orange" : scenario.risk === "Medium" ? "lavender" : "lime"} size={8} />
          <Text style={styles.riskText}>{scenario.risk}</Text>
        </View>
      </View>
      <Text style={styles.value}>{formatUYU(scenario.projectedBalance, false)}</Text>
      <Text style={styles.meta}>Recommended daily spend: {formatUYU(scenario.recommendedDailySpend, false)}</Text>
      <DotProgress progress={riskProgress} color={scenario.risk === "High" ? "orange" : "lime"} total={12} />
      <Text style={styles.reduce}>Reduce: {scenario.categoriesToReduce.join(", ")}</Text>
      {scenario.actions.map((action) => (
        <Text key={action} style={styles.action}>
          - {action}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600"
  },
  risk: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
  },
  riskText: {
    ...typography.label,
    color: colors.black
  },
  value: {
    ...typography.title,
    color: colors.black
  },
  meta: {
    ...typography.label
  },
  reduce: {
    ...typography.label,
    color: colors.black
  },
  action: {
    ...typography.label,
    lineHeight: 18
  }
});
