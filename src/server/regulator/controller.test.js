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
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/regulator/home'
    })

    expect(result).toEqual(expect.stringContaining('Regulator Dashboard |'))
    expect(result).toEqual(
      expect.stringContaining(
        'This is the regulator page, accessible only to authenticated users.'
      )
    )
    expect(result).toEqual(expect.stringContaining('Log out'))
    expect(result).toEqual(expect.stringContaining('href="/logout"'))
    expect(statusCode).toBe(statusCodes.ok)
  })

  test('Should handle logout', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/logout'
    })

    expect(response.headers.location).toBe('/')
    expect(response.statusCode).toBe(statusCodes.found)
  })
})
