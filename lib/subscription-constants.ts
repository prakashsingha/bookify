export type PlanType = "free" | "standard" | "pro";

export interface PlanLimits {
  maxBooks: number;
  maxSessionsPerMonth: number | null;
  maxMinutesPerSession: number;
  hasSessionHistory: boolean;
}

export const PLAN_SLUGS = {
  standard: "standard",
  pro: "pro",
} as const;

export const PLANS: Record<PlanType, PlanLimits> = {
  free: {
    maxBooks: 1,
    maxSessionsPerMonth: 5,
    maxMinutesPerSession: 5,
    hasSessionHistory: false,
  },
  standard: {
    maxBooks: 10,
    maxSessionsPerMonth: 100,
    maxMinutesPerSession: 15,
    hasSessionHistory: true,
  },
  pro: {
    maxBooks: 100,
    maxSessionsPerMonth: null,
    maxMinutesPerSession: 60,
    hasSessionHistory: true,
  },
};

export const DEFAULT_MAX_DURATION_MINUTES = PLANS.free.maxMinutesPerSession;

export const getCurrentBillingPeriodStart = () => {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return startOfMonth;
};

export const getCurrentBillingPeriodEnd = () => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, -1);
  return endOfMonth;
};

export function resolvePlanFromHas(
  has: (params: { plan: string }) => boolean,
): PlanType {
  if (has({ plan: PLAN_SLUGS.pro })) return "pro";
  if (has({ plan: PLAN_SLUGS.standard })) return "standard";
  return "free";
}
