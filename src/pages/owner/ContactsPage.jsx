import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  Edit2,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.jsx'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { LoadingState } from '../../components/vault/PageStates.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import {
  createContactApi,
  deleteContactApi,
  getContactsApi,
  resendContactInvitationApi,
  revokeContactAccessApi,
  revokeContactInvitationApi,
  updateContactApi,
} from '../../services/contactService.js'

export default function ContactsPage() {
  const { language } = useLanguage()
  const isVi = language === 'vi'
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  // Quản lý hộp thoại xác nhận: { type: 'revoke' | 'revokeAccess' | 'delete', contact: object }
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    relationship: 'Spouse',
    email: '',
    phoneNumber: '',
    role: 'Beneficiary',
  })

  // Hàm tải danh bạ từ backend API (hỗ trợ tìm kiếm theo keyword, expectedRole, status)
  const fetchContacts = useCallback(
    async (keyword = '', silent = false) => {
      const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
      if (!token) {
        navigate('/login', { state: { from: location.pathname } })
        return
      }

      if (!silent) setLoading(true)
      setError(null)

      try {
        const list = await getContactsApi({
          keyword,
          expectedRole: roleFilter !== 'ALL' ? roleFilter : '',
          status: statusFilter !== 'ALL' ? statusFilter : '',
        })
        if (Array.isArray(list)) {
          const mapped = list.map((c) => {
            const isBoth =
              (c.isBeneficiary && c.isExecutor) || c.expectedRole === 'Both' || c.role === 'Both'
            const isExec =
              !isBoth && (c.isExecutor || c.expectedRole === 'Executor' || c.role === 'Executor')
            const isBene =
              !isBoth &&
              (c.isBeneficiary || c.expectedRole === 'Beneficiary' || c.role === 'Beneficiary')

            let role = 'Beneficiary'
            if (isBoth) role = 'Both'
            else if (isExec) role = 'Executor'

            const rawStatus = (c.status || 'pending').toLowerCase()
            let status = 'pending'
            if (rawStatus === 'verified') status = 'verified'
            else if (rawStatus === 'rejected' || rawStatus === 'declined' || rawStatus === 'revoked')
              status = 'rejected'

            return {
              contactId: c.contactId || c.id || crypto.randomUUID(),
              id: c.contactId || c.id || crypto.randomUUID(),
              fullName: c.fullName || c.name || '',
              name: c.fullName || c.name || '',
              relationship: c.relationship || '',
              email: c.email || '',
              phoneNumber: c.phoneNumber || '',
              isBeneficiary: isBoth || isBene,
              isExecutor: isBoth || isExec,
              role,
              status,
              rawStatus,
            }
          })
          setContacts(mapped)
          localStorage.setItem('legacyvault-contacts', JSON.stringify(mapped))
        }
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
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
          return
        }

        console.error('Lỗi tìm kiếm / lấy danh sách liên hệ:', err)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [isVi, location.pathname, navigate, roleFilter, statusFilter],
  )

  // Lắng nghe tìm kiếm & bộ lọc với debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchContacts, search])

  // Tự động làm mới trạng thái khi người dùng quay lại tab sau khi bấm xác nhận trong Email
  useEffect(() => {
    const onFocus = () => fetchContacts(search, true)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchContacts, search])

  const openAddModal = () => {
    setEditingContact(null)
    setForm({
      name: '',
      relationship: 'Spouse',
      email: '',
      phoneNumber: '',
      role: 'Beneficiary',
    })
    setModalError(null)
    setModalOpen(true)
  }

  const openEditModal = (contact) => {
    setEditingContact(contact)
    setForm({
      name: contact.fullName || contact.name || '',
      relationship: contact.relationship || 'Spouse',
      email: contact.email || '',
      phoneNumber: contact.phoneNumber || '',
      role: contact.role || 'Beneficiary',
    })
    setModalError(null)
    setModalOpen(true)
  }

  // Gửi lại lời mời qua email
  const handleResendInvite = async (contact) => {
    const targetId = contact.contactId || contact.id
    setActionLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      await resendContactInvitationApi(targetId)
      setSuccessMessage(
        isVi
          ? `Đã gửi lại email lời mời cho "${contact.name || contact.email}" thành công.`
          : `Successfully resent invitation email to "${contact.name || contact.email}".`,
      )
      setContacts((prev) =>
        prev.map((c) =>
          (c.contactId || c.id) === targetId
            ? { ...c, status: 'pending', rawStatus: 'pending' }
            : c,
        ),
      )
    } catch (err) {
      setError(
        err.data?.error ||
          err.message ||
          (isVi ? 'Không thể gửi lại lời mời.' : 'Failed to resend invitation.'),
      )
    } finally {
      setActionLoading(false)
    }
  }

  // Xử lý xác nhận Thu hồi lời mời / Thu hồi quyền truy cập / Xóa liên hệ
  const handleConfirmAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    setError(null)
    setSuccessMessage(null)

    const { type, contact } = confirmAction
    const targetId = contact.contactId || contact.id

    try {
      if (type === 'revoke') {
        await revokeContactInvitationApi(targetId)
        setSuccessMessage(
          isVi
            ? `Đã thu hồi lời mời tới ${contact.name || contact.email}.`
            : `Successfully revoked invitation for ${contact.name || contact.email}.`,
        )
        setContacts((prev) =>
          prev.map((c) =>
            (c.contactId || c.id) === targetId
              ? { ...c, status: 'rejected', rawStatus: 'revoked' }
              : c,
          ),
        )
      } else if (type === 'revokeAccess') {
        await revokeContactAccessApi(targetId)
        setSuccessMessage(
          isVi
            ? `Đã thu hồi quyền truy cập của ${contact.name || contact.email}.`
            : `Successfully revoked vault access for ${contact.name || contact.email}.`,
        )
        setContacts((prev) =>
          prev.map((c) =>
            (c.contactId || c.id) === targetId
              ? { ...c, status: 'rejected', rawStatus: 'revoked' }
              : c,
          ),
        )
      } else if (type === 'delete') {
        await deleteContactApi(targetId)
        setSuccessMessage(
          isVi
            ? `Đã xóa người liên hệ ${contact.name || contact.email} thành công.`
            : `Successfully deleted contact ${contact.name || contact.email}.`,
        )
        setContacts((prev) => prev.filter((c) => (c.contactId || c.id) !== targetId))
      }
      setConfirmAction(null)
    } catch (err) {
      setError(
        err.data?.error ||
          err.message ||
          (isVi ? 'Thao tác thất bại. Vui lòng thử lại.' : 'Action failed. Please try again.'),
      )
      setConfirmAction(null)
    } finally {
      setActionLoading(false)
    }
  }

  // Xử lý submit thêm mới hoặc cập nhật người liên hệ
  const handleSaveContact = async (e) => {
    e.preventDefault()
    setModalError(null)

    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    const fullName = form.name.trim()
    const relationship = form.relationship.trim()
    const email = form.email.trim()
    const phoneNumber = form.phoneNumber.trim()

    if (!fullName) {
      setModalError(isVi ? 'Vui lòng nhập họ và tên.' : 'Full name is required.')
      return
    }
    if (!relationship) {
      setModalError(isVi ? 'Vui lòng chọn mối quan hệ.' : 'Relationship is required.')
      return
    }
    if (!email) {
      setModalError(isVi ? 'Vui lòng nhập địa chỉ email.' : 'Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setModalError(isVi ? 'Địa chỉ email không hợp lệ.' : 'Please enter a valid email address.')
      return
    }

    // Chặn tự mời email của chính Vault Owner
    if (
      user?.identifier &&
      user.identifier.trim().toLowerCase() === email.toLowerCase()
    ) {
      setModalError(
        isVi
          ? 'Bạn không thể tự thêm email của chính mình vào sổ liên lạc.'
          : 'You cannot add your own email address to your Contact Book.',
      )
      return
    }

    if (!editingContact) {
      const isDuplicateEmail = contacts.some(
        (c) => (c.email || '').trim().toLowerCase() === email.toLowerCase(),
      )
      if (isDuplicateEmail) {
        setModalError(
          isVi
            ? 'Email này đã tồn tại trong danh bạ của bạn. Các liên hệ không được trùng email với nhau.'
            : 'This email already exists in your Contact Book. Contacts cannot share the same email address.',
        )
        return
      }
    }

    setSubmitting(true)

    try {
      if (editingContact) {
        const targetId = editingContact.contactId || editingContact.id
        await updateContactApi(targetId, {
          fullName,
          relationship,
          email,
          phoneNumber,
          expectedRole: form.role,
        })
        setSuccessMessage(
          isVi
            ? `Đã cập nhật thông tin và vai trò cho "${fullName}" thành công!`
            : `Updated contact "${fullName}" successfully!`,
        )
      } else {
        await createContactApi({
          fullName,
          relationship,
          email,
          phoneNumber,
          expectedRole: form.role,
        })
        setSuccessMessage(
          isVi
            ? `Đã thêm "${fullName}" và gửi email xác nhận lời mời tới ${email}!`
            : `Contact "${fullName}" added and confirmation email sent to ${email}!`,
        )
      }
      setTimeout(() => setSuccessMessage(null), 5000)

      setModalOpen(false)
      setEditingContact(null)
      setForm({ name: '', relationship: 'Spouse', email: '', phoneNumber: '', role: 'Beneficiary' })

      await fetchContacts(search)
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
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
        return
      }

      console.error('Lỗi khi lưu liên hệ:', err)
      setModalError(
        err.data?.error ||
          err.data?.message ||
          err.message ||
          (isVi
            ? 'Lưu người liên hệ thất bại. Vui lòng thử lại.'
            : 'Failed to save contact. Please try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = contacts
  const hasActiveFilter = Boolean(
    search.trim() || roleFilter !== 'ALL' || statusFilter !== 'ALL',
  )
  const showEmpty = !loading && contacts.length === 0

  return (
    <OwnerLayout>
      <div className="flow-page-head">
        <div>
          <h1>{isVi ? 'Danh bạ tin cậy' : 'Contact Book'}</h1>
          <p>
            {isVi
              ? 'Quản lý người thụ hưởng và người giám sát/thi hành di sản của bạn.'
              : 'Manage your trusted contacts for digital asset assignments and handover.'}
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} />
          {isVi ? 'Thêm người liên hệ' : 'Add New Contact'}
        </Button>
      </div>

      {successMessage && (
        <div style={{ marginBottom: '16px' }}>
          <FormAlert tone="success">{successMessage}</FormAlert>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '16px' }}>
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}

      <section className="panel contact-panel">
        <div
          className="contact-toolbar"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}
        >
          <input
            className="search-input"
            style={{ flex: '1 1 240px' }}
            type="search"
            placeholder={
              isVi
                ? 'Tìm kiếm theo tên, email, mối quan hệ...'
                : 'Search contacts by name, email, relationship...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                fetchContacts(search)
              }
            }}
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label={isVi ? 'Lọc theo vai trò' : 'Filter by role'}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13.5px',
            }}
          >
            <option value="ALL">{isVi ? 'Tất cả vai trò' : 'All Roles'}</option>
            <option value="beneficiary">{isVi ? 'Người thụ hưởng' : 'Beneficiary'}</option>
            <option value="executor">{isVi ? 'Người thi hành' : 'Executor'}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label={isVi ? 'Lọc theo trạng thái' : 'Filter by status'}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: '13.5px',
            }}
          >
            <option value="ALL">{isVi ? 'Tất cả trạng thái' : 'All Statuses'}</option>
            <option value="verified">{isVi ? 'Đã xác thực' : 'Verified'}</option>
            <option value="pending">{isVi ? 'Chờ xác nhận' : 'Pending'}</option>
            <option value="revoked">{isVi ? 'Đã thu hồi' : 'Revoked'}</option>
            <option value="rejected">{isVi ? 'Đã từ chối' : 'Declined'}</option>
          </select>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0' }}>
            <LoadingState
              label={
                hasActiveFilter
                  ? isVi
                    ? 'Đang tìm kiếm…'
                    : 'Searching contacts…'
                  : isVi
                  ? 'Đang tải danh bạ…'
                  : 'Loading contacts…'
              }
            />
          </div>
        ) : showEmpty ? (
          <div className="empty-state">
            <div className="empty-icon">
              {hasActiveFilter ? (
                <Search size={36} strokeWidth={1.5} />
              ) : (
                <Users size={36} strokeWidth={1.5} />
              )}
            </div>
            <h2>
              {hasActiveFilter
                ? isVi
                  ? 'Không tìm thấy kết quả'
                  : 'No Contacts Found'
                : isVi
                ? 'Chưa có người liên hệ nào'
                : 'No Contacts Yet'}
            </h2>
            <p>
              {hasActiveFilter
                ? isVi
                  ? 'Không tìm thấy người liên hệ nào phù hợp với bộ lọc hiện tại.'
                  : 'No contacts found matching the current search and filters.'
                : isVi
                ? 'Thêm người thụ hưởng hoặc người thi hành đầu tiên để bắt đầu phân chia tài sản số.'
                : 'You have not added any contacts yet. Add your first trusted contact to start assigning assets.'}
            </p>
            {hasActiveFilter ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setRoleFilter('ALL')
                  setStatusFilter('ALL')
                }}
              >
                {isVi ? 'Xóa bộ lọc tìm kiếm' : 'Clear Filters'}
              </Button>
            ) : (
              <Button onClick={openAddModal}>
                <Plus size={16} />
                {isVi ? 'Thêm người liên hệ đầu tiên' : 'Add Your First Contact'}
              </Button>
            )}
          </div>
        ) : (
          <div className="contact-table-wrap">
            <table className="contact-table">
              <thead>
                <tr>
                  <th>{isVi ? 'Họ và tên' : 'Name'}</th>
                  <th>{isVi ? 'Mối quan hệ' : 'Relationship'}</th>
                  <th>Email</th>
                  <th>{isVi ? 'Vai trò kỳ vọng' : 'Expected Role'}</th>
                  <th>{isVi ? 'Trạng thái' : 'Status'}</th>
                  <th>{isVi ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isBoth = (c.isBeneficiary && c.isExecutor) || c.role === 'Both'
                  const isExec = !isBoth && (c.isExecutor || c.role === 'Executor')
                  const isVerified = c.status === 'verified'
                  const isRejected = c.status === 'rejected'

                  return (
                    <tr key={c.contactId || c.id}>
                      <td className="strong">{c.fullName || c.name}</td>
                      <td>{c.relationship}</td>
                      <td>{c.email}</td>
                      <td>
                        <span className="badge">
                          {isBoth
                            ? isVi
                              ? 'Cả hai'
                              : 'Beneficiary & Executor'
                            : isExec
                            ? isVi
                              ? 'Người thi hành'
                              : 'Executor'
                            : isVi
                            ? 'Người thụ hưởng'
                            : 'Beneficiary'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            isVerified ? 'green' : isRejected ? 'red' : 'amber'
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <CheckCircle size={12} style={{ marginRight: 4 }} />
                              {isVi ? 'Đã xác thực' : 'Verified'}
                            </>
                          ) : isRejected ? (
                            <>
                              <XCircle size={12} style={{ marginRight: 4 }} />
                              {c.rawStatus === 'revoked'
                                ? isVi
                                  ? 'Đã thu hồi'
                                  : 'Revoked'
                                : isVi
                                ? 'Đã từ chối'
                                : 'Declined'}
                            </>
                          ) : (
                            <>
                              <Clock size={12} style={{ marginRight: 4 }} />
                              {isVi ? 'Chờ xác nhận' : 'Pending'}
                            </>
                          )}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          {/* Nút Sửa thông tin / vai trò */}
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => openEditModal(c)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 9px',
                              fontSize: '12px',
                              fontWeight: '500',
                              color: 'var(--color-primary, #0f766e)',
                              background: 'rgba(15, 118, 110, 0.08)',
                              border: '1px solid rgba(15, 118, 110, 0.25)',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                            title={isVi ? 'Chỉnh sửa thông tin hoặc vai trò' : 'Edit contact or role'}
                          >
                            <Edit2 size={12} />
                            {isVi ? 'Sửa' : 'Edit'}
                          </button>

                          {/* Nút Gửi lại lời mời khi chưa Verified */}
                          {!isVerified && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleResendInvite(c)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 9px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#2563eb',
                                background: 'rgba(37, 99, 235, 0.08)',
                                border: '1px solid rgba(37, 99, 235, 0.25)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              title={isVi ? 'Gửi lại email lời mời' : 'Resend invitation email'}
                            >
                              <Mail size={12} />
                              {isVi ? 'Gửi lại' : 'Resend'}
                            </button>
                          )}

                          {/* Nút Thu hồi lời mời khi đang Pending */}
                          {c.status === 'pending' && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setConfirmAction({ type: 'revoke', contact: c })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 9px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#d97706',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              title={isVi ? 'Thu hồi lời mời này' : 'Revoke this invitation'}
                            >
                              <RotateCcw size={12} />
                              {isVi ? 'Thu hồi' : 'Revoke'}
                            </button>
                          )}

                          {/* Nút Thu hồi quyền khi đã Verified */}
                          {isVerified && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() =>
                                setConfirmAction({ type: 'revokeAccess', contact: c })
                              }
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 9px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#d97706',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              title={
                                isVi
                                  ? 'Thu hồi quyền truy cập kho của người liên hệ này'
                                  : 'Revoke vault access for this contact'
                              }
                            >
                              <RotateCcw size={12} />
                              {isVi ? 'Thu hồi quyền' : 'Revoke Access'}
                            </button>
                          )}

                          {/* Nút Xóa khi đã Verified hoặc Rejected/Revoked */}
                          {c.status !== 'pending' && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setConfirmAction({ type: 'delete', contact: c })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 9px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#ef4444',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              title={isVi ? 'Xóa người liên hệ này' : 'Delete this contact'}
                            >
                              <Trash2 size={12} />
                              {isVi ? 'Xóa' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="flow-modal-overlay"
          onMouseDown={() => {
            if (!submitting) {
              setModalOpen(false)
              setEditingContact(null)
              setModalError(null)
            }
          }}
        >
          <form
            className="flow-modal"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={handleSaveContact}
          >
            <h2>
              {editingContact
                ? isVi
                  ? 'Chỉnh sửa người liên hệ'
                  : 'Edit Contact'
                : isVi
                ? 'Thêm người liên hệ mới'
                : 'Add New Contact'}
            </h2>
            <p>
              {editingContact
                ? isVi
                  ? 'Cập nhật thông tin hoặc thay đổi vai trò chỉ định của người liên hệ.'
                  : 'Update contact details or change their assigned role in your vault.'
                : isVi
                ? 'Thêm người đáng tin cậy để phân bổ tài sản hoặc chỉ định người thi hành.'
                : 'Add a trusted person to allocate your digital assets or act as an executor.'}
            </p>

            {modalError && (
              <div style={{ marginBottom: '16px' }}>
                <FormAlert tone="error">{modalError}</FormAlert>
              </div>
            )}

            <label className="flow-form-label">{isVi ? 'Họ và tên đầy đủ' : 'Full Name'}</label>
            <input
              required
              placeholder={isVi ? 'Ví dụ: Nguyễn Văn A' : 'e.g. John Doe'}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              disabled={submitting}
            />

            <label className="flow-form-label">{isVi ? 'Mối quan hệ' : 'Relationship'}</label>
            <select
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              disabled={submitting}
            >
              {['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Attorney', 'Other'].map(
                (rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ),
              )}
            </select>

            <label className="flow-form-label">Email</label>
            <input
              required
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={submitting || Boolean(editingContact)}
            />

            <label className="flow-form-label">
              {isVi ? 'Số điện thoại (Tùy chọn)' : 'Phone Number (Optional)'}
            </label>
            <input
              type="tel"
              placeholder="0912345678"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              disabled={submitting}
            />

            <label className="flow-form-label">{isVi ? 'Vai trò chỉ định' : 'Expected Role'}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={submitting}
            >
              <option value="Beneficiary">
                {isVi ? 'Người thụ hưởng (Beneficiary)' : 'Beneficiary'}
              </option>
              <option value="Executor">
                {isVi ? 'Người thi hành di chúc (Executor)' : 'Executor'}
              </option>
              <option value="Both">{isVi ? 'Cả hai (Both)' : 'Both'}</option>
            </select>

            <div className="flow-modal-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => {
                  setModalOpen(false)
                  setEditingContact(null)
                  setModalError(null)
                }}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? isVi
                    ? 'Đang lưu…'
                    : 'Saving…'
                  : editingContact
                  ? isVi
                    ? 'Cập nhật liên hệ'
                    : 'Update Contact'
                  : isVi
                  ? 'Lưu người liên hệ'
                  : 'Save Contact'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {confirmAction && (
        <div className="flow-modal-overlay">
          <div className="flow-modal" style={{ maxWidth: '440px' }}>
            <h3
              style={{
                margin: '0 0 12px',
                fontSize: '18px',
                color: confirmAction.type === 'delete' ? '#ef4444' : '#f59e0b',
              }}
            >
              {confirmAction.type === 'delete'
                ? isVi
                  ? 'Xác nhận xóa liên hệ'
                  : 'Confirm Delete Contact'
                : confirmAction.type === 'revokeAccess'
                ? isVi
                  ? 'Xác nhận thu hồi quyền truy cập'
                  : 'Confirm Revoke Vault Access'
                : isVi
                ? 'Xác nhận thu hồi lời mời'
                : 'Confirm Revoke Invitation'}
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 24px' }}>
              {confirmAction.type === 'delete'
                ? isVi
                  ? `CẢNH BÁO: Xóa "${confirmAction.contact.name || confirmAction.contact.email}" sẽ thu hồi toàn bộ quyền truy cập kho di sản và hủy các chỉ định thừa kế liên quan. Hành động này không thể hoàn tác!`
                  : `WARNING: Deleting "${confirmAction.contact.name || confirmAction.contact.email}" will revoke all vault access and associated asset assignments. This cannot be undone!`
                : confirmAction.type === 'revokeAccess'
                ? isVi
                  ? `Bạn có chắc chắn muốn thu hồi quyền truy cập kho di sản của "${confirmAction.contact.name || confirmAction.contact.email}"? Người này sẽ chuyển sang trạng thái Đã thu hồi (Revoked) cho tới khi bạn gửi lại lời mời.`
                  : `Are you sure you want to revoke vault access for "${confirmAction.contact.name || confirmAction.contact.email}"? Their status will change to Revoked until you resend an invitation.`
                : isVi
                ? `Bạn có chắc chắn muốn thu hồi lời mời gửi tới "${confirmAction.contact.name || confirmAction.contact.email}"? Liên kết trong email đã gửi sẽ bị vô hiệu hóa ngay lập tức.`
                : `Are you sure you want to revoke the invitation sent to "${confirmAction.contact.name || confirmAction.contact.email}"? The link in the sent email will be invalidated immediately.`}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                variant="secondary"
                disabled={actionLoading}
                onClick={() => setConfirmAction(null)}
              >
                {isVi ? 'Hủy bỏ' : 'Cancel'}
              </Button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmAction}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff',
                  background: confirmAction.type === 'delete' ? '#ef4444' : '#d97706',
                  border: 'none',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                }}
              >
                {actionLoading
                  ? isVi
                    ? 'Đang xử lý…'
                    : 'Processing…'
                  : confirmAction.type === 'delete'
                  ? isVi
                    ? 'Xóa liên hệ'
                    : 'Delete'
                  : isVi
                  ? 'Thu hồi'
                  : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  )
}
