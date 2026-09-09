const PATHS = {
  search: "M11 17.5 A6.5 6.5 0 1 0 11 4.5 A6.5 6.5 0 0 0 11 17.5 Z M16 16 L21 21",
  profile:
    "M12 12 A4 4 0 1 0 12 4 A4 4 0 0 0 12 12 Z M5 20 C5 16.5, 8 14.5, 12 14.5 C16 14.5, 19 16.5, 19 20",
  logout: "M15 8 V6 A2 2 0 0 0 13 4 H6 A2 2 0 0 0 4 6 V18 A2 2 0 0 0 6 20 H13 A2 2 0 0 0 15 18 V16 M10 12 H21 M18 9 L21 12 L18 15",
  list: "M4 7 H20 M4 12 H20 M4 17 H14",
  clock: "M12 6 V12 L16 14 M12 21 A9 9 0 1 1 12 3 A9 9 0 0 1 12 21 Z",
  users:
    "M9 12 A4 4 0 1 0 9 4 A4 4 0 0 0 9 12 Z M2 20 C2 16.5, 5 14.5, 9 14.5 C13 14.5, 16 16.5, 16 20 M18 8 H22 M20 6 V10",
  heart:
    "M12 20 C6.5 16.2, 3.6 12.9, 3.6 9.4 C3.6 6.7, 5.7 4.7, 8.2 4.7 C9.9 4.7, 11.4 5.7, 12 7 C12.6 5.7, 14.1 4.7, 15.8 4.7 C18.3 4.7, 20.4 6.7, 20.4 9.4 C20.4 12.9, 17.5 16.2, 12 20 Z",
} as const;

export function NavIcon({
  name,
  size = 21,
  className,
  filled = false,
}: {
  name: keyof typeof PATHS;
  size?: number;
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      className={className}
    >
      <path
        d={PATHS[name]}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
