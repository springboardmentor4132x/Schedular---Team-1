import { useEffect, useState } from 'react';
import { MdAdd, MdCalendarToday, MdDeleteOutline, MdSchedule } from 'react-icons/md';
import { cancelPost, createPost, listPosts, removePost, schedulePost, uploadMedia } from '../../services/contentService';
import { useApp } from '../../context/AppContext';
import { listClientWorkspaces } from '../../services/teamService';
import './ContentPage.css';

const TYPES = ['text', 'image', 'video', 'carousel', 'story', 'reel'];
const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'x', 'youtube', 'pinterest'];

export default function ContentPage() {
  const { user } = useApp();
  const canManage = ['Administrator', 'Marketing Team', 'Content Creator'].includes(user?.role);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [when, setWhen] = useState({});
  const [form, setForm] = useState({ caption: '', content_type: 'text', platforms: [], media_urls: [] });
  const [clients, setClients] = useState([]);

  const load = async () => {
    try { setLoading(true); setPosts((await listPosts()).items); }
    catch { setError('Could not load content. Please try again.'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); if (user?.role === 'Marketing Team') listClientWorkspaces().then(setClients).catch(() => setClients([])); }, [user?.role]);

  const togglePlatform = (platform) => setForm((current) => ({
    ...current,
    platforms: current.platforms.includes(platform)
      ? current.platforms.filter((item) => item !== platform)
      : [...current.platforms, platform],
  }));

  const addMedia = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const asset = await uploadMedia(file);
      setForm((current) => ({ ...current, media_urls: [...current.media_urls, asset.url] }));
    } catch (err) { setError(err.response?.data?.detail || 'Could not upload media.'); }
    finally { setUploading(false); event.target.value = ''; }
  };

  const saveDraft = async (event) => {
    event.preventDefault();
    try { await createPost({ ...form, client_id: form.client_id ? Number(form.client_id) : null }); setForm({ caption: '', content_type: 'text', platforms: [], media_urls: [] }); await load(); }
    catch (err) { setError(err.response?.data?.detail || 'Could not save draft.'); }
  };

  const schedule = async (id) => {
    const value = when[id];
    if (!value) { setError('Choose a future date and time first.'); return; }
    try { await schedulePost(id, { scheduled_for: new Date(value).toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }); await load(); }
    catch (err) { setError(err.response?.data?.detail || 'Could not schedule post.'); }
  };

  const cancelSchedule = async (id) => {
    try { await cancelPost(id); await load(); }
    catch (err) { setError(err.response?.data?.detail || 'Could not cancel the schedule.'); }
  };

  return <div className="sp-content">
    <header className="sp-content__header"><div><h1>Content Scheduler</h1><p>Create drafts, preview content, and manage your publishing queue.</p></div><span className="sp-content__count">{posts.filter((post) => post.status === 'scheduled').length} scheduled{user?.role === 'Marketing Team' && ` · ${clients.length} clients`}</span></header>
    {error && <div className="sp-content__error">{error}</div>}
    {canManage && <form className="sp-content__composer" onSubmit={saveDraft}>
      <div className="sp-content__composer-title"><MdAdd /> Create post</div>
      <textarea value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} placeholder="What would you like to share?" maxLength="5000" />
      <div className="sp-content__media"><label>Media <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={addMedia} disabled={uploading} /></label>{uploading && <small>Uploading media…</small>}{form.media_urls.map((url) => <span key={url}>{url.split('/').pop()} <button type="button" onClick={() => setForm((current) => ({ ...current, media_urls: current.media_urls.filter((item) => item !== url) }))}>Remove</button></span>)}</div>
      <div className="sp-content__controls"><select value={form.content_type} onChange={(event) => setForm({ ...form, content_type: event.target.value })}>{TYPES.map((type) => <option key={type}>{type}</option>)}</select><div className="sp-content__platforms">{PLATFORMS.map((platform) => <label key={platform}><input type="checkbox" checked={form.platforms.includes(platform)} onChange={() => togglePlatform(platform)} /> {platform}</label>)}</div><button disabled={uploading}>Save draft</button></div>
    </form>}
    <section className="sp-content__section"><h2><MdCalendarToday /> Publishing calendar & queue</h2>
      {loading ? <p>Loading content…</p> : posts.length === 0 ? <div className="sp-content__empty">No content yet. Create a draft to begin planning your calendar.</div> : <div className="sp-content__grid">{posts.map((post) => <article className="sp-post-card" key={post.id}>
        <div className="sp-post-card__top"><span className={`sp-post-card__status sp-post-card__status--${post.status}`}>{post.status}</span><span>{post.contentType}</span></div>
        {post.mediaUrls[0] && (post.contentType === 'video' ? <video controls src={`http://localhost:8000${post.mediaUrls[0]}`} /> : <img src={`http://localhost:8000${post.mediaUrls[0]}`} alt="Post media" />)}
        <p>{post.caption || 'Untitled post'}</p><small>{post.platforms.join(' · ') || 'No platforms selected'}</small>
        {post.status === 'draft' && canManage && <div className="sp-post-card__schedule"><input type="datetime-local" value={when[post.id] || ''} onChange={(event) => setWhen({ ...when, [post.id]: event.target.value })} /><button type="button" onClick={() => schedule(post.id)}><MdSchedule /> Schedule</button></div>}
        {post.status === 'scheduled' && <><small>Scheduled {new Date(post.scheduledFor).toLocaleString()}</small>{canManage && <button type="button" className="sp-post-card__delete" onClick={() => cancelSchedule(post.id)}>Cancel schedule</button>}</>}
        {canManage && <button className="sp-post-card__delete" type="button" onClick={async () => { await removePost(post.id); await load(); }}><MdDeleteOutline /> Delete</button>}
      </article>)}</div>}
    </section>
  </div>;
}
