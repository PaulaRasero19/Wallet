import type { RefObject } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";
import { colors, radii, spacing, typography } from "../theme";

type InputFieldProps = TextInputProps & {
  inputRef?: RefObject<TextInput | null>;
};

export function InputField({ inputRef, ...props }: InputFieldProps) {
  return (
    <TextInput
      ref={inputRef}
      placeholderTextColor={colors.grayMedium}
      {...props}
      onPressIn={(event) => {
        inputRef?.current?.focus();
        props.onPressIn?.(event);
      }}
      showSoftInputOnFocus={props.showSoftInputOnFocus ?? true}
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
    elevation: 0,
    minHeight: 50,
    paddingHorizontal: spacing.md,
    position: "relative",
    zIndex: 1
  },
  multiline: {
    minHeight: 92,
    paddingTop: spacing.md,
    textAlignVertical: "top"
  }
});
