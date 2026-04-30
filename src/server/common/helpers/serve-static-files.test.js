import { vi } from 'vitest'
import { statusCodes } from '../constants/status-codes.js'

describe('#serveStaticFiles', () => {
  let server
  /** @type {{ startServer: () => Promise<any> } | undefined} */
  let startServerImport

  describe('When secure context is disabled', () => {
    beforeAll(async () => {
      // Avoid collisions with any locally running dev server on the default port.
      vi.stubEnv('PORT', '3099')
      startServerImport = await import('./start-server.js')
    })

    beforeEach(async () => {
      server = await startServerImport.startServer()
    })

    afterEach(async () => {
      await server?.stop?.({ timeout: 0 })
      server = undefined
    })

    afterAll(() => {
      vi.unstubAllEnvs()
    })

    test('Should serve favicon as expected', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/favicon.ico'
      })

      expect(statusCode).toBe(statusCodes.noContent)
    })

    test('Should serve assets as expected', async () => {
      // Note npm run build is ran in the postinstall hook in package.json to make sure there is always a file
      // available for this test. Remove as you see fit
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/public/assets/images/govuk-crest.svg'
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
