import { StyleSheet, View } from "react-native";
import { colors, radii, shadows, spacing } from "../styles/theme";

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.card
  }
});
