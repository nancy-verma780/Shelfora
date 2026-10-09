import { memo, type ReactElement } from "react";
import type { Camera, PackShape, Product } from "../types";

/**
 * Draws a simulated CCTV view of a shelf section from the current product state,
 * with detection boxes on top. In production this would be the RTSP frame and the
 * YOLO boxes returned by the vision service; here both come from mock data, so the
 * picture always agrees with the numbers elsewhere in the app.
 */

const W = 960;
const H = 540;
const TOP = 58;
const BOTTOM = 44;
const SIDE = 22;

const SHAPE: Record<PackShape, { w: number; h: number }> = {
  bottle: { w: 0.2, h: 0.78 }, jug: { w: 0.3, h: 0.8 }, can: { w: 0.19, h: 0.46 },
  pack: { w: 0.34, h: 0.6 }, box: { w: 0.3, h: 0.58 }, carton: { w: 0.27, h: 0.72 },
  tub: { w: 0.3, h: 0.36 }, tube: { w: 0.2, h: 0.66 }, bar: { w: 0.34, h: 0.3 }, jar: { w: 0.26, h: 0.5 },
};

const BOX = { in_stock: "#45d39b", low_stock: "#ffb547", out_of_stock: "#ff6b5b" };

export function Pack({ shape, x, y, w, h, color }: { shape: PackShape; x: number; y: number; w: number; h: number; color: string }) {
  const label = <rect x={x + w * 0.12} y={y + h * 0.45} width={w * 0.76} height={h * 0.2} rx={2} fill="#fff" opacity={0.55} />;
  switch (shape) {
    case "bottle":
    case "jug":
      return (
        <g>
          <rect x={x + w * 0.34} y={y} width={w * 0.32} height={h * 0.08} rx={1.5} fill="#2a2f2d" />
          <path d={`M${x + w * 0.36} ${y + h * 0.08} h${w * 0.28} q${w * 0.02} ${h * 0.14} ${w * 0.32} ${h * 0.24} v${h * 0.66} q0 ${h * 0.02} -${w * 0.06} ${h * 0.02} h-${w * 0.8} q-${w * 0.06} 0 -${w * 0.06} -${h * 0.02} v-${h * 0.66} q${w * 0.3} -${h * 0.1} ${w * 0.32} -${h * 0.24}z`} fill={color} />
          {label}
          <rect x={x + w * 0.16} y={y + h * 0.36} width={w * 0.1} height={h * 0.5} rx={2} fill="#fff" opacity={0.18} />
        </g>
      );
    case "can":
      return (
        <g>
          <rect x={x} y={y + 2} width={w} height={h - 2} rx={3} fill={color} />
          <ellipse cx={x + w / 2} cy={y + 3} rx={w / 2} ry={3} fill="#e8ece9" opacity={0.8} />
          {label}
        </g>
      );
    case "carton":
      return (
        <g>
          <path d={`M${x} ${y + h * 0.16} L${x + w / 2} ${y} L${x + w} ${y + h * 0.16} V${y + h} H${x} Z`} fill={color} />
          <rect x={x} y={y + h * 0.16} width={w} height={h * 0.05} fill="#000" opacity={0.15} />
          {label}
        </g>
      );
    case "tub":
      return (
        <g>
          <path d={`M${x} ${y + 4} H${x + w} L${x + w * 0.9} ${y + h} H${x + w * 0.1} Z`} fill={color} />
          <rect x={x - 1} y={y} width={w + 2} height={5} rx={2} fill="#eef1ef" />
        </g>
      );
    case "tube":
      return (
        <g>
          <rect x={x} y={y + 3} width={w} height={h - 3} rx={3} fill={color} />
          <ellipse cx={x + w / 2} cy={y + 4} rx={w / 2} ry={3.5} fill="#2a2f2d" />
          {label}
        </g>
      );
    case "pack":
      return (
        <g>
          <path d={`M${x + 2} ${y + 5} Q${x + w / 2} ${y - 2} ${x + w - 2} ${y + 5} L${x + w} ${y + h - 4} Q${x + w / 2} ${y + h + 2} ${x} ${y + h - 4} Z`} fill={color} />
          <path d={`M${x + 3} ${y + 6} H${x + w - 3}`} stroke="#000" strokeOpacity={0.2} strokeWidth={2} strokeDasharray="2 2" />
          <ellipse cx={x + w / 2} cy={y + h * 0.55} rx={w * 0.3} ry={h * 0.16} fill="#fff" opacity={0.5} />
        </g>
      );
    case "bar":
      return (
        <g>
          <rect x={x} y={y} width={w} height={h * 0.48} rx={2} fill={color} />
          <rect x={x} y={y + h * 0.52} width={w} height={h * 0.48} rx={2} fill={color} />
          <rect x={x + w * 0.15} y={y + h * 0.14} width={w * 0.7} height={h * 0.18} rx={1} fill="#fff" opacity={0.45} />
          <rect x={x + w * 0.15} y={y + h * 0.66} width={w * 0.7} height={h * 0.18} rx={1} fill="#fff" opacity={0.45} />
        </g>
      );
    default:
      return (
        <g>
          <rect x={x} y={y} width={w} height={h} rx={2} fill={color} />
          <rect x={x} y={y + h * 0.18} width={w} height={h * 0.12} fill="#fff" opacity={0.35} />
          {label}
        </g>
      );
  }
}

interface Props {
  camera: Camera;
  products: Product[];
  mode?: "full" | "thumb";
  focusId?: string | null;
  onSelect?: (id: string) => void;
}

function FeedImpl({ camera, products, mode = "full", focusId, onSelect }: Props) {
  const rows = camera.racks;
  const rowH = (H - TOP - BOTTOM) / rows.length;
  const full = mode === "full";
  const uid = `${camera.id}-${mode}`;
  const packs: ReactElement[] = [];
  const boxes: ReactElement[] = [];

  rows.forEach((rack, ri) => {
    const items = products.filter((p) => p.shelf === rack);
    const y0 = TOP + ri * rowH;
    const boardY = y0 + rowH - 12;
    const slotW = (W - SIDE * 2) / Math.max(items.length, 1);

    items.forEach((p, i) => {
      const sx = SIDE + i * slotW;
      const s = SHAPE[p.shape];
      const ph = Math.min(rowH * s.h, rowH - 20);
      const pw = Math.min(rowH * s.w, slotW * 0.42);
      const gap = Math.max(2, pw * 0.08);
      const maxF = Math.max(2, Math.floor((slotW - 10) / (pw + gap)));
      const filled = p.estimatedStock <= 0 ? 0 : Math.max(1, Math.round((p.estimatedStock / p.shelfCapacity) * maxF));
      const startX = sx + 6;
      for (let f = 0; f < filled; f++) {
        packs.push(<Pack key={`${p.id}-${f}`} shape={p.shape} x={startX + f * (pw + gap)} y={boardY - ph} w={pw} h={ph} color={p.color} />);
      }
      // price tag on shelf edge
      packs.push(<rect key={`${p.id}-tag`} x={sx + 6} y={boardY + 2} width={Math.min(26, slotW * 0.3)} height={8} rx={1} fill="#f4f6f4" opacity={0.85} />);

      // detection box
      const empty = filled === 0;
      const bx = empty ? sx + 4 : startX - 3;
      const bw = empty ? slotW - 8 : filled * (pw + gap) - gap + 6;
      const by = boardY - ph - 4;
      const bh = ph + 6;
      const color = BOX[p.stockStatus];
      const isFocus = focusId === p.id;
      const showTag = full && (p.stockStatus !== "in_stock" || p.isFastMover || isFocus);
      const tag = `${p.name.replace(/\s\d.*$/, "")}${p.stockStatus === "out_of_stock" ? " · empty" : p.stockStatus === "low_stock" ? " · low" : ""}`;
      const tagW = Math.min(tag.length * 6.1 + 12, 220);
      const tagY = by - 17 < y0 + 2 ? by + 2 : by - 17;
      boxes.push(
        <g
          key={`${p.id}-box`}
          className={full ? "det cursor-pointer" : undefined}
          onClick={full && onSelect ? () => onSelect(p.id) : undefined}
          role={full ? "button" : undefined}
          aria-label={full ? `${p.name}, ${p.stockStatus.replace(/_/g, " ")}` : undefined}
        >
          {full && <rect x={bx} y={by} width={bw} height={bh} fill="transparent" />}
          {empty && <rect x={bx} y={by} width={bw} height={bh} fill={color} opacity={0.1} />}
          <rect
            x={bx} y={by} width={bw} height={bh} rx={3} fill="none" stroke={color}
            strokeWidth={isFocus ? 3 : full ? 1.6 : 1.4}
            strokeDasharray={empty ? "6 4" : undefined}
            className={isFocus ? "focus-box" : undefined}
            opacity={full ? 0.95 : 0.85}
          />
          {full && (
            <g className={showTag ? "" : "det-tag"} style={showTag ? undefined : { opacity: 0 }}>
              <rect x={bx} y={tagY} width={tagW} height={15} rx={3} fill="#0d1311" opacity={0.82} />
              <rect x={bx} y={tagY} width={3} height={15} rx={1} fill={color} />
              <text x={bx + 8} y={tagY + 11} fontSize={10.5} fontFamily="Inter, system-ui, sans-serif" fontWeight={600} fill="#fff">{tag}</text>
            </g>
          )}
        </g>,
      );
    });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden={!full}>
      <defs>
        <linearGradient id={`wall-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a4340" />
          <stop offset="1" stopColor="#262d2b" />
        </linearGradient>
        <radialGradient id={`vig-${uid}`} cx="50%" cy="48%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
        <filter id={`cctv-${uid}`}>
          <feColorMatrix type="saturate" values="0.62" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.92" intercept="0.02" />
            <feFuncG type="linear" slope="0.97" intercept="0.03" />
            <feFuncB type="linear" slope="0.95" intercept="0.03" />
          </feComponentTransfer>
        </filter>
        <filter id={`noise-${uid}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={camera.id.length + rows.length} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <g filter={`url(#cctv-${uid})`}>
        <rect width={W} height={H} fill={`url(#wall-${uid})`} />
        {/* ceiling light strip */}
        <rect x={0} y={0} width={W} height={TOP - 8} fill="#1b201f" />
        <rect x={W * 0.18} y={6} width={W * 0.64} height={6} rx={3} fill="#e9efe9" opacity={0.55} />
        {rows.map((r, ri) => {
          const y0 = TOP + ri * rowH;
          const boardY = y0 + rowH - 12;
          return (
            <g key={r}>
              <rect x={SIDE - 8} y={y0 + 4} width={W - SIDE * 2 + 16} height={rowH - 10} fill="#000" opacity={0.18} />
              <rect x={SIDE - 10} y={boardY} width={W - SIDE * 2 + 20} height={12} fill="#c9cfcb" />
              <rect x={SIDE - 10} y={boardY + 10} width={W - SIDE * 2 + 20} height={3} fill="#000" opacity={0.35} />
            </g>
          );
        })}
        {packs}
        <rect x={0} y={H - BOTTOM} width={W} height={BOTTOM} fill="#4b524f" />
      </g>
      <rect width={W} height={H} filter={`url(#noise-${uid})`} className="cctv-noise" />
      <rect width={W} height={H} fill={`url(#vig-${uid})`} />
      <g>{boxes}</g>
    </svg>
  );
}

export const CameraFeed = memo(FeedImpl);
