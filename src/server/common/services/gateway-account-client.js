/**
 * Gateway Account API helpers.
 *
 * - Resolves Account user id (GUID) from the session Bell credentials shape.
 * - Maps gateway `GET api/account/{userId}` JSON (Backend `UserDetailsModel`) to the
 *   regulator view model. ASP.NET Core JSON uses camelCase by default (`organisations`).
 * - Fetches account details via `gatewayGetJson`.
 */
import { gatewayGetJson } from './gateway-http-client.js'

function asGuidString(value) {
  if (typeof value !== 'string') return undefined
  const v = value.trim()
  if (!v) return undefined
  const m =
    /^\{?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})}?$/i.exec(
      v
    )
  return m ? m[1] : undefined
}

function trimmed(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/** @param {{ profile?: { oid?: string; sub?: string } } | string | null | undefined} sessionUser */
export function getAccountUserIdFromSessionUser(sessionUser) {
  if (typeof sessionUser === 'string') return asGuidString(sessionUser)
  if (!sessionUser || typeof sessionUser !== 'object') return undefined

  return (
    asGuidString(sessionUser.profile?.oid) ||
    asGuidString(sessionUser.profile?.sub)
  )
}

/**
 * Map Account API DTO (Backend `UserDetailsModel`, camelCase JSON from ASP.NET Core).
 * @param {*} dto
 */
export function mapAccountDetailsDtoToViewModel(dto) {
  const organisations = dto.organisations ?? []
  const primaryOrganisation = organisations[0]

  return {
    firstName: trimmed(dto.firstName),
    lastName: trimmed(dto.lastName),
    serviceRole: trimmed(dto.serviceRole ?? ''),
    serviceRoleId: dto.serviceRoleId,
    email: trimmed(dto.email ?? ''),
    organisationName: trimmed(primaryOrganisation?.name ?? ''),
    nationId: primaryOrganisation?.nationId
  }
}

export async function getAccountDetails(userId, { headers, logger } = {}) {
  const path = `api/account/${encodeURIComponent(userId)}`
  return await gatewayGetJson(path, { headers, logger })
}
