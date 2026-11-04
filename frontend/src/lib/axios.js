import axios from 'axios'
import { startLoading, stopLoading } from '@/utils/loadingManager'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '').replace(/\/$/, ''),
  timeout: 10000,
})

api.interceptors.request.use((config) => {
  config.__johenLoading = config.skipGlobalLoading !== true
  if (config.__johenLoading) startLoading()
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => {
    if (response.config.__johenLoading) stopLoading()
    return response
  },
  (error) => {
    if (error.config?.__johenLoading) stopLoading()
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  },
)

export default api
