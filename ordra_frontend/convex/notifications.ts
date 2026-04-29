import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// ─────────────────────────────────────────────────────────────────────────────
// getNotifications — computes live notifications from products + orders
// Returns an array of notification objects sorted by severity then date
// ─────────────────────────────────────────────────────────────────────────────
export const getNotifications = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    // Fetch all needed data in parallel
    const [products, orders, settings, reads] = await Promise.all([
      ctx.db.query("products").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("orders").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("settings").withIndex("by_user", (q) => q.eq("userId", userId)).unique(),
      ctx.db.query("notificationReads").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    const threshold = settings?.lowStockThreshold ?? 5;
    const readKeys = new Set(reads.map((r) => r.notificationKey));
    const now = Date.now();
    const notifications: Array<{
      key: string;
      type: string;
      severity: "critical" | "warning" | "info";
      title: string;
      message: string;
      link: string;
      read: boolean;
      timestamp: number;
    }> = [];

    // ── 1. STOCK ALERTS ───────────────────────────────────────────────────────
    for (const product of products) {
      const qty = product.quantity ?? 0;

      // Out of stock
      if (!product.inStock || qty <= 0) {
        const key = `out_of_stock:${product._id}`;
        notifications.push({
          key,
          type: "out_of_stock",
          severity: "critical",
          title: "Out of Stock",
          message: `"${product.name}" has run out. Restock now to avoid missing orders.`,
          link: "/app/products",
          read: readKeys.has(key),
          timestamp: now,
        });
      }
      // Low stock (only show if not already out of stock)
      else if (qty > 0 && qty <= threshold) {
        const key = `low_stock:${product._id}`;
        notifications.push({
          key,
          type: "low_stock",
          severity: "warning",
          title: "Low Stock",
          message: `"${product.name}" only has ${qty} unit${qty !== 1 ? "s" : ""} left (threshold: ${threshold}).`,
          link: "/app/products",
          read: readKeys.has(key),
          timestamp: now,
        });
      }
    }

    // ── 2. DELIVERY ALERTS ────────────────────────────────────────────────────
    const activeStatuses = new Set(["New", "Pending", "Processing", "Ready"]);

    for (const order of orders) {
      if (!order.deliveryDate) continue;
      if (!activeStatuses.has(order.status)) continue;

      const deliveryTime = new Date(order.deliveryDate).getTime();
      const hoursUntil = (deliveryTime - now) / (1000 * 60 * 60);
      const customerLabel = order.customer ? `for ${order.customer}` : "";

      // Overdue delivery (past due date)
      if (hoursUntil < 0) {
        const key = `overdue_delivery:${order._id}`;
        const daysOverdue = Math.floor(Math.abs(hoursUntil) / 24);
        notifications.push({
          key,
          type: "overdue_delivery",
          severity: "critical",
          title: "Delivery Overdue",
          message: `Order ${order.orderId} ${customerLabel} was due ${daysOverdue > 0 ? `${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} ago` : "today"} and is still ${order.status}.`,
          link: `/app/orders?id=${order._id}`,
          read: readKeys.has(key),
          timestamp: deliveryTime,
        });
      }
      // Upcoming delivery (within 24 hours)
      else if (hoursUntil <= 24) {
        const key = `upcoming_delivery:${order._id}`;
        const hoursLabel = hoursUntil < 1
          ? "less than an hour"
          : `~${Math.round(hoursUntil)} hour${Math.round(hoursUntil) !== 1 ? "s" : ""}`;
        notifications.push({
          key,
          type: "upcoming_delivery",
          severity: "warning",
          title: "Delivery Due Soon",
          message: `Order ${order.orderId} ${customerLabel} is due in ${hoursLabel}. Status: ${order.status}.`,
          link: `/app/orders?id=${order._id}`,
          read: readKeys.has(key),
          timestamp: deliveryTime,
        });
      }
    }

    // ── 3. OVERDUE DEBT ALERTS ────────────────────────────────────────────────
    // Group unpaid orders by customer phone, flag if oldest is > 7 days old
    const debtMap = new Map<string, { name: string; phone: string; oldestDate: number; count: number; totalOwed: number }>();

    for (const order of orders) {
      if (order.paymentStatus === "paid") continue;
      if (order.status === "Cancelled") continue;

      const orderDate = new Date(order.createdAt).getTime();
      const daysOld = (now - orderDate) / (1000 * 60 * 60 * 24);
      if (daysOld < 7) continue; // only alert after 7 days

      const phone = order.customerPhone;
      if (!phone) continue;

      const existing = debtMap.get(phone);
      const balance = (order.total || 0) - (order.amountPaid || 0);

      if (existing) {
        existing.count += 1;
        existing.totalOwed += balance;
        if (orderDate < existing.oldestDate) existing.oldestDate = orderDate;
      } else {
        debtMap.set(phone, {
          name: order.customer,
          phone,
          oldestDate: orderDate,
          count: 1,
          totalOwed: balance,
        });
      }
    }

    for (const [phone, debt] of debtMap.entries()) {
      const key = `overdue_debt:${phone}`;
      const daysOld = Math.floor((now - debt.oldestDate) / (1000 * 60 * 60 * 24));
      const formattedAmount = new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
      }).format(debt.totalOwed);

      notifications.push({
        key,
        type: "overdue_debt",
        severity: "info",
        title: "Overdue Payment",
        message: `${debt.name} owes ${formattedAmount} across ${debt.count} order${debt.count !== 1 ? "s" : ""} (oldest: ${daysOld} days ago).`,
        link: "/app/debts",
        read: readKeys.has(key),
        timestamp: debt.oldestDate,
      });
    }

    // ── Sort: unread first, then by severity (critical > warning > info), then by timestamp ──
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    notifications.sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      if (a.severity !== b.severity) return severityOrder[a.severity] - severityOrder[b.severity];
      return b.timestamp - a.timestamp;
    });

    return notifications;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// getUnreadCount — returns just the count, efficient for the badge
// ─────────────────────────────────────────────────────────────────────────────
export const getUnreadCount = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return 0;

    const [products, orders, settings, reads] = await Promise.all([
      ctx.db.query("products").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("orders").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
      ctx.db.query("settings").withIndex("by_user", (q) => q.eq("userId", userId)).unique(),
      ctx.db.query("notificationReads").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
    ]);

    const threshold = settings?.lowStockThreshold ?? 5;
    const readKeys = new Set(reads.map((r) => r.notificationKey));
    const now = Date.now();
    let count = 0;

    // Stock
    for (const p of products) {
      const qty = p.quantity ?? 0;
      if (!p.inStock || qty <= 0) {
        if (!readKeys.has(`out_of_stock:${p._id}`)) count++;
      } else if (qty > 0 && qty <= threshold) {
        if (!readKeys.has(`low_stock:${p._id}`)) count++;
      }
    }

    // Delivery
    const activeStatuses = new Set(["New", "Pending", "Processing", "Ready"]);
    for (const order of orders) {
      if (!order.deliveryDate || !activeStatuses.has(order.status)) continue;
      const deliveryTime = new Date(order.deliveryDate).getTime();
      const hoursUntil = (deliveryTime - now) / (1000 * 60 * 60);
      if (hoursUntil < 0 && !readKeys.has(`overdue_delivery:${order._id}`)) count++;
      else if (hoursUntil <= 24 && hoursUntil >= 0 && !readKeys.has(`upcoming_delivery:${order._id}`)) count++;
    }

    // Debts
    const debtPhones = new Set<string>();
    for (const order of orders) {
      if (order.paymentStatus === "paid" || order.status === "Cancelled") continue;
      const daysOld = (now - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld >= 7 && order.customerPhone && !debtPhones.has(order.customerPhone)) {
        if (!readKeys.has(`overdue_debt:${order.customerPhone}`)) {
          debtPhones.add(order.customerPhone);
          count++;
        }
      }
    }

    return count;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// markAllRead — upserts read records for all currently active notification keys
// ─────────────────────────────────────────────────────────────────────────────
export const markAllRead = mutation({
  args: { keys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingReads = await ctx.db
      .query("notificationReads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const alreadyRead = new Set(existingReads.map((r) => r.notificationKey));
    const now = new Date().toISOString();

    for (const key of args.keys) {
      if (!alreadyRead.has(key)) {
        await ctx.db.insert("notificationReads", { userId, notificationKey: key, readAt: now });
      }
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// clearStaleReads — housekeeping: removes read records for notifications that
// no longer exist (e.g., product restocked, debt paid). Call periodically.
// ─────────────────────────────────────────────────────────────────────────────
export const clearStaleReads = mutation({
  args: { activeKeys: v.array(v.string()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const activeSet = new Set(args.activeKeys);
    const reads = await ctx.db
      .query("notificationReads")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const read of reads) {
      if (!activeSet.has(read.notificationKey)) {
        await ctx.db.delete(read._id);
      }
    }
  },
});
