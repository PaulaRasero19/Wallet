import { StyleSheet, Text, View } from "react-native";
import { colors, typography } from "../../theme";
import { Currency } from "../../types/finflow";

export function AvailableMoney({ amount, currency }: { amount: number; currency: Currency }) {
  const symbol = currency === "EUR" ? "€ " : "$ ";
  const displayAmount = `${symbol}${Math.max(0, Math.round(amount)).toLocaleString("es-UY", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  })}`;

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
    fontSize: 52,
    fontWeight: "700",
    lineHeight: 58,
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
    marginTop: 26,
    paddingHorizontal: 32
  }
});
