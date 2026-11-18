export type VehicleType = "CAR" | "BIKE" | "TRUCK" | "SCOOTER" | "OTHER";

export type FuelType = "PETROL" | "DIESEL" | "ELECTRIC" | "HYBRID" | "CNG" | "OTHER";

export type DocumentType =
  | "INSURANCE"
  | "PUC"
  | "RC"
  | "FITNESS"
  | "ROAD_TAX"
  | "PERMIT"
  | "DRIVING_LICENCE"
  | "CUSTOM";

export type DocumentStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

export interface DocumentMetadata {
  provider?: string;
  policyNumber?: string;
  premium?: number | string;
  coverageType?: string;
  notes?: string;
  [key: string]: any;
}

export interface VehicleWithDocuments {
  id: string;
  userId: string;
  nickname: string;
  registrationNumber: string;
  type: string;
  make: string;
  model: string;
  year: number;
  fuelType: string;
  chassisNumber?: string | null;
  engineNumber?: string | null;
  ownerName?: string | null;
  photoUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  documents?: DocumentItem[];
}

export interface DocumentItem {
  id: string;
  vehicleId: string;
  type: string;
  customTypeName?: string | null;
  documentNumber?: string | null;
  issueDate?: Date | string | null;
  expiryDate: Date | string;
  premium?: number | string | null;
  notes?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  metadata?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  vehicle?: {
    id: string;
    nickname: string;
    registrationNumber: string;
    make: string;
    model: string;
  };
  history?: DocumentHistoryItem[];
}

export interface DocumentHistoryItem {
  id: string;
  documentId: string;
  documentNumber?: string | null;
  issueDate?: Date | string | null;
  expiryDate: Date | string;
  premium?: number | string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  notes?: string | null;
  metadata?: string | null;
  renewedAt: Date | string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: Date | string;
}

export interface NotificationSettingsData {
  id?: string;
  userId?: string;
  reminderDays: string; // e.g., "30,15,7,1,0"
  emailEnabled: boolean;
  inAppEnabled: boolean;
  pushEnabled: boolean;
}
