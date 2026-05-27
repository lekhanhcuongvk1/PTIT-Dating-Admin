/**
 * @fileoverview useAuth — tiện ích xác thực cho Admin Panel.
 *
 * Không dùng React Context hay hook, chỉ là pure functions thao tác với localStorage.
 * JWT được lưu với key 'admin_token'.
 *
 * Kiểm tra xác thực (isAdminAuthenticated):
 *   1. Có token trong localStorage.
 *   2. Token giải mã được (base64 hợp lệ).
 *   3. Token chưa hết hạn (exp claim > now).
 *   4. role = 'admin'.
 */

/**
 * Giải mã JWT để đọc payload (không verify signature — chỉ dùng phía client).
 * Nếu token không hợp lệ hoặc base64 lỗi, trả về null.
 *
 * @param {string} token - JWT string (3 phần cách nhau bởi dấu chấm)
 * @returns {object|null} Payload object hoặc null
 */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

/**
 * Lấy JWT admin hiện tại từ localStorage.
 *
 * @returns {string|null} Token string hoặc null nếu chưa đăng nhập
 */
export function getAdminToken() {
  return localStorage.getItem('admin_token')
}

/**
 * Kiểm tra xem admin session có hợp lệ không.
 *
 * Điều kiện hợp lệ: token tồn tại + giải mã được + chưa hết hạn + role = 'admin'.
 * Nếu token hết hạn, tự động xóa khỏi localStorage.
 *
 * Dùng bởi PrivateRoute để quyết định redirect về /login hay không.
 *
 * @returns {boolean}
 */
export function isAdminAuthenticated() {
  const token = getAdminToken()
  if (!token) return false
  const payload = decodeJwt(token)
  if (!payload) return false
  // Kiểm tra token hết hạn (exp là Unix timestamp tính bằng giây)
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    localStorage.removeItem('admin_token')
    return false
  }
  return payload.role === 'admin'
}

/**
 * Lưu JWT vào localStorage sau khi đăng nhập thành công.
 *
 * @param {string} token - JWT nhận từ backend
 */
export function saveToken(token) {
  localStorage.setItem('admin_token', token)
}

/**
 * Xóa JWT khỏi localStorage (đăng xuất).
 * Gọi trước khi navigate về /login để đảm bảo không có token cũ.
 */
export function logout() {
  localStorage.removeItem('admin_token')
}
