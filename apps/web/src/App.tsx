import { useEffect, useRef, useState } from "react";
import { createIdentity } from "@elementaio/vox-sdk";
import {
  autoUnlock,
  clearSession,
  listAccounts,
  removeAccount,
  saveSession,
  type AccountRef,
  type Identity,
} from "./lib/identity";
import { removePasskey } from "./lib/passkey";
import { setDbKey, deleteAccountData } from "./lib/db";
import { meetingRoomFromUrl, clearMeetingUrl } from "./lib/meeting";
import Welcome from "./Welcome";
import Unlock from "./Unlock";
import AccountPicker from "./AccountPicker";
import Meeting from "./Meeting";
import Messenger from "./Messenger";
import AdminPanel from "./AdminPanel";
import "./App.css";

export default function App() {
  // The relay admin panel is a separate route — no user identity involved.
  if (location.pathname === "/admin" || new URLSearchParams(location.search).has("admin")) {
    return <AdminPanel />;
  }
  return <Main />;
}

function Main() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [chosen, setChosen] = useState<AccountRef | null>(null); // account being unlocked
  const [adding, setAdding] = useState(false); // creating / restoring a new one
  const [tick, setTick] = useState(0); // force a re-list after add / remove

  // Ask the browser to keep our storage durable (it's the only copy of history).
  useEffect(() => {
    void navigator.storage?.persist?.();
  }, []);

  // Effortless launch: on desktop, if an account is kept signed in, open straight
  // to it — no picker, no PIN. (No-op on the web, where a lock is always required.)
  useEffect(() => {
    const id = autoUnlock();
    if (id) ready(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A meeting link (`?meet=<id>`) takes over the whole screen — a signed-in user
  // joins with their identity; a guest joins with a throwaway one (no account).
  const [meetRoom, setMeetRoom] = useState<string | null>(meetingRoomFromUrl());
  const guestRef = useRef<Identity | null>(null);
  if (meetRoom) {
    if (identity) {
      return (
        <Meeting
          roomId={meetRoom}
          identity={identity}
          guest={false}
          onExit={() => {
            clearMeetingUrl();
            setMeetRoom(null);
          }}
        />
      );
    }
    if (!guestRef.current) guestRef.current = createIdentity();
    return (
      <Meeting
        roomId={meetRoom}
        identity={guestRef.current}
        guest
        onExit={() => {
          clearMeetingUrl();
          location.reload();
        }}
      />
    );
  }

  const accounts = listAccounts();
  void tick;

  // Unlocking / creating hands us the in-memory identity; select this account's own
  // encrypted database, and keep it signed in (desktop) for a no-PIN next launch.
  function ready(id: Identity) {
    setDbKey(id.privateKey, id.publicKeyHex);
    saveSession(id);
    setIdentity(id);
    setAdding(false);
    setChosen(null);
  }

  // Sign out returns to the picker and re-locks (clears the kept-signed-in session).
  // It does NOT wipe — each account's data stays encrypted on the device.
  function signOut() {
    if (identity) clearSession(identity.publicKeyHex);
    setIdentity(null);
    setChosen(null);
  }

  function forget(pubkey: string) {
    removeAccount(pubkey);
    removePasskey(pubkey);
    clearSession(pubkey);
    void deleteAccountData(pubkey);
    setChosen(null);
    setTick((t) => t + 1);
  }

  if (identity)
    return (
      <Messenger
        identity={identity}
        onSignOut={signOut}
        onStartMeeting={(id) => {
          history.pushState(null, "", "?meet=" + id);
          setMeetRoom(id);
        }}
      />
    );
  if (adding || accounts.length === 0) {
    return <Welcome onReady={ready} onBack={accounts.length ? () => setAdding(false) : undefined} />;
  }
  if (chosen) return <Unlock account={chosen} onReady={ready} onBack={() => setChosen(null)} />;
  return (
    <AccountPicker accounts={accounts} onPick={setChosen} onAdd={() => setAdding(true)} onForget={forget} />
  );
}
