/**
 * ReportsPage.jsx
 *
 * Centralized, role-aware Reports library.
 * Lists available performance summaries, provides report creation simulator,
 * and opens printable detailed summaries inside overlay modals.
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdDescription, MdDateRange, MdFileDownload, MdVisibility,
  MdPrint, MdMailOutline, MdAdd, MdClose
} from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import EmptyState from '../../components/EmptyState/EmptyState';
import reportsService from '../../../../services/reportsService';
import './ReportsPage.css';

export default function ReportsPage({
  clientId: propClientId,
  ownerType = 'marketing',
  clientName,
  readOnly = false,
}) {
  const { clientId: paramClientId } = useParams();
  const clientId = propClientId || paramClientId;

  // Local repository reports
  const [reportsList, setReportsList] = useState([]);
  const [filterType, setFilterType] = useState('All');
  const [filterClientId, setFilterClientId] = useState('All');
  const [activeReportId, setActiveReportId] = useState(null);

  useEffect(() => {
    async function loadReports() {
      try {
        // In a real app we'd fetch all reports here
        // The backend GET /reports doesn't exist yet but we assume it will
        const data = await reportsService.getReports().catch(() => []);
        setReportsList(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadReports();
  }, []);
  const filteredReports = useMemo(() => {
    return reportsList.filter((r) => {
      // 1. Scopes
      if (ownerType === 'marketing' || ownerType === 'business') {
        const activeClientId = clientId || (filterClientId !== 'All' ? filterClientId : null);
        if (activeClientId && r.clientId !== activeClientId) return false;
        // If global marketing/business scope and All selected, only show client reports
        if (!activeClientId && !r.clientId) return false;
      } else {
        if (r.ownerType !== 'creator') return false;
      }

      // 2. Types
      if (filterType !== 'All' && r.type !== filterType) return false;

      return true;
    });
  }, [reportsList, clientId, filterClientId, ownerType, filterType]);

  const activeReport = useMemo(() => reportsList.find((r) => r.id === activeReportId), [reportsList, activeReportId]);

  // Performance numbers derived mock summary
  const mockMetricsSummary = useMemo(() => {
    if (!activeReport) return null;
    
    // Seed metrics deterministically
    const seed = activeReport.title.charCodeAt(0) || 12;
    const reach = 14500 + (seed * 85);
    const engagement = Math.round(reach * 0.092);
    
    return {
      reach: reach.toLocaleString(),
      engagement: engagement.toLocaleString(),
      rate: '9.2%',
      posts: (12 + (seed % 10)).toString(),
      bestDay: seed % 2 === 0 ? 'Thursday' : 'Tuesday',
      topPlatform: seed % 3 === 0 ? 'Instagram' : 'LinkedIn',
    };
  }, [activeReport]);

  const handleDownload = () => {
    if (activeReportId) {
      reportsService.downloadPdf(activeReportId);
    }
  };

  const handleDownloadExcel = () => {
    if (activeReportId) {
      reportsService.downloadExcel(activeReportId);
    }
  };

  const handleGenerate = async () => {
    const reportTitle = window.prompt('Enter Report Title:', 'August Campaign Audit');
    if (!reportTitle) return;

    try {
      const newReportData = await reportsService.generateReport({
        name: reportTitle,
        start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        end_date: new Date().toISOString()
      });

      const newReport = {
        id: newReportData.id,
        title: reportTitle,
        type: 'Campaign Performance',
        period: 'Recent',
        generatedAt: new Date().toISOString(),
        clientId: ownerType === 'creator' ? null : (clientId || (filterClientId !== 'All' ? filterClientId : 'nike')),
        ownerType,
        status: newReportData.status,
      };

      setReportsList((prev) => [newReport, ...prev]);
    } catch (e) {
      alert('Failed to generate report');
      console.error(e);
    }
  };

  return (
    <PageContainer
      title={clientName ? `${clientName} Reports` : 'Performance Reports'}
      description={
        clientName
          ? `Audit performance briefings and client downloads generated for ${clientName}.`
          : 'Detailed reporting workspace and social performance briefs downloads.'
      }
      breadcrumb={clientName ? ['Marketing', clientName, 'Reports'] : ['Creator', 'Reports']}
    >
      {/* Page Header toolbar */}
      <div className="rp-toolbar">
        <div className="rp-toolbar__left">
          <SectionTitle
            title="Reports & Audits"
            description="Download and inspect generated performance report briefs."
          />
        </div>

        <div className="rp-toolbar__filters" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!clientId && ownerType === 'marketing' && (
            <select
              className="rp-toolbar__select"
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
            >
              <option value="All">All Clients</option>
              <option value="nike">Nike</option>
              <option value="puma">Puma</option>
              <option value="tesla">Tesla</option>
              <option value="spotify">Spotify</option>
            </select>
          )}

          <select
            className="rp-toolbar__select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Campaign Performance">Campaign Performance</option>
            <option value="Platform Performance">Platform Performance</option>
            <option value="Content Performance">Content Performance</option>
          </select>

          {!readOnly && (
            <button className="rp-toolbar__create-btn" onClick={handleGenerate}>
              <MdAdd /> Generate Report
            </button>
          )}
        </div>
      </div>

      {/* Reports Lists */}
      {filteredReports.length === 0 ? (
        <div className="rp-empty">
          <EmptyState
            illustration={<MdDescription />}
            title="No reports generated"
            description="Generate a new performance brief or check your workspace details filters."
          />
        </div>
      ) : (
        <div className="rp-grid">
          {filteredReports.map((report) => (
            <div key={report.id} className="rp-card">
              <div className="rp-card__icon-wrap">
                <MdDescription />
              </div>
              <div className="rp-card__body">
                <h4 className="rp-card__title">{report.title}</h4>
                <div className="rp-card__meta">
                  <span className="rp-card__tag">{report.type}</span>
                  <span className="rp-card__date">
                    <MdDateRange style={{ marginRight: '4px' }} /> {report.period}
                  </span>
                </div>
                <span className="rp-card__generated">
                  Generated: {new Date(report.generatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="rp-card__actions">
                <button
                  className="rp-btn rp-btn--view"
                  onClick={() => setActiveReportId(report.id)}
                  title="View Report Details"
                >
                  <MdVisibility /> View
                </button>
                <button
                  className="rp-btn rp-btn--download"
                  onClick={handleDownload}
                  title="Download PDF brief"
                >
                  <MdFileDownload />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Report Details Overlay Modal */}
      {activeReportId && activeReport && mockMetricsSummary && (
        <div className="rp-overlay">
          <div className="rp-modal">
            <div className="rp-modal__header">
              <span className="rp-modal__header-tag">REPORT SUMMARY</span>
              <button className="rp-modal__close" onClick={() => setActiveReportId(null)} aria-label="Close Report">
                <MdClose />
              </button>
            </div>

            <div className="rp-modal__body">
              {/* Cover Banner */}
              <div className="rp-modal__cover">
                <h3 className="rp-modal__cover-title">{activeReport.title}</h3>
                <p className="rp-modal__cover-meta">
                  For Workspace: <strong>{activeReport.clientId ? activeReport.clientId.toUpperCase() : 'Creator'}</strong> | 
                  Period: <strong>{activeReport.period}</strong>
                </p>
              </div>

              {/* Performance Metrics Cards */}
              <div className="rp-metrics-row">
                <div className="rp-metric-box">
                  <span className="rp-metric-box__val">{mockMetricsSummary.reach}</span>
                  <span className="rp-metric-box__lbl">Audience Reach</span>
                </div>
                <div className="rp-metric-box">
                  <span className="rp-metric-box__val">{mockMetricsSummary.engagement}</span>
                  <span className="rp-metric-box__lbl">Engagements</span>
                </div>
                <div className="rp-metric-box">
                  <span className="rp-metric-box__val">{mockMetricsSummary.rate}</span>
                  <span className="rp-metric-box__lbl">Engagement Rate</span>
                </div>
                <div className="rp-metric-box">
                  <span className="rp-metric-box__val">{mockMetricsSummary.posts}</span>
                  <span className="rp-metric-box__lbl">Posts Published</span>
                </div>
              </div>

              {/* Printable Insights section */}
              <div className="rp-insights">
                <h4 className="rp-insights__title">Key Insights & Takeaways</h4>
                <ul className="rp-insights__list">
                  <li>
                    The primary channels channel driver was <strong>{mockMetricsSummary.topPlatform}</strong>, delivering 45% of total reach metrics.
                  </li>
                  <li>
                    Content scheduled on <strong>{mockMetricsSummary.bestDay}s</strong> returned a 15% boost in likes and shares.
                  </li>
                  <li>
                    Publishing frequency remained consistent throughout {activeReport.period}.
                  </li>
                </ul>
              </div>

              {/* Printable footer disclaimer */}
              <div className="rp-modal__disclaimer">
                <span>SocialPilot Reporting Engine. Generated on {new Date(activeReport.generatedAt).toLocaleString()}.</span>
              </div>
            </div>

            <div className="rp-modal__footer">
              <button className="rp-modal-btn rp-modal-btn--secondary" onClick={handleDownloadExcel}>
                <MdPrint /> Download Excel
              </button>
              <button className="rp-modal-btn rp-modal-btn--secondary" onClick={() => alert('Emailing report briefs...')}>
                <MdMailOutline /> Share Report
              </button>
              <button className="rp-modal-btn rp-modal-btn--submit" onClick={handleDownload}>
                <MdFileDownload /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
