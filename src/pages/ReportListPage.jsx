import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { listReports } from '../api/reports.js'

const STATUS_OPTIONS = [
  { value: 'all',       label: 'Tất cả' },
  { value: 'pending',   label: 'Chờ xử lý' },
  { value: 'reviewed',  label: 'Đã xử lý' },
  { value: 'dismissed', label: 'Đã bỏ qua' },
]

const STATUS_BADGE = {
  pending:   { bg: '#FEF3C7', color: '#92400E', label: 'Chờ xử lý' },
  reviewed:  { bg: '#D1FAE5', color: '#065F46', label: 'Đã xử lý' },
  dismissed: { bg: '#F3F4F6', color: '#6B7280', label: 'Đã bỏ qua' },
}

const ACTION_BADGE = {
  none:    null,
  warned:  { bg: '#FEF9C3', color: '#713F12', label: 'Cảnh cáo' },
  banned:  { bg: '#FEE2E2', color: '#991B1B', label: 'Đã cấm' },
}

const s = {
  toolbar: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' },
  select: {
    border: '1px solid #d1d5db', borderRadius: 8,
    padding: '8px 14px', fontSize: 14, background: '#fff',
  },
  table: {
    width: '100%', borderCollapse: 'collapse',
    background: '#fff', borderRadius: 12,
    overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  th: {
    background: '#f9fafb', padding: '12px 16px', textAlign: 'left',
    fontSize: 12, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: '0.04em',
    borderBottom: '1px solid #e5e7eb',
  },
  td: { padding: '14px 16px', fontSize: 14, borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle' },
  avatar: { width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', background: '#e5e7eb' },
  userCell: { display: 'flex', alignItems: 'center', gap: 8 },
  badge: (bg, color) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: 600, background: bg, color,
  }),
  btnView: {
    background: '#1a1a2e', color: '#fff', border: 'none',
    borderRadius: 8, padding: '6px 14px', fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  },
  pagination: { display: 'flex', gap: 8, marginTop: 20, alignItems: 'center' },
  pageBtn: (active) => ({
    border: `1px solid ${active ? '#1a1a2e' : '#d1d5db'}`,
    background: active ? '#1a1a2e' : '#fff', color: active ? '#fff' : '#374151',
    borderRadius: 6, padding: '6px 12px', fontSize: 13,
    cursor: 'pointer', fontWeight: active ? 600 : 400,
  }),
}

/**
 * Trang danh sách báo cáo vi phạm từ người dùng.
 *
 * Tính năng:
 *   - Lọc theo status: Tất cả / Chờ xử lý / Đã xử lý / Đã bỏ qua.
 *   - Phân trang (20 items/trang).
 *   - Hiển thị badge status và action_taken cho mỗi báo cáo.
 *   - Bấm "Xem" → navigate tới ReportDetailPage để xét duyệt.
 *   - Nút "Làm mới" để reload danh sách.
 *
 * Badge status:
 *   pending   → vàng "Chờ xử lý"
 *   reviewed  → xanh lá "Đã xử lý"
 *   dismissed → xám "Đã bỏ qua"
 *
 * Badge action_taken:
 *   warned → vàng "Cảnh cáo"
 *   banned → đỏ "Đã cấm"
 */
export default function ReportListPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState([])

  /** Tổng số báo cáo khớp filter */
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /** Filter status hiện tại ('all', 'pending', 'reviewed', 'dismissed') */
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const limit = 20

  /**
   * Load danh sách báo cáo theo filter và trang hiện tại.
   * Dùng useCallback để useEffect có thể track chính xác khi nào cần reload.
   */
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listReports({ status: status === 'all' ? undefined : status, page, limit })
      setReports(data.reports)
      setTotal(data.total)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }, [status, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / limit)

  /**
   * Format ISO timestamp thành dd/mm/yyyy HH:MM (locale vi-VN).
   * @param {string|null} iso
   * @returns {string} Chuỗi đã format hoặc '—'
   */
  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  /**
   * Component hiển thị avatar + tên trong ô bảng (reporter / reported).
   * @param {{ user: { avatarUrl?: string, displayName?: string } }} props
   */
  function UserCell({ user }) {
    return (
      <div style={s.userCell}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} alt="" style={s.avatar} />
          : <div style={{ ...s.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#9ca3af' }}>?</div>
        }
        <span>{user?.displayName || <span style={{ color: '#9ca3af' }}>Ẩn danh</span>}</span>
      </div>
    )
  }

  return (
    <Layout title="🚨 Quản lý báo cáo">
      <div style={s.toolbar}>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={s.select}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span style={{ fontSize: 14, color: '#6b7280', marginLeft: 'auto' }}>
          {loading ? 'Đang tải...' : `${total} báo cáo`}
        </span>
        <button onClick={load} style={{ ...s.btnView, background: '#6b7280' }}>
          Làm mới
        </button>
      </div>

      {error && (
        <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 14 }}>
          Lỗi: {error}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>ID</th>
              <th style={s.th}>Người báo cáo</th>
              <th style={s.th}>Người bị báo cáo</th>
              <th style={s.th}>Danh mục</th>
              <th style={s.th}>Trạng thái</th>
              <th style={s.th}>Thời gian</th>
              <th style={s.th}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && reports.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#9ca3af', padding: 40 }}>
                  Không có báo cáo nào
                </td>
              </tr>
            )}
            {!loading && reports.map((r) => {
              const stBadge = STATUS_BADGE[r.status] || STATUS_BADGE.pending
              const actBadge = ACTION_BADGE[r.actionTaken]
              return (
                <tr key={r.id}>
                  <td style={s.td}>
                    <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>#{r.id}</span>
                  </td>
                  <td style={s.td}><UserCell user={r.reporter} /></td>
                  <td style={s.td}>
                    <div>
                      <UserCell user={r.reported} />
                      {r.reported?.isBanned && (
                        <span style={{ ...s.badge('#FEE2E2', '#991B1B'), marginTop: 4, display: 'inline-block' }}>
                          🔒 Đã cấm
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={s.td}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{r.category}</div>
                    {r.subCategory && (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{r.subCategory}</div>
                    )}
                  </td>
                  <td style={s.td}>
                    <span style={s.badge(stBadge.bg, stBadge.color)}>{stBadge.label}</span>
                    {actBadge && (
                      <span style={{ ...s.badge(actBadge.bg, actBadge.color), marginLeft: 6 }}>
                        {actBadge.label}
                      </span>
                    )}
                  </td>
                  <td style={s.td}>
                    <div style={{ fontSize: 13 }}>{formatDate(r.createdAt)}</div>
                    {r.reviewedAt && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                        Xử lý: {formatDate(r.reviewedAt)}
                      </div>
                    )}
                  </td>
                  <td style={s.td}>
                    <button style={s.btnView} onClick={() => navigate(`/reports/${r.id}`)}>
                      Xem
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={s.pageBtn(false)}
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1
            return (
              <button key={p} style={s.pageBtn(p === page)} onClick={() => setPage(p)}>
                {p}
              </button>
            )
          })}
          <button
            style={s.pageBtn(false)}
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </button>
          <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>
            Trang {page}/{totalPages}
          </span>
        </div>
      )}
    </Layout>
  )
}
