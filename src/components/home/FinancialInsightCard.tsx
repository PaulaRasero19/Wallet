import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowDown, ArrowUp } from "lucide-react-native";
import { colors, typography } from "../../theme";

export function FinancialInsightCard({
  body,
  compact,
  direction = "up",
  onPress,
  title,
  value
}: {
  body?: string;
  compact?: boolean;
  direction?: "up" | "down";
  onPress?: () => void;
  title: string;
  value: ReactNode;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;

  return (
    <Pressable accessibilityRole={onPress ? "button" : undefined} disabled={!onPress} onPress={onPress} style={[styles.card, compact && styles.compact]}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.trend}>
          <Icon color={direction === "up" ? colors.lime : colors.orange} size={16} strokeWidth={2.4} />
        </View>
      </View>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      <Text adjustsFontSizeToFit numberOfLines={1} style={[styles.value, compact && styles.compactValue]}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    ...typography.label,
    color: "rgba(255,255,255,0.78)",
    marginTop: 8
  },
  card: {
    backgroundColor: "rgba(255, 240, 173, 0.28)",
    borderRadius: 8,
    minHeight: 110,
    padding: 14
  },
  compact: {
    flex: 1,
    minHeight: 126,
    padding: 12
  },
  compactValue: {
    fontSize: 34,
    lineHeight: 38
  },
  head: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between"
  },
  title: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 17
  },
  trend: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    width: 30
  },
  value: {
    ...typography.value,
    color: colors.white,
    fontSize: 36,
    lineHeight: 40,
    marginTop: "auto"
  }
});
