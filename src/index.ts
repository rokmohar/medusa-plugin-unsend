import { join } from 'path'

export { UnsendService } from './modules/unsend/services'
export type { UnsendEmailAttachment, UnsendEmailOptions, UnsendEmailTemplate } from './modules/unsend/types'

const UNSEND_PROVIDER_PATH = join(__dirname, 'providers', 'notification')

export { UNSEND_PROVIDER_PATH }
