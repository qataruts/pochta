import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Vault, type Identity } from "@pochta-chat/sdk";
import { kv } from "../services/storage";

/** Session state: the unlocked identity + the on-device encrypted vault. */
interface Auth {
  vault: Vault;
  identity: Identity | null;
  hasVault: boolean;
  setIdentity: (id: Identity | null) => void;
  signOut: () => void;
  reset: () => void;
}

const Ctx = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const vault = useMemo(() => new Vault(kv), []);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [hasVault, setHasVault] = useState(vault.has());

  const value: Auth = {
    vault,
    identity,
    hasVault,
    setIdentity,
    signOut: () => setIdentity(null),
    reset: () => {
      vault.clear();
      setHasVault(false);
      setIdentity(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
