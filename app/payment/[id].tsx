import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Header } from "../../src/components/Header";
import { AmountLavaBackground } from "../../src/components/forms/AmountLavaBackground";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatCompactMoney, formatMoney } from "../../src/utils/money";

const frequencyLabels = {
  once: "Una vez",
  weekly: "Cada semana",
  fortnightly: "Cada quincena",
  monthly: "Cada mes",
  annual: "Cada año"
} as const;

const statusLabels: Record<string, string> = {
  confirmed: "Confirmado",
  paid: "Pagado",
  pending: "Pendiente",
  rejected: "Rechazado"
};

function capitalized(value: string) {
  return value ? value.charAt(0).toLocaleUpperCase("es-UY") + value.slice(1) : value;
}

export default function PaymentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loadOverview, markPaymentPaid, recurringPayments } = useFinFlowStore();
  const payment = recurringPayments.find((item) => item.id === id);
  const isIncome = payment?.kind === "income";
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [loadingDots, setLoadingDots] = useState("•");

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  useEffect(() => {
    if (payment?.status === "paid") setPaid(true);
  }, [payment?.status]);

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
    if (!payment || paying || paid) return;
    setPaying(true);
    try {
      await markPaymentPaid(payment.id);
      setPaid(true);
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo marcar el pago.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <ScreenContainer backgroundColor="#1C1C1B" style={styles.screen}>
      <Header title={isIncome ? "Ingreso previsto" : "Detalle de pago"} back />
      {payment ? (
        <>
          <View style={styles.hero}>
            <AmountLavaBackground />
            <View style={styles.heroCopy}>
              <Text style={styles.heroLabel}>{payment.merchant}</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.heroAmount}>{formatCompactMoney(payment.amount, payment.currency, false)}</Text>
            </View>
          </View>

          <View style={styles.details}>
            <Text style={styles.title}>{payment.merchant}</Text>
            <Row label="Monto:" value={formatMoney(payment.amount, payment.currency, false)} />
            <Row label={isIncome ? "Fuente:" : "Categoría:"} value={capitalized(payment.category)} />
            <Row label={isIncome ? "Próxima fecha esperada:" : "Próximo vencimiento:"} value={new Date(`${payment.nextChargeDate.slice(0, 10)}T12:00:00`).toLocaleDateString("es-UY")} />
            <Row label="Frecuencia:" value={frequencyLabels[payment.frequency]} />
            <Row label="Estado:" value={statusLabels[payment.status] || capitalized(payment.status)} />
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: paying, disabled: paying || paid }}
            disabled={paying || paid}
            onPress={() => void handleMarkPaid()}
            style={({ pressed }) => [styles.payButton, pressed && !paying && !paid && styles.payButtonPressed]}
          >
            <Text style={[styles.payButtonText, paid && styles.paidButtonText]}>
              {paying ? loadingDots : paid ? (isIncome ? "Recibido" : "Pagado") : (isIncome ? "Marcar como recibido" : "Marcar como pagado")}
            </Text>
          </Pressable>
        </>
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
  details: {
    marginTop: 42
  },
  empty: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.xl
  },
  hero: {
    borderRadius: 28,
    height: 162,
    marginHorizontal: 2,
    marginTop: 44,
    overflow: "hidden"
  },
  heroAmount: {
    color: colors.white,
    fontSize: 52,
    fontWeight: "600",
    letterSpacing: -1,
    lineHeight: 59
  },
  heroCopy: {
    alignSelf: "center",
    height: "100%",
    justifyContent: "center",
    maxWidth: "84%",
    minWidth: "76%"
  },
  heroLabel: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)"
  },
  label: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    flex: 0.9
  },
  payButton: {
    alignItems: "center",
    backgroundColor: "#C7C7C7",
    borderRadius: 999,
    justifyContent: "center",
    marginTop: 42,
    minHeight: 56
  },
  payButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }]
  },
  payButtonText: {
    ...typography.button,
    color: "#252525",
    fontWeight: "800"
  },
  paidButtonText: {
    color: "#252525"
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 31
  },
  screen: {
    paddingHorizontal: 22,
    paddingTop: 24
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800",
    marginBottom: 8
  },
  value: {
    ...typography.body,
    color: "rgba(255,255,255,0.78)",
    flex: 1.2,
    textAlign: "right"
  }
});
