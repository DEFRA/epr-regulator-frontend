import { homeController, logoutController } from './controller.js'

export const regulator = {
  plugin: {
    name: 'regulator',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/regulator/home',
          options: {
            auth: 'azure-ad-b2c',
            ...homeController
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
