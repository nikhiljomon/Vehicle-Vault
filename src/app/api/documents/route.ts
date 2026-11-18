import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDaysRemaining } from "@/lib/utils";

export const dynamic = "force-dynamic";

const documentCreateSchema = z
  .object({
    vehicleId: z.string().min(1, "Vehicle ID is required"),
    type: z.enum([
      "INSURANCE",
      "PUC",
      "RC",
      "FITNESS",
      "ROAD_TAX",
      "PERMIT",
      "DRIVING_LICENCE",
      "CUSTOM",
    ]),
    customTypeName: z.string().optional().nullable(),
    documentNumber: z.string().optional().nullable(),
    issueDate: z.string().optional().nullable(),
    expiryDate: z.string().min(1, "Expiry date is required"),
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);

    const vehicleId = searchParams.get("vehicleId");
    const type = searchParams.get("type");
    const status = searchParams.get("status"); // 'expired' | 'expiring' | 'valid'
    const search = searchParams.get("search")?.toLowerCase().trim();

    // Query documents belonging to the user's vehicles
    const documents = await prisma.document.findMany({
      where: {
        vehicle: {
          userId,
          ...(vehicleId ? { id: vehicleId } : {}),
        },
        ...(type && type !== "ALL" ? { type } : {}),
      },
      include: {
        vehicle: {
          select: {
            id: true,
            nickname: true,
            registrationNumber: true,
            make: true,
            model: true,
          },
        },
      },
      orderBy: { expiryDate: "asc" },
    });

    let filtered = documents;

    // Filter by computed status if requested
    if (status && status !== "ALL") {
      filtered = filtered.filter((doc) => {
        const days = getDaysRemaining(doc.expiryDate);
        if (status === "expired") return days < 0;
        if (status === "expiring") return days >= 0 && days <= 30;
        if (status === "valid") return days > 30;
        return true;
      });
    }

    // Filter by search keyword (doc number, notes, custom name, vehicle name, reg number)
    if (search) {
      filtered = filtered.filter((doc) => {
        const matchDocNum = doc.documentNumber?.toLowerCase().includes(search);
        const matchCustom = doc.customTypeName?.toLowerCase().includes(search);
        const matchNotes = doc.notes?.toLowerCase().includes(search);
        const matchVehReg = doc.vehicle.registrationNumber.toLowerCase().includes(search);
        const matchVehNick = doc.vehicle.nickname.toLowerCase().includes(search);
        const matchType = doc.type.toLowerCase().includes(search);
        return matchDocNum || matchCustom || matchNotes || matchVehReg || matchVehNick || matchType;
      });
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const parsed = documentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid document details" },
        { status: 400 }
      );
    }

    const {
      vehicleId,
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
    } = parsed.data;

    // Verify vehicle belongs to user
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehicle not found or you do not have permission" },
        { status: 404 }
      );
    }

    const newDoc = await prisma.document.create({
      data: {
        vehicleId,
        type,
        customTypeName: type === "CUSTOM" ? customTypeName : null,
        documentNumber: documentNumber ? documentNumber.trim() : null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: new Date(expiryDate),
        notes: notes || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        metadata: metadata ? (typeof metadata === "string" ? metadata : JSON.stringify(metadata)) : null,
      },
      include: {
        vehicle: true,
      },
    });

    return NextResponse.json(newDoc, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
