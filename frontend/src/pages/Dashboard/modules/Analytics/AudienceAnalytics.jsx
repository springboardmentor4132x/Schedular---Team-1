/**
 * AudienceAnalytics.jsx
 *
 * Module 6 — Audience Analytics.
 * Follower growth, gender/age distribution, country breakdown, and activity heatmap.
 */

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { MdPeople, MdTrendingUp, MdTrendingDown, MdPerson } from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import StatsCard     from '../../components/StatsCard/StatsCard';
import SectionTitle  from '../../components/SectionTitle/SectionTitle';
import SubNav        from './components/SubNav';
import { useState, useEffect } from 'react';
import analyticsService from '../../../../services/analyticsService';
import './AudienceAnalytics.css';

const GENDER_COLORS = ['#4f46e5', '#e879f9', '#94a3b8'];
const AGE_COLOR = '#0ea5e9';

function formatK(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function CustomPieLegend({ data, colors }) {
  return (
    <div className="aud-pie-legend">
      {data.map((d, i) => (
        <div key={d.name} className="aud-pie-legend__item">
          <span className="aud-pie-legend__dot" style={{ background: colors[i] }} />
          <span className="aud-pie-legend__name">{d.name}</span>
          <span className="aud-pie-legend__val">{d.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function AudienceAnalytics({ ownerType = 'marketing' }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await analyticsService.getAudience();
        setD(res);
      } catch (e) {
        console.error('Failed to fetch audience analytics', e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !d) {
    return (
      <PageContainer title="Audience Analytics" breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Audience']}>
        <SubNav role={ownerType} />
        <div style={{ padding: '2rem' }}>Loading audience data...</div>
      </PageContainer>
    );
  }

  const kpiCards = [
    { title: 'Total Followers',  value: formatK(d.followers),    icon: <MdPeople />,      trend: 'up',   change: 2.2 },
    { title: 'New Followers',    value: formatK(d.newFollowers),  icon: <MdTrendingUp />,  trend: 'up',   change: 8.4 },
    { title: 'Lost Followers',   value: formatK(d.lostFollowers), icon: <MdTrendingDown />,trend: 'down', change: -3.1 },
    { title: 'Net Growth',       value: `+${formatK(d.netGrowth)}`, icon: <MdPerson />,   trend: 'up',   change: 5.2 },
  ];

  // Build hour heatmap data (0–23)
  const MAX_HOUR = Math.max(...d.mostActiveHours);

  return (
    <PageContainer
      title="Audience Analytics"
      description="Understand your audience — follower growth, demographics, country reach, and peak activity hours."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Analytics', 'Audience']}
    >
      <SubNav role={ownerType} />

      {/* ── KPI Cards ─────────────────────────────────────────────────── */}
      <div className="aud-kpi-grid">
        {kpiCards.map((c, i) => <StatsCard key={i} {...c} />)}
      </div>

      {/* ── Follower Growth Line Chart ─────────────────────────────────── */}
      <div className="aud-chart-card">
        <SectionTitle title="Follower Growth" description="Monthly follower count over the last 6 months." />
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={d.followerGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={formatK} width={55} domain={['dataMin - 1000', 'dataMax + 500']} />
            <Tooltip formatter={(v) => formatK(v)} />
            <Line type="monotone" dataKey="followers" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} activeDot={{ r: 6 }} name="Followers" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Demographics ──────────────────────────────────────────────── */}
      <div className="aud-demo-row">
        {/* Gender pie chart */}
        <div className="aud-chart-card aud-chart-card--half">
          <SectionTitle title="Gender Distribution" description="Audience split by gender identity." />
          <div className="aud-pie-container">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={d.genderDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {d.genderDistribution.map((_, i) => (
                    <Cell key={i} fill={GENDER_COLORS[i % GENDER_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <CustomPieLegend data={d.genderDistribution} colors={GENDER_COLORS} />
          </div>
        </div>

        {/* Age distribution bar chart */}
        <div className="aud-chart-card aud-chart-card--half">
          <SectionTitle title="Age Distribution" description="Audience breakdown by age range." />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={d.ageDistribution} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 12, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={45} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" fill={AGE_COLOR} radius={[0,4,4,0]} name="Audience %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Country Distribution ──────────────────────────────────────── */}
      <div className="aud-chart-card">
        <SectionTitle title="Country Distribution" description="Top countries by audience size." />
        <div className="aud-country-list">
          {d.countryDistribution.map((c) => (
            <div key={c.country} className="aud-country-row">
              <span className="aud-country-name">{c.country}</span>
              <div className="aud-country-bar-wrap">
                <div className="aud-country-bar" style={{ width: `${c.value}%` }} />
              </div>
              <span className="aud-country-pct">{c.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Most Active Days ──────────────────────────────────────────── */}
      <div className="aud-chart-card">
        <SectionTitle title="Most Active Days" description="When your audience is most engaged during the week." />
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={d.mostActiveDays} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 13, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip formatter={(v) => `${v} / 100`} />
            <Bar dataKey="value" name="Activity" fill="#10b981" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Hourly Activity Heatmap ───────────────────────────────────── */}
      <div className="aud-chart-card">
        <SectionTitle title="Peak Activity Hours" description="Relative audience activity by hour of the day (UTC)." />
        <div className="aud-heatmap">
          {d.mostActiveHours.map((val, hour) => {
            const intensity = MAX_HOUR > 0 ? val / MAX_HOUR : 0;
            return (
              <div
                key={hour}
                className="aud-heatmap__cell"
                title={`${hour}:00 — Activity: ${val}`}
                style={{ background: `rgba(79,70,229,${0.05 + intensity * 0.9})` }}
              >
                <span className="aud-heatmap__hour">{hour}h</span>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
