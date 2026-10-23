/** One HTTP boundary: timeout/network errors are safe for users; 401 clears the session. */
export async function request(path, { method='GET', body, publicRequest=false } = {}) {
  try {
    const token=sessionStorage.getItem('session');
    const response=await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}${path}`, { method, signal:AbortSignal.timeout(10000),
      headers:{ 'Content-Type':'application/json', ...(!publicRequest && token ? { Authorization:`Bearer ${token}` } : {}) },
      ...(body !== undefined ? { body:JSON.stringify(body) } : {}) });
    const data=await response.json();
    if (response.status===401 && !publicRequest) { sessionStorage.removeItem('session'); window.dispatchEvent(new Event('session-expired')); }
    if (!response.ok) throw Object.assign(new Error(data.message || 'Không thể thực hiện yêu cầu'),{ fields:data.fields || {},code:data.error });
    return data;
  } catch (error) {
    if (error instanceof TypeError || ['TimeoutError','AbortError'].includes(error.name)) throw new Error('Không kết nối được máy chủ. Vui lòng thử lại.');
    throw error;
  }
}
