import React,{useState} from 'react';
import { surveysApi } from '../api/surveys.api.js';
export function Login({onLogin}) {
  const [error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function submit(e){e.preventDefault();setBusy(true);setError('');const body=Object.fromEntries(new FormData(e.currentTarget));
    try{const result=await surveysApi.login(body);sessionStorage.setItem('session',result.token);onLogin();}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <section><h1>Đăng nhập SmartCRM</h1><p>Tài khoản demo cục bộ · vai trò Quản lý</p><form onSubmit={submit}><label>Tài khoản<input name="username" autoComplete="username" required defaultValue="demo"/></label><label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required/></label>{error && <p role="alert">{error}</p>}<button disabled={busy}>{busy?'Đang đăng nhập…':'Đăng nhập'}</button></form></section>;
}
