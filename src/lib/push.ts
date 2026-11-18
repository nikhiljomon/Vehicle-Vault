import * as webpush from "web-push";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendWebPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: PushPayload
) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@vehiclevault.local";

  if (!publicKey || !privateKey) {
    console.log(
      `[SIMULATED PUSH] Title: "${payload.title}" | Body: "${payload.body}" to ${subscription.endpoint.slice(0, 30)}...`
    );
    return { success: true, simulated: true };
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );

    return { success: true };
  } catch (error) {
    console.error("Web Push delivery failed:", error);
    return { success: false, error };
  }
}
