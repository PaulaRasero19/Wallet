import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatMoney } from "../../src/utils/money";
import { cappedGoalProgress, suggestedMonthlySaving } from "../../src/utils/goals";

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addGoalMoney, goals, loadOverview, loading } = useFinFlowStore();
  const goal = goals.find((item) => item.id === id);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Detalle de meta" back />
      {goal ? (
        <View style={styles.panel}>
          <Text style={styles.title}>{goal.name}</Text>
          <Text style={styles.amount}>
            {formatMoney(goal.saved, goal.currency, false)} de {formatMoney(goal.target, goal.currency, false)}
          </Text>
          <Text style={styles.meta}>{cappedGoalProgress(goal.saved, goal.target)}% completado</Text>
          <Text style={styles.body}>Te faltan {formatMoney(Math.max(0, goal.target - goal.saved), goal.currency, false)}.</Text>
          {goal.targetDate || goal.target_date ? <Text style={styles.body}>Fecha objetivo: {new Date(goal.targetDate || goal.target_date || "").toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" })}.</Text> : null}
          {suggestedMonthlySaving(goal) !== null ? <Text style={styles.body}>Ahorro sugerido: {formatMoney(suggestedMonthlySaving(goal) || 0, goal.currency, false)} por mes.</Text> : null}
          <PrimaryButton onPress={() => setAdding(true)}>Agregar dinero</PrimaryButton>
        </View>
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
    color: colors.white,
    fontWeight: "800"
  },
  body: {
    ...typography.body,
    color: colors.transparentWhite
  },
  cancel: { ...typography.body, color: colors.white, fontWeight: "800", textAlign: "center" },
  empty: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.xl
  },
  meta: {
    ...typography.display,
    color: colors.white,
    fontSize: 48
  },
  input: { ...typography.body, backgroundColor: colors.appGrayDark, borderColor: colors.appGrayBorder, borderRadius: 8, borderWidth: 1, color: colors.white, minHeight: 48, paddingHorizontal: spacing.md },
  label: { ...typography.label, color: colors.transparentWhite, fontWeight: "900" },
  modalBackdrop: { backgroundColor: "rgba(0,0,0,0.7)", flex: 1, justifyContent: "center", padding: spacing.xl },
  modalPanel: { backgroundColor: colors.appGrayDark, borderColor: colors.appGrayBorder, borderRadius: 8, borderWidth: 1, gap: spacing.md, padding: spacing.lg },
  panel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  title: {
    ...typography.title,
    color: colors.white
  }
});
