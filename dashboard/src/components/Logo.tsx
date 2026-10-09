/** Shelfora mark: three shelf boards seen through a lens-shaped frame. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" className="fill-teal" />
      <path d="M8 11.5h16" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      <path d="M8 16.5h11" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 21.5h16" stroke="white" strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      <circle cx="23.5" cy="16.5" r="2.2" fill="white" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-[19px] font-extrabold tracking-[-0.03em] text-ink">Shelfora</span>
    </div>
  );
}
