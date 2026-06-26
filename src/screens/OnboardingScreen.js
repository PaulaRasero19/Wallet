import { StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { Card } from "../components/Card";
import { colors, spacing } from "../styles/theme";

const messages = [
  "Organiza tus gastos.",
  "Controla tus tarjetas.",
  "Recibi alertas inteligentes."
];

export function OnboardingScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Bienvenida a FinFlow</Text>
      <Text style={styles.subtitle}>
        Una app simple para entender tu plata, cuidar tu presupuesto y avanzar en tus ahorros.
      </Text>
      <View style={styles.cards}>
        {messages.map((message) => (
          <Card key={message} style={styles.card}>
            <Text style={styles.cardText}>{message}</Text>
          </Card>
        ))}
      </View>
      <AppButton title="Comenzar" onPress={() => navigation.replace("MainTabs")} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    marginTop: spacing.sm
  },
  cards: {
    marginVertical: spacing.xl
  },
  card: {
    marginBottom: spacing.md
  },
  cardText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700"
  }
});
