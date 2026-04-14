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

export default function DocumentFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: '',
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  function handleChange(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

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
