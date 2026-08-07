/**
 * ContentAnalytics.jsx
 *
 * Module 6 — Content Analytics.
 * Top performing posts with engagement metrics, sortable table, and sparklines.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { MdSort, MdThumbUp, MdChatBubble, MdShare, MdBookmark, MdTouchApp } from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import SectionTitle  from '../../components/SectionTitle/SectionTitle';
import SubNav        from './components/SubNav';
import analyticsService from '../../../../services/analyticsService';
import { PLATFORM_META } from './analyticsMockData';
import './ContentAnalytics.css';

const SORT_KEYS = [
  { key: 'reach',           label: 'Reach'     },
  { key: 'impressions',     label: 'Impressions' },
  { key: 'engagement',      label: 'Engagement Rate' },
  { key: 'likes',           label: 'Likes'     },
  { key: 'comments',        label: 'Comments'  },
  { key: 'shares',          label: 'Shares'    },
  { key: 'clicks',          label: 'Clicks'    },
];

function formatK(n) {
  if (n === null || n === undefined) return 'N/A';
  if (typeof n === 'string') return n;
  if (isNaN(Number(n))) return 'N/A';
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function MetricChip({ icon, value, label, color }) {
  return (
    <div className="ca-metric-chip" style={{ '--chip-color': color }}>
      <span className="ca-metric-chip__icon">{icon}</span>
      <div>
        <div className="ca-metric-chip__val">{formatK(value)}</div>
        <div className="ca-metric-chip__lbl">{label}</div>
      </div>
    </div>
  );
}

export default function ContentAnalytics({ ownerType = 'marketing' }) {
  const [sortKey, setSortKey] = useState('reach');
  const [contentData, setContentData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await analyticsService.getContent();
        setContentData(res);
      } catch (e) {
        console.error('Failed to fetch content analytics', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const sorted = useMemo(() => {
    return [...contentData].sort((a, b) => {
      const aVal = sortKey === 'engagement' ? a.engagementRate : a[sortKey];
      const bVal = sortKey === 'engagement' ? b.engagementRate : b[sortKey];
      return bVal - aVal;
    });
  }, [sortKey, contentData]);

  // Aggregate metrics for bar chart
  const barChartData = [
    { name: 'Likes',     value: sorted.reduce((s, p) => s + p.likes, 0)    },
    { name: 'Comments',  value: sorted.reduce((s, p) => s + p.comments, 0) },
    { name: 'Shares',    value: sorted.reduce((s, p) => s + p.shares, 0)   },
    { name: 'Saves',     value: sorted.reduce((s, p) => s + p.saves, 0)    },
    { name: 'Clicks',    value: sorted.reduce((s, p) => s + p.clicks, 0)   },
  ];


  if (loading) {
    return (
      <PageContainer title="Content Analytics" breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Content']}>
        <SubNav role={ownerType} />
        <div style={{ padding: '2rem' }}>Loading content data...</div>
      </PageContainer>
    );
  }

  if (posts && posts.available === false) {
    return (
      <PageContainer title="Content Analytics" breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Content']}>
        <SubNav role={ownerType} />
        <div style={{ padding: '3rem 2rem', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '2rem 0' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.5rem' }}>LinkedIn Analytics Unavailable</h3>
          <p style={{ color: '#64748b', maxWidth: '500px', margin: '0 auto' }}>
            {posts.reason || 'LinkedIn API permissions do not allow analytics retrieval for this application.'}
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Content Analytics"
      description="Performance breakdown for each published post — likes, comments, shares, reach, and more."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Content']}
    >
      <SubNav role={ownerType} />

      {/* ── Aggregate KPIs ────────────────────────────────────────────── */}
      <div className="ca-kpi-row">
        <MetricChip icon={<MdThumbUp />} value={barChartData[0].value} label="Total Likes"    color="#4f46e5" />
        <MetricChip icon={<MdChatBubble />} value={barChartData[1].value} label="Total Comments" color="#0ea5e9" />
        <MetricChip icon={<MdShare />}   value={barChartData[2].value} label="Total Shares"   color="#10b981" />
        <MetricChip icon={<MdBookmark />} value={barChartData[3].value} label="Total Saves"   color="#8b5cf6" />
        <MetricChip icon={<MdTouchApp />}   value={barChartData[4].value} label="Total Clicks"   color="#f59e0b" />
      </div>

      {/* ── Engagement Breakdown Bar Chart ────────────────────────────── */}
      <div className="ca-chart-card">
        <SectionTitle title="Engagement Breakdown" description="Total engagement actions across all published content." />
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatK} width={50} />
            <Tooltip formatter={(val) => formatK(val)} />
            <Bar dataKey="value" name="Count" fill="#4f46e5" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Sort controls ─────────────────────────────────────────────── */}
      <div className="ca-sort-bar">
        <MdSort className="ca-sort-icon" />
        <span className="ca-sort-label">Sort by:</span>
        {SORT_KEYS.map((s) => (
          <button
            key={s.key}
            className={`ca-sort-btn${sortKey === s.key ? ' ca-sort-btn--active' : ''}`}
            onClick={() => setSortKey(s.key)}
            id={`ca-sort-${s.key}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── Posts Table ───────────────────────────────────────────────── */}
      <div className="ca-table-wrap">
        <table className="ca-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Post</th>
              <th>Platforms</th>
              <th>Campaign</th>
              <th>Reach</th>
              <th>Impressions</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Shares</th>
              <th>Clicks</th>
              <th>Eng. Rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((post, i) => (
              <tr key={post.id}>
                <td className="ca-rank">#{i + 1}</td>
                <td className="ca-caption">{post.caption}</td>
                <td>
                  <div className="ca-platforms">
                    {post.platforms.map((p) => (
                      <span
                        key={p}
                        className="ca-plat-badge"
                        style={{ color: PLATFORM_META[p]?.color, background: PLATFORM_META[p]?.color + '18' }}
                        title={PLATFORM_META[p]?.label}
                      >
                        {PLATFORM_META[p]?.label?.[0] ?? p[0]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="ca-camp">{post.campaign}</td>
                <td>{formatK(post.reach)}</td>
                <td>{formatK(post.impressions)}</td>
                <td>{formatK(post.likes)}</td>
                <td>{formatK(post.comments)}</td>
                <td>{formatK(post.shares)}</td>
                <td>{formatK(post.clicks)}</td>
                <td>
                  <span className="ca-eng-rate">{post.engagementRate}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
