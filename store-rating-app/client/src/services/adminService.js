import { api, unwrap } from './api';

export const getDashboard = () => api.get('/admin/dashboard').then(unwrap);
export const listUsers = (params) => api.get('/admin/users', { params }).then(unwrap);
export const getUser = (id) => api.get(`/admin/users/${id}`).then(unwrap);
export const createUser = (payload) => api.post('/admin/users', payload).then(unwrap);
export const listStores = (params) => api.get('/admin/stores', { params }).then(unwrap);
export const createStore = (payload) => api.post('/admin/stores', payload).then(unwrap);
export const availableOwners = () => api.get('/admin/owners/available').then(unwrap);
