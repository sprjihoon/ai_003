 // utils/api.js  (전체 파일)

 /**
  * API 엔드포인트 베이스 URL
  * 프런트 기본 백엔드 주소
  * 모든 요청은 `${API_BASE}/api/...` 형식으로 호출한다.
  */
 export const API_BASE = process.env.REACT_APP_API_URL || 'https://ai-003-backend.onrender.com';
 export const API_URL = process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'https://ai-003-backend.onrender.com/api';

 const buildHeaders = (method = 'GET', hasBody, extraHeaders = {}) => {
   const token = localStorage.getItem('token');
   const headers = {
     'Authorization': token ? `Bearer ${token}` : '',
     ...extraHeaders,
   };

   // JSON 바디가 있는 요청(POST/PUT/PATCH)만 Content-Type 설정
   const upper = typeof method === 'string' ? method.toUpperCase() : 'GET';
   if (hasBody || ['POST', 'PUT', 'PATCH'].includes(upper)) {
     if (!headers['Content-Type']) {
       headers['Content-Type'] = 'application/json';
     }
   }

   return headers;
 };

 export const fetchWithAuth = async (endpoint, options = {}) => {
   const url = endpoint.startsWith('/api')
     ? endpoint
     : `/api${endpoint}`;

   const method = options.method || 'GET';
   const hasBody = !!options.body;

   const response = await fetch(url, {
     // credentials: 'include', // Same-origin requests dont need this
     ...options,
     headers: buildHeaders(method, hasBody, options.headers || {}),
   });

   if (response.status === 401) {
     logout();
     window.location.href = '/';
     throw new Error('인증이 필요합니다.');
   }

   if (!response.ok) {
     let errorMsg = `HTTP ${response.status}`;
     try {
       const errJson = await response.json();
       errorMsg = errJson.message || errorMsg;
     } catch (_) {}
     throw new Error(errorMsg);
   }

   return response.json();
 };

 export const login = async (tenantId, username, password) => {
   const response = await fetch('/api/users/login', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     // credentials: 'include', // Same-origin requests dont need this
     body: JSON.stringify({ tenantId, username, password }),
   });

   if (!response.ok) {
     let errMsg = '로그인에 실패했습니다.';
     try {
       const errJson = await response.json();
       errMsg = errJson.message || errMsg;
     } catch (_) {}
     throw new Error(errMsg);
   }

   const data = await response.json();
   localStorage.setItem('token', data.token);
   localStorage.setItem('user', JSON.stringify(data.user));
   // 별도 저장 편의
   localStorage.setItem('tenantId', data.user.tenant_id);
   localStorage.setItem('tenantType', data.user.tenant_type || 'brand');
   return data;
 };

 export const logout = () => {
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   localStorage.removeItem('tenantId');
   localStorage.removeItem('tenantType');
 };
