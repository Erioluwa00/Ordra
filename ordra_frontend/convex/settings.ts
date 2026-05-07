import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { auth } from "./auth";

const DEFAULT_SETTINGS = {
  businessName: "My Store",
  theme: "system",
  currency: "NGN",
  notifyPayments: true,
  notifySummary: true,
  lowStockThreshold: 5,
  stockpileDays: 7,
  templateConfirmation: "Hi {{name}}, your order #{{id}} for {{total}} has been received! We'll notify you when it's ready. 😊",
  templateReminder: "Hello {{name}}, just a friendly reminder that your payment of {{balance}} for order #{{id}} is still pending. Thank you! 🙏",
  templateStockpile: "Hi {{name}} 👋, this is a pickup reminder for your order *#{{id}}* ({{item}}).\n\nYour order has been ready for *{{days}} days* and is currently taking up storage space.\n\nPlease arrange a pickup at your earliest convenience. Thank you! 🙏",
};


// Get settings for the current user, or return defaults if none exist
export const getSettings = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!settings) {
      return { ...DEFAULT_SETTINGS, userId };
    }

    return settings;
  },
});

// Update or initial create of settings
export const updateSettings = mutation({
  args: {
    businessName: v.string(),
    phone: v.optional(v.string()),
    theme: v.string(),
    currency: v.string(),
    notifyPayments: v.boolean(),
    notifySummary: v.boolean(),
    templateConfirmation: v.string(),
    templateReminder: v.string(),
    lowStockThreshold: v.optional(v.number()),
    stockpileDays: v.optional(v.number()),
    templateStockpile: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("settings", {
        userId,
        ...args,
      });
    }
  },
});

// ── PLAN MUTATIONS ────────────────────────────────────────────────────────────

/**
 * Called on signup — gives the user a 14-day card-free Pro trial.
 */
export const activateTrial = mutation({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + 14);

    const planFields = {
      plan: "trial",
      planStartDate: now.toISOString(),
      planExpiresAt: trialEnd.toISOString(),
    };

    if (existing) {
      if (!existing.plan || existing.plan === "free") {
        await ctx.db.patch(existing._id, planFields);
      }
    } else {
      await ctx.db.insert("settings", {
        userId,
        ...DEFAULT_SETTINGS,
        ...planFields,
      });
    }
  },
});

/**
 * Called by Paystack webhook on successful payment.
 */
export const upgradeToPro = mutation({
  args: {
    userId: v.id("users"),
    paystackSubscriptionCode: v.optional(v.string()),
  },
  handler: async (ctx, { userId, paystackSubscriptionCode }) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const now = new Date();
    const proEnd = new Date(now);
    proEnd.setDate(proEnd.getDate() + 30);

    const planFields = {
      plan: "pro",
      planStartDate: now.toISOString(),
      planExpiresAt: proEnd.toISOString(),
      ...(paystackSubscriptionCode ? { paystackSubscriptionCode } : {}),
    };

    if (existing) {
      await ctx.db.patch(existing._id, planFields);
    } else {
      await ctx.db.insert("settings", {
        userId,
        ...DEFAULT_SETTINGS,
        ...planFields,
      });
    }
  },
});

/**
 * Helper used by createOrder — returns the user's active plan status.
 */
export const getPlanStatus = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const plan = settings?.plan ?? "free";
    const planExpiresAt = settings?.planExpiresAt;
    const now = new Date();

    const isExpired = planExpiresAt ? new Date(planExpiresAt) < now : false;
    const isPro = (plan === "pro" || plan === "trial") && !isExpired;
    const isTrial = plan === "trial" && !isExpired;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyOrders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const monthlyOrderCount = monthlyOrders.filter(
      (o) => o.createdAt >= monthStart
    ).length;

    let trialDaysLeft: number | null = null;
    if (isTrial && planExpiresAt) {
      const diff = new Date(planExpiresAt).getTime() - now.getTime();
      trialDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      plan,
      userId,
      isPro,
      isTrial,
      isExpired,
      trialDaysLeft,
      monthlyOrderCount,
      planExpiresAt,
      orderLimitReached: !isPro && monthlyOrderCount >= 50,
    };
  },
});

/**
 * BACKGROUND JANITOR
 * finds all users with expired plans and downgrades them.
 */
export const checkExpiredPlans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    const expiredSettings = await ctx.db
      .query("settings")
      .withIndex("by_expiry", (q) => q.lt("planExpiresAt", now))
      .collect();

    let count = 0;
    for (const setting of expiredSettings) {
      if (setting.plan !== "free") {
        console.log(`Downgrading user ${setting.userId} (plan: ${setting.plan})`);
        await ctx.db.patch(setting._id, {
          plan: "free",
          planExpiresAt: undefined,
          paystackSubscriptionCode: undefined,
        });
        count++;
      }
    }
    console.log(`Janitor finished: Downgraded ${count} expired plans.`);
  },
});
