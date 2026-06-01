import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

function CardBuilder() {
  const [searchParams] = useSearchParams()
  const cardId = searchParams.get('id')
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [templateId, setTemplateId] = useState(1)
  const [templates, setTemplates] = useState([])
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    linkedin: '',
    telegram: '',
    instagram: '',
    avatar: ''
  })

  useEffect(() => {
    fetchTemplates()
    if (cardId) {
      fetchCard()
    }
  }, [cardId])

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/templates')
      setTemplates(response.data)
      if (response.data.length > 0 && !cardId) {
        setTemplateId(response.data[0].id)
      }
    } catch (err) {
      console.error('Ошибка загрузки шаблонов:', err)
    }
  }

  const fetchCard = async () => {
    try {
      const response = await api.get(`/api/cards/id/${cardId}`)
      const card = response.data
      setTitle(card.title)
      setTemplateId(card.template_id || 1)
      setFormData(card.data || {
        name: '',
        position: '',
        company: '',
        phone: '',
        email: '',
        website: '',
        linkedin: '',
        telegram: '',
        instagram: '',
        avatar: ''
      })
      if (card.data?.avatar) {
        setAvatarPreview(card.data.avatar)
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err)
      navigate('/dashboard')
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5MB')
      return
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
    setUploading(true)

    const formDataFile = new FormData()
    formDataFile.append('avatar', file)

    try {
      const response = await api.post('/api/upload/avatar', formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      setFormData(prev => ({
        ...prev,
        avatar: response.data.avatarUrl
      }))
    } catch (err) {
      console.error('Ошибка загрузки:', err)
      alert('Ошибка загрузки изображения')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview('')
    setFormData(prev => ({
      ...prev,
      avatar: ''
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const data = {
      title,
      templateId,
      data: {
        ...formData,
        avatar: formData.avatar || null
      }
    }

    try {
      if (cardId) {
        await api.put(`/api/cards/${cardId}`, data)
      } else {
        await api.post('/api/cards', data)
      }
      navigate('/dashboard')
    } catch (err) {
      console.error('Ошибка сохранения:', err)
      alert('Ошибка сохранения визитки')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{cardId ? 'Редактировать визитку' : 'Создать визитку'}</h1>
          <p style={styles.subtitle}>Заполните информацию о себе</p>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/dashboard')} style={styles.dashboardButton}>
            В дашборд
          </button>
        </div>
      </div>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Основная информация */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Основная информация</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Название визитки *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={styles.input}
                placeholder="Например: Рабочая визитка"
              />
              <small style={styles.hint}>Название для вашего удобства</small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Шаблон</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(Number(e.target.value))}
                style={styles.select}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Личная информация */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Личная информация</h2>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Имя и фамилия *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="Иван Петров"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Должность</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="CEO"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Компания</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="CardForge"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Телефон *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="+7 999 123-45-67"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="example@mail.com"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Сайт</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                style={styles.input}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Социальные сети */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Социальные сети</h2>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>LinkedIn</label>
                <input
                  type="text"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="username"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Telegram</label>
                <input
                  type="text"
                  name="telegram"
                  value={formData.telegram}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="@username"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Instagram</label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="username"
                />
              </div>
            </div>
          </div>

          {/* Фото, аватар */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Фото / Аватар</h2>
            
            {(avatarPreview || formData.avatar) && (
              <div style={styles.avatarPreview}>
                <img 
                  src={avatarPreview || formData.avatar} 
                  alt="Avatar preview" 
                  style={styles.avatarImage}
                />
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  style={styles.removeAvatarButton}
                >
                  Удалить фото
                </button>
              </div>
            )}
            
            <div>
              <label style={styles.uploadButton}>
                {uploading ? 'Загрузка...' : 'Выбрать изображение'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  style={styles.fileInput}
                />
              </label>
              <small style={styles.hint}>JPG, PNG, GIF (макс. 5MB)</small>
            </div>
          </div>

          {/* Кнопки действий */}
          <div style={styles.actionButtons}>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? 'Сохранение...' : (cardId ? 'Обновить визитку' : 'Создать визитку')}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelButton}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1000px',
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
  formContainer: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  section: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '25px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: '20px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
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
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    backgroundColor: 'white',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  avatarPreview: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  avatarImage: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #15803d',
    marginBottom: '10px',
  },
  removeAvatarButton: {
    padding: '6px 12px',
    backgroundColor: '#7f1d1d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    display: 'block',
    margin: '0 auto',
  },
  uploadButton: {
    display: 'inline-block',
    padding: '10px 20px',
    backgroundColor: '#15803d',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    marginRight: '10px',
  },
  fileInput: {
    display: 'none',
  },
  actionButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'flex-end',
    marginTop: '10px',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#9ca3af',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
}

export default CardBuilder