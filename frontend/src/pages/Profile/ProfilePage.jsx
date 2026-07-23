/**
 * ProfilePage.jsx  — /profile
 *
 * Sections: Profile Photo · Personal Info · Professional Info · Preferences
 * Validation: React Hook Form + Zod
 * Warns about unsaved changes before navigating away.
 */

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MdCameraAlt, MdDeleteOutline } from 'react-icons/md';
import { getProfile, updateProfile, uploadAvatar, removeAvatar }
  from '../../services/profileService';
import { useApp } from '../../context/AppContext';
import './ProfilePage.css';

const schema = z.object({
  firstName:    z.string().min(1, 'First name is required'),
  lastName:     z.string().min(1, 'Last name is required'),
  email:        z.string().email('Invalid email address'),
  phone:        z.string().optional(),
  country:      z.string().optional(),
  timezone:     z.string().optional(),
  organization: z.string().optional(),
  role:         z.string().optional(),
  bio:          z.string().max(300, 'Bio must be 300 characters or fewer').optional(),
  language:     z.string().optional(),
});

const TIMEZONES = [
  'Asia/Kolkata', 'America/New_York', 'America/Chicago',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
  'Asia/Tokyo', 'Australia/Sydney', 'UTC',
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi'   },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French'  },
];

export default function ProfilePage() {
  const { user, setUser } = useApp();
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // 'saving' | 'saved' | 'error' | ''
  const [loadError, setLoadError] = useState('');
  const fileRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      country: '', timezone: '', organization: '', role: '',
      bio: '', language: 'en',
    },
  });

  useEffect(() => {
    getProfile().then((data) => {
      reset({ ...data, bio: data.bio ?? '', language: data.language ?? 'en' });
      setAvatarUrl(data.avatarUrl ?? null);
    }).catch(() => setLoadError('Failed to load profile.'));
  }, [reset]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const onSubmit = async (values) => {
    setSaveStatus('saving');
    try {
      await updateProfile(values);
      // Sync changes to active User session storage and context state
      const updatedUser = {
        ...user,
        fullName: `${values.firstName} ${values.lastName}`.trim(),
        email: values.email,
        phone: values.phone,
        country: values.country,
        orgName: values.organization,
      };

      const isLocal = !!localStorage.getItem('socialpilot_current_user');
      const key = 'socialpilot_current_user';
      if (isLocal) {
        localStorage.setItem(key, JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem(key, JSON.stringify(updatedUser));
      }
      setUser(updatedUser);

      setSaveStatus('saved');
      reset(values); // clear dirty state
      setTimeout(() => setSaveStatus(''), 2500);
    } catch {
      setSaveStatus('error');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadAvatar(file);
    if (result?.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
      const updatedUser = {
        ...user,
        profileImage: result.avatarUrl,
      };
      const isLocal = !!localStorage.getItem('socialpilot_current_user');
      const key = 'socialpilot_current_user';
      if (isLocal) {
        localStorage.setItem(key, JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem(key, JSON.stringify(updatedUser));
      }
      setUser(updatedUser);
    }
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    await removeAvatar();
    setAvatarUrl(null);
    const updatedUser = {
      ...user,
      profileImage: null,
    };
    const isLocal = !!localStorage.getItem('socialpilot_current_user');
    const key = 'socialpilot_current_user';
    if (isLocal) {
      localStorage.setItem(key, JSON.stringify(updatedUser));
    } else {
      sessionStorage.setItem(key, JSON.stringify(updatedUser));
    }
    setUser(updatedUser);
  };

  return (
    <div className="sp-profile">
      <header className="sp-profile__head">
        <h1 className="sp-profile__heading">Manage Profile</h1>
        <p className="sp-profile__sub">Update your personal and professional information.</p>
      </header>

      {loadError && <div className="sp-profile-alert sp-profile-alert--error">{loadError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>

        {/* ── Photo ───────────────────────────────────────────── */}
        <section className="sp-profile-section">
          <h2 className="sp-profile-section__title">Profile Photo</h2>
          <div className="sp-profile-photo">
            <div className="sp-profile-photo__avatar">
              {avatarUrl
                ? <img src={avatarUrl} alt="Profile" className="sp-profile-photo__img" />
                : <span className="sp-profile-photo__initial">
                    {/* initial shown from form value */}
                  </span>
              }
            </div>
            <div className="sp-profile-photo__actions">
              <button type="button" className="sp-profile-btn sp-profile-btn--outline"
                onClick={() => fileRef.current?.click()}>
                <MdCameraAlt /> Upload Image
              </button>
              {avatarUrl && (
                <button type="button" className="sp-profile-btn sp-profile-btn--danger"
                  onClick={handleRemoveAvatar}>
                  <MdDeleteOutline /> Remove Image
                </button>
              )}
              <p className="sp-profile-photo__hint">JPG, PNG or WebP · max 4 MB</p>
            </div>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: 'none' }} onChange={handleAvatarChange}
            />
          </div>
        </section>

        {/* ── Personal Info ────────────────────────────────────── */}
        <section className="sp-profile-section">
          <h2 className="sp-profile-section__title">Personal Information</h2>
          <div className="sp-profile-grid">
            <div className="sp-profile-field">
              <label className="sp-profile-label">First Name <span>*</span></label>
              <input className={`sp-profile-input ${errors.firstName ? 'sp-input-error' : ''}`}
                {...register('firstName')} placeholder="John" />
              {errors.firstName && <p className="sp-field-error">{errors.firstName.message}</p>}
            </div>
            <div className="sp-profile-field">
              <label className="sp-profile-label">Last Name <span>*</span></label>
              <input className={`sp-profile-input ${errors.lastName ? 'sp-input-error' : ''}`}
                {...register('lastName')} placeholder="Doe" />
              {errors.lastName && <p className="sp-field-error">{errors.lastName.message}</p>}
            </div>
            <div className="sp-profile-field">
              <label className="sp-profile-label">Email <span>*</span></label>
              <input type="email" className={`sp-profile-input ${errors.email ? 'sp-input-error' : ''}`}
                {...register('email')} placeholder="john@example.com" />
              {errors.email && <p className="sp-field-error">{errors.email.message}</p>}
            </div>
            <div className="sp-profile-field">
              <label className="sp-profile-label">Phone</label>
              <input className="sp-profile-input" {...register('phone')} placeholder="+91 98765 43210" />
            </div>
            <div className="sp-profile-field">
              <label className="sp-profile-label">Country</label>
              <select className="sp-profile-select" {...register('country')}>
                <option value="">Select country</option>
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </select>
            </div>
            <div className="sp-profile-field">
              <label className="sp-profile-label">Timezone</label>
              <select className="sp-profile-select" {...register('timezone')}>
                <option value="">Select timezone</option>
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Professional Info ────────────────────────────────── */}
        <section className="sp-profile-section">
          <h2 className="sp-profile-section__title">Professional Information</h2>
          <div className="sp-profile-grid">
            <div className="sp-profile-field">
              <label className="sp-profile-label">Organisation</label>
              <input className="sp-profile-input" {...register('organization')} placeholder="Acme Inc." />
            </div>
            <div className="sp-profile-field">
              <label className="sp-profile-label">Role</label>
              <select className="sp-profile-select" {...register('role')}>
                <option value="">Select role</option>
                <option value="content_creator">Content Creator</option>
                <option value="marketing_team">Marketing Team</option>
                <option value="business_user">Business User</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
            <div className="sp-profile-field sp-profile-field--full">
              <label className="sp-profile-label">Bio</label>
              <textarea className={`sp-profile-textarea ${errors.bio ? 'sp-input-error' : ''}`}
                {...register('bio')} rows={3} placeholder="Tell us a little about yourself…" />
              {errors.bio && <p className="sp-field-error">{errors.bio.message}</p>}
            </div>
          </div>
        </section>

        {/* ── Preferences ──────────────────────────────────────── */}
        <section className="sp-profile-section">
          <h2 className="sp-profile-section__title">Preferences</h2>
          <div className="sp-profile-grid">
            <div className="sp-profile-field">
              <label className="sp-profile-label">Language</label>
              <select className="sp-profile-select" {...register('language')}>
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="sp-profile-actions">
          <button type="button" className="sp-profile-btn sp-profile-btn--ghost"
            onClick={() => reset()} disabled={!isDirty}>
            Reset Changes
          </button>
          <button type="submit" className="sp-profile-btn sp-profile-btn--primary"
            disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {saveStatus === 'saved' && (
          <p className="sp-profile-success">✓ Profile saved successfully.</p>
        )}
        {saveStatus === 'error' && (
          <p className="sp-profile-error">Failed to save. Please try again.</p>
        )}
      </form>
    </div>
  );
}
