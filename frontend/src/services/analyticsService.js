import api from './api';

const analyticsService = {
  getDashboard: async (params = {}) => {
    const { data } = await api.get('/analytics/dashboard', { params });
    return data.data;
  },
  getContent: async (params = {}) => {
    const { data } = await api.get('/analytics/content', { params });
    return data.data;
  },
  getAudience: async (params = {}) => {
    const { data } = await api.get('/analytics/audience', { params });
    return data.data;
  },
  getCampaigns: async (params = {}) => {
    const { data } = await api.get('/analytics/campaigns', { params });
    return data.data;
  },
  getPlatforms: async (params = {}) => {
    const { data } = await api.get('/analytics/platforms', { params });
    return data.data;
  },
  getTrends: async (params = {}) => {
    const { data } = await api.get('/analytics/trends', { params });
    return data.data;
  },
  // Keep getMetrics for any existing components expecting it
  getMetrics: async () => {
    const { data } = await api.get('/analytics/dashboard');
    return data.data;
  }
};

export default analyticsService;
