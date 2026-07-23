import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Pencil, Trash2 } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { AmountLavaBackground } from "../../src/components/forms/AmountLavaBackground";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatCompactMoney, formatMoney } from "../../src/utils/money";
import { cappedGoalProgress } from "../../src/utils/goals";

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addGoalMoney, deleteGoal, goals, loadOverview, loading, updateGoal } = useFinFlowStore();
  const goal = goals.find((item) => item.id === id);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const progress = goal ? cappedGoalProgress(goal.saved, goal.target) : 0;

  const startEditing = () => {
    if (!goal) return;
    setEditName(goal.name);
    setEditTarget(String(goal.target));
    setEditing(true);
  };

  const finishEditing = async () => {
    const target = Number(editTarget.replace(/\./g, "").replace(",", "."));
    if (!editName.trim() || target <= 0) {
      Alert.alert("FinFlow", "Completá el nombre y un monto objetivo mayor a cero.");
      return;
    }
    try {
      await updateGoal(id, { name: editName.trim(), target });
      setEditing(false);
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo editar la meta.");
    }
  };

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screen}>
      <Header title="Detalle de meta" back />
      {goal ? (
        <>
          <View style={styles.hero}>
            <AmountLavaBackground />
            <View style={styles.heroCopy}>
              {editing
                ? <TextInput autoFocus onChangeText={setEditName} selectionColor="#FFFFFF" style={[styles.heroLabel, styles.inlineNameInput]} value={editName} />
                : <Text style={styles.heroLabel}>{goal.name}</Text>}
              {editing
                ? <View style={styles.inlineAmountRow}>
                    <Text style={styles.inlineCurrency}>{goal.currency === "USD" ? "US$" : goal.currency === "EUR" ? "€" : "$U"}</Text>
                    <TextInput keyboardType="decimal-pad" onChangeText={(value) => setEditTarget(value.replace(/[^\d,.]/g, ""))} selectionColor="#FFFFFF" style={[styles.heroAmount, styles.inlineAmountInput]} value={editTarget} />
                  </View>
                : <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.heroAmount}>{formatCompactMoney(goal.target, goal.currency, false)}</Text>}
            </View>
          </View>

          <View style={styles.details}>
            <Text style={styles.amount}>
            {formatMoney(goal.saved, goal.currency, false)} de {formatMoney(goal.target, goal.currency, false)}
            </Text>
            <Text style={styles.progress}>{progress}% completada la meta</Text>

            <View style={styles.iconActions}>
              <Pressable accessibilityLabel={editing ? "Guardar cambios" : "Editar meta"} accessibilityRole="button" disabled={loading} onPress={() => editing ? void finishEditing() : startEditing()} style={styles.iconButton}>
                {editing
                  ? <Check color="#1C1C1B" size={20} strokeWidth={2.4} />
                  : <Pencil color="#1C1C1B" fill="#1C1C1B" size={18} strokeWidth={2} />}
              </Pressable>
              <Pressable accessibilityLabel="Eliminar meta" accessibilityRole="button" disabled={loading} onPress={() => void (async () => { await deleteGoal(goal.id); router.back(); })()} style={styles.iconButton}>
                <Trash2 color="#1C1C1B" size={19} strokeWidth={2} />
              </Pressable>
            </View>
          </View>

          {progress >= 100
            ? <View style={styles.finalButton}><Text style={styles.finalButtonText}>Meta finalizada</Text></View>
            : <PrimaryButton onPress={() => setAdding(true)} style={styles.mainButton}>Agregar dinero</PrimaryButton>}
        </>
      ) : (
        <Text style={styles.empty}>No encontré esta meta para tu usuario.</Text>
      )}
      <Modal animationType="fade" onRequestClose={() => setAdding(false)} transparent visible={adding}>
        <View style={styles.modalBackdrop}><View style={styles.modalPanel}>
          <Text style={styles.title}>Agregar dinero</Text>
          <Text style={styles.label}>Monto *</Text>
          <TextInput keyboardType="decimal-pad" onChangeText={(value) => setAmount(value.replace(/[^\d,.]/g, ""))} placeholder={goal?.currency === "USD" ? "US$ 0,00" : goal?.currency === "EUR" ? "€ 0,00" : "$U 0,00"} placeholderTextColor={colors.transparentWhite} style={styles.input} value={amount} />
          <PrimaryButton disabled={loading || Number(amount.replace(/\./g, "").replace(",", ".")) <= 0} onPress={() => void (async () => { try { await addGoalMoney(id, Number(amount.replace(/\./g, "").replace(",", "."))); setAmount(""); setAdding(false); } catch (error) { Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo agregar el dinero."); } })()}>Guardar</PrimaryButton>
          <Pressable onPress={() => setAdding(false)}><Text style={styles.cancel}>Cancelar</Text></Pressable>
        </View></View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  amount: {
    ...typography.body,
    color: "rgba(255,255,255,0.82)",
    fontWeight: "800",
  },
  cancel: { ...typography.body, color: colors.white, fontWeight: "800", textAlign: "center" },
  details: { marginTop: 42 },
  empty: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.xl
  },
  finalButton: { alignItems: "center", backgroundColor: "#C7C7C7", borderRadius: 999, justifyContent: "center", marginTop: 42, minHeight: 56 },
  finalButtonText: { ...typography.button, color: "#252525", fontWeight: "800" },
  hero: { borderRadius: 28, height: 162, marginHorizontal: 2, marginTop: 44, overflow: "hidden" },
  heroAmount: { color: colors.white, fontSize: 52, fontWeight: "600", letterSpacing: -1, lineHeight: 59 },
  heroCopy: { alignSelf: "center", justifyContent: "center", maxWidth: "84%", minWidth: "76%", height: "100%" },
  heroLabel: { ...typography.body, color: "rgba(255,255,255,0.78)" },
  iconActions: { flexDirection: "row", gap: 6, marginTop: 22 },
  iconButton: { alignItems: "center", backgroundColor: "#C7C7C7", borderRadius: 10, height: 40, justifyContent: "center", width: 40 },
  inlineAmountInput: { flex: 1, margin: 0, padding: 0 },
  inlineAmountRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  inlineCurrency: { color: colors.white, fontSize: 40, fontWeight: "600", lineHeight: 52 },
  inlineNameInput: { borderBottomColor: "rgba(255,255,255,0.62)", borderBottomWidth: 1, margin: 0, paddingHorizontal: 0, paddingVertical: 2 },
  input: { ...typography.body, backgroundColor: colors.appGrayDark, borderColor: colors.appGrayBorder, borderRadius: 8, borderWidth: 1, color: colors.white, minHeight: 48, paddingHorizontal: spacing.md },
  label: { ...typography.label, color: colors.transparentWhite, fontWeight: "900" },
  mainButton: { marginTop: 42, minHeight: 56 },
  modalBackdrop: { backgroundColor: "rgba(0,0,0,0.7)", flex: 1, justifyContent: "center", padding: spacing.xl },
  modalPanel: { backgroundColor: colors.appGrayDark, borderColor: colors.appGrayBorder, borderRadius: 8, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  progress: { ...typography.body, color: "rgba(255,255,255,0.78)", marginTop: 3 },
  screen: { paddingHorizontal: 22, paddingTop: 24 },
  title: {
    ...typography.title,
    color: colors.white
  }
});
