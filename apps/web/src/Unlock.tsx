import { useState } from "react";
import { unlockIdentity, type AccountRef, type Identity } from "./lib/identity";
import { hasPasskey, unlockWithPasskey } from "./lib/passkey";
import { useLocales } from "./locales";
import { PinInput } from "./PinInput";

/**
 * Unlock a chosen account. If a passkey is registered (Touch ID / Windows Hello),
 * offer it first — biometric, hardware-backed. The 6-digit PIN is always available
 * as the fallback. Both are device locks; forgetting them means signing back in with
 * the 12 words (via the picker's "add another account").
 */
export default function Unlock({
  account,
  onReady,
  onBack,
}: {
  account: AccountRef;
  onReady: (id: Identity) => void;
  onBack: () => void;
}) {
  const { t, toggle } = useLocales();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canBiometric = hasPasskey(account.pubkey);

  async function unlock(code: string) {
    setBusy(true);
    const id = await unlockIdentity(account.pubkey, code);
    setBusy(false);
    if (id) onReady(id);
    else {
      setError(t("onboarding.wrongPin"));
      setPin("");
    }
  }

  async function useBiometric() {
    setBusy(true);
    const id = await unlockWithPasskey(account.pubkey);
    setBusy(false);
    if (id) onReady(id);
    else setError(t("onboarding.biometricFailed"));
  }

  return (
    <div className="lobby">
      <div className="lobby-card">
        <div className="account-avatar big">{account.name.slice(0, 1).toUpperCase()}</div>
        <h1>{account.name}</h1>

        {canBiometric && (
          <button onClick={useBiometric} disabled={busy} style={{ marginBottom: 12 }}>
            {t("onboarding.unlockBiometric")}
          </button>
        )}
        <p className="sub">{canBiometric ? t("onboarding.orPin") : t("onboarding.unlockSub")}</p>
        <PinInput
          value={pin}
          onChange={(v) => {
            setPin(v);
            setError("");
          }}
          onComplete={(v) => void unlock(v)}
          autoFocus={!canBiometric}
        />
        {error && <p className="error">{error}</p>}
        {busy && <p className="sub">{t("onboarding.unlocking")}</p>}
        <button className="link" onClick={onBack} style={{ marginTop: 12 }}>
          {t("onboarding.backToAccounts")}
        </button>
        <button className="link" onClick={onBack}>
          {t("onboarding.forgotPin")}
        </button>
        <button className="link lang" onClick={toggle}>
          {t("settings.toggleLanguage")}
        </button>
      </div>
    </div>
  );
}
