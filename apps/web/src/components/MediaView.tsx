import { useEffect, useState } from "react";
import type { Client } from "../lib/client";
import type { MediaRef } from "../lib/db";
import { useLocales } from "../locales";

// Session cache of decrypted media → object URLs (avoids re-download per render).
const mediaCache = new Map<string, string>();

export function MediaView({ media, client }: { media: MediaRef; client: Client | null }) {
  const { t } = useLocales();
  const [url, setUrl] = useState<string | null>(mediaCache.get(media.blobId) ?? null);
  useEffect(() => {
    if (url || !client) return;
    let cancelled = false;
    client
      .fetchMedia(media)
      .then((bytes) => {
        if (cancelled) return;
        const objUrl = URL.createObjectURL(
          new Blob([bytes as unknown as BlobPart], { type: media.mime }),
        );
        mediaCache.set(media.blobId, objUrl);
        setUrl(objUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media.blobId]);

  if (media.mkind === "image") {
    return url ? (
      <img className="media-img" src={url} alt="" />
    ) : (
      <div className="media-loading">{t("chat.loadingImg")}</div>
    );
  }
  if (media.mkind === "audio") {
    return url ? (
      <audio className="media-audio" controls src={url} />
    ) : (
      <div className="media-loading">{t("chat.loadingAudio")}</div>
    );
  }
  // generic file → download link
  return url ? (
    <a className="media-file" href={url} download={media.name || "file"}>
      📄 {media.name || "file"}
    </a>
  ) : (
    <div className="media-loading">{t("chat.loadingFile")}</div>
  );
}
