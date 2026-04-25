"use client";

import { useEffect } from "react";

const ACTIVE_CLASS = "active-plan";

/**
 * Marks the Clerk pricing card that represents the current plan by adding
 * `.active-plan` (styled in globals.css). Uses the disabled CTA inside the
 * current-plan card, which matches `.clerk-pricing-table-wrapper button:disabled`
 * styling in CSS.
 */
function syncActivePlanHighlight(root: ParentNode) {
  const wrapper = root.querySelector(".clerk-pricing-table-wrapper");
  if (!wrapper) {
    return;
  }

  const cards = wrapper.querySelectorAll(".cl-pricingTableCard");
  cards.forEach((el) => el.classList.remove(ACTIVE_CLASS));

  const disabledCta = wrapper.querySelector<HTMLElement>(
    ".cl-pricingTableCard button:disabled, .cl-pricingTableCard button[disabled], .cl-pricingTableCard button[aria-disabled=\"true\"]",
  );
  const activeCard = disabledCta?.closest(".cl-pricingTableCard");
  activeCard?.classList.add(ACTIVE_CLASS);
}

export function ClerkPricingActivePlanHighlight() {
  useEffect(() => {
    let frame = 0;

    const schedule = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        frame = 0;
        syncActivePlanHighlight(document);
      });
    };

    schedule();

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame) {
        cancelAnimationFrame(frame);
      }
      document.querySelectorAll(`.cl-pricingTableCard.${ACTIVE_CLASS}`).forEach((el) => {
        el.classList.remove(ACTIVE_CLASS);
      });
    };
  }, []);

  return null;
}
