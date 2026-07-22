import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { translate } from "../src/i18n";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, spacing, typography } from "../src/theme";
import { Currency } from "../src/types/finflow";

const currencies: Currency[] = ["UYU", "USD", "EUR"];
const incomeFrequencies = ["monthly", "biweekly", "weekly", "variable"] as const;
const goals = ["llegar a fin de mes", "ahorrar", "controlar gastos", "reducir deudas", "detectar gastos hormiga", "organizar pagos"];

export default function Setup() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);
  const language = useSessionStore((state) => state.language);
  const profile = useSessionStore((state) => state.profile);
  const [country, setCountry] = useState(profile?.country_code || "UY");
  const [currency, setCurrency] = useState<Currency>(profile?.primary_currency || "UYU");
  const [income, setIncome] = useState(profile?.monthly_income ? String(profile.monthly_income) : "");
  const [payday, setPayday] = useState(profile?.payday ? String(profile.payday) : "");
  const [goal, setGoal] = useState(profile?.financial_goal || "");
  const [incomeFrequency, setIncomeFrequency] = useState<(typeof incomeFrequencies)[number]>(profile?.income_frequency || "monthly");
  const [initialBalance, setInitialBalance] = useState(profile?.initial_balance ? String(profile.initial_balance) : "0");
  const [antThreshold, setAntThreshold] = useState(profile?.ant_expense_threshold ? String(profile.ant_expense_threshold) : "400");
  const [formMessage, setFormMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const t = (key: string) => translate(language, key);

  useEffect(() => {
    if (profile?.onboarding_completed) {
      router.replace("/(tabs)/overview");
    }
  }, [profile?.onboarding_completed]);

  async function save(skipSensitive = false) {
    setFormMessage("");
    setSaving(true);
    try {
      await completeOnboarding({
        country_code: country.trim() || "UY",
        financial_goal: goal.trim() || null,
        income_frequency: skipSensitive ? null : incomeFrequency,
        monthly_income: skipSensitive || !income ? null : Number(income.replace(",", ".")),
        payday: skipSensitive || !payday ? null : Number(payday),
        primary_currency: currency,
        initial_balance: Number(initialBalance.replace(",", ".") || 0),
        ant_expense_threshold: Number(antThreshold.replace(",", ".") || 400)
      });
      router.replace("/(tabs)/overview");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la configuración.";
      const readableMessage = message.includes("fetch") || message.includes("Failed")
        ? "No se pudo conectar con el backend local. Verificá que esté corriendo con npm run backend."
        : message;
      setFormMessage(readableMessage);
      Alert.alert("FinFlow", readableMessage);
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
        <Text style={styles.label}>{t("setup.frequency")}</Text>
        <View style={styles.wrapRow}>
          {incomeFrequencies.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => setIncomeFrequency(item)}
              style={[styles.choice, incomeFrequency === item && styles.currencyActive]}
            >
              <Text style={[styles.currencyText, incomeFrequency === item && styles.currencyTextActive]}>{t(`setup.frequency.${item}`)}</Text>
            </Pressable>
          ))}
        </View>
        <InputField
          accessibilityLabel={t("setup.payday")}
          keyboardType="number-pad"
          onChangeText={setPayday}
          placeholder={t("setup.payday")}
          value={payday}
        />
        <InputField accessibilityLabel={t("setup.goal")} onChangeText={setGoal} placeholder={t("setup.goal")} value={goal} />
        <View style={styles.wrapRow}>
          {goals.map((item) => (
            <Pressable accessibilityRole="button" key={item} onPress={() => setGoal(item)} style={[styles.choice, goal === item && styles.currencyActive]}>
              <Text style={[styles.currencyText, goal === item && styles.currencyTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <InputField
          accessibilityLabel={t("setup.initialBalance")}
          keyboardType="decimal-pad"
          onChangeText={setInitialBalance}
          placeholder={t("setup.initialBalance")}
          value={initialBalance}
        />
        <InputField
          accessibilityLabel={t("setup.antThreshold")}
          keyboardType="decimal-pad"
          onChangeText={setAntThreshold}
          placeholder={t("setup.antThreshold")}
          value={antThreshold}
        />
      </View>

      <View style={styles.actions}>
        {formMessage ? <Text style={styles.message}>{formMessage}</Text> : null}
        <PrimaryButton onPress={() => void save(false)}>{saving ? t("common.loading") : t("setup.finish")}</PrimaryButton>
        <Text onPress={() => void save(true)} style={styles.later}>{t("setup.later")}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.display,
    color: colors.white,
    marginTop: spacing.xl
  },
  subtitle: {
    ...typography.body,
    color: colors.transparentWhite,
    marginTop: spacing.sm
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite
  },
  currencyRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  currency: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 48,
    justifyContent: "center"
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  choice: {
    borderColor: colors.appGrayBorder,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  currencyActive: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  currencyText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "600"
  },
  currencyTextActive: {
    color: colors.black
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  message: {
    ...typography.body,
    color: colors.orange
  },
  later: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "600",
    textAlign: "center"
  }
});
