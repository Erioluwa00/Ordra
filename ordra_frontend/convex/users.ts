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

    const uidString = userId.toString();
    console.log("Starting full wipe for user:", uidString);

    // 1. Delete all business data
    const businessCollections = [
      "orders", "customers", "products", "categories", 
      "settings", "inventoryLogs", "notificationReads"
    ];

    for (const collection of businessCollections) {
      try {
        const records = await ctx.db.query(collection as any).collect();
        const userRecords = records.filter((r: any) => r.userId?.toString() === uidString);
        console.log(`Deleting ${userRecords.length} records from ${collection}`);
        for (const record of userRecords) {
          await ctx.db.delete(record._id);
        }
      } catch (e) {
        console.error(`Failed to clean collection ${collection}:`, e);
      }
    }

    // 2. ABSOLUTE AUTH WIPE
    const accountTables = ["accounts", "authAccounts", "sessions", "authSessions"];
    let totalWiped = 0;

    for (const tableName of accountTables) {
      try {
        const allRecords = await ctx.db.query(tableName as any).collect();
        console.log(`Checking table ${tableName}: ${allRecords.length} total records`);
        
        for (const record of allRecords) {
          // Diagnostic: Log the structure of the first record we find in auth tables
          if (totalWiped === 0) {
            console.log(`Structure of a record in ${tableName}:`, JSON.stringify(record));
          }

          // Scan EVERY field in the record for the User ID
          let isMatch = false;
          for (const key in record) {
            const val = (record as any)[key];
            if (val?.toString() === uidString) {
              isMatch = true;
              break;
            }
          }

          if (isMatch) {
            console.log(`MATCH FOUND in ${tableName}! Deleting record ${record._id}`);
            await ctx.db.delete(record._id);
            totalWiped++;
          }
        }
      } catch (e) {
        // Table doesn't exist, ignore
      }
    }
    console.log(`Total auth-related records wiped: ${totalWiped}`);

    // 3. Final User Wipe
    console.log("Deleting user document...");
    await ctx.db.delete(userId);
    console.log("Wipe complete.");
  },
});
