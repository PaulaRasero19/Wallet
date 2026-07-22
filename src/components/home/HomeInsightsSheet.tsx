import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Brain } from "lucide-react-native";
import { colors, spacing, typography } from "../../theme";
import { Account, Currency, Goal, PlannerEvent, Transaction } from "../../types/finflow";
import { getAntExpenses, percentage } from "../../utils/financeInsights";
import { formatCompactMoney, formatMoney } from "../../utils/money";
import { FinancialInsightCard } from "./FinancialInsightCard";
import { RecentTransactionsList } from "./RecentTransactionsList";

function formatEvent(event: PlannerEvent | null) {
  if (!event?.date) return "Sin vencimientos próximos";
  const date = new Date(`${event.date}T12:00:00`).toLocaleDateString("es-UY", { day: "2-digit", month: "short" });
  return `${event.title} · ${date}${event.time ? ` · ${event.time}` : ""}`;
}

export function HomeInsightsSheet({
  accounts,
  currency,
  goal,
  incomeUsedPercent,
  nextEvent,
  priorityInsight,
  transactions
}: {
  accounts: Account[];
  currency: Currency;
  goal?: Goal;
  incomeUsedPercent: number;
  nextEvent: PlannerEvent | null;
  priorityInsight: string;
  transactions: Transaction[];
}) {
  const { height } = useWindowDimensions();
  const collapsed = Math.round(height * 0.49);
  const expanded = Math.round(height * 0.88);
  const [isExpanded, setExpanded] = useState(false);
  const sheetHeight = useRef(new Animated.Value(collapsed)).current;
  const antExpenses = useMemo(() => getAntExpenses(transactions), [transactions]);
  const antTotal = antExpenses.reduce((sum, transaction) => sum + Math.abs(transaction.raw_amount ?? transaction.rawAmount ?? transaction.amount), 0);
  const goalPercent = goal ? percentage(goal.saved, goal.target) : 0;

  useEffect(() => {
    Animated.spring(sheetHeight, {
      damping: 19,
      mass: 0.9,
      stiffness: 130,
      toValue: isExpanded ? expanded : collapsed,
      useNativeDriver: false
    }).start();
  }, [collapsed, expanded, isExpanded, sheetHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -20) setExpanded(true);
          if (gesture.dy > 20) setExpanded(false);
        },
        onStartShouldSetPanResponder: () => true
      }),
    []
  );

  return (
    <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
      <Pressable accessibilityRole="button" onPress={() => setExpanded((value) => !value)} style={styles.handleWrap} {...panResponder.panHandlers}>
        <View style={styles.handleCutLeft} />
        <View style={styles.handle} />
        <View style={styles.handleCutRight} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.content} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {transactions.length ? (
          <View style={styles.cards}>
            <FinancialInsightCard
              body={`Ahorro potencial ${formatMoney(antTotal * 0.5, currency, false)}`}
              direction="down"
              onPress={() => router.push("/ant-expenses")}
              title="Gastos hormiga"
              value={`${antExpenses.length} gastos ${formatCompactMoney(antTotal, currency, false)}`}
            />
            <View style={styles.cardRow}>
              <FinancialInsightCard
                compact
                body={goal ? `${formatCompactMoney(goal.saved, goal.currency, false)} de ${formatCompactMoney(goal.target, goal.currency, false)}` : "Creá una meta para medir avance"}
                direction="up"
                onPress={() => router.push("/plan?tab=Ahorro")}
                title="Objetivo de ahorro mensual"
                value={`${goalPercent}%`}
              />
              <FinancialInsightCard
                compact
                body={incomeUsedPercent > 100 ? "Más que el ingreso del período" : "Del ingreso mensual estimado"}
                direction={incomeUsedPercent > 75 ? "down" : "up"}
                onPress={() => router.push("/statistics")}
                title="Ingresos utilizados"
                value={`+${incomeUsedPercent}%`}
              />
            </View>
          </View>
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => router.push("/insights")} style={styles.aiCard}>
          <Brain color={colors.black} size={18} />
          <View style={styles.aiTextBlock}>
            <Text style={styles.aiTitle}>Insight de IA</Text>
            <Text numberOfLines={3} style={styles.aiBody}>{priorityInsight}</Text>
          </View>
        </Pressable>

        <View style={styles.movementsHeader}>
          <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={styles.sectionLink}>Ver todos</Text>
          </Pressable>
        </View>
        <RecentTransactionsList accounts={accounts} transactions={transactions} />

        <Pressable accessibilityRole="button" onPress={() => router.push("/plan?tab=Calendario")} style={styles.nextEvent}>
          <Text style={styles.nextEventLabel}>Próximo vencimiento</Text>
          <Text style={styles.nextEventText}>{formatEvent(nextEvent)}</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  aiBody: {
    ...typography.label,
    color: colors.grayDark,
    marginTop: 3
  },
  aiCard: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 8,
    flexDirection: "row",
    gap: 10,
    marginTop: spacing.md,
    padding: 12
  },
  aiTextBlock: {
    flex: 1
  },
  aiTitle: {
    ...typography.label,
    color: colors.black,
    fontWeight: "800"
  },
  cardRow: {
    flexDirection: "row",
    gap: 4
  },
  cards: {
    gap: 4
  },
  content: {
    paddingBottom: 126,
    paddingHorizontal: 22,
    paddingTop: 16
  },
  handle: {
    backgroundColor: colors.black,
    borderRadius: 2,
    height: 4,
    width: 46
  },
  handleCutLeft: {
    backgroundColor: "transparent",
    borderBottomColor: colors.darkSurface,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderLeftWidth: 12,
    height: 0,
    width: 0
  },
  handleCutRight: {
    backgroundColor: "transparent",
    borderBottomColor: colors.darkSurface,
    borderBottomWidth: 10,
    borderRightColor: "transparent",
    borderRightWidth: 12,
    height: 0,
    width: 0
  },
  handleWrap: {
    alignItems: "center",
    flexDirection: "row",
    height: 18,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: -4,
    zIndex: 2
  },
  movementsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.md
  },
  nextEvent: {
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: 14
  },
  nextEventLabel: {
    ...typography.label,
    color: "rgba(255,255,255,0.62)",
    fontWeight: "700"
  },
  nextEventText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700",
    marginTop: 4
  },
  sectionLink: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "700"
  },
  sectionTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 19,
    lineHeight: 23
  },
  sheet: {
    backgroundColor: colors.darkSurface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    bottom: 0,
    left: 0,
    overflow: "visible",
    position: "absolute",
    right: 0
  }
});
