export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://donate.johengaming.id').replace(/\/$/, '')
export const SITE_DISPLAY_URL = SITE_URL.replace(/^https?:\/\//, '')
export const DONATION_URL_PREFIX = `${SITE_URL}/donate/`
