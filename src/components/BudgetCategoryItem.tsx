import { StyleSheet, Text, View } from "react-native";
import { Budget } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { formatMoney, percentage } from "../utils/money";
import { Dot } from "./Dot";

export function BudgetCategoryItem({ budget, total }: { budget: Budget; total: number }) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Dot color={budget.accent} size={10} />
        <Text style={styles.name}>{budget.name}</Text>
      </View>
      <Text style={styles.amount}>{budget.spent > 0 ? formatMoney(budget.spent).replace("+", "") : "-"}</Text>
      <Text style={styles.percent}>{percentage(budget.spent, total)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 35
  },
  left: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm
  },
  name: {
    ...typography.body,
    color: colors.black,
    fontSize: 14
  },
  amount: {
    ...typography.label,
    color: colors.black,
    minWidth: 82,
    textAlign: "right"
  },
  percent: {
    ...typography.label,
    color: colors.grayDark,
    minWidth: 34,
    textAlign: "right"
  }
});
