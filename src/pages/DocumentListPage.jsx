import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { listDocuments, deleteDocument, reembedDocument } from '../api/knowledge.js'

const CATEGORIES = ['', 'Hẹn hò', 'An toàn', 'Tính năng app', 'Quy định', 'Lời khuyên', 'Khác']

const s = {
  toolbar: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  input: {
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 14,
    minWidth: 220,
  },
  select: {
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '8px 14px',
    fontSize: 14,
    background: '#fff',
  },
  btnPrimary: {
    background: '#1a1a2e',
    color: '#fff',
    borderRadius: 8,
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: 600,
    marginLeft: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  th: {
    background: '#f9fafb',
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '14px 16px',
    fontSize: 14,
    borderBottom: '1px solid #f3f4f6',
    color: '#374151',
    verticalAlign: 'middle',
  },
  badgeEmbedded: {
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: 99,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block',
  },
  badgePending: {
    background: '#fef3c7',
    color: '#92400e',
    borderRadius: 99,
    padding: '3px 10px',
    fontSize: 12,
    fontWeight: 600,
    display: 'inline-block',
  },
  btnEdit: {
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 13,
    fontWeight: 500,
    marginRight: 6,
  },
  btnDelete: {
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 13,
    fontWeight: 500,
  },
  btnReembed: {
    background: '#f0fdf4',
    color: '#15803d',
    borderRadius: 6,
    padding: '5px 12px',
    fontSize: 13,
    fontWeight: 500,
    marginRight: 6,
  },
  pagination: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
    fontSize: 14,
  },
  pageBtn: {
    border: '1px solid #d1d5db',
    borderRadius: 6,
    padding: '6px 12px',
    background: '#fff',
    cursor: 'pointer',
  },
  pageBtnActive: {
    background: '#1a1a2e',
    color: '#fff',
    border: '1px solid #1a1a2e',
  },
  empty: {
    textAlign: 'center',
    padding: '40px 0',
    color: '#9ca3af',
    fontSize: 14,
  },
}

/**
 * Trang danh sách tài liệu Knowledge Base chatbot.
 *
 * Tính năng:
 *   - Tìm kiếm full-text theo tiêu đề và nội dung.
 *   - Lọc theo danh mục (category).
 *   - Phân trang (15 items/trang).
 *   - Hiển thị trạng thái embedding (✓ Đã nhúng / ⏳ Đang xử lý).
 *   - Sửa, xóa, và force re-embed tài liệu.
 *
 * Tìm kiếm: commit khi submit form (không search theo từng keystroke).
 * searchInput là giá trị tạm thời trong input; search là giá trị đã commit.
 *
 * Embedding status:
 *   - embedding_updated_at != null → đã embed, chatbot có thể dùng.
 *   - embedding_updated_at = null  → chưa embed (pending) hoặc đang xử lý.
 */
export default function DocumentListPage() {
  const navigate = useNavigate()

  /** Danh sách tài liệu của trang hiện tại */
  const [docs, setDocs] = useState([])

  /** Tổng số tài liệu khớp filter (không phụ thuộc page) */
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)

  /** Từ khóa tìm kiếm đã commit (submit form) */
  const [search, setSearch] = useState('')

  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)

  /** Giá trị tạm thời trong ô input (chưa commit) */
  const [searchInput, setSearchInput] = useState('')

  /**
   * Fetch danh sách tài liệu từ API theo các filter hiện tại.
   * Dùng useCallback để tránh tạo lại function mỗi render,
   * và để useEffect có thể track dependency chính xác.
   */
  const fetchDocs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listDocuments({ search, category: category || undefined, page, limit: 15 })
      setDocs(data.documents || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [search, category, page])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  /**
   * Commit từ khóa tìm kiếm và reset về trang 1.
   * Tách riêng searchInput và search để tránh gọi API theo từng keystroke.
   */
  function handleSearchSubmit(e) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  /**
   * Soft-delete tài liệu sau khi confirm.
   * Tài liệu bị ẩn với chatbot nhưng dữ liệu vẫn còn trong DB.
   *
   * @param {{ id: string, title: string }} doc
   */
  async function handleDelete(doc) {
    if (!confirm(`Xoá tài liệu "${doc.title}"?\nHành động này không thể hoàn tác.`)) return
    try {
      await deleteDocument(doc.id)
      fetchDocs()
    } catch (err) {
      alert(err.response?.data?.message || 'Xoá thất bại')
    }
  }

  /**
   * Force re-embed tài liệu (dùng khi embedding lỗi hoặc cần refresh vector).
   * Đặt embedding = null → enqueue job Gemini embedding mới.
   *
   * @param {{ id: string }} doc
   */
  async function handleReembed(doc) {
    try {
      await reembedDocument(doc.id)
      fetchDocs()
    } catch (err) {
      alert(err.response?.data?.message || 'Re-embed thất bại')
    }
  }

  /**
   * Format ISO date string thành dd/mm/yyyy (locale vi-VN).
   * @param {string|null} iso
   * @returns {string}
   */
  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <Layout title={`Tài liệu Knowledge Base (${total})`}>
      <div style={s.toolbar}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8 }}>
          <input
            style={s.input}
            placeholder="Tìm kiếm tiêu đề, nội dung..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" style={{ ...s.btnPrimary, marginLeft: 0 }}>Tìm</button>
        </form>

        <select
          style={s.select}
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c || 'Tất cả danh mục'}</option>
          ))}
        </select>

        <button style={s.btnPrimary} onClick={() => navigate('/documents/new')}>
          + Thêm tài liệu
        </button>
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={s.th}>Tiêu đề</th>
            <th style={s.th}>Danh mục</th>
            <th style={s.th}>Trạng thái</th>
            <th style={s.th}>Ngày tạo</th>
            <th style={s.th}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} style={s.empty}>Đang tải...</td></tr>
          ) : docs.length === 0 ? (
            <tr><td colSpan={5} style={s.empty}>Chưa có tài liệu nào</td></tr>
          ) : (
            docs.map((doc) => (
              <tr key={doc.id}>
                <td style={s.td}>
                  <strong>{doc.title}</strong>
                </td>
                <td style={s.td}>{doc.category || '—'}</td>
                <td style={s.td}>
                  {doc.embedding_updated_at
                    ? <span style={s.badgeEmbedded}>✓ Đã nhúng</span>
                    : <span style={s.badgePending}>⏳ Đang xử lý</span>
                  }
                </td>
                <td style={s.td}>{formatDate(doc.created_at)}</td>
                <td style={s.td}>
                  {!doc.embedding_updated_at && (
                    <button style={s.btnReembed} onClick={() => handleReembed(doc)}>
                      ↺ Nhúng lại
                    </button>
                  )}
                  <button style={s.btnEdit} onClick={() => navigate(`/documents/${doc.id}/edit`)}>
                    Sửa
                  </button>
                  <button style={s.btnDelete} onClick={() => handleDelete(doc)}>
                    Xoá
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={s.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <button
                key={p}
                style={{ ...s.pageBtn, ...(p === page ? s.pageBtnActive : {}) }}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
          <button
            style={s.pageBtn}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >→</button>
          <span style={{ color: '#6b7280' }}>Trang {page} / {totalPages}</span>
        </div>
      )}
    </Layout>
  )
}
