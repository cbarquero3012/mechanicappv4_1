export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  status: string;
  databaseName: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planName: string;
  maxUsers: number;
  isDemo: boolean;
  demoExpiresAt?: string;
  subscriptionExpiresAt?: string;
  country?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDemoResponse {
  message: string;
  tenant: {
    slug: string;
    demoExpiresAt: string;
    status: string;
    loginUrl?: string;
    credentials: { username: string; password: string };
  };
}

export interface DemoStatus {
  slug: string;
  name: string;
  demoExpiresAt: string;
  isExpired: boolean;
  daysRemaining: number;
}

export interface OnboardRequest {
  email: string;
  companyName: string;
  adminPassword: string;
  username?: string;
  planName?: string;
  country?: string;
}
