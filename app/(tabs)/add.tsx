import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeftRight, Brain, Camera, CreditCard, Minus, Plus } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { InputField } from "../../src/components/InputField";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { useSessionStore } from "../../src/store/useSessionStore";
import { colors, spacing, typography } from "../../src/theme";
import { Currency } from "../../src/types/finflow";
import { formatMoney } from "../../src/utils/money";

const currencies: Currency[] = ["UYU", "USD", "EUR"];
const accountTypes = ["cash", "bank", "savings", "wallet", "credit", "other"];
type ActionMode = "menu" | "movement" | "account" | "installment" | "ai" | "transfer" | "scan";

export default function Add() {
  const params = useLocalSearchParams<{ type?: "income" | "expense"; mode?: string }>();
  const profile = useSessionStore((state) => state.profile);
  const { accounts, categories, createAccount, createTransaction, loadAccounts, loadCategories, loading } = useFinFlowStore();
  const [mode, setMode] = useState<ActionMode>(
    params.mode === "account" || params.mode === "installment" || params.mode === "ai" || params.mode === "transfer" || params.mode === "scan"
      ? params.mode
      : params.type
        ? "movement"
        : "menu"
  );
  const [type, setType] = useState<"income" | "expense">(params.type === "income" ? "income" : "expense");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [accountName, setAccountName] = useState("Cuenta principal");
  const [accountType, setAccountType] = useState("cash");
  const [currency, setCurrency] = useState<Currency>(profile?.primary_currency || "UYU");
  const [aiText, setAiText] = useState("");
  const [proposal, setProposal] = useState<null | { title: string; amount: number; type: "income" | "expense"; categoryId: string; accountId: string }>(null);

  const filteredCategories = useMemo(() => categories.filter((category) => category.type === type), [categories, type]);

  useEffect(() => {
    void loadAccounts();
    void loadCategories();
  }, [loadAccounts, loadCategories]);

  useEffect(() => {
    if (!accountId && accounts[0]) setAccountId(accounts[0].id);
  }, [accountId, accounts]);

  useEffect(() => {
    if (!categoryId && filteredCategories[0]) setCategoryId(filteredCategories[0].id);
  }, [categoryId, filteredCategories]);

  function startMovement(nextType: "income" | "expense") {
    setType(nextType);
    setMode("movement");
  }

  async function submitAccount() {
    try {
      const account = await createAccount({ name: accountName.trim(), type: accountType, currency, initialBalance: Number(amount.replace(",", ".") || 0) });
      setAccountId(account.id);
      setMode("menu");
      setAmount("");
      Alert.alert("FinFlow", "Cuenta creada.");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo crear la cuenta.");
    }
  }

  async function submitTransaction() {
    if (!accountId || !categoryId) {
      Alert.alert("FinFlow", "Necesitás seleccionar cuenta y categoría.");
      return;
    }
    try {
      await createTransaction({
        accountId,
        categoryId,
        type,
        title: title.trim() || (type === "income" ? "Ingreso" : "Gasto"),
        merchant: title.trim(),
        amount: Number(amount.replace(",", ".")),
        currency: accounts.find((account) => account.id === accountId)?.currency || currency,
        date: new Date().toISOString(),
        note: note.trim()
      });
      router.replace("/(tabs)/overview");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar el movimiento.");
    }
  }

  function interpretWithAi() {
    const value = Number((aiText.match(/(\d+[\.,]?\d*)/)?.[1] || "0").replace(",", "."));
    const lower = aiText.toLowerCase();
    const inferredType = lower.includes("cobré") || lower.includes("cobre") || lower.includes("ingreso") || lower.includes("sueldo") ? "income" : "expense";
    const category = categories.find((item) => item.type === inferredType && lower.includes(item.name.toLowerCase())) || categories.find((item) => item.type === inferredType);
    const account = accounts.find((item) => lower.includes(item.name.toLowerCase())) || accounts[0];
    if (!value || !category || !account) {
      Alert.alert("FinFlow", "No pude armar una propuesta. Probá: gasté 450 en café con efectivo.");
      return;
    }
    setProposal({ title: aiText.trim(), amount: value, type: inferredType, categoryId: category.id, accountId: account.id });
  }

  async function confirmProposal() {
    if (!proposal) return;
    await createTransaction({
      accountId: proposal.accountId,
      categoryId: proposal.categoryId,
      type: proposal.type,
      title: proposal.title,
      merchant: proposal.title,
      amount: proposal.amount,
      currency: accounts.find((account) => account.id === proposal.accountId)?.currency || "UYU",
      date: new Date().toISOString(),
      note: "Registrado con IA local y confirmado por la usuaria."
    });
    router.replace("/(tabs)/overview");
  }

  return (
    <ScreenContainer>
      <Header title="Agregar" />
      {mode === "menu" ? (
        <View style={styles.actions}>
          <Action icon={<Minus color={colors.white} size={22} />} title="Gasto" body="Registrar una salida" onPress={() => startMovement("expense")} />
          <Action icon={<Plus color={colors.white} size={22} />} title="Ingreso" body="Actualizar saldo" onPress={() => startMovement("income")} />
          <Action icon={<ArrowLeftRight color={colors.white} size={22} />} title="Transferencia" body="Mover entre cuentas" onPress={() => setMode("transfer")} />
          <Action icon={<CreditCard color={colors.white} size={22} />} title="Compra en cuotas" body="Registrar compromiso" onPress={() => setMode("installment")} />
          <Action icon={<Camera color={colors.white} size={22} />} title="Escanear" body="Preparar comprobante" onPress={() => setMode("scan")} />
          <Action icon={<Brain color={colors.white} size={22} />} title="Registrar con IA" body="Escribí en lenguaje natural" onPress={() => setMode("ai")} />
        </View>
      ) : null}

      {mode === "account" ? (
        <View style={styles.form}>
          <InputField placeholder="Nombre de cuenta" value={accountName} onChangeText={setAccountName} />
          <View style={styles.wrap}>{accountTypes.map((item) => <Chip key={item} active={accountType === item} label={item} onPress={() => setAccountType(item)} />)}</View>
          <View style={styles.wrap}>{currencies.map((item) => <Chip key={item} active={currency === item} label={item} onPress={() => setCurrency(item)} />)}</View>
          <InputField keyboardType="decimal-pad" placeholder="Saldo inicial" value={amount} onChangeText={setAmount} />
          <PrimaryButton onPress={submitAccount}>{loading ? "Cargando..." : "Guardar cuenta"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "movement" || mode === "installment" ? (
        <View style={styles.form}>
          <View style={styles.segment}>
            <Chip active={type === "income"} label="Ingreso" onPress={() => setType("income")} />
            <Chip active={type === "expense"} label="Gasto" onPress={() => setType("expense")} />
          </View>
          <Text style={styles.label}>Cuenta</Text>
          <View style={styles.wrap}>{accounts.map((account) => <Chip key={account.id} active={accountId === account.id} label={account.name} onPress={() => setAccountId(account.id)} />)}</View>
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.wrap}>{filteredCategories.map((category) => <Chip key={category.id} active={categoryId === category.id} label={category.name} onPress={() => setCategoryId(category.id)} />)}</View>
          <InputField placeholder={mode === "installment" ? "Compra en cuotas" : "Comercio o descripción"} value={title} onChangeText={setTitle} />
          <InputField keyboardType="decimal-pad" placeholder="Importe" value={amount} onChangeText={setAmount} />
          <InputField placeholder={mode === "installment" ? "Ej: 3/12, vence el 10" : "Nota"} value={note} onChangeText={setNote} />
          <PrimaryButton onPress={submitTransaction}>{loading ? "Cargando..." : "Guardar y volver"}</PrimaryButton>
        </View>
      ) : null}

      {mode === "ai" ? (
        <View style={styles.form}>
          <Text style={styles.lead}>Escribí algo concreto. FinFlow arma una propuesta, pero no guarda nada hasta que confirmes.</Text>
          <InputField placeholder="Ej: gasté 450 en café con efectivo" value={aiText} onChangeText={setAiText} />
          <PrimaryButton onPress={interpretWithAi}>Interpretar</PrimaryButton>
          {proposal ? (
            <View style={styles.proposal}>
              <Text style={styles.proposalTitle}>Propuesta</Text>
              <Text style={styles.proposalLine}>{proposal.type === "income" ? "Ingreso" : "Gasto"} · {formatMoney(proposal.amount, "UYU", false)}</Text>
              <Text style={styles.proposalLine}>{proposal.title}</Text>
              <PrimaryButton onPress={confirmProposal}>Confirmar y guardar</PrimaryButton>
            </View>
          ) : null}
        </View>
      ) : null}

      {mode === "transfer" || mode === "scan" ? (
        <View style={styles.form}>
          <Text style={styles.lead}>
            {mode === "transfer"
              ? "Transferencias queda preparada como acceso rápido. Para no inventar movimientos entre cuentas, la vamos a conectar al CRUD completo en el próximo bloque."
              : "Escaneo queda preparado como acceso rápido. Hoy podés registrar el movimiento con IA o manualmente sin guardar datos falsos."}
          </Text>
          <PrimaryButton onPress={() => setMode(mode === "transfer" ? "movement" : "ai")}>
            {mode === "transfer" ? "Registrar manualmente" : "Registrar con IA"}
          </PrimaryButton>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function Action({ body, icon, onPress, title }: { body: string; icon: React.ReactNode; onPress: () => void; title: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.action}>
      {icon}
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionBody}>{body}</Text>
    </Pressable>
  );
}

function Chip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.chipText, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  action: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 132,
    padding: spacing.md,
    width: "48%"
  },
  actionTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  actionBody: {
    ...typography.label,
    color: colors.transparentWhite
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  lead: {
    ...typography.body,
    color: colors.transparentWhite
  },
  segment: {
    flexDirection: "row",
    gap: spacing.sm
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "700"
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    backgroundColor: colors.appGrayDark,
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
    fontWeight: "700"
  },
  active: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  activeText: {
    color: colors.black
  },
  proposal: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  proposalTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "700"
  },
  proposalLine: {
    ...typography.body,
    color: colors.transparentWhite
  }
});
