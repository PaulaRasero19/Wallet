import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { DotLogo } from "../src/components/DotLogo";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { languageOptions, translate } from "../src/i18n";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";

export default function LanguageSelector() {
  const language = useSessionStore((state) => state.language);
  const setLanguage = useSessionStore((state) => state.setLanguage);
  const t = (key: string) => translate(language, key);

  return (
    <ScreenContainer style={styles.content}>
      <View style={styles.header}>
        <DotLogo light />
        <Text style={styles.title}>{t("language.title")}</Text>
        <Text style={styles.subtitle}>{t("language.subtitle")}</Text>
      </View>

      <View style={styles.options}>
        {languageOptions.map((option) => {
          const active = option.code === language;
          return (
            <Pressable
              accessibilityRole="button"
              key={option.code}
              onPress={() => void setLanguage(option.code)}
              style={[styles.option, active && styles.activeOption]}
            >
              <Text style={[styles.optionText, active && styles.activeText]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton onPress={() => router.replace("/welcome")}>{t("language.continue")}</PrimaryButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: "space-between"
  },
  header: {
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xl
  },
  title: {
    ...typography.title,
    color: colors.white,
    textAlign: "center"
  },
  subtitle: {
    ...typography.body,
    color: colors.transparentWhite,
    textAlign: "center"
  },
  options: {
    gap: spacing.sm
  },
  option: {
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 58,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  activeOption: {
    borderColor: colors.white
  },
  optionText: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600"
  },
  activeText: {
    color: colors.orange
  }
});
