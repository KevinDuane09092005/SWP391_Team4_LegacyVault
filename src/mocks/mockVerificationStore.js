import { createDemoStorage } from './demoStorage.js'

export const initialCases = [
  {
    case_id: 'c1042-0000-1111-2222-333344445555',
    case_number: 'LV-1042',
    vault_owner_name: 'Thanh Pham',
    executor_name: 'Linh Pham',
    submitted_date: '2026-09-20',
    submitted_date_formatted: 'Sep 20, 2026',
    status: 'UNDER_REVIEW',
    status_label: 'Under Review',
    documents_count: 1,
    vault_owner: { name: 'Thanh Pham', email: 'thanh.pham@vault-owner.com' },
    executor: { name: 'Linh Pham', email: 'linh.pham@beneficiary.com' },
    documents: [
      {
        document_id: 'd1-0000-1111-2222-333344445555',
        document_type: 'DEATH_CERTIFICATE',
        file_name: 'Death_Certificate_ThanhPham.pdf',
        file_size_formatted: '2.1 MB',
        uploaded_by: 'Executor',
        file_url: null,
      },
    ],
    review_guideline:
      "Confirm the document is authentic and matches the vault owner's legal record before approving this case.",
  },
  {
    case_id: 'c1038-0000-1111-2222-333344445555',
    case_number: 'LV-1038',
    vault_owner_name: 'Maya Chen',
    executor_name: 'Daniel Chen',
    submitted_date: '2026-09-16',
    submitted_date_formatted: 'Sep 16, 2026',
    status: 'APPROVED',
    status_label: 'Approved',
    documents_count: 1,
    vault_owner: { name: 'Maya Chen', email: 'maya.chen@example.test' },
    executor: { name: 'Daniel Chen', email: 'daniel.chen@example.test' },
    documents: [
      {
        document_id: 'd2-0000-1111-2222-333344445555',
        document_type: 'DEATH_CERTIFICATE',
        file_name: 'Death_Certificate_MayaChen.pdf',
        file_size_formatted: '1.8 MB',
        uploaded_by: 'Executor',
        file_url: null,
      },
    ],
    approved_title: 'Case approved',
    approved_message:
      'Document verified successfully. Case #LV-1038 was approved and vault unlock has been authorized.',
    vault_unlock_authorized: true,
    review_guideline:
      "Confirm the document is authentic and matches the vault owner's legal record before approving this case.",
  },
  {
    case_id: 'c1043-0000-1111-2222-333344445555',
    case_number: 'LV-1043',
    vault_owner_name: 'Demo Vault Owner',
    executor_name: 'Demo Executor',
    submitted_date: '2026-10-18',
    submitted_date_formatted: 'Oct 18, 2026',
    status: 'SUBMITTED',
    status_label: 'Submitted',
    documents_count: 1,
    vault_owner: { name: 'Demo Vault Owner', email: 'owner@legacyvault.demo' },
    executor: { name: 'Demo Executor', email: 'executor@legacyvault.demo' },
    documents: [
      {
        document_id: 'd3-0000-1111-2222-333344445555',
        document_type: 'DEATH_CERTIFICATE',
        file_name: 'Death_Certificate_DemoOwner.pdf',
        file_size_formatted: '1.5 MB',
        uploaded_by: 'Executor',
        file_url: null,
      },
    ],
    review_guideline:
      "Confirm the document is authentic and matches the vault owner's legal record before approving this case.",
  },
]

const STORAGE_KEY = 'legacyvault-flow5-demo-v1'
const storage = createDemoStorage(STORAGE_KEY)

const clone = (value) => JSON.parse(JSON.stringify(value))

export function loadMockCases() {
  const stored = storage.get()
  if (Array.isArray(stored)) return stored
  // Also check direct localStorage for backwards-compatibility with existing tests
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed
      }
    }
  } catch {
    // ignore
  }
  return clone(initialCases)
}

export function saveMockCases(cases) {
  storage.set(cases)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
    }
  } catch {
    // ignore
  }
}

export function clearMockCases() {
  storage.clear()
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}
