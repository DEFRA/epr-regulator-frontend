/**
 * Regulator page controller.
 */
export const homeController = {
  handler(request, h) {
    const user = request.yar?.get('user')
    if (!user) {
      return h.redirect('/regulators/signin-oidc')
    }
    return h.view('regulators/index', {
      pageTitle: 'Regulator Dashboard',
      heading: 'Regulator Dashboard',
      user
    })
  }
}

export const signinOidcController = {
  handler(request, h) {
    if (request.auth?.credentials) {
      request.yar.set('user', request.auth.credentials)
    }
    return h.redirect('/regulators/home')
  }
}

export const logoutController = {
  handler(request, h) {
    if (request.yar) {
      request.yar.reset()
    }
    return h.redirect('/')
  }
}
