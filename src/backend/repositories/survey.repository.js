export class SurveyRepository {
  constructor(db) { this.db = db; }
  transaction(work) {
    this.db.exec('BEGIN IMMEDIATE');
    try { const result = work(); this.db.exec('COMMIT'); return result; }
    catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  templates() { return this.db.prepare('SELECT * FROM survey_template ORDER BY template_id DESC').all(); }
  template(id) { return this.db.prepare('SELECT * FROM survey_template WHERE template_id=?').get(id); }
  saveTemplate(input, actor, at, id) {
    const values = [input.name, input.type, input.question, Number(input.allowComment)];
    if (id) this.db.prepare('UPDATE survey_template SET name=?,type=?,question=?,allow_comment=? WHERE template_id=?').run(...values, id);
    else id = Number(this.db.prepare('INSERT INTO survey_template(name,type,question,allow_comment,created_by,created_at) VALUES(?,?,?,?,?,?)').run(...values, actor, at).lastInsertRowid);
    return this.template(id);
  }
  usedTemplate(id) { return this.db.prepare('SELECT 1 FROM survey_invitation WHERE template_id=?').get(id); }
  deleteTemplate(id) { this.db.prepare('DELETE FROM survey_template WHERE template_id=?').run(id); }
  requests() { return this.db.prepare(`SELECT s.*, c.full_name,c.email,c.phone,c.survey_opt_out,c.is_active FROM support_request s JOIN customer c USING(customer_id) ORDER BY support_request_id`).all(); }
  request(code) { return this.requests().find(r => r.request_code === code); }
  invitations() { return this.db.prepare(`SELECT i.*,s.request_code,c.full_name,t.name FROM survey_invitation i JOIN support_request s USING(support_request_id) JOIN customer c USING(customer_id) JOIN survey_template t USING(template_id) ORDER BY invitation_id DESC`).all(); }
  byRequest(id) { return this.db.prepare('SELECT * FROM survey_invitation WHERE support_request_id=?').get(id); }
  byToken(token) { return this.db.prepare(`SELECT i.*,t.name,t.type,t.question,t.allow_comment,s.request_code,s.center_id FROM survey_invitation i JOIN survey_template t USING(template_id) JOIN support_request s USING(support_request_id) WHERE token=?`).get(token); }
  insertInvitation(requestId, input, token, actor, at, expires) {
    const id = Number(this.db.prepare(`INSERT INTO survey_invitation(support_request_id,template_id,token,channel,status,sent_by,sent_at,expires_at) VALUES(?,?,?,?,'SENT',?,?,?)`).run(requestId,input.templateId,token,input.channel,actor,at,expires).lastInsertRowid);
    this.log(id,'INVITATION_CREATED',actor,at);
    return this.invitations().find(i => i.invitation_id === id);
  }
  log(id,event,actor,at) { this.db.prepare('INSERT INTO survey_log(invitation_id,event,actor_type,actor_id,created_at) VALUES(?,?,?,?,?)').run(id,event,actor ? 'STAFF' : 'CUSTOMER',actor,at); }
  respond(invitation, input, negative, at) {
    const id = Number(this.db.prepare('INSERT INTO response(invitation_id,score,comment,is_negative,submitted_at) VALUES(?,?,?,?,?)').run(invitation.invitation_id,input.score,input.comment,Number(negative),at).lastInsertRowid);
    this.db.prepare("UPDATE survey_invitation SET status='ANSWERED' WHERE invitation_id=?").run(invitation.invitation_id);
    this.log(invitation.invitation_id,'RESPONSE_SUBMITTED',null,at);
    return { id, invitationId: invitation.invitation_id, ...input, flaggedNegative: negative, submittedAt: at };
  }
  responses() { return this.db.prepare(`SELECT r.*,t.type,s.center_id FROM response r JOIN survey_invitation i USING(invitation_id) JOIN survey_template t USING(template_id) JOIN support_request s USING(support_request_id)`).all(); }
}
