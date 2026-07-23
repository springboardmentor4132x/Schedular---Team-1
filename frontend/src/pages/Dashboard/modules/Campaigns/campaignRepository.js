/**
 * campaignRepository.js
 *
 * Lightweight browser session repository pattern to hold temporary campaign state updates.
 * Prepares the codebase for easy backend service integration in future phases.
 */

let campaigns = [];

export const campaignRepository = {
  getCampaigns() {
    return campaigns;
  },
  getCampaign(id) {
    return campaigns.find(c => c.id === id);
  },
  createCampaign(campaignData) {
    const newCampaign = {
      ...campaignData,
      id: `cmp-${Math.random().toString(36).substring(2, 9)}`,
      progress: 0,
      totalPosts: 0,
      scheduledPosts: 0,
      publishedPosts: 0,
      draftPosts: 0,
      assignedPosts: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    campaigns = [newCampaign, ...campaigns];
    return newCampaign;
  },
  updateCampaign(id, updatedData) {
    campaigns = campaigns.map(c => 
      c.id === id 
        ? { ...c, ...updatedData, updatedAt: new Date().toISOString().split('T')[0] } 
        : c
    );
    return campaigns.find(c => c.id === id);
  },
  deleteCampaign(id) {
    campaigns = campaigns.filter(c => c.id !== id);
  }
};
export default campaignRepository;
