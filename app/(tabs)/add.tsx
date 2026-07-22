import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeftRight, Bell, Brain, CreditCard, Minus, Plus } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";
import { Category, Currency } from "../../src/types/finflow";
import { formatMoney } from "../../src/utils/money";

type Mode = "menu" | "expense" | "income" | "transfer" | "installment" | "payment" | "ai";
const frequentExpenseLabels = ["Comida", "Transporte", "Compras", "Servicios"];
const incomeSources = ["Sueldo", "Freelance", "Devolución", "Transferencia recibida", "Otro"];
const frequencies = ["weekly", "monthly", "annual"] as const;

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toIsoDate(value: string) {
  return value ? new Date(`${value}T12:00:00`).toISOString() : new Date().toISOString();
}

function amountValue(value: string) {
  return Number(value.replace(",", ".") || 0);
}

function chooseCategory(categories: Category[], type: "income" | "expense", label?: string) {
  const source = categories.filter((category) => category.type === type);
  const normalized = String(label || "").toLowerCase();
  return source.find((category) => normalized.includes(category.name.toLowerCase())) || source[0];
}

export default function Add() {
  const params = useLocalSearchParams<{ type?: "income" | "expense"; mode?: string }>();
  const profile = useSessionStore((state) => state.profile);
  const { accounts, categories, createRecurringPayment, createTransaction, createTransfer, loadAccounts, loadCategories, loading } = useFinFlowStore();
  const [mode, setMode] = useState<Mode>(
    params.mode === "transfer" || params.mode === "installment" || params.mode === "ai" ? params.mode : params.type === "income" ? "income" : params.type === "expense" ? "expense" : "menu"
  );
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayInput());
  const [time, setTime] = useState("");
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [antExpense, setAntExpense] = useState(false);
  const [installments, setInstallments] = useState("3");
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(todayInput());
  const [frequency, setFrequency] = useState<(typeof frequencies)[number]>("monthly");
  const [paymentCategory, setPaymentCategory] = useState("Servicios");
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
    if (!toAccountId && accounts[1]) setToAccountId(accounts[1].id);
  }, [accountId, accounts, toAccountId]);

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
        amount: amountValue(amount),
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

  async function saveTransfer() {
    const from = accounts.find((account) => account.id === accountId);
    if (!from || !toAccountId || accountId === toAccountId) {
      Alert.alert("FinFlow", "Elegí dos cuentas distintas.");
      return;
    }
    try {
      await createTransfer({
        fromAccountId: accountId,
        toAccountId,
        amount: amountValue(amount),
        currency: from.currency,
        date: toIsoDate(date),
        title: merchant.trim() || "Transferencia",
        note: note.trim()
      });
      router.replace("/(tabs)/overview");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo transferir.");
    }
  }

  async function saveInstallment() {
    const category = categories.find((item) => item.id === categoryId) || chooseCategory(categories, "expense", merchant);
    const total = Math.max(1, Number(installments || 1));
    const totalAmount = amountValue(amount);
    const amountPerInstallment = totalAmount / total;
    if (!accountId || !category) {
      Alert.alert("FinFlow", "Necesitás seleccionar tarjeta/cuenta y categoría.");
      return;
    }
    try {
      await createTransaction({
        accountId,
        categoryId: category.id,
        type: "expense",
        title: merchant.trim() || "Compra en cuotas",
        merchant: merchant.trim(),
        amount: totalAmount,
        currency,
        date: toIsoDate(date),
        note: note.trim(),
        paymentMethod: "credito",
        installment: {
          current: 1,
          total,
          amountPerInstallment,
          remainingAmount: Math.max(0, totalAmount - amountPerInstallment),
          nextDueDate: firstInstallmentDate
        }
      });
      router.replace("/(tabs)/plan?tab=Tarjetas");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar la compra.");
    }
  }

  async function savePayment() {
    try {
      await createRecurringPayment({
        merchant: merchant.trim() || "Pago próximo",
        amount: amountValue(amount),
        currency,
        frequency,
        category: paymentCategory || "Servicios",
        nextChargeDate: toIsoDate(date),
        kind: paymentCategory.toLowerCase().includes("suscripción") ? "subscription" : "service",
        accountId,
        notificationsEnabled: true
      });
      router.replace("/(tabs)/plan?tab=Calendario");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo crear el pago.");
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
          <Action icon={<ArrowLeftRight color={colors.white} size={21} />} title="Transferencia" onPress={() => resetForm("transfer")} />
          <Action icon={<CreditCard color={colors.white} size={21} />} title="Compra en cuotas" onPress={() => resetForm("installment")} />
          <Action icon={<Bell color={colors.white} size={21} />} title="Pago próximo" onPress={() => resetForm("payment")} />
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
          <Input label="Fecha" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
          <Toggle active={recurring} label="Recurrente" onPress={() => setRecurring(!recurring)} />
          <Input label="Nota" value={note} onChangeText={setNote} />
          <PrimaryButton onPress={() => saveMovement("income")}>{loading ? "Guardando..." : "Guardar ingreso"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "transfer" ? (
        <View style={styles.form}>
          <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Cuenta origen" />
          <AccountPicker accounts={accounts.filter((account) => account.id !== accountId)} selected={toAccountId} onSelect={setToAccountId} title="Cuenta destino" />
          <AmountInput value={amount} onChangeText={setAmount} />
          <Input label="Fecha" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
          <Input label="Nota" value={note} onChangeText={setNote} />
          <PrimaryButton onPress={saveTransfer}>{loading ? "Moviendo..." : "Guardar transferencia"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "installment" ? (
        <View style={styles.form}>
          <Input label="Comercio" value={merchant} onChangeText={setMerchant} />
          <AmountInput value={amount} onChangeText={setAmount} />
          <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Tarjeta" />
          <Input keyboardType="number-pad" label="Cantidad de cuotas" value={installments} onChangeText={setInstallments} />
          <Input label="Fecha" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
          <Input label="Primera cuota" placeholder="YYYY-MM-DD" value={firstInstallmentDate} onChangeText={setFirstInstallmentDate} />
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.wrap}>{visibleExpenseCategories.map((category) => <Chip key={category.id} active={categoryId === category.id} label={category.name} onPress={() => setCategoryId(category.id)} />)}</View>
          <PrimaryButton onPress={saveInstallment}>{loading ? "Guardando..." : "Guardar compra en cuotas"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "payment" ? (
        <View style={styles.form}>
          <Input label="Nombre" placeholder="UTE, OSE, alquiler..." value={merchant} onChangeText={setMerchant} />
          <AmountInput value={amount} onChangeText={setAmount} />
          <Input label="Fecha de vencimiento" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
          <Text style={styles.label}>Frecuencia</Text>
          <View style={styles.wrap}>{frequencies.map((item) => <Chip key={item} active={frequency === item} label={item} onPress={() => setFrequency(item)} />)}</View>
          <Input label="Categoría" value={paymentCategory} onChangeText={setPaymentCategory} />
          <AccountPicker accounts={accounts} selected={accountId} onSelect={setAccountId} title="Cuenta" />
          <PrimaryButton onPress={savePayment}>{loading ? "Guardando..." : "Guardar pago próximo"}</PrimaryButton>
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
  return <TextInput keyboardType="decimal-pad" onChangeText={onChangeText} placeholder="$U 0" placeholderTextColor={colors.transparentWhite} style={styles.amountInput} value={value} />;
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
          <Input label="Fecha" placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
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
