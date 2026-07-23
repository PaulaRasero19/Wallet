import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, Banknote, BookOpen, BriefcaseBusiness, CalendarDays, ChevronDown, Circle, Gift, Grid2X2, Heart, HeartPulse, Home, Laptop, Landmark, PawPrint, Pencil, Plus, Receipt, RefreshCw, ShoppingBag, Smartphone, Tag, Ticket, TramFront, Trash2, Utensils, WalletCards, Zap } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { AmountLavaBackground } from "../../src/components/forms/AmountLavaBackground";
import { LiquidGradientBackground } from "../../src/components/home/LiquidGradientBackground";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, layout, spacing, typography } from "../../src/theme";
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
  const translationKey = type === "expense" && expected === "comida" ? "expense.food" : "";
  return categories.find((category) => category.type === type && (
    normalizedText(category.name) === expected
    || Boolean(translationKey && (category.translationKey || category.translation_key) === translationKey)
  ));
}

function extractAiAmount(message: string) {
  const match = message.match(/(?:\$\s?U|UYU|USD|US\$)?\s*(\d+(?:\.\d{3})*(?:,\d+)?|\d+(?:[.,]\d+)?)(?:\s*(?:pesos?|uyu|usd))?/i);
  return amountValue(match?.[1] || "0");
}

function inferExpenseConcept(message: string) {
  const rules: Array<[RegExp, string]> = [
    [/\bpedidos?\s*ya\b/i, "PedidosYa"], [/\brappi\b/i, "Rappi"], [/\buber\s*eats\b/i, "Uber Eats"],
    [/\bute\b/i, "UTE"], [/\bantel\b/i, "Antel"],
    [/\buber\b/i, "Uber"], [/\bnetflix\b/i, "Netflix"], [/\bspotify\b/i, "Spotify"],
    [/\binternet\b/i, "Internet"], [/\bfarmacia\b/i, "Farmacia"], [/\bropa\b/i, "Ropa"],
    [/\bcelular\b/i, "Celular"], [/\bsupermercado\b/i, "Supermercado"],
    [/\bpeluquer[ií]a\b|\bpeluquero\b|\bbarber[ií]a\b|\bsal[oó]n de belleza\b/i, "Peluquería"],
    [/\bmanicura\b|\bmanicure\b|\bpedicura\b|\bpedicure\b|\best[eé]tica\b/i, "Cuidado personal"]
  ];
  return rules.find(([pattern]) => pattern.test(message))?.[1] || "";
}

function inferExpenseCategory(message: string, concept: string) {
  const text = normalizedText(`${message} ${concept}`);
  if (/\bpedidos?\s*ya\b|\brappi\b|\buber\s*eats\b|\bdelivery\b|\bpedido\b|\bcomida\b|\brestaurante\b|\bsupermercado\b|\bpizzeria\b|\bhamburgueseria\b|\bcafeteria\b/.test(text)) return "comida";
  if (/\bute\b|\bantel\b|internet|alquiler|servicios?/i.test(text)) return "hogar y servicios";
  if (/\buber\b|taxi|ómnibus|omnibus|transporte/i.test(text)) return "transporte";
  if (/netflix|spotify|suscripci[oó]n/i.test(text)) return "suscripciones";
  if (/farmacia|medicamento|salud|peluquer[ií]a|peluquero|barber[ií]a|sal[oó]n de belleza|manicura|manicure|pedicura|pedicure|est[eé]tica|cuidado personal/i.test(text)) return "salud";
  if (/ropa|celular|compr[eé]|compras?/i.test(text)) return "compras";
  return "";
}

function inferPaymentMethod(message: string) {
  if (/efectivo/i.test(message)) return "cash";
  if (/d[eé]bito|\bvisa\b/i.test(message)) return "debit_card";
  if (/mastercard?|cr[eé]dito|tarjeta/i.test(message)) return "credit_card";
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
  return source.find((category) => normalized.includes(category.name.toLowerCase()))
    || (type === "income" ? source.find((category) => (category.translationKey || category.translation_key) === "income.salary") : undefined)
    || source[0];
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
  const [incomeDestinationOpen, setIncomeDestinationOpen] = useState(false);
  const [incomeFrequencyOpen, setIncomeFrequencyOpen] = useState(false);
  const [customIncomeDestination, setCustomIncomeDestination] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayInput());
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryListOpen, setCategoryListOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [customPaymentMethod, setCustomPaymentMethod] = useState("");
  const [recurring, setRecurring] = useState(initialMode === "income" || initialMode === "expense");
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
  const [installmentsOpen, setInstallmentsOpen] = useState(false);
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
  const [aiDetailDraft, setAiDetailDraft] = useState("");
  const [aiMentionedDate, setAiMentionedDate] = useState(false);
  const [proposal, setProposal] = useState<AiProposal | null>(null);
  const [proposalExpanded, setProposalExpanded] = useState(false);
  const [proposalEditing, setProposalEditing] = useState(false);

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

  useFocusEffect(useCallback(() => {
    if (mode !== "ai") return;
    setAiText("");
    setAiDetailDraft("");
    setAiMentionedDate(false);
    setProposal(null);
    setProposalExpanded(false);
    setProposalEditing(false);
    setAmount("");
    setMerchant("");
    setNote("");
    setDate(todayInput());
    setAccountId("");
    setCategoryId("");
    setPaymentMethod("");
    setInstallments("3");
    setFirstInstallmentDate(todayInput());
    setPaymentCategory("Servicios");
    setGoalSaved("");
    setGoalTargetDate("");
  }, [mode]));

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
    if (mode === "income" && !incomeDestination) selectIncomeDestination("cash");
  }, [incomeDestination, mode]);

  useEffect(() => {
    if ((mode === "expense" || mode === "goal") && !paymentMethod) setPaymentMethod("cash");
    if (mode === "installment" && paymentMethod !== "credit_card") setPaymentMethod("credit_card");
  }, [mode, paymentMethod]);

  useEffect(() => {
    if (mode !== "income" && mode !== "expense") return;
    const type = mode;
    const category = chooseCategory(categories, type, merchant);
    if (category && !categories.some((item) => item.id === categoryId && item.type === type)) {
      setCategoryId(category.id);
      if (type === "income" && !merchant.trim()) setMerchant(incomeSourceLabel(category));
    }
  }, [categories, categoryId, merchant, mode]);

  useEffect(() => {
    if (mode !== "installment" || categoryId) return;
    const category = expenseCategories.find((item) => normalizedText(item.name) === "comida") || expenseCategories[0];
    if (category) setCategoryId(category.id);
  }, [categoryId, expenseCategories, mode]);

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
    if (type === "income" && !merchant.trim()) validationErrors.merchant = "Seleccioná una fuente.";
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
      const concept = type === "income"
        ? (merchant === "Otro" ? customIncomeSource.trim() : merchant.trim())
        : merchant.trim() || category!.name;
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
          merchant: concept,
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
      if (mode === "expense") setMerchant(category.name);
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
      Alert.alert("FinFlow", "Completá concepto, monto, tarjeta, cuotas, primera cuota y categoría.");
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
        targetDate: toIsoDate(date)
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
    const mentionedDate = /\b(?:hoy|ayer|mañana|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\b|\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b|\bd[ií]a\s+\d{1,2}\b/i.test(aiText);
    const value = extractAiAmount(aiText);
    const isGoal = /quiero ahorrar|meta|objetivo/.test(lower);
    const isInstallment = /\bcuotas?\b/.test(lower) && /compr[eé]|comprar/.test(lower);
    const isPayment = /todos los (?:días|meses)|cada mes|pago .* día\s*\d+|recurrente/.test(lower);
    const isIncome = /cobr[eé]|recib[ií]|sueldo|ingreso|freelance/.test(lower) && !isPayment;
    const nextMode: AiProposal["mode"] = isGoal ? "goal" : isInstallment ? "installment" : isPayment ? "payment" : isIncome ? "income" : "expense";
    const typeLabel = nextMode === "expense" ? "Gasto" : nextMode === "income" ? "Ingreso" : nextMode === "installment" ? "Compra en cuotas" : nextMode === "payment" ? "Pago programado" : "Meta";
    setAmount(value ? String(value) : "");
    setAiMentionedDate(mentionedDate);
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
    setAiDetailDraft(nextMode === "expense" ? detectedCategory?.name || "" : detectedConcept);
    const detectedPayment = nextMode === "installment" ? "credit_card" : inferPaymentMethod(aiText);
    setPaymentMethod(detectedPayment || (nextMode === "expense" ? "cash" : ""));
    const detectedAccount = accounts.find((item) => lower.includes(item.name.toLowerCase()))
      || (/visa/i.test(lower) ? accounts.find((item) => /visa/i.test(item.name)) : undefined)
      || (/cuenta bancaria|mi cuenta/.test(lower) ? accounts.find((item) => item.type === "bank") : undefined);
    setAccountId(detectedAccount?.id || accounts[0]?.id || "");
    const incomeSource = /freelance|trabajo/i.test(aiText) ? "Freelance" : /sueldo|salario/i.test(aiText) ? "Sueldo" : /venta|vend[ií]/i.test(aiText) ? "Venta" : /regalo/i.test(aiText) ? "Regalo" : /transferencia/i.test(aiText) ? "Transferencia externa" : "";
    if (nextMode === "income") {
      setMerchant(incomeSource);
      setAiDetailDraft(incomeSource);
      const incomeCategory = findCategoryByName(categories, "income", incomeSource === "Sueldo" ? "salario" : incomeSource.toLowerCase());
      setCategoryId(incomeCategory?.id || chooseCategory(categories, "income", incomeSource)?.id || "");
    }
    if (nextMode === "payment") { setFrequency("monthly"); setReminderDaysBefore(1); setPaymentCategory(categoryName ? normalizedCategoryName(categoryName) : ""); setAiDetailDraft(detectedConcept); }
    if (nextMode === "goal") { setGoalTargetDate(""); setAiDetailDraft(detectedConcept); }
    if (nextMode === "expense" && !detectedConcept && detectedCategory) {
      setMerchant(normalizedCategoryName(detectedCategory.name));
    }
    const autoCompleted = [value ? "Monto" : "", detectedConcept || incomeSource ? (nextMode === "income" ? "Fuente" : "Comercio o concepto") : "", detectedCategory ? "Categoría" : "", detectedPayment ? "Medio de pago" : "", mentionedDate ? "Fecha" : "", detectedAccount || accounts[0] ? (nextMode === "income" ? "Cuenta de destino" : "") : ""].filter(Boolean);
    setProposal({ mode: nextMode, typeLabel, autoCompleted });
    setProposalExpanded(true);
    setProposalEditing(false);
  }

  function discardProposal() {
    setProposal(null);
    setProposalExpanded(false);
    setProposalEditing(false);
    setAiDetailDraft("");
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
    setProposalExpanded(true);
    setProposalEditing(true);
  }

  function updateAiDetail(value: string) {
    setAiDetailDraft(value);
    if (proposal?.mode === "expense") {
      const matchedCategory = findCategoryByName(categories, "expense", value);
      setCategoryId(matchedCategory?.id || "");
      if (!merchant.trim() || merchant === aiDetailDraft) setMerchant(value);
      return;
    }
    setMerchant(value);
  }

  const proposalComplete = proposal?.mode === "expense"
    ? amountValue(amount) > 0 && Boolean(categoryId && paymentMethod && date)
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
    ? [!amountValue(amount) && "Monto", !categoryId && "Categoría", !paymentMethod && "Medio de pago", !aiMentionedDate && "Fecha"].filter(Boolean)
    : proposal?.mode === "income"
      ? [!amountValue(amount) && "Monto", !merchant.trim() && "Fuente", !accountId && "Dónde recibiste el dinero", !aiMentionedDate && "Fecha"].filter(Boolean)
      : proposal?.mode === "installment"
        ? [!amountValue(amount) && "Monto", !merchant.trim() && "Compra o concepto", !categoryId && "Categoría", !accountId && "Tarjeta", !Number(installments) && "Cantidad de cuotas", !aiMentionedDate && "Fecha de la primera cuota"].filter(Boolean)
        : proposal?.mode === "payment"
          ? [!amountValue(amount) && "Monto", !merchant.trim() && "Concepto", !paymentCategory.trim() && "Categoría", !aiMentionedDate && "Fecha"].filter(Boolean)
          : proposal?.mode === "goal"
            ? [!amountValue(amount) && "Monto objetivo", !merchant.trim() && "Nombre de la meta"].filter(Boolean)
            : [];

  const proposalCategory = categories.find((category) => category.id === categoryId)?.name;
  const proposalDate = proposal?.mode === "goal" ? goalTargetDate : aiMentionedDate ? (proposal?.mode === "installment" ? firstInstallmentDate : date) : "";
  const proposalDetailLabel = proposal?.mode === "income" ? "Fuente" : proposal?.mode === "goal" ? "Meta" : proposal?.mode === "payment" ? "Concepto" : proposal?.mode === "installment" ? "Compra o concepto" : "Categoría";
  const proposalDetailValue = proposal?.mode === "income" || proposal?.mode === "goal" || proposal?.mode === "payment" || proposal?.mode === "installment" ? merchant : proposalCategory || merchant;

  return (
    <ScreenContainer backgroundColor={mode === "menu" ? "#191919" : mode === "income" || mode === "expense" || mode === "installment" || mode === "goal" || mode === "ai" ? "#1C1C1B" : undefined} style={mode === "menu" ? styles.menuScreen : mode === "income" || mode === "expense" || mode === "installment" || mode === "goal" || mode === "ai" ? styles.incomeScreen : undefined}>
      {mode === "income" || mode === "expense" || mode === "installment" || mode === "goal" || mode === "ai" ? <FormHeader title={mode === "income" ? "Agregar Ingreso" : mode === "expense" ? "Agregar Gasto" : mode === "installment" ? "Compra en cuotas" : mode === "goal" ? "Agregar Meta" : "Agregar con IA"} /> : mode !== "menu" ? <Header title="Agregar" back onBack={() => router.replace("/(tabs)/add")} /> : null}
      {mode === "menu" ? (
        <View style={styles.menuContent}>
          <AnimatedMenuGlow />
          <Text style={styles.menuTitle}>Agregar</Text>
          <View style={styles.actions}>
            <Action title="Gasto" onPress={() => router.push("/(tabs)/add-expense")} />
            <Action title="Ingreso" onPress={() => router.push("/(tabs)/add-income")} />
            <Action title={"Compra\nen cuotas"} onPress={() => router.push("/(tabs)/add-installment")} />
            <Action title="Metas" onPress={() => router.push("/(tabs)/add-goal")} />
            <Action title={"Registrar\ncon IA"} onPress={() => router.push("/(tabs)/add-ai")} />
          </View>
        </View>
      ) : null}

      {mode === "expense" ? (
        <View style={styles.incomeForm}>
          <IncomeAmountInput currency={currency} error={errors.amount} value={amount} onChangeText={(value) => { setAmount(value); setErrors((current) => ({ ...current, amount: "" })); }} />
          <IncomeDropdown label="Categoría*" open={categoryListOpen} onToggle={() => setCategoryListOpen((value) => !value)} value={expenseCategories.find((item) => item.id === categoryId) ? normalizedCategoryName(expenseCategories.find((item) => item.id === categoryId)!.name) : "Seleccionar categoría"}>
            {expenseCategories.map((category) => <IncomeDropdownOption key={category.id} label={normalizedCategoryName(category.name)} onPress={() => { setCategoryId(category.id); setMerchant(normalizedCategoryName(category.name)); setCategoryListOpen(false); setErrors((current) => ({ ...current, category: "", merchant: "" })); }} />)}
            <IncomeDropdownOption label="Agregar opción" onPress={() => { setCategoryListOpen(false); setCategoryModalOpen(true); }} />
          </IncomeDropdown>
          {errors.category ? <Text style={styles.errorText}>{errors.category}</Text> : null}
          <View><IncomeDropdown label="Medio de pago*" open={paymentMethodOpen} onToggle={() => setPaymentMethodOpen((value) => !value)} value={paymentMethods.find(([value]) => value === paymentMethod)?.[1] || "Efectivo"}>
            {paymentMethods.map(([value, label]) => <IncomeDropdownOption key={value} label={label} onPress={() => { setPaymentMethod(value); setPaymentMethodOpen(false); setErrors((current) => ({ ...current, paymentMethod: "" })); }} />)}
          </IncomeDropdown>
            {paymentMethod === "other" ? <Input error={errors.customPaymentMethod} label="Especificar medio de pago *" value={customPaymentMethod} onChangeText={(value) => { setCustomPaymentMethod(value); setErrors((current) => ({ ...current, customPaymentMethod: "" })); }} /> : null}
            {errors.paymentMethod ? <Text style={styles.errorText}>{errors.paymentMethod}</Text> : null}
          </View>
          <DatePicker error={errors.date} income label="Fecha*" value={date} onChange={(value) => { setDate(value); setErrors((current) => ({ ...current, date: "" })); if (recurring) setNextDueDate(nextDate(value, recurrenceFrequency)); }} />
          <IncomeNoteInput value={note} onChangeText={setNote} />
          <IncomeSwitchField active={recurring} label="Este gasto se repite" meta="FinFlow puede recordarte cuando esperas recibirlo nuevamente." onChange={toggleRecurring} />
          {recurring ? (
            <View style={styles.incomeRecurring}>
              <IncomeDropdown label="Frecuencia*" open={incomeFrequencyOpen} onToggle={() => setIncomeFrequencyOpen((value) => !value)} value={recurrenceFrequency === "weekly" ? "Semanal" : recurrenceFrequency === "monthly" ? "Mensual" : "Anual"}>
                {recurrenceFrequencies.map((item) => <IncomeDropdownOption key={item} label={item === "weekly" ? "Semanal" : item === "monthly" ? "Mensual" : "Anual"} onPress={() => { setRecurrenceFrequency(item); setNextDueDate(nextDate(date, item)); setIncomeFrequencyOpen(false); }} />)}
              </IncomeDropdown>
              <DatePicker error={errors.nextDueDate} income label="Fecha*" value={nextDueDate} onChange={setNextDueDate} />
              <IncomeSwitchField active={reminderEnabled} label="Recordarme 24 horas antes" onChange={setReminderEnabled} red />
            </View>
          ) : null}
          <Pressable accessibilityRole="button" disabled={loading || submitting} onPress={() => saveMovement("expense")} style={[styles.incomeSave, (loading || submitting) && styles.incomeSaveDisabled]}><Text style={styles.incomeSaveText}>{loading || submitting ? "Guardando..." : "Guardar"}</Text></Pressable>
        </View>
      ) : null}

      <CategoryModal
        icon={newCategoryIcon}
        name={newCategoryName}
        onClose={() => setCategoryModalOpen(false)}
        onIcon={setNewCategoryIcon}
        onName={setNewCategoryName}
        onSave={saveCustomCategory}
        visible={categoryModalOpen && mode !== "expense" && mode !== "installment"}
      />
      <CategoryListModal categories={expenseCategories} onClose={() => setCategoryListOpen(false)} onSelect={(category) => { setCategoryId(category.id); setCategoryListOpen(false); setErrors((current) => ({ ...current, category: "" })); }} selected={categoryId} visible={categoryListOpen && mode !== "expense" && mode !== "installment"} />
      <IncomeCategoryModal name={newCategoryName} onClose={() => setCategoryModalOpen(false)} onName={setNewCategoryName} onSave={saveCustomCategory} visible={categoryModalOpen && mode === "expense"} />
      <IncomeCategoryModal name={newCategoryName} onClose={() => setCategoryModalOpen(false)} onName={setNewCategoryName} onSave={saveCustomCategory} visible={categoryModalOpen && mode === "installment"} />
      <IncomeCategoryModal name={newCategoryName} onClose={() => setIncomeSourceModalOpen(false)} onName={setNewCategoryName} onSave={saveCustomIncomeSource} visible={incomeSourceModalOpen} />
      <SimpleNameModal label="Nombre de la tarjeta" name={newCreditCardName} onClose={() => setCreditCardModalOpen(false)} onName={setNewCreditCardName} onSave={saveCreditCard} title="Nueva tarjeta" visible={creditCardModalOpen} />

      {mode === "income" ? (
        <View style={styles.incomeForm}>
          <IncomeAmountInput currency={currency} error={errors.amount} value={amount} onChangeText={(value) => { setAmount(value); setErrors((current) => ({ ...current, amount: "" })); }} />
          <IncomeDropdown label="Categoría*" open={incomeSourceListOpen} onToggle={() => setIncomeSourceListOpen((value) => !value)} value={incomeCategories.find((item) => item.id === categoryId) ? incomeSourceLabel(incomeCategories.find((item) => item.id === categoryId)!) : "Seleccionar categoría"}>
            {incomeCategories.map((category) => <IncomeDropdownOption key={category.id} label={incomeSourceLabel(category)} onPress={() => { selectIncomeSource(category); setIncomeSourceListOpen(false); }} />)}
            <IncomeDropdownOption label="Agregar opción" onPress={() => { setIncomeSourceListOpen(false); setIncomeSourceModalOpen(true); }} />
          </IncomeDropdown>
          {errors.merchant ? <Text style={styles.errorText}>{errors.merchant}</Text> : null}
          <IncomeDropdown label="Donde recibiste el dinero*" open={incomeDestinationOpen} onToggle={() => setIncomeDestinationOpen((value) => !value)} value={incomeDestinations.find(([value]) => value === incomeDestination)?.[1] || "Efectivo"}>
            {incomeDestinations.map(([value, label]) => <IncomeDropdownOption key={value} label={label} onPress={() => { selectIncomeDestination(value); setIncomeDestinationOpen(false); }} />)}
          </IncomeDropdown>
          {incomeDestination === "bank_account" ? <AccountPicker accounts={accounts.filter((account) => account.type === "bank" || account.type === "savings")} selected={accountId} onSelect={setAccountId} title="Cuenta guardada (opcional)" /> : null}
          {incomeDestination === "digital_wallet" ? <AccountPicker accounts={accounts.filter((account) => account.type === "wallet")} selected={accountId} onSelect={setAccountId} title="Billetera guardada (opcional)" /> : null}
          {incomeDestination === "other" ? <Input error={errors.customIncomeDestination} label="Especificar dónde lo recibiste *" value={customIncomeDestination} onChangeText={(value) => { setCustomIncomeDestination(value); setErrors((current) => ({ ...current, customIncomeDestination: "" })); }} /> : null}
          {errors.incomeDestination ? <Text style={styles.errorText}>{errors.incomeDestination}</Text> : null}
          <DatePicker error={errors.date} income label="Fecha*" value={date} onChange={(value) => { setDate(value); setErrors((current) => ({ ...current, date: "" })); if (recurring) setNextDueDate(nextDate(value, recurrenceFrequency)); }} />
          <IncomeNoteInput value={note} onChangeText={setNote} />
          <IncomeSwitchField active={recurring} label="Este ingreso se repite" meta="FinFlow puede recordarte cuando esperas recibirlo nuevamente." onChange={toggleRecurring} red />
          {recurring ? <View style={styles.incomeRecurring}>
            <IncomeDropdown label="Frecuencia*" open={incomeFrequencyOpen} onToggle={() => setIncomeFrequencyOpen((value) => !value)} value={recurrenceFrequency === "weekly" ? "Semanal" : recurrenceFrequency === "fortnightly" ? "Quincenal" : recurrenceFrequency === "monthly" ? "Mensual" : "Anual"}>
              {incomeRecurrenceFrequencies.map((item) => <IncomeDropdownOption key={item} label={item === "weekly" ? "Semanal" : item === "fortnightly" ? "Quincenal" : item === "monthly" ? "Mensual" : "Anual"} onPress={() => { setRecurrenceFrequency(item); setNextDueDate(nextDate(date, item)); setIncomeFrequencyOpen(false); }} />)}
            </IncomeDropdown>
            {errors.recurrenceFrequency ? <Text style={styles.errorText}>{errors.recurrenceFrequency}</Text> : null}
            <DatePicker error={errors.nextDueDate} income label="Fecha*" value={nextDueDate} onChange={setNextDueDate} />
            <IncomeSwitchField active={reminderEnabled} label="Recordarme 24 horas antes" onChange={setReminderEnabled} red />
          </View> : null}
          <Pressable accessibilityRole="button" disabled={loading || submitting} onPress={() => saveMovement("income")} style={[styles.incomeSave, (loading || submitting) && styles.incomeSaveDisabled]}><Text style={styles.incomeSaveText}>{loading || submitting ? "Guardando..." : "Guardar"}</Text></Pressable>
        </View>
      ) : null}

      {mode === "installment" ? (
        <View style={styles.incomeForm}>
          <IncomeAmountInput currency={currency} value={amount} onChangeText={setAmount} />
          <IncomeSingleInput label="Compra o concepto*" value={merchant} onChangeText={setMerchant} />
          <IncomeDropdown label="Categoría*" open={categoryListOpen} onToggle={() => setCategoryListOpen((value) => !value)} value={expenseCategories.find((item) => item.id === categoryId) ? normalizedCategoryName(expenseCategories.find((item) => item.id === categoryId)!.name) : "Seleccionar categoría"}>
            {expenseCategories.map((category) => <IncomeDropdownOption key={category.id} label={normalizedCategoryName(category.name)} onPress={() => { setCategoryId(category.id); setCategoryListOpen(false); }} />)}
            <IncomeDropdownOption label="Agregar opción" onPress={() => { setCategoryListOpen(false); setCategoryModalOpen(true); }} />
          </IncomeDropdown>
          <View><Text style={styles.incomeLabel}>Tarjeta de credito*</Text><View style={styles.installmentCards}>{creditCardAccounts.map((card) => <Pressable key={card.id} onPress={() => { setAccountId(card.id); setCreditCardName(card.name); }} style={[styles.installmentCardChoice, accountId === card.id && styles.installmentCardSelected]}><Text style={styles.installmentCardText}>{card.name}</Text></Pressable>)}<Pressable accessibilityLabel="Agregar tarjeta" accessibilityRole="button" onPress={() => setCreditCardModalOpen(true)} style={styles.installmentAddCard}><Plus color={colors.white} size={24} /></Pressable></View></View>
          <IncomeDropdown label="Cantidad de cuotas*" open={installmentsOpen} onToggle={() => setInstallmentsOpen((value) => !value)} value={installments}>
            {[3, 6, 10, 12].map((item) => <IncomeDropdownOption key={item} label={String(item)} onPress={() => { setInstallments(String(item)); setInstallmentsOpen(false); }} />)}
          </IncomeDropdown>
          <DatePicker income label="Primera cuota*" value={firstInstallmentDate} onChange={setFirstInstallmentDate} />
          <IncomeNoteInput value={note} onChangeText={setNote} />
          <IncomeSwitchField active={reminderDaysBefore === 1} label="Recordarme proxima cuota" onChange={(value) => setReminderDaysBefore(value ? 1 : 0)} red />
          <Pressable accessibilityRole="button" disabled={loading || submitting} onPress={saveInstallment} style={[styles.incomeSave, (loading || submitting) && styles.incomeSaveDisabled]}><Text style={[styles.incomeSaveText, styles.installmentSaveText]}>{loading || submitting ? "Guardando..." : "Guardar"}</Text></Pressable>
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
          <Pressable accessibilityRole="button" disabled={loading || submitting} onPress={savePayment} style={[styles.incomeSave, (loading || submitting) && styles.incomeSaveDisabled]}><Text style={styles.incomeSaveText}>{loading || submitting ? "Guardando..." : "Guardar pago programado"}</Text></Pressable>
        </View>
      ) : null}

      {mode === "goal" ? (
        <View style={styles.goalForm}>
          <GoalAmountsInput currency={currency} saved={goalSaved} target={amount} onSavedChange={setGoalSaved} onTargetChange={(value) => { setAmount(value); setErrors((current) => ({ ...current, goalTarget: "" })); }} />
          {errors.goalTarget ? <Text style={styles.errorText}>{errors.goalTarget}</Text> : null}
          <IncomeSingleInput label="Nombre de la meta*" value={merchant} onChangeText={(value) => { setMerchant(value); setErrors((current) => ({ ...current, goalName: "" })); }} />
          {errors.goalName ? <Text style={styles.errorText}>{errors.goalName}</Text> : null}
          <IncomeDropdown label="Medio de pago*" open={paymentMethodOpen} onToggle={() => setPaymentMethodOpen((value) => !value)} value={paymentMethods.find(([value]) => value === paymentMethod)?.[1] || "Efectivo"}>
            {paymentMethods.map(([value, label]) => <IncomeDropdownOption key={value} label={label} onPress={() => { setPaymentMethod(value); setPaymentMethodOpen(false); }} />)}
          </IncomeDropdown>
          <DatePicker income label="Fecha*" minimumDate={todayInput()} value={date} onChange={setDate} />
          <Pressable accessibilityRole="button" disabled={loading || submitting} onPress={saveGoal} style={[styles.incomeSave, (loading || submitting) && styles.incomeSaveDisabled]}><Text style={styles.incomeSaveText}>{loading || submitting ? "Guardando..." : "Guardar"}</Text></Pressable>
        </View>
      ) : null}

      {mode === "ai" ? (
        <View style={styles.aiForm}>
          <Text style={styles.aiLead}>FinFlow arma una ficha y espera tu confirmación.</Text>
          <View><Text style={styles.aiLabel}>Mensaje*</Text><TextInput multiline onChangeText={setAiText} placeholder="Gasté 800 pesos en PedidosYa ayer con la Visa" placeholderTextColor="rgba(255,255,255,0.7)" style={styles.aiMessageInput} textAlignVertical="center" value={aiText} /></View>
          <Pressable accessibilityRole="button" onPress={interpretWithAi} style={styles.incomeSave}><Text style={styles.incomeSaveText}>Preparar ficha</Text></Pressable>
          {proposal ? (
            <View style={styles.aiReview}>
              <Pressable accessibilityRole="button" onPress={() => setProposalExpanded((value) => !value)} style={styles.aiReviewHeader}>
                <View style={styles.aiReviewIcon}>{proposalExpanded ? <ChevronDown color={colors.white} size={16} /> : <ArrowRight color={colors.white} size={16} />}</View>
                <Text style={styles.aiReviewTitle}>Revisá los datos</Text>
              </Pressable>
              {proposalExpanded ? (
                <View style={styles.aiReviewBody}>
                  <Text style={styles.aiReviewMuted}>Completado automáticamente</Text>
                  <Text style={styles.aiReviewLine}>Tipo: {proposal.typeLabel}</Text>
                  <View style={styles.aiInlineRow}><Text style={styles.aiReviewLine}>Monto: </Text>{proposalEditing && !amountValue(amount) ? <TextInput autoFocus keyboardType="decimal-pad" onChangeText={(value) => setAmount(cleanAmount(value))} placeholder="Escribí el monto" placeholderTextColor="rgba(255,255,255,0.45)" style={styles.aiInlineValue} value={amount} /> : <Text style={styles.aiReviewLine}>{amountValue(amount) ? formatMoney(amountValue(amount), currency, false) : "Sin indicar"}</Text>}</View>
                  <View style={styles.aiInlineRow}><Text style={styles.aiReviewLine}>{proposalDetailLabel}: </Text>{proposalEditing && !proposalDetailValue ? <TextInput onChangeText={updateAiDetail} placeholder="Escribí el dato" placeholderTextColor="rgba(255,255,255,0.45)" style={styles.aiInlineValue} value={aiDetailDraft} /> : <Text style={styles.aiReviewLine}>{proposalDetailValue || "Sin indicar"}</Text>}</View>
                  <View style={styles.aiInlineRow}><Text style={styles.aiReviewLine}>Fecha: </Text>{proposalEditing && !proposalDate ? <TextInput keyboardType="numbers-and-punctuation" onChangeText={(value) => { setDate(value); setAiMentionedDate(Boolean(value.trim())); }} placeholder="AAAA-MM-DD" placeholderTextColor="rgba(255,255,255,0.45)" style={styles.aiInlineValue} value={aiMentionedDate ? date : ""} /> : <Text style={styles.aiReviewLine}>{proposalDate ? new Date(`${proposalDate}T12:00:00`).toLocaleDateString("es-UY") : "Sin indicar"}</Text>}</View>
                  {proposal.mode === "expense" ? <Text style={styles.aiReviewLine}>Método de pago: {paymentMethods.find(([value]) => value === paymentMethod)?.[1] || "Sin indicar"}</Text> : null}
                  {proposal.mode === "expense" ? <Text style={styles.aiReviewLine}>Cuota: No</Text> : null}
                  {proposalPendingFields.length ? <Text style={styles.aiMissingNotice}>Faltó indicar: {proposalPendingFields.join(", ").toLocaleLowerCase("es-UY")}.</Text> : null}
                  <View style={styles.aiReviewActions}>
                    <Pressable accessibilityLabel="Editar datos" accessibilityRole="button" onPress={correctProposal} style={styles.aiReviewActionButton}><Pencil color="#1C1C1B" size={22} strokeWidth={2.5} /></Pressable>
                    <Pressable accessibilityLabel="Descartar ficha" accessibilityRole="button" onPress={discardProposal} style={styles.aiReviewActionButton}><Trash2 color="#1C1C1B" size={23} strokeWidth={2.5} /></Pressable>
                  </View>
                  <Pressable accessibilityRole="button" disabled={!proposalComplete || proposalPendingFields.length > 0 || loading || submitting} onPress={confirmProposal} style={[styles.aiConfirmButton, (!proposalComplete || proposalPendingFields.length > 0 || loading || submitting) && styles.aiReviewActionDisabled]}><Text style={styles.aiConfirmText}>{submitting ? "Guardando..." : "Confirmar"}</Text></Pressable>
                </View>
              ) : null}
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

function Action({ onPress, title }: { onPress: () => void; title: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      <View style={styles.actionArrow}><ArrowUpRight color={colors.white} size={22} strokeWidth={1.8} /></View>
      <Text style={styles.actionTitle}>{title}</Text>
    </Pressable>
  );
}

function AnimatedMenuGlow() {
  return <View pointerEvents="none" style={styles.menuGlow}>
    <LiquidGradientBackground sampleOffsetX={0.04} sampleOffsetY={0.05} sampleScaleX={0.45} sampleScaleY={0.5} />
    <LinearGradient
      colors={["#191919", "#191919", "rgba(25,25,25,0.8)", "rgba(25,25,25,0.12)", "rgba(25,25,25,0)"]}
      end={{ x: 0.5, y: 1 }}
      locations={[0, 0.44, 0.58, 0.74, 0.9]}
      start={{ x: 0.5, y: 0 }}
      style={StyleSheet.absoluteFill}
    />
  </View>;
}

function FormHeader({ title }: { title: string }) {
  return <View style={styles.incomeHeader}><Pressable accessibilityLabel="Volver" accessibilityRole="button" onPress={() => router.replace("/(tabs)/add")} style={styles.incomeBack}><ArrowLeft color={colors.white} size={16} /></Pressable><Text style={styles.incomeHeaderTitle}>{title}</Text></View>;
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

function GoalAmountsInput({ currency, onSavedChange, onTargetChange, saved, target }: { currency: Currency; onSavedChange: (value: string) => void; onTargetChange: (value: string) => void; saved: string; target: string }) {
  const symbol = currency === "UYU" ? "$U" : currency === "USD" ? "US$" : "€";
  const symbolWidth = currency === "USD" ? 57 : currency === "UYU" ? 43 : 22;
  const amountColumn = (label: string, value: string, onChange: (value: string) => void) => {
    const displayedValue = value || "0,00";
    const inputWidth = Math.min(112, Math.max(76, displayedValue.length * 18));
    const blockWidth = symbolWidth + 4 + inputWidth;
    return <View style={styles.goalAmountColumn}><View style={{ width: blockWidth }}>
      <Text numberOfLines={1} style={styles.goalAmountLabel}>{label}</Text>
      <View style={styles.goalAmountRow}><Text style={[styles.goalAmountSymbol, { width: symbolWidth }]}>{symbol}</Text><TextInput keyboardType="decimal-pad" onChangeText={(text) => onChange(cleanAmount(text))} placeholder="0,00" placeholderTextColor={colors.white} style={[styles.goalAmountInput, { width: inputWidth }]} value={value} /></View>
    </View></View>;
  };
  return <View style={styles.goalAmountCard}>
    <AmountLavaBackground />
    <View style={styles.goalAmountContent}>
      {amountColumn("Monto objetivo*", target, onTargetChange)}
      {amountColumn("Ya tengo ahorrado", saved, onSavedChange)}
    </View>
  </View>;
}

function IncomeAmountInput({ currency, error, onChangeText, value }: { currency: Currency; error?: string; onChangeText: (value: string) => void; value: string }) {
  const symbol = currency === "UYU" ? "$U" : currency === "USD" ? "US$" : "€";
  const displayedValue = value || "0,00";
  const symbolWidth = currency === "USD" ? 92 : currency === "UYU" ? 72 : 34;
  const inputWidth = Math.min(230, Math.max(112, displayedValue.length * 29));
  const amountBlockWidth = symbolWidth + inputWidth;
  return <View><View style={styles.incomeAmountCard}>
    <AmountLavaBackground />
    <View style={styles.incomeAmountContent}><View style={[styles.incomeAmountBlock, { width: amountBlockWidth }]}><Text style={styles.incomeAmountLabel}>Monto</Text>
        <View style={styles.incomeAmountRow}><Text style={[styles.incomeAmountSymbol, { width: symbolWidth }]}>{symbol}</Text><TextInput keyboardType="decimal-pad" onChangeText={(text) => onChangeText(cleanAmount(text))} placeholder="0,00" placeholderTextColor={colors.white} style={[styles.incomeAmountInput, { width: inputWidth }]} value={value} /></View>
      </View></View>
  </View>{error ? <Text style={styles.errorText}>{error}</Text> : null}</View>;
}

function IncomeDropdown({ children, label, onToggle, open, value }: { children: React.ReactNode; label: string; onToggle: () => void; open: boolean; value: string }) {
  return <View><Text style={styles.incomeLabel}>{label}</Text><Pressable accessibilityRole="button" onPress={onToggle} style={styles.incomeSelect}><Text numberOfLines={1} style={styles.incomeSelectText}>{value}</Text><ChevronDown color={colors.white} size={23} /></Pressable>{open ? <View style={styles.incomeOptions}>{children}</View> : null}</View>;
}

function IncomeDropdownOption({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.incomeOption}><Text style={styles.incomeOptionText}>{label}</Text></Pressable>;
}

function IncomeNoteInput({ onChangeText, value }: { onChangeText: (value: string) => void; value: string }) {
  return <View><Text style={styles.incomeLabel}>Nota</Text><TextInput multiline onChangeText={onChangeText} style={styles.incomeNote} textAlignVertical="top" value={value} /></View>;
}

function IncomeSingleInput({ label, onChangeText, value }: { label: string; onChangeText: (value: string) => void; value: string }) {
  return <View><Text style={styles.incomeLabel}>{label}</Text><TextInput onChangeText={onChangeText} style={styles.incomeSelect} value={value} /></View>;
}

function IncomeSwitchField({ active, label, meta, onChange, red = false }: { active: boolean; label: string; meta?: string; onChange: (value: boolean) => void | Promise<void>; red?: boolean }) {
  return <View style={styles.incomeSwitchRow}><View style={styles.switchCopy}><Text style={styles.incomeSwitchLabel}>{label}</Text>{meta ? <Text style={styles.incomeSwitchMeta}>{meta}</Text> : null}</View><Switch onValueChange={onChange} thumbColor={active ? "#A33227" : "#D9D9D9"} trackColor={{ false: "#5A5A58", true: "#BB3C2E" }} value={active} /></View>;
}

function IncomeCategoryModal({ name, onClose, onName, onSave, visible }: { name: string; onClose: () => void; onName: (value: string) => void; onSave: () => void; visible: boolean }) {
  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}><View style={styles.modalBackdrop}><View style={styles.incomeCategoryModal}><Text style={styles.proposalTitle}>Agregar categoría</Text><Input autoFocus label="Nombre" onChangeText={onName} value={name} /><Pressable disabled={!name.trim()} onPress={onSave} style={[styles.incomeSave, !name.trim() && styles.incomeSaveDisabled]}><Text style={styles.incomeSaveText}>Agregar</Text></Pressable><Pressable onPress={onClose} style={styles.secondaryButton}><Text style={styles.secondaryText}>Cancelar</Text></Pressable></View></View></Modal>;
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

function DatePicker({ error, income = false, label, minimumDate, onChange, optional = false, value }: { error?: string; income?: boolean; label: string; minimumDate?: string; onChange: (value: string) => void; optional?: boolean; value: string }) {
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
      <Text style={income ? styles.incomeLabel : styles.label}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={[styles.input, styles.dateInput, income && styles.incomeSelect]}>
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
  return <View style={styles.switchRow}><View style={styles.switchCopy}><Text style={styles.switchLabel}>{label}</Text>{meta ? <Text style={styles.switchMeta}>{meta}</Text> : null}</View><Switch onValueChange={onChange} thumbColor={active ? "#A33227" : "#D9D9D9"} trackColor={{ false: "#5A5A58", true: "#BB3C2E" }} value={active} /></View>;
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
    backgroundColor: "#595958",
    aspectRatio: 1.07,
    borderRadius: 28,
    justifyContent: "flex-end",
    overflow: "hidden",
    paddingBottom: 18,
    paddingHorizontal: 17,
    position: "relative",
    width: "46.7%"
  },
  actionArrow: {
    alignItems: "center",
    backgroundColor: "#1C1C1B",
    borderRadius: 21,
    height: 42,
    justifyContent: "center",
    position: "absolute",
    right: 14,
    top: 14,
    width: 42
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 24
  },
  actionTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 21,
    textAlign: "left"
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
  aiForm: {
    gap: 26,
    marginTop: 30
  },
  aiLabel: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 11
  },
  aiLead: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 21
  },
  aiMessageInput: {
    ...typography.body,
    backgroundColor: "#5A5A59",
    borderRadius: 14,
    color: colors.white,
    fontSize: 15,
    lineHeight: 20,
    minHeight: 52,
    paddingHorizontal: 17,
    paddingVertical: 12
  },
  aiReview: {
    marginHorizontal: -17,
    marginTop: 22
  },
  aiReviewHeader: {
    alignItems: "center",
    backgroundColor: "#595958",
    flexDirection: "row",
    minHeight: 46,
    paddingHorizontal: 20
  },
  aiReviewIcon: {
    alignItems: "center",
    backgroundColor: "#1C1C1B",
    borderRadius: 15,
    height: 30,
    justifyContent: "center",
    marginRight: 18,
    width: 30
  },
  aiReviewTitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    fontWeight: "600"
  },
  aiReviewBody: {
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14
  },
  aiReviewMuted: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    marginBottom: 4
  },
  aiReviewLine: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 19
  },
  aiInlineRow: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 24
  },
  aiInlineValue: {
    ...typography.body,
    borderBottomColor: "rgba(255,255,255,0.45)",
    borderBottomWidth: 1,
    color: "rgba(255,255,255,0.9)",
    flex: 1,
    fontSize: 15,
    lineHeight: 19,
    minHeight: 28,
    padding: 0
  },
  aiMissingNotice: {
    ...typography.body,
    color: colors.negative,
    fontSize: 15,
    lineHeight: 19,
    marginTop: 6
  },
  aiReviewActions: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12
  },
  aiReviewActionButton: {
    alignItems: "center",
    backgroundColor: "#D7D7D7",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  aiReviewActionDisabled: {
    opacity: 0.38
  },
  aiConfirmButton: {
    alignItems: "center",
    backgroundColor: "#BDBDBD",
    borderRadius: 28,
    justifyContent: "center",
    minHeight: 48
  },
  aiConfirmText: {
    ...typography.button,
    color: "#1C1C1B",
    fontWeight: "800"
  },
  aiCorrectText: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    textAlign: "center"
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
  goalAmountCard: {
    borderRadius: 28,
    height: 162,
    overflow: "hidden"
  },
  goalAmountColumn: {
    alignItems: "center",
    flex: 1,
    minWidth: 0
  },
  goalAmountContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    flexDirection: "row"
  },
  goalAmountInput: {
    ...typography.display,
    color: colors.white,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
    minHeight: 45,
    paddingHorizontal: 3,
    paddingVertical: 0
  },
  goalAmountLabel: {
    ...typography.body,
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    lineHeight: 18
  },
  goalAmountRow: {
    alignItems: "center",
    flexDirection: "row"
  },
  goalAmountSymbol: {
    ...typography.display,
    color: colors.white,
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
    marginRight: 4
  },
  goalForm: {
    gap: 22,
    marginTop: 30
  },
  menuContent: {
    flex: 1,
    position: "relative",
    zIndex: 0
  },
  menuGlow: {
    bottom: -180,
    left: -20,
    overflow: "hidden",
    position: "absolute",
    right: -20,
    top: -28,
    zIndex: 0
  },
  menuScreen: {
    backgroundColor: "#191919",
    paddingHorizontal: 20,
    paddingTop: layout.mainScreenTop
  },
  menuTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 22,
    fontWeight: "500",
    lineHeight: 25
  },
  incomeScreen: {
    backgroundColor: "#1C1C1B",
    paddingBottom: 56,
    paddingHorizontal: 17,
    paddingTop: layout.mainScreenTop
  },
  incomeHeader: { alignItems: "center", flexDirection: "row", minHeight: 46 },
  incomeBack: { alignItems: "center", height: 40, justifyContent: "center", width: 20 },
  incomeHeaderTitle: { ...typography.title, color: colors.white, marginLeft: 3 },
  incomeForm: {
    gap: 22,
    marginTop: 30
  },
  incomeAmountCard: {
    borderRadius: 28,
    height: 162,
    overflow: "hidden"
  },
  incomeAmountContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center"
  },
  incomeAmountBlock: { alignSelf: "center" },
  incomeAmountLabel: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 19,
    textAlign: "left"
  },
  incomeAmountRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-start"
  },
  incomeAmountSymbol: {
    ...typography.display,
    color: colors.white,
    fontSize: 50,
    fontWeight: "700",
    lineHeight: 62
  },
  incomeAmountInput: {
    ...typography.display,
    color: colors.white,
    fontSize: 50,
    fontWeight: "700",
    lineHeight: 62,
    minHeight: 66,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  incomeLabel: {
    ...typography.body,
    color: "rgba(255,255,255,0.74)",
    fontSize: 15,
    lineHeight: 19,
    marginBottom: 10
  },
  incomeSelect: {
    alignItems: "center",
    backgroundColor: "#5A5A59",
    borderColor: "transparent",
    borderRadius: 14,
    borderWidth: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 48,
    paddingHorizontal: 16
  },
  incomeSelectText: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    fontSize: 15
  },
  incomeOptions: {
    backgroundColor: "#4D4D4C",
    borderRadius: 12,
    marginTop: 6,
    overflow: "hidden"
  },
  incomeOption: {
    borderBottomColor: "rgba(255,255,255,0.1)",
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 16
  },
  incomeOptionText: {
    ...typography.body,
    color: colors.white,
    fontSize: 15
  },
  incomeNote: {
    ...typography.body,
    backgroundColor: "#5A5A59",
    borderRadius: 14,
    color: colors.white,
    minHeight: 82,
    padding: 14
  },
  incomeSwitchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    minHeight: 50
  },
  incomeSwitchLabel: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    fontWeight: "700"
  },
  incomeSwitchMeta: {
    ...typography.label,
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    lineHeight: 15,
    marginTop: 3,
    maxWidth: 280
  },
  incomeRecurring: {
    gap: 20
  },
  incomeSave: {
    alignItems: "center",
    backgroundColor: "#BDBDBD",
    borderRadius: 30,
    justifyContent: "center",
    marginTop: 8,
    minHeight: 52
  },
  incomeSaveDisabled: {
    opacity: 0.52
  },
  incomeSaveText: {
    ...typography.button,
    color: "#1C1C1B",
    fontSize: 15,
    fontWeight: "800"
  },
  incomeCategoryModal: {
    backgroundColor: "#3F403B",
    borderColor: colors.appGrayBorder,
    borderRadius: 14,
    borderWidth: 1,
    gap: 16,
    padding: 24
  },
  installmentCards: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: 10 },
  installmentAddCard: { alignItems: "center", backgroundColor: "#5A5A59", borderRadius: 27, height: 54, justifyContent: "center", width: 54 },
  installmentCardChoice: { backgroundColor: "#5A5A59", borderRadius: 14, justifyContent: "center", minHeight: 48, paddingHorizontal: 16 },
  installmentCardSelected: { borderColor: "#B7362B", borderWidth: 2 },
  installmentCardText: { ...typography.body, color: colors.white },
  installmentSaveText: { color: colors.white, fontWeight: "800" },
  errorText: {
    ...typography.label,
    color: colors.negative,
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
    fontSize: 22
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
