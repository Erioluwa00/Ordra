import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

export const getUserProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    return user;
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 1. Delete all business data
    const collections = [
      "orders", "customers", "products", "categories", 
      "settings", "inventoryLogs", "notificationReads"
    ];

    for (const collection of collections) {
      const records = await ctx.db
        .query(collection as any)
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .collect();
      
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
    }

    // 2. Delete the user record itself
    // This will also eventually sign the user out as the session becomes invalid
    await ctx.db.delete(userId);
  },
});
