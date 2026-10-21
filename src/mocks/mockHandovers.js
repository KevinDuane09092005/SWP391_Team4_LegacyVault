import { HANDOVER_STATUS, LEGAL_STATUS } from '../handover/handoverStatus.js'

// DEMO ONLY — starting data for Flow 6 (Asset Handover).
// Every case belongs to the demo executor (executor@legacyvault.demo). Beneficiaries are
// found by e-mail when the handover starts (see mockHandoverStore.js → startHandover).
// `protectedContent` stands in for encrypted vault data: it is harmless sample text,
// never a real password, key, seed phrase or bank credential.

const EXECUTOR_ID = 'demo-executor'

const owner = { name: 'Demo Vault Owner', email: 'owner@legacyvault.demo' }

// Fixed sample dates, so seeded mid-flow cases have a believable history.
const at = (day, time) => `2026-10-${day}T${time}:00.000Z`

export const seedHandovers = [
  {
    id: 'HO-2041',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-family', name: 'Family essentials', owner },
    legalCaseId: 'LV-1038',
    legalStatus: LEGAL_STATUS.APPROVED,
    status: HANDOVER_STATUS.APPROVED,
    beneficiary: { name: 'Demo Beneficiary', email: 'beneficiary@legacyvault.demo', userId: null },
    assets: [
      {
        id: 'ho-asset-will',
        name: 'Signed will',
        category: 'IMPORTANT_DOCUMENT',
        description: 'Original is kept at the family lawyer’s office.',
        documents: [{ id: 'ho-doc-will', name: 'will-signed-2025.pdf', size: 482304 }],
        authorizedBeneficiaryIds: ['demo-beneficiary'],
        protectedContent:
          'DEMO: The original will is held by the family lawyer (sample office, Room 12). ' +
          'Bring your ID and the case number HO-2041 to collect a certified copy.',
      },
      {
        id: 'ho-asset-facebook',
        name: 'Personal Facebook',
        category: 'SOCIAL_MEDIA',
        description: 'Wishes for the social media profile.',
        documents: [],
        authorizedBeneficiaryIds: ['demo-beneficiary'],
        protectedContent:
          'DEMO: Please request a memorial page through the platform’s legacy contact form. ' +
          'Do not delete photos; download an archive first.',
      },
      {
        // Belongs to another beneficiary: must never be shown to demo-beneficiary.
        id: 'ho-asset-bank',
        name: 'Main savings account',
        category: 'BANK_ACCOUNT',
        description: 'Household savings.',
        documents: [],
        authorizedBeneficiaryIds: ['demo-beneficiary-2'],
        protectedContent: 'DEMO: Contact the Demo Bank branch with the death certificate.',
      },
    ],
  },
  {
    id: 'HO-2044',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-family', name: 'Family essentials', owner },
    legalCaseId: 'LV-1038',
    legalStatus: LEGAL_STATUS.APPROVED,
    status: HANDOVER_STATUS.APPROVED,
    beneficiary: { name: 'Second Beneficiary', email: 'beneficiary2@legacyvault.demo', userId: null },
    assets: [
      {
        id: 'ho-asset-bank-2',
        name: 'Main savings account',
        category: 'BANK_ACCOUNT',
        description: 'Household savings.',
        documents: [],
        authorizedBeneficiaryIds: ['demo-beneficiary-2'],
        protectedContent:
          'DEMO: Visit any Demo Bank branch with the death certificate and case number HO-2044. ' +
          'The bank will explain how the account is closed.',
      },
    ],
  },
  {
    id: 'HO-2042',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-online', name: 'Online life', owner },
    legalCaseId: 'LV-1042',
    legalStatus: LEGAL_STATUS.UNDER_REVIEW,
    status: HANDOVER_STATUS.PENDING_LEGAL_APPROVAL,
    beneficiary: { name: 'Demo Beneficiary', email: 'beneficiary@legacyvault.demo', userId: null },
    assets: [
      {
        id: 'ho-asset-email',
        name: 'Personal e-mail',
        category: 'SOCIAL_MEDIA',
        description: 'Main e-mail inbox.',
        documents: [],
        authorizedBeneficiaryIds: ['demo-beneficiary'],
        protectedContent: 'DEMO: Ask the e-mail provider for an inactive account request.',
      },
    ],
  },
  {
    id: 'HO-2039',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-online', name: 'Online life', owner },
    legalCaseId: 'LV-1035',
    legalStatus: LEGAL_STATUS.REJECTED,
    status: HANDOVER_STATUS.REJECTED,
    rejectionReason: 'The death certificate could not be matched to the vault owner.',
    beneficiary: { name: 'Demo Beneficiary', email: 'beneficiary@legacyvault.demo', userId: null },
    assets: [],
  },
  {
    // Demo of "no matching beneficiary": nobody has signed up with this e-mail.
    id: 'HO-2045',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-family', name: 'Family essentials', owner },
    legalCaseId: 'LV-1040',
    legalStatus: LEGAL_STATUS.APPROVED,
    status: HANDOVER_STATUS.APPROVED,
    beneficiary: { name: 'Unregistered Cousin', email: 'cousin@example.test', userId: null },
    assets: [
      {
        id: 'ho-asset-photos',
        name: 'Family photo archive',
        category: 'IMPORTANT_DOCUMENT',
        description: 'Cloud photo album.',
        documents: [],
        authorizedBeneficiaryIds: [],
        protectedContent: 'DEMO: Shared album link to be issued by the executor.',
      },
    ],
  },
  {
    // Demo of "no authorized asset": the beneficiary exists but nothing is granted to them.
    id: 'HO-2046',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-online', name: 'Online life', owner },
    legalCaseId: 'LV-1041',
    legalStatus: LEGAL_STATUS.APPROVED,
    status: HANDOVER_STATUS.APPROVED,
    beneficiary: { name: 'Demo Beneficiary', email: 'beneficiary@legacyvault.demo', userId: null },
    assets: [
      {
        id: 'ho-asset-blog',
        name: 'Personal blog',
        category: 'SOCIAL_MEDIA',
        description: 'Hosted blog.',
        documents: [],
        authorizedBeneficiaryIds: ['demo-beneficiary-2'],
        protectedContent: 'DEMO: Keep the blog online for one year.',
      },
    ],
  },
  {
    // Legal Verification still PENDING (not yet picked up by a verifier).
    id: 'HO-2043',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-family', name: 'Family essentials', owner },
    legalCaseId: 'LV-1043',
    legalStatus: LEGAL_STATUS.PENDING,
    status: HANDOVER_STATUS.PENDING_LEGAL_APPROVAL,
    beneficiary: { name: 'Demo Beneficiary', email: 'beneficiary@legacyvault.demo', userId: null },
    assets: [
      {
        id: 'ho-asset-recipes',
        name: 'Family recipe notes',
        category: 'IMPORTANT_DOCUMENT',
        description: 'Scanned recipe book.',
        documents: [],
        authorizedBeneficiaryIds: ['demo-beneficiary'],
        protectedContent: 'DEMO: The recipe scans are in the shared family folder.',
      },
    ],
  },
  {
    // Already started by the executor: the beneficiary can test OTP / KYC right away.
    // Also holds an asset for another beneficiary, which must stay hidden from demo-beneficiary.
    id: 'HO-2047',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-online', name: 'Online life', owner },
    legalCaseId: 'LV-1044',
    legalStatus: LEGAL_STATUS.APPROVED,
    status: HANDOVER_STATUS.BENEFICIARY_VERIFICATION_PENDING,
    seedProgress: {
      beneficiaryUserId: 'demo-beneficiary',
      timeline: [
        { type: 'HANDOVER_INITIATED', at: at('18', '09:00') },
        { type: 'BENEFICIARY_IDENTIFIED', at: at('18', '09:00') },
        { type: 'BENEFICIARY_NOTIFIED', at: at('18', '09:01') },
      ],
    },
    beneficiary: { name: 'Demo Beneficiary', email: 'beneficiary@legacyvault.demo', userId: null },
    assets: [
      {
        id: 'ho-asset-cloud',
        name: 'Cloud photo storage',
        category: 'SOCIAL_MEDIA',
        description: 'Personal photo backup.',
        documents: [{ id: 'ho-doc-cloud', name: 'cloud-storage-instructions.pdf', size: 128000 }],
        authorizedBeneficiaryIds: ['demo-beneficiary'],
        protectedContent:
          'DEMO: Request the photo archive from the provider using its deceased-user process. ' +
          'Case number HO-2047.',
      },
      {
        id: 'ho-asset-game',
        name: 'Gaming account',
        category: 'SOCIAL_MEDIA',
        description: 'Online game account.',
        documents: [],
        authorizedBeneficiaryIds: ['demo-beneficiary-2'],
        protectedContent: 'DEMO: Close the gaming account.',
      },
    ],
  },
  {
    // Finished handover: receipt confirmed, access is closed.
    id: 'HO-2048',
    executorId: EXECUTOR_ID,
    vault: { id: 'vault-demo-family', name: 'Family essentials', owner },
    legalCaseId: 'LV-1036',
    legalStatus: LEGAL_STATUS.APPROVED,
    status: HANDOVER_STATUS.COMPLETED,
    seedProgress: {
      beneficiaryUserId: 'demo-beneficiary',
      verification: { failedAttempts: 1, verifiedAt: at('10', '10:05') },
      authorizationCheckedAt: at('10', '10:06'),
      accessedAssetIds: ['ho-asset-letter'],
      completedAt: at('10', '10:20'),
      timeline: [
        { type: 'HANDOVER_INITIATED', at: at('09', '15:00') },
        { type: 'BENEFICIARY_IDENTIFIED', at: at('09', '15:00') },
        { type: 'BENEFICIARY_NOTIFIED', at: at('09', '15:01') },
        { type: 'VERIFICATION_FAILED', at: at('10', '10:02') },
        { type: 'IDENTITY_VERIFIED', at: at('10', '10:05') },
        { type: 'AUTHORIZATION_CHECKED', at: at('10', '10:06') },
        { type: 'READY_FOR_ACCESS', at: at('10', '10:06') },
        { type: 'ASSET_ACCESSED', at: at('10', '10:10') },
        { type: 'RECEIPT_PENDING', at: at('10', '10:10') },
        { type: 'COMPLETED', at: at('10', '10:20') },
      ],
    },
    beneficiary: { name: 'Demo Beneficiary', email: 'beneficiary@legacyvault.demo', userId: null },
    assets: [
      {
        id: 'ho-asset-letter',
        name: 'Personal letter',
        category: 'IMPORTANT_DOCUMENT',
        description: 'A letter to the family.',
        documents: [],
        authorizedBeneficiaryIds: ['demo-beneficiary'],
        protectedContent: 'DEMO: The letter was handed over on 10 Oct 2026.',
      },
    ],
  },
]
