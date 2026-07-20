import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { TransactionItem } from "../../src/components/TransactionItem";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { TransactionType } from "../../src/types/finflow";

const tabs: Array<"all" | TransactionType> = ["all", "income", "expense", "transfer"];

export default function Transactions() {
  const [active, setActive] = useState<(typeof tabs)[number]>("all");
  const transactions = useFinFlowStore((state) => state.transactions);
  const filtered = useMemo(
    () => (active === "all" ? transactions : transactions.filter((transaction) => transaction.type === active)),
    [active, transactions]
  );

  return (
    <ScreenContainer>
      <Header title="Transactions" actions={["search", "filter"]} />
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <Pressable key={tab} accessibilityRole="button" onPress={() => setActive(tab)} style={[styles.tab, active === tab && styles.activeTab]}>
            <Text style={[styles.tabText, active === tab && styles.activeText]}>{tab === "all" ? "All" : tab[0].toUpperCase() + tab.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.month}>May 2024</Text>
      <View style={styles.list}>
        {filtered.map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xl
  },
  tab: {
    borderRadius: 18,
    minHeight: 36,
    paddingHorizontal: 14,
    justifyContent: "center"
  },
  activeTab: {
    backgroundColor: colors.black
  },
  tabText: {
    ...typography.label,
    color: colors.black
  },
  activeText: {
    color: colors.white
  },
  month: {
    ...typography.body,
    color: colors.black,
    fontWeight: "600",
    marginTop: spacing.xl
  },
  list: {
    marginTop: spacing.sm
  }
});
