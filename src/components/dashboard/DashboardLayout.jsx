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
