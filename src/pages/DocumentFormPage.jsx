import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { getDocument, createDocument, updateDocument } from '../api/knowledge.js'

const CATEGORIES = ['Hẹn hò', 'An toàn', 'Tính năng app', 'Quy định', 'Lời khuyên', 'Khác']

const s = {
  form: {
    background: '#fff',
    borderRadius: 12,
    padding: '32px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
    maxWidth: 800,
  },
  field: { marginBottom: 24 },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    transition: 'border-color 0.15s',
  },
  textarea: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    minHeight: 280,
    resize: 'vertical',
    lineHeight: 1.6,
  },
  select: {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    background: '#fff',
  },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  actions: { display: 'flex', gap: 12, marginTop: 8 },
  btnSave: {
    background: '#1a1a2e',
    color: '#fff',
    borderRadius: 8,
    padding: '10px 28px',
    fontSize: 14,
    fontWeight: 600,
  },
  btnCancel: {
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: 8,
    padding: '10px 28px',
    fontSize: 14,
    fontWeight: 600,
  },
  error: {
    color: '#dc2626',
    background: '#fef2f2',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    marginBottom: 20,
  },
  success: {
    color: '#065f46',
    background: '#d1fae5',
    borderRadius: 8,
    padding: '10px 16px',
    fontSize: 13,
    marginBottom: 20,
  },
}

/**
 * Trang tạo mới hoặc chỉnh sửa tài liệu Knowledge Base.
 *
 * Dùng chung cho 2 route:
 *   - /documents/new       → tạo mới (isEdit = false)
 *   - /documents/:id/edit  → chỉnh sửa (isEdit = true, id = params.id)
 *
 * Khi tạo/cập nhật thành công:
 *   - Backend tự động enqueue BullMQ job embed (Gemini embedding-001).
 *   - Hiển thị thông báo thành công → redirect về /documents sau 1.5 giây.
 *
 * Khi chỉnh sửa: load document hiện tại → pre-fill form.
 * Validate: title và content không được để trống.
 */
export default function DocumentFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  /** true khi đang ở chế độ chỉnh sửa (route /documents/:id/edit) */
  const isEdit = Boolean(id)

  /** Dữ liệu form (title, content, category) */
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
  })

  /** true khi đang load document cũ (chỉ ở chế độ edit) */
  const [loading, setLoading] = useState(isEdit)

  /** true khi đang gọi API lưu */
  const [saving, setSaving] = useState(false)

  /** Thông báo lỗi validation hoặc API */
  const [error, setError] = useState('')

  /** Thông báo thành công (hiển thị trước khi redirect) */
  const [success, setSuccess] = useState('')

  /**
   * Load document hiện tại để pre-fill form (chỉ chạy ở chế độ edit).
   */
  useEffect(() => {
    if (!isEdit) return
    getDocument(id)
      .then((doc) => {
        setForm({
          title: doc.title || '',
          content: doc.content || '',
          category: doc.category || '',
        })
      })
      .catch(() => setError('Không tải được tài liệu'))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  /**
   * Tạo onChange handler cho từng field của form.
   * Dùng currying để tránh tạo nhiều hàm riêng cho từng field.
   *
   * @param {'title'|'content'|'category'} field
   * @returns {function} onChange event handler
   */
  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  /**
   * Submit form: validate → tạo mới hoặc cập nhật tài liệu.
   *
   * Sau khi thành công: hiển thị thông báo → redirect về /documents sau 1.5s.
   * Lỗi API được hiển thị trong form mà không redirect.
   */
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.title.trim()) return setError('Vui lòng nhập tiêu đề')
    if (!form.content.trim()) return setError('Vui lòng nhập nội dung')

    setSaving(true)
    try {
      if (isEdit) {
        await updateDocument(id, form)
        setSuccess('✅ Đã cập nhật tài liệu. Embedding đang được xử lý lại...')
      } else {
        await createDocument(form)
        setSuccess('✅ Đã tạo tài liệu. Embedding đang được xử lý...')
        setForm({ title: '', content: '', category: '', source_url: '' })
      }
      setTimeout(() => navigate('/documents'), 1500)
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu thất bại, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Layout title="Tải tài liệu..."><p>Đang tải...</p></Layout>
  }

  return (
    <Layout title={isEdit ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}>
      <form style={s.form} onSubmit={handleSubmit}>
        {error && <div style={s.error}>{error}</div>}
        {success && <div style={s.success}>{success}</div>}

        <div style={s.field}>
          <label style={s.label}>Tiêu đề *</label>
          <input
            style={s.input}
            placeholder="Ví dụ: Cách tạo ấn tượng tốt qua chat"
            value={form.title}
            onChange={handleChange('title')}
            required
          />
        </div>

        <div style={s.field}>
          <label style={s.label}>Danh mục</label>
          <select style={s.select} value={form.category} onChange={handleChange('category')}>
            <option value="">-- Chọn danh mục --</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={s.field}>
          <label style={s.label}>Nội dung *</label>
          <textarea
            style={s.textarea}
            placeholder="Dán nội dung tài liệu vào đây. Nội dung này sẽ được embedding và dùng làm context cho chatbot AI..."
            value={form.content}
            onChange={handleChange('content')}
            required
          />
          <p style={s.hint}>
            {form.content.length} ký tự · Nội dung càng chi tiết, chatbot AI càng trả lời chính xác
          </p>
        </div>

        <div style={s.actions}>
          <button type="submit" style={s.btnSave} disabled={saving}>
            {saving ? 'Đang lưu...' : isEdit ? '💾 Cập nhật' : '➕ Tạo tài liệu'}
          </button>
          <button
            type="button"
            style={s.btnCancel}
            onClick={() => navigate('/documents')}
          >
            Huỷ
          </button>
        </div>
      </form>
    </Layout>
  )
}
