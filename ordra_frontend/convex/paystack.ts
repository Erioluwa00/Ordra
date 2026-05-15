import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const webhook = httpAction(async (ctx, request) => {
  console.log("🚀 PAYSTACK WEBHOOK ATTEMPT: Connection received!");
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!signature) {
    return new Response("No signature provided", { status: 400 });
  }

  // Verify the signature if the secret key is configured
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (secret) {
    const isValid = await verifyPaystackSignature(rawBody, signature, secret);
    if (!isValid) {
      console.error("❌ Paystack Webhook: Invalid Signature detected.");
      return new Response("Invalid signature", { status: 401 });
    }
    console.log("✅ Paystack Webhook: Signature verified!");
  } else {
    console.warn("⚠️ PAYSTACK_SECRET_KEY not set. Skipping verification.");
  }

  const body = JSON.parse(rawBody);
  const event = body.event;
  const data = body.data;

  console.log(`Paystack Webhook Received: ${event}`);

  if (event === "charge.success") {
    const userId = data.metadata?.userId;
    const plan = data.metadata?.plan || "pro";
    const amount = data.amount; // amount in kobo

    // Verify the amount (₦5,000 = 500,000 kobo)
    const EXPECTED_AMOUNT = 5000;
    if (amount < EXPECTED_AMOUNT) {
      console.error(`Paystack Webhook: Underpayment detected for user ${userId}. Expected ${EXPECTED_AMOUNT}, got ${amount}.`);
      return new Response("Underpayment detected", { status: 400 });
    }

    if (userId) {
      console.log(`Payment successful for user ${userId}. Provisioning ${plan} plan...`);

      // Update the user's plan via an internal mutation
      await ctx.runMutation(internal.settings.upgradeToPro, {
        userId,
        paystackSubscriptionCode: data.subscription_code || data.reference,
      });
      console.log("🎊 Plan upgraded to PRO successfully!");
    } else {
      console.error("❌ Webhook failed: No userId found in metadata.");
    }
  }

  return new Response("Ok", { status: 200 });
});

/**
 * Helper to verify Paystack HMAC-SHA512 signature using Web Crypto API
 */
async function verifyPaystackSignature(
  requestBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();

  // Import the secret key for HMAC
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );

  // Sign the raw request body
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(requestBody)
  );

  // Convert the computed signature to hex string
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  return hashHex === signature;
}
