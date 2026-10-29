import {
  mockCreateAsset,
  mockCreateVault,
  mockGetAsset,
  mockGetVault,
  mockListVaults,
} from '../mocks/mockVaultStore.js'
import { buildAssetFromForm } from '../vault/assetDraft.js'
import { VaultError } from '../vault/VaultError.js'
import { prepareDocuments } from './documentService.js'
import { prepareSensitiveData } from './encryptionService.js'

// The ONLY place the vault pages call for data (Flow 2).
//
// Right now everything uses the in-memory demo store (src/mocks/mockVaultStore.js).
// When the backend is ready, replace the mock calls with requests that follow the
// backend's real API contract. Keep the inputs/outputs below so the pages do not change,
// and throw `new VaultError(code)` so the right translated message is shown.
// The backend must also check that the signed-in user owns the vault (the frontend
// passes ownerId only because the demo has no server session).

export const IS_DEMO_MODE = false

// Output: [{ id, name, description, createdAt, assets: [asset] }], newest first
export async function listVaults(ownerId) {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  let realAssets = []
  if (token) {
    try {
      realAssets = await getAssetsListApi()
    } catch {
      // fallback
    }
  }

  const vaults = await mockListVaults(ownerId)
  if (token && vaults.length > 0) {
    vaults[0].assets = (Array.isArray(realAssets) ? realAssets : []).map((a) => ({
      id: a.assetId,
      assetId: a.assetId,
      name: a.assetName,
      assetName: a.assetName,
      type: a.assetType,
      assetType: a.assetType,
      description: a.description,
      status: a.status || 'unassigned',
      relatedDocuments: a.attachmentUrl ? [{ id: 'doc-1', name: 'attachment', size: 1024 }] : [],
      createdAt: a.createdAt,
    }))
    return [vaults[0]]
  }
  return vaults
}

// Output: { id, name, description, createdAt, assets: [asset] }
export async function getVault(ownerId, vaultId) {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  let realAssets = []
  if (token) {
    try {
      realAssets = await getAssetsListApi()
    } catch {
      // fallback
    }
  }

  const vault = await mockGetVault(ownerId, vaultId)
  if (token) {
    vault.assets = (Array.isArray(realAssets) ? realAssets : []).map((a) => ({
      id: a.assetId,
      assetId: a.assetId,
      name: a.assetName,
      assetName: a.assetName,
      type: a.assetType,
      assetType: a.assetType,
      description: a.description,
      status: a.status || 'unassigned',
      relatedDocuments: a.attachmentUrl ? [{ id: 'doc-1', name: 'attachment', size: 1024 }] : [],
      createdAt: a.createdAt,
    }))
  }
  return vault
}

// Input:  { name, description }
// Output: the new vault (with an empty assets list)
export function createVault(ownerId, { name, description }) {
  return mockCreateVault(ownerId, { name: name.trim(), description: description.trim() })
}

// Output: { asset, vault: { id, name } }
export async function getAsset(ownerId, vaultId, assetId) {
  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  if (token) {
    try {
      const realAsset = await getAssetDetailApi(assetId)
      return {
        asset: {
          id: realAsset.assetId,
          assetId: realAsset.assetId,
          name: realAsset.assetName,
          assetName: realAsset.assetName,
          type: realAsset.assetType,
          assetType: realAsset.assetType,
          description: realAsset.description,
          decryptedCredentials: realAsset.decryptedCredentials,
          attachmentUrl: realAsset.attachmentUrl,
          status: realAsset.status || 'unassigned',
          details: {},
          relatedDocuments: realAsset.attachmentUrl
            ? realAsset.attachmentUrl
                .split(',')
                .map((u) => u.trim())
                .filter(Boolean)
                .map((url, idx) => {
                  const rawFile = decodeURIComponent(url.split('/').pop() || 'attachment.pdf')
                  const uIdx = rawFile.indexOf('_')
                  const cleanName =
                    uIdx === 36 && rawFile.length > 37 ? rawFile.slice(37) : rawFile
                  return {
                    id: `doc-${idx + 1}`,
                    name: cleanName,
                    size: 1024,
                    url,
                  }
                })
            : [],
          encryption: {
            status: 'ENCRYPTED',
            sensitiveFields: realAsset.decryptedCredentials ? ['decryptedCredentials'] : [],
          },
          createdAt: realAsset.createdAt,
          updatedAt: realAsset.updatedAt,
        },
        vault: { id: vaultId || 'vault-demo-family', name: 'Primary Vault' },
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        throw err
      }
      // If asset is not found on real backend, fallback to mockGetAsset
    }
  }
  return mockGetAsset(ownerId, vaultId, assetId)
}

// Call Real Backend API: GET /api/v1/assets/{assetId}
export async function getAssetDetailApi(assetId) {
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
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assets/${assetId}` : `${baseUrl}/api/v1/assets/${assetId}`)
    : `/api/v1/assets/${assetId}`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data?.error || data?.message || 'Asset not found or access denied')
    error.status = response.status
    error.data = data
    throw error
  }

  return response.json()
}


// Call Real Backend API: GET /api/v1/assets
export async function getAssetsListApi() {
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
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assets` : `${baseUrl}/api/v1/assets`)
    : '/api/v1/assets'

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const error = new Error(data?.error || data?.message || 'Failed to fetch assets')
    error.status = response.status
    error.data = data
    throw error
  }

  return response.json()
}

// Call Real Backend API: POST /api/v1/assets
export async function createAssetApi({ assetType, assetName, description, credentials, attachmentUrl }) {
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
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assets` : `${baseUrl}/api/v1/assets`)
    : '/api/v1/assets'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      assetType,
      assetName,
      description: description || '',
      credentials: credentials || '',
      attachmentUrl: attachmentUrl || '',
    }),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || 'Failed to create asset')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// Call Real Backend API: PUT /api/v1/assets/{assetId}
export async function updateAssetApi(
  assetId,
  { assetType, assetName, description, credentials, attachmentUrl, status },
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
    ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/assets/${assetId}` : `${baseUrl}/api/v1/assets/${assetId}`)
    : `/api/v1/assets/${assetId}`

  const payload = {
    assetType,
    assetName,
    description: description || '',
    attachmentUrl: attachmentUrl || '',
  }

  // Only pass credentials if provided (backend keeps old credentials if null/empty)
  if (credentials && credentials.trim()) {
    payload.credentials = credentials.trim()
  } else {
    payload.credentials = ''
  }

  if (status) {
    payload.status = status
  }

  // Chuẩn RESTful API: Gửi PUT trước theo đặc tả API của Backend
  let response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  // Fallback sang POST nếu Backend cấu hình @PostMapping
  if (response.status === 405) {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    // Hỗ trợ cập nhật các tài sản demo mẫu nếu chúng không tồn tại trong DB backend (404)
    if (response.status === 404 && (assetId.startsWith('asset-demo-') || assetId.startsWith('mock-'))) {
      const mockUpdated = await mockCreateAsset('demo-owner', 'vault-demo-family', {
        id: assetId,
        name: assetName,
        type: assetType,
        description,
        attachmentUrl,
        status: status || 'unassigned',
      })
      return {
        message: 'Cập nhật tài sản demo thành công (Dữ liệu mẫu)',
        asset: mockUpdated,
      }
    }

    const error = new Error(data?.error || data?.message || `Failed to update asset (${response.status})`)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

// The save part of Flow 2, in the required business order:
//   1. check the asset information
//   2. attach the related documents
//   3. encrypt sensitive data
//   4. save the asset via API / vault store
export async function saveAsset(ownerId, vaultId, { values, files }, onProgress = () => { }) {
  onProgress('validate')
  const rawType = values.type || values.assetType || ''
  const assetName = (values.name || values.assetName || '').trim()
  if (!assetName || !rawType) throw new VaultError('INVALID_ASSET')

  onProgress('documents')
  const relatedDocuments = await prepareDocuments(files)

  onProgress('encryption')
  const asset = buildAssetFromForm(values)
  const prepared = await prepareSensitiveData({ ...asset, name: assetName, type: rawType, relatedDocuments })

  // Construct credentials from sensitive fields + handoverNotes if not explicit
  let credentials = (values.credentials || '').trim()
  if (!credentials) {
    const parts = []
    if (rawType === 'BANK_ACCOUNT') {
      if (values.bankName) parts.push(`Bank: ${values.bankName}`)
      if (values.accountHolder) parts.push(`Holder: ${values.accountHolder}`)
      if (values.accountLast4) parts.push(`Last4: ${values.accountLast4}`)
    } else if (rawType === 'CRYPTO_WALLET') {
      if (values.walletName) parts.push(`Wallet: ${values.walletName}`)
      if (values.network) parts.push(`Network: ${values.network}`)
      if (values.publicAddress) parts.push(`Address: ${values.publicAddress}`)
    } else if (rawType === 'SOCIAL_MEDIA') {
      if (values.platform) parts.push(`Platform: ${values.platform}`)
      if (values.username) parts.push(`Username: ${values.username}`)
    } else if (rawType === 'IMPORTANT_DOCUMENT') {
      if (values.documentTitle) parts.push(`Title: ${values.documentTitle}`)
      if (values.documentType) parts.push(`Type: ${values.documentType}`)
    } else if (values.category) {
      parts.push(`Category: ${values.category}`)
    }
    if (values.handoverNotes?.trim()) {
      parts.push(`Notes: ${values.handoverNotes.trim()}`)
    }
    credentials = parts.join(' | ')
  }

  let attachmentUrl = (values.attachmentUrl || '').trim()
  if (!attachmentUrl && relatedDocuments && relatedDocuments.length > 0) {
    const uploadedUrls = relatedDocuments.map((d) => d.url).filter(Boolean)
    if (uploadedUrls.length > 0) {
      attachmentUrl = uploadedUrls.join(',')
    }
  }

  const typeMapping = {
    BANK_ACCOUNT: 'Bank Account',
    CRYPTO_WALLET: 'Crypto Wallet',
    SOCIAL_MEDIA: 'Social Media',
    IMPORTANT_DOCUMENT: 'Important Document',
    OTHER: 'Other',
  }
  const assetType = typeMapping[rawType] || rawType

  onProgress('saving')

  const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
  let apiRes = null

  if (token) {
    apiRes = await createAssetApi({
      assetType,
      assetName,
      description: values.description?.trim() || '',
      credentials,
      attachmentUrl,
    })
  }

  const created = apiRes?.asset || {}
  const savedAsset = {
    ...prepared,
    id: created.assetId || `asset-${Date.now()}`,
    name: created.assetName || assetName,
    type: rawType,
    description: created.description || values.description?.trim() || '',
    handoverNotes: values.handoverNotes?.trim() || '',
    credentials: created.decryptedCredentials || credentials,
    attachmentUrl: created.attachmentUrl || attachmentUrl,
    relatedDocuments,
    createdAt: created.createdAt || new Date().toISOString(),
  }

  try {
    mockCreateAsset(ownerId, vaultId, savedAsset)
  } catch (err) {
    // ignore
  }

  return savedAsset
}
