import { getTypeFields } from './assetTypes.js'

// Empty Add Asset form. All type-specific fields live here too, so switching the
// asset type back and forth keeps what was typed (only the chosen type's fields are saved).
export const EMPTY_ASSET_FORM = {
  type: '',
  name: '',
  description: '',
  handoverNotes: '',
  bankName: '',
  accountHolder: '',
  accountLast4: '',
  walletName: '',
  network: '',
  publicAddress: '',
  platform: '',
  username: '',
  documentTitle: '',
  documentType: '',
  category: '',
  assetType: '',
  assetName: '',
  credentials: '',
  attachmentUrl: '',
}

// Turns form values into an asset: trimmed text, and `details` holds only the
// fields that belong to the chosen asset type.
export function buildAssetFromForm(values) {
  const details = {}
  for (const field of getTypeFields(values.type)) {
    details[field.name] = (values[field.name] ?? '').trim()
  }
  return {
    name: values.name.trim(),
    type: values.type,
    description: values.description.trim(),
    handoverNotes: values.handoverNotes.trim(),
    details,
  }
}
