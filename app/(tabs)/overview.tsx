import { useCallback, useEffect } from "react";
import { AppState, StyleSheet, useWindowDimensions, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AvailableMoney } from "../../src/components/home/AvailableMoney";
import { HomeHeader } from "../../src/components/home/HomeHeader";
import { HomeMetricCards } from "../../src/components/home/HomeMetricCards";
import { HomeGoalsSheet } from "../../src/components/home/HomeTransactionsSheet";
import { LiquidGradientBackground } from "../../src/components/home/LiquidGradientBackground";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { overviewMetrics } from "../../src/utils/financeInsights";
import { calculateFinancialInsights } from "../../src/utils/homeFinancialInsights";
import { calculateCompletedMonthlyTransactions } from "../../src/utils/movementSummary";

function insightDateRange() {
  const today = new Date();
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  return {
    dateFrom: previousMonthStart.toISOString(),
    dateTo: nextMonthStart.toISOString()
  };
}

export default function Overview() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { accounts, creditCards, events, goals, loadNotifications, loadOverview, loadTransactions, notifications, overview, recurringPayments, transactions } = useFinFlowStore();
  const { profile } = useSessionStore();
  const primaryCurrency = profile?.primary_currency || "UYU";
  const firstName = String(profile?.full_name || "Lucía").split(" ")[0];
  const profileMonthlyIncome = typeof profile?.monthly_income === "number" ? profile.monthly_income : null;
  const metricsTop = Math.min(height * 0.5, 390);
  const pendingNotifications = notifications.filter((item) => item.status === "pending").length;

  useEffect(() => {
    void loadNotifications("pending");
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadNotifications("pending");
    });
    return () => subscription.remove();
  }, [loadNotifications]);

  useFocusEffect(useCallback(() => {
    void loadNotifications("pending");
    void loadOverview();
    void loadTransactions({ ...insightDateRange(), limit: 500 });
  }, [loadNotifications, loadOverview, loadTransactions]));

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
  const cardInsights = calculateFinancialInsights({
    currencyCode: primaryCurrency,
    monthlyIncome: Number(profileMonthlyIncome || 0),
    savingsGoal: metrics.goal,
    transactions
  });
  const monthlyTotals = calculateCompletedMonthlyTransactions({ transactions });

  return (
    <View style={styles.screen}>
      <StatusBar backgroundColor="transparent" translucent style="light" />
      <LiquidGradientBackground />
      <LinearGradient colors={["#1C1C1B", "#1C1C1B", "rgba(28,28,27,0)"]} locations={[0, 0.12, 0.38]} pointerEvents="none" style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <HomeHeader
          avatarUrl={profile?.avatar_url || profile?.avatarUrl}
          firstName={firstName}
          fullName={profile?.full_name || firstName}
          notificationCount={pendingNotifications}
          onNotificationsPress={() => router.push({ pathname: "/notifications" })}
          onProfilePress={() => router.push("/profile")}
        />
        <AvailableMoney amount={monthlyTotals.balance} currency={primaryCurrency} />
      </View>
      <View pointerEvents="none" style={[styles.metricLayer, { top: metricsTop }]}>
        <HomeMetricCards
          currency={primaryCurrency}
          insights={cardInsights}
        />
      </View>
      <HomeGoalsSheet goals={goals} />
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
    backgroundColor: "#1C1C1B",
    flex: 1,
    overflow: "hidden"
  }
});
