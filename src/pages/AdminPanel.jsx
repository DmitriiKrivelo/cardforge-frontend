import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

function AdminPanel() {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [cards, setCards] = useState([])
  const [activeTab, setActiveTab] = useState('stats')
  const [loading, setLoading] = useState(true)
  const [currentAdminId, setCurrentAdminId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchCurrentAdmin()
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchCurrentAdmin = async () => {
    try {
      const me = await api.get('/api/auth/me')
      setCurrentAdminId(me.data.id)
    } catch (err) {
      console.error('Ошибка загрузки текущего пользователя')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'stats') {
        const res = await api.get('/api/admin/stats')
        setStats(res.data)
      } else if (activeTab === 'users') {
        const res = await api.get('/api/admin/users')
        setUsers(res.data)
      } else if (activeTab === 'cards') {
        const res = await api.get('/api/admin/cards')
        setCards(res.data)
      }
    } catch (err) {
      if (err.response?.status === 403) {
        alert('У вас нет прав администратора')
        navigate('/dashboard')
      } else if (err.response?.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId, newRole, currentUserRole, currentUserId) => {
    if (userId === currentUserId) {
      alert('Вы не можете изменить свою собственную роль')
      return
    }

    if (currentUserRole === 'admin' && newRole === 'user') {
      if (!confirm('Внимание! Вы понижаете этого пользователя до обычного. Он потеряет доступ к админ-панели. Продолжить?')) {
        return
      }
    }

    try {
      await api.put(`/api/admin/users/${userId}/role`, { role: newRole })
      fetchData()
      alert('Роль успешно изменена')
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка изменения роли')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (userId === currentAdminId) {
      alert('Вы не можете удалить свой собственный аккаунт')
      return
    }
    if (!confirm('Удалить пользователя? Все его визитки также будут удалены.')) return
    try {
      await api.delete(`/api/admin/users/${userId}`)
      fetchData()
    } catch (err) {
      alert('Ошибка удаления')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Админ-панель</h1>
          <p style={styles.subtitle}>Управление пользователями и визитками</p>
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

      <div style={styles.tabBar}>
        <button
          onClick={() => setActiveTab('stats')}
          style={activeTab === 'stats' ? styles.tabActive : styles.tab}
        >
          Статистика
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={activeTab === 'users' ? styles.tabActive : styles.tab}
        >
          Пользователи
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          style={activeTab === 'cards' ? styles.tabActive : styles.tab}
        >
          Визитки
        </button>
      </div>

      <div style={styles.content}>
        {loading && <p style={styles.loading}>Загрузка...</p>}

        {!loading && activeTab === 'stats' && stats && (
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h2 style={styles.statNumber}>{stats.users}</h2>
              <p style={styles.statLabel}>Пользователей</p>
            </div>
            <div style={styles.statCard}>
              <h2 style={styles.statNumber}>{stats.cards}</h2>
              <p style={styles.statLabel}>Визиток</p>
            </div>
            <div style={styles.statCard}>
              <h2 style={styles.statNumber}>{stats.totalViews}</h2>
              <p style={styles.statLabel}>Всего просмотров</p>
            </div>
          </div>
        )}

        {!loading && activeTab === 'users' && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Имя</th>
                  <th style={styles.th}>Роль</th>
                  <th style={styles.th}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={styles.td}>{user.id}</td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>{user.name || '-'}</td>
                    <td style={styles.td}>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value, user.role, currentAdminId)}
                        style={{
                          ...styles.select,
                          backgroundColor: user.id === currentAdminId ? '#f3f4f6' : 'white',
                          cursor: user.id === currentAdminId ? 'not-allowed' : 'pointer'
                        }}
                        disabled={user.id === currentAdminId}
                      >
                        <option value="user">Пользователь</option>
                        <option value="admin">Администратор</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        style={{
                          ...styles.deleteButton,
                          backgroundColor: user.id === currentAdminId ? '#9ca3af' : '#7f1d1d',
                          cursor: user.id === currentAdminId ? 'not-allowed' : 'pointer'
                        }}
                        disabled={user.id === currentAdminId}
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && activeTab === 'cards' && (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Название</th>
                  <th style={styles.th}>Владелец</th>
                  <th style={styles.th}>Просмотры</th>
                  <th style={styles.th}>Статус</th>
                </tr>
              </thead>
              <tbody>
                {cards.map(card => (
                  <tr key={card.id}>
                    <td style={styles.td}>{card.id}</td>
                    <td style={styles.td}>{card.title}</td>
                    <td style={styles.td}>{card.user_email}</td>
                    <td style={styles.td}>{card.views}</td>
                    <td style={styles.td}>{card.is_active ? 'Активна' : 'Архивирована'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  tabBar: {
    display: 'flex',
    gap: '5px',
    marginBottom: '25px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
    transition: 'all 0.2s',
  },
  tabActive: {
    padding: '12px 24px',
    backgroundColor: '#15803d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
  },
  statCard: {
    backgroundColor: '#f0fdf4',
    padding: '25px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid #dcfce7',
  },
  statNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: '8px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  statLabel: {
    fontSize: '14px',
    color: '#4b5563',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 'bold',
    color: '#374151',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    color: '#4b5563',
  },
  select: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  deleteButton: {
    padding: '6px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
}

export default AdminPanel