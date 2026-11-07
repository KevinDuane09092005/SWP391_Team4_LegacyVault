// Non-AI, deterministic guide answers for UI demonstration only.
// Does not read vaults, private documents, accounts, or live user data.
export const chatCopy = {
  vi: {
    heading: 'Trợ lý LegacyVault',
    subtitleDemo: 'Hướng dẫn sử dụng · Bản demo',
    subtitleApi: 'Hỗ trợ qua AI',
    open: 'Mở trợ lý LegacyVault',
    close: 'Đóng cửa sổ chat',
    clear: 'Xóa cuộc trò chuyện',
    send: 'Gửi tin nhắn',
    placeholder: 'Nhập câu hỏi của bạn...',
    welcome: 'Xin chào! Mình có thể hướng dẫn bạn về kho tài sản số, người thụ hưởng, Dead Man’s Switch và quy trình bàn giao.',
    hint: 'Bạn có thể hỏi về cách sử dụng các tính năng của LegacyVault.',
    suggestions: 'Câu hỏi gợi ý',
    disclaimer: 'Thông tin chỉ để tham khảo, không phải tư vấn pháp lý. Không nhập mật khẩu, OTP hoặc khóa ví.',
    typing: 'Đang trả lời…',
    error: 'Không thể kết nối trợ lý lúc này. Vui lòng thử lại.',
    noReply: 'Chưa nhận được nội dung phản hồi từ dịch vụ AI.',
    tooLong: 'Câu hỏi tối đa 1.000 ký tự.',
    notSent: 'Chưa gửi thành công',
    clarification: 'Cần thêm thông tin để trả lời',
    outOfScope: 'Ngoài phạm vi hướng dẫn hiện có',
    fallback: 'Mình chưa có hướng dẫn cụ thể cho câu hỏi này trong bản demo. Bạn có thể hỏi về Vault, tài sản, người thụ hưởng, Dead Man’s Switch, xác minh pháp lý hoặc bàn giao. Để nhận câu trả lời AI thực, nhóm cần kết nối API.',
    prompts: {
      default: [
        'Làm sao thêm tài sản?',
        'Dead Man’s Switch là gì?',
        'Người thụ hưởng là ai?',
      ],
      owner: ['Làm sao thêm tài sản?', 'Cách chỉ định người thụ hưởng?', 'Cách check-in?'],
      executor: ['Executor cần làm gì?', 'Xác minh pháp lý cần gì?', 'Bàn giao khi nào?'],
      beneficiary: ['Khi nào tôi nhận được tài sản?', 'Tôi xác thực danh tính thế nào?', 'Có được xem tất cả tài sản không?'],
      verifier: ['Legal Verifier có vai trò gì?', 'Giấy chứng tử đã đủ chưa?', 'Khi nào được phê duyệt?'],
      admin: ['Admin được xem tài sản không?', 'Audit Log dùng để làm gì?', 'Thông báo có an toàn không?'],
    },
  },
  en: {
    heading: 'LegacyVault Assistant',
    subtitleDemo: 'Product guidance · Demo',
    subtitleApi: 'AI-powered assistance',
    open: 'Open LegacyVault assistant',
    close: 'Close chat window',
    clear: 'Clear conversation',
    send: 'Send message',
    placeholder: 'Ask a question...',
    welcome: 'Hello! I can guide you through digital vaults, beneficiaries, Dead Man’s Switch, legal verification and handover.',
    hint: 'Ask about how LegacyVault features work.',
    suggestions: 'Suggested questions',
    disclaimer: 'General information only, not legal advice. Never enter passwords, OTP codes or wallet recovery keys.',
    typing: 'Preparing a reply…',
    error: 'Unable to reach the assistant right now. Please try again.',
    noReply: 'The AI service returned an empty response.',
    tooLong: 'Questions must be 1,000 characters or fewer.',
    notSent: 'Delivery failed',
    clarification: 'More information is needed',
    outOfScope: 'Outside available product guidance',
    fallback: 'I do not have a specific answer in this demo. You can ask about vaults, assets, beneficiaries, Dead Man’s Switch, legal verification, or handover. Real AI answers require connecting a backend API.',
    prompts: {
      default: ['How do I add an asset?', 'What is Dead Man’s Switch?', 'Who is a beneficiary?'],
      owner: ['How do I add an asset?', 'How do I assign beneficiaries?', 'How do I check in?'],
      executor: ['What does an executor do?', 'What legal documents are needed?', 'When can handover start?'],
      beneficiary: ['When can I receive assets?', 'How do I verify my identity?', 'Can I see all assets?'],
      verifier: ['What can a legal verifier do?', 'Is a death certificate enough?', 'When can a case be approved?'],
      admin: ['Can admins see private assets?', 'What are audit logs?', 'Are notifications secure?'],
    },
  },
}

const answers = {
  asset: {
    vi: 'Đăng nhập bằng vai trò Vault Owner, mở Dashboard → Tài sản của tôi → Thêm tài sản. Điền thông tin và lưu. Chỉ đưa thông tin cần thiết lên hệ thống và dùng tính năng bảo vệ dữ liệu theo hướng dẫn.',
    en: 'Sign in as Vault Owner, open Dashboard → My Assets → Add Asset. Enter the details and save. Only provide necessary information and use the available security protections.',
  },
  vault: {
    vi: 'Kho tài sản số giúp Vault Owner tổ chức thông tin về tài khoản, tài liệu và các tài sản kỹ thuật số. Việc lưu thông tin không tự tạo quyền sở hữu hoặc quyền thừa kế.',
    en: 'A digital vault helps a Vault Owner organize account information, documents, and digital assets. Saving information does not establish ownership or inheritance rights.',
  },
  assignment: {
    vi: 'Mở Dashboard → Assignments để chọn tài sản, người thụ hưởng (Beneficiary), người thi hành (Executor), tỷ lệ phân chia và hướng dẫn bàn giao. Cấu hình này là nguyện vọng của chủ sở hữu, không tự thay thế di chúc hợp pháp.',
    en: 'Open Dashboard → Assignments to choose assets, beneficiaries, an executor, allocation percentages, and handover instructions. These settings express the owner’s preferences; they do not replace a legally valid will.',
  },
  dms: {
    vi: 'Dead Man’s Switch theo dõi việc check-in định kỳ. Nếu không nhận được phản hồi sau thời hạn và Grace Period, hệ thống có thể khởi tạo hồ sơ xem xét bàn giao. Việc này không chứng minh chủ sở hữu đã qua đời và không tự mở khóa tài sản.',
    en: 'Dead Man’s Switch monitors periodic check-ins. If no response is received after the interval and grace period, a handover review case may be created. This does not prove that the owner has died and must not automatically unlock assets.',
  },
  checkin: {
    vi: 'Đăng nhập Vault Owner → Dead Man’s Switch, xem thời hạn và nhấn Check-in khi có yêu cầu. Backend cần xác nhận check-in và cập nhật thời gian theo cấu hình thực tế.',
    en: 'Sign in as Vault Owner → Dead Man’s Switch, review the deadline and select Check-in when needed. The backend must confirm your check-in and update the schedule.',
  },
  executor: {
    vi: 'Digital Executor nhận thông báo khi hồ sơ bàn giao được kích hoạt, chuẩn bị tài liệu và gửi yêu cầu xác minh pháp lý. Executor chỉ thực hiện hành động trong phạm vi quyền hợp pháp và được hệ thống cho phép.',
    en: 'A Digital Executor is notified when a handover case is triggered, prepares supporting documents, and submits them for legal review. The executor may act only within their lawful and authorized scope.',
  },
  legal: {
    vi: 'Giấy chứng tử có thể là một phần hồ sơ nhưng không tự chứng minh quyền thừa kế. Tùy trường hợp còn cần di chúc, căn cứ về người thừa kế, quyền đại diện và các tài liệu liên quan. Chỉ người có thẩm quyền mới thực hiện công chứng theo luật.',
    en: 'A death certificate may form part of the file but does not, on its own, establish inheritance rights. A will, evidence of heirs, authority documents, and other records may be necessary. Notarization must be performed by legally authorized persons.',
  },
  beneficiary: {
    vi: 'Beneficiary là người được chỉ định nhận một phần tài sản hoặc thông tin. Chỉ định trên LegacyVault không tự bảo đảm quyền thừa kế; người nhận phải đáp ứng các điều kiện pháp lý và xác thực danh tính trước khi được cấp quyền.',
    en: 'A beneficiary is someone nominated to receive certain assets or information. Being listed in LegacyVault does not automatically confer inheritance rights; legal and identity checks apply before access is granted.',
  },
  verify: {
    vi: 'Trong quy trình nhận bàn giao, hệ thống có thể yêu cầu đăng nhập và xác thực OTP/KYC. Không chia sẻ mã OTP hoặc giấy tờ nhận dạng qua khung chat này.',
    en: 'The handover process may require sign-in and OTP/KYC identity checks. Never share an OTP code or identity documents through this chat.',
  },
  handover: {
    vi: 'Sau khi hồ sơ được phê duyệt hợp lệ, Executor có thể bắt đầu bàn giao. Beneficiary cần xác thực danh tính và chỉ được xem tài sản được cấp quyền. Tiến trình phải được ghi nhận; không phải mọi tài khoản bên thứ ba đều có thể chuyển quyền.',
    en: 'After valid legal approval, the executor may start handover. Beneficiaries must verify identity and may access only authorized assets. The process should be logged; not every third-party account is transferable.',
  },
  admin: {
    vi: 'Quản trị viên có thể quản lý tài khoản, phân quyền và giám sát bảo mật trong phạm vi nhiệm vụ. Quyền Admin không mặc nhiên cho phép đọc dữ liệu tài sản đã mã hóa hoặc tự duyệt hồ sơ pháp lý.',
    en: 'Administrators may manage accounts, roles, and security within their duties. Admin status does not automatically grant access to encrypted assets or authority to approve legal cases.',
  },
  audit: {
    vi: 'Audit Log ghi nhận các thao tác quan trọng như đăng nhập, phê duyệt, thay đổi quyền hoặc truy cập tài sản. Thông báo không nên chứa mật khẩu, OTP hay dữ liệu tài sản nhạy cảm.',
    en: 'Audit logs record important activities such as sign-in, approvals, permission changes, and asset access. Notifications should never reveal passwords, OTP codes, or sensitive asset contents.',
  },
  billing: {
    vi: 'Các gói và thông tin thanh toán được hiển thị tại mục Gói & thanh toán nếu nhóm đã bật chức năng này. Đây là giao diện demo; các thao tác thanh toán thật cần Backend và cổng thanh toán an toàn.',
    en: 'Plans and billing information appear under Plan & billing when enabled. This is a demo interface; real payments require secure backend processing and a payment provider.',
  },
  secret: {
    vi: 'Vì an toàn, đừng gửi mật khẩu, OTP, mã khôi phục ví, private key hoặc tài liệu nhạy cảm vào Chatbot. Mình chỉ có thể hướng dẫn thao tác chung, không xem hay giải mã tài sản của bạn.',
    en: 'For your safety, do not send passwords, OTPs, recovery phrases, private keys, or sensitive documents to this chatbot. I can provide general guidance but cannot view or decrypt your assets.',
  },
}

function normalizeQuestion(text) {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
}

export function getDemoReply(question, language = 'vi') {
  const lang = language === 'en' ? 'en' : 'vi'
  const input = normalizeQuestion(question)
  const asciiPatterns = [
    ['secret', /(?:seed phrase|recovery phrase|private key|khoa bi mat|mat khau|otp.*(?:gui|send)|gui.*otp|recovery key)/],
    ['checkin', /(?:check[ -]?in|xac nhan con song)/],
    ['legal', /(?:giay chung tu|death certificate|legal|phap ly|cong chung|di chuc|\bwill\b|notary)/],
    ['verify', /(?:identity|kyc|xac thuc|otp|danh tinh)/],
    ['dms', /(?:dead man|grace period|\bdms\b|kiem tra dinh ky|khong phan hoi)/],
    ['executor', /(?:executor|trustee|nguoi thi hanh)/],
    ['assignment', /(?:assign|allocation|ty le|phan chia|chi dinh)/],
    ['handover', /(?:handover|ban giao|nhan duoc tai san|receive assets?)/],
    ['beneficiary', /(?:beneficiary|thu huong|thua ke)/],
    ['admin', /(?:admin|quan tri vien)/],
    ['audit', /(?:audit|\blog\b|nhat ky|notification|thong bao)/],
    ['billing', /(?:billing|payment|thanh toan|goi phi)/],
    ['asset', /(?:asset|tai san|them tai san)/],
    ['vault', /(?:vault|kho luu tru)/],
  ]
  const matched = asciiPatterns.find(([,regex]) => regex.test(input))
  return matched ? answers[matched[0]][lang] : chatCopy[lang].fallback
}

export function getPromptCategory(role) {
  const r = String(role ?? '').toUpperCase()
  if (r.includes('OWNER')) return 'owner'
  if (r.includes('EXECUTOR') || r.includes('TRUSTEE')) return 'executor'
  if (r.includes('BENEFICIARY')) return 'beneficiary'
  if (r.includes('VERIFIER') || r.includes('NOTARY')) return 'verifier'
  if (r.includes('ADMIN')) return 'admin'
  return 'default'
}
