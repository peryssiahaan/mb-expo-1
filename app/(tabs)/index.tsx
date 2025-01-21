import * as WebBrowser from "expo-web-browser";
import {
  makeRedirectUri,
  useAuthRequest,
  exchangeCodeAsync,
  TokenResponse,
  DiscoveryDocument,
  revokeAsync,
  TokenTypeHint,
} from "expo-auth-session";
import { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const host = process.env.EXPO_PUBLIC_UM_AUTH_URL ?? "http://localhost:3020";

const discovery: DiscoveryDocument = {
  authorizationEndpoint: `${host}/auth/authorize`,
  tokenEndpoint: `${host}/auth/token`,
  revocationEndpoint: `${host}/auth/revoke`,
  userInfoEndpoint: `${host}/client/user-info`,
  endSessionEndpoint: `${host}/auth/logout`,
};

const TokenTable = ({ tokens }: { tokens: TokenResponse | null }) => {
  if (!tokens) return <Text style={styles.noTokens}>No tokens yet.</Text>;

  const tokenData = {
    AccessToken: tokens.accessToken,
    RefreshToken: tokens.refreshToken || "Not available",
    ExpiresIn: tokens.expiresIn?.toString() || "Not specified",
    IssuedAt: new Date(tokens.issuedAt || 0).toLocaleString(),
  };

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <Text style={[styles.header, styles.fieldColumn]}>Field</Text>
        <Text style={[styles.header, styles.valueColumn]}>Value</Text>
      </View>
      {Object.entries(tokenData).map(([key, value], index) => (
        <View
          key={index}
          style={[styles.row, index % 2 === 0 && styles.alternateRow]}
        >
          <Text style={[styles.cell, styles.fieldColumn]}>{key}</Text>
          <Text style={[styles.cell, styles.valueColumn]}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

export default function Home() {
  const [authTokens, setAuthTokens] = useState<TokenResponse | null>(null);
  const clientId = process.env.EXPO_PUBLIC_UM_CLIENT_ID;
  const clientSecret = process.env.EXPO_PUBLIC_UM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("No client id or client secret");
    return;
  }

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      usePKCE: true,
      redirectUri: makeRedirectUri({
        native: "myapp://",
      }),
    },
    discovery
  );

  useEffect(() => {
    const exchange = async (code: string) => {
      if (!request) {
        Alert.alert("Error", "No request");
        console.error("No request");
        return;
      }

      try {
        const exchangeTokenResponse = await exchangeCodeAsync(
          {
            clientId,
            code,
            redirectUri: makeRedirectUri({
              native: "myapp://",
            }),
            extraParams: {
              code_verifier: request.codeVerifier || "",
            },
          },
          discovery
        );

        setAuthTokens(exchangeTokenResponse);

        await AsyncStorage.setItem(
          "accessToken",
          exchangeTokenResponse.accessToken
        );
      } catch (error) {
        Alert.alert("Error", "error");
        console.error("error", error);
      }
    };

    if (response?.type === "success") {
      exchange(response.params.code);
    }
  }, [discovery, request, response]);

  const handleRefresh = async () => {
    if (!authTokens) {
      Alert.alert("Error", "No tokens to refresh");
      return;
    }

    if (!authTokens.refreshToken) {
      console.error("No refreshToken");
      return;
    }

    if (!clientId) {
      Alert.alert("Error", "No clientId");
      return;
    }

    try {
      const tokenResponse = await authTokens.refreshAsync(
        { clientId },
        discovery
      );

      setAuthTokens(new TokenResponse(tokenResponse));

      await AsyncStorage.setItem("accessToken", tokenResponse.accessToken);
    } catch (error) {
      Alert.alert("Error", "Refresh error");
      console.error("Refresh error", error);
    }
  };

  const handleRevoke = async () => {
    if (!authTokens?.accessToken) {
      console.error("No accessToken to revoke");
      return;
    }

    try {
      const isRevoked = await revokeAsync(
        {
          token: authTokens.accessToken,
          tokenTypeHint: TokenTypeHint.AccessToken,
          clientId,
          clientSecret,
        },
        discovery
      );

      if (isRevoked) {
        setAuthTokens(null);
      }

      await AsyncStorage.removeItem("accessToken");
    } catch (error) {
      console.error("Revoke error", error);
    }
  };

  const handleLogout = async () => {
    if (!discovery.endSessionEndpoint) {
      console.error("Logout endpoint not available");
      return;
    }

    // Generate the post-logout redirect URI
    const postLogoutRedirectUri = makeRedirectUri({
      native: "myapp://", // Replace "myapp" with your app's scheme
    });

    // Construct the logout URL
    const logoutUrl = `${
      discovery.endSessionEndpoint
    }?post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;

    try {
      // Open the logout URL in the browser
      await WebBrowser.openBrowserAsync(logoutUrl);

      // Clear tokens and notify the user
      setAuthTokens(null);

      await AsyncStorage.removeItem("accessToken");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>OSP Authentication</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            promptAsync();
          }}
        >
          <Text style={styles.buttonText}>Connect to OSP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={handleRefresh}
        >
          <Text style={styles.buttonText}>Refresh Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.revokeButton]}
          onPress={handleRevoke}
        >
          <Text style={styles.buttonText}>Revoke Token</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
        <TokenTable tokens={authTokens} />
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
  noTokens: {
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    marginTop: 8,
  },
  table: {
    width: "100%",
    marginTop: 12,
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
  alternateRow: {
    backgroundColor: "#f7f7f7",
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
});
