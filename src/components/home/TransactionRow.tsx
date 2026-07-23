import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Account, Transaction } from "../../types/finflow";
import { colors, typography } from "../../theme";
import { positiveAmount } from "../../utils/financeInsights";
import { formatMoney } from "../../utils/money";
import { MerchantLogo } from "../transactions/MerchantLogo";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

export function TransactionRow({ account, transaction }: { account?: Account; transaction: Transaction }) {
  const isIncome = transaction.type === "income";
  const installment = transaction.installment ? `Cuota ${transaction.installment.current}/${transaction.installment.total}` : null;
  const paymentLabel = installment || account?.name || "Cuenta";
  const title = transaction.merchant || transaction.title || transaction.category || "Movimiento";
  const id = String(transaction.id || transaction._id || "");

  return (
    <Pressable
      accessibilityRole="button"
      disabled={!id}
      onPress={() => {
        if (id) router.push({ pathname: "/transaction/[id]", params: { id } });
      }}
      style={styles.row}
    >
      <MerchantLogo category={transaction.category} merchant={transaction.merchant} title={transaction.title} />
      <View style={styles.main}>
        <Text numberOfLines={1} style={styles.merchant}>{title}</Text>
        <Text numberOfLines={1} style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>
      <View style={styles.amountBlock}>
        <Text numberOfLines={1} style={[styles.amount, isIncome ? styles.income : styles.expense]}>
          {isIncome ? "+" : "-"}{formatMoney(positiveAmount(transaction), transaction.currency, false)}
        </Text>
        <Text numberOfLines={1} style={styles.account}>{paymentLabel}</Text>
        {transaction.isRecurring || transaction.is_recurring || transaction.isAntExpense || transaction.is_ant_expense ? (
          <Text numberOfLines={1} style={styles.flags}>
            {[transaction.isRecurring || transaction.is_recurring ? "recurrente" : null, transaction.isAntExpense || transaction.is_ant_expense ? "hormiga" : null].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  account: {
    ...typography.label,
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    lineHeight: 13,
    marginTop: 2,
    maxWidth: 130,
    textAlign: "right"
  },
  amount: {
    ...typography.label,
    fontSize: 12,
    fontWeight: "900",
    lineHeight: 15
  },
  amountBlock: {
    alignItems: "flex-end",
    minWidth: 128
  },
  date: {
    ...typography.label,
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    lineHeight: 13,
    marginTop: 1
  },
  expense: {
    color: colors.negative
  },
  flags: {
    ...typography.label,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    lineHeight: 12,
    marginTop: 2,
    maxWidth: 130,
    textAlign: "right"
  },
  income: {
    color: colors.positive
  },
  main: {
    flex: 1,
    minWidth: 0
  },
  merchant: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 16
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 54
  }
});
