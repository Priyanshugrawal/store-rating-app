import { api, unwrap } from './api';

export const listStores = (params) => api.get('/stores', { params }).then(unwrap);
export const submitRating = (storeId, rating) => api.post(`/stores/${storeId}/ratings`, { rating }).then(unwrap);
export const updateRating = (storeId, rating) => api.patch(`/stores/${storeId}/ratings`, { rating }).then(unwrap);
