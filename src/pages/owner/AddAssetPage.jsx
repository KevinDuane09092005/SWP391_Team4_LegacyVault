import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import AssetInfoStep from '../../components/vault/AssetInfoStep.jsx'
import DocumentsStep from '../../components/vault/DocumentsStep.jsx'
import EncryptionStep from '../../components/vault/EncryptionStep.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { Breadcrumbs, ErrorState, LoadingState } from '../../components/vault/PageStates.jsx'
import SaveStep from '../../components/vault/SaveStep.jsx'
import Stepper from '../../components/vault/Stepper.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import useAsync from '../../hooks/useAsync.js'
import useForm from '../../hooks/useForm.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getVault, saveAsset } from '../../services/vaultService.js'
import { buildAssetFromForm, EMPTY_ASSET_FORM } from '../../vault/assetDraft.js'
import { checkNewFiles } from '../../vault/documentRules.js'
import { ownerPaths } from '../../vault/paths.js'
import { getAssetFieldOrder, validateAssetInfo } from '../../vault/vaultValidation.js'

// The four steps, in the business order required by Flow 2.
const STEP = { INFO: 0, DOCUMENTS: 1, ENCRYPTION: 2, SAVE: 3 }

// Flow 2 — Add Digital Asset:
//   1. enter asset information  → 2. pick related documents
//   → 3. encrypt sensitive data (AES-256 via Backend) → 4. save asset → open the saved asset.
// Everything typed stays in this page's state, so Back never loses data.
export default function AddAssetPage() {
  const params = useParams()
  const vaultId = params.vaultId || 'vault-demo-family'
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = vaultContent[language]
  const copy = t.addAsset
  const navigate = useNavigate()
  const location = useLocation()

  // Kiểm tra xác thực Token khi truy cập trang
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
    }
  }, [navigate, location.pathname])

  // The asset is always added to the vault in the address, so load it first.
  const vaultQuery = useAsync(async () => {
    try {
      return await getVault(user?.id, vaultId)
    } catch {
      return { id: vaultId, name: language === 'vi' ? 'Két di sản' : 'Vault', assets: [] }
    }
  }, `${user?.id}-${vaultId}`)

  const form = useForm({
    formId: 'asset',
    initialValues: EMPTY_ASSET_FORM,
    validate: (values) => validateAssetInfo(values, t.validation),
    fieldOrder: (values) => getAssetFieldOrder(values.type),
  })
  const vault = vaultQuery?.data || { name: 'Legacy Vault' }
  const [step, setStep] = useState(STEP.INFO)
  const [files, setFiles] = useState([])
  const [rejectedFiles, setRejectedFiles] = useState([])
  const [progress, setProgress] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [saving, setSaving] = useState(false)

  const goTo = (nextStep) => {
    setStep(nextStep)
    window.scrollTo({ top: 0 })
  }

  // Step 1 → 2 only when the information is valid.
  const handleInfoSubmit = (event) => {
    event.preventDefault()
    setSaveError(null)
    const assetName = (form.values.name || form.values.assetName || '').trim()
    const assetType = form.values.type || form.values.assetType || ''
    if (!assetName || !assetType) {
      setSaveError(
        language === 'vi'
          ? 'Tên tài sản và loại tài sản không được để trống.'
          : 'Asset name and asset type are required.',
      )
      return
    }
    if (form.checkBeforeSubmit()) goTo(STEP.DOCUMENTS)
  }

  const addFiles = (picked) => {
    const { accepted, rejected } = checkNewFiles(picked, files)
    setFiles((current) => [...current, ...accepted])
    setRejectedFiles(rejected)
  }

  const removeFile = (id) => {
    setFiles((current) => current.filter((item) => item.id !== id))
    setRejectedFiles([])
  }

  const handleSave = async () => {
    setSaveError(null)

    // 1. Quản lý Token & Authentication
    const token = localStorage.getItem('token') || localStorage.getItem('legacyvault-access-token')
    if (!token) {
      navigate('/login', { state: { from: location.pathname } })
      return
    }

    // 2. Validate cơ bản
    const assetName = (form.values.name || form.values.assetName || '').trim()
    const assetType = form.values.type || form.values.assetType || ''
    if (!assetName || !assetType) {
      setSaveError(
        language === 'vi'
          ? 'Tên tài sản và loại tài sản không được để trống.'
          : 'Asset name and asset type are required.',
      )
      goTo(STEP.INFO)
      return
    }

    if (!form.checkBeforeSubmit()) {
      goTo(STEP.INFO)
      return
    }

    goTo(STEP.SAVE)
    setSaving(true)

    try {
      // 3. Gọi hàm saveAsset (kết nối trực tiếp Backend API POST /api/v1/assets)
      const asset = await saveAsset(user?.id, vaultId, { values: form.values, files }, setProgress)

      // 4. Khi thành công (HTTP 201 Created): Reset form & hiển thị thông báo
      if (typeof form.setValues === 'function') {
        form.setValues(EMPTY_ASSET_FORM)
      }
      setFiles([])

      const successMsg =
        language === 'vi'
          ? 'Tài sản đã được thêm và mã hóa an toàn!'
          : 'Asset created and encrypted successfully!'

      // 5. Điều hướng sang trang chi tiết / danh sách tài sản
      navigate(ownerPaths.asset(vaultId, asset.id), {
        state: { saved: true, message: successMsg },
      })
    } catch (error) {
      // Xử lý khi token hết hạn (401 / 403)
      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem('token')
        localStorage.removeItem('legacyvault-access-token')
        navigate('/login', {
          state: {
            from: location.pathname,
            message:
              language === 'vi'
                ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                : 'Session expired. Please log in again.',
          },
        })
        return
      }

      // Xử lý hiển thị thông báo lỗi từ response backend
      const errorMsg =
        error.message ||
        error.code ||
        (language === 'vi' ? 'Lỗi tạo tài sản.' : 'Failed to save asset.')
      setSaveError(errorMsg)
      setSaving(false)
    }
  }

  const cancel = () => navigate(ownerPaths.assets)

  return (
    <OwnerLayout>
      <Breadcrumbs
        label={t.breadcrumbsLabel}
        items={[
          { label: language === 'vi' ? 'Tài sản của tôi' : 'My Assets', to: ownerPaths.assets },
          { label: language === 'vi' ? 'Đăng ký tài sản' : 'Register Asset' },
        ]}
      />

      <div className="card form-card form-card--wide">
        <p className="page-meta">
          {copy.stepOf(step + 1, copy.steps.length)} · {copy.steps[step]}
        </p>
        <h1 className="page-title">{language === 'vi' ? 'Đăng ký tài sản số' : 'Register Digital Asset'}</h1>
        <p className="page-text">
          {language === 'vi'
            ? 'Nhập thông tin tài sản, tài khoản hoặc tài liệu để bảo vệ và mã hóa an toàn trong hệ thống.'
            : 'Enter asset details, credentials, or documents to securely encrypt and store.'}
        </p>

        <Stepper steps={copy.steps} current={step} label={copy.stepsLabel} />

        {step === STEP.INFO && (
          <form noValidate onSubmit={handleInfoSubmit}>
            {saveError && <FormAlert tone="danger">{saveError}</FormAlert>}
            <FormAlert tone="info">{copy.safety}</FormAlert>
            <div className="form-stack--spaced">
              <AssetInfoStep form={form} t={t} />
            </div>
            <div className="form-actions">
              <Button variant="secondary" size="lg" onClick={cancel}>
                {t.cancel}
              </Button>
              <Button type="submit" size="lg" disabled={saving}>
                {copy.next}
              </Button>
            </div>
          </form>
        )}

        {step === STEP.DOCUMENTS && (
          <>
            <DocumentsStep
              files={files}
              rejected={rejectedFiles}
              onAdd={addFiles}
              onRemove={removeFile}
              t={t}
            />
            <div className="form-actions">
              <Button variant="secondary" size="lg" onClick={() => goTo(STEP.INFO)}>
                {copy.back}
              </Button>
              <Button size="lg" onClick={() => goTo(STEP.ENCRYPTION)}>
                {copy.next}
              </Button>
            </div>
          </>
        )}

        {step === STEP.ENCRYPTION && (
          <>
            {saveError && <FormAlert tone="danger">{saveError}</FormAlert>}
            <EncryptionStep
              asset={buildAssetFromForm(form.values)}
              documentCount={files.length}
              vaultName={vault?.name || 'Legacy Vault'}
              t={t}
            />
            <div className="form-actions">
              <Button variant="secondary" size="lg" onClick={() => goTo(STEP.DOCUMENTS)}>
                {copy.back}
              </Button>
              <Button size="lg" onClick={handleSave} disabled={saving}>
                {saving ? (language === 'vi' ? 'Đang lưu...' : 'Saving...') : copy.save}
              </Button>
            </div>
          </>
        )}

        {step === STEP.SAVE && (
          <>
            <SaveStep current={progress} error={saveError} t={t} />
            {!saving && saveError && (
              <div className="form-actions">
                <Button variant="secondary" size="lg" onClick={() => goTo(STEP.ENCRYPTION)}>
                  {copy.back}
                </Button>
                <Button size="lg" onClick={handleSave} disabled={saving}>
                  {t.retry}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </OwnerLayout>
  )
}
