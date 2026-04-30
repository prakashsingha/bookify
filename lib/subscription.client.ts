"use client";

import { useAuth } from "@clerk/nextjs";
import { PLANS, PlanLimits, PlanType, resolvePlanFromHas } from "@/lib/subscription-constants";

interface UsePlanAccessResult {
  isLoaded: boolean;
  plan: PlanType;
  limits: PlanLimits;
}

export function useCurrentUserPlan(): UsePlanAccessResult {
  const { has, isLoaded } = useAuth();

  if (!isLoaded) {
    return {
      isLoaded,
      plan: "free",
      limits: PLANS.free,
    };
  }

  const plan = resolvePlanFromHas(has);
  return {
    isLoaded,
    plan,
    limits: PLANS[plan],
  };
}
