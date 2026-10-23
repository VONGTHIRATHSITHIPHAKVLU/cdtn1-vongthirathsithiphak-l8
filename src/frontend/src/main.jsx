import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Login } from './pages/Login.jsx';
import { Templates } from './pages/Templates.jsx';
import { Invitations } from './pages/Invitations.jsx';
import { Survey } from './pages/Survey.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { surveysApi } from './api/surveys.api.js';
import './style.css';

function App() {
  const [logged, setLogged] = useState(Boolean(sessionStorage.getItem('session')));
  const [page, setPage] = useState(location.hash.slice(1) || 'templates');
  useEffect(() => {
    const expired = () => setLogged(false);
    const hash = () => setPage(location.hash.slice(1) || 'templates');
    window.addEventListener('session-expired', expired);
    window.addEventListener('hashchange', hash);
    return () => { window.removeEventListener('session-expired', expired); window.removeEventListener('hashchange', hash); };
  }, []);
  const match = location.pathname.match(/^\/survey\/([^/]+)$/);
  async function logout() {
    try { await surveysApi.logout(); }
    finally { sessionStorage.removeItem('session'); setLogged(false); }
  }
  if (match) return <main className="public-layout"><Survey token={match[1]} /></main>;
  if (!logged) return <main className="login-layout"><div className="login-brand">MEKONG MOBILE</div><Login onLogin={() => setLogged(true)} /></main>;
  const links = [['dashboard', 'Trang chủ'], ['templates', 'Mẫu khảo sát'], ['invitations', 'Gửi khảo sát'], ['reports', 'Báo cáo']];
  return <div className="app-layout">
    <aside className="sidebar">
      <div className="profile"><span className="profile-dot" /><div><strong>Quản lý · Demo</strong><small>SmartCRM / L8</small></div></div>
      <nav aria-label="Điều hướng chính">{links.map(([key, label]) => <a key={key} className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined} href={`#${key}`}>{label}</a>)}</nav>
      <div className="sidebar-bottom"><span>CSAT / NPS</span><button onClick={logout}>↪ Log Out</button></div>
    </aside>
    <main className="workspace">
      <div className="workspace-brand">MEKONG MOBILE</div>
      {page === 'templates' ? <Templates /> : page === 'invitations' ? <Invitations /> : <Dashboard />}
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
