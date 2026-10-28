import { AUDIT_ACTIONS, OUTCOME } from '../audit/auditRules.js'
import { mockListAudit } from '../mocks/mockAuditStore.js'
import { emitSystemEvent } from '../mocks/mockSystemEvents.js'
import { IS_DEMO_MODE, apiFetch, downloadBlob } from './apiClient.js'

export { IS_DEMO_MODE }

// 1. GET /admin/audit-logs
export async function getAuditLogsApi({
  search = '',
  role = 'ALL',
  action = 'ALL',
  from_date = '',
  to_date = '',
  page = 0,
  size = 6,
} = {}) {
  if (IS_DEMO_MODE) {
    const filters = { actor: search, action: action === 'ALL' ? undefined : action }
    const list = await mockListAudit(null, filters)
    const start = page * size
    const paged = list.slice(start, start + size)
    return {
      logs: paged.map((entry) => ({
        log_id: entry.id,
        timestamp_formatted: entry.at,
        user: {
          name: entry.actor?.name || 'System',
          role: entry.actor?.role || 'SYSTEM',
        },
        action: entry.action,
        target: entry.entity?.id || entry.caseId || 'System',
        status: entry.outcome,
        ip_address: '192.168.1.100',
      })),
      total_elements: list.length,
      total_pages: Math.ceil(list.length / size),
    }
  }

  const params = new URLSearchParams({
    ...(search ? { search } : {}),
    ...(role && role !== 'ALL' ? { role } : {}),
    ...(action && action !== 'ALL' ? { action } : {}),
    ...(from_date ? { from_date } : {}),
    ...(to_date ? { to_date } : {}),
    page: String(page),
    size: String(size),
  })

  return apiFetch(`/admin/audit-logs?${params}`)
}

// 2. GET /admin/audit-logs/export-csv
export async function exportAuditLogsCsvApi({ from_date = '', to_date = '' } = {}) {
  if (IS_DEMO_MODE) {
    const list = await mockListAudit()
    const header = 'log_id,timestamp,user,role,action,target,status,ip_address\n'
    const rows = list
      .map(
        (e) =>
          `"${e.id}","${e.at}","${e.actor?.name || 'System'}","${e.actor?.role || 'SYSTEM'}","${e.action}","${e.entity?.id || ''}","${e.outcome}","127.0.0.1"`
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`)
    return blob
  }

  const params = new URLSearchParams({
    ...(from_date ? { from_date } : {}),
    ...(to_date ? { to_date } : {}),
  })

  const blob = await apiFetch(`/admin/audit-logs/export-csv?${params}`)
  downloadBlob(blob, `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`)
  return blob
}

// ---------------- Existing Page Wrapper Methods ----------------

// Admin only
export const listAuditLog = async (user, filters) => {
  if (IS_DEMO_MODE) return mockListAudit(user, filters)
  const data = await getAuditLogsApi({
    search: filters?.actor,
    role: filters?.role,
    action: filters?.action,
    from_date: filters?.from,
    to_date: filters?.to,
    size: 100,
  })
  const entries = (data?.logs || []).map((l, idx) => {
    const actor = typeof l.user === 'string' ? l.user : l.user?.name || 'System'
    const outcome = String(l.status || 'SUCCESS').toUpperCase()
    return {
    id: l.log_id || `log-${idx + 1}`,
    at: l.timestamp_formatted || l.time_formatted || new Date().toISOString(),
    actor: {
      name: actor,
      role: (typeof l.user === 'object' ? l.user?.role : l.role) || 'SYSTEM',
    },
    action: l.action,
    entity: { id: l.target || 'System', type: 'RECORD' },
    outcome,
    severity: outcome === 'SUCCESS' ? 'INFO' : 'WARNING',
    ip_address: l.ip_address,
    details: {},
    }
  })

  return entries.filter((entry) => {
    if (filters?.outcome && entry.outcome !== filters.outcome) return false
    if (filters?.alertsOnly && entry.outcome === 'SUCCESS') return false
    return true
  })
}

// Sign-in / sign-out events from Flow 1
export function recordSignIn({ user, identifier, success, reason }) {
  emitSystemEvent({
    user: success ? user : null,
    identifier,
    action: AUDIT_ACTIONS.LOGIN,
    outcome: success ? OUTCOME.SUCCESS : OUTCOME.FAILURE,
    entity: { type: 'SESSION', id: success ? user.id : 'unknown' },
    details: success ? {} : { reason },
  })
}

export function recordSignOut(user) {
  emitSystemEvent({
    user,
    action: AUDIT_ACTIONS.LOGOUT,
    entity: { type: 'SESSION', id: user?.id || 'unknown' },
  })
}
