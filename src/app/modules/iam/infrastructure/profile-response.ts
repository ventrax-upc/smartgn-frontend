import { BaseResource, BaseResponse } from '../../../shared/infrastructure/base-response';

export interface ProfileResource extends BaseResource {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
}

export interface ProfileInputResource {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
}

export type ProfileResponse = BaseResponse;
