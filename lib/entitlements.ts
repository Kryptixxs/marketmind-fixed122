export type Feature = 'alerts' | 'advanced_charts' | 'algo_trading' | 'institutional_news';

export interface Entitlement {
  plan: 'free' | 'pro' | 'enterprise';
  features: Feature[];
}

const DEFAULT_ENTITLEMENTS: Record<string, Entitlement> = {
  free: {
    plan: 'free',
    features: ['alerts'],
  },
  pro: {
    plan: 'pro',
    features: ['alerts', 'advanced_charts', 'institutional_news'],
  },
  enterprise: {
    plan: 'enterprise',
    features: ['alerts', 'advanced_charts', 'algo_trading', 'institutional_news'],
  },
};

export function canAccess(feature: Feature, userPlan: string = 'free'): boolean {
  // In dev mode or if no plan is provided, we can default to pro for testing
  const plan = (process.env.NODE_ENV === 'development' ? 'pro' : userPlan) as keyof typeof DEFAULT_ENTITLEMENTS;
  const entitlements = DEFAULT_ENTITLEMENTS[plan] || DEFAULT_ENTITLEMENTS.free;
  return entitlements.features.includes(feature);
}

export function getPlanDetails(plan: string = 'free') {
  return DEFAULT_ENTITLEMENTS[plan as keyof typeof DEFAULT_ENTITLEMENTS] || DEFAULT_ENTITLEMENTS.free;
}