import { Injectable } from '@angular/core';
import { BillingDocument } from '../domain/model/billing-document.entity';
import { PaymentMethod } from '../domain/model/payment-method.entity';
import {
  PaymentAttempt,
  PaymentLine,
  PaymentOrder,
} from '../domain/model/payment-order.entity';
import { Subscription } from '../domain/model/subscription.entity';
import {
  BillingDocumentResource,
  PaymentMethodResource,
  PaymentOrderResource,
  SubscriptionResource,
} from './payment-response';

@Injectable({ providedIn: 'root' })
export class SubscriptionAssembler {
  toEntityFromResource(resource: SubscriptionResource): Subscription {
    return new Subscription(resource);
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentMethodAssembler {
  toEntityFromResource(resource: PaymentMethodResource): PaymentMethod {
    return new PaymentMethod({
      id: resource.id,
      brand: resource.brand,
      lastFour: resource.last_four,
      isDefault: resource.is_default,
      active: resource.active,
    });
  }

  toEntitiesFromResponse(resources: PaymentMethodResource[]): PaymentMethod[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }
}

@Injectable({ providedIn: 'root' })
export class PaymentOrderAssembler {
  toEntityFromResource(resource: PaymentOrderResource): PaymentOrder {
    return new PaymentOrder({
      id: resource.id,
      reason: resource.reason,
      amount: resource.amount,
      currency: resource.currency,
      status: resource.status,
      createdAt: resource.created_at,
      confirmedAt: resource.confirmed_at,
      lines: (resource.lines ?? []).map(
        (line) => new PaymentLine(line.description, line.quantity, line.unitPrice, line.total),
      ),
      attempts: (resource.attempts ?? []).map(
        (attempt) =>
          new PaymentAttempt(attempt.id, attempt.at, attempt.status, attempt.providerReference),
      ),
      documents: (resource.documents ?? []).map((document) => this.toDocument(document)),
    });
  }

  toEntitiesFromResponse(resources: PaymentOrderResource[]): PaymentOrder[] {
    return resources.map((resource) => this.toEntityFromResource(resource));
  }

  private toDocument(resource: BillingDocumentResource): BillingDocument {
    return new BillingDocument(resource);
  }
}
