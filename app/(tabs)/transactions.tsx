import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { TransactionItem } from "../../src/components/TransactionItem";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";

const filters = ["Todos", "Ingresos", "Gastos", "Cuotas", "Recurrentes", "Hormiga"] as const;
type Filter = (typeof filters)[number];

export default function Transactions() {
  const { accounts, loadAccounts, loadTransactions, transactions } = useFinFlowStore();
  const [filter, setFilter] = useState<Filter>("Todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void loadAccounts();
    void loadTransactions();
  }, [loadAccounts, loadTransactions]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesQuery = !normalized || [transaction.merchant, transaction.title, transaction.category, transaction.note].some((value) => String(value || "").toLowerCase().includes(normalized));
      if (!matchesQuery) return false;
      if (filter === "Ingresos") return transaction.type === "income";
      if (filter === "Gastos") return transaction.type === "expense";
      if (filter === "Cuotas") return Boolean(transaction.installment);
      if (filter === "Recurrentes") return Boolean(transaction.isRecurring || transaction.is_recurring);
      if (filter === "Hormiga") return Boolean(transaction.isAntExpense || transaction.is_ant_expense);
      return true;
    });
  }, [filter, query, transactions]);

  return (
    <ScreenContainer>
      <Header title="Movimientos" />
      <Text style={styles.lead}>Buscá, filtrá y entendé cada movimiento por comercio, categoría y cuenta.</Text>
      <TextInput
        autoCapitalize="none"
        onChangeText={setQuery}
        placeholder="Buscar comercio, categoría o nota"
        placeholderTextColor={colors.grayMedium}
        style={styles.search}
        value={query}
      />
      <View style={styles.filters}>
        {filters.map((item) => (
          <Pressable key={item} accessibilityRole="button" onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}>
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.list}>
        <Text style={styles.count}>{visible.length} movimientos</Text>
        {visible.length === 0 ? (
          <Text style={styles.empty}>No hay movimientos para este filtro.</Text>
        ) : (
          visible.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              account={accounts.find((account) => account.id === (transaction.account_id || transaction.accountId))}
              transaction={transaction}
            />
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lead: {
    ...typography.body,
    color: colors.grayDark,
    marginTop: spacing.lg
  },
  search: {
    ...typography.body,
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.black,
    marginTop: spacing.lg,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  filter: {
    borderColor: colors.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  activeFilter: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  filterText: {
    ...typography.label,
    color: colors.black,
    fontWeight: "700"
  },
  activeFilterText: {
    color: colors.white
  },
  list: {
    marginTop: spacing.xl
  },
  count: {
    ...typography.label,
    color: colors.grayDark,
    marginBottom: spacing.sm
  },
  empty: {
    ...typography.body,
    color: colors.grayDark
  }
});
