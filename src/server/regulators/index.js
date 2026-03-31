import {
  homeController,
  signinOidcController,
  logoutController
} from './controller.js'

export const regulators = {
  plugin: {
    name: 'regulators',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/regulators/home',
          options: {
            auth: false,
            ...homeController
          }
        },
        {
          method: ['GET', 'POST'],
          path: '/regulators/signin-oidc',
          options: {
            auth: 'azure-ad-b2c',
            ...signinOidcController
          }
        },
        {
          method: 'GET',
          path: '/logout',
          ...logoutController
        }
      ])
    }
  }
}
