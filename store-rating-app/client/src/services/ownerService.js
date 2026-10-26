import { api, unwrap } from './api';

export const getDashboard = () => api.get('/owner/dashboard').then(unwrap);
export const createMyStore = (payload) => api.post('/owner/store', payload).then(unwrap);
export const listRatings = (params) => api.get('/owner/ratings', { params }).then(unwrap);
