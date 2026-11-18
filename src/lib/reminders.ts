import { prisma } from "./db";
import { getDaysRemaining, formatDocumentType } from "./utils";
import { sendExpiryReminderEmail } from "./email";
import { sendWebPushNotification } from "./push";

export interface ReminderJobResult {
  success: boolean;
  timestamp: string;
  processedUsers: number;
  documentsChecked: number;
  emailsSent: number;
  inAppCreated: number;
  pushSent: number;
  details: Array<{
    documentId: string;
    vehicleName: string;
    documentType: string;
    daysRemaining: number;
    channels: string[];
  }>;
}

export async function runReminderCheck(): Promise<ReminderJobResult> {
  const result: ReminderJobResult = {
    success: true,
    timestamp: new Date().toISOString(),
    processedUsers: 0,
    documentsChecked: 0,
    emailsSent: 0,
    inAppCreated: 0,
    pushSent: 0,
    details: [],
  };

  // Fetch all users with their vehicles, documents, notification settings, and push subscriptions
  const users = await prisma.user.findMany({
    include: {
      notificationSetting: true,
      pushSubscriptions: true,
      vehicles: {
        include: {
          documents: {
            include: {
              reminders: true,
            },
          },
        },
      },
    },
  });

  result.processedUsers = users.length;

  for (const user of users) {
    // Parse user reminder days (default: [30, 15, 7, 1, 0])
    const reminderDaysList: number[] = (user.notificationSetting?.reminderDays || "30,15,7,1,0")
      .split(",")
      .map((d) => parseInt(d.trim(), 10))
      .filter((n) => !isNaN(n));

    const emailEnabled = user.notificationSetting ? user.notificationSetting.emailEnabled : true;
    const inAppEnabled = user.notificationSetting ? user.notificationSetting.inAppEnabled : true;
    const pushEnabled = user.notificationSetting ? user.notificationSetting.pushEnabled : true;

    for (const vehicle of user.vehicles) {
      for (const doc of vehicle.documents) {
        result.documentsChecked++;
        const daysRemaining = getDaysRemaining(doc.expiryDate);

        // Check if current daysRemaining matches any of the user's alert windows
        // e.g. 30, 15, 7, 1, 0, or negative if overdue
        const shouldAlert = reminderDaysList.includes(daysRemaining) || (daysRemaining < 0 && daysRemaining >= -3);

        if (!shouldAlert) continue;

        const docTypeLabel = formatDocumentType(doc.type, doc.customTypeName);
        const loggedChannelsForDay = doc.reminders
          .filter((r) => r.daysBeforeExpiry === daysRemaining)
          .map((r) => r.channel);

        const channelsTriggered: string[] = [];

        // 1. Email notification
        if (emailEnabled && user.email && !loggedChannelsForDay.includes("EMAIL")) {
          try {
            await sendExpiryReminderEmail({
              to: user.email,
              userName: user.name || "Driver",
              vehicleName: vehicle.nickname || `${vehicle.make} ${vehicle.model}`,
              registrationNumber: vehicle.registrationNumber,
              documentType: docTypeLabel,
              expiryDate: doc.expiryDate,
              daysRemaining,
            });

            await prisma.reminderLog.create({
              data: {
                documentId: doc.id,
                daysBeforeExpiry: daysRemaining,
                channel: "EMAIL",
                recipient: user.email,
                status: "SENT",
              },
            });

            result.emailsSent++;
            channelsTriggered.push("EMAIL");
          } catch (err) {
            console.error(`Failed to dispatch email reminder for doc ${doc.id}:`, err);
          }
        }

        // 2. In-App notification
        if (inAppEnabled && !loggedChannelsForDay.includes("IN_APP")) {
          try {
            const urgency =
              daysRemaining < 0
                ? "has EXPIRED!"
                : daysRemaining === 0
                ? "expires TODAY!"
                : `expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}.`;

            await prisma.notification.create({
              data: {
                userId: user.id,
                title: `${docTypeLabel} Expiry Alert`,
                message: `${docTypeLabel} for ${vehicle.nickname} (${vehicle.registrationNumber}) ${urgency}`,
                link: `/vehicles/${vehicle.id}`,
              },
            });

            await prisma.reminderLog.create({
              data: {
                documentId: doc.id,
                daysBeforeExpiry: daysRemaining,
                channel: "IN_APP",
                status: "SENT",
              },
            });

            result.inAppCreated++;
            channelsTriggered.push("IN_APP");
          } catch (err) {
            console.error(`Failed to create in-app reminder for doc ${doc.id}:`, err);
          }
        }

        // 3. Web Push notification
        if (pushEnabled && user.pushSubscriptions.length > 0 && !loggedChannelsForDay.includes("PUSH")) {
          try {
            const pushTitle = `${docTypeLabel} Expiry Alert`;
            const pushBody = `${docTypeLabel} for ${vehicle.nickname} expires in ${daysRemaining} day${
              daysRemaining === 1 ? "" : "s"
            }. Tap to renew.`;

            for (const sub of user.pushSubscriptions) {
              await sendWebPushNotification(sub, {
                title: pushTitle,
                body: pushBody,
                url: `/vehicles/${vehicle.id}`,
              });
            }

            await prisma.reminderLog.create({
              data: {
                documentId: doc.id,
                daysBeforeExpiry: daysRemaining,
                channel: "PUSH",
                status: "SENT",
              },
            });

            result.pushSent++;
            channelsTriggered.push("PUSH");
          } catch (err) {
            console.error(`Failed to send web push for doc ${doc.id}:`, err);
          }
        }

        if (channelsTriggered.length > 0) {
          result.details.push({
            documentId: doc.id,
            vehicleName: `${vehicle.nickname} (${vehicle.registrationNumber})`,
            documentType: docTypeLabel,
            daysRemaining,
            channels: channelsTriggered,
          });
        }
      }
    }
  }

  return result;
}
