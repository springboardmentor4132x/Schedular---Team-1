/**
 * campaignRepository.js
 *
 * Lightweight browser session repository pattern to hold temporary campaign state updates.
 * Prepares the codebase for easy backend service integration in future phases.
 */

import campaignService from '../../../../services/campaignService';

export const campaignRepository = {
  async getCampaigns() {
    return await campaignService.getCampaigns();
  },
  
  async getCampaign(id) {
    return await campaignService.getCampaign(id);
  },
  
  async createCampaign(campaignData) {
    // Map camelCase to snake_case
    const backendPayload = {
      name: campaignData.name,
      description: campaignData.description || "",
      objective: (campaignData.goals && campaignData.goals.length > 0) ? campaignData.goals.join(', ') : "",
      budget: campaignData.budget ? parseFloat(campaignData.budget) : null,
      category: campaignData.category || null,
      priority: campaignData.priority || "medium",
      platforms: campaignData.platforms || [],
      start_date: campaignData.startDate,
      end_date: campaignData.endDate,
      status: campaignData.status || "draft",
      client_id: campaignData.clientId ? parseInt(campaignData.clientId, 10) : null
    };
    return await campaignService.createCampaign(backendPayload);
  },
  
  async updateCampaign(id, updatedData) {
    const backendPayload = {
      name: updatedData.name,
      description: updatedData.description || "",
      objective: (updatedData.goals && updatedData.goals.length > 0) ? updatedData.goals.join(', ') : "",
      budget: updatedData.budget ? parseFloat(updatedData.budget) : null,
      category: updatedData.category || null,
      priority: updatedData.priority || "medium",
      platforms: updatedData.platforms || [],
      start_date: updatedData.startDate,
      end_date: updatedData.endDate,
      status: updatedData.status || "draft",
      client_id: updatedData.clientId ? parseInt(updatedData.clientId, 10) : null
    };
    return await campaignService.updateCampaign(id, backendPayload);
  },
  
  async deleteCampaign(id) {
    await campaignService.deleteCampaign(id);
  }
};

export default campaignRepository;
