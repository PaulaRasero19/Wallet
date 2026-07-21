import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { SecondaryButton } from "../src/components/SecondaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { translate } from "../src/i18n";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { Currency } from "../src/types/finflow";

const currencies: Currency[] = ["UYU", "USD", "EUR"];

export default function Setup() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);
  const language = useSessionStore((state) => state.language);
  const profile = useSessionStore((state) => state.profile);
  const [country, setCountry] = useState(profile?.country_code || "UY");
  const [currency, setCurrency] = useState<Currency>(profile?.primary_currency || "UYU");
  const [income, setIncome] = useState(profile?.monthly_income ? String(profile.monthly_income) : "");
  const [payday, setPayday] = useState(profile?.payday ? String(profile.payday) : "");
  const [goal, setGoal] = useState(profile?.financial_goal || "");
  const [saving, setSaving] = useState(false);
  const t = (key: string) => translate(language, key);

  useEffect(() => {
    if (profile?.onboarding_completed) {
      router.replace("/(tabs)/overview");
    }
  }, [profile?.onboarding_completed]);

  async function save(skipSensitive = false) {
    setSaving(true);
    try {
      await completeOnboarding({
        country_code: country.trim() || "UY",
        financial_goal: goal.trim() || null,
        income_frequency: skipSensitive ? null : "monthly",
        monthly_income: skipSensitive || !income ? null : Number(income.replace(",", ".")),
        payday: skipSensitive || !payday ? null : Number(payday),
        primary_currency: currency
      });
      router.replace("/(tabs)/overview");
    } catch (error) {
      Alert.alert("FinFlow", error instanceof Error ? error.message : "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenContainer>
      <Header title={t("setup.title")} />
      <Text style={styles.title}>{t("setup.title")}</Text>
      <Text style={styles.subtitle}>{t("setup.subtitle")}</Text>

      <View style={styles.form}>
        <InputField accessibilityLabel={t("setup.country")} onChangeText={setCountry} placeholder={t("setup.country")} value={country} />
        <Text style={styles.label}>{t("setup.currency")}</Text>
        <View style={styles.currencyRow}>
          {currencies.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => setCurrency(item)}
              style={[styles.currency, currency === item && styles.currencyActive]}
            >
              <Text style={[styles.currencyText, currency === item && styles.currencyTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <InputField
          accessibilityLabel={t("setup.income")}
          keyboardType="decimal-pad"
          onChangeText={setIncome}
          placeholder={t("setup.income")}
          value={income}
        />
        <InputField
          accessibilityLabel={t("setup.payday")}
          keyboardType="number-pad"
          onChangeText={setPayday}
          placeholder={t("setup.payday")}
          value={payday}
        />
        <InputField accessibilityLabel={t("setup.goal")} onChangeText={setGoal} placeholder={t("setup.goal")} value={goal} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton onPress={() => void save(false)}>{saving ? t("common.loading") : t("setup.finish")}</PrimaryButton>
        <SecondaryButton onPress={() => void save(true)}>{t("setup.later")}</SecondaryButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.display,
    marginTop: spacing.xl
  },
  subtitle: {
    ...typography.body,
    color: colors.black,
    marginTop: spacing.sm
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  label: {
    ...typography.label,
    color: colors.grayDark
  },
  currencyRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  currency: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: "center"
  },
  currencyActive: {
    backgroundColor: colors.black,
    borderColor: colors.black
  },
  currencyText: {
    ...typography.label,
    color: colors.black,
    fontWeight: "600"
  },
  currencyTextActive: {
    color: colors.white
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl
  }
});
