import { useState } from "react";
import { router } from "expo-router";
import { Button, Centered, Input, Link, Screen, Text } from "../../components";
import { useLocales } from "../../locales";
import { useAuth } from "../../contexts";

export default function Unlock() {
  const { t, toggle } = useLocales();
  const { vault, setIdentity, reset } = useAuth();
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock() {
    setBusy(true);
    const id = await vault.unlock(pass);
    setBusy(false);
    if (id) {
      setIdentity(id);
      router.replace("/chats");
    } else {
      setError(t("onboarding.wrongPassphrase"));
    }
  }

  return (
    <Screen>
      <Centered>
        <Text variant="brand">{t("onboarding.welcomeBack")}</Text>
        <Text variant="muted">{t("onboarding.unlockSub")}</Text>
        <Input
          secureTextEntry
          placeholder={t("onboarding.passphrase")}
          value={pass}
          onChangeText={(v) => {
            setPass(v);
            setError("");
          }}
          onSubmitEditing={unlock}
        />
        {!!error && <Text variant="error">{error}</Text>}
        <Button title={busy ? t("onboarding.unlocking") : t("onboarding.unlock")} onPress={unlock} busy={busy} />
        <Link
          title={t("onboarding.forgotRestore")}
          onPress={() => {
            reset();
            router.replace("/onboarding/welcome");
          }}
        />
        <Link title={t("settings.toggleLanguage")} onPress={toggle} />
      </Centered>
    </Screen>
  );
}
