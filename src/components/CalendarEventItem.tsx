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
      {event.done ? <Check color={colors.white} size={16} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
    minHeight: 62,
    paddingHorizontal: spacing.md
  },
  time: {
    ...typography.label,
    color: colors.white,
    width: 48
  },
  info: {
    flex: 1
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "500"
  },
  done: {
    color: colors.grayMedium,
    textDecorationLine: "line-through"
  },
  category: {
    ...typography.label
    ,
    color: colors.transparentWhite
  }
});
