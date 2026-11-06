// Contact Service: Integrates with Backend Contacts API endpoints (Flow 2)

function getContactsBaseEndpoint() {
  const baseUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.REACT_APP_API_BASE_URL ||
    ''
  ).replace(/\/$/, '')

  return baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/contacts` : `${baseUrl}/api/v1/contacts`)
    : '/api/v1/contacts'
}

function getTokenOrThrow() {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  if (!token) {
    const error = new Error('No authentication token found')
    error.status = 401
    throw error
  }
  return token
}

export async function createContactApi({ fullName, relationship, email, expectedRole }) {
  const token = getTokenOrThrow()
  const endpoint = getContactsBaseEndpoint()

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fullName,
      relationship,
      email,
      expectedRole: expectedRole || 'Beneficiary',
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to save contact')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export async function getContactsApi(keywordOrFilters = '') {
  const token = getTokenOrThrow()
  const basePath = getContactsBaseEndpoint()

  const params = new URLSearchParams()
  if (typeof keywordOrFilters === 'string') {
    if (keywordOrFilters.trim()) {
      params.set('keyword', keywordOrFilters.trim())
    }
  } else if (keywordOrFilters && typeof keywordOrFilters === 'object') {
    const kw = (keywordOrFilters.keyword || keywordOrFilters.search || '').trim()
    const role = (keywordOrFilters.expectedRole || '').trim()
    const status = (keywordOrFilters.status || '').trim()
    if (kw) params.set('keyword', kw)
    if (role && role.toUpperCase() !== 'ALL') params.set('expectedRole', role)
    if (status && status.toUpperCase() !== 'ALL') params.set('status', status)
  }

  const queryString = params.toString()
  const endpoint = queryString ? `${basePath}?${queryString}` : basePath

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to fetch contacts')
    error.status = response.status
    error.data = data
    throw error
  }

  return Array.isArray(data) ? data : data?.contacts || []
}

// Cập nhật thông tin & vai trò của người liên hệ: PUT /api/v1/contacts/{contactId}
export async function updateContactApi(
  contactId,
  { fullName, relationship, email, expectedRole },
) {
  const token = getTokenOrThrow()
  const basePath = getContactsBaseEndpoint()

  const response = await fetch(`${basePath}/${contactId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fullName,
      relationship,
      email,
      expectedRole: expectedRole || 'Beneficiary',
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to update contact')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// Gửi lại email lời mời liên hệ (cho liên hệ đang pending / rejected / revoked): POST /api/v1/contacts/{contactId}/resend-invite
export async function resendContactInvitationApi(contactId) {
  const token = getTokenOrThrow()
  const basePath = getContactsBaseEndpoint()

  const response = await fetch(`${basePath}/${contactId}/resend-invite`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to resend contact invitation')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 1. Thu hồi lời mời liên hệ đang chờ (Pending): DELETE /api/v1/contacts/{contactId}/invitation
export async function revokeContactInvitationApi(contactId) {
  const token = getTokenOrThrow()
  const basePath = getContactsBaseEndpoint()

  const response = await fetch(`${basePath}/${contactId}/invitation`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to revoke contact invitation')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 2. Thu hồi quyền truy cập của người liên hệ (kể cả đã Verified): POST /api/v1/contacts/{contactId}/revoke-access
export async function revokeContactAccessApi(contactId) {
  const token = getTokenOrThrow()
  const basePath = getContactsBaseEndpoint()

  const response = await fetch(`${basePath}/${contactId}/revoke-access`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to revoke contact access')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// 3. Xóa hẳn người liên hệ khỏi danh bạ: DELETE /api/v1/contacts/{contactId}
export async function deleteContactApi(contactId) {
  const token = getTokenOrThrow()
  const basePath = getContactsBaseEndpoint()

  const response = await fetch(`${basePath}/${contactId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to delete contact')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}
