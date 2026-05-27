import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../api/auth.js'
import { saveToken } from '../hooks/useAuth.js'

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #f7f3eb 0%, #eef2ff 100%)',
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '40px 36px',
    textAlign: 'left',
    boxShadow: '0 18px 50px rgba(15, 23, 42, 0.12)',
    maxWidth: 440,
    width: '100%',
    border: '1px solid rgba(148, 163, 184, 0.24)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 999,
    background: '#eef2ff',
    color: '#3730a3',
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 18,
  },
  title: { fontSize: 28, fontWeight: 800, color: '#111827', marginBottom: 8, lineHeight: 1.15 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 12,
    padding: '12px 14px',
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  },
  btn: {
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '13px 16px',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.15s',
    marginTop: 6,
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    marginTop: 14,
  },
  note: {
    marginTop: 14,
    fontSize: 13,
    color: '#6b7280',
  },
}

/**
 * Trang đăng nhập admin bằng email + password (local account).
 *
 * Luồng:
 *   1. Admin nhập email + password → bấm "Đăng nhập admin"
 *   2. Gọi adminLogin() → nhận JWT từ backend
 *   3. Lưu JWT bằng saveToken() → navigate về /documents
 *
 * Tài khoản admin được tạo bởi script seed ở backend.
 * Không dùng Microsoft OAuth ở trang này.
 */
export default function LoginPage() {
  const navigate = useNavigate()

  /** true khi đang gọi API đăng nhập */
  const [loading, setLoading] = useState(false)

  /** Thông báo lỗi hiển thị dưới form */
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  /**
   * Xử lý đăng nhập: gọi API → lưu token → redirect.
   * Lỗi được hiển thị trực tiếp trong form (không throw).
   */
  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      const data = await adminLogin(email, password)
      if (!data.token) throw new Error('Không nhận được token')
      saveToken(data.token)
      navigate('/documents', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Không thể đăng nhập')
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>Admin Access</div>
        <h1 style={styles.title}>PTIT Dating Admin</h1>
        <p style={styles.subtitle}>
          Đăng nhập bằng tài khoản admin local, không cần Outlook.
        </p>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@ptit.local"
            autoComplete="email"
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label} htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin@123456"
            autoComplete="current-password"
          />
        </div>
        <button style={styles.btn} onClick={handleLogin} disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập admin'}
        </button>
        {error && <p style={styles.error}>{error}</p>}
        <p style={styles.note}>
          Tài khoản mặc định sẽ được tạo bằng script seed ở backend.
        </p>
      </div>
    </div>
  )
}
