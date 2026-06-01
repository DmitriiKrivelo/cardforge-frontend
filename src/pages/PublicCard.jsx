import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

function PublicCard() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [card, setCard] = useState(null)
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCard()
  }, [slug])

  const fetchCard = async () => {
    try {
      const response = await api.get(`/api/cards/${slug}`)
      setCard(response.data)
      
      if (response.data.template_id) {
        const templateRes = await api.get(`/api/templates/${response.data.template_id}`)
        setTemplate(templateRes.data)
      }
    } catch (err) {
      setError('Визитка не найдена')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneClick = () => {
    if (card?.data?.phone) {
      window.location.href = `tel:${card.data.phone}`
    }
  }

  const handleEmailClick = () => {
    if (card?.data?.email) {
      window.location.href = `mailto:${card.data.email}`
    }
  }

  const handleWebsiteClick = () => {
    if (card?.data?.website) {
      window.open(card.data.website, '_blank')
    }
  }

  const handleSocialClick = (url, type) => {
    if (!url) return
    
    let fullUrl = url
    if (type === 'telegram' && !url.includes('t.me')) {
      fullUrl = `https://t.me/${url.replace('@', '')}`
    } else if (type === 'linkedin' && !url.includes('linkedin.com')) {
      fullUrl = `https://linkedin.com/in/${url}`
    } else if (type === 'instagram' && !url.includes('instagram.com')) {
      fullUrl = `https://instagram.com/${url}`
    }
    
    window.open(fullUrl, '_blank')
  }

  const handleSaveContact = () => {
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${card.data.name || ''}
TITLE:${card.data.position || ''}
ORG:${card.data.company || ''}
TEL:${card.data.phone || ''}
EMAIL:${card.data.email || ''}
URL:${card.data.website || ''}
END:VCARD`

    const blob = new Blob([vCard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${card.data.name || 'contact'}.vcf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const templateData = template?.data || {}
  const primaryColor = templateData.primaryColor || '#166534'
  const secondaryColor = templateData.secondaryColor || '#f0fdf4'
  const font = templateData.font || 'Arial'

  const styles = {
    container: {
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: font,
    },
    card: {
      maxWidth: '500px',
      width: '100%',
      background: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      textAlign: 'center',
      fontFamily: font,
    },
    avatar: {
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      objectFit: 'cover',
      marginBottom: '20px',
      border: `4px solid ${primaryColor}`,
      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    },
    name: {
      fontSize: '28px',
      marginBottom: '8px',
      color: '#1e293b',
      fontFamily: font,
    },
    position: {
      fontSize: '18px',
      color: primaryColor,
      marginBottom: '5px',
      fontFamily: font,
    },
    company: {
      fontSize: '16px',
      color: '#666',
      marginBottom: '20px',
      fontFamily: font,
    },
    divider: {
      height: '1px',
      background: '#e0e0e0',
      margin: '20px 0',
    },
    contactButton: {
      width: '100%',
      padding: '12px',
      marginBottom: '10px',
      backgroundColor: '#f8f9fa',
      border: `1px solid ${primaryColor}`,
      borderRadius: '10px',
      fontSize: '16px',
      color: '#333',
      cursor: 'pointer',
      transition: 'all 0.3s',
      textAlign: 'left',
      fontFamily: font,
    },
    socialRow: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'center',
      marginBottom: '20px',
    },
    socialButton: {
      flex: 1,
      padding: '10px',
      backgroundColor: primaryColor,
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: font,
    },
    saveButton: {
      width: '100%',
      padding: '14px',
      backgroundColor: primaryColor,
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontFamily: font,
    },
    views: {
      marginTop: '20px',
      fontSize: '12px',
      color: '#999',
      fontFamily: font,
    },
    loading: {
      textAlign: 'center',
      color: '#666',
    },
    error: {
      textAlign: 'center',
      color: '#e74c3c',
      marginBottom: '20px',
    },
    button: {
      padding: '10px 20px',
      backgroundColor: primaryColor,
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
    },
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.loading}>Загрузка...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.error}>{error}</h2>
          <button onClick={() => navigate('/')} style={styles.button}>
            На главную
          </button>
        </div>
      </div>
    )
  }

  const data = card?.data || {}

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {data.avatar && (
          <img src={data.avatar} alt="avatar" style={styles.avatar} />
        )}

        <h1 style={styles.name}>{data.name || 'Без имени'}</h1>
        {data.position && <p style={styles.position}>{data.position}</p>}
        {data.company && <p style={styles.company}>{data.company}</p>}

        <div style={styles.divider} />

        {data.phone && (
          <button onClick={handlePhoneClick} style={styles.contactButton}>
            {data.phone}
          </button>
        )}

        {data.email && (
          <button onClick={handleEmailClick} style={styles.contactButton}>
            {data.email}
          </button>
        )}

        {data.website && (
          <button onClick={handleWebsiteClick} style={styles.contactButton}>
            {data.website}
          </button>
        )}

        <div style={styles.socialRow}>
          {data.linkedin && (
            <button onClick={() => handleSocialClick(data.linkedin, 'linkedin')} style={styles.socialButton}>
              LinkedIn
            </button>
          )}
          {data.telegram && (
            <button onClick={() => handleSocialClick(data.telegram, 'telegram')} style={styles.socialButton}>
              Telegram
            </button>
          )}
          {data.instagram && (
            <button onClick={() => handleSocialClick(data.instagram, 'instagram')} style={styles.socialButton}>
              Instagram
            </button>
          )}
        </div>

        <div style={styles.divider} />

        <button onClick={handleSaveContact} style={styles.saveButton}>
          Сохранить контакт
        </button>

        <p style={styles.views}>Просмотров: {card?.views || 0}</p>
      </div>
    </div>
  )
}

export default PublicCard