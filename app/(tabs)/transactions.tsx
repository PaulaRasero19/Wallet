import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle as SvgCircle, Path } from "react-native-svg";
import { ArrowDown, ArrowUp, Search } from "lucide-react-native";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";
import { Account, Currency, Transaction, TransactionType } from "../../src/types/finflow";
import { formatMoney } from "../../src/utils/money";
import { resolveMovementCategory } from "../../src/utils/transactionCategoryPresentation";

type MovementPeriod = "day" | "month" | "year";

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
  const target = new Date(date);
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

function periodBounds(reference: Date, period: MovementPeriod, previous = false) {
  if (period === "day") {
    const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate() - (previous ? 1 : 0));
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1) };
  }
  if (period === "year") {
    const year = reference.getFullYear() - (previous ? 1 : 0);
    return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
  }
  const month = reference.getMonth() - (previous ? 1 : 0);
  const start = new Date(reference.getFullYear(), month, 1);
  return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
}

function isInMovementPeriod(value: string, reference: Date, period: MovementPeriod) {
  const { start, end } = periodBounds(reference, period);
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function isInPreviousMovementPeriod(value: string, reference: Date, period: MovementPeriod) {
  const { start, end } = periodBounds(reference, period, true);
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function movementTotals(items: Transaction[]) {
  return items.reduce((totals, transaction) => {
    const amount = positiveAmount(transaction);
    if (transaction.type === "income" || transaction.type === "refund") totals.income += amount;
    else if (transaction.type === "expense") totals.expenses += amount;
    totals.balance = totals.income - totals.expenses;
    return totals;
  }, { balance: 0, expenses: 0, income: 0 });
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : current > 0 ? 100 : -100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export default function Transactions() {
  const { accounts, categories, loadAccounts, loadCategories, loadTransactions, transactions } = useFinFlowStore();
  const { profile } = useSessionStore();
  const [period, setPeriod] = useState<MovementPeriod>("month");
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
  const periodTransactions = useMemo(() => transactions.filter((transaction) => isInMovementPeriod(transaction.date, now, period)), [period, transactions]);
  const previousPeriodTransactions = useMemo(() => transactions.filter((transaction) => isInPreviousMovementPeriod(transaction.date, now, period)), [period, transactions]);
  const periodSummary = movementTotals(periodTransactions);
  const previousSummary = movementTotals(previousPeriodTransactions);
  const performance = percentageChange(periodSummary.balance, previousSummary.balance);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const min = advanced.minAmount ? Number(advanced.minAmount.replace(",", ".")) : null;
    const max = advanced.maxAmount ? Number(advanced.maxAmount.replace(",", ".")) : null;

    return periodTransactions.filter((transaction) => {
      const account = accountById.get(transaction.account_id || transaction.accountId || "");
      const category = categoryById.get(transaction.category_id || transaction.categoryId || "");
      const movementCategory = resolveMovementCategory(transaction, category);
      const amount = positiveAmount(transaction);
      const haystack = [
        transaction.title,
        transaction.merchant,
        transaction.category,
        transaction.note,
        account?.name,
        account?.type,
        transaction.paymentMethod,
        transaction.payment_method,
        movementCategory.label
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      if (normalized && !haystack.includes(normalized)) return false;
      if (advanced.accountId && (transaction.account_id || transaction.accountId) !== advanced.accountId) return false;
      if (advanced.category && !movementCategory.label.toLowerCase().includes(advanced.category.toLowerCase())) return false;
      if (!isWithinDate(transaction.date, advanced.dateFrom, advanced.dateTo)) return false;
      if (advanced.installments && !transaction.installment) return false;
      if (advanced.recurring && !(transaction.isRecurring || transaction.is_recurring)) return false;
      if (advanced.antExpense && !(transaction.isAntExpense || transaction.is_ant_expense)) return false;
      if (min !== null && amount < min) return false;
      if (max !== null && amount > max) return false;
      return true;
    });
  }, [accountById, advanced, categoryById, periodTransactions, query]);

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
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screenContent}>
      <Text style={styles.screenTitle}>Movimientos</Text>
      <View style={styles.periodSelector}>
        {([["day", "Día"], ["month", "Mes"], ["year", "Año"]] as const).map(([value, label]) => <Pressable accessibilityRole="button" key={value} onPress={() => setPeriod(value)} style={[styles.periodOption, period === value && styles.activePeriod]}><Text style={[styles.periodText, period === value && styles.activePeriodText]}>{label}</Text></Pressable>)}
      </View>
      <View style={styles.summary}>
        <View style={styles.summaryRows}>
          <Summary label="Gastos" tone="expense" value={formatMoney(periodSummary.expenses, currency, false)} />
          <Summary label="Ingresos" tone="income" value={formatMoney(periodSummary.income, currency, false)} />
          <Summary label="Balance" tone={periodSummary.balance >= 0 ? "income" : "expense"} value={formatMoney(periodSummary.balance, currency, false)} />
        </View>
      </View>

      <MovementPerformanceChart balance={periodSummary.balance} currency={currency} performance={performance} transactions={periodTransactions} />

      <View style={styles.searchWrap}>
        <TextInput
          autoCapitalize="none"
          onChangeText={setQuery}
          placeholder="Buscar"
          placeholderTextColor={colors.grayMedium}
          style={styles.search}
          value={query}
        />
        <Pressable accessibilityLabel="Abrir filtros" accessibilityRole="button" onPress={() => setAdvancedOpen(true)} style={styles.filterButton}>
          <Search color={colors.white} size={22} />
        </Pressable>
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

function MovementPerformanceChart({ balance, currency, performance, transactions }: { balance: number; currency: Currency; performance: number; transactions: Transaction[] }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(470, screenWidth - 32);
  const height = 215;
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let running = movementTotals(sorted).income;
  const allValues = [running, ...sorted.map((transaction) => {
    const amount = positiveAmount(transaction);
    if (transaction.type === "expense") running -= amount;
    return running;
  })];
  if (allValues.length === 1) allValues.push(0);
  const values = allValues.length <= 5 ? allValues : Array.from({ length: 5 }, (_, index) => allValues[Math.round(index * (allValues.length - 1) / 4)]);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(1, maximum - minimum);
  const left = 20;
  const right = width - 20;
  const top = 68;
  const bottom = height - 56;
  const points = values.map((value, index) => ({
    x: left + (index / Math.max(1, values.length - 1)) * (right - left),
    y: bottom - ((value - minimum) / range) * (bottom - top)
  }));
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const positive = performance >= 0;
  const Trend = positive ? ArrowUp : ArrowDown;

  return (
    <LinearGradient colors={["#210000", "#B81708", "#E84905", "#E0B900"]} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.performanceCard}>
      <View style={styles.performanceHeader}>
        <Text style={styles.performanceLabel}>Rendimiento</Text>
      </View>
      <Text style={styles.performanceBalance}>{formatMoney(balance, currency, false)}</Text>
      <View style={styles.performanceChange}>
        <Trend color={positive ? colors.positive : colors.negative} size={15} strokeWidth={3} />
        <Text style={[styles.performancePercent, positive ? styles.income : styles.expense]}>{Math.abs(performance).toLocaleString("es-UY", { maximumFractionDigits: 1 })} %</Text>
      </View>
      <Svg height={height} style={styles.performanceSvg} width={width}>
        <Path d={path} fill="none" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} />
        {points.map((point, index) => <SvgCircle cx={point.x} cy={point.y} fill="#FFFFFF" key={`${point.x}-${index}`} r={index === points.length - 1 ? 5 : 3.5} />)}
      </Svg>
    </LinearGradient>
  );
}

function Summary({ label, tone, value }: { label: string; tone: "income" | "expense"; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, tone === "income" ? styles.income : styles.expense]}>{value}</Text>
    </View>
  );
}

function TransactionRow({ account, onPress, transaction }: { account?: Account; onPress: () => void; transaction: Transaction }) {
  const title = transaction.merchant || transaction.title || "Movimiento";
  const amount = positiveAmount(transaction);
  const isIncome = transaction.type === "income";
  const isTransfer = transaction.type === "transfer";
  const amountValue = isIncome ? amount : isTransfer ? 0 : -amount;
  const date = new Date(transaction.date).toLocaleDateString("es-UY", { day: "numeric", month: "long" });
  const accountLabel = account?.name || account?.type || "";
  const disabled = !canOpenTransaction(transaction);

  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.transactionRow, disabled && styles.disabledRow]}>
      <View style={[styles.initials, isIncome && styles.incomeInitials]} />
      <View style={styles.rowCopy}>
        <Text numberOfLines={1} style={[styles.rowTitle, isIncome && styles.incomeRowCopy]}>{title}</Text>
        <Text numberOfLines={1} style={[styles.rowMeta, isIncome && styles.incomeRowCopy]}>{date}</Text>
      </View>
      <View style={styles.rowEnd}>
        <Text style={[styles.amount, isIncome ? styles.income : isTransfer ? styles.neutral : styles.expense]}>
          {isTransfer ? formatMoney(amount, transaction.currency, false) : formatMoney(amountValue, transaction.currency, true)}
        </Text>
        {accountLabel ? <Text numberOfLines={1} style={[styles.accountLabel, isIncome && styles.incomeRowCopy]}>{accountLabel}</Text> : null}
      </View>
    </Pressable>
  );
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
  activePeriod: {
    backgroundColor: "#5A5A59"
  },
  activePeriodText: {
    fontWeight: "800"
  },
  amount: {
    ...typography.body,
    fontWeight: "900",
    textAlign: "right"
  },
  accountLabel: {
    ...typography.body,
    color: colors.white,
    marginTop: 2,
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
    marginBottom: 22
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite
  },
  disabledRow: {
    opacity: 0.48
  },
  expense: {
    color: colors.negative
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
    height: 42,
    justifyContent: "center",
    width: 46
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
    marginBottom: 10,
    textTransform: "uppercase"
  },
  income: {
    color: colors.positive
  },
  incomeInitials: {
    backgroundColor: "#979797"
  },
  incomeRowCopy: {
    color: "#979797"
  },
  initials: {
    alignItems: "center",
    backgroundColor: "#D8D8D8",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56
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
    marginTop: 27,
    paddingHorizontal: 6
  },
  modalScrim: {
    backgroundColor: "rgba(0,0,0,0.34)",
    flex: 1
  },
  performanceBalance: {
    ...typography.body,
    color: "rgba(255,255,255,0.82)",
    bottom: 13,
    fontWeight: "700",
    left: 20,
    position: "absolute",
    zIndex: 2
  },
  performanceCard: {
    borderRadius: 24,
    height: 215,
    marginTop: 25,
    overflow: "hidden",
    position: "relative"
  },
  performanceChange: {
    alignItems: "center",
    flexDirection: "row",
    bottom: 13,
    gap: 3,
    position: "absolute",
    right: 18,
    zIndex: 2
  },
  performanceHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    left: 20,
    position: "absolute",
    right: 20,
    top: 17,
    zIndex: 2
  },
  performanceLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  performancePercent: {
    ...typography.body,
    fontWeight: "900"
  },
  performanceSvg: {
    bottom: 0,
    left: 0,
    position: "absolute"
  },
  periodOption: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    height: 44,
    justifyContent: "center",
    margin: 4
  },
  periodSelector: {
    borderColor: "rgba(255,255,255,0.28)",
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 32,
    minHeight: 54,
    overflow: "hidden"
  },
  periodText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  neutral: {
    color: colors.transparentWhite
  },
  rowCopy: {
    flex: 1,
    minWidth: 0
  },
  rowEnd: {
    alignItems: "flex-end",
    maxWidth: "44%",
    minWidth: 112
  },
  rowMeta: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: 1
  },
  rowTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800",
  },
  search: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    minHeight: 44
  },
  searchWrap: {
    alignItems: "center",
    backgroundColor: "#5A5A59",
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: 36,
    minHeight: 54,
    paddingLeft: 16,
    paddingRight: 6
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 20
  },
  screenTitle: {
    ...typography.title,
    color: colors.white
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
    marginTop: 18
  },
  summaryItem: {
    flex: 1
  },
  summaryLabel: {
    ...typography.label,
    color: colors.transparentWhite
  },
  summaryRows: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  summaryValue: {
    ...typography.body,
    fontWeight: "900"
  },
  transactionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
    minHeight: 84,
    paddingVertical: 9
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
