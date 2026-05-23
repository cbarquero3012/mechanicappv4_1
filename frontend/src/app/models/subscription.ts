export interface SubscriptionStatus {
  active: boolean;
  status: string;
  planName?: string;
  expiresAt?: string;
  email?: string;
  isDemo?: boolean;
  daysRemaining?: number;
}

export interface Subscription {
  id?: number;
  email: string;
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
  status: string;
  planName?: string;
  startDate?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
