import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { colors, radii, spacing } from "../styles/theme";

export function AppButton({ title, onPress, variant = "primary", loading = false, style }) {
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isSecondary && styles.secondaryButton,
        pressed && styles.pressed,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.primary : colors.card} />
      ) : (
        <Text style={[styles.text, isSecondary && styles.secondaryText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderWidth: 1
  },
  text: {
    color: colors.card,
    fontSize: 16,
    fontWeight: "700"
  },
  secondaryText: {
    color: colors.primary
  },
  pressed: {
    opacity: 0.82
  }
});
