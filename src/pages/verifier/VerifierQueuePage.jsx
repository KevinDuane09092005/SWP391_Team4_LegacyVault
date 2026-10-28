import { useCallback, useEffect, useState } from 'react'
import {
  CircleAlert,
  FileCheck2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import Button from '../../components/Button.jsx'
import VerifierLayout from '../../components/verifier/VerifierLayout.jsx'
import {
  ApproveDialog,
  CaseCard,
  CaseDetail,
  DocumentPreviewModal,
  RejectDialog,
} from '../../components/verifier/VerifierParts.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { verifierContent } from '../../data/verifierContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import {
  approveCase,
  getCaseDetail,
  listCases,
  rejectCase,
  startReview,
} from '../../services/verificationService.js'
import { canReview } from '../../vault/verificationRules.js'

export default function VerifierQueuePage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = verifierContent[language] || verifierContent.en

  const [cases, setCases] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [pageInfo, setPageInfo] = useState({ total_elements: 0, total_pages: 0 })
  const [refreshCount, setRefreshCount] = useState(0)
  const [modal, setModal] = useState(null)
  const [modalError, setModalError] = useState('')
  const [working, setWorking] = useState(false)

  const refresh = useCallback(() => {
    setLoading(true)
    setPageError('')
    setRefreshCount((c) => c + 1)
  }, [])

  // Load cases list
  useEffect(() => {
    let ignore = false

    listCases({ status: statusFilter, search, page, size: 10 })
      .then((response) => {
        if (ignore) return
        const data = Array.isArray(response)
          ? response
          : (response?.content || response?.cases || response?.data || [])
        setCases(data)
        setPageInfo({
          total_elements:
            response?.total_elements ||
            response?.totalElements ||
            (Array.isArray(response) ? response.length : 0),
          total_pages:
            response?.total_pages ||
            response?.totalPages ||
            1,
        })
        setSelectedId((old) =>
          data.some((row) => (row.case_id || row.id || row.caseId) === old)
            ? old
            : (data[0]?.case_id || data[0]?.id || data[0]?.caseId || null)
        )
      })
      .catch((error) => {
        if (!ignore) {
          setPageError(error.message)
          setCases([])
          setSelectedId(null)
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [statusFilter, search, page, refreshCount])

  // Load case detail
  useEffect(() => {
    if (!selectedId) return
    let ignore = false

    getCaseDetail(selectedId)
      .then((data) => {
        if (!ignore) setDetail(data)
      })
      .catch((err) => {
        if (!ignore) setDetailError(err.message)
      })
      .finally(() => {
        if (!ignore) setDetailLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [selectedId, refreshCount])

  const handleSearchChange = (value) => {
    setSearch(value)
    setPage(0)
    setLoading(true)
  }

  const handleStatusChange = (value) => {
    setStatusFilter(value)
    setPage(0)
    setLoading(true)
  }

  const handleSelectCase = (id) => {
    if (id !== selectedId) {
      setSelectedId(id)
      setDetail(null)
      setDetailError('')
      setDetailLoading(true)
    }
  }

  const newReview = () => {
    const target = cases.find((record) => canReview(record.status))
    if (target) {
      handleSelectCase(target.case_id)
      document
        .querySelector('.case-detail-section')
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      setPageError(t.errors.noReviewableCases)
    }
  }

  const confirmApprove = async (payload) => {
    if (!detail) return
    setWorking(true)
    setModalError('')
    try {
      if (detail.status === 'SUBMITTED' || detail.status === 'PENDING') {
        try {
          await startReview(detail.case_id)
        } catch {
          // ignore
        }
      }
      await approveCase(detail.case_id, payload, user)
      setModal(null)
      refresh()
    } catch (err) {
      setModalError(err.message || 'Approval failed.')
    } finally {
      setWorking(false)
    }
  }

  const confirmReject = async (reason) => {
    if (!detail) return
    setWorking(true)
    setModalError('')
    try {
      await rejectCase(detail.case_id, reason, user)
      setModal(null)
      refresh()
    } catch (err) {
      setModalError(err.message || 'Rejection failed.')
    } finally {
      setWorking(false)
    }
  }

  return (
    <VerifierLayout>
      <header className="verifier-page-header">
        <div className="verifier-heading-copy">
          <span className="badge badge--accent">{t.badge}</span>
          <h1 className="page-title">{t.titles.queue}</h1>
          <p className="page-text">{t.descriptions.queue}</p>
        </div>
      </header>

      <div className="verifier-toolbar">
        <label className="verifier-search-field">
          <Search size={16} />
          <input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t.table.searchPlaceholder}
            aria-label={t.table.searchPlaceholder}
          />
        </label>

        <label className="verifier-filter-field">
          <SlidersHorizontal size={15} />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="ALL">{t.statusLabels.ALL}</option>
            <option value="SUBMITTED">{t.statusLabels.SUBMITTED}</option>
            <option value="UNDER_REVIEW">{t.statusLabels.UNDER_REVIEW}</option>
            <option value="APPROVED">{t.statusLabels.APPROVED}</option>
            <option value="REJECTED">{t.statusLabels.REJECTED}</option>
          </select>
        </label>
      </div>

      {pageError && (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{pageError}</span>
          <button type="button" onClick={refresh}>
            {t.actions.retry}
          </button>
        </div>
      )}

      <section className="verifier-queue-list" aria-label="Verification cases">
        {loading ? (
          <div className="empty-list">
            <RefreshCw className="spin" size={24} />
            <span>{t.table.loadingCases}</span>
          </div>
        ) : cases.length ? (
          cases.map((record, idx) => {
            const caseKey = record.case_id || record.id || record.caseId || record.case_number || `verifier-case-${idx}`
            const caseId = record.case_id || record.id || record.caseId || record.case_number
            return (
              <CaseCard
                key={caseKey}
                record={record}
                active={selectedId === caseId}
                onClick={() => handleSelectCase(caseId)}
                t={t}
              />
            )
          })
        ) : (
          <div className="empty-list">
            <FileCheck2 size={28} />
            <strong>{t.table.noCasesFound}</strong>
            <small>{t.table.noCasesHint}</small>
          </div>
        )}
      </section>

      {pageInfo.total_pages > 1 && (
        <div className="pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => {
              setPage((p) => p - 1)
              setLoading(true)
            }}
          >
            {t.actions.previous}
          </Button>
          <span>{t.actions.pageOf(page + 1, pageInfo.total_pages)}</span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page + 1 >= pageInfo.total_pages || loading}
            onClick={() => {
              setPage((p) => p + 1)
              setLoading(true)
            }}
          >
            {t.actions.next}
          </Button>
        </div>
      )}

      {detailLoading ? (
        <div className="detail-pending">{t.detail.loadingDetail}</div>
      ) : detailError ? (
        <div className="error-banner" role="alert">
          <CircleAlert size={17} />
          <span>{detailError}</span>
        </div>
      ) : detail ? (
        <CaseDetail
          record={detail}
          onApprove={() => {
            setModalError('')
            setModal({ type: 'approve' })
          }}
          onReject={() => {
            setModalError('')
            setModal({ type: 'reject' })
          }}
          onView={(doc) => setModal({ type: 'file', doc })}
          working={working}
          t={t}
        />
      ) : null}

      {modal?.type === 'approve' && detail && (
        <ApproveDialog
          key={detail.case_id}
          record={detail}
          close={() => setModal(null)}
          confirm={confirmApprove}
          working={working}
          error={modalError}
          t={t}
        />
      )}

      {modal?.type === 'reject' && detail && (
        <RejectDialog
          key={detail.case_id}
          record={detail}
          close={() => setModal(null)}
          confirm={confirmReject}
          working={working}
          error={modalError}
          t={t}
        />
      )}

      {modal?.type === 'file' && (
        <DocumentPreviewModal
          doc={modal.doc}
          onClose={() => setModal(null)}
          t={t}
        />
      )}
    </VerifierLayout>
  )
}
