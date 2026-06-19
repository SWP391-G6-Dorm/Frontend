import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// ── Route Guards ─────────────────────────────────────────────────────────────
import ProtectedRoute  from './components/ProtectedRoute';
import GuestRoute      from './components/GuestRoute';

// ── Public (SCR-01 → SCR-10) ─────────────────────────────────────────────────
import LandingPage                from './pages/public/LandingPage';
import LoginPage                  from './pages/public/LoginPage';
import RegisterPage               from './pages/public/RegisterPage';
import VerifyEmailPage            from './pages/public/VerifyEmailPage';
import ForgotPasswordPage         from './pages/public/ForgotPasswordPage';
import ResetPasswordPage          from './pages/public/ResetPasswordPage';
import RoomListingPage            from './pages/public/RoomListingPage';
import SearchResultsPage          from './pages/public/SearchResultsPage';
import RoomDetailPage             from './pages/public/RoomDetailPage';
import AvailabilityCalendarPage   from './pages/public/AvailabilityCalendarPage';
import AboutPage                  from './pages/public/AboutPage';
import UnauthorizedPage           from './pages/public/UnauthorizedPage';

// ── Customer Portal ───────────────────────────────────────────────────────────
import CustomerDashboardPage      from './pages/customer/CustomerDashboardPage';
import { UserProfilePage, EditProfilePage, ChangePasswordPage }
                                  from './pages/customer/ProfilePages';
import { NotificationCenterPage, NotificationDetailPage }
                                  from './pages/customer/NotificationPages';
import { BookingFormPage, BookingListPage, BookingDetailPage, BookingCancellationPage }
                                  from './pages/customer/BookingPages';
import { ContractListPage, ContractDetailPage }
                                  from './pages/customer/ContractPages';
import { DepositPaymentPage, RemainingPaymentPage, PaymentHistoryPage, ReceiptUploadPage }
                                  from './pages/customer/PaymentPages';
import { MaintenanceListPage, CreateMaintenancePage, MaintenanceDetailPage }
                                  from './pages/customer/MaintenancePages';
import { ReviewRatingPage, MyReviewsPage }
                                  from './pages/customer/ReviewPages';

// ── Manager Portal ────────────────────────────────────────────────────────────
import ManagerDashboardPage       from './pages/manager/ManagerDashboardPage';
import { PropertyListPage, PropertyDetailPage, AddPropertyPage, EditPropertyPage }
                                  from './pages/manager/PropertyPages';
import {
  StructureTreePage, FloorManagementPage,
  RoomListPage, RoomDetailMgmtPage, AddRoomPage, EditRoomPage,
  RoomGalleryPage, RoomStatusPage,
}                                 from './pages/manager/RoomManagementPages';
import {
  BookingMgmtListPage, BookingMgmtDetailPage,
  PaymentListPage, PaymentVerificationPage, PaymentDetailPage,
  ContractMgmtListPage, ContractMgmtDetailPage, ResendContractPage,
}                                 from './pages/manager/BookingContractPaymentPages';
import {
  CustomerListPage, CustomerDetailPage,
  ComplaintListPage, ComplaintDetailPage,
  MaintenanceMgmtListPage, MaintenanceMgmtDetailPage,
  ReportsDashboardPage, RevenueReportPage, OccupancyReportPage,
  ActivityLogPage, ReviewMgmtPage,
}                                 from './pages/manager/AdminPages';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ─────────────── PUBLIC — Ai cũng vào được ─────────────── */}
        <Route path="/"                       element={<LandingPage />} />
        <Route path="/rooms"                  element={<RoomListingPage />} />
        <Route path="/search"                 element={<SearchResultsPage />} />
        <Route path="/rooms/:id"              element={<RoomDetailPage />} />
        <Route path="/rooms/:id/calendar"     element={<AvailabilityCalendarPage />} />
        <Route path="/about"                  element={<AboutPage />} />
        <Route path="/unauthorized"           element={<UnauthorizedPage />} />

        {/* ─────────────── GUEST ONLY — Redirect nếu đã login ─────────────── */}
        <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"        element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify-email"    element={<GuestRoute><VerifyEmailPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password"  element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

        {/* ─────────────── CUSTOMER (SCR-11 to SCR-31) ─────────────── */}
        <Route path="/customer" element={<Navigate to="/customer/dashboard" replace />} />

        <Route path="/customer/dashboard"
          element={<ProtectedRoute role="CUSTOMER"><CustomerDashboardPage /></ProtectedRoute>} />

        {/* Profile (SCR-11,12,13) */}
        <Route path="/customer/profile"
          element={<ProtectedRoute role="CUSTOMER"><UserProfilePage /></ProtectedRoute>} />
        <Route path="/customer/profile/edit"
          element={<ProtectedRoute role="CUSTOMER"><EditProfilePage /></ProtectedRoute>} />
        <Route path="/customer/profile/change-password"
          element={<ProtectedRoute role="CUSTOMER"><ChangePasswordPage /></ProtectedRoute>} />

        {/* Notifications (SCR-14,15) */}
        <Route path="/customer/notifications"
          element={<ProtectedRoute role="CUSTOMER"><NotificationCenterPage /></ProtectedRoute>} />
        <Route path="/customer/notifications/:id"
          element={<ProtectedRoute role="CUSTOMER"><NotificationDetailPage /></ProtectedRoute>} />

        {/* Bookings (SCR-17,18,19,20) */}
        <Route path="/customer/bookings"
          element={<ProtectedRoute role="CUSTOMER"><BookingListPage /></ProtectedRoute>} />
        <Route path="/request-booking/:roomId"
          element={<ProtectedRoute role="CUSTOMER"><BookingFormPage /></ProtectedRoute>} />
        <Route path="/customer/bookings/:id"
          element={<ProtectedRoute role="CUSTOMER"><BookingDetailPage /></ProtectedRoute>} />
        <Route path="/customer/bookings/:id/cancel"
          element={<ProtectedRoute role="CUSTOMER"><BookingCancellationPage /></ProtectedRoute>} />

        {/* Contracts (SCR-25,26) */}
        <Route path="/customer/contracts"
          element={<ProtectedRoute role="CUSTOMER"><ContractListPage /></ProtectedRoute>} />
        <Route path="/customer/contracts/:id"
          element={<ProtectedRoute role="CUSTOMER"><ContractDetailPage /></ProtectedRoute>} />

        {/* Payments (SCR-21,22,23,24) */}
        <Route path="/customer/payments"
          element={<ProtectedRoute role="CUSTOMER"><PaymentHistoryPage /></ProtectedRoute>} />
        <Route path="/customer/payments/:id/pay/deposit"
          element={<ProtectedRoute role="CUSTOMER"><DepositPaymentPage /></ProtectedRoute>} />
        <Route path="/customer/payments/:id/pay"
          element={<ProtectedRoute role="CUSTOMER"><DepositPaymentPage /></ProtectedRoute>} />
        <Route path="/customer/payments/:id/remaining"
          element={<ProtectedRoute role="CUSTOMER"><RemainingPaymentPage /></ProtectedRoute>} />
        <Route path="/customer/payments/:id/receipt"
          element={<ProtectedRoute role="CUSTOMER"><ReceiptUploadPage /></ProtectedRoute>} />

        {/* Maintenance (SCR-27,28,29) */}
        <Route path="/customer/maintenance"
          element={<ProtectedRoute role="CUSTOMER"><MaintenanceListPage /></ProtectedRoute>} />
        <Route path="/customer/maintenance/create"
          element={<ProtectedRoute role="CUSTOMER"><CreateMaintenancePage /></ProtectedRoute>} />
        <Route path="/customer/maintenance/:id"
          element={<ProtectedRoute role="CUSTOMER"><MaintenanceDetailPage /></ProtectedRoute>} />

        {/* Reviews (SCR-30,31) */}
        <Route path="/customer/reviews"
          element={<ProtectedRoute role="CUSTOMER"><MyReviewsPage /></ProtectedRoute>} />
        <Route path="/customer/reviews/create"
          element={<ProtectedRoute role="CUSTOMER"><ReviewRatingPage /></ProtectedRoute>} />

        {/* ─────────────── MANAGER (SCR-32 to SCR-65) ─────────────── */}
        <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />

        <Route path="/manager/dashboard"
          element={<ProtectedRoute role="MANAGER"><ManagerDashboardPage /></ProtectedRoute>} />

        {/* Profile (SCR-11,12,13) — shared with customer */}
        <Route path="/manager/profile"
          element={<ProtectedRoute role="MANAGER"><UserProfilePage /></ProtectedRoute>} />
        <Route path="/manager/profile/edit"
          element={<ProtectedRoute role="MANAGER"><EditProfilePage /></ProtectedRoute>} />
        <Route path="/manager/profile/change-password"
          element={<ProtectedRoute role="MANAGER"><ChangePasswordPage /></ProtectedRoute>} />

        {/* Properties (SCR-33,34,35,36) */}
        <Route path="/manager/properties"
          element={<ProtectedRoute role="MANAGER"><PropertyListPage /></ProtectedRoute>} />
        <Route path="/manager/properties/add"
          element={<ProtectedRoute role="MANAGER"><AddPropertyPage /></ProtectedRoute>} />
        <Route path="/manager/properties/:id"
          element={<ProtectedRoute role="MANAGER"><PropertyDetailPage /></ProtectedRoute>} />
        <Route path="/manager/properties/:id/edit"
          element={<ProtectedRoute role="MANAGER"><EditPropertyPage /></ProtectedRoute>} />

        {/* Structure (SCR-37,38) */}
        <Route path="/manager/structure"
          element={<ProtectedRoute role="MANAGER"><StructureTreePage /></ProtectedRoute>} />
        <Route path="/manager/floors"
          element={<ProtectedRoute role="MANAGER"><FloorManagementPage /></ProtectedRoute>} />

        {/* Rooms (SCR-39 to 44) */}
        <Route path="/manager/rooms"
          element={<ProtectedRoute role="MANAGER"><RoomListPage /></ProtectedRoute>} />
        <Route path="/manager/rooms/add"
          element={<ProtectedRoute role="MANAGER"><AddRoomPage /></ProtectedRoute>} />
        <Route path="/manager/rooms/:id"
          element={<ProtectedRoute role="MANAGER"><RoomDetailMgmtPage /></ProtectedRoute>} />
        <Route path="/manager/rooms/:id/edit"
          element={<ProtectedRoute role="MANAGER"><EditRoomPage /></ProtectedRoute>} />
        <Route path="/manager/rooms/:id/gallery"
          element={<ProtectedRoute role="MANAGER"><RoomGalleryPage /></ProtectedRoute>} />
        <Route path="/manager/rooms/:id/status"
          element={<ProtectedRoute role="MANAGER"><RoomStatusPage /></ProtectedRoute>} />

        {/* Bookings (SCR-45,46) */}
        <Route path="/manager/bookings"
          element={<ProtectedRoute role="MANAGER"><BookingMgmtListPage /></ProtectedRoute>} />
        <Route path="/manager/bookings/:id"
          element={<ProtectedRoute role="MANAGER"><BookingMgmtDetailPage /></ProtectedRoute>} />

        {/* Payments (SCR-47,48,49) */}
        <Route path="/manager/payments"
          element={<ProtectedRoute role="MANAGER"><PaymentListPage /></ProtectedRoute>} />
        <Route path="/manager/payments/:id/verify"
          element={<ProtectedRoute role="MANAGER"><PaymentVerificationPage /></ProtectedRoute>} />
        <Route path="/manager/payments/:id"
          element={<ProtectedRoute role="MANAGER"><PaymentDetailPage /></ProtectedRoute>} />

        {/* Contracts (SCR-50,51,52) */}
        <Route path="/manager/contracts"
          element={<ProtectedRoute role="MANAGER"><ContractMgmtListPage /></ProtectedRoute>} />
        <Route path="/manager/contracts/:id"
          element={<ProtectedRoute role="MANAGER"><ContractMgmtDetailPage /></ProtectedRoute>} />
        <Route path="/manager/contracts/:id/resend"
          element={<ProtectedRoute role="MANAGER"><ResendContractPage /></ProtectedRoute>} />

        {/* Customers (SCR-53,54) */}
        <Route path="/manager/customers"
          element={<ProtectedRoute role="MANAGER"><CustomerListPage /></ProtectedRoute>} />
        <Route path="/manager/customers/:id"
          element={<ProtectedRoute role="MANAGER"><CustomerDetailPage /></ProtectedRoute>} />

        {/* Complaints (SCR-55,56) */}
        <Route path="/manager/complaints"
          element={<ProtectedRoute role="MANAGER"><ComplaintListPage /></ProtectedRoute>} />
        <Route path="/manager/complaints/:id"
          element={<ProtectedRoute role="MANAGER"><ComplaintDetailPage /></ProtectedRoute>} />

        {/* Maintenance (SCR-57,58) */}
        <Route path="/manager/maintenance"
          element={<ProtectedRoute role="MANAGER"><MaintenanceMgmtListPage /></ProtectedRoute>} />
        <Route path="/manager/maintenance/:id"
          element={<ProtectedRoute role="MANAGER"><MaintenanceMgmtDetailPage /></ProtectedRoute>} />

        {/* Reports (SCR-59,60,61) */}
        <Route path="/manager/reports"
          element={<ProtectedRoute role="MANAGER"><ReportsDashboardPage /></ProtectedRoute>} />
        <Route path="/manager/reports/revenue"
          element={<ProtectedRoute role="MANAGER"><RevenueReportPage /></ProtectedRoute>} />
        <Route path="/manager/reports/occupancy"
          element={<ProtectedRoute role="MANAGER"><OccupancyReportPage /></ProtectedRoute>} />
        <Route path="/manager/reports/bookings"
          element={<ProtectedRoute role="MANAGER"><ReportsDashboardPage /></ProtectedRoute>} />

        {/* Audit & Reviews (SCR-62,63) */}
        <Route path="/manager/activity-log"
          element={<ProtectedRoute role="MANAGER"><ActivityLogPage /></ProtectedRoute>} />
        <Route path="/manager/reviews"
          element={<ProtectedRoute role="MANAGER"><ReviewMgmtPage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
