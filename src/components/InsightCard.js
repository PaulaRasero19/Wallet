import { StyleSheet, Text } from "react-native";
import { Card } from "./Card";
import { colors, spacing } from "../styles/theme";

export function InsightCard({ message }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.label}>Insight IA</Text>
      <Text style={styles.message}>{message}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md
  },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.xs,
    textTransform: "uppercase"
  },
  message: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23
  }
});
