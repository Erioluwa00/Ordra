import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // ── BUSINESS COLLECTIONS ──────────────────────────────────────────────────

  orders: defineTable({
    userId: v.id("users"),
    orderId: v.string(), // e.g. ORD-1234
    customer: v.string(),
    customerPhone: v.string(),
    item: v.string(), // Summary string
    items: v.array(v.object({
      productId: v.optional(v.id("products")),
      desc: v.string(),
      qty: v.number(),
      price: v.number()
    })),
    total: v.number(),
    amountPaid: v.number(),
    paymentStatus: v.string(), // paid, partial, unpaid
    status: v.string(), // New, Processing, Ready, etc.
    deliveryAddress: v.string(),
    notes: v.string(),
    deliveryDate: v.optional(v.string()), // ISO string or YYYY-MM-DD
    isUrgent: v.optional(v.boolean()),
    source: v.optional(v.string()), // whatsapp, instagram, tiktok, etc.
    createdAt: v.string(), // ISO string
    notifiedAt: v.optional(v.string()), // ISO string — last stockpile notice sent
  }).index("by_user", ["userId"]),

  customers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    totalOrders: v.number(),
    lifetimeValue: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  products: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    quantity: v.optional(v.number()),
    category: v.optional(v.string()),
    sku: v.optional(v.string()),
    inStock: v.boolean(),
  }).index("by_user", ["userId"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
  }).index("by_user", ["userId"]),

  settings: defineTable({
    userId: v.id("users"),
    businessName: v.string(),
    phone: v.optional(v.string()),
    theme: v.string(), // light, dark, system
    currency: v.string(), // NGN, USD, etc.
    notifyPayments: v.optional(v.boolean()), // legacy deprecated field
    notifySummary: v.optional(v.boolean()),  // legacy deprecated field
    templateConfirmation: v.string(),
    templateReminder: v.string(),
    lowStockThreshold: v.optional(v.number()), // default 5 if not set
    stockpileDays: v.optional(v.number()),      // days before order is stockpiling, default 7
    templateStockpile: v.optional(v.string()),  // pickup-reminder message template
    // ── PLAN / BILLING ──────────────────────────────────────────────────────
    plan: v.optional(v.string()),                     // "free" | "trial" | "pro"
    planStartDate: v.optional(v.string()),            // ISO — when plan began
    planExpiresAt: v.optional(v.string()),            // ISO — when trial/plan expires
    paystackSubscriptionCode: v.optional(v.string()), // for managing Paystack subscription
  }).index("by_user", ["userId"])
    .index("by_expiry", ["planExpiresAt"]),

  inventoryLogs: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    type: v.string(), // sale, restock, adjustment, cancellation
    quantityChange: v.number(), // positive or negative
    reason: v.string(), // e.g. "Order #ORD-1001" or "Manual Restock"
    createdAt: v.string(),
  }).index("by_user", ["userId"])
    .index("by_product", ["productId"]),

  // Tracks which auto-generated notification keys the user has dismissed
  notificationReads: defineTable({
    userId: v.id("users"),
    notificationKey: v.string(), // e.g. "low_stock:productId123"
    readAt: v.string(),
  }).index("by_user", ["userId"]),

  // ── USER FEEDBACK / REVIEWS ──────────────────────────────────────────────
  feedback: defineTable({
    userId: v.id("users"),
    rating: v.number(), // 1 to 5
    type: v.string(), // "report_issue" | "feature_request" | "general_feedback"
    message: v.string(),
    businessHandle: v.optional(v.string()), // Optional IG/social handle
    isApproved: v.optional(v.boolean()), // Admin approval flag for Phase 2
    createdAt: v.string(), // ISO string
  }).index("by_user", ["userId"])
    .index("by_approved", ["isApproved"]),
});
