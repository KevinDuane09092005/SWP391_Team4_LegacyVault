import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Brand from '../Brand.jsx'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import LanguageSwitcher from '../LanguageSwitcher.jsx'
import ThemeToggle from '../ThemeToggle.jsx'
import { NotificationBell } from '../notifications/NotificationParts.jsx'
import WelcomeTour from '../onboarding/WelcomeTour.jsx'
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

  // Build the list of role contexts for the "Switch role" dropdown.
  // Only displays roles/contexts that the user actually possesses.
  const roleOptions = useMemo(() => {
    const rawList = Array.isArray(user?.availableContexts) ? user.availableContexts : []
    const items = []
    const currentPrimaryRole = normalizeRole(user?.role)

    // 1. System Admin (if user has ADMIN role)
    if (
      currentPrimaryRole === ROLES.ADMIN ||
      rawList.some((c) => normalizeRole(c.role || c.roleCode) === ROLES.ADMIN)
    ) {
      items.push({
        key: 'ADMIN',
        role: ROLES.ADMIN,
        roleCode: ROLES.ADMIN,
        title: t.roles[ROLES.ADMIN]?.label || 'Admin',
        subtitle: null,
        icon: 'shieldCheck',
      })
    }

    // 2. Legal Verifier (if user has LEGAL_VERIFIER role)
    if (
      currentPrimaryRole === ROLES.LEGAL_VERIFIER ||
      rawList.some((c) => normalizeRole(c.role || c.roleCode) === ROLES.LEGAL_VERIFIER)
    ) {
      items.push({
        key: 'LEGAL_VERIFIER',
        role: ROLES.LEGAL_VERIFIER,
        roleCode: ROLES.LEGAL_VERIFIER,
        title: t.roles[ROLES.LEGAL_VERIFIER]?.label || 'Legal Verifier',
        subtitle: null,
        icon: 'badgeCheck',
      })
    }

    // 3. Vault Owner (if user has VAULT_OWNER role or is a regular user owning a vault)
    const hasOwnerContext =
      currentPrimaryRole === ROLES.VAULT_OWNER ||
      rawList.some((c) => normalizeRole(c.role || c.roleCode) === ROLES.VAULT_OWNER) ||
      (currentPrimaryRole !== ROLES.ADMIN && currentPrimaryRole !== ROLES.LEGAL_VERIFIER)

    if (hasOwnerContext) {
      const ownerCtx = rawList.find(
        (c) => normalizeRole(c.role || c.roleCode) === ROLES.VAULT_OWNER
      )
      items.push({
        key: 'VAULT_OWNER',
        role: ROLES.VAULT_OWNER,
        roleCode: ROLES.VAULT_OWNER,
        title: 'Vault Owner',
        subtitle: null,
        icon: 'shieldCheck',
        ownerId: ownerCtx?.ownerId || user?.id || null,
        ownerFullName: ownerCtx?.ownerFullName || user?.fullName || null,
      })
    }

    // 4. Executor contexts (ONLY if user is actually assigned as an executor for someone)
    const executorContexts = rawList.filter(
      (c) => normalizeRole(c.role || c.roleCode) === ROLES.EXECUTOR
    )
    executorContexts.forEach((ctx, idx) => {
      const ownerName = ctx.ownerFullName || ctx.vaultOwnerName
      items.push({
        key: ctx.contactId ? `EXECUTOR_${ctx.contactId}` : `EXECUTOR_${ctx.ownerId || idx}`,
        role: ROLES.EXECUTOR,
        roleCode: ROLES.EXECUTOR,
        title: 'Executor Dashboard',
        subtitle: ctx.subtitle || (ownerName ? `Executor for ${ownerName}` : null),
        icon: 'clipboardCheck',
        ownerId: ctx.ownerId || ctx.vaultOwnerId || null,
        ownerFullName: ownerName || null,
        contactId: ctx.contactId || null,
      })
    })

    // If current active role is EXECUTOR but rawList didn't provide executor context, keep current session context
    if (currentPrimaryRole === ROLES.EXECUTOR && executorContexts.length === 0) {
      items.push({
        key: 'EXECUTOR',
        role: ROLES.EXECUTOR,
        roleCode: ROLES.EXECUTOR,
        title: 'Executor Dashboard',
        subtitle: user?.activeContext?.subtitle || null,
        icon: 'clipboardCheck',
        ownerId: user?.activeContext?.ownerId || null,
        ownerFullName: user?.activeContext?.ownerFullName || null,
        contactId: user?.activeContext?.contactId || null,
      })
    }

    // 5. Beneficiary contexts (ONLY if user is actually assigned as a beneficiary for someone)
    const beneficiaryContexts = rawList.filter(
      (c) => normalizeRole(c.role || c.roleCode) === ROLES.BENEFICIARY
    )
    beneficiaryContexts.forEach((ctx, idx) => {
      const ownerName = ctx.ownerFullName || ctx.vaultOwnerName
      items.push({
        key: ctx.contactId ? `BENEFICIARY_${ctx.contactId}` : `BENEFICIARY_${ctx.ownerId || idx}`,
        role: ROLES.BENEFICIARY,
        roleCode: ROLES.BENEFICIARY,
        title: 'Beneficiary Dashboard',
        subtitle: ctx.subtitle || (ownerName ? `Beneficiary for ${ownerName}` : null),
        icon: 'gift',
        ownerId: ctx.ownerId || ctx.vaultOwnerId || null,
        ownerFullName: ownerName || null,
        contactId: ctx.contactId || null,
      })
    })

    // If current active role is BENEFICIARY but rawList didn't provide beneficiary context, keep current session context
    if (currentPrimaryRole === ROLES.BENEFICIARY && beneficiaryContexts.length === 0) {
      items.push({
        key: 'BENEFICIARY',
        role: ROLES.BENEFICIARY,
        roleCode: ROLES.BENEFICIARY,
        title: 'Beneficiary Dashboard',
        subtitle: user?.activeContext?.subtitle || null,
        icon: 'gift',
        ownerId: user?.activeContext?.ownerId || null,
        ownerFullName: user?.activeContext?.ownerFullName || null,
        contactId: user?.activeContext?.contactId || null,
      })
    }

    // Deduplicate items by key
    const seen = new Set()
    return items.filter((item) => {
      if (seen.has(item.key)) return false
      seen.add(item.key)
      return true
    })
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

              <div className="role-switcher" data-tour="role-switcher">
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
                      {language === 'vi' ? 'Chuyển vai trò' : 'Switch role'}
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
            <WelcomeTour
              user={user}
              role={currentRole}
              storageKey={user?.id ? `${user.id}:${currentRole}` : currentRole}
            />
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
