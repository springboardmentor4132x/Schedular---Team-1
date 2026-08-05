import api from './api';

const analyticsService = {
  getMetrics: async () => {
    const { data } = await api.get('/analytics');
    return data;
  }
};

export default analyticsService;
