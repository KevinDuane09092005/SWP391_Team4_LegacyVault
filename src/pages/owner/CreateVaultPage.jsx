import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button.jsx'
import FormAlert from '../../components/auth/FormAlert.jsx'
import FormField from '../../components/auth/FormField.jsx'
import SubmitButton from '../../components/auth/SubmitButton.jsx'
import OwnerLayout from '../../components/vault/OwnerLayout.jsx'
import { Breadcrumbs } from '../../components/vault/PageStates.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { vaultContent } from '../../data/vaultContent.js'
import useForm from '../../hooks/useForm.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { getPlanLimitMessage } from '../../services/planLimitService.js'
import { createVault } from '../../services/vaultService.js'
import { ownerPaths } from '../../vault/paths.js'
import { LIMITS, validateVault } from '../../vault/vaultValidation.js'

// Flow 2 — Create Vault. On success the new vault opens, ready for its first asset.
export default function CreateVaultPage() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const t = vaultContent[language]
  const copy = t.createVault
  const navigate = useNavigate()

  const form = useForm({
    formId: 'vault',
    initialValues: { name: '', description: '' },
    validate: (values) => validateVault(values, t.validation),
    fieldOrder: ['name', 'description'],
  })
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError(null)
    if (!form.checkBeforeSubmit()) return

    setLoading(true)
    try {
      const vault = await createVault(user.id, form.values)
      // The vault is added to the list only now that creating it succeeded.
      navigate(ownerPaths.vault(vault.id), { state: { created: true } })
    } catch (error) {
      setServerError(getPlanLimitMessage(error, language) || error.code || 'generic')
      setLoading(false)
    }
  }

  return (
    <OwnerLayout>
      <Breadcrumbs
        label={t.breadcrumbsLabel}
        items={[{ label: t.nav.vaults, to: ownerPaths.vaults }, { label: copy.title }]}
      />

      <div className="card form-card">
        <h1 className="page-title">{copy.title}</h1>
        <p className="page-text">{copy.subtitle}</p>

        {serverError && <FormAlert>{t.errors[serverError] ?? serverError}</FormAlert>}

        <form className="form-stack form-stack--spaced" noValidate onSubmit={handleSubmit}>
          <FormField
            {...form.fieldProps('name')}
            label={copy.nameLabel}
            placeholder={copy.namePlaceholder}
            maxLength={LIMITS.vaultName.max}
            disabled={loading}
          />
          <FormField
            {...form.fieldProps('description')}
            as="textarea"
            label={copy.descriptionLabel}
            optional={t.optional}
            placeholder={copy.descriptionPlaceholder}
            maxLength={LIMITS.vaultDescription}
            disabled={loading}
          />

          <div className="form-actions">
            <Button to={ownerPaths.vaults} variant="secondary" size="lg">
              {t.cancel}
            </Button>
            <SubmitButton loading={loading} loadingText={copy.submitting}>
              {copy.submit}
            </SubmitButton>
          </div>
        </form>
      </div>
    </OwnerLayout>
  )
}
