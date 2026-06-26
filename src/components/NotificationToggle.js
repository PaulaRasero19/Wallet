import { StyleSheet, Switch, Text, View } from "react-native";
import { colors, spacing } from "../styles/theme";

export function NotificationToggle({ label, enabled, onToggle }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        onValueChange={onToggle}
        thumbColor={enabled ? colors.primary : "#F3F4F6"}
        trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
        value={enabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md
  },
  label: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    paddingRight: spacing.md
  }
});
