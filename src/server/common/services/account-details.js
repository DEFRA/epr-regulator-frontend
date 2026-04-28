import { config } from '../../../config/config.js'

function asNonEmptyString(value) {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return v || undefined
}

export function getAccountUserIdFromSessionUser(sessionUser) {
  if (typeof sessionUser === 'string') return asNonEmptyString(sessionUser)
  if (!sessionUser || typeof sessionUser !== 'object') return undefined

  const credentials =
    sessionUser.credentials && typeof sessionUser.credentials === 'object'
      ? sessionUser.credentials
      : {}

  const profile =
    sessionUser.profile && typeof sessionUser.profile === 'object'
      ? sessionUser.profile
      : credentials.profile && typeof credentials.profile === 'object'
        ? credentials.profile
        : {}

  return (
    asNonEmptyString(profile.oid) ||
    asNonEmptyString(profile.sub) ||
    asNonEmptyString(profile.userId) ||
    asNonEmptyString(profile.id) ||
    asNonEmptyString(credentials.userId) ||
    asNonEmptyString(credentials.user) ||
    asNonEmptyString(credentials.id) ||
    asNonEmptyString(sessionUser.userId) ||
    asNonEmptyString(sessionUser.user) ||
    asNonEmptyString(sessionUser.id)
  )
}

export async function getAccountDetails(userId, { headers } = {}) {
  const baseUrl =
    config.get('services.accountApi.baseUrl') || 'http://localhost:8085'
  const url = new URL(
    `/api/account/details/${encodeURIComponent(userId)}`,
    baseUrl
  )

  const fetchFn = globalThis.fetch
  if (typeof fetchFn !== 'function') {
    throw new Error('fetch is not available in this runtime')
  }

  const res = await fetchFn(url, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      ...(headers ?? {})
    }
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const msg = `Account details request failed (${res.status} ${res.statusText})`
    const err = new Error(body ? `${msg}: ${body}` : msg)
    err.statusCode = res.status
    throw err
  }

  return await res.json()
}
