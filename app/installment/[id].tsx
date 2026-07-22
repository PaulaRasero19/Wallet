import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Header } from "../../src/components/Header";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatMoney } from "../../src/utils/money";

export default function InstallmentDetail() {
  const { id, installmentId } = useLocalSearchParams<{ id: string; installmentId?: string }>();
  const { installmentPurchases, loadOverview, markInstallmentPaid } = useFinFlowStore();
  const purchase = installmentPurchases.find((item) => item.id === id);
  const selected = purchase?.installments.find((item) => item.id === installmentId) || purchase?.installments.find((item) => item.status === "pending");

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Compra en cuotas" back />
      {purchase ? (
        <View style={styles.panel}>
          <Text style={styles.title}>{purchase.name}</Text>
          <Row label="Tarjeta" value={purchase.cardName || purchase.card_name || "Tarjeta de crédito"} />
          <Row label="Monto total" value={formatMoney(purchase.totalAmount || purchase.total_amount || 0, purchase.currency, false)} />
          <Row label="Categoría" value={purchase.category} />
          {selected ? <>
            <Row label="Cuota" value={`${selected.number} de ${purchase.totalInstallments || purchase.total_installments}`} />
            <Row label="Importe" value={formatMoney(selected.amount, purchase.currency, false)} />
            <Row label="Vencimiento" value={new Date(selected.dueDate || selected.due_date || "").toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" })} />
            <Row label="Estado" value={selected.status === "paid" ? "Pagada" : "Pendiente"} />
            {selected.status === "pending" ? <View style={styles.action}><PrimaryButton onPress={() => void markInstallmentPaid(purchase.id, selected.id)}>Marcar como pagada</PrimaryButton></View> : null}
          </> : null}
          {purchase.note ? <Row label="Nota" value={purchase.note} /> : null}
        </View>
      ) : <Text style={styles.empty}>No encontré esta compra en cuotas.</Text>}
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  action: { marginTop: spacing.lg },
  empty: { ...typography.body, color: colors.transparentWhite, marginTop: spacing.xl },
  label: { ...typography.label, color: colors.transparentWhite },
  panel: { backgroundColor: colors.appGrayDark, borderColor: colors.appGrayBorder, borderRadius: 8, borderWidth: 1, marginTop: spacing.xl, padding: spacing.lg },
  row: { borderBottomColor: colors.appGrayBorder, borderBottomWidth: 1, flexDirection: "row", gap: spacing.md, justifyContent: "space-between", paddingVertical: spacing.md },
  title: { ...typography.title, color: colors.white, marginBottom: spacing.sm },
  value: { ...typography.body, color: colors.white, flex: 1, fontWeight: "800", textAlign: "right" }
});
