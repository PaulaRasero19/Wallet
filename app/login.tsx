import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { spacing, typography } from "../src/theme";

export default function Login() {
  return (
    <ScreenContainer style={styles.content}>
      <Header title="Log in" back />
      <View style={styles.form}>
        <Text style={styles.title}>Welcome back</Text>
        <InputField accessibilityLabel="Email" autoCapitalize="none" keyboardType="email-address" placeholder="Email" />
        <InputField accessibilityLabel="Password" placeholder="Password" secureTextEntry />
        <PrimaryButton onPress={() => router.replace("/(tabs)/overview")}>Log in</PrimaryButton>
        <SecondaryButton onPress={() => router.push("/forgot-password")}>Forgot password</SecondaryButton>
        <SecondaryButton onPress={() => router.push("/register")}>Create account</SecondaryButton>
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
