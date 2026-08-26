import { ModuleProvider, Modules } from '@medusajs/framework/utils'
import { UnsendNotificationService } from './services'

export * from './services'

export default ModuleProvider(Modules.NOTIFICATION, {
  services: [UnsendNotificationService],
})
