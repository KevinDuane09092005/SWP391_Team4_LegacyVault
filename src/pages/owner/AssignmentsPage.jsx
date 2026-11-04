import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Wallet,
  CreditCard,
  FileText,
  Check,
  AlertTriangle,
  Info,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Plus,
  Layers,
  Users,
  Clock,
  Pencil,
} from 'lucide-react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { LoadingState } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getAssetsListApi, listVaults } from '../../services/vaultService.js'
import { getContactsApi } from '../../services/contactService.js'
import {
  validateAssignmentApi,
  createAssignmentApi,
  getAssignmentsListApi,
} from '../../services/assignmentService.js'
import { formatDisplayDate } from '../../vault/format.js'
import { ownerPaths } from '../../vault/paths.js'
import EditAssignmentModal from '../../components/vault/EditAssignmentModal.jsx'

const defaultInstructions = ``

const initials = (str) => {
  if (!str) return '?'
  const parts = str.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function AssignmentsPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const isVi = language === 'vi'
  const navigate = useNavigate()
  const location = useLocation()

  // Mode: 'list' (Assignments management) vs 'wizard' (Create Assignment Wizard)
  const [viewMode, setViewMode] = useState(() => {
    return location.search.includes('new') || location.search.includes('create') ? 'wizard' : 'list'
  })

  // List View State
  const [assignments, setAssignments] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState(null)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editSuccessMessage, setEditSuccessMessage] = useState(null)

  // Wizard States
  const [step, setStep] = useState(1)
  const [availableAssets, setAvailableAssets] = useState([])
  const [selectedAssetIds, setSelectedAssetIds] = useState([])
  const [contacts, setContacts] = useState([])
  const [beneficiaryIds, setBeneficiaryIds] = useState([])
  const [executorId, setExecutorId] = useState('')
  const [handoverInstructions, setHandoverInstructions] = useState(defaultInstructions)
  const [validating, setValidating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [createdAssignment, setCreatedAssignment] = useState(null)
  const [errors, setErrors] = useState([])

  // 1. Fetch Assignments List from GET /api/v1/assignments
  const fetchAssignments = useCallback(async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    setLoadingList(true)
    setListError(null)

    try {
      const data = await getAssignmentsListApi()
      if (Array.isArray(data)) {
        setAssignments(data)
      } else {
        setAssignments([])
      }
    } catch (err) {
      console.error('Fetch assignments error:', err)
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

      setListError(
        err.data?.error ||
        err.data?.message ||
        err.message ||
        (isVi ? 'Không thể tải danh sách hồ sơ bàn giao.' : 'Failed to fetch assignments list.'),
      )
    } finally {
      setLoadingList(false)
    }
  }, [isVi, location.pathname, navigate])

  // Load assignments on initial mount
  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  // 2. Fetch Assets & Contacts from backend for the Wizard
  useEffect(() => {
    async function loadWizardData() {
      const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
      if (!token) return

      // Load Assets
      try {
        const apiAssets = await getAssetsListApi()
        if (Array.isArray(apiAssets)) {
          const mapped = apiAssets.map((a) => ({
            id: a.assetId || a.id,
            name: a.assetName || a.name || 'Digital Asset',
            desc: `${a.assetType || 'Asset'} · ${a.status || 'Active'}`,
            icon: a.assetType === 'crypto_wallet' || a.assetType === 'Crypto Wallet' || a.assetType === 'CRYPTO' ? Wallet : CreditCard,
          }))
          setAvailableAssets(mapped)
          setSelectedAssetIds(mapped.length > 0 ? [mapped[0].id] : [])
        } else {
          setAvailableAssets([])
          setSelectedAssetIds([])
        }
      } catch {
        setAvailableAssets([])
        setSelectedAssetIds([])
      }

      // Load Contacts
      try {
        const apiContacts = await getContactsApi()
        if (Array.isArray(apiContacts)) {
          const mapped = apiContacts.map((c) => {
            const isBoth = (c.isBeneficiary && c.isExecutor) || c.expectedRole === 'Both' || c.role === 'Both'
            const isExec = !isBoth && (c.isExecutor || c.expectedRole === 'Executor' || c.role === 'Executor')
            let role = 'Beneficiary'
            if (isBoth) role = 'Both'
            else if (isExec) role = 'Executor'

            const rawStatus = (c.status || 'pending').toLowerCase()
            const status =
              rawStatus === 'verified'
                ? 'Verified'
                : rawStatus === 'rejected' || rawStatus === 'declined'
                ? 'Declined'
                : 'Pending'

            return {
              id: c.contactId || c.id,
              name: c.fullName || c.name || 'Contact',
              email: c.email || '',
              relationship: c.relationship || 'Friend',
              role,
              status,
            }
          })
          setContacts(mapped)

          const beneficiaries = mapped.filter(
            (c) => (c.role === 'Beneficiary' || c.role === 'Both') && c.status === 'Verified',
          )
          const executor = mapped.find(
            (c) => (c.role === 'Executor' || c.role === 'Both') && c.status === 'Verified',
          )

          setBeneficiaryIds(beneficiaries.map((b) => b.id))
          setExecutorId(executor ? executor.id : '')
        } else {
          setContacts([])
          setBeneficiaryIds([])
          setExecutorId('')
        }
      } catch {
        setContacts([])
        setBeneficiaryIds([])
        setExecutorId('')
      }
    }

    loadWizardData()
  }, [])

  const selectedBeneficiaries = contacts.filter((c) => beneficiaryIds.includes(c.id))
  const executorContact = contacts.find((c) => c.id === executorId)
  const selectedAssets = availableAssets.filter((a) => selectedAssetIds.includes(a.id))

  const stepsList = [
    isVi ? 'Chọn tài sản' : 'Select Asset',
    isVi ? 'Chọn người nhận' : 'Select People',
    isVi ? 'Phân bổ' : 'Allocation',
    isVi ? 'Kiểm tra lại' : 'Review',
  ]

  const toggleAsset = (id) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
    setErrors([])
  }

  const getUnverifiedContactMessage = (contact) => {
    if (!contact) return ''
    if (contact.status === 'Declined') {
      return isVi
        ? `Không thể gán "${contact.name}" (Đã từ chối): Người liên hệ này đã từ chối lời mời. Vui lòng chờ người liên hệ đồng ý thì bạn mới được gán.`
        : `Cannot assign "${contact.name}" (Declined): This contact declined the invitation. Please wait for the contact to accept before assigning.`
    }
    return isVi
      ? `Không thể gán "${contact.name}" (Chờ xác nhận): Vui lòng chờ người liên hệ đồng ý xác nhận qua email thì bạn mới được gán.`
      : `Cannot assign "${contact.name}" (Pending): Please wait for this contact to accept the invitation email before assigning.`
  }

  const toggleBeneficiary = (id) => {
    const target = contacts.find((c) => c.id === id)
    if (target && target.status !== 'Verified') {
      setErrors([getUnverifiedContactMessage(target)])
      return
    }
    setBeneficiaryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
    setErrors([])
  }

  // Handle Wizard Navigation & API Validation (Step 3)
  const handleNext = async () => {
    setErrors([])

    // Step 1 Validation
    if (step === 1) {
      if (!selectedAssetIds.length) {
        setErrors([isVi ? 'Vui lòng chọn ít nhất một tài sản.' : 'Select at least one asset.'])
        return
      }
      setStep(2)
      return
    }

    // Step 2 Validation
    if (step === 2) {
      const errs = []
      if (!beneficiaryIds.length) {
        errs.push(isVi ? 'Vui lòng chọn ít nhất một người thụ hưởng.' : 'Select at least one beneficiary.')
      }
      if (!executorId) {
        errs.push(isVi ? 'Vui lòng chỉ định một người thi hành.' : 'Select an executor.')
      }
      if (executorId && beneficiaryIds.includes(executorId)) {
        errs.push(
          isVi
            ? 'Người thi hành không được trùng với người thụ hưởng trong lượt phân công này.'
            : 'Executor cannot also be a beneficiary in this assignment.',
        )
      }
      if (errs.length > 0) {
        setErrors(errs)
        return
      }
      setStep(3)
      return
    }

    // Step 3 Validation: Call POST /api/v1/assignments/validate
    if (step === 3) {
      if (!handoverInstructions || !handoverInstructions.trim()) {
        setErrors([
          isVi ? 'Vui lòng nhập hướng dẫn và điều kiện bàn giao.' : 'Handover instructions cannot be empty.',
        ])
        return
      }

      const assetId = selectedAssetIds[0]
      if (!assetId) {
        setErrors([isVi ? 'Không tìm thấy ID tài sản đã chọn.' : 'Selected asset ID is missing.'])
        return
      }
      if (!executorId) {
        setErrors([isVi ? 'Không tìm thấy ID người thi hành.' : 'Executor contact ID is missing.'])
        return
      }
      if (!beneficiaryIds.length) {
        setErrors([
          isVi ? 'Cần ít nhất một người thụ hưởng.' : 'At least one beneficiary contact ID is required.',
        ])
        return
      }

      setValidating(true)
      try {
        const response = await validateAssignmentApi({
          assetId,
          executorContactId: executorId,
          handoverInstructions: handoverInstructions.trim(),
          beneficiaryContactIds: beneficiaryIds,
        })

        if (response && (response.valid === true || response.message)) {
          setValidationResult(response)
          setErrors([])
          setStep(4)
        } else {
          setErrors([
            response?.error ||
            (isVi ? 'Cấu hình bàn giao không hợp lệ.' : 'Assignment configuration is invalid.'),
          ])
        }
      } catch (err) {
        console.error('Validation error:', err)
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

        const errorMessage =
          err.data?.error ||
          err.data?.message ||
          err.message ||
          (isVi ? 'Thẩm định cấu hình bàn giao thất bại.' : 'Failed to validate assignment configuration.')

        setErrors([errorMessage])
      } finally {
        setValidating(false)
      }
      return
    }

    // Step 4: Call POST /api/v1/assignments to officially create the assignment
    if (step === 4) {
      const assetId = selectedAssetIds[0]
      const executorContactId = executorId
      const beneficiaryContactIds = beneficiaryIds

      setSubmitting(true)
      setErrors([])

      try {
        const response = await createAssignmentApi({
          assetId,
          executorContactId,
          handoverInstructions: handoverInstructions.trim(),
          beneficiaryContactIds,
        })

        if (response && (response.assignment || response.message)) {
          setCreatedAssignment(response.assignment || null)
          setErrors([])
          setStep(5) // Move to success step
        } else {
          setErrors([
            response?.error ||
            (isVi ? 'Không thể tạo hồ sơ bàn giao.' : 'Failed to create assignment.'),
          ])
        }
      } catch (err) {
        console.error('Create assignment error:', err)
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

        const errorMessage =
          err.data?.error ||
          err.data?.message ||
          err.message ||
          (isVi ? 'Không thể tạo hồ sơ bàn giao.' : 'Failed to create assignment.')

        setErrors([errorMessage])
      } finally {
        setSubmitting(false)
      }
    }
  }

  // ==========================================
  // VIEW 1: ASSIGNMENTS LIST (Quản lý bàn giao)
  // ==========================================
  if (viewMode === 'list') {
    return (
      <OwnerLayout>
        <div className="flow-page-head">
          <div>
            <h1>{isVi ? 'Quản lý bàn giao tài sản' : 'Asset Assignments'}</h1>
            <p>
              {isVi
                ? 'Danh sách các hồ sơ bàn giao, người thụ hưởng và người thi hành phụ trách cho từng tài sản số.'
                : 'Manage handover configurations, beneficiaries, and executors assigned to your digital assets.'}
            </p>
          </div>
          <Button
            onClick={() => {
              setViewMode('wizard')
              setStep(1)
              setErrors([])
            }}
          >
            <Plus size={16} />
            {isVi ? 'Tạo bàn giao mới' : 'New Assignment'}
          </Button>
        </div>

        {editSuccessMessage && (
          <div style={{ marginBottom: '16px' }}>
            <FormAlert tone="success">{editSuccessMessage}</FormAlert>
          </div>
        )}

        {listError && (
          <div style={{ marginBottom: '16px' }}>
            <FormAlert tone="error">{listError}</FormAlert>
          </div>
        )}

        {loadingList ? (
          <div style={{ padding: '40px 0' }}>
            <LoadingState
              label={isVi ? 'Đang tải danh sách hồ sơ bàn giao…' : 'Loading assignments list…'}
            />
          </div>
        ) : assignments.length === 0 ? (
          <div className="panel contact-panel">
            <div className="empty-state">
              <div className="empty-icon">
                <Layers size={36} strokeWidth={1.5} />
              </div>
              <h2>{isVi ? 'Chưa có cấu hình bàn giao nào' : 'No Assignments Yet'}</h2>
              <p>
                {isVi
                  ? 'Bạn chưa thiết lập hồ sơ bàn giao nào. Hãy bắt đầu bằng cách tạo cấu hình bàn giao tài sản đầu tiên.'
                  : 'You have not configured any asset assignments yet. Start by assigning an asset to your designated beneficiaries and executor.'}
              </p>
              <Button
                onClick={() => {
                  setViewMode('wizard')
                  setStep(1)
                  setErrors([])
                }}
              >
                <Plus size={16} />
                {isVi ? 'Tạo bàn giao mới' : 'Create New Assignment'}
              </Button>
            </div>
          </div>
        ) : (
          <section className="panel contact-panel">
            <div className="contact-table-wrap">
              <table className="contact-table">
                <thead>
                  <tr>
                    <th>{isVi ? 'Tài sản số' : 'Asset'}</th>
                    <th>{isVi ? 'Người thi hành' : 'Executor'}</th>
                    <th>{isVi ? 'Người thụ hưởng' : 'Beneficiaries'}</th>
                    <th>{isVi ? 'Ngày tạo' : 'Created Date'}</th>
                    <th>{isVi ? 'Trạng thái' : 'Status'}</th>
                    <th>{isVi ? 'Thao tác' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((item) => (
                    <tr key={item.assignmentId || item.id}>
                      <td className="strong">
                        <div>{item.assetName}</div>
                        <small style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
                          {item.assetType}
                        </small>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.executorName}</div>
                        <small style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>
                          {item.executorEmail || '—'}
                        </small>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', marginLeft: '4px' }}>
                            {item.beneficiaries?.slice(0, 3).map((b, i) => (
                              <span
                                key={b.contactId || i}
                                className="person-initial"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  fontSize: '0.6875rem',
                                  marginLeft: i > 0 ? '-8px' : 0,
                                  border: '2px solid var(--color-surface)',
                                }}
                                title={`${b.fullName} (${b.relationship || 'Beneficiary'})`}
                              >
                                {initials(b.fullName || b.name)}
                              </span>
                            ))}
                          </div>
                          <span style={{ fontSize: '0.875rem' }}>
                            {item.beneficiaries?.map((b) => b.fullName).join(', ') || '—'}
                          </span>
                        </div>
                      </td>
                      <td>{formatDisplayDate(item.createdAt)}</td>
                      <td>
                        <span className="badge green">
                          <CheckCircle2 size={12} style={{ marginRight: 4 }} />
                          {isVi ? 'Đang hiệu lực' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingAssignment(item)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Pencil size={13} style={{ marginRight: 4 }} />
                          {isVi ? 'Chỉnh sửa' : 'Edit'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <EditAssignmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingAssignment(null)
          }}
          asset={{
            assetId: editingAssignment?.assetId,
            assetName: editingAssignment?.assetName,
            assetType: editingAssignment?.assetType,
          }}
          currentAssignment={editingAssignment}
          onSuccess={(res) => {
            setEditSuccessMessage(
              res?.message || (isVi ? 'Cập nhật phân bổ tài sản thành công!' : 'Assignment updated successfully!'),
            )
            fetchAssignments()
            setTimeout(() => setEditSuccessMessage(null), 5000)
          }}
        />
      </OwnerLayout>
    )
  }

  // ==========================================
  // VIEW 2: NEW ASSIGNMENT WIZARD (Luồng gán tài sản)
  // ==========================================
  return (
    <OwnerLayout>
      <div className="flow-page-head">
        <div>
          <h1>{isVi ? 'Phân công di sản số' : 'Digital Asset Assignment'}</h1>
          <p>
            {isVi
              ? 'Thiết lập chỉ định người thụ hưởng, người thi hành và hướng dẫn bàn giao tài sản khi có sự kiện thừa kế.'
              : 'Configure designated beneficiaries, executors, and handover conditions for your digital assets.'}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            setViewMode('list')
            fetchAssignments()
          }}
        >
          {isVi ? 'Xem danh sách bàn giao' : 'View Assignments List'}
        </Button>
      </div>

      {step === 5 ? (
        <div className="success-center">
          <div className="success-card">
            <div className="success-icon">
              <Check size={32} />
            </div>
            <h2>{isVi ? 'Đã lưu cấu hình phân công thành công!' : 'Assignment Configuration Saved'}</h2>
            <p>
              {isVi
                ? `Hồ sơ bàn giao cho tài sản "${createdAssignment?.assetName || selectedAssets[0]?.name}" đã được tạo thành công trên hệ thống.`
                : `Assignment for "${createdAssignment?.assetName || selectedAssets[0]?.name}" has been successfully created in the system.`}
            </p>
            <div className="info-strip">
              <Info size={16} />
              <span>
                {isVi
                  ? 'Cấu hình bàn giao đã sẵn sàng. Chuyển giao tài sản thực tế sẽ được kích hoạt theo cơ chế Dead Man’s Switch.'
                  : 'Configuration is active. Handover will be triggered according to your Dead Man’s Switch rules.'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Button
                onClick={() => {
                  setStep(1)
                  setValidationResult(null)
                  setCreatedAssignment(null)
                  setErrors([])
                }}
                variant="secondary"
              >
                {isVi ? 'Tạo lượt phân công khác' : 'Create Another Assignment'}
              </Button>
              <Button
                onClick={() => {
                  setViewMode('list')
                  fetchAssignments()
                }}
              >
                {isVi ? 'Xem danh sách bàn giao' : 'Back to Assignments'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stepper Header */}
          <div className="stepper">
            {stepsList.map((label, idx) => (
              <React.Fragment key={label}>
                {idx > 0 && <div className={`step-line ${step > idx ? 'complete' : ''}`} />}
                <div
                  className={`step-item ${step === idx + 1 ? 'selected' : ''} ${step > idx + 1 ? 'complete' : ''
                    }`}
                >
                  <span className="step-circle">
                    {step > idx + 1 ? <Check size={14} /> : idx + 1}
                  </span>
                  <span>{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Select Assets */}
          {step === 1 && (
            <div className="panel">
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 6px', color: 'var(--color-heading)' }}>
                {isVi ? 'Bước 1: Chọn tài sản số cần phân công' : 'Step 1: Select Digital Assets to Assign'}
              </h2>
              <p className="selection-note">
                {isVi
                  ? `Chọn tài sản số để lập hồ sơ phân chia và bàn giao (Đã chọn: ${selectedAssetIds.length}).`
                  : `Select digital assets to assign (${selectedAssetIds.length} selected).`}
              </p>

              <div className="asset-selection-grid">
                {availableAssets.map((asset) => {
                  const IconComp = asset.icon || Wallet
                  const isChosen = selectedAssetIds.includes(asset.id)
                  return (
                    <button
                      type="button"
                      key={asset.id}
                      className={`asset-select-card ${isChosen ? 'chosen' : ''}`}
                      onClick={() => toggleAsset(asset.id)}
                    >
                      <div className="asset-top">
                        <span className="asset-icon">
                          <IconComp size={20} />
                        </span>
                        <span className={`asset-checkbox ${isChosen ? 'on' : ''}`}>
                          {isChosen && <Check size={14} />}
                        </span>
                      </div>
                      <b>{asset.name}</b>
                      <small>{asset.desc}</small>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Step 2: Select People */}
          {step === 2 && (
            <div className="panel">
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 6px', color: 'var(--color-heading)' }}>
                {isVi ? 'Bước 2: Chỉ định Người thụ hưởng & Người thi hành' : 'Step 2: Select People'}
              </h2>
              <p className="selection-note">
                {isVi
                  ? 'Chọn người thụ hưởng sẽ nhận tài sản và người thi hành giám sát bàn giao.'
                  : 'Choose who will receive these assets and who will oversee the handover process.'}
              </p>

              <div className="select-grid">
                <section>
                  <label className="flow-form-label">
                    {isVi ? '1. Người thụ hưởng (Beneficiaries)' : '1. Select Beneficiaries'}
                  </label>
                  {contacts
                    .filter((c) => c.role === 'Beneficiary' || c.role === 'Both')
                    .map((c) => {
                      const isPicked = beneficiaryIds.includes(c.id)
                      const isVerified = c.status === 'Verified'
                      const isDeclined = c.status === 'Declined'
                      return (
                        <div
                          key={c.id}
                          className={`person-card ${isPicked ? 'picked' : ''}`}
                          style={{ opacity: isVerified ? 1 : 0.65 }}
                          onClick={() => toggleBeneficiary(c.id)}
                        >
                          <span className="person-initial">{initials(c.name)}</span>
                          <div className="person-data">
                            <b>{c.name}</b>
                            <small>{c.email} • {c.relationship}</small>
                          </div>
                          <span className={`badge ${isVerified ? 'green' : isDeclined ? 'red' : 'amber'}`}>
                            {isVi
                              ? isVerified
                                ? 'Đã xác thực'
                                : isDeclined
                                ? 'Đã từ chối'
                                : 'Chờ xác nhận'
                              : c.status}
                          </span>
                        </div>
                      )
                    })}
                  {contacts.filter((c) => c.role === 'Beneficiary' || c.role === 'Both').length === 0 && (
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                      {isVi ? 'Chưa có người thụ hưởng nào trong Danh bạ.' : 'No beneficiaries in your Contact Book yet.'}
                    </p>
                  )}
                </section>

                <section>
                  <label className="flow-form-label">
                    {isVi ? '2. Người thi hành (Executor / Trustee)' : '2. Select Executor'}
                  </label>
                  {contacts
                    .filter((c) => c.role === 'Executor' || c.role === 'Both')
                    .map((c) => {
                      const isPicked = executorId === c.id
                      const isVerified = c.status === 'Verified'
                      const isDeclined = c.status === 'Declined'
                      return (
                        <div
                          key={c.id}
                          className={`person-card ${isPicked ? 'picked' : ''}`}
                          style={{ opacity: isVerified ? 1 : 0.65 }}
                          onClick={() => {
                            if (!isVerified) {
                              setErrors([getUnverifiedContactMessage(c)])
                              return
                            }
                            setExecutorId(c.id)
                            setErrors([])
                          }}
                        >
                          <span className="person-initial">{initials(c.name)}</span>
                          <div className="person-data">
                            <b>{c.name}</b>
                            <small>{c.email} • {c.relationship}</small>
                          </div>
                          <span className={`badge ${isVerified ? 'green' : isDeclined ? 'red' : 'amber'}`}>
                            {isVi
                              ? isVerified
                                ? 'Đã xác thực'
                                : isDeclined
                                ? 'Đã từ chối'
                                : 'Chờ xác nhận'
                              : c.status}
                          </span>
                        </div>
                      )
                    })}
                  {contacts.filter((c) => c.role === 'Executor' || c.role === 'Both').length === 0 && (
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.8125rem' }}>
                      {isVi ? 'Chưa có người thi hành nào trong Danh bạ.' : 'No executor in your Contact Book yet.'}
                    </p>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* Step 3: Allocation & Handover Instructions */}
          {step === 3 && (
            <div className="panel allocation-panel" style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '32px' }}>
              <div style={{ marginBottom: '28px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px', color: '#0F172A' }}>
                  {isVi ? 'Phân bổ & Hướng dẫn bàn giao' : 'Allocation & Handover Instructions'}
                </h2>
                <p style={{ margin: 0, color: '#64748B', fontSize: '0.9375rem' }}>
                  {isVi
                    ? 'Xác định cách phân chia tài sản cho người thụ hưởng và mô tả các điều kiện chính xác cho người thi hành.'
                    : 'Determine how assets are divided among your beneficiaries and describe precise conditions for the executor.'}
                </p>
              </div>

              {/* Section: Beneficiaries */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
                  {isVi ? 'Người thụ hưởng' : 'Beneficiaries'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0 0 18px' }}>
                  {isVi
                    ? 'Những người được chỉ định nhận tập hợp tài sản đã chọn.'
                    : 'People assigned to receive the selected asset collection.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selectedBeneficiaries.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: '#CCFBF1',
                          color: '#0D9488',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8125rem',
                          flexShrink: 0,
                        }}
                      >
                        {initials(c.name)}
                      </span>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1E293B' }}>
                        {c.name} {c.relationship ? `(${c.relationship})` : ''}
                      </span>
                    </div>
                  ))}

                  {selectedBeneficiaries.length === 0 && (
                    <p style={{ color: '#94A3B8', fontSize: '0.875rem', fontStyle: 'italic', margin: 0 }}>
                      {isVi ? 'Chưa có người thụ hưởng nào được chọn.' : 'No beneficiaries selected.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Section: Handover Instructions & Conditions */}
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: '0 0 4px' }}>
                  {isVi ? 'Hướng dẫn & Điều kiện bàn giao' : 'Handover Instructions & Conditions'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0 0 14px' }}>
                  {isVi
                    ? 'Chỉ định điều kiện kích hoạt, các bước hoặc tin nhắn tùy chỉnh mà người thi hành phải xử lý.'
                    : 'Specify the trigger conditions, steps, or custom messages the executor must process.'}
                </p>
                <textarea
                  className="handover-textarea"
                  rows={8}
                  style={{
                    width: '100%',
                    minHeight: '180px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '16px 18px',
                    fontSize: '0.9375rem',
                    lineHeight: '1.6',
                    color: '#1E293B',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  placeholder={
                    isVi
                      ? 'Nhập hướng dẫn bàn giao, điều kiện kích hoạt và cách phân chia (tỷ lệ %) trực tiếp bằng văn bản...'
                      : 'Enter handover instructions, trigger conditions, and allocation percentages...'
                  }
                  value={handoverInstructions}
                  onChange={(e) => {
                    setHandoverInstructions(e.target.value)
                    setErrors([])
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Review Configuration & Final Submit */}
          {step === 4 && (
            <div className="panel review-panel">
              <h2 style={{ fontSize: '1.25rem', margin: '0 0 6px', color: 'var(--color-heading)' }}>
                {isVi ? 'Bước 4: Kiểm tra lại toàn bộ cấu hình' : 'Step 4: Review Configuration'}
              </h2>
              <p>
                {isVi
                  ? 'Hãy kiểm tra kỹ thông tin phân công trước khi hoàn tất lưu trữ.'
                  : 'Double-check your allocation settings before confirming the assignment.'}
              </p>

              {validationResult?.message && (
                <div
                  className="state-notice green-notice"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    color: '#166534',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                  }}
                >
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span>
                    <b>{validationResult.message}</b>
                    {validationResult.assetName && ` · ${isVi ? 'Tài sản' : 'Asset'}: ${validationResult.assetName}`}
                    {validationResult.executorName && ` · ${isVi ? 'Người thi hành' : 'Executor'}: ${validationResult.executorName}`}
                    {validationResult.beneficiariesCount !== undefined &&
                      ` · ${isVi ? 'Số người thụ hưởng' : 'Beneficiaries count'}: ${validationResult.beneficiariesCount}`}
                  </span>
                </div>
              )}

              {selectedBeneficiaries.some((c) => c.status === 'Pending') && (
                <div className="state-notice amber-notice">
                  <AlertTriangle size={18} />
                  <span>
                    {isVi
                      ? `Lưu ý: Có người thụ hưởng (${selectedBeneficiaries
                        .filter((c) => c.status === 'Pending')
                        .map((c) => c.name)
                        .join(', ')}) đang ở trạng thái "Chờ xác thực".`
                      : `Warning: Some beneficiaries (${selectedBeneficiaries
                        .filter((c) => c.status === 'Pending')
                        .map((c) => c.name)
                        .join(', ')}) are in Pending status.`}
                  </span>
                </div>
              )}

              <div className="review-line">
                <span>{isVi ? 'Tài sản phân công' : 'Selected Assets'}</span>
                <b>{selectedAssets.map((a) => a.name).join(', ')}</b>
              </div>
              <div className="review-line">
                <span>{isVi ? 'Người thụ hưởng' : 'Beneficiaries'}</span>
                <b>
                  {selectedBeneficiaries
                    .map((c) => `${c.name}${c.relationship ? ` (${c.relationship})` : ''}`)
                    .join(', ')}
                </b>
              </div>
              <div className="review-line">
                <span>{isVi ? 'Người thi hành' : 'Executor'}</span>
                <b>{executorContact?.name || (isVi ? 'Chưa chọn' : 'Not selected')}</b>
              </div>
              <div className="review-line">
                <span>{isVi ? 'Hướng dẫn & Điều kiện bàn giao' : 'Handover Instructions'}</span>
                <b style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{handoverInstructions}</b>
              </div>
            </div>
          )}

          {/* Validation & Submit errors alert in red */}
          {errors.length > 0 && (
            <div
              className="validation-errors"
              role="alert"
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '14px 18px',
                borderRadius: '10px',
                marginTop: '16px',
              }}
            >
              {errors.map((msg) => (
                <p key={msg} style={{ margin: '4px 0', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} />
                  <span>{msg}</span>
                </p>
              ))}
            </div>
          )}

          {/* Step footer controls */}
          <div className="step-footer">
            <span style={{ color: '#64748B', fontSize: '0.875rem' }}>
              {isVi ? `Bước ${step} / 4` : `Step ${step} of 4`}
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {step > 1 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setStep((s) => s - 1)
                    setErrors([])
                  }}
                  disabled={validating || submitting}
                >
                  <ArrowLeft size={16} />
                  {isVi ? 'Quay lại' : 'Back'}
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={validating || submitting}
                style={{
                  background: '#0D6E6E',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: validating || submitting ? 'not-allowed' : 'pointer',
                  opacity: validating || submitting ? 0.7 : 1,
                }}
              >
                {validating || submitting ? (
                  <>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    {submitting
                      ? (isVi ? 'Đang lưu hồ sơ…' : 'Saving Assignment…')
                      : (isVi ? 'Đang thẩm định…' : 'Validating…')}
                  </>
                ) : step === 3 ? (
                  'Review & Save'
                ) : step === 4 ? (
                  isVi ? 'Lưu cấu hình' : 'Save Configuration'
                ) : (
                  <>
                    {isVi ? 'Tiếp tục' : 'Continue'}
                    <ArrowRight size={16} />
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </OwnerLayout>
  )
}
