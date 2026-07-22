import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bell } from "lucide-react-native";
import { colors, typography } from "../../theme";
import { UserAvatar } from "../profile/UserAvatar";

export function HomeHeader({ avatarUrl, firstName, fullName }: { avatarUrl?: string | null; firstName: string; fullName?: string | null }) {
  return (
    <View style={styles.header}>
      <View style={styles.identity}>
        <UserAvatar fullName={fullName || firstName} size={40} uri={avatarUrl} />
        <Text style={styles.hello}>Hi {firstName}!</Text>
      </View>
      <Pressable accessibilityLabel="Notificaciones" accessibilityRole="button" style={styles.notification}>
        <Bell color={colors.white} size={19} strokeWidth={1.8} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16
  },
  hello: {
    ...typography.body,
    color: colors.white,
    fontSize: 15,
    lineHeight: 18
  },
  identity: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  notification: {
    alignItems: "center",
    backgroundColor: "rgba(37,37,35,0.72)",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  }
});
