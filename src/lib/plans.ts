/** Pricing config. Edit here to change prices/discounts; everything else reads from this file. */
export const TIERS = {
  STARTER: { label: "Starter", students: 300, monthly: 299, intro: 199 },
  STANDARD: { label: "Standard", students: 800, monthly: 599, intro: 399 },
  LARGE: { label: "Large", students: 1500, monthly: 999, intro: 669 },
} as const;
export type TierCode = keyof typeof TIERS;

export const PLANS = {
  MONTHLY: { label: "Monthly", months: 1, discount: 0 },
  HALF: { label: "6 months", months: 6, discount: 0 },
  YEAR: { label: "1 year", months: 12, discount: 28 },
  TWO_YEAR: { label: "2 years", months: 24, discount: 28 },
} as const;
export type PlanCode = keyof typeof PLANS;

/** Paid add-on: the school's own logo, colours, signature, name on the login page and its own web address. Yearly only, because domains are bought a year at a time. */
export const CUSTOM = { label: "Custom school", yearly: 2999 } as const;
export const customAllowed = (plan: PlanCode) => PLANS[plan].months >= 12;
/** Add-on price in rupees for a plan, or null when the plan is shorter than a year. */
export const customPrice = (plan: PlanCode) => (customAllowed(plan) ? Math.round((CUSTOM.yearly * PLANS[plan].months) / 12) : null);

export const INTRO_MONTHS = 3;
export const GRACE_DAYS = 7;

export const isTier = (t: string): t is TierCode => t in TIERS;
export const isPlan = (p: string): p is PlanCode => p in PLANS;

/** Amount in whole rupees. The intro price applies only to the monthly plan and never stacks with a package discount. */
export function priceFor(tier: TierCode, plan: PlanCode, introLeft: number) {
  const t = TIERS[tier], p = PLANS[plan];
  if (plan === "MONTHLY") {
    const intro = introLeft > 0;
    return { amount: intro ? t.intro : t.monthly, months: 1, gross: t.monthly, discount: 0, kind: intro ? "INTRO" : "PLAN" } as const;
  }
  const gross = t.monthly * p.months;
  const amount = Math.round(gross * (100 - p.discount) / 100);
  return { amount, months: p.months, gross, discount: p.discount, kind: "PLAN" } as const;
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
