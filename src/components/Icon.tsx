const P: Record<string, string> = {
  home: "M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V11z",
  game: "M6 8h12a4 4 0 0 1 4 4v3a3 3 0 0 1-5.2 2L15 15H9l-1.8 2A3 3 0 0 1 2 15v-3a4 4 0 0 1 4-4zM7 10v4M5 12h4M16 11h.01M18.5 13h.01",
  trophy: "M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6",
  gift: "M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7c-2 0-4-1-4-2.5S10 2 12 5c2-3 4-1.5 4 0S14 7 12 7z",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5v.01",
  chevron: "M6 9l6 6 6-6",
  coin: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9 9h5a2 2 0 0 1 0 4H9m0 0h5.5a2 2 0 0 1 0 4H9M9 7v10",
};
export default function Icon({ name, size = 22 }: { name: keyof typeof P; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={P[name]} />
    </svg>
  );
}
