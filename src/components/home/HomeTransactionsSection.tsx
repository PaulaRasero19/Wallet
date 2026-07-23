import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { colors, typography } from "../../theme";
import { Account, Transaction } from "../../types/finflow";
import { positiveAmount } from "../../utils/financeInsights";
import { formatMoney } from "../../utils/money";
import { HomeAIInsight } from "./HomeAIInsight";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-UY", { day: "numeric", month: "short" });
}

export function HomeTransactionsSection({
  accounts,
  aiInsight,
  transactions
}: {
  accounts: Account[];
  aiInsight: string;
  transactions: Transaction[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.handle} />
      <Text style={styles.title}>Últimos movimientos</Text>
      <View style={styles.list}>
        {transactions.length ? (
          transactions.slice(0, 8).map((transaction) => {
            const isIncome = transaction.type === "income";
            const account = accounts.find((item) => item.id === (transaction.account_id || transaction.accountId));
            return (
              <Pressable accessibilityRole="button" key={transaction.id} onPress={() => router.push("/(tabs)/transactions")} style={styles.row}>
                <View style={[styles.dot, isIncome && styles.incomeDot]} />
                <View style={styles.main}>
                  <Text numberOfLines={1} style={styles.merchant}>{transaction.merchant || transaction.title || transaction.category}</Text>
                  <Text numberOfLines={1} style={styles.date}>{formatDate(transaction.date)}</Text>
                </View>
                <View style={styles.amountBlock}>
                  <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
                    {isIncome ? "+" : "-"}{formatMoney(positiveAmount(transaction), transaction.currency, false)}
                  </Text>
                  <Text numberOfLines={1} style={styles.account}>{account?.name || "Cuenta"}</Text>
                </View>
              </Pressable>
            );
          })
        ) : (
          <Text style={styles.empty}>Todavía no hay movimientos reales.</Text>
        )}
      </View>
      <HomeAIInsight text={aiInsight} />
      <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/transactions")} style={styles.viewAll}>
        <Text style={styles.viewAllText}>Ver todos los movimientos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  account: {
    ...typography.label,
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 13,
    marginTop: 1,
    maxWidth: 126,
    textAlign: "right"
  },
  amount: {
    ...typography.label,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 15
  },
  amountBlock: {
    alignItems: "flex-end",
    minWidth: 126
  },
  date: {
    ...typography.label,
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 13
  },
  dot: {
    backgroundColor: "rgba(235,235,233,0.92)",
    borderRadius: 22,
    height: 44,
    width: 44
  },
  empty: {
    ...typography.body,
    color: "rgba(255,255,255,0.72)"
  },
  expense: {
    color: colors.negative
  },
  handle: {
    alignSelf: "center",
    backgroundColor: colors.black,
    borderRadius: 2,
    height: 4,
    marginBottom: 8,
    width: 46
  },
  income: {
    color: colors.positive
  },
  incomeDot: {
    backgroundColor: "rgba(180,180,176,0.92)"
  },
  list: {
    gap: 18,
    marginTop: 22
  },
  main: {
    flex: 1
  },
  merchant: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 16
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 50
  },
  section: {
    backgroundColor: "#242422",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingTop: 0
  },
  title: {
    ...typography.title,
    color: colors.white,
    fontSize: 22,
    lineHeight: 24
  },
  viewAll: {
    alignItems: "center",
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    minHeight: 44,
    justifyContent: "center"
  },
  viewAllText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "800"
  }
});
