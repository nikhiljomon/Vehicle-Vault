import { calculateExpiryStatus } from "@/lib/utils";

interface DocumentBadgeProps {
  expiryDate: Date | string;
  showDays?: boolean;
}

export function DocumentBadge({ expiryDate, showDays = true }: DocumentBadgeProps) {
  const { status, label, badgeClass } = calculateExpiryStatus(expiryDate);

  const dotColor =
    status === "EXPIRED"
      ? "bg-red-500"
      : status === "EXPIRING_SOON"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {showDays ? label : status.replace("_", " ")}
    </span>
  );
}
