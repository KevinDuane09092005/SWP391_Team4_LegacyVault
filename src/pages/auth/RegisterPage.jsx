import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AuthLayout from '../../components/auth/AuthLayout.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import PasswordRules from '../../components/auth/PasswordRules.jsx'
import SubmitButton from '../../components/auth/SubmitButton.jsx'
import Icon from '../../components/Icon.jsx'
import { savePendingVerification } from '../../auth/session.js'
import { validateRegister } from '../../auth/validation.js'
import { authContent } from '../../data/authContent.js'
import { pricingContent } from '../../data/pricingContent.js'
import useForm from '../../hooks/useForm.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { register } from '../../services/authService.js'

// Flow 1 — Create a Vault Owner account, then continue to OTP verification.
export default function RegisterPage() {
  const { language } = useLanguage()
  const t = authContent[language]
  const copy = t.signup
  const navigate = useNavigate()

  // Plan chosen on the pricing page, e.g. /register?plan=essentials&billing=yearly
  const [searchParams] = useSearchParams()
  const pricing = pricingContent[language]
  const planId = searchParams.get('plan')
  const plan = pricing.plans[planId]
  const billing = searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly'

  const form = useForm({
    formId: 'register',
    initialValues: { fullName: '', identifier: '', password: '', confirmPassword: '', terms: false },
    validate: (values) => validateRegister(values, t.validation),
    fieldOrder: ['fullName', 'identifier', 'password', 'confirmPassword', 'terms'],
  })
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError(null)

    const fullName = form.values.fullName?.trim()
    const email = form.values.identifier?.trim()
    const password = form.values.password

    // 1. Validate cơ bản trước khi gửi: các trường không được để trống, email đúng định dạng
    if (!fullName) {
      setServerError(language === 'vi' ? 'Vui lòng nhập họ và tên.' : 'Please enter your full name.')
      return
    }
    if (!email) {
      setServerError(language === 'vi' ? 'Vui lòng nhập địa chỉ email.' : 'Please enter your email.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setServerError(
        language === 'vi' ? 'Địa chỉ email không đúng định dạng.' : 'Please enter a valid email address.',
      )
      return
    }
    if (!password) {
      setServerError(language === 'vi' ? 'Vui lòng nhập mật khẩu.' : 'Please enter your password.')
      return
    }
    if (form.values.confirmPassword && form.values.confirmPassword !== password) {
      setServerError(language === 'vi' ? 'Mật khẩu xác nhận không khớp.' : 'Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const data = await register({
        fullName,
        identifier: email,
        password,
        plan: planId,
        billing,
      })

      // 5. Lưu tạm thông tin người dùng để phục vụ xác thực OTP
      savePendingVerification({
        identifier: email,
        fullName,
        userId: data.userId,
        testOtp: data.testOtp,
        planId,
        billing,
      })

      sessionStorage.setItem('pendingEmail', email)

      // 6. Chuyển hướng người dùng sang trang Xác thực OTP (/verify-otp) kèm email
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
        state: {
          email,
          fullName,
          userId: data.userId,
          testOtp: data.testOtp,
          planId,
          billing,
          message:
            language === 'vi'
              ? 'Đăng ký thành công! Vui lòng kiểm tra email để lấy mã OTP xác thực.'
              : 'Registered successfully! Please check your email for the verification code.',
        },
      })
    } catch (error) {
      // Bắt lỗi qua khối catch, trích xuất thông điệp từ trường error
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

  const termsError = form.errorFor('terms')
  const revealLabels = { show: t.showPassword, hide: t.hidePassword }

  return (
    <AuthLayout activeTab="signup">
      <h1 id="auth-title" className="auth-card__title">
        {copy.title}
      </h1>
      <p className="auth-card__subtitle">{copy.subtitle}</p>

      {plan && (
        <p className="auth-plan">
          <span>
            {copy.selectedPlan}: <strong>{plan.name}</strong> · {pricing.controls[billing]}
          </span>
          <Link to="/pricing" className="auth-link">
            {copy.changePlan}
          </Link>
          <small>
            {language === 'vi'
              ? 'Bạn có thể hoàn tất thanh toán trong mục Gói & thanh toán sau khi xác minh và đăng nhập.'
              : 'You can complete checkout from Plan & billing after verifying and signing in.'}
          </small>
        </p>
      )}

      {serverError && <FormAlert>{t.errors?.[serverError] ?? serverError ?? t.errors?.generic}</FormAlert>}

      <form className="auth-form" noValidate onSubmit={handleSubmit}>
        <FormField
          {...form.fieldProps('fullName')}
          label={t.fields.fullName.label}
          placeholder={t.fields.fullName.placeholder}
          autoComplete="name"
          disabled={loading}
        />

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
          placeholder={t.fields.password.newPlaceholder}
          autoComplete="new-password"
          revealLabels={revealLabels}
          disabled={loading}
        >
          <PasswordRules password={form.values.password} labels={t.passwordRules} />
        </FormField>

        <FormField
          {...form.fieldProps('confirmPassword')}
          type="password"
          label={t.fields.confirmPassword.label}
          placeholder={t.fields.confirmPassword.placeholder}
          autoComplete="new-password"
          revealLabels={revealLabels}
          disabled={loading}
        />

        <div>
          <label className="check-field__label">
            <input
              id="register-terms"
              type="checkbox"
              checked={form.values.terms}
              onChange={form.handleChange('terms')}
              disabled={loading}
              aria-invalid={termsError ? 'true' : undefined}
              aria-describedby={termsError ? 'register-terms-error' : undefined}
            />
            <span>
              {t.terms.before}{' '}
              <a href="/terms" target="_blank" rel="noreferrer" className="auth-link">
                {t.terms.terms}
              </a>{' '}
              {t.terms.and}{' '}
              <a href="/privacy" target="_blank" rel="noreferrer" className="auth-link">
                {t.terms.privacy}
              </a>
              {t.terms.after}
            </span>
          </label>
          {termsError && (
            <p id="register-terms-error" className="field__error">
              <Icon name="alertCircle" size={14} />
              {termsError}
            </p>
          )}
        </div>

        <SubmitButton loading={loading} loadingText={copy.submitting}>
          {copy.submit}
        </SubmitButton>
      </form>

      <p className="auth-switch">
        {copy.switchPrompt}{' '}
        <Link to="/login" className="auth-link">
          {copy.switchLink}
        </Link>
      </p>
    </AuthLayout>
  )
}
