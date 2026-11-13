import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import DemoAccounts from '../../components/auth/DemoAccounts.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import SubmitButton from '../../components/auth/SubmitButton.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { savePendingVerification } from '../../auth/session.js'
import { getIdentifierType, normalizeIdentifier, validateLogin } from '../../auth/validation.js'
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
  const { login, justLoggedOut, markLogoutSeen } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Message passed from another page (OTP verified, signed out, or a protected page).
  let notice = null
  if (location.state?.verified) notice = location.state?.message || copy.notices.verified
  else if (location.state?.loggedOut) notice = copy.notices.loggedOut
  else if (location.state?.sessionEnded) {
    notice = location.state.message || (IS_DEMO_MODE ? copy.notices.backendRequired : copy.notices.sessionEnded)
  }
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

    const identifier = normalizeIdentifier(form.values.identifier || '')
    const password = form.values.password

    if (!identifier || !password) {
      if (!identifier) {
        setServerError(language === 'vi' ? 'Vui lòng nhập email.' : 'Please enter your email.')
      } else {
        setServerError(language === 'vi' ? 'Vui lòng nhập mật khẩu.' : 'Please enter your password.')
      }
      return
    }
    if (!IS_DEMO_MODE && getIdentifierType(identifier) !== 'email') {
      setServerError(language === 'vi'
        ? 'Backend hiện chỉ hỗ trợ đăng nhập bằng email.'
        : 'The backend currently supports email sign-in only.')
      return
    }

    setLoading(true)

    try {
      await login({ identifier, password, remember: form.values.remember })
      const planTarget = location.state?.planId
        ? `/dashboard/owner/billing?plan=${encodeURIComponent(location.state.planId)}&billing=${encodeURIComponent(location.state.billing || 'monthly')}`
        : '/dashboard'
      const redirectTarget = location.state?.from ?? planTarget
      navigate(redirectTarget, { replace: true })
    } catch (error) {
      setServerError(
        error.code || error.message ||
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
