import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getAssetsListApi } from '../../services/vaultService.js'
import { formatDisplayDate } from '../../vault/format.js'
import { ownerPaths } from '../../vault/paths.js'

// Assets List Page: Displays all assets fetched directly from GET /api/v1/assets
export default function AssetsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = vaultContent[language]
  const copy = t.vaultDetails
  const location = useLocation()
  const navigate = useNavigate()

  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Hàm gọi API lấy danh sách tài sản (tái sử dụng được cho reload / refetch)
  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setError(null)

    // 1. Lấy Token & Kiểm tra xác thực
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    try {
      // 2. Gọi HTTP GET tới Backend API
      const data = await getAssetsListApi()
      setAssets(Array.isArray(data) ? data : [])
    } catch (err) {
      // 3. Xử lý khi Token hết hạn (401 / 403)
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('legacyvault-access-token')
        navigate('/login', {
          state: {
            from: location.pathname,
            message:
              language === 'vi'
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                : 'Session expired. Please log in again.',
          },
        })
        return
      }
      console.error('Lỗi lấy danh sách tài sản:', err)
      setError(
        err.message ||
          (language === 'vi' ? 'Không thể tải danh sách tài sản.' : 'Failed to load assets list.'),
      )
    } finally {
      setLoading(false)
    }
  }, [language, location.pathname, navigate])

  // Kích hoạt khi component được render lần đầu
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const defaultVaultId = 'vault-demo-family'

  return (
    <OwnerLayout>
      <Breadcrumbs
        label={t.breadcrumbsLabel}
        items={[
          { label: t.nav.dashboard, to: ownerPaths.dashboard },
          { label: language === 'vi' ? 'Tài sản số' : 'Digital Assets' },
        ]}
      />

      <div className="page-head page-head--spaced">
        <div>
          <h1 className="page-title">{language === 'vi' ? 'Danh sách tài sản số' : 'Digital Assets'}</h1>
          <p className="page-text">
            {language === 'vi'
              ? 'Tất cả các tài sản số, tài khoản và tài liệu đã được mã hóa an toàn trong hệ thống.'
              : 'All digital assets, credentials, and records secured in your vault.'}
          </p>
          {!loading && !error && (
            <p className="page-meta">
              {t.assetCount(assets.length)}
            </p>
          )}
        </div>
        <Button to={ownerPaths.newAsset()}>
          <Icon name="key" size={16} />
          {language === 'vi' ? 'Đăng ký tài sản' : 'Register Asset'}
        </Button>
      </div>

      {loading && <LoadingState label={t.loading} />}

      {error && (
        <ErrorState message={error} retryLabel={t.retry} onRetry={fetchAssets}>
          <Button to={ownerPaths.dashboard} variant="secondary">
            {t.nav.dashboard}
          </Button>
        </ErrorState>
      )}

      {!loading && !error && (
        <section className="page-section" aria-labelledby="assets-list-title">
          <h2 id="assets-list-title" className="visually-hidden">
            {copy.assetsTitle}
          </h2>

          {assets.length === 0 ? (
            <EmptyState
              icon="fileText"
              title={language === 'vi' ? 'Chưa có tài sản nào' : copy.emptyTitle}
              text={
                language === 'vi'
                  ? 'Bạn chưa đăng ký tài sản số nào. Hãy bắt đầu bảo vệ di sản bằng cách đăng ký tài sản đầu tiên.'
                  : copy.emptyText
              }
              action={
                <Button to={ownerPaths.newAsset()}>
                  {language === 'vi' ? 'Đăng ký tài sản đầu tiên' : copy.emptyCta}
                </Button>
              }
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
                {assets.map((asset) => {
                  const id = asset.assetId || asset.id
                  const name = asset.assetName || asset.name
                  const type = asset.assetType || asset.type
                  const isAssigned = asset.status === 'assigned'
                  return (
                    <li key={id} className="asset-table__row">
                      <Link
                        to={ownerPaths.asset(null, id)}
                        className="asset-table__name"
                        title={asset.description || name}
                      >
                        {name}
                      </Link>
                      <span>
                        <span className="badge">{t.assetTypes[type] || type}</span>
                      </span>
                      <span>
                        <span className={`badge ${isAssigned ? 'green' : 'amber'}`}>
                          {isAssigned
                            ? (language === 'vi' ? 'Đã phân công' : 'Assigned')
                            : (language === 'vi' ? 'Chưa phân công' : 'Unassigned')}
                        </span>
                      </span>
                      <span className="asset-table__muted">
                        {formatDisplayDate(asset.createdAt)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>
      )}
    </OwnerLayout>
  )
}
