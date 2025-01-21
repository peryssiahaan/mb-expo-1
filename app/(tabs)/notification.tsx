import { useEffect, useState } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";

const host = process.env.EXPO_PUBLIC_UM_AUTH_URL ?? "http://localhost:3020";
const notif_host =
  process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL ?? "http://localhost:3020";

interface NotificationData {
  request: {
    content: {
      title: string;
      body: string;
      data?: Record<string, string>;
    };
  };
}

interface IUserInfo {
  id: string;
  email: string;
  name: string;
  roles: any[];
  application: { code: string; name: string };
}

interface ISentNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Notification handler configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Notification() {
  const [titleNotification, setTitleNotification] = useState<string>("");
  const [bodyNotification, setBodyNotification] = useState<string>("");
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

    const stringUserInfo = await AsyncStorage.getItem("userInfo");

    if (!stringUserInfo) {
      console.error("User info is not available.");
      return;
    }

    const user: IUserInfo = JSON.parse(stringUserInfo);

    try {
      const body: ISentNotification = {
        userId: user.id,
        title: titleNotification,
        body: bodyNotification,
      };

      const accessToken = await AsyncStorage.getItem("accessToken");

      if (!accessToken) {
        console.error("Access token is not available.");
        return;
      }

      const response = await fetch(`${notif_host}/push-notification/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("Error sending notification:", JSON.stringify(result));
        Alert.alert("Error", "Failed to send notification.");
        return;
      }

      console.log("Notification sent successfully.");
      Alert.alert("Success", "Notification sent successfully.");
    } catch (error) {
      console.error("Error sending notification:", error);
      Alert.alert("Error", "Failed to send notification.");
    }
  };

  const registerFCMToken2Server = async () => {
    if (!expoPushToken) {
      Alert.alert("Error", "Push token is not available yet.");
      return;
    }

    try {
      const accessToken = await AsyncStorage.getItem("accessToken");

      if (!accessToken) {
        return;
      }

      fetch(`${host}/client/user-fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token: expoPushToken }),
      });

      Alert.alert("Success", "FCM token registered successfully.");
    } catch (error) {
      console.error("Error getting FCM token:", error);
      Alert.alert("Error", "Failed to register FCM token.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Notifications</Text>

        <TouchableOpacity
          style={[styles.button, styles.registerTokenButton]}
          onPress={registerFCMToken2Server}
        >
          <Text style={styles.buttonText}>Register FCM Token</Text>
        </TouchableOpacity>

        <Text style={styles.tokenTitle}>FCM Token:</Text>
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenText}>
            {expoPushToken || "Fetching your FCM token..."}
          </Text>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Notification title"
          value={titleNotification}
          onChangeText={(newText) => setTitleNotification(newText)}
        />

        <TextInput
          style={styles.input}
          placeholder="Notification body"
          value={bodyNotification}
          onChangeText={(newText) => setBodyNotification(newText)}
        />

        <TouchableOpacity
          style={[styles.button, styles.sendNotificationButton]}
          onPress={sendNotification}
        >
          <Text style={styles.buttonText}>Send Notification</Text>
        </TouchableOpacity>

        {notification && (
          <View style={styles.notificationContainer}>
            <Text style={styles.notificationTitle}>Last Notification:</Text>
            <Text style={styles.notificationText}>
              {notification.request.content.title}:{" "}
              {notification.request.content.body}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  tokenContainer: {
    backgroundColor: "#e0e0e0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#444",
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
  label: {
    fontSize: 18,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 12, // Rounded corners
    paddingHorizontal: 16,
    marginBottom: 16,
    width: "100%",
    maxWidth: 350, // Set a max width for better control
    fontSize: 16,
    color: "#333",
    backgroundColor: "#f9f9f9", // Light background color
    elevation: 2, // Subtle shadow effect on Android
    shadowColor: "#aaa", // Shadow for iOS
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  inputFocused: {
    borderColor: "#007bff", // Highlight border color when focused
    backgroundColor: "#e7f3fe", // Light background when focused
  },
  placeholderStyle: {
    color: "#aaa", // Light gray color for placeholder text
  },
  button: {
    width: "80%",
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sendNotificationButton: {
    backgroundColor: "#28a745",
  },
  registerTokenButton: {
    backgroundColor: "#007bff",
  },
});
