/**
 * Typed access to the desktop bridge (`window.vox`, injected by the Electron
 * preload). In a browser this is absent, so the web/mobile builds stay pure
 * clients — hosting is desktop-only. There is ONE role: a host helps run the
 * network (its own circle's sealed mail, and forwarding for big meetings when its
 * connection can spare it). It only ever sees ciphertext.
 */

export interface HostStatus {
  running: boolean;
  port: number | null;
}

export interface NetworkStatus {
  host: HostStatus;
}

export interface DesktopBridge {
  isDesktop: boolean;
  platform: string;
  host: {
    start(): Promise<HostStatus>;
    stop(): Promise<HostStatus>;
    status(): Promise<HostStatus>;
  };
  onStatus(cb: (s: NetworkStatus) => void): () => void;
}

/** The bridge if we're inside the desktop app, otherwise null (browser/mobile). */
export function desktop(): DesktopBridge | null {
  const w = globalThis as unknown as { vox?: DesktopBridge };
  return w.vox?.isDesktop ? w.vox : null;
}
