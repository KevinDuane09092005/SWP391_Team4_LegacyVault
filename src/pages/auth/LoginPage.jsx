import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import DemoAccounts from '../../components/auth/DemoAccounts.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import SubmitButton from '../../components/auth/SubmitButton.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLES } from '../../auth/roles.js'
import { savePendingVerification } from '../../auth/session.js'
import { normalizeIdentifier, validateLogin } from '../../auth/validation.js'
import { authContent } from '../../data/authContent.js'
import { dashboardContent } from '../../data/dashboardContent.js'
import useForm from '../../hooks/useForm.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { IS_DEMO_MODE } from '../../services/authService.js'
import {
  beneficiaryLoginWithCodeApi,
  verifyBeneficiaryOtpApi,
} from '../../services/handoverService.js'

// Flow 1 & Flow 6 — Sign in with email or phone + password, OR claim inheritance via Access Code & OTP.
// After a successful sign-in, RedirectIfSignedIn (src/auth/guards.jsx) sends the user
// to their role's dashboard, or back to the page they were trying to open.
export default function LoginPage() {
  const { language } = useLanguage()
  const t = authContent[language]
  const copy = t.signin
  const { login, justLoggedOut, markLogoutSeen, setSessionUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [authMode, setAuthMode] = useState('password') // 'password' | 'accessCode'
  const [accessForm, setAccessForm] = useState({
    email: '',
    accessCode: '',
    sessionToken: '',
    otpCode: '',
    step: 'code', // 'code' | 'otp'
    beneficiaryName: '',
  })

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
      // The demo account list explicitly promises browser-only sign-in. Keep that
      // path on the mock auth service; only contact the backend in backend mode.
      if (IS_DEMO_MODE) {
        await login({ identifier: email, password, remember: form.values.remember })
        const redirectTarget = location.state?.from ?? '/dashboard'
        navigate(redirectTarget, { replace: true })
        return
      }

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

      setSessionUser(userProfile, form.values.remember, data.token)

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

  const handleAccessCodeSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)
    if (!accessForm.email.trim() || !accessForm.accessCode.trim()) {
      setServerError(
        language === 'vi'
          ? 'Vui lòng nhập Email và Mã truy cập bàn giao.'
          : 'Please enter Email and Access Code.'
      )
      return
    }
    setLoading(true)
    try {
      const res = await beneficiaryLoginWithCodeApi({
        email: accessForm.email.trim(),
        accessCode: accessForm.accessCode.trim(),
      })
      const token = res.claim_session_token || res.sessionToken || res.claimToken
      setAccessForm((prev) => ({
        ...prev,
        sessionToken: token,
        step: 'otp',
        beneficiaryName: res.beneficiary_name || res.beneficiaryName || '',
      }))
    } catch (err) {
      setServerError(err.message || (language === 'vi' ? 'Mã truy cập hoặc email không hợp lệ.' : 'Invalid email or access code.'))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)
    if (!accessForm.otpCode.trim()) {
      setServerError(language === 'vi' ? 'Vui lòng nhập mã OTP.' : 'Please enter OTP.')
      return
    }
    setLoading(true)
    try {
      const res = await verifyBeneficiaryOtpApi({
        sessionToken: accessForm.sessionToken,
        otpCode: accessForm.otpCode.trim(),
      })
      const token = res.access_token || res.token
      if (token) {
        const profile = {
          id: 'beneficiary-access',
          fullName: accessForm.beneficiaryName || accessForm.email.split('@')[0],
          identifier: accessForm.email,
          role: ROLES.BENEFICIARY,
        }
        setSessionUser(profile, false, token)
        navigate('/dashboard/beneficiary', { replace: true })
      } else {
        throw new Error(res.message || 'OTP verification failed.')
      }
    } catch (err) {
      setServerError(err.message || (language === 'vi' ? 'Mã OTP không đúng hoặc đã hết hạn.' : 'Invalid or expired OTP code.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout activeTab="signin">
      <h1 id="auth-title" className="auth-card__title">
        {copy.title}
      </h1>
      <p className="auth-card__subtitle">{copy.subtitle}</p>

      <div style={{ display: 'flex', gap: '8px', margin: '14px 0 16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => { setAuthMode('password'); setServerError(null); }}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '0.875rem',
            fontWeight: authMode === 'password' ? 600 : 400,
            color: authMode === 'password' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: authMode === 'password' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          {language === 'vi' ? 'Đăng nhập mật khẩu' : 'Password Sign In'}
        </button>
        <button
          type="button"
          onClick={() => { setAuthMode('accessCode'); setServerError(null); }}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: '0.875rem',
            fontWeight: authMode === 'accessCode' ? 600 : 400,
            color: authMode === 'accessCode' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: authMode === 'accessCode' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
          {language === 'vi' ? '🔑 Nhận di sản (Mã truy cập)' : '🔑 Access Code Claim'}
        </button>
      </div>

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

      {authMode === 'password' ? (
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
      ) : accessForm.step === 'code' ? (
        <form className="auth-form" noValidate onSubmit={handleAccessCodeSubmit}>
          <FormField
            id="ben-email"
            label={language === 'vi' ? 'Email Người thụ hưởng' : 'Beneficiary Email'}
            type="email"
            value={accessForm.email}
            onChange={(e) => setAccessForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="beneficiary@legacyvault.demo"
            autoComplete="email"
            disabled={loading}
            required
          />

          <FormField
            id="ben-code"
            label={language === 'vi' ? 'Mã truy cập bàn giao' : 'Handover Access Code'}
            value={accessForm.accessCode}
            onChange={(e) => setAccessForm((prev) => ({ ...prev, accessCode: e.target.value }))}
            placeholder="HC-20261022-XXXX-HANDOVER-SECURE"
            hint={
              language === 'vi'
                ? 'Mã 24+ ký tự do Người thực thi (Executor) gửi cho bạn.'
                : 'Access code provided by the case executor.'
            }
            disabled={loading}
            required
          />

          <SubmitButton loading={loading} loadingText={language === 'vi' ? 'Đang xác thực...' : 'Verifying...'}>
            {language === 'vi' ? 'Xác thực mã & Nhận OTP' : 'Verify Code & Send OTP'}
          </SubmitButton>
        </form>
      ) : (
        <form className="auth-form" noValidate onSubmit={handleOtpSubmit}>
          <div style={{ background: 'var(--color-surface-hover, #f8fafc)', padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text)' }}>
              {language === 'vi'
                ? `Mã OTP xác thực đã được gửi đến thiết bị của ${accessForm.beneficiaryName || accessForm.email}.`
                : `Verification OTP has been sent to ${accessForm.beneficiaryName || accessForm.email}.`}
            </p>
            <small style={{ color: 'var(--color-primary)', display: 'block', marginTop: '4px', fontWeight: 600 }}>
              {language === 'vi' ? 'Mã test OTP: 482916' : 'Test OTP: 482916'}
            </small>
          </div>

          <FormField
            id="ben-otp"
            label={language === 'vi' ? 'Nhập mã OTP 6 số' : 'Enter 6-digit OTP'}
            value={accessForm.otpCode}
            onChange={(e) => setAccessForm((prev) => ({ ...prev, otpCode: e.target.value }))}
            placeholder="482916"
            maxLength={6}
            autoComplete="one-time-code"
            hint={language === 'vi' ? 'Nhập mã gồm 6 chữ số' : 'Enter 6-digit code'}
            disabled={loading}
            required
          />

          <SubmitButton loading={loading} loadingText={language === 'vi' ? 'Đang xác thực OTP...' : 'Verifying OTP...'}>
            {language === 'vi' ? 'Xác thực OTP & Mở di sản' : 'Verify OTP & Open Inheritance'}
          </SubmitButton>

          <button
            type="button"
            onClick={() => setAccessForm((prev) => ({ ...prev, step: 'code', otpCode: '' }))}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary)', marginTop: '10px', fontSize: '0.875rem', cursor: 'pointer', textAlign: 'center' }}
          >
            ← {language === 'vi' ? 'Quay lại nhập mã truy cập' : 'Back to Access Code'}
          </button>
        </form>
      )}

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
