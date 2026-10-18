import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import Icon from '../../components/Icon.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import {
  Breadcrumbs,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getVault } from '../../services/vaultService.js'
import { formatDate, formatDisplayDate } from '../../vault/format.js'
import { ownerPaths } from '../../vault/paths.js'

// Flow 2 — Vault Details: the vault and the list of its assets.
export default function VaultDetailsPage() {
  const { vaultId } = useParams()
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = vaultContent[language]
  const copy = t.vaultDetails
  const location = useLocation()
  const navigate = useNavigate()
  const { status, data: vault, error, reload } = useAsync(() => getVault(user?.id, vaultId), `${user?.id}-${vaultId}`)

  // Kiểm tra token xác thực
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
    }
  }, [navigate, location.pathname])

  // Xử lý khi token hết hạn
  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('legacyvault-access-token')
      navigate('/login', {
        state: {
          from: location.pathname,
          message: language === 'vi' ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : 'Session expired. Please log in again.'
        }
      })
    }
  }, [error, navigate, location.pathname, language])

  return (
    <OwnerLayout>
      <Breadcrumbs
        label={t.breadcrumbsLabel}
        items={[{ label: t.nav.vaults, to: ownerPaths.vaults }, { label: vault?.name ?? '…' }]}
      />

      {status === 'loading' && <LoadingState label={t.loading} />}

      {status === 'error' && (
        <ErrorState
          message={t.errors[error.code] ?? error.message ?? t.errors.generic}
          retryLabel={t.retry}
          onRetry={error.code === 'VAULT_NOT_FOUND' ? undefined : reload}
        >
          <Button to={ownerPaths.vaults} variant="secondary">
            {t.nav.vaults}
          </Button>
        </ErrorState>
      )}

      {status === 'ready' && (
        <>
          {location.state?.created && <FormAlert tone="success">{copy.created}</FormAlert>}

          <div className="page-head page-head--spaced">
            <div>
              <h1 className="page-title">{vault.name}</h1>
              {vault.description && <p className="page-text">{vault.description}</p>}
              <p className="page-meta">
                {t.createdOn(formatDate(vault.createdAt, language))} · {t.assetCount(vault.assets.length)}
              </p>
            </div>
            <Button to={ownerPaths.newAsset(vault.id)}>
              <Icon name="layers" size={16} />
              {copy.addAsset}
            </Button>
          </div>

          <section className="page-section" aria-labelledby="assets-title">
            <h2 id="assets-title" className="section-title">
              {copy.assetsTitle}
            </h2>

            {vault.assets.length === 0 ? (
              <EmptyState
                icon="fileText"
                title={copy.emptyTitle}
                text={copy.emptyText}
                action={<Button to={ownerPaths.newAsset(vault.id)}>{copy.emptyCta}</Button>}
              />
            ) : (
              <div className="card asset-table">
                <div className="asset-table__row asset-table__row--head" aria-hidden="true">
                  <span>{copy.columns.name}</span>
                  <span>{copy.columns.type}</span>
                  <span>{language === 'vi' ? 'Trạng thái' : 'Status'}</span>
                  <span>{copy.columns.created}</span>
                </div>
                <ul>
                  {vault.assets.map((asset) => (
                    <li key={asset.id} className="asset-table__row">
                      <Link to={ownerPaths.asset(vault.id, asset.id)} className="asset-table__name" title={asset.description || asset.name}>
                        {asset.name}
                      </Link>
                      <span>
                        <span className="badge">{t.assetTypes[asset.type] || asset.type}</span>
                      </span>
                      <span>
                        <span className={`badge ${asset.status === 'assigned' ? 'green' : 'amber'}`}>
                          {asset.status === 'assigned'
                            ? (language === 'vi' ? 'Đã phân công' : 'Assigned')
                            : (language === 'vi' ? 'Chưa phân công' : 'Unassigned')}
                        </span>
                      </span>
                      <span className="asset-table__muted">{formatDisplayDate(asset.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </>
      )}
    </OwnerLayout>
  )
}
