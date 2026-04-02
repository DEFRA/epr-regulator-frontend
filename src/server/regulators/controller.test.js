import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#homeController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
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
    expect(result).toEqual(expect.stringContaining('Log out'))
    expect(result).toEqual(expect.stringContaining('href="/logout"'))
    expect(statusCode).toBe(statusCodes.ok)
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
        (typeof location === 'string' && location.includes('oauth2/v2.0/logout'))
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
