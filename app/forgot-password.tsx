import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { spacing, typography } from "../src/theme";

export default function ForgotPassword() {
  return (
    <ScreenContainer style={styles.content}>
      <Header title="Recover password" back />
      <View style={styles.form}>
        <Text style={styles.title}>Reset access</Text>
        <Text style={styles.copy}>Enter your email and FinFlow will simulate a recovery message.</Text>
        <InputField accessibilityLabel="Email" autoCapitalize="none" keyboardType="email-address" placeholder="Email" />
        <PrimaryButton onPress={() => router.back()}>Send recovery link</PrimaryButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl
  },
  form: {
    gap: spacing.md
  },
  title: {
    ...typography.display
  },
  copy: {
    ...typography.body
  }
});
