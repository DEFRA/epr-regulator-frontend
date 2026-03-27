import path from 'path'
import hapi from '@hapi/hapi'
import Scooter from '@hapi/scooter'
import bell from '@hapi/bell'

import { router } from './router.js'
import { config } from '../config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { sessionCache } from './common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { secureContext } from '@defra/hapi-secure-context'
import { contentSecurityPolicy } from './common/helpers/content-security-policy.js'
import { metrics } from '@defra/cdp-metrics'

export async function createServer() {
  setupProxy()
  const server = hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false
    }
  })
  await server.register([
    bell,
    requestLogger,
    requestTracing,
    metrics,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    Scooter,
    contentSecurityPolicy
  ])

  const azureAdB2cConfig = config.get('auth.azureAdB2c')

  if (config.get('isTest')) {
    server.auth.scheme('mock', () => ({
      authenticate: (_request, h) =>
        h.authenticated({ credentials: { user: 'mock-user' } })
    }))
    server.auth.strategy('azure-ad-b2c', 'mock')
  } else {
    server.auth.strategy('azure-ad-b2c', 'bell', {
      provider: {
        name: 'azure-ad-b2c',
        protocol: 'oauth2',
        useParamsAuth: true,
        auth:
          azureAdB2cConfig.instance && azureAdB2cConfig.domain
            ? `${azureAdB2cConfig.instance}/${azureAdB2cConfig.domain}/${azureAdB2cConfig.userFlow}/oauth2/v2.0/authorize`
            : `https://${azureAdB2cConfig.tenantName}.b2clogin.com/${azureAdB2cConfig.tenantName}.onmicrosoft.com/${azureAdB2cConfig.userFlow}/oauth2/v2.0/authorize`,
        token:
          azureAdB2cConfig.instance && azureAdB2cConfig.domain
            ? `${azureAdB2cConfig.instance}/${azureAdB2cConfig.domain}/${azureAdB2cConfig.userFlow}/oauth2/v2.0/token`
            : `https://${azureAdB2cConfig.tenantName}.b2clogin.com/${azureAdB2cConfig.tenantName}.onmicrosoft.com/${azureAdB2cConfig.userFlow}/oauth2/v2.0/token`,
        scope: ['openid', 'offline_access', 'profile']
      },
      password: azureAdB2cConfig.cookiePassword,
      clientId: azureAdB2cConfig.clientId,
      clientSecret: azureAdB2cConfig.clientSecret,
      isSecure: azureAdB2cConfig.isSecure,
      location: azureAdB2cConfig.redirectUri || undefined,
      config: {
        tenant: azureAdB2cConfig.tenantId || azureAdB2cConfig.domain,
        discovery:
          azureAdB2cConfig.instance && azureAdB2cConfig.domain
            ? `${azureAdB2cConfig.instance}/${azureAdB2cConfig.domain}/${azureAdB2cConfig.userFlow}/v2.0/.well-known/openid-configuration`
            : `https://${azureAdB2cConfig.tenantName}.b2clogin.com/${azureAdB2cConfig.tenantName}.onmicrosoft.com/${azureAdB2cConfig.userFlow}/v2.0/.well-known/openid-configuration`
      }
    })
  }

  await server.register([
    router // Register all the controllers/routes defined in src/server/router.js
  ])

  server.ext('onPreResponse', catchAll)

  return server
}
