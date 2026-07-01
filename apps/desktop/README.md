# Pochta desktop (Electron)

The Pochta messenger as a native desktop window for **Windows, macOS, and Linux**.

## Why Electron (not Tauri)

Pochta has **voice/video calls (WebRTC)** and camera/mic access (`getUserMedia`).
Tauri renders in the OS webview — WKWebView / WebView2 / **WebKitGTK on Linux** —
and WebKitGTK's WebRTC/`mediaDevices` support is inconsistent, which a calls app
can't rely on. Electron bundles **Chromium**, so WebRTC behaves identically on all
three platforms. We trade a larger download for calls that actually connect.

It's a thin shell: it loads the **same web client** the relay serves, and adds a
media-permission handler (camera/mic) plus "open external links in the browser".
Native integrations (OS notifications, keychain key storage, deep links) are the
next iteration via `preload.js`.

## Run in development

```sh
pnpm --filter web dev      # Vite client on :5180 (in one terminal)
cd apps/desktop
npm install                # Electron + electron-builder
npm run dev                # opens the desktop window pointed at :5180
```

## Build installers

```sh
cd apps/desktop
npm install
npm run dist               # builds the web client, then packages with electron-builder
# → out/ contains the .dmg (macOS) / .exe (Windows) / .AppImage (Linux)
```

electron-builder must run **on** (or cross-build for) each target OS; code-signing
+ notarization are needed for distribution. The web build is bundled into the app
(`extraResources`), so the desktop app ships the client offline.

## First launch

The desktop client is a **frontend** — it connects to a Pochta **relay** you
choose. On first run, open the server picker and enter your relay address
(e.g. `wss://chat.myfamily.com`), or run your own relay (see the repo README →
"Run your own"). Your identity and history stay on the device, as always.

> Status: scaffold verified to the config/syntax level here; building and running
> the GUI needs a desktop session (and signing for distribution).
