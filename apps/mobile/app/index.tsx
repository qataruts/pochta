import { Redirect } from "expo-router";
import { useAuth } from "../contexts";

/** Entry gate: route to the messenger, unlock, or first-run onboarding. */
export default function Index() {
  const { identity, hasVault } = useAuth();
  if (identity) return <Redirect href="/chats" />;
  return <Redirect href={hasVault ? "/onboarding/unlock" : "/onboarding/welcome"} />;
}
