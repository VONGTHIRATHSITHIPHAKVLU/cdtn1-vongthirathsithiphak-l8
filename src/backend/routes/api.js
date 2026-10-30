import { AppError } from '../services/errors.js';
import { timingSafeEqual, randomBytes } from 'node:crypto';

export function apiRouter(service, { password = process.env.DEMO_PASSWORD, now = () => Date.now() } = {}) {
  const sessions = new Map(), failures = new Map();
  const equal = (a,b) => { const x=Buffer.from(a || ''),y=Buffer.from(b || ''); return x.length===y.length && timingSafeEqual(x,y); };
  return (method, path, body, authorization) => {
    if (method === 'POST' && path === '/api/auth/login') {
      if (!password) throw new AppError('AUTH_NOT_CONFIGURED','Chưa cấu hình tài khoản demo');
      const key = 'demo', fail = failures.get(key);
      if (fail?.until > now()) throw new AppError('ACCOUNT_LOCKED','Thử lại sau 15 phút');
      if (body.username !== 'demo' || typeof body.password !== 'string' || !equal(body.password,password)) {
        const count = (fail?.until && fail.until <= now() ? 0 : fail?.count || 0)+1;
        failures.set(key,{ count, until: count >= 5 ? now()+900000 : 0 });
        throw new AppError('INVALID_CREDENTIALS','Tài khoản hoặc mật khẩu không đúng');
      }
      failures.delete(key);
      const token=randomBytes(32).toString('hex'); sessions.set(token,{ expires: now()+3600000 });
      return [200,{ token, role:'MANAGER', expiresAt:new Date(now()+3600000).toISOString() }];
    }
    const publicMatch = path.match(/^\/api\/public\/surveys\/([^/]+)(\/responses)?$/);
    if (publicMatch) {
      if (method === 'GET' && !publicMatch[2]) return [200,service.publicSurvey(publicMatch[1])];
      if (method === 'POST' && publicMatch[2]) return [201,service.respond(publicMatch[1],body)];
      throw new AppError('METHOD_NOT_ALLOWED','Phương thức không hỗ trợ');
    }
    const token = authorization?.replace(/^Bearer /,''), session=sessions.get(token);
    if (!session || session.expires <= now()) { sessions.delete(token); throw new AppError('UNAUTHORIZED','Vui lòng đăng nhập lại'); }
    if (method === 'POST' && path === '/api/auth/logout') { sessions.delete(token); return [200,{ loggedOut:true }]; }
    if (path === '/api/survey-templates') {
      if (method === 'GET') return [200,service.templates()];
      if (method === 'POST') return [201,service.saveTemplate(body,1)];
    }
    const template = path.match(/^\/api\/survey-templates\/(\d+)$/);
    if (template) {
      const id=Number(template[1]);
      if (method === 'GET') return [200,service.template(id)];
      if (method === 'PUT') return [200,service.saveTemplate(body,1,id)];
      if (method === 'DELETE') return [200,service.deleteTemplate(id)];
    }
    if (path === '/api/survey-invitations') {
      if (method === 'GET') return [200,service.invitations()];
      if (method === 'POST') return [201,service.invite(body,1)];
    }
    if (method === 'GET' && path === '/api/support-requests') return [200,service.repo.requests().map(r => ({ id:r.request_code,customerId:r.customer_id,customerName:r.full_name,status:r.status,centerId:r.center_id,completedAt:r.completed_at,maskedEmail:r.email ? r.email.replace(/^(.{1,3})[^@]*@/, '$1***@') : null }))];
    const invitation = path.match(/^\/api\/survey-invitations\/(\d+)$/);
    if (invitation) {
      const id = Number(invitation[1]);
      if (method === 'GET') return [200,service.invitation(id)];
      if (method === 'PUT') return [200,service.updateInvitation(id,body,1)];
      if (method === 'DELETE') return [200,service.deleteInvitation(id)];
    }
    if (method === 'GET' && path === '/api/reports/summary') return [200,service.summary()];
    throw new AppError('NOT_FOUND','Không tìm thấy đường dẫn');
  };
}
