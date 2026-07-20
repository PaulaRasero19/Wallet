import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { PlannerEvent } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { Dot } from "./Dot";

export function CalendarEventItem({ event, onToggle }: { event: PlannerEvent; onToggle: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onToggle} style={styles.row}>
      <Text style={styles.time}>{event.time}</Text>
      <Dot color={event.accent} size={13} />
      <View style={styles.info}>
        <Text style={[styles.title, event.done && styles.done]}>{event.title}</Text>
        <Text style={styles.category}>{event.category}</Text>
      </View>
      {event.done ? <Check color={colors.black} size={16} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58
  },
  time: {
    ...typography.label,
    color: colors.black,
    width: 48
  },
  info: {
    flex: 1
  },
  title: {
    ...typography.body,
    color: colors.black,
    fontWeight: "500"
  },
  done: {
    color: colors.grayMedium,
    textDecorationLine: "line-through"
  },
  category: {
    ...typography.label
  }
});
