import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OAuthCallbackPage from './pages/OAuthCallbackPage.jsx'
import DocumentListPage from './pages/DocumentListPage.jsx'
import DocumentFormPage from './pages/DocumentFormPage.jsx'
import ReportListPage from './pages/ReportListPage.jsx'
import ReportDetailPage from './pages/ReportDetailPage.jsx'
import UserListPage from './pages/UserListPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

        <Route
          path="/documents"
          element={<PrivateRoute><DocumentListPage /></PrivateRoute>}
        />
        <Route
          path="/documents/new"
          element={<PrivateRoute><DocumentFormPage /></PrivateRoute>}
        />
        <Route
          path="/documents/:id/edit"
          element={<PrivateRoute><DocumentFormPage /></PrivateRoute>}
        />

        <Route
          path="/reports"
          element={<PrivateRoute><ReportListPage /></PrivateRoute>}
        />
        <Route
          path="/reports/:id"
          element={<PrivateRoute><ReportDetailPage /></PrivateRoute>}
        />

        <Route
          path="/users"
          element={<PrivateRoute><UserListPage /></PrivateRoute>}
        />

        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="*" element={<Navigate to="/documents" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
