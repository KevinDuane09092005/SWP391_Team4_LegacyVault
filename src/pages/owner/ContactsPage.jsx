import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Plus, Search, Users, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { LoadingState } from '../../components/vault/PageStates.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import {
  createContactApi,
  getContactsApi,
  revokeContactInvitationApi,
  deleteContactApi
} from '../../services/contactService.js'

export default function ContactsPage() {
  const { language } = useLanguage()
  const isVi = language === 'vi'
  const location = useLocation()
  const navigate = useNavigate()

  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  // Quản lý hộp thoại xác nhận: { type: 'revoke' | 'delete', contact: object }
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    relationship: 'Spouse',
    email: '',
    role: 'Beneficiary',
  })

  // Hàm tải danh bạ từ backend API (hỗ trợ tìm kiếm theo keyword)
  const fetchContacts = useCallback(async (keyword = '', silent = false) => {
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    if (!silent) setLoading(true)
    setError(null)

    try {
      const list = await getContactsApi(keyword)
      if (Array.isArray(list)) {
        const mapped = list.map((c) => {
          const isBoth = (c.isBeneficiary && c.isExecutor) || c.expectedRole === 'Both' || c.role === 'Both'
          const isExec = !isBoth && (c.isExecutor || c.expectedRole === 'Executor' || c.role === 'Executor')
          const isBene = !isBoth && (c.isBeneficiary || c.expectedRole === 'Beneficiary' || c.role === 'Beneficiary')

          let role = 'Beneficiary'
          if (isBoth) role = 'Both'
          else if (isExec) role = 'Executor'

          const rawStatus = (c.status || 'pending').toLowerCase()
          let status = 'pending'
          if (rawStatus === 'verified') status = 'verified'
          else if (rawStatus === 'rejected' || rawStatus === 'declined' || rawStatus === 'revoked') status = 'rejected'

          return {
            contactId: c.contactId || c.id || crypto.randomUUID(),
            id: c.contactId || c.id || crypto.randomUUID(),
            fullName: c.fullName || c.name || '',
            name: c.fullName || c.name || '',
            relationship: c.relationship || '',
            email: c.email || '',
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
  }, [isVi, location.pathname, navigate])

  // Lắng nghe tìm kiếm với debounce 400ms và gọi API GET /api/v1/contacts?keyword=...
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [fetchContacts, search])

  // Tự động làm mới trạng thái khi người dùng quay lại tab sau khi bấm xác nhận trong Email
  useEffect(() => {
    const onFocus = () => fetchContacts(search, true)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchContacts, search])


  // Xử lý xác nhận Thu hồi hoặc Xóa liên hệ
  const handleConfirmAction = async () => {
    if (!confirmAction) return
    setActionLoading(true)
    setError(null)
    setSuccessMessage(null)

    const { type, contact } = confirmAction
    const targetId = contact.contactId || contact.id

    try {
      if (type === 'revoke') {
        // 1. Gọi API Backend thật để thu hồi lời mời
        await revokeContactInvitationApi(targetId)
        setSuccessMessage(
          isVi
            ? `Đã thu hồi lời mời tới ${contact.name || contact.email}.`
            : `Successfully revoked invitation for ${contact.name || contact.email}.`
        )
        // Cập nhật trạng thái dòng đó thành 'rejected'/'revoked'
        setContacts((prev) =>
          prev.map((c) => ((c.contactId || c.id) === targetId ? { ...c, status: 'rejected', rawStatus: 'revoked' } : c))
        )
      } else if (type === 'delete') {
        // 2. Gọi API Backend thật để xóa người liên hệ
        await deleteContactApi(targetId)
        setSuccessMessage(
          isVi
            ? `Đã xóa người liên hệ ${contact.name || contact.email} thành công.`
            : `Successfully deleted contact ${contact.name || contact.email}.`
        )
        // Loại bỏ hẳn người này khỏi danh sách state
        setContacts((prev) => prev.filter((c) => (c.contactId || c.id) !== targetId))
      }
      setConfirmAction(null)
    } catch (err) {
      setError(err.message || (isVi ? 'Thao tác thất bại. Vui lòng thử lại.' : 'Action failed. Please try again.'))
      setConfirmAction(null)
    } finally {
      setActionLoading(false)
    }
  }

  // Xử lý submit thêm người liên hệ mới
  const handleAddContact = async (e) => {
    e.preventDefault()
    setModalError(null)

    // 1. Kiểm tra Token & Xác thực
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    // 2. Validate cơ bản
    const fullName = form.name.trim()
    const relationship = form.relationship.trim()
    const email = form.email.trim()

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

    setSubmitting(true)

    try {
      // 3. Gọi POST /api/v1/contacts
      await createContactApi({
        fullName,
        relationship,
        email,
        expectedRole: form.role,
      })

      // 4. Success Flow:
      setSuccessMessage(
        isVi
          ? `Đã thêm "${fullName}" và gửi email xác nhận lời mời tới ${email}!`
          : `Contact "${fullName}" added and confirmation email sent to ${email}!`,
      )
      setTimeout(() => setSuccessMessage(null), 5000)

      // Đóng modal & reset form
      setModalOpen(false)
      setForm({ name: '', relationship: 'Spouse', email: '', role: 'Beneficiary' })

      // Kích hoạt cập nhật lại danh bạ ngay lập tức từ server
      setSearch('')
      await fetchContacts('')
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

      console.error('Lỗi khi thêm liên hệ:', err)
      setModalError(
        err.data?.error ||
          err.data?.message ||
          err.message ||
          (isVi ? 'Thêm người liên hệ thất bại. Vui lòng thử lại.' : 'Failed to add contact. Please try again.'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  const filtered = contacts

  const showEmpty = !loading && contacts.length === 0

  return (
    <OwnerLayout>
      <div className="flow-page-head">
        <div>
          <h1>{isVi ? 'Danh bạ tin cậy' : 'Contact Book'}</h1>
          <p>{isVi ? 'Quản lý người thụ hưởng và người giám sát/thi hành di sản của bạn.' : 'Manage your trusted contacts for digital asset assignments and handover.'}</p>
        </div>
        <Button onClick={() => { setModalError(null); setModalOpen(true) }}>
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
        <div className="contact-toolbar">
          <input
            className="search-input"
            type="search"
            placeholder={isVi ? 'Tìm kiếm theo tên, email, vai trò...' : 'Search contacts by name, email, role...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                fetchContacts(search)
              }
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: '32px 0' }}>
            <LoadingState label={search.trim() ? (isVi ? 'Đang tìm kiếm…' : 'Searching contacts…') : (isVi ? 'Đang tải danh bạ…' : 'Loading contacts…')} />
          </div>
        ) : showEmpty ? (
          <div className="empty-state">
            <div className="empty-icon">
              {search.trim() ? <Search size={36} strokeWidth={1.5} /> : <Users size={36} strokeWidth={1.5} />}
            </div>
            <h2>
              {search.trim()
                ? (isVi ? 'Không tìm thấy kết quả' : 'No Contacts Found')
                : (isVi ? 'Chưa có người liên hệ nào' : 'No Contacts Yet')}
            </h2>
            <p>
              {search.trim()
                ? (isVi
                    ? `Không tìm thấy người liên hệ nào phù hợp với từ khóa "${search.trim()}".`
                    : `No contacts found matching "${search.trim()}".`)
                : (isVi
                    ? 'Thêm người thụ hưởng hoặc người thi hành đầu tiên để bắt đầu phân chia tài sản số.'
                    : 'You have not added any contacts yet. Add your first trusted contact to start assigning assets.')}
            </p>
            {search.trim() ? (
              <Button variant="secondary" onClick={() => setSearch('')}>
                {isVi ? 'Xóa từ khóa tìm kiếm' : 'Clear Search'}
              </Button>
            ) : (
              <Button onClick={() => { setModalError(null); setModalOpen(true) }}>
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
                            ? (isVi ? 'Cả hai' : 'Beneficiary & Executor')
                            : isExec
                            ? (isVi ? 'Người thi hành' : 'Executor')
                            : (isVi ? 'Người thụ hưởng' : 'Beneficiary')}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${isVerified ? 'green' : isRejected ? 'red' : 'amber'}`}>
                          {isVerified ? (
                            <>
                              <CheckCircle size={12} style={{ marginRight: 4 }} />
                              {isVi ? 'Đã xác thực' : 'Verified'}
                            </>
                          ) : isRejected ? (
                            <>
                              <XCircle size={12} style={{ marginRight: 4 }} />
                              {c.rawStatus === 'revoked'
                                ? (isVi ? 'Đã thu hồi' : 'Revoked')
                                : (isVi ? 'Đã từ chối' : 'Declined')}
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {/* Nút Thu hồi khi đang Pending */}
                          {c.status === 'pending' && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setConfirmAction({ type: 'revoke', contact: c })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#d97706',
                                background: 'rgba(245, 158, 11, 0.1)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                              title={isVi ? 'Thu hồi lời mời này' : 'Revoke this invitation'}
                            >
                              <RotateCcw size={12} />
                              {isVi ? 'Thu hồi' : 'Revoke'}
                            </button>
                          )}

                          {/* Nút Xóa khi đã Verified hoặc Rejected */}
                          {c.status !== 'pending' && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setConfirmAction({ type: 'delete', contact: c })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                fontSize: '12px',
                                fontWeight: '500',
                                color: '#ef4444',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '6px',
                                cursor: 'pointer'
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
              setModalError(null)
            }
          }}
        >
          <form
            className="flow-modal"
            onMouseDown={(e) => e.stopPropagation()}
            onSubmit={handleAddContact}
          >
            <h2>{isVi ? 'Thêm người liên hệ mới' : 'Add New Contact'}</h2>
            <p>{isVi ? 'Thêm người đáng tin cậy để phân bổ tài sản hoặc chỉ định người thi hành.' : 'Add a trusted person to allocate your digital assets or act as an executor.'}</p>

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
              {['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Attorney', 'Other'].map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>

            <label className="flow-form-label">Email</label>
            <input
              required
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={submitting}
            />

            <label className="flow-form-label">{isVi ? 'Vai trò chỉ định' : 'Expected Role'}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              disabled={submitting}
            >
              <option value="Beneficiary">{isVi ? 'Người thụ hưởng (Beneficiary)' : 'Beneficiary'}</option>
              <option value="Executor">{isVi ? 'Người thi hành di chúc (Executor)' : 'Executor'}</option>
              <option value="Both">{isVi ? 'Cả hai (Both)' : 'Both'}</option>
            </select>

            <div className="flow-modal-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => {
                  setModalOpen(false)
                  setModalError(null)
                }}
              >
                {isVi ? 'Hủy' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (isVi ? 'Đang lưu…' : 'Saving…') : (isVi ? 'Lưu người liên hệ' : 'Save Contact')}
              </Button>
            </div>
          </form>
        </div>
      )}
      {confirmAction && (
        <div className="flow-modal-overlay">
          <div className="flow-modal" style={{ maxWidth: '440px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: confirmAction.type === 'delete' ? '#ef4444' : '#f59e0b' }}>
              {confirmAction.type === 'delete'
                ? (isVi ? 'Xác nhận xóa liên hệ' : 'Confirm Delete Contact')
                : (isVi ? 'Xác nhận thu hồi lời mời' : 'Confirm Revoke Invitation')}
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 24px' }}>
              {confirmAction.type === 'delete'
                ? (isVi
                    ? `CẢNH BÁO: Xóa "${confirmAction.contact.name || confirmAction.contact.email}" sẽ thu hồi toàn bộ quyền truy cập kho di sản và hủy các chỉ định thừa kế liên quan. Hành động này không thể hoàn tác!`
                    : `WARNING: Deleting "${confirmAction.contact.name || confirmAction.contact.email}" will revoke all vault access and associated asset assignments. This cannot be undone!`)
                : (isVi
                    ? `Bạn có chắc chắn muốn thu hồi lời mời gửi tới "${confirmAction.contact.name || confirmAction.contact.email}"? Liên kết trong email đã gửi sẽ bị vô hiệu hóa ngay lập tức.`
                    : `Are you sure you want to revoke the invitation sent to "${confirmAction.contact.name || confirmAction.contact.email}"? The link in the sent email will be invalidated immediately.`)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="secondary" disabled={actionLoading} onClick={() => setConfirmAction(null)}>
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
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading
                  ? (isVi ? 'Đang xử lý…' : 'Processing…')
                  : confirmAction.type === 'delete'
                  ? (isVi ? 'Xóa liên hệ' : 'Delete')
                  : (isVi ? 'Thu hồi' : 'Revoke')}
              </button>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  )
}
