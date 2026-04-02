import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { useAuthStore } from './hooks/useAuthStore';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AppointmentsCalendar } from './pages/appointments/AppointmentsCalendar';
import { AppointmentDetail } from './pages/appointments/AppointmentDetail';
import { PatientDirectory } from './pages/patients/PatientDirectory';
import { NewPatient } from './pages/patients/NewPatient';
import { PatientProfile } from './pages/patients/PatientProfile';
import { PatientNotes } from './pages/patients/PatientNotes';
import { BillingList } from './pages/billing/BillingList';
import { NewInvoice } from './pages/billing/NewInvoice';
import { InvoiceDetails } from './pages/billing/InvoiceDetails';
import { EditInvoice } from './pages/billing/EditInvoice';
import { InventoryList } from './pages/inventory/InventoryList';
import { LabCases } from './pages/inventory/LabCases';
import { ReportsView } from './pages/reports/ReportsView';
import { SettingsView } from './pages/settings/SettingsView';

// Layouts
const DashboardLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Protect routes - redirect to login if no token
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

const AuthLayout = () => {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <Outlet />
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          <Route path="appointments">
            <Route index element={<AppointmentsCalendar />} />
            <Route path=":id" element={<AppointmentDetail />} />
          </Route>

          <Route path="patients">
            <Route index element={<PatientDirectory />} />
            <Route path="new" element={<NewPatient />} />
            <Route path=":id" element={<PatientProfile />} />
            <Route path=":id/notes" element={<PatientNotes />} />
          </Route>

          <Route path="billing">
            <Route index element={<BillingList />} />
            <Route path="new" element={<NewInvoice />} />
            <Route path=":id" element={<InvoiceDetails />} />
            <Route path="edit/:id" element={<EditInvoice />} />
          </Route>

          <Route path="inventory">
            <Route index element={<InventoryList />} />
            <Route path="lab-cases" element={<LabCases />} />
          </Route>

          <Route path="reports" element={<ReportsView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
