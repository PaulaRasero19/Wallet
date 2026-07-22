import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "../src/components/Header";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { Currency, Goal, InstallmentPurchase, RecurringPayment } from "../src/types/finflow";
import { cappedGoalProgress, suggestedMonthlySaving } from "../src/utils/goals";
import { formatMoney } from "../src/utils/money";

const tabs = ["Resumen", "Metas", "Calendario"] as const;
const weekDays = ["L", "M", "M", "J", "V", "S", "D"];
type Tab = (typeof tabs)[number];

type PlannedEvent = {
  amount: number;
  currency: Currency;
  date: string;
  id: string;
  income: boolean;
  paid: boolean;
  title: string;
  action?: () => Promise<void>;
  open: () => void;
};

function startOfMonth(value = new Date()) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function shiftMonth(value: Date, offset: number) {
  return new Date(value.getFullYear(), value.getMonth() + offset, 1);
}

function monthKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dayKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(value: Date) {
  const label = value.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function monthTitle(value: Date) {
  const label = value.toLocaleDateString("es-UY", { month: "long" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function isSalary(payment: RecurringPayment) {
  return /sueldo|salario|salary/i.test(`${payment.merchant} ${payment.category}`);
}

function eventStatus(event: PlannedEvent) {
  if (event.paid) return event.income ? "Recibido" : "Pagado";
  const today = dayKey(new Date());
  const date = dayKey(event.date);
  if (event.income) return date === today ? "Esperado hoy" : "Previsto";
  if (date === today) return "Vence hoy";
  if (date < today) return "Vencido";
  return event.id.startsWith("installment-") ? "Pendiente" : "Próximo";
}

function buildEvents(payments: RecurringPayment[], purchases: InstallmentPurchase[], onPayment: (id: string) => Promise<void>, onInstallment: (purchaseId: string, installmentId: string) => Promise<void>) {
  const paymentEvents: PlannedEvent[] = payments
    .filter((payment) => payment.active !== false && payment.status !== "rejected")
    .map((payment) => ({
      action: () => onPayment(payment.id),
      amount: Number(payment.amount || 0),
      currency: payment.currency,
      date: payment.nextChargeDate,
      id: `payment-${payment.id}`,
      income: payment.kind === "income",
      open: () => router.push({ pathname: "/payment/[id]", params: { id: payment.id } }),
      paid: payment.status === "paid",
      title: payment.merchant
    }));
  const installmentEvents: PlannedEvent[] = purchases.flatMap((purchase) => purchase.installments.map((installment) => ({
    action: installment.status === "pending" ? () => onInstallment(purchase.id, installment.id) : undefined,
    amount: Number(installment.amount || 0),
    currency: purchase.currency,
    date: installment.dueDate || installment.due_date || "",
    id: `installment-${purchase.id}-${installment.id}`,
    income: false,
    open: () => router.push({ pathname: "/installment/[id]", params: { id: purchase.id, installmentId: installment.id } }),
    paid: installment.status === "paid",
    title: `Cuota ${installment.number} de ${purchase.totalInstallments || purchase.total_installments} · ${purchase.name}`
  })));
  return [...paymentEvents, ...installmentEvents].filter((event) => event.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export default function Plan() {
  const params = useLocalSearchParams<{ tab?: Tab }>();
  const [tab, setTab] = useState<Tab>(tabs.includes(params.tab as Tab) ? (params.tab as Tab) : "Resumen");
  const [selectedMonth, setSelectedMonth] = useState(startOfMonth());
  const [selectedDay, setSelectedDay] = useState(dayKey(new Date()));
  const { exchangeRates, goals, installmentPurchases, loadOverview, markInstallmentPaid, markPaymentPaid, recurringPayments } = useFinFlowStore();
  const profile = useSessionStore((state) => state.profile);
  const currency: Currency = profile?.primary_currency || "UYU";
  const profileIncome = Number(profile?.monthly_income || 0);
  const allEvents = useMemo(() => buildEvents(recurringPayments, installmentPurchases, markPaymentPaid, markInstallmentPaid), [installmentPurchases, markInstallmentPaid, markPaymentPaid, recurringPayments]);
  const monthEvents = useMemo(() => allEvents.filter((event) => monthKey(event.date) === monthKey(selectedMonth)), [allEvents, selectedMonth]);
  const toProfileCurrency = (event: PlannedEvent) => event.amount * Number(exchangeRates[event.currency] || 1) / Number(exchangeRates[currency] || 1);
  const plannedIncome = monthEvents.filter((event) => event.income && !event.paid && !(profileIncome > 0 && isSalary(recurringPayments.find((payment) => `payment-${payment.id}` === event.id)!))).reduce((sum, event) => sum + toProfileCurrency(event), 0);
  const expectedIncome = profileIncome + plannedIncome;
  const scheduledPayments = monthEvents.filter((event) => !event.income && !event.paid && !event.id.startsWith("installment-")).reduce((sum, event) => sum + toProfileCurrency(event), 0);
  const installmentsDue = monthEvents.filter((event) => !event.paid && event.id.startsWith("installment-")).reduce((sum, event) => sum + toProfileCurrency(event), 0);
  const shortfall = Math.max(0, scheduledPayments + installmentsDue - expectedIncome);
  const estimatedAvailable = Math.max(0, expectedIncome - scheduledPayments - installmentsDue);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  useEffect(() => {
    if (tabs.includes(params.tab as Tab)) setTab(params.tab as Tab);
  }, [params.tab]);

  function changeMonth(offset: number) {
    const next = shiftMonth(selectedMonth, offset);
    setSelectedMonth(next);
    setSelectedDay(dayKey(monthKey(next) === monthKey(new Date()) ? new Date() : next));
  }

  function goToCurrentMonth() {
    const now = new Date();
    setSelectedMonth(startOfMonth(now));
    setSelectedDay(dayKey(now));
  }

  return (
    <ScreenContainer>
      <Header title="Plan" />
      <View style={styles.tabs}>
        {tabs.map((item) => <Pressable accessibilityRole="button" key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}><Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text></Pressable>)}
      </View>

      {tab !== "Metas" ? <MonthSelector month={selectedMonth} onChange={changeMonth} onCurrent={goToCurrentMonth} /> : null}

      {tab === "Resumen" ? <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan de {monthTitle(selectedMonth).toLocaleLowerCase("es-UY")}</Text>
        <View style={styles.panel}>
          <PlanRow label="Ingresos previstos" value={formatMoney(expectedIncome, currency, false)} />
          <PlanRow label="Pagos programados" value={formatMoney(scheduledPayments, currency, false)} />
          <PlanRow label="Cuotas del mes" value={formatMoney(installmentsDue, currency, false)} />
          <PlanRow label="Disponible estimado" value={formatMoney(estimatedAvailable, currency, false)} valueColor={shortfall ? "#F0C75E" : "#66C86D"} />
          {shortfall ? <Text style={styles.warning}>Te faltan {formatMoney(shortfall, currency, false)} para cubrir los compromisos de este mes.</Text> : null}
        </View>
        <Text style={styles.sectionTitle}>Próximos pagos</Text>
        <UpcomingPayments events={monthEvents} month={selectedMonth} onCalendar={() => setTab("Calendario")} />
      </View> : null}

      {tab === "Metas" ? <View style={styles.section}>
        {goals.length ? goals.map((goal) => <GoalRow goal={goal} key={goal.id} />) : <Text style={styles.empty}>Aún no creaste ninguna meta.{"\n"}Creala desde el botón +.</Text>}
      </View> : null}

      {tab === "Calendario" ? <View style={styles.section}>
        <MonthlyCalendar events={monthEvents} month={selectedMonth} onSelect={setSelectedDay} selectedDay={selectedDay} />
        <Text style={styles.calendarHelp}>Acá aparecen los pagos, cuotas e ingresos que programaste.</Text>
        {!monthEvents.length ? <Text style={styles.empty}>No tenés pagos ni ingresos programados para este mes.</Text> : null}
        <DayDetails day={selectedDay} events={monthEvents.filter((event) => dayKey(event.date) === selectedDay)} />
      </View> : null}
    </ScreenContainer>
  );
}

function MonthSelector({ month, onChange, onCurrent }: { month: Date; onChange: (offset: number) => void; onCurrent: () => void }) {
  const current = monthKey(month) === monthKey(new Date());
  return <View style={styles.monthBlock}><View style={styles.monthSelector}>
    <Pressable accessibilityLabel="Mes anterior" accessibilityRole="button" onPress={() => onChange(-1)} style={styles.monthArrow}><Text style={styles.monthArrowText}>‹</Text></Pressable>
    <Text style={styles.monthText}>{monthLabel(month)}</Text>
    <Pressable accessibilityLabel="Mes siguiente" accessibilityRole="button" onPress={() => onChange(1)} style={styles.monthArrow}><Text style={styles.monthArrowText}>›</Text></Pressable>
  </View>{!current ? <Pressable accessibilityRole="button" onPress={onCurrent}><Text style={styles.currentMonth}>Volver al mes actual</Text></Pressable> : null}</View>;
}

function PlanRow({ label, value, valueColor = colors.white }: { label: string; value: string; valueColor?: string }) {
  return <View style={styles.planRow}><Text style={styles.planLabel}>{label}</Text><Text style={[styles.planValue, { color: valueColor }]}>{value}</Text></View>;
}

function UpcomingPayments({ events, month, onCalendar }: { events: PlannedEvent[]; month: Date; onCalendar: () => void }) {
  const commitments = events.filter((event) => !event.income && !event.paid).slice(0, 3);
  if (!commitments.length) return <View><Text style={styles.empty}>No tenés pagos ni cuotas programados para {monthTitle(month).toLocaleLowerCase("es-UY")}.</Text><Text style={styles.emptySecondary}>Podés agregarlos desde el botón +.</Text></View>;
  return <View><View style={styles.panel}>{commitments.map((event) => <Pressable accessibilityRole="button" key={event.id} onPress={event.open} style={styles.upcomingRow}><Text style={styles.rowTitle}>{event.title}</Text><Text style={styles.rowMeta}>{new Date(event.date).toLocaleDateString("es-UY", { day: "numeric", month: "long" })} · {formatMoney(event.amount, event.currency, false)}</Text><Text style={styles.rowMeta}>{eventStatus(event)}</Text></Pressable>)}</View><Pressable accessibilityRole="button" onPress={onCalendar}><Text style={styles.linkText}>Ver calendario</Text></Pressable></View>;
}

function GoalRow({ goal }: { goal: Goal }) {
  const progress = cappedGoalProgress(goal.saved, goal.target);
  const remaining = Math.max(0, goal.target - goal.saved);
  const suggestion = suggestedMonthlySaving(goal);
  const targetDate = goal.targetDate || goal.target_date;
  return <Pressable accessibilityRole="button" onPress={() => router.push(`/goal/${goal.id}`)} style={styles.panel}>
    <Text style={styles.sectionTitle}>{goal.name}</Text>
    <Text style={styles.goalAmount}>{formatMoney(goal.saved, goal.currency, false)} de {formatMoney(goal.target, goal.currency, false)}</Text>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
    <Text style={styles.rowMeta}>{progress}% completado</Text>
    <Text style={styles.goalLine}>Te faltan {formatMoney(remaining, goal.currency, false)}</Text>
    {targetDate ? <Text style={styles.rowMeta}>Fecha objetivo: {new Date(targetDate).toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" })}</Text> : null}
    {suggestion !== null ? <Text style={styles.rowMeta}>Sugerencia: {formatMoney(suggestion, goal.currency, false)} por mes</Text> : null}
  </Pressable>;
}

function MonthlyCalendar({ events, month, onSelect, selectedDay }: { events: PlannedEvent[]; month: Date; onSelect: (day: string) => void; selectedDay: string }) {
  const firstDayOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDayOffset + daysInMonth) / 7) * 7 }, (_, index) => {
    const number = index - firstDayOffset + 1;
    return number >= 1 && number <= daysInMonth ? number : null;
  });
  const eventDays = new Set(events.map((event) => dayKey(event.date)));
  return <View style={styles.calendarPanel}><View style={styles.weekRow}>{weekDays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View><View style={styles.calendarGrid}>{cells.map((number, index) => {
    if (!number) return <View key={`empty-${index}`} style={styles.dayCell} />;
    const date = new Date(month.getFullYear(), month.getMonth(), number);
    const key = dayKey(date);
    const selected = key === selectedDay;
    return <Pressable accessibilityLabel={`${number} de ${monthLabel(month)}`} accessibilityRole="button" key={key} onPress={() => onSelect(key)} style={styles.dayCell}><View style={[styles.dayNumber, selected && styles.selectedDay]}><Text style={[styles.dayText, selected && styles.selectedDayText]}>{number}</Text></View>{eventDays.has(key) ? <View style={styles.eventDot} /> : null}</Pressable>;
  })}</View></View>;
}

function DayDetails({ day, events }: { day: string; events: PlannedEvent[] }) {
  const title = new Date(`${day}T12:00:00`).toLocaleDateString("es-UY", { day: "numeric", month: "long" });
  return <View style={styles.dayDetails}><Text style={styles.sectionTitle}>{title}</Text>{events.length ? events.map((event) => <View key={event.id} style={styles.calendarRow}><View style={styles.rowCopy}><Pressable accessibilityRole="button" onPress={event.open}><Text style={styles.rowTitle}>{event.title}</Text><Text style={styles.rowMeta}>{formatMoney(event.amount, event.currency, false)}</Text><Text style={styles.rowMeta}>{eventStatus(event)}</Text></Pressable>{event.action && !event.paid ? <Pressable accessibilityRole="button" onPress={() => void event.action?.()}><Text style={styles.actionText}>{event.income ? "Marcar como recibido" : event.id.startsWith("installment-") ? "Marcar como pagada" : "Marcar como pagado"}</Text></Pressable> : null}</View></View>) : <Text style={styles.empty}>No tenés pagos ni ingresos programados para este día.</Text>}</View>;
}

const styles = StyleSheet.create({
  actionText: { ...typography.label, color: colors.white, fontWeight: "900", marginTop: spacing.xs },
  activeTab: { backgroundColor: colors.white, borderColor: colors.white },
  activeTabText: { color: colors.black },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarHelp: { ...typography.body, color: colors.transparentWhite, marginTop: spacing.md },
  calendarPanel: { backgroundColor: colors.appGrayDark, borderColor: colors.appGrayBorder, borderRadius: 8, borderWidth: 1, padding: spacing.sm },
  calendarRow: { borderBottomColor: colors.appGrayBorder, borderBottomWidth: 1, flexDirection: "row", minHeight: 64, paddingVertical: spacing.sm },
  currentMonth: { ...typography.label, color: colors.white, fontWeight: "800", marginTop: spacing.xs, textAlign: "center" },
  dayCell: { alignItems: "center", height: 48, justifyContent: "center", width: "14.2857%" },
  dayDetails: { marginTop: spacing.xl },
  dayNumber: { alignItems: "center", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  dayText: { ...typography.body, color: colors.white },
  empty: { ...typography.body, color: colors.transparentWhite, marginTop: spacing.md },
  emptySecondary: { ...typography.label, color: colors.transparentWhite, marginTop: spacing.xs },
  eventDot: { backgroundColor: "#E65C50", borderRadius: 3, bottom: 3, height: 5, position: "absolute", width: 5 },
  goalAmount: { ...typography.body, color: colors.white, fontWeight: "800" },
  goalLine: { ...typography.body, color: colors.white, marginTop: spacing.sm },
  linkText: { ...typography.body, color: colors.white, fontWeight: "900", marginTop: spacing.sm },
  monthArrow: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  monthArrowText: { ...typography.title, color: colors.white, fontSize: 28 },
  monthBlock: { marginTop: spacing.lg },
  monthSelector: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  monthText: { ...typography.title, color: colors.white, fontSize: 20 },
  panel: { backgroundColor: colors.appGrayDark, borderColor: colors.appGrayBorder, borderRadius: 8, borderWidth: 1, gap: spacing.xs, marginBottom: spacing.md, padding: spacing.lg },
  planLabel: { ...typography.body, color: colors.transparentWhite },
  planRow: { alignItems: "center", borderBottomColor: colors.appGrayBorder, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  planValue: { ...typography.body, color: colors.white, fontWeight: "900", textAlign: "right" },
  progressFill: { backgroundColor: "#66C86D", borderRadius: 3, height: 6 },
  progressTrack: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 3, height: 6, marginTop: spacing.sm, overflow: "hidden" },
  rowCopy: { flex: 1 },
  rowMeta: { ...typography.label, color: colors.transparentWhite, marginTop: 3 },
  rowTitle: { ...typography.body, color: colors.white, fontWeight: "800" },
  section: { marginTop: spacing.xl },
  sectionTitle: { ...typography.title, color: colors.white, fontSize: 20, marginBottom: spacing.sm },
  selectedDay: { backgroundColor: colors.white },
  selectedDayText: { color: colors.black, fontWeight: "900" },
  tab: { borderColor: colors.appGrayBorder, borderRadius: 8, borderWidth: 1, justifyContent: "center", minHeight: 38, paddingHorizontal: spacing.md },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.lg },
  tabText: { ...typography.label, color: colors.white, fontWeight: "800" },
  upcomingRow: { borderBottomColor: colors.appGrayBorder, borderBottomWidth: 1, paddingVertical: spacing.sm },
  warning: { ...typography.label, color: "#F0C75E", marginTop: spacing.sm },
  weekDay: { ...typography.label, color: colors.transparentWhite, fontWeight: "900", textAlign: "center", width: "14.2857%" },
  weekRow: { flexDirection: "row", paddingVertical: spacing.sm }
});
