import { Pressable, StyleSheet, Text, View } from "react-native";
import { Goal } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { formatMoney, percentage } from "../utils/money";
import { DotProgress } from "./DotProgress";

export function GoalProgressItem({ goal, onAdd, onDelete }: { goal: Goal; onAdd: () => void; onDelete: () => void }) {
  const progress = percentage(goal.saved, goal.target);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{goal.name}</Text>
          <Text style={styles.meta}>
            {formatMoney(goal.saved).replace("+", "")} of {formatMoney(goal.target).replace("+", "")}
          </Text>
        </View>
        <Text style={styles.percent}>{progress}%</Text>
      </View>
      <DotProgress progress={progress} color={goal.accent} total={10} />
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onAdd} style={styles.actionButton}>
          <Text style={styles.actionText}>Add money</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete} style={styles.actionButton}>
          <Text style={styles.actionText}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingVertical: spacing.md
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  name: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600"
  },
  meta: {
    ...typography.label,
    marginTop: 2
  },
  percent: {
    ...typography.label,
    color: colors.black,
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionButton: {
    borderColor: colors.grayLight,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: "center"
  },
  actionText: {
    ...typography.label,
    color: colors.black
  }
});
