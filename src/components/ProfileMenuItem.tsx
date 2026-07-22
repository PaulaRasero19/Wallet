import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, LucideIcon } from "lucide-react-native";
import { colors, spacing, typography } from "../theme";

export function ProfileMenuItem({
  icon: Icon,
  title,
  description,
  onPress
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <Icon color={colors.white} size={18} strokeWidth={1.8} />
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <ChevronRight color={colors.transparentWhite} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    backgroundColor: colors.appGrayDark,
    borderColor: colors.appGrayBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 66,
    paddingHorizontal: spacing.md
  },
  copy: {
    flex: 1
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "600"
  },
  description: {
    ...typography.label,
    marginTop: 2
  }
});
