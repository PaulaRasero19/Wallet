import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "../src/components/Header";
import { InsightMetric } from "../src/components/InsightMetric";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { Currency, Goal, InstallmentPurchase, PlannerEvent, RecurringPayment, Transaction } from "../src/types/finflow";
import { categorySummary, positiveAmount } from "../src/utils/financeInsights";
import { calculateMovementSummary } from "../src/utils/movementSummary";
import { formatMoney, percentage } from "../src/utils/money";

const tabs = ["Resumen", "Metas", "Calendario"] as const;
type Tab = (typeof tabs)[number];

function monthName(date = new Date()) {
  return date.toLocaleDateString("es-UY", { month: "long" });
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
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
  const [tab, setTab] = useState<Tab>(tabs.includes(params.tab as Tab) ? (params.tab as Tab) : "Resumen");
  const { events, goals, installmentPurchases, loadOverview, markInstallmentPaid, markPaymentPaid, overview, recurringPayments, transactions, toggleEventDone } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const currency: Currency = profile?.primary_currency || "UYU";
  const monthlyIncome = Number(profile?.monthly_income || 0);
  const currentMonth = new Date();
  const monthlySummary = calculateMovementSummary({ selectedMonth: currentMonth, transactions });
  const categories = useMemo(() => categorySummary(monthlySummary.includedExpenses).slice(0, 6), [monthlySummary.includedExpenses]);
  const expectedIncome = monthlySummary.actualIncome || monthlyIncome;
  const fixedExpenses = recurringPayments.filter((payment) => payment.status !== "rejected" && payment.active !== false && isSameMonth(payment.nextChargeDate, currentMonth)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const installmentMonthly = installmentPurchases.reduce((sum, purchase) => sum + purchase.installments.filter((installment) => installment.status === "pending" && isSameMonth(installment.dueDate, currentMonth)).reduce((total, installment) => total + Number(installment.amount || 0), 0), 0);
  const savingsTarget = goals.filter((goal) => (goal as any).status !== "completed").reduce((sum, goal) => sum + Number(goal.monthlyContribution || (goal as any).monthly_contribution || 0), 0);
  const variableAvailable = expectedIncome - fixedExpenses - installmentMonthly - savingsTarget;

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

      {tab === "Resumen" ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan de {monthName()}</Text>
          <View style={styles.panel}>
            <PlanRow label="Ingresos previstos" value={formatMoney(expectedIncome, currency, false)} />
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
            <Text style={styles.empty}>No hay movimientos este mes.</Text>
          )}
          <Text style={styles.sectionTitle}>Próximos pagos</Text>
          <UpcomingPayments currency={currency} installmentPurchases={installmentPurchases} payments={recurringPayments} />
        </View>
      ) : null}

      {tab === "Metas" ? (
        <View style={styles.section}>
          {goals.length ? goals.map((goal) => <GoalRow goal={goal} key={goal.id} />) : <Text style={styles.empty}>Aún no creaste una meta.{"\n"}Creá una desde el botón +.</Text>}
        </View>
      ) : null}

      {tab === "Calendario" ? (
        <View style={styles.section}>
          <CalendarList events={events} goals={goals} installmentPurchases={installmentPurchases} onMarkInstallmentPaid={markInstallmentPaid} onMarkPaymentPaid={markPaymentPaid} payments={recurringPayments} onToggleEvent={toggleEventDone} />
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

function CalendarList({
  events,
  goals,
  installmentPurchases,
  onMarkInstallmentPaid,
  onMarkPaymentPaid,
  onToggleEvent,
  payments
}: {
  events: PlannerEvent[];
  goals: Goal[];
  installmentPurchases: InstallmentPurchase[];
  onMarkInstallmentPaid: (purchaseId: string, installmentId: string) => Promise<void>;
  onMarkPaymentPaid: (id: string) => Promise<void>;
  onToggleEvent: (id: string) => void;
  payments: RecurringPayment[];
}) {
  const rows = [
    ...events.map((event) => ({ amount: 0, currency: "UYU" as Currency, date: event.date || new Date().toISOString(), id: event.id, kind: event.category, title: event.title, action: () => Promise.resolve(onToggleEvent(event.id)) })),
    ...payments.map((payment) => ({ amount: payment.amount, currency: payment.currency, date: payment.nextChargeDate, id: payment.id, kind: statusForDate(payment.nextChargeDate), title: payment.merchant, action: () => onMarkPaymentPaid(payment.id) })),
    ...installmentPurchases.flatMap((purchase) => purchase.installments.filter((installment) => installment.status === "pending").map((installment) => ({
      amount: installment.amount,
      currency: purchase.currency,
      date: installment.dueDate,
      id: `${purchase.id}-${installment.id}`,
      kind: "cuota",
      title: `Cuota ${installment.number} de ${purchase.totalInstallments || purchase.total_installments} · ${purchase.name}`,
      action: () => onMarkInstallmentPaid(purchase.id, installment.id)
    }))),
    ...goals.filter((goal) => (goal as any).targetDate || (goal as any).target_date).map((goal) => ({ amount: 0, currency: goal.currency, date: (goal as any).targetDate || (goal as any).target_date, id: `${goal.id}-goal`, kind: "meta", title: goal.name, action: null }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!rows.length) return <Text style={styles.empty}>No tenés pagos programados para este día.</Text>;

  return (
    <View>
      {rows.map((row) => (
        <Pressable
          accessibilityRole="button"
          key={row.id}
          onPress={() => {
            if (row.action) void row.action();
          }}
          style={styles.calendarRow}
        >
          <Text style={styles.dateBadge}>{new Date(row.date).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}</Text>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>{row.title}</Text>
            <Text style={styles.rowMeta}>{row.amount ? `${formatMoney(row.amount, row.currency, false)} · ` : ""}{row.kind}</Text>
            {row.action ? (
              <Pressable accessibilityRole="button" onPress={() => void row.action?.()}>
                <Text style={styles.actionText}>Marcar como pagado</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function isSameMonth(value: string, month: Date) {
  const date = new Date(value);
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

function statusForDate(value: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  if (date.getTime() === today.getTime()) return "Vence hoy";
  if (date < today) return "Vencido";
  return "Próximo";
}

function UpcomingPayments({ currency, installmentPurchases, payments }: { currency: Currency; installmentPurchases: InstallmentPurchase[]; payments: RecurringPayment[] }) {
  const rows = [
    ...payments.filter((payment) => payment.active !== false && payment.status !== "paid").map((payment) => ({ amount: payment.amount, currency: payment.currency, date: payment.nextChargeDate, id: `payment-${payment.id}`, status: statusForDate(payment.nextChargeDate), title: payment.merchant })),
    ...installmentPurchases.flatMap((purchase) => purchase.installments.filter((installment) => installment.status === "pending").map((installment) => ({ amount: installment.amount, currency: purchase.currency, date: installment.dueDate, id: `installment-${purchase.id}-${installment.id}`, status: statusForDate(installment.dueDate), title: `Cuota ${installment.number} de ${purchase.totalInstallments || purchase.total_installments} · ${purchase.name}` })))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 6);
  if (!rows.length) return <Text style={styles.empty}>No tenés pagos próximos.</Text>;
  return (
    <View style={styles.panel}>
      {rows.map((row) => (
        <PlanRow key={row.id} label={`${row.title} · ${new Date(row.date).toLocaleDateString("es-UY")}`} value={`${formatMoney(row.amount, row.currency || currency, false)} · ${row.status}`} />
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
  actionText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "900",
    marginTop: spacing.xs
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.lg
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
