export interface AppSettings {
  id: string;
  alertThresholdMinutes: number;
  updatedAt: string;
}

export interface UpdateSettingsPayload {
  alertThresholdMinutes: number;
}
