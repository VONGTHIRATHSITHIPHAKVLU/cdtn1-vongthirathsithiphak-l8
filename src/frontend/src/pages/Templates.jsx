import React, { useState } from 'react';
import { surveysApi } from '../api/surveys.api.js';
import { useData } from '../components/useData.js';
import { DataState } from '../components/DataState.jsx';

const defaultQuestions = { CSAT: 'Bạn hài lòng thế nào với dịch vụ vừa rồi?', NPS: 'Khả năng bạn giới thiệu Mekong Mobile cho người khác?' };
export function Templates() {
  const state = useData(surveysApi.templates);
  const [editing, setEditing] = useState(null), [error, setError] = useState(null), [busy, setBusy] = useState(false);
  const [name, setName] = useState(''), [type, setType] = useState('CSAT');
  const [question, setQuestion] = useState(defaultQuestions.CSAT), [allowComment, setAllowComment] = useState(true);
  const [message, setMessage] = useState('');
  function reset() { setEditing(null); setName(''); setType('CSAT'); setQuestion(defaultQuestions.CSAT); setAllowComment(true); setError(null); }
  function edit(t) { setEditing(t); setName(t.name); setType(t.type); setQuestion(t.question); setAllowComment(t.allowComment); setError(null); setMessage(''); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(null); setMessage('');
    try { await surveysApi.saveTemplate({ name, type, question, allowComment }, editing?.id); reset(); setMessage('Đã lưu mẫu khảo sát.'); state.reload(); }
    catch (e) { setError(e); } finally { setBusy(false); }
  }
  async function remove(id) {
    setBusy(true); setError(null); setMessage('');
    try { await surveysApi.deleteTemplate(id); if (editing?.id === id) reset(); setMessage('Đã xóa mẫu khảo sát.'); state.reload(); }
    catch (e) { setError(e); } finally { setBusy(false); }
  }
  const nameError = error?.fields?.name || (error?.code === 'TEMPLATE_NAME_EXISTS' ? error.message : '');
  return <section className="management-page">
    <div className="page-heading"><h1>Mẫu khảo sát</h1><p>Tạo và quản lý mẫu CSAT / NPS</p></div>
    <div className="management-grid templates-grid">
      <div><div className="panel table-panel"><DataState {...state} empty={state.data?.length === 0} onRetry={state.reload}>
        <div className="table-scroll"><table><thead><tr><th>Tên mẫu</th><th>Loại</th><th>Người tạo</th><th>Ngày tạo</th><th><span className="sr-only">Thao tác</span></th></tr></thead><tbody>
          {state.data?.map(t => <tr key={t.id} className={editing?.id === t.id ? 'row-selected' : ''}><td><button className="text-button template-name" onClick={() => edit(t)}>{t.name}</button></td><td>{t.type}</td><td>—</td><td>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td><td><button className="text-button delete-button" disabled={busy} onClick={() => remove(t.id)} aria-label={`Xóa ${t.name}`}>Xóa</button></td></tr>)}
        </tbody></table></div>
      </DataState></div>{message && <p role="status" className="success-message">{message}</p>}<p className="table-caption">Chọn tên mẫu để chỉnh sửa. Mẫu đã sử dụng không thể sửa hoặc xóa.</p></div>
      <form className="panel side-form" onSubmit={submit}>
        <h2>{editing ? 'Chỉnh sửa mẫu khảo sát' : 'Tạo mẫu khảo sát'}</h2>
        <label htmlFor="template-name">Tên mẫu *</label><input id="template-name" value={name} onChange={e => setName(e.target.value)} required minLength={3} maxLength={100} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'name-error' : undefined} />
        {nameError && <p id="name-error" className="field-error">{nameError}</p>}
        <fieldset className="type-field"><legend>Loại *</legend><div className="type-options">{['CSAT', 'NPS'].map(value => <label key={value}><input type="radio" name="type" value={value} checked={type === value} onChange={() => { setType(value); if (question === defaultQuestions[type]) setQuestion(defaultQuestions[value]); }} />{value} ({value === 'CSAT' ? '1–5' : '0–10'})</label>)}</div></fieldset>
        <details className="template-options" open={Boolean(editing)}><summary>Nội dung câu hỏi & nhận xét</summary><label htmlFor="template-question">Câu hỏi *</label><textarea id="template-question" value={question} onChange={e => setQuestion(e.target.value)} required minLength={10} maxLength={300} /><label className="checkbox-label"><input type="checkbox" checked={allowComment} onChange={e => setAllowComment(e.target.checked)} />Cho phép nhận xét</label></details>
        {error && !nameError && <p className="error-message" role="alert">{error.message}</p>}
        {nameError && <span role="alert" className="sr-only">{nameError}</span>}
        <div className="form-actions"><button disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu'}</button><button type="button" className="secondary" disabled={busy} onClick={reset}>Hủy</button></div>
      </form>
    </div>
  </section>;
}
