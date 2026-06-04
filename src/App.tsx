import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Public Portal (SCR-01 → SCR-10) ──
import LandingPage        from './pages/public/LandingPage';
import LoginPage          from './pages/public/LoginPage';
import RegisterPage       from './pages/public/RegisterPage';
import VerifyEmailPage    from './pages/public/VerifyEmailPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import ResetPasswordPage  from './pages/public/ResetPasswordPage';
import RoomListingPage    from './pages/public/RoomListingPage';
import RoomDetailPage     from './pages/public/RoomDetailPage';
import SearchResultPage   from './pages/public/SearchResultPage';
import AboutPage          from './pages/public/AboutPage';

// ── Tenant Portal (SCR-11 → SCR-33) ──
import UserProfilePage        from './pages/tenant/UserProfilePage';
import EditProfilePage        from './pages/tenant/EditProfilePage';
import ChangePasswordPage     from './pages/tenant/ChangePasswordPage';
import NotificationCenterPage from './pages/tenant/NotificationCenterPage';
import NotificationDetailPage from './pages/tenant/NotificationDetailPage';
import TenantDashboardPage    from './pages/tenant/TenantDashboardPage';
import MyRoomPage             from './pages/tenant/MyRoomPage';
import { RentalRequestListPage, RentalRequestFormPage, RentalRequestDetailPage } from './pages/tenant/RentalRequestPages';
import ViewingAppointmentPage from './pages/tenant/ViewingAppointmentPage';
import { ContractListPage, ContractDetailPage } from './pages/tenant/ContractPages';
import { BillListPage, BillDetailPage, PaymentPage, PaymentHistoryPage, ReceiptUploadPage } from './pages/tenant/BillingPages';
import { MaintenanceListPage, CreateMaintenanceTicketPage, MaintenanceTicketDetailPage } from './pages/tenant/MaintenancePages';
import ReviewPage             from './pages/tenant/ReviewPage';

// ── Admin Portal (SCR-71 → SCR-80) ──
import AdminDashboardPage                from './pages/admin/AdminDashboardPage';
import { UserManagementPage, UserDetailAdminPage, EditUserAdminPage } from './pages/admin/UserManagementPages';
import ContentModerationPage            from './pages/admin/ContentModerationPage';
import { ComplaintManagementPage, ComplaintDetailPage } from './pages/admin/ComplaintPages';
import SystemAnalyticsPage             from './pages/admin/SystemAnalyticsPage';
import ActivityLogsPage                from './pages/admin/ActivityLogsPage';
import SystemSettingsPage              from './pages/admin/SystemSettingsPage';

// ── Landlord Portal (SCR-34 → SCR-70) ──
import LandlordDashboardPage from './pages/landlord/LandlordDashboardPage';

// Property (SCR-35 → SCR-39)
import { PropertyListPage, PropertyDetailPage, PropertyFormPage, BlockFloorPage } from './pages/landlord/PropertyPages';

// Room (SCR-40 → SCR-44)
import { RoomListPage, RoomDetailManagementPage, RoomFormPage, RoomMediaPage } from './pages/landlord/RoomPages';

// Tenant / Request (SCR-45 → SCR-49)
import { RequestManagementPage, RequestDetailPage, TenantListPage, TenantDetailPage, RentalHistoryPage } from './pages/landlord/TenantRequestPages';

// Contract (SCR-50 → SCR-54)
import { ContractManagementListPage, CreateContractPage, ContractManagementDetailPage, RenewContractPage, TerminateContractPage } from './pages/landlord/ContractManagementPages';

// Billing & Payments (SCR-55 → SCR-61)
import { BillingDashboardPage, BillListManagementPage, CreateBillPage, BillDetailManagementPage, PaymentVerificationPage, PaymentDetailPage } from './pages/landlord/BillingManagementPages';

// Utilities (SCR-62 → SCR-65)
import { UtilityDashboardPage, MeterEntryPage, UtilityPricingPage } from './pages/landlord/UtilityPages';

// Maintenance & Reports (SCR-66 → SCR-70)
import { MaintenanceManagementPage, MaintenanceTicketManagementPage, RevenueReportPage, OccupancyReportPage, DebtReportPage } from './pages/landlord/ReportPages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ──────────────────── PUBLIC PORTAL ──────────────────── */}
        <Route path="/"                element={<LandingPage />} />
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/verify-email"    element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />
        <Route path="/rooms"           element={<RoomListingPage />} />
        <Route path="/rooms/:id"       element={<RoomDetailPage />} />
        <Route path="/search"          element={<SearchResultPage />} />
        <Route path="/about"           element={<AboutPage />} />
        <Route path="/contact"         element={<AboutPage />} />

        {/* ──────────────────── TENANT PORTAL ──────────────────── */}
        <Route path="/tenant/dashboard"               element={<TenantDashboardPage />} />
        <Route path="/tenant/room"                    element={<MyRoomPage />} />
        <Route path="/tenant/requests"                element={<RentalRequestListPage />} />
        <Route path="/tenant/requests/new"            element={<RentalRequestFormPage />} />
        <Route path="/request-rental/:roomId"         element={<RentalRequestFormPage />} />
        <Route path="/tenant/requests/:id"            element={<RentalRequestDetailPage />} />
        <Route path="/tenant/viewing/:roomId"         element={<ViewingAppointmentPage />} />
        <Route path="/viewing/:roomId"                element={<ViewingAppointmentPage />} />
        <Route path="/tenant/contracts"               element={<ContractListPage />} />
        <Route path="/tenant/contracts/:id"           element={<ContractDetailPage />} />
        <Route path="/tenant/bills"                   element={<BillListPage />} />
        <Route path="/tenant/bills/history"           element={<PaymentHistoryPage />} />
        <Route path="/tenant/bills/:id"               element={<BillDetailPage />} />
        <Route path="/tenant/bills/:id/pay"           element={<PaymentPage />} />
        <Route path="/tenant/bills/:id/receipt"       element={<ReceiptUploadPage />} />
        <Route path="/tenant/maintenance"             element={<MaintenanceListPage />} />
        <Route path="/tenant/maintenance/create"      element={<CreateMaintenanceTicketPage />} />
        <Route path="/tenant/maintenance/:id"         element={<MaintenanceTicketDetailPage />} />
        <Route path="/tenant/reviews"                 element={<ReviewPage />} />
        <Route path="/tenant/reviews/create"          element={<ReviewPage />} />
        <Route path="/tenant/profile"                 element={<UserProfilePage />} />
        <Route path="/tenant/profile/edit"            element={<EditProfilePage />} />
        <Route path="/tenant/change-password"         element={<ChangePasswordPage />} />
        <Route path="/tenant/notifications"           element={<NotificationCenterPage />} />
        <Route path="/tenant/notifications/:id"       element={<NotificationDetailPage />} />

        {/* ──────────────────── LANDLORD PORTAL ──────────────────── */}
        {/* SCR-34: Dashboard */}
        <Route path="/landlord/dashboard"             element={<LandlordDashboardPage />} />
        <Route path="/landlord"                       element={<Navigate to="/landlord/dashboard" replace />} />

        {/* SCR-35: Property List */}
        <Route path="/landlord/properties"            element={<PropertyListPage />} />
        {/* SCR-36: Property Detail */}
        <Route path="/landlord/properties/:id"        element={<PropertyDetailPage />} />
        {/* SCR-37: Add Property */}
        <Route path="/landlord/properties/create"     element={<PropertyFormPage mode="create" />} />
        {/* SCR-38: Edit Property */}
        <Route path="/landlord/properties/:id/edit"   element={<PropertyFormPage mode="edit" />} />
        {/* SCR-39: Block/Floor Management */}
        <Route path="/landlord/blocks"                element={<BlockFloorPage />} />
        <Route path="/landlord/blocks/:propertyId"    element={<BlockFloorPage />} />

        {/* SCR-40: Room List */}
        <Route path="/landlord/rooms"                 element={<RoomListPage />} />
        {/* SCR-41: Room Detail */}
        <Route path="/landlord/rooms/:id"             element={<RoomDetailManagementPage />} />
        {/* SCR-42: Add Room */}
        <Route path="/landlord/rooms/create"          element={<RoomFormPage mode="create" />} />
        {/* SCR-43: Edit Room */}
        <Route path="/landlord/rooms/:id/edit"        element={<RoomFormPage mode="edit" />} />
        {/* SCR-44: Room Media */}
        <Route path="/landlord/rooms/:id/media"       element={<RoomMediaPage />} />

        {/* SCR-45: Rental Request List */}
        <Route path="/landlord/requests"              element={<RequestManagementPage />} />
        {/* SCR-46: Rental Request Detail */}
        <Route path="/landlord/requests/:id"          element={<RequestDetailPage />} />
        {/* SCR-47: Tenant List */}
        <Route path="/landlord/tenants"               element={<TenantListPage />} />
        {/* SCR-48: Tenant Detail */}
        <Route path="/landlord/tenants/:id"           element={<TenantDetailPage />} />
        {/* SCR-49: Rental History */}
        <Route path="/landlord/tenants/:tenantId/history" element={<RentalHistoryPage />} />
        <Route path="/landlord/history"               element={<RentalHistoryPage />} />

        {/* SCR-50: Contract List */}
        <Route path="/landlord/contracts"             element={<ContractManagementListPage />} />
        {/* SCR-51: Create Contract */}
        <Route path="/landlord/contracts/create"      element={<CreateContractPage />} />
        {/* SCR-52: Contract Detail */}
        <Route path="/landlord/contracts/:id"         element={<ContractManagementDetailPage />} />
        {/* SCR-53: Renew Contract */}
        <Route path="/landlord/contracts/:id/renew"   element={<RenewContractPage />} />
        {/* SCR-54: Terminate Contract */}
        <Route path="/landlord/contracts/:id/terminate" element={<TerminateContractPage />} />

        {/* SCR-55: Billing Dashboard */}
        <Route path="/landlord/billing"               element={<BillingDashboardPage />} />
        {/* SCR-56: Bill List */}
        <Route path="/landlord/billing/list"          element={<BillListManagementPage />} />
        {/* SCR-57: Create Bill */}
        <Route path="/landlord/billing/create"        element={<CreateBillPage />} />
        {/* SCR-58: Bill Detail */}
        <Route path="/landlord/billing/:id"           element={<BillDetailManagementPage mode="view" />} />
        {/* SCR-59: Edit Bill */}
        <Route path="/landlord/billing/:id/edit"      element={<BillDetailManagementPage mode="edit" />} />
        {/* SCR-60: Payment Verification */}
        <Route path="/landlord/payments"              element={<PaymentVerificationPage />} />
        {/* SCR-61: Payment Detail */}
        <Route path="/landlord/payments/:id"          element={<PaymentDetailPage />} />

        {/* SCR-62: Utility Dashboard */}
        <Route path="/landlord/utilities"             element={<UtilityDashboardPage />} />
        {/* SCR-63: Electricity Meter Entry */}
        <Route path="/landlord/utilities/electricity" element={<MeterEntryPage utilityType="ELECTRICITY" />} />
        {/* SCR-64: Water Meter Entry */}
        <Route path="/landlord/utilities/water"       element={<MeterEntryPage utilityType="WATER" />} />
        {/* SCR-65: Utility Pricing */}
        <Route path="/landlord/utilities/pricing"     element={<UtilityPricingPage />} />

        {/* SCR-66: Maintenance Management */}
        <Route path="/landlord/maintenance"           element={<MaintenanceManagementPage />} />
        {/* SCR-67: Maintenance Ticket Detail */}
        <Route path="/landlord/maintenance/:id"       element={<MaintenanceTicketManagementPage />} />

        {/* SCR-68: Revenue Report */}
        <Route path="/landlord/reports/revenue"       element={<RevenueReportPage />} />
        {/* SCR-69: Occupancy Report */}
        <Route path="/landlord/reports/occupancy"     element={<OccupancyReportPage />} />
        {/* SCR-70: Debt Report */}
        <Route path="/landlord/reports/debt"          element={<DebtReportPage />} />

        {/* ──────────────────── ADMIN PORTAL ──────────────────── */}
        {/* SCR-71: Admin Dashboard */}
        <Route path="/admin/dashboard"              element={<AdminDashboardPage />} />
        <Route path="/admin"                        element={<Navigate to="/admin/dashboard" replace />} />

        {/* SCR-72: User Management */}
        <Route path="/admin/users"                  element={<UserManagementPage />} />
        {/* SCR-73: User Detail */}
        <Route path="/admin/users/:id"              element={<UserDetailAdminPage />} />
        {/* SCR-74: Edit User */}
        <Route path="/admin/users/:id/edit"         element={<EditUserAdminPage />} />

        {/* SCR-75: Content Moderation */}
        <Route path="/admin/moderation"             element={<ContentModerationPage />} />

        {/* SCR-76: Complaint Management */}
        <Route path="/admin/complaints"             element={<ComplaintManagementPage />} />
        {/* SCR-77: Complaint Detail */}
        <Route path="/admin/complaints/:id"         element={<ComplaintDetailPage />} />

        {/* SCR-78: System Analytics */}
        <Route path="/admin/analytics"              element={<SystemAnalyticsPage />} />

        {/* SCR-79: Activity Logs */}
        <Route path="/admin/logs"                   element={<ActivityLogsPage />} />

        {/* SCR-80: System Settings */}
        <Route path="/admin/settings"               element={<SystemSettingsPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
