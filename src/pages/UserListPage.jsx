/**
 * @fileoverview UserListPage — Trang quản lý danh sách người dùng của hệ thống.
 *
 * Tính năng:
 *   - Tìm kiếm theo tên, email, mã sinh viên (live search — cập nhật khi gõ, không cần submit).
 *   - Lọc theo status: Tất cả / Đang hoạt động / Đang bị cấm / Tạm khóa.
 *   - Phân trang (20 items/trang, tối đa hiển thị 7 trang trong pagination bar).
 *   - Hiển thị avatar, tên, email, mã SV, trạng thái, vai trò, onboarding step, lần hoạt động gần nhất.
 *   - Quick action: 🔒 Ban (nếu chưa bị ban) hoặc 🔓 Mở ban (nếu đang bị ban).
 *     → Tài khoản admin không thể bị ban (disabled + tooltip).
 *
 * Cơ chế busyId:
 *   Mỗi lần gọi API ban/unban cho user X, lưu X.id vào busyId.
 *   Button của user X bị disable và hiện "Đang xử lý..." trong khi chờ.
 *   Sau khi xong, busyId reset về '' → các button hoạt động lại bình thường.
 *
 * Badge trạng thái:
 *   active    → xanh lá "Active"
 *   banned    → đỏ "Banned"
 *   suspended → vàng "Suspended"
 *
 * @module UserListPage
 */
import { useCallback, useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { banUser, listUsers, unbanUser } from '../api/users.js'

/**
 * Tùy chọn filter theo trạng thái tài khoản trong dropdown.
 */
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'banned', label: 'Đang bị cấm' },
  { value: 'suspended', label: 'Tạm khóa' },
]

/**
 * Map trạng thái người dùng → style badge hiển thị trong bảng.
 */
const STATUS_BADGE = {
  active:    { bg: '#DCFCE7', color: '#166534', label: 'Active' },
  banned:    { bg: '#FEE2E2', color: '#991B1B', label: 'Banned' },
  suspended: { bg: '#FEF3C7', color: '#92400E', label: 'Suspended' },
}

/** Styles dùng chung trong trang */
const s = {
  /** Toolbar: 3 cột — search input | status select | reload button */
  toolbar: {
    display: 'grid',
    gridTemplateColumns: '1fr 170px auto',
    gap: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 14,
    background: '#fff',
  },
  select: {
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 14,
    background: '#fff',
  },
  btn: {
    border: 'none',
    borderRadius: 8,
    padding: '9px 14px',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    background: '#1a1a2e',
    color: '#fff',
  },
  /** Wrapper có overflow-x auto cho bảng trên màn hình nhỏ */
  tableWrap: {
    overflowX: 'auto',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    background: '#f9fafb',
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e5e7eb',
    letterSpacing: '0.04em',
  },
  td: {
    padding: '12px 14px',
    fontSize: 14,
    color: '#111827',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    objectFit: 'cover',
    background: '#e5e7eb',
  },
  /** Cell chứa avatar + tên/email xếp ngang */
  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  /** Factory hàm tạo style badge với màu tùy chỉnh */
  badge: (bg, color) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: bg,
    color,
  }),
  /** Wrapper cho các nút hành động trong 1 dòng */
  rowActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  /** Nút nguy hiểm (ban) — nền đỏ nhạt */
  btnDanger: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
  },
  /** Nút an toàn (unban) — nền xanh dương nhạt */
  btnSafe: {
    background: '#dbeafe',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
    borderRadius: 8,
    padding: '6px 10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 12,
  },
  pagination: { display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' },
  /** Factory hàm tạo style nút phân trang (active = tô đậm nền tối) */
  pageBtn: (active) => ({
    border: `1px solid ${active ? '#1a1a2e' : '#d1d5db'}`,
    background: active ? '#1a1a2e' : '#fff',
    color: active ? '#fff' : '#374151',
    borderRadius: 6,
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: 13,
  }),
}

/**
 * Format ISO timestamp thành chuỗi dd/mm/yyyy HH:MM (locale vi-VN).
 * Dùng để hiển thị lastActiveAt của người dùng.
 *
 * @param {string|null} iso - Chuỗi ISO 8601
 * @returns {string} Chuỗi đã format hoặc '—' nếu null/undefined
 */
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Trang quản lý danh sách người dùng.
 *
 * @returns {JSX.Element}
 */
export default function UserListPage() {
  /** Danh sách người dùng của trang hiện tại */
  const [rows, setRows] = useState([])

  /** Filter status hiện tại: 'all' | 'active' | 'banned' | 'suspended' */
  const [status, setStatus] = useState('all')

  /** Chuỗi tìm kiếm — cập nhật live (mỗi keystroke) → debounce qua useCallback dep */
  const [query, setQuery] = useState('')

  /** Trang hiện tại (bắt đầu từ 1) */
  const [page, setPage] = useState(1)

  /** Tổng số người dùng khớp filter (dùng tính totalPages) */
  const [total, setTotal] = useState(0)

  /** true khi đang gọi API listUsers */
  const [loading, setLoading] = useState(false)

  /** Thông báo lỗi khi listUsers thất bại */
  const [error, setError] = useState('')

  /**
   * ID của user đang được xử lý ban/unban.
   * Khi busyId !== '' → button của user đó bị disable + hiện "Đang xử lý..."
   * Reset về '' sau khi API hoàn thành.
   */
  const [busyId, setBusyId] = useState('')

  const limit = 20
  const totalPages = Math.max(1, Math.ceil(total / limit))

  /**
   * Fetch danh sách người dùng từ API theo các filter hiện tại.
   * useCallback giúp useEffect có thể track dependency chính xác,
   * tránh tạo lại function mỗi render không cần thiết.
   *
   * @returns {Promise<void>}
   */
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listUsers({
        status: status === 'all' ? undefined : status,
        q: query.trim() || undefined, // Không gửi param nếu query rỗng
        page,
        limit,
      })
      setRows(data.users || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }, [status, query, page])

  /** Reload danh sách mỗi khi filter/query/page thay đổi */
  useEffect(() => {
    load()
  }, [load])

  /**
   * Xử lý ban nhanh từ danh sách người dùng.
   * Confirm trước khi thực hiện để tránh thao tác nhầm.
   * Sau khi ban thành công → reload danh sách để cập nhật badge.
   *
   * Lưu ý: Tài khoản role='admin' bị disable ở nút ban (trong JSX),
   * không thể bị ban qua route này.
   *
   * @param {{ id: string, email?: string, profile?: { displayName?: string } }} user
   * @returns {Promise<void>}
   */
  async function handleBan(user) {
    const ok = window.confirm(`Cấm tài khoản ${user.profile?.displayName || user.email || user.id}?`)
    if (!ok) return
    setBusyId(user.id) // Đánh dấu đang xử lý để disable button
    try {
      await banUser(user.id, {
        source: 'manual',
        reason: 'admin_user_list_ban',
      })
      await load() // Reload sau khi ban để cập nhật trạng thái
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.message || e.message))
    } finally {
      setBusyId('') // Luôn reset busyId kể cả khi lỗi
    }
  }

  /**
   * Xử lý mở ban nhanh từ danh sách người dùng.
   * Confirm trước khi thực hiện.
   * Sau khi unban thành công → reload danh sách.
   *
   * @param {{ id: string, email?: string, profile?: { displayName?: string } }} user
   * @returns {Promise<void>}
   */
  async function handleUnban(user) {
    const ok = window.confirm(`Mở cấm tài khoản ${user.profile?.displayName || user.email || user.id}?`)
    if (!ok) return
    setBusyId(user.id)
    try {
      await unbanUser(user.id, {
        source: 'manual',
        reason: 'admin_user_list_unban',
      })
      await load()
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.message || e.message))
    } finally {
      setBusyId('')
    }
  }

  return (
    <Layout title="👤 Quản lý người dùng">
      {/* Toolbar: search input + status filter + reload button */}
      <div style={s.toolbar}>
        {/* Live search: setQuery → trigger load() qua useCallback dependency */}
        <input
          style={s.input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1) // Reset về trang 1 khi thay đổi filter
          }}
          placeholder="Tìm tên, email, mã sinh viên..."
        />

        {/* Filter theo status */}
        <select
          style={s.select}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
            setPage(1)
          }}
        >
          {STATUS_OPTIONS.map((it) => (
            <option key={it.value} value={it.value}>{it.label}</option>
          ))}
        </select>

        {/* Nút reload thủ công */}
        <button style={s.btn} onClick={load}>Làm mới</button>
      </div>

      {/* Tổng số người dùng */}
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
        {loading ? 'Đang tải...' : `${total} người dùng`}
      </div>

      {/* Thông báo lỗi */}
      {error && (
        <div style={{ color: '#ef4444', marginBottom: 12 }}>
          Lỗi: {error}
        </div>
      )}

      {/* Bảng danh sách người dùng */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Người dùng</th>
              <th style={s.th}>Mã SV</th>
              <th style={s.th}>Trạng thái</th>
              <th style={s.th}>Vai trò</th>
              <th style={s.th}>Onboarding</th>
              <th style={s.th}>Hoạt động gần nhất</th>
              <th style={s.th}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {/* Trạng thái rỗng */}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#9ca3af', padding: 30 }}>
                  Không có dữ liệu
                </td>
              </tr>
            )}

            {/* Danh sách người dùng */}
            {rows.map((u) => {
              /** Badge status của user này */
              const st = STATUS_BADGE[u.status] || STATUS_BADGE.active
              /** true khi đang xử lý ban/unban user này */
              const isBusy = busyId === u.id
              return (
                <tr key={u.id}>
                  {/* Cột avatar + tên + email */}
                  <td style={s.td}>
                    <div style={s.userCell}>
                      {u.profile?.avatarUrl ? (
                        <img src={u.profile.avatarUrl} alt="" style={s.avatar} />
                      ) : (
                        <div style={{ ...s.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>?</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.profile?.displayName || '—'}</div>
                        {/* Ưu tiên email thường, fallback outlookEmail */}
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email || u.outlookEmail || '—'}</div>
                      </div>
                    </div>
                  </td>

                  {/* Mã sinh viên (studentId) */}
                  <td style={s.td}>{u.studentId || '—'}</td>

                  {/* Badge trạng thái: active / banned / suspended */}
                  <td style={s.td}><span style={s.badge(st.bg, st.color)}>{st.label}</span></td>

                  {/* Vai trò: 'user' | 'admin' */}
                  <td style={s.td}>{u.role}</td>

                  {/* Bước onboarding (số) — 0 = chưa bắt đầu, null = hoàn thành */}
                  <td style={s.td}>{u.onboardingStep}</td>

                  {/* Lần hoạt động gần nhất */}
                  <td style={s.td}>{formatDate(u.lastActiveAt)}</td>

                  {/* Thao tác: ban hoặc unban tùy trạng thái hiện tại */}
                  <td style={s.td}>
                    <div style={s.rowActions}>
                      {u.isBanned ? (
                        /* Nút mở ban — hiện khi user đang bị ban */
                        <button
                          style={s.btnSafe}
                          onClick={() => handleUnban(u)}
                          disabled={isBusy}
                        >
                          {isBusy ? 'Đang xử lý...' : '🔓 Mở ban'}
                        </button>
                      ) : (
                        /* Nút ban — hiện khi user chưa bị ban.
                           Disable nếu user có role='admin' để tránh tự ban admin */
                        <button
                          style={s.btnDanger}
                          onClick={() => handleBan(u)}
                          disabled={isBusy || u.role === 'admin'}
                          title={u.role === 'admin' ? 'Không thao tác trên tài khoản admin' : ''}
                        >
                          {isBusy ? 'Đang xử lý...' : '🔒 Ban'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Phân trang — chỉ hiện khi có hơn 1 trang */}
      {totalPages > 1 && (
        <div style={s.pagination}>
          {/* Nút trang trước */}
          <button
            style={s.pageBtn(false)}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trước
          </button>

          {/* Tối đa 7 nút số trang */}
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} style={s.pageBtn(p === page)} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}

          {/* Nút trang sau */}
          <button
            style={s.pageBtn(false)}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau →
          </button>

          {/* Chỉ số trang hiện tại */}
          <span style={{ fontSize: 13, color: '#6b7280', marginLeft: 8 }}>
            Trang {page}/{totalPages}
          </span>
        </div>
      )}
    </Layout>
  )
}
