import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop.jsx'
import { DashboardRedirect, RedirectIfSignedIn, RequireAuth } from './auth/guards.jsx'
import { ROLES } from './auth/roles.js'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx'
import LoginPage from './pages/auth/LoginPage.jsx'
import RegisterPage from './pages/auth/RegisterPage.jsx'
import VerifyOtpPage from './pages/auth/VerifyOtpPage.jsx'
import RoleDashboardPage from './pages/dashboard/RoleDashboardPage.jsx'
import AddAssetPage from './pages/owner/AddAssetPage.jsx'
import AssetDetailsPage from './pages/owner/AssetDetailsPage.jsx'
import AssetsPage from './pages/owner/AssetsPage.jsx'
import CreateVaultPage from './pages/owner/CreateVaultPage.jsx'
import MyVaultsPage from './pages/owner/MyVaultsPage.jsx'
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage.jsx'
import VaultDetailsPage from './pages/owner/VaultDetailsPage.jsx'
import ContactsPage from './pages/owner/ContactsPage.jsx'
import AssignmentsPage from './pages/owner/AssignmentsPage.jsx'
import DeadMansSwitchPage from './pages/owner/DeadMansSwitchPage.jsx'
import HomePage from './pages/HomePage.jsx'
import HowItWorksPage from './pages/HowItWorksPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import ExecutorHandoverPage from './pages/executor/ExecutorHandoverPage.jsx'
import BeneficiaryCasePage from './pages/beneficiary/BeneficiaryCasePage.jsx'
import BeneficiaryHandoversPage from './pages/beneficiary/BeneficiaryHandoversPage.jsx'
import NotificationsPage from './pages/notifications/NotificationsPage.jsx'
import AdminOverviewPage from './pages/admin/AdminOverviewPage.jsx'
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx'
import AdminRolesPage from './pages/admin/AdminRolesPage.jsx'
import AdminAuditPage from './pages/admin/AdminAuditPage.jsx'
import AdminPoliciesPage from './pages/admin/AdminPoliciesPage.jsx'
import AdminIntegrationsPage from './pages/admin/AdminIntegrationsPage.jsx'

// All pages of the app.
// Placeholder text lives in src/data/placeholderContent.js, keyed by `page`.
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/terms" element={<PlaceholderPage page="terms" />} />
        <Route path="/privacy" element={<PlaceholderPage page="privacy" />} />
        <Route path="/contact" element={<PlaceholderPage page="contact" />} />
        <Route path="/guides/checklist" element={<PlaceholderPage page="checklist" />} />
        <Route
          path="/guides/executor-access"
          element={<PlaceholderPage page="executorGuide" />}
        />
        <Route path="/assignments" element={<Navigate to="/dashboard/owner/assignments" replace />} />
        <Route path="/dms" element={<Navigate to="/dashboard/owner/dms" replace />} />

        {/* Flow 1: sign up, verify, sign in. Signed-in users are sent to their dashboard. */}
        <Route path="/register" element={<RedirectIfSignedIn><RegisterPage /></RedirectIfSignedIn>} />
        <Route path="/verify-otp" element={<RedirectIfSignedIn><VerifyOtpPage /></RedirectIfSignedIn>} />
        <Route path="/login" element={<RedirectIfSignedIn><LoginPage /></RedirectIfSignedIn>} />
        <Route
          path="/forgot-password"
          element={<RedirectIfSignedIn><ForgotPasswordPage /></RedirectIfSignedIn>}
        />

        {/* Signed-in area: one placeholder dashboard per role (see src/auth/roles.js) */}
        <Route path="/dashboard" element={<RequireAuth><DashboardRedirect /></RequireAuth>} />
        {/* Flow 7: Notification Center for every signed-in role (each user sees only their own). */}
        <Route path="/dashboard/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />

        {/* Flow 7: Administration. Every page inside needs the ADMIN role. */}
        <Route
          path="/dashboard/admin"
          element={<RequireAuth allowedRoles={[ROLES.ADMIN]}><Outlet /></RequireAuth>}
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="policies" element={<AdminPoliciesPage />} />
          <Route path="integrations" element={<AdminIntegrationsPage />} />
        </Route>

        {/* Flow 2: Vault Owner area. Every page inside needs the VAULT_OWNER role. */}
        <Route
          path="/dashboard/owner"
          element={<RequireAuth allowedRoles={[ROLES.VAULT_OWNER]}><Outlet /></RequireAuth>}
        >
          <Route index element={<OwnerDashboardPage />} />
          <Route path="vaults" element={<Navigate to="/dashboard/owner/assets" replace />} />
          <Route path="vaults/new" element={<Navigate to="/dashboard/owner/assets/new" replace />} />
          <Route path="vaults/:vaultId" element={<Navigate to="/dashboard/owner/assets" replace />} />
          <Route path="vaults/:vaultId/assets/new" element={<AddAssetPage />} />
          <Route path="vaults/:vaultId/assets/:assetId" element={<AssetDetailsPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="assets/new" element={<AddAssetPage />} />
          <Route path="assets/:assetId" element={<AssetDetailsPage />} />
          <Route path="asset" element={<Navigate to="/dashboard/owner/assets" replace />} />
          <Route path="asset/new" element={<AddAssetPage />} />
          <Route path="asset/:assetId" element={<AssetDetailsPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="dms" element={<DeadMansSwitchPage />} />
        </Route>

        {/* Flow 6: Asset Handover. Executor starts it; only the BENEFICIARY role can open the beneficiary pages. */}
        <Route
          path="/dashboard/executor"
          element={<RequireAuth allowedRoles={[ROLES.EXECUTOR]}><ExecutorHandoverPage /></RequireAuth>}
        />
        <Route
          path="/dashboard/beneficiary"
          element={<RequireAuth allowedRoles={[ROLES.BENEFICIARY]}><Outlet /></RequireAuth>}
        >
          <Route index element={<BeneficiaryHandoversPage />} />
          <Route path="handover/:caseId" element={<BeneficiaryCasePage />} />
        </Route>
        <Route
          path="/dashboard/verifier"
          element={<RequireAuth allowedRoles={[ROLES.LEGAL_VERIFIER]}><RoleDashboardPage role={ROLES.LEGAL_VERIFIER} /></RequireAuth>}
        />

        <Route path="*" element={<PlaceholderPage page="notFound" />} />
      </Routes>
    </>
  )
}
