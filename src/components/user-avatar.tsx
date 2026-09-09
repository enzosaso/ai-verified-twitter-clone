import { profileInitials } from "@/modules/users/domain/public-profile";

const TINTS = [
  { bg: "#f3e3dc", fg: "#8a4a32" },
  { bg: "#dde9e4", fg: "#2f5c4f" },
  { bg: "#e7def0", fg: "#5b3e7a" },
  { bg: "#dde3f5", fg: "#3b4b7a" },
  { bg: "#e6e7d6", fg: "#5c5f32" },
];

export function avatarTint(displayName: string) {
  let hash = 0;
  for (let index = 0; index < displayName.length; index += 1) {
    hash = (hash * 31 + displayName.charCodeAt(index)) % 100000;
  }
  return TINTS[hash % TINTS.length];
}

export function UserAvatar({
  displayName,
  size = "md",
}: {
  displayName: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = profileInitials(displayName);
  const tint = avatarTint(displayName);
  const sizeClass =
    size === "lg"
      ? "h-[92px] w-[92px] text-3xl"
      : size === "sm"
        ? "h-11 w-11 text-[15px]"
        : "h-12 w-12 text-base";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${sizeClass}`}
      style={{ backgroundColor: tint.bg, color: tint.fg }}
    >
      {initials}
    </span>
  );
}
