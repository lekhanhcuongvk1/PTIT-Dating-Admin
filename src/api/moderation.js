/**
 * @fileoverview Moderation API — ban/unban người dùng và xem lịch sử moderation.
 *
 * Dùng trong ReportDetailPage: ban/unban trực tiếp từ trang chi tiết báo cáo.
 * (Không có UI riêng cho moderation detail — chỉ dùng API)
 *
 * Khác với users.js: moderation.js tập trung vào hành động + lịch sử audit,
 * users.js tập trung vào danh sách người dùng.
 *
 * Tất cả thao tác được ghi vào bảng user_moderation_actions để audit trail.
 *
 * @external POST /admin/users/:id/ban          Khóa tài khoản
 * @external POST /admin/users/:id/unban        Mở khóa tài khoản
 * @external GET  /admin/users/:id/moderation   Lịch sử moderation
 */

import client from './client.js'

/**
 * Khóa tài khoản người dùng.
 * Cập nhật users.status = 'banned'. User không thể đăng nhập và bị loại khỏi mọi feed.
 * Thao tác được ghi vào user_moderation_actions.
 *
 * @param {string} userId
 * @param {{ reason?: string, note?: string, source?: string }} [body]
 *   source: 'manual' (admin chủ động) | 'report' (qua xét duyệt báo cáo)
 * @returns {Promise<{ success: boolean, userId: string, status: 'banned' }>}
 * @external POST /admin/users/:id/ban
 */
export const banUser = (userId, body = {}) =>
  client.post(`/admin/users/${userId}/ban`, body).then((r) => r.data.data)

/**
 * Mở khóa tài khoản người dùng.
 * Cập nhật users.status = 'active'. User có thể đăng nhập và xuất hiện lại trong feed.
 *
 * @param {string} userId
 * @param {{ reason?: string, note?: string, source?: string }} [body]
 * @returns {Promise<{ success: boolean, userId: string, status: 'active' }>}
 * @external POST /admin/users/:id/unban
 */
export const unbanUser = (userId, body = {}) =>
  client.post(`/admin/users/${userId}/unban`, body).then((r) => r.data.data)

/**
 * Lấy chi tiết moderation của một user: thông tin tài khoản + lịch sử ban/unban.
 *
 * @param {string} userId
 * @param {{ limit?: number }} [params] - Số actions trả về (default: 20)
 * @returns {Promise<{ user: object, isBanned: boolean, actions: object[] }>}
 * @external GET /admin/users/:id/moderation
 */
export const getUserModeration = (userId, params = {}) =>
  client.get(`/admin/users/${userId}/moderation`, { params }).then((r) => r.data.data)
