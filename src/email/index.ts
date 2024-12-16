import { ModuleProvider, Modules } from '@medusajs/utils'
import { UnsendEmailService } from './services'

export * from './services'
export * from './types'

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [UnsendEmailService],
})
