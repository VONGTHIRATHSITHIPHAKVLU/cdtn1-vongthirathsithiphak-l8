import { openDatabase, migrate } from '../src/backend/repositories/database.js';
const db = openDatabase(); migrate(db);
db.exec(`INSERT OR IGNORE INTO customer VALUES
 (1,'Khách hàng demo 01','demo01@example.com','0900000001',0,1),
 (2,'Khách hàng demo 02','demo02@example.com','0900000002',0,1),
 (3,'Khách hàng demo 03',NULL,NULL,0,1),
 (4,'Khách hàng demo 04','demo04@example.com',NULL,1,1);
 INSERT OR IGNORE INTO support_request VALUES
 (1,'YC-DEMO-001',1,1,'COMPLETED','2026-10-23T00:00:00.000Z'),
 (2,'YC-DEMO-002',2,2,'COMPLETED','2026-10-23T00:00:00.000Z'),
 (3,'YC-DEMO-003',1,3,'OPEN',NULL),
 (4,'YC-DEMO-004',1,4,'COMPLETED','2026-10-23T00:00:00.000Z');`);
db.prepare(`INSERT OR IGNORE INTO survey_template(template_id,name,type,question,allow_comment,created_by,created_at) VALUES(1,?,?,?,?,?,?)`).run('CSAT sau hỗ trợ','CSAT','Bạn hài lòng thế nào về lần hỗ trợ vừa rồi?',1,1,new Date().toISOString());
db.close(); console.log('Seed demo: OK; đây không phải bộ dữ liệu mẫu của môn học.');
