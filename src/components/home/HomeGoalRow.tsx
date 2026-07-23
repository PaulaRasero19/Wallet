import { BookOpen, Car, House, Laptop, Plane, Shield } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, typography } from "../../theme";
import { Goal } from "../../types/finflow";
import { cappedGoalProgress } from "../../utils/goals";
import { formatMoney } from "../../utils/money";

function GoalIcon({ name }: { name: string }) {
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const Icon = /viaje|vacacion|avion/.test(normalized) ? Plane
    : /emergencia|seguridad/.test(normalized) ? Shield
      : /comput|laptop|notebook/.test(normalized) ? Laptop
        : /casa|vivienda|hogar/.test(normalized) ? House
          : /auto|coche|vehiculo/.test(normalized) ? Car
            : /estudio|curso|universidad|libro/.test(normalized) ? BookOpen
              : Shield;
  return <Icon color="#AAAAA7" size={27} strokeWidth={1.8} />;
}

export function HomeGoalRow({ goal }: { goal: Goal }) {
  const progress = cappedGoalProgress(goal.saved, goal.target);
  const targetDate = goal.targetDate || goal.target_date;
  const reached = progress >= 100 || goal.status === "completed";
  return <Pressable accessibilityLabel={`Abrir meta ${goal.name}`} accessibilityRole="button" onPress={() => router.push(`/goal/${goal.id}`)} style={styles.row}>
    <View style={styles.icon}><GoalIcon name={goal.name} /></View>
    <View style={styles.content}>
      <View style={styles.heading}><Text numberOfLines={1} style={styles.name}>{goal.name}</Text><Text style={styles.percentage}>{progress} %</Text></View>
      <Text style={styles.amount}>{formatMoney(goal.saved, goal.currency, false)} de {formatMoney(goal.target, goal.currency, false)}</Text>
      <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
      <Text style={styles.meta}>{reached ? "Meta alcanzada" : targetDate ? new Date(targetDate).toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha límite"}</Text>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  amount: { ...typography.body, color: "rgba(255,255,255,0.72)", marginTop: 5 },
  content: { flex: 1 },
  fill: { backgroundColor: "#A5A5A1", borderRadius: 2, height: 4 },
  heading: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  icon: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 28, height: 56, justifyContent: "center", width: 56 },
  meta: { ...typography.label, color: "rgba(255,255,255,0.52)", marginTop: 7 },
  name: { ...typography.body, color: colors.white, flex: 1, fontWeight: "800" },
  percentage: { ...typography.label, color: "#C7C7C3", fontWeight: "900" },
  row: { alignItems: "flex-start", flexDirection: "row", gap: 16, minHeight: 88, paddingVertical: 6 },
  track: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 2, height: 5, marginTop: 11, overflow: "hidden" }
});
