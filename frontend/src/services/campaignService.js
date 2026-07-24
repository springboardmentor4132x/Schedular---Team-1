import api from './api';

const campaignService = {
  getCampaigns: async (skip = 0, limit = 100) => {
    const { data } = await api.get(`/campaigns?skip=${skip}&limit=${limit}`);
    return data;
  },
  createCampaign: async (campaignData) => {
    const { data } = await api.post('/campaigns', campaignData);
    return data;
  },
  getCampaign: async (campaignId) => {
    const { data } = await api.get(`/campaigns/${campaignId}`);
    return data;
  },
  updateCampaign: async (campaignId, campaignData) => {
    const { data } = await api.put(`/campaigns/${campaignId}`, campaignData);
    return data;
  },
  deleteCampaign: async (campaignId) => {
    const { data } = await api.delete(`/campaigns/${campaignId}`);
    return data;
  }
};

export default campaignService;
