// Default per-session cap used in voice session payloads when plan-specific
// limits are not yet enforced in billing logic.
export const DEFAULT_MAX_DURATION_MINUTES = 15;

export const getCurrentBillingPeriodStart = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth;
};

export const getCurrentBillingPeriodEnd = () => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, -1);
  return endOfMonth;
};
