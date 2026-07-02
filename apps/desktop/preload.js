// The bridge that makes the Host switch real. In a plain browser `window.pochta`
// is undefined, so the web client stays a pure client — only the desktop app can
// host. There is ONE role: a host helps run the network (carries its own circle's
// sealed mail, and forwards encrypted traffic for big meetings when its connection
// can spare it). A host only ever sees ciphertext. contextIsolation-safe.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pochta", {
  isDesktop: true,
  platform: process.platform,

  // Host = help run the network. start() spawns the bundled relay and resolves
  // with { running, port }.
  host: {
    start: () => ipcRenderer.invoke("host:start"),
    stop: () => ipcRenderer.invoke("host:stop"),
    status: () => ipcRenderer.invoke("host:status"),
  },

  // Live pushes when host status changes. Returns an unsubscribe fn.
  onStatus: (cb) => {
    const handler = (_e, s) => cb(s);
    ipcRenderer.on("pochta:status", handler);
    return () => ipcRenderer.removeListener("pochta:status", handler);
  },

  // OS-keychain-backed store for account vaults (Electron safeStorage). Synchronous
  // so it can back the SDK's KVStore; only the sensitive chat.vault.* keys use it.
  secureStore: {
    get: (key) => ipcRenderer.sendSync("secure:get", key),
    set: (key, value) => ipcRenderer.sendSync("secure:set", key, value),
    remove: (key) => ipcRenderer.sendSync("secure:remove", key),
  },
});
