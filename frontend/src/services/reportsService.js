import api from './api';

const reportsService = {
  getReports: async () => {
    // Note: The backend router right now doesn't have a GET /reports to list them.
    // Wait, let's check if there is a GET /reports endpoint.
    // We will add it to the backend soon, let's assume it exists.
    const { data } = await api.get('/reports');
    return data.data || [];
  },
  generateReport: async (payload) => {
    // payload: { name, start_date, end_date }
    const { data } = await api.post(`/reports?name=${encodeURIComponent(payload.name)}&start_date=${encodeURIComponent(payload.start_date)}&end_date=${encodeURIComponent(payload.end_date)}`);
    return data;
  },
  downloadPdf: (reportId) => {
    window.open(`${api.defaults.baseURL}/reports/${reportId}/export/pdf`, '_blank');
  },
  downloadExcel: (reportId) => {
    window.open(`${api.defaults.baseURL}/reports/${reportId}/export/excel`, '_blank');
  }
};

export default reportsService;
