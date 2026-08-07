/**
 * CampaignAnalytics.jsx
 *
 * Module 6 — Campaign Analytics.
 * Detailed performance breakdown per campaign with progress, ROI, and metrics.
 */

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts';
import { MdCampaign, MdTrendingUp, MdCheckCircle, MdHourglassBottom } from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import StatsCard     from '../../components/StatsCard/StatsCard';
import SectionTitle  from '../../components/SectionTitle/SectionTitle';
import SubNav        from './components/SubNav';
import { useState, useEffect } from 'react';
import analyticsService from '../../../../services/analyticsService';
import './CampaignAnalytics.css';

function formatK(n) {
  if (n === null || n === undefined) return 'N/A';
  if (typeof n === 'string') return n;
  if (isNaN(Number(n))) return 'N/A';
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

const STATUS_CONFIG = {
  active:    { color: '#4f46e5', bg: 'rgba(79,70,229,0.1)'   },
  completed: { color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  draft:     { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  paused:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
};

const BAR_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];

export default function CampaignAnalytics({ ownerType = 'marketing' }) {
  const [selected, setSelected] = useState(null);
  const [campaignData, setCampaignData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await analyticsService.getCampaigns();
        setCampaignData(res);
      } catch (e) {
        console.error('Failed to fetch campaign analytics', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalReach      = campaignData.reduce((s, c) => s + c.reach, 0);
  const totalPosts      = campaignData.reduce((s, c) => s + c.posts, 0);
  const activeCampaigns = campaignData.filter((c) => c.status === 'active').length;

  const kpiCards = [
    { title: 'Total Campaigns',  value: campaignData.length, icon: <MdCampaign />,          trend: 'neutral', change: 0 },
    { title: 'Active',           value: activeCampaigns,               icon: <MdHourglassBottom />,   trend: 'up',      change: 2 },
    { title: 'Total Reach',      value: formatK(totalReach),           icon: <MdTrendingUp />,        trend: 'up',      change: 18 },
    { title: 'Total Posts',      value: totalPosts,                    icon: <MdCheckCircle />,       trend: 'up',      change: 6 },
  ];

  // Bar chart
  const reachChartData = campaignData.map((c) => ({
    name: c.name.split(' ').slice(0, 2).join(' '),
    Reach: c.reach,
    Engagement: c.engagement,
    Clicks: c.clicks,
  }));

  const selectedCamp = selected ? campaignData.find((c) => c.id === selected) : null;

  if (loading) {
    return (
      <PageContainer title="Campaign Analytics" breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Campaigns']}>
        <SubNav role={ownerType} />
        <div style={{ padding: '2rem' }}>Loading campaign data...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Campaign Analytics"
      description="Measure the effectiveness of each campaign — reach, engagement, ROI, and completion."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Campaigns']}
    >
      <SubNav role={ownerType} />

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="cam-kpi-grid">
        {kpiCards.map((c, i) => <StatsCard key={i} {...c} />)}
      </div>

      {/* ── Reach Bar Chart ───────────────────────────────────────────── */}
      <div className="cam-chart-card">
        <SectionTitle title="Campaign Reach & Engagement" description="Comparison across all campaigns." />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={reachChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatK} width={55} />
            <Tooltip formatter={(v) => formatK(v)} />
            <Bar dataKey="Reach"      fill="#4f46e5" radius={[4,4,0,0]} onClick={(d, i) => setSelected(campaignData[i].id)} cursor="pointer" />
            <Bar dataKey="Engagement" fill="#10b981" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="cam-chart-hint">Click a bar to see campaign details below.</p>
      </div>

      {/* ── Campaign Detail Card (on click) ──────────────────────────── */}
      {selectedCamp && (
        <div className="cam-detail-card" style={{ borderTopColor: STATUS_CONFIG[selectedCamp.status]?.color }}>
          <div className="cam-detail-card__header">
            <div>
              <h3 className="cam-detail-card__name">{selectedCamp.name}</h3>
              <span
                className="cam-detail-card__status"
                style={{ color: STATUS_CONFIG[selectedCamp.status]?.color, background: STATUS_CONFIG[selectedCamp.status]?.bg }}
              >
                {selectedCamp.status}
              </span>
            </div>
            <button className="cam-detail-card__close" onClick={() => setSelected(null)}>×</button>
          </div>
          <div className="cam-detail-card__metrics">
            {[
              { label: 'Posts',       value: selectedCamp.posts },
              { label: 'Reach',       value: formatK(selectedCamp.reach) },
              { label: 'Impressions', value: formatK(selectedCamp.impressions) },
              { label: 'Engagement',  value: formatK(selectedCamp.engagement) },
              { label: 'Clicks',      value: formatK(selectedCamp.clicks) },
              { label: 'ROI',         value: `${selectedCamp.roi}%` },
            ].map((m) => (
              <div key={m.label} className="cam-detail-metric">
                <div className="cam-detail-metric__val">{m.value}</div>
                <div className="cam-detail-metric__lbl">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="cam-detail-card__progress">
            <div className="cam-detail-card__progress-label">
              <span>Completion</span>
              <span>{selectedCamp.completion}%</span>
            </div>
            <div className="cam-detail-card__progress-bar">
              <div
                className="cam-detail-card__progress-fill"
                style={{
                  width: `${selectedCamp.completion}%`,
                  background: selectedCamp.completion === 100 ? '#10b981' : '#4f46e5',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── All Campaigns Table ───────────────────────────────────────── */}
      <div className="cam-chart-card">
        <SectionTitle title="All Campaigns" description="Complete campaign performance table." />
        <div className="cam-table-wrap">
          <table className="cam-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Posts</th>
                <th>Reach</th>
                <th>Engagement</th>
                <th>Clicks</th>
                <th>ROI</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {campaignData.map((c, i) => {
                const sc = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.draft;
                return (
                  <tr
                    key={c.id}
                    className={selected === c.id ? 'cam-table__row--selected' : ''}
                    onClick={() => setSelected(c.id === selected ? null : c.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="cam-table__name">{c.name}</td>
                    <td>
                      <span className="cam-table__status" style={{ color: sc.color, background: sc.bg }}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.duration}</td>
                    <td>{c.posts}</td>
                    <td>{formatK(c.reach)}</td>
                    <td>{formatK(c.engagement)}</td>
                    <td>{formatK(c.clicks)}</td>
                    <td className="cam-table__roi" style={{ color: c.roi > 100 ? '#10b981' : 'inherit' }}>
                      {c.roi > 0 ? `+${c.roi}%` : '—'}
                    </td>
                    <td>
                      <div className="cam-mini-bar">
                        <div
                          className="cam-mini-bar__fill"
                          style={{
                            width: `${c.completion}%`,
                            background: BAR_COLORS[i % BAR_COLORS.length],
                          }}
                        />
                      </div>
                      <span className="cam-mini-pct">{c.completion}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
