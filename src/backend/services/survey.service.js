import { randomBytes } from 'node:crypto';
import { AppError } from './errors.js';
import { templateInput, invitationInput, responseInput } from '../validators/survey.js';
import { toTemplate, toInvitation } from '../contracts/survey.contract.js';
const missing = () => { throw new AppError(404,'NOT_FOUND','Không tìm thấy dữ liệu'); };
export class SurveyService {
  constructor(repository, now = () => new Date()) { this.repo = repository; this.now = now; }
  templates() { return this.repo.templates().map(toTemplate); }
  template(id) { return toTemplate(this.repo.template(id) || missing()); }
  saveTemplate(body, actor, id) {
    const input = templateInput(body);
    if (id) {
      this.template(id);
      if (this.repo.usedTemplate(id)) throw new AppError(409,'TEMPLATE_IN_USE','Không sửa mẫu đã dùng; hãy tạo mẫu mới');
    }
    if (this.repo.templates().some(t => t.template_id !== id && t.name.toLowerCase() === input.name.toLowerCase())) throw new AppError(409,'TEMPLATE_NAME_EXISTS','Tên mẫu đã tồn tại');
    return toTemplate(this.repo.saveTemplate(input,actor,this.now().toISOString(),id));
  }
  deleteTemplate(id) {
    this.template(id);
    if (this.repo.usedTemplate(id)) throw new AppError(409,'TEMPLATE_IN_USE','Mẫu đã được sử dụng');
    this.repo.deleteTemplate(id); return { id };
  }
  invitations() { return this.repo.invitations().map(row => toInvitation({ ...row, status: row.status === 'SENT' && row.expires_at <= this.now().toISOString() ? 'EXPIRED' : row.status })); }
  /** One invitation per completed request. Local delivery returns a link; no EMAIL/SMS receipt is claimed. */
  invite(body, actor) {
    const input = invitationInput(body);
    return this.repo.transaction(() => {
      const request = this.repo.request(input.supportRequestId) || missing();
      this.template(input.templateId);
      if (request.customer_id !== input.customerId) throw new AppError(400,'CUSTOMER_MISMATCH','Khách hàng không thuộc yêu cầu hỗ trợ');
      if (request.status !== 'COMPLETED') throw new AppError(400,'REQUEST_NOT_COMPLETED','Yêu cầu hỗ trợ chưa hoàn tất');
      if (!request.is_active || request.survey_opt_out) throw new AppError(409,'CUSTOMER_OPTED_OUT','Khách hàng không nhận khảo sát');
      if (!request[input.channel === 'EMAIL' ? 'email' : 'phone']) throw new AppError(400,'CONTACT_MISSING','Khách hàng thiếu thông tin liên hệ');
      if (this.repo.byRequest(request.support_request_id)) throw new AppError(409,'INVITATION_EXISTS','Yêu cầu đã có lời mời');
      const at = this.now();
      return { ...toInvitation(this.repo.insertInvitation(request.support_request_id,input,randomBytes(16).toString('hex'),actor,at.toISOString(),new Date(at.getTime()+14*86400000).toISOString())), deliveryMode: 'LOCAL_LINK' };
    });
  }
  active(token) {
    if (!/^[a-zA-Z0-9]{32}$/.test(token)) missing();
    const invitation = this.repo.byToken(token) || missing();
    if (invitation.status === 'ANSWERED') throw new AppError(409,'ALREADY_ANSWERED','Bạn đã gửi phản hồi');
    if (invitation.status !== 'SENT' || invitation.expires_at <= this.now().toISOString()) throw new AppError(409,'EXPIRED','Khảo sát đã hết hạn');
    return invitation;
  }
  publicSurvey(token) {
    const row = this.active(token), view = toTemplate({ ...row, template_id: row.template_id });
    return { templateName: view.name, type: view.type, question: view.question, scaleMin: view.scaleMin, scaleMax: view.scaleMax, allowComment: view.allowComment, expiresAt: row.expires_at, supportRequestId: row.request_code, centerId: row.center_id };
  }
  respond(token, body) {
    return this.repo.transaction(() => {
      const invitation = this.active(token), input = responseInput(body,invitation);
      return this.repo.respond(invitation,input,input.score <= (invitation.type === 'NPS' ? 6 : 2),this.now().toISOString());
    });
  }
  summary() {
    const rows = this.repo.responses(), csat = rows.filter(r => r.type === 'CSAT'), nps = rows.filter(r => r.type === 'NPS');
    const percent = (count,total) => total ? Math.round(count/total*10000)/100 : null;
    return { responseCount: rows.length, invitationCount: this.repo.invitations().length,
      csat: percent(csat.filter(r => r.score >= 4).length,csat.length), csatCount: csat.length,
      nps: nps.length ? Math.round((nps.filter(r => r.score >= 9).length-nps.filter(r => r.score <= 6).length)/nps.length*100) : null,
      npsCount: nps.length, negativeCount: rows.filter(r => r.is_negative).length,
      generatedAt: this.now().toISOString(), source: 'CSDL cục bộ', csatTarget: 80 };
  }
}
