import { useCallback, useEffect, useState } from 'react'
import { CircleAlert, FileCheck2, RefreshCw, Search } from 'lucide-react'
import Button from '../../components/Button.jsx'
import VerifierLayout from '../../components/verifier/VerifierLayout.jsx'
import {
  CaseCard,
  CaseDetail,
  DocumentPreviewModal,
} from '../../components/verifier/VerifierParts.jsx'
import { verifierContent } from '../../data/verifierContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getCaseDetail, listCases } from '../../services/verificationService.js'

export default function VerifierHistoryPage() {
  const { language } = useLanguage()
  const t = verifierContent[language] || verifierContent.en

  const [historyStatus, setHistoryStatus] = useState('APPROVED')
  const [cases, setCases] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [pageError, setPageError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [pageInfo, setPageInfo] = useState({ total_elements: 0, total_pages: 0 })
  const [modalDoc, setModalDoc] = useState(null)
  const [refreshCount, setRefreshCount] = useState(0)

  const refresh = useCallback(() => {
    setLoading(true)
    setPageError('')
    setRefreshCount((c) => c + 1)
  }, [])

  useEffect(() => {
    let ignore = false

    listCases({ status: historyStatus, search, page, size: 10 })
      .then((response) => {
        if (ignore) return
        const data = response?.content || []
        setCases(data)
        setPageInfo({
          total_elements: response?.total_elements || 0,
          total_pages: response?.total_pages || 0,
        })
        setSelectedId((old) =>
          data.some((row) => row.case_id === old) ? old : data[0]?.case_id || null
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
  }, [historyStatus, search, page, refreshCount])

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

  const handleStatusChange = (status) => {
    setHistoryStatus(status)
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

  return (
    <VerifierLayout>
      <header className="verifier-page-header">
        <div className="verifier-heading-copy">
          <span className="badge badge--accent">{t.badge}</span>
          <h1 className="page-title">{t.titles.history}</h1>
          <p className="page-text">{t.descriptions.history}</p>
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

        <div className="verifier-history-tabs">
          <button
            type="button"
            className={historyStatus === 'APPROVED' ? 'selected' : ''}
            onClick={() => handleStatusChange('APPROVED')}
          >
            {t.tabs.approved}
          </button>
          <button
            type="button"
            className={historyStatus === 'REJECTED' ? 'selected' : ''}
            onClick={() => handleStatusChange('REJECTED')}
          >
            {t.tabs.rejected}
          </button>
        </div>
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

      <section className="verifier-queue-list" aria-label="Verified cases">
        {loading ? (
          <div className="empty-list">
            <RefreshCw className="spin" size={24} />
            <span>{t.table.loadingCases}</span>
          </div>
        ) : cases.length ? (
          cases.map((record) => (
            <CaseCard
              key={record.case_id}
              record={record}
              active={selectedId === record.case_id}
              onClick={() => handleSelectCase(record.case_id)}
              t={t}
            />
          ))
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
          onApprove={() => {}}
          onReject={() => {}}
          onView={(doc) => setModalDoc(doc)}
          working={false}
          t={t}
        />
      ) : null}

      {modalDoc && (
        <DocumentPreviewModal
          doc={modalDoc}
          onClose={() => setModalDoc(null)}
          t={t}
        />
      )}
    </VerifierLayout>
  )
}
