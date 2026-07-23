import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme";
import { Account, Transaction } from "../../types/finflow";
import { positiveAmount } from "../../utils/financeInsights";
import { formatMoney } from "../../utils/money";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-UY", { day: "numeric", month: "short" });
}

export function RecentTransactionsList({ accounts, transactions }: { accounts: Account[]; transactions: Transaction[] }) {
  if (!transactions.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Sin movimientos todavía</Text>
        <Text style={styles.emptyText}>Cuando registres ingresos o gastos, van a aparecer acá con importes reales.</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {transactions.slice(0, 7).map((transaction, index) => {
        const account = accounts.find((item) => item.id === (transaction.account_id || transaction.accountId));
        const isIncome = transaction.type === "income";
        const amount = positiveAmount(transaction);
        return (
          <View key={transaction.id} style={[styles.row, index > 3 && styles.dimmed]}>
            <View style={[styles.dot, isIncome && styles.incomeDot]} />
            <View style={styles.main}>
              <Text numberOfLines={1} style={styles.title}>{transaction.merchant || transaction.title || transaction.category}</Text>
              <Text numberOfLines={1} style={styles.meta}>{formatDate(transaction.date)} · {transaction.category}</Text>
              {(transaction.installment || transaction.isAntExpense || transaction.is_ant_expense || transaction.isRecurring || transaction.is_recurring) ? (
                <Text numberOfLines={1} style={styles.flag}>
                  {transaction.installment ? `Cuota ${transaction.installment.current}/${transaction.installment.total}` : null}
                  {transaction.isAntExpense || transaction.is_ant_expense ? `${transaction.installment ? " · " : ""}Gasto hormiga` : null}
                  {transaction.isRecurring || transaction.is_recurring ? " · recurrente" : null}
                </Text>
              ) : null}
            </View>
            <View style={styles.right}>
              <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
                {isIncome ? "+" : "-"}{formatMoney(amount, transaction.currency, false)}
              </Text>
              <Text numberOfLines={1} style={styles.account}>{account?.name || "Cuenta"}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  account: {
    ...typography.label,
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
    lineHeight: 12,
    marginTop: 2,
    maxWidth: 112,
    textAlign: "right"
  },
  amount: {
    ...typography.label,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15
  },
  dimmed: {
    opacity: 0.55
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 20,
    height: 40,
    width: 40
  },
  empty: {
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16
  },
  emptyText: {
    ...typography.label,
    color: "rgba(255,255,255,0.64)",
    marginTop: 4
  },
  emptyTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  expense: {
    color: colors.negative
  },
  flag: {
    ...typography.label,
    color: "rgba(255,255,255,0.46)",
    fontSize: 12,
    lineHeight: 12,
    marginTop: 1
  },
  income: {
    color: colors.positive
  },
  incomeDot: {
    backgroundColor: "rgba(255,255,255,0.54)"
  },
  list: {
    gap: 16
  },
  main: {
    flex: 1
  },
  meta: {
    ...typography.label,
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    lineHeight: 13
  },
  right: {
    alignItems: "flex-end",
    minWidth: 104
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 46
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 16
  }
});
