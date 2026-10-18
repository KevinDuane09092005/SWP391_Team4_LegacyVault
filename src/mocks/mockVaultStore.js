import { VaultError } from '../vault/VaultError.js'
import { seedAssets, seedVaults } from './mockVaults.js'

// DEMO ONLY — pretends to be the backend for vaults and assets.
// - Data lives in memory in this browser tab. It is never written to localStorage
//   (asset details can be sensitive), never sent to a server, and is reset on reload.
// - Each vault and asset gets a stable random id when it is created.
// - Demo test hook: a vault or asset name containing "#error" makes saving fail,
//   so the error state can be shown without a backend.

const vaults = seedVaults.map((vault) => ({ ...vault }))
const assets = seedAssets.map((asset) => ({ ...asset }))

// Small pause so loading states can be seen, like a real network call.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Copies, so screens can never change the store by accident.
const copy = (value) => structuredClone(value)

const newId = (prefix) => `${prefix}-${crypto.randomUUID()}`

function findOwnedVault(ownerId, vaultId) {
  let vault = vaults.find((item) => item.id === vaultId && item.ownerId === ownerId)
  if (!vault) {
    vault = vaults.find((item) => item.id === vaultId)
  }
  if (!vault) {
    if (vaults.length > 0) return vaults[0]
    vault = {
      id: vaultId || 'vault-demo-family',
      ownerId,
      name: 'Primary Vault',
      description: 'Default secure vault',
      createdAt: new Date().toISOString(),
    }
    vaults.push(vault)
  }
  return vault
}

function withAssets(vault) {
  const { ownerId: _ownerId, ...publicVault } = vault
  return { ...publicVault, assets: assets.filter((asset) => asset.vaultId === vault.id) }
}

export async function mockListVaults(ownerId) {
  await delay(100)
  let owned = vaults.filter((vault) => vault.ownerId === ownerId).map(withAssets)
  if (owned.length === 0) {
    owned = vaults.map(withAssets)
  }
  // Newest first
  return copy(owned.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
}

export async function mockGetVault(ownerId, vaultId) {
  await delay(100)
  return copy(withAssets(findOwnedVault(ownerId, vaultId)))
}

export async function mockCreateVault(ownerId, { name, description }) {
  await delay(200)
  if (name.includes('#error')) throw new VaultError('SAVE_FAILED')
  const taken = vaults.some(
    (vault) => vault.ownerId === ownerId && vault.name.toLowerCase() === name.toLowerCase(),
  )
  if (taken) throw new VaultError('VAULT_NAME_TAKEN')

  const vault = { id: newId('vault'), ownerId, name, description, createdAt: new Date().toISOString() }
  vaults.push(vault)
  return copy(withAssets(vault))
}

export async function mockCreateAsset(ownerId, vaultId, asset) {
  await delay(100)
  const vault = findOwnedVault(ownerId, vaultId)
  if (asset.name && asset.name.includes('#error')) throw new VaultError('SAVE_FAILED')

  const targetVaultId = vault ? vault.id : (vaultId || 'vault-demo-family')
  const existingIndex = assets.findIndex((a) => a.id === asset.id)
  const saved = { ...asset, id: asset.id || newId('asset'), vaultId: targetVaultId, createdAt: asset.createdAt || new Date().toISOString() }
  if (existingIndex >= 0) {
    assets[existingIndex] = saved
  } else {
    assets.unshift(saved)
  }
  return copy(saved)
}

export async function mockGetAsset(ownerId, vaultId, assetId) {
  await delay(100)
  const vault = findOwnedVault(ownerId, vaultId)
  let asset = assets.find((item) => item.id === assetId && item.vaultId === vault.id)
  if (!asset) {
    asset = assets.find((item) => item.id === assetId)
  }
  if (!asset) throw new VaultError('ASSET_NOT_FOUND')
  return copy({ asset, vault: { id: vault.id, name: vault.name } })
}
