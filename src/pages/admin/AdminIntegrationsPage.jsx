import Icon from '../../components/Icon.jsx'
import { AdminLayout } from '../../components/admin/AdminParts.jsx'
import { flow7Content } from '../../data/flow7Content.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'

export default function AdminIntegrationsPage() {
  const { language } = useLanguage()
  const t = flow7Content[language]
  const g = t.admin.integrations

  return (
    <AdminLayout>
      <div className="page-head">
        <div>
          <h1 className="page-title">{g.title}</h1>
          <p className="page-text">{g.text}</p>
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
