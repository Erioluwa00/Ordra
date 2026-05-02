import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Create a new order and potentially a new customer
export const createOrder = mutation({
  args: {
    customerName: v.string(),
    customerPhone: v.string(),
    items: v.array(v.object({
      productId: v.optional(v.id("products")),
      desc: v.string(),
      qty: v.number(),
      price: v.number()
    })),
    total: v.number(),
    amountPaid: v.number(),
    paymentStatus: v.string(), // paid, unpaid, partial
    status: v.string(), // New, Processing, Ready, Delivered
    deliveryAddress: v.string(),
    notes: v.string(),
    deliveryDate: v.optional(v.string()),
    isUrgent: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 1. Find or Create Customer
    let customer = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("phone"), args.customerPhone))
      .first();

    if (!customer) {
      const customerId = await ctx.db.insert("customers", {
        userId,
        name: args.customerName,
        phone: args.customerPhone,
        totalOrders: 1,
        lifetimeValue: args.amountPaid,
        address: args.deliveryAddress,
        createdAt: new Date().toISOString(),
      });
      // Continue with the new ID
    } else {
      await ctx.db.patch(customer._id, {
        totalOrders: customer.totalOrders + 1,
        lifetimeValue: customer.lifetimeValue + args.amountPaid,
        address: args.deliveryAddress, // Keep address updated
      });
    }

    // 2. Generate a pretty Order ID (e.g. ORD-1234)
    const count = (await ctx.db.query("orders").collect()).length;
    const displayId = `ORD-${1000 + count}`;

    // 3. Insert the Order
    const orderId = await ctx.db.insert("orders", {
      userId,
      orderId: displayId,
      customer: args.customerName,
      customerPhone: args.customerPhone,
      item: args.items[0]?.desc || "New Order",
      items: args.items,
      total: args.total,
      amountPaid: args.amountPaid,
      paymentStatus: args.paymentStatus,
      status: args.status,
      deliveryAddress: args.deliveryAddress,
      notes: args.notes,
      deliveryDate: args.deliveryDate,
      isUrgent: args.isUrgent,
      createdAt: new Date().toISOString(),
    });
    
    // 4. Decrement Stock for products
    for (const item of args.items) {
      if (item.productId) {
        const product = await ctx.db.get(item.productId);
        if (product) {
          const newQty = (product.quantity || 0) - item.qty;
          await ctx.db.patch(item.productId, { 
            quantity: newQty,
            inStock: newQty > 0
          });

          // Log the sale
          await ctx.db.insert("inventoryLogs", {
            userId,
            productId: item.productId,
            type: "sale",
            quantityChange: -item.qty,
            reason: `Order ${displayId}`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return orderId;
  },
});

// Fetch recent orders for the dashboard
export const getRecentOrders = query({
  args: { limit: v.number() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(args.limit);
  },
});

// Fetch all orders for the detailed Orders page
export const getAllOrders = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Fetch summary metrics for the dashboard
export const getDashboardStats = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const allOrders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const totalRevenue = allOrders
      .filter(o => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.total, 0);

    const pendingPayments = allOrders
      .filter(o => o.paymentStatus === "unpaid" || o.paymentStatus === "partial")
      .reduce((sum, o) => sum + (o.total - o.amountPaid), 0);

    const activeOrders = allOrders.filter(o => o.status !== "Delivered").length;

    return {
      totalRevenue,
      pendingPayments,
      activeOrders,
      totalOrders: allOrders.length,
    };
  },
});

// Update an order's status (e.g. New -> Delivered)
export const updateOrderStatus = mutation({
  args: { orderId: v.id("orders"), status: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const oldStatus = order.status;
    await ctx.db.patch(args.orderId, { status: args.status });

    // Handle stock recovery on cancellation
    if (args.status === "Cancelled" && oldStatus !== "Cancelled") {
      for (const item of (order.items || [])) {
        if (item.productId) {
          const product = await ctx.db.get(item.productId);
          if (product) {
            const newQty = (product.quantity || 0) + (item.qty || 0);
            await ctx.db.patch(item.productId, { 
              quantity: newQty,
              inStock: newQty > 0
            });

            // Log stock recovery
            await ctx.db.insert("inventoryLogs", {
              userId,
              productId: item.productId,
              type: "cancellation",
              quantityChange: item.qty || 0,
              reason: `Order ${order.orderId} cancelled`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    } 
    // Handle stock deduction if un-cancelled
    else if (oldStatus === "Cancelled" && args.status !== "Cancelled") {
       for (const item of (order.items || [])) {
        if (item.productId) {
          const product = await ctx.db.get(item.productId);
          if (product) {
            const newQty = (product.quantity || 0) - (item.qty || 0);
            await ctx.db.patch(item.productId, { 
              quantity: newQty,
              inStock: newQty > 0
            });

            // Log stock deduction
            await ctx.db.insert("inventoryLogs", {
              userId,
              productId: item.productId,
              type: "sale",
              quantityChange: -(item.qty || 0),
              reason: `Order ${order.orderId} re-opened`,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }
  },
});

// Update an order's priority fields (delivery date and urgency flag)
export const updateOrderPriority = mutation({
  args: { 
    orderId: v.id("orders"), 
    deliveryDate: v.optional(v.string()), 
    isUrgent: v.optional(v.boolean()) 
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== userId) throw new Error("Order not found or unauthorized");

    const patch: any = {};
    if (args.deliveryDate !== undefined) patch.deliveryDate = args.deliveryDate;
    if (args.isUrgent !== undefined) patch.isUrgent = args.isUrgent;

    await ctx.db.patch(args.orderId, patch);
  },
});

// Update an order's payment status (e.g. Unpaid -> Paid)
export const updateOrderPaymentStatus = mutation({
  args: { orderId: v.id("orders"), paymentStatus: v.string(), amountPaid: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const patch: any = { paymentStatus: args.paymentStatus };
    if (args.paymentStatus === "paid") {
      patch.amountPaid = order.total;
    } else if (args.amountPaid !== undefined) {
      patch.amountPaid = args.amountPaid;
    }

    await ctx.db.patch(args.orderId, patch);

    // Update customer lifetime value if it changed to paid
    if (args.paymentStatus === "paid" && order.paymentStatus !== "paid") {
      const customer = await ctx.db
        .query("customers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("phone"), order.customerPhone))
        .first();

      if (customer) {
        await ctx.db.patch(customer._id, {
          lifetimeValue: customer.lifetimeValue + (order.total - order.amountPaid),
        });
      }
    }
  },
});

// Analytics Query for Charts
export const getAnalytics = query({
  args: { days: v.number() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const now = new Date();
    const startTime = new Date();
    startTime.setDate(now.getDate() - args.days);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter by date and group by day
    const dataByDay: Record<string, any> = {};
    
    // Pre-fill days to ensure no gaps
    for (let i = args.days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dataByDay[key] = {
        date: d.getTime(),
        revenue: 0,
        orders: 0,
        paid: 0,
        unpaid: 0,
        label: args.days <= 7 ? d.toLocaleDateString('en-GB', { weekday: 'short' }) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      };
    }

    orders.forEach(o => {
      const dayKey = o.createdAt.split('T')[0];
      if (dataByDay[dayKey]) {
        dataByDay[dayKey].revenue += o.total;
        dataByDay[dayKey].orders += 1;
        if (o.paymentStatus === "paid") {
          dataByDay[dayKey].paid += o.total;
        } else {
          dataByDay[dayKey].paid += o.amountPaid;
          dataByDay[dayKey].unpaid += (o.total - o.amountPaid);
        }
      }
    });

    return Object.values(dataByDay).sort((a: any, b: any) => a.date - b.date);
  },
});

// Fetch all customers owned by the user
export const getCustomers = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Create a new customer manually
export const createCustomer = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if phone already exists for this user
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("phone"), args.phone))
      .first();

    if (existing) throw new Error("A customer with this phone number already exists");

    return await ctx.db.insert("customers", {
      userId,
      name: args.name,
      phone: args.phone,
      email: args.email,
      address: args.address, // Note: customers table should have an address field if we want to store it here too
      notes: args.notes,
      totalOrders: 0,
      lifetimeValue: 0,
      createdAt: new Date().toISOString(),
    });
  },
});

// Update customer details (notes, email, address, etc.)
export const updateCustomer = mutation({
  args: {
    customerId: v.id("customers"),
    email: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    
    // Safety check: ensure the user owns this customer
    const existing = await ctx.db.get(args.customerId);
    if (!existing || existing.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.patch(args.customerId, {
      email: args.email,
      notes: args.notes,
    });
  },
});

// Delete a customer
export const deleteCustomer = mutation({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.get(args.customerId);
    if (!existing || existing.userId !== userId) throw new Error("Unauthorized");

    await ctx.db.delete(args.customerId);
  },
});

// Fetch all orders for a specific phone number
export const getOrdersByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("customerPhone"), args.phone))
      .order("desc")
      .collect();
  },
});

// Bulk update orders
export const bulkUpdateOrders = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const results = [];
    for (const orderId of args.orderIds) {
      try {
        const order = await ctx.db.get(orderId);
        if (!order || order.userId !== userId) continue;

        // 1. Update Status if provided
        if (args.status && args.status !== order.status) {
          const oldStatus = order.status;
          await ctx.db.patch(orderId, { status: args.status });

          // Stock recovery logic
          if (args.status === "Cancelled" && oldStatus !== "Cancelled") {
            for (const item of (order.items || [])) {
              if (item.productId) {
                const product = await ctx.db.get(item.productId);
                if (product) {
                  const newQty = (product.quantity || 0) + (item.qty || 0);
                  await ctx.db.patch(item.productId, { quantity: newQty, inStock: newQty > 0 });

                  await ctx.db.insert("inventoryLogs", {
                    userId,
                    productId: item.productId,
                    type: "cancellation",
                    quantityChange: item.qty || 0,
                    reason: `Order ${order.orderId} cancelled (Bulk)`,
                    createdAt: new Date().toISOString(),
                  });
                }
              }
            }
          } else if (oldStatus === "Cancelled" && args.status !== "Cancelled") {
            for (const item of (order.items || [])) {
              if (item.productId) {
                const product = await ctx.db.get(item.productId);
                if (product) {
                  const newQty = (product.quantity || 0) - (item.qty || 0);
                  await ctx.db.patch(item.productId, { quantity: newQty, inStock: newQty > 0 });

                  await ctx.db.insert("inventoryLogs", {
                    userId,
                    productId: item.productId,
                    type: "sale",
                    quantityChange: -(item.qty || 0),
                    reason: `Order ${order.orderId} re-opened (Bulk)`,
                    createdAt: new Date().toISOString(),
                  });
                }
              }
            }
          }
        }

        // 2. Update Payment Status if provided
        if (args.paymentStatus && args.paymentStatus !== order.paymentStatus) {
          const patch: any = { paymentStatus: args.paymentStatus };
          if (args.paymentStatus === "paid") {
            patch.amountPaid = order.total;
            
            // Update customer lifetime value
            const customer = await ctx.db
              .query("customers")
              .withIndex("by_user", (q) => q.eq("userId", userId))
              .filter((q) => q.eq(q.field("phone"), order.customerPhone))
              .first();

            if (customer) {
              await ctx.db.patch(customer._id, {
                lifetimeValue: customer.lifetimeValue + (order.total - order.amountPaid),
              });
            }
          }
          await ctx.db.patch(orderId, patch);
        }
        results.push(orderId);
      } catch (err) {
        console.error(`Failed to update order ${orderId}:`, err);
      }
    }
    return results;
  },
});

// Fetch all customers with outstanding debt
export const getDebtors = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const unpaidOrders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.neq(q.field("paymentStatus"), "paid"))
      .filter((q) => q.neq(q.field("status"), "Cancelled"))
      .collect();

    const debtorsMap: Record<string, any> = {};

    for (const order of unpaidOrders) {
      const balance = order.total - (order.amountPaid || 0);
      if (balance <= 0) continue;

      if (!debtorsMap[order.customerPhone]) {
        debtorsMap[order.customerPhone] = {
          name: order.customer,
          phone: order.customerPhone,
          totalOwed: 0,
          ordersCount: 0,
          oldestOrderDate: order.createdAt,
          orders: []
        };
      }

      const d = debtorsMap[order.customerPhone];
      d.totalOwed += balance;
      d.ordersCount += 1;
      d.orders.push({
        _id: order._id,
        orderId: order.orderId,
        total: order.total,
        balance: balance,
        createdAt: order.createdAt
      });
      if (new Date(order.createdAt) < new Date(d.oldestOrderDate)) {
        d.oldestOrderDate = order.createdAt;
      }
    }

    return Object.values(debtorsMap).sort((a: any, b: any) => b.totalOwed - a.totalOwed);
  },
});

// Mark one or more orders as "stockpile-notified"
export const markNotified = mutation({
  args: {
    orderIds: v.array(v.id("orders")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = new Date().toISOString();
    for (const orderId of args.orderIds) {
      const order = await ctx.db.get(orderId);
      if (!order || order.userId !== userId) continue;
      await ctx.db.patch(orderId, { notifiedAt: now });
    }
  },
});

