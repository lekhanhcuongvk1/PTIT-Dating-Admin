import { Link, useLocation, useNavigate } from 'react-router-dom'
import { logout } from '../hooks/useAuth.js'

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
  },
  sidebar: {
    width: 220,
    background: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    flexShrink: 0,
  },
  logo: {
    padding: '0 24px 24px',
    fontSize: 18,
    fontWeight: 700,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  navItem: {
    display: 'block',
    padding: '12px 24px',
    color: 'rgba(255,255,255,0.75)',
    cursor: 'pointer',
    transition: 'background 0.15s',
    fontSize: 14,
  },
  navItemActive: {
    background: 'rgba(255,255,255,0.12)',
    color: '#fff',
  },
  logoutBtn: {
    marginTop: 'auto',
    padding: '12px 24px',
    color: '#ff6b6b',
    cursor: 'pointer',
    background: 'none',
    fontSize: 14,
    textAlign: 'left',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  header: {
    background: '#fff',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 32px',
    fontSize: 15,
    fontWeight: 600,
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: 32,
  },
}

const navItems = [
  { label: '📄 Tài liệu Knowledge', path: '/documents' },
  { label: '🚨 Báo cáo người dùng', path: '/reports' },
  { label: '👤 Quản lý người dùng', path: '/users' },
]

export default function Layout({ children, title }) {
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={styles.wrapper}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>🎓 PTIT Admin</div>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.navItem,
              ...(location.pathname.startsWith(item.path) ? styles.navItemActive : {}),
            }}
          >
            {item.label}
          </Link>
        ))}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </aside>
      <main style={styles.main}>
        {title && <div style={styles.header}>{title}</div>}
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  )
}
