import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

function Dashboard() {
  const [cards, setCards] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchUser()
    fetchCards()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/auth/me')
      setUser(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      }
    }
  }

  const fetchCards = async () => {
    try {
      const response = await api.get('/api/cards')
      setCards(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить визитку?')) return
    try {
      await api.delete(`/api/cards/${id}`)
      fetchCards()
    } catch (err) {
      alert('Ошибка удаления')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Загрузка...</div>

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', padding: 20 }}>
      {/* Шапка */}
      <div style={{
        backgroundColor: '#166534',
        borderRadius: '15px',
        padding: '20px 30px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        color: 'white'
      }}>
        <div>
          <h1 style={{ margin: 0, color: 'white', fontSize: '28px' }}>Мои визитки</h1>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
              <span>{user.email}</span>
              {user.role === 'admin' ? (
                <span style={{ backgroundColor: '#22c55e', color: '#1e293b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  Администратор
                </span>
              ) : (
                <span style={{ backgroundColor: '#22c55e', color: '#1e293b', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                  Пользователь
                </span>
              )}
            </div>
          )}
        </div>
        <button onClick={handleLogout} style={{ padding: '10px 24px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Выйти
        </button>
      </div>

      {/* Кнопки действий */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '15px 20px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '15px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {user?.role === 'admin' && (
            <>
              <Link to="/admin/templates">
                <button style={{ padding: '10px 20px', backgroundColor: '#22c55e', color: '#1e293b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Управление шаблонами
                </button>
              </Link>
              <Link to="/admin">
                <button style={{ padding: '10px 20px', backgroundColor: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Админ-панель
                </button>
              </Link>
            </>
          )}
        </div>
        <Link to="/reports">
          <button style={{ padding: '10px 24px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Сформировать отчет
          </button>
        </Link>
        <Link to="/builder">
          <button style={{ padding: '10px 24px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Создать визитку
          </button>
        </Link>
      </div>

      {/* Список визиток */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {cards.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'white',
            borderRadius: '15px',
            color: '#666'
          }}>
            <p style={{ fontSize: '18px' }}>У вас пока нет визиток</p>
            <Link to="/builder">
              <button style={{ marginTop: '15px', padding: '10px 24px', backgroundColor: '#15803d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Создать первую визитку
              </button>
            </Link>
          </div>
        )}

        {cards.map((card) => (
          <div key={card.id} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ marginBottom: '8px', color: '#1e293b' }}>{card.title}</h3>
                <p style={{ marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                  Ссылка: <code style={{ fontSize: '12px' }}>{`http://localhost:5173/card/${card.slug}`}</code>
                </p>
                <p style={{ marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                  Просмотров: {card.views}
                </p>
                <p style={{ marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                  {card.is_active ? 'Активна' : 'Архивирована'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Link to={`/builder?id=${card.id}`}>
                  <button style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}>
                    Редактировать
                  </button>
                </Link>
                <button
                  onClick={() => window.open(`http://localhost:3000/api/cards/${card.slug}/qr`, '_blank')}
                  style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                >
                  QR-код
                </button>
                <button
                  onClick={() => handleDelete(card.id)}
                  style={{ padding: '6px 12px', backgroundColor: '#7f1d1d', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard