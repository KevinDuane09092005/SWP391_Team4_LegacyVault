// User-facing bilingual legal-policy drafts. Content and feature claims must be
// reviewed by the team and qualified Vietnamese counsel before public launch.
// Section IDs are shared by English and Vietnamese for stable anchor navigation.
export const LEGAL_DOCUMENT_VERSION = 'Draft 0.1'

const termsEn = [
  { id: 'service', title: 'About LegacyVault', paragraphs: [
    'LegacyVault helps you organize information about digital assets, prepare instructions, and identify people who may be involved in a future handover. It supports the process; it does not itself make a will, decide who legally inherits property, or transfer ownership.',
    'These Terms explain how you may use the service and what you should understand before storing sensitive information.'
  ] },
  { id: 'accounts', title: 'Accounts and eligibility', paragraphs: [
    'You are responsible for providing accurate account details, protecting your sign-in credentials, and keeping contact information up to date. Do not share passwords or one-time codes.',
    'Access to certain features may depend on a verified account, your assigned role, and additional identity checks. We may restrict access when necessary to address suspected misuse or protect users, subject to applicable law.'
  ] },
  { id: 'assets', title: 'Digital assets and your responsibilities', paragraphs: [
    'You may record information about bank accounts, crypto wallets, online services, documents, and other digital assets only where you have lawful authority to do so.',
    'You remain responsible for the accuracy of asset information, handover instructions, and supporting records. Do not upload another person’s confidential information without a lawful basis.'
  ] },
  { id: 'people', title: 'Beneficiaries and executors', paragraphs: [
    'You may nominate a Beneficiary or an Executor/Trustee and specify instructions for particular assets. A nomination in LegacyVault is a record of your intentions; it is not automatically a legally effective will, inheritance decision, or power of attorney.',
    'The rights of heirs, representatives, and other interested parties depend on applicable law and supporting legal documents. The service may limit actions to what an individual is authorized to do.'
  ] },
  { id: 'dms', title: 'Check-ins and Dead Man’s Switch', paragraphs: [
    'If you enable Dead Man’s Switch, you can set a check-in interval and grace period. Missed check-ins may lead to reminders and the creation of a case for further review.',
    'Missing a check-in does not prove death or incapacity. Triggering a case alone must not release private assets; identity, legal, and access checks are still required.'
  ] },
  { id: 'verification', title: 'Legal verification', paragraphs: [
    'An Executor may need to provide a death certificate, will, proof of legal authority, or other supporting documents. Reviewers may request additional information or reject an incomplete or inconsistent submission.',
    'A decision shown in the application is not the same as a court judgment or notarization. Any notarial act or legally effective signature must follow the requirements of the relevant law and authorized provider.'
  ] },
  { id: 'handover', title: 'Access and handover', paragraphs: [
    'Access to a particular asset or document depends on verification and authorization for that asset. Beneficiaries must not attempt to access information outside their permitted scope.',
    'Where there is a dispute, missing documentation, or a legal restriction, a handover may be paused. Providing a record or instructions does not guarantee that a bank, platform, or other service will transfer an account or asset.'
  ] },
  { id: 'third-parties', title: 'External services', paragraphs: [
    'Banks, crypto platforms, identity-verification vendors, messaging services, and other third parties may have their own rules and privacy practices. Their decisions and systems are outside LegacyVault’s control.',
    'Do not assume an account can be transferred, a password can be shared, or a private key can be disclosed simply because it has been recorded in a vault.'
  ] },
  { id: 'acceptable-use', title: 'Acceptable use', paragraphs: [
    'You must not submit forged documents, impersonate another person, bypass authorization, compromise security, misuse someone else’s data, or use the service for unlawful purposes.',
    'We may review and respond to suspected violations where necessary and lawful. These restrictions apply to all user roles.'
  ] },
  { id: 'privacy', title: 'Privacy and security', paragraphs: [
    'Sensitive records require care. Access controls, protective storage measures, and activity logs are part of the intended design; specific security capabilities must be confirmed before live deployment.',
    'Read the Privacy Policy to understand the categories of information the service may process, why it is used, and how data-related requests may be handled.'
  ] },
  { id: 'limitations', title: 'Service limitations and changes', paragraphs: [
    'LegacyVault is a technology platform, not a law firm, court, notary, bank, or fiduciary. Content in the service is general information and is not personalized legal or financial advice.',
    'Digital services can experience downtime or technical failures. Changes to features or these Terms should be communicated through an appropriate channel before they take effect. Paid-plan, refund, liability, and account-termination provisions require separate confirmation before commercial launch.'
  ] },
  { id: 'contact', title: 'Questions and disputes', paragraphs: [
    'If you have a concern about an asset, an access request, or another user’s actions, do not share sensitive credentials. Use the official support or dispute channel once published.',
    'The operator’s legal identity, support contact, effective date, governing terms, and dispute-resolution process are to be completed before this document can be used as a binding agreement.'
  ] },
]

const termsVi = [
  { id: 'service', title: 'Giới thiệu LegacyVault', paragraphs: [
    'LegacyVault giúp bạn sắp xếp thông tin tài sản số, chuẩn bị hướng dẫn và chỉ định những người có thể tham gia quá trình bàn giao trong tương lai. Nền tảng chỉ hỗ trợ quy trình, không tự tạo di chúc, quyết định người thừa kế hợp pháp hoặc chuyển quyền sở hữu.',
    'Điều khoản này giải thích cách sử dụng dịch vụ và những điều bạn cần biết trước khi lưu thông tin nhạy cảm.'
  ] },
  { id: 'accounts', title: 'Tài khoản và điều kiện sử dụng', paragraphs: [
    'Bạn có trách nhiệm cung cấp thông tin tài khoản chính xác, bảo vệ thông tin đăng nhập và cập nhật thông tin liên hệ. Không chia sẻ mật khẩu hoặc mã OTP.',
    'Một số chức năng có thể yêu cầu tài khoản đã xác minh, vai trò phù hợp hoặc kiểm tra danh tính bổ sung. Việc truy cập có thể bị hạn chế khi cần ngăn ngừa lạm dụng hoặc bảo vệ người dùng, trong phạm vi pháp luật cho phép.'
  ] },
  { id: 'assets', title: 'Tài sản số và trách nhiệm của bạn', paragraphs: [
    'Bạn chỉ được lưu thông tin về tài khoản ngân hàng, ví tiền mã hóa, dịch vụ trực tuyến, tài liệu và các tài sản số khác khi có quyền hợp pháp đối với thông tin đó.',
    'Bạn chịu trách nhiệm về độ chính xác của thông tin tài sản, hướng dẫn bàn giao và giấy tờ hỗ trợ. Không tải lên dữ liệu bí mật của người khác khi không có căn cứ hợp pháp.'
  ] },
  { id: 'people', title: 'Người thụ hưởng và người thi hành', paragraphs: [
    'Bạn có thể chỉ định Beneficiary hoặc Executor/Trustee và ghi hướng dẫn cho từng tài sản. Chỉ định trên LegacyVault chỉ thể hiện ý định của bạn, không mặc nhiên là di chúc hợp pháp, quyết định thừa kế hay giấy ủy quyền.',
    'Quyền của người thừa kế, người đại diện và các bên liên quan phụ thuộc vào pháp luật cùng tài liệu chứng minh. Hệ thống có thể giới hạn thao tác theo quyền hợp lệ của từng người.'
  ] },
  { id: 'dms', title: 'Check-in và Dead Man’s Switch', paragraphs: [
    'Khi bật Dead Man’s Switch, bạn có thể đặt chu kỳ check-in và thời gian gia hạn. Việc bỏ lỡ check-in có thể dẫn đến nhắc nhở và tạo hồ sơ để xem xét tiếp.',
    'Không check-in không phải bằng chứng bạn đã qua đời hoặc mất năng lực hành vi. Việc kích hoạt hồ sơ không tự động cho phép bàn giao tài sản riêng tư; vẫn phải kiểm tra danh tính, căn cứ pháp lý và quyền truy cập.'
  ] },
  { id: 'verification', title: 'Xác minh pháp lý', paragraphs: [
    'Người thi hành có thể phải cung cấp giấy chứng tử, di chúc, giấy tờ chứng minh thẩm quyền hoặc tài liệu liên quan. Người thẩm định có thể yêu cầu bổ sung hoặc từ chối hồ sơ thiếu, sai lệch thông tin.',
    'Quyết định hiển thị trong ứng dụng không tương đương phán quyết của tòa án hoặc hoạt động công chứng. Công chứng và chữ ký có giá trị pháp lý riêng phải đáp ứng điều kiện của pháp luật và chủ thể có thẩm quyền.'
  ] },
  { id: 'handover', title: 'Truy cập và bàn giao tài sản', paragraphs: [
    'Quyền xem hoặc nhận từng tài sản, tài liệu phụ thuộc vào kết quả xác minh và quyền được cấp đối với tài sản đó. Người thụ hưởng không được tìm cách truy cập dữ liệu ngoài phạm vi cho phép.',
    'Nếu có tranh chấp, thiếu giấy tờ hoặc hạn chế pháp lý, quá trình bàn giao có thể bị tạm dừng. Việc cung cấp thông tin hoặc hướng dẫn không bảo đảm ngân hàng hay nền tảng bên ngoài sẽ chuyển giao tài khoản hoặc tài sản.'
  ] },
  { id: 'third-parties', title: 'Dịch vụ bên thứ ba', paragraphs: [
    'Ngân hàng, nền tảng tiền mã hóa, đơn vị xác minh danh tính, dịch vụ thông báo và các bên thứ ba khác có thể có quy định và chính sách riêng. LegacyVault không kiểm soát quyết định hoặc hệ thống của họ.',
    'Không nên cho rằng một tài khoản có thể chuyển nhượng, mật khẩu có thể chia sẻ hay khóa riêng có thể tiết lộ chỉ vì đã lưu thông tin trong kho.'
  ] },
  { id: 'acceptable-use', title: 'Sử dụng hợp lệ', paragraphs: [
    'Bạn không được gửi giấy tờ giả, mạo danh người khác, vượt quyền truy cập, tấn công bảo mật, sử dụng sai dữ liệu của người khác hoặc dùng dịch vụ cho mục đích trái pháp luật.',
    'Khi cần thiết và hợp pháp, đơn vị vận hành có thể rà soát và xử lý dấu hiệu vi phạm. Quy định này áp dụng cho mọi vai trò người dùng.'
  ] },
  { id: 'privacy', title: 'Quyền riêng tư và bảo mật', paragraphs: [
    'Thông tin nhạy cảm cần được bảo vệ phù hợp. Phân quyền, biện pháp lưu trữ an toàn và nhật ký hoạt động là một phần định hướng thiết kế; các năng lực bảo mật cụ thể phải được xác nhận trước khi triển khai chính thức.',
    'Hãy đọc Chính sách quyền riêng tư để biết các loại dữ liệu hệ thống có thể xử lý, mục đích sử dụng và cách tiếp nhận yêu cầu liên quan đến dữ liệu.'
  ] },
  { id: 'limitations', title: 'Giới hạn dịch vụ và thay đổi', paragraphs: [
    'LegacyVault là nền tảng công nghệ, không phải công ty luật, tòa án, tổ chức hành nghề công chứng, ngân hàng hoặc đơn vị nhận ủy thác. Nội dung cung cấp mang tính thông tin chung, không phải tư vấn pháp lý hay tài chính riêng.',
    'Dịch vụ số có thể gặp gián đoạn hoặc sự cố kỹ thuật. Các thay đổi quan trọng về chức năng hoặc điều khoản cần được thông báo thích hợp trước khi áp dụng. Điều khoản về gói trả phí, hoàn tiền, giới hạn trách nhiệm và chấm dứt tài khoản cần được xác nhận trước khi triển khai thương mại.'
  ] },
  { id: 'contact', title: 'Liên hệ và giải quyết tranh chấp', paragraphs: [
    'Nếu có thắc mắc về tài sản, yêu cầu truy cập hoặc hành vi của người dùng khác, không chia sẻ thông tin đăng nhập nhạy cảm. Hãy sử dụng kênh hỗ trợ hoặc giải quyết tranh chấp chính thức sau khi được công bố.',
    'Tên pháp lý đơn vị vận hành, thông tin liên hệ, ngày hiệu lực, các điều khoản áp dụng và quy trình giải quyết tranh chấp cần được hoàn thiện trước khi văn bản này trở thành thỏa thuận có hiệu lực.'
  ] },
]

const privacyEn = [
  { id: 'scope', title: 'Who this Policy covers', paragraphs: [
    'This Policy describes personal information that may be processed when people use LegacyVault as a Vault Owner, Executor/Trustee, Beneficiary, Legal Verifier, or System Administrator.',
    'The website is currently a university project/prototype. Actual processing, service providers, and retention periods must be verified by the operator before production use.'
  ] },
  { id: 'categories', title: 'Information we may handle', bullets: [
    'Account and contact details: name, email address, phone number, assigned user roles, and login status.',
    'Vault and asset information: asset descriptions, handover instructions, contact assignments, and attached documents.',
    'Verification material, if enabled: identity evidence, death certificates, wills, legal records, OTP/eKYC status, and approval outcomes.',
    'Usage and security information: check-in records, relevant IP addresses, device/session events, access attempts, and audit entries.',
    'Communication information: support requests, notifications, and chatbot questions when a person uses those features.',
    'Billing information, if payment features are enabled: plan and transaction status; payment-provider handling must be documented separately.'
  ] },
  { id: 'purposes', title: 'Why information is used', paragraphs: [
    'Information may be processed to create accounts, authenticate users, maintain digital vaults, manage assignments and check-ins, review handover cases, deliver permitted information, send service notices, prevent abuse, and meet applicable legal duties.',
    'Information should not be reused for unrelated purposes without an appropriate legal basis and notice.'
  ] },
  { id: 'lawful-basis', title: 'Legal basis and choices', paragraphs: [
    'The lawful basis for each processing activity must be assessed under applicable Vietnamese law. Where consent is required, users should receive a clear explanation and a genuine choice before processing starts.',
    'Agreeing to Terms of Service is not automatically the same as giving every privacy consent. Any separate consent, withdrawal, or exception required by law must be handled explicitly.'
  ] },
  { id: 'roles', title: 'Who may access data', paragraphs: [
    'Access should be limited by the user’s role and the purpose of the task. A Beneficiary should only see information they are authorized to receive; an Executor or Verifier should only access the records needed for the relevant case.',
    'System administrators should not automatically receive access to the readable contents of private vaults. Security and role enforcement must be checked on the backend.'
  ] },
  { id: 'sharing', title: 'When data may be shared', paragraphs: [
    'Depending on the features enabled, information may need to be disclosed to specifically authorized recipients, legal reviewers, hosting providers, identity-verification services, messaging providers, or other service partners.',
    'The service must identify real vendors, processing purposes, transfer locations, and relevant safeguards before launch. The project draft does not claim that any specific vendor is contracted.'
  ] },
  { id: 'ai', title: 'AI assistant and conversations', paragraphs: [
    'If you use the AI assistant, your current question and limited recent conversation history may be sent to the backend and its configured AI provider to generate a response. The current API design does not require the application backend to persist chat messages; the provider’s own handling may differ.',
    'The assistant is intended for general product guidance, not access to your private vault or legal advice. Never enter passwords, recovery phrases, OTP codes, identification numbers, or confidential asset information.'
  ] },
  { id: 'storage', title: 'Storage, security, and retention', paragraphs: [
    'The system design includes authentication, access restrictions, encryption for sensitive records, and logs for important actions. The implementation and effectiveness of these controls must be verified before use with real assets.',
    'Retention periods, backup schedules, and deletion exceptions are not finalized in this prototype. The final policy must state how long each data category is kept and when deletion is not possible due to legal obligations.'
  ] },
  { id: 'browser', title: 'Browser storage and preferences', paragraphs: [
    'The frontend may use browser local storage or session storage to keep sign-in sessions, a language preference, theme choice, and demo data. Browser storage is not the same as a secure long-term record repository.',
    'Any analytics, advertising trackers, or non-essential cookies added in future must be disclosed and controlled as required by law. Their presence is not assumed by this draft.'
  ] },
  { id: 'rights', title: 'Your privacy rights', paragraphs: [
    'Subject to applicable law, you may have rights to know about processing, access data, request correction or deletion, withdraw consent where relevant, object to certain processing, and raise a complaint.',
    'The production service must offer a verified request channel, protect other people’s rights, and explain any legal limitations or mandatory retention.'
  ] },
  { id: 'deceased', title: 'Deceased persons and sensitive records', paragraphs: [
    'A deceased person’s documents can also contain personal information about living relatives, beneficiaries, and other people. The service must handle these records with particular care and respect lawful inheritance, representation, and privacy requirements.',
    'An inactivity trigger does not establish death, and a submitted document does not automatically grant access to other people’s information.'
  ] },
  { id: 'incidents', title: 'Incidents and international processing', paragraphs: [
    'The operator must maintain a process to assess and address security incidents and make any notifications required by applicable law.',
    'If information is processed or transferred outside Vietnam, the actual countries, providers, purposes, and applicable legal requirements must be assessed and disclosed before use.'
  ] },
  { id: 'contact', title: 'Policy updates and contact', paragraphs: [
    'Material updates should be communicated appropriately. The final Privacy Policy must identify the responsible operator, an official privacy contact, an effective date, and how requests or complaints can be submitted.',
    'These details have not been provided for the student prototype and must be completed before the service handles real users’ personal information.'
  ] },
]

const privacyVi = [
  { id: 'scope', title: 'Phạm vi áp dụng', paragraphs: [
    'Chính sách này mô tả dữ liệu cá nhân có thể được xử lý khi người dùng tham gia LegacyVault với vai trò Vault Owner, Executor/Trustee, Beneficiary, Legal Verifier hoặc System Administrator.',
    'Website hiện là dự án/bản mẫu phục vụ học tập. Việc xử lý dữ liệu thực tế, nhà cung cấp dịch vụ và thời hạn lưu giữ phải được đơn vị vận hành xác minh trước khi đưa vào sử dụng chính thức.'
  ] },
  { id: 'categories', title: 'Những loại thông tin có thể được xử lý', bullets: [
    'Thông tin tài khoản và liên hệ: họ tên, email, số điện thoại, vai trò người dùng và trạng thái đăng nhập.',
    'Thông tin kho và tài sản: mô tả tài sản, hướng dẫn bàn giao, người được chỉ định và tài liệu đính kèm.',
    'Tài liệu xác minh khi áp dụng: giấy tờ danh tính, giấy chứng tử, di chúc, hồ sơ pháp lý, kết quả OTP/eKYC và thẩm định.',
    'Thông tin sử dụng và bảo mật: nhật ký check-in, địa chỉ IP liên quan, phiên đăng nhập, lần truy cập và nhật ký kiểm toán.',
    'Thông tin trao đổi: yêu cầu hỗ trợ, thông báo và câu hỏi gửi tới AI Chatbot khi sử dụng tính năng này.',
    'Thông tin thanh toán nếu bật tính năng: gói dịch vụ và trạng thái giao dịch; cách xử lý của đối tác thanh toán cần được công bố riêng.'
  ] },
  { id: 'purposes', title: 'Mục đích sử dụng thông tin', paragraphs: [
    'Thông tin có thể được xử lý để tạo tài khoản, xác thực, quản lý kho tài sản, chỉ định người nhận, vận hành check-in, thẩm định hồ sơ bàn giao, cung cấp thông tin đúng quyền, gửi thông báo, ngăn ngừa lạm dụng và thực hiện nghĩa vụ pháp lý.',
    'Dữ liệu không nên được sử dụng cho mục đích không liên quan khi chưa có căn cứ và thông báo phù hợp.'
  ] },
  { id: 'lawful-basis', title: 'Căn cứ xử lý và lựa chọn của bạn', paragraphs: [
    'Căn cứ hợp pháp của từng hoạt động xử lý phải được đánh giá theo pháp luật Việt Nam. Khi cần sự đồng ý, người dùng phải được giải thích rõ và có lựa chọn thực sự trước khi xử lý.',
    'Đồng ý Điều khoản sử dụng không tự động đồng nghĩa với đồng ý mọi hoạt động xử lý dữ liệu. Những trường hợp cần sự đồng ý riêng, rút lại đồng ý hoặc ngoại lệ luật định phải được xử lý rõ ràng.'
  ] },
  { id: 'roles', title: 'Ai được truy cập dữ liệu', paragraphs: [
    'Quyền truy cập phải giới hạn theo vai trò và mục đích công việc. Beneficiary chỉ được xem thông tin đã được phép nhận; Executor và Legal Verifier chỉ được xem hồ sơ cần thiết cho vụ việc liên quan.',
    'System Administrator không mặc nhiên có quyền xem nội dung có thể đọc được của kho riêng tư. Việc phân quyền và bảo vệ phải được kiểm tra ở Backend.'
  ] },
  { id: 'sharing', title: 'Khi nào dữ liệu có thể được chia sẻ', paragraphs: [
    'Tùy tính năng được bật, dữ liệu có thể được cung cấp cho người nhận có quyền, người thẩm định pháp lý, đơn vị lưu trữ, đối tác xác minh danh tính, nhà cung cấp thông báo hoặc bên hỗ trợ dịch vụ khác.',
    'Trước khi ra mắt, hệ thống phải xác định nhà cung cấp thực tế, mục đích, nơi xử lý/chuyển dữ liệu và biện pháp bảo vệ. Bản nháp không khẳng định đã ký hợp đồng với bất kỳ nhà cung cấp cụ thể nào.'
  ] },
  { id: 'ai', title: 'Trợ lý AI và nội dung trò chuyện', paragraphs: [
    'Khi dùng trợ lý AI, câu hỏi hiện tại và một phần lịch sử hội thoại gần đây có thể được gửi đến Backend và nhà cung cấp AI được cấu hình để tạo câu trả lời. Theo thiết kế API hiện tại, Backend ứng dụng không cần lưu lâu dài tin nhắn; chính sách xử lý của nhà cung cấp AI có thể khác.',
    'Trợ lý chỉ hỗ trợ thông tin chung về sản phẩm, không dùng để truy cập kho riêng tư hoặc tư vấn pháp lý. Không nhập mật khẩu, cụm từ khôi phục ví, mã OTP, số giấy tờ tùy thân hoặc thông tin tài sản bí mật.'
  ] },
  { id: 'storage', title: 'Lưu trữ, bảo mật và thời hạn lưu giữ', paragraphs: [
    'Thiết kế hệ thống có xác thực tài khoản, giới hạn quyền truy cập, mã hóa dữ liệu nhạy cảm và nhật ký cho thao tác quan trọng. Việc triển khai và hiệu quả thực tế của các biện pháp này phải được kiểm tra trước khi sử dụng với tài sản thật.',
    'Thời hạn lưu giữ, lịch sao lưu và ngoại lệ xóa dữ liệu chưa được chốt trong bản mẫu. Chính sách chính thức phải nêu thời hạn của từng loại dữ liệu và các trường hợp pháp luật yêu cầu tiếp tục lưu.'
  ] },
  { id: 'browser', title: 'Bộ nhớ trình duyệt và tùy chọn', paragraphs: [
    'Frontend có thể dùng localStorage hoặc sessionStorage để giữ phiên đăng nhập, ngôn ngữ, giao diện sáng/tối và dữ liệu demo. Bộ nhớ trình duyệt không phải kho lưu trữ dài hạn bảo đảm an toàn cho di sản.',
    'Nếu sau này có phân tích truy cập, công cụ quảng cáo hoặc cookie không thiết yếu, các công cụ này phải được công bố và quản lý theo pháp luật. Bản nháp không mặc định chúng đang được sử dụng.'
  ] },
  { id: 'rights', title: 'Quyền của bạn đối với dữ liệu cá nhân', paragraphs: [
    'Tùy pháp luật áp dụng, bạn có thể có quyền biết về hoạt động xử lý, truy cập dữ liệu, yêu cầu sửa hoặc xóa, rút lại đồng ý khi phù hợp, phản đối một số hoạt động xử lý và gửi khiếu nại.',
    'Hệ thống chính thức cần cung cấp kênh yêu cầu có xác minh danh tính, bảo vệ quyền của người khác và giải thích các hạn chế hoặc nghĩa vụ lưu giữ theo luật.'
  ] },
  { id: 'deceased', title: 'Dữ liệu người đã mất và hồ sơ nhạy cảm', paragraphs: [
    'Tài liệu của người đã mất cũng có thể chứa thông tin cá nhân của người thân, người thụ hưởng và người còn sống. Hệ thống phải xử lý cẩn trọng, tôn trọng quy định về thừa kế, đại diện và bảo vệ dữ liệu.',
    'Không phản hồi check-in không xác nhận việc qua đời; việc tải lên một tài liệu cũng không tự động cho phép truy cập dữ liệu của người khác.'
  ] },
  { id: 'incidents', title: 'Sự cố và xử lý dữ liệu xuyên biên giới', paragraphs: [
    'Đơn vị vận hành phải có quy trình đánh giá, xử lý sự cố bảo mật và thực hiện các thông báo bắt buộc theo pháp luật khi phát sinh.',
    'Nếu dữ liệu được xử lý hoặc chuyển ra ngoài Việt Nam, quốc gia, nhà cung cấp, mục đích và các yêu cầu pháp lý liên quan phải được đánh giá và công bố trước khi sử dụng.'
  ] },
  { id: 'contact', title: 'Cập nhật chính sách và liên hệ', paragraphs: [
    'Các thay đổi quan trọng cần được thông báo thích hợp. Chính sách chính thức phải nêu rõ đơn vị chịu trách nhiệm, thông tin liên hệ về quyền riêng tư, ngày hiệu lực và cách gửi yêu cầu hoặc khiếu nại.',
    'Những thông tin này chưa được cung cấp cho bản mẫu dự án sinh viên và cần được hoàn thiện trước khi xử lý dữ liệu cá nhân của người dùng thực tế.'
  ] },
]

export const legalContent = {
  en: {
    terms: {
      eyebrow: 'USER AGREEMENT', title: 'Terms of Service', subtitle: 'Clear expectations for managing your digital legacy with LegacyVault.',
      lead: 'Please read these terms to understand your responsibilities, the review process, and the limits of digital asset handover.',
      highlightTitle: 'Important to understand', highlight: 'Naming a beneficiary or missing a check-in does not establish legal inheritance rights or authorize an automatic asset release.',
      sections: termsEn,
    },
    privacy: {
      eyebrow: 'YOUR DATA MATTERS', title: 'Privacy Policy', subtitle: 'A transparent explanation of the personal information involved in LegacyVault.',
      lead: 'This draft explains what the service may process and why, with special attention to private vaults, identity evidence, and AI-assisted help.',
      highlightTitle: 'Before sharing sensitive details', highlight: 'Do not enter passwords, OTP codes, wallet recovery phrases or private asset secrets into support or AI chat messages.',
      sections: privacyEn,
    },
    ui: {draft: 'Project draft · Not yet effective', version: 'Draft version 0.1', date: 'Prepared November 8, 2026', contents: 'On this page', reading: 'For your understanding', related: 'Related document', otherTerms: 'Read Terms of Service', otherPrivacy: 'Read Privacy Policy', print: 'Print / Save PDF', back: 'Back to homepage', language: 'Document language', contactNote: 'Before live launch, the operator must add its legal name, contact details, effective date, and final processing/retention disclosures.', footer: 'Prepared for the LegacyVault student project. This content is not a substitute for legal advice.' },
  },
  vi: {
    terms: {
      eyebrow: 'THỎA THUẬN NGƯỜI DÙNG', title: 'Điều khoản sử dụng', subtitle: 'Những nguyên tắc rõ ràng khi quản lý di sản số cùng LegacyVault.',
      lead: 'Hãy đọc các điều khoản để hiểu trách nhiệm của bạn, quy trình xác minh và những giới hạn khi bàn giao tài sản số.',
      highlightTitle: 'Điều quan trọng cần biết', highlight: 'Việc chỉ định người thụ hưởng hoặc bỏ lỡ check-in không tự tạo quyền thừa kế hợp pháp và không cho phép tự động bàn giao tài sản.',
      sections: termsVi,
    },
    privacy: {
      eyebrow: 'DỮ LIỆU CỦA BẠN RẤT QUAN TRỌNG', title: 'Chính sách quyền riêng tư', subtitle: 'Giải thích minh bạch về dữ liệu cá nhân liên quan đến LegacyVault.',
      lead: 'Bản nháp trình bày dữ liệu dịch vụ có thể xử lý và mục đích sử dụng, đặc biệt với kho riêng tư, hồ sơ danh tính và trợ lý AI.',
      highlightTitle: 'Trước khi chia sẻ thông tin nhạy cảm', highlight: 'Không nhập mật khẩu, mã OTP, cụm từ khôi phục ví hay bí mật tài sản vào tin nhắn hỗ trợ hoặc AI Chatbot.',
      sections: privacyVi,
    },
    ui: {draft: 'Bản nháp dự án · Chưa có hiệu lực', version: 'Bản nháp 0.1', date: 'Soạn ngày 08/11/2026', contents: 'Mục lục', reading: 'Thông tin cần biết', related: 'Tài liệu liên quan', otherTerms: 'Đọc Điều khoản sử dụng', otherPrivacy: 'Đọc Chính sách quyền riêng tư', print: 'In / Lưu PDF', back: 'Về trang chủ', language: 'Ngôn ngữ tài liệu', contactNote: 'Trước khi ra mắt, cần bổ sung tên pháp lý đơn vị vận hành, thông tin liên hệ, ngày hiệu lực và các quy định xử lý/lưu giữ dữ liệu cụ thể.', footer: 'Nội dung phục vụ đồ án sinh viên LegacyVault, không thay thế tư vấn pháp lý.' },
  },
}
