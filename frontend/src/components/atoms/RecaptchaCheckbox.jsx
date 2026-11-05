import { useEffect, useRef, useState } from 'react'

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''
const SCRIPT_ID = 'google-recaptcha-v2'

export default function RecaptchaCheckbox({ onChange, resetKey = 0 }) {
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const resetKeyRef = useRef(resetKey)
  const [scriptError, setScriptError] = useState(false)

  useEffect(() => {
    if (!SITE_KEY) {
      setScriptError(true)
      return undefined
    }

    let cancelled = false
    let retryTimer

    const renderWidget = () => {
      if (cancelled || widgetIdRef.current !== null || !containerRef.current) return

      if (!window.grecaptcha?.render) {
        retryTimer = window.setTimeout(renderWidget, 100)
        return
      }

      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token) => onChange(token),
        'expired-callback': () => onChange(''),
        'error-callback': () => onChange(''),
        theme: 'light',
      })
    }

    let script = document.getElementById(SCRIPT_ID)
    if (!script) {
      script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=id'
      script.async = true
      script.defer = true
      script.onerror = () => setScriptError(true)
      document.head.appendChild(script)
    }

    renderWidget()

    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
    }
  }, [onChange])

  useEffect(() => {
    if (resetKeyRef.current === resetKey) return

    resetKeyRef.current = resetKey
    if (widgetIdRef.current !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(widgetIdRef.current)
    }
    onChange('')
  }, [onChange, resetKey])

  if (scriptError) {
    return <p className="text-center text-xs font-semibold text-red-600">reCAPTCHA gagal dimuat. Muat ulang halaman.</p>
  }

  return (
    <div className="mx-auto h-[62px] w-[238px] overflow-hidden min-[360px]:h-[70px] min-[360px]:w-[274px] sm:h-[78px] sm:w-[304px]">
      <div ref={containerRef} className="origin-top-left scale-[0.78] min-[360px]:scale-90 sm:scale-100" />
    </div>
  )
}
