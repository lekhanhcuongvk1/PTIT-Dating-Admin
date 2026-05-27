/**
 * @fileoverview Axios client dùng chung cho toàn bộ API calls của Admin Panel.
 *
 * Cấu hình:
 *   - baseURL: lấy từ biến môi trường VITE_API_BASE_URL (fallback '/api').
 *
 * Interceptors:
 *   - Request: tự động đính kèm JWT từ localStorage (key: 'admin_token')
 *     vào header Authorization: Bearer <token>.
 *   - Response: khi nhận 401/403 → xóa token cũ → redirect về trang login.
 *     Đảm bảo session hết hạn được xử lý tự động mà không cần check thủ công.
 */

import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

/**
 * Request interceptor: thêm JWT vào mọi request đến backend.
 * Token được lưu sau khi đăng nhập thành công (saveToken trong useAuth.js).
 */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * Response interceptor: xử lý lỗi xác thực toàn cục.
 * - 401 Unauthorized: token hết hạn hoặc không hợp lệ.
 * - 403 Forbidden: token hợp lệ nhưng không có quyền admin.
 * Cả 2 trường hợp đều xóa token và redirect về /login.
 */
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default client
