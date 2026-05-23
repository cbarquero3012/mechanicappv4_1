export interface AppSettings {
  id?: number;
  appName: string;
  logoUrl?: string;
  faviconUrl?: string;
  address?: string;
  phone?: string;
  whatsAppPhone?: string;
  email?: string;
  photoCleanupDays?: number;
  photoCleanupLastRun?: string;
  photoCleanupLastUser?: string;
  timezone?: string;
  updatedAt?: string;
}
