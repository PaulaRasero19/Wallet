import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Header } from "../../src/components/Header";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { DotProgress } from "../../src/components/DotProgress";
import { colors, spacing, typography } from "../../src/theme";

const copy: Record<string, { title: string; body: string }> = {
  account: { title: "Account", body: "Demo profile controls for name, email and currency." },
  preferences: { title: "Preferences", body: "Theme, language and spending display preferences." },
  notifications: { title: "Notifications", body: "Budget alerts, reminder cadence and AI nudges." },
  "bank-accounts": { title: "Bank accounts", body: "Connected accounts will be loaded from Supabase in the next phase." },
  security: { title: "Security", body: "Password, biometric access and API key safety notes." },
  help: { title: "Help & Support", body: "Frequently asked questions and contact channels." }
};

export default function SettingSection() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const page = copy[section || "account"] || copy.account;

  return (
    <ScreenContainer>
      <Header title={page.title} back />
      <View style={styles.panel}>
        <Text style={styles.title}>{page.title}</Text>
        <Text style={styles.body}>{page.body}</Text>
        <DotProgress progress={70} total={12} color="black" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 20,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg
  },
  title: {
    ...typography.title
  },
  body: {
    ...typography.body
  }
});
