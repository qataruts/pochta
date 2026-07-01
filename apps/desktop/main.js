const { app, BrowserWindow, shell, session } = require("electron");
const path = require("node:path");

// Pochta desktop = the web client in a native Electron (Chromium) window, chosen
// over Tauri so WebRTC (voice/video) + getUserMedia (camera/mic) behave the same
// on Windows, macOS, and Linux. The client connects to whatever relay you pick.

const isDev = !app.isPackaged;
const DEV_URL = process.env.POCHTA_DEV_URL || "http://localhost:5180";

// Packaged: the web build is copied into the app resources (see electron-builder
// `extraResources` in package.json).
const clientEntry = () => path.join(process.resourcesPath, "web", "index.html");

function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 380,
    minHeight: 560,
    title: "Pochta",
    backgroundColor: "#0b0d12",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
    },
  });

  if (isDev) win.loadURL(DEV_URL);
  else win.loadFile(clientEntry());

  // Keep the app on the client; open external links in the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Smoke check for CI/headless: quit once the client loads.
  if (process.env.POCHTA_SMOKE) {
    win.webContents.once("did-finish-load", () => {
      console.log("SMOKE_OK: client loaded");
      setTimeout(() => app.quit(), 200);
    });
    win.webContents.once("did-fail-load", (_e, code, desc) => {
      console.log("SMOKE_FAIL:", code, desc);
      app.exit(1);
    });
  }

  return win;
}

app.whenReady().then(() => {
  // The window only ever loads our own trusted client, so allow the media
  // permission it needs for calls (camera/mic) instead of silently denying.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(["media", "clipboard-read", "clipboard-sanitized-write", "notifications"].includes(permission));
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
