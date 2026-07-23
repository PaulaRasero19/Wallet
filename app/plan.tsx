import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useFinFlowStore } from "../src/store/useFinFlowStore";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { Currency, InstallmentPurchase, RecurringPayment } from "../src/types/finflow";
import { formatMoney } from "../src/utils/money";

const tabs = ["Resumen", "Calendario"] as const;
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

function parseAmount(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  return Number(normalized || 0);
}

function popupDate(value: string) {
  return new Date(`${value}T12:00:00`);
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
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupName, setPopupName] = useState("");
  const [popupAmount, setPopupAmount] = useState("");
  const [popupDateValue, setPopupDateValue] = useState(dayKey(new Date()));
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { createRecurringPayment, exchangeRates, installmentPurchases, loadOverview, markInstallmentPaid, markPaymentPaid, recurringPayments } = useFinFlowStore();
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

  useEffect(() => {
    if (tab !== "Calendario" || !monthEvents.length) return;
    if (monthEvents.some((event) => dayKey(event.date) === selectedDay)) return;
    const nextEvent = monthEvents.find((event) => !event.paid) || monthEvents[0];
    setSelectedDay(dayKey(nextEvent.date));
  }, [monthEvents, tab]);

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

  function choosePopupDate(event: DateTimePickerEvent, value?: Date) {
    if (Platform.OS === "android") setDatePickerOpen(false);
    if (event.type === "dismissed" || !value) return;
    setPopupDateValue(dayKey(value));
  }

  async function savePopupDate() {
    const amount = parseAmount(popupAmount);
    if (!popupName.trim()) {
      Alert.alert("FinFlow", "Ingresá un nombre.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("FinFlow", "Ingresá un monto mayor a cero.");
      return;
    }
    setSaving(true);
    try {
      await createRecurringPayment({
        amount,
        category: "Servicios",
        currency,
        frequency: "once",
        kind: "service",
        merchant: popupName.trim(),
        nextChargeDate: popupDate(popupDateValue).toISOString(),
        notificationsEnabled: true,
        reminderDaysBefore: 1
      });
      const nextMonth = startOfMonth(popupDate(popupDateValue));
      setSelectedMonth(nextMonth);
      setSelectedDay(popupDateValue);
      setPopupOpen(false);
      setPopupName("");
      setPopupAmount("");
      setTab("Calendario");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo agregar la fecha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screen}>
      <View style={styles.topRow}>
        <View style={styles.tabs}>
          {tabs.map((item) => <Pressable accessibilityRole="button" key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}><Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item}</Text></Pressable>)}
        </View>
        <Pressable accessibilityLabel="Agregar fecha" accessibilityRole="button" onPress={() => setPopupOpen(true)} style={styles.addButton}>
          <Plus color="#1C1C1B" size={24} strokeWidth={2.2} />
        </Pressable>
      </View>

      <MonthSelector month={selectedMonth} onChange={changeMonth} onCurrent={goToCurrentMonth} />

      {tab === "Resumen" ? <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Plan del mes</Text>
        <View style={styles.summaryRows}>
          <PlanRow label="Ingresos previstos" value={formatMoney(expectedIncome, currency, false)} />
          <PlanRow label="Pagos programados" value={formatMoney(scheduledPayments, currency, false)} />
          <PlanRow label="Cuotas del mes" value={formatMoney(installmentsDue, currency, false)} />
          <PlanRow label="Disponible estimado" value={formatMoney(estimatedAvailable, currency, false)} valueColor={shortfall ? "#F0C75E" : colors.positive} />
          {shortfall ? <Text style={styles.warning}>Te faltan {formatMoney(shortfall, currency, false)} para cubrir los compromisos de este mes.</Text> : null}
        </View>
        <Text style={styles.sectionTitle}>Próximos pagos</Text>
        <UpcomingPayments events={monthEvents} month={selectedMonth} />
      </View> : null}

      {tab === "Calendario" ? <View style={styles.calendarSection}>
        <MonthlyCalendar events={monthEvents} month={selectedMonth} onSelect={setSelectedDay} selectedDay={selectedDay} />
        {!monthEvents.length ? <Text style={styles.calendarEmptyMonth}>No tenés pagos ni ingresos programados para este mes.</Text> : null}
        <DayDetails day={selectedDay} events={monthEvents.filter((event) => dayKey(event.date) === selectedDay)} />
      </View> : null}

      <Modal animationType="fade" onRequestClose={() => setPopupOpen(false)} transparent visible={popupOpen}>
        <View style={styles.modalScrim}>
          <View style={styles.popup}>
            <Text style={styles.popupTitle}>Agregar fecha</Text>
            <Text style={styles.popupLabel}>Nombre</Text>
            <TextInput onChangeText={setPopupName} placeholder="Ej.: Internet, alquiler" placeholderTextColor="#8B8B89" style={styles.popupInput} value={popupName} />
            <Text style={styles.popupLabel}>Monto</Text>
            <TextInput keyboardType="decimal-pad" onChangeText={setPopupAmount} placeholder="$U 0,00" placeholderTextColor="#8B8B89" style={styles.popupInput} value={popupAmount} />
            <Text style={styles.popupLabel}>Fecha</Text>
            <Pressable accessibilityRole="button" onPress={() => setDatePickerOpen(true)} style={styles.popupInput}>
              <Text style={styles.popupDateText}>{popupDate(popupDateValue).toLocaleDateString("es-UY")}</Text>
            </Pressable>
            {datePickerOpen ? <DateTimePicker display="default" minimumDate={new Date()} mode="date" onChange={choosePopupDate} value={popupDate(popupDateValue)} /> : null}
            <View style={styles.popupActions}>
              <Pressable accessibilityRole="button" onPress={() => setPopupOpen(false)} style={styles.popupSecondary}><Text style={styles.popupSecondaryText}>Cancelar</Text></Pressable>
              <Pressable accessibilityRole="button" disabled={saving} onPress={() => void savePopupDate()} style={styles.popupPrimary}><Text style={styles.popupPrimaryText}>{saving ? "Guardando..." : "Agregar"}</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function MonthSelector({ month: monthDate, onChange, onCurrent }: { month: Date; onChange: (offset: number) => void; onCurrent: () => void }) {
  const current = monthKey(monthDate) === monthKey(new Date());
  const month = monthTitle(monthDate).toLocaleUpperCase("es-UY");
  return <View style={styles.monthBlock}><View style={styles.monthSelector}>
    <View>
      <Text style={styles.monthName}>{month}</Text>
      <Text style={styles.yearText}>{monthDate.getFullYear()}</Text>
    </View>
    <View style={styles.monthActions}>
      <Pressable accessibilityLabel="Mes anterior" accessibilityRole="button" onPress={() => onChange(-1)} style={styles.monthArrow}><ChevronLeft color="#1C1C1B" size={23} /></Pressable>
      <Pressable accessibilityLabel="Mes siguiente" accessibilityRole="button" onPress={() => onChange(1)} style={styles.monthArrow}><ChevronRight color="#1C1C1B" size={23} /></Pressable>
    </View>
  </View>{!current ? <Pressable accessibilityRole="button" onPress={onCurrent}><Text style={styles.currentMonth}>Volver al mes actual</Text></Pressable> : null}</View>;
}

function PlanRow({ label, value, valueColor = colors.white }: { label: string; value: string; valueColor?: string }) {
  return <View style={styles.planRow}><Text style={styles.planLabel}>{label}</Text><Text style={[styles.planValue, { color: valueColor }]}>{value}</Text></View>;
}

function UpcomingPayments({ events, month }: { events: PlannedEvent[]; month: Date }) {
  const commitments = events.filter((event) => !event.income && !event.paid).slice(0, 3);
  if (!commitments.length) return <View><Text style={styles.empty}>No tenés pagos ni cuotas programados para {monthTitle(month).toLocaleLowerCase("es-UY")}.</Text><Text style={styles.emptySecondary}>Podés agregarlos desde el botón +.</Text></View>;
  return <View>{commitments.map((event) => <Pressable accessibilityRole="button" key={event.id} onPress={event.open} style={styles.upcomingRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{event.title}</Text><Text style={styles.rowMeta}>{new Date(event.date).toLocaleDateString("es-UY", { day: "numeric", month: "long" })}</Text></View><View style={styles.rowEnd}><Text style={styles.expenseAmount}>-{formatMoney(event.amount, event.currency, false)}</Text><Text style={styles.rowMeta}>{eventStatus(event)}</Text></View></Pressable>)}</View>;
}

function MonthlyCalendar({ events, month, onSelect, selectedDay }: { events: PlannedEvent[]; month: Date; onSelect: (day: string) => void; selectedDay: string }) {
  const firstDayOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstDayOffset + daysInMonth) / 7) * 7 }, (_, index) => {
    const number = index - firstDayOffset + 1;
    return number >= 1 && number <= daysInMonth ? number : null;
  });
  return <View style={styles.calendarPanel}><View style={styles.weekRow}>{weekDays.map((day, index) => <Text key={`${day}-${index}`} style={styles.weekDay}>{day}</Text>)}</View><View style={styles.calendarGrid}>{cells.map((number, index) => {
    if (!number) return <View key={`empty-${index}`} style={styles.dayCell}><View style={styles.emptyDay} /></View>;
    const date = new Date(month.getFullYear(), month.getMonth(), number);
    const key = dayKey(date);
    const selected = key === selectedDay;
    const today = key === dayKey(new Date());
    return <Pressable accessibilityLabel={`${number} de ${monthLabel(month)}`} accessibilityRole="button" key={key} onPress={() => onSelect(key)} style={styles.dayCell}><View style={[styles.dayNumber, selected && styles.selectedDay]}><Text style={[styles.dayText, today && styles.todayText, selected && styles.selectedDayText]}>{number}</Text></View></Pressable>;
  })}</View></View>;
}

function DayDetails({ day, events }: { day: string; events: PlannedEvent[] }) {
  const title = new Date(`${day}T12:00:00`).toLocaleDateString("es-UY", { day: "numeric", month: "long" });
  if (!events.length) return <Text style={styles.calendarEmptyDay}>No tenés pagos ni ingresos programados para este día.</Text>;
  return <View style={styles.dayDetails}>{events.map((event) => <Pressable accessibilityRole="button" key={event.id} onPress={event.open} style={styles.calendarRow}><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowMeta}>{event.title}</Text>{event.action && !event.paid ? <Pressable accessibilityRole="button" onPress={() => void event.action?.()}><Text style={styles.actionText}>{event.income ? "Marcar como recibido" : event.id.startsWith("installment-") ? "Marcar como pagada" : "Marcar como pagado"}</Text></Pressable> : null}</View><View style={styles.rowEnd}><Text style={event.income ? styles.incomeAmount : styles.expenseAmount}>{event.income ? "+" : "-"}{formatMoney(event.amount, event.currency, false)}</Text><Text style={styles.rowMeta}>{eventStatus(event)}</Text></View></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  actionText: { ...typography.label, color: colors.white, fontWeight: "900", marginTop: spacing.sm },
  activeTab: { backgroundColor: "#F4F4F4", borderColor: "#8B8B89" },
  activeTabText: { color: "#4B4B49" },
  addButton: { alignItems: "center", backgroundColor: "#666664", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 6 },
  calendarEmptyDay: { ...typography.body, color: colors.transparentWhite, marginTop: 38 },
  calendarEmptyMonth: { ...typography.body, color: colors.transparentWhite, marginTop: 28 },
  calendarHelp: { ...typography.body, color: "rgba(255,255,255,0.62)", marginTop: 25, maxWidth: 340 },
  calendarPanel: { marginTop: 14 },
  calendarRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", minHeight: 66, paddingVertical: 8 },
  calendarSection: { marginTop: 0 },
  currentMonth: { ...typography.label, color: colors.white, fontWeight: "800", marginTop: spacing.sm, textAlign: "right" },
  dayCell: { alignItems: "center", height: 40, justifyContent: "center", width: "14.2857%" },
  dayDetails: { marginTop: 38 },
  dayNumber: { alignItems: "center", backgroundColor: "#E0E0E0", borderRadius: 19, height: 38, justifyContent: "center", width: 38 },
  dayText: { ...typography.body, color: "#1C1C1B", fontWeight: "700" },
  empty: { ...typography.body, color: colors.transparentWhite, marginTop: spacing.md },
  emptyDay: { backgroundColor: "#494947", borderRadius: 19, height: 38, width: 38 },
  emptySecondary: { ...typography.label, color: colors.transparentWhite, marginTop: spacing.xs },
  expenseAmount: { ...typography.body, color: colors.negative, fontWeight: "800", textAlign: "right" },
  incomeAmount: { ...typography.body, color: colors.positive, fontWeight: "800", textAlign: "right" },
  linkText: { ...typography.body, color: colors.white, fontWeight: "900", marginTop: 18 },
  monthActions: { flexDirection: "row", gap: 8 },
  monthArrow: { alignItems: "center", backgroundColor: "#D2D2D2", borderRadius: 19, height: 38, justifyContent: "center", width: 38 },
  monthBlock: { marginTop: 44 },
  monthName: { ...typography.title, color: colors.white, fontWeight: "800", lineHeight: 24 },
  monthSelector: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8 },
  modalScrim: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.72)", flex: 1, justifyContent: "center", padding: 22 },
  planLabel: { ...typography.body, color: colors.white },
  planRow: { alignItems: "center", borderBottomColor: "rgba(255,255,255,0.13)", borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 58 },
  planValue: { ...typography.body, color: colors.white, fontWeight: "900", textAlign: "right" },
  popup: { backgroundColor: "#343432", borderRadius: 22, padding: 20, width: "100%" },
  popupActions: { flexDirection: "row", gap: 10, marginTop: 22 },
  popupDateText: { ...typography.body, color: colors.white },
  popupInput: { ...typography.body, backgroundColor: "#555553", borderRadius: 12, color: colors.white, justifyContent: "center", marginTop: 7, minHeight: 50, paddingHorizontal: 14 },
  popupLabel: { ...typography.label, color: "rgba(255,255,255,0.72)", marginTop: 16 },
  popupPrimary: { alignItems: "center", backgroundColor: "#D0D0D0", borderRadius: 22, flex: 1, minHeight: 46, justifyContent: "center" },
  popupPrimaryText: { ...typography.button, color: "#1C1C1B", fontWeight: "800" },
  popupSecondary: { alignItems: "center", borderColor: "#666664", borderRadius: 22, borderWidth: 1, flex: 1, minHeight: 46, justifyContent: "center" },
  popupSecondaryText: { ...typography.button, color: colors.white },
  popupTitle: { ...typography.title, color: colors.white },
  rowCopy: { flex: 1, minWidth: 0 },
  rowEnd: { alignItems: "flex-end", maxWidth: "44%", minWidth: 120 },
  rowMeta: { ...typography.label, color: "rgba(255,255,255,0.74)", marginTop: 3 },
  rowTitle: { ...typography.body, color: colors.white, fontWeight: "800" },
  screen: { paddingHorizontal: 18, paddingTop: 14 },
  sectionTitle: { ...typography.title, color: colors.white, marginBottom: 14, marginTop: 34 },
  selectedDay: { backgroundColor: "#B93426" },
  selectedDayText: { color: "#1C1C1B", fontWeight: "900" },
  summaryRows: { marginBottom: 8 },
  summarySection: { marginTop: 0 },
  tab: { borderColor: "#575755", borderRadius: 12, borderWidth: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 14 },
  tabs: { flexDirection: "row", gap: 14 },
  tabText: { ...typography.body, color: colors.white, fontWeight: "800" },
  todayText: { color: colors.negative, fontWeight: "900" },
  topRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  upcomingRow: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between", minHeight: 68, paddingVertical: 9 },
  warning: { ...typography.label, color: "#F0C75E", marginTop: spacing.sm },
  weekDay: { ...typography.body, color: colors.white, fontWeight: "700", textAlign: "center", width: "14.2857%" },
  weekRow: { flexDirection: "row", marginBottom: 12 },
  yearText: { ...typography.title, color: "rgba(255,255,255,0.58)", lineHeight: 24 }
});
