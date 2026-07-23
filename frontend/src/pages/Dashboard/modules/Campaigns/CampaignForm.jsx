/**
 * CampaignForm.jsx
 *
 * Reusable Campaign creation and editing form.
 * Handles validation and interacts with campaignRepository.
 */

import { useState } from 'react';
import { campaignRepository } from './campaignRepository';
import './CampaignForm.css';

const PLATFORM_OPTIONS = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'x', label: 'X (Twitter)' },
  { id: 'pinterest', label: 'Pinterest' },
];

const GOAL_OPTIONS = [
  'Brand Awareness',
  'Engagement',
  'Website Traffic',
  'Lead Generation',
  'Product Promotion',
  'Community Growth',
];

const STATUS_OPTIONS = [
  { id: 'draft', label: 'Draft' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'active', label: 'Active' },
  { id: 'paused', label: 'Paused' },
  { id: 'completed', label: 'Completed' },
];

const CLIENT_OPTIONS = [
  { id: 'nike', name: 'Nike' },
  { id: 'puma', name: 'Puma' },
  { id: 'tesla', name: 'Tesla' },
  { id: 'spotify', name: 'Spotify' },
];

export default function CampaignForm({ campaignId, clientId, ownerId, onSave, onCancel }) {
  const isEdit = !!campaignId;
  const [formData, setFormData] = useState(() => {
    if (campaignId) {
      const existing = campaignRepository.getCampaign(campaignId);
      if (existing) {
        return {
          name: existing.name,
          description: existing.description,
          startDate: existing.startDate,
          endDate: existing.endDate,
          platforms: existing.platforms,
          goals: existing.goals,
          status: existing.status,
          clientId: existing.clientId || '',
        };
      }
    }
    return {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      platforms: [],
      goals: [],
      status: 'draft',
      clientId: clientId || '',
    };
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Campaign Name is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        newErrors.endDate = 'End date cannot be before start date';
      }
    }

    if (formData.platforms.length === 0) {
      newErrors.platforms = 'Select at least one social media platform';
    }

    if (!clientId && !ownerId && !formData.clientId) {
      newErrors.clientId = 'Selecting a client is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handlePlatformToggle = (platformId) => {
    setFormData((prev) => {
      const active = prev.platforms.includes(platformId);
      const updated = active
        ? prev.platforms.filter((p) => p !== platformId)
        : [...prev.platforms, platformId];
      return { ...prev, platforms: updated };
    });
    if (errors.platforms) {
      setErrors((prev) => ({ ...prev, platforms: null }));
    }
  };

  const handleGoalToggle = (goal) => {
    setFormData((prev) => {
      const active = prev.goals.includes(goal);
      const updated = active
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal];
      return { ...prev, goals: updated };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const finalData = {
      ...formData,
      clientId: clientId || formData.clientId || null,
      ownerId: ownerId || null,
    };

    if (isEdit) {
      campaignRepository.updateCampaign(campaignId, finalData);
    } else {
      campaignRepository.createCampaign(finalData);
    }

    if (onSave) {
      onSave();
    }
  };

  return (
    <form className="cm-form" onSubmit={handleSubmit}>
      <h3 className="cm-form__title">
        {isEdit ? 'Edit Campaign Details' : 'Create New Campaign'}
      </h3>

      {!clientId && !ownerId && (
        <div className="cm-form__field">
          <label className="cm-form__label" htmlFor="clientId">
            Client *
          </label>
          <select
            id="clientId"
            name="clientId"
            className={`cm-form__input${errors.clientId ? ' cm-form__input--error' : ''}`}
            value={formData.clientId}
            onChange={handleTextChange}
            disabled={isEdit}
          >
            <option value="">Select a Client...</option>
            {CLIENT_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.clientId && <span className="cm-form__error-text">{errors.clientId}</span>}
        </div>
      )}

      <div className="cm-form__field">
        <label className="cm-form__label" htmlFor="name">
          Campaign Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className={`cm-form__input${errors.name ? ' cm-form__input--error' : ''}`}
          placeholder="e.g. Nike Summer Sale"
          value={formData.name}
          onChange={handleTextChange}
        />
        {errors.name && <span className="cm-form__error-text">{errors.name}</span>}
      </div>

      <div className="cm-form__field">
        <label className="cm-form__label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="cm-form__input cm-form__textarea"
          placeholder="Describe campaign target objectives, guidelines, themes..."
          value={formData.description}
          onChange={handleTextChange}
        />
      </div>

      <div className="cm-form__row-2col">
        <div className="cm-form__field">
          <label className="cm-form__label" htmlFor="startDate">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            className={`cm-form__input${errors.startDate ? ' cm-form__input--error' : ''}`}
            value={formData.startDate}
            onChange={handleTextChange}
          />
          {errors.startDate && <span className="cm-form__error-text">{errors.startDate}</span>}
        </div>

        <div className="cm-form__field">
          <label className="cm-form__label" htmlFor="endDate">
            End Date *
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            className={`cm-form__input${errors.endDate ? ' cm-form__input--error' : ''}`}
            value={formData.endDate}
            onChange={handleTextChange}
          />
          {errors.endDate && <span className="cm-form__error-text">{errors.endDate}</span>}
        </div>
      </div>

      <div className="cm-form__field">
        <label className="cm-form__label">Platforms *</label>
        <div className="cm-form__platforms-row">
          {PLATFORM_OPTIONS.map((opt) => {
            const active = formData.platforms.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                className={`cm-form__platform-chip${active ? ' cm-form__platform-chip--active' : ''}`}
                onClick={() => handlePlatformToggle(opt.id)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        {errors.platforms && <span className="cm-form__error-text">{errors.platforms}</span>}
      </div>

      <div className="cm-form__field">
        <label className="cm-form__label">Goals</label>
        <div className="cm-form__goals-grid">
          {GOAL_OPTIONS.map((goal) => {
            const active = formData.goals.includes(goal);
            return (
              <label key={goal} className="cm-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handleGoalToggle(goal)}
                  className="cm-form__checkbox"
                />
                <span>{goal}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="cm-form__field">
        <label className="cm-form__label" htmlFor="status">
          Status
        </label>
        <select
          id="status"
          name="status"
          className="cm-form__input"
          value={formData.status}
          onChange={handleTextChange}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="cm-form__actions">
        <button type="button" className="cm-form__btn cm-form__btn--cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="cm-form__btn cm-form__btn--submit">
          Save Campaign
        </button>
      </div>
    </form>
  );
}
