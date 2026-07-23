/**
 * CampaignList.jsx
 *
 * Campaign Index View. Shows list of campaigns, stats widgets, search/filters,
 * and button to create new campaigns (adapted by role permissions).
 */

import { useState, useMemo } from 'react';
import { MdSearch, MdFolder, MdCheckCircle, MdSchedule, MdTimeline, MdAdd } from 'react-icons/md';
import StatsCard from '../../components/StatsCard/StatsCard';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import EmptyState from '../../components/EmptyState/EmptyState';
import { campaignRepository } from './campaignRepository';
import CampaignCard from './CampaignCard';
import CampaignForm from './CampaignForm';
import './CampaignList.css';

export default function CampaignList({
  clientId,
  ownerId,
  clientName,
  readOnly,
  onOpenDetails,
}) {
  const [searchVal, setSearchVal] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState(null);

  // Reload campaigns list on save
  const [listRevision, setListRevision] = useState(0);

  const rawCampaigns = useMemo(() => {
    // Force refresh tracking
    listRevision; 
    const all = campaignRepository.getCampaigns();
    if (clientId) {
      return all.filter((c) => c.clientId === clientId);
    }
    if (ownerId) {
      return all.filter((c) => c.ownerId === ownerId);
    }
    return all;
  }, [clientId, ownerId, listRevision]);

  // KPI calculations
  const stats = useMemo(() => {
    const total = rawCampaigns.length;
    const active = rawCampaigns.filter((c) => c.status === 'active').length;
    const scheduled = rawCampaigns.filter((c) => c.status === 'scheduled').length;
    const completed = rawCampaigns.filter((c) => c.status === 'completed').length;

    return [
      { id: 'total', title: 'Total Campaigns', value: total.toString(), icon: <MdFolder />, trend: 'neutral' },
      { id: 'active', title: 'Active Campaigns', value: active.toString(), icon: <MdCheckCircle />, trend: 'up' },
      { id: 'scheduled', title: 'Scheduled Campaigns', value: scheduled.toString(), icon: <MdSchedule />, trend: 'neutral' },
      { id: 'completed', title: 'Completed Campaigns', value: completed.toString(), icon: <MdTimeline />, trend: 'up' },
    ];
  }, [rawCampaigns]);

  // Filtering
  const filteredCampaigns = useMemo(() => {
    return rawCampaigns.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(searchVal.toLowerCase()) ||
                            (c.description || '').toLowerCase().includes(searchVal.toLowerCase());
      const matchesStatus = filterStatus === 'All' || c.status === filterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [rawCampaigns, searchVal, filterStatus]);

  const handleEditCampaign = (campaignId) => {
    setEditCampaignId(campaignId);
    setShowFormModal(true);
  };

  const handleCreateCampaign = () => {
    setEditCampaignId(null);
    setShowFormModal(true);
  };

  const handleSaveForm = () => {
    setListRevision((prev) => prev + 1);
    setShowFormModal(false);
    setEditCampaignId(null);
  };

  return (
    <div className="cm-list-view">
      {/* Title */}
      <SectionTitle
        title="Campaign Management"
        description={
          clientName
            ? `Plan, organize and monitor campaigns for ${clientName}.`
            : 'Plan, organize and monitor campaigns across your media studio channels.'
        }
      />

      {/* Overview stats */}
      <div className="cm-stats-grid">
        {stats.map((s) => (
          <StatsCard key={s.id} {...s} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="cm-toolbar">
        <div className="cm-toolbar__search">
          <MdSearch className="cm-toolbar__search-icon" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="cm-toolbar__search-input"
          />
        </div>

        <div className="cm-toolbar__filters">
          <div className="cm-filter-buttons">
            {['All', 'Draft', 'Scheduled', 'Active', 'Paused', 'Completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`cm-filter-btn${filterStatus === status ? ' cm-filter-btn--active' : ''}`}
              >
                {status}
              </button>
            ))}
          </div>

          {!readOnly && (
            <button className="cm-toolbar__create-btn" onClick={handleCreateCampaign}>
              <MdAdd /> Create Campaign
            </button>
          )}
        </div>
      </div>

      {/* Campaigns list display */}
      {filteredCampaigns.length === 0 ? (
        <div className="cm-empty-wrap">
          <EmptyState
            illustration={<MdFolder />}
            title={searchVal ? 'No search matches' : 'No campaigns yet'}
            description={
              searchVal
                ? 'Try editing your keyword parameters to find matched campaigns.'
                : readOnly
                ? 'There are no campaigns managed by your marketing team currently.'
                : 'Create your first campaign to organize scheduled posts, timelines, and goal progress tracking.'
            }
            actionLabel={readOnly || searchVal ? null : 'Create Campaign'}
            onAction={readOnly || searchVal ? null : handleCreateCampaign}
          />
        </div>
      ) : (
        <div className="cm-grid">
          {filteredCampaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onOpen={onOpenDetails}
              onEdit={handleEditCampaign}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      {/* Form Drawer/Modal Dialog */}
      {showFormModal && (
        <div className="cm-modal-overlay">
          <div className="cm-modal">
            <CampaignForm
              campaignId={editCampaignId}
              clientId={clientId}
              ownerId={ownerId}
              onSave={handleSaveForm}
              onCancel={() => setShowFormModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
