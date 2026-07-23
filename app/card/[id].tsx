import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { colors, spacing, typography } from "../../src/theme";
import { formatMoney } from "../../src/utils/money";

export default function CardDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { creditCards, loadOverview, transactions } = useFinFlowStore();
  const card = creditCards.find((item) => item.id === id);

  useEffect(() => {
    void loadOverview("30d");
  }, [loadOverview]);

  const installments = useMemo(
    () => transactions.filter((transaction) => transaction.installment && String(transaction.accountId || transaction.account_id) === id),
    [id, transactions]
  );

  return (
    <ScreenContainer>
      <Header title="Detalle de tarjeta" back />
      {card ? (
        <>
          <View style={styles.panel}>
            <Text style={styles.title}>{card.name}</Text>
            <Row label="Límite" value={formatMoney(card.limit, card.currency, false)} />
            <Row label="Utilizado" value={formatMoney(card.used, card.currency, false)} />
            <Row label="Disponible" value={formatMoney(Math.max(0, card.limit - card.used), card.currency, false)} />
            <Row label="Cierra" value={new Date(card.closingDate).toLocaleDateString("es-UY", { day: "numeric", month: "long" })} />
            <Row label="Vence" value={new Date(card.dueDate).toLocaleDateString("es-UY", { day: "numeric", month: "long" })} />
          </View>
          <Text style={styles.sectionTitle}>Compras en cuotas</Text>
          {installments.length ? (
            installments.map((transaction) => (
              <View key={transaction.id} style={styles.item}>
                <Text style={styles.itemTitle}>{transaction.merchant || transaction.title}</Text>
                <Text style={styles.itemMeta}>
                  Cuota {transaction.installment?.current} de {transaction.installment?.total} · {formatMoney(transaction.installment?.amountPerInstallment || 0, transaction.currency, false)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No hay cuotas vinculadas a esta tarjeta.</Text>
          )}
        </>
      ) : (
        <Text style={styles.empty}>No encontré esta tarjeta para tu usuario.</Text>
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
    marginTop: spacing.md
  },
  item: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  itemMeta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: 3
  },
  itemTitle: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
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
    justifyContent: "space-between",
    paddingVertical: spacing.md
  },
  sectionTitle: {
    ...typography.title,
    color: colors.white,
    marginTop: spacing.xl
  },
  title: {
    ...typography.title,
    color: colors.white,
    marginBottom: spacing.sm
  },
  value: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  }
});
