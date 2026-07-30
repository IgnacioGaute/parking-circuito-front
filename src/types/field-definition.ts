export type FieldType = 'text' | 'number' | 'boolean' | 'select';

export interface FieldDefinition {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: string[] | null;
  sortOrder: number;
  active: boolean;
  isSystem: boolean;
  createdAt: string;
}

export interface CreateFieldDefinitionPayload {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  sortOrder?: number;
}

export interface UpdateFieldDefinitionPayload {
  label?: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
  sortOrder?: number;
  active?: boolean;
}
