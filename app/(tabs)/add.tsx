import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Bell, Brain, CreditCard, Minus, PiggyBank, Plus } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { scheduleLocalPaymentNotifications } from "../../src/services/notificationsService";
import { colors, spacing, typography } from "../../src/theme";
import { Category, Currency } from "../../src/types/finflow";
import { formatMoney } from "../../src/utils/money";

type Mode = "menu" | "expense" | "income" | "installment" | "payment" | "goal" | "ai";
const frequentExpenseLabels = ["Comida", "Transporte", "Compras", "Servicios"];
const incomeSources = ["Sueldo", "Freelance", "Devolución", "Transferencia recibida", "Otro"];
const frequencies = ["once", "monthly", "annual"] as const;
const reminders = [0, 1, 3, 7] as const;

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : new Date().toISOString();
}

function dateOptions(days = 35) {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

function amountValue(value: string) {
  return Number(value.replace(/\./g, "").replace(",", ".") || 0);
}

function cleanAmount(value: string) {
  return value.replace(/[^\d,.]/g, "");
}

function chooseCategory(categories: Category[], type: "income" | "expense", label?: string) {
  const source = categories.filter((category) => category.type === type);
  const normalized = String(label || "").toLowerCase();
  return source.find((category) => normalized.includes(category.name.toLowerCase())) || source[0];
}

export default function Add() {
  const params = useLocalSearchParams<{ type?: "income" | "expense"; mode?: string }>();
  const profile = useSessionStore((state) => state.profile);
  const { accounts, categories, createGoal, createInstallmentPurchase, createRecurringPayment, createTransaction, loadAccounts, loadCategories, loading } = useFinFlowStore();
  const [mode, setMode] = useState<Mode>(
    params.mode === "installment" || params.mode === "ai" ? params.mode : params.type === "income" ? "income" : params.type === "expense" ? "expense" : "menu"
  );
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayInput());
  const [time, setTime] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [antExpense, setAntExpense] = useState(false);
  const [installments, setInstallments] = useState("3");
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(todayInput());
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]>("monthly");
  const [reminderDaysBefore, setReminderDaysBefore] = useState<(typeof reminders)[number]>(3);
  const [paymentCategory, setPaymentCategory] = useState("Servicios");
  const [goalSaved, setGoalSaved] = useState("");
  const [goalMonthlyContribution, setGoalMonthlyContribution] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [aiText, setAiText] = useState("");
  const [proposal, setProposal] = useState<null | { type: "income" | "expense"; amount: number; merchant: string; categoryId: string; accountId: string; antExpense: boolean }>(null);

  const currency: Currency = accounts.find((account) => account.id === accountId)?.currency || profile?.primary_currency || "UYU";
  const expenseCategories = useMemo(() => categories.filter((category) => category.type === "expense"), [categories]);
  const incomeCategories = useMemo(() => categories.filter((category) => category.type === "income"), [categories]);
  const visibleExpenseCategories = showAllCategories
    ? expenseCategories
    : expenseCategories.filter((category) => frequentExpenseLabels.some((label) => category.name.toLowerCase().includes(label.toLowerCase()))).slice(0, 4);

  useEffect(() => {
    void loadAccounts();
    void loadCategories();
  }, [loadAccounts, loadCategories]);

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accountId, accounts]);

  useEffect(() => {
    const type = mode === "income" ? "income" : "expense";
    const category = chooseCategory(categories, type, merchant);
    if (category && !categories.some((item) => item.id === categoryId && item.type === type)) setCategoryId(category.id);
  }, [categories, categoryId, merchant, mode]);

  function resetForm(nextMode: Mode) {
    setMode(nextMode);
    setAmount("");
    setMerchant("");
    setNote("");
    setDate(todayInput());
    setTime("");
    setMoreOpen(false);
    setProposal(null);
  }

  async function saveMovement(type: "income" | "expense") {
    const category = categories.find((item) => item.id === categoryId) || chooseCategory(categories, type, merchant);
    const value = amountValue(amount);
    if (!value || value < 0) {
      Alert.alert("FinFlow", "Ingresá un monto válido.");
      return;
    }
    if (!accountId || !category) {
      Alert.alert("FinFlow", "Necesitás seleccionar cuenta y categoría.");
      return;
    }
    try {
      await createTransaction({
        accountId,
        categoryId: category.id,
        type,
        title: merchant.trim() || (type === "income" ? "Ingreso" : "Gasto"),
        merchant: merchant.trim(),
        amount: value,
        currency,
        date: toIsoDate(date),
        note: [note.trim(), time ? `Hora: ${time}` : ""].filter(Boolean).join(" · "),
        isAntExpense: type === "expense" ? antExpense : false,
        isRecurring: recurring,
        paymentMethod: accounts.find((account) => account.id === accountId)?.type
      });
      router.replace("/(tabs)/overview");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar.");
    }
  }

  async function saveInstallment() {
    const total = Math.max(1, Number(installments || 1));
    const totalAmount = amountValue(amount);
    const category = categories.find((item) => item.id === categoryId) || chooseCategory(categories, "expense", merchant);
    if (!totalAmount || !category) {
      Alert.alert("FinFlow", "Completá nombre, importe y categoría.");
      return;
    }
    try {
      const purchase = await createInstallmentPurchase({
        accountId,
        category: category.name,
        currency,
        firstDueDate: toIsoDate(firstInstallmentDate),
        name: merchant.trim() || "Compra en cuotas",
        reminderDaysBefore,
        totalAmount,
        totalInstallments: total
      });
      await scheduleLocalPaymentNotifications({
        body: `Cuota 1 de ${purchase.totalInstallments || total} por ${formatMoney(purchase.installmentAmount || totalAmount / total, currency, false)} vence el ${firstInstallmentDate}.`,
        data: { id: purchase.id, type: "installment" },
        dueDate: toIsoDate(firstInstallmentDate),
        reminderDaysBefore,
        title: `${purchase.name} vence pronto`
      });
      router.replace("/(tabs)/plan?tab=Calendario");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar la compra.");
    }
  }

  async function savePayment() {
    try {
      const payment = await createRecurringPayment({
        merchant: merchant.trim() || "Pago programado",
        amount: amountValue(amount),
        currency,
        frequency,
        category: paymentCategory || "Servicios",
        nextChargeDate: toIsoDate(date),
        reminderDaysBefore,
        kind: paymentCategory.toLowerCase().includes("suscripción") ? "subscription" : "service",
        accountId,
        notificationsEnabled: true
      });
      await scheduleLocalPaymentNotifications({
        body: `${payment.merchant} por ${formatMoney(payment.amount, payment.currency, false)} vence el ${payment.nextChargeDate}.`,
        data: { id: payment.id, type: "payment" },
        dueDate: toIsoDate(date),
        reminderDaysBefore,
        title: `${payment.merchant} vence pronto`
      });
      router.replace("/(tabs)/plan?tab=Calendario");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo crear el pago.");
    }
  }

  async function saveGoal() {
    const target = amountValue(amount);
    if (!target) {
      Alert.alert("FinFlow", "Ingresá el monto total de la meta.");
      return;
    }
    try {
      await createGoal({
        currency,
        monthlyContribution: amountValue(goalMonthlyContribution),
        name: merchant.trim() || "Meta",
        saved: amountValue(goalSaved),
        target,
        targetDate: goalTargetDate ? toIsoDate(goalTargetDate) : null
      });
      router.replace("/(tabs)/plan?tab=Metas");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar la meta.");
    }
  }

  function interpretWithAi() {
    const value = amountValue(aiText.match(/(\d+[\.,]?\d*)/)?.[1] || "0");
    const lower = aiText.toLowerCase();
    const inferredType = lower.includes("cobré") || lower.includes("cobre") || lower.includes("sueldo") || lower.includes("ingres") ? "income" : "expense";
    const category = chooseCategory(categories, inferredType, aiText);
    const account = accounts.find((item) => lower.includes(item.name.toLowerCase())) || accounts[0];
    if (!value || !category || !account) {
      Alert.alert("FinFlow", "No pude armar una ficha. Probá: gasté 820 pesos en PedidosYa ayer con la Visa.");
      return;
    }
    setProposal({
      accountId: account.id,
      amount: value,
      antExpense: inferredType === "expense" && value <= Number(profile?.ant_expense_threshold || 500),
      categoryId: category.id,
      merchant: aiText.replace(/gasté|gaste|cobré|cobre|\d+[\.,]?\d*/gi, "").trim() || aiText.trim(),
      type: inferredType
    });
  }

  async function confirmProposal() {
    if (!proposal) return;
    try {
      await createTransaction({
        accountId: proposal.accountId,
        categoryId: proposal.categoryId,
        type: proposal.type,
        title: proposal.merchant,
        merchant: proposal.merchant,
        amount: proposal.amount,
        currency: accounts.find((account) => account.id === proposal.accountId)?.currency || currency,
        date: toIsoDate(date),
        note: "Ficha preparada con IA y confirmada por la usuaria.",
        isAntExpense: proposal.antExpense
      });
      router.replace("/(tabs)/overview");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar la ficha.");
    }
  }

  return (
    <ScreenContainer>
      <Header title="Agregar" />
      {mode === "menu" ? (
        <View style={styles.actions}>
          <Action icon={<Minus color={colors.white} size={21} />} title="Gasto" onPress={() => resetForm("expense")} />
          <Action icon={<Plus color={colors.white} size={21} />} title="Ingreso" onPress={() => resetForm("income")} />
          <Action icon={<Bell color={colors.white} size={21} />} title="Pago programado" onPress={() => resetForm("payment")} />
          <Action icon={<CreditCard color={colors.white} size={21} />} title="Compra en cuotas" onPress={() => resetForm("installment")} />
          <Action icon={<PiggyBank color={colors.white} size={21} />} title="Meta" onPress={() => resetForm("goal")} />
          <Action icon={<Brain color={colors.white} size={21} />} title="Registrar con IA" onPress={() => resetForm("ai")} />
        </View>
      ) : null}

      {mode === "expense" ? (
        <View style={styles.form}>
          <AmountInput value={amount} onChangeText={setAmount} />
          <Input label="Comercio o descripción" value={merchant} onChangeText={setMerchant} />
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.wrap}>
            {visibleExpenseCategories.map((category) => <Chip key={category.id} active={categoryId === category.id} label={category.name} onPress={() => setCategoryId(category.id)} />)}
            <Chip active={showAllCategories} label="Más" onPress={() => setShowAllCategories(!showAllCategories)} />
          </View>
          <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Cuenta o tarjeta" />
          <MoreInfo
            antExpense={antExpense}
            date={date}
            moreOpen={moreOpen}
            note={note}
            recurring={recurring}
            setAntExpense={setAntExpense}
            setDate={setDate}
            setMoreOpen={setMoreOpen}
            setNote={setNote}
            setRecurring={setRecurring}
            setTime={setTime}
            time={time}
          />
          <PrimaryButton onPress={() => saveMovement("expense")}>{loading ? "Guardando..." : "Guardar gasto"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "income" ? (
        <View style={styles.form}>
          <AmountInput value={amount} onChangeText={setAmount} />
          <Text style={styles.label}>Fuente</Text>
          <View style={styles.wrap}>{incomeSources.map((source) => <Chip key={source} active={merchant === source} label={source} onPress={() => setMerchant(source)} />)}</View>
          <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Cuenta destino" />
          <DatePicker label="Fecha" value={date} onChange={setDate} />
          <Toggle active={recurring} label="Recurrente" onPress={() => setRecurring(!recurring)} />
          <Input label="Nota" value={note} onChangeText={setNote} />
          <PrimaryButton onPress={() => saveMovement("income")}>{loading ? "Guardando..." : "Guardar ingreso"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "installment" ? (
        <View style={styles.form}>
          <Input label="Comercio" value={merchant} onChangeText={setMerchant} />
          <AmountInput value={amount} onChangeText={setAmount} />
          <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Cuenta" />
          <Input label="Cantidad de cuotas" value={installments} onChangeText={(value) => setInstallments(value.replace(/\D/g, ""))} />
          <DatePicker label="Primera cuota" value={firstInstallmentDate} onChange={setFirstInstallmentDate} />
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.wrap}>{visibleExpenseCategories.map((category) => <Chip key={category.id} active={categoryId === category.id} label={category.name} onPress={() => setCategoryId(category.id)} />)}</View>
          <Text style={styles.label}>Recordatorio</Text>
          <View style={styles.wrap}>{reminders.map((item) => <Chip key={item} active={reminderDaysBefore === item} label={item === 0 ? "El mismo día" : `${item} días antes`} onPress={() => setReminderDaysBefore(item)} />)}</View>
          {amountValue(amount) && Number(installments) ? <Text style={styles.lead}>Cuota aproximada: {formatMoney(amountValue(amount) / Number(installments), currency, false)}</Text> : null}
          <PrimaryButton onPress={saveInstallment}>{loading ? "Guardando..." : "Guardar compra en cuotas"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "payment" ? (
        <View style={styles.form}>
          <Input label="Nombre" placeholder="UTE, OSE, alquiler..." value={merchant} onChangeText={setMerchant} />
          <AmountInput value={amount} onChangeText={setAmount} />
          <DatePicker label="Fecha de vencimiento" value={date} onChange={setDate} />
          <Text style={styles.label}>Repetición</Text>
          <View style={styles.wrap}>{frequencies.map((item) => <Chip key={item} active={frequency === item} label={item === "once" ? "Una sola vez" : item === "monthly" ? "Todos los meses" : "Todos los años"} onPress={() => setFrequency(item)} />)}</View>
          <Text style={styles.label}>Recordatorio</Text>
          <View style={styles.wrap}>{reminders.map((item) => <Chip key={item} active={reminderDaysBefore === item} label={item === 0 ? "El mismo día" : `${item} días antes`} onPress={() => setReminderDaysBefore(item)} />)}</View>
          <Input label="Categoría" value={paymentCategory} onChangeText={setPaymentCategory} />
          <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Cuenta" />
          <PrimaryButton onPress={savePayment}>{loading ? "Guardando..." : "Guardar pago programado"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "goal" ? (
        <View style={styles.form}>
          <Input label="Nombre de la meta" placeholder="Viaje, fondo de emergencia..." value={merchant} onChangeText={setMerchant} />
          <AmountInput value={amount} onChangeText={setAmount} />
          <Input label="Monto ahorrado actualmente" value={goalSaved} onChangeText={(value) => setGoalSaved(cleanAmount(value))} />
          <Input label="Aporte mensual deseado" value={goalMonthlyContribution} onChangeText={(value) => setGoalMonthlyContribution(cleanAmount(value))} />
          <DatePicker label="Fecha objetivo" optional value={goalTargetDate} onChange={setGoalTargetDate} />
          <PrimaryButton onPress={saveGoal}>{loading ? "Guardando..." : "Guardar meta"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "ai" ? (
        <View style={styles.form}>
          <Text style={styles.lead}>FinFlow arma una ficha y espera tu confirmación.</Text>
          <Input label="Mensaje" placeholder="Gasté 820 pesos en PedidosYa ayer con la Visa." value={aiText} onChangeText={setAiText} />
          <PrimaryButton onPress={interpretWithAi}>Preparar ficha</PrimaryButton>
          {proposal ? (
            <View style={styles.proposal}>
              <Text style={styles.proposalTitle}>Ficha preparada</Text>
              <Text style={styles.proposalLine}>Tipo: {proposal.type === "income" ? "Ingreso" : "Gasto"}</Text>
              <Text style={styles.proposalLine}>Importe: {formatMoney(proposal.amount, currency, false)}</Text>
              <Text style={styles.proposalLine}>Comercio: {proposal.merchant}</Text>
              <Text style={styles.proposalLine}>Gasto hormiga: {proposal.antExpense ? "posible" : "no"}</Text>
              <PrimaryButton onPress={confirmProposal}>Confirmar</PrimaryButton>
              <Pressable accessibilityRole="button" onPress={() => setProposal(null)} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Corregir</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function Action({ icon, onPress, title }: { icon: React.ReactNode; onPress: () => void; title: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      {icon}
      <Text style={styles.actionTitle}>{title}</Text>
    </Pressable>
  );
}

function AccountPicker({ accounts, onSelect, selected, title }: { accounts: Array<{ id: string; name: string }>; onSelect: (value: string) => void; selected: string; title: string }) {
  return (
    <View>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.wrap}>{accounts.map((account) => <Chip key={account.id} active={selected === account.id} label={account.name} onPress={() => onSelect(account.id)} />)}</View>
    </View>
  );
}

function AmountInput({ onChangeText, value }: { onChangeText: (value: string) => void; value: string }) {
  return <TextInput onChangeText={(text) => onChangeText(cleanAmount(text))} placeholder="$U 0" placeholderTextColor={colors.transparentWhite} style={styles.amountInput} value={value} />;
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.chipText, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

function Input({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.grayMedium} style={styles.input} {...props} />
    </View>
  );
}

function DatePicker({ label, onChange, optional = false, value }: { label: string; onChange: (value: string) => void; optional?: boolean; value: string }) {
  const [open, setOpen] = useState(false);
  const options = dateOptions();
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(!open)} style={styles.input}>
        <Text style={styles.inputText}>{value || (optional ? "Sin fecha" : todayInput())}</Text>
      </Pressable>
      {open ? (
        <View style={styles.wrap}>
          {optional ? <Chip active={!value} label="Sin fecha" onPress={() => { onChange(""); setOpen(false); }} /> : null}
          {options.map((item) => (
            <Chip
              active={value === item}
              key={item}
              label={new Date(`${item}T12:00:00`).toLocaleDateString("es-UY", { day: "2-digit", month: "short" })}
              onPress={() => {
                onChange(item);
                setOpen(false);
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Toggle({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Chip active={active} label={label} onPress={onPress} />;
}

function MoreInfo({
  antExpense,
  date,
  moreOpen,
  note,
  recurring,
  setAntExpense,
  setDate,
  setMoreOpen,
  setNote,
  setRecurring,
  setTime,
  time
}: {
  antExpense: boolean;
  date: string;
  moreOpen: boolean;
  note: string;
  recurring: boolean;
  setAntExpense: (value: boolean) => void;
  setDate: (value: string) => void;
  setMoreOpen: (value: boolean) => void;
  setNote: (value: string) => void;
  setRecurring: (value: boolean) => void;
  setTime: (value: string) => void;
  time: string;
}) {
  return (
    <View>
      <Pressable accessibilityRole="button" onPress={() => setMoreOpen(!moreOpen)} style={styles.moreButton}>
        <Text style={styles.moreText}>Agregar más información</Text>
      </Pressable>
      {moreOpen ? (
        <View style={styles.morePanel}>
          <DatePicker label="Fecha" value={date} onChange={setDate} />
          <Input label="Hora" placeholder="HH:mm" value={time} onChangeText={setTime} />
          <Input label="Nota" value={note} onChangeText={setNote} />
          <View style={styles.wrap}>
            <Toggle active={recurring} label="Recurrente" onPress={() => setRecurring(!recurring)} />
            <Toggle active={antExpense} label="Gasto hormiga" onPress={() => setAntExpense(!antExpense)} />
            <Chip active={false} label="Adjuntar comprobante" onPress={() => Alert.alert("FinFlow", "Adjuntos quedan preparados para la siguiente versión de archivos.")} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 94,
    justifyContent: "center",
    padding: spacing.md,
    width: "48%"
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  actionTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800",
    textAlign: "center"
  },
  active: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  activeText: {
    color: colors.black
  },
  amountInput: {
    ...typography.display,
    backgroundColor: "transparent",
    color: colors.white,
    fontSize: 52,
    minHeight: 78,
    paddingVertical: 0
  },
  chip: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  chipText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "800"
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  input: {
    ...typography.body,
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  inputText: {
    ...typography.body,
    color: colors.white
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "900",
    marginBottom: spacing.xs
  },
  lead: {
    ...typography.body,
    color: colors.transparentWhite
  },
  moreButton: {
    alignItems: "center",
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center"
  },
  morePanel: {
    gap: spacing.md,
    marginTop: spacing.md
  },
  moreText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  proposal: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  proposalLine: {
    ...typography.body,
    color: colors.transparentWhite
  },
  proposalTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 20
  },
  secondaryButton: {
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center"
  },
  secondaryText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
