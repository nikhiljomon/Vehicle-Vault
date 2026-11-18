import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runReminderCheck } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return handleCronTrigger(req);
}

export async function POST(req: Request) {
  return handleCronTrigger(req);
}

async function handleCronTrigger(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.CRON_SECRET;

    // Check if bearer token matches CRON_SECRET
    const isTokenValid =
      secret && authHeader && authHeader === `Bearer ${secret}`;

    // Alternatively, allow authenticated user sessions to trigger manual check
    const session = await getServerSession(authOptions);
    const isAuthenticatedUser = !!session?.user;

    if (!isTokenValid && !isAuthenticatedUser) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid CRON_SECRET or unauthenticated session" },
        { status: 401 }
      );
    }

    const result = await runReminderCheck();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Scheduled reminder cron execution failed:", error);
    return NextResponse.json(
      { error: "Cron execution failed", details: String(error) },
      { status: 500 }
    );
  }
}
