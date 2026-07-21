import { useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { GoalCard } from "../components/GoalCard";
import { goals as initialGoals } from "../data/goals";
import { globalStyles } from "../styles/globalStyles";

export function GoalsScreen() {
  const [goals, setGoals] = useState(initialGoals);

  function handleAddSaving(goalId) {
    setGoals((currentGoals) => currentGoals.map((goal) => (goal.id === goalId ? goal : goal)));
    Alert.alert("Accion no disponible", "Las metas reales se guardaran en Supabase en una fase posterior.");
  }

  return (
    <ScrollView style={globalStyles.screen} contentContainerStyle={globalStyles.content}>
      <Text style={globalStyles.title}>Objetivos de ahorro</Text>
      <Text style={globalStyles.subtitle}>Las metas reales se cargaran desde Supabase.</Text>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} onAddSaving={handleAddSaving} />
      ))}
    </ScrollView>
  );
}
