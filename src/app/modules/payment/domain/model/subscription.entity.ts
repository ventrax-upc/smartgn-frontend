import { BaseEntity } from '../../../../shared/domain/model/base-entity';

export type SubscriptionPlan = 'BASIC' | 'PRO';

export class Subscription implements BaseEntity {
  private readonly _accountId: string;
  private readonly _proActive: boolean;
  private readonly _plan: SubscriptionPlan;
  private readonly _periodStartsAt: string;
  private readonly _periodEndsAt: string;
  private readonly _installationCompleted: boolean;
  private readonly _autoRenew: boolean;
  private readonly _technicalCoveragePercent: number;
  private readonly _monthlyProPrice: number;
  private readonly _currency: string;
  private readonly _technicalBasePriceReference: number;

  constructor(props: {
    accountId: string;
    proActive: boolean;
    plan: SubscriptionPlan;
    periodStartsAt: string;
    periodEndsAt: string;
    installationCompleted: boolean;
    autoRenew: boolean;
    technicalCoveragePercent?: number;
    monthlyProPrice?: number;
    currency?: string;
    technicalBasePriceReference?: number;
  }) {
    this._accountId = props.accountId;
    this._proActive = props.proActive;
    this._plan = props.plan;
    this._periodStartsAt = props.periodStartsAt;
    this._periodEndsAt = props.periodEndsAt;
    this._installationCompleted = props.installationCompleted;
    this._autoRenew = props.autoRenew;
    this._technicalCoveragePercent = props.technicalCoveragePercent ?? 0;
    this._monthlyProPrice = props.monthlyProPrice ?? 0;
    this._currency = props.currency ?? 'PEN';
    this._technicalBasePriceReference = props.technicalBasePriceReference ?? 0;
  }

  get id(): string {
    return this._accountId;
  }

  get accountId(): string {
    return this._accountId;
  }

  get proActive(): boolean {
    return this._proActive;
  }

  get plan(): SubscriptionPlan {
    return this._plan;
  }

  get periodStartsAt(): string {
    return this._periodStartsAt;
  }

  get periodEndsAt(): string {
    return this._periodEndsAt;
  }

  get installationCompleted(): boolean {
    return this._installationCompleted;
  }

  get autoRenew(): boolean {
    return this._autoRenew;
  }

  get technicalCoveragePercent(): number {
    return this._technicalCoveragePercent;
  }

  get monthlyProPrice(): number {
    return this._monthlyProPrice;
  }

  get currency(): string {
    return this._currency;
  }

  get technicalBasePriceReference(): number {
    return this._technicalBasePriceReference;
  }

  get savings(): number {
    return Math.max(this._technicalBasePriceReference - this._monthlyProPrice, 0);
  }
}
