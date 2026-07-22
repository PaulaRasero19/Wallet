import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { GoalProgressItem } from "../src/components/GoalProgressItem";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";

export default function Goals() {
  const goals = useFinFlowStore((state) => state.goals);
  const loadOverview = useFinFlowStore((state) => state.loadOverview);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Metas" back />
      <View style={styles.panel}>
        <Text style={styles.title}>{goals.length === 0 ? "Sin metas configuradas" : "Metas"}</Text>
        {goals.length === 0 ? (
          <Text style={styles.body}>Cuando crees una meta de ahorro, aparecerá acá con progreso real.</Text>
        ) : (
          goals.map((goal) => <GoalProgressItem key={goal.id} goal={goal} onAdd={() => undefined} onDelete={() => undefined} />)
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.grayLight,
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  title: {
    ...typography.title
  },
  body: {
    ...typography.body,
    color: colors.grayDark
  }
});
