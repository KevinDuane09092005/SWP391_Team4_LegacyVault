import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getAssetsListApi } from '../../services/vaultService.js'
import { formatDisplayDate } from '../../vault/format.js'
import { ownerPaths } from '../../vault/paths.js'

const PREVIEW_COUNT = 5

// Flow 2 — Owner Dashboard: totals and recent digital assets from GET /api/v1/assets.
export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = vaultContent[language]
  const navigate = useNavigate()
  const location = useLocation()
  const { status, data: assets, error, reload } = useAsync(() => getAssetsListApi(), `${user?.id}`)

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
          message:
            language === 'vi'
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Session expired. Please log in again.',
        },
      })
    }
  }, [error, navigate, location.pathname, language])

  const assetList = Array.isArray(assets) ? assets : []
  const assetTotal = assetList.length
  const assignedTotal = assetList.filter((a) => a.status === 'assigned').length
  const unassignedTotal = assetTotal - assignedTotal

  return (
    <OwnerLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.dashboard.welcome(user?.fullName || 'Owner')}</h1>
          <p className="page-text">
            {language === 'vi'
              ? 'Quản lý tài sản số, người thụ hưởng và các điều kiện chuyển giao di sản an toàn.'
              : 'Manage digital assets, trusted contacts, and automated legacy handover.'}
          </p>
        </div>
        <Button to={ownerPaths.newAsset()}>
          <Icon name="key" size={16} />
          {language === 'vi' ? 'Đăng ký tài sản' : 'Register Asset'}
        </Button>
      </div>

      {status === 'loading' && <LoadingState label={t.loading} />}

      {status === 'error' && (
        <ErrorState
          message={error?.message || t.errors.generic}
          retryLabel={t.retry}
          onRetry={reload}
        />
      )}

      {status === 'ready' && (
        <>
          <dl className="stat-grid">
            <div className="card stat-card">
              <dt>{language === 'vi' ? 'Tổng số tài sản' : 'Total Assets'}</dt>
              <dd data-testid="stat-assets">{assetTotal}</dd>
            </div>
            <div className="card stat-card">
              <dt>{language === 'vi' ? 'Đã phân công' : 'Assigned'}</dt>
              <dd data-testid="stat-assigned" style={{ color: 'var(--color-primary)' }}>{assignedTotal}</dd>
            </div>
            <div className="card stat-card">
              <dt>{language === 'vi' ? 'Chưa phân công' : 'Unassigned'}</dt>
              <dd data-testid="stat-unassigned" style={{ color: 'var(--color-muted)' }}>{unassignedTotal}</dd>
            </div>
          </dl>

          <section className="page-section" aria-labelledby="flow-shortcuts-title">
            <h2 id="flow-shortcuts-title" className="section-title">
              {language === 'vi' ? 'Quy trình bàn giao & Bảo vệ di sản' : 'Handover & Protection Workflow'}
            </h2>
            <div className="vault-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="asset-icon" style={{ width: 40, height: 40 }}>
                    <Icon name="users" size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-heading)' }}>
                      {language === 'vi' ? 'Danh bạ tin cậy' : 'Contact Book'}
                    </h3>
                    <small style={{ color: 'var(--color-muted)' }}>Flow 3</small>
                  </div>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {language === 'vi'
                    ? 'Chỉ định danh sách người thụ hưởng và người thi hành di sản đáng tin cậy.'
                    : 'Manage trusted beneficiaries and executors who will oversee asset release.'}
                </p>
                <Button to={ownerPaths.contacts} variant="secondary" size="sm">
                  {language === 'vi' ? 'Mở danh bạ' : 'Open Contacts'}
                </Button>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="asset-icon" style={{ width: 40, height: 40 }}>
                    <Icon name="layers" size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-heading)' }}>
                      {language === 'vi' ? 'Phân công di sản số' : 'Asset Assignments'}
                    </h3>
                    <small style={{ color: 'var(--color-muted)' }}>Flow 3</small>
                  </div>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {language === 'vi'
                    ? 'Phân chia tài sản số, chỉ định người thi hành và người thụ hưởng.'
                    : 'Allocate digital assets, set beneficiaries and executor handover instructions.'}
                </p>
                <Button to={ownerPaths.assignments} variant="secondary" size="sm">
                  {language === 'vi' ? 'Tạo phân công' : 'Start Wizard'}
                </Button>
              </div>

              <div className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div className="asset-icon" style={{ width: 40, height: 40 }}>
                    <Icon name="shield" size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-heading)' }}>
                      {language === 'vi' ? "Dead Man's Switch" : "Dead Man's Switch"}
                    </h3>
                    <small style={{ color: 'var(--color-muted)' }}>Flow 4</small>
                  </div>
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  {language === 'vi'
                    ? 'Giám sát chu kỳ điểm danh định kỳ, cảnh báo ân hạn và kích hoạt bàn giao tự động.'
                    : 'Automated periodic check-in monitoring, grace warning, and emergency handoff.'}
                </p>
                <Button to={ownerPaths.dms} variant="secondary" size="sm">
                  {language === 'vi' ? 'Cấu hình công tắc' : 'Open Switch Monitor'}
                </Button>
              </div>
            </div>
          </section>

          <section className="page-section" aria-labelledby="assets-title">
            <div className="section-row">
              <h2 id="assets-title" className="section-title">
                {language === 'vi' ? 'Tài sản số của tôi' : 'My Digital Assets'}
              </h2>
              {assetTotal > 0 && (
                <Link to={ownerPaths.assets} className="auth-link">
                  {language === 'vi' ? 'Xem tất cả tài sản' : 'View all assets'}
                </Link>
              )}
            </div>

            {assetTotal === 0 ? (
              <EmptyState
                icon="fileText"
                title={language === 'vi' ? 'Chưa có tài sản nào' : 'No assets registered yet'}
                text={
                  language === 'vi'
                    ? 'Bạn chưa đăng ký tài sản số nào. Hãy bắt đầu bảo vệ di sản của bạn bằng cách đăng ký tài sản đầu tiên.'
                    : 'You have not registered any digital assets yet. Begin securing your legacy by adding your first asset.'
                }
                action={
                  <Button to={ownerPaths.newAsset()}>
                    {language === 'vi' ? 'Đăng ký tài sản đầu tiên' : 'Register first asset'}
                  </Button>
                }
              />
            ) : (
              <div className="card asset-table">
                <div className="asset-table__row asset-table__row--head" aria-hidden="true">
                  <span>{language === 'vi' ? 'Tên tài sản' : 'Asset Name'}</span>
                  <span>{language === 'vi' ? 'Loại tài sản' : 'Type'}</span>
                  <span>{language === 'vi' ? 'Trạng thái' : 'Status'}</span>
                  <span>{language === 'vi' ? 'Ngày tạo' : 'Created'}</span>
                </div>
                <ul>
                  {assetList.slice(0, PREVIEW_COUNT).map((asset) => {
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
                          <span className="badge">{t.assetTypes?.[type] || type}</span>
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
        </>
      )}
    </OwnerLayout>
  )
}

