import { StyleSheet, Text, View } from "react-native";
import { Account, Transaction } from "../types/finflow";
import { colors, spacing, typography } from "../theme";
import { formatMoney } from "../utils/money";
import { positiveAmount } from "../utils/financeInsights";
import { Dot } from "./Dot";

export function TransactionItem({ account, transaction, dark = false }: { account?: Account; transaction: Transaction; dark?: boolean }) {
  const textColor = dark ? colors.white : colors.black;
  const muted = dark ? colors.transparentWhite : colors.grayMedium;
  const category = String(transaction.category || transaction.title || "Sin categoría");
  const dateLabel = transaction.date ? new Date(transaction.date).toLocaleDateString("es-UY", { day: "2-digit", month: "short" }) : "";
  const tags = [
    account?.name,
    transaction.installment ? `Cuota ${transaction.installment.current}/${transaction.installment.total}` : null,
    transaction.isRecurring || transaction.is_recurring ? "recurrente" : null,
    transaction.isAntExpense || transaction.is_ant_expense ? "hormiga" : null
  ].filter(Boolean);

  return (
    <View style={styles.row}>
      <Dot color={transaction.accent || (transaction.type === "income" ? "lime" : "orange")} size={18} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: textColor }]}>{transaction.merchant || transaction.title}</Text>
        <Text style={[styles.meta, { color: muted }]}>
          {category} · {dateLabel} · {transaction.time}
        </Text>
        {tags.length > 0 ? <Text style={[styles.tags, { color: muted }]}>{tags.join(" · ")}</Text> : null}
      </View>
      <Text style={[styles.amount, { color: textColor }]}>{formatMoney(transaction.type === "expense" ? -positiveAmount(transaction) : positiveAmount(transaction), transaction.currency)}</Text>
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
  tags: {
    ...typography.label,
    marginTop: 2
  },
  amount: {
    ...typography.label,
    color: colors.black,
    fontWeight: "600"
  }
});
