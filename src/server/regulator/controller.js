/**
 * Regulator page controller.
 */
export const homeController = {
  handler(_request, h) {
    return h.view('regulator/index', {
      pageTitle: 'Regulator Dashboard',
      heading: 'Regulator Dashboard'
    })
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
