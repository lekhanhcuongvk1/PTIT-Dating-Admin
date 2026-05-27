/**
 * @fileoverview ReportDetailPage — Trang xem chi tiết và xử lý một báo cáo vi phạm.
 *
 * Luồng xử lý:
 *   1. Load báo cáo theo :id → hiển thị thông tin reporter, reported, nội dung báo cáo.
 *   2. Cột phải hiển thị snapshot hồ sơ người bị báo cáo (chụp lại lúc report gửi).
 *      Snapshot không thay đổi dù user cập nhật hồ sơ sau đó → đảm bảo bằng chứng nhất quán.
 *   3. Panel xử lý cuối trang cho phép admin:
 *      - ⚠️ Cảnh cáo: reviewReport(status='reviewed', action_taken='warned')
 *      - ✅ Đã xem xét (không hành động): reviewReport(status='reviewed', action_taken='none')
 *      - 🔒 Cấm tài khoản: 2 bước (setConfirmBan → confirm → reviewReport + action_taken='banned')
 *      - 🔓 Mở khóa: unbanUser() nếu người bị báo cáo đang bị ban
 *   4. Sau khi thực hiện hành động, reload lại báo cáo để cập nhật trạng thái.
 *
 * Cơ chế 2 bước ban:
 *   - Bấm "Cấm tài khoản" → setConfirmBan(true) → hiện panel xác nhận đỏ.
 *   - Bấm "Xác nhận cấm" → handleAction('reviewed', 'banned').
 *   - Bấm "Hủy" → setConfirmBan(false) → quay về panel bình thường.
 *   Mục đích: tránh ban nhầm do bấm nhầm.
 *
 * Components nội bộ:
 *   - InfoRow: hiển thị 1 label + value, tự ẩn nếu value rỗng/null.
 *   - AvatarCell: hiển thị avatar + tên + email của reporter/reported.
 *
 * @module ReportDetailPage
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { getReport, reviewReport } from '../api/reports.js'
import { unbanUser } from '../api/moderation.js'

/**
 * Map trạng thái báo cáo → style badge hiển thị.
 * pending   → vàng "Chờ xử lý"
 * reviewed  → xanh lá "Đã xử lý"
 * dismissed → xám "Đã bỏ qua"
 */
const STATUS_BADGE = {
  pending:   { bg: '#FEF3C7', color: '#92400E', label: 'Chờ xử lý' },
  reviewed:  { bg: '#D1FAE5', color: '#065F46', label: 'Đã xử lý' },
  dismissed: { bg: '#F3F4F6', color: '#6B7280', label: 'Đã bỏ qua' },
}

/** Styles dùng chung trong trang (inline style objects) */
const s = {
  /** Layout 2 cột: trái = thông tin báo cáo, phải = snapshot profile */
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
  /** Grid 3 cột cho ảnh trong snapshot */
  photoGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 },
  photo: { width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 10, background: '#f3f4f6' },
  tag: { display: 'inline-block', padding: '4px 10px', borderRadius: 20, background: '#f3f4f6', fontSize: 12, marginRight: 6, marginBottom: 6 },
  /** Banner cảnh báo trong phần snapshot: nhắc đây là dữ liệu chụp lại, không thay đổi */
  snapshotNote: {
    fontSize: 12, color: '#6b7280', padding: '8px 12px',
    background: '#fffbeb', borderRadius: 8,
    border: '1px solid #fde68a', marginBottom: 16,
  },
  /** Card hành động ở cuối trang */
  actionCard: { background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', marginTop: 24 },
  textarea: {
    width: '100%', border: '1px solid #d1d5db', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, resize: 'vertical', minHeight: 80,
    fontFamily: 'inherit', boxSizing: 'border-box',
  },
  btnRow: { display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' },
  /** Factory hàm tạo style button với màu tùy chỉnh */
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

/**
 * Component hiển thị một dòng thông tin dạng label–value.
 * Tự ẩn (return null) nếu value là falsy (ngoại trừ số 0).
 *
 * @param {{ label: string, value: string|number|null|undefined }} props
 * @returns {JSX.Element|null}
 *
 * @example
 * <InfoRow label="Danh mục" value={report.category} />
 * <InfoRow label="Số lượt like" value={0} />  // hiển thị vì value=0
 * <InfoRow label="Ghi chú" value={null} />    // ẩn đi
 */
function InfoRow({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <div style={s.label}>{label}</div>
      <div style={s.value}>{value}</div>
    </div>
  )
}

/**
 * Component hiển thị avatar + tên + email của reporter hoặc reported.
 * Nếu không có avatarUrl → hiển thị placeholder "?".
 * Nếu label = "Người bị báo cáo" và currentStatus = 'banned' → hiển thị badge "Đang bị cấm".
 *
 * @param {{ user: { avatarUrl?: string, displayName?: string, email?: string, currentStatus?: string }, label: string }} props
 */
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
          {/* Hiển thị badge ban nếu người bị báo cáo đang bị cấm */}
          {label === 'Người bị báo cáo' && user?.currentStatus === 'banned' && (
            <span style={s.badge('#FEE2E2', '#991B1B')}>🔒 Đang bị cấm</span>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Trang chi tiết báo cáo — xem thông tin và thực hiện hành động xử lý.
 *
 * State chính:
 *   - report: dữ liệu báo cáo đầy đủ bao gồm reporter, reported, snapshotData
 *   - adminNote: ghi chú của admin (pre-fill từ report.adminNote nếu có)
 *   - confirmBan: true/false — bật/tắt panel xác nhận 2 bước khi ban
 *   - submitting: true khi đang gọi API xử lý (disable buttons)
 *
 * @returns {JSX.Element}
 */
export default function ReportDetailPage() {
  /** Lấy ID báo cáo từ URL params (/reports/:id) */
  const { id } = useParams()
  const navigate = useNavigate()

  /** Dữ liệu đầy đủ của báo cáo (reporter, reported, snapshotData, ...) */
  const [report, setReport] = useState(null)

  /** true khi đang load dữ liệu ban đầu */
  const [loading, setLoading] = useState(true)

  /** Thông báo lỗi khi load báo cáo thất bại */
  const [error, setError] = useState(null)

  /** Ghi chú của admin — được lưu vào report khi gọi reviewReport */
  const [adminNote, setAdminNote] = useState('')

  /** true khi đang gọi API (reviewReport hoặc unbanUser) — disable toàn bộ buttons */
  const [submitting, setSubmitting] = useState(false)

  /**
   * Trạng thái xác nhận 2 bước trước khi ban tài khoản.
   * false → hiện 3 nút hành động bình thường.
   * true  → hiện panel cảnh báo đỏ yêu cầu xác nhận lần 2.
   */
  const [confirmBan, setConfirmBan] = useState(false)

  /** ID của người bị báo cáo — dùng cho API unbanUser */
  const reportedUserId = report?.reported?.id

  /**
   * Load dữ liệu báo cáo khi mount hoặc khi id thay đổi.
   * Pre-fill adminNote từ dữ liệu cũ nếu báo cáo đã được xử lý trước đó.
   */
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

  /**
   * Thực hiện hành động xử lý báo cáo: cảnh cáo, xem xét, hoặc ban.
   * Sau khi thành công → reload lại báo cáo để cập nhật trạng thái và badges.
   *
   * Các giá trị actionTaken hợp lệ:
   *   - 'warned'  → cảnh cáo người bị báo cáo
   *   - 'none'    → đã xem xét, không cần hành động
   *   - 'banned'  → cấm tài khoản người bị báo cáo (backend xử lý ban luôn)
   *
   * @param {'reviewed'|'dismissed'} status - Trạng thái mới của báo cáo
   * @param {'warned'|'none'|'banned'} actionTaken - Hành động đã thực hiện
   * @returns {Promise<void>}
   */
  async function handleAction(status, actionTaken) {
    setSubmitting(true)
    try {
      await reviewReport(id, { status, action_taken: actionTaken, admin_note: adminNote })
      // Reload để cập nhật status, actionTaken, reviewedAt từ server
      const updated = await getReport(id)
      setReport(updated)
      setConfirmBan(false) // Reset về panel bình thường sau khi xử lý xong
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.message || e.message))
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Mở khóa tài khoản người bị báo cáo (gỡ ban).
   * Dùng khi admin quyết định ban là không hợp lý, hoặc user đã khiếu nại thành công.
   *
   * Ghi chú admin (adminNote) được truyền vào reason để audit trail.
   *
   * @returns {Promise<void>}
   */
  async function handleUnban() {
    if (!reportedUserId) return
    setSubmitting(true)
    try {
      await unbanUser(reportedUserId, {
        source: 'manual',
        reason: 'admin_manual_unban',
        note: adminNote || null,
      })
      // Reload để cập nhật currentStatus của reported user
      const updated = await getReport(id)
      setReport(updated)
    } catch (e) {
      alert('Lỗi: ' + (e.response?.data?.message || e.message))
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * Format ISO timestamp thành chuỗi dd/mm/yyyy HH:MM (locale vi-VN).
   * @param {string|null} iso - Chuỗi ISO 8601
   * @returns {string} Chuỗi đã format hoặc '—' nếu null
   */
  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  /** Dữ liệu snapshot hồ sơ người bị báo cáo (chụp lúc report được gửi) */
  const snap = report?.snapshotData

  // ── Loading / Error states ──
  if (loading) {
    return <Layout title="Chi tiết báo cáo"><div style={{ color: '#9ca3af', padding: 40, textAlign: 'center' }}>Đang tải...</div></Layout>
  }
  if (error) {
    return <Layout title="Chi tiết báo cáo"><div style={{ color: '#ef4444', padding: 40 }}>Lỗi: {error}</div></Layout>
  }
  if (!report) return null

  /** Badge trạng thái báo cáo hiện tại */
  const stBadge = STATUS_BADGE[report.status] || STATUS_BADGE.pending

  return (
    <Layout title={`Báo cáo #${report.id}`}>
      {/* Nút quay lại danh sách */}
      <button style={s.backBtn} onClick={() => navigate('/reports')}>
        ← Quay lại danh sách
      </button>

      {/* Header: ID báo cáo + badge trạng thái + badge action_taken */}
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

      {/* Layout 2 cột */}
      <div style={s.grid}>
        {/* ── Cột trái: Thông tin báo cáo ── */}
        <div>
          <div style={s.card}>
            <div style={s.sectionTitle}>Thông tin báo cáo</div>

            {/* Reporter và reported */}
            <AvatarCell user={report.reporter} label="Người báo cáo" />
            <AvatarCell user={report.reported} label="Người bị báo cáo" />

            {/* Nội dung báo cáo theo cấu trúc 3 cấp: category → subCategory → detailOption → comment */}
            <InfoRow label="Danh mục" value={report.category} />
            <InfoRow label="Danh mục con" value={report.subCategory} />
            {report.detailOption && <InfoRow label="Chi tiết" value={report.detailOption} />}
            {report.comment && <InfoRow label="Nhận xét thêm" value={report.comment} />}

            {/* Thời gian */}
            <InfoRow label="Thời gian báo cáo" value={formatDate(report.createdAt)} />
            {report.reviewedAt && (
              <InfoRow label="Thời gian xử lý" value={formatDate(report.reviewedAt)} />
            )}
            {report.adminNote && <InfoRow label="Ghi chú admin" value={report.adminNote} />}
          </div>
        </div>

        {/* ── Cột phải: Snapshot hồ sơ tại thời điểm bị báo cáo ── */}
        <div style={s.card}>
          <div style={s.sectionTitle}>Hồ sơ tại thời điểm bị báo cáo</div>
          {!snap ? (
            <div style={{ color: '#9ca3af', fontSize: 14 }}>Không có dữ liệu snapshot</div>
          ) : (
            <>
              {/* Banner nhắc nhở: dữ liệu snapshot là bất biến */}
              <div style={s.snapshotNote}>
                📸 Dữ liệu này được chụp lại lúc {formatDate(snap.capturedAt)} và không thay đổi dù người dùng cập nhật hồ sơ.
              </div>

              {/* Avatar + tên + tuổi + giới tính tại thời điểm snapshot */}
              <div style={s.userRow}>
                {snap.avatarUrl
                  ? <img src={snap.avatarUrl} alt="" style={{ ...s.avatar, width: 64, height: 64 }} />
                  : <div style={{ ...s.avatar, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#9ca3af' }}>?</div>
                }
                <div>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{snap.displayName || '—'}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {/* Tính tuổi từ dob snapshot */}
                    {[snap.gender, snap.dob ? `${new Date().getFullYear() - new Date(snap.dob).getFullYear()} tuổi` : null].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>

              {/* Thư viện ảnh (tối đa tất cả ảnh tại thời điểm snapshot) */}
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

              {/* Giới thiệu bản thân */}
              {snap.bio && (
                <div style={{ marginBottom: 16 }}>
                  <div style={s.label}>Giới thiệu bản thân</div>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, background: '#f9fafb', padding: '10px 14px', borderRadius: 10 }}>
                    {snap.bio}
                  </div>
                </div>
              )}

              {/* Thông tin cá nhân dạng 2 cột */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                {snap.lookingFor && <InfoRow label="Đang tìm kiếm" value={snap.lookingFor} />}
                {snap.major && <InfoRow label="Ngành học" value={snap.major} />}
                {snap.jobTitle && <InfoRow label="Công việc" value={snap.jobTitle} />}
                {snap.province && <InfoRow label="Quê quán" value={snap.province} />}
                {snap.height && <InfoRow label="Chiều cao" value={`${snap.height} cm`} />}
                {snap.zodiac && <InfoRow label="Cung hoàng đạo" value={snap.zodiac} />}
              </div>

              {/* Sở thích dạng tags */}
              {snap.interests?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={s.label}>Sở thích</div>
                  <div>{snap.interests.map((t) => <span key={t} style={s.tag}>{t}</span>)}</div>
                </div>
              )}

              {/* Lối sống: drinking, smoking, workout, pets, socialMedia */}
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

      {/* ── Panel xử lý báo cáo ── */}
      <div style={s.actionCard}>
        <div style={s.sectionTitle}>Xử lý báo cáo</div>

        {/* Ô ghi chú admin — lưu vào report.admin_note khi gọi reviewReport */}
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

        {/* Chế độ bình thường: 3 nút hành động */}
        {!confirmBan ? (
          <div style={s.btnRow}>
            {/* Cảnh cáo: status=reviewed, action_taken=warned */}
            <button
              style={s.btn('#d1fae5', '#065f46')}
              disabled={submitting}
              onClick={() => handleAction('reviewed', 'warned')}
            >
              ⚠️ Cảnh cáo
            </button>

            {/* Xem xét xong, không hành động: status=reviewed, action_taken=none */}
            <button
              style={s.btn('#1a1a2e', '#fff')}
              disabled={submitting}
              onClick={() => handleAction('reviewed', 'none')}
            >
              ✅ Đã xem xét (không hành động)
            </button>

            {/* Bước 1 của ban: hiện panel xác nhận. Disable nếu đang ban rồi */}
            <button
              style={s.btn('#fee2e2', '#991b1b')}
              disabled={submitting || report.reported?.currentStatus === 'banned'}
              onClick={() => setConfirmBan(true)}
            >
              🔒 Cấm tài khoản
            </button>
          </div>
        ) : (
          /* Chế độ xác nhận ban: panel cảnh báo đỏ (bước 2) */
          <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
              ⚠️ Xác nhận cấm tài khoản của {report.reported?.displayName}?
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              Tài khoản này sẽ không thể đăng nhập và bị ẩn khỏi tất cả người dùng.
              Việc mở khóa cần thao tác riêng bằng nút "Mở khóa tài khoản".
            </div>
            <div style={s.btnRow}>
              {/* Xác nhận ban: status=reviewed, action_taken=banned */}
              <button
                style={s.btn('#fee2e2', '#991b1b')}
                disabled={submitting}
                onClick={() => handleAction('reviewed', 'banned')}
              >
                {submitting ? 'Đang xử lý...' : '🔒 Xác nhận cấm'}
              </button>

              {/* Hủy ban: quay về panel bình thường */}
              <button
                style={s.btn('#f3f4f6', '#374151')}
                disabled={submitting}
                onClick={() => setConfirmBan(false)}
              >
                Hủy
              </button>

              {/* Mở khóa: hiện trong panel confirm khi user đang bị ban */}
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

        {/* Nút mở khóa riêng biệt khi không ở chế độ confirmBan và user đang bị ban */}
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

        {/* Indicator đang xử lý */}
        {submitting && (
          <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>Đang xử lý...</div>
        )}
      </div>
    </Layout>
  )
}
