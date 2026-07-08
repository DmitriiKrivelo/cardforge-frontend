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
  const [avatarPreview, setAvatarPreview] = useState('')
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    patronymic: '',
    position: '',
    phone: '',
    email: '',
    telegram: '',
    max_link: '',
    avatar: ''
  })

  const companyName = 'ГК АГРОЭКО'
  const fixedWebsite = 'https://agroeco.ru/'

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
      setFormData({
        lastName: card.data?.lastName || '',
        firstName: card.data?.firstName || '',
        patronymic: card.data?.patronymic || '',
        position: card.data?.position || '',
        phone: card.data?.phone || '',
        email: card.data?.email || '',
        telegram: card.data?.telegram || '',
        max_link: card.data?.max_link || '',
        avatar: card.data?.avatar || ''
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

  const handlePhoneChange = (e) => {
    let value = e.target.value
    let digits = value.replace(/\D/g, '')
    if (digits.length > 0) {
      if (digits[0] === '8') digits = '7' + digits.slice(1)
      let formatted = '+7'
      if (digits.length > 1) formatted += ' ' + digits.slice(1, 4)
      if (digits.length >= 4) formatted += ' ' + digits.slice(4, 7)
      if (digits.length >= 7) formatted += ' ' + digits.slice(7, 9)
      if (digits.length >= 9) formatted += ' ' + digits.slice(9, 11)
      setFormData({ ...formData, phone: formatted.trim() })
    } else {
      setFormData({ ...formData, phone: '' })
    }
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
    setAvatarPreview(URL.createObjectURL(file))
    setUploading(true)
    const formDataFile = new FormData()
    formDataFile.append('avatar', file)
    try {
      const response = await api.post('/api/upload/avatar', formDataFile, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setFormData(prev => ({ ...prev, avatar: response.data.avatarUrl }))
    } catch (err) {
      console.error('Ошибка загрузки:', err)
      alert('Ошибка загрузки изображения')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview('')
    setFormData(prev => ({ ...prev, avatar: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const data = {
      title,
      templateId,
      data: {
        ...formData,
        company: companyName,
        website: fixedWebsite,
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

  const getLayoutDescription = (layoutType) => {
    switch (layoutType) {
      case 'vertical': return { icon: '📄', text: 'Вертикальная — аватар сверху, вся информация в столбик' }
      case 'horizontal': return { icon: '↔️', text: 'Горизонтальная — аватар слева, контакты справа' }
      case 'compact': return { icon: '🔹', text: 'Краткая — только аватар, ФИО и соцсети' }
      default: return { icon: '📄', text: 'Стандартный макет' }
    }
  }

  const selectedTemplate = templates.find(t => t.id === templateId)

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{cardId ? 'Редактировать визитку' : 'Создать визитку'}</h1>
          <p style={styles.subtitle}>Заполните информацию о себе</p>
        </div>
        <button onClick={() => navigate('/dashboard')} style={styles.dashboardButton}>В дашборд</button>
      </div>

      <div style={styles.formContainer}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Основная информация */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Основная информация</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Название визитки *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required style={styles.input} placeholder="Например: Рабочая визитка" />
              <small style={styles.hint}>Название для вашего удобства</small>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Шаблон</label>
              <select value={templateId} onChange={(e) => setTemplateId(Number(e.target.value))} style={styles.select}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {/* Превью шаблона */}
            {selectedTemplate && (
              <div style={styles.previewBox}>
                <div style={styles.previewTitle}>Предпросмотр макета:</div>
                <div style={styles.previewContent}>
                  <span style={styles.previewIcon}>{getLayoutDescription(selectedTemplate.layout_type).icon}</span>
                  <span>{getLayoutDescription(selectedTemplate.layout_type).text}</span>
                </div>
                {selectedTemplate.preview_url && (
                  <div style={styles.previewImageContainer}>
                    <img src={selectedTemplate.preview_url} alt="preview" style={styles.previewImage} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Личная информация */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Личная информация</h2>
            <div style={styles.formRow}>
              <div style={styles.formGroup}><label style={styles.label}>Фамилия *</label><input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required style={styles.input} placeholder="Иванов" /></div>
              <div style={styles.formGroup}><label style={styles.label}>Имя *</label><input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required style={styles.input} placeholder="Иван" /></div>
              <div style={styles.formGroup}><label style={styles.label}>Отчество</label><input type="text" name="patronymic" value={formData.patronymic} onChange={handleChange} style={styles.input} placeholder="Иванович" /></div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}><label style={styles.label}>Должность</label><input type="text" name="position" value={formData.position} onChange={handleChange} style={styles.input} placeholder="Ведущий специалист" /></div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}><label style={styles.label}>Компания</label><input type="text" value={companyName} disabled style={{ ...styles.input, backgroundColor: '#f3f4f6', cursor: 'not-allowed' }} /><small style={styles.hint}>Поле фиксировано</small></div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}><label style={styles.label}>Телефон *</label><input type="tel" name="phone" value={formData.phone} onChange={handlePhoneChange} required style={styles.input} placeholder="+7 999 123 45 67" /></div>
              <div style={styles.formGroup}><label style={styles.label}>Email *</label><input type="email" name="email" value={formData.email} onChange={handleChange} required style={styles.input} placeholder="example@agroeco.ru" /></div>
            </div>
            <div style={styles.formRow}>
              <div style={styles.formGroup}><label style={styles.label}>Сайт</label><input type="url" value={fixedWebsite} disabled style={{ ...styles.input, backgroundColor: '#f3f4f6', cursor: 'not-allowed' }} /><small style={styles.hint}>Поле фиксировано</small></div>
            </div>
          </div>

          {/* Ссылки */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Ссылки</h2>
            <div style={styles.formRow}>
              <div style={styles.formGroup}><label style={styles.label}>Telegram</label><input type="url" name="telegram" value={formData.telegram} onChange={handleChange} style={styles.input} placeholder="https://t.me/username" /><small style={styles.hint}>Ссылка на Telegram-аккаунт</small></div>
              <div style={styles.formGroup}><label style={styles.label}>Ссылка на Макс</label><input type="url" name="max_link" value={formData.max_link} onChange={handleChange} style={styles.input} placeholder="https://t.me/max или другой мессенджер" /><small style={styles.hint}>Telegram, WhatsApp, Viber...</small></div>
            </div>
          </div>

          {/* Фото */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Фото</h2>
            {(avatarPreview || formData.avatar) && (
              <div style={styles.avatarPreview}>
                <img src={avatarPreview || formData.avatar} alt="avatar" style={styles.avatarImage} />
                <button type="button" onClick={handleRemoveAvatar} style={styles.removeAvatarButton}>Удалить фото</button>
              </div>
            )}
            <div>
              <label style={styles.uploadButton}>{uploading ? 'Загрузка...' : 'Выбрать изображение'}<input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={styles.fileInput} /></label>
              <small style={styles.hint}>JPG, PNG, GIF (макс. 5MB)</small>
            </div>
          </div>

          <div style={styles.actionButtons}>
            <button type="submit" disabled={loading} style={styles.submitButton}>{loading ? 'Сохранение...' : (cardId ? 'Обновить визитку' : 'Создать визитку')}</button>
            <button type="button" onClick={() => navigate('/dashboard')} style={styles.cancelButton}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '20px auto', padding: '20px', fontFamily: 'Arial, Helvetica, sans-serif' },
  header: { backgroundColor: '#166534', borderRadius: '15px', padding: '25px 30px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  title: { color: 'white', fontSize: '28px', marginBottom: '8px', fontFamily: 'Arial, Helvetica, sans-serif' },
  subtitle: { color: '#dcfce7', fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif' },
  dashboardButton: { padding: '10px 20px', backgroundColor: '#22c55e', color: '#1e293b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'Arial, Helvetica, sans-serif' },
  formContainer: { backgroundColor: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  form: { display: 'flex', flexDirection: 'column', gap: '30px' },
  section: { borderBottom: '1px solid #e5e7eb', paddingBottom: '25px' },
  sectionTitle: { fontSize: '18px', fontWeight: 'bold', color: '#166534', marginBottom: '20px', fontFamily: 'Arial, Helvetica, sans-serif' },
  formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontWeight: '600', color: '#374151', fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif' },
  input: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif' },
  select: { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', backgroundColor: 'white' },
  hint: { fontSize: '12px', color: '#6b7280', marginTop: '4px', fontFamily: 'Arial, Helvetica, sans-serif' },
  previewBox: { marginTop: '15px', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '10px', borderLeft: '4px solid #15803d' },
  previewTitle: { fontSize: '13px', fontWeight: 'bold', color: '#166534', marginBottom: '10px', fontFamily: 'Arial, Helvetica, sans-serif' },
  previewContent: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: '#374151', fontFamily: 'Arial, Helvetica, sans-serif' },
  previewIcon: { fontSize: '24px' },
  previewImageContainer: { marginTop: '10px', textAlign: 'center' },
  previewImage: { maxWidth: '100%', maxHeight: '150px', borderRadius: '8px', border: '1px solid #d1d5db' },
  avatarPreview: { textAlign: 'center', marginBottom: '20px' },
  avatarImage: { width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #15803d', marginBottom: '10px' },
  removeAvatarButton: { padding: '6px 12px', backgroundColor: '#7f1d1d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontFamily: 'Arial, Helvetica, sans-serif', display: 'block', margin: '0 auto' },
  uploadButton: { display: 'inline-block', padding: '10px 20px', backgroundColor: '#15803d', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: 'Arial, Helvetica, sans-serif', marginRight: '10px' },
  fileInput: { display: 'none' },
  actionButtons: { display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '10px' },
  submitButton: { padding: '12px 24px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', fontFamily: 'Arial, Helvetica, sans-serif' },
  cancelButton: { padding: '12px 24px', backgroundColor: '#9ca3af', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', fontFamily: 'Arial, Helvetica, sans-serif' },
}

export default CardBuilder