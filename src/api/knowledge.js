/**
 * @fileoverview Knowledge API — CRUD và embedding cho tài liệu Knowledge Base chatbot.
 *
 * Tất cả endpoint đều yêu cầu JWT + role admin (thêm tự động bởi client interceptor).
 *
 * Luồng embedding:
 *   1. createDocument / updateDocument → backend enqueue BullMQ job.
 *   2. Worker embed gọi Gemini embedding-001 → lưu vào `embedding` field.
 *   3. Document sẵn sàng cho RAG khi embedding_updated_at != null.
 *   4. reembedDocument: force re-embed (dùng khi embedding lỗi).
 *
 * @external GET    /admin/knowledge          Danh sách tài liệu
 * @external GET    /admin/knowledge/:id      Chi tiết tài liệu
 * @external POST   /admin/knowledge          Tạo tài liệu mới
 * @external PUT    /admin/knowledge/:id      Cập nhật tài liệu
 * @external DELETE /admin/knowledge/:id      Soft-delete tài liệu
 * @external POST   /admin/knowledge/:id/reembed  Force re-embed
 */

import client from './client.js'

/**
 * Lấy danh sách tài liệu KB với tìm kiếm, lọc và phân trang.
 *
 * @param {{ search?: string, category?: string, page?: number, limit?: number }} params
 * @returns {Promise<{ total, page, limit, totalPages, documents: object[] }>}
 * @external GET /admin/knowledge
 */
export const listDocuments = (params) =>
  client.get('/admin/knowledge', { params }).then((r) => r.data.data)

/**
 * Lấy nội dung đầy đủ của một tài liệu KB.
 *
 * @param {string} id - ID tài liệu
 * @returns {Promise<object>} Document với đầy đủ các trường (kể cả content)
 * @external GET /admin/knowledge/:id
 */
export const getDocument = (id) =>
  client.get(`/admin/knowledge/${id}`).then((r) => r.data.data)

/**
 * Tạo tài liệu mới và tự động enqueue job embed bất đồng bộ.
 * Tài liệu chưa embed sẽ không được chatbot sử dụng.
 *
 * @param {{ title: string, content: string, category?: string }} body
 * @returns {Promise<object>} Document vừa tạo (embedding = null)
 * @external POST /admin/knowledge
 */
export const createDocument = (body) =>
  client.post('/admin/knowledge', body).then((r) => r.data.data)

/**
 * Cập nhật tài liệu. Nếu title hoặc content thay đổi → reset embedding + re-embed.
 *
 * @param {string} id
 * @param {{ title?: string, content?: string, category?: string }} body
 * @returns {Promise<object>} Document đã cập nhật
 * @external PUT /admin/knowledge/:id
 */
export const updateDocument = (id, body) =>
  client.put(`/admin/knowledge/${id}`, body).then((r) => r.data.data)

/**
 * Soft-delete tài liệu (is_active = false).
 * Tài liệu bị ẩn với chatbot nhưng dữ liệu vẫn còn trong DB để audit.
 *
 * @param {string} id
 * @returns {Promise<{ success: boolean }>}
 * @external DELETE /admin/knowledge/:id
 */
export const deleteDocument = (id) =>
  client.delete(`/admin/knowledge/${id}`).then((r) => r.data.data)

/**
 * Force re-embed tài liệu (dùng khi embedding lỗi hoặc cần refresh vector).
 * Đặt embedding = null → enqueue job embed mới → invalidate Redis cache.
 *
 * @param {string} id
 * @returns {Promise<{ success: boolean }>}
 * @external POST /admin/knowledge/:id/reembed
 */
export const reembedDocument = (id) =>
  client.post(`/admin/knowledge/${id}/reembed`).then((r) => r.data.data)
