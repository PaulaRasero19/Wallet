import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { spacing, typography } from "../src/theme";

export default function Register() {
  return (
    <ScreenContainer style={styles.content}>
      <Header title="Create account" back />
      <View style={styles.form}>
        <Text style={styles.title}>Start flowing</Text>
        <InputField accessibilityLabel="Name" placeholder="Name" />
        <InputField accessibilityLabel="Email" autoCapitalize="none" keyboardType="email-address" placeholder="Email" />
        <InputField accessibilityLabel="Password" placeholder="Password" secureTextEntry />
        <PrimaryButton onPress={() => router.replace("/(tabs)/overview")}>Create account</PrimaryButton>
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
    ...typography.display,
    marginBottom: spacing.md
  }
});
