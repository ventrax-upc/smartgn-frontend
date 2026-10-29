import { BaseResource } from '../../../shared/infrastructure/base-response';
import {
  BillingDocumentStatus,
  BillingDocumentType,
} from '../domain/model/billing-document.entity';
import {
  PaymentReason,
  PaymentStatus,
} from '../domain/model/payment-order.entity';
import { SubscriptionPlan } from '../domain/model/subscription.entity';

export interface SubscriptionResource {
  accountId: string;
  proActive: boolean;
  plan: SubscriptionPlan;
  periodStartsAt: string;
  periodEndsAt: string;
  installationCompleted: boolean;
  autoRenew: boolean;
  technicalCoveragePercent: number;
  monthlyProPrice: number;
  currency: string;
  technicalBasePriceReference: number;
}

export interface PaymentMethodResource extends BaseResource {
  id: string;
  brand: string;
  last_four: string;
  is_default: boolean;
  active: boolean;
}

export interface PaymentMethodInputResource {
  brand: string;
  lastFour: string;
  providerToken?: string;
}

export interface BillingDocumentResource extends BaseResource {
  id: string;
  orderId: string;
  type: BillingDocumentType;
  number: string;
  issuedAt: string;
  total: number;
  currency: string;
  status: BillingDocumentStatus;
}

export interface PaymentLineResource {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PaymentAttemptResource {
  id: string;
  at: string;
  status: string;
  providerReference: string;
}

export interface PaymentOrderResource extends BaseResource {
  id: string;
  reason: PaymentReason;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
  confirmed_at: string | null;
  lines: PaymentLineResource[];
  attempts: PaymentAttemptResource[];
  documents: BillingDocumentResource[];
}

export type PaymentOrderResponse = PaymentOrderResource[];
