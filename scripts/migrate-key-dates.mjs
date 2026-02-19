import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_Kh3RBgL6ZtJa@ep-shy-bonus-abt8o0ui-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('Running Key Dates migration...');

  // 1. Create KeyDateStatus enum
  console.log('Creating KeyDateStatus enum...');
  await sql`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'KeyDateStatus') THEN
      CREATE TYPE "KeyDateStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'OVERDUE', 'BREACH');
    END IF;
  END $$`;

  // 2. Add new columns to matters table
  console.log('Adding matter role columns...');
  await sql`ALTER TABLE "matters" ADD COLUMN IF NOT EXISTS "matter_manager_id" TEXT`;
  await sql`ALTER TABLE "matters" ADD COLUMN IF NOT EXISTS "matter_partner_id" TEXT`;
  await sql`ALTER TABLE "matters" ADD COLUMN IF NOT EXISTS "client_partner_id" TEXT`;

  // 3. Add foreign keys for new matter columns
  console.log('Adding foreign key constraints...');
  try {
    await sql`ALTER TABLE "matters" ADD CONSTRAINT "matters_matter_manager_id_fkey" FOREIGN KEY ("matter_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
  } catch (e) {
    if (!e.message.includes('already exists')) throw e;
    console.log('  matter_manager FK already exists');
  }
  try {
    await sql`ALTER TABLE "matters" ADD CONSTRAINT "matters_matter_partner_id_fkey" FOREIGN KEY ("matter_partner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
  } catch (e) {
    if (!e.message.includes('already exists')) throw e;
    console.log('  matter_partner FK already exists');
  }
  try {
    await sql`ALTER TABLE "matters" ADD CONSTRAINT "matters_client_partner_id_fkey" FOREIGN KEY ("client_partner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`;
  } catch (e) {
    if (!e.message.includes('already exists')) throw e;
    console.log('  client_partner FK already exists');
  }

  // 4. Create key_dates table
  console.log('Creating key_dates table...');
  await sql`CREATE TABLE IF NOT EXISTS "key_dates" (
    "id" TEXT NOT NULL,
    "matter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" "KeyDateStatus" NOT NULL DEFAULT 'ON_TRACK',
    "key_date_owner_id" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "completed_at" TIMESTAMP(3),
    "breached_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "key_dates_pkey" PRIMARY KEY ("id")
  )`;

  // 5. Add foreign keys for key_dates
  console.log('Adding key_dates foreign keys...');
  try {
    await sql`ALTER TABLE "key_dates" ADD CONSTRAINT "key_dates_matter_id_fkey" FOREIGN KEY ("matter_id") REFERENCES "matters"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
  } catch (e) {
    if (!e.message.includes('already exists')) throw e;
    console.log('  key_dates matter FK already exists');
  }
  try {
    await sql`ALTER TABLE "key_dates" ADD CONSTRAINT "key_dates_key_date_owner_id_fkey" FOREIGN KEY ("key_date_owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE`;
  } catch (e) {
    if (!e.message.includes('already exists')) throw e;
    console.log('  key_dates owner FK already exists');
  }

  // 6. Create indexes
  console.log('Creating indexes...');
  await sql`CREATE INDEX IF NOT EXISTS "key_dates_matter_id_idx" ON "key_dates"("matter_id")`;
  await sql`CREATE INDEX IF NOT EXISTS "key_dates_status_idx" ON "key_dates"("status")`;
  await sql`CREATE INDEX IF NOT EXISTS "key_dates_due_date_idx" ON "key_dates"("due_date")`;
  await sql`CREATE INDEX IF NOT EXISTS "key_dates_key_date_owner_id_idx" ON "key_dates"("key_date_owner_id")`;

  // 7. Record migration in _prisma_migrations
  console.log('Recording migration...');
  const migrationId = 'key_dates_' + Date.now();
  await sql`INSERT INTO "_prisma_migrations" ("id", "checksum", "migration_name", "logs", "started_at", "finished_at", "applied_steps_count")
    VALUES (${migrationId}, 'manual_key_dates', '20260218_add_key_dates', NULL, NOW(), NOW(), 1)`;

  console.log('Migration complete!');

  // Verify
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'key_dates'`;
  console.log('key_dates table exists:', tables.length > 0);

  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'matters' AND column_name IN ('matter_manager_id', 'matter_partner_id', 'client_partner_id')`;
  console.log('New matter columns:', cols.map(c => c.column_name));
}

migrate().catch(console.error);
