/**
 * @fileoverview App — root component của Admin Panel (React + Vite).
 *
 * Routing structure:
 *
 *   Public routes (không cần đăng nhập):
 *     /login          — LoginPage (đăng nhập admin local)
 *     /oauth/callback — OAuthCallbackPage (xử lý Microsoft OAuth callback)
 *
 *   Private routes (yêu cầu JWT + role admin, bọc trong PrivateRoute):
 *     /documents         — DocumentListPage (danh sách tài liệu KB)
 *     /documents/new     — DocumentFormPage (tạo tài liệu mới)
 *     /documents/:id/edit — DocumentFormPage (chỉnh sửa tài liệu)
 *     /reports           — ReportListPage (danh sách báo cáo vi phạm)
 *     /reports/:id       — ReportDetailPage (chi tiết + xét duyệt báo cáo)
 *     /users             — UserListPage (quản lý tài khoản người dùng)
 *
 *   Fallback: / và mọi path không khớp → redirect về /documents
 *
 * DocumentFormPage được dùng cho cả tạo mới (/documents/new)
 * và chỉnh sửa (/documents/:id/edit) — phân biệt qua useParams().id.
 */

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
