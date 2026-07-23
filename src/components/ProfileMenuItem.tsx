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
      <View style={styles.icon}>
        <Icon color={colors.white} size={19} strokeWidth={1.8} />
      </View>
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
    backgroundColor: "#3D3D3B",
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
    minHeight: 72,
    paddingHorizontal: 14
  },
  icon: {
    alignItems: "center",
    backgroundColor: "#242423",
    borderRadius: 18,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  copy: {
    flex: 1
  },
  title: {
    ...typography.body,
    color: colors.white,
    fontWeight: "800"
  },
  description: {
    ...typography.label,
    color: "rgba(255,255,255,0.52)",
    marginTop: 2
  }
});
