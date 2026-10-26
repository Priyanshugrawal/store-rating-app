import { api, unwrap } from './api';

export const login = (payload) => api.post('/auth/login', payload).then(unwrap);
export const register = (payload) => api.post('/auth/register', payload).then(unwrap);
export const me = () => api.get('/auth/me').then(unwrap);
export const changePassword = (payload) => api.patch('/auth/change-password', payload).then(unwrap);
