import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function TemplateManager() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    preview_url: '',
    data: '{}',
    is_active: true
  })
  const navigate = useNavigate()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/api/admin/templates')
      setTemplates(res.data)
    } catch (err) {
      alert('Ошибка загрузки шаблонов')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      let dataToSend = {
        name: formData.name,
        description: formData.description,
        preview_url: formData.preview_url,
        data: JSON.parse(formData.data),
        is_active: formData.is_active
      }

      if (editingTemplate) {
        await api.put(`/api/admin/templates/${editingTemplate.id}`, dataToSend)
        alert('Шаблон обновлён')
      } else {
        await api.post('/api/admin/templates', dataToSend)
        alert('Шаблон создан')
      }
      setShowForm(false)
      setEditingTemplate(null)
      setFormData({ name: '', description: '', preview_url: '', data: '{}', is_active: true })
      fetchTemplates()
    } catch (err) {
      alert('Ошибка сохранения: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || '',
      preview_url: template.preview_url || '',
      data: JSON.stringify(template.data, null, 2),
      is_active: template.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить шаблон?')) return
    try {
      await api.delete(`/api/admin/templates/${id}`)
      fetchTemplates()
    } catch (err) {
      alert('Ошибка удаления')
    }
  }

  const handleToggleActive = async (template) => {
    try {
      await api.put(`/api/admin/templates/${template.id}`, {
        ...template,
        is_active: !template.is_active
      })
      fetchTemplates()
    } catch (err) {
      alert('Ошибка изменения статуса')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (loading) return <div style={styles.loading}>Загрузка...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Управление шаблонами</h1>
          <p style={styles.subtitle}>Создание и редактирование шаблонов визиток</p>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/dashboard')} style={styles.dashboardButton}>
            В дашборд
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Выйти
          </button>
        </div>
      </div>

      <div style={styles.toolbar}>
        <button onClick={() => { setEditingTemplate(null); setFormData({ name: '', description: '', preview_url: '', data: '{}', is_active: true }); setShowForm(true) }} style={styles.createButton}>
          + Новый шаблон
        </button>
      </div>

      {showForm && (
        <div style={styles.formContainer}>
          <h2 style={styles.formTitle}>{editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон'}</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Название *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.textarea}
                rows="3"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>URL превью (картинка)</label>
              <input
                type="text"
                value={formData.preview_url}
                onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                style={styles.input}
                placeholder="https://example.com/preview.jpg"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Данные шаблона (JSON)</label>
              <textarea
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                style={styles.jsonInput}
                rows="6"
              />
              <small style={styles.hint}>
                Пример: {"{\"primaryColor\": \"#166534\", \"secondaryColor\": \"#f0fdf4\", \"font\": \"Arial\"}"}
              </small>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={styles.checkbox}
                />
                Активен (доступен пользователям)
              </label>
            </div>

            <div style={styles.formButtons}>
              <button type="submit" style={styles.saveButton}>Сохранить</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingTemplate(null) }} style={styles.cancelButton}>Отмена</button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.templatesGrid}>
        {templates.map(template => (
          <div key={template.id} style={styles.templateCard}>
            <div style={styles.templateHeader}>
              <h3 style={styles.templateName}>{template.name}</h3>
              <span style={template.is_active ? styles.activeBadge : styles.inactiveBadge}>
                {template.is_active ? 'Активен' : 'Неактивен'}
              </span>
            </div>
            
            {template.description && (
              <p style={styles.templateDescription}>{template.description}</p>
            )}
            
            {template.preview_url && (
              <img src={template.preview_url} alt={template.name} style={styles.templatePreview} />
            )}
            
            <details style={styles.details}>
              <summary style={styles.summary}>Данные шаблона (JSON)</summary>
              <pre style={styles.pre}>{JSON.stringify(template.data, null, 2)}</pre>
            </details>
            
            <div style={styles.templateActions}>
              <button onClick={() => handleEdit(template)} style={styles.editButton}>
                Редактировать
              </button>
              <button onClick={() => handleToggleActive(template)} style={template.is_active ? styles.deactivateButton : styles.activateButton}>
                {template.is_active ? 'Деактивировать' : 'Активировать'}
              </button>
              <button onClick={() => handleDelete(template.id)} style={styles.deleteButton}>
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  header: {
    backgroundColor: '#166534',
    borderRadius: '15px',
    padding: '25px 30px',
    marginBottom: '25px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
  },
  title: {
    color: 'white',
    fontSize: '28px',
    marginBottom: '8px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  subtitle: {
    color: '#dcfce7',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
  },
  dashboardButton: {
    padding: '10px 20px',
    backgroundColor: '#22c55e',
    color: '#1e293b',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  adminButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#475569',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  toolbar: {
    marginBottom: '25px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  createButton: {
    padding: '12px 24px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  formContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '30px',
    border: '1px solid #dcfce7',
  },
  formTitle: {
    fontSize: '20px',
    color: '#166534',
    marginBottom: '20px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    resize: 'vertical',
  },
  jsonInput: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    fontFamily: 'monospace',
    backgroundColor: '#f8fafc',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  checkboxGroup: {
    marginTop: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#374151',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  formButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#9ca3af',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  templatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e5e7eb',
  },
  templateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  templateName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#166534',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
    color: '#7f1d1d',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  templateDescription: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '15px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  templatePreview: {
    maxWidth: '100%',
    maxHeight: '120px',
    borderRadius: '8px',
    marginBottom: '15px',
    objectFit: 'cover',
  },
  details: {
    marginBottom: '15px',
  },
  summary: {
    cursor: 'pointer',
    color: '#3b82f6',
    fontSize: '13px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  pre: {
    backgroundColor: '#f8fafc',
    padding: '10px',
    borderRadius: '8px',
    fontSize: '11px',
    overflow: 'auto',
    marginTop: '8px',
    fontFamily: 'monospace',
  },
  templateActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  deactivateButton: {
    padding: '6px 12px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  activateButton: {
    padding: '6px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#7f1d1d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#666',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
}

export default TemplateManager