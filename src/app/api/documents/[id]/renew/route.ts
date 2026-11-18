import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const renewSchema = z
  .object({
    expiryDate: z.string().min(1, "New expiry date is required"),
    issueDate: z.string().optional().nullable(),
    documentNumber: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    fileUrl: z.string().optional().nullable(),
    fileName: z.string().optional().nullable(),
    fileSize: z.number().optional().nullable(),
    metadata: z.any().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.issueDate && data.expiryDate) {
        return new Date(data.expiryDate) >= new Date(data.issueDate);
      }
      return true;
    },
    {
      message: "New expiry date must be after issue date",
      path: ["expiryDate"],
    }
  );

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Verify document exists and belongs to user
    const existing = await prisma.document.findFirst({
      where: {
        id: params.id,
        vehicle: { userId },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = renewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid renewal parameters" },
        { status: 400 }
      );
    }

    const {
      expiryDate,
      issueDate,
      documentNumber,
      notes,
      fileUrl,
      fileName,
      fileSize,
      metadata,
    } = parsed.data;

    // Run transaction: Archive old record in DocumentHistory + Update Document + Reset ReminderLogs
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create history archive
      await tx.documentHistory.create({
        data: {
          documentId: existing.id,
          documentNumber: existing.documentNumber,
          issueDate: existing.issueDate,
          expiryDate: existing.expiryDate,
          fileUrl: existing.fileUrl,
          fileName: existing.fileName,
          notes: existing.notes,
          metadata: existing.metadata,
          renewedAt: new Date(),
        },
      });

      // 2. Clear old reminder logs for this document cycle
      await tx.reminderLog.deleteMany({
        where: { documentId: existing.id },
      });

      // 3. Update the document with new parameters
      const updated = await tx.document.update({
        where: { id: existing.id },
        data: {
          expiryDate: new Date(expiryDate),
          issueDate: issueDate ? new Date(issueDate) : existing.issueDate,
          documentNumber: documentNumber !== undefined ? (documentNumber?.trim() || null) : existing.documentNumber,
          notes: notes !== undefined ? notes : existing.notes,
          fileUrl: fileUrl !== undefined ? fileUrl : existing.fileUrl,
          fileName: fileName !== undefined ? fileName : existing.fileName,
          fileSize: fileSize !== undefined ? fileSize : existing.fileSize,
          metadata: metadata !== undefined
            ? (typeof metadata === "string" ? metadata : JSON.stringify(metadata))
            : existing.metadata,
        },
        include: {
          history: {
            orderBy: { renewedAt: "desc" },
          },
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error renewing document:", error);
    return NextResponse.json({ error: "Failed to renew document" }, { status: 500 });
  }
}
