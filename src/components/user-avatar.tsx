import { profileInitials } from "@/modules/users/domain/public-profile";

export function UserAvatar({
  displayName,
  size = "md",
}: {
  displayName: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = profileInitials(displayName);
  const sizeClass =
    size === "lg" ? "h-20 w-20 text-2xl" : size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent/15 font-semibold text-accent ${sizeClass}`}
    >
      {initials}
    </span>
  );
}
