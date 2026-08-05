/**
 * PerformanceTrends.jsx
 *
 * Module 6 — Performance Trends.
 * Interactive date-range trend charts for reach, impressions, engagement, and followers.
 * Includes multi-metric overlay and period-over-period comparison.
 */

import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, BarChart, Bar,
} from 'recharts';
import { MdDownload } from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import StatsCard     from '../../components/StatsCard/StatsCard';
import SectionTitle  from '../../components/SectionTitle/SectionTitle';
import SubNav        from './components/SubNav';
import { generateTrendData } from './analyticsMockData';
import './PerformanceTrends.css';

const DATE_RANGES = [
  { label: '7 Days',   days: 7  },
  { label: '14 Days',  days: 14 },
  { label: '30 Days',  days: 30 },
  { label: '60 Days',  days: 60 },
  { label: '90 Days',  days: 90 },
];

const METRICS_CONFIG = [
  { key: 'reach',       label: 'Reach',       color: '#4f46e5', type: 'area' },
  { key: 'impressions', label: 'Impressions',  color: '#0ea5e9', type: 'area' },
  { key: 'engagement',  label: 'Engagement',   color: '#10b981', type: 'line' },
  { key: 'followers',   label: 'Followers',    color: '#f59e0b', type: 'line' },
  { key: 'clicks',      label: 'Clicks',       color: '#8b5cf6', type: 'line' },
  { key: 'posts',       label: 'Posts',        color: '#f97316', type: 'bar'  },
];

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function sumKey(data, key) { return data.reduce((s, d) => s + (d[key] ?? 0), 0); }
function avgKey(data, key) { return data.length ? sumKey(data, key) / data.length : 0; }

export default function PerformanceTrends({ ownerType = 'marketing' }) {
  const [range, setRange]       = useState(30);
  const [selected, setSelected] = useState(['reach', 'impressions', 'engagement']);

  const currentData  = useMemo(() => generateTrendData(range), [range]);
  const previousData = useMemo(() => generateTrendData(range), []); // simple comparison

  const toggleMetric = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // Compute period-over-period delta
  function calcChange(key) {
    const curr = sumKey(currentData, key);
    const prev = sumKey(previousData, key);
    if (prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const kpiCards = [
    { title: 'Total Reach',       value: formatK(sumKey(currentData, 'reach')),       trend: 'up', change: calcChange('reach') },
    { title: 'Total Impressions', value: formatK(sumKey(currentData, 'impressions')), trend: 'up', change: calcChange('impressions') },
    { title: 'Total Engagement',  value: formatK(sumKey(currentData, 'engagement')),  trend: 'up', change: calcChange('engagement') },
    { title: 'Total Clicks',      value: formatK(sumKey(currentData, 'clicks')),      trend: 'neutral', change: 0 },
  ];

  const activeMetrics = METRICS_CONFIG.filter((m) => selected.includes(m.key));

  const handleExport = () => {
    const headers = ['Date', ...METRICS_CONFIG.map((m) => m.label)].join(',');
    const rows = currentData.map((d) => [d.date, ...METRICS_CONFIG.map((m) => d[m.key] ?? 0)].join(','));
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'performance_trends.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer
      title="Performance Trends"
      description={`Interactive ${range}-day trend analysis — track reach, impressions, engagement, and growth.`}
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Trends']}
    >
      <SubNav role={ownerType} />

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="pt-toolbar">
        <div className="pt-range-group">
          {DATE_RANGES.map((r) => (
            <button
              key={r.days}
              className={`pt-range-btn${range === r.days ? ' pt-range-btn--active' : ''}`}
              onClick={() => setRange(r.days)}
              id={`pt-range-${r.days}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button className="pt-export-btn" onClick={handleExport} id="pt-export-btn">
          <MdDownload /> Export CSV
        </button>
      </div>

      {/* ── KPI Summary ───────────────────────────────────────────────── */}
      <div className="pt-kpi-grid">
        {kpiCards.map((c, i) => <StatsCard key={i} {...c} />)}
      </div>

      {/* ── Metric Selector ───────────────────────────────────────────── */}
      <div className="pt-metric-selector">
        {METRICS_CONFIG.map((m) => (
          <button
            key={m.key}
            className={`pt-metric-btn${selected.includes(m.key) ? ' pt-metric-btn--active' : ''}`}
            style={selected.includes(m.key) ? { borderColor: m.color, color: m.color, background: `${m.color}10` } : {}}
            onClick={() => toggleMetric(m.key)}
            id={`pt-metric-${m.key}`}
          >
            <span
              className="pt-metric-dot"
              style={{ background: m.color, opacity: selected.includes(m.key) ? 1 : 0.3 }}
            />
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Main Composed Chart ───────────────────────────────────────── */}
      <div className="pt-chart-card">
        <SectionTitle
          title="Multi-Metric Trend"
          description={`${range}-day performance across: ${activeMetrics.map((m) => m.label).join(', ')}`}
        />
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={currentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {activeMetrics.filter((m) => m.type === 'area').map((m) => (
                <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={m.color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0}    />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={Math.ceil(currentData.length / 8)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatK}
              width={55}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)' }}
              formatter={(val, name) => [formatK(val), name]}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 12 }} />
            {activeMetrics.map((m) => {
              if (m.type === 'area') return (
                <Area
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  fill={`url(#grad-${m.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              );
              if (m.type === 'bar') return (
                <Bar
                  key={m.key}
                  dataKey={m.key}
                  name={m.label}
                  fill={m.color}
                  radius={[3,3,0,0]}
                  fillOpacity={0.7}
                />
              );
              return (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  strokeDasharray={m.key === 'followers' ? '5 3' : undefined}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Daily Posts Published Bar Chart ───────────────────────────── */}
      <div className="pt-chart-card">
        <SectionTitle title="Daily Post Volume" description="Number of posts published per day in this period." />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={currentData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={Math.ceil(currentData.length / 8)}
            />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={30} />
            <Tooltip />
            <Bar dataKey="posts" name="Posts" fill="#4f46e5" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Data Table ────────────────────────────────────────────────── */}
      <div className="pt-chart-card">
        <SectionTitle title="Raw Data Table" description="Complete numeric data for the selected period." />
        <div className="pt-table-wrap">
          <table className="pt-table">
            <thead>
              <tr>
                <th>Date</th>
                {METRICS_CONFIG.map((m) => <th key={m.key} style={{ color: m.color }}>{m.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {currentData.slice(-14).reverse().map((d) => (
                <tr key={d.date}>
                  <td className="pt-table__date">{d.date}</td>
                  {METRICS_CONFIG.map((m) => <td key={m.key}>{formatK(d[m.key] ?? 0)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
