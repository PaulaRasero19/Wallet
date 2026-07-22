import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radii, typography } from "../theme";

export function PrimaryButton({ children, disabled = false, onPress, style }: { children: ReactNode; disabled?: boolean; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && !disabled && styles.pressed, style]}
    >
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 22
  },
  text: {
    ...typography.button,
    color: colors.black
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }]
  },
  disabled: {
    opacity: 0.45
  }
});
