import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  KeyRound,
  Landmark,
  Layers,
  Shield,
  Users,
  Wallet,
} from 'lucide-react'
import Button from '../../components/Button.jsx'
import Icon from '../../components/Icon.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import PageHeader from '../../components/vault/PageHeader.jsx'
import { EmptyState, ErrorState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import useAsync from '../../hooks/useAsync.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getAssetsListApi } from '../../services/vaultService.js'
import { formatDisplayDate } from '../../vault/format.js'
import { ownerPaths } from '../../vault/paths.js'

const PREVIEW_COUNT = 5

function AssetTypeIcon({ type }) {
  const normalized = String(type || '').toLowerCase()
  if (normalized.includes('bank')) return <Landmark size={15} aria-hidden="true" />
  if (normalized.includes('crypto') || normalized.includes('wallet')) {
    return <Wallet size={15} aria-hidden="true" />
  }
  if (normalized.includes('social') || normalized.includes('online')) {
    return <Globe size={15} aria-hidden="true" />
  }
  if (normalized.includes('document')) return <FileText size={15} aria-hidden="true" />
  return <KeyRound size={15} aria-hidden="true" />
}

// Flow 2 — Owner Dashboard: totals and recent digital assets from GET /api/v1/assets.
export default function OwnerDashboardPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const isVi = language === 'vi'
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
          message: isVi
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            : 'Session expired. Please log in again.',
        },
      })
    }
  }, [error, navigate, location.pathname, isVi])

  const assetList = Array.isArray(assets) ? assets : []
  const assetTotal = assetList.length
  const assignedTotal = assetList.filter((a) => a.status === 'assigned').length
  const unassignedTotal = assetTotal - assignedTotal
  const assignedPercent = assetTotal > 0 ? Math.round((assignedTotal / assetTotal) * 100) : 0
  const unassignedPercent = assetTotal > 0 ? Math.round((unassignedTotal / assetTotal) * 100) : 0

  return (
    <OwnerLayout>
      <PageHeader
        scene="overview"
        hue="teal"
        eyebrow={new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        title={t.dashboard.welcome(user?.fullName || 'Owner')}
        description={
          isVi
            ? 'Quản lý tài sản số, người thụ hưởng và các điều kiện chuyển giao di sản an toàn.'
            : 'Manage digital assets, trusted contacts, and automated legacy handover.'
        }
        actions={
          <>
            <Button to={ownerPaths.newAsset()}>
              <Icon name="key" size={16} />
              {isVi ? 'Đăng ký tài sản' : 'Register Asset'}
            </Button>
            <Button to={ownerPaths.contacts} variant="secondary">
              <Icon name="users" size={16} />
              {isVi ? 'Mời người tin cậy' : 'Invite a trusted contact'}
            </Button>
          </>
        }
      />

      {status === 'loading' && (
        <div className="owner-overview-skeleton" role="status" aria-label={t.loading}>
          <div className="owner-overview-stats">
            <div className="owner-overview-skeleton__card" />
            <div className="owner-overview-skeleton__card" />
            <div className="owner-overview-skeleton__card" />
          </div>
          <div className="owner-overview-workflow-grid">
            <div className="owner-overview-skeleton__card owner-overview-skeleton__card--tall" />
            <div className="owner-overview-skeleton__card owner-overview-skeleton__card--tall" />
            <div className="owner-overview-skeleton__card owner-overview-skeleton__card--tall" />
          </div>
        </div>
      )}

      {status === 'error' && (
        <ErrorState
          message={error?.message || t.errors.generic}
          retryLabel={t.retry}
          onRetry={reload}
        />
      )}

      {status === 'ready' && (
        <>
          <dl className="owner-overview-stats">
            <div className="card owner-overview-stat">
              <div className="owner-overview-stat__top">
                <div>
                  <dt>{isVi ? 'Tổng số tài sản' : 'Total Assets'}</dt>
                  <dd data-testid="stat-assets">{assetTotal}</dd>
                </div>
                <span className="owner-overview-stat__icon" aria-hidden="true">
                  <KeyRound size={20} />
                </span>
              </div>
              <div className="owner-overview-bar" aria-hidden="true">
                <span
                  className="owner-overview-bar__fill"
                  style={{ width: assetTotal > 0 ? '100%' : '0%' }}
                />
              </div>
            </div>

            <div className="card owner-overview-stat">
              <div className="owner-overview-stat__top">
                <div>
                  <dt>{isVi ? 'Đã phân công' : 'Assigned'}</dt>
                  <dd data-testid="stat-assigned" style={{ color: 'var(--color-primary)' }}>
                    {assignedTotal}
                  </dd>
                </div>
                <span
                  className="owner-overview-stat__icon owner-overview-stat__icon--assigned"
                  aria-hidden="true"
                >
                  <CheckCircle2 size={20} />
                </span>
              </div>
              <div className="owner-overview-bar" aria-hidden="true">
                <span
                  className="owner-overview-bar__fill"
                  style={{ width: `${assignedPercent}%` }}
                />
              </div>
            </div>

            <div className="card owner-overview-stat">
              <div className="owner-overview-stat__top">
                <div>
                  <dt>{isVi ? 'Chưa phân công' : 'Unassigned'}</dt>
                  <dd data-testid="stat-unassigned" style={{ color: 'var(--color-muted)' }}>
                    {unassignedTotal}
                  </dd>
                </div>
                <span
                  className="owner-overview-stat__icon owner-overview-stat__icon--unassigned"
                  aria-hidden="true"
                >
                  <Clock size={20} />
                </span>
              </div>
              <div className="owner-overview-bar" aria-hidden="true">
                <span
                  className="owner-overview-bar__fill owner-overview-bar__fill--amber"
                  style={{ width: `${unassignedPercent}%` }}
                />
              </div>
            </div>
          </dl>

          <section className="page-section" aria-labelledby="flow-shortcuts-title">
            <h2 id="flow-shortcuts-title" className="section-title">
              {isVi ? 'Quy trình bàn giao & Bảo vệ di sản' : 'Handover & Protection Workflow'}
            </h2>
            <div className="owner-overview-workflow-grid">
              <article className="card owner-overview-flow-card">
                <div className="owner-overview-flow-card__head">
                  <span className="owner-overview-flow-card__icon" aria-hidden="true">
                    <Users size={20} />
                  </span>
                  <h3 className="owner-overview-flow-card__title">
                    {isVi ? 'Danh bạ tin cậy' : 'Contact Book'}
                  </h3>
                </div>
                <p className="owner-overview-flow-card__desc">
                  {isVi
                    ? 'Chỉ định danh sách người thụ hưởng và người thi hành di sản đáng tin cậy.'
                    : 'Manage trusted beneficiaries and executors who will oversee asset release.'}
                </p>
                <div className="owner-overview-flow-card__actions">
                  <Button to={ownerPaths.contacts} variant="secondary" size="sm" icon="arrowRight">
                    {isVi ? 'Mở danh bạ' : 'Open Contacts'}
                  </Button>
                </div>
              </article>

              <article className="card owner-overview-flow-card owner-overview-flow-card--assignments">
                <div className="owner-overview-flow-card__head">
                  <span className="owner-overview-flow-card__icon" aria-hidden="true">
                    <Layers size={20} />
                  </span>
                  <h3 className="owner-overview-flow-card__title">
                    {isVi ? 'Phân công di sản số' : 'Asset Assignments'}
                  </h3>
                </div>
                <p className="owner-overview-flow-card__desc">
                  {isVi
                    ? 'Phân chia tài sản số, chỉ định người thi hành và người thụ hưởng.'
                    : 'Allocate digital assets, set beneficiaries and executor handover instructions.'}
                </p>
                <div className="owner-overview-flow-card__actions">
                  <Button
                    to={ownerPaths.assignments}
                    variant="secondary"
                    size="sm"
                    icon="arrowRight"
                  >
                    {isVi ? 'Tạo phân công' : 'Start Wizard'}
                  </Button>
                </div>
              </article>

              <article className="card owner-overview-flow-card owner-overview-flow-card--dms">
                <div className="owner-overview-flow-card__head">
                  <span className="owner-overview-flow-card__icon" aria-hidden="true">
                    <Shield size={20} />
                  </span>
                  <h3 className="owner-overview-flow-card__title">Dead Man&apos;s Switch</h3>
                </div>
                <p className="owner-overview-flow-card__desc">
                  {isVi
                    ? 'Giám sát chu kỳ điểm danh định kỳ, cảnh báo ân hạn và kích hoạt bàn giao tự động.'
                    : 'Automated periodic check-in monitoring, grace warning, and emergency handoff.'}
                </p>
                <div className="owner-overview-flow-card__actions">
                  <Button to={ownerPaths.dms} variant="secondary" size="sm" icon="arrowRight">
                    {isVi ? 'Cấu hình công tắc' : 'Open Switch Monitor'}
                  </Button>
                </div>
              </article>
            </div>
          </section>

          <section className="page-section" aria-labelledby="assets-title">
            <div className="section-row">
              <h2 id="assets-title" className="section-title">
                {isVi ? 'Tài sản số của tôi' : 'My Digital Assets'}
              </h2>
              {assetTotal > 0 && (
                <Link to={ownerPaths.assets} className="owner-overview-section-link">
                  {isVi ? 'Xem tất cả tài sản' : 'View all assets'}
                  <Icon name="arrowRight" size={14} />
                </Link>
              )}
            </div>

            {assetTotal === 0 ? (
              <EmptyState
                icon="fileText"
                title={isVi ? 'Chưa có tài sản nào' : 'No assets registered yet'}
                text={
                  isVi
                    ? 'Bạn chưa đăng ký tài sản số nào. Hãy bắt đầu bảo vệ di sản của bạn bằng cách đăng ký tài sản đầu tiên.'
                    : 'You have not registered any digital assets yet. Begin securing your legacy by adding your first asset.'
                }
                action={
                  <Button to={ownerPaths.newAsset()}>
                    {isVi ? 'Đăng ký tài sản đầu tiên' : 'Register first asset'}
                  </Button>
                }
              />
            ) : (
              <div className="card asset-table">
                <div className="asset-table__row asset-table__row--head" aria-hidden="true">
                  <span>{isVi ? 'Tên tài sản' : 'Asset Name'}</span>
                  <span>{isVi ? 'Loại tài sản' : 'Type'}</span>
                  <span>{isVi ? 'Trạng thái' : 'Status'}</span>
                  <span>{isVi ? 'Ngày tạo' : 'Created'}</span>
                </div>
                <ul>
                  {assetList.slice(0, PREVIEW_COUNT).map((asset) => {
                    const id = asset.assetId || asset.id
                    const name = asset.assetName || asset.name
                    const type = asset.assetType || asset.type
                    const isAssigned = asset.status === 'assigned'
                    return (
                      <li key={id} className="asset-table__row owner-overview-asset-row">
                        <span className="owner-overview-asset-cell">
                          <span className="owner-overview-asset-chip-icon">
                            <AssetTypeIcon type={type} />
                          </span>
                          <Link
                            to={ownerPaths.asset(null, id)}
                            className="asset-table__name"
                            title={asset.description || name}
                          >
                            {name}
                          </Link>
                        </span>
                        <span>
                          <span className="badge">{t.assetTypes?.[type] || type}</span>
                        </span>
                        <span>
                          <span className={`badge ${isAssigned ? 'green' : 'amber'}`}>
                            {isAssigned
                              ? isVi
                                ? 'Đã phân công'
                                : 'Assigned'
                              : isVi
                              ? 'Chưa phân công'
                              : 'Unassigned'}
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
