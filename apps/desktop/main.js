const { app, BrowserWindow, shell, session, ipcMain, safeStorage } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");
const net = require("node:net");
const crypto = require("node:crypto");

// Vox desktop is a CLIENT by default — it just loads the web client. No relay
// runs until you turn Host on. There is ONE role: a host helps run the network —
// its own circle's sealed mail, and (roadmap) forwarding for big meetings when its
// connection can spare it. This is the old-Skype idea (any machine can be a host so
// the network needs no central servers) but fixed: hosting is opt-in, offered not
// forced, visible, and end-to-end encrypted so a host only ever sees ciphertext.
// Electron (Chromium) gives WebRTC parity across Windows/macOS/Linux.

const isDev = !app.isPackaged;
const winBin = process.platform === "win32";

// --- Host role: the bundled relay, started on demand -----------------------

let relay = null; // child process, or null when Host is off
let relayPort = 0;

function hostStatus() {
  return { running: !!relay, port: relay ? relayPort : null };
}

function broadcastStatus() {
  const payload = { host: hostStatus() };
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send("vox:status", payload);
}

// The bundled release binary: packaged → resources/vox/bin ; dev → repo build.
function relayBin() {
  const rel = winBin ? "bin/vox.bat" : "bin/vox";
  return app.isPackaged
    ? path.join(process.resourcesPath, "vox", rel)
    : path.join(__dirname, "..", "server", "_build", "prod", "rel", "vox", rel);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

function waitForPort(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect(port, "127.0.0.1");
      sock.once("connect", () => {
        sock.destroy();
        resolve();
      });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() > deadline) reject(new Error("relay did not start in time"));
        else setTimeout(tryOnce, 400);
      });
    };
    tryOnce();
  });
}

// Start the bundled relay with per-user data (SQLite + keys + a persisted secret).
async function startHost() {
  if (relay) return hostStatus();

  const data = app.getPath("userData");
  fs.mkdirSync(data, { recursive: true });

  const secretFile = path.join(data, "secret_key_base");
  let secret = "";
  try {
    secret = fs.readFileSync(secretFile, "utf8").trim();
  } catch {
    /* first run */
  }
  if (!secret) {
    secret = crypto.randomBytes(48).toString("base64");
    fs.writeFileSync(secretFile, secret);
  }

  const port = await freePort();
  const child = spawn(relayBin(), ["start"], {
    stdio: "inherit",
    env: {
      ...process.env,
      PHX_SERVER: "true",
      PORT: String(port),
      SECRET_KEY_BASE: secret,
      DATABASE_PATH: path.join(data, "chat.db"),
      RELAY_KEY_PATH: path.join(data, "relay_identity.key"),
    },
  });
  child.on("exit", () => {
    relay = null;
    relayPort = 0;
    broadcastStatus();
  });

  await waitForPort(port, 30000);
  relay = child;
  relayPort = port;
  broadcastStatus();
  return hostStatus();
}

function stopHost() {
  if (relay) relay.kill();
  relay = null;
  relayPort = 0;
  broadcastStatus();
  return hostStatus();
}

// --- IPC: the two switches -------------------------------------------------

ipcMain.handle("host:start", () => startHost());
ipcMain.handle("host:stop", () => stopHost());
ipcMain.handle("host:status", () => hostStatus());

// --- Secure store: account vaults wrapped by the OS keychain (safeStorage) ----
// The renderer's account seeds (chat.vault.*) are already PIN-encrypted; here we
// additionally seal the whole blob with an OS-protected key (macOS Keychain /
// Windows DPAPI / Linux libsecret), so copying the app's files is useless without
// the user's OS login. A leading byte marks whether the OS keychain was available
// (1) or we fell back to plaintext of the already-PIN-encrypted blob (0).
const secureFile = () => path.join(app.getPath("userData"), "secure.bin");

function readSecure() {
  try {
    const raw = fs.readFileSync(secureFile());
    if (raw[0] === 1 && safeStorage.isEncryptionAvailable())
      return JSON.parse(safeStorage.decryptString(raw.subarray(1)));
    return JSON.parse(raw.subarray(1).toString("utf8"));
  } catch {
    return {};
  }
}
function writeSecure(map) {
  const json = JSON.stringify(map);
  const body = safeStorage.isEncryptionAvailable()
    ? Buffer.concat([Buffer.from([1]), safeStorage.encryptString(json)])
    : Buffer.concat([Buffer.from([0]), Buffer.from(json, "utf8")]);
  fs.writeFileSync(secureFile(), body);
}
ipcMain.on("secure:get", (e, key) => {
  e.returnValue = readSecure()[key] ?? null;
});
ipcMain.on("secure:set", (e, key, value) => {
  const m = readSecure();
  m[key] = value;
  writeSecure(m);
  e.returnValue = true;
});
ipcMain.on("secure:remove", (e, key) => {
  const m = readSecure();
  delete m[key];
  writeSecure(m);
  e.returnValue = true;
});

// --- Window ----------------------------------------------------------------

const DEV_URL = process.env.VOX_DEV_URL || "http://localhost:5180";
const clientEntry = () => path.join(process.resourcesPath, "web", "index.html");

function createWindow() {
  const win = new BrowserWindow({
    width: 1040,
    height: 720,
    minWidth: 380,
    minHeight: 560,
    title: "Vox",
    backgroundColor: "#0f1115",
    icon: path.join(__dirname, "build", "icon.png"),
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true },
  });

  if (isDev) win.loadURL(DEV_URL);
  else win.loadFile(clientEntry());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Smoke check for CI: quit right after the client renders.
  if (process.env.VOX_SMOKE) {
    win.webContents.once("did-finish-load", () => {
      setTimeout(() => app.quit(), 500);
    });
  }
  return win;
}

app.whenReady().then(() => {
  // The window loads our own trusted client → allow camera/mic for calls.
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    cb(["media", "clipboard-read", "clipboard-sanitized-write", "notifications"].includes(permission));
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("before-quit", () => {
  app.isQuitting = true;
  if (relay) relay.kill();
});

app.on("window-all-closed", () => {
  if (relay) relay.kill();
  if (process.platform !== "darwin") app.quit();
});
