import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import DemoAccounts from '../../components/auth/DemoAccounts.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import SubmitButton from '../../components/auth/SubmitButton.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLES } from '../../auth/roles.js'
import { savePendingVerification, saveSession } from '../../auth/session.js'
import { normalizeIdentifier, validateLogin } from '../../auth/validation.js'
import { authContent } from '../../data/authContent.js'
import { dashboardContent } from '../../data/dashboardContent.js'
import useForm from '../../hooks/useForm.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE } from '../../services/authService.js'

// Flow 1 — Sign in with email or phone + password.
// After a successful sign-in, RedirectIfSignedIn (src/auth/guards.jsx) sends the user
// to their role's dashboard, or back to the page they were trying to open.
export default function LoginPage() {
  const { language } = useLanguage()
  const t = authContent[language]
  const copy = t.signin
  const { login, justLoggedOut, markLogoutSeen, setSessionUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Message passed from another page (OTP verified, signed out, or a protected page).
  let notice = null
  if (location.state?.verified) notice = location.state?.message || copy.notices.verified
  else if (location.state?.loggedOut) notice = copy.notices.loggedOut
  else if (location.state?.from) notice = copy.notices.signInRequired

  // The notice is now on screen; later visits to protected pages should remember the target again.
  useEffect(() => {
    if (justLoggedOut) markLogoutSeen()
  }, [justLoggedOut, markLogoutSeen])

  const form = useForm({
    formId: 'login',
    initialValues: { identifier: location.state?.identifier ?? '', password: '', remember: false },
    validate: (values) => validateLogin(values, t.validation),
    fieldOrder: ['identifier', 'password'],
  })
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError(null)

    const email = form.values.identifier?.trim()
    const password = form.values.password

    // Validate nhanh: kiểm tra email và password không để trống trước khi gửi request
    if (!email || !password) {
      if (!email) {
        setServerError(language === 'vi' ? 'Vui lòng nhập email.' : 'Please enter your email.')
      } else {
        setServerError(language === 'vi' ? 'Vui lòng nhập mật khẩu.' : 'Please enter your password.')
      }
      return
    }

    setLoading(true)

    try {
      // 1. Xác định URL Backend từ biến môi trường hoặc fallback
      const baseUrl = (
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.REACT_APP_API_BASE_URL ||
        ''
      ).replace(/\/$/, '')

      const endpoint = baseUrl
        ? (baseUrl.endsWith('/api/v1') ? `${baseUrl}/auth/login` : `${baseUrl}/api/v1/auth/login`)
        : '/api/v1/auth/login'

      // 2. Gọi HTTP POST tới Backend API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => ({}))

      // 3. Xử lý khi API trả về lỗi (HTTP 400 Bad Request / 401 / ...)
      if (!response.ok) {
        const errorMsg =
          data?.error ||
          data?.message ||
          (language === 'vi'
            ? 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'
            : 'Login failed. Please check your credentials.')
        throw new Error(errorMsg)
      }

      // 4. Khi thành công (HTTP 200 OK): Lưu trữ Authentication State
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('userId', data.userId)
      localStorage.setItem('legacyvault-access-token', data.token)

      // Chuẩn hóa role và thông tin người dùng cho hệ thống frontend
      const roleMapping = {
        vault_owner: ROLES.VAULT_OWNER,
        admin: ROLES.ADMIN,
        executor: ROLES.EXECUTOR,
        beneficiary: ROLES.BENEFICIARY,
        legal_verifier: ROLES.LEGAL_VERIFIER,
      }
      const appRole =
        roleMapping[data.role?.toLowerCase()] ||
        data.role?.toUpperCase() ||
        ROLES.VAULT_OWNER

      const userProfile = {
        id: data.userId,
        fullName: data.fullName || email.split('@')[0],
        identifier: email,
        role: appRole,
      }

      saveSession(userProfile, form.values.remember)
      if (typeof setSessionUser === 'function') {
        setSessionUser(userProfile, form.values.remember)
      }

      // 5. Điều hướng: Chuyển sang trang Dashboard (/dashboard hoặc trang yêu cầu trước đó)
      const redirectTarget = location.state?.from ?? '/dashboard'
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      // Bắt lỗi qua khối catch, trích xuất thông điệp từ trường error và hiển thị lên giao diện
      setServerError(
        error.message ||
          (language === 'vi'
            ? 'Đã có lỗi xảy ra khi kết nối máy chủ.'
            : 'Connection error. Please try again.'),
      )
    } finally {
      setLoading(false)
    }
  }

  // The account exists but the OTP was never entered: go back to the OTP page.
  const goToVerification = () => {
    savePendingVerification({ identifier: normalizeIdentifier(form.values.identifier), fullName: '' })
    navigate('/verify-otp')
  }

  const fillDemoAccount = (identifier, password) => {
    form.setValue('identifier', identifier)
    form.setValue('password', password)
    setServerError(null)
  }

  return (
    <AuthLayout activeTab="signin">
      <h1 id="auth-title" className="auth-card__title">
        {copy.title}
      </h1>
      <p className="auth-card__subtitle">{copy.subtitle}</p>

      {notice && !serverError && <FormAlert tone="success">{notice}</FormAlert>}

      {serverError && (
        <FormAlert>
          <p>{t.errors?.[serverError] ?? serverError ?? t.errors?.generic}</p>
          {serverError === 'ACCOUNT_NOT_VERIFIED' && (
            <button type="button" className="auth-alert__action" onClick={goToVerification}>
              {copy.verifyNow}
            </button>
          )}
        </FormAlert>
      )}

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <FormField
          {...form.fieldProps('identifier')}
          label={t.fields.identifier.label}
          placeholder={t.fields.identifier.placeholder}
          autoComplete="username"
          disabled={loading}
        />

        <FormField
          {...form.fieldProps('password')}
          type="password"
          label={t.fields.password.label}
          placeholder={t.fields.password.placeholder}
          autoComplete="current-password"
          revealLabels={{ show: t.showPassword, hide: t.hidePassword }}
          disabled={loading}
          extra={
            <Link to="/forgot-password" className="auth-link">
              {copy.forgot}
            </Link>
          }
        />

        <label className="check-field__label">
          <input
            type="checkbox"
            checked={form.values.remember}
            onChange={form.handleChange('remember')}
            disabled={loading}
          />
          <span>{copy.remember}</span>
        </label>

        <SubmitButton loading={loading} loadingText={copy.submitting}>
          {copy.submit}
        </SubmitButton>
      </form>

      <p className="auth-switch">
        {copy.switchPrompt}{' '}
        <Link to="/register" className="auth-link">
          {copy.switchLink}
        </Link>
      </p>

      {IS_DEMO_MODE && (
        <DemoAccounts
          labels={{ ...t.demoAccounts, badge: t.demoBadge }}
          roleLabels={dashboardContent[language].roles}
          onUse={fillDemoAccount}
        />
      )}
    </AuthLayout>
  )
}
