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
        console.log('Ответ от /api/templates/:id:', templateRes.data)
        setTemplate(templateRes.data)
      } else {
        console.log('template_id отсутствует у визитки')
      }
    } catch (err) {
      setError('Визитка не найдена')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneClick = () => {
    if (card?.data?.phone) window.location.href = `tel:${card.data.phone}`
  }
  const handleEmailClick = () => {
    if (card?.data?.email) window.location.href = `mailto:${card.data.email}`
  }
  const handleWebsiteClick = () => {
    window.open(websiteUrl, '_blank')
  }
  const handleTelegramClick = () => {
    if (card?.data?.telegram) window.open(card.data.telegram, '_blank')
  }
  const handleMaxLinkClick = () => {
    if (card?.data?.max_link) window.open(card.data.max_link, '_blank')
  }
  const handleSaveContact = () => {
    const fullName = `${card.data?.lastName || ''} ${card.data?.firstName || ''} ${card.data?.patronymic || ''}`.trim()
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${fullName}
TITLE:${card.data?.position || ''}
ORG:${card.data?.company || 'ГК АГРОЭКО'}
TEL:${card.data?.phone || ''}
EMAIL:${card.data?.email || ''}
URL:${card.data?.website || 'https://agroeco.ru/'}
END:VCARD`
    const blob = new Blob([vCard], { type: 'text/vcard' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fullName || 'contact'}.vcf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const layoutType = template?.layout_type || 'vertical'
  const data = card?.data || {}
  const fullName = `${data.lastName || ''} ${data.firstName || ''} ${data.patronymic || ''}`.trim()
  const companyName = data.company || 'ГК АГРОЭКО'
  const websiteUrl = data.website || 'https://agroeco.ru/'

  const baseStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #166534 0%, #14532d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, Helvetica, sans-serif',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      padding: '30px',
      maxWidth: '500px',
      width: '100%',
    },
    avatar: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      objectFit: 'cover',
      border: '3px solid #15803d',
    },
    name: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: '0 0 8px 0',
      color: '#1e293b',
    },
    position: {
      fontSize: '16px',
      color: '#15803d',
      marginBottom: '8px',
    },
    company: {
      fontSize: '14px',
      color: '#666',
      marginBottom: '20px',
    },
    divider: {
      height: '1px',
      backgroundColor: '#e5e7eb',
      margin: '20px 0',
    },
    contactButton: {
      width: '100%',
      padding: '10px',
      marginBottom: '10px',
      backgroundColor: '#f3f4f6',
      border: '1px solid #15803d',
      borderRadius: '10px',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    emailButton: {
      width: '100%',
      padding: '10px',
      marginBottom: '10px',
      backgroundColor: '#f3f4f6',
      border: '1px solid #15803d',
      borderRadius: '10px',
      cursor: 'pointer',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#3b82f6',
      textDecoration: 'underline',
    },
    saveButton: {
      width: '100%',
      padding: '12px',
      backgroundColor: '#15803d',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: 'bold',
    },
    views: {
      marginTop: '20px',
      fontSize: '12px',
      color: '#999',
      textAlign: 'center',
    },
  }

  const verticalStyles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    padding: '30px',
    maxWidth: '500px',
    width: '100%',
  },
  avatarContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #15803d',
  },
  textCenter: {
    textAlign: 'center',
  },
  name: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#1e293b',
  },
  position: {
    fontSize: '16px',
    color: '#15803d',
    marginBottom: '8px',
  },
  company: {
    fontSize: '14px',
    color: '#15803d',
    marginBottom: '20px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '20px 0',
  },
  row: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
  },
  siteButton: {
  width: '100%',
  padding: '12px',
  backgroundColor: '#15803d',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
  textAlign: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontSize: '14px',
  fontWeight: '500',
  marginBottom: '15px',
  },
  contactButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #15803d',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
  },
  emailButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #15803d',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#3b82f6',
    textDecoration: 'underline',
  },
  socialRow: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
  },
  socialButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  saveButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
  },
  views: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
  },
}

  const horizontalStyles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    padding: '30px',
    maxWidth: '700px',
    width: '100%',
    display: 'flex',
    gap: '40px',
    flexWrap: 'wrap',
  },
  leftColumn: {
    flex: 1,
    minWidth: '180px',
    textAlign: 'center',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #15803d',
    marginBottom: '15px',
  },
  name: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#1e293b',
  },
  position: {
    fontSize: '14px',
    color: '#15803d',
    marginBottom: '0',
  },
  rightColumn: {
    flex: 2,
    minWidth: '250px',
  },
  row: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  siteButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '15px',
  },
  contactButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #15803d',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  emailButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #15803d',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#3b82f6',
    textDecoration: 'underline',
  },
  socialButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  saveButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px',
    marginTop: '10px',
  },
  views: {
    marginTop: '20px',
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
  },
}

  const renderVertical = () => (
  <div style={verticalStyles.card}>
    {data.avatar && (
      <div style={verticalStyles.avatarContainer}>
        <img src={data.avatar} alt="avatar" style={verticalStyles.avatar} />
      </div>
    )}

    <div style={verticalStyles.textCenter}>
      <h1 style={verticalStyles.name}>{fullName || 'Без имени'}</h1>
      {data.position && <p style={verticalStyles.position}>{data.position}</p>}
      {companyName && <p style={verticalStyles.company}>{companyName}</p>}
    </div>

    <div style={verticalStyles.divider} />
    {websiteUrl && (
      <button onClick={handleWebsiteClick} style={verticalStyles.siteButton}>
        Сайт группы компаний
      </button>
    )}
    <div style={verticalStyles.row}>
      {data.phone && (
        <button onClick={handlePhoneClick} style={verticalStyles.contactButton}>
          {data.phone}
        </button>
      )}
      {data.email && (
        <button onClick={handleEmailClick} style={verticalStyles.emailButton}>
          {data.email}
        </button>
      )}
    </div>

    <div style={verticalStyles.socialRow}>
      {data.telegram && (
        <button onClick={handleTelegramClick} style={verticalStyles.socialButton}>
          Telegram
        </button>
      )}
      {data.max_link && (
        <button onClick={handleMaxLinkClick} style={verticalStyles.socialButton}>
          Max
        </button>
      )}
    </div>

    <div style={verticalStyles.divider} />

    <button onClick={handleSaveContact} style={verticalStyles.saveButton}>
      Сохранить контакт
    </button>

    <p style={verticalStyles.views}>{card?.views || 0} просмотров</p>
  </div>
)

  const renderHorizontal = () => (
  <div style={horizontalStyles.container}>
    <div style={horizontalStyles.leftColumn}>
      {data.avatar && (
        <img src={data.avatar} alt="avatar" style={horizontalStyles.avatar} />
      )}
      <h1 style={horizontalStyles.name}>{fullName || 'Без имени'}</h1>
      {data.position && <p style={horizontalStyles.position}>{data.position}</p>}
      {companyName && <p style={horizontalStyles.company}>{companyName}</p>}
    </div>

    <div style={horizontalStyles.rightColumn}>
      {websiteUrl && (
        <button onClick={handleWebsiteClick} style={horizontalStyles.siteButton}>
          Сайт Группы компаний
        </button>
      )}

      <div style={horizontalStyles.row}>
        {data.phone && (
          <button onClick={handlePhoneClick} style={horizontalStyles.contactButton}>
            {data.phone}
          </button>
        )}
        {data.email && (
          <button onClick={handleEmailClick} style={horizontalStyles.emailButton}>
            {data.email}
          </button>
        )}
      </div>

      <div style={horizontalStyles.row}>
        {data.telegram && (
          <button onClick={handleTelegramClick} style={horizontalStyles.socialButton}>
            Telegram
          </button>
        )}
        {data.max_link && (
          <button onClick={handleMaxLinkClick} style={horizontalStyles.socialButton}>
            Max
          </button>
        )}
      </div>

      <button onClick={handleSaveContact} style={horizontalStyles.saveButton}>
        Сохранить контакт
      </button>

      <p style={horizontalStyles.views}>{card?.views || 0} просмотров</p>
    </div>
  </div>
)

  const renderCompact = () => (
  <div style={verticalStyles.card}>
    {data.avatar && (
      <div style={verticalStyles.avatarContainer}>
        <img src={data.avatar} alt="avatar" style={verticalStyles.avatar} />
      </div>
    )}

    <div style={verticalStyles.textCenter}>
      <h1 style={verticalStyles.name}>{fullName || 'Без имени'}</h1>
      {data.position && <p style={verticalStyles.position}>{data.position}</p>}
      {companyName && <p style={verticalStyles.company}>{companyName}</p>}
    </div>

    <div style={verticalStyles.divider} />

    <div style={verticalStyles.socialRow}>
      {data.telegram && (
        <button onClick={handleTelegramClick} style={verticalStyles.socialButton}>
          Telegram
        </button>
      )}
      {data.max_link && (
        <button onClick={handleMaxLinkClick} style={verticalStyles.socialButton}>
          Max
        </button>
      )}
    </div>

    <div style={verticalStyles.divider} />

    <button onClick={handleSaveContact} style={verticalStyles.saveButton}>
      Сохранить контакт
    </button>

    <p style={verticalStyles.views}>👁️ {card?.views || 0} просмотров</p>
  </div>
)

  if (loading) return <div style={baseStyles.container}><div style={baseStyles.card}>Загрузка...</div></div>
  if (error) return <div style={baseStyles.container}><div style={baseStyles.card}><h2>{error}</h2><button onClick={() => navigate('/')}>На главную</button></div></div>

  console.log('layoutType =', layoutType)
  console.log('Шаблон:', template)
  console.log('layoutType:', template?.layout_type)

  if (layoutType === 'horizontal') return <div style={baseStyles.container}>{renderHorizontal()}</div>
  if (layoutType === 'compact') return <div style={baseStyles.container}>{renderCompact()}</div>
  return <div style={baseStyles.container}>{renderVertical()}</div>
}

export default PublicCard