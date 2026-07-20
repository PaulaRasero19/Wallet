import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { CalendarDays } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { InputField } from "../../src/components/InputField";
import { PrimaryButton } from "../../src/components/PrimaryButton";
import { ScreenContainer } from "../../src/components/ScreenContainer";
import { DotCategory } from "../../src/components/DotCategory";
import { useFinFlowStore } from "../../src/store/useFinFlowStore";
import { AccentColor, colors, spacing, typography } from "../../src/theme";
import { BudgetCategory } from "../../src/types/finflow";

const categories: Array<{ label: BudgetCategory; accent: AccentColor }> = [
  { label: "Food", accent: "orange" },
  { label: "Transport", accent: "black" },
  { label: "Shopping", accent: "lime" },
  { label: "Other", accent: "lavender" }
];

export default function Add() {
  const [mode, setMode] = useState<"Expense" | "Task">("Expense");
  const [amount, setAmount] = useState("45.60");
  const [merchant, setMerchant] = useState("Starbucks");
  const [category, setCategory] = useState<BudgetCategory>("Food");
  const [title, setTitle] = useState("Budget Review");
  const addTransaction = useFinFlowStore((state) => state.addTransaction);
  const addTask = useFinFlowStore((state) => state.addTask);

  function save() {
    if (mode === "Expense") {
      const selected = categories.find((item) => item.label === category) || categories[0];
      addTransaction({
        merchant,
        category,
        date: "Today",
        time: "9:41 AM",
        amount: -Math.abs(Number(amount) || 0),
        type: "expense",
        accent: selected.accent
      });
      Alert.alert("FinFlow", "Expense added. Balance and budget were updated.");
      return;
    }

    addTask({
      title,
      date: "Today",
      time: "10:00 AM",
      category: "Finance",
      reminder: true,
      note: "Created from Add.",
      accent: "blue"
    });
    Alert.alert("FinFlow", "Task created with a reminder.");
  }

  return (
    <ScreenContainer>
      <Header title={mode === "Expense" ? "Add Expense" : "Add Task"} />
      <View style={styles.segment}>
        {(["Expense", "Task"] as const).map((item) => (
          <Pressable key={item} accessibilityRole="button" onPress={() => setMode(item)} style={[styles.segmentItem, mode === item && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "Expense" ? (
        <View style={styles.form}>
          <Text style={styles.amountLabel}>$</Text>
          <InputField accessibilityLabel="Amount" keyboardType="decimal-pad" onChangeText={setAmount} style={styles.amountInput} value={amount} />
          <View style={styles.categories}>
            {categories.map((item) => (
              <Pressable key={item.label} accessibilityRole="button" onPress={() => setCategory(item.label)} style={[styles.category, category === item.label && styles.categoryActive]}>
                <DotCategory color={item.accent} label={item.label} />
              </Pressable>
            ))}
          </View>
          <InputField accessibilityLabel="Merchant" onChangeText={setMerchant} placeholder="Merchant" value={merchant} />
          <InputField accessibilityLabel="Category" editable={false} value={category} />
          <InputField accessibilityLabel="Date" editable={false} value="Today" />
          <InputField accessibilityLabel="Account" editable={false} value="Checking •••• 4242" />
          <InputField accessibilityLabel="Note" multiline placeholder="Add note (optional)" />
        </View>
      ) : (
        <View style={styles.form}>
          <InputField accessibilityLabel="Task title" onChangeText={setTitle} placeholder="Title" value={title} />
          <InputField accessibilityLabel="Date" editable={false} value="Today" />
          <InputField accessibilityLabel="Time" editable={false} value="10:00 AM" />
          <InputField accessibilityLabel="Category" editable={false} value="Finance" />
          <View style={styles.reminder}>
            <CalendarDays color={colors.black} size={18} />
            <Text style={styles.reminderText}>Reminder enabled</Text>
          </View>
          <InputField accessibilityLabel="Note" multiline placeholder="Note" />
        </View>
      )}
      <PrimaryButton onPress={save}>Add {mode}</PrimaryButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  segment: {
    backgroundColor: colors.white,
    borderRadius: 24,
    flexDirection: "row",
    marginTop: spacing.xl,
    padding: 4
  },
  segmentItem: {
    alignItems: "center",
    borderRadius: 20,
    flex: 1,
    minHeight: 40,
    justifyContent: "center"
  },
  segmentActive: {
    backgroundColor: colors.black
  },
  segmentText: {
    ...typography.label,
    color: colors.black
  },
  segmentTextActive: {
    color: colors.white
  },
  form: {
    gap: spacing.md,
    marginVertical: spacing.xl
  },
  amountLabel: {
    ...typography.display,
    color: colors.grayLight,
    position: "absolute",
    top: 0
  },
  amountInput: {
    borderWidth: 0,
    fontSize: 44,
    height: 72,
    paddingLeft: 38
  },
  categories: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  category: {
    borderColor: "transparent",
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.xs
  },
  categoryActive: {
    borderColor: colors.black
  },
  reminder: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 50,
    paddingHorizontal: spacing.md
  },
  reminderText: {
    ...typography.body,
    color: colors.black
  }
});
