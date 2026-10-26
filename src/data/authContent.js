// All text on the sign in, register, OTP and forgot-password pages, one block per language.

const en = {
  backHome: 'Back to home',
  languageLabel: 'Language',
  tabsLabel: 'Account',
  tabs: { signup: 'Sign Up', signin: 'Sign In' },
  demoBadge: 'Demo mode',

  panel: {
    title: 'Your digital legacy, ready for the moment it matters.',
    points: [
      'Records are encrypted before they are stored',
      'Nothing unlocks without a request and your rules',
      'Free to start, no credit card required',
    ],
  },

  signup: {
    title: 'Create your vault owner account',
    subtitle: 'Start protecting your digital legacy in minutes.',
    submit: 'Register',
    submitting: 'Creating account…',
    switchPrompt: 'Already have an account?',
    switchLink: 'Sign in',
    selectedPlan: 'Selected plan',
    changePlan: 'Change',
  },

  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to keep managing your digital legacy.',
    submit: 'Sign in',
    submitting: 'Signing in…',
    switchPrompt: "Don't have an account?",
    switchLink: 'Sign up now',
    remember: 'Keep me signed in',
    forgot: 'Forgot password?',
    verifyNow: 'Verify this account',
    notices: {
      verified: 'Your account is verified. Sign in to continue.',
      loggedOut: 'You have been signed out.',
      signInRequired: 'Please sign in to open that page.',
    },
  },

  demoAccounts: {
    title: 'Demo accounts',
    text: (password) => `Sign-in is simulated in this browser. Every demo account uses the password ${password}.`,
    use: 'Use',
  },

  otp: {
    title: 'Verify your account',
    subtitle: (identifier) => `Enter the 6-digit code for ${identifier}.`,
    demoNote: (code) =>
      `Demo mode: no email or SMS is sent and no real code is checked. Use the code ${code}.`,
    submit: 'Verify',
    submitting: 'Verifying…',
    resend: 'Resend code',
    resending: 'Sending…',
    resendIn: (seconds) => `Resend code in ${seconds}s`,
    resent: (code) => `Demo mode: a new code was "issued", but nothing was sent. Keep using ${code}.`,
    noCode: "Didn't get a code?",
    wrongAccount: 'Register with a different email or phone',
  },

  forgot: {
    title: 'Reset your password',
    subtitle: 'Enter the email on your account.',
    submit: 'Send reset instructions',
    submitting: 'Sending…',
    sent: 'Demo mode: password reset is not built yet, so nothing was sent. In the real app, reset instructions would go to this email or phone if an account exists.',
    back: 'Back to sign in',
  },

  fields: {
    fullName: { label: 'Full name', placeholder: 'John Doe' },
    identifier: { label: 'Email', placeholder: 'john@example.com' },
    password: { label: 'Password', placeholder: 'Enter password', newPlaceholder: 'Create a password' },
    confirmPassword: { label: 'Confirm password', placeholder: 'Re-enter password' },
    code: { label: 'Verification code', placeholder: '6-digit code' },
  },

  showPassword: 'Show password',
  hidePassword: 'Hide password',

  passwordRules: {
    title: 'Your password needs',
    length: 'At least 8 characters',
    upper: 'One uppercase letter',
    number: 'One number',
  },

  terms: {
    before: 'I agree to the',
    terms: 'Terms of Service',
    and: 'and',
    privacy: 'Privacy Policy',
    after: '.',
  },

  validation: {
    fullName: 'Please enter your full name.',
    identifierRequired: 'Please enter your email.',
    identifierInvalid: 'Enter a valid email (name@example.com).',
    passwordRequired: 'Please enter your password.',
    passwordWeak: 'Your password does not meet all the requirements below.',
    confirmRequired: 'Please re-enter your password.',
    confirm: 'Passwords do not match.',
    terms: 'Please accept the Terms of Service and Privacy Policy to continue.',
    otpRequired: 'Please enter the verification code.',
    otpInvalid: 'The code must be exactly 6 digits.',
  },

  errors: {
    INVALID_CREDENTIALS: 'That email and password do not match. Please try again.',
    ACCOUNT_EXISTS: 'An account with this email already exists. Try signing in instead.',
    ACCOUNT_NOT_VERIFIED: 'This account is not verified yet. Enter your verification code first.',
    INVALID_OTP: 'That code is not correct. Check it and try again.',
    OTP_ATTEMPTS_EXCEEDED: 'Too many wrong codes. Request a new code to try again.',
    REGISTRATION_NOT_FOUND:
      'We could not find this registration. In demo mode new accounts are lost when the page reloads, so please register again.',
    NETWORK: 'We could not reach the server. Check your connection and try again.',
    generic: 'Something went wrong. Please try again.',
  },
}

const vi = {
  backHome: 'Về trang chủ',
  languageLabel: 'Ngôn ngữ',
  tabsLabel: 'Tài khoản',
  tabs: { signup: 'Đăng ký', signin: 'Đăng nhập' },
  demoBadge: 'Chế độ demo',

  panel: {
    title: 'Di sản số của bạn, sẵn sàng cho đúng thời điểm.',
    points: [
      'Hồ sơ được mã hóa trước khi lưu trữ',
      'Không gì được mở nếu không có yêu cầu và quy tắc của bạn',
      'Bắt đầu miễn phí, không cần thẻ tín dụng',
    ],
  },

  signup: {
    title: 'Tạo tài khoản chủ kho',
    subtitle: 'Bắt đầu bảo vệ di sản số của bạn chỉ trong vài phút.',
    submit: 'Đăng ký',
    submitting: 'Đang tạo tài khoản…',
    switchPrompt: 'Đã có tài khoản?',
    switchLink: 'Đăng nhập',
    selectedPlan: 'Gói đã chọn',
    changePlan: 'Đổi gói',
  },

  signin: {
    title: 'Chào mừng trở lại',
    subtitle: 'Đăng nhập để tiếp tục quản lý di sản số của bạn.',
    submit: 'Đăng nhập',
    submitting: 'Đang đăng nhập…',
    switchPrompt: 'Chưa có tài khoản?',
    switchLink: 'Đăng ký ngay',
    remember: 'Duy trì đăng nhập',
    forgot: 'Quên mật khẩu?',
    verifyNow: 'Xác minh tài khoản này',
    notices: {
      verified: 'Tài khoản đã được xác minh. Hãy đăng nhập để tiếp tục.',
      loggedOut: 'Bạn đã đăng xuất.',
      signInRequired: 'Vui lòng đăng nhập để mở trang đó.',
    },
  },

  demoAccounts: {
    title: 'Tài khoản demo',
    text: (password) => `Đăng nhập chỉ được mô phỏng trong trình duyệt này. Mọi tài khoản demo dùng mật khẩu ${password}.`,
    use: 'Dùng',
  },

  otp: {
    title: 'Xác minh tài khoản',
    subtitle: (identifier) => `Nhập mã 6 chữ số cho ${identifier}.`,
    demoNote: (code) =>
      `Chế độ demo: không có email hay SMS nào được gửi và không có mã thật nào được kiểm tra. Hãy dùng mã ${code}.`,
    submit: 'Xác minh',
    submitting: 'Đang xác minh…',
    resend: 'Gửi lại mã',
    resending: 'Đang gửi…',
    resendIn: (seconds) => `Gửi lại mã sau ${seconds}s`,
    resent: (code) => `Chế độ demo: đã "cấp" mã mới nhưng không có gì được gửi. Tiếp tục dùng mã ${code}.`,
    noCode: 'Chưa nhận được mã?',
    wrongAccount: 'Đăng ký bằng email hoặc số điện thoại khác',
  },

  forgot: {
    title: 'Đặt lại mật khẩu',
    subtitle: 'Nhập email .',
    submit: 'Gửi hướng dẫn đặt lại',
    submitting: 'Đang gửi…',
    sent: 'Chế độ demo: chức năng đặt lại mật khẩu chưa được xây dựng nên không có gì được gửi. Trong bản thật, hướng dẫn sẽ được gửi tới email này nếu tài khoản tồn tại.',
    back: 'Quay lại đăng nhập',
  },

  fields: {
    fullName: { label: 'Họ và tên', placeholder: 'Nguyễn Văn A' },
    identifier: { label: 'Email ', placeholder: 'ten@example.com ' },
    password: { label: 'Mật khẩu', placeholder: 'Nhập mật khẩu', newPlaceholder: 'Tạo mật khẩu' },
    confirmPassword: { label: 'Xác nhận mật khẩu', placeholder: 'Nhập lại mật khẩu' },
    code: { label: 'Mã xác minh', placeholder: 'Mã 6 chữ số' },
  },

  showPassword: 'Hiện mật khẩu',
  hidePassword: 'Ẩn mật khẩu',

  passwordRules: {
    title: 'Mật khẩu cần có',
    length: 'Ít nhất 8 ký tự',
    upper: 'Một chữ in hoa',
    number: 'Một chữ số',
  },

  terms: {
    before: 'Tôi đồng ý với',
    terms: 'Điều khoản dịch vụ',
    and: 'và',
    privacy: 'Chính sách quyền riêng tư',
    after: '.',
  },

  validation: {
    fullName: 'Vui lòng nhập họ và tên.',
    identifierRequired: 'Vui lòng nhập email.',
    identifierInvalid: 'Nhập email hợp lệ (ten@example.com).',
    passwordRequired: 'Vui lòng nhập mật khẩu.',
    passwordWeak: 'Mật khẩu chưa đáp ứng đủ các yêu cầu bên dưới.',
    confirmRequired: 'Vui lòng nhập lại mật khẩu.',
    confirm: 'Mật khẩu xác nhận không khớp.',
    terms: 'Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư để tiếp tục.',
    otpRequired: 'Vui lòng nhập mã xác minh.',
    otpInvalid: 'Mã phải gồm đúng 6 chữ số.',
  },

  errors: {
    INVALID_CREDENTIALS: 'Email/ hoặc mật khẩu không đúng. Vui lòng thử lại.',
    ACCOUNT_EXISTS: 'Email này đã có tài khoản. Hãy thử đăng nhập.',
    ACCOUNT_NOT_VERIFIED: 'Tài khoản chưa được xác minh. Hãy nhập mã xác minh trước.',
    INVALID_OTP: 'Mã không đúng. Kiểm tra lại và thử lần nữa.',
    OTP_ATTEMPTS_EXCEEDED: 'Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu mã mới để thử lại.',
    REGISTRATION_NOT_FOUND:
      'Không tìm thấy lượt đăng ký này. Ở chế độ demo, tài khoản mới sẽ mất khi tải lại trang, vui lòng đăng ký lại.',
    NETWORK: 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.',
    generic: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
  },
}

export const authContent = { en, vi }
