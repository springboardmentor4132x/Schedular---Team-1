/**
 * PlatformComparison.jsx
 *
 * Module 6 — Platform Comparison.
 * Side-by-side analytics comparison across all connected social platforms.
 */

import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Legend,
} from 'recharts';
import PageContainer from '../../components/PageContainer/PageContainer';
import SectionTitle  from '../../components/SectionTitle/SectionTitle';
import SubNav        from './components/SubNav';
import { useState, useEffect } from 'react';
import analyticsService from '../../../../services/analyticsService';
import { PLATFORM_META } from './analyticsMockData';
import './PlatformComparison.css';

function formatK(n) {
  if (n === null || n === undefined) return 'N/A';
  if (typeof n === 'string') return n;
  if (isNaN(Number(n))) return 'N/A';
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

const METRICS = [
  { key: 'followers',  label: 'Followers' },
  { key: 'reach',      label: 'Reach'     },
  { key: 'impressions',label: 'Impressions' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'clicks',     label: 'Clicks'    },
  { key: 'likes',      label: 'Likes'     },
];

export default function PlatformComparison({ ownerType = 'marketing' }) {
  const [platformData, setPlatformData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await analyticsService.getPlatforms({ role: ownerType });
        setPlatformData(res || {});
      } catch (e) {
        console.error('Failed to fetch platform analytics', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [ownerType]);

  const safePlatformData = platformData || {};
  const platforms = Object.keys(safePlatformData);

  // Table data for all metrics
  const tableRows = METRICS.map(({ key, label }) => {
    const row = { metric: label };
    const values = platforms.map((p) => safePlatformData[p]?.[key] ?? 0);
    const max = Math.max(...values, 0);
    platforms.forEach((p) => {
      row[p] = safePlatformData[p]?.[key] ?? 0;
      row[`${p}_best`] = (row[p] === max && max > 0);
    });
    return row;
  });

  // Radar chart data (normalized 0-100)
  const getMax = (key) => Math.max(...platforms.map((p) => safePlatformData[p]?.[key] ?? 0), 0);
  const radarData = ['reach', 'engagement', 'followers', 'clicks', 'impressions'].map((key) => {
    const maxVal = getMax(key) || 1;
    const entry = { metric: key.charAt(0).toUpperCase() + key.slice(1) };
    platforms.slice(0, 4).forEach((p) => {
      entry[p] = Math.round(((safePlatformData[p]?.[key] ?? 0) / maxVal) * 100);
    });
    return entry;
  });

  // Bar chart — reach vs engagement
  const barData = platforms.map((p) => ({
    name: PLATFORM_META[p]?.label ?? p,
    Reach: safePlatformData[p]?.reach || 0,
    Engagement: safePlatformData[p]?.engagement || 0,
    Followers: safePlatformData[p]?.followers || 0,
  }));

  const PLAT_COLORS = platforms.map((p) => PLATFORM_META[p]?.color ?? '#4f46e5');

  if (loading) {
    return (
      <PageContainer title="Platform Comparison" breadcrumb={[ownerType === 'marketing' ? 'Marketing' : (ownerType === 'business' ? 'Business' : 'Creator'), 'Analytics', 'Platforms']}>
        <SubNav role={ownerType} />
        <div style={{ padding: '2rem' }}>Loading platform comparison...</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Platform Comparison"
      description="Compare performance metrics side-by-side across all your connected social media platforms."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : (ownerType === 'business' ? 'Business' : 'Creator'), 'Analytics', 'Platforms']}
    >
      <SubNav role={ownerType} />

      {/* ── Platform cards strip ──────────────────────────────────────── */}
      <div className="pc-platforms-strip">
        {platforms.map((p) => {
          const meta = PLATFORM_META[p] ?? {};
          const data = safePlatformData[p] || {};
          return (
            <div key={p} className="pc-plat-card" style={{ borderTopColor: meta.color }}>
              <div className="pc-plat-card__name" style={{ color: meta.color }}>{meta.label || p}</div>
              <div className="pc-plat-card__metrics">
                <div className="pc-plat-metric"><span>{formatK(data.followers)}</span><small>Followers</small></div>
                <div className="pc-plat-metric"><span>{formatK(data.reach)}</span><small>Reach</small></div>
                <div className="pc-plat-metric"><span>{formatK(data.engagement)}</span><small>Engagement</small></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Comparison Bar Chart ───────────────────────────────────────── */}
      <div className="pc-chart-card">
        <SectionTitle title="Reach vs Engagement vs Followers" description="Grouped comparison across platforms." />
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatK} width={55} />
            <Tooltip formatter={(v) => formatK(v)} />
            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: 12 }} />
            <Bar dataKey="Reach"      fill="#4f46e5" radius={[4,4,0,0]} />
            <Bar dataKey="Engagement" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="Followers"  fill="#f59e0b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Radar Chart ───────────────────────────────────────────────── */}
      <div className="pc-chart-card">
        <SectionTitle title="Multi-Metric Radar" description="Normalized comparison (0-100 scale) for top 4 platforms." />
        <div className="pc-radar-wrap">
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickCount={4} />
              {platforms.slice(0, 4).map((p, i) => (
                <Radar
                  key={p}
                  name={PLATFORM_META[p]?.label ?? p}
                  dataKey={p}
                  stroke={PLAT_COLORS[i]}
                  fill={PLAT_COLORS[i]}
                  fillOpacity={0.08}
                  strokeWidth={2}
                />
              ))}
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 16 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Detailed Comparison Table ─────────────────────────────────── */}
      <div className="pc-chart-card">
        <SectionTitle title="Detailed Metrics Table" description="All tracked metrics in a single comparison table." />
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th>Metric</th>
                {platforms.map((p) => (
                  <th key={p} style={{ color: PLATFORM_META[p]?.color }}>
                    {PLATFORM_META[p]?.label ?? p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.metric}>
                  <td className="pc-table__metric">{row.metric}</td>
                  {platforms.map((p) => (
                    <td
                      key={p}
                      className={`pc-table__val${row[`${p}_best`] ? ' pc-table__val--best' : ''}`}
                    >
                      {formatK(row[p])}
                      {row[`${p}_best`] && <span className="pc-table__best-badge">Best</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
