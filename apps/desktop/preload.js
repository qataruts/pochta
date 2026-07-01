// Minimal preload: the Pochta web client runs unchanged in the desktop window.
// Reserved for native integrations later (OS notifications, keychain-backed key
// storage, deep links) — kept tiny and contextIsolation-safe for now.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("pochtaDesktop", {
  version: "0.1.0",
  platform: process.platform,
});
