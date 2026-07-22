import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvailableMoney } from "../../src/components/home/AvailableMoney";
import { HomeBalanceChart } from "../../src/components/home/HomeBalanceChart";
import { HomeHeader } from "../../src/components/home/HomeHeader";
import { HomeMetricCards } from "../../src/components/home/HomeMetricCards";
import { HomeTransactionsSheet } from "../../src/components/home/HomeTransactionsSheet";
import { LiquidGradientBackground } from "../../src/components/home/LiquidGradientBackground";
import { HomePeriod, periodToApi, PeriodSelector } from "../../src/components/home/PeriodSelector";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors } from "../../src/theme";
import { overviewMetrics } from "../../src/utils/financeInsights";

export default function Overview() {
  const [period, setPeriod] = useState<HomePeriod>("1W");
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { accounts, creditCards, events, goals, loadNotifications, loadOverview, notifications, overview, recurringPayments, transactions } = useFinFlowStore();
  const { profile } = useSessionStore();
  const primaryCurrency = profile?.primary_currency || "UYU";
  const firstName = String(profile?.full_name || "Lucía").split(" ")[0];
  const metricsTop = height * 0.455;

  useEffect(() => {
    void loadOverview(periodToApi(period));
  }, [loadOverview, period]);

  useEffect(() => {
    void loadNotifications("pending");
  }, [loadNotifications]);

  const metrics = overviewMetrics({
    accounts,
    creditCards,
    events,
    goals,
    monthlyIncome: Number(profile?.monthly_income || 0),
    overview,
    payday: profile?.payday,
    primaryCurrency,
    recurringPayments,
    transactions
  });

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" translucent style="light" />
      <LiquidGradientBackground />
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <HomeHeader
          avatarUrl={profile?.avatar_url || profile?.avatarUrl}
          firstName={firstName}
          fullName={profile?.full_name || firstName}
          notificationCount={notifications.filter((notification) => notification.status === "pending").length}
          onAvatarPress={() => router.push("/profile")}
          onNotificationsPress={() => router.push("/notifications")}
        />
        <AvailableMoney amount={metrics.available} currency={primaryCurrency} />
        <HomeBalanceChart currency={primaryCurrency} history={overview?.history || []} onPress={() => router.push("/analysis")} period={period} />
        <PeriodSelector onChange={setPeriod} value={period} />
      </View>
      <View pointerEvents="none" style={[styles.metricLayer, { top: metricsTop }]}>
        <HomeMetricCards
          currency={primaryCurrency}
          expenses={Number(overview?.expenses || metrics.expenses || 0)}
          goal={metrics.goal}
          income={Number(overview?.income || metrics.income || 0)}
          monthlyIncome={Number(profile?.monthly_income || 0)}
          transactions={transactions}
        />
      </View>
      <HomeTransactionsSheet accounts={accounts} transactions={transactions} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    zIndex: 10
  },
  metricLayer: {
    left: 0,
    position: "absolute",
    right: 0,
    zIndex: 20
  },
  screen: {
    backgroundColor: colors.black,
    flex: 1,
    overflow: "hidden"
  }
});
