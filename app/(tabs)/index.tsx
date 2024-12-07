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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const discovery: DiscoveryDocument = {
  authorizationEndpoint:
    "https://ospdev-api.astra.co.id/api/centralize-user-management/auth/authorize",
  tokenEndpoint:
    "https://ospdev-api.astra.co.id/api/centralize-user-management/auth/token",
  revocationEndpoint:
    "https://ospdev-api.astra.co.id/api/centralize-user-management/auth/revoke",
  userInfoEndpoint:
    "https://ospdev-api.astra.co.id/api/centralize-user-management/client/user-info",
  endSessionEndpoint:
    "https://ospdev-api.astra.co.id/api/centralize-user-management/auth/logout",
};

export default function Home() {
  const [authTokens, setAuthTokens] = useState<TokenResponse | null>(null);
  const clientId = process.env.EXPO_PUBLIC_CLIENT_ID;

  if (!clientId) {
    console.error("No client id");
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
        console.error("error", error);
      }
    };

    if (response?.type === "success") {
      exchange(response.params.code);
    }
  }, [discovery, request, response]);

  const handleRefresh = async () => {
    if (!authTokens?.refreshToken) {
      console.error("No refreshToken");
      return;
    }

    try {
      const tokenResponse = await authTokens.refreshAsync(
        {
          clientId,
          clientSecret: "jo7MIT1CctWmCFMfvjQDLx4l5wpG-FCp",
        },
        discovery
      );

      setAuthTokens(new TokenResponse(tokenResponse));

      await AsyncStorage.setItem("accessToken", tokenResponse.accessToken);
    } catch (error) {
      console.error("Refresh error", error);
    }
  };

  const handleRevoke = async () => {
    if (!authTokens) {
      console.error("No authTokens to revoke");
      return;
    }

    if (!authTokens.accessToken) {
      console.error("No accessToken to revoke");
      return;
    }

    try {
      const isRevoked = await revokeAsync(
        {
          token: authTokens.accessToken,
          tokenTypeHint: TokenTypeHint.AccessToken,
          clientId,
          clientSecret: "jo7MIT1CctWmCFMfvjQDLx4l5wpG-FCp",
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

        <Text style={styles.infoTitle}>Auth Tokens:</Text>
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenText}>
            {JSON.stringify(authTokens, null, 2) || "No tokens yet."}
          </Text>
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