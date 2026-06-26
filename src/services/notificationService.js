import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function configureAndroidNotifications() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: "FinFlow",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2563EB"
  });
}

export async function requestNotificationPermissions() {
  await configureAndroidNotifications();

  if (!Device.isDevice) {
    return {
      granted: false,
      message: "Las notificaciones reales funcionan mejor en un celular fisico."
    };
  }

  const currentPermissions = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermissions.status;

  if (currentPermissions.status !== "granted") {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  return {
    granted: finalStatus === "granted",
    message:
      finalStatus === "granted"
        ? "Permiso de notificaciones activado."
        : "No se concedio el permiso de notificaciones."
  };
}

export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "FinFlow",
      body: "Estas cerca de alcanzar tu presupuesto mensual.",
      data: { type: "budgetLimit" }
    },
    trigger: null
  });
}

export async function scheduleLocalNotification() {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: "Recordatorio FinFlow",
      body: "Manana vence tu tarjeta.",
      data: { type: "cardDue" }
    },
    trigger: {
      seconds: 10,
      channelId: "default"
    }
  });
}

export async function cancelScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
