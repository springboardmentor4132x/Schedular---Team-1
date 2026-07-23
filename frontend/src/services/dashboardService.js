/**
 * dashboardService.js
 *

 * Falls back to realistic mock data so the UI remains fully functional.
 */

import api from './api';

export async function getDashboard() {
  const { data } = await api.get('/dashboard');
  return data;
}

export async function getDashboardSummary() {
  const { data } = await api.get('/dashboard/summary');
  return data;
}

export async function getActivity() {
  const { data } = await api.get('/activity');
  return data;
}
