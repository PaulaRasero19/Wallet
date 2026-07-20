import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check, X } from "lucide-react-native";
import { RecurringPayment } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { formatMoney } from "../utils/money";
import { Dot } from "./Dot";

export function RecurringDetectionItem({
  payment,
  onConfirm,
  onReject
}: {
  payment: RecurringPayment;
  onConfirm: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.row}>
      <Dot color={payment.kind === "subscription" ? "lavender" : "blue"} size={12} />
      <View style={styles.copy}>
        <Text style={styles.title}>{payment.merchant}</Text>
        <Text style={styles.meta}>
          {formatMoney(payment.amount, payment.currency, false)} monthly · {Math.round(payment.confidence * 100)}% match
        </Text>
      </View>
      {payment.status === "pending" ? (
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.icon}>
            <Check color={colors.black} size={15} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onReject} style={styles.icon}>
            <X color={colors.orange} size={15} />
          </Pressable>
        </View>
      ) : (
        <Text style={styles.status}>{payment.status}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 58
  },
  copy: {
    flex: 1
  },
  title: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600"
  },
  meta: {
    ...typography.label
  },
  actions: {
    flexDirection: "row",
    gap: spacing.xs
  },
  icon: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  status: {
    ...typography.label,
    color: colors.black,
    fontWeight: "600"
  }
});
