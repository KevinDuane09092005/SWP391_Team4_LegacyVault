import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, Plus, Search, Users, XCircle } from 'lucide-react'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { LoadingState } from '../../components/vault/PageStates.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { createContactApi, getContactsApi } from '../../services/contactService.js'

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
          else if (rawStatus === 'rejected' || rawStatus === 'declined') status = 'rejected'

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
                              {isVi ? 'Đã từ chối' : 'Declined'}
                            </>
                          ) : (
                            <>
                              <Clock size={12} style={{ marginRight: 4 }} />
                              {isVi ? 'Chờ xác nhận' : 'Pending'}
                            </>
                          )}
                        </span>
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
    </OwnerLayout>
  )
}
