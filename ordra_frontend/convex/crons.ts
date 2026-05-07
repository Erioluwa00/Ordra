import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run the plan expiry check every hour
crons.hourly(
  "check-expired-plans",
  { hourUTC: 0, minuteUTC: 0 }, 
  internal.settings.checkExpiredPlans,
);

export default crons;
