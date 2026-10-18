import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { LayoutGrid, Folder, Users, ClipboardList, Shield, KeyRound, Settings, Plus, ChevronDown, Check, AlertTriangle, Info, Wallet, CreditCard, FileText, CalendarDays, CheckCircle2 } from 'lucide-react';
import './style.css';
import { computeDmsView, dateLabel } from './dmsLogic.mjs';
const initial = [{ id: 'b', name: 'Tran Thi B', relationship: 'Spouse', email: 'tranthib@email.com', role: 'Beneficiary', status: 'Verified' }, { id: 'd', name: 'Le Van D', relationship: 'Attorney', email: 'levand@email.com', role: 'Executor', status: 'Verified' }, { id: 'c', name: 'Nguyen Van C', relationship: 'Friend', email: 'nguyenc@email.com', role: 'Beneficiary', status: 'Pending' }, { id: 'e', name: 'Pham Minh E', relationship: 'Child', email: 'phame@email.com', role: 'Beneficiary', status: 'Pending' }];
const assets = [{ id: 'metamask', name: 'MetaMask Wallet (ETH)', desc: 'Crypto Wallet · MetaMask Primary', Icon: Wallet }, { id: 'bank', name: 'Vietcombank Account', desc: 'Bank Account · Checking', Icon: CreditCard }, { id: 'drive', name: 'Google Drive Backup', desc: 'Secure Cloud Storage · Documents', Icon: FileText }];
const menus = [['Dashboard', LayoutGrid], ['My Assets', Folder], ["Dead Man’s Switch", Shield], ['Access Requests', KeyRound], ['Settings', Settings]];
const defaultText = ' ';
const fmt = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const initials = s => s.trim().split(/\s+/).slice(-2).map(w => w[0]).join('').toUpperCase();
function formatCountdown(ms) { const t = Math.max(0, Math.floor(ms / 1000)); const d = Math.floor(t / 86400), h = Math.floor(t % 86400 / 3600), m = Math.floor(t % 3600 / 60), sec = t % 60; return `${d} days ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` }
function App() {
  const [screen, setScreen] = useState('dms'), [empty, setEmpty] = useState(false), [contacts, setContacts] = useState(() => { try { return JSON.parse(localStorage.getItem('legacyvault-contacts')) || initial } catch { return initial } }), [modal, setModal] = useState(false), [form, setForm] = useState({ name: '', relationship: 'Spouse', email: '', role: 'Beneficiary' }), [search, setSearch] = useState(''), [step, setStep] = useState(1), [asset, setAsset] = useState('metamask'), [beneficiaries, setBeneficiaries] = useState(['b', 'c']), [executor, setExecutor] = useState('d'), [instructions, setInstructions] = useState(defaultText), [interval, setInterval] = useState(() => Number(localStorage.getItem('legacyvault-dms-interval')) || 90), [grace, setGrace] = useState(() => Number(localStorage.getItem('legacyvault-dms-grace')) || 14), [lastCheck, setLastCheck] = useState(() => localStorage.getItem('legacyvault-dms-lastcheck') || '2026-09-15T14:22:18Z'), [logs, setLogs] = useState([{ title: 'Owner Heartbeat Confirmed', via: 'Via Web App Login', date: 'Sep 15, 2026 - 14:22:18' }, { title: 'Manual Dashboard Check-in', via: 'Via Desktop Console', date: 'Jun 12, 2026 - 09:10:45' }, { title: 'Owner Heartbeat Confirmed', via: 'Via Mobile Token Authed', date: 'Mar 11, 2026 - 18:41:02' }]), [configured, setConfigured] = useState(() => localStorage.getItem('legacyvault-dms-configured') === 'true'), [clock, setClock] = useState(Date.now()), [remoteStatus, setRemoteStatus] = useState(null), [apiError, setApiError] = useState(''), [syncing, setSyncing] = useState(false), [notificationContact, setNotificationContact] = useState(null), [logsLoaded, setLogsLoaded] = useState(false);
  useEffect(() => localStorage.setItem('legacyvault-contacts', JSON.stringify(contacts)), [contacts]);
  useEffect(() => { const id = setInterval(() => setClock(Date.now()), 1000); return () => clearInterval(id) }, []);
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const request = async (path, options = {}) => {
    const token = localStorage.getItem('legacyvault-access-token');
    const response = await fetch(`${apiBase}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    if (!response.ok) { const error = new Error(`API request failed (${response.status})`); error.status = response.status; throw error }
    return response.json();
  };
  useEffect(() => {
    if (!apiBase) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await request('/dms/config');
        if (cancelled) return;
        setConfigured(true); setInterval(data.check_in_interval_days || 90); setGrace(data.grace_period_days || 14);
        if (data.notification_contact) setNotificationContact(data.notification_contact);
        setApiError('');
      } catch (error) { if (cancelled) return; if (error.status === 404) { setConfigured(false); setRemoteStatus(null); setApiError('') } else setApiError('Unable to load DMS configuration from Backend.') }
    })();
    return () => { cancelled = true };
  }, [apiBase]);
  useEffect(() => {
    if (!apiBase || !configured) return;
    let cancelled = false;
    const refresh = async () => {
      try {
        const data = await request('/dms/status');
        if (!cancelled) { setRemoteStatus(data); setApiError(''); }
      } catch (error) { if (!cancelled) { if (error.status === 404) { setConfigured(false); setRemoteStatus(null); setApiError('') } else { setApiError('Cannot verify the current DMS status from Backend. Please retry.'); setRemoteStatus(null) } } }
    };
    refresh(); const id = setInterval(refresh, 30000);
    return () => { cancelled = true; clearInterval(id) };
  }, [apiBase, configured]);
  useEffect(() => {
    if (!apiBase || !configured) return;
    let cancelled = false;
    setLogsLoaded(false);
    (async () => {
      try {
        const result = await request('/dms/checkin-logs?page=1&page_size=20');
        if (!cancelled) setLogs((result.data || []).map(item => ({
          title: item.event_label || item.event_type,
          via: item.channel_label || item.channel,
          date: dateLabel(item.occurred_at),
          status: item.status || 'verified',
        })));
      } catch { if (!cancelled) setLogs([]) } finally { if (!cancelled) setLogsLoaded(true) }
    })();
    return () => { cancelled = true };
  }, [apiBase, configured, remoteStatus?.last_check_in_at]);
  const selected = contacts.filter(c => beneficiaries.includes(c.id)); const executorData = contacts.find(c => c.id === executor); const activeAsset = assets.find(a => a.id === asset); const currentNav = screen === 'contacts' ? 'Contacts' : screen === 'assignments' ? 'Assignments' : screen === 'dms' ? "Dead Man’s Switch" : screen;
  const navigate = name => { if (name === 'Contacts') setScreen('contacts'); else if (name === 'Assignments') { setScreen('assignments'); setStep(1) } else if (name === "Dead Man’s Switch") setScreen('dms'); else setScreen(name) };
  const addContact = e => { e.preventDefault(); if (contacts.some(c => c.email.toLowerCase() === form.email.toLowerCase())) return alert('This email already exists in your Contact Book.'); setContacts(p => [...p, { ...form, id: crypto.randomUUID(), status: 'Pending' }]); setEmpty(false); setModal(false); setForm({ name: '', relationship: 'Spouse', email: '', role: 'Beneficiary' }) };
  const saveConfig = async () => {
    setSyncing(true); setApiError('');
    try {
      const data = apiBase ? await request('/dms/config', { method: 'PUT', body: JSON.stringify({ check_in_interval_days: interval, grace_period_days: grace }) }) : null;
      const now = new Date(); const updated = data?.last_check_in_at || now.toISOString();
      setLastCheck(updated); setClock(now.getTime()); setConfigured(true);
      localStorage.setItem('legacyvault-dms-lastcheck', updated);
      localStorage.setItem('legacyvault-dms-interval', String(interval)); localStorage.setItem('legacyvault-dms-grace', String(grace));
      localStorage.setItem('legacyvault-dms-configured', 'true');
      if (data) { setRemoteStatus(data); if (data.notification_contact) setNotificationContact(data.notification_contact) }
    } catch (error) { setApiError('Configuration was not saved by Backend: ' + error.message) }
    finally { setSyncing(false) }
  };
  const checkIn = async () => {
    if (dms === 'triggered') { setApiError('Handover already triggered. Check-in cannot reverse it.'); return }
    setSyncing(true); setApiError('');
    try {
      const data = apiBase ? await request('/dms/checkin', { method: 'POST', body: JSON.stringify({ channel: 'web_app' }) }) : null;
      const now = new Date(); const updated = data?.last_check_in_at || now.toISOString();
      setLastCheck(updated); localStorage.setItem('legacyvault-dms-lastcheck', updated);
      setClock(now.getTime()); setConfigured(true); localStorage.setItem('legacyvault-dms-configured', 'true');
      setLogs(old => [{ title: 'Manual Dashboard Check-in', via: 'Via Web App Login', date: now.toLocaleString('en-US') }, ...old]);
      if (data) setRemoteStatus(data);
    } catch (error) { setApiError(`Check-in was not confirmed by Backend (${error.status || 'network error'}). Timer unchanged.`) }
    finally { setSyncing(false) }
  };
  const due = remoteStatus?.next_check_in_at ? new Date(remoteStatus.next_check_in_at) : new Date(new Date(lastCheck).getTime() + interval * 86400000);
  const graceEnd = remoteStatus?.grace_period_ends_at ? new Date(remoteStatus.grace_period_ends_at) : new Date(due.getTime() + grace * 86400000);
  const elapsed = due.getTime() - clock; const graceRemaining = graceEnd.getTime() - clock;
  const dms = computeDmsView({ configured, now: clock, nextCheckIn: due, graceEndsAt: graceEnd, backendStatus: remoteStatus?.status, apiEnabled: !!apiBase, apiError });
  const dueText = dateLabel(due), lastText = dateLabel(lastCheck), graceText = dateLabel(graceEnd);
  const notificationText = notificationContact ? `${notificationContact.full_name} (Executor) — ${notificationContact.email}` : 'Executor contact will be loaded from Backend';
  const crumb = screen === 'contacts' ? 'Vault & Assets / Contacts' : screen === 'assignments' ? 'Vault & Assets / Collections / New Assignment' : screen === 'dms' ? `Security & Protection / ${dms === 'config' ? "Dead Man's Switch Configuration" : dms === 'active' ? 'Switch Monitoring Active' : dms === 'soon' ? 'Check-In Reminder' : dms === 'triggered' ? 'Handover Activated' : dms === 'error' ? 'Status Unavailable' : 'Urgent System Warning'}` : `LegacyVault / ${screen}`;
  const header = (title, sub, right = null) => <div className="page-head"><div><h1>{title}</h1><p>{sub}</p></div>{right}</div>;
  const pill = (label, tone = 'green') => <span className={'badge ' + tone}>{label}</span>;
  const addButton = <button className="btn primary" onClick={() => setModal(true)}><Plus size={15} /> Add New Contact</button>;
  const next = () => { if (step === 2 && (!beneficiaries.length || !executor)) return alert('Select a beneficiary and executor.'); if (step === 4) setStep(5); else setStep(s => s + 1) };
  return <div className="shell"><aside className="sidebar"><div className="brand"><span className="brand-icon"><Wallet size={17} /></span><b>LegacyVault</b></div><nav>{menus.map(([name, Icon]) => <button key={name} className={'nav-item ' + (currentNav === name ? 'active' : '')} onClick={() => navigate(name)}><Icon size={16} strokeWidth={1.9} /><span>{name}</span></button>)}</nav><div className="profile"><span className="profile-circle">TP</span><div><b>Thanh Pham</b><small>Vault owner</small></div></div></aside><div className="workarea"><header className="topbar"><span>{crumb}</span><div className="top-right">{pill(screen === 'dms' ? 'Secure Vault Mode' : 'Vault Owner')}<span className="top-avatar">TP</span></div></header><main className={'main ' + (screen === 'assignments' ? 'assignment-main' : '')}>
    {screen === 'dms' && <>{header(dms === 'config' ? "Dead Man's Switch" : dms === 'active' ? 'System Health Monitoring' : dms === 'soon' ? 'Check-in Due Soon' : dms === 'triggered' ? 'Handover Process Activated' : dms === 'error' ? 'Status Temporarily Unavailable' : 'Warning: Action Required', dms === 'config' ? 'Configure automated vault protection to safeguard digital heritage in case of emergency.' : dms === 'active' ? 'LegacyVault actively tracks secure heartbeats to maintain vault security.' : dms === 'soon' ? 'Your scheduled check-in window closes soon. Check in on time to keep your vault protected.' : dms === 'triggered' ? 'The check-in interval and grace period have expired. Legal verification is required before any asset release.' : dms === 'error' ? 'Backend status could not be verified. Do not rely on a locally calculated status.' : 'A scheduled heartbeat milestone was missed. Check in to prevent the handover process.', dms === 'config' ? null : pill(dms === 'active' ? '●  MONITORING ACTIVE' : dms === 'soon' ? '●  CHECK-IN DUE SOON' : dms === 'triggered' ? '●  HANDOVER TRIGGERED' : dms === 'error' ? '●  STATUS UNKNOWN' : '●  GRACE PERIOD', ['warning', 'triggered', 'error'].includes(dms) ? 'red' : dms === 'soon' ? 'amber' : 'green'))}
      {dms === 'error' ? <section className="panel dms-error"><AlertTriangle size={24} /><h2>Backend status unavailable</h2><p>{apiError}</p><p>Check your connection or Backend service. The system has not assumed the switch is safe or triggered.</p></section> : dms === 'config' ? <div className="dms-grid config-grid"><section className="panel config-card"><h3>Configure Automated Trigger</h3><label className="form-label">Check-in Interval</label><select value={interval} onChange={e => setInterval(Number(e.target.value))}><option value={30}>1 Month</option><option value={90}>3 Months (Default)</option><option value={180}>6 Months</option><option value={365}>12 Months</option></select><p>The maximum frequency you are required to sign in and confirm you are safe.</p><label className="form-label">Grace Period</label><select value={grace} onChange={e => setGrace(Number(e.target.value))}><option value={7}>7 Days</option><option value={14}>14 Days (Recommended)</option><option value={30}>30 Days</option></select><p>Extra time granted after a missed scheduled check-in before verification triggers.</p><label className="form-label">Notification Contact</label><div className="readonly">{notificationText}</div><p>We will quietly ping this contact for confirmation once the grace period begins.</p><div className="rule" /><button className="btn primary full" disabled={syncing} onClick={saveConfig}>{syncing ? 'Saving…' : 'Save Configuration'}</button></section><aside className="how-card"><h3><Shield size={22} /> How does it work?</h3><p>The Dead Man's Switch acts as a fail-safe digital insurance trigger.</p><p>1. If your account remains inactive longer than the configured Check-in Interval, the switch enters a pending state.</p><p>2. LegacyVault grants you the configured Grace Period while sending multiple secure alert checks.</p><p>3. If you do not check in during the Grace Period, the Backend may trigger a handover case for legal verification; assets remain locked.</p><p>4. Legal verifiers confirm official status, releasing designated files strictly to authorized beneficiaries.</p></aside></div> : dms === 'active' ? <><div className="dms-grid active-grid"><section className="panel timer-card"><div className="timer-label">NEXT CHECK-IN DUE IN</div><div className="timer-value">{formatCountdown(elapsed)}</div><div className="rule" /><button className="btn primary" disabled={syncing} onClick={checkIn}><CalendarDays size={16} /> {syncing ? "Checking in…" : "Check-in Now (Reset Timer)"}</button></section><section className="panel parameters"><h3>Active Parameters</h3><div><span>Check-in Interval</span><b>{interval === 90 ? '3 Months' : interval + ' Days'}</b></div><div><span>Grace Period</span><b>{grace} Days</b></div><div><span>Last Recorded Check-in</span><b>{lastText}</b></div></section></div><h3 className="audit-heading">Check-In Audit Log {apiBase ? "(Backend)" : "(Demo Records)"}</h3><div className="panel audit-table">{apiBase && !logsLoaded && <p className="audit-empty">Loading Backend audit logs…</p>}{apiBase && logsLoaded && logs.length === 0 && <p className="audit-empty">No check-in logs returned by Backend.</p>}{(!apiBase || logsLoaded) && logs.map((l, i) => <div className="audit-row" key={i}><div><b>{l.title}</b><small>{l.via}</small></div><span>{l.date}</span>{pill(l.status === 'verified' ? 'Verified' : l.status || 'Unknown')}</div>)}</div></> : dms === 'triggered' ? <section className="panel triggered-panel"><div className="trigger-icon"><AlertTriangle size={28} /></div><h2>Handover Process Activated</h2><p>The owner did not check in before the end of the grace period.</p><div className="trigger-detail"><b>Handover Case</b><span>{apiBase ? 'Backend reports TRIGGERED; case details are not returned by this API' : 'Not created (local simulation only)'}</span></div><div className="trigger-detail"><b>Executor Notification</b><span>Not confirmed by the Flow 4 API</span></div><div className="trigger-detail"><b>Vault Access</b><span>Locked — legal verification required</span></div><p className="trigger-footnote">Next step: Flow 5 — Legal Verification. No assets are released automatically.</p></section> : <><div className={'notice state-notice ' + (dms === 'warning' ? 'red-notice' : 'amber-notice')}><AlertTriangle size={20} /><span>{dms === 'soon' ? `Your next check-in is due on ${dueText}. Check in before the deadline; your Grace Period has not been activated.` : `You did not sign in by the scheduled check-in deadline (${dueText}). LegacyVault has initiated the ${grace}-day Grace Period countdown. Your emergency contacts will receive secure requests soon if you do not check in.`}</span></div><div className="dms-grid state-grid"><section className={'panel timer-card bordered ' + (dms === 'warning' ? 'red-border' : 'amber-border')}><div className="timer-label">{dms === 'soon' ? 'TIME UNTIL CHECK-IN DEADLINE' : 'GRACE PERIOD REMAINING'}</div><div className="timer-value">{formatCountdown(dms === 'soon' ? elapsed : graceRemaining)}</div><div className="rule" /><p>{dms === 'soon' ? 'Check in before the deadline to confirm you are safe and keep your vault in active monitoring.' : 'Unlock this dashboard instantly and stop the verification sequence by clicking below.'}</p><button className={'btn full ' + (dms === 'warning' ? 'danger-btn' : 'orange-btn')} disabled={syncing} onClick={checkIn}>{syncing ? 'Checking in…' : dms === 'soon' ? 'Check in now' : 'Emergency Check-in (Restore Safe State)'}</button></section><section className="panel timeline"><div className="timeline-head"><h3>{dms === 'soon' ? 'Check-In Schedule' : 'Projected Handoff Timeline'}</h3>{dms === 'soon' && pill('UPCOMING', 'amber')}</div>{(dms === 'soon' ? [['Last Check-In Completed', lastText], ['Next Check-In Due', `${dueText} (Upcoming)`], ['Grace Period Begins If Missed', `${dueText} — not active`]] : [['Check-In Missed', `${dueText} (Completed)`], ['Grace Period Warning Triggered', `${dueText} (Active State)`], ['Grace Period Expiry', `${graceText} (No asset release before legal verification)`]]).map(([a, b], i) => <div className={'timeline-item t' + i} key={a}><div className="timeline-dot" /><div><b>{a}</b><small>{b}</small></div></div>)}</section></div></>}
      <div className="dms-status-note">Status source: {apiBase ? (apiError ? "Backend unavailable" : "Backend API") : "Local demo timeline"} · Current state: {dms.toUpperCase()}. Backend alone can create a Handover Case and notify an Executor.</div>{apiError && dms !== "error" && <div className="validation-errors" role="alert">{apiError}</div>}</>}
    {!['contacts', 'assignments', 'dms'].includes(screen) && <section className="panel placeholder"><h1>{screen}</h1><p>This page is outside the supplied Flow 3 and Flow 4 Figma screens.</p><button className="btn primary" onClick={() => navigate('Contacts')}>Open Contact Book</button></section>}
  </main></div>{modal && <div className="overlay" onMouseDown={() => setModal(false)}><form className="modal" onMouseDown={e => e.stopPropagation()} onSubmit={addContact}><h2>Add New Contact</h2><p>Add a trusted person to allocate your digital assets.</p><label className="form-label">Full Name</label><input required placeholder="e.g. John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><label className="form-label">Relationship</label><select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}>{['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Attorney', 'Other'].map(x => <option key={x}>{x}</option>)}</select><label className="form-label">Email Address</label><input required type="email" placeholder="name@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><label className="form-label">Expected Role</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}><option>Beneficiary</option><option>Executor</option></select><div className="modal-actions"><button type="button" className="btn secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn primary">Save Contact</button></div></form></div>}</div>
}
createRoot(document.getElementById('root')).render(<App />);
