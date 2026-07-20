import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Plus } from "lucide-react-native";
import { GoalProgressItem } from "../src/components/GoalProgressItem";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../src/theme";

export default function Goals() {
  const goals = useFinFlowStore((state) => state.goals);
  const addGoal = useFinFlowStore((state) => state.addGoal);
  const addGoalMoney = useFinFlowStore((state) => state.addGoalMoney);
  const deleteGoal = useFinFlowStore((state) => state.deleteGoal);

  function createGoal() {
    addGoal({ name: "New Goal", saved: 0, target: 1000, accent: "orange" });
    Alert.alert("FinFlow", "Goal created. You can add money or delete it.");
  }

  return (
    <ScreenContainer>
      <Header
        title="Goals"
        back
        right={
          <Pressable accessibilityRole="button" onPress={createGoal} style={styles.plus}>
            <Plus color={colors.black} size={18} />
          </Pressable>
        }
      />
      <View style={styles.list}>
        {goals.map((goal) => (
          <GoalProgressItem
            key={goal.id}
            goal={goal}
            onAdd={() => addGoalMoney(goal.id, 125)}
            onDelete={() => deleteGoal(goal.id)}
          />
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={createGoal} style={styles.create}>
        <View style={styles.dotted}>
          <Plus color={colors.black} size={18} />
        </View>
        <Text style={styles.createText}>Create New Goal</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  plus: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  list: {
    marginTop: spacing.xl
  },
  create: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.grayLight,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 90,
    marginTop: spacing.lg,
    padding: spacing.md
  },
  dotted: {
    alignItems: "center",
    borderColor: colors.black,
    borderRadius: 18,
    borderStyle: "dotted",
    borderWidth: 2,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  createText: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600"
  }
});
