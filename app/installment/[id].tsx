import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { AmountLavaBackground } from "../../src/components/forms/AmountLavaBackground";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatCompactMoney, formatMoney } from "../../src/utils/money";

function capitalized(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase("es-UY") + value.slice(1) : value;
}

export default function InstallmentDetail() {
  const { id, installmentId } = useLocalSearchParams<{ id: string; installmentId?: string }>();
  const { installmentPurchases, loadOverview, markInstallmentPaid } = useFinFlowStore();
  const purchase = installmentPurchases.find((item) => item.id === id);
  const selected = purchase?.installments.find((item) => item.id === installmentId) || purchase?.installments.find((item) => item.status === "pending");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [loadingDots, setLoadingDots] = useState("•");
  const totalInstallments = purchase?.totalInstallments || purchase?.total_installments || 0;

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  useEffect(() => {
    setPaid(selected?.status === "paid");
  }, [selected?.status]);

  useEffect(() => {
    if (!paying) {
      setLoadingDots("•");
      return;
    }
    const interval = setInterval(() => {
      setLoadingDots((current) => current.length >= 3 ? "•" : `${current}•`);
    }, 320);
    return () => clearInterval(interval);
  }, [paying]);

  async function handleMarkPaid() {
    if (!purchase || !selected || paying || paid) return;
    setPaying(true);
    try {
      await markInstallmentPaid(purchase.id, selected.id);
      setPaid(true);
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo marcar la cuota.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screen}>
      <Header title="Detalle de pago" back />
      {purchase && selected ? (
        <>
          <View style={styles.hero}>
            <AmountLavaBackground />
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>Cuota {selected.number} de {totalInstallments} · {purchase.name}</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.heroAmount}>{formatCompactMoney(selected.amount, purchase.currency, false)}</Text>
            </View>
          </View>

          <View style={styles.details}>
            <Text style={styles.title}>{purchase.name}</Text>
            <Row label="Monto:" value={formatMoney(selected.amount, purchase.currency, false)} />
            <Row label="Categoría:" value={capitalized(purchase.category)} />
            <Row label="Cuota:" value={`${selected.number} de ${totalInstallments}`} />
            <Row label="Monto total:" value={formatMoney(purchase.totalAmount || purchase.total_amount || 0, purchase.currency, false)} />
            <Row label="Tarjeta:" value={purchase.cardName || purchase.card_name || "Tarjeta de crédito"} />
            <Row label="Próximo vencimiento:" value={new Date(`${(selected.dueDate || selected.due_date || "").slice(0, 10)}T12:00:00`).toLocaleDateString("es-UY")} />
            <Row label="Estado:" value={paid ? "Pagada" : "Pendiente"} />
            {purchase.note ? <Row label="Nota:" value={purchase.note} /> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: paying, disabled: paying || paid }}
            disabled={paying || paid}
            onPress={() => void handleMarkPaid()}
            style={({ pressed }) => [styles.payButton, pressed && !paying && !paid && styles.payButtonPressed]}
          >
            <Text style={styles.payButtonText}>{paying ? loadingDots : paid ? "Pagada" : "Marcar como pagada"}</Text>
          </Pressable>
        </>
      ) : <Text style={styles.empty}>No encontré esta compra en cuotas.</Text>}
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  details: { marginTop: 42 },
  empty: { ...typography.body, color: colors.transparentWhite, marginTop: spacing.xl },
  hero: { borderRadius: 28, height: 162, marginHorizontal: 2, marginTop: 44, overflow: "hidden" },
  heroAmount: { color: colors.white, fontSize: 52, fontWeight: "600", letterSpacing: -1, lineHeight: 59 },
  heroCopy: { alignSelf: "center", height: "100%", justifyContent: "center", maxWidth: "84%", minWidth: "76%" },
  heroLabel: { ...typography.body, color: "rgba(255,255,255,0.78)" },
  label: { ...typography.body, color: "rgba(255,255,255,0.78)", flex: 0.9 },
  payButton: { alignItems: "center", backgroundColor: "#C7C7C7", borderRadius: 999, justifyContent: "center", marginTop: 42, minHeight: 56 },
  payButtonPressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  payButtonText: { ...typography.button, color: "#252525", fontWeight: "800" },
  row: { flexDirection: "row", gap: spacing.md, minHeight: 31 },
  screen: { paddingBottom: 60, paddingHorizontal: 22, paddingTop: 24 },
  title: { ...typography.body, color: colors.white, fontWeight: "800", marginBottom: 8 },
  value: { ...typography.body, color: "rgba(255,255,255,0.78)", flex: 1.2, textAlign: "right" }
});
