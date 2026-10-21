import React, { useState, useEffect } from 'react'
import Button from '../Button.jsx'
import FormAlert from '../auth/FormAlert.jsx'
import FormField from '../auth/FormField.jsx'
import Icon from '../Icon.jsx'
import { ASSET_TYPES, getTypeFields } from '../../vault/assetTypes.js'
import { DOCUMENT_RULES, formatFileSize, checkNewFiles } from '../../vault/documentRules.js'
import { vaultContent } from '../../data/vaultContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { updateAssetApi } from '../../services/vaultService.js'

// Mapping giữa code hệ thống và tên loại tài sản backend API
const RAW_TO_BACKEND = {
  BANK_ACCOUNT: 'Bank Account',
  CRYPTO_WALLET: 'Crypto Wallet',
  SOCIAL_MEDIA: 'Social Media',
  IMPORTANT_DOCUMENT: 'Important Document',
  OTHER: 'Other',
}

const BACKEND_TO_RAW = {
  'Bank Account': 'BANK_ACCOUNT',
  'bank account': 'BANK_ACCOUNT',
  'BANK_ACCOUNT': 'BANK_ACCOUNT',
  'Crypto Wallet': 'CRYPTO_WALLET',
  'crypto wallet': 'CRYPTO_WALLET',
  'CRYPTO_WALLET': 'CRYPTO_WALLET',
  'Social Media': 'SOCIAL_MEDIA',
  'social media': 'SOCIAL_MEDIA',
  'SOCIAL_MEDIA': 'SOCIAL_MEDIA',
  'Important Document': 'IMPORTANT_DOCUMENT',
  'important document': 'IMPORTANT_DOCUMENT',
  'IMPORTANT_DOCUMENT': 'IMPORTANT_DOCUMENT',
  'Other': 'OTHER',
  'other': 'OTHER',
  'OTHER': 'OTHER',
}

export default function EditAssetModal({ isOpen, onClose, asset, onSuccess }) {
  const { language } = useLanguage()
  const isVi = language === 'vi'
  const t = vaultContent[language]

  const [formValues, setFormValues] = useState({
    type: ASSET_TYPES.CRYPTO_WALLET,
    name: '',
    description: '',
    handoverNotes: '',
    attachmentUrl: '',
    bankName: '',
    accountHolder: '',
    accountLast4: '',
    walletName: '',
    network: '',
    publicAddress: '',
    platform: '',
    username: '',
    documentTitle: '',
    documentType: '',
    category: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [files, setFiles] = useState([])
  const [rejectedFiles, setRejectedFiles] = useState([])

  // Khởi tạo và điền dữ liệu tài sản vào form khi mở modal
  useEffect(() => {
    if (!isOpen || !asset) return

    const rawType =
      BACKEND_TO_RAW[asset.assetType] ||
      BACKEND_TO_RAW[asset.type] ||
      asset.type ||
      ASSET_TYPES.CRYPTO_WALLET

    const initial = {
      type: rawType,
      name: asset.assetName || asset.name || '',
      description: asset.description || '',
      handoverNotes: asset.handoverNotes || '',
      attachmentUrl: asset.attachmentUrl || '',
      bankName: asset.details?.bankName || '',
      accountHolder: asset.details?.accountHolder || '',
      accountLast4: asset.details?.accountLast4 || '',
      walletName: asset.details?.walletName || '',
      network: asset.details?.network || '',
      publicAddress: asset.details?.publicAddress || '',
      platform: asset.details?.platform || '',
      username: asset.details?.username || '',
      documentTitle: asset.details?.documentTitle || '',
      documentType: asset.details?.documentType || '',
      category: asset.details?.category || '',
    }

    // Nếu decryptedCredentials có dạng ghép chuỗi, bóc tách để điền vào trường tương ứng
    if (asset.decryptedCredentials) {
      const parts = asset.decryptedCredentials.split(' | ')
      for (const part of parts) {
        const colonIdx = part.indexOf(': ')
        if (colonIdx !== -1) {
          const key = part.slice(0, colonIdx).trim().toLowerCase()
          const val = part.slice(colonIdx + 2).trim()
          if (key === 'bank' && !initial.bankName) initial.bankName = val
          if (key === 'holder' && !initial.accountHolder) initial.accountHolder = val
          if (key === 'last4' && !initial.accountLast4) initial.accountLast4 = val
          if (key === 'wallet' && !initial.walletName) initial.walletName = val
          if (key === 'network' && !initial.network) initial.network = val
          if (key === 'address' && !initial.publicAddress) initial.publicAddress = val
          if (key === 'platform' && !initial.platform) initial.platform = val
          if (key === 'username' && !initial.username) initial.username = val
          if (key === 'title' && !initial.documentTitle) initial.documentTitle = val
          if (key === 'type' && !initial.documentType) initial.documentType = val
          if (key === 'category' && !initial.category) initial.category = val
          if (key === 'notes' && !initial.handoverNotes) initial.handoverNotes = val
        }
      }
    }

    setFormValues(initial)
    if (asset.attachmentUrl) {
      const fileName = asset.attachmentUrl.split('/').pop() || (isVi ? 'Tài liệu đính kèm.pdf' : 'attachment.pdf')
      setFiles([
        {
          id: 'existing-doc-1',
          name: fileName,
          size: 1024 * 256,
        },
      ])
    } else {
      setFiles([])
    }
    setRejectedFiles([])
    setError(null)
    setSuccessMessage(null)
  }, [isOpen, asset, isVi])

  if (!isOpen) return null

  const maxSize = formatFileSize(DOCUMENT_RULES.maxSizeBytes)
  const reasonText = (reason) => {
    if (reason === 'size') return t.documents.reasons.size(maxSize)
    if (reason === 'count') return t.documents.reasons.count(DOCUMENT_RULES.maxFiles)
    return t.documents.reasons[reason]
  }

  const handleFileChange = (event) => {
    const picked = Array.from(event.target.files)
    if (!picked.length) return
    const { accepted, rejected } = checkNewFiles(picked, files)
    setRejectedFiles(rejected)
    if (accepted.length > 0) {
      const updated = [...files, ...accepted]
      setFiles(updated)
      const storageUrl = `https://storage.legacyvault.com/docs/${accepted[0].name}`
      setFormValues((prev) => ({ ...prev, attachmentUrl: storageUrl }))
    }
    event.target.value = ''
  }

  const handleRemoveFile = (fileId) => {
    const remaining = files.filter((f) => f.id !== fileId)
    setFiles(remaining)
    setRejectedFiles([])
    if (remaining.length === 0) {
      setFormValues((prev) => ({ ...prev, attachmentUrl: '' }))
    } else {
      const nextUrl = remaining[0].name ? `https://storage.legacyvault.com/docs/${remaining[0].name}` : ''
      setFormValues((prev) => ({ ...prev, attachmentUrl: nextUrl }))
    }
  }

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const typeOptions = Object.values(ASSET_TYPES).map((type) => ({
    value: type,
    label: t.assetTypes[type],
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const trimmedName = formValues.name.trim()
    const trimmedType = formValues.type

    if (!trimmedName) {
      setError(isVi ? 'Vui lòng nhập tên tài sản.' : 'Asset name is required.')
      return
    }

    if (!trimmedType) {
      setError(isVi ? 'Vui lòng chọn loại tài sản.' : 'Asset type is required.')
      return
    }

    const assetId = asset?.assetId || asset?.id
    if (!assetId) {
      setError(isVi ? 'Không tìm thấy ID tài sản.' : 'Asset ID is missing.')
      return
    }

    setIsSubmitting(true)

    // Tự động tổng hợp credentials từ các trường con giống hệt Create Asset
    const parts = []
    if (trimmedType === 'BANK_ACCOUNT') {
      if (formValues.bankName?.trim()) parts.push(`Bank: ${formValues.bankName.trim()}`)
      if (formValues.accountHolder?.trim()) parts.push(`Holder: ${formValues.accountHolder.trim()}`)
      if (formValues.accountLast4?.trim()) parts.push(`Last4: ${formValues.accountLast4.trim()}`)
    } else if (trimmedType === 'CRYPTO_WALLET') {
      if (formValues.walletName?.trim()) parts.push(`Wallet: ${formValues.walletName.trim()}`)
      if (formValues.network?.trim()) parts.push(`Network: ${formValues.network.trim()}`)
      if (formValues.publicAddress?.trim()) parts.push(`Address: ${formValues.publicAddress.trim()}`)
    } else if (trimmedType === 'SOCIAL_MEDIA') {
      if (formValues.platform?.trim()) parts.push(`Platform: ${formValues.platform.trim()}`)
      if (formValues.username?.trim()) parts.push(`Username: ${formValues.username.trim()}`)
    } else if (trimmedType === 'IMPORTANT_DOCUMENT') {
      if (formValues.documentTitle?.trim()) parts.push(`Title: ${formValues.documentTitle.trim()}`)
      if (formValues.documentType?.trim()) parts.push(`Type: ${formValues.documentType.trim()}`)
    } else if (formValues.category?.trim()) {
      parts.push(`Category: ${formValues.category.trim()}`)
    }
    if (formValues.handoverNotes?.trim()) {
      parts.push(`Notes: ${formValues.handoverNotes.trim()}`)
    }

    const finalCredentials = parts.join(' | ')
    const backendAssetType = RAW_TO_BACKEND[trimmedType] || trimmedType

    const payload = {
      assetType: backendAssetType,
      assetName: trimmedName,
      description: formValues.description.trim(),
      credentials: finalCredentials,
      attachmentUrl: formValues.attachmentUrl.trim(),
      status: asset?.status || 'unassigned',
    }

    try {
      const response = await updateAssetApi(assetId, payload)

      setSuccessMessage(
        response?.message ||
          (isVi ? 'Cập nhật thông tin tài sản thành công!' : 'Asset updated successfully!'),
      )

      setTimeout(() => {
        if (onSuccess) onSuccess(response?.asset || response)
        onClose()
      }, 700)
    } catch (err) {
      console.error('Update asset error:', err)
      setError(
        err.data?.error ||
          err.data?.message ||
          err.message ||
          (isVi ? 'Không thể cập nhật tài sản.' : 'Failed to update asset.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentStatus = (asset?.status || 'unassigned').toLowerCase()

  return (
    <div className="flow-modal-overlay" onMouseDown={onClose}>
      <div
        className="flow-modal"
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header Modal */}
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
                {isVi ? 'Chỉnh sửa tài sản số' : 'Edit Digital Asset'}
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-muted)' }}>
              {isVi
                ? 'Cập nhật thông tin chi tiết và khóa bí mật cho tài sản này (giữ nguyên trạng thái phân bổ hiện tại).'
                : 'Update asset details and credentials (status remains unchanged).'}
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

        {/* Body Modal (Form cấu trúc tương tự Create Asset) */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
          {error && (
            <div style={{ marginBottom: '14px' }}>
              <FormAlert tone="danger">{error}</FormAlert>
            </div>
          )}

          {successMessage && (
            <div style={{ marginBottom: '14px' }}>
              <FormAlert tone="success">{successMessage}</FormAlert>
            </div>
          )}

          <form id="edit-asset-full-form" onSubmit={handleSubmit} className="form-stack">
            {/* 1. Loại tài sản */}
            <FormField
              id="edit-type"
              as="select"
              label={t.fields.type.label}
              emptyOption={t.fields.type.empty}
              options={typeOptions}
              value={formValues.type}
              onChange={(e) => handleChange('type', e.target.value)}
            />

            {/* 2. Tên tài sản */}
            <FormField
              id="edit-name"
              label={t.fields.name.label}
              placeholder={t.fields.name.placeholder}
              maxLength={80}
              value={formValues.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />

            {/* 3. Các trường động theo từng loại tài sản (giống Create Asset) */}
            {getTypeFields(formValues.type).map((field) => {
              const text = t.fields[field.name] || {}
              const common = {
                id: `edit-${field.name}`,
                label: text.label || field.name,
                optional: field.required ? undefined : t.optional,
                hint: text.hint,
                value: formValues[field.name] || '',
                onChange: (e) => handleChange(field.name, e.target.value),
              }
              if (field.kind === 'select') {
                return (
                  <FormField
                    key={field.name}
                    {...common}
                    as="select"
                    emptyOption={text.empty}
                    options={field.options.map((value) => ({
                      value,
                      label: t.options?.[field.name]?.[value] || value,
                    }))}
                  />
                )
              }
              return (
                <FormField
                  key={field.name}
                  {...common}
                  placeholder={text.placeholder}
                  inputMode={field.check === 'last4' ? 'numeric' : undefined}
                  maxLength={field.check === 'last4' ? 4 : 120}
                  autoComplete="off"
                />
              )
            })}

            {/* 4. Mô tả */}
            <FormField
              id="edit-description"
              as="textarea"
              label={t.fields.description.label}
              optional={formValues.type === ASSET_TYPES.OTHER ? undefined : t.optional}
              placeholder={t.fields.description.placeholder}
              value={formValues.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />

            {/* 5. Chỉ dẫn bàn giao */}
            <FormField
              id="edit-handoverNotes"
              as="textarea"
              label={t.fields.handoverNotes.label}
              optional={t.optional}
              placeholder={t.fields.handoverNotes.placeholder}
              hint={t.fields.handoverNotes.hint}
              value={formValues.handoverNotes}
              onChange={(e) => handleChange('handoverNotes', e.target.value)}
            />

            {/* 6. Tài liệu đính kèm (Attachment Document) */}
            <div className="field">
              <div className="field__label-row">
                <label className="field__label" htmlFor="edit-asset-documents">
                  {isVi ? 'Tài liệu đính kèm (Attachment Document)' : 'Attachment Document'}
                  <span className="field__optional"> · {t.optional}</span>
                </label>
              </div>

              {/* Nút chọn tệp chuẩn giống Create Asset */}
              <div className="file-picker" style={{ marginBottom: '10px' }}>
                <label className="btn btn-secondary file-picker__button">
                  <Icon name="fileText" size={16} />
                  {t.documents.choose}
                  <input
                    id="edit-asset-documents"
                    type="file"
                    multiple
                    accept={DOCUMENT_RULES.accept}
                    className="visually-hidden"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="file-picker__rules">{t.documents.rules(maxSize, DOCUMENT_RULES.maxFiles)}</p>
              </div>

              {rejectedFiles.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                  <FormAlert tone="danger">
                    <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{t.documents.rejectedTitle}</p>
                    <ul className="file-rejections" style={{ margin: 0, paddingLeft: '16px' }}>
                      {rejectedFiles.map((item, index) => (
                        <li key={`${item.name}-${index}`}>
                          <strong>{item.name}</strong>: {reasonText(item.reason)}
                        </li>
                      ))}
                    </ul>
                  </FormAlert>
                </div>
              )}

              {files.length > 0 && (
                <ul className="file-list" style={{ marginBottom: '12px' }}>
                  {files.map((item) => (
                    <li key={item.id} className="file-list__item">
                      <Icon name="fileText" size={18} />
                      <span className="file-list__name">{item.name}</span>
                      <span className="file-list__size">{formatFileSize(item.size)}</span>
                      <span className="badge green">{t.documents.ready}</span>
                      <button
                        type="button"
                        className="file-list__remove"
                        aria-label={t.documents.removeLabel(item.name)}
                        onClick={() => handleRemoveFile(item.id)}
                      >
                        <Icon name="close" size={16} />
                        <span>{t.documents.remove}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {files.length === 0 && (
                <p className="file-list__empty" style={{ margin: '8px 0 0', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                  {t.documents.none}
                </p>
              )}
            </div>

            {/* 7. Trạng thái tài sản (READ-ONLY - Không cho phép chỉnh sửa status) */}
            <div className="field">
              <div className="field__label-row">
                <label className="field__label">
                  {isVi ? 'Trạng thái tài sản' : 'Asset Status'}
                </label>
                <span className="field__optional" style={{ color: 'var(--color-muted)' }}>
                  {isVi ? 'Không thể chỉnh sửa' : 'Read-only'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface-subtle)',
                }}
              >
                <span className={`badge ${currentStatus === 'assigned' ? 'green' : 'amber'}`}>
                  {currentStatus === 'assigned'
                    ? isVi
                      ? 'Đã phân bổ'
                      : 'Assigned'
                    : isVi
                    ? 'Chưa phân bổ'
                    : 'Unassigned'}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                  {isVi
                    ? 'Trạng thái này được quản lý tự động bởi hồ sơ phân bổ bàn giao, không được phép thay đổi trực tiếp tại đây.'
                    : 'This status is controlled automatically by handover assignments and cannot be modified here.'}
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '16px',
            marginTop: '14px',
          }}
        >
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {t.cancel}
          </Button>
          <Button type="submit" form="edit-asset-full-form" variant="primary" disabled={isSubmitting}>
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
