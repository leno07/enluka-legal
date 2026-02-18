-- Enluka Legal Demo Seed Data
-- Paste this into Neon SQL Editor and click Run

-- Firm
INSERT INTO "firms" ("id", "name", "sra_number", "address", "phone", "email", "website", "is_active", "created_at", "updated_at")
VALUES ('firm_demo_001', 'Demo Legal LLP', '612345', '1 Temple Row, London EC4Y 0AA', '+44 20 7946 0958', 'info@demo-legal.co.uk', 'https://demo-legal.co.uk', true, NOW(), NOW());

-- Users (passwords: Admin123!, Solicitor123!, Senior123!, Paralegal123!)
INSERT INTO "users" ("id", "firm_id", "email", "password_hash", "first_name", "last_name", "role", "is_active", "created_at", "updated_at") VALUES
('user_admin_001', 'firm_demo_001', 'admin@demo-legal.co.uk', '$2b$10$mr7HfuIES4Q9UhCWcpd.ducK2EojTN1R2.RAhJ73i6GoS5Z2if9VO', 'Sarah', 'Mitchell', 'ADMIN', true, NOW(), NOW()),
('user_sol_001', 'firm_demo_001', 'solicitor@demo-legal.co.uk', '$2b$10$KRSIFsZbjN1PZdpKov7tQOBL3SGAnpcSproAGw1yHBRIsDXo3qejS', 'James', 'Hartley', 'SOLICITOR', true, NOW(), NOW()),
('user_senior_001', 'firm_demo_001', 'senior@demo-legal.co.uk', '$2b$10$wKfr3BxF5Klj8dUmXwesxO8M.EDQ3NcUFJBlYN04okPMjdz3nUbh.', 'Victoria', 'Chen', 'SENIOR_SOLICITOR', true, NOW(), NOW()),
('user_para_001', 'firm_demo_001', 'paralegal@demo-legal.co.uk', '$2b$10$gSB4LqXF3ps.OzOdCOtiDunak8jyzi9KgDcdYIHlGWV5H5EpwN9nm', 'Tom', 'Barker', 'PARALEGAL', true, NOW(), NOW());

-- Matters
INSERT INTO "matters" ("id", "firm_id", "reference", "title", "client_name", "client_reference", "court", "case_number", "judge", "status", "owner_id", "description", "created_at", "updated_at") VALUES
('matter_001', 'firm_demo_001', 'DL-2026-0001', 'Reynolds v Thames Construction Ltd', 'Michael Reynolds', 'MR/2026/001', 'Central London County Court', 'CL-2026-000482', 'HHJ Williams', 'ACTIVE', 'user_sol_001', 'Construction dispute - defective works claim. Client alleges significant structural defects in residential extension completed October 2025.', NOW(), NOW()),
('matter_002', 'firm_demo_001', 'DL-2026-0002', 'Barclays Bank UK PLC v Morrison', 'David Morrison', 'DM/2026/002', 'Business and Property Courts', 'BP-2026-001247', 'Master Clark', 'ACTIVE', 'user_senior_001', 'Defended possession proceedings. Client facing repossession of commercial premises. Counterclaim for mis-sold interest rate swap.', NOW(), NOW()),
('matter_003', 'firm_demo_001', 'DL-2025-0047', 'Harrison v Royal Mail Group Ltd', 'Patricia Harrison', 'PH/2025/047', 'Employment Tribunal (London Central)', 'ET-2025-3847', 'EJ Thompson', 'CLOSED', 'user_sol_001', 'Unfair dismissal and disability discrimination claim. Settled via ACAS conciliation December 2025.', NOW(), NOW()),
('matter_004', 'firm_demo_001', 'DL-2026-0003', 'Patel v NHS Foundation Trust', 'Dr Anish Patel', 'AP/2026/003', 'High Court (King''s Bench Division)', 'QB-2026-000891', 'Mrs Justice Andrews DBE', 'ACTIVE', 'user_senior_001', 'Clinical negligence claim. Alleged failure to diagnose and treat spinal condition leading to permanent nerve damage.', NOW(), NOW());

-- Matter Assignments
INSERT INTO "matter_assignments" ("id", "matter_id", "user_id", "role", "assigned_at") VALUES
('assign_001', 'matter_001', 'user_sol_001', 'LEAD', NOW()),
('assign_002', 'matter_001', 'user_para_001', 'ASSIGNED', NOW()),
('assign_003', 'matter_002', 'user_senior_001', 'LEAD', NOW()),
('assign_004', 'matter_002', 'user_sol_001', 'ASSIGNED', NOW()),
('assign_005', 'matter_003', 'user_sol_001', 'LEAD', NOW()),
('assign_006', 'matter_004', 'user_senior_001', 'LEAD', NOW()),
('assign_007', 'matter_004', 'user_admin_001', 'ASSIGNED', NOW());

-- Directions
INSERT INTO "directions" ("id", "matter_id", "order_number", "title", "description", "due_date", "status", "confidence_score", "confirmed_by_id", "confirmed_at", "created_at", "updated_at") VALUES
('dir_001', 'matter_001', 1, 'Claimant to serve witness statements', 'The Claimant shall serve all witness statements of fact upon which they intend to rely by 4pm on the specified date.', NOW() + INTERVAL '14 days', 'CONFIRMED', 0.94, 'user_sol_001', NOW(), NOW(), NOW()),
('dir_002', 'matter_001', 2, 'Defendant to serve witness statements', 'The Defendant shall serve all witness statements of fact in response by 4pm on the specified date.', NOW() + INTERVAL '35 days', 'CONFIRMED', 0.91, 'user_sol_001', NOW(), NOW(), NOW()),
('dir_003', 'matter_001', 3, 'Joint expert report on structural defects', 'The parties shall jointly instruct a single expert in structural engineering. The expert shall prepare a report and file it with the court.', NOW() + INTERVAL '56 days', 'PENDING_REVIEW', 0.78, NULL, NULL, NOW(), NOW()),
('dir_004', 'matter_001', 4, 'Pre-trial review hearing', 'Pre-trial review to be listed with a time estimate of 1 hour. Both parties to file skeleton arguments 3 days prior.', NOW() + INTERVAL '70 days', 'PENDING_REVIEW', 0.65, NULL, NULL, NOW(), NOW()),
('dir_005', 'matter_002', 1, 'Defendant to file and serve Defence', 'The Defendant shall file and serve a full Defence and Counterclaim within 28 days of service of the Particulars of Claim.', NOW() + INTERVAL '7 days', 'CONFIRMED', 0.96, 'user_senior_001', NOW(), NOW(), NOW()),
('dir_006', 'matter_002', 2, 'Disclosure of documents', 'Standard disclosure by list. Each party to serve a disclosure list verified by a statement of truth.', NOW() + INTERVAL '42 days', 'CONFIRMED', 0.88, 'user_senior_001', NOW(), NOW(), NOW()),
('dir_007', 'matter_004', 1, 'Claimant to serve medical evidence', 'The Claimant shall serve all medical evidence including GP records, hospital notes, and expert medical reports.', NOW() + INTERVAL '21 days', 'PENDING_REVIEW', 0.82, NULL, NULL, NOW(), NOW()),
('dir_008', 'matter_004', 2, 'Case management conference', 'The matter shall be listed for a Case Management Conference with a time estimate of 2 hours.', NOW() + INTERVAL '49 days', 'PENDING_REVIEW', 0.71, NULL, NULL, NOW(), NOW());

-- Documents
INSERT INTO "documents" ("id", "matter_id", "uploaded_by", "file_name", "file_size", "mime_type", "storage_key", "bucket", "category", "description", "page_count", "created_at", "updated_at") VALUES
('doc_001', 'matter_001', 'user_sol_001', 'Court_Order_Reynolds_v_Thames_20260115.pdf', 245000, 'application/pdf', 'matter_001/court-orders/order_20260115.pdf', 'court-orders', 'COURT_ORDER', 'Initial case management order from HHJ Williams', 4, NOW(), NOW()),
('doc_002', 'matter_001', 'user_para_001', 'Witness_Statement_Reynolds_M.pdf', 182000, 'application/pdf', 'matter_001/documents/ws_reynolds.pdf', 'documents', 'WITNESS_STATEMENT', 'Claimant witness statement - Michael Reynolds', 12, NOW(), NOW()),
('doc_003', 'matter_001', 'user_sol_001', 'Expert_Report_Structural_Survey.pdf', 1520000, 'application/pdf', 'matter_001/documents/expert_structural.pdf', 'documents', 'EXPERT_REPORT', 'Preliminary structural survey report by Dr James Engineering', 28, NOW(), NOW()),
('doc_004', 'matter_002', 'user_senior_001', 'Particulars_of_Claim_Barclays_v_Morrison.pdf', 310000, 'application/pdf', 'matter_002/documents/poc_barclays.pdf', 'documents', 'PLEADING', 'Particulars of Claim served by Claimant', 8, NOW(), NOW()),
('doc_005', 'matter_004', 'user_senior_001', 'Application_Notice_Patel.pdf', 95000, 'application/pdf', 'matter_004/documents/app_notice_patel.pdf', 'documents', 'APPLICATION', 'Application for interim payment pending trial', 3, NOW(), NOW());

-- Calendar Events
INSERT INTO "calendar_events" ("id", "matter_id", "direction_id", "title", "description", "start_date", "is_all_day", "is_deadline", "reminders_sent", "completed_at", "created_at", "updated_at") VALUES
('event_001', 'matter_001', 'dir_001', 'Witness statements due - Reynolds v Thames', 'Deadline for claimant witness statements', NOW() + INTERVAL '14 days', true, true, '[]', NULL, NOW(), NOW()),
('event_002', 'matter_001', 'dir_002', 'Defendant witness statements due', 'Deadline for defendant witness statements', NOW() + INTERVAL '35 days', true, true, '[]', NULL, NOW(), NOW()),
('event_003', 'matter_002', 'dir_005', 'Defence and Counterclaim due - Barclays v Morrison', 'File and serve Defence and Counterclaim', NOW() + INTERVAL '7 days', true, true, '[]', NULL, NOW(), NOW()),
('event_004', 'matter_002', 'dir_006', 'Disclosure deadline - Barclays v Morrison', 'Standard disclosure by list', NOW() + INTERVAL '42 days', true, true, '[]', NULL, NOW(), NOW()),
('event_005', 'matter_004', 'dir_007', 'Medical evidence due - Patel v NHS', 'Serve all medical evidence', NOW() + INTERVAL '21 days', true, true, '[]', NULL, NOW(), NOW()),
('event_006', 'matter_001', NULL, 'Overdue: Expert instruction letter', 'Send instruction letter to jointly appointed expert', NOW() - INTERVAL '3 days', true, true, '[]', NULL, NOW(), NOW());

-- Notifications
INSERT INTO "notifications" ("id", "user_id", "calendar_event_id", "type", "channel", "title", "message", "read_at", "sent_at", "created_at") VALUES
('notif_001', 'user_sol_001', 'event_001', 'DEADLINE_REMINDER', 'IN_APP', 'Deadline approaching: Witness statements', 'Witness statements for Reynolds v Thames Construction are due in 14 days.', NULL, NOW(), NOW()),
('notif_002', 'user_senior_001', 'event_003', 'ESCALATION', 'IN_APP', 'Urgent: Defence due in 7 days', 'The Defence and Counterclaim in Barclays v Morrison is due in 7 days. Please ensure it is filed on time.', NULL, NOW(), NOW()),
('notif_003', 'user_sol_001', NULL, 'DIRECTION_PARSED', 'IN_APP', 'Court order parsed: Reynolds v Thames', '4 directions were extracted from the court order with an average confidence of 82%. Please review and confirm.', NOW(), NOW(), NOW()),
('notif_004', 'user_para_001', NULL, 'ASSIGNMENT', 'IN_APP', 'New matter assignment', 'You have been assigned to Reynolds v Thames Construction Ltd (DL-2026-0001) as support paralegal.', NULL, NOW(), NOW());

-- Bundle
INSERT INTO "bundles" ("id", "matter_id", "created_by_id", "title", "description", "status", "total_pages", "generated_at", "created_at", "updated_at")
VALUES ('bundle_001', 'matter_001', 'user_sol_001', 'Trial Bundle - Reynolds v Thames Construction', 'Complete trial bundle including all pleadings, witness statements, and expert evidence', 'READY', 52, NOW(), NOW(), NOW());

-- Bundle Documents
INSERT INTO "bundle_documents" ("id", "bundle_id", "document_id", "section", "position", "start_page", "end_page") VALUES
('bd_001', 'bundle_001', 'doc_001', 'Court Orders', 1, 1, 4),
('bd_002', 'bundle_001', 'doc_002', 'Witness Statements', 2, 5, 16),
('bd_003', 'bundle_001', 'doc_003', 'Expert Evidence', 3, 17, 44),
('bd_004', 'bundle_001', 'doc_004', 'Pleadings', 4, 45, 52);

-- Audit Logs
INSERT INTO "audit_logs" ("id", "firm_id", "user_id", "action", "entity_type", "entity_id", "ip_address", "created_at") VALUES
('audit_001', 'firm_demo_001', 'user_admin_001', 'CREATE', 'Matter', 'matter_001', '203.0.113.42', NOW() - INTERVAL '10 days'),
('audit_002', 'firm_demo_001', 'user_sol_001', 'UPLOAD', 'Document', 'doc_001', '203.0.113.42', NOW() - INTERVAL '9 days'),
('audit_003', 'firm_demo_001', 'user_sol_001', 'PARSE', 'Direction', 'dir_001', '203.0.113.42', NOW() - INTERVAL '9 days'),
('audit_004', 'firm_demo_001', 'user_sol_001', 'CONFIRM', 'Direction', 'dir_001', '203.0.113.42', NOW() - INTERVAL '8 days'),
('audit_005', 'firm_demo_001', 'user_sol_001', 'CONFIRM', 'Direction', 'dir_002', '203.0.113.42', NOW() - INTERVAL '8 days'),
('audit_006', 'firm_demo_001', 'user_senior_001', 'CREATE', 'Matter', 'matter_002', '203.0.113.43', NOW() - INTERVAL '7 days'),
('audit_007', 'firm_demo_001', 'user_sol_001', 'GENERATE', 'Bundle', 'bundle_001', '203.0.113.42', NOW() - INTERVAL '2 days');
