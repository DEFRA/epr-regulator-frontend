import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { vi } from 'vitest'

describe('#homeController', () => {
  let server
  let originalFetch

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    originalFetch = globalThis.fetch
    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      async json() {
        return {
          firstName: 'Test',
          lastName: 'User',
          environmentAgency: 'Environment Agency',
          nation: 'England'
        }
      }
    }))
    globalThis.fetch = mockFetch
    global.fetch = mockFetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    global.fetch = originalFetch
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response', async () => {
    const signinResponse = await server.inject({
      method: 'GET',
      url: '/regulators/signin-oidc'
    })
    const setCookie = signinResponse.headers['set-cookie'] ?? []
    const sessionCookie = []
      .concat(setCookie)
      .map((c) => c.split(';')[0])
      .join('; ')

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/regulators/home',
      headers: { cookie: sessionCookie }
    })

    expect(result).toEqual(expect.stringContaining('Regulator Dashboard'))
    expect(result).toEqual(
      expect.stringContaining('regulator-home__account-details')
    )
    expect(result).toEqual(expect.stringContaining('Test'))
    expect(result).toEqual(expect.stringContaining('User'))
    expect(result).toEqual(expect.stringContaining('Environment Agency'))
    expect(result).toEqual(expect.stringContaining('England'))
    expect(result).toEqual(expect.stringContaining('Log out'))
    expect(result).toEqual(expect.stringContaining('href="/logout"'))
    expect(statusCode).toBe(statusCodes.ok)

    expect(global.fetch).toHaveBeenCalled()
  })

  test('Should sign out (B2C logout URL or /signed-out)', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/logout'
    })

    expect(response.statusCode).toBe(statusCodes.found)
    const { location } = response.headers
    expect(
      location === '/signed-out' ||
        (typeof location === 'string' &&
          location.includes('oauth2/v2.0/logout'))
    ).toBe(true)
  })

  test('Should render signed-out page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/signed-out'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toEqual(expect.stringContaining('Signed out'))
    expect(result).toEqual(
      expect.stringContaining('You have signed out of the Regulator service.')
    )
  })
})
