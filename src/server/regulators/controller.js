import { config } from '../../config/config.js'
import {
  BELL_AZURE_AD_B2C_COOKIE,
  buildB2cLogoutUrl,
  getB2cAuthorityPrefix,
  resolvePostLogoutAbsoluteUri
} from '../auth/azure-ad-b2c.js'
import {
  getAccountDetails,
  getAccountUserIdFromSessionUser,
  mapAccountDetailsDtoToViewModel
} from '../common/services/account-details.js'

/**
 * Regulator page controller.
 */
export const homeController = {
  async handler(request, h) {
    const user = request.yar?.get('user')
    if (!user) {
      return h.redirect('/regulators/signin-oidc')
    }

    let accountDetails
    let accountDetailsError
    const userId = getAccountUserIdFromSessionUser(user)

    if (userId) {
      try {
        const dto = await getAccountDetails(userId)
        accountDetails = mapAccountDetailsDtoToViewModel(dto)
        if (
          !accountDetails ||
          (accountDetails.firstName === '' &&
            accountDetails.lastName === '' &&
            accountDetails.environmentAgency === '' &&
            accountDetails.nation === '' &&
            accountDetails.nationId === undefined &&
            accountDetails.serviceRoleId === undefined)
        ) {
          accountDetails = undefined
          accountDetailsError = 'We could not load your account details.'
        }
      } catch (err) {
        request.logger?.error({ err }, 'Failed to load account details')
        accountDetailsError = 'We could not load your account details.'
      }
    } else {
      accountDetailsError = 'We could not determine your user id.'
    }

    return h.view('regulators/index', {
      pageTitle: 'Regulator Dashboard',
      heading: 'Regulator Dashboard',
      user,
      accountDetails,
      accountDetailsError
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

export const signOutController = {
  handler(request, h) {
    if (request.yar) {
      request.yar.reset()
    }
    h.unstate(BELL_AZURE_AD_B2C_COOKIE)

    const azure = config.get('auth.azureAdB2c')
    const prefix = getB2cAuthorityPrefix(azure)
    const pathOrUrl = azure.postLogoutRedirectPath || '/signed-out'
    const postLogoutUri = resolvePostLogoutAbsoluteUri(
      request,
      pathOrUrl,
      azure
    )

    if (!prefix) {
      return h.redirect('/signed-out')
    }
    return h.redirect(buildB2cLogoutUrl(prefix, postLogoutUri))
  }
}

export const signedOutController = {
  handler(request, h) {
    return h.view('regulators/signed-out', {
      pageTitle: 'Signed out',
      heading: 'Signed out',
      message: 'You have signed out of the Regulator service.'
    })
  }
}
