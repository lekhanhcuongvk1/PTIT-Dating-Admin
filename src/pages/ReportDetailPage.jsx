import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { getReport, reviewReport } from '../api/reports.js'
import { unbanUser } from '../api/moderation.js'

const STATUS_BADGE = {
  pending:   { bg: '#FEF3C7', color: '#92400E', label: 'Chờ xử lý' },
  reviewed:  { bg: '#D1FAE5', color: '#065F46', label: 'Đã xử lý' },
  dismissed: { bg: '#F3F4F6', color: '#6B7280', label: 'Đã bỏ qua' },
}

const s = {
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' },
  card: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' },
  label: { fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
  value: { fontSize: 15, color: '#1f2937', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', background: '#e5e7eb' },
  userRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  badge: (bg, color) => ({
    display: 'inline-block', padding: '3px 10px', borderRadius: 20,
    fontSize: 12, fontWeight: 600, background: bg, color,
  }),
  sectionTitle: {
    fontSize: 16, fontWeight: 700, color: '#1f2937',
    marginBottom: 16, paddingBottom: 10,
    borderBottom: '1px solid #f3f4f6',
  },
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 },
  photo: { width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, background: '#f3f4f6' },
  tag: { display: 'inline-block', padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', fontSize: 12, marginRight: 6, marginBottom: 6 },
  snapshotNote: {
    fontSize: 12, color: '#6b7280', padding: '8px 12px',
    background: '#fffbeb', borderRadius: 8,
    border: '1px solid #fde68a', marginBottom: 16,
  },
  actionCard: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginTop: 24 },
  textarea: {
    width: '100%', border: '1px solid #d1d5db', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, resize: 'vertical', minHeight: 80,
    fontFamily: 'inherit', boxSizing: 'border-box',
  },
  btnRow: { display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' },
  btn: (bg, color) => ({
    background: bg, color, border: 'none',
    borderRadius: 10, padding: '10px 22px',
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 6,
  }),
  backBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    marginBottom: 20, fontSize: 14, color: '#6b7280',
    cursor: 'pointer', background: 'none', border: 'none', padding: 0,
  },
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <div style={s.label}>{label}</div>
      <div style={s.value}>{value}</div>
    </div>
  )
}

function AvatarCell({ user, label }) {
  return (
    <div>
      <div style={s.label}>{label}</div>
      <div style={s.userRow}>
        {user?.avatarUrl
          ? <img src={user.avatarUrl} alt="" style={s.avatar} />
          : <div style={{ ...s.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#9ca3af' }}>?</div>
        }
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.displayName || '—'}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{user?.email || ''}</div>
          {label === 'Người bị báo cáo' && user?.currentStatus === 'banned' && (
            <span style={s.badge('#FEE2E2', '#991B1B')}>🔒 Đang bị cấm</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReportDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adminNote, setAdminNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmBan, setConfirmBan] = useState(false)

  const reportedUserId = report?.reported?.id

  useEffect(() => {
    setLoading(true)
    getReport(id)
      .then((data) => {
        setReport(data)
        setAdminNote(data.adminNote || '')
      })
      .catch((e) => setError(e.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleAction(status, actionTaken) {
    setSubmitting(true)
    try {
      await reviewReport(id, { status, action_taken: actionTaken, admin_note: adminNote })
      const updated = await getReport(id)
      setReport(updated)
      setConfirmBan(false)
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.message || e.message))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUnban() {
    if (!reportedUserId) return
    setSubmitting(true)
    try {
      await unbanUser(reportedUserId, {
        source: 'manual',
        reason: 'admin_manual_unban',
        note: adminNote || null,
      })
      const updated = await getReport(id)
      setReport(updated)
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.message || e.message))
    } finally {
      setSubmitting(false)
    }
  }

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const snap = report?.snapshotData

  if (loading) {
    return <Layout title="Chi tiết báo cáo"><div style={{ color: '#9ca3af', padding: 40, textAlign: 'center' }}>Đang tải...</div></Layout>
  }
  if (error) {
    return <Layout title="Chi tiết báo cáo"><div style={{ color: '#ef4444', padding: 40 }}>Lỗi: {error}</div></Layout>
  }
  if (!report) return null

  const stBadge = STATUS_BADGE[report.status] || STATUS_BADGE.pending

  return (
    <Layout title={`Báo cáo #${report.id}`}>
      <button style={s.backBtn} onClick={() => navigate('/reports')}>
        ← Quay lại danh sách
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Báo cáo #{report.id}</h2>
        <span style={s.badge(stBadge.bg, stBadge.color)}>{stBadge.label}</span>
        {report.actionTaken === 'banned' && (
          <span style={s.badge('#FEE2E2', '#991B1B')}>Đã cấm tài khoản</span>
        )}
        {report.actionTaken === 'warned' && (
          <span style={s.badge('#FEF9C3', '#713F12')}>Đã cảnh cáo</span>
        )}
      </div>

      <div style={s.grid}>
        {/* ── Cột trái: Thông tin báo cáo ── */}
        <div>
          <div style={s.card}>
            <div style={s.sectionTitle}>Thông tin báo cáo</div>

            <AvatarCell user={report.reporter} label="Người báo cáo" />
            <AvatarCell user={report.reported} label="Người bị báo cáo" />

            <InfoRow label="Danh mục" value={report.category} />
            <InfoRow label="Danh mục con" value={report.subCategory} />
            {report.detailOption && <InfoRow label="Chi tiết" value={report.detailOption} />}
            {report.comment && <InfoRow label="Nhận xét thêm" value={report.comment} />}
            <InfoRow label="Thời gian báo cáo" value={formatDate(report.createdAt)} />
            {report.reviewedAt && (
              <InfoRow label="Thời gian xử lý" value={formatDate(report.reviewedAt)} />
            )}
            {report.adminNote && <InfoRow label="Ghi chú admin" value={report.adminNote} />}
          </div>
        </div>

        {/* ── Cột phải: Snapshot profile ── */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Hồ sơ tại thời điểm bị báo cáo</div>
          {!snap ? (
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Không có dữ liệu snapshot</div>
          ) : (
            <>
              <div style={s.snapshotNote}>
                📸 Dữ liệu này được chụp lại lúc {formatDate(snap.capturedAt)} và không thay đổi dù người dùng cập nhật hồ sơ.
              </div>

              {/* Ảnh đại diện + tên */}
              <div style={s.userRow}>
                {snap.avatarUrl
                  ? <img src={snap.avatarUrl} alt="" style={{ ...s.avatar, width: 64, height: 64 }} />
                  : <div style={{ ...s.avatar, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#9ca3af' }}>?</div>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{snap.displayName || '—'}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {[snap.gender, snap.dob ? `${new Date().getFullYear() - new Date(snap.dob).getFullYear()} tuổi` : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>

              {/* Thư viện ảnh */}
              {snap.photos?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={s.label}>Thư viện ảnh ({snap.photos.length})</div>
                  <div style={s.photoGrid}>
                    {snap.photos.map((url, i) => (
                      <img key={i} src={url} alt="" style={s.photo}
                        onError={(e) => { e.target.style.background = '#f3f4f6'; e.target.src = '' }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {snap.bio && (
                <div style={{ marginBottom: 16 }}>
                  <div style={s.label}>Giới thiệu bản thân</div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '10px 14px', borderRadius: 10 }}>
                    {snap.bio}
                  </div>
                </div>
              )}

              {/* Thông tin cá nhân */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {snap.lookingFor && <InfoRow label="Đang tìm kiếm" value={snap.lookingFor} />}
                {snap.major && <InfoRow label="Ngành học" value={snap.major} />}
                {snap.jobTitle && <InfoRow label="Công việc" value={snap.jobTitle} />}
                {snap.province && <InfoRow label="Quê quán" value={snap.province} />}
                {snap.height && <InfoRow label="Chiều cao" value={`${snap.height} cm`} />}
                {snap.zodiac && <InfoRow label="Cung hoàng đạo" value={snap.zodiac} />}
              </div>

              {/* Sở thích */}
              {snap.interests?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={s.label}>Sở thích</div>
                  <div>{snap.interests.map((t) => <span key={t} style={s.tag}>{t}</span>)}</div>
                </div>
              )}

              {/* Lối sống */}
              {(snap.drinking || snap.smoking || snap.workout || snap.pets || snap.socialMedia) && (
                <div>
                  <div style={s.label}>Lối sống</div>
                  <div>
                    {[snap.drinking, snap.smoking, snap.workout, snap.pets, snap.socialMedia]
                      .filter(Boolean)
                      .map((v) => <span key={v} style={s.tag}>{v}</span>)
                    }
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Panel xử lý ── */}
      <div style={s.actionCard}>
        <div style={s.sectionTitle}>Xử lý báo cáo</div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ ...s.label, display: 'block', marginBottom: 6 }}>Ghi chú của admin</label>
          <textarea
            style={s.textarea}
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Ghi lại quyết định xử lý, lý do..."
            disabled={submitting}
          />
        </div>

        {!confirmBan ? (
          <div style={s.btnRow}>
            <button
              style={s.btn('#d1fae5', '#065f46')}
              disabled={submitting}
              onClick={() => handleAction('reviewed', 'warned')}
            >
              ⚠️ Cảnh cáo
            </button>
            <button
              style={s.btn('#1a1a2e', '#fff')}
              disabled={submitting}
              onClick={() => handleAction('reviewed', 'none')}
            >
              ✅ Đã xem xét (không hành động)
            </button>
            <button
              style={s.btn('#fee2e2', '#991b1b')}
              disabled={submitting || report.reported?.currentStatus === 'banned'}
              onClick={() => setConfirmBan(true)}
            >
              🔒 Cấm tài khoản
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
              ⚠️ Xác nhận cấm tài khoản của {report.reported?.displayName}?
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              Tài khoản này sẽ không thể đăng nhập và bị ẩn khỏi tất cả người dùng.
              Việc mở khóa cần thao tác riêng bằng nút "Mở khóa tài khoản".
            </div>
            <div style={s.btnRow}>
              <button
                style={s.btn('#fee2e2', '#991b1b')}
                disabled={submitting}
                onClick={() => handleAction('reviewed', 'banned')}
              >
                {submitting ? 'Đang xử lý...' : '🔒 Xác nhận cấm'}
              </button>
              <button
                style={s.btn('#f3f4f6', '#374151')}
                disabled={submitting}
                onClick={() => setConfirmBan(false)}
              >
                Hủy
              </button>
              {report.reported?.currentStatus === 'banned' && (
                <button
                  style={s.btn('#dbeafe', '#1e40af')}
                  disabled={submitting}
                  onClick={handleUnban}
                >
                  🔓 Mở khóa tài khoản
                </button>
              )}
            </div>
          </div>
        )}

        {!confirmBan && report.reported?.currentStatus === 'banned' && (
          <div style={{ marginTop: 12 }}>
            <button
              style={s.btn('#dbeafe', '#1e40af')}
              disabled={submitting}
              onClick={handleUnban}
            >
              🔓 Mở khóa tài khoản
            </button>
          </div>
        )}

        {submitting && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>Đang xử lý...</div>
        )}
      </div>
    </Layout>
  )
}
