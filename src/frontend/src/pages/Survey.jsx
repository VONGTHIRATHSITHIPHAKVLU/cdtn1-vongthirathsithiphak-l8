import React, { useMemo, useState } from 'react';
import { surveysApi } from '../api/surveys.api.js';
import { useData } from '../components/useData.js';

export function Survey({ token }) {
  const loader = useMemo(() => () => surveysApi.publicSurvey(token), [token]), state = useData(loader);
  const [score, setScore] = useState(null), [done, setDone] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(null), [comment, setComment] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (score === null) { setError(new Error('Vui lòng chọn mức độ hài lòng')); return; }
    setBusy(true); setError(null);
    try { await surveysApi.respond(token, { score, ...(state.data.allowComment ? { comment } : {}) }); setDone(true); }
    catch (e) { setError(e); } finally { setBusy(false); }
  }
  const terminalCodes = ['EXPIRED', 'ALREADY_ANSWERED', 'NOT_FOUND', 'DECLINED'];
  const terminalError = state.error || (terminalCodes.includes(error?.code) ? error : null);
  const messages = { EXPIRED: 'Khảo sát đã hết hạn', ALREADY_ANSWERED: 'Bạn đã gửi phản hồi', NOT_FOUND: 'Đường dẫn không hợp lệ', DECLINED: 'Bạn đã từ chối nhận khảo sát này' };
  return <section className="survey-card">
    <p className="survey-caption">{done || terminalError ? 'Trạng thái khảo sát' : state.data ? `Mẫu ${state.data.type}` : 'Khảo sát dịch vụ'}</p>
    <div className="survey-brand">MEKONG MOBILE</div>
    {done ? <div className="survey-status"><h2>Lời cảm ơn</h2><div className="success-message" role="status">Cảm ơn bạn đã phản hồi!</div></div>
      : terminalError ? <div className="survey-status"><h2>Thông báo</h2><div className="error-message" role="alert">{messages[terminalError.code] || terminalError.message}</div>{!terminalCodes.includes(terminalError.code) && <button className="secondary" onClick={state.reload}>Thử lại</button>}</div>
      : state.loading ? <p className="survey-loading" role="status">Đang tải khảo sát…</p>
      : state.data && <><h1>Đánh giá dịch vụ</h1>
        <div className="survey-context"><p>Mã yêu cầu: <span>{state.data.supportRequestId || '—'}</span></p><p>Trung tâm: {state.data.centerId ?? '—'}</p></div>
        <form onSubmit={submit} className="survey-form">
          <fieldset><legend>{state.data.question}</legend><div className={`scores ${state.data.type === 'NPS' ? 'nps-scores' : ''}`}>{Array.from({ length: state.data.scaleMax - state.data.scaleMin + 1 }, (_, index) => index + state.data.scaleMin).map(value => <label key={value} className={score === value ? 'selected' : ''}><input type="radio" name="score" value={value} checked={score === value} onChange={() => setScore(value)} required /><span>{value}</span></label>)}</div></fieldset>
          <div className="score-legend"><span>{state.data.scaleMin} = {state.data.type === 'NPS' ? 'Không bao giờ' : 'Rất không hài lòng'}</span><span>{state.data.scaleMax} = {state.data.type === 'NPS' ? 'Chắc chắn' : 'Rất hài lòng'}</span></div>
          {state.data.allowComment && <div className="comment-field"><label htmlFor="survey-comment">Nhận xét (không bắt buộc)</label><textarea id="survey-comment" placeholder="Nhập nhận xét…" value={comment} onChange={e => setComment(e.target.value)} maxLength={500} /><span className="character-count">{comment.length}/500</span></div>}
          {error && <p className="error-message" role="alert">{error.message}</p>}
          <button className="submit-survey" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi'}</button>
          <p className="survey-expiry">Có hiệu lực đến {new Date(state.data.expiresAt).toLocaleDateString('vi-VN')}</p>
        </form>
      </>}
  </section>;
}
