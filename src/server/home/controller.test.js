import { vi } from 'vitest'

import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#homeController', () => {
  describe('with default config', () => {
    let server

    beforeAll(async () => {
      server = await createServer()
      await server.initialize()
    })

    afterAll(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should render home page without Certificate of Compliance placeholder', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/'
      })

      expect(result).toEqual(expect.stringContaining('Home |'))
      expect(result).toEqual(expect.stringContaining('Regulator Dashboard'))
      expect(result).toEqual(expect.stringContaining('href="/regulators/home"'))
      expect(result).not.toEqual(
        expect.stringContaining('Certificate of Compliance placeholder')
      )
      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('with FEATURE_CERTIFICATE_OF_COMPLIANCE=true', () => {
    let server

    beforeAll(async () => {
      vi.stubEnv('FEATURE_CERTIFICATE_OF_COMPLIANCE', 'true')
      vi.resetModules()
      const { createServer: createFreshServer } = await import('../server.js')
      server = await createFreshServer()
      await server.initialize()
    })

    afterAll(async () => {
      await server.stop({ timeout: 0 })
      vi.unstubAllEnvs()
    })

    test('Should render Certificate of Compliance placeholder', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/'
      })

      expect(result).toEqual(
        expect.stringContaining('Certificate of Compliance placeholder')
      )
      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
