import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatMoney } from "../../src/utils/money";

export default function PaymentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadOverview, recurringPayments } = useFinFlowStore();
  const payment = recurringPayments.find((item) => item.id === id);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  return (
    <ScreenContainer>
      <Header title="Detalle de pago" back />
      {payment ? (
        <View style={styles.panel}>
          <Text style={styles.title}>{payment.merchant}</Text>
          <Row label="Importe estimado" value={formatMoney(payment.amount, payment.currency, false)} />
          <Row label="Categoría" value={payment.category} />
          <Row label="Frecuencia" value={payment.frequency} />
          <Row label="Próximo vencimiento" value={new Date(payment.nextChargeDate).toLocaleDateString("es-UY", { day: "2-digit", month: "long", year: "numeric" })} />
          <Row label="Estado" value={payment.status} />
        </View>
      ) : (
        <Text style={styles.empty}>No encontré este pago para tu usuario.</Text>
      )}
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.xl
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite
  },
  panel: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  row: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    paddingVertical: spacing.md
  },
  title: {
    ...typography.title,
    color: colors.white,
    marginBottom: spacing.sm
  },
  value: {
    ...typography.body,
    color: colors.white,
    flex: 1,
    fontWeight: "800",
    textAlign: "right"
  }
});
