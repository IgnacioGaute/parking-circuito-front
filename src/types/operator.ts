export type Role = 'admin' | 'user';

export interface Operator {
  id: string;
  name: string;
  initials: string;
  role: Role;
  onDuty: boolean;
}

export interface CreateOperatorPayload {
  name: string;
  pin: string;
  role: Role;
}

export interface UpdateOperatorPayload {
  name?: string;
  pin?: string;
  role?: Role;
}
