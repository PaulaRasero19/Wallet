import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { HomeGoalRow } from "../src/components/home/HomeGoalRow";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";
import { sortGoalsForHome } from "../src/utils/goals";

export default function Goals() {
  const goals = useFinFlowStore((state) => state.goals);
  const loadOverview = useFinFlowStore((state) => state.loadOverview);
  const orderedGoals = sortGoalsForHome(goals);

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
          orderedGoals.map((goal) => <HomeGoalRow key={goal.id} goal={goal} />)
        )}
        {!goals.length ? <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/add-goal")} style={styles.createButton}><Text style={styles.createText}>Crear meta</Text></Pressable> : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  title: {
    ...typography.title,
    color: colors.white
  },
  body: {
    ...typography.body,
    color: colors.transparentWhite
  },
  createButton: { alignSelf: "flex-start", backgroundColor: colors.white, borderRadius: 20, marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  createText: { ...typography.label, color: colors.black, fontWeight: "900" }
});
