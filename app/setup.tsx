import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Header } from "../src/components/Header";
import { InputField } from "../src/components/InputField";
import { PrimaryButton } from "../src/components/PrimaryButton";
import { ScreenContainer } from "../src/components/ScreenContainer";
import { useSessionStore } from "../src/store/useSessionStore";
import { colors, radii, spacing, typography } from "../src/theme";
import { Currency } from "../src/types/finflow";
import { buildCountryOptions, CountryOption, currencyForCountry, currencyOptions, CurrencyOption } from "../src/utils/countryOptions";

type IncomeFrequency = "monthly" | "biweekly" | "weekly" | "variable";
type GoalOption = { label: string; value: string };

const incomeFrequencies: Array<{ code: IncomeFrequency; label: string }> = [
  { code: "monthly", label: "Mensual" },
  { code: "biweekly", label: "Quincenal" },
  { code: "weekly", label: "Semanal" },
  { code: "variable", label: "Variable" }
];

const goals: GoalOption[] = [
  { label: "Llegar tranquila a fin de mes.", value: "reach_end_of_month" },
  { label: "Ahorrar todos los meses.", value: "save_monthly" },
  { label: "Ordenar mis pagos.", value: "organize_payments" },
  { label: "Reducir gastos hormiga.", value: "reduce_small_expenses" },
  { label: "Controlar mis salidas.", value: "control_outings" }
];

const weekdays = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const monthDays = Array.from({ length: 31 }, (_, index) => index + 1);
const totalSteps = 4;

function parseMoney(value: string) {
  const parsed = Number(value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function onlyNumberText(value: string) {
  return value.replace(/[^\d,.]/g, "");
}

function formatNumberText(value: string) {
  const parsed = parseMoney(value);
  if (!parsed) return "";
  return Math.round(parsed).toLocaleString("es-UY", { maximumFractionDigits: 0 });
}

function setupStepFromProfile(step?: number) {
  return Math.min(Math.max(Number(step || 0), 0), totalSteps - 1);
}

export default function Setup() {
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);
  const profile = useSessionStore((state) => state.profile);
  const saveProfile = useSessionStore((state) => state.saveProfile);
  const countryOptions = useMemo(() => buildCountryOptions("es"), []);
  const savedCountry = countryOptions.find((item) => item.code === profile?.country_code);
  const savedCurrency = currencyOptions.find((item) => item.code === profile?.primary_currency);
  const initialCountry = savedCountry || countryOptions.find((item) => item.code === "UY") || countryOptions[0];
  const initialCurrency = savedCurrency || currencyOptions.find((item) => item.code === initialCountry?.currency) || currencyOptions[0];
  const [step, setStep] = useState(setupStepFromProfile(profile?.profile_setup_step));
  const [countryQuery, setCountryQuery] = useState(initialCountry?.name || "");
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(initialCountry || null);
  const [currencyQuery, setCurrencyQuery] = useState(initialCurrency?.name || "");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption | null>(initialCurrency || null);
  const [income, setIncome] = useState(profile?.monthly_income ? formatNumberText(String(profile.monthly_income)) : "");
  const [incomeFrequency, setIncomeFrequency] = useState<IncomeFrequency>((profile?.income_frequency as IncomeFrequency | null) || "monthly");
  const [payday, setPayday] = useState<number | null>(profile?.payday_day ?? profile?.payday ?? null);
  const [secondPayday, setSecondPayday] = useState<number | null>(profile?.second_payday ?? null);
  const [paydayWeekday, setPaydayWeekday] = useState<number | null>(profile?.payday_weekday ?? null);
  const [primaryGoal, setPrimaryGoal] = useState(profile?.primary_goal || "");
  const [formMessage, setFormMessage] = useState("");
  const [hasTriedContinue, setHasTriedContinue] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLowerCase();
    const matches = query
      ? countryOptions.filter((item) => item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query))
      : countryOptions;

    return matches.slice(0, 9);
  }, [countryOptions, countryQuery]);

  const filteredCurrencies = useMemo(() => {
    const query = currencyQuery.trim().toLowerCase();
    return currencyOptions.filter((item) => {
      return item.name.toLowerCase().includes(query) || item.code.toLowerCase().includes(query) || item.symbol.toLowerCase().includes(query);
    });
  }, [currencyQuery]);

  useEffect(() => {
    if (profile?.profile_setup_completed || profile?.onboarding_completed) {
      router.replace("/(tabs)/overview");
    }
  }, [profile?.onboarding_completed, profile?.profile_setup_completed]);

  function pickCountry(country: CountryOption) {
    const suggestedCurrency = currencyOptions.find((item) => item.code === country.currency) || selectedCurrency;
    setSelectedCountry(country);
    setCountryQuery(country.name);
    if (suggestedCurrency) {
      setSelectedCurrency(suggestedCurrency);
      setCurrencyQuery(suggestedCurrency.name);
    }
    setFormMessage("");
  }

  function pickCurrency(currency: CurrencyOption) {
    setSelectedCurrency(currency);
    setCurrencyQuery(currency.name);
    setFormMessage("");
  }

  function updateCountryQuery(value: string) {
    setCountryQuery(value);
    if (selectedCountry && value.trim() !== selectedCountry.name) {
      setSelectedCountry(null);
    }
  }

  function updateCurrencyQuery(value: string) {
    setCurrencyQuery(value);
    if (selectedCurrency && value.trim() !== selectedCurrency.name) {
      setSelectedCurrency(null);
    }
  }

  function updateIncome(value: string) {
    setIncome(formatNumberText(onlyNumberText(value)));
    if (formMessage) setFormMessage("");
  }

  function validateStep() {
    if (step === 0 && !selectedCountry) return "Seleccioná un país válido de la lista.";
    if (step === 1 && !selectedCurrency) return "Seleccioná una moneda válida de la lista.";

    if (step === 2) {
      const monthlyIncome = parseMoney(income);
      if (monthlyIncome <= 0) return "Agregá tu ingreso mensual aproximado.";
      if (incomeFrequency === "monthly" && !payday) return "Seleccioná tu fecha habitual de cobro.";
      if (incomeFrequency === "biweekly" && (!payday || !secondPayday)) return "Seleccioná tus dos fechas habituales de cobro.";
      if (incomeFrequency === "weekly" && paydayWeekday === null) return "Seleccioná tu día habitual de cobro.";
    }

    if (step === 3 && !primaryGoal) return "Seleccioná un objetivo principal.";

    return "";
  }

  function buildStepUpdate(nextStep: number) {
    if (step === 0 && selectedCountry) {
      const suggestedCurrency = currencyOptions.find((item) => item.code === currencyForCountry(selectedCountry.code)) || selectedCurrency || currencyOptions[0];
      return {
        country_name: selectedCountry.name,
        country_code: selectedCountry.code,
        currency_name: suggestedCurrency.name,
        currency_symbol: suggestedCurrency.symbol,
        primary_currency: suggestedCurrency.code,
        profile_setup_step: nextStep
      };
    }

    if (step === 1 && selectedCurrency) {
      return {
        currency_name: selectedCurrency.name,
        currency_symbol: selectedCurrency.symbol,
        primary_currency: selectedCurrency.code,
        profile_setup_step: nextStep
      };
    }

    if (step === 2) {
      return {
        has_variable_income: incomeFrequency === "variable",
        income_frequency: incomeFrequency,
        monthly_income: parseMoney(income),
        payday: incomeFrequency === "monthly" || incomeFrequency === "biweekly" ? payday : null,
        payday_day: incomeFrequency === "monthly" || incomeFrequency === "biweekly" ? payday : null,
        second_payday: incomeFrequency === "biweekly" ? secondPayday : null,
        payday_weekday: incomeFrequency === "weekly" ? paydayWeekday : null,
        profile_setup_step: nextStep
      };
    }

    return {
      financial_goal: goals.find((item) => item.value === primaryGoal)?.label || null,
      primary_goal: primaryGoal,
      profile_setup_step: nextStep
    };
  }

  async function nextStep() {
    setHasTriedContinue(true);
    const message = validateStep();
    if (message) {
      setFormMessage(message);
      return;
    }

    setFormMessage("");
    setSaving(true);
    try {
      const next = Math.min(step + 1, totalSteps - 1);
      await saveProfile(buildStepUpdate(next));
      setHasTriedContinue(false);
      setStep(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar este paso.";
      setFormMessage(message);
      Alert.alert("FinFlow", message);
    } finally {
      setSaving(false);
    }
  }

  async function finish() {
    setHasTriedContinue(true);
    const message = validateStep();
    if (message || !selectedCountry || !selectedCurrency) {
      setFormMessage(message || "Completá la configuración para seguir.");
      return;
    }

    setFormMessage("");
    setSaving(true);
    try {
      await completeOnboarding({
        country_name: selectedCountry.name,
        country_code: selectedCountry.code,
        currency_name: selectedCurrency.name,
        currency_symbol: selectedCurrency.symbol,
        primary_currency: selectedCurrency.code as Currency,
        financial_goal: goals.find((item) => item.value === primaryGoal)?.label || null,
        has_variable_income: incomeFrequency === "variable",
        income_frequency: incomeFrequency,
        monthly_income: parseMoney(income),
        payday: incomeFrequency === "monthly" || incomeFrequency === "biweekly" ? payday : null,
        payday_day: incomeFrequency === "monthly" || incomeFrequency === "biweekly" ? payday : null,
        second_payday: incomeFrequency === "biweekly" ? secondPayday : null,
        payday_weekday: incomeFrequency === "weekly" ? paydayWeekday : null,
        primary_goal: primaryGoal,
        profile_setup_completed: true,
        profile_setup_step: 4
      });
      router.replace("/(tabs)/overview");
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la configuración.";
      setFormMessage(message);
      Alert.alert("FinFlow", message);
    } finally {
      setSaving(false);
    }
  }

  function goBackStep() {
    setFormMessage("");
    setHasTriedContinue(false);
    setStep((current) => Math.max(current - 1, 0));
  }

  return (
    <ScreenContainer style={styles.content}>
      <Header title="Configurar cuenta" />

      <View style={styles.progressHeader}>
        <Text style={styles.stepLabel}>Paso {step + 1} de {totalSteps}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
        </View>
      </View>

      {step === 0 ? (
        <View style={styles.panel}>
          <Text style={styles.title}>¿De qué país sos?</Text>
          <Text style={styles.subtitle}>Esto nos ayuda a configurar la moneda y el formato correctos.</Text>
          <InputField accessibilityLabel="Buscar país" autoCapitalize="words" onChangeText={updateCountryQuery} placeholder="Buscar país" value={countryQuery} />
          <View style={styles.optionStack}>
            {filteredCountries.map((item) => {
              const active = item.code === selectedCountry?.code;
              return (
                <Pressable accessibilityRole="button" key={item.code} onPress={() => pickCountry(item)} style={[styles.optionRow, active && styles.activeRow]}>
                  <View>
                    <Text style={[styles.optionTitle, active && styles.activeText]}>{item.name}</Text>
                    <Text style={[styles.optionHint, active && styles.activeMeta]}>{item.code}</Text>
                  </View>
                  <Text style={[styles.currencySymbol, active && styles.activeText]}>{item.currency}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={styles.panel}>
          <Text style={styles.title}>¿En qué moneda cobrás?</Text>
          <Text style={styles.subtitle}>Elegí la moneda en la que recibís habitualmente tus ingresos.</Text>
          <InputField accessibilityLabel="Buscar moneda" autoCapitalize="words" onChangeText={updateCurrencyQuery} placeholder="Buscar moneda" value={currencyQuery} />
          <View style={styles.optionStack}>
            {filteredCurrencies.map((item) => {
              const active = item.code === selectedCurrency?.code;
              return (
                <Pressable accessibilityRole="button" key={item.code} onPress={() => pickCurrency(item)} style={[styles.optionRow, active && styles.activeRow]}>
                  <View>
                    <Text style={[styles.optionTitle, active && styles.activeText]}>{item.name}</Text>
                    <Text style={[styles.optionHint, active && styles.activeMeta]}>{item.code}</Text>
                  </View>
                  <Text style={[styles.currencySymbol, active && styles.activeText]}>{item.symbol}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.panel}>
          <Text style={styles.title}>Tus ingresos</Text>
          <Text style={styles.subtitle}>Con esto FinFlow calcula tu disponible mensual, alertas y estadísticas desde datos reales.</Text>
          <InputField
            accessibilityLabel="Ingreso mensual aproximado"
            autoCorrect={false}
            onChangeText={updateIncome}
            placeholder={`Ingreso mensual aproximado · ${selectedCurrency?.symbol || "$U"}`}
            value={income}
          />
          <Text style={styles.label}>Frecuencia</Text>
          <View style={styles.wrapRow}>
            {incomeFrequencies.map((item) => {
              const active = item.code === incomeFrequency;
              return (
                <Pressable accessibilityRole="button" key={item.code} onPress={() => setIncomeFrequency(item.code)} style={[styles.choice, active && styles.activeChoice]}>
                  <Text style={[styles.choiceText, active && styles.activeChoiceText]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {incomeFrequency === "monthly" || incomeFrequency === "biweekly" ? (
            <>
              <Text style={styles.label}>Fecha habitual de cobro</Text>
              <View style={styles.dayGrid}>
                {monthDays.map((day) => {
                  const active = day === payday;
                  return (
                    <Pressable accessibilityRole="button" key={day} onPress={() => setPayday(day)} style={[styles.dayChoice, active && styles.activeChoice]}>
                      <Text style={[styles.choiceText, active && styles.activeChoiceText]}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
          {incomeFrequency === "biweekly" ? (
            <>
              <Text style={styles.label}>Segunda fecha de cobro</Text>
              <View style={styles.dayGrid}>
                {monthDays.map((day) => {
                  const active = day === secondPayday;
                  return (
                    <Pressable accessibilityRole="button" key={day} onPress={() => setSecondPayday(day)} style={[styles.dayChoice, active && styles.activeChoice]}>
                      <Text style={[styles.choiceText, active && styles.activeChoiceText]}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
          {incomeFrequency === "weekly" ? (
            <>
              <Text style={styles.label}>Día habitual de cobro</Text>
              <View style={styles.wrapRow}>
                {weekdays.map((day, index) => {
                  const active = index === paydayWeekday;
                  return (
                    <Pressable accessibilityRole="button" key={day} onPress={() => setPaydayWeekday(index)} style={[styles.choice, active && styles.activeChoice]}>
                      <Text style={[styles.choiceText, active && styles.activeChoiceText]}>{day}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.panel}>
          <Text style={styles.title}>¿Cuál es tu objetivo principal?</Text>
          <Text style={styles.subtitle}>Elegí para qué querés usar principalmente FinFlow.</Text>
          <View style={styles.wrapRow}>
            {goals.map((item) => {
              const active = primaryGoal === item.value;
              return (
                <Pressable accessibilityRole="button" key={item.value} onPress={() => setPrimaryGoal(item.value)} style={[styles.choice, active && styles.activeChoice]}>
                  <Text style={[styles.choiceText, active && styles.activeChoiceText]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        {hasTriedContinue && formMessage ? <Text style={styles.message}>{formMessage}</Text> : null}
        <PrimaryButton disabled={saving} onPress={step === totalSteps - 1 ? () => void finish() : () => void nextStep()}>
          {saving ? "Guardando" : step === totalSteps - 1 ? "Dejar cuenta lista" : "Continuar"}
        </PrimaryButton>
        {step > 0 ? (
          <Pressable accessibilityRole="button" disabled={saving} onPress={goBackStep}>
            <Text style={styles.backText}>Volver</Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg
  },
  progressHeader: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  stepLabel: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "700"
  },
  progressTrack: {
    backgroundColor: colors.appGrayDark,
    borderRadius: radii.pill,
    height: 6,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    height: "100%"
  },
  panel: {
    gap: spacing.md,
    marginTop: spacing.lg
  },
  title: {
    ...typography.display,
    color: colors.white
  },
  subtitle: {
    ...typography.body,
    color: colors.transparentWhite
  },
  optionStack: {
    gap: spacing.sm
  },
  optionRow: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 70,
    paddingHorizontal: spacing.md
  },
  activeRow: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  optionTitle: {
    ...typography.label,
    color: colors.white,
    fontWeight: "700"
  },
  optionHint: {
    ...typography.body,
    color: colors.transparentWhite,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2
  },
  currencySymbol: {
    ...typography.title,
    color: colors.white,
    fontSize: 22
  },
  activeText: {
    color: colors.black
  },
  activeMeta: {
    color: "rgba(0,0,0,0.56)"
  },
  label: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "700"
  },
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  dayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  choice: {
    borderColor: colors.appGrayBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: spacing.md
  },
  dayChoice: {
    alignItems: "center",
    borderColor: colors.appGrayBorder,
    borderRadius: radii.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  activeChoice: {
    backgroundColor: colors.white,
    borderColor: colors.white
  },
  choiceText: {
    ...typography.label,
    color: colors.white,
    fontWeight: "700"
  },
  activeChoiceText: {
    color: colors.black
  },
  actions: {
    gap: spacing.sm,
    marginTop: "auto"
  },
  message: {
    ...typography.body,
    color: colors.orange
  },
  backText: {
    ...typography.label,
    color: colors.transparentWhite,
    fontWeight: "700",
    paddingVertical: spacing.sm,
    textAlign: "center"
  }
});
