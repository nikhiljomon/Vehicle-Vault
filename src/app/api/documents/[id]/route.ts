import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const documentUpdateSchema = z
  .object({
    type: z
      .enum([
        "INSURANCE",
        "PUC",
        "RC",
        "FITNESS",
        "ROAD_TAX",
        "PERMIT",
        "DRIVING_LICENCE",
        "CUSTOM",
      ])
      .optional(),
    customTypeName: z.string().optional().nullable(),
    documentNumber: z.string().optional().nullable(),
    issueDate: z.string().optional().nullable(),
    expiryDate: z.string().min(1, "Expiry date is required").optional(),
    premium: z.union([z.number(), z.string()]).optional().nullable(),
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
      message: "Expiry date must be on or after issue date",
      path: ["expiryDate"],
    }
  );

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        vehicle: { userId },
      },
      include: {
        vehicle: true,
        history: {
          orderBy: { renewedAt: "desc" },
        },
        reminders: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Check ownership
    const existing = await prisma.document.findFirst({
      where: { id: params.id, vehicle: { userId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = documentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const {
      type,
      customTypeName,
      documentNumber,
      issueDate,
      expiryDate,
      notes,
      fileUrl,
      fileName,
      fileSize,
      metadata,
      premium,
    } = parsed.data;

    let premiumVal: number | null | undefined = undefined;
    if (premium !== undefined) {
      if (premium === null || premium === "") {
        premiumVal = null;
      } else {
        const num = Number(premium);
        if (!isNaN(num)) premiumVal = num;
      }
    } else if (metadata !== undefined) {
      try {
        const m = typeof metadata === "string" ? JSON.parse(metadata) : metadata;
        if (m && m.premium !== undefined) {
          const num = Number(m.premium);
          if (!isNaN(num)) premiumVal = num;
        }
      } catch {}
    }

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: {
        ...(type ? { type } : {}),
        customTypeName: type === "CUSTOM" ? customTypeName : existing.customTypeName,
        ...(documentNumber !== undefined ? { documentNumber: documentNumber?.trim() || null } : {}),
        ...(issueDate !== undefined ? { issueDate: issueDate ? new Date(issueDate) : null } : {}),
        ...(expiryDate ? { expiryDate: new Date(expiryDate) } : {}),
        ...(premiumVal !== undefined ? { premium: premiumVal } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(fileUrl !== undefined ? { fileUrl } : {}),
        ...(fileName !== undefined ? { fileName } : {}),
        ...(fileSize !== undefined ? { fileSize } : {}),
        ...(metadata !== undefined
          ? { metadata: typeof metadata === "string" ? metadata : JSON.stringify(metadata) }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const existing = await prisma.document.findFirst({
      where: { id: params.id, vehicle: { userId } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
