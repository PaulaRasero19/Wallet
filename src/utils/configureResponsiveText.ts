import { Text, TextInput } from "react-native";

type ScalableDefaults = {
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
};

const MAX_FONT_SCALE = 1;

export function configureResponsiveText() {
  const text = Text as typeof Text & { defaultProps?: ScalableDefaults };
  const textInput = TextInput as typeof TextInput & { defaultProps?: ScalableDefaults };

  text.defaultProps = {
    ...text.defaultProps,
    allowFontScaling: false,
    maxFontSizeMultiplier: MAX_FONT_SCALE
  };

  textInput.defaultProps = {
    ...textInput.defaultProps,
    allowFontScaling: false,
    maxFontSizeMultiplier: MAX_FONT_SCALE
  };
}
