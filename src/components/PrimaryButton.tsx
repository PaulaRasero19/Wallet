import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radii, typography } from "../theme";

export function PrimaryButton({ children, onPress, style }: { children: ReactNode; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
    >
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: colors.black,
    borderRadius: radii.pill,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 22
  },
  text: {
    ...typography.button
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }]
  }
});
