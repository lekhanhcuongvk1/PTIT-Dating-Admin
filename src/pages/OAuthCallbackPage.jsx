import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeCode } from '../api/auth.js'
import { saveToken } from '../hooks/useAuth.js'

/**
 * Trang xử lý callback sau khi Microsoft OAuth redirect về.
 *
 * URL nhận: /oauth/callback?code=<authorization_code>
 *
 * Luồng:
 *   1. Đọc `code` từ query string.
 *   2. Gọi exchangeCode(code) → backend đổi lấy JWT.
 *   3. Decode JWT → kiểm tra role = 'admin'.
 *   4. Nếu hợp lệ: lưu token → navigate về /documents.
 *   5. Nếu lỗi: hiển thị thông báo lỗi + nút quay lại login.
 *
 * Chạy một lần duy nhất khi component mount (useEffect với deps [navigate]).
 */
export default function OAuthCallbackPage() {
  const navigate = useNavigate()

  /** Thông báo lỗi (null/empty = đang xử lý) */
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (!code) {
      setError('Không tìm thấy mã xác thực từ Microsoft')
      return
    }

    exchangeCode(code)
      .then((data) => {
        if (!data.token) throw new Error('Không nhận được token')

        // Decode JWT (client-side, không verify) để kiểm tra role trước khi lưu
        const payload = JSON.parse(atob(data.token.split('.')[1]))
        if (payload.role !== 'admin') {
          setError('Tài khoản này không có quyền truy cập admin')
          return
        }

        saveToken(data.token)
        navigate('/documents', { replace: true })
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || 'Đăng nhập thất bại')
      })
  }, [navigate])

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 16,
      background: '#f5f6fa',
    },
    error: {
      color: '#ef4444',
      fontSize: 15,
      background: '#fff',
      padding: '16px 24px',
      borderRadius: 10,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    },
  }

  if (error) {
    return (
      <div style={styles.page}>
        <p style={styles.error}>❌ {error}</p>
        <button onClick={() => navigate('/login')}>← Quay lại đăng nhập</button>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <p style={{ color: '#6b7280' }}>⏳ Đang xác thực, vui lòng chờ...</p>
    </div>
  )
}
