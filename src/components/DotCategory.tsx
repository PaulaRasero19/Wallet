import { StyleSheet, Text, View } from "react-native";
import { AccentColor, typography } from "../theme";
import { Dot } from "./Dot";

export function DotCategory({ color, label }: { color: AccentColor; label: string }) {
  return (
    <View style={styles.wrap}>
      <Dot color={color} size={18} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 8
  },
  label: {
    ...typography.label,
    color: "#0A0A0A"
  }
});
