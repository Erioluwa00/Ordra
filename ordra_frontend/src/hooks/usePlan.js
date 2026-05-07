import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * usePlan — returns the current user's plan status.
 *
 * isPro     → true if user is on active Pro or active Trial
 * isTrial   → true if user is on the 14-day trial (subset of isPro)
 * isFree    → true if user has no active paid/trial plan
 * isExpired → true if their plan/trial has lapsed
 * trialDaysLeft → number of days remaining in trial (null if not in trial)
 * monthlyOrderCount → how many orders created this calendar month
 * orderLimitReached → true if free user has used all 50 monthly orders
 */
export default function usePlan() {
  const status = useQuery(api.settings.getPlanStatus);

  if (status === undefined) {
    return {
      isPro: false,
      isTrial: false,
      isFree: false, // Don't assume free while loading to avoid flickering locks
      isExpired: false,
      plan: "",
      trialDaysLeft: null,
      monthlyOrderCount: 0,
      orderLimitReached: false,
      isLoading: true,
    };
  }

  if (status === null) {
    return {
      isPro: false,
      isTrial: false,
      isFree: false,
      isExpired: false,
      plan: "none",
      isLoading: false,
    };
  }

  const FREE_ORDER_LIMIT = 50;

  return {
    isPro: status.isPro,
    isTrial: status.isTrial,
    isFree: !status.isPro,
    isExpired: status.isExpired,
    plan: status.plan,
    trialDaysLeft: status.trialDaysLeft,
    monthlyOrderCount: status.monthlyOrderCount,
    orderLimitReached: !status.isPro && status.monthlyOrderCount >= FREE_ORDER_LIMIT,
    planExpiresAt: status.planExpiresAt,
    loading: false,
  };
}
