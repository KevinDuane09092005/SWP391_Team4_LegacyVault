import Icon from '../../components/Icon.jsx'
import { AdminLayout } from '../../components/admin/AdminParts.jsx'
import { flow7Content } from '../../data/flow7Content.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export default function AdminPoliciesPage() {
  const { language } = useLanguage()
  const t = flow7Content[language]
  const p = t.admin.policies

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{p.title}</h1>
          <p className="page-text">{p.text}</p>
        </div>
      </div>
      <section className="card handover-panel">
        <p className="handover-note">
          <Icon name="info" size={15} /> {t.admin.backendUnavailable}
        </p>
      </section>
    </AdminLayout>
  )
}
