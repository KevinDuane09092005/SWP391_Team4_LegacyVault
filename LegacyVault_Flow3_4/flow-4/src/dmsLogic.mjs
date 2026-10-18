// UI-only state derivation. The Backend scheduler owns authoritative triggers and notifications.
export function computeDmsView({configured,now,nextCheckIn,graceEndsAt,backendStatus,apiEnabled=false,apiError=''}) {
  if (apiEnabled && apiError) return 'error';
  if (!configured) return 'config';
  const due = new Date(nextCheckIn).getTime();
  const end = new Date(graceEndsAt).getTime();
  if (!Number.isFinite(due) || !Number.isFinite(end)) return 'error';
  if (apiEnabled && !backendStatus) return 'error';
  const status = backendStatus?.toLowerCase();
  if (status==='triggered') return 'triggered';
  if (status==='warning' || status==='grace_period') return 'warning';
  if (apiEnabled && status!=='active') return 'error';
  if (apiEnabled && now>=due) return 'error';
  if (!apiEnabled && now>=end) return 'triggered';
  if (!apiEnabled && now>=due) return 'warning';
  return due-now<=3*86400000?'soon':'active';
}
export function futureDate(lastCheckIn,intervalDays){return new Date(new Date(lastCheckIn).getTime()+intervalDays*86400000)}
export function dateLabel(value){return new Date(value).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})}
