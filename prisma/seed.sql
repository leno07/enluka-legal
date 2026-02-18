-- Enluka Legal Demo Seed Data (Fresh)
-- Run this in Neon SQL Editor to populate the demo database.
-- Safe to re-run: deletes existing demo data first.

-- ============================================================
-- CLEAN EXISTING DEMO DATA (reverse FK order)
-- ============================================================
DELETE FROM "bundle_documents" WHERE bundle_id LIKE 'bundle_%';
DELETE FROM "share_links"     WHERE bundle_id LIKE 'bundle_%';
DELETE FROM "bundles"         WHERE id LIKE 'bundle_%';
DELETE FROM "acknowledgements" WHERE notification_id LIKE 'notif_%';
DELETE FROM "notifications"   WHERE id LIKE 'notif_%';
DELETE FROM "escalation_events" WHERE calendar_event_id LIKE 'event_%';
DELETE FROM "calendar_events" WHERE id LIKE 'event_%';
DELETE FROM "directions"      WHERE id LIKE 'dir_%';
DELETE FROM "documents"       WHERE id LIKE 'doc_%';
DELETE FROM "matter_assignments" WHERE id LIKE 'assign_%';
DELETE FROM "matters"         WHERE id LIKE 'matter_%';
DELETE FROM "escalation_policies" WHERE id LIKE 'esc_%';
DELETE FROM "audit_logs"      WHERE id LIKE 'audit_%';
DELETE FROM "refresh_tokens"  WHERE user_id LIKE 'user_%';
DELETE FROM "users"           WHERE id LIKE 'user_%';
DELETE FROM "firms"           WHERE id = 'firm_demo_001';

-- ============================================================
-- FIRM
-- ============================================================
INSERT INTO "firms" ("id", "name", "sra_number", "address", "phone", "email", "website", "is_active", "created_at", "updated_at")
VALUES ('firm_demo_001', 'Demo Legal LLP', '612345', '1 Temple Row, London EC4Y 0AA', '+44 20 7946 0958', 'info@demo-legal.co.uk', 'https://demo-legal.co.uk', true, NOW(), NOW());

-- ============================================================
-- USERS (passwords: Admin123!, Solicitor123!, Senior123!, Paralegal123!)
-- ============================================================
INSERT INTO "users" ("id", "firm_id", "email", "password_hash", "first_name", "last_name", "role", "is_active", "created_at", "updated_at") VALUES
('user_admin_001',  'firm_demo_001', 'admin@demo-legal.co.uk',     '$2b$10$mr7HfuIES4Q9UhCWcpd.ducK2EojTN1R2.RAhJ73i6GoS5Z2if9VO', 'Sarah',    'Mitchell', 'ADMIN',            true, NOW(), NOW()),
('user_sol_001',    'firm_demo_001', 'solicitor@demo-legal.co.uk', '$2b$10$KRSIFsZbjN1PZdpKov7tQOBL3SGAnpcSproAGw1yHBRIsDXo3qejS', 'James',    'Hartley',  'SOLICITOR',        true, NOW(), NOW()),
('user_senior_001', 'firm_demo_001', 'senior@demo-legal.co.uk',   '$2b$10$wKfr3BxF5Klj8dUmXwesxO8M.EDQ3NcUFJBlYN04okPMjdz3nUbh.', 'Victoria', 'Chen',     'SENIOR_SOLICITOR', true, NOW(), NOW()),
('user_para_001',   'firm_demo_001', 'paralegal@demo-legal.co.uk','$2b$10$gSB4LqXF3ps.OzOdCOtiDunak8jyzi9KgDcdYIHlGWV5H5EpwN9nm', 'Tom',      'Barker',   'PARALEGAL',        true, NOW(), NOW());

-- ============================================================
-- MATTERS (5 ACTIVE + 1 CLOSED = impressive dashboard count)
-- ============================================================
INSERT INTO "matters" ("id", "firm_id", "reference", "title", "client_name", "client_reference", "court", "case_number", "judge", "status", "owner_id", "description", "created_at", "updated_at") VALUES
('matter_001', 'firm_demo_001', 'DL-2026-0001', 'Reynolds v Thames Construction Ltd',
  'Michael Reynolds', 'MR/2026/001', 'Central London County Court', 'CL-2026-000482', 'HHJ Williams', 'ACTIVE',
  'user_sol_001', 'Construction dispute - defective works claim. Client alleges significant structural defects in residential extension completed October 2025.',
  NOW() - INTERVAL '21 days', NOW() - INTERVAL '1 day'),

('matter_002', 'firm_demo_001', 'DL-2026-0002', 'Barclays Bank UK PLC v Morrison',
  'David Morrison', 'DM/2026/002', 'Business and Property Courts', 'BP-2026-001247', 'Master Clark', 'ACTIVE',
  'user_senior_001', 'Defended possession proceedings. Client facing repossession of commercial premises. Counterclaim for mis-sold interest rate swap.',
  NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days'),

('matter_003', 'firm_demo_001', 'DL-2025-0047', 'Harrison v Royal Mail Group Ltd',
  'Patricia Harrison', 'PH/2025/047', 'Employment Tribunal (London Central)', 'ET-2025-3847', 'EJ Thompson', 'CLOSED',
  'user_sol_001', 'Unfair dismissal and disability discrimination claim. Settled via ACAS conciliation December 2025.',
  NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days'),

('matter_004', 'firm_demo_001', 'DL-2026-0003', 'Patel v NHS Foundation Trust',
  'Dr Anish Patel', 'AP/2026/003', 'High Court (King''s Bench Division)', 'QB-2026-000891', 'Mrs Justice Andrews DBE', 'ACTIVE',
  'user_senior_001', 'Clinical negligence claim. Alleged failure to diagnose and treat spinal condition leading to permanent nerve damage.',
  NOW() - INTERVAL '14 days', NOW()),

('matter_005', 'firm_demo_001', 'DL-2026-0004', 'Sterling Logistics Ltd v Apex Transport',
  'Sterling Logistics Ltd', 'SL/2026/004', 'Technology and Construction Court', 'TCC-2026-000314', 'HHJ Waksman', 'ACTIVE',
  'user_sol_001', 'Commercial dispute over haulage contract. Sterling claims Apex failed to deliver goods resulting in loss of client contracts worth £1.2m.',
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

('matter_006', 'firm_demo_001', 'DL-2026-0005', 'Greenwood Estate v London Borough of Camden',
  'Greenwood Estate Management Co.', 'GE/2026/005', 'Upper Tribunal (Lands Chamber)', 'LT-2026-00218', 'Judge Cooke', 'ACTIVE',
  'user_senior_001', 'Service charge dispute. Leaseholders challenge reasonableness of major works programme totalling £2.4m across 120 units.',
  NOW() - INTERVAL '7 days', NOW());

-- ============================================================
-- MATTER ASSIGNMENTS
-- ============================================================
INSERT INTO "matter_assignments" ("id", "matter_id", "user_id", "role", "assigned_at") VALUES
('assign_001', 'matter_001', 'user_sol_001',    'LEAD',     NOW() - INTERVAL '21 days'),
('assign_002', 'matter_001', 'user_para_001',   'ASSIGNED', NOW() - INTERVAL '21 days'),
('assign_003', 'matter_002', 'user_senior_001', 'LEAD',     NOW() - INTERVAL '18 days'),
('assign_004', 'matter_002', 'user_sol_001',    'ASSIGNED', NOW() - INTERVAL '18 days'),
('assign_005', 'matter_003', 'user_sol_001',    'LEAD',     NOW() - INTERVAL '90 days'),
('assign_006', 'matter_004', 'user_senior_001', 'LEAD',     NOW() - INTERVAL '14 days'),
('assign_007', 'matter_004', 'user_admin_001',  'ASSIGNED', NOW() - INTERVAL '14 days'),
('assign_008', 'matter_005', 'user_sol_001',    'LEAD',     NOW() - INTERVAL '10 days'),
('assign_009', 'matter_005', 'user_para_001',   'ASSIGNED', NOW() - INTERVAL '10 days'),
('assign_010', 'matter_006', 'user_senior_001', 'LEAD',     NOW() - INTERVAL '7 days'),
('assign_011', 'matter_006', 'user_admin_001',  'ASSIGNED', NOW() - INTERVAL '7 days');

-- ============================================================
-- DIRECTIONS
-- Mix of statuses. 5 CONFIRMED within last 7 days → "Completed This Week" = 5
-- ============================================================
INSERT INTO "directions" ("id", "matter_id", "order_number", "title", "description", "due_date", "status", "confidence_score", "confirmed_by_id", "confirmed_at", "created_at", "updated_at") VALUES

-- Matter 001: Reynolds v Thames Construction
('dir_001', 'matter_001', 1, 'Claimant to serve witness statements',
  'The Claimant shall serve all witness statements of fact upon which they intend to rely by 4pm on the specified date.',
  NOW() + INTERVAL '10 days', 'CONFIRMED', 0.94, 'user_sol_001', NOW() - INTERVAL '2 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '2 days'),

('dir_002', 'matter_001', 2, 'Defendant to serve witness statements',
  'The Defendant shall serve all witness statements of fact in response by 4pm on the specified date.',
  NOW() + INTERVAL '28 days', 'CONFIRMED', 0.91, 'user_sol_001', NOW() - INTERVAL '3 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '3 days'),

('dir_003', 'matter_001', 3, 'Joint expert report on structural defects',
  'The parties shall jointly instruct a single expert in structural engineering. The expert shall prepare a report and file it with the court.',
  NOW() + INTERVAL '42 days', 'PENDING_REVIEW', 0.78, NULL, NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

('dir_004', 'matter_001', 4, 'Pre-trial review hearing',
  'Pre-trial review to be listed with a time estimate of 1 hour. Both parties to file skeleton arguments 3 days prior.',
  NOW() + INTERVAL '56 days', 'PENDING_REVIEW', 0.65, NULL, NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

-- Matter 002: Barclays v Morrison
('dir_005', 'matter_002', 1, 'Defendant to file and serve Defence',
  'The Defendant shall file and serve a full Defence and Counterclaim within 28 days of service of the Particulars of Claim.',
  NOW() + INTERVAL '5 days', 'CONFIRMED', 0.96, 'user_senior_001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

('dir_006', 'matter_002', 2, 'Disclosure of documents',
  'Standard disclosure by list. Each party to serve a disclosure list verified by a statement of truth.',
  NOW() + INTERVAL '35 days', 'CONFIRMED', 0.88, 'user_senior_001', NOW() - INTERVAL '4 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '4 days'),

('dir_007', 'matter_002', 3, 'Expert valuation report',
  'A single joint expert shall be instructed to provide a valuation of the interest rate swap derivatives.',
  NOW() + INTERVAL '49 days', 'PENDING_REVIEW', 0.83, NULL, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- Matter 004: Patel v NHS
('dir_008', 'matter_004', 1, 'Claimant to serve medical evidence',
  'The Claimant shall serve all medical evidence including GP records, hospital notes, and expert medical reports.',
  NOW() + INTERVAL '18 days', 'CONFIRMED', 0.82, 'user_senior_001', NOW() - INTERVAL '5 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '5 days'),

('dir_009', 'matter_004', 2, 'Case management conference',
  'The matter shall be listed for a Case Management Conference with a time estimate of 2 hours.',
  NOW() + INTERVAL '35 days', 'PENDING_REVIEW', 0.71, NULL, NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

('dir_010', 'matter_004', 3, 'NHS Trust to disclose medical records',
  'The Defendant Trust shall provide full disclosure of all medical records, internal investigation reports, and complaint correspondence.',
  NOW() + INTERVAL '21 days', 'PENDING_REVIEW', 0.87, NULL, NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

-- Matter 005: Sterling v Apex
('dir_011', 'matter_005', 1, 'Particulars of Claim to be served',
  'The Claimant shall serve Particulars of Claim with supporting schedule of loss.',
  NOW() - INTERVAL '2 days', 'CONFIRMED', 0.92, 'user_sol_001', NOW() - INTERVAL '6 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '6 days'),

('dir_012', 'matter_005', 2, 'Defendant to file Acknowledgment of Service',
  'The Defendant shall file an Acknowledgment of Service within 14 days.',
  NOW() + INTERVAL '12 days', 'PENDING_REVIEW', 0.89, NULL, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- Matter 006: Greenwood v Camden
('dir_013', 'matter_006', 1, 'Service charge accounts to be disclosed',
  'The Respondent shall disclose all service charge accounts, invoices, and contractor correspondence for the past 3 years.',
  NOW() + INTERVAL '14 days', 'PENDING_REVIEW', 0.85, NULL, NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('dir_014', 'matter_006', 2, 'Leaseholder witness statements',
  'The Applicant leaseholders shall serve statements from no more than 5 representative leaseholders.',
  NOW() + INTERVAL '28 days', 'PENDING_REVIEW', 0.76, NULL, NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- ============================================================
-- DOCUMENTS
-- ============================================================
INSERT INTO "documents" ("id", "matter_id", "uploaded_by", "file_name", "file_size", "mime_type", "storage_key", "bucket", "category", "description", "page_count", "created_at", "updated_at") VALUES
('doc_001', 'matter_001', 'user_sol_001',    'Court_Order_Reynolds_v_Thames_20260115.pdf',         245000,  'application/pdf', 'matter_001/court-orders/order_20260115.pdf',     'court-orders', 'COURT_ORDER',        'Initial case management order from HHJ Williams',                     4,  NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('doc_002', 'matter_001', 'user_para_001',   'Witness_Statement_Reynolds_M.pdf',                   182000,  'application/pdf', 'matter_001/documents/ws_reynolds.pdf',            'documents',    'WITNESS_STATEMENT',  'Claimant witness statement - Michael Reynolds',                       12, NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days'),
('doc_003', 'matter_001', 'user_sol_001',    'Expert_Report_Structural_Survey.pdf',                1520000, 'application/pdf', 'matter_001/documents/expert_structural.pdf',      'documents',    'EXPERT_REPORT',      'Preliminary structural survey report by Dr James Engineering',        28, NOW() - INTERVAL '3 days',  NOW() - INTERVAL '3 days'),
('doc_004', 'matter_002', 'user_senior_001', 'Particulars_of_Claim_Barclays_v_Morrison.pdf',       310000,  'application/pdf', 'matter_002/documents/poc_barclays.pdf',           'documents',    'PLEADING',           'Particulars of Claim served by Claimant',                             8,  NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
('doc_005', 'matter_004', 'user_senior_001', 'Application_Notice_Patel.pdf',                       95000,   'application/pdf', 'matter_004/documents/app_notice_patel.pdf',       'documents',    'APPLICATION',        'Application for interim payment pending trial',                       3,  NOW() - INTERVAL '8 days',  NOW() - INTERVAL '8 days'),
('doc_006', 'matter_005', 'user_sol_001',    'Haulage_Contract_Sterling_Apex.pdf',                  420000,  'application/pdf', 'matter_005/documents/contract.pdf',               'documents',    'EVIDENCE',           'Original haulage contract between Sterling and Apex dated March 2025',15, NOW() - INTERVAL '9 days',  NOW() - INTERVAL '9 days'),
('doc_007', 'matter_005', 'user_sol_001',    'Schedule_of_Loss_Sterling.pdf',                       87000,   'application/pdf', 'matter_005/documents/schedule_loss.pdf',           'documents',    'PLEADING',           'Detailed schedule of losses with supporting invoices',                6,  NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),
('doc_008', 'matter_006', 'user_senior_001', 'Service_Charge_Demands_2023_2025.pdf',                560000,  'application/pdf', 'matter_006/documents/sc_demands.pdf',             'documents',    'EVIDENCE',           'Service charge demand letters for 2023-2025 period',                  22, NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days'),
('doc_009', 'matter_004', 'user_senior_001', 'Court_Order_Patel_CMC_20260205.pdf',                  178000,  'application/pdf', 'matter_004/court-orders/order_cmc.pdf',           'court-orders', 'COURT_ORDER',        'Case management conference order from Mrs Justice Andrews',           3,  NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- ============================================================
-- CALENDAR EVENTS
-- 3 OVERDUE (past, no completedAt) → overdueCount = 3
-- 8 UPCOMING within 30 days → upcomingDeadlines = 8
-- 2 COMPLETED (have completedAt, won't count as overdue)
-- ============================================================
INSERT INTO "calendar_events" ("id", "matter_id", "direction_id", "title", "description", "start_date", "is_all_day", "is_deadline", "reminders_sent", "completed_at", "created_at", "updated_at") VALUES

-- OVERDUE: 3 events with past dates, no completedAt
('event_001', 'matter_001', NULL,      'Expert instruction letter overdue',
  'Send instruction letter to jointly appointed structural expert - 7 days overdue',
  NOW() - INTERVAL '7 days', true, true, '[]', NULL, NOW() - INTERVAL '21 days', NOW() - INTERVAL '21 days'),

('event_002', 'matter_002', NULL,      'Client conference overdue - Morrison',
  'Arrange conference with David Morrison to review Defence strategy',
  NOW() - INTERVAL '3 days', true, true, '[]', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

('event_003', 'matter_005', 'dir_011', 'Particulars of Claim deadline passed',
  'Deadline for serving Particulars of Claim with supporting schedule of loss',
  NOW() - INTERVAL '2 days', true, true, '[]', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- COMPLETED: 2 events with completedAt (won't show as overdue or upcoming)
('event_004', 'matter_001', 'dir_001', 'Witness statement drafts reviewed',
  'Internal review of claimant witness statement drafts',
  NOW() - INTERVAL '5 days', true, true, '[]', NOW() - INTERVAL '5 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '5 days'),

('event_005', 'matter_002', 'dir_005', 'Defence drafted - internal review',
  'Internal team review of Defence and Counterclaim',
  NOW() - INTERVAL '1 day', true, true, '[]', NOW() - INTERVAL '1 day', NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),

-- UPCOMING within 30 days: 8 events
('event_006', 'matter_002', 'dir_005', 'File Defence and Counterclaim',
  'File and serve Defence and Counterclaim at Business and Property Courts',
  NOW() + INTERVAL '5 days', true, true, '[]', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

('event_007', 'matter_001', 'dir_001', 'Claimant witness statements due',
  'Serve all claimant witness statements by 4pm',
  NOW() + INTERVAL '10 days', true, true, '[]', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

('event_008', 'matter_005', 'dir_012', 'Acknowledgment of Service deadline',
  'Defendant to file Acknowledgment of Service',
  NOW() + INTERVAL '12 days', true, true, '[]', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

('event_009', 'matter_006', 'dir_013', 'Service charge disclosure deadline',
  'Camden to disclose all service charge accounts and invoices',
  NOW() + INTERVAL '14 days', true, true, '[]', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('event_010', 'matter_004', 'dir_008', 'Medical evidence service deadline',
  'Serve all medical evidence including GP records and expert reports',
  NOW() + INTERVAL '18 days', true, true, '[]', NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

('event_011', 'matter_004', 'dir_010', 'NHS Trust medical records disclosure',
  'Deadline for NHS Trust to provide full medical records disclosure',
  NOW() + INTERVAL '21 days', true, true, '[]', NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

('event_012', 'matter_001', 'dir_002', 'Defendant witness statements due',
  'Defendant to serve all witness statements of fact in response',
  NOW() + INTERVAL '28 days', true, true, '[]', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

('event_013', 'matter_006', 'dir_014', 'Leaseholder witness statements due',
  'Serve statements from representative leaseholders',
  NOW() + INTERVAL '28 days', true, true, '[]', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

-- UPCOMING beyond 30 days (won't count in metric but visible on calendar)
('event_014', 'matter_002', 'dir_006', 'Disclosure deadline - Barclays v Morrison',
  'Standard disclosure by list with statement of truth',
  NOW() + INTERVAL '35 days', true, true, '[]', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

('event_015', 'matter_004', 'dir_009', 'Case Management Conference - Patel v NHS',
  'CMC listed before Mrs Justice Andrews, 2 hour estimate',
  NOW() + INTERVAL '35 days', true, true, '[]', NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

('event_016', 'matter_001', 'dir_003', 'Joint expert report due',
  'Structural engineering expert to file report with court',
  NOW() + INTERVAL '42 days', true, true, '[]', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

('event_017', 'matter_001', 'dir_004', 'Pre-trial review - Reynolds v Thames',
  'PTR listed before HHJ Williams, 1 hour estimate',
  NOW() + INTERVAL '56 days', true, true, '[]', NULL, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days');

-- ============================================================
-- NOTIFICATIONS (mix of read and unread for realism)
-- ============================================================
INSERT INTO "notifications" ("id", "user_id", "calendar_event_id", "type", "channel", "title", "message", "read_at", "sent_at", "created_at") VALUES
('notif_001', 'user_sol_001',    'event_001', 'ESCALATION',        'IN_APP', 'OVERDUE: Expert instruction letter',
  'The expert instruction letter for Reynolds v Thames is now 7 days overdue. Immediate action required.',
  NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

('notif_002', 'user_senior_001', 'event_002', 'ESCALATION',        'IN_APP', 'OVERDUE: Client conference - Morrison',
  'Client conference with David Morrison for Barclays v Morrison is 3 days overdue.',
  NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

('notif_003', 'user_sol_001',    'event_006', 'DEADLINE_REMINDER',  'IN_APP', 'Deadline in 5 days: Defence filing',
  'The Defence and Counterclaim in Barclays v Morrison must be filed within 5 days.',
  NULL, NOW(), NOW()),

('notif_004', 'user_sol_001',    'event_007', 'DEADLINE_REMINDER',  'IN_APP', 'Deadline in 10 days: Witness statements',
  'Claimant witness statements for Reynolds v Thames Construction are due in 10 days.',
  NULL, NOW(), NOW()),

('notif_005', 'user_senior_001', 'event_010', 'DEADLINE_REMINDER',  'IN_APP', 'Deadline in 18 days: Medical evidence',
  'Medical evidence for Patel v NHS Foundation Trust must be served within 18 days.',
  NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

('notif_006', 'user_sol_001',    NULL,        'DIRECTION_PARSED',   'IN_APP', 'Court order parsed: Reynolds v Thames',
  '4 directions were extracted from the court order with an average confidence of 82%. Please review and confirm.',
  NOW() - INTERVAL '12 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),

('notif_007', 'user_senior_001', NULL,        'DIRECTION_PARSED',   'IN_APP', 'Court order parsed: Patel v NHS',
  '3 directions extracted from the CMC order with an average confidence of 80%. Review required.',
  NOW() - INTERVAL '10 days', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),

('notif_008', 'user_para_001',   NULL,        'ASSIGNMENT',         'IN_APP', 'New matter assignment',
  'You have been assigned to Sterling Logistics v Apex Transport (DL-2026-0004) as support paralegal.',
  NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

('notif_009', 'user_admin_001',  NULL,        'ASSIGNMENT',         'IN_APP', 'New matter assignment',
  'You have been assigned to Greenwood Estate v London Borough of Camden (DL-2026-0005).',
  NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

('notif_010', 'user_sol_001',    'event_003', 'ESCALATION',        'IN_APP', 'OVERDUE: Particulars of Claim - Sterling v Apex',
  'The Particulars of Claim for Sterling v Apex Transport are 2 days overdue. Contact lead solicitor immediately.',
  NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ============================================================
-- BUNDLES
-- ============================================================
INSERT INTO "bundles" ("id", "matter_id", "created_by_id", "title", "description", "status", "total_pages", "generated_at", "created_at", "updated_at")
VALUES ('bundle_001', 'matter_001', 'user_sol_001', 'Trial Bundle - Reynolds v Thames Construction',
  'Complete trial bundle including all pleadings, witness statements, and expert evidence',
  'READY', 52, NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days');

INSERT INTO "bundle_documents" ("id", "bundle_id", "document_id", "section", "position", "start_page", "end_page") VALUES
('bd_001', 'bundle_001', 'doc_001', 'Court Orders',        1, 1,  4),
('bd_002', 'bundle_001', 'doc_002', 'Witness Statements',  2, 5,  16),
('bd_003', 'bundle_001', 'doc_003', 'Expert Evidence',     3, 17, 44),
('bd_004', 'bundle_001', 'doc_004', 'Pleadings',           4, 45, 52);

-- ============================================================
-- ESCALATION POLICIES (for demo)
-- ============================================================
INSERT INTO "escalation_policies" ("id", "firm_id", "tier", "offset_hours", "escalate_to", "channels", "is_active", "created_at") VALUES
('esc_001', 'firm_demo_001', 'T_14D',  336, 'SOLICITOR',        '{IN_APP}',          true, NOW()),
('esc_002', 'firm_demo_001', 'T_7D',   168, 'SENIOR_SOLICITOR', '{IN_APP,EMAIL}',    true, NOW()),
('esc_003', 'firm_demo_001', 'T_48H',  48,  'SUPERVISOR',       '{IN_APP,EMAIL}',    true, NOW()),
('esc_004', 'firm_demo_001', 'T_24H',  24,  'PARTNER',          '{IN_APP,EMAIL,SMS}',true, NOW());

-- ============================================================
-- AUDIT LOGS (realistic timeline)
-- ============================================================
INSERT INTO "audit_logs" ("id", "firm_id", "user_id", "action", "entity_type", "entity_id", "ip_address", "created_at") VALUES
('audit_001', 'firm_demo_001', 'user_admin_001',  'CREATE',   'Matter',    'matter_001', '203.0.113.42', NOW() - INTERVAL '21 days'),
('audit_002', 'firm_demo_001', 'user_sol_001',    'UPLOAD',   'Document',  'doc_001',    '203.0.113.42', NOW() - INTERVAL '14 days'),
('audit_003', 'firm_demo_001', 'user_sol_001',    'PARSE',    'Direction', 'dir_001',    '203.0.113.42', NOW() - INTERVAL '14 days'),
('audit_004', 'firm_demo_001', 'user_senior_001', 'CREATE',   'Matter',    'matter_002', '203.0.113.43', NOW() - INTERVAL '18 days'),
('audit_005', 'firm_demo_001', 'user_senior_001', 'CREATE',   'Matter',    'matter_004', '203.0.113.43', NOW() - INTERVAL '14 days'),
('audit_006', 'firm_demo_001', 'user_sol_001',    'CONFIRM',  'Direction', 'dir_001',    '203.0.113.42', NOW() - INTERVAL '2 days'),
('audit_007', 'firm_demo_001', 'user_sol_001',    'CONFIRM',  'Direction', 'dir_002',    '203.0.113.42', NOW() - INTERVAL '3 days'),
('audit_008', 'firm_demo_001', 'user_senior_001', 'CONFIRM',  'Direction', 'dir_005',    '203.0.113.43', NOW() - INTERVAL '1 day'),
('audit_009', 'firm_demo_001', 'user_senior_001', 'CONFIRM',  'Direction', 'dir_006',    '203.0.113.43', NOW() - INTERVAL '4 days'),
('audit_010', 'firm_demo_001', 'user_senior_001', 'CONFIRM',  'Direction', 'dir_008',    '203.0.113.43', NOW() - INTERVAL '5 days'),
('audit_011', 'firm_demo_001', 'user_sol_001',    'CONFIRM',  'Direction', 'dir_011',    '203.0.113.42', NOW() - INTERVAL '6 days'),
('audit_012', 'firm_demo_001', 'user_sol_001',    'CREATE',   'Matter',    'matter_005', '203.0.113.42', NOW() - INTERVAL '10 days'),
('audit_013', 'firm_demo_001', 'user_senior_001', 'CREATE',   'Matter',    'matter_006', '203.0.113.43', NOW() - INTERVAL '7 days'),
('audit_014', 'firm_demo_001', 'user_sol_001',    'GENERATE', 'Bundle',    'bundle_001', '203.0.113.42', NOW() - INTERVAL '2 days'),
('audit_015', 'firm_demo_001', 'user_sol_001',    'UPLOAD',   'Document',  'doc_002',    '203.0.113.42', NOW() - INTERVAL '5 days'),
('audit_016', 'firm_demo_001', 'user_sol_001',    'UPLOAD',   'Document',  'doc_003',    '203.0.113.42', NOW() - INTERVAL '3 days'),
('audit_017', 'firm_demo_001', 'user_senior_001', 'UPLOAD',   'Document',  'doc_008',    '203.0.113.43', NOW() - INTERVAL '5 days'),
('audit_018', 'firm_demo_001', 'user_admin_001',  'ESCALATE', 'CalendarEvent', 'event_001', '203.0.113.44', NOW() - INTERVAL '1 day');

-- ============================================================
-- EXPECTED DASHBOARD METRICS (when run)
-- ============================================================
-- Active Matters:       5  (matter_001, 002, 004, 005, 006)
-- Upcoming Deadlines:   8  (event_006 thru event_013, within 30 days)
-- Overdue:              3  (event_001, 002, 003 - past dates, no completedAt)
-- Completed This Week:  5  (dir_001, 002, 005, 006, 008, 011 - confirmed within 7 days)
-- Recent Matters:       5  (sorted by updatedAt desc)
-- Upcoming Events:      5  (first 5 of event_006-013 sorted by startDate asc)
