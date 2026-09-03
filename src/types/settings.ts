export interface AppSettings {
  id: string;
  alertThresholdMinutes: number;
  alertsEnabled: boolean;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  alertThresholdMinutes?: number;
  alertsEnabled?: boolean;
}
