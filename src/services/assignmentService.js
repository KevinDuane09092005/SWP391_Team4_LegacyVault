// Assignment Service: Integrates with Backend Assignment API endpoints

// 1. Thẩm định cấu hình bàn giao: POST /api/v1/assignments/validate
export async function validateAssignmentApi({ assetId, executorContactId, handoverInstructions, beneficiaryContactIds }) {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  if (!token) {
    const error = new Error('No authentication token found')
    error.status = 401
    throw error
  }

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')

  const endpoint = baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assignments/validate` : `${baseUrl}/api/v1/assignments/validate`)
    : '/api/v1/assignments/validate'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      assetId,
      executorContactId,
      handoverInstructions,
      beneficiaryContactIds,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || data?.valid === false) {
    const error = new Error(data?.error || data?.message || 'Assignment configuration is invalid')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 2. Tạo hồ sơ bàn giao chính thức: POST /api/v1/assignments
export async function createAssignmentApi({ assetId, executorContactId, handoverInstructions, beneficiaryContactIds }) {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  if (!token) {
    const error = new Error('No authentication token found')
    error.status = 401
    throw error
  }

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')

  const endpoint = baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assignments` : `${baseUrl}/api/v1/assignments`)
    : '/api/v1/assignments'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      assetId,
      executorContactId,
      handoverInstructions,
      beneficiaryContactIds,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to create assignment')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 3. Lấy danh sách các hồ sơ bàn giao: GET /api/v1/assignments
export async function getAssignmentsListApi() {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  if (!token) {
    const error = new Error('No authentication token found')
    error.status = 401
    throw error
  }

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')

  const endpoint = baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assignments` : `${baseUrl}/api/v1/assignments`)
    : '/api/v1/assignments'

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to fetch assignments')
    error.status = response.status
    error.data = data
    throw error
  }

  return Array.isArray(data) ? data : data?.assignments || []
}

// 4. Lấy thông tin cấu hình bàn giao theo ID tài sản: GET /api/v1/assignments/asset/{assetId}
export async function getAssignmentByAssetIdApi(assetId) {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  if (!token) {
    const error = new Error('No authentication token found')
    error.status = 401
    throw error
  }

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')

  const endpoint = baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assignments/asset/${assetId}` : `${baseUrl}/api/v1/assignments/asset/${assetId}`)
    : `/api/v1/assignments/asset/${assetId}`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (response.status === 404) {
    const error = new Error(data?.error || 'Assignment not found for this asset')
    error.status = 404
    error.data = data
    throw error
  }

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to fetch assignment for this asset')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 5. Cập nhật cấu hình bàn giao theo ID tài sản: PUT /api/v1/assignments/asset/{assetId}
export async function updateAssignmentByAssetIdApi(
  assetId,
  { executorContactId, handoverInstructions, beneficiaryContactIds },
) {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  if (!token) {
    const error = new Error('No authentication token found')
    error.status = 401
    throw error
  }

  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')

  const endpoint = baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assignments/asset/${assetId}` : `${baseUrl}/api/v1/assignments/asset/${assetId}`)
    : `/api/v1/assignments/asset/${assetId}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      executorContactId,
      handoverInstructions,
      beneficiaryContactIds,
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to update assignment')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
