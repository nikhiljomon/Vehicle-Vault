import cron from "node-cron";
import { runReminderCheck } from "../src/lib/reminders";

console.log("=========================================");
console.log(" VehicleVault Background Cron Worker");
console.log("=========================================");

// Check if run immediately flag was passed (e.g. tsx scripts/cron-worker.ts --now)
const runImmediately = process.argv.includes("--now");

async function executeJob() {
  console.log(`[${new Date().toISOString()}] Starting daily reminder check...`);
  try {
    const result = await runReminderCheck();
    console.log(`[${new Date().toISOString()}] Reminder job completed successfully:`);
    console.log(` - Users scanned: ${result.processedUsers}`);
    console.log(` - Documents evaluated: ${result.documentsChecked}`);
    console.log(` - Emails dispatched: ${result.emailsSent}`);
    console.log(` - In-app alerts generated: ${result.inAppCreated}`);
    console.log(` - Push alerts triggered: ${result.pushSent}`);
    if (result.details.length > 0) {
      console.log(" Dispatched details:", JSON.stringify(result.details, null, 2));
    } else {
      console.log(" No new reminders required for today's criteria.");
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error running reminder job:`, error);
  }
}

if (runImmediately) {
  console.log("Running immediate one-off check (--now flag detected)...");
  executeJob().then(() => {
    console.log("One-off run finished. Continuing scheduled listener...");
  });
}

// Default schedule: Every day at 8:00 AM
const cronSchedule = process.env.CRON_SCHEDULE || "0 8 * * *";
console.log(`Scheduler registered with cron expression: "${cronSchedule}"`);

cron.schedule(cronSchedule, () => {
  executeJob();
});
