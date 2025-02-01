export { UnsendService } from './modules/unsend/services'
export { UnsendEmailOptions, UnsendEmailTemplate } from './modules/unsend/types'

let resolvedPath = require.resolve('@rokmohar/medusa-plugin-unsend')

if (resolvedPath.endsWith('.js')) {
  resolvedPath = resolvedPath.substring(0, resolvedPath.lastIndexOf('/'))
}

const UNSEND_PROVIDER_PATH = `${resolvedPath}/providers/notification`

export { UNSEND_PROVIDER_PATH }
