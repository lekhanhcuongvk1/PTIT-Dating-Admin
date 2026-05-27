/**
 * @fileoverview Auth API — các hàm gọi API xác thực cho admin panel.
 *
 * Hỗ trợ 2 phương thức đăng nhập:
 *   1. Microsoft OAuth (Outlook): getLoginUrl → redirect → exchangeCode
 *      (dành cho tài khoản @s.ptit.edu.vn với role admin)
 *   2. Local admin: adminLogin bằng email + password
 *      (dành cho tài khoản admin được tạo bởi script seed backend)
 *
 * Sau khi đăng nhập thành công, lưu JWT bằng saveToken() từ useAuth.js.
 *
 * @external POST /auth/admin/login  Đăng nhập admin local
 * @external GET  /auth/outlook/url  Lấy URL redirect Microsoft OAuth
 * @external POST /auth/outlook/exchange  Đổi authorization code lấy JWT
 */

import client from './client.js'

/**
 * Lấy URL redirect Microsoft OAuth để đăng nhập bằng tài khoản Outlook.
 * Admin được redirect tới URL này, sau khi xác thực Microsoft sẽ
 * redirect về /oauth/callback?code=... để xử lý tiếp.
 *
 * @returns {Promise<string>} URL redirect Microsoft
 * @external GET /auth/outlook/url
 */
export const getLoginUrl = () =>
  client.get('/auth/outlook/url').then((r) => r.data.redirect_url)

/**
 * Đổi authorization code (từ Microsoft OAuth callback) lấy JWT của app.
 * Decode JWT sau khi nhận để kiểm tra role = 'admin' trước khi lưu.
 *
 * @param {string} code - Authorization code từ query string ?code=...
 * @returns {Promise<{ token: string }>}
 * @external POST /auth/outlook/exchange
 */
export const exchangeCode = (code) =>
  client.post('/auth/outlook/exchange', { code }).then((r) => r.data)

/**
 * Đăng nhập bằng email + password (tài khoản admin local).
 * Tài khoản mặc định được tạo bởi script seed ở backend.
 *
 * @param {string} email    - Email đăng nhập (ví dụ: admin@ptit.local)
 * @param {string} password - Mật khẩu
 * @returns {Promise<{ token: string }>}
 * @external POST /auth/admin/login
 */
export const adminLogin = (email, password) =>
  client.post('/auth/admin/login', { email, password }).then((r) => r.data)
