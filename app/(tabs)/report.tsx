import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Report() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Report</Text>
        </View>
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
  button: {
    width: "80%",
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: "#28a745",
  },
  revokeButton: {
    backgroundColor: "#ffc107",
  },
  logoutButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginTop: 16,
    alignSelf: "flex-start",
  },
  tokenContainer: {
    marginTop: 8,
    width: "100%",
    backgroundColor: "#e9ecef",
    borderRadius: 8,
    padding: 12,
  },
  tokenText: {
    fontSize: 14,
    color: "#333",
  },
});
