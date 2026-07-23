import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme";

export function HomeAIInsight({ text }: { text: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Insight de FinFlow</Text>
      <Text numberOfLines={3} style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...typography.label,
    color: "rgba(255,255,255,0.72)",
    marginTop: 4
  },
  card: {
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 13
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 17
  }
});
