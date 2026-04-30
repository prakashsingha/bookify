"use client";

import { Show } from "@clerk/nextjs";
import { CheckoutButton, usePlans } from "@clerk/nextjs/experimental";
import { useMemo, useState } from "react";
import { useCurrentUserPlan } from "@/lib/subscription.client";

type BillingPeriod = "month" | "annual";

interface BillingMoneyAmount {
  amountFormatted?: string;
  currencySymbol?: string;
}

interface BillingPlanResourceLike {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  hasBaseFee: boolean;
  fee: BillingMoneyAmount | null;
  annualFee: BillingMoneyAmount | null;
  features: Array<{ id: string; name: string }>;
}

const planOrder = ["free", "standard", "pro"];

function normalizePlanKey(plan: BillingPlanResourceLike): string {
  const slug = plan.slug.toLowerCase();
  const name = plan.name.toLowerCase();
  if (slug.includes("free") || name.includes("free")) return "free";
  if (slug.includes("standard") || name.includes("standard")) return "standard";
  if (slug.includes("pro") || name.includes("pro")) return "pro";
  return slug;
}

function getPlanRank(plan: BillingPlanResourceLike): number {
  const rank = planOrder.indexOf(normalizePlanKey(plan));
  if (rank === -1) return Number.MAX_SAFE_INTEGER;
  return rank;
}

function getPriceParts(
  plan: BillingPlanResourceLike,
  period: BillingPeriod,
): { amount: string; suffix: string } {
  if (!plan.hasBaseFee) return { amount: "$0", suffix: "" };
  if (period === "annual") {
    const amount = plan.annualFee?.amountFormatted;
    if (amount) return { amount: `${plan.annualFee?.currencySymbol ?? "$"}${amount}`, suffix: "/year" };
  }
  const monthly = plan.fee?.amountFormatted;
  return { amount: `${plan.fee?.currencySymbol ?? "$"}${monthly ?? "0"}`, suffix: "/month" };
}

function PlanCard({ plan }: { plan: BillingPlanResourceLike }) {
  const [isAnnual, setIsAnnual] = useState(false);
  const period: BillingPeriod = isAnnual ? "annual" : "month";
  const isPaidPlan = plan.hasBaseFee;
  const { plan: currentPlan } = useCurrentUserPlan();
  const isActivePlan = currentPlan === normalizePlanKey(plan);
  const price = getPriceParts(plan, period);

  return (
    <article className={`pricing-v2-card ${isActivePlan ? "is-active-plan" : ""}`}>
      <header className="pricing-v2-header">
        <h3 className="pricing-v2-name">{plan.name}</h3>
        {isActivePlan && <span className="pricing-v2-active-badge">Active</span>}
      </header>

      <p className="pricing-v2-price">
        {price.amount}
        {price.suffix && <span className="pricing-v2-price-suffix">{price.suffix}</span>}
      </p>

      {!isPaidPlan && <p className="pricing-v2-free-copy">Always free</p>}

      {isPaidPlan && (
        <button
          type="button"
          className={`pricing-v2-toggle ${isAnnual ? "is-on" : ""}`}
          onClick={() => setIsAnnual((prev) => !prev)}
          aria-pressed={isAnnual}
        >
          <span className="pricing-v2-toggle-knob" />
          <span className="pricing-v2-toggle-label">Billed annually</span>
        </button>
      )}

      {isPaidPlan && (
        <div className="pricing-v2-feature-wrap">
          <ul className="pricing-v2-feature-list">
            {plan.features.map((feature) => (
              <li key={feature.id} className="pricing-v2-feature-item">
                {feature.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isPaidPlan && (
        <Show when="signed-in">
          <CheckoutButton planId={plan.id} planPeriod={period} for="user">
            <button type="button" className="pricing-v2-cta" disabled={isActivePlan}>
              {isActivePlan ? "Current plan" : "Subscribe"}
            </button>
          </CheckoutButton>
        </Show>
      )}
    </article>
  );
}

export function SubscriptionsPricingCards() {
  const { data, isLoading, isError } = usePlans({
    for: "user",
    pageSize: 20,
  });

  const plans = useMemo(() => {
    const rows = (data ?? []) as BillingPlanResourceLike[];
    return rows.sort((a, b) => getPlanRank(a) - getPlanRank(b));
  }, [data]);

  if (isLoading) return <p className="subtitle text-center">Loading plans...</p>;
  if (isError) return <p className="subtitle text-center">Unable to load plans right now.</p>;

  return (
    <section className="pricing-custom-wrapper mt-8 w-full">
      <div className="pricing-grid">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </section>
  );
}
