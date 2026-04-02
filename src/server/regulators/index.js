import {
  homeController,
  signinOidcController,
  signOutController,
  signedOutController
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
          options: {
            auth: false,
            ...signOutController
          }
        },
        {
          method: 'GET',
          path: '/signed-out',
          options: {
            auth: false,
            ...signedOutController
          }
        }
      ])
    }
  }
}
