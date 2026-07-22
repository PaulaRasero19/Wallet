import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { colors, radii, typography } from "../theme";

export function SecondaryButton({ children, onPress, style }: { children: ReactNode; onPress: () => void; style?: ViewStyle }) {
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
    backgroundColor: "transparent",
    borderColor: colors.appGrayBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 22
  },
  text: {
    ...typography.button,
    color: colors.white
  },
  pressed: {
    opacity: 0.72
  }
});
