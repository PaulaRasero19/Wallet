import { Pressable, StyleSheet, Text, View } from "react-native";
import { Bell } from "lucide-react-native";
import { colors, typography } from "../../theme";
import { UserAvatar } from "../profile/UserAvatar";

type HomeHeaderProps = {
  avatarUrl?: string | null;
  firstName: string;
  fullName?: string | null;
  notificationCount?: number;
  onAvatarPress?: () => void;
  onNotificationsPress?: () => void;
};

export function HomeHeader({ avatarUrl, firstName, fullName, notificationCount = 0, onAvatarPress, onNotificationsPress }: HomeHeaderProps) {
  const badgeLabel = notificationCount > 9 ? "9+" : String(notificationCount);

  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Abrir perfil y ajustes" accessibilityRole="button" onPress={onAvatarPress} style={styles.identity}>
        <UserAvatar fullName={fullName || firstName} size={40} uri={avatarUrl} />
        <Text style={styles.hello}>Hi {firstName}!</Text>
      </Pressable>
      <Pressable accessibilityLabel="Notificaciones" accessibilityRole="button" onPress={onNotificationsPress} style={styles.notification}>
        <Bell color={colors.white} size={19} strokeWidth={1.8} />
        {notificationCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
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
  },
  badge: {
    alignItems: "center",
    backgroundColor: "#E65C50",
    borderColor: "rgba(255,255,255,0.78)",
    borderRadius: 8,
    borderWidth: 1,
    height: 16,
    justifyContent: "center",
    minWidth: 16,
    paddingHorizontal: 3,
    position: "absolute",
    right: -2,
    top: -2
  },
  badgeText: {
    ...typography.label,
    color: colors.white,
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 10
  }
});
