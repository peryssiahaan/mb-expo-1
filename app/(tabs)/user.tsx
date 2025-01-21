import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DiscoveryDocument, fetchUserInfoAsync } from "expo-auth-session";
import AsyncStorage from "@react-native-async-storage/async-storage";

const host = process.env.EXPO_PUBLIC_UM_AUTH_URL ?? "http://localhost:3020";

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${host}/auth/authorize`,
  tokenEndpoint: `${host}/auth/token`,
  revocationEndpoint: `${host}/auth/revoke`,
  userInfoEndpoint: `${host}/client/user-info`,
  endSessionEndpoint: `${host}/auth/logout`,
};

interface IUserInfo {
  id: string;
  email: string;
  name: string;
  roles: any[];
  application: { code: string; name: string };
}

export default function User() {
  const [userInfo, setUserInfo] = useState<IUserInfo | null>(null);

  const fetchUserInfo = async (accessToken: string) => {
    try {
      const userInfo = (await fetchUserInfoAsync(
        { accessToken },
        discovery
      )) as IUserInfo;

      return userInfo;
    } catch (error) {
      console.error("User info error", error);
      return null;
    }
  };

  useEffect(() => {
    const getUserInfo = async () => {
      const stringUserInfo = await AsyncStorage.getItem("userInfo");

      if (stringUserInfo) {
        setUserInfo(JSON.parse(stringUserInfo));
        return;
      }

      const accessToken = await AsyncStorage.getItem("accessToken");

      if (!accessToken) {
        return;
      }

      const userInfo = await fetchUserInfo(accessToken);

      if (userInfo) {
        setUserInfo(userInfo);
        await AsyncStorage.setItem("userInfo", JSON.stringify(userInfo));
      }
    };

    getUserInfo();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>User Information</Text>
        {userInfo ? (
          <View style={styles.table}>
            <View style={styles.row}>
              <Text style={[styles.header, styles.fieldColumn]}>Field</Text>
              <Text style={[styles.header, styles.valueColumn]}>Value</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.fieldColumn]}>ID</Text>
              <Text style={[styles.cell, styles.valueColumn]}>
                {userInfo.id}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.fieldColumn]}>Email</Text>
              <Text style={[styles.cell, styles.valueColumn]}>
                {userInfo.email}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.fieldColumn]}>Name</Text>
              <Text style={[styles.cell, styles.valueColumn]}>
                {userInfo.name}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.fieldColumn]}>Roles</Text>
              <Text style={[styles.cell, styles.valueColumn]}>
                {userInfo.roles.map((role) => role).join(", ")}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.cell, styles.fieldColumn]}>Application</Text>
              <Text style={[styles.cell, styles.valueColumn]}>
                {userInfo.application.name} ({userInfo.application.code})
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noInfoText}>No user information available.</Text>
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
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  header: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  cell: {
    fontSize: 14,
    color: "#555",
    padding: 10,
  },
  fieldColumn: {
    flex: 1, // Field column takes 1 part
  },
  valueColumn: {
    flex: 2, // Value column takes 2 parts
  },
  noInfoText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
  },
});
