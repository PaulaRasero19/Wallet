import { Pressable, StyleSheet, Text, View } from "react-native";
import { Goal } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { formatMoney } from "../utils/money";
import { cappedGoalProgress } from "../utils/goals";
import { DotProgress } from "./DotProgress";

export function GoalProgressItem({ goal, onAdd, onDelete }: { goal: Goal; onAdd: () => void; onDelete: () => void }) {
  const progress = cappedGoalProgress(goal.saved, goal.target);

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
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  name: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600"
  },
  meta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: 2
  },
  percent: {
    ...typography.label,
    color: colors.white,
    fontWeight: "600"
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  actionButton: {
    borderColor: colors.appGrayBorder,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 34,
    paddingHorizontal: 12,
    justifyContent: "center"
  },
  actionText: {
    ...typography.label,
    color: colors.white
  }
});
