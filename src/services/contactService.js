// Contact Service: Integrates with Backend Contacts API endpoints

export async function createContactApi({ fullName, relationship, email, expectedRole }) {
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
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/contacts` : `${baseUrl}/api/v1/contacts`)
    : '/api/v1/contacts'

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

export async function getContactsApi(keyword = '') {
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

  const basePath = baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/contacts` : `${baseUrl}/api/v1/contacts`)
    : '/api/v1/contacts'

  const endpoint = keyword && keyword.trim()
    ? `${basePath}?keyword=${encodeURIComponent(keyword.trim())}`
    : basePath

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


// 1. Thu hồi lời mời liên hệ đang chờ (Pending)
export async function revokeContactInvitationApi(contactId) {
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

  const basePath = baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/contacts` : `${baseUrl}/api/v1/contacts`)
    : '/api/v1/contacts'

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

// 2. Xóa hẳn người liên hệ khỏi danh bạ
export async function deleteContactApi(contactId) {
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

  const basePath = baseUrl
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/contacts` : `${baseUrl}/api/v1/contacts`)
    : '/api/v1/contacts'

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
