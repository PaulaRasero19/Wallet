import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Bell, BookOpen, Brain, Circle, CreditCard, Heart, Home, Minus, PawPrint, PiggyBank, Plus, Receipt, ShoppingBag, Ticket, TramFront, Utensils, Zap } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { requestPaymentNotificationPermission, scheduleLocalPaymentNotifications } from "../../src/services/notificationsService";
import { colors, spacing, typography } from "../../src/theme";
import { Category, Currency } from "../../src/types/finflow";
import { formatMoney } from "../../src/utils/money";

type Mode = "menu" | "expense" | "income" | "installment" | "payment" | "goal" | "ai";
const frequentExpenseLabels = ["Comida", "Transporte", "Compras", "Servicios"];
const incomeSources = ["Sueldo", "Freelance", "Devolución", "Transferencia recibida", "Otro"];
const frequencies = ["once", "monthly", "annual"] as const;
const reminders = [0, 1, 3, 7] as const;
const recurrenceFrequencies = ["weekly", "monthly", "annual"] as const;
const categoryIcons = ["utensils", "shopping-bag", "tram-front", "home", "zap", "heart", "ticket", "book", "paw"] as const;
const categoryColors = ["lime", "blue", "orange", "purple", "gray"] as const;

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : new Date().toISOString();
}

function dateOptions(daysBefore = 90, daysAfter = 35) {
  const today = new Date();
  return Array.from({ length: daysBefore + daysAfter + 1 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index - daysBefore);
    return date.toISOString().slice(0, 10);
  });
}

function nextDate(value: string, frequency: (typeof recurrenceFrequencies)[number]) {
  const next = new Date(`${value}T12:00:00`);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  if (frequency === "annual") next.setFullYear(next.getFullYear() + 1);
  return next.toISOString().slice(0, 10);
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
  const { accounts, categories, createCategory, createGoal, createInstallmentPurchase, createRecurringPayment, createTransaction, loadAccounts, loadCategories, loading, updateTransaction } = useFinFlowStore();
  const [mode, setMode] = useState<Mode>(
    params.mode === "installment" || params.mode === "ai" ? params.mode : params.type === "income" ? "income" : params.type === "expense" ? "expense" : "menu"
  );
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayInput());
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<(typeof recurrenceFrequencies)[number]>("monthly");
  const [nextDueDate, setNextDueDate] = useState(nextDate(todayInput(), "monthly"));
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<(typeof categoryIcons)[number]>("utensils");
  const [newCategoryColor, setNewCategoryColor] = useState<(typeof categoryColors)[number]>("lime");
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
    setErrors({});
    setRecurring(false);
    setReceiptUrl("");
    setReceiptName("");
    setProposal(null);
  }

  async function saveMovement(type: "income" | "expense") {
    if (loading || submitting) return;
    const category = categories.find((item) => item.id === categoryId) || chooseCategory(categories, type, merchant);
    const value = amountValue(amount);
    const validationErrors: Record<string, string> = {};
    if (!Number.isFinite(value) || value <= 0) validationErrors.amount = "Ingresá un monto mayor a cero.";
    if (!merchant.trim()) validationErrors.merchant = "Ingresá un comercio o concepto.";
    if (!category) validationErrors.category = "Seleccioná una categoría.";
    if (!accountId) validationErrors.account = "Seleccioná un medio de pago.";
    if (!date || !Number.isFinite(new Date(`${date}T12:00:00`).getTime())) validationErrors.date = "Seleccioná una fecha válida.";
    if (type === "expense" && recurring && !nextDueDate) validationErrors.nextDueDate = "Seleccioná el próximo vencimiento.";
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    setSubmitting(true);
    try {
      const transaction = await createTransaction({
        accountId,
        categoryId: category!.id,
        type,
        title: merchant.trim(),
        amount: value,
        currency,
        date: toIsoDate(date),
        note: note.trim() || undefined,
        isRecurring: recurring,
        receiptUrl: receiptUrl || undefined
      });
      if (type === "expense" && recurring) {
        const payment = await createRecurringPayment({
          merchant: merchant.trim(),
          amount: value,
          currency,
          frequency: recurrenceFrequency,
          category: category!.name,
          categoryId: category!.id,
          nextChargeDate: toIsoDate(nextDueDate),
          reminderDaysBefore: reminderEnabled ? 1 : 0,
          kind: "service",
          accountId,
          notificationsEnabled: reminderEnabled
        });
        await updateTransaction(transaction.id, { scheduledPaymentId: payment.id });
        if (reminderEnabled) {
          await scheduleLocalPaymentNotifications({
            body: `${merchant.trim()} por ${formatMoney(value, currency, false)} vence el ${new Date(`${nextDueDate}T12:00:00`).toLocaleDateString("es-UY")}.`,
            data: { id: payment.id, type: "payment" },
            dueDate: toIsoDate(nextDueDate),
            reminderDaysBefore: 1,
            requestPermission: false,
            title: `${merchant.trim()} vence mañana`
          });
        }
      }
      Alert.alert("FinFlow", type === "expense" ? "Gasto guardado." : "Ingreso guardado.", [{ text: "Aceptar", onPress: () => router.back() }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar.";
      if (message.includes("No tenés saldo suficiente")) {
        setErrors((current) => ({ ...current, amount: message.replace(". Disponible:", ".\nDisponible:").replace(". Supera", ".\nSupera") }));
      } else {
        Alert.alert("FinFlow", message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleRecurring(value: boolean) {
    setRecurring(value);
    if (!value) return;
    setNextDueDate(nextDate(date, recurrenceFrequency));
    Alert.alert("FinFlow puede avisarte antes de este pago.");
    await requestPaymentNotificationPermission();
  }

  async function attachReceipt() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: ["image/*", "application/pdf"] });
    if (result.canceled) return;
    setReceiptUrl(result.assets[0].uri);
    setReceiptName(result.assets[0].name);
  }

  async function saveCustomCategory() {
    if (!newCategoryName.trim() || loading) return;
    try {
      const category = await createCategory({ name: newCategoryName.trim(), type: "expense", icon: newCategoryIcon, color: newCategoryColor });
      setCategoryId(category.id);
      setCategoryModalOpen(false);
      setNewCategoryName("");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo crear la categoría.");
    }
  }

  async function saveInstallment() {
    if (loading) return;
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
    if (loading) return;
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
    if (loading) return;
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
          <AmountInput currency={currency} error={errors.amount} value={amount} onChangeText={(value) => { setAmount(value); setErrors((current) => ({ ...current, amount: "" })); }} />
          <Input error={errors.merchant} label="Comercio o concepto *" value={merchant} onChangeText={(value) => { setMerchant(value); setErrors((current) => ({ ...current, merchant: "" })); }} />
          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.wrap}>
            {visibleExpenseCategories.map((category) => <CategoryChip category={category} key={category.id} active={categoryId === category.id} onPress={() => { setCategoryId(category.id); setErrors((current) => ({ ...current, category: "" })); }} />)}
            <Chip active={showAllCategories} label="Más" onPress={() => setShowAllCategories(!showAllCategories)} />
            <Chip active={false} label="+ Nueva" onPress={() => setCategoryModalOpen(true)} />
          </View>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          <AccountPicker accounts={accounts} error={errors.account} selected={accountId} onSelect={(value) => { setAccountId(value); setErrors((current) => ({ ...current, account: "" })); }} title="Medio de pago *" />
          <DatePicker error={errors.date} label="Fecha *" value={date} onChange={(value) => { setDate(value); setErrors((current) => ({ ...current, date: "" })); if (recurring) setNextDueDate(nextDate(value, recurrenceFrequency)); }} />
          <Input label="Nota (opcional)" value={note} onChangeText={setNote} />
          <SwitchField active={recurring} label="Este gasto se repite" meta="FinFlow te recordará el próximo pago." onChange={toggleRecurring} />
          {recurring ? (
            <View style={styles.morePanel}>
              <Text style={styles.label}>Frecuencia *</Text>
              <View style={styles.wrap}>{recurrenceFrequencies.map((item) => <Chip active={recurrenceFrequency === item} key={item} label={item === "weekly" ? "Semanal" : item === "monthly" ? "Mensual" : "Anual"} onPress={() => { setRecurrenceFrequency(item); setNextDueDate(nextDate(date, item)); }} />)}</View>
              <DatePicker error={errors.nextDueDate} label="Próximo vencimiento *" value={nextDueDate} onChange={setNextDueDate} />
              <SwitchField active={reminderEnabled} label="Recordarme 24 horas antes" onChange={async (value) => { setReminderEnabled(value); if (value) { Alert.alert("FinFlow puede avisarte antes de este pago."); await requestPaymentNotificationPermission(); } }} />
            </View>
          ) : null}
          <View>
            <Text style={styles.label}>Adjuntar comprobante (opcional)</Text>
            <Chip active={Boolean(receiptUrl)} label={receiptName || "Seleccionar imagen o archivo"} onPress={attachReceipt} />
          </View>
          <PrimaryButton disabled={loading || submitting} onPress={() => saveMovement("expense")}>{loading || submitting ? "Guardando..." : "Guardar gasto"}</PrimaryButton>
        </View>
      ) : null}

      <CategoryModal
        color={newCategoryColor}
        icon={newCategoryIcon}
        name={newCategoryName}
        onClose={() => setCategoryModalOpen(false)}
        onColor={setNewCategoryColor}
        onIcon={setNewCategoryIcon}
        onName={setNewCategoryName}
        onSave={saveCustomCategory}
        visible={categoryModalOpen}
      />

      {mode === "income" ? (
        <View style={styles.form}>
          <AmountInput value={amount} onChangeText={setAmount} />
          <Text style={styles.label}>Fuente</Text>
          <View style={styles.wrap}>{incomeSources.map((source) => <Chip key={source} active={merchant === source} label={source} onPress={() => setMerchant(source)} />)}</View>
          <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Cuenta destino" />
          <DatePicker label="Fecha" value={date} onChange={setDate} />
          <Toggle active={recurring} label="Recurrente" onPress={() => setRecurring(!recurring)} />
          <Input label="Nota" value={note} onChangeText={setNote} />
          <PrimaryButton disabled={loading} onPress={() => saveMovement("income")}>{loading ? "Guardando..." : "Guardar ingreso"}</PrimaryButton>
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
          <PrimaryButton disabled={loading} onPress={saveInstallment}>{loading ? "Guardando..." : "Guardar compra en cuotas"}</PrimaryButton>
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
          <PrimaryButton disabled={loading} onPress={savePayment}>{loading ? "Guardando..." : "Guardar pago programado"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "goal" ? (
        <View style={styles.form}>
          <Input label="Nombre de la meta" placeholder="Viaje, fondo de emergencia..." value={merchant} onChangeText={setMerchant} />
          <AmountInput value={amount} onChangeText={setAmount} />
          <Input label="Monto ahorrado actualmente" value={goalSaved} onChangeText={(value) => setGoalSaved(cleanAmount(value))} />
          <Input label="Aporte mensual deseado" value={goalMonthlyContribution} onChangeText={(value) => setGoalMonthlyContribution(cleanAmount(value))} />
          <DatePicker label="Fecha objetivo" optional value={goalTargetDate} onChange={setGoalTargetDate} />
          <PrimaryButton disabled={loading} onPress={saveGoal}>{loading ? "Guardando..." : "Guardar meta"}</PrimaryButton>
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

function AccountPicker({ accounts, error, onSelect, selected, title }: { accounts: Array<{ id: string; name: string }>; error?: string; onSelect: (value: string) => void; selected: string; title: string }) {
  return (
    <View>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.wrap}>{accounts.map((account) => <Chip key={account.id} active={selected === account.id} label={account.name} onPress={() => onSelect(account.id)} />)}</View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function AmountInput({ currency = "UYU", error, onChangeText, value }: { currency?: Currency; error?: string; onChangeText: (value: string) => void; value: string }) {
  const symbol = currency === "UYU" ? "$U" : currency === "USD" ? "US$" : "€";
  return <View><Text style={styles.label}>Monto *</Text><TextInput keyboardType="decimal-pad" onChangeText={(text) => onChangeText(cleanAmount(text))} placeholder={`${symbol} 0,00`} placeholderTextColor={colors.transparentWhite} style={styles.amountInput} value={value} />{error ? <Text style={styles.errorText}>{error}</Text> : null}</View>;
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.chipText, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

function iconFor(name?: string) {
  const icons: Record<string, typeof Circle> = { "book": BookOpen, "heart": Heart, "home": Home, "paw": PawPrint, "paw-print": PawPrint, "shopping-bag": ShoppingBag, "bag": ShoppingBag, "ticket": Ticket, "tram-front": TramFront, "bus": TramFront, "bus-front": TramFront, "utensils": Utensils, "zap": Zap, "receipt": Receipt };
  return icons[String(name || "")] || Circle;
}

function categoryColor(value?: string) {
  const palette: Record<string, string> = { lime: colors.lime, blue: "#5A8DEE", orange: "#F29F67", purple: "#A789E8", gray: colors.grayMedium, black: colors.white };
  return palette[String(value || "")] || colors.white;
}

function normalizedCategoryName(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase("es-UY") + value.slice(1) : value;
}

function CategoryChip({ active, category, onPress }: { active: boolean; category: Category; onPress: () => void }) {
  const Icon = iconFor(category.icon);
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, styles.categoryChip, active && styles.active]}><Icon color={active ? colors.black : categoryColor(category.color)} size={16} /><Text style={[styles.chipText, active && styles.activeText]}>{normalizedCategoryName(category.name)}</Text></Pressable>;
}

function Input({ error, label, ...props }: { error?: string; label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.grayMedium} style={styles.input} {...props} />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function DatePicker({ error, label, onChange, optional = false, value }: { error?: string; label: string; onChange: (value: string) => void; optional?: boolean; value: string }) {
  const [open, setOpen] = useState(false);
  const options = dateOptions();
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(!open)} style={styles.input}>
        <Text style={styles.inputText}>{value ? new Date(`${value}T12:00:00`).toLocaleDateString("es-UY") : optional ? "Sin fecha" : new Date().toLocaleDateString("es-UY")}</Text>
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
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function Toggle({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Chip active={active} label={label} onPress={onPress} />;
}

function SwitchField({ active, label, meta, onChange }: { active: boolean; label: string; meta?: string; onChange: (value: boolean) => void | Promise<void> }) {
  return <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchLabel}>{label}</Text>{meta ? <Text style={styles.switchMeta}>{meta}</Text> : null}</View><Switch onValueChange={onChange} value={active} /></View>;
}

function CategoryModal({ color, icon, name, onClose, onColor, onIcon, onName, onSave, visible }: { color: typeof categoryColors[number]; icon: typeof categoryIcons[number]; name: string; onClose: () => void; onColor: (value: typeof categoryColors[number]) => void; onIcon: (value: typeof categoryIcons[number]) => void; onName: (value: string) => void; onSave: () => void; visible: boolean }) {
  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}><View style={styles.modalBackdrop}><View style={styles.modalPanel}><Text style={styles.proposalTitle}>Nueva categoría</Text><Input label="Nombre de la categoría" value={name} onChangeText={onName} /><Text style={styles.label}>Ícono</Text><View style={styles.wrap}>{categoryIcons.map((item) => { const Icon = iconFor(item); return <Pressable key={item} onPress={() => onIcon(item)} style={[styles.iconChoice, icon === item && styles.active]}><Icon color={icon === item ? colors.black : colors.white} size={18} /></Pressable>; })}</View><Text style={styles.label}>Color</Text><View style={styles.wrap}>{categoryColors.map((item) => <Pressable accessibilityLabel={item} key={item} onPress={() => onColor(item)} style={[styles.colorChoice, { backgroundColor: categoryColor(item) }, color === item && styles.colorChoiceActive]} />)}</View><PrimaryButton disabled={!name.trim()} onPress={onSave}>Guardar categoría</PrimaryButton><Pressable onPress={onClose} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar</Text></Pressable></View></View></Modal>;
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
  categoryChip: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs
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
  errorText: {
    ...typography.label,
    color: "#E65C50",
    marginTop: spacing.xs
  },
  colorChoice: {
    borderRadius: 14,
    height: 28,
    width: 28
  },
  colorChoiceActive: {
    borderColor: colors.white,
    borderWidth: 3
  },
  iconChoice: {
    alignItems: "center",
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 42
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
  modalBackdrop: {
    backgroundColor: "rgba(0,0,0,0.7)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl
  },
  modalPanel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg
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
  switchCopy: {
    flex: 1
  },
  switchLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  switchMeta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: spacing.xs
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 48
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
