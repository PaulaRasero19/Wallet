import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme";
import { Currency } from "../../types/finflow";
import { formatCompactMoney } from "../../utils/money";

export function AvailableMoney({ amount, currency }: { amount: number | null; currency: Currency }) {
  const displayAmount = amount === null ? "Cargando" : formatCompactMoney(amount, currency, false);

  return (
    <View style={styles.wrap}>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.amount}>
        {displayAmount}
      </Text>
      <Text style={styles.subtitle}>Hasta el próximo ingreso</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    ...typography.value,
    color: colors.white,
    fontSize: 70,
    fontWeight: "700",
    lineHeight: 78,
    textAlign: "center"
  },
  subtitle: {
    ...typography.body,
    color: colors.white,
    fontSize: 16,
    lineHeight: 20,
    marginTop: 8,
    textAlign: "center"
  },
  wrap: {
    alignItems: "center",
    marginTop: 105,
    paddingHorizontal: 32
  }
});
