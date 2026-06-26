import { StyleSheet, Switch, Text, View } from "react-native";
import { colors, spacing } from "../styles/theme";
import { formatCurrency } from "../utils/formatters";

export function SubscriptionItem({ subscription, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{subscription.name}</Text>
        <Text style={styles.meta}>
          Proximo cobro: {subscription.nextCharge} · {formatCurrency(subscription.amount)}
        </Text>
      </View>
      <Switch
        onValueChange={() => onToggle(subscription.id)}
        thumbColor={subscription.reminderEnabled ? colors.primary : "#F3F4F6"}
        trackColor={{ false: "#D1D5DB", true: "#BFDBFE" }}
        value={subscription.reminderEnabled}
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
  info: {
    flex: 1,
    paddingRight: spacing.md
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 3
  }
});
