import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, Plus } from "lucide-react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { DarkScreenContainer } from "../../src/components/DarkScreenContainer";
import { Dot } from "../../src/components/Dot";
import { DotChart } from "../../src/components/DotChart";
import { ForecastPanel } from "../../src/components/ForecastPanel";
import { Header } from "../../src/components/Header";
import { TransactionItem } from "../../src/components/TransactionItem";
import { buildForecast } from "../../src/services/forecastService";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatMoney, formatUYU } from "../../src/utils/money";

const filters = ["1W", "1M", "3M", "1Y", "All"];

export default function Overview() {
  const { accounts, balance, budgets, creditCards, exchangeRates, goals, recurringPayments, transactions, user } = useFinFlowStore();
  const forecast = buildForecast({
    accounts,
    budgets,
    creditCards,
    exchangeRates,
    goals,
    recurringPayments,
    transactions,
    nextIncomeDate: user.nextIncomeDate
  });

  return (
    <DarkScreenContainer>
      <Header
        title="Overview"
        dark
        right={
          <View style={styles.headerRight}>
            <Bell color={colors.white} size={18} />
            <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/add")} style={styles.plusButton}>
              <Plus color={colors.white} size={16} />
            </Pressable>
          </View>
        }
      />
      <Animated.View entering={FadeInDown.duration(420)} style={styles.hero}>
        <View style={styles.avatar}>
          <Dot color="white" size={6} />
          <Dot color="orange" size={6} />
          <Dot color="white" size={6} />
        </View>
        <Text style={styles.label}>Total Balance</Text>
        <Text style={styles.balance}>{formatUYU(balance, false)}</Text>
        <Text style={styles.growth}>+12.4% vs last month</Text>
        <Text style={styles.available}>Really available: {formatUYU(forecast.realAvailable, false)}</Text>
      </Animated.View>

      <View style={styles.chartWrap}>
        <DotChart />
      </View>

      <ForecastPanel forecast={forecast} dark />

      <View style={styles.filters}>
        {filters.map((filter) => (
          <Text key={filter} style={[styles.filter, filter === "1M" && styles.filterActive]}>
            {filter}
          </Text>
        ))}
      </View>

      <View style={styles.quickLinks}>
        <Pressable accessibilityRole="button" onPress={() => router.push("/budget")} style={styles.quickLink}>
          <Text style={styles.quickTitle}>Budget</Text>
          <Text style={styles.quickMeta}>Dot circle view</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/goals")} style={styles.quickLink}>
          <Text style={styles.quickTitle}>Goals</Text>
          <Text style={styles.quickMeta}>Savings progress</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push("/insights")} style={styles.quickLink}>
          <Text style={styles.quickTitle}>AI</Text>
          <Text style={styles.quickMeta}>Ask FinFlow</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Accounts</Text>
      <View style={styles.panel}>
        {accounts.map((account) => (
          <View key={account.id} style={styles.accountRow}>
            <View style={styles.accountLeft}>
              <Dot color={account.accent} size={10} />
              <Text style={styles.accountName}>
                {account.name} •••• {account.mask}
              </Text>
            </View>
            <Text style={styles.accountBalance}>{formatMoney(account.balance, account.currency, false)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Recent Activity</Text>
      <View style={styles.panel}>
        {transactions.slice(0, 3).map((transaction) => (
          <TransactionItem key={transaction.id} transaction={transaction} dark />
        ))}
      </View>
      <Text style={styles.footnote}>Signed in as {user.name}</Text>
    </DarkScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md
  },
  plusButton: {
    alignItems: "center",
    borderColor: colors.grayDark,
    borderRadius: 18,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  hero: {
    gap: spacing.xs,
    marginTop: spacing.xl
  },
  avatar: {
    flexDirection: "row",
    gap: 4,
    marginBottom: spacing.sm
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite
  },
  balance: {
    ...typography.value,
    color: colors.white
  },
  growth: {
    ...typography.label,
    color: colors.lime
  },
  available: {
    ...typography.label,
    color: colors.white,
    marginTop: spacing.xs
  },
  chartWrap: {
    marginTop: spacing.lg
  },
  filters: {
    borderBottomColor: colors.grayDark,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingBottom: spacing.md
  },
  filter: {
    ...typography.label,
    color: colors.transparentWhite,
    minWidth: 38,
    textAlign: "center"
  },
  filterActive: {
    backgroundColor: colors.white,
    borderRadius: 14,
    color: colors.black,
    overflow: "hidden",
    paddingVertical: 5
  },
  quickLinks: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  quickLink: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.grayDark,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    minHeight: 76,
    padding: spacing.md
  },
  quickTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600"
  },
  quickMeta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: spacing.xs
  },
  section: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600",
    marginTop: spacing.xl
  },
  panel: {
    marginTop: spacing.sm
  },
  accountRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42
  },
  accountLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  accountName: {
    ...typography.body,
    color: colors.white,
    fontSize: 14
  },
  accountBalance: {
    ...typography.body,
    color: colors.white,
    fontSize: 14,
    fontWeight: "600"
  },
  footnote: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: spacing.xl
  }
});
