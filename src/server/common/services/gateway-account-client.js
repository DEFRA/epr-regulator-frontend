/**
 * Gateway Account API helpers.
 *
 * - Extracts a stable Account user id (GUID) from a session user object that
 *   may vary by identity provider/shape.
 * - Maps the Account API user/organisation DTO into a stable view model for the
 *   frontend.
 * - Fetches account details via the gateway using `gatewayGetJson`.
 *
 * Network calls ultimately use the gateway API configuration/auth documented in
 * `gateway-http-client.js`. Callers may pass through request headers and an
 * optional logger for diagnostics.
 */
import { gatewayGetJson } from './gateway-http-client.js'

// Normalise a "maybe object" value: return it if it's a non-null object, otherwise `undefined`.
// (In JS, `typeof null === 'object'`, so we must also guard against null.)
function asObject(value) {
  return value && typeof value === 'object' ? value : undefined
}

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

  const credentials = asObject(sessionUser.credentials)
  const profile =
    asObject(sessionUser.profile) || asObject(credentials?.profile)

  return (
    asGuidString(profile?.oid) ||
    asGuidString(profile?.sub) ||
    asGuidString(profile?.userId) ||
    asGuidString(profile?.id) ||
    asGuidString(credentials?.userId) ||
    asGuidString(credentials?.user) ||
    asGuidString(credentials?.id) ||
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
  const root = asObject(dto) || {}

  const userCandidate = asObject(root.user) || asObject(root.User) || root
  const user = asObject(userCandidate) || {}

  const organisations =
    (Array.isArray(user.organisations) && user.organisations) ||
    (Array.isArray(user.organizations) && user.organizations) ||
    []

  const primaryOrganisation = asObject(organisations[0])

  const orgNationId =
    typeof primaryOrganisation?.nationId === 'number'
      ? primaryOrganisation.nationId
      : undefined
  const userNationId =
    typeof user.nationId === 'number' ? user.nationId : undefined
  const nationId = orgNationId ?? userNationId

  return {
    firstName: asNonEmptyString(user.firstName) || '',
    lastName: asNonEmptyString(user.lastName) || '',
    serviceRole: asNonEmptyString(user.serviceRole) || '',
    serviceRoleId:
      typeof user.serviceRoleId === 'number' ? user.serviceRoleId : undefined,
    email:
      asNonEmptyString(user.email) || asNonEmptyString(user.contactEmail) || '',
    organisationName:
      asNonEmptyString(primaryOrganisation?.name) ||
      asNonEmptyString(user.organisationName) ||
      '',
    nationId
  }
}

export async function getAccountDetails(userId, { headers, logger } = {}) {
  const path = `api/account/${encodeURIComponent(userId)}`
  return await gatewayGetJson(path, { headers, logger })
}
