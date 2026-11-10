export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="logo">
      <rect width="32" height="32" rx="9" fill="var(--ink)" />
      <path d="M8 24 C 12 18, 20 22, 16 14 S 20 8, 24 8" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="8" cy="24" r="2.6" fill="#22C55E" />
      <circle cx="24" cy="8" r="2.6" fill="#F59E0B" />
    </svg>
  );
}
