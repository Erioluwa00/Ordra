import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Submit new user feedback / review
export const submitFeedback = mutation({
  args: {
    rating: v.number(), // 1 to 5
    type: v.string(), // "report_issue" | "feature_request" | "general_feedback"
    message: v.string(),
    businessHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const feedbackId = await ctx.db.insert("feedback", {
      userId,
      rating: args.rating,
      type: args.type,
      message: args.message.trim(),
      businessHandle: args.businessHandle?.trim(),
      isApproved: false, // Pending admin approval by default
      createdAt: new Date().toISOString(),
    });

    return feedbackId;
  },
});

// Admin Query: Get all feedback items
export const getAllFeedback = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // Optionally fetch user info with feedback
    const feedbacks = await ctx.db.query("feedback").order("desc").collect();
    
    // Map feedbacks to include user email/name if needed
    const enriched = await Promise.all(
      feedbacks.map(async (fb) => {
        const user = await ctx.db.get(fb.userId);
        return {
          ...fb,
          userEmail: user?.email,
          userName: user?.name,
        };
      })
    );

    return enriched;
  },
});

// Admin Mutation: Toggle feedback approval status for homepage display
export const toggleApproval = mutation({
  args: {
    feedbackId: v.id("feedback"),
    isApproved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(args.feedbackId, {
      isApproved: args.isApproved,
    });
  },
});
