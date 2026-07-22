import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "../theme";

export function InsightMetric({ label, meta, value }: { label: string; meta?: string; value: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomColor: colors.appGrayBorder,
    borderBottomWidth: 1,
    paddingVertical: spacing.md
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite
  },
  value: {
    ...typography.title,
    color: colors.white,
    marginTop: spacing.xs
  },
  meta: {
    ...typography.label,
    color: colors.transparentWhite,
    marginTop: spacing.xs
  }
});
