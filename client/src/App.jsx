import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import Login from './pages/Login';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmployeeList = lazy(() => import('./pages/Employees/EmployeeList'));
const EmployeeForm = lazy(() => import('./pages/Employees/EmployeeForm'));
const EmployeeDetails = lazy(() => import('./pages/Employees/EmployeeDetails'));
const ImportEmployees = lazy(() => import('./pages/Employees/ImportEmployees'));
const DepartmentList = lazy(() => import('./pages/Departments/DepartmentList'));
const OrgChart = lazy(() => import('./pages/OrgChart'));
const DocumentVault = lazy(() => import('./pages/DocumentVault'));
const SyncDatabase = lazy(() => import('./pages/SyncDatabase'));
const Reports = lazy(() => import('./pages/Reports'));
const Skills = lazy(() => import('./pages/Skills'));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'));
const Attendance = lazy(() => import('./pages/Attendance'));
const ContractHistory = lazy(() => import('./pages/ContractHistory'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const MyProfile = lazy(() => import('./pages/MyProfile'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const LoginHistory = lazy(() => import('./pages/LoginHistory'));
const Recruitment = lazy(() => import('./pages/Recruitment'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-64">
    <div className="text-gray-600 text-lg">Loading...</div>
  </div>
);

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, loading, isSuperAdmin, user } = useAuth();
  if (loading)
    return <div className="min-h-screen flex items-center justify-center text-green-700">Loading TaniHR...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (requiredRole === 'admin' && !isSuperAdmin) return <Navigate to="/dashboard" />;
  return children;
};

const EditEmployeeWrapper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  return <EmployeeForm employeeId={id} onBack={() => navigate('/employees')} />;
};

const EmployeeFormNewWrapper = () => {
  const navigate = useNavigate();
  return <EmployeeForm onBack={() => navigate('/employees')} />;
};

const EmployeeDetailsWrapper = () => {
  const { id } = useParams();
  return <EmployeeDetails employeeId={id} />;
};

const LazyRoute = ({ children }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>;

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <SettingsProvider>
      <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <EmployeeList />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/new"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <EmployeeFormNewWrapper />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <EmployeeDetailsWrapper />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/edit/:id"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <EditEmployeeWrapper />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <ImportEmployees />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/departments"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <DepartmentList />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/org-chart"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <OrgChart />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <DocumentVault />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sync"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <SyncDatabase />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <Reports />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skills"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <Skills />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <ContractHistory />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leave"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <LeaveManagement />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <Attendance />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <Settings />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="admin">
              <LazyRoute>
                <Layout>
                  <UserManagement />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/login-history"
          element={
            <ProtectedRoute requiredRole="admin">
              <LazyRoute>
                <Layout>
                  <LoginHistory />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <MyProfile />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <ChangePassword />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruitment"
          element={
            <ProtectedRoute>
              <LazyRoute>
                <Layout>
                  <Recruitment />
                </Layout>
              </LazyRoute>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
      </Routes>
    </BrowserRouter>
    </SettingsProvider>
  );
}
