import { createRoot } from 'react-dom/client'
import axios from 'axios'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './pages/globals.css'
import { startLoading, stopLoading } from './utils/loadingManager'

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
axios.defaults.baseURL = apiBase

const browserFetch = window.fetch.bind(window)
window.fetch = (input, init) => {
  const url = apiBase && typeof input === 'string' && input.startsWith('/api') ? `${apiBase}${input}` : input
  if (init?.skipGlobalLoading) {
    const requestInit = { ...init }
    delete requestInit.skipGlobalLoading
    return browserFetch(url, requestInit)
  }
  startLoading()
  return browserFetch(url, init).finally(stopLoading)
}

axios.interceptors.request.use((config) => {
  config.__johenLoading = config.skipGlobalLoading !== true
  if (config.__johenLoading) startLoading()
  return config
})

axios.interceptors.response.use(
  (response) => {
    if (response.config.__johenLoading) stopLoading()
    return response
  },
  (error) => {
    if (error.config?.__johenLoading) stopLoading()
    return Promise.reject(error)
  },
)

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <Toaster position="top-right" />
  </>,
)
