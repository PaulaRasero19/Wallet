import { StyleSheet, View } from "react-native";
import { colors, radii } from "../styles/theme";

export function ProgressBar({ progress, color = colors.primary }) {
  const width = `${Math.max(0, Math.min(progress, 100))}%`;

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: "#E5E7EB",
    borderRadius: radii.sm,
    height: 8,
    overflow: "hidden",
    width: "100%"
  },
  fill: {
    borderRadius: radii.sm,
    height: "100%"
  }
});
