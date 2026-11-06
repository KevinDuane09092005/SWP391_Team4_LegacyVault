import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import {
  Breadcrumbs,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/vault/PageStates.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getAssetsListApi } from '../../services/vaultService.js'
import { formatDisplayDate } from '../../vault/format.js'
import { ownerPaths } from '../../vault/paths.js'

// Assets List Page: Displays all assets fetched directly from GET /api/v1/assets
export default function AssetsPage() {
  const { language } = useLanguage()
  const isVi = language === 'vi'
  const t = vaultContent[language]
  const copy = t.vaultDetails
  const location = useLocation()
  const navigate = useNavigate()

  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  // Hàm gọi API lấy danh sách tài sản (tái sử dụng được cho reload / refetch / filter)
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
      // 2. Gọi HTTP GET tới Backend API kèm bộ lọc status / assetType
      const data = await getAssetsListApi({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        assetType: typeFilter !== 'ALL' ? typeFilter : undefined,
      })
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
              isVi
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                : 'Session expired. Please log in again.',
          },
        })
        return
      }
      console.error('Lỗi lấy danh sách tài sản:', err)
      setError(
        err.message ||
          (isVi ? 'Không thể tải danh sách tài sản.' : 'Failed to load assets list.'),
      )
    } finally {
      setLoading(false)
    }
  }, [isVi, location.pathname, navigate, statusFilter, typeFilter])

  // Kích hoạt khi component được render hoặc thay đổi bộ lọc
  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  return (
    <OwnerLayout>
      <Breadcrumbs
        label={t.breadcrumbsLabel}
        items={[
          { label: t.nav.dashboard, to: ownerPaths.dashboard },
          { label: isVi ? 'Tài sản số' : 'Digital Assets' },
        ]}
      />

      <div className="page-head page-head--spaced">
        <div>
          <h1 className="page-title">{isVi ? 'Danh sách tài sản số' : 'Digital Assets'}</h1>
          <p className="page-text">
            {isVi
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
          {isVi ? 'Đăng ký tài sản' : 'Register Asset'}
        </Button>
      </div>

      {/* Bộ lọc trạng thái & loại tài sản */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px',
        }}
      >
        <select
          className="field__input"
          style={{ width: 'auto', minWidth: '175px', height: '38px', padding: '0 12px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label={isVi ? 'Lọc theo trạng thái' : 'Filter by status'}
        >
          <option value="ALL">{isVi ? 'Tất cả trạng thái' : 'All Statuses'}</option>
          <option value="assigned">{isVi ? 'Đã phân công' : 'Assigned'}</option>
          <option value="unassigned">{isVi ? 'Chưa phân công' : 'Unassigned'}</option>
        </select>

        <select
          className="field__input"
          style={{ width: 'auto', minWidth: '195px', height: '38px', padding: '0 12px' }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label={isVi ? 'Lọc theo loại tài sản' : 'Filter by asset type'}
        >
          <option value="ALL">{isVi ? 'Tất cả loại tài sản' : 'All Asset Types'}</option>
          <option value="Bank Account">{isVi ? 'Tài khoản ngân hàng' : 'Bank Account'}</option>
          <option value="Crypto Wallet">{isVi ? 'Ví tiền mã hóa' : 'Crypto Wallet'}</option>
          <option value="Social Media">{isVi ? 'Mạng xã hội' : 'Social Media'}</option>
          <option value="Important Document">{isVi ? 'Tài liệu quan trọng' : 'Important Document'}</option>
          <option value="Other">{isVi ? 'Khác' : 'Other'}</option>
        </select>
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
              title={isVi ? 'Chưa có tài sản nào' : copy.emptyTitle}
              text={
                isVi
                  ? 'Bạn chưa đăng ký tài sản số nào (hoặc không có kết quả khớp bộ lọc). Hãy bắt đầu bảo vệ di sản bằng cách đăng ký tài sản đầu tiên.'
                  : copy.emptyText
              }
              action={
                <Button to={ownerPaths.newAsset()}>
                  {isVi ? 'Đăng ký tài sản đầu tiên' : copy.emptyCta}
                </Button>
              }
            />
          ) : (
            <div className="card asset-table">
              <div className="asset-table__row asset-table__row--head" aria-hidden="true">
                <span>{copy.columns.name}</span>
                <span>{copy.columns.type}</span>
                <span>{isVi ? 'Trạng thái' : 'Status'}</span>
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
                            ? (isVi ? 'Đã phân công' : 'Assigned')
                            : (isVi ? 'Chưa phân công' : 'Unassigned')}
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
