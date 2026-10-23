import { createServer } from 'node:http';
import { openDatabase } from './repositories/database.js';
import { SurveyRepository } from './repositories/survey.repository.js';
import { SurveyService } from './services/survey.service.js';
import { AppError } from './services/errors.js';
import { apiRouter } from './routes/api.js';

export function createApp(service, options) {
  const route = apiRouter(service,options);
  return createServer(async (req,res) => {
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    try {
      let body = {};
      if (['POST','PUT'].includes(req.method)) {
        let text='';
        for await (const chunk of req) {
          text+=chunk;
          if (Buffer.byteLength(text)>16384) throw new AppError(413,'BODY_TOO_LARGE','Dữ liệu quá lớn');
        }
        try { body=JSON.parse(text || '{}'); } catch { throw new AppError(400,'INVALID_JSON','JSON không hợp lệ'); }
        if (!body || Array.isArray(body) || typeof body !== 'object') throw new AppError(400,'INVALID_JSON','Cần một đối tượng JSON');
      }
      const [status,result]=route(req.method,new URL(req.url,'http://localhost').pathname,body,req.headers.authorization);
      res.writeHead(status); res.end(JSON.stringify(result));
    } catch (error) {
      const known=error instanceof AppError;
      if (!known) console.error('Request failed:',error.code || error.name);
      res.writeHead(known ? error.status : 500);
      res.end(JSON.stringify({ error:known ? error.code : 'INTERNAL_ERROR',message:known ? error.message : 'Hệ thống gặp sự cố. Vui lòng thử lại.', fields:known ? error.fields : {} }));
    }
  });
}
if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replaceAll('\\','/')}`).href) {
  const db=openDatabase(), app=createApp(new SurveyService(new SurveyRepository(db)));
  app.listen(Number(process.env.APP_PORT || 3000),'127.0.0.1',()=>console.log('API http://127.0.0.1:'+ (process.env.APP_PORT || 3000)));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>app.close(()=>{db.close();process.exit(0);}));
}
