import { config } from '../../../config/config.js'

function asNonEmptyString(value) {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  return v || undefined
}

function asGuidString(value) {
  const v = asNonEmptyString(value)
  if (!v) return undefined
  // Accept canonical GUIDs (with or without braces) and normalise to plain GUID.
  const m =
    /^\{?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})}?$/i.exec(
      v
    )
  return m ? m[1] : undefined
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
    asGuidString(profile.oid) ||
    asGuidString(profile.sub) ||
    asGuidString(profile.userId) ||
    asGuidString(profile.id) ||
    asGuidString(credentials.userId) ||
    asGuidString(credentials.user) ||
    asGuidString(credentials.id) ||
    asGuidString(sessionUser.userId) ||
    asGuidString(sessionUser.user) ||
    asGuidString(sessionUser.id)
  )
}

/**
 * Map Account API DTO (`UserOrganisationsListModel`) to a stable view model.
 * @param {any} dto
 */
export function mapAccountDetailsDtoToViewModel(dto) {
  const root = dto && typeof dto === 'object' ? dto : {}
  const userCandidate =
    root.user && typeof root.user === 'object'
      ? root.user
      : root.User && typeof root.User === 'object'
        ? root.User
        : root

  const user =
    userCandidate && typeof userCandidate === 'object' ? userCandidate : {}

  const organisations = Array.isArray(user.organisations)
    ? user.organisations
    : Array.isArray(user.organizations)
      ? user.organizations
      : []

  const primaryOrganisation =
    organisations.length > 0 &&
    organisations[0] &&
    typeof organisations[0] === 'object'
      ? organisations[0]
      : {}

  const nationId =
    typeof primaryOrganisation.nationId === 'number'
      ? primaryOrganisation.nationId
      : typeof user.nationId === 'number'
        ? user.nationId
        : undefined

  return {
    firstName: asNonEmptyString(user.firstName) || '',
    lastName: asNonEmptyString(user.lastName) || '',
    serviceRole: asNonEmptyString(user.serviceRole) || '',
    serviceRoleId:
      typeof user.serviceRoleId === 'number' ? user.serviceRoleId : undefined,
    email:
      asNonEmptyString(user.email) || asNonEmptyString(user.contactEmail) || '',
    organisationName:
      asNonEmptyString(primaryOrganisation.name) ||
      asNonEmptyString(user.organisationName) ||
      '',
    nationId
  }
}

export async function getAccountDetails(userId, { headers, logger } = {}) {
  const baseUrl =
    config.get('services.accountApi.baseUrl') || 'http://localhost:8085'
  const url = new URL(`/api/account/${encodeURIComponent(userId)}`, baseUrl)

  const fetchFn = globalThis.fetch
  if (typeof fetchFn !== 'function') {
    throw new Error('fetch is not available in this runtime')
  }

  logger?.debug?.(
    {
      url: url.toString(),
      hasHeaders: Boolean(headers && typeof headers === 'object')
    },
    'Fetching account details from gateway'
  )

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
