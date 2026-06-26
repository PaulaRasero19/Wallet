import { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { GoalCard } from "../components/GoalCard";
import { goals as initialGoals } from "../data/goals";
import { globalStyles } from "../styles/globalStyles";

export function GoalsScreen() {
  const [goals, setGoals] = useState(initialGoals);

  function handleAddSaving(goalId) {
    setGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal.id === goalId ? { ...goal, saved: Math.min(goal.saved + 2500, goal.target) } : goal
      )
    );
    Alert.alert("Ahorro agregado", "Sumamos $2.500 de forma simulada a este objetivo.");
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Objetivos de ahorro</Text>
      <Text style={globalStyles.subtitle}>Metas ficticias para mostrar progreso y acciones simples.</Text>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onAddSaving={handleAddSaving} />
      ))}
    </ScrollView>
  );
}
