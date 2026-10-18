// All text on the Vault Owner screens (Flow 2), one block per language.
// Keys under `assetTypes`, `fields` and `options` match src/vault/assetTypes.js.

const en = {
  nav: {
    label: 'Vault owner',
    overview: 'Overview',
    vaults: 'My assets',
    assets: 'My assets',
    contacts: 'Contacts',
    assignments: 'Assignments',
    dms: "Dead Man's Switch",
  },
  breadcrumbsLabel: 'Breadcrumb',

  demoNotice:
    'Demo data: vaults and assets are kept only in this browser tab’s memory. Nothing is sent to a server, and everything you add is reset when the page reloads.',
  loading: 'Loading…',
  retry: 'Try again',
  cancel: 'Cancel',
  createdOn: (date) => `Created ${date}`,
  assetCount: (count) => `${count} ${count === 1 ? 'asset' : 'assets'}`,
  documentCount: (count) => `${count} ${count === 1 ? 'document' : 'documents'}`,
  optional: 'Optional',
  empty: '—',

  errors: {
    VAULT_NOT_FOUND: 'This vault does not exist, or you do not have access to it.',
    ASSET_NOT_FOUND: 'This asset does not exist in this vault.',
    VAULT_NAME_TAKEN: 'You already have a vault with this name. Choose another name.',
    INVALID_ASSET: 'Some required asset information is missing.',
    SAVE_FAILED: 'Saving failed (simulated demo error). Your information is still here, so you can try again.',
    generic: 'Something went wrong. Please try again.',
  },

  dashboard: {
    welcome: (name) => `Welcome back, ${name}`,
    subtitle: 'Here is everything you have prepared for the people who may need it later.',
    stats: { vaults: 'Vaults', assets: 'Digital assets', documents: 'Attached documents' },
    vaultsTitle: 'Your vaults',
    viewAll: 'View all vaults',
    createVault: 'Create vault',
  },

  vaultCard: { viewAssets: 'View assets', addAsset: 'Add asset' },

  emptyVaults: {
    title: 'You have no vaults yet',
    text: 'A vault groups related digital assets, such as bank accounts, wallets, online accounts and important documents.',
    cta: 'Create your first vault',
  },

  myVaults: {
    title: 'My vaults',
    subtitle: 'Open a vault to see its assets or add new ones.',
    createVault: 'Create vault',
  },

  createVault: {
    title: 'Create a vault',
    subtitle: 'Give the vault a clear name, for example “Family essentials” or “Online life”.',
    nameLabel: 'Vault name',
    namePlaceholder: 'e.g. Family essentials',
    descriptionLabel: 'Description',
    descriptionPlaceholder: 'What will this vault hold, and who is it for?',
    submit: 'Create vault',
    submitting: 'Creating vault…',
  },

  vaultDetails: {
    created: 'Vault created. Next, add the first digital asset.',
    addAsset: 'Add digital asset',
    assetsTitle: 'Digital assets',
    columns: { name: 'Asset', type: 'Type', documents: 'Documents', created: 'Added' },
    emptyTitle: 'No assets in this vault yet',
    emptyText: 'Add a bank account, crypto wallet, social media account, important document or any other digital asset.',
    emptyCta: 'Add your first asset',
  },

  addAsset: {
    title: 'Add digital asset',
    toVault: (name) => `Vault: ${name}`,
    stepsLabel: 'Progress',
    steps: ['Asset information', 'Related documents', 'Encrypt sensitive data', 'Save asset'],
    stepOf: (current, total) => `Step ${current} of ${total}`,
    safety:
      'Never enter passwords, PINs, full account numbers, private keys or recovery phrases. LegacyVault only needs enough information to identify the asset.',
    back: 'Back',
    next: 'Continue',
    save: 'Save asset',
    saving: 'Saving…',
    progress: {
      validate: 'Checking the asset information',
      documents: 'Attaching documents (demo: not uploaded)',
      encryption: 'Encryption step (demo: not encrypted)',
      saving: 'Saving to the demo store',
    },
  },

  documents: {
    title: 'Related documents',
    text: 'Optional. Attach files that help identify this asset, such as a statement or a scanned certificate.',
    choose: 'Choose files',
    rules: (size, count) => `PDF, JPG, PNG, DOCX or TXT · up to ${size} each · up to ${count} files`,
    demoNote:
      'Demo mode: files are only listed in your browser. They are not uploaded to any server, and their contents are not read or stored. Only the name and size are kept.',
    none: 'No documents selected.',
    remove: 'Remove',
    removeLabel: (name) => `Remove ${name}`,
    ready: 'Ready · not uploaded',
    rejectedTitle: 'These files were not added:',
    reasons: {
      type: 'file type not allowed',
      size: (max) => `larger than ${max}`,
      empty: 'the file is empty',
      duplicate: 'already in the list',
      count: (max) => `only ${max} files are allowed`,
    },
  },

  encryption: {
    title: 'Encrypt sensitive data',
    notBuilt:
      'Not encrypted in this demo. Encryption has not been built yet, so the fields below are kept as plain text in this browser tab’s memory. In the real system they must be encrypted before storage, using a design agreed with the backend team.',
    fieldsTitle: 'Fields that would be encrypted',
    noneFilled: 'None of the sensitive fields are filled in for this asset.',
    summaryTitle: 'What will be saved',
    documentsLine: (count) => `${count} related ${count === 1 ? 'document' : 'documents'} (name and size only)`,
  },

  assetDetails: {
    saved: 'Asset saved to the demo store.',
    backToVault: 'Back to vault',
    addAnother: 'Add another asset',
    information: 'Asset information',
    type: 'Type',
    vault: 'Vault',
    created: 'Added',
    description: 'Description',
    handoverNotes: 'Handover instructions',
    documents: 'Related documents',
    noDocuments: 'No documents attached.',
    notUploaded: 'Not uploaded (demo: name and size only)',
    security: 'Security status',
    notEncrypted: 'Not encrypted (demo). Encryption is not built yet.',
    sensitiveFields: 'Fields marked as sensitive',
  },

  assetTypes: {
    BANK_ACCOUNT: 'Bank account',
    CRYPTO_WALLET: 'Crypto wallet',
    SOCIAL_MEDIA: 'Social media account',
    IMPORTANT_DOCUMENT: 'Important document',
    OTHER: 'Other digital asset',
  },

  fields: {
    type: { label: 'Asset type', empty: 'Choose a type' },
    name: { label: 'Asset name', placeholder: 'e.g. Main savings account' },
    description: { label: 'Description', placeholder: 'Anything that helps your family understand this asset' },
    handoverNotes: {
      label: 'Handover instructions',
      placeholder: 'What should your executor do with this asset?',
      hint: 'Do not include passwords or codes.',
    },
    bankName: { label: 'Bank name', placeholder: 'e.g. Demo Bank' },
    accountHolder: { label: 'Account holder', placeholder: 'Name on the account' },
    accountLast4: {
      label: 'Last 4 digits of the account number',
      placeholder: '1234',
      hint: 'Only the last 4 digits, never the full number.',
    },
    walletName: { label: 'Wallet name', placeholder: 'e.g. Hardware wallet' },
    network: { label: 'Blockchain / network', empty: 'Choose a network' },
    publicAddress: {
      label: 'Public wallet address',
      placeholder: 'Public address only',
      hint: 'Never enter a private key or recovery (seed) phrase.',
    },
    platform: { label: 'Platform', empty: 'Choose a platform' },
    username: { label: 'Account name or username', placeholder: 'e.g. @your.name' },
    documentTitle: { label: 'Document title', placeholder: 'e.g. Last will and testament' },
    documentType: { label: 'Document type', empty: 'Choose a document type' },
    category: { label: 'Asset category', placeholder: 'e.g. Domain name, cloud storage' },
  },

  options: {
    network: {
      BITCOIN: 'Bitcoin',
      ETHEREUM: 'Ethereum',
      BNB_CHAIN: 'BNB Chain',
      SOLANA: 'Solana',
      TRON: 'Tron',
      OTHER: 'Other',
    },
    platform: {
      FACEBOOK: 'Facebook',
      INSTAGRAM: 'Instagram',
      X: 'X (Twitter)',
      LINKEDIN: 'LinkedIn',
      TIKTOK: 'TikTok',
      YOUTUBE: 'YouTube',
      ZALO: 'Zalo',
      OTHER: 'Other',
    },
    documentType: {
      WILL: 'Will',
      INSURANCE: 'Insurance policy',
      PROPERTY: 'Property deed',
      IDENTITY: 'ID card / passport',
      MEDICAL: 'Medical record',
      OTHER: 'Other',
    },
  },

  validation: {
    required: 'This field is required.',
    vaultNameRequired: 'Please enter a vault name.',
    tooShort: (min) => `Use at least ${min} characters.`,
    tooLong: (max) => `Use at most ${max} characters.`,
    typeRequired: 'Choose an asset type.',
    otherDescription: 'Describe this asset so your family knows what it is.',
    last4: 'Enter exactly 4 digits.',
    publicAddress: 'A public address has 20–120 letters or numbers and no spaces.',
    secret:
      'This looks like a password, private key or recovery phrase. Do not enter secrets in LegacyVault.',
  },
}

const vi = {
  nav: {
    label: 'Chủ sở hữu',
    overview: 'Tổng quan',
    vaults: 'Tài sản của tôi',
    assets: 'Tài sản của tôi',
    contacts: 'Danh bạ',
    assignments: 'Phân công thừa kế',
    dms: "Dead Man's Switch",
  },
  breadcrumbsLabel: 'Đường dẫn',

  demoNotice:
    'Dữ liệu demo: kho và tài sản chỉ được giữ trong bộ nhớ của tab trình duyệt này. Không có gì được gửi lên máy chủ, và mọi thứ bạn thêm sẽ mất khi tải lại trang.',
  loading: 'Đang tải…',
  retry: 'Thử lại',
  cancel: 'Hủy',
  createdOn: (date) => `Tạo ngày ${date}`,
  assetCount: (count) => `${count} tài sản`,
  documentCount: (count) => `${count} tài liệu`,
  optional: 'Không bắt buộc',
  empty: '—',

  errors: {
    VAULT_NOT_FOUND: 'Kho này không tồn tại hoặc bạn không có quyền truy cập.',
    ASSET_NOT_FOUND: 'Tài sản này không có trong kho.',
    VAULT_NAME_TAKEN: 'Bạn đã có một kho trùng tên. Hãy chọn tên khác.',
    INVALID_ASSET: 'Còn thiếu thông tin bắt buộc của tài sản.',
    SAVE_FAILED: 'Lưu thất bại (lỗi demo mô phỏng). Thông tin của bạn vẫn còn nên bạn có thể thử lại.',
    generic: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
  },

  dashboard: {
    welcome: (name) => `Chào mừng trở lại, ${name}`,
    subtitle: 'Đây là mọi thứ bạn đã chuẩn bị cho những người có thể cần đến sau này.',
    stats: { vaults: 'Kho', assets: 'Tài sản số', documents: 'Tài liệu đính kèm' },
    vaultsTitle: 'Kho của bạn',
    viewAll: 'Xem tất cả kho',
    createVault: 'Tạo kho',
  },

  vaultCard: { viewAssets: 'Xem tài sản', addAsset: 'Thêm tài sản' },

  emptyVaults: {
    title: 'Bạn chưa có kho nào',
    text: 'Một kho gom các tài sản số liên quan, như tài khoản ngân hàng, ví tiền mã hóa, tài khoản mạng xã hội và giấy tờ quan trọng.',
    cta: 'Tạo kho đầu tiên',
  },

  myVaults: {
    title: 'Kho của tôi',
    subtitle: 'Mở một kho để xem tài sản hoặc thêm tài sản mới.',
    createVault: 'Tạo kho',
  },

  createVault: {
    title: 'Tạo kho',
    subtitle: 'Đặt tên kho thật rõ ràng, ví dụ “Giấy tờ gia đình” hoặc “Tài khoản trực tuyến”.',
    nameLabel: 'Tên kho',
    namePlaceholder: 'VD: Giấy tờ gia đình',
    descriptionLabel: 'Mô tả',
    descriptionPlaceholder: 'Kho này sẽ chứa gì, và dành cho ai?',
    submit: 'Tạo kho',
    submitting: 'Đang tạo kho…',
  },

  vaultDetails: {
    created: 'Đã tạo kho. Tiếp theo, hãy thêm tài sản số đầu tiên.',
    addAsset: 'Thêm tài sản số',
    assetsTitle: 'Tài sản số',
    columns: { name: 'Tài sản', type: 'Loại', documents: 'Tài liệu', created: 'Ngày thêm' },
    emptyTitle: 'Kho này chưa có tài sản',
    emptyText: 'Thêm tài khoản ngân hàng, ví tiền mã hóa, tài khoản mạng xã hội, giấy tờ quan trọng hoặc tài sản số khác.',
    emptyCta: 'Thêm tài sản đầu tiên',
  },

  addAsset: {
    title: 'Thêm tài sản số',
    toVault: (name) => `Kho: ${name}`,
    stepsLabel: 'Tiến trình',
    steps: ['Thông tin tài sản', 'Tài liệu liên quan', 'Mã hóa dữ liệu nhạy cảm', 'Lưu tài sản'],
    stepOf: (current, total) => `Bước ${current}/${total}`,
    safety:
      'Không bao giờ nhập mật khẩu, mã PIN, số tài khoản đầy đủ, private key hay cụm từ khôi phục. LegacyVault chỉ cần đủ thông tin để nhận ra tài sản.',
    back: 'Quay lại',
    next: 'Tiếp tục',
    save: 'Lưu tài sản',
    saving: 'Đang lưu…',
    progress: {
      validate: 'Kiểm tra thông tin tài sản',
      documents: 'Đính kèm tài liệu (demo: không upload)',
      encryption: 'Bước mã hóa (demo: không mã hóa)',
      saving: 'Lưu vào kho dữ liệu demo',
    },
  },

  documents: {
    title: 'Tài liệu liên quan',
    text: 'Không bắt buộc. Đính kèm tệp giúp nhận ra tài sản này, ví dụ sao kê hoặc bản scan giấy chứng nhận.',
    choose: 'Chọn tệp',
    rules: (size, count) => `PDF, JPG, PNG, DOCX hoặc TXT · tối đa ${size} mỗi tệp · tối đa ${count} tệp`,
    demoNote:
      'Chế độ demo: tệp chỉ được liệt kê trong trình duyệt của bạn. Tệp không được upload lên máy chủ nào, nội dung không được đọc hay lưu. Chỉ giữ lại tên và dung lượng.',
    none: 'Chưa chọn tài liệu nào.',
    remove: 'Xóa',
    removeLabel: (name) => `Xóa ${name}`,
    ready: 'Sẵn sàng · chưa upload',
    rejectedTitle: 'Các tệp sau không được thêm:',
    reasons: {
      type: 'loại tệp không được phép',
      size: (max) => `lớn hơn ${max}`,
      empty: 'tệp rỗng',
      duplicate: 'đã có trong danh sách',
      count: (max) => `chỉ được tối đa ${max} tệp`,
    },
  },

  encryption: {
    title: 'Mã hóa dữ liệu nhạy cảm',
    notBuilt:
      'Chưa mã hóa trong bản demo. Chức năng mã hóa chưa được xây dựng, nên các trường bên dưới được giữ dạng văn bản thường trong bộ nhớ của tab trình duyệt này. Trong hệ thống thật, chúng phải được mã hóa trước khi lưu, theo thiết kế thống nhất với nhóm backend.',
    fieldsTitle: 'Các trường sẽ được mã hóa',
    noneFilled: 'Tài sản này chưa điền trường nhạy cảm nào.',
    summaryTitle: 'Những gì sẽ được lưu',
    documentsLine: (count) => `${count} tài liệu liên quan (chỉ tên và dung lượng)`,
  },

  assetDetails: {
    saved: 'Đã lưu tài sản vào kho dữ liệu demo.',
    backToVault: 'Quay lại kho',
    addAnother: 'Thêm tài sản khác',
    information: 'Thông tin tài sản',
    type: 'Loại',
    vault: 'Kho',
    created: 'Ngày thêm',
    description: 'Mô tả',
    handoverNotes: 'Hướng dẫn bàn giao',
    documents: 'Tài liệu liên quan',
    noDocuments: 'Không có tài liệu đính kèm.',
    notUploaded: 'Chưa upload (demo: chỉ tên và dung lượng)',
    security: 'Trạng thái bảo mật',
    notEncrypted: 'Chưa mã hóa (demo). Chức năng mã hóa chưa được xây dựng.',
    sensitiveFields: 'Các trường được đánh dấu nhạy cảm',
  },

  assetTypes: {
    BANK_ACCOUNT: 'Tài khoản ngân hàng',
    CRYPTO_WALLET: 'Ví tiền mã hóa',
    SOCIAL_MEDIA: 'Tài khoản mạng xã hội',
    IMPORTANT_DOCUMENT: 'Giấy tờ quan trọng',
    OTHER: 'Tài sản số khác',
  },

  fields: {
    type: { label: 'Loại tài sản', empty: 'Chọn loại' },
    name: { label: 'Tên tài sản', placeholder: 'VD: Tài khoản tiết kiệm chính' },
    description: { label: 'Mô tả', placeholder: 'Bất cứ điều gì giúp gia đình hiểu về tài sản này' },
    handoverNotes: {
      label: 'Hướng dẫn bàn giao',
      placeholder: 'Người thực thi nên làm gì với tài sản này?',
      hint: 'Không ghi mật khẩu hay mã bảo mật.',
    },
    bankName: { label: 'Tên ngân hàng', placeholder: 'VD: Demo Bank' },
    accountHolder: { label: 'Chủ tài khoản', placeholder: 'Tên in trên tài khoản' },
    accountLast4: {
      label: '4 số cuối của số tài khoản',
      placeholder: '1234',
      hint: 'Chỉ 4 số cuối, không bao giờ nhập số đầy đủ.',
    },
    walletName: { label: 'Tên ví', placeholder: 'VD: Ví lạnh' },
    network: { label: 'Blockchain / mạng', empty: 'Chọn mạng' },
    publicAddress: {
      label: 'Địa chỉ ví công khai',
      placeholder: 'Chỉ địa chỉ công khai',
      hint: 'Không bao giờ nhập private key hay cụm từ khôi phục (seed phrase).',
    },
    platform: { label: 'Nền tảng', empty: 'Chọn nền tảng' },
    username: { label: 'Tên tài khoản hoặc username', placeholder: 'VD: @ten.cua.ban' },
    documentTitle: { label: 'Tên giấy tờ', placeholder: 'VD: Di chúc' },
    documentType: { label: 'Loại giấy tờ', empty: 'Chọn loại giấy tờ' },
    category: { label: 'Nhóm tài sản', placeholder: 'VD: Tên miền, lưu trữ đám mây' },
  },

  options: {
    network: {
      BITCOIN: 'Bitcoin',
      ETHEREUM: 'Ethereum',
      BNB_CHAIN: 'BNB Chain',
      SOLANA: 'Solana',
      TRON: 'Tron',
      OTHER: 'Khác',
    },
    platform: {
      FACEBOOK: 'Facebook',
      INSTAGRAM: 'Instagram',
      X: 'X (Twitter)',
      LINKEDIN: 'LinkedIn',
      TIKTOK: 'TikTok',
      YOUTUBE: 'YouTube',
      ZALO: 'Zalo',
      OTHER: 'Khác',
    },
    documentType: {
      WILL: 'Di chúc',
      INSURANCE: 'Hợp đồng bảo hiểm',
      PROPERTY: 'Giấy tờ nhà đất',
      IDENTITY: 'CCCD / hộ chiếu',
      MEDICAL: 'Hồ sơ y tế',
      OTHER: 'Khác',
    },
  },

  validation: {
    required: 'Trường này là bắt buộc.',
    vaultNameRequired: 'Vui lòng nhập tên kho.',
    tooShort: (min) => `Cần ít nhất ${min} ký tự.`,
    tooLong: (max) => `Tối đa ${max} ký tự.`,
    typeRequired: 'Hãy chọn loại tài sản.',
    otherDescription: 'Hãy mô tả tài sản này để gia đình biết đó là gì.',
    last4: 'Nhập đúng 4 chữ số.',
    publicAddress: 'Địa chỉ công khai gồm 20–120 chữ cái hoặc chữ số, không có dấu cách.',
    secret:
      'Nội dung này trông giống mật khẩu, private key hoặc cụm từ khôi phục. Đừng nhập thông tin bí mật vào LegacyVault.',
  },
}

export const vaultContent = { en, vi }
