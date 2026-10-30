import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { errorStatus } from './routes/error-status.js';
import { logger } from './logger.js';
import { createServer } from 'node:http';
import { openDatabase } from './repositories/database.js';
import { SurveyRepository } from './repositories/survey.repository.js';
import { SurveyService } from './services/survey.service.js';
import { AppError } from './services/errors.js';
import { apiRouter } from './routes/api.js';

export function createApp(service, { log = logger, ...options } = {}) {
  const route = apiRouter(service,options);
  return createServer(async (req,res) => {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    const requestId = randomUUID(), started = Date.now();
    let routeName = 'other', failureCode, failure;
    res.setHeader('X-Request-Id',requestId);
    res.on('finish',()=>log(res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info','request completed',{ requestId, method:req.method, route:routeName, status:res.statusCode, durationMs:Date.now()-started, code:failureCode, error:failure }));
    try {
      const path = new URL(req.url,'http://localhost').pathname;
      routeName = path.startsWith('/api/public/surveys/') ? '/api/public/surveys/:token' : (path.match(/^\/api\/[a-z/-]+(?:\/\d+)?$/)?.[0] || 'other');
      if (req.method === 'GET' && path === '/api/health') {
        service.repo.db.prepare('SELECT 1').get();
        res.end(JSON.stringify({status:'ok'})); return;
      }
      let body = {};
      if (['POST','PUT'].includes(req.method)) {
        let text='';
        for await (const chunk of req) {
          text+=chunk;
          if (Buffer.byteLength(text)>16384) throw new AppError('BODY_TOO_LARGE','Dữ liệu quá lớn');
        }
        try { body=JSON.parse(text || '{}'); } catch { throw new AppError('INVALID_JSON','JSON không hợp lệ'); }
        if (!body || Array.isArray(body) || typeof body !== 'object') throw new AppError('INVALID_JSON','Cần một đối tượng JSON');
      }
      const [status,result]=route(req.method,new URL(req.url,'http://localhost').pathname,body,req.headers.authorization);
      res.writeHead(status); res.end(JSON.stringify(result));
    } catch (error) {
      const status=error instanceof AppError ? errorStatus(error.code) : 500;
      const known=error instanceof AppError && status < 500;
      if (status >= 500) failure = error;
      failureCode = known ? error.code : 'INTERNAL_ERROR';
      res.writeHead(status);
      res.end(JSON.stringify({ error:known ? error.code : 'INTERNAL_ERROR',message:known ? error.message : 'Hệ thống gặp sự cố. Vui lòng thử lại.', fields:known ? error.fields : {}, ...(status >= 500 ? {requestId} : {}) }));
    }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db=openDatabase(), app=createApp(new SurveyService(new SurveyRepository(db)));
  app.listen(Number(process.env.APP_PORT || 3000),process.env.APP_HOST || '127.0.0.1',()=>logger('info','API started',{port:Number(process.env.APP_PORT || 3000)}));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>app.close(()=>{db.close();process.exit(0);}));
}
