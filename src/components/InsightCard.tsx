import { StyleSheet, Text, View } from "react-native";
import { AiMessage } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { DotProgress } from "./DotProgress";

export function InsightCard({ message }: { message: AiMessage }) {
  const isUser = message.role === "user";

  return (
    <View style={[styles.card, isUser && styles.userCard]}>
      <Text style={[styles.text, isUser && styles.userText]}>{message.text}</Text>
      {message.progress != null ? <DotProgress progress={message.progress} color="orange" total={10} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 18,
    gap: spacing.sm,
    marginBottom: spacing.md,
    maxWidth: "84%",
    padding: spacing.md
  },
  userCard: {
    alignSelf: "flex-start",
    backgroundColor: colors.darkSurface,
    borderColor: colors.grayDark,
    borderWidth: 1
  },
  text: {
    ...typography.body,
    color: colors.black
  },
  userText: {
    color: colors.white
  }
});
