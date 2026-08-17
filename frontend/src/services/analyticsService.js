import {
  getRoleDataset,
  generateTrendData,
} from '../pages/Dashboard/modules/Analytics/analyticsMockData';

// Helper to extract role key from parameters object or string
function resolveRoleKey(params) {
  if (!params) return 'marketing';
  const rawRole = (typeof params === 'object' && (params.role || params.ownerType)) || params;
  if (!rawRole || typeof rawRole !== 'string') return 'marketing';
  const roleStr = rawRole.toLowerCase();
  if (roleStr.includes('creator')) return 'creator';
  if (roleStr.includes('business')) return 'business';
  return 'marketing';
}

const analyticsService = {
  getDashboard: async (params = {}) => {
    const role = resolveRoleKey(params);
    const dataset = getRoleDataset(role);
    return Promise.resolve(dataset.overview);
  },
  getContent: async (params = {}) => {
    const role = resolveRoleKey(params);
    const dataset = getRoleDataset(role);
    return Promise.resolve(dataset.content);
  },
  getAudience: async (params = {}) => {
    const role = resolveRoleKey(params);
    const dataset = getRoleDataset(role);
    return Promise.resolve(dataset.audience);
  },
  getCampaigns: async (params = {}) => {
    const role = resolveRoleKey(params);
    const dataset = getRoleDataset(role);
    return Promise.resolve(dataset.campaigns);
  },
  getPlatforms: async (params = {}) => {
    const role = resolveRoleKey(params);
    const dataset = getRoleDataset(role);
    return Promise.resolve(dataset.platforms);
  },
  getTrends: async (params = {}) => {
    const role = resolveRoleKey(params);
    const days = typeof params === 'object' ? (params.days || 30) : (Number(params) || 30);
    return Promise.resolve(generateTrendData(days, role));
  },
  // Keep getMetrics for backward compatibility
  getMetrics: async (params = {}) => {
    const role = resolveRoleKey(params);
    const dataset = getRoleDataset(role);
    return Promise.resolve(dataset.overview);
  }
};

export default analyticsService;
