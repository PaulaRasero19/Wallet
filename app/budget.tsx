import { StyleSheet, Text, View } from "react-native";
import { BudgetCategoryItem } from "../src/components/BudgetCategoryItem";
import { BudgetDotRing } from "../src/components/BudgetDotRing";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";
import { formatMoney } from "../src/utils/money";

export default function Budget() {
  const budgets = useFinFlowStore((state) => state.budgets);
  const spent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const limit = budgets.reduce((sum, budget) => sum + budget.limit, 0);

  return (
    <ScreenContainer>
      <Header title="Budget" back />
      <Text style={styles.month}>May 2024</Text>
      <View style={styles.chart}>
        <BudgetDotRing budgets={budgets} />
        <View style={styles.center}>
          <Text style={styles.centerLabel}>Spent</Text>
          <Text style={styles.centerValue}>{formatMoney(spent).replace("+", "")}</Text>
          <Text style={styles.centerLabel}>of {formatMoney(limit).replace("+", "")}</Text>
        </View>
      </View>
      <View style={styles.list}>
        {budgets.map((budget) => (
          <BudgetCategoryItem key={budget.id} budget={budget} total={spent} />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  month: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600",
    marginTop: spacing.lg,
    textAlign: "center"
  },
  chart: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.xl
  },
  center: {
    alignItems: "center",
    position: "absolute"
  },
  centerLabel: {
    ...typography.label,
    color: colors.black
  },
  centerValue: {
    ...typography.title,
    marginVertical: 2
  },
  list: {
    gap: spacing.xs
  }
});
