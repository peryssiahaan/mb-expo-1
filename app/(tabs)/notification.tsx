import { useEffect, useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface NotificationData {
  request: {
    content: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
    };
  };
}

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Notification(): JSX.Element {
  const [expoPushToken, setExpoPushToken] = useState<string>("");
  const [notification, setNotification] = useState<NotificationData | null>(
    null
  );

  useEffect(() => {
    registerForPushNotifications();

    const subscription = Notifications.addNotificationReceivedListener(
      (received) => {
        console.log("Notification received:", received);
        setNotification(received as NotificationData);
      }
    );

    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification response:", response);
      });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const registerForPushNotifications = async (): Promise<void> => {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert("Permission denied", "Push notifications are disabled.");
        return;
      }

      const token = await Notifications.getDevicePushTokenAsync();
      setExpoPushToken(token.data);
    } catch (error) {
      console.error("Error getting push token:", error);
    }
  };

  const sendNotification = async () => {
    if (!expoPushToken) {
      Alert.alert("Error", "Push token is not available yet.");
      return;
    }

    try {
      const body = {
        token: expoPushToken,
        title: "Notification Title",
        body: "This is a notification body!",
      };

      const notificationServiceURL =
        process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL;

      if (!notificationServiceURL) {
        console.error("Notification service URL is not defined.");
        return;
      }

      const accessToken = await AsyncStorage.getItem("accessToken");

      if (!accessToken) {
        console.error("Access token is not available.");
        return;
      }

      const response = await fetch(notificationServiceURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Error sending notification:", JSON.stringify(result));
        Alert.alert("Error", "Failed to send notification.");
        return;
      }

      console.log("Notification sent:", JSON.stringify(result));
      Alert.alert("Success", "Notification sent successfully.");
    } catch (error) {
      console.error("Error sending notification:", error);
      Alert.alert("Error", "Failed to send notification.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your FCM Token:</Text>
      <View style={styles.tokenContainer}>
        <Text style={styles.tokenText}>
          {expoPushToken || "Fetching your FCM token..."}
        </Text>
      </View>

      {notification && (
        <View style={styles.notificationContainer}>
          <Text style={styles.notificationTitle}>Last Notification:</Text>
          <Text style={styles.notificationText}>
            {notification.request.content.title}:{" "}
            {notification.request.content.body}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={sendNotification}>
        <Text style={styles.buttonText}>Send Test Notification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  tokenContainer: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  tokenText: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
  notificationContainer: {
    marginTop: 20,
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    width: "100%",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#444",
  },
  notificationText: {
    fontSize: 14,
    color: "#666",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});
