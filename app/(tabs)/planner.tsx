import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Plus } from "lucide-react-native";
import { CalendarEventItem } from "../../src/components/CalendarEventItem";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";

const week = [
  ["S", "19"],
  ["M", "20"],
  ["T", "21"],
  ["W", "22"],
  ["T", "23"],
  ["F", "24"],
  ["S", "25"]
];

export default function Planner() {
  const events = useFinFlowStore((state) => state.events);
  const addEvent = useFinFlowStore((state) => state.addEvent);
  const toggleEventDone = useFinFlowStore((state) => state.toggleEventDone);

  function createEvent() {
    addEvent({ title: "New Event", time: "4 PM", category: "Personal", done: false, accent: "orange" });
    Alert.alert("FinFlow", "Event created. Tap it to mark it as done.");
  }

  return (
    <ScreenContainer>
      <Header title="May 2024" />
      <View style={styles.week}>
        {week.map(([day, number]) => {
          const active = number === "21";
          return (
            <View key={number} style={styles.day}>
              <Text style={styles.dayLabel}>{day}</Text>
              <Text style={[styles.dayNumber, active && styles.activeDay]}>{number}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.agenda}>
        {events.map((event) => (
          <CalendarEventItem key={event.id} event={event} onToggle={() => toggleEventDone(event.id)} />
        ))}
      </View>
      <Pressable accessibilityRole="button" onPress={createEvent} style={styles.fab}>
        <Plus color={colors.white} size={22} />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xl
  },
  day: {
    alignItems: "center",
    gap: spacing.xs
  },
  dayLabel: {
    ...typography.label
  },
  dayNumber: {
    ...typography.body,
    color: colors.black,
    height: 32,
    lineHeight: 32,
    textAlign: "center",
    width: 32
  },
  activeDay: {
    backgroundColor: colors.black,
    borderRadius: 16,
    color: colors.white,
    overflow: "hidden"
  },
  agenda: {
    marginTop: spacing.xl
  },
  fab: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: colors.black,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    marginTop: spacing.xl,
    width: 48
  }
});
