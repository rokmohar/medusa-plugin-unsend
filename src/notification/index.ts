import { ModuleProvider, Modules } from '@medusajs/utils'
import { UnsendNotificationService } from './services'

export * from './services'

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [UnsendNotificationService],
})
