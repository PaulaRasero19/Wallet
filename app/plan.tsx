import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "../src/components/Header";
import { InsightMetric } from "../src/components/InsightMetric";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { CreditCard, Currency, Goal, PlannerEvent, RecurringPayment, Transaction } from "../src/types/finflow";
import { categorySummary, getInstallments, overviewMetrics, positiveAmount } from "../src/utils/financeInsights";
import { formatMoney, percentage } from "../src/utils/money";

const tabs = ["Mes", "Metas", "Tarjetas", "Calendario"] as const;
type Tab = (typeof tabs)[number];

function monthName(date = new Date()) {
  return date.toLocaleDateString("es-UY", { month: "long" });
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function monthKey(date: Date) {
  return date.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
}

function budgetStatus(spent: number, budget: number) {
  const ratio = budget ? spent / budget : 0;
  if (ratio >= 1) return "superado";
  if (ratio >= 0.82) return "cerca del límite";
  return "dentro del presupuesto";
}

function statusColor(status: string) {
  if (status === "superado") return "#E65C50";
  if (status === "cerca del límite") return "#F0C75E";
  return "#66C86D";
}

export default function Plan() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(tabs.includes(params.tab as Tab) ? (params.tab as Tab) : "Mes");
  const { accounts, creditCards, events, goals, loadOverview, overview, recurringPayments, transactions, toggleEventDone } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const currency: Currency = profile?.primary_currency || "UYU";
  const monthlyIncome = Number(profile?.monthly_income || overview?.income || 0);
  const installments = useMemo(() => getInstallments(transactions), [transactions]);
  const metrics = overviewMetrics({ accounts, creditCards, events, goals, overview, payday: profile?.payday, primaryCurrency: currency, recurringPayments, transactions, monthlyIncome });
  const categories = useMemo(() => categorySummary(transactions).slice(0, 6), [transactions]);
  const fixedExpenses = recurringPayments.filter((payment) => payment.status !== "rejected").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const installmentMonthly = installments.reduce((sum, transaction) => sum + Number(transaction.installment?.amountPerInstallment || 0), 0);
  const savingsTarget = goals.reduce((sum, goal) => sum + Number(goal.monthlyContribution || 0), 0);
  const variableAvailable = monthlyIncome - fixedExpenses - installmentMonthly - savingsTarget;

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Plan" />
      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable accessibilityRole="button" key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "Mes" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan de {monthName()}</Text>
          <View style={styles.panel}>
            <PlanRow label="Ingresos previstos" value={formatMoney(monthlyIncome, currency, false)} />
            <PlanRow label="Gastos fijos" value={formatMoney(fixedExpenses, currency, false)} />
            <PlanRow label="Cuotas" value={formatMoney(installmentMonthly, currency, false)} />
            <PlanRow label="Meta de ahorro" value={formatMoney(savingsTarget, currency, false)} />
            <PlanRow label="Disponible variable" value={formatMoney(variableAvailable, currency, false)} valueColor={variableAvailable >= 0 ? "#66C86D" : "#E65C50"} />
          </View>
          <Text style={styles.sectionTitle}>Categorías presupuestadas</Text>
          {categories.length ? (
            categories.map((category) => {
              const budget = Math.max(category.total, Math.ceil(category.total * 1.18));
              const status = budgetStatus(category.total, budget);
              return <BudgetRow budget={budget} currency={currency} key={category.name} name={category.name} spent={category.total} status={status} />;
            })
          ) : (
            <Text style={styles.empty}>Cuando registres gastos, FinFlow va a mostrar presupuestos por categoría.</Text>
          )}
        </View>
      ) : null}

      {tab === "Metas" ? (
        <View style={styles.section}>
          {goals.length ? goals.map((goal) => <GoalRow goal={goal} key={goal.id} />) : <Text style={styles.empty}>No tenés metas cargadas todavía.</Text>}
        </View>
      ) : null}

      {tab === "Tarjetas" ? (
        <View style={styles.section}>
          {creditCards.length ? creditCards.map((card) => <CardBlock card={card} installments={installments} key={card.id} />) : <Text style={styles.empty}>No hay tarjetas cargadas.</Text>}
        </View>
      ) : null}

      {tab === "Calendario" ? (
        <View style={styles.section}>
          <CalendarList cards={creditCards} events={events} goals={goals} installments={installments} payments={recurringPayments} onToggleEvent={toggleEventDone} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function PlanRow({ label, value, valueColor = colors.white }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.planRow}>
      <Text style={styles.planLabel}>{label}</Text>
      <Text style={[styles.planValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function BudgetRow({ budget, currency, name, spent, status }: { budget: number; currency: Currency; name: string; spent: number; status: string }) {
  const progress = percentage(spent, budget);
  return (
    <View style={styles.budgetRow}>
      <View style={styles.budgetHeader}>
        <Text style={styles.rowTitle}>{name}</Text>
        <Text style={[styles.status, { color: statusColor(status) }]}>{status}</Text>
      </View>
      <Text style={styles.rowMeta}>
        {formatMoney(spent, currency, false)} de {formatMoney(budget, currency, false)}
      </Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: statusColor(status), width: `${Math.min(100, progress)}%` }]} />
      </View>
      <Text style={styles.rowMeta}>Disponible {formatMoney(Math.max(0, budget - spent), currency, false)} · {progress}%</Text>
    </View>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const progress = percentage(goal.saved, goal.target);
  const remaining = Math.max(0, goal.target - goal.saved);
  const monthsLeft = goal.monthlyContribution > 0 ? Math.ceil(remaining / goal.monthlyContribution) : null;
  const rhythmDate = monthsLeft ? addMonths(new Date(), monthsLeft).toLocaleDateString("es-UY", { month: "long", year: "numeric" }) : "sin ritmo definido";

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/goal/${goal.id}`)} style={styles.panel}>
      <Text style={styles.sectionTitle}>{goal.name}</Text>
      <InsightMetric label="Progreso" value={`${formatMoney(goal.saved, goal.currency, false)} de ${formatMoney(goal.target, goal.currency, false)}`} meta={`${progress}%`} />
      <InsightMetric label="Te faltan" value={formatMoney(remaining, goal.currency, false)} meta={`A este ritmo: ${rhythmDate}`} />
    </Pressable>
  );
}

function CardBlock({ card, installments }: { card: CreditCard; installments: Transaction[] }) {
  const relatedInstallments = installments.filter((transaction) => String(transaction.accountId || transaction.account_id) === card.id);
  const committed = new Map<string, number>();
  relatedInstallments.forEach((transaction) => {
    const total = transaction.installment?.total || 0;
    const current = transaction.installment?.current || 1;
    const amount = Number(transaction.installment?.amountPerInstallment || 0);
    const base = transaction.installment?.nextDueDate ? new Date(transaction.installment.nextDueDate) : new Date();
    for (let index = current; index <= total; index += 1) {
      const key = monthKey(addMonths(base, index - current));
      committed.set(key, (committed.get(key) || 0) + amount);
    }
  });

  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(`/card/${card.id}`)} style={styles.panel}>
      <Text style={styles.sectionTitle}>{card.name}</Text>
      <PlanRow label="Límite" value={formatMoney(card.limit, card.currency, false)} />
      <PlanRow label="Utilizado" value={formatMoney(card.used, card.currency, false)} />
      <PlanRow label="Disponible" value={formatMoney(Math.max(0, card.limit - card.used), card.currency, false)} />
      <PlanRow label="Cierra" value={new Date(card.closingDate).toLocaleDateString("es-UY", { day: "numeric", month: "long" })} />
      <PlanRow label="Vence" value={new Date(card.dueDate).toLocaleDateString("es-UY", { day: "numeric", month: "long" })} />
      <Text style={styles.subTitle}>Ya comprometido</Text>
      {[...committed.entries()].slice(0, 3).map(([key, total]) => (
        <PlanRow key={key} label={key} value={formatMoney(total, card.currency, false)} />
      ))}
      <Text style={styles.subTitle}>Compras en cuotas</Text>
      {relatedInstallments.slice(0, 3).map((transaction) => (
        <View key={transaction.id} style={styles.installmentRow}>
          <Text style={styles.rowTitle}>{transaction.merchant || transaction.title}</Text>
          <Text style={styles.rowMeta}>
            Cuota {transaction.installment?.current} de {transaction.installment?.total} · {formatMoney(transaction.installment?.amountPerInstallment || 0, transaction.currency, false)}
          </Text>
          <Text style={styles.rowMeta}>Restante: {formatMoney(transaction.installment?.remainingAmount || 0, transaction.currency, false)}</Text>
        </View>
      ))}
    </Pressable>
  );
}

function CalendarList({
  cards,
  events,
  goals,
  installments,
  onToggleEvent,
  payments
}: {
  cards: CreditCard[];
  events: PlannerEvent[];
  goals: Goal[];
  installments: Transaction[];
  onToggleEvent: (id: string) => void;
  payments: RecurringPayment[];
}) {
  const rows = [
    ...events.map((event) => ({ date: event.date || new Date().toISOString(), id: event.id, kind: event.category, title: event.title, route: null as string | null, onPress: () => onToggleEvent(event.id) })),
    ...payments.map((payment) => ({ date: payment.nextChargeDate, id: payment.id, kind: payment.status === "pending" ? "vencimiento" : payment.status, title: payment.merchant, route: `/payment/${payment.id}`, onPress: null })),
    ...cards.flatMap((card) => [
      { date: card.closingDate, id: `${card.id}-closing`, kind: "cierre de tarjeta", title: `${card.name} cierra`, route: `/card/${card.id}`, onPress: null },
      { date: card.dueDate, id: `${card.id}-due`, kind: "vencimiento de tarjeta", title: `${card.name} vence`, route: `/card/${card.id}`, onPress: null }
    ]),
    ...installments.map((transaction) => ({
      date: transaction.installment?.nextDueDate || transaction.date,
      id: `${transaction.id}-installment`,
      kind: "cuota",
      title: transaction.merchant || transaction.title || "Cuota",
      route: `/transaction/${transaction.id}`,
      onPress: null
    })),
    ...goals.map((goal) => ({ date: new Date().toISOString(), id: `${goal.id}-goal`, kind: "meta", title: `Aporte a ${goal.name}`, route: `/goal/${goal.id}`, onPress: null }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!rows.length) return <Text style={styles.empty}>No hay agenda financiera cargada.</Text>;

  return (
    <View>
      {rows.map((row) => (
        <Pressable
          accessibilityRole="button"
          key={row.id}
          onPress={() => {
            if (row.onPress) row.onPress();
            else if (row.route) router.push(row.route as never);
          }}
          style={styles.calendarRow}
        >
          <Text style={styles.dateBadge}>{new Date(row.date).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}</Text>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowMeta}>{row.kind}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  activeTabText: {
    color: colors.black
  },
  budgetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  budgetRow: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  calendarRow: {
    alignItems: "center",
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm
  },
  dateBadge: {
    ...typography.label,
    color: colors.white,
    fontWeight: "900",
    width: 54
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.lg
  },
  installmentRow: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    paddingVertical: spacing.sm
  },
  panel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.lg
  },
  planLabel: {
    ...typography.body,
    color: colors.transparentWhite
  },
  planRow: {
    alignItems: "center",
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm
  },
  planValue: {
    ...typography.body,
    color: colors.white,
    fontWeight: "900",
    textAlign: "right"
  },
  progressFill: {
    borderRadius: 3,
    height: 6
  },
  progressTrack: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    height: 6,
    marginTop: spacing.sm,
    overflow: "hidden"
  },
  rowCopy: {
    flex: 1
  },
  rowMeta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: 3
  },
  rowTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  section: {
    marginTop: spacing.xl
  },
  sectionTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 20,
    marginBottom: spacing.sm
  },
  status: {
    ...typography.label,
    fontWeight: "900"
  },
  subTitle: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "900",
    marginTop: spacing.md,
    textTransform: "uppercase"
  },
  tab: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  tabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  tabText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "800"
  }
});
