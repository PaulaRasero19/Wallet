import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatMoney, percentage } from "../../src/utils/money";

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, loadOverview } = useFinFlowStore();
  const goal = goals.find((item) => item.id === id);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Detalle de meta" back />
      {goal ? (
        <View style={styles.panel}>
          <Text style={styles.title}>{goal.name}</Text>
          <Text style={styles.amount}>
            {formatMoney(goal.saved, goal.currency, false)} de {formatMoney(goal.target, goal.currency, false)}
          </Text>
          <Text style={styles.meta}>{percentage(goal.saved, goal.target)}%</Text>
          <Text style={styles.body}>Te faltan {formatMoney(Math.max(0, goal.target - goal.saved), goal.currency, false)}.</Text>
          <Text style={styles.body}>Aporte mensual sugerido: {formatMoney(goal.monthlyContribution || 0, goal.currency, false)}.</Text>
        </View>
      ) : (
        <Text style={styles.empty}>No encontré esta meta para tu usuario.</Text>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  amount: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  body: {
    ...typography.body,
    color: colors.transparentWhite
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.xl
  },
  meta: {
    ...typography.display,
    color: colors.white,
    fontSize: 48
  },
  panel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  title: {
    ...typography.title,
    color: colors.white
  }
});
