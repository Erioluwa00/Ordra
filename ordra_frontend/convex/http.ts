import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { webhook } from "./paystack";

const http = httpRouter();

auth.addHttpRoutes(http);

// Paystack Webhook
http.route({
  path: "/paystack",
  method: "POST",
  handler: webhook,
});

export default http;
