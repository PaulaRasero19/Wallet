import { ReactNode } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "../theme";

export function ScreenContainer({ backgroundColor, children, style }: { backgroundColor?: string; children: ReactNode; style?: ViewStyle }) {
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? spacing.md : spacing.lg;

  return (
    <SafeAreaView style={[styles.safe, backgroundColor ? { backgroundColor } : null]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }, style]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
    alignSelf: "center",
    flexGrow: 1,
    maxWidth: 720,
    padding: spacing.lg,
    paddingBottom: 140,
    width: "100%"
  }
});
