import React, { useState } from 'react';
import { surveysApi } from '../api/surveys.api.js';
import { useData } from '../components/useData.js';
import { DataState } from '../components/DataState.jsx';
const load = async () => {
  const [invitations, templates, requests] = await Promise.all([surveysApi.invitations(), surveysApi.templates(), surveysApi.requests()]);
  return { invitations, templates, requests };
};
export function Invitations() {
  const state = useData(load), [selected, setSelected] = useState(''), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [created, setCreated] = useState(null);
  const request = state.data?.requests.find(r => r.id === selected);
  const existing = state.data?.invitations.find(i => i.supportRequestId === selected);
  const invitation = existing || (created?.supportRequestId === selected ? created : null);
  const canRespond = invitation?.status === 'SENT' && Date.parse(invitation.expiresAt) > Date.now();
  async function submit(event) {
    event.preventDefault(); setError(''); setCreated(null);
    if (!request) { setError('Vui lòng chọn yêu cầu hỗ trợ đã hoàn tất.'); return; }
    if (existing) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    try { setCreated(await surveysApi.invite({ supportRequestId: selected, customerId: request.customerId, templateId: Number(values.templateId), channel: values.channel })); state.reload(); }
    catch (e) { setError(e.message); if (e.code === 'INVITATION_EXISTS') state.reload(); } finally { setBusy(false); }
  }
  return <section className="management-page">
    <div className="page-heading"><h1>Gửi lời mời khảo sát</h1><p>Chọn yêu cầu hỗ trợ đã hoàn tất và mẫu khảo sát</p></div>
    <DataState {...state} onRetry={state.reload}>{state.data && <>
      <div className="management-grid invitations-grid">
        <div className="invitation-list"><div className="panel table-panel"><DataState empty={!state.data.requests.some(r => r.status === 'COMPLETED')}>
          <div className="table-scroll"><table className="request-table"><thead><tr><th>Chọn</th><th>Mã yêu cầu</th><th>Khách hàng</th><th>Email</th><th>Hoàn tất</th></tr></thead><tbody>
            {state.data.requests.filter(r => r.status === 'COMPLETED').map(r => <tr key={r.id} className={selected === r.id ? 'row-selected' : ''} onClick={() => { setSelected(r.id); setError(''); }}>
              <td><input type="radio" name="request" aria-label={`Chọn ${r.id}`} checked={selected === r.id} onChange={() => setSelected(r.id)} /></td><td>{r.id}</td><td>{r.customerName}</td><td>{r.maskedEmail || '—'}</td><td>{r.completedAt ? new Date(r.completedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
            </tr>)}
          </tbody></table></div>
        </DataState></div><p className="table-caption">Chỉ hiển thị yêu cầu ở trạng thái Hoàn tất. Tài khoản demo đang xem tất cả trung tâm.</p>
          {error && <div className="error-message" role="alert">Lỗi: {error}</div>}
          {invitation && <div className={canRespond ? 'success-message' : 'notice'} role="status">
            {canRespond ? 'Yêu cầu đã có lời mời. Mở liên kết bên dưới để khách hàng đánh giá.' : invitation.status === 'ANSWERED' ? 'Khách hàng đã gửi đánh giá cho yêu cầu này. Mỗi yêu cầu chỉ được đánh giá một lần.' : 'Lời mời này không còn nhận phản hồi. Chọn yêu cầu khác để tạo khảo sát mới.'}
            <p><a href={invitation.link} target="_blank" rel="noreferrer">{canRespond ? 'Mở trang khách hàng đánh giá ↗' : 'Xem trạng thái khảo sát ↗'}</a></p>
          </div>}
        </div>
        <form className="panel side-form invitation-form" onSubmit={submit}>
          <h2>Thông tin gửi</h2><span className="field-label">Yêu cầu đã chọn</span><p className="selected-request">{request ? `${request.id} – ${request.customerName}` : 'Chưa chọn yêu cầu'}</p>
          {invitation ? <><span className="field-label">Mẫu khảo sát</span><p>{invitation.templateName}</p></> : <><label htmlFor="invitation-template">Mẫu khảo sát</label><select name="templateId" id="invitation-template" required><option value="">Chọn mẫu khảo sát</option>{state.data.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></>}
          <p className="expiry-help">Đường dẫn riêng có hạn 14 ngày<br />kể từ lúc tạo</p>
          <details className="delivery-options"><summary>Kênh dự kiến</summary><select name="channel" aria-label="Kênh dự kiến"><option>EMAIL</option><option>SMS</option></select></details>
          <p className="demo-note">Chế độ demo: tạo liên kết, chưa gửi email / SMS thực tế.</p>
          <div className="form-actions stacked">{invitation ? <a className="survey-open-button" href={invitation.link} target="_blank" rel="noreferrer">{canRespond ? 'Mở trang đánh giá ↗' : 'Xem trạng thái khảo sát ↗'}</a> : <button disabled={busy || !selected || !state.data.templates.length}>{busy ? 'Đang tạo…' : 'Gửi lời mời'}</button>}<button type="button" className="secondary" disabled={busy} onClick={() => { setSelected(''); setError(''); setCreated(null); }}>Hủy</button></div>
        </form>
      </div>
      <details className="invitation-history"><summary>Lịch sử lời mời ({state.data.invitations.length})</summary><div className="panel table-panel"><DataState empty={!state.data.invitations.length}><div className="table-scroll"><table><thead><tr><th>Mã yêu cầu</th><th>Khách hàng</th><th>Trạng thái</th><th>Khảo sát</th></tr></thead><tbody>{state.data.invitations.map(i => <tr key={i.id}><td>{i.supportRequestId}</td><td>{i.customerName}</td><td>{i.status}</td><td><a href={i.link} target="_blank" rel="noreferrer">Mở liên kết ↗</a></td></tr>)}</tbody></table></div></DataState></div></details>
    </>}</DataState>
  </section>;
}
