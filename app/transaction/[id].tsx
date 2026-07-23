import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Check, Pencil, Trash2 } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AmountLavaBackground } from "../../src/components/forms/AmountLavaBackground";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { fetchTransaction } from "../../src/services/financeService";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { Currency, Transaction } from "../../src/types/finflow";
import { formatCompactMoney } from "../../src/utils/money";

function normalizeId(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

function isValidObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

function valueOf(transaction: Transaction) {
  return Math.abs(Number(transaction.rawAmount ?? transaction.raw_amount ?? transaction.amount ?? 0));
}

function firstText(...values: Array<unknown>) {
  const value = values.find((item) => typeof item === "string" && item.trim().length > 0);
  return typeof value === "string" ? value.trim() : "";
}

function paymentMethodLabel(value?: string) {
  if (value === "cash") return "Efectivo";
  if (value === "debit_card") return "Tarjeta de débito";
  if (value === "credit_card") return "Tarjeta de crédito";
  if (value === "bank_transfer") return "Transferencia";
  if (value === "digital_wallet") return "Billetera digital";
  if (value?.startsWith("other:")) return value.slice(6);
  return "Otro";
}

function incomeDestinationLabel(value?: string) {
  if (value === "cash") return "Efectivo";
  if (value === "bank_account") return "Cuenta bancaria";
  if (value === "bank_transfer") return "Transferencia";
  if (value === "digital_wallet") return "Billetera digital";
  if (value?.startsWith("other:")) return value.slice(6);
  return "Otro";
}

function paymentMethodValue(value: string, income: boolean) {
  const normalized = value.trim().toLocaleLowerCase("es-UY");
  if (normalized.includes("efectivo")) return "cash";
  if (normalized.includes("débito") || normalized.includes("debito")) return "debit_card";
  if (normalized.includes("crédito") || normalized.includes("credito")) return "credit_card";
  if (normalized.includes("transfer")) return "bank_transfer";
  if (normalized.includes("billetera")) return "digital_wallet";
  if (income && normalized.includes("cuenta")) return "bank_account";
  return `other:${value.trim() || "Otro"}`;
}

function parseEditedDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!match) return /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? value.trim() : "";
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

export default function TransactionDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = normalizeId(params.id);
  const { accounts, categories, deleteTransaction, loadAccounts, loadCategories, loadOverview, recurringPayments, transactions, updateTransaction } = useFinFlowStore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTypeText, setEditTypeText] = useState("");
  const [editCategoryText, setEditCategoryText] = useState("");
  const [editAccountText, setEditAccountText] = useState("");
  const [editPaymentText, setEditPaymentText] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void loadAccounts();
    void loadCategories();
    void loadOverview();
  }, [loadAccounts, loadCategories, loadOverview]);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!id) {
        setLoading(false);
        setLoadError("No pude abrir este movimiento porque no tiene un identificador válido.");
        return;
      }
      setLoading(true);
      setLoadError("");
      const cached = transactions.find((item) => item.id === id || item._id === id);
      try {
        let next: Transaction | null = null;
        try {
          next = isValidObjectId(id) ? await fetchTransaction(id) : null;
        } catch (error) {
          if (!cached) throw error;
        }
        next = next || cached || null;
        if (!next) throw new Error("No encontré este movimiento para tu usuario.");
        if (!alive) return;
        setTransaction(next);
        setTitle(firstText(next.title, (next as any).description, next.note, next.merchant));
        setAmount(String(valueOf(next)));
        setNote(next.note || "");
        setEditCategoryId(next.categoryId || next.category_id || "");
        setEditAccountId(next.accountId || next.account_id || "");
        setEditPaymentMethod(next.paymentMethod || next.payment_method || "");
        setEditDate(String(next.date).slice(0, 10));
        setEditTypeText(next.type === "income" ? "Ingreso" : "Gasto");
      } catch (error) {
        if (alive) setLoadError(error instanceof Error ? error.message : "No se pudo cargar el movimiento.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, [id, transactions]);

  const account = useMemo(() => accounts.find((item) => item.id === (transaction?.account_id || transaction?.accountId)), [accounts, transaction]);
  const category = useMemo(() => categories.find((item) => item.id === (transaction?.category_id || transaction?.categoryId)), [categories, transaction]);

  async function save() {
    if (!transaction) return;
    if (!hasChanges) {
      setEditing(false);
      return;
    }
    const parsedAmount = Number(amount.replace(/\./g, "").replace(",", "."));
    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("FinFlow", "Completá el concepto y un monto mayor a cero.");
      return;
    }
    try {
      const nextType: Transaction["type"] = editTypeText.trim().toLocaleLowerCase("es-UY").includes("ingreso") ? "income" : "expense";
      const matchedCategory = categories.find((item) => item.name.toLocaleLowerCase("es-UY") === editCategoryText.trim().toLocaleLowerCase("es-UY"));
      const matchedAccount = accounts.find((item) => item.name.toLocaleLowerCase("es-UY") === editAccountText.trim().toLocaleLowerCase("es-UY"));
      const updatePayload: Partial<Transaction> = {};
      const currentCategoryId = transaction.categoryId || transaction.category_id || "";
      const currentAccountId = transaction.accountId || transaction.account_id || "";
      const parsedDate = parseEditedDate(editDate);
      const currentDate = String(transaction.date).slice(0, 10);
      const currentPaymentLabel = transaction.type === "income" ? incomeDestinationLabel(transaction.paymentMethod || transaction.payment_method) : paymentMethodLabel(transaction.paymentMethod || transaction.payment_method);

      if (parsedAmount !== valueOf(transaction)) updatePayload.amount = parsedAmount;
      if (nextType !== transaction.type) updatePayload.type = nextType;
      if (matchedCategory?.id && matchedCategory.id !== currentCategoryId) updatePayload.categoryId = matchedCategory.id;
      if (matchedAccount?.id && matchedAccount.id !== currentAccountId) updatePayload.accountId = matchedAccount.id;
      if (parsedDate && parsedDate !== currentDate) updatePayload.date = parsedDate;
      if (editPaymentText.trim() && editPaymentText.trim().toLocaleLowerCase("es-UY") !== currentPaymentLabel.toLocaleLowerCase("es-UY")) updatePayload.paymentMethod = paymentMethodValue(editPaymentText, nextType === "income");
      if (note.trim() && note.trim() !== String(transaction.note || "").trim()) updatePayload.note = note.trim();

      if (!Object.keys(updatePayload).length) {
        setEditing(false);
        return;
      }
      const updated = await updateTransaction(transaction.id, updatePayload);
      setTransaction(updated);
      setEditing(false);
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo editar el movimiento.");
    }
  }

  async function removeTransaction() {
    if (!transaction) return;
    try {
      await deleteTransaction(transaction.id);
      router.back();
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  }

  if (loading) {
    return <ScreenContainer backgroundColor="#1C1C1B"><Header title="Detalle de movimiento" back /><Text style={styles.empty}>Cargando movimiento...</Text></ScreenContainer>;
  }

  if (loadError || !transaction) {
    return <ScreenContainer backgroundColor="#1C1C1B"><Header title="Detalle de movimiento" back /><View style={styles.errorPanel}><Text style={styles.errorTitle}>No se pudo abrir el movimiento</Text><Text style={styles.empty}>{loadError || "No encontré este movimiento para tu usuario."}</Text></View></ScreenContainer>;
  }

  const typeLabel = transaction.type === "income" ? "Ingreso" : transaction.type === "refund" ? "Reintegro" : transaction.type === "goal_contribution" ? "Aporte a meta" : transaction.type === "transfer" || transaction.type === "internal_transfer" ? "Transferencia" : "Gasto";
  const transactionConcept = firstText(transaction.title, transaction.merchant, (transaction as any).description);
  const displayConcept = transactionConcept.replace(/\s*[·-]\s*cuota\s+\d+\s+de\s+\d+\s*$/i, "").trim() || transactionConcept;
  const transactionNote = firstText(transaction.note, (transaction as any).notes);
  const categoryName = firstText(category?.name, transaction.category, (transaction as any).category_name);
  const scheduledPayment = recurringPayments.find((payment) => payment.id === (transaction.scheduledPaymentId || transaction.scheduled_payment_id));
  const recurrenceLabel = scheduledPayment?.frequency === "weekly" ? "Semanalmente" : scheduledPayment?.frequency === "fortnightly" ? "Quincenalmente" : scheduledPayment?.frequency === "monthly" ? "Mensualmente" : scheduledPayment?.frequency === "annual" ? "Anualmente" : "";
  const isIncome = transaction.type === "income";
  const editingIncome = editTypeText.trim().toLocaleLowerCase("es-UY").includes("ingreso");
  const currencySymbol = transaction.currency === "USD" ? "US$" : transaction.currency === "EUR" ? "€" : "$U";
  const selectedCategory = categories.find((item) => item.id === editCategoryId);
  const selectedAccount = accounts.find((item) => item.id === editAccountId);
  const editablePaymentLabel = editingIncome ? incomeDestinationLabel(editPaymentMethod) : paymentMethodLabel(editPaymentMethod);

  function startEditing() {
    setEditTypeText(typeLabel);
    setEditCategoryText(selectedCategory?.name || categoryName || "");
    setEditAccountText(selectedAccount?.name || account?.name || "");
    setEditPaymentText(editablePaymentLabel);
    setEditDate(new Date(transaction!.date).toLocaleDateString("es-UY"));
    setHasChanges(false);
    setEditing(true);
  }

  return (
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screen}>
      <Header title="Detalle de movimiento" back />

      <View style={styles.hero}>
        <AmountLavaBackground />
        <View style={styles.heroCopy}>
          <Text style={styles.type}>{typeLabel}</Text>
          {editing ? (
            <View style={styles.inlineAmountRow}>
              <Text style={styles.inlineCurrency}>{currencySymbol}</Text>
              <TextInput keyboardType="decimal-pad" onChangeText={(value) => { setAmount(value.replace(/[^\d,.]/g, "")); setHasChanges(true); }} selectionColor="#FFFFFF" style={[styles.heroAmount, styles.inlineAmountInput]} value={amount} />
            </View>
          ) : (
            <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.heroAmount}>{formatCompactMoney(valueOf(transaction), transaction.currency as Currency, false)}</Text>
          )}
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.concept}>{displayConcept || "Movimiento"}</Text>
        {editing ? <InlineDetailInput label="Tipo:" onChangeText={(value) => { setEditTypeText(value); setHasChanges(true); }} value={editTypeText} /> : <Detail label="Tipo:" value={typeLabel} />}
        {editing ? <InlineDetailInput keyboardType="decimal-pad" label="Monto:" onChangeText={(value) => { setAmount(value.replace(/[^\d,.]/g, "")); setHasChanges(true); }} value={amount} /> : <Detail label="Monto:" value={valueOf(transaction).toLocaleString("es-UY", { maximumFractionDigits: 2 })} />}
        {editing ? <InlineDetailInput label="Categoría:" onChangeText={(value) => { setEditCategoryText(value); setHasChanges(true); }} value={editCategoryText} /> : <Detail label="Categoría:" value={categoryName ? categoryName.charAt(0).toLocaleUpperCase("es-UY") + categoryName.slice(1) : "Sin categoría"} />}
        {editing ? <InlineDetailInput label="Fecha:" onChangeText={(value) => { setEditDate(value); setHasChanges(true); }} value={editDate} /> : <Detail label="Fecha:" value={new Date(transaction.date).toLocaleDateString("es-UY")} />}
        {editing ? <InlineDetailInput label={editingIncome ? "Dónde se recibió:" : "Método de pago:"} onChangeText={(value) => { setEditPaymentText(value); setHasChanges(true); }} value={editPaymentText} /> : <Detail label={isIncome ? "Dónde se recibió:" : "Método de pago:"} value={isIncome ? incomeDestinationLabel(transaction.paymentMethod || transaction.payment_method) : paymentMethodLabel(transaction.paymentMethod || transaction.payment_method)} />}
        {editing ? <InlineDetailInput label="Cuenta:" onChangeText={(value) => { setEditAccountText(value); setHasChanges(true); }} value={editAccountText} /> : account ? <Detail label="Cuenta:" value={account.name} /> : null}
        {transaction.installment ? <Detail label="Cuota:" value={`${transaction.installment.current} de ${transaction.installment.total}`} /> : null}
        {scheduledPayment && recurrenceLabel ? <Detail label="Se repite:" value={recurrenceLabel} /> : null}
        {scheduledPayment ? <Detail label={isIncome ? "Próximo ingreso:" : "Próximo vencimiento:"} value={new Date(`${scheduledPayment.nextChargeDate}T12:00:00`).toLocaleDateString("es-UY")} /> : null}
        {scheduledPayment && Number(scheduledPayment.reminderDaysBefore ?? scheduledPayment.reminder_days_before) === 1 ? <Detail label="Recordatorio:" value="24 horas antes" /> : null}
        {editing ? <InlineDetailInput label="Nota:" onChangeText={(value) => { setNote(value); setHasChanges(true); }} value={note} /> : <Detail label="Nota:" value={transactionNote || "-"} />}
        {transaction.receiptUrl || transaction.receipt_url ? <Pressable onPress={() => Linking.openURL(transaction.receiptUrl || transaction.receipt_url || "")}><Detail label="Comprobante:" value="Ver comprobante" /></Pressable> : null}
      </View>

      <View style={styles.actions}>
        <Pressable accessibilityLabel={editing ? "Guardar cambios" : "Editar movimiento"} accessibilityRole="button" onPress={() => editing ? void save() : startEditing()} style={styles.iconButton}>
          {editing ? <Check color="#1C1C1B" size={20} strokeWidth={2.4} /> : <Pencil color="#1C1C1B" fill="#1C1C1B" size={18} strokeWidth={2} />}
        </Pressable>
        <Pressable accessibilityLabel="Eliminar movimiento" accessibilityRole="button" onPress={() => void removeTransaction()} style={styles.iconButton}>
          <Trash2 color="#1C1C1B" size={19} strokeWidth={2} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function InlineDetailInput({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"] }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><TextInput keyboardType={keyboardType} onChangeText={onChangeText} placeholder="-" placeholderTextColor="rgba(255,255,255,0.78)" selectionColor="#FFFFFF" style={styles.inlineDetailInput} value={value} /></View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", gap: 6, marginTop: 32 },
  concept: { ...typography.body, color: colors.white, fontWeight: "800", marginBottom: 8 },
  detailLabel: { ...typography.body, color: "rgba(255,255,255,0.78)", flex: 0.9 },
  detailRow: { flexDirection: "row", gap: spacing.md, minHeight: 31 },
  detailValue: { ...typography.body, color: "rgba(255,255,255,0.78)", flex: 1.2, textAlign: "right" },
  details: { marginTop: 42 },
  empty: { ...typography.body, color: colors.transparentWhite, marginTop: spacing.xl },
  errorPanel: { gap: spacing.md, marginTop: spacing.xl },
  errorTitle: { ...typography.title, color: colors.white },
  hero: { borderRadius: 28, height: 162, marginHorizontal: 2, marginTop: 44, overflow: "hidden" },
  heroAmount: { color: colors.white, fontSize: 52, fontWeight: "600", letterSpacing: -1, lineHeight: 59 },
  heroCopy: { alignSelf: "center", height: "100%", justifyContent: "center", maxWidth: "84%", minWidth: "76%" },
  iconButton: { alignItems: "center", backgroundColor: "#C7C7C7", borderRadius: 10, height: 40, justifyContent: "center", width: 40 },
  inlineAmountInput: { flex: 1, margin: 0, padding: 0 },
  inlineAmountRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  inlineCurrency: { color: colors.white, fontSize: 40, fontWeight: "600", lineHeight: 52 },
  inlineDetailInput: { ...typography.body, color: colors.white, flex: 1.2, margin: 0, padding: 0, textAlign: "right" },
  screen: { paddingHorizontal: 22, paddingTop: 24 },
  type: { ...typography.body, color: "rgba(255,255,255,0.78)" }
});
