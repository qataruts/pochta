import { useRef } from "react";
import { useLocales } from "../locales";

export function Composer({
  draft,
  recording,
  onDraftChange,
  onSubmit,
  onToggleRecording,
  onFilePicked,
}: {
  draft: string;
  recording: boolean;
  onDraftChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleRecording: () => void;
  onFilePicked: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { t } = useLocales();
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={onFilePicked} />
      <form className="composer" onSubmit={onSubmit}>
        <button
          type="button"
          className="attach"
          title={t("chat.attachImage")}
          onClick={() => fileInputRef.current?.click()}
        >
          📎
        </button>
        <button
          type="button"
          className={`mic ${recording ? "recording" : ""}`}
          title={recording ? t("chat.stopSend") : t("chat.recordVoice")}
          onClick={onToggleRecording}
        >
          {recording ? "⏹" : "🎤"}
        </button>
        <input
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={recording ? t("chat.recordingHint") : t("chat.typeMessage")}
          disabled={recording}
          autoFocus
        />
        <button type="submit" disabled={!draft.trim()}>
          {t("chat.send")}
        </button>
      </form>
    </>
  );
}
