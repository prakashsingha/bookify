"use server";

import { auth } from "@clerk/nextjs/server";
import { PLANS, PlanLimits, PlanType, resolvePlanFromHas } from "@/lib/subscription-constants";

export async function getCurrentUserPlan(): Promise<PlanType> {
  const { userId, has } = await auth();
  if (!userId) return "free";
  return resolvePlanFromHas(has);
}

export async function getCurrentUserPlanLimits(): Promise<PlanLimits> {
  const plan = await getCurrentUserPlan();
  return PLANS[plan];
}
