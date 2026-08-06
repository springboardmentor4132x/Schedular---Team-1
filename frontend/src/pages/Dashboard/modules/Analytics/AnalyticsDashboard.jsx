/**
 * AnalyticsDashboard.jsx
 *
 * Module 6 — Analytics Dashboard (Overview).
 * KPI summary, trend chart (Recharts), platform comparison bar chart,
 * top content list, and date-range toggle.
 *
 * This is the NEW analytics dashboard for Module 6.
 * The existing AnalyticsPage.jsx is preserved for backward compatibility.
 */

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Legend,
} from 'recharts';
import {
  MdTrendingUp, MdPeople, MdCheckCircle, MdTimeline,
  MdThumbUp, MdChatBubble, MdShare, MdTouchApp,
} from 'react-icons/md';
import PageContainer   from '../../components/PageContainer/PageContainer';
import StatsCard       from '../../components/StatsCard/StatsCard';
import SectionTitle    from '../../components/SectionTitle/SectionTitle';
import { PLATFORM_META } from './analyticsMockData';
import SubNav from './components/SubNav';
import analyticsService from '../../../../services/analyticsService';
import './AnalyticsDashboard.css';

const DATE_RANGES = [
  { label: '7 Days',  days: 7  },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

const METRIC_OPTIONS = [
  { key: 'reach',       label: 'Reach',       color: '#4f46e5' },
  { key: 'impressions', label: 'Impressions',  color: '#0ea5e9' },
  { key: 'engagement',  label: 'Engagement',   color: '#10b981' },
  { key: 'clicks',      label: 'Clicks',       color: '#f59e0b' },
];

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatPct(n) { return `${n.toFixed(1)}%`; }

// Custom tooltip for area chart
function CustomAreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="an2-tooltip">
      <p className="an2-tooltip__label">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="an2-tooltip__row">
          <span className="an2-tooltip__dot" style={{ background: p.color }} />
          <span className="an2-tooltip__key">{p.name}:</span>
          <span className="an2-tooltip__val">{formatK(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsDashboard({ ownerType = 'marketing' }) {
  const [range, setRange]   = useState(30);
  const [metric, setMetric] = useState('reach');
  const [dashboardData, setDashboardData] = useState(null);
  const [campaignData, setCampaignData] = useState([]);
  const [platformData, setPlatformData] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [dashRes, campRes, platRes, trendRes] = await Promise.all([
          analyticsService.getDashboard({ days: range }),
          analyticsService.getCampaigns(),
          analyticsService.getPlatforms(),
          analyticsService.getTrends({ days: range })
        ]);
        setDashboardData(dashRes);
        setCampaignData(campRes);
        setPlatformData(platRes);
        setTrendData(trendRes);
      } catch (e) {
        console.error('Failed to fetch analytics', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  const metricMeta = METRIC_OPTIONS.find((m) => m.key === metric) ?? METRIC_OPTIONS[0];

  if (loading || !dashboardData) {
    return (
      <PageContainer title="Analytics Overview" breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Overview']}>
        <SubNav role={ownerType} />
        <div style={{ padding: '2rem' }}>Loading analytics...</div>
      </PageContainer>
    );
  }

  const kpiCards = [
    { title: 'Total Reach',      value: formatK(dashboardData.totalReach),       icon: <MdPeople />,      trend: 'up',    change: 14 },
    { title: 'Total Impressions',value: formatK(dashboardData.totalImpressions),  icon: <MdTimeline />,    trend: 'up',    change: 9  },
    { title: 'Engagement',       value: formatK(dashboardData.totalEngagement),   icon: <MdTrendingUp />,  trend: 'up',    change: 6  },
    { title: 'Engagement Rate',  value: formatPct(dashboardData.overallEngagementRate), icon: <MdCheckCircle />, trend: 'up', change: 1.2 },
    { title: 'Likes',            value: formatK(dashboardData.totalLikes),         icon: <MdThumbUp />,     trend: 'up',    change: 8  },
    { title: 'Comments',         value: formatK(dashboardData.totalComments),      icon: <MdChatBubble />,  trend: 'up',    change: 4  },
    { title: 'Shares',           value: formatK(dashboardData.totalShares),        icon: <MdShare />,       trend: 'up',    change: 3  },
    { title: 'Link Clicks',      value: formatK(dashboardData.totalClicks),        icon: <MdTouchApp />,       trend: 'neutral', change: 0 },
  ];

  // Platform comparison data for bar chart
  const platChartData = Object.entries(platformData).map(([key, val]) => ({
    name: PLATFORM_META[key]?.label ?? key,
    Reach: val.reach,
    Engagement: val.engagement,
    Followers: val.followers,
    color: PLATFORM_META[key]?.color ?? '#4f46e5',
  }));

  return (
    <PageContainer
      title="Analytics Overview"
      description="Performance dashboard — reach, engagement, and growth across all platforms."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Overview']}
    >
      <SubNav role={ownerType} />

      {/* ── Date Range Picker ──────────────────────────────────────────── */}
      <div className="an2-toolbar">
        <div className="an2-range-group">
          {DATE_RANGES.map((r) => (
            <button
              key={r.days}
              className={`an2-range-btn${range === r.days ? ' an2-range-btn--active' : ''}`}
              onClick={() => setRange(r.days)}
              id={`an2-range-${r.days}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Grid ───────────────────────────────────────────────────── */}
      <div className="an2-kpi-grid">
        {kpiCards.map((c, i) => (
          <StatsCard key={i} {...c} />
        ))}
      </div>

      {/* ── Area Chart (Trend) ─────────────────────────────────────────── */}
      <div className="an2-chart-card">
        <div className="an2-chart-card__header">
          <SectionTitle title="Performance Trend" description={`${range}-day ${metricMeta.label} trend across all platforms.`} />
          <div className="an2-metric-tabs">
            {METRIC_OPTIONS.map((m) => (
              <button
                key={m.key}
                className={`an2-metric-tab${metric === m.key ? ' an2-metric-tab--active' : ''}`}
                style={metric === m.key ? { borderColor: m.color, color: m.color } : {}}
                onClick={() => setMetric(m.key)}
                id={`an2-metric-${m.key}`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="an2-chart-body">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="an2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={metricMeta.color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={metricMeta.color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval={Math.ceil(trendData.length / 8)}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatK}
                width={50}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey={metric}
                name={metricMeta.label}
                stroke={metricMeta.color}
                strokeWidth={2.5}
                fill="url(#an2Grad)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0, fill: metricMeta.color }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Platform Comparison Bar Chart ──────────────────────────────── */}
      <div className="an2-chart-card">
        <div className="an2-chart-card__header">
          <SectionTitle title="Platform Comparison" description="Reach vs Engagement across all connected platforms." />
        </div>
        <div className="an2-chart-body">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={platChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatK} width={50} />
              <Tooltip formatter={(val) => formatK(val)} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: 12 }} />
              <Bar dataKey="Reach"      fill="#4f46e5" radius={[4,4,0,0]} />
              <Bar dataKey="Engagement" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Campaign Performance Summary ───────────────────────────────── */}
      <div className="an2-panel">
        <SectionTitle title="Campaign Performance" description="Top campaigns by reach and engagement." />
        <div className="an2-camp-table-wrap">
          <table className="an2-camp-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Status</th>
                <th>Posts</th>
                <th>Reach</th>
                <th>Engagement</th>
                <th>Clicks</th>
                <th>Completion</th>
              </tr>
            </thead>
            <tbody>
              {campaignData.map((c) => (
                <tr key={c.id}>
                  <td className="an2-camp-name">{c.name}</td>
                  <td>
                    <span className={`an2-camp-status an2-camp-status--${c.status}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>{c.posts}</td>
                  <td>{formatK(c.reach)}</td>
                  <td>{formatK(c.engagement)}</td>
                  <td>{formatK(c.clicks)}</td>
                  <td>
                    <div className="an2-progress-bar">
                      <div
                        className="an2-progress-bar__fill"
                        style={{ width: `${c.completion}%`, background: c.status === 'completed' ? '#10b981' : '#4f46e5' }}
                      />
                    </div>
                    <span className="an2-progress-pct">{c.completion}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
