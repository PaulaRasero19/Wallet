import { useEffect, useMemo, useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { BookOpen, Circle, Heart, Home, PawPrint, Receipt, ShoppingBag, Ticket, TramFront, Utensils, Zap } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Header } from "../../src/components/Header";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { fetchTransaction } from "../../src/services/financeService";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { Currency, Transaction } from "../../src/types/finflow";
import { formatMoney } from "../../src/utils/money";

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

export default function TransactionDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = normalizeId(params.id);
  const { accounts, categories, deleteTransaction, loadAccounts, loadCategories, loadOverview, recurringPayments, transactions, updateTransaction } = useFinFlowStore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
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
      } catch (error) {
        if (alive) setLoadError(error instanceof Error ? error.message : "No se pudo cargar el movimiento.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [id, transactions]);

  const account = useMemo(() => accounts.find((item) => item.id === (transaction?.account_id || transaction?.accountId)), [accounts, transaction]);
  const category = useMemo(() => categories.find((item) => item.id === (transaction?.category_id || transaction?.categoryId)), [categories, transaction]);

  async function save() {
    if (!transaction) return;
    try {
      const updated = await updateTransaction(transaction.id, {
        accountId: transaction.accountId || transaction.account_id,
        categoryId: transaction.categoryId || transaction.category_id,
        currency: transaction.currency,
        date: transaction.date,
        type: transaction.type,
        title: title.trim() || transaction.title,
        merchant: "",
        amount: Number(amount.replace(",", ".")),
        note: note.trim()
      });
      setTransaction(updated);
      setEditing(false);
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo editar el movimiento.");
    }
  }

  function confirmDelete() {
    if (!transaction) return;
    Alert.alert("Eliminar movimiento", "Esta acción actualiza el saldo de la cuenta y no se puede deshacer.", [
      { style: "cancel", text: "Cancelar" },
      {
        style: "destructive",
        text: "Eliminar",
        onPress: async () => {
          try {
            await deleteTransaction(transaction.id);
            router.back();
          } catch (error) {
            Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo eliminar.");
          }
        }
      }
    ]);
  }

  if (loading) {
    return (
      <ScreenContainer>
        <Header title="Movimiento" back />
        <Text style={styles.empty}>Cargando movimiento...</Text>
      </ScreenContainer>
    );
  }

  if (loadError || !transaction) {
    return (
      <ScreenContainer>
        <Header title="Movimiento" back />
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>No se pudo abrir el movimiento</Text>
          <Text style={styles.empty}>{loadError || "No encontré este movimiento para tu usuario."}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Volver</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  const typeLabel = transaction.type === "income" ? "Ingreso" : transaction.type === "refund" ? "Reintegro" : transaction.type === "goal_contribution" ? "Aporte a meta" : transaction.type === "transfer" || transaction.type === "internal_transfer" ? "Transferencia" : "Gasto";
  const amountValue = transaction.type === "expense" || transaction.type === "goal_contribution" ? -valueOf(transaction) : valueOf(transaction);
  const transactionConcept = firstText(transaction.title, transaction.merchant, (transaction as any).description);
  const transactionNote = firstText(transaction.note, (transaction as any).notes);
  const categoryName = firstText(category?.name, transaction.category, (transaction as any).category_name);
  const scheduledPayment = recurringPayments.find((payment) => payment.id === (transaction.scheduledPaymentId || transaction.scheduled_payment_id));
  const recurrenceLabel = scheduledPayment?.frequency === "weekly" ? "Semanalmente" : scheduledPayment?.frequency === "monthly" ? "Mensualmente" : scheduledPayment?.frequency === "annual" ? "Anualmente" : "";

  return (
    <ScreenContainer>
      <Header title="Detalle de movimiento" back />
      <View style={styles.hero}>
        <Text style={styles.type}>{typeLabel}</Text>
        <Text style={styles.amount}>{formatMoney(amountValue, transaction.currency as Currency)}</Text>
        <Text style={styles.heroMeta}>{transactionConcept || "Movimiento"}</Text>
      </View>

      {editing ? (
        <View style={styles.form}>
          <Field label="Comercio o concepto" value={title} onChangeText={setTitle} />
          <Field keyboardType="decimal-pad" label="Importe" value={amount} onChangeText={setAmount} />
          <Field label="Nota" value={note} onChangeText={setNote} />
          <PrimaryButton onPress={save}>Guardar cambios</PrimaryButton>
          <Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>Cancelar</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.details}>
            <Detail label="Tipo" value={typeLabel} />
            <CategoryDetail color={category?.color} icon={category?.icon} value={categoryName || "Sin categoría"} />
            <Detail label="Medio de pago" value={account?.name || paymentSourceLabel(account?.type)} />
            <Detail label="Fecha" value={new Date(transaction.date).toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" })} />
            {transactionNote ? <Detail label="Nota" value={transactionNote} /> : null}
            {scheduledPayment && recurrenceLabel ? <Detail label="Se repite" value={recurrenceLabel} /> : null}
            {scheduledPayment ? <Detail label="Próximo vencimiento" value={new Date(`${scheduledPayment.nextChargeDate}T12:00:00`).toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" })} /> : null}
            {scheduledPayment && Number(scheduledPayment.reminderDaysBefore ?? scheduledPayment.reminder_days_before) === 1 ? <Detail label="Recordatorio" value="24 horas antes" /> : null}
            {transaction.installment ? <Detail label="Cuota" value={`${transaction.installment.current} de ${transaction.installment.total}`} /> : null}
            {transaction.receiptUrl || transaction.receipt_url ? <Pressable onPress={() => Linking.openURL(transaction.receiptUrl || transaction.receipt_url || "")}><Detail label="Comprobante" value="Ver comprobante" /></Pressable> : null}
          </View>
          <View style={styles.actions}>
            <PrimaryButton onPress={() => setEditing(true)}>Editar</PrimaryButton>
            <Pressable accessibilityRole="button" onPress={confirmDelete} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </Pressable>
          </View>
        </>
      )}
    </ScreenContainer>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function paymentSourceLabel(type?: string) {
  if (type === "cash") return "Efectivo";
  if (type === "credit") return "Tarjeta de crédito";
  if (type === "bank") return "Cuenta bancaria";
  if (type === "savings") return "Cuenta de ahorro";
  return "Medio de pago";
}

function CategoryDetail({ color, icon, value }: { color?: string; icon?: string; value: string }) {
  const Icon = categoryIcon(icon);
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>Categoría</Text><View style={styles.categoryValue}><Icon color={categoryColor(color)} size={16} /><Text style={styles.detailValueCompact}>{value.charAt(0).toLocaleUpperCase("es-UY") + value.slice(1)}</Text></View></View>;
}

function categoryIcon(name?: string) {
  const icons: Record<string, typeof Circle> = { book: BookOpen, heart: Heart, home: Home, paw: PawPrint, "paw-print": PawPrint, "shopping-bag": ShoppingBag, bag: ShoppingBag, ticket: Ticket, "tram-front": TramFront, bus: TramFront, "bus-front": TramFront, utensils: Utensils, zap: Zap, receipt: Receipt };
  return icons[String(name || "")] || Circle;
}

function categoryColor(value?: string) {
  const palette: Record<string, string> = { lime: colors.lime, blue: colors.blue, orange: colors.orange, purple: colors.lavender, gray: colors.grayMedium, black: colors.white };
  return palette[String(value || "")] || colors.white;
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.grayMedium} style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  amount: {
    ...typography.display,
    color: colors.white,
    fontSize: 46
  },
  categoryValue: {
    alignItems: "center",
    flex: 1.2,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  deleteButton: {
    alignItems: "center",
    borderColor: "#E65C50",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center"
  },
  deleteText: {
    ...typography.body,
    color: "#E65C50",
    fontWeight: "900"
  },
  detailLabel: {
    ...typography.label,
    color: colors.transparentWhite,
    flex: 0.9
  },
  detailRow: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md
  },
  detailValue: {
    ...typography.body,
    color: colors.white,
    flex: 1.2,
    textAlign: "right"
  },
  detailValueCompact: {
    ...typography.body,
    color: colors.white,
    textAlign: "right"
  },
  details: {
    marginTop: spacing.xl
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.xl
  },
  errorPanel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  errorTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 20
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  hero: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  heroMeta: {
    ...typography.body,
    color: colors.transparentWhite
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
  inputLabel: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "800",
    marginBottom: spacing.xs
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
  type: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "900",
    textTransform: "uppercase"
  }
});
