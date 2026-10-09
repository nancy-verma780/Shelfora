import type { PackShape } from "../types";
import { Pack } from "./CameraFeed";

interface Item { id: string; color: string; shape: PackShape; stockStatus: string; estimatedStock: number; shelfCapacity: number }

const SIZE: Record<PackShape, [number, number]> = {
  bottle: [9, 26], jug: [13, 27], can: [10, 16], pack: [16, 20], box: [15, 19], carton: [11, 23],
  tub: [15, 11], tube: [9, 23], bar: [16, 10], jar: [12, 16],
};

/**
 * The shop front, drawn from the live shelf state: each window shelf shows real products
 * in their pack colours, and an empty product leaves a visible gap with a red tag.
 */
export function StorefrontArt({ rows, storeName = "DGI Retail Store", animate = false, className }: { rows: Item[][]; storeName?: string; animate?: boolean; className?: string }) {
  const W = 360, H = 250;
  const winX = 46, winY = 92, winW = 200, winH = 132;
  const rowH = winH / rows.length;
  let n = 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={`${storeName} shop front showing its shelves`}>
      <defs>
        <linearGradient id="sf-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgb(var(--surface))" />
          <stop offset="1" stopColor="rgb(var(--sunken))" />
        </linearGradient>
        <linearGradient id="sf-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="sf-win"><rect x={winX} y={winY} width={winW} height={winH} rx="6" /></clipPath>
      </defs>

      {/* ground and building */}
      <ellipse cx={W / 2} cy={H - 6} rx={W / 2 - 10} ry="6" fill="rgb(var(--ink))" opacity=".06" />
      <rect x="26" y="40" width={W - 52} height={H - 46} rx="10" fill="url(#sf-wall)" stroke="rgb(var(--line))" />

      {/* sign board */}
      <rect x="62" y="14" width={W - 124} height="30" rx="8" fill="rgb(var(--teal))" />
      <text x={W / 2} y="34" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="Manrope, Inter, sans-serif" letterSpacing=".2">{storeName}</text>

      {/* striped, scalloped awning */}
      <g>
        <rect x="30" y="50" width={W - 60} height="22" fill="#fff" />
        {Array.from({ length: 12 }, (_, i) => (i % 2 ? null :
          <rect key={i} x={30 + i * ((W - 60) / 12)} y="50" width={(W - 60) / 12} height="22" fill="rgb(var(--teal))" />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const cx = 30 + (i + 0.5) * ((W - 60) / 12);
          return <path key={"s" + i} d={`M${cx - (W - 60) / 24} 72 a${(W - 60) / 24} 9 0 0 0 ${(W - 60) / 12} 0`} fill={i % 2 ? "#fff" : "rgb(var(--teal))"} stroke={i % 2 ? "rgb(var(--line))" : "none"} strokeWidth=".6" />;
        })}
        <rect x="30" y="50" width={W - 60} height="4" fill="#000" opacity=".08" />
      </g>

      {/* shop window with shelves */}
      <rect x={winX - 4} y={winY - 4} width={winW + 8} height={winH + 8} rx="8" fill="rgb(var(--ink))" opacity=".85" />
      <g clipPath="url(#sf-win)">
        <rect x={winX} y={winY} width={winW} height={winH} fill="#f3efe6" />
        {rows.map((row, ri) => {
          const boardY = winY + (ri + 1) * rowH - 5;
          const slotW = (winW - 8) / row.length;
          return (
            <g key={ri}>
              <rect x={winX} y={boardY} width={winW} height="5" fill="#c9b79a" />
              <rect x={winX} y={boardY + 4} width={winW} height="1.5" fill="#000" opacity=".15" />
              {row.map((p, i) => {
                const [pw, ph] = SIZE[p.shape];
                const sx = winX + 4 + i * slotW;
                const facings = p.estimatedStock <= 0 ? 0 : Math.max(1, Math.round((p.estimatedStock / p.shelfCapacity) * Math.max(1, Math.floor(slotW / (pw + 1.5)))));
                if (facings === 0) {
                  return (
                    <g key={p.id}>
                      <rect x={sx + 1} y={boardY - ph - 1} width={slotW - 3} height={ph} rx="2" fill="none" stroke="rgb(var(--empty))" strokeDasharray="3 2" strokeWidth="1.2" />
                      <rect x={sx + 2} y={boardY + 0.5} width="9" height="4" rx="1" fill="rgb(var(--empty))" />
                    </g>
                  );
                }
                return (
                  <g key={p.id}>
                    {Array.from({ length: facings }, (_, f) => {
                      const delay = animate ? (n++ % 40) * 0.03 : 0;
                      return (
                        <g key={f} className={animate ? "pack-in" : undefined} style={animate ? { animationDelay: `${delay}s`, transformOrigin: `${sx + f * (pw + 1.5) + pw / 2}px ${boardY}px` } : undefined}>
                          <Pack shape={p.shape} x={sx + f * (pw + 1.5)} y={boardY - ph} w={pw} h={ph} color={p.color} />
                        </g>
                      );
                    })}
                    <rect x={sx + 2} y={boardY + 0.5} width="9" height="4" rx="1" fill="#fff" opacity=".9" />
                  </g>
                );
              })}
            </g>
          );
        })}
        <rect x={winX} y={winY} width={winW} height={winH} fill="url(#sf-glass)" />
      </g>

      {/* door with OPEN sign */}
      <rect x="262" y="104" width="56" height="120" rx="5" fill="rgb(var(--ink))" opacity=".85" />
      <rect x="267" y="110" width="46" height="108" rx="3" fill="#dfe9e5" />
      <rect x="267" y="110" width="46" height="108" rx="3" fill="url(#sf-glass)" />
      <circle cx="306" cy="168" r="2.4" fill="rgb(var(--ink))" opacity=".6" />
      <g className="open-sign">
        <rect x="273" y="124" width="34" height="15" rx="3" fill="#f2b33d" />
        <text x="290" y="135" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#3b2a05" fontFamily="Inter, sans-serif">OPEN</text>
      </g>

      {/* the existing CCTV camera Shelfora reads from */}
      <g transform="translate(250 82)">
        <rect x="-2" y="-2" width="4" height="8" fill="rgb(var(--ink3))" />
        <rect x="-11" y="4" width="16" height="8" rx="2" fill="rgb(var(--ink2))" />
        <circle cx="-9" cy="8" r="2.2" fill="rgb(var(--teal))" className="live-dot" />
        <path d="M-12 10 L-56 38 L-30 46 Z" fill="rgb(var(--teal))" opacity=".12" />
      </g>
    </svg>
  );
}
