import type { Operator } from './operator';

export interface LoginPayload {
  operatorId: string;
  pin: string;
}

export interface LoginResult {
  accessToken: string;
  operator: Operator;
}
