import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create demo firm
  const firm = await prisma.firm.upsert({
    where: { id: "demo-firm-001" },
    update: {},
    create: {
      id: "demo-firm-001",
      name: "Demo Legal LLP",
      sraNumber: "612847",
      email: "admin@demo-legal.co.uk",
      phone: "+44 20 7946 0958",
      address: "14 Gray's Inn Square, London WC1R 5JD",
      website: "https://www.demo-legal.co.uk",
    },
  });
  console.log(`Created firm: ${firm.name}`);

  // Create users
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo-legal.co.uk" },
    update: {},
    create: {
      firmId: firm.id,
      email: "admin@demo-legal.co.uk",
      passwordHash: adminHash,
      firstName: "Sarah",
      lastName: "Mitchell",
      role: "ADMIN",
    },
  });
  console.log(`Created admin: ${admin.email}`);

  const solicitorHash = await bcrypt.hash("Solicitor123!", 12);
  const solicitor = await prisma.user.upsert({
    where: { email: "solicitor@demo-legal.co.uk" },
    update: {},
    create: {
      firmId: firm.id,
      email: "solicitor@demo-legal.co.uk",
      passwordHash: solicitorHash,
      firstName: "James",
      lastName: "Hartley",
      role: "SOLICITOR",
    },
  });
  console.log(`Created solicitor: ${solicitor.email}`);

  const seniorHash = await bcrypt.hash("Senior123!", 12);
  const senior = await prisma.user.upsert({
    where: { email: "senior@demo-legal.co.uk" },
    update: {},
    create: {
      firmId: firm.id,
      email: "senior@demo-legal.co.uk",
      passwordHash: seniorHash,
      firstName: "Victoria",
      lastName: "Chen",
      role: "SENIOR_SOLICITOR",
    },
  });
  console.log(`Created senior solicitor: ${senior.email}`);

  const paralegalHash = await bcrypt.hash("Paralegal123!", 12);
  const paralegal = await prisma.user.upsert({
    where: { email: "paralegal@demo-legal.co.uk" },
    update: {},
    create: {
      firmId: firm.id,
      email: "paralegal@demo-legal.co.uk",
      passwordHash: paralegalHash,
      firstName: "Tom",
      lastName: "Barker",
      role: "PARALEGAL",
      supervisorId: solicitor.id,
    },
  });
  console.log(`Created paralegal: ${paralegal.email}`);

  // Create escalation policies
  const policies = [
    { tier: "T_14D" as const, offsetHours: 336, escalateTo: "ASSIGNED", channels: ["IN_APP" as const, "EMAIL" as const] },
    { tier: "T_7D" as const, offsetHours: 168, escalateTo: "SUPERVISOR", channels: ["IN_APP" as const, "EMAIL" as const] },
    { tier: "T_48H" as const, offsetHours: 48, escalateTo: "OWNER", channels: ["IN_APP" as const, "EMAIL" as const] },
    { tier: "T_24H" as const, offsetHours: 24, escalateTo: "PARTNER_COLP", channels: ["IN_APP" as const, "EMAIL" as const] },
  ];
  for (const policy of policies) {
    await prisma.escalationPolicy.upsert({
      where: { firmId_tier: { firmId: firm.id, tier: policy.tier } },
      update: {},
      create: { firmId: firm.id, ...policy },
    });
  }
  console.log("Created escalation policies");

  // ============================================================
  // SAMPLE MATTERS
  // ============================================================

  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  const matter1 = await prisma.matter.upsert({
    where: { firmId_reference: { firmId: firm.id, reference: "REY-2026-001" } },
    update: {},
    create: {
      firmId: firm.id,
      reference: "REY-2026-001",
      title: "Reynolds v Thames Construction Ltd",
      clientName: "Margaret Reynolds",
      clientReference: "MR/TC/2026",
      court: "Central London County Court",
      caseNumber: "CL-2026-000847",
      judge: "HHJ Williams",
      status: "ACTIVE",
      ownerId: solicitor.id,
      description: "Professional negligence claim arising from defective construction works at the claimant's residential property. Estimated value: £285,000.",
      createdAt: daysAgo(21),
    },
  });

  const matter2 = await prisma.matter.upsert({
    where: { firmId_reference: { firmId: firm.id, reference: "BAR-2026-002" } },
    update: {},
    create: {
      firmId: firm.id,
      reference: "BAR-2026-002",
      title: "Barclays Bank plc v Morrison",
      clientName: "David Morrison",
      clientReference: "DM/BB/2026",
      court: "Birmingham Civil Justice Centre",
      caseNumber: "BM-2026-001294",
      judge: "DJ Palmer",
      status: "ACTIVE",
      ownerId: admin.id,
      description: "Defence of possession proceedings. Client disputes arrears calculations and seeks to set aside default judgment.",
      createdAt: daysAgo(14),
    },
  });

  const matter3 = await prisma.matter.upsert({
    where: { firmId_reference: { firmId: firm.id, reference: "HAR-2026-003" } },
    update: {},
    create: {
      firmId: firm.id,
      reference: "HAR-2026-003",
      title: "Harrison & Co v Royal Mail Group",
      clientName: "Harrison & Co Ltd",
      clientReference: "HC/RM/2025",
      court: "Leeds County Court",
      caseNumber: "LS-2025-003821",
      judge: "HHJ Blackwood",
      status: "CLOSED",
      ownerId: senior.id,
      description: "Commercial contract dispute regarding delayed deliveries causing business losses. Settled at mediation for £42,500.",
      createdAt: daysAgo(90),
    },
  });

  const matter4 = await prisma.matter.upsert({
    where: { firmId_reference: { firmId: firm.id, reference: "PAT-2026-004" } },
    update: {},
    create: {
      firmId: firm.id,
      reference: "PAT-2026-004",
      title: "Patel v NHS Foundation Trust",
      clientName: "Arun Patel",
      clientReference: "AP/NHS/2026",
      court: "Royal Courts of Justice",
      caseNumber: "QB-2026-000193",
      judge: "Master Davidson",
      status: "ACTIVE",
      ownerId: solicitor.id,
      description: "Clinical negligence claim. Liability admitted; quantum in dispute. Claimant suffered nerve damage during routine surgery.",
      createdAt: daysAgo(7),
    },
  });

  console.log("Created 4 sample matters");

  // Matter assignments
  await prisma.matterAssignment.upsert({
    where: { matterId_userId: { matterId: matter1.id, userId: paralegal.id } },
    update: {},
    create: { matterId: matter1.id, userId: paralegal.id, role: "ASSIGNED" },
  });
  await prisma.matterAssignment.upsert({
    where: { matterId_userId: { matterId: matter1.id, userId: senior.id } },
    update: {},
    create: { matterId: matter1.id, userId: senior.id, role: "SUPERVISOR" },
  });
  await prisma.matterAssignment.upsert({
    where: { matterId_userId: { matterId: matter4.id, userId: paralegal.id } },
    update: {},
    create: { matterId: matter4.id, userId: paralegal.id, role: "ASSIGNED" },
  });
  console.log("Created matter assignments");

  // ============================================================
  // SAMPLE DOCUMENTS (metadata only, no actual S3 files)
  // ============================================================

  const doc1 = await prisma.document.create({
    data: {
      matterId: matter1.id,
      uploadedBy: solicitor.id,
      fileName: "Court_Order_15Jan2026.pdf",
      fileSize: 245760,
      mimeType: "application/pdf",
      storageKey: `${firm.id}/${matter1.id}/court-orders/court-order-15jan.pdf`,
      bucket: "court-orders",
      category: "COURT_ORDER",
      description: "Case Management Order dated 15 January 2026",
      pageCount: 4,
      createdAt: daysAgo(18),
    },
  });

  const doc2 = await prisma.document.create({
    data: {
      matterId: matter1.id,
      uploadedBy: solicitor.id,
      fileName: "Witness_Statement_Reynolds.pdf",
      fileSize: 892416,
      mimeType: "application/pdf",
      storageKey: `${firm.id}/${matter1.id}/witness-statement-reynolds.pdf`,
      bucket: "documents",
      category: "WITNESS_STATEMENT",
      description: "Witness statement of Margaret Reynolds dated 20 January 2026",
      pageCount: 12,
      createdAt: daysAgo(15),
    },
  });

  const doc3 = await prisma.document.create({
    data: {
      matterId: matter1.id,
      uploadedBy: paralegal.id,
      fileName: "Expert_Report_Surveyor.pdf",
      fileSize: 1536000,
      mimeType: "application/pdf",
      storageKey: `${firm.id}/${matter1.id}/expert-report-surveyor.pdf`,
      bucket: "documents",
      category: "EXPERT_REPORT",
      description: "Expert surveyor report by James Walker FRICS",
      pageCount: 28,
      createdAt: daysAgo(10),
    },
  });

  const doc4 = await prisma.document.create({
    data: {
      matterId: matter1.id,
      uploadedBy: solicitor.id,
      fileName: "Particulars_of_Claim.pdf",
      fileSize: 456700,
      mimeType: "application/pdf",
      storageKey: `${firm.id}/${matter1.id}/particulars-of-claim.pdf`,
      bucket: "documents",
      category: "PLEADING",
      description: "Amended Particulars of Claim",
      pageCount: 8,
      createdAt: daysAgo(20),
    },
  });

  await prisma.document.create({
    data: {
      matterId: matter2.id,
      uploadedBy: admin.id,
      fileName: "Defence_Application.pdf",
      fileSize: 312000,
      mimeType: "application/pdf",
      storageKey: `${firm.id}/${matter2.id}/defence-application.pdf`,
      bucket: "documents",
      category: "APPLICATION",
      description: "Application to set aside default judgment",
      pageCount: 6,
      createdAt: daysAgo(12),
    },
  });

  console.log("Created 5 sample documents");

  // ============================================================
  // SAMPLE DIRECTIONS
  // ============================================================

  const dir1 = await prisma.direction.create({
    data: {
      matterId: matter1.id,
      sourceDocumentId: doc1.id,
      orderNumber: 1,
      title: "Claimant to file and serve witness statements",
      description: "The Claimant shall file and serve all witness statements of fact upon which she intends to rely by 4pm on the date specified.",
      dueDate: daysFromNow(12),
      status: "CONFIRMED",
      confidenceScore: 0.94,
      confirmedById: solicitor.id,
      confirmedAt: daysAgo(16),
      createdAt: daysAgo(18),
    },
  });

  const dir2 = await prisma.direction.create({
    data: {
      matterId: matter1.id,
      sourceDocumentId: doc1.id,
      orderNumber: 2,
      title: "Defendant to file and serve witness statements",
      description: "The Defendant shall file and serve all witness statements of fact upon which it intends to rely within 28 days of service of the Claimant's witness evidence.",
      dueDate: daysFromNow(40),
      status: "CONFIRMED",
      confidenceScore: 0.91,
      confirmedById: solicitor.id,
      confirmedAt: daysAgo(16),
      createdAt: daysAgo(18),
    },
  });

  await prisma.direction.create({
    data: {
      matterId: matter1.id,
      sourceDocumentId: doc1.id,
      orderNumber: 3,
      title: "Expert evidence by single joint expert",
      description: "Permission is granted for the parties to rely upon the written evidence of a single joint surveying expert. The parties shall agree the identity of the expert within 14 days.",
      dueDate: daysFromNow(5),
      status: "CONFIRMED",
      confidenceScore: 0.96,
      confirmedById: solicitor.id,
      confirmedAt: daysAgo(16),
      createdAt: daysAgo(18),
    },
  });

  await prisma.direction.create({
    data: {
      matterId: matter1.id,
      sourceDocumentId: doc1.id,
      orderNumber: 4,
      title: "Parties to file costs budgets",
      description: "Each party shall file and exchange costs budgets in Precedent H format not less than 21 days before the CCMC.",
      dueDate: daysFromNow(25),
      status: "PENDING_REVIEW",
      confidenceScore: 0.73,
      createdAt: daysAgo(18),
    },
  });

  await prisma.direction.create({
    data: {
      matterId: matter1.id,
      sourceDocumentId: doc1.id,
      orderNumber: 5,
      title: "Disclosure of documents",
      description: "Standard disclosure shall take place by way of list. Each party shall serve their list of documents within 42 days of the date of this order.",
      dueDate: daysFromNow(18),
      status: "PENDING_REVIEW",
      confidenceScore: 0.88,
      createdAt: daysAgo(18),
    },
  });

  await prisma.direction.create({
    data: {
      matterId: matter1.id,
      sourceDocumentId: doc1.id,
      orderNumber: 6,
      title: "Case management conference",
      description: "There shall be a costs and case management conference listed with a time estimate of 2 hours.",
      dueDate: daysFromNow(50),
      status: "PENDING_REVIEW",
      confidenceScore: 0.65,
      createdAt: daysAgo(18),
    },
  });

  // Matter 4 directions
  await prisma.direction.create({
    data: {
      matterId: matter4.id,
      orderNumber: 1,
      title: "Claimant to serve updated schedule of loss",
      description: "The Claimant shall file and serve an updated schedule of loss with supporting medical evidence within 56 days.",
      dueDate: daysFromNow(49),
      status: "PENDING_REVIEW",
      confidenceScore: 0.82,
      createdAt: daysAgo(5),
    },
  });

  await prisma.direction.create({
    data: {
      matterId: matter4.id,
      orderNumber: 2,
      title: "Joint medical expert appointment",
      description: "The parties shall jointly instruct a consultant neurologist. The Defendant's solicitors shall have conduct of the instruction.",
      dueDate: daysFromNow(21),
      status: "PENDING_REVIEW",
      confidenceScore: 0.89,
      createdAt: daysAgo(5),
    },
  });

  console.log("Created 8 sample directions");

  // ============================================================
  // SAMPLE CALENDAR EVENTS
  // ============================================================

  // Overdue event
  await prisma.calendarEvent.create({
    data: {
      matterId: matter2.id,
      title: "File defence application",
      description: "Defence application to set aside default judgment - filing deadline",
      startDate: daysAgo(2),
      isAllDay: true,
      isDeadline: true,
    },
  });

  // Due very soon
  await prisma.calendarEvent.create({
    data: {
      matterId: matter1.id,
      directionId: dir1.id,
      title: "Serve witness statements (Claimant)",
      description: "Deadline for filing and serving claimant witness statements",
      startDate: daysFromNow(12),
      isAllDay: true,
      isDeadline: true,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      matterId: matter1.id,
      title: "Agree single joint expert",
      description: "Deadline to agree identity of single joint surveying expert",
      startDate: daysFromNow(5),
      isAllDay: true,
      isDeadline: true,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      matterId: matter1.id,
      directionId: dir2.id,
      title: "Serve witness statements (Defendant)",
      description: "Deadline for defendant witness statement service",
      startDate: daysFromNow(40),
      isAllDay: true,
      isDeadline: true,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      matterId: matter4.id,
      title: "Updated schedule of loss",
      description: "Deadline for Patel updated schedule of loss with medical evidence",
      startDate: daysFromNow(49),
      isAllDay: true,
      isDeadline: true,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      matterId: matter4.id,
      title: "Instruct neurologist",
      description: "Deadline to jointly instruct consultant neurologist",
      startDate: daysFromNow(21),
      isAllDay: true,
      isDeadline: true,
    },
  });

  console.log("Created 6 calendar events");

  // ============================================================
  // SAMPLE NOTIFICATIONS
  // ============================================================

  await prisma.notification.create({
    data: {
      userId: solicitor.id,
      type: "DEADLINE_REMINDER",
      channel: "IN_APP",
      title: "Deadline approaching: Agree single joint expert",
      message: "The deadline to agree the identity of the single joint expert in Reynolds v Thames Construction Ltd is in 5 days.",
      sentAt: daysAgo(0),
    },
  });

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: "ESCALATION",
      channel: "IN_APP",
      title: "Overdue: File defence application",
      message: "The deadline for filing the defence application in Barclays Bank plc v Morrison has passed. Immediate action required.",
      sentAt: daysAgo(1),
    },
  });

  await prisma.notification.create({
    data: {
      userId: solicitor.id,
      type: "DIRECTION_PARSED",
      channel: "IN_APP",
      title: "Court order parsed: Reynolds v Thames Construction",
      message: "6 directions were extracted from the court order dated 15 January 2026. 3 require review before confirmation.",
      sentAt: daysAgo(18),
      readAt: daysAgo(17),
    },
  });

  await prisma.notification.create({
    data: {
      userId: paralegal.id,
      type: "ASSIGNMENT",
      channel: "IN_APP",
      title: "New matter assignment: Patel v NHS Foundation Trust",
      message: "You have been assigned to Patel v NHS Foundation Trust (PAT-2026-004) by James Hartley.",
      sentAt: daysAgo(7),
    },
  });

  console.log("Created 4 notifications");

  // ============================================================
  // SAMPLE BUNDLE
  // ============================================================

  const bundle = await prisma.bundle.create({
    data: {
      matterId: matter1.id,
      createdById: solicitor.id,
      title: "Trial Bundle - Reynolds v Thames Construction",
      description: "Main trial bundle containing all pleadings, witness evidence, and expert reports",
      status: "READY",
      totalPages: 52,
      generatedAt: daysAgo(3),
      createdAt: daysAgo(5),
    },
  });

  await prisma.bundleDocument.createMany({
    data: [
      { bundleId: bundle.id, documentId: doc4.id, section: "Section A - Pleadings", position: 1, startPage: 1, endPage: 8 },
      { bundleId: bundle.id, documentId: doc2.id, section: "Section B - Witness Evidence", position: 2, startPage: 9, endPage: 20 },
      { bundleId: bundle.id, documentId: doc3.id, section: "Section C - Expert Evidence", position: 3, startPage: 21, endPage: 48 },
      { bundleId: bundle.id, documentId: doc1.id, section: "Section D - Court Orders", position: 4, startPage: 49, endPage: 52 },
    ],
  });

  console.log("Created 1 trial bundle with 4 sections");

  // ============================================================
  // SAMPLE AUDIT LOG ENTRIES
  // ============================================================

  const auditEntries = [
    { userId: admin.id, action: "LOGIN" as const, entityType: "User", entityId: admin.id, createdAt: daysAgo(0) },
    { userId: solicitor.id, action: "CREATE" as const, entityType: "Matter", entityId: matter4.id, createdAt: daysAgo(7) },
    { userId: solicitor.id, action: "PARSE" as const, entityType: "Direction", entityId: dir1.id, createdAt: daysAgo(18) },
    { userId: solicitor.id, action: "CONFIRM" as const, entityType: "Direction", entityId: dir1.id, createdAt: daysAgo(16) },
    { userId: solicitor.id, action: "UPLOAD" as const, entityType: "Document", entityId: doc2.id, createdAt: daysAgo(15) },
    { userId: paralegal.id, action: "UPLOAD" as const, entityType: "Document", entityId: doc3.id, createdAt: daysAgo(10) },
    { userId: solicitor.id, action: "GENERATE" as const, entityType: "Bundle", entityId: bundle.id, createdAt: daysAgo(3) },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: { firmId: firm.id, ...entry },
    });
  }

  console.log("Created 7 audit log entries");

  console.log("\n========================================");
  console.log("Seed completed successfully!");
  console.log("========================================");
  console.log("\nDemo credentials:");
  console.log("  Admin:            admin@demo-legal.co.uk / Admin123!");
  console.log("  Senior Solicitor: senior@demo-legal.co.uk / Senior123!");
  console.log("  Solicitor:        solicitor@demo-legal.co.uk / Solicitor123!");
  console.log("  Paralegal:        paralegal@demo-legal.co.uk / Paralegal123!");
  console.log("\nSample data:");
  console.log("  4 matters, 8 directions, 5 documents, 1 bundle");
  console.log("  6 calendar events, 4 notifications, 7 audit entries");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
