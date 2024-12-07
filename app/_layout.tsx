import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        statusBarBackgroundColor: "#1c1c1c",
      }}
    />
  );
}
