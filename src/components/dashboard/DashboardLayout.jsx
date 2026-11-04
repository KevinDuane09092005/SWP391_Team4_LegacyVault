import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Brand from '../Brand.jsx'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import LanguageSwitcher from '../LanguageSwitcher.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import { NotificationBell } from '../notifications/NotificationParts.jsx'
import { useAuth } from '../../auth/AuthContext.jsx'
import { ROLES, getDashboardPath, normalizeRole } from '../../auth/roles.js'
import { dashboardContent } from '../../data/dashboardContent.js'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import '../../styles/dashboard.css'

function getRoleIcon(role) {
  const r = normalizeRole(role)
  if (r === ROLES.EXECUTOR) return 'clipboardCheck'
  if (r === ROLES.BENEFICIARY) return 'gift'
  if (r === ROLES.LEGAL_VERIFIER) return 'badgeCheck'
  return 'shieldCheck'
}

function getButtonLabel(role, language, t) {
  const r = normalizeRole(role)
  if (r === ROLES.VAULT_OWNER) return language === 'vi' ? 'Vault Owner' : 'Vault Owner'
  if (r === ROLES.EXECUTOR) return language === 'vi' ? 'Executor Dashboard' : 'Executor Dashboard'
  if (r === ROLES.BENEFICIARY) return language === 'vi' ? 'Beneficiary Dashboard' : 'Beneficiary Dashboard'
  return t.roles[r]?.label || r
}

// Frame for every signed-in page: top bar with the user, their Switch role dropdown, and Log out.
export default function DashboardLayout({ children, showThemeToggle = true }) {
  const { user, logout, switchRoleContext } = useAuth()
  const { language } = useLanguage()
  const t = dashboardContent[language]
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!dropdownOpen) return undefined
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [dropdownOpen])

  // Build the list of role contexts for the "Switch role" dropdown
  // (merges dynamic contexts from Backend GET /api/v1/auth/contexts with the 3 standard vault roles).
  const roleOptions = useMemo(() => {
    const rawList = Array.isArray(user?.availableContexts) ? user.availableContexts : []
    const executorCtx = rawList.find((c) => normalizeRole(c.role || c.roleCode) === ROLES.EXECUTOR)
    const beneficiaryCtx = rawList.find((c) => normalizeRole(c.role || c.roleCode) === ROLES.BENEFICIARY)

    const items = [
      {
        key: 'VAULT_OWNER',
        role: ROLES.VAULT_OWNER,
        roleCode: ROLES.VAULT_OWNER,
        title: 'Vault Owner',
        subtitle: null,
        icon: 'shieldCheck',
        ownerId: user?.id || null,
        ownerFullName: user?.fullName || null,
      },
      {
        key: executorCtx?.contactId ? `EXECUTOR_${executorCtx.contactId}` : 'EXECUTOR',
        role: ROLES.EXECUTOR,
        roleCode: ROLES.EXECUTOR,
        title: 'Executor Dashboard',
        subtitle: executorCtx?.ownerFullName
          ? `Executor for ${executorCtx.ownerFullName}`
          : 'Executor for John Doe',
        icon: 'clipboardCheck',
        ownerId: executorCtx?.ownerId || null,
        ownerFullName: executorCtx?.ownerFullName || 'John Doe',
        contactId: executorCtx?.contactId || null,
      },
      {
        key: beneficiaryCtx?.contactId ? `BENEFICIARY_${beneficiaryCtx.contactId}` : 'BENEFICIARY',
        role: ROLES.BENEFICIARY,
        roleCode: ROLES.BENEFICIARY,
        title: 'Beneficiary Dashboard',
        subtitle: beneficiaryCtx?.ownerFullName
          ? `Beneficiary for ${beneficiaryCtx.ownerFullName}`
          : null,
        icon: 'gift',
        ownerId: beneficiaryCtx?.ownerId || null,
        ownerFullName: beneficiaryCtx?.ownerFullName || null,
        contactId: beneficiaryCtx?.contactId || null,
      },
    ]

    // Include additional dynamic executor/beneficiary contexts if a user is invited to multiple vaults
    rawList.forEach((ctx, idx) => {
      const r = normalizeRole(ctx.role || ctx.roleCode)
      if (
        r === ROLES.EXECUTOR &&
        ctx.contactId &&
        ctx.contactId !== executorCtx?.contactId
      ) {
        items.push({
          key: `EXECUTOR_${ctx.contactId}_${idx}`,
          role: ROLES.EXECUTOR,
          roleCode: ROLES.EXECUTOR,
          title: 'Executor Dashboard',
          subtitle: ctx.ownerFullName ? `Executor for ${ctx.ownerFullName}` : null,
          icon: 'clipboardCheck',
          ownerId: ctx.ownerId,
          ownerFullName: ctx.ownerFullName,
          contactId: ctx.contactId,
        })
      }
    })

    if (user?.role === ROLES.ADMIN || rawList.some((c) => normalizeRole(c.role || c.roleCode) === ROLES.ADMIN)) {
      items.unshift({
        key: 'ADMIN',
        role: ROLES.ADMIN,
        roleCode: ROLES.ADMIN,
        title: t.roles[ROLES.ADMIN]?.label || 'Admin',
        subtitle: null,
        icon: 'shieldCheck',
      })
    }

    if (
      user?.role === ROLES.LEGAL_VERIFIER ||
      rawList.some((c) => normalizeRole(c.role || c.roleCode) === ROLES.LEGAL_VERIFIER)
    ) {
      items.unshift({
        key: 'LEGAL_VERIFIER',
        role: ROLES.LEGAL_VERIFIER,
        roleCode: ROLES.LEGAL_VERIFIER,
        title: t.roles[ROLES.LEGAL_VERIFIER]?.label || 'Legal Verifier',
        subtitle: null,
        icon: 'badgeCheck',
      })
    }

    return items
  }, [user, t])

  const handleSelectRole = (item) => {
    setDropdownOpen(false)
    if (typeof switchRoleContext === 'function') {
      switchRoleContext(item)
    }
    navigate(getDashboardPath(item.role))
  }

  // Clearing the session is enough: RequireAuth (src/auth/guards.jsx) then sends
  // the user to /login, so there is only one place that decides where to go.
  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
  }

  const currentRole = normalizeRole(user?.role)

  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div className="container dashboard-topbar__inner">
          <Brand to="/" />
          <div className="dashboard-topbar__end">
            <div className="dashboard-user" ref={dropdownRef}>
              <span className="dashboard-user__name">{user.fullName}</span>

              <div className="role-switcher">
                <button
                  type="button"
                  className={`role-switcher__trigger ${dropdownOpen ? 'role-switcher__trigger--open' : ''}`}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={dropdownOpen}
                >
                  <Icon name={getRoleIcon(currentRole)} size={15} />
                  <span>{getButtonLabel(currentRole, language, t)}</span>
                  <Icon name={dropdownOpen ? 'chevronUp' : 'chevronDown'} size={14} />
                </button>

                {dropdownOpen && (
                  <div className="role-switcher__menu" role="listbox" aria-label="Switch role">
                    <div className="role-switcher__header">
                      {language === 'vi' ? 'Switch role' : 'Switch role'}
                    </div>
                    {roleOptions.map((item) => {
                      const isActive = currentRole === item.role
                      return (
                        <button
                          key={item.key}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`role-switcher__item ${isActive ? 'role-switcher__item--active' : ''}`}
                          onClick={() => handleSelectRole(item)}
                        >
                          <span className="role-switcher__item-icon">
                            <Icon name={item.icon} size={17} />
                          </span>
                          <span className="role-switcher__item-content">
                            <span className="role-switcher__item-title">{item.title}</span>
                            {item.subtitle && (
                              <span className="role-switcher__item-subtitle">{item.subtitle}</span>
                            )}
                          </span>
                          {isActive && (
                            <span className="role-switcher__item-check">
                              <Icon name="check" size={16} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <NotificationBell />
            {showThemeToggle && <ThemeToggle />}
            <LanguageSwitcher label={t.languageLabel} />
            {/* aria-label keeps the button named on phones, where only the icon shows */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label={loggingOut ? t.loggingOut : t.logout}
            >
              <Icon name="logOut" size={16} />
              <span className="dashboard-topbar__logout-text">
                {loggingOut ? t.loggingOut : t.logout}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container dashboard-main">{children}</main>
    </div>
  )
}
