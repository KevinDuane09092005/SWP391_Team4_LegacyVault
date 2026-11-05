// Flow 6 in backend mode: when the API refuses or fails, the screens must not report success.
// The backend is replaced by a stub of global fetch. Run with:
// node --test tests/flow6-backend-failures.test.mjs
import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { setAuthToken, setDemoMode } from '../src/services/apiClient.js'
import {
  confirmReceipt,
  openAsset,
  recordAssetDownload,
  runAuthorizationCheck,
} from '../src/services/handoverService.js'
import { getAdminDashboardApi } from '../src/services/adminService.js'
import { exportAuditLogsCsvApi } from '../src/services/auditService.js'
import { mockUsers } from '../src/mocks/mockUsers.js'

const user = { id: 'real-user', fullName: 'Real User', identifier: 'real@example.test', role: 'BENEFICIARY' }
const CASE_ID = 'HC-1'
const ASSET_ID = 'asset-a'
const details = {
  case_number: CASE_ID,
  handover_status: 'RELEASED',
  authorized_assets: [{ asset_id: ASSET_ID, asset_name: 'Asset A', credentials: '' }],
}

const realFetch = globalThis.fetch
let routes
let calls

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json' },
})

beforeEach(() => {
  setDemoMode(false)
  setAuthToken('test-token')
  calls = []
  routes = []
  globalThis.fetch = async (url) => {
    calls.push(String(url))
    const route = routes.find(([part]) => String(url).includes(part))
    return route ? route[1]() : json(404, { message: 'not stubbed' })
  }
  // Case details always load; each test decides what the action under test returns.
  routes.push(['/details', () => json(200, details)])
})

afterEach(() => {
  globalThis.fetch = realFetch
  setDemoMode(null)
  setAuthToken(null)
})

test('confirmReceipt: a failed API call does not report COMPLETED', async () => {
  routes.push(['/confirm-received', () => json(500, { message: 'boom' })])
  await assert.rejects(confirmReceipt(user, CASE_ID), /boom/)
})

test('confirmReceipt: success reports COMPLETED', async () => {
  routes.push(['/confirm-received', () => json(200, { status: 'COMPLETED' })])
  const result = await confirmReceipt(user, CASE_ID)
  assert.equal(result.status, 'COMPLETED')
  assert.ok(result.completedAt)
})

test('runAuthorizationCheck: a refused dispatch does not report READY_FOR_ACCESS', async () => {
  routes.push(['/dispatch', () => json(403, { message: 'not allowed' })])
  await assert.rejects(runAuthorizationCheck(user, CASE_ID), /not allowed/)
})

test('openAsset: a refused request shows no content and tries no other asset', async () => {
  routes.push(['/beneficiary/assets/', () => json(403, { message: 'denied' })])
  await assert.rejects(openAsset(user, CASE_ID, ASSET_ID), /denied/)
  const assetCalls = calls.filter((url) => url.includes('/beneficiary/assets/'))
  assert.ok(assetCalls.length > 0)
  assert.ok(assetCalls.every((url) => url.includes(`/assets/${ASSET_ID}/`)), assetCalls.join())
})

test('openAsset: an empty response shows no placeholder secret', async () => {
  routes.push(['/beneficiary/assets/', () => json(200, {})])
  await assert.rejects(openAsset(user, CASE_ID, ASSET_ID), (error) => error.code === 'ASSET_CONTENT_UNAVAILABLE')
})

test('openAsset: returns the content from the backend and moves to RECEIPT_PENDING', async () => {
  routes.push(['/beneficiary/assets/', () => json(200, { decrypted_credential_data: { passphrase: 'from-backend' } })])
  const result = await openAsset(user, CASE_ID, ASSET_ID)
  assert.equal(result.content, 'from-backend')
  assert.equal(result.case.status, 'RECEIPT_PENDING')
})

test('recordAssetDownload: a refused acknowledge blocks the download', async () => {
  routes.push(['/acknowledge', () => json(403, { message: 'denied' })])
  await assert.rejects(recordAssetDownload(user, CASE_ID, ASSET_ID), /denied/)
})

// adminService and auditService fix their demo flag on import; outside a browser it is true.
test('demo mode: the admin dashboard and CSV export work for a signed-in admin', async () => {
  const admin = mockUsers.find((item) => item.role === 'ADMIN')
  const dashboard = await getAdminDashboardApi(admin)
  assert.equal(dashboard.metrics.total_users, mockUsers.length)

  // Only the browser download step is replaced here.
  globalThis.document = { createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } }
  URL.createObjectURL ??= () => 'blob:test'
  URL.revokeObjectURL ??= () => {}
  try {
    const blob = await exportAuditLogsCsvApi({ user: admin })
    assert.match(await blob.text(), /^log_id,timestamp/)
  } finally {
    delete globalThis.document
  }
})
