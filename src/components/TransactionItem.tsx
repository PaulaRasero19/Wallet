import { StyleSheet, Text, View } from "react-native";
import { Transaction } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { formatMoney } from "../utils/money";
import { Dot } from "./Dot";

export function TransactionItem({ transaction, dark = false }: { transaction: Transaction; dark?: boolean }) {
  const textColor = dark ? colors.white : colors.black;
  const muted = dark ? colors.transparentWhite : colors.grayMedium;

  return (
    <View style={styles.row}>
      <Dot color={transaction.accent} size={18} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: textColor }]}>{transaction.merchant}</Text>
        <Text style={[styles.meta, { color: muted }]}>
          {transaction.date}, {transaction.time}
        </Text>
      </View>
      <Text style={[styles.amount, { color: textColor }]}>{formatMoney(transaction.amount, transaction.currency)}</Text>
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
  info: {
    flex: 1
  },
  name: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600"
  },
  meta: {
    ...typography.label,
    marginTop: 2
  },
  amount: {
    ...typography.label,
    color: colors.black,
    fontWeight: "600"
  }
});
