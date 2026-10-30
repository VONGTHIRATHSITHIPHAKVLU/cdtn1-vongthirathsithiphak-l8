/** One HTTP boundary: timeout/network errors are safe for users; 401 clears the session. */
export async function request(path, { method='GET', body, publicRequest=false } = {}) {
  try {
    const token=sessionStorage.getItem('session');
    const response=await fetch(`${import.meta.env?.VITE_API_BASE_URL || '/api'}${path}`, { method, signal:AbortSignal.timeout(10000),
      headers:{ 'Content-Type':'application/json', ...(!publicRequest && token ? { Authorization:`Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body:JSON.stringify(body) } : {}) });
    let data;
    try { data=await response.json(); }
    catch (error) { if (response.status < 500) throw error; data={}; }
    if (!data || typeof data !== 'object') data={};
    if (response.status===401 && !publicRequest) { sessionStorage.removeItem('session'); window.dispatchEvent(new Event('session-expired')); }
    if (!response.ok) {
      const reference = data.requestId || response.headers.get('X-Request-Id');
      const requestId = typeof reference === 'string' && /^[a-f0-9-]{36}$/i.test(reference) ? reference : undefined;
      const message = response.status >= 500 ? 'Hệ thống gặp sự cố. Vui lòng thử lại.' : (data.message || 'Không thể thực hiện yêu cầu');
      throw Object.assign(new Error(message + (response.status >= 500 && requestId ? ` Mã tra cứu: ${requestId}` : '')),{ fields:response.status >= 500 ? {} : data.fields || {},code:data.error,requestId });
    }
    return data;
  } catch (error) {
    if (error instanceof TypeError || ['TimeoutError','AbortError'].includes(error.name)) throw new Error('Không kết nối được máy chủ. Vui lòng thử lại.');
    throw error;
  }
}
