import axios from 'axios'

const api = axios.create({
  baseURL: 'https://cardforge-backend.onrender.com',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  console.log('Interceptor: отправка запроса к', config.url, 'токен есть?', !!token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api