import { Redirect, Stack } from "expo-router";
import { MessengerProvider, useAuth } from "../../contexts";

/** Authenticated area: guard the routes and provide the live SDK Client. */
export default function MainLayout() {
  const { identity } = useAuth();
  if (!identity) return <Redirect href="/" />;
  return (
    <MessengerProvider identity={identity}>
      <Stack screenOptions={{ headerShown: false }} />
    </MessengerProvider>
  );
}
