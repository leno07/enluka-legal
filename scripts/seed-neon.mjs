import { neon } from '@neondatabase/serverless';

const DATABASE_URL = 'postgresql://neondb_owner:npg_Kh3RBgL6ZtJa@ep-shy-bonus-abt8o0ui-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function seed() {
  // Clean existing demo data
  console.log('Cleaning old demo data...');
  await sql`DELETE FROM "bundle_documents" WHERE bundle_id LIKE 'bundle_%'`;
  await sql`DELETE FROM "share_links" WHERE bundle_id LIKE 'bundle_%'`;
  await sql`DELETE FROM "bundles" WHERE id LIKE 'bundle_%'`;
  await sql`DELETE FROM "acknowledgements" WHERE notification_id LIKE 'notif_%'`;
  await sql`DELETE FROM "notifications" WHERE id LIKE 'notif_%'`;
  await sql`DELETE FROM "escalation_events" WHERE calendar_event_id LIKE 'event_%'`;
  await sql`DELETE FROM "calendar_events" WHERE id LIKE 'event_%'`;
  await sql`DELETE FROM "directions" WHERE id LIKE 'dir_%'`;
  await sql`DELETE FROM "documents" WHERE id LIKE 'doc_%'`;
  await sql`DELETE FROM "matter_assignments" WHERE id LIKE 'assign_%'`;
  await sql`DELETE FROM "matters" WHERE id LIKE 'matter_%'`;
  await sql`DELETE FROM "escalation_policies" WHERE id LIKE 'esc_%'`;
  await sql`DELETE FROM "audit_logs" WHERE id LIKE 'audit_%'`;
  console.log('Done cleaning.');

  // ── MATTERS ──
  console.log('Inserting matters...');
  await sql`INSERT INTO "matters" ("id","firm_id","reference","title","client_name","client_reference","court","case_number","judge","status","owner_id","description","created_at","updated_at") VALUES
    ('matter_001','firm_demo_001','DL-2026-0001','Reynolds v Thames Construction Ltd','Michael Reynolds','MR/2026/001','Central London County Court','CL-2026-000482','HHJ Williams','ACTIVE','user_sol_001','Construction dispute - defective works claim. Structural defects in residential extension.',NOW()-INTERVAL '21 days',NOW()-INTERVAL '1 day')`;
  await sql`INSERT INTO "matters" ("id","firm_id","reference","title","client_name","client_reference","court","case_number","judge","status","owner_id","description","created_at","updated_at") VALUES
    ('matter_002','firm_demo_001','DL-2026-0002','Barclays Bank UK PLC v Morrison','David Morrison','DM/2026/002','Business and Property Courts','BP-2026-001247','Master Clark','ACTIVE','user_senior_001','Defended possession proceedings. Counterclaim for mis-sold interest rate swap.',NOW()-INTERVAL '18 days',NOW()-INTERVAL '2 days')`;
  await sql`INSERT INTO "matters" ("id","firm_id","reference","title","client_name","client_reference","court","case_number","judge","status","owner_id","description","created_at","updated_at") VALUES
    ('matter_003','firm_demo_001','DL-2025-0047','Harrison v Royal Mail Group Ltd','Patricia Harrison','PH/2025/047','Employment Tribunal (London Central)','ET-2025-3847','EJ Thompson','CLOSED','user_sol_001','Unfair dismissal and disability discrimination. Settled via ACAS December 2025.',NOW()-INTERVAL '90 days',NOW()-INTERVAL '30 days')`;
  await sql`INSERT INTO "matters" ("id","firm_id","reference","title","client_name","client_reference","court","case_number","judge","status","owner_id","description","created_at","updated_at") VALUES
    ('matter_004','firm_demo_001','DL-2026-0003','Patel v NHS Foundation Trust','Dr Anish Patel','AP/2026/003','High Court (Kings Bench Division)','QB-2026-000891','Mrs Justice Andrews DBE','ACTIVE','user_senior_001','Clinical negligence - failure to diagnose spinal condition leading to permanent nerve damage.',NOW()-INTERVAL '14 days',NOW())`;
  await sql`INSERT INTO "matters" ("id","firm_id","reference","title","client_name","client_reference","court","case_number","judge","status","owner_id","description","created_at","updated_at") VALUES
    ('matter_005','firm_demo_001','DL-2026-0004','Sterling Logistics Ltd v Apex Transport','Sterling Logistics Ltd','SL/2026/004','Technology and Construction Court','TCC-2026-000314','HHJ Waksman','ACTIVE','user_sol_001','Commercial dispute over haulage contract. Loss of client contracts worth 1.2m.',NOW()-INTERVAL '10 days',NOW()-INTERVAL '1 day')`;
  await sql`INSERT INTO "matters" ("id","firm_id","reference","title","client_name","client_reference","court","case_number","judge","status","owner_id","description","created_at","updated_at") VALUES
    ('matter_006','firm_demo_001','DL-2026-0005','Greenwood Estate v London Borough of Camden','Greenwood Estate Management Co.','GE/2026/005','Upper Tribunal (Lands Chamber)','LT-2026-00218','Judge Cooke','ACTIVE','user_senior_001','Service charge dispute. Major works programme totalling 2.4m across 120 units.',NOW()-INTERVAL '7 days',NOW())`;
  console.log('6 matters inserted.');

  // ── ASSIGNMENTS ──
  console.log('Inserting assignments...');
  const assignments = [
    ['assign_001','matter_001','user_sol_001','LEAD','21 days'],
    ['assign_002','matter_001','user_para_001','ASSIGNED','21 days'],
    ['assign_003','matter_002','user_senior_001','LEAD','18 days'],
    ['assign_004','matter_002','user_sol_001','ASSIGNED','18 days'],
    ['assign_005','matter_003','user_sol_001','LEAD','90 days'],
    ['assign_006','matter_004','user_senior_001','LEAD','14 days'],
    ['assign_007','matter_004','user_admin_001','ASSIGNED','14 days'],
    ['assign_008','matter_005','user_sol_001','LEAD','10 days'],
    ['assign_009','matter_005','user_para_001','ASSIGNED','10 days'],
    ['assign_010','matter_006','user_senior_001','LEAD','7 days'],
    ['assign_011','matter_006','user_admin_001','ASSIGNED','7 days'],
  ];
  for (const [id, matterId, userId, role, ago] of assignments) {
    await sql`INSERT INTO "matter_assignments" ("id","matter_id","user_id","role","assigned_at")
      VALUES (${id},${matterId},${userId},${role},NOW()-CAST(${ago} AS INTERVAL))`;
  }
  console.log('11 assignments inserted.');

  // ── DIRECTIONS ──
  console.log('Inserting directions...');
  // 6 CONFIRMED within last 7 days = "completed this week"
  const directions = [
    { id:'dir_001', matter:'matter_001', n:1, title:'Claimant to serve witness statements', desc:'Serve all witness statements by 4pm.', due:'+10 days', status:'CONFIRMED', conf:0.94, by:'user_sol_001', at:'-2 days', created:'-14 days' },
    { id:'dir_002', matter:'matter_001', n:2, title:'Defendant to serve witness statements', desc:'Defendant witness statements in response.', due:'+28 days', status:'CONFIRMED', conf:0.91, by:'user_sol_001', at:'-3 days', created:'-14 days' },
    { id:'dir_003', matter:'matter_001', n:3, title:'Joint expert report on structural defects', desc:'Joint structural engineering expert report.', due:'+42 days', status:'PENDING_REVIEW', conf:0.78, by:null, at:null, created:'-14 days' },
    { id:'dir_004', matter:'matter_001', n:4, title:'Pre-trial review hearing', desc:'PTR with 1 hour estimate.', due:'+56 days', status:'PENDING_REVIEW', conf:0.65, by:null, at:null, created:'-14 days' },
    { id:'dir_005', matter:'matter_002', n:1, title:'Defendant to file and serve Defence', desc:'File Defence and Counterclaim.', due:'+5 days', status:'CONFIRMED', conf:0.96, by:'user_senior_001', at:'-1 day', created:'-10 days' },
    { id:'dir_006', matter:'matter_002', n:2, title:'Disclosure of documents', desc:'Standard disclosure by list.', due:'+35 days', status:'CONFIRMED', conf:0.88, by:'user_senior_001', at:'-4 days', created:'-10 days' },
    { id:'dir_007', matter:'matter_002', n:3, title:'Expert valuation report', desc:'Single joint expert for swap valuation.', due:'+49 days', status:'PENDING_REVIEW', conf:0.83, by:null, at:null, created:'-10 days' },
    { id:'dir_008', matter:'matter_004', n:1, title:'Claimant to serve medical evidence', desc:'Serve GP records, hospital notes, expert reports.', due:'+18 days', status:'CONFIRMED', conf:0.82, by:'user_senior_001', at:'-5 days', created:'-12 days' },
    { id:'dir_009', matter:'matter_004', n:2, title:'Case management conference', desc:'CMC with 2 hour estimate.', due:'+35 days', status:'PENDING_REVIEW', conf:0.71, by:null, at:null, created:'-12 days' },
    { id:'dir_010', matter:'matter_004', n:3, title:'NHS Trust to disclose medical records', desc:'Full disclosure of medical records.', due:'+21 days', status:'PENDING_REVIEW', conf:0.87, by:null, at:null, created:'-12 days' },
    { id:'dir_011', matter:'matter_005', n:1, title:'Particulars of Claim to be served', desc:'Serve Particulars with schedule of loss.', due:'-2 days', status:'CONFIRMED', conf:0.92, by:'user_sol_001', at:'-6 days', created:'-10 days' },
    { id:'dir_012', matter:'matter_005', n:2, title:'Defendant to file Acknowledgment of Service', desc:'Acknowledgment within 14 days.', due:'+12 days', status:'PENDING_REVIEW', conf:0.89, by:null, at:null, created:'-10 days' },
    { id:'dir_013', matter:'matter_006', n:1, title:'Service charge accounts to be disclosed', desc:'Disclose all accounts and invoices for 3 years.', due:'+14 days', status:'PENDING_REVIEW', conf:0.85, by:null, at:null, created:'-5 days' },
    { id:'dir_014', matter:'matter_006', n:2, title:'Leaseholder witness statements', desc:'Serve statements from up to 5 representative leaseholders.', due:'+28 days', status:'PENDING_REVIEW', conf:0.76, by:null, at:null, created:'-5 days' },
  ];

  for (const d of directions) {
    if (d.by) {
      await sql`INSERT INTO "directions" ("id","matter_id","order_number","title","description","due_date","status","confidence_score","confirmed_by_id","confirmed_at","created_at","updated_at")
        VALUES (${d.id},${d.matter},${d.n},${d.title},${d.desc},NOW()+CAST(${d.due} AS INTERVAL),${d.status},${d.conf},${d.by},NOW()+CAST(${d.at} AS INTERVAL),NOW()+CAST(${d.created} AS INTERVAL),NOW()+CAST(${d.at} AS INTERVAL))`;
    } else {
      await sql`INSERT INTO "directions" ("id","matter_id","order_number","title","description","due_date","status","confidence_score","confirmed_by_id","confirmed_at","created_at","updated_at")
        VALUES (${d.id},${d.matter},${d.n},${d.title},${d.desc},NOW()+CAST(${d.due} AS INTERVAL),${d.status},${d.conf},NULL,NULL,NOW()+CAST(${d.created} AS INTERVAL),NOW()+CAST(${d.created} AS INTERVAL))`;
    }
  }
  console.log('14 directions inserted.');

  // ── DOCUMENTS ──
  console.log('Inserting documents...');
  const docs = [
    ['doc_001','matter_001','user_sol_001','Court_Order_Reynolds_v_Thames.pdf',245000,'application/pdf','matter_001/order.pdf','court-orders','COURT_ORDER','Initial CMC order from HHJ Williams',4,'-14 days'],
    ['doc_002','matter_001','user_para_001','Witness_Statement_Reynolds_M.pdf',182000,'application/pdf','matter_001/ws_reynolds.pdf','documents','WITNESS_STATEMENT','Claimant witness statement',12,'-5 days'],
    ['doc_003','matter_001','user_sol_001','Expert_Report_Structural.pdf',1520000,'application/pdf','matter_001/expert.pdf','documents','EXPERT_REPORT','Structural survey report',28,'-3 days'],
    ['doc_004','matter_002','user_senior_001','Particulars_of_Claim_Barclays.pdf',310000,'application/pdf','matter_002/poc.pdf','documents','PLEADING','Particulars of Claim',8,'-10 days'],
    ['doc_005','matter_004','user_senior_001','Application_Notice_Patel.pdf',95000,'application/pdf','matter_004/app_notice.pdf','documents','APPLICATION','Application for interim payment',3,'-8 days'],
    ['doc_006','matter_005','user_sol_001','Haulage_Contract.pdf',420000,'application/pdf','matter_005/contract.pdf','documents','EVIDENCE','Original haulage contract',15,'-9 days'],
    ['doc_007','matter_005','user_sol_001','Schedule_of_Loss.pdf',87000,'application/pdf','matter_005/loss.pdf','documents','PLEADING','Schedule of losses',6,'-4 days'],
    ['doc_008','matter_006','user_senior_001','Service_Charge_Demands.pdf',560000,'application/pdf','matter_006/sc_demands.pdf','documents','EVIDENCE','Service charge demands 2023-2025',22,'-5 days'],
    ['doc_009','matter_004','user_senior_001','Court_Order_Patel_CMC.pdf',178000,'application/pdf','matter_004/order_cmc.pdf','court-orders','COURT_ORDER','CMC order from Mrs Justice Andrews',3,'-12 days'],
  ];
  for (const [id,matterId,uploadedBy,fileName,fileSize,mimeType,storageKey,bucket,category,desc,pageCount,ago] of docs) {
    await sql`INSERT INTO "documents" ("id","matter_id","uploaded_by","file_name","file_size","mime_type","storage_key","bucket","category","description","page_count","created_at","updated_at")
      VALUES (${id},${matterId},${uploadedBy},${fileName},${fileSize},${mimeType},${storageKey},${bucket},${category},${desc},${pageCount},NOW()+CAST(${ago} AS INTERVAL),NOW()+CAST(${ago} AS INTERVAL))`;
  }
  console.log('9 documents inserted.');

  // ── CALENDAR EVENTS ──
  console.log('Inserting calendar events...');
  // 3 OVERDUE
  await sql`INSERT INTO "calendar_events" ("id","matter_id","direction_id","title","description","start_date","is_all_day","is_deadline","reminders_sent","completed_at","created_at","updated_at") VALUES
    ('event_001','matter_001',NULL,'Expert instruction letter overdue','Send instruction letter to structural expert - 7 days overdue',NOW()-INTERVAL '7 days',true,true,'[]',NULL,NOW()-INTERVAL '21 days',NOW()-INTERVAL '21 days')`;
  await sql`INSERT INTO "calendar_events" ("id","matter_id","direction_id","title","description","start_date","is_all_day","is_deadline","reminders_sent","completed_at","created_at","updated_at") VALUES
    ('event_002','matter_002',NULL,'Client conference overdue - Morrison','Conference with David Morrison to review Defence strategy',NOW()-INTERVAL '3 days',true,true,'[]',NULL,NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days')`;
  await sql`INSERT INTO "calendar_events" ("id","matter_id","direction_id","title","description","start_date","is_all_day","is_deadline","reminders_sent","completed_at","created_at","updated_at") VALUES
    ('event_003','matter_005','dir_011','Particulars of Claim deadline passed','Serve Particulars of Claim with schedule of loss',NOW()-INTERVAL '2 days',true,true,'[]',NULL,NOW()-INTERVAL '10 days',NOW()-INTERVAL '10 days')`;

  // 2 COMPLETED
  await sql`INSERT INTO "calendar_events" ("id","matter_id","direction_id","title","description","start_date","is_all_day","is_deadline","reminders_sent","completed_at","created_at","updated_at") VALUES
    ('event_004','matter_001','dir_001','Witness statement drafts reviewed','Internal review of claimant witness statement drafts',NOW()-INTERVAL '5 days',true,true,'[]',NOW()-INTERVAL '5 days',NOW()-INTERVAL '14 days',NOW()-INTERVAL '5 days')`;
  await sql`INSERT INTO "calendar_events" ("id","matter_id","direction_id","title","description","start_date","is_all_day","is_deadline","reminders_sent","completed_at","created_at","updated_at") VALUES
    ('event_005','matter_002','dir_005','Defence drafted - internal review','Internal team review of Defence and Counterclaim',NOW()-INTERVAL '1 day',true,true,'[]',NOW()-INTERVAL '1 day',NOW()-INTERVAL '10 days',NOW()-INTERVAL '1 day')`;

  // 8 UPCOMING within 30 days
  const upcoming = [
    ['event_006','matter_002','dir_005','File Defence and Counterclaim','File at Business and Property Courts','5 days'],
    ['event_007','matter_001','dir_001','Claimant witness statements due','Serve all claimant witness statements by 4pm','10 days'],
    ['event_008','matter_005','dir_012','Acknowledgment of Service deadline','Defendant to file Acknowledgment','12 days'],
    ['event_009','matter_006','dir_013','Service charge disclosure deadline','Camden to disclose service charge accounts','14 days'],
    ['event_010','matter_004','dir_008','Medical evidence service deadline','Serve all medical evidence','18 days'],
    ['event_011','matter_004','dir_010','NHS Trust medical records disclosure','NHS Trust to provide full records disclosure','21 days'],
    ['event_012','matter_001','dir_002','Defendant witness statements due','Defendant to serve witness statements','28 days'],
    ['event_013','matter_006','dir_014','Leaseholder witness statements due','Serve statements from representative leaseholders','28 days'],
  ];
  for (const [id,matterId,dirId,title,desc,days] of upcoming) {
    await sql`INSERT INTO "calendar_events" ("id","matter_id","direction_id","title","description","start_date","is_all_day","is_deadline","reminders_sent","completed_at","created_at","updated_at")
      VALUES (${id},${matterId},${dirId},${title},${desc},NOW()+CAST(${days} AS INTERVAL),true,true,'[]',NULL,NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days')`;
  }

  // 4 beyond 30 days
  const future = [
    ['event_014','matter_002','dir_006','Disclosure deadline - Barclays v Morrison','Standard disclosure by list','35 days'],
    ['event_015','matter_004','dir_009','CMC - Patel v NHS','CMC before Mrs Justice Andrews','35 days'],
    ['event_016','matter_001','dir_003','Joint expert report due','Structural expert to file report','42 days'],
    ['event_017','matter_001','dir_004','Pre-trial review - Reynolds v Thames','PTR before HHJ Williams','56 days'],
  ];
  for (const [id,matterId,dirId,title,desc,days] of future) {
    await sql`INSERT INTO "calendar_events" ("id","matter_id","direction_id","title","description","start_date","is_all_day","is_deadline","reminders_sent","completed_at","created_at","updated_at")
      VALUES (${id},${matterId},${dirId},${title},${desc},NOW()+CAST(${days} AS INTERVAL),true,true,'[]',NULL,NOW()-INTERVAL '5 days',NOW()-INTERVAL '5 days')`;
  }
  console.log('17 calendar events inserted.');

  // ── NOTIFICATIONS ──
  console.log('Inserting notifications...');
  const notifs = [
    ['notif_001','user_sol_001','event_001','ESCALATION','IN_APP','OVERDUE: Expert instruction letter','Expert instruction for Reynolds v Thames is 7 days overdue.',null,'-1 day'],
    ['notif_002','user_senior_001','event_002','ESCALATION','IN_APP','OVERDUE: Client conference - Morrison','Client conference for Barclays v Morrison is 3 days overdue.',null,'-3 days'],
    ['notif_003','user_sol_001','event_006','DEADLINE_REMINDER','IN_APP','Deadline in 5 days: Defence filing','Defence in Barclays v Morrison must be filed within 5 days.',null,'0 days'],
    ['notif_004','user_sol_001','event_007','DEADLINE_REMINDER','IN_APP','Deadline in 10 days: Witness statements','Witness statements for Reynolds v Thames are due in 10 days.',null,'0 days'],
    ['notif_005','user_senior_001','event_010','DEADLINE_REMINDER','IN_APP','Deadline in 18 days: Medical evidence','Medical evidence for Patel v NHS must be served within 18 days.',null,'-2 days'],
    ['notif_008','user_para_001',null,'ASSIGNMENT','IN_APP','New matter assignment','You have been assigned to Sterling v Apex Transport.',null,'-10 days'],
    ['notif_009','user_admin_001',null,'ASSIGNMENT','IN_APP','New matter assignment','You have been assigned to Greenwood v Camden.',null,'-7 days'],
    ['notif_010','user_sol_001','event_003','ESCALATION','IN_APP','OVERDUE: Particulars - Sterling v Apex','Particulars of Claim for Sterling v Apex are 2 days overdue.',null,'-1 day'],
  ];
  for (const [id,userId,eventId,type,channel,title,message,readAt,sentAgo] of notifs) {
    if (eventId) {
      await sql`INSERT INTO "notifications" ("id","user_id","calendar_event_id","type","channel","title","message","read_at","sent_at","created_at")
        VALUES (${id},${userId},${eventId},${type},${channel},${title},${message},${readAt},NOW()+CAST(${sentAgo} AS INTERVAL),NOW()+CAST(${sentAgo} AS INTERVAL))`;
    } else {
      await sql`INSERT INTO "notifications" ("id","user_id","calendar_event_id","type","channel","title","message","read_at","sent_at","created_at")
        VALUES (${id},${userId},NULL,${type},${channel},${title},${message},${readAt},NOW()+CAST(${sentAgo} AS INTERVAL),NOW()+CAST(${sentAgo} AS INTERVAL))`;
    }
  }
  // Read notifications
  await sql`INSERT INTO "notifications" ("id","user_id","calendar_event_id","type","channel","title","message","read_at","sent_at","created_at")
    VALUES ('notif_006','user_sol_001',NULL,'DIRECTION_PARSED','IN_APP','Court order parsed: Reynolds v Thames','4 directions extracted with 82% avg confidence.',NOW()-INTERVAL '12 days',NOW()-INTERVAL '14 days',NOW()-INTERVAL '14 days')`;
  await sql`INSERT INTO "notifications" ("id","user_id","calendar_event_id","type","channel","title","message","read_at","sent_at","created_at")
    VALUES ('notif_007','user_senior_001',NULL,'DIRECTION_PARSED','IN_APP','Court order parsed: Patel v NHS','3 directions extracted with 80% avg confidence.',NOW()-INTERVAL '10 days',NOW()-INTERVAL '12 days',NOW()-INTERVAL '12 days')`;
  console.log('10 notifications inserted.');

  // ── BUNDLE ──
  console.log('Inserting bundle...');
  await sql`INSERT INTO "bundles" ("id","matter_id","created_by_id","title","description","status","total_pages","generated_at","created_at","updated_at")
    VALUES ('bundle_001','matter_001','user_sol_001','Trial Bundle - Reynolds v Thames','Complete trial bundle with pleadings, statements, and expert evidence','READY',52,NOW()-INTERVAL '2 days',NOW()-INTERVAL '3 days',NOW()-INTERVAL '2 days')`;
  await sql`INSERT INTO "bundle_documents" ("id","bundle_id","document_id","section","position","start_page","end_page") VALUES
    ('bd_001','bundle_001','doc_001','Court Orders',1,1,4)`;
  await sql`INSERT INTO "bundle_documents" ("id","bundle_id","document_id","section","position","start_page","end_page") VALUES
    ('bd_002','bundle_001','doc_002','Witness Statements',2,5,16)`;
  await sql`INSERT INTO "bundle_documents" ("id","bundle_id","document_id","section","position","start_page","end_page") VALUES
    ('bd_003','bundle_001','doc_003','Expert Evidence',3,17,44)`;
  await sql`INSERT INTO "bundle_documents" ("id","bundle_id","document_id","section","position","start_page","end_page") VALUES
    ('bd_004','bundle_001','doc_004','Pleadings',4,45,52)`;
  console.log('Bundle with 4 documents inserted.');

  // ── ESCALATION POLICIES ──
  console.log('Inserting escalation policies...');
  await sql`INSERT INTO "escalation_policies" ("id","firm_id","tier","offset_hours","escalate_to","channels","is_active","created_at") VALUES
    ('esc_001','firm_demo_001','T_14D',336,'SOLICITOR','{IN_APP}',true,NOW())`;
  await sql`INSERT INTO "escalation_policies" ("id","firm_id","tier","offset_hours","escalate_to","channels","is_active","created_at") VALUES
    ('esc_002','firm_demo_001','T_7D',168,'SENIOR_SOLICITOR','{IN_APP,EMAIL}',true,NOW())`;
  await sql`INSERT INTO "escalation_policies" ("id","firm_id","tier","offset_hours","escalate_to","channels","is_active","created_at") VALUES
    ('esc_003','firm_demo_001','T_48H',48,'SUPERVISOR','{IN_APP,EMAIL}',true,NOW())`;
  await sql`INSERT INTO "escalation_policies" ("id","firm_id","tier","offset_hours","escalate_to","channels","is_active","created_at") VALUES
    ('esc_004','firm_demo_001','T_24H',24,'PARTNER','{IN_APP,EMAIL,SMS}',true,NOW())`;
  console.log('4 escalation policies inserted.');

  // ── MATTER ROLE ASSIGNMENTS ──
  console.log('Updating matter role assignments...');
  await sql`UPDATE "matters" SET "matter_manager_id"='user_sol_001', "matter_partner_id"='user_senior_001', "client_partner_id"='user_admin_001' WHERE "id"='matter_001'`;
  await sql`UPDATE "matters" SET "matter_manager_id"='user_senior_001', "matter_partner_id"='user_admin_001', "client_partner_id"='user_admin_001' WHERE "id"='matter_002'`;
  await sql`UPDATE "matters" SET "matter_manager_id"='user_sol_001', "matter_partner_id"='user_senior_001', "client_partner_id"='user_admin_001' WHERE "id"='matter_004'`;
  await sql`UPDATE "matters" SET "matter_manager_id"='user_sol_001', "matter_partner_id"='user_senior_001', "client_partner_id"='user_admin_001' WHERE "id"='matter_005'`;
  await sql`UPDATE "matters" SET "matter_manager_id"='user_senior_001', "matter_partner_id"='user_admin_001', "client_partner_id"='user_admin_001' WHERE "id"='matter_006'`;
  console.log('5 matters updated with role assignments.');

  // ── KEY DATES ──
  console.log('Cleaning old key dates...');
  await sql`DELETE FROM "key_dates" WHERE id LIKE 'kd_%'`;
  console.log('Inserting key dates...');
  const keyDates = [
    // 1 BREACH (48h+ overdue)
    { id:'kd_001', matter:'matter_002', title:'File Counterclaim', desc:'File Defence and Counterclaim at Business and Property Courts.', due:'-5 days', status:'BREACH', owner:'user_senior_001', priority:'HIGH', breached:'-3 days' },
    // 1 OVERDUE (past due but < 48h — we set it to -1 day so it's overdue)
    { id:'kd_002', matter:'matter_001', title:'File Defence', desc:'File Defence for Reynolds v Thames Construction Ltd.', due:'-3 days', status:'OVERDUE', owner:'user_sol_001', priority:'HIGH', breached:null },
    // 3 AT_RISK (within 5 days)
    { id:'kd_003', matter:'matter_001', title:'Exchange witness statements', desc:'Exchange witness statements with defendant solicitors.', due:'+4 days', status:'AT_RISK', owner:'user_sol_001', priority:'NORMAL', breached:null },
    { id:'kd_004', matter:'matter_002', title:'Disclosure deadline', desc:'Standard disclosure by list for Barclays v Morrison.', due:'+2 days', status:'AT_RISK', owner:'user_sol_001', priority:'HIGH', breached:null },
    { id:'kd_005', matter:'matter_005', title:'Plea submission deadline', desc:'Submit plea and initial hearing preparation documents.', due:'+1 day', status:'AT_RISK', owner:'user_sol_001', priority:'HIGH', breached:null },
    // 3 ON_TRACK (> 5 days away)
    { id:'kd_006', matter:'matter_001', title:'Submit expert report', desc:'Structural expert report for residential extension defects.', due:'+12 days', status:'ON_TRACK', owner:'user_admin_001', priority:'NORMAL', breached:null },
    { id:'kd_007', matter:'matter_004', title:'Service of proceedings', desc:'Serve proceedings on NHS Foundation Trust.', due:'+8 days', status:'ON_TRACK', owner:'user_admin_001', priority:'NORMAL', breached:null },
    { id:'kd_008', matter:'matter_004', title:'Case management conference', desc:'CMC before Mrs Justice Andrews DBE.', due:'+20 days', status:'ON_TRACK', owner:'user_senior_001', priority:'NORMAL', breached:null },
  ];

  for (const kd of keyDates) {
    if (kd.breached) {
      await sql`INSERT INTO "key_dates" ("id","matter_id","title","description","due_date","status","key_date_owner_id","priority","breached_at","created_at","updated_at")
        VALUES (${kd.id},${kd.matter},${kd.title},${kd.desc},NOW()+CAST(${kd.due} AS INTERVAL),${kd.status}::"KeyDateStatus",${kd.owner},${kd.priority},NOW()+CAST(${kd.breached} AS INTERVAL),NOW()-INTERVAL '14 days',NOW())`;
    } else {
      await sql`INSERT INTO "key_dates" ("id","matter_id","title","description","due_date","status","key_date_owner_id","priority","created_at","updated_at")
        VALUES (${kd.id},${kd.matter},${kd.title},${kd.desc},NOW()+CAST(${kd.due} AS INTERVAL),${kd.status}::"KeyDateStatus",${kd.owner},${kd.priority},NOW()-INTERVAL '14 days',NOW())`;
    }
  }
  console.log('8 key dates inserted.');

  // ── VERIFY ──
  console.log('\n=== VERIFICATION ===');
  const activeMc = await sql`SELECT COUNT(*) as c FROM matters WHERE firm_id='firm_demo_001' AND status='ACTIVE'`;
  const upcomingDl = await sql`SELECT COUNT(*) as c FROM calendar_events ce JOIN matters m ON m.id=ce.matter_id WHERE m.firm_id='firm_demo_001' AND ce.is_deadline=true AND ce.completed_at IS NULL AND ce.start_date > NOW() AND ce.start_date <= NOW()+INTERVAL '30 days'`;
  const overdue = await sql`SELECT COUNT(*) as c FROM calendar_events ce JOIN matters m ON m.id=ce.matter_id WHERE m.firm_id='firm_demo_001' AND ce.is_deadline=true AND ce.completed_at IS NULL AND ce.start_date < NOW()`;
  const completed = await sql`SELECT COUNT(*) as c FROM directions d JOIN matters m ON m.id=d.matter_id WHERE m.firm_id='firm_demo_001' AND d.status='CONFIRMED' AND d.confirmed_at >= NOW()-INTERVAL '7 days'`;
  const keyDateCount = await sql`SELECT COUNT(*) as c FROM key_dates WHERE matter_id LIKE 'matter_%'`;
  const matterRoles = await sql`SELECT COUNT(*) as c FROM matters WHERE matter_manager_id IS NOT NULL AND id LIKE 'matter_%'`;
  console.log('Active Matters:      ', activeMc[0].c);
  console.log('Upcoming Deadlines:  ', upcomingDl[0].c);
  console.log('Overdue:             ', overdue[0].c);
  console.log('Completed This Week: ', completed[0].c);
  console.log('Key Dates:           ', keyDateCount[0].c);
  console.log('Matters w/ Roles:    ', matterRoles[0].c);
  console.log('\nSeed complete!');
}

seed().catch(e => { console.error('SEED ERROR:', e.message); process.exit(1); });
