// Addresses of the Vault Owner pages, in one place so links never get out of sync.
export const ownerPaths = {
  dashboard: '/dashboard/owner',
  vaults: '/dashboard/owner/assets',
  newVault: '/dashboard/owner/assets/new',
  vault: () => '/dashboard/owner/assets',
  assets: '/dashboard/owner/assets',
  newAsset: () => '/dashboard/owner/assets/new',
  asset: (_vaultId, assetId) => {
    const id = assetId || _vaultId
    return `/dashboard/owner/assets/${id}`
  },
  contacts: '/dashboard/owner/contacts',
  assignments: '/dashboard/owner/assignments',
  dms: '/dashboard/owner/dms',
}

