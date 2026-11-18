import { DocumentStatus } from "@/types";

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function getDaysRemaining(expiryDate: Date | string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();

  // Extract calendar date parts in UTC to prevent timezone shifts across UTC midnight
  let expYear: number, expMonth: number, expDay: number;
  if (typeof expiryDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(expiryDate)) {
    const parts = expiryDate.slice(0, 10).split("-").map(Number);
    expYear = parts[0];
    expMonth = parts[1] - 1;
    expDay = parts[2];
  } else {
    expYear = expiry.getUTCFullYear();
    expMonth = expiry.getUTCMonth();
    expDay = expiry.getUTCDate();
  }

  const utcExpiry = Date.UTC(expYear, expMonth, expDay);
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = utcExpiry - utcNow;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function calculateExpiryStatus(expiryDate: Date | string): {
  status: DocumentStatus;
  daysRemaining: number;
  label: string;
  badgeClass: string;
} {
  const days = getDaysRemaining(expiryDate);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      status: "EXPIRED",
      daysRemaining: days,
      label: absDays === 1 ? "Expired yesterday" : `Expired ${absDays} days ago`,
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    };
  }

  if (days === 0) {
    return {
      status: "EXPIRING_SOON",
      daysRemaining: 0,
      label: "Expires today!",
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse",
    };
  }

  if (days <= 30) {
    return {
      status: "EXPIRING_SOON",
      daysRemaining: days,
      label: days === 1 ? "Expires tomorrow" : `Expires in ${days} days`,
      badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  }

  return {
    status: "VALID",
    daysRemaining: days,
    label: `Valid (${days} days left)`,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  };
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "Invalid date";

  // If time is at UTC midnight (typical for PostgreSQL @db.Date), format using UTC to avoid timezone shift
  const isUtcMidnight = d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(isUtcMidnight ? { timeZone: "UTC" } : {}),
  });
}

export function formatDocumentType(type: string, customName?: string | null): string {
  if (type === "CUSTOM" && customName) return customName;

  switch (type) {
    case "INSURANCE":
      return "Insurance";
    case "PUC":
      return "Pollution Certificate (PUC)";
    case "RC":
      return "Registration Certificate (RC)";
    case "FITNESS":
      return "Fitness Certificate";
    case "ROAD_TAX":
      return "Road Tax Receipt";
    case "PERMIT":
      return "Vehicle Permit";
    case "DRIVING_LICENCE":
      return "Driving Licence";
    default:
      return type.replace(/_/g, " ");
  }
}

export function formatVehicleType(type: string): string {
  switch (type) {
    case "CAR":
      return "Car";
    case "BIKE":
      return "Motorcycle / Bike";
    case "SCOOTER":
      return "Scooter";
    case "TRUCK":
      return "Commercial Truck";
    case "OTHER":
    default:
      return "Other Vehicle";
  }
}

export function formatFuelType(fuel: string): string {
  switch (fuel) {
    case "PETROL":
      return "Petrol";
    case "DIESEL":
      return "Diesel";
    case "ELECTRIC":
      return "Electric (EV)";
    case "HYBRID":
      return "Hybrid";
    case "CNG":
      return "CNG";
    default:
      return fuel;
  }
}
