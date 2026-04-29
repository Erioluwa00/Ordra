import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

const DEFAULT_SETTINGS = {
  businessName: "My Store",
  theme: "system",
  currency: "NGN",
  notifyPayments: true,
  notifySummary: true,
  lowStockThreshold: 5,
  templateConfirmation: "Hi {{name}}, your order #{{id}} for {{total}} has been received! We'll notify you when it's ready. 😊",
  templateReminder: "Hello {{name}}, just a friendly reminder that your payment of {{balance}} for order #{{id}} is still pending. Thank you! 🙏"
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
