import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Fetch all products for the current user
export const getProducts = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Create a new product
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    quantity: v.optional(v.number()),
    category: v.optional(v.string()),
    sku: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const productId = await ctx.db.insert("products", {
      userId,
      ...args,
      quantity: args.quantity ?? 0,
      inStock: args.inStock ?? true,
    });
    return productId;
  },
});

// Update an existing product
export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    price: v.optional(v.number()),
    quantity: v.optional(v.number()),
    category: v.optional(v.string()),
    sku: v.optional(v.string()),
    inStock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...fields } = args;
    
    // Check for quantity change to log it
    if (fields.quantity !== undefined) {
      const product = await ctx.db.get(id);
      if (product && product.quantity !== fields.quantity) {
        const diff = fields.quantity - (product.quantity || 0);
        await ctx.db.insert("inventoryLogs", {
          userId,
          productId: id,
          type: diff > 0 ? "restock" : "adjustment",
          quantityChange: diff,
          reason: "Manual Update",
          createdAt: new Date().toISOString(),
        });
      }
    }

    await ctx.db.patch(id, fields);
  },
});

// Delete a product
export const deleteProduct = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
  },
});

// Adjust stock quantity (increment or decrement)
export const adjustStock = mutation({
  args: { productId: v.id("products"), amount: v.number() },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const newQuantity = (product.quantity || 0) + args.amount;
    await ctx.db.patch(args.productId, { 
      quantity: newQuantity,
      inStock: newQuantity > 0 
    });

    await ctx.db.insert("inventoryLogs", {
      userId: product.userId,
      productId: args.productId,
      type: args.amount > 0 ? "restock" : "adjustment",
      quantityChange: args.amount,
      reason: "Quick Adjustment",
      createdAt: new Date().toISOString(),
    });
  },
});

// Fetch logs for a specific product
export const getProductLogs = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("inventoryLogs")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(50);
  },
});

// Calculate performance metrics for all products
export const getProductPerformance = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const products = await ctx.db
      .query("products")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Map to store stats per product ID
    const statsMap: Record<string, { qtySold: number; revenue: number }> = {};

    // Initialize map with 0s for all products
    products.forEach(p => {
      statsMap[p._id] = { qtySold: 0, revenue: 0 };
    });

    // Aggregate from orders
    orders.forEach(order => {
      // Some old orders might not have the 'items' array yet
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (item.productId && statsMap[item.productId]) {
            statsMap[item.productId].qtySold += item.qty;
            statsMap[item.productId].revenue += (item.qty * item.price);
          }
        });
      }
    });

    // Combine with product info
    const performance = products.map(p => ({
      ...p,
      qtySold: statsMap[p._id].qtySold,
      revenue: statsMap[p._id].revenue,
    }));

    // Sort for best sellers
    const bestSellers = [...performance]
      .sort((a, b) => b.qtySold - a.qtySold)
      .filter(p => p.qtySold > 0)
      .slice(0, 5);

    // Sort for slow movers (ordered by least sold, then by quantity in stock)
    const slowMovers = [...performance]
      .sort((a, b) => a.qtySold - b.qtySold || (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 5);

    return {
      bestSellers,
      slowMovers,
      allPerformance: performance
    };
  },
});

