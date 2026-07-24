/**
 * PostComposer.jsx
 *
 * Reusable Post Creation and Editing Modal/Drawer workspace.
 * Features media uploading previews, platform selectors, schedule datepicker,
 * optional campaign dropdown, and real-time social platform tabs preview.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdCloudUpload, MdClose } from 'react-icons/md';
import Avatar from '../../components/Avatar/Avatar';
import { campaignRepository } from '../Campaigns/campaignRepository';
import { contentRepository } from './contentRepository';
import * as teamService from '../../../../services/teamService';
import './PostComposer.css';

const PLATFORM_OPTIONS = [
  { id: 'facebook', label: 'Facebook', connected: true },
  { id: 'instagram', label: 'Instagram', connected: true },
  { id: 'linkedin', label: 'LinkedIn', connected: true },
  { id: 'youtube', label: 'YouTube', connected: true },
  { id: 'x', label: 'X (Twitter)', connected: false },
  { id: 'pinterest', label: 'Pinterest', connected: false },
];

export default function PostComposer({
  postId,
  clientId,
  ownerId,
  ownerType = 'marketing',
  onClose,
  onSave,
}) {
  const navigate = useNavigate();
  const isEdit = !!postId;

  const [clientOptions, setClientOptions] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [recurrenceInterval, setRecurrenceInterval] = useState('');

  const [scheduleMode, setScheduleMode] = useState('schedule');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState('facebook');

  const isSubmitDisabled = ownerType === 'marketing' && !clientId && clientOptions.length === 0;

  // Fetch client list
  useEffect(() => {
    teamService.getClients()
      .then((clients) => {
        setClientOptions(clients.map(c => ({ id: c.id, name: c.organization || c.name })));
      })
      .catch((err) => console.error('Failed to load clients:', err));
  }, []);

  // Fetch campaigns
  useEffect(() => {
    campaignRepository.getCampaigns()
      .then(setCampaignsList)
      .catch((err) => console.error('Failed to load campaigns:', err));
  }, []);

  // Load existing post details if editing
  useEffect(() => {
    if (isEdit) {
      contentRepository.getPostById(postId)
        .then((data) => {
          if (data) {
            setSelectedClientId(data.clientId || data.client_id || '');
            setCaption(data.caption || '');
            
            // Map mediaUrls to expected frontend format
            const files = (data.mediaUrls || data.media_urls || []).map((url, i) => {
              const name = url.split('/').pop();
              const isVid = name.endsWith('.mp4') || name.endsWith('.webm');
              return {
                id: `media-url-${i}`,
                type: isVid ? 'video' : 'image',
                name: name,
                previewUrl: url,
                size: 0
              };
            });
            setMediaFiles(files);
            setSelectedPlatforms(data.platforms || []);
            setSelectedCampaignId(data.campaignId || data.campaign_id || '');
            setRecurrenceInterval(data.recurrenceInterval || data.recurrence_interval || '');

            if (data.status === 'draft') {
              setScheduleMode('schedule');
            } else if (data.scheduledFor || data.scheduled_for) {
              setScheduleMode('schedule');
              const dt = new Date(data.scheduledFor || data.scheduled_for);
              setScheduleDate(dt.toISOString().split('T')[0]);
              const hh = String(dt.getHours()).padStart(2, '0');
              const mm = String(dt.getMinutes()).padStart(2, '0');
              setScheduleTime(`${hh}:${mm}`);
            } else {
              setScheduleMode('now');
            }

            if (data.platforms && data.platforms.length > 0) {
              setActivePreviewTab(data.platforms[0]);
            }
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [postId, isEdit]);

  const campaigns = useMemo(() => {
    const activeClientId = clientId || selectedClientId;
    if (ownerType === 'marketing') {
      return campaignsList.filter((c) => String(c.clientId) === String(activeClientId) || String(c.client_id) === String(activeClientId));
    }
    return campaignsList.filter((c) => c.ownerId === ownerId || c.owner_id === ownerId);
  }, [campaignsList, clientId, selectedClientId, ownerId, ownerType]);
  
  // Validation errors
  const [errors, setErrors] = useState({});

  // Clean up browser object URLs to prevent leaks
  useEffect(() => {
    return () => {
      mediaFiles.forEach((file) => {
        if (file.previewUrl && file.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [mediaFiles]);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    const newErrors = { ...errors };
    delete newErrors.media;

    const validatedFiles = [];
    files.forEach((file) => {
      // Validate types
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');

      if (!isImg && !isVid) {
        newErrors.media = 'Only images and videos are supported.';
        return;
      }

      // Max size limit: 15MB
      if (file.size > 15 * 1024 * 1024) {
        newErrors.media = 'Files must be smaller than 15MB.';
        return;
      }

      validatedFiles.push({
        id: `media-${Math.random().toString(36).substring(2, 9)}`,
        type: isImg ? 'image' : 'video',
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        size: file.size,
        rawFile: file,
      });
    });

    setMediaFiles((prev) => [...prev, ...validatedFiles]);
    setErrors(newErrors);
  };

  const handleRemoveMedia = (mediaId) => {
    setMediaFiles((prev) => {
      const target = prev.find((f) => f.id === mediaId);
      if (target && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== mediaId);
    });
  };

  const handlePlatformToggle = (platformId, connected) => {
    if (!connected) {
      alert(`${platformId.toUpperCase()} account is disconnected. Please connect the channel in social service profiles settings.`);
      return;
    }

    setSelectedPlatforms((prev) => {
      const active = prev.includes(platformId);
      const updated = active ? prev.filter((p) => p !== platformId) : [...prev, platformId];
      if (updated.length > 0) {
        setActivePreviewTab(updated[0]);
      }
      return updated;
    });

    if (errors.platforms) {
      setErrors((prev) => ({ ...prev, platforms: null }));
    }
  };

  const validate = (isDraftMode = false) => {
    const newErrors = {};

    if (ownerType === 'marketing' && !clientId && !selectedClientId) {
      newErrors.clientId = 'Selecting a business client is required.';
    }

    if (!isDraftMode) {
      if (!caption.trim() && mediaFiles.length === 0) {
        newErrors.caption = 'Provide either a text caption or upload a media item.';
      }
      if (selectedPlatforms.length === 0) {
        newErrors.platforms = 'Select at least one connected publishing platform.';
      }
      if (scheduleMode === 'schedule') {
        if (!scheduleDate || !scheduleTime) {
          newErrors.schedule = 'Enter a valid date and time for publication scheduling.';
        } else {
          const selectedDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
          if (selectedDateTime <= new Date()) {
            newErrors.schedule = 'Scheduled date/time must be in the future.';
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (isDraftMode = false) => {
    if (!validate(isDraftMode)) return;

    let scheduledAtVal = null;
    let finalStatus = 'draft';

    if (!isDraftMode) {
      if (scheduleMode === 'schedule') {
        scheduledAtVal = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        finalStatus = 'scheduled';
      } else {
        scheduledAtVal = new Date().toISOString();
        finalStatus = 'publishing'; // simulated queue status
      }
    }

    const payload = {
      ownerType,
      ownerId,
      clientId: clientId || selectedClientId || null,
      caption,
      media: mediaFiles,
      platforms: selectedPlatforms,
      campaignId: selectedCampaignId || null,
      recurrenceInterval: recurrenceInterval || null,
      status: finalStatus,
      scheduledAt: scheduledAtVal,
    };

    try {
      if (isEdit) {
        await contentRepository.updatePost(postId, payload);
      } else {
        await contentRepository.createPost(payload);
      }
      if (onSave) onSave();
    } catch (err) {
      console.error('Failed to save post:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to save post.');
    }
  };

  const handleCreateCampaignShortcut = () => {
    const activeClientId = clientId || selectedClientId;
    const targetUrl = ownerType === 'marketing'
      ? (activeClientId ? `/marketing/clients/${activeClientId}/campaigns` : '/marketing/campaigns')
      : '/creator/campaigns';
    navigate(targetUrl);
  };

  return (
    <div className="cs-composer">
      <div className="cs-composer__header">
        <h2 className="cs-composer__title">
          {isEdit ? 'Edit Post Composer' : 'Create New Post'}
        </h2>
        <button onClick={onClose} className="cs-composer__close-btn" aria-label="Close composer">
          <MdClose />
        </button>
      </div>

      <div className="cs-composer__body">
        {/* Left Column: Form Details */}
        <div className="cs-composer__form-col">
          
          {/* Step 0: Client Select (Global Marketing context) */}
          {!clientId && ownerType === 'marketing' && (
            <div className="cs-composer__section" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <h4 className="cs-composer__section-lbl" style={{ marginBottom: '8px' }}>Select Client *</h4>
              <select
                className={`cs-composer__input${errors.clientId ? ' cs-composer__input--error' : ''}`}
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  setSelectedCampaignId(''); // reset campaign to prevent cross-client assignments
                  if (errors.clientId) setErrors((prev) => ({ ...prev, clientId: null }));
                }}
                disabled={isEdit}
              >
                {clientOptions.length === 0 ? (
                  <option value="">No clients available</option>
                ) : (
                  <>
                    <option value="">Select a Client...</option>
                    {clientOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {!clientId && ownerType === 'marketing' && clientOptions.length === 0 && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '4px', fontWeight: 500 }}>
                  ⚠️ You must assign at least one client workspace to your team before creating content.
                </div>
              )}
              {errors.clientId && <span className="cs-composer__err-text">{errors.clientId}</span>}
            </div>
          )}

          {/* S1: Media Uploader */}
          <div className="cs-composer__section">
            <h4 className="cs-composer__section-lbl">Step 1 — Upload Media</h4>
            <div className="cs-uploader-box">
              <input
                type="file"
                id="cs-media-file"
                multiple
                accept="image/jpg,image/jpeg,image/png,image/webp,video/mp4,video/webm"
                onChange={handleMediaUpload}
                className="cs-uploader-input"
              />
              <label htmlFor="cs-media-file" className="cs-uploader-label">
                <MdCloudUpload size={28} />
                <span>Drag files or click to upload images/videos</span>
                <span className="cs-uploader-tip">Supported formats: JPG, PNG, WEBP, MP4 (Max 15MB)</span>
              </label>
            </div>
            {errors.media && <span className="cs-composer__err-text">{errors.media}</span>}

            {/* Media previews list */}
            {mediaFiles.length > 0 && (
              <div className="cs-media-previews">
                {mediaFiles.map((file) => (
                  <div key={file.id} className="cs-media-item">
                    {file.type === 'image' ? (
                      <img src={file.previewUrl} alt={file.name} className="cs-media-item__img" />
                    ) : (
                      <video src={file.previewUrl} className="cs-media-item__img" muted />
                    )}
                    <div className="cs-media-item__meta">
                      <span className="cs-media-item__name">{file.name}</span>
                      <span className="cs-media-item__size">{(file.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia(file.id)}
                      className="cs-media-item__remove"
                      title="Remove media file"
                    >
                      <MdClose />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* S2: Caption Editor */}
          <div className="cs-composer__section">
            <h4 className="cs-composer__section-lbl">Step 2 — Write Caption</h4>
            <textarea
              className={`cs-composer__textarea${errors.caption ? ' cs-composer__textarea--error' : ''}`}
              placeholder="Write your post caption, including hashtags and mentions..."
              value={caption}
              onChange={(e) => {
                setCaption(e.target.value);
                if (errors.caption) setErrors((prev) => ({ ...prev, caption: null }));
              }}
              rows={4}
            />
            <div className="cs-composer__char-counter">
              <span>{caption.length} characters</span>
            </div>
            {errors.caption && <span className="cs-composer__err-text">{errors.caption}</span>}
          </div>

          {/* S3: Platform Selectors */}
          <div className="cs-composer__section">
            <h4 className="cs-composer__section-lbl">Step 3 — Select Platforms</h4>
            <div className="cs-platforms-list">
              {PLATFORM_OPTIONS.map((plat) => {
                const active = selectedPlatforms.includes(plat.id);
                return (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => handlePlatformToggle(plat.id, plat.connected)}
                    className={`cs-platform-btn${active ? ' cs-platform-btn--active' : ''}${!plat.connected ? ' cs-platform-btn--disabled' : ''}`}
                  >
                    <span>{plat.label}</span>
                    {!plat.connected && <span className="cs-platform-btn__badge">Disconnect</span>}
                  </button>
                );
              })}
            </div>
            {errors.platforms && <span className="cs-composer__err-text">{errors.platforms}</span>}

            {/* Platform-specific warnings */}
            {selectedPlatforms.includes('x') && (
              <p className="cs-composer__guide-note">💡 <strong>X (Twitter):</strong> Keep copy concise under 280 characters recommended.</p>
            )}
            {selectedPlatforms.includes('youtube') && (
              <p className="cs-composer__guide-note">💡 <strong>YouTube:</strong> Video content is required for publishing.</p>
            )}
          </div>

          {/* S4: Scheduling Date and Time */}
          <div className="cs-composer__section">
            <h4 className="cs-composer__section-lbl">Step 4 — Schedule Date & Time</h4>
            <div className="cs-schedule-modes">
              <button
                type="button"
                onClick={() => setScheduleMode('now')}
                className={`cs-schedule-mode-btn${scheduleMode === 'now' ? ' cs-schedule-mode-btn--active' : ''}`}
              >
                Publish Now
              </button>
              <button
                type="button"
                onClick={() => setScheduleMode('schedule')}
                className={`cs-schedule-mode-btn${scheduleMode === 'schedule' ? ' cs-schedule-mode-btn--active' : ''}`}
              >
                Schedule for Later
              </button>
            </div>

            {scheduleMode === 'schedule' && (
              <div className="cs-datetime-pickers">
                <input
                  type="date"
                  className="cs-composer__input"
                  value={scheduleDate}
                  onChange={(e) => {
                    setScheduleDate(e.target.value);
                    if (errors.schedule) setErrors((prev) => ({ ...prev, schedule: null }));
                  }}
                />
                <input
                  type="time"
                  className="cs-composer__input"
                  value={scheduleTime}
                  onChange={(e) => {
                    setScheduleTime(e.target.value);
                    if (errors.schedule) setErrors((prev) => ({ ...prev, schedule: null }));
                  }}
                />
              </div>
            )}
            {errors.schedule && <span className="cs-composer__err-text">{errors.schedule}</span>}

            {scheduleMode === 'schedule' && scheduleDate && scheduleTime && (
              <span className="cs-schedule-preview">
                ⏰ Scheduled for: <strong>{scheduleDate}</strong> at <strong>{scheduleTime}</strong>
              </span>
            )}
          </div>

          {/* S5: Optional Recurrence */}
          {scheduleMode === 'schedule' && (
            <div className="cs-composer__section">
              <h4 className="cs-composer__section-lbl">Step 5 — Recurrence (Optional)</h4>
              <select
                className="cs-composer__input"
                value={recurrenceInterval}
                onChange={(e) => setRecurrenceInterval(e.target.value)}
              >
                <option value="">None (One-time)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          {/* S6: Optional Campaign drop-down */}
          <div className="cs-composer__section">
            <div className="cs-composer__campaign-title-row">
              <h4 className="cs-composer__section-lbl">Step 6 — Select Campaign (Optional)</h4>
              <button
                type="button"
                onClick={handleCreateCampaignShortcut}
                className="cs-composer__shortcut-btn"
              >
                + Create Campaign
              </button>
            </div>
            <select
              className="cs-composer__input"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
            >
              <option value="">No Campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Right Column: Dynamic Post Preview */}
        <div className="cs-composer__preview-col">
          <h4 className="cs-composer__section-lbl">Step 7 — Live Preview</h4>
          
          <div className="cs-preview-box">
            {/* Tabs for platform switching */}
            <div className="cs-preview-tabs">
              {selectedPlatforms.length === 0 ? (
                <span className="cs-preview-tabs__placeholder">Select platforms to preview feeds</span>
              ) : (
                selectedPlatforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setActivePreviewTab(p)}
                    className={`cs-preview-tab-btn${activePreviewTab === p ? ' cs-preview-tab-btn--active' : ''}`}
                  >
                    {p}
                  </button>
                ))
              )}
            </div>

            {/* Preview Frame mockup */}
            <div className="cs-preview-frame">
              <div className="cs-preview-frame__header">
                <Avatar
                  firstName={clientId ? clientId : 'Studio'}
                  lastName=""
                  size="sm"
                />
                <div>
                  <h5 className="cs-preview-frame__brand">{clientId ? clientId.toUpperCase() : 'Studio Creator'}</h5>
                  <span className="cs-preview-frame__meta">
                    {scheduleMode === 'now' ? 'Publishing Queue' : `Scheduled: ${scheduleDate || 'No date'} ${scheduleTime}`}
                  </span>
                </div>
              </div>

              <div className="cs-preview-frame__body">
                <p className="cs-preview-frame__caption">{caption || 'Post caption preview text content...'}</p>
                
                {mediaFiles.length > 0 ? (
                  <div className="cs-preview-frame__media-grid">
                    {mediaFiles.map((file) => (
                      <div key={file.id} className="cs-preview-frame__media-item">
                        {file.type === 'image' ? (
                          <img src={file.previewUrl} alt="Preview" />
                        ) : (
                          <video src={file.previewUrl} muted controls />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="cs-preview-frame__no-media">
                    <span>No media attached</span>
                  </div>
                )}
              </div>

              <div className="cs-preview-frame__footer">
                <span>Feed layout approximation</span>
                <span>• {activePreviewTab.toUpperCase()} Feed</span>
              </div>
            </div>

            {selectedCampaignId && (
              <span className="cs-preview-campaign-badge">
                🏷️ Campaign: <strong>{campaigns.find(c => c.id === selectedCampaignId)?.name || selectedCampaignId}</strong>
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Footer controls */}
      <div className="cs-composer__footer">
        <button
          type="button"
          onClick={onClose}
          className="cs-composer__btn cs-composer__btn--cancel"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          className="cs-composer__btn cs-composer__btn--draft"
          disabled={isSubmitDisabled}
          style={isSubmitDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave(false)}
          className="cs-composer__btn cs-composer__btn--submit"
          disabled={isSubmitDisabled}
          style={isSubmitDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          {scheduleMode === 'now' ? 'Add to Publishing Queue' : 'Schedule Post'}
        </button>
      </div>
    </div>
  );
}
