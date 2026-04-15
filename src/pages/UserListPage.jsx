import { useCallback, useEffect, useState } from 'react'
import Layout from '../components/Layout.jsx'
import { banUser, listUsers, unbanUser } from '../api/users.js'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'banned', label: 'Đang bị cấm' },
  { value: 'suspended', label: 'Tạm khóa' },
]

const STATUS_BADGE = {
  active: { bg: '#DCFCE7', color: '#166534', label: 'Active' },
  banned: { bg: '#FEE2E2', color: '#991B1B', label: 'Banned' },
  suspended: { bg: '#FEF3C7', color: '#92400E', label: 'Suspended' },
}

const s = {
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
  userCell: { display: 'flex', alignItems: 'center', gap: 10 },
  badge: (bg, color) => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: bg,
    color,
  }),
  rowActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
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

export default function UserListPage() {
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')

  const limit = 20
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listUsers({
        status: status === 'all' ? undefined : status,
        q: query.trim() || undefined,
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

  useEffect(() => {
    load()
  }, [load])

  async function handleBan(user) {
    const ok = window.confirm(`Cấm tài khoản ${user.profile?.displayName || user.email || user.id}?`)
    if (!ok) return
    setBusyId(user.id)
    try {
      await banUser(user.id, {
        source: 'manual',
        reason: 'admin_user_list_ban',
      })
      await load()
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.message || e.message))
    } finally {
      setBusyId('')
    }
  }

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
      <div style={s.toolbar}>
        <input
          style={s.input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(1)
          }}
          placeholder="Tìm tên, email, mã sinh viên..."
        />
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
        <button style={s.btn} onClick={load}>Làm mới</button>
      </div>

      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>
        {loading ? 'Đang tải...' : `${total} người dùng`}
      </div>

      {error && (
        <div style={{ color: '#ef4444', marginBottom: 12 }}>
          Lỗi: {error}
        </div>
      )}

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
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#9ca3af', padding: 30 }}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
            {rows.map((u) => {
              const st = STATUS_BADGE[u.status] || STATUS_BADGE.active
              const isBusy = busyId === u.id
              return (
                <tr key={u.id}>
                  <td style={s.td}>
                    <div style={s.userCell}>
                      {u.profile?.avatarUrl ? (
                        <img src={u.profile.avatarUrl} alt="" style={s.avatar} />
                      ) : (
                        <div style={{ ...s.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>?</div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.profile?.displayName || '—'}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{u.email || u.outlookEmail || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={s.td}>{u.studentId || '—'}</td>
                  <td style={s.td}><span style={s.badge(st.bg, st.color)}>{st.label}</span></td>
                  <td style={s.td}>{u.role}</td>
                  <td style={s.td}>{u.onboardingStep}</td>
                  <td style={s.td}>{formatDate(u.lastActiveAt)}</td>
                  <td style={s.td}>
                    <div style={s.rowActions}>
                      {u.isBanned ? (
                        <button
                          style={s.btnSafe}
                          onClick={() => handleUnban(u)}
                          disabled={isBusy}
                        >
                          {isBusy ? 'Đang xử lý...' : '🔓 Mở ban'}
                        </button>
                      ) : (
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

      {totalPages > 1 && (
        <div style={s.pagination}>
          <button
            style={s.pageBtn(false)}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Trước
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
            <button key={p} style={s.pageBtn(p === page)} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button
            style={s.pageBtn(false)}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
