import { ReactNode } from "react";
import { ScrollView, StyleSheet, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";

export function ScreenContainer({ backgroundColor, children, style }: { backgroundColor?: string; children: ReactNode; style?: ViewStyle }) {
  return (
    <SafeAreaView style={[styles.safe, backgroundColor ? { backgroundColor } : null]}>
      <ScrollView contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.appGray,
    flex: 1
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: 140
  }
});
