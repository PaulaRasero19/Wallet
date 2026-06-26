import { StyleSheet, Text, View } from "react-native";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { AppButton } from "./AppButton";
import { colors, spacing } from "../styles/theme";
import { formatCurrency, getProgress } from "../utils/formatters";

export function GoalCard({ goal, onAddSaving }) {
  const progress = getProgress(goal.saved, goal.target);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{goal.name}</Text>
        <Text style={styles.percent}>{progress}%</Text>
      </View>
      <Text style={styles.amount}>
        {formatCurrency(goal.saved)} de {formatCurrency(goal.target)}
      </Text>
      <ProgressBar progress={progress} />
      <AppButton title="Agregar ahorro" onPress={() => onAddSaving(goal.id)} variant="secondary" style={styles.button} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  name: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700"
  },
  percent: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "700"
  },
  amount: {
    color: colors.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  button: {
    marginTop: spacing.md
  }
});
