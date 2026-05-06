import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

export const webhook = httpAction(async (ctx, request) => {
  const body = await request.json();
  const signature = request.headers.get("x-paystack-signature");

  // TODO: In production, verify the signature using PAYSTACK_SECRET_KEY
  // For now, we will process the event if the signature exists
  if (!signature) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = body.event;
  const data = body.data;

  console.log(`Paystack Webhook Received: ${event}`);

  if (event === "charge.success") {
    const userId = data.metadata?.userId;
    const plan = data.metadata?.plan || "pro";

    if (userId) {
      console.log(`Payment successful for user ${userId}. Provisioning ${plan} plan...`);
      
      // Update the user's plan via an internal mutation
      await ctx.runMutation(api.settings.upgradeToPro, {
        userId,
        // Paystack subscription code if we're doing recurring, 
        // otherwise just the transaction reference
        subscriptionCode: data.reference, 
      });
    }
  }

  return new Response("Ok", { status: 200 });
});
