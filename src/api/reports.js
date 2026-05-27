/**
 * @fileoverview Reports API — quản lý và xét duyệt báo cáo vi phạm (dành cho admin).
 *
 * Vòng đời báo cáo:
 *   pending → reviewed (có hành động: none/warned/banned) | dismissed
 *
 * Khi reviewReport với action_taken = 'banned':
 *   Backend tự động gọi banUserAccount() với source = 'report'.
 *
 * @external GET   /admin/reports        Danh sách báo cáo (lọc, phân trang)
 * @external GET   /admin/reports/:id    Chi tiết báo cáo (kèm snapshot profile)
 * @external PATCH /admin/reports/:id    Xét duyệt báo cáo
 */

import client from './client.js'

/**
 * Lấy danh sách báo cáo với lọc theo status và phân trang.
 *
 * @param {{ status?: 'pending'|'reviewed'|'dismissed', page?: number, limit?: number }} params
 * @returns {Promise<{ total: number, page: number, limit: number, reports: object[] }>}
 * @external GET /admin/reports
 */
export const listReports = (params) =>
  client.get('/admin/reports', { params }).then((r) => r.data.data)

/**
 * Lấy chi tiết một báo cáo kèm snapshot profile tại thời điểm báo cáo.
 * Snapshot không thay đổi dù người dùng cập nhật profile sau đó.
 *
 * @param {string|number} id - ID báo cáo
 * @returns {Promise<object>} Chi tiết báo cáo với snapshotData
 * @external GET /admin/reports/:id
 */
export const getReport = (id) =>
  client.get(`/admin/reports/${id}`).then((r) => r.data.data)

/**
 * Xét duyệt báo cáo: cập nhật status và thực hiện hành động với người bị báo cáo.
 *
 * @param {string|number} id
 * @param {{
 *   status: 'reviewed'|'dismissed',
 *   action_taken: 'none'|'warned'|'banned',
 *   admin_note?: string
 * }} body
 * @returns {Promise<{ success: boolean }>}
 * @external PATCH /admin/reports/:id
 */
export const reviewReport = (id, body) =>
  client.patch(`/admin/reports/${id}`, body).then((r) => r.data.data)
