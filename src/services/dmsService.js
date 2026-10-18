// Dead Man's Switch (DMS) & Handover Service: Integrates with Backend DMS API endpoints

function getAuthHeader() {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  if (!token) {
    const error = new Error('No authentication token found')
    error.status = 401
    throw error
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

function getBaseUrl() {
  const base = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')

  return base.endsWith('/api/v1') ? base.replace(/\/api\/v1$/, '') : base
}

// 1. LẤY TRẠNG THÁI DMS & ĐỒNG HỒ ĐẾM NGƯỢC: GET /api/v1/dms/status
export async function getDmsStatusApi() {
  const headers = getAuthHeader()
  const baseUrl = getBaseUrl()
  const endpoint = `${baseUrl}/api/v1/dms/status`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to fetch DMS status')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 2. CÀI ĐẶT / CẬP NHẬT CẤU HÌNH DMS: POST /api/v1/dms/config
export async function saveDmsConfigApi({ checkInIntervalDays, gracePeriodDays }) {
  const headers = getAuthHeader()
  const baseUrl = getBaseUrl()
  const endpoint = `${baseUrl}/api/v1/dms/config`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      checkInIntervalDays: Number(checkInIntervalDays),
      gracePeriodDays: Number(gracePeriodDays),
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to save DMS configuration')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 3. ĐIỂM DANH ĐỊNH KỲ / RESET TIMER: POST /api/v1/dms/check-in
export async function checkInDmsApi() {
  const headers = getAuthHeader()
  const baseUrl = getBaseUrl()
  const endpoint = `${baseUrl}/api/v1/dms/check-in`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to perform check-in')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 4. ĐIỂM DANH KHẨN CẤP TRONG THỜI GIAN ÂN HẠN: POST /api/v1/dms/emergency-check-in
export async function emergencyCheckInDmsApi() {
  const headers = getAuthHeader()
  const baseUrl = getBaseUrl()
  const endpoint = `${baseUrl}/api/v1/dms/emergency-check-in`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({}),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to perform emergency check-in')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 5. LỊCH SỬ NHẬT KÝ ĐIỂM DANH: GET /api/v1/dms/audit-logs
export async function getDmsAuditLogsApi() {
  const headers = getAuthHeader()
  const baseUrl = getBaseUrl()
  const endpoint = `${baseUrl}/api/v1/dms/audit-logs`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to fetch audit logs')
    error.status = response.status
    error.data = data
    throw error
  }

  return Array.isArray(data) ? data : data?.logs || []
}

// 6. XEM DANH SÁCH HỒ SƠ BÀN GIAO: GET /api/v1/handover/cases
export async function getHandoverCasesApi() {
  const headers = getAuthHeader()
  const baseUrl = getBaseUrl()
  const endpoint = `${baseUrl}/api/v1/handover/cases`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to fetch handover cases')
    error.status = response.status
    error.data = data
    throw error
  }

  return Array.isArray(data) ? data : data?.cases || []
}
