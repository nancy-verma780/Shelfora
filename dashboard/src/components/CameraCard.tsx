import { Wifi } from "lucide-react";
import { useNow } from "../hooks/useNow";
import type { Camera, Product } from "../types";
import { CameraFeed } from "./CameraFeed";
import { cx } from "./ui";

function stamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Camera tile with the usual DVR chrome: live dot, camera name, burned-in timestamp. */
export function CameraCard({
  camera, products, mode = "thumb", focusId, onSelect, loading, scanKey, imageSrc,
}: {
  camera: Camera; products: Product[]; mode?: "full" | "thumb"; focusId?: string | null;
  onSelect?: (id: string) => void; loading?: boolean; scanKey?: string; imageSrc?: string | null;
}) {
  const full = mode === "full";
  const now = useNow(full ? 1000 : 60000);
  return (
    <div className={cx("relative overflow-hidden bg-[#1a201e]", full ? "aspect-[16/10] rounded-2xl sm:aspect-video" : "aspect-video rounded-xl")}>
      {(
        <>
          <div className={cx("cam-view absolute inset-0", loading && "cam-switching")}>
          {imageSrc ? (
            <img src={imageSrc} alt={`${camera.label} live frame with detections`} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <CameraFeed camera={camera} products={products} mode={mode} focusId={focusId} onSelect={onSelect} />
          )}
          </div>
          {loading && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white/85">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white/80" /> Switching to {camera.label}…
              </span>
            </div>
          )}
          {full && !loading && <div key={scanKey} className="scan-line pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-[#45d39b]/15 to-transparent" />}
        </>
      )}
      <div className={cx("pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between", full ? "p-3 sm:p-4" : "p-2")}>
        <div className="flex items-center gap-2">
          <span className={cx("inline-flex items-center gap-1.5 rounded-md bg-black/55 font-semibold text-white", full ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[10px]")}>
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#ff4d4d]" /> LIVE
          </span>
          <span className={cx("rounded-md bg-black/55 font-medium text-white/90", full ? "px-2 py-1 text-xs" : "px-1.5 py-0.5 text-[10px]")}>
            {full ? `${camera.label} · ${camera.name}` : camera.label.replace("Camera ", "CAM ")}
          </span>
        </div>
        {full && <span className="font-cam rounded-md bg-black/45 px-2 py-1 text-[11px] text-white/85">{stamp(now)}</span>}
      </div>
      {full && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex items-end justify-between p-3 sm:p-4">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white/90">
            <Wifi className="h-3 w-3 text-[#45d39b]" /> Connected · {camera.resolution} · {camera.fps} fps
          </span>
          <span className="rounded-md bg-black/45 px-2 py-1 text-[11px] text-white/75">{imageSrc ? "Frame from Shelfora Vision server" : "Simulated feed and detections"}</span>
        </div>
      )}
    </div>
  );
}
