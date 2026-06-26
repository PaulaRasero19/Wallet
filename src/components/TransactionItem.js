import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../styles/theme";
import { formatCurrency } from "../utils/formatters";

export function TransactionItem({ transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{transaction.name}</Text>
        <Text style={styles.meta}>
          {transaction.category} · {transaction.date}
        </Text>
      </View>
      <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
        {formatCurrency(transaction.amount)}
      </Text>
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
  },
  amount: {
    fontSize: 16,
    fontWeight: "700"
  },
  income: {
    color: colors.success
  },
  expense: {
    color: colors.danger
  }
});
