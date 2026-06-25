import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    requestPermissions();
  }, []);

  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      alert("Enable notifications to use reminders!");
    }
  }

  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
      <Stack.Screen name="index" options={{ gestureEnabled: false }} />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="dayview" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}