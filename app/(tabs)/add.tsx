import { useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Award, Banknote, BookOpen, Brain, BriefcaseBusiness, CalendarDays, Circle, CreditCard, Gift, Grid2X2, Heart, HeartPulse, Home, Laptop, Landmark, Minus, PawPrint, PiggyBank, Plus, Receipt, RefreshCw, ShoppingBag, Smartphone, Tag, Ticket, TramFront, Utensils, WalletCards, Zap } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";
import { Category, Currency } from "../../src/types/finflow";
import { formatMoney } from "../../src/utils/money";

type Mode = "menu" | "expense" | "income" | "installment" | "payment" | "goal" | "ai";
type AiProposal = { mode: Exclude<Mode, "menu" | "ai">; typeLabel: string; autoCompleted: string[] };
const frequentExpenseLabels = ["Comida", "Compras", "Transporte"];
const paymentMethods = [
  ["cash", "Efectivo"],
  ["debit_card", "Tarjeta de débito"],
  ["credit_card", "Tarjeta de crédito"],
  ["bank_transfer", "Transferencia"],
  ["digital_wallet", "Billetera digital"],
  ["other", "Otro"]
] as const;
const incomeSources = ["Sueldo", "Freelance", "Venta", "Regalo", "Transferencia externa", "Otro"];
const mainIncomeSourceLabels = ["Sueldo", "Freelance", "Venta", "Regalo"];
const incomeDestinations = [
  ["cash", "Efectivo"],
  ["bank_account", "Cuenta bancaria"],
  ["bank_transfer", "Transferencia"],
  ["digital_wallet", "Billetera digital"],
  ["other", "Otro"]
] as const;
const frequencies = ["once", "monthly", "annual"] as const;
const reminders = [0, 1, 3, 7] as const;
const recurrenceFrequencies = ["weekly", "monthly", "annual"] as const;
const incomeRecurrenceFrequencies = ["weekly", "fortnightly", "monthly", "annual"] as const;
const categoryIcons = ["utensils", "shopping-bag", "tram-front", "home", "zap", "heart", "ticket", "book", "paw", "briefcase", "laptop", "tag", "gift", "award"] as const;

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : new Date().toISOString();
}

function nextDate(value: string, frequency: (typeof incomeRecurrenceFrequencies)[number]) {
  const next = new Date(`${value}T12:00:00`);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "fortnightly") next.setDate(next.getDate() + 14);
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

function normalizedText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function findCategoryByName(categories: Category[], type: "income" | "expense", name: string) {
  const expected = normalizedText(name);
  return categories.find((category) => category.type === type && normalizedText(category.name) === expected);
}

function extractAiAmount(message: string) {
  const match = message.match(/(?:\$\s?U|UYU|USD|US\$)?\s*(\d+(?:\.\d{3})*(?:,\d+)?|\d+(?:[.,]\d+)?)(?:\s*(?:pesos?|uyu|usd))?/i);
  return amountValue(match?.[1] || "0");
}

function inferExpenseConcept(message: string) {
  const rules: Array<[RegExp, string]> = [
    [/pedidos\s?ya/i, "PedidosYa"], [/\bute\b/i, "UTE"], [/\bantel\b/i, "Antel"],
    [/\buber\b/i, "Uber"], [/\bnetflix\b/i, "Netflix"], [/\bspotify\b/i, "Spotify"],
    [/\binternet\b/i, "Internet"], [/\bfarmacia\b/i, "Farmacia"], [/\bropa\b/i, "Ropa"],
    [/\bcelular\b/i, "Celular"], [/\bsupermercado\b/i, "Supermercado"]
  ];
  return rules.find(([pattern]) => pattern.test(message))?.[1] || "";
}

function inferExpenseCategory(message: string, concept: string) {
  const text = `${message} ${concept}`;
  if (/pedidos\s?ya|comida|restaurante|supermercado/i.test(text)) return "comida";
  if (/\bute\b|\bantel\b|internet|alquiler|servicios?/i.test(text)) return "hogar y servicios";
  if (/\buber\b|taxi|ómnibus|omnibus|transporte/i.test(text)) return "transporte";
  if (/netflix|spotify|suscripci[oó]n/i.test(text)) return "suscripciones";
  if (/farmacia|medicamento|salud/i.test(text)) return "salud";
  if (/ropa|celular|compr[eé]|compras?/i.test(text)) return "compras";
  return "";
}

function inferPaymentMethod(message: string) {
  if (/efectivo/i.test(message)) return "cash";
  if (/d[eé]bito/i.test(message)) return "debit_card";
  if (/visa|mastercard?|cr[eé]dito|tarjeta/i.test(message)) return "credit_card";
  if (/transferencia/i.test(message)) return "bank_transfer";
  if (/mercado\s?pago|billetera/i.test(message)) return "digital_wallet";
  return "";
}

function incomeSourceLabel(category: Category) {
  const key = category.translationKey || category.translation_key || "";
  if (key === "income.salary") return "Sueldo";
  if (key === "income.sales") return "Venta";
  if (key === "income.transfers") return "Transferencia externa";
  if (key === "income.other") return "Otro";
  return category.name.charAt(0).toUpperCase() + category.name.slice(1);
}

function incomeSourceIcon(label: string) {
  if (label === "Sueldo") return BriefcaseBusiness;
  if (label === "Freelance") return Laptop;
  if (label === "Venta") return Tag;
  if (label === "Regalo") return Gift;
  if (label === "Beca") return BookOpen;
  if (label === "Premio") return Award;
  return Circle;
}

function chooseCategory(categories: Category[], type: "income" | "expense", label?: string) {
  const source = categories.filter((category) => category.type === type);
  const normalized = String(label || "").toLowerCase();
  return source.find((category) => normalized.includes(category.name.toLowerCase())) || source[0];
}

type InitialFormData = Partial<{ amount: string; merchant: string; categoryId: string; accountId: string; paymentMethod: string; date: string; note: string; installments: string; frequency: string }>;

export function AddScreen({ initialMode = "menu", initialData }: { initialMode?: Mode; initialData?: InitialFormData }) {
  const profile = useSessionStore((state) => state.profile);
  const { accounts, categories, createAccount, createCategory, createGoal, createInstallmentPurchase, createRecurringPayment, createTransaction, loadAccounts, loadCategories, loading, updateTransaction } = useFinFlowStore();
  const [mode] = useState<Mode>(initialMode);
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [customIncomeSource, setCustomIncomeSource] = useState("");
  const [incomeSourceListOpen, setIncomeSourceListOpen] = useState(false);
  const [incomeSourceModalOpen, setIncomeSourceModalOpen] = useState(false);
  const [incomeDestination, setIncomeDestination] = useState("");
  const [customIncomeDestination, setCustomIncomeDestination] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayInput());
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryListOpen, setCategoryListOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [customPaymentMethod, setCustomPaymentMethod] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<(typeof incomeRecurrenceFrequencies)[number]>("monthly");
  const [nextDueDate, setNextDueDate] = useState(nextDate(todayInput(), "monthly"));
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptName, setReceiptName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState<(typeof categoryIcons)[number]>("utensils");
  const [installments, setInstallments] = useState("3");
  const [creditCardName, setCreditCardName] = useState("");
  const [creditCardModalOpen, setCreditCardModalOpen] = useState(false);
  const [newCreditCardName, setNewCreditCardName] = useState("");
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(todayInput());
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]>("monthly");
  const [reminderDaysBefore, setReminderDaysBefore] = useState<(typeof reminders)[number]>(3);
  const [paymentCategory, setPaymentCategory] = useState("Servicios");
  const [goalSaved, setGoalSaved] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [aiText, setAiText] = useState("");
  const [proposal, setProposal] = useState<AiProposal | null>(null);

  const currency: Currency = accounts.find((account) => account.id === accountId)?.currency || profile?.primary_currency || "UYU";
  const expenseCategories = useMemo(() => categories.filter((category) => category.type === "expense"), [categories]);
  const incomeCategories = useMemo(() => categories.filter((category) => category.type === "income"), [categories]);
  const creditCardAccounts = useMemo(() => accounts.filter((account) => account.type === "credit" || /visa|mastercard|oca|tarjeta/i.test(account.name)), [accounts]);
  const principalExpenseCategories = expenseCategories.filter((category) => frequentExpenseLabels.some((label) => category.name.toLowerCase() === label.toLowerCase())).slice(0, 3);
  const selectedExtraCategory = expenseCategories.find((category) => category.id === categoryId && !principalExpenseCategories.some((principal) => principal.id === category.id));
  const visibleExpenseCategories = selectedExtraCategory ? [...principalExpenseCategories, selectedExtraCategory] : principalExpenseCategories;
  const principalIncomeSources = incomeCategories.filter((category) => mainIncomeSourceLabels.includes(incomeSourceLabel(category)));
  const selectedExtraIncomeSource = incomeCategories.find((category) => category.id === categoryId && !principalIncomeSources.some((principal) => principal.id === category.id));
  const visibleIncomeSources = selectedExtraIncomeSource ? [...principalIncomeSources, selectedExtraIncomeSource] : principalIncomeSources;

  useEffect(() => {
    void loadAccounts();
    void loadCategories();
  }, [loadAccounts, loadCategories]);

  useEffect(() => {
    if (!initialData) return;
    if (initialData.amount) setAmount(initialData.amount);
    if (initialData.merchant) setMerchant(initialData.merchant);
    if (initialData.categoryId) setCategoryId(initialData.categoryId);
    if (initialData.accountId) setAccountId(initialData.accountId);
    if (initialData.paymentMethod) setPaymentMethod(initialData.paymentMethod);
    if (initialData.date) setDate(initialData.date);
    if (initialData.note) setNote(initialData.note);
    if (initialData.installments) setInstallments(initialData.installments);
    if (initialData.frequency === "once" || initialData.frequency === "monthly" || initialData.frequency === "annual") setFrequency(initialData.frequency);
  }, [initialData]);

  useEffect(() => {
    if (mode !== "ai" && !accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accountId, accounts, mode]);

  useEffect(() => {
    if (mode !== "income" && mode !== "expense") return;
    const type = mode;
    const category = chooseCategory(categories, type, merchant);
    if (category && !categories.some((item) => item.id === categoryId && item.type === type)) setCategoryId(category.id);
  }, [categories, categoryId, merchant, mode]);

  function resetForm() {
    setAmount("");
    setMerchant("");
    setCustomIncomeSource("");
    setIncomeDestination("");
    setCustomIncomeDestination("");
    setNote("");
    setPaymentMethod("");
    setCustomPaymentMethod("");
    setDate(todayInput());
    setErrors({});
    setRecurring(false);
    setRecurrenceFrequency("monthly");
    setNextDueDate(nextDate(todayInput(), "monthly"));
    setReminderEnabled(true);
    setReceiptUrl("");
    setReceiptName("");
    setCreditCardName("");
    setNewCreditCardName("");
    setGoalSaved("");
    setGoalTargetDate("");
    setProposal(null);
  }

  function selectIncomeSource(category: Category) {
    setCategoryId(category.id);
    setMerchant(incomeSourceLabel(category));
    setErrors((current) => ({ ...current, merchant: "", category: "" }));
  }

  function selectIncomeDestination(value: string) {
    setIncomeDestination(value);
    const matchingAccount = value === "cash"
      ? accounts.find((account) => account.type === "cash")
      : value === "digital_wallet"
        ? accounts.find((account) => account.type === "wallet")
        : value === "bank_account" || value === "bank_transfer"
          ? accounts.find((account) => account.type === "bank" || account.type === "savings")
          : undefined;
    setAccountId(matchingAccount?.id || accountId || accounts[0]?.id || "");
    setErrors((current) => ({ ...current, incomeDestination: "" }));
  }

  async function saveCustomIncomeSource() {
    if (!newCategoryName.trim() || loading) return;
    try {
      const category = await createCategory({ name: newCategoryName.trim(), type: "income", icon: newCategoryIcon, color: "gray" });
      selectIncomeSource(category);
      setIncomeSourceModalOpen(false);
      setNewCategoryName("");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo crear la fuente.");
    }
  }

  async function saveCreditCard() {
    if (!newCreditCardName.trim() || loading) return;
    try {
      const card = await createAccount({ name: newCreditCardName.trim(), type: "credit", currency, initialBalance: 0 });
      setAccountId(card.id);
      setCreditCardName(card.name);
      setCreditCardModalOpen(false);
      setNewCreditCardName("");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar la tarjeta.");
    }
  }

  async function saveMovement(type: "income" | "expense") {
    if (loading || submitting) return;
    const category = categories.find((item) => item.id === categoryId) || chooseCategory(categories, type, merchant);
    const value = amountValue(amount);
    const validationErrors: Record<string, string> = {};
    if (!Number.isFinite(value) || value <= 0) validationErrors.amount = "Ingresá un monto mayor a cero.";
    if (!merchant.trim()) validationErrors.merchant = type === "income" ? "Seleccioná una fuente." : "Ingresá un comercio o concepto.";
    if (type === "income" && merchant === "Otro" && !customIncomeSource.trim()) validationErrors.customIncomeSource = "Ingresá el nombre de la fuente.";
    if (!category) validationErrors.category = "Seleccioná una categoría.";
    if (!accountId) validationErrors.account = type === "income" ? "Seleccioná una cuenta de destino." : "No hay una cuenta disponible para registrar el movimiento.";
    if (type === "income" && !incomeDestination) validationErrors.incomeDestination = "Seleccioná dónde recibiste el dinero.";
    if (type === "income" && incomeDestination === "other" && !customIncomeDestination.trim()) validationErrors.customIncomeDestination = "Especificá dónde recibiste el dinero.";
    if (type === "expense" && !paymentMethod) validationErrors.paymentMethod = "Seleccioná un medio de pago.";
    if (type === "expense" && paymentMethod === "other" && !customPaymentMethod.trim()) validationErrors.customPaymentMethod = "Especificá el medio de pago.";
    if (!date || !Number.isFinite(new Date(`${date}T12:00:00`).getTime())) validationErrors.date = "Seleccioná una fecha válida.";
    if (recurring && !recurrenceFrequency) validationErrors.recurrenceFrequency = "Seleccioná una frecuencia.";
    if (recurring && !nextDueDate) validationErrors.nextDueDate = type === "income" ? "Seleccioná la próxima fecha esperada." : "Seleccioná el próximo vencimiento.";
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    setSubmitting(true);
    try {
      const concept = type === "income" && merchant === "Otro" ? customIncomeSource.trim() : merchant.trim();
      const transaction = await createTransaction({
        accountId,
        categoryId: category!.id,
        type,
        title: concept,
        amount: value,
        currency,
        date: toIsoDate(date),
        note: note.trim() || undefined,
        paymentMethod: type === "expense" ? (paymentMethod === "other" ? `other:${customPaymentMethod.trim()}` : paymentMethod) : (incomeDestination === "other" ? `other:${customIncomeDestination.trim()}` : incomeDestination),
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
      }
      if (type === "income" && recurring) {
        const expectedIncome = await createRecurringPayment({
          merchant: concept,
          amount: value,
          currency,
          frequency: recurrenceFrequency,
          category: category!.name,
          categoryId: category!.id,
          nextChargeDate: toIsoDate(nextDueDate),
          reminderDaysBefore: reminderEnabled ? 1 : 0,
          kind: "income",
          accountId,
          notificationsEnabled: reminderEnabled
        });
        await updateTransaction(transaction.id, { scheduledPaymentId: expectedIncome.id });
      }
      resetForm();
      router.replace("/(tabs)/add");
      Alert.alert("FinFlow", type === "expense" ? "Gasto guardado" : "Ingreso guardado");
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

  function toggleRecurring(value: boolean) {
    setRecurring(value);
    if (!value) return;
    setNextDueDate(nextDate(date, recurrenceFrequency));
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
      const category = await createCategory({ name: newCategoryName.trim(), type: "expense", icon: newCategoryIcon, color: "gray" });
      setCategoryId(category.id);
      setCategoryModalOpen(false);
      setNewCategoryName("");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo crear la categoría.");
    }
  }

  async function saveInstallment() {
    if (loading || submitting) return;
    const total = Math.max(1, Number(installments || 1));
    const totalAmount = amountValue(amount);
    const category = categories.find((item) => item.id === categoryId) || chooseCategory(categories, "expense", merchant);
    if (!merchant.trim() || !totalAmount || !category || !accountId || !creditCardName || total < 1 || !firstInstallmentDate) {
      Alert.alert("FinFlow", "Completá comercio, monto, tarjeta, cuotas, primera cuota y categoría.");
      return;
    }
    setSubmitting(true);
    try {
      await createInstallmentPurchase({
        accountId,
        category: category.name,
        cardName: creditCardName,
        currency,
        firstDueDate: toIsoDate(firstInstallmentDate),
        name: merchant.trim() || "Compra en cuotas",
        note: note.trim() || undefined,
        reminderDaysBefore,
        totalAmount,
        totalInstallments: total
      });
      resetForm();
      router.replace("/(tabs)/add");
      Alert.alert("FinFlow", "Compra en cuotas guardada");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar la compra.");
    } finally {
      setSubmitting(false);
    }
  }

  async function savePayment() {
    if (loading || submitting) return;
    setSubmitting(true);
    try {
      await createRecurringPayment({
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
      resetForm();
      router.replace("/(tabs)/add");
      Alert.alert("FinFlow", "Pago programado guardado");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo crear el pago.");
    } finally {
      setSubmitting(false);
    }
  }

  async function saveGoal() {
    if (loading || submitting) return;
    const target = amountValue(amount);
    const validationErrors: Record<string, string> = {};
    if (!merchant.trim()) validationErrors.goalName = "Ingresá el nombre de la meta.";
    if (!Number.isFinite(target) || target <= 0) validationErrors.goalTarget = "Ingresá un monto objetivo mayor a cero.";
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;
    setSubmitting(true);
    try {
      await createGoal({
        currency,
        name: merchant.trim(),
        saved: amountValue(goalSaved),
        target,
        targetDate: goalTargetDate ? toIsoDate(goalTargetDate) : null
      });
      resetForm();
      router.replace("/(tabs)/add");
      Alert.alert("FinFlow", "Meta creada");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar la meta.");
    } finally {
      setSubmitting(false);
    }
  }

  function interpretWithAi() {
    const lower = aiText.toLowerCase();
    const value = extractAiAmount(aiText);
    const isGoal = /quiero ahorrar|meta|objetivo/.test(lower);
    const isInstallment = /\bcuotas?\b/.test(lower) && /compr[eé]|comprar/.test(lower);
    const isPayment = /todos los (?:días|meses)|cada mes|pago .* día\s*\d+|recurrente/.test(lower);
    const isIncome = /cobr[eé]|recib[ií]|sueldo|ingreso|freelance/.test(lower) && !isPayment;
    const nextMode: AiProposal["mode"] = isGoal ? "goal" : isInstallment ? "installment" : isPayment ? "payment" : isIncome ? "income" : "expense";
    const typeLabel = nextMode === "expense" ? "Gasto" : nextMode === "income" ? "Ingreso" : nextMode === "installment" ? "Compra en cuotas" : nextMode === "payment" ? "Pago programado" : "Meta";
    setAmount(value ? String(value) : "");
    setDate(/ayer/.test(lower) ? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10) : todayInput());
    setNote("");
    setRecurring(/cada semana|semanal|todos los meses|mensual|cada año|anual/.test(lower));
    setRecurrenceFrequency(/semanal|cada semana/.test(lower) ? "weekly" : /anual|cada año/.test(lower) ? "annual" : "monthly");
    const installmentMatch = lower.match(/(?:en\s+)?(\d+)\s+cuotas?/);
    if (installmentMatch) setInstallments(installmentMatch[1]);
    const dayMatch = lower.match(/d[ií]as?\s+(\d{1,2})/);
    if (dayMatch) {
      const candidate = new Date();
      candidate.setDate(Number(dayMatch[1]));
      if (candidate <= new Date()) candidate.setMonth(candidate.getMonth() + 1);
      setDate(candidate.toISOString().slice(0, 10));
    }
    const detectedConcept = nextMode === "goal" && /viaje/i.test(aiText) ? "Viaje" : inferExpenseConcept(aiText);
    setMerchant(detectedConcept);
    const categoryName = inferExpenseCategory(aiText, detectedConcept);
    const detectedCategory = findCategoryByName(categories, "expense", categoryName);
    setCategoryId(detectedCategory?.id || "");
    const detectedPayment = inferPaymentMethod(aiText);
    setPaymentMethod(detectedPayment);
    const detectedAccount = accounts.find((item) => lower.includes(item.name.toLowerCase()))
      || (/visa/i.test(lower) ? accounts.find((item) => /visa/i.test(item.name)) : undefined)
      || (/cuenta bancaria|mi cuenta/.test(lower) ? accounts.find((item) => item.type === "bank") : undefined);
    setAccountId(detectedAccount?.id || accounts[0]?.id || "");
    const incomeSource = /freelance|trabajo/i.test(aiText) ? "Freelance" : /sueldo|salario/i.test(aiText) ? "Sueldo" : /venta|vend[ií]/i.test(aiText) ? "Venta" : /regalo/i.test(aiText) ? "Regalo" : /transferencia/i.test(aiText) ? "Transferencia externa" : "";
    if (nextMode === "income") {
      setMerchant(incomeSource);
      const incomeCategory = findCategoryByName(categories, "income", incomeSource === "Sueldo" ? "salario" : incomeSource.toLowerCase());
      setCategoryId(incomeCategory?.id || chooseCategory(categories, "income", incomeSource)?.id || "");
    }
    if (nextMode === "payment") { setFrequency("monthly"); setReminderDaysBefore(1); setPaymentCategory(categoryName ? normalizedCategoryName(categoryName) : ""); }
    if (nextMode === "goal") setGoalTargetDate("");
    const autoCompleted = [value ? "Monto" : "", detectedConcept || incomeSource ? (nextMode === "income" ? "Fuente" : "Comercio o concepto") : "", detectedCategory ? "Categoría" : "", detectedPayment ? "Medio de pago" : "", "Fecha", detectedAccount || accounts[0] ? (nextMode === "income" ? "Cuenta de destino" : "") : ""].filter(Boolean);
    setProposal({ mode: nextMode, typeLabel, autoCompleted });
  }

  async function confirmProposal() {
    if (!proposal || loading || submitting) return;
    if (proposal.mode === "expense") return saveMovement("expense");
    if (proposal.mode === "income") return saveMovement("income");
    if (proposal.mode === "installment") return saveInstallment();
    if (proposal.mode === "payment") return savePayment();
    return saveGoal();
  }

  function correctProposal() {
    if (!proposal) return;
    const params = { amount, merchant, categoryId, accountId, paymentMethod, date, note, installments, frequency };
    router.push({ pathname: `/(tabs)/add-${proposal.mode}` as any, params });
  }

  const proposalComplete = proposal?.mode === "expense"
    ? amountValue(amount) > 0 && Boolean(merchant.trim() && categoryId && paymentMethod && date)
    : proposal?.mode === "income"
      ? amountValue(amount) > 0 && Boolean(merchant.trim() && accountId && date)
      : proposal?.mode === "installment"
        ? amountValue(amount) > 0 && Boolean(merchant.trim() && categoryId && accountId && Number(installments) > 0)
        : proposal?.mode === "payment"
          ? amountValue(amount) > 0 && Boolean(merchant.trim() && paymentCategory && date)
          : proposal?.mode === "goal"
            ? amountValue(amount) > 0 && Boolean(merchant.trim())
            : false;

  const proposalPendingFields = proposal?.mode === "expense"
    ? [!amountValue(amount) && "Monto", !merchant.trim() && "Comercio o concepto", !categoryId && "Categoría", !paymentMethod && "Medio de pago", !date && "Fecha"].filter(Boolean)
    : proposal?.mode === "income"
      ? [!amountValue(amount) && "Monto", !merchant.trim() && "Fuente", !accountId && "Dónde recibiste el dinero", !date && "Fecha"].filter(Boolean)
      : [];

  return (
    <ScreenContainer>
      <Header title={mode === "income" ? "Agregar ingreso" : mode === "expense" ? "Agregar gasto" : mode === "installment" ? "Compra en cuotas" : mode === "goal" ? "Agregar meta" : "Agregar"} back={mode !== "menu"} onBack={() => router.replace("/(tabs)/add")} />
      {mode === "menu" ? (
        <View style={styles.actions}>
          <Action icon={<Minus color={colors.white} size={21} />} title="Gasto" onPress={() => router.push("/(tabs)/add-expense")} />
          <Action icon={<Plus color={colors.white} size={21} />} title="Ingreso" onPress={() => router.push("/(tabs)/add-income")} />
          <Action icon={<CreditCard color={colors.white} size={21} />} title="Compra en cuotas" onPress={() => router.push("/(tabs)/add-installment")} />
          <Action icon={<PiggyBank color={colors.white} size={21} />} title="Meta" onPress={() => router.push("/(tabs)/add-goal")} />
          <Action icon={<Brain color={colors.white} size={21} />} title="Registrar con IA" onPress={() => router.push("/(tabs)/add-ai")} />
        </View>
      ) : null}

      {mode === "expense" ? (
        <View style={styles.form}>
          <AmountInput currency={currency} error={errors.amount} value={amount} onChangeText={(value) => { setAmount(value); setErrors((current) => ({ ...current, amount: "" })); }} />
          <Input error={errors.merchant} label="Comercio o concepto *" value={merchant} onChangeText={(value) => { setMerchant(value); setErrors((current) => ({ ...current, merchant: "" })); }} />
          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.wrap}>
            {visibleExpenseCategories.map((category) => <CategoryChip category={category} key={category.id} active={categoryId === category.id} onPress={() => { setCategoryId(category.id); setErrors((current) => ({ ...current, category: "" })); }} />)}
            <Chip active={false} label="Más cat." onPress={() => setCategoryListOpen(true)} />
            <Pressable accessibilityLabel="Crear categoría" accessibilityRole="button" onPress={() => setCategoryModalOpen(true)} style={styles.createCategoryButton}><Plus color={colors.white} size={20} /></Pressable>
          </View>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          <View>
            <Text style={styles.label}>Medio de pago *</Text>
            <View style={styles.wrap}>{paymentMethods.map(([value, label]) => <Chip active={paymentMethod === value} key={value} label={label} onPress={() => { setPaymentMethod(value); setErrors((current) => ({ ...current, paymentMethod: "" })); }} />)}</View>
            {paymentMethod === "other" ? <Input error={errors.customPaymentMethod} label="Especificar medio de pago *" value={customPaymentMethod} onChangeText={(value) => { setCustomPaymentMethod(value); setErrors((current) => ({ ...current, customPaymentMethod: "" })); }} /> : null}
            {errors.paymentMethod ? <Text style={styles.errorText}>{errors.paymentMethod}</Text> : null}
          </View>
          <DatePicker error={errors.date} label="Fecha *" value={date} onChange={(value) => { setDate(value); setErrors((current) => ({ ...current, date: "" })); if (recurring) setNextDueDate(nextDate(value, recurrenceFrequency)); }} />
          <Input label="Nota (opcional)" value={note} onChangeText={setNote} />
          <SwitchField active={recurring} label="Este gasto se repite" meta="FinFlow te recordará el próximo pago." onChange={toggleRecurring} />
          {recurring ? (
            <View style={styles.morePanel}>
              <Text style={styles.label}>Frecuencia *</Text>
              <View style={styles.wrap}>{recurrenceFrequencies.map((item) => <Chip active={recurrenceFrequency === item} key={item} label={item === "weekly" ? "Semanal" : item === "monthly" ? "Mensual" : "Anual"} onPress={() => { setRecurrenceFrequency(item); setNextDueDate(nextDate(date, item)); }} />)}</View>
              <DatePicker error={errors.nextDueDate} label="Próximo vencimiento *" value={nextDueDate} onChange={setNextDueDate} />
              <SwitchField active={reminderEnabled} label="Recordarme 24 horas antes" onChange={setReminderEnabled} />
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
        icon={newCategoryIcon}
        name={newCategoryName}
        onClose={() => setCategoryModalOpen(false)}
        onIcon={setNewCategoryIcon}
        onName={setNewCategoryName}
        onSave={saveCustomCategory}
        visible={categoryModalOpen}
      />
      <CategoryListModal categories={expenseCategories} onClose={() => setCategoryListOpen(false)} onSelect={(category) => { setCategoryId(category.id); setCategoryListOpen(false); setErrors((current) => ({ ...current, category: "" })); }} selected={categoryId} visible={categoryListOpen} />
      <CategoryModal icon={newCategoryIcon} name={newCategoryName} onClose={() => setIncomeSourceModalOpen(false)} onIcon={setNewCategoryIcon} onName={setNewCategoryName} onSave={saveCustomIncomeSource} title="Nueva fuente" visible={incomeSourceModalOpen} />
      <CategoryListModal categories={incomeCategories} itemLabel={incomeSourceLabel} onClose={() => setIncomeSourceListOpen(false)} onSelect={(category) => { selectIncomeSource(category); setIncomeSourceListOpen(false); }} selected={categoryId} title="Más fuentes" visible={incomeSourceListOpen} />
      <SimpleNameModal label="Nombre de la tarjeta" name={newCreditCardName} onClose={() => setCreditCardModalOpen(false)} onName={setNewCreditCardName} onSave={saveCreditCard} title="Nueva tarjeta" visible={creditCardModalOpen} />

      {mode === "income" ? (
        <View style={styles.form}>
          <AmountInput currency={currency} error={errors.amount} value={amount} onChangeText={(value) => { setAmount(value); setErrors((current) => ({ ...current, amount: "" })); }} />
          <Text style={styles.label}>Fuente *</Text>
          <View style={styles.wrap}>{visibleIncomeSources.map((category) => <SourceChip active={categoryId === category.id} category={category} key={category.id} onPress={() => selectIncomeSource(category)} />)}</View>
          <View style={styles.wrap}><Chip active={false} label="Más fuentes" onPress={() => setIncomeSourceListOpen(true)} /><Pressable accessibilityLabel="Crear fuente" accessibilityRole="button" onPress={() => setIncomeSourceModalOpen(true)} style={styles.createCategoryButton}><Plus color={colors.white} size={20} /></Pressable></View>
          {errors.merchant ? <Text style={styles.errorText}>{errors.merchant}</Text> : null}
          <Text style={styles.label}>Dónde recibiste el dinero *</Text>
          <View style={styles.wrap}>{incomeDestinations.map(([value, label]) => <Chip active={incomeDestination === value} key={value} label={label} onPress={() => selectIncomeDestination(value)} />)}</View>
          {incomeDestination === "bank_account" ? <AccountPicker accounts={accounts.filter((account) => account.type === "bank" || account.type === "savings")} selected={accountId} onSelect={setAccountId} title="Cuenta guardada (opcional)" /> : null}
          {incomeDestination === "digital_wallet" ? <AccountPicker accounts={accounts.filter((account) => account.type === "wallet")} selected={accountId} onSelect={setAccountId} title="Billetera guardada (opcional)" /> : null}
          {incomeDestination === "other" ? <Input error={errors.customIncomeDestination} label="Especificar dónde lo recibiste *" value={customIncomeDestination} onChangeText={(value) => { setCustomIncomeDestination(value); setErrors((current) => ({ ...current, customIncomeDestination: "" })); }} /> : null}
          {errors.incomeDestination ? <Text style={styles.errorText}>{errors.incomeDestination}</Text> : null}
          <DatePicker error={errors.date} label="Fecha *" value={date} onChange={(value) => { setDate(value); setErrors((current) => ({ ...current, date: "" })); if (recurring) setNextDueDate(nextDate(value, recurrenceFrequency)); }} />
          <Input label="Nota (opcional)" value={note} onChangeText={setNote} />
          <SwitchField active={recurring} label="Este ingreso se repite" meta="FinFlow puede recordarte cuándo esperás recibirlo nuevamente." onChange={toggleRecurring} />
          {recurring ? <View style={styles.morePanel}>
            <Text style={styles.label}>Frecuencia *</Text>
            <View style={styles.wrap}>{incomeRecurrenceFrequencies.map((item) => <Chip active={recurrenceFrequency === item} key={item} label={item === "weekly" ? "Semanal" : item === "fortnightly" ? "Quincenal" : item === "monthly" ? "Mensual" : "Anual"} onPress={() => { setRecurrenceFrequency(item); setNextDueDate(nextDate(date, item)); }} />)}</View>
            {errors.recurrenceFrequency ? <Text style={styles.errorText}>{errors.recurrenceFrequency}</Text> : null}
            <DatePicker error={errors.nextDueDate} label="Próxima fecha esperada *" value={nextDueDate} onChange={setNextDueDate} />
            <SwitchField active={reminderEnabled} label="Recordarme 24 horas antes" onChange={setReminderEnabled} />
          </View> : null}
          <PrimaryButton disabled={loading || submitting} onPress={() => saveMovement("income")}>{loading || submitting ? "Guardando..." : "Guardar ingreso"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "installment" ? (
        <View style={styles.form}>
          <Input label="Comercio o concepto *" value={merchant} onChangeText={setMerchant} />
          <AmountInput currency={currency} value={amount} onChangeText={setAmount} />
          <Text style={styles.label}>Tarjeta de crédito *</Text>
          <View style={styles.wrap}>{creditCardAccounts.map((card) => <IconChip Icon={CreditCard} active={accountId === card.id} key={card.id} label={card.name} onPress={() => { setAccountId(card.id); setCreditCardName(card.name); }} />)}<Pressable accessibilityLabel="Agregar tarjeta" accessibilityRole="button" onPress={() => setCreditCardModalOpen(true)} style={styles.createCategoryButton}><Plus color={colors.white} size={20} /></Pressable></View>
          <Input label="Cantidad de cuotas *" value={installments} onChangeText={(value) => setInstallments(value.replace(/\D/g, ""))} />
          <View style={styles.wrap}>{[3, 6, 10, 12].map((item) => <Chip active={Number(installments) === item} key={item} label={String(item)} onPress={() => setInstallments(String(item))} />)}</View>
          {amountValue(amount) > 0 && Number(installments) > 0 ? <Text style={styles.lead}>{installments} cuotas de {formatMoney(Math.floor((amountValue(amount) / Number(installments)) * 100) / 100, currency, false)}{amountValue(amount) % Number(installments) ? "; la última se ajusta para completar el total" : ""}</Text> : null}
          <DatePicker label="Primera cuota *" value={firstInstallmentDate} onChange={setFirstInstallmentDate} />
          <Text style={styles.label}>Categoría *</Text>
          <View style={styles.wrap}>{visibleExpenseCategories.map((category) => <CategoryChip active={categoryId === category.id} category={category} key={category.id} onPress={() => setCategoryId(category.id)} />)}<Chip active={false} label="Más cat." onPress={() => setCategoryListOpen(true)} /><Pressable accessibilityLabel="Crear categoría" accessibilityRole="button" onPress={() => setCategoryModalOpen(true)} style={styles.createCategoryButton}><Plus color={colors.white} size={20} /></Pressable></View>
          <Text style={styles.label}>Recordatorio *</Text>
          <View style={styles.wrap}>{reminders.map((item) => <Chip key={item} active={reminderDaysBefore === item} label={item === 0 ? "El mismo día" : item === 1 ? "1 día antes" : `${item} días antes`} onPress={() => setReminderDaysBefore(item)} />)}</View>
          <Input label="Nota (opcional)" value={note} onChangeText={setNote} />
          <PrimaryButton disabled={loading || submitting} onPress={saveInstallment}>{loading || submitting ? "Guardando..." : "Guardar compra en cuotas"}</PrimaryButton>
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
          <PrimaryButton disabled={loading || submitting} onPress={savePayment}>{loading || submitting ? "Guardando..." : "Guardar pago programado"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "goal" ? (
        <View style={styles.form}>
          <Input error={errors.goalName} label="Nombre de la meta *" placeholder="Ej.: Viaje, computadora, fondo de emergencia" value={merchant} onChangeText={(value) => { setMerchant(value); setErrors((current) => ({ ...current, goalName: "" })); }} />
          <AmountInput currency={currency} error={errors.goalTarget} label="Monto objetivo *" value={amount} onChangeText={(value) => { setAmount(value); setErrors((current) => ({ ...current, goalTarget: "" })); }} />
          <AmountInput currency={currency} label="Ya tengo ahorrado (opcional)" value={goalSaved} onChangeText={setGoalSaved} />
          <DatePicker label="Fecha objetivo (opcional)" minimumDate={todayInput()} optional value={goalTargetDate} onChange={setGoalTargetDate} />
          <PrimaryButton disabled={loading || submitting} onPress={saveGoal}>{loading || submitting ? "Guardando..." : "Guardar meta"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "ai" ? (
        <View style={styles.form}>
          <Text style={styles.lead}>FinFlow arma una ficha y espera tu confirmación.</Text>
          <Input label="Mensaje" placeholder="Gasté 820 pesos en PedidosYa ayer con la Visa." value={aiText} onChangeText={setAiText} />
          <PrimaryButton onPress={interpretWithAi}>Preparar ficha</PrimaryButton>
          {proposal ? (
            <View style={styles.proposal}>
              <Text style={styles.proposalTitle}>Revisá los datos</Text>
              <Text style={styles.proposalLine}>Tipo: {proposal.typeLabel}</Text>
              {proposal.autoCompleted?.length ? <Text style={styles.proposalLine}>Completado automáticamente: {proposal.autoCompleted.join(", ")}.</Text> : null}
              {proposalPendingFields.length ? <Text style={styles.errorText}>Necesita confirmación: {proposalPendingFields.join(", ")}.</Text> : null}
              <AmountInput currency={currency} label={proposal.mode === "goal" ? "Monto objetivo *" : "Monto *"} value={amount} onChangeText={setAmount} />
              {proposal.mode === "expense" ? <>
                <Input label="Comercio o concepto *" value={merchant} onChangeText={setMerchant} />
                <Text style={styles.label}>Categoría *</Text>
                <View style={styles.wrap}>{visibleExpenseCategories.map((category) => <CategoryChip active={categoryId === category.id} category={category} key={category.id} onPress={() => setCategoryId(category.id)} />)}<Chip active={false} label="Más cat." onPress={() => setCategoryListOpen(true)} /></View>
                <Text style={styles.label}>Medio de pago *</Text>
                <View style={styles.wrap}>{paymentMethods.map(([value, label]) => <Chip active={paymentMethod === value} key={value} label={label} onPress={() => setPaymentMethod(value)} />)}</View>
                <DatePicker label="Fecha *" value={date} onChange={setDate} />
                <Input label="Nota (opcional)" value={note} onChangeText={setNote} />
                <SwitchField active={recurring} label="Este gasto se repite" meta="FinFlow te recordará el próximo pago." onChange={toggleRecurring} />
                {recurring ? <View style={styles.morePanel}><Text style={styles.label}>Frecuencia *</Text><View style={styles.wrap}>{recurrenceFrequencies.map((item) => <Chip active={recurrenceFrequency === item} key={item} label={item === "weekly" ? "Semanal" : item === "monthly" ? "Mensual" : "Anual"} onPress={() => { setRecurrenceFrequency(item); setNextDueDate(nextDate(date, item)); }} />)}</View><DatePicker label="Próximo vencimiento *" value={nextDueDate} onChange={setNextDueDate} /><SwitchField active={reminderEnabled} label="Recordarme 24 horas antes" onChange={setReminderEnabled} /></View> : null}
              </> : null}
              {proposal.mode === "income" ? <>
                <Text style={styles.label}>Fuente *</Text><View style={styles.wrap}>{incomeSources.map((source) => <Chip active={merchant === source} key={source} label={source} onPress={() => setMerchant(source)} />)}</View>
                <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Dónde recibiste el dinero *" />
                <DatePicker label="Fecha *" value={date} onChange={setDate} />
                <Input label="Nota (opcional)" value={note} onChangeText={setNote} />
              </> : null}
              {proposal.mode === "installment" ? <><Input label="Comercio o concepto *" value={merchant} onChangeText={setMerchant} /><Input label="Cantidad de cuotas *" value={installments} onChangeText={(value) => setInstallments(value.replace(/\D/g, ""))} />{amountValue(amount) && Number(installments) ? <Text style={styles.lead}>{installments} cuotas de {formatMoney(amountValue(amount) / Number(installments), currency, false)}</Text> : null}<DatePicker label="Primera cuota *" value={firstInstallmentDate} onChange={setFirstInstallmentDate} /><Text style={styles.label}>Categoría *</Text><View style={styles.wrap}>{visibleExpenseCategories.map((category) => <CategoryChip active={categoryId === category.id} category={category} key={category.id} onPress={() => setCategoryId(category.id)} />)}</View></> : null}
              {proposal.mode === "payment" ? <><Input label="Concepto *" value={merchant} onChangeText={setMerchant} /><Input label="Categoría *" value={paymentCategory} onChangeText={setPaymentCategory} /><DatePicker label="Próximo vencimiento *" value={date} onChange={setDate} /><SwitchField active={reminderDaysBefore === 1} label="Recordarme 24 horas antes" onChange={(value) => setReminderDaysBefore(value ? 1 : 0)} /></> : null}
              {proposal.mode === "goal" ? <><Input label="Nombre de la meta *" value={merchant} onChangeText={setMerchant} /><AmountInput currency={currency} label="Ya tengo ahorrado (opcional)" value={goalSaved} onChangeText={setGoalSaved} /><DatePicker label="Fecha objetivo (opcional)" minimumDate={todayInput()} optional value={goalTargetDate} onChange={setGoalTargetDate} /></> : null}
              {!proposalComplete ? <Text style={styles.errorText}>Completá los campos obligatorios pendientes para confirmar.</Text> : null}
              <PrimaryButton disabled={!proposalComplete || loading || submitting} onPress={confirmProposal}>{loading || submitting ? "Guardando..." : "Confirmar"}</PrimaryButton>
              <Pressable accessibilityRole="button" onPress={correctProposal} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Corregir</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
    </ScreenContainer>
  );
}

export default function Add() {
  return <AddScreen initialMode="menu" />;
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

function AmountInput({ currency = "UYU", error, label = "Monto *", onChangeText, value }: { currency?: Currency; error?: string; label?: string; onChangeText: (value: string) => void; value: string }) {
  const symbol = currency === "UYU" ? "$U" : currency === "USD" ? "US$" : "€";
  return <View><Text style={styles.label}>{label}</Text><TextInput keyboardType="decimal-pad" onChangeText={(text) => onChangeText(cleanAmount(text))} placeholder={`${symbol} 0,00`} placeholderTextColor={colors.transparentWhite} style={styles.amountInput} value={value} />{error ? <Text style={styles.errorText}>{error}</Text> : null}</View>;
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.chipText, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

function IconChip({ Icon, active, label, onPress }: { Icon: typeof Circle; active: boolean; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, styles.categoryChip, active && styles.active]}><Icon color={active ? colors.black : colors.white} size={17} /><Text style={[styles.chipText, active && styles.activeText]}>{label}</Text></Pressable>;
}

function iconFor(name?: string) {
  const icons: Record<string, typeof Circle> = { "award": Award, "book": BookOpen, "briefcase": BriefcaseBusiness, "gift": Gift, "grid-2x2": Grid2X2, "heart": Heart, "heart-pulse": HeartPulse, "home": Home, "laptop": Laptop, "paw": PawPrint, "paw-print": PawPrint, "refresh-cw": RefreshCw, "shopping-bag": ShoppingBag, "bag": ShoppingBag, "tag": Tag, "ticket": Ticket, "tram-front": TramFront, "bus": TramFront, "bus-front": TramFront, "utensils": Utensils, "zap": Zap, "receipt": Receipt };
  return icons[String(name || "")] || Circle;
}

function normalizedCategoryName(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase("es-UY") + value.slice(1) : value;
}

function CategoryChip({ active, category, onPress }: { active: boolean; category: Category; onPress: () => void }) {
  const Icon = iconFor(category.icon);
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, styles.categoryChip, active && styles.active]}><Icon color={colors.grayMedium} size={16} /><Text style={[styles.chipText, active && styles.activeText]}>{normalizedCategoryName(category.name)}</Text></Pressable>;
}

function SourceChip({ active, category, onPress }: { active: boolean; category: Category; onPress: () => void }) {
  const label = incomeSourceLabel(category);
  const Icon = category.isCustom || category.is_custom ? iconFor(category.icon) : incomeSourceIcon(label);
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, styles.categoryChip, active && styles.active]}><Icon color={colors.grayMedium} size={16} /><Text style={[styles.chipText, active && styles.activeText]}>{label}</Text></Pressable>;
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

function DatePicker({ error, label, minimumDate, onChange, optional = false, value }: { error?: string; label: string; minimumDate?: string; onChange: (value: string) => void; optional?: boolean; value: string }) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(`${value}T12:00:00`) : new Date();
  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS !== "ios" || event.type === "dismissed") setOpen(false);
    if (event.type === "dismissed" || !selected) return;
    const year = selected.getFullYear();
    const month = String(selected.getMonth() + 1).padStart(2, "0");
    const day = String(selected.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
  }
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.input, styles.dateInput]}>
        <Text style={styles.inputText}>{value ? new Date(`${value}T12:00:00`).toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" }) : optional ? "Sin fecha" : new Date().toLocaleDateString("es-UY", { day: "2-digit", month: "2-digit", year: "numeric" })}</Text>
        <CalendarDays color={colors.transparentWhite} size={18} />
      </Pressable>
      {optional && value ? <Pressable onPress={() => onChange("")}><Text style={styles.secondaryText}>Quitar fecha</Text></Pressable> : null}
      {open ? <DateTimePicker display={Platform.OS === "ios" ? "inline" : "default"} locale="es-UY" minimumDate={minimumDate ? new Date(`${minimumDate}T12:00:00`) : undefined} mode="date" onChange={handleChange} value={selectedDate} /> : null}
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

function CategoryModal({ icon, name, onClose, onIcon, onName, onSave, title = "Nueva categoría", visible }: { icon: typeof categoryIcons[number]; name: string; onClose: () => void; onIcon: (value: typeof categoryIcons[number]) => void; onName: (value: string) => void; onSave: () => void; title?: string; visible: boolean }) {
  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}><View style={styles.modalBackdrop}><View style={styles.modalPanel}><Text style={styles.proposalTitle}>{title}</Text><Input label="Nombre" value={name} onChangeText={onName} /><Text style={styles.label}>Ícono</Text><View style={styles.wrap}>{categoryIcons.map((item) => { const Icon = iconFor(item); return <Pressable key={item} onPress={() => onIcon(item)} style={[styles.iconChoice, icon === item && styles.active]}><Icon color={colors.grayMedium} size={18} /></Pressable>; })}</View><PrimaryButton disabled={!name.trim()} onPress={onSave}>Crear</PrimaryButton><Pressable onPress={onClose} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar</Text></Pressable></View></View></Modal>;
}

function CategoryListModal({ categories, itemLabel, onClose, onSelect, selected, title = "Más categorías", visible }: { categories: Category[]; itemLabel?: (category: Category) => string; onClose: () => void; onSelect: (category: Category) => void; selected: string; title?: string; visible: boolean }) {
  return <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}><View style={styles.modalBackdrop}><View style={styles.modalPanel}><Text style={styles.proposalTitle}>{title}</Text><View style={styles.categoryList}>{categories.map((category) => itemLabel ? <SourceChip active={selected === category.id} category={category} key={category.id} onPress={() => onSelect(category)} /> : <CategoryChip active={selected === category.id} category={category} key={category.id} onPress={() => onSelect(category)} />)}</View><Pressable onPress={onClose} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar</Text></Pressable></View></View></Modal>;
}

function SimpleNameModal({ label, name, onClose, onName, onSave, title, visible }: { label: string; name: string; onClose: () => void; onName: (value: string) => void; onSave: () => void; title: string; visible: boolean }) {
  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}><View style={styles.modalBackdrop}><View style={styles.modalPanel}><Text style={styles.proposalTitle}>{title}</Text><Input label={label} value={name} onChangeText={onName} /><PrimaryButton disabled={!name.trim()} onPress={onSave}>Guardar tarjeta</PrimaryButton><Pressable onPress={onClose} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar</Text></Pressable></View></View></Modal>;
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
  createCategoryButton: {
    alignItems: "center",
    borderColor: colors.appGrayBorder,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  categoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  dateInput: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
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
