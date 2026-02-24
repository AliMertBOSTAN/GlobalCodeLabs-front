import api from './api';

// ============ TRADE ============

export const getPrice = () => api.get('/trade/price');

export const getBalance = () => api.get('/trade/balance');

export const buyToken = (tokenAmount) => api.post('/trade/buy', { tokenAmount });

export const sellToken = (txHash) => api.post('/trade/sell', { txHash });

export const previewBuy = (amount) => api.get(`/trade/preview/buy/${amount}`);

export const previewSell = (amount) => api.get(`/trade/preview/sell/${amount}`);

export const getTradeHistory = (page = 1, limit = 20) =>
  api.get(`/trade/history?page=${page}&limit=${limit}`);

// ============ WALLET ============

export const connectWallet = (message, signature) =>
  api.post('/wallet/connect', { message, signature });

export const disconnectWallet = () => api.delete('/wallet/disconnect');

export const getWalletStatus = () => api.get('/wallet/status');

// ============ ADMIN ============

export const adminSetPrice = (price) => api.post('/admin/set-price', { price });

export const adminMint = (address, amount) => api.post('/admin/mint', { address, amount });

export const adminKycRegister = (address) => api.post('/admin/kyc/register', { address });

export const adminKycToggle = (enabled) => api.post('/admin/kyc/toggle', { enabled });

export const adminDepositTry = (username, amount) =>
  api.post('/admin/deposit-try', { username, amount });

export const adminGetUsers = (page = 1, limit = 20) =>
  api.get(`/admin/users?page=${page}&limit=${limit}`);

export const adminGetTransactions = (page = 1, limit = 20, type = '') =>
  api.get(`/admin/transactions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`);

export const adminGetStats = () => api.get('/admin/stats');
