# Vox mobile (Expo Router)

The Vox messenger on **iOS + Android**, built on the published
[`@elementaio/vox-sdk`](https://www.npmjs.com/package/@elementaio/vox-sdk) — the same core
the web and desktop apps use. **Expo SDK 57 · Expo Router · English/Arabic (RTL).**
Fork it to ship your own branded app.

## Status

- ✅ **Onboarding + messenger, type-clean** — create/restore a self-owned identity
  into an encrypted vault, connect to a relay, add contacts by invite, and chat.
  Reuses the SDK `Client`. `tsc` passes against Expo/RN/SDK types (run on a
  device/simulator to see it live).
- ✅ **Dual language (English + Arabic, RTL)** via i18next — strings in `locales/`.
- ⏭️ **Next:** voice/video via `react-native-webrtc` (dev build), media, push,
  keychain-derived MMKV key.

## Structure (Expo Router + atomic)

File-based routing with route groups; small, single-purpose files.

```
app/                       Expo Router routes
  _layout.tsx              root: crypto polyfill + i18n init + providers + Stack
  index.tsx                entry gate → onboarding or messenger
  onboarding/              welcome.tsx · unlock.tsx  (+ _layout)
  (main)/                  auth-guarded group (MessengerProvider)
    chats.tsx              relay setup / contact list
    chat/[pubkey].tsx      a conversation
components/
  ui/                      atoms: Screen · Button · Input · Text · Link
  MessageBubble · Composer · ContactRow        feature components
contexts/                  AuthContext (session) · MessengerContext (SDK Client)
locales/                   en.json · ar.json · i18n.ts · useLocales.ts
services/storage.ts        MMKV-backed KVStore + Store + query helpers for the SDK
constants/theme.ts         design tokens
```

## Run it

```sh
cd apps/mobile
npm install
npx expo run:ios      # or: npx expo run:android   (a dev build — MMKV/WebRTC are native)
```

On first launch: create an account, then enter your Vox relay address. Identity
and history stay on the device.

## Security note

The MMKV `encryptionKey` in `services/storage.ts` is a constant for now — before
shipping, derive it from the OS keychain (iOS Keychain / Android Keystore) so the
on-device store is protected by a hardware-backed key.
