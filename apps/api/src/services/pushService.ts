import webpush from "web-push";

export function configureWebPush() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("[PUSH] VAPID keys not set. Generating temporary keys for this runtime. Add these to Render/.env:");
    const keys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
    process.env.VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@nodere.com.br";
    console.warn(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
    console.warn(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
    console.warn(`VAPID_EMAIL=${process.env.VAPID_EMAIL}`);
  }

  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_EMAIL || "mailto:admin@nodere.com.br",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    console.log("[PUSH] Web Push configured successfully.");
  }
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || "";
}
