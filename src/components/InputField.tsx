import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { colors, radii, spacing, typography } from "../theme";

export function InputField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.grayMedium}
      {...props}
      style={[styles.input, props.multiline && styles.multiline, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    ...typography.body,
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.black,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  multiline: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  }
});
