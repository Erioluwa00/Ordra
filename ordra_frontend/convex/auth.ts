import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Google,
    Password({
      reset: Email({
        id: "reset",
        generateVerificationToken: () => {
          const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          return Array.from(crypto.getRandomValues(new Uint8Array(6)))
            .map((b) => chars[b % chars.length])
            .join("");
        },
        sendVerificationRequest: async ({ identifier, url, token, provider, request }) => {
          const resendApiKey = process.env.RESEND_API_KEY;
          
          if (!resendApiKey) {
            console.error("Missing RESEND_API_KEY environment variable. OTP:", token);
            return;
          }

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Ordra <onboarding@resend.dev>",
              to: [identifier],
              subject: "Password Reset - Your Verification Code",
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #111827;">Reset Your Password</h2>
                  <p style="color: #374151; font-size: 16px;">We received a request to reset the password for your Ordra account.</p>
                  <p style="color: #374151; font-size: 16px;">Your 6-character verification code is:</p>
                  <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #4f46e5;">${token}</span>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
              `,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to send OTP email via Resend:", errorText);
            throw new Error("Failed to send verification email.");
          }
        },
      }),
    }),
  ],
});
