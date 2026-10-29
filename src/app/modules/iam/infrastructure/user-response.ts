import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface AuthenticatedUserResource extends BaseResource {
  id: string;
  email: string;
  role: 'USER' | 'SUPERADMIN';
  accountKind: 'PRINCIPAL' | 'DELEGATED';
  token: string;
}

export interface ForgotPasswordResource {
  message: string;
  demoResetToken?: string | null;
}

export type UserResponse = BaseResponse;
