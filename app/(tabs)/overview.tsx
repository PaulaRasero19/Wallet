import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bell, Plus } from "lucide-react-native";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { DarkScreenContainer } from "../../src/components/DarkScreenContainer";
import { Dot } from "../../src/components/Dot";
import { DotChart } from "../../src/components/DotChart";
import { Header } from "../../src/components/Header";
import { TransactionItem } from "../../src/components/TransactionItem";
import { translate } from "../../src/i18n";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatMoney } from "../../src/utils/money";

const filters = ["1W", "1M", "3M", "1Y", "All"];

export default function Overview() {
  const { accounts, transactions } = useFinFlowStore();
  const { language, profile } = useSessionStore();
  const t = (key: string) => translate(language, key);
  const hasFinancialData = accounts.length > 0 || transactions.length > 0;

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
        {profile?.is_demo ? <Text style={styles.demo}>{t("dashboard.demoMode")}</Text> : null}
        <Text style={styles.label}>{t("dashboard.available")}</Text>
        {hasFinancialData ? <Text style={styles.balance}>Calculated from Supabase</Text> : <Text style={styles.emptyTitle}>{t("dashboard.emptyTitle")}</Text>}
        <Text style={styles.available}>{hasFinancialData ? "" : t("dashboard.emptyBody")}</Text>
      </Animated.View>

      <View style={styles.chartWrap}>
        {hasFinancialData ? <DotChart points={[]} /> : <Text style={styles.chartEmpty}>{t("dashboard.emptyChart")}</Text>}
      </View>

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

      {hasFinancialData ? (
        <>
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
        </>
      ) : null}

      <Text style={styles.section}>Recent Activity</Text>
      <View style={styles.panel}>
        {transactions.length > 0 ? (
          transactions.slice(0, 3).map((transaction) => <TransactionItem key={transaction.id} transaction={transaction} dark />)
        ) : (
          <Text style={styles.chartEmpty}>Todavía no registraste movimientos.</Text>
        )}
      </View>
      <Text style={styles.footnote}>Signed in as {profile?.full_name || profile?.id}</Text>
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
  demo: {
    ...typography.label,
    color: colors.orange,
    fontWeight: "700"
  },
  emptyTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 25,
    lineHeight: 31
  },
  available: {
    ...typography.label,
    color: colors.white,
    marginTop: spacing.xs
  },
  chartWrap: {
    borderColor: colors.grayDark,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: spacing.lg,
    minHeight: 112,
    justifyContent: "center",
    padding: spacing.md
  },
  chartEmpty: {
    ...typography.body,
    color: colors.transparentWhite
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
