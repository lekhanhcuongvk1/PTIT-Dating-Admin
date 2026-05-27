/**
 * @fileoverview Users API — liệt kê và kiểm duyệt tài khoản người dùng.
 *
 * Dùng trong UserListPage để hiển thị bảng người dùng và thực hiện ban/unban nhanh.
 * (Khác moderation.js: file này không có getUserModeration — chỉ quản lý danh sách)
 *
 * @external GET  /admin/users             Danh sách người dùng (lọc, tìm kiếm, phân trang)
 * @external POST /admin/users/:id/ban     Khóa tài khoản từ danh sách
 * @external POST /admin/users/:id/unban   Mở khóa tài khoản từ danh sách
 */

import client from './client.js'

/**
 * Lấy danh sách người dùng với tìm kiếm và phân trang.
 *
 * @param {{
 *   status?: 'active'|'banned'|'suspended'|'all',
 *   q?: string,
 *   page?: number,
 *   limit?: number
 * }} params
 *   q: tìm theo email, outlookEmail, studentId, displayName
 * @returns {Promise<{ total: number, page: number, limit: number, users: object[] }>}
 * @external GET /admin/users
 */
export const listUsers = (params) =>
  client.get('/admin/users', { params }).then((r) => r.data.data)

/**
 * Khóa tài khoản người dùng từ màn hình danh sách (ban nhanh).
 *
 * @param {string} userId
 * @param {{ source?: string, reason?: string }} [body]
 * @returns {Promise<{ success: boolean, userId: string, status: 'banned' }>}
 * @external POST /admin/users/:id/ban
 */
export const banUser = (userId, body = {}) =>
  client.post(`/admin/users/${userId}/ban`, body).then((r) => r.data.data)

/**
 * Mở khóa tài khoản người dùng từ màn hình danh sách (unban nhanh).
 *
 * @param {string} userId
 * @param {{ source?: string, reason?: string }} [body]
 * @returns {Promise<{ success: boolean, userId: string, status: 'active' }>}
 * @external POST /admin/users/:id/unban
 */
export const unbanUser = (userId, body = {}) =>
  client.post(`/admin/users/${userId}/unban`, body).then((r) => r.data.data)
