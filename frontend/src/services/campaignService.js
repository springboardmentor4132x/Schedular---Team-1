import api from './api';

const campaignService = {
  getCampaigns: async (skip = 0, limit = 100) => {
    const { data } = await api.get(`/api/v1/campaigns/?skip=${skip}&limit=${limit}`);
    return data;
  },
  createCampaign: async (campaignData) => {
    const { data } = await api.post('/api/v1/campaigns/', campaignData);
    return data;
  },
  getCampaign: async (campaignId) => {
    const { data } = await api.get(`/api/v1/campaigns/${campaignId}`);
    return data;
  },
  updateCampaign: async (campaignId, campaignData) => {
    const { data } = await api.put(`/api/v1/campaigns/${campaignId}`, campaignData);
    return data;
  },
  deleteCampaign: async (campaignId) => {
    const { data } = await api.delete(`/api/v1/campaigns/${campaignId}`);
    return data;
  }
};

export default campaignService;
