import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with sample demo data...");

  // Clean existing data for clean seed run
  await prisma.reminderLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.documentHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.notificationSetting.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 1. Create Demo User
  const user = await prisma.user.create({
    data: {
      email: "demo@vehiclevault.com",
      name: "Alex Turner",
      password: hashedPassword,
      notificationSetting: {
        create: {
          reminderDays: "30,15,7,1,0",
          emailEnabled: true,
          inAppEnabled: true,
          pushEnabled: true,
        },
      },
    },
  });

  console.log(`Created demo user: ${user.email} (Password: Password123!)`);

  const now = new Date();

  // Helper to get date offset by days
  const offsetDays = (days: number): Date => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  // 2. Vehicle 1: Honda City Sedan
  const hondaCity = await prisma.vehicle.create({
    data: {
      userId: user.id,
      nickname: "Daily City Commuter",
      registrationNumber: "DL-01-AB-1234",
      type: "CAR",
      make: "Honda",
      model: "City ZX",
      year: 2022,
      fuelType: "PETROL",
      chassisNumber: "MAK34827104928172",
      engineNumber: "ENG92837190",
      ownerName: "Alex Turner",
      documents: {
        create: [
          {
            type: "INSURANCE",
            documentNumber: "POL-ICICI-883921",
            issueDate: offsetDays(-351),
            expiryDate: offsetDays(14), // Expiring in 14 days (yellow)
            premium: 18450,
            notes: "Zero depreciation comprehensive cover with engine protect add-on",
            metadata: JSON.stringify({
              provider: "ICICI Lombard",
              policyNumber: "POL-ICICI-883921",
              premium: 18450,
              coverageType: "Comprehensive",
            }),
            history: {
              create: [
                {
                  documentNumber: "POL-ICICI-772109",
                  issueDate: offsetDays(-716),
                  expiryDate: offsetDays(-351),
                  premium: 17200,
                  notes: "Previous year policy. Renewed on time.",
                  metadata: JSON.stringify({ provider: "ICICI Lombard", premium: 17200 }),
                },
              ],
            },
          },
          {
            type: "PUC",
            documentNumber: "PUC-DL-2026-9912",
            issueDate: offsetDays(-175),
            expiryDate: offsetDays(5), // Expiring in 5 days (yellow)
            notes: "Emission test passed at Shell Fuel Station",
            metadata: JSON.stringify({
              certNumber: "PUC-DL-2026-9912",
              emissionStatus: "PASS",
            }),
          },
          {
            type: "RC",
            documentNumber: "RC-DL-01-AB-1234",
            issueDate: offsetDays(-730),
            expiryDate: offsetDays(4000), // Valid for years (green)
            notes: "Original RC smart card with chip",
          },
        ],
      },
    },
  });

  // 3. Vehicle 2: Royal Enfield Motorcycle
  const royalEnfield = await prisma.vehicle.create({
    data: {
      userId: user.id,
      nickname: "Hunter 350",
      registrationNumber: "MH-02-CD-5678",
      type: "BIKE",
      make: "Royal Enfield",
      model: "Hunter 350 Rebel",
      year: 2023,
      fuelType: "PETROL",
      chassisNumber: "RE350HNT992817412",
      engineNumber: "JSERIES349912",
      ownerName: "Alex Turner",
      documents: {
        create: [
          {
            type: "PUC",
            documentNumber: "PUC-MH-2026-1029",
            issueDate: offsetDays(-192),
            expiryDate: offsetDays(-12), // Expired 12 days ago (red)
            notes: "Overdue! Need to visit PUC center near station immediately",
          },
          {
            type: "INSURANCE",
            documentNumber: "HDFC-ERGO-MOTO-4491",
            issueDate: offsetDays(-300),
            expiryDate: offsetDays(65), // Valid (green)
            premium: 3200,
            notes: "Third party + own damage cover",
            metadata: JSON.stringify({
              provider: "HDFC ERGO",
              policyNumber: "HDFC-ERGO-MOTO-4491",
              premium: 3200,
            }),
          },
          {
            type: "ROAD_TAX",
            documentNumber: "RT-MH-2023-88912",
            issueDate: offsetDays(-600),
            expiryDate: offsetDays(3650), // Valid
            notes: "One-time lifetime road tax paid",
          },
        ],
      },
    },
  });

  // 4. Vehicle 3: Tata Nexon EV
  const nexonEv = await prisma.vehicle.create({
    data: {
      userId: user.id,
      nickname: "Family EV",
      registrationNumber: "KA-03-EF-9012",
      type: "CAR",
      make: "Tata",
      model: "Nexon EV Empowered+",
      year: 2024,
      fuelType: "ELECTRIC",
      chassisNumber: "MATATANEXON998811",
      engineNumber: "EMOTOR778822",
      ownerName: "Alex Turner",
      documents: {
        create: [
          {
            type: "INSURANCE",
            documentNumber: "TATA-AIG-EV-10293",
            issueDate: offsetDays(-364),
            expiryDate: offsetDays(1), // Expiring tomorrow (red/amber urgent alert)
            premium: 24500,
            notes: "Zero dep, battery shield, return to invoice",
            metadata: JSON.stringify({
              provider: "Tata AIG",
              policyNumber: "TATA-AIG-EV-10293",
              premium: 24500,
            }),
          },
          {
            type: "FITNESS",
            documentNumber: "FIT-KA-2024-5544",
            issueDate: offsetDays(-100),
            expiryDate: offsetDays(265), // Valid
            notes: "Fitness and safety check passed at authorized service center",
          },
          {
            type: "CUSTOM",
            customTypeName: "Fastag & RFID Warranty",
            documentNumber: "FTAG-ICICI-9944",
            issueDate: offsetDays(-180),
            expiryDate: offsetDays(185), // Valid
            notes: "Active commercial fastag account with autotopup",
          },
        ],
      },
    },
  });

  // 5. Create initial In-App notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: "PUC Certificate Expired",
        message: "Pollution Certificate for Hunter 350 (MH-02-CD-5678) expired 12 days ago. Please renew promptly.",
        link: `/vehicles/${royalEnfield.id}`,
        isRead: false,
        createdAt: offsetDays(-2),
      },
      {
        userId: user.id,
        title: "Insurance Expiring Soon",
        message: "Insurance for Family EV (KA-03-EF-9012) expires tomorrow! Renew now to prevent policy lapse.",
        link: `/vehicles/${nexonEv.id}`,
        isRead: false,
        createdAt: offsetDays(0),
      },
    ],
  });

  console.log("Database seeded successfully with 3 vehicles, 9 documents, and historical records!");
}

main()
  .catch((e) => {
    console.error("Error during database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
