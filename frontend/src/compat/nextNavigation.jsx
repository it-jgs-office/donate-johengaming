import { useMemo } from 'react'
import { useLocation, useNavigate, useParams as useReactParams, useSearchParams as useReactSearchParams } from 'react-router-dom'

export function useRouter() {
  const navigate = useNavigate()

  return useMemo(() => ({
    push: (path) => navigate(path),
    replace: (path) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    refresh: () => window.location.reload(),
  }), [navigate])
}

export function usePathname() {
  return useLocation().pathname
}

export function useParams() {
  return useReactParams()
}

export function useSearchParams() {
  const [params] = useReactSearchParams()
  return params
}

export function redirect(path) {
  window.location.replace(path)
  return null
}

export function notFound() {
  window.location.replace('/404')
  return null
}
