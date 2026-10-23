PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS customer (
 customer_id INTEGER PRIMARY KEY, full_name TEXT NOT NULL, email TEXT, phone TEXT,
 survey_opt_out INTEGER NOT NULL DEFAULT 0, is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS support_request (
 support_request_id INTEGER PRIMARY KEY, request_code TEXT NOT NULL UNIQUE,
 center_id INTEGER NOT NULL, customer_id INTEGER NOT NULL REFERENCES customer(customer_id),
 status TEXT NOT NULL, completed_at TEXT
);
CREATE TABLE IF NOT EXISTS survey_template (
 template_id INTEGER PRIMARY KEY, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
 type TEXT NOT NULL CHECK(type IN ('CSAT','NPS')), question TEXT NOT NULL,
 allow_comment INTEGER NOT NULL DEFAULT 1, created_by INTEGER NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS survey_invitation (
 invitation_id INTEGER PRIMARY KEY,
 support_request_id INTEGER NOT NULL UNIQUE REFERENCES support_request(support_request_id),
 template_id INTEGER NOT NULL REFERENCES survey_template(template_id), token TEXT NOT NULL UNIQUE,
 channel TEXT NOT NULL CHECK(channel IN ('EMAIL','SMS')),
 status TEXT NOT NULL CHECK(status IN ('SENT','ANSWERED','EXPIRED','DECLINED')),
 sent_by INTEGER NOT NULL, sent_at TEXT NOT NULL, expires_at TEXT NOT NULL, reminded_at TEXT
);
CREATE TABLE IF NOT EXISTS response (
 response_id INTEGER PRIMARY KEY, invitation_id INTEGER NOT NULL UNIQUE REFERENCES survey_invitation(invitation_id),
 score INTEGER NOT NULL CHECK(score BETWEEN 0 AND 10), comment TEXT CHECK(length(comment)<=500),
 is_negative INTEGER NOT NULL, submitted_at TEXT NOT NULL,
 handled_by INTEGER, handled_at TEXT, handling_note TEXT
);
CREATE TABLE IF NOT EXISTS survey_log (
 log_id INTEGER PRIMARY KEY, invitation_id INTEGER NOT NULL REFERENCES survey_invitation(invitation_id),
 event TEXT NOT NULL, actor_type TEXT NOT NULL, actor_id INTEGER, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_response_submitted ON response(submitted_at);
CREATE INDEX IF NOT EXISTS idx_request_center ON support_request(center_id, completed_at);
