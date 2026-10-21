import React, { useState, useEffect } from 'react'
import Button from '../Button.jsx'
import FormAlert from '../auth/FormAlert.jsx'
import Icon from '../Icon.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getContactsApi } from '../../services/contactService.js'
import { updateAssignmentByAssetIdApi, createAssignmentApi } from '../../services/assignmentService.js'

const initials = (str) => {
  if (!str) return '?'
  const parts = str.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function EditAssignmentModal({
  isOpen,
  onClose,
  asset,
  currentAssignment,
  onSuccess,
}) {
  const { language } = useLanguage()
  const isVi = language === 'vi'

  const [contacts, setContacts] = useState([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [executorContactId, setExecutorContactId] = useState('')
  const [beneficiaryContactIds, setBeneficiaryContactIds] = useState([])
  const [handoverInstructions, setHandoverInstructions] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Fetch contacts whenever modal opens
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setLoadingContacts(true)
    setError(null)
    setSuccessMessage(null)

    async function loadContacts() {
      try {
        const list = await getContactsApi()
        if (!isMounted) return

        const mapped = (Array.isArray(list) ? list : []).map((c) => {
          const contactId = c.contactId || c.id || ''
          const name = c.fullName || c.name || ''
          const isBoth = (c.isBeneficiary && c.isExecutor) || c.expectedRole === 'Both' || c.role === 'Both'
          const isExec = !isBoth && (c.isExecutor || c.expectedRole === 'Executor' || c.role === 'Executor')
          let role = 'Beneficiary'
          if (isBoth) role = 'Both'
          else if (isExec) role = 'Executor'

          return {
            id: contactId,
            contactId,
            name,
            fullName: name,
            email: c.email || '',
            relationship: c.relationship || '',
            role,
          }
        })

        setContacts(mapped)

        // Pre-fill fields from currentAssignment if available
        if (currentAssignment) {
          // Executor
          let initialExecId = currentAssignment.executorContactId || currentAssignment.executorId || ''
          if (!initialExecId && currentAssignment.executorEmail) {
            const foundExec = mapped.find(
              (c) => c.email?.toLowerCase() === currentAssignment.executorEmail?.toLowerCase(),
            )
            if (foundExec) initialExecId = foundExec.id
          }
          if (!initialExecId && currentAssignment.executorName) {
            const foundExec = mapped.find((c) => c.name === currentAssignment.executorName)
            if (foundExec) initialExecId = foundExec.id
          }
          setExecutorContactId(initialExecId)

          // Beneficiaries
          let initialBeneIds = []
          if (Array.isArray(currentAssignment.beneficiaryContactIds) && currentAssignment.beneficiaryContactIds.length > 0) {
            initialBeneIds = currentAssignment.beneficiaryContactIds
          } else if (Array.isArray(currentAssignment.beneficiaries) && currentAssignment.beneficiaries.length > 0) {
            initialBeneIds = currentAssignment.beneficiaries
              .map((b) => {
                if (b.contactId || b.id) return b.contactId || b.id
                const found = mapped.find(
                  (c) =>
                    (b.email && c.email?.toLowerCase() === b.email?.toLowerCase()) ||
                    c.name === (b.fullName || b.name),
                )
                return found?.id
              })
              .filter(Boolean)
          }
          setBeneficiaryContactIds(initialBeneIds)

          // Instructions
          setHandoverInstructions(currentAssignment.handoverInstructions || '')
        } else {
          // Unassigned defaults
          const defaultExec = mapped.find((c) => c.role === 'Executor' || c.role === 'Both')
          if (defaultExec) setExecutorContactId(defaultExec.id)

          const defaultBenes = mapped.filter((c) => c.role === 'Beneficiary').map((c) => c.id)
          setBeneficiaryContactIds(defaultBenes)
          setHandoverInstructions('')
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load contacts for assignment:', err)
        setError(isVi ? 'Không thể tải danh sách liên hệ.' : 'Failed to load contacts.')
      } finally {
        if (isMounted) setLoadingContacts(false)
      }
    }

    loadContacts()

    return () => {
      isMounted = false
    }
  }, [isOpen, currentAssignment, isVi])

  if (!isOpen) return null

  const handleExecutorChange = (e) => {
    const newId = e.target.value
    setExecutorContactId(newId)
    // Prevent executor from being in beneficiaries
    if (newId && beneficiaryContactIds.includes(newId)) {
      setBeneficiaryContactIds((prev) => prev.filter((id) => id !== newId))
    }
    setError(null)
  }

  const toggleBeneficiary = (contactId) => {
    if (contactId === executorContactId) return
    setBeneficiaryContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    )
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!executorContactId) {
      setError(isVi ? 'Vui lòng chọn Người thi hành (Executor).' : 'Please select an Executor.')
      return
    }

    if (!beneficiaryContactIds || beneficiaryContactIds.length === 0) {
      setError(
        isVi
          ? 'Vui lòng chọn ít nhất một Người thụ hưởng (Beneficiary).'
          : 'Please select at least one Beneficiary.',
      )
      return
    }

    if (beneficiaryContactIds.includes(executorContactId)) {
      setError(
        isVi
          ? 'Người thi hành không được trùng với Người thụ hưởng.'
          : 'Executor cannot also be a Beneficiary.',
      )
      return
    }

    const assetId = asset?.assetId || asset?.id
    if (!assetId) {
      setError(isVi ? 'Không tìm thấy mã tài sản.' : 'Asset ID is missing.')
      return
    }

    setIsSubmitting(true)

    const payload = {
      executorContactId,
      handoverInstructions: handoverInstructions.trim(),
      beneficiaryContactIds,
    }

    try {
      let response
      try {
        // Gọi API PUT /api/v1/assignments/asset/{assetId}
        response = await updateAssignmentByAssetIdApi(assetId, payload)
      } catch (apiErr) {
        // Fallback: Nếu tài sản chưa từng có hồ sơ bàn giao (404), tạo mới hồ sơ
        if (apiErr.status === 404 || !currentAssignment) {
          response = await createAssignmentApi({
            assetId,
            ...payload,
          })
        } else {
          throw apiErr
        }
      }

      setSuccessMessage(
        response?.message ||
          (isVi ? 'Cập nhật cấu hình phân bổ thành công!' : 'Assignment updated successfully!'),
      )

      setTimeout(() => {
        if (onSuccess) onSuccess(response)
        onClose()
      }, 700)
    } catch (err) {
      console.error('Submit assignment update error:', err)
      setError(
        err.data?.error ||
          err.data?.message ||
          err.message ||
          (isVi ? 'Không thể cập nhật cấu hình bàn giao.' : 'Failed to update assignment.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const assetName = asset?.assetName || asset?.name || (isVi ? 'Tài sản' : 'Asset')
  const assetType = asset?.assetType || asset?.type || ''

  return (
    <div className="flow-modal-overlay" onMouseDown={onClose}>
      <div
        className="flow-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: '620px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '16px',
            marginBottom: '18px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-primary-soft, rgba(14, 165, 233, 0.1))',
                  color: 'var(--color-primary, #0ea5e9)',
                }}
              >
                <Icon name="pencil" size={16} />
              </span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-heading)' }}>
                {isVi ? 'Chỉnh sửa tài sản & phân bổ' : 'Edit Asset Assignment'}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              {isVi ? 'Tài sản:' : 'Asset:'}{' '}
              <strong style={{ color: 'var(--color-heading)' }}>{assetName}</strong>
              {assetType && (
                <span
                  className="badge"
                  style={{ marginLeft: '8px', fontSize: '0.75rem', padding: '2px 8px' }}
                >
                  {assetType}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-muted)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {error && (
            <div style={{ marginBottom: '14px' }}>
              <FormAlert tone="error">{error}</FormAlert>
            </div>
          )}

          {successMessage && (
            <div style={{ marginBottom: '14px' }}>
              <FormAlert tone="success">{successMessage}</FormAlert>
            </div>
          )}

          {loadingContacts ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-muted)' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  border: '3px solid var(--color-border)',
                  borderTopColor: 'var(--color-primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                {isVi ? 'Đang tải danh bạ người liên hệ...' : 'Loading contacts...'}
              </p>
            </div>
          ) : (
            <form id="edit-assignment-form" onSubmit={handleSubmit}>
              {/* Field 1: Executor */}
              <div style={{ marginBottom: '18px' }}>
                <label className="flow-form-label" htmlFor="executor-select" style={{ marginTop: 0 }}>
                  {isVi ? 'Người thi hành (Executor)' : 'Handover Executor'}
                  <span style={{ color: 'var(--color-danger, #ef4444)', marginLeft: '4px' }}>*</span>
                </label>
                <select
                  id="executor-select"
                  value={executorContactId}
                  onChange={handleExecutorChange}
                  required
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    padding: '0 12px',
                    fontSize: '0.875rem',
                  }}
                >
                  <option value="">
                    {isVi ? '-- Chọn Người thi hành --' : '-- Select Executor --'}
                  </option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.relationship ? `(${c.relationship})` : ''} — {c.email}
                      {c.role === 'Executor' ? ' [Executor]' : ''}
                    </option>
                  ))}
                </select>
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                  {isVi
                    ? 'Người sẽ nhận hướng dẫn và trực tiếp thực thi việc giải phóng/bàn giao tài sản.'
                    : 'The person authorized to receive credentials and coordinate handover upon activation.'}
                </p>
              </div>

              {/* Field 2: Beneficiaries */}
              <div style={{ marginBottom: '18px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: '8px',
                  }}
                >
                  <label className="flow-form-label" style={{ margin: 0 }}>
                    {isVi ? 'Người thụ hưởng (Beneficiaries)' : 'Designated Beneficiaries'}
                    <span style={{ color: 'var(--color-danger, #ef4444)', marginLeft: '4px' }}>*</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    {isVi ? 'Đã chọn:' : 'Selected:'} {beneficiaryContactIds.length}
                  </span>
                </div>

                {contacts.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      background: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed var(--color-border)',
                      fontSize: '0.85rem',
                      color: 'var(--color-muted)',
                      textAlign: 'center',
                    }}
                  >
                    {isVi
                      ? 'Chưa có liên hệ nào trong danh bạ. Vui lòng thêm liên hệ tại trang Quản lý liên hệ.'
                      : 'No contacts available. Please add contacts to your directory first.'}
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: '190px',
                      overflowY: 'auto',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-subtle)',
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {contacts.map((c) => {
                      const isSelected = beneficiaryContactIds.includes(c.id)
                      const isCurrentExec = c.id === executorContactId

                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            if (!isCurrentExec) toggleBeneficiary(c.id)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: isSelected
                              ? 'var(--color-surface)'
                              : isCurrentExec
                              ? 'transparent'
                              : 'var(--color-surface)',
                            opacity: isCurrentExec ? 0.45 : 1,
                            cursor: isCurrentExec ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isCurrentExec}
                            onChange={() => toggleBeneficiary(c.id)}
                            style={{ width: '16px', height: '16px', cursor: isCurrentExec ? 'not-allowed' : 'pointer' }}
                          />
                          <span
                            className="person-initial"
                            style={{
                              width: '28px',
                              height: '28px',
                              fontSize: '0.7rem',
                              flexShrink: 0,
                              background: isSelected ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)',
                              color: isSelected ? 'var(--color-primary)' : 'var(--color-muted)',
                            }}
                          >
                            {initials(c.name)}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.825rem',
                                fontWeight: 600,
                                color: 'var(--color-heading)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>{c.name}</span>
                              {c.relationship && (
                                <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: '0.75rem' }}>
                                  ({c.relationship})
                                </span>
                              )}
                              {isCurrentExec && (
                                <span
                                  className="badge"
                                  style={{
                                    fontSize: '0.65rem',
                                    padding: '1px 5px',
                                    backgroundColor: 'var(--color-surface-muted)',
                                  }}
                                >
                                  {isVi ? 'Đang là Người thi hành' : 'Executor'}
                                </span>
                              )}
                            </div>
                            <small style={{ color: 'var(--color-muted)', fontSize: '0.75rem', display: 'block' }}>
                              {c.email}
                            </small>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Field 3: Handover Instructions */}
              <div style={{ marginBottom: '18px' }}>
                <label className="flow-form-label" htmlFor="instructions-text">
                  {isVi ? 'Chỉ dẫn bàn giao & Phân bổ (Handover Instructions)' : 'Handover Instructions'}
                </label>
                <textarea
                  id="instructions-text"
                  rows={4}
                  value={handoverInstructions}
                  onChange={(e) => setHandoverInstructions(e.target.value)}
                  placeholder={
                    isVi
                      ? 'Ví dụ: Bàn giao sau khi kích hoạt DMS 90 ngày.\nPhân bổ tỷ lệ:\n• Người thụ hưởng A: 70%\n• Người thụ hưởng B: 30%'
                      : 'Updated instructions: Transfer upon DMS trigger after 90 days.\nSplit allocation:\n• Tran Thi B (Spouse): 70%\n• Nguyen Van C (Friend): 30%'
                  }
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                  {isVi
                    ? 'Chỉ dẫn chi tiết phân chia tài sản, mật khẩu giải mã hoặc điều kiện giải ngân cho Người thi hành.'
                    : 'Detail allocation percentages, trigger terms, or conditions for the executor.'}
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '16px',
            marginTop: '12px',
          }}
        >
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {isVi ? 'Hủy' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            form="edit-assignment-form"
            variant="primary"
            disabled={isSubmitting || loadingContacts}
          >
            {isSubmitting
              ? isVi
                ? 'Đang lưu...'
                : 'Saving...'
              : isVi
              ? 'Lưu thay đổi'
              : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
