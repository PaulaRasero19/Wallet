import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { BookOpen, Circle, Filter, Heart, Home, PawPrint, Search, ShoppingBag, Ticket, TramFront, Utensils, Zap } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";
import { Account, Category, Transaction, TransactionType } from "../../src/types/finflow";
import { calculateMovementSummary } from "../../src/utils/movementSummary";
import { formatMoney } from "../../src/utils/money";

const mainFilters = ["Todos", "Gastos", "Ingresos", "Transferencias"] as const;
type MainFilter = (typeof mainFilters)[number];

type AdvancedFilters = {
  accountId: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  installments: boolean;
  recurring: boolean;
  antExpense: boolean;
  minAmount: string;
  maxAmount: string;
};

const initialAdvanced: AdvancedFilters = {
  accountId: "",
  antExpense: false,
  category: "",
  dateFrom: "",
  dateTo: "",
  installments: false,
  maxAmount: "",
  minAmount: "",
  recurring: false
};

function positiveAmount(transaction: Transaction) {
  return Math.abs(Number(transaction.rawAmount ?? transaction.raw_amount ?? transaction.amount ?? 0));
}

function transactionTypeLabel(type: TransactionType) {
  if (type === "income") return "Ingreso";
  if (type === "refund") return "Reintegro";
  if (type === "goal_contribution") return "Aporte a meta";
  if (type === "internal_transfer") return "Transferencia";
  if (type === "transfer") return "Transferencia";
  return "Gasto";
}

function initials(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function groupLabel(date: string) {
  const today = new Date();
  const target = new Date(date);
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.round((startToday.getTime() - startTarget.getTime()) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays >= 0 && diffDays <= 7) return "Esta semana";
  return target.toLocaleDateString("es-UY", { month: "long", year: "numeric" });
}

function isWithinDate(value: string, from: string, to: string) {
  const time = new Date(value).getTime();
  if (from && time < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && time > new Date(`${to}T23:59:59`).getTime()) return false;
  return true;
}

function transactionId(transaction: Transaction) {
  return String(transaction.id || transaction._id || "");
}

function canOpenTransaction(transaction: Transaction) {
  return Boolean(transactionId(transaction));
}

export default function Transactions() {
  const { accounts, categories, loadAccounts, loadCategories, loadTransactions, transactions } = useFinFlowStore();
  const { authUser, profile } = useSessionStore();
  const [filter, setFilter] = useState<MainFilter>("Todos");
  const [query, setQuery] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advanced, setAdvanced] = useState<AdvancedFilters>(initialAdvanced);

  useEffect(() => {
    void loadAccounts();
    void loadCategories();
    void loadTransactions();
  }, [loadAccounts, loadCategories, loadTransactions]);

  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const now = new Date();
  const currency = profile?.primary_currency || "UYU";
  const monthSummary = calculateMovementSummary({
    selectedMonth: now,
    transactions,
    userId: authUser?.id
  });
  const monthlyExpenses = monthSummary.netExpenses;
  const monthlyIncome = monthSummary.actualIncome;
  const monthlyBalance = monthSummary.balance;

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const min = advanced.minAmount ? Number(advanced.minAmount.replace(",", ".")) : null;
    const max = advanced.maxAmount ? Number(advanced.maxAmount.replace(",", ".")) : null;

    return transactions.filter((transaction) => {
      const account = accountById.get(transaction.account_id || transaction.accountId || "");
      const amount = positiveAmount(transaction);
      const haystack = [
        transaction.title,
        transaction.merchant,
        transaction.category,
        transaction.note,
        account?.name,
        account?.type,
        transaction.paymentMethod,
        transaction.payment_method
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      if (normalized && !haystack.includes(normalized)) return false;
      if (filter === "Gastos" && transaction.type !== "expense") return false;
      if (filter === "Ingresos" && transaction.type !== "income") return false;
      if (filter === "Transferencias" && transaction.type !== "transfer") return false;
      if (advanced.accountId && (transaction.account_id || transaction.accountId) !== advanced.accountId) return false;
      if (advanced.category && !String(transaction.category || "").toLowerCase().includes(advanced.category.toLowerCase())) return false;
      if (!isWithinDate(transaction.date, advanced.dateFrom, advanced.dateTo)) return false;
      if (advanced.installments && !transaction.installment) return false;
      if (advanced.recurring && !(transaction.isRecurring || transaction.is_recurring)) return false;
      if (advanced.antExpense && !(transaction.isAntExpense || transaction.is_ant_expense)) return false;
      if (min !== null && amount < min) return false;
      if (max !== null && amount > max) return false;
      return true;
    });
  }, [accountById, advanced, filter, query, transactions]);

  const grouped = useMemo(() => {
    const groups: Array<{ title: string; data: Transaction[] }> = [];
    visible.forEach((transaction) => {
      const label = groupLabel(transaction.date);
      const existing = groups.find((group) => group.title === label);
      if (existing) existing.data.push(transaction);
      else groups.push({ title: label, data: [transaction] });
    });
    return groups;
  }, [visible]);

  return (
    <ScreenContainer>
      <Header title="Movimientos" />
      <View style={styles.summary}>
        <Text style={styles.month}>{now.toLocaleDateString("es-UY", { month: "long", year: "numeric" })}</Text>
        <View style={styles.summaryRows}>
          <Summary label="Gastos" tone="expense" value={formatMoney(monthlyExpenses, currency, false)} />
          <Summary label="Ingresos" tone="income" value={formatMoney(monthlyIncome, currency, false)} />
          <Summary label="Balance" tone={monthlyBalance >= 0 ? "income" : "expense"} value={formatMoney(monthlyBalance, currency, true)} />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Search color={colors.transparentWhite} size={18} />
        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Buscar comercio, categoría o nota"
          placeholderTextColor={colors.grayMedium}
          style={styles.search}
          value={query}
        />
        <Pressable accessibilityRole="button" onPress={() => setAdvancedOpen(true)} style={styles.filterButton}>
          <Filter color={colors.white} size={18} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        {mainFilters.map((item) => (
          <Pressable accessibilityRole="button" key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.activeFilter]}>
            <Text style={[styles.filterText, filter === item && styles.activeFilterText]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        <Text style={styles.count}>{visible.length} movimientos</Text>
        {grouped.length ? (
          grouped.map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              {group.data.map((transaction) => (
                <TransactionRow
                  account={accountById.get(transaction.account_id || transaction.accountId || "")}
                  category={categoryById.get(transaction.category_id || transaction.categoryId || "")}
                  key={transaction.id}
                  onPress={() => {
                    const id = transactionId(transaction);
                    if (id) router.push({ pathname: "/transaction/[id]", params: { id } });
                  }}
                  transaction={transaction}
                />
              ))}
            </View>
          ))
        ) : (
          <Text style={styles.empty}>No hay movimientos para estos filtros.</Text>
        )}
      </View>

      <AdvancedSheet
        accounts={accounts}
        filters={advanced}
        onChange={setAdvanced}
        onClear={() => setAdvanced(initialAdvanced)}
        onClose={() => setAdvancedOpen(false)}
        visible={advancedOpen}
      />
    </ScreenContainer>
  );
}

function Summary({ label, tone, value }: { label: string; tone: "income" | "expense"; value: string }) {
  return (
    <View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, tone === "income" ? styles.income : styles.expense]}>{value}</Text>
    </View>
  );
}

function TransactionRow({ account, category, onPress, transaction }: { account?: Account; category?: Category; onPress: () => void; transaction: Transaction }) {
  const title = transaction.merchant || transaction.title || "Movimiento";
  const amount = positiveAmount(transaction);
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const amountValue = isIncome ? amount : isTransfer ? 0 : -amount;
  const date = new Date(transaction.date).toLocaleDateString("es-UY", { day: "2-digit", month: "short" });
  const meta = [String(transaction.category || transactionTypeLabel(transaction.type)), date, account?.name || account?.type].filter(Boolean).join(" · ");
  const disabled = !canOpenTransaction(transaction);
  const CategoryIcon = categoryIcon(category?.icon);

  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.transactionRow, disabled && styles.disabledRow]}>
      <View style={styles.initials}>
        <CategoryIcon color={categoryColor(category?.color)} size={19} />
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
        <Text numberOfLines={1} style={styles.rowMeta}>{meta}</Text>
      </View>
      <Text style={[styles.amount, isIncome ? styles.income : isTransfer ? styles.neutral : styles.expense]}>
        {isTransfer ? formatMoney(amount, transaction.currency, false) : formatMoney(amountValue, transaction.currency, true)}
      </Text>
    </Pressable>
  );
}

function categoryIcon(name?: string) {
  const icons: Record<string, typeof Circle> = { book: BookOpen, heart: Heart, home: Home, paw: PawPrint, "paw-print": PawPrint, "shopping-bag": ShoppingBag, bag: ShoppingBag, ticket: Ticket, "tram-front": TramFront, bus: TramFront, "bus-front": TramFront, utensils: Utensils, zap: Zap };
  return icons[String(name || "")] || Circle;
}

function categoryColor(value?: string) {
  const palette: Record<string, string> = { lime: colors.lime, blue: colors.blue, orange: colors.orange, purple: colors.lavender, gray: colors.grayMedium, black: colors.white };
  return palette[String(value || "")] || colors.white;
}

function AdvancedSheet({
  accounts,
  filters,
  onChange,
  onClear,
  onClose,
  visible
}: {
  accounts: Account[];
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onClear: () => void;
  onClose: () => void;
  visible: boolean;
}) {
  function patch(next: Partial<AdvancedFilters>) {
    onChange({ ...filters, ...next });
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.modalScrim} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Filtros avanzados</Text>
        <Text style={styles.label}>Cuenta</Text>
        <View style={styles.wrap}>
          <Chip active={!filters.accountId} label="Todas" onPress={() => patch({ accountId: "" })} />
          {accounts.map((account) => (
            <Chip active={filters.accountId === account.id} key={account.id} label={account.name} onPress={() => patch({ accountId: account.id })} />
          ))}
        </View>
        <Text style={styles.label}>Fecha</Text>
        <View style={styles.twoColumns}>
          <Input label="Desde" onChangeText={(value) => patch({ dateFrom: value })} placeholder="YYYY-MM-DD" value={filters.dateFrom} />
          <Input label="Hasta" onChangeText={(value) => patch({ dateTo: value })} placeholder="YYYY-MM-DD" value={filters.dateTo} />
        </View>
        <Text style={styles.label}>Importe</Text>
        <View style={styles.twoColumns}>
          <Input keyboardType="decimal-pad" label="Mínimo" onChangeText={(value) => patch({ minAmount: value })} value={filters.minAmount} />
          <Input keyboardType="decimal-pad" label="Máximo" onChangeText={(value) => patch({ maxAmount: value })} value={filters.maxAmount} />
        </View>
        <Input label="Categoría" onChangeText={(value) => patch({ category: value })} placeholder="Comida, transporte..." value={filters.category} />
        <View style={styles.wrap}>
          <Chip active={filters.installments} label="Cuotas" onPress={() => patch({ installments: !filters.installments })} />
          <Chip active={filters.recurring} label="Recurrentes" onPress={() => patch({ recurring: !filters.recurring })} />
          <Chip active={filters.antExpense} label="Gastos hormiga" onPress={() => patch({ antExpense: !filters.antExpense })} />
        </View>
        <View style={styles.sheetActions}>
          <Pressable accessibilityRole="button" onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearText}>Limpiar</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.applyButton}>
            <Text style={styles.applyText}>Aplicar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.activeFilter]}>
      <Text style={[styles.filterText, active && styles.activeFilterText]}>{label}</Text>
    </Pressable>
  );
}

function Input({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.grayMedium} style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  activeFilter: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  activeFilterText: {
    color: colors.black
  },
  amount: {
    ...typography.label,
    fontSize: 13,
    fontWeight: "900",
    minWidth: 92,
    textAlign: "right"
  },
  applyButton: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    flex: 1,
    minHeight: 46,
    justifyContent: "center"
  },
  applyText: {
    ...typography.body,
    color: colors.black,
    fontWeight: "900"
  },
  chip: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  clearButton: {
    alignItems: "center",
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    minHeight: 46,
    justifyContent: "center"
  },
  clearText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  count: {
    ...typography.label,
    color: colors.transparentWhite,
    marginBottom: spacing.md
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite
  },
  disabledRow: {
    opacity: 0.48
  },
  expense: {
    color: "#E65C50"
  },
  filter: {
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderRadius: 8,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  filterText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "800"
  },
  group: {
    marginTop: spacing.lg
  },
  groupTitle: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "900",
    marginBottom: spacing.xs,
    textTransform: "uppercase"
  },
  income: {
    color: "#66C86D"
  },
  initials: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  initialsText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "900"
  },
  input: {
    ...typography.body,
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.white,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  inputLabel: {
    ...typography.label,
    color: colors.transparentWhite,
    marginBottom: spacing.xs
  },
  inputWrap: {
    flex: 1,
    minWidth: 0
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "900",
    marginTop: spacing.md
  },
  list: {
    marginTop: spacing.lg
  },
  modalScrim: {
    backgroundColor: "rgba(0,0,0,0.34)",
    flex: 1
  },
  month: {
    ...typography.title,
    color: colors.white,
    fontSize: 20,
    textTransform: "capitalize"
  },
  neutral: {
    color: colors.transparentWhite
  },
  rowCopy: {
    flex: 1,
    minWidth: 0
  },
  rowMeta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: 2
  },
  rowTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  search: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    minHeight: 44
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
    minHeight: 50,
    paddingLeft: spacing.md,
    paddingRight: 5
  },
  sheet: {
    backgroundColor: colors.appGray,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: spacing.sm,
    maxHeight: "84%",
    padding: spacing.lg,
    paddingBottom: 36
  },
  sheetActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  sheetTitle: {
    ...typography.title,
    color: colors.white,
    fontSize: 22
  },
  summary: {
    marginTop: spacing.lg
  },
  summaryLabel: {
    ...typography.label,
    color: colors.transparentWhite
  },
  summaryRows: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.sm
  },
  summaryValue: {
    ...typography.body,
    fontWeight: "900"
  },
  transactionRow: {
    alignItems: "center",
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 66,
    paddingVertical: spacing.sm
  },
  twoColumns: {
    flexDirection: "row",
    gap: spacing.sm
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  }
});
