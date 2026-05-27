/**
 * @fileoverview PrivateRoute — component bảo vệ các route yêu cầu đăng nhập admin.
 *
 * Nếu admin chưa xác thực (chưa đăng nhập, token hết hạn, hoặc không có quyền admin):
 *   → Redirect về /login (replace để không thêm vào history stack).
 *
 * Nếu đã xác thực hợp lệ:
 *   → Render children bình thường.
 *
 * Dùng trong App.jsx để bọc tất cả các page cần bảo vệ:
 *   <Route path="/documents" element={<PrivateRoute><DocumentListPage /></PrivateRoute>} />
 */

import { Navigate } from 'react-router-dom'
import { isAdminAuthenticated } from '../hooks/useAuth.js'

/**
 * Route guard component — chỉ render children khi admin đã xác thực hợp lệ.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {React.ReactNode} children hoặc <Navigate to="/login" replace />
 */
export default function PrivateRoute({ children }) {
  // isAdminAuthenticated kiểm tra JWT: tồn tại + chưa hết hạn + role = 'admin'
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}
