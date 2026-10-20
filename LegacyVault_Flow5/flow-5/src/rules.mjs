export const VALID_STATUSES = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'];

export const STATUS_LABELS = {
  PENDING:'Pending', SUBMITTED:'Submitted', UNDER_REVIEW:'Under Review',
  APPROVED:'Approved', REJECTED:'Rejected'
};

export function canReview(status) { return status === 'UNDER_REVIEW' || status === 'SUBMITTED'; }
export function formatCaseTitle(number) { return `Case #${number}`; }
export function validRejectReason(value) { return typeof value === 'string' && value.trim().length >= 5; }
export function validateUpload(file) {
  if (!file) return 'Please choose a document.';
  const allowedExtensions = /\.(pdf|png|jpe?g)$/i.test(file.name || '');
  const allowedTypes = ['application/pdf','image/png','image/jpeg',''];
  if (!allowedExtensions || !allowedTypes.includes(file.type || '')) return 'Use a PDF, PNG, or JPG document.';
  if (file.size > 15 * 1024 * 1024) return 'Maximum document size is 15 MB.';
  if (file.size <= 0) return 'This file is empty.';
  return null;
}
export function matchesQuery(record, search) {
  const q=(search||'').trim().toLowerCase();
  return !q || [record.case_number,record.vault_owner_name,record.executor_name].some(v => String(v||'').toLowerCase().includes(q));
}
export function formatBytes(value){
  if (value < 1024) return `${value} B`;
  if (value < 1024*1024) return `${(value/1024).toFixed(1)} KB`;
  return `${(value/(1024*1024)).toFixed(1)} MB`;
}
